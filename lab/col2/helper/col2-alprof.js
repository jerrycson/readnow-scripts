'use strict';
/* col2-alprof — (11/17 bunoe1 · 리드 결정 「길 나」 · 정범님 11/12 「번외 수집기 완전 작동 — Tampermonkey를 전혀 쓰지 않고」)
 *  🧭 알라딘 로그인 길 나 = 그 PC가 늘 쓰던 '로그인된 평소 크롬 프로필'(아는 기기)을 번외가 잠깐 빌려 알라딘 읽기 일을 함
 *  지킴(리드 조건 ①~⑦):
 *   ① HOME부터(alProf.pcs · 기본 ['HOME']) · 로거·MJ-MAIN 금지 · 출고 중이면 안 함
 *   ② 한 번에 한 브라우저만 그 프로필 — 평소 크롬이 켜 있으면(잠금 파일) 기다림(그 동안은 예비 🖐 손발 길 그대로) · 빌린 뒤엔 한 바퀴 읽고 곧바로 닫아 돌려줌
 *   ③ 예비 Tampermonkey(🖐 손발 길)를 지우지 않음 — 그림자 견주기는 예전 다섯 읽기 그대로(col2-al doKind)
 *   ④ 쿠키 값·계정을 읽지도·저장하지도·기록하지도 않음 — 이 파일은 잠금 파일 있음/없음과 폴더 이름만 봄 · 크롬 설정 파일도 안 고침
 *   ⑤ 되돌림 = 설정 한 줄(col2.json alPath:'tm' 또는 줄 지움 — 기본이 'tm')
 *   ⑥ 알라딘 고객센터 문의 없음 · 번외는 이 길에서 로그인하지 않음(F02 — 풀리면 사람에게 평소 크롬으로 로그인을 청할 뿐)
 *   ⑦ 쓰기 일은 이 길에 없음(읽기 22개 그림자 견주기가 맞은 뒤 따로)
 *  크롬 136부터 '기본 사용자 폴더'(…\Google\Chrome\User Data)는 원격 조종 인자를 무시함 → 그 폴더면 띄우지 않고 까닭을 알림(정범님 손 한 번: 평소 크롬을 다른 폴더로 옮기는 기기 시험) */
const fs = require('fs'), path = require('path'), os = require('os');

const DEF_PCS = ['HOME'];
const BAD_PC = /^(LOGGER|MJ-MAIN)/i;

