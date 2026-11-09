// tY24UP — 정범님 11/09 밤 스크린샷 '⚠ 예스24 응답 10개가 이 PC에 쌓여만 있고 Firebase(웹앱)로 못 올라갑니다 → 알라딘 탭을 열어 두세요'
//  → 사람이 알라딘 탭을 따로 열 일 없게(약속 4): 예스24 창이 스스로 Firebase로 올림(수집기 rnY24 · 머리 그대로)
//  가짜 예스24 판매관리(uscm.yes24.com — 시험 안에서만 꾸민 화면) + 가짜 Google 토큰 창구·Firestore REST(GM_xmlhttpRequest 가짜)로:
//  ① 알라딘 일하는 탭이 30초 넘게 안 비우면 예스24 창이 직접 올림 — y24_probe(n 더하기·서버 시각)·crm_y24_raw(원문)·y24_raw_idx/y24_raw(가린 원문) · 줄 비움 · '올리는 중' 표 풀림
//     · 출입증은 다시 받기 열쇠(rn-fbtok)로 securetoken에서 · 모든 요청은 Tampermonkey 요청(쿠키 안 보냄) · 예스24 쪽 저장소(쿠키·localStorage·IndexedDB)에 아무것도 안 남음 · 손님 정보는 가림
//  ② 알라딘 일하는 탭이 비우는 중(rn-y24drainAt 30초 안) · 알라딘 탭이 '올리는 중' 표를 잡음 · 웹앱 설정에서 꺼 둠 → 예스24 창은 안 올림
//  ③ 열쇠가 없거나 거절 → 띠에 까닭(사람에게 '알라딘 탭을 열라'는 말 없음) · 2분 넘게 쌓이면 알라딘 주문조회를 뒤 탭으로 한 번(30분에 한 번) · 알라딘 일하는 탭이 살아 있거나 로거 크롬이면 안 엶
//  ④ 알라딘 쪽: Firebase 로그인 사본(rn-fbtok)을 둠·로그아웃이면 지움 · 예스24 창이 올리는 중이면 비우지 않음 · 아니면 예전처럼 올림
//  시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소)
//  사용: node tY24UP.js (src/tests 또는 w/pw)
const fs = require('fs'); const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); } catch (e2) { ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright')); } }
const src = fs.readFileSync([path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)), 'utf8');
const a0 = src.indexOf('(function rnY24()'); const b0 = src.indexOf('\n})();', a0); if (a0 < 0 || b0 < 0) { console.log('❌ tY24UP — rnY24 덩어리를 못 찾음'); process.exit(0); }
const Y24 = src.slice(a0, b0 + 6);
let bad = 0; const ok = (c, m, info) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c ? '' : ' ' + JSON.stringify(info === undefined ? '' : info).slice(0, 700))); if (!c) bad++; };

const NOW = Date.now();
const recJ = (o) => ({ sig: 'POST /api/Order/NewOrderConfirmList', url: '/api/Order/NewOrderConfirmList', page: '/Order/NewOrderConfirmList', at: NOW - 5000, status: 200, ctype: 'application/json', req: '{}', json: true, body: JSON.stringify({ RESULT_LIST: [{ ORD_NO: 'Y9', GOODS_NM: '새 책', RCVR_NM: '손님A', RCVR_HP: '010-0000-0000' }], TOTAL_COUNT: 1 }), ...(o || {}) });
const recD = { sig: 'DOC /Order/OrderTotalList', url: '/Order/OrderTotalList', page: '/Order/OrderTotalList', at: NOW - 4000, status: 200, ctype: 'text/html', req: null, json: false, body: '<html><body><h1>주문 현황</h1>' + 'x'.repeat(600) + '</body></html>' };

