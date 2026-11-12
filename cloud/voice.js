/* 🗣 구매평·문의 연구 요약(app_settings/voice_study)을 클라우드가 매일 셈 (cres1 · 11/12)
 *  왜: 예전엔 웹앱 📊 경영 › 🗣 구매평·문의 연구 화면을 관리자 기기가 열고 '글 더 받기'로 끝까지 받아야만 요약이 생겨, 문서가 없거나 오래됨
 *       → 매일 엔진 한 걸음·등록 카드 '📣 구매평에서 자주 나온 말'이 읽을 것이 없었음
 *  셈은 웹앱 src/app.html '🗣 판매자 목소리' 순수 셈(voTopics·voRows·voStats)과 같음 — src/tests/tVOICE_CLOUD1112.js가 같은 자료로 두 셈이 같은지 봄
 *  다른 점: 글을 모두 메모리에 쌓지 않고 조각(문서)마다 바로 셈(흘려 셈) — 글 원문은 셈에만 쓰고 버림 · 저장은 숫자·낱말만(웹앱 voSave와 같은 꼴 + by:'cloud')
 *  자료: col2_voice(번외 수집 조각) → seller_reviews(운영 판매자 평가) 차례(웹앱과 같음 · 같은 글은 한 번만) · 규모 = sellers.totalReviewCount 또는 col2_voice_s 요약
 *        우리 숍 견줌 = crm_interactions(type review)의 만족도·글 — 이 안에서만 셈하고 수만 남김(손님 이름·아이디 없음)
 *  무거움 막이: 문서는 조금씩(page) · 시간 상한(budgetMs) 넘으면 거기까지로 저장(partial:true) · 낱말 세기 표가 너무 크면 1번 나온 낱말은 버림 */
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
  const seen = new Set(); const sellers = new Set(); const cnt = { good: 0, mid: 0, bad: 0 }; let n = 0, cov = 0, q = 0, qSec = 0, qAns = 0, rows = 0;
  const T = Object.fromEntries(lex.map((t) => [t.k, { n: 0, bad: 0, good: 0, q: 0 }])); const mon = new Map(); const sz = new Map(); const wc = new Map(); const wa = new Map(); let pruned = 0;
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
    rows: () => rows,
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

