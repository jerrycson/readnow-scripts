/* col2-jobs.js — (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 그림자 일 돌리기
 * 차림표(shadow/col2-tasks.js)에서 이 PC가 할 일(로거 설정 묶음 — 로거는 로거 고유 일만 · 사무실 PC는 로거와 겹치지 않는 일만)을 차례로 하나씩:
 *   읽기(운영과 같은 해석 코드 · 쿠키 없이 · 속도 규칙 PACE 함께 — 한 장 뒤 4초 안팎 · 시간 240 · 하루 1,600 · 429면 쉼) →
 *   운영 결과 문서를 웹앱 대신 읽기로 받아(읽기만 · 못 받으면 waitMin분 뒤 '운영 값 못 받음') → 칸마다 견줌 → col2_jobs/<일>_<문서> · col2_jday/<날짜>_<PC> 에만 맡김(웹앱이 대신 씀)
 * 운영이 바쁠 때 쉼: 이 PC 수집기가 알린 🚚 출고 보호(예스24 다리 hold) · POST /busy {sec, why}(운영 쪽이 알려 주면) — 쉬는 동안은 알라딘·바깥에 요청하지 않음
 * 차례표(jobs.json)는 이 PC 것만 — 다른 PC의 목록·차례를 이어받지 않음 */
'use strict';
const fs = require('fs'), path = require('path');
const TK = require('../shadow/col2-tasks.js'); const CMP = require('../shadow/col2-compare-core.js');
const kday = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
const QMAX = 500, SEENMAX = 3000;

