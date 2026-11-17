const svgNamespace = 'http://www.w3.org/2000/svg';
const byId = id => document.getElementById(id);
const fields = ['upper', 'lower', 'brow'];
const layers = [['trace38', '#007b8c'], ['prior38', '#79549b'], ['next38', '#b34419']];
const paperSource = 'https://doi.org/10.1007/s00266-021-02753-y';
const paperLicense = 'https://creativecommons.org/licenses/by/4.0/';

function svg(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function officialLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function faceSource(view, record) {
  const url = officialLink(view?.sourceUrl);
  if (!url || !/\.(?:jpg|jpeg|png|webp)$/i.test(url.pathname)) return null;
  // 40차 설정화 원본 크기는 atlas35의 같은 JPG 레코드에 있다.
  const setting = record?.views?.find(item => item.url === url.href);
  const [width, height] = view.sourceSize || [setting?.width, setting?.height];
  const crop = view.crop || {x: 0, y: 0, width, height};
  if (![width, height, crop.width, crop.height].every(v => Number.isFinite(v) && v > 0)
      || ![crop.x, crop.y].every(Number.isFinite)) return null;
  const sx = 248 / crop.width, sy = 248 / crop.height;
  return {url: url.href, width, height, bounds: [-crop.x * sx, -crop.y * sy, width * sx, height * sy]};
}

function chestSource(cell) {
  if (!cell?.size || !cell.box) return null;
  const [x, y, r, b] = cell.box, [w, h] = cell.size;
  // Wallner 그림 1(2007×1143)의 왼쪽 1137열을 잘라 저장한 기존 35차 WebP.
  if (r - x !== w || b - y !== h || x < 0 || y < 0 || r > 1137 || b > 1143) return null;
  return {url: 'wallner-fig1-crop35.webp', width: 1137, height: 1143, bounds: [-x, -y, 1137, 1143]};
}

function pairedFace(id, mode, hair, view, extra) {
  if (id === 'F02') {
    return {curves: [view.visible40, view.visible40], labels: ['40차 기준', '같은 40차 기준'],
      description: '페른은 양쪽 모두 40차 형상과 해당 가시 경계를 사용합니다. 홍채 색을 바꿔도 두 눈의 가시 경계는 같습니다.'};
  }
  const prefix = hair ? 'masked' : 'visible';
  const fixed = view[prefix + '39'], old = view.priorCamera ? extra?.[prefix + 'Old39'] : fixed;
  const oldLabel = view.priorCamera ? '39형상·기존 구도' : '39형상·41 구도';
  const currentLabel = '39형상·41 구도';
  const explanation = view.priorCamera ? '' : '이 장면은 41차에 처음 등록해 두 기본형에 같은 구도를 씁니다. ';
  switch (mode) {
    case 'neutral':
      return {curves: [old, old], labels: [oldLabel, oldLabel], scores: [view.oldCam39 || view.before, view.oldCam39 || view.before], description: explanation};
    case 'camera':
      return {curves: [old, fixed], labels: [oldLabel, currentLabel], scores: [view.oldCam39 || view.before, view.before], description: explanation};
    case 'shape':
      return {curves: [fixed, view[prefix + '41']], labels: [currentLabel, '41 초기형상·41 구도'], scores: [view.before, view.after], description: ''};
    case 'contact':
      return {curves: [fixed, extra?.[prefix + 'Contact']], labels: [currentLabel, '41 접촉 후 형상·41 구도'], scores: [view.before, view.afterContact],
        description: '새 장면 두 장을 본 뒤 바꾼 후속 형상입니다. '};
    default:
      return {curves: [], labels: ['기준', '후보'], description: '이 비교 방식에는 등록된 투영이 없습니다. '};
  }
}

function polyline(group, points, color, dash) {
  group.append(svg('polyline', {points: points.map(p => p.join(',')).join(' '), fill: 'none', stroke: color,
    'stroke-width': 1.35, 'stroke-dasharray': dash, 'vector-effect': 'non-scaling-stroke'}));
}

function eyeLayer(group, eyes, view, color, observed, radius, dash) {
  eyes.forEach((eye, index) => {
    if (!eye) return;
    const side = svg('g', {'data-eye': index, 'data-depth': index === view.nearEyeIndex ? 'near' : index === view.farEyeIndex ? 'far' : 'unspecified'});
    for (const field of fields) {
      const samples = eye[field] || [];
      if (observed) {
        // 손 표식 사이에 원화에서 읽지 않은 눈꺼풀 선을 보간하지 않는다.
        for (const [x, y] of samples) side.append(svg('circle', {cx: x, cy: y, r: radius, fill: color, 'data-feature': field}));
      } else {
        // 40·41차 래스터는 화면 열마다 반 화소 중심 하나씩 기록했다.
        let start = 0;
        for (let i = 1; i <= samples.length; i++) {
          if (i < samples.length && samples[i][0] - samples[i - 1][0] <= 1.05) continue;
          const run = samples.slice(start, i);
          if (run.length === 1) side.append(svg('circle', {cx: run[0][0], cy: run[0][1], r: radius * .55, fill: color}));
          else polyline(side, run, color, dash);
          start = i;
        }
      }
    }
    group.append(side);
  });
}

function lowest(lines) {
  let result;
  for (const line of lines || []) for (const p of line) if (!result || p[1] > result[1]) result = p;
  return result;
}

function focusBox(points, pad, size) {
  if (!points?.length) return null;
  const x = points.map(p => p[0]), y = points.map(p => p[1]);
  const l = Math.max(0, Math.floor(Math.min(...x) - pad)), t = Math.max(0, Math.floor(Math.min(...y) - pad));
  return [l, t, Math.min(size[0], Math.ceil(Math.max(...x) + pad)) - l, Math.min(size[1], Math.ceil(Math.max(...y) + pad)) - t];
}

function metricText(scores, hair) {
  if (!scores?.every(s => s?.errors)) return '';
  const key = hair ? 'center' : 'rawCenter';
  const pairs = [0, 1].flatMap(i => {
    const values = scores.map(s => s.errors[i]?.[key]);
    return values.every(Number.isFinite) ? [(i === 0 ? '화면 왼눈 ' : '화면 오른눈 ') + values.map(v => v.toFixed(2)).join(' → ') + 'px'] : [];
  });
  return pairs.length ? '원화 눈 중심과의 거리 · ' + pairs.join(', ') + '. ' : '';
}

export function referencePlate41() {
  const plate = byId('overlay38'), info = byId('sourceInfo38'), credit = byId('credit38');
  const controls = document.createElement('div'), status = document.createElement('p'), rights = document.createElement('p');
  controls.className = 'controls38';
  controls.setAttribute('aria-label', '원전 확대');
  controls.setAttribute('role', 'group');
  plate.before(controls);
  info.after(status);
  status.setAttribute('role', 'status');
  rights.className = 'small38';
  const oldNote = credit.parentElement?.querySelector('.small38');
  if (oldNote) oldNote.replaceWith(rights); else credit.after(rights);
  plate.setAttribute('aria-label', '원본의 관측 표식과 선택한 두 모델의 등록된 가시 경계');
  plate.style.imageRendering = 'pixelated';
  const focusOptions = [['all', '전체 구획'], ['left', '화면 왼눈'], ['right', '화면 오른눈'], ['near', '가까운 눈'], ['far', '먼 눈'], ['bottom', '관측 밑선 최저점']];
  let focus = 'all', last, curves, pending, failed = false, generation = 0;
  const probes = new Map();
  for (const [key, title] of focusOptions) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.focus = key; button.textContent = title;
    button.onclick = () => { focus = key; if (last) draw(last); };
    controls.append(button);
  }

  function requestCurves() {
    if (curves || pending) return;
    pending = fetch(new URL('./reference-curves41.json', import.meta.url)).then(response => {
      if (!response.ok) throw Error();
      return response.json();
    }).then(data => { curves = data; failed = false; }, () => { failed = true; })
      .finally(() => { pending = null; if (last?.context.id === 'M01') draw(last); });
  }

  function plotSource(source, root, epoch) {
    if (!byId('photo38').checked) { status.textContent = '원본 그림 표시를 껐습니다.'; return; }
    if (!source) { status.textContent = '등록한 원본 그림이나 크기 자료가 없습니다.'; return; }
    status.textContent = '원본 그림을 읽는 중입니다.';
    if (!probes.has(source.url)) {
      const probe = new Image();
      probes.set(source.url, new Promise(resolve => {
        probe.onload = () => resolve([probe.naturalWidth, probe.naturalHeight]);
        probe.onerror = () => { probes.delete(source.url); resolve(null); };
        probe.src = source.url;
      }));
    }
    probes.get(source.url).then(dim => {
      if (generation !== epoch) return;
      if (!dim) { status.textContent = '원본 그림을 읽지 못했습니다. 아래 원전 링크에서 확인할 수 있습니다.'; return; }
      if (dim[0] !== source.width || dim[1] !== source.height) {
        status.textContent = '읽은 원본 크기와 정합할 때의 크기가 달라 그림을 겹칠 수 없습니다.'; return;
      }
      const [x, y, width, height] = source.bounds;
      const image = svg('image', {href: source.url, x, y, width, height, preserveAspectRatio: 'none', opacity: Number(byId('opacity38').value) / 100});
      image.addEventListener('error', () => { if (generation === epoch) status.textContent = '그림을 표시하지 못했습니다. 아래 원전을 확인해 주세요.'; });
      // 도판과 음수 시작 좌표의 장면도 원본 좌표 그대로 놓고 바깥만 잘라낸다.
      root.prepend(image);
      status.textContent = '';
    });
  }

  function draw(args) {
    const {context, view, chest, choice, mode, hair} = args;
    last = args;
    const epoch = ++generation, face = context.id !== 'W', cell = context.ref?.paper?.[context.cell];
    const size = face ? [248, 248] : cell?.size;
    const paper = chest?.paper?.[context.cell], candidate = chest?.candidates?.[choice];
    const pair = face && view ? pairedFace(context.id, mode, hair, view, curves?.[view.key]) : null;
    const sets = face ? [view?.sourceEyes, ...(pair?.curves || [])] : [cell?.lines, paper?.before?.lines, candidate?.paper?.[context.cell]?.lines];
    const labels = face ? pair?.labels || ['기준', '후보'] : ['40차 기준', '41차 ' + (candidate?.label || '후보')];
    const needsExtra = context.id === 'M01' && view && (mode === 'contact' || view.priorCamera && (mode === 'neutral' || mode === 'camera'));
    if (needsExtra && !failed) requestCurves();
    const creditUrl = officialLink(face ? view?.sourcePage || context.record?.source : paperSource);
    if (creditUrl) credit.href = creditUrl.href; else credit.removeAttribute('href');
    credit.hidden = !creditUrl;
    rights.replaceChildren();
    if (face) {
      rights.textContent = '『장송의 프리렌』 애니메이션 공식 원화 · © 山田鐘人・アベツカサ／小学館／「葬送のフリーレン」製作委員会. 원화는 공식 서버에서 표시합니다.';
    } else {
      const license = document.createElement('a');
      license.href = paperLicense; license.textContent = 'CC BY 4.0';
      rights.append('Wallner 등, 그림 1. 기존 저장 도판의 해당 구획과 파생 관측선을 표시합니다. ', license);
    }
    const full = size && [0, 0, ...size], boxes = {all: full};
    if (face && view) {
      for (const [key, i] of Object.entries({left: 0, right: 1, near: view.nearEyeIndex, far: view.farEyeIndex})) {
        const eye = view.sourceEyes?.[i];
        if (eye) boxes[key] = focusBox(fields.flatMap(f => eye[f] || []), 8, size);
      }
    } else if (size) {
      const p = lowest(sets[0]);
      if (p) boxes.bottom = focusBox([p], 22, size);
    }
    if (!boxes[focus]) focus = 'all';
    for (const b of controls.children) {
      b.hidden = face ? b.dataset.focus === 'bottom' : !['all', 'bottom'].includes(b.dataset.focus);
      b.disabled = !boxes[b.dataset.focus];
      b.setAttribute('aria-pressed', String(b.dataset.focus === focus));
    }
    for (const [i, [id]] of layers.entries()) {
      const toggle = byId(id);
      toggle.disabled = !sets[i];
      const caption = i ? labels[i - 1] : face ? '원화 손 표식' : '도판 관측선';
      if (toggle.nextSibling?.nodeType === Node.TEXT_NODE) toggle.nextSibling.nodeValue = caption;
      else toggle.after(document.createTextNode(caption));
    }
    plate.replaceChildren();
    if (!size) { info.textContent = '이 구획에는 등록된 크기와 측정 좌표가 없습니다.'; status.textContent = ''; return; }
    const box = boxes[focus];
    plate.setAttribute('viewBox', box.join(' '));
    const rect = plate.getBoundingClientRect();
    const radius = 2.2 / Math.max(.1, Math.min(rect.width / box[2], rect.height / box[3]));
    const root = svg('svg', {x: 0, y: 0, width: size[0], height: size[1], overflow: 'hidden'});
    plate.append(root);
    plotSource(face ? faceSource(view, context.record) : chestSource(cell), root, epoch);
    for (const [i, [id, color]] of layers.entries()) {
      if (!sets[i] || !byId(id).checked) continue;
      const group = svg('g', {'data-layer': id}), dash = i === 1 ? '3 2' : '';
      if (face) eyeLayer(group, sets[i], view, color, i === 0, radius, dash);
      else {
        for (const line of sets[i]) if (line.length > 1) polyline(group, line, color, dash);
        const p = lowest(sets[i]);
        if (p) group.append(svg('circle', {cx: p[0], cy: p[1], r: radius * 1.6, fill: 'white', stroke: color, 'stroke-width': 1.3, 'vector-effect': 'non-scaling-stroke'}));
      }
      root.append(group);
    }
    if (face && view) {
      info.textContent = (view.key || '페른 설정 ' + view.imageNumber) + ' · ' + view.role + '. ' + pair.description
        + (context.id === 'M01' ? (hair ? '원화 앞머리 가림을 적용한 모델 경계. ' : '모델의 깊이만 적용한 눈 경계. ') : '')
        + metricText(pair.scores, hair) + (view.omitted || '')
        + (view.crop && (view.crop.y < 0 || view.crop.y + view.crop.height > view.sourceSize[1]) ? ' 등록 구획이 원본 높이를 벗어난 부분은 비워 두었습니다.' : '')
        + (needsExtra && !curves ? failed ? ' 추가 투영 좌표를 읽지 못했습니다.' : ' 추가 투영 좌표를 읽는 중입니다.' : '');
    } else if (face) info.textContent = '이 원화에 등록한 손 표식과 가시선 자료가 없습니다.';
    else info.textContent = context.cell + ' · 팔 0°에서 등록한 도판 구획입니다. 흰 원은 각 선의 최저 표본입니다. '
      + (context.cell === 'B3' ? '몸통 위에 그려진 명암 경계와 삼각형의 가시 밑선을 비교합니다. ' : '')
      + (sets[1] && sets[2] ? labels.join(' → ') : '선택한 모델의 등록 투영 좌표가 없습니다.');
  }
  return {draw};
}
