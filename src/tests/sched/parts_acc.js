  const asLabel = (job) => { const c = asCatalog().find((x) => x.job === job); return c ? c.label : job; };
  const asName = (s) => (s && (s.name || asLabel(s.job))) || '';
  const asMissing = (s) => !!s && !asCatalog().some((c) => c.job === s.job); /* 이 수집기 판에 없는 일(옛 판 PC·지워진 일) — 그 PC는 건너뜀 */
  const asMissTag = (s) => (asMissing(s) ? ' <b style="color:#B0322A">(이 수집기 판에 없는 일 — 이 PC는 건너뜀)</b>' : '');
  const asDur = (job) => AS.durations(job, JSTATS, SCHED_RUNS, AS.slotsOf(SCHED));
  const asAvgMs = (job) => { const d = asDur(job); return d.n ? d.avg : null; };
  const asDurTxt = (job, big) => { const d = asDur(job); if (d.n) return `${big ? '<b>' : ''}⏱ 평균 ${AS.fmtMs(d.avg)}${big ? '</b>' : ''}<small> (최근 ${d.n}번${d.approx ? '·기록으로 어림' : ''}${d.n > 1 ? ` · ${AS.fmtMs(d.min)}~${AS.fmtMs(d.max)}` : ''})</small>`; return d.stopN ? `<span style="color:#A8661B">⏱ 끝까지 한 기록 없음</span><small> (멈춘 ${d.stopN}번 · 평균 ${AS.fmtMs(d.stopAvg)}에 멈춤)</small>` : '<span style="color:#8A9690">⏱ 아직 돌린 기록 없음</span>'; };
