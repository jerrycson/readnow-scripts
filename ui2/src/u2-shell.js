/* 리드나우 2 — 틀(머리줄·페이지·주소 길·메뉴·쓰기 허락·게시 기록·견본 배치·내보내기)
 * 배치 저장(정범님 Q4 ①·Q5 ①): 모든 기기 공용 배치 ui2_pages/<페이지>(관리자 기기만 게시) + 기기마다 개인 배치 ui2_prefs/<기기>(누구나)
 * 처음 모습(Q8 ①): 지금 웹앱과 똑같이 보이는 배치(탭 9개 = 페이지 9개 · 각 페이지 = 옛 머리줄 + 옛 탭 전체) · ②는 '견본 배치'로 고름
 * 주소 길: ?p=<페이지> · 뒤로 가기 상태 {u2:1} — 옛 화면(상세 층)의 뒤로 가기와 섞이지 않게 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const G = window.U2Grid, W = window.U2W, esc = (s) => U2.esc(s);
  const TABS = W.TABS;
  /* ── 기본 배치(Q8 ①) ── */
  U2.EXTRA_TABS = { pending: ['🔗', '연결 확정'], flags: ['🚩', '고객 표시'] }; /* 지금 웹앱에서 머리줄 단추로만 여는 탭 — 메뉴에는 안 둠 */
  U2.defaultSite = () => ({ ver: 1, rev: 0, nav: Object.entries(TABS).map(([id, [icon, title]]) => ({ id, title, icon })).concat([{ id: 'inbox', title: '할 일', icon: '📥' }]), theme: {}, writeOk: {}, lockAll: false }); /* 📥 할 일 받은편지함(N3 ★)은 맨 끝에 더함 — 지금 웹앱과 같은 10페이지는 그대로 */
  U2.defaultPage = (id) => {
    const t = TABS[id] || U2.EXTRA_TABS[id];
    if (t && id === 'projects') return { id, title: t[1], icon: t[0], grid: { rowH: 16, half: false, compact: false }, rev: 0, /* 🧪 프로젝트 = 지금 웹앱과 같게 + 맨 위 '🗓 새 웹앱 일정' 한 줄(11/05) */
      widgets: { hdr: { type: 'legacy.header', props: {} }, plan: { type: 'u2plan', props: {} }, main: { type: 'legacy.tab', props: { ref: id } } },
      layouts: { pc: [{ id: 'hdr', x: 0, y: 0, w: 24, h: 8 }, { id: 'plan', x: 0, y: 8, w: 24, h: 5 }, { id: 'main', x: 0, y: 13, w: 24, h: 40 }], tab: null, sm: null, phone: null } };
    if (t && U2.SCREEN_TABS && U2.SCREEN_TABS[id]) return { id, title: t[1], icon: t[0], grid: { rowH: 16, half: false, compact: false }, rev: 0,
      widgets: { hdr: { type: 'legacy.header', props: {} }, main: { type: 'legacy.dock', props: { title: t[1], scrs: U2.SCREEN_TABS[id] } } },
      layouts: { pc: [{ id: 'hdr', x: 0, y: 0, w: 24, h: 8 }, { id: 'main', x: 0, y: 8, w: 24, h: 40 }], tab: null, sm: null, phone: null } };
    if (t && id === 'channels') return { id, title: t[1], icon: t[0], grid: { rowH: 16, half: false, compact: false }, rev: 0, /* (0.4.12 · 통합 솔루션 · 약속 50) 🛒 판매처 = 지금 웹앱 판매처 탭 그대로 + 맨 위에 네 판매처 상황판·상품 하나 카드(읽기만 · 지금 웹앱 화면으로 한 번에) */
      widgets: { hdr: { type: 'legacy.header', props: {} }, cb: { type: 'chboard', props: {} }, pc: { type: 'prodch', props: {} }, main: { type: 'legacy.tab', props: { ref: id } } },
      layouts: { pc: [{ id: 'hdr', x: 0, y: 0, w: 24, h: 8 }, { id: 'cb', x: 0, y: 8, w: 24, h: 14 }, { id: 'pc', x: 0, y: 22, w: 24, h: 18 }, { id: 'main', x: 0, y: 40, w: 24, h: 40 }], tab: null, sm: null, phone: null } };
    if (t) return { id, title: t[1], icon: t[0], grid: { rowH: 16, half: false, compact: false }, rev: 0,
      widgets: { hdr: { type: 'legacy.header', props: {} }, main: { type: 'legacy.tab', props: { ref: id } } },
      layouts: { pc: [{ id: 'hdr', x: 0, y: 0, w: 24, h: 8 }, { id: 'main', x: 0, y: 8, w: 24, h: 40 }], tab: null, sm: null, phone: null } };
    if (id === 'inbox') { const p = { id, title: '할 일', icon: '📥', grid: { rowH: 16, half: false, compact: false }, rev: 0, widgets: {}, layouts: { pc: [], tab: null, sm: null, phone: null } }; const w = mk(p);
      w('h', 'heading', { text: '📥 할 일 받은편지함', size: 'l', guide: '흩어져 있던 처리할 일을 한곳에 — 숫자가 0이 아니면 빨강 · 누르면 그 화면으로' }, 0, 0, 24, 3);
      w('ib', 'inbox', {}, 0, 3, 14, 27); w('al', 'legacy.homecard', { ref: 'alerts', s_title: '오늘 확인할 것(지금 웹앱 홈 칸)' }, 14, 3, 10, 27); w('vw', 'views', { save: false }, 0, 30, 24, 4); /* (0.4.9) 받은편지함 7줄이 잘리지 않게 19 → 27 */ return p; }
    return { id, title: id, icon: '📄', grid: { rowH: 16, half: false, compact: false }, rev: 0, widgets: {}, layouts: { pc: [], tab: null, sm: null, phone: null } };
  };
  /* ── 견본 배치(Q8 ② · 설계안 5-7 빈 페이지 견본) — 시험 자료는 '손님A'처럼 개인 정보 없음 ── */
  const mk = (p) => (k, type, props, x, y, ww, h) => { p.widgets[k] = { type, props: Object.assign(W.defaults(type), props) }; p.layouts.pc.push({ id: k, x, y, w: ww, h }); };
  U2.TEMPLATES = {
    same: { name: '지금 웹앱과 똑같이(기본)', make: (id) => U2.defaultPage(id) },
    dash: { name: '대시보드형 견본', make: (id) => { const p = U2.defaultPage(id); const w = (k, type, props, x, y, ww, h) => { p.widgets[k] = { type, props: Object.assign(W.defaults(type), props) }; p.layouts.pc.push({ id: k, x, y, w: ww, h }); };
      p.widgets = {}; p.layouts = { pc: [], tab: null, sm: null, phone: null };
      w('t', 'heading', { text: '오늘 한눈에', size: 'xl' }, 0, 0, 16, 3); w('c', 'clock', { until: '14:00', label: '출고 마감까지' }, 16, 0, 8, 4);
      w('k1', 'kpi', { label: '오늘 주문', value: '12', prev: '9', unit: '건' }, 0, 4, 6, 5); w('k2', 'kpi', { label: '사람이 볼 것', value: '2', unit: '건', warnOver: '0', s_accent: 'red' }, 6, 4, 6, 5); w('k3', 'kpi', { label: '이번 달 매출', value: '3,450,000', unit: '원' }, 12, 4, 6, 5); w('k4', 'progress', { label: '오늘 출고', value: 5, max: 12 }, 18, 4, 6, 5);
      w('ch', 'chart', { kind: 'bar', data: '월:3, 화:5, 수:2, 목:6, 금:4', s_title: '이번 주 주문' }, 0, 9, 12, 12); w('tb', 'table', { data: '손님,권수,금액\n손님A,3,12000\n손님B,1,4500\n손님C,2,9000', s_title: '최근 주문(견본)' }, 12, 9, 12, 12);
      w('b1', 'cardbtn', { icon: '🚚', label: '오늘 출고', sub: '지금 웹앱 화면', act: 'screen', arg: 'ship' }, 0, 21, 6, 6); w('b2', 'cardbtn', { icon: '🧾', label: '주문·매출', act: 'page', arg: 'orders' }, 6, 21, 6, 6); w('b3', 'cardbtn', { icon: '📚', label: '상품', act: 'page', arg: 'products' }, 12, 21, 6, 6); w('m', 'memo', {}, 18, 21, 6, 6);
      return p; } },
    list: { name: '목록+상세 견본', make: (id) => { const p = U2.TEMPLATES.blank.make(id); const w = mk(p);
      w('vb', 'varbar', { vars: '판매처: 전체, 알라딘, 예스24\n기간: 오늘, 7일, 30일' }, 0, 0, 24, 3); w('q', 'search', { ph: '책 제목·주문번호', var: '찾기' }, 0, 3, 24, 3);
      w('tb', 'table', { data: '주문,손님,책,금액\nA-001,손님A,책 하나,12000\nA-002,손님B,책 둘,4500\nA-003,손님C,책 셋,9000', s_title: '목록(견본 — 자료 연결은 질의 위젯으로)' }, 0, 6, 16, 16);
      w('dt', 'card', { title: '고른 것', text: '찾기: {{찾기}}\n판매처: {{판매처}} · 기간: {{기간}}' }, 16, 6, 8, 8); w('vw', 'views', {}, 16, 14, 8, 8);
      p.layouts.pc.forEach((it) => { it.y += 8; }); w('lt', 'listtabs', {}, 0, 0, 24, 8); /* (0.4.10) 맨 위 = 지금 웹앱 큰 목록 보기 탭(⭐ 저장한 거르기) */ return p; } },
    flow: { name: '처리 흐름(단계 칸) 견본', make: (id) => { const p = U2.TEMPLATES.blank.make(id); const w = mk(p);
      w('h', 'heading', { text: '오늘 처리 흐름', size: 'l' }, 0, 0, 24, 3); w('bd', 'board', { cols: '① 주문 확인: 가, 나, 다\n② 송장: 라\n③ 발송 요청: 마, 바\n④ 끝: 사' }, 0, 3, 16, 14);
      w('pg', 'progress', { label: '오늘 출고', value: 1, max: 7 }, 16, 3, 8, 4); w('ck', 'checklist', { items: '상자 접기\n테이프 확인\n송장 붙이기\n사진 찍기' }, 16, 7, 8, 10);
      w('b', 'cardbtn', { icon: '🚚', label: '지금 웹앱 오늘 출고', act: 'screen', arg: 'ship' }, 0, 17, 8, 6); w('tl', 'timeline', { items: '09:00 | 주문 확인\n11:00 | 송장\n14:00 | 출고 마감' }, 8, 17, 8, 6);
      p.layouts.pc.forEach((it) => { if (it.id !== 'h') it.y += 9; }); w('sb', 'shipbar', {}, 0, 3, 24, 9); /* (0.4.9) 맨 위에 진짜 숫자 — 🚦 처리할 주문(지금 웹앱 셈 그대로) */ return p; } },
    settings: { name: '설정형 견본', make: (id) => { const p = U2.TEMPLATES.blank.make(id); const w = mk(p);
      w('h', 'heading', { text: '이 기기 설정', size: 'l' }, 0, 0, 24, 3); w('s1', 'switch', { label: '밤에는 출고 페이지 숨김', var: '밤숨김' }, 0, 3, 12, 2); w('s2', 'switch', { label: '진동 알림', var: '진동' }, 12, 3, 12, 2);
      w('ac', 'accordion', { items: '테마\n☰ 메뉴 → 테마에서 밝음·어두움·높은 대비\n---\n쓰기 허락\n☰ 메뉴 → 🔒 쓰기 허락(관리자 기기)\n---\n개인 배치\n✏ 꾸미기 → 📱 이 기기만' }, 0, 5, 16, 12); w('m', 'memo', {}, 16, 5, 8, 12); return p; } },
    shop: { name: '🛍 우리숍 책장 견본', make: (id) => { const p = U2.TEMPLATES.blank.make(id); const w = mk(p); /* (0.4.9 · 약속 53) 우리숍 블록을 페이지로 — 견본 책(지어낸 제목)으로 미리 보기 · 설정은 블록을 눌러 속성판에서 */
      w('h', 'heading', { text: '📚 우리숍 서가 책장 (미리 보기)', size: 'l', guide: '우리숍 손님 화면의 서가 책장을 그대로 — 블록을 누르고 오른쪽 속성판에서 나무 색·정렬·책등·글꼴·움직임을 바꿔 봄 · 여기서 바꾼 값은 이 페이지 배치에만(우리숍 손님 화면은 그대로)' }, 0, 0, 24, 3);
      w('sh', 'shop.shelf', {}, 0, 3, 24, 44); return p; } },
    omni: { name: '🛒 통합 판매처 견본', make: (id) => { const p = U2.TEMPLATES.blank.make(id); const w = mk(p); /* (0.4.12 · 통합 솔루션) 네 판매처를 한 화면 흐름으로 — 상황판 → 상품 하나 카드 → 처리할 주문 줄 */
      w('h', 'heading', { text: '🛒 통합 판매처 — 알라딘·예스24·네이버·우리숍 한 화면', size: 'l', guide: '숫자 칸을 누르면 그 일의 지금 웹앱 화면이 바로 열림 · 이 페이지는 읽기만(고치기는 🛠 처리할 일 화면에서)' }, 0, 0, 24, 3);
      w('cb', 'chboard', {}, 0, 3, 24, 14); w('sb', 'shipbar', {}, 0, 17, 24, 9); w('pc', 'prodch', {}, 0, 26, 14, 22); w('lt', 'listtabs', { lists: 'ledger, ordAll, y24All, shopAdm' }, 14, 26, 10, 22); return p; } },
    blank: { name: '빈 페이지', make: (id) => { const p = U2.defaultPage(id); p.widgets = {}; p.layouts = { pc: [], tab: null, sm: null, phone: null }; return p; } },
  };

  /* ── 상태 ── */
  U2.site = U2.ls.get('c:ui2_site/main', null) || U2.defaultSite();
  /* ── 메뉴 틀을 지금 웹앱 탭과 맞춤(11/11 · nav1 새 탭 묶음 🛒 판매처·🔬 연구 등) — 저장하지 않고 보이는 메뉴만 ──
   *  지금 웹앱 탭 차례(NAV_TABS 또는 #tabs 단추 차례)를 읽어 ① 새 탭은 W.TABS·메뉴에 저절로 더함(그 탭 전체 위젯 페이지) ② 메뉴를 한 번도 저장 안 했으면 차례도 지금 웹앱과 같게
   *  ③ 저장한 메뉴(관리자가 고친 것)는 차례를 바꾸지 않고 새로 생긴 탭만 옆 탭 뒤에 끼움(일부러 뺀 예전 탭은 다시 안 넣음) · 지금 웹앱에서 없어진 탭 페이지는 메뉴에 그대로(배치를 잃지 않음) */
  U2.TAB_ICON = { channels: '🛒', research: '🔬', ledger: '🧾' };
  /* (0.4.7) 지금 웹앱 탭 줄에 있지만 누르면 탭이 아니라 화면을 여는 것(🧾 통합 장부 = uxTabGo → openLedger · 1.78.481 nav1) → 그 페이지 기본 = 머리줄 + 그 화면 단추가 든 '옛 화면 자리' 칸 */
  U2.SCREEN_TABS = { ledger: 'ledger' };
  U2.BASE_TABS = Object.keys(TABS); /* 새 웹앱이 처음부터 아는 탭 — 저장한 메뉴에서 빠져 있으면 일부러 뺀 것으로 보고 다시 넣지 않음 */
  U2.legacyTabs = () => { let t = null; try { if (typeof NAV_TABS !== 'undefined' && NAV_TABS && NAV_TABS.length) t = NAV_TABS.map((x) => [x[0], String(x[1] || x[0])]); } catch (e) {}
    if (!t) { const bs = [...document.querySelectorAll('#tabs > button[data-tab]')]; if (bs.length) t = bs.map((b) => [b.dataset.tab, (b.textContent || '').replace(/\s+/g, ' ').trim() || b.dataset.tab]); }
    return (t || []).filter((x) => x[0] && !U2.EXTRA_TABS[x[0]]); };
  U2.syncNav = () => {
    const lt = U2.legacyTabs(); if (!lt.length) return false; let ch = false;
    lt.forEach(([k, name]) => { if (!TABS[k]) { TABS[k] = [U2.TAB_ICON[k] || '📄', name.replace(/^[\u{1F300}-\u{1FAFF}☀-➿️\s]+/u, '') || k]; ch = true; } });
    const nav = (U2.site.nav || []).slice(); const has = new Set(nav.map((n) => n.id)); const order = lt.map((x) => x[0]);
    if (U2.site._navAuto) { /* 저장한 적 없는 메뉴 = 지금 웹앱 차례 그대로 + (설정·할 일 등 나머지는 뒤에 예전 차례로) */
      const byId = new Map(nav.map((n) => [n.id, n])); const out = order.map((k) => byId.get(k) || { id: k, title: TABS[k][1], icon: TABS[k][0] }); nav.forEach((n) => { if (order.indexOf(n.id) < 0) out.push(n); });
      if (out.map((n) => n.id).join() !== nav.map((n) => n.id).join()) { U2.site.nav = out; ch = true; } return ch; }
    order.forEach((k, i) => { if (has.has(k) || U2.BASE_TABS.indexOf(k) >= 0) return; let at = -1; for (let j = i - 1; j >= 0 && at < 0; j--) at = nav.findIndex((n) => n.id === order[j]); nav.splice(at + 1, 0, { id: k, title: TABS[k][1], icon: TABS[k][0], auto: true }); has.add(k); ch = true; });
    if (ch) U2.site.nav = nav; return ch;
  };
  U2.site._navAuto = !(U2.ls.get('c:ui2_site/main', null) || {}).nav;
  U2.pages = {}; U2.prefs = null; U2.cur = null; U2.view = null; U2.edit = null;
  U2.pageForTab = (tab) => { const n = (U2.site.nav || []).find((x) => x.id === tab); if (n) return n.id; for (const [id, p] of Object.entries(U2.pages)) if (Object.values(p.widgets || {}).some((w) => w.type === 'legacy.tab' && w.props && w.props.ref === tab)) return id; return null; };
  U2.permKey = (w) => { if (!w) return ''; const p = w.props || {}; if (w.type === 'legacy.tab') return 'tab:' + p.ref; if (w.type === 'legacy.feat') return 'feat:' + p.feat; if (w.type === 'legacy.screen') return 'screen:' + p.scr; if (w.type === 'legacy.homecard') return 'home:' + p.ref; if (w.type === 'legacy.header') return 'header'; if (w.type === 'legacy.sec') return 'sec:' + p.ref; return ''; };
  /* 개인 배치가 있으면 그것을(Q4 ①) */
  U2.effective = (id) => { const pub = U2.pages[id] || U2.defaultPage(id); const mine = U2.prefs && U2.prefs.pages && U2.prefs.pages[id]; return mine ? Object.assign({}, pub, { layouts: mine.layouts, widgets: mine.widgets, grid: mine.grid || pub.grid, _mine: true, _basedOn: mine.basedOn }) : pub; };
  U2.layoutFor = (pg, bp) => {
    const L0 = pg.layouts || {}; let list = bp.k === 'pc' ? U2.clone(L0.pc || []) : G.overlay((L0.pc || []).filter((i) => !(((pg.widgets || {})[i.id] || {}).hide || {})[bp.k]), bp, L0[bp.k]); /* 좁은 폭 = PC에서 흘림 + 따로 고친 위젯 덮어쓰기(Q6) */
    const ids = new Set(list.map((i) => i.id));
    Object.keys(pg.widgets || {}).forEach((id) => { if (ids.has(id)) return; const d = W.defs[pg.widgets[id].type] || {}; const w = Math.min(bp.cols, Math.max(1, Math.round((d.w || 6) * bp.cols / 24))); const sp = G.findSpace(list, w, d.h || 4, bp.cols); list.push({ id, x: sp.x, y: sp.y, w, h: d.h || 4 }); });
    list = list.filter((i) => pg.widgets[i.id] && !((pg.widgets[i.id].hide || {})[bp.k]));
    return list;
  };

  /* ── 위젯 칸 그리기 ── */
  const frameStyle = (p) => { const s = []; if (p.s_bg === 'none') s.push('background:transparent;box-shadow:none;border-color:transparent'); else if (p.s_bg) s.push('background:var(--' + p.s_bg + ')'); if (p.s_accent) s.push('border-left:4px solid var(--' + p.s_accent + ')'); if (p.s_radius !== '' && p.s_radius != null) s.push('border-radius:' + (+p.s_radius || 0) + 'px'); if (p.s_shadow !== '' && p.s_shadow != null) s.push('box-shadow:' + (+p.s_shadow ? 'var(--u2-sh' + p.s_shadow + ')' : 'none')); if (p.s_pad !== '' && p.s_pad != null) s.push('--u2-pad:' + (+p.s_pad || 0) + 'px'); return s.join(';'); };
  U2.mountCell = (c, wid, pg, edit) => {
    if (c._u2off) { try { c._u2off(); } catch (e) {} c._u2off = null; }
    const w = pg.widgets[wid]; const d = W.defs[w && w.type];
    const p0 = Object.assign(W.defaults(w && w.type), (w && w.props) || {}); const R = edit ? { p: p0, dyn: false } : U2.data.resolve(p0); const p = R.p; c._dyn = R.dyn; /* '=식'·{{식}} 풀기(단계 5) */
    c.innerHTML = ''; const f = document.createElement('div'); f.className = 'u2-wf' + (d && d.legacy ? ' u2-wf-lg' : ''); f.style.cssText = frameStyle(p);
    if (p.s_pat && p.s_pat !== 'none') { const bg = document.createElement('div'); bg.className = 'u2-wpat'; bg.style.background = U2.theme.pattern(p.s_pat); f.appendChild(bg); }
    if (p.s_title) { const t = document.createElement('div'); t.className = 'u2-wt'; t.textContent = p.s_title; f.appendChild(t); }
    const b = document.createElement('div'); b.className = d && d.legacy ? 'u2-lg' : 'u2-b'; f.appendChild(b); c.appendChild(f);
    c.dataset.type = (w && w.type) || ''; const pk = U2.permKey(w); if (pk) c.dataset.perm = pk; else delete c.dataset.perm;
    if (!d) { b.innerHTML = '<div class="u2-empty">모르는 위젯: ' + esc(w && w.type) + '</div>'; return; }
    if (!p.guide && d && d.legacy && !edit) { try { if (w.type === 'legacy.homecard' && typeof W_DESC !== 'undefined' && W_DESC[p.ref]) p.guide = W_DESC[p.ref]; else { const it = U2.catalog && (U2.catalog.items || []).find((i) => i.perm === U2.permKey(w)); if (it && (it.desc || it.title)) p.guide = it.title + (it.desc ? ' — ' + it.desc : '') + (it.mem && it.mem.mb ? ' · 켜면 받는 자료 ≈' + it.mem.mb + 'MB' : ''); } } catch (e) {} if (w.type === 'legacy.tab' || w.type === 'legacy.header') p.guide = ''; } /* 📖 옛 기능 위젯은 지금 웹앱 설명(W_DESC·기능 찾기 설명)을 그대로(E7) */
    if (p.guide && !edit) { const gb = document.createElement('button'); gb.type = 'button'; gb.className = 'u2-guide-btn'; gb.textContent = 'ⓘ'; gb.setAttribute('aria-label', '이 위젯 설명'); gb.onclick = () => { let g = f.querySelector('.u2-guide'); if (g) return g.remove(); g = document.createElement('div'); g.className = 'u2-guide'; g.textContent = p.guide; f.appendChild(g); }; f.appendChild(gb); } /* 📖 위젯마다 설명(E7) — 누를 때만(톡 누르기 툴팁 아님) */
    const _t0 = performance.now(); try { const off = d.render(b, p, { wid, page: pg.id, edit: !!edit, cell: c, pg }); if (typeof off === 'function') c._u2off = off; else if (off && off.dyn) c._dyn = true; } catch (e) { b.innerHTML = '<div class="u2-empty">⚠ 위젯 오류: ' + esc(U2.errKo(e)) + '</div>'; console.error('[u2] 위젯', wid, e); } c._ms = Math.round((performance.now() - _t0) * 10) / 10; /* 위젯 성능 배지(E11)용 */
  };
  /* 옛 기능 위젯을 누르면 그 위젯 종류를 쓰기 막이에 알림(허락 목록과 견줌) */
  document.addEventListener('pointerdown', (e) => { const c = e.target.closest && e.target.closest('.u2-cell[data-perm]'); if (c) U2.setCtx(c.dataset.perm); }, true);
  document.addEventListener('keydown', (e) => { const c = e.target.closest && e.target.closest('.u2-cell[data-perm]'); if (c) U2.setCtx(c.dataset.perm); }, true);

  /* ── 페이지 그리기 ── */
  U2.render = (opt) => {
    opt = opt || {}; const host = U2.$('#u2-page'); if (!host) return;
    if (U2.edit && !opt.fromEditor) return U2.edit.refresh();
    const pg = U2.effective(U2.cur); const bp = G.bpOf(host.clientWidth || innerWidth);
    if (!U2.view || opt.reset || U2.view._pg !== pg.id || U2.view._edit) { if (U2.view) U2.view.destroy(); U2.view = new G.View(host, { onNew: (c, it) => U2.lazyMount(c, it), onGone: (c) => { if (U2._io) U2._io.unobserve(c); if (c._u2off) try { c._u2off(); } catch (e) {} if (c._ro) c._ro.disconnect(); } }); U2.view._pg = pg.id; }
    const v = U2.view; v.setup(bp.cols, (pg.grid && pg.grid.rowH) || G.ROW_H, pg.grid && pg.grid.half); v._bp = bp.k;
    let items = U2.layoutFor(pg, bp).filter((i) => U2.data.visible(pg.widgets[i.id])); /* 보이기 조건(단계 5) */ if (pg.grid && pg.grid.compact) G.compact(items); v._items = items;
    v.place(items, 0); autoH(v, pg);
    document.title = (pg.title || '') + ' · 리드나우 2';
    U2.$$('.u2-nav [data-pg]').forEach((x) => x.classList.toggle('on', x.dataset.pg === U2.cur)); if (U2.find) setTimeout(U2.find.paintQa, 400); /* 페이지가 바뀌면 지금 웹앱 머리줄이 있는지 다시 봄 */
    const mine = U2.$('#u2-mine'); if (mine) mine.hidden = !pg._mine;
    if (U2._firstMs == null) U2._firstMs = Math.round(performance.now()); /* 첫 화면 시각(설계안 8-1) */
    U2.emit('rendered', { page: pg.id, bp: bp.k, n: items.length });
  };
  /* 보이는 것만 그림(설계안 8-4): 화면에서 멀리(아래 1화면+800px 넘게) 있는 기본 위젯은 다가올 때 그림 · 멀어지면 비움(입력 위젯·식이 든 것·옛 기능은 늘 그림) */
  const KEEP = new Set(['search', 'select', 'date', 'number', 'input', 'checklist', 'rating', 'memo', 'switch', 'varbar', 'scan', 'fab', 'views']);
  U2.lazyMount = (c, it) => {
    const pg = U2.effective(U2.cur); const w = pg.widgets[it.id]; const d = W.defs[w && w.type] || {};
    const far = U2.CFG.lazyView !== false && !d.legacy && !d.autoH && !KEEP.has(w && w.type) && (it.y * ((pg.grid && pg.grid.rowH) || G.ROW_H)) > innerHeight + 800;
    if (!far) return U2.mountCell(c, it.id, pg, false);
    c.classList.add('u2-lazy'); c._lazy = true;
    if (!U2._io) U2._io = new IntersectionObserver((ents) => ents.forEach((en) => { const cell = en.target; if (!U2.view || U2.edit) return; const id = cell.dataset.wid; if (en.isIntersecting && cell._lazy) { cell._lazy = false; cell.classList.remove('u2-lazy'); U2.mountCell(cell, id, U2.effective(U2.cur), false); } else if (!en.isIntersecting && !cell._lazy && cell._lazyOk && !cell.contains(document.activeElement)) { if (cell._u2off) try { cell._u2off(); } catch (e) {} cell._u2off = null; cell.innerHTML = ''; cell._lazy = true; cell.classList.add('u2-lazy'); } }), { rootMargin: '800px 0px' });
    c._lazyOk = true; U2._io.observe(c);
  };
  U2.curPage = () => (U2.cur ? U2.effective(U2.cur) : null);
  /* 다른 페이지를 화면 안 층(모달·서랍)에 — 행동 '모달로 열기'(Wix 라이트박스) */
  U2.miniPage = async (id, cls) => {
    const pg = U2.pages[id] || (U2.pages[id] = await U2.loadPage(id)); const eff = U2.effective(id);
    const L = W.layer(cls || 'u2-modal', (eff.icon || '') + ' ' + (eff.title || id), ''); const body = L.querySelector('.u2-lbody'); body.classList.remove('u2-txt');
    const v = new G.View(body, { onNew: (c, it) => U2.mountCell(c, it.id, eff, false), onGone: (c) => { if (c._u2off) try { c._u2off(); } catch (e) {} } });
    const bp = G.bpOf(body.clientWidth || 600); v.setup(bp.cols, (eff.grid && eff.grid.rowH) || G.ROW_H, eff.grid && eff.grid.half);
    v.place(U2.layoutFor(eff, bp).filter((i) => !(W.defs[(eff.widgets[i.id] || {}).type] || {}).legacy && U2.data.visible(eff.widgets[i.id])), 0);
    const mo = new MutationObserver(() => { if (!L.isConnected) { v.destroy(); mo.disconnect(); } }); mo.observe(L.parentNode || document.body, { childList: true });
    return L;
  };
  /* 내용 길이에 맞춰 늘어나는 위젯(옛 탭 전체 등) — 보기 모드에서만 높이를 맞추고 아래 위젯을 밂(저장 안 함) */
  function autoH(v, pg) {
    for (const it of v._items) {
      const w = pg.widgets[it.id]; const d = W.defs[w && w.type]; if (!d || !d.autoH) continue; const c = v.cell(it.id); if (!c) continue; if (c._ro && c._fit) { c._fit(); continue; } /* 다시 그릴 때(변수·옛 자료 바뀜)마다 저장된 높이로 돌아가지 않게 곧바로 다시 맞춤 */
      const fit = () => { if (U2.view !== v || !c.isConnected) return; const f = c.firstChild; if (!f) return; const need = Math.max(2, Math.ceil((f.scrollHeight + 2) / v.rowH)); const cur = v._items.find((i) => i.id === it.id); if (!cur || cur.h === need) return; cur.h = need; G.resolve(v._items, it.id); v.place(v._items, 0); };
      c._fit = fit; c.classList.add('u2-autoh'); try { c._ro = new ResizeObserver(() => { cancelAnimationFrame(c._raf); c._raf = requestAnimationFrame(fit); }); c._ro.observe(c.firstChild); } catch (e) {} fit();
    }
  }
  let rzT; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (U2.edit) return U2.edit.refresh(); const host = U2.$('#u2-page'); if (U2.view && G.bpOf(host.clientWidth).k !== U2.view._bp) U2.render(); }, 150); });

  /* ── 페이지 오가기 ── */
  U2.go = async (id, o) => {
    o = o || {}; if (!id) return; if (U2.edit && !o.force) { U2.toast('편집 중 — 먼저 ◀ 보기로'); return; }
    U2.cur = id; if (!U2.pages[id]) { const pg = await U2.loadPage(id); if (U2.cur !== id) return; U2.pages[id] = pg; }
    /* 페이지 맞춤(11/05): 사람이 고른 페이지면 옛 상세 층(등록·출고 등)·점수 창을 닫고 그 페이지의 옛 탭으로 — 옛 코드가 탭을 바꿔 따라온 것(fromLegacy)은 연 층을 그대로 둠 */
    const shOn = !!(document.getElementById('sheet') && document.getElementById('sheet').classList.contains('on'));
    const stale = !!(history.state && !history.state.u2) && !(shOn && U2.dock && U2.dock.keep()); /* 옛 화면을 두는 설정이면 그 뒤로 가기 칸을 덮지 않음(뒤로 가기 = 먼저 옛 화면을 닫음) ·  옛 화면이 쌓은 뒤로 가기 칸({reg:1} 등) 위면 그 칸을 새 페이지로 덮음(뒤로 가기에 닫힌 층이 남지 않게) */
    if (U2.legacy && U2.legacy.syncTo) U2.legacy.syncTo(id, { keepOverlay: !!(o.fromLegacy || o.pop) });
    const url = '?p=' + encodeURIComponent(id) + location.hash;
    try { if (o.replace || (stale && !o.pop && !o.fromLegacy)) history.replaceState({ u2: 1, p: id }, '', url); else if (!o.pop) (shOn ? History.prototype.pushState : history.pushState).call(history, { u2: 1, p: id }, '', url); } catch (e) {} /* 옛 화면이 열린 채면 지금 웹앱이 감싼 pushState(= '상세 안에서 다른 상세를 엶'으로 보고 옛 화면 내용을 떼어 쌓음)를 건너뜀 — 떼면 함께 쓰던 등록 화면이 빈 화면이 됨(11/05 t_dual에서 찾음) */
    const r = (U2.ls.get('recent', []) || []).filter((x) => x !== id); r.unshift(id); U2.ls.set('recent', r.slice(0, 12));
    U2.render({ reset: true }); try { window.scrollTo(0, 0); } catch (e) {}
  };
  addEventListener('popstate', (e) => { const st = e.state; if (!(st && st.u2) && U2.cur && new URLSearchParams(location.search).get('p') !== U2.cur) { try { history.replaceState({ u2: 1, p: U2.cur }, '', '?p=' + encodeURIComponent(U2.cur) + location.hash); } catch (x) {} return; } /* 옛 화면 뒤로 가기 칸(그 화면을 연 페이지 주소)으로 돌아옴 = 옛 화면만 닫히고 지금 페이지는 그대로 → 주소를 지금 페이지로 맞춤 */ if (st && st.u2 && st.p && st.p !== U2.cur) { const sh = document.getElementById('sheet'); if (sh && sh.classList.contains('on')) { if (U2.dock && U2.dock.keep()) { try { History.prototype.pushState.call(history, { u2: 1, p: U2.cur }, '', '?p=' + encodeURIComponent(U2.cur) + location.hash); } catch (x) {} } return; } /* 옛 화면이 열린 채 뒤로 가기 = 지금 웹앱이 옛 화면을 닫거나(쌓인 앞 화면으로) — 함께 쓰는 중이면 페이지는 그대로 두고 주소·뒤로 가기 칸을 지금 페이지로 되돌림 */ U2.go(st.p, { pop: true, force: true }); } });

  /* ── 불러오기(읽기: 전체 설정 1 + 페이지 1 + 이 기기 1 = 3문서) ── */
  U2.loadPage = async (id) => (await U2.store.get('ui2_pages', id)) || U2.defaultPage(id);
  U2.loadAll = async () => {
    const s = await U2.store.get('ui2_site', 'main'); if (s) U2.site = Object.assign(U2.defaultSite(), s); U2.site._navAuto = !(s && s.nav);
    U2.guard.writeOk = U2.site.writeOk || {}; U2.guard.lockAll = !!U2.site.lockAll;
    U2.prefs = (await U2.store.get('ui2_prefs', U2.devKey())) || null;
    const id = U2.cur || 'home'; U2.pages[id] = await U2.loadPage(id);
    U2.theme.init(U2.site); U2.syncNav(); U2.drawBar(); if (!U2.edit) U2.render({ reset: true });
    try { U2.move && U2.move.sync(); } catch (e) {} /* 단계 13 이전 상태 맞추기(되돌렸으면 옛 주소로) */
  };
  U2.devKey = () => U2.dev().replace(/[\/\s]/g, '-');

  /* ── 머리줄 ── */
  U2.drawBar = () => {
    const bar = U2.$('#u2-bar'); if (!bar) return;
    const mode = U2.guard.lockAll ? '🔒 모두 막음' : Object.values(U2.guard.writeOk || {}).some((x) => x && x.on) ? '🔓 일부 허락' : '🔒 읽기만';
    bar.innerHTML = `<div class="u2-barrow"><a class="u2-brand" href="?p=home" data-pg="home">리드나우 2 <small>시범 ${esc(U2.ver)}</small></a>
      <span class="u2-chip" id="u2-mine" hidden title="이 기기 개인 배치를 쓰는 중">📱 이 기기 배치</span>
      <button type="button" class="u2-chip" id="u2-mode" title="쓰기 허락 보기">${mode}</button><span class="u2-chip u2-warnchip" id="u2-both" hidden>⚠ 다른 리드나우 탭도 열려 있음(메모리 2배 — 하나만 여세요)</span>
      <span class="u2-sp"></span>${U2.find ? U2.find.barHtml() : ''}<button type="button" class="u2-btn" id="u2-editbtn" aria-label="꾸미기" title="꾸미기(편집기)">✏<span class="u2-nosm"> 꾸미기</span></button><button type="button" class="u2-btn" id="u2-menubtn" aria-label="메뉴">☰</button></div>
      <nav class="u2-nav" aria-label="페이지">${(U2.site.nav || []).filter((n) => !n.hide).map((n) => `<a href="?p=${encodeURIComponent(n.id)}" data-pg="${esc(n.id)}" class="${n.id === U2.cur ? 'on' : ''}">${esc(n.icon || '')} ${esc(n.title)}</a>`).join('')}</nav>`;
    bar.querySelectorAll('[data-pg]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); U2.go(a.dataset.pg); }));
    U2.$('#u2-editbtn').onclick = () => U2.openEditor && U2.openEditor();
    U2.$('#u2-menubtn').onclick = () => U2.menu();
    U2.$('#u2-mode').onclick = () => U2.permScreen();
    if (U2._both) U2.$('#u2-both').hidden = false;
    /* (0.4.9) 페이지 줄이 가로로 넘칠 때(휴대폰 · 페이지 13개) 지금 페이지를 보이는 곳 가운데로 — 예전엔 늘 맨 앞(🏠 홈)이 보여 '📥 할 일'에 있어도 줄에서 안 보임 */
    try { const on = bar.querySelector('.u2-nav a.on'); const nv = on && on.parentNode; if (nv && nv.scrollWidth > nv.clientWidth + 2) { const r = on.getBoundingClientRect(), nr = nv.getBoundingClientRect(); nv.scrollLeft += (r.left - nr.left) - (nv.clientWidth - r.width) / 2; } } catch (e) {}
    const pg = U2.cur && U2.effective(U2.cur); U2.$('#u2-mine').hidden = !(pg && pg._mine);
    if (U2.find) U2.find.bindBar(bar); /* ⚡ 빠른 작업 · 🔎 어디서나 찾기(u2-find.js · 0.4.5) */
    if (U2.pilotBar) U2.pilotBar(); /* 맨 위 시범 띠 + ✅ 체크리스트 열기(u2-check.js) */
  };
  U2.banner = (id, html, tone) => { let b = document.getElementById(id); if (!html) { if (b) b.remove(); return; } if (!b) { b = document.createElement('div'); b.id = id; b.className = 'u2-banner ' + (tone || ''); U2.$('#u2-banners').appendChild(b); } b.innerHTML = html; return b; };

  /* ── 화면 안 판(층) ── */
  U2.panel = (title, html, cls) => { const L = W.layer('u2-modal u2-panel ' + (cls || ''), title, ''); L.querySelector('.u2-lbody').classList.remove('u2-txt'); L.querySelector('.u2-lbody').innerHTML = html; return L; };
  U2.menu = () => {
    const adm = U2.isAdmin(); const pg = U2.effective(U2.cur);
    /* (0.4.11 · 성공 사례 견줌 '메뉴를 할 일 갈래로'·'한 일의 설정은 한 곳' — Amazon 판매자 센터 메뉴 갈래 · Shopify 배송 설정 한 곳)
     *  예전엔 한 줄로 늘어선 단추 14개 → 할 일 갈래 6(모양·옛 화면·보기·배치·안전·살피기) · ⭐ 저장한 보기 두 가지(자료 보기 · 📋 목록 보기 탭)를 한 곳에서 열고 지움 · 단추·하는 일은 그대로 */
    const L = U2.panel('메뉴', `<div class="u2-col u2-menu">
      ${U2.checkScreen ? (() => { const s = U2.check.sum(); return `<button type="button" class="u2-btn u2-pri" data-m="check">✅ 시범 체크리스트 (단계 12 · ✓ ${s.ok}/${s.total}${s.no ? ' · ✕ ' + s.no : ''})</button>`; })() : ''}
      <button type="button" class="u2-btn" data-m="settoc">⚙ 설정 목차·찾기 <small class="u2-sub">(지금 웹앱 설정 + 이 웹앱 설정 · Ctrl+K ⚙)</small></button>
      <div class="u2-mg" data-mg="look"><div class="u2-mgh">🎨 모양</div>
      <div class="u2-sec"><b>테마(이 기기)</b><div class="u2-row">${Object.entries(U2.theme.THEMES).map(([k, t]) => `<button type="button" class="u2-btn ${U2.theme.cur === k ? 'u2-pri' : ''}" data-th="${k}">${esc(t.name)}</button>`).join('')}</div></div>
      ${adm ? `<div class="u2-sec"><b>공용 모양(관리자 · 모든 기기 기본)</b><div class="u2-row">
        <label class="u2-lab">강조 색 <input type="color" class="u2-in" data-st="--cloth" value="${esc((U2.site.theme.tokens || {})['--cloth'] || U2.theme.LIGHT['--cloth'])}"></label>
        <label class="u2-lab">둥근 정도(px) <input type="number" class="u2-in" data-sh="--u2-radius" min="0" max="24" value="${parseInt((U2.site.theme.shape || {})['--u2-radius'] || '10', 10)}"></label>
        <label class="u2-lab">글꼴 <select class="u2-in" data-font>${Object.entries(U2.theme.FONTS).map(([k, f]) => `<option value="${k}" ${U2.site.theme.font === k ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>
        <label class="u2-lab">기본 테마 <select class="u2-in" data-def>${Object.entries(U2.theme.THEMES).map(([k, t]) => `<option value="${k}" ${U2.site.theme.def === k ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label></div>
        <button type="button" class="u2-btn u2-pri" data-m="savetheme">공용 모양 저장</button> <span class="u2-hint" data-contrast></span></div>` : ''}
      </div>
      <div class="u2-mg" data-mg="dock"><div class="u2-mgh">🪟 옛 화면</div>
      ${U2.dock ? (() => { const c = U2.dock.cfg(); const B = (k, v, t) => `<button type="button" class="u2-btn ${c[k] === v ? 'u2-pri' : ''}" data-dkset="${k}:${v}" aria-pressed="${c[k] === v}">${t}</button>`; return `<div class="u2-sec" data-dksec><b>🪟 옛 화면(등록·출고 등 · 이 기기)</b>
        <div class="u2-row"><span class="u2-sub">페이지 바꿀 때</span>${B('keep', 'keep', '두기 — 페이지와 함께 씀')}${B('keep', 'close', '닫기')}</div>
        <div class="u2-row"><span class="u2-sub">넓은 화면 자리</span>${B('pos', 'side', '◫ 오른쪽 나란히')}${B('pos', 'full', '⤢ 전체(머리 아래)')}<span class="u2-sub">폭 ${Math.round((+c.w || 0.5) * 100)}%</span><button type="button" class="u2-btn" data-dkset="w:0.5">반반으로</button></div>
        <p class="u2-hint">옛 화면은 한 번에 하나입니다(지금 웹앱이 상세 화면을 한 층에만 그림 — 등록 화면을 연 채 출고를 열면 등록 화면이 출고로 바뀜). 그 하나를 새 웹앱 페이지와 함께 씁니다: 넓은 화면(${U2.dock.MIN_W}px 넘음)은 오른쪽 나란히(가운데 손잡이를 끌어 폭 조절 · 기억), 휴대폰은 페이지를 바꾸면 접히고 아래 '▸ 펼치기'로 다시. 페이지에 '🪟 옛 화면 자리' 위젯을 두면 그 칸 안에 열립니다. ✕ 닫기·Esc·뒤로 가기로 닫음.</p></div>`; })() : ''}
      </div>
      <div class="u2-mg" data-mg="views"><div class="u2-mgh">⭐ 보기</div>
      <div class="u2-sec" data-mgsec="views"><b>⭐ 저장한 보기 <small class="u2-sub">— 자료 보기·📋 목록 보기를 한 곳에서</small></b><div class="u2-row"><span class="u2-sub">자료 보기</span>${U2.data.views().map((v) => `<button type="button" class="u2-btn" data-view="${esc(v.name)}">${esc(v.name)} <small class="u2-sub">${esc(v.scope)}</small></button>`).join('') || '<span class="u2-sub">없음</span>'}</div>
        <div class="u2-row"><input class="u2-in" style="width:160px" data-vname placeholder="지금 보기 이름" aria-label="지금 보기 이름"><button type="button" class="u2-btn" data-m="vsave">이 기기에 저장</button>${adm ? '<button type="button" class="u2-btn" data-m="vsavepub">공용으로 저장</button>' : ''}</div>
        ${window.U2W && U2W.lvAll ? `<div class="u2-row" data-mlv><span class="u2-sub">📋 목록 보기</span>${U2W.lvAll().map((v, i) => `<span class="u2-lvv"><button type="button" class="u2-btn" data-mlvo="${i}" title="${esc(v.title + ' · ' + U2W.lvDesc(v))}">⭐ ${esc(v.name)}</button><button type="button" class="u2-lvx" data-mlvx="${i}" aria-label="목록 보기 지우기: ${esc(v.name)}" title="지우기(이 기기 · 10초 안 되돌리기)">×</button></span>`).join('') || '<span class="u2-sub">없음 — 📋 목록 보기 탭 위젯에서 ＋ 지금 보기 저장</span>'}</div>` : ''}
      </div>
      </div>
      <div class="u2-mg" data-mg="lay"><div class="u2-mgh">📐 배치(페이지 꾸미기)</div>
      <button type="button" class="u2-btn" data-m="mine">📱 이 기기 화면 꾸미기 (개인 배치)</button>
      ${pg._mine ? '<button type="button" class="u2-btn" data-m="unmine">↩ 이 페이지 개인 배치 끄고 공용으로</button>' : ''}
      <button type="button" class="u2-btn" data-m="export">⬇ 배치 내보내기(JSON 파일)</button>
      <label class="u2-btn u2-file">⬆ 배치 가져오기 <input type="file" accept="application/json" data-m="import" hidden></label>
      </div>
      <div class="u2-mg" data-mg="safe"><div class="u2-mgh">🔒 안전</div>
      <button type="button" class="u2-btn" data-m="perm">🔒 쓰기 허락 (위젯마다 · 기본 모두 꺼짐)</button>
      <button type="button" class="u2-btn" data-m="watch">🩺 충돌 감시 보기</button>
      </div>
      <div class="u2-mg" data-mg="see"><div class="u2-mgh">🧭 살피기·옮기기</div>
      <button type="button" class="u2-btn" data-m="track">🔁 따라잡기 표</button>
      <button type="button" class="u2-btn" data-m="plan">🗓 전체 일정·진행(설계안 단계 0~13)</button>
      <button type="button" class="u2-btn" data-m="move">🚚 이전(단계 13 · 옮기기 ㉮)${U2.move && U2.move.cur().state === 'on' ? ' — 옮김' : ''}</button>
      ${U2.move && U2.move.cur().state === 'on' ? `<a class="u2-btn" data-oldlink href="${esc(U2.move.oldUrl())}">↩ 옛 화면(지금 웹앱 · ${U2.move.daysLeft()}일 남음)</a>` : `<a class="u2-btn" data-oldlink href="${esc(U2.base)}">↩ 지금 웹앱으로 가기</a>`}
      </div>
      <p class="u2-hint">이 기기: <b>${esc(U2.dev())}</b> · ${adm ? '관리자 기기(공용 배치 게시 가능)' : '관리자 기기 아님(개인 배치만)'} · 지금 웹앱 ${esc(U2.legacy.appVer || '불러오지 못함')} · 새 웹앱 ${esc(U2.ver)}</p></div>`);
    L.querySelectorAll('[data-dkset]').forEach((b) => (b.onclick = () => { const [k, v] = b.dataset.dkset.split(':'); U2.dock.set({ [k]: k === 'w' ? +v : v }); L.remove(); U2.menu(); U2.toast(k === 'keep' ? (v === 'keep' ? '페이지를 바꿔도 옛 화면을 둠' : '페이지를 바꾸면 옛 화면을 닫음') : k === 'pos' ? (v === 'side' ? '옛 화면을 오른쪽 나란히' : '옛 화면을 전체로') : '옛 화면 폭 반반'); }));
    L.querySelectorAll('[data-th]').forEach((b) => (b.onclick = () => { U2.theme.choose(b.dataset.th); L.remove(); U2.render({ reset: true }); }));
    const m = (k, f) => { const b = L.querySelector('[data-m="' + k + '"]'); if (b) b[k === 'import' ? 'onchange' : 'onclick'] = (e) => { f(e); }; };
    const readT = () => { const th = U2.clone(U2.site.theme || {}); const c = L.querySelector('[data-st]'); if (!c) return th; th.tokens = Object.assign({}, th.tokens, { '--cloth': c.value }); th.shape = Object.assign({}, th.shape, { '--u2-radius': (+L.querySelector('[data-sh]').value || 0) + 'px' }); th.font = L.querySelector('[data-font]').value; th.def = L.querySelector('[data-def]').value; return th; };
    const prev = () => { const th = readT(); U2.theme.site = th; U2.theme.apply(U2.theme.cur); const r = U2.theme.contrast(th.tokens['--cloth'], U2.theme.LIGHT['--paper']); const o = L.querySelector('[data-contrast]'); if (o) o.textContent = '강조 색·흰 바탕 대비 ' + r.toFixed(2) + ':1' + (r < 4.5 ? ' ⚠ 4.5 아래 — 글자가 잘 안 보일 수 있음' : ' ✓'); };
    L.querySelectorAll('[data-st],[data-sh],[data-font],[data-def]').forEach((x) => x.addEventListener('input', prev));
    m('savetheme', (e) => { const was = U2.clone(U2.site.theme || {}); U2.twice(e.currentTarget, '모든 기기 기본 모양 바꿈', async () => { U2.site.theme = readT(); await U2.store.set('ui2_site', 'main', { theme: U2.site.theme }, true); },
      { done: '공용 모양 저장', undo: async () => { U2.site.theme = was; await U2.store.set('ui2_site', 'main', { theme: was }, true); U2.theme.site = was; U2.theme.apply(U2.theme.cur); U2.toast('공용 모양을 예전으로 되돌림'); } }); }); /* (0.4.10) 되돌리기 10초 */
    L.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => { L.remove(); U2.data.openView(b.dataset.view).catch((e) => U2.toast(e.message, 1)); }));
    const vs = (pub) => () => U2.data.saveView(L.querySelector('[data-vname]').value, pub).then((v) => { U2.toast('보기 저장: ' + v.name); L.remove(); }).catch((e) => U2.toast(e.message, 1));
    m('vsave', vs(false)); m('vsavepub', vs(true));
    m('perm', () => { L.remove(); U2.permScreen(); }); m('mine', () => { L.remove(); U2.openEditor('mine'); });
    m('unmine', (e) => U2.twice(e.currentTarget, '개인 배치 끔(공용 배치로)', async () => { const pid = U2.cur; const keep = U2.clone(U2.prefs.pages[pid]); delete U2.prefs.pages[pid]; await U2.savePrefs(); L.remove(); U2.render({ reset: true });
      /* (0.4.6 · 견줌 ⑪) 끈 개인 배치를 10초 안에 되살림 */ U2.toast('공용 배치로 돌아감', false, 0, { act: { label: '↶ 되돌리기', fn: async () => { U2.prefs = U2.prefs || { pages: {} }; U2.prefs.pages = U2.prefs.pages || {}; U2.prefs.pages[pid] = keep; await U2.savePrefs(); if (U2.cur === pid) U2.render({ reset: true }); U2.toast('이 기기 개인 배치를 되살림'); } } }); }));
    m('export', () => U2.exportJson()); m('import', (e) => { const f = e.target.files[0]; if (f) U2.importJson(f).then(() => L.remove()); });
    m('settoc', () => { L.remove(); if (U2.find && U2.find.openSettings) U2.find.openSettings(); });
    L.querySelectorAll('[data-mlvo]').forEach((b) => (b.onclick = () => { const v = U2W.lvAll()[+b.dataset.mlvo]; if (!v) return; L.remove(); U2W.lvOpen(v.scr, v); }));
    L.querySelectorAll('[data-mlvx]').forEach((b) => (b.onclick = () => { const all = U2W.lvAll(); const v = all[+b.dataset.mlvx]; if (!v) return; U2.ls.set('listViews', all.filter((y) => y !== v)); U2.emit('listViews'); L.remove(); U2.menu();
      U2.toast('보기 지움: ⭐ ' + v.name, false, 0, { act: { label: '↶ 되돌리기', fn: () => { U2.ls.set('listViews', U2W.lvAll().filter((y) => y.name !== v.name).concat([v])); U2.emit('listViews'); U2.toast('되살림: ⭐ ' + v.name); } } }); }));
    m('watch', () => { L.remove(); U2.watchScreen(); }); m('track', () => { L.remove(); U2.trackScreen(); }); m('plan', () => { L.remove(); U2.planScreen(); }); m('move', () => { L.remove(); U2.moveScreen(); }); m('check', () => { L.remove(); U2.checkScreen(); });
  };
  U2.savePrefs = async () => { U2.prefs = U2.prefs || { pages: {} }; U2.prefs.at = U2.now(); U2.prefs.dev = U2.dev(); await U2.store.set('ui2_prefs', U2.devKey(), U2.prefs); };

  /* ── 쓰기 허락 화면(정범님 Q3: 처음엔 읽기만 → 위젯마다 정범님이 직접 골라 켬 · 기본 모두 꺼짐) ── */
  U2.permKeys = () => {
    const ks = new Map(); ks.set('header', '지금 웹앱 머리줄(찾기·설정 단추)');
    Object.entries(TABS).forEach(([k, v]) => ks.set('tab:' + k, '지금 웹앱 탭 — ' + v.join(' ')));
    Object.values(U2.pages).forEach((p) => Object.values(p.widgets || {}).forEach((w) => { const k = U2.permKey(w); if (k && !ks.has(k)) ks.set(k, (W.defs[w.type] || {}).name + ' — ' + k.split(':').slice(1).join(':')); }));
    Object.keys(U2.site.writeOk || {}).forEach((k) => { if (!ks.has(k)) ks.set(k, k); });
    return ks;
  };
  U2.permScreen = () => {
    const adm = U2.isAdmin(); const ok = U2.site.writeOk || {};
    /* (0.4.6) 칸까지 허락 — 켠 위젯도 고른 칸(컬렉션)에만 씀 · 칸 칩: 허락한 칸(진함) + 이 기기에서 쓰려다 막힌 칸(눌러서 더함) · 칸 이름 직접 더하기 */
    const colsOf = (k) => { const o = ok[k] || {}; return [...new Set([].concat(o.cols || [], U2.guard.wanted(k)))]; };
    const chips = (k) => { const o = ok[k] || {}; const cs = colsOf(k); const al = new Set(o.cols || []);
      return `<div class="u2-row u2-pcols" data-pc="${esc(k)}">${cs.map((c) => `<button type="button" class="u2-chip ${al.has(c) ? 'u2-pri' : ''}" data-col="${esc(c)}" aria-pressed="${al.has(c)}" ${adm && o.on ? '' : 'disabled'} title="${al.has(c) ? '허락한 칸 — 누르면 뺌' : '쓰려다 막힌 칸 — 누르면 허락'}">${al.has(c) ? '✓ ' : '＋ '}${esc(c)}</button>`).join('') || '<span class="u2-sub">칸 없음 — 켜면 아무 칸에도 못 씀(위젯을 한 번 써 보면 쓰려던 칸이 여기 뜸)</span>'}${adm && o.on ? `<input class="u2-in" style="width:130px" data-addcol placeholder="칸 이름" aria-label="허락할 칸 이름"><button type="button" class="u2-btn" data-addbtn>칸 더하기</button>` : ''}</div>`; };
    const rows = [...U2.permKeys()].map(([k, name]) => { const o = ok[k]; return `<tr><td>${esc(name)}${chips(k)}</td><td>${o && o.on ? `<b class="u2-t-red">켜짐</b><br><small>${esc(o.by || '')} · ${esc((o.at || '').slice(0, 16).replace('T', ' '))}</small><br><small>칸 ${(o.cols || []).length}개</small>` : '<span class="u2-sub">꺼짐</span>'}</td><td><button type="button" class="u2-btn ${o && o.on ? '' : 'u2-pri'}" data-k="${esc(k)}" ${adm ? '' : 'disabled'}>${o && o.on ? '끄기' : '켜기'}</button></td></tr>`; }).join('');
    const L = U2.panel('🔒 쓰기 허락', `<p class="u2-hint">시범 동안 새 웹앱은 <b>읽기만</b> 합니다 — 주문·상품·가격을 바꾸는 단추는 막히고 '지금 웹앱에서' 안내가 나옵니다. 정범님이 아래에서 <b>위젯마다 직접 켠 것만</b>, 그것도 <b>고른 칸(컬렉션)에만</b> 실제 자료를 바꿀 수 있습니다(켠 기기·시각이 남고 언제든 끔). 칸 칩: ✓ 허락한 칸 · ＋ 이 기기에서 쓰려다 막힌 칸. 새 웹앱 자기 배치(ui2_ 칸)는 늘 저장됩니다.</p>
      ${adm ? '' : '<p class="u2-banner u2-warn">이 기기는 관리자 기기가 아니라 볼 수만 있습니다.</p>'}
      <label class="u2-sw"><input type="checkbox" data-lockall ${U2.site.lockAll ? 'checked' : ''} ${adm ? '' : 'disabled'}><span></span>비상: 허락한 것까지 모두 막기</label>
      <div class="u2-tblw"><table class="u2-tbl u2-perm"><thead><tr><th>위젯 · 칸</th><th>지금</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="u2-hint">막은 쓰기: 이 기기에서 ${U2.guard.blocked.length}번(내용 없이 칸 이름만 ui2_blocked에 기록) · 그중 켠 위젯이 허락 밖 칸에 ${U2.guard.blocked.filter((b) => b.out).length}번</p>`);
    const save = async (k, v, msg) => { U2.site.writeOk = Object.assign({}, U2.site.writeOk, { [k]: v }); U2.site.writeLog = (U2.site.writeLog || []).concat([Object.assign({ k }, v)]).slice(-50); U2.guard.writeOk = U2.site.writeOk; await U2.store.set('ui2_site', 'main', { writeOk: U2.site.writeOk, writeLog: U2.site.writeLog }, true); L.remove(); U2.drawBar(); U2.permScreen(); U2.toast(msg); };
    L.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { const k = b.dataset.k; const on = !(ok[k] && ok[k].on); const cols = on ? colsOf(k) : (ok[k] && ok[k].cols) || []; const run = () => save(k, { on, by: U2.dev(), at: U2.now(), cols }, (on ? '쓰기 켬: ' : '쓰기 끔: ') + k + (on ? ' · 칸 ' + (cols.join(', ') || '없음') : '')); if (on) U2.twice(b, '쓰기 켬 (' + k + ' · 칸 ' + (cols.join(', ') || '없음') + ')', run); else run(); }));
    L.querySelectorAll('.u2-pcols').forEach((r) => { const k = r.dataset.pc; const o = () => Object.assign({}, ok[k] || {}); const put = (cols, msg) => save(k, Object.assign(o(), { cols, by: U2.dev(), at: U2.now() }), msg);
      r.querySelectorAll('[data-col]').forEach((c) => (c.onclick = () => { const col = c.dataset.col; const cur = (ok[k] && ok[k].cols) || []; if (cur.indexOf(col) >= 0) put(cur.filter((x) => x !== col), '칸 뺌: ' + col + ' (' + k + ')'); else U2.twice(c, '칸 허락 ' + col, () => put(cur.concat([col]), '칸 허락: ' + col + ' (' + k + ')')); }));
      const ab = r.querySelector('[data-addbtn]'); if (ab) ab.onclick = () => { const col = (r.querySelector('[data-addcol]').value || '').trim(); if (!/^[\w:-]{2,60}$/.test(col) || /^ui2_/.test(col)) return U2.toast('칸 이름은 영문·숫자·_ 2~60자(ui2_ 칸은 늘 허락)', true); const cur = (ok[k] && ok[k].cols) || []; if (cur.indexOf(col) >= 0) return U2.toast('이미 허락한 칸'); U2.twice(ab, '칸 허락 ' + col, () => put(cur.concat([col]), '칸 허락: ' + col + ' (' + k + ')')); }; });
    const la = L.querySelector('[data-lockall]'); if (la) la.onchange = async () => { U2.site.lockAll = la.checked; U2.guard.lockAll = la.checked; await U2.store.set('ui2_site', 'main', { lockAll: la.checked }, true); U2.drawBar(); U2.toast(la.checked ? '모두 막음' : '허락한 것은 다시 통과'); };
  };
  U2.watchScreen = () => { const r = U2.guard.report(); U2.panel('🩺 충돌 감시', `<div class="u2-tblw"><table class="u2-tbl"><tbody>${[['쓰는 기억(힙)', r.heapMB == null ? '이 브라우저는 못 잼' : r.heapMB + 'MB'], ['긴 멈춤(200ms 넘음)', r.longTasks], ['살아 있는 반복 타이머', r.intervals], ['겹친 id', r.dupIds], ['막은 쓰기', r.blockedWrites], ['rn2- 밖 새 기기 저장 열쇠', (r.newKeys || []).join(', ') || '없음'], ['불러오기 걸린 시간', (U2.legacy.loadMs || '-') + 'ms'], ['배치 읽은 문서', U2.stat.reads]].map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div><p class="u2-hint">5분마다 ui2_perf/기기_날짜 한 문서에 덮어 씀</p>`); };
  U2.trackScreen = async () => {
    let J = null; for (const u of ['https://raw.githubusercontent.com/jerrycson/readnow-ui2/track/TRACK.json', 'TRACK.json']) { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { J = await r.json(); break; } } catch (e) {} } /* 30분마다 고쳐지는 track 가지 먼저 · 없으면 이 판에 든 표 */
    const rows = J && J.rows ? J.rows.slice().reverse() : []; const cnt = (st) => rows.filter((r) => r.state === st).length;
    const it = (o) => Object.entries(o || {}).map(([k, v]) => ({ tab: '탭', feat: '기능', screen: '화면', sec: '섹션', widget: '홈 칸' }[k] + ' ' + v.length)).join(' · ') || '—';
    const bad = U2.adapters && U2.adapters.bad && U2.adapters.bad.length ? `<p class="u2-banner u2-warn">⚠ 지금 불러온 판에서 깨진 계약: ${U2.esc(U2.adapters.bad.map((b) => b.n + ' ' + b.why).join(', '))}</p>` : '';
    U2.panel('🔁 따라잡기 표', `<p class="u2-hint">지금 웹앱 판마다 새 웹앱에 반영할 것(tools/track.js가 저절로 · 마지막 ${U2.esc((J && J.at || '').slice(0, 16).replace('T', ' '))}) — ⬜ 할 일 ${cnt('⬜')} · ❌ 계약 깨짐 ${cnt('❌')} · ✅ 반영 ${cnt('✅')} · ➖ ${cnt('➖')}</p>${bad}
      ${rows.length ? `<div class="u2-tblw"><table class="u2-tbl u2-track"><thead><tr><th>판</th><th>날짜</th><th>바뀐 것</th><th>새로 생김</th><th>계약</th><th>반영</th></tr></thead><tbody>${rows.slice(0, 80).map((r) => `<tr><td>${U2.esc(r.app)}</td><td>${U2.esc(r.date || r.at)}</td><td>${U2.esc(r.change)}</td><td>${U2.esc(it(r.newItems))}</td><td>${r.contract === 'ok' ? '✅' : '❌ ' + U2.esc([].concat(r.contract).join(', '))}</td><td>${U2.esc(r.state)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="u2-hint">표를 받지 못함</p>'}`);
  };
  /* ── 🗓 전체 일정·진행(설계안 단계 0~13) — TRACK.json의 plan(30분마다 track 가지) → 없으면 이 판 PLAN.json · 진행 중 단계(시범 운행 14일)는 지금 시각으로 셈 ── */
  U2.loadPlan = async () => { for (const u of ['https://raw.githubusercontent.com/jerrycson/readnow-ui2/track/TRACK.json', 'TRACK.json', 'PLAN.json']) { try { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) continue; const j = await r.json(); const P = j && (j.kind === 'readnow-ui2-plan' ? j : j.plan); if (P && P.stages) return (U2._plan = P); } catch (e) {} } return null; };
  const PST = { done: ['✅', '끝', 'u2-pl-done'], doing: ['⏳', '진행 중', 'u2-pl-doing'], boss: ['🙋', '정범님 필요', 'u2-pl-boss'], todo: ['⬜', '아직', 'u2-pl-todo'] };
  U2.planPct = (s, now) => { if (s.state === 'done' || s.state === 'boss') return 100; if (s.state === 'todo') return 0; if (s.pct != null) return Math.max(0, Math.min(100, +s.pct)); if (s.days && s.start) return Math.max(0, Math.min(99, Math.round(((now - Date.parse(s.start)) / 864e5 / s.days) * 100))); return 0; };
  U2.planSum = (P, now) => { now = now || Date.now(); const S0 = (P && P.stages) || []; const est = S0.reduce((a, s) => a + (+s.estH || 0), 0); const dh = S0.reduce((a, s) => a + (+s.estH || 0) * U2.planPct(s, now) / 100, 0); const g = {}; S0.forEach((s) => { if (s.group && s.start && s.end) g[s.group] = Math.round((Date.parse(s.end) - Date.parse(s.start)) / 6e4); }); const act = S0.reduce((a, s) => a + (s.group ? 0 : +s.actMin || 0), 0) + Object.values(g).reduce((a, b) => a + b, 0); const cnt = {}; Object.keys(PST).forEach((k) => (cnt[k] = S0.filter((s) => s.state === k).length)); const cur = S0.find((s) => s.state === 'doing') || S0.find((s) => s.state === 'todo') || null; return { est, doneH: Math.round(dh * 10) / 10, pct: est ? Math.round((dh / est) * 100) : 0, act, g, cnt, n: S0.length, cur }; };
  const hmin = (m) => (m == null ? '—' : m >= 60 ? Math.floor(m / 60) + '시간 ' + (m % 60) + '분' : m + '분');
  const kst = (iso) => (iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ') : '');
  U2.planHtml = (P, now) => {
    now = now || Date.now(); if (!P || !P.stages) return '<p class="u2-hint">일정 표(PLAN.json)를 받지 못함</p>';
    const T = U2.planSum(P, now); const seen = new Set(); const maxH = Math.max(...P.stages.map((s) => +s.estH || 0), 1);
    const act = (s) => { if (s.group) { if (seen.has(s.group)) return '<span class="u2-sub">위와 함께</span>'; seen.add(s.group); return hmin(T.g[s.group]) + ' <small class="u2-sub">(' + esc(s.group) + ' 합)</small>'; } if (s.state === 'doing' && s.days && s.start) return Math.floor((now - Date.parse(s.start)) / 864e5) + '일째 / ' + s.days + '일'; return hmin(s.actMin); };
    const rows = P.stages.map((s) => { const pc = U2.planPct(s, now); const st = PST[s.state] || ['', s.state, '']; return `<tr class="${st[2]}" data-stage="${s.n}"><td><b>${s.n}</b></td><td>${esc(s.name)}<br><small class="u2-sub">${esc(s.goal || '')}</small></td><td><span class="u2-pl-st">${st[0]} ${st[1]}</span></td>
      <td class="u2-pl-bars"><div class="u2-pl-bar" title="진행 ${pc}%"><i style="width:${pc}%"></i></div><small>${pc}%</small><div class="u2-pl-est" title="예상 ${s.estH}시간"><i style="width:${Math.round((+s.estH || 0) / maxH * 100)}%"></i></div></td>
      <td>${s.estH}시간</td><td>${act(s)}</td><td><small>${esc(kst(s.start))}${s.end ? ' ~ ' + esc(kst(s.end)) : s.start ? ' ~' : ''}</small></td><td><small>${esc(s.boss || '')}${s.note ? (s.boss ? '<br>' : '') + '<span class="u2-sub">' + esc(s.note) + '</span>' : ''}</small></td></tr>`; }).join('');
    return `<div class="u2-plan"><div class="u2-pl-top"><b>만들기(코드) ${T.pct}%</b> <span class="u2-sub">어림 ${T.est}시간 중 ${T.doneH}시간어치 · 실제 걸린 시간 합 ${hmin(T.act)}</span>
      <div class="u2-pl-bar u2-pl-big" role="progressbar" aria-valuenow="${T.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${T.pct}%"></i></div>
      <div class="u2-row"><span class="u2-chip">정범님 확인까지 끝 ${T.cnt.done}/${T.n}</span><span class="u2-chip">🙋 정범님 필요 ${T.cnt.boss}</span><span class="u2-chip">⏳ 진행 중 ${T.cnt.doing}</span><span class="u2-chip">⬜ 아직 ${T.cnt.todo}</span>${T.cur ? `<span class="u2-chip">지금: ${T.cur.n} ${esc(T.cur.name)}</span>` : ''}</div></div>
      <div class="u2-tblw"><table class="u2-tbl u2-pl-tbl"><thead><tr><th>단계</th><th>이름</th><th>상태</th><th>진행 · 예상 길이</th><th>예상</th><th>실제</th><th>시작~끝(한국 시각)</th><th>정범님 할 일 · 메모</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="u2-hint">🙋 = 코드는 끝, 정범님 확인이 남음 · 진행 중 단계는 지금 시각으로 셈(시범 운행 = 지난 날 ÷ 14일) · 표는 PLAN.json(설계안 readnow-chats reports/2026-11-04_custom_app_plan.md 11장) · ${esc((P.updated || '').replace('T', ' ').slice(0, 16))} 고침</p></div>`;
  };
  U2.planScreen = async () => { const L = U2.panel('🗓 전체 일정·진행', '<p class="u2-hint">⏳ 일정 표를 받는 중…</p>', 'u2-planp'); const P = U2._plan || (await U2.loadPlan()); const body = L.querySelector('.u2-lbody'); const draw = () => { if (L.isConnected) body.innerHTML = U2.planHtml(P); }; draw(); const iv = setInterval(() => { if (!L.isConnected) return clearInterval(iv); draw(); }, 60e3); return L; };
  /* ── 내보내기/가져오기(E5 ★) — 브라우저 팝업 없이 내려받기 링크 ── */
  U2.exportJson = () => { const data = { kind: 'readnow-ui2-layout', ver: U2.ver, at: U2.now(), dev: U2.dev(), site: { nav: U2.site.nav, theme: U2.site.theme }, pages: U2.pages, prefs: U2.prefs }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' })); a.download = 'readnow2-배치-' + U2.today() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); U2.toast('배치 파일을 내려받음'); };
  U2.importJson = async (file) => { try { const d = JSON.parse(await file.text()); if (d.kind !== 'readnow-ui2-layout' || !d.pages) throw new Error('리드나우 2 배치 파일이 아님'); const id = U2.cur; const pg = d.pages[id]; if (!pg) throw new Error('이 페이지(' + id + ') 배치가 파일에 없음'); U2.openEditor(U2.isAdmin() ? 'pub' : 'mine', { load: pg, note: '가져온 파일' }); U2.toast('가져온 배치를 편집기에 열었습니다 — 게시해야 반영'); } catch (e) { U2.toast('가져오기 실패: ' + e.message, 1); } };

  /* ── 늦게 받기(설계안 8-4): 편집기(u2-editor.js)·덜 쓰는 위젯(u2-widgets-extra.js)은 첫 화면에 필요 없음 → 지금 웹앱 기능을 다 불러온 뒤 쉬는 때 받음 · ✏ 꾸미기를 먼저 누르면 그때 ── */
  U2.need = (src) => (U2._need = U2._need || {})[src] || (U2._need[src] = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src + '?v=' + U2.ver; sc.onload = () => res(); sc.onerror = () => { U2._need[src] = null; rej(new Error('파일을 못 받음: ' + src)); }; document.head.appendChild(sc); }));
  if (!U2.openEditor) U2.openEditor = (scope, opt) => { U2.toast('편집기를 불러오는 중…'); return U2.need('src/u2-editor.js').then(() => U2.openEditor(scope, opt)).catch((e) => U2.toast(e.message, 1)); };
  U2.preload = () => { const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300)); idle(() => { U2.need('src/u2-editor.js').catch(() => {}); U2W.lazyLoad().catch(() => {}); }, { timeout: 4000 }); };
  /* ── 시작 ── */
  U2.boot = () => {
    document.body.classList.add('u2-body');
    const root = document.createElement('div'); root.className = 'u2-root'; root.id = 'u2';
    root.innerHTML = '<div class="u2-bar" id="u2-bar" role="banner"></div><div id="u2-banners"></div><div id="u2-page" class="u2-page" role="main"></div>';
    document.body.insertBefore(root, document.body.firstChild);
    U2.theme.init(U2.site);
    const q = new URLSearchParams(location.search); U2.cur = q.get('p') || 'home';
    U2.drawBar(); U2.pages[U2.cur] = U2.ls.get('c:ui2_pages/' + U2.cur, null) || U2.defaultPage(U2.cur);
    U2.prefs = U2.ls.get('c:ui2_prefs/' + U2.devKey(), null);
    try { history.replaceState({ u2: 1, p: U2.cur }, '', location.href); } catch (e) {}
    U2.render({ reset: true });
    U2.banner('u2-loading', '⏳ 지금 웹앱 기능을 불러오는 중…', 'u2-info');
    U2.on('safe', (s) => { U2.banner('u2-loading', ''); U2.banner('u2-safe', `⚠ <b>안전 모드</b> — 지금 웹앱 기능을 불러오지 못했습니다: ${esc(s.why)}<br>꾸미기 위젯은 그대로 쓰고, 기능은 <a href="${esc(U2.move && U2.move.cur().state === 'on' ? U2.move.oldUrl() : U2.base)}">지금 웹앱에서 열기 ›</a>`, 'u2-warn'); U2.render({ reset: true }); });
    U2.loadTrack = async () => { for (const u of ['https://raw.githubusercontent.com/jerrycson/readnow-ui2/track/TRACK.json', 'TRACK.json']) { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) { U2._track = await r.json(); return U2._track; } } catch (e) {} } return null; };
    U2.on('safe', () => U2.preload());
    U2.on('legacyLoaded', () => { U2.preload(); setTimeout(() => U2.loadTrack().then(() => U2.data && U2.data.bump()), 3000);
      U2.banner('u2-loading', ''); U2.render({ reset: true }); setInterval(() => U2.legacy.checkNew(), U2.CFG.verCheckMin * 60e3); document.addEventListener('visibilitychange', () => { if (!document.hidden) U2.legacy.checkNew(); }); });
    U2.on('legacyShell', () => { try { if (U2.syncNav()) U2.drawBar(); } catch (e) {} U2.render({ reset: true }); });
    U2.on('auth', (u) => { if (u) U2.loadAll(); });
    U2.on('newVer', (v) => { const q = U2.shipQuiet(); const b = U2.banner('u2-newver', `🆕 ${v.app ? '지금 웹앱 새 판 ' + esc(v.app) : ''}${v.app && v.u2 ? ' · ' : ''}${v.u2 ? '새 웹앱 새 판 ' + esc(v.u2) : ''} — <button type="button" class="u2-btn u2-pri" data-re>눌러서 다시 열기</button>${q ? ` <small class="u2-nvq" title="지금 웹앱 1.78.497 🔕 출고 시간 방해 금지 · 🛡 출고 보호와 같은 값 — 리드나우 2는 처음부터 저절로 다시 열지 않음(누를 때만)">${esc(q)}</small>` : ''}`, 'u2-info'); b.querySelector('[data-re]').onclick = () => location.reload(); });
    /* (0.4.13 · 지금 웹앱 1.78.497 따라 들임) 🛡 출고 보호 · 🔕 출고 시간 방해 금지 중이면 새 판 띠에 한 줄 — 지금 웹앱 셈(sgHere · sqNow) 그대로 읽기만 · 없으면 빈 글 */
    U2.shipQuiet = () => { try { const h = typeof sgHere === 'function' ? sgHere() : null; if (h && h.on) return '🛡 출고 중 — 출고가 끝난 뒤 누르세요'; const q = typeof sqNow === 'function' ? sqNow() : null; if (q && q.on) return `🔕 출고 시간 방해 금지(${q.from}~${q.to}) — ${q.to} 뒤에 누르세요`; } catch (e) {} return ''; };
    /* 두 웹앱을 함께 열면 알림(R3 ★) — 지금 웹앱은 손대지 않으므로, 새 웹앱끼리 + 지금 웹앱 서비스 워커 저장본 이름표로 짐작 */
    try { const bc = new BroadcastChannel('rn2-tabs'); bc.onmessage = (e) => { if (e.data && e.data.hi) { U2._tabs = (U2._tabs || 0) + 1; if (e.data.hi === 'ping') bc.postMessage({ hi: 'pong' }); } }; bc.postMessage({ hi: 'ping' }); } catch (e) {}
    U2.checkClassicOpen();
    try { if (navigator.serviceWorker && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {} /* 새 웹앱 전용 저장본(rn2-ui-v*) — 지금 웹앱 본문도 같은 sw.js를 부름 */
    U2.legacy.run();
  };
  /* 지금 웹앱 탭이 같은 기기에서 열려 있나: 지금 웹앱은 자기 서비스 워커를 쓰므로 그 워커에 매인 창(clients)을 알 수 없음 → navigator.locks 이름(지금 웹앱 대표 탭 정하기)이 있으면 그것으로 */
  U2.checkClassicOpen = async () => { try { if (!navigator.locks || !navigator.locks.query) return; const q = await navigator.locks.query(); const names = (q.held || []).concat(q.pending || []).map((l) => l.name); if (names.indexOf('rn-app-leader') >= 0) { U2._both = true; const b = U2.$('#u2-both'); if (b) b.hidden = false; } } catch (e) {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', U2.boot); else U2.boot();
})();
