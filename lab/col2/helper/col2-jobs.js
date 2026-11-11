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
const KP_PATH = '/home/v3/addition/adiStatsSaleReport'; /* (0.1.10) 운영 KP_PAGE와 같은 화면(운영 본체 글자에서 떼어 온 KP_PAGE가 실제로 묻는 곳) */

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
  const R = (v) => (ctx.redact ? ctx.redact(v) : v); /* (0.1.10) 키 값이 섞이지 않게 */
  function push(k, a, key) { if (!inPlan(k)) return false; const sk = String(key); const seen = S.seen[k] || (S.seen[k] = {}); if (seen[sk] === kday()) return false; const q = S.q[k] || (S.q[k] = []);
    if (q.some((x) => x.key === sk)) return false; q.push({ key: sk, ...a }); while (q.length > QMAX) q.shift(); return true; }
  const authorOf = (b) => { const c = b && b.contributors; if (Array.isArray(c) && c.length) { const x = c[0]; return typeof x === 'string' ? x : (x && x.name) || ''; } return ''; };
  /* 책 차례 넣기 — 표본(pool) 한 권 → 그 책을 쓰는 일마다(외부 정보는 ISBN 끝자리 나눔) */
  function feedBooks(items) { let n = 0; for (const it of items || []) { const b = it.prod || {}; const isbn = String(b.isbn13 || '').replace(/\D/g, ''); const a = { itemId: it.itemId, bookId: it.bookId || null, isbn: isbn || null, title: b.title || '', author: authorOf(b), media: b.mediaType || null };
      for (const k of ['metrics', 'usedPage', 'dynamic']) if (it.itemId && push(k, a, it.itemId)) n++;
      for (const t of TK.TASKS) if (t.cls === 'ext' && t.input === 'book' && t.state === 'run' && inPlan(t.k)) { const key = isbn || ''; if (!/^97[89]\d{10}$/.test(key) && (t.grp !== 'used' || !a.title)) continue; if (!TK.shareOk(kind(), key || it.itemId, C())) continue; if (push(t.k, a, key || 'item_' + it.itemId)) n++; } }
    if (n) save(); return n; }
  const bookQ = () => ['metrics', 'usedPage', 'dynamic'].filter(inPlan).reduce((m, k) => Math.max(m, (S.q[k] || []).length), 0);
  function feedShops(scs, from) { let n = 0; for (const sc of scs || []) { const s = String(sc || ''); if (!/^\d{1,10}$/.test(s) || own().includes(s)) continue; for (const k of ['shopSum', 'survey']) if (push(k, { sc: s, from }, s)) n++; } return n; }
  /* (0.1.10) 🔍 새상품 없는 시세 차례 — 웹앱이 넘긴 운영 prd_market_nobook 문서(사무실 PC만 · 로거는 넣지 않음) */
  function feedNb(docs) { if (kind() === 'logger') return 0; let n = 0; for (const d of docs || []) { const v = d.v || {}; if (!v.title || !v.usedCode) continue; if (push('nbMarket', { key: d.id, usedCode: String(v.usedCode), listingId: v.listingId || null, title: String(v.title), price: v.our == null ? null : +v.our }, d.id)) n++; S.nbAfter = d.id; } if (n) { ctx.note(`🔍 새상품 없는 시세 ${n}건을 그림자 차례에 넣음(사무실 PC만)`, { k: 'read', m: '그림자 일' }); save(); } return n; }
  const qLen = (k) => (S.q[k] || []).length;
  /* 🎯 대상 숍 — 운영 app_settings/bench(읽기만 · 6시간마다) · 없으면 col2.json jobs.benchSc */
  function benchFeed() { if (!inPlan('bench') || now() - S.benchAt < 6 * 3600e3) return; const L = Array.isArray(C().benchSc) ? C().benchSc.map(String) : null;
    const add = (list) => { let n = 0; for (const sc of list) if (/^\d{1,10}$/.test(sc) && !own().includes(sc) && push('bench', { sc }, sc)) n++; S.benchAt = now(); if (n) ctx.note(`🎯 벤치마킹 대상 ${n}곳을 그림자 차례에 넣음`, { k: 'read', m: '🎯 벤치마킹' }); };
    if (L && L.length) return add(L); const r = ctx.want('app_settings', 'bench'); if (r && r.have) add(((r.v && r.v.targets) || []).filter((t) => t && t.sc && t.on !== false).map((t) => String(t.sc))); }

  /* 운영이 바쁜지 */
  const busy = () => { try { return ctx.busy() || null; } catch (e) { return null; } };

  /* 바깥(외부 정보) 받기 — 운영 extHttp와 같은 꼴 { status, text } · 쿠키 없이(손님으로) */
  const X = () => ctx.ext();
  async function extCall(t, a) { const x = X(); if (!x) return { ok: false, why: '외부 정보 공용 파일을 못 받음' };
    const keys = kind() === 'logger' || !ctx.keysFor ? {} : ctx.keysFor(t.src); /* (0.1.10) 운영 키는 사무실 PC 메모리에서만 · 로거는 늘 빈 키 */
    if (t.src === 'fx') return x.fxRun({ keys, http: ctx.http, day: kday() });
    return x.run(t.src, { isbn: a.isbn || '', title: a.title || '', author: a.author || '', media: a.media || null, keys, http: ctx.http, render: renderFor, cache: {}, cfg: x.cfgOf ? x.cfgOf({}) : {} }); }
  /* (0.1.10) 🖼 그려 읽기 — 운영 extRender와 같은 꼴: 도우미 /render(따로 된 칸 탭에 그려 HTML) → 운영 본체 extRenderHelper(글자 그대로)가 그 답을 해석 · 그릴 때마다 속도 규칙 한 장 */
  async function renderFor(url, opt) { const o = opt || {}; const sk = S.curSite; const tk = sk && ctx.site ? await ctx.site.take(sk) : await ctx.pace.take(); if (!tk.ok) return { ok: false, why: tk.why }; /* (11/11) 바깥 사이트를 그리면 그 사이트 몫 */
    const core = await ctx.core(); const br = await ctx.browser(); const wait = Math.min(30000, Math.max(6000, o.max || 12000));
    const Rd = await br.render(ctx.extUrl ? ctx.extUrl(url) : url, { wait, re: o.re, reFlags: o.reFlags }); if (!Rd.ok) { if (sk && ctx.site) ctx.site.fail(sk, 'error'); else ctx.pace.fail('error'); }
    const expr = `(async () => { const X = globalThis.__col2; X.gm = 'render'; X.rendered = ${JSON.stringify(Rd)}; try { return await Col2Lift.extRenderHelper(${JSON.stringify(url)}, ${JSON.stringify(o)}); } finally { X.gm = null; X.rendered = null; } })()`;
    const r = await br.mainJob(core.src, expr, 60); return r && typeof r === 'object' ? r : { ok: false, why: '그린 화면 해석 답 없음' }; }
  /* (0.1.10) 📚 KPIPA 마지막 날 — 운영 kpipaJob과 같은 규칙(한국 14:30 뒤면 어제 · 그 전엔 그제) · 날짜 셈은 떼어 온 kpYmd·kpAdd */
  const kpNeed = () => { const K = { ...(ctx.KPIPA || {}), ...(C().kpipa || {}) }; const t = new Date(now() + 9 * 3600e3); const hm = t.getUTCHours() * 60 + t.getUTCMinutes(); const [h, m] = String(K.after || '14:40').split(':').map(Number); return hm >= h * 60 + (m || 0); };

  /* 하나 하기 → { did, rest(ms), why } */
  async function step() {
    const b = busy(); if (b && b.on) { if (now() - S.busyLog > 10 * 60e3) { S.busyLog = now(); ctx.note(`그림자 일 쉼 — 운영이 바쁨(${b.why || ''}) · 끝나면 이어감`, { k: 'rest', m: '그림자 일' }); } return { did: false, rest: ctx.BUSY.restMs, why: '운영이 바쁨: ' + (b.why || '') }; }
    settle(); benchFeed();
    if (inPlan('kpipa') && S.kpDay !== kday() && kpNeed()) { S.kpDay = kday(); push('kpipa', { day: kday() }, kday()); }
    if (inPlan('ext.fx') && S.fxDay !== kday() && TK.shareOk(kind(), kday().slice(-1), C())) { S.fxDay = kday(); push('ext.fx', { day: kday() }, kday()); }
    const L = plan().filter((k) => k !== 'product' && (S.q[k] || []).length);
    /* (11/10) 🗣 판매자 구매평·문의 글 모으기(로거만) — 몫(처음 큼 → 점점 다른 일과 같게)만큼 차례를 받음 · 속도 규칙은 같이 셈 */
    const V = ctx.voice; const vTurn = !!(V && V.wantTurn(L.length));
    if (!L.length && !vTurn) return { did: false, why: S.wait.length ? `운영 값 기다림 ${S.wait.length}건` : '그림자 일 차례 없음', rest: S.wait.length ? 5000 : 15e3 };
    /* (11/11 정범님 '바깥 사이트 읽기 몫') 알라딘 몫(ctx.pace — 사람 속도 두 배)은 알라딘 화면 일(cls pub)만 · 바깥 사이트 일(cls ext)은 사이트마다 따로(ctx.site — 운영 출처 간격·하루 상한)
     *  → 알라딘 하루 몫을 다 써도 바깥 일은 이어 가고, 바깥 한 사이트가 쉬어도 다른 사이트·알라딘은 그대로 */
    const pc = ctx.pace.check(); const alReady = pc.ok && !(pc.waitMs > 0); const siteOf = (k) => { const t = TK.byK[k]; return t && t.cls === 'ext' ? (t.reader === 'kp' ? 'kpipa' : t.src || k) : null; };
    const rests = []; const L2 = L.filter((k) => { const sk = siteOf(k); if (!sk || !ctx.site) { if (!alReady) rests.push(pc.ok ? { ms: pc.waitMs + 50, why: '차례 기다림' } : { ms: pc.retryMs == null ? 30 * 60e3 : Math.min(pc.retryMs + 500, 30 * 60e3), why: pc.why }); return alReady; }
      const c = ctx.site.check(sk); if (c.ok && !(c.waitMs > 0)) return true; rests.push(c.ok ? { ms: c.waitMs + 50, why: '바깥 사이트 차례 기다림' } : { ms: c.retryMs == null ? 30 * 60e3 : Math.min(c.retryMs + 500, 30 * 60e3), why: c.why }); return false; });
    if (vTurn && !alReady) { rests.push(pc.ok ? { ms: pc.waitMs + 50, why: '차례 기다림' } : { ms: pc.retryMs == null ? 30 * 60e3 : Math.min(pc.retryMs + 500, 30 * 60e3), why: pc.why }); }
    if (!(vTurn && alReady) && !L2.length) { rests.sort((a, b) => a.ms - b.ms); const r0 = rests[0] || { ms: 15e3, why: '그림자 일 차례 없음' }; return { did: false, rest: r0.ms, why: r0.why }; }
    if (vTurn && alReady) { let r; try { r = await V.step(L.length); } catch (e) { r = { did: false, rest: 10e3, why: '🗣 ' + e.message }; } return r; }
    if (V) V.otherTurn();
    /* (11/10 밤 col2n) 표본이 모자란 일부터 — 예전엔 차례대로 돌아(일 수만큼 나눔) 표본 30개를 일찍 채운 일도 같은 몫을 받아, 하루 1,600장 몫이 낮 12시쯤 다 쓰이면 남은 일은 30개를 못 채움
     *  → 오늘 해 본 수(견줌+못 읽음+운영 값 없음+건너뜀)가 가장 적은 일 먼저(같으면 예전 차례) · 모든 일이 표본을 채운 뒤엔 다시 고르게 */
    const k = pickK(L2); const t = TK.byK[k]; const SK = siteOf(k); const SP = ctx.site && SK ? { take: () => ctx.site.take(SK), ok: () => ctx.site.ok(SK), fail: (x) => ctx.site.fail(SK, x) } : ctx.pace; /* 바깥 일은 그 사이트 몫 */ const a = S.q[k].shift(); (S.seen[k] || (S.seen[k] = {}))[a.key] = kday(); { const sk = Object.keys(S.seen[k]); if (sk.length > SEENMAX) for (const x of sk.slice(0, sk.length - SEENMAX)) delete S.seen[k][x]; }
    const t0 = now(); let r;
    if (t.reader === 'al') { const p = TK.pathOf(t, a, own()); if (!p) { record(t, a, a.key, 'skip', [], { why: '정한 주소 꼴이 아님(또는 우리 숍)' }); return { did: true }; }
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { S.q[k].unshift(a); delete S.seen[k][a.key]; ctx.pace.fail('error'); return { did: false, rest: 10e3, why: '작업 창 준비 실패: ' + e.message }; }
      const tk = await ctx.pace.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      r = await br.readJob(ctx.aladin + p, t.parse, core.src, 30) || { ok: false, why: '빈 응답' }; if (r.ok) ctx.pace.ok(); else if (!r.needLogin) ctx.pace.fail(r.kind || 'error'); r.url = p; }
    else if (t.reader === 'dyn' || t.reader === 'nb' || t.reader === 'kp') { const back = (why, ms) => { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: ms || 5000, why }; };
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { SP.fail('error'); return back('작업 창 준비 실패: ' + e.message, 10e3); }
      if (t.reader === 'dyn' && !TK.pathOf(t, a, own())) { record(t, a, a.key, 'skip', [], { why: '정한 주소 꼴이 아님' }); return { did: true }; }
      for (let i = 0; i < (t.cost || 1); i++) { const tk = await SP.take(); if (!tk.ok) return back(tk.why); } /* 화면 통째(그림·스크립트까지)는 운영처럼 3장 몫 */
      try { r = t.reader === 'dyn' ? await dynRead(br, core, t, a) : t.reader === 'nb' ? await nbRead(br, core, a) : await kpRead(br, core); } catch (e) { r = { ok: false, why: e.message, kind: 'error' }; }
      if (r && r.ok) SP.ok(); else if (r && !r.needLogin) SP.fail(r.kind === '429' ? '429' : 'error'); }
    else { const tk = await SP.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      S.curSite = SK; try { r = await extCall(t, a); } catch (e) { r = { ok: false, why: e.message }; } finally { S.curSite = null; } if (r && /HTTP (429|503)/.test(String(r.why || ''))) SP.fail('429'); else if (r && r.ok === false) SP.fail('error'); else SP.ok(); }
    r = r || { ok: false, why: '빈 응답' }; const ms = now() - t0;
    if (r.skip) { record(t, a, a.key, 'skip', [], { why: r.skip, ms }); return { did: true }; }
    if (!r.ok) { record(t, a, a.key, r.needLogin ? 'skip' : 'fail', [], { why: r.why || '못 읽음', ms }); return { did: true }; }
    queue(t, a, r, ms); settle(); save(); return { did: true }; }

  const tried = (k) => { const s = (S.day.d === kday() && S.day.t && S.day.t[k]) || null; let w = 0; for (const x of S.wait) if (x.k === k) w++; return w + (s ? (s.n || 0) + (s.fail || 0) + (s.noprod || 0) + (s.skip || 0) : 0); }; /* 운영 값을 기다리는 것도 셈(같은 일만 거듭 고르지 않게) */
  function pickK(L) { const off = S.rr++ % L.length; let best = null, bv = Infinity; for (let i = 0; i < L.length; i++) { const k = L[(off + i) % L.length]; const v = tried(k); if (v < bv) { bv = v; best = k; } } return best; }
  /* (0.1.10) 👥 구매자 분포 — 따로 된 칸 탭에 상품 화면을 그리고 운영 getProductFull(글자 그대로 · 받침 loadInFrame = 이 탭을 내려 보며 기다림) */
  async function dynRead(br, core, t, a) { const url = ctx.aladin + TK.pathOf(t, a, own()); const sec = ctx.pageSec || 25;
    const expr = `(async () => { globalThis.SET = { pageTimeoutSec: ${sec} }; const r = await Col2Lift.getProductFull(${JSON.stringify(url)}); if (!r || !r.page) return { ok: false, needLogin: !!(location.href && /login|adult/i.test(location.href)), why: '상품 화면을 못 읽음(로그인·19금 화면이거나 화면 모양이 다름)' }; const p = r.page;
      return { ok: true, page: JSON.parse(JSON.stringify({ buyerDist: p.buyerDist || null, relationBuy: p.relationBuy || [], clickRelation: p.clickRelation || [], clickRaw: !!p.clickRaw, dynamicLoaded: !!p.dynamicLoaded })), finalUrl: r.finalUrl }; })()`;
    const r = await br.tabJob(url, core.src, expr, sec + 10); if (r && r.ok && r.page && !r.page.dynamicLoaded) r.page.note = '지연 로딩 칸이 정한 시간 안에 다 차지 않음(운영도 같은 표시 dynLoaded:false)'; return r; }
  /* (0.1.10) 🔍 새상품 없는 시세 — 운영 nbMarketJob(글자 그대로)을 알라딘 탭 떨어진 칸에서 이 상품 한 건만 · 쓰기는 메모리 칸(__col2.W)에서 꺼내 견줌 */
  async function nbRead(br, core, a) { const L = { usedCode: a.usedCode, listingId: a.listingId, title: a.title, price: a.price, bookId: null, active: true };
    const expr = `(async () => { const X = globalThis.__col2; X.W = []; X.n = 0; X.st = null; globalThis.SET = { pageTimeoutSec: 25 }; const K = ${JSON.stringify(a.key)}; globalThis.LISTINGS = new Map([[K, ${JSON.stringify(L)}]]);
      try { await Col2Lift.nbMarketJob(); } catch (e) { return { ok: false, why: '검색 시세 오류: ' + e.message, kind: 'error' }; } finally { globalThis.LISTINGS = new Map(); }
      const w = X.W.find((x) => x.p === 'prd_market_nobook/' + K); if (!w) return { ok: false, why: X.st && X.st !== 200 ? '서버 응답 ' + X.st : X.n ? '검색 화면에서 시세를 못 만듦' : '검색어를 만들 수 없음', kind: X.st === 429 || X.st === 503 ? '429' : 'error' };
      const m = w.v.market || {}; return { ok: true, page: { median: m.median ?? null, low: m.low ?? null, n: m.n ?? null, candSig: w.v.candSig || null, cands: (w.v.cands || []).length }, n: X.n }; })()`;
    return br.mainJob(core.src, expr, 40); }
  /* (0.1.10) 📚 KPIPA — 판매 보고서 화면 탭(따로 된 칸 · 쿠키는 그 칸에만)에서 운영 kpFetch(글자 그대로 — 보안 표 받기 kpToken · 조회 kpReq · 표 읽기 kpParse) · 최근 days일 · 두 종류 사이 3~5초 */
  async function kpRead(br, core) { const K = { ...(ctx.KPIPA || {}), ...(C().kpipa || {}), host: (ctx.KPIPA || {}).host }; const days = Math.max(5, Math.min(31, +K.days || 7)); const base = ctx.kpBase || K.host || 'https://bnk.kpipa.or.kr'; if (ctx.test && !ctx.kpBase) return { ok: false, why: '시험 중엔 바깥 주소에 가지 않음', kind: 'error' };
    const expr = `(async () => { const X = globalThis.__col2; X.gm = 'fetch'; X.from = ${JSON.stringify(K.host || 'https://bnk.kpipa.or.kr')}; X.n = 0; X.st = null; const L = Col2Lift;
      try { const t = Date.now(); const k = new Date(t + 9 * 3600e3); const kh = k.getUTCHours() * 60 + k.getUTCMinutes(); const end = L.kpAdd(L.kpYmd(t), kh >= 14 * 60 + 30 ? -1 : -2); const from = L.kpAdd(end, -${days - 1}); const out = {};
        for (const type of ['onOff', 'bookType']) { const p = await L.kpFetch(type, from, end); out[type] = p ? p.rows : []; if (type === 'onOff') await new Promise((r) => setTimeout(r, ${ctx.test ? 200 : 3000} + Math.random() * ${ctx.test ? 100 : 2000})); }
        return { ok: true, page: { from, end, rows: out }, n: X.n }; } catch (e) { return { ok: false, why: 'KPIPA: ' + e.message, kind: X.st === 429 || X.st === 503 ? '429' : 'error' }; } finally { X.gm = null; } })()`;
    return br.tabJob(base + KP_PATH, core.src, expr, 90); }
  /* 읽은 것 → 운영 문서를 기다리는 줄 */
  function queue(t, a, r, ms) { const pg = r.page;
    if (t.k === 'usedPage' && pg && Array.isArray(pg.listings)) { const n = feedShops([...new Set(pg.listings.map((x) => x && x.sellerCode).filter(Boolean))].slice(0, 5), a.itemId); if (n) ctx.note(`🏷 중고 첫 쪽에서 숍 ${n}곳을 숍 요약·평가 그림자 차례에 넣음`, { k: 'read', m: '그림자 일' });  if (ctx.voice && ctx.voice.on()) ctx.voice.feed([...new Set(pg.listings.map((x) => x && x.sellerCode).filter(Boolean))].slice(0, 5), 'quiet'); }
    if (t.k === 'bench') { const rows = Array.isArray(pg) ? pg.slice(0, t.rows || 10) : []; if (!rows.length) { record(t, a, a.key, 'fail', [], { why: '첫 쪽에서 상품을 못 읽음', ms }); return; }
      for (const x of rows) S.wait.push({ k: t.k, a, id: TK.docId(t, { sc: a.sc, id: x.id }), c: t.col, sh: x, at: now(), ms }); return; }
    if (t.k === 'kpipa') { const rows = pg && pg.rows ? pg.rows : {}; let c = 0; for (const type of ['onOff', 'bookType']) for (const x of rows[type] || []) { if (!x || !/^\d{8}$/.test(String(x.date))) continue; c++; S.wait.push({ k: t.k, a, id: String(x.date), c: t.col, sh: { type, series: x.series, end: pg.end }, at: now(), ms }); }
      if (!c) record(t, a, a.key, 'fail', [], { why: '표에서 날짜 줄을 못 읽음', ms }); return; }
    if (t.cls === 'ext') { const id = t.src === 'fx' ? String(r.date || a.day) : a.isbn || null; if (!id) { record(t, a, a.key, 'noprod', [], { why: 'ISBN 없음(장터 시세만 · 운영 문서 이름 모름)', ms }); return; }
      S.wait.push({ k: t.k, a, id, c: t.col, res: R(slimRes(r)), at: now(), ms }); return; }
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
    else if (t.cls === 'ext' && t.k !== 'kpipa') { const prev = v && v.src ? v.src[t.src] : null; cmp = CMP.compareExt(X(), t.src, prev, w.res, { oldH: 6 }); }
    else if (t.k === 'survey') { const m = {}; const pd = {}; for (const d of Object.keys(w.sh || {})) { m[d] = d; pd[d] = v && v.days ? v.days[d] || null : null; } cmp = !v ? { verdict: 'noprod', reasons: [] } : CMP.compareMap(pd, w.sh, m, { move: [kday()], prodAt: v.at || (v.stats && v.stats.at) || null }); }
    else if (t.k === 'kpipa') { const sh = w.sh || {}; const pv = v && v[sh.type]; if (!v) cmp = { verdict: 'noprod', reasons: [] }; else if (!pv || !pv.series) cmp = { verdict: 'diff', reasons: ['fill'], rows: [{ f: sh.type, k: 'fill', prod: null, shadow: sh.series }] };
      else if (CMP.stab(pv.series) === CMP.stab(sh.series)) cmp = { verdict: 'same', reasons: [] }; /* 운영 kpSig와 같은 셈(칸 순서 상관없이 같은 값) */
      else { const ageH = (now() - Date.parse(pv.at || 0)) / 3600e3; cmp = { verdict: 'diff', reasons: [ageH >= 3 ? 'old' : 'diff'], rows: [{ f: sh.type, k: 'diff', prod: pv.series, shadow: sh.series }], ageH: Number.isFinite(ageH) ? Math.round(ageH * 10) / 10 : null }; } } /* 최근 7일은 공표 뒤 고쳐질 수 있어 운영도 3시간마다 다시 받음 → 3시간 넘은 운영 값이면 '오래됨' */
    else cmp = CMP.compareMap(v || null, w.sh || {}, t.map || {}, { move: t.move, prodAt: t.at && v ? v[t.at] || atOf(v) : atOf(v) });
    record(t, w.a, w.id, cmp.verdict, cmp.reasons || [], { ms: w.ms, rows: (cmp.rows || []).filter((x) => x.k !== 'same').slice(0, 8), how: cmp.how || null, ageH: cmp.ageH == null ? null : cmp.ageH, why: cmp.why || null }); }

  /* 기록 — col2_jobs 한 건 · col2_jday 하루 요약(일마다 같음 비율·다름 까닭·넘길 수 있음) · 기록창 한 줄 */
  /* (11/11 col2rep1) ✗ 못 읽음 까닭 묶음 — 11/11 진단에서 예스24 도서 정보·네이버 도서·알라딘 TTB·예스24 중고가 두 PC 모두 '못 읽음 100%'인데 하루 요약에 까닭이 없어 고칠 곳을 못 찾았음
   *  → 까닭 글을 꼴로 묶어(숫자·주소 뺌) 일마다 많은 것 6가지만 하루 요약(col2_jday … tasks.<일>.failWhy)에 · 값·손님 정보 없음 */
  const failKey = (w) => { const t = String(w || '못 읽음'); const h = t.match(/HTTP\s*(\d{3})/i); if (h) return 'HTTP ' + h[1]; if (/키|key/i.test(t)) return '키 없음·틀림'; if (/30초|시간|timeout|abort/i.test(t)) return '시간 넘음';
    if (/연결 실패|ENOTFOUND|ECONN|fetch failed|getaddrinfo|certificate|TLS/i.test(t)) return '연결 실패'; if (/몫|상한|차례|쉼|pace|429/i.test(t)) return '속도 몫·쉼'; if (/작업 창|크롬|브라우저|render|그린/i.test(t)) return '작업 창·그리기';
    return t.replace(/https?:\/\/\S+/g, '').replace(/[\d,.]+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 40) || '못 읽음'; };
  function failAdd(k, why) { const s = S.day.t && S.day.t[k]; if (!s) return; const f = s.failWhy || (s.failWhy = {}); const key = failKey(why); f[key] = (f[key] || 0) + 1;
    const ks = Object.keys(f); if (ks.length > 12) { ks.sort((a, b) => f[a] - f[b]); for (const x of ks.slice(0, ks.length - 12)) delete f[x]; } }
  function record(t, a, id, v, reasons, x) { x = x || {}; const d = kday(); if (S.day.d !== d) S.day = TK.dayNew(d); const s = TK.dayAdd(S.day, t.k, v, reasons); const ps = TK.passOf(s, P(), t.k);
    if (v === 'fail') failAdd(t.k, x.why);
    const pcn = ctx.pc(); const did = String(t.k + '_' + id).replace(/[^\w.-]/g, '_').slice(0, 150);
    if (!x.noItem) ctx.out('col2_jobs', did, R({ task: t.k, name: t.name, col: t.col, id: String(id), key: a && a.key || null, at: new Date().toISOString(), d, verdict: v, reasons, why: x.why || null, rows: x.rows || [], how: x.how || null, ageH: x.ageH == null ? null : x.ageH, ms: x.ms || null, pc: pcn, kind: kind(), ver: ctx.VERSION }));
    ctx.out('col2_jday', `${d}_${String(pcn).replace(/[^\w.-]/g, '_')}`.slice(0, 150), { d, pc: pcn, kind: kind(), at: new Date().toISOString(), ver: ctx.VERSION, rule: ps.rule, tasks: summary() });
    const was = S.last && S.last[t.k]; S.last = { ...(S.last || {}), [t.k]: { at: now(), v, can: ps.can } };
    const lab = { same: '같음', diff: '다름', fail: '못 읽음', noprod: '운영 값 없음', skip: '건너뜀' }[v] || v;
    if (!x.quiet) ctx.note(`${t.name} ${id} — ${lab}${reasons && reasons.length ? '(' + reasons.map((r) => TK.WHY[r] || r).join('·') + ')' : ''}${x.why ? ' · ' + x.why : ''}`, { k: 'read', l: v === 'same' ? 'ok' : v === 'diff' && reasons.some((r) => TK.UNEXPLAINED.includes(r)) ? 'warn' : v === 'fail' ? 'warn' : 'info', m: t.name, d: { task: t.k, v, ms: x.ms || null } });
    if (ps.can && !(was && was.can)) ctx.note(`✅ ${t.name} — 오늘 '넘길 수 있음'(표본 ${ps.n} · 같음 ${ps.rate}% · ${ps.rule})`, { k: 'read', l: 'ok', m: t.name });
    save(); }
  function summary() { const P0 = P(); const o = {}; for (const [k, s] of Object.entries(S.day.t || {})) { const t = TK.byK[k]; o[k] = { name: t ? t.name : k, n: s.n, same: s.same, diff: s.diff, un: s.un, fail: s.fail, noprod: s.noprod, skip: s.skip, why: s.why, failWhy: s.failWhy ? Object.fromEntries(Object.entries(s.failWhy).sort((a, b) => b[1] - a[1]).slice(0, 6)) : undefined, pass: TK.passOf(s, P0, k) }; } return o; }
  /* 화면용 — 일 목록(이 PC가 하는지 · 차례 · 오늘 셈 · 넘길 수 있음) */
  function view() { const pl = plan(); const sm = summary(); const lg = kind() === 'logger';
    return { kind: kind(), pc: ctx.pc(), d: S.day.d, rule: TK.passOf(null, P()).rule, wait: S.wait.length, busy: busy(), tasks: TK.TASKS.map((t) => ({ k: t.k, name: t.name, ops: t.ops, cls: t.cls, reader: t.reader, col: t.col, who: t.who, state: t.state, why: t.why || null, note: t.note || null,
      mine: pl.includes(t.k), notMine: pl.includes(t.k) ? null : t.state === 'ended' ? `종료됨(${t.ended}) — 묻지 않음` : t.state !== 'run' ? '아직 안 돎' : t.who === 'logger' && !lg ? '로거 고유 일(사무실 PC는 안 함)' : t.who === 'office' && lg ? '사무실 PC 일(로거는 안 함)' : t.who === 'share' && lg ? '외부 정보 — 사무실 PC가 함(나눔 꺼짐 · col2.json jobs.extShare)' : '꺼 둠', q: (S.q[t.k] || []).length, today: sm[t.k] || null })) }; }
  /* 📘 공개 상품 화면(0.1.2부터 도는 자동 읽기)의 결과도 같은 하루 셈에 — col2_books는 그 길이 이미 씀(여기서는 하루 요약만) */
  function addProduct(itemId, verdict, reasons, why) { const t = TK.byK.product; if (!t || !TK.plan(kind(), C()).includes('product')) return; record(t, { key: String(itemId) }, String(itemId), verdict, reasons || [], { noItem: true, quiet: true, why: why || null }); }
  return { step, addProduct, pickK, tried, feedBooks, feedShops, feedNb, qLen, bookQ, view, plan, summary, _S: () => S, save };
}
module.exports = { makeJobs };
