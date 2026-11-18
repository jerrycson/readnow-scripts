/* 🩺 연구·엔진 건강 장부 (engloop1 · 2026-11-19 · 정범님 11/19 00:07 「이번엔 반드시 스스로 계속 돌아가는 방안을 마련해서 너가 감시 안해도 작동하게」 · 헌장 제44조)
 *  하는 일(클라우드 /tick 안 · 30분마다 · AI 없음):
 *   ① 연구·엔진 일마다 결과 문서를 열어 마지막으로 돈 때·결과 수를 봄 → 정해진 때(maxH)를 넘겼으면 「늦음」, 결과 수가 0이면 「0」, 문서가 없으면 「없음」
 *   ② 나쁘면 그 일을 스스로 다시 부름(redo · 하루 maxTries번까지) → 다시 읽어 나아졌는지 셈 · 안 나아지면 fail+1
 *   ③ dailyJobs가 끝날 때 그 회차의 실패(out.xxxErr)를 일마다 남김(noteRun)
 *   ④ fail이 failCard번 넘거나(다시 불러도 안 됨) 하루 실패가 2번이거나, 세션(Claude 예약) 몫 연구 맥박이 sessStaleH시간 넘게 묵으면 정범 노트 카드 하루 한 장(✕ 닫기 되는 노트 카드)
 *   ⑤ relay — 하루 한 번(한국 relayHourKST시 넘어) 클라우드 문서만으로 셀 수 있는 연구 맥박(N06·N10·R02·R04·R07·R18·R19·R20·R12·C05)을
 *      세션 회차가 relayStaleH시간 넘게 안 넣었을 때만 대신 넣음(세션이 넣은 새 값은 덮지 않음 · 같은 뜻·같은 셈 — score.py calib_timesplit·pair_agreement를 그대로 옮김)
 *  남기는 곳: app_settings/research_health(덮어씀 · 셈 결과) · research_pulse(pulseIn · merge) · jb_notes 카드(rh_<날>)
 *  지키는 것: 관찰·다시 부르기만 — 값·등록·돈을 바꾸지 않음(제33조 무손해) · 지우지 않음 · 끄기 cloud_jobs.reshealth=false 또는 app_settings/research_health_cfg.on=false */
