/* 🗣 구매평·문의 연구 요약(app_settings/voice_study)을 클라우드가 매일 셈 (cres1 · 11/12)
 *  왜: 예전엔 웹앱 📊 경영 › 🗣 구매평·문의 연구 화면을 관리자 기기가 열고 '글 더 받기'로 끝까지 받아야만 요약이 생겨, 문서가 없거나 오래됨
 *       → 매일 엔진 한 걸음·등록 카드 '📣 구매평에서 자주 나온 말'이 읽을 것이 없었음
 *  셈은 웹앱 src/app.html '🗣 판매자 목소리' 순수 셈(voTopics·voRows·voStats)과 같음 — src/tests/tVOICE_CLOUD1112.js가 같은 자료로 두 셈이 같은지 봄
 *  다른 점: 글을 모두 메모리에 쌓지 않고 조각(문서)마다 바로 셈(흘려 셈) — 글 원문은 셈에만 쓰고 버림 · 저장은 숫자·낱말만(웹앱 voSave와 같은 꼴 + by:'cloud')
 *  자료: col2_voice(번외 수집 조각) → seller_reviews(운영 판매자 평가) 차례(웹앱과 같음 · 같은 글은 한 번만) · 규모 = sellers.totalReviewCount 또는 col2_voice_s 요약
 *        우리 숍 견줌 = crm_interactions(type review)의 만족도·글 — 이 안에서만 셈하고 수만 남김(손님 이름·아이디 없음)
 *  무거움 막이: 문서는 조금씩(page) · 시간 상한(budgetMs) 넘으면 거기까지로 저장(partial:true) · 낱말 세기 표가 너무 크면 1번 나온 낱말은 버림 */ /* (voice2 11/12) 증분 셈 — 아래 makeVoiceStudy */
'use strict';
const VOICE_LEX = { ver: 1, topics: [
  { k: 'ship', t: '🚚 배송 속도', w: ['배송', '빠르', '빨라', '빨리', '신속', '늦', '느리', '느려', '도착', '출고', '지연', '금방', '오래 걸', '총알'] },
  { k: 'pack', t: '📦 포장', w: ['포장', '뽁뽁', '에어캡', '비닐', '박스', '상자', '봉투', '꼼꼼', '젖', '구겨'] },
  { k: 'cond', t: '📖 책 상태', w: ['상태', '깨끗', '새책', '새 책', '새것', '얼룩', '낙서', '밑줄', '필기', '변색', '냄새', '곰팡', '접힘', '손때', '오염', '누렇', '헌책'] },
  { k: 'gap', t: '🔍 설명·사진과 실물 차이', w: ['설명과', '설명이랑', '설명보다', '사진과', '사진이랑', '사진보다', '다르', '달라', '기재', '실물', '생각보다', '등급', '표기'] },
  { k: 'damage', t: '💥 파손·훼손', w: ['파손', '망가', '깨져', '찢어', '찢겨', '뜯어', '훼손', '부서', '찌그러'] },
  { k: 'price', t: '💰 가격', w: ['가격', '저렴', '싸게', '싼 ', '비싸', '가성비', '배송비', '값'] },
  { k: 'service', t: '🙋 응대·처리', w: ['친절', '응대', '답변', '연락', '문의', '사과', '교환', '환불', '반품', '안내', '서비스', '사은품', '손편지', '메모'] },
  { k: 'wrong', t: '❌ 오배송·누락', w: ['다른 책', '잘못', '오배송', '누락', '빠져', '안 왔', '안왔', '수량', '한 권만'] },
  { k: 'stock', t: '⛔ 품절·취소', w: ['품절', '재고', '취소', '없다고'] },
  { k: 'praise', t: '👍 일반 만족', w: ['좋아요', '좋습니다', '좋네요', '만족', '감사', '추천', '또 이용', '번창', '최고'] },
] };
const VO_STOP = new Set(['그리고', '너무', '정말', '진짜', '잘', '받았습니다', '받았어요', '합니다', '했어요', '있어요', '없어요', '입니다', '이에요', '같아요', '그냥', '조금', '아주', '많이', '빠른', '좋은', '하고', '해서', '했는데', '있는', '없는', '것', '수', '책이', '책을', '책은', '주문', '구매', '판매자', '판매자님', '셀러', '알라딘']);
const RATE = { 만족: 'good', 보통: 'mid', 불만족: 'bad' };
const lexOf = (add) => VOICE_LEX.topics.map((t) => ({ ...t, w: [...t.w, ...(add && Array.isArray(add[t.k]) ? add[t.k].map(String) : [])] }));
function voTopics(txt, lex) { const s = ' ' + String(txt || '').replace(/\s+/g, ' ') + ' '; const out = []; for (const t of lex) if (t.w.some((w) => w && s.includes(w))) out.push(t.k); return out; }
const voSize = (n) => (n == null ? '모름' : n < 300 ? '작음(<300)' : n < 3000 ? '중간(300~3천)' : '큼(3천+)');
/* 53비트 문자열 해시(cyrb53) — 같은 글 판단용(충돌 확률은 126만 건에서 약 1억분의 1) */
const h53 = (str) => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return 4294967296 * (2097151 & h2) + (h1 >>> 0); };
const tok = (s) => (String(s).match(/[가-힣]{2,6}/g) || []).filter((w) => !VO_STOP.has(w));

