/* 🕸 엔진 연결망 (engnet1 · 2026-11-19 · 정범님 11/19 08시대 「각 엔진이 스스로 서로를 인지하면서 연계해 … 알아서 자기 기능을 개입해 적용하도록 작동하는 것까지」
 *   · 「배운/연구에서 멈추지 말고 작동까지 … 처음부터 지금까지 어떻게 진화해 왔는지 역학적으로 따져 우리 엔진에 도입하라」 · 해부·설계 readnow-chats reports/ENGNET1_1119.md)
 *  리드 체계가 진화해 온 길(실패 → 장부 → 장치 → 검사)을 엔진에 그대로 옮김:
 *   ① 등록부(ENGINES) — 엔진마다 할 수 있는 일(can)·내는 것(out)·필요한 것(needs)·살아 있음 표시(hb) → 서로를 앎(누가 누구를 보는지 = needs·규칙의 watch)
 *   ② 개입 규칙(RULES) — 한 엔진이 다른 엔진의 결과를 보고 스스로 자기 기능을 얹음. 모든 규칙은 채점 방법(score)이 있어야 그림자 위로 감(채점 없는 판단 금지 · 헌장 제39조 '지킴은 장치에')
 *      N1 판매가치·팔릴 확률 「안 팔림」 → 판정 엔진 값 후보 → 관제창 울타리 → 7일 뒤 연구가 채점(정말 안 팔렸나 · 같은 날 대조와 견줌)
 *      N2 스스로 배우기가 아픔 → 그 재료를 쓰는 배선(W00·W01)을 올리지 말라고 연구 엔진(engself)에 권고 → 48시간 안에 나았나로 채점
 *      N3 재료가 묵음 → 등록부로 아래 엔진을 찾아 「재료 묵음」 표시 → 12시간 안에 다시 신선해졌나로 채점
 *      N4 무손해 울타리 ↔ 배선 단계 — 무손해 모드 동안 돈 배선이 3단계 넘게 올라가면 충돌 → 되돌림 권고 → 충돌 0이면 통과
 *      N5 판정 장부(engimp1 몫 · 이 파일은 만들지 않고 읽기만) — 장부가 생기면 그 채점을 N1 무게로 → 장부 없으면 후보(cand)에 머묾
 *   ③ 진화 장치 — 실패 기록(fails) → 같은 실패가 7일 안 3번이면 규칙 후보(도전자) 태어남 → 그림자에서 함께 채점 → 3번 이어 나으면 올림 · 올린 뒤 2번 이어 지면 되돌림
 *      단계: cand(후보 · 기록만) → shadow(그림자 · 채점) → advice(조언 · 웹앱에 보임). 돈을 바꾸는 단계는 없음(헌장 제33조 무손해 · F47 엔진이 값을 스스로 바꾼 적 없음 · 3단계 이상은 정범님 허락)
 *   ④ 스스로 건강 — 회차마다 heartbeat(lightAt·heavyAt·errN) · 이틀 이어 실패면 노트 카드(✕ 닫기) · 연구 건강 장부(reshealth)가 이 문서를 지켜봄(서로 지켜봄)
 *  남기는 곳: app_settings/eng_net(요약 · 웹앱 🔬 연구 › 🕸 엔진 지도) · app_settings/eng_net_evo(규칙 단계·도전자·실패 기록) · eng_net_day/{날}(N1 개입 줄 · 채점)
 *  지키는 것: 값·등록·돈은 하나도 안 바꿈(기록·권고만) · 지우지 않음 · 끄기 cloud_jobs.engnet=false 또는 app_settings/eng_net_cfg.on=false · 세세한 값은 eng_net_cfg */
