'use strict';
/* (engimp1 11/19 · 정범님 j1118eng3 「설계에서 끝내는 게 아니라 실제로 작동하는 것까지」 · 설계 readnow-chats reports/ENGDES1_1118.md 2~3장 · 자료 모양 reports/ENGIMP1_1119.md 0장)
 *  💲 판정 엔진 배움 — 하루 한 번(한국 11시 뒤 · 스스로 배우기 2~6시와 안 겹침)
 *   ① 판정 장부 eng_judge_days/{날짜}_{조각} — 판정 문서(prd_price_decisions)마다 한 줄(같은 지문이면 「며칠째 같음」만 +1) · 칸 묶음 2000줄씩 · 판매자 이름·코드·손님 칸 없음 · 지우지 않음
 *      첫 실행은 지금 있는 판정 문서를 모두 한 번 담음(새 판정이 0이어도 장부가 빔이 아니게 — F47 감시 적용 0%)
 *   ② 결과 붙이기 — 7·14·30일 안 팔림·팔린 값·날(판매 장부 crm_orders · 스스로 배우기와 같은 mlSales) · 팔리거나 60일이면 닫음 · 따랐나(fol)
 *   ④ 채점 — 판매확률 logloss·AUC·ECE(10칸 · 20줄 안 되는 칸 뺌 · 남은 칸 3개 밑이면 아직 모름) · 규칙별 표(가 관찰 · 추정 / 나 같은 칸 대조 · 짝 20 밑이면 모름 / 다 실험 = 0 무손해) · 후회 셈(추정)
 *      → app_settings/eng_judge (카드가 열 때 한 번 읽음) · 헌장 제43조 대리 표본 수·사라짐 보정 확률을 늘 함께
 *   ⑤ 그림자 도전자 — 가 묶음 손잡이(gradeCoef 상·중 · queueGapMult) 한 칸씩 · 지금 판정 문서 표본(하루 300)을 같은 엔진으로 다시 판정 → 하루 기대 값어치(판매확률 모델) 견줌 · 겹치지 않는 7일 창 3개
 *   ⑥ 올림·되돌리기 — 조건(맞춘 30·팔림 10·3창 연속 +2%·예측 믿을 만함·울타리 넘음 0·판매율 안 낮음)을 다 채우면: 무손해 모드이거나 장부 30일 안이면 「제안」(카드에서 두 번 눌러 올림) · 아니면 가 묶음만 스스로 한 칸
 *      올린 뒤 14일 거꾸로 그림자 → 옛 값이 2번 이기거나 하루 손실 한도(5%)를 넘으면 스스로 되돌리고 그 손잡이 30일 쉼 · 카드 되돌리기(두 번 누름 → eng_judge_cfg.req)
 *   나 울타리(내림·올림 한도·터무니없는 값·하한·수수료)는 절대 안 건드림 · 끄기 cloud_jobs.judge=false · 세세한 값 app_settings/eng_judge_cfg.cfg */
const VERSION = '1.0.0';
const DAY = 864e5;
const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const dms = (d) => Date.parse(d + 'T00:00:00+09:00');
const hash = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const r3 = (x) => (x == null || !Number.isFinite(+x) ? null : Math.round(x * 1000) / 1000);
const SHARD = 1000, KEYS_N = 32; /* 한 조각 1000줄(문서 1MiB 아래 — 막힌 까닭 글이 한글이라 넉넉히) · 중복 막기 열쇠 32조각 */
const DEF = { hour: 11, sample: 300, holdDays: 21, revDays: 14, restDays: 30, proposeDays: 30, winDays: 7, needWins: 3, needMatched: 30, needSold: 10, needNet: 0.02, maxEce: 0.05, minAuc: 0.55, closeDays: 60, salesMaxDays: 90,
  minRule: 30, minOut: 15, minPair: 20, minBin: 20, minBins: 3, dayLossPct: 0.05, fee: 0.108, propExpireDays: 14 };
/* 가 묶음(그림자로 겨루고 스스로 올릴 수 있음) — 범위·한 칸(설계 2.5) · staleHours·confirmHours는 시간이 지나야 보이는 값이라 다시 판정으로 못 겨룸(뺌) · discPick은 할인 0이라 효과 없음(뺌) */
const KNOBS = { 'gradeCoef.상': { min: 0.90, max: 1.00, step: 0.01, def: 0.95 }, 'gradeCoef.중': { min: 0.75, max: 0.95, step: 0.01, def: 0.85 }, queueGapMult: { min: 2, max: 5, step: 0.5, def: 3 } };
const COLS = ['k', 'uc', 'at', 'ev', 'fp', 'cur', 'tgt', 'low', 'cnt', 'rk', 'gr', 'grp', 'rule', 'st', 'act', 'auto', 'blk', 'pCur', 'pTgt', 'pVal', 'fol', 'same', 'o7', 'o14', 'o30', 'op', 'od', 'oc'];
const OUTC = ['fol', 'same', 'o7', 'o14', 'o30', 'op', 'od', 'oc'];
const DEC_FIELDS = ['key', 'usedCode', 'at', 'sig', 'status', 'action', 'current', 'target', 'ref', 'floors', 'grade', 'group', 'autoBlock', 'rows', 'counts'];

function cfgOf(c) { const o = { ...DEF }; for (const [k, v] of Object.entries(c || {})) if (k in DEF && Number.isFinite(+v)) o[k] = +v; return o; }
function getKnob(S, k) { const [a, b] = k.split('.'); const v = b ? (S[a] || {})[b] : S[a]; return Number.isFinite(+v) ? +v : KNOBS[k].def; }
function setKnob(S, k, v) { const o = JSON.parse(JSON.stringify(S || {})); const [a, b] = k.split('.'); if (b) o[a] = { ...(o[a] || {}), [b]: v }; else o[a] = v; return o; }
function knobPatch(k, v) { const [a, b] = k.split('.'); return b ? { [a]: { [b]: v } } : { [a]: v }; }
const stepTo = (k, v, dir) => { const K = KNOBS[k]; const x = Math.round((v + dir * K.step) * 100) / 100; return x < K.min - 1e-9 || x > K.max + 1e-9 ? null : x; };