/* 흘려 셈 — 웹앱 voRows(같은 글 한 번만) + voStats와 같은 값 */
function makeAcc(o) { o = o || {}; const lex = o.lex || lexOf(null); const szOf = o.sizeOf || (() => '모름'); const waMax = o.waMax || 120000;
  const seen = o.seen || new Set(); /* (voice2) 같은 글 장부 — 증분 셈은 Firestore에 남긴 장부(SeenStore)를 넘김 */ const sellers = new Set(); const cnt = { good: 0, mid: 0, bad: 0 }; let n = 0, cov = 0, q = 0, qSec = 0, qAns = 0, rows = 0;
  const T = Object.fromEntries(lex.map((t) => [t.k, { n: 0, bad: 0, good: 0, q: 0 }])); const mon = new Map(); const sz = new Map(); const wc = new Map(); const wa = new Map(); let pruned = 0;
  /* (voice2 11/12) 증분 셈 — 셈 상태를 그대로 꺼내고(exp) 다시 넣음(imp) · 차례(Map 넣은 순서)까지 지켜 나눠 세도 한 번에 센 것과 같음 */
  const packM = (m) => { const a = []; for (const [w, v] of m) a.push(w + ':' + v); return a.join(','); }; const unpackM = (str, m) => { m.clear(); if (!str) return; for (const x of String(str).split(',')) { const i = x.lastIndexOf(':'); if (i > 0) m.set(x.slice(0, i), +x.slice(i + 1)); } };
  function exp() { return { cnt: { ...cnt }, n, cov, q, qSec, qAns, rows, pruned, T: JSON.parse(JSON.stringify(T)), mon: [...mon.values()].map((v) => ({ m: v.m, n: v.n, bad: v.bad, tb: { ...v.tb } })), sz: [...sz.values()].map((v) => ({ g: v.g, n: v.n, bad: v.bad, sellers: [...v.sellers], tp: { ...v.tp } })), sellers: [...sellers], wa: packM(wa), wc: packM(wc) }; }
  function imp(x) { if (!x) return; Object.assign(cnt, x.cnt || {}); n = +x.n || 0; cov = +x.cov || 0; q = +x.q || 0; qSec = +x.qSec || 0; qAns = +x.qAns || 0; rows = +x.rows || 0; pruned = +x.pruned || 0; for (const k in x.T || {}) if (T[k]) Object.assign(T[k], x.T[k]);
    mon.clear(); for (const v of x.mon || []) mon.set(v.m, { m: v.m, n: v.n, bad: v.bad, tb: { ...v.tb } }); sz.clear(); for (const v of x.sz || []) sz.set(v.g, { g: v.g, n: v.n, bad: v.bad, sellers: new Set(v.sellers || []), tp: { ...v.tp } }); sellers.clear(); for (const sc of x.sellers || []) sellers.add(sc); unpackM(x.wa, wa); unpackM(x.wc, wc); }
  const row = (sc, x, k) => { const c = String(x.c != null ? x.c : x.t || '').slice(0, 1000); if (k === 'r') { const key = h53([sc, x.d, x.r || '', c.slice(0, 60)].join('|')); if (seen.has(key)) return; seen.add(key); } rows++; /* (0.35.145) 같은 글 열쇠는 글자 대신 53비트 숫자(구매평 126만 건 · 글자 열쇠 Set이 메모리를 크게 먹어 클라우드가 멈춤) — 웹앱도 문의 열쇠는 같은 글 판단에 쓰지 않음 */
    const r = k === 'r' ? x.r || null : null; const tp = voTopics(c + ' ' + (x.reply || ''), lex); sellers.add(String(sc));
    if (k === 'q') { q++; if (x.sec) qSec++; if (x.ans) qAns++; tp.forEach((t) => T[t] && T[t].q++); return; }
    if (!r || !(r in cnt)) return; cnt[r]++; n++; if (tp.length) cov++; tp.forEach((t) => { const v = T[t]; if (!v) return; v.n++; if (r === 'bad') v.bad++; if (r === 'good') v.good++; });
    const m = String(x.d || '').slice(0, 7); const mv = mon.get(m) || { m, n: 0, bad: 0, tb: {} }; mv.n++; if (r === 'bad') { mv.bad++; tp.forEach((t) => (mv.tb[t] = (mv.tb[t] || 0) + 1)); } mon.set(m, mv);
    const g = szOf(String(sc)); const sv = sz.get(g) || { g, n: 0, bad: 0, sellers: new Set(), tp: {} }; sv.n++; sv.sellers.add(String(sc)); if (r === 'bad') sv.bad++; tp.forEach((t) => (sv.tp[t] = (sv.tp[t] || 0) + 1)); sz.set(g, sv);
    const ws = new Set(tok(c)); ws.forEach((w) => wa.set(w, (wa.get(w) || 0) + 1)); if (r === 'bad' && !tp.filter((t) => t !== 'praise').length) ws.forEach((w) => wc.set(w, (wc.get(w) || 0) + 1));
    if (wa.size > waMax) { for (const [w, v] of wa) if (v <= 1 && !wc.has(w)) wa.delete(w); pruned++; } };
  return {
    /* 번외 조각 { sc, kind:'r'|'q', items } */ c2(v) { if (!v) return; for (const x of v.items || []) if (x && x.d) row(v.sc, x, v.kind === 'q' ? 'q' : 'r'); },
    /* 운영 평가 묶음 { sc | sellerId, items } */ op(v) { if (!v) return; const sc = String(v.sc || String(v.sellerId || '').replace(/^sc_/, '')); for (const x of v.items || []) if (x && x.d) row(sc, x, 'r'); },
    rows: () => rows, exp, imp, size: () => ({ wa: wa.size, wc: wc.size, sellers: sellers.size }),
    result(ours) { const tp = lex.map((t) => { const v = T[t.k]; const shAll = n ? v.n / n : 0, shBad = cnt.bad ? v.bad / cnt.bad : 0, shGood = cnt.good ? v.good / cnt.good : 0; return { k: t.k, t: t.t, n: v.n, bad: v.bad, good: v.good, q: v.q, shAll, shBad, shGood, qSh: q ? v.q / q : 0, lift: shAll ? shBad / shAll : null, badRate: v.n ? v.bad / v.n : null }; });
      const months = [...mon.values()].sort((a, b) => (a.m < b.m ? -1 : 1)); const sizes = [...sz.values()].map((v) => ({ g: v.g, n: v.n, bad: v.bad, sellers: v.sellers.size, tp: v.tp }));
      const O = (ours || []).filter((x) => x.r); const oc = { good: 0, mid: 0, bad: 0 }; O.forEach((x) => oc[x.r]++); const otp = {}; O.forEach((x) => voTopics(x.c, lex).forEach((k) => (otp[k] = (otp[k] || 0) + 1)));
      const known = new Set(lex.flatMap((t) => t.w)); const cands = [...wc.entries()].filter(([w, c]) => c >= (o.minCand || 3) && ![...known].some((k) => w.includes(k.trim()))).map(([w, c]) => ({ w, c, lift: (c / Math.max(1, cnt.bad)) / ((wa.get(w) || c) / Math.max(1, n)) })).sort((a, b) => b.lift * b.c - a.lift * a.c).slice(0, 30);
      return { n, q, qSec, qAns, cnt, cover: n ? cov / n : 0, tp, months, sizes, ours: { n: O.length, cnt: oc, tp: otp }, cands, sellers: sellers.size, pruned }; } };
}
/* 저장 꼴 — 웹앱 voSave와 같음(숫자·낱말만) */
function docOf(st, day, extra) { return { day, at: new Date().toISOString(), lexVer: VOICE_LEX.ver, n: st.n, q: st.q, qSec: st.qSec, qAns: st.qAns, sellers: st.sellers, cnt: st.cnt, cover: Math.round(st.cover * 1000) / 1000,
  tp: st.tp.map((t) => ({ k: t.k, n: t.n, bad: t.bad, good: t.good, q: t.q, lift: t.lift == null ? null : Math.round(t.lift * 100) / 100 })), months: st.months.slice(-24).map((m) => ({ m: m.m, n: m.n, bad: m.bad, tb: m.tb })), sizes: st.sizes, ours: st.ours,
  cands: st.cands.slice(0, 30).map((c) => ({ w: c.w, c: c.c, lift: Math.round(c.lift * 100) / 100 })), by: 'cloud', ...(extra || {}) }; }

