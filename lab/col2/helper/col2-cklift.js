/* col2-cklift.js — 🔁 평소 크롬의 알라딘(·네이버) 로그인 쿠키를 번외 프로필(col2-al-chrome)로 가져오기 (정범님 11/12 저녁)
 *
 * 왜 이 길인가(까닭):
 *  - 번외 전용 프로필(col2-al-chrome)은 알라딘이 늘 '새 기기'로 봐 로그인을 42FB로 막음(시크릿 창도 같음 · 11/12 정범님 확인).
 *    평소 크롬은 알라딘이 '아는 기기'라 됨 → 평소 크롬의 로그인 상태(쿠키)를 번외 프로필로 옮기면 번외도 '아는 기기'가 됨.
 *  - 크롬 쿠키는 암호화돼 있음: 크롬 ~126은 DPAPI(os_crypt 키 v10), 크롬 127+는 '앱-바운드 암호화'(v20)로 바뀜.
 *    v20 키는 chrome.exe와 '원래 프로필 경로'에 묶여 있어 바깥 프로그램(우리 코드)이 직접 풀 수 없음(복사본에서도 안 됨 — 그래서 SQLite 파일을 직접 읽어 푸는 길은 127+에서 막힘).
 *  - 그래서 '크롬이 자기 쿠키를 스스로 풀게' 함: 평소 크롬이 모두 닫힌 순간, 그 프로필을 우리가 잠깐 화면 없는(headless) 크롬으로 띄워
 *    CDP(Storage.getCookies)로 '평문' 쿠키를 받음(크롬이 v10·v20 가리지 않고 스스로 복호화) → 알라딘(·네이버) 것만 골라 번외 프로필에 Storage.setCookies로 심음.
 *    크롬에 로그인하지 않고, 알라딘에 아무 요청도 보내지 않음(쿠키만 읽음) → 평소 크롬의 '아는 기기' 상태를 건드리지 않음.
 *
 * 절대 지킴: 쿠키 '값'은 메모리에서만 다룸 — 저장소·기록(note)·진단·채팅·파일 어디에도 남기지 않음. 기록에는 개수·호스트·쿠키 '이름'만.
 *  로거 PC는 이 길을 부르지 않음(약속 0 — 계정·쿠키 금지 · 부르는 쪽 col2-al.js에서 먼저 막음).
 */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastLine = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(-1)[0] || '';

/* 가져올 호스트 — 도메인이 이 호스트거나 그 하위 도메인이면 맞음('.aladin.co.kr'·'www.aladin.co.kr'·'image.aladin.co.kr' 모두 'aladin.co.kr') */
function hostOk(domain, hosts) { const h = String(domain || '').replace(/^\./, '').toLowerCase(); return hosts.some((x) => h === x || h.endsWith('.' + x)); }

/* 평소 크롬 '사용자 데이터 폴더'(User Data) 찾기 — 설정(alImport.dir) > 시험 env > 윈도우 기본 자리 */
function regUserDir(cfg, env) { env = env || {}; const c = (cfg && cfg.alImport) || {};
  if (c.dir && safeExists(c.dir)) return c.dir;
  if (env.RN_COL2_REGCHROME_DIR) return env.RN_COL2_REGCHROME_DIR;
  const cands = [env.LOCALAPPDATA, env.USERPROFILE && path.join(env.USERPROFILE, 'AppData', 'Local')].filter(Boolean).map((b) => path.join(b, 'Google', 'Chrome', 'User Data'));
  return cands.find(safeExists) || null; }
function safeExists(d) { try { return fs.existsSync(d); } catch (e) { return false; } }

/* CDP가 돌려준 쿠키들에서 우리가 쓸 호스트만 고르고, 심을 수 있는 꼴로 — '값'은 그대로 메모리에만 */
function pickCookies(all, hosts) { const H = hosts.map((x) => String(x).toLowerCase());
  return (all || []).filter((c) => c && c.name && hostOk(c.domain, H)).map((c) => ({
    name: c.name, value: c.value == null ? '' : c.value, domain: c.domain, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : null,
    expires: c.session || c.expires == null || +c.expires < 0 ? null : +c.expires })); }

/* 기록·보고용 요약 — 개수·호스트별 수·쿠키 이름만(값 없음) */
function summarize(cookies) { const by = {}; for (const c of cookies || []) { const h = String(c.domain || '').replace(/^\./, ''); by[h] = (by[h] || 0) + 1; }
  return { n: (cookies || []).length, hosts: by, names: (cookies || []).map((c) => c.name) }; }

/* Storage.setCookies 에 넣을 꼴(도메인 쿠키 — url 없이) */
function toSetParams(cookies) { return (cookies || []).map((c) => { const o = { name: c.name, value: c.value == null ? '' : c.value, domain: c.domain, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly };
  if (c.sameSite && ['Strict', 'Lax', 'None'].includes(c.sameSite)) o.sameSite = c.sameSite; if (c.expires != null && +c.expires > 0) o.expires = +c.expires; return o; }); }

