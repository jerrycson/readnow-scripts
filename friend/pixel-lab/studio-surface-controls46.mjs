const bound = n => Math.max(-100, Math.min(100, Math.round(n)));
const toPercent = n => (n + 100) / 2;
const widthAxes = new Set(['jaw', 'cheek', 'ribWidth', 'breastWidth']);

// Each stroke is a single edit in the owner's existing undo and save history.
export function mountSurfaceControls({ zone, labels, values, preview, commit }) {
  const panel = document.getElementById('surfaceControls');
  const pad = document.getElementById('shapePad');
  const caliper = document.getElementById('widthGauge');
  const widthGroup = document.getElementById('widthGroup');
  const dot = pad.querySelector('i');
  let stroke = null;

  function refresh() {
    const z = zone();
    if (!z) return;
    const text = labels(), v = values();
    if (!Object.hasOwn(v, z.xAxis)) return;
    const x = v[z.xAxis], y = v[z.yAxis];
    panel.querySelector('.padTitle').textContent = z.label + ' · 두 축 교정';
    document.getElementById('padX').textContent = text[z.xAxis] + ' ' + x;
    document.getElementById('padY').textContent = text[z.yAxis] + ' ' + y;
    pad.setAttribute('aria-label', z.label + ' ' + text[z.xAxis] + ' 좌우, ' + text[z.yAxis] + ' 상하');
    dot.style.left = toPercent(x) + '%';
    dot.style.top = (100 - toPercent(y)) + '%';
    widthGroup.hidden = !widthAxes.has(z.xAxis);
    if (!widthGroup.hidden) {
      caliper.style.setProperty('--reach', (5 + toPercent(x) * .43) + '%');
      caliper.setAttribute('aria-valuenow', x);
      caliper.setAttribute('aria-label', text[z.xAxis] + ' 양쪽 폭');
      document.getElementById('widthValue').textContent = text[z.xAxis] + ' ' + x;
    }
    // The form's two number inputs expose every pad value to assistive technology.
  }

  function edit(changes) { preview({ ...values(), ...changes }); }
  function wire(node, widthOnly) {
    function sample(e) {
      const box = node.getBoundingClientRect();
      const u = (e.clientX - box.left) / box.width, v = (e.clientY - box.top) / box.height;
      const z = zone();
      if (widthOnly) edit({ [z.xAxis]: bound((Math.abs(u - .5) - .05) / .43 * 200 - 100) });
      else edit({ [z.xAxis]: bound(u * 200 - 100), [z.yAxis]: bound(100 - v * 200) });
    }
    node.onpointerdown = e => {
      if (e.button !== 0 || stroke || !zone()) return;
      e.preventDefault(); node.focus(); node.setPointerCapture(e.pointerId);
      stroke = { pointer: e.pointerId, node, before: { ...values() } }; sample(e);
    };
    const current = e => stroke?.node === node && e.pointerId === stroke.pointer;
    node.onpointermove = e => { if (current(e)) sample(e); };
    node.onpointerup = e => {
      if (!current(e)) return;
      sample(e); stroke = null; commit();
    };
    node.onlostpointercapture = node.onpointercancel = e => {
      if (!current(e)) return;
      const before = stroke.before; stroke = null; preview(before); commit();
    };
    node.onkeydown = e => {
      const z = zone(); if (!z || stroke) return;
      const v = values(), step = e.shiftKey ? 10 : 1;
      let changes;
      if (e.key === 'Home') changes = widthOnly ? { [z.xAxis]: -100 } : { [z.xAxis]: 0, [z.yAxis]: 0 };
      if (widthOnly && e.key === 'End') changes = { [z.xAxis]: 100 };
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        const key = widthOnly || ['ArrowLeft','ArrowRight'].includes(e.key) ? z.xAxis : z.yAxis;
        changes = { [key]: bound(v[key] + (['ArrowLeft','ArrowDown'].includes(e.key) ? -step : step)) };
      }
      if (changes) { e.preventDefault(); edit(changes); commit(); }
    };
  }
  wire(pad, false); wire(caliper, true);
  document.getElementById('centerPad').onclick = () => {
    const z = zone(); if (!z) return;
    edit({ [z.xAxis]: 0, [z.yAxis]: 0 }); commit();
  };
  return { refresh };
}
