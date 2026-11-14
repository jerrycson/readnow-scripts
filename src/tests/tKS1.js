// tKS1 — (4시간 점검 11/14 16:13 · 🪶) 상세(등록 등) 화면 안에서 글자를 칠 때 가려진 뒤 화면을 다시 그리지 않음 · 닫을 때 한 번 · 상세 밖에서 치거나 누르면 예전대로
require('./harness.js')(async (p) => {
  await p.waitForFunction(() => typeof renderMain === 'function' && typeof closeDetail === 'function' && document.getElementById('sheet'), null, { timeout: 60000 });
  const r = await p.evaluate(async () => {
    const out = []; const wait = (ms) => new Promise((res) => setTimeout(res, ms)); const sh = document.getElementById('sheet');
    let n = 0; const N0 = window.renderMainNow; window.renderMainNow = () => { n++; };
    const key = (el) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    S.detail = { reg: false, t: 'tKS1' }; sh.innerHTML = '<input id="tks_in">'; sh.classList.add('on');
    const inp = document.getElementById('tks_in'); key(inp); renderMain(); await wait(120); out.push(['상세 안에서 친 글자 → 뒤 화면 안 그림', n === 0, n]); out.push(['미룸 표시', S._qDirty === true]);
    const q = document.getElementById('q') || (() => { const x = document.createElement('input'); x.id = 'tks_out'; document.body.appendChild(x); return x; })(); const a1 = n; key(q); renderMain(); await wait(120); out.push(['상세 밖(검색 칸)에서 친 글자 → 예전대로 그림', n > a1, n]);
    const a2 = n; key(inp); inp.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); inp.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); renderMain(); await wait(120); out.push(['상세 안에서 누름 → 예전대로 그림', n > a2, n]);
    key(inp); renderMain(); await wait(120); const n1 = n; S._qDirty = true; try { closeDetail(); } catch (e) { out.push(['closeDetail 오류', false, e.message]); } await wait(120); out.push(['닫을 때 한 번 그림', n > n1, n1, n]); const n2 = n;
    S._keyInSh = false; S.detail = null; key(document.body); renderMain(); await wait(120); out.push(['상세 없음 → 예전대로 그림', n > n2, n]);
    window.renderMainNow = N0; return out; });
  let bad = 0; for (const x of r) { const ok = x[1] === true; if (!ok) bad++; console.log((ok ? '  ✓ ' : '  ✗ ') + x.join(' · ')); }
  console.log(bad ? '❌ 실패 ' + bad : '✓ 통과 tKS1');
});
