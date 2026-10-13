  /* ══════════ ⏰ 매일 자동 수집 (1.34.0 → 1.60.0 편집기) ══════════
   * 켜 두면(맨 위 스위치) 칸마다 정한 조건(시각·간격·다른 칸 뒤·오래되면·PC가 쉬면·켠 날 처음)에 그 일을 저절로 함 — 끌 때까지 매일.
   * 설정은 Firebase(prd_system/autoSched.slots — 칸 목록, 순서 = 우선순위) 한 곳 → 모든 PC가 같은 설정을 보고, 회차마다 한 PC만 맡음(prd_jobs/autoSched.runs 에 회차를 먼저 잡은 PC).
   * 같은 때 여러 칸이 할 때가 되면 위 칸부터 하나씩. 앞 칸이 막혀 있으면(다른 PC가 알라딘 작업 중·고객 탭 바쁨) 건너뛰고 다음 칸.
   * 주문(주문확인요청·발송 요청)과 알라딘 구매 첫 쪽은 클라우드가 늘 하므로 여기 없음. 고객 쪽 일(묻고 답하기·반품·고객 일괄)은 주문조회·판매관리 화면 탭에서만 돎.
   * (1.60.0) 편집기: 칸을 끌어 순서 바꾸기(움직임 보임) · 시간표에서 시각 블록을 끌어 시각 바꾸기 · 칸 더하기(모든 수집 일 — 앞으로 생기는 일도 저절로 목록에 나옴)·고치기·복제·지우기 · 일마다 평균 걸린 시간
   *  옛 수집기(1.59 이하)는 items(예전 일곱 칸)만 읽음 → 예전 칸을 예전과 같은 모양(정한 시각·다른 조건 없음)으로 둘 때만 items도 켜 둠(그 밖엔 꺼서 옛 수집기가 다르게 하지 않게) */
