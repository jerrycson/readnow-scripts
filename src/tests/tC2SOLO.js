/* tC2SOLO — (11/12 col2solo1 · 정범님 11/12 0시 '번외 수집기는 웹앱이 열려 있어야 하나? 웹앱 열림이나 (운영) 수집기 없이 돌게') 🔌 번외 홀로 연결 — 웹앱 쪽
 *  ① ⚙ 설정 › 🔀 번외 칸 '🔌 홀로 연결: 등록 필요' + 「🔐 이 기기 등록」 — 두 번 눌러야(브라우저 팝업 없음) · 관리자 기기 = 공개 열쇠를 app_settings/col2_solo.pcs에 · 클라우드 주소를 번외에 넣어 줌
 *  ② 관리자 기기 아님 = 요청(reqs)으로만 → 관리자 기기에서 같은 지문을 보고 [✓ 허락](두 번) → pcs · [⛔ 끊기](두 번) → off:true(지우지 않음)
 *  ③ 켜짐 표시 · 홀로 연결이 살아 있으면 웹앱은 col2_ctl 상태를 쓰지 않음(번외가 직접) · 끊기면 예전처럼 씀
 *  ④ 로거 웹앱 네이버 대신 쓰기 — 번외 홀로 연결이 네이버를 맡으면 비킴(받는 열쇠·상태를 쓰지 않음)
 * 실행: cd pw && RN_PORT=<포트> node tC2SOLO.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let solo = { on: true, reg: 'link', live: false, okAt: null, err: '', fp: 'AB12-CD34-EF56-7890', host: '' }; let nvSolo = false; let pcName = 'JS-MAIN';
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:(8797|8898)/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: pcName, pcSrc: 'pc', ver: '0.1.25', kind: /^LOGGER/.test(pcName) ? 'logger' : 'office', handBeat: {}, handAt: 0, solo });
    if (u.pathname === '/solo/st') return J({ ok: true, pub: '-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----\n', fp: solo.fp, pc: pcName, kind: /^LOGGER/.test(pcName) ? 'logger' : 'office', solo });
    if (u.pathname === '/col2/status') return J({ ok: true, want: true, running: true, on: true, ver: '0.1.25', dayN: 3, dayCap: 1600, msg: '' });
    if (u.pathname === '/nv/st') return J({ ok: true, ver: '0.1.25', pc: pcName, nv: { on: true, net: { ok: true }, pub: 'PUBKEY1', cred: { has: false } }, solo: { live: nvSolo, reg: nvSolo ? 'ok' : 'link' } });
    if (u.pathname === '/nv/feed') return J({ ok: true, out: [] });
    return J({ ok: true }); });
  const setDev = (n, adm) => p.evaluate(async ({ n, adm }) => { await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.example.test' }, { merge: true }); localStorage.setItem('rn-device', n); localStorage.setItem('rn-c2seen', '1'); S.devOk = true; S.app = S.app || {}; S.app.cloudUrl = 'https://cloud.example.test'; S.app.adminDevices = adm ? [n] : []; }, { n, adm });
  const tick = () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  const draw = () => p.evaluate(() => { let d = document.getElementById('tsolo'); if (!d) { d = document.createElement('div'); d.id = 'tsolo'; d.style.cssText = 'position:fixed;top:60px;left:10px;z-index:99999;background:#fff;width:600px'; document.body.appendChild(d); } d.innerHTML = c2SoloHtml(); return d.innerText; });
  const twice = async (sel) => { await p.click(sel); await p.waitForTimeout(600); await p.click(sel); await p.waitForTimeout(800); };
  let dlg = 0; p.on('dialog', (d) => { dlg++; d.dismiss(); });
  /* ① 관리자 기기 등록 */
  await setDev('JS-MAIN', true); await tick(); let txt = await draw();
  ok(/홀로 연결: 등록 필요/.test(txt) && /이 기기 등록/.test(txt) && /AB12-CD34-EF56-7890/.test(txt), "① ⚙ 🔀 칸에 '🔌 홀로 연결: 등록 필요' · 이 PC 지문 · 등록 단추", txt.slice(0, 300));
  await p.click('#tsolo [data-c2soreg]'); await p.waitForTimeout(900); let fsd = await p.evaluate(() => (window.__FS.app_settings || {}).col2_solo || null);
  ok(!fsd, '① 한 번 누름으로는 등록 안 함(두 번 눌러야)');
  await p.click('#tsolo [data-c2soreg]'); await p.waitForTimeout(1200); fsd = await p.evaluate(() => (window.__FS.app_settings || {}).col2_solo || null);
  const rec = fsd && fsd.pcs && fsd.pcs['JS-MAIN']; const lk = calls.find((c) => c.p === '/solo/link');
  ok(rec && /BEGIN PUBLIC KEY/.test(rec.pub) && rec.fp === 'AB12-CD34-EF56-7890' && rec.kind === 'office' && !/PRIVATE/.test(JSON.stringify(fsd)), '① 두 번 누르면 공개 열쇠·지문만 app_settings/col2_solo.pcs에', rec);
  ok(lk && lk.b && lk.b.url === 'https://cloud.example.test', '① 클라우드 주소를 번외에 넣어 줌(/solo/link)', lk);
  /* ③ 켜짐 · 상태 쓰기 비킴 */
  solo = { ...solo, reg: 'ok', live: true, okAt: Date.now() }; await tick(); txt = await draw();
  ok(/홀로 연결: 켜짐/.test(txt) && /등록한 기기 1대/.test(txt), '③ 켜짐 표시 · 등록한 기기 표', txt.slice(0, 300));
  await p.evaluate(async () => { delete (window.__FS.col2_ctl || {})['JS-MAIN']; S._c2NoHlp = 0; S._c2StSig = null; await c2StTick(); });
  ok(!(await p.evaluate(() => (window.__FS.col2_ctl || {})['JS-MAIN'])), '③ 홀로 연결이 살아 있으면 웹앱은 col2_ctl 상태를 쓰지 않음(번외가 직접)');
  solo = { ...solo, reg: 'down', live: false }; await tick(); await p.evaluate(async () => { S._c2NoHlp = 0; S._c2StSig = null; await c2StTick(); });
  ok(await p.evaluate(() => !!(window.__FS.col2_ctl || {})['JS-MAIN']), '③ 홀로 연결이 끊기면 웹앱이 예전처럼 상태를 씀');
  /* ② 관리자 아닌 기기 → 요청 → 허락 → 끊기 */
  pcName = 'HOME2'; solo = { on: true, reg: 'link', live: false, fp: '1111-2222-3333-4444' }; await setDev('HOME2', false); await tick(); await draw();
  await twice('#tsolo [data-c2soreg]'); fsd = await p.evaluate(() => window.__FS.app_settings.col2_solo);
  ok(fsd.reqs && fsd.reqs.HOME2 && fsd.reqs.HOME2.fp === '1111-2222-3333-4444' && !(fsd.pcs || {}).HOME2, '② 관리자 기기가 아니면 요청(reqs)으로만', fsd);
  pcName = 'JS-MAIN'; await setDev('JS-MAIN', true); txt = await draw(); ok(/HOME2 등록 요청/.test(txt) && /1111-2222-3333-4444/.test(txt), '② 관리자 기기에 요청·지문이 보임', txt.slice(0, 400));
  await twice('#tsolo [data-c2sook="HOME2"]'); fsd = await p.evaluate(() => window.__FS.app_settings.col2_solo);
  ok(fsd.pcs.HOME2 && fsd.pcs.HOME2.pub === fsd.reqs.HOME2.pub && fsd.pcs.HOME2.fp === '1111-2222-3333-4444', '② [✓ 허락] 두 번 → pcs', fsd.pcs.HOME2);
  await draw(); await p.evaluate(() => document.querySelectorAll('#tsolo details').forEach((d) => (d.open = true))); await twice('#tsolo [data-c2sooff="HOME2"]'); fsd = await p.evaluate(() => window.__FS.app_settings.col2_solo);
  ok(fsd.pcs.HOME2.off === true && fsd.pcs.HOME2.pub, '② [⛔ 끊기] 두 번 → off(열쇠는 지우지 않음)', fsd.pcs.HOME2);
  /* ④ 로거 네이버 대신 쓰기 비킴 */
  pcName = 'LOGGER'; await setDev('LOGGER', false); nvSolo = true;
  await p.evaluate(async () => { delete window.__FS.col2_naver; S._nvNo = 0; clearTimeout(S._nvT); await nvRelayTick(); clearTimeout(S._nvT); });
  ok(!(await p.evaluate(() => window.__FS.col2_naver && (window.__FS.col2_naver.pub || window.__FS.col2_naver.state))), '④ 번외 홀로 연결이 네이버를 맡으면 로거 웹앱은 비킴(쓰지 않음)');
  nvSolo = false; await p.evaluate(async () => { S._nvNo = 0; clearTimeout(S._nvT); await nvRelayTick(); clearTimeout(S._nvT); });
  ok(await p.evaluate(() => !!(window.__FS.col2_naver && window.__FS.col2_naver.pub)), '④ 홀로 연결이 아니면 예전처럼 로거 웹앱이 대신 씀');
  ok(dlg === 0, '브라우저 팝업 없음');
  console.log(bad ? `✗ tC2SOLO: ${bad}개 실패` : '✓ tC2SOLO 모두 통과');
});
