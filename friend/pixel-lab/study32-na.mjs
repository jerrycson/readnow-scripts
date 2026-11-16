import {cross, norm} from './geometry.mjs';
import {profileStudy} from './profile31.mjs';

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const bell = (x, at, radius) => Math.exp(-(((x - at) / radius) ** 2));
const mix = (a, b, t) => a + (b - a) * t;
const cache = new WeakMap();

function sculpt([x, h, z]) {
  const side = Math.abs(x);
  const face = clamp((z + .08) / .29);
  const mask = face * face * (3 - 2 * face);
  const socket = bell(side, .228, .160) * bell(h, .431, .083);
  const brow = bell(side, .197, .137) * bell(h, .521, .061);
  const cheek = bell(side, .259, .144) * bell(h, .312, .083);
  const nasion = bell(x, 0, .089) * bell(h, .450, .051);
  const bridgeWidth = .034 + .026 * clamp((.45 - h) / .16);
  const bridge = bell(x, 0, bridgeWidth) * bell(h, .363, .077);
  const tip = bell(x, 0, .066) * bell(h, .295, .036);
  const ala = bell(side, .050, .031) * bell(h, .280, .021);
  const muzzle = bell(x, 0, .154) * bell(h, .206, .078);
  const chin = bell(x, 0, .185) * bell(h, .070, .090);
  const fold = bell(x, 0, .102) * bell(h, .139, .024);
  const relief = -.053 * socket + .015 * brow + .024 * cheek - .010 * nasion
    + .032 * bridge + .008 * tip + .008 * ala + .014 * muzzle + .047 * chin - .006 * fold;
  const jaw = bell(h, .142, .120);
  return [x * (1 - .055 * jaw), h, z + .038 * bell(h, 0, .117) + mask * relief];
}

// 변형의 여인자 행렬을 법선에 적용해 새로 생긴 볼륨에 빛이 맞도록 한다.
function reshape(mesh, chin, transform) {
  const e = .0003;
  const vertices = mesh.vertices.map(({p, n, ...rest}) => {
    const local = [p[0], p[1] - chin, p[2]], q = transform(local);
    const J = [0, 1, 2].map(axis => {
      const a = [...local], b = [...local];
      a[axis] += e;
      b[axis] -= e;
      const A = transform(a), B = transform(b);
      return A.map((v, k) => (v - B[k]) / (2 * e));
    });
    const bases = [cross(J[1], J[2]), cross(J[2], J[0]), cross(J[0], J[1])];
    const normal = norm([0, 1, 2].map(k => bases.reduce((v, b, j) => v + b[k] * n[j], 0)));
    return {...rest, p: [q[0], chin + q[1], q[2]], n: normal};
  });
  return {...mesh, vertices};
}

// 원래 머리의 각 가로 단면에서 코와 관자놀이 사이의 앞면 깊이를 읽는다.
function faceSurface(head) {
  const vertices = head.vertices;
  const stride = vertices.findIndex(v => v.p[1] > vertices[0].p[1] + .00001);
  const meridian = (stride - 1) / 4;
  const last = vertices.length / stride - 1;
  function inRow(row, x) {
    const offset = row * stride;
    let left = 0, right = meridian;
    while (right - left > 1) {
      const mid = (left + right) >> 1;
      if (vertices[offset + mid].p[0] > x) left = mid;
      else right = mid;
    }
    const a = vertices[offset + left].p, b = vertices[offset + right].p;
    return mix(b[2], a[2], clamp((x - b[0]) / (a[0] - b[0] || 1)));
  }
  return (x, h) => {
    const r = clamp(h) * last, j = Math.min(last - 1, Math.floor(r));
    return mix(inRow(j, Math.abs(x)), inRow(j + 1, Math.abs(x)), r - j);
  };
}

function surfaceVertex(x, h, chin, depth) {
  const e = .002;
  return {
    p: [x, h + chin, depth(x, h)],
    n: norm([depth(x - e, h) - depth(x + e, h), depth(x, h - e) - depth(x, h + e), 2 * e])
  };
}

// 흰자·홍채·동공·반사광 경계에서 같은 꼭짓점을 공유한다.
function surfaceStrip(parts, name, cols, rows, vertex, material, side = 1) {
  const vertices = [], groups = new Map();
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) vertices.push(vertex(2 * i / cols - 1, j / rows));
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * (rows + 1) + j, b = a + rows + 1;
      for (const triangle of [[a, b, a + 1], [a + 1, b, b + 1]]) {
        const x = triangle.reduce((sum, k) => sum + vertices[k].p[0] / 3, 0);
        const y = triangle.reduce((sum, k) => sum + vertices[k].p[1] / 3, 0);
        const mat = material(x, y);
        if (!groups.has(mat)) groups.set(mat, []);
        groups.get(mat).push(side < 0 ? triangle.reverse() : triangle);
      }
    }
  }
  for (const [mat, faces] of groups) parts.push({name: name + '-' + mat, mat, vertices, faces});
}

