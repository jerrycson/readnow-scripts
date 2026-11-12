/* col2-jobs.js — (0.1.9 정범님 11/09 밤 '로그인 없는 일 전부 그림자') 그림자 일 돌리기
 * 차림표(shadow/col2-tasks.js)에서 이 PC가 할 일(로거 설정 묶음 — 로거는 로거 고유 일만 · 사무실 PC는 로거와 겹치지 않는 일만)을 차례로 하나씩:
 *   읽기(운영과 같은 해석 코드 · 쿠키 없이 · 속도 규칙 PACE 함께 — 한 장 뒤 4초 안팎 · 시간 240 · 하루 1,600 · 429면 쉼) →
 *   운영 결과 문서를 웹앱 대신 읽기로 받아(읽기만 · 못 받으면 waitMin분 뒤 '운영 값 못 받음') → 칸마다 견줌 → col2_jobs/<일>_<문서> · col2_jday/<날짜>_<PC> 에만 맡김(웹앱이 대신 씀)
 * 운영이 바쁠 때 쉼: 이 PC 수집기가 알린 🚚 출고 보호(예스24 다리 hold) · POST /busy {sec, why}(운영 쪽이 알려 주면) — 쉬는 동안은 알라딘·바깥에 요청하지 않음
 * 차례표(jobs.json)는 이 PC 것만 — 다른 PC의 목록·차례를 이어받지 않음 */
'use strict';
const fs = require('fs'), path = require('path');
const TK = require('../shadow/col2-tasks.js'); const CMP = require('../shadow/col2-compare-core.js'); const HOF = require('../shadow/col2-handoff.js'); /* (11/12 handoff2) 로거 칸 넘김 — 운영 규칙으로 '지금 써야 하나'(due) */
const kday = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
const QMAX = 500, SEENMAX = 3000;
const KP_PATH = '/home/v3/addition/adiStatsSaleReport'; /* (0.1.10) 운영 KP_PAGE와 같은 화면(운영 본체 글자에서 떼어 온 KP_PAGE가 실제로 묻는 곳) */