/* (voice2 11/12) 같은 글 장부(53비트 숫자) — 32칸으로 나눠 Firestore 바이트 칸(칸마다 정렬된 Float64)으로 남김 · 메모리 = 건수 × 8바이트(126만 건 ≈ 10MB · 예전 Set은 수십 MB) */
function makeSeenStore(K) { K = K || 32; const sh = Array.from({ length: K }, () => ({ base: new Float64Array(0), add: new Set() }));
  const bs = (a, h) => { let lo = 0, hi = a.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; const v = a[m]; if (v === h) return true; if (v < h) lo = m + 1; else hi = m - 1; } return false; };
  return { K, has: (h) => { const s = sh[h % K]; return s.add.has(h) || bs(s.base, h); }, add: (h) => { sh[h % K].add.add(h); },
    load(i, b) { if (!b) return; const u = new Uint8Array(b); sh[i].base = new Float64Array(u.buffer, 0, Math.floor(u.byteLength / 8)); },
    bytes(i) { const s = sh[i]; if (!s.add.size) return Buffer.from(s.base.buffer, s.base.byteOffset, s.base.byteLength); const m = new Float64Array(s.base.length + s.add.size); m.set(s.base); let j = s.base.length; for (const h of s.add) m[j++] = h; m.sort(); s.base = m; s.add.clear(); return Buffer.from(m.buffer); },
    count: () => sh.reduce((a, s) => a + s.base.length + s.add.size, 0) }; }
