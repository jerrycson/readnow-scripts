// tY24REG_BD1116 — (r1116-y24reg · 11/14 11:50Z 자동 올림 실패 한 줄 뒤 예스24 새 등록 0건) 🟦 끝난 줄은 기다리지 않음 + ISBN 없는 상품(블루레이)의 바코드 줄
//   ① 웹앱 ◆y24reg 덩어리(순수 셈): 끝난 줄(실패·며칠째 안 보임·풂)은 첫 건 기다림·첫 건 셈(nLed)에서 빠짐 · EAN-13 검사(바꾸지 않음) · 바코드 줄 판정(시장 값 엔진 건너뜀)·엑셀·후보
//   ② 클라우드(cloud/y24auto.js · 웹앱 탭 없이): 장부 바코드 한 번 심기(없을 때만 · 지운 뒤 다시 안 넣음) · 실패 줄이 있어도 첫 1건 · 바코드 줄은 바코드를 아는 번외(state bc:1)에만
//   ③ 번외(lab/col2/helper/col2-y24reg.js): 바코드 줄 검사(검사 숫자) · 맡김에 바코드 보존 · 상태 bc:1
// 실행: node src/tests/tY24REG_BD1116.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const T0 = rd('src/app.html'); const cut = (a, b) => { const i = T0.indexOf(a); const j = T0.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T0.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegPrice, y24RegState, y24RegGate, y24RegJudge, y24RegAoa, y24AutoPlan, y24AutoCand, y24RegDead, y24RegNLed, y24RegEan };')();
const BC = '8809866320756';
console.log('① 웹앱 순수 셈');
{ const D = F.Y24R_DEF; const now = '2026-11-16T06:00:00Z'; const C = { adm: [], pub: [] };
  ok(F.y24RegEan(BC) === BC && F.y24RegEan('880-9866-320756') === BC && F.y24RegEan('8809866320757') === '' && F.y24RegEan('880986632075') === '' && F.y24RegEan(null) === '' && F.y24RegEan('9788900000016') === '9788900000016', 'EAN-13: 검사 숫자가 맞을 때만 · 띄어쓰기·- 뺌 · 880을 978로 바꾸지 않음');
  const fail = { lid: 'aladin_U9', isbn: '9788900000011', grade: '상', skus: ['S9'], at: '2026-11-14T11:45:00Z', st: 'autofail', auto: 1, job: 'j0', why: '미리보기에 안 보임' };
  const fresh = { lid: 'aladin_U8', isbn: '9788900000028', grade: '상', skus: ['S8'], at: '2026-11-16T05:00:00Z', st: 'sent', auto: 1, unsure: 1, job: 'j1' };
  ok(F.y24RegDead(fail, C, now, D) && F.y24RegDead({ ...fresh, st: 'retry' }, C, now, D) && !F.y24RegDead(fresh, C, now, D) && F.y24RegDead({ ...fresh, at: '2026-11-10T00:00:00Z' }, C, now, D), '끝난 줄 = 자동 올림 실패·풂·며칠째 안 보임 · 방금 올린 줄은 살아 있음');
  ok(F.y24RegNLed({ a: fail, b: { ...fresh, st: 'retry' } }, C, now, D) === 0 && F.y24RegNLed({ a: fail, b: fresh }, C, now, D) === 1 && F.y24RegNLed(null, C, now, D) === 0, '첫 건 셈(nLed): 끝난 줄은 세지 않음 → 처음 한 건(firstAny)이 다시 열림');
  const R = (o) => ({ lid: 'aladin_U1', title: '시험 책', isbn: '9788900000035', grade: '상', qty: 1, price: 9000, alPrice: 9000, skus: ['S1'], self: 'S1', val: null, ...o });
  const P1 = F.y24AutoPlan([R()], { a: fail }, C, now, D); ok(P1.mode === 'first' && P1.max === 1 && P1.pick.length === 1 && /실패/.test(P1.t), '실패 줄 하나만 있으면 영원히 기다리지 않고 다른 1건으로 처음 한 건(예전: wait 0건)', P1);
  ok(F.y24AutoPlan([R()], { a: fail, b: fresh }, C, now, D).mode === 'wait', '살아 있는 첫 건(결과 흐림)이 있으면 여전히 기다림');
  ok(F.y24AutoPlan([R()], {}, C, now, D).mode === 'first' && !/실패/.test(F.y24AutoPlan([R()], {}, C, now, D).t), '장부가 비었으면 예전 글 그대로');
  ok(F.y24RegGate({ a: fail }, C, now, D).mode === 'first' && F.y24RegGate({ a: fail, b: fresh }, C, now, D).mode === 'wait' && F.y24RegGate({}, C, now, D).mode === 'first', '📤 손 길 문(y24RegGate)도 같음 — 끝난 줄만이면 1건');
  const L = (o) => ({ id: 'aladin_U495184596', title: '시험 블루레이', isbn: null, bc: BC, grade: '상', price: 12000, qty: 1, live: true, skus: ['BD001'], dupes: false, adult: false, ...o });
  let called = 0; const X = { onY24: new Map(), selfSet: new Set(), led: {}, ledSku: new Set(), cfg: D, val: () => { called++; return { price: 1, mode: 'match' }; } };
  const j = F.y24RegJudge(L(), X); ok(j.ok && j.row.isbn === BC && j.row.bc === BC && j.row.price === F.y24RegPrice(12000, D.pct) && j.row.val === null && called === 0, '바코드 줄: ISBN 없어도 올릴 줄 · 바코드가 isbn 자리 · 시장 값 엔진 건너뜀(알라딘 값 ±%)', j);
  ok(/ISBN·바코드 없음/.test(F.y24RegJudge(L({ bc: null }), X).why || ''), 'ISBN·바코드 둘 다 없으면 예전처럼 못 올림');
  const X2 = { ...X, onY24: new Map([[BC + '|상', ['150109556']]]) }; ok(/같은 책·등급/.test(F.y24RegJudge(L(), X2).why || ''), '예스24에 같은 바코드·등급 매물이 있으면 빠짐');
  const aoa = F.y24RegAoa([{ ...j.row, isbn: 'x' }]); ok(aoa[27][1] === BC, '엑셀 바코드 칸 = r.bc || r.isbn', aoa[27]);
  const rows = [{ k: 'ok', row: j.row, want: null }, { k: 'ok', row: R({ lid: 'aladin_U2' }), want: null }];
  const c = F.y24AutoCand(rows, D, 0, () => false, () => false); ok(c.length === 1 && c[0].lid === 'aladin_U495184596' && c[0].first === 1, '후보: 시장 지표를 못 받은 ISBN 줄은 기다리고 바코드 줄은 시장 지표 없이 들어감', c); }
