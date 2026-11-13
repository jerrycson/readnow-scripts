/* col2solo.js — (11/12 col2solo1 · 정범님 11/12 0시 '번외 수집기는 웹앱이 열려 있어야 하나? 웹앱 열림이나 운영 수집기 없이 돌게') 🔌 번외 홀로 연결 — 클라우드 창구 /c2/solo
 *
 * 왜: 번외(lab/col2 · 그 PC 127.0.0.1 도우미)는 Firestore에 직접 못 씀 — 상태·설정·넘긴 일·결과는 그 PC 웹앱 탭(c2RelayTick)이,
 *     네이버 열쇠·상태는 웹앱(nvRelayTick)·운영 수집기 다리(rnC2nv)가 대신 올렸음 → 웹앱 탭·수집기 탭이 없으면 번외 소식이 멈춤(11/11 로거 12:34 뒤 멈춤)
 * 어떻게(ALPS 도우미 /alps-helper와 같은 꼴):
 *  · PC마다 번외가 Ed25519 열쇠쌍을 만듦 — 개인 열쇠는 그 PC Windows DPAPI 잠근 파일에만(평문 없음) · 공개 열쇠만 웹앱에 보임
 *  · 웹앱 ⚙ 설정 › 🔀 번외 칸 「🔐 이 기기 등록」(두 번 누름) → app_settings/col2_solo.pcs.<PC> = { pub, fp, at, by, kind } (관리자 기기 아니면 reqs에 남겨 관리자 기기가 허락)
 *  · 번외는 요청마다 몸(raw)에 서명(머리 x-rn-sig) · 클라우드는 그 PC 공개 열쇠로 확인 · 시각 ±5분 · 같은 nonce 두 번 거절
 *  · 서명이 맞으면 **그 PC 칸만** 씀 — col2_ctl/<그 PC> · col2_* 허용 칸(PC 이름이 든 문서는 그 PC 이름만) · 🔀 넘긴 일(그 PC로 넘긴 일 · 넘김 표 안만 · 운영 쓰기 규칙 그대로)
 *    · 모든 PC 공통 설정(app_settings/col2_cfg — 설정 표 안 값만) · 넘김 맥박 · 🟩 네이버(로거 PC만 — 받는 열쇠·상태·봉투 넘기기·읽은 것)
 *  · 견줄 운영 값(읽기만)은 웹앱과 같은 칸·같은 로거 규칙(약속 0)만 — 손님 정보가 든 칸(prd_listings·shp_state·crm_interactions)과 운영 키(app_secrets)는 이 길로 주지 않음(웹앱만)
 * 겹침: 번외가 홀로 연결이 살아 있으면(3분 안 성공) 웹앱·수집기 다리에 같은 일을 내주지 않음(번외 쪽에서 막음) — 한 일은 한 길로만
 * 로거(약속 0): 로거 번외가 우리 클라우드(우리 서버)에 닿을 뿐 — 알라딘·예스24 계정·쿠키·우리 숍 화면·우리 상품 목록은 오가지 않음(로거에는 표본·운영 키·우리 상품 칸을 주지 않음) */
'use strict';
const crypto = require('crypto');
const PC_RE = /^[A-Za-z0-9가-힣._-]{1,40}$/;
const RID = /^[\w.-]{1,150}$/;
const pcSafe = (pc) => String(pc || '').replace(/[^\w-]/g, '_'); /* 번외가 문서 이름에 PC를 넣는 꼴(col2-al·col2-alw day_…_<PC>) */
const pcSafe2 = (pc) => String(pc || '').replace(/[^\w.-]/g, '_'); /* col2-jobs·col2-voice 꼴 */
/* 번외 결과 칸(col2_*) — 이 길로 쓸 수 있는 칸만 · pc: 문서 이름에 PC가 들면 그 PC만(남의 PC 칸 못 씀) */
const OUT_OK = {
  col2_runs: { re: /^[\w.-]{1,150}$/ }, col2_books: { re: /^[\w.-]{1,150}$/ }, col2_jobs: { re: /^[\w.-]{1,150}$/ },
  col2_jday: { re: /^\d{4}-\d{2}-\d{2}_[\w.-]{1,60}$/, pc: (id, pc) => id.slice(11) === pcSafe2(pc).slice(0, 139) },
  col2_al: { re: /^[\w.-]{1,150}$/, pc: (id, pc) => !/^day_/.test(id) || id.endsWith('_' + pcSafe(pc)) },
  col2_alw: { re: /^[\w.-]{1,150}$/, pc: (id, pc) => !/^day_/.test(id) || id.endsWith('_' + pcSafe(pc)) },
  col2_voice: { re: /^[\w.-]{1,150}$/ }, col2_voice_s: { re: /^[\w.-]{1,150}$/ },
  col2_voice_run: { re: /^[\w.-]{1,100}$/, pc: (id, pc) => id === pcSafe2(pc).slice(0, 100) },
};
/* 🟩 네이버 — 웹앱 NV_OUT_OK와 같음(로거 PC만) */
const NV_OUT_OK = { crm_naver_orders: /^[\w-]{2,40}$/, nv_listings: /^\d{1,20}$/, col2_naver_jobs: /^[\w.-]{4,150}$/, nv_inq: /^[cq]\d{1,20}$/, nv_settle: /^\d{8}(_[A-Z_]{1,12})?$/, nv_settle_case: /^[\w-]{4,120}$/ };
/* 견줄 운영 값(읽기만) — 웹앱 C2R.ok에서 손님 정보 칸(C2AL_ID)을 뺀 것 · 로거 금지 칸은 웹앱 C2_LG_NO와 같음 */
const BS_KEEP = ['name', 'day', 'complete', 'runAt', 'endAt', 'total', 'lastPage', 'chunks', 'startDay', 'okRunAt', 'writer', 'prog']; /* (11/12 handoff3) 웹앱 C2_BS_KEEP과 같음 */
const READ_OK = ['bench_state', 'bench_chunk', 'prd_ids', 'prd_books', 'prd_book_metrics', 'bench_items', 'sellers', 'seller_review_daily', 'ext_basic', 'ext_used', 'ext_foreign', 'ext_lib', 'ext_ebook', 'ext_fx', 'app_settings', 'mkt_kpipa', 'prd_market_nobook'];
const LG_NO = ['prd_ids', 'prd_books', 'prd_listings', 'shp_state', 'crm_interactions', 'prd_market_nobook'];
const READ_RE = { mkt_kpipa: /^\d{8}$/, bench_state: /^\d{1,10}$/, bench_chunk: /^\d{1,10}\.\d{1,2}$/ };
const SOLO_DOC = 'col2_solo', SEEN_DOC = 'col2_solo_seen';
/* (11/13 home2 · 정범님 '번외를 크롬·웹앱이랑 항상 같이 열어 줘야 하나?') 🟧 알라딘 그림자가 견줄 운영 칸 — 웹앱 C2AL_ID·c2alTrim과 같은 이름 규칙·같은 칸만(번호·상태·값 · 구매자·수령인·주소·전화·문의 글 없음)
 *  예전엔 이 세 칸을 홀로 연결로 주지 않아(웹앱만) 웹앱 탭이 닫히면 견줌이 10분 기다리다 '운영 문서 못 받음'이 됐음 → 클라우드가 서버 쪽에서 거른 뒤에만 줌 · 로거에는 주지 않음(LG_NO · 약속 0) · 번외도 받는 순간 trimProd로 다시 거름 */
