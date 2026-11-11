/* col2-solo.js — (11/12 col2solo1 · 정범님 11/12 0시 '번외 수집기는 웹앱이 열려 있어야 하나? 웹앱 열림이나 (운영) 수집기 없이 돌게') 🔌 홀로 연결
 * 번외가 웹앱 탭·운영 수집기 다리 없이 우리 클라우드 창구(/c2/solo)와 직접 주고받음 — 상태 올리기 · 모든 PC 공통 설정 · 넘긴 일 받기 · 결과 쓰기 · (로거) 🟩 네이버
 * 열쇠: 이 PC에서 처음 한 번 Ed25519 열쇠쌍을 만듦 — 개인 열쇠는 Windows DPAPI(이 PC·이 사용자만 풂)로 잠가 <HOME>/solo/key.json에만(평문 파일 없음 · 기록·화면·답에 없음)
 *       공개 열쇠·지문만 웹앱에 보임 → 웹앱 ⚙ 설정 › 🔀 번외 칸 「🔐 이 기기 등록」(두 번)이 Firebase app_settings/col2_solo에 올림 · 클라우드 주소도 그때 이 도우미에 넣어 줌(<HOME>/solo/link.json · 비밀 아님)
 * 요청: 몸 전체에 서명(머리 x-rn-sig) · 시각 · 한 번만 쓰는 nonce — 클라우드가 그 PC 공개 열쇠로 확인한 뒤 그 PC 칸만 씀(cloud/col2solo.js)
 * 겹침: 살아 있음(live) = 3분 안에 한 번이라도 성공 — 살아 있는 동안 도우미는 웹앱·수집기 다리에 같은 일(결과·설정·맥박·네이버)을 내주지 않음(한 길로만) · 끊기면 저절로 예전 길(웹앱 대신 쓰기)
 * 끄기: col2.json solo:{ on:false } · 주기 solo.tickSec(기본 60초 · 근거: 없음 — 웹앱 대신 쓰기와 같은 1분)
 * 시험: RN_COL2_SOLO_URL(가짜 클라우드) · RN_COL2_DPAPI(가짜 잠그개) */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const { PS } = require('./col2-cred.js');

