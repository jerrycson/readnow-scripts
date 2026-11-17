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
  { id: 'rv5-1113-nl-home', k: 'ext.nl', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.nl', why: '국립중앙도서관 ISBN 서지 — 11/13 HOME 102건 모두 같음 · 로그인 없음 · 돈 무관' },
  /* (11/14 일꾼 col2seed) 둘째 줄 — 국중 → HOME이 하루 문제없음(맥박 11/14 00:15Z · 운영 JS-MAIN·HOME 기록 '국립중앙도서관은 번외 수집기(HOME)로 넘김' 6번·다시 물음 0 · 번외 HOME 오류 0) 확인 뒤.
   *  needSame: 11/12·11/13 번외 환율은 수출입은행 키를 못 받아(그 PC 웹앱이 키를 건네야 함) frankfurter로 읽어 '출처 다름'이었음 — 그대로 넘기면 번외는 쓰지 않고(수출입은행만 씀) 운영만 쉼.
   *  그래서 그 PC 번외가 운영과 같은 값(=수출입은행 고시)을 1건 이상 읽은 날에만 넘김 */
  { id: 'c2s-1114-fx-home', k: 'ext.fx', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.fx', needSame: 1, why: '💱 환율(수출입은행) — 하루 1건 · 로그인 없음 · 돈 무관 · HOME 번외가 수출입은행 고시를 운영과 같게 읽은 날' },
  /* (11/17 일꾼 bunoe1 · 정범님 11/17 12:06 '번외 완전 작동 — Tampermonkey 0' · 헌장 제30조 ④) 셋째 줄부터 — 하루에 한 줄씩(from = 그날 한국 0시 뒤에만) · 모두 로그인 없음·돈 무관·지우는 쓰기 없음
   *  근거 진단 11/15~11/17 HOME 하루 요약: kpipa 14/14 같음 · ext.joongmo 모두 같음 · ext.kyobo 다름은 '때가 다름'뿐 · ext.ridi·ext.lib 다름은 '옛 값/없음'뿐(까닭 모를 다름 0) · 셋 모두 pass.can
   *  넘긴 PC 번외가 꺼져도(HOME은 정범님이 끄고 켬 · F26) 소식이 8시간 끊기면 운영 수집기가 스스로 다시 함(운영 c2HoLive) — 일이 비지 않음 */
  { id: 'bn1-1117-kp-home', k: 'kpipa', pc: 'HOME', on: true, minV: '0.1.25', task: 'kpipa', from: '2026-11-17T00:00:00+09:00', why: '📚 출판 판매 통계(KPIPA) 최근 7일 — 11/15~17 HOME 14/14 같음 · 로그인 없음 · 돈 무관' },
  { id: 'bn1-1118-jm-home', k: 'ext.joongmo', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.joongmo', from: '2026-11-18T00:00:00+09:00', why: '🔎 중고닷 장터 시세 — 11/15~17 HOME 모두 같음 · 로그인 없음 · 돈 무관' },
  { id: 'bn1-1119-kb-home', k: 'ext.kyobo', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.kyobo', from: '2026-11-19T00:00:00+09:00', why: "🔎 교보문고 도서 정보 — 11/15~17 HOME 다름은 '때가 다름'뿐 · 로그인 없음 · 돈 무관" },
  { id: 'bn1-1120-rd-home', k: 'ext.ridi', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.ridi', from: '2026-11-20T00:00:00+09:00', why: "🔎 리디 전자책 — 11/15~17 HOME 다름은 '옛 값/없음'뿐 · 로그인 없음 · 돈 무관" },
  { id: 'bn1-1121-lb-home', k: 'ext.lib', pc: 'HOME', on: true, minV: '0.1.25', task: 'ext.lib', from: '2026-11-21T00:00:00+09:00', why: "📚 도서관 정보나루 — 11/15~17 HOME 다름은 '옛 값'뿐 · 로그인 없음 · 돈 무관" },
  /* 💱 환율 옮기기 — HOME은 🔌 홀로 연결(웹앱 닫힘)일 때 수출입은행 키를 못 받아(키는 웹앱이 메모리로만 건넴) 11/15·11/16 frankfurter로 읽어 넘김 소식(beat)이 11/14부터 0 → 운영 로거가 날마다 다시 씀(진단 11/17 ext_fx by LOGGER)
   *  move = 차례표가 켠 줄(사람 값 아님)이고 그 PC 소식이 그 일 한도(환율 30시간) 넘게 없을 때만 다른 PC로 옮김 · JS-MAIN은 늘 켜져 있고(F26) 웹앱이 키를 건넴(11/16 같음 1)
   *  (11/17 정범님 19.2) 「HOME 소식 30시간 없으면 JS-MAIN」을 한 길로 합침 — take = 차례표가 켠 줄이면 소식 시간을 기다리지 않고 바로 JS-MAIN으로(사람 값은 그대로) · JS-MAIN 번외는 jobs.fx.at 시각마다 받아 올림 · 다른 PC 번외는 받지 않음(handedElse)
   *  되돌림: ⚙ 🔀 ext.fx 되돌리기(운영 로거가 다시 받음) · 시각은 col2.json jobs.fx.at */
  { id: 'bn1-1118-fx-js', k: 'ext.fx', pc: 'JS-MAIN', on: true, minV: '0.1.77', task: 'ext.fx', needSame: 1, take: true, from: '2026-11-17T00:00:00+09:00', why: '💱 환율(수출입은행) — JS-MAIN 번외가 하루 정해진 시각(11:35·15:05)에 받아 운영 칸(ext_fx)에 올림 · 웹앱·다른 PC 번외는 그 값만 읽음 · 키를 받는 JS-MAIN이 운영과 같은 고시를 읽은 날 · 로그인 없음 · 돈 무관' },
  /* (11/17 일꾼 bunoe3 · 리드 '로거 일 넘김 줄 — 로거 고유 일(F05~F08)은 로거에 · 다른 기기와 겹치는 것만 정리') 🌐 로거 줄 — HOME 줄(11/18~11/21) 다음 날부터 하루에 한 줄씩
   *  로거 고유 일만(LG_JOBS: 👥 구매자 분포·🏪 숍 요약·🎯 숍 목록 끝까지) · 로거로만 감(decide가 다른 PC면 'bad') · 알라딘 공개 화면만(로그인·계정·쿠키·우리 숍 화면·우리 상품 목록 없음 · 테더링으로만 — 와이파이면 번외가 알라딘에 안 감)
   *  📈 시장 지표·🏷 중고 첫 쪽은 줄 없음 — 넘김은 📦 상품 화면 묶음(사무실 PC 한 대 · JS-MAIN)과 겹치므로(로거 그림자는 견줌만 · 🏷이 🏪 숍 차례를 채움)
   *  근거 진단 11/17 22시 LOGGER 0.1.77 하루 요약: 👥 31건 같음 17·다름 14(모두 '때가 다름') · 🏪 30건 같음 6·다름 24(모두 '때가 다름') · 둘 다 까닭 모를 다름 0·못 읽음 0 · 🎯 끝까지(benchFull)는 아직 표본 없음 → 그 일이 '넘길 수 있음'이 될 때까지 기다림
   *  쓰기 = 로거 웹앱(c2HoPlanW·c2HoBenchW) 또는 홀로 연결 — 운영 dynOne·rev6mJob·benchFinish 글자 그대로 · 지우는 쓰기 없음 · 로거 소식이 일마다 한도(👥 8시간·🏪 30시간·🎯 30시간) 넘게 없으면 운영 로거가 스스로 다시 함
   *  되돌림: 웹앱 ⚙ 설정 › 🔀 번외로 넘기기 › 그 일 [↩ 되돌리기] 두 번 · 또는 여기에 같은 일 { on:false } 줄 */
  { id: 'bn3-1122-dy-lg', k: 'dynamic', pc: 'LOGGER', on: true, minV: '0.1.77', task: 'dynamic', from: '2026-11-22T00:00:00+09:00', why: "👥 구매자 분포·함께 산 책 — 11/17 LOGGER 31건 다름은 '때가 다름'뿐 · 로거 고유 일 · 알라딘 공개 화면(로그인 없음) · 돈 무관" },
  { id: 'bn3-1123-ss-lg', k: 'shopSum', pc: 'LOGGER', on: true, minV: '0.1.77', task: 'shopSum', from: '2026-11-23T00:00:00+09:00', why: "🏪 숍 요약(6개월 평가 수·등급·품절취소율) — 11/17 LOGGER 30건 다름은 '때가 다름'뿐 · 로거 고유 일 · 알라딘 공개 화면(로그인 없음) · 돈 무관" },
  { id: 'bn3-1124-bf-lg', k: 'bench', pc: 'LOGGER', on: true, minV: '0.1.77', task: 'benchFull', from: '2026-11-24T00:00:00+09:00', why: "🎯 집중 벤치마킹 숍 목록 끝까지(작은 숍) — 로거 고유 일 · 알라딘 공개 화면(로그인 없음) · 돈 무관 · 끝까지 읽기 그림자가 '넘길 수 있음'인 날만" }
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
  if (s.from && !(now >= (Date.parse(s.from) || 0))) return { act: 'wait', why: `${String(s.from).slice(0, 10)}부터(하루에 한 줄씩)` }; /* (11/17 bunoe1) */
  if (!s.on) { if (!cur || cur.on !== true) return { act: 'mark', why: '이미 꺼져 있음' }; return { act: 'off', why: s.why || '차례표 되돌림' }; }
  /* (11/17 bunoe1) move: 차례표가 켠 줄(by '클라우드 차례표…')만 · 그 PC 소식(beat·at 늦은 쪽)이 move시간 넘게 없을 때만 다른 PC로 옮김 — 사람이 넘기거나 되돌린 값은 그대로(헌장 제7조) */
  const seedOwned = !!(cur && cur.on === true && /^클라우드 차례표/.test(String(cur.by || '')));
  if ((s.move || s.take) && seedOwned && String(cur.pc || '').toUpperCase() === pc) return { act: 'mark', why: `이미 ${pc}로 넘김` };
  if (s.take && seedOwned) { /* (11/17 정범님 19.2) take: 차례표가 켠 줄이면 소식 시간을 안 기다리고 옮김 — 아래 PC·판·같음 검사는 그대로 */ }
  else if (s.move && seedOwned) { const ref = Math.max(Date.parse(cur.beat || '') || +cur.beat || 0, Date.parse(cur.at || '') || +cur.at || 0); if (ref && now - ref < s.move * 3600e3) return { act: 'wait', why: `${cur.pc || '?'} 소식이 ${s.move}시간 안(옮기지 않음)` }; }
  else if (cur && (cur.on === true || cur.offAt || cur.on === false)) return { act: 'mark', why: cur.on === true ? `사람 값 있음(이미 ${cur.pc || '?'}로 넘김)` : '사람 값 있음(되돌린 적 있음 — 다시 켜지 않음)' };
  if (pc !== 'LOGGER' && !(solo && solo[pc])) return { act: 'wait', why: `${pc} 🔌 홀로 연결 등록 없음` };
  const d = (days || []).find((x) => x && x.tasks && x.tasks[s.task || s.k]);
  if (!d) return { act: 'wait', why: `${pc} 번외 하루 요약에 그 일이 없음` };
  const at = Date.parse(d.at || '') || 0; if (!at || now - at > FRESH_H * 3600e3) return { act: 'wait', why: `${pc} 번외 소식이 ${FRESH_H}시간 넘게 없음` };
  if (!verGE(d.ver, s.minV || '0.1.25')) return { act: 'wait', why: `${pc} 번외 ${d.ver || '?'} — ${s.minV} 이상 필요` };
  const P = (d.tasks[s.task || s.k] || {}).pass || {}; if (P.can !== true) return { act: 'wait', why: `아직 '넘길 수 있음' 아님(${String(P.why || '판정 없음').slice(0, 60)})` };
  if (s.needSame) { const T = d.tasks[s.task || s.k] || {}; if (!((+T.same || 0) >= s.needSame)) return { act: 'wait', why: `${pc} 번외가 운영과 같은 값을 아직 ${+T.same || 0}/${s.needSame}건${(T.why || {}).ext ? ' (출처 다름 ' + T.why.ext + ' — 번외가 운영 키를 못 받음)' : ''}` }; } /* (11/14 col2seed) */
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
