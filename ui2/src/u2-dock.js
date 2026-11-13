/* 리드나우 2 — 옛 화면(등록·출고 등)과 새 웹앱 페이지 동시에 쓰기 (정범님 11/05 15시 "동시에 사용할 수는 없어?")
 * 한계(정확히): 지금 웹앱은 상세 화면을 '#sheet' 한 층 하나에만 그림(S.detail 하나 · 열면 앞 화면을 바꿔 그림)
 *   → 옛 화면은 한 번에 하나만(등록 화면을 연 채 출고를 열면 등록 화면이 출고로 바뀜 — 지금 웹앱과 같음)
 *   → 그 하나 + 새 웹앱 페이지(옛 탭·위젯)는 함께 씀: 이 파일이 그 층을 '나란히 창'·'화면 위젯 칸'으로 옮겨 둠
 * 자리 세 가지(기기마다 · ☰ 메뉴 '🪟 옛 화면'):
 *   ① 오른쪽 나란히(넓은 화면 기본 · 폭 끌어 조절 · 기억) ② 전체(머리 아래를 덮음 · 페이지를 바꾸면 접힘) ③ 페이지 안 '🪟 옛 화면 자리' 위젯(T4 페이지로 박기 — 있으면 늘 그 칸)
 * 페이지 바꿀 때: 두기(기본) / 닫기(0.3.1까지의 모습) · 좁은 화면(휴대폰)은 나란히 둘 자리가 없어 '전체'로 — 페이지를 바꾸면 접히고 아래 단추로 다시 펼침
 * 지금 웹앱 파일은 그대로: #sheet의 자리(부모)와 모양(CSS)만 바꾸고, 열고 닫기는 지금 웹앱 함수(closeDetail) 그대로 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const L = U2.legacy;
  const D = (U2.dock = { cell: null, folded: false, moves: 0 });
  const DEF = { keep: 'keep', pos: 'side', w: 0.5 };
  /* 옛 화면에 딸려 지금 웹앱이 body에 바로 붙이는 떠 있는 판(id) — 등록 화면 '👁 살핀 상품 · 💰 매입가 기입' #seenp(1.78.302~ · 1.78.4xx부터 💰 구획이 들어와 커짐)
   * 접으면 함께 숨기고(u2.css) · 위젯 칸 안에 열면 그 칸 오른쪽 아래로 붙임(아래 fitFloats) · 시험은 이 목록을 '옛 화면 몫'으로 봄
   * 지금 웹앱이 새 판을 더하면 여기 id 하나만 더하면 됨 — u2-contract.json 'floats'와 같게(tools/track.js가 판마다 살아 있나 봄) */
  D.FLOATS = ['seenp'];
  D.isFloat = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { if (n.parentElement === document.body) return D.FLOATS.includes(n.id); } return false; };
  D.MIN_W = 900; /* 이 폭 밑은 나란히 둘 자리가 없음(옛 화면 최소 360 + 페이지 최소 480 + 여유) — 근거: 지금 웹앱 휴대폰 꼴 760px · 설정으로 바꿈 */
  D.cfg = () => Object.assign({}, DEF, U2.ls.get('dock', {}) || {});
  D.set = (o) => { U2.ls.set('dock', Object.assign(D.cfg(), o)); D.sync(); };
  D.keep = () => D.cfg().keep !== 'close';
  const sheet = () => document.getElementById('sheet');
  const isOn = () => { const sh = sheet(); return !!(sh && sh.classList.contains('on')); };
  /* 지금 옛 화면 이름(지금 웹앱 화면 목록 PG_SCR의 맞춤 함수 그대로 · 없으면 그 화면 머리 글) */
  D.title = () => {
    let t = '';
    try { const P = L.list('PG_SCR'); const d = typeof S !== 'undefined' ? S.detail : null; if (P && d) { const r = P.find((x) => { try { return typeof x[2] === 'function' && x[2](d); } catch (e) { return false; } }); if (r) t = r[1]; } } catch (e) {}
    if (!t) { const h = sheet() && sheet().querySelector('.sh .t'); if (h) t = h.textContent.trim(); }
    return (t || '옛 화면').replace(/\s+/g, ' ').slice(0, 40);
  };
  /* 지금 어떤 자리인가: cell(위젯 칸) · side(오른쪽 나란히) · full(머리 아래 전체) · classic(닫기 설정 — 0.3.1 그대로) */
  D.mode = () => {
    if (D.cell && D.cell.isConnected) return 'cell';
    const c = D.cfg(); if (c.keep === 'close') return 'classic';
    return c.pos === 'side' && innerWidth >= D.MIN_W ? 'side' : 'full';
  };
  D.width = () => { const c = D.cfg(); const f = Math.max(0.25, Math.min(0.75, +c.w || DEF.w)); return Math.round(Math.max(360, Math.min(innerWidth - 420, innerWidth * f))); };
  /* #sheet을 그 자리로 옮김(스크롤 자리 지킴) — 위젯 칸이 없으면 본래 자리(#app 안 #modal 앞) */
  D.place = () => {
    const sh = sheet(); if (!sh) return;
    const tgt = D.mode() === 'cell' ? D.cell.querySelector('.u2-dockhost') : document.getElementById('app');
    if (!tgt || sh.parentNode === tgt) return;
    const y = sh.scrollTop; const md = document.getElementById('modal');
    if (tgt.id === 'app' && md && md.parentNode === tgt) tgt.insertBefore(sh, md); else tgt.appendChild(sh);
    sh.scrollTop = y; D.moves++;
  };
  let lastW = 0;
  D.sync = () => {
    const sh = sheet(); if (!sh) return;
    D.place();
    const on = isOn(), m = D.mode(), B = document.body.classList;
    if (!on) D.folded = false;
    const fold = on && D.folded && (m === 'side' || m === 'full');
    B.toggle('u2-dside', on && m === 'side' && !fold);
    B.toggle('u2-dfull', on && m === 'full' && !fold);
    B.toggle('u2-dcell', on && m === 'cell');
    B.toggle('u2-dfold', fold);
    B.toggle('u2-dual', on && m !== 'classic'); /* 옛 화면 + 새 웹앱 페이지를 함께 쓰는 중(페이지가 굴러감 · 옛 탭이 미루지 않고 그려짐) */
    const w = m === 'side' && on && !fold ? D.width() : 0;
    document.documentElement.style.setProperty('--u2-dockw', w + 'px');
    D.drawUi(on && (m === 'side' || m === 'full'), m, fold);
    if (w !== lastW) { lastW = w; D.relayout(); }
    D.fitFloats();
  };
  /* 위젯 칸 안에 열었을 때: 옛 화면의 떠 있는 판(#seenp 등)은 화면 오른쪽 아래(칸 밖 — 다른 위젯 위)에 뜨므로, 칸의 보이는 오른쪽 아래로 붙임
   * CSS 변수만 고침(지금 웹앱이 그 판에 적는 자리 글은 그대로 · 끄는 중(.drag)엔 손대지 않음) · 페이지를 굴리면 따라감 */
  D.fitFloats = () => {
    const R = document.documentElement.style;
    if (!(D.mode() === 'cell' && isOn())) { R.removeProperty('--u2-fr'); return; }
    const c = D.cell.getBoundingClientRect();
    const bot = Math.min(c.bottom, innerHeight), right = Math.min(c.right, innerWidth);
    R.setProperty('--u2-fr', Math.max(4, Math.round(innerWidth - right + 8)) + 'px');
    R.setProperty('--u2-fb', Math.max(4, Math.round(innerHeight - bot + 8)) + 'px');
    R.setProperty('--u2-fw', Math.max(160, Math.round(Math.min(right, innerWidth) - Math.max(c.left, 0) - 16)) + 'px');
    R.setProperty('--u2-fh', Math.max(120, Math.round(bot - Math.max(c.top, 0) - 16)) + 'px');
  };
  addEventListener('scroll', () => { if (!D.cell) return; cancelAnimationFrame(D._fr); D._fr = requestAnimationFrame(D.fitFloats); }, { passive: true, capture: true });
  /* 페이지 폭이 바뀌면 격자 폭 단계(24·12·6·4칸)를 다시 고름 */
  D.relayout = () => { clearTimeout(D._rl); D._rl = setTimeout(() => { try { const host = U2.$('#u2-page'); const G = window.U2Grid; if (U2.edit) return U2.edit.refresh(); if (U2.view && host && G && G.bpOf(host.clientWidth).k !== U2.view._bp) U2.render(); } catch (e) {} }, 60); };
  /* 손잡이·작은 단추 줄 */
  D.drawUi = (show, m, fold) => {
    let ui = document.getElementById('u2-dockui');
    if (!show) { if (ui) ui.remove(); return; }
    if (!ui) {
      ui = document.createElement('div'); ui.id = 'u2-dockui'; ui.className = 'u2-dockui';
      ui.innerHTML = '<div class="u2-dockh" role="separator" aria-orientation="vertical" aria-label="옛 화면 폭 — 끌어서 조절 · ←→ 키" tabindex="0" title="끌어서 폭 조절 · 두 번 누르면 반반"></div>'
        + '<div class="u2-dockpill" role="toolbar" aria-label="옛 화면"><span class="u2-docktt"></span><button type="button" class="u2-chip" data-dk="fold"></button><button type="button" class="u2-chip" data-dk="pos"></button><button type="button" class="u2-chip" data-dk="close" title="옛 화면 닫기(지금 웹앱 닫기와 같음)">✕ 닫기</button></div>';
      document.body.appendChild(ui);
      ui.querySelector('[data-dk="fold"]').onclick = () => { D.folded = !D.folded; D.sync(); };
      ui.querySelector('[data-dk="pos"]').onclick = () => { const c = D.cfg(); if (D.mode() === 'full' && innerWidth < D.MIN_W) return U2.toast('화면이 좁아(' + innerWidth + 'px) 나란히 둘 자리가 없음 — ' + D.MIN_W + 'px 넘는 화면에서'); D.set({ pos: c.pos === 'side' ? 'full' : 'side' }); };
      ui.querySelector('[data-dk="close"]').onclick = () => D.close();
      D.bindHandle(ui.querySelector('.u2-dockh'));
    }
    ui.dataset.m = m; ui.classList.toggle('fold', !!fold);
    ui.querySelector('.u2-docktt').textContent = '🪟 ' + D.title();
    ui.querySelector('[data-dk="fold"]').textContent = fold ? '▸ 펼치기' : m === 'side' ? '◂ 접기' : '▾ 접고 페이지 보기';
    const pb = ui.querySelector('[data-dk="pos"]'); pb.textContent = m === 'side' ? '⤢ 전체로' : '◫ 나란히'; pb.hidden = !!fold;
  };
  D.close = () => { try { if (typeof closeDetail === 'function') closeDetail(); else { sheet().classList.remove('on'); document.body.style.overflow = ''; } } catch (e) { console.warn('[u2] 옛 화면 닫기', e); } D.sync(); };
  /* 폭 끌기(마우스·손가락 · 끝나면 기기에 기억) · 키보드 ←→ 5% · 두 번 누르면 반반 */
  D.bindHandle = (h) => {
    let drag = false;
    const at = (x) => { const f = Math.max(0.25, Math.min(0.75, (innerWidth - x) / innerWidth)); document.documentElement.style.setProperty('--u2-dockw', Math.round(Math.max(360, Math.min(innerWidth - 420, innerWidth * f))) + 'px'); return f; };
    let f = null;
    h.addEventListener('pointerdown', (e) => { if (D.mode() !== 'side') return; drag = true; f = null; h.setPointerCapture && h.setPointerCapture(e.pointerId); document.body.classList.add('u2-dockdrag'); e.preventDefault(); });
    h.addEventListener('pointermove', (e) => { if (drag) f = at(e.clientX); });
    const end = () => { if (!drag) return; drag = false; document.body.classList.remove('u2-dockdrag'); if (f != null) D.set({ w: Math.round(f * 1000) / 1000 }); };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('dblclick', () => D.set({ w: 0.5 }));
    h.addEventListener('keydown', (e) => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); e.stopPropagation(); const c = D.cfg(); D.set({ w: Math.max(0.25, Math.min(0.75, (+c.w || 0.5) + (e.key === 'ArrowLeft' ? 0.05 : -0.05))) }); });
  };
  /* 페이지를 바꿀 때(U2.go → L.syncTo): 두기면 옛 화면을 닫지 않음 · 좁은 화면 '전체'면 접어서 새 페이지가 보이게 */
  D.onPage = (fromUser) => { if (!isOn()) return; if (fromUser && D.mode() === 'full') D.folded = true; D.sync(); };
  /* 지금 웹앱은 옛 화면이 열려 있으면 뒤의 탭 다시 그리기를 미룸(사람이 1.5초 안에 누른 것만 그림) — 함께 쓰는 동안은 페이지 옛 탭이 늘 새것이어야 하므로 그때만 '방금 누름'으로 쳐서 그림 */
  D.renderNow = () => document.body.classList.contains('u2-dual');
  addEventListener('resize', () => { clearTimeout(D._rz); D._rz = setTimeout(D.sync, 120); }, { passive: true });
  /* ── T4 '페이지로 박기' — 🪟 옛 화면 자리 위젯: 이 칸이 있는 페이지에서는 옛 화면이 이 칸 안에 열림(한 번에 한 칸) ── */
  D.mountCell = (b, p, ctx) => {
    if (ctx && ctx.edit) { b.classList.add('u2-dockcell'); b.innerHTML = '<div class="u2-dockph"><b>🪟 ' + U2.esc(p.title || '옛 화면 자리') + '</b><span class="u2-sub">보기 모드에서 옛 화면(등록·출고 등)이 이 칸 안에 열림</span></div>'; return () => {}; }
    if (D.cell && D.cell.isConnected && D.cell !== b) { b.innerHTML = '<div class="u2-empty">🪟 이 페이지에 옛 화면 자리가 이미 있음 — 옛 화면은 한 번에 하나(지금 웹앱 한계)</div>'; return () => {}; }
    b.classList.add('u2-lg', 'u2-dockcell');
    const btns = String(p.scrs || 'register,ship').split(/[,\s]+/).filter(Boolean).map((k) => { const r = L.findScreen && L.findScreen(k); return r ? `<button type="button" class="u2-btn" data-scr="${U2.esc(k)}">${U2.esc(r[1])}</button>` : ''; }).join('');
    b.innerHTML = `<div class="u2-dockph"><b>🪟 ${U2.esc(p.title || '옛 화면 자리')}</b><span class="u2-sub">등록·출고 같은 옛 화면을 열면 이 칸 안에 열립니다(한 번에 하나 — 지금 웹앱 한계 · 다른 페이지로 가면 오른쪽 나란히 창으로)</span><div class="u2-row">${btns}</div></div><div class="u2-dockhost"></div>`;
    b.querySelectorAll('[data-scr]').forEach((x) => (x.onclick = () => U2.legacy.screen(x.dataset.scr)));
    D.cell = b; D.sync();
    return () => { if (D.cell === b) { D.cell = null; D.sync(); } };
  };
})();