@@ENGINE@@
  const SCHED_REF = () => C('prd_system').doc('autoSched'); const SCHED_RUN = () => C('prd_jobs').doc('autoSched'); const JSTAT_REF = () => C('prd_system').doc('jobStats');
  let SCHED = null, SCHED_RUNS = {}, JSTATS = {}; window.__rnSchedOn = false; const BOOT_AT = Date.now(); let lastBusyAt = Date.now();
  const kstNow = () => { const k = AS.kst(Date.now()); return { day: k.day, min: k.min }; };
  const esc3 = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  /* ── 할 수 있는 일 목록(칸에 넣을 일) — 수집기의 일(JOBS)과 고객 쪽 일에서 저절로 만듦 → 앞으로 새 일이 생기면 여기에도 바로 나옴 ── */
  const AS_META = {
    'crm:qna': ['고객·주문', '새 질문·답 안 한 질문 (답이 늦으면 구매 포기)'], 'crm:returns': ['고객·주문', '반품 요청·처리 상태'], 'crm:orders': ['고객·주문', '전체 주문 목록·상세 (최근 20쪽)'], 'crm:cancels': ['고객·주문', '취소 주문 (최근 7쪽)'],
    'crm:reviews': ['고객·주문', '구매평'], 'crm:verify': ['고객·주문', '받은 주문 검증'], 'crm:recheck': ['고객·주문', '문제 주문 다시 확인'], 'crm:score': ['고객·주문', '고객 점수 다시 계산'], 'crm:sellerSync': ['판매자', '판매자 툴팁 동기화'],
    'crm:shopPolicy': ['고객·주문', '배송비 정책 확인'], 'crm:fbcheck': ['고객·주문', 'Firebase와 이 PC 기록 대조'], 'crm:upload': ['고객·주문', '이 PC 고객 기록을 Firebase에 올리기 + 점수'], 'crm:bulk': ['일괄', '고객·주문 전체 일괄 (예전 매일 자동 수집 · 오래 걸림)'],
    'prd:scanDaily': ['상품', '새등록 상품 + 상태가 바뀐 상품 (지난번까지 확인한 곳에서 멈춤)'], 'prd:scanNew': ['상품', '신규 등록분'], 'prd:scanFull': ['상품', '모든 상품 다시 확인 — 오래 걸림'], 'prd:photos': ['상품', '표지 없는 상품의 사진'],
    'prd:soldInfo': ['상품', '판매완료 상품 정보·이미지'], 'prd:market': ['시장', '도서 정보·시장 지표 (온라인 중고 첫 페이지)'], 'prd:metricsReq': ['시장', '그룹 시장 지표 갱신 (맡긴 일)'], 'prd:nbMarket': ['시장', '새상품 없는 상품(미등록·세트) 시세'],
    'prd:usedInfo': ['시장', '경쟁 매물 유의사항·사진'], 'prd:dynamic0': ['시장', '구매자 분포 (하루치)'], 'prd:dynamic': ['시장', '구매자 분포·함께 산 책'], 'prd:dynAll': ['시장', '구매자 분포 전체 — 매우 오래 걸림'],
    'prd:revTop': ['판매자', '상위 판매자 평가 갱신'], 'prd:rev6mAll': ['판매자', '6개월 평가 수 (전체)'], 'prd:rev6mStale': ['판매자', '6개월 평가 수 (오래된 것만)'], 'prd:revAll': ['판매자', '판매자 평가 처음 것까지 — 며칠 걸릴 수 있음'],
    'prd:bench': ['판매자', '🎯 집중 벤치마킹 — 차례가 된 판매자 (주기 수집이 따로 3분마다 돎)'], 'prd:benchForce': ['판매자', '🎯 주기 무시 — 처음 판매자부터 모두'], 'prd:benchDetail': ['판매자', '🎯 판매자 상품 페이지 정보'],
    'prd:aladinBuy': ['매입·팔기', '알라딘 구매 내역 전체 (첫 쪽은 클라우드가 5분마다)'], 'prd:buyback': ['매입·팔기', '알라딘 팔기 접수·매입·정산'], 'prd:poolInfo': ['매입·팔기', '알라딘 구매 풀(미연결) 도서 정보'],
    'prd:shipRead': ['출고', '발송 요청 읽기 (오늘 출고 — 보통 클라우드가 함)'], 'prd:kpipa': ['기타', '출판 판매 통계 (하루 한 번 따로 돎)'], 'prd:explore': ['기타', '끝없는 탐색 — 끝나지 않으니 최대 시간을 꼭 정함'],
    'prd:chain': ['일괄', '모두 일괄 (고객 + 상품 전체) — 오래 걸림'], 'prd:prdChain': ['일괄', '상품 일괄 (고객 제외) — 오래 걸림'] };
  const AS_GROUPS = ['상품', '시장', '고객·주문', '판매자', '매입·팔기', '출고', '일괄', '기타'];
  const CRM_LBL = { qna: '묻고 답하기', returns: '반품 관리', orders: '전체주문', cancels: '취소주문', reviews: '구매평', verify: '검증', recheck: '문제 주문 재확인', score: '고객 점수 계산', sellerSync: '판매자 툴팁 동기화', shopPolicy: '배송비 정책 확인', fbcheck: 'Firebase 대조', upload: 'Firebase 올리기', bulk: '고객·주문 전체 일괄' };
  function asCatalog() { const L = []; const crm = { ...CRM_LBL, ...((window.__rnCrm && window.__rnCrm.tasks && window.__rnCrm.tasks()) || {}) };
    for (const [k, l] of Object.entries(crm)) L.push({ job: 'crm:' + k, label: l });
    for (const k of Object.keys(JOBS)) L.push({ job: 'prd:' + k, label: JOBS[k][0] });
    return L.map((x) => { const m = AS_META[x.job] || ['기타', '']; return { ...x, g: m[0], d: m[1] }; }); }
  const asLabel = (job) => { const c = asCatalog().find((x) => x.job === job); return c ? c.label : job; };
  const asName = (s) => (s && (s.name || asLabel(s.job))) || '';
  const asDur = (job) => AS.durations(job, JSTATS, SCHED_RUNS, AS.slotsOf(SCHED));
  const asAvgMs = (job) => { const d = asDur(job); return d.n ? d.avg : null; };
  const asDurTxt = (job, big) => { const d = asDur(job); if (d.n) return `${big ? '<b>' : ''}⏱ 평균 ${AS.fmtMs(d.avg)}${big ? '</b>' : ''}<small> (최근 ${d.n}번${d.approx ? '·기록으로 어림' : ''}${d.n > 1 ? ` · ${AS.fmtMs(d.min)}~${AS.fmtMs(d.max)}` : ''})</small>`; return d.stopN ? `<span style="color:#A8661B">⏱ 끝까지 한 기록 없음</span><small> (멈춘 ${d.stopN}번 · 평균 ${AS.fmtMs(d.stopAvg)}에 멈춤)</small>` : '<span style="color:#8A9690">⏱ 아직 돌린 기록 없음</span>'; };
  /* ── 일마다 걸린 시간 기록 (prd_system/jobStats) — 어디서 돌렸든(매일 자동·직접 누름·웹앱 요청) 끝날 때마다 덧붙임 · 일마다 최근 40번 ── */
  async function jobStatAdd(job, list) { if (!auth.currentUser || !list.length) return; try { await db.runTransaction(async (tx) => { const s = await tx.get(JSTAT_REF()); const J = ((s.exists && s.data().jobs) || {})[job] || {}; const old = J.runs || [];
      const add = list.filter((e) => !old.some((o) => Math.abs(AS.toMs(o.at) - AS.toMs(e.at)) < 3 * 60e3)); if (!add.length) return; const runs = [...old, ...add].sort((a, b) => AS.toMs(a.at) - AS.toMs(b.at)).slice(-40);
      tx.set(JSTAT_REF(), { jobs: { [job]: { runs, label: asLabel(job), n: (J.n || 0) + add.length, at: nowIso() } } }, { merge: true }); }); } catch (e) {} }
  window.__rnJobDone = (job, ms, st, how) => { if (!job || !(ms >= 0) || !['done', 'stop', 'error', 'timeout'].includes(st)) return; jobStatAdd(job, [{ at: nowIso(), ms: Math.round(ms), st, pc: PC_NAME, how: how || (window.__rnAutoSlot ? 'sched' : window.__rnAuto ? 'auto' : window.__rnRemote ? 'web' : 'manual'), src: 'job' }]); };
  /* 예전 걸린 시간 채우기 — 이 PC 작업 기록(최근 7일)의 '■ … 끝남 — N분'·'⏰ … 끝 (N분)' 줄에서 (PC마다 한 번 · 분 단위라 '기록으로 어림') */
  async function jobStatSeed() { if (GM_getValue('rn-jobstats-seed', '') === '1.60.0' || !window.__rnLogDay) return; const byName = {}; for (const c of asCatalog()) byName[c.label] = c.job; ['qna:묻고 답하기', 'returns:반품 관리', 'scanDaily:상품 조회/수정 (판매중·일시판매중지·판매중지)', 'buyback:알라딘 팔기 정산 내역', 'aladinBuy:알라딘 구매 내역 (내가 산 것)', 'crmBulk:고객·주문 전체 일괄', 'chain:모두 일괄 수집 (고객 + 상품 전체)'].forEach((x) => { const [id, l] = x.split(':'); byName[l] = (AS.LEG[id] || {}).job; });
    const got = {}; for (let i = 0; i < 8; i++) { const d = AS.kst(Date.now() - i * 864e5).day; let rec = null; try { rec = await window.__rnLogDay(d); } catch (e) {} for (const e of (rec && rec.lines) || []) { const p = AS.parseLogLine(e.x); if (!p) continue; const job = byName[p.name]; if (!job) continue; (got[job] = got[job] || []).push({ at: new Date(e.t).toISOString(), ms: p.ms, st: p.st, pc: PC_NAME, how: p.how, src: 'log' }); } }
    for (const [job, L] of Object.entries(got)) await jobStatAdd(job, L.slice(-40)); GM_setValue('rn-jobstats-seed', '1.60.0'); const n = Object.values(got).reduce((a, L) => a + L.length, 0); if (n) log(`⏰ 일마다 걸린 시간: 이 PC 작업 기록(최근 7일)에서 ${n}번을 찾아 채움 (${Object.keys(got).length}가지 일)`); }
  async function schedInit() {
    SCHED_REF().onSnapshot(async (d) => {
      if (!d.exists) { // 처음: 예전 자동 설정을 옮겨 담음 (예전 스위치는 끔 — 이제 여기 한 곳에서만)
        for (let i = 0; i < 10 && !(window.__rnCrm && window.__rnCrm.oldAuto); i++) await new Promise((r) => setTimeout(r, 500));
        let crmOld = null; try { crmOld = window.__rnCrm && window.__rnCrm.oldAuto ? await window.__rnCrm.oldAuto() : null; } catch (e) {}
        const items = {}; AS.LEGACY.forEach((it) => { items[it.id] = { on: !it.off, times: it.def }; });
        if (crmOld && crmOld.on) items.crmBulk = { on: true, times: AS.normTimes([crmOld.time || '06:00']) };
        if (SET.autoDaily) items.chain = { on: true, times: [`${String(SET.autoHour ?? 17).padStart(2, '0')}:00`] };
        const on = !!((crmOld && crmOld.on) || SET.autoDaily);
        try { await SCHED_REF().set({ on, items, createdAt: nowIso(), by: PC_NAME, migrated: { crm: crmOld, chain: !!SET.autoDaily } }); } catch (e) {}
        try { if (window.__rnCrm && window.__rnCrm.offOldAuto) await window.__rnCrm.offOldAuto(); } catch (e) {}
        if (SET.autoDaily) { try { await saveSet({ autoDaily: false }); } catch (e) {} }
        return; }
      SCHED = d.data(); window.__rnSchedOn = !!SCHED.on; window.__rnSchedHas = true; schedDraw(); asEdRefresh(); }, () => {});
    SCHED_RUN().onSnapshot((d) => { SCHED_RUNS = (d.exists && d.data().runs) || {}; schedDraw(); schedArchive(); asEdRefresh(true); }, () => {});
    JSTAT_REF().onSnapshot((d) => { JSTATS = (d.exists && d.data().jobs) || {}; schedDraw(); asEdRefresh(true); }, () => {});
    setInterval(() => { if (running || (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()) || schedBusy) lastBusyAt = Date.now(); }, 15000);
    setInterval(schedTick, 60000); setTimeout(schedTick, 15000); setInterval(() => { const d = kstNow().day; if (d !== schedDrawDay) schedDraw(); }, 60000);
    setTimeout(() => jobStatSeed().catch(() => {}), 60000); }
  let schedBusy = false;
  async function schedMark(due) { /* 건너뛴 회차(늦음·최근에 함)도 적어 둠 — 다시 할 때가 되지 않게 · 이유가 보이게 */ let ok = false;
    await db.runTransaction(async (tx) => { const s = await tx.get(SCHED_RUN()); const r = (s.exists && s.data().runs) || {}; if (r[due.key]) return; const up = { [due.key]: { by: PC_NAME, at: nowIso(), state: due.mark, why: due.why, job: due.slot.job, slot: due.slot.id } }; due.merge.forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: up }, { merge: true }); ok = true; });
    if (ok) log(`⏰ '${asName(due.slot)}': ${due.why}`); }
  async function schedTick() { if (schedBusy || running || window.__rnPaused || !auth.currentUser || (window.__rnRest && window.__rnRest())) return; if (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()) return; if (!SCHED || !SCHED.on) return;
    const now = Date.now(); const dues = AS.due(SCHED, SCHED_RUNS, { now, pc: PC_NAME, crmOk: !!(window.__rnCrm && window.__rnCrm.start), idleMs: now - lastBusyAt, bootAt: BOOT_AT, stats: JSTATS }); if (!dues.length) return; schedBusy = true;
    try { for (const d of dues.filter((x) => x.mark !== 'run')) await schedMark(d).catch(() => {});
      let due = null; let lk = null;
      for (const d of dues) { if (d.mark !== 'run') continue; const kind = d.slot.job.split(':')[0];
        if (kind === 'crm' && window.__rnCrm.otherBusy && window.__rnCrm.otherBusy()) continue;
        if (kind === 'prd') { if (!JOBS[d.slot.job.slice(4)]) continue; if (lk === null) lk = (await LOCK().get()).data() || {}; if (laneBusy(lk)) continue; }
        due = d; break; }
      if (!due) return; const S1 = due.slot; const kind = S1.job.split(':')[0], key2 = S1.job.slice(4); const t0 = Date.now();
      let ok = false; await db.runTransaction(async (tx) => { const s = await tx.get(SCHED_RUN()); const r = (s.exists && s.data().runs) || {}; if (r[due.key]) return; const up = { [due.key]: { by: PC_NAME, at: nowIso(), st: nowIso(), beat: nowIso(), state: 'running', job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0 } }; due.merge.forEach((k) => (up[k] = { by: PC_NAME, at: nowIso(), state: 'merged', into: due.key })); tx.set(SCHED_RUN(), { runs: up }, { merge: true }); ok = true; });
      if (!ok) return; log(`⏰ 매일 자동: '${asName(S1)}' 시작 — ${due.why}`);
      const hb = setInterval(() => SCHED_RUN().set({ runs: { [due.key]: { beat: nowIso() } } }, { merge: true }).catch(() => {}), 5 * 60000);
      let timedOut = false; const tm = S1.maxMin ? setTimeout(() => { timedOut = true; log(`⏰ '${asName(S1)}': 정한 최대 ${S1.maxMin}분이 지나 지금 항목까지 저장하고 멈춤 — 다음 회차에 그 자리부터`, 1); try { if (kind === 'prd') window.__rnPrd.pause(); else window.__rnCrm.pause(); } catch (e) {} }, S1.maxMin * 60e3) : null;
      let res, err = null; window.__rnAutoSlot = due.key;
      try { if (kind === 'prd') { window.__rnAuto = true; res = await runJob(key2); err = lastRunErr; }
        else { const r0 = await window.__rnCrm.start(key2, { fresh: false }); res = r0 === undefined ? false : r0; if (r0 === 'error') err = '고객 작업 오류 (고객 탭 기록 확인)'; else if (r0 === 'paused') err = '멈춤'; if (!err && r0 !== undefined && !['bulk', 'upload'].includes(key2) && window.__rnCrm.upload) await window.__rnCrm.upload(); } }
      catch (e) { err = e.message; } finally { window.__rnAuto = false; window.__rnAutoSlot = null; clearInterval(hb); if (tm) clearTimeout(tm); }
      if (res === false) { await SCHED_RUN().set({ runs: { [due.key]: firebase.firestore.FieldValue.delete() } }, { merge: true }); log(`⏰ '${asName(S1)}': 다른 PC·탭이 작업 중이라 다음 확인 때 다시`, 1); return; }
      const st = timedOut ? 'timeout' : err === '멈춤' ? 'stop' : err ? 'error' : 'done';
      await SCHED_RUN().set({ runs: { [due.key]: { by: PC_NAME, at: nowIso(), st: new Date(t0).toISOString(), state: st, ms: Date.now() - t0, err: err || null, job: S1.job, slot: S1.id, why: due.why, tries: due.tries || 0 } } }, { merge: true });
      if (kind === 'crm') window.__rnJobDone && window.__rnJobDone(S1.job, Date.now() - t0, st === 'timeout' ? 'stop' : st, 'sched');
      log(`⏰ 매일 자동: '${asName(S1)}' ${st === 'done' ? '끝' : st === 'timeout' ? '최대 시간이라 멈춤' : '멈춤 — ' + err} (${Math.round((Date.now() - t0) / 60000)}분)`, st === 'done' ? 0 : 1);
    } catch (e) { log('⏰ 매일 자동 확인 실패: ' + (e.code || e.message), 1); } finally { schedBusy = false; lastBusyAt = Date.now(); } }
  /* 개요 화면용: 다음에 저절로 할 일 (정한 시각·간격만 — 조건 칸은 때를 미리 모름) */
  window.__rnSchedNext = () => { if (!SCHED) return { known: false }; if (!SCHED.on) return { known: true, on: false }; const { min } = kstNow(); let best = null;
    for (const s of AS.slotsOf(SCHED)) { if (!s.on) continue; let cand = [];
      if (s.trig.t === 'time') cand = s.trig.times.map((t) => AS.tMin(t));
      else if (s.trig.t === 'every') { const f = s.win ? AS.tMin(s.win.from) : 0; for (let m = f, i = 0; i < 288; m += s.trig.min, i++) { const mm = m % 1440; if (AS.inWin(s, mm)) cand.push(mm); if (m - f >= 1440) break; } }
      for (const m of cand) { const d = m > min ? m - min : m + 1440 - min; if (!best || d < best.d) best = { d, t: AS.hm(m), label: asName(s), tomorrow: m <= min }; } }
    return { known: true, on: true, next: best }; };
  /* (1.57.4) 회차 기록(prd_jobs/autoSched.runs)은 날마다 쌓여 한 문서(1MB) 한도에 닿을 수 있음 → 40일 지난 회차는 달마다 prd_jobs/autoSched_YYYY-MM 문서로 옮겨 보관(지우지 않음 · 옮기기와 빼기를 한 묶음으로 = 둘 다 되거나 둘 다 안 됨) */
  let schedArchDay = '';
  async function schedArchive() { const { day } = kstNow(); if (schedArchDay === day || !auth.currentUser) return; const cut = new Date(Date.parse(day + 'T00:00:00Z') - 40 * 864e5).toISOString().slice(0, 10);
    const old = Object.keys(SCHED_RUNS).filter((k) => { const d = k.split('@')[1] || ''; return d && d < cut; }); schedArchDay = day; if (!old.length) return;
    try { const byM = {}; for (const k of old.slice(0, 400)) { const m = k.split('@')[1].slice(0, 7); (byM[m] = byM[m] || {})[k] = SCHED_RUNS[k]; }
      const b = db.batch(); for (const [m, runs] of Object.entries(byM)) b.set(C('prd_jobs').doc('autoSched_' + m), { runs, at: nowIso() }, { merge: true });
      const del = {}; for (const m of Object.values(byM)) for (const k of Object.keys(m)) del[k] = firebase.firestore.FieldValue.delete(); b.set(SCHED_RUN(), { runs: del }, { merge: true }); await b.commit();
      log(`⏰ 매일 자동: 40일 지난 회차 기록 ${Object.keys(del).length}개를 달별 보관 문서로 옮김(지우지 않음)`); } catch (e) { schedArchDay = ''; } }
  const schedHM = (iso) => AS.hm(AS.kst(AS.toMs(iso)).min);
  const schedFull = (iso) => { const k = AS.kst(AS.toMs(iso)); return `${+k.day.slice(5, 7)}/${+k.day.slice(8, 10)} ${AS.hm(k.min)}`; };
  const ST_ICON = { done: '✓', running: '▶', error: '⚠', stop: '■', timeout: '⏱', lost: '?', merged: '↷', missed: '⤼', skipped: '⤼', busy: '…' };
  const ST_TXT = { done: '끝', running: '하는 중', error: '멈춤(오류)', stop: '멈춤', timeout: '최대 시간이라 멈춤', lost: '신호 끊김', merged: '다음 회차와 함께 함', missed: '늦어서 건너뜀', skipped: '최근에 해서 건너뜀' };
  /* 오늘 회차 표시 (작은 칩) */
  function asChips(s, plan, S0) { const { min } = kstNow(); const L = plan[s.id] || []; if (!L.length) return s.trig.t === 'time' || s.trig.t === 'every' ? '<i>오늘 회차 없음</i>' : '<i>오늘 아직 안 함 — 조건이 되면</i>';
    return L.slice(0, 14).map((x) => { const r = x.r; const st = r ? (AS.isLost(r, Date.now()) ? 'lost' : r.state) : x.min <= min && (x.kind === 'time' || x.kind === 'every') ? 'late' : ''; const ic = r ? ST_ICON[st] || '·' : st === 'late' ? (S0.on && s.on ? '⌛' : '–') : x.guess ? '…' : '·';
      const lbl = x.kind === 'after' ? (x.guess ? `~${AS.hm(x.min)}` : AS.hm(x.min)) : x.kind === 'cond' ? AS.hm(x.min) : x.tag;
      const tip = `${lbl} ${r ? `${ST_TXT[st] || st}${r.by ? ' · ' + r.by : ''}${r.at ? ' · ' + schedFull(r.at) : ''}${r.ms ? ' · ' + AS.fmtMs(r.ms) : ''}${r.why ? ' · ' + r.why : ''}${r.err ? ' · ' + r.err : ''}` : st === 'late' ? '시각 지남 — 알라딘 화면이 열린 PC가 곧 함' : x.guess ? '앞 칸이 끝난 뒤(예상)' : '오늘 예정'}`;
      return `<span class="ts ${st}" title="${esc3(tip)}">${ic} ${esc3(lbl)}${r && r.at && st !== 'running' ? `<small class="tw">${schedHM(r.at)}</small>` : ''}</span>`; }).join('') + (L.length > 14 ? ` <small>+${L.length - 14}</small>` : ''); }
  let schedDrawDay = '';
  function schedDraw() { const el = document.getElementById('rnpSched'); if (!el) return; const S0 = SCHED || { on: false }; const { day } = kstNow(); schedDrawDay = day; const slots = AS.slotsOf(S0); const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
    const plan = AS.dayPlan(S0, SCHED_RUNS, { now: Date.now() }, asAvgMs);
    const rows = slots.map((s, ix) => `<div class="sr${s.on ? ' on' : ''}"><label class="sw2"><input type="checkbox" data-sk="${esc3(s.id)}" ${s.on ? 'checked' : ''}><span></span></label><div class="sb"><b>${ix + 1}. ${esc3(asName(s))}</b><small>${esc3(AS.describe(s, byId))} · ${asDurTxt(s.job)}</small><div class="tl">${asChips(s, plan, S0)}</div></div></div>`).join('');
    el.innerHTML = `<div class="sh2"><label class="sw2 big"><input type="checkbox" id="rnpSchedOn" ${S0.on ? 'checked' : ''}><span></span></label><b>⏰ 매일 자동 수집</b><small class="tw">오늘 ${+day.slice(5, 7)}/${+day.slice(8, 10)}</small><button class="b2" id="rnpSchedEd" style="margin-left:auto;padding:3px 9px;font-size:11.5px;width:auto">✏ 칸 편집</button></div>
      <div class="hint2">${S0.on ? '켜짐 — 끌 때까지 매일' : '꺼짐 — 켜면 아래 켠 칸을 매일'} · 위 칸이 먼저 · ✓ 끝 ▶ 하는 중 ⌛ 시각 지남(곧 함) ⚠ 멈춤 ⤼ 건너뜀 (마우스를 올리면 이유)</div><div class="sl${S0.on ? '' : ' dim'}">${rows || '<div class="hint2">칸 없음 — ✏ 칸 편집에서 더하세요</div>'}</div>`;
    el.querySelector('#rnpSchedOn').onchange = (e) => SCHED_REF().set({ on: e.target.checked, at: nowIso(), by: PC_NAME }, { merge: true }).then(() => log(`⏰ 매일 자동 수집 ${e.target.checked ? '켬' : '끔'}`)).catch((er) => log('저장 실패: ' + er.message, 1));
    el.querySelectorAll('[data-sk]').forEach((cb) => (cb.onchange = () => asSaveQuick((L) => { const s = L.find((x) => x.id === cb.dataset.sk); if (s) s.on = cb.checked; }, `'${asName(byId[cb.dataset.sk])}' ${cb.checked ? '켬' : '끔'}`)));
    el.querySelector('#rnpSchedEd').onclick = () => asEdOpen(); }
  /* 저장 — 칸 목록 전체를 한 번에(rev로 다른 곳의 저장과 겹치지 않게) + 옛 수집기용 items + 바꾼 기록(달마다 문서에 덧붙임) */
  async function asSave(slots, baseRev, what) { const clean = slots.map(AS.sanitize).filter(Boolean); const V = AS.validate(clean); if (V.err.length) throw new Error(V.err.join(' / '));
    let conflict = false; await db.runTransaction(async (tx) => { const s = await tx.get(SCHED_REF()); const D = s.exists ? s.data() : {}; const rev = +D.rev || 0; if (baseRev != null && rev !== baseRev) { conflict = true; return; }
      tx.set(SCHED_REF(), { slots: JSON.parse(JSON.stringify(clean)), items: AS.legacyItems(clean), rev: rev + 1, ver: 2, at: nowIso(), by: PC_NAME }, { merge: true }); });
    if (conflict) { const e = new Error('다른 PC(또는 다른 창)가 그사이 칸을 바꿨습니다 — 다시 불러온 뒤 고쳐 주세요'); e.conflict = true; throw e; }
    const m = AS.kst(Date.now()).day.slice(0, 7); C('prd_jobs').doc('autoSched_edits_' + m).set({ log: firebase.firestore.FieldValue.arrayUnion({ at: nowIso(), pc: PC_NAME, email: (auth.currentUser || {}).email || null, what: String(what || '').slice(0, 300), n: clean.length }) }, { merge: true }).catch(() => {});
    log(`⏰ 매일 자동 칸 저장: ${what || ''}`); }
  async function asSaveQuick(fn, what) { try { const L = AS.slotsOf(SCHED); fn(L); await asSave(L, +((SCHED || {}).rev) || 0, what); } catch (e) { log('⏰ 저장 실패: ' + e.message, 1); schedDraw(); } }
  { let inited = false; auth.onAuthStateChanged((u) => { if (u && !inited) { inited = true; schedInit(); } }); }
@@EDITOR@@
