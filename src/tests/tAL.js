// tAL — 11/02 정범님: 📦 ALPS 자동 처리 — 파일 이름 판매완료YYYYMMDD.xlsx · 줄 순서 = 오늘 출고 화면 순서 · 도우미(127.0.0.1:8898) 진행·OTP·끝 → 운송장 목록이 openInvMatch로
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\//, (r) => r.fulfill({ body: require('fs').readFileSync(__dirname + '/xlsx.full.min.js'), contentType: 'application/javascript' })); /* 시험 PC는 cdnjs가 막힘 — npm 0.18.5 같은 판 */
  const H = { run: null, body: null, inputs: [], polls: 0, up: true };
  await p.route(/^http:\/\/127\.0\.0\.1:8898\//, async (r) => { const u = new URL(r.request().url()); const J = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(o) });
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (!H.up) return r.abort(); const step = (st) => ['login', 'check', 'upload', 'print', 'verify', 'send'].map((k, i) => ({ k, l: k, st: i < st ? 'ok' : i === st ? 'run' : 'todo', pct: 50, d: '' }));
    if (u.pathname === '/alps/status') { H.polls++; if (H.run && H.run.status === 'run' && H.polls > 2 && !H.inputs.length) { H.run.status = 'wait'; H.run.need = { type: 'otp', msg: 'ALPS가 OTP·인증번호를 묻습니다. 번호를 넣어 주세요.' }; }
      if (H.run && H.inputs.length && H.run.status !== 'done') { H.run = { ...H.run, status: 'done', done: true, hasResult: true, need: null, steps: step(6), summary: { upload: { ok: 3 }, printed: 2, waybills: 2 } }; }
      return J({ ok: true, ver: '0.3.3', pc: 'MJ-MAIN', cfg: { printer: '롯데택배 시험' }, cred: { saved: true }, run: H.run, key: { fp: 'fff000', pub: 'PUB2' }, remote: { on: false } }); }
    if (u.pathname === '/alps/run') { H.body = JSON.parse(r.request().postData()); H.run = { id: 'r1', fileName: H.body.fileName, status: 'run', steps: step(1), summary: {} }; return J({ ok: true, run: H.run }); }
    if (u.pathname === '/alps/input') { H.inputs.push(JSON.parse(r.request().postData())); return J({ ok: true }); }
    if (u.pathname === '/alps/result') return J({ ok: true, aoa: [['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ['240000000011', '나수령', '[중고-최상] 파란 책', 'BLUAAA', 'M1', '출력', '', ''], ['240000000012', '가수령', '분홍 책', 'PNKLUX', 'M2', '출력', '', ''], ['240000000012', '가수령', '분홍 책 둘', 'PNKLUY', 'M3', '출력', '', 'P']] });
    return J({ ok: false }); });
  await p.evaluate(require('./seed.js')); await p.addScriptTag({ content: require('fs').readFileSync(__dirname + '/xlsx.full.min.js', 'utf8') }); /* 시험 PC는 cdnjs가 막힘 — npm xlsx 0.18.5(웹앱이 부르는 것과 같은 판) */
  const o = await p.evaluate(async () => { const o = {}; const SH = window.ReadnowShipping; const td = SH.ymd(new Date());
    const ord = (no, rcv, items, at) => ({ orderNo: no, buyer: rcv, orderedAt: td + ' ' + at, recipient: { name: rcv }, items });
    const orders = [ord('001-B1', '나수령', [{ listingId: '91', title: '파란 책', price: 5000, qty: 1, sku: 'BLUAAA' }], '09:00'), ord('001-B2', '가수령', [{ listingId: '92', title: '분홍 책', price: 6000, qty: 1, sku: 'PNKLUX' }, { listingId: '93', title: '분홍 책 둘', price: 6000, qty: 1, sku: 'PNKLUY' }], '09:30')];
    const H = SH.ALADIN_XLS_HEAD; const row = (no, sku, t, rcv) => ({ v: H.map((h) => ({ 상태: '발송요청', 주문번호: no, 자체상품관리코드: sku, 상품명: t, 수량: '1', 수령인: rcv, 판매가: '5,000', 우편번호: '12345' }[h] || '')) });
    S.ship = { at: new Date().toISOString(), tabCounts: { '발송 요청': 2 }, orders }; __FS.shp_state = __FS.shp_state || {}; __FS.shp_state.current = JSON.parse(JSON.stringify(S.ship)); __FS.shp_state.excel = S.shipX = { at: new Date().toISOString(), header: H, rows: [row('001-B1', 'BLUAAA', '[중고-최상] 파란 책', '나수령'), row('001-B2', 'PNKLUY', '분홍 책 둘', '가수령'), row('001-B2', 'PNKLUX', '분홍 책', '가수령')] };
    S.shipC = { orders: [], at: new Date().toISOString() }; S._shipLive = 1; S.shipTab = 'deliv'; S.shipView = 'order'; S.shipSort = 'shelf';
    try { await openShip(); } catch (e) { o.openErr = String(e && (e.message || e.type)); } await new Promise((r) => setTimeout(r, 600)); const sh = document.getElementById('sheet'); const tx = sh.textContent;
    o.disp = ['001-B1', '001-B2'].sort((a, b) => tx.indexOf(a) - tx.indexOf(b)); o.both = tx.indexOf('001-B1') >= 0 && tx.indexOf('001-B2') >= 0; o.btn = !!sh.querySelector('#alps_auto'); o.hint = (sh.querySelector('.alps') || {}).textContent || '';
    try { await needXLSX(); } catch (e) { o.xerr = 'needXLSX ' + (e && e.type); } const A = alpsBuild(S.ship, null); o.nameAll = A && A.fileName;
    const A2 = alpsBuild(S.ship, S.ship.orders); o.dbg = { n: A2.rows.length, lost: A2.lost, hdr: S.shipX.header.slice(0,4), v0: S.shipX.rows[0].v.slice(0,4), ord: S.ship.orders.map((x) => x.orderNo + ':' + x.items.map((i) => i.title).join('|')) }; window.ask = async () => true; window.confirm = () => true; return o; });
  const ymd = await p.evaluate(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, ''));
  ok(!o.xerr && !o.openErr && o.dbg.n === 3 && !o.dbg.lost.length, '줄 만들기: 3줄 · 빠진 상품 없음'); ok(o.btn, "오늘 출고 ② 탭에 '📦 ALPS 자동 처리' 단추"); ok(o.nameAll === `판매완료${ymd}.xlsx` && o.hint.includes(`판매완료${ymd}.xlsx`), `파일 이름 판매완료${ymd}.xlsx (한국 날짜)`);
  ok(o.both, '두 주문이 화면에 보임'); console.log('  · 화면 순서', o.disp.join(' → '));
  // 도우미가 꺼져 있으면 설치 안내
  H.up = false; await p.click('#alps_auto'); await p.waitForTimeout(3200); let t = await p.evaluate(() => (document.getElementById('alps_prog') || {}).innerText || '');
  ok(/ALPS 도우미를 찾지 못했습니다/.test(t) && /install-print\.ps1/.test(t), '도우미 없음 → 설치 한 줄 안내'); await p.click('#alps_x').catch(() => {});
  // 켜져 있으면 파일을 보내고 진행 → OTP → 끝 → 맞춤 표
  H.up = true; await p.evaluate(() => { window.__toasts = []; const T0 = window.toast; window.toast = (m) => { window.__toasts.push(String(m)); return T0 && T0(m); }; }); await p.click('#alps_auto'); await p.waitForTimeout(1500); console.log('  · ', await p.evaluate(() => JSON.stringify({ t: window.__toasts, prog: (document.getElementById('alps_prog') || {}).innerText })));
  ok(H.body && H.body.fileName === `판매완료${ymd}.xlsx` && H.body.firstOne === true, '도우미에 판매완료 파일·1장 먼저(기본 켬)를 보냄');
  const rowsSent = await p.evaluate((b64) => { const wb = XLSX.read(b64, { type: 'base64' }); const a = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }); return { head: a[0].length, sheet: wb.SheetNames[0], rows: a.slice(1).map((r) => r[1] + ' ' + r[3]), num: typeof a[1][8] }; }, H.body.b64);
  ok(rowsSent.head === 29 && rowsSent.sheet === 'Sheet1' && rowsSent.num === 'number', '보낸 xlsx: 29칸 · Sheet1 · 수량은 숫자(ALPS 형식)');
  const expRows = o.disp.flatMap((no) => (no === '001-B2' ? ['001-B2 분홍 책', '001-B2 분홍 책 둘'] : ['001-B1 [중고-최상] 파란 책']));
  ok(JSON.stringify(rowsSent.rows) === JSON.stringify(expRows) && o.disp[0] === '001-B2' /* 서가 순: PNK가 BLU보다 앞 · 알라딘 엑셀 순서(B1, B2 둘, B2)와 다름 */, `줄 순서 = 오늘 출고 화면 순서(주문 안은 상품 순서): ${rowsSent.rows.join(' / ')}`);
  ok(H.body.rows.length === 3 && H.body.rows.some((r) => r.name === '가수령' && r.title === '분홍 책'), '도우미에 줄마다 수령인·상품명을 함께 보냄');
  await p.waitForSelector('#alps_otp', { timeout: 8000 }).catch(() => {}); t = await p.evaluate(() => (document.getElementById('alps_prog') || {}).innerText || '');
  ok(/OTP/.test(t) && /번호를 넣어 주세요/.test(t), "OTP를 물으면 웹앱에 '번호를 넣어 주세요' 칸");
  await p.fill('#alps_otp', '654321'); await p.click('[data-alpsk="otp"]'); await p.waitForTimeout(4000);
  ok(H.inputs.length && H.inputs[0].kind === 'otp' && H.inputs[0].code === '654321', '넣은 번호를 도우미로 보냄');
  const m = await p.evaluate(() => ({ t: (document.querySelector('#sheet .sh .t') || {}).textContent, card: (document.querySelector('#sheet .card') || {}).textContent || '', st: [...document.querySelectorAll('#sheet .list .item')].map((x) => x.textContent.replace(/\s+/g, ' ')) }));
  ok(m.t === '운송장 ↔ 주문 맞춤' && /맞음 2/.test(m.card) && m.card.includes(`판매완료${ymd}.xlsx`), `끝나면 운송장 목록이 openInvMatch로: ${m.card.slice(0, 80)}`);
  ok(m.st.some((x) => /001-B2/.test(x) && /240000000012/.test(x)) && m.st.some((x) => /001-B1/.test(x) && /240000000011/.test(x)), '주문마다 운송장번호가 맞게 붙음');

  // ── 2단계: 휴대폰(127.0.0.1 없음) → shp_cmds에 맡김 → 문서 진행 표시 · OTP는 문서로 · 끝나면 shp_cmd_out에서 운송장 → 맞춤 표
  H.up = false; const ph = await p.evaluate(async () => { const o = {}; __FS.app_settings = __FS.app_settings || {}; __FS.app_settings.alps_helpers = { pcs: { 'MJ-MAIN': { pub: 'PUB', fp: 'abc123', at: new Date().toISOString() } } };
    __FS.shp_cmds = __FS.shp_cmds || {}; o.before = Object.keys(__FS.shp_cmds).length; S.alps.st = null; S.alps.err = null; await openShip(); await new Promise((r) => setTimeout(r, 500)); return o; });
  await p.click('#alps_auto'); await p.waitForTimeout(3600);
  const job = await p.evaluate(() => { const L = Object.entries(__FS.shp_cmds || {}).filter(([, v]) => v.type === 'alpsRun'); const [id, v] = L[L.length - 1] || []; return id ? { id, status: v.status, dev: v.dev, file: v.fileName, n: (v.rows || []).length, b64: (v.b64 || '').length, firstOne: v.firstOne } : null; });
  ok(job && job.status === 'alpsQueued' && job.dev === 'MJ-MAIN' && job.file === `판매완료${ymd}.xlsx` && job.n === 3 && job.b64 > 100, `도우미 없는 기기 → shp_cmds alpsRun(alpsQueued · MJ-MAIN · 파일·3줄)을 맡김: ${JSON.stringify(job)}`);
  t = await p.evaluate(() => (document.getElementById('alps_prog') || {}).innerText || ''); ok(/MJ-MAIN 도우미가 받기를 기다림/.test(t), '맡긴 뒤 진행판: PC 도우미가 받기를 기다림');
  await p.evaluate(async (id) => { await db.collection('shp_cmds').doc(id).set({ status: 'alpsRunning', claim: { pc: 'MJ-MAIN' }, run: { status: 'wait', fileName: 'x', steps: [{ k: 'login', l: '로그인', st: 'wait', pct: 50, d: 'OTP 기다림' }], need: { type: 'otp', msg: 'ALPS가 OTP·인증번호를 묻습니다. 번호를 넣어 주세요.' }, summary: {} } }, { merge: true }); }, job.id);
  await p.waitForSelector('#alps_otp', { timeout: 5000 }).catch(() => {}); t = await p.evaluate(() => (document.getElementById('alps_prog') || {}).innerText || ''); ok(/번호를 넣어 주세요/.test(t) && /로그인/.test(t), '문서의 진행·OTP 물음이 휴대폰 진행판에');
  await p.fill('#alps_otp', '777888'); await p.click('[data-alpsk="otp"]'); await p.waitForTimeout(500);
  const ans = await p.evaluate((id) => (__FS.shp_cmds[id] || {}).answer || null, job.id); ok(ans && ans.seq === 1 && ans.kind === 'otp' && ans.code === '777888', '넣은 번호가 그 일 문서의 answer로(seq 1)');
  await p.evaluate(async (id) => { __FS.shp_cmd_out = __FS.shp_cmd_out || {}; __FS.shp_cmd_out[id] = { op: 'alpsRun', aoa: JSON.stringify([['운송장번호', '수하인명', '상품명', '상품상세내용', '관리번호', '출력여부', '집하일자', '합포장키'], ['240000000021', '나수령', '파란 책', 'BLUAAA', 'M1', '출력', '', ''], ['240000000022', '가수령', '분홍 책', 'PNKLUX', 'M2', '출력', '', ''], ['240000000022', '가수령', '분홍 책 둘', 'PNKLUY', 'M3', '출력', '', '']]) };
    await db.collection('shp_cmds').doc(id).set({ status: 'done', outReady: true, run: { status: 'done', done: true, hasResult: true, fileName: 'x', steps: [], need: null, summary: { printed: 2, waybills: 3 } } }, { merge: true }); }, job.id);
  await p.waitForTimeout(1500); const m2 = await p.evaluate(() => ({ t: (document.querySelector('#sheet .sh .t') || {}).textContent, st: [...document.querySelectorAll('#sheet .list .item')].map((x) => x.textContent.replace(/\s+/g, ' ')) }));
  ok(m2.t === '운송장 ↔ 주문 맞춤' && m2.st.some((x) => /001-B2/.test(x) && /240000000022/.test(x)), '끝나면 shp_cmd_out의 운송장 목록으로 맞춤 표가 열림');
  // 이 PC 도우미 허락 칸(도우미 켜짐 · 관리자 기기 아님 → 요청으로 남김)
  H.up = true; const lk = await p.evaluate(async () => { S._alpsLinkC = null; await openShip(); await new Promise((r) => setTimeout(r, 1500)); return (document.getElementById('alps_link') || {}).innerText || ''; });
  ok(/이 PC 도우미 허락/.test(lk) || /허락됨/.test(lk), `허락 칸이 보임: ${lk.slice(0, 80)}`);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tAL 모두 통과');
});
