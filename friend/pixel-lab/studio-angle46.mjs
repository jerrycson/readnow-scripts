// 각도 0은 위쪽이고, 화면에서 시계 방향이 양수다. 관절의 실제 도수를 그대로 그린다.
const RAD = Math.PI / 180;
const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 68;
const bounded = (value, min, max) => Math.max(min, Math.min(max, value));

export function snapAngle46(value, min, max, step = 1) {
  if (![value, min, max, step].every(Number.isFinite) || min > max || step <= 0) {
    throw new RangeError('각도와 관절 범위를 확인해 주세요.');
  }
  const inside = bounded(value, min, max);
  const rounded = min + Math.round((inside - min) / step) * step;
  return Number(bounded(rounded, min, max).toFixed(8));
}

export function angleDelta46(previous, current) {
  return ((current - previous + 540) % 360 + 360) % 360 - 180;
}

function jointBounds(range) {
  const min = range.min === '' ? 0 : Number(range.min);
  const max = range.max === '' ? 100 : Number(range.max);
  const step = range.step && range.step !== 'any' ? Number(range.step) : 1;
  return {min, max, step};
}

function pointAt(degrees, radius) {
  return [CENTER + radius * Math.sin(degrees * RAD), CENTER - radius * Math.cos(degrees * RAD)];
}

function draw(canvas, min, max, value) {
  const context = canvas.getContext('2d');
  const scale = canvas.width / SIZE;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, SIZE, SIZE);
  const stroke = (colour, width, from, to) => {
    context.strokeStyle = colour;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.stroke();
  };
  const arc = (from, to, colour, width) => {
    context.strokeStyle = colour;
    context.lineWidth = width;
    context.beginPath();
    context.arc(CENTER, CENTER, RADIUS, (from - 90) * RAD, (to - 90) * RAD);
    context.stroke();
  };
  context.lineCap = 'round';
  arc(0, 360, '#d5dfda', 1);
  arc(min, max, '#a6bab1', 7);
  const interval = max - min > 90 ? 10 : 5;
  for (let tick = Math.ceil(min / interval) * interval; tick <= max; tick += interval) {
    stroke('#64776f', 1, pointAt(tick, RADIUS + 6), pointAt(tick, RADIUS + (tick % 30 === 0 ? 12 : 9)));
  }
  for (const end of [min, max]) {
    stroke('#3a5247', 2, pointAt(end, RADIUS - 5), pointAt(end, RADIUS + 8));
  }
  const zero = bounded(0, min, max);
  if (zero !== value) arc(Math.min(zero, value), Math.max(zero, value), '#18735d', 7);
  context.setLineDash([3, 4]);
  stroke('#7b8d83', 1.25, [CENTER, CENTER], pointAt(zero, RADIUS - 6));
  context.setLineDash([]);
  const tip = pointAt(value, RADIUS);
  stroke('#185944', 2.5, [CENTER, CENTER], tip);
  const dot = (point, radius, colour) => {
    context.fillStyle = colour;
    context.beginPath();
    context.arc(...point, radius, 0, 2 * Math.PI);
    context.fill();
  };
  dot([CENTER, CENTER], 3.5, '#185944');
  dot(tip, 8, '#164f3f');
  dot(tip, 3, '#fff');
}

