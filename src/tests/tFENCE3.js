// tFENCE3 — 11/10 일꾼 fence3 · 정범님 11/09 밤 '손해가 적용되는 곳을 지금 진행되려는 곳이 있다면 바로 모두 멈춰 · 손해를 보지 않고 진행할 방법'
//  ① 무손해 기본(app_settings/eng_fence.noLossMode — 없거나 못 읽으면 켜짐) · ⚡ 전략 실행·전체 비율 실험은 값을 안 바꿈(코드 차례) · 클라우드가 기본값을 한 번 적음
//  ② 손해 셈 (나): 정범님(사람)이 마지막으로 확정한 값이 기준 — 사람이 내린 몫은 손해가 아님 · 엔진이 그보다 더 내린 몫만 · 경계값(딱·1원 넘음)
//  ③ 🔒 엔진이 안 건드리는 상품: 등록 90일(3개월) 안 · 등록 때 모름(안전 쪽) · 사람이 손댐(14일 · eng_excl 기한 없음) · 같은 감시 그룹의 수동 일괄은 셈 안 함
//  ④ 연결: 감시기(판정·반영) · ⚡ 전략 안전 검사 · 🔬 조회수 실험 새로 붙이기 · 웹앱 카드 한 줄
//  ⑤ 시트 '허위' 표시는 점수·대상 고르기에 안 씀(참고 표시만) · ⑥ 평가 쓴 아이디 원문(tSELDEEP가 자세히)
// 시험 자료에 손님 정보 없음(상품 번호·꾸민 값만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js']), 'utf8');
const MLP = find(['../readnow-ml-core.js', '../../readnow-ml-core.js']); const ML = require(MLP); const MLSRC = fs.readFileSync(MLP, 'utf8');
const PWP = find(['readnow-price-watch.user.js', '../readnow-price-watch.user.js', '../../readnow-price-watch.user.js']); const PW = fs.readFileSync(PWP, 'utf8');
const AS = require(find(['../readnow-autosched-core.js', '../../readnow-autosched-core.js'])).AS;
const RS = require(find(['../readnow-sellers-core.js', '../../readnow-sellers-core.js']));
const COLP = find(['../readnow-collector.user.js', '../readnow-collector.src.js', '../../src/readnow-collector.src.js']); const COL = COLP ? fs.readFileSync(COLP, 'utf8') : '';
const APPP = find(['../app.html', '../../src/app.html', '../../app.html']); const APP = APPP ? fs.readFileSync(APPP, 'utf8') : '';
const D = 864e5; const NOW = Date.now(); const kdt = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16); /* 상품 기록 registeredAt 꼴(한국 시각 'YYYY-MM-DDTHH:MM') */

