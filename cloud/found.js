/* 📚 발견 모음 — 클라우드 쓰기·읽기 (found1 · 정범님 11/12 밤 「클로드·일꾼·엔진이 새로 알아낸 모든 것을 한 곳에 · 엔진들도 수시로 참고」)
 *  자리: Firestore research_found/{id} — 한 발견 = 한 문서
 *    { d:'YYYY-MM-DD'(알아낸 날), area(분야), t(한 줄 발견), ev(근거 숫자·출처), use(영향·쓰는 곳), st('확인됨'|'가설'|'뒤집힘'),
 *      src(출처 파일·화면 — 비공개 저장소 경로), by(누가: lead·일꾼 이름·엔진 이름·점검), tags[], inAt(넣은 때), n(같은 발견이 다시 들어온 수) }
 *  + app_settings/research_found_meta { n, at, areas{분야: 수}, j(발견 전부 · 짧은 칸 이름 JSON 글) } — 웹앱 📚 발견 모음은 이 문서 하나만 읽음(Firestore 읽기 1번)
 *  쓰는 길: ① /kp-in 암호문의 found:[…] (리드·일꾼·점검 — src/tools/found.sh) ② 클라우드 엔진 안에서 FOUND.add(rec, by)
 *  읽는 길: FOUND.read({ area, q, st, limit }) — 10분 기억(엔진이 회차마다 불러도 Firestore 읽기 거의 없음)
 *  같은 id가 다시 오면 칸을 merge(글이 같으면 n만 +1) · 지우지 않음(틀린 것은 st '뒤집힘'으로)
 *  공개 저장소에는 이 코드만 — 발견 글은 Firestore·비공개 저장소(readnow-chats/FOUND.md)에만 */
'use strict';
const FOUND_AREAS = ['알라딘', '예스24', '네이버', '시장·매출', '경쟁 판매자', '우리숍', '엔진·수집', '기술·운영', '기타'];
const FOUND_ST = ['확인됨', '가설', '뒤집힘'];
const FOUND_COL = 'research_found';
const s = (x, n) => (x == null ? '' : String(typeof x === 'object' ? JSON.stringify(x) : x).replace(/\s+/g, ' ').trim().slice(0, n));
/* 짧은 글 해시(같은 발견 id 만들기) — 32비트 FNV-1a → 36진 */
const fnv = (t) => { let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
/* 한 발견을 고르게 만듦 — 모양이 틀리면 null(까닭은 bad로) */
function foundNorm(r, by) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { bad: '모양' };
  const t = s(r.t, 300); if (t.length < 6) return { bad: '한 줄 발견(t) 없음' };
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(r.d || '')) ? String(r.d) : new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
  const area = FOUND_AREAS.includes(r.area) ? r.area : '기타';
  const st = FOUND_ST.includes(r.st) ? r.st : '가설';
  let id = String(r.id || '');
  if (!/^f_\d{6}_[a-z0-9_]{2,40}$/.test(id)) { const key = String(r.key || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30); id = `f_${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}_${key.length >= 2 ? key : fnv(t)}`; }
  const tags = (Array.isArray(r.tags) ? r.tags : []).map((x) => s(x, 20)).filter(Boolean).slice(0, 8);
  return { id, rec: { d, area, t, ev: s(r.ev, 700), use: s(r.use, 400), st, src: s(r.src, 200), by: s(r.by || by || 'claude', 40), tags } };
}
function makeFound({ C, FV, log, W }) {
  let memo = null, memoAt = 0; const TTL = 10 * 6e4;
  /* 요약 문서 = 웹앱·엔진이 문서 하나만 읽으면 되게 발견 전부를 짧은 칸 이름으로 묶어 j(글)에 — 900KB 넘으면 근거(ev)를 줄여 맞춤 */
  async function metaBump(added) {
    try { const ss = await C(FOUND_COL).get(); const areas = {}; const L = []; ss.forEach((x) => { const v = x.data() || {}; const a = v.area || '기타'; areas[a] = (areas[a] || 0) + 1; L.push({ id: x.id, d: v.d || '', a, t: v.t || '', e: v.ev || '', u: v.use || '', s: v.st || '가설', r: v.src || '', b: v.by || '', g: v.tags || [], n: v.n || 1 }); });
      L.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : a.id < b.id ? 1 : -1)); let j = JSON.stringify(L); if (j.length > 900000) j = JSON.stringify(L.map((x) => ({ ...x, e: x.e.slice(0, 200), r: '' })));
      await C('app_settings').doc('research_found_meta').set({ n: ss.size, areas, j: j.length <= 950000 ? j : '', at: new Date().toISOString(), lastAdd: added }, { merge: false }); } catch (e) { log('📚 발견 모음 요약 실패', e.message); } }
  /* 여러 발견 넣기 — { n(새로·바뀜), same(글 같음), bad[] } */
  async function addMany(list, by) {
    let n = 0, same = 0; const bad = []; const ids = [];
    for (const r of (Array.isArray(list) ? list : []).slice(0, 500)) {
      const x = foundNorm(r, by); if (x.bad) { bad.push(x.bad); continue; }
      const ref = C(FOUND_COL).doc(x.id); const ex = (await ref.get()).data();
      if (ex && ex.t === x.rec.t && ex.ev === x.rec.ev && ex.st === x.rec.st && ex.use === x.rec.use) { same++; await ref.set({ n: FV.increment(1), seenAt: new Date().toISOString() }, { merge: true }); continue; }
      await ref.set({ ...x.rec, ...(ex ? { prevSt: ex.st || null, editAt: new Date().toISOString() } : { inAt: new Date().toISOString(), n: 1 }), ...W() }, { merge: true }); n++; ids.push(x.id);
    }
    if (n) { memo = null; await metaBump(ids.slice(0, 20)); }
    return { n, same, bad: bad.slice(0, 10), ids: ids.slice(0, 50) };
  }
  /* 엔진이 한 줄 남김 — FOUND.add({ area:'알라딘', key:'sp_kor_label', t:'…', ev:'…', use:'…', st:'가설' }, 'adapt') */
  const add = (rec, by) => addMany([rec], by).then((r) => r).catch((e) => ({ n: 0, err: e.message }));
  /* 엔진이 참고 — FOUND.read({ area:'알라딘', q:'세일즈포인트', st:'확인됨', limit:50 }) → [{ id, d, area, t, ev, use, st }] 최근 순 */
  async function read(o) {
    o = o || {}; if (!memo || Date.now() - memoAt > TTL) { const ss = await C(FOUND_COL).get(); const L = []; ss.forEach((x) => { const v = x.data() || {}; L.push({ id: x.id, d: v.d || '', area: v.area || '기타', t: v.t || '', ev: v.ev || '', use: v.use || '', st: v.st || '가설', src: v.src || '', by: v.by || '', tags: v.tags || [] }); }); L.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : a.id < b.id ? 1 : -1)); memo = L; memoAt = Date.now(); }
    const q = String(o.q || '').toLowerCase();
    return memo.filter((x) => (!o.area || x.area === o.area) && (!o.st || x.st === o.st) && (!q || [x.t, x.ev, x.use, x.tags.join(' ')].join(' ').toLowerCase().includes(q))).slice(0, Math.min(Number(o.limit) || 50, 500));
  }
  return { add, addMany, read, norm: foundNorm, AREAS: FOUND_AREAS };
}
module.exports = { makeFound, foundNorm, FOUND_AREAS, FOUND_ST };
