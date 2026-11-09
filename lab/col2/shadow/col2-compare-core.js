/* col2-compare-core.js — 운영 결과(prd_books 문서)와 그림자 결과(같은 해석 코드로 다시 읽은 화면)를 칸마다 견줌 (순수 함수 · Node·브라우저 같이)
 * 칸 = 운영 수집기 BOOK_FIXED(col2-config.js) + aladinItemId
 * 운영 문서는 '처음 값을 지키는' 칸이라(수집기 refreshOne0) 다르게 보여도 다 고장은 아님 — 까닭을 나눠 적음:
 *   same  같음
 *   seen  같음 — 운영도 지금 화면에서 이 값을 봤음(seenInfo) · 처음 값을 지켜서 문서 값만 다름
 *   ext   출처 다름 — 운영 문서 값은 교보·예스24·네이버에서 온 것(infoFrom) · 알라딘 화면 값과 다를 수 있음
 *   fill  운영 문서 칸이 비어 있음(그림자만 값이 있음)
 *   lack  그림자 칸이 비어 있음(운영만 값이 있음) — 해석이 달라졌을 수 있음 → 다름으로 셈
 *   diff  다름 */
(function (root) {
  'use strict';
  const sortKeys = (v) => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {}) : v);
  const stab = (v) => JSON.stringify(sortKeys(v === undefined ? null : v));
  const empty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
  const LABEL = { same: '같음', seen: '같음(운영도 지금 이 값을 봄 · 처음 값을 지킴)', ext: '출처 다름(운영은 바깥 정보 값)', fill: '운영 칸 비어 있음', lack: '그림자 칸 비어 있음', diff: '다름' };
  function compareBook(prod, sh, fields) { const F = ['aladinItemId', ...(fields || [])]; const rows = []; const n = { same: 0, seen: 0, ext: 0, fill: 0, lack: 0, diff: 0 };
    const seenInfo = (prod && prod.seenInfo) || {}; const infoFrom = (prod && prod.infoFrom) || {};
    for (const f of F) { const a = prod ? prod[f] : null, b = sh ? sh[f] : null; let k;
      if (empty(a) && empty(b)) continue;
      if (stab(a) === stab(b)) k = 'same';
      else if (seenInfo[f] != null && stab(seenInfo[f]) === stab(b)) k = 'seen';
      else if (infoFrom[f]) k = 'ext';
      else if (empty(a)) k = 'fill';
      else if (empty(b)) k = 'lack';
      else k = 'diff';
      n[k]++; rows.push({ f, k, label: LABEL[k], prod: a == null ? null : a, shadow: b == null ? null : b }); }
    const bad = n.diff + n.lack; return { rows, n, verdict: !prod ? 'noprod' : bad ? 'diff' : 'same', diffFields: rows.filter((r) => r.k === 'diff' || r.k === 'lack').map((r) => r.f) }; }
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
    let d = res.d == null ? null : JSON.parse(JSON.stringify(res.d)); const sg = X.sig({ none: !!res.none, d }, src); const same = X.sameSig ? X.sameSig(src, prev, sg) : prev.sig === sg ? 'sig' : '';
    if (same) return { verdict: 'same', reasons: [], how: same, sig: sg, prodSig: prev.sig || null };
    const grp = (X.SOURCES[src] || {}).grp; const age = (Date.now() - Date.parse(prev.chk || prev.at || 0)) / 3600e3; let r;
    if (res.none && prev.d && !prev.none) r = 'none'; else if (grp !== 'basic' && !(age < (o.oldH || 6))) r = 'old'; else r = 'diff';
    return { verdict: 'diff', reasons: [r], sig: sg, prodSig: prev.sig || null, ageH: Number.isFinite(age) ? Math.round(age * 10) / 10 : null }; }
  const api = { compareBook, pickPage, stab, empty, LABEL, show, compareMap, compareExt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Compare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
