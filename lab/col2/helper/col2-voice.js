/* col2-voice.js — (정범님 11/10) 🗣 판매자 구매평·문의 글 전부 모으기(번외 · 로거 고유 일)
 *  누가: 로거 PC만 — 운영 '판매자 평가(revTop·revAll)'·번외 '숍 요약·숍 구매 평가'가 로거 고유 일이라 같은 원칙(사무실 PC는 이어받지 않음 · 겹치지 않음)
 *  무엇: 판매자마다 ① 구매 만족도 글 전부(쪽 넘기며 끝까지 → 그 뒤엔 새 글만) ② 숍 첫 화면에서 찾은 '판매자에게 문의하기' 목록 글 전부(로그인 화면이면 건너뜀 · 로그인하지 않음)
 *  어디에: col2_voice/<숍>_<r|q><차례 4자리>(조각 · 글 200개 또는 40만 자에서 끊음 · 덮어쓰지 않고 새 조각) · col2_voice_s/<숍>(판매자 요약 · 웹앱 판매자 상세가 읽음) · col2_voice_run/<PC>(진행·비중)
 *  아이디: 앞 2자 + '***'만(해석 단계에서 가림) · 우리 숍(OWN_SC)은 열지 않음 · 속도는 그림자 일과 같은 PACE를 함께 씀
 *  판매자 목록: 웹앱이 운영 sellers 칸에서 숍 번호·이름·평가 수만 줄여 넘김(lists sellers — 손님 연결·연락처 없음) + 중고 첫 쪽에서 본 숍 */
'use strict';
const fs = require('fs'), path = require('path');
const VC = require('../shadow/col2-voice-core.js');
const kday = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);