function eye(parts, front, chin, side, female) {
  const center = .207, radius = .144, level = .411;
  function edges(u) {
    const arch = Math.max(0, 1 - u * u) ** .77;
    const axis = level + .014 * u;
    return [
      axis - .068 * arch * (1 + .16 * u),
      axis + (female ? .084 : .075) * arch * (1 - .22 * u)
    ];
  }
  function cornea(x, h) {
    const u = clamp((side * x - center) / radius, -1, 1);
    const [lower, upper] = edges(u);
    const v = clamp((h - lower) / Math.max(.0001, upper - lower));
    return front(x, h) + .004 + .041 * (1 - u * u) * (4 * v * (1 - v));
  }
  function color(x, y) {
    const dx = side * x - (center - .007);
    const dy = y - chin - level - .012;
    if ((dx / .074) ** 2 + (dy / .084) ** 2 > 1) return 'portrait-sclera';
    const glintX = dx + side * .022, glintY = dy - .025;
    if ((glintX / .019) ** 2 + (glintY / .022) ** 2 < 1) return 'portrait-sclera';
    if ((dx / .036) ** 2 + (dy / .054) ** 2 < 1) return 'portrait-pupil';
    return 'portrait-iris';
  }
  surfaceStrip(parts, 'eye', 46, 24, (u, v) => {
    const [a, b] = edges(u), x = side * (center + radius * u);
    return surfaceVertex(x, mix(a, b, v), chin, cornea);
  }, color, side);

  // 윗눈꺼풀이 각막 위를 감싸며 눈물점 쪽에서 가늘어진다.
  const faceLayer = (x, h) => front(x, h) + .007;
  surfaceStrip(parts, 'upper-eyelid', 48, 2, (u, v) => {
    const taper = Math.max(0, 1 - u * u) ** .40;
    const x = side * (center + radius * u);
    const h = edges(u)[1] + taper * ((female ? .023 : .020) * (1 + .44 * u) * v - .003);
    return surfaceVertex(x, h, chin, faceLayer);
  }, () => 'face-ink', side);

  // 눈썹은 관자놀이 쪽으로 돌아 들어가며 미간 쪽에 더 두께를 둔다.
  surfaceStrip(parts, 'brow', 32, 2, (u, v) => {
    const x = side * (center + .117 * u);
    const thickness = (female ? .022 : .028) * (.84 - .29 * u) * Math.max(0, 1 - u * u) ** .27;
    const h = .558 + .017 * (1 - (u - .16) ** 2) - .003 * u + (v - .5) * thickness;
    return surfaceVertex(x, h, chin, faceLayer);
  }, () => 'face-ink', side);
}

function mouth(parts, front, chin) {
  const width = .100;
  const seam = u => .205 + .021 * u * u - .002 * bell(u, 0, .23);
  const fullness = u => Math.max(0, 1 - u * u);
  const upper = u => fullness(u) * (.017 + .010 * bell(Math.abs(u), .30, .17));
  const lower = u => fullness(u) * .022;
  const surface = (x, h) => {
    const u = clamp(x / width, -1, 1), dh = h - seam(u);
    return front(x, h) + .003 + fullness(u) *
      (.013 * bell(dh, .013, .011) + .011 * bell(dh, -.012, .013));
  };
  surfaceStrip(parts, 'upper-lip', 42, 5, (u, v) =>
    surfaceVertex(u * width, seam(u) + v * upper(u), chin, surface), () => 'study-upper-lip');
  surfaceStrip(parts, 'lower-lip', 42, 5, (u, v) =>
    surfaceVertex(u * width, seam(u) - (1 - v) * lower(u), chin, surface), () => 'study-lower-lip');
  surfaceStrip(parts, 'lip-aperture', 42, 2, (u, v) => {
    const x = u * width, h = seam(u) + (v - .45) * .013 * fullness(u) ** .46;
    return surfaceVertex(x, h, chin, (px, py) => surface(px, py) + .002);
  }, () => 'face-ink');
}

function attachEar([x, h, z]) {
  const side = Math.sign(x), base = h - .441;
  const inward = .031 + .026 * bell(h, .334, .070);
  return [x - side * inward, .425 + base * .91, -.035 + 1.10 * (z - .008) - .22 * base];
}

export function improveProfile(settings) {
  const source = profileStudy(settings, 'C');
  if (cache.has(source)) return cache.get(source);
  const chin = source.landmarks.chin[1], parts = [];
  const head = reshape(source.parts.find(part => part.name === 'chibi-skull-cheek-jaw'), chin, sculpt);
  const replaced = new Set([
    'chibi-almond-eye-sclera', 'chibi-almond-eye-iris', 'chibi-almond-eye-face-ink',
    'chibi-simple-eye', 'chibi-glint', 'chibi-upper-lid', 'chibi-brow', 'chibi-smile'
  ]);
  for (const part of source.parts) {
    if (part.name === head.name) parts.push(head);
    else if (part.name.startsWith('ear-')) parts.push(reshape(part, chin, attachEar));
    else if (!replaced.has(part.name)) parts.push(part);
  }
  const front = faceSurface(head);
  for (const side of [-1, 1]) eye(parts, front, chin, side, settings.sex === 'female');
  mouth(parts, front, chin);
  const result = {...source, parts};
  cache.set(source, result);
  return result;
}