'use strict';
const EN_V = '1.0.0';
const EN_DEF = {
  on: true, lightMin: 30, heavyHourKST: 6, // 30분마다 가벼운 회차(살아 있음·N2~N5) · 한국 6시 뒤 하루 한 번 무거운 회차(N1 개입·채점·진화)
  n1: { q: 0.2, age: 90, step: 0.1, recentH: 72, storeQ: 0.3, storeAge: 60, cap: 800, ctlCap: 800, horizonD: 7, ratio: 0.6, minN: 30 }, // N1: 하위 q · 재고 age일 · 후보 = 값×(1-step)과 같은 등급 최저-100 중 낮은 것(바닥 아래로는 안 감)
  promoteRun: 3, rollbackRun: 2, challMaxD: 14, failRepeat: 3, failWinD: 7, // 3번 이어 나으면 올림 · 2번 이어 지면 되돌림 · 도전자 14일 지나면 은퇴 · 같은 실패 7일 안 3번이면 후보
  aucMin: 0.70, learnStaleH: 36, healH: 48, freshH: 12, cardFail: 2,
};
/* ① 등록부 — id · 이름 · 파일 · can 할 수 있는 일 · out 내는 문서 · needs 필요한 엔진 · hb 살아 있음(문서·때 칸·maxH) · n 결과 수 칸 */
const ENGINES = [
  { id: 'judge', t: '⚖ 가격 판정', file: 'readnow-pricing-core.js decide()', can: ['값 후보(내림·올림·그대로)', '바닥(매입가) 지킴'], out: ['prd_price_decisions'], needs: ['learn', 'value', 'cons', 'saud', 'bench', 'edition'], hb: { doc: 'app_settings/eng_wires', at: 'at', n: 'decs', maxH: 36 } },
  { id: 'ctrl', t: '🗼 관제창 울타리', file: 'readnow-pricing-core.js ReadnowCtrl', can: ['하루 내림 한도', '묶음 자동 멈춤', '무손해 모드'], out: ['app_settings/eng_fence_now', 'eng_fence_ledger'], needs: ['judge'], hb: { doc: 'app_settings/eng_fence_now', at: 'at', n: 'dayLoss', maxH: 30 } },
  { id: 'value', t: '🪶 판매가치', file: 'readnow-ml-core.js valueOf()', can: ['책마다 팔릴 값·때 예측'], out: ['app_settings/value_model'], needs: ['bench'], hb: { doc: 'app_settings/value_model', at: 'trainedAt', n: 'pos', maxH: 48 } },
  { id: 'learn', t: '🧠 팔릴 확률', file: 'readnow-ml-core.js train()', can: ['7일 팔릴 확률(ml_shadow)', '챔피언·도전자 승격'], out: ['app_settings/ml_state', 'app_settings/ml_health', 'ml_shadow'], needs: ['bench'], hb: { doc: 'app_settings/ml_health', at: 'lastOkAt', n: 'rows', maxH: 36 } },
  { id: 'engself', t: '🤖 연구 엔진 스스로', file: 'cloud/engself.js', can: ['가설 판정', '배선 단계 올림·내림'], out: ['app_settings/eng_self', 'app_settings/eng_wire_stage'], needs: ['learn', 'cons', 'judge'], hb: { doc: 'app_settings/eng_self', at: 'at', n: null, maxH: 32 } },
  { id: 'health', t: '🩺 연구 건강 장부', file: 'cloud/reshealth.js', can: ['늦은 연구 다시 부름', '실패 카드'], out: ['app_settings/research_health'], needs: ['engself', 'cons', 'value', 'learn', 'bench', 'edition', 'net'], hb: { doc: 'app_settings/research_health', at: 'at', n: null, maxH: 2 } },
  { id: 'cons', t: '🛒 소비심리', file: 'cloud/index.js consStudy', can: ['내일 주문 ±% 신호'], out: ['app_settings/cons_study'], needs: [], hb: { doc: 'app_settings/cons_study', at: 'at', n: 'tot.orders', maxH: 30 } },
  { id: 'bench', t: '🏢 견줌 관측', file: 'cloud/index.js benchObsTick', can: ['다른 판매자 대리 표본(헌장 제43조)'], out: ['app_settings/bench_obs'], needs: [], hb: { doc: 'app_settings/bench_obs', at: 'at', n: 'chk', maxH: 30 } },
  { id: 'saud', t: '👥 판매자 가치', file: 'cloud/index.js sellerAudStudy', can: ['판매자 무게(비교 대상)'], out: ['app_settings/seller_aud'], needs: ['bench'], hb: { doc: 'app_settings/seller_aud', at: 'at', n: 'items', maxH: 30 } },
  { id: 'edition', t: '📚 판본 추적', file: 'cloud/edition.js', can: ['리커버·한정판 판본 가려냄'], out: ['app_settings/ed_study'], needs: [], hb: { doc: 'app_settings/ed_study', at: 'at', n: null, maxH: 30 } },
  { id: 'strat', t: '🎯 전략 실행', file: 'cloud/index.js stratRun', can: ['배정된 전략 실행'], out: ['app_settings/strat_run'], needs: ['judge', 'ctrl'], hb: { doc: 'app_settings/strat_run', at: 'lastRun', n: null, maxH: 2 } },
  { id: 'jledger', t: '📒 판정 장부(engimp1)', file: 'engimp1 몫 — eng_judge_days 장부 · app_settings/eng_judge 채점 요약(reports/ENGIMP1_1119.md 0-2)', can: ['판정마다 7·14·30일 결과 채점', '규칙별 좋음·나쁨·아직 모름'], out: ['app_settings/eng_judge', 'eng_judge_days'], needs: ['judge'], hb: { doc: 'app_settings/eng_judge', at: 'at', n: 'rows', maxH: 30 }, pending: true },
  { id: 'net', t: '🕸 엔진 연결망', file: 'cloud/engnet.js', can: ['서로 보고 개입', '규칙 채점·올림·되돌림'], out: ['app_settings/eng_net', 'eng_net_day'], needs: ['judge', 'ctrl', 'learn', 'engself', 'health'], hb: { doc: 'app_settings/eng_net', at: 'lightAt', n: null, maxH: 2 } },
];
/* ② 개입 규칙 — watch 보는 엔진 · act 개입하는 엔진 · via 거치는 엔진 · score 채점(없으면 cand에서 못 나감) */
const RULES = [
  { id: 'N1', t: '「안 팔림」 → 값 후보', watch: ['learn', 'value'], act: 'judge', via: ['ctrl'], scoredBy: 'net', score: { how: '7일 뒤 표시한 상품 판매율 ≤ 같은 날 대조 판매율 × ratio 이면 통과(표본 minN 넘을 때만)', horizonD: 7 }, stage0: 'shadow', evolve: true },
  { id: 'N2', t: '배우기 아픔 → 배선 올림 멈춤 권고', watch: ['learn'], act: 'engself', via: [], scoredBy: 'health', score: { how: '권고 뒤 48시간 안에 배우기가 나으면 통과', horizonD: 2 }, stage0: 'shadow' },
  { id: 'N3', t: '재료 묵음 → 아래 엔진 표시', watch: ['*'], act: 'health', via: [], scoredBy: 'net', score: { how: '12시간 안에 재료가 다시 신선해지면 통과', horizonD: 0.5 }, stage0: 'shadow' },
  { id: 'N4', t: '무손해 울타리 ↔ 돈 배선 단계', watch: ['ctrl', 'engself'], act: 'engself', via: [], scoredBy: 'net', score: { how: '무손해 모드 동안 새로 3단계 넘게 오른 돈 배선 0개면 통과', horizonD: 0 }, stage0: 'shadow' },
  { id: 'N5', t: '판정 장부 채점 → N1 무게', watch: ['jledger'], act: 'net', via: [], scoredBy: 'jledger', score: null, stage0: 'cand' },
];
const STAGES = ['cand', 'shadow', 'advice']; // 돈 단계 없음

