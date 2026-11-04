// tAL2 — 정범님 11/03 ALPS: 큰 단추 · 멈춤 뒤 「▶ 이어서 진행」 · 📜 기록 한곳 · 주문번호를 보내 상자 수 확인 · 도우미 상자 수/주문 수 셈
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
{ process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-t2-' + Date.now()); const A = require(require('fs').existsSync(__dirname + '/../../local/readnow-alps.js') ? __dirname + '/../../local/readnow-alps.js' : '/home/user/readnow-scripts/local/readnow-alps.js'); const T = A._t;
  const hits = [{ row: { i: 0, pack: 'K1', rk: '박|서울' } }, { row: { i: 1, pack: 'K1', rk: '박|서울' } }, { row: { i: 2, pack: 'K1', rk: '안|부산' } }, { row: { i: 3, pack: 'K1', rk: '' } }];
  ok(T.boxCount(hits) === 3, '도우미: 수하인(이름·전화·주소)이 같은 줄 = 한 상자 · 합포장키가 같아도 사람이 다르면 다른 상자(3상자)');
  ok(T.orderCount([{ ono: 'A' }, { ono: 'A' }, { ono: 'B' }]) === 2, '도우미: 주문 수 = 주문번호 가짓수');
  T.histAdd({ id: 'h1', at: 'x', fileName: 'f.xlsx', status: 'error', error: '인쇄 프로그램 연결 안 됨', steps: [{ l: '출력', st: 'err' }], summary: { rows: 44, orders: 16, upload: { ok: 44, bad: 0 } }, t0: Date.now() });
  const h = A.history(); ok(h.length === 1 && h[0].rows === 44 && h[0].orders === 16 && h[0].step === '출력', '도우미 기록(hist)에 멈춘 일 · 단계 · 줄/주문 수');
  try { A.resume({}); ok(false, '마지막 일 없으면 이어서 못 함'); } catch (e) { ok(/마지막 일/.test(e.message), '마지막 일이 없으면 「이어서」는 까닭과 함께 거절'); } }
