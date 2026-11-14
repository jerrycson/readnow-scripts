/* 🤖 연구 엔진 스스로 돌기 (engself1 · 2026-11-14 · 정범님 11/14 16:23 「너의 도움 없이 엔진이 책임을 지고 스스로 이런 열어보는 행위를 해서 … 가설을 확신으로 바꾸는 행위를 할 수 있게」 · 바로잡은 사실 F42)
 *  지금까지 Claude 매일 회차(14:37)가 손으로 하던 걸음 중 '기계로 되는 것'을 클라우드가 하루 한 번(16시 넘어 · /daily 10분 회차 안) AI 없이 함:
 *   ① 판매 장부 열어 보기 — ml_sales 줄 수·마지막 주문 시각·빈 칸 몫을 재고 어제와 견줌(줄었으면 그날 판정에 안 씀) · 장부 고침이 13시간 넘게 멈췄으면 mlLedger를 다시 부르고 그래도 멈췄으면 🚨 카드
 *   ② 연구 문서 신선도 — fresh.py와 같은 판정(✅ 오늘 셈·바뀜 / 🟰 오늘 셈·재료 그대로 / ⏳ 아직 오늘 셈 전 / ❌ 36시간 멈춤 / ❓ 문서 없음)
 *   ③ 소비심리 가설 다시 셈 — readnow-chats research/CONSUMER/engine/consumer_engine.py의 셈(같은 달 같은 요일 상대값 · 부트스트랩 95% 범위)을 그대로 옮김
 *   ④ 가설 상태 「불명 → 지지 → 확신」(내림도) — 표본 수·범위 여유·'새 자료가 들어온 회차' 연속 수로만 바꿈(아래 esStep) · 바뀔 때마다 장부 eng_ledger에 무엇을 봤나·바꿨나·왜
 *   ⑤ 배선 단계(WIRING.md 2장) 올림·내림 — 재료 멈춤이면 1단계로 · 채점 칸이 목표를 k일 넘으면 한 단계 올림 · 돈 배선 3단계 이상은 R18 울타리(무손해 모드·💸 허락 기록·하루 한도)를 통과할 때만 · 그 실제 올림은 설정 moneyUp(기본 꺼짐)
 *   ⑥ 자기 채점 — 지지·확신 가설이 '새 날'에 맞힌 방향을 셈(엔진이 자기 판단을 채점)
 *   ⑦ 남기기 — app_settings/eng_self(오늘 요약) · eng_ledger/<날T시각>(덧붙이기만 · 지우지 않음) · app_settings/eng_wire_stage(배선 단계 · 정의는 cloud/eng-wires.json) · research_pulse N05 · 확신·뒤집힘은 📚 발견 모음
 *  지키는 것: 관찰·기록만 — 값·등록·돈을 바꾸지 않음(제33조 무손해) · 배선 단계는 기록일 뿐 이 판에서 그 단계를 읽어 판단을 바꾸는 코드는 없음 · 손님 칸 없음(ml_sales는 이미 손님 칸을 뺀 장부) · 사람이 넣은 설정을 덮지 않음 */
'use strict';
const ES_V = '1.0.0';
const ES_DEF = {
  on: true, hourKST: 16, // 하루 한 번 · 16시 넘어(소비심리 05시·수요 지수 15시대 셈 뒤) — 근거: engfix1 11/14 셈 시각 기록
  minNsup: 8, minNconf: 20, confRuns: 7, downRuns: 3, margin: 0.02, nullBand: 0.05, // 근거: 없음(설정으로 바꿈) — 지지 8일 · 확신 20일·새 자료 7회 연속·범위 끝이 0에서 2% 넘게 · 내림 3회 연속
  hourMinOrders: 300, hourMargin: 0.02, ledgerMaxAgeH: 36, metaMaxAgeH: 13, ledgerDrop: 0.02, blankMax: 0.05,
  moneyUp: false, // ⚠ 돈 배선 3단계 이상 실제 올림 — 기본 꺼짐(이 판은 코드·시험까지 · 켜는 것은 정범님 결정)
  wireUpRuns: 7, wireDownRuns: 3, stage4Days: 14, readsZeroDays: 3,
};
/* 가설 장부(readnow-chats research/CONSUMER/engine/hypotheses.json 11/14 판과 같은 시험 · 바꾸려면 app_settings/eng_self_cfg.hyp) */
const ES_HYP = [
  { id: 'H01', claim: '금·토요일에 판매가 가장 많다', test: { kind: 'dow', days: [4, 5], expect: 1 } },
  { id: 'H02', claim: '월급날(10·25일) 뒤 3일은 판매가 는다', test: { kind: 'set', set: 'payday3', expect: 1 } },
  { id: 'H03', claim: '월급 앞(18~22일)에는 판매가 준다', test: { kind: 'set', set: 'pre_payday', expect: -1 } },
  { id: 'H04', claim: '공휴일 당일은 주문이 준다', test: { kind: 'set', set: 'holiday', expect: -1 } },
  { id: 'H05', claim: '긴 연휴 앞 3일은 판매가 는다', test: { kind: 'set', set: 'pre_break', expect: 1 } },
  { id: 'H06', claim: '긴 연휴 뒤 3일은 미뤄 둔 소비가 몰린다', test: { kind: 'set', set: 'post_break', expect: 1 } },
  { id: 'H07', claim: '새책 성수기 달(3·12·1·7월)이 비수기 달(6·10·5·11월)보다 많다', test: { kind: 'month_rank', high: ['03', '12', '01', '07'], low: ['06', '10', '05', '11'] } },
  { id: 'H08', claim: '평일 주문은 낮(12~17시)에 가장 몰린다', test: { kind: 'hour', who: '평일', blocks: ['12~14', '15~17'] } },
  { id: 'H09', claim: '주말·공휴일 주문은 저녁·밤(18~23시)에 가장 몰린다', test: { kind: 'hour', who: '주말·공휴일', blocks: ['18~20', '21~23'] } },
  { id: 'H10', claim: '비 오는 날(5mm 넘음)은 판매가 는다', test: { kind: 'weather', set: 'rain5', expect: 1 } },
  { id: 'H11', claim: '폭염(최고 33도 넘음)에도 그대로다', test: { kind: 'weather', set: 'hot33', expect: 0 } },
  { id: 'H12', claim: '토·일요일은 평일보다 판매가 적다', test: { kind: 'dow', days: [5, 6], expect: -1 } },
  { id: 'H13', claim: '달 초(1~5일)는 효과가 없다', test: { kind: 'set', set: 'month_start', expect: 0 } },
  { id: 'H14', claim: '달 끝(26일~)은 판매가 는다', test: { kind: 'set', set: 'month_end', expect: 1 } },
];
const ES_PULSE_METRIC = '가설 장부 판정 수(지지·반대가 된 가설 몫) · 받는 연구(R14 예상 매출) 백테스트 오차가 이 효과를 넣고 줄어드는지';
/* 연구 문서 ↔ 연구 번호(배선 재료 신선도에 씀) · 날짜 문서가 있는 것은 어제 것과 견줌(fresh.py PAIR) */
const ES_DOCS = [['app_settings/cons_study', 'N05'], ['app_settings/voice_study', 'N06'], ['app_settings/seller_aud', 'N11'], ['app_settings/buyback_stats', 'R12', 'ml_buyback_stats'], ['app_settings/sp_obs', 'R06', 'ml_sp_obs'],
  ['app_settings/value_model', 'R01'], ['app_settings/ml_state', 'R02'], ['app_settings/badge_study', 'R20'], ['app_settings/extras_study', 'R19'], ['app_settings/ratio_study', 'R03'], ['app_settings/oop_study', 'R05'], ['app_settings/bench_obs', 'N07'], ['app_settings/front_bump_eval', 'N09'], ['app_settings/seller_learn', 'N08'], ['app_settings/peer_ev', 'N04']];