function makeJobs(ctx) {
  const F = path.join(ctx.home, 'jobs.json'); const now = () => Date.now();
  let S = { q: {}, seen: {}, day: TK.dayNew(kday()), wait: [], rr: 0, benchAt: 0, fxDay: '', last: null, busyLog: 0 };
  try { const v = JSON.parse(fs.readFileSync(F, 'utf8')); if (v && typeof v === 'object') S = { ...S, ...v }; } catch (e) {}
  /* (11/12 hot1) 이 파일(차례·본 기록 — 수 MB까지 큼)을 3초마다 통째로 다시 쓰면 Defender가 매번 다시 검사 → 20초마다(시험은 3초) */
  let dirty = 0; const SAVE_MS = ctx.test ? 3000 : 20e3; const save = (force) => { if (!force && now() - dirty < SAVE_MS) return; dirty = now(); try { fs.writeFileSync(F + '.t', JSON.stringify(S)); fs.renameSync(F + '.t', F); } catch (e) {} };
  const C = () => ctx.cfg() || {}; const kind = () => ctx.kind(); const M = { ext: [], page: [], capLog: 0, fsAt: {} }; /* (11/12 hot1) 메모리만 */
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
  function feedNb(docs) { if (kind() === 'logger') return 0; let n = 0; for (const d of docs || []) { const v = d.v || {}; if (!v.title || !v.usedCode) continue; if (handed('nbMarket') && v.at && now() - Date.parse(v.at) < 7 * 864e5) { S.nbAfter = d.id; continue; } /* (11/11 col2rep3) 넘긴 뒤엔 운영처럼 7일 지난 상품만 다시 봄 */ if (push('nbMarket', { key: d.id, usedCode: String(v.usedCode), listingId: v.listingId || null, title: String(v.title), price: v.our == null ? null : +v.our }, d.id)) n++; S.nbAfter = d.id; } if (n) { ctx.note(`🔍 새상품 없는 시세 ${n}건을 그림자 차례에 넣음(사무실 PC만)`, { k: 'read', m: '그림자 일' }); save(); } return n; }
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

  /* (11/11 col2rep3) 💱 환율 출처 맞춤 — 11/11 JS-MAIN은 하루 첫 걸음(키가 웹앱에서 오기 전)에 읽어 frankfurter로 받음 → 운영(수출입은행)과 '출처 다름'
   *  운영 extFx처럼 한국 11:35 뒤(수출입은행 고시 뒤)에만 · 사무실 PC는 운영 키(eximKey)가 메모리에 온 뒤에만(3시간 기다려도 안 오면 키 없이 — 그때는 운영 쪽도 키가 없을 때뿐) */
  const kmin = () => { const t = new Date(now() + 9 * 3600e3); return t.getUTCHours() * 60 + t.getUTCMinutes(); };
  function fxReady() { const F = C().fx || {}; const [h, m] = String(F.after || '11:35').split(':').map(Number); if (kmin() < h * 60 + (m || 0)) return false; if (kind() === 'logger' || !ctx.keysFor) return true; let k = {}; try { k = ctx.keysFor('fx') || {}; } catch (e) {} if (k.eximKey) return true;
    if (!S.fxWait || S.fxWait.d !== kday()) S.fxWait = { d: kday(), at: now() }; return now() - S.fxWait.at >= (F.keyWaitMin == null ? 180 : +F.keyWaitMin) * 60e3; } /* col2.json jobs.fx { after, keyWaitMin }로 바꿈(시험은 00:00 · 0) */
  /* (11/11 col2rep3) 🔀 넘긴 일인가(이 PC로) */
  const handed = (k) => !!(ctx.handed && ctx.handed(k) && ctx.opOut);
  /* (11/11 col2rep3) 🅣 알라딘 TTB '이 주소의 OpenAPI 서비스는 종료' — 11/11 두 PC 모두 41·34건 100% 같은 답(운영 ext_run.lastErr.ttb도 같은 글) = 책 문제가 아니라 알라딘 쪽 주소 문제
   *  → 못 읽음으로 세지 않고 '건너뜀(출처 서비스 끝)' · 그날은 더 묻지 않음(헛 요청 하루 수십 건 줄임) · 주소가 바뀌면 운영 공용 파일 고침 뒤 다음 날 다시 */
  /* (11/11 col2rep5) 🔀 넘긴 외부 정보(국중에서 모든 출처로 넓힘) — 운영처럼 다시 볼 날이 지난 책만 묻는다: 먼저 운영 문서(ext_<묶음>/<ISBN>)를 웹앱에서 받아 보고(바깥 요청 없음) · 10분 안에 못 받으면 그냥 읽음
   *  다시 볼 날 = 운영 공용 파일 기본(ReadnowExt.cfgOf — 기본 정보 120일 · 장터 7일 · 해외 14일 · 도서관·전자책 30일) · col2.json jobs.refreshDays {출처: 날}로 바꿈
   *  ISBN 없는 상품(장터 시세만)은 운영 수집기가 그대로 함 → 번외는 묻지 않음('no') */
  const extBytes = (v) => Buffer.byteLength(JSON.stringify(v), 'utf8'); /* 운영 extBytes와 같음(바이트 · 한글 3바이트) */
  const HO_EXT = (t) => !!(t && t.cls === 'ext' && t.input === 'book' && t.src && t.src !== 'fx');
  function refreshOf(src) { const o = C().refreshDays || {}; if (+o[src] > 0) return +o[src]; let cf = null; try { const x = X(); cf = x && x.cfgOf ? x.cfgOf({}) : null; } catch (e) {} const d = cf && cf.src && cf.src[src] ? +cf.src[src].refreshDays : NaN; return d > 0 ? d : 120; }
  function hoDue(t, a) { const isbn = String(a.isbn || ''); if (!/^97[89]\d{10}$/.test(isbn)) return 'no'; const g = ctx.want(t.col, isbn); if (g && g.err) return 'yes'; if (!(g && g.have)) { if (!a.preAt) a.preAt = now(); return now() - a.preAt < 10 * 60e3 ? 'wait' : 'yes'; }
    const p = g.v && g.v.src ? g.v.src[t.src] : null; if (!p || (p.err && !p.sig)) return 'yes'; const ref = Date.parse(p.chk || p.at || '') || 0; return now() - ref >= refreshOf(t.src) * 864e5 ? 'yes' : 'no'; }
  /* (11/11 col2rep5) 🔎 운영 값 먼저 보기 — 넘기지 않은 외부 정보 그림자는 운영이 그 출처로 이미 읽어 둔 책만 바깥에 묻는다
   *  11/11 진단(HOME 0.1.24): 외부 정보 견줌 약 1,000건에 '운영 값 없음'이 약 3,200건 — 바깥 요청 넷 중 셋이 견줄 수 없는 헛 요청(교보 448·eBay 348·중고나라 334·당근 334·중고닷 316·리디 301…)
   *   → 표본은 못 채우고(중고나라·당근 하루 8건) 바깥 사이트에는 사람 아닌 요청만 늘어남
   *  → 웹앱에서 운영 문서를 먼저 받아(바깥 요청 없음 · 받은 문서는 견줄 때 다시 씀) 그 출처 칸이 없거나 운영도 못 읽은 책이면 묻지 않음('pre' — 하루 셈에 따로 · 표본 셈·차례 셈에 안 듦)
   *  · 웹앱이 preWaitMin분(기본 10) 안에 못 넘기면 예전처럼 묻고 · ISBN 없는 상품은 운영 문서 이름을 몰라 견줄 수 없으니 묻지 않음 · col2.json jobs.preCheck:false면 예전처럼 */
  function preOf(t, a) { if (!HO_EXT(t) || C().preCheck === false || handed(t.k)) return 'go'; const isbn = String(a.isbn || '');
    if (!/^97[89]\d{10}$/.test(isbn)) return 'drop:ISBN 없음(장터 시세만 · 운영 문서 이름 모름)'; const g = ctx.want(t.col, isbn); if (g && g.err) return 'go';
    if (!(g && g.have)) { if (!a.preAt) a.preAt = now(); return now() - a.preAt < (C().preWaitMin == null ? 10 : +C().preWaitMin) * 60e3 ? 'wait' : 'go'; }
    const p = g.v && g.v.src ? g.v.src[t.src] : null; if (!p) return 'drop:운영이 아직 이 출처로 읽지 않은 책'; if (!p.sig && !p.at) return 'drop:운영도 이 출처로 못 읽은 책'; return 'go'; }
  /* 그 일 차례 앞쪽(최대 PRE_SCAN개)에서 바깥에 물어도 되는 책을 맨 앞으로 — 없으면 이번엔 그 일을 고르지 않음(다른 일이 차례를 받음 · 굶지 않음) */
  const PRE_SCAN = 12;
  function preReady(k) { const t = TK.byK[k]; const q = S.q[k] || []; if (!HO_EXT(t)) return q.length > 0; let seenN = 0;
    const ho = handed(k); /* 넘긴 일 — 운영 규칙(다시 볼 날)으로 고름 · 기다리는 동안 다른 일이 차례를 받음(예전엔 1.5초씩 다른 일까지 멈춤) */
    for (let i = 0; i < q.length && seenN < PRE_SCAN; i++) { const a = q[i];
      if (ho) { const due = hoDue(t, a); if (due === 'yes') { if (i) { q.splice(i, 1); q.unshift(a); } return true; } if (due === 'wait') { seenN++; continue; }
        q.splice(i, 1); i--; (S.seen[k] || (S.seen[k] = {}))[a.key] = kday(); if (ctx.beat) ctx.beat(k); record(t, a, a.key, 'skip', [], { why: /^97[89]\d{10}$/.test(String(a.isbn || '')) ? `다시 볼 날 전(운영 규칙 ${refreshOf(t.src)}일 · 넘긴 일)` : 'ISBN 없는 상품은 운영 수집기가 그대로 함(넘긴 일)', quiet: true, noItem: true }); continue; }
      const st = preOf(t, a); if (st === 'go') { if (i) { q.splice(i, 1); q.unshift(a); } return true; }
      if (st === 'wait') { seenN++; continue; } q.splice(i, 1); i--; (S.seen[k] || (S.seen[k] = {}))[a.key] = kday(); preDrop(t, st.slice(5)); }
    return false; }
  function preDrop(t, why) { const d = kday(); if (S.day.d !== d) S.day = TK.dayNew(d); const s = TK.dayAdd(S.day, t.k, 'pre', []); const pw = s.preWhy || (s.preWhy = {}); pw[why] = (pw[why] || 0) + 1;
    S.preN = (S.preN || 0) + 1; if (now() - (S.preLog || 0) > 30 * 60e3) { S.preLog = now(); ctx.note(`🔎 운영 값 먼저 보기 — 운영이 아직 읽지 않은 책 ${S.preN}건은 바깥에 묻지 않음(헛 요청 줄임 · 견줄 수 있는 책만 묻기)`, { k: 'read', m: '그림자 일' }); S.preN = 0; } save(); }
  const ENDED_RE = /OpenAPI\s*서비스는\s*종료|서비스가\s*종료/;
  /* (11/11 col2rep5) 📚 도서관 정보나루 '…건 이상 요청 시 IP 등록이 필요' — 11/11 HOME 289건·JS-MAIN 20건 모두 이 답(이 PC 공인 IP가 키 계정에 없음 · 운영 로거는 됨) = 책 문제가 아님
   *  → 그날은 이 PC에서 더 묻지 않음(헛 요청 하루 수백 건 · 같은 운영 키의 하루 셈을 번외가 먹지 않게 — 약속 36 무손해) · 키 없음·틀림은 30분 쉼(웹앱이 키를 다시 넘길 때까지) */
  const DAYSTOP_RE = /IP\s*등록이\s*필요/; const KEYERR_RE = /키|key|401|403/i;

  /* ══ (11/12 handoff4 · 리드 '그림자 하루 몫이 이른 시각에 다 쓰임') ⚖ 알라딘 하루 몫 나누기 — 그림자 일 사이(로거 기본 · 사무실 PC는 col2.json jobs.share.on)
   *  11/12 로거: 하루 몫 400장을 🎯 숍 목록 끝까지(한 숍 최대 40쪽 · 차례가 있으면 먼저)와 표본을 먼저 채운 일이 아침에 거의 다 써, 낮 뒤엔 📈·🏷·👥·⭐가 표본을 못 채움
   *  규칙: ① 먼저 몫(need) = 그 일이 '넘길 수 있음' 판정에 필요한 만큼(하루 표본 기준 × 한 번 읽기 장 수 · 🎯 끝까지 = 한 숍 끝 쪽 최대 40장) — 아침부터 바로 씀
   *        ② 남는 몫 = (하루 몫 − 먼저 몫 합) ÷ 일 수 — 하루가 지난 만큼만 풀림(한국 시각 · 0시 1/24 … 24시 다) · 먼저 몫 합이 하루 몫보다 크면 먼저 몫을 그 비율로 줄임
   *        ③ 자기 몫을 다 쓴 일은 다른 일이 쉴 때(차례 없음·자기 몫도 다 씀)만 더 읽음 — 그때도 전체는 하루가 지난 만큼까지
   *  하루 몫(테더링 몫 LOGGER.dayCap)은 그대로 — 나누기만 함 · 셈 = 그 일이 실제로 받은 알라딘 몫(속도 규칙 PACE 하루 셈이 는 만큼) */
  const QCFG = () => { const q = C().share || {}; return { on: q.on == null ? kind() === 'logger' : q.on !== false, needBy: q.needBy || {} }; };
  const paceN = () => { try { const x = ctx.pace.state ? ctx.pace.state() : null; return x && Number.isFinite(+x.dayN) ? +x.dayN : null; } catch (e) { return null; } };
  const paceCap = () => { try { const x = ctx.pace.state ? ctx.pace.state() : null; return x && +x.dayCap > 0 ? +x.dayCap : 0; } catch (e) { return 0; } };
  const QD = () => { const d = kday(); if (!S.qd || S.qd.d !== d) S.qd = { d, by: {} }; return S.qd; };
  const dayFrac = () => { const t = new Date(now() + 9 * 3600e3); return Math.min(1, (t.getUTCHours() + 1 + t.getUTCMinutes() / 60) / 24); };
  const qAct = () => { const L = plan().filter((k) => { const t = TK.byK[k]; return t && t.cls === 'pub' && t.state === 'run' && k !== 'product'; }); if (ctx.voice && ctx.voice.on && ctx.voice.on()) L.push('voice'); return L; };
  function qNeed(k) { const nb = QCFG().needBy; if (nb[k] != null && +nb[k] >= 0) return +nb[k]; if (k === 'benchFull') return HOF.JOBS.bench.maxPages; if (k === 'voice') return 30;
    const t = TK.byK[k]; const P0 = P(); const by = P0.minNBy && +P0.minNBy[k]; const minN = by > 0 ? by : (t && t.minN) || P0.minN || 30; return minN * ((t && t.cost) || 1); }
  /* 일마다 { need, share, used } · 전체 { cap, frac, used, lim } */
  function qPlan() { const D = paceCap(); const act = qAct(); const by = QD().by; const fr = dayFrac(); const need = {}; let N = 0; for (const k of act) { need[k] = qNeed(k); N += need[k]; }
    const sc = N > D && N > 0 ? D / N : 1; const extra = act.length ? Math.max(0, D - N) / act.length : 0; const o = {}; let U = 0;
    for (const k of act) { const sh = Math.floor(need[k] * sc + extra * fr); o[k] = { need: Math.round(need[k] * sc), share: sh, used: +by[k] || 0 }; U += +by[k] || 0; }
    return { cap: D, frac: Math.round(fr * 100) / 100, used: U, lim: Math.floor(Math.min(N, D) + Math.max(0, D - N) * fr), jobs: o }; }
  const hasWork = (k) => { if (k === 'voice') return !!(ctx.voice && ctx.voice.pending && ctx.voice.pending()); if (k === 'benchFull') { try { return !!(S.bf && S.bf.cur) || !!(BF.pick && BF.pick()); } catch (e) { return false; } } return (S.q[k] || []).length > 0; };
  /* 그 일이 지금 알라딘 몫을 받아도 되나 */
  function qOk(k) { if (!QCFG().on || !paceCap()) return true; const Q = qPlan(); const x = Q.jobs[k]; if (!x) return true; if (x.used < x.share) return true;
    if (Q.used >= Q.lim) return false; return !Object.entries(Q.jobs).some(([k2, y]) => k2 !== k && y.used < y.share && hasWork(k2)); }
  const qAdd = (k, n) => { if (!k || !(n > 0)) return; const by = QD().by; by[k] = (by[k] || 0) + n; };

  /* 하나 하기 → { did, rest(ms), why } */
  async function step() { const n0 = paceN(); S.qLast = null; let r; try { r = await step0(); } finally { const n1 = paceN(); if (n0 != null && n1 != null && n1 > n0 && S.qLast) qAdd(S.qLast, n1 - n0); } return r; }
  async function step0() {
    const b = busy(); if (b && b.on) { if (now() - S.busyLog > 10 * 60e3) { S.busyLog = now(); ctx.note(`그림자 일 쉼 — 운영이 바쁨(${b.why || ''}) · 끝나면 이어감`, { k: 'rest', m: '그림자 일' }); } return { did: false, rest: ctx.BUSY.restMs, why: '운영이 바쁨: ' + (b.why || '') }; }
    settle(); benchFeed();
    if (BF && ((S.bf && S.bf.cur) || qOk('benchFull'))) { S.qLast = 'benchFull'; /* 읽던 숍은 끝까지(한 숍 최대 40장) */ let r = null; try { r = await BF.step(); } catch (e) { r = { did: false, rest: 10e3, why: '🎯 끝까지 읽기 ' + e.message }; } if (r && (r.did || !(S.q && Object.values(S.q).some((q) => q && q.length)))) return r; } /* (11/12 handoff3) 🎯 숍 목록 끝까지 — 차례가 있으면 먼저(다른 일이 쉴 때만 기다림) */
    if (inPlan('kpipa') && S.kpDay !== kday() && kpNeed()) { S.kpDay = kday(); S.kpAt = now(); push('kpipa', { day: kday() }, kday()); }
    else if (inPlan('kpipa') && ctx.handed && ctx.handed('kpipa') && now() - (S.kpAt || 0) > 3 * 3600e3) { S.kpAt = now(); const key = kday() + '_' + new Date(now() + 9 * 3600e3).getUTCHours(); push('kpipa', { day: kday() }, key); } /* (11/11 col2rep2) 넘긴 뒤엔 운영처럼 3시간마다 최근 7일(공표 뒤 고쳐짐) */
    if (inPlan('ext.fx') && S.fxDay !== kday() && TK.shareOk(kind(), kday().slice(-1), C()) && fxReady()) { S.fxDay = kday(); push('ext.fx', { day: kday() }, kday()); }
    const L = plan().filter((k) => k !== 'product' && (S.q[k] || []).length);
    /* (11/10) 🗣 판매자 구매평·문의 글 모으기(로거만) — 몫(처음 큼 → 점점 다른 일과 같게)만큼 차례를 받음 · 속도 규칙은 같이 셈 */
    const V = ctx.voice; const vTurn = !!(V && V.wantTurn(L.length)) && qOk('voice'); /* (11/12 handoff4) ⚖ 하루 몫 나누기 */
    if (!L.length && !vTurn) return { did: false, why: S.wait.length ? `운영 값 기다림 ${S.wait.length}건` : '그림자 일 차례 없음', rest: S.wait.length ? 5000 : 15e3 };
    /* (11/11 정범님 '바깥 사이트 읽기 몫') 알라딘 몫(ctx.pace — 사람 속도 두 배)은 알라딘 화면 일(cls pub)만 · 바깥 사이트 일(cls ext)은 사이트마다 따로(ctx.site — 운영 출처 간격·하루 상한)
     *  → 알라딘 하루 몫을 다 써도 바깥 일은 이어 가고, 바깥 한 사이트가 쉬어도 다른 사이트·알라딘은 그대로 */
    const pc = ctx.pace.check(); const alReady = pc.ok && !(pc.waitMs > 0); const siteOf = (k) => { const t = TK.byK[k]; return t && t.cls === 'ext' ? (t.reader === 'kp' ? 'kpipa' : t.src || k) : null; };
    const rests = []; const L2 = L.filter((k) => { const sk = siteOf(k); if (!sk || !ctx.site) { if (alReady && !qOk(k)) { rests.push({ ms: 10 * 60e3, why: '⚖ 오늘 이 일 몫을 다 씀(다른 그림자 일 먼저 · 하루가 지난 만큼 더 풀림)' }); return false; } if (!alReady) rests.push(pc.ok ? { ms: pc.waitMs + 50, why: '차례 기다림' } : { ms: pc.retryMs == null ? 30 * 60e3 : Math.min(pc.retryMs + 500, 30 * 60e3), why: pc.why }); return alReady; }
      const c = ctx.site.check(sk); if (c.ok && !(c.waitMs > 0)) return true; rests.push(c.ok ? { ms: c.waitMs + 50, why: '바깥 사이트 차례 기다림' } : { ms: c.retryMs == null ? 30 * 60e3 : Math.min(c.retryMs + 500, 30 * 60e3), why: c.why }); return false; });
    if (vTurn && !alReady) { rests.push(pc.ok ? { ms: pc.waitMs + 50, why: '차례 기다림' } : { ms: pc.retryMs == null ? 30 * 60e3 : Math.min(pc.retryMs + 500, 30 * 60e3), why: pc.why }); }
    if (!(vTurn && alReady) && !L2.length) { rests.sort((a, b) => a.ms - b.ms); const r0 = rests[0] || { ms: 15e3, why: '그림자 일 차례 없음' }; return { did: false, rest: r0.ms, why: r0.why }; }
    if (vTurn && alReady) { S.qLast = 'voice'; let r; try { r = await V.step(L.length); } catch (e) { r = { did: false, rest: 10e3, why: '🗣 ' + e.message }; } return r; }
    if (V) V.otherTurn();
    /* (11/10 밤 col2n) 표본이 모자란 일부터 — 예전엔 차례대로 돌아(일 수만큼 나눔) 표본 30개를 일찍 채운 일도 같은 몫을 받아, 하루 1,600장 몫이 낮 12시쯤 다 쓰이면 남은 일은 30개를 못 채움
     *  → 오늘 해 본 수(견줌+못 읽음+운영 값 없음+건너뜀)가 가장 적은 일 먼저(같으면 예전 차례) · 모든 일이 표본을 채운 뒤엔 다시 고르게 */
    /* (11/11 col2rep5) 🔎 운영 값 먼저 보기 · 🔑 키 쉼 — 차례 앞쪽에 바깥에 물을 책이 없는 일 · 키 문제로 쉬는 일은 이번엔 고르지 않음(다른 일이 차례를 받음) */
    /* (11/12 hot1 · 정범님 아침 'JS-MAIN 거의 멈춤') 11/11 04시 '바깥 사이트 몫 따로' 뒤 바깥 일은 알라딘 몫(시간 240장)을 안 쓰고 사이트마다 하루 상한(합 수만 번)만 봐서
     *  JS-MAIN이 11/12 0~9시에 그림자 일 5,232번(바깥 약 4,000 · 화면 그려 읽기 수백 번 — 1280×6000 화면)을 함 → 사무실 PC CPU·Defender가 막힘
     *  → 바깥 일 전체 한 시간 extHourCap(기본 90번) · 그 가운데 화면을 그릴 수 있는 출처(kind page) pageHourCap(기본 30번) — 넘으면 그 시간엔 쉼(근거: 없음 · 예전 공통 몫 시간 240장의 1/3쯤 · 설정 jobs.extHourCap·pageHourCap) */
    const HR = (a0) => { const t1 = now() - 3600e3; while (a0.length && a0[0] < t1) a0.shift(); return a0.length; };
    const extCap = C().extHourCap == null ? 90 : +C().extHourCap, pageCap = C().pageHourCap == null ? 30 : +C().pageHourCap;
    const isPage = (k0) => { const t0 = TK.byK[k0]; if (!t0 || t0.cls !== 'ext') return false; const x = X(); const so = x && x.SOURCES && x.SOURCES[t0.src]; return !!(so && so.kind === 'page'); };
    const extFull = extCap > 0 && HR(M.ext) >= extCap, pageFull = pageCap > 0 && HR(M.page) >= pageCap;
    const L3 = L2.filter((k0) => !(S.pause && S.pause[k0] > now()) && !(extFull && siteOf(k0)) && !(pageFull && isPage(k0)) && preReady(k0));
    if (!L3.length && (extFull || pageFull)) { const lim = extFull ? M.ext : M.page; const ms = Math.max(5000, (lim[0] || now()) + 3600e3 - now() + 500); if (now() - (M.capLog || 0) > 30 * 60e3) { M.capLog = now(); ctx.note(`그림자 일 쉼 — 바깥 사이트 한 시간 몫(${extFull ? '전체 ' + extCap + '번' : '화면 그리는 출처 ' + pageCap + '번'})을 다 씀 · 이 PC가 무거워지지 않게(${Math.round(ms / 60e3)}분 뒤 다시)`, { k: 'rest', m: '그림자 일' }); } return { did: false, rest: Math.min(ms, 10 * 60e3), why: '바깥 사이트 한 시간 몫을 다 씀' }; }
    if (!L3.length) return { did: false, rest: 2000, why: '외부 정보 — 운영 문서 먼저 받는 중(바깥 요청 없음)' };
    const k = pickK(L3); const t = TK.byK[k]; const SK = siteOf(k); const SP = ctx.site && SK ? { take: () => ctx.site.take(SK), ok: () => ctx.site.ok(SK), fail: (x) => ctx.site.fail(SK, x) } : ctx.pace; /* 바깥 일은 그 사이트 몫 */ const a = S.q[k].shift(); (S.seen[k] || (S.seen[k] = {}))[a.key] = kday(); { const sk = Object.keys(S.seen[k]); if (sk.length > SEENMAX) for (const x of sk.slice(0, sk.length - SEENMAX)) delete S.seen[k][x]; }
    if (SK) { M.ext.push(now()); if (isPage(k)) M.page.push(now()); } /* (11/12 hot1) 한 시간 몫 셈 */ S.qLast = k;
    if (S.ended && S.ended[k] === kday()) { record(t, a, a.key, 'skip', [], { why: '출처가 오늘 이 PC 요청을 받지 않음(서비스 끝 · IP 등록 필요) — 오늘은 묻지 않음', quiet: true, noItem: true }); return { did: true }; }
    /* (11/11 col2rep3) 🔀 넘긴 국중 — 운영처럼 다시 볼 날(120일)이 지난 책만 묻는다: 먼저 운영 문서(ext_basic/<ISBN>)를 웹앱에서 받아 보고(바깥 요청 없음) · 10분 안에 못 받으면 그냥 읽음 */
    if (HO_EXT(t) && handed(k)) { const due = hoDue(t, a); if (due === 'wait') { S.q[k].push(a); delete S.seen[k][a.key]; return { did: false, rest: 1500, why: '넘긴 일 — 운영 문서 먼저 받는 중' }; }
      if (due === 'no') { if (ctx.beat) ctx.beat(k); record(t, a, a.key, 'skip', [], { why: /^97[89]\d{10}$/.test(String(a.isbn || '')) ? `다시 볼 날 전(운영 규칙 ${refreshOf(t.src)}일 · 넘긴 일)` : 'ISBN 없는 상품은 운영 수집기가 그대로 함(넘긴 일)', quiet: true, noItem: true }); return { did: true }; } }
    const t0 = now(); let r;
    if (t.reader === 'al') { const p = TK.pathOf(t, a, own()); if (!p) { record(t, a, a.key, 'skip', [], { why: '정한 주소 꼴이 아님(또는 우리 숍)' }); return { did: true }; }
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { S.q[k].unshift(a); delete S.seen[k][a.key]; ctx.pace.fail('error'); return { did: false, rest: 10e3, why: '작업 창 준비 실패: ' + e.message }; }
      const tk = await ctx.pace.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      r = await br.readJob(ctx.aladin + p, t.parse, core.src, 30) || { ok: false, why: '빈 응답' }; if (r.ok) ctx.pace.ok(); else if (!r.needLogin) ctx.pace.fail(r.kind || 'error'); r.url = p; r.cv = (core.ver && core.ver['readnow-sellers-core.js']) || null; /* (11/12 handoff2) 넘긴 숍 요약의 rev6mTriedVer — 운영 RSV.VERSION과 같은 판 */ }
    else if (t.reader === 'dyn' || t.reader === 'nb' || t.reader === 'kp') { const back = (why, ms) => { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: ms || 5000, why }; };
      let core, br; try { core = await ctx.core(); br = await ctx.browser(); } catch (e) { SP.fail('error'); return back('작업 창 준비 실패: ' + e.message, 10e3); }
      if (t.reader === 'dyn' && !TK.pathOf(t, a, own())) { record(t, a, a.key, 'skip', [], { why: '정한 주소 꼴이 아님' }); return { did: true }; }
      for (let i = 0; i < (t.cost || 1); i++) { const tk = await SP.take(); if (!tk.ok) return back(tk.why); } /* 화면 통째(그림·스크립트까지)는 운영처럼 3장 몫 */
      try { r = t.reader === 'dyn' ? await dynRead(br, core, t, a) : t.reader === 'nb' ? await nbRead(br, core, a) : await kpRead(br, core); } catch (e) { r = { ok: false, why: e.message, kind: 'error' }; }
      if (r && r.ok) SP.ok(); else if (r && !r.needLogin) SP.fail(r.kind === '429' ? '429' : 'error'); }
    else { const tk = await SP.take(); if (!tk.ok) { S.q[k].unshift(a); delete S.seen[k][a.key]; return { did: false, rest: 5000, why: tk.why }; }
      S.curSite = SK; try { r = await extCall(t, a); } catch (e) { r = { ok: false, why: e.message }; } finally { S.curSite = null; } if (r && /HTTP (429|503)/.test(String(r.why || ''))) SP.fail('429'); else if (r && r.ok === false) SP.fail('error'); else SP.ok(); }
    /* (0.1.43 adapt10 · 약속 64) 🔄 번외 읽기 성적 → 목표·방법 장부(col2-ag.js) — 알라딘·그려 읽기는 일 종류마다 장부(칸마다 채움) · 바깥 시세는 출처가 길 · 읽기만 셈(차례·속도는 그대로) */
    try { const AGX = require('./col2-ag.js').get(); const rr = r || {}; if (AGX && !rr.skip && !rr.needLogin) { const isExt = !(t.reader === 'al' || t.reader === 'dyn' || t.reader === 'nb' || t.reader === 'kp'); const eng = isExt ? 'ext' : (t.reader === 'al' ? 'al_' : t.reader + '_') + String(t.k).replace(/[^\w]/g, '').slice(0, 24); const mid = isExt ? String(t.src || t.k) : t.reader;
      AGX.obs(eng, mid, { n: 1, ok: rr.ok ? 1 : 0, cost: t.cost || 1, ms: now() - t0, why: rr.ok ? null : rr.why });
      const pg = rr.page; if (rr.ok && pg && typeof pg === 'object') { const F = {}; if (Array.isArray(pg)) F.rows = { [mid]: pg.length || null }; else for (const k of Object.keys(pg).slice(0, 20)) { const v = pg[k]; if (v == null || typeof v !== 'object' || Array.isArray(v)) F[k] = { [mid]: Array.isArray(v) ? (v.length || null) : v }; } AGX.fill(eng, F); } } } catch (e) {}
    r = r || { ok: false, why: '빈 응답' }; const ms = now() - t0;
    if (r.skip) { record(t, a, a.key, 'skip', [], { why: r.skip, ms }); return { did: true }; }
    if (!r.ok && t.cls === 'ext' && DAYSTOP_RE.test(String(r.why || ''))) { (S.ended || (S.ended = {}))[k] = kday(); record(t, a, a.key, 'fail', [], { why: String(r.why || '').slice(0, 120), ms }); ctx.note(`${t.name} — '이 PC IP 등록이 필요' 답 → 오늘은 이 PC에서 더 묻지 않음(키 계정에 이 PC 공인 IP를 넣으면 다음 날부터)`, { k: 'read', l: 'warn', m: t.name }); return { did: true }; }
    if (!r.ok && t.cls === 'ext' && failKey(r.why) === '키 없음·틀림') { (S.pause || (S.pause = {}))[k] = now() + 30 * 60e3; }
    if (!r.ok && t.cls === 'ext' && ENDED_RE.test(String(r.why || ''))) { (S.ended || (S.ended = {}))[k] = kday(); record(t, a, a.key, 'skip', [], { why: '출처 서비스 끝 — ' + String(r.why || '').slice(0, 80), ms }); return { did: true }; }
    if (!r.ok) { record(t, a, a.key, r.needLogin ? 'skip' : 'fail', [], { why: r.why || '못 읽음', ms }); failStop(t); return { did: true }; }
    queue(t, a, r, ms); settle(); save(); return { did: true }; }

  /* (11/12 hot1) 오늘 거의 다 못 읽는 바깥 출처는 그날 남은 시간 쉼 — 11/12 JS-MAIN 예스24 도서 167번·예스24 중고 134번 모두 못 읽음(맞음 0) · 한 번마다 화면을 그려 최대 12~30초 기다림 = 헛일
   *  기준: 못 읽음 failStopN(기본 20) 이상 · 못 읽음 비율 90% 이상 · 설정 jobs.failStopN·failStopH(0이면 끔) · 근거: 없음 */
  function failStop(t) { if (!t || t.cls !== 'ext') return; const N = C().failStopN == null ? 20 : +C().failStopN, Hh = C().failStopH == null ? 3 : +C().failStopH; if (!(N > 0 && Hh > 0)) return;
    const s = S.day.t && S.day.t[t.k]; if (!s || (s.fail || 0) < N || (s.fail || 0) < 0.9 * ((s.n || 0) + (s.fail || 0))) return; if ((M.fsAt[t.k] || 0) > now() - Hh * 3600e3) return;
    const mid = Date.parse(kday() + 'T00:00:00+09:00') + 864e5; const until = C().failStopH == null ? Math.max(now() + 3600e3, mid) : now() + Hh * 3600e3; /* (리드 11/12) 기본은 오늘 남은 시간 내내(한국 자정까지) 쉼 · 다음 날 다시 해 봄 */
    M.fsAt[t.k] = now(); (S.pause || (S.pause = {}))[t.k] = until; ctx.note(`${t.name} — 오늘 ${s.fail}번 못 읽음(맞음 ${s.n || 0}) · ${new Date(until + 9 * 3600e3).toISOString().slice(11, 16)}까지 쉼(헛 화면 그리기·바깥 요청을 줄여 이 PC를 가볍게)`, { k: 'rest', l: 'warn', m: t.name }); }
  const tried = (k) => { const s = (S.day.d === kday() && S.day.t && S.day.t[k]) || null; let w = 0; for (const x of S.wait) if (x.k === k) w++; return w + (s ? (s.n || 0) + (s.fail || 0) + (s.noprod || 0) + (s.skip || 0) : 0); }; /* 운영 값을 기다리는 것도 셈(같은 일만 거듭 고르지 않게) */
  function pickK(L) { const off = S.rr++ % L.length; let best = null, bv = Infinity; for (let i = 0; i < L.length; i++) { const k = L[(off + i) % L.length]; const v = tried(k); if (v < bv) { bv = v; best = k; } } return best; }
  /* (0.1.10) 👥 구매자 분포 — 따로 된 칸 탭에 상품 화면을 그리고 운영 getProductFull(글자 그대로 · 받침 loadInFrame = 이 탭을 내려 보며 기다림) */
  async function dynRead(br, core, t, a) { const url = ctx.aladin + TK.pathOf(t, a, own()); const sec = ctx.pageSec || 25;
    const expr = `(async () => { globalThis.SET = { pageTimeoutSec: ${sec} }; const r = await Col2Lift.getProductFull(${JSON.stringify(url)}); if (!r || !r.page) return { ok: false, needLogin: !!(location.href && /login|adult/i.test(location.href)), why: '상품 화면을 못 읽음(로그인·19금 화면이거나 화면 모양이 다름)' }; const p = r.page;
      return { ok: true, page: JSON.parse(JSON.stringify({ buyerDist: p.buyerDist || null, relationBuy: p.relationBuy || [], clickRelation: p.clickRelation || [], clickRaw: ${handed('dynamic') ? 'p.clickRaw || null' : '!!p.clickRaw'} /* (11/12 handoff2) 넘긴 뒤엔 운영 dynOne처럼 원문까지 */, dynamicLoaded: !!p.dynamicLoaded })), finalUrl: r.finalUrl }; })()`;
    const r = await br.tabJob(url, core.src, expr, sec + 10); if (r && r.ok && r.page && !r.page.dynamicLoaded) r.page.note = '지연 로딩 칸이 정한 시간 안에 다 차지 않음(운영도 같은 표시 dynLoaded:false)'; return r; }
  /* (0.1.10) 🔍 새상품 없는 시세 — 운영 nbMarketJob(글자 그대로)을 알라딘 탭 떨어진 칸에서 이 상품 한 건만 · 쓰기는 메모리 칸(__col2.W)에서 꺼내 견줌 */
  async function nbRead(br, core, a) { const L = { usedCode: a.usedCode, listingId: a.listingId, title: a.title, price: a.price, bookId: null, active: true };
    const expr = `(async () => { const X = globalThis.__col2; X.W = []; X.n = 0; X.st = null; globalThis.SET = { pageTimeoutSec: 25 }; const K = ${JSON.stringify(a.key)}; globalThis.LISTINGS = new Map([[K, ${JSON.stringify(L)}]]);
      try { await Col2Lift.nbMarketJob(); } catch (e) { return { ok: false, why: '검색 시세 오류: ' + e.message, kind: 'error' }; } finally { globalThis.LISTINGS = new Map(); }
      const w = X.W.find((x) => x.p === 'prd_market_nobook/' + K); if (!w) return { ok: false, why: X.st && X.st !== 200 ? '서버 응답 ' + X.st : X.n ? '검색 화면에서 시세를 못 만듦' : '검색어를 만들 수 없음', kind: X.st === 429 || X.st === 503 ? '429' : 'error' };
      const m = w.v.market || {}; const vd = ${handed('nbMarket') ? "X.W.find((x) => x.p.indexOf('prd_market_nobook/' + K + '/v/') === 0)" : 'null'};
      return { ok: true, page: { median: m.median ?? null, low: m.low ?? null, n: m.n ?? null, candSig: w.v.candSig || null, cands: (w.v.cands || []).length }, n: X.n, ${handed('nbMarket') ? 'full: { main: w.v, vdoc: vd ? vd.v : null }' : 'full: null'} }; })()`;
    const r = await br.mainJob(core.src, expr, 40); if (r && r.full) { HOFULL.set(String(a.key), r.full); while (HOFULL.size > 40) HOFULL.delete(HOFULL.keys().next().value); delete r.full; } return r; }
  const HOFULL = new Map(); /* (11/11 col2rep3) 넘긴 시세 — 운영 nbMarketJob이 만든 문서 통째(메모리에만 · 40건) */
  /* (11/12 handoff4) 📦 상품 화면 묶음 — 📘 자동 읽기가 읽은 책(그 PC가 묶음 맡을 PC일 때만 · 기본 JS-MAIN · col2.json jobs.pubPc)을 차례에 넣음(도서 칸 견줌 결과·시장 지표 칸만 · 작게)
   *  넘겼으면 상품 화면 해석 통째를 메모리에만(20권) — 중고 첫 쪽까지 읽은 뒤 운영 칸 쓰기로 맡김 */
  const HOPUB = new Map(); const PUB_M = ['priceList', 'priceSales', 'salesPoint', 'rating', 'commentCount', 'reviewCount', 'availability'];
  const pubPc = () => String(C().pubPc || HOF.PUBSET.pc || '').toUpperCase(); const pubMine = () => kind() !== 'logger' && inPlan('pubset') && !!pubPc() && String(ctx.pc() || '').toUpperCase() === pubPc();
  function pubAfter(it, page, cmp) { if (!pubMine() || !it || !it.bookId || !page || !/^\d{1,13}$/.test(String(it.itemId || ''))) return false; const m = {}; for (const f of PUB_M) if (page[f] != null) m[f] = page[f];
    const a = { itemId: String(it.itemId), bookId: String(it.bookId), m, pv: (cmp && cmp.verdict) || 'noprod', pr: ((cmp && cmp.rows) || []).filter((x) => x.k !== 'same').map((x) => x.k).filter((x, i, A) => A.indexOf(x) === i).slice(0, 6) };
    if (!push('pubset', a, a.itemId)) return false; while ((S.q.pubset || []).length > 30) S.q.pubset.shift(); /* 상품 화면 읽기 한 번에 한 권씩 — 차례가 길게 쌓이지 않게 */
    if (handed('product')) { HOPUB.set(a.bookId, { page: JSON.parse(JSON.stringify(page)) }); while (HOPUB.size > 20) HOPUB.delete(HOPUB.keys().next().value); } return true; }
  /* (11/12 handoff4) 🔀 넘긴 📦 — 운영 market 규칙(마지막 확인 시각이 주기 밖)일 때만 상품 화면·중고 첫 쪽 해석을 맡김 · 웹앱만 씀(우리 상품 목록을 읽어야 해 클라우드 길 없음 · web) */
  function hoPub(w, v) { if (!handed('product')) return; if (ctx.beat) ctx.beat('product'); const F = HOPUB.get(String(w.id)); HOPUB.delete(String(w.id)); if (!F || !F.page || !F.used) return; if (!HOF.due('product', v || null, now())) return;
    if (ctx.opOut('product', 'prd_book_metrics', String(w.id), { pub: { itemId: String(w.a.itemId), page: F.page, used: F.used } }, { web: true })) ctx.note(`🔀 넘긴 일 📦 상품 화면 묶음 ${w.id} — 상품 화면·중고 첫 쪽을 운영 칸 쓰기로 맡김(웹앱이 운영 refreshOne0 그대로)`, { k: 'read', m: '🔀 넘김' }); }
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
    if (t.k === 'pubset') { const u = pg || {}; if (!Array.isArray(u.listings)) { record(t, a, a.key, 'fail', [], { why: '중고 첫 쪽을 못 읽음', ms }); return; } const F = HOPUB.get(String(a.bookId)); if (F) F.used = JSON.parse(JSON.stringify(u));
      S.wait.push({ k: t.k, a, id: String(a.bookId), c: t.col, sh: { ...(a.m || {}), usedTotal: u.usedTotal ?? null, tabs: u.tabs ?? null, mins: u.mins ?? null, buyback: u.buyback ?? null }, at: now(), ms }); return; }
    const id = t.id === 'bookId' ? a.bookId : TK.docId(t, a); if (!id) { record(t, a, a.key, 'noprod', [], { why: '운영 문서 이름 모름(bookId 없음)', ms }); return; }
    S.wait.push({ k: t.k, a, id, c: t.col, sh: t.shape === 'survey' ? TK.surveyDays(pg) : pg, at: now(), ms, ...(r.cv ? { cv: r.cv } : {}) }); }
  const slimRes = (r) => { const o = { ok: !!r.ok, none: !!r.none, skip: r.skip || null, why: r.why || null }; if (r.d !== undefined) o.d = r.d; if (r.rates) { o.rates = r.rates; o.src = r.src; o.date = r.date; o.warn = r.warn || null; } return o; };

  /* (11/11 col2rep2 · 약속 38·48) 🔀 넘긴 KPIPA — 이 PC로 넘겼으면(웹앱 ⚙ › 🔀 번외로 넘기기) 운영 kpipaJob과 같은 꼴로 mkt_kpipa/<날짜>에 씀(같으면 안 씀 · 바뀌면 옛 값을 history에) · 넘기지 않았으면 아무것도 안 함 */
  function hoKp(w, v, cmp) { if (!ctx.handed || !ctx.handed('kpipa') || !ctx.opOut) return; const sh = w.sh || {}; if (ctx.beat) ctx.beat('kpipa'); /* (🔬 정밀 점검 11/11) 값이 같아도 '돌렸다'는 소식 — 소식이 없으면 8시간 뒤 운영이 넘김을 풀고 최근 7일을 다시 받아 썼음 */ if (!sh.type || !sh.series || cmp.verdict === 'same') return; const pv = v && v[sh.type] && v[sh.type].series ? v[sh.type].series : null; const at = new Date().toISOString(); const id = String(w.id);
    if (ctx.opOut('kpipa', 'mkt_kpipa', id, { date: `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6)}`, [sh.type]: { series: sh.series, at } }, { hist: pv ? { at, type: sh.type, old: pv } : null })) ctx.note(`🔀 넘긴 일 📚 KPIPA ${id} ${sh.type === 'onOff' ? '판매채널별' : '도서유형별'} — ${pv ? '바뀐 값(옛 값은 history)' : '새 날'}을 운영 칸에 맡김(웹앱이 씀)`, { k: 'read', m: '🔀 넘김' }); }
  /* (11/11 col2rep3) 🔀 넘긴 국중 — 운영 extSave와 같은 결과 꼴 { at, chk, sig, none, d, by, q } · 지문은 운영 공용 파일 그대로 · 같음·바뀜·없음 판단과 옛 값 보관·색인은 웹앱이 운영 문서를 다시 읽고 함 */
  function hoExt(t, w) { if (!handed(t.k)) return; const res = w.res || {}; if (!res.ok || res.skip) return; const x = X(); if (!x || !x.sig) return; let d = res.d == null ? null : JSON.parse(JSON.stringify(res.d)); const at = new Date().toISOString();
    if (ctx.beat) ctx.beat(t.k); /* 값이 같아도 소식(beat) — 운영이 넘김을 풀지 않게 */
    if (d) { let g = 0; while (extBytes(d) > 150000 && g++ < 12) { if (Array.isArray(d.items) && d.items.length > 5) d.items = d.items.slice(0, Math.ceil(d.items.length / 2)); else if (d.kv) d.kv = null; else break; d.trunc = true; } } /* (11/11 col2rep5) 운영 extSave와 같은 줄임(출처 하나 150KB · 장터 글 목록이 길면 반씩) — 지문도 줄인 값으로 */
    const obj = { at, chk: at, sig: x.sig({ none: !!res.none, d }, t.src), none: !!res.none, d, by: '번외 ' + ctx.pc(), q: (d && d.q) || null };
    if (ctx.opOut(t.k, t.col, String(w.id), { obj, title: (w.a && w.a.title) || null, author: (w.a && w.a.author) || null })) ctx.note(`🔀 넘긴 일 ${t.name} ${w.id} — 운영 칸에 맡김(웹앱이 운영 문서와 견줘 같으면 확인 시각만 · 바뀌면 옛 값 보관 뒤)`, { k: 'read', m: '🔀 넘김' }); }
  /* (11/11 col2rep3) 🔀 넘긴 시세 — 떼어 온 운영 nbMarketJob이 만든 문서 그대로 · 시세 지문(sig = 중간값|최저|개수)과 history 한 줄은 운영과 같은 꼴 */
  function hoNb(w) { if (!handed('nbMarket')) return; const F = HOFULL.get(String(w.id)); if (!F || !F.main) return; HOFULL.delete(String(w.id)); const M = F.main; const mk = M.market || {}; const sig = `${mk.median}|${mk.low}|${mk.n}`;
    const main = {}; for (const [k0, v0] of Object.entries(M)) { if (k0 === 'history' || k0 === 'sig' || /^(writer|uploadedAt|by)$/.test(k0)) continue; main[k0] = v0; }
    const hist = { at: M.at || new Date().toISOString(), median: mk.median ?? null, low: mk.low ?? null, n: mk.n ?? null, our: (w.a && w.a.price) ?? null };
    if (ctx.opOut('nbMarket', 'prd_market_nobook', String(w.id), { main, vdoc: F.vdoc || null, sig, hist })) ctx.note(`🔀 넘긴 일 🔍 새상품 없는 시세 — 다시 본 시세를 운영 칸에 맡김(후보가 바뀌면 판 보관 · 시세가 바뀌면 history)`, { k: 'read', m: '🔀 넘김' }); }
  /* (11/11 col2rep3) 🔀 넘긴 환율 — 운영 extFx처럼 ext_fx/<고시일>이 없을 때만(웹앱이 다시 확인) · 수출입은행 출처만 */
  function hoFx(w, v) { if (!handed('ext.fx') || v) return; const res = w.res || {}; if (!res.ok || !res.rates || res.src !== 'koreaexim') return; const id = String(res.date || w.id);
    if (ctx.opOut('ext.fx', 'ext_fx', id, { date: id, rates: res.rates, src: res.src, warn: res.warn || null })) ctx.note(`🔀 넘긴 일 💱 환율 ${id} — 수출입은행 고시를 운영 칸에 맡김(없을 때만)`, { k: 'read', m: '🔀 넘김' }); }
  /* (11/12 handoff2 · 리드 '로거 고유 일 넘기는 길') 🔀 넘긴 로거 칸 일(👥 구매자 분포 · 🏪 숍 요약) — 운영 규칙으로 쓸 때만(운영 문서 v를 보고 30일·7일 · HOF.due) 읽은 값을 그대로 맡김
   *  실제 쓰기 규칙(운영 dynOne·rev6mJob)은 shadow/col2-handoff.js plan() 한 곳 — 웹앱·클라우드가 운영 문서를 다시 읽고 그 자리에서 셈 · 값이 같아도 맥박(beat)은 남김 */
  function hoPlan(t, w, v) { if (!handed(t.k)) return; if (ctx.beat) ctx.beat(t.k); if (!HOF.due(t.k, v || null, now())) return; const sh = w.sh || {};
    const val = t.k === 'dynamic' ? { dyn: { buyerDist: sh.buyerDist || null, relationBuy: Array.isArray(sh.relationBuy) ? sh.relationBuy : [], clickRelation: Array.isArray(sh.clickRelation) ? sh.clickRelation : [], clickRaw: sh.clickRaw && sh.clickRaw !== true ? sh.clickRaw : null, dynamicLoaded: !!sh.dynamicLoaded } } : { shop: sh, ver: w.cv || null };
    if (ctx.opOut(t.k, t.col, String(w.id), val)) ctx.note(`🔀 넘긴 일 ${t.name} ${w.id} — 운영 칸에 맡김(웹앱이 운영 문서를 다시 읽고 운영과 같은 규칙으로 씀)`, { k: 'read', m: '🔀 넘김' }); }
  /* (11/12 handoff2) 🏪 넘긴 숍 요약 차례 — 운영 rev6mJob처럼 7일 넘게 안 본 판매자(웹앱이 넘긴 판매자 목록 · rev6mAt/rev6mTriedAt만 · 우리 숍 뺌) */
  function feedStale(list) { if (!handed('shopSum')) return 0; const sc = []; for (const x of list || []) { const v = (x && x.v) || {}; if (!v.sc) continue; if (!HOF.due('shopSum', { rev6mAt: v.rev6mAt || null, rev6mTriedAt: v.rev6mTriedAt || null }, now())) continue; sc.push(String(v.sc)); }
    let n = 0; for (const s of sc) { if (!/^\d{1,10}$/.test(s) || own().includes(s)) continue; if (push('shopSum', { sc: s, from: 'stale' }, s)) n++; } if (n) { save(); ctx.note(`🏪 넘긴 숍 요약 — 7일 넘게 안 본 판매자 ${n}곳을 차례에 넣음(운영 규칙)`, { k: 'read', m: '🔀 넘김' }); } return n; }
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
    if (t.k === 'pubset') { const pv = (w.a && w.a.pv) || 'noprod'; const pr = (w.a && w.a.pr) || []; /* 📘 도서 칸 견줌(같은 상품 화면) + 📈·🏷 — 한 칸이라도 까닭 모를 다름이면 묶음도 다름 */
      if (pv === 'noprod' && cmp.verdict !== 'noprod') cmp = { ...cmp, verdict: 'noprod', reasons: [] }; else if (pv === 'diff') { const rs = [...new Set([...(cmp.reasons || []), ...(pr.length ? pr : ['diff'])])]; cmp = { ...cmp, verdict: 'diff', reasons: rs, rows: [{ f: '📘 도서 칸', k: rs.some((r) => TK.UNEXPLAINED.includes(r)) ? 'diff' : rs[0], prod: null, shadow: pr.join('·') || null }, ...(cmp.rows || [])] }; } }
    if (t.k === 'kpipa') hoKp(w, v, cmp); else if (t.k === 'pubset') hoPub(w, v); else if (t.k === 'dynamic' || t.k === 'shopSum') hoPlan(t, w, v); else if (t.k === 'nbMarket') hoNb(w); else if (t.src === 'fx') hoFx(w, v); else if (HO_EXT(t)) hoExt(t, w);
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
    ctx.out('col2_jday', `${d}_${String(pcn).replace(/[^\w.-]/g, '_')}`.slice(0, 150), { d, pc: pcn, kind: kind(), at: new Date().toISOString(), ver: ctx.VERSION, rule: ps.rule, tasks: summary(), ...(QCFG().on && paceCap() ? { share: qPlan() } : {}) }); /* (11/12 handoff4) ⚖ 하루 몫 나누기(일마다 먼저 몫·몫·쓴 장) */
    const was = S.last && S.last[t.k]; S.last = { ...(S.last || {}), [t.k]: { at: now(), v, can: ps.can } };
    const lab = { same: '같음', diff: '다름', fail: '못 읽음', noprod: '운영 값 없음', skip: '건너뜀' }[v] || v;
    if (!x.quiet) ctx.note(`${t.name} ${id} — ${lab}${reasons && reasons.length ? '(' + reasons.map((r) => TK.WHY[r] || r).join('·') + ')' : ''}${x.why ? ' · ' + x.why : ''}`, { k: 'read', l: v === 'same' ? 'ok' : v === 'diff' && reasons.some((r) => TK.UNEXPLAINED.includes(r)) ? 'warn' : v === 'fail' ? 'warn' : 'info', m: t.name, d: { task: t.k, v, ms: x.ms || null } });
    if (ps.can && !(was && was.can)) ctx.note(`✅ ${t.name} — 오늘 '넘길 수 있음'(표본 ${ps.n} · 같음 ${ps.rate}% · ${ps.rule})`, { k: 'read', l: 'ok', m: t.name });
    save(); }
  const BF = require('./col2-benchfull.js').makeBenchFull({ ctx, S, save: (f) => save(f), record: (t, a, id, v, rs, x) => record(t, a, id, v, rs, x), own, now }); /* (11/12 handoff3) */
  function summary() { const P0 = P(); const o = {}; for (const [k, s] of Object.entries(S.day.t || {})) { const t = TK.byK[k]; o[k] = { name: t ? t.name : k, n: s.n, same: s.same, diff: s.diff, un: s.un, fail: s.fail, noprod: s.noprod, skip: s.skip, pre: s.pre || 0, preWhy: s.preWhy || undefined, why: s.why, failWhy: s.failWhy ? Object.fromEntries(Object.entries(s.failWhy).sort((a, b) => b[1] - a[1]).slice(0, 6)) : undefined, pass: TK.passOf(s, P0, k) }; } return o; }
  /* 화면용 — 일 목록(이 PC가 하는지 · 차례 · 오늘 셈 · 넘길 수 있음) */
  function view() { const pl = plan(); const sm = summary(); const lg = kind() === 'logger';
    return { kind: kind(), pc: ctx.pc(), d: S.day.d, rule: TK.passOf(null, P()).rule, wait: S.wait.length, busy: busy(), tasks: TK.TASKS.map((t) => ({ k: t.k, name: t.name, ops: t.ops, cls: t.cls, reader: t.reader, col: t.col, who: t.who, state: t.state, why: t.why || null, note: t.note || null,
      mine: pl.includes(t.k), notMine: pl.includes(t.k) ? null : t.state === 'ended' ? `종료됨(${t.ended}) — 묻지 않음` : t.state !== 'run' ? '아직 안 돎' : t.who === 'logger' && !lg ? '로거 고유 일(사무실 PC는 안 함)' : t.who === 'office' && lg ? '사무실 PC 일(로거는 안 함)' : t.who === 'share' && lg ? '외부 정보 — 사무실 PC가 함(나눔 꺼짐 · col2.json jobs.extShare)' : '꺼 둠', q: (S.q[t.k] || []).length, today: sm[t.k] || null })) }; }
  /* 📘 공개 상품 화면(0.1.2부터 도는 자동 읽기)의 결과도 같은 하루 셈에 — col2_books는 그 길이 이미 씀(여기서는 하루 요약만) */
  function addProduct(itemId, verdict, reasons, why) { const t = TK.byK.product; if (!t || !TK.plan(kind(), C()).includes('product')) return; record(t, { key: String(itemId) }, String(itemId), verdict, reasons || [], { noItem: true, quiet: true, why: why || null }); }
  return { step, qPlan, qOk, benchFull: () => BF.view(), addProduct, pubAfter, pubMine, pickK, tried, feedBooks, feedShops, feedStale, feedNb, qLen, bookQ, view, plan, summary, _S: () => S, save };
}
module.exports = { makeJobs };