setTimeout(() => { console.log('❌ tAL2 시간 넘김'); process.exit(2); }, 170000);
require('./harness.js')(async (p) => {
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\//, (r) => r.fulfill({ body: require('fs').readFileSync(__dirname + '/xlsx.full.min.js'), contentType: 'application/javascript' }));
  const H = { run: null, body: null, resume: null };
  await p.route(/^http:\/\/127\.0\.0\.1:8898\//, async (r) => { const u = new URL(r.request().url()); const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(o) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    const step = (st, err) => ['login', 'check', 'upload', 'print', 'verify', 'send'].map((k, i) => ({ k, l: k, st: i < st ? 'ok' : i === st ? (err ? 'err' : 'run') : 'todo', pct: 50, d: '' }));
    if (u.pathname === '/alps/status') return J({ ok: true, ver: '0.5.3', pc: 'MJ-MAIN', cfg: { printer: '롯데택배 시험' }, cred: { saved: true }, run: H.run, key: { fp: 'f', pub: 'P' }, remote: { on: false } });
    if (u.pathname === '/alps/run') { H.body = JSON.parse(r.request().postData()); H.run = { id: 'r1', at: '2026-11-03T14:50', fileName: H.body.fileName, status: 'error', error: '인쇄 프로그램(OZ 웹런처)에 연결이 안 됩니다', steps: step(3, true), summary: { rows: 3, orders: 2, upload: { ok: 3, bad: 0 } } }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/resume') { H.resume = JSON.parse(r.request().postData() || '{}'); H.run = { id: 'r2', at: '2026-11-03T15:00', fileName: H.run.fileName, status: 'run', steps: step(3), summary: { uploadSkip: 'ALPS 목록에 이미 모두 있음(3줄)' } }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/input') { H.fileIn = JSON.parse(r.request().postData() || '{}'); if (H.run) H.run = { ...H.run, need: null, status: 'run' }; return J({ ok: true }); }
    if (u.pathname === '/alps/hist') return J({ ok: true, hist: [{ id: 'r0', at: '2026-11-03T10:00', file: '판매완료20261103.xlsx', status: 'done', rows: 44, orders: 16, boxes: 16, upload: { ok: 44 }, printed: 16, waybills: 16 }] });
    return J({ ok: false }); });
  await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: require('fs').readFileSync(__dirname + '/xlsx.full.min.js', 'utf8') });
  const o = await p.evaluate(async () => { const o = {}; const w = (ms) => new Promise((r) => setTimeout(r, ms)); const SH = window.ReadnowShipping; const td = SH.ymd(new Date());
    const ord = (no, rcv, items, at) => ({ orderNo: no, buyer: rcv, orderedAt: td + ' ' + at, recipient: { name: rcv }, items });
    const orders = [ord('001-B1', '나수령', [{ listingId: '91', title: '파란 책', price: 5000, qty: 1, sku: 'BLUAAA' }], '09:00'), ord('001-B2', '가수령', [{ listingId: '92', title: '분홍 책', price: 6000, qty: 1, sku: 'PNKLUX' }, { listingId: '93', title: '초록 책', price: 7000, qty: 1, sku: 'GRNAAA' }], '09:10')];
    const HH = SH.ALADIN_XLS_HEAD; const row = (no, sku, t, rcv) => ({ v: HH.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345' }[h] || '')) });
    S.ship = { at: new Date().toISOString(), tabCounts: { '발송 요청': 2 }, orders }; __FS.shp_state = __FS.shp_state || {}; __FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); S.shipX = { at: new Date().toISOString(), header: HH, rows: [row('001-B1', 'BLUAAA', '[중고-최상] 파란 책', '나수령'), row('001-B2', 'PNKLUX', '[중고-상] 분홍 책', '가수령'), row('001-B2', 'GRNAAA', '[중고-상] 초록 책', '가수령')] };
    __FS.shp_state.excel = S.shipX; S.shipC = { orders: [], at: new Date().toISOString() }; S._shipLive = 1; S.shipTab = 'deliv'; S.shipView = 'order';
    await openShip(); await w(600); const sh = document.getElementById('sheet'); const b = sh.querySelector('.alps-main #alps_auto'); o.big = !!b && parseFloat(getComputedStyle(b).fontSize) >= 16; o.hand = !!sh.querySelector('details.alps-hand #alps_up'); o.histBtn = !!sh.querySelector('#alps_hist');
    await needXLSX(); window.ask = async () => true; window.confirm = () => true; return o; });
  await p.click('#alps_auto'); await p.waitForTimeout(3000); await p.evaluate(() => { try { alpsProgPaint(); } catch (e) {} });
  const o2 = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await w(1600); const rs = document.getElementById('alps_resume'); o.resumeBtn = !!rs; return o; }); o.resumeBtn = o2.resumeBtn;
  if (o.resumeBtn) { await p.click('#alps_resume'); await p.waitForTimeout(2000); }
  Object.assign(o, await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; o.after = (S.alps.st || {}).id; await w(500); const d = await db.collection('prd_system').doc('alps_hist').get(); o.saved = d.exists && !!(d.data().runs || {}).r1; await openAlpsHist(); await w(900); o.histTxt = (document.getElementById('ah_b') || {}).textContent || ''; return o; }));
  console.log(JSON.stringify(o).slice(0, 600));
  H.run = { id: 'r3', fileName: 'f.xlsx', status: 'wait', steps: [], summary: {}, need: { id: 7, type: 'file', msg: '빠진 1줄', miss: [{ name: '가수령', title: '[중고-상] 초록 책', ono: '001-B2' }] } };
  await p.evaluate(async () => { S.alps.st = { status: 'run', steps: [], summary: {} }; alpsPoll(); await new Promise((r) => setTimeout(r, 4000)); });
  ok(H.fileIn && H.fileIn.kind === 'file' && H.fileIn.needId === 7 && H.fileIn.rows.length === 1 && H.fileIn.rows[0].title.includes('초록') && H.fileIn.b64, '빠진 줄만 새로 접수: 도우미가 알려 준 1줄만 담은 파일을 웹앱이 만들어 보냄(물음 번호 7)');
  ok(o.big && o.hand && o.histBtn, '📦 ALPS 자동 처리 단추가 크고 따로(손으로 하기는 접기 안) · 📜 기록 단추');
  ok(o.resumeBtn && o.after === 'r2', '멈춘 뒤 「▶ 이어서 진행」 → 도우미 /alps/resume → 새 일(r2)로 이어짐');
  ok(H.body && H.body.rows.length === 3 && H.body.rows.every((r) => r.ono) && new Set(H.body.rows.map((r) => r.ono)).size === 2, '도우미에 줄마다 주문번호를 보냄(상자 수 = 주문 수 확인용): ' + (H.body ? H.body.rows.map((r) => r.ono).join(',') : '-'));
  ok(H.body && H.body.rows.every((r) => r.rk) && H.body.rows.filter((r) => r.name === '가수령').map((r) => r.rk).every((k, i, a) => k === a[0]) && H.body.rows.find((r) => r.name === '나수령').rk !== H.body.rows.find((r) => r.name === '가수령').rk, '받는 사람 열쇠(rk): 같은 사람 = 같은 값 · 다른 사람 = 다른 값(도우미가 상자 수와 견줌)');
  ok(o.saved, '멈춘 일이 웹앱 기록 한곳(prd_system/alps_hist)에 남음');
  ok(/모두 2번/.test(o.histTxt) && /44줄 · 주문 16건 · 상자 16개/.test(o.histTxt) && /멈춤/.test(o.histTxt), '📜 기록 화면: 웹앱 기록 + 도우미 기록 합쳐 보임 ' + o.histTxt.slice(0, 120));
  console.log(bad ? `❌ tAL2 실패 ${bad}` : '✓ tAL2 통과'); setTimeout(() => process.exit(bad ? 1 : 0), 300); });