/* 기본 사용자 폴더인지(크롬 136+ 조종 막힘) — Windows·맥·리눅스의 크롬 기본 자리 */
function defaultDirs(env) { env = env || process.env; const out = [];
  if (env.LOCALAPPDATA) out.push(path.join(env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data'));
  const h = env.HOME || env.USERPROFILE || os.homedir();
  if (h) { out.push(path.join(h, 'AppData', 'Local', 'Google', 'Chrome', 'User Data'), path.join(h, 'Library', 'Application Support', 'Google', 'Chrome'), path.join(h, '.config', 'google-chrome')); }
  return out; }
const norm = (p) => path.resolve(String(p || '')).replace(/[\\/]+$/, '').toLowerCase();
function isDefaultDir(dir, env) { if (!dir) return false; const d = norm(dir); return defaultDirs(env).some((x) => norm(x) === d); }

/* 평소 크롬이 그 프로필을 쥐고 있는지 — 잠금 파일만 봄(내용·쿠키 안 읽음)
 *  리눅스·맥: SingletonLock(호스트-pid 링크) → pid가 살아 있으면 쥠 · Windows: lockfile을 크롬이 열어 둔 채면 지울 수도 열 수도 없음 → 쓰기로 열어 보기만(EBUSY·EPERM = 쥠) */
function profLocked(dir, o) { o = o || {}; const fsx = o.fs || fs;
  try { const t = fsx.readlinkSync(path.join(dir, 'SingletonLock')); const pid = +(String(t).match(/-(\d+)$/) || [])[1];
    if (pid) { try { (o.kill || process.kill)(pid, 0); return { locked: true, by: 'SingletonLock', pid }; } catch (e) {} } } catch (e) {}
  const lf = path.join(dir, 'lockfile'); let ex = false; try { fsx.lstatSync(lf); ex = true; } catch (e) {}
  if (ex) { let fd = null; try { fd = fsx.openSync(lf, 'r+'); } catch (e) { if (/EBUSY|EPERM|EACCES/.test(String(e && e.code))) return { locked: true, by: 'lockfile' }; } finally { if (fd != null) try { fsx.closeSync(fd); } catch (e) {} } }
  return { locked: false }; }

/* 순수 판단 — 지금 이 PC에서 평소 프로필을 빌려도 되나
 *  in: { path, pc, pcs, dir, hold, pp, locked, isDefault, exists, loginNeed }
 *  out: { on, go, wait, why, fb } — on=이 길을 고름 · go=지금 띄움 · wait=평소 크롬이 쥠(기다림) · fb=예비 🖐 손발 길을 그대로 씀 */
function plan(x) { x = x || {}; const pcs = (Array.isArray(x.pcs) && x.pcs.length ? x.pcs : DEF_PCS).map((s) => String(s).toUpperCase()); const pc = String(x.pc || '').toUpperCase();
  if (x.path !== 'prof') return { on: false, go: false, fb: true, why: '로그인 길 = 예비 🖐 손발(Tampermonkey) — col2.json alPath:\'prof\'로 길 나를 켬' };
  if (!pc) return { on: true, go: false, fb: true, why: 'PC 이름을 몰라 길 나를 안 씀' };
  if (BAD_PC.test(pc)) return { on: true, go: false, fb: false, why: pc.startsWith('LOGGER') ? '로거 PC — 알라딘 계정·쿠키를 쓰지 않음(약속 0)' : 'MJ-MAIN(출고 PC) — 길 나를 쓰지 않음' };
  if (!pcs.includes(pc)) return { on: true, go: false, fb: true, why: `길 나는 ${pcs.join('·')}부터 — 이 PC(${pc})는 예비 손발 길 그대로` };
  if (!x.dir) return { on: true, go: false, fb: true, why: '평소 크롬 프로필 폴더(alProf.dir)가 정해지지 않음 — 예비 손발 길 그대로' };
  if (x.exists === false) return { on: true, go: false, fb: true, why: '평소 크롬 프로필 폴더가 없음 — 예비 손발 길 그대로' };
  if (x.isDefault) return { on: true, go: false, fb: true, why: '크롬 136부터 기본 사용자 폴더는 원격 조종이 막힘 — 평소 크롬을 다른 폴더(바로 가기 --user-data-dir)로 한 번 옮겨야 함(정범님 손 · 기기 시험) · 그 전엔 예비 손발 길 그대로' };
  if (x.pp) return { on: true, go: false, fb: false, why: '⛔ 핑퐁 의심으로 멈춤' };
  if (x.hold) return { on: true, go: false, fb: false, why: '🚚 출고 중 — 평소 프로필을 빌리지 않음' };
  if (x.loginNeed) return { on: true, go: false, fb: true, why: '🔐 평소 크롬의 알라딘 로그인이 풀려 있음 — 번외는 로그인하지 않음(평소 크롬에서 한 번 로그인해 주세요)' };
  if (x.locked) return { on: true, go: false, wait: true, fb: true, why: '평소 크롬이 그 프로필을 쓰는 중 — 한 번에 한 브라우저만(기다림 · 그동안 예비 손발 길)' };
  return { on: true, go: true, fb: false, why: '🧭 길 나 — 평소 프로필을 잠깐 빌려 한 바퀴 읽고 곧바로 돌려줌' }; }

/* col2-al에 넘길 지금 값 — 파일 체계는 잠금·폴더 있음만 봄 */
function look(cfg, o) { o = o || {}; const c = cfg || {}; const P = c.alProf || {}; const dir = P.dir ? String(P.dir) : '';
  let exists = null; if (dir) { try { exists = (o.fs || fs).statSync(dir).isDirectory(); } catch (e) { exists = false; } }
  const lk = dir && exists ? profLocked(dir, o) : { locked: false };
  return { path: c.alPath === 'prof' ? 'prof' : 'tm', pc: o.pc || c.pc || '', pcs: P.pcs, dir, exists, isDefault: isDefaultDir(dir, o.env), locked: lk.locked, lockBy: lk.by || null }; }

module.exports = { plan, look, profLocked, isDefaultDir, defaultDirs, DEF_PCS };