/* 규칙 이름: keep 유지 · floor 매입가 하한 · conv 더 좋은 등급 환산 · tieTop 맨 위 따라감 · tieTotal 총액 맞춤 · w:<상태> 기다림·사람 확인·잠금 · retire 불용 · skip 판매중 아님 */
function ruleOf(d) { const st = d.status, a = d.action; if (st === 'skip') return 'skip'; if (st === 'retire' || a === 'retire') return 'retire'; if (st === 'floor') return 'floor'; if (st === 'wait' || st === 'queue' || st === 'hold') return 'w:' + st;
  if (a !== 'set') return 'keep'; const ref = d.ref || {}; if (ref.conv != null) return 'conv'; if (ref.isFirst) return 'tieTop'; return 'tieTotal'; }
/* 값 울타리(나 묶음) — 가격 코어가 fence를 내놓으면 그것(⑦ 값 주인 하나) · 없으면 같은 셈 */
function fenceLocal(cur, v, S0, o) { const S = S0 || {}; o = o || {}; if (v == null || !(cur > 0)) return { ok: true, why: null }; const dp = (v - cur) / cur;
  if (dp < 0 && -dp > (S.maxAutoDropPct ?? 0.30)) return { ok: false, why: 'drop' }; if (dp > 0 && dp > (S.maxAutoRaisePct ?? 0.50)) return { ok: false, why: 'raise' };
  const ps = (o.others || []).filter((x) => x > 0).sort((a, b) => a - b); if (ps.length >= 3 && v > ps[Math.floor(ps.length / 2)] * (S.insaneMult ?? 3)) return { ok: false, why: 'insane' };
  if (o.floor && v < o.floor) return { ok: false, why: 'floor' }; return { ok: true, why: null }; }
const othersOf = (d) => (Array.isArray(d.rows) ? d.rows.map((r) => +r.price).filter((x) => x > 0) : []);
function rowOf(d, mlr, M, ML, fee) { const oth = othersOf(d); const cur = d.current ?? null; const tgt = d.target ?? null; const act = d.action || null; const blk = Array.isArray(d.autoBlock) && d.autoBlock.length ? String(d.autoBlock[0]).slice(0, 40) : null;
  let pCur = null, pTgt = null, pVal = null; if (ML && M && mlr) { try { const pc = cur > 0 ? ML.predict(M, ML.withPrice(mlr, cur, oth)) : null; const pt = tgt > 0 ? ML.predict(M, ML.withPrice(mlr, tgt, oth)) : pc; pCur = r3(pc); pTgt = r3(pt); const pv = tgt > 0 || cur > 0 ? ML.dailyValue(pt, tgt > 0 ? tgt : cur, fee, 0) : null; pVal = pv == null ? null : Math.round(pv * 10) / 10; } catch (e) {} }
  return { k: d.key, uc: d.usedCode || String(d.key || '').replace(/^aladin_/, ''), at: d.at || null, ev: d.key + '@' + (d.at || ''), fp: d.sig || null, cur, tgt, low: oth.length ? Math.min(...oth) : null, cnt: (d.counts && d.counts.all) ?? oth.length, rk: mlr && mlr.rank != null ? mlr.rank : null,
    gr: d.grade || null, grp: d.group || null, rule: ruleOf(d), st: d.status || null, act, auto: act === 'set' && !blk ? 1 : 0, blk, pCur, pTgt, pVal, fol: null, same: 0, o7: null, o14: null, o30: null, op: null, od: null, oc: null }; }
function toCols(rows) { const c = {}; for (const k of COLS) c[k] = rows.map((r) => (r[k] === undefined ? null : r[k])); return c; }
function fromCols(cols) { const n = ((cols || {}).k || []).length; const out = []; for (let i = 0; i < n; i++) { const r = {}; for (const k of Object.keys(cols)) r[k] = cols[k][i]; out.push(r); } return out; }
/* ② 결과 — sales: Map(usedCode → [{at ms, price}]) · 바꾼 것이 있으면 true */
function outcome(r, sales, now, mlPrice, c) { c = c || DEF; if (r.oc) return false; const t = Date.parse(r.at); if (!Number.isFinite(t)) { r.oc = 2; return true; } const b = JSON.stringify([r.o7, r.o14, r.o30, r.op, r.od, r.oc, r.fol]);
  if (now - t > c.salesMaxDays * DAY) { r.oc = 2; return true; }
  const s0 = (sales.get(String(r.uc)) || []).filter((s) => s.at > t).sort((a, b) => a.at - b.at)[0]; const age = (now - t) / DAY;
  if (s0) { const od = (s0.at - t) / DAY; r.od = Math.round(od * 10) / 10; r.op = s0.price || null; r.o7 = od <= 7 ? 1 : 0; r.o14 = od <= 14 ? 1 : 0; r.o30 = od <= 30 ? 1 : 0; r.oc = 1; }
  else { if (age >= 7) r.o7 = 0; if (age >= 14) r.o14 = 0; if (age >= 30) r.o30 = 0; if (age >= c.closeDays) r.oc = 1; }
  if (r.act === 'set' && r.fol == null && r.tgt > 0) { if (mlPrice != null && +mlPrice === +r.tgt) r.fol = 1; else if (age >= 14) r.fol = 0; }
  return JSON.stringify([r.o7, r.o14, r.o30, r.op, r.od, r.oc, r.fol]) !== b; }
function auc(p, y) { const L = p.map((q, i) => [q, y[i]]).sort((a, b) => a[0] - b[0]); let pos = 0, neg = 0, s = 0, rank = 1; for (let i = 0; i < L.length;) { let j = i; while (j < L.length && L[j][0] === L[i][0]) j++; const avg = (rank + rank + (j - i) - 1) / 2; for (let k = i; k < j; k++) { if (L[k][1]) { pos++; s += avg; } else neg++; } rank += j - i; i = j; }
  return pos && neg ? (s - pos * (pos + 1) / 2) / (pos * neg) : null; }