const AL_ID = { prd_listings: /^aladin_[\w-]{1,40}$/, shp_state: /^(confirm|current)$/, crm_interactions: /^aladin_qna_\d{1,15}$/ };
function alTrim(c, v) { if (!v || typeof v !== 'object') return null; const pick = (ks) => { const o = {}; for (const k of ks) if (v[k] !== undefined) o[k] = v[k]; return o; };
  if (c === 'prd_listings') return pick(['usedCode', 'listingId', 'status', 'price', 'sku', 'grade', 'qty', 'qtyList', 'active', 'lastSeenAt', 'seenBy_scm']);
  if (c === 'shp_state') return { at: v.at || null, tabCounts: v.tabCounts && typeof v.tabCounts === 'object' ? { ...v.tabCounts } : null, orders: Array.isArray(v.orders) ? v.orders.map((o) => ({ orderNo: String((o && o.orderNo) || ''), items: Array.isArray(o && o.items) ? o.items.map((i) => ({ listingId: i && i.listingId != null ? String(i.listingId) : null })) : [], deliveryNo: (o && o.deliveryNo) || null })) : null };
  if (c === 'crm_interactions') return pick(['questionId', 'answerStatus']); return null; }

/* ── 상태 요약 — 웹앱 c2Sum·c2ySum·c2alSum과 같은 칸(받은 값을 다시 거름 · 손님 정보 없음) ── */
const nums = (o) => { if (!o || typeof o !== 'object') return null; const r = {}; for (const [k, v] of Object.entries(o)) if (/^[a-zA-Z]{1,12}$/.test(k) && isFinite(+v)) r[k] = +v; return Object.keys(r).length ? r : null; };
const ySum = (y) => y ? { on: !!y.on, logger: !!y.logger, holder: y.holder ? String(y.holder).slice(0, 40) : null, mine: y.mine !== false, already: y.already && typeof y.already === 'object' ? { at: +y.already.at || null, n: +y.already.n || 0, first: +y.already.first || null } : null, login: y.login || null, re: y.re && typeof y.re === 'object' ? { has: !!y.re.has, on: y.re.on !== false, auto: !!y.re.auto, stop: y.re.stop ? String(y.re.stop).slice(0, 200) : null, last: y.re.last ? String(y.re.last).slice(0, 200) : null, today: +y.re.today || 0, next: +y.re.next || null, hist: Array.isArray(y.re.hist) ? y.re.hist.slice(-10).map((h) => ({ at: +(h && h.at) || null, ok: !!(h && h.ok), how: h && h.how ? String(h.how).slice(0, 12) : null, why: h && h.why ? String(h.why).slice(0, 140) : null })) : null /* (11/13 home2) 다시 로그인 자취 — 시각·됨·까닭 글만 */ } : null, reWhy: y.reWhy && y.reWhy.why ? String(y.reWhy.why).slice(0, 200) : null, active: !!y.active, ordAt: y.ordAt || null, ordErr: y.ordErr ? String(y.ordErr).slice(0, 160) : null, prdAt: y.prdAt || null, prdN: +y.prdN || 0, calls: y.day ? +y.day.calls || 0 : 0, recs: y.day ? +y.day.recs || 0 : 0, sent: +y.sent || 0, q: +y.q || 0, msg: String(y.msg || '').slice(0, 160), main: nums(y.main), opsNum: nums(y.opsNum), opsAt: y.ops ? y.ops.end || y.ops.at || null : null } : null;
const alSum = (a) => a ? { on: !!a.on, logger: !!a.logger, login: a.login || null, active: !!a.active, seat: !!a.seat, pp: a.pp ? String(a.pp).slice(0, 160) : null, n: a.day ? +a.day.n || 0 : 0, same: a.day ? +a.day.same || 0 : 0, diff: a.day ? +a.day.diff || 0 : 0, wait: a.day ? +a.day.wait || 0 : 0, msg: String(a.msg || '').slice(0, 160), w: a.w && typeof a.w === 'object' ? { on: !!a.w.on, n: +a.w.n || 0, same: +a.w.same || 0, diff: +a.w.diff || 0, bad: +a.w.bad || 0, refuse: +a.w.refuse || 0, pct: a.w.pct == null ? null : +a.w.pct, hand: Array.isArray(a.w.hand) ? a.w.hand.slice(0, 6).map((x) => String(x).slice(0, 40)) : [] } : null } : null;
const clean = (v, drop) => { const o = JSON.parse(JSON.stringify(v == null ? null : v)); if (o && drop) for (const k of drop) delete o[k]; return o; }; /* drop = 번외가 모르는 칸(인쇄 도우미가 붙이는 판·받은 묶음 등) — 웹앱이 쓴 값을 null로 덮지 않게 뺌 */
function stSum(j) { if (!j || typeof j !== 'object') return null; return clean({ ver: j.ver || null, running: !!j.running, on: !!j.on, want: !!j.want, dayN: j.dayN != null ? +j.dayN : null, dayCap: j.dayCap != null ? +j.dayCap : null, last: j.last ? { at: j.last.at || null, ok: !!j.last.ok, itemId: j.last.itemId || null } : null, msg: String(j.msg || '').slice(0, 200), helper: j.helper || null, have: j.have || null, upd: j.upd && (j.upd.msg || j.upd.at) ? { at: j.upd.at || null, msg: String(j.upd.msg || '').slice(0, 160) } : null,
  chrome: j.chrome && j.chrome.last ? { why: String(j.chrome.last.why || '').slice(0, 240), at: j.chrome.last.at || null, code: j.chrome.last.code != null ? j.chrome.last.code : null, fails: +j.chrome.fails || 0, coolUntil: j.chrome.coolUntil || null } : null, lap: j.auto && j.auto.lap ? { n: +j.auto.lap.n || 1, read: +j.auto.lap.read || 0 } : null, chk: j.chk && j.chk.at ? { at: j.chk.at, ok: !!j.chk.ok } : null, y24: ySum(j.y24), al: alSum(j.al), set: j.set && typeof j.set === 'object' && JSON.stringify(j.set).length < 20000 ? j.set : null, load: j.load && typeof j.load === 'object' ? { pct: Number.isFinite(+j.load.pct) && j.load.pct != null ? +j.load.pct : null, hot: !!j.load.hot, ps: Number.isFinite(+j.load.ps) && j.load.ps != null ? +j.load.ps : null } : null, /* (11/12 rel9) 🪫 이 PC CPU %(1분)·쉬는 중·창 다루기 PowerShell 시간당 횟수 */ at: new Date().toISOString() }, ['helper', 'have', 'chk', 'upd'].filter((k) => j[k] === undefined)); }