'use strict';
const RH_V = '1.0.0';
const RH_DEF = {
  on: true, everyMin: 30, maxTries: 2, failCard: 2, errCard: 2, // 30분마다 · 하루 2번까지 다시 부름 · 2번 실패면 카드
  sessStaleH: 48, relayHourKST: 17, relayStaleH: 30, // 세션 몫 맥박 48시간 묵으면 카드 · 17시(세션 14:37 회차 뒤) 넘어 30시간 넘게 묵은 연구만 대신 넣음
};
/* 일마다: k 이름 · t 보이는 이름 · doc 문서 · at 때 칸 · n 결과 수 칸(0이면 「0」) · maxH 이만큼 넘게 안 돌면 「늦음」 · redo 다시 부르는 열쇠(index.js가 줌 · 없으면 깃발만) · ses 세션 예약이 하는 일 */
const RH_JOBS = [
  { k: 'engself', t: '🤖 연구 엔진 스스로', doc: 'app_settings/eng_self', at: 'at', n: null, maxH: 32, redo: 'engself' },
  { k: 'cons', t: '🛒 소비심리', doc: 'app_settings/cons_study', at: 'at', n: 'tot.orders', maxH: 30, redo: 'cons' },
  { k: 'badge', t: '🏷 표시 배지', doc: 'app_settings/badge_study', at: 'at', n: 'runs', maxH: 30, redo: 'badge' },
  { k: 'extras', t: '🎁 덤·미개봉 요소', doc: 'app_settings/extras_study', at: 'at', n: 'priced', maxH: 30, redo: 'extras' },
  { k: 'ratio', t: '⚖ 판매 비율', doc: 'app_settings/ratio_study', at: 'at', n: 'askN', maxH: 30, redo: 'ratio' },
  { k: 'buyback', t: '📦 매입 받아 줄 확률', doc: 'app_settings/buyback_stats', at: 'at', n: 'reqN', maxH: 30, redo: 'buyback' },
  { k: 'saud', t: '👥 구매자 분포', doc: 'app_settings/seller_aud', at: 'at', n: 'items', maxH: 30, redo: 'saud' },
  { k: 'bench', t: '🏢 견줌 관측', doc: 'app_settings/bench_obs', at: 'at', n: 'chk', maxH: 30, redo: 'bench' },
  { k: 'value', t: '🪶 판매가치 표', doc: 'app_settings/value_model', at: 'trainedAt', n: 'pos', maxH: 48, redo: 'value' },
  { k: 'learn', t: '🧠 스스로 배우기', doc: 'app_settings/ml_state', at: 'learn.at', n: 'learn.rows', maxH: 30, redo: 'learn' },
  { k: 'voice', t: '💬 구매평 주제', doc: 'app_settings/voice_study', at: 'at', n: 'n', maxH: 36, redo: null },
  { k: 'adapt', t: '🧬 수집 적응', doc: 'app_settings/adapt_health', at: 'at', n: 'pages', maxH: 30, redo: null },
  { k: 'oop', t: '📕 품절·절판', doc: 'app_settings/oop_study', at: 'at', n: 'top', maxH: 30, redo: null },
  { k: 'aisum', t: '✍ 요약 엔진', doc: 'app_settings/aisum_state', at: 'at', n: 'nC', maxH: 30, redo: null },
  { k: 'edition', t: '📚 판본 추적', doc: 'app_settings/ed_study', at: 'at', n: null, maxH: 30, redo: null },
  { k: 'px', t: '🔬 조회수 실험', doc: 'app_settings/pxDaily', at: 'lastStartAt', n: 'lastPlan.n', maxH: 30, redo: null },
];
/* dailyJobs out 실패 키 → 일 */
const RH_ERR = { consErr: 'cons', engselfErr: 'engself', benchObsErr: 'bench', adaptErr: 'adapt', aisumErr: 'aisum', editionErr: 'edition', learnErr: 'learn', pxErr: 'px' };
const SESS_IDS = ['R05', 'R06', 'R14', 'N04', 'N14', 'R13', 'N11']; // 세션(score.py · git 장부)만 셀 수 있는 연구 — 이 판은 세션 몫으로 남김

const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const kstHour = (ms) => new Date(ms + 9 * 3600e3).getUTCHours();
const getP = (o, p) => { if (!p) return undefined; let x = o; for (const s of String(p).split('.')) { if (x == null || typeof x !== 'object') return undefined; x = x[s]; } return x; };
const rhClean = (x) => JSON.parse(JSON.stringify(x, (k, v) => (v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? null : v)));
const r4 = (x) => (typeof x === 'number' && Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : null); // 소수 6자리(R02 로그 손실 0.056531처럼 세션 값과 같은 자리)
const toMs = (x) => { if (x == null) return null; if (typeof x === 'number') return x > 1e12 ? x : null; if (x && typeof x.toDate === 'function') return x.toDate().getTime(); if (x && typeof x._seconds === 'number') return x._seconds * 1000; const t = Date.parse(String(x)); return Number.isFinite(t) ? t : null; };

/* 문서 하나 → 상태 · ok / late(늦음) / zero(결과 0) / none(문서 없음) */
function rhJudge(job, d, nowMs) {
  if (!d) return { st: 'none', last: null, ageH: null, n: null };
  const t = toMs(getP(d, job.at)); const ageH = t == null ? null : Math.round((nowMs - t) / 36e5 * 10) / 10;
  const nv = job.n ? getP(d, job.n) : null; const n = typeof nv === 'number' ? nv : Array.isArray(nv) ? nv.length : nv && typeof nv === 'object' ? Object.keys(nv).length : null;
  let st = 'ok'; if (t == null || ageH > job.maxH) st = 'late'; else if (job.n && n === 0) st = 'zero';
  return { st, last: t == null ? null : new Date(t).toISOString(), ageH, n };
}

/* 세션 몫 연구 맥박이 얼마나 묵었나 — src가 'cloud …'·'app_settings/ed_study'(클라우드가 넣은 것)는 뺌 */
function rhSess(pulse, nowMs) {
  const S = (pulse && pulse.studies) || {}; let best = null; const ids = [];
  for (const [id, e] of Object.entries(S)) { if (!e || typeof e !== 'object') continue; const src = String(e.src || ''); if (/^cloud\b/.test(src) || /^app_settings\/ed_study/.test(src)) continue; const t = toMs(e.at); if (t == null) continue; if (best == null || t > best) best = t; if (SESS_IDS.includes(id)) ids.push(id); }
  return { at: best == null ? null : new Date(best).toISOString(), ageH: best == null ? null : Math.round((nowMs - best) / 36e5 * 10) / 10, ids };
}

