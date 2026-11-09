/* readnow-blk.js — 🛡 추적 차단(정범님 11/09 '추적 차단을 우리 기기 전체에 · 최대한 우리 손이 안 가거나 최소로')
 * 왜: 알라딘 샵매니저 화면에 Microsoft Clarity(방문 녹화 · www/scripts/{a~z}.clarity.ms)가 박혀 있어 우리 작업 화면이 녹화돼 나가고 메모리도 먹음.
 *     수집기는 이미 clarity('stop')으로 멈추게 하지만(1.89.235) 스크립트가 받아져 돈 뒤라 → 사무실 PC에서는 아예 받지 못하게 hosts에 clarity 주소만 0.0.0.0.
 * 고른 길(ⓐ hosts): 다른 사이트 영향 0(clarity 주소만) · 크롬 확장이 아님(알라딘·예스24·Firebase·웹앱·Tampermonkey 수집기 그대로) · 흔한 방식(광고 차단 목록과 같은 꼴)
 *   ⓑ uBlock Origin Lite 강제 설치(크롬 정책 ExtensionInstallForcelist)는 hosts가 안 되는 PC(예: Windows 보안이 hosts를 되돌림)에서만 웹앱 단추로 고름 — 모든 사이트에 걸리고 알라딘 화면 일부가 숨겨질 수 있어 기본은 아님
 * 로거: 로거 도우미(readnow-local.js)가 공개 수집 크롬의 clarity.ms를 이미 막음(TRACK_HOSTS) · 로거 크롬은 샵매니저를 못 엶 → 로거에는 hosts를 넣지 않음(약속 0 — 로거와 사무실에 같은 특이한 흔적을 남기지 않음)
 * 지우지 않음: 되돌리기는 줄 앞에 '#'을 붙여 꺼 둠(# readnow-blk-off) · hosts를 바꾸기 전에 같은 폴더에 hosts.readnow-bak-날짜 사본 · 레지스트리 값을 지울 때는 blk-undo.json에 적어 둠
 * 쓰는 곳: 인쇄 도우미(readnow-print.js)가 require — /blk/status·/blk/install·/blk/undo · 관리자 권한 실행은 'node readnow-blk.js apply|undo|ubol|ubol-undo <hosts 경로>'(관리자 허락 창 '예' 뒤)
 * 판 번호는 인쇄 도우미를 따름(이 파일은 인쇄 도우미가 함께 받음) */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const BLK_VER = '1';
const MARK = '# readnow-blk'; const OFF = '# readnow-blk-off';
/* clarity 주소 — 태그(www)·본체(scripts)·보내는 곳(a~z.clarity.ms · hosts는 * 를 못 써서 하나씩) */
const HOSTS = ['clarity.ms', 'www.clarity.ms', 'scripts.clarity.ms', ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => c + '.clarity.ms')];
const UBOL_ID = 'ddkjiahejlhfcafbddmgiahcphecmpfh'; /* uBlock Origin Lite(크롬 웹스토어 · MV3) */
const UBOL_ENTRY = UBOL_ID + ';https://clients2.google.com/service/update2/crx';
const FORCE_KEY = 'HKLM\\SOFTWARE\\Policies\\Google\\Chrome\\ExtensionInstallForcelist';
const hostsPath = () => process.env.RN_BLK_HOSTS || path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts');

