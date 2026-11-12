/* col2-ag.js — 🔄 번외 수집기 목표·방법 장부 (adapt10 11/12 밤 · 정범님 '상대는 방식을 바꾼다는 전제' · 약속 64)
 * 운영 공용 readnow-adapt-core.js(◆AG 틀 · agRecord·agAdapt·agFill…)를 그대로 받아 씀(CORE_NODE · 복사본 없음) — 받기 전 기록은 메모리에 잠깐 모아 둠(200개까지)
 * 엔진마다 장부 하나(c2_<엔진>): 회차 = 모은 시도 40번 또는 10분 · 길(방법)마다 성적 · 칸마다 길 성적(agFill) · 떨어지면 바뀐 것 찾기 줄(바뀜·채택·되돌림·회복)
 * 저장: 이 PC 파일 <HOME>/col2-ag.json · 15분마다 col2_adapt/<PC>{pc, at, ver, g, lines}(쓰기 막이 col2_* 그대로) → 클라우드가 30분마다 🔄 엔진 적응 상태·발견 모음으로 옮김
 * 지킴: 읽기 성적만 — 일의 차례·속도·로그인·네이버 와이파이·로거 규칙은 바꾸지 않음 · 손님 정보·비밀값은 남기지 않음(원문 표본 없음 · 까닭 글은 120자) */