function makeVoice(ctx) {
  const F = path.join(ctx.home, 'voice.json'); const now = () => Date.now();
  let S = { since: 0, sellers: {}, order: [], cur: null, burst: 0, day: kday(), vt: 0, ot: 0, listAt: 0, listAfter: null, listEnd: false, pages: 0, wrote: 0 };
  try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); if (v && typeof v === 'object') S = { ...S, ...v }; } catch (e) {}
  let dirty = 0; const save = (force) => { if (!force && now() - dirty < 3000) return; dirty = now(); try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  const C = () => ({ ...VC.CFG, ...((ctx.cfg() || {}).voiceCfg || {}) });
  const own = () => (ctx.OWN_SC || []).map(String);
  /* 켜짐 — 로거 PC만 · col2.json jobs.voice:false 면 끔 · 시험에선 jobs.voice:true 일 때만 */
  const on = () => { const c = ctx.cfg() || {}; if (ctx.kind() !== 'logger' || c.on === false || c.voice === false) return false; return ctx.test ? c.voice === true : true; };
  const sel = (sc) => S.sellers[sc] || (S.sellers[sc] = { sc, name: null, n: null, r: { p: 1, done: false, ring: [], buf: [], seq: 0, n: 0, good: 0, mid: 0, bad: 0, first: null, last: null, incAt: 0, last1: null }, q: { state: 'find', path: null, p: 1, done: false, ring: [], buf: [], seq: 0, n: 0, sec: 0, ans: 0, findAt: 0, incAt: 0 }, at: 0 });
  /* 판매자 더하기 — 웹앱 목록 [{sc,name,n}] · 중고 첫 쪽 숍 번호 */
  function feed(list, from) { let n = 0; for (const x of list || []) { const sc = String((x && x.sc) || x || ''); if (!/^\d{1,10}$/.test(sc) || own().includes(sc)) continue; const had = !!S.sellers[sc]; const s = sel(sc); if (x && typeof x === 'object') { if (x.name) s.name = String(x.name).slice(0, 40); if (x.n != null && Number.isFinite(+x.n)) s.n = +x.n; } if (!had) { S.order.push(sc); n++; } }
    if (n) { if (!S.since) S.since = now(); /* 큰 판매자 먼저(글이 많은 곳부터) · 처음 넣은 차례는 그대로 */ save(); if (from !== 'quiet') ctx.note(`🗣 판매자 ${n}곳을 구매평·문의 모으기 차례에 넣음(${from || '목록'} · 모두 ${S.order.length}곳)`, { k: 'read', m: '🗣 판매자 목소리' }); } return n; }
  function listTake(L, end, lastId) { const n = feed((L || []).map((d) => ({ sc: d.v && d.v.sc || String(d.id || '').replace(/^sc_/, ''), name: d.v && d.v.name, n: d.v && d.v.n })), '운영 판매자 목록'); const last = lastId || ((L || []).slice(-1)[0] || {}).id; if (last) S.listAfter = String(last); if (end) { S.listEnd = true; S.listAfter = null; } S.listAt = now(); save(); return n; }
  /* 웹앱에 판매자 목록 부탁 — listEveryH마다(다 받으면 처음부터 다시 · 새 판매자만 더해짐) */
  function listWant() { if (!on()) return null; const c = C(); if (S.listAt && now() - S.listAt < (S.listEnd ? c.listEveryH * 3600e3 : 60e3)) return null; if (S.listEnd) { S.listEnd = false; S.listAfter = null; } return { c: 'sellers', n: c.listN, after: S.listAfter || null }; }

  /* 이번 차례 판매자 — burst쪽씩 돌아가며(큰 판매자 하나가 모든 차례를 먹지 않게) · 할 일이 있는 판매자만 */
  const due = (s) => { const c = C(); const r = s.r, q = s.q; const H = c.incEveryH * 3600e3; if (!r.done) return 'r'; if (q.state === 'find' || ((q.state === 'none' || q.state === 'login') && now() - q.findAt > c.findEveryD * 864e5)) return 'qf'; if (q.state === 'ok' && !q.done) return 'q';
    /* 처음 끝까지가 다 끝난 뒤의 새 글 찾기 — 오래된 쪽 먼저 */ const rd = now() - r.incAt >= H, qd = q.state === 'ok' && now() - q.incAt >= H; if (rd && qd) return r.incAt <= q.incAt ? 'r' : 'q'; return rd ? 'r' : qd ? 'q' : null; };
  function pick() { const c = C(); if (S.cur && S.sellers[S.cur] && S.burst < c.burst && due(S.sellers[S.cur])) return S.cur;
    if (S.cur) { const s = S.sellers[S.cur]; if (s) flushAll(s); } S.burst = 0; const L = S.order; if (!L.length) return null; const i0 = Math.max(0, L.indexOf(S.cur) + 1);
    for (let j = 0; j < L.length; j++) { const sc = L[(i0 + j) % L.length]; const s = S.sellers[sc]; if (s && !own().includes(sc) && due(s)) { S.cur = sc; return sc; } } S.cur = null; return null; }
  const pending = () => S.order.some((sc) => S.sellers[sc] && due(S.sellers[sc]));
  /* 비중 — 오늘 쓴 차례로 견줌 */
  function share(others) { const known = S.order.length; const done = S.order.filter((sc) => VC.sellerDone(S.sellers[sc])).length; return VC.shareOf({ others, known, done, since: S.since, now: now() }, C()); }
  function wantTurn(others) { if (!on() || !pending()) return false; if (S.day !== kday()) { S.day = kday(); S.vt = 0; S.ot = 0; } return VC.turnIsVoice(S.vt, S.ot, share(others).share); }
  const otherTurn = () => { if (S.day !== kday()) { S.day = kday(); S.vt = 0; S.ot = 0; } S.ot++; };

  /* 조각 쓰기 — 글이 flushN개(또는 글자 한도)가 되면 차례 번호 조각(덮어쓰지 않음) · 그 전 남은 글은 꼬리 문서(<숍>_<r|q>tail · 판매자 차례가 끝날 때만 바꿔 씀)에 */
  function shard(s, kind) { const b = kind === 'r' ? s.r : s.q; if (!b.buf.length) return; b.seq++; const id = VC.shardId(s.sc, kind, b.seq);
    ctx.out('col2_voice', id, { sc: s.sc, kind, seq: b.seq, n: b.buf.length, items: b.buf, at: new Date().toISOString(), pc: ctx.pc(), ver: VC.VERSION }); S.wrote++; b.buf = []; b.tailN = 0; tail(s, kind, true); }
  function tail(s, kind, force) { const b = kind === 'r' ? s.r : s.q; if (!force && (b.tailN || 0) === b.buf.length) return; b.tailN = b.buf.length;
    ctx.out('col2_voice', `${s.sc}_${kind}tail`, { sc: s.sc, kind, seq: 'tail', n: b.buf.length, items: b.buf, at: new Date().toISOString(), pc: ctx.pc(), ver: VC.VERSION }); S.wrote++; }
  function flushAll(s) { for (const k of ['r', 'q']) { const b = s[k]; if (VC.needFlush(b.buf, C())) shard(s, k); else tail(s, k); } summary(s); }
  function summary(s) { const r = s.r, q = s.q; ctx.out('col2_voice_s', s.sc, { sc: s.sc, name: s.name || null, n: s.n, at: new Date().toISOString(), pc: ctx.pc(), ver: VC.VERSION,
    r: { n: r.n, docs: r.seq, done: !!r.done, first: r.first, last: r.last, good: r.good, mid: r.mid, bad: r.bad, page: r.p, lastPage: r.last1 },
    q: { n: q.n, docs: q.seq, done: !!q.done, state: q.state, path: q.path, sec: q.sec, ans: q.ans, page: q.p, shown: q.shown == null ? null : q.shown } }); }
  function runDoc(sh) { ctx.out('col2_voice_run', String(ctx.pc()).replace(/[^\w.-]/g, '_').slice(0, 100), { pc: ctx.pc(), at: new Date().toISOString(), ver: VC.VERSION, sellers: S.order.length, done: S.order.filter((sc) => VC.sellerDone(S.sellers[sc])).length, pages: S.pages, wrote: S.wrote, since: S.since ? new Date(S.since).toISOString() : null, day: S.day, vt: S.vt, ot: S.ot, share: sh || null }); }

  /* 한 쪽 읽기 → { did, rest, why } — 쿠키 없이(운영 해석 함수 · 번외 해석 함수) */
  async function step(others) { const sc = pick(); if (!sc) return { did: false, why: '🗣 모을 판매자 없음', rest: 15e3 }; const s = S.sellers[sc]; const what = due(s); const c = C();
    let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { return { did: false, rest: 10e3, why: '작업 창 준비 실패: ' + e.message }; }
    const tk = await ctx.pace.take(); if (!tk.ok) return { did: false, rest: 5000, why: tk.why };
    S.vt++; S.burst++; S.pages++; let p, pn;
    if (what === 'r') { p = VC.surveyPath(sc, s.r.done ? 1 + (s.r.incP || 0) : s.r.p); pn = 'S.parseSurveyPage'; }
    else if (what === 'qf') { p = `/shop/usedshop/wshopitem.aspx?SC=${sc}`; pn = 'V.findQnaLink'; }
    else { p = VC.qnaPage(s.q.path, s.q.done ? 1 + (s.q.incP || 0) : s.q.p); pn = 'V.parseQnaPage'; }
    if (!p || (what === 'r' && !VC.surveyPathOk(p))) { s.q.state = what === 'q' ? 'none' : s.q.state; save(); return { did: true, why: '정한 주소 꼴이 아님' }; }
    const r = await br.readJob(ctx.aladin + p, pn, core.src, 30) || { ok: false, why: '빈 응답' }; if (r.ok) ctx.pace.ok(); else if (!r.needLogin) ctx.pace.fail(r.kind || 'error');
    const lab = s.name || sc;
    if (!r.ok) { if (r.needLogin) { if (what === 'r') { s.r.done = true; s.r.incAt = now(); } else { s.q.state = 'login'; s.q.findAt = now(); } ctx.note(`🗣 ${lab} — 로그인 없이는 못 보는 화면(번외는 로그인하지 않음) → 건너뜀`, { k: 'read', m: '🗣 판매자 목소리' }); summary(s); save(); return { did: true }; }
      S.burst = c.burst; save(); return { did: true, why: r.why || '못 읽음' }; } /* 못 읽으면 다음 판매자로(같은 쪽은 다음 차례에 다시) */
    const pg = r.page;
    if (what === 'qf') { s.q.findAt = now(); if (pg && pg.path && VC.qnaPathOk(pg.path)) { s.q.state = 'ok'; s.q.path = pg.path; s.q.shown = pg.n; ctx.note(`🗣 ${lab} — '판매자에게 문의하기' 목록을 찾음(${pg.path}${pg.n != null ? ' · 보이는 글 ' + pg.n : ''})`, { k: 'read', m: '🗣 판매자 목소리' }); }
      else { s.q.state = 'none'; } summary(s); save(); return { did: true }; }
    if (what === 'r') { const rows = VC.revRows(pg); const lp = Math.min(c.maxPagesSeller, (pg && pg.lastPage) || 1); s.r.last1 = lp; const { fresh, seen } = VC.takeNew(rows, s.r.ring, VC.revKey, c.ringN);
      for (const x of fresh) { s.r.buf.push(x); s.r.n++; if (x.r === 'good') s.r.good++; else if (x.r === 'mid') s.r.mid++; else if (x.r === 'bad') s.r.bad++; if (!s.r.first || x.d < s.r.first) s.r.first = x.d; if (!s.r.last || x.d > s.r.last) s.r.last = x.d; }
      if (!s.r.done) { if (!rows.length || s.r.p >= lp) { s.r.done = true; s.r.incAt = now(); s.r.incP = 0; ctx.note(`🗣 ${lab} — 구매평 처음 글까지 다 모음(${s.r.n.toLocaleString()}건 · ${s.r.p}쪽)`, { k: 'read', l: 'ok', m: '🗣 판매자 목소리' }); } else s.r.p++; }
      else { /* 새 글만 — 이미 본 글이 나오거나 끝 쪽이면 멈춤 */ if (seen || !fresh.length || (s.r.incP || 0) + 1 >= lp) { s.r.incAt = now(); s.r.incP = 0; } else s.r.incP = (s.r.incP || 0) + 1; }
      if (VC.needFlush(s.r.buf, c)) shard(s, 'r'); else if (s.r.done && !s.r.incP) flushAll(s); }
    else { const rows = VC.qnaRows(pg); const lp = Math.min(c.qnaMaxPages, (pg && pg.lastPage) || 1); const { fresh, seen } = VC.takeNew(rows, s.q.ring, VC.qnaKey, c.ringN);
      for (const x of fresh) { s.q.buf.push(x); s.q.n++; if (x.sec) s.q.sec++; if (x.ans) s.q.ans++; }
      if (!rows.length && pg && pg.n > 3 && s.q.p === 1 && !s.q.n) ctx.note(`🗣 ${lab} — 문의 목록 화면 모양을 못 읽음(줄 ${pg.n}개 · 글 0) — 해석을 고쳐야 함`, { k: 'read', l: 'warn', m: '🗣 판매자 목소리' });
      if (!s.q.done) { if (!rows.length || s.q.p >= lp) { s.q.done = true; s.q.incAt = now(); s.q.incP = 0; } else s.q.p++; }
      else { if (seen || !fresh.length || (s.q.incP || 0) + 1 >= lp) { s.q.incAt = now(); s.q.incP = 0; } else s.q.incP = (s.q.incP || 0) + 1; }
      if (VC.needFlush(s.q.buf, c)) shard(s, 'q'); else if (s.q.done && !s.q.incP) flushAll(s); }
    s.at = now(); if (S.pages % 20 === 0) runDoc(share(others)); save(); return { did: true }; }
  function view(others) { const sh = share(others || 0); return { on: on(), sellers: S.order.length, done: S.order.filter((sc) => VC.sellerDone(S.sellers[sc])).length, pages: S.pages, wrote: S.wrote, cur: S.cur, share: sh, vt: S.vt, ot: S.ot, since: S.since ? new Date(S.since).toISOString() : null }; }
  return { on, feed, listTake, listWant, wantTurn, otherTurn, step, view, share, pending, _S: () => S, save, flushAll: () => { for (const sc of S.order) if (S.sellers[sc]) flushAll(S.sellers[sc]); save(true); } };
}
module.exports = { makeVoice };