const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const kstHour = (ms) => new Date(ms + 9 * 3600e3).getUTCHours();
const getP = (o, p) => { if (!p) return undefined; let x = o; for (const s of String(p).split('.')) { if (x == null || typeof x !== 'object') return undefined; x = x[s]; } return x; };
const toMs = (x) => { if (x == null) return null; if (typeof x === 'number') return x > 1e12 ? x : null; if (x && typeof x.toDate === 'function') return x.toDate().getTime(); if (x && typeof x._seconds === 'number') return x._seconds * 1000; const t = Date.parse(String(x)); return Number.isFinite(t) ? t : null; };
const enClean = (x) => JSON.parse(JSON.stringify(x, (k, v) => (v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? null : v)));
const r3 = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);
const merge = (a, b) => { const r = { ...a }; for (const [k, v] of Object.entries(b || {})) r[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? { ...a[k], ...v } : v; return r; };

/* 엔진 하나 살아 있음 → { st: ok|late|zero|none|wait, ageH, n } */
function hbJudge(E, d, nowMs) {
  if (!d) return { st: E.pending ? 'wait' : 'none', ageH: null, n: null };
  const t = toMs(getP(d, E.hb.at)); const ageH = t == null ? null : Math.round((nowMs - t) / 36e5 * 10) / 10;
  const nv = E.hb.n ? getP(d, E.hb.n) : null; const n = typeof nv === 'number' ? nv : null;
  let st = 'ok'; if (t == null || ageH > E.hb.maxH) st = 'late'; else if (E.hb.n && n === 0) st = 'zero';
  return { st, ageH, n };
}
/* 묵은 엔진 → 그 엔진을 (곧바로·건너서) 필요로 하는 엔진들 */
function downstream(id) { const out = new Set(); const q = [id]; while (q.length) { const x = q.shift(); for (const E of ENGINES) if (E.needs.includes(x) && !out.has(E.id) && E.id !== id) { out.add(E.id); q.push(E.id); } } return [...out]; }
/* 지도 선 — 누가 누구를 보는지(needs · 규칙 watch→act) */
function edges() { const L = []; for (const E of ENGINES) for (const n of E.needs) L.push({ from: n, to: E.id, kind: 'needs' }); for (const R of RULES) for (const w of R.watch) if (w !== '*') L.push({ from: w, to: R.act, kind: 'rule', rule: R.id }); return L; }

/* N1 — 하루 모습 줄(rows: key·price·age·sameMin·bb·list·act)과 팔릴 확률(PC Map) → 저장할 위(superset)·대조 줄 · 후보 값 · 울타리 */
function n1Pick(rows, PC, P, ctx) { ctx = ctx || {}; const locks = ctx.locks || new Set(); const floorOf = ctx.floorOf || ((bb) => (+bb > 0 ? +bb : 0));
  const live = rows.filter((r) => r && r.key && PC.has(r.key) && +r.price > 0 && r.age != null);
  const pcs = live.map((r) => PC.get(r.key)).sort((a, b) => a - b); const rankOf = (p) => { let lo = 0, hi = pcs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pcs[m] < p) lo = m + 1; else hi = m; } return pcs.length ? lo / pcs.length : null; };
  const F = [], Ctl = [], skip = { recent: 0, lock: 0, floor: 0 };
  for (const r of live) { const pr = rankOf(PC.get(r.key)); if (r.age < P.storeAge) continue;
    if (locks.has(r.key) || locks.has(String(r.key).replace(/^aladin_/, ''))) { skip.lock++; continue; }
    if (r.act != null && r.act < P.recentH) { skip.recent++; continue; }
    if (pr <= P.storeQ) { const fl = Math.max(0, +floorOf(r.bb, r.list) || 0); let c = Math.floor((+r.price * (1 - P.step)) / 100) * 100; if (r.sameMin != null && +r.sameMin > 0) c = Math.min(c, Math.floor((+r.sameMin - 100) / 100) * 100); if (c < fl) c = Math.ceil(fl / 100) * 100;
      const cand = c < +r.price ? c : null; if (cand == null) skip.floor++; F.push({ key: r.key, pr: r3(pr), pc: r3(PC.get(r.key)), age: r.age, price: +r.price, cand, floor: fl || null }); }
    else Ctl.push({ key: r.key, pr: r3(pr), age: r.age }); }
  F.sort((a, b) => a.pr - b.pr || b.age - a.age);
  return { F: F.slice(0, P.cap), Ctl: Ctl.filter((_, i) => i % Math.max(1, Math.ceil(Ctl.length / P.ctlCap)) === 0).slice(0, P.ctlCap), skip, live: live.length }; }
