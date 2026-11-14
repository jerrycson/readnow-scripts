// tHEADLESS1_1114 — (정범님 11/14 17:37 「왜 웹앱을 키도록 구성하고 있는 거야? 수집기만 해도 불편한데」) 🖥 웹앱이 닫혀 있어도 예스24 자동 올림이 돎
//   웹앱 탭은 아예 없음(브라우저도 안 띄움) — 번외 도우미의 올림 모듈(lab/col2/helper/col2-y24reg.js)과 클라우드 판단(cloud/y24auto.js)만으로:
//   ① 장부가 비어 있으면 클라우드가 판매중 상품에서 1건을 골라(값 싼 것부터) 장부에 먼저 적고 엑셀째 넘김 → 번외 put()이 같은 검사(checkJob)로 받음
//   ② 엑셀 = 웹앱과 같은 칸(y24RegAoa · SheetJS 0.18.5) · 판매가 = 공용 파일 y24PriceOf(F45 ③ 우리뿐 +20%)
//   ③ 지킴: 예스24에 같은 책·등급이 있으면 · 주문에 묶인 상품 · 로거·MJ-MAIN · 로그인 기다림 · 출고 중 · 올리는 중이면 새 묶음 없음
//   ④ 번외 결과(done · 자체코드 확인) → 장부 ✅(ok·gno) → 다음 차례는 여러 건(25건씩) · 결과 받았음(ack)으로 번외 결과가 비워짐
//   ⑤ 실패 결과 → 장부 autofail + 멈춤(auto.stop) → 멈춘 동안 새 묶음 없음 · 번외가 맡김을 거절하면 다음 차례에 실패로 적음
//   ⑥ 장부엔 있는데 번외가 모르는 묶음(번외가 다시 켜짐 등) → 3분 뒤 같은 이름으로 다시 넘김(번외가 같은 상품을 두 번 받지 않음)
//   ⑦ 홀로 연결 창구(cloud/col2solo.js) 안에서 — 로거 PC엔 판단 안 줌
// 실행: node src/tests/tHEADLESS1_1114.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto, blockOf } = require(path.join(TOP, 'cloud/y24auto.js'));
const { makeY24Reg, checkJob } = require(path.join(TOP, 'lab/col2/helper/col2-y24reg.js'));
const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
(async () => {
  ok(!!blockOf(rd('src/app.html')), '웹앱 ◆y24reg 덩어리를 떼어 씀(y24AutoCand·y24AutoPlan 등 모두 있음)');
  let T = Date.parse('2026-11-14T10:00:00Z'); const now = () => T;
  const F = makeDb(); const { store } = F; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
  put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: { aladin_A1: { c: ['ab001'] }, aladin_A2: { c: ['ab002'] }, aladin_A3: { c: ['ab003'] }, aladin_A4: { c: ['ab004'] }, aladin_A5: { c: ['ab005'] } } });
  const L = (id, isbn, price, x) => put('prd_listings', 'aladin_' + id, { listingId: 9000 + +id.slice(1), usedCode: id, title: '시험 책 ' + id, isbn13: isbn, grade: '상', price, priceList: 15000, qty: 1, sku: 'ABC_' + id, active: true, status: '판매중', ...(x || {}) });
  L('A1', '9788900000011', 9000); L('A2', '9788900000028', 5000); L('A3', '9788900000035', 4000); L('A4', '9788900000042', 7000); L('A5', '9788900000059', 3000, { sku: 'DUPES 미끼' });
  put('y24_listings', '111111111', { goodsNo: '111111111', isbn13: '9788900000035', grade: '상', state: '02', firstSeenAt: '2026-11-01T00:00:00Z' }); /* A3 — 예스24에 같은 책·등급이 이미 있음 */
  put('crm_orders', 'aladin_X1', { kind: 'sale', orderedAt: '2026-11-13T00:00:00Z', orderNo: 'X1', items: [{ aladinUsedCode: 'A2', lineStatus: 'normal' }] }); /* A2 — 주문에 묶임 */
  for (const i of ['9788900000011', '9788900000028', '9788900000035', '9788900000042']) put('y24_mkt', i, { none: true, at: '2026-11-14T09:00:00Z' }); /* 예스24에 우리뿐 → +20% */
  const texts = { 'src/app.html': rd('src/app.html'), 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const Y = makeY24Auto({ db: F.db, C: F.C, FV: F.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX });
  /* 번외 올림 모듈(실제 파일) — 숨은 크롬은 띄우지 않음(put·state·ack만) */
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'hl1-')); const st = { login: 'ok', hold: false, en: true, pc: 'HOME' }; const notes = [];
  const REG = makeY24Reg({ HOME, TEST: 1, note: (m) => notes.push(m), log: () => {}, pcName: () => st.pc, isLogger: () => /^LOGGER/.test(st.pc), enabled: () => st.en, login: () => st.login, holdOn: () => st.hold, kick: () => {} });
  const gather = () => { const s = REG.state(); return { st: { ok1: s.ok1, done: s.done, wait: s.wait, cur: s.cur, why: s.why, login: s.login, hold: s.hold, ban: s.ban, en: s.en }, res: s.res, rej: [] }; };
  const take = (y) => { if (y.ack && y.ack.length) REG.ack(y.ack); return (y.jobs || []).map((j) => REG.put(j)); };
  const led = () => (store.app_settings.y24_reg || {});
  /* ③ 로그인 기다림 · 출고 중 · 로거 · MJ-MAIN */
  st.login = 'need'; let y = await Y.step('HOME', gather()); ok(!y.jobs.length && /로그인/.test(y.why), '③ 예스24 로그인이 풀려 있으면 새 묶음 없음', y.why); st.login = 'ok';
  st.hold = true; T += 61e3; y = await Y.step('HOME', gather()); ok(!y.jobs.length && /출고 중/.test(y.why), '③ 출고 중이면 새 묶음 없음', y.why); st.hold = false;
  y = await Y.step('LOGGER-1', gather()); ok(!y.jobs.length && /로거/.test(y.why), '③ 로거 PC엔 안 줌', y.why);
  y = await Y.step('MJ-MAIN', gather()); ok(!y.jobs.length && /MJ-MAIN/.test(y.why), '③ MJ-MAIN엔 안 줌', y.why);
  /* ① 처음 한 건 */
  T += 61e3; y = await Y.step('HOME', gather()); const J1 = y.jobs[0];
  ok(J1 && J1.rows.length === 1 && J1.rows[0].lid === 'aladin_A4', '① 장부가 비면 판매중 상품에서 1건 — 값 싼 것부터 · 주문에 묶인 A2·예스24에 있는 A3·미끼 A5는 뺌 → A4(7,000원)', y);
  const e1 = led().r && led().r.aladin_A4; ok(e1 && e1.st === 'auto' && e1.auto === 1 && e1.job === J1.id && /클라우드\(HOME\)/.test(e1.by), '① 장부에 먼저 적음(st auto · 맡김 이름 · 누가 = 클라우드(HOME))', e1);
  ok(J1 && J1.rows[0].price === 8400 && /ab004/.test(J1.rows[0].self), '② 판매가 = 공용 파일 y24PriceOf(우리뿐 → 7,000 + 20% = 8,400) · 자체코드 = 통합 SKU', J1 && J1.rows[0]);
  const wb = XLSX.read(J1.xlsx, { type: 'base64' }); const ws = wb.Sheets[wb.SheetNames[0]]; const cell = (a) => (ws[a] ? ws[a].v : undefined); const aoa = []; aoa[26] = ['', cell('B27')]; aoa[27] = ['', cell('B28'), cell('C28'), cell('D28'), cell('E28'), cell('F28'), cell('G28'), cell('H28')];
  ok(aoa[26] && aoa[26][1] === '바코드/상품번호' && String(aoa[27][1]) === '9788900000042' && +aoa[27][4] === 8400 && aoa[27][7] === J1.rows[0].self, '② 엑셀 = 웹앱과 같은 바코드용 대량 등록 칸(27행 머리 · 28행 줄)', aoa.slice(26, 28));
  ok(checkJob(J1, REG.R.rec) === '', '① 번외 검사(checkJob — 처음엔 1건만 · 수량 1 · 되풀이 0)를 통과', checkJob(J1, REG.R.rec));
  const p1 = take(y); ok(p1[0] && p1[0].code === 200 && REG.state().wait.length === 1, '① 번외 put()이 받음 — 웹앱 없이 맡김이 들어감', p1);
  T += 61e3; y = await Y.step('HOME', gather()); ok(!y.jobs.length && /올리는 중/.test(y.why), '③ 올리는 중이면 새 묶음 없음(되풀이 0)', y.why);
  /* ④ 성공 결과 */
  REG.R.q.res[J1.id] = { state: 'done', gno: { aladin_A4: '222222222' }, cnt: { sale: 1, unpub: 0 }, msg: '올라감', at: T, rows: ['aladin_A4'] }; REG.R.q.jobs = []; REG.R.rec.ok1 = T; REG.R.rec.lid.aladin_A4 = { at: T }; REG.R.rec.sku[J1.rows[0].self] = 'aladin_A4';
  put('prd_listings', 'aladin_A6', { listingId: 9006, usedCode: 'A6', title: '시험 책 A6', isbn13: '9788900000066', grade: '최상', price: 6000, qty: 1, sku: 'ABC_A6', active: true, status: '판매중' }); store.app_settings.sku_map_0.m.aladin_A6 = { c: ['ab006'] }; put('y24_mkt', '9788900000066', { none: true });
  put('app_settings', 'platforms', { y24: { reg: { autoAll: 1 } } }); Y._M.dataAt = 0; /* 판매중 상품 전부(정범님이 켬)를 흉내 */
  T += 61e3; y = await Y.step('HOME', gather()); const e2 = led().r.aladin_A4;
  ok(e2.ok === 1 && e2.gno === '222222222' && e2.st === 'sent' && y.ack.includes(J1.id), '④ 번외 결과 → 장부 ✅(ok · 예스24 번호) · 결과 받았음(ack)', { e2, ack: y.ack });
  take(y); ok(!Object.keys(REG.state().res).length, '④ ack 뒤 번외 결과가 비워짐');
  const J2 = y.jobs[0]; ok(J2 && J2.rows.length === 2 && J2.rows.every((r) => ['aladin_A1', 'aladin_A6'].includes(r.lid)), '④ 첫 건 ✅ 뒤 여러 건(묶음) — A1·A6(A2 주문 묶임·A3 예스24에 있음·A4 이미 올림은 여전히 뺌)', y);
  ok(J2 && checkJob(J2, REG.R.rec) === '', '④ 번외 검사 통과(첫 성공 뒤라 여러 건)', J2 && checkJob(J2, REG.R.rec)); take({ jobs: [J2] });
  /* ⑤ 실패 → 멈춤 */
  REG.R.q.res[J2.id] = { state: 'fail', pre: true, msg: '대량 등록 화면 모양이 다름', todo: '리드나우 방에 알려 주세요', at: T, rows: J2.rows.map((r) => r.lid) }; REG.R.q.jobs = [];
  T += 61e3; y = await Y.step('HOME', gather()); take(y); const e3 = led().r.aladin_A1;
  ok(e3.st === 'autofail' && led().auto && led().auto.stop && /모양이 다름/.test(led().auto.stop.why) && !y.jobs.length, '⑤ 실패 결과 → 장부 autofail · 멈춤(auto.stop) · 새 묶음 없음', { e3, auto: led().auto });
  T += 61e3; y = await Y.step('HOME', gather()); ok(!y.jobs.length && /멈춤/.test(y.why), '⑤ 멈춘 동안 새 묶음 없음(사람이 📤 화면 「▶ 이어 가기」)', y.why);
  /* ⑥ 번외가 모르는 묶음 다시 넘김 */
  store.app_settings.y24_reg.auto.stop = null; store.app_settings.y24_reg.r.aladin_A1 = { ...store.app_settings.y24_reg.r.aladin_A1, st: 'auto', job: 'y24aLOST1', at: new Date(T - 4 * 60e3).toISOString(), by: '🤖 자동 올림 · 클라우드(HOME)' };
  T += 61e3; y = await Y.step('HOME', gather()); ok(y.jobs.length === 1 && y.jobs[0].id === 'y24aLOST1' && y.jobs[0].again && /올리는 중/.test(y.why), '⑥ 장부엔 있는데 번외가 모르는 묶음 → 같은 이름으로 다시 넘김(새 묶음은 안 냄)', y);
  /* ⑤-2 번외가 거절 → 실패로 */
  y = await Y.step('HOME', { ...gather(), rej: [{ id: 'y24aLOST1', err: '엑셀 파일이 없거나 너무 큼', rows: ['aladin_A1'] }] }); ok(led().r.aladin_A1.st === 'autofail' && (y.rejAck || []).includes('y24aLOST1'), '⑤ 번외가 맡김을 거절하면 장부에 실패로(되풀이 거절은 빼고)', { e: led().r.aladin_A1, y });
  /* ⑦ 홀로 연결 창구 안 */
  const { makeSolo } = require(path.join(TOP, 'cloud/col2solo.js')); const crypto = require('crypto'); const kp = crypto.generateKeyPairSync('ed25519'); const pub = kp.publicKey.export({ type: 'spki', format: 'pem' });
  put('app_settings', 'col2_solo', { pcs: { HOME: { pub }, 'LOGGER-1': { pub, kind: 'logger' } } }); let called = 0; const SO = makeSolo({ db: F.db, C: F.C, FV: F.FV, log: () => {}, mods: async () => ({}), now: () => Date.now(), y24: { step: async (pc) => { called++; return { v: 1, why: 'ok ' + pc, ack: [], jobs: [] }; } } });
  const call = async (pc) => { const raw = Buffer.from(JSON.stringify({ pc, ts: Date.now(), nonce: crypto.randomBytes(8).toString('hex'), op: 'sync', y24reg: gather() })); return SO.api(raw, crypto.sign(null, raw, kp.privateKey).toString('base64')); };
  let [c1, r1] = await call('HOME'); ok(c1 === 200 && r1.y24reg && r1.y24reg.why === 'ok HOME' && called === 1, '⑦ 서명된 HOME 번외 → 창구가 예스24 판단을 실어 답함', r1.y24reg);
  [c1, r1] = await call('LOGGER-1'); ok(c1 === 200 && r1.y24reg && /로거/.test(r1.y24reg.why) && called === 1, '⑦ 로거 PC엔 판단을 부르지 않음(약속 0)', r1.y24reg);
  try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {}
  console.log(bad ? `✗ 실패 ${bad}` : '✓ tHEADLESS1_1114 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 멈춤', e && e.stack); process.exit(1); });
