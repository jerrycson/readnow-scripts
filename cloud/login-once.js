/* (ip1 11/13 · 정범님 14:57 「클라우드 나가는 주소(IP)를 바꾸는 길 — 반드시 관철」) ☁ 클라우드 알라딘 로그인 '한 번만 시험'
 *  기본은 꺼짐: 정범님이 웹앱 🧭 관리도구 › 🔑 알라딘 로그인 › 「☁ 클라우드 로그인 한 번 시험」을 두 번 눌러야만 app_settings/cloud_jobs.loginOnce = { id, at, by } 가 생김
 *  한 번 쓰면 끝: 계정 문서 app_settings/aladin_login.once.id 에 같은 id가 있으면 다시는 시도하지 않음(성공·42FB·실패 모두) — 10/24~26처럼 새 로그인을 되풀이하는 일 0
 *  지키는 조건(모두 맞을 때만 · 아니면 시도하지 않고 기다림 — 이 시험권은 쓰지 않음):
 *   ① 누른 지 24시간 안(지나면 '시간 지남'으로 닫음)  ② 한국 시간 9~21시(사람이 일하는 때)
 *   ③ 🔒 상시 PC(JS-MAIN·MJ-MAIN·HOME) 가운데 한 대 이상이 30분 안에 로그인 신호 — 계정이 멀쩡할 때만(사실 F33: 막힘은 새 기기 · 상시 PC 로그인은 그대로)
 *  성공하면 세션을 저장해 이어 씀(다음 컨테이너도 새로 로그인하지 않음) · 세션이 풀린 뒤 다시 새로 로그인하는 것은 여전히 cloud_jobs.cloudLogin(정범님만 켬)
 *  순수 함수만(저장·네트워크 없음) — 시험 src/tests/tIP1_1113.js */
'use strict';
const ONCE_TTL = 24 * 3600e3;
const kstH = (ms) => new Date(+ms + 9 * 3600e3).getUTCHours();
/* 이 시험권으로 지금 시도해도 되나 — once = cloud_jobs.loginOnce · doc = aladin_login 문서 · always = 상시 PC 이름 목록
 *  → { go, kind, why, close? } · close = 문서에 남길 닫힘(시간 지남)
 *  kind: none(시험권 없음) · used(이미 씀) · expired(24시간 지남) · hour(9~21시 밖) · pc(상시 PC 로그인 신호 없음) · ok */
function gate(once, doc, now, always) {
  if (!once || typeof once.id !== 'string' || !/^[A-Za-z0-9_-]{4,40}$/.test(once.id)) return { go: false, kind: 'none', why: '' };
  const done = (doc && doc.once) || {};
  if (done.id === once.id) return { go: false, kind: 'used', why: `☁ 한 번 시험은 이미 함(${done.result || '진행'})` };
  const at = +once.at || 0;
  if (!at || at > now + 5 * 60e3 || now - at > ONCE_TTL) return { go: false, kind: 'expired', why: '☁ 한 번 시험을 누른 지 24시간이 지나 닫음(시도하지 않음)', close: { id: once.id, by: once.by || null, at: now, result: 'expired' } };
  const h = kstH(now); if (h < 9 || h >= 21) return { go: false, kind: 'hour', why: '☁ 한 번 시험은 한국 시간 9~21시에만(사람이 일하는 때)' };
  const D = (doc && doc.dev) || {}; const UP = (x) => String(x || '').trim().toUpperCase(); const AL = (always || []).map(UP);
  const live = Object.entries(D).filter(([w, v]) => AL.includes(UP(w)) && v && v.in === true && now - (+v.at || 0) < 30 * 60e3).map(([w]) => w);
  if (!live.length) return { go: false, kind: 'pc', why: '☁ 한 번 시험은 🔒 상시 PC가 로그인돼 있을 때만(계정이 멀쩡한지 먼저)' };
  return { go: true, kind: 'ok', why: '', live };
}
/* 시도 직전 계정 문서에 적을 것 — 같은 트랜잭션 안에서 다시 확인(컨테이너 둘이 함께 잡지 않게) */
const claim = (once, now, ip) => ({ id: once.id, by: once.by || null, pressAt: +once.at || null, at: now, ip: ip || null, result: 'trying' });
/* 결과 — ok 참 = 됨 · blocked = 42FB · 그 밖 = 안 됨 */
const result = (once, now, r) => ({ id: once.id, doneAt: now, result: r.ok ? 'ok' : r.blocked ? '42FB' : 'fail', code: r.code || null, why: r.ok ? null : String(r.why || '').slice(0, 200), ip: r.ip || null });
module.exports = { gate, claim, result, ONCE_TTL };