/* 매일 일 — { C, FieldPath, log, W } 를 받아 씀 · force=20시간 막이 무시 · dry=쓰지 않고 돌려줌(진단) */
function makeVoiceStudy(dep) { const { C, FieldPath, log } = dep; const W = dep.W || (() => ({})); let busy = false;
  const kday = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
  /* (0.35.146) 메모리 막이 — 0.35.145는 쓰레기(다 쓴 문서)까지 센 rss 1.1GB에 걸려 74%에서 멈춤 → 10쪽마다 쓰레기를 치우고(node --expose-gc) 그 뒤 살아 있는 힙이 heapMax(기본 800MB)를 넘을 때만 멈춤 */
  let pg = 0; const memHi = () => { try { if (++pg % 10 === 0 && typeof global.gc === 'function') global.gc(); const m = process.memoryUsage(); return m.heapUsed > (dep.heapMax || 800) * 1048576 && (typeof global.gc !== 'function' || (global.gc(), process.memoryUsage().heapUsed > (dep.heapMax || 800) * 1048576)); } catch (e) { return false; } };
  async function pages(col, fields, page, t0, budget, each) { let last = null, docs = 0, done = true; for (;;) { if (Date.now() - t0 > budget || memHi()) { done = false; break; } /* (0.35.145) 메모리가 1.1GB를 넘으면 거기까지(크롬·출고 일과 함께 2GB 안) */ let qq = C(col).orderBy(FieldPath.documentId()).select(...fields).limit(page); if (last) qq = qq.startAfter(last); const g = await qq.get(); g.forEach((d) => { docs++; each(d.data() || {}, d.id); }); if (g.size < page) break; last = g.docs[g.docs.length - 1]; await new Promise((z) => setImmediate(z)); } return { docs, done }; }
  async function run(force, dry, opt) { opt = opt || {}; const ref = C('app_settings').doc('voice_study'); if (busy) return { busy: 1 }; let prev = null; try { prev = (await ref.get()).data() || null; } catch (e) {}
    if (!force && prev && prev.by === 'cloud' && Date.now() - Date.parse(prev.at || 0) < 20 * 3600e3) /* (0.35.146) 거기까지(partial)여도 20시간 안엔 다시 안 읽음(문서 1만 4천 개를 2시간마다 다시 읽지 않게) */ return { skip: 1, at: prev.at };
    const rref = C('app_settings').doc('voice_study_run'); if (!force) { try { const rr = (await rref.get()).data() || {}; if (rr.ok === false && Date.now() - Date.parse(rr.startAt || 0) < 24 * 3600e3) { log('🗣 구매평 연구 요약 건너뜀 — 지난번이 끝나지 않음(클라우드가 멈췄을 수 있음 · 24시간 쉼)', rr.startAt); return { skip: 'crash', at: rr.startAt }; } } catch (e) {} }
    busy = true; const t0 = Date.now(); const budget = +opt.budgetMs || 8 * 60e3; const page = +opt.page || 20; if (!dry) await rref.set({ startAt: new Date().toISOString(), ok: false }).catch(() => {}); /* (0.35.145) 멈춤 고리 막이 — 끝나지 않은 채 다시 뜨면 하루 쉼 */
    try { let add = null; try { add = ((await C('app_settings').doc('voice_lex').get()).data() || {}).add || null; } catch (e) {} const lex = lexOf(add);
      const N = new Map(); try { (await C('sellers').select('totalReviewCount').get()).forEach((d) => { const v = Number(String(d.data().totalReviewCount ?? '').replace(/[^\d]/g, '')); if (Number.isFinite(v) && v > 0) N.set(String(d.id).replace(/^sc_/, ''), v); }); } catch (e) {}
      try { (await C('col2_voice_s').get()).forEach((d) => { if (N.has(d.id)) return; const m = d.data() || {}; const v = m.n != null ? m.n : m.r ? m.r.n : null; if (v != null) N.set(d.id, v); }); } catch (e) {}
      const A = makeAcc({ lex, sizeOf: (sc) => voSize(N.has(sc) ? N.get(sc) : null) });
      const c2 = await pages('col2_voice', ['sc', 'kind', 'items'], page, t0, budget, (v) => A.c2(v));
      const op = c2.done ? await pages('seller_reviews', ['sc', 'sellerId', 'items'], Math.max(page, 50), t0, budget, (v) => A.op(v)) : { docs: 0, done: false };
      const ours = []; try { (await C('crm_interactions').where('type', '==', 'review').select('rating', 'body').get()).forEach((d) => { const v = d.data() || {}; ours.push({ r: RATE[String(v.rating || '').trim()] || null, c: String(v.body || '') }); }); } catch (e) {}
      const st = A.result(ours); ours.length = 0; const partial = !(c2.done && op.done); const day = kday(Date.now());
      const doc = docOf(st, day, { ms: Date.now() - t0, src: { c2Docs: c2.docs, opDocs: op.docs, rows: A.rows() }, partial, few: st.n < 50, pruned: st.pruned });
      if (dry) return doc; await ref.set({ ...doc, ...W() }); await rref.set({ ok: true, endAt: new Date().toISOString(), ms: doc.ms, n: st.n }, { merge: true }).catch(() => {}); log('🗣 구매평 연구 요약', st.n, '구매평 ·', st.q, '문의 · 판매자', st.sellers, partial ? '· 시간 넘김(거기까지)' : '', Math.round(doc.ms / 1000) + '초'); return { n: st.n, q: st.q, partial, ms: doc.ms };
    } finally { busy = false; } }
  return { run };
}
module.exports = { VOICE_LEX, lexOf, voTopics, voSize, makeAcc, docOf, makeVoiceStudy };