/* 매일 일 — { C, FieldPath, log, W } 를 받아 씀 · force=20시간 막이 무시 · dry=쓰지 않고 돌려줌(진단)
 *  (voice2 11/12) 증분 셈 — 셈 상태(낱말 수·주제 수·판매자별 합·같은 글 장부)를 voice_acc에 누적해 두고
 *   ① 처음 한 번 전체는 회차마다 5만 줄씩(번외 조각 → 운영 평가 문서 차례 · 며칠에 걸쳐도 됨 · 다 셀 때까지 voice_study는 그대로)
 *   ② 그 뒤엔 마지막으로 다 센 시각 뒤에 쓰인 문서(uploadedAt)만 읽어 더함 · 번외 '꼬리 조각'(<숍>_rtail·qtail — 덮어써짐)은 셈 상태에 넣지 않고 결과 낼 때만 위에 얹음
 *   ③ 상태는 두 벌(g0·g1)을 번갈아 쓰고 meta가 맨 끝에 가리킴 — 쓰다가 클라우드가 죽어도 앞 상태 그대로(다음 회차가 이어 셈)
 *   메모리: 회차마다 힙이 memMB(기본 200MB) 넘게 늘면 거기까지 · 끝나지 않은 채 죽었으면 다음 회차는 줄 수를 반으로 */
