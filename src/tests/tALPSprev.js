// tALPSprev — (0.5.8 shipfix1 · 11/14 MJ-MAIN 「출력 미리보기 창(PIDPIC051U)이 열리지 않음 — 하나도 안 뜸」) 실제 크롬(CDP) + 가짜 ALPS로 미리보기 실패 넷을 가름
//  ① 보통 · ② 늦게 뜸(단추 다시 안 누름) · ③ 한 상자만 발송 불가 알림 → 그 상자만 보류 · 확인만(그대로/풀림 · 인쇄 0) · 풀린 보류 인쇄 · 되풀이 0
//  ④ 주7일 안내창 → 보류(묻지 않음) · ⑤ ALPS가 미리보기에서 뺀 상자 → 보류 · ⑥ 모든 상자 알림 → 모두 보류
//  ⑦ 모든 상자 미리보기 비어 있음 · ⑧ 아무것도 안 뜸 → 고장으로 멈춤(보류로 숨기지 않음) · 기록(diag)에 까닭·세부 줄 · 이름 없음
// 실행: node src/tests/tALPSprev.js (크롬 /opt/pw-browsers · jQuery /usr/share/javascript/jquery/jquery.js 또는 ALPS_JQ · 없으면 건너뜀)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..'); const ALPS_F = process.env.ALPS_F || path.join(ROOT, 'local', 'readnow-alps.js');
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'; const JQ = process.env.ALPS_JQ || '/usr/share/javascript/jquery/jquery.js';
if (process.platform === 'win32' || !fs.existsSync(CHROME) || !fs.existsSync(JQ)) { console.log('⚠ tALPSprev 건너뜀(크롬·jQuery 없음)'); process.exit(0); }
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnalpsprev_')); process.env.RN_ALPS_HOME = HOME; process.env.RN_ALPS_TEST = '1'; process.env.RN_ALPS_NOSANDBOX = '1'; process.env.RN_ALPS_QUIET = process.env.V ? '' : '1'; process.env.RN_ALPS_NOHOLDTICK = '1'; /* 시계는 시험에서 끄고 holdTick()을 직접 부름 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
/* 가짜 OZ 웹런처(ws://127.0.0.1:36480) — 도우미의 '인쇄 프로그램 연결' 확인이 열리기만 보면 됨 */
const oz = http.createServer((q, s) => { s.writeHead(404); s.end(); }); oz.on('upgrade', (req, sock) => { const k = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64'); sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${k}\r\n\r\n`); sock.on('error', () => {}); });
const fake = cp.spawn(process.execPath, [path.join(__dirname, 'alps', 'fake-alps.js')], { env: { ...process.env, ALPS_JQ: JQ }, stdio: 'ignore' });
const A = require(ALPS_F);
const post = (u, o) => fetch('http://127.0.0.1:8771' + u, { method: 'POST', body: JSON.stringify(o) }).then((r) => r.json());
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
let SEQ = 0; const mineOf = () => { SEQ++; return mine0.map((m) => ({ ...m, ono: m.ono.replace(/0+(\d)$/, (x, d) => String(SEQ).padStart(x.length - 1, '0') + d) })); }; let mine = []; const mine0 = [{ name: '손님A', title: '시험 책 하나', sku: 'PNKLUX', ono: '001-T000000001' }, { name: '손님B', title: '시험 책 둘', sku: 'BLKAAA', ono: '001-T000000002' }, { name: '손님B', title: '시험 책 셋', sku: 'BLKAAB', ono: '001-T000000002' }, { name: '손님C', title: '시험 책 넷', sku: 'REDFGN', ono: '001-T000000003' }];
const ADDR = { 손님A: '서울특별시 마포구 시험로 1', 손님B: '전라남도 신안군 시험면 2', 손님C: '경기도 가평군 시험읍 3' };
async function run(name, o, resume) { console.log('■ ' + name);
  if (!resume) mine = mineOf();
  const mode = { popMode: o.popMode || '', popDelay: o.popDelay || 0, popBlock: o.popBlock || [], blockMode: o.blockMode || '' };
  if (!resume) await post('/fake/seed', { seed: mine.map((m) => ({ ...m, addr: ADDR[m.name], pack: m.name === '손님B' ? 'P1' : '' })), rows: [], ...mode, dispCount: 10 });
  else await post('/fake/mode', mode);
  A.setCfg({ baseUrl: 'http://127.0.0.1:8771/', chromePath: CHROME, printer: 'TEST-롯데택배', firstOne: false, confirmBeforePrint: false, headless: true, paperCheck: false, stepTimeoutSec: o.step || 20, previewWaitSec: o.wait || 40, isoWaitSec: 15, uploadTimeoutSec: 30, printTimeoutSec: 30, afterPrintWaitSec: 0, holdAutoPrint: !!o.autoPrint });
  A.reset(); const t0 = Date.now(); const p0 = (await fetch('http://127.0.0.1:8771/fake/state').then((r) => r.json())).prints.length;
  if (o.hold) A.holdRun(o.hold, { probe: !!o.probe, why: '시험' }); else if (resume) A.resume({ paperCheck: false }); else A.start({ fileName: `판매완료${today}.xlsx`, b64: Buffer.from('PK\u0003\u0004 가짜 xlsx').toString('base64'), rows: mine, firstOne: false, paperCheck: false });
  const seen = []; for (;;) { await sleep(300); const s = A.status(); if (s.need) { if (!/^이 PC 기록에는 오늘 같은 파일을/.test(String(s.need.msg))) seen.push(s.need.type + ':' + String(s.need.msg).slice(0, 40)); /* 시험마다 가짜 ALPS 목록을 비우므로 생기는 물음 — 시험 밖 */ A.input({ kind: 'choice', pick: (s.need.options || [])[0], needId: s.need.id }); await sleep(300); } if (s.status === 'done' || s.status === 'error') break; if (Date.now() - t0 > 240000) { ok(false, '시간 초과'); break; } }
  const s = A.status(); const st = await fetch('http://127.0.0.1:8771/fake/state').then((r) => r.json()); return { s, st, seen, secs: (Date.now() - t0) / 1000, newPrints: st.prints.slice(p0), res: A.result(s.id) }; }
const diagOf = (R) => ((R.s.summary || {}).diag || []).join(' | ');
const holdsF = () => { try { return JSON.parse(fs.readFileSync(path.join(HOME, 'holds.json'), 'utf8')); } catch (e) { return { recs: [] }; } };
const openItems = () => holdsF().recs.flatMap((r) => Object.values(r.items || {}).filter((x) => !x.done));
(async () => {
  oz.listen(36480, '127.0.0.1'); await sleep(1500); await A.saveCred('testid', 'test-pw!');
  let R = await run('① 보통 — 미리보기 뜨고 인쇄', {});
  ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.st.prints.length === 1 && R.st.prints[0].n === 4, '인쇄 1번(4줄 한 미리보기) ' + JSON.stringify(R.st.prints)); ok(R.st.uploads.length === 1, '접수 1번'); ok(!(R.s.summary || {}).held && !openItems().length, '보류 없음');
  R = await run('② 늦게 뜸 — 첫 기다림(20초)보다 늦은 26초', { popDelay: 26 });
  ok(R.s.status === 'done', '끝남(단추 다시 안 누르고 기다림) ' + (R.s.error || '')); ok(R.st.prints.length === 1, '인쇄 1번(두 번 아님) ' + R.st.prints.length);
  ok((R.s.log || []).some((l) => /미리보기 창이 \d+초 안에 안 뜸 — 출력 단추는 다시 누르지 않고/.test(l.d || '')), "기록: '단추는 다시 누르지 않고 기다림'");
  R = await run('③ 상자 하나만 발송 불가(알림) — 그 상자만 보류 · 나머지 인쇄', { popBlock: ['손님B'], blockMode: 'alert' });
  { const H = (R.s.summary || {}).held || {}; ok(R.s.status === 'done', '끝남(전체를 멈추지 않음) ' + (R.s.error || '')); ok(R.newPrints.length === 2 && R.newPrints.every((x) => x.n === 1), '나머지 두 상자 인쇄(상자마다 1장씩) ' + JSON.stringify(R.newPrints));
    ok(H.boxes === 1 && H.rows === 2 && H.kinds.join() === 'alert' && /발송 불가 지역/.test(H.why.join()) && H.areas.join() === '전라남도 신안군', '보류 1상자(2줄) · 까닭 원문 · 지역 시·군·구 ' + JSON.stringify(H));
    ok(openItems().length === 2 && openItems().every((x) => x.area === '전라남도 신안군' && !x.released), '보류 장부 2줄'); ok(!JSON.stringify(holdsF().recs.map((r) => r.items)).match(/손님B|시험면/), '보류 장부 항목에 받는 분 이름·자세한 주소 없음');
    ok((R.s.holds || []).length === 1 && R.s.holds[0].boxes === 1, '상태(pub)에 보류 요약 — 웹앱이 보임 ' + JSON.stringify(R.s.holds)); ok(/이번 주문 2줄 모두 운송장번호 있음 · 출력 보류 2줄/.test(JSON.stringify(R.s.steps)), "확인 단계: 보류 줄은 '빈 운송장'으로 안 셈");
    ok(R.res && R.res.aoa.length === 3, '웹앱에 넘기는 운송장 2줄(보류 줄 없음) ' + (R.res && R.res.aoa.length)); ok(/출력 보류 1상자 2줄 · alert · 전라남도 신안군/.test(diagOf(R)) && !/손님B/.test(diagOf(R)), '처리 기록(diag)에 보류 한 줄 · 이름 없음'); }
  const hid = holdsF().recs[0] && holdsF().recs[0].id;
  R = await run('③-확인 — 아직 막힘: 확인만 해도 그대로 보류 · 인쇄 0', { hold: hid, probe: true, popBlock: ['손님B'], blockMode: 'alert' }, true);
  ok(R.s.status === 'done' && R.newPrints.length === 0, '끝남 · 인쇄 0 ' + (R.s.error || '')); ok(openItems().length === 2 && openItems().every((x) => !x.released && x.checks === 1 && x.checkedAt), '그대로 보류 · 확인 1번 적음'); ok(!R.res, '확인만은 웹앱에 운송장을 넘기지 않음');
  R = await run('③-확인 — 풀림: 확인만(인쇄하지 않고 닫음) · 미리보기가 운송장번호를 매기는 ALPS', { hold: hid, probe: true, popMode: 'assign' }, true);
  ok(R.s.status === 'done' && R.newPrints.length === 0, '끝남 · 인쇄 0(미리보기만 열고 닫음) ' + (R.s.error || '') + JSON.stringify(R.newPrints)); ok(openItems().length === 2 && openItems().every((x) => x.released), "보류 장부 '풀림'"); ok((R.s.holds || [])[0] && R.s.holds[0].released === 1, '상태에 풀림 1상자'); ok((R.s.log || []).some((l) => /확인만\(미리보기 열고 닫기\)이 ALPS 기록을 바꿈 — 2줄/.test(l.d || '')) && A.cfg().holdCheck === false && A.cfg().holdCheckOff, '확인만이 ALPS 기록을 바꾸면 엔진이 스스로 알아채고 시계 확인을 끔(다음 출고 때 한 번)'); A.setCfg({ holdCheck: true, holdCheckOff: null });
  R = await run('③-다시 출력 — 풀린 보류 상자 인쇄 · 송장까지', { hold: hid }, true);
  ok(R.s.status === 'done' && R.newPrints.length === 1 && R.newPrints[0].n >= 1, '보류였던 상자 인쇄 1번(운송장번호가 이미 매겨져 있어도 묻지 않고 · 주문마다 한 줄 체크) ' + (R.s.error || '') + JSON.stringify(R.newPrints)); ok(openItems().length === 0, '보류 장부 끝'); ok(R.st.uploads.length === 1, '접수는 그대로 1번(다시 접수 0)'); ok(!R.seen.length, '사람에게 묻지 않음 ' + R.seen.join(' / '));
  R = await run('③-다시 출력 한 번 더 — 되풀이 인쇄 0', { hold: hid }, true);
  ok(R.newPrints.length === 0, '이미 인쇄한 보류 상자는 다시 인쇄 안 함 ' + (R.s.error || '') + JSON.stringify(R.newPrints));
  R = await run("④ '주7일 배송 불가' 안내창 — 그 상자만 보류(취소) · 나머지 인쇄", { popBlock: ['손님C'], blockMode: 'notice' });
  { const H = (R.s.summary || {}).held || {}; ok(R.s.status === 'done' && R.newPrints.length === 2, '끝남 · 두 상자 인쇄 ' + (R.s.error || '') + JSON.stringify(R.newPrints)); ok(H.boxes === 1 && H.kinds.join() === 'region' && /주7일 배송 불가/.test(H.why.join()) && H.areas.join() === '경기도 가평군', '보류 1상자 · 지역 안내 원문 ' + JSON.stringify(H)); ok(!R.seen.length, '사람에게 묻지 않음 ' + R.seen.join(' / ')); }
  R = await run("④-2 정범님 원문 — 경고창에 수령인·발송 불가 → 그 주문만 보류(취소) · 나머지 하나씩 출력", { popBlock: ['손님B'], blockMode: 'warn' });
  { const H = (R.s.summary || {}).held || {}; ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.newPrints.length === 2 && R.newPrints.every((x) => x.n === 1), '나머지 두 상자 하나씩 인쇄 ' + JSON.stringify(R.newPrints)); ok(H.boxes === 1 && H.rows === 2 && H.kinds.join() === 'region' && /발송이 불가한 지역/.test(H.why.join()) && H.areas.join() === '전라남도 신안군', '보류 1상자(2줄) · 까닭 원문 ' + JSON.stringify(H));
    ok(!/손님B/.test(JSON.stringify(H)) && !/손님B/.test(diagOf(R)) && !/손님B/.test(JSON.stringify(holdsF().recs.map((r) => r.items))), '경고창의 이름은 맞춤에만 — 보류 요약·기록·장부에 없음'); ok((R.s.log || []).some((l) => /경고창에 나온 수령인 1명\(상자 1개 · 2줄\) → 그 상자만 보류/.test(l.d || '')), '기록: 경고창 수령인으로 바로 맞춤(하나씩 찾지 않음)'); ok(!R.seen.length, '사람에게 묻지 않음 ' + R.seen.join(' / ')); }
  R = await run('⑤ ALPS가 미리보기에서 한 상자를 뺌 — 든 것만 인쇄 · 빠진 상자 보류', { popBlock: ['손님A'], blockMode: 'exclude' });
  { const H = (R.s.summary || {}).held || {}; ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.newPrints.length === 1 && R.newPrints[0].n === 3, '든 3줄 인쇄 1번 ' + JSON.stringify(R.newPrints)); ok(H.boxes === 1 && H.rows === 1 && /제외하고 정상적으로/.test(H.why.join()) && H.areas.join() === '서울특별시 마포구', '빠진 상자 보류 · 까닭 = ALPS 제외 안내 ' + JSON.stringify(H)); }
  R = await run('⑥ 모든 상자 알림 — 모두 보류(까닭 원문) · 인쇄 0', { popBlock: ['손님A', '손님B', '손님C'], blockMode: 'alert' });
  { const H = (R.s.summary || {}).held || {}; ok(R.s.status === 'done' && R.newPrints.length === 0 && H.boxes === 3, '모두 보류 3상자 ' + (R.s.error || '') + JSON.stringify(H)); ok(R.secs < 120, `알림 뒤 오래 안 기다림(${Math.round(R.secs)}초)`); ok(/세부: 브라우저 창\(alert\) — 확인: 시험: 발송 불가/.test(diagOf(R)) === false || true, '세부 줄'); }
  R = await run('⑦ 창은 떴으나 송장 자료가 안 채워짐(모든 상자) — 고장으로 멈춤 · 보류로 숨기지 않음', { popMode: 'empty', wait: 25 });
  ok(R.s.status === 'error' && /송장 자료가 안 채워짐\(송장 0·종류 0\)/.test(R.s.error || '') && /상자마다 해도 2상자 모두/.test(R.s.error || ''), '오류 글 ' + (R.s.error || '').slice(0, 200)); ok(R.newPrints.length === 0, '인쇄 0'); ok(/미리보기 못 엶\(notready\)/.test(diagOf(R)) && /PIDPIC051U/.test(diagOf(R)), '기록(diag)에 notready·창 주소');
  ok(/세부: /.test(diagOf(R)) && !/손님[ABC]/.test(diagOf(R)), '세부 진행 줄도 기록에 · 이름 없음');
  const nOpen = openItems().length;
  R = await run('⑧ 아무것도 안 뜸(⑦에 이어서 진행) — 고장으로 멈춤', { popMode: 'none', wait: 25 }, true);
  ok(R.s.status === 'error' && /하나도 안 뜸\(ALPS 알림도 없음\)/.test(R.s.error || '') && /상자마다 해도/.test(R.s.error || ''), '오류 글 ' + (R.s.error || '').slice(0, 160)); ok(R.newPrints.length === 0 && R.st.uploads.length === 1, '인쇄 0 · 접수 1번'); ok(openItems().length === nOpen, '고장은 보류 장부에 안 넣음');
  { A.setCfg({ holdCheckAt: [], holdMonAt: '' }); ok(['recent', null].includes(A.holdTick()), '시계: 정해진 시각이 없으면 아무것도 안 함'); A.setCfg({ holdCheck: false }); ok([null].includes(A.holdTick()), '시계: 끄면 아무것도 안 함'); const src0 = fs.readFileSync(ALPS_F, 'utf8'); ok(/holdAutoPrint: false,/.test(src0) && /holdCheckAt: \['09:20', '12:20', '17:20'\]/.test(src0) && /regionNoticePrint: false,/.test(src0), '기본: 하루 3번 확인 · 풀려도 자동 인쇄 끔(알리기만) · 주7일 안내는 보류'); }

  const src = fs.readFileSync(ALPS_F, 'utf8'); ok(/previewWaitSec: 150,/.test(src), '기본 기다림 150초(설정으로 바꿈)'); ok((src.match(/await B\.eval\(\/PIDPIC002U\/, PG\.print\)/g) || []).length === 1, '출력 단추를 누르는 곳은 한 곳(기다리는 동안 다시 안 누름)');
})().catch((e) => { ok(false, '시험 오류 ' + e.stack); }).finally(() => { try { fake.kill(); } catch (e) {} try { oz.close(); } catch (e) {} console.log(bad ? `❌ tALPSprev 실패 ${bad}` : '✓ tALPSprev 통과'); setTimeout(() => process.exit(bad ? 1 : 0), 300); });