/* 관제창 울타리 — 무손해 모드면 모두 「기록만」 · 아니면 하루 내림 한도(dayLoss)까지 「통과」 그 뒤 「한도 넘음」 · 후보 없음은 「바닥」 */
function n1Fence(F, fence) { const noLoss = !!(fence && fence.noLoss); const lim = +(fence && fence.dayLoss) || 0; let sum = 0; const cnt = { noLoss: 0, pass: 0, over: 0, floor: 0 };
  for (const x of F) { if (x.cand == null) { x.fence = 'floor'; cnt.floor++; continue; } const d = x.price - x.cand; if (noLoss) { x.fence = 'noLoss'; cnt.noLoss++; continue; } if (lim && sum + d > lim) { x.fence = 'over'; cnt.over++; continue; } sum += d; x.fence = 'pass'; cnt.pass++; }
  return { ...cnt, sum, lim, noLoss }; }
/* N1 채점 — 저장한 날 줄을 매개변수(q·age)로 다시 갈라 7일 판매와 맞춤 · sold(key) → bool */
function n1Score(dayDoc, prm, P, sold) { const nm = (x) => ({ key: x.key != null ? x.key : x.k, pr: x.pr, age: x.age != null ? x.age : x.a }); /* 저장 줄은 짧은 이름(k·a) */ const F = (dayDoc.F || []).map(nm).filter((x) => x.pr <= prm.q && x.age >= prm.age); const Ct = (dayDoc.Ctl || []).map(nm).filter((x) => x.age >= prm.age);
  const sF = F.filter((x) => sold(x.key)).length, sC = Ct.filter((x) => sold(x.key)).length; const srF = F.length ? sF / F.length : null, srC = Ct.length ? sC / Ct.length : null;
  const enough = F.length >= P.minN && Ct.length >= P.minN; const pass = enough && srC != null ? srF <= srC * P.ratio : null;
  return { nF: F.length, nC: Ct.length, sF, sC, srF: r3(srF), srC: r3(srC), lift: srF != null && srC ? r3(srF / srC) : null, pass, enough }; }
/* 진화 한 걸음 — 규칙 상태 S(stage·champ·chall·passRun·failRun) · 오늘 채점 sc(champ)·scC(chall) → 새 S와 일어난 일 */
function evolveStep(S, sc, scC, cfg, day) { S = { ...S }; const ev = [];
  if (sc && sc.pass != null) { if (sc.pass) { S.passRun = (S.passRun || 0) + 1; S.failRun = 0; } else { S.failRun = (S.failRun || 0) + 1; S.passRun = 0; } }
  if (S.chall && scC && scC.pass != null && sc && sc.pass != null) { const better = (scC.pass && !sc.pass) || (scC.pass === sc.pass && scC.lift != null && sc.lift != null && scC.lift <= sc.lift - 0.1); S.chall = { ...S.chall, winRun: better ? (S.chall.winRun || 0) + 1 : 0 };
    if (S.chall.winRun >= cfg.promoteRun) { ev.push({ d: day, k: 'swap', why: `도전자 ${JSON.stringify(S.chall.p)}가 ${cfg.promoteRun}번 이어 나음 → 챔피언으로`, from: S.champ, to: S.chall.p }); S.prev = S.champ; S.champ = S.chall.p; S.chall = null; S.swapAt = day; S.passRun = 0; S.failRun = 0; } }
  if (S.chall && S.chall.born && (Date.parse(day) - Date.parse(S.chall.born)) / 864e5 > cfg.challMaxD) { ev.push({ d: day, k: 'retire', why: `도전자 ${cfg.challMaxD}일 동안 못 이김 → 은퇴` }); S.chall = null; }
  if (S.swapAt && S.prev && S.failRun >= cfg.rollbackRun) { ev.push({ d: day, k: 'rollback', why: `바꾼 뒤 ${cfg.rollbackRun}번 이어 짐 → 앞 챔피언으로 되돌림`, from: S.champ, to: S.prev }); S.champ = S.prev; S.prev = null; S.swapAt = null; S.failRun = 0; }
  if (S.stage === 'shadow' && S.passRun >= cfg.promoteRun) { S.stage = 'advice'; ev.push({ d: day, k: 'up', why: `채점 ${cfg.promoteRun}번 이어 통과 → 조언(웹앱에 보임 · 값은 안 바꿈)` }); }
  else if (S.stage === 'advice' && S.failRun >= cfg.rollbackRun) { S.stage = 'shadow'; ev.push({ d: day, k: 'down', why: `채점 ${cfg.rollbackRun}번 이어 못 미침 → 그림자로 내림` }); }
  return { S, ev }; }
