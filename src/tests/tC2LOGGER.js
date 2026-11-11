/* tC2LOGGER — 정범님 11/11 '로거는 관리도구에 아예 이 부분(🪟 수집 작업 창 › 🧪 외부 수집기(시험) 줄 › ⬇ 이 PC에 외부 수집기 깔고 켜기)이 없어' · 약속 38(로거도 번외로 견줌) · 약속 0(로거는 북스킹·리드나우와 안 엮임)
 *  ① 로거 웹앱(관리자 기기 아님)에서 🧭 관리도구 › 🪟 수집 작업 창에 '🧾 LOGGER' 칸 + 🧪 줄(로거 묶음)이 보이고 「⬇ 이 PC에 외부 수집기 깔고 켜기」를 누를 수 있음 · 작업 창(알라딘 로그인 일) 단추는 없음
 *  ② 도우미 없음 → 로거용 설치 파일(readnow-helper-col2-logger-setup.cmd · 이 창 안에서만 COMPUTERNAME=LOGGER · -With col2)
 *  ③ 켜진 뒤에도 🟦 예스24 판매관리·🟧 알라딘 샵매니저 줄은 그리지 않음
 *  ④ 대신 기록(넘겨주기): 로거 외부 수집기에는 우리 상품·매물·주문·문의 칸·표본·운영 키를 넘기지 않음(판매자 숍 번호 목록 같은 로거 고유 일 칸은 넘김)
 *  ⑤ 로거 이름이 LOGGER…가 아니면(공개 전용 PC 이름이 다르면) 단추를 막음(사무실 묶음으로 깔리지 않게) · 사무실 PC에서 로거 줄을 누르면 '그 PC에서'
 * 실행: cd pw && RN_PORT=<포트> node tC2LOGGER.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 500) : ''); } else console.log('  ✓', m); };
const fs = require('fs');

(async () => { await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  let up = false; const calls = []; let c2 = { installed: false, running: false, on: false, want: false };
  await p.route(/127\.0\.0\.1:8898/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); calls.push(u.pathname + (b ? ' ' + b : '')); if (!up) return rt.abort();
    const J = (x, st) => rt.fulfill({ status: st || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(x) });
    if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (u.pathname === '/status') return J({ ok: true, ver: '1.2.3' }); if (u.pathname === '/printers') return J({ ok: true, printers: [] });
    const S2 = () => ({ ok: true, helper: '1.2.3', ver: c2.installed ? '0.1.19' : null, ...c2, dayN: c2.running ? 3 : null, dayCap: 1600, msg: c2.running ? '로거 묶음 · 일할 준비' : '', y24: c2.running ? { on: false, logger: true } : null, al: c2.running ? { on: false, logger: true, day: {} } : null });
    if (u.pathname === '/col2/status') return J(S2()); if (u.pathname === '/col2/ensure') { c2 = { installed: true, running: true, on: true, want: true }; return J(S2()); } if (u.pathname === '/col2/stop') { c2 = { ...c2, running: false, on: false, want: false }; return J(S2()); }
    return J({ ok: false }, 404); });
  const c2calls = []; await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); c2calls.push({ p: u.pathname, b: b ? JSON.parse(b) : null });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(x) });
    if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
    if (u.pathname === '/relay/pending') return J({ ok: true, kind: 'logger', pc: 'LOGGER', pcSrc: 'web', want: [{ c: 'prd_books', id: 'lg1' }, { c: 'prd_ids', id: 'x1' }, { c: 'prd_listings', id: 'aladin_1' }, { c: 'shp_state', id: 'current' }, { c: 'crm_interactions', id: 'aladin_qna_1' }, { c: 'prd_market_nobook', id: 'n1' }, { c: 'sellers', id: 'sc_123' }, { c: 'app_settings', id: 'bench' }], sample: 3, pool: 5, poolAfter: null, poolLap: 1, keys: ['kakaoRest'], lists: [{ c: 'sellers', n: 5 }, { c: 'prd_market_nobook', n: 5 }], fields: ['title', 'aladinItemId'], out: [], hot: false });
    return J({ ok: true }); });
  const setup = (dev, extra) => p.evaluate(async ([dev, extra]) => { localStorage.setItem('rn-device', dev); S.devOk = true; S.colSet = { ...(S.colSet || {}), ...(extra || {}) };
    const beats = { pcs: { LOGGER: { pubOnly: true, role: 'pub', atMs: Date.now() }, HOME: { role: 'gen', atMs: Date.now() }, ...((extra && extra.pubPcName) ? { [extra.pubPcName]: { pubOnly: true, role: 'pub', atMs: Date.now() } } : {}) } };
    try { await db.collection('prd_jobs').doc('pcBeat').set(beats); } catch (e) {} window.__rnBeats = beats;
    if (!window.__T) { const T = []; const t0 = window.toast; window.toast = (m, ...a) => { T.push(String(m)); return t0(m, ...a); }; window.__T = T; } }, [dev, extra || null]);
  const view = () => p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S.lph.at = 0; try { await lphCheck(true); } catch (e) {} S.c2.at = 0; try { await c2Check(true); } catch (e) {} S.sec.mg_work = true; if (!(S.detail && S.detail.mgr)) openMgr(); await sl(700); window.__rnBeats = window.__rnBeats; mgrRedraw(); await sl(500);
    const sec = document.querySelector('[data-sec="mg_work"]'); const lg = sec && sec.querySelector('[data-c2lg]'); const row = lg && lg.querySelector('[data-c2row]'); const btn = row && row.querySelector('[data-c2on]');
    return { lg: lg ? lg.dataset.c2lg : null, t: row ? row.innerText : '', lgT: lg ? lg.innerText : '', btn: !!btn, dis: btn ? btn.disabled : null, ww: !!(sec && sec.querySelector('[data-wwon="LOGGER"],[data-wwcmd^="LOGGER|"],[data-wwsave="LOGGER"]')), adm: isAdminDevice(), y24: !!(row && /예스24 판매관리:/.test(row.innerText)), al: !!(row && /샵매니저 읽기\(그림자\):/.test(row.innerText)), homeRow: !!(sec && sec.querySelector('[data-c2row="HOME"]')) }; });

  console.log('① 로거 웹앱 — 🧾 LOGGER 칸 · 🧪 줄(로거 묶음)');
  await setup('LOGGER'); const v1 = await view();
  ok(v1.lg === 'LOGGER' && v1.btn && v1.dis === false && !v1.adm, '로거(관리자 기기 아님)에서도 🪟 수집 작업 창에 🧾 LOGGER 칸 · 「⬇ 이 PC에 외부 수집기 깔고 켜기」를 누를 수 있음', v1);
  ok(/로거 묶음/.test(v1.t) && /계정·쿠키·우리 숍·로그인 일 없음/.test(v1.t) && /구매평/.test(v1.t) && /사무실과 겹치는 일 안 함/.test(v1.t), "줄에 '🧾 로거 묶음 — 계정·쿠키·우리 숍·로그인 일 없음 · 로거 고유 일 + 🗣 구매평만 · 사무실과 겹치는 일 안 함'", v1.t);
  ok(!v1.ww && /작업 창 없음/.test(v1.lgT), '로거 칸에는 🪟 작업 창(알라딘 로그인 일) 켜기·명령·자리 단추가 없음', v1.lgT.slice(0, 200));

  console.log('② 도우미 없음 → 로거용 설치 파일');
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('[data-c2on="LOGGER"]'); const d = await dl; const txt = d ? fs.readFileSync(await d.path(), 'utf8') : '';
  ok(d && d.suggestedFilename() === 'readnow-helper-col2-logger-setup.cmd', '설치 파일 이름 = readnow-helper-col2-logger-setup.cmd', d && d.suggestedFilename());
  const L = txt.split(/\r\n/); const iSet = L.findIndex((l) => l === 'set "COMPUTERNAME=LOGGER"'), iPs = L.findIndex((l) => /^powershell /.test(l));
  ok(iSet > 0 && iPs > iSet && /-With col2"$/.test(L[iPs]) && /로거 묶음/.test(txt) && !/ALPS/.test(txt), '설치 파일: powershell 앞에서 이 창 안 COMPUTERNAME=LOGGER(외부 수집기가 처음부터 로거 묶음) · -With col2 · ALPS 글 없음', L);

  console.log('③ 켜진 뒤 — 🟦 예스24·🟧 샵매니저 줄 없음');
  up = true; await p.waitForTimeout(6500); const v3 = await view();
  ok(calls.some((c) => c.startsWith('/col2/ensure') && /"pc":"LOGGER"/.test(c)), '설치가 끝나 도우미가 켜지면 저절로 /col2/ensure(pc LOGGER)', calls.slice(-5));
  ok(/켜짐/.test(v3.t) && !v3.y24 && !v3.al, '켜진 줄에 🟦 예스24 판매관리·🟧 알라딘 샵매니저 줄을 그리지 않음', v3.t);
  const g = await p.evaluate(async () => (await db.collection('col2_ctl').doc('LOGGER').get()).data() || null); ok(g && g.on === true && /LOGGER/.test(g.by || ''), 'col2_ctl/LOGGER = { on: true · 누가 }', g);

  console.log('④ 넘겨주기 — 로거엔 우리 상품·주문·문의·표본·키를 넘기지 않음');
  await p.evaluate(async () => { await db.collection('prd_books').doc('lg1').set({ title: '시험 책', aladinItemId: '100001' }); await db.collection('sellers').doc('sc_123').set({ sc: '123', name: '시험 숍', totalReviewCount: 50 }); await db.collection('app_settings').doc('bench').set({ targets: [{ sc: '123', on: true }] }); try { await db.collection('app_secrets').doc('ext').set({ keys: { kakaoRest: 'TESTKEY0' } }); } catch (e) {}
    S._c2rTried = 0; S._c2kAt = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  const ans = (c2calls.filter((c) => c.p === '/relay/answer').slice(-1)[0] || {}).b || {}; const cs = (ans.docs || []).map((x) => x.c);
  ok(!cs.some((c) => ['prd_books', 'prd_ids', 'prd_listings', 'shp_state', 'crm_interactions', 'prd_market_nobook'].includes(c)), '부탁 받아도 우리 상품·매물·주문·문의 칸은 넘기지 않음', cs);
  ok(cs.includes('sellers') && cs.includes('app_settings'), '로거 고유 일 칸(판매자 숍 · 🎯 벤치마킹 숍 번호)은 넘김', cs);
  ok(!ans.pool && !ans.sample && !(ans.lists && ans.lists.prd_market_nobook), '표본(우리 도서 목록)·새상품 없는 시세 목록은 넘기지 않음', { pool: ans.pool, sample: ans.sample, lists: ans.lists && Object.keys(ans.lists) });
  ok(!c2calls.some((c) => c.p === '/relay/keys') && !JSON.stringify(c2calls).includes('TESTKEY0'), '운영 키(우리 계정 키)는 로거 외부 수집기에 보내지 않음');

  console.log('⑤ 이름이 LOGGER…가 아닌 공개 전용 PC · 사무실 PC에서 로거 줄');
  await setup('PUBX', { pubPcName: 'PUBX' }); up = false; const v5 = await view();
  const t5 = await p.evaluate(async () => { const b = document.querySelector('[data-c2on="PUBX"]'); return { has: !!b, dis: b ? b.disabled : null, t: (document.querySelector('[data-c2row="PUBX"]') || {}).innerText || '' }; });
  ok(t5.has && t5.dis === true && /LOGGER로 시작하지 않아 깔지 않습니다/.test(t5.t), "공개 전용 PC 이름이 LOGGER…가 아니면 단추를 막고 '⛔ 깔지 않습니다'(사무실 묶음으로 깔리지 않게)", t5);
  await setup('HOME', { pubPcName: '' }); await p.evaluate(() => { S.app.adminDevices = ['HOME']; }); const v6 = await view(); const n0 = calls.length;
  const t6 = await p.evaluate(async () => { const b = document.querySelector('[data-c2on="LOGGER"],[data-c2off="LOGGER"]'); if (b) { b.disabled = false; b.click(); } /* 로거 줄이 켜짐이면 끄기 단추 — 어느 것이든 사무실 PC에선 '그 PC에서' */ await new Promise((x) => setTimeout(x, 300)); return window.__T.slice(-1)[0] || ''; });
  ok(v6.lg === 'LOGGER' && v6.homeRow && /그 PC\(LOGGER\)의 웹앱에서 누르세요/.test(t6) && !calls.slice(n0).some((c) => c.startsWith('/col2/ensure')), "사무실 PC 화면에도 로거 칸이 보이고, 누르면 '그 PC(LOGGER)의 웹앱에서' · 이 PC 도우미는 부르지 않음", { v6, t6 });
  ok(!/alert\(|confirm\(|prompt\(/.test(await p.evaluate(() => [c2RowHtml, c2IsLoggerList, hlpInstDownload, c2RelayTick, wwHtml].map(String).join('\n'))), '브라우저 팝업 없음');
}); console.log(bad ? `❌ ${bad}개 실패` : '✓ tC2LOGGER 모두 통과'); process.exit(bad ? 1 : 0); })();
