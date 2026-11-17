// Reuse the very same posed meshes and renderer as the two main canvases.
export function mountAngleComparison(host, render, paint) {
  const cells = [];
  const angles = [0, 45, 90];
  for (const label of ['출발', '교정']) {
    const row = document.createElement('b');
    row.textContent = label;
    host.append(row);
    for (const yaw of angles) {
      const cell = document.createElement('canvas');
      cell.width = cell.height = 48;
      cell.setAttribute('aria-label', label + ' ' + yaw + '도 48픽셀');
      host.append(cell); cells.push(cell);
    }
  }
  let lastLeft, lastRight, lastFrames, queuedLeft, queuedRight, pending;
  let visibleSubject;
  return {
    update(model, left, right, camera, active) {
      if (visibleSubject !== model.id) {
        visibleSubject = model.id;
        cells.forEach(cell => cell.getContext('2d').clearRect(0, 0, 48, 48));
      }
      if (queuedLeft === left && queuedRight === right) return;
      clearTimeout(pending);
      queuedLeft = null; queuedRight = null;
      if (lastLeft === left && lastRight === right) {
        host.setAttribute('aria-busy', 'false');
        return;
      }
      host.setAttribute('aria-busy', 'true');
      queuedLeft = left; queuedRight = right;
      pending = setTimeout(() => {
        queuedLeft = null; queuedRight = null;
        if (!active()) return;
        const views = angles.map(yaw => ({ ...camera, yaw, pitch: 0, zoom: 1, size: 48 }));
        const before = lastLeft === left ? null : views.map(v => render(model, left, v));
        if (before) { lastFrames = before; before.forEach((frame, i) => paint(cells[i], frame)); }
        if (lastRight !== right) views.forEach((v, i) => {
          if (left === right) {
            paint(cells[3 + i], lastFrames[i]);
          } else paint(cells[3 + i], render(model, right, v));
        });
        lastLeft = left; lastRight = right;
        host.dataset.subject = model.id; host.setAttribute('aria-busy','false');
        host.dataset.render = String(Number(host.dataset.render || 0) + 1);
      }, 100);
    }
  };
}
