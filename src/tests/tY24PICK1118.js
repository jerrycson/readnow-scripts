// tY24PICK1118 — (y24pick1 11/18 · 정범님 노트 [3] 「SP 높은 책 20권 · 알라딘과 가격을 똑같이 해서 먼저 예스24에」) 🟦 정해 둔 상품은 알라딘 판매가 그대로
//   ① 웹앱 ◆y24reg 덩어리(순수 셈): 장부 w 줄 px:'al'(켜짐) → X.pxAl → y24RegJudge가 값 엔진을 건너뛰고 알라딘 값 그대로 · 사람 확인 울타리 통과 · 시장 지표 없이도 후보(y24AutoCand)
//   ② 클라우드(cloud/y24auto.js · 웹앱 탭 없이): w 줄만(reg_items 없음) 있는 상품을 시장 지표 없이 알라딘 값으로 맡김 · px 없는 표시는 예전처럼 시장 지표를 기다림
//   ③ 클라우드 본체 /kp-in y24want(확인만 dry · 잠금·수동 일괄·사진·세트·우리 예스24 같은 ISBN·장부를 봄 · merge로 w에만 씀)
// 실행: node src/tests/tY24PICK1118.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const T0 = rd('src/app.html'); const cut = (a, b) => { const i = T0.indexOf(a); const j = T0.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T0.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegPrice, y24RegJudge, y24AutoPlan, y24AutoCand, y24AutoHuman, y24PxAlSet };')();
console.log('① 웹앱 순수 셈');
{ const D = { ...F.Y24R_DEF, pct: 10 };
  const W = { a: { on: 1, px: 'al', lid: 'aladin_U1' }, b: { on: 0, px: 'al', lid: 'aladin_U2' }, c: { on: 1, lid: 'aladin_U3' }, d: { on: 1, px: 'al' } };
  const S1 = F.y24PxAlSet(W); ok(S1.has('aladin_U1') && !S1.has('aladin_U2') && !S1.has('aladin_U3') && S1.size === 1 && F.y24PxAlSet(null).size === 0, 'X.pxAl = 켜진 w 줄 중 px:al·상품 키가 있는 것만');
  const L = (o) => ({ id: 'aladin_U1', title: '시험 책', isbn: '9788900000011', grade: '상', price: 12300, qty: 1, live: true, skus: ['S1'], dupes: false, adult: false, ...o });
  let called = 0; const X = { onY24: new Map(), selfSet: new Set(), led: {}, ledSku: new Set(), pxAl: S1, cfg: D, val: () => { called++; return { price: 7000, mode: 'match', t: '엔진 값' }; } };
  const j = F.y24RegJudge(L(), X); ok(j.ok && j.row.price === 12300 && j.row.alPrice === 12300 && j.row.pxAl === 1 && j.row.val.mode === 'al' && called === 0, '정해 둔 상품: 값 엔진을 부르지 않고 알라딘 판매가 그대로(+10% 설정도 안 씀)', j.row);
  ok(F.y24AutoHuman(j.row, D) === '', '사람 확인 울타리 통과(같은 값이라 싸지 않음)');
  const j2 = F.y24RegJudge(L({ id: 'aladin_U9', skus: ['S9'] }), X); ok(j2.ok && j2.row.price === 7000 && !j2.row.pxAl && called === 1, '정해 두지 않은 상품은 예전처럼 엔진 값', j2.row);
  ok(!F.y24RegJudge(L(), { ...X, led: { aladin_U1: { st: 'sent', at: '2026-11-18' } } }).ok && !F.y24RegJudge(L(), { ...X, onY24: new Map([['9788900000011|상', ['1']]]) }).ok, '정해 둔 상품도 장부·우리 예스24 같은 책·등급이면 빠짐(울타리 그대로)');
  const rows = [{ k: 'ok', want: 1, row: j.row }, { k: 'ok', want: 1, row: j2.row }];
  const c = F.y24AutoCand(rows, D, 1, () => false, () => false); ok(c.length === 1 && c[0].lid === 'aladin_U1', '시장 지표를 아직 못 받아도 정해 둔 상품은 후보 · 다른 것은 기다림', c.map((x) => x.lid));
  ok(F.y24AutoCand([{ k: 'ok', want: 0, row: j.row }], D, 1, () => false, () => false).length === 0, '「🟦 예스24도」 표시(want)가 없으면 안 올림 · autoAll 기본 끔', D.autoAll);
}
console.log('② 클라우드');
(async () => {
  const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
  const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
  const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
  if (!XLP) { ok(false, 'xlsx.full.min.js 없음 — 클라우드 시험을 못 돌림(건너뛰지 않고 ❌)'); return fin(); }
  const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
  let T = Date.parse('2026-11-18T06:00:00Z'); const now = () => T;
  const Fd = makeDb(); const { store } = Fd; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: { aladin_U111: { c: ['aa001'] }, aladin_U222: { c: ['aa002'] } } });
  put('prd_listings', 'aladin_U111', { listingId: 9201, usedCode: 'U111', title: '시험 책 하나', isbn13: '9788900000011', grade: '상', price: 14500, priceList: 20000, qty: 1, sku: 'AB_U1', active: true, status: '판매중' });
  put('prd_listings', 'aladin_U222', { listingId: 9202, usedCode: 'U222', title: '시험 책 둘', isbn13: '9788900000028', grade: '상', price: 8800, priceList: 15000, qty: 1, sku: 'AB_U2', active: true, status: '판매중' });
  put('app_settings', 'y24_reg', { w: { px_aladin_U111: { on: 1, px: 'al', lid: 'aladin_U111', by: '시험', at: '2026-11-18T05:00:00Z' }, hand2: { on: 1, lid: 'aladin_U222', by: '시험' } }, r: {}, auto: { stop: null } });
  const texts = { 'src/app.html': T0, 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const Y = makeY24Auto({ db: Fd.db, C: Fd.C, FV: Fd.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX });
  const gather = () => ({ st: { ok1: 1, done: 0, wait: 0, cur: null, why: '', login: 'ok', hold: false, ban: null, en: true, bc: 1, ver: '0.1.74' }, res: [], rej: [] });
  const D0 = await Y.data(); const led0 = store.app_settings.y24_reg; const X0 = Y.regX(D0, led0, F.Y24R_DEF, null); ok(X0.pxAl instanceof Set && X0.pxAl.has('aladin_U111') && !X0.pxAl.has('aladin_U222'), '클라우드 regX도 pxAl(웹앱 y24PxAlSet과 같은 규칙)');
  const Wl = Y.wantLids(D0, led0); ok(Wl.has('aladin_U111') && Wl.has('aladin_U222'), 'reg_items 줄 없이 w 줄(lid)만으로도 「🟦 예스24도」');
  const y = await Y.step('HOME', gather()); const J = y.jobs && y.jobs[0];
  ok(J && J.rows.length === 1 && J.rows[0].lid === 'aladin_U111' && +J.rows[0].price === 14500, '처음 한 건 = 정해 둔 책 · 시장 지표 없이 알라딘 판매가 14500원 그대로', { why: y.why, plan: y.plan, rows: J && J.rows });
  const e = (store.app_settings.y24_reg.r || {}).aladin_U111; ok(e && e.st === 'auto' && +e.price === 14500 && +e.alPrice === 14500, '장부 줄 값 = 알라딘 값', e);
  ok(!(store.app_settings.y24_reg.r || {}).aladin_U222, 'px 없는 표시 상품은 시장 지표를 기다림(이번엔 안 올림)');
  console.log('②-2 번외가 처음 한 건을 아직 확인 못 함(ok1:null) — 1건씩만 · 맡김 크기 거절 멈춤은 한 번 풂');
  { const W1 = '번외가 맡김을 거절 — 처음 한 건이 예스24 목록에서 확인되기 전에는 1건짜리 맡김만 받음';
    put('prd_listings', 'aladin_U333', { listingId: 9203, usedCode: 'U333', title: '시험 책 셋', isbn13: '9788900000035', grade: '상', price: 9900, priceList: 16000, qty: 1, sku: 'AB_U3', active: true, status: '판매중' });
    store.app_settings.sku_map_0.m.aladin_U333 = { c: ['aa003'] };
    const L0 = store.app_settings.y24_reg; L0.w.px_aladin_U333 = { on: 1, px: 'al', lid: 'aladin_U333', by: '시험', at: '2026-11-18T05:00:00Z' };
    L0.r = { aladin_U111: { ...L0.r.aladin_U111, st: 'autofail', why: W1, failAt: '2026-11-18T06:01:00Z' }, aladin_Z9: { st: 'sent', auto: 1, ok: 1, gno: '1', at: '2026-11-17T01:00:00Z', day: '2026-11-17', skus: ['zz9'] } };
    L0.auto = { stop: { why: W1, state: 'fail', job: 'y24a-시험', hv: '0.1.78', at: '2026-11-18T06:01:00Z' } };
    T += 60e3; const g2 = gather(); g2.st.ok1 = null; g2.st.ver = '0.1.78';
    const y2 = await Y.step('HOME', g2); const J2 = y2.jobs && y2.jobs[0]; const L1 = store.app_settings.y24_reg;
    ok(!(L1.auto && L1.auto.stop) && L1.auto.resumeBy && /맡김 크기/.test(L1.auto.resumeBy), '「1건짜리 맡김만 받음」 멈춤은 저절로 풂(아무것도 안 누른 크기 실수)', L1.auto);
    ok(J2 && J2.rows.length === 1 && y2.plan && y2.plan.mode === 'bulk', '목록에 올라간 줄이 있어도(묶음 단계) 번외가 ok1:null이면 1건만 맡김', { why: y2.why, plan: y2.plan, n: J2 && J2.rows.length });
    const r111 = L1.r.aladin_U111; ok(r111 && ((r111.st === 'retry' && r111.hist && r111.hist.some((h) => h.st === 'autofail')) || (r111.st === 'auto' && J2.rows[0].lid === 'aladin_U111')), '그때 실패한 줄은 「↩ 다시」로 풀려 다시 후보(예전 상태는 hist에 남음)', r111);
    // 같은 장면을 ok1:1로 — 묶음 크기 그대로
    L1.r = { aladin_Z9: L1.r.aladin_Z9 }; T += 60e3; const g3 = gather(); g3.st.ver = '0.1.78';
    const y3 = await Y.step('HOME', g3); const J3 = y3.jobs && y3.jobs[0]; ok(J3 && y3.plan && y3.plan.max === 25 && y2.plan.max === 1, '번외가 ok1을 알리면 예전처럼 묶음 크기(chunk 25) · ok1:null일 때만 1', { y2: y2.plan, y3: y3.plan }); }
  console.log('③ 클라우드 본체 /kp-in y24want');
  const ix = rd('cloud/index.js'); ok(/async function y24WantIn\(J, by\)/.test(ix) && /J0\.y24want \? await y24WantIn\(J0\.y24want/.test(ix), '/kp-in이 y24want를 받음');
  const fn = ix.slice(ix.indexOf('async function y24WantIn'), ix.indexOf('async function fsDelProtOn'));
  ok(/prd_locks/.test(fn) && /prd_price_batches/.test(fn) && /y24_listings/.test(fn) && /minPh/.test(fn) && /SET_RE/.test(fn) && /if \(dry \|\| !ok\.length\) return/.test(fn) && /set\(\{ w \}, \{ merge: true \}\)/.test(fn) && /slice\(0, 30\)/.test(fn), '잠금·수동 일괄·우리 예스24·사진·세트를 보고 · dry면 확인만 · 쓸 때 w에 merge만 · 30개까지');
  ok(/J\.mb/.test(fn) && /'pend'/.test(fn) && /확정 기다림/.test(fn) && /기록만/.test(fn) && /mbMode/.test(fn), '(0.35.307) 수동 일괄은 기본 「값이 바뀔 상품만」(확정 기다림·감시·자동 그룹) · 지난 기록만 있는 상품은 빼지 않고 그룹 이름만 보여 줌 · mb:all/off 고를 수 있음');
  ok(!/autoAll/.test(fn.replace(/autoAll은 건드리지 않음/, '')), 'autoAll(판매중 전부)은 건드리지 않음');
  fin();
})().catch((e) => { bad++; console.log('  ❌ 오류', e && e.stack); fin(); });
function fin() { console.log(bad ? `❌ tY24PICK1118 ${bad}개 실패` : '✓ tY24PICK1118 통과'); process.exitCode = bad ? 1 : 0; }
