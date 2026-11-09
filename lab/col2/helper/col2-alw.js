/* col2-alw.js — 🟧✍ 번외 알라딘 '그림자 쓰기' 받기·견주기 (정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 쓰기 비교 뒤 하나씩 넘김' · LOGIN_PLAN.md ④-4)
 * 이 PC 운영 수집기(알라딘 일하는 탭 · rnC2al 다리)가 알라딘에 쓰기를 실제로 보낸 직후 POST /al/wfeed {by, w:[{id,k,at,in,rq,ok,http}]}로 알려 줌
 *   → 같은 입력(in)으로 번외가 '보낼 요청'을 만들기만 하고(shadow/col2-alw-core.js build) 운영이 보낸 요청(rq)과 칸마다 견줌
 *   → 결과는 col2_alw/<일>_<시각>_<번호> · col2_alw/day_<날짜>_<PC>에만(웹앱이 대신 씀 · 이 도우미는 Firestore에 직접 쓰지 않음)
 * **보내지 않음**: 이 파일에는 알라딘·바깥으로 가는 길(http·https·fetch·크롬 조종)이 하나도 없음 — tests/t_alw.js가 글자로·실제로(가짜 알라딘 받은 요청 0) 확인
 * 지킴: 로거 PC는 아예 안 받음(약속 0) · 출고 중엔 수집기가 알리지 않음(약속 0-1 — 다리가 rn-c2w-ok에 hold를 적음) · 받은 것도 칸 규칙 밖 값은 버림(reClean)
 *       같은 일 두 번(되풀이)·같은 송장 다른 주문(약속 10)은 번외라면 안 보냄 → 'refuse'로 따로 셈 */
'use strict';
const fs = require('fs'), path = require('path');
const W = require('../shadow/col2-alw-core.js');

