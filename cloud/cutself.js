/* ✂ 묶음 사진 판별 엔진 스스로 돌기 (spine2 · 2026-11-14 · 정범님 11/14 18:13 · 🔬 연구 V01 · NEW_STUDY 3번 '사람·Claude 없이 정해진 때 클라우드가 돌림')
 *  하루 한 번(/daily 10분 회차 안 · 한국 시각 hourKST 넘어) AI 없이:
 *   ① 재료 보기 — app_settings/cut_engine의 판별 기록(recent)·사람 확인 기록(recs) 줄 수·마지막 시각 · 어제와 견줌(줄었으면 그 판 기록은 쓰지 않고 '줄어듦'으로 남김 — 지우지 않음)
 *   ② 다시 배우기 — 공용 readnow-cutout-core.js(웹앱과 같은 셈)의 learn으로 방법마다(뒷면·앞면·책등) 확신 칸별 맞힌 몫 → 저절로 문턱·묻기 문턱
 *   ③ 자기 채점 — 엔진이 매긴 확신과 사람 확인 결과의 브라이어 점수(낮을수록 잘 맞힘) · 어제보다 나빠졌는지
 *   ④ 단계 — stageNext(그림자 → 안내 → 작게 실제 · 틀린 몫 5% 넘으면 내림) · 실제 저절로 넣기는 웹앱 설정 cutAutoOn이 켜져 있을 때만(이 회차는 기록만)
 *   ⑤ 멈춤 알아채기 — 판별이 7일 넘게 없으면 '재료 멈춤'(쓰는 사람이 없음 · 알림만 · 값·돈 무관)
 *   ⑥ 남기기 — app_settings/cut_engine(cal·stage·self·log에 한 줄 덧붙임) · eng_ledger/<날T시각>_cut(덧붙이기만) · research_pulse V01(진화 증거)
 *  지키는 것: 관찰·기록만 — 상품·사진·등록 줄을 바꾸지 않음 · 손님 칸 없음 · 사람이 넣은 설정을 덮지 않음(cut_engine의 cfg·사람 확인 기록은 그대로) */