function makeVoiceStudy(dep) { const { C, FieldPath, log } = dep; const W = dep.W || (() => ({})); let busy = false; const MB = 1048576;
  const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const ACC = () => C('voice_acc');
  const tsMs = (v) => (v == null ? null : typeof v.toMillis === 'function' ? v.toMillis() : v instanceof Date ? v.getTime() : Date.parse(v));
  /* 낱말 표(wa·wc)는 'w:수,' 글로 25만 자씩 문서에 · 같은 글 장부는 칸마다 바이트 · 두 벌(g0·g1) 번갈아 */
  async function loadState(meta, SS) { const g = 'g' + (meta.gen % 2); const ids = [...Array.from({ length: meta.waN || 0 }, (_, j) => `${g}_wa${j}`), ...Array.from({ length: meta.wcN || 0 }, (_, j) => `${g}_wc${j}`), ...Array.from({ length: SS.K }, (_, i) => `${g}_s${i}`)];
    const docs = await Promise.all(ids.map((id) => ACC().doc(id).get())); let wa = '', wc = ''; docs.forEach((d, i) => { const v = d.data() || {}; const id = ids[i]; if (/_wa\d+$/.test(id)) wa += v.t || ''; else if (/_wc\d+$/.test(id)) wc += v.t || ''; else SS.load(+id.split('_s')[1], v.b); });
    return { ...(meta.acc || {}), wa, wc }; }
  async function saveState(meta, A, SS) { const gen = (meta.gen || 0) + 1; const g = 'g' + (gen % 2); const x = A.exp(); const { wa, wc, ...acc } = x; const at = new Date().toISOString();
    const cut = (str) => { const out = []; let i = 0; while (i < str.length) { let j = Math.min(str.length, i + 250000); if (j < str.length) { const k = str.lastIndexOf(',', j); if (k > i) j = k; } out.push(str.slice(i, j)); i = j < str.length && str[j] === ',' ? j + 1 : j; } return out; };
    const P1 = cut(wa), P2 = cut(wc); /* 조각마다 앞뒤 쉼표 없이 · 이어 붙일 때 쉼표 하나 */ const P1j = P1.map((t, j) => (j ? ',' : '') + t), P2j = P2.map((t, j) => (j ? ',' : '') + t);
    for (let j = 0; j < P1j.length; j++) await ACC().doc(`${g}_wa${j}`).set({ t: P1j[j], gen, at }); for (let j = 0; j < P2j.length; j++) await ACC().doc(`${g}_wc${j}`).set({ t: P2j[j], gen, at });
    for (let i = 0; i < SS.K; i++) { const b = SS.bytes(i); await ACC().doc(`${g}_s${i}`).set({ b, n: b.length / 8, gen, at }); }
    const m2 = { ...meta, gen, waN: P1j.length, wcN: P2j.length, acc, seenN: SS.count(), at, writer: 'cloud' }; delete m2.wN; await ACC().doc('meta').set(m2); return m2; }
  async function run(force, dry, opt) { opt = opt || {}; const ref = C('app_settings').doc('voice_study'); if (busy) return { busy: 1 }; let prev = null; try { prev = (await ref.get()).data() || null; } catch (e) {}
    let meta = null; try { meta = (await ACC().doc('meta').get()).data() || null; } catch (e) {}
    if (!force && meta && meta.phase === 'live' && prev && prev.by === 'cloud' && !prev.partial && Date.now() - Date.parse(prev.at || 0) < 20 * 3600e3) /* 다 센 뒤엔 하루 한 번만 새 문서를 더함 */ return { skip: 1, at: prev.at };
    const rref = C('app_settings').doc('voice_study_run'); let rr = {}; try { rr = (await rref.get()).data() || {}; } catch (e) {}
    if (!force && rr.ok === false && Date.now() - Date.parse(rr.startAt || 0) < 6 * 3600e3) { log('🗣 구매평 연구 요약 건너뜀 — 지난번이 끝나지 않음(클라우드가 멈췄을 수 있음 · 6시간 쉬고 줄 수를 반으로)', rr.startAt); return { skip: 'crash', at: rr.startAt }; }
    const crashN = rr.ok === false ? Math.min(4, (+rr.crashN || 0) + 1) : 0;
    busy = true; const t0 = Date.now(); const budget = +opt.budgetMs || 8 * 60e3; const page = +opt.page || 20; const maxRows = Math.max(1, Math.round((+opt.maxRows || 50000) / 2 ** crashN)); const memMB = +opt.memMB || dep.memMB || 200;
    if (!dry) await rref.set({ startAt: new Date().toISOString(), ok: false, crashN }).catch(() => {});
    const heap = () => process.memoryUsage().heapUsed; if (typeof global.gc === 'function') global.gc(); const h0 = heap(); let hiMB = 0, pg = 0;
    const memHi = () => { try { if (++pg % 5 === 0 && typeof global.gc === 'function') global.gc(); const d = (heap() - h0) / MB; if (d > hiMB) hiMB = d; return d > memMB && (typeof global.gc !== 'function' || (global.gc(), (heap() - h0) / MB > memMB)); } catch (e) { return false; } };
    try { let add = null; try { add = ((await C('app_settings').doc('voice_lex').get()).data() || {}).add || null; } catch (e) {} const lex = lexOf(add); const lexKey = String(h53(JSON.stringify(lex.map((t) => [t.k, t.w]))));
      const N = new Map(); try { (await C('sellers').select('totalReviewCount').get()).forEach((d) => { const v = Number(String(d.data().totalReviewCount ?? '').replace(/[^\d]/g, '')); if (Number.isFinite(v) && v > 0) N.set(String(d.id).replace(/^sc_/, ''), v); }); } catch (e) {}
      const c2s = []; try { (await C('col2_voice_s').get()).forEach((d) => { c2s.push(d.id); if (N.has(d.id)) return; const m = d.data() || {}; const v = m.n != null ? m.n : m.r ? m.r.n : null; if (v != null) N.set(d.id, v); }); } catch (e) {}
      const sizeOf = (sc) => voSize(N.has(sc) ? N.get(sc) : null); const SS = makeSeenStore(32); let st0 = null;
      const reset = !meta || meta.v !== 2 || meta.lexKey !== lexKey || !!opt.reset; if (reset) meta = { v: 2, lexKey, gen: meta && meta.gen ? meta.gen : 0, phase: 'c2', cur: null, baseAt: new Date().toISOString(), since: null, runs: 0, waN: 0, wcN: 0, base: { c2Docs: 0, opDocs: 0 } }; else st0 = await loadState(meta, SS);
      const A = makeAcc({ lex, sizeOf, seen: SS }); if (st0) A.imp(st0); const r0 = A.rows(); let docs = 0, stop = false, why = null; const runAt = new Date().toISOString(); const base = { ...(meta.base || {}) };
      const stopNow = () => { if (Date.now() - t0 > budget) why = 'time'; else if (A.rows() - r0 >= maxRows) why = 'rows'; else if (memHi()) why = 'mem'; return !!why; };
      const markC2 = (id, v) => { if (/tail$/.test(id)) return; const k = h53('D|col2_voice/' + id); if (SS.has(k)) return; A.c2(v); SS.add(k); }; /* 번외 번호 조각은 덮어쓰지 않음 → 문서 하나는 한 번만(문의 글은 같은 글 판단이 없어 두 번 세지 않게) */
      const byId = async (col, fields, pz, each) => { for (;;) { if (stopNow()) return false; let qq = C(col).orderBy(FieldPath.documentId()).select(...fields).limit(pz); if (meta.cur) qq = qq.startAfter(meta.cur); const g = await qq.get(); g.forEach((d) => { docs++; each(d.id, d.data() || {}); meta.cur = d.id; }); if (g.size < pz) return true; await new Promise((z) => setImmediate(z)); } };
      const byTime = async (col, fields, pz, since, each) => { let last = null; for (;;) { if (stopNow()) return false; let qq = C(col).where('uploadedAt', '>', since).orderBy('uploadedAt').select(...fields).limit(pz); if (last) qq = qq.startAfter(last); const g = await qq.get(); g.forEach((d) => { docs++; each(d.id, d.data() || {}); }); if (g.size < pz) return true; last = g.docs[g.docs.length - 1]; await new Promise((z) => setImmediate(z)); } };
      if (meta.phase === 'c2') { if (await byId('col2_voice', ['sc', 'kind', 'items'], page, (id, v) => { base.c2Docs++; markC2(id, v); })) { meta.phase = 'op'; meta.cur = null; } }
      if (meta.phase === 'op' && !why) { if (await byId('seller_reviews', ['sc', 'sellerId', 'items'], +opt.opPage || 25, (id, v) => { base.opDocs++; A.op(v); })) { meta.phase = 'live'; meta.cur = null; meta.since = new Date(Date.parse(meta.baseAt) - 10 * 60e3).toISOString(); meta.baseDoneAt = runAt; } }
      else if (meta.phase === 'live') { const since = new Date(Date.parse(meta.since || meta.baseAt) || 0); const ok1 = await byTime('col2_voice', ['sc', 'kind', 'items', 'uploadedAt'], page, since, (id, v) => markC2(id, v)); const ok2 = ok1 && !why && (await byTime('seller_reviews', ['sc', 'sellerId', 'items', 'uploadedAt'], +opt.opPage || 25, since, (id, v) => A.op(v)));
        if (ok1 && ok2) meta.since = new Date(Date.parse(runAt) - 10 * 60e3).toISOString(); /* 다 읽었을 때만 앞으로(겹쳐 읽어도 같은 글·같은 조각은 한 번만) */ }
      meta.base = base; meta.runs = (+meta.runs || 0) + 1; meta.last = { at: runAt, rows: A.rows() - r0, docs, why, ms: Date.now() - t0, hiMB: Math.round(hiMB) };
      const live = meta.phase === 'live'; let saved = meta; if (!dry) saved = await saveState(meta, A, SS);
      /* 결과 — 다 센 뒤(live)엔 꼬리 조각을 얹어(셈 상태는 그대로) voice_study에 · 처음 전체를 세는 중엔 voice_study를 그대로 둠(없을 때만 partial로) */
      let T2 = A; if (live) { const tmp = new Set(); T2 = makeAcc({ lex, sizeOf, seen: { has: (h) => tmp.has(h) || SS.has(h), add: (h) => tmp.add(h) } }); T2.imp(A.exp()); const scs = [...new Set([...c2s, ...A.exp().sellers])];
        for (let i = 0; i < scs.length; i += 40) { const gs = await Promise.all(scs.slice(i, i + 40).flatMap((sc) => ['r', 'q'].map((k) => C('col2_voice').doc(`${sc}_${k}tail`).get().catch(() => null)))); gs.forEach((g) => { if (g && g.exists) T2.c2(g.data() || {}); }); } }
      const ours = []; try { (await C('crm_interactions').where('type', '==', 'review').select('rating', 'body').get()).forEach((d) => { const v = d.data() || {}; ours.push({ r: RATE[String(v.rating || '').trim()] || null, c: String(v.body || '') }); }); } catch (e) {}
      const st = T2.result(ours); ours.length = 0; const day = kday(Date.now());
      const doc = docOf(st, day, { ms: Date.now() - t0, src: { mode: 'inc', phase: meta.phase, c2Docs: base.c2Docs, opDocs: base.opDocs, rows: T2.rows(), runRows: meta.last.rows, runs: meta.runs, seen: SS.count(), hiMB: Math.round(hiMB) }, partial: !live || !!why, few: st.n < 50, pruned: st.pruned });
      const msg = `🗣 구매평 연구 요약 ${live ? '' : '(처음 전체 세는 중 ' + meta.phase + ') '}${st.n} 구매평 · 이번 +${meta.last.rows}줄 · 문서 ${docs} · 힙 +${Math.round(hiMB)}MB${why ? ' · 멈춤 ' + why : ''} · ${Math.round(doc.ms / 1000)}초`;
      if (dry) return doc; if ((live && !why) || !prev) await ref.set({ ...doc, ...W() }); await rref.set({ ok: true, endAt: new Date().toISOString(), ms: doc.ms, n: st.n, phase: meta.phase, runRows: meta.last.rows, why, hiMB: Math.round(hiMB), crashN: 0 }, { merge: true }).catch(() => {}); log(msg); return { n: st.n, q: st.q, partial: !live || !!why, phase: meta.phase, rows: meta.last.rows, why, hiMB: Math.round(hiMB), ms: doc.ms, gen: saved.gen };
    } finally { busy = false; } }
  return { run, busy: () => busy };
}
module.exports = { VOICE_LEX, lexOf, voTopics, voSize, makeAcc, docOf, makeVoiceStudy, makeSeenStore, h53 };
