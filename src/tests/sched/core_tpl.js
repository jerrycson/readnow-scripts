/* readnow-autosched-core.js — 리드나우 ⏰ 매일 자동 수집: 계산(엔진)과 칸 편집기 화면 한 곳
 * 수집기(Tampermonkey @require)와 웹앱(설정 › ⏰ 자동 수집)이 같은 파일을 씀 → 어디서 고치든 같은 칸·같은 규칙·같은 화면.
 * 저장·읽기(Firebase)는 쓰는 쪽이 ctx로 넘겨 줌 — 이 파일은 계산과 그리기만. */
(function (G) {
  'use strict';
  const VERSION = '0.1.0';
@@ENG@@
  const kstNow = () => { const k = AS.kst(Date.now()); return { day: k.day, min: k.min }; };
  const esc3 = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
@@META@@
  function createEditor(ctx) {
@@ACC@@
@@HEL@@
@@ED@@
    return { open: asEdOpen, refresh: asEdRefresh, isOpen: () => ED.open, chips: asChips, durTxt: asDurTxt, name: asName, label: asLabel, missTag: asMissTag, missing: asMissing, avg: asAvgMs, dur: asDur, perDay: (s) => asPerDay(s), hm: schedHM, full: schedFull, ST_TXT, ST_ICON };
  }
  const api = { VERSION, AS, META: AS_META, GROUPS: AS_GROUPS, CRM_LBL, createEditor, esc: esc3, kstNow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  G.ReadnowAuto = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
