/* col2seed.js — (11/13 일꾼 rv5 · 리드 지시 '모든 PC가 결국 번외 하나로 · PC 하나씩·일 하나씩 · 되돌리기 한 번' · 헌장 제30조 · 사실 F21) 🔀 번외 넘김 차례표
 *
 * 왜: 번외로 일을 넘기는 스위치(app_settings/col2_handoff.jobs.<일>)는 웹앱 ⚙ 설정 › 🔀 번외로 넘기기 [넘기기] 두 번으로만 켜졌는데,
 *     한 번도 눌리지 않아 문서 자체가 없었음(진단 11/13 14:30 doc=app_settings/col2_handoff → 없음) — 그래서 '넘길 수 있음'이 며칠째 나와도 실제로 넘긴 일 0.
 * 어떻게: 아래 SEED의 줄마다 한 번만 —
 *   ① 조건: 그 PC 번외의 하루 요약(col2_jday/<날짜>_<PC>)이 3시간 안 · 번외 판 ≥ minV · 그 일 '넘길 수 있음'(pass.can) · 🔌 홀로 연결 등록(사무실 PC — 웹앱이 닫혀도 결과를 씀)
 *   ② 맞으면 jobs.<일> = { on, pc, at, by, beat:null } + log 한 줄(웹앱 c2HoSet과 같은 꼴) + seeds.<줄 id> 표시 — 한 트랜잭션
 *   ③ 안 맞으면 기다림(까닭이 바뀔 때만 seedWait.<줄 id>에 한 줄 · 쓰기 줄임)
 * 사람 우선(헌장 제7조 '사람이 넣은 값은 코드로 덮지 않음'): 그 일에 이미 줄이 있으면(사람이 넘겼거나 되돌렸으면) 건드리지 않고 '사람 값 있음'으로 끝냄.
 * 되돌리기 한 번: 웹앱 ⚙ 설정 › 🔀 번외로 넘기기 › 그 일 줄 [↩ 되돌리기] 두 번 → on:false(seeds 표시가 남아 다시 켜지 않음) · 또는 SEED에 같은 일 { on:false } 줄.
 *   넘긴 PC 소식(beat)이 일마다 정한 시간(국중 8시간) 넘게 없으면 운영 수집기가 스스로 다시 함(운영 c2HoLive) — 번외가 죽어도 일이 비지 않음.
 * 지키는 것: 출고 PC(MJ-MAIN)는 차례표로 켜지 않음(헌장 제6조 · 사람이 출고 없는 때) · 로거 칸 일은 로거만, 사무실 일은 로거로 안 감(헌장 제5조) ·
 *   알라딘 로그인 일·돈 걸린 쓰기는 이 표에 넣지 않음(로그인·출고 일은 마지막 — 리드 지시) · 지우는 쓰기 없음(merge만). */
