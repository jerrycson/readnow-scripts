/* (cap3x 11/18 정범님 노트 「하루 몫 600쪽을 3배 · 모든 수집기 몫 3배」) 설정 문서에 적혀 있던 하루 몫을 한 번만 3배로 올리는 셈(순수 함수 · 쓰기는 cloud/index.js cap3xOnce가 거래 하나 안에서)
 *  · 올리기만 함(지금 값이 목표 이상이면 그대로) · 틈·쉼·밤·막힘 멈춤·테더링 바닥은 이 파일이 건드리지 않음
 *  · 표시(app_settings/cap3x_1118.<칸>)가 있으면 다시 안 함 — Cloud Run 인스턴스가 여럿이어도 거래 안에서 표시를 읽으므로 두 번(9배) 올라가지 않음
 *  · 되돌릴 때는 표시 안의 from 값을 그대로 다시 적으면 됨 */
'use strict';
const VER = '0.1.0';
/* 외부 정보 출처별 목표(전 값 ×3 · 공식 하루 쿼터가 있는 출처는 그 쿼터까지: 구글 북스 1,000 · 카카오 30,000 · eBay 5,000 · 도서관 정보나루 첫 하루 500) · 끝난 서비스(naver·ttb)는 넣지 않음 */
const EXT_TO = { kyobo: 1500, yes24: 1500, yes24used: 1200, bunjang: 1200, joongna: 900, daangn: 900, abebooks: 600, ridi: 900, nl: 9000, google: 1000, kakao: 30000, ebay: 5000, lib: 500 };
/* 번외 공통 값(웹앱 C2SET과 같은 열쇠·이름·단위 · d = 번외 코드 기본값) — 로거 몫 logger.dayCap(테더링 바닥)은 넣지 않음 */
const C2 = { 'pace.dayCap': { d: 1600, t: '🟧 알라딘 화면 하루', u: '장', hi: 20000 }, 'alcfg.dayCap': { d: 300, t: '🟧 샵매니저 읽기 하루', u: '번', hi: 5000 } };
const BY = 'cloud cap3x(정범님 노트 몫 3배)';
const num = (v) => (v != null && v !== '' && isFinite(+v) ? +v : null);
const fmt = (n, u) => Number(n).toLocaleString('en-US') + ' ' + u;
/* 새책 찾기 nb_find — cfg.dayCap이 있으면 ×3 · 없으면 코드 기본값(NB_DEF)이 이미 3배라 쓰지 않음 */
function planNb(doc) { const c = ((doc || {}).cfg) || {}; const from = num(c.dayCap); if (from == null) return { write: null, rec: { from: null, to: null, why: '설정 칸 없음 — 코드 기본값이 3배' } }; return { write: { cfg: { dayCap: from * 3 } }, rec: { from, to: from * 3 } }; }
/* 외부 정보 ext — src.<출처>.cap만(on·refreshDays는 그대로 · merge로 씀) */
function planExt(doc) { const src = ((doc || {}).src) || {}; const up = {}, from = {}, to = {}; for (const [k, t] of Object.entries(EXT_TO)) { const x = src[k]; const f = x ? num(x.cap) : null; if (f == null || f >= t) continue; from[k] = f; to[k] = t; up[k] = { cap: t }; } return { write: Object.keys(up).length ? { src: up } : null, rec: { from, to } }; }
/* 번외 공통 값 col2_cfg — 웹앱 c2CfgWrite와 같은 꼴(v·at·by·log 줄)로 통째 씀(다른 칸은 그대로 옮김) */
function planC2(doc, nowMs) { const o = doc || {}; const V = { ...(o.v || {}) }; const lg = Array.isArray(o.log) ? o.log.slice(0, 80) : []; const at = Math.max(+nowMs || Date.now(), (+o.at || 0) + 1); const from = {}, to = {};
  for (const [k, r] of Object.entries(C2)) { const f = num(V[k]) != null ? num(V[k]) : r.d; const n = Math.min(r.hi, f * 3); if (n <= f) continue; from[k] = f; to[k] = n; V[k] = n; lg.unshift({ k, t: r.t, from: fmt(f, r.u), to: fmt(n, r.u), by: BY, at }); }
  return { write: Object.keys(to).length ? { ...o, v: V, at, by: BY, log: lg.slice(0, 80) } : null, rec: { from, to } }; }
module.exports = { VER, EXT_TO, C2, BY, planNb, planExt, planC2 };
