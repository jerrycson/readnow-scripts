/* col2-benchfull.js — (11/12 handoff3 · 리드 '🎯 벤치마킹: 숍 목록을 끝까지 읽어 운영과 같은 결과 · 같은 규칙으로 운영 칸에 쓰는 넘기는 길') 숍 목록 끝까지(로거만)
 * 읽기: 운영 benchUrl과 같은 꼴(간단히 보기 · 한 쪽 48개 · 등록순)으로 1쪽~끝 쪽 · 해석 = 운영 본체 benchParse·benchLastPage 글자 그대로(떼어 씀) · 쪽마다 알라딘 몫 한 장(ctx.pace — 로거 하루 몫 LOGGER.dayCap 안)
 * 고르기: 운영 app_settings/bench 대상 숍 중 끝 쪽이 JOBS.bench.maxPages(40) 이하인 작은 숍 · 우리 숍 뺌
 *   그림자(안 넘김) = 하루 shadowPerDay(기본 1)곳 · 같은 숍은 shadowDays(기본 2)일 안에 다시 안 읽음 → 운영 bench_state 지금 목록(조각)과 견줌(col2_jobs·col2_jday 'benchFull')
 *   넘김(⚙ 🔀 이 PC로) = 운영 규칙처럼 마지막 회차가 20시간 넘은 작은 숍 · 읽는 동안 운영의 판매자 잡기(prd_jobs/bclaim_<숍>)를 2분마다 잡음 → 운영 benchJob이 그 숍을 건너뜀
 *     끝까지 다 읽으면 그 회차(운영 prog.items 꼴)를 운영 칸 쓰기로 맡김 — 웹앱·클라우드가 운영 benchFinish를 글자 그대로 떼어 부름(shadow/col2-handoff.js benchCode)
 * 쓰기: 이 파일은 운영 칸에 직접 쓰지 않음(그림자는 col2_* · 넘김은 ctx.opOut → 웹앱·클라우드) */
'use strict';
const TK = require('../shadow/col2-tasks.js'); const HOF = require('../shadow/col2-handoff.js');
const kday = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
const benchPath = (sc, page) => `/shop/usedshop/wshopitem.aspx?SC=${sc}&ViewType=Simple&ViewRowsCount=48&SortOrder=6&page=${page}`; /* 운영 benchUrl(sc, page, 48)과 같은 꼴 */