/* 바뀌었나 견줄 지문 — 시각·분마다 바뀌는 수는 뺌(웹앱 1.78.441과 같은 규칙) */
function stSig(s) { const o = { ...(s || {}) }; delete o.at; delete o.load; /* (rel9) CPU %는 늘 바뀜 — 지문에서 빼 5분에 한 번만 함께 실림 */ if (o.y24 && typeof o.y24 === 'object') { o.y24 = { ...o.y24 }; for (const k of ['at', 'calls', 'recs', 'sent', 'q']) delete o.y24[k]; } return JSON.stringify(o); }
/* 운영 도서 문서 — 번외가 견줄 칸만(fields · 이름 꼴만 받음 · 40개까지) */
const trimF = (v, F) => { if (!v || !F) return v; const o = {}; for (const k of F) if (v[k] !== undefined) o[k] = v[k]; return o; };
const benchTrim = (v) => ({ targets: (Array.isArray(v && v.targets) ? v.targets : []).filter((t) => t && t.sc).slice(0, 200).map((t) => ({ sc: String(t.sc), on: t.on !== false })) });
const nbTrim = (v) => { if (!v || typeof v !== 'object') return null; const o = {}; for (const k of ['usedCode', 'listingId', 'title', 'query', 'at', 'src', 'candSig', 'our']) if (v[k] !== undefined) o[k] = v[k];
  const m = v.market; if (m && typeof m === 'object') o.market = { median: m.median ?? null, low: m.low ?? null, n: m.n ?? null }; if (v.sig !== undefined) o.sig = v.sig; return o; };
const tsOf = (v) => (v && typeof v.toDate === 'function' ? v.toDate().toISOString() : v);
const tsFix = (o) => { if (!o || typeof o !== 'object') return o; if (Array.isArray(o)) return o.map(tsFix); if (typeof o.toDate === 'function') return o.toDate().toISOString(); const r = {}; for (const [k, v] of Object.entries(o)) r[k] = tsFix(v); return r; };