function makeSolo(o) { const { HOME, TEST } = o; const D = path.join(HOME, 'solo'); const KF = path.join(D, 'key.json'), LF = path.join(D, 'link.json'); const now = () => Date.now();
  const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
  const wr = (f, v) => { try { fs.mkdirSync(D, { recursive: true }); fs.writeFileSync(f + '.t', JSON.stringify(v)); fs.renameSync(f + '.t', f); return true; } catch (e) { return false; } };
  const cfg = () => { try { return (o.cfg() || {}).solo || {}; } catch (e) { return {}; } };
  const on = () => cfg().on !== false;
  const S = { reg: 'new', okAt: 0, tryAt: 0, err: '', n: 0, fails: 0, busy: false, t: null, done: [], lastMs: 0, note1: '' };
  const K = { key: null, pub: null, fp: null }; let keyP = null;
  /* ── Windows DPAPI(col2-cred.js와 같은 잠그개 · 값은 표준 입력으로만) ── */
  const psFile = path.join(HOME, 'col2-dpapi.ps1'); const exe = () => process.env.RN_COL2_DPAPI || 'powershell.exe';
  function dp(act, input) { return new Promise((res) => { try { const want = '﻿' + PS.replace(/\r?\n/g, '\r\n'); let cur = null; try { cur = fs.readFileSync(psFile, 'utf8'); } catch (e) {} if (cur !== want) fs.writeFileSync(psFile, want, 'utf8'); } catch (e) { return res({ ok: false, err: '잠그개 파일을 못 씀' }); }
    let p; try { p = cp.execFile(exe(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile, '-Act', act], { windowsHide: true, timeout: 30000, maxBuffer: 1048576 }, (e, out) => { const s = String(out || ''); const i = s.indexOf('ok:'); if (e || i < 0) return res({ ok: false, err: act === 'protect' ? 'Windows 잠그기(DPAPI) 실패' : 'Windows 풀기(DPAPI) 실패' }); res({ ok: true, v: s.slice(i + 3).replace(/\r?\n$/, '') }); }); } catch (e) { return res({ ok: false, err: 'PowerShell을 못 켬' }); }
    try { p.stdin.end(String(input), 'utf8'); } catch (e) {} }); }
  const fpOf = (pem) => { try { const der = crypto.createPublicKey(pem).export({ type: 'spki', format: 'der' }); return crypto.createHash('sha256').update(der).digest('hex').slice(0, 16).toUpperCase().replace(/(.{4})(?!$)/g, '$1-'); } catch (e) { return null; } };
  function keyReady() { if (K.key) return Promise.resolve({ ok: true }); if (!keyP) keyP = keyMake().finally(() => { keyP = null; }); return keyP; }
  async function keyMake() { const j = rd(KF, null);
    if (j && j.v === 1 && j.pub && j.priv) { const r = await dp('unprotect', j.priv); if (r.ok) { try { K.key = crypto.createPrivateKey(r.v); K.pub = j.pub; K.fp = fpOf(j.pub); return { ok: true }; } catch (e) {} }
      try { fs.mkdirSync(path.join(D, 'old'), { recursive: true }); fs.renameSync(KF, path.join(D, 'old', 'key-' + now() + '.json')); } catch (e) {} o.note('🔌 홀로 연결 열쇠를 못 풂 — 새로 만듦(예전 것은 solo/old로 · 웹앱에서 다시 등록해야 함)', { l: 'warn' }); }
    const kp = crypto.generateKeyPairSync('ed25519'); const pem = kp.privateKey.export({ type: 'pkcs8', format: 'pem' }); const pub = kp.publicKey.export({ type: 'spki', format: 'pem' });
    const r = await dp('protect', pem); if (!r.ok) return r; if (!wr(KF, { v: 1, at: now(), pub, priv: r.v, how: process.env.RN_COL2_DPAPI ? 'test' : 'dpapi-user' })) return { ok: false, err: '열쇠 파일을 못 씀' };
    K.key = kp.privateKey; K.pub = pub; K.fp = fpOf(pub); o.note(`🔌 홀로 연결 열쇠를 만듦(지문 ${K.fp} · 개인 열쇠는 이 PC DPAPI 잠금 파일에만) — 웹앱 ⚙ 설정 › 🔀 번외 칸에서 「🔐 이 기기 등록」`); return { ok: true }; }
  /* 클라우드 주소 — 웹앱이 등록할 때 넣어 줌(비밀 아님) · https만(시험은 127.0.0.1) */
  const url = () => { if (TEST && process.env.RN_COL2_SOLO_URL) return process.env.RN_COL2_SOLO_URL.replace(/\/+$/, ''); const l = rd(LF, null); return l && l.url ? String(l.url) : ''; };
  function link(x) { const u = String((x && x.url) || '').trim().replace(/\/+$/, ''); if (!/^https:\/\/[\w.-]{3,120}(:\d{2,5})?$/.test(u) && !(TEST && /^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(u))) return { ok: false, err: '클라우드 주소 꼴이 아님(https://…)' };
    const was = url(); if (!wr(LF, { url: u, at: now(), by: String((x && x.by) || '').slice(0, 60) })) return { ok: false, err: '주소 파일을 못 씀' }; if (was !== u) { o.note('🔌 홀로 연결 — 클라우드 주소를 받음(' + u.replace(/^https?:\/\//, '') + ')'); S.reg = 'new'; S.fails = 0; }
    kick(1500); return { ok: true }; }
  const live = () => on() && S.reg === 'ok' && now() - S.okAt < 3 * 60e3;
  function sum() { return { on: on(), reg: !on() ? 'off' : !url() ? 'link' : S.reg, live: live(), okAt: S.okAt || null, tryAt: S.tryAt || null, err: S.err || '', n: S.n, fp: K.fp, pub: K.pub, host: url().replace(/^https?:\/\//, ''), ms: S.lastMs }; }
  /* 서명해 보냄 — [code, body] */
  async function post(body) { const raw = Buffer.from(JSON.stringify(body)); const sig = crypto.sign(null, raw, K.key).toString('base64'); const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 30000); const t0 = now();
    try { const r = await fetch(url() + '/c2/solo', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-rn-sig': sig }, body: raw, signal: ac.signal }); let j = null; try { j = await r.json(); } catch (e) {} S.lastMs = now() - t0; return [r.status, j || {}]; }
    catch (e) { return [0, { err: e.name === 'AbortError' ? '30초 안에 답하지 않음' : '연결 실패: ' + e.message }]; } finally { clearTimeout(tm); } }
  const nonce = () => crypto.randomBytes(12).toString('hex');
  async function tick() { if (S.busy) return; S.busy = true; let next = Math.max(TEST ? 0.2 : 20, +cfg().tickSec || 60) * 1000;
    try { if (!on() || !url()) return; const kr = await keyReady(); if (!kr.ok) { S.err = kr.err; return; }
      const g = o.gather(live()); const body = { pc: o.pc(), ts: now(), nonce: nonce(), ver: o.ver, kind: o.kind(), op: 'sync', ...g };
      const nv = o.nv && o.kind() === 'logger' ? await o.nv.gather(S.done) : null; if (nv) body.nv = nv; S.tryAt = now();
      const [code, j] = await post(body); S.n++;
      if (code === 200 && j.ok) { const was = S.reg; S.reg = 'ok'; S.okAt = now(); S.fails = 0; S.err = (j.errs || [])[0] || ''; if (nv) S.done = [];
        if (was !== 'ok') o.note('🔌 홀로 연결 켜짐 — 웹앱·운영 수집기가 없어도 이 번외가 클라우드와 직접 주고받음', { l: 'ok' });
        let more = false; try { more = !!o.apply(j); } catch (e) { S.err = '받은 것 반영 실패: ' + e.message; }
        if (o.nv && Array.isArray(j.nvCmds) && j.nvCmds.length) { for (const c of j.nvCmds) { let r; try { r = await o.nv.cmd(c); } catch (e) { r = { ok: false, err: '번외 네이버 일 실패: ' + e.message }; } S.done.push({ id: c.id, res: { ok: !!(r && r.ok), saved: r && r.saved, err: (r && r.err) || null, test: r && r.test ? { ok: !!r.test.ok, msg: r.test.msg || '', ip: !!r.test.ip } : null } }); } more = true; }
        if (o.nv && j.nvAck) o.nv.ack(j.nvAck);
        if (more || S.done.length) next = TEST ? 200 : 3000; return; }
      S.fails++; const why = String(j.err || ('HTTP ' + code)).slice(0, 200); S.err = why;
      if (code === 403 && j.reg) { const was = S.reg; S.reg = j.reg; if (was !== j.reg) o.note('🔌 홀로 연결 — ' + why, { l: 'warn' }); next = Math.max(next, TEST ? 300 : 5 * 60e3); return; }
      if (S.reg === 'ok' && S.fails >= 3) { S.reg = 'down'; o.note('🔌 홀로 연결이 끊김(' + why + ') — 웹앱이 열려 있으면 예전 길로 대신 씀', { l: 'warn' }); } else if (S.reg !== 'ok') S.reg = 'down';
      next = Math.min(10 * 60e3, next * Math.min(8, S.fails)); }
    catch (e) { S.err = e.message; } finally { S.busy = false; clearTimeout(S.t); S.t = setTimeout(tick, next); if (S.t.unref) S.t.unref(); } }
  function kick(ms) { clearTimeout(S.t); S.t = setTimeout(tick, ms || 50); if (S.t.unref) S.t.unref(); }
  /* 웹앱 등록에 줄 것 — 공개 열쇠·지문만(개인 열쇠 없음) */
  async function pubInfo() { const r = await keyReady(); return r.ok ? { ok: true, pub: K.pub, fp: K.fp, pc: o.pc(), kind: o.kind(), solo: sum() } : { ok: false, err: r.err }; }
  kick(TEST ? 300 : 15e3);
  return { tick, kick, link, live, sum, pubInfo, keyReady };
}
module.exports = { makeSolo };
