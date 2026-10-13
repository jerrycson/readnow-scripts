  /* @@AS_ENGINE_BEGIN — (1.60.0) ⏰ 매일 자동 수집 엔진 (계산만 · Firebase·화면 없음 → 따로 떼어 시험함)
   *  칸(slot) = { id, job:'prd:키'|'crm:키', on, name?, trig, days?, win?, pcs?, gapH?, late?, maxMin?, retry? }
   *   trig.t = 'time'  { times:['HH:MM'…] }            정한 시각 (하루 여러 번) — 그 시각이 지나면 그날 안에 한 번(밀린 회차는 하나로 묶음)
   *            'every' { min }                         n분마다 (시간 창 안에서, 창 시작 시각부터 칸을 나눔)
   *            'after' { of: 칸 id, delay, need:'done'|'any' } 다른 칸이 끝나면 (n분 뒤 · 성공했을 때만 / 끝나기만 하면)
   *            'stale' { h }                           마지막으로 끝낸 지 n시간 넘으면 (어느 PC에서든, 사람이 직접 누른 것도 셈)
   *            'idle'  { min, per }                    이 PC가 n분 넘게 쉬면 (하루 최대 per번 · 1시간 간격)
   *            'boot'  { delay }                       수집기를 켠 날 처음 (켠 뒤 n분 · 그날 아무 PC에서 한 번)
   *   거르기: days 요일[0=일…6=토] · win {from,to} 시간 창(정한 시각 말고 모두에) · pcs 이 PC들에서만 · gapH 최근 n시간 안에 끝냈으면 건너뜀
   *           late 정한 시각보다 n분 넘게 늦으면 이번 회차는 건너뜀(0 = 그날 안 언제든) · maxMin n분 넘게 걸리면 저장하고 멈춤(다음 회차에 이어서) · retry {n, gap} 멈추면 gap분 뒤 다시 최대 n번
   *  회차 기록(prd_jobs/autoSched.runs) 열쇠 = '칸id@날짜@표' — 표: 'HH:MM'(정한 시각 · 1.59 이하 수집기와 같은 모양) · eHHMM · a.부모칸.부모표 · sHHMM · iHHMM · b · (다시) ~rN */
  const AS = (() => {
    const KST = 9 * 3600e3;
    const kst = (ms) => { const d = new Date(ms + KST); return { day: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes(), dow: d.getUTCDay() }; };
    const tMin = (t) => { const m = String(t == null ? '' : t).trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/); return m ? +m[1] * 60 + +m[2] : null; };
    const hm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    const hm4 = (min) => hm(min).replace(':', '');
    const normTimes = (arr) => [...new Set((Array.isArray(arr) ? arr : String(arr || '').split(/[,\s]+/)).map((t) => tMin(t)).filter((m) => m != null).map(hm))].sort();
    const dayStart = (day) => Date.parse(day + 'T00:00:00+09:00');
    const toMs = (v) => { if (v == null) return NaN; if (typeof v === 'number') return v; if (v.toMillis) return v.toMillis(); return Date.parse(v); };
    /* 예전(1.34.0~1.59) 칸 일곱 — 열쇠·시각이 같아 옛 수집기와 같은 회차를 함께 잡음(한 PC만 함) */
    const LEGACY = [
      { id: 'qna', job: 'crm:qna', def: ['09:00', '13:00', '17:00'] },
      { id: 'returns', job: 'crm:returns', def: ['10:00', '16:00'] },
      { id: 'scanDaily', job: 'prd:scanDaily', def: ['08:00', '20:00'] },
      { id: 'buyback', job: 'prd:buyback', def: ['21:00'] },
      { id: 'aladinBuy', job: 'prd:aladinBuy', def: ['22:00'] },
      { id: 'crmBulk', job: 'crm:bulk', def: ['06:00'], off: true },
      { id: 'chain', job: 'prd:chain', def: ['17:00'], off: true },
    ];
    const LEG = Object.fromEntries(LEGACY.map((x) => [x.id, x]));
    const TRIG = {
      time: { l: '⏰ 정한 시각', d: '매일 정한 시각에 (하루 여러 번 가능) — PC가 꺼져 있었으면 그날 안에 늦게라도 한 번' },
      every: { l: '🔁 일정 간격', d: 'n분·n시간마다 (시간 창 안에서) — 자주 바뀌는 것(문의·반품·새 주문)' },
      after: { l: '🔗 다른 칸이 끝나면', d: '앞 칸이 끝나면 이어서 (n분 뒤) — 순서가 중요한 일(상품 조회 → 시장 지표)' },
      stale: { l: '⌛ 오래되면', d: '마지막으로 끝낸 지 n시간이 넘으면 — 사람이 직접 돌린 것도 셈(겹치지 않음)' },
      idle: { l: '💤 PC가 쉬면', d: '이 PC가 n분 넘게 아무 일도 안 하면 — 쉬는 시간을 채우는 긴 일(평가·분포·사진)' },
      boot: { l: '🌅 수집기를 켠 날 처음', d: '그날 PC를 켜서 수집기가 뜨면 n분 뒤 한 번 (그날 아무 PC에서 한 번)' },
    };
    const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
    const clampI = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
    function sanitize(x) { if (!x || !x.id || !x.job) return null; const t = (x.trig && x.trig.t) || 'time'; let trig;
      if (t === 'every') trig = { t, min: clampI(x.trig.min, 10, 1440, 120) };
      else if (t === 'after') trig = { t, of: String(x.trig.of || ''), delay: clampI(x.trig.delay, 0, 720, 0), need: x.trig.need === 'any' ? 'any' : 'done' };
      else if (t === 'stale') trig = { t, h: clampI(x.trig.h, 1, 240, 24) };
      else if (t === 'idle') trig = { t, min: clampI(x.trig.min, 5, 720, 30), per: clampI(x.trig.per, 1, 24, 1) };
      else if (t === 'boot') trig = { t, delay: clampI(x.trig.delay, 0, 240, 5) };
      else trig = { t: 'time', times: normTimes(x.trig && x.trig.times) };
      const days = Array.isArray(x.days) ? [...new Set(x.days.map((d) => +d).filter((d) => d >= 0 && d <= 6))].sort() : null;
      const wf = x.win && tMin(x.win.from), wt = x.win && tMin(x.win.to === '24:00' ? '00:00' : x.win.to);
      const win = x.win && wf != null && wt != null ? { from: hm(wf), to: x.win.to === '24:00' || wt === 0 ? '24:00' : hm(wt) } : null;
      return { id: String(x.id), job: String(x.job), on: x.on !== false, name: x.name ? String(x.name).slice(0, 40) : '', note: x.note ? String(x.note).slice(0, 120) : '', trig,
        days: days && days.length && days.length < 7 ? days : null, win, pcs: Array.isArray(x.pcs) && x.pcs.length ? x.pcs.map(String).slice(0, 10) : null,
        gapH: clampI(x.gapH, 0, 240, 0), late: clampI(x.late, 0, 1440, 0), maxMin: clampI(x.maxMin, 0, 1440, 0), retry: x.retry && +x.retry.n > 0 ? { n: clampI(x.retry.n, 1, 5, 1), gap: clampI(x.retry.gap, 5, 720, 30) } : null }; }
    /* 설정 문서 → 칸 목록 (예전 문서는 items에서 만들어 냄 · 칸 순서 = 우선순위) */
    function slotsOf(doc) { const D = doc || {}; if (Array.isArray(D.slots)) { const L = D.slots.map(sanitize).filter(Boolean);
        /* 옛 수집기(1.59 이하)는 items만 고침 — 예전 모양 그대로인 예전 칸은 items가 다르면 그 고침을 따름(옛 PC와 새 PC가 다른 시각에 하지 않게) */
        for (const s of L) { const Lg = LEG[s.id]; const c = (D.items || {})[s.id]; if (!Lg || !c || s.job !== Lg.job || s.trig.t !== 'time' || s.days || s.pcs || s.gapH || s.late || s.maxMin || s.retry) continue; const ts = normTimes(c.times); if (ts.length && ts.join() !== s.trig.times.join()) s.trig.times = ts; if (!!c.on !== s.on) s.on = !!c.on; }
        return L; }
      return LEGACY.map((L) => { const c = (D.items || {})[L.id]; return sanitize({ id: L.id, job: L.job, on: c ? !!c.on : !L.off, trig: { t: 'time', times: c && c.times ? c.times : L.def } }); }); }
    /* 옛 수집기(1.59 이하)가 읽는 items — 예전 칸과 똑같이 할 수 있을 때만 켜 둠(다른 조건이 붙으면 끔: 옛 수집기는 그 조건을 모르니까) */
    function legacyItems(slots) { const out = {}; for (const L of LEGACY) { const s = slots.find((x) => x.id === L.id); const same = s && s.on && s.job === L.job && s.trig.t === 'time' && s.trig.times.length && !s.days && !s.pcs && !s.gapH && !s.late && !s.maxMin && !s.retry;
        out[L.id] = same ? { on: true, times: s.trig.times } : { on: false, times: s && s.trig.t === 'time' && s.trig.times.length ? s.trig.times : L.def }; } return out; }
    const isEnd = (st) => ['done', 'error', 'stop', 'timeout', 'lost'].includes(st);
    const isLost = (r, now) => !!r && r.state === 'running' && (r.beat ? now - toMs(r.beat) > 25 * 60e3 : now - toMs(r.at) > 12 * 3600e3);
    const keyParts = (k) => { const a = String(k).split('@'); return { id: a[0], day: a[1] || '', tag: a.slice(2).join('@') }; };
    /* 🔗 표: 'a.앞칸.앞칸표' — 앞 칸의 다시 하기 표(~rN)는 _rN으로 바꿔 이 칸 자신의 다시 하기(~rN)와 섞이지 않게 · 어제 회차면 날짜도 붙임 */
    const afterTag = (pid, pk, day) => { const kp = keyParts(pk); return `a.${pid}.${day && kp.day !== day ? 'y' : ''}${kp.tag.replace(/~r(\d+)$/, '_r$1')}`; };
    const jobOfRun = (k, r, byId) => (r && r.job) || (byId[keyParts(k).id] || {}).job || (LEG[keyParts(k).id] || {}).job || null;
    /* 일마다 마지막으로 '끝까지 한' 때(ms) — 회차 기록 + 일 기록(jobStats: 사람이 누른 것·웹앱 요청 포함) */
    function lastDoneMap(runs, stats, slots) { const byId = Object.fromEntries((slots || []).map((s) => [s.id, s])); const M = {};
      for (const [k, r] of Object.entries(runs || {})) { if (!r || r.state !== 'done') continue; const j = jobOfRun(k, r, byId); const t = toMs(r.at); if (j && Number.isFinite(t) && !(M[j] >= t)) M[j] = t; }
      for (const [j, v] of Object.entries(stats || {})) for (const e of (v && v.runs) || []) { if (e.st !== 'done') continue; const t = toMs(e.at); if (Number.isFinite(t) && !(M[j] >= t)) M[j] = t; }
      return M; }
    const inWin = (s, min) => { if (!s.win) return true; const f = tMin(s.win.from), t = s.win.to === '24:00' ? 1440 : tMin(s.win.to); return f <= t ? min >= f && min < t : min >= f || min < t; };
    /* 칸 하나의 오늘 회차들(열쇠 → 기록) */
    const todayRuns = (runs, id, day) => Object.entries(runs || {}).filter(([k]) => k.startsWith(id + '@' + day + '@'));
    /* ── 지금 할 차례 ──  ctx = { now, pc, crmOk, idleMs, bootAt, stats }
     *  돌려줌: [{ slot, idx, key, mark:'run'|'missed'|'skipped', why, merge:[열쇠], tries }] — 칸 순서(위 = 먼저) */
    function due(doc, runs, ctx) { const slots = slotsOf(doc); if (!doc || !doc.on) return []; const now = ctx.now; const { day, min, dow } = kst(now); const out = []; const R = runs || {};
      const last = lastDoneMap(R, ctx.stats, slots); const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
      slots.forEach((s, idx) => { if (!s.on) return; const kind = s.job.split(':')[0];
        if (s.days && !s.days.includes(dow)) return; if (s.pcs && !s.pcs.includes(String(ctx.pc))) return; if (kind === 'crm' && !ctx.crmOk) return;
        const mine = todayRuns(R, s.id, day); const busy = mine.some(([, r]) => r && r.state === 'running' && !isLost(r, now));
        /* 다시 하기(멈춘 회차) — 먼저 봄 */
        if (s.retry && !busy) { for (const [k, r] of mine) { if (!r || !['error', 'timeout', 'lost'].includes(r.state) && !(r.state === 'running' && isLost(r, now))) continue; const base = k.replace(/~r\d+$/, ''); const n = (+(k.match(/~r(\d+)$/) || [])[1] || 0) + 1; if (n > s.retry.n) continue; const nk = `${base}~r${n}`; if (R[nk]) continue; if (now - toMs(r.at) < s.retry.gap * 60e3) continue; out.push({ slot: s, idx, key: nk, mark: 'run', why: `멈춘 회차 다시 (${n}/${s.retry.n})`, merge: [], tries: n }); return; } }
        if (busy) return; let hit = null; const t = s.trig;
        if (t.t === 'time') { const ts = t.times.filter((x) => tMin(x) <= min); if (!ts.length) return; const lt = ts[ts.length - 1]; const key = `${s.id}@${day}@${lt}`; if (R[key]) return;
          const merge = ts.slice(0, -1).map((x) => `${s.id}@${day}@${x}`).filter((k) => !R[k]);
          if (s.late && min - tMin(lt) > s.late) hit = { key, mark: 'missed', why: `${lt} 회차 — ${s.late}분 넘게 늦어 건너뜀`, merge };
          else hit = { key, mark: 'run', why: `${lt} 회차${merge.length ? ` (밀린 ${merge.length}회차 함께)` : ''}`, merge }; }
        else { if (!inWin(s, min)) return;
          if (t.t === 'every') { const f = s.win ? tMin(s.win.from) : 0; const rel = (min - f + 1440) % 1440; const st = (f + Math.floor(rel / t.min) * t.min) % 1440; /* 자정을 넘는 시간 창(예: 22:00~02:00)의 자정 뒤 칸은 어제 시작한 창의 칸 — 어제 날짜로 적음 */ const kd = min < f ? kst(dayStart(day) - 864e5 + 12 * 3600e3).day : day; const key = `${s.id}@${kd}@e${hm4(st)}`; if (R[key]) return; hit = { key, mark: 'run', why: `${hm(st)}부터 ${t.min >= 60 && t.min % 60 === 0 ? t.min / 60 + '시간' : t.min + '분'} 칸`, merge: [] }; }
          else if (t.t === 'after') { const P = byId[t.of]; if (!P) return; const yd = kst(dayStart(day) - 864e5 + 12 * 3600e3).day; /* 어제 시작해 자정 넘어 끝난 앞 칸도 */ const ends = [...todayRuns(R, P.id, day), ...todayRuns(R, P.id, yd).filter(([, r]) => r && kst(toMs(r.at)).day === day)].filter(([, r]) => r && (t.need === 'any' ? isEnd(r.state) : r.state === 'done')).sort((a, b) => toMs(a[1].at) - toMs(b[1].at));
            if (mine.filter(([k]) => /@a\./.test(k)).length >= 12) return;
            for (const [pk, r] of ends) { const ptag = afterTag(P.id, pk, day); const key = `${s.id}@${day}@${ptag}`; if (R[key]) continue; if (now - toMs(r.at) < t.delay * 60e3) break; hit = { key, mark: 'run', why: `'${P.name || P.job}' ${keyParts(pk).tag} 회차가 ${r.state === 'done' ? '끝남' : '멈춤'}${t.delay ? ` (+${t.delay}분)` : ''}`, merge: [] }; break; } }
          else if (t.t === 'stale') { const L = last[s.job]; if (L && now - L < t.h * 3600e3) return; if (mine.some(([, r]) => r && now - toMs(r.at) < 30 * 60e3)) return; hit = { key: `${s.id}@${day}@s${hm4(min)}`, mark: 'run', why: L ? `마지막으로 끝낸 지 ${Math.floor((now - L) / 3600e3)}시간` : '끝낸 기록 없음', merge: [] }; }
          else if (t.t === 'idle') { if (!(ctx.idleMs >= t.min * 60e3)) return; const n = mine.filter(([k]) => /@i\d{4}$/.test(k)).length; if (n >= t.per) return; if (mine.some(([, r]) => r && now - toMs(r.at) < 60 * 60e3)) return; hit = { key: `${s.id}@${day}@i${hm4(min)}`, mark: 'run', why: `이 PC가 ${Math.round(ctx.idleMs / 60e3)}분 쉼 (오늘 ${n + 1}/${t.per})`, merge: [] }; }
          else if (t.t === 'boot') { if (!ctx.bootAt || kst(ctx.bootAt).day !== day || now - ctx.bootAt < t.delay * 60e3) return; const key = `${s.id}@${day}@b`; if (R[key]) return; hit = { key, mark: 'run', why: '오늘 수집기를 켠 뒤 처음', merge: [] }; } }
        if (!hit) return;
        if (hit.mark === 'run' && s.gapH && t.t !== 'stale') { const L = last[s.job]; if (L && now - L < s.gapH * 3600e3) { hit.mark = 'skipped'; hit.why += ` — 최근 ${s.gapH}시간 안에 끝냄(${hm(kst(L).min)})이라 건너뜀`; } }
        out.push({ slot: s, idx, ...hit, tries: 0 }); });
      return out; }
    /* ── 오늘 하루 그림(시간표) ── 칸마다 [{min, tag, state, kind:'time'|'every'|'after'|'cond', key}] · avg(job)=ms */
    function dayPlan(doc, runs, ctx, avg) { const slots = slotsOf(doc); const { day, min } = kst(ctx.now); const R = runs || {}; const byId = Object.fromEntries(slots.map((s) => [s.id, s])); const plan = {};
      const runOf = (k) => R[k] || null;
      const spanOf = (s, k, at) => { const r = runOf(k); if (r && r.st && r.at && isEnd(r.state)) { const a = kst(toMs(r.st)), b = kst(toMs(r.at)); if (a.day === day) return [a.min, Math.max(a.min + 1, b.day === day ? b.min : 1440)]; } const d = Math.max(1, Math.round((avg(s.job) || 10 * 60e3) / 60e3)); return [at, Math.min(1440, at + d)]; };
      for (const s of slots) { const L = []; const t = s.trig;
        if (t.t === 'time') t.times.forEach((x) => { const m = tMin(x); const k = `${s.id}@${day}@${x}`; L.push({ min: m, span: spanOf(s, k, m), tag: x, key: k, r: runOf(k), kind: 'time' }); });
        else if (t.t === 'every') { const f = s.win ? tMin(s.win.from) : 0; const to = s.win ? (s.win.to === '24:00' ? 1440 : tMin(s.win.to)) : 1440; const end = to > f ? to : to + 1440; const yd = kst(dayStart(day) - 864e5 + 12 * 3600e3).day;
          for (let m = f; m < end && L.length < 96; m += t.min) { if (m >= 1440) { const mm = m - 1440; const k = `${s.id}@${yd}@e${hm4(mm)}`; L.push({ min: mm, span: spanOf(s, k, mm), tag: hm(mm), key: k, r: runOf(k), kind: 'every' }); } else { const k = `${s.id}@${day}@e${hm4(m)}`; L.push({ min: m, span: spanOf(s, k, m), tag: hm(m), key: k, r: runOf(k), kind: 'every' }); } } } /* 자정을 넘는 창: 자정 뒤 칸 = 어제 시작한 창(어제 날짜 열쇠) */
        else { todayRuns(R, s.id, day).forEach(([k, r]) => { if (/~r\d+$/.test(k)) return; const a = kst(toMs(r.st || r.at)); L.push({ min: a.day === day ? a.min : 0, span: spanOf(s, k, a.min), tag: keyParts(k).tag, key: k, r, kind: t.t === 'after' ? 'after' : 'cond' }); }); }
        plan[s.id] = L.sort((a, b) => a.min - b.min); }
      /* 🔗 아직 안 한 '다른 칸이 끝나면' — 부모의 남은 회차 끝(예상) + 지연으로 그림(점선) */
      for (let pass = 0; pass < 3; pass++) for (const s of slots) { if (s.trig.t !== 'after') continue; const P = byId[s.trig.of]; if (!P || !plan[P.id]) continue; const have = new Set(plan[s.id].map((x) => x.tag));
        for (const p of plan[P.id]) { const realTag = afterTag(P.id, p.key, day); if (have.has(realTag)) continue; if (s.trig.need === 'done' && p.r && isEnd(p.r.state) && p.r.state !== 'done') continue; const at = Math.min(1439, p.span[1] + s.trig.delay); plan[s.id].push({ min: at, span: spanOf(s, `${s.id}@${day}@${realTag}`, at), tag: realTag, key: `${s.id}@${day}@${realTag}`, r: null, kind: 'after', guess: true }); have.add(realTag); }
        plan[s.id].sort((a, b) => a.min - b.min); }
      return plan; }
    /* 다음에 할 때(사람이 읽는 글) */
    function nextOf(s, doc, runs, ctx) { const { day, min } = kst(ctx.now); const t = s.trig; if (!s.on || !doc || !doc.on) return null;
      if (t.t === 'time') { const nx = t.times.find((x) => tMin(x) > min); return nx ? `오늘 ${nx}` : t.times.length ? `내일 ${t.times[0]}` : null; }
      if (t.t === 'every') { const f = s.win ? tMin(s.win.from) : 0; const rel = (min - f + 1440) % 1440; const nx = (f + (Math.floor(rel / t.min) + 1) * t.min) % 1440; return inWin(s, nx) ? `${hm(nx)}` : s.win ? `${s.win.from}부터` : hm(nx); }
      return TRIG[t.t] ? TRIG[t.t].l.replace(/^\S+\s/, '') + ' 때' : null; }
    /* 사람이 읽는 한 줄 설명 */
    function describe(s, byId) { const t = s.trig; const W = s.win && t.t !== 'time' ? ` · ${s.win.from}~${s.win.to}` : ''; let a;
      if (t.t === 'time') a = t.times.length ? `매일 ${t.times.join(' · ')}` : '시각 없음';
      else if (t.t === 'every') a = `${t.min >= 60 && t.min % 60 === 0 ? t.min / 60 + '시간' : t.min + '분'}마다`;
      else if (t.t === 'after') { const P = byId && byId[t.of]; a = P ? `'${P.name || P.job}'${t.need === 'any' ? '이(가) 끝나면(멈춰도)' : '을(를) 끝까지 하면'}${t.delay ? ` ${t.delay}분 뒤` : ' 바로'}` : '앞 칸 없음(지워짐) — 고쳐 주세요'; }
      else if (t.t === 'stale') a = `마지막으로 끝낸 지 ${t.h}시간 넘으면`;
      else if (t.t === 'idle') a = `PC가 ${t.min}분 넘게 쉬면 (하루 ${t.per}번까지)`;
      else a = `수집기를 켠 날 처음${t.delay ? ` (${t.delay}분 뒤)` : ''}`;
      const g = [s.days ? s.days.map((d) => DAYS[d]).join('') + '요일만' : '', s.pcs ? s.pcs.join('·') + '에서만' : '', s.gapH ? `최근 ${s.gapH}시간 안에 했으면 건너뜀` : '', s.late ? `${s.late}분 넘게 늦으면 건너뜀` : '', s.maxMin ? `${s.maxMin}분 넘으면 멈춤` : '', s.retry ? `멈추면 ${s.retry.gap}분 뒤 다시(${s.retry.n}번)` : ''].filter(Boolean);
      return a + W + (g.length ? ' · ' + g.join(' · ') : ''); }
    /* 검사: 고칠 것(빨강)·알릴 것(주황) */
    function validate(slots, nameOf) { const err = [], warn = []; const ids = new Set(); const byId = Object.fromEntries(slots.map((s) => [s.id, s]));
      slots.forEach((s, i) => { const nm = `${i + 1}번 '${s.name || (nameOf ? nameOf(s.job) : s.job)}'`; if (ids.has(s.id)) err.push(`${nm}: 같은 이름표(${s.id})가 둘`); ids.add(s.id);
        if (s.trig.t === 'time' && !s.trig.times.length) err.push(`${nm}: 시각이 하나도 없음`);
        if (s.trig.t === 'after') { if (!byId[s.trig.of]) err.push(`${nm}: 이어 할 앞 칸이 없음`); else { let c = s.trig.of, n = 0; while (c && n++ < 50) { if (c === s.id) { err.push(`${nm}: 칸들이 서로 기다리는 고리 — 끝없이 돌게 됨`); break; } const p = byId[c]; c = p && p.trig.t === 'after' ? p.trig.of : null; } } }
        if (s.trig.t === 'every' && s.trig.min < 30) warn.push(`${nm}: ${s.trig.min}분마다는 잦음 — 알라딘 요청이 많아짐`);
        if (/explore$/.test(s.job) && !s.maxMin) warn.push(`${nm}: 끝없는 탐색은 끝나지 않음 — '최대 시간'을 정하세요(정하지 않으면 다른 칸이 계속 밀림)`); });
      return { err, warn }; }
    /* 평균 걸린 시간 — 끝까지 한 회차(최근 10번)만 · 일 기록(jobStats)·회차 기록·이 PC 작업 기록에서 같은 회차는 하나로 */
    function durations(job, stats, runs, slots) { const byId = Object.fromEntries((slots || []).map((s) => [s.id, s])); const L = [];
      for (const e of ((stats || {})[job] || {}).runs || []) { const t = toMs(e.at); if (Number.isFinite(t) && +e.ms >= 0) L.push({ at: t, ms: +e.ms, st: e.st, src: e.src || 'job', pc: e.pc || '' }); }
      for (const [k, r] of Object.entries(runs || {})) { if (!r || jobOfRun(k, r, byId) !== job || !(+r.ms >= 0) || !isEnd(r.state)) continue; const t = toMs(r.at); if (!Number.isFinite(t)) continue; if (L.some((x) => Math.abs(x.at - t) < 3 * 60e3)) continue; L.push({ at: t, ms: +r.ms, st: r.state, src: 'sched', pc: r.by || '' }); }
      L.sort((a, b) => b.at - a.at); const ok = L.filter((x) => x.st === 'done').slice(0, 10); const stop = L.filter((x) => x.st !== 'done');
      if (!ok.length) return { n: 0, stopN: stop.length, stopAvg: stop.length ? stop.slice(0, 10).reduce((a, x) => a + x.ms, 0) / Math.min(10, stop.length) : null, last: L[0] || null, all: L.length };
      const ms = ok.map((x) => x.ms).sort((a, b) => a - b); const avg = ms.reduce((a, b) => a + b, 0) / ms.length; const med = ms[Math.floor(ms.length / 2)];
      return { n: ok.length, avg, med, min: ms[0], max: ms[ms.length - 1], approx: ok.every((x) => x.src === 'log'), stopN: stop.length, last: L[0], all: L.length }; }
    const fmtMs = (ms) => { if (ms == null || !Number.isFinite(ms)) return '-'; const m = ms / 60e3; if (m < 1) return `${Math.max(1, Math.round(ms / 1000))}초`; if (m < 60) return `${Math.round(m)}분`; const h = Math.floor(m / 60), r = Math.round(m % 60); return r ? `${h}시간 ${r}분` : `${h}시간`; };
    /* 이 PC 작업 기록 한 줄 → 걸린 시간 (예전 기록 채우기) — '■ 'X' 끝남 — N분', '⏰ 매일 자동: 'X' 끝 (N분)' */
    function parseLogLine(x) { let m = String(x || '').match(/^■ '(.+)' 끝남 — (\d+)분(?: \((멈춤)\))?/); if (m) return { name: m[1], ms: Math.max(30e3, +m[2] * 60e3), st: m[3] ? 'stop' : 'done', how: 'job' };
      m = String(x || '').match(/^⏰ 매일 자동: '(.+)' (끝|멈춤 — .*) \((\d+)분\)$/); if (m) return { name: m[1], ms: Math.max(30e3, +m[3] * 60e3), st: m[2] === '끝' ? 'done' : 'stop', how: 'sched' }; return null; }
    return { kst, tMin, hm, hm4, normTimes, dayStart, toMs, LEGACY, LEG, TRIG, DAYS, sanitize, slotsOf, legacyItems, isEnd, isLost, keyParts, lastDoneMap, inWin, due, dayPlan, nextOf, describe, validate, durations, fmtMs, parseLogLine };
  })();
  /* @@AS_ENGINE_END */