function needOf(now, perDay, want) { const left = Math.max(0, want - now); return { now, want, perDay: r3(perDay), eta: left === 0 ? 0 : perDay > 0 ? Math.ceil(left / perDay) : null }; }
/* ④ 채점 — rows: 장부 줄 전체(닫힌 것 포함) */
function score(rows, now, c) { c = c || DEF; const t14 = now - 14 * DAY; const recent = rows.filter((r) => Date.parse(r.at) >= t14); const perDay = recent.length / 14; const outRows = rows.filter((r) => r.o7 != null); const outPerDay = outRows.filter((r) => Date.parse(r.at) >= now - 21 * DAY).length / 14;
  const V = rows.filter((r) => r.pCur != null && r.o7 != null); const value = { n: rows.filter((r) => r.pCur != null).length, nOut: V.length, logloss: null, auc: null, ece: null, bins: [], unknown: null, ruler: '가 관찰(추정)' };
  if (V.length < c.minBin * c.minBins) value.unknown = '결과 붙은 줄이 적음'; else { const p = V.map((r) => Math.min(1 - 1e-6, Math.max(1e-6, +r.pCur))), y = V.map((r) => +r.o7); let ll = 0; p.forEach((q, i) => { ll -= y[i] ? Math.log(q) : Math.log(1 - q); }); value.logloss = r3(ll / p.length); value.auc = r3(auc(p, y));
    const B = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: 0, ps: 0, ys: 0 })); p.forEach((q, i) => { const b = B[Math.min(9, Math.floor(q * 10))]; b.n++; b.ps += q; b.ys += y[i]; }); const ok = B.filter((b) => b.n >= c.minBin);
    value.bins = ok.map((b) => ({ lo: b.lo, hi: b.hi, n: b.n, pred: r3(b.ps / b.n), obs: r3(b.ys / b.n) })); if (ok.length < c.minBins) value.unknown = `20줄 넘는 칸이 ${ok.length}개뿐`; else { const N = ok.reduce((a, b) => a + b.n, 0); value.ece = r3(ok.reduce((a, b) => a + b.n * Math.abs(b.ps / b.n - b.ys / b.n), 0) / N); } }
  value.need = needOf(V.length, outPerDay, c.minBin * c.minBins);
  const by = new Map(); rows.forEach((r) => { const L = by.get(r.rule) || by.set(r.rule, []).get(r.rule); L.push(r); }); const cell = (r) => `${r.grp}|${r.gr}`;
  const keepCell = new Map(); (by.get('keep') || []).filter((r) => r.o14 != null).forEach((r) => { const o = keepCell.get(cell(r)) || keepCell.set(cell(r), { n: 0, s: 0 }).get(cell(r)); o.n++; o.s += r.o14; });
  const rules = [...by.entries()].map(([rule, L]) => { const O = L.filter((r) => r.o14 != null); const s7 = L.filter((r) => r.o7 === 1).length, s14 = O.filter((r) => r.o14 === 1).length; const pd = L.filter((r) => Date.parse(r.at) >= t14).length / 14;
    const x = { rule, n: L.length, nOut: O.length, sold7: s7, sold14: s14, obsRate: O.length ? r3(s14 / O.length) : null, pairN: null, pairDiff: null, verdict: '아직 모름', need: needOf(Math.min(L.length, O.length * 2), pd, c.minRule) };
    if (L.length < c.minRule || O.length < c.minOut) { x.why = `판정 ${L.length}/${c.minRule} · 결과 ${O.length}/${c.minOut}`; return x; }
    if (rule === 'keep') { x.verdict = '기준(유지)'; return x; }
    const mine = new Map(); O.forEach((r) => { const o = mine.get(cell(r)) || mine.set(cell(r), { n: 0, s: 0 }).get(cell(r)); o.n++; o.s += r.o14; }); let pn = 0, dsum = 0;
    for (const [k, m] of mine) { const kk = keepCell.get(k); if (!kk) continue; const w = Math.min(m.n, kk.n); pn += w; dsum += w * (m.s / m.n - kk.s / kk.n); }
    x.pairN = pn; if (pn < c.minPair) { x.why = `같은 칸 짝 ${pn}/${c.minPair}`; return x; } x.pairDiff = r3(dsum / pn); x.verdict = x.pairDiff > 0.02 ? '좋음' : x.pairDiff < -0.02 ? '나쁨' : '비슷'; return x; }).sort((a, b) => b.n - a.n);
  const closed = rows.filter((r) => r.oc === 1); const quick = closed.filter((r) => r.od != null && r.od <= 1); const slow = closed.filter((r) => r.o30 === 0 && (r.rule === 'keep' || String(r.rule).startsWith('w:')));
  const regret = { quick: quick.length, quickWon: quick.reduce((a, r) => a + Math.max(0, (r.low || 0) - (r.op || 0)), 0), slow: slow.length, note: '추정 — 하루 안 팔림은 너무 쌌을 수도(그때 남의 최저와 판 값 차이) · 30일 안 팔린 유지·기다림은 너무 비쌌을 수도' };
  return { perDay: r3(perDay), outPerDay: r3(outPerDay), value, rules, regret, rulers: { a: '가 관찰(추정)', b: '나 같은 칸 대조', c: '다 실험 = 0 (무손해 모드 · 헌장 제33조)' } }; }
/* ⑤ 다시 판정 — dec 하나를 설정 S로 */
function replay(PR, d, S) { const p1 = Array.isArray(d.page1) ? d.page1 : []; const at = Date.parse(d.at); const reg = d.tier && Number.isFinite(+d.tier.regDays) ? at - (+d.tier.regDays) * DAY : null; const ours = p1.find((r) => r.c === 'ours' && (!r.uc || r.uc === d.usedCode)) || {};
  const listing = { key: d.key, usedCode: d.usedCode, price: d.current, ship: ours.s ?? undefined, registeredAt: reg ? new Date(reg).toISOString() : null, lowest: d.lowest || null, grade: d.grade || null, sku: d.sku || null, title: d.title || '', status: '판매중' };
  const market = { at: d.at, pagesSeen: 1, lastPage: 1, rows: p1.map((r) => ({ rank: r.r, sellerName: null, sellerCode: r.sc, grade: r.g, price: r.p, ship: r.s, listingId: r.lid, usedCode: r.uc, soldOut: !!r.so, _c: r.c })), recentGone: [] };
  const ctx = { now: at, settings: S, classify: (r) => ({ cls: r._c === 'ours' ? 'unknown' : r._c || 'unknown', why: '기록된 분류' }) };
  const o = PR.decide(listing, market, {}, ctx); let tg = o.target ?? null; const F = d.floors || {}; if (tg != null && F.fBuyback && tg < F.fBuyback && (F.fBuyback - tg) / F.fBuyback >= (F.tolerance ?? 0)) tg = F.fBuyback; return { status: o.status, action: o.action, target: o.action === 'set' ? tg : null }; }
