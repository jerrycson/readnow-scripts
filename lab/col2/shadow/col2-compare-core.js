/* col2-compare-core.js — 운영 결과(prd_books 문서)와 그림자 결과(같은 해석 코드로 다시 읽은 화면)를 칸마다 견줌 (순수 함수 · Node·브라우저 같이)
 * 칸 = 운영 수집기 BOOK_FIXED(col2-config.js) + aladinItemId
 * 운영 문서는 '처음 값을 지키는' 칸이라(수집기 refreshOne0) 다르게 보여도 다 고장은 아님 — 까닭을 나눠 적음:
 *   same  같음
 *   seen  같음 — 운영도 지금 화면에서 이 값을 봤음(seenInfo) · 처음 값을 지켜서 문서 값만 다름
 *   ext   출처 다름 — 운영 문서 값은 교보·예스24·네이버에서 온 것(infoFrom) · 알라딘 화면 값과 다를 수 있음
 *   fill  운영 문서 칸이 비어 있음(그림자만 값이 있음)
 *   lack  그림자 칸이 비어 있음(운영만 값이 있음) — 해석이 달라졌을 수 있음 → 다름으로 셈
 *   old   운영이 오래전에 읽음 — 운영 마지막 읽기(lastFetchedAt)가 oldDays일(기본 7) 넘게 지났고 그 뒤 화면 값을 본 적 없음(seenInfo 없음) → 그사이 알라딘 화면이 바뀌었을 수(까닭 있는 다름)
 *         (11/11 col2rep1 · 11/11 진단: 상품 화면 다름 53건 중 분류(categories) 39건 — 처음 값을 지키는 칸이라 운영이 다시 읽기 전엔 seenInfo가 없음)
 *   diff  다름 */
