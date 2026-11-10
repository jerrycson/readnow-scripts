/* col2-cred.js — 🔐 번외 수집기 '스스로 다시 로그인'용 아이디·비밀번호 (정범님 11/10 아침 '번외에서 예스24가 자주 로그아웃돼 — 수집기에 아이디랑 비밀번호를 입력해서 필요할 때 스스로 다시 로그인하도록')
 * 저장: **그 PC 안에만** — Windows DPAPI(현재 사용자 · System.Security.Cryptography.ProtectedData)로 잠근 파일 <HOME>/cred/<플랫폼>.dat
 *   · 그 PC의 같은 Windows 사용자만 풀 수 있음(다른 PC·다른 사용자·파일만 복사해 가면 못 풂) — 운영 ALPS 도우미 cred.dat와 같은 꼴
 *   · 값은 PowerShell에 명령 줄이 아니라 표준 입력으로만 넘김(작업 관리자·프로세스 목록에 안 보이게) · 풀린 값은 메모리에서 로그인 칸에 넣을 때만 씀
 *   · GitHub·Firestore(col2_* 포함)·기록(col2.log·journal)·상태(/status)·화면·웹앱 대신 쓰기·대화 어디에도 나가지 않음 — 화면에는 '저장됨(날짜)'만
 *   · 로거 PC는 저장도·풀기도 거절(약속 0 — 로거엔 계정 금지) · 새로 저장하면 옛 잠금 파일은 cred/old/로 옮김(지우지 않음 · 그대로 잠긴 채)
 * 시험(리눅스)에는 DPAPI가 없어 RN_COL2_DPAPI(가짜 잠그개)를 씀 — 실제 PC는 powershell.exe */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const PF = { y24: { name: '예스24 판매관리' }, al: { name: '알라딘 샵매니저' } }; /* 번외가 쓰는 로그인 — 늘어나면 여기 한 줄 */
const PS = `param([string]$Act = 'protect')
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$t = [Console]::In.ReadToEnd()
$ent = [Text.Encoding]::UTF8.GetBytes('readnow-col2-cred')
if ($Act -eq 'protect') { $b = [Text.Encoding]::UTF8.GetBytes($t); $e = [Security.Cryptography.ProtectedData]::Protect($b, $ent, [Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write('ok:' + [Convert]::ToBase64String($e)) }
else { $b = [Convert]::FromBase64String($t.Trim()); $d = [Security.Cryptography.ProtectedData]::Unprotect($b, $ent, [Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write('ok:' + [Text.Encoding]::UTF8.GetString($d)) }
`;