const run = async () => { const br = await chromium.launch(); const errs = [];
  const mk = async (url, init) => { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    const LOG = []; await p.route('**/*', (rt) => { const u = new URL(rt.request().url()); LOG.push(rt.request().method() + ' ' + u.hostname + u.pathname); return rt.fulfill({ body: '<!doctype html><html><head><meta charset="utf-8"></head><body>화면</body></html>', contentType: 'text/html' }); });
    await p.addInitScript((a) => { if (window.top !== window) return; const st = a.seed || {}; window.__GM = st; window.GM_getValue = (k, d) => (k in st ? JSON.parse(JSON.stringify(st[k])) : d); window.GM_setValue = (k, v) => { st[k] = JSON.parse(JSON.stringify(v)); }; window.GM_deleteValue = (k) => { delete st[k]; }; window.GM_addValueChangeListener = () => 0; window.__rnY24tourScale = 0.04;
      window.__OPEN = []; window.GM_openInTab = (u, o) => { window.__OPEN.push({ u, o }); return {}; };
      const STORE = (window.__STORE = a.store || {}); const REQ = (window.__REQ = []);
      const dec = (x) => { if ('nullValue' in x) return null; if ('booleanValue' in x) return x.booleanValue; if ('integerValue' in x) return +x.integerValue; if ('doubleValue' in x) return x.doubleValue; if ('stringValue' in x) return x.stringValue; if ('timestampValue' in x) return x.timestampValue; if ('arrayValue' in x) return (x.arrayValue.values || []).map(dec); if ('mapValue' in x) { const o = {}; for (const [k, y] of Object.entries(x.mapValue.fields || {})) o[k] = dec(y); return o; } return '?'; };
      const enc = (v) => (v === null ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } });
      window.GM_xmlhttpRequest = (o) => { REQ.push({ m: o.method, u: o.url, h: o.headers || {}, d: o.data || null, anon: !!o.anonymous }); setTimeout(() => { const R = (s, obj) => o.onload({ status: s, responseText: typeof obj === 'string' ? obj : JSON.stringify(obj) }); const u = new URL(o.url);
        if (u.hostname === 'securetoken.googleapis.com') return /refresh_token=RT1(&|$)/.test(o.data || '') ? R(200, { id_token: 'ID1', refresh_token: 'RT1', expires_in: '3600' }) : R(400, { error: { message: 'INVALID_REFRESH_TOKEN' } });
        if (u.hostname === 'firestore.googleapis.com') { if ((o.headers || {}).Authorization !== 'Bearer ID1') return R(401, { error: { message: 'unauth' } }); const P = decodeURIComponent(u.pathname); const base = '/v1/projects/readnow-3a385/databases/(default)/documents';
          if (o.method === 'GET') { const key = P.slice(base.length + 1); const d = STORE[key]; return d ? R(200, { name: key, fields: enc(d).mapValue.fields }) : R(404, { error: { message: 'not found' } }); }
          if (P === base + ':commit') { const B = JSON.parse(o.data); for (const w of B.writes) { const key = w.update.name.split('/documents/')[1]; const cur = STORE[key] || {}; const F = {}; for (const [k, v] of Object.entries(w.update.fields || {})) F[k] = dec(v); let nx; if (w.updateMask) { nx = { ...cur }; for (const f of w.updateMask.fieldPaths) nx[f.replace(/^`|`$/g, '')] = F[f.replace(/^`|`$/g, '')]; } else nx = F; for (const t of w.updateTransforms || []) { const k = t.fieldPath.replace(/^`|`$/g, ''); if (t.increment) nx[k] = (+nx[k] || 0) + dec(t.increment); if (t.setToServerValue) nx[k] = 'SERVER_TS'; } STORE[key] = nx; } return R(200, { writeResults: [] }); }
          return R(400, 'bad'); }
        if (o.onerror) o.onerror(); }, 5); };
      if (a.fb) { window.__FBW = {}; let nid = 0; const doc = (c, id) => { id = id || 'auto' + ++nid; return { id, get: async () => ({ exists: false, data: () => undefined }), set: async (v) => { window.__FBW[c + '/' + id] = JSON.parse(JSON.stringify(v)); } }; };
        window.firebase = { apps: [1], auth: () => ({ currentUser: { uid: 'u9' }, onIdTokenChanged: (cb) => { window.__TOKCB = cb; } }), firestore: Object.assign(() => ({ collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }) }), runTransaction: async () => {} }), { FieldValue: { serverTimestamp: () => 'ts', increment: (x) => ({ inc: x }), arrayUnion: (...x) => x } }) }; } }, init || {});
    await p.addInitScript({ content: Y24 }); await p.goto(url); return { p, LOG }; };
  const Y = 'https://uscm.yes24.com/Common/Body?rnx=y24cap01'; const TOK = { rt: 'RT1', uid: 'u1', at: NOW };
  const until = async (p, fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn)) return true; await p.waitForTimeout(150); } return false; };
  const state = (p) => p.evaluate(async () => { const d = document.getElementById('rn-y24dock'); const divs = d ? [...d.querySelectorAll('div')] : []; let idb = []; try { idb = (await indexedDB.databases()).map((x) => x.name); } catch (e) {} return { q: (window.__GM['rn-y24q'] || []).length, lock: window.__GM['rn-y24upLock'] || null, store: window.__STORE, req: window.__REQ, open: window.__OPEN, badge: divs.map((x) => x.textContent).find((t) => /🟦 리드나우 예스24/.test(t)) || '', warn: divs.filter((x) => x.style.display !== 'none').map((x) => x.textContent).find((t) => /^⚠ 예스24 응답/.test(t)) || '', ls: localStorage.length, ck: document.cookie, idb, alAt: window.__GM['rn-y24alOpenAt'] || 0 }; });

  // ── ① 알라딘 탭 없음 → 예스24 창이 직접 올림
  { const { p, LOG } = await mk(Y, { seed: { 'rn-y24q': [recJ(), recJ({ at: NOW - 3000 }), recD], 'rn-fbtok': TOK, 'rn-y24drainAt': NOW - 120e3 } });
    const done = await until(p, () => !(window.__GM['rn-y24q'] || []).length, 20000); await p.waitForTimeout(5300); const s = await state(p);
    const pr = s.store['y24_probe/POST_api_Order_NewOrderConfirmList'] || {}; const raws = Object.entries(s.store).filter(([k]) => /^crm_y24_raw\//.test(k)).map(([, v]) => v);
    const idx = Object.entries(s.store).filter(([k]) => /^y24_raw_idx\//.test(k)).map(([, v]) => v); const yr = Object.entries(s.store).filter(([k]) => /^y24_raw\//.test(k)).map(([, v]) => v);
    ok(done && s.q === 0 && !s.lock, `줄 3개를 알라딘 탭 없이 이 창이 다 올림 · 줄 비움 · '올리는 중' 표 풀림: 남은 ${s.q} · 표 ${JSON.stringify(s.lock)}`);
    ok(pr.n === 2 && pr.uploadedAt === 'SERVER_TS' && pr.sig === 'POST /api/Order/NewOrderConfirmList' && /RESULT_LIST/.test(pr.shape || '') && !/손님A|010-0000-0000/.test(pr.sample || '') && /＊/.test(pr.sample || ''), `y24_probe: 같은 길 2번 → n 2(더하기) · 서버 시각 · 표본의 손님 이름·전화 가림`, pr);
    ok(raws.length === 3 && raws.some((r) => /손님A/.test(r.body)) && raws.every((r) => r.uploadedAt === 'SERVER_TS' && r.parts === 1), `crm_y24_raw(원문 그대로 · crm_ 이라 진단에서 안 읽음) 3개`, raws.map((r) => r.sig));
    ok(idx.some((x) => /neworderconfirmlist/.test(x.key) && x.cnt === 1 && x.n === 1) && yr.length === 1 && !/손님A|010-0000-0000/.test(yr[0].body), `원문 보관 y24_raw_idx(건수 cnt 1)·y24_raw(손님 정보 가림) — 화면 문서(DOC)는 알라딘 탭의 화면 가림이 있어야 해서 이 창에선 원문 보관만 건너뜀(crm_y24_raw엔 들어감)`, { idx, yr: yr.length });
    const st = s.req.filter((r) => /securetoken/.test(r.u)); const fsq = s.req.filter((r) => /firestore\.googleapis/.test(r.u));
    ok(st.length === 1 && /grant_type=refresh_token&refresh_token=RT1/.test(st[0].d) && st[0].h.Referer && st.every((r) => r.anon), `출입증은 다시 받기 열쇠로 한 번만(1시간 재사용) · Tampermonkey 요청(쿠키 안 보냄): ${st.length}번`, st);
    ok(fsq.length >= 8 && fsq.every((r) => r.h.Authorization === 'Bearer ID1' && r.anon) && fsq.some((r) => /app_settings\/platforms/.test(r.u)), `Firestore REST ${fsq.length}번 — 모두 출입증 · 쿠키 안 보냄 · 끄기 설정(app_settings/platforms)부터 확인`);
    ok(!LOG.some((x) => /yes24\.com\/api\//i.test(x)) && LOG.length === 1, `예스24 쪽 요청 늘지 않음(화면 하나만): ${JSON.stringify(LOG)}`);
    ok(s.ls === 0 && s.ck === '' && !s.idb.length, `예스24 쪽 저장소(localStorage·쿠키·IndexedDB)에 아무것도 안 남음: ${s.ls}/${JSON.stringify(s.ck)}/${JSON.stringify(s.idb)}`);
    ok(/⬆ 이 창이 직접 올림 3개/.test(s.badge) && !s.warn, `띠: '⬆ 이 창이 직접 올림 3개' · 주황 경고 없음: ${s.badge}`);
    await p.context().close(); }

  // ── ② 안 올리는 때: 알라딘 일하는 탭이 비우는 중 · 알라딘 탭이 '올리는 중' 표 · 웹앱 설정에서 꺼 둠
  { const A = await mk(Y, { seed: { 'rn-y24q': [recJ()], 'rn-fbtok': TOK, 'rn-y24drainAt': NOW } });
    const B = await mk(Y, { seed: { 'rn-y24q': [recJ()], 'rn-fbtok': TOK, 'rn-y24drainAt': NOW - 120e3, 'rn-y24upLock': { by: 'al', at: NOW } } });
    const C = await mk(Y, { seed: { 'rn-y24q': [recJ()], 'rn-fbtok': TOK, 'rn-y24drainAt': NOW - 120e3 }, store: { 'app_settings/platforms': { y24: { off: true } } } });
    await A.p.waitForTimeout(4000); const [a, b, c] = [await state(A.p), await state(B.p), await state(C.p)];
    ok(a.q === 1 && !a.req.length, `알라딘 일하는 탭이 30초 안에 비웠으면(drainAt) 예스24 창은 손대지 않음: 남은 ${a.q} · 요청 ${a.req.length}`);
    ok(b.q === 1 && !b.req.length, `알라딘 탭이 '올리는 중' 표를 잡았으면 기다림(같은 줄을 두 번 올리지 않음): 남은 ${b.q}`);
    ok(c.q === 1 && !c.req.some((r) => /:commit/.test(r.u)), `웹앱 설정 예스24 끄기(platforms.y24.off)면 안 올림: 남은 ${c.q}`);
    await A.p.context().close(); await B.p.context().close(); await C.p.context().close(); }

  // ── ③ 열쇠가 없음 · 거절 → 까닭을 띠에 · 2분 넘게 쌓이면 알라딘 주문조회를 뒤 탭으로 한 번
  { const old = recJ({ at: NOW - 10 * 60e3 });
    const N = await mk(Y, { seed: { 'rn-y24q': [old], 'rn-y24drainAt': NOW - 600e3 } });
    const D = await mk(Y, { seed: { 'rn-y24q': [old], 'rn-fbtok': { rt: 'BAD' }, 'rn-y24drainAt': NOW - 600e3 } });
    const L = await mk(Y, { seed: { 'rn-y24q': [old], 'rn-y24drainAt': NOW - 600e3, 'rnu-lead': { tab: 'x', at: Date.now() + 60e3 } } });
    const P = await mk(Y, { seed: { 'rn-y24q': [old], 'rn-y24drainAt': NOW - 600e3, 'rn-pubChrome': Date.now() } });
    await N.p.waitForTimeout(5800); const [n, d, l, pb] = [await state(N.p), await state(D.p), await state(L.p), await state(P.p)];
    ok(/까닭: 이 PC 알라딘 수집기 탭의 Firebase 로그인 사본이 아직 없음/.test(n.warn) && !/열어 두세요/.test(n.warn) && /할 일 없음/.test(n.warn), `열쇠 없음 → 띠에 까닭 · '알라딘 탭을 열어 두세요' 같은 사람 일 없음: ${n.warn}`);
    ok(n.open.length === 1 && n.open[0].u === 'https://www.aladin.co.kr/scm/worders.aspx' && n.open[0].o.active === false && n.alAt > 0 && /뒤 탭으로 열었습니다/.test(n.warn), `알라딘 주문조회를 뒤 탭으로 한 번만 엶(여러 번 돌아도 30분에 한 번): ${JSON.stringify(n.open)}`);
    ok(/Firebase 출입증을 못 받음\(400 INVALID_REFRESH_TOKEN\)/.test(d.warn) && d.open.length === 1 && d.q === 1, `열쇠가 거절되면(400) 까닭 · 알라딘 탭 한 번 · 줄은 그대로(지우지 않음): ${d.warn.slice(0, 120)}`);
    ok(!l.open.length && /까닭/.test(l.warn), '알라딘 일하는 탭이 살아 있으면(그 탭 로그인 문제) 탭을 더 열지 않음');
    ok(!pb.open.length, '로거 크롬(rn-pubChrome)에서는 알라딘 탭을 열지 않음(약속 0)');
    const D2 = await mk(Y, { seed: { 'rn-y24q': [recJ({ at: Date.now() + 2000 })], 'rn-y24drainAt': NOW - 600e3 } }); await D2.p.waitForTimeout(3000); const d2 = await state(D2.p);
    ok(!d2.open.length && !d2.warn, `막 쌓인 것(1분 안)은 경고·탭 열기 없이 기다림: ${d2.warn}`);
    for (const x of [N, D, L, P, D2]) await x.p.context().close(); }

  // ── ④ 알라딘 쪽: 로그인 사본 두기·지우기 · 예스24 창이 올리는 중이면 비우지 않음 · 아니면 예전처럼
  { const AL = 'https://www.aladin.co.kr/scm/x';
    const K = await mk(AL, { fb: true, seed: {} }); await K.p.waitForTimeout(600);
    const k1 = await K.p.evaluate(() => { window.__TOKCB({ refreshToken: 'RT9', uid: 'u9' }); return window.__GM['rn-fbtok'] || null; }); const k2 = await K.p.evaluate(() => { window.__TOKCB(null); return window.__GM['rn-fbtok'] || null; });
    ok(k1 && k1.rt === 'RT9' && k1.uid === 'u9' && !k1.email && k2 === null, `알라딘 탭: Firebase 다시 받기 열쇠 사본(rn-fbtok · 메일 없음) 둠 → 로그아웃되면 지움: ${JSON.stringify(k1)} → ${k2}`);
    await K.p.context().close();
    const H = await mk(AL, { fb: true, seed: { 'rn-y24q': [recJ()], 'rn-y24upLock': { by: 'y24', at: Date.now() + 60e3 } } });
    const G = await mk(AL, { fb: true, seed: { 'rn-y24q': [recJ()] } });
    await H.p.waitForTimeout(16500); const h = await H.p.evaluate(() => ({ q: (window.__GM['rn-y24q'] || []).length, w: Object.keys(window.__FBW), da: window.__GM['rn-y24drainAt'] || 0 })); const g = await G.p.evaluate(() => ({ q: (window.__GM['rn-y24q'] || []).length, w: Object.keys(window.__FBW), lock: window.__GM['rn-y24upLock'] || null, pr: window.__FBW['y24_probe/POST_api_Order_NewOrderConfirmList'] }));
    ok(h.q === 1 && !h.w.some((x) => /y24_probe|crm_y24_raw/.test(x)) && h.da > 0, `알라딘 탭: 예스24 창이 '올리는 중'이면 비우지 않음(살아 있다는 drainAt만 남김): ${JSON.stringify(h)}`);
    ok(g.q === 0 && g.w.some((x) => /^crm_y24_raw\//.test(x)) && g.pr && g.pr.n && g.pr.n.inc === 1 && !g.lock, `알라딘 탭: 예전처럼 SDK로 올림(같은 함수) · 표 풀림: ${JSON.stringify(g.w)}`);
    await H.p.context().close(); await G.p.context().close(); }
  await br.close(); return errs; };

// ── ⑤ 원본 글: 머리 그대로 · 예스24 창이 Firebase SDK 로그인·IndexedDB를 쓰지 않음 · 사람에게 '알라딘 탭을 열어 두세요'라는 띠 글 없음
const textChk = () => { const head = src.slice(0, src.indexOf('==/UserScript==')); ok(!/rn-fbtok|y24UpOne/.test(head) && /@connect\s+googleapis\.com/.test(head) && /@grant\s+GM_xmlhttpRequest/.test(head) && /@grant\s+GM_openInTab/.test(head), '머리(@grant GM_xmlhttpRequest·GM_openInTab · @connect googleapis.com)는 원래 있던 것 — 안 바꿈');
  const yb = Y24.slice(Y24.indexOf('if (onY) { /* ══ (11/10)'), Y24.indexOf('/* (11/10) ⬆ 예스24 창이 스스로 올리게 — 이 탭의')); ok(yb.length > 1000 && !/firebase\.|indexedDB|localStorage|document\.cookie/.test(yb), '예스24 창의 직접 올리기에는 Firebase SDK·IndexedDB·localStorage·쿠키가 없음');
  ok(!/알라딘 샵매니저\(리드나우 수집기가 도는 알라딘 탭\)를 열어 두세요/.test(Y24), "예스24 띠에서 '알라딘 탭을 열어 두세요' 사람 일 뺌"); };

(async () => { textChk(); const errs = await run(); ok(!errs.length, '화면 오류 없음', errs); console.log(bad ? `❌ tY24UP 실패 ${bad}` : '✓ tY24UP 모두 통과'); })().catch((e) => { console.log('❌ tY24UP 멈춤', e.message); });
