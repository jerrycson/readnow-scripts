// tC2ALB — 정범님 11/09 밤 '로그인 일(알라딘 샵매니저)도 번외로' · lab/col2/LOGIN_PLAN.md ⑤-1
//  수집기(머리 그대로) 🟧 번외 알라딘 다리(rnC2al) 시험:
//   ① 10초마다 번외 도우미(127.0.0.1:8797 — 시험에선 가짜)에 POST /al/feed {by, seat, hold, opLostAt, cfg} · 그 밖 칸 없음(손님 정보 없음)
//   ② 🪑 자리: 번외가 알라딘 읽기를 켰을 때만 계정 문서(app_settings/aladin_login)의 '<PC>~col2' 자리를 운영 규칙(seatAsk·seatKeep)으로 받음 · 우선순위 -1(클라우드보다 뒤)
//       · 자리가 꽉 차면 받지 않음(seat.ok 거짓) · 다른 기기가 기다리면 번외가 넘김 · 번외가 끄면 내려놓음 · 계정 문서 col2Off면 안 줌
//   ③ 🚚 출고 중(hold.on)이면 hold를 넘기고 seat.ok 거짓 · 자리를 내려놓음(약속 0-1)
//   ④ opLostAt = 운영 세션이 진짜 풀린 시각(rnu-login-lost) — 로그인 모듈이 '로그인됨 → 풀림'에서만 적음
//   ⑤ 로거 크롬·LOGGER PC에서는 안 돎(약속 0) · 번외가 없으면 자리를 내려놓음
//   ⑥ 머리 서명 그대로(split.js 결과 HSIG = 8559039d5a96110b)
//  사용: node tC2ALB.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const SRCF = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRCF, 'utf8');
const cut = (mark, end) => { const a = src.indexOf(mark); const b = src.indexOf(end, a); if (a < 0 || b < 0) { console.log('❌ tC2ALB — 덩어리를 못 찾음: ' + mark); process.exit(1); } return src.slice(a, b + end.length); };
const RULE = cut('globalThis.__rnLoginRule = (function', '\n})();'); const BR = cut('(function rnC2al()', '\n})();');
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
    await p.addInitScript({ content: RULE }); await p.addInitScript({ content: BR }); await p.goto('https://www.aladin.co.kr/scm/worders.aspx'); return { p, HL }; };
  const tick = async (p, force) => { await p.evaluate((f) => window.__rnC2alTick && window.__rnC2alTick(f), !!force); await p.waitForTimeout(350); };
  const dev = (p, who) => p.evaluate((w) => { const d = window.__D['app_settings/aladin_login'] || {}; return { dev: (d.dev || {})[w] || null, wait: (d.wait || {})[w] || null }; }, who);
  const AL = { on: true, logger: false, login: 'ok', active: false, seat: false, pp: null };
  const helperOf = (S) => (pth) => (pth === '/al/feed' ? { ok: true, al: { ...AL, ...S } } : null);

  // ── ①② 자리 받기 → 다음 알림에 seat.ok
  { const S = {}; const { p, HL } = await mk({ 'rnu-login-lost': 1762700000000 }, helperOf(S), {});
    await p.waitForTimeout(300); await tick(p);
    const f1 = HL.filter((x) => x.p === '/al/feed')[0];
    ok(f1 && f1.h['x-rn-col2'] === '1' && f1.b.by === 'OFFICE1' && f1.b.seat && f1.b.seat.ok === false && f1.b.hold && f1.b.hold.on === false && f1.b.opLostAt === 1762700000000 && f1.b.cfg && f1.b.cfg.off === false, `POST /al/feed {by, seat, hold, opLostAt, cfg}: ${JSON.stringify(f1 && f1.b)}`);
    ok(f1 && Object.keys(f1.b).sort().join(',') === 'by,cfg,hold,opLostAt,seat', `알림 칸은 다섯뿐(손님 정보·쿠키 없음): ${f1 && Object.keys(f1.b)}`);
    let d = await dev(p, 'OFFICE1~col2'); ok(d.dev && d.dev.in === true && d.dev.pri === -1 && d.dev.how === '자리', `번외가 켜져 있으니 'OFFICE1~col2' 자리를 운영 규칙으로 받음(우선순위 -1): ${JSON.stringify(d)}`);
    await p.waitForTimeout(1700); await tick(p); const f2 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0];
    ok(f2.b.seat.ok === true && /자리 받음\(\d\/4대\)/.test(f2.b.seat.why), `다음 알림에 seat.ok 참: ${JSON.stringify(f2.b.seat)}`);
    const nW = await p.evaluate(() => window.__W.length); await tick(p); await tick(p); ok((await p.evaluate(() => window.__W.length)) === nW, '자리 신호는 10~15분마다만(알림마다 계정 문서를 쓰지 않음)');
    // 다른 기기가 기다림 → 번외가 넘김
    await p.evaluate(() => { const d = window.__D['app_settings/aladin_login']; d.wait = { ...(d.wait || {}), PC2: { at: Date.now(), since: Date.now(), pri: 1 } }; });
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); await p.waitForTimeout(1700); await tick(p); const f3 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0];
    ok(d.dev && d.dev.in === false && d.dev.yield === true && f3.b.seat.ok === false && /PC2가 자리를 기다려 번외가 넘김/.test(f3.b.seat.why), `다른 기기(PC2)가 기다리면 번외가 먼저 넘김: ${JSON.stringify({ d, s: f3.b.seat })}`);
    await p.evaluate(() => { delete window.__D['app_settings/aladin_login'].wait.PC2; });
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev && d.dev.in === true, '기다리던 기기가 없어지면 다시 받음');
    // ③ 출고 중 → hold 넘김 · seat.ok 거짓 · 자리 내려놓음
    await p.evaluate(() => { window.__HOLD = 1; }); await p.waitForTimeout(1700); await tick(p); await tick(p, true); const f4 = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; d = await dev(p, 'OFFICE1~col2');
    ok(f4.b.hold && f4.b.hold.on === true && f4.b.seat.ok === false && d.dev.in === false, `🚚 출고 중이면 hold.on을 넘기고 자리를 쓰지 않음(내려놓음): ${JSON.stringify({ h: f4.b.hold, s: f4.b.seat, d: d.dev })}`);
    await p.evaluate(() => { window.__HOLD = 0; }); await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === true, '출고가 끝나면 그 자리부터 다시');
    // 번외가 알라딘 읽기를 끔 → 내려놓음
    S.on = false; await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false && d.dev.how === '번외 쉼' && !d.wait, `번외가 끄면 자리를 내려놓음: ${JSON.stringify(d)}`);
    const nW2 = await p.evaluate(() => window.__W.length); await tick(p, true); await tick(p, true); ok((await p.evaluate(() => window.__W.length)) === nW2, '꺼진 동안엔 계정 문서를 다시 쓰지 않음');
    // 핑퐁 의심(번외가 pp)이면 자리를 묻지 않음
    S.on = true; S.pp = '시험 핑퐁'; await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false, '번외가 핑퐁 의심으로 멈춘 동안엔 자리를 묻지 않음');
    S.pp = null; await tick(p, true);
    // ⑤ 번외가 사라짐 → 내려놓음
    await p.unroute('**/*'); await p.route('**/*', (rt) => (new URL(rt.request().url()).host === '127.0.0.1:8797' ? rt.abort() : rt.fulfill({ contentType: 'text/html', body: '<html></html>' })));
    await tick(p, true); d = await dev(p, 'OFFICE1~col2'); ok(d.dev.in === false, `번외 도우미가 없으면 자리를 내려놓음: ${JSON.stringify(d.dev)}`);
    await p.close(); }

  // ── 자리가 꽉 참(🔒 상시 PC 3 + PC 하나 = 4대) → 받지 않음 · 기다림 줄에만(맨 뒤)
  { const now = Date.now(); const docs = { 'app_settings/aladin_login': { dev: { 'JS-MAIN': { in: true, at: now, pri: 1 }, 'MJ-MAIN': { in: true, at: now, pri: 1 }, HOME: { in: true, at: now, pri: 1 }, PC5: { in: true, at: now, pri: 1 } } } };
    const { p, HL } = await mk({}, helperOf({}), docs); await tick(p); await p.waitForTimeout(1700); await tick(p); const f = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; const d = await dev(p, 'OFFICE1~col2');
    ok(f.b.seat.ok === false && /자리 기다림/.test(f.b.seat.why) && (!d.dev || d.dev.in === false) && d.wait && d.wait.pri === -1, `자리가 꽉 차면 받지 않음(약관 4대 · 그림자는 맨 뒤): ${JSON.stringify({ s: f.b.seat, d })}`);
    const other = await p.evaluate(() => { const R = globalThis.__rnLoginRule; const d = window.__D['app_settings/aladin_login']; const now = Date.now(); d.dev.PC5 = { in: false, at: now }; return R.seatAsk(d, 'PC3', now, { pri: 1 }, 0.5).ok; });
    ok(other === true, '번외가 기다림 줄에 있어도 다른 PC(우선순위 1)는 먼저 자리를 받음');
    await p.close(); }
  // ── 계정 문서 col2Off → 안 줌
  { const { p, HL } = await mk({}, helperOf({}), { 'app_settings/aladin_login': { col2Off: true } }); await tick(p); await p.waitForTimeout(1700); await tick(p); const f = HL.filter((x) => x.p === '/al/feed').slice(-1)[0]; const d = await dev(p, 'OFFICE1~col2');
    ok(f.b.seat.ok === false && f.b.cfg.off === true && !d.dev, `계정 문서 col2Off면 번외 자리를 주지 않고 cfg.off를 넘김: ${JSON.stringify(f.b)}`); await p.close(); }
  // ── ⑤ 로거 크롬 · LOGGER PC
  { const { p, HL } = await mk({ 'rn-pubChrome': true }, helperOf({}), {}); await tick(p, true); await tick(p, true); ok(HL.length === 0 && !(await dev(p, 'OFFICE1~col2')).dev, '로거 크롬은 다리를 쓰지 않음(약속 0)'); await p.close(); }
  { const { p, HL } = await mk({}, helperOf({}), {}, 'LOGGER-1'); await tick(p, true); ok(HL.length === 0, 'LOGGER PC 이름이어도 다리를 쓰지 않음'); await p.close(); }

  // ── ④ 로그인 모듈: 운영 세션이 '로그인됨 → 진짜 풀림'일 때만 rnu-login-lost
  { const gov = cut('(function rnLoginGovInit()', '\n})();');
    ok(/function lostMark\(\) \{ try \{ if \(PUB\(\)\) return; const s = st\(\); if \(s\.in !== false\) S\('rnu-login-lost', Date\.now\(\)\); \} catch \(e\) \{\} \}/.test(gov), '로그인 모듈 lostMark — 로거 아님 · 이미 풀린 채(in 거짓)면 적지 않음');
    ok(/lostMark\(\); devPut\(false, 'out'\); return 'out';/.test(gov) && /if \(await isIn\(\)\) \{ markIn\('확인'\); return true; \}\n\s+lostMark\(\);/.test(gov), "확인(verify)에서 '진짜 풀림' · 다시 로그인(relogin0) 직전에 적음"); }

  // ── 팝업 없음 · ⑥ 머리 서명 그대로
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(BR), '다리에 브라우저 팝업 없음');
  { const split = [path.join(__dirname, '../split.js')].find((p) => fs.existsSync(p)); if (split && /readnow-collector\.src\.js$/.test(SRCF)) { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'c2alb-')); cp.execFileSync('node', [split, SRCF, out], { stdio: 'pipe' });
      const h = (fs.readFileSync(path.join(out, 'readnow-collector.user.js'), 'utf8').match(/const HSIG = '([0-9a-f]+)'/) || [])[1]; ok(h === '8559039d5a96110b', `머리 서명 그대로: ${h}`); fs.rmSync(out, { recursive: true, force: true }); }
    else console.log('  · 머리 서명 비교는 저장소(src)에서만'); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tC2ALB ${bad}개 실패` : '✅ tC2ALB 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tC2ALB 오류', e); process.exit(1); });