console.log('② 클라우드(웹앱 탭 없음)');
(async () => {
  const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
  const { makeY24Auto, blockOf, BLOCK_NAMES } = require(path.join(TOP, 'cloud/y24auto.js'));
  const { makeY24Reg, checkJob } = require(path.join(TOP, 'lab/col2/helper/col2-y24reg.js'));
  const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
  ok(['y24RegDead', 'y24RegNLed', 'y24RegEan'].every((n) => BLOCK_NAMES.includes(n)) && !!blockOf(T0), '클라우드가 새 셈(y24RegDead·y24RegNLed·y24RegEan)도 웹앱 덩어리에서 떼어 씀');
  if (!XLP) { ok(false, 'xlsx.full.min.js 없음 — 클라우드 시험을 못 돌림(건너뛰지 않고 ❌)'); return fin(); }
  const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
  let T = Date.parse('2026-11-16T06:00:00Z'); const now = () => T;
  const Fd = makeDb(); const { store } = Fd; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: { aladin_U495184596: { c: ['bd001'] }, aladin_U445876314: { c: ['ab009'] } } });
  put('prd_listings', 'aladin_U495184596', { listingId: 9101, usedCode: 'U495184596', title: '시험 블루레이', isbn13: null, grade: '상', price: 12000, priceList: 30000, qty: 1, sku: 'BD_U1', active: true, status: '판매중' });
  put('prd_listings', 'aladin_U445876314', { listingId: 9102, usedCode: 'U445876314', title: '시험 책 실패', isbn13: '9788900000011', grade: '상', price: 9000, priceList: 15000, qty: 1, sku: 'ABC_U2', active: true, status: '판매중' });
  put('app_settings', 'y24_reg', { r: { aladin_U445876314: { lid: 'aladin_U445876314', isbn: '9788900000011', grade: '상', skus: ['ab009'], at: '2026-11-14T11:45:00Z', st: 'autofail', auto: 1, job: 'y24aOLD', why: '엑셀을 넣었지만 미리보기 목록에 우리 줄이 안 보임' } }, auto: { stop: null } });
  const texts = { 'src/app.html': T0, 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const Y = makeY24Auto({ db: Fd.db, C: Fd.C, FV: Fd.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX });
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'bd1-')); const st = { login: 'ok', hold: false, en: true, pc: 'HOME', bc: false };
  const REG = makeY24Reg({ HOME, TEST: 1, note: () => {}, log: () => {}, pcName: () => st.pc, isLogger: () => false, enabled: () => st.en, login: () => st.login, holdOn: () => st.hold, kick: () => {} });
  const gather = () => { const s = REG.state(); return { st: { ok1: s.ok1, done: s.done, wait: s.wait, cur: s.cur, why: s.why, login: s.login, hold: s.hold, ban: s.ban, en: s.en, ...(st.bc ? { bc: s.bc } : {}), ver: st.bc ? '0.1.71' : '0.1.70' }, res: s.res, rej: [] }; };
  const led = () => store.app_settings.y24_reg || {};
  let y = await Y.step('HOME', gather());
  ok(led().bc && led().bc.aladin_U495184596 === BC && led().bcSeed && led().bcSeed.aladin_U495184596 && /150109556/.test(led().bcSeed.aladin_U495184596.why), '장부에 바코드가 없으면 한 번 심음(bc · 근거 bcSeed)', { bc: led().bc, s: led().bcSeed });
  ok(!y.jobs.length && y.plan && y.plan.mode === 'first' && y.plan.bcWait === 1 && /바코드/.test(y.why), '옛 번외(bc 표시 없음)엔 바코드 줄을 맡기지 않음 — 실패 줄이 있어도 계획은 처음 한 건(예전: 기다림)', { why: y.why, plan: y.plan });
  st.bc = true; T += 61e3; y = await Y.step('HOME', gather()); const J = y.jobs[0];
  ok(J && J.rows.length === 1 && J.rows[0].lid === 'aladin_U495184596' && J.rows[0].bc === BC && J.rows[0].isbn === BC && /bd001/.test(J.rows[0].self), '바코드를 아는 번외(bc:1)엔 블루레이 1건을 맡김(바코드 보존 · 자체코드 = SKU)', y);
  const e = led().r.aladin_U495184596; ok(e && e.st === 'auto' && e.bc === BC, '장부에 먼저 적은 줄에도 바코드', e);
  if (J) { const wb = XLSX.read(J.xlsx, { type: 'base64' }); const ws = wb.Sheets[wb.SheetNames[0]]; ok(String(ws.B28 && ws.B28.v) === BC, '엑셀 B28 = 바코드', ws.B28);
    ok(checkJob(J, REG.R.rec) === '', '번외 검사(checkJob) 통과', checkJob(J, REG.R.rec)); const p = REG.put(J); ok(p.code === 200 && REG.R.q.jobs[0].rows[0].bc === BC, '번외 put()이 받고 맡김 줄에 바코드를 지님', p); }
  delete store.app_settings.y24_reg.bc.aladin_U495184596; T += 61e3; await Y.step('HOME', gather()); ok(!(led().bc || {}).aladin_U495184596, '사람이 지운 바코드는 다시 심지 않음(bcSeed 기록)', led().bc);
  console.log('③ 번외');
  const job = (rows) => ({ id: 'y24aT1', rows, xlsx: 'A'.repeat(60) }); const row = (o) => ({ lid: 'aladin_U495184596', isbn: BC, bc: BC, grade: '상', price: 12000, qty: 1, self: 'Q1', ...o });
  ok(checkJob(job([row()]), null) === '' && /바코드가 이상함/.test(checkJob(job([row({ bc: '8809866320757' })]), null)) && /ISBN이 이상함/.test(checkJob(job([row({ bc: undefined })]), null)) && checkJob(job([row({ bc: undefined, isbn: '9788900000011' })]), null) === '', '바코드 줄은 검사 숫자 확인 · 바코드가 없으면 예전 ISBN 검사 그대로');
  ok(REG.state().bc === 1, '번외 상태에 bc:1(웹앱·클라우드가 이 표시를 보고 바코드 줄을 맡김)');
  const helper = rd('lab/col2/helper/readnow-col2-helper.js'); ok(/bc: s\.bc \|\| 0/.test(helper) && /r\.bc \|\| r\.isbn/.test(rd('lab/col2/helper/col2-y24reg.js')), '번외 홀로 연결이 bc 표시를 클라우드에 넘김 · 미리보기에서 바코드로 찾음');
  const app = T0; ok(/\.filter\(\(r\) => !r\.bc \|\| st\.bc\)/.test(app) && /y24RegNLed\(y24RegLed\(\)/.test(app), '웹앱 자동 올림도 번외 bc 표시를 볼 때만 바코드 줄 · 첫 건 셈은 y24RegNLed');
  fin();
})().catch((e) => { bad++; console.log('  ❌ 오류', e && e.stack); fin(); });
function fin() { console.log(bad ? `❌ tY24REG_BD1116 ${bad}개 실패` : '✓ tY24REG_BD1116 통과'); process.exitCode = bad ? 1 : 0; }