/* score.py calib_timesplit 그대로 — rows [(날, 무리, 보냄, 받음)] 날 차례 · 그날 전까지 본 것만으로 확률 */
function rhCalib(rows, priorW, bins) {
  priorW = priorW == null ? 5 : priorW; bins = bins || 10;
  const R = (rows || []).filter((r) => Array.isArray(r) && r[2]).map((r) => [String(r[0]), String(r[1]), +r[2] || 0, +r[3] || 0]);
  R.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)); // 파이썬 sorted(key=날)와 같은 안정 정렬
  let totN = 0, totY = 0; const G = new Map(); const preds = []; let i = 0;
  while (i < R.length) { const d = R[i][0]; const today = []; while (i < R.length && R[i][0] === d) { today.push(R[i]); i++; }
    if (totN > 0) { const base = totY / totN; for (const [, g, n, y] of today) { const [gn, gy] = G.get(g) || [0, 0]; preds.push([(gy + priorW * base) / (gn + priorW), base, n, y]); } }
    for (const [, g, n, y] of today) { totN += n; totY += y; const [gn, gy] = G.get(g) || [0, 0]; G.set(g, [gn + n, gy + y]); } }
  if (!preds.length) return null;
  const ece = (k) => { const B = new Map(); for (const t of preds) { const p = t[k], n = t[2], y = t[3]; const b = Math.min(bins - 1, Math.floor(p * bins)); const s = B.get(b) || [0, 0, 0]; s[0] += p * n; s[1] += n; s[2] += y; B.set(b, s); } let N = 0, S = 0; for (const s of B.values()) { N += s[1]; if (s[1]) S += Math.abs(s[0] / s[1] - s[2] / s[1]) * s[1]; } return N ? S / N : null; };
  const brier = (k) => { let N = 0, S = 0; for (const t of preds) { N += t[2]; S += t[3] * (1 - t[k]) ** 2 + (t[2] - t[3]) * t[k] ** 2; } return N ? S / N : null; };
  return { n: preds.reduce((a, t) => a + t[2], 0), groups: G.size, chall: ece(0), base: ece(1), brier_chall: brier(0), brier_base: brier(1) };
}

/* score.py pair_agreement + C05 어댑터의 LEGAL_T·LEGAL_O 그대로 */
const LEGAL_T = (w) => w.startsWith('사업자 등록번호 같음') || w.startsWith('공정위 대표자명 같음') || w.startsWith('공정위 대표자 = 가게 고지 대표자');
const LEGAL_O = (w) => ['전화 같음', '대표자명 같음', '상호 같음', '메일 같음', '통신판매', '상담 전화', '상담 메일'].some((x) => w.startsWith(x));
function rhPairs(pairs, truth, ignore) {
  truth = truth || LEGAL_T; ignore = ignore || LEGAL_O; const why = (p) => (Array.isArray(p && p.why) ? p.why.map(String) : []);
  const P = Array.isArray(pairs) ? pairs : []; const sig = (p) => why(p).filter((w) => !truth(w) && !ignore(w));
  const T = P.filter((p) => why(p).some(truth)); const F = P.filter((p) => sig(p).length); const both = F.filter((p) => why(p).some(truth));
  return { pairs: P.length, truth: T.length, flagged: F.length, both: both.length, prec: F.length ? both.length / F.length : null, recall: T.length ? both.length / T.length : null };
}

