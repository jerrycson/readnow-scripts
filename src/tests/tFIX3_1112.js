// tFIX3_1112 — (11/12 일꾼 fix3 · verify3 17:29~17:33 확인 결과로 고친 세 가지)
//   ① 통합 장부 밀린 일 엔진이 17:17 시작 뒤 한 건도 안 맡김 — 밀린 2건은 예스24 쪽 · 예스24 쪽은 '번외 있는 PC(맥박 y24)'만 맡았는데 JS-MAIN·HOME 웹앱 맥박이 끊기고 살아 있던 MJ-MAIN은 y24 0
//      · omniY24Far: 다른 기기의 예스24 쪽 맥박이 15분 안에 없으면 이 기기가 원격 길(맡은 PC 수집기 다리)로 맡음 · 자기 맥박은 안 셈 · 💓 경보는 y24r(원격 길)도 예스24 쪽이 도는 것으로 봄
//      · ☁ 클라우드 대신 자동 내림: 쉴 때 어느 PC가 무엇을 맡는지(예스24 쪽 번외·원격 길·없음)를 남김 · 밀린 일 미리보기가 끝났고 멈추지 않았으면 켜기 전 주문(14일 안)도 알라딘 쪽 내림(bl 표시) · ⏸ 멈춤이면 안 함
//      · 화면(harness): 번외 없는 MJ-MAIN · 다른 번외 PC 맥박 없음 → 알라딘 주문의 예스24 판매중지를 원격 길(col2_y24_cmd)로 맡김 · 맥박에 y24r·판·요약 · 다른 번외 PC가 돌면 맡지 않음
//   ② HOME 예스24 로그인 'need'가 다시 보이던 것 — 수집기 다리가 v.at만 새로 쓰고 st.y24(00:12 0.1.25 'need')는 그대로 → c2CtlRow가 다리 문서면 💓를 씀 · 다리는 st를 통째로(mergeFields) + st.y24 = 지금 상태 · 💓에 이어받기 기록(tk)
//   ③ 리드 탭 화면 요소가 5분마다 늘던 것 — 기록 창 한 줄 = 요소 하나(시각·칸 이름은 CSS) · 오늘 기록 화면 상한 400줄 · 5분 성능 줄에 화면 요소를 어디 것인지 나눠 셈 · 알림 띠 최근 20개
// 실행: node src/tests/tFIX3_1112.js (순수·글 검사) · 화면까지: pw/ 안 RN_PORT=<포트> node tFIX3_1112.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const find = (...L) => L.map((x) => path.resolve(__dirname, x)).find((x) => fs.existsSync(x));
const APP = process.env.RN_APP || find('../app.html', '../../src/app.html'); const T = fs.readFileSync(APP, 'utf8');
const CS = fs.readFileSync(find('../readnow-collector.src.js', '../readnow-collector.user.js', '../../src/readnow-collector.src.js'), 'utf8');
const CT = fs.readFileSync(find('../../cloud/index.js', '../cloud/index.js'), 'utf8');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };

