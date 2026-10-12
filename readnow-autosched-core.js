/* readnow-autosched-core.js — 리드나우 ⏰ 매일 자동 수집: 계산(엔진)과 칸 편집기 화면 한 곳
 * 수집기(Tampermonkey @require)와 웹앱(설정 › ⏰ 자동 수집)이 같은 파일을 씀 → 어디서 고치든 같은 칸·같은 규칙·같은 화면.
 * 저장·읽기(Firebase)는 쓰는 쪽이 ctx로 넘겨 줌 — 이 파일은 계산과 그리기만. */
(function (G) {
  'use strict';
  const VERSION = '0.2.0';
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
      const spanOf = (s, k, at) => { const r = runOf(k); if (r && r.st && r.at && isEnd(r.state)) { const a = kst(toMs(r.st)), b = kst(toMs(r.at)); if (a.day === day) return [a.min, Math.max(a.min + 1, b.day === day ? b.min : a.min + Math.round((toMs(r.at) - toMs(r.st)) / 60e3))]; } const d = Math.max(1, Math.round((avg(s.job) || 3 * 60e3) / 60e3)); /* 기록이 없으면 3분으로 어림 */ return [at, Math.min(2880, at + d)]; }; /* (0.2.0) 자정을 넘는 긴 일은 그대로(시간표가 다음날까지 늘어남) */
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
        if (s.trig.t === 'every' && s.trig.min < 15) warn.push(`${nm}: ${s.trig.min}분마다는 잦음 — 알라딘 요청이 많아짐`);
        if (/explore$/.test(s.job) && !s.maxMin) warn.push(`${nm}: 끝없는 탐색은 끝나지 않음 — '최대 시간'을 정하세요(정하지 않으면 다른 칸이 계속 밀림)`); });
      return { err, warn }; }
    /* 평균 걸린 시간 — 끝까지 한 회차(최근 10번)만 · 일 기록(jobStats)·회차 기록·이 PC 작업 기록에서 같은 회차는 하나로 */
    function durations(job, stats, runs, slots) { const byId = Object.fromEntries((slots || []).map((s) => [s.id, s])); const L = [];
      for (const e of ((stats || {})[job] || {}).runs || []) { const t = toMs(e.at); if (Number.isFinite(t) && +e.ms >= 0) L.push({ at: t, ms: +e.ms, st: e.st, src: e.src || 'job', pc: e.pc || '' }); }
      for (const [k, r] of Object.entries(runs || {})) { if (!r || jobOfRun(k, r, byId) !== job || !(+r.ms >= 0) || !isEnd(r.state)) continue; const t = toMs(r.at); if (!Number.isFinite(t)) continue; if (L.some((x) => Math.abs(x.at - t) < 3 * 60e3)) continue; L.push({ at: t, ms: +r.ms, st: r.state, src: 'sched', pc: r.by || '' }); }
      L.sort((a, b) => b.at - a.at); const ok = L.filter((x) => x.st === 'done').slice(0, 10); const stop = L.filter((x) => x.st !== 'done');
      if (!ok.length) return { n: 0, stopN: stop.length, stopAvg: stop.length ? stop.slice(0, 10).reduce((a, x) => a + x.ms, 0) / Math.min(10, stop.length) : null, last: L[0] || null, all: L.length };
      const ms = ok.map((x) => x.ms).sort((a, b) => a - b); const avg = ms.reduce((a, b) => a + b, 0) / ms.length; const med = ms[Math.floor(ms.length / 2)];
      const okAll = L.filter((x) => x.st === 'done'); const allAvg = okAll.reduce((a, x) => a + x.ms, 0) / okAll.length;
      return { n: ok.length, avg, med, min: ms[0], max: ms[ms.length - 1], approx: ok.every((x) => x.src === 'log'), stopN: stop.length, last: L[0], all: L.length, allN: okAll.length, allAvg }; }
    const fmtMs = (ms) => { if (ms == null || !Number.isFinite(ms)) return '-'; const m = ms / 60e3; if (m < 1) return `${Math.max(1, Math.round(ms / 1000))}초`; if (m < 60) return `${Math.round(m)}분`; const h = Math.floor(m / 60), r = Math.round(m % 60); return r ? `${h}시간 ${r}분` : `${h}시간`; };
    /* 이 PC 작업 기록 한 줄 → 걸린 시간 (예전 기록 채우기) — '■ 'X' 끝남 — N분', '⏰ 매일 자동: 'X' 끝 (N분)' */
    function parseLogLine(x) { let m = String(x || '').match(/^■ '(.+)' 끝남 — (\d+)분(?: \((멈춤)\))?/); if (m) return { name: m[1], ms: Math.max(30e3, +m[2] * 60e3), st: m[3] ? 'stop' : 'done', how: 'job' };
      m = String(x || '').match(/^⏰ 매일 자동: '(.+)' (끝|멈춤 — .*) \((\d+)분\)$/); if (m) return { name: m[1], ms: Math.max(30e3, +m[3] * 60e3), st: m[2] === '끝' ? 'done' : 'stop', how: 'sched' }; return null; }
    return { kst, tMin, hm, hm4, normTimes, dayStart, toMs, LEGACY, LEG, TRIG, DAYS, sanitize, slotsOf, legacyItems, isEnd, isLost, keyParts, lastDoneMap, inWin, due, dayPlan, nextOf, describe, validate, durations, fmtMs, parseLogLine };
  })();
  /* @@AS_ENGINE_END */
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
    'prd:bench': ['판매자', '🎯 집중 벤치마킹 — 웹앱 🎯에서 정한 순서대로 켜진 그룹의 판매자 모두 (멈추면 그 판매자부터 이어서)'], 'prd:benchForce': ['판매자', '🎯 집중 벤치마킹 처음부터 — 이번 바퀴에 이미 읽은 판매자도 처음부터 다시'], 'prd:benchDetail': ['판매자', '🎯 판매자 상품 페이지 정보'],
    'prd:aladinBuy': ['매입·팔기', '알라딘 구매 내역 전체 (첫 쪽은 클라우드가 5분마다)'], 'prd:buyback': ['매입·팔기', '알라딘 팔기 접수·매입·정산'], 'prd:poolInfo': ['매입·팔기', '알라딘 구매 풀(미연결) 도서 정보'],
    'prd:shipRead': ['출고', '발송 요청 읽기 (오늘 출고 — 보통 클라우드가 함)'], 'prd:kpipa': ['기타', '출판 판매 통계 (KPIPA 판매 보고서) — 알라딘을 쓰지 않아 다른 수집과 함께 돎'], 'prd:metricsAuto': ['시장', '그룹 시장 지표 맡기기 — 웹앱 수동 일괄 처리 그룹에서 매일 자동을 켠 그룹 중 24시간 지난 것을 시장 지표 일로 맡김'], 'prd:explore': ['기타', '끝없는 탐색 — 끝나지 않으니 최대 시간을 꼭 정함'],
    'prd:chain': ['일괄', '모두 일괄 (고객 + 상품 전체) — 오래 걸림'], 'prd:prdChain': ['일괄', '상품 일괄 (고객 제외) — 오래 걸림'] };
  /* (0.2.0) ☁ 클라우드가 하는 일 — 이름·설명은 이 한 곳(웹앱·수집기가 같이 씀) · 켜기·끄기는 Firebase app_settings/cloud_jobs { 일: false면 끔 } · 외부 정보 이어 받기만 app_settings/ext.cloud(true일 때만 · 기본 끔)
   *  클라우드 판 0.12.0부터 따름 — 그 전 판은 스위치를 무시(아래에 '다시 배포' 알림) */
  const CLOUD_JOBS = [
    { k: 'confirm', label: '📥 주문확인요청 읽기', d: '1분마다 — 새 주문을 웹앱(출고·홈)에 바로 · PC 수집기와 같이 돌아도 됨' },
    { k: 'fast', label: '⚡ 빠른 읽기 (15초마다)', d: '정한 시간(기본 평일 8~19시)에 주문확인요청을 15초마다 · PC가 15초마다 읽는 중이면 쉼 · 위 주문확인요청 읽기가 켜져 있어야 함' },
    { k: 'ship', label: '📦 발송 요청 읽기', d: '5분마다·바뀌었을 때 — ALPS 송장 재료 · 끄면 PC 수집기의 \'발송 요청 읽기\' 칸이 대신 맡음' },
    { k: 'enrich', label: '🔎 주문 상세·우리 매물 유의 사항', d: '새 주문의 상품 상세·시장 정보·유의 사항 사진을 채움' },
    { k: 'cmds', label: '🛠 웹앱이 맡긴 일 처리', d: '발송준비시작·판매중지·현금 판매 판매중지 등 — 끄면 PC 수집기가 켜져 있을 때만 처리됨', warn: '돈이 걸린 일 — 끄면 PC가 꺼져 있는 동안 웹앱 단추가 처리되지 않음' },
    { k: 'buy', label: '🛒 알라딘에서 산 주문(매입) 읽기', d: '5분마다 첫 쪽 → 매입 탭에 바로' },
    { k: 'repair', label: '🩹 유의 사항 되살림', d: '6시간에 한 번 — 빈 판으로 덮인 우리 매물 유의 사항을 지난 판에서' },
    { k: 'sweep', label: '🛡 맡긴 일 살피기·알림', d: '1분마다 — 멈춘 일·아무도 안 맡는 일을 관리도구 알림으로' },
    { k: 'costs', label: '💰 데이터 관리 비용 기록', d: '하루 한 번 — 매입 탭 \'기타 지출\'' },
    { k: 'ml', label: '📈 판매 결과 기록', d: '하루 한 번 — 판매중 상품의 그날 모습·가격 바꾼 뒤 판매 (스스로 배우기 재료)' },
    { k: 'learn', label: '🧠 스스로 배우기', d: '2시간마다 — 팔릴 확률 모델을 다시 배움' },
    { k: 'req', label: '📷 웹앱이 부르는 일', d: '사진 가격·📥 등록 찾기·책등 읽기·백업 목록 — 끄면 이 단추들이 \'꺼 둠\'으로 답함' },
    { k: 'ext', label: '🌐 외부 정보 이어 받기', d: 'PC가 15분 넘게 외부 정보를 맡지 않을 때 10분마다 최대 90초 · 끄면 PC가 꺼져 있는 동안 외부 정보 수집을 아예 안 함', def: false },
  ];
  const cloudJobOn = (k, cfg, ext) => { const J = CLOUD_JOBS.find((x) => x.k === k); if (k === 'ext') return !!(ext && ext.cloud === true); return !(cfg && cfg[k] === false) && !!J; };
  const AS_GROUPS = ['상품', '시장', '고객·주문', '판매자', '매입·팔기', '출고', '일괄', '기타'];
  const CRM_LBL = { qna: '묻고 답하기', returns: '반품 관리', orders: '전체주문', cancels: '취소주문', reviews: '구매평', verify: '검증', recheck: '문제 주문 재확인', score: '고객 점수 계산', sellerSync: '판매자 툴팁 동기화', shopPolicy: '배송비 정책 확인', fbcheck: 'Firebase 대조', upload: 'Firebase 올리기', bulk: '고객·주문 전체 일괄' };

  function createEditor(ctx) {
  const asCatalog = () => ctx.catalog() || [];
  const asLabel = (job) => { const c = asCatalog().find((x) => x.job === job); return c ? c.label : job; };
  const asName = (s) => (s && (s.name || asLabel(s.job))) || '';
  const asMissing = (s) => !!s && !asCatalog().some((c) => c.job === s.job); /* 이 수집기 판에 없는 일(옛 판 PC·지워진 일) — 그 PC는 건너뜀 */
  const asMissTag = (s) => (asMissing(s) ? ' <b style="color:#B0322A">(수집기에 없는 일 — 그 일을 아는 수집기 판에서만 함)</b>' : '');
  const asDur = (job) => AS.durations(job, ctx.stats(), ctx.runs(), AS.slotsOf(ctx.doc()));
  const asSegs = (job) => (ctx.segs ? ctx.segs(job) : null); /* 🎯 벤치마킹처럼 여러 판매자를 차례로 하는 일 — [{label, ms, est}] */
  const asAvgMs = (job) => { const sg = asSegs(job); if (sg && sg.length) return sg.reduce((a, x) => a + (x.ms || 0), 0); const d = asDur(job); return d.n ? d.avg : null; };
  const asDurTxt = (job, big) => { const sg = asSegs(job); if (sg && sg.length) { const tot = sg.reduce((a, x) => a + (x.ms || 0), 0); const est = sg.filter((x) => x.est).length; return `${big ? '<b>' : ''}⏱ 한 바퀴 약 ${AS.fmtMs(tot)}${big ? '</b>' : ''}<small> (판매자 ${sg.length}명 · 판매자마다 평균 걸린 시간의 합${est ? ` · ${est}명은 기록이 없어 쪽 수로 어림` : ''})</small>`; } const d = asDur(job); if (d.n) return `${big ? '<b>' : ''}⏱ 평균 ${AS.fmtMs(d.avg)}${big ? '</b>' : ''}<small> (최근 ${d.n}번${d.approx ? '·기록으로 어림' : ''}${d.n > 1 ? ` · ${AS.fmtMs(d.min)}~${AS.fmtMs(d.max)}` : ''})</small>`; return d.stopN ? `<span style="color:#A8661B">⏱ 끝까지 한 기록 없음</span><small> (멈춘 ${d.stopN}번 · 평균 ${AS.fmtMs(d.stopAvg)}에 멈춤)</small>` : '<span style="color:#8A9690">⏱ 아직 돌린 기록 없음</span>'; };

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

  /* ══════════ (1.60.0) ⏰ 칸 편집기 — 수집기 화면 위에 크게 열림 ══════════
   *  ① 하루 시간표: 칸마다 한 줄, 블록 = 회차(길이 = 그 일의 평균 걸린 시간 · 끝난 회차는 실제 시작~끝). '정한 시각' 블록은 옆으로 끌면 시각이 바뀜(5분 단위)
   *  ② 칸 목록: ⋮⋮를 잡고 위아래로 끌면 다른 칸이 비켜 미끄러짐 → 놓은 자리 = 우선순위 · ✎ 고치기(아래로 펼쳐짐) · ⧉ 복제 · 🗑 지우기(확정 한 번 더)
   *  ③ 넣을 일: 수집기가 할 수 있는 모든 일 — 일마다 평균 걸린 시간을 크게 · 눌러서 또는 칸 목록으로 끌어서 더함
   *  고친 것은 '저장'을 눌러야 모든 PC에 적용(그 전엔 이 화면에만) · 다른 곳에서 그사이 바뀌면 덮지 않고 알림 */
  const ED = { open: false, draft: null, baseRev: 0, dirty: false, sel: null, opened: null, msg: '', msgBad: false, conf: false, catQ: '', hist: [], fut: [], base: '', selBlk: null };
  /* ↶ 되돌리기: 고치기 전 모습을 쌓아 둠(Ctrl+Z = 바로 전으로 · Ctrl+Shift+Z·Ctrl+Y = 다시) — 저장 전 이 화면의 고침만(저장한 것은 모든 PC에 이미 적용) */
  const asSnap = () => { ED.hist.push(JSON.stringify({ d: ED.draft, sel: ED.sel })); if (ED.hist.length > 100) ED.hist.shift(); ED.fut.length = 0; };
  const asDirtyCalc = () => { ED.dirty = JSON.stringify(ED.draft) !== ED.base; };
  /* (0.1.1) 누르는 즉시 저장되는 스위치(맨 앞 전체 켜기·끄기, 늘 도는 일)도 Ctrl+Z로 되돌림 — 기록에 '행동'으로 쌓음 */
  const asActRec = (a) => { ED.hist.push(JSON.stringify({ a })); if (ED.hist.length > 100) ED.hist.shift(); ED.fut.length = 0; };
  function asCloudRows() { const c = ctx.cloud && ctx.cloud(); if (!c) return []; const beat = c.beat || {}; const alive = beat.at && Date.now() - Date.parse(beat.at) < 10 * 60e3;
    return CLOUD_JOBS.map((J) => { const on = cloudJobOn(J.k, c.cfg, c.ext); return { k: 'cj.' + J.k, cloud: true, label: J.label, desc: J.d + (J.def === false ? ' · 기본 끔' : ''), warn: J.warn, on, run: on && alive && J.k === 'ext' && c.extLease === 'cloud' ? '클라우드가 이어 받는 중' : null, toggle: c.set ? (v) => c.set(J.k, !!v) : null }; }); }
  const asBiOf = (k) => [...((ctx.builtins && ctx.builtins()) || []), ...asCloudRows()].find((x) => x.k === k);
  const asActNow = (a) => (a.t === 'on' ? !!(ctx.doc() && ctx.doc().on) : !!(asBiOf(a.k) || {}).on);
  const asActName = (a) => (a.t === 'on' ? '⏰ 매일 자동 수집 전체' : (asBiOf(a.k) || {}).label || a.k);
  async function asActDo(a) { if (a.t === 'on') return ctx.setOn(a.v); const b = asBiOf(a.k); if (!b || !b.toggle) throw new Error('이 기기에서는 바꿀 수 없음'); return b.toggle(a.v); }
  async function asUndoAct(redo, from, to) { const o = JSON.parse(from[from.length - 1]); const a = o.a; const want = redo ? a.v : !a.v; /* 되돌리면 → 누르기 전(!v) · 다시 하면 → v */
    if (asActNow(a) !== !want) { from.pop(); ED.msg = `'${asActName(a)}' — 그사이 다른 곳에서 바꿔 ${redo ? '다시 하지' : '되돌리지'} 않음 (남의 고침을 덮지 않게)`; ED.msgBad = true; asEdDraw(); return; }
    ED.busyAct = true; try { await asActDo({ ...a, v: want }); from.pop(); to.push(JSON.stringify({ a })); ED.msg = `${redo ? '↷ 다시 함' : '↶ 되돌림'}: ${asActName(a)} ${want ? '켬' : '끔'} — 모든 PC에 바로 적용`; ED.msgBad = false; }
    catch (er) { ED.msg = '되돌리기 저장 못 함: ' + er.message; ED.msgBad = true; } finally { ED.busyAct = false; } asEdDraw(); }
  function asUndo(redo) { const from = redo ? ED.fut : ED.hist, to = redo ? ED.hist : ED.fut; if (!from.length) { ED.msg = redo ? '다시 할 것이 없음' : '되돌릴 것이 없음'; ED.msgBad = false; asEdDraw(); return; }
    if (ED.busyAct) return; if (JSON.parse(from[from.length - 1]).a) return asUndoAct(redo, from, to);
    to.push(JSON.stringify({ d: ED.draft, sel: ED.sel })); const o = JSON.parse(from.pop()); ED.draft = o.d; ED.sel = o.sel; ED.opened = o.sel; ED.selBlk = null; asDirtyCalc(); ED.msg = redo ? '↷ 다시 함' : '↶ 되돌림 (저장 전 고침)'; ED.msgBad = false; asEdDraw(); }
  const asDoc = () => ({ on: !!(ctx.doc() && ctx.doc().on), slots: ED.draft || [] });
  function asEdOpen() { if (!ctx.doc()) return ctx.log('⏰ 설정을 아직 못 읽음 — 구글 로그인 확인', 1); ED.open = true; ED.draft = AS.slotsOf(ctx.doc()); ED.base = JSON.stringify(ED.draft); ED.hist = []; ED.fut = []; ED.baseRev = +ctx.doc().rev || 0; ED.dirty = false; ED.sel = null; ED.selBlk = null; ED.msg = ''; ED.conf = false;
    asEdCss(); let ov = ctx.mount ? ctx.mount() : document.getElementById('rnas'); if (!ov) { ov = document.createElement('div'); ov.id = 'rnas'; document.body.appendChild(ov); } if (ctx.mount) ov.classList.add('inl'); ov.style.display = 'block'; if (!ctx.mount && ctx.front) ctx.front(ov); asEdDraw(); }
  function asEdRefresh(runsOnly) { if (!ED.open) return; if (!runsOnly && !ED.dirty && !ED.saving) { ED.draft = AS.slotsOf(ctx.doc()); ED.base = JSON.stringify(ED.draft); ED.baseRev = +ctx.doc().rev || 0; }
    else if (!runsOnly && ED.dirty && !ED.saving && (+ctx.doc().rev || 0) !== ED.baseRev) { ED.conf = true; }
    /* 끄는 중·확정 단추가 켜진 중·글을 쓰는 중이면 다시 그리지 않음(손에 든 것이 사라지지 않게) — 시간표만(끄는 중엔 그것도 안 함) */
    if (ED.dragging || document.querySelector('#rnas [data-arm="1"]')) { ED.pend = true; return; }
    const a = document.activeElement; if (a && a.closest && a.closest('#rnas') && /INPUT|SELECT|TEXTAREA/.test(a.tagName) && !/^(checkbox|radio|button)$/.test(a.type || '')) { /* 글 쓰는 칸만 — 스위치는 눌러도 화면이 멈추지 않게(0.1.1) */ asEdDrawTl(); ED.pend = true; return; } ED.pend = false; asEdDraw(); }
  const asNewId = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
  const asTouch = () => { asDirtyCalc(); ED.msg = ''; };
  function asEdCss() { if (document.getElementById('rnas-css')) return; const st = document.createElement('style'); st.id = 'rnas-css'; st.textContent = `
    #rnas{position:fixed;left:14px;top:14px;width:min(1240px,calc(100vw - 28px));max-height:calc(100vh - 28px);z-index:2147483640;overflow-x:hidden;overflow-y:auto;border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.3);font:13px/1.5 system-ui,'Malgun Gothic',sans-serif;color:#1E2B28;background:#fff} /* (1.60.1) 가림막 없는 창 — 수집기·기록 창과 누른 쪽이 앞으로 */
    #rnas *{box-sizing:border-box} #rnas .as-box{background:#fff;width:100%}
    #rnas.inl{position:relative;left:auto;top:auto;width:100%;max-height:none;z-index:auto;box-shadow:none;border:1px solid #DCE5E1;overflow:visible} #rnas.inl #as_x{display:none} #rnas.inl .as-hd{position:static} #rnas.inl .as-main{flex-wrap:wrap} #rnas.inl .as-list{min-width:min(100%,380px)} #rnas.inl .as-cat{position:static;max-height:420px;flex:1 1 280px}
    #rnas .tl-b.sel{outline:3px solid #F2B544;outline-offset:1px;z-index:4;box-shadow:0 0 0 5px rgba(242,181,68,.35)} #rnas .tl-b .sg{position:absolute;top:0;bottom:0;border-left:1px solid rgba(255,255,255,.95);pointer-events:none} #rnas .tl-b .sg.est{border-left-style:dotted}
    #rnas .tl-b.past{opacity:.28} #rnas .tl-b.par{background:repeating-linear-gradient(135deg,#CFE0F7 0,#CFE0F7 4px,#E6EFFB 4px,#E6EFFB 8px);border-color:#3F7FD1} #rnas .tl-b.shift{opacity:.9;border-style:dashed} #rnas .tl-pl{position:absolute;top:10px;height:2px;background:#D9822B;pointer-events:none}
    #rnas .par-tag{display:inline-block;background:#3F7FD1;color:#fff;border-radius:8px;padding:0 6px;font-size:10.5px;font-weight:700;margin-left:4px}
    #rnas .bi{display:flex;gap:8px;align-items:flex-start;border:1px solid #DCE5E1;border-radius:9px;padding:6px 8px;margin:4px 0;background:#fff} #rnas .bi.off{background:#F6F7F6;color:#7A8682} #rnas .bi .st{font-size:11.5px;color:#4A5A55} #rnas .bi .lamp{width:9px;height:9px;border-radius:50%;margin-top:6px;flex:none;background:#C3CCC8} #rnas .bi .lamp.on{background:#2F7D4F} #rnas .bi .lamp.run{background:#D9822B;box-shadow:0 0 0 3px rgba(217,130,43,.3);animation:asPulse 1.2s infinite} @keyframes asPulse{50%{box-shadow:0 0 0 6px rgba(217,130,43,0)}}
    #rnas .as-hd{position:sticky;top:0;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#2F5D50;color:#fff}
    #rnas .as-hd b{font-size:16px} #rnas .as-hd .sp{flex:1} #rnas button{font:inherit;cursor:pointer;border-radius:7px;border:1px solid #CFDAD5;background:#fff;color:#1E2B28;padding:4px 10px}
    #rnas .as-hd button{border-color:rgba(255,255,255,.5)} #rnas .as-save{background:#F2B544!important;border-color:#F2B544!important;font-weight:800} #rnas .as-save[disabled]{opacity:.45;cursor:default}
    #rnas .armed{background:#B0322A!important;color:#fff!important;border-color:#B0322A!important} #rnas .dirty{background:#F2B544;color:#3B2A00;border-radius:9px;padding:1px 8px;font-size:12px;font-weight:700}
    #rnas .as-msg{padding:7px 14px;font-size:12.5px;border-bottom:1px solid #E3E9E6} #rnas .as-msg.bad{background:#FDECEA;color:#8E2A22} #rnas .as-msg.warn{background:#FFF4E5;color:#7A4B0E}
    #rnas .as-sec{padding:10px 14px;border-bottom:1px solid #E3E9E6} #rnas h4{margin:0 0 6px;font-size:13.5px} #rnas h4 small{font-weight:400;color:#5B6B66}
    #rnas .tl-w{position:relative} #rnas .tl-scroll{overflow-x:auto;overflow-y:hidden;cursor:grab;scrollbar-width:thin;border:1px solid #E3E9E6;border-radius:8px;user-select:none;-webkit-user-select:none;touch-action:pan-y} #rnas .tl-scroll.grabbing{cursor:grabbing} #rnas .tl-scroll .tl-b{cursor:pointer} #rnas .tl-scroll .tl-b.drag{cursor:ew-resize}
    #rnas .tl{position:relative} #rnas .tl-r{display:flex;align-items:center;height:24px;border-top:1px dashed #EEF2F0}
    #rnas .tl-info{display:flex;gap:12px;align-items:flex-start;background:#FFF8E6;border:1px solid #F2D59A;border-radius:9px;padding:6px 10px;margin:0 0 6px;min-height:44px} #rnas .tl-info.none{background:#F4F8F6;border-color:#DCE5E1;color:#5B6B66;font-size:12px;align-items:center}
    #rnas .tl-big{font-size:22px;font-weight:800;color:#2F5D50;white-space:nowrap;line-height:1.2} #rnas .tl-sub{font-size:11.5px;color:#4A5A55} #rnas .tl-sg{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:2px;font-size:10.5px;color:#7A8682} #rnas .tl-sg b{font-weight:600;color:#5B6B66} #rnas .tl-sg i{font-style:normal;color:#A8661B;margin-left:2px}
    #rnas .tl-x{border:none;background:transparent;font-size:14px;cursor:pointer;color:#7A8682} #rnas .tl-nd{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,rgba(63,127,209,.06) 0,rgba(63,127,209,.06) 6px,transparent 6px,transparent 12px);border-left:2px solid #3F7FD1;pointer-events:none}
    #rnas .tl-b em{font-style:normal;font-size:9px;color:#1F4E8A;position:absolute;left:100%;margin-left:2px;white-space:nowrap;font-weight:700}
    #rnas .tl-l{width:170px;flex:none;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px;position:sticky;left:0;z-index:6;background:#fff;height:100%;line-height:24px;border-right:1px solid #E3E9E6;cursor:default} #rnas .tl-l.on{background:#FFF8E6;font-weight:700} #rnas .tl-l.off{color:#9AA5A1;text-decoration:line-through}
    #rnas .tl-t{position:relative;flex:none;height:100%;background:repeating-linear-gradient(90deg,#E8EEEB 0,#E8EEEB 1px,transparent 1px,transparent 64px)}
    #rnas .tl-b{position:absolute;top:3px;height:16px;border-radius:4px;background:#BFD8CC;border:1px solid #7FAF97;min-width:5px;font-size:10px;line-height:14px;color:#1E3A30;white-space:nowrap;overflow:visible;padding:0 2px}
    #rnas .tl-b.done{background:#9CCBAE;border-color:#2F7D4F} #rnas .tl-b.running{background:#F7D79A;border-color:#D9822B} #rnas .tl-b.error,#rnas .tl-b.stop,#rnas .tl-b.timeout,#rnas .tl-b.lost{background:#F4B9B2;border-color:#B0322A}
    #rnas .tl-b.missed,#rnas .tl-b.skipped,#rnas .tl-b.merged{background:#E3E6E8;border-color:#9AA5A1} #rnas .tl-b.guess{background:transparent;border-style:dashed} #rnas .tl-b.off{opacity:.35}
    #rnas .tl-b.drag{cursor:ew-resize} #rnas .tl-b.drag:hover{outline:2px solid #2F5D50} #rnas .tl-b.moving{outline:2px solid #D9822B;z-index:3;transition:none} #rnas .tl-b i{position:absolute;left:0;top:-15px;font-style:normal;background:#2F5D50;color:#fff;border-radius:4px;padding:0 4px;font-size:10.5px}
    #rnas .tl-now{position:absolute;top:0;bottom:0;width:2px;background:#B0322A;z-index:2;pointer-events:none} #rnas .tl-hr{height:18px;font-size:10.5px;color:#5B6B66;border-top:none} #rnas .tl-hr .tl-l{line-height:18px;color:#5B6B66;font-size:10.5px} #rnas .tl-hr .tl-t{background:none} #rnas .tl-hr span{position:absolute;top:1px;padding-left:3px;white-space:nowrap} #rnas .tl-hr span.nd{color:#1F4E8A;font-weight:700}
    #rnas .as-main{display:flex;gap:14px;padding:10px 14px;align-items:flex-start} #rnas .as-list{flex:1.55;min-width:0} #rnas .as-cat{flex:1;min-width:280px;position:sticky;top:56px;max-height:calc(100vh - 90px);overflow:auto;border:1px solid #DCE5E1;border-radius:10px;padding:8px;background:#F7FAF9}
    @media(max-width:900px){#rnas .as-main{flex-direction:column}#rnas .as-cat{position:static;max-height:none;width:100%}}
    #rnas .as-card{position:relative;border:1px solid #DCE5E1;border-radius:10px;background:#fff;margin:0 0 7px;transition:transform .2s ease,box-shadow .2s ease,opacity .2s}
    #rnas .as-card.off{background:#F6F7F6} #rnas .as-card.off .as-nm{color:#8A9690} #rnas .as-card.lift{z-index:10;box-shadow:0 10px 26px rgba(0,0,0,.22);transition:box-shadow .2s;cursor:grabbing}
    #rnas .as-card.settle{animation:asSettle .45s ease} @keyframes asSettle{0%{box-shadow:0 0 0 3px #F2B544}100%{box-shadow:0 0 0 0 rgba(242,181,68,0)}}
    #rnas .as-card.new{animation:asNew .35s ease} @keyframes asNew{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:none}}
    #rnas .as-row{display:flex;gap:8px;align-items:flex-start;padding:7px 8px} #rnas .as-h{cursor:grab;color:#8A9690;font-size:15px;line-height:20px;user-select:none;touch-action:none;padding:0 2px}
    #rnas .as-no{flex:none;width:22px;height:22px;border-radius:50%;background:#2F5D50;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center}
    #rnas .as-m{flex:1;min-width:0} #rnas .as-nm{font-weight:800;font-size:13.5px} #rnas .as-dur{display:inline-block;margin-left:6px;font-size:12px;color:#1F5FAF} #rnas .as-desc{font-size:12px;color:#4A5A55}
    #rnas .as-a{display:flex;gap:3px;flex:none} #rnas .as-a button{padding:2px 7px;font-size:12px}
    #rnas .sw{position:relative;display:inline-block;width:34px;height:19px;flex:none;margin-top:1px} #rnas .sw input{opacity:0;width:0;height:0} #rnas .sw span{position:absolute;inset:0;background:#C3CCC8;border-radius:10px;transition:.2s}
    #rnas .sw span:after{content:'';position:absolute;left:2px;top:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:.2s} #rnas .sw input:checked+span{background:#2F7D4F} #rnas .sw input:checked+span:after{left:17px}
    #rnas .as-fw{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s ease} #rnas .as-fw.open{grid-template-rows:1fr} #rnas .as-fw>div{overflow:hidden}
    #rnas .as-form{border-top:1px dashed #DCE5E1;padding:8px 10px 10px 40px;background:#FBFCFB} #rnas .as-f{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:5px 0} #rnas .as-f>label:first-child,#rnas .as-f .lb{width:92px;flex:none;font-weight:700;font-size:12px;color:#2F5D50}
    #rnas input[type=number]{width:70px} #rnas input,#rnas select{font:inherit;padding:3px 6px;border:1px solid #CFDAD5;border-radius:6px;background:#fff} #rnas select{max-width:100%}
    #rnas .seg{display:inline-flex;flex-wrap:wrap;border:1px solid #CFDAD5;border-radius:8px;overflow:hidden} #rnas .seg button{border:0;border-radius:0;border-right:1px solid #E3E9E6;padding:4px 9px;font-size:12px} #rnas .seg button.on{background:#2F5D50;color:#fff;font-weight:700}
    #rnas .tchip{display:inline-flex;align-items:center;gap:3px;background:#E8F0FB;border:1px solid #B9CDEB;border-radius:12px;padding:0 3px 0 8px;font-weight:700} #rnas .tchip button{border:0;background:none;padding:0 4px;color:#8E2A22}
    #rnas .dchip{border-radius:12px;padding:1px 8px;font-size:12px} #rnas .dchip.on{background:#2F5D50;color:#fff;border-color:#2F5D50} #rnas .as-tip{font-size:11.5px;color:#5B6B66}
    #rnas .as-pv{margin-top:6px;padding:6px 8px;border-radius:8px;background:#EEF4F1;font-size:12.5px}
    #rnas .cat-g{margin:6px 0 2px;font-weight:800;font-size:12px;color:#2F5D50} #rnas .cat-i{display:flex;gap:6px;align-items:center;border:1px solid #DCE5E1;background:#fff;border-radius:8px;padding:5px 7px;margin:3px 0;cursor:grab;user-select:none;touch-action:none}
    #rnas .cat-i:hover{border-color:#2F5D50} #rnas .cat-i .ci{flex:1;min-width:0} #rnas .cat-i b{font-size:12.5px} #rnas .cat-i small{display:block;color:#5B6B66;font-size:11px} #rnas .cat-i .cd{flex:none;text-align:right;font-size:12px;color:#1F5FAF;max-width:150px}
    #rnas .cat-i .cd b{font-size:15px;color:#1F5FAF} #rnas .cat-i .used{font-size:10.5px;color:#2F7D4F}
    #rnas-ghost{position:fixed;z-index:2147483647;pointer-events:none;background:#fff;border:2px solid #2F5D50;border-radius:9px;padding:5px 9px;font:700 12.5px system-ui,'Malgun Gothic',sans-serif;box-shadow:0 10px 24px rgba(0,0,0,.25);opacity:.95}
    #rnas .as-ph{height:0;border:2px dashed #2F5D50;border-radius:10px;margin:0 0 7px;transition:height .18s ease;background:#F4F8F6} #rnas .as-ph.on{height:46px}
    #rnas .as-add{width:100%;padding:8px;border:2px dashed #9CCBAE;background:#F4F8F6;color:#2F5D50;font-weight:800} #rnas .ts{display:inline-block;border:1px solid #DCE5E1;border-radius:9px;padding:0 6px;margin:1px 2px 0 0;font-size:11px;background:#fff;white-space:nowrap}
    #rnas .ts.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rnas .ts.running{background:#FFF4E5;border-color:#E8C88F} #rnas .ts.error,#rnas .ts.stop,#rnas .ts.timeout,#rnas .ts.lost{background:#FDECEA;border-color:#E3A29B;color:#B0322A} #rnas .ts.late{border-color:#E8C88F;color:#A8661B} #rnas .ts small{margin-left:3px;color:#8A9690}
    #rnas .oth{font-size:12px;color:#4A5A55} #rnas .oth li{margin:2px 0}`; document.head.appendChild(st); }
  /* 두 번 눌러야 하는 단추 (브라우저 확인 창 대신) */
  function asArm(b, label, fn) { if (b.dataset.arm === '1') { b.dataset.arm = ''; b.classList.remove('armed'); fn(); return; } b.dataset.arm = '1'; b.dataset.t0 = b.textContent; b.classList.add('armed'); b.textContent = label; setTimeout(() => { if (b.isConnected && b.dataset.arm === '1') { b.dataset.arm = ''; b.classList.remove('armed'); b.textContent = b.dataset.t0; } }, 4000); }
  const asPar = (job) => !!(asCatalog().find((c) => c.job === job) || {}).par;
  /* 겹치는 블록: 알라딘을 쓰는 일은 한 번에 하나라 앞 일이 끝날 때까지 밀림 → 실제로 시작할 때(예상)로 옮겨 그리고 정한 시각부터 주황 선 · 동시 진행 일(알라딘을 안 씀)은 그대로 */
  function asShift(slots, plan, now) { const { min } = kstNow(); const L = []; for (const s of slots) { if (!s.on || asPar(s.job)) continue; const P = plan[s.id] || []; const pastUnrun = P.filter((x) => !x.r && x.min < min); const lastPast = pastUnrun[pastUnrun.length - 1];
      for (const x of P) { if (!x.r && x.min < min && x !== lastPast) continue; /* 지난 회차 중 아직 안 한 것은 마지막 하나만 곧 함(나머지는 함께 묶임) */ L.push({ s, x }); } }
    L.sort((a, b) => a.x.min - b.x.min || slots.indexOf(a.s) - slots.indexOf(b.s)); let cur = 0; const out = {};
    for (const { s, x } of L) { const r = x.r; const d = Math.max(1, x.span[1] - x.span[0]);
      if (r && r.state === 'running') { cur = Math.max(cur, min + Math.max(1, d - (min - x.span[0]))); continue; } if (r) { cur = Math.max(cur, x.span[1]); continue; }
      const st = Math.max(x.min, cur, x.min < min ? min : 0); if (st - x.min > 2) out[x.key] = st; cur = st + d; } return out; }
  /* (0.2.0) 오늘 시간표 — 1시간 = 64px(짧은 일도 보이게) · 왼쪽 이름 칸은 고정 · 자정을 넘는 일이 있으면 다음날까지 늘어남 · 빈 곳을 잡고 끌면 옆으로(놓으면 미끄러지며 멈춤)
   *  블록을 누르면 위 '고른 칸' 줄에 그 칸의 전체 평균 걸린 시간을 크게(판매자별 칸막이는 작게) · 기록이 없으면 어림이라고 밝힘 */
  const TL_PXH = 64, TL_LAB = 170; const tlX = (m) => (m / 60) * TL_PXH;
  function asTlModel() { const doc = asDoc(); const slots = doc.slots; const plan = AS.dayPlan(doc, ctx.runs(), { now: Date.now() }, asAvgMs); const { min } = kstNow(); const SH = asShift(slots, plan, Date.now());
    let maxEnd = 1440; for (const s of slots) for (const x of plan[s.id] || []) { const d = Math.max(1, x.span[1] - x.span[0]); const st = SH[x.key] != null ? SH[x.key] : x.min; maxEnd = Math.max(maxEnd, st + d); }
    const H = Math.min(48, Math.max(24, Math.ceil(maxEnd / 60))); return { doc, slots, plan, min, SH, H }; }
  function asTlInfo(M) { const sel = ED.selTl; const s = sel && M.slots.find((x) => x.id === sel.id); if (!s) return `<div class="tl-info none">블록을 누르면 그 칸이 <b>평균 얼마나 걸리는지</b> 여기에 크게 보입니다 · '정한 시각' 블록은 고른 뒤 <b>Delete</b>로 그 시각을 지움(Ctrl+Z로 되돌림) · 빈 곳을 잡고 끌면 옆으로 넘어감</div>`;
    const x = (M.plan[s.id] || []).find((y) => y.tag === sel.tag) || null; const d = asDur(s.job); const sg = asSegs(s.job); const tot = sg && sg.length ? sg.reduce((a, y) => a + (y.ms || 0), 0) : 0; const estN = sg ? sg.filter((y) => y.est).length : 0;
    let big, sub = '';
    if (tot) { big = `${estN === sg.length ? '어림 ' : ''}${AS.fmtMs(tot)}`; sub = `한 바퀴 = 판매자마다 평균 걸린 시간의 합${estN ? ` · <b style="color:#A8661B">${estN}명은 기록이 없어 어림(쪽 수 또는 15분)</b>` : ''}`; }
    else if (d.n) { big = AS.fmtMs(d.allAvg || d.avg); sub = `끝까지 한 기록 ${d.allN || d.n}번 전체 평균${d.n > 1 ? ` · 최근 ${d.n}번 ${AS.fmtMs(d.avg)} (${AS.fmtMs(d.min)}~${AS.fmtMs(d.max)})` : ''}${d.approx ? ' · 작업 기록 줄로 어림한 것 포함' : ''}`; }
    else { big = '어림 3분'; sub = `<b style="color:#A8661B">아직 끝까지 돌린 기록이 없어 예측값</b> — 기록이 없는 일은 3분으로 그림${d.stopN ? ` · 멈춘 기록 ${d.stopN}번(평균 ${AS.fmtMs(d.stopAvg)} 만에 멈춤)` : ''} · 한 번 돌면 실제 시간으로 바뀜`; }
    const r = x && x.r; const sh = x && M.SH[x.key]; const segs = tot ? `<div class="tl-sg">${sg.map((y) => `<span>${esc3(y.label)} <b>${AS.fmtMs(y.ms)}</b>${y.est ? '<i>어림</i>' : ''}</span>`).join('')}</div>` : '';
    return `<div class="tl-info"><div class="tl-big">⏱ ${big}</div><div style="flex:1;min-width:0"><b>${esc3(asName(s))}</b>${asPar(s.job) ? '<span class="par-tag">동시 진행</span>' : ''} <small>${x ? `· ${esc3(x.kind === 'time' || x.kind === 'every' ? x.tag : AS.hm(x.min))}${sh != null ? ` → 앞 일 때문에 약 ${AS.hm(sh)}에 시작(예상)` : ''}${r ? ` · 이 회차 ${ST_TXT[r.state] || r.state}${r.ms ? ' ' + AS.fmtMs(r.ms) : ''}` : ''}` : ''}</small><div class="tl-sub">${sub}</div>${segs}</div><button type="button" class="tl-x" data-tlclr="1" title="고른 것 풀기">✕</button></div>`; }
  function asTlHtml() { const M = asTlModel(); const { doc, slots, plan, min, SH, H } = M; const W = H * TL_PXH;
    const hrs = Array.from({ length: H }, (_, h) => `<span style="left:${tlX(h * 60)}px"${h >= 24 ? ' class="nd"' : ''}>${h >= 24 ? (h === 24 ? '다음날 0시' : `${h - 24}시`) : `${h}시`}</span>`).join('');
    const rows = slots.map((s, i) => `<div class="tl-r"><div class="tl-l${s.on ? '' : ' off'}${ED.selTl && ED.selTl.id === s.id ? ' on' : ''}" title="${esc3(asName(s))}">${i + 1}. ${esc3(asName(s))}</div><div class="tl-t" data-tl="${esc3(s.id)}" style="width:${W}px">${(plan[s.id] || []).map((x) => { const r = x.r; const st = r ? (AS.isLost(r, Date.now()) ? 'lost' : r.state) : ''; const dur = Math.max(1, x.span[1] - x.span[0]); const wpx = Math.max(6, tlX(dur)); const drag = s.trig.t === 'time' && x.kind === 'time'; const par = asPar(s.job); const sh = SH[x.key]; const left = sh != null ? sh : x.min; const pastSkip = !r && x.min < min && sh == null && (plan[s.id] || []).some((y) => !y.r && y.min < min && y.min > x.min);
        const sg = asSegs(s.job); const tot = sg && sg.length ? sg.reduce((a, y) => a + (y.ms || 0), 0) : 0; let acc = 0; const segH = tot && !r ? sg.slice(0, -1).map((y) => { acc += y.ms || 0; return `<span class="sg${y.est ? ' est' : ''}" style="left:${(acc / tot * 100).toFixed(2)}%"></span>`; }).join('') : '';
        const isSel = ED.selTl && ED.selTl.id === s.id && ED.selTl.tag === x.tag; const lbl = x.kind === 'time' || x.kind === 'every' ? x.tag : AS.hm(x.min);
        return `${sh != null ? `<div class="tl-pl" style="left:${tlX(x.min)}px;width:${tlX(sh - x.min)}px"></div>` : ''}<div class="tl-b ${st}${x.guess ? ' guess' : ''}${par ? ' par' : ''}${sh != null ? ' shift' : ''}${pastSkip ? ' past' : ''}${isSel ? ' sel' : ''}${s.on && doc.on ? '' : ' off'}${drag ? ' drag' : ''}" style="left:${tlX(left)}px;width:${wpx}px" data-tlk="${esc3(s.id)}|${esc3(x.tag)}"${drag ? ` data-tlt="${esc3(s.id)}|${esc3(x.tag)}"` : ''} title="${esc3(`${asName(s)} · ${lbl}${sh != null ? ` → 약 ${AS.hm(sh)}에 시작(예상)` : ''}${par ? ' · 동시 진행' : ''} · 누르면 평균 시간을 위에 크게${drag ? ' · 옆으로 끌면 시각이 바뀜(5분 단위)' : ''}`)}">${segH}${wpx > 34 ? esc3(lbl) : par ? '<em>동시</em>' : ''}</div>`; }).join('')}</div></div>`).join('');
    return `<div class="tl-scroll"><div class="tl" style="width:${TL_LAB + W}px"><div class="tl-r tl-hr"><div class="tl-l">⏱ 시각 ${H > 24 ? '<b style="color:#1F4E8A">· 다음날까지</b>' : ''}</div><div class="tl-t" style="width:${W}px">${hrs}</div></div>${H > 24 ? `<div class="tl-nd" style="left:${TL_LAB + tlX(1440)}px;width:${tlX((H - 24) * 60)}px" title="다음날 — 오늘 시작한 일이 자정을 넘겨 이어지는 곳"></div>` : ''}${rows}<div class="tl-now" style="left:${TL_LAB + tlX(min)}px" title="지금 ${AS.hm(min)}"></div></div></div>`; }
  function asEdDrawTl() { const w = document.querySelector('#rnas .tl-w'); if (!w) return; const sc = w.querySelector('.tl-scroll'); const x = sc ? sc.scrollLeft : ED.tlX; const M = asTlModel(); const inf = w.querySelector('.tl-info-w'); if (inf) inf.innerHTML = asTlInfo(M); const box = w.querySelector('.tl-box'); if (box) box.innerHTML = asTlHtml(); asTlScroll(w, x); }
  function asTlScroll(w, x) { const sc = w.querySelector('.tl-scroll'); if (!sc) return; if (x == null) { const { min } = kstNow(); x = Math.max(0, tlX(min) - 3 * TL_PXH); } sc.scrollLeft = x; ED.tlX = sc.scrollLeft; }
  const asOptsJob = (cur) => { const C0 = asCatalog(); const gs = AS_GROUPS.concat([...new Set(C0.map((c) => c.g))].filter((g) => !AS_GROUPS.includes(g))); return gs.map((g) => { const L = C0.filter((c) => c.g === g); return L.length ? `<optgroup label="${esc3(g)}">${L.map((c) => { const d = asDur(c.job); return `<option value="${esc3(c.job)}" ${c.job === cur ? 'selected' : ''}>${esc3(c.label)} — ${d.n ? '평균 ' + AS.fmtMs(d.avg) : '기록 없음'}</option>`; }).join('')}</optgroup>` : ''; }).join(''); };
  function asPcs() { return [...new Set([ctx.pc, ...((ctx.pcs && ctx.pcs()) || [])])].filter(Boolean).sort(); }
  /* 하루 몇 번 · 하루 사용 시간 (어림) */
  function asPerDay(s, dp) { if ((dp || 0) > 12) return null; const t = s.trig; let n = null; if (t.t === 'time') n = t.times.length; else if (t.t === 'every') { const f = s.win ? AS.tMin(s.win.from) : 0; const to = s.win ? (s.win.to === '24:00' ? 1440 : AS.tMin(s.win.to)) : 1440; n = Math.max(1, Math.ceil(((to > f ? to : to + 1440) - f) / t.min)); } else if (t.t === 'idle') n = t.per; else if (t.t === 'boot') n = 1; else if (t.t === 'stale') n = Math.max(1, Math.floor(24 / t.h)); else if (t.t === 'after') { const P = (ED.draft || []).find((x) => x.id === t.of); n = P ? asPerDay(P, (dp || 0) + 1) : null; }
    if (s.days && n != null) n = n * s.days.length / 7; return n; }
  function asFormHtml(s) { const t = s.trig; const others = (ED.draft || []).filter((x) => x.id !== s.id); const PCS = asPcs(); const dur = asDur(s.job); const per = asPerDay(s);
    const trigBtns = Object.entries(AS.TRIG).map(([k, v]) => `<button type="button" class="${t.t === k ? 'on' : ''}" data-ft="${k}" title="${esc3(v.d)}">${esc3(v.l)}</button>`).join('');
    let tf = '';
    if (t.t === 'time') tf = `<div class="as-f"><span class="lb">시각</span>${t.times.map((x) => `<span class="tchip">${x}<button type="button" data-fdel="${x}" title="이 시각 빼기">✕</button></span>`).join('')}<input type="time" data-fadd step="300" title="시각을 고르고 ＋"><button type="button" data-fadd-b>＋ 시각</button><span class="as-tip">시간표의 블록을 옆으로 끌어도 바뀜</span></div>`;
    else if (t.t === 'every') { const h = t.min % 60 === 0; tf = `<div class="as-f"><span class="lb">간격</span><input type="number" min="1" data-fe value="${h ? t.min / 60 : t.min}"><select data-feu><option value="h" ${h ? 'selected' : ''}>시간마다</option><option value="m" ${h ? '' : 'selected'}>분마다</option></select><span class="as-tip">시간 창(아래 '조건 더하기')의 시작 시각부터 나눔 · 10분 이상</span></div>`; }
    else if (t.t === 'after') tf = `<div class="as-f"><span class="lb">앞 칸</span><select data-fof><option value="">— 고르기 —</option>${others.map((o) => `<option value="${esc3(o.id)}" ${o.id === t.of ? 'selected' : ''}>${esc3(asName(o))} (${esc3(AS.describe(o, Object.fromEntries((ED.draft || []).map((x) => [x.id, x]))))})</option>`).join('')}</select></div>
      <div class="as-f"><span class="lb">언제</span><span class="seg"><button type="button" class="${t.need !== 'any' ? 'on' : ''}" data-fneed="done">끝까지 했을 때만</button><button type="button" class="${t.need === 'any' ? 'on' : ''}" data-fneed="any">멈춰도(끝나기만 하면)</button></span> <input type="number" min="0" max="720" data-fdl value="${t.delay}"> 분 뒤</div>`;
    else if (t.t === 'stale') tf = `<div class="as-f"><span class="lb">오래되면</span>마지막으로 끝낸 지 <input type="number" min="1" max="240" data-fh value="${t.h}"> 시간 넘으면 <span class="as-tip">사람이 직접 누른 것·웹앱 요청·다른 PC도 셈 — 겹쳐 하지 않음</span></div>`;
    else if (t.t === 'idle') tf = `<div class="as-f"><span class="lb">쉬면</span>이 PC가 <input type="number" min="5" max="720" data-fim value="${t.min}"> 분 넘게 아무 일도 안 하면 · 하루 <input type="number" min="1" max="24" data-fper value="${t.per}"> 번까지 <span class="as-tip">(1시간 간격)</span></div>`;
    else tf = `<div class="as-f"><span class="lb">켠 날 처음</span>수집기가 뜬 뒤 <input type="number" min="0" max="240" data-fbd value="${t.delay}"> 분 <span class="as-tip">그날 아무 PC에서 한 번</span></div>`;
    const g = !!(s.days || s.win || s.pcs || s.gapH || s.late || s.maxMin || s.retry);
    return `<div class="as-form" data-form="${esc3(s.id)}">
      <div class="as-f"><span class="lb">할 일</span><select data-fjob>${asOptsJob(s.job)}</select></div>
      <div class="as-f"><span class="lb">평균 걸린 시간</span><span style="font-size:14px">${asDurTxt(s.job, true)}</span>${dur.last ? `<span class="as-tip">마지막 ${schedFull(new Date(dur.last.at).toISOString())}${dur.last.pc ? ' · ' + esc3(dur.last.pc) : ''}</span>` : ''}</div>
      <div class="as-f"><span class="lb">이름 (선택)</span><input data-fname value="${esc3(s.name)}" placeholder="${esc3(asLabel(s.job))}" style="flex:1;min-width:180px"></div>
      <div class="as-f"><span class="lb">언제 할까</span><span class="seg">${trigBtns}</span></div><div class="as-tip" style="margin-left:100px">${esc3(AS.TRIG[t.t].d)}</div>${tf}
      <details data-gd ${g || ED.gOpen === s.id ? 'open' : ''} style="margin-top:4px"><summary style="cursor:pointer;font-weight:700;color:#2F5D50">＋ 조건 더하기 (요일 · 시간 창 · PC · 겹침 막기 · 최대 시간 · 다시 하기)${g ? ' — 붙은 조건 있음' : ''}</summary>
        <div class="as-f"><span class="lb">요일</span>${AS.DAYS.map((d, i) => `<button type="button" class="dchip${!s.days || s.days.includes(i) ? ' on' : ''}" data-fday="${i}">${d}</button>`).join('')}<span class="as-tip">${s.days ? '고른 요일만' : '매일'}</span></div>
        ${t.t !== 'time' ? `<div class="as-f"><span class="lb">시간 창</span><label><input type="checkbox" data-fwon ${s.win ? 'checked' : ''}> 이 시간 안에서만</label> <input type="time" data-fwf value="${s.win ? s.win.from : '08:00'}" ${s.win ? '' : 'disabled'}> ~ <input type="time" data-fwt value="${s.win && s.win.to !== '24:00' ? s.win.to : '22:00'}" ${s.win ? '' : 'disabled'}> <label><input type="checkbox" data-fw24 ${s.win && s.win.to === '24:00' ? 'checked' : ''} ${s.win ? '' : 'disabled'}> 자정까지</label></div>` : ''}
        <div class="as-f"><span class="lb">PC</span>${PCS.map((p) => `<label style="margin-right:6px"><input type="checkbox" data-fpc="${esc3(p)}" ${!s.pcs || s.pcs.includes(p) ? 'checked' : ''}> ${esc3(p)}${p === ctx.pc ? ' (이 PC)' : ''}</label>`).join('')}<span class="as-tip">${s.pcs ? '고른 PC에서만' : '알라딘 화면이 열린 아무 PC'}</span></div>
        ${t.t !== 'stale' ? `<div class="as-f"><span class="lb">겹침 막기</span>최근 <input type="number" min="0" max="240" data-fgap value="${s.gapH}"> 시간 안에 이 일을 끝냈으면 건너뜀 <span class="as-tip">(0 = 안 봄 · 사람이 누른 것도 셈)</span></div>` : ''}
        ${t.t === 'time' ? `<div class="as-f"><span class="lb">늦으면</span>정한 시각보다 <input type="number" min="0" max="1440" data-flate value="${s.late}"> 분 넘게 늦으면 그 회차는 건너뜀 <span class="as-tip">(0 = 그날 안에 늦게라도 한 번)</span></div>` : ''}
        <div class="as-f"><span class="lb">최대 시간</span><input type="number" min="0" max="1440" data-fmax value="${s.maxMin}"> 분 넘으면 지금 항목까지 저장하고 멈춤 <span class="as-tip">(0 = 끝까지 · 다음 회차에 그 자리부터)${dur.n && s.maxMin && s.maxMin * 60e3 < dur.avg ? ` <b style="color:#B0322A">평균(${AS.fmtMs(dur.avg)})보다 짧음 — 늘 중간에 멈춤</b>` : ''}</span></div>
        <div class="as-f"><span class="lb">다시 하기</span><label><input type="checkbox" data-fron ${s.retry ? 'checked' : ''}> 오류로 멈추면</label> <input type="number" min="5" max="720" data-frg value="${s.retry ? s.retry.gap : 30}" ${s.retry ? '' : 'disabled'}> 분 뒤 다시, 최대 <input type="number" min="1" max="5" data-frn value="${s.retry ? s.retry.n : 1}" ${s.retry ? '' : 'disabled'}> 번</div>
      </details>
      <div class="as-pv">📋 <b>${esc3(AS.describe(s, Object.fromEntries((ED.draft || []).map((x) => [x.id, x]))))}</b>${per != null ? ` · 하루 약 ${Math.round(per * 10) / 10}번${dur.n ? ` × ${AS.fmtMs(dur.avg)} = <b>하루 약 ${AS.fmtMs(per * dur.avg)}</b> 사용` : ''}` : ''}</div>
      <div style="margin-top:6px;text-align:right"><button type="button" data-fclose>접기 ▲</button></div></div>`; }
  /* 칸이 아닌 '늘 도는' 자동 일 — 켜고 끄기 · 지금 상태 (ctx.builtins: [{k, label, desc, on, par, run, last, toggle}]) */
  function asBiRow(b) { return `<div class="bi${b.on ? '' : ' off'}"><span class="lamp${b.run ? ' run' : b.on ? ' on' : ''}" title="${b.run ? '지금 하는 중' : b.on ? '켜짐' : '꺼짐'}"></span><div style="flex:1;min-width:0"><b>${esc3(b.label)}</b>${b.par ? '<span class="par-tag" title="알라딘을 쓰지 않아 다른 수집과 함께 돎">동시 진행</span>' : ''}<div class="st">${esc3(b.desc || '')}${b.last ? ` · 마지막 ${esc3(b.last)}` : ''}${b.run ? ` · <b style="color:#D9822B">▶ ${esc3(b.run)}</b>` : ''}${b.warn && b.on ? '' : b.warn ? ` · <b style="color:#B0322A">⚠ ${esc3(b.warn)}</b>` : ''}</div></div>${b.toggle ? `<label class="sw" title="켜기·끄기 (바로 저장 · Ctrl+Z로 되돌림)"><input type="checkbox" data-bik="${esc3(b.k)}" ${b.on ? 'checked' : ''}><span></span></label>` : '<small style="color:#8A9690" title="관리자 기기에서만 바꿀 수 있음">🔒</small>'}</div>`; }
  function asCloudHtml() { const c = ctx.cloud && ctx.cloud(); if (!c) return ''; const R2 = asCloudRows(); const beat = c.beat || {}; const age = beat.at ? Date.now() - Date.parse(beat.at) : null; const nOn = R2.filter((r) => r.on).length;
    const st = age == null ? '<b style="color:#B0322A">신호 없음</b>' : age < 10 * 60e3 ? `<b style="color:#1F7A4D">살아 있음</b> · 마지막 신호 ${Math.max(0, Math.round(age / 60e3))}분 전${beat.ver ? ' · 판 ' + esc3(beat.ver) : ''}${beat.idle ? ' · ' + esc3(beat.idle) : ''}` : `<b style="color:#B0322A">${Math.round(age / 60e3)}분째 신호 없음</b>`;
    const old = beat.ver && !beat.jobs && beat.at ? `<div class="as-msg warn">이 클라우드 판(${esc3(beat.ver)})은 아래 스위치를 아직 모릅니다 — 클라우드를 0.12.0으로 다시 배포해야 '끔'이 먹습니다(외부 정보 이어 받기만은 지금 판도 따름)</div>` : '';
    return `<div class="as-sec"><h4>☁ 클라우드가 하는 일 <small>PC와 따로 24시간 · ${st} · 켜진 일 ${nOn}/${R2.length} · 스위치는 누르는 즉시 저장(Ctrl+Z로 되돌림)</small></h4>${old}${R2.map(asBiRow).join('')}</div>`; }
  function asBiHtml() { const L = (ctx.builtins && ctx.builtins()) || []; if (!L.length) return asCloudHtml();
    return `<div class="as-sec"><h4>🔁 늘 도는 자동 일 <small>칸이 아니라 정한 간격으로 저절로 — 여기서 켜고 끔(모든 PC에 바로 적용)</small></h4>${L.map(asBiRow).join('')}</div>${asCloudHtml()}`; }
  function asEdDraw() { const ov = document.getElementById('rnas'); if (!ov || !ED.open) return; { const sc0 = ov.querySelector('.tl-scroll'); if (sc0) ED.tlX = sc0.scrollLeft; } const doc = asDoc(); const byId = Object.fromEntries(doc.slots.map((x) => [x.id, x])); const V = AS.validate(doc.slots, asLabel); const plan = AS.dayPlan(doc, ctx.runs(), { now: Date.now() }, asAvgMs);
    const y = ov.scrollTop; const used = new Set(doc.slots.map((s) => s.job)); const C0 = asCatalog(); const q = ED.catQ.trim();
    const load = doc.slots.filter((s) => s.on).reduce((a, s) => { const n = asPerDay(s); const d = asAvgMs(s.job); return a + (n && d ? n * d : 0); }, 0);
    const cat = AS_GROUPS.concat([...new Set(C0.map((c) => c.g))].filter((g) => !AS_GROUPS.includes(g))).map((g) => { const L = C0.filter((c) => c.g === g && (!q || (c.label + c.d + c.job).includes(q))); return L.length ? `<div class="cat-g">${esc3(g)}</div>${L.map((c) => { const d = asDur(c.job); return `<div class="cat-i" data-cat="${esc3(c.job)}" title="눌러서 맨 아래에 더하기 · 왼쪽 칸 목록으로 끌어 원하는 자리에 넣기"><div class="ci"><b>${esc3(c.label)}</b>${c.par ? '<span class="par-tag" title="알라딘을 쓰지 않아 다른 수집과 함께 돎">동시 진행</span>' : ''}<small>${esc3(c.d || c.job)}</small>${used.has(c.job) ? '<span class="used">✓ 칸에 있음</span>' : ''}</div><div class="cd">${d.n ? `<b>${AS.fmtMs(d.avg)}</b><br><small>평균 · ${d.n}번${d.approx ? ' (어림)' : ''}</small>` : d.stopN ? `<small style="color:#A8661B">끝낸 기록 없음<br>멈춘 ${d.stopN}번</small>` : '<small style="color:#8A9690">기록 없음</small>'}</div></div>`; }).join('')}` : ''; }).join('');
    const cards = doc.slots.map((s, i) => `<div class="as-card${s.on ? '' : ' off'}${ED.newId === s.id ? ' new' : ''}" data-card="${esc3(s.id)}"><div class="as-row"><span class="as-h" title="잡고 위아래로 끌어 순서(우선순위) 바꾸기">⋮⋮</span><span class="as-no">${i + 1}</span><label class="sw" title="이 칸 켜기·끄기"><input type="checkbox" data-con="${esc3(s.id)}" ${s.on ? 'checked' : ''}><span></span></label>
        <div class="as-m"><span class="as-nm">${esc3(asName(s))}</span>${asPar(s.job) ? '<span class="par-tag" title="알라딘을 쓰지 않아 다른 수집과 함께 돎 — 다른 일 때문에 밀리지 않음">동시 진행</span>' : ''}${asMissTag(s)}<span class="as-dur">${asDurTxt(s.job)}</span><div class="as-desc">${esc3(AS.describe(s, byId))}${s.trig.t === 'after' || s.trig.t === 'time' || s.trig.t === 'every' ? '' : ' <small style="color:#8A9690">(조건 칸 — 때를 미리 모름)</small>'}</div><div>${asChips(s, plan, doc)}</div></div>
        <div class="as-a"><button type="button" data-cedit="${esc3(s.id)}" title="고치기">${ED.sel === s.id ? '▲' : '✎'}</button><button type="button" data-cdup="${esc3(s.id)}" title="복제">⧉</button><button type="button" data-cdel="${esc3(s.id)}" title="지우기 (확정 한 번 더)">🗑</button></div></div>
        <div class="as-fw${ED.sel === s.id && ED.opened !== s.id ? '' : ED.sel === s.id ? ' open' : ''}"><div>${ED.sel === s.id ? asFormHtml(s) : ''}</div></div></div>`).join('');
    ov.innerHTML = `<div class="as-box"><div class="as-hd"><b>⏰ 매일 자동 수집 — 칸 편집</b><label class="sw" title="전체 켜기·끄기 — 누르는 즉시 모든 PC에 저장(💾 저장과 따로) · Ctrl+Z로 되돌림"><input type="checkbox" id="as_on" ${doc.on ? 'checked' : ''}><span></span></label><span>${doc.on ? '켜짐' : '<b style="color:#F2B544">꺼짐 — 아래 칸은 하지 않음 (스위치를 다시 켜거나 Ctrl+Z)</b>'}</span><span class="sp"></span>${ED.dirty ? '<span class="dirty">저장 안 한 고침 있음</span>' : ''}<button type="button" class="as-save" id="as_save" ${ED.dirty && !V.err.length ? '' : 'disabled'} title="${ED.dirty ? (V.err.length ? '아래 고칠 것을 먼저 풀어야 저장됨' : '고친 칸을 모든 PC에 적용') : '저장할 고침 없음 — 칸을 고치면 켜짐 (스위치들은 누르는 즉시 저장되어 이 단추가 필요 없음)'}">💾 저장 (모든 PC에 적용)</button><button type="button" id="as_undo" ${ED.dirty ? '' : 'disabled'} title="${ED.dirty ? '저장 전 고친 칸을 모두 버림 (한 번 더 눌러 확정) — 한 단계씩은 Ctrl+Z(다시 Ctrl+Shift+Z)' : '버릴 고침 없음 — 바로 저장된 스위치는 Ctrl+Z로 되돌림'}">↺ 모두 되돌리기</button><small style="opacity:.8" title="저장 전 고침에만 — 저장한 것은 모든 PC에 이미 적용">Ctrl+Z 한 단계 ↶ · Ctrl+Shift+Z ↷</small><button type="button" id="as_x">닫기 ✕</button></div>
      ${ED.conf ? `<div class="as-msg bad">⚠ 다른 PC(또는 다른 창)가 그사이 칸을 바꿔 저장했습니다 — 이 화면의 고침을 저장하면 그 고침을 덮게 되어 막아 둠. <button type="button" id="as_reload">다시 불러오기 (내 고침 버림)</button></div>` : ''}
      ${ED.msg ? `<div class="as-msg ${ED.msgBad ? 'bad' : ''}">${esc3(ED.msg)}</div>` : ''}${V.err.length ? `<div class="as-msg bad">고칠 것: ${V.err.map(esc3).join(' · ')}</div>` : ''}${V.warn.length ? `<div class="as-msg warn">${V.warn.map(esc3).join(' · ')}</div>` : ''}
      <div class="as-sec"><h4>🕘 오늘 시간표 <small>블록 길이 = 평균 걸린 시간(끝난 회차는 실제) · 초록 끝 · 주황 하는 중 · 빨강 멈춤 · 점선 = 앞 칸 끝난 뒤(예상) · '정한 시각' 블록은 옆으로 끌어 시각 바꿈 · 켠 칸 하루 사용 약 <b>${AS.fmtMs(load)}</b>${load > 20 * 3600e3 ? ' <b style="color:#B0322A">— 하루를 거의 다 씀</b>' : ''}</small></h4><div class="tl-w"><div class="tl-info-w">${asTlInfo(asTlModel())}</div><div class="tl-box">${asTlHtml()}</div></div></div>
      <div class="as-main"><div class="as-list"><h4>칸 목록 <small>위 칸이 먼저 (같은 때 여러 칸이면 위부터 하나씩) · ⋮⋮를 끌어 순서 바꿈 · ✎를 눌러 고침</small></h4><div id="as_cards">${cards}</div><button type="button" class="as-add" id="as_add">＋ 칸 더하기 (오른쪽 '넣을 일'에서 골라도 됨)</button></div>
        <div class="as-cat"><h4>＋ 넣을 일 <small>평균 걸린 시간 = 끝까지 한 최근 10번 · 끌어서 왼쪽 목록에 놓거나 눌러서 맨 아래에</small></h4><input id="as_q" placeholder="찾기 (예: 시장, 문의)" value="${esc3(ED.catQ)}" style="width:100%;margin-bottom:4px">${cat}</div></div>
      ${asBiHtml()}
      <div class="as-sec oth"><h4>요청을 받아서만 하는 일 <small>(스스로 시작하지 않음 — 사람이 웹앱·수집기에서 시킨 일을 처리)</small></h4><ul style="margin:0;padding-left:18px"><li>웹앱의 수집 요청 · 맡긴 일(시장 지표·등록·송장·외부 정보 지금 받기) — 들어오면 곧바로</li><li>보낸 등록이 알라딘에 공개됐는지 확인 — 등록을 보낸 뒤 3분마다, 90분까지</li><li>🛰 원격 중단·업데이트 — 보냈을 때만</li><li>주문(주문확인요청·발송 요청)·알라딘 구매 첫 쪽 — 클라우드가 늘 함(수집기 아님)</li></ul></div></div>`;
    ov.scrollTop = y; if (ED.sel && ED.opened !== ED.sel) { const fw = ov.querySelector(`[data-card="${CSS.escape(ED.sel)}"] .as-fw`); ED.opened = ED.sel; if (fw) requestAnimationFrame(() => requestAnimationFrame(() => fw.classList.add('open'))); }
    ED.newId = null; asEdBind(ov); const tw = ov.querySelector('.tl-w'); if (tw) asTlScroll(tw, ED.tlX); }
  function asEdit(id, fn) { const s = (ED.draft || []).find((x) => x.id === id); if (!s) return; asSnap(); fn(s); const i = ED.draft.indexOf(s); ED.draft[i] = AS.sanitize(s) || s; asTouch(); asEdDraw(); }
  function asAddSlot(job, at) { const { min } = kstNow(); const nx = AS.hm((Math.floor(min / 60) + 1) % 24 * 60); const s = AS.sanitize({ id: asNewId(), job, on: true, trig: { t: 'time', times: [nx] } }); asSnap(); const L = ED.draft; const i = at == null || at > L.length ? L.length : Math.max(0, at); L.splice(i, 0, s); ED.sel = s.id; ED.opened = null; ED.newId = s.id; asTouch(); asEdDraw();
    const c = document.querySelector(`#rnas [data-card="${CSS.escape(s.id)}"]`); if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  function asEdBind(ov) { const $o = (s) => ov.querySelector(s); const all = (s) => ov.querySelectorAll(s);
    $o('#as_x').onclick = (e) => { if (!ED.dirty) { ED.open = false; ov.style.display = 'none'; return; } asArm(e.currentTarget, '저장 안 한 고침 버리고 닫기', () => { ED.open = false; ED.dirty = false; ov.style.display = 'none'; }); };
    $o('#as_undo').onclick = (e) => asArm(e.currentTarget, '고친 것 모두 되돌리기', () => { asSnap(); ED.draft = AS.slotsOf(ctx.doc()); ED.base = JSON.stringify(ED.draft); ED.baseRev = +ctx.doc().rev || 0; ED.dirty = false; ED.conf = false; ED.sel = null; asEdDraw(); });
    const rl = $o('#as_reload'); if (rl) rl.onclick = (e) => asArm(e.currentTarget, '내 고침 버리고 다시 불러오기', () => { ED.draft = AS.slotsOf(ctx.doc()); ED.base = JSON.stringify(ED.draft); ED.hist = []; ED.fut = []; ED.baseRev = +ctx.doc().rev || 0; ED.dirty = false; ED.conf = false; asEdDraw(); });
    $o('#as_save').onclick = async (e) => { const b = e.currentTarget; b.disabled = true; b.textContent = '저장 중…'; const old = AS.slotsOf(ctx.doc()); const nm = (s) => asName(s); const ch = [];
      ED.draft.forEach((s, i) => { const o = old.find((x) => x.id === s.id); if (!o) ch.push(`＋${nm(s)}`); else if (JSON.stringify(o) !== JSON.stringify(s)) ch.push(`✎${nm(s)}`); else if (old.indexOf(o) !== i) ch.push(`↕${nm(s)}`); }); old.forEach((o) => { if (!ED.draft.some((x) => x.id === o.id)) ch.push(`－${nm(o)}`); });
      ED.saving = true; try { await ctx.save(ED.draft, ED.baseRev, ch.join(', ') || '바뀐 것 없음'); ED.dirty = false; ED.conf = false; ED.baseRev = ED.baseRev + 1; ED.draft = AS.slotsOf({ slots: ED.draft }); ED.base = JSON.stringify(ED.draft); ED.msg = `저장했습니다 — 모든 PC가 다음 확인(1분 안)부터 이대로 (${ch.length}곳 바뀜)`; ED.msgBad = false; }
      catch (er) { if (er.conflict) ED.conf = true; ED.msg = '저장 못 함: ' + er.message; ED.msgBad = true; } finally { ED.saving = false; } asEdDraw(); };
    $o('#as_on').onchange = async (e) => { const cb = e.target; const v = cb.checked; cb.disabled = true; cb.blur();
      try { await ctx.setOn(v); asActRec({ t: 'on', v }); ED.msg = `⏰ 매일 자동 수집 전체를 ${v ? '켰습니다' : '껐습니다 — 아래 칸들은 다시 켤 때까지 하지 않음'} · 이 스위치는 누르는 즉시 모든 PC에 저장됨(💾 저장 단추와 상관없음) · Ctrl+Z로 되돌림`; ED.msgBad = false; }
      catch (er) { ED.msg = '저장 실패: ' + er.message; ED.msgBad = true; } asEdDraw(); };
    $o('#as_add').onclick = () => { const c = asCatalog().find((x) => x.job === 'prd:market') || asCatalog()[0]; asAddSlot(c.job); };
    const qi = $o('#as_q'); qi.oninput = () => { ED.catQ = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { const p = qi.selectionStart; asEdDraw(); const n = document.querySelector('#as_q'); if (n) { n.focus(); n.setSelectionRange(p, p); } }, 250); };
    all('[data-con]').forEach((cb) => (cb.onchange = () => asEdit(cb.dataset.con, (s) => { s.on = cb.checked; })));
    all('[data-cedit]').forEach((b) => (b.onclick = () => { const id = b.dataset.cedit; if (ED.sel === id) { const fw = ov.querySelector(`[data-card="${CSS.escape(id)}"] .as-fw`); if (fw) fw.classList.remove('open'); setTimeout(() => { ED.sel = null; ED.opened = null; asEdDraw(); }, 280); return; } ED.sel = id; ED.opened = null; asEdDraw(); }));
    all('[data-cdup]').forEach((b) => (b.onclick = () => { const i = ED.draft.findIndex((x) => x.id === b.dataset.cdup); if (i < 0) return; asSnap(); const c = AS.sanitize({ ...JSON.parse(JSON.stringify(ED.draft[i])), id: asNewId(), name: ED.draft[i].name ? ED.draft[i].name + ' (복제)' : '' }); ED.draft.splice(i + 1, 0, c); ED.sel = c.id; ED.opened = null; ED.newId = c.id; asTouch(); asEdDraw(); }));
    all('[data-cdel]').forEach((b) => (b.onclick = () => { const id = b.dataset.cdel; const kids = ED.draft.filter((x) => x.trig.t === 'after' && x.trig.of === id); asArm(b, kids.length ? `지우기 (이 칸 뒤에 하는 ${kids.length}칸도 고쳐야 함)` : '지우기 확정', () => { const card = ov.querySelector(`[data-card="${CSS.escape(id)}"]`); if (card) { card.style.opacity = '0'; card.style.transform = 'translateX(30px)'; } setTimeout(() => { asSnap(); ED.draft = ED.draft.filter((x) => x.id !== id); if (ED.sel === id) ED.sel = null; asTouch(); asEdDraw(); }, 200); }); }));
    /* 고치기 칸 */
    const F = ov.querySelector('.as-form'); if (F) { const id = F.dataset.form; const q1 = (s) => F.querySelector(s); const qa = (s) => F.querySelectorAll(s); const ed = (fn) => asEdit(id, fn); const num = (el) => +el.value;
      q1('[data-fjob]').onchange = (e) => ed((s) => { s.job = e.target.value; });
      q1('[data-fname]').onchange = (e) => ed((s) => { s.name = e.target.value.trim(); });
      qa('[data-ft]').forEach((b) => (b.onclick = () => ed((s) => { const k = b.dataset.ft; if (s.trig.t === k) return; const { min } = kstNow(); s.trig = k === 'time' ? { t: k, times: [AS.hm((Math.floor(min / 60) + 1) % 24 * 60)] } : k === 'every' ? { t: k, min: 120 } : k === 'after' ? { t: k, of: (ED.draft.find((x) => x.id !== s.id) || {}).id || '', delay: 0, need: 'done' } : k === 'stale' ? { t: k, h: 24 } : k === 'idle' ? { t: k, min: 30, per: 1 } : { t: k, delay: 5 }; })));
      qa('[data-fdel]').forEach((b) => (b.onclick = () => ed((s) => { s.trig.times = s.trig.times.filter((x) => x !== b.dataset.fdel); })));
      const addT = () => { const v = (q1('[data-fadd]') || {}).value; if (!v) return; ed((s) => { s.trig.times = AS.normTimes([...s.trig.times, v]); }); }; if (q1('[data-fadd-b]')) { q1('[data-fadd-b]').onclick = addT; q1('[data-fadd]').onkeydown = (e) => { if (e.key === 'Enter') addT(); }; }
      if (q1('[data-fe]')) { const upd = () => ed((s) => { s.trig.min = Math.max(10, Math.round(num(q1('[data-fe]')) * (q1('[data-feu]').value === 'h' ? 60 : 1))); }); q1('[data-fe]').onchange = upd; q1('[data-feu]').onchange = upd; }
      if (q1('[data-fof]')) q1('[data-fof]').onchange = (e) => ed((s) => { s.trig.of = e.target.value; });
      qa('[data-fneed]').forEach((b) => (b.onclick = () => ed((s) => { s.trig.need = b.dataset.fneed; })));
      [['[data-fdl]', (s, v) => (s.trig.delay = v)], ['[data-fh]', (s, v) => (s.trig.h = v)], ['[data-fim]', (s, v) => (s.trig.min = v)], ['[data-fper]', (s, v) => (s.trig.per = v)], ['[data-fbd]', (s, v) => (s.trig.delay = v)], ['[data-fgap]', (s, v) => (s.gapH = v)], ['[data-flate]', (s, v) => (s.late = v)], ['[data-fmax]', (s, v) => (s.maxMin = v)]].forEach(([sel, f]) => { const el = q1(sel); if (el) el.onchange = () => ed((s) => f(s, num(el))); });
      qa('[data-fday]').forEach((b) => (b.onclick = () => ed((s) => { const i = +b.dataset.fday; let d = s.days ? s.days.slice() : [0, 1, 2, 3, 4, 5, 6]; d = d.includes(i) ? d.filter((x) => x !== i) : [...d, i]; s.days = d.length ? d : s.days; })));
      if (q1('[data-fwon]')) { const wr = () => ed((s) => { s.win = q1('[data-fwon]').checked ? { from: q1('[data-fwf]').value || '08:00', to: q1('[data-fw24]').checked ? '24:00' : q1('[data-fwt]').value || '22:00' } : null; }); ['[data-fwon]', '[data-fwf]', '[data-fwt]', '[data-fw24]'].forEach((k) => (q1(k).onchange = wr)); }
      qa('[data-fpc]').forEach((cb) => (cb.onchange = () => ed((s) => { const P = [...qa('[data-fpc]')].filter((x) => x.checked).map((x) => x.dataset.fpc); s.pcs = P.length === qa('[data-fpc]').length || !P.length ? null : P; })));
      { const rw = () => ed((s) => { s.retry = q1('[data-fron]').checked ? { n: num(q1('[data-frn]')) || 1, gap: num(q1('[data-frg]')) || 30 } : null; }); ['[data-fron]', '[data-frg]', '[data-frn]'].forEach((k) => (q1(k).onchange = rw)); }
      { const gd = q1('[data-gd]'); if (gd) gd.ontoggle = () => { ED.gOpen = gd.open ? id : null; }; }
      q1('[data-fclose]').onclick = () => { const fw = F.closest('.as-fw'); if (fw) fw.classList.remove('open'); setTimeout(() => { ED.sel = null; ED.opened = null; asEdDraw(); }, 280); }; }
    all('[data-bik]').forEach((cb) => (cb.onchange = async () => { const b = asBiOf(cb.dataset.bik); if (!b || !b.toggle) return; cb.disabled = true; cb.blur(); try { await b.toggle(cb.checked); asActRec({ t: 'bi', k: b.k, v: cb.checked }); ED.msg = `${b.label} ${cb.checked ? '켬' : '끔'} — 모든 PC에 바로 적용 · Ctrl+Z로 되돌림`; ED.msgBad = false; } catch (er) { ED.msg = '저장 못 함: ' + er.message; ED.msgBad = true; } asEdDraw(); }));
    asDragList(ov); asDragCat(ov); asDragTl(ov); }
  /* 칸 끌기 — 잡은 칸은 손을 따라오고, 지나가는 칸들은 비켜 미끄러짐(.2초) · 놓으면 그 자리 */
  function asDragList(ov) { ov.querySelectorAll('.as-h').forEach((h) => (h.onpointerdown = (e) => { if (e.button > 0) return; e.preventDefault(); const card = h.closest('.as-card'); const box = ov.querySelector('#as_cards'); const cards = [...box.querySelectorAll('.as-card')]; const from = cards.indexOf(card); const R = cards.map((c) => c.getBoundingClientRect()); const gap = 7; const H = R[from].height + gap; const y0 = e.clientY; let to = from;
      ED.dragging = true; card.classList.add('lift'); card.style.transition = 'box-shadow .2s'; try { h.setPointerCapture(e.pointerId); } catch (x) {}
      const mv = (ev) => { const dy = ev.clientY - y0; card.style.transform = `translateY(${dy}px) scale(1.01)`; const cy = R[from].top + R[from].height / 2 + dy; to = R.filter((r, i) => i !== from && r.top + r.height / 2 < cy).length;
        cards.forEach((c, i) => { if (i === from) return; let d = 0; if (from < to && i > from && i <= to) d = -H; if (from > to && i >= to && i < from) d = H; c.style.transform = d ? `translateY(${d}px)` : ''; }); };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); ED.dragging = false;
        if (to === from) { if (ED.pend) { asEdDraw(); return; } card.classList.remove('lift'); card.style.transition = ''; card.style.transform = ''; cards.forEach((c) => (c.style.transform = '')); return; }
        const fin = R[to].top - R[from].top + (to > from ? R[to].height - R[from].height : 0); card.style.transition = 'transform .18s ease,box-shadow .2s'; card.style.transform = `translateY(${fin}px)`;
        setTimeout(() => { asSnap(); const L = ED.draft; const [m] = L.splice(from, 1); L.splice(to, 0, m); asTouch(); asEdDraw(); const c2 = document.querySelector(`#rnas [data-card="${CSS.escape(m.id)}"]`); if (c2) c2.classList.add('settle'); }, 190); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); })); }
  /* 넣을 일 끌기 → 칸 목록의 원하는 자리 (빈자리가 벌어짐) · 그냥 누르면 맨 아래 */
  function asDragCat(ov) { ov.querySelectorAll('[data-cat]').forEach((it) => (it.onpointerdown = (e) => { if (e.button > 0) return; const job = it.dataset.cat; const x0 = e.clientX, y0 = e.clientY; let gh = null, ph = null, idx = null; const box = ov.querySelector('#as_cards');
      const mv = (ev) => { if (!gh) { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return; gh = document.createElement('div'); gh.id = 'rnas-ghost'; gh.textContent = '＋ ' + asLabel(job); document.body.appendChild(gh); ph = document.createElement('div'); ph.className = 'as-ph'; }
        ev.preventDefault(); ED.dragging = true; gh.style.left = ev.clientX + 12 + 'px'; gh.style.top = ev.clientY + 8 + 'px'; const lr = box.getBoundingClientRect(); const inside = ev.clientX >= lr.left - 20 && ev.clientX <= lr.right + 20 && ev.clientY >= lr.top - 30 && ev.clientY <= lr.bottom + 60;
        if (!inside) { if (ph.isConnected) { ph.classList.remove('on'); ph.remove(); } idx = null; return; } const cards = [...box.querySelectorAll('.as-card')]; const k = cards.filter((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2 < ev.clientY; }).length;
        if (k !== idx) { idx = k; if (ph.isConnected) ph.remove(); ph.classList.remove('on'); if (k >= cards.length) box.appendChild(ph); else box.insertBefore(ph, cards[k]); requestAnimationFrame(() => ph.classList.add('on')); } };
      const up = () => { removeEventListener('pointermove', mv, true); removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true); ED.dragging = false; if (!gh) { asAddSlot(job); return; } gh.remove(); if (ph && ph.isConnected) ph.remove(); if (idx != null) asAddSlot(job, idx); else if (ED.pend) asEdDraw(); };
      addEventListener('pointermove', mv, true); addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true); })); }
  /* 시간표의 '정한 시각' 블록 끌기 → 시각 바꿈(5분 단위) */
  /* (0.2.0) 시간표 손놀림 — 바깥 상자(.tl-w)에 한 번만 걸어 두고(안쪽을 다시 그려도 그대로) ① 블록 누르기 = 고름 ② '정한 시각' 블록 옆으로 끌기 = 시각 바꿈 ③ 빈 곳 잡고 끌기 = 옆으로 넘기기(놓으면 관성으로 부드럽게 멈춤) */
  function asDragTl(ov) { const w = ov.querySelector('.tl-w'); if (!w || w._tlBound) return; w._tlBound = 1;
    w.addEventListener('click', (e) => { const c = e.target.closest('[data-tlclr]'); if (c) { ED.selTl = null; ED.selBlk = null; asEdDrawTl(); } });
    w.addEventListener('wheel', (e) => { const sc = w.querySelector('.tl-scroll'); if (!sc || !e.shiftKey) return; e.preventDefault(); sc.scrollLeft += e.deltaY; ED.tlX = sc.scrollLeft; }, { passive: false });
    w.addEventListener('pointerdown', (e) => { if (e.button > 0) return; const sc = w.querySelector('.tl-scroll'); if (!sc || !sc.contains(e.target)) return; const b = e.target.closest('.tl-b'); if (b) return asTlBlockDown(e, b, w); if (e.target.closest('.tl-l')) return;
      e.preventDefault(); cancelAnimationFrame(ED.tlAnim || 0); const x0 = e.clientX, s0 = sc.scrollLeft; let lastX = e.clientX, lastT = performance.now(), v = 0, moved = false; sc.classList.add('grabbing'); try { sc.setPointerCapture(e.pointerId); } catch (x) {}
      const mv = (ev) => { const now = performance.now(); const dx = ev.clientX - lastX; const dt = Math.max(1, now - lastT); v = 0.8 * (-dx / dt) + 0.2 * v; lastX = ev.clientX; lastT = now; if (Math.abs(ev.clientX - x0) > 3) moved = true; sc.scrollLeft = s0 - (ev.clientX - x0); };
      const up = () => { sc.removeEventListener('pointermove', mv); sc.removeEventListener('pointerup', up); sc.removeEventListener('pointercancel', up); sc.classList.remove('grabbing'); ED.tlX = sc.scrollLeft;
        if (!moved) return; if (performance.now() - lastT > 80) v = 0; let vel = Math.max(-45, Math.min(45, v * 16)); /* px/프레임 (너무 멀리 날아가지 않게 최대 45) */ const step = () => { if (Math.abs(vel) < 0.4) { ED.tlX = sc.scrollLeft; return; } sc.scrollLeft += vel; vel *= 0.94; /* 손을 놓으면 점점 느려지며 멈춤(휴대폰처럼) */ ED.tlAnim = requestAnimationFrame(step); }; ED.tlAnim = requestAnimationFrame(step); };
      sc.addEventListener('pointermove', mv); sc.addEventListener('pointerup', up); sc.addEventListener('pointercancel', up); }); }
  function asTlBlockDown(e, b, w) { e.preventDefault(); const [id, tag] = (b.dataset.tlk || '').split('|'); const canDrag = !!b.dataset.tlt; const m0 = AS.tMin(tag); const x0 = e.clientX; let m = m0, moved = false; let lab = null;
    try { b.setPointerCapture(e.pointerId); } catch (x) {}
    const mv = (ev) => { if (!canDrag) return; if (!moved && Math.abs(ev.clientX - x0) < 4) return; if (!moved) { moved = true; ED.dragging = true; b.classList.add('moving'); lab = document.createElement('i'); b.appendChild(lab); }
      m = Math.max(0, Math.min(1435, Math.round((m0 + (ev.clientX - x0) / TL_PXH * 60) / 5) * 5)); b.style.left = tlX(m) + 'px'; lab.textContent = AS.hm(m); };
    const up = () => { b.removeEventListener('pointermove', mv); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); ED.dragging = false;
      if (!moved || m === m0) { const same = ED.selTl && ED.selTl.id === id && ED.selTl.tag === tag; ED.selTl = same ? null : { id, tag }; ED.selBlk = !same && canDrag ? `${id}|${tag}` : null; asEdDrawTl(); return; }
      asEdit(id, (s) => { s.trig.times = AS.normTimes(s.trig.times.filter((x) => x !== tag).concat(AS.hm(m))); }); ED.selTl = { id, tag: AS.hm(m) }; ED.selBlk = `${id}|${AS.hm(m)}`; ED.msg = `'${asName(ED.draft.find((x) => x.id === id))}' ${tag} → ${AS.hm(m)} (저장을 눌러야 적용)`; ED.msgBad = false; asEdDraw(); };
    b.addEventListener('pointermove', mv); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); }
  document.addEventListener('keydown', (e) => { if (!ED.open) return; const ov = document.getElementById('rnas'); if (!ov || ov.style.display === 'none' || !ov.isConnected) return;
    const typing = e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '') && e.target.type !== 'checkbox';
    if (e.key === 'Escape' && !ctx.mount && !ED.dirty) { ED.open = false; ov.style.display = 'none'; return; }
    if (typing) return; /* 글을 쓰는 칸 안에서는 브라우저 기본(글자 되돌리기) */
    const k = String(e.key || '').toLowerCase(); const mod = e.ctrlKey || e.metaKey;
    if (mod && (k === 'z' || k === 'y')) { const redo = k === 'y' || e.shiftKey; if (!(redo ? ED.fut : ED.hist).length && ctx.mount) return; /* 웹앱: 편집기에 되돌릴 것이 없으면 웹앱 전체 되돌리기에 넘김 */ e.preventDefault(); e.stopImmediatePropagation(); asUndo(redo); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ED.selBlk) { e.preventDefault(); e.stopImmediatePropagation(); const [id, tag] = ED.selBlk.split('|'); const sl = ED.draft.find((x) => x.id === id); if (!sl) return; ED.selBlk = null; ED.selTl = null;
      asEdit(id, (x) => { x.trig.times = x.trig.times.filter((t) => t !== tag); }); ED.msg = `'${asName(sl)}' ${tag} 시각을 지움${sl.trig.times.length ? '' : ' — 남은 시각이 없어 저장이 막힘(다른 시각을 넣거나 Ctrl+Z)'} · Ctrl+Z로 되돌림`; ED.msgBad = false; asEdDraw(); } }, true);

    return { open: asEdOpen, refresh: asEdRefresh, draw: () => asEdDraw(), isOpen: () => ED.open, histN: (redo) => (redo ? ED.fut : ED.hist).length, undo: (redo) => asUndo(!!redo), chips: asChips, durTxt: asDurTxt, name: asName, label: asLabel, missTag: asMissTag, missing: asMissing, avg: asAvgMs, dur: asDur, perDay: (s) => asPerDay(s), hm: schedHM, full: schedFull, ST_TXT, ST_ICON, _st: () => ED };
  }
  /* 칸 저장 — 수집기·웹앱이 같은 함수로(같은 검사·같은 문서 모양·같은 바꾼 기록)
   *  F = { db, cfgRef(prd_system/autoSched), editsRef(달 'YYYY-MM' → prd_jobs/autoSched_edits_달), arrayUnion, email } · baseRev가 다르면(그사이 다른 곳이 저장) 덮지 않고 conflict */
  async function saveSlots(F, slots, baseRev, what, by, labelOf) { const clean = slots.map(AS.sanitize).filter(Boolean); const V = AS.validate(clean, labelOf); if (V.err.length) throw new Error(V.err.join(' / '));
    let conflict = false; const now = new Date().toISOString();
    await F.db.runTransaction(async (tx) => { const s0 = await tx.get(F.cfgRef); const D = s0.exists ? s0.data() : {}; const rev = +D.rev || 0; if (baseRev != null && rev !== baseRev) { conflict = true; return; }
      tx.set(F.cfgRef, { slots: JSON.parse(JSON.stringify(clean)), items: AS.legacyItems(clean), rev: rev + 1, ver: 2, at: now, by }, { merge: true }); });
    if (conflict) { const e = new Error('다른 PC(또는 다른 창)가 그사이 칸을 바꿨습니다 — 다시 불러온 뒤 고쳐 주세요'); e.conflict = true; throw e; }
    try { await F.editsRef(AS.kst(Date.now()).day.slice(0, 7)).set({ log: F.arrayUnion({ at: now, pc: by, email: F.email || null, what: String(what || '').slice(0, 300), n: clean.length }) }, { merge: true }); } catch (e) {}
    return clean; }
  const api = { VERSION, AS, saveSlots, CLOUD_JOBS, cloudJobOn, META: AS_META, GROUPS: AS_GROUPS, CRM_LBL, createEditor, esc: esc3, kstNow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  G.ReadnowAuto = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