/* 클라우드 문서만으로 셀 수 있는 맥박 — {id: {value, champ, chall, metric, note, src}} (값이 없으면 빠짐) */
function rhRelayCalc(docs) {
  const g = (p) => docs[p] || {}; const out = {}; const put = (id, value, o) => { if (typeof value !== 'number' || !Number.isFinite(value)) return; out[id] = { value: r4(value), champ: r4(value), ...o }; };
  put('N06', g('app_settings/voice_study').cover, { metric: '구매평 주제 찾은 몫(cover · 높을수록 좋음)', note: `구매평 ${g('app_settings/voice_study').n || '?'}개` });
  put('N10', g('app_settings/adapt_health').score, { metric: '칸 건강 점수(높을수록 좋음)', note: `읽은 쪽 ${g('app_settings/adapt_health').pages || '?'}` });
  const M = getP(g('app_settings/ml_state'), 'learn.metrics') || {}; const ll = (x) => (x && typeof x.logloss === 'number' ? x.logloss : null);
  if (ll(M.champ) != null) { put('R02', ll(M.champ), { metric: '로그 손실(시간 분할 검증)', note: `챔피언 ${r4(ll(M.champ))} · 도전자 ${r4(ll(M.chall))} · 기준 ${r4(ll(M.base))} · 학습 줄 ${getP(g('app_settings/ml_state'), 'learn.rows') || '?'}` }); if (out.R02 && ll(M.chall) != null) out.R02.chall = r4(ll(M.chall)); }
  if (docs['app_settings/strat_run']) put('R04', +g('app_settings/strat_run').n || 0, { metric: '실행한 전략 수', note: `켜짐 ${g('app_settings/strat_run').on ? '예' : '아니오'} · ${g('app_settings/strat_run').idle || ''}` });
  const plan = getP(g('app_settings/pxDaily'), 'lastPlan.plan'); if (Array.isArray(plan)) put('R07', plan.reduce((a, x) => a + (+(x && x.addLeft) || 0), 0), { metric: '조회수 실험 남은 권수', note: `묶음 ${plan.length}` });
  if (docs['app_settings/eng_fence']) put('R18', g('app_settings/eng_fence').noLossMode ? 1 : 0, { metric: '무손해 모드(1=켬)', note: '' });
  put('R19', getP(g('app_settings/extras_study'), 'comp.sealed.premium'), { metric: '미개봉 웃돈', note: `값 아는 것 ${g('app_settings/extras_study').priced || '?'}` });
  put('R20', g('app_settings/badge_study').liftMed, { metric: '표시 있으면 판매 배율', note: `회차 ${g('app_settings/badge_study').runs || '?'}` });
  const tl = g('app_settings/buyback_stats').tl; const C = Array.isArray(tl) ? rhCalib(tl) : null;
  if (C && C.brier_chall != null) put('R12', C.brier_chall, { metric: '받아 줄 확률 Brier(그때까지 알던 등급별 매입률 → 다음 접수 결과)', note: `채점함: ${C.n}권 · Brier 등급별 ${C.brier_chall.toFixed(3)} vs 전체율 하나 ${C.brier_base.toFixed(3)} · ECE ${C.chall.toFixed(3)}/${C.base.toFixed(3)}` });
  const deep = docs.deep; if (deep && Array.isArray(deep.pairs)) { const A = rhPairs(deep.pairs); if (A.prec != null) put('C05', A.prec, { metric: '지문 신호가 있는 짝 중 법정 고지로도 같은 몫', note: `짝 ${A.pairs} · 지문 신호 짝 ${A.flagged} 중 법정 근거도 ${A.both}(${deep.day || '?'}_deep)` }); }
  return out;
}

