/* (cap2x 11/18 정범님 16:24 「알라딘 부르는 횟수가 이렇게 비약적으로 많으면 두 배까지만 늘려」) cap3x가 3배로 올린 설정 문서의 하루 몫을 원래 값의 2배로 한 번만 낮추는 셈(순수 함수 · 쓰기는 cloud/index.js cap2xOnce가 거래 하나 안에서)
 *  · 내리기만 함(지금 값이 목표 이하이면 그대로 — 사람이 그 사이 더 낮췄으면 건드리지 않음) · 틈·쉼·밤·막힘 멈춤·테더링 바닥은 이 파일이 건드리지 않음
 *  · 목표 = cap3x 표시(app_settings/cap3x_1118.<칸>.from — 3배 하기 전 원래 값) × 2 · 공식 하루 쿼터가 있는 출처는 그 쿼터까지 · 표시가 없으면 아래 기본 목표
 *  · 표시(app_settings/cap2x_1118.<칸>)가 있으면 다시 안 함 — 거래 안에서 표시를 읽으므로 인스턴스가 여럿이어도 한 번만 · cap3x_1118 표시는 지우지 않음(되돌릴 때 그 from 값)
 *  · 되돌릴 때는 이 표시 안의 from 값(3배 값)을 그대로 다시 적으면 됨 */
'use strict';
const VER = '0.1.0';
/* 공식 하루 쿼터(구글 북스 1,000 · 카카오 30,000 · eBay 5,000 · 도서관 정보나루 첫 하루 500) — 2배가 이보다 크면 쿼터까지 */
const QUOTA = { google: 1000, kakao: 30000, ebay: 5000, lib: 500 };
/* 표시가 없을 때 기본 목표(원래 값 ×2 · 쿼터까지) — 끝난 서비스(naver·ttb)는 넣지 않음 */
const EXT_TO2 = { kyobo: 1000, yes24: 1000, yes24used: 800, bunjang: 800, joongna: 600, daangn: 600, abebooks: 400, ridi: 600, nl: 6000, google: 1000, kakao: 30000, ebay: 5000, lib: 500 };
/* 번외 공통 값(웹앱 C2SET과 같은 열쇠·이름·단위 · d = 원래 번외 코드 기본값) — 로거 몫 logger.dayCap(테더링 바닥)은 넣지 않음 */
const C2 = { 'pace.dayCap': { d: 1600, t: '🟧 알라딘 화면 하루', u: '장' }, 'alcfg.dayCap': { d: 300, t: '🟧 샵매니저 읽기 하루', u: '번' } };
const NB_D = 120; /* 새책 찾기 원래 설정 값(11/18 cap3x 전 nb_find cfg.dayCap) */
const BY = 'cloud cap2x(정범님 11/18 16:24 몫 2배까지만)';
const num = (v) => (v != null && v !== '' && isFinite(+v) ? +v : null);
const fmt = (n, u) => Number(n).toLocaleString('en-US') + ' ' + u;
const two = (k, f) => Math.min(QUOTA[k] || Infinity, f * 2);
/* 새책 찾기 nb_find — cfg.dayCap이 목표보다 크면 목표로 */
function planNb(doc, m3) { const c = ((doc || {}).cfg) || {}; const cur = num(c.dayCap); const f3 = num(((m3 || {}).nb || {}).from); const to = (f3 != null ? f3 : NB_D) * 2;
  if (cur == null || cur <= to) return { write: null, rec: { from: cur, to: cur, why: cur == null ? '설정 칸 없음 — 코드 기본값이 2배' : '이미 2배 이하' } }; return { write: { cfg: { dayCap: to } }, rec: { from: cur, to } }; }
/* 외부 정보 ext — src.<출처>.cap만(on·refreshDays는 그대로 · merge로 씀) */
function planExt(doc, m3) { const src = ((doc || {}).src) || {}; const f3 = (((m3 || {}).ext || {}).from) || {}; const up = {}, from = {}, to = {};
  for (const [k, d] of Object.entries(EXT_TO2)) { const x = src[k]; const cur = x ? num(x.cap) : null; const o = num(f3[k]); const t = o != null ? two(k, o) : d; if (cur == null || cur <= t) continue; from[k] = cur; to[k] = t; up[k] = { cap: t }; }
  return { write: Object.keys(up).length ? { src: up } : null, rec: { from, to } }; }
/* 번외 공통 값 col2_cfg — 웹앱 c2CfgWrite와 같은 꼴(v·at·by·log 줄)로 통째 씀(다른 칸은 그대로 옮김) */
function planC2(doc, m3, nowMs) { const o = doc || {}; const V = { ...(o.v || {}) }; const lg = Array.isArray(o.log) ? o.log.slice(0, 80) : []; const at = Math.max(+nowMs || Date.now(), (+o.at || 0) + 1); const f3 = (((m3 || {}).c2 || {}).from) || {}; const from = {}, to = {};
  for (const [k, r] of Object.entries(C2)) { const cur = num(V[k]); if (cur == null) continue; const b = num(f3[k]); const n = (b != null ? b : r.d) * 2; if (cur <= n) continue; from[k] = cur; to[k] = n; V[k] = n; lg.unshift({ k, t: r.t, from: fmt(cur, r.u), to: fmt(n, r.u), by: BY, at }); }
  return { write: Object.keys(to).length ? { ...o, v: V, at, by: BY, log: lg.slice(0, 80) } : null, rec: { from, to } }; }
module.exports = { VER, QUOTA, EXT_TO2, C2, NB_D, BY, planNb, planExt, planC2 };