/* 실패 기록 → 규칙 후보 — 같은 (rule,kind)가 failWinD일 안 failRepeat번이면 태어남 */
function failToCand(fails, cfg, nowMs) { const t0 = nowMs - cfg.failWinD * 864e5; const G = new Map(); for (const f of fails || []) { if (toMs(f.at) < t0) continue; const k = f.rule + '|' + f.kind; G.set(k, (G.get(k) || 0) + 1); } return [...G].filter(([, n]) => n >= cfg.failRepeat).map(([k, n]) => { const [rule, kind] = k.split('|'); return { rule, kind, n }; }); }
/* N1 도전자 만들기 — 지는 쪽이면 더 좁게(하위 q 절반 · 재고 +60일), 표본이 모자라 못 채점이면 넓게 */
function n1Challenger(champ, kind, P) { if (kind === 'small') return { q: Math.min(P.storeQ, r3(champ.q + 0.05)), age: Math.max(P.storeAge, champ.age - 30) }; return { q: Math.max(0.05, r3(champ.q / 2)), age: champ.age + 60 }; }

/* D: { C, W, log, nowIso, now?, get(path, fields), jobsOn?(), notes?(ops, by), mlDay(day) → rows, shadow(day) → {keys,pc,at}, mlDays() → [날], sales(fromIso) → Map(usedCode → [{at}]), locks?() → Set, floorOf?(bb, list) } */
function makeEngNet(D) {
  const now = D.now || (() => Date.now());
  const get = D.get || (async (p) => { const [c, id] = p.split('/'); const s = await D.C(c).doc(id).get(); return s.exists ? s.data() : null; });
  const SUM = () => D.C('app_settings').doc('eng_net'); const EVO = () => D.C('app_settings').doc('eng_net_evo'); const DAY = (d) => D.C('eng_net_day').doc(d);
  let lightAt = 0, busy = false;
  async function cfg() { const c = (await get('app_settings/eng_net_cfg').catch(() => null)) || {}; return merge(EN_DEF, c); }
  async function evoGet() { const e = (await get('app_settings/eng_net_evo').catch(() => null)) || {}; const R = e.rules || {}; for (const r of RULES) if (!R[r.id]) R[r.id] = { stage: r.score ? r.stage0 : 'cand', passRun: 0, failRun: 0, hist: [], ...(r.id === 'N1' ? { champ: { q: EN_DEF.n1.q, age: EN_DEF.n1.age }, chall: null } : {}) }; return { rules: R, fails: Array.isArray(e.fails) ? e.fails : [], cands: Array.isArray(e.cands) ? e.cands : [], log: Array.isArray(e.log) ? e.log : [], open: e.open || {} }; }
  const failAdd = (E, rule, kind, why) => { E.fails = [{ at: D.nowIso(), rule, kind, why: String(why || '').slice(0, 160) }, ...E.fails].slice(0, 200); };
  const logAdd = (E, x) => { E.log = [{ at: D.nowIso(), ...x }, ...E.log].slice(0, 120); };

  /* 가벼운 회차 — 살아 있음 · N2·N3·N4·N5 (문서 몇 개만) */
  async function light(C0, E, nowMs) { const today = kstDay(nowMs); const docs = {}; const eng = {};
    for (const X of ENGINES) { if (X.id === 'net') continue; let d = null; try { d = await get(X.hb.doc, [X.hb.at, X.hb.n].filter(Boolean)); } catch (e) { d = null; } eng[X.id] = hbJudge(X, d, nowMs); }
    for (const p of ['app_settings/eng_fence', 'app_settings/eng_wire_stage', 'app_settings/ml_health']) docs[p] = (await get(p).catch(() => null)) || null;
    const act = []; const O = E.open; // O: 열린 개입(채점 기다림) {id: {rule, at, key, ...}}
    // N3 재료 묵음 → 아래 엔진
    for (const [id, h] of Object.entries(eng)) { const k = 'N3:' + id; if (h.st === 'late' || h.st === 'zero' || h.st === 'none') { const dn = downstream(id); if (!O[k]) { O[k] = { rule: 'N3', at: D.nowIso(), eng: id, st: h.st, down: dn }; act.push({ rule: 'N3', eng: id, why: `${ENGINES.find((x) => x.id === id).t} ${h.st === 'zero' ? '결과 0' : h.st === 'none' ? '문서 없음' : `${h.ageH}시간 묵음`} → 아래 엔진 ${dn.length}개(${dn.join('·')})에 「재료 묵음」`, down: dn }); } }
      else if (O[k]) { const hrs = (nowMs - toMs(O[k].at)) / 36e5; scoreAdd(E, 'N3', hrs <= C0.freshH, { eng: id, hrs: r3(hrs) }, today); delete O[k]; } }
    for (const [k, o] of Object.entries(O)) if (o.rule === 'N3' && (nowMs - toMs(o.at)) / 36e5 > C0.freshH && !o.missed) { o.missed = true; scoreAdd(E, 'N3', false, { eng: o.eng, hrs: C0.freshH }, today); failAdd(E, 'N3', 'stale:' + o.eng, `${o.eng} 재료가 ${C0.freshH}시간 넘게 안 돌아옴`); }
    // N2 배우기 아픔
    const mh = docs['app_settings/ml_health'] || {}; const okAge = toMs(mh.lastOkAt) ? (nowMs - toMs(mh.lastOkAt)) / 36e5 : null; const sick = !!(mh.alert || (+mh.fails || 0) >= 1 || (mh.auc != null && +mh.auc < C0.aucMin) || okAge == null || okAge > C0.learnStaleH);
    if (sick && !O.N2) { O.N2 = { rule: 'N2', at: D.nowIso(), why: mh.alert ? '이어서 실패' : (mh.auc != null && +mh.auc < C0.aucMin) ? `AUC ${r3(+mh.auc)} < ${C0.aucMin}` : okAge == null ? '배운 적 없음' : `${Math.round(okAge)}시간 못 배움` }; act.push({ rule: 'N2', why: `🧠 팔릴 확률이 아픔(${O.N2.why}) → 🤖 연구 엔진에 「W00·W01 배선 올리지 말 것」 권고` }); }
    else if (!sick && O.N2) { const hrs = (nowMs - toMs(O.N2.at)) / 36e5; scoreAdd(E, 'N2', hrs <= C0.healH, { hrs: r3(hrs) }, today); if (hrs > C0.healH) failAdd(E, 'N2', 'slowHeal', `배우기가 ${Math.round(hrs)}시간 만에 나음`); delete O.N2; }
    // N4 무손해 ↔ 돈 배선
    const fz = docs['app_settings/eng_fence'] || {}; const ws = (docs['app_settings/eng_wire_stage'] || {}).w || {}; const money = new Set((D.wireDefs ? D.wireDefs() : []).filter((w) => w && w.money).map((w) => w.id)); const nlDay = fz.noLossAt ? kstDay(toMs(fz.noLossAt)) : null; const clash = [];
    if (fz.noLossMode) for (const [wid, v] of Object.entries(ws)) { if (!money.has(wid)) continue; for (const L of (v && v.log) || []) if (L && +L.to >= 3 && +L.to > +L.from && (!nlDay || String(L.d) >= nlDay)) clash.push({ w: wid, d: L.d, to: L.to }); }
    { const k = 'N4:' + today; if (!E.rules.N4.lastDay || E.rules.N4.lastDay !== today) { E.rules.N4.lastDay = today; scoreAdd(E, 'N4', clash.length === 0, { clash: clash.length }, today); if (clash.length) { act.push({ rule: 'N4', why: `무손해 모드인데 돈 배선 ${clash.map((c) => c.w + '→' + c.to).join('·')} 올라감 → 2단계로 되돌림 권고`, clash }); failAdd(E, 'N4', 'clash', clash.map((c) => c.w).join('·')); } } void k; }
    // N5 판정 장부(engimp1) — 있으면 읽기만
    const jl = eng.jledger || {}; let jv = '';
    if (jl.st === 'ok' || jl.st === 'zero') { try { const J = (await get('app_settings/eng_judge', ['rules', 'rows', 'value'])) || {}; const rr = Array.isArray(J.rules) ? J.rules : []; const cnt = (w) => rr.filter((r) => r && r.verdict === w).length; jv = ` · 장부 ${+J.rows || 0}줄 · 규칙 좋음 ${cnt('좋음')}·나쁨 ${cnt('나쁨')}·아직 모름 ${cnt('아직 모름')}${J.value && J.value.auc != null ? ' · 값 AUC ' + r3(+J.value.auc) : ''}`; E.rules.N5.judge = { rows: +J.rows || 0, good: cnt('좋음'), bad: cnt('나쁨'), unk: cnt('아직 모름') }; } catch (e) { jv = ''; } }
    E.rules.N5.note = jl.st === 'wait' ? 'engimp1 판정 장부 요약(app_settings/eng_judge)이 아직 없음 — 생기면 규칙별 좋음·나쁨을 N1 무게로 읽음(채점 없이는 후보에 머묾)' : `판정 장부 ${jl.st} · ${jl.ageH}시간 전${jv}`;
    if (jl.st === 'ok' && E.rules.N5.stage === 'cand') { E.rules.N5.stage = 'shadow'; logAdd(E, { rule: 'N5', k: 'up', why: '판정 장부가 생김 → 그림자(채점 읽기 시작)' }); }
    return { eng, act, fence: { noLoss: !!fz.noLossMode } }; }
  function scoreAdd(E, rid, pass, x, day) { const R = E.rules[rid]; R.hist = [{ d: day, at: D.nowIso(), pass: !!pass, ...x }, ...(R.hist || [])].slice(0, 60); R.n = (R.n || 0) + 1; R.hit = (R.hit || 0) + (pass ? 1 : 0);
    if (rid !== 'N1') { const st = evolveStep(R, { pass: !!pass }, null, E.cfg, day); Object.assign(R, st.S); st.ev.forEach((v) => logAdd(E, { rule: rid, ...v })); } }

  /* 무거운 회차 — N1 오늘 개입 · 지난날 채점 · 진화 */
  async function heavy(C0, E, nowMs, L) { const today = kstDay(nowMs); const P = C0.n1; const out = { day: today };
    const days = ((await D.mlDays()) || []).filter((d) => d <= today).sort(); const day = days[days.length - 1]; if (!day) return { skip: '하루 모습 없음' };
    let sh = await D.shadow(day).catch(() => null), shDay = day; if (!sh) { const pv = days.filter((d) => d < day).pop(); if (pv) { sh = await D.shadow(pv).catch(() => null); shDay = pv; } } if (!sh) return { skip: '팔릴 확률 그림자 없음' };
    const prevDoc = await DAY(today).get().catch(() => null); const already = prevDoc && prevDoc.exists && (prevDoc.data() || {}).F;
    if (!already) { const rows = (await D.mlDay(day)) || []; const PC = new Map(); sh.keys.forEach((k, i) => { if (sh.pc[i] != null) PC.set(k, +sh.pc[i]); }); const locks = D.locks ? await D.locks().catch(() => new Set()) : new Set();
      const pk = n1Pick(rows, PC, P, { locks, floorOf: D.floorOf }); const fz = n1Fence(pk.F, { noLoss: L.fence.noLoss, dayLoss: ((await get('app_settings/eng_fence_now').catch(() => null)) || {}).dayLoss });
      const ch = E.rules.N1.champ, nowN = pk.F.filter((x) => x.pr <= ch.q && x.age >= ch.age).length;
      await DAY(today).set(enClean({ v: EN_V, day: today, mlDay: day, shDay, at: D.nowIso(), champ: ch, chall: E.rules.N1.chall ? E.rules.N1.chall.p : null, P: { storeQ: P.storeQ, storeAge: P.storeAge, step: P.step, recentH: P.recentH }, live: pk.live, skip: pk.skip, fence: fz, nNow: nowN, F: pk.F.map((x) => ({ k: x.key, pr: x.pr, pc: x.pc, a: x.age, p: x.price, c: x.cand, f: x.fence })), Ctl: pk.Ctl.map((x) => ({ k: x.key, pr: x.pr, a: x.age })), ...D.W() }));
      out.n1 = { live: pk.live, stored: pk.F.length, ctl: pk.Ctl.length, now: nowN, fence: fz, skip: pk.skip }; L.act.push({ rule: 'N1', why: `🧠 팔릴 확률 하위 ${Math.round(ch.q * 100)}% · 재고 ${ch.age}일 넘은 상품 ${nowN}개 → ⚖ 판정 값 후보 → 🗼 울타리 ${fz.noLoss ? '무손해 모드라 모두 기록만' : `통과 ${fz.pass} · 한도 넘음 ${fz.over}`} (바닥 ${fz.floor}) — 값은 안 바꿈`, n: nowN }); }
    else out.n1 = { already: true };
    // 지난날 채점(7일 지난 날 · 아직 안 한 날)
    const R1 = E.rules.N1; const done = new Set((R1.hist || []).map((h) => h.d)); const due = []; for (let i = P.horizonD; i <= P.horizonD + 6; i++) { const d = kstDay(nowMs - i * 864e5); if (!done.has(d)) due.push(d); }
    const docs = []; for (const d of due.sort()) { const s = await DAY(d).get().catch(() => null); if (s && s.exists && (s.data() || {}).F && !(s.data() || {}).scored) docs.push([d, s.data()]); }
    if (docs.length) { const sales = await D.sales(new Date(Date.parse(docs[0][0] + 'T01:00:00+09:00')).toISOString()); out.scored = [];
      for (const [d, x] of docs) { const t0 = Date.parse(d + 'T01:00:00+09:00'), t1 = t0 + P.horizonD * 864e5; const sold = (k) => (sales.get(String(k).replace(/^aladin_/, '')) || []).some((s) => s.at > t0 && s.at <= t1);
        const sc = n1Score(x, R1.champ, P, sold), scC = R1.chall ? n1Score(x, R1.chall.p, P, sold) : null;
        await DAY(d).set({ scored: enClean({ at: D.nowIso(), champ: { p: R1.champ, ...sc }, chall: scC ? { p: R1.chall.p, ...scC } : null }) }, { merge: true });
        R1.hist = [{ d, at: D.nowIso(), pass: sc.pass, nF: sc.nF, nC: sc.nC, srF: sc.srF, srC: sc.srC, lift: sc.lift, chall: scC ? { p: R1.chall.p, pass: scC.pass, lift: scC.lift, nF: scC.nF } : null }, ...(R1.hist || [])].slice(0, 60);
        if (sc.pass != null) { R1.n = (R1.n || 0) + 1; R1.hit = (R1.hit || 0) + (sc.pass ? 1 : 0); }
        if (sc.pass === false) failAdd(E, 'N1', 'miss', `${d} 표시 판매율 ${sc.srF} > 대조 ${sc.srC}×${P.ratio}`); else if (sc.pass == null) failAdd(E, 'N1', 'small', `${d} 표본 모자람(표시 ${sc.nF} · 대조 ${sc.nC})`);
        const st = evolveStep(R1, sc, scC, C0, d); Object.assign(E.rules.N1, st.S); st.ev.forEach((v) => logAdd(E, { rule: 'N1', ...v })); out.scored.push({ d, ...sc }); } }
    // 실패 → 규칙 후보(도전자)
    for (const c of failToCand(E.fails, C0, nowMs)) { if (c.rule === 'N1' && !E.rules.N1.chall) { const p = n1Challenger(E.rules.N1.champ, c.kind, P); E.rules.N1.chall = { p, born: today, from: c.kind, winRun: 0 }; logAdd(E, { rule: 'N1', k: 'born', why: `실패 「${c.kind}」 ${c.n}번(7일) → 도전자 ${JSON.stringify(p)} 태어남(그림자에서 함께 채점)` }); }
      else if (c.rule !== 'N1' && !E.cands.some((x) => x.rule === c.rule && x.kind === c.kind)) { E.cands = [{ at: D.nowIso(), rule: c.rule, kind: c.kind, n: c.n, stage: 'cand', t: c.rule === 'N3' ? `${c.kind.replace('stale:', '')} 재료가 자꾸 묵음 → 그 일 일정을 앞당기자는 후보(채점 방법이 정해질 때까지 기록만)` : `${c.rule} 「${c.kind}」 반복 → 문턱 다시 보기 후보(기록만)` }, ...E.cands].slice(0, 30); } }
    return out; }

  async function run(o) { o = o || {}; const nowMs = now(); const C0 = await cfg(); if (C0.on === false || (D.jobsOn && !(await D.jobsOn()))) return { skip: 'off' };
    if (!o.force && nowMs - lightAt < C0.lightMin * 60e3) return null; if (busy) return { skip: 'busy' }; busy = true; lightAt = nowMs; const t0 = nowMs;
    const prev = (await get('app_settings/eng_net').catch(() => null)) || {}; const today = kstDay(nowMs);
    try { const E = await evoGet(); E.cfg = C0; const L = await light(C0, E, nowMs); let H = null;
      const wantHeavy = o.heavy || (kstHour(nowMs) >= C0.heavyHourKST && prev.heavyDay !== today);
      if (wantHeavy) { try { H = await heavy(C0, E, nowMs, L); } catch (e) { H = { err: String(e.message || e).slice(0, 200) }; } }
      const T0 = prev.today && prev.today.day === today ? prev.today : { day: today, n: 0, by: {} }; for (const a of L.act) { T0.n++; T0.by[a.rule] = (T0.by[a.rule] || 0) + 1; }
      const acts = [...L.act.map((a) => ({ at: D.nowIso(), ...a })), ...(prev.acts || [])].slice(0, 60);
      const heavyOk = H && !H.err && !H.skip; const errN = H && H.err ? (+prev.errN || 0) + 1 : heavyOk ? 0 : +prev.errN || 0;
      const rules = RULES.map((r) => { const S = E.rules[r.id] || {}; return { id: r.id, t: r.t, watch: r.watch, act: r.act, via: r.via, scoredBy: r.scoredBy, score: r.score ? r.score.how : null, stage: S.stage, n: S.n || 0, hit: S.hit || 0, passRun: S.passRun || 0, failRun: S.failRun || 0, last: (S.hist || [])[0] || null, champ: S.champ || null, chall: S.chall || null, note: S.note || null, today: T0.by[r.id] || 0 }; });
      const doc = { v: EN_V, at: D.nowIso(), lightAt: D.nowIso(), day: today, heavyAt: heavyOk ? D.nowIso() : prev.heavyAt || null, heavyDay: heavyOk ? today : prev.heavyDay || null, heavy: H || prev.heavy || null, errN, cardDay: prev.cardDay || null,
        engines: ENGINES.map((x) => ({ id: x.id, t: x.t, file: x.file, can: x.can, out: x.out, needs: x.needs, pending: !!x.pending, ...(x.id === 'net' ? { st: errN >= C0.cardFail ? 'late' : 'ok', ageH: 0, n: null } : L.eng[x.id]) })),
        edges: edges(), rules, today: T0, acts, cands: E.cands.slice(0, 10), evo: E.log.slice(0, 20), fails: E.fails.slice(0, 20), ms: Date.now() - t0 };
      await SUM().set(enClean({ ...doc, ...D.W() })); delete E.cfg; await EVO().set(enClean({ v: EN_V, at: D.nowIso(), ...E, ...D.W() }));
      if (errN >= C0.cardFail && D.notes && prev.cardDay !== today) { try { await D.notes([{ op: 'merge', id: 'en_' + today, data: { kind: 'card', state: 'open', cat: '연구', title: '🕸 엔진 연결망 회차가 이어서 실패', body: `무거운 회차 ${errN}번 이어 실패 — ${String((H && H.err) || '').slice(0, 120)} · 값은 안 바꿈 · 끄기 cloud_jobs.engnet=false`, at: D.nowIso() } }], 'engine:net'); await SUM().set({ cardDay: today }, { merge: true }); } catch (e) {} }
      return { ok: true, act: L.act.length, heavy: H, ms: Date.now() - t0 }; }
    catch (e) { try { await SUM().set({ lightErr: String(e.message || e).slice(0, 200), lightErrAt: D.nowIso() }, { merge: true }); } catch (x) {} D.log && D.log('🕸 엔진 연결망 실패', e.message); return { err: String(e.message || e).slice(0, 200) }; }
    finally { busy = false; } }
  async function diag(q) { q = q || {}; if (q.engnet === 'run') return run({ force: true, heavy: true }); if (q.engnet === 'day') { const d = String(q.d || kstDay(now())); const s = await DAY(d).get(); const v = s.exists ? s.data() : null; return v ? { ...v, F: (v.F || []).slice(0, +q.n || 20), Ctl: (v.Ctl || []).length } : null; } return get('app_settings/eng_net'); }
  return { run, tick: (o) => run(o), diag };
}
module.exports = { EN_V, EN_DEF, ENGINES, RULES, STAGES, hbJudge, downstream, edges, n1Pick, n1Fence, n1Score, evolveStep, failToCand, n1Challenger, makeEngNet };
