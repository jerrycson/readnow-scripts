// tALPSprev — (0.5.8 shipfix1 · 11/14 MJ-MAIN 「출력 미리보기 창(PIDPIC051U)이 열리지 않음 — 하나도 안 뜸」) 실제 크롬(CDP) + 가짜 ALPS로 미리보기 실패 넷을 가름
//  ① 보통: 미리보기가 뜨고 인쇄 1번 · ② 늦게 뜸(첫 기다림 시간보다 늦게): 단추를 다시 누르지 않고 기다려 인쇄 1번
//  ③ ALPS 알림만(창 없음): 오래 안 기다리고 멈춤 · 오류 글에 알림 원문 · 인쇄 0 · 기록(diag)에 'alert'
//  ④ 창은 떴으나 송장 자료가 안 채워짐: 오류 글 '송장 자료가 안 채워짐' · 인쇄 0 · diag 'notready'
//  ⑤ 아무것도 안 뜸: 오류 글 '하나도 안 뜸(ALPS 알림도 없음)' · 인쇄 0 · diag 'none'
//  모든 실패에서 인쇄 끝 기록 0 · 출력 단추는 한 번만 · 이어서 진행하면 접수는 건너뛰고(같은 줄 두 번 접수 0) 인쇄 1번
// 실행: node src/tests/tALPSprev.js (크롬 /opt/pw-browsers · jQuery /usr/share/javascript/jquery/jquery.js 또는 ALPS_JQ · 없으면 건너뜀)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..'); const ALPS_F = process.env.ALPS_F || path.join(ROOT, 'local', 'readnow-alps.js');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'; const JQ = process.env.ALPS_JQ || '/usr/share/javascript/jquery/jquery.js';
if (process.platform === 'win32' || !fs.existsSync(CHROME) || !fs.existsSync(JQ)) { console.log('⚠ tALPSprev 건너뜀(크롬·jQuery 없음)'); process.exit(0); }
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnalpsprev_')); process.env.RN_ALPS_HOME = HOME; process.env.RN_ALPS_TEST = '1'; process.env.RN_ALPS_NOSANDBOX = '1'; process.env.RN_ALPS_QUIET = process.env.V ? '' : '1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
/* 가짜 OZ 웹런처(ws://127.0.0.1:36480) — 도우미의 '인쇄 프로그램 연결' 확인이 열리기만 보면 됨 */
const oz = http.createServer((q, s) => { s.writeHead(404); s.end(); }); oz.on('upgrade', (req, sock) => { const k = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'); sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${k}\r\n\r\n`); sock.on('error', () => {}); });
const fake = cp.spawn(process.execPath, [path.join(__dirname, 'alps', 'fake-alps.js')], { env: { ...process.env, ALPS_JQ: JQ }, stdio: 'ignore' });
const A = require(ALPS_F);
const post = (u, o) => fetch('http://127.0.0.1:8771' + u, { method: 'POST', body: JSON.stringify(o) }).then((r) => r.json());
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
let SEQ = 0; const mineOf = () => { SEQ++; return mine0.map((m) => ({ ...m, ono: m.ono.replace(/0+(\d)$/, (x, d) => String(SEQ).padStart(x.length - 1, '0') + d) })); }; let mine = []; const mine0 = [{ name: '손님A', title: '시험 책 하나', sku: 'PNKLUX', ono: '001-T000000001' }, { name: '손님B', title: '시험 책 둘', sku: 'BLKAAA', ono: '001-T000000002' }, { name: '손님B', title: '시험 책 셋', sku: 'BLKAAB', ono: '001-T000000002' }, { name: '손님C', title: '시험 책 넷', sku: 'REDFGN', ono: '001-T000000003' }];
async function run(name, o, resume) { console.log('■ ' + name);
  if (!resume) mine = mineOf();
  if (!resume) await post('/fake/seed', { seed: mine.map((m) => ({ ...m, pack: m.name === '손님B' ? 'P1' : '' })), rows: [], popMode: o.popMode || '', popDelay: o.popDelay || 0, dispCount: 10 });
  else await post('/fake/mode', { popMode: o.popMode || '', popDelay: o.popDelay || 0 });
  A.setCfg({ baseUrl: 'http://127.0.0.1:8771/', chromePath: CHROME, printer: 'TEST-롯데택배', firstOne: false, confirmBeforePrint: false, headless: true, paperCheck: false, stepTimeoutSec: o.step || 20, previewWaitSec: o.wait || 40, uploadTimeoutSec: 30, printTimeoutSec: 30, afterPrintWaitSec: 0 });
  A.reset(); const t0 = Date.now();
  if (resume) A.resume({ paperCheck: false }); else A.start({ fileName: `판매완료${today}.xlsx`, b64: Buffer.from('PK\u0003\u0004 가짜 xlsx').toString('base64'), rows: mine, firstOne: false, paperCheck: false });
  const seen = []; for (;;) { await sleep(300); const s = A.status(); if (s.need) { seen.push(s.need.type + ':' + String(s.need.msg).slice(0, 40)); A.input({ kind: 'choice', pick: (s.need.options || [])[0], needId: s.need.id }); await sleep(300); } if (s.status === 'done' || s.status === 'error') break; if (Date.now() - t0 > 150000) { ok(false, '시간 초과'); break; } }
  const s = A.status(); const st = await fetch('http://127.0.0.1:8771/fake/state').then((r) => r.json()); return { s, st, seen, secs: (Date.now() - t0) / 1000 }; }
const diagOf = (R) => ((R.s.summary || {}).diag || []).join(' | ');
(async () => {
  oz.listen(36480, '127.0.0.1'); await sleep(1500); await A.saveCred('testid', 'test-pw!');
  let R = await run('① 보통 — 미리보기 뜨고 인쇄', {});
  ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.st.prints.length === 1 && R.st.prints[0].n === 4, '인쇄 1번(4줄 한 미리보기) ' + JSON.stringify(R.st.prints)); ok(R.st.uploads.length === 1, '접수 1번');
  R = await run('② 늦게 뜸 — 첫 기다림(20초)보다 늦은 26초', { popDelay: 26 });
  ok(R.s.status === 'done', '끝남(단추 다시 안 누르고 기다림) ' + (R.s.error || '')); ok(R.st.prints.length === 1, '인쇄 1번(두 번 아님) ' + R.st.prints.length);
  ok((R.s.log || []).some((l) => /미리보기 창이 \d+초 안에 안 뜸 — 출력 단추는 다시 누르지 않고/.test(l.d || '')), "기록: '단추는 다시 누르지 않고 기다림'");
  R = await run('③ ALPS 알림만 — 창 없음', { popMode: 'alert', wait: 60 });
  ok(R.s.status === 'error' && /ALPS 알림이 출력을 막음: '시험: 출력할 수 없습니다/.test(R.s.error || ''), '오류 글에 알림 원문 ' + (R.s.error || '').slice(0, 120));
  ok(R.secs < 45, `알림 뒤 오래 안 기다림(60초 상한 중 ${Math.round(R.secs)}초에 멈춤)`); ok(R.st.prints.length === 0, '인쇄 0'); ok(/미리보기 못 엶\(alert\)/.test(diagOf(R)), '기록(diag)에 alert ' + diagOf(R).slice(0, 160));
  ok(/세부: 브라우저 창\(alert\) — 확인: 시험: 출력할 수 없습니다/.test(diagOf(R)) && /세부: ✗ 출력 미리보기 창/.test(diagOf(R)), "기록(diag)에 세부 진행 줄(브라우저 창 줄 · 멈춘 줄)");
  ok(!/손님[ABC]/.test(diagOf(R)) && /손님/.test(diagOf(R)) === /세부: [^|]*손님/.test(diagOf(R)), '세부 줄에 받는 분 이름 없음(가림)');
  ok(R.st.uploads.length === 1, '접수 1번');
  R = await run('③-이어서 — 보통으로 돌아온 ALPS에서 이어서 진행', {}, true);
  ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.st.uploads.length === 1, '이어서 진행은 접수를 건너뜀(접수 그대로 1번)'); ok(R.st.prints.length === 1, '인쇄 1번');
  R = await run('④ 창은 떴으나 송장 자료가 안 채워짐', { popMode: 'empty', wait: 25 });
  ok(R.s.status === 'error' && /미리보기 창은 떴으나 송장 자료가 안 채워짐\(송장 0·종류 0\)/.test(R.s.error || ''), '오류 글 ' + (R.s.error || '').slice(0, 140)); ok(R.st.prints.length === 0, '인쇄 0'); ok(/미리보기 못 엶\(notready\)/.test(diagOf(R)) && /PIDPIC051U/.test(diagOf(R)), '기록(diag)에 notready·창 주소 ' + diagOf(R).slice(0, 200));
  R = await run('⑤ 아무것도 안 뜸(④에 이어서 진행)', { popMode: 'none', wait: 25 }, true);
  ok(R.s.status === 'error' && /하나도 안 뜸\(ALPS 알림도 없음\)/.test(R.s.error || ''), '오류 글 ' + (R.s.error || '').slice(0, 120)); ok(R.st.prints.length === 0, '인쇄 0'); ok(/미리보기 못 엶\(none\): 2[5-9]초 기다림/.test(diagOf(R)) && R.st.uploads.length === 1, '기록(diag)에 none·기다린 초 ' + diagOf(R).slice(0, 120));
  ok(!/손님[ABC]/.test(diagOf(R)), '기록(diag)에 받는 분 이름 없음');
  const src = fs.readFileSync(ALPS_F, 'utf8'); ok(/previewWaitSec: 150,/.test(src), '기본 기다림 150초(설정으로 바꿈)'); ok((src.match(/await B\.eval\(\/PIDPIC002U\/, PG\.print\)/g) || []).length === 1, '출력 단추를 누르는 곳은 한 곳(기다리는 동안 다시 안 누름)');
})().catch((e) => { ok(false, '시험 오류 ' + e.stack); }).finally(() => { try { fake.kill(); } catch (e) {} try { oz.close(); } catch (e) {} console.log(bad ? `❌ tALPSprev 실패 ${bad}` : '✓ tALPSprev 통과'); setTimeout(() => process.exit(bad ? 1 : 0), 300); });