(function (root) {
  'use strict';
  const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {}) : v);
  const stab = (v) => JSON.stringify(sortKeys(v === undefined ? null : v));
  const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
  const LABEL = { old: '운영이 오래전에 읽음(그 뒤 화면이 바뀌었을 수)', same: '같음', seen: '같음(운영도 지금 이 값을 봄 · 처음 값을 지킴)', ext: '출처 다름(운영은 바깥 정보 값)', fill: '운영 칸 비어 있음', lack: '그림자 칸 비어 있음', diff: '다름' };
  const ageDays = (prod, now) => { const t = prod && prod.lastFetchedAt; const ms = typeof t === 'string' ? Date.parse(t) : t && typeof t === 'object' && (t.seconds != null || t._seconds != null) ? (+(t.seconds ?? t._seconds)) * 1000 : +t || NaN; return Number.isFinite(ms) && ms > 0 ? ((now || Date.now()) - ms) / 864e5 : null; };
  function compareBook(prod, sh, fields, o) { o = o || {}; const F = ['aladinItemId', ...(fields || [])]; const rows = []; const n = { same: 0, seen: 0, ext: 0, fill: 0, lack: 0, old: 0, diff: 0 };
    const age = ageDays(prod, o.now); const oldD = Number.isFinite(+o.oldDays) && +o.oldDays > 0 ? +o.oldDays : 7; const isOld = age != null && age > oldD;
    const seenInfo = (prod && prod.seenInfo) || {}; const infoFrom = (prod && prod.infoFrom) || {};
    for (const f of F) { const a = prod ? prod[f] : null, b = sh ? sh[f] : null; let k;
      if (empty(a) && empty(b)) continue;
      if (stab(a) === stab(b)) k = 'same';
      else if (seenInfo[f] != null && stab(seenInfo[f]) === stab(b)) k = 'seen';
      else if (infoFrom[f]) k = 'ext';
      else if (empty(a)) k = 'fill';
      else if (empty(b)) k = 'lack';
      else k = isOld && f !== 'aladinItemId' ? 'old' : 'diff';
      n[k]++; rows.push({ f, k, label: LABEL[k], prod: a == null ? null : a, shadow: b == null ? null : b }); }
    const bad = n.diff + n.lack + n.old; return { rows, n, ageDays: age == null ? null : Math.round(age * 10) / 10, verdict: !prod ? 'noprod' : bad ? 'diff' : 'same', diffFields: rows.filter((r) => r.k === 'diff' || r.k === 'lack' || r.k === 'old').map((r) => r.f) }; }
  /* 그림자 결과에서 저장할 칸만(작게) */
  function pickPage(page, fields) { const o = {}; for (const f of ['aladinItemId', ...(fields || []), 'priceList', 'priceSales']) o[f] = page && page[f] !== undefined ? page[f] : null; return o; }
  const show = (v) => (v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  /* (0.1.9) 그림자 일 견주기 — map = { 운영 칸: 그림자 칸 } · move = 시간 따라 움직이는 칸(운영이 moveMin분 넘게 전에 읽었으면 다름을 '때가 다름'으로 밝힘)
   *  까닭: same · move · fill(운영 빔) · lack(그림자 빔 — 까닭 모름으로 셈) · diff(까닭 모름) */
  function compareMap(prod, sh, map, o) { o = o || {}; const rows = []; const n = { same: 0, move: 0, fill: 0, lack: 0, diff: 0 }; if (!prod) return { rows, n, verdict: 'noprod', reasons: [] };
    const age = o.prodAt ? (Date.now() - Date.parse(o.prodAt)) / 60e3 : Infinity; const mv = new Set(o.move || []);
    for (const [pf, sf] of Object.entries(map || {})) { const a = prod[pf], b = sh ? sh[sf] : null; if (empty(a) && empty(b)) continue; let k;
      if (stab(a) === stab(b)) k = 'same'; else if (mv.has(pf) && !(age < (o.moveMin || 60))) k = 'move'; else if (empty(a)) k = 'fill'; else if (empty(b)) k = 'lack'; else k = 'diff';
      n[k]++; rows.push({ f: pf, k, prod: a == null ? null : a, shadow: b == null ? null : b }); }
    const reasons = [...new Set(rows.filter((r) => r.k !== 'same').map((r) => r.k))]; return { rows, n, verdict: reasons.length ? 'diff' : 'same', reasons, diffFields: rows.filter((r) => r.k !== 'same').map((r) => r.f) }; }
  /* (0.1.9) 외부 정보 — 운영이 저장한 지문(ext_<묶음>/<ISBN>.src.<출처>.sig)과 같은 방식(ReadnowExt.sig·sameSig)으로 견줌
   *  basic(도서 정보)은 바뀌지 않는 값이라 다르면 '까닭 모름' · 장터·외국·전자책·도서관은 운영이 oldH시간 넘게 전에 봤으면 '운영 값이 오래됨' */
  function compareExt(X, src, prev, res, o) { o = o || {}; if (!res || res.skip) return { verdict: 'skip', reasons: [], why: res && res.skip };
    if (!res.ok) return { verdict: 'fail', reasons: [], why: res.why || '못 읽음' }; if (!prev) return { verdict: 'noprod', reasons: [] };
    if (!prev.sig && !prev.at) return { verdict: 'noprod', reasons: [], why: '운영도 이 출처로 못 읽음(실패만 적힘)' }; /* (11/11 col2rep5) 예전엔 운영 칸에 실패(err)만 있어도 지문이 없어 '까닭 모를 다름'으로 셈 */
    let d = res.d == null ? null : JSON.parse(JSON.stringify(res.d)); const sg = X.sig({ none: !!res.none, d }, src); const same = X.sameSig ? X.sameSig(src, prev, sg) : prev.sig === sg ? 'sig' : '';
    if (same) return { verdict: 'same', reasons: [], how: same, sig: sg, prodSig: prev.sig || null };
    const grp = (X.SOURCES[src] || {}).grp; const age = (Date.now() - Date.parse(prev.chk || prev.at || 0)) / 3600e3; let r;
    /* (11/11 col2rep3) 칸마다 무엇이 다른지(rows) — 11/11 진단: 구글 북스 21건·카카오 10건이 '다름'인데 칸이 없어 까닭을 못 찾았음 · 기본 정보도 값·판매 상태·표지 주소는 시간이 지나면 바뀜 */
    const rows = []; const A = prev.d && typeof prev.d === 'object' ? prev.d : {}, B = d && typeof d === 'object' ? d : {};
    if (!res.none && !prev.none) for (const f of [...new Set([...Object.keys(A), ...Object.keys(B)])]) { if (EXT_SKIP.has(f)) continue; if (stab(A[f]) === stab(B[f])) continue; rows.push({ f, k: EXT_MOVE.has(f) ? 'move' : 'diff', prod: A[f] === undefined ? null : show(A[f]).slice(0, 160), shadow: B[f] === undefined ? null : show(B[f]).slice(0, 160) }); }
    if (res.none && prev.d && !prev.none) r = 'none'; else if (grp !== 'basic' && !(age < (o.oldH || 6))) r = 'old';
    else if (grp === 'basic' && rows.length && rows.every((x) => x.k === 'move') && !(age < (o.moveH || 6))) r = 'move'; /* 값·상태·표지만 다르고 운영이 6시간 넘게 전에 읽음 = 때가 다름(까닭 있음) */
    else r = 'diff';
    return { verdict: 'diff', reasons: [r], rows: rows.slice(0, 8), sig: sg, prodSig: prev.sig || null, ageH: Number.isFinite(age) ? Math.round(age * 10) / 10 : null }; }
  /* 기본 정보 결과에서 시간이 지나면 바뀌는 칸(값·판매 상태·표지 주소·평점) — 이것만 다르면 '때가 다름' · 지문에 들지 않는 칸(주소 등)은 견주지 않음 */
  const EXT_MOVE = new Set(['priceList', 'priceSales', 'listPrice', 'status', 'cover', 'rating', 'ratingN', 'reviewN', 'salesIndex', 'salesPoint', 'rank']);
  const EXT_SKIP = new Set(['url', 'api', 'rendered', 'apiTried', 'trunc', 'hit', 'ago', 'queryEcho']);
  const api = { compareBook, pickPage, stab, empty, LABEL, show, compareMap, compareExt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Compare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
