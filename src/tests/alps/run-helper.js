// 시험: readnow-alps.js를 가짜 ALPS(fake-alps.js)에 실제 크롬(CDP)으로 돌림 — 쓰는 법: LANG=C.UTF-8 node run-helper.js <local/readnow-alps.js 경로>
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'rnalps_')); process.env.RN_ALPS_HOME = HOME; process.env.RN_ALPS_TEST = '1'; process.env.RN_ALPS_NOSANDBOX = '1'; process.env.RN_ALPS_QUIET = process.env.V ? '' : '1';
const A = require(process.argv[2]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (u, o) => fetch('http://127.0.0.1:8771' + u, { method: 'POST', body: JSON.stringify(o) }).then((r) => r.json());
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const mine = [{ name: '가나다', title: '[중고-최상] 시험 책 하나', sku: 'PNKLUX' }, { name: '라마바', title: '시험 책 둘', sku: 'BLKAAA' }, { name: '라마바', title: '시험 책 셋', sku: 'BLKAAB' }, { name: '사아자', title: '시험 책 넷', sku: 'REDFGN' }];
async function scenario(name, o) { o = o || {}; console.log('■ ' + name);
  await post('/fake/seed', { seed: o.seed || mine.map((m, i) => ({ ...m, pack: m.name === '라마바' ? 'P1' : '' })), rows: o.rows || [], otp: !!o.otp, popAlert: o.popAlert, dispCount: 3 });
  A.setCfg({ baseUrl: 'http://127.0.0.1:8771/', chromePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', printer: o.printer ?? 'TEST-롯데택배', firstOne: !!o.firstOne, confirmBeforePrint: !!o.confirm, headless: true, stepTimeoutSec: 20, uploadTimeoutSec: 30, printTimeoutSec: 30 });
  A.reset(); const fakeX = Buffer.from('PK\u0003\u0004 가짜 xlsx').toString('base64');
  const r = A.start({ fileName: `판매완료${today}.xlsx`, b64: fakeX, rows: mine, firstOne: o.firstOne });
  const seen = []; const t0 = Date.now();
  for (;;) { await sleep(300); const s = A.status(); if (s.need) { seen.push(s.need.type + ':' + s.need.msg.slice(0, 30)); const ans = o.answer ? o.answer(s.need) : { kind: 'continue' }; A.input(ans); await sleep(300); }
    if (s.status === 'done' || s.status === 'error') break; if (Date.now() - t0 > 120000) { ok(false, '시간 초과 ' + JSON.stringify(s.steps)); break; } }
  const s = A.status(); const st = await fetch('http://127.0.0.1:8771/fake/state').then((r) => r.json()); return { s, st, seen, res: A.result(s.id) }; }
(async () => {
  await A.saveCred('testid', 'test-pw!'); ok(fs.readFileSync(path.join(HOME, 'cred.dat'), 'utf8').indexOf('test-pw!') < 0, '로그인 정보 파일에 비밀번호 평문 없음');
  let R = await scenario('기본: 로그인 → 접수 → 출력(한 번에) → 확인');
  ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.st.login.length === 1 && R.st.login[0] === 'testid', '아이디를 넣고 로그인');
  ok(R.st.uploads.length === 1 && R.st.uploads[0].name === `판매완료${today}.xlsx` && R.st.uploads[0].fmt === 'Z^1' && R.st.uploads[0].pick === today, "파일 1번 접수 · 이름 판매완료YYYYMMDD.xlsx · 사용자파일 '알라딘' · 오늘 집하일자");
  ok(R.st.uploads[0] && R.st.uploads[0].size === Buffer.from('PK\u0003\u0004 가짜 xlsx').length, '보낸 파일 바이트 그대로');
  ok(R.st.prints.length === 1 && R.st.prints[0].printer === 'TEST-롯데택배' && R.st.prints[0].n === 4, '인쇄 1번 · 프린터 이름 TEST-롯데택배 · 4줄 ' + JSON.stringify(R.st.prints));
  ok(R.res && R.res.aoa.length === 5 && R.res.aoa[0][0] === '운송장번호' && R.res.aoa.slice(1).every((r) => /^\d{12}$/.test(r[0])), '운송장 목록 4줄(운송장번호·수하인명 칸)');
  ok(R.s.summary.upload.ok === 4 && R.s.summary.printed === 4, '요약: 접수 4 · 인쇄 4');
  ok(fs.readFileSync(path.join(HOME, 'alps.log'), 'utf8').search(/가나다|라마바|FAKE-TOKEN|test-pw/) < 0, '기록(alps.log)에 이름·토큰·비밀번호 없음');
  R = await scenario('이 PC 기록에 오늘 같은 파일 접수 → 묻고 건너뜀 → ALPS 목록에 없으면 멈춤', { rows: [], answer: (n) => (n.type === 'choice' ? { kind: 'choice', pick: '접수 건너뛰고 출력만' } : { kind: 'continue' }) , seed: [] });
  // 위 시나리오는 seed를 비워 새로 올라가는 줄이 없게 하고, 이전 줄이 남아 있지 않으므로(서버 초기화) 겹침이 없음 → 정상으로 끝나야 함
  ok(R.s.status === 'error' && /하나도 못 찾음/.test(R.s.error), "ALPS에서 이번 주문을 못 찾으면 '끝'이 아니라 멈춤: " + R.s.error);
  // 진짜 겹침: 오늘 목록에 이미 같은 줄(출력 안 됨)
  const pre = mine.map((m, i) => ({ invNo: '', invPrntNm: '미출력', invPrntYn: 'N', acperNm: m.name, gdsNm: m.title, gdsDtlCont: m.sku, rsrvMgrNo: 'X' + i, pickYmd: today, bdpkKey: '', bdpkRpnSeq: '1', bdpkSctCd: 'N' }));
  R = await scenario('겹침: 오늘 같은 주문이 이미 있음 → 접수 건너뛰고 출력만', { rows: pre, answer: (n) => (n.type === 'choice' ? { kind: 'choice', pick: '접수 건너뛰고 출력만' } : { kind: 'continue' }) });
  ok(R.seen.some((x) => /^choice:오늘 ALPS에 이번 파일과 같은 주문 4\/4/.test(x)), '겹침을 사람에게 물음'); ok(R.st.uploads.length === 0, '다시 접수하지 않음'); ok(R.s.status === 'done' && R.st.prints.length === 1 && R.st.prints[0].n === 4, '출력만 4줄');
  R = await scenario('1장 먼저 → 확인 → 나머지 + OTP', { firstOne: true, otp: true, answer: (n) => (n.type === 'otp' ? { kind: 'otp', code: '123456' } : n.type === 'choice' ? { kind: 'choice', pick: '그래도 접수' } : { kind: 'continue' }) });
  ok(R.s.status === 'done', '끝남 ' + (R.s.error || '')); ok(R.seen.some((x) => x.startsWith('otp:')), 'OTP를 사람에게 물음'); ok(R.st.prints.length === 2 && R.st.prints[0].n === 1 && R.st.prints[1].n === 3, '1장 먼저, 그다음 3줄 ' + JSON.stringify(R.st.prints));
  ok(R.seen.some((x) => /^continue:1장\(첫 상자\)/.test(x)), "1장 뒤 '계속'을 물음");
  R = await scenario('ALPS 안내(주7일 묻기)는 사람에게 넘김 → 멈춤', { popAlert: '읍/면/리 구역은 주7일 배송 불가합니다.', answer: (n) => (n.type === 'choice' ? { kind: 'choice', pick: /오늘 ALPS에/.test(n.msg) ? '그래도 접수' : '취소하고 멈춤' } : { kind: 'continue' }) });
  ok(R.s.status === 'error' && /멈춤/.test(R.s.error) && R.st.prints.length === 0, 'ALPS 묻는 창을 사람에게 보이고 멈춤 · 인쇄 안 함');
  R = await scenario('프린터를 안 고르면 시작 전에 멈춤', { printer: '' });
  ok(R.s.status === 'error' && /프린터/.test(R.s.error) && R.st.prints.length === 0 && R.st.uploads.length === 0, '프린터 없음 → 접수·인쇄 안 하고 멈춤');
  R = await scenario('비밀번호가 틀리면 멈춤', { printer: 'P' }); // 정상 시나리오처럼 보이지만 아래에서 비밀번호를 바꿔 다시
  await A.saveCred('testid', 'wrong'); R = await scenario('틀린 비밀번호');
  ok(R.s.status === 'error' && /로그인/.test(R.s.error), '틀린 비밀번호 → 로그인 안내로 멈춤 ' + R.s.error);
  console.log(fails ? `✗ ${fails}개 실패` : '✓ 모두 통과'); fs.rmSync(HOME, { recursive: true, force: true }); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