const sameDec = (a, d) => (a.action === 'set' ? d.action === 'set' && +a.target === +d.target : d.action !== 'set' && a.status === d.status);
/* ⑤ 창 판정 — cand.win[i] = { i, n, m, sold, vB, vC, qB, qC, br } · 다 찬 창만(오늘 창 빼고) */
function candEval(cand, todayIdx, model, c) { c = c || DEF; const W = (cand.win || []).filter((w) => w.i < todayIdx).sort((a, b) => a.i - b.i); const tot = (k) => W.reduce((a, w) => a + (+w[k] || 0), 0);
  let run = 0, best = 0; for (const w of W) { const d = w.vB ? (w.vC - w.vB) / Math.abs(w.vB) : null; w.diff = r3(d); if (d != null && d > c.needNet) { run++; best = Math.max(best, run); } else run = 0; }
  const matched = tot('m'), sold = tot('sold'), breach = tot('br'); const predAgree = !!(model && model.ece != null && model.ece <= c.maxEce && model.auc != null && model.auc > c.minAuc); const saleRateOk = tot('qC') >= tot('qB') - 1e-9;
  const no = []; if (matched < c.needMatched) no.push(`맞춘 줄 ${matched}/${c.needMatched}`); if (sold < c.needSold) no.push(`팔림 ${sold}/${c.needSold}`); if (best < c.needWins) no.push(`+${Math.round(c.needNet * 100)}% 넘는 창 연속 ${best}/${c.needWins}`); if (!predAgree) no.push('판매확률 예측을 아직 못 믿음(ECE·AUC)'); if (breach) no.push(`울타리 넘음 ${breach}`); if (!saleRateOk) no.push('판매율이 낮아짐');
  return { matched, sold, breach, wins: best, predAgree, saleRateOk, ok: !no.length, no }; }
/* ⑥ 스스로 올려도 되나 — 무손해 모드이거나 장부 30일 안이면 제안만 */
function autoOk(noLoss, ledgerStart, today, mode, c) { c = c || DEF; if (mode === 'propose') return { ok: false, why: '설정이 「제안만」' }; if (noLoss) return { ok: false, why: '무손해 모드 — 제안만' }; const d = ledgerStart ? (dms(today) - dms(ledgerStart)) / DAY : 0; if (d < c.proposeDays) return { ok: false, why: `장부 ${Math.floor(d)}일째 — ${c.proposeDays}일까지는 제안만` }; return { ok: true, why: '가 묶음 스스로 한 칸' }; }

