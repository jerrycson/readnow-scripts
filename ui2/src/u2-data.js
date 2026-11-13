/* 리드나우 2 — 자료 연결 (설계안 5-5 · 단계 5)
 * ① 옛 상태 읽기: 한국어 별칭만(코드 이름을 위젯 설정에 드러내지 않음 — 정범님 11/01) · 읽기 전용 · 계약 목록에 적어 따라잡기 검사가 봄
 * ② 변수(U2.vars): 변수 바·입력 위젯·행동이 바꿈 → 식이 든 위젯만 0.7초 모아 다시 그림
 * ③ Firestore 질의 위젯: 관리자 기기만 만듦 · 한 질의 200문서 · 한 페이지 합 1,000문서(넘으면 게시를 막음) · 읽기만
 * ④ 저장한 보기(N12 ★): 거르기(변수) 조합에 이름을 붙여 저장 → 메뉴·보기 위젯에서 엶 · 이 기기(rn2-views) 또는 공용(ui2_site.views, 관리자) */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  U2.vars = U2.vars || {};
  const S0 = () => { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } };
  const sz = (x) => (x == null ? null : typeof x.size === 'number' ? x.size : Array.isArray(x) ? x.length : null);
  /* 별칭: [이름, 설명, 읽는 법] — 지금 웹앱 상태(S)를 읽기만 */
  const AL = [
    ['주문.전체수', '이 기기가 받은 주문 수', () => sz((S0() || {}).orders)],
    ['주문.받음', '주문 기록을 다 받았나(참/거짓)', () => !!(S0() || {}).ordersLoaded],
    ['고객.수', '고객 수', () => sz((S0() || {}).customers)],
    ['상품.전체수', '이 기기가 받은 상품 수', () => sz((S0() || {}).plist)],
    ['상품.받음', '상품 기록을 다 받았나', () => !!(S0() || {}).prodLoaded],
    ['판매자.수', '받은 판매자 수', () => sz((S0() || {}).sellers)],
    ['연결확정.수', '연결 확정 기다리는 수', () => sz((S0() || {}).pending)],
    ['문의.전체수', '받은 문의 수', () => sz((S0() || {}).qnaAll)],
    ['지금탭', '지금 웹앱이 보고 있는 탭', () => (S0() || {}).tab || ''],
    ['지금웹앱.판', '불러온 지금 웹앱 판 번호', () => (U2.legacy && U2.legacy.appVer) || ''],
    ['새웹앱.판', '리드나우 2 판 번호', () => U2.ver],
    ['기기.이름', '이 기기 이름', () => U2.dev()],
    ['기기.관리자', '관리자 기기인가', () => U2.isAdmin()],
    ['기기.휴대폰', '휴대폰 폭인가(600px 아래)', () => innerWidth < 600],
    ['시각.시', '지금 몇 시(0~23)', () => new Date().getHours()],
    ['시각.요일', '오늘 요일(0=일)', () => new Date().getDay()],
    ['막은쓰기.수', '이 기기에서 막은 쓰기 수', () => (U2.guard ? U2.guard.blocked.length : 0)],
    ['따라잡기.할일', '따라잡기 표 ⬜·❌ 줄 수(표를 받았으면)', () => (U2._track ? U2._track.rows.filter((r) => r.state === '⬜' || r.state === '❌').length : null)],
    ['등록.진행', '📥 등록 진행 중(조회·선택·결정 대기·보류 — 지금 웹앱 빠른 작업 숫자와 같은 셈)', () => (U2.find ? U2.find.qaCounts().reg : null)],
    ['출고.남은', '🚚 오늘 출고 남은 일(확인할 주문·출고 준비·송장 인쇄됨·보내는 중)', () => (U2.find ? U2.find.qaCounts().ship : null)],
    ['출고.알라딘', '🚚 오늘 출고 남은 일 중 🟥 알라딘', () => { const b = U2.find && U2.find.qaCounts().shipBy; return b ? b.al : null; }],
    ['출고.예스24', '🚚 오늘 출고 남은 일 중 🟦 예스24', () => { const b = U2.find && U2.find.qaCounts().shipBy; return b ? b.y24 : null; }],
    ['출고.네이버', '🚚 오늘 출고 남은 일 중 🟩 네이버', () => { const b = U2.find && U2.find.qaCounts().shipBy; return b ? b.nv : null; }],
    ['출고.우리숍', '🚚 오늘 출고 남은 일 중 🛍 우리숍', () => { const b = U2.find && U2.find.qaCounts().shipBy; return b ? b.shop : null; }],
    /* (0.4.13 · 지금 웹앱 1.78.512·1.78.504 따라 들임) 🔁 사후 확인 · 🔍 실사 목록 — 지금 웹앱 셈(rcBad · ledAuditNow) 그대로 */
    ['사후확인.어긋남', '🔁 사후 확인 — 재고 자동 처리 뒤 다시 확인했더니 어긋난 일(확인함 전 · 지금 웹앱 rcBad)', () => (typeof rcBad === 'function' ? rcBad().length : null)],
    ['실사.수', '🔍 실사 목록 — 주문 없이 알라딘 수량이 SKU보다 많은 실물(지금 웹앱 ledAuditNow · 상품 기록을 받은 뒤)', () => { const s = S0(); if (!s || !s.prodLoaded || typeof ledAuditNow !== 'function') return null; return ledAuditNow().length; }],
    ['계약.깨짐', '지금 불러온 판에서 깨진 계약 수', () => (U2.adapters && U2.adapters.bad ? U2.adapters.bad.length : null)],
  ];
  const D = (U2.data = { ALIAS: AL, alias: new Map(AL.map((a) => [a[0], a])) });
  D.ctx = (extra) => ({ get: (n) => { if (extra && n in extra) return extra[n]; if (n in U2.vars) return U2.vars[n]; const a = D.alias.get(n); if (a) { try { const v = a[2](); return v === undefined ? null : v; } catch (e) { return null; } } return undefined; } });
  D.eval = (src) => U2Expr.eval(src, D.ctx());
  D.setVar = (n, v) => { n = String(n || '').trim(); if (!n) return; U2.vars[n] = v; U2.emit('vars', U2.vars); };
  /* 위젯 속성 풀기: '=식'은 값으로 · 글 속 {{식}}은 채움 → 식이 하나라도 있으면 dyn */
  D.resolve = (p) => {
    let dyn = false; const o = {};
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === 'string' && v.length > 1 && v[0] === '=' && !/^s_|^seq$|^showIf$/.test(k)) { dyn = true; const r = D.eval(v.slice(1)); o[k] = r.err ? '⚠ ' + r.err : r.v == null ? '—' : r.v; }
      else if (typeof v === 'string' && v.indexOf('{{') >= 0 && k !== 'seq') { dyn = true; o[k] = U2Expr.fill(v, D.ctx()); }
      else o[k] = v;
    }
    return { p: o, dyn };
  };
  /* 보이기 조건(조건 쪽): 식 · 기기(PC/휴대폰/관리자) · 밤(1~5시) 숨김 */
  D.COND = [{ k: 'showIf', label: '보이기 조건(식 — 예 연결확정.수 > 0 · 비우면 늘)', type: 'text', def: '' }, { k: 'devOnly', label: '이 기기에서만', type: 'select', opts: { '': '모든 기기', pc: 'PC(600px 넘음)', phone: '휴대폰', admin: '관리자 기기' }, def: '' }, { k: 'night', label: '밤 1~5시', type: 'select', opts: { '': '늘 보임', hide: '숨김', only: '이때만 보임' }, def: '' }];
  D.visible = (w) => {
    const p = (w && w.props) || {};
    if (p.devOnly === 'pc' && innerWidth < 600) return false; if (p.devOnly === 'phone' && innerWidth >= 600) return false; if (p.devOnly === 'admin' && !U2.isAdmin()) return false;
    const h = new Date().getHours(), night = h >= 1 && h < 5; if (p.night === 'hide' && night) return false; if (p.night === 'only' && !night) return false;
    if (p.showIf) { const r = D.eval(p.showIf); if (r.err) return /^모르는 이름/.test(r.err) ? false : true; /* 아직 없는 변수 = 거짓 · 식 자체가 틀리면 보임(사라져 못 찾는 일 없게) */ return U2Expr.truthy(r.v); }
    return true;
  };
  /* 다시 그리기 모으기(0.7초) — 변수·옛 자료가 바뀌면 */
  let T = null; D.bump = () => { if (T) return; T = setTimeout(() => { T = null; if (U2.edit || !U2.view) return; U2.render(); U2.view.cells.forEach((c, id) => { if (c._dyn) U2.mountCell(c, id, U2.effective(U2.cur), false); }); }, 700); };
  U2.on('vars', D.bump);
  setInterval(() => { if (!document.hidden && U2.view && [...U2.view.cells.values()].some((c) => c._dyn)) D.bump(); }, 60e3);

  /* ── Firestore 질의(읽기만 · 예산) ── */
  D.Q_MAX = 200; D.PAGE_MAX = 1000; /* 설계안 5-5 */
  D.qOk = (q) => { if (!q || !q.col) return '칸 이름이 없음'; if (!/^[A-Za-z0-9_]+$/.test(q.col)) return '칸 이름은 영문·숫자·_만'; if ((+q.limit || 0) > D.Q_MAX) return '한 질의 ' + D.Q_MAX + '문서까지'; return ''; };
  D.pageBudget = (pg) => Object.values(pg.widgets || {}).filter((w) => w.type === 'query').reduce((s, w) => s + Math.min(D.Q_MAX, +((w.props || {}).limit) || 20), 0);
  D.query = async (q) => {
    const bad = D.qOk(q); if (bad) throw new Error(bad);
    const db = U2.store.fs(); if (!db || !U2.authed) throw new Error('Firebase에 아직 연결 안 됨');
    let r = db.collection(q.col); const W0 = String(q.where || '').trim();
    if (W0) { const m = /^([\w.]+)\s*(==|>=|<=|>|<|!=)\s*(.+)$/.exec(W0); if (!m) throw new Error("조건은 '칸 == 값' 꼴"); let v = m[3].trim(); v = /^'.*'$|^".*"$/.test(v) ? v.slice(1, -1) : v === '참' ? true : v === '거짓' ? false : isFinite(+v) ? +v : v; r = r.where(m[1], m[2], v); }
    if (q.order) r = r.orderBy(q.order, q.desc ? 'desc' : 'asc');
    const n = Math.max(1, Math.min(D.Q_MAX, +q.limit || 20)); const s = await r.limit(n).get(); U2.stat.reads += Math.max(1, s.size || 0);
    const out = []; s.forEach((d) => out.push(Object.assign({ _id: d.id }, d.data()))); return out;
  };

  /* ── 저장한 보기(N12) ── */
  D.views = () => { const mine = (U2.ls.get('views', []) || []).map((v) => Object.assign({ scope: '이 기기' }, v)); const pub = ((U2.site && U2.site.views) || []).map((v) => Object.assign({ scope: '공용' }, v)); return pub.concat(mine); };
  D.saveView = async (name, pub) => {
    name = String(name || '').trim(); if (!name) throw new Error('이름이 없음');
    const v = { name, page: U2.cur, vars: U2.clone(U2.vars), at: U2.now(), by: U2.dev() };
    if (pub) { if (!U2.isAdmin()) throw new Error('공용 보기는 관리자 기기만'); const L = ((U2.site.views || []).filter((x) => x.name !== name)).concat([v]); U2.site.views = L; await U2.store.set('ui2_site', 'main', { views: L }, true); }
    else { const L = (U2.ls.get('views', []) || []).filter((x) => x.name !== name).concat([v]); U2.ls.set('views', L); }
    U2.emit('views'); return v;
  };
  D.openView = async (name) => { const v = D.views().find((x) => x.name === name); if (!v) throw new Error('보기를 찾지 못함: ' + name); Object.assign(U2.vars, U2.clone(v.vars || {})); if (v.page && v.page !== U2.cur) await U2.go(v.page); U2.emit('vars', U2.vars); U2.toast('보기 열기: ' + name); };
  D.delView = async (name, pub) => { if (pub) { if (!U2.isAdmin()) return; U2.site.views = (U2.site.views || []).filter((x) => x.name !== name); await U2.store.set('ui2_site', 'main', { views: U2.site.views }, true); } else U2.ls.set('views', (U2.ls.get('views', []) || []).filter((x) => x.name !== name)); U2.emit('views'); };
})();