'use strict';
const DOC = 'col2_handoff';
const FRESH_H = 3; /* 웹앱 C2HO_FRESH_H와 같음 */
/* 차례표 — 한 줄 = 한 PC의 한 일. 다음 줄은 앞 줄이 실제로 도는 것(진단 recentUp 'writer 번외 <PC>')을 확인한 뒤 더함 */
const SEED = [
  { id: 'rv5-1113-nl-home', k: 'ext.nl', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.nl', why: '국립중앙도서관 ISBN 서지 — 11/13 HOME 102건 모두 같음 · 로그인 없음 · 돈 무관' }
];
const LG_JOBS = new Set(['dynamic', 'shopSum', 'bench']); /* 웹앱 C2HO_JOBS lg:true와 같음 */
const verGE = (a, b) => { const p = (s) => String(s || '').split('.').map((x) => +x || 0); const A = p(a), B = p(b); for (let i = 0; i < Math.max(A.length, B.length); i++) { if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) > (B[i] || 0); } return true; };
const kday = (t, off) => new Date(t + 9 * 3600e3 - (off || 0) * 864e5).toISOString().slice(0, 10);
/* 순수 판단(시험용) — s: 줄 · doc: col2_handoff 내용(없으면 {}) · days: [오늘, 어제] 하루 요약(없으면 null) · solo: col2_solo.pcs · now */
function decide(s, doc, days, solo, now) {
  doc = doc || {}; const seeds = doc.seeds || {}; const jobs = doc.jobs || {}; const pc = String(s.pc || '').toUpperCase();
  if (seeds[s.id]) return { act: 'done', why: '이미 한 줄' };
  if (!s.k || !pc) return { act: 'bad', why: '줄 모양이 틀림' };
  if (s.on && pc === 'MJ-MAIN') return { act: 'bad', why: '출고 PC는 차례표로 켜지 않음(사람이 출고 없는 때)' };
  if (s.on && (LG_JOBS.has(s.k) !== (pc === 'LOGGER'))) return { act: 'bad', why: '로거 칸 일은 로거만 · 사무실 일은 로거로 안 감' };
  const cur = jobs[s.k];
  if (!s.on) { if (!cur || cur.on !== true) return { act: 'mark', why: '이미 꺼져 있음' }; return { act: 'off', why: s.why || '차례표 되돌림' }; }
  if (cur && (cur.on === true || cur.offAt || cur.on === false)) return { act: 'mark', why: cur.on === true ? `사람 값 있음(이미 ${cur.pc || '?'}로 넘김)` : '사람 값 있음(되돌린 적 있음 — 다시 켜지 않음)' };
  if (pc !== 'LOGGER' && !(solo && solo[pc])) return { act: 'wait', why: `${pc} 🔌 홀로 연결 등록 없음` };
  const d = (days || []).find((x) => x && x.tasks && x.tasks[s.task || s.k]);
  if (!d) return { act: 'wait', why: `${pc} 번외 하루 요약에 그 일이 없음` };
  const at = Date.parse(d.at || '') || 0; if (!at || now - at > FRESH_H * 3600e3) return { act: 'wait', why: `${pc} 번외 소식이 ${FRESH_H}시간 넘게 없음` };
  if (!verGE(d.ver, s.minV || '0.1.25')) return { act: 'wait', why: `${pc} 번외 ${d.ver || '?'} — ${s.minV} 이상 필요` };
  const P = (d.tasks[s.task || s.k] || {}).pass || {}; if (P.can !== true) return { act: 'wait', why: `아직 '넘길 수 있음' 아님(${String(P.why || '판정 없음').slice(0, 60)})` };
  return { act: 'on', why: s.why || '넘길 수 있음' };
}
function makeSeed({ db, C, log, seed }) {
  const L = seed || SEED; const lastWhy = {};
  async function tick() {
    const out = []; const now = Date.now(); const ref = C('app_settings').doc(DOC);
    let solo = {}; try { solo = ((await C('app_settings').doc('col2_solo').get()).data() || {}).pcs || {}; } catch (e) {}
    for (const s of L) {
      const pc = String(s.pc || '').toUpperCase(); let days = [];
      try { days = (await Promise.all([0, 1].map((o) => C('col2_jday').doc(`${kday(now, o)}_${pc.replace(/[^\w.-]/g, '_')}`).get()))).map((g) => (g.exists ? g.data() || null : null)); } catch (e) {}
      let r = null;
      await db.runTransaction(async (tx) => { const g = await tx.get(ref); const doc = g.exists ? g.data() || {} : {}; r = decide(s, doc, days, solo, now);
        const at = new Date(now).toISOString(); const by = '클라우드 차례표(' + s.id + ')';
        if (r.act === 'on' || r.act === 'off') { const lg = Array.isArray(doc.log) ? doc.log.slice(0, 39) : []; lg.unshift({ k: s.k, on: r.act === 'on', pc: r.act === 'on' ? pc : null, at, by });
          tx.set(ref, { jobs: { [s.k]: r.act === 'on' ? { on: true, pc, at, by, beat: null } : { on: false, offAt: at, offBy: by } }, log: lg, seeds: { [s.id]: { at, act: r.act, why: r.why } } }, { merge: true }); }
        else if (r.act === 'mark' || r.act === 'bad') tx.set(ref, { seeds: { [s.id]: { at, act: r.act, why: r.why } } }, { merge: true });
        else if (r.act === 'wait' && lastWhy[s.id] !== r.why) tx.set(ref, { seedWait: { [s.id]: { at, why: r.why } } }, { merge: true }); });
      if (r && r.act === 'wait') lastWhy[s.id] = r.why;
      if (r && r.act !== 'done' && r.act !== 'wait') log('🔀 번외 넘김 차례표', s.id, r.act, r.why);
      out.push({ id: s.id, ...(r || {}) });
    }
    return out; }
  return { tick };
}
module.exports = { SEED, decide, makeSeed, verGE, DOC };