(async () => {
  console.log('① 무손해 기본');
  ok(ML.fenceNoLoss(null) === true && ML.fenceNoLoss({}) === true && ML.fenceNoLoss({ noLossMode: true }) === true && ML.fenceNoLoss({ noLossMode: false }) === false && ML.fenceNoLoss({ noLossMode: 'false' }) === true, '설정이 없거나 못 읽으면 켜짐 · 정범님이 false로 둘 때만 꺼짐(글자 "false"도 켜짐 — 안전 쪽)');
  { const cut = (s) => { const a = s.indexOf('/* FENCE-PURE-START'), b = s.indexOf('/* FENCE-PURE-END */'); return a > 0 && b > a ? s.slice(a, b) : null; }; ok(cut(MLSRC) && cut(MLSRC) === cut(PW), '학습 공용과 가격 감시기의 셈 사본(FENCE-PURE)이 글자 그대로 같음(새 함수 fenceNoLoss·fenceLock·fenceBase 포함)'); }
  { const st = SRC.slice(SRC.indexOf('async function stratTick('), SRC.indexOf('async function stratPreCheck(')); const iN = st.indexOf('if (NOLOSS) {'), iT = st.indexOf("fenceTxCloud(ML, 'try'"), iCmd = st.indexOf("await ref.set({ type: 'prdEdit'");
    ok(iN > 0 && iT > iN && iCmd > iN && /NOLOSS = ML\.fenceNoLoss \? ML\.fenceNoLoss\(/.test(st) && /catch \(e\) \{ NOLOSS = true;/.test(st), '⚡ 전략: 무손해 모드면 맡기기(샵매니저 수정) 전에 건너뜀 · 설정을 못 읽으면 켜진 것으로');
    const pc = SRC.slice(SRC.indexOf('async function stratPreCheck('), SRC.indexOf('async function stratPreCheck(') + 1500); ok(/무손해 모드 — 전략 실행은 값·판매 상태를 바꾸지 않음/.test(pc), '⚡ 전략: 실행 직전 다시 확인에서도 무손해 모드면 취소(이미 맡긴 것)'); }
  { const ex = SRC.slice(SRC.indexOf('async function engExpTick('), SRC.indexOf('/* FENCE2-START')); ok(/if \(EF0\.noLossMode === undefined\) \{ try \{ await C\('app_settings'\)\.doc\('eng_fence'\)\.set\(\{ noLossMode: true/.test(ex) && /merge: true/.test(ex) && /observeOnly: NOLOSS/.test(ex), '클라우드: 설정에 없으면 다음 회차에 noLossMode:true를 한 번 적음(덧붙임 · 지우지 않음) · 실험 문서에 관찰만 표시'); }
  { const ex = PW.slice(PW.indexOf('async function executeApproved'), PW.indexOf('/* ── (0.7.0) 공개 반영 확인')); const iR = ex.indexOf("if (fSrc === 'ro' && fenceNoLoss(await engFence(true)))"), iL = ex.indexOf('const LK = fenceLock(LSx'), iT = ex.indexOf("fenceRun('try'"), iA = ex.indexOf('P.scmAction.price(x.listingId, price)');
    ok(iR > 0 && iL > iR && iT > iL && iA > iT, '감시기: 전체 비율 실험 승인은 무손해 모드면 안 바꿈 → 🔒 검사 → 원장 예약 → 알라딘에 보냄(차례)');
    ok(/if \(LSx === undefined\) \{ await back\('🔒 상품 기록을 못 읽어/.test(ex), '감시기: 상품 기록을 못 읽으면 안 바꿈(안전 쪽)');
    ok(/needApproval = d\.group === 'treat' && d\.status !== 'skip' && !\(EXo && EXo\[key\]\) && !NOLOSS && !LOCK/.test(PW), '감시기 판정: 무손해 모드·🔒 상품은 전체 비율 실험 제안을 올리지 않음(판정만)');
    ok(!/if \(!keepW && chg && LOCK && wg\.watch\.apply === 'auto'\)/.test(PW) && /\(11\/10 fence4 · 정범님 11\/09 밤 '감시 그룹 자동 반영과 추격자는 내가 결정해서 할 일/.test(PW), '(fence4로 바뀜) 감시기 판정: 🛰 자동 반영 그룹은 🔒 연구 잠금을 안 씀 — 정범님 그룹 설정대로(tFENCE4가 자세히)'); }
  { const F = { ...process.env }; const pwF = PW.slice(PW.indexOf('  /* FENCE-PURE-START'), PW.indexOf('  const sameApproval')); ok(/async function engFence\(force\)/.test(pwF) && /catch \(e\) \{ return null; \}/.test(pwF.slice(pwF.indexOf('async function engFence'))), '감시기: 무손해 설정을 못 읽으면 null → 켜짐'); void F; }

  console.log('② 손해 셈 (나) — 사람이 확정한 값 기준');
  const LIM = { ok: true, limit: 10000 };
  { /* 정범님이 수동 일괄로 10,000 → 8,000(사람이 내린 2,000원은 손해 아님) · 원장엔 옛 기준(감시 시작 전 10,000)이 남아 있음 */
    const L = { done: 0, x: { aladin_A: { s: 10000, p: 8000, a: 2000, r: null }, aladin_O: { s: 9000, p: 1000, a: 9000, r: null } } };
    const a = ML.fenceTry(L, { key: 'aladin_A', from: 8000, to: 7000, human: 8000, id: 'r1' }, LIM); ok(a.ok && a.need === 10000 && a.e.s === 8000 && a.e.a === 0 && a.e.r.a === 1000 && a.e.base === 'human', `한도 딱: 다른 상품 9,000 + 엔진이 사람 값(8,000)보다 더 내린 1,000 = ${a.need}원(예전 (가) 셈이면 사람 몫 2,000까지 12,000으로 막혔음)`, a);
    const b = ML.fenceTry(L, { key: 'aladin_A', from: 8000, to: 6999, human: 8000, id: 'r2' }, LIM); ok(!b.ok && b.need === 10001 && !b.e, `1원 넘음: ${b.need}원 → 내리지 않음`, b);
    const c = ML.fenceTry(L, { key: 'aladin_A', from: 8000, to: 7000, id: 'r3' }, LIM); ok(!c.ok && c.need === 12000, '사람 확정 값을 안 넘기면 원장의 옛 기준(10,000)으로 더 많이 셈(안전 쪽)', c);
    const d = ML.fenceTry({ done: 0, x: {} }, { key: 'aladin_N', from: 8000, to: 8000 - 1, human: 9000, id: 'r4' }, { ok: true, limit: 1000 }); ok(!d.ok && d.need === 1001 && /1,001원 > 한도 1,000원/.test(d.why), '사람 값(9,000)보다 이미 1,000 낮은 상품을 1원 더 내림 → 사람 값 기준 1,001원 > 한도 1,000원이면 막음', d); }
  { const L = { x: { aladin_A: { s: 10000, p: 8000, a: 2000, r: null } } }; const e = ML.fenceNote(L, 'aladin_A', 8000, 8000, null, false, '2026-11-10T00:00:00Z', true); ok(e && e.s === 8000 && e.a === 0 && e.base === 'human', '사람이 값을 확정하면 기준을 그 값으로 다시 놓음(걸린 손해 0)', e);
    const e2 = ML.fenceNote(L, 'aladin_A', 8000, 8000, null, false, '2026-11-10T00:00:00Z', false); ok(e2 && e2.s === 10000 && e2.a === 2000, 'reset이 없으면 예전 그대로(엔진이 값을 올림 등)', e2); }
  { const B = ML.fenceBase; const hp = { at: '2026-11-01T00:00:00Z', by: 'a@b.c', p: 7000 };
    ok(B({ humanPx: hp, watch: { humanPrice: 7500, startPrice: 9000 } }).s === 7000 && B({ humanPx: hp }).human === true, '기준 ① 사람이 마지막으로 확정한 값(humanPx)');
    ok(B({ watch: { humanPrice: 7500, startPrice: 9000 } }).s === 7500, '기준 ② 감시 그룹에 넣을 때 사람이 확정한 값');
    ok(B({ approval: { decision: 'batch', by: 'a@b.c', price: 7200 }, watch: { startPrice: 9000 } }).s === 7200 && B({ approval: { decision: 'auto', by: 'engine:g', price: 6000 }, watch: { startPrice: 9000 } }).s === 9000, '기준 ③ 사람이 낸 결정 값(엔진 자동 결정은 아님)');
    const o = B({ watch: { startPrice: 9000 } }); ok(o.s === 9000 && !o.human, '기준 ④ 기록이 없으면 감시 시작 전 값(더 많이 셈) — 사람 값으로 넘기지 않음');
    ok(B({}, 8000).s === 8000 && !B({}, 8000).human && B({}, null) === null, '기준 ⑤ 엔진이 처음 내리기 전 값 · 없으면 null'); }
  { const sc = SRC.slice(SRC.indexOf('async function engTreatKeys('), SRC.indexOf('function engDecFor(')); ok(/ML0\.fenceBase\(v, null\)/.test(sc) && /start: B \? B\.s :/.test(sc), '클라우드 실험 장부: 처리 상품 시작 값 = 사람이 확정한 값(하루 손해 셈 dayLossOf가 이 값을 씀)');
    ok(/humanAp \? price : null/.test(PW) && /enroll\.humanPx = \{ p: price/.test(PW) && /reset: true \}\)/.test(PW), '감시기: 사람 값이 알라딘에 들어가면 humanPx·감시 그룹 humanPrice를 남기고 원장 기준을 다시 놓음');
    ok(/humanPrice: \/@\/\.test\(String\(\(v\.approval \|\| \{\}\)\.by/.test(APP), '웹앱: 이미 반영된 일괄을 감시에 붙일 때도 사람 확정 값(humanPrice)'); }

  console.log('③ 🔒 엔진이 안 건드리는 상품');
  { const K = ML.fenceLock; const old = { registeredAt: kdt(NOW - 200 * D) };
    const a = K({ registeredAt: kdt(NOW - 30 * D) }, { nowMs: NOW }); ok(a && a.kind === 'new' && /3개월/.test(a.why) && a.until, '등록 30일 → 🔒 등록 3개월 안', a);
    ok(K({ registeredAt: kdt(NOW - 89 * D) }, { nowMs: NOW }) && !K({ registeredAt: kdt(NOW - 91 * D) }, { nowMs: NOW }), '경계: 89일은 🔒 · 91일은 아님');
    ok(K({ registeredAt: new Date(NOW - 10 * D + 9 * 3600e3).toISOString().slice(0, 10) }, { nowMs: NOW }), '날짜만 있는 등록도 읽음');
    ok(K({}, { nowMs: NOW }) && /모름/.test(K({}, { nowMs: NOW }).why) && K({ firstSeenAt: new Date(NOW - 20 * D).toISOString() }, { nowMs: NOW }).kind === 'new' && K({}, { nowMs: NOW, regAt: kdt(NOW - 300 * D) }) === null, '등록 때를 모르면 🔒(안전 쪽) · 처음 본 때·등록 기록으로 대신');
    ok(K(old, { nowMs: NOW }) === null, '오래된 상품·사람 손댐 없음 → 엔진이 다룰 수 있음');
    ok(K(old, { nowMs: NOW, excl: { why: '사람이 고침' } }).kind === 'human', '사람이 손대 실험에서 빠진 상품(eng_excl)은 기한 없이 🔒');
    ok(K({ ...old, editBy: 'a@b.c', editAt: new Date(NOW - 3 * D).toISOString() }, { nowMs: NOW }).kind === 'human' && K({ ...old, editBy: 'a@b.c', editAt: new Date(NOW - 15 * D).toISOString() }, { nowMs: NOW }) === null && K({ ...old, editBy: 'price-watch:set', editAt: new Date(NOW - 1 * D).toISOString() }, { nowMs: NOW }) === null, '사람이 ✏ 고친 지 14일 안은 🔒 · 15일은 아님 · 감시기·엔진 반영은 사람 손댐이 아님');
    const ap = (g) => ({ approval: { decision: 'batch', batchId: g, by: 'a@b.c', at: new Date(NOW - 2 * D).toISOString(), price: 7000 } });
    ok(K(old, { nowMs: NOW, dec: ap('g1'), gid: 'g1' }) === null && K(old, { nowMs: NOW, dec: ap('g2'), gid: 'g1' }).kind === 'human' && K(old, { nowMs: NOW, dec: { approval: { decision: 'manual', by: 'a@b.c', at: new Date(NOW - 2 * D).toISOString() } } }).kind === 'human', '같은 감시 그룹의 수동 일괄은 정범님이 엔진에 맡긴 것(셈 안 함) · 다른 그룹 일괄·직접 가격은 🔒');
    const g = ML.stratGuard({ act: 'price', to: 9500, k: 'drip', M: { ok: true, ageH: 1 } }, { l: { status: '판매중', qty: 1, listingId: 'L1', price: 10000, registeredAt: '2026-01-01', sku: 'ABCDEF' }, st: {}, now: NOW, lock: { why: '등록 30일 — 등록 3개월(90일) 안이라 엔진이 안 건드림' } }, {});
    ok(!g.ok && g.no.some((x) => /^🔒 등록 30일/.test(x)), '⚡ 안전 검사가 🔒 상품을 막음', g.no);
    const g2 = ML.stratGuard({ act: 'pause', k: 'drip', M: { ok: true, ageH: 1 } }, { l: { status: '판매중', qty: 1, listingId: 'L1', price: 10000, registeredAt: '2026-01-01', sku: 'ABCDEF' }, st: {}, now: NOW, lock: { why: '사람이 상품 정보를 고침' } }, {}); ok(!g2.ok, '판매 상태 바꾸기(일시판매중지)도 막음');
    ok(/const lock = ML\.fenceLock \? ML\.fenceLock\(l, \{ key: lid, excl: ENGO\[lid\] \|\| null, dec: dec \|\| null/.test(SRC) && /fence: ENGF\[a\.id\] \|\| null, lock,/.test(SRC), '클라우드 ⚡ 전략: 상품마다 🔒 검사 재료를 넘김(옛 공용 파일이면 안전 쪽으로 막음)'); }
  { const groups = [{ id: 'g', auto: true, on: true, lids: ['100', '200', '300'] }]; const L = new Map([['100', { reg: kdt(NOW - 20 * D) }], ['200', { reg: kdt(NOW - 200 * D) }], ['300', {}]]);
    const R = AS.pxPlan({ now: NOW, cfg: { cap: 10, recap: 10 }, groups, listings: L, exp: new Map(), busy: new Set(), rnd: () => 0.5 }); const ids = (R.docs || []).concat(R.runs || []).map((x) => JSON.stringify(x)).join(' ');
    ok(R.newLock === 2 && /"200"/.test(ids) && !/"100"/.test(ids) && !/"300"/.test(ids), `🔬 조회수 실험: 등록 3개월 안·등록 때 모름은 새로 붙이지 않음(빠진 수 ${R.newLock})`, { newLock: R.newLock, ids: ids.slice(0, 200) });
    const R2 = AS.pxPlan({ now: NOW, cfg: { cap: 10, recap: 10 }, groups, listings: L, exp: new Map([['100', { on: true, addedAt: '2026-11-01' }]]), busy: new Set(), rnd: () => 0.5 }); ok(/"100"/.test(JSON.stringify(R2.docs || []).concat(JSON.stringify(R2.runs || []))) || (R2.plan[0] && R2.plan[0].chk === 1), '이미 붙은 것의 확인은 그대로(떼기·확인은 막지 않음)', R2.plan); }
  ok(/function engLockLine\(l\)/.test(APP) && /🔒 등록 3개월 안 — 연구·엔진만 안 건드림/.test(APP) && /\$\{engLockLine\(l\)\}/.test(APP), '웹앱 상품 카드 가격 감시 칸에 🔒 한 줄(fence4: 연구·엔진만)');

  console.log('⑤ 시트 허위 표시는 참고만');
  { const s = { sc: '1', reviewCount: '500', outstockRate: '1.0', rating: '0.99', aladinGrade: '전문셀러' }; const A = RS.score(s, {}), B = RS.score({ ...s, grade: 'fake' }, {});
    ok(A.model === B.model && A.gain === B.gain && !(B.gates || []).some((g) => /허위/.test(g)) && (B.notes || []).some((g) => /참고: 옛 시트/.test(g)), `판매자 점수: 시트 허위 표시가 모범·득실 점수에 안 들어감(참고 글만) · ${A.model}/${B.model} · ${A.gain}/${B.gain}`, { A: [A.model, A.gain], B: [B.model, B.gain, B.gates, B.notes] }); }
  ok(/if \(st\.fake === true\) \{ try \{ \(await C\('sellers'\)\.where\('grade', '==', 'fake'\)/.test(SRC), '판매자 깊이 읽기: 시트 허위 매물로 대상 고르기는 기본 끔(정범님이 켤 때만)');
  ok(!COL || (/const sp = sl\.length \? 15 : 0;/.test(COL) && /참고: 옛 시트 허위 매물 표시 — 점수에 안 넣음/.test(COL)), '고객 점수 ⑥ 판매자 연결: 시트 허위 표시로 점수를 더하지 않음(글로만)');

  console.log('⑥ 평가 쓴 아이디 원문');
  { const X = require(find(['../readnow-ext-core.js', '../../readnow-ext-core.js'])); const S = X.alSurveyRows('<table><tr><td class="y_usedsmall">2026-11-01</td><td>만족</td><td>손님A**</td><td>좋아요 잘 받았어요</td></tr></table>');
    ok(S.rows[0].u === '손님A**' && S.rows[0].c === '좋아요 잘 받았어요', '알라딘 평가 줄에 아이디 원문(u)', S.rows); }

  const hp = [path.join(__dirname, 'harness.js')].find((x) => fs.existsSync(x));
  if (!hp || !process.env.RN_PORT) { console.log('  (웹앱 화면 시험은 harness·RN_PORT가 없어 건너뜀)'); return fin(); }
  require(hp)(async (p) => { await p.waitForTimeout(600);
    const R = await p.evaluate(async (NOW) => { const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; }; const kdt = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 16);
      o.fn = typeof engLockLine === 'function'; o.ml = !!(window.ReadnowML && window.ReadnowML.fenceLock); if (!o.fn) return o;
      const box = document.createElement('div'); box.innerHTML = engLockLine({ id: 'aladin_1', registeredAt: kdt(NOW - 30 * 864e5) }); o.newT = box.textContent;
      box.innerHTML = engLockLine({ id: 'aladin_2', registeredAt: kdt(NOW - 300 * 864e5), editBy: 'a@b.c', editAt: new Date(NOW - 864e5).toISOString() }); o.humT = box.textContent;
      o.none = engLockLine({ id: 'aladin_3', registeredAt: kdt(NOW - 300 * 864e5) }); o.pops = pops; return o; }, NOW);
    ok(R.fn && R.ml, `웹앱 engLockLine·학습 공용 fenceLock 있음`, R);
    ok(/🔒 등록 3개월 안 — 연구·엔진만 안 건드림/.test(R.newT || '') && /까지/.test(R.newT || '') && /🛰 감시 그룹 자동 반영·🎯 추격자·직접 가격·수동 일괄·상품 수정은 정범님 설정대로 그대로/.test(R.newT || ''), `카드 줄(새 상품): '${(R.newT || '').slice(0, 120)}'`);
    ok(/🔒 사람이 손댄 상품 — 연구·엔진만 안 건드림/.test(R.humT || '') && R.none === '' && R.pops === 0, `카드 줄(사람 손댐) · 오래된 상품은 줄 없음 · 팝업 없음`, R);
  }).then(fin);
  function fin() { console.log(bad ? `❌ tFENCE3 실패 ${bad}` : '✓ tFENCE3 모두 통과'); process.exitCode = bad ? 1 : 0; }
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