/* 한 줄 읽기 → { ip, names, comment, active } (주석 줄은 active=false) */
function parseLine(l) { const s = String(l); const t = s.trim(); if (!t) return null; const act = !t.startsWith('#'); const body = (act ? t : t.replace(/^#+\s*/, '')).split('#')[0].trim(); const p = body.split(/\s+/).filter(Boolean); if (p.length < 2 || !/^[0-9a-fA-F.:]+$/.test(p[0])) return null; return { ip: p[0], names: p.slice(1).map((x) => x.toLowerCase()), active: act, mine: s.includes(MARK) && !s.includes(OFF), off: s.includes(OFF) }; }
const SINK = /^(0\.0\.0\.0|127\.\d+\.\d+\.\d+|::1?|::)$/;
/* 지금 상태 — 막힌 주소(누가 넣었든 0.0.0.0·127.x로 가리키는 줄이 살아 있으면 막힘) */
function status(text) { const lines = String(text || '').split(/\r?\n/); const blocked = new Set(), mine = new Set(), off = new Set();
  for (const l of lines) { const x = parseLine(l); if (!x) continue; for (const n of x.names) { if (!HOSTS.includes(n)) continue; if (x.active && SINK.test(x.ip)) { blocked.add(n); if (x.mine) mine.add(n); } else if (x.off) off.add(n); } }
  const miss = HOSTS.filter((h) => !blocked.has(h)); return { on: miss.length === 0, n: blocked.size, total: HOSTS.length, mine: mine.size, off: off.size, miss }; }
/* 넣기 — 빠진 주소만 · 꺼 둔(# readnow-blk-off) 줄이 있으면 그 줄을 다시 살림(같은 주소 줄을 두 번 만들지 않음) · 나머지 줄은 한 글자도 안 바꿈 */
function apply(text) { const nl = /\r\n/.test(text || '') || !text ? '\r\n' : '\n'; const st = status(text); if (st.on) return { changed: false, text: String(text || ''), added: 0, revived: 0 };
  const want = new Set(st.miss); let revived = 0; const lines = String(text || '').split(/\r?\n/);
  const out = lines.map((l) => { const x = parseLine(l); if (!x || !x.off || !x.names.every((n) => want.has(n))) return l; x.names.forEach((n) => want.delete(n)); revived++; return `0.0.0.0 ${x.names.join(' ')} ${MARK}`; });
  while (out.length && out[out.length - 1] === '') out.pop();
  const add = HOSTS.filter((h) => want.has(h)); if (add.length) { out.push(`${MARK} — 리드나우 추적 차단(Microsoft Clarity 방문 녹화만 · 되돌리기: 웹앱 🧭 관리도구 › 🖥 기기 운영 보고)`); add.forEach((h) => out.push(`0.0.0.0 ${h} ${MARK}`)); }
  return { changed: true, text: out.join(nl) + nl, added: add.length, revived }; }
/* 되돌리기 — 우리 줄(# readnow-blk)만 앞에 '#'을 붙여 꺼 둠(지우지 않음 · 다시 넣으면 그 줄을 살림) · 남이 넣은 줄은 그대로 */
function undo(text) { const nl = /\r\n/.test(text || '') ? '\r\n' : '\n'; let n = 0; const out = String(text || '').split(/\r?\n/).map((l) => { const x = parseLine(l); if (!x || !x.active || !x.mine) return l; n++; return `# ${l.replace(MARK, '').trim()} ${OFF}`; }); return { changed: n > 0, text: out.join(nl), n }; }

/* ⓑ 크롬 정책 ExtensionInstallForcelist — 값 목록 { 이름: 값 } → 넣을 이름(이미 있으면 null) */
function forcePlan(vals) { const V = vals || {}; if (Object.values(V).some((v) => String(v).startsWith(UBOL_ID))) return { add: null, have: true }; let mx = 0; for (const k of Object.keys(V)) if (/^\d+$/.test(k)) mx = Math.max(mx, +k); return { add: String(mx + 1), have: false }; }
function forceUndoPlan(vals) { return Object.entries(vals || {}).filter(([, v]) => String(v).startsWith(UBOL_ID)).map(([k]) => k); }
/* 레지스트리 읽기·쓰기 — 실제는 reg.exe · 시험은 RN_BLK_REG(JSON 파일)로 가짜 */
const REG = { list() { const f = process.env.RN_BLK_REG; if (f) { try { return JSON.parse(fs.readFileSync(f, 'utf8'))[FORCE_KEY] || {}; } catch (e) { return {}; } }
    const r = cp.spawnSync('reg', ['query', FORCE_KEY], { encoding: 'utf8', windowsHide: true }); const o = {}; String(r.stdout || '').split(/\r?\n/).forEach((l) => { const m = l.match(/^\s+(\S+)\s+REG_SZ\s+(.*)$/); if (m) o[m[1]] = m[2].trim(); }); return o; },
  set(name, val) { const f = process.env.RN_BLK_REG; if (f) { let J = {}; try { J = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {} if (J.__ro && !process.env.RN_BLK_FAKE_ELEV) throw new Error('접근이 거부되었습니다(가짜)'); (J[FORCE_KEY] = J[FORCE_KEY] || {})[name] = val; fs.writeFileSync(f, JSON.stringify(J)); return; }
    const r = cp.spawnSync('reg', ['add', FORCE_KEY, '/v', name, '/t', 'REG_SZ', '/d', val, '/f'], { encoding: 'utf8', windowsHide: true }); if (r.status !== 0) throw new Error(String(r.stderr || r.stdout || 'reg add 실패').trim()); },
  del(name) { const f = process.env.RN_BLK_REG; if (f) { let J = {}; try { J = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {} if (J.__ro && !process.env.RN_BLK_FAKE_ELEV) throw new Error('접근이 거부되었습니다(가짜)'); if (J[FORCE_KEY]) delete J[FORCE_KEY][name]; fs.writeFileSync(f, JSON.stringify(J)); return; }
    const r = cp.spawnSync('reg', ['delete', FORCE_KEY, '/v', name, '/f'], { encoding: 'utf8', windowsHide: true }); if (r.status !== 0) throw new Error(String(r.stderr || r.stdout || 'reg delete 실패').trim()); } };
function ubolState() { try { const v = REG.list(); return { on: forcePlan(v).have }; } catch (e) { return { on: false, err: e.message }; } }

const stamp = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
/* 실제로 쓰기(관리자 권한일 때만 됨) — hosts 사본을 먼저 두고 씀 · 권한이 없으면 { ok:false, perm:true } */
function writeHosts(kind, f) { f = f || hostsPath(); let cur; try { cur = fs.readFileSync(f, 'utf8'); } catch (e) { return { ok: false, why: 'hosts를 못 읽음: ' + e.code }; }
  const r = kind === 'undo' ? undo(cur) : apply(cur); if (!r.changed) return { ok: true, same: true, st: status(cur) };
  try { if (process.env.RN_BLK_FAKE_RO && !process.env.RN_BLK_FAKE_ELEV) { const e = new Error('operation not permitted(가짜 · 관리자 아님)'); e.code = 'EPERM'; throw e; } /* 시험용: 관리자가 아닌 PC 흉내 */
    fs.copyFileSync(f, f + '.readnow-bak-' + stamp()); fs.writeFileSync(f, r.text); } catch (e) { return { ok: false, perm: /EPERM|EACCES/.test(e.code || '') || /denied|거부/i.test(e.message), why: (/EPERM|EACCES/.test(e.code || '') ? '관리자 권한 필요' : '쓰기 실패') + ' (' + (e.code || e.message) + ')' }; }
  if (process.platform === 'win32' && !process.env.RN_BLK_HOSTS) { try { cp.spawnSync('ipconfig', ['/flushdns'], { windowsHide: true }); } catch (e) {} }
  let after = ''; try { after = fs.readFileSync(f, 'utf8'); } catch (e) {} const st = status(after); return { ok: kind === 'undo' ? st.mine === 0 : st.on, st, added: r.added || 0, revived: r.revived || 0, undone: r.n || 0 }; }
function writeUbol(kind, logDir) { try { const v = REG.list(); if (kind === 'ubol-undo') { const ks = forceUndoPlan(v); if (!ks.length) return { ok: true, same: true };
      try { const f = path.join(logDir || __dirname, 'blk-undo.json'); let L = []; try { L = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {} ks.forEach((k) => L.push({ at: new Date().toISOString(), key: FORCE_KEY, name: k, val: v[k] })); fs.writeFileSync(f, JSON.stringify(L, null, 1)); } catch (e) {} /* 지운 값은 적어 둠 */
      ks.forEach((k) => REG.del(k)); return { ok: !forcePlan(REG.list()).have, removed: ks.length }; }
    const p = forcePlan(v); if (p.have) return { ok: true, same: true }; REG.set(p.add, UBOL_ENTRY); return { ok: forcePlan(REG.list()).have, name: p.add }; }
  catch (e) { return { ok: false, perm: /거부|denied|Access/i.test(e.message), why: e.message.slice(0, 200) }; } }

module.exports = { BLK_VER, MARK, OFF, HOSTS, UBOL_ID, UBOL_ENTRY, FORCE_KEY, parseLine, status, apply, undo, forcePlan, forceUndoPlan, writeHosts, writeUbol, ubolState, hostsPath, REG };

/* 관리자 허락 창 뒤에 도는 길: node readnow-blk.js <apply|undo|ubol|ubol-undo> [hosts 경로] [결과 파일] — 결과를 JSON으로 결과 파일에(없으면 화면에) */
if (require.main === module) { const [kind, f, out] = process.argv.slice(2); let r;
  if (kind === 'apply' || kind === 'undo') r = writeHosts(kind, f && f !== '-' ? f : null); else if (kind === 'ubol' || kind === 'ubol-undo') r = writeUbol(kind, out ? path.dirname(out) : __dirname); else r = { ok: false, why: '모르는 일: ' + kind };
  const s = JSON.stringify({ kind, at: new Date().toISOString(), ...r }); if (out) { try { fs.writeFileSync(out, s); } catch (e) {} } else process.stdout.write(s + '\n'); process.exitCode = r.ok ? 0 : 2; }