function makeBenchFull(o) {
  const { ctx, S, save, record, own, now } = o; const J = HOF.JOBS.bench; const T = TK.byK.benchFull;
  const C = () => ((ctx.cfg() || {}).benchFull || {}); const lg = () => ctx.kind() === 'logger';
  const mine = () => !!(ctx.handed && ctx.handed('bench') && ctx.opOut);
  const B = () => S.bf || (S.bf = { cur: null, done: {}, day: '', dayN: 0, last: null });
  const on = () => lg() && T && (ctx.cfg() || {}).on !== false && C().on !== false && TK.plan(ctx.kind(), ctx.cfg() || {}).includes('benchFull');
  const meta = (sc) => { const r = ctx.want('bench_state', String(sc)); return r && r.have ? { v: r.v || {}, have: true } : { have: false }; };
  /* 고를 숍 — 대상 숍 중 작은 숍(끝 쪽 maxPages 이하 · 조각 2개 이하) */
  function pick() { const b = B(); if (b.day !== kday()) { b.day = kday(); b.dayN = 0; } const r = ctx.want('app_settings', 'bench'); if (!(r && r.have)) return null;
    const maxP = Math.min(J.maxPages, +C().maxPages || J.maxPages); const hand = mine(); if (!hand && b.dayN >= (C().shadowPerDay == null ? 1 : +C().shadowPerDay)) return null;
    const L = []; for (const t of ((r.v && r.v.targets) || [])) { const sc = String((t && t.sc) || ''); if (!/^\d{1,10}$/.test(sc) || t.on === false || own().includes(sc)) continue; const m = meta(sc); if (!m.have) continue; const v = m.v || {};
      const lp = +v.lastPage || 0; if (!lp || lp > maxP || (+v.chunks || 0) > 2) continue; if (v.prog) continue; /* 운영이 그 숍 회차를 하는 중 */
      const doneAt = b.done[sc] || 0; if (hand) { const end = Date.parse(v.endAt || '') || 0; if (end && now() - end < 20 * 3600e3) continue; if (doneAt && now() - doneAt < 20 * 3600e3) continue; }
      else if (doneAt && now() - doneAt < (C().shadowDays == null ? 2 : +C().shadowDays) * 864e5) continue;
      L.push({ sc, name: v.name || sc, lp, endAt: v.endAt || null, chunks: +v.chunks || 0 }); }
    L.sort((a, x) => a.lp - x.lp); return L[0] || null; }
  const claim = (sc, onOff) => { if (!mine()) return; ctx.opOut('bench', 'prd_jobs', 'bclaim_' + sc, { claim: { on: onOff } }); B().cur && (B().cur.claimAt = now()); };
  function stop(why, v) { const b = B(); const c = b.cur; if (!c) return; if (c.hand) claim(c.sc, false); record(T, { key: c.sc }, c.sc, v || 'fail', [], { why, rows: [] }); b.done[c.sc] = now(); b.cur = null; b.last = { sc: c.sc, at: now(), why }; save(true); }
  /* 하나 하기 → null(할 것 없음 — 다른 일에 차례) · { did, rest, why } */
  async function step() { if (!on()) return null; const b = B(); let c = b.cur;
    if (!c) { const p = pick(); if (!p) return null; c = b.cur = { sc: p.sc, name: p.name, page: 1, last: null, items: [], have: {}, startedAt: new Date().toISOString(), seenEnd: p.endAt, chunks: p.chunks, hand: mine(), fails: 0 }; if (!c.hand) b.dayN++;
      ctx.note(`🎯 숍 목록 끝까지 — '${p.name}'(끝 쪽 ${p.lp}쪽) 읽기 시작 · ${c.hand ? '넘긴 일(운영 판매자 잡기 신호를 잡음)' : '그림자(운영 목록과 견줌)'}`, { k: 'read', m: '🎯 벤치마킹' }); if (c.hand) claim(c.sc, true); save(true); }
    if (c.hand && !mine()) { stop('넘김이 풀림 — 운영 수집기가 다시 함', 'skip'); return { did: true }; }
    if (c.hand && now() - (c.claimAt || 0) > 2 * 60e3) claim(c.sc, true); /* 운영 benchClaim은 4분 신호가 끊기면 다른 PC가 이어받음 → 2분마다 */
    if (c.last == null || c.page <= c.last) { /* 쪽 읽기 */ const p = benchPath(c.sc, c.page); if (!TK.ALLOW.some((re) => re.test(p))) { stop('정한 주소 꼴이 아님'); return { did: true }; }
      const pc = ctx.pace.check(); if (!pc.ok || pc.waitMs > 0) return { did: false, rest: pc.ok ? pc.waitMs + 50 : Math.min((pc.retryMs || 60e3) + 500, 30 * 60e3), why: pc.why || '차례 기다림' };
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { return { did: false, rest: 10e3, why: '작업 창 준비 실패: ' + e.message }; }
      const tk = await ctx.pace.take(); if (!tk.ok) return { did: false, rest: 5000, why: tk.why };
      const r = await br.readJob(ctx.aladin + p, 'L.benchPage', core.src, 30) || { ok: false, why: '빈 응답' };
      if (!r.ok || !r.page || !Array.isArray(r.page.rows)) { if (!r.needLogin) ctx.pace.fail(r.kind || 'error'); if (++c.fails >= 3) { stop(`${c.page}쪽을 세 번 못 읽음 — ${r.why || '해석 실패'} · 끝까지 못 읽은 회차는 쓰지 않음(운영처럼)`); return { did: true }; } save(); return { did: false, rest: 30e3, why: `${c.page}쪽 못 읽음 — 다시` }; }
      ctx.pace.ok(); c.fails = 0; const L = r.page.rows;
      if (c.page === 1) { const lp = +r.page.last || (L.length ? 1 : 0); if (!L.length) { stop('1쪽에 상품이 없음(숍 화면 모양이 다르거나 빈 숍)'); return { did: true }; } const maxP = Math.min(J.maxPages, +C().maxPages || J.maxPages);
        if (lp > maxP) { stop(`끝 쪽 ${lp}쪽 — 큰 숍(${maxP}쪽 넘음)은 운영 그대로`, 'skip'); return { did: true }; } c.last = lp; }
      for (const x of L) { const id = String(x.id || ''); if (!/^\d{1,13}$/.test(id) || c.have[id]) continue; c.have[id] = 1; c.items.push([id, x.p ?? null, x.g || null, x.t || '', x.isbn || null, x.ym || null, x.pl ?? null, x.low ? 1 : 0, c.page, x.uc || null, x.au || null, x.cov || null]); } /* 운영 prog.items 한 줄 꼴(page48 = 쪽 · 한 쪽 48개) */
      if (c.items.length > J.maxItems) { stop(`상품 ${c.items.length}개 — ${J.maxItems}개 넘는 숍은 운영 그대로`, 'skip'); return { did: true }; }
      c.page++; if (c.page > c.last) c.readEndAt = new Date().toISOString(); save(); return { did: true }; }
    /* 다 읽음 → 운영 목록(조각) 받아 견줌 · 넘김이면 운영 칸 쓰기 맡김 */
    const want = []; for (let k = 0; k < c.chunks; k++) want.push(ctx.want('bench_chunk', `${c.sc}.${k}`)); const m = meta(c.sc);
    if (want.some((g) => !(g && g.have)) || !m.have) { if (!c.waitAt) c.waitAt = now(); if (now() - c.waitAt < 15 * 60e3) return { did: false, rest: 5000, why: `🎯 '${c.name}' 운영 목록 받는 중` }; }
    const cmp = HOF.benchCmp(c.items, want.map((g) => (g && g.have ? g.v : null)), { opsEnd: (m.v && m.v.endAt) || c.seenEnd, myAt: c.readEndAt || new Date().toISOString(), gapH: C().gapH });
    const sum = `상품 ${cmp.n}개(운영 지금 목록 ${cmp.opsN}개) · 같음 ${cmp.same} · 값·등급·배지 다름 ${cmp.chg} · 번외만 봄 ${cmp.onlyMine} · 운영만 봄 ${cmp.onlyOps}${cmp.gapH != null ? ` · 운영 회차와 ${cmp.gapH}시간 차이` : ''}`;
    record(T, { key: c.sc }, c.sc, want.some((g) => !(g && g.have)) ? 'noprod' : cmp.verdict, cmp.reasons, { rows: cmp.rows, why: sum });
    if (c.hand && mine()) { const run = { sc: c.sc, name: c.name, day: kday(Date.parse(c.startedAt)), startedAt: c.startedAt, readEndAt: c.readEndAt || null, lastPage: c.last, pages: c.page - 1, items: c.items, seenEnd: c.seenEnd || null };
      if (ctx.opOut('bench', 'bench_state', c.sc, { run })) ctx.note(`🔀 넘긴 일 🎯 '${c.name}' — 끝까지 읽은 회차(상품 ${c.items.length}개 · ${c.last}쪽)를 운영 칸 쓰기로 맡김(웹앱·클라우드가 운영 benchFinish 그대로)`, { k: 'read', m: '🔀 넘김' });
      if (ctx.beat) ctx.beat('bench'); }
    b.done[c.sc] = now(); b.cur = null; b.last = { sc: c.sc, at: now(), verdict: cmp.verdict, why: sum }; save(true); return { did: true }; }
  const view = () => { const b = B(); const c = b.cur; return { on: !!on(), hand: mine(), cur: c ? { sc: c.sc, name: c.name, page: c.page, last: c.last, n: c.items.length, hand: c.hand } : null, last: b.last || null, dayN: b.dayN || 0 }; };
  return { step, view, pick };
}
module.exports = { makeBenchFull, benchPath };
