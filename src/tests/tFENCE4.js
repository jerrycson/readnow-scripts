// tFENCE4 — 11/10 일꾼 fence4 · 정범님 11/09 밤 '감시 그룹 자동 반영과 추격자는 손해를 감수할 수밖에 없는 기능 — 내가 결정해서 할 일인데 기능을 왜 꺼?'
//  ① 🛰 감시 그룹 자동 반영·🎯 추격자(정범님 운영 기능)는 연구 울타리(🔒 잠금 90일·14일 · 사람 손댐 목록 · 무손해 모드 · 하루 손해 한도)로 막지 않음 — 원장엔 얼마 내렸는지 기록만
//  ② 값·상태를 바꾸는 연구·엔진(⚡ 전략 실행 · 전체 비율 실험)은 · (eng3 11/10) 🔬 조회수 실험 새로 붙이기는 값·비용을 안 건드려 잠긴 상품도 함 · '정범님이 손대 진행 중인 상품'(켜진 감시 그룹·추격자 그룹) · 등록 3개월 안 · 고친 지 14일 안을 안 건드림
//  ③ 💸 비용 드는 연구 허락: app_settings/research_cost_ok(웹앱 두 번 누르기로만 · 기본 없음)이 없으면 값 내리기·판매 상태 바꾸기를 막고 '정범님 허락 필요'로 기록 · 한도 = 허락 한도와 하루 손해 한도 중 작은 값
//  ④ 지금 손해 관련 설정(무손해 기본 켜짐 · 하루 손해 한도 10,000원 셈)은 그대로
// 시험 자료에 손님 정보 없음(상품 번호·꾸민 값만)
// 실행: node tFENCE4.js (가격 감시기 모의 실행은 jsdom이 있을 때 — 빌드 사본 pw 폴더)
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const MODE = process.argv[2] || null; /* 'pw0'·'pw1'·'pw2' = 가격 감시기 모의 실행 한 판(자식 과정) */
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const D = 864e5; const NOW = Date.now(); const iso = (ms) => new Date(ms).toISOString(); const kdt = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16);
if (MODE) return pwRun(MODE);

let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); if (!c) bad++; };
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js', 'repo/cloud/index.js']), 'utf8');
const MLP = find(['../readnow-ml-core.js', '../../readnow-ml-core.js', 'repo/readnow-ml-core.js']); const ML = require(MLP); const MLSRC = fs.readFileSync(MLP, 'utf8');
const MLC = find(['../cloud/readnow-ml-core.js', '../../cloud/readnow-ml-core.js']); const PWP = find(['readnow-price-watch.user.js', '../readnow-price-watch.user.js', '../../readnow-price-watch.user.js']); const PW = fs.readFileSync(PWP, 'utf8');
const AS = require(find(['../readnow-autosched-core.js', '../../readnow-autosched-core.js', 'repo/readnow-autosched-core.js'])).AS;
const COLP = find(['../readnow-collector.user.js', '../readnow-collector.src.js', '../../src/readnow-collector.src.js']); const COL = COLP ? fs.readFileSync(COLP, 'utf8') : '';
const APPP = find(['../app.html', '../../src/app.html', '../../app.html']); const APP = APPP ? fs.readFileSync(APPP, 'utf8') : '';