const DOW = ['월', '화', '수', '목', '금', '토', '일'];
const SKIP = new Set(['at', 'uploadedAt', 'writer', 'writerSchema', 'updatedAt', 'lastBy']);
const r3 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
const addD = (k, n) => new Date(Date.parse(k + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const dowOf = (k) => (new Date(k + 'T12:00:00Z').getUTCDay() + 6) % 7; /* 월 = 0 */
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const kstHour = (ms) => new Date(ms + 9 * 3600e3).getUTCHours();
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

/* ── ① 판매 장부 열어 보기 ── months = [{ym, n, rows}] · meta = ml_sales/_meta · prev = 어제 본 것 {rows, last, per{ym:n}} */
function esInspect(meta, months, prev, nowMs, cfg) {
  cfg = { ...ES_DEF, ...(cfg || {}) }; let rows = 0, blank = 0, last = ''; const per = {};
  for (const m of months || []) { const L = m.rows || []; per[m.ym] = L.length; rows += L.length;
    for (const r of L) { const x = String(r).split('\u0001'); const at = x[2] || ''; if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at) || x[3] === '' || x[3] == null || x[4] === '' || x[4] == null) blank++; else if (at > last) last = at; } }
  const lastMs = last ? Date.parse(last.slice(0, 19) + '+09:00') : NaN; const ageH = Number.isFinite(lastMs) ? (nowMs - lastMs) / 3600e3 : null;
  const metaMs = Date.parse((meta && meta.at) || ''); const metaAgeH = Number.isFinite(metaMs) ? (nowMs - metaMs) / 3600e3 : null;
  const o = { rows, last: last.slice(0, 16), ageH: ageH == null ? null : Math.round(ageH * 10) / 10, blank: rows ? r3(blank / rows) : null, months: Object.keys(per).length, metaAt: (meta && meta.at) || null, metaAgeH: metaAgeH == null ? null : Math.round(metaAgeH * 10) / 10, per, why: [] };
  o.metaStale = metaAgeH == null || metaAgeH > cfg.metaMaxAgeH;
  let shrink = null; if (prev && prev.per) { for (const [ym, n0] of Object.entries(prev.per)) { const n1 = per[ym] || 0; if (n1 < n0 * (1 - cfg.ledgerDrop)) { shrink = `${ym} 줄 ${n0} → ${n1}`; break; } } }
  o.newRows = prev && prev.rows != null ? rows - prev.rows : null; o.advanced = !prev || !prev.last || o.last > prev.last;
  if (!rows) { o.st = '❌'; o.why.push('판매 장부가 비었음'); }
  else if (shrink) { o.st = '❌'; o.why.push('줄 수가 줄었음(' + shrink + ') — 오늘 판정에 안 씀'); }
  else if (o.blank > cfg.blankMax) { o.st = '❌'; o.why.push(`빈 칸 몫 ${Math.round(o.blank * 100)}% — 기준 ${Math.round(cfg.blankMax * 100)}% 넘음`); }
  else if (ageH == null || ageH > cfg.ledgerMaxAgeH) { o.st = '⚠'; o.why.push(`마지막 주문 ${o.last || '?'} — ${Math.round(ageH || 0)}시간 새 주문 없음(장부 멈춤일 수 있음)`); }
  else o.st = '✅';
  if (o.metaStale) o.why.push(`장부 고침(mlLedger) 마지막 ${o.metaAt || '없음'} — ${cfg.metaMaxAgeH}시간 넘음`);
  o.use = o.st === '✅' || o.st === '⚠'; return o; }

/* ── ② 연구 문서 신선도(fresh.py와 같은 판정) · docs = {경로: data|null} ── */
const tOf = (v) => { for (const k of ['at', 'updatedAt', 'lastAt', 'trainedAt']) { const t = Date.parse(String((v && v[k]) || '')); if (Number.isFinite(t)) return t; } return NaN; };
function esFresh(docs, today, nowMs, cfg) { cfg = { ...ES_DEF, ...(cfg || {}) }; const y = addD(today, -1); const out = [];
  for (const [k, id, col] of ES_DOCS) { const v = docs[k]; if (!v || typeof v !== 'object') { out.push({ k, id, s: '❓', w: '문서 없음' }); continue; }
    const t = tOf(v); if (!Number.isFinite(t)) { out.push({ k, id, s: '❓', w: '셈 시각 칸 없음' }); continue; } const ageH = (nowMs - t) / 3600e3; const ts = new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' ');
    let same = false; if (col) { const p = docs[`${col}/${y}`]; if (p && typeof p === 'object') { const a = {}, b = {}; for (const [x, z] of Object.entries(v)) if (!SKIP.has(x)) a[x] = z; for (const [x, z] of Object.entries(p)) if (!SKIP.has(x)) b[x] = z; same = JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort()); } }
    if (kstDay(t) === today) out.push({ k, id, s: same ? '🟰' : '✅', w: `오늘 ${ts} 셈` + (same ? ' · 내용 어제와 같음(재료가 안 늘었음)' : '') });
    else if (ageH < cfg.ledgerMaxAgeH) out.push({ k, id, s: '⏳', w: `아직 오늘 셈 전 — 마지막 ${ts}(${Math.round(ageH)}시간 전)` });
    else out.push({ k, id, s: '❌', w: `${Math.round(ageH)}시간 넘게 안 셈(멈춤) — 마지막 ${ts}` }); }
  return out; }