function makeJudge(o) { const { C, db, FV, W, log, nowIso } = o; const DOC = () => C('app_settings').doc('eng_judge'), SH = () => C('app_settings').doc('eng_judge_shadow'), CFG = () => C('app_settings').doc('eng_judge_cfg'), PRI = () => C('prd_system').doc('pricing');
  let busy = null, lastTry = 0; const NOW = () => (o.now ? o.now() : Date.now());
  async function getS() { const s = (await PRI().get()).data() || {}; return { S: { ...(s.engine || {}), cutoverAt: s.cutoverAt || null, ...(s.rollout ? { rollout: s.rollout } : {}), ...(s.excludeSku ? { excludeSku: s.excludeSku } : {}), excludeUsed: s.excludeUsed || [] }, raw: s }; }
  async function loadKeys() { const refs = Array.from({ length: KEYS_N }, (_, i) => C('eng_judge_keys').doc('s' + i)); const ds = await db.getAll(...refs); return ds.map((d) => (d.exists ? (d.data() || {}).m || {} : {})); }
  async function ledgerDays(st) { return [...new Set(st.days || [])].sort(); }
  async function loadShard(id, fields) { const ref = C('eng_judge_days').doc(id); const [d] = fields ? await db.getAll(ref, { fieldMask: fields.map((f) => 'cols.' + f) }) : [await ref.get()]; return d && d.exists ? (d.data() || {}).cols || {} : null; }
  async function run(opt) { opt = opt || {}; if (busy) return { skip: 'busy', since: busy }; busy = nowIso(); try { return await run0(opt); } catch (e) { log('💲 판정 장부 실패', e.message); try { await DOC().set({ lastErr: String(e.message || e).slice(0, 300), lastErrAt: nowIso(), ...W() }, { merge: true }); } catch (x) {} return { err: String(e.message || e).slice(0, 200) }; } finally { busy = null; } }
  async function tick() { if (Date.now() - lastTry < 20 * 60e3) return null; lastTry = Date.now(); const cf = (await CFG().get()).data() || {}; const c = cfgOf(cf.cfg); const k = new Date(NOW() + 9 * 3600e3); const today = k.toISOString().slice(0, 10); const st = (await DOC().get()).data() || {};
    if (cf.req && cf.req.at && cf.req.at !== cf.reqDone) return run({ by: 'card' }); if (k.getUTCHours() < c.hour || st.day === today) return null; return run({ by: 'cloud' }); }
  async function run0(opt) { const t0 = Date.now(); const now = NOW(); const today = kday(now); const cfgDoc = (await CFG().get()).data() || {}; const c = cfgOf(cfgDoc.cfg); const st = (await DOC().get()).data() || {}; const res = { day: today, ver: VERSION, by: opt.by || 'cloud' };
    const ML = o.ml ? await o.ml() : null; let PR = null; try { PR = o.pr ? await o.pr() : null; } catch (e) { res.prErr = String(e.message || e).slice(0, 120); }
    let M = null, mlr = new Map(); try { const ms = (await C('app_settings').doc('ml_state').get()).data() || {}; if (ms.model && ms.model.champion) M = (await C('ml_models').doc(ms.model.champion).get()).data() || null; const day = ms.lastDay; if (day && o.mlCols) { const L = (await o.mlCols(day, ['key', 'price', 'grade', 'shelf', 'age', 'list', 'sp', 'used', 'p1', 'rank', 'top', 'sameMin', 'minAll', 'bb', 'df', 'mkt', 'act'])) || []; L.forEach((r) => mlr.set(r.key, r)); res.mlDay = day; } } catch (e) { res.mlErr = String(e.message || e).slice(0, 120); }
    res.model = M ? (M.kind || 'logit') : null; res.mlRows = mlr.size;
    // ① 새 판정 담기 — 처음이면 모두 · 다음부터 마지막 본 때 뒤
    const keys = await loadKeys(); const since = st.scanAt || null; const decs = []; { let q = C('prd_price_decisions').select(...DEC_FIELDS); if (since) q = q.where('at', '>', since); q = q.orderBy(since ? 'at' : '__name__'); let last = null; for (let g = 0; g < 120; g++) { let qq = q.limit(1000); if (last) qq = qq.startAfter(last); const s = await qq.get(); s.docs.forEach((d) => { const v = d.data(); if (v && v.key && v.at && v.status) decs.push(v); }); if (s.size < 1000) break; last = s.docs[s.docs.length - 1]; } }
    let scanAt = since; const add = [], sameUp = []; const kdirty = new Set();
    for (const d of decs) { if (!scanAt || d.at > scanAt) scanAt = d.at; const si = hash(d.key) % KEYS_N; const m = keys[si]; const prev = Array.isArray(m[d.key]) ? m[d.key] : null; /* [지문, 담은 날, 조각, 자리, 마지막 본 날] — 지문 안에 | 가 있어 배열로 */ const dday = kday(Date.parse(d.at));
      if (prev && prev[0] === String(d.sig || '')) { if (prev[4] !== dday) { sameUp.push({ id: prev[1] + '_' + prev[2], i: +prev[3] }); m[d.key] = [prev[0], prev[1], prev[2], prev[3], dday]; kdirty.add(si); } continue; }
      add.push({ d, si }); }
    const parts0 = st.lastPart && st.lastPart.day === today ? st.lastPart : null; let part = parts0 ? parts0.part : -1, fill = parts0 ? parts0.n : SHARD; const newRows = new Map();
    for (const { d, si } of add) { if (fill >= SHARD) { part++; fill = 0; newRows.set(part, []); } const L = newRows.get(part) || newRows.set(part, []).get(part); const r = rowOf(d, mlr.get(d.key), M, ML, c.fee); const i = (parts0 && part === parts0.part ? parts0.n : 0) + L.length; L.push(r); fill++; keys[si][d.key] = [d.sig || '', today, String(part).padStart(2, '0'), i, kday(Date.parse(d.at))]; kdirty.add(si); }
    for (const [p, L] of newRows) { const id = `${today}_${String(p).padStart(2, '0')}`; const ref = C('eng_judge_days').doc(id); if (parts0 && p === parts0.part) { const cur = (await ref.get()).data() || {}; const rows = fromCols(cur.cols).concat(L); await ref.set({ day: today, part: p, n: rows.length, at: nowIso(), cols: toCols(rows), ...W() }); } else await ref.set({ day: today, part: p, n: L.length, at: nowIso(), cols: toCols(L), ...W() }); }
    const lastN = newRows.size ? (parts0 && part === parts0.part ? parts0.n : 0) + (newRows.get(part) || []).length : null; res.added = add.length; res.seen = decs.length;
    const days = [...new Set([...(st.days || []), ...(newRows.size ? [today] : [])])].sort(); const ledgerStart = st.ledgerStart || (add.length ? today : null);
    // ② 결과 붙이기 — 열린 줄(최근 closeDays+salesMax 안에 담은 날)
    const SALE0 = new Date(now - c.salesMaxDays * DAY).toISOString(); let sales = new Map(); try { if (o.sales) { const S0 = await o.sales(SALE0); for (const [u, L] of S0) sales.set(String(u), L); } } catch (e) { res.salesErr = String(e.message || e).slice(0, 120); }
    const all = []; let closed = 0, outs = 0, sameN = 0; const sameBy = new Map(); sameUp.forEach((x) => { const L = sameBy.get(x.id) || sameBy.set(x.id, []).get(x.id); L.push(x.i); });
    for (const day of days) { const meta = (st.parts || {})[day] ?? (day === today ? part + 1 : null); const nP = day === today ? Math.max(part + 1, meta || 0) : meta || 0; for (let p = 0; p < nP; p++) { const id = `${day}_${String(p).padStart(2, '0')}`; const cols = await loadShard(id, ['k', 'uc', 'at', 'act', 'tgt', 'cur', 'low', 'rule', 'grp', 'gr', 'pCur', ...OUTC]); if (!cols) continue; const rows = fromCols(cols); let ch = false;
        for (const i of sameBy.get(id) || []) if (rows[i]) { rows[i].same = (+rows[i].same || 0) + 1; ch = true; sameN++; }
        for (const r of rows) { const mp = (mlr.get(r.k) || {}).price; if (outcome(r, sales, now, mp, c)) { ch = true; if (r.oc) closed++; if (r.o7 != null) outs++; } all.push(r); }
        if (ch) { const up = {}; for (const k of OUTC) up[k] = rows.map((r) => (r[k] === undefined ? null : r[k])); await C('eng_judge_days').doc(id).set({ cols: up, outAt: nowIso() }, { merge: true }); } } }
    for (const si of kdirty) await C('eng_judge_keys').doc('s' + si).set({ m: keys[si], at: nowIso() });
    const parts = { ...(st.parts || {}) }; if (newRows.size || parts0) parts[today] = part + 1;
    // ④ 채점
    const sc = score(all, now, c); let proxy = null; try { const es = (await C('app_settings').doc('ml_eval_sum').get()).data() || {}; proxy = es.proxy ? { n: es.proxy.rows ?? null, obs: es.proxy.obs ?? null, goneSaleP: es.proxy.goneSaleP ?? null, used: !!es.proxy.used, day: es.day || null } : null; } catch (e) {}
    // ⑤⑥ 그림자 도전자 · 올림·되돌리기
    let shadow = null, self = null; try { const r = await shadowStep({ PR, ML, M, mlr, all, sc, c, today, now, ledgerStart, cfgDoc, opt }); shadow = r.shadow; self = r.self; } catch (e) { res.shadowErr = String(e.message || e).slice(0, 160); log('💲 그림자 도전자 실패', e.message); }
    // 막힌 것 · 14일 제자리 · 사흘 같은 숫자
    const blocked = []; if (!PR) blocked.push('가격 코어를 못 엶 — 다시 판정(그림자) 못 함'); if (!M) blocked.push('판매확률 모델 없음 — 값어치 셈 못 함'); if (!decs.length && !st.rows) blocked.push('판정 문서가 하나도 없음'); if (sc.perDay === 0) blocked.push('지난 14일 새 판정 0 — 감시 적용 0%(F47)라 결함 아님 · 판정이 생기면 저절로 쌓임');
    const hist = Array.isArray(st.hist) ? st.hist.slice(-29) : []; const sig3 = JSON.stringify([all.length, outs, sc.value.nOut]); hist.push({ day: today, rows: all.length, added: add.length, out: sc.value.nOut, sig: sig3 });
    const h14 = hist.filter((h) => dms(h.day) >= dms(today) - 14 * DAY); const stuck = h14.length >= 14 && h14.every((h) => h.out === h14[0].out) ? [{ what: '결과 붙은 줄 수', days: h14.length, n: h14[0].out }] : [];
    const l3 = hist.slice(-3); const sameNum = l3.length === 3 && l3.every((h) => h.sig === l3[0].sig) ? '사흘째 장부 줄·결과 수가 같음 — 판정·판매 자료가 멈췄는지 확인' : null;
    const mouths = mouthsOf(all, PR);
    const out = { v: 1, at: nowIso(), day: today, ver: VERSION, by: opt.by || 'cloud', ledgerStart, days, parts, rows: all.length, scanAt: scanAt || null, lastPart: newRows.size ? { day: today, part, n: lastN } : parts0 || null,
      today: { added: add.length, same: sameN, closed, outcomes: outs, seen: decs.length }, rate: { perDay: sc.perDay, outPerDay: sc.outPerDay }, value: sc.value, rules: sc.rules, regret: sc.regret, rulers: sc.rulers,
      shadow, self, mouths, stuck, sameNum, blocked, proxy: proxy || { n: null, goneSaleP: null, note: '스스로 배우기 채점 요약(ml_eval_sum)을 못 읽음' }, hist, model: res.model, mlDay: res.mlDay || null, mlRows: res.mlRows, ms: Date.now() - t0, lastErr: null, ...W() };
    await DOC().set(JSON.parse(JSON.stringify(out, (k, v) => (v === undefined ? null : v)))); log(`💲 판정 장부: 새 ${add.length}줄 · 같음 ${sameN} · 결과 ${outs} · 전체 ${all.length}줄 · ${Date.now() - t0}ms`);
    return { ...res, rows: all.length, sameN, outs, closed, ms: Date.now() - t0, shadow: shadow ? (shadow.cands || []).map((x) => `${x.knob} ${x.from}→${x.to} ${x.state}`) : null }; }
  /* ⑦ 여섯 입 견줌 — 이 장부가 보는 입은 ① 판정(decide)뿐 · 나머지(감시 목표·추격자·판매가치 추천·가치 전략·⚡ 전략)는 그 값이 장부의 「따랐나」로만 보임 → 울타리(fence)를 지나는지 셈 */
  function mouthsOf(all, PR) { const F = PR && PR.fence ? PR.fence : fenceLocal; const L = all.filter((r) => r.act === 'set' && r.tgt > 0 && r.cur > 0); let pass = 0; for (const r of L) if (F(r.cur, r.tgt, {}, { floor: null }).ok) pass++;
    return { owner: PR && PR.fence ? 'pricing-core fence' : '판정 장부 안 같은 셈', list: [{ src: '① 판정 decide', n: L.length, pass, note: '장부가 직접 봄' }, { src: '② 감시 목표 critTarget', n: null, note: '장부 밖 — 가격 코어 fence를 지나면 장부에 후보로(⑦)' }, { src: '③ 추격자 chaseStep', n: null, note: '같음' }, { src: '④ 판매가치 추천 valueRec', n: null, note: '등록 카드·매입 도구 — 값을 안 바꿈' }, { src: '⑤ 가치 전략', n: null, note: '같음' }, { src: '⑥ ⚡ 전략 stratGuard', n: null, note: '이미 울타리 셈 안' }] }; }
  async function shadowStep(a) { const { PR, ML, M, mlr, all, sc, c, today, now, ledgerStart, cfgDoc, opt } = a; const shRef = SH(); const sh = (await shRef.get()).data() || {}; const cands = Array.isArray(sh.cands) ? sh.cands : [], rev = Array.isArray(sh.rev) ? sh.rev : [], done = Array.isArray(sh.done) ? sh.done.slice(-30) : []; const dir = { ...(sh.dir || {}) };
    const cf = cfgDoc || {}; const rest = { ...(cf.rest || {}) }; const log2 = Array.isArray(cf.log) ? cf.log.slice(-40) : []; let mode = cf.mode || 'auto'; const { S } = await getS(); let fenceCfg = {}; try { fenceCfg = (await C('app_settings').doc('eng_fence').get()).data() || {}; } catch (e) {} const noLoss = ML && ML.fenceNoLoss ? ML.fenceNoLoss(fenceCfg) : !(fenceCfg && fenceCfg.noLossMode === false);
    const AO = autoOk(noLoss, ledgerStart, today, mode, c); const blocked = []; let reqDone = cf.reqDone || null;
    // 카드 부탁(두 번 누름): apply = 제안 올림 · undo = 기록 되돌림
    if (cf.req && cf.req.at && cf.req.at !== cf.reqDone) { const q = cf.req; reqDone = q.at; if (q.op === 'apply') { const x = cands.find((y) => y.id === q.id && y.state === '올릴 만함'); if (x) { await promote(x.knob, x.from, x.to, 'card', '카드에서 올림(제안 승인)', log2, rev, today, c); x.state = '올림'; } else blocked.push('올릴 제안을 못 찾음: ' + String(q.id).slice(0, 40)); }
      else if (q.op === 'undo') { const e = log2.find((y) => y.id === q.id && !y.undone); if (e) { await setVal(e.knob, e.from); e.undone = nowIso(); rest[e.knob] = new Date(now + c.restDays * DAY).toISOString(); for (const r of rev) if (r.knob === e.knob && r.state === '도는 중') r.state = '되돌림'; log2.push({ id: 'u' + Date.now().toString(36), at: nowIso(), knob: e.knob, from: e.to, to: e.from, by: 'card', why: '카드에서 되돌림' }); } else blocked.push('되돌릴 기록을 못 찾음'); } }
    // 다시 판정 표본 — 장부의 상품 열쇠 중 오늘 몫(해시 차례)
    const ks = [...new Set(all.filter((r) => r.st !== 'skip').map((r) => r.k))].sort((x, y) => hash(x + today) - hash(y + today)).slice(0, c.sample);
    const lastOf = new Map(); all.forEach((r) => { const p = lastOf.get(r.k); if (!p || String(r.at) > String(p.at)) lastOf.set(r.k, r); });
    let D = []; if (PR && ks.length) { for (let i = 0; i < ks.length; i += 100) { const refs = ks.slice(i, i + 100).map((k) => C('prd_price_decisions').doc(k)); const ds = await db.getAll(...refs, { fieldMask: [...DEC_FIELDS, 'page1', 'tier', 'lowest', 'sku', 'title'] }); ds.forEach((d) => { if (d.exists) D.push(d.data()); }); } }
    const model = sc.value; let fid = 0, fN = 0; const base = new Map(); for (const d of D) { if (!Array.isArray(d.page1) || !d.page1.length) continue; try { const b = replay(PR, d, S); fN++; if (sameDec(b, d)) { fid++; base.set(d.key, b); } } catch (e) {} }
    const valOf = (d, price) => { const m = mlr.get(d.key); if (!ML || !M || !m || !(price > 0)) return null; const q = ML.predict(M, ML.withPrice(m, price, othersOf(d))); return q == null ? null : { q, v: ML.dailyValue(q, price, c.fee, 0) }; };
    const F = PR && PR.fence ? PR.fence : fenceLocal;
    const runOne = (x, ch) => { const S2 = setKnob(S, x.knob, x.to); const S1 = x.rev ? setKnob(S, x.knob, x.from) : S; const st = { n: 0, m: 0, sold: 0, vB: 0, vC: 0, qB: 0, qC: 0, br: 0 }; const seen = new Set(x.seen || []);
      for (const d of D) { const b = base.get(d.key); if (!b) continue; const h = hash(d.key + '|' + d.sig); if (seen.has(h)) continue; let bb = b, cc; try { if (x.rev) bb = replay(PR, d, S1); cc = replay(PR, d, S2); } catch (e) { continue; } seen.add(h);
        const pB = bb.target ?? d.current, pC = cc.target ?? d.current; const vb = valOf(d, pB), vc = valOf(d, pC); if (!vb || !vc) continue; st.n++; st.vB += vb.v; st.vC += vc.v; st.qB += vb.q; st.qC += vc.q;
        if (+pB !== +pC) { st.m++; const lr = lastOf.get(d.key); if (lr && (lr.o14 === 1 || lr.o7 === 1)) st.sold++; const fo = { others: othersOf(d), floor: (d.floors || {}).fBuyback || null }; if (!F(d.current, pC, S2, fo).ok && F(d.current, pB, S, fo).ok) st.br++; } }
      x.seen = [...seen].slice(-8000); const idx = Math.floor((dms(today) - dms(x.start)) / (c.winDays * DAY)); const w = (x.win || (x.win = [])).find((y) => y.i === idx) || (x.win.push({ i: idx, n: 0, m: 0, sold: 0, vB: 0, vC: 0, qB: 0, qC: 0, br: 0 }), x.win[x.win.length - 1]);
      for (const k of ['n', 'm', 'sold', 'br']) w[k] += st[k]; for (const k of ['vB', 'vC', 'qB', 'qC']) w[k] = Math.round((w[k] + st[k]) * 1000) / 1000; return idx; };
    // 도는 도전자 · 새 도전자
    const live = cands.filter((x) => x.state === '도는 중'); const busyK = new Set([...live.map((x) => x.knob), ...rev.filter((r) => r.state === '도는 중').map((r) => r.knob), ...cands.filter((x) => x.state === '올릴 만함').map((x) => x.knob)]);
    for (const k of Object.keys(KNOBS)) { if (busyK.has(k)) continue; if (rest[k] && Date.parse(rest[k]) > now) continue; const from = getKnob(S, k); let dr = dir[k] || 1; let to = stepTo(k, from, dr); if (to == null) { dr = -dr; to = stepTo(k, from, dr); } if (to == null) continue; dir[k] = dr;
      cands.push({ id: `${k}:${from}->${to}@${today}`, knob: k, from, to, start: today, end: kday(dms(today) + c.holdDays * DAY), holdDays: c.holdDays, win: [], state: '도는 중' }); }
    for (const x of cands.filter((y) => y.state === '도는 중')) { if (getKnob(S, x.knob) !== x.from) { x.state = '바탕 바뀜'; x.why = '지금 값이 겨루던 바탕과 달라짐 — 새로 겨룸'; continue; } const idx = runOne(x); const ev = candEval(x, idx, model, c); x.eval = { ...ev }; x.matched = ev.matched; x.sold = ev.sold; x.breach = ev.breach;
      if (ev.ok) { if (AO.ok) { await promote(x.knob, x.from, x.to, 'judge', `그림자 ${ev.wins}창 연속 +${Math.round(c.needNet * 100)}% · 맞춘 ${ev.matched} · 팔림 ${ev.sold}`, log2, rev, today, c); x.state = '올림'; } else { x.state = '올릴 만함'; x.propAt = today; x.why = AO.why; } }
      else if (today >= x.end) { x.state = '짐'; x.why = ev.no.join(' · '); dir[x.knob] = -(dir[x.knob] || 1); } }
    for (const x of cands.filter((y) => y.state === '올릴 만함')) if (x.propAt && dms(today) - dms(x.propAt) > c.propExpireDays * DAY) { x.state = '제안 지남'; x.why = `${c.propExpireDays}일 안에 안 올림`; }
    // 올린 뒤 거꾸로 그림자 — 옛 값이 2창 이기거나 하루 손실 한도 넘으면 스스로 되돌림
    for (const r of rev.filter((y) => y.state === '도는 중')) { if (r.fresh) { delete r.fresh; continue; } /* 오늘 막 올림 — 내일부터 셈 */ if (getKnob(S, r.knob) !== r.to) { r.state = '바탕 바뀜'; continue; } const x = { knob: r.knob, from: r.to, to: r.from, start: r.start, win: r.win || [], seen: r.seen || [] }; const idx = runOne(x); r.win = x.win; r.seen = x.seen;
      const W2 = r.win.filter((w) => w.i < idx); r.oldWins = W2.filter((w) => w.vB && (w.vC - w.vB) / Math.abs(w.vB) > c.needNet).length; const loss = W2.some((w) => w.vB && (w.vC - w.vB) / Math.abs(w.vB) > c.dayLossPct); /* 거꾸로 그림자: 바탕 = 올린 값 · 도전 = 옛 값 → 옛 값이 한 창에서 5% 넘게 나으면 손실 */
      if (r.oldWins >= 2 || loss) { await setVal(r.knob, r.from); rest[r.knob] = new Date(now + c.restDays * DAY).toISOString(); r.state = '되돌림'; log2.push({ id: 'r' + Date.now().toString(36), at: nowIso(), knob: r.knob, from: r.to, to: r.from, by: 'judge', why: loss ? `하루 손실 한도 ${Math.round(c.dayLossPct * 100)}% 넘음` : `옛 값이 ${r.oldWins}창 이김` }); }
      else if (today >= r.end) r.state = '지킴'; }
    const keep = (L, n) => L.filter((x) => ['도는 중', '올릴 만함'].includes(x.state)).concat(L.filter((x) => !['도는 중', '올릴 만함'].includes(x.state)).slice(-n));
    const C2 = keep(cands, 6), R2 = keep(rev, 6); for (const x of cands) if (!C2.includes(x)) done.push({ id: x.id, state: x.state, why: x.why || null, end: x.end });
    await shRef.set(JSON.parse(JSON.stringify({ at: nowIso(), cands: C2, rev: R2, done: done.slice(-30), dir, fidelity: fN ? r3(fid / fN) : null, fidN: fN, sampled: D.length, ...W() }, (k, v) => (v === undefined ? null : v))));
    await CFG().set({ mode, log: log2, rest, reqDone, at: nowIso(), ...W() }, { merge: true });
    const pub = (x) => ({ id: x.id, knob: x.knob, from: x.from, to: x.to, start: x.start, end: x.end, state: x.state, why: x.why || null, matched: x.matched ?? 0, sold: x.sold ?? 0, breach: x.breach ?? 0, eval: x.eval || null, win: (x.win || []).map((w) => ({ i: w.i, n: w.n, m: w.m, sold: w.sold, diff: w.vB ? r3((w.vC - w.vB) / Math.abs(w.vB)) : null })) });
    return { shadow: { cands: C2.map(pub), rev: R2.map((r) => ({ knob: r.knob, from: r.from, to: r.to, start: r.start, end: r.end, state: r.state, oldWins: r.oldWins || 0 })), fidelity: fN ? r3(fid / fN) : null, fidN: fN, sampled: D.length, knobs: KNOBS },
      self: { mode: AO.ok ? '가 묶음 스스로' : '제안만', why: AO.why, noLoss, since: ledgerStart, log: log2.slice(-20), rest, blocked } }; }
  async function setVal(knob, v) { if (!(knob in KNOBS)) throw new Error('가 묶음 밖 손잡이'); const K = KNOBS[knob]; if (!(v >= K.min - 1e-9 && v <= K.max + 1e-9)) throw new Error('범위 밖 값'); await PRI().set({ engine: knobPatch(knob, v), engJudgeAt: nowIso() }, { merge: true }); }
  async function promote(knob, from, to, by, why, log2, rev, today, c) { const d = { act: 'engine', entity: 'prd_system/pricing engine.' + knob, why: [why], undo: { knob, to: from }, conf: 0.6 }; if (o.decOk) { const k = o.decOk(d); if (k && !k.ok) throw new Error('엔진 결정 검사: ' + k.no.join(' · ')); }
    await setVal(knob, to); log2.push({ id: 'p' + Date.now().toString(36), at: nowIso(), knob, from, to, by, why, undo: 1 }); rev.push({ knob, from, to, start: today, end: kday(dms(today) + c.revDays * DAY), win: [], seen: [], state: '도는 중', oldWins: 0, fresh: 1 }); log(`💲 판정 엔진 손잡이 올림 ${knob} ${from} → ${to} (${by})`); }
  async function diag(q) { if (q === 'run') return run({ by: 'diag' }); const s = (await DOC().get()).data() || {}; if (q === 'sample') { const d = (s.days || []).slice(-1)[0]; const cols = d ? await loadShard(`${d}_00`, ['k', 'at', 'rule', 'st', 'act', 'cur', 'tgt', 'pCur', 'o7', 'oc']) : null; const L = cols ? fromCols(cols).slice(0, 8).map((r) => ({ ...r, k: String(r.k || '').slice(0, 8) + '…' })) : []; return { day: d || null, rows: L }; }
    const sh = (await SH().get()).data() || {}; return { at: s.at || null, ver: s.ver || null, rows: s.rows ?? null, today: s.today || null, days: (s.days || []).length, ledgerStart: s.ledgerStart || null, value: s.value ? { n: s.value.n, nOut: s.value.nOut, auc: s.value.auc, ece: s.value.ece, unknown: s.value.unknown } : null, rules: (s.rules || []).map((r) => `${r.rule} ${r.n}/${r.nOut} ${r.verdict}`), shadow: (sh.cands || []).map((x) => `${x.knob} ${x.from}→${x.to} ${x.state}`), fidelity: sh.fidelity ?? null, fidN: sh.fidN ?? null, blocked: s.blocked || [], lastErr: s.lastErr || null, busy }; }
  return { VERSION, run, tick, diag }; }
module.exports = { makeJudge, VERSION, KNOBS, DEF, COLS, ruleOf, rowOf, toCols, fromCols, outcome, score, auc, replay, sameDec, candEval, autoOk, fenceLocal, setKnob, getKnob, stepTo, cfgOf, hash };