/* D: { C, W, log, nowIso, now?, get?(path, fields), pulse(P, by), notes(ops, by), jobsOn?() (cloud_jobs.reshealth), redo: {열쇠: () => Promise} } */
function makeResHealth(D) {
  const now = D.now || (() => Date.now());
  const get = D.get || (async (p) => { const [c, id] = p.split('/'); const s = await D.C(c).doc(id).get(); return s.exists ? s.data() : null; });
  const REF = () => D.C('app_settings').doc('research_health');
  let checkAt = 0, busy = false;
  const fieldsOf = (job) => [job.at, job.n].filter(Boolean);
  async function cfg() { return { ...RH_DEF, ...((await get('app_settings/research_health_cfg').catch(() => null)) || {}) }; }
  async function check(o) { o = o || {}; const nowMs = now(); const C0 = await cfg(); if (C0.on === false || (D.jobsOn && !(await D.jobsOn()))) return { skip: 'off' }; if (!o.force && nowMs - checkAt < C0.everyMin * 60e3) return null; if (busy) return { skip: 'busy' }; checkAt = nowMs; busy = true;
    try { const today = kstDay(nowMs); const prev = (await get('app_settings/research_health')) || {}; const PJ = prev.jobs || {}; const jobs = {}; const bad = [];
      for (const job of RH_JOBS) { let d = null, gerr = null; try { d = await get(job.doc, fieldsOf(job)); } catch (e) { gerr = String(e.message || e).slice(0, 140); }
        const p0 = PJ[job.k] || {}; const same = p0.day === today; const J = { t: job.t, doc: job.doc, maxH: job.maxH, day: today, tries: same ? p0.tries || 0 : 0, fail: same ? p0.fail || 0 : 0, errN: same ? p0.errN || 0 : 0, err: p0.err || null, errAt: p0.errAt || null, redoAt: p0.redoAt || null, redoR: p0.redoR || null, ...rhJudge(job, d, nowMs) };
        if (gerr) { J.st = 'none'; J.readErr = gerr; }
        if (J.st !== 'ok') { const fn = job.redo && D.redo && D.redo[job.redo];
          if (fn && J.tries < C0.maxTries) { J.tries++; J.redoAt = D.nowIso(); try { const r = await fn(); J.redoR = r == null ? 'null' : JSON.stringify(r).slice(0, 160); } catch (e) { J.redoR = '실패 ' + String(e.message || e).slice(0, 140); }
            try { Object.assign(J, rhJudge(job, await get(job.doc, fieldsOf(job)), now())); } catch (e) {}
            if (J.st !== 'ok') J.fail++; }
          else if (!fn && p0.st && p0.st !== 'ok' && J.fail < 9) J.fail++; } // 다시 부를 길이 없는 일은 '늦음'이 두 회차 이어지면 실패로 셈
        if (J.st !== 'ok') bad.push(job.k); jobs[job.k] = J; }
      let pulse = null; try { pulse = await get('app_settings/research_pulse', ['studies', 'at']); } catch (e) {}
      const sess = rhSess(pulse, nowMs); sess.st = sess.ageH == null || sess.ageH > C0.sessStaleH ? 'late' : 'ok';
      const doc = { v: RH_V, at: D.nowIso(), day: today, ok: !bad.length && sess.st === 'ok', bad, jobs, sess, relay: prev.relay || null, cardDay: prev.cardDay || null };
      const cardJobs = RH_JOBS.filter((j) => jobs[j.k].fail >= C0.failCard || jobs[j.k].errN >= C0.errCard);
      if ((cardJobs.length || sess.st === 'late') && D.notes && prev.cardDay !== today) {
        const lines = cardJobs.map((j) => { const x = jobs[j.k]; return `- ${j.t}: ${x.st === 'none' ? '문서 없음' : x.st === 'zero' ? '결과 0' : x.st === 'late' ? `마지막 ${x.last ? x.last.slice(5, 16).replace('T', ' ') : '?'}(${x.ageH == null ? '?' : x.ageH}시간 전 · 한도 ${j.maxH})` : '지금은 됨'} · 다시 ${x.tries}번 · 실패 ${x.fail}${x.err ? ` · 마지막 오류 「${String(x.err).slice(0, 80)}」` : ''}`; });
        if (sess.st === 'late') lines.push(`- 📋 세션(Claude 매일 엔진 회차) 몫 연구 맥박: 마지막 ${sess.at ? sess.at.slice(5, 16).replace('T', ' ') : '없음'}(${sess.ageH == null ? '?' : sess.ageH}시간 전) — ${SESS_IDS.join('·')}는 세션만 셈 · 클라우드가 셀 수 있는 연구는 17시 넘어 대신 넣음`);
        try { await D.notes([{ op: 'merge', id: `rh_${today}`, data: { kind: 'card', cat: '연구', sub: '연구 엔진', leaf: '🩺 연구 건강', imp: 2, title: '🩺 연구·엔진 일이 멈춤 — 스스로 다시 불러도 안 됨', body: lines.join('\n') + '\n\n(클라우드 /tick이 30분마다 보고 하루 2번까지 다시 부름 · 진단 doc=app_settings/research_health · 코드 확인은 리드 몫)', src: 'engine:health', state: 'open' } }], 'engine:health'); doc.cardDay = today; doc.card = true; } catch (e) { doc.cardErr = String(e.message || e).slice(0, 120); } }
      await REF().set({ ...rhClean(doc), ...D.W() }); if (!doc.ok) D.log('🩺 연구 건강', `나쁨 ${bad.join('·') || '-'} · 세션 맥박 ${sess.ageH}시간`); return doc;
    } finally { busy = false; } }
  /* dailyJobs 끝 — out.xxxErr를 일마다 남김(하루 errN) */
  async function noteRun(out) { if (!out || typeof out !== 'object') return null; const hit = Object.entries(RH_ERR).filter(([e]) => out[e]); if (!hit.length) return { n: 0 };
    const nowMs = now(); const today = kstDay(nowMs); const prev = (await get('app_settings/research_health')) || {}; const jobs = {};
    for (const [e, k] of hit) { const p0 = (prev.jobs || {})[k] || {}; const same = p0.day === today; jobs[k] = { day: today, errN: (same ? p0.errN || 0 : 0) + 1, err: String(out[e]).slice(0, 160), errAt: D.nowIso(), ...(same ? {} : { tries: 0, fail: 0 }) }; }
    await REF().set(rhClean({ jobs }), { merge: true }); return { n: hit.length, k: hit.map((h) => h[1]) }; }
  /* 하루 한 번 — 클라우드가 셀 수 있는 연구 맥박을, 세션이 relayStaleH시간 넘게 안 넣은 것만 */
  async function relay(o) { o = o || {}; const nowMs = now(); const C0 = await cfg(); if (C0.on === false || (D.jobsOn && !(await D.jobsOn()))) return { skip: 'off' }; const today = kstDay(nowMs);
    const prev = (await get('app_settings/research_health')) || {}; if (!o.force && ((prev.relay && prev.relay.day === today) || kstHour(nowMs) < C0.relayHourKST)) return null;
    const docs = {}; for (const p of ['app_settings/voice_study', 'app_settings/adapt_health', 'app_settings/ml_state', 'app_settings/strat_run', 'app_settings/pxDaily', 'app_settings/eng_fence', 'app_settings/extras_study', 'app_settings/badge_study', 'app_settings/buyback_stats']) { try { docs[p] = await get(p, null); } catch (e) {} }
    for (const dd of [today, kstDay(nowMs - 864e5)]) { try { const x = await get(`seller_fp_runs/${dd}_deep`, ['pairs', 'day']); if (x && Array.isArray(x.pairs)) { docs.deep = { ...x, day: x.day || dd }; break; } } catch (e) {} }
    const calc = rhRelayCalc(docs); const pulse = (await get('app_settings/research_pulse', ['studies']).catch(() => null)) || {}; const S = pulse.studies || {}; const P = { day: today, studies: {} }; const skipped = [];
    for (const [id, v] of Object.entries(calc)) { const cur = S[id] || {}; const t = toMs(cur.at); const src = String(cur.src || ''); const fromUs = /^cloud reshealth/.test(src);
      if (!o.force && !fromUs && t != null && nowMs - t < C0.relayStaleH * 36e5) { skipped.push(id); continue; } // 세션이 넣은 새 값은 그대로 둠
      const trend = (Array.isArray(cur.trend) ? cur.trend : []).filter((x) => x && x.d !== today).concat([{ d: today, v: v.value }]).slice(-90);
      P.studies[id] = { at: D.nowIso(), metric: cur.metric || v.metric, value: v.value, champ: v.champ, ...(v.chall != null ? { chall: v.chall } : {}), trend, changed: `클라우드가 대신 셈(세션 회차가 ${t == null ? '넣은 적 없음' : Math.round((nowMs - t) / 36e5) + '시간 전'})`, note: v.note || '', src: `cloud reshealth ${RH_V}` }; }
    const ids = Object.keys(P.studies); let r = { n: 0 }; if (ids.length && D.pulse) r = await D.pulse(P, 'engine:health');
    const rel = { day: today, at: D.nowIso(), ids, skipped, n: r && r.n || 0 }; await REF().set(rhClean({ relay: rel }), { merge: true }); if (ids.length) D.log('🩺 연구 건강 맥박 대신 넣음', ids.join('·')); return rel; }
  return { check, noteRun, relay, _busy: () => busy };
}

module.exports = { RH_V, RH_DEF, RH_JOBS, RH_ERR, SESS_IDS, rhJudge, rhSess, rhCalib, rhPairs, rhRelayCalc, makeResHealth, _t: { kstDay, kstHour, getP, toMs } };