/* ── ③ 소비심리 가설 셈(consumer_engine.py 옮김) · lines = ml_sales 줄 · hol(날짜) → 공휴일 이름|null · wx = {날짜: {rn, tx}} ── */
function esDays(lines) { const S = []; for (const r of lines || []) { const x = String(r).split('\u0001'); if ((x[5] || 'normal') !== 'normal') continue; const at = String(x[2] || '').replace(' ', 'T'); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at)) continue; S.push({ d: at.slice(0, 10), hm: at.slice(11, 16), g: at.slice(0, 16), h: +at.slice(11, 13), p: +x[3] || 0, q: parseInt(x[4], 10) || 1 }); }
  if (!S.length) return { days: [], S, first: null, last: null }; S.sort((a, b) => (a.g < b.g ? -1 : a.g > b.g ? 1 : 0));
  const first = addD(S[0].d, 1), last = addD(S[S.length - 1].d, -1); const by = {}; for (const s of S) { const b = (by[s.d] = by[s.d] || { items: 0, rev: 0, g: new Set() }); b.items += s.q; b.rev += s.p * s.q; b.g.add(s.hm); }
  const days = []; for (let k = first; k <= last; k = addD(k, 1)) { const b = by[k]; days.push({ date: k, dow: dowOf(k), items: b ? b.items : 0, rev: b ? Math.round(b.rev) : 0, orders: b ? b.g.size : 0 }); }
  return { days, S, first, last }; }
function esRel(days, key) { const cell = {}; for (const x of days) (cell[x.date.slice(0, 7) + '|' + x.dow] = cell[x.date.slice(0, 7) + '|' + x.dow] || []).push(x[key]); const avg = {}; for (const [k, v] of Object.entries(cell)) avg[k] = mean(v); const R = {}; for (const x of days) { const a = avg[x.date.slice(0, 7) + '|' + x.dow]; R[x.date] = a ? x[key] / a : null; } return R; }
function esBoot(vals, rnd, n) { n = n || 2000; vals = vals.filter((v) => v != null); if (vals.length < 3) return null; const m = mean(vals); const bs = []; for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < vals.length; j++) s += vals[Math.floor(rnd() * vals.length)]; bs.push(s / vals.length); } bs.sort((a, b) => a - b); return { n: vals.length, mean: r3(m), lo: r3(bs[Math.floor(0.025 * n)]), hi: r3(bs[Math.floor(0.975 * n)]) }; }
function esEffect(R, dates, allk, rnd) { const s = new Set(dates); const a = [...s].filter((d) => R[d] != null).map((d) => R[d]); const b = allk.filter((d) => !s.has(d) && R[d] != null).map((d) => R[d]); if (a.length < 3 || !b.length) return null; const bt = esBoot(a, rnd); const base = mean(b); return { n: a.length, eff: r3(bt.mean / base - 1), lo: r3(bt.lo / base - 1), hi: r3(bt.hi / base - 1) }; }
/* 긴 연휴 = 주말·공휴일이 4일 넘게 이어지고 그 안에 공휴일이 든 것(consumer kr_calendar long_breaks 3개와 같아짐: 2025 추석 10/03~09 · 2026 설 02/14~18 · 2026 추석 09/24~27) */
function esBreaks(from, to, hol) { const off = (k) => dowOf(k) >= 5 || !!hol(k); const B = []; let k = addD(from, -10); const end = addD(to, 10);
  while (k <= end) { if (off(k)) { let e = k; while (off(addD(e, 1)) && e <= end) e = addD(e, 1); const len = Math.round((Date.parse(e) - Date.parse(k)) / 864e5) + 1; let h = false; for (let x = k; x <= e; x = addD(x, 1)) if (hol(x)) h = true; if (len >= 4 && h) B.push({ from: k, to: e, len }); k = addD(e, 1); } else k = addD(k, 1); } return B; }
function esSets(days, hol, wx) { const allk = days.map((x) => x.date); const have = new Set(allk); const S = {}; const f = (p) => allk.filter(p);
  S.holiday = f((d) => !!hol(d)); const B = esBreaks(allk[0], allk[allk.length - 1], hol); const pre = [], post = [];
  for (const b of B) for (const i of [1, 2, 3]) { pre.push(addD(b.from, -i)); post.push(addD(b.to, i)); }
  S.pre_break = pre.filter((d) => have.has(d)); S.post_break = post.filter((d) => have.has(d));
  const pay = new Set(); for (const ym of new Set(allk.map((d) => d.slice(0, 7)))) for (const pd of [10, 25]) { let d = `${ym}-${String(pd).padStart(2, '0')}`; while (dowOf(d) >= 5 || hol(d)) d = addD(d, -1); for (const i of [0, 1, 2]) pay.add(addD(d, i)); }
  S.payday3 = [...pay].filter((d) => have.has(d)).sort(); S.month_end = f((d) => +d.slice(8) >= 26); S.month_start = f((d) => +d.slice(8) <= 5); S.pre_payday = f((d) => +d.slice(8) >= 18 && +d.slice(8) <= 22);
  if (wx && Object.keys(wx).length) { S.rain5 = f((d) => wx[d] && wx[d].rn != null && wx[d].rn >= 5); S.hot33 = f((d) => wx[d] && wx[d].tx != null && wx[d].tx >= 33); S._wxDays = f((d) => !!wx[d]); }
  S._breaks = B; return S; }
/* 판정 → { v: 지지|반대|불명|재료 없음, label, e, n, m(확신 여유 맞음?) , mWhy } */
function esVerdictSet(e, expect, cfg) { if (!e) return { v: '재료 없음', label: '재료 없음' }; const s = e.lo > 0 ? 1 : e.hi < 0 ? -1 : 0;
  if (expect === 0) { if (s) return { v: '반대', label: '어긋남(효과 있음)', e, n: e.n }; const m = e.lo >= -cfg.nullBand && e.hi <= cfg.nullBand; return { v: '지지', label: '지지(효과 없음 쪽)', e, n: e.n, m, mWhy: m ? null : `범위 ${pc(e.lo)}~${pc(e.hi)}가 ±${Math.round(cfg.nullBand * 100)}% 밖까지` }; }
  if (!s) return { v: '불명', label: '불명(범위가 0을 걸침)', e, n: e.n };
  if (s !== expect) return { v: '반대', label: '반대', e, n: e.n };
  const edge = expect > 0 ? e.lo : -e.hi; const m = edge >= cfg.margin; return { v: '지지', label: '지지', e, n: e.n, m, mWhy: m ? null : `범위 끝이 0에서 ${pc(edge)}뿐(기준 ${Math.round(cfg.margin * 100)}%)` }; }