'use strict';
const fs = require('fs'), path = require('path');
const SEED = {
  al: { label: '번외 알라딘 화면 읽기', goal: '그림자 일마다 알라딘 공개 화면을 읽어 칸을 얻음', unit: '번', target: 0.8 },
  dyn: { label: '번외 그려 읽기(구매자 분포 등)', goal: '상품 화면을 그려 지연 칸까지', unit: '번', target: 0.7 },
  ext: { label: '번외 바깥 시세 읽기', goal: 'ISBN마다 바깥 출처(교보·국중·예스24 등) 값', unit: '번', target: 0.6 },
  nb: { label: '번외 새상품 없는 시세', goal: '새상품 없는 책의 시세 화면', unit: '번', target: 0.7 },
  kp: { label: '번외 KPIPA 읽기', goal: '출판 유통 정보', unit: '번', target: 0.7 },
  y24_ops: { label: '번외 예스24 운영 읽기', goal: '예스24 판매관리 API를 배운 조건으로 읽음(주문·상품)', unit: '번', target: 0.9, methods: [{ id: 'tpl', label: '배운 조건으로 바로 부름' }, { id: 'learn', label: '화면을 열고 [조회]로 조건 다시 배움' }], champ: 'tpl' },
  nv_ops: { label: '번외 네이버 커머스API 읽기', goal: '주문 변경·상품·문의·정산 읽기(로거 PC · 와이파이 규칙 그대로)', unit: '번', target: 0.9 },
};
function makeAg(o) { o = o || {}; const now = () => Date.now(); const F = path.join(o.home || '.', 'col2-ag.json'); const ROUND_N = o.roundN || 40, ROUND_MS = o.roundMs || 10 * 60e3, OUT_MS = o.outMs || 15 * 60e3;
  const rd = () => { try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const S = Object.assign({ g: {}, lines: [], outAt: 0 }, rd()); const P = {}; let pend = 0;
  const A = () => { try { const a = o.A && o.A(); return a && a.agRecord && a.agFill ? a : null; } catch (e) { return null; } };
  const box = (eng) => (P[eng] = P[eng] || { t0: now(), n: 0, m: {}, fl: {} });
  /* 한 번 읽은 결과 — mid = 길 · ok = 목표를 얻었나 · cost = 요청 수 · why = 못 읽은 까닭(짧게) */
  function obs(eng, mid, r) { try { if (!eng || !mid || !r) return; if (pend > 4000) return; const B = box(eng); const z = (B.m[mid] = B.m[mid] || [0, 0, 0, 0]); const n = Math.max(0, +r.n || 1); z[0] += n; z[1] += Math.min(n, Math.max(0, +r.ok || 0)); z[2] += r.cost != null ? Math.max(0, +r.cost || 0) : n; z[3] += Math.max(0, +r.ms || 0); B.n += n; pend += n; if (r.why && !(+r.ok > 0)) B.why = String(r.why).replace(/01[016789]-?\d{3,4}-?\d{4}/g, '＊').slice(0, 120); } catch (e) {} }
  /* 칸마다 길 — fields = { 칸: { 길: 값|null } } (값은 세기만 하고 남기지 않음) */
  function fill(eng, fields, x) { const a = A(); const B = box(eng); if (!a || !a.agFillTally) { if ((B.raw = B.raw || []).length < 50) B.raw.push([fields, (x && x.main) || null]); return; } /* 틀 받기 전엔 50개까지 모아 둠 */ try { for (const [f0, m0] of B.raw || []) a.agFillAdd(B.fl, a.agFillTally(f0, { main: m0 }).t); B.raw = null; a.agFillAdd(B.fl, a.agFillTally(fields, { main: (x && x.main) || null }).t); } catch (e) {} }
  function close(force) { const a = A(); if (!a) return 0; let k = 0; const t = now();
    for (const eng of Object.keys(P)) { const B = P[eng]; if (!force && B.n < ROUND_N && t - B.t0 < ROUND_MS) continue; delete P[eng]; pend = Math.max(0, pend - B.n); k++;
      const id = 'c2_' + eng; const g = a.agEnsure(S.g, id, SEED[eng] || { label: '번외 ' + eng, goal: '', unit: '번' });
      for (const [mid, z] of Object.entries(B.m)) a.agRecord(g, mid, { n: z[0], ok: z[1], cost: z[2], ms: z[3] }, t);
      for (const [f0, m0] of B.raw || []) a.agFillAdd(B.fl, a.agFillTally(f0, { main: m0 }).t); if (Object.keys(B.fl).length) a.agFill(g, B.fl, t);
      const res = a.agAdapt(g, { now: t, info: B.why ? { why: B.why } : null }); for (const L of res.lines || []) S.lines.push(L); }
    if (S.lines.length > 60) S.lines.splice(0, S.lines.length - 60);
    if (k) { try { fs.writeFileSync(F, JSON.stringify(S)); } catch (e) {} } return k; }
  /* 15분마다 col2_adapt/<PC> 로 — o.out(c, id, v) = 웹앱 대신 쓰기(쓰기 막이 col2_* 그대로) */
  function tick(force) { const k = close(force); if (!o.out) return k; if (!force && now() - (S.outAt || 0) < OUT_MS) return k; if (!Object.keys(S.g).length) return k;
    S.outAt = now(); const pc = String((o.pc && o.pc()) || 'PC').replace(/[^\w가-힣-]/g, '_').slice(0, 40); try { o.out('col2_adapt', pc, { pc, at: new Date().toISOString(), ver: o.ver || null, n: Object.keys(S.g).length, gs: JSON.stringify(S.g), lines: S.lines.slice(-60).map((x) => ({ at: x.at, src: '엔진', eng: x.eng, engL: x.engL, kind: x.kind, t: x.t, ...(x.ev ? { ev: JSON.stringify(x.ev).slice(0, 400) } : {}) })) }); /* (0.1.44) 웹앱 대신 쓰기(웹 SDK)는 배열 안 배열을 거절 — 장부 몸통은 글(gs)로 */ } catch (e) {} try { fs.writeFileSync(F, JSON.stringify(S)); } catch (e) {} return k; }
  function view() { const a = A(); return { ready: !!a, ver: a && a.VERSION, pend, wait: Object.fromEntries(Object.entries(P).map(([k, B]) => [k, B.n])), goals: a ? Object.fromEntries(Object.entries(S.g).map(([k, g]) => [k, a.agSummary(g)])) : null, lines: S.lines.slice(-5), outAt: S.outAt ? new Date(S.outAt).toISOString() : null }; }
  return { obs, fill, close, tick, view, S, P };
}
/* 한 PC에 하나 — 도우미가 makeAg로 만들어 set으로 놓으면 다른 모듈(col2-jobs·col2-y24·col2-nv)이 get()으로 씀(못 받았으면 아무것도 안 함) */
let ONE = null;
module.exports = { makeAg, SEED, set: (x) => { ONE = x; return x; }, get: () => ONE };
