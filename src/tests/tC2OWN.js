// tC2OWN — 정범님 11/10 아침 'HOME 한 대에서 그 PC 자리를 번외가 이어받는 길 · HOME을 번외 수집기용으로 · 샵매니저를 닫으면 되지?'
//  수집기(머리 그대로 · 모듈 본문만) 🏠 이어받기 시험:
//   ① 번외 ⚙ '이 PC 알라딘 자리를 번외가 이어받음'(도우미 /al/feed 답 al.own) → 다리가 rn-c2own 적음 → 운영 자리 놓음(dev[HOME] in 거짓 · how '번외가 이어받음') → 그다음 번외 자리(HOME~col2 · 우선순위 1) 받음 — 이 차례
//   ② 이어받는 동안 운영은: 🔒 상시 PC여도 로그인 일 안 함(ready 거짓) · 다시 로그인 안 함 · 자리 신호(markIn·seen·hold) 안 씀 · 다른 기기가 기다려도 번외가 그림자처럼 양보하지 않음
//   ③ 끄면 곧바로 운영이 되찾음 · 번외가 30분 넘게 안 보이면 저절로 풀림 · 로거 크롬은 안 함
//   ④ 샵매니저 작업 창 모드는 이어받는 동안 꺼짐(다시 열지 않음) · 죽은 탭 되살리기에 '일시정지'로 알려 새 탭을 열지 않음 · 머리 서명 그대로
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2OWN — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const BR = cut('(function rnC2al()', '\n})();'); const GOV = cut('(function rnLoginGovInit()', '\n})();');
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };

/* 가짜 Firebase — 계정 문서 하나(트랜잭션 · merge는 Firestore처럼 깊이 합침) · 쓰기는 window.__W */
const FB = (a) => { const W = (window.__W = []); const docs = (window.__D = a.docs || {});
  const deep = (o, v) => { const r = { ...(o || {}) }; for (const [k, x] of Object.entries(v || {})) r[k] = x && typeof x === 'object' && !Array.isArray(x) && r[k] && typeof r[k] === 'object' ? deep(r[k], x) : x; return r; };
  const ref = (c, id) => ({ id, c, get: async () => { const v = docs[c + '/' + id]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, set: async (v, o) => { W.push({ c, id, v: JSON.parse(JSON.stringify(v)) }); docs[c + '/' + id] = o && o.merge ? deep(docs[c + '/' + id], v) : v; } });
  const fsx = { collection: (c) => ({ doc: (id) => ref(c, id) }), runTransaction: async (f) => f({ get: async (r) => r.get(), set: (r, v, o) => { r.set(v, o); } }) };
  const firestore = () => fsx; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' } }), firestore }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (seed, helper, docs, pc) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url()); const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b, h: rq.headers() }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); };
      window.__LOGS = []; window.__rnLog = (s, lv, m) => window.__LOGS.push(lv + ' ' + m); window.__rnPcName = { get: () => a.pc }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false });
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      (new Function('a', a.fb))(a); }, { seed, fb: `(${FB.toString()})(a)`, docs: docs || {}, pc: pc || 'OFFICE1' });
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: GOV }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };


  const tick = async (p, force) => { await p.evaluate((f) => window.__rnC2alTick && window.__rnC2alTick(f), !!force); await p.waitForTimeout(350); };
  const doc = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.__D['app_settings/aladin_login'] || {})));
  const AL = { on: true, logger: false, login: 'ok', active: false, seat: false, pp: null };
  const helperOf = (S) => (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL, ...S } } : pth === '/busy' ? { ok: true } : null);
  const now0 = Date.now(); const docs0 = () => ({ 'app_settings/aladin_login': { dev: { HOME: { in: true, at: now0, pri: 1, how: '상시' }, 'MJ-MAIN': { in: true, at: now0, pri: 1 } } } });

  { const S = { own: true }; const { p, HL } = await mk({ 'rnu-login-st': { in: true, at: now0 } }, helperOf(S), docs0(), 'HOME');
    ok(await p.evaluate(() => window.__rnLoginGov.always() === true && window.__rnLoginGov.ready() === true), '처음: HOME은 🔒 상시 PC · 로그인 일 받음');
    await tick(p); let d = await doc(p); const W = await p.evaluate(() => window.__W.map((w) => Object.keys((w.v && w.v.dev) || {}).join(',') + ':' + JSON.stringify(((w.v && w.v.dev) || {})[Object.keys((w.v && w.v.dev) || {})[0]] || {}).slice(0, 60)));
    ok(d.dev.HOME.in === false && d.dev.HOME.how === '번외가 이어받음', `① 운영 자리를 놓음(dev.HOME in 거짓 · how): ${JSON.stringify(d.dev.HOME)}`);
    ok(d.dev['HOME~col2'] && d.dev['HOME~col2'].in === true && d.dev['HOME~col2'].pri === 1, `① 그다음 번외 자리(HOME~col2)를 보통 PC 차례(우선순위 1)로 받음: ${JSON.stringify(d.dev['HOME~col2'])}`);
    const iH = W.findIndex((x) => /^HOME:/.test(x) && /"in":false/.test(x)), iC = W.findIndex((x) => /^HOME~col2:/.test(x) && /"in":true/.test(x)); ok(iH >= 0 && iC > iH, `① 차례: 운영 자리 놓음(${iH}번째 쓰기) → 번외 자리 받음(${iC}번째)`, W);
    const g = await p.evaluate(() => window.__GM['rn-c2own']); ok(g && g.on === true && g.pc === 'HOME', 'rn-c2own(이 PC 저장소)에 이어받기 표시');
    const r2 = await p.evaluate(async () => { const G = window.__rnLoginGov; let e = null; try { await G.relogin({ isLoggedIn: async () => false, doLogin: async () => { window.__LOGIN = 1; return true; }, how: 'cred' }); } catch (x) { e = x.message; } const h = await G.hold('시험'); G.markIn('시험'); G.seen(); return { ready: G.ready(), always: G.always(), own: G.own(), e, h, login: !!window.__LOGIN }; });
    ok(r2.own && !r2.always && !r2.ready, `② 🔒 상시 PC여도 이어받는 동안은 로그인 일 안 받음(ready 거짓): ${JSON.stringify(r2)}`);
    ok(/번외 수집기가 이어받음/.test(r2.e || '') && !r2.login && r2.h === false, `② 다시 로그인 안 함(로그인 함수를 부르지 않음) · 자리 지키기 거짓: ${r2.e}`);
    d = await doc(p); ok(d.dev.HOME.in === false, `② markIn·seen·hold를 불러도 dev.HOME을 다시 참으로 쓰지 않음: ${JSON.stringify(d.dev.HOME)}`);
    const sus = await p.evaluate(() => window.__rnLoginGov.suspect('https://www.aladin.co.kr/scm/worders.aspx', 'https://www.aladin.co.kr/scm/worders.aspx', document)); ok(sus === 'suspect', `② 샵매니저를 읽으려던 일은 '로그인 쉼'으로 그 일만 건너뜀: ${sus}`);
    await p.evaluate(() => { const d = window.__D['app_settings/aladin_login']; d.wait = { PC2: { at: Date.now(), since: Date.now(), pri: 1 } }; }); await tick(p, true); d = await doc(p);
    ok(d.dev['HOME~col2'].in === true && !d.dev['HOME~col2'].yield, `② 다른 기기가 기다려도 그림자처럼 넘기지 않음(이 PC 자리 그 자체): ${JSON.stringify(d.dev['HOME~col2'])}`);
    await p.evaluate(() => { delete window.__D['app_settings/aladin_login'].wait.PC2; });
    const nW = await p.evaluate(() => window.__W.length); await tick(p); await tick(p); ok((await p.evaluate(() => window.__W.length)) === nW, '이어받는 동안 10초마다 계정 문서를 다시 쓰지 않음');
    // ③ 끔 → 곧바로 되찾음
    S.own = false; await tick(p, true); await p.waitForTimeout(400); d = await doc(p); const r3 = await p.evaluate(() => ({ ready: window.__rnLoginGov.ready(), own: window.__rnLoginGov.own(), g: window.__GM['rn-c2own'] }));
    ok(!r3.own && r3.ready && d.dev.HOME.in === true && r3.g.on === false, `③ 번외 ⚙에서 끄면 운영이 곧바로 자리를 되찾음: ${JSON.stringify({ r3, home: d.dev.HOME })}`);
    ok((await p.evaluate(() => window.__LOGS.join('\n'))).includes('이어받기 끝'), '③ 기록에 남김');
    await p.close(); }
  // ③ 30분 넘은 표시는 저절로 풀림
  { const { p } = await mk({ 'rn-c2own': { on: true, at: Date.now() - 31 * 60e3, pc: 'HOME' } }, helperOf({ on: false }), docs0(), 'HOME');
    const r = await p.evaluate(() => ({ own: window.__rnLoginGov.own(), always: window.__rnLoginGov.always() })); ok(!r.own && r.always, `③ 번외가 30분 넘게 안 보이면 이어받기 표시는 저절로 풀림(예전처럼 상시): ${JSON.stringify(r)}`);
    const r2 = await p.evaluate(() => { window.__GM['rn-c2own'] = { on: true, at: Date.now(), pc: 'JS-MAIN' }; return window.__rnLoginGov.own(); }); ok(!r2, '다른 PC 이름으로 적힌 표시는 이 PC에 안 먹음'); await p.close(); }
  // 로거 크롬
  { const { p, HL } = await mk({ 'rn-pubChrome': true }, helperOf({ own: true }), docs0(), 'HOME'); await tick(p, true); const r = await p.evaluate(() => ({ g: window.__GM['rn-c2own'] || null })); ok(!r.g && HL.length === 0, '로거 크롬은 이어받기를 받지 않음(약속 0)'); await p.close(); }
  // ④ 작업 창 모드 · 되살리기 · 팝업 · 머리
  ok(/return \{ okPc, on: okPc && m\.on === true && !own, own,/.test(src) && /GM_getValue\('rn-c2own', null\); return !!\(o && o\.on && Date\.now\(\) - \(\+o\.at \|\| 0\) < 30 \* 60e3\); \} catch \(e\) \{ return false; \} \}\)\(\); \/\* \(11\/10\) 🏠 번외가 이 PC/.test(src), '④ 이어받는 동안 샵매니저 작업 창 모드 꺼짐(도우미가 작업 창을 다시 열지 않음)');
  ok(/paused: !!window\.__rnPaused \|\| \(\(\) => \{ try \{ const o = GM_getValue\('rn-c2own', null\)/.test(src), "④ 죽은 탭 되살리기 — 이어받는 동안 '일시정지'로 알려 새 샵매니저 탭을 열지 않음");
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(BR), '다리에 브라우저 팝업 없음');
  { const split = path.join(__dirname, '../split.js'); const out = fs.mkdtempSync(path.join(os.tmpdir(), 'c2own-')); cp.execFileSync('node', [split, SRCF, out], { stdio: 'pipe' });
    const h = (fs.readFileSync(path.join(out, 'readnow-collector.user.js'), 'utf8').match(/const HSIG = '([0-9a-f]+)'/) || [])[1]; ok(h === '8559039d5a96110b', `머리 서명 그대로: ${h}`); fs.rmSync(out, { recursive: true, force: true }); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2OWN ${bad}개 실패` : '✅ tC2OWN 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2OWN 오류', e); process.exit(1); });