function makeSolo({ db, C, FV, log, mods, now }) {
  now = now || Date.now; log = log || (() => {});
  const M = { seen: new Map(), pubs: null, pubAt: 0, stSig: new Map(), seenW: new Map(), nvSig: null, nvAt: 0, nvPub: null };
  const iso = () => new Date(now()).toISOString();
  async function pubs(force) { if (!force && M.pubs && now() - M.pubAt < 60e3) return M.pubs; const d = await C('app_settings').doc(SOLO_DOC).get(); M.pubs = (d.exists && (d.data() || {}).pcs) || {}; M.pubAt = now(); return M.pubs; }
  /* 서명·시각·nonce 확인 — [code, body] | { b, pc, K } */
  async function check(raw, sig) { let b; try { b = JSON.parse(Buffer.from(raw).toString('utf8')); } catch (e) { return [400, { ok: false, err: 'JSON 아님' }]; }
    const pc = String((b && b.pc) || ''); if (!PC_RE.test(pc)) return [400, { ok: false, err: 'PC 이름' }];
    let P = await pubs(); let K = P[pc]; if (!K) { P = await pubs(true); K = P[pc]; } /* 막 등록한 기기 — 기억을 기다리지 않음 */
    if (!K || !K.pub) return [403, { ok: false, reg: 'need', err: `이 PC(${pc}) 번외는 아직 등록되지 않음 — 그 PC 웹앱 ⚙ 설정 › 🔀 번외 칸에서 「🔐 이 기기 등록」` }];
    if (K.off) return [403, { ok: false, reg: 'off', err: '이 PC 번외 홀로 연결을 관리자가 끊어 둠(⚙ 설정 › 🔀 번외 칸)' }];
    let good = false; try { good = crypto.verify(null, Buffer.from(raw), crypto.createPublicKey(K.pub), Buffer.from(String(sig || ''), 'base64')); } catch (e) { good = false; }
    if (!good) return [403, { ok: false, reg: 'bad', err: '서명이 맞지 않음(등록한 열쇠와 다름 — 번외 열쇠가 바뀌었으면 다시 등록)' }];
    const ts = +b.ts || 0; if (Math.abs(now() - ts) > 5 * 60e3) return [403, { ok: false, err: '시각이 5분 넘게 다름(PC 시계 확인)' }];
    const nk = pc + ':' + String(b.nonce || ''); if (!/^[\w-]{8,64}$/.test(String(b.nonce || '')) || M.seen.has(nk)) return [403, { ok: false, err: '같은 요청이 다시 옴' }]; M.seen.set(nk, ts);
    if (M.seen.size > 5000) for (const [k, t] of M.seen) if (now() - t > 6 * 60e3) M.seen.delete(k);
    return { b, pc, K }; }
  const isLogger = (pc, K, b) => /^LOGGER/i.test(pc) || (K && K.kind === 'logger') || (b && b.kind === 'logger');

  /* ① 상태 — col2_ctl/<그 PC> (웹앱 c2Ctl과 같은 꼴 + solo) · 요약이 같으면 5분에 한 번 */
  async function putSt(pc, b) { const s = stSum(b.st); if (!s) return null; const g = stSig(s); const w = M.stSig.get(pc); if (w && w.g === g && now() - w.at < 5 * 60e3) return 'same';
    await C('col2_ctl').doc(pc).set({ at: iso(), by: '번외 홀로 ' + pc, st: s, solo: { at: iso(), ver: String(b.ver || '').slice(0, 20) } }, { merge: true }); M.stSig.set(pc, { g, at: now() }); return 'put'; }

  /* ② 넘긴 일(운영 칸) — 웹앱 c2HoWrite·c2HoWriteMode와 같은 규칙(넘김 표 lab/col2/shadow/col2-handoff.js) */
  async function hoWrite(o, pc, hoDoc, X, HOF) { const k = String(o.job || ''); const J = HOF.JOBS[k]; if (!J) return '넘김 표에 없는 일';
    const w = HOF.writeOk(hoDoc, o, pc); if (!w.ok) return w.why; const v = w.v; const id = String(o.id); const by = '번외 ' + pc; const W2 = { writer: by, uploadedAt: FV.serverTimestamp() }; const t = iso(); const ref = C(J.col).doc(id);
    if (J.mode === 'bench') return benchW(id, v, pc, HOF); /* (11/12 handoff3) 🎯 숍 목록 끝까지 — 웹앱 c2HoBenchW와 같음 */
    if (J.mode === 'plan') { /* (11/12 handoff2) 로거 칸 일 — 웹앱 c2HoPlanW와 같음: 운영 문서를 다시 읽고(HOF.reads) 규칙 파일 plan()이 낸 쓰기만 한 묶음으로 · 칸 밖이면 거절(HOF.planCheck) */
      if (!HOF.plan || !HOF.reads || !HOF.planCheck) return '넘김 규칙 파일이 옛 판(plan 없음)'; const docs = {}; for (const [c, d] of HOF.reads(k, id)) { const g = await C(c).doc(String(d)).get(); docs[c + '/' + d] = g.exists ? g.data() || {} : null; }
      const W = HOF.plan(k, id, v, docs, { now: t, day: new Date(now() + 9 * 3600e3).toISOString().slice(0, 10) }); const bad = HOF.planCheck(k, W); if (bad) return bad;
      const fv = (o0) => { const r = {}; for (const [kk, x] of Object.entries(o0 || {})) { const ob = x && typeof x === 'object' && !Array.isArray(x); r[kk] = ob && Array.isArray(x.$au) ? FV.arrayUnion(...x.$au) : ob && Array.isArray(x.$ar) ? FV.arrayRemove(...x.$ar) : x; } return r; };
      const bt = db.batch(); for (const w of W) { const ref2 = C(w.c).doc(String(w.id)); const full = w.bare ? fv(w.v) : { ...fv(w.v), ...W2 }; if (w.set) bt.set(ref2, full); else bt.set(ref2, full, { merge: true }); } await bt.commit(); return true; }
    if (!J.mode) { const up = { ...v, ...W2 }; if (J.hist && o.hist && typeof o.hist === 'object') up.history = FV.arrayUnion({ at: String(o.hist.at || t), type: String(o.hist.type || ''), old: o.hist.old ?? null, by }); await ref.set(up, { merge: true }); return true; }
    if (J.mode === 'once') { if (!v.rates || !(+v.rates.USD > 0)) return '환율 값이 없음'; const ex = await ref.get(); if (ex.exists) return true;
      await ref.set({ date: v.date || id, rates: v.rates, src: v.src, warn: v.warn || null, at: t, by, ...W2 }); const kd = new Date(now() + 9 * 3600e3); const day = kd.toISOString().slice(0, 10);
      await C('app_settings').doc('ext_run').set({ fx: { day: kd.getUTCHours() * 60 + kd.getUTCMinutes() >= 11 * 60 + 30 ? day : null, date: v.date || id, src: v.src, usd: v.rates.USD, at: t, err: null, by } }, { merge: true }).catch(() => {}); return true; }
    if (J.mode === 'nb') { const Mn = v.main; const cur = await ref.get(); if (!cur.exists) return '처음 보는 상품은 운영이 씀(이미 본 상품만 번외)'; const old = cur.data() || {};
      if (v.vdoc && typeof v.vdoc === 'object' && old.candSig !== Mn.candSig) await ref.collection('v').doc(String(Mn.at || t).replace(/[:.]/g, '-')).set({ at: v.vdoc.at || Mn.at || t, query: v.vdoc.query || Mn.query || null, cands: v.vdoc.cands || [], market: v.vdoc.market || null, ...W2 });
      const up = { ...Mn, ...W2 }; delete up.history; delete up.sig; if (old.sig !== v.sig) { up.sig = v.sig; up.history = FV.arrayUnion({ at: (v.hist && v.hist.at) || t, median: v.hist ? v.hist.median ?? null : null, low: v.hist ? v.hist.low ?? null : null, n: v.hist ? v.hist.n ?? null : null, our: v.hist ? v.hist.our ?? null : null }); }
      await ref.set(up, { merge: true }); return true; }
    if (J.mode === 'ext') { if (!X || !X.SOURCES || !X.SOURCES[J.src]) return '외부 정보 공용 파일이 없음'; const obj = v.obj; const src = J.src; const grp = X.SOURCES[src].grp;
      await db.runTransaction(async (tx) => { const snap = await tx.get(ref); const cur = snap.exists ? snap.data() : null; const prev = cur && cur.src ? cur.src[src] : null; const tt = obj.chk || obj.at || t;
        const same = prev ? (X.sameSig ? X.sameSig(src, prev, obj.sig) : prev.sig === obj.sig ? 'sig' : '') : ''; const S2 = { ...((cur && cur.src) || {}) }; const p0 = { ...(prev || {}) }; let hist = null;
        if (same) { p0.chk = tt; delete p0.err; delete p0.noneAt; if (same === 'resign') p0.sig = obj.sig; S2[src] = p0; }
        else if (obj.none && prev && prev.d && !prev.none && grp === 'basic') { p0.noneAt = prev.noneAt || tt; p0.chk = tt; delete p0.err; S2[src] = p0; }
        else if (obj.none && prev && prev.d && !prev.none && !prev.noneAt) { p0.noneAt = tt; p0.chk = tt; delete p0.err; S2[src] = p0; }
        else { if (prev && prev.at) { const hid = `${J.col}_${id}_${src}_${String(prev.at).replace(/[^0-9]/g, '').slice(0, 14)}`; const hr = C('ext_hist').doc(hid); const ex = await tx.get(hr); if (!ex.exists) hist = { hr, v: { col: J.col, isbn: id, src, at: prev.at, chk: prev.chk || null, none: !!prev.none, d: prev.d ?? null, sig: prev.sig || null, ...W2 } }; }
          S2[src] = { at: obj.at || tt, chk: tt, sig: obj.sig, none: !!obj.none, d: obj.d ?? null, by, q: obj.q || null }; }
        if (hist) tx.set(hist.hr, hist.v);
        if (cur) tx.update(ref, { src: S2, ...(v.title && !cur.title ? { title: v.title } : {}), ...W2 }); else tx.set(ref, { isbn: id, title: v.title || null, author: v.author || null, src: S2, ...W2 }, { merge: true }); });
      const kd = new Date(now() + 9 * 3600e3).toISOString().slice(0, 10); await C('ext_index').doc(`${src}_${X.shard ? X.shard(id) : (+id.slice(-2) || 0) % 8}`).set({ m: { [id]: kd }, ...W2 }, { merge: true }).catch(() => {}); return true; }
    return '모르는 쓰기 꼴'; }

  /* ③ 결과 쓰기 — col2_* 허용 칸(그 PC 칸만) · 넘긴 일 op */
  async function putOut(pc, L, hoDoc, X, HOF) { const keys = [], errs = {};
    for (const o of (Array.isArray(L) ? L : []).slice(0, 25)) { const k = String((o && o.k) || ''); if (!/^[\w-]{1,40}$/.test(k)) continue;
      try { if (o.op) { const r = await hoWrite(o, pc, hoDoc, X, HOF); if (r === true) keys.push(k); else errs[k] = String(r).slice(0, 200); continue; }
        const c = String(o.c || ''), id = String(o.id || ''); const R = OUT_OK[c]; if (!R) { errs[k] = `쓰지 않음(${c.slice(0, 40)} — 홀로 연결로 쓰는 칸이 아님)`; continue; }
        if (!R.re.test(id) || !RID.test(id)) { errs[k] = '쓰지 않음(문서 이름 꼴)'; continue; } if (R.pc && !R.pc(id, pc)) { errs[k] = `쓰지 않음(다른 PC 칸 — ${pc}는 자기 칸만)`; continue; }
        const v = o.v && typeof o.v === 'object' && !Array.isArray(o.v) ? { ...o.v } : {}; if (Object.prototype.hasOwnProperty.call(v, 'pc')) v.pc = pc; /* 쓴 PC를 남의 이름으로 적지 못하게 — 서명한 PC로 */
        if (JSON.stringify(v).length > 900000) { errs[k] = '쓰지 않음(너무 큼)'; continue; }
        await C(c).doc(id).set(v, o.merge ? { merge: true } : undefined); keys.push(k); } catch (e) { errs[k] = String(e.code || e.message || e).slice(0, 200); } }
    return { keys, errs }; }

  /* ④ 모든 PC 공통 설정 — 웹앱 c2CfgWrite와 같은 꼴(트랜잭션 · 기록 80줄) · 설정 표(lab/col2/helper/col2-settings.js) 안 '모든 PC' 값과 사이트 값만 */
  async function cfgPut(pc, pend, SET) { const ch = {}; let mx = 0, by = ''; const keys = Object.keys(pend).slice(0, 60);
    for (const k of keys) { const x = pend[k]; mx = Math.max(mx, +(x && x.at) || 0); by = by || String((x && x.by) || ''); const r = SET.rowOf(k); if (!r || (r.sc && r.sc !== 'all')) continue; const v = x ? x.v : undefined; if (v === null) { ch[k] = null; continue; } const ck = SET.check(k, v, {}); if (ck.ok && !ck.reset) ch[k] = ck.v; }
    let doc = null; if (Object.keys(ch).length) { const ref = C('app_settings').doc('col2_cfg'); const who = (by || pc + ' 옆 창').slice(0, 50) + ' · 홀로';
      doc = await db.runTransaction(async (tx) => { const d = await tx.get(ref); const o = d.exists ? (d.data() || {}) : {}; const V = { ...(o.v || {}) }; const lg = Array.isArray(o.log) ? o.log.slice(0, 80) : []; const at = Math.max(now(), (+o.at || 0) + 1);
        for (const [k, v] of Object.entries(ch)) { const r = SET.rowOf(k); const dv = r.d !== undefined ? r.d : null; const from = V[k] != null ? V[k] : dv; if (v == null) delete V[k]; else V[k] = v; lg.unshift({ k, t: r.t, from: SET.show(r, from), to: SET.show(r, v == null ? dv : v), by: who.slice(0, 60), at }); }
        const nd = { v: V, at, by: who.slice(0, 60), log: lg.slice(0, 80) }; tx.set(ref, nd); return nd; }); }
    return { doc, ack: { keys, at: mx } }; }

  /* (11/12 handoff3) 🎯 넘긴 숍 목록 끝까지 — 웹앱 c2HoBenchW와 같은 규칙: 잡기(운영 benchClaim 판단) · 회차(운영 bench_state를 다시 읽고 그사이 운영이 끝냈으면 안 씀 → 운영 본체 benchFinish 글자 그대로) */
  const BFN = { fn: null, at: 0 };
  async function benchW(id, v, pc, HOF) { if (!HOF.benchBad || !HOF.benchCode) return '넘김 규칙 파일이 옛 판(bench 없음)'; const bad = HOF.benchBad(id, v); if (bad) return bad; id = String(id).replace(/^bclaim_/, ''); const me = 'col2-' + pc, by = '번외 ' + pc; const cref = C('prd_jobs').doc('bclaim_' + id);
    if (v.claim) { let ok = true; await db.runTransaction(async (tx) => { const d = (await tx.get(cref)).data(); ok = HOF.claimOk(d, pc, now()); if (!ok) return; if (v.claim.on) tx.set(cref, { pc: me, name: by, tab: 'col2', at: now(), since: iso(), writer: by, uploadedAt: FV.serverTimestamp() }); else if (d && d.pc === me) tx.set(cref, { pc: null, at: 0, doneAt: iso(), by }, { merge: true }); }); return ok ? true : '운영 PC가 이 숍을 읽는 중(잡기 신호 4분 안) — 번외는 건너뜀'; }
    const run = v.run; const st = tsFix((await C('bench_state').doc(id).get()).data() || {}); if ((st.endAt || null) !== (run.seenEnd || null) && Date.parse(st.endAt || '') > Date.parse(run.startedAt)) return `운영이 그사이 이 숍 회차를 끝냄(${String(st.endAt).slice(0, 16)}) — 쓰지 않음`; if (st.prog) return '운영이 이 숍 회차를 하는 중 — 쓰지 않음';
    const md = await mods(); if (!BFN.fn || now() - BFN.at > 30 * 60e3) { if (!md.BSRC) return '운영 본체 받는 길 없음'; const B = HOF.benchCode(await md.BSRC()); if (B.err) return B.err; BFN.fn = new Function('return ' + B.code)(); BFN.at = now(); }
    const cfg = tsFix((await C('app_settings').doc('bench').get()).data() || {}); const P = HOF.benchProg(run, st);
    await BFN.fn({ C, db, firebase: { firestore: { FieldValue: FV } }, PC_NAME: by, W: () => ({ uploadedAt: FV.serverTimestamp(), writerSchema: 6, writer: by }), nowIso: iso, log: () => {}, ui: () => {}, REG: md.REG || null, CFG: cfg, t: { sc: id, name: run.name || id }, prog: P.prog, st: P.st });
    try { await db.runTransaction(async (tx) => { const d = (await tx.get(cref)).data(); if (d && d.pc === me) tx.set(cref, { pc: null, at: 0, doneAt: iso(), by }, { merge: true }); }); } catch (e) {} return true; }

  /* ⑤ 견줄 운영 값(읽기만) — 웹앱 c2RelayTick과 같은 칸·같은 로거 규칙 */
  async function getWant(L, lg, F) { const docs = []; for (const w of (Array.isArray(L) ? L : []).slice(0, 40)) { const c = String((w && w.c) || ''), id = String((w && w.id) || '');
      if (AL_ID[c]) { if (lg || !AL_ID[c].test(id)) continue; try { const d = await C(c).doc(id).get(); docs.push({ c, id, v: d.exists ? alTrim(c, tsFix(d.data())) : null }); } catch (e) {} continue; } /* (11/13 home2) 알라딘 그림자 운영 칸 — 서버에서 거른 칸만 */
      if (!READ_OK.includes(c) || !RID.test(id)) continue;
      if (lg && LG_NO.includes(c)) continue; if (c === 'app_settings' && !(id === 'bench' && lg)) continue; if (READ_RE[c] && !READ_RE[c].test(id)) continue; if (c === 'prd_market_nobook' && lg) continue;
      if (/^bench_(state|chunk)$/.test(c)) { if (!lg) continue; try { if (c === 'bench_chunk') { const [sc, k] = id.split('.'); const d = await C('bench_state').doc(sc).collection('c').doc(k).get(); docs.push({ c, id, v: d.exists ? { s: (d.data() || {}).s || null, m: (d.data() || {}).m || null } : null }); } else { const d = await C('bench_state').doc(id).get(); const v0 = d.exists ? tsFix(d.data()) : null; docs.push({ c, id, v: v0 ? Object.fromEntries(BS_KEEP.filter((x) => v0[x] !== undefined).map((x) => [x, x === 'prog' ? (v0.prog ? 1 : null) : v0[x]])) : null }); } } catch (e) {} continue; } /* (11/12 handoff3) 🎯 로거만 */
      try { const d = await C(c).doc(id).get(); const v = d.exists ? tsFix(d.data()) : null; docs.push({ c, id, v: v == null ? null : c === 'prd_books' ? trimF(v, F) : c === 'app_settings' ? benchTrim(v) : c === 'prd_market_nobook' ? nbTrim(v) : v }); } catch (e) {} }
    return docs; }
  async function getPool(b, F) { const n = Math.min(2000, +b.pool || 1000); let q = C('prd_books').orderBy('__name__'); if (b.poolAfter && RID.test(String(b.poolAfter))) q = q.startAfter(String(b.poolAfter)); const g = await q.limit(n).get(); const L = []; let last = null;
    g.forEach((d) => { last = d.id; L.push({ id: d.id, ...trimF(tsFix(d.data()), F) }); }); return { pool: L.filter((x) => x.aladinItemId), poolFor: b.poolAfter || null, poolLap: b.poolLap, poolNext: last, poolEnd: L.length < n }; }

  /* ⑤-2 (11/12 handoff3) 판매자 목록(🗣 판매자 글 · 🏪 넘긴 숍 요약 차례) — 웹앱 c2ListsGive와 같은 칸·같은 거름: 숍 번호·이름·전체 평가 수·확인 시각 두 칸만
   *  우리 숍(996008)·숍 번호 꼴이 아닌 문서는 v:null(이어 받기 자리만) · 손님 연결·연락처·사업자 정보는 주지 않음 · 로거에도(공개 숍 번호 — 우리 상품·계정 정보 아님 · 약속 0) */
  const OWN_SC = ['996008'];
  async function getLists(L) { const out = {}; for (const w of (Array.isArray(L) ? L : []).slice(0, 3)) { if (!w || w.c !== 'sellers' || out.sellers) continue; const n = Math.max(1, Math.min(500, +w.n || 200));
      let q = C('sellers').orderBy('__name__'); if (w.after && RID.test(String(w.after))) q = q.startAfter(String(w.after)); const g = await q.limit(n).get(); const A = [];
      g.forEach((d) => { const v = d.data() || {}; const sc = String(v.sc || '').replace(/\D/g, ''); if (!/^sc_\d{1,10}$/.test(d.id) || !sc || OWN_SC.includes(sc)) { A.push({ id: d.id, v: null }); return; }
        A.push({ id: d.id, v: { sc, name: typeof v.name === 'string' ? v.name.slice(0, 40) : null, n: Number(String(v.totalReviewCount ?? '').replace(/[^\d]/g, '')) || null, rev6mAt: typeof v.rev6mAt === 'string' ? v.rev6mAt : null, rev6mTriedAt: typeof v.rev6mTriedAt === 'string' ? v.rev6mTriedAt : null } }); });
      out.sellers = A; } return Object.keys(out).length ? out : null; }

  /* ⑥ 🟩 네이버(로거 PC만) — 웹앱 nvRelayTick과 같은 일: 받는 열쇠 · 상태 · 봉투 넘기기(트랜잭션 · 넘긴 뒤 봉투 지움) · 읽은 것 쓰기 */
  async function nvStep(pc, nv) { const out = {}; const s = nv.st || {}; const t = iso(); const who = '번외 홀로 ' + pc;
    if (!Object.prototype.hasOwnProperty.call(s, 'net')) { /* 와이파이 문이 없는 옛 번외 — 열쇠·명령 안 넘김(웹앱과 같음) */ const o = { pc, ver: String(nv.ver || ''), at: t, via: 'solo', off: `로거 번외 ${nv.ver || ''}에 🛑 와이파이 확인이 없음 — 새 번외를 받아야 네이버 일을 함` }; await C('col2_naver').doc('state').set(o, { merge: true }); return out; }
    if (s.pub && typeof s.pub === 'string' && s.pub.length < 4000) { if (!M.nvPub || now() - M.nvPub.at > 10 * 60e3) { const d = await C('col2_naver').doc('pub').get(); M.nvPub = { spki: d.exists ? (d.data() || {}).spki : null, at: now() }; }
      if (M.nvPub.spki !== s.pub) { await C('col2_naver').doc('pub').set({ spki: s.pub, pc, at: t, alg: 'RSA-OAEP-256+A256GCM', via: 'solo' }); M.nvPub = { spki: s.pub, at: now() }; } }
    for (const r of (Array.isArray(nv.done) ? nv.done : []).slice(0, 10)) { const id = String((r && r.id) || ''); if (!RID.test(id)) continue; const ref = C('col2_naver_cmd').doc(id); const d = await ref.get(); const x = d.exists ? d.data() || {} : null;
      if (!x || x.st !== 'took' || x.tookBy !== who) continue; const R = r.res || {}; await ref.set({ st: 'done', doneAt: t, res: { ok: !!R.ok, saved: R.saved == null ? null : R.saved, err: R.err ? String(R.err).slice(0, 300) : null, test: R.test ? { ok: !!R.test.ok, msg: String(R.test.msg || '').slice(0, 200), ip: !!R.test.ip } : null }, env: FV.delete() }, { merge: true }); }
    const keys = []; for (const o of (Array.isArray(nv.feed) ? nv.feed : []).slice(0, 150)) { const re = NV_OUT_OK[o && o.c]; if (!re || !re.test(String(o.id)) || !/^[\w-]{1,40}$/.test(String(o.k || ''))) continue; try { await C(o.c).doc(String(o.id)).set(o.v && typeof o.v === 'object' ? o.v : {}, { merge: true }); keys.push(String(o.k)); } catch (e) {} }
    if (keys.length) out.nvAck = keys;
    if (s.on && +nv.take > 0) { const q = await C('col2_naver_cmd').where('st', '==', 'new').limit(10).get(); const L = []; q.forEach((d) => L.push({ id: d.id, ...d.data() })); const got = [];
      for (const c of L.sort((a, b) => String(a.at).localeCompare(String(b.at)))) { if (got.length >= Math.min(3, +nv.take)) break; const ref = C('col2_naver_cmd').doc(c.id); let ok = false;
        try { ok = await db.runTransaction(async (tx) => { const d = await tx.get(ref); if (!d.exists || (d.data() || {}).st !== 'new') return false; tx.set(ref, { st: 'took', tookAt: t, tookBy: who }, { merge: true }); return true; }); } catch (e) { ok = false; }
        if (ok) got.push({ id: c.id, k: c.k, env: c.env, on: c.on, prd: c.prd, job: c.job, ip: c.ip, by: c.by || '' }); }
      if (got.length) out.nvCmds = got; }
    const sum = { pc, ver: String(nv.ver || ''), at: t, via: 'solo', nv: clean({ cred: s.cred, test: s.test, write: s.write, ord: s.ord, prd: s.prd, inq: s.inq || null, stl: s.stl || null, blocked: s.blocked || 0, cool: s.cool || 0, q: s.q || 0, cats: s.cats || null, net: s.net || null, ipReg: s.ipReg || null }) };
    const g = JSON.stringify({ ...sum, at: 0, nv: { ...sum.nv, net: sum.nv.net ? { ...sum.nv.net, at: 0, ms: 0 } : null } }); if (g !== M.nvSig || now() - M.nvAt > 4 * 60e3) { await C('col2_naver').doc('state').set(sum); M.nvSig = g; M.nvAt = now(); } /* 4분마다 다시 씀 — 수집기 다리(rnC2nv)는 6분 안 상태를 보고 비킴 */
    return out; }

  async function api(raw, sig) { const ck = await check(raw, sig); if (Array.isArray(ck)) return ck; const { b, pc, K } = ck; const lg = isLogger(pc, K, b); const res = { ok: true, reg: 'ok', pc, at: now(), logger: lg, alDocs: lg ? 0 : 1 /* (11/13 home2) 이 클라우드는 알라딘 그림자 운영 칸을 거른 꼴로 줌 — 번외가 이 표시를 본 뒤에만 그 부탁을 이 길로 보냄 */ };
    if (now() - (M.seenW.get(pc) || 0) > 120e3) { M.seenW.set(pc, now()); C('app_settings').doc(SEEN_DOC).set({ [pc]: { at: iso(), ver: String(b.ver || '').slice(0, 20) } }, { merge: true }).catch(() => {}); }
    if (b.op === 'hello') return [200, res];
    if (b.op !== 'sync') return [400, { ok: false, err: '모르는 일: ' + String(b.op).slice(0, 20) }];
    const md = await mods(); const F = Array.isArray(b.fields) ? b.fields.filter((f) => /^\w{1,40}$/.test(String(f))).slice(0, 40) : null; const errs = [];
    try { res.st = await putSt(pc, b); } catch (e) { errs.push('상태: ' + (e.code || e.message)); }
    let hoDoc = { jobs: {} }; try { const d = await C('app_settings').doc('col2_handoff').get(); const v = d.exists ? d.data() || {} : {}; hoDoc = { jobs: tsFix(v.jobs || {}) }; res.handoff = { jobs: Object.fromEntries(Object.entries(hoDoc.jobs).filter(([k]) => !!(md.HOF && md.HOF.JOBS[k] && md.HOF.JOBS[k].lg) === !!lg)) }; } /* (11/12 handoff2 · 약속 0) 로거엔 로거 칸 일만 · 사무실엔 사무실 일만 */ catch (e) { errs.push('넘김 문서: ' + (e.code || e.message)); }
    if (Array.isArray(b.out) && b.out.length) { if (!md.HOF) errs.push('넘김 표 파일을 못 받음'); res.ack = await putOut(pc, b.out, hoDoc, md.X, md.HOF || { JOBS: {}, writeOk: () => ({ ok: false, why: '넘김 표 없음' }) }); }
    if (b.handBeat && typeof b.handBeat === 'object' && md.HOF) for (const [k, tb] of Object.entries(b.handBeat).slice(0, 20)) { if (!md.HOF.mine(hoDoc, k, pc) || !(+tb > 0) || +tb > now() + 60e3) continue; const x = hoDoc.jobs[k] || {}; const was = Date.parse(x.beat || '') || 0; if (+tb - was < 30 * 60e3) continue;
      try { await C('app_settings').doc('col2_handoff').set({ jobs: { [k]: { beat: new Date(+tb).toISOString() } } }, { merge: true }); } catch (e) {} }
    try { if (b.setPend && typeof b.setPend === 'object' && Object.keys(b.setPend).length && md.SET) { const r = await cfgPut(pc, b.setPend, md.SET); res.sharedAck = r.ack; if (r.doc) res.shared = { v: r.doc.v, at: r.doc.at, by: r.doc.by }; }
      if (!res.shared) { const d = await C('app_settings').doc('col2_cfg').get(); const v = d.exists ? d.data() || {} : null; if (v && +v.at > (+b.sharedAt || 0)) res.shared = { v: v.v || {}, at: +v.at, by: v.by || '' }; } } catch (e) { errs.push('설정: ' + (e.code || e.message)); }
    try { if (Array.isArray(b.want) && b.want.length) res.docs = await getWant(b.want, lg, F); } catch (e) { errs.push('운영 값: ' + (e.code || e.message)); }
    try { if (Array.isArray(b.lists) && b.lists.length) { const ls = await getLists(b.lists); if (ls) res.lists = ls; } } catch (e) { errs.push('판매자 목록: ' + (e.code || e.message)); } /* (11/12 handoff3) 홀로 연결로만 이어진 로거도 숍 요약 차례를 받게 */
    try { if (+b.pool > 0 && !lg && Object.prototype.hasOwnProperty.call(b, 'poolAfter')) Object.assign(res, await getPool(b, F)); } catch (e) { errs.push('표본: ' + (e.code || e.message)); } /* 로거에는 우리 도서 목록(표본)을 주지 않음(약속 0) */
    if (b.nv && typeof b.nv === 'object') { if (!lg) errs.push('네이버 일은 로거 PC만'); else { try { Object.assign(res, await nvStep(pc, b.nv)); } catch (e) { errs.push('네이버: ' + (e.code || e.message)); } } }
    if (errs.length) { res.errs = errs.slice(0, 6); log('🔌 번외 홀로 연결', pc, errs[0]); }
    return [200, res]; }
  return { api, check, getLists, benchW, stSum, OUT_OK, NV_OUT_OK, READ_OK, LG_NO, alTrim, _M: M };
}
module.exports = { makeSolo, stSum, alTrim, AL_ID, OUT_OK, NV_OUT_OK, READ_OK, LG_NO, SOLO_DOC, SEEN_DOC, pcSafe, pcSafe2 };