export function mountAngle46({host, range, number, joint}) {
  if (!host || range?.type !== 'range' || number?.type !== 'number') {
    throw new TypeError('관절 다이얼에 연결할 표시 영역·범위·숫자 입력이 필요합니다.');
  }
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const controller = new win.AbortController();
  const listen = (target, type, handler) => target?.addEventListener(type, handler, {signal: controller.signal});
  const panel = doc.createElement('div');
  panel.className = 'studio-angle46';
  const canvas = doc.createElement('canvas');
  canvas.className = 'studio-angle46-wheel';
  canvas.setAttribute('role', 'slider');
  canvas.tabIndex = 0;
  canvas.width = canvas.height = SIZE * bounded(Math.ceil(win.devicePixelRatio || 1), 1, 3);
  const readout = doc.createElement('div');
  readout.className = 'studio-angle46-readout';
  const valueText = doc.createElement('strong');
  const limits = doc.createElement('span');
  const help = doc.createElement('small');
  help.textContent = '호를 끌어 회전 · 방향키 1칸 · Shift 5칸';
  readout.append(valueText, limits, help);
  panel.append(canvas, readout);
  host.append(panel);
  let drag = null;
  let lastDisplay = '';

  function release() {
    if (!drag) return;
    const id = drag.id;
    drag = null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    panel.classList.remove('studio-angle46-dragging');
  }
  function sync() {
    const {min, max, step} = jointBounds(range);
    const value = snapAngle46(range.valueAsNumber, min, max, step);
    const name = joint?.selectedOptions[0]?.textContent || '관절';
    if (drag && (drag.joint !== joint?.value || drag.min !== min || drag.max !== max || range.disabled)) release();
    const disabled = range.disabled || max <= min;
    if (String(value) !== number.value && doc.activeElement !== number) number.value = String(value);
    number.min = String(min);
    number.max = String(max);
    number.step = String(step);
    const key = [name, min, max, value, disabled].join('|');
    if (key === lastDisplay) return;
    lastDisplay = key;
    canvas.tabIndex = disabled ? -1 : 0;
    canvas.setAttribute('aria-label', name + ' 각도');
    canvas.setAttribute('aria-valuemin', String(min));
    canvas.setAttribute('aria-valuemax', String(max));
    canvas.setAttribute('aria-valuenow', String(value));
    canvas.setAttribute('aria-valuetext', value + '도');
    canvas.setAttribute('aria-disabled', String(disabled));
    valueText.textContent = value + '°';
    limits.textContent = name + ' · ' + min + '° ~ ' + max + '°';
    draw(canvas, min, max, value);
  }
  function setValue(value) {
    if (range.disabled || !Number.isFinite(value)) return false;
    const {min, max, step} = jointBounds(range);
    const result = snapAngle46(value, min, max, step);
    if (result === range.valueAsNumber) return false;
    range.value = String(result);
    number.value = range.value;
    range.dispatchEvent(new win.Event('input', {bubbles:true}));
    sync();
    return true;
  }
  function cursor(event) {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const x = (event.clientX - box.left) / box.width * SIZE - CENTER;
    const y = (event.clientY - box.top) / box.height * SIZE - CENTER;
    return {radius:Math.hypot(x, y), angle:Math.atan2(x, -y) / RAD};
  }
  function pointerDown(event) {
    if (event.button !== 0 || !event.isPrimary || drag || range.disabled) return;
    const p = cursor(event);
    const {min, max} = jointBounds(range);
    if (!p || min === max || Math.abs(p.radius - RADIUS) > 16) return;
    const current = range.valueAsNumber;
    // 손잡이의 비대칭 잡기 위치를 유지한다. 호 바깥을 눌러도 반대 끝으로 이동하지 않는다.
    const onHandle = Math.abs(angleDelta46(current, p.angle)) <= 9;
    const angle = (min + max) / 2 + angleDelta46((min + max) / 2, p.angle);
    if (!onHandle && (angle < min || angle > max)) return;
    event.preventDefault();
    canvas.focus({preventScroll:true});
    canvas.setPointerCapture(event.pointerId);
    drag = {id:event.pointerId, joint:joint?.value, min, max, last:p.angle, value:onHandle ? current : angle};
    panel.classList.add('studio-angle46-dragging');
    if (!onHandle) setValue(angle);
  }
  function pointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const p = cursor(event);
    // 중심에서는 방위각이 정해지지 않는다. 바깥으로 나온 첫 점에서 다시 추적한다.
    if (!p || p.radius < 22) {drag.last = null;return;}
    if (drag.last !== null) {
      drag.value = bounded(drag.value + angleDelta46(drag.last, p.angle), drag.min, drag.max);
      drag.last = p.angle;
      setValue(drag.value);
    } else drag.last = p.angle;
  }
  function keyDown(event) {
    if (range.disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const {min, max, step} = jointBounds(range);
    const value = range.valueAsNumber;
    const small = step * (event.shiftKey ? 5 : 1);
    const values = {ArrowRight:value+small, ArrowUp:value+small, ArrowLeft:value-small, ArrowDown:value-small,
      PageUp:value+step*10, PageDown:value-step*10, Home:min, End:max};
    if (!Object.hasOwn(values, event.key)) return;
    event.preventDefault();
    setValue(values[event.key]);
  }
  function commitNumber() {
    if (!range.disabled && number.value !== '' && Number.isFinite(number.valueAsNumber)) setValue(number.valueAsNumber);
    number.value = range.value;
    sync();
  }
  listen(canvas, 'pointerdown', pointerDown);
  listen(canvas, 'pointermove', pointerMove);
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    listen(canvas, type, event => {if (drag?.id === event.pointerId) release();});
  }
  listen(canvas, 'keydown', keyDown);
  listen(range, 'input', sync);
  listen(range, 'change', sync);
  listen(number, 'input', () => {
    if (number.value !== '' && number.validity.valid) setValue(number.valueAsNumber);
  });
  listen(number, 'change', commitNumber);
  listen(number, 'keydown', event => {if (event.key === 'Enter') commitNumber();});
  listen(joint, 'change', sync);
  sync();
  return {sync, setValue, destroy(){release();controller.abort();panel.remove();}};
}