function makeAlw(o) { const { HOME, note } = o; const cfg = () => o.cfg() || {}; const now = () => Date.now();
  const F = path.join(HOME, 'alw.json');
  let S = { days: {}, seen: {}, keys: {}, inv: {}, last: null };
  try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); if (v && typeof v === 'object') S = { ...S, ...v }; } catch (e) {}
  const save = () => { try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  const pcName = () => String(cfg().pc || require('os').hostname() || '');
  const isLogger = () => /^LOGGER/i.test(pcName());
  const on = () => !!cfg().on && cfg().alw !== false && !isLogger(); /* 번외 수집이 켜진 PC면 기본 켬(알라딘에 아무것도 안 보냄) · col2.json alw:false 로 끔 */
  const kday = (t) => new Date((t || now()) + 9 * 3600e3).toISOString().slice(0, 10);
  const stamp = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const P = () => ({ ...(cfg().alwPass || {}) });
  const repMs = () => (+(cfg().alwRepMin) || 10) * 60e3; /* 같은 일을 10분 안에 다시 = 되풀이 · 근거: 없음, 설정(col2.json alwRepMin)으로 바꿈 */
  const dayOf = (d, k) => { const D = S.days[d] || (S.days[d] = {}); return D[k] || (D[k] = W.dayNew()); };
  const okEv = (e) => e && typeof e === 'object' && /^[\w.-]{1,80}$/.test(String(e.id || '')) && W.KINDS[e.k] && Number.isFinite(+e.at) && Array.isArray(e.rq) && e.rq.length <= 20;

  /* 같은 송장 두 번 금지(약속 10) — 그 일에 든 송장(한 건·여러 건·CSV) 가운데 하나라도 다른 주문에 이미 썼거나, 한 일 안에서 두 주문에 같은 송장이면 막음(먼저 다 보고 나서 적음) */
  const invDup = (L) => { const seen = {}; for (const x of L) { const was = S.inv[x.invH]; if ((was && String(was) !== String(x.ono)) || (seen[x.invH] && seen[x.invH] !== String(x.ono))) return true; seen[x.invH] = String(x.ono); } return false; };
  function one(e) { const at = +e.at; const d = kday(at); const k = e.k; const st = dayOf(d, k); const input = W.pickIn(k, W.scrubIn(e.in || {})); let verdict, res = null, why = null, built = null;
    const key = W.keyOf(k, input); const prev = S.keys[key];
    if (prev && at - prev < repMs() && at >= prev) { verdict = 'refuse'; why = `같은 일을 ${Math.round((at - prev) / 1000)}초 만에 다시 — 번외라면 보내지 않음(되풀이 0)`; st.opRep++; }
    else if (invDup(W.invsOf(k, input))) { verdict = 'refuse'; why = '같은 송장을 다른 주문에 — 번외라면 보내지 않음(약속 10)'; st.dupInv++; }
    else { try { built = W.build(k, input, e.rq); res = W.compare(e.rq, built); verdict = res.verdict; } catch (er) { verdict = 'bad'; why = String(er.message || er).slice(0, 160); } S.keys[key] = at; for (const x of W.invsOf(k, input)) W.invCheck(S.inv, x.ono, x.invH); }
    st.n += verdict === 'refuse' ? 0 : 1; st[verdict === 'same' ? 'same' : verdict === 'diff' ? 'diff' : verdict === 'bad' ? 'bad' : 'refuse']++;
    const doc = { kind: k, t: W.KINDS[k].t, w: W.KINDS[k].w, at: new Date(at).toISOString(), pc: pcName(), ver: o.ver, verdict, why, in: input, op: (e.rq || []).map(W.reClean), c2: built, diffs: res ? res.diffs : [], opOk: e.ok == null ? null : !!e.ok, http: +e.http || null, sent: 0, by: 'col2-alw' };
    o.out('col2_alw', `${k}_${stamp(at)}_${String(e.id).slice(-6).replace(/[^\w-]/g, '_')}`, doc, false);
    S.last = { k, verdict, at: doc.at };
    if (verdict !== 'same') note(`✍ 그림자 쓰기 ${W.KINDS[k].t} — ${verdict === 'diff' ? `운영이 보낸 요청과 다름 ${res.diffs.length}칸(${res.diffs.slice(0, 2).map((x) => x.f).join('·')})` : verdict === 'refuse' ? why : '번외가 요청을 못 만듦: ' + why} · 번외는 보내지 않음`, { k: 'al', l: verdict === 'refuse' ? 'ok' : 'warn', m: '알라딘 쓰기' });
    return d; }
  function daySum(d) { const D = S.days[d] || {}; const kinds = {}; for (const k of Object.keys(W.KINDS)) { const x = { ...W.dayNew(), ...(D[k] || {}) }; kinds[k] = { ...x, pass: W.passOf(k, x, P()) }; } return kinds; }
  /* 운영 수집기가 알린 쓰기 받기 */
  function take(b) { b = b || {}; if (!on()) return { ok: true, on: false, ack: [] }; const L = Array.isArray(b.w) ? b.w.slice(0, 20) : []; const ack = [], days = new Set();
    for (const e of L) { if (!e || typeof e !== 'object' || !/^[\w.-]{1,80}$/.test(String(e.id || ''))) continue; ack.push(String(e.id)); if (S.seen[e.id]) continue; S.seen[e.id] = now();
      if (!okEv(e)) { const d = kday(+e.at || now()); const k = W.KINDS[e.k] ? e.k : null; if (k) dayOf(d, k).bad++; continue; } days.add(one(e)); }
    { const ids = Object.keys(S.seen); if (ids.length > 2000) ids.sort((a, c) => S.seen[a] - S.seen[c]).slice(0, ids.length - 2000).forEach((x) => delete S.seen[x]); }
    for (const [k0, t] of Object.entries(S.keys)) if (now() - t > 86400e3) delete S.keys[k0]; /* 되풀이 셈은 하루까지만(셈 칸 · 기록은 col2_alw에 그대로) */
    { const ks = Object.keys(S.inv); if (ks.length > 20000) ks.slice(0, ks.length - 20000).forEach((x) => delete S.inv[x]); }
    for (const d of days) o.out('col2_alw', `day_${d}_${pcName().replace(/[^\w-]/g, '_')}`, { day: d, pc: pcName(), ver: o.ver, kinds: daySum(d), sent: 0, at: new Date().toISOString() }, false);
    if (L.length) save(); return { ok: true, on: true, ack }; }
  /* 넘길 수 있는 일 — 지난 하루(한국 날짜)가 기준을 넘었고 오늘 지금까지 다름·못 만듦이 없음 */
  function hand() { const t = kday(), y = kday(now() - 86400e3); const DY = daySum(y), DT = daySum(t); return Object.keys(W.KINDS).filter((k) => DY[k].pass.ok && !DT[k].diff && !DT[k].bad); }
  function sum() { const d = kday(); const K = daySum(d); let n = 0, same = 0, diff = 0, bad = 0, refuse = 0; for (const x of Object.values(K)) { n += x.n; same += x.same; diff += x.diff; bad += x.bad; refuse += x.refuse; }
    return { on: on(), logger: isLogger(), day: d, n, same, diff, bad, refuse, pct: n ? Math.round((same / n) * 1000) / 10 : null, kinds: K, hand: hand(), last: S.last, sent: 0 }; }
  const line = () => { const s = sum(); return { on: s.on, n: s.n, same: s.same, diff: s.diff, bad: s.bad, refuse: s.refuse, pct: s.pct, hand: s.hand.map((k) => W.KINDS[k].t) }; };
  return { take, sum, line, on, S };
}
module.exports = { makeAlw };
