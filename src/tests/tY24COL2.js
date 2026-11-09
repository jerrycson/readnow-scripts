// tY24COL2 — 정범님 11/09 밤 '예스24 판매관리 — 화면을 열지 않는 방식으로 지금 바로 번외 수집기로'
//  수집기 rnY24(머리 그대로) 쪽 시험:
//   ① 알라딘 일하는 탭의 다리(c2yTick)가 번외 도우미(127.0.0.1:8797 — 시험에선 가짜)에서 받은 예스24 응답 줄을 예전 줄(rn-y24q)에 같은 꼴로 넣고 → 예전 올리기(drain → y24UpOne)가 y24_probe·crm_y24_raw에 올림
//   ② 받은 줄 이름표로 두 번 넣지 않음(ack 뒤 같은 줄이 또 와도) · 출고 보호·웹앱 설정을 번외에 넘김
//   ③ 맡긴 일: 예스24 창이 없어도 번외가 맡을 수 있으면 jobSync가 받아 → 다리가 rn-y24jdone에 먼저 'run'을 적고 넘김 → 결과는 rn-y24jres로(jobSync가 crm_y24_orders에)
//   ④ 예스24 '리드나우 연결' 창은 번외가 대신 읽는 동안 주문 다시 읽기·맡긴 일을 쉼(겹침 막기)
//   ⑤ 번외가 없으면 rn-col2y를 끄고, 맡기려던 일은 되돌림 · 로거 크롬은 다리를 쓰지 않음
//  시험 자료의 손님은 '손님A' · 전화 010-0000-0000 (공개 저장소)
//  사용: node tY24COL2.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e3) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } } }
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a0 = src.indexOf('(function rnY24()'); const b0 = src.indexOf('\n})();', a0); if (a0 < 0 || b0 < 0) { console.log('❌ tY24COL2 — rnY24 덩어리를 못 찾음'); process.exit(1); }
const Y24 = src.slice(a0, b0 + 6);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 900))); if (!c) bad++; };
const BODY = JSON.stringify({ RESULT_LIST: [{ ORD_NO: 'Y2611100001', GOODS_NM: '시험 책', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000' }], TOTAL_COUNT: 1 });
const REC = (id) => ({ id, sig: 'POST /api/Order/NewOrderConfirmList', url: '/api/Order/NewOrderConfirmList', page: '/Order/NewOrderConfirmList', at: Date.now(), status: 200, ctype: 'application/json; charset=utf-8', req: '{"SDATE":"2026-11-08","EDATE":"2026-11-10"}', json: true, body: BODY, src: 'col2' });

/* 가짜 Firebase(올리기·jobSync가 쓰는 만큼) — 쓰기는 window.__W에 적음 */
const FB = (a) => { const W = (window.__W = []); const docs = a.docs || {}; const mk = (c, id) => ({ id: id || 'auto' + Math.random().toString(36).slice(2, 8), get: async () => { const v = docs[c + '/' + id]; return { exists: !!v, data: () => v }; }, set: async (v, o) => { W.push({ c, id, v, merge: !!(o && o.merge) }); docs[c + '/' + id] = { ...(o && o.merge ? docs[c + '/' + id] || {} : {}), ...v }; } });
  const col = (c) => ({ doc: (id) => mk(c, id), where: () => ({ limit: () => ({ get: async () => ({ docs: Object.keys(docs).filter((k) => k.startsWith(c + '/') && docs[k].autoQ).map((k) => ({ id: k.split('/')[1], data: () => docs[k], ref: mk(c, k.split('/')[1]) })) }) }) }) });
  const fsx = { collection: col, runTransaction: async (f) => f({ get: async (ref) => ref.get(), set: (ref, v, o) => ref.set(v, o) }) };
  const FV = { increment: (n) => ({ inc: n }), serverTimestamp: () => ({ ts: 1 }), arrayUnion: (...x) => ({ au: x }) };
  const firestore = () => fsx; firestore.FieldValue = FV; window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u1' }, onIdTokenChanged: () => {} }), firestore }; };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (url, seed, helper, fbDocs) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const HL = []; await p.route('**/*', async (rt) => { const rq = rt.request(); const u = new URL(rq.url());
      const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
      if (u.host === '127.0.0.1:8797' && rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
      if (u.host === '127.0.0.1:8797') { let b = {}; try { b = JSON.parse(rq.postData() || '{}'); } catch (e) {} HL.push({ p: u.pathname, b, h: rq.headers() }); const o = helper ? helper(u.pathname, b, HL) : null; return o ? rt.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) }) : rt.abort(); }
      if (/\/api\/Order\//.test(u.pathname)) return rt.fulfill({ status: 200, contentType: 'application/json', body: '{"RESULT_LIST":[],"TOTAL_COUNT":0}' });
      return rt.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>시험 화면</body></html>' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); }; window.GM_deleteValue = (k) => { delete st[k]; }; window.GM_addValueChangeListener = () => 0; window.__rnY24tourScale = 0.04;
      window.GM_openInTab = () => ({}); window.__LOGS = []; window.__rnLog = (s, lv, m) => window.__LOGS.push(lv + ' ' + m); window.__rnPcName = { get: () => 'HOME' }; window.__rnRole = () => 'lead'; window.__rnSgShip = () => (window.__HOLD ? { on: true, why: '시험 출고' } : { on: false });
      window.GM_xmlhttpRequest = (o) => { fetch(o.url, { method: o.method, headers: o.headers, body: o.data }).then(async (r) => o.onload && o.onload({ status: r.status, responseText: await r.text() })).catch(() => o.onerror && o.onerror()); };
      if (a.fb) { (new Function('a', a.fb))(a); } }, { seed, fb: fbDocs ? `(${FB.toString()})(a)` : null, docs: fbDocs || {} });
    await p.addInitScript({ content: Y24 }); await p.goto(url); return { p, HL }; };
  const until = async (p, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(200); } return false; };
  const tick = (p) => p.evaluate(() => window.__rnC2yTick && window.__rnC2yTick());

  // ── ①②③ 알라딘 일하는 탭 다리
  { const SEND = { recs: [REC('c2yA1'), REC('c2yA2')], jres: {} }; let feeds = 0;
    const helper = (pth, b) => { if (pth !== '/y24/feed') return null; feeds++; const took = (b.jobs || []).map((j) => j.id); const out = { ok: true, y24: { active: true, jobsOk: true, login: 'ok' }, recs: SEND.recs, took, jres: SEND.jres, jstep: null, tour: null }; return out; };
    const docs = { 'crm_y24_orders/Y2611100001': { autoQ: true, auto: { ship: { state: 'queued', seq: 1, courier: '롯데택배', no: '123456789012', confirm: false } } } };
    const { p, HL } = await mk('https://www.aladin.co.kr/scm/worders.aspx', { 'rn-y24cfg': { ordMin: 5, off: false } }, helper, docs);
    await p.waitForTimeout(500); await tick(p); await p.waitForTimeout(400);
    let g = await p.evaluate(() => ({ q: window.__GM['rn-y24q'] || [], c2: window.__GM['rn-col2y'], ids: window.__GM['rn-c2yids'] }));
    ok(g.q.length === 2 && g.q.every((x) => !x.id && !x.src && x.sig === 'POST /api/Order/NewOrderConfirmList' && x.body === BODY && x.json === true), `번외가 준 줄 → 예전 줄(rn-y24q)에 같은 꼴(이름표·src 뺌): ${g.q.length}`, g.q[0]);
    ok(g.c2 && g.c2.on && g.c2.jobs && Date.now() - g.c2.at < 5000, `rn-col2y 켜짐(예스24 창이 물러나는 표): ${JSON.stringify(g.c2)}`);
    const f1 = HL.filter((x) => x.p === '/y24/feed'); ok(f1[0] && f1[0].h['x-rn-col2'] === '1' && f1[0].b.cfg && f1[0].b.cfg.ordMin === 5 && f1[0].b.hold && f1[0].b.hold.on === false && f1[0].b.by === 'HOME', `번외에 웹앱 설정·출고 보호·PC 이름을 넘김: ${JSON.stringify(f1[0] && f1[0].b)}`);
    await p.waitForTimeout(1700); await tick(p); await p.waitForTimeout(400); g = await p.evaluate(() => ({ q: window.__GM['rn-y24q'] || [] })); const f2 = HL.filter((x) => x.p === '/y24/feed').slice(-1)[0];
    ok(g.q.length === 2 && f2.b.ack && f2.b.ack.includes('c2yA1') && f2.b.ack.includes('c2yA2'), `같은 줄이 또 와도 두 번 넣지 않음 · 다음 물음에 보냄 확인(ack): ${g.q.length} · ack ${JSON.stringify(f2.b.ack)}`);
    SEND.recs = [];
    // drain(예전 올리기 — 10초마다) → y24_probe·crm_y24_raw
    const up = await until(p, () => (window.__W || []).some((w) => w.c === 'crm_y24_raw') && (window.__W || []).some((w) => w.c === 'y24_probe'), 30000);
    const W = await p.evaluate(() => window.__W.map((w) => ({ c: w.c, sig: w.v.sig, by: w.v.by, body: String(w.v.body || '').slice(0, 40) })));
    ok(up && W.filter((w) => w.c === 'crm_y24_raw').length === 2 && W.find((w) => w.c === 'y24_probe').by === 'HOME', `예전 올리기 함수(y24UpOne)가 그대로 올림 — crm_y24_raw ${W.filter((w) => w.c === 'crm_y24_raw').length} · y24_probe`, W.map((w) => w.c));
    // ③ 맡긴 일: 예스24 창 없음(rn-y24alive 없음) — jobSync(25초) → rn-y24job → 다리 → 번외
    const got = await until(p, () => (window.__GM['rn-y24job'] || []).length > 0, 35000);
    ok(got, '예스24 창이 없어도 번외가 맡을 수 있으면 jobSync가 맡긴 일을 받음(rn-y24job)');
    await p.waitForTimeout(1700); await tick(p); await p.waitForTimeout(400); const f3 = HL.filter((x) => x.p === '/y24/feed' && (x.b.jobs || []).length).slice(-1)[0];
    let jd = await p.evaluate(() => window.__GM['rn-y24jdone'] || {});
    ok(f3 && f3.b.jobs[0].id === 'Y2611100001:ship:1' && f3.b.jobs[0].no === '123456789012' && jd['Y2611100001:ship:1'] && jd['Y2611100001:ship:1'].st === 'run' && jd['Y2611100001:ship:1'].by === 'col2', `맡긴 일을 번외에 넘기며 먼저 '하는 중'을 적음(예스24 창이 같은 일을 다시 안 함): ${JSON.stringify(jd)}`);
    await p.waitForTimeout(1700); await tick(p); await p.waitForTimeout(300); ok(HL.filter((x) => x.p === '/y24/feed' && (x.b.jobs || []).length).length === 1, '한 번 넘긴 일은 다시 안 넘김');
    SEND.jres = { 'Y2611100001:ship:1': { state: 'done', msg: '발송관리 목록에서 빠짐 = 발송처리됨', confirm: false, at: Date.now(), by: 'col2', steps: [{ at: new Date().toISOString(), lv: 'ok', m: '끝' }] } };
    await p.waitForTimeout(1700); await tick(p); await p.waitForTimeout(400); const R = await p.evaluate(() => ({ r: window.__GM['rn-y24jres'] || {}, d: window.__GM['rn-y24jdone'] || {} }));
    ok(R.r['Y2611100001:ship:1'] && R.r['Y2611100001:ship:1'].state === 'done' && R.d['Y2611100001:ship:1'].st === 'done', '번외 결과 → rn-y24jres·rn-y24jdone(예전 jobSync가 crm_y24_orders로 올림)');
    const upj = await until(p, () => (window.__W || []).some((w) => w.c === 'crm_y24_orders' && w.v.auto && w.v.auto.ship && w.v.auto.ship.state === 'done'), 30000); ok(upj, 'jobSync가 결과를 crm_y24_orders.auto.ship = done 으로');
    await p.waitForTimeout(1700); await tick(p); await p.waitForTimeout(300); const f4 = HL.filter((x) => x.p === '/y24/feed').slice(-1)[0]; ok(f4.b.jack && f4.b.jack.includes('Y2611100001:ship:1'), '결과 확인(jack)을 보냄');
    // 출고 보호
    await p.evaluate(() => { window.__HOLD = 1; }); await p.waitForTimeout(1600); await tick(p); await p.waitForTimeout(300); const f5 = HL.filter((x) => x.p === '/y24/feed').slice(-1)[0]; ok(f5.b.hold && f5.b.hold.on === true, '🚚 출고 중이면 번외에 hold.on을 넘김(번외가 멈춤)');
    await p.close(); }

  // ── ⑤ 번외 없음 → rn-col2y 끔 · 넘기려던 일 되돌림 / 로거 크롬
  { const now = Date.now(); const { p } = await mk('https://www.aladin.co.kr/scm/worders.aspx', { 'rn-col2y': { on: true, jobs: true, at: now }, 'rn-y24job': [{ id: 'Y9:ack:1', ono: 'Y9', kind: 'ack', at: now }] }, null, {});
    await p.waitForTimeout(400); await tick(p); await p.waitForTimeout(600); const g = await p.evaluate(() => ({ c2: window.__GM['rn-col2y'], d: window.__GM['rn-y24jdone'] || {} }));
    ok(g.c2 && g.c2.on === false && g.c2.jobs === false && !g.d['Y9:ack:1'], `번외가 없으면 rn-col2y 끔 · 넘기려던 일의 '하는 중'을 되돌림(예스24 창이 할 수 있게): ${JSON.stringify(g)}`); await p.close(); }
  { const { p, HL } = await mk('https://www.aladin.co.kr/scm/worders.aspx', { 'rn-pubChrome': true }, () => ({ ok: true, y24: {} }), {}); await p.waitForTimeout(300); await tick(p); await p.waitForTimeout(300); ok(HL.length === 0, '로거 크롬은 다리를 쓰지 않음(약속 0)'); await p.close(); }

  // ── ④ 예스24 '리드나우 연결' 창 — 번외가 대신 읽는 동안 쉼
  { const T = { NewOrderConfirmList: { u: '/api/Order/NewOrderConfirmList', b: '{"PAGE_NO":1}', h: {}, at: Date.now() } };
    const fresh = { on: true, jobs: true, at: Date.now() + 120e3 }; /* 시험 동안 1분 넘게 신선하게 */
    const { p } = await mk('https://uscm.yes24.com/Common/Body?rnx=y24cap01', { 'rn-y24otpl': T, 'rn-y24cfg': { ordMin: 0.03 }, 'rn-col2y': fresh, 'rn-y24job': [{ id: 'Y8:ack:1', ono: 'Y8', kind: 'ack', at: Date.now() }] }, null, null);
    const LOG = []; p.on('request', (r) => { if (/\/api\/Order\//.test(r.url())) LOG.push(r.url()); });
    await p.waitForTimeout(6000); const s = await p.evaluate(() => { const d = document.getElementById('rn-y24dock'); const t = d ? [...d.querySelectorAll('div')].map((x) => x.textContent).find((x) => /🔁 주문 다시 읽기/.test(x)) : ''; return { ob: t, c2y: (window.__rnY24ord || {}).c2y, jd: window.__GM['rn-y24jdone'] || {}, fr: document.querySelectorAll('iframe').length }; });
    ok(LOG.length === 0 && s.c2y === true && /번외 수집기가 화면 없이 대신 읽는 중/.test(s.ob), `번외가 대신 읽는 동안 이 창은 주문 다시 읽기를 쉼 · 띠에 그렇게 보임: ${s.ob}`, { LOG, s });
    ok(!s.jd['Y8:ack:1'] && s.fr === 0, '맡긴 일도 이 창은 손대지 않음(번외가 맡음)', s);
    await p.evaluate(() => { window.__GM['rn-col2y'] = { on: false, jobs: false, at: Date.now() }; }); const back = await until(p, () => !!(window.__rnY24ord || {}).at, 15000); ok(back, '번외가 물러나면(꺼짐) 이 창이 예전대로 다시 읽음');
    await p.close(); }
  ok(!errs.length, '화면 오류 없음', errs); await br.close();
  console.log(bad ? `❌ tY24COL2 ${bad}개 실패` : '✅ tY24COL2 모두 통과'); process.exit(bad ? 1 : 0); };
run().catch((e) => { console.log('❌ tY24COL2 오류', e); process.exit(1); });