function makeJobs(ctx) {
  const F = path.join(ctx.home, 'jobs.json'); const now = () => Date.now();
  let S = { q: {}, seen: {}, day: TK.dayNew(kday()), wait: [], rr: 0, benchAt: 0, fxDay: '', last: null, busyLog: 0 };
  try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); if (v && typeof v === 'object') S = { ...S, ...v }; } catch (e) {}
  let dirty = 0; const save = (force) => { if (!force && now() - dirty < 3000) return; dirty = now(); try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  const C = () => ctx.cfg() || {}; const kind = () => ctx.kind();
  const P = () => ({ ...ctx.PASS, ...(C().pass || {}) });
  const plan = () => (C().on === false ? [] : TK.plan(kind(), C())); /* jobs.on:false 면 그림자 일 모두 쉼(시험은 기본 꺼짐) */
  const inPlan = (k) => plan().includes(k);
  const own = () => (ctx.OWN_SC || []).map(String);
  function push(k, a, key) { if (!inPlan(k)) return false; const sk = String(key); const seen = S.seen[k] || (S.seen[k] = {}); if (seen[sk] === kday()) return false; const q = S.q[k] || (S.q[k] = []);
    if (q.some((x) => x.key === sk)) return false; q.push({ key: sk, ...a }); while (q.length > QMAX) q.shift(); return true; }
  const authorOf = (b) => { const c = b && b.contributors; if (Array.isArray(c) && c.length) { const x = c[0]; return typeof x === 'string' ? x : (x && x.name) || ''; } return ''; };
  /* 책 차례 넣기 — 표본(pool) 한 권 → 그 책을 쓰는 일마다(외부 정보는 ISBN 끝자리 나눔) */
  function feedBooks(items) { let n = 0; for (const it of items || []) { const b = it.prod || {}; const isbn = String(b.isbn13 || '').replace(/\D/g, ''); const a = { itemId: it.itemId, bookId: it.bookId || null, isbn: isbn || null, title: b.title || '', author: authorOf(b), media: b.mediaType || null };
      for (const k of ['metrics', 'usedPage']) if (it.itemId && push(k, a, it.itemId)) n++;
      for (const t of TK.TASKS) if (t.cls === 'ext' && t.input === 'book' && t.state === 'run' && inPlan(t.k)) { const key = isbn || ''; if (!/^97[89]\d{10}$/.test(key) && (t.grp !== 'used' || !a.title)) continue; if (!TK.shareOk(kind(), key || it.itemId, C())) continue; if (push(t.k, a, key || 'item_' + it.itemId)) n++; } }
    if (n) save(); return n; }
  const bookQ = () => ['metrics', 'usedPage'].filter(inPlan).reduce((m, k) => Math.max(m, (S.q[k] || []).length), 0);
  function feedShops(scs, from) { let n = 0; for (const sc of scs || []) { const s = String(sc || ''); if (!/^\d{1,10}$/.test(s) || own().includes(s)) continue; for (const k of ['shopSum', 'survey']) if (push(k, { sc: s, from }, s)) n++; } return n; }
  /* 🎯 대상 숍 — 운영 app_settings/bench(읽기만 · 6시간마다) · 없으면 col2.json jobs.benchSc */
  function benchFeed() { if (!inPlan('bench') || now() - S.benchAt < 6 * 3600e3) return; const L = Array.isArray(C().benchSc) ? C().benchSc.map(String) : null;
    const add = (list) => { let n = 0; for (const sc of list) if (/^\d{1,10}$/.test(sc) && !own().includes(sc) && push('bench', { sc }, sc)) n++; S.benchAt = now(); if (n) ctx.note(`🎯 벤치마킹 대상 ${n}곳을 그림자 차례에 넣음`, { k: 'read', m: '🎯 벤치마킹' }); };
    if (L && L.length) return add(L); const r = ctx.want('app_settings', 'bench'); if (r && r.have) add(((r.v && r.v.targets) || []).filter((t) => t && t.sc && t.on !== false).map((t) => String(t.sc))); }

  /* 운영이 바쁜지 */
  const busy = () => { try { return ctx.busy() || null; } catch (e) { return null; } };

  /* 바깥(외부 정보) 받기 — 운영 extHttp와 같은 꼴 { status, text } · 쿠키 없이(손님으로) */
  const X = () => ctx.ext();
  async function extCall(t, a) { const x = X(); if (!x) return { ok: false, why: '외부 정보 공용 파일을 못 받음' };
    if (t.src === 'fx') return x.fxRun({ keys: {}, http: ctx.http, day: kday() });
    return x.run(t.src, { isbn: a.isbn || '', title: a.title || '', author: a.author || '', media: a.media || null, keys: {}, http: ctx.http, cache: {}, cfg: x.cfgOf ? x.cfgOf({}) : {} }); }

  /* 하나 하기 → { did, rest(ms), why } */
  async function step() {
    const b = busy(); if (b && b.on) { if (now() - S.busyLog > 10 * 60e3) { S.busyLog = now(); ctx.note(`그림자 일 쉼 — 운영이 바쁨(${b.why || ''}) · 끝나면 이어감`, { k: 'rest', m: '그림자 일' }); } return { did: false, rest: ctx.BUSY.restMs, why: '운영이 바쁨: ' + (b.why || '') }; }
    settle(); benchFeed();
    if (inPlan('ext.fx') && S.fxDay !== kday() && TK.shareOk(kind(), kday().slice(-1), C())) { S.fxDay = kday(); push('ext.fx', { day: kday() }, kday()); }
    const L = plan().filter((k) => k !== 'product' && (S.q[k] || []).length); if (!L.length) return { did: false, why: S.wait.length ? `운영 값 기다림 ${S.wait.length}건` : '그림자 일 차례 없음', rest: S.wait.length ? 5000 : 15e3 };
    const pc = ctx.pace.check(); if (!pc.ok) return { did: false, rest: pc.retryMs == null ? 30 * 60e3 : Math.min(pc.retryMs + 500, 30 * 60e3), why: pc.why }; if (pc.waitMs > 0) return { did: false, rest: pc.waitMs + 50, why: '차례 기다림' };
    const k = L[S.rr++ % L.length]; const t = TK.byK[k]; const a = S.q[k].shift(); (S.seen[k] || (S.seen[k] = {}))[a.key] = kday(); { const sk = Object.keys(S.seen[k]); if (sk.length > SEENMAX) for (const x of sk.slice(0, sk.length - SEENMAX)) delete S.seen[k][x]; }
    const t0 = now(); let r;
    if (t.reader === 'al') { const p = TK.pathOf(t, a, own()); if (!p) { record(t, a, a.key, 'skip', [], { why: '정한 주소 꼴이 아님(또는 우리 숍)' }); return { did: true }; }
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { S.q[k].unshift(a); delete S.seen[k][a.key]; ctx.pace.fail('error'); return { did: false, rest: 10e3, why: '작업 창 준비 실패: ' + e.message }; }
      const tk = await ctx.pace.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      r = await br.readJob(ctx.aladin + p, t.parse, core.src, 30) || { ok: false, why: '빈 응답' }; if (r.ok) ctx.pace.ok(); else if (!r.needLogin) ctx.pace.fail(r.kind || 'error'); r.url = p; }
    else { const tk = await ctx.pace.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      try { r = await extCall(t, a); } catch (e) { r = { ok: false, why: e.message }; } if (r && /HTTP (429|503)/.test(String(r.why || ''))) ctx.pace.fail('429'); else if (r && r.ok === false) ctx.pace.fail('error'); else ctx.pace.ok(); }
    r = r || { ok: false, why: '빈 응답' }; const ms = now() - t0;
    if (r.skip) { record(t, a, a.key, 'skip', [], { why: r.skip, ms }); return { did: true }; }
    if (!r.ok) { record(t, a, a.key, r.needLogin ? 'skip' : 'fail', [], { why: r.why || '못 읽음', ms }); return { did: true }; }
    queue(t, a, r, ms); settle(); save(); return { did: true }; }

  /* 읽은 것 → 운영 문서를 기다리는 줄 */
  function queue(t, a, r, ms) { const pg = r.page;
    if (t.k === 'usedPage' && pg && Array.isArray(pg.listings)) { const n = feedShops([...new Set(pg.listings.map((x) => x && x.sellerCode).filter(Boolean))].slice(0, 5), a.itemId); if (n) ctx.note(`🏷 중고 첫 쪽에서 숍 ${n}곳을 숍 요약·평가 그림자 차례에 넣음`, { k: 'read', m: '그림자 일' }); }
    if (t.k === 'bench') { const rows = Array.isArray(pg) ? pg.slice(0, t.rows || 10) : []; if (!rows.length) { record(t, a, a.key, 'fail', [], { why: '첫 쪽에서 상품을 못 읽음', ms }); return; }
      for (const x of rows) S.wait.push({ k: t.k, a, id: TK.docId(t, { sc: a.sc, id: x.id }), c: t.col, sh: x, at: now(), ms }); return; }
    if (t.cls === 'ext') { const id = t.src === 'fx' ? String(r.date || a.day) : a.isbn || null; if (!id) { record(t, a, a.key, 'noprod', [], { why: 'ISBN 없음(장터 시세만 · 운영 문서 이름 모름)', ms }); return; }
      S.wait.push({ k: t.k, a, id, c: t.col, res: slimRes(r), at: now(), ms }); return; }
    const id = t.id === 'bookId' ? a.bookId : TK.docId(t, a); if (!id) { record(t, a, a.key, 'noprod', [], { why: '운영 문서 이름 모름(bookId 없음)', ms }); return; }
    S.wait.push({ k: t.k, a, id, c: t.col, sh: t.shape === 'survey' ? TK.surveyDays(pg) : pg, at: now(), ms }); }
  const slimRes = (r) => { const o = { ok: !!r.ok, none: !!r.none, skip: r.skip || null, why: r.why || null }; if (r.d !== undefined) o.d = r.d; if (r.rates) { o.rates = r.rates; o.src = r.src; o.date = r.date; } return o; };

  /* 운영 문서가 왔는지 보고 견줌 */
  function settle() { const P0 = P(); const keep = [];
    for (const w of S.wait) { const t = TK.byK[w.k]; if (!t) continue; const g = ctx.want(w.c, w.id);
      if (g && g.have) { done(t, w, g.v); continue; } if (g && g.err) { record(t, w.a, w.id, 'noprod', [], { why: g.err, ms: w.ms }); continue; }
      if (now() - w.at > (P0.waitMin || 15) * 60e3) { record(t, w.a, w.id, 'noprod', [], { why: `운영 값 못 받음(${w.c} — 웹앱이 아직 이 칸을 넘겨주지 않음)`, ms: w.ms }); continue; } keep.push(w); }
    S.wait = keep.slice(-400); }
  const atOf = (v) => (v && (v.lastCheckedAt || v.rev6mAt || v.usedAt || v.lastSeen || v.at || v.chk || null)) || null;
  function done(t, w, v) { let cmp;
    if (t.cls === 'ext' && t.src === 'fx') { const res = w.res; if (!v) cmp = { verdict: 'noprod', reasons: [] }; else { const m = {}; for (const c of ['USD', 'EUR', 'JPY', 'GBP']) m[c] = c; cmp = CMP.compareMap(v.rates || {}, res.rates || {}, m, { move: Object.keys(m), prodAt: v.at, moveMin: 0 }); if (cmp.verdict === 'diff' && v.src && v.src !== res.src) cmp.reasons = ['ext']; } }
    else if (t.cls === 'ext') { const prev = v && v.src ? v.src[t.src] : null; cmp = CMP.compareExt(X(), t.src, prev, w.res, { oldH: 6 }); }
    else if (t.k === 'survey') { const m = {}; const pd = {}; for (const d of Object.keys(w.sh || {})) { m[d] = d; pd[d] = v && v.days ? v.days[d] || null : null; } cmp = !v ? { verdict: 'noprod', reasons: [] } : CMP.compareMap(pd, w.sh, m, { move: [kday()], prodAt: v.at || (v.stats && v.stats.at) || null }); }
    else cmp = CMP.compareMap(v || null, w.sh || {}, t.map || {}, { move: t.move, prodAt: atOf(v) });
    record(t, w.a, w.id, cmp.verdict, cmp.reasons || [], { ms: w.ms, rows: (cmp.rows || []).filter((x) => x.k !== 'same').slice(0, 8), how: cmp.how || null, ageH: cmp.ageH == null ? null : cmp.ageH, why: cmp.why || null }); }

  /* 기록 — col2_jobs 한 건 · col2_jday 하루 요약(일마다 같음 비율·다름 까닭·넘길 수 있음) · 기록창 한 줄 */
  function record(t, a, id, v, reasons, x) { x = x || {}; const d = kday(); if (S.day.d !== d) S.day = TK.dayNew(d); const s = TK.dayAdd(S.day, t.k, v, reasons); const ps = TK.passOf(s, P());
    const pcn = ctx.pc(); const did = String(t.k + '_' + id).replace(/[^\w.-]/g, '_').slice(0, 150);
    if (!x.noItem) ctx.out('col2_jobs', did, { task: t.k, name: t.name, col: t.col, id: String(id), key: a && a.key || null, at: new Date().toISOString(), d, verdict: v, reasons, why: x.why || null, rows: x.rows || [], how: x.how || null, ageH: x.ageH == null ? null : x.ageH, ms: x.ms || null, pc: pcn, kind: kind(), ver: ctx.VERSION });
    ctx.out('col2_jday', `${d}_${String(pcn).replace(/[^\w.-]/g, '_')}`.slice(0, 150), { d, pc: pcn, kind: kind(), at: new Date().toISOString(), ver: ctx.VERSION, rule: ps.rule, tasks: summary() });
    const was = S.last && S.last[t.k]; S.last = { ...(S.last || {}), [t.k]: { at: now(), v, can: ps.can } };
    const lab = { same: '같음', diff: '다름', fail: '못 읽음', noprod: '운영 값 없음', skip: '건너뜀' }[v] || v;
    if (!x.quiet) ctx.note(`${t.name} ${id} — ${lab}${reasons && reasons.length ? '(' + reasons.map((r) => TK.WHY[r] || r).join('·') + ')' : ''}${x.why ? ' · ' + x.why : ''}`, { k: 'read', l: v === 'same' ? 'ok' : v === 'diff' && reasons.some((r) => TK.UNEXPLAINED.includes(r)) ? 'warn' : v === 'fail' ? 'warn' : 'info', m: t.name, d: { task: t.k, v, ms: x.ms || null } });
    if (ps.can && !(was && was.can)) ctx.note(`✅ ${t.name} — 오늘 '넘길 수 있음'(표본 ${ps.n} · 같음 ${ps.rate}% · ${ps.rule})`, { k: 'read', l: 'ok', m: t.name });
    save(); }
  function summary() { const P0 = P(); const o = {}; for (const [k, s] of Object.entries(S.day.t || {})) { const t = TK.byK[k]; o[k] = { name: t ? t.name : k, n: s.n, same: s.same, diff: s.diff, un: s.un, fail: s.fail, noprod: s.noprod, skip: s.skip, why: s.why, pass: TK.passOf(s, P0) }; } return o; }
  /* 화면용 — 일 목록(이 PC가 하는지 · 차례 · 오늘 셈 · 넘길 수 있음) */
  function view() { const pl = plan(); const sm = summary(); const lg = kind() === 'logger';
    return { kind: kind(), pc: ctx.pc(), d: S.day.d, rule: TK.passOf(null, P()).rule, wait: S.wait.length, busy: busy(), tasks: TK.TASKS.map((t) => ({ k: t.k, name: t.name, ops: t.ops, cls: t.cls, reader: t.reader, col: t.col, who: t.who, state: t.state, why: t.why || null, note: t.note || null,
      mine: pl.includes(t.k), notMine: pl.includes(t.k) ? null : t.state !== 'run' ? '아직 안 돎' : t.who === 'logger' && !lg ? '로거 고유 일(사무실 PC는 안 함)' : t.who === 'office' && lg ? '사무실 PC 일(로거는 안 함)' : t.who === 'share' && lg ? '외부 정보 — 사무실 PC가 함(나눔 꺼짐 · col2.json jobs.extShare)' : '꺼 둠', q: (S.q[t.k] || []).length, today: sm[t.k] || null })) }; }
  /* 📘 공개 상품 화면(0.1.2부터 도는 자동 읽기)의 결과도 같은 하루 셈에 — col2_books는 그 길이 이미 씀(여기서는 하루 요약만) */
  function addProduct(itemId, verdict, reasons, why) { const t = TK.byK.product; if (!t || !TK.plan(kind(), C()).includes('product')) return; record(t, { key: String(itemId) }, String(itemId), verdict, reasons || [], { noItem: true, quiet: true, why: why || null }); }
  return { step, addProduct, feedBooks, feedShops, bookQ, view, plan, summary, _S: () => S, save };
}
module.exports = { makeJobs };
