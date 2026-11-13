/* 리드나우 2 — 편집기 (설계안 5-2 · 단계 3)
 * 편집 모드 · 위젯 서랍(찾기 · / 빠른 넣기 ★) · 속성판(내용·모양·자리) · 층 나무 ★ · 여럿 맞추기 ★
 * 끌어 옮기기 · 손잡이 8개로 크기 · 겹치면 아래로 밂 · 휴대폰은 길게 눌러 끌기 · 키보드: 화살표 옮김(Shift = 4칸) · Ctrl+화살표 크기 · Delete 지움
 * 실행 취소/다시: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y도) · 100걸음 · 편집기가 켜져 있고 글 칸 밖일 때만(옛 화면 단축키와 안 부딪침)
 * 무엇을 고치나(정범님 Q4·Q5): '🌐 모든 기기 공용'(관리자 기기만 게시) · '📱 이 기기만'(누구나 · ui2_prefs) — 한 편집기에서 위 단추로 고름
 * 초안은 늘 이 기기에(rn2-draft) · 게시 = 두 번 누르기(바뀐 것 목록 보임) → ui2_pages + ui2_versions(되돌리기용 한 판) · 게시 기록에서 아무 판으로 되돌림(그것도 한 판으로 남음) */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const G = window.U2Grid, W = window.U2W, esc = (s) => U2.esc(s);
  const CANVAS = { pc: '', tab: '900px', sm: '600px', phone: '360px' };
  const snapOf = (d) => JSON.stringify({ title: d.title, icon: d.icon, grid: d.grid, widgets: d.widgets, layouts: d.layouts });

  function Editor(scope, opt) {
    const E = this; opt = opt || {}; E.scope = scope; E.id = U2.cur;
    const base = scope === 'mine' ? U2.effective(E.id) : U2.pages[E.id] || U2.defaultPage(E.id);
    E.saved = U2.clone(base); E.draft = U2.clone(opt.load || base); E.draft.id = E.id; E.draft.grid = Object.assign({ rowH: 16, half: false, compact: false }, E.draft.grid || {});
    E.draft.layouts = Object.assign({ pc: [], tab: null, sm: null, phone: null }, E.draft.layouts || {});
    E.saved.grid = Object.assign({ rowH: 16, half: false, compact: false }, E.saved.grid || {}); E.saved.layouts = Object.assign({ pc: [], tab: null, sm: null, phone: null }, E.saved.layouts || {}); /* 같은 모양으로 맞춰 둠(열자마자 '고침 있음'이 되지 않게) */
    const dk = E.dkey(); const dr = U2.ls.get(dk, null);
    if (!opt.load && dr && dr.snap && dr.snap !== snapOf(E.draft)) { Object.assign(E.draft, JSON.parse(dr.snap)); E.fromDraft = dr.at; }
    if (opt.load) E.note = opt.note;
    E.sel = new Set(); E.hist = []; E.fut = [];
    const host = U2.$('#u2-page'); E.bp = G.bpOf(host.clientWidth || innerWidth).k;
    E.build(); U2.edit = E; E.refresh(); E.lock();
    if (E.fromDraft) U2.toast('이 기기에 남아 있던 초안을 이어서 엽니다(' + E.fromDraft.slice(11, 16) + ')');
  }
  Editor.prototype.dkey = function () { return 'draft:' + this.scope + ':' + this.id; };
  Editor.prototype.bpo = function () { return G.bpByKey(this.bp); };
  Editor.prototype.step = function () { return this.draft.grid.half ? 0.5 : 1; };
  /* 지금 폭의 배치(없으면 PC에서 흘려 만든 것 — 고치는 순간 이 폭 배치로 따로 저장) */
  Editor.prototype.items = function () { return U2.layoutFor(this.draft, this.bpo()); };
  Editor.prototype.own = function () { return this.bp === 'pc' || !!(this.draft.layouts[this.bp] && this.draft.layouts[this.bp].length); };
  Editor.prototype.ovIds = function () { return new Set((this.draft.layouts[this.bp] || []).map((i) => i.id)); };
  /* 배치 저장: PC는 통째로 · 좁은 폭은 '따로 고친 위젯'(changed + 이미 따로 고친 것)만 덮어쓰기로(정범님 Q6) */
  Editor.prototype.setItems = function (list, changed) {
    const pick = (i) => ({ id: i.id, x: i.x, y: i.y, w: i.w, h: i.h, ...(i.lock ? { lock: true } : {}), ...(i.float ? { float: true } : {}) });
    if (this.bp === 'pc') { const keepHidden = (this.draft.layouts.pc || []).filter((i) => this.draft.widgets[i.id] && (this.draft.widgets[i.id].hide || {}).pc && !list.some((x) => x.id === i.id)); this.draft.layouts.pc = list.map(pick).concat(keepHidden); return; }
    const ids = this.ovIds(); (changed || []).forEach((id) => ids.add(id));
    const old = new Map((this.draft.layouts[this.bp] || []).map((i) => [i.id, i]));
    this.draft.layouts[this.bp] = [...ids].map((id) => { const it = list.find((i) => i.id === id); return it ? pick(it) : old.get(id); }).filter((i) => i && this.draft.widgets[i.id]);
  };
  Editor.prototype.snap = function () { return snapOf(this.draft); };
  Editor.prototype.push = function () { this.nPush = (this.nPush || 0) + 1; this.hist.push(this.snap()); if (this.hist.length > U2.CFG.undoMax) this.hist.shift(); this.fut = []; };
  Editor.prototype.restore = function (s) { Object.assign(this.draft, JSON.parse(s)); this.sel.forEach((id) => { if (!this.draft.widgets[id]) this.sel.delete(id); }); this.saveDraft(); this.refresh(true); };
  /* (0.4.10 · 확인 방식 하나로) 두 번 누르기로 한 일을 알림의 '↶ 되돌리기'로 — 그 뒤에 다른 것을 고쳤으면 Ctrl+Z로 한 걸음씩(지운 것 되돌리기와 같은 규칙) */
  Editor.prototype.undoOnce = function () { const E = this; const n0 = E.nPush || 0; /* 두 번째 누름 때 만들어짐(일 하기 바로 전) — 그 일이 한 걸음(push 하나)이면 되돌림 */
    return () => { if (U2.edit !== E) return U2.toast('편집기를 닫아 되돌릴 수 없음 — 게시 기록에서', true); if ((E.nPush || 0) !== n0 + 1) return U2.toast('그 뒤에 다른 것을 고쳐서 — Ctrl+Z로 한 걸음씩', true); E.undo(); U2.toast('되돌림'); }; };
  Editor.prototype.undo = function () { if (!this.hist.length) return U2.toast('더 되돌릴 것이 없음'); this.fut.push(this.snap()); this.restore(this.hist.pop()); };
  Editor.prototype.redo = function () { if (!this.fut.length) return U2.toast('다시 할 것이 없음'); this.hist.push(this.snap()); this.restore(this.fut.pop()); };
  Editor.prototype.change = function (fn, keepCells) { this.push(); fn(); this.saveDraft(); this.refresh(!keepCells); };
  Editor.prototype.saveDraft = function () { clearTimeout(this._dt); this._dt = setTimeout(() => { U2.ls.set(this.dkey(), { at: U2.now(), snap: this.snap() }); this.savedAt = Date.now(); this.status(); }, 400); this.status(); };
  Editor.prototype.dirty = function () { return this.snap() !== snapOf(this.saved); };

  /* ── 틀 ── */
  Editor.prototype.build = function () {
    const E = this; document.body.classList.add('u2-editing');
    const top = document.createElement('div'); top.className = 'u2-edtop'; top.id = 'u2-edtop';
    const adm = U2.isAdmin();
    top.innerHTML = `<button type="button" class="u2-btn" data-e="exit">◀ 보기로</button>
      <span class="u2-seg" role="group" aria-label="무엇을 고치나"><button type="button" class="u2-btn" data-scope="pub" ${adm ? '' : 'disabled title="관리자 기기만 공용 배치를 고칩니다"'}>🌐 모든 기기 공용</button><button type="button" class="u2-btn" data-scope="mine">📱 이 기기만</button></span>
      <span class="u2-seg" role="group" aria-label="화면 폭">${G.BPS.map((b) => `<button type="button" class="u2-btn" data-bp="${b.k}">${esc(b.name)} ${b.cols}칸</button>`).join('')}</span>
      <button type="button" class="u2-btn" data-e="undo" title="Ctrl+Z">↶</button><button type="button" class="u2-btn" data-e="redo" title="Ctrl+Shift+Z">↷</button>
      <span class="u2-edst" id="u2-edst"></span><span class="u2-sp"></span>
      <button type="button" class="u2-btn u2-phoneonly" data-e="drawer">➕ 위젯</button><button type="button" class="u2-btn u2-phoneonly" data-e="props">⚙ 속성</button>
      <button type="button" class="u2-btn" data-e="hist">🕘 게시 기록</button><button type="button" class="u2-btn u2-pri" data-e="pub"></button>`;
    U2.$('#u2').insertBefore(top, U2.$('#u2-banners'));
    const dr = document.createElement('aside'); dr.className = 'u2-eddrawer'; dr.id = 'u2-eddrawer'; dr.setAttribute('aria-label', '위젯 서랍');
    const pr = document.createElement('aside'); pr.className = 'u2-edprops'; pr.id = 'u2-edprops'; pr.setAttribute('aria-label', '속성판');
    U2.$('#u2').appendChild(dr); U2.$('#u2').appendChild(pr);
    top.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.bp) { E.bp = b.dataset.bp; E.sel.clear(); E.refresh(true); return; }
      if (b.dataset.scope && b.dataset.scope !== E.scope) { if (E.dirty()) return U2.twice(b, '바꿈(지금 고친 것은 초안으로 남음)', () => E.switchScope(b.dataset.scope)); return E.switchScope(b.dataset.scope); }
      const k = b.dataset.e;
      if (k === 'exit') E.close(); else if (k === 'undo') E.undo(); else if (k === 'redo') E.redo(); else if (k === 'hist') E.history();
      else if (k === 'pub') E.publish(b); else if (k === 'drawer') dr.classList.toggle('open'); else if (k === 'props') pr.classList.toggle('open');
    });
    E.drawDrawer();
    E._fit = () => { const b = top.getBoundingClientRect().bottom; [dr, pr].forEach((x) => { if (innerWidth > 760) x.style.top = Math.max(0, Math.round(b)) + 'px'; else x.style.top = ''; }); };
    E._fit(); addEventListener('scroll', E._fit, { passive: true }); addEventListener('resize', E._fit);
    E._kd = (e) => E.key(e); document.addEventListener('keydown', E._kd, true);
  };
  Editor.prototype.switchScope = function (s) { const opt = {}; this.close(true); U2.openEditor(s, opt); };
  Editor.prototype.status = function () {
    const E = this; const st = U2.$('#u2-edst'); if (!st) return;
    const own = E.bp === 'pc' ? '' : E.own() ? ' · 이 폭: PC에서 흘린 배치 + 따로 고친 위젯 ' + E.ovIds().size + '개' : ' · 이 폭은 PC 배치에서 저절로(고친 위젯만 따로 기억)';
    const pm = U2.catalog && U2.legacy && U2.legacy.ready ? U2.catalog.pageMem(E.draft) : null; const memTxt = pm ? ` · <span class="u2-membar ${E.bp === 'phone' && pm.mb > U2.catalog.PHONE_MB ? 'u2-t-red' : ''}" title="이 페이지 옛 기능 위젯이 받는 자료">받는 자료 ≈${pm.mb}MB${pm.unknown ? '+' : ''}${E.bp === 'phone' ? ' / 휴대폰 예산 ' + U2.catalog.PHONE_MB + 'MB' : ''}</span>` : '';
    st.innerHTML = `${E.scope === 'mine' ? '📱 이 기기 배치' : '🌐 공용 배치'} · ${esc(E.draft.title)} · ${E.dirty() ? '<b>게시 안 한 고침 있음</b>' + (E.savedAt ? ' · 초안 저장됨' : '') : '바뀐 것 없음'}${own}${E.lockedBy ? ' · <b class="u2-t-red">' + esc(E.lockedBy) + '가 편집 중 — 게시 막힘</b>' : ''}${memTxt}`; st.title = st.textContent; /* (0.4.9) 넓은 화면에서 줄임표로 줄 때 전체 글 */
    U2.$$('#u2-edtop [data-bp]').forEach((b) => b.classList.toggle('u2-pri', b.dataset.bp === E.bp));
    U2.$$('#u2-edtop [data-scope]').forEach((b) => b.classList.toggle('u2-pri', b.dataset.scope === E.scope));
    const pb = U2.$('#u2-edtop [data-e="pub"]'); if (pb && !pb.classList.contains('u2-armed')) pb.textContent = E.scope === 'mine' ? '💾 이 기기에 저장' : '🚀 게시';
  };

  /* ── 캔버스 ── */
  Editor.prototype.refresh = function (remount) {
    const E = this; const host = U2.$('#u2-page'); host.style.maxWidth = CANVAS[E.bp] || ''; host.classList.add('u2-canvas');
    const bp = E.bpo();
    if (!U2.view || !U2.view._edit || remount) {
      if (U2.view) U2.view.destroy();
      U2.view = new G.View(host, { onNew: (c, it) => E.mount(c, it.id), onGone: (c) => { if (c._u2off) try { c._u2off(); } catch (e) {} } });
      U2.view._edit = true; U2.view._pg = E.id; E.wireCanvas();
    }
    const v = U2.view; v.setup(bp.cols, E.draft.grid.rowH || G.ROW_H, E.draft.grid.half);
    v.el.classList.add('u2-grid-edit'); v.el.style.setProperty('--u2-cols', bp.cols); v.el.style.setProperty('--u2-rowh', (E.draft.grid.rowH || 16) + 'px');
    E.cur = E.items(); v.place(E.cur, 12);
    v.cells.forEach((c, id) => { c.classList.toggle('u2-sel', E.sel.has(id)); });
    E.drawProps(); E.status();
  };
  Editor.prototype.mount = function (c, id) {
    const E = this; U2.mountCell(c, id, E.draft, true); c.tabIndex = 0; c.setAttribute('role', 'button');
    const w = E.draft.widgets[id]; c.setAttribute('aria-label', ((W.defs[w.type] || {}).name || w.type) + ' 위젯');
    const ov = document.createElement('div'); ov.className = 'u2-ov';
    const it0 = U2.catalog && (W.defs[w.type] || {}).legacy ? (U2.catalog.items || []).find((i) => i.perm === U2.permKey(w)) : null; const mb = it0 && it0.mem && it0.mem.mb ? ' · ≈' + it0.mem.mb + 'MB' : '';
    ov.innerHTML = '<span class="u2-ovname">' + esc((W.defs[w.type] || {}).name || w.type) + '</span><span class="u2-perf" title="그리기 시간·받는 자료(편집 때만)">⏱ ' + (c._ms != null ? c._ms : '-') + 'ms' + esc(mb) + '</span>' /* E11 위젯 성능 배지 */ + ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((h) => `<i class="u2-hd u2-hd-${h}" data-hd="${h}"></i>`).join('');
    c.appendChild(ov);
    c.addEventListener('focus', () => { if (!E.sel.has(id) && !E._dragging) { E.sel.clear(); E.sel.add(id); E.markSel(); E.drawProps(); } });
  };
  Editor.prototype.remount = function (id) { const c = U2.view && U2.view.cell(id); if (c) { this.mount(c, id); c.classList.toggle('u2-sel', this.sel.has(id)); } };
  Editor.prototype.markSel = function () { U2.view.cells.forEach((c, id) => c.classList.toggle('u2-sel', this.sel.has(id))); };
  Editor.prototype.lim = function (id) { const d = W.defs[(this.draft.widgets[id] || {}).type] || {}; return { minW: Math.min(this.bpo().cols, d.minW || this.step()), minH: d.minH || 1 }; };

  /* 끌기·크기(손가락은 길게 눌러) — 움직이는 동안에는 자리만 바꿈(위젯 내용은 다시 그리지 않음 → 빠름) */
  Editor.prototype.wireCanvas = function () {
    const E = this, v = U2.view;
    v.el.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.u2-cell'); if (!c) { if (e.target === v.el) { E.sel.clear(); E.markSel(); E.drawProps(); } return; }
      if (e.button && e.button !== 0) return;
      const id = c.dataset.wid; const hd = e.target.dataset && e.target.dataset.hd;
      if (e.target.closest('input,textarea,select')) return;
      if (e.shiftKey) { E.sel.has(id) ? E.sel.delete(id) : E.sel.add(id); E.markSel(); E.drawProps(); return; }
      if (!E.sel.has(id)) { E.sel.clear(); E.sel.add(id); E.markSel(); E.drawProps(); }
      const it0 = E.cur.find((i) => i.id === id); if (!it0 || it0.lock) return;
      const start = E.cur.map((i) => Object.assign({}, i)); const r = c.getBoundingClientRect();
      const g = { id, hd, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, start, it0: Object.assign({}, it0), on: false, touch: e.pointerType === 'touch', pid: e.pointerId };
      E._g = g; e.preventDefault();
      if (g.touch && !hd) g.lp = setTimeout(() => { g.on = true; c.classList.add('u2-lifting'); try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} }, 350); /* 휴대폰: 길게 눌러 끌기 */
      try { v.el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    v.el.addEventListener('pointermove', (e) => {
      const g = E._g; if (!g) return;
      if (!g.on) { if (g.touch && !g.hd) { if (Math.abs(e.clientX - g.sx) + Math.abs(e.clientY - g.sy) > 10) { clearTimeout(g.lp); E._g = null; } return; } if (Math.abs(e.clientX - g.sx) + Math.abs(e.clientY - g.sy) < 4) return; g.on = true; }
      E._dragging = true; g.ex = e.clientX; g.ey = e.clientY; if (g.raf) return;
      g.raf = requestAnimationFrame(() => { g.raf = 0; E.dragTo(g); });
    });
    const end = () => {
      const g = E._g; if (!g) return; clearTimeout(g.lp); E._g = null; E._dragging = false;
      const c = v.cell(g.id); if (c) c.classList.remove('u2-lifting', 'u2-dragging');
      if (!g.on || !g.tmp) return;
      const moved = JSON.stringify(g.tmp.map((i) => [i.id, i.x, i.y, i.w, i.h])) !== JSON.stringify(g.start.map((i) => [i.id, i.x, i.y, i.w, i.h]));
      if (!moved) return;
      E.push(); E.setItems(g.tmp, [g.id]); E.saveDraft(); E.refresh(false);
      E.drags = (E.drags || 0) + 1;
    };
    v.el.addEventListener('pointerup', end); v.el.addEventListener('pointercancel', end);
    /* 서랍에서 끌어 놓기(PC) */
    v.el.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('text/u2-type')) e.preventDefault(); });
    v.el.addEventListener('drop', (e) => { const t = e.dataTransfer.getData('text/u2-type'); if (!t) return; e.preventDefault(); const p = v.toCell(e.clientX, e.clientY); E.add(t, null, { x: Math.floor(p.x), y: Math.floor(p.y) }); });
  };
  Editor.prototype.dragTo = function (g) {
    const E = this, v = U2.view, cols = E.bpo().cols, st = E.step();
    const tmp = g.start.map((i) => Object.assign({}, i)); const it = tmp.find((i) => i.id === g.id);
    if (!g.hd) { const p = v.toCell(g.ex - g.ox, g.ey - g.oy); G.move(tmp, g.id, G.snap(p.x, st), Math.max(0, Math.round(p.y)), cols, st, E.lim(g.id)); }
    else {
      const p = v.toCell(g.ex, g.ey); const a = g.it0; let x = a.x, y = a.y, w = a.w, h = a.h;
      if (/e/.test(g.hd)) w = G.snap(p.x, st) - a.x; if (/s/.test(g.hd)) h = Math.round(p.y) - a.y;
      if (/w/.test(g.hd)) { const nx = Math.min(a.x + a.w - st, Math.max(0, G.snap(p.x, st))); w = a.x + a.w - nx; x = nx; }
      if (/n/.test(g.hd)) { const ny = Math.min(a.y + a.h - 1, Math.max(0, Math.round(p.y))); h = a.y + a.h - ny; y = ny; }
      it.x = x; it.y = y; it.w = w; it.h = h; G.clamp(it, cols, st, E.lim(g.id)); G.resolve(tmp, g.id);
    }
    g.tmp = tmp; v.place(tmp, 12); const c = v.cell(g.id); if (c) c.classList.add('u2-dragging');
    E.frames = (E.frames || 0) + 1;
  };

  /* ── 넣기·지우기·복사 ── */
  Editor.prototype.add = function (type, props, at) {
    const E = this, d = W.defs[type]; if (!d) return;
    if (d.adminOnly && !U2.isAdmin()) return U2.toast(d.name + ' — 관리자 기기만 만들 수 있습니다', 1);
    if (d.one && Object.values(E.draft.widgets).some((w) => w.type === type && (!props || !props.ref || (w.props || {}).ref === props.ref))) return U2.toast('이 페이지에 이미 있음 — 옛 기능 위젯은 한 페이지에 하나', 1);
    if (type === 'legacy.tab' && Object.values(E.draft.widgets).some((w) => w.type === 'legacy.tab')) return U2.toast('옛 탭 전체 위젯은 한 페이지에 하나만(옛 화면 id가 겹침)', 1);
    const id = U2.uid('w'); const cols = E.bpo().cols;
    E.change(() => {
      E.draft.widgets[id] = { type, props: Object.assign(W.defaults(type), props || {}) };
      const tc = 24; const list = U2.layoutFor(E.draft, G.bpByKey('pc'));
      const w = Math.max(E.step(), Math.min(tc, d.w || 6)), h = d.h || 4;
      const pos = at && E.bp === 'pc' ? { x: Math.max(0, Math.min(tc - w, at.x)), y: Math.max(0, at.y) } : G.findSpace(list.filter((i) => i.id !== id), w, h, tc, E.step());
      const it = { id, x: pos.x, y: pos.y, w, h }; if (d.float) it.float = true;
      const nl = list.filter((i) => i.id !== id).concat([it]); G.resolve(nl, id);
      E.draft.layouts.pc = nl.map((i) => ({ id: i.id, x: i.x, y: i.y, w: i.w, h: i.h, ...(i.float ? { float: true } : {}), ...(i.lock ? { lock: true } : {}) }));
      if (at && E.bp !== 'pc') { const cur = E.items(); const ci = cur.find((i) => i.id === id); if (ci) { ci.x = Math.max(0, Math.min(cols - ci.w, at.x)); ci.y = Math.max(0, at.y); G.resolve(cur, id); E.setItems(cur, [id]); } }
      E.sel.clear(); E.sel.add(id);
    });
    const c = U2.view.cell(id); if (c) { try { c.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
    return id;
  };
  Editor.prototype.remove = function (ids) {
    const E = this; ids = [...ids]; if (!ids.length) return;
    E.change(() => { ids.forEach((id) => { delete E.draft.widgets[id]; Object.keys(E.draft.layouts).forEach((k) => { if (E.draft.layouts[k]) E.draft.layouts[k] = E.draft.layouts[k].filter((i) => i.id !== id); }); E.sel.delete(id); }); });
    /* (0.4.6 · 성공 사례 견줌 ⑪) 지운 뒤 알림에 '되돌리기' 단추(10초) — Gmail '실행 취소'처럼 · Ctrl+Z와 같은 한 걸음 */
    const n0 = E.nPush, h0 = E.hist.length; U2.toast('지움 ' + ids.length + '개', false, 0, { act: { label: '↶ 되돌리기', fn: () => { if (U2.edit !== E) return U2.toast('편집기를 닫아 되돌릴 수 없음 — 게시 기록에서', true); if (E.nPush !== n0 || E.hist.length !== h0) return U2.toast('그 뒤에 다른 것을 고쳐서 — Ctrl+Z로 한 걸음씩', true); E.undo(); U2.toast('되돌림 — 지운 ' + ids.length + '개가 돌아옴'); } } });
  };
  Editor.prototype.copy = function () { const E = this; const ws = [...E.sel].map((id) => ({ w: E.draft.widgets[id], it: E.cur.find((i) => i.id === id) })).filter((x) => x.w); if (!ws.length) return; U2.ls.set('clip', ws); U2.toast('복사함 ' + ws.length + '개'); };
  Editor.prototype.paste = function () {
    const E = this, ws = U2.ls.get('clip', null); if (!ws || !ws.length) return U2.toast('붙일 것이 없음');
    const ids = []; E.change(() => { const list = E.items(); ws.forEach((x) => { if ((W.defs[x.w.type] || {}).one) return; const id = U2.uid('w'); E.draft.widgets[id] = U2.clone(x.w); const w = Math.min(E.bpo().cols, (x.it && x.it.w) || 4), h = (x.it && x.it.h) || 4; const sp = G.findSpace(list, w, h, E.bpo().cols, E.step()); list.push({ id, x: sp.x, y: sp.y, w, h }); ids.push(id); }); E.setItems(list, ids); E.sel = new Set(ids); });
    U2.toast('붙임 ' + ids.length + '개');
  };
  Editor.prototype.nudge = function (dx, dy, dw, dh) {
    const E = this; if (!E.sel.size) return; const cols = E.bpo().cols, st = E.step();
    E.change(() => { const list = E.items(); [...E.sel].forEach((id) => { const it = list.find((i) => i.id === id); if (!it || it.lock) return; it.x += dx * st; it.y += dy; it.w += dw * st; it.h += dh; G.clamp(it, cols, st, E.lim(id)); G.resolve(list, id); }); E.setItems(list, [...E.sel]); }, true);
  };
  Editor.prototype.align = function (k) {
    const E = this; const ids = [...E.sel]; if (ids.length < 2) return; const cols = E.bpo().cols, st = E.step();
    E.change(() => { const list = E.items(); const its = ids.map((id) => list.find((i) => i.id === id)).filter(Boolean); const f = its[0];
      if (k === 'left') its.forEach((i) => (i.x = Math.min(...its.map((j) => j.x)))); if (k === 'top') its.forEach((i) => (i.y = Math.min(...its.map((j) => j.y))));
      if (k === 'w') its.forEach((i) => (i.w = f.w)); if (k === 'h') its.forEach((i) => (i.h = f.h));
      if (k === 'space') { const s = its.slice().sort((a, b) => a.x - b.x); const tot = s.reduce((a, i) => a + i.w, 0); const gap = Math.max(0, G.snap((cols - tot) / Math.max(1, s.length - 1), st)); let x = 0; s.forEach((i) => { i.x = x; x += i.w + gap; i.y = s[0].y; }); }
      its.forEach((i) => G.clamp(i, cols, st, E.lim(i.id))); its.forEach((i) => G.resolve(list, i.id)); E.setItems(list, ids); }, true);
  };

  /* ── 키보드(편집기가 켜졌을 때만 · 글 칸 안에서는 그 칸 몫) ── */
  Editor.prototype.key = function (e) {
    const E = this; const t = e.target; const inField = t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]');
    const mod = e.ctrlKey || e.metaKey; const k = e.key;
    if (U2.$('#u2-ask') || U2.$('.u2-layer')) return; /* 확인 창·판이 떠 있으면 그쪽 몫 */
    if (mod && !inField && (k === 'z' || k === 'Z') && !e.shiftKey) { e.preventDefault(); e.stopImmediatePropagation(); return E.undo(); }
    if (mod && !inField && (((k === 'z' || k === 'Z') && e.shiftKey) || k === 'y' || k === 'Y')) { e.preventDefault(); e.stopImmediatePropagation(); return E.redo(); }
    if (inField) return;
    let done = true; const big = e.shiftKey ? 4 : 1;
    if (k === '/' && !mod) { const s = U2.$('#u2-edq'); if (s) { s.focus(); s.select(); } }
    else if (k.indexOf('Arrow') === 0 && E.sel.size) { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; if (mod) E.nudge(0, 0, d[0] * big, d[1] * big); else E.nudge(d[0] * big, d[1] * big, 0, 0); }
    else if ((k === 'Delete' || k === 'Backspace') && E.sel.size) E.remove(E.sel);
    else if (mod && (k === 'c' || k === 'C') && E.sel.size) E.copy();
    else if (mod && (k === 'v' || k === 'V')) E.paste();
    else if (mod && (k === 'd' || k === 'D') && E.sel.size) { E.copy(); E.paste(); }
    else if (k === 'Escape' && E.sel.size) { E.sel.clear(); E.markSel(); E.drawProps(); }
    else done = false;
    if (done) { e.preventDefault(); e.stopImmediatePropagation(); if (E.sel.size === 1) { const c = U2.view.cell([...E.sel][0]); if (c && document.activeElement !== c) try { c.focus({ preventScroll: true }); } catch (x) {} } }
  };

  /* ── 위젯 서랍 ── */
  Editor.prototype.drawDrawer = function () {
    const E = this, dr = U2.$('#u2-eddrawer');
    const cat = U2.legacy && U2.legacy.ready ? U2.legacy.catalog() : { screens: [], feats: [], home: [] };
    const basic = W.order.filter((t) => !W.defs[t].legacy);
    const item = (type, name, icon, extra, props) => `<button type="button" class="u2-dri" draggable="true" data-type="${esc(type)}" ${props ? `data-props="${esc(JSON.stringify(props))}"` : ''} data-q="${esc((name + ' ' + (extra || '')).toLowerCase())}"><span>${esc(icon || '')}</span> ${esc(name)}${extra ? `<small>${esc(extra)}</small>` : ''}</button>`;
    const groups = W.GROUPS.filter((g) => g !== '리드나우 기능').map((g) => `<details class="u2-drg" open><summary>${esc(g)} <small>${basic.filter((t) => W.defs[t].group === g).length}</small></summary>${basic.filter((t) => W.defs[t].group === g).map((t) => item(t, W.defs[t].name, W.defs[t].icon)).join('')}</details>`).join('');
    /* 리드나우 기능 — 지금 웹앱에서 저절로 뽑은 목록(u2-catalog) · 분류 12 · ≈MB · 🆕 · 이 페이지에 있음 */
    let lg = '';
    if (U2.legacy && U2.legacy.ready && U2.catalog) {
      const items = U2.catalog.get().filter((i) => !i.needsArg); const here = new Set(Object.values(E.draft.widgets).map((w) => U2.permKey(w)).filter(Boolean));
      const byCat = U2.catalog.CATS.map((c, ci) => [c, items.filter((i) => i.cat === ci)]).filter(([, l]) => l.length);
      lg = `<details class="u2-drg" open><summary>리드나우 기능 <small>${items.length}</small></summary>${item('legacy.header', '지금 웹앱 머리줄', '🔝', '찾기 칸·설정 단추')}${byCat.map(([c, l]) => `<details class="u2-drg u2-drcat"><summary>${esc(c)} <small>${l.length}</small></summary>${l.slice(0, 250).map((i) => { const mb = i.mem && i.mem.mb ? ` · ≈${i.mem.mb}MB` : ''; const kind = { tab: '탭 전체', sec: '섹션', home: '홈 칸', screen: '화면 열기', feat: '기능 단추' }[i.kind]; return item(i.type, (i.isNew ? '🆕 ' : '') + i.title, i.icon, kind + mb + (here.has(i.perm) ? ' · 이 페이지에 있음' : '') + ' ' + (i.desc || ''), i.props).replace('class="u2-dri"', 'class="u2-dri' + (here.has(i.perm) ? ' u2-here' : '') + '"').replace(/data-q="([^"]*)"/, (m, q) => `data-q="${q} ${esc((i.words || '').toLowerCase().slice(0, 400))}"`); }).join('')}</details>`).join('')}</details>`;
    } else lg = `<details class="u2-drg" open><summary>리드나우 기능 <small>(안전 모드 — 지금 웹앱을 못 불러옴)</small></summary></details>`;
    dr.innerHTML = `<div class="u2-drhead"><input id="u2-edq" type="search" class="u2-in" placeholder="위젯 찾기 ( / 누르고 바로 )" aria-label="위젯 찾기"></div><div class="u2-drlist">${groups}${lg}</div><p class="u2-hint">누르면 빈 곳에 넣음 · PC는 끌어서 원하는 칸에</p>`;
    const q = dr.querySelector('#u2-edq');
    q.oninput = () => { const s = q.value.trim().toLowerCase(); dr.querySelectorAll('.u2-dri').forEach((b) => (b.hidden = !!s && b.dataset.q.indexOf(s) < 0)); if (s) dr.querySelectorAll('.u2-drg').forEach((d) => (d.open = true)); };
    q.onkeydown = (e) => { if (e.key === 'Enter') { const b = [...dr.querySelectorAll('.u2-dri')].find((x) => !x.hidden); if (b) b.click(); } if (e.key === 'Escape') { q.value = ''; q.oninput(); q.blur(); } };
    dr.addEventListener('click', (e) => { const b = e.target.closest('.u2-dri'); if (!b) return; E.add(b.dataset.type, b.dataset.props ? JSON.parse(b.dataset.props) : null); dr.classList.remove('open'); });
    dr.addEventListener('dragstart', (e) => { const b = e.target.closest('.u2-dri'); if (!b) return; e.dataTransfer.setData('text/u2-type', b.dataset.type); });
  };

  /* ── 속성판 ── */
  const field = (f, v) => {
    const id = 'u2f-' + f.k; const lab = `<label for="${id}">${esc(f.label)}</label>`;
    if (f.type === 'area') return `<div class="u2-fld">${lab}<textarea id="${id}" data-k="${esc(f.k)}" class="u2-in" rows="4">${esc(v)}</textarea></div>`;
    if (f.type === 'check') return `<div class="u2-fld"><label class="u2-chk"><input id="${id}" type="checkbox" data-k="${esc(f.k)}" ${v ? 'checked' : ''}> ${esc(f.label)}</label></div>`;
    if (f.type === 'select') return `<div class="u2-fld">${lab}<select id="${id}" data-k="${esc(f.k)}" class="u2-in">${Object.entries(f.opts).map(([a, b]) => `<option value="${esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div>`;
    if (f.type === 'multi') { const on = new Set((Array.isArray(v) ? v : String(v || '').split(/[,\s]+/)).map(String)); return `<div class="u2-fld u2-multi" role="group" aria-label="${esc(f.label)}"><span class="u2-ml">${esc(f.label)}</span><div class="u2-mopts">${Object.entries(f.opts || {}).map(([a, b]) => `<label class="u2-chk"><input type="checkbox" data-mk="${esc(f.k)}" value="${esc(a)}" ${on.has(String(a)) ? 'checked' : ''}> ${esc(b)}</label>`).join('')}</div>${f.help ? `<small class="u2-hint">${esc(f.help)}</small>` : ''}</div>`; } /* (0.4.9) 여럿 고르기 — 우리숍 설정 틀(multi)과 같은 꼴 · 하나도 안 고르면 '모두' */
    if (f.type === 'icon') return `<div class="u2-fld">${lab}<input id="${id}" data-k="${esc(f.k)}" class="u2-in" value="${esc(v)}" list="u2-icons"></div>`;
    if (f.type === 'scr' || f.type === 'hw') { const cat = U2.legacy && U2.legacy.ready ? U2.legacy.catalog() : { screens: [], home: [] }; const L0 = f.type === 'scr' ? cat.screens : cat.home; return `<div class="u2-fld">${lab}<select id="${id}" data-k="${esc(f.k)}" class="u2-in">${L0.map((s) => `<option value="${esc(s.k)}" ${s.k === v ? 'selected' : ''}>${esc(s.t)}</option>`).join('') || `<option value="${esc(v)}">${esc(v)}</option>`}</select></div>`; }
    const rng = f.type === 'number' ? ['min', 'max', 'step'].filter((k) => f[k] != null).map((k) => ` ${k}="${esc(f[k])}"`).join('') : '';
    return `<div class="u2-fld">${lab}<input id="${id}" data-k="${esc(f.k)}" class="u2-in" type="${f.type === 'number' ? 'number' : 'text'}" value="${esc(v)}"${rng}>${f.help ? `<small class="u2-hint">${esc(f.help)}</small>` : ''}</div>`;
  };
  /* (0.4.9) 속성이 묶음(group)을 가지면 묶음마다 작은 머리 — 우리숍 블록처럼 칸이 많은 위젯을 읽기 쉽게 */
  const fieldsOf = (props, p) => { let g = null; return props.map((f) => { const h = f.group && f.group !== g ? `<div class="u2-pgh">${esc(f.group)}</div>` : ''; g = f.group || g; return h + field(f, p[f.k]); }).join(''); };
  Editor.prototype.drawProps = function () {
    const E = this, pr = U2.$('#u2-edprops'); if (!pr) return; const ids = [...E.sel];
    const tree = `<details class="u2-drg" open><summary>층 나무(위→아래)</summary><div class="u2-tree">${E.items().slice().sort((a, b) => a.y - b.y || a.x - b.x).map((i) => { const w = E.draft.widgets[i.id]; return `<button type="button" class="u2-dri ${E.sel.has(i.id) ? 'on' : ''}" data-pick="${esc(i.id)}">${esc((W.defs[w.type] || {}).icon || '')} ${esc(((w.props || {}).s_title) || (w.props || {}).title || (w.props || {}).label || (W.defs[w.type] || {}).name)} <small>${i.x},${i.y} · ${i.w}×${i.h}</small></button>`; }).join('') || '<p class="u2-hint">아직 위젯이 없음 — 왼쪽 서랍에서 넣으세요</p>'}</div></details>`;
    let h = '';
    if (ids.length === 1) {
      const id = ids[0], w = E.draft.widgets[id], d = W.defs[w.type] || { props: [] }, p = Object.assign(W.defaults(w.type), w.props || {}), it = E.cur.find((i) => i.id === id) || {};
      h = `<div class="u2-prh"><b>${esc(d.icon || '')} ${esc(d.name || w.type)}</b> <small>${esc(id)}</small></div>
        <details class="u2-drg" open><summary>내용·기능</summary>${fieldsOf(d.props, p) || '<p class="u2-hint">고칠 내용 없음</p>'}${field({ k: 'guide', label: '📖 이 위젯 설명(ⓘ로 보임)', type: 'area' }, p.guide || '')}</details>
        <details class="u2-drg" open><summary>자리 (${esc(G.bpByKey(E.bp).name)} ${E.bpo().cols}칸)</summary><div class="u2-row u2-xywh">${['x', 'y', 'w', 'h'].map((k) => `<label>${{ x: '가로 자리', y: '세로 자리', w: '폭', h: '높이' }[k]}<input type="number" class="u2-in" data-pos="${k}" step="${k === 'x' || k === 'w' ? E.step() : 1}" value="${it[k] != null ? it[k] : ''}"></label>`).join('')}</div>
          <label class="u2-chk"><input type="checkbox" data-flag="lock" ${it.lock ? 'checked' : ''}> 🔒 못 움직이게</label> <label class="u2-chk"><input type="checkbox" data-flag="float" ${it.float ? 'checked' : ''}> 겹쳐 놓기 허락</label>
          <div>이 폭에서 숨김: ${G.BPS.map((b) => `<label class="u2-chk"><input type="checkbox" data-hide="${b.k}" ${(w.hide || {})[b.k] ? 'checked' : ''}> ${esc(b.name)}</label>`).join(' ')}</div></details>
        <details class="u2-drg"><summary>모양</summary>${W.STYLE.map((f) => field(f, p[f.k] == null ? '' : p[f.k])).join('')}</details>
        <details class="u2-drg" ${p.showIf || p.devOnly || p.night ? 'open' : ''}><summary>조건(언제 보일지)</summary>${U2.data.COND.map((f) => field(f, p[f.k] == null ? '' : p[f.k])).join('')}<p class="u2-hint" data-condchk></p></details>
        ${p.key && U2.actions.keyOk(p.key) ? `<p class="u2-banner u2-warn">⌨ ${esc(U2.actions.keyOk(p.key))}</p>` : ''}
        <p class="u2-hint">💡 글 칸에 <b>=식</b>(예 =주문.전체수) 또는 <b>{{식}}</b>을 쓰면 보기 모드에서 값으로 바뀜 · 쓸 수 있는 이름: ${U2.data.ALIAS.map((a) => esc(a[0])).join(' · ')}</p>
        ${E.bp !== 'pc' && E.ovIds().has(id) ? '<div class="u2-row"><span class="u2-hint">이 폭에서 따로 고친 자리</span><button type="button" class="u2-btn" data-a="follow">↩ 이 위젯은 PC를 따름</button></div>' : ''}<div class="u2-row"><button type="button" class="u2-btn" data-a="dup">⧉ 복제 (Ctrl+D)</button><button type="button" class="u2-btn u2-red" data-a="del">🗑 지우기 (Delete)</button></div>`;
    } else if (ids.length > 1) {
      h = `<div class="u2-prh"><b>${ids.length}개 고름</b></div><div class="u2-row"><button type="button" class="u2-btn" data-al="left">⇤ 왼쪽 맞춤</button><button type="button" class="u2-btn" data-al="top">⤒ 위 맞춤</button><button type="button" class="u2-btn" data-al="w">↔ 같은 폭</button><button type="button" class="u2-btn" data-al="h">↕ 같은 높이</button><button type="button" class="u2-btn" data-al="space">┅ 같은 간격</button></div><div class="u2-row"><button type="button" class="u2-btn u2-red" data-a="del">🗑 모두 지우기</button></div>`;
    } else {
      const g = E.draft.grid;
      h = `<div class="u2-prh"><b>📄 페이지 설정</b> <small>${esc(E.id)}</small></div>
        ${field({ k: 'title', label: '페이지 이름', type: 'text' }, E.draft.title)}${field({ k: 'icon', label: '아이콘', type: 'icon' }, E.draft.icon)}
        <div class="u2-fld"><label>칸 높이(px)</label><input type="number" class="u2-in" data-grid="rowH" min="8" max="96" value="${g.rowH || 16}"></div>
        <label class="u2-chk"><input type="checkbox" data-grid="half" ${g.half ? 'checked' : ''}> 반 칸 맞춤(가로 48 위치)</label>
        <label class="u2-chk"><input type="checkbox" data-grid="compact" ${g.compact ? 'checked' : ''}> 위로 붙이기(빈 줄 당김)</label>
        <div class="u2-fld"><b>이 폭(${esc(G.bpByKey(E.bp).name)})</b>: ${E.bp === 'pc' ? '기본 배치(좁은 폭은 여기서 저절로 흘러감)' : E.own() ? 'PC에서 흘린 배치 + 따로 고친 위젯 ' + E.ovIds().size + '개 <button type="button" class="u2-btn" data-a="rederive">모두 PC를 따르게</button>' : 'PC 배치에서 저절로 흘린 것(위젯을 고치면 그 위젯만 따로 기억)'}</div>
        <div class="u2-fld"><label>견본 배치 불러오기(Ctrl+Z로 되돌림)</label><div class="u2-row">${Object.entries(U2.TEMPLATES).map(([k, t]) => `<button type="button" class="u2-btn" data-tpl="${k}">${esc(t.name)}</button>`).join('')}</div></div>
        <p class="u2-hint">⌨ 화살표 = 1칸 · Shift+화살표 = 4칸 · Ctrl+화살표 = 크기 · Delete = 지움 · Ctrl+Z / Ctrl+Shift+Z · Ctrl+C / V · / = 위젯 찾기</p>`;
    }
    pr.innerHTML = h + tree + '<datalist id="u2-icons">' + U2.theme.ICONS.map((i) => `<option value="${i}">`).join('') + '</datalist>';
    /* 고치기: 글자를 치는 동안은 한 걸음으로 묶음(칸에 들어갈 때 한 번 기록) */
    const one = ids.length === 1 ? ids[0] : null;
    const cc = pr.querySelector('[data-condchk]'); const condUpd = () => { if (!cc || !one) return; const si = (E.draft.widgets[one].props || {}).showIf; if (!si) { cc.textContent = ''; return; } const r = U2.data.eval(si); cc.textContent = r.err ? '⚠ 식 오류: ' + r.err + ' (틀리면 늘 보임)' : '지금 값: ' + U2Expr.show(r.v) + ' → ' + (U2Expr.truthy(r.v) ? '보임' : '숨김'); }; condUpd();
    pr.querySelectorAll('[data-mk]').forEach((el) => el.addEventListener('change', () => { if (!one) return; E.push(); const k = el.dataset.mk; const v = [...pr.querySelectorAll('[data-mk]')].filter((x) => x.dataset.mk === k && x.checked).map((x) => x.value); const w = E.draft.widgets[one]; w.props = Object.assign({}, w.props, { [k]: v }); E.remount(one); E.saveDraft(); }));
    pr.querySelectorAll('[data-k]').forEach((el) => {
      el.addEventListener('focus', () => { el._pushed = false; });
      const apply = () => {
        if (!el._pushed) { E.push(); el._pushed = true; }
        const v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value;
        if (one) { const w = E.draft.widgets[one]; w.props = Object.assign({}, w.props, { [el.dataset.k]: v }); E.remount(one); }
        else { E.draft[el.dataset.k] = v; }
        E.saveDraft(); if (!one) U2.drawBar(); if (el.dataset.k === 'showIf') condUpd();
      };
      el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', apply);
      el.addEventListener('blur', () => { el._pushed = false; if (one) E.drawTreeOnly(); });
    });
    pr.querySelectorAll('[data-pos]').forEach((el) => (el.onchange = () => { const k = el.dataset.pos; E.change(() => { const list = E.items(); const it = list.find((i) => i.id === one); if (!it) return; it[k] = +el.value; G.clamp(it, E.bpo().cols, E.step(), E.lim(one)); G.resolve(list, one); E.setItems(list, [one]); }, true); }));
    pr.querySelectorAll('[data-flag]').forEach((el) => (el.onchange = () => E.change(() => { const list = E.items(); const it = list.find((i) => i.id === one); if (!it) return; if (el.checked) it[el.dataset.flag] = true; else delete it[el.dataset.flag]; G.resolve(list, one); E.setItems(list, [one]); })));
    pr.querySelectorAll('[data-hide]').forEach((el) => (el.onchange = () => E.change(() => { const w = E.draft.widgets[one]; w.hide = Object.assign({}, w.hide, { [el.dataset.hide]: el.checked }); if (!el.checked) delete w.hide[el.dataset.hide]; if (el.checked && el.dataset.hide === E.bp) E.sel.delete(one); })));
    pr.querySelectorAll('[data-grid]').forEach((el) => (el.onchange = () => E.change(() => { const k = el.dataset.grid; E.draft.grid[k] = el.type === 'checkbox' ? el.checked : Math.max(8, Math.min(96, +el.value || 16)); if (k === 'compact' && el.checked) { Object.keys(E.draft.layouts).forEach((b) => { if (E.draft.layouts[b]) G.compact(E.draft.layouts[b]); }); } })));
    pr.querySelectorAll('[data-al]').forEach((b) => (b.onclick = () => E.align(b.dataset.al)));
    pr.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = (e) => { const id = b.dataset.pick; if (e.shiftKey) { E.sel.has(id) ? E.sel.delete(id) : E.sel.add(id); } else { E.sel.clear(); E.sel.add(id); } E.markSel(); E.drawProps(); const c = U2.view.cell(id); if (c) try { c.scrollIntoView({ block: 'nearest' }); } catch (x) {} }));
    pr.querySelectorAll('[data-tpl]').forEach((b) => (b.onclick = () => U2.twice(b, '견본으로 바꿈(지금 배치 대신)', () => E.change(() => { const t = U2.TEMPLATES[b.dataset.tpl].make(E.id); E.draft.widgets = t.widgets; E.draft.layouts = t.layouts; E.sel.clear(); }), { done: '견본으로 바꿈(초안)', undo: E.undoOnce() })));
    const a = (k, f) => { const b = pr.querySelector('[data-a="' + k + '"]'); if (b) b.onclick = f; };
    a('del', () => E.remove(E.sel)); a('dup', () => { E.copy(); E.paste(); });
    a('follow', () => E.change(() => { E.draft.layouts[E.bp] = (E.draft.layouts[E.bp] || []).filter((i) => i.id !== one); }));
    a('rederive', (e) => U2.twice(e.currentTarget, '모두 PC 배치를 따름(따로 고친 자리 지움)', () => E.change(() => { E.draft.layouts[E.bp] = null; }), { done: '이 폭은 PC 배치를 따름', undo: E.undoOnce() }));
  };
  Editor.prototype.drawTreeOnly = function () { /* 이름이 바뀌었을 수 있어 층 나무만 */ const t = U2.$('#u2-edprops .u2-tree'); if (!t) return; const keepFocus = document.activeElement; this.drawProps(); if (keepFocus && keepFocus.id) { const n = document.getElementById(keepFocus.id); if (n) try { n.focus(); } catch (e) {} } };

  /* ── 배치 건강 검사(E2 ★) — 게시 전 ── */
  Editor.prototype.health = function () {
    const E = this, out = []; const ws = Object.entries(E.draft.widgets);
    const cnt = {}; ws.forEach(([, w]) => { if ((W.defs[w.type] || {}).one) { const k = w.type + ':' + ((w.props || {}).ref || ''); cnt[k] = (cnt[k] || 0) + 1; } }); Object.entries(cnt).forEach(([k, n]) => n > 1 && out.push('같은 옛 기능 위젯 ' + n + '개: ' + k));
    if (ws.filter(([, w]) => w.type === 'legacy.tab').length > 1) out.push('옛 탭 전체 위젯이 둘 이상');
    const tabRef = (ws.find(([, w]) => w.type === 'legacy.tab') || [, { props: {} }])[1].props.ref; ws.forEach(([id, w]) => { if (w.type === 'legacy.sec' && tabRef && (w.props || {}).tab === tabRef) out.push('섹션 위젯 ' + id + '이(가) 같은 탭 전체 위젯과 함께 있음(옛 화면 id가 겹침)'); });
    if (U2.adapters && U2.adapters.bad && U2.adapters.bad.length) ws.forEach(([id, w]) => { if (!U2.adapters.kindOk(w.type)) out.push('계약이 깨진 위젯(안전 모드로 보임): ' + id); });
    { const pm = U2.catalog && U2.catalog.pageMem(E.draft); if (pm && E.draft.layouts.phone !== undefined && pm.mb > U2.catalog.PHONE_MB) out.push('휴대폰 예산 넘음: 받는 자료 ≈' + pm.mb + 'MB'); }
    G.BPS.forEach((b) => { const o = G.hasOverlap(U2.layoutFor(E.draft, b)); if (o) out.push(b.name + ' 폭에서 겹침: ' + o.join(' · ')); });
    if (!ws.length) out.push('빈 페이지');
    const nav = new Set((U2.site.nav || []).map((n) => n.id)); ws.forEach(([id, w]) => { const p = w.props || {}; if (p.act === 'page' && p.arg && !nav.has(p.arg)) out.push('없는 페이지로 가는 단추: ' + id + ' → ' + p.arg); });
    const bud = U2.data.pageBudget(E.draft); if (bud > U2.data.PAGE_MAX) out.push('Firestore 질의 합 ' + bud + '문서 — 한 페이지 ' + U2.data.PAGE_MAX + '문서까지(게시 막힘)');
    ws.forEach(([id, w]) => { const p = w.props || {}; if (w.type === 'query') { const b = U2.data.qOk(p); if (b) out.push('질의 위젯 ' + id + ': ' + b); } if (p.key) { const b = U2.actions.keyOk(p.key); if (b) out.push('단축키 ' + id + ': ' + b); } if (p.showIf) { const r = U2Expr.eval(p.showIf, U2.data.ctx()); if (r.err && /모르는 함수|남은 글|필요함|덜 끝남|모르는 글자/.test(r.err)) out.push('보이기 조건 식 오류 ' + id + ': ' + r.err); } });
    const keys = ws.map(([, w]) => (w.props || {}).key).filter(Boolean).map((k) => k.toUpperCase()); const dupK = keys.filter((k, i) => keys.indexOf(k) !== i); if (dupK.length) out.push('같은 단축키를 둘 이상: ' + [...new Set(dupK)].join(', '));
    const fabs = ws.filter(([, w]) => w.type === 'fab').length; if (fabs > 1) out.push('떠 있는 단추가 ' + fabs + '개 — 서로 겹침');
    return out;
  };
  Editor.prototype.diff = function () {
    const a = this.saved, b = this.draft; const ka = new Set(Object.keys(a.widgets || {})), kb = new Set(Object.keys(b.widgets || {}));
    const add = [...kb].filter((k) => !ka.has(k)).length, del = [...ka].filter((k) => !kb.has(k)).length;
    const pa = new Map(((a.layouts || {}).pc || []).map((i) => [i.id, [i.x, i.y, i.w, i.h].join()])); const moved = ((b.layouts || {}).pc || []).filter((i) => pa.has(i.id) && pa.get(i.id) !== [i.x, i.y, i.w, i.h].join()).length;
    const props = [...kb].filter((k) => ka.has(k) && JSON.stringify(a.widgets[k]) !== JSON.stringify(b.widgets[k])).length;
    return { add, del, moved, props };
  };
  /* ── 게시 / 이 기기에 저장 ── */
  Editor.prototype.publish = function (btn) {
    const E = this;
    if (!E.dirty() && !E.note) return U2.toast('바뀐 것 없음');
    const hz = E.health(); const d = E.diff(); const lbl = `${E.scope === 'mine' ? '이 기기에 저장' : '모든 기기에 게시'} (위젯 +${d.add} −${d.del} · 옮김 ${d.moved} · 속성 ${d.props})${hz.length ? ' ⚠ 검사 ' + hz.length + '건' : ''}`;
    if (hz.length && !btn._u2arm) U2.toast('⚠ 배치 검사: ' + hz.join(' / '), 1, 6000);
    if (E.scope === 'pub' && !U2.isAdmin()) return U2.toast('공용 배치는 관리자 기기에서만 게시합니다', 1);
    if (U2.data.pageBudget(E.draft) > U2.data.PAGE_MAX) return U2.toast('Firestore 질의가 한 페이지 ' + U2.data.PAGE_MAX + '문서를 넘어 게시할 수 없습니다', 1);
    if (Object.values(E.draft.widgets).some((w) => w.type === 'query') && !U2.isAdmin()) return U2.toast('Firestore 질의 위젯은 관리자 기기만 둘 수 있습니다', 1);
    if (E.scope === 'pub' && E.lockedBy) return U2.toast(E.lockedBy + '가 편집 중이라 게시를 막았습니다', 1);
    U2.twice(btn, lbl, () => E.doPublish());
  };
  Editor.prototype.doPublish = async function (note) {
    const E = this; const at = U2.now(), by = U2.dev();
    if (E.scope === 'mine') {
      U2.prefs = U2.prefs || { pages: {} }; U2.prefs.pages = U2.prefs.pages || {};
      U2.prefs.pages[E.id] = { layouts: U2.clone(E.draft.layouts), widgets: U2.clone(E.draft.widgets), grid: U2.clone(E.draft.grid), basedOn: (U2.pages[E.id] || {}).rev || 0, at };
      await U2.savePrefs(); E.saved = U2.clone(E.draft); U2.ls.del(E.dkey()); U2.toast('이 기기 배치를 저장함'); E.status(); return;
    }
    const pub = U2.pages[E.id] || U2.defaultPage(E.id); const rev = (pub.rev || 0) + 1; const d = E.diff();
    const page = Object.assign(U2.clone(E.draft), { id: E.id, rev, by, at }); delete page._mine; delete page._basedOn;
    await U2.store.set('ui2_pages', E.id, page);
    await U2.store.set('ui2_versions', E.id + '_' + rev, { page: E.id, rev, by, at, note: note || E.note || '', diff: d, data: page });
    const nav = (U2.site.nav || []).slice(); const n = nav.find((x) => x.id === E.id);
    if (!n || n.title !== page.title || n.icon !== page.icon) { if (n) { n.title = page.title; n.icon = page.icon; } else nav.push({ id: E.id, title: page.title, icon: page.icon }); U2.site.nav = nav; await U2.store.set('ui2_site', 'main', { nav, rev: (U2.site.rev || 0) + 1, by, at }, true); U2.drawBar(); }
    U2.pages[E.id] = page; E.saved = U2.clone(page); E.note = ''; U2.ls.del(E.dkey()); E.status();
    U2.toast('게시함 — 판 ' + rev);
  };
  /* ── 게시 기록 · 되돌리기 ── */
  Editor.prototype.history = async function () {
    const E = this; const vs = (await U2.store.where('ui2_versions', 'page', E.id)).sort((a, b) => b.rev - a.rev).slice(0, 50);
    const L = U2.panel('🕘 게시 기록 — ' + E.draft.title, vs.length ? `<div class="u2-tblw"><table class="u2-tbl"><thead><tr><th>판</th><th>누가·언제</th><th>바뀐 것</th><th></th></tr></thead><tbody>${vs.map((v) => `<tr><td>${v.rev}</td><td>${esc(v.by)}<br><small>${esc(String(v.at || '').slice(0, 16).replace('T', ' '))}</small></td><td>+${(v.diff || {}).add || 0} −${(v.diff || {}).del || 0} · 옮김 ${(v.diff || {}).moved || 0}${v.note ? '<br><small>' + esc(v.note) + '</small>' : ''}</td><td><button type="button" class="u2-btn" data-rev="${v.rev}" ${U2.isAdmin() ? '' : 'disabled'}>이 판으로 되돌리기</button></td></tr>`).join('')}</tbody></table></div><p class="u2-hint">되돌리면 그것도 새 판으로 남습니다(지우지 않음)</p>` : '<p class="u2-hint">아직 게시한 판이 없습니다</p>');
    L.querySelectorAll('[data-rev]').forEach((b) => (b.onclick = () => U2.twice(b, '판 ' + b.dataset.rev + '로 되돌림(모든 기기)', async () => { const v = vs.find((x) => String(x.rev) === b.dataset.rev); E.push(); const d0 = U2.clone(v.data); E.draft.widgets = d0.widgets; E.draft.layouts = d0.layouts; E.draft.grid = d0.grid; E.draft.title = d0.title; E.draft.icon = d0.icon; await E.doPublish('판 ' + v.rev + '로 되돌림'); L.remove(); E.refresh(true); })));
  };
  /* ── 편집 잠금(두 기기 동시 편집 막기) — ui2_locks/<페이지> · 4분마다 맥박 · 10분 지나면 풀림 ── */
  Editor.prototype.lock = async function () {
    const E = this; if (E.scope !== 'pub') return;
    const cur = await U2.store.get('ui2_locks', E.id);
    if (cur && cur.dev && cur.dev !== U2.dev() && Date.now() - Date.parse(cur.at) < U2.CFG.lockMin * 60e3) { E.lockedBy = cur.dev; E.status(); return; }
    const beat = () => U2.store.set('ui2_locks', E.id, { dev: U2.dev(), at: U2.now() });
    await beat(); E._beat = setInterval(beat, 4 * 60e3);
  };
  Editor.prototype.close = function (quiet) {
    const E = this; clearInterval(E._beat); if (E.scope === 'pub' && !E.lockedBy) U2.store.set('ui2_locks', E.id, { dev: '', at: U2.now() });
    clearTimeout(E._dt); if (E.dirty()) U2.ls.set(E.dkey(), { at: U2.now(), snap: E.snap() });
    document.removeEventListener('keydown', E._kd, true); removeEventListener('scroll', E._fit); removeEventListener('resize', E._fit); ['#u2-edtop', '#u2-eddrawer', '#u2-edprops'].forEach((s) => { const n = U2.$(s); if (n) n.remove(); });
    document.body.classList.remove('u2-editing'); const host = U2.$('#u2-page'); host.style.maxWidth = ''; host.classList.remove('u2-canvas');
    U2.edit = null; if (U2.view) { U2.view.destroy(); U2.view = null; }
    if (!quiet && E.dirty()) U2.toast('게시 안 한 고침은 이 기기 초안으로 남아 있습니다');
    U2.render({ reset: true });
  };
  U2.openEditor = (scope, opt) => { if (U2.edit) return; if (window.U2W && U2W.lazyLoad) U2W.lazyLoad().then(() => U2.edit && U2.edit.drawProps()).catch(() => {}); /* 편집할 때는 늦게 받는 위젯도 모두 */ scope = scope || (U2.isAdmin() ? 'pub' : 'mine'); if (scope === 'pub' && !U2.isAdmin()) scope = 'mine'; if (U2.view) { U2.view.destroy(); U2.view = null; } return new Editor(scope, opt); };
  U2.Editor = Editor;
})();
