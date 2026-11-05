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
  const api = { compareBook, pickPage, stab, empty, LABEL, show };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Compare = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
