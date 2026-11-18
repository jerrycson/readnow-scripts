/* (cap2x 11/18 정범님 16:24 「알라딘 부르는 횟수가 이렇게 비약적으로 많으면 두 배까지만 늘려」 · 16:32 I-1118-1632-17 「하루 몫이 큰 수집기만 2배 · 작은 것은 3배 그대로」) cap3x가 3배로 올린 설정 문서의 하루 몫 중 큰 것만 원래 값의 2배로 한 번만 낮추는 셈(순수 함수 · 쓰기는 cloud/index.js cap2xOnce가 거래 하나 안에서)
 *  · 경계(리드가 정함) BIG = 500 — cap3x 전 원래 하루 몫이 500 이상이면 2배로 내림 · 500 아래면 3배 그대로(손대지 않음)
 *  · 내리기만 함(지금 값이 목표 이하이면 그대로 — 사람이 그 사이 더 낮췄으면 건드리지 않음) · 틈·쉼·밤·막힘 멈춤·테더링 바닥은 이 파일이 건드리지 않음
 *  · 원래 값 = cap3x 표시(app_settings/cap3x_1118.<칸>.from) · 표시가 없으면 아래 원래 코드 값 · 목표 = 원래 × 2(공식 하루 쿼터가 있는 출처는 그 쿼터까지)
 *  · 표시(app_settings/cap2x_1118.<칸>)가 있으면 다시 안 함 — 거래 안에서 표시를 읽으므로 인스턴스가 여럿이어도 한 번만 · cap3x_1118 표시는 지우지 않음
 *  · 되돌릴 때는 이 표시 안의 from 값(3배 값)을 그대로 다시 적으면 됨 */
'use strict';
const VER = '0.2.0';
const BIG = 500; /* 원래 하루 몫이 이 값 이상이면 2배 · 아래면 3배 그대로 */
/* 공식 하루 쿼터(구글 북스 1,000 · 카카오 30,000 · eBay 5,000 · 도서관 정보나루 첫 하루 500) — 2배가 이보다 크면 쿼터까지 */
const QUOTA = { google: 1000, kakao: 30000, ebay: 5000, lib: 500 };
/* 표시가 없을 때 쓰는 원래(cap3x 전) 출처별 하루 몫 — 끝난 서비스(naver·ttb)는 넣지 않음 */
const EXT_ORIG = { kyobo: 500, yes24: 500, yes24used: 400, bunjang: 400, joongna: 300, daangn: 300, abebooks: 200, ridi: 300, nl: 3000, google: 900, kakao: 25000, ebay: 4000, lib: 450 };
/* 번외 공통 값(웹앱 C2SET과 같은 열쇠·이름·단위 · d = 원래 번외 코드 기본값) — 로거 몫 logger.dayCap(테더링 바닥)은 넣지 않음 */
const C2 = { 'pace.dayCap': { d: 1600, t: '🟧 알라딘 화면 하루', u: '장' }, 'alcfg.dayCap': { d: 300, t: '🟧 샵매니저 읽기 하루', u: '번' } };
const NB_D = 120; /* 새책 찾기 원래 설정 값(11/18 cap3x 전 nb_find cfg.dayCap) — 500 아래라 3배 그대로 */
const BY = 'cloud cap2x(정범님 11/18 큰 몫만 2배)';
const num = (v) => (v != null && v !== '' && isFinite(+v) ? +v : null);
const fmt = (n, u) => Number(n).toLocaleString('en-US') + ' ' + u;
/* 원래 값 o → 목표(2배 · 쿼터까지) 또는 null(작은 몫 · 3배 그대로) */
const target = (o, k) => (o != null && o >= BIG ? Math.min(QUOTA[k] || Infinity, o * 2) : null);
/* 새책 찾기 nb_find — 원래가 500 이상일 때만 cfg.dayCap을 목표로(지금 운영은 120이라 손대지 않음) */
function planNb(doc, m3) { const c = ((doc || {}).cfg) || {}; const cur = num(c.dayCap); const f3 = num(((m3 || {}).nb || {}).from); const o = f3 != null ? f3 : NB_D; const to = target(o);
  if (to == null) return { write: null, rec: { orig: o, from: cur, to: cur, why: `원래 ${o} — ${BIG} 아래라 3배 그대로` } };
  if (cur == null || cur <= to) return { write: null, rec: { orig: o, from: cur, to: cur, why: cur == null ? '설정 칸 없음' : '이미 2배 이하' } }; return { write: { cfg: { dayCap: to } }, rec: { orig: o, from: cur, to } }; }
/* 외부 정보 ext — src.<출처>.cap만(on·refreshDays는 그대로 · merge로 씀) · 원래 500 이상인 출처만 */
function planExt(doc, m3) { const src = ((doc || {}).src) || {}; const f3 = (((m3 || {}).ext || {}).from) || {}; const up = {}, from = {}, to = {}, keep = {};
  for (const [k, d] of Object.entries(EXT_ORIG)) { const x = src[k]; const cur = x ? num(x.cap) : null; const o = num(f3[k]) != null ? num(f3[k]) : d; const t = target(o, k);
    if (t == null) { keep[k] = o; continue; } if (cur == null || cur <= t) continue; from[k] = cur; to[k] = t; up[k] = { cap: t }; }
  return { write: Object.keys(up).length ? { src: up } : null, rec: { from, to, keep3x: keep } }; }
/* 번외 공통 값 col2_cfg — 웹앱 c2CfgWrite와 같은 꼴(v·at·by·log 줄)로 통째 씀(다른 칸은 그대로 옮김) · 원래 500 이상인 칸만(알라딘 화면) */
function planC2(doc, m3, nowMs) { const o = doc || {}; const V = { ...(o.v || {}) }; const lg = Array.isArray(o.log) ? o.log.slice(0, 80) : []; const at = Math.max(+nowMs || Date.now(), (+o.at || 0) + 1); const f3 = (((m3 || {}).c2 || {}).from) || {}; const from = {}, to = {}, keep = {};
  for (const [k, r] of Object.entries(C2)) { const b = num(f3[k]); const og = b != null ? b : r.d; const n = target(og); if (n == null) { keep[k] = og; continue; } const cur = num(V[k]); if (cur == null || cur <= n) continue; from[k] = cur; to[k] = n; V[k] = n; lg.unshift({ k, t: r.t, from: fmt(cur, r.u), to: fmt(n, r.u), by: BY, at }); }
  return { write: Object.keys(to).length ? { ...o, v: V, at, by: BY, log: lg.slice(0, 80) } : null, rec: { from, to, keep3x: keep } }; }
module.exports = { VER, BIG, QUOTA, EXT_ORIG, C2, NB_D, BY, target, planNb, planExt, planC2 };