const pc = (x) => (x == null ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`);
function esJudge(lines, hol, wx, cfg, hyps) { cfg = { ...ES_DEF, ...(cfg || {}) }; hol = hol || (() => null); const rnd = rng(20261110); const { days, S: SALES, first, last } = esDays(lines); if (days.length < 30) return { n_days: days.length, hyp: [], why: '날 수 30일 아래' };
  const allk = days.map((x) => x.date); const R = esRel(days, 'orders'); const SETS = esSets(days, hol, wx); const out = [];
  /* 요일 지수(달 흐름 걸러 냄) */ const mon = {}; for (const x of days) (mon[x.date.slice(0, 7)] = mon[x.date.slice(0, 7)] || []).push(x); const dv = DOW.map(() => []); for (const xs of Object.values(mon)) { const a = mean(xs.map((x) => x.orders)); if (a) for (const x of xs) dv[x.dow].push(x.orders / a); } const dd = dv.map((v) => esBoot(v, rnd));
  /* 시각(주문 묶음) */ const hb = { '평일': {}, '주말·공휴일': {} }; const BL = { '00~05': [0, 5], '06~08': [6, 8], '09~11': [9, 11], '12~14': [12, 14], '15~17': [15, 17], '18~20': [18, 20], '21~23': [21, 23] }; const seen = new Set(); const tot = { '평일': 0, '주말·공휴일': 0 };
  for (const s of SALES) { if (seen.has(s.g) || s.d < first || s.d > last) continue; seen.add(s.g); const w = dowOf(s.d) >= 5 || hol(s.d) ? '주말·공휴일' : '평일'; const b = Object.keys(BL).find((k) => s.h >= BL[k][0] && s.h <= BL[k][1]); hb[w][b] = (hb[w][b] || 0) + 1; tot[w]++; }
  /* 달 */ const mm = {}; for (const [ym, xs] of Object.entries(mon)) if (xs.length >= 25) (mm[ym.slice(5)] = mm[ym.slice(5)] || []).push(mean(xs.map((x) => x.items)));
  for (const h of hyps || ES_HYP) { const t = h.test || {}; let j = { v: '재료 없음', label: '재료 없음' };
    if (t.kind === 'set') j = esVerdictSet(esEffect(R, SETS[t.set] || [], allk, rnd), t.expect || 0, cfg);
    else if (t.kind === 'weather') j = SETS._wxDays && SETS._wxDays.length >= 30 ? esVerdictSet(esEffect(R, SETS[t.set] || [], SETS._wxDays, rnd), t.expect || 0, cfg) : { v: '재료 없음', label: `재료 없음(판매 날과 겹친 날씨 ${SETS._wxDays ? SETS._wxDays.length : 0}일 · 30일 넘어야)` };
    else if (t.kind === 'dow') { const ex = t.expect || 1; const hi = t.days.map((i) => dd[i]).filter(Boolean), lo = [0, 1, 2, 3, 4, 5, 6].filter((i) => !t.days.includes(i)).map((i) => dd[i]).filter(Boolean);
      if (hi.length && lo.length) { const eff = r3(mean(hi.map((x) => x.mean)) / mean(lo.map((x) => x.mean)) - 1); const ok = ex > 0 ? Math.min(...hi.map((x) => x.lo)) > Math.max(...lo.map((x) => x.hi)) : Math.max(...hi.map((x) => x.hi)) < Math.min(...lo.map((x) => x.lo)); const n = Math.min(...hi.map((x) => x.n));
        j = eff * ex > 0 ? (ok ? { v: '지지', label: '지지', e: { eff, n }, n, m: true } : { v: '불명', label: '불명(요일 범위가 겹침)', e: { eff, n }, n }) : { v: '반대', label: '반대', e: { eff, n }, n }; } }
    else if (t.kind === 'hour') { const c = hb[t.who] || {}; const T = tot[t.who] || 0; if (T) { const sh = Object.fromEntries(Object.keys(BL).map((k) => [k, (c[k] || 0) / T])); const top = Object.keys(sh).sort((a, b) => sh[b] - sh[a])[0]; const inB = t.blocks.includes(top); const rival = Math.max(...Object.keys(sh).filter((k) => t.blocks.includes(k) !== inB).map((k) => sh[k])); const gap = r3(sh[top] - rival);
        j = { v: inB ? '지지' : '반대', label: inB ? '지지' : '반대', e: { top, share: r3(sh[top]), gap }, n: T, m: inB && gap >= cfg.hourMargin && T >= cfg.hourMinOrders, mWhy: `맨 위 ${top} ${Math.round(sh[top] * 100)}% · 다음 쪽과 차 ${pc(gap)} · 주문 ${T}` }; } }
    else if (t.kind === 'month_rank') { const H = t.high.filter((m) => mm[m]), L = t.low.filter((m) => mm[m]); if (H.length && L.length) { const av = (ms) => mean(ms.map((m) => mm[m][mm[m].length - 1])); /* consumer_engine.py와 같게 — 같은 달이 두 해면 나중 해 값(파이썬 dict 덮어쓰기) */ const eff = r3(av(H) / av(L) - 1); const yrs = Math.min(...[...H, ...L].map((m) => mm[m].length));
        j = eff > 0.05 ? { v: '지지', label: '지지', e: { eff, yrs }, n: yrs, m: yrs >= 2, mWhy: `달마다 ${yrs}해뿐 — 두 해 넘게 봐야 확신` } : eff < -0.05 ? { v: '반대', label: '반대', e: { eff, yrs }, n: yrs } : { v: '불명', label: '불명(차이 5% 안)', e: { eff, yrs }, n: yrs }; } }
    out.push({ id: h.id, claim: h.claim, kind: t.kind, ...j, n: j.n == null ? null : j.n }); }
  return { n_days: days.length, range: [first, last], breaks: SETS._breaks, R, sets: SETS, hyp: out }; }

/* ── ④ 가설 상태 바꾸기 · p = 지난 상태 {st, since, run:{v,k}, lastDay} · j = 오늘 판정 · newData = 장부 마지막 날이 앞으로 갔나 ── */
const ES_RANK = { '재료 없음': 0, '불명': 0, '반대': 0, '지지': 1, '확신': 2 };
function esStep(p, j, cfg, newData, day, dataDay) { cfg = { ...ES_DEF, ...(cfg || {}) }; p = p || null; const q = { st: p ? p.st : null, since: p ? p.since : day, run: p && p.run ? { ...p.run } : { v: null, k: 0 }, lastDay: p ? p.lastDay : null };
  if (newData || !p) { if (q.run.v === j.v) q.run.k++; else q.run = { v: j.v, k: 1 }; q.lastDay = dataDay; }
  const n = j.n || 0; const kind = j.kind; const why = [];
  const need = (to) => { q.st = to; q.since = day; return to; }; let to = null;
  if (!p || !p.st) { to = j.v === '지지' && n >= cfg.minNsup ? '지지' : j.v === '반대' && n >= cfg.minNsup ? '반대' : j.v === '재료 없음' ? '재료 없음' : '불명'; why.push('첫 판정 — ' + j.label + (n ? ` · 표본 ${n}` : '') + (j.v !== '재료 없음' && j.v !== '불명' && to === '불명' ? ` · 표본이 ${cfg.minNsup} 아래라 불명으로 둠` : '')); need(to); return { ...q, changed: { from: null, to, why: why.join(' · ') } }; }
  const cur = p.st;
  if (cur === '지지' || cur === '확신' || cur === '반대') { if (q.run.v !== (cur === '확신' ? '지지' : cur) && q.run.k >= cfg.downRuns) { to = cur === '확신' ? '지지' : q.run.v === '지지' && n >= cfg.minNsup ? '지지' : q.run.v; why.push(`새 자료 ${q.run.k}회 연속 '${q.run.v}'(${j.label}) — ${cfg.downRuns}회 넘어 내림`); } }
  if (!to && cur === '지지' && j.v === '지지') { const k = kind === 'hour' || kind === 'month_rank' || kind === 'dow' ? 'nconf_skip' : null; const nOk = k ? true : n >= cfg.minNconf;
    if (q.run.k >= cfg.confRuns && nOk && j.m) { to = '확신'; why.push(`새 자료 ${q.run.k}회 연속 지지(기준 ${cfg.confRuns}) · 표본 ${n}${k ? '' : `(기준 ${cfg.minNconf})`}` + (j.e && j.e.lo != null ? ` · 95% 범위 ${pc(j.e.lo)}~${pc(j.e.hi)}` : '') + (j.mWhy ? ' · ' + j.mWhy : '')); } }
  if (!to && (cur === '불명' || cur === '재료 없음')) { if ((j.v === '지지' || j.v === '반대') && n >= cfg.minNsup) { to = j.v; why.push(`${j.label} · 표본 ${n}(기준 ${cfg.minNsup})` + (j.e && j.e.lo != null ? ` · 95% 범위 ${pc(j.e.lo)}~${pc(j.e.hi)}` : '')); } else if (j.v !== cur && (j.v === '불명' || j.v === '재료 없음')) { to = j.v; why.push(j.label); } }
  if (to && to !== cur) { need(to); return { ...q, changed: { from: cur, to, why: why.join(' · ') } }; }
  return { ...q, changed: null }; }
/* 확신까지 남은 것(쉬운 말) */
function esNext(s, j, cfg) { cfg = { ...ES_DEF, ...(cfg || {}) }; if (!s) return ''; if (s.st === '확신') return '확신 — 새 자료 ' + cfg.downRuns + '회 연속 어긋나면 지지로 내림'; if (s.st !== '지지') return s.st === '반대' ? '반대 — ' + cfg.downRuns + '회 연속 다른 판정이면 바뀜' : `지지가 되려면 범위가 0을 벗어나고 표본 ${cfg.minNsup} 넘게(지금 ${j && j.n != null ? j.n : '?'})`;
  const a = []; const nn = j && (j.kind === 'set' || j.kind === 'weather'); a.push(`새 자료 연속 지지 ${Math.min(cfg.confRuns, s.run && s.run.v === '지지' ? s.run.k : 0)}/${cfg.confRuns}회`); if (nn) a.push(`표본 ${j.n}/${cfg.minNconf}`); if (j && j.m === false) a.push(j.mWhy || '여유 모자람'); return '확신까지: ' + a.join(' · '); }

/* ── ⑤ 배선 단계 · defs = wires.json 줄 · W = 지난 상태 {id:{stage,since,up,down,log}} · ctx = {fresh:{문서:판정}, hyp:{H:상태}, score:{id:{n,v}|null}, gate(def,to)} ── */
function esWireStep(def, w, ctx, cfg, day) { cfg = { ...ES_DEF, ...(cfg || {}) }; const s0 = Number.isFinite(+def.stage) ? +def.stage : 1; const s = w ? { ...w } : { stage: s0, since: day, up: 0, down: 0 }; const out = { st: s, ch: null, note: null };
  const src = def.srcDoc || null; const fr = src ? ctx.fresh[src] : null; const sc = def.score && ctx.score ? ctx.score[def.id] : null; const move = (to, why) => { if (to === s.stage) return; out.ch = { id: def.id, from: s.stage, to, why }; s.stage = to; s.since = day; s.up = 0; s.down = 0; };
  if (fr === '❌' && s.stage > 1) { move(1, `재료(${src}) 36시간 멈춤 → 1단계(그림자)로`); return out; }
  if (ctx.reads && Array.isArray(def.reads) && def.reads.length && s.stage >= 2) { const n = ctx.reads[def.id]; if (n === 0) s.zero = (s.zero || 0) + 1; else if (n > 0) s.zero = 0; if ((s.zero || 0) >= (cfg.readsZeroDays || 3)) out.fix = `${def.id} 코드가 ${s.zero}일째 이 값을 안 읽음(읽은 횟수 0) — 끊김 · 고칠 일`; }
  const hs = (def.hyp || []).map((h) => ctx.hyp[h]).filter(Boolean); if (hs.length && s.stage >= 2 && hs.every((x) => !(x === '지지' || x === '확신'))) { move(s.stage - 1, `근거 가설(${def.hyp.join('·')})이 지지 아래로 내려감`); return out; }
  if (sc && sc.n != null && sc.v != null) { const lb = !!def.score.lower_better; const tg = def.score.target != null ? def.score.target : def.score.expect; const good = sc.n >= (def.score.min_n || 0) && (lb ? sc.v <= tg : sc.v >= tg); const bad = def.score.down != null && (lb ? sc.v > def.score.down : sc.v < def.score.down);
    if (bad) { s.down = (s.down || 0) + 1; s.up = 0; } else if (good) { s.up = (s.up || 0) + 1; s.down = 0; } else { s.up = 0; }
    if (s.down >= cfg.wireDownRuns && s.stage > 1) { move(s.stage - 1, `대조 점수 ${sc.v}(내림 기준 ${def.score.down}) ${s.down}일 연속`); return out; }
    const k = def.score.k || def.score.k_days || cfg.wireUpRuns; if (s.up >= k && s.stage < 4) { const to = s.stage + 1; if (to === 4 && (Date.parse(day) - Date.parse(s.since)) / 864e5 < cfg.stage4Days) { out.note = `4단계는 3단계 ${cfg.stage4Days}일 뒤(지금 ${Math.round((Date.parse(day) - Date.parse(s.since)) / 864e5)}일)`; return out; }
      const g = ctx.gate ? ctx.gate(def, to) : { ok: true }; if (!g.ok) { out.note = `${to}단계 올림 막음 — ${g.why}`; return out; } move(to, `대조 점수 ${sc.v}(목표 ${tg} · 표본 ${sc.n}/${def.score.min_n || 0}) ${s.up}일 연속`); }
    return out; }
  if (s.stage === 0 && (fr === '✅' || fr === '🟰' || fr === '⏳') && (!hs.length || hs.some((x) => x === '지지' || x === '확신'))) move(1, '재료가 살아 있음' + (hs.length ? ` · 근거 가설 ${def.hyp.join('·')} 지지` : '') + ' → 1단계(그림자 · 판단 안 바꿈)');
  else if (!sc) out.note = def.score ? '채점 재료가 아직 없음(그대로)' : '채점 칸(score) 없음 — 단계 그대로';
  return out; }
/* R18 울타리(제8조) — 돈 배선(money) 3단계 이상 올림은 여기를 통과할 때만 · g = {noLoss, cost:{ok,why,limit}, fenceNow:{at, dayLoss}, nowMs} */
function esGate(def, to, g, cfg) { cfg = { ...ES_DEF, ...(cfg || {}) }; if (!def.money || to < 3) return { ok: true };
  if (cfg.moneyUp !== true) return { ok: false, why: '설정 eng_self_cfg.moneyUp 꺼짐(기본 · 돈 배선 3단계 이상 올림 안 함)' };
  if (!g || g.noLoss !== false) return { ok: false, why: '무손해 모드 켜짐(app_settings/eng_fence.noLossMode · 못 읽어도 켜짐으로)' };
  if (!g.cost || !g.cost.ok) return { ok: false, why: (g.cost && g.cost.why) || '💸 정범님 허락 기록 없음' };
  const f = g.fenceNow || {}; const age = (g.nowMs - Date.parse(f.at || '')) / 3600e3; if (!(age < 36) || !(+f.dayLoss > 0)) return { ok: false, why: '하루 손해 한도(eng_fence_now)가 없거나 36시간 넘음' };
  return { ok: true, limit: Math.min(+f.dayLoss, +g.cost.limit || 0) }; }
/* 점 경로로 값 꺼내기(배선 score.n·score.v = 'a.b.c') */
const pick = (o, p) => String(p || '').split('.').filter(Boolean).reduce((x, k) => (x == null ? x : x[k]), o);

/* ── ⑥ 자기 채점 — 지난 회차까지 지지·확신이던 날짜 묶음 가설이 새로 들어온 날(그 묶음에 든 날)에 맞힌 방향 ── */
function esSelf(prev, J, states, fromDay) { const sc = { n: (prev && prev.n) || 0, hit: (prev && prev.hit) || 0, last: ((prev && prev.last) || []).slice(-30) }; if (!fromDay || !J.R) return sc;
  for (const h of ES_HYP) { const t = h.test; if (t.kind !== 'set' || !t.expect) continue; const st = states[h.id] && states[h.id].st; if (st !== '지지' && st !== '확신') continue;
    for (const d of J.sets[t.set] || []) { if (d <= fromDay || J.R[d] == null) continue; const a = J.R[d] - 1; sc.n++; const ok = a * t.expect > 0; if (ok) sc.hit++; sc.last.push({ d, id: h.id, a: r3(a), ok }); } }
  sc.rate = sc.n ? r3(sc.hit / sc.n) : null; sc.last = sc.last.slice(-30); return sc; }

/* ── 회차(Firestore) · D = { C, FV, W, log, nowIso, mlLedger, hol, wxDays, ml(), found, notes, now } ── */
function makeEngSelf(D) { const now = D.now || (() => Date.now()); let busy = false;
  async function get(p) { try { const [c, d] = p.split('/'); const x = await D.C(c).doc(d).get(); return x.exists ? x.data() : null; } catch (e) { return null; } }
  async function ledger() { const meta = await get('ml_sales/_meta'); const months = []; (await D.C('ml_sales').get()).forEach((d) => { if (d.id === '_meta') return; const v = d.data() || {}; months.push({ ym: v.ym || d.id, rows: v.rows || [] }); }); return { meta, months }; }
  async function run(o) { o = o || {}; if (busy) return { skip: '앞 회차가 도는 중' }; busy = true; try { return await run0(o); } finally { busy = false; } }
  async function run0(o) { const t0 = now(); const nowMs = now(); const today = kstDay(nowMs); const cfg0 = (await get('app_settings/eng_self_cfg')) || {}; const cfg = { ...ES_DEF, ...cfg0 }; const prev = (await get('app_settings/eng_self')) || {};
    const req = cfg0.reqAt && Date.parse(cfg0.reqAt) > Date.parse(prev.at || 0);
    if (!o.force && !req) { if (cfg.on === false) return { skip: '꺼짐(eng_self_cfg.on)' }; if (kstHour(nowMs) < cfg.hourKST) return { skip: `${cfg.hourKST}시 전` }; if (prev.day === today) return { skip: 1 }; }
    const alerts = []; const changes = [];
    /* ① 판매 장부 열어 보기(+ 멈췄으면 다시 받기) */
    let L = await ledger(); let insp = esInspect(L.meta, L.months, prev.ledger, nowMs, cfg);
    if (insp.metaStale && D.mlLedger) { let r = null; try { r = await D.mlLedger(); } catch (e) { r = { err: String(e.message || e).slice(0, 160) }; } L = await ledger(); const i2 = esInspect(L.meta, L.months, prev.ledger, now(), cfg); i2.retried = r; insp = i2; if (i2.metaStale) alerts.push({ lv: '🚨', k: 'ledger_meta', t: `판매 장부 고침이 멈춤 — 다시 불러도 ${i2.metaAt || '없음'} 그대로`, why: r && r.err ? r.err : '' }); }
    if (insp.st === '❌') alerts.push({ lv: '🚨', k: 'ledger', t: '판매 장부를 오늘 판정에 안 씀 — ' + insp.why.join(' · ') }); else if (insp.st === '⚠') alerts.push({ lv: '⚠', k: 'ledger_age', t: insp.why[0] });
    /* ② 연구 문서 신선도 */ const y = addD(today, -1); const paths = ES_DOCS.map((x) => x[0]).concat(ES_DOCS.filter((x) => x[2]).map((x) => `${x[2]}/${y}`)); const docs = {}; for (const p of paths) docs[p] = await get(p);
    const fresh = esFresh(docs, today, nowMs, cfg); const frMap = Object.fromEntries(fresh.map((f) => [f.k, f.s])); for (const f of fresh) if (f.s === '❌') alerts.push({ lv: '⚠', k: 'fresh_' + f.id, t: `${f.id} ${f.k} ${f.w}` });
    /* ③④ 가설 다시 셈 → 상태 */ const hs0 = prev.hs || {}; const hs = {}; let J = { hyp: [] }; const lines = []; if (insp.use) for (const m of L.months) for (const r of m.rows) lines.push(r);
    const dataDay = insp.last ? insp.last.slice(0, 10) : null; const newData = insp.use && (!prev.dataDay || (dataDay && dataDay > prev.dataDay));
    if (insp.use) { let wx = {}; try { wx = D.wxDays ? (await D.wxDays()) || {} : {}; } catch (e) { wx = {}; } J = esJudge(lines, D.hol, wx, cfg, Array.isArray(cfg0.hyp) ? cfg0.hyp : ES_HYP); }
    for (const j of J.hyp) { const s = esStep(hs0[j.id], j, cfg, newData, today, dataDay); const hist = ((hs0[j.id] && hs0[j.id].hist) || []).slice(-59); if (newData || !hs0[j.id]) hist.push({ d: today, v: j.v, e: j.e && j.e.eff != null ? j.e.eff : null, lo: j.e && j.e.lo != null ? j.e.lo : null, hi: j.e && j.e.hi != null ? j.e.hi : null, n: j.n });
      const { changed, ...rest } = s; hs[j.id] = { ...rest, claim: j.claim, v: j.v, label: j.label, e: j.e || null, n: j.n, hist, next: esNext(rest, j, cfg) }; if (changed) changes.push({ what: 'hyp', id: j.id, claim: j.claim, ...changed, e: j.e || null, n: j.n }); }
    for (const [id, s] of Object.entries(hs0)) if (!hs[id]) hs[id] = s; /* 오늘 셈 못 한 가설은 그대로 둠(지우지 않음) */
    /* ⑤ 배선 */ const WS = (await get('app_settings/eng_wire_stage')) || {}; const defs = (D.wireDefs && D.wireDefs()) || []; const W0 = WS.w || {}; /* 정의 = 함께 올린 cloud/eng-wires.json(readnow-chats registry/wires.json에서 기계 칸만 · 새 배선은 정범님 결정이라 사람이 묶음) · 단계 상태 = eng_wire_stage(wire1 요약 문서 eng_wires와 겹치지 않게) */
    let reads = null; try { const ym = y.slice(0, 7); const rd = await get(`app_settings/eng_wire_reads_${ym}`); if (rd && rd.d && rd.d[y]) reads = rd.d[y]; } catch (e) {} const W1 = {}; const wnotes = {}; let gate = null;
    if (defs.some((d) => d.money)) { let ML = null; try { ML = D.ml ? await D.ml() : null; } catch (e) {} const fc = await get('app_settings/eng_fence'), fn = await get('app_settings/eng_fence_now'), co = await get('app_settings/research_cost_ok');
      const g = { noLoss: ML && ML.fenceNoLoss ? ML.fenceNoLoss(fc || {}) : true, cost: ML && ML.fenceCostOk ? ML.fenceCostOk(co, { what: 'wire', nowMs }) : { ok: false, why: 'ml-core 허락 검사 없음' }, fenceNow: fn || {}, nowMs }; gate = (def, to) => esGate(def, to, g, cfg); }
    const score = {}; for (const d of defs) if (d.score && d.score.doc) { const v = docs[d.score.doc] !== undefined ? docs[d.score.doc] : await get(d.score.doc); score[d.id] = v ? { n: +pick(v, d.score.n) || 0, v: Number.isFinite(+pick(v, d.score.v)) && pick(v, d.score.v) != null ? +pick(v, d.score.v) : null } : null; }
    const hyMap = Object.fromEntries(Object.entries(hs).map(([k, v]) => [k, v.st]));
    for (const d of defs) { if (!d || !/^W\d{2}$/.test(String(d.id || ''))) continue; const r = esWireStep(d, W0[d.id], { fresh: frMap, hyp: hyMap, score, gate, reads }, cfg, today); if (r.fix) alerts.push({ lv: '⚠', k: 'wire_' + d.id, t: r.fix }); const lg = ((W0[d.id] && W0[d.id].log) || []).slice(-19); if (r.ch) { lg.push({ d: today, from: r.ch.from, to: r.ch.to, why: r.ch.why }); changes.push({ what: 'wire', ...r.ch }); } W1[d.id] = { ...r.st, log: lg, note: r.note || null }; if (r.note) wnotes[d.id] = r.note; }
    for (const [id, s] of Object.entries(W0)) if (!W1[id]) W1[id] = s;
    /* ⑥ 자기 채점 */ const self = newData ? esSelf(prev.self, J, hs0, prev.dataDay) : prev.self || { n: 0, hit: 0 };
    /* ⑦ 남기기 */ const cnt = { 확신: 0, 지지: 0, 반대: 0, 불명: 0, '재료 없음': 0 }; for (const s of Object.values(hs)) cnt[s.st] = (cnt[s.st] || 0) + 1; const tot = Object.values(hs).length; const decided = cnt.확신 + cnt.지지 + cnt.반대;
    const saw = { ledger: { st: insp.st, rows: insp.rows, last: insp.last, ageH: insp.ageH, blank: insp.blank, months: insp.months, newRows: insp.newRows, metaAt: insp.metaAt, why: insp.why, retried: insp.retried ? true : undefined }, fresh: fresh.map((f) => `${f.s} ${f.id} ${f.w}`), n_days: J.n_days || 0, range: J.range || null, newData, breaks: (J.breaks || []).map((b) => `${b.from}~${b.to}`) };
    const rid = `${today}T${new Date(nowMs + 9 * 3600e3).toISOString().slice(11, 16).replace(':', '')}`; const ms = now() - t0;
    const doc = { v: ES_V, at: D.nowIso(), day: today, rid, by: o.by || 'engine', dataDay: newData ? dataDay : prev.dataDay || dataDay, ledger: insp.st === '❌' && prev.ledger ? prev.ledger : { rows: insp.rows, last: insp.last, per: insp.per }, saw, /* 거절한 장부(줄어듦·빈 칸)는 '어제 기준'으로 삼지 않음 — 이튿날에도 줄어든 것을 알아봄 */ hs, cnt, wires: Object.fromEntries(Object.entries(W1).map(([k, v]) => [k, { stage: v.stage, since: v.since, note: v.note || null }])), changes: changes.slice(0, 60), alerts, self, cfgUsed: { minNsup: cfg.minNsup, minNconf: cfg.minNconf, confRuns: cfg.confRuns, downRuns: cfg.downRuns, margin: cfg.margin, moneyUp: cfg.moneyUp === true }, ms };
    const led = { v: ES_V, at: doc.at, day: today, by: doc.by, saw, verdicts: Object.fromEntries(J.hyp.map((j) => [j.id, { v: j.v, e: j.e && j.e.eff != null ? j.e.eff : null, lo: j.e && j.e.lo != null ? j.e.lo : null, hi: j.e && j.e.hi != null ? j.e.hi : null, n: j.n }])), states: hyMap, changes, kept: tot - changes.filter((c) => c.what === 'hyp').length, wires: Object.fromEntries(Object.entries(W1).map(([k, v]) => [k, v.stage])), wnotes, alerts, self: { n: self.n, hit: self.hit, rate: self.rate == null ? null : self.rate }, ms };
    const lref = D.C('eng_ledger').doc(rid); const ex = await lref.get().catch(() => null); const lref2 = ex && ex.exists ? D.C('eng_ledger').doc(rid + '_' + String(nowMs % 1e5)) : lref; /* 덧붙이기만 — 같은 이름이 있으면 새 이름 */
    await lref2.set({ ...led, ...D.W() });
    await D.C('app_settings').doc('eng_self').set({ ...doc, ...D.W() });
    await D.C('app_settings').doc('eng_wire_stage').set({ w: W1, at: doc.at, defsN: defs.length, ...D.W() }, { merge: true });
    /* research_pulse N05 — 같은 지표(지지·반대가 된 가설 몫) · 추세는 지난 것에 오늘을 더함 */ let pulse = null;
    if (tot && D.pulse) { try { const rp = (await get('app_settings/research_pulse')) || {}; const p0 = (rp.studies && rp.studies.N05) || {}; const tr = (Array.isArray(p0.trend) ? p0.trend : []).filter((t) => t && t.d !== today).slice(-89); const val = r3(decided / tot); tr.push({ d: today, v: val });
      const hc = changes.filter((c) => c.what === 'hyp' && c.from); pulse = await D.pulse({ day: today, studies: { N05: { at: nowMs, metric: ES_PULSE_METRIC, value: val, trend: tr, changed: hc.length ? hc.map((c) => `${c.id} ${c.from}→${c.to}`).join(' · ') : '바뀐 판정 없음', note: `🤖 엔진 스스로 셈(클라우드 · AI 없음) — 확신 ${cnt.확신} · 지지 ${cnt.지지} · 반대 ${cnt.반대} · 불명 ${cnt.불명} · 재료 없음 ${cnt['재료 없음']} · ${J.n_days || 0}날 · 자기 채점 ${self.n ? `${self.hit}/${self.n}` : '아직'}`, src: 'cloud engself ' + ES_V } } }, 'engine:engself'); } catch (e) { alerts.push({ lv: '⚠', k: 'pulse', t: '연구 진화 기록 올리기 실패 ' + String(e.message || e).slice(0, 100) }); } }
    /* 📚 발견 모음 — 확신이 되거나 확신에서 내려간 가설만(확인됨 · 뒤집힘) */
    if (D.found) for (const c of changes.filter((x) => x.what === 'hyp' && (x.to === '확신' || x.from === '확신'))) { try { await D.found({ d: today, area: '시장·매출', key: `es_${c.id.toLowerCase()}_${c.to === '확신' ? 'conf' : 'down'}`, t: `${c.claim} — ${c.to === '확신' ? '확신' : '확신에서 ' + c.to + '로 내려감'}(엔진 스스로)`, ev: c.why, use: '🧠 소비심리 가설 → 배선(W02·W03 등) 단계 후보', st: c.to === '확신' ? '확인됨' : '뒤집힘', src: 'app_settings/eng_self · eng_ledger/' + rid, tags: ['소비심리', '엔진 스스로'] }, 'engine:engself'); } catch (e) {} }
    /* 🚨 카드 — 장부 멈춤·줄어듦만(이틀째부터 · 하루 한 장) */
    const prevA = new Set((prev.alerts || []).filter((a) => a.lv === '🚨').map((a) => a.k)); const card = alerts.filter((a) => a.lv === '🚨' && prevA.has(a.k));
    if (card.length && D.notes) { try { await D.notes([{ op: 'merge', id: `es_alert_${today}`, data: { kind: 'card', cat: '연구', sub: '연구 엔진', leaf: '🤖 엔진 스스로', imp: 2, title: '🚨 연구 엔진 — 판매 장부가 이틀째 멈춤', body: card.map((a) => `- ${a.t}${a.why ? ' · ' + a.why : ''}`).join('\n') + '\n\n(엔진이 다시 받기를 해 봤으나 그대로 — 코드 확인은 리드 몫)', src: 'engine:engself', state: 'open' } }], 'engine:engself'); } catch (e) {} }
    D.log('🤖 연구 엔진 스스로', `가설 ${tot}(확신 ${cnt.확신}·지지 ${cnt.지지}) · 바뀜 ${changes.length} · 알림 ${alerts.length} · ${ms}ms`);
    return { rid, changes: changes.length, alerts: alerts.length, cnt, pulse: pulse ? pulse.n : 0, ms }; }
  async function diag(q) { const out = { self: await get('app_settings/eng_self'), wires: await get('app_settings/eng_wire_stage'), cfg: await get('app_settings/eng_self_cfg') };
    try { const L = []; (await D.C('eng_ledger').orderBy('at', 'desc').limit(Math.min(30, +q.engDays || 7)).get()).forEach((d) => L.push({ id: d.id, ...d.data() })); out.ledger = L; } catch (e) { out.ledger = { err: e.message }; } return out; }
  return { run, diag, _busy: () => busy };
}
module.exports = { ES_V, ES_DEF, ES_HYP, ES_DOCS, esInspect, esFresh, esDays, esRel, esBoot, esEffect, esBreaks, esSets, esJudge, esStep, esNext, esWireStep, esGate, esSelf, makeEngSelf, _t: { addD, dowOf, kstDay, rng } };