function makeCred(o) { const { HOME } = o; const D = path.join(HOME, 'cred'); const OLD = path.join(D, 'old'); const psFile = path.join(HOME, 'col2-dpapi.ps1');
  const isLogger = () => { try { return !!o.isLogger(); } catch (e) { return true; } };
  const exe = () => process.env.RN_COL2_DPAPI || 'powershell.exe';
  function run(act, input) { return new Promise((res) => {
    try { const want = '﻿' + PS.replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(psFile, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(psFile, want, 'utf8'); } catch (e) { return res({ ok: false, err: '잠그개 파일을 못 씀' }); }
    let p; try { p = cp.execFile(exe(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile, '-Act', act], { windowsHide: true, timeout: 30000, maxBuffer: 1048576 }, (e, out) => {
      const s = String(out || ''); const i = s.indexOf('ok:'); if (e || i < 0) return res({ ok: false, err: act === 'protect' ? 'Windows 잠그기(DPAPI) 실패' : 'Windows 풀기(DPAPI) 실패 — 다른 사용자·다른 PC에서 만든 파일이면 다시 저장해 주세요' }); /* 오류 글에 값이 섞이지 않게 원문을 싣지 않음 */
      res({ ok: true, v: s.slice(i + 3).replace(/\r?\n$/, '') }); }); } catch (e) { return res({ ok: false, err: 'PowerShell을 못 켬' }); }
    try { p.stdin.end(String(input), 'utf8'); } catch (e) {} }); }
  const fileOf = (pf) => path.join(D, pf + '.dat');
  const read = (pf) => { try { const j = JSON.parse(fs.readFileSync(fileOf(pf), 'utf8')); return j && j.v === 1 && j.id && j.pw ? j : null; } catch (e) { return null; } };
  /* 저장 — {ok} | {ok:false, err} · 값은 돌려주지 않음 */
  /* (11/10 밤 정범님 '비밀번호 저장이 안 돼') chk = 'ok'(실제 로그인으로 확인함) | 'pending'(확인 못 한 채 잠가 저장 — 다음 다시 로그인 때 확인) | 'bad'(다시 로그인 때 틀림이 드러남) */
  async function save(pf, id, pw, chk) { chk = chk === 'pending' ? 'pending' : 'ok'; if (isLogger()) return { ok: false, err: '로거 PC에는 계정을 저장하지 않습니다(약속 0)' }; if (!PF[pf]) return { ok: false, err: '모르는 플랫폼' };
    id = String(id == null ? '' : id); pw = String(pw == null ? '' : pw); if (!id.trim() || !pw) return { ok: false, err: '아이디와 비밀번호를 모두 넣어 주세요' }; if (id.length > 200 || pw.length > 200) return { ok: false, err: '너무 깁니다' };
    const a = await run('protect', id); if (!a.ok) return a; const b = await run('protect', pw); if (!b.ok) return b;
    try { fs.mkdirSync(OLD, { recursive: true }); if (fs.existsSync(fileOf(pf))) fs.renameSync(fileOf(pf), path.join(OLD, `${pf}-${Date.now()}.dat`));
      const tmp = fileOf(pf) + '.t'; fs.writeFileSync(tmp, JSON.stringify({ v: 1, how: process.env.RN_COL2_DPAPI ? 'test' : 'dpapi-user', at: Date.now(), chk, chkAt: Date.now(), id: a.v, pw: b.v })); fs.renameSync(tmp, fileOf(pf)); } catch (e) { return { ok: false, err: '잠근 파일을 못 씀' }; }
    return { ok: true }; }
  /* 풀기 — 로그인 칸에 넣기 바로 전에만 · {ok, id, pw} (부른 쪽이 쓰고 버림) */
  async function open(pf) { if (isLogger()) return { ok: false, err: '로거 PC — 계정을 쓰지 않음' }; const j = read(pf); if (!j) return { ok: false, err: '저장된 계정 없음' };
    const a = await run('unprotect', j.id); if (!a.ok) return a; const b = await run('unprotect', j.pw); if (!b.ok) return b; return { ok: true, id: a.v, pw: b.v }; }
  /* 확인 표시만 바꿈(잠근 값은 그대로) — 다시 로그인으로 맞음/틀림이 드러났을 때 */
  function mark(pf, chk) { const j = read(pf); if (!j || !/^(ok|pending|bad)$/.test(chk)) return false; j.chk = chk; j.chkAt = Date.now(); try { const tmp = fileOf(pf) + '.t'; fs.writeFileSync(tmp, JSON.stringify(j)); fs.renameSync(tmp, fileOf(pf)); return true; } catch (e) { return false; } }
  const chkOf = (pf) => { const j = isLogger() ? null : read(pf); return j ? (j.chk || 'ok') : null; }; /* 옛 파일(chk 없음)은 확인하고 저장한 것 */
  /* 화면·상태용 — 값 없음 */
  const has = (pf) => !isLogger() && !!read(pf);
  const sum = () => { const out = {}; for (const k of Object.keys(PF)) { const j = isLogger() ? null : read(k); out[k] = { name: PF[k].name, has: !!j, at: j ? j.at : null, chk: j ? (j.chk || 'ok') : null, chkAt: j ? (j.chkAt || j.at) : null }; } return out; };
  return { save, open, has, sum, mark, chkOf, PF };
}
module.exports = { makeCred, PF, PS };
