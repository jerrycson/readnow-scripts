/* tCOL2SIDE — 정범님 11/09 밤 '번외 수집기를 로거·ALPS 도우미처럼 작게 PC마다 옆에 · 번외 수집기 어디 있는 거야?' + '예스24 — 화면을 열지 않는 방식'
 *  웹앱 🧭 관리도구 › 🪟 수집 작업 창 › 🧪 외부 수집기 줄:
 *   ① 「🪟 번외 수집기 옆 창 열기」 — 이 PC면 외부 수집기(127.0.0.1:8797)에 /win/app?p=status(작은 앱 창)를 부탁 · 다른 PC면 '그 PC에서'
 *   ② 🟦 예스24 판매관리 한 줄 — 외부 수집기 /relay/pending 의 y24(로그인 필요 · 읽는 중 · 마지막 주문 읽기 · 오늘 물음 수) · col2_ctl/<PC>.st.y24에도 남음(다른 PC에서 보임)
 *   ③ 🔍 기능 찾기에서 '번외 수집기 어디' · '옆 창' 낱말로 찾힘 · 브라우저 팝업 없음
 * 실행: cd pw && RN_PORT=<포트> node tCOL2SIDE.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 500) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let y24 = { on: true, logger: false, login: 'need', active: false, msg: '🔐 예스24 로그인 필요', ordAt: null, ordErr: null, prdAt: null, prdN: 0, day: { d: '2026-11-10', calls: 0, recs: 0 }, q: 0, sent: 0, jobsOk: false };
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8898/, async (rt) => { const u = new URL(rt.request().url()); const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) }); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
    if (u.pathname === '/status') return J({ ok: true, ver: '1.2.2' }); if (u.pathname === '/printers') return J({ ok: true, printers: [] });
    if (u.pathname === '/col2/status') return J({ ok: true, helper: '1.2.2', ver: '0.1.4', installed: true, running: true, on: true, want: true, dayN: 5, dayCap: 1600, msg: '작업 창 숨김 · 일할 준비', auto: { msg: '자동으로 도는 중', left: 10, poolN: 20, lap: { n: 1, read: 3 } } }); return J({ ok: false }); });
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); calls.push({ p: u.pathname + u.search, b: b ? JSON.parse(b) : null });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/win/app') return J({ ok: true, msg: '📊 상태 창을 작은 창으로 엶 (오른쪽 위)' });
    if (u.pathname === '/relay/pending') return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: 'HOME', pcSrc: 'web', ver: '0.1.5', y24 });
    return J({ ok: true }); });
  const r = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); localStorage.setItem('rn-device', 'HOME'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true; const T = []; const t0 = window.toast; window.toast = (m, ...a) => { T.push(String(m)); return t0(m, ...a); }; window.__T = T;
    S.lph.at = 0; await lphCheck(true); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); S.c2.at = 0; await c2Check(true);
    S.sec.mg_work = true; openMgr(); await sl(900); mgrRedraw(); await sl(600); const row = document.querySelector('[data-c2row="HOME"]');
    return { t: row ? row.innerText : '', side: !!(row && row.querySelector('[data-c2side="HOME"]')), other: !!document.querySelector('[data-c2side="JS-MAIN"]') }; });
  ok(r.side && /🪟 번외 수집기 옆 창 열기/.test(r.t), '이 PC 줄에 「🪟 번외 수집기 옆 창 열기」', r.t);
  ok(/🟦 예스24 판매관리: 🔐 예스24 로그인 필요/.test(r.t) && /옆 창에서 \[🔐 예스24 로그인\] 한 번/.test(r.t), "🟦 예스24 한 줄 — '로그인 필요 · 그 PC 옆 창에서 한 번'", r.t);
  await p.click('[data-c2side="HOME"]'); await p.waitForTimeout(600); const wa = calls.find((c) => c.p.startsWith('/win/app')); const t1 = await p.evaluate(() => window.__T.slice(-1)[0] || '');
  ok(wa && /p=status/.test(wa.p) && wa.b && wa.b.p === 'status' && /🪟/.test(t1), '단추 → 외부 수집기에 📊 옆 창(작은 앱 창)을 부탁 · 알림', { wa, t1 });
  y24 = { ...y24, login: 'ok', active: true, msg: '🔁 다음 주문 읽기 4분 뒤', ordAt: Date.parse('2026-11-10T01:05:00Z'), prdAt: Date.parse('2026-11-10T00:30:00Z'), prdN: 1234, day: { d: '2026-11-10', calls: 24, recs: 30 }, sent: 28, jobsOk: true };
  const r2 = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); S._c2StSig = ''; S._c2NoHlp = 0; await c2StTick(); mgrRedraw(); await sl(500); const row = document.querySelector('[data-c2row="HOME"]'); const g = (await db.collection('col2_ctl').doc('HOME').get()).data() || {}; return { t: row ? row.innerText : '', g: g.st && g.st.y24 }; });
  ok(/화면 없이 읽는 중/.test(r2.t) && /주문 두 목록 마지막/.test(r2.t) && /매물 1,234/.test(r2.t) && /오늘 물음 24번/.test(r2.t) && /올림 28/.test(r2.t), '읽는 중 줄: 화면 없이 읽는 중 · 마지막 주문 읽기 · 등록상품 매물 · 오늘 물음 · 올림', r2.t);
  ok(r2.g && r2.g.login === 'ok' && r2.g.active && r2.g.calls === 24 && !('body' in r2.g), 'col2_ctl/HOME.st.y24 에 남음(다른 PC 관리도구에서도 보임 · 손님 정보 없음)', r2.g);
  const n0 = calls.length; const t3 = await p.evaluate(async () => { const b = document.querySelector('[data-c2side="JS-MAIN"]'); if (!b) return 'none'; b.click(); await new Promise((x) => setTimeout(x, 300)); return window.__T.slice(-1)[0]; });
  ok(t3 === 'none' || (/그 PC\(JS-MAIN\)의 웹앱에서 누르세요/.test(t3) && !calls.slice(n0).some((c) => c.p.startsWith('/win/app'))), "다른 PC 줄에서는 '그 PC에서'(이 PC 외부 수집기를 부르지 않음)", t3);
  const f = await p.evaluate(() => { const L = typeof FEAT !== 'undefined' ? FEAT : []; const hit = (q) => L.some((x) => /옆 창/.test(x.t) && (x.k || '').includes(q)); return { a: hit('번외 수집기 어디'), b: hit('예스24 판매관리') }; }).catch(() => ({}));
  ok(f.a === true && f.b === true, "🔍 기능 찾기 '번외 수집기 어디'·'예스24 판매관리'", f);
  ok(!/alert\(|confirm\(|prompt\(/.test(await p.evaluate(() => [c2RowHtml, c2yHtml].map(String).join('\n'))), '브라우저 팝업 없음');
  console.log(bad ? `❌ tCOL2SIDE ${bad}개 실패` : '✓ tCOL2SIDE 모두 통과'); process.exit(bad ? 1 : 0); });