/* 화면 없는 크롬으로 평소 크롬 프로필을 잠깐 띄워 CDP로 쿠키를 받음(평문). 평소 크롬이 아직 열려 있으면 프로필을 못 잡아 needClose.
 *  o = { exe, userDir, profileDir, hosts, CDP, note, env, timeoutMs } — CDP 는 col2-cdp.js 의 CDP 클래스(스스로 require 하지 않아 시험에서 끼워 넣기 쉬움) */
async function readChromeCookies(o) { const { exe, userDir, CDP } = o; const hosts = o.hosts || ['aladin.co.kr']; const note = o.note || (() => {}); const to = +o.timeoutMs || 20000;
  if (!exe) return { ok: false, why: '크롬을 못 찾음' }; if (!userDir || !safeExists(userDir)) return { ok: false, why: '평소 크롬 사용자 폴더(User Data)를 찾지 못함 — ⚙ 설정에서 경로를 넣어 주세요' };
  const pf = path.join(userDir, 'DevToolsActivePort');
  /* 평소 크롬이 쓰던 조종 주소 파일이 남아 있으면 지움(우리가 띄운 것인지 헷갈리지 않게) — 평소 크롬은 조종 길을 안 써 보통 없음 */
  try { fs.unlinkSync(pf); } catch (e) {}
  /* 읽기만 하는 플래그 — 평소 프로필을 고치지 않음: 동기화·확장·첫 실행 화면·시작 창 모두 끔(--no-startup-window 라 평소 크롬이 열려 있으면 창도 안 뜸) · 알라딘·어디에도 안 감 */
  const args = ['--headless=new', '--user-data-dir=' + userDir, '--profile-directory=' + (o.profileDir || 'Default'),
    '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', '--no-first-run', '--no-default-browser-check',
    '--no-startup-window', '--disable-sync', '--disable-extensions', '--disable-background-networking', '--mute-audio', '--disable-default-apps'];
  if (process.env.RN_COL2_NOSANDBOX) args.unshift('--no-sandbox');
  let proc; try { proc = cp.spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, detached: false }); } catch (e) { return { ok: false, why: '크롬을 못 띄움: ' + e.message }; }
  let tail = ''; const keep = (c) => { tail = (tail + String(c)).slice(-1024); }; proc.stdout.on('data', keep); proc.stderr.on('data', keep);
  let exited = null; proc.on('exit', (code, sig) => { if (!exited) exited = { code, sig }; }); proc.on('error', (e) => { if (!exited) exited = { code: null, err: e.message }; });
  let ws = null; const t0 = Date.now();
  for (let i = 0; !ws && Date.now() - t0 < to; i++) { await sleep(150);
    try { const [port, p2] = fs.readFileSync(pf, 'utf8').split('\n'); if (port && p2) ws = 'ws://127.0.0.1:' + port.trim() + p2.trim(); } catch (e) {}
    if (!ws && exited) break; }
  if (!ws) { try { if (!exited) proc.kill(); } catch (e) {}
    const closed = !!(exited && (exited.code === 0 || exited.code === 21 || exited.code === 0x15 || /in use|사용|another|기존/i.test(tail)));
    return { ok: false, needClose: closed, why: closed ? '평소 크롬이 아직 열려 있습니다 — 평소 크롬 창을 모두 닫고(작업 저장) 다시 눌러 주세요' : ('평소 크롬 프로필을 열지 못했습니다' + (tail ? ' · ' + lastLine(tail) : '')), exit: exited }; }
  let cdp = null;
  try { cdp = await CDP.connect(ws);
    const got = await cdp.send('Storage.getCookies', {}, null, 15000); const all = (got && got.cookies) || [];
    const picked = pickCookies(all, hosts);
    note('🔁 평소 크롬이 자기 쿠키를 풀어 줌 — 전체 ' + all.length + '개 중 알라딘·네이버 ' + picked.length + '개(값은 메모리에만)');
    return { ok: true, cookies: picked, total: all.length }; }
  catch (e) { return { ok: false, why: '평소 크롬 쿠키 읽기 실패: ' + String(e.message || e).slice(0, 120) }; }
  finally { try { if (cdp && !cdp.closed) await cdp.send('Browser.close', {}, null, 4000).catch(() => {}); } catch (e) {} try { if (cdp) cdp.close(); } catch (e) {}
    for (let i = 0; i < 25 && !exited; i++) await sleep(120); try { if (!exited) proc.kill(); } catch (e) {} try { fs.unlinkSync(pf); } catch (e) {} } }

module.exports = { hostOk, regUserDir, pickCookies, summarize, toSetParams, readChromeCookies };
