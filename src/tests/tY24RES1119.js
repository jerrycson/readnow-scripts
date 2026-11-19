// tY24RES1119 — (y24res1 11/19) 한 권 0줄 때문에 예스24 자동 올림 전체가 멈추던 것
//   11/18 13:27Z 1건짜리 일(책 한 권)이 예스24 엑셀 확인에서 0줄(정상 답 S000)로 멈춘 뒤 번외 새 판 전까지 다음 책도 못 올라감
//   → 1건짜리 · 아무것도 안 누름 · S000 0줄 · 그 전 건너뜀 뒤 성공이 있으면 그 책만 건너뛰고 멈춤을 풂 · 연달아 두 권 · 오류코드 · 원자료 없음 · ⚙ 끔이면 그대로
// 실행: node src/tests/tY24RES1119.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무것도 안 함
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const T0 = rd('src/app.html'); const cut = (a, b) => { const i = T0.indexOf(a); const j = T0.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T0.slice(i, j); };
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF };')();
console.log('① 웹앱 설정');
ok(F.Y24R_DEF.skip0 === 1, '⚙ 0줄 한 권 건너뛰기 기본 켬');
ok(/if \(p\.skip0 != null\) c\.skip0 = b01\(p\.skip0\)/.test(T0) && /id="y24r_skip0"/.test(T0) && /q\('#y24r_skip0'\) \? \{ skip0:/.test(T0), 'y24RegCfg·⚙ 칸·저장 처리에 skip0 (저장 때 지워지지 않음)');
console.log('② 클라우드');
(async () => {
  const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
  const { makeY24Auto } = require(path.join(TOP, 'cloud/y24auto.js'));
  const XLP = [path.join(__dirname, 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', process.env.RN_XLSX].filter(Boolean).find((f) => fs.existsSync(f));
  if (!XLP) { ok(false, 'xlsx.full.min.js 없음 — 클라우드 시험을 못 돌림(건너뛰지 않고 ❌)'); return fin(); }
  const XLSX = (() => { const m = { exports: {} }; new Function('module', 'exports', fs.readFileSync(XLP, 'utf8'))(m, m.exports); return m.exports; })();
  let T = Date.parse('2026-11-18T14:00:00Z'); const now = () => T;
  const texts = { 'src/app.html': T0, 'readnow-ext-core.js': rd('readnow-ext-core.js'), 'readnow-registry.js': rd('readnow-registry.js'), 'readnow-shipping-core.js': rd('readnow-shipping-core.js') };
  const WHY = (isbn) => `예스24 엑셀 확인 결과(누르기 전 멈춤 · 아무것도 누르지 않음) — ${isbn} 결과 표에 없음 (확인 0줄 · 등록 가능 0) · 예스24가 확인 결과를 한 줄도 돌려주지 않음 · [등록]은 누르지 않음`;
  const RAW = { fired: null, net: [{ p: '/api/Product/ReadExcelFile', m: 'POST', st: 200, body: '{"RESULT_LIST":[],"NICK_NAME":null,"TOTAL_COUNT":0,"RESULT_CODE":"S000","MESSAGE":null}' }], vs: { rc: 'S000', nRes: 0, reg: 0 } };
  const mk = (o = {}) => {
    const Fd = makeDb(); const { store } = Fd; const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
    put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: o.reg ? { reg: o.reg } : {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} });
    put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: { aladin_U111: { c: ['aa001'] }, aladin_U222: { c: ['aa002'] } } });
    put('prd_listings', 'aladin_U111', { listingId: 9201, usedCode: 'U111', title: '시험 책 하나', isbn13: '9788900000011', grade: '상', price: 14500, priceList: 20000, qty: 1, sku: 'AB_U1', active: true, status: '판매중' });
    put('prd_listings', 'aladin_U222', { listingId: 9202, usedCode: 'U222', title: '시험 책 둘', isbn13: '9788900000028', grade: '상', price: 8800, priceList: 15000, qty: 1, sku: 'AB_U2', active: true, status: '판매중' });
    const job = 'y24a-시험-0줄';
    const r = { aladin_U111: { st: 'autofail', auto: 1, job, batch: job, isbn: '9788900000011', skus: ['aa001'], why: WHY('9788900000011'), failAt: '2026-11-18T13:27:15Z', at: '2026-11-18T13:26:11Z', hist: [] },
      aladin_U222: { st: 'retry', auto: 1, isbn: '9788900000028', skus: ['aa002'], price: 8800, hist: [] },
      aladin_Z9: { st: 'sent', auto: 1, ok: 1, okAt: '2026-11-18T13:25:09Z', gno: '1', at: '2026-11-18T13:24:05Z', day: '2026-11-18', skus: ['zz9'] }, ...(o.r || {}) };
    put('app_settings', 'y24_reg', { w: { px_aladin_U111: { on: 1, px: 'al', lid: 'aladin_U111' }, px_aladin_U222: { on: 1, px: 'al', lid: 'aladin_U222' } }, r,
      auto: { stop: { why: o.why || WHY('9788900000011'), state: 'fail', job, hv: '0.1.78', at: '2026-11-18T13:27:15Z' }, last: { job: o.lastJob || job, raw: o.raw === undefined ? RAW : o.raw, state: 'fail' }, ...(o.auto || {}) } });
    const Y = makeY24Auto({ db: Fd.db, C: Fd.C, FV: Fd.FV, now, getText: async (f) => { if (!texts[f]) throw new Error('없음 ' + f); return texts[f]; }, getUrl: async () => { throw new Error('바깥 안 감'); }, xlsx: XLSX });
    return { Y, store };
  };
  const g = () => ({ st: { ok1: 1, done: 0, wait: 0, cur: null, why: '', login: 'ok', hold: false, ban: null, en: true, bc: 1, ver: '0.1.78' }, res: [], rej: [] });
  { const { Y, store } = mk(); T += 60e3; const y = await Y.step('HOME', g()); const L = store.app_settings.y24_reg;
    ok(!L.auto.stop && /한 권 0줄/.test(L.auto.resumeBy || '') && L.auto.skip0 && L.auto.skip0.lid === 'aladin_U111' && L.auto.skip0.n === 1, '1건 · S000 0줄 · 앞 성공 있음 → 멈춤 풂 · auto.skip0 기록', L.auto);
    ok(L.r.aladin_U111.st === 'autofail' && L.r.aladin_U111.skip0 === 1 && L.r.aladin_U111.why, '그 책은 실패로 남고 건너뜀 표시(지우지 않음 · 다시 고르지 않음)', L.r.aladin_U111);
    const J = y.jobs && y.jobs[0]; ok(J && J.rows.length === 1 && J.rows[0].lid === 'aladin_U222', '바로 다음 책 1권을 맡김', { why: y.why, rows: J && J.rows }); }
  { const { Y, store } = mk({ auto: { skip0: { job: 'y24a-앞', lid: 'aladin_U9', at: '2026-11-18T13:26:00Z', n: 1 } } }); T += 60e3; const y = await Y.step('HOME', g()); const L = store.app_settings.y24_reg;
    ok(L.auto.stop && /멈춤/.test(y.why || '') && !(y.jobs || []).length, '앞 건너뜀 뒤에 성공이 없으면(연달아 두 권 0줄) 그대로 멈춤 — 사람에게', { why: y.why, stop: L.auto.stop }); }
  { const { Y, store } = mk({ auto: { skip0: { job: 'y24a-앞', lid: 'aladin_U9', at: '2026-11-18T13:00:00Z', n: 1 } } }); T += 60e3; await Y.step('HOME', g()); const L = store.app_settings.y24_reg;
    ok(!L.auto.stop && L.auto.skip0.n === 2 && L.auto.skip0.hist.length === 1 && L.auto.skip0.hist[0].job === 'y24a-앞', '앞 건너뜀 뒤 성공이 있으면 다시 풂 · 앞 기록은 hist에 남음', L.auto.skip0); }
  { const { Y, store } = mk({ why: WHY('9788900000011') + ' · 오류코드 -17' }); T += 60e3; await Y.step('HOME', g());
    ok(store.app_settings.y24_reg.auto.stop, '예스24 오류코드가 붙은 멈춤은 그대로'); }
  { const { Y, store } = mk({ raw: null }); T += 60e3; await Y.step('HOME', g()); ok(store.app_settings.y24_reg.auto.stop, '원자료(S000 답)가 없으면 그대로'); }
  { const { Y, store } = mk({ lastJob: 'y24a-다른' }); T += 60e3; await Y.step('HOME', g()); ok(store.app_settings.y24_reg.auto.stop, '마지막 결과가 다른 일이면 그대로'); }
  { const { Y, store } = mk({ raw: { ...RAW, fired: { at: 1 } } }); T += 60e3; await Y.step('HOME', g()); ok(store.app_settings.y24_reg.auto.stop, '[등록]을 누른 흔적이 있으면 그대로'); }
  { const { Y, store } = mk({ reg: { skip0: 0 } }); T += 60e3; await Y.step('HOME', g()); ok(store.app_settings.y24_reg.auto.stop, '⚙ 끄면 예전처럼 멈춤'); }
  { const { Y, store } = mk({ r: { aladin_U333: { st: 'autofail', auto: 1, job: 'y24a-시험-0줄', isbn: '9788900000035', why: WHY('9788900000035') } } }); T += 60e3; await Y.step('HOME', g());
    ok(store.app_settings.y24_reg.auto.stop, '여러 권짜리 일은 그대로(우리 엑셀 탓일 수 있음)'); }
  { const { Y, store } = mk({ r: { aladin_Z9: { st: 'sent', auto: 1, ok: 1, okAt: '2026-11-18T13:25:09Z', gno: '1', at: '2026-11-18T13:24:05Z', skus: ['zz9'] } } }); const L0 = store.app_settings.y24_reg; L0.r.aladin_U111.skip0 = 1; L0.auto.stop = { ...L0.auto.stop, hv: '0.1.70', why: WHY('9788900000011') + ' · 오류코드 -17' };
    T += 60e3; await Y.step('HOME', g()); ok(store.app_settings.y24_reg.r.aladin_U111.st === 'autofail', '번외 새 판 풀기도 건너뛴 책은 되살리지 않음', store.app_settings.y24_reg.r.aladin_U111); }
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(rd('cloud/y24auto.js').split('y24res1')[1] || ''), '새 코드에 브라우저 팝업 없음');
  fin();
})().catch((e) => { bad++; console.log('  ❌ 오류', e && e.stack); fin(); });
function fin() { console.log(bad ? `❌ tY24RES1119 ${bad}개 실패` : '✓ tY24RES1119 통과'); process.exitCode = bad ? 1 : 0; }