console.log('① 순수 셈 — 예스24 쪽 원격 길·경보');
const F = new Function(cut(T, '/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { omniY24Far, omniAlarm, OMNI_HB_MIN, omniReMap, OMNI_LATER_RE };')();
{ const now = Date.parse('2026-11-12T08:50:00Z'); const g = '처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)';
  const L = { a: { st: 'fail', msg: g, doneAt: '2026-11-12T08:46:27Z' }, b: { st: 'later', msg: g, doneAt: '2026-11-12T08:49:30Z' }, c: { st: 'fail', msg: '번외가 맡김을 거절' }, d: { st: 'later', doneAt: '2026-11-12T08:40:00Z' }, 'd#2': { st: 'sent' } };
  const R = F.omniReMap(L, () => false, now);
  ok(R.a === 'a#2' && !R.b && !R.c && R.d === 'd#2', '진단 08:46 모양: 번외 "처음 한 건을 확인하는 중" 거절(later · 옛 fail 기록도)은 2분 뒤 새 열쇠로 다시 · 2분 안은 기다림 · 다른 거절은 사람 손 그대로', R);
  ok(F.OMNI_LATER_RE.test(g) && /OMNI_LATER_RE\.test\(why\) \? 'later'/.test(T), 'omniDo: 지금만 바쁜 거절은 later로 적음'); }
{ const now = Date.parse('2026-11-12T08:30:00Z'); const ago = (m) => new Date(now - m * 60e3).toISOString();
  ok(F.omniY24Far({ 'MJ-MAIN': { at: ago(1), y24: 0 }, 'JS-MAIN': { at: ago(43), y24: 1 }, HOME: { at: ago(500), y24: 1 } }, 'MJ-MAIN', now) === true, 'verify3 모양(JS-MAIN 43분·HOME 8시간 전 · MJ-MAIN만 y24 0) → MJ-MAIN이 원격 길로 맡음');
  ok(F.omniY24Far({ 'MJ-MAIN': { at: ago(1), y24: 0 }, 'JS-MAIN': { at: ago(3), y24: 1 } }, 'MJ-MAIN', now) === false, '다른 번외 PC 맥박이 15분 안이면 맡지 않음(그 PC가 함 · 겹치지 않게)');
  ok(F.omniY24Far({ 'mj-main': { at: ago(1), y24: 1 } }, 'MJ-MAIN', now) === true && F.omniY24Far({}, 'X', now) === true, '자기 맥박은 안 셈(이름 큰·작은 글자 같게) · 맥박이 하나도 없으면 맡음');
  ok(F.omniY24Far({ A: { at: ago(F.OMNI_HB_MIN + 1), y24: 1 } }, 'B', now) === true && F.omniY24Far({ A: { at: ago(F.OMNI_HB_MIN - 1), y24: 1 } }, 'B', now) === false, '기준 = 웹앱 열린 PC 없음 경보와 같은 15분');
  const W = (hb) => F.omniAlarm({ on: 1, hb, cloud: null, now: new Date(now).toISOString() });
  ok(W({ 'MJ-MAIN': { at: ago(2), y24: 0, y24r: 1 } }) === null, '💓 경보: 원격 길(y24r)로 맡는 PC가 돌면 "예스24 쪽 멈춤" 경보 없음');
  const w2 = W({ 'MJ-MAIN': { at: ago(2), y24: 0 } }); ok(w2 && w2.k === 'y24', '원격 길도 번외 PC도 없으면 예전처럼 예스24 쪽 멈춤 경보', w2); }
{ const blk = cut(T, '/* (11/12 fix3 · verify3 17:29 — 밀린 일 2건', '/* (11/11 naver1)'); const tick = cut(T, 'async function omniTick() {', 'const omniInfo = ');
  ok(/y24rem = !y24ok && !ledY24Guard\(\) && omniY24Far\(S\.omni\.hb/.test(tick) && /P\.a\.ch !== 'yes24' \|\| y24ok \|\| y24rem/.test(tick), 'omniTick: 번외 없으면(y24ok 아님) 출고 보호·로거·예스24 꺼 둠(ledY24Guard)이 아니고 다른 번외 PC 맥박이 없을 때만 예스24 쪽을 맡음');
  ok(/omniBeat\(y24ok, y24rem\)/.test(tick) && /y24r: y24rem \? 1 : 0, ver: APP_VER, sum: S\._omniSum/.test(T), '맥박에 y24r(원격 길)·웹앱 판·지난 돌기 요약(밀린 일·고름·건너뜀 판매처별 수)');
  ok(/S\._omniSum = `/.test(tick) && /예스24 길/.test(tick), '요약은 글 한 줄(merge로 옛 칸이 섞이지 않게)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(blk + tick), '새 코드에 브라우저 창 없음'); }

console.log('② 번외 상태 — 다리 문서면 💓');
{ const c2 = new Function(cut(T, 'function c2CtlRow(id, v) {', 'const y24HNm = ') + '\nreturn c2CtlRow;')();
  const old = { login: 'need', msg: '로그인 필요 — 「이미 로그인된」(처음 23:45)' }; const hb = { hlp: true, login: 'ok', msg: '🔁 오늘 다른 곳 로그인에 2번 끊김', at: '2026-11-12T08:31:00Z' };
  const r1 = c2('HOME', { at: '2026-11-12T08:34:49Z', by: '수집기 다리 HOME', via: 'col', st: { at: '2026-11-12T08:34:49Z', y24: old }, y24hb: hb });
  ok(r1.y && r1.y.login === 'ok' && r1.hb === 1, 'verify3 모양: 다리가 💓보다 3분 늦게 썼어도(st.y24는 00:12 옛 need) 💓의 ok를 씀', r1);
  const r2 = c2('HOME', { at: '2026-11-12T08:34:49Z', by: '웹앱 HOME (x)', st: { at: '2026-11-12T08:34:49Z', y24: { login: 'ok', msg: '웹앱이 지금 씀' } }, y24hb: { ...hb, login: 'need' } });
  ok(r2.y && r2.y.login === 'ok' && !r2.hb, '웹앱이 방금 쓴 문서(💓보다 새것)는 예전처럼 웹앱 값', r2);
  const r3 = c2('HOME', { at: '2026-11-12T08:00:00Z', by: '웹앱 HOME', st: { y24: old }, y24hb: hb }); ok(r3.y.login === 'ok', '💓가 더 새것이면 💓(예전 그대로)', r3); }
{ const i = CS.indexOf('let stAt = 0; const stPut'); const j = CS.indexOf('G.__rnC2yStPut = stPut;', i); const body = CS.slice(i, j);
  const hbB = cut(CS, "    const hbOf = (y) => {", '    const gx = (m, p, b) =>');
  const writes = []; let clock = Date.parse('2026-11-12T17:34:00+09:00'); const realNow = Date.now; Date.now = () => clock;
  const firebase = { firestore: () => ({ collection: (c) => ({ doc: (id) => ({ set: async (v, o) => { writes.push({ c, id, v, o }); } }) }) }) };
  const ST = { ok: true, pc: 'HOME', kind: 'office', ver: '0.1.36', on: true, msg: '작업 창 숨김', auto: { dayN: 586, dayCap: 1600 }, upd: { at: '2026-11-12 17:09', msg: '새 판 없음(GitHub 0.1.36)' }, relay: { pullAt: 0 }, solo: { live: false } };
  const gx = async (m, p) => (p === '/status' ? ST : null);
  const stPut = new Function('gx', 'firebase', hbB + body + '\nreturn stPut;')(gx, firebase);
  const Y = { on: true, mine: true, holder: 'HOME', login: 'ok', alive: true, active: true, msg: '🔁 오늘 다른 곳 로그인에 2번 끊김(마지막 16:47)', tk: { on: true, why: null, hour: 0, max: 3, today: 0, okN: 0, kicks: 2, lastKick: { at: 1, why: '「이미 로그인된」 화면' }, last: null, btns: ['기존 로그인 해제 후 로그인', '취소'], seen: null } };
  (async () => { await stPut('HOME', Y); const w = writes[0];
    ok(w && w.o && Array.isArray(w.o.mergeFields) && w.o.mergeFields.includes('st') && !w.o.merge, '다리는 st를 통째로 바꿈(mergeFields — 옛 st.y24·st.al·st.have가 남지 않게)', w && w.o);
    ok(w && w.v.st.y24 && w.v.st.y24.login === 'ok' && w.v.st.y24.tk && w.v.st.y24.tk.kicks === 2 && w.v.st.y24.tk.btns.length === 2 && w.v.st.ver === '0.1.36', 'st.y24 = 번외가 지금 보낸 예스24 상태(로그인·이어받기 기록 · 판)', w && w.v.st);
    ok(w && !/rn-cred|password|token|"key"/i.test(JSON.stringify(w.v)), '키·계정 칸 없음');
    clock += 6 * 60e3; ST.kind = 'logger'; await stPut('LOGGER', { logger: true }); ok(writes.length === 1, '로거 번외는 이 다리가 쓰지 않음(예전 그대로)');
    Date.now = realNow; part2(); })().catch((e) => { ok(false, '다리 시험 오류', e.message); part2(); }); }

function part2() {
  ok(/hbPut\(pc, hbOf\(y\)\)/.test(CS) && /tk: tkOf\(y\.tk\)/.test(CS) && /stPut\(pc, y\)\.catch/.test(CS), '💓(y24hb)에 이어받기 기록 요약(tk — 끊긴 수·해 본 수·단추 글) · 다리에 y를 넘김');
  console.log('③ 수집기 기록 창·화면 요소');
  { const jw = cut(CS, "    const rnjA = (v) =>", "    let tab = 'today'; const fmtRow = rowOne;"); const row = new Function('window', jw + '\nreturn rowOne;')({});
    const h = row({ l: 'warn', t: Date.parse('2026-11-12T08:30:00Z'), m: '예스24', x: '<b>a</b> & "b"' }); const tags = (h.match(/<[a-z]/g) || []).length;
    ok(tags === 1 && /^<div class="warn" data-t="[^"]+" data-m="예스24">&lt;b>a&lt;\/b> &amp; "b"<\/div>$/.test(h), '기록 한 줄 = 요소 하나(시각·칸 이름은 data 칸 · 글은 그대로 가림)', h);
    ok(/#rn-jw \[data-t\]::before\{content:attr\(data-t\)/.test(CS), '시각·칸 이름은 CSS ::before로 그림(요소 아님)');
    const draw = cut(CS, '    const draw = () => {', '      { const ca = w.querySelector'); ok(/childElementCount - JW_MAX/.test(draw) && /slice\(-JW_MAX\)/.test(draw) && /const JW_MAX = 400;/.test(CS) && !/childElementCount - 800/.test(CS), "오늘 기록 화면 줄 상한 400(덧붙일 때·다시 그릴 때 둘 다)");
    ok(/let tab = 'today'; const fmtRow = rowOne;/.test(CS) && /const rowH = rowOne;/.test(CS), '전체 기록·🛰 감시·🖥 다른 PC 줄도 같은 한 요소 줄');
    ok(/P\.domBy = \(\) =>/.test(CS) && /domBy: P\.domBy\(\)/.test(CS) && /기록 창 \$\{x\.domBy\.jw/.test(CS) && /알라딘 화면 \$\{x\.domBy\.page/.test(CS), '5분 성능 줄: 화면 요소를 기록 창·줄 수·우리 칸·표 표시·틀·알라딘 화면으로 나눠 셈');
    ok(/if \(logLines\.length > 60\) logLines\.length = 60;/.test(CS) && /상품 패널 기록 \$\{x\.domBy\.plog\}/.test(CS), '상품 패널 기록 줄 60까지(새 판 뒤 진단에서 늘던 곳) · 성능 줄에 우리 칸별 수');
    ok(/its\.length - 20/.test(cut(CS, 'window.__rnNote = (msg, kind) =>', 'const noteFold')), '알림 띠는 최근 20개까지'); }
  { let head0 = ''; try { head0 = cp.execSync('git -C ' + JSON.stringify(path.resolve(__dirname, '..', '..')) + ' show origin/main:src/readnow-collector.src.js', { maxBuffer: 64e6 }).toString(); } catch (e) {}
    const hd = (s) => s.split('\n').filter((l) => /^\/\/ @(match|grant|connect|require|include|noframes|run-at)/.test(l)).join('\n').replace(/\?v=[\d.]+/g, '');
    ok(!head0 || hd(head0) === hd(CS), '수집기 머리 그대로'); }
  part3(); }

function part3() {
  console.log('④ ☁ 클라우드 대신 자동 내림 — 밀린 일·쉴 때 글');
  const a = CT.indexOf('/* ══ (11/11 omni2 · 통합 솔루션) 🤖 자동 내림 — 웹앱 열린 PC가'), b = CT.indexOf('async function stratTick(force) {'); ok(a > 0 && b > a, '클라우드 덩어리 찾음');
  const D = new Map(); const cpj = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const put = (cur, v) => { for (const [k, x] of Object.entries(v)) { if (x && x.__fv === 'ts') cur[k] = new Date().toISOString(); else if (x && x.__fv === 'au') cur[k] = [...(Array.isArray(cur[k]) ? cur[k] : []), ...x.v]; else if (x && typeof x === 'object' && !Array.isArray(x) && cur[k] && typeof cur[k] === 'object' && !Array.isArray(cur[k])) put(cur[k], x); else cur[k] = cpj(x); } return cur; };
  let auto = 0; const ref = (c, id) => ({ id, get: async () => { const d = D.get(c + '/' + id); return { exists: !!d, id, data: () => cpj(d), ref: ref(c, id) }; }, set: async (v, o) => { const cur = D.get(c + '/' + id); D.set(c + '/' + id, put(o && o.merge && cur ? cur : {}, v)); } });
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + ++auto), where: (f, op, v) => ({ get: async () => { const docs = [...D.entries()].filter(([k]) => k.split('/')[0] === c).map(([k, d]) => ({ id: k.split('/')[1], data: () => cpj(d), ref: ref(c, k.split('/')[1]) })).filter((d) => { const x = d.data()[f]; return op === '>=' ? String(x || '') >= v : x === v; }); return { docs, forEach: (fn) => docs.forEach(fn) }; } }) });
  const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }) }; const FV = { serverTimestamp: () => ({ __fv: 'ts' }), arrayUnion: (...v) => ({ __fv: 'au', v }) };
  const G = new Function('C', 'db', 'FV', 'nowIso', 'VER', 'log', CT.slice(a, b) + '\nreturn { omniCloudTick, OMNI_C };')(C, db, FV, () => new Date().toISOString(), 'test', () => {});
  const T0 = Date.now(); const iso = (m) => new Date(T0 + m * 60e3).toISOString(); const set = (k, v) => D.set(k, cpj(v)); const cmds = () => [...D.entries()].filter(([k]) => k.startsWith('shp_cmds/')).map(([, v]) => v);
  set('app_settings/sku_seq', { mapN: 0 }); set('app_settings/sku_map_0', { m: { aladin_A: { c: ['ab12c'] }, aladin_B: { c: ['cd34e'] } } });
  for (const id of ['aladin_A', 'aladin_B']) set('prd_listings/' + id, { status: '판매중', active: true, qty: 1, listingId: id.slice(-1), title: '시험 책 ' + id.slice(-1) });
  set('crm_y24_orders/Y1', { orderNo: 'Y1', lastSeenAt: iso(-1), orderedAt: iso(-300), items: [{ self: 'PNKab12cEX', qty: 1 }] }); /* 켜기 전(밀린 일) */
  set('crm_y24_orders/Y9', { orderNo: 'Y9', lastSeenAt: iso(-1), orderedAt: iso(-20 * 1440), items: [{ self: 'PNKcd34eEX', qty: 1 }] }); /* 14일 밖 */
  (async () => {
    set('app_settings/platforms', { omni: { autoDown: { on: 1, from: iso(-60) }, backlog: { at: iso(-30), go: iso(30), stop: 0, n: 1 } } }); set('app_settings/omni_auto', { hb: { 'MJ-MAIN': { at: iso(-30), y24: 0 } } });
    const r0 = await G.omniCloudTick(); ok(r0 && !(r0.n > 0) && !cmds().length, '밀린 일 미리보기 중(1시간 전)이면 켜기 전 주문은 안 건드림(예전 그대로)', r0);
    set('app_settings/platforms', { omni: { autoDown: { on: 1, from: iso(-60) }, backlog: { at: iso(-90), go: iso(-30), stop: 1, n: 1 } } }); G.OMNI_C.at = 0;
    const r1 = await G.omniCloudTick(); ok(r1 && !(r1.n > 0) && !cmds().length, '⏸ 밀린 일을 멈춰 두면 클라우드도 안 함', r1);
    set('app_settings/platforms', { omni: { autoDown: { on: 1, from: iso(-60) }, backlog: { at: iso(-90), go: iso(-30), stop: 0, n: 1 } } }); G.OMNI_C.at = 0;
    const r2 = await G.omniCloudTick(); const L = cmds(); const cx = Object.values((D.get('app_settings/omni_auto') || {}).c || {});
    ok(r2 && r2.n === 1 && L.length === 1 && L[0].listingKey === 'aladin_A' && cx.length === 1 && cx[0].bl === 1 && cx[0].st === 'sent', 'PC 없음 + 밀린 일 시작됨 → 켜기 전 예스24 주문의 한 권짜리 알라딘 판매중지 1건(bl 표시) · 14일 밖은 안 함', { r2, L: L.map((c) => c.listingKey), cx });
    set('app_settings/omni_auto', { ...D.get('app_settings/omni_auto'), hb: { 'MJ-MAIN': { at: iso(-1), y24: 0 } } }); G.OMNI_C.at = 0; const r3 = await G.omniCloudTick(); const n3 = (D.get('app_settings/omni_auto') || {}).cloud || {};
    ok(r3 && r3.idle === 'pc' && r3.y24 === null && /PC가 돎\(MJ-MAIN\)/.test(n3.idle) && /예스24 쪽 맡은 PC 없음/.test(n3.idle), '쉴 때 글: 어느 PC가 도는지 · 예스24 쪽을 맡은 PC가 없음까지(verify3 모양)', n3);
    set('app_settings/omni_auto', { ...D.get('app_settings/omni_auto'), hb: { 'MJ-MAIN': { at: iso(-1), y24: 0, y24r: 1 } } }); G.OMNI_C.at = 0; G.OMNI_C.last = ''; const r4 = await G.omniCloudTick(); const n4 = (D.get('app_settings/omni_auto') || {}).cloud || {};
    ok(r4 && r4.idle === 'pc' && r4.y24 === 'MJ-MAIN' && /MJ-MAIN 원격 길/.test(n4.idle), '원격 길로 맡는 PC가 있으면 그렇게 적음', n4);
    ok(!/\b(alert|confirm|prompt)\s*\(/.test(CT.slice(a, b)) && !/buyer|rcv|phone|addr/.test(CT.slice(a, b)), '클라우드 덩어리 — 브라우저 창·손님 정보 칸 없음');
    part4(); })().catch((e) => { ok(false, '클라우드 시험 오류', e.message); part4(); }); }

function part4() {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tFIX3_1112 ${bad}개 실패` : '✓ tFIX3_1112 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
  console.log('⑤ 화면 — 번외 없는 MJ-MAIN이 원격 길로 예스24 쪽을 맡음');
  require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const put = []; await p.route(/127\.0\.0\.1:8797\//, (rt) => { put.push(rt.request().url()); rt.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }); });
    await p.evaluate(() => { window.__T0 = Date.now(); localStorage.setItem('rn-device', 'MJ-MAIN'); localStorage.removeItem('rn-c2seen');
      window.ledNow = () => { const id = 'aladin_U215983414'; const l = S.plist.get(id); const al = [{ id, title: l.title, price: l.price, qty: 1, live: false, st: '판매완료', skus: ['SK14'] }];
        const ord = [{ ch: 'aladin', no: 'n1', at: new Date(window.__T0 - 60e3).toISOString(), amt: 5000, lines: [{ lid: id, qty: 1 }] }];
        return ledBuild({ al, y24: [{ no: '777', title: '예스24 줄', price: 6000, stock: 1, live: true, self: 'SK14', flags: [] }], ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
      S.y24.loaded = true; S.y24o.loaded = true; });
    const cmd = () => p.evaluate(async () => { const g = await db.collection('col2_y24_cmd').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; L.push({ id: d.id, st: v.st, holder: v.holder, by: v.by, rows: ((v.job || {}).rows || []).map((r) => ({ no: r.no, self: r.self, kind: r.kind, src: r.src })) }); }); return L; });
    /* 다른 번외 PC(JS-MAIN)가 3분 전에 돎 → MJ-MAIN은 예스24 쪽을 맡지 않음 */
    await p.evaluate(async () => { await db.collection('app_settings').doc('omni_auto').set({ hb: { 'JS-MAIN': { at: new Date(Date.now() - 3 * 60e3).toISOString(), y24: 1 } } }, { merge: true });
      await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); await omniLoad(true); S.omni.at = 0; S._omniHbAt = 0; await omniTick(); });
    await p.waitForTimeout(500); const A = await cmd(); const LA = await p.evaluate(async () => { await omniLoad(true); return { log: Object.values(S.omni.log || {}).map((e) => e.ch), hb: S.omni.hb['MJ-MAIN'] || null, why: S._omniWhy }; });
    ok(!A.length && !LA.log.includes('yes24') && LA.hb && LA.hb.y24 === 0 && LA.hb.y24r === 0 && /^1\.\d+\.\d+$/.test(LA.hb.ver || ''), '다른 번외 PC 맥박이 3분 전 → MJ-MAIN은 예스24 쪽을 맡지 않음(겹치지 않게) · 맥박 y24r 0 · 판', { A, LA });
    /* 번외 PC 맥박이 40분 전(verify3 모양) → 원격 길 */
    await p.evaluate(async () => { await db.collection('app_settings').doc('omni_auto').set({ hb: { 'JS-MAIN': { at: new Date(Date.now() - 40 * 60e3).toISOString(), y24: 1 } } }, { merge: true }); await omniLoad(true); S.omni.at = 0; await omniTick(); await new Promise((r) => setTimeout(r, 300)); S.omni.at = 0; S._omniHbAt = 0; await omniTick(); });
    await p.waitForTimeout(600); const B = await cmd(); const LB = await p.evaluate(async () => { await omniLoad(true); const e = Object.values(S.omni.log || {}).find((x) => x.ch === 'yes24'); return { e, hb: S.omni.hb['MJ-MAIN'] || null }; });
    const r0 = B[0] && B[0].rows[0];
    ok(B.length === 1 && ['hold', 'new'].includes(B[0].st) && B[0].holder === 'HOME' && r0 && r0.no === '777' && r0.self === 'SK14' && r0.kind === 'stop' && r0.src === 'auto' && !put.length, '번외 PC 맥박 40분 없음 → MJ-MAIN이 알라딘 주문의 예스24 777 판매중지를 원격 길(col2_y24_cmd · 맡은 PC HOME · 못 받으면 맡긴 일 줄)로 맡김 · 이 PC 번외(127.0.0.1)엔 안 감', { B, put });
    ok(LB.e && LB.e.st === 'sent' && LB.hb && LB.hb.y24r === 1 && /예스24 길 원격/.test(LB.hb.sum || ''), '기록 omni_auto.c 예스24 맡김(sent) · 맥박 y24r 1 · 요약 한 줄', LB);
    await p.evaluate(async () => { S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(400); ok((await cmd()).length === 1, '다시 돌아도 되풀이 0(같은 열쇠)');
    await p.evaluate(async () => { localStorage.setItem('rn-device', 'LOGGER'); S.omni.at = 0; S._led = null; await omniTick(); }); ok((await cmd()).length === 1, '로거 PC는 돌지 않음(약속 0)');
    ok(!dlg.length, '브라우저 창 없음', dlg);
    console.log(bad ? `❌ tFIX3_1112 ${bad}개 실패` : '✓ tFIX3_1112 모두 통과'); });
}
