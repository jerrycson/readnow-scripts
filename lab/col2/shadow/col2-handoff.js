/* col2-handoff.js — (11/11 col2rep2 · 약속 38·48 '번외로 모두 바꾸기 ⑤ 일 하나씩 넘기기') 그림자 → 넘김 규칙 한 곳 (순수 · Node·브라우저·웹앱 같이)
 * 넘김 = 그 일을 운영 수집기(Tampermonkey)가 멈추고 번외가 운영 칸에 대신 씀 · 되돌리기 = 문서 한 칸(on:false)만 바꾸면 운영이 바로 다시 함
 *  · 설정 문서: app_settings/col2_handoff = { jobs: { <일>: { on, pc, at, by, beat, why } }, log: [ {k, on, pc, at, by} … 40줄 ] }
 *     on   = 넘김 켬(웹앱 ⚙ › 🔀 번외로 넘기기 [넘기기] 두 번 누름) · pc = 운영 칸에 쓰는 번외 PC(한 대만 — 두 PC가 같은 문서를 번갈아 쓰지 않게)
 *     beat = 그 PC 번외가 그 일을 마지막으로 해낸 때(웹앱이 30분에 한 번까지 적음) — beatMaxH 시간 넘게 소식이 없으면 운영 수집기가 스스로 다시 함(번외가 죽어도 일이 멈추지 않음)
 *  · 쓰는 길: 번외 도우미 → 그 PC 웹앱(이미 로그인)이 대신 씀 — 이 표의 col·idRe·fields 안만(그 밖은 웹앱이 거절) · 손님 정보 칸 없음
 *  · 운영 쪽 끄기: 수집기 본문(머리 그대로)이 같은 문서를 읽고 그 일의 그 부분만 건너뜀(아래 ops) */
(function (root) {
  'use strict';
  const JOBS = {
    kpipa: { name: '📚 출판 판매 통계(KPIPA) — 최근 7일 일별 표', col: 'mkt_kpipa', idRe: '^\\d{8}$', fields: ['date', 'onOff', 'bookType'], hist: true, everyH: 3, beatMaxH: 8,
      ops: "운영 kpipaJob의 '최근 7일 일별 표(판매채널별·도서유형별)'만 건너뜀 — 730일 빈 날 채우기·주제분류·더 가져오기는 운영 그대로",
      why: '두 PC 그림자 42줄 모두 같음(11/11 HOME 28 · JS-MAIN 14) · 운영과 같은 해석 함수(kpParse·kpFetch 글자 그대로)' },
  };
  const DOC = { col: 'app_settings', id: 'col2_handoff' };
  /* 그 일이 넘겨져 있나 — { on(켬) · pc(맡은 PC) · fresh(맡은 PC 소식이 beatMaxH 안) · live(on && fresh = 운영이 쉬어도 됨) } */
  function state(doc, k, t) { const J = JOBS[k]; const x = (doc && doc.jobs && doc.jobs[k]) || null; if (!J || !x || x.on !== true) return { on: false, pc: null, fresh: false, live: false };
    const beat = Date.parse(x.beat || '') || +x.beat || 0; const at = Date.parse(x.at || '') || +x.at || 0; const ref = Math.max(beat, at); /* 막 넘긴 때는 켠 시각부터 셈 */
    const fresh = !!ref && (t || Date.now()) - ref < J.beatMaxH * 3600e3; return { on: true, pc: String(x.pc || ''), fresh, live: fresh, beat: beat || null, at: at || null }; }
  /* 이 PC 번외가 운영 칸에 써도 되나 */
  const mine = (doc, k, pc) => { const s = state(doc, k); return s.on && !!pc && s.pc.toUpperCase() === String(pc).toUpperCase(); };
  /* 웹앱이 대신 쓸 때 — 그 일 · 그 칸 · 그 문서 이름 꼴 · 정한 칸만(그 밖 칸은 버림) */
  function writeOk(doc, it, pc) { const k = String((it && it.job) || ''); const J = JOBS[k]; if (!J) return { ok: false, why: '넘김 표에 없는 일' };
    if (!mine(doc, k, pc)) return { ok: false, why: '이 PC로 넘긴 일이 아님(⚙ 🔀 번외로 넘기기)' }; if (it.c !== J.col) return { ok: false, why: `${k}는 ${J.col} 칸에만` };
    if (!new RegExp(J.idRe).test(String(it.id || ''))) return { ok: false, why: '문서 이름 꼴이 다름' };
    const v = {}; for (const f of J.fields) if (it.v && it.v[f] !== undefined) v[f] = it.v[f]; if (!Object.keys(v).length) return { ok: false, why: '쓸 칸이 없음' }; return { ok: true, v }; }
  /* 넘김 후보 — 하루 요약(col2_jday 여러 날·여러 PC)에서 일마다 '넘길 수 있음'이 나온 날 수·표본·까닭 모를 다름 · 넘김 표(JOBS)에 쓰는 길이 있는 일만 [넘기기] 가능
   *  차례 = 같음이 오래(날 수) → 표본 많음 · pc = 표본이 가장 많은 PC */
  function candidates(jdays) { const by = {};
    for (const j of jdays || []) { const T = (j && j.tasks) || {}; for (const [k, s] of Object.entries(T)) { if (!s || !s.pass) continue; const o = by[k] || (by[k] = { k, name: s.name || k, days: new Set(), canDays: new Set(), n: 0, same: 0, un: 0, pcs: {} });
      o.days.add(j.d); o.n += +s.n || 0; o.same += +s.same || 0; o.un += +s.un || 0; if (s.pass.can) o.canDays.add(j.d); const p = o.pcs[j.pc] || (o.pcs[j.pc] = { n: 0, can: 0 }); p.n += +s.n || 0; if (s.pass.can) p.can++; } }
    return Object.values(by).map((o) => { const pc = Object.entries(o.pcs).sort((a, b) => b[1].can - a[1].can || b[1].n - a[1].n)[0]; return { k: o.k, name: o.name, days: o.days.size, canDays: o.canDays.size, n: o.n, same: o.same, un: o.un, pc: pc ? pc[0] : null, path: !!JOBS[o.k], can: o.canDays.size > 0 && o.un === 0 }; })
      .filter((o) => o.can).sort((a, b) => b.canDays - a.canDays || b.same - a.same); }
  const api = { JOBS, DOC, state, mine, writeOk, candidates };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Handoff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