'use strict';
const CS_V = '1.0.0';
const CS_DEF = { on: true, hourKST: 3, stallDays: 7, keepLog: 400 }; // 근거: 없음(첫 값) — 새벽 3시(다른 회차와 겹치지 않음) · 7일 판별 없으면 멈춤 · 일지 400줄
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
/* 브라이어 점수: (확신 − 맞음 0/1)² 평균 · 사람 확인 있는 것만 */
function brier(recs) { const L = (recs || []).filter((r) => r && r.conf != null && r.ok != null); if (!L.length) return null; let s = 0; for (const r of L) s += (r.conf - (r.ok ? 1 : 0)) ** 2; return Math.round((s / L.length) * 1000) / 1000; }
function makeCutSelf(D) {
  let busy = false; const get = async (p) => { const [c, d] = p.split('/'); const x = await D.C(c).doc(d).get(); return x.exists ? x.data() : null; };
  async function run(o) { o = o || {}; if (busy) return { skip: 'busy' }; busy = true; try { return await run0(o); } finally { busy = false; } }
  async function run0(o) { const t0 = Date.now(); const cfg = { ...CS_DEF, ...(((await get('app_settings/cut_self_cfg')) || {})) }; if (!cfg.on && !o.force) return { skip: 'off' };
    const nowMs = Date.now(); const today = kstDay(nowMs); const hr = +new Date(nowMs + 9 * 3600e3).toISOString().slice(11, 13);
    const E = (await get('app_settings/cut_engine')) || {}; const self0 = E.self || {}; if (!o.force && (self0.day === today || hr < cfg.hourKST)) return { skip: self0.day === today ? 'done today' : 'early' };
    const CUT = await D.core(); if (!CUT || !CUT.learn) return { skip: 'no core' };
    /* ① 재료 */ const recs = Array.isArray(E.recs) ? E.recs : []; const recent = Array.isArray(E.recent) ? E.recent : []; const lastAt = recent.length ? recent[0].at : null; const ageD = lastAt ? (nowMs - Date.parse(lastAt)) / 864e5 : null;
    const shrink = self0.nRecs != null && recs.length < self0.nRecs; const stall = ageD == null || ageD > cfg.stallDays;
    /* ② 다시 배우기 */ const cal = CUT.learn(recs); const all = (() => { const L = recs.filter((r) => r && r.ok != null); const ok = L.filter((r) => r.ok).length; return { n: L.length, acc: L.length ? ok / L.length : 0 }; })();
    /* ③ 자기 채점 */ const b = brier(recs); const worse = b != null && self0.brier != null && b > self0.brier + 0.02;
    /* ④ 단계 */ const cur = E.stage || 2; const nx = shrink ? { stage: cur, why: '확인 기록이 어제보다 줄어 단계는 그대로(기록 확인 필요)' } : CUT.stageNext(cur, all);
    /* ⑤ 고친 점·다음 한 수 */ const changes = []; for (const [m, c] of Object.entries(cal)) { const p = (E.cal || {})[m]; if (p && p.auto !== c.auto) changes.push(`${m} 저절로 문턱 ${p.auto} → ${c.auto}(확인 ${c.n}건)`); } if (nx.stage !== cur) changes.push(`단계 ${cur} → ${nx.stage}: ${nx.why}`);
    const saw = `판별 기록 ${recent.length}회 · 마지막 ${lastAt ? lastAt.slice(0, 16) : '없음'} · 사람 확인 ${recs.length}건(맞힌 몫 ${Math.round(all.acc * 1000) / 10}%) · 브라이어 ${b == null ? '-' : b}${shrink ? ' · ⚠ 확인 기록이 어제보다 줄어듦' : ''}${stall ? ` · ⏸ ${ageD == null ? '판별 기록 없음' : Math.floor(ageD) + '일째 판별 없음'}` : ''}${worse ? ' · ⚠ 자기 채점이 어제보다 나빠짐' : ''}`;
    const line = { at: new Date(nowMs).toISOString(), t: `🤖 클라우드 회차 — ${saw}${changes.length ? ' · 바뀜: ' + changes.join(' · ') : ' · 바뀐 것 없음'}` };
    const next = stall ? '사진 판별이 쌓이지 않음 — 매입·등록 때 뒷면 묶음 한 장부터' : all.n < 30 ? `사람 확인 ${30 - all.n}건 더 → 방법마다 첫 문턱` : nx.stage < 3 ? '확인 100건·맞힌 몫 98% → 단계 3 후보' : '단계 3 — 틀린 몫 5% 넘으면 스스로 내림';
    const fixed = [...(E.fixed || [])]; for (const c of changes) fixed.push(`${today} ${c}`);
    const self = { day: today, at: line.at, brier: b, nRecs: recs.length, nRuns: recent.length, stall, shrink, worse, ms: Date.now() - t0, v: CS_V, core: CUT.VERSION };
    const upd = { self, ...(shrink ? {} : { cal, stage: nx.stage, stageWhy: nx.why }), next, fixed: fixed.slice(-60), log: [...(E.log || []), line].slice(-cfg.keepLog) };
    await D.C('app_settings').doc('cut_engine').set({ ...upd, ...D.W() }, { merge: true });
    const rid = `${today}T${new Date(nowMs + 9 * 3600e3).toISOString().slice(11, 16).replace(':', '')}_cut`; await D.C('eng_ledger').doc(rid).set({ v: CS_V, kind: 'cut', at: line.at, day: today, by: o.by || 'engine', saw, changes, cal, stage: upd.stage || cur, self, ...D.W() });
    let pulse = null; if (D.pulse) { try { const rp = (await get('app_settings/research_pulse')) || {}; const p0 = (rp.studies && rp.studies.V01) || {}; const tr = (Array.isArray(p0.trend) ? p0.trend : []).map((t) => (Array.isArray(t) ? { d: t[0], v: t[1] } : t)).filter((t) => t && t.d !== today && typeof t.v === 'number').slice(-89); if (all.n) tr.push({ d: today, v: Math.round(all.acc * 1000) / 1000 });
      pulse = await D.pulse({ day: today, studies: { V01: { at: nowMs, metric: '묶음 사진 판별 — 사람 확인 맞힌 몫(0~1)', value: all.n ? Math.round(all.acc * 1000) / 1000 : null, trend: tr, changed: changes.length ? changes.join(' · ') : '바뀐 것 없음', note: `🤖 클라우드 스스로(AI 없음) — ${saw}` } } }, 'cutself'); } catch (e) { D.log('✂ 진화 증거 실패', e.message); } }
    D.log('✂ 묶음 사진 판별 스스로', saw); return { rid, changes: changes.length, stage: upd.stage || cur, brier: b, stall, pulse: pulse ? pulse.n : 0 }; }
  async function diag() { const E = (await get('app_settings/cut_engine')) || {}; return { v: E.v || null, at: E.at || null, stage: E.stage || null, stageWhy: E.stageWhy || null, tot: E.tot || null, cal: E.cal || null, self: E.self || null, next: E.next || null, nRecs: (E.recs || []).length, recent: (E.recent || []).slice(0, 10), log: (E.log || []).slice(-15), cfg: await get('app_settings/cut_self_cfg') }; }
  return { run, diag, _busy: () => busy };
}
module.exports = { CS_V, CS_DEF, brier, makeCutSelf };