(async () => {
  console.log('⓪ 셈 사본 · 지금 설정 그대로');
  { const cut = (s) => { const a = s.indexOf('/* FENCE-PURE-START'), b = s.indexOf('/* FENCE-PURE-END */'); return a > 0 && b > a ? s.slice(a, b) : null; }; ok(cut(MLSRC) && cut(MLSRC) === cut(PW) && (!MLC || cut(fs.readFileSync(MLC, 'utf8')) === cut(MLSRC)), '학습 공용·클라우드 사본·가격 감시기의 셈(FENCE-PURE)이 글자 그대로 같음(새 fenceCostOk·ops 잠금 포함)');
    ok(ML.fenceNoLoss(null) === true && ML.fenceNoLoss({}) === true && ML.FENCE.min === 5000 && ML.FENCE.max === 30000 && ML.FENCE.newDays === 90 && ML.FENCE.humanDays === 14, '무손해 기본 켜짐 · 바닥 5,000·위 30,000·90일·14일 그대로');
    ok(/if \(EF0\.noLossMode === undefined\)/.test(SRC) && !/noLossMode: false/.test(SRC), '클라우드는 무손해 설정을 끄지 않음(없을 때 켜짐만 적음)');
    const L = { done: 0, x: { a: { s: 10000, p: 9000, a: 1000, r: null } } }; const t = ML.fenceTry(L, { key: 'b', from: 10000, to: 1000, id: 'r' }, { ok: true, limit: 10000 }); ok(t.ok && t.need === 10000, '하루 손해 한도 10,000원 셈 그대로(1,000 + 9,000 = 10,000 → 됨)', t); }

  console.log('① 🔒 잠금 — 진행 중(감시·추격자) 상품을 연구가 안 건드림');
  { const K = ML.fenceLock; const old = { registeredAt: kdt(NOW - 300 * D) };
    const a = K(old, { nowMs: NOW, ops: { why: "🛰 감시 그룹 '감시1' · 🎯 추격자" } }); ok(a && a.kind === 'ops' && /정범님이 손대 진행 중인 상품/.test(a.why) && /감시1/.test(a.why) && /연구·엔진은 안 건드림/.test(a.why), `오래된 상품이라도 감시 그룹에 들면 🔒 '${a && a.why}'`, a);
    ok(K(old, { nowMs: NOW }) === null && K(old, { nowMs: NOW, ops: null }) === null, '진행 중이 아니면 잠그지 않음(예전 그대로)');
    ok(K({ registeredAt: kdt(NOW - 30 * D) }, { nowMs: NOW }).kind === 'new' && K({ ...old, editBy: 'a@b.c', editAt: iso(NOW - 3 * D) }, { nowMs: NOW }).kind === 'human', '② 등록 3개월 안 · ③ 고친 지 14일 안 잠금은 그대로 있음');
    const g = ML.stratGuard({ act: 'price', to: 9500, k: 'drip', M: { ok: true, ageH: 1 } }, { l: { status: '판매중', qty: 1, listingId: 'L1', price: 10000, registeredAt: '2026-01-01', sku: 'ABCDEF' }, st: {}, now: NOW, lock: a }, {}); ok(!g.ok && g.no.some((x) => /^🔒 정범님이 손대 진행 중/.test(x)), '⚡ 안전 검사가 진행 중 상품을 막음', g.no);
    const st = SRC.slice(SRC.indexOf('async function stratTick('), SRC.indexOf('async function stratPreCheck(')); ok(/const opsG = dec && dec\.watch && dec\.watch\.gid && watchG\.has\(String\(dec\.watch\.gid\)\)/.test(st) && /ops: opsG \? \{ why:/.test(st), '클라우드 ⚡ 전략: 켜진 감시 그룹 상품은 🔒(진행 중)로 넘김');
    const ex = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인')); ok(/const LK = fenceLock\(LSx, \{ key: x\.key, excl: null, dec: apF\.decision === 'approve' \? \{ \.\.\.x, approval: null \} : x, nowMs: Date\.now\(\), gid: null, ops: opsG \?/.test(ex), '감시기 전체 비율 실험(연구): 켜진 감시 그룹 상품은 🔒(진행 중)');
    ok(/const OPS = wg \? \{ why:/.test(PW) && /ops: OPS \}\);/.test(PW), '감시기 판정: 감시 그룹 상품은 연구 잠금(전체 비율 실험 제안 안 올림)'); }
  { const groups = [{ id: 'g', auto: true, on: true, lids: ['100', '200', '300', '400', '500'] }]; const old = kdt(NOW - 200 * D);
    const L = new Map([['100', { reg: old, ops: true }], ['200', { reg: old }], ['300', { reg: old, hu: iso(NOW - 3 * D) }], ['400', { reg: old, hu: iso(NOW - 20 * D) }], ['500', { reg: kdt(NOW - 10 * D) }]]);
    const R = AS.pxPlan({ now: NOW, cfg: { cap: 10, recap: 10 }, groups, listings: L, exp: new Map(), busy: new Set(), rnd: () => 0.5 }); const ids = (R.docs || []).map((x) => (x.data.listingIds || []).join(',')).join(',');
    ok(['100', '200', '300', '400', '500'].every((k) => ids.includes(k)) && R.opsLock === 0 && R.newLock === 0 && R.lockIn && R.lockIn.ops === 2 && R.lockIn.new === 1 && R.lastPlan.lockIn.ops === 2, `🔬 조회수 실험 새로 붙이기(값·비용 안 건드림 — eng3 정범님 11/09 밤 바로잡음): 진행 중·고친 지 14일 안·등록 3개월 안도 넣음 · 몇 개인지 세어 기록만(붙임 ${ids} · 진행 중/고침 ${R.lockIn && R.lockIn.ops} · 새 상품 ${R.lockIn && R.lockIn.new})`, { ids, R: [R.opsLock, R.newLock, R.lockIn] });
    const R2 = AS.pxPlan({ now: NOW, cfg: { cap: 10, recap: 10 }, groups, listings: L, exp: new Map([['100', { on: true, addedAt: '2026-10-01' }]]), busy: new Set(), rnd: () => 0.5 }); ok(R2.plan[0] && R2.plan[0].chk === 1, '이미 붙은 것의 확인·떼기는 그대로(진행 중이어도)', R2.plan);
    const px = SRC.slice(SRC.indexOf('async function pxOpsSet('), SRC.indexOf('async function pxDailyTick(') + 6000); ok(/where\('watch\.gid', 'in', ids\.slice\(i, i \+ 10\)\)/.test(px) && !/if \(!OPS\) \{/.test(px) && /const OPS = \(await pxOpsSet\(\)\) \|\| new Set\(\);/.test(px) && /ops: OPS\.has\(String\(x\.listingId\)\)/.test(px) && /hu: \/@\/\.test\(String\(x\.editBy/.test(px), '클라우드 조회수 계획: 켜진 감시 그룹 상품·사람이 고친 때를 넘김(세기만) · 못 읽어도 계획은 그대로(값·비용 안 건드림)');
    ok(!COL || (/ops: OPS\.has\(String\(l\.listingId\)\)/.test(COL) && /hu: \/@\/\.test\(String\(l\.editBy/.test(COL) && !/상품을 못 읽어 오늘 계획은 쉼\(안전 쪽\) — ' \+ e\.message, 1\); return false; \}/.test(COL)), 'PC 수집기 조회수 계획도 같은 재료 · 못 읽어도 계획은 그대로'); }

  console.log('② 🛰 감시 자동 반영·🎯 추격자 — 연구 울타리 없이 그룹 설정대로');
  { ok(!/if \(!keepW && chg && LOCK && wg\.watch\.apply === 'auto'\)/.test(PW) && /if \(wg\.watch\.apply !== 'auto'\) why\.push\('관리자 승인 그룹'\);/.test(PW), '판정: 🔒 연구 잠금으로 자동 반영을 판정만으로 바꾸지 않음 · 승인 그룹 까닭 글에 🔒 안 붙임');
    const ex = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인')); const iO = ex.indexOf('if (fOps) {'), iR = ex.indexOf("else if (fSrc) { const EX = await engExcl(true);"), iA = ex.indexOf('P.scmAction.price(x.listingId, price)');
    ok(iO > 0 && iR > iO && iA > iR && /const fOps = !!fSrc && fSrc !== 'ro';/.test(ex), '반영: 감시 자동 반영(pw:)은 기록 길 · 전체 비율 실험(ro)만 연구 울타리 길(차례)');
    const ops = ex.slice(iO, iR); ok(/fenceRun\('rec'/.test(ops) && !/back\(|continue;/.test(ops) && !/engExcl|fenceLock|fenceNoLoss|fenceCostOk/.test(ops), '감시 자동 반영 길엔 막는 것(사람 손댐 목록·🔒·무손해·허락·한도)이 없음 · 원장 기록이 실패해도 막지 않음');
    ok(/if \(mode === 'rec'\) \{ const r0 = fenceTry\(L, q, \{ ok: true, limit: Number\.MAX_SAFE_INTEGER \}, nowI\); out = \{ ok: true, rec: true, e: r0 && r0\.e \? \{ \.\.\.r0\.e, ops: true \} : null \};/.test(PW), "원장 'rec': 한도 없이 얼마 내렸는지만 적음(ops 표시)"); }

  console.log('③ 💸 비용 드는 연구 허락');
  { const H = ML.fenceCostOk; const base = { on: true, by: 'a@b.c', at: iso(NOW - 3600e3), until: iso(NOW + 2 * D), what: ['strat'], limit: 3000, via: 'twice' };
    const cases = [[null, 'strat', false, /허락 기록이 없음/], [{ ...base, on: false }, 'strat', false, /허락 기록이 없음/], [{ ...base, by: 'cloud' }, 'strat', false, /로그인 메일이 아님/], [{ ...base, via: 'api' }, 'strat', false, /두 번 누르기로 만든 허락이 아님/], [{ ...base, until: iso(NOW - 1000) }, 'strat', false, /기한.*지남/], [{ ...base, until: '' }, 'strat', false, /끝나는 날을 모름/], [base, 'ro', false, /허락 대상이 아님/], [{ ...base, limit: 0 }, 'strat', false, /한도가 없음/], [{ ...base, at: iso(NOW + 3600e3) }, 'strat', false, /때를 모름/], [base, 'strat', true, null], [{ ...base, what: ['strat', 'ro'] }, 'ro', true, null]];
    for (const [r, w, want, re] of cases) { const o = H(r, { what: w, nowMs: NOW }); ok(o.ok === want && (want ? o.limit === r.limit : /^💸 정범님 허락 필요 — /.test(o.why) && re.test(o.why)), `${want ? '됨' : '막음'}: ${want ? `${w} · 하루 ${o.limit}원` : o.why}`, o); }
    ok(H({ ...base, until: new Date(NOW + 9 * 3600e3).toISOString().slice(0, 10) }, { what: 'strat', nowMs: NOW }).ok === true && H({ ...base, until: new Date(NOW - D + 9 * 3600e3).toISOString().slice(0, 10) }, { what: 'strat', nowMs: NOW }).ok === false, '날짜만 적은 끝나는 날 = 그날 밤 11:59(한국)까지'); }
  { const st = SRC.slice(SRC.indexOf('async function stratTick('), SRC.indexOf('async function stratPreCheck(')); const iN = st.indexOf('if (NOLOSS) {'), iC = st.indexOf("ML.fenceCostOk(COSTREC, { what: 'strat' })"), iT = st.indexOf("fenceTxCloud(ML, 'try'"), iCmd = st.indexOf("await ref.set({ type: 'prdEdit'");
    ok(iN > 0 && iC > iN && iT > iC && iCmd > iT && /const costly = x\.d\.act !== 'price' \|\| \+x\.d\.to < \+l\.price;/.test(st) && /act: 'costNeed'/.test(st) && /cap: CO\.limit \|\| null/.test(st) && /doc\('research_cost_need'\)/.test(st), '⚡ 전략: 무손해 → 💸 허락(값 내리기·판매 상태) → 하루 손해 원장(허락 한도) → 샵매니저 수정 맡김(차례) · 막으면 기록(costNeed)');
    ok(/doc\('research_cost_ok'\)/.test(st) && /catch \(e\) \{ NOLOSS = true; COSTREC = null; \}/.test(st), '⚡ 전략: 허락 문서를 못 읽으면 허락 없음(안전 쪽)');
    const pc = SRC.slice(SRC.indexOf('async function stratPreCheck('), SRC.indexOf('async function stratPreCheck(') + 2500); ok(/ML0\.fenceCostOk \? ML0\.fenceCostOk\(co, \{ what: 'strat' \}\)/.test(pc) && /if \(!CO\.ok\) return CO\.why;/.test(pc), '⚡ 전략: 실행 직전 다시 확인에서도 허락을 다시 봄(거뒀거나 기한 지나면 취소)');
    const ex = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인')); const iR = ex.indexOf("if (fSrc === 'ro' && fenceNoLoss(await engFence(true)))"), iK = ex.indexOf("fenceCostOk(await costOkRec(), { what: 'ro' })"), iT2 = ex.indexOf("fenceRun('try'");
    ok(iR > 0 && iK > iR && iT2 > iK && /cap: CO\.limit \}\);/.test(ex) && /fenceRun\('no', \{/.test(ex), '감시기 전체 비율 실험: 무손해 → 🔒 → 💸 허락 → 원장(허락 한도)(차례) · 막으면 원장 no·결정 문서에 기록');
    ok(/async function costOkRec\(\) \{ try \{ const d = await C\('app_settings'\)\.doc\('research_cost_ok'\)\.get\(\); return d\.exists \? d\.data\(\) \|\| null : null; \} catch \(e\) \{ return null; \} \}/.test(PW), '감시기: 허락은 늘 새로 읽음 · 못 읽으면 없음'); }
  { /* 원장 cap — 가짜 Firestore로 클라우드 fenceTxCloud를 실제로 돌림 */
    const store = new Map(); const cl = (x) => (x == null ? x : JSON.parse(JSON.stringify(x))); const ref = (p) => ({ p, get: async () => ({ exists: store.has(p), data: () => cl(store.get(p)) }) });
    const db = { runTransaction: async (fn) => { const ops = []; const tx = { get: (r) => r.get(), set: (r, v, o) => ops.push(() => store.set(r.p, o && o.merge ? { ...(store.get(r.p) || {}), ...cl(v), ...(v.x && store.get(r.p) && store.get(r.p).x ? { x: { ...store.get(r.p).x, ...cl(v.x) } } : {}) } : cl(v))) }; const out = await fn(tx); ops.forEach((f) => f()); return out; } };
    const C = (n) => ({ doc: (id) => ref(n + '/' + id) }); const cA = SRC.indexOf('/* FENCE2-START'), cB = SRC.indexOf('/* FENCE2-END */');
    const CL = new Function('db', 'C', 'FV', 'W', SRC.slice(cA, cB) + '\nreturn { fenceTxCloud };')(db, C, { delete: () => null }, () => ({}));
    store.set('app_settings/eng_fence_now', { at: iso(Date.now() - 3600e3), dayLoss: 10000 });
    const a = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_S1', from: 10000, to: 6000, src: 'st:a1', by: 'strategy', id: 'c1', cmd: 'c1', cap: 3000 }); ok(a && !a.ok && /한도 3,000원/.test(a.why), `허락 한도 3,000원 < 하루 한도 10,000원 → 4,000원 내림은 막음 · '${a && a.why}'`, a);
    const b = await CL.fenceTxCloud(ML, 'try', { key: 'aladin_S2', from: 10000, to: 8000, src: 'st:a1', by: 'strategy', id: 'c2', cmd: 'c2', cap: 3000 }); ok(b && b.ok && b.limit === 3000, '2,000원 내림은 됨(한도 3,000원 안)', b);
    const L = store.get('eng_fence_ledger/' + new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)) || {}; ok(L.limit === 10000, '원장의 하루 한도 칸은 예전 값(10,000) 그대로 — 허락 한도는 그 회차 셈에만', L.limit); }

  console.log('④ 웹앱');
  ok(/function costOkCard\(\)/.test(APP) && /sxArm\('data-costok', '1', `💸 허락: \$\{whatL\} · 하루 \$\{num\(lim\)\}원 · \$\{until\}까지`\)/.test(APP) && /via: 'twice'/.test(APP) && /\+ top \+ costC \+ tabs \+ body/.test(APP), "⚡ 전략 화면 맨 위 '💸 비용 드는 연구 허락' — 두 번 누르기 단추 글에 대상·하루 한도·끝나는 날");
  ok(/sxArm\('data-costoff', '1', '허락 거두기', 'warn'\)/.test(APP) && /hist: firebase\.firestore\.FieldValue\.arrayUnion/.test(APP), '거두기도 두 번 누르기 · 허락·거두기 이력은 지우지 않고 덧붙임');
  { const cardFn = APP.slice(APP.indexOf('function costOkCard()'), APP.indexOf('function costOkCard()') + 4000); ok(!/\b(alert|confirm|prompt)\(/.test(cardFn) && !/\b(alert|confirm|prompt)\(/.test(APP.slice(APP.indexOf("const ok = sh.querySelector('[data-costok]')"), APP.indexOf("const ok = sh.querySelector('[data-costok]')") + 2500)), '브라우저 팝업(alert·confirm·prompt) 없음'); }
  ok(/🔒 등록 3개월 안 — 연구·엔진이 값·비용을 건드리지 않음\(관찰·값 안 바꾸는 시험은 함\)/.test(APP) && /🛰 감시 그룹 자동 반영·🎯 추격자·직접 가격·수동 일괄·상품 수정은 정범님 설정대로 그대로 됨/.test(APP) && !/'🔒 등록 3개월 안 — 엔진 안 건드림'/.test(APP), "상품 카드: '연구·엔진이 값·비용을 건드리지 않음(관찰·값 안 바꾸는 시험은 함)'으로 분명히(eng3)");
  ok(/🛰 감시 자동 반영·🎯 추격자는 정범님 그룹 설정대로\(연구 울타리 없음/.test(APP) && /\$\{costOkTxt\(F\.co\)\}/.test(APP), '울타리 줄: 감시·추격자는 그룹 설정대로 · 허락 상태 한 줄');

  console.log('⑤ 가격 감시기 모의 실행(jsdom · 가짜 Firestore · 알라딘 흉내)');
  let jsdomOk = true; try { require.resolve('jsdom'); } catch (e) { jsdomOk = false; }
  if (!jsdomOk) console.log('  (jsdom이 없어 건너뜀 — 빌드 사본 pw 폴더에서 돌리면 함)');
  else for (const m of ['pw0', 'pw1', 'pw2']) { let out = ''; try { out = cp.execFileSync(process.execPath, [__filename, m], { encoding: 'utf8', timeout: 150000, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { out = String((e.stdout || '') + (e.stderr || '')); }
    const J = (() => { const l = out.split('\n').find((x) => x.startsWith('RESULT ')); try { return l ? JSON.parse(l.slice(7)) : null; } catch (e) { return null; } })(); if (!J) { ok(false, m + ' 모의 실행 결과 없음', out.slice(-600)); continue; }
    const st = (k) => J.dec[k] || {}; const sentP = J.sent;
    if (m === 'pw0') { /* 무손해 기본 · 허락 없음 · 원장 한도는 이미 다 씀 */
      ok(st('W1').approvalState === 'done' && sentP.includes(8000), `🛰 자동 반영: 등록 30일·사람이 어제 고침·사람 손댐 목록에 듦·무손해 모드·하루 한도 다 씀이어도 정범님 그룹 설정대로 8,000원 반영 (${st('W1').approvalState} · ${st('W1').execNote || ''})`, st('W1'));
      ok(J.led && J.led.x && J.led.x.aladin_W1 && J.led.x.aladin_W1.ops === true && J.led.x.aladin_W1.p === 8000 && J.led.x.aladin_W1.s === 10000 && !J.led.x.aladin_W1.r, '원장에 얼마 내렸는지 기록(시작 10,000 → 8,000 · ops 표시 · 예약 정리됨)', J.led && J.led.x);
      ok(st('R1').approvalState === 'blocked' && /무손해 모드/.test(st('R1').execNote || '') && !sentP.includes(9000), `전체 비율 실험(연구)은 무손해 모드면 안 바꿈: '${(st('R1').execNote || '').slice(0, 60)}'`, st('R1'));
      ok(st('M1').approvalState === 'done' && sentP.includes(7500), '정범님 수동 일괄(사람 값)은 그대로 반영', st('M1')); }
    if (m === 'pw1') { /* 무손해 꺼짐(정범님이 끈 경우) · 허락 없음 */
      ok(st('R1').approvalState === 'blocked' && /💸 정범님 허락 필요/.test(st('R1').execNote || '') && !sentP.includes(9000), `허락이 없으면 연구 내림을 막음: '${(st('R1').execNote || '').slice(0, 70)}'`, st('R1'));
      ok(J.led && (J.led.no || []).some((x) => x.key === 'aladin_R1' && /💸 정범님 허락 필요/.test(x.why)), "원장 '막은 기록'에 '정범님 허락 필요'", J.led && J.led.no);
      ok(st('R3').approvalState === 'blocked' && /정범님이 손대 진행 중인 상품/.test(st('R3').execNote || '') && !sentP.includes(8800), `연구는 감시 그룹에 든 상품을 안 건드림: '${(st('R3').execNote || '').slice(0, 70)}'`, st('R3'));
      ok(st('W1').approvalState === 'done' && sentP.includes(8000), '감시 자동 반영은 그대로', st('W1')); }
    if (m === 'pw2') { /* 무손해 꺼짐 · 허락 있음(전체 비율 실험 · 하루 3,000원) */
      ok(st('R1').approvalState === 'done' && sentP.includes(9000), `허락이 있으면 한도 안 연구 내림은 됨(10,000 → 9,000) (${st('R1').approvalState})`, st('R1'));
      ok(st('R4').approvalState === 'blocked' && /하루 손해 한도/.test(st('R4').execNote || '') && /한도 3,000원/.test(st('R4').execNote || '') && !sentP.includes(6000), `허락 한도(3,000원)를 넘는 내림은 막음: '${(st('R4').execNote || '').slice(0, 90)}'`, st('R4'));
      ok(st('R5').approvalState === 'blocked' && /등록 3개월/.test(st('R5').execNote || ''), '허락이 있어도 등록 3개월 안은 안 건드림', st('R5')); } }

  const hp = [path.join(__dirname, 'harness.js')].find((x) => fs.existsSync(x));
  if (!hp || !process.env.RN_PORT) { console.log('  (웹앱 화면 시험은 harness·RN_PORT가 없어 건너뜀)'); return fin(); }
  console.log('⑥ 웹앱 화면 — 💸 허락 두 번 누르기');
  await require(hp)(async (p) => { await p.waitForTimeout(600);
    const R = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
      o.fn = typeof costOkCard === 'function' && typeof openStratRun === 'function'; if (!o.fn) return o; const doc = () => db.collection('app_settings').doc('research_cost_ok').get().then((d) => (d.exists ? d.data() : null));
      SX.cost = { what: 'strat', limit: '3000', days: '3' }; S.costCo = null; openStratRun(); await Wt(800); openStratRun(true); await Wt(300);
      const card = document.querySelector('.sx-cost'); o.card = card ? card.textContent.replace(/\s+/g, ' ') : null; const b = () => document.querySelector('[data-costok]'); o.btn = b() ? b().textContent : null;
      if (b()) { b().click(); await Wt(200); o.arm = b() ? b().textContent : null; o.after1 = await doc(); b().click(); await Wt(800); o.after2 = await doc(); }
      await Wt(300); openStratRun(true); await Wt(600); const c2 = document.querySelector('.sx-cost'); o.card2 = c2 ? c2.textContent.replace(/\s+/g, ' ') : null;
      const off = () => document.querySelector('[data-costoff]'); if (off()) { off().click(); await Wt(200); o.offArm = (await doc() || {}).on; off().click(); await Wt(800); o.off = await doc(); }
      o.okFn = !!(window.ReadnowML && window.ReadnowML.fenceCostOk); o.pops = pops; return o; });
    ok(R.fn && R.okFn, '웹앱 허락 카드·학습 공용 fenceCostOk 있음', R);
    ok(/💸 비용 드는 연구 허락/.test(R.card || '') && /허락 없음|허락 \S*없음/.test(R.card || ''), `처음엔 허락 없음: '${(R.card || '').slice(0, 120)}'`, R.card);
    ok(/💸 허락: ⚡ 전략 실행 · 하루 3,000원 · \d{4}-\d{2}-\d{2}까지/.test(R.btn || '') && /^한 번 더 누르면 — 💸 허락: ⚡ 전략 실행 · 하루 3,000원/.test(R.arm || '') && R.after1 === null, `첫 번째 누름은 대상·한도·끝나는 날만 보여 주고 쓰지 않음: '${R.arm}'`, R);
    const a = R.after2 || {}; ok(a.on === true && a.via === 'twice' && a.limit === 3000 && JSON.stringify(a.what) === '["strat"]' && /@/.test(a.by || '') && /^\d{4}-\d{2}-\d{2}$/.test(a.until || '') && (a.hist || []).length === 1, '두 번째 누름에 허락 기록(대상·한도·끝나는 날·누가·언제 · 이력 덧붙임)', a);
    ok(/하루 3,000원/.test(R.card2 || ''), `카드에 지금 허락 보임: '${(R.card2 || '').slice(0, 160)}'`, R.card2);
    ok(R.offArm === true && R.off && R.off.on === false && (R.off.hist || []).length === 2 && R.off.limit === 3000, '거두기도 두 번 누르기(첫 누름엔 그대로) · 이력은 지우지 않음', R.off);
    ok(R.pops === 0, '브라우저 팝업 없음');
  });
  fin();
  function fin() { console.log(bad ? `❌ tFENCE4 실패 ${bad}` : '✓ tFENCE4 모두 통과'); process.exitCode = bad ? 1 : 0; }
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });

/* ── 가격 감시기 모의 실행 한 판(tpw5와 같은 틀) ── */
function pwRun(mode) {
  const { JSDOM } = require('jsdom'); const R = [path.join(__dirname, 'repo/'), path.join(__dirname, '../../'), path.join(__dirname, '../')].find((x) => fs.existsSync(path.join(x, 'readnow-pricing-core.js')));
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://www.aladin.co.kr/scm/wrecord_edit.aspx', runScripts: 'outside-only', pretendToBeVisual: true }); const w = dom.window;
  for (const f of ['readnow-core.js', 'readnow-sellers-core.js', 'readnow-products-core.js', 'readnow-pricing-core.js']) w.eval(fs.readFileSync(path.join(R, f), 'utf8'));
  const store = new Map(); let seq = 0; const now = () => new Date().toISOString(); const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const applyMerge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__ts) o[k] = now(); else if (x && typeof x === 'object' && !Array.isArray(x) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && k === 'x') o[k] = { ...o[k], ...clone(x) }; else o[k] = clone(x); } return o; };
  const mkDoc = (p) => ({ id: p.split('/').pop(), path: p, get ref() { return mkDoc(p); }, collection: (c) => mkColl(p + '/' + c),
    get: async () => { const v = store.get(p); return { exists: !!v, id: p.split('/').pop(), data: () => clone(v), ref: mkDoc(p) }; },
    set: async (v, o) => { store.set(p, o && o.merge ? applyMerge(store.get(p), v) : applyMerge({}, v)); }, update: async (v) => { store.set(p, applyMerge(store.get(p), v)); }, onSnapshot: () => () => {} });
  const match = (v, f, op, val) => { const g = f.split('.').reduce((a, k) => (a == null ? a : a[k]), v); return op === '==' ? g === val : op === 'in' ? val.includes(g) : op === '>=' ? g >= val : op === '>' ? g > val : false; };
  const mkColl = (name) => { const q = (filters) => ({ where: (f, op, val) => q([...filters, [f, op, val]]), limit: () => q(filters), orderBy: () => q(filters), select: () => q(filters), onSnapshot: () => () => {},
    get: async () => { const docs = [...store.entries()].filter(([k, v]) => k.startsWith(name + '/') && k.split('/').length === name.split('/').length + 1 && filters.every(([f, op, val]) => match(v, f, op, val))).map(([k, v]) => ({ id: k.split('/').pop(), data: () => clone(v), ref: mkDoc(k), exists: true })); return { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn) }; } });
    return { ...q([]), doc: (id) => mkDoc(name + '/' + (id || 'auto' + (++seq))) }; };
  const db = { collection: mkColl, settings: () => {}, batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; },
    runTransaction: async (fn) => { const ops = []; const tx = { get: (r) => r.get(), set: (r, v, o) => ops.push(() => r.set(v, o)), update: (r, v) => ops.push(() => r.update(v)) }; const out = await fn(tx); for (const f of ops) await f(); return out; } };
  const firebase = { apps: [1], initializeApp: () => {}, firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...x) => ({ __au: x }), delete: () => null, increment: (n) => n } }), auth: () => ({ onAuthStateChanged: (cb) => { setTimeout(() => cb({ email: 't@t' }), 0); return () => {}; } }) };
  w.firebase = firebase; const GM = { pw_pc: 'JS-MAIN' }; w.GM_getValue = (k, d) => (k in GM ? GM[k] : d); w.GM_setValue = (k, v) => (GM[k] = v); w.GM_listValues = () => Object.keys(GM); w.GM_deleteValue = (k) => delete GM[k]; w.GM_xmlhttpRequest = () => {};
  w.Worker = undefined; let pops = 0; w.alert = () => { pops++; }; w.confirm = () => { pops++; return true; }; w.prompt = () => { pops++; return null; };
  const sent = []; w.fetch = async (url) => { if (/wuseditemall|wproduct\.aspx/.test(url)) return { ok: true, status: 200, text: async () => '<html><body></body></html>' }; const u = new w.URL(url, 'https://www.aladin.co.kr'); const price = u.searchParams.get('price') || u.searchParams.get('priceSales') || (String(url).match(/(?:price\w*)=(\d+)/i) || [])[1]; if (price) sent.push(+price); return { ok: true, status: 200, text: async () => JSON.stringify({ result: true, resultValue: String(price) }) }; };
  const T0 = Date.now(); const ago = (h) => new Date(T0 - h * 3600e3).toISOString(); const day = new Date(T0 + 9 * 3600e3).toISOString().slice(0, 10); const PRV = (w.ReadnowPricing || w.ReadNowPricing || {}).VERSION || null;
  store.set('prd_system/pricing', { enabled: false, killSwitch: false, watchPc: 'JS-MAIN', watchTab: 'TAB1', rollout: { treatPct: 0, controlPct: 0 } }); w.sessionStorage.setItem('pw_tab', 'TAB1');
  store.set('prd_price_batches/G1', { name: '감시1', cond: {}, watch: { on: true, mode: 'auto', apply: 'auto', guardPct: 15, chase: { name: 'lure' } } });
  store.set('app_settings/eng_fence_now', { at: ago(1), day, dayLoss: 10000 });
  store.set('app_settings/eng_excl', { m: { aladin_W1: { why: '사람이 고침', at: ago(20) } } });
  store.set('eng_fence_ledger/' + day, { day, done: 10000, x: {}, no: [] }); store.set('eng_fence_ledger/_head', { day });
  if (mode !== 'pw0') store.set('app_settings/eng_fence', { noLossMode: false }); /* pw0 = 설정 없음 → 무손해 켜짐(기본) */
  if (mode === 'pw2') { store.set('eng_fence_ledger/' + day, { day, done: 0, x: {}, no: [] }); store.set('app_settings/research_cost_ok', { on: true, by: 'a@b.c', at: ago(1), until: new Date(T0 + 2 * 864e5).toISOString(), what: ['ro'], limit: 3000, via: 'twice' }); }
  const old = kdt(T0 - 300 * 864e5); const L = (k, o) => store.set('prd_listings/aladin_' + k, { usedCode: k, listingId: 'L' + k, status: '판매중', price: 10000, lastSeenAt: ago(5), registeredAt: old, ...(o || {}) });
  const dec = (k, st, ap, extra) => store.set('prd_price_decisions/aladin_' + k, { key: 'aladin_' + k, usedCode: k, listingId: 'L' + k, title: '책' + k, sku: 'BLKCMN', group: 'off', approvalState: st, approval: { at: ago(0.2), ...ap }, current: 10000, at: ago(0.3), engine: PRV, ...(extra || {}) });
  L('W1', { registeredAt: kdt(T0 - 30 * 864e5), editBy: 'a@b.c', editAt: ago(24) }); dec('W1', 'approved', { decision: 'auto', by: 'engine:G1', gid: 'G1', price: 8000, expectPrice: 10000 }, { watch: { gid: 'G1', startPrice: 10000, since: ago(100) } });
  L('R1'); dec('R1', 'approved', { decision: 'approve', by: 'a@b.c', price: 9000, expectPrice: 10000 }, { group: 'treat' });
  L('M1'); dec('M1', 'manual', { decision: 'batch', batchId: 'b1', by: 'a@b.c', price: 7500, expectPrice: 10000 });
  if (mode === 'pw1') { L('R3'); dec('R3', 'approved', { decision: 'approve', by: 'a@b.c', price: 8800, expectPrice: 10000 }, { group: 'treat', watch: { gid: 'G1', startPrice: 10000, since: ago(100) } }); }
  if (mode === 'pw2') { L('R4'); dec('R4', 'approved', { decision: 'approve', by: 'a@b.c', price: 6000, expectPrice: 10000 }, { group: 'treat' }); L('R5', { registeredAt: kdt(T0 - 20 * 864e5) }); dec('R5', 'approved', { decision: 'approve', by: 'a@b.c', price: 9500, expectPrice: 10000 }, { group: 'treat' }); }
  const src = fs.readFileSync(find(['readnow-price-watch.user.js', '../readnow-price-watch.user.js', '../../readnow-price-watch.user.js']), 'utf8');
  w.eval(src);
  setTimeout(() => { const decs = {}; for (const [k, v] of store) if (k.startsWith('prd_price_decisions/aladin_')) decs[k.slice('prd_price_decisions/aladin_'.length)] = { approvalState: v.approvalState, execNote: v.execNote || null };
    console.log('RESULT ' + JSON.stringify({ dec: decs, sent, led: store.get('eng_fence_ledger/' + day) || null, pops, prv: PRV })); process.exit(0); }, +process.env.PW_WAIT || 75000);
}
