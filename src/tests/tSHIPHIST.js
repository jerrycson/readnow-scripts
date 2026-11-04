// tSHIPHIST — 정범님 11/04 '발송준비시작 등의 모든 카드들은 일정 시간(설정 가능)이 지나면 저절로 숨기기로 들어가게 하고, 하루가 지나면 기록에 남게 해.
//  기록은 따로 열어서(내부 팝업) 지금까지의 모든 처리를 한번에 볼 수 있고(날짜별로 묶음. 이전 날짜는 모두 기본 닫힘) 검색할 수 있어'
//  🛰 끝난 카드 저절로 숨김(설정 시간) · 문제 카드는 남음 · 전날 카드는 🛰에서 빠짐 · 📜 출고 처리 기록(웹앱 안 화면): 날짜 묶음 · 지난 날 기본 닫힘 · 검색 · 더 보기 · 손님 이름 없음 · 360px
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const run = async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const o = {}; const w = (ms) => new Promise((r) => setTimeout(r, ms)); const ago = (m) => new Date(Date.now() - m * 60e3).toISOString();
    const day0 = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) + 'T00:00:00+09:00'); const yest = (h) => new Date(day0 - h * 3600e3).toISOString(); /* 한국 시각 어제 */ const dAgo = (d) => new Date(day0 - d * 864e5 + 10 * 3600e3).toISOString();
    S.app = S.app || {}; S.app.stepLog = { ...(S.app.stepLog || {}), autoHideMin: 10, recentMin: 30 };
    const C = db.collection('shp_cmds');
    await C.doc('dDone').set({ type: 'startDelivery', orderNos: ['D1'], status: 'done', createdAt: ago(25), doneAt: ago(20), results: { D1: { state: 'done' } }, stepNow: { at: ago(20), lv: 'ok', m: '발송준비시작 끝' }, log: [{ at: ago(20), lv: 'ok', m: '발송준비시작 끝', o: 'D1' }] });
    await C.doc('dFresh').set({ type: 'startDelivery', orderNos: ['T1'], status: 'done', createdAt: ago(5), doneAt: ago(3), results: { T1: { state: 'done' } }, stepNow: { at: ago(3), lv: 'ok', m: '발송준비시작 끝' }, log: [{ at: ago(3), lv: 'ok', m: '발송준비시작 끝', o: 'T1' }] });
    await C.doc('dFail').set({ type: 'startDelivery', orderNos: ['F1'], status: 'fail', createdAt: ago(25), doneAt: ago(20), results: { F1: { state: 'fail', err: '알라딘 안내 글' } }, stepNow: { at: ago(20), lv: 'err', m: '알라딘이 거절함' }, log: [{ at: ago(20), lv: 'err', m: '알라딘이 거절함', o: 'F1' }] });
    await C.doc('dYest').set({ type: 'startDelivery', orderNos: ['Y1'], status: 'running', createdAt: yest(2), claim: { pc: 'HOME' }, stepNow: { at: yest(2), lv: 'info', m: '발송준비시작 보냄' }, log: [{ at: yest(2), lv: 'info', m: '발송준비시작 보냄', o: 'Y1' }] });
    await C.doc('dOld10').set({ type: 'market', status: 'done', createdAt: dAgo(10), doneAt: dAgo(10), prog: { n: 3, done: 3 }, stepNow: { at: dAgo(10), lv: 'ok', m: '시장 다시 읽기 끝 — 열흘 전 것' }, log: [{ at: dAgo(10), lv: 'ok', m: '시장 다시 읽기 끝 — 열흘 전 것' }] });
    await C.doc('reg1').set({ type: 'regBulk', status: 'done', createdAt: ago(10) }); /* 출고 아닌 일 — 기록에 안 나옴 */
    await db.collection('shp_invoices').doc('invY').set({ createdAt: yest(3), status: 'paused', pausedAt: yest(3), pauseWhy: '알라딘 화면이 다름', claim: { pc: 'PC-T' }, items: [{ orderNo: 'I1', invoice: '999988887777', recipient: '손님A', state: 'todo' }], log: [{ at: yest(3), lv: 'warn', m: '멈춤 — 알라딘 화면이 다름', o: 'I1', by: 'PC-T' }], stepNow: { at: yest(3), lv: 'warn', m: '멈춤 — 알라딘 화면이 다름' } });
    await db.collection('shp_runs').doc('run1').set({ createdAt: dAgo(1), status: 'done', ph: 'done', doneAt: dAgo(1), bt: [{ n: 1, al: ['R1'], done: true }], log: [{ at: dAgo(1), lv: 'ok', m: '원스톱 끝' }] });
    await db.collection('crm_y24_orders').doc('Z77').set({ orderNo: 'Z77', lastSeenAt: dAgo(2), auto: { ship: { state: 'done', at: dAgo(2), endAt: dAgo(2), msg: '발송처리 끝', pc: 'MJ' } } });
    await db.collection('prd_system').doc('alps_hist').set({ runs: { r1: { id: 'r1', status: 'error', at: dAgo(3), end: dAgo(3), error: '프린터 없음', step: '인쇄', by: 'MJ-MAIN' } } });
    S.ship = { orders: [{ orderNo: 'T1', orderedAt: '2026-11-04 09:00', buyer: '손님A', items: [{ listingId: 'L1', title: '고양이 그림책', price: 5000, qty: 1 }] }], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S._shipLive = 1; S.shipTab = 'deliv';
    await openShip(); await w(1500);
    const ids = () => [...document.querySelectorAll('#shl_box [data-shl]')].map((x) => x.dataset.shl);
    o.live = ids(); o.rows = shipLiveRows().map((r) => r.id + ':' + r.st + (r.ahid ? ':ah' : ''));
    o.showHid = (document.getElementById('shl_showhid') || {}).innerText || ''; o.ahInput = !!document.getElementById('shl_ah'); o.histBtn = !!document.getElementById('shl_hist');
    o.prob = shipLiveProblems().map((r) => r.id);
    document.getElementById('shl_showhid').click(); await w(300); o.liveShow = ids(); o.ahTxt = (document.querySelector('[data-shl="cmd:dDone"]') || {}).innerText || ''; document.getElementById('shl_showhid').click(); await w(200);
    const ahSet = (v) => { S.app.stepLog = { ...(S.app.stepLog || {}), autoHideMin: v }; }; ahSet(30); shipLivePaint(); await w(200); o.live30 = ids(); ahSet(10); shipLivePaint(); await w(200);
    /* 📜 출고 처리 기록 */
    S.ship = { ...(S.ship || {}), orders: [...((S.ship || {}).orders || []), { orderNo: 'T1', buyer: '손님A', items: [{ listingId: 'L1', title: '고양이 그림책', price: 5000, qty: 1 }] }] }; /* 상품명은 이 기기에 있는 주문 목록에서 */
    document.getElementById('shl_hist').click(); await w(1800);
    const sh = document.getElementById('sheet'); o.title = (sh.querySelector('.sh .t') || {}).innerText || ''; o.det = !!(S.detail && S.detail.shist); o.pg = typeof pgdCur === 'function' ? pgdCur() : '';
    o.noPopup = !document.querySelector('.rn-ipop');
    const days = () => [...sh.querySelectorAll('.shh-day')].map((d) => ({ d: d.dataset.shhday, open: d.open, cards: d.querySelectorAll('.shl-row').length, head: d.querySelector('summary').innerText.replace(/\s+/g, ' ') }));
    o.today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); o.days1 = days(); o.all1 = [...S.shh.rows.keys()];
    o.txt1 = sh.innerText; o.more1 = (document.getElementById('shh_more') || {}).innerText || '';
    o.allTxt = [...S.shh.rows.values()].map((r) => shhTxt(r)).join(' | ');
    /* 지난 날 펼치기 → 그때 카드 그림 */
    const yd = sh.querySelector('.shh-day:not([open])'); if (yd) { yd.open = true; await w(200); o.lazy = yd.querySelectorAll('.shl-row').length; yd.open = false; await w(100); o.lazyGone = yd.querySelectorAll('.shl-row').length; }
    /* 검색 */
    const q = document.getElementById('shh_q'); const type = async (v) => { q.value = v; q.dispatchEvent(new Event('input')); await w(400); };
    await type('프린터'); o.q1 = days(); o.qSum = document.getElementById('shh_sum').innerText;
    await type('고양이'); o.q2 = days();
    await type('Z77'); o.q3 = days();
    await type('열흘'); o.q4 = days(); o.q4empty = !!sh.querySelector('#shh_b .empty');
    await type(''); o.qClear = days();
    /* 더 보기 */
    document.getElementById('shh_more').click(); await w(1500); o.days2 = days(); o.has10 = S.shh.rows.has('cmd:dOld10');
    await type('열흘'); o.q5 = days(); await type('');
    /* 360px */
    return o; });
  await p.setViewportSize({ width: 360, height: 760 }); await p.waitForTimeout(500);
  const N = await p.evaluate(async () => { const sh = document.getElementById('sheet'); const d = sh.querySelector('.shh-day[open] .shl-row'); if (d) d.open = true; await new Promise((r) => setTimeout(r, 200)); const over = [...sh.querySelectorAll('.shh-day, .shl-row, #shh_q, #shh_more')].filter((e) => e.getBoundingClientRect().right > 361).map((e) => e.className || e.id);
    const o = { sw: document.documentElement.scrollWidth, shw: sh.scrollWidth, shc: sh.clientWidth, over }; history.back(); await new Promise((r) => setTimeout(r, 900)); o.closed = S.shh === null || S.shh === undefined; o.back = !!document.getElementById('shl_box'); return o; });
  console.log(JSON.stringify(R).slice(0, 2500)); console.log('360', JSON.stringify(N));
  const today = R.today; const dOf = (L, d) => L.find((x) => x.d === d);
  ok(!R.live.includes('cmd:dDone') && R.live.includes('cmd:dFresh') && R.rows.includes('cmd:dDone:done:ah'), '끝난 지 20분 된 카드는 저절로 숨김(기본 10분) · 끝난 지 3분 된 카드는 보임');
  ok(R.live.includes('cmd:dFail') && R.prob.includes('cmd:dFail'), "실패 카드는 같은 시간이 지나도 남음(사람이 볼 때까지) · 홈 '오늘 확인할 것'에도");
  ok(/숨긴 줄 1개 보기/.test(R.showHid) && R.liveShow.includes('cmd:dDone') && /저절로 숨김/.test(R.ahTxt), "저절로 숨긴 수가 '숨긴 줄 n개 보기'에 함께 · 누르면 다시 보임");
  ok(R.live30.includes('cmd:dDone'), '⚙ 기록 설정 시간(autoHideMin)을 30분으로 바꾸면 다시 보임 — 설정이 먹음');
  ok(R.ahInput && R.histBtn, '⚙ 기록 설정에 저절로 숨김 칸 · 🛰 머리에 📜 출고 처리 기록 단추');
  ok(R.rows.some((x) => /dYest|invY/.test(x)), '전날 문제 카드(멈춘 송장 입력·오래 멈춘 발송준비시작)는 해결되거나 숨길 때까지 🛰 칸에 남음(정범님 원칙: 놓치지 않게)');
  ok(/출고 처리 기록/.test(R.title) && R.det && R.pg === 'shipHist' && R.noPopup, '📜 출고 처리 기록 = 웹앱 안 화면(시트) · 화면 설명서 id shipHist');
  const t1 = dOf(R.days1, today); const others = R.days1.filter((x) => x.d !== today);
  ok(t1 && t1.open && t1.cards >= 3 && others.length >= 3 && others.every((x) => !x.open && x.cards === 0), '날짜별 묶음 — 오늘만 펼침 · 지난 날 모두 닫힘(닫힌 날은 카드를 그리지 않음) ' + JSON.stringify(R.days1.map((x) => [x.d, x.open, x.cards])));
  const y1 = R.days1.find((x) => x.d < today && /문제/.test(x.head)); ok(!!y1 && /3건/.test(y1.head) && /문제 2/.test(y1.head), '날짜 머리에 건수·문제 수(어제: 멈춘 송장 입력 + 오래 멈춘 발송준비시작 + 끝난 원스톱 = 3건 · 문제 2) ' + (y1 ? y1.head : ''));
  ok(R.all1.includes('inv:invY') && R.all1.includes('cmd:dYest') && R.all1.includes('cmd:dDone') && R.all1.includes('os:run1') && R.all1.includes('y24:Z77:ship') && R.all1.includes('alpsh:r1') && !R.all1.includes('cmd:reg1') && !R.all1.includes('cmd:dOld10'), '모든 출고 처리(맡긴 일·송장 입력·원스톱·예스24·ALPS) · 출고 아닌 일 빠짐 · 처음엔 최근 7일만');
  ok(R.lazy >= 1 && R.lazyGone === 0, '지난 날을 펼치면 그때 카드를 그림 · 닫으면 버림');
  ok(!/손님A/.test(R.txt1) && !/손님A/.test(R.allTxt), '손님 이름은 화면·검색 글에 없음');
  const one = (L, n) => L.length === n && L.every((x) => x.open);
  ok(one(R.q1, 1) && R.q1[0].cards === 1 && /맞는 카드 1/.test(R.qSum), "검색 '프린터'(ALPS 멈춤 까닭) → 그 날짜만 펼쳐 1장");
  ok(R.q2.length === 1 && R.q2[0].d === today && R.q2[0].cards === 1, "검색 상품명 '고양이' → 오늘 그 카드");
  ok(one(R.q3, 1) && R.q3[0].cards === 1, "검색 주문번호 'Z77'(예스24) → 그 날짜만");
  ok(R.q4.length === 0 && R.q4empty, '불러오지 않은 열흘 전 것은 아직 못 찾음(맞는 기록 없음 안내)');
  ok(dOf(R.qClear, today).open && R.qClear.filter((x) => x.d !== today).every((x) => !x.open), '검색을 지우면 다시 오늘만 펼침');
  ok(/더 보기/.test(R.more1) && R.has10 && R.days2.length > R.days1.length && R.days2.filter((x) => x.d !== today).every((x) => !x.open), '「더 보기」 → 그 전 7일을 불러옴(열흘 전 것 · 닫힌 채)');
  ok(one(R.q5, 1), "더 불러온 뒤 '열흘' 검색 → 찾음");
  ok(N.sw <= 362 && N.shw <= N.shc + 2 && !N.over.length, '360px 폭에서 가로로 넘치지 않음 ' + JSON.stringify(N));
  ok(N.closed && N.back, '← 닫기(뒤로) → 오늘 출고로 돌아가고 모은 카드는 버림');
  console.log(bad ? `❌ tSHIPHIST 실패 ${bad}` : '✓ tSHIPHIST 통과'); };
require('./harness.js')(run);
