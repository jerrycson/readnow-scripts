/* tC2SOLO3 — (11/13 home2 · 정범님 '번외를 크롬·웹앱이랑 항상 같이 열어 줘야 하나?') 🔌 홀로 연결 저절로 등록
 *  ① 관리자 기기(HOME)의 웹앱이 번외 소식을 받고, 그 PC가 아직 등록되지 않았으면 → 단추 없이 공개 열쇠·지문만 app_settings/col2_solo.pcs.HOME에 · 클라우드 주소를 번외에 · auto:true
 *  ② 관리자 기기가 아니면 저절로 하지 않음(허락이 필요) · ③ 이미 다른 지문으로 등록돼 있으면 덮지 않음(사람이 보고 다시 등록) · ④ 로거는 안 함 · 브라우저 팝업 없음
 * 실행: cd pw && RN_PORT=<포트> node tC2SOLO3.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let pcName = 'HOME'; let fp = 'AB12-CD34-EF56-7890';
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:(8797|8898)/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); let b = null; try { b = JSON.parse(rt.request().postData() || 'null'); } catch (e) {} calls.push({ p: u.pathname, b });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) }); const kind = /^LOGGER/.test(pcName) ? 'logger' : 'office'; const solo = { on: true, reg: 'need', live: false, okAt: null, err: '', fp, host: '' };
    if (u.pathname === '/relay/pending') return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: pcName, pcSrc: 'pc', ver: '0.1.49', kind, handBeat: {}, handAt: 0, solo });
    if (u.pathname === '/solo/st') return J({ ok: true, pub: '-----BEGIN PUBLIC KEY-----\nTEST' + fp + '\n-----END PUBLIC KEY-----\n', fp, pc: pcName, kind, solo });
    if (u.pathname === '/col2/status') return J({ ok: true, want: true, running: true, on: true, ver: '0.1.49', dayN: 3, dayCap: 1600, msg: '' });
    return J({ ok: true }); });
  const setDev = (n, adm) => p.evaluate(async ({ n, adm }) => { await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.example.test' }, { merge: true }); localStorage.setItem('rn-device', n); localStorage.setItem('rn-c2seen', '1'); S.devOk = true; S.app = S.app || {}; S.app.cloudUrl = 'https://cloud.example.test'; S.app.adminDevices = adm ? [n] : []; S._c2soAutoAt = 0; }, { n, adm });
  const tick = async () => { await p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); c2SoloWatch(); await new Promise((r) => setTimeout(r, 300)); await c2RelayTick(); clearTimeout(S._c2rT); }); await p.waitForTimeout(1500); };
  const fsd = () => p.evaluate(() => (window.__FS.app_settings || {}).col2_solo || null);
  let dlg = 0; p.on('dialog', (d) => { dlg++; d.dismiss(); });
  /* ② 관리자 아닌 기기 */
  pcName = 'MJ-MAIN'; await setDev('MJ-MAIN', false); await tick(); let d = await fsd();
  ok(!d || !(d.pcs || {})['MJ-MAIN'], '② 관리자 기기가 아니면 저절로 등록하지 않음(허락이 필요)', d);
  /* ① 관리자 기기 HOME — 저절로 */
  pcName = 'HOME'; await setDev('HOME', false); await tick(); d = await fsd(); const rec = d && d.pcs && d.pcs.HOME; const lk = calls.find((c) => c.p === '/solo/link');
  ok(rec && rec.auto === true && rec.fp === fp && /BEGIN PUBLIC KEY/.test(rec.pub) && rec.kind === 'office' && !/PRIVATE/.test(JSON.stringify(d)), '① 관리자 기기(HOME) = 단추 없이 공개 열쇠·지문만 등록(auto)', rec);
  ok(lk && lk.b && lk.b.url === 'https://cloud.example.test', '① 클라우드 주소를 번외에 넣어 줌', lk);
  ok(calls.some((c) => c.p === '/solo/now'), '① 번외에 곧바로 이어 보라고 알림');
  /* ③ 이미 다른 지문으로 등록 → 덮지 않음 */
  fp = '9999-8888-7777-6666'; await p.evaluate(() => { S._c2soAutoAt = 0; }); await tick(); d = await fsd();
  ok(d.pcs.HOME.fp === 'AB12-CD34-EF56-7890', '③ 이미 등록된 PC는 지문이 달라도 저절로 덮지 않음', d.pcs.HOME);
  /* ④ 로거 */
  pcName = 'LOGGER'; await setDev('LOGGER', true); await tick(); d = await fsd(); ok(!(d.pcs || {}).LOGGER, '④ 로거는 저절로 등록하지 않음(약속 0)', d.pcs);
  ok(dlg === 0, '브라우저 팝업 없음');
  console.log(bad ? `✗ tC2SOLO3: ${bad}개 실패` : '✓ tC2SOLO3 모두 통과');
});
