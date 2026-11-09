/* t_logwin — (0.1.6 정범님 11/09 밤) 📜 번외 수집기 기록창: 쉽게 열고 닫기 · 운영 기록창과 같은 모양·동작 · 개편(종류·찾기·접기·묶음·오류만·복사·내려받기·회차 요약·멈춘 까닭·자리 기억)
 *  · 기록 바탕(col2-journal): 비밀값 가림 · 로거 PC는 우리 숍·계정 흔적 안 남김 · 예스24 줄 안 받음 · 다시 켜도 오늘 기록 이어 보임 · 비우기는 지우지 않고 old/로 옮김 · 회차 요약
 *  · 화면(진짜 크로미움): 🗒 단추·Alt+L·Esc로 열고 닫기 · 거르기 · 찾기 · 같은 줄 접기 · 시간 묶음 · 오류만 · 두 번 눌러 내려받기·비우기 · ↗ 따로 창(380×560 · 따로 된 프로필) · 팝업 없음
 * 실행: node tests/t_logwin.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), os = require('os');
const JR = require('../helper/col2-journal.js'); const LW = require('../helper/col2-logwin.js');

(async () => {
  console.log('① 기록 바탕 — 가림·로거·보관·회차');
  { const s = JR.scrub('Cookie: SID=abcdef; token=eyJhbGciOiJIUzI1NiJ9xyzxyz1234567890abcdef 비밀번호=hunter2 a.b@c.com 010-0000-0000 consider');
    ok(!/abcdef|hunter2|a\.b@c|0000-0000|eyJhbG/.test(s) && /consider/.test(s), '모든 PC: 쿠키·토큰·비밀번호·전자우편·전화·열쇠 꼴은 가림(보통 낱말은 그대로)', s);
    const g = JR.loggerScrub('예스24 판매관리 주문 송장 https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123 https://example.com/x');
    ok(!/예스24|판매관리|주문|송장|example\.com/.test(g) && /wproduct\.aspx\?ItemId=123/.test(g), '로거: 우리 숍·판매관리·주문·송장 낱말과 알라딘 공개 상품 화면 밖 주소는 안 남김', g); }
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2j_')); let T = Date.UTC(2026, 10, 9, 12, 0, 0); let lg = false;
  let J = JR.makeJournal({ home: D, now: () => T, isLogger: () => lg });
  J.add('번외 수집 켬'); J.add('그림자 읽기 1 — ✓ 책', { k: 'read', l: 'ok', m: '알라딘', d: { id: '1', ok: true, ms: 4000, v: 'same' } });
  T += 1000; J.add('그림자 읽기 2 — ✓ 책', { k: 'read', l: 'warn', m: '알라딘', d: { id: '2', ok: true, ms: 6000, v: 'diff' } }); J.add('그림자 읽기 3 — ✗ 시간 넘음', { k: 'read', l: 'err', m: '알라딘', d: { id: '3', ok: false, ms: 30000 } });
  J.add('⏸ 자동 읽기 쉼 — 이번 시간 240장 다 씀', { k: 'rest', m: '쉼' }); J.add('🟦 예스24 크롬을 띄움', { k: 'y24', m: '예스24' });
  ok(J.since(0).length === 6 && J.since(3).length === 3 && J.since(0)[0].k === 'sys', '줄마다 차례·종류 · 차례 뒤 새 줄만 받음');
  const r0 = J.rounds(2)[0]; ok(r0.reads === 3 && r0.same === 1 && r0.diff === 1 && r0.fail === 1 && r0.avgMs === 13333 && r0.rest.length === 1 && /240장/.test(r0.rest[0].w.replace('#', '240')) && r0.y24 === 1 && r0.h === '21시', '회차 요약(한 시간): 읽은 화면·같음·다름·실패·평균 걸린 시간·쉼 까닭', JSON.stringify(r0));
  lg = true; ok(J.add('🟦 예스24 로그인 필요', { k: 'y24' }) === null && J.add('판매관리 주문 1건 송장 확인') && !/판매관리|주문|송장/.test(J.tail(1)[0].x) && J.kind() === 'logger', '로거 PC: 예스24 줄은 아예 안 받음 · 다른 줄의 숍 낱말도 가림 · 종류 logger'); lg = false;
  const dayF = path.join(D, 'journal', '2026-11-09.jsonl'); ok(fs.existsSync(dayF) && !/예스24 판매관리 주문/.test(fs.readFileSync(dayF, 'utf8')), '날짜 파일에 보관(가린 글로)');
  const J2 = JR.makeJournal({ home: D, now: () => T }); ok(J2.since(0).length === 7 && J2.days()[0] === '2026-11-09', '도우미를 다시 켜도 오늘 기록이 이어 보임');
  const cl = J2.clear(); ok(cl.moved === 1 && !fs.existsSync(dayF) && fs.readdirSync(path.join(D, 'journal', 'old')).length === 1 && J2.since(0).length === 0, '비우기 = 지우지 않고 journal/old 로 옮김');

  console.log('② 기록창 순수 함수 — 거르기·접기·묶음·멈춘 까닭');
  const mk = (s, l, k, x, t) => ({ s, l, k, m: k === 'read' ? '알라딘' : '도우미', x, t: t || T + s * 1000 });
  const Ls = [mk(1, 'info', 'sys', '켬'), mk(2, 'detail', 'sys', '자세히'), mk(3, 'warn', 'rest', '⏸ 쉼 — 429'), mk(4, 'err', 'read', '그림자 읽기 7 — ✗ 시간 넘음'), mk(5, 'err', 'read', '그림자 읽기 8 — ✗ 시간 넘음'), mk(6, 'err', 'read', '그림자 읽기 9 — ✗ 시간 넘음'), mk(7, 'ok', 'read', '그림자 읽기 10 — ✓ 책', T + 700e3)];
  ok(LW.view(Ls, { f: 'imp' }).length === 6 && LW.view(Ls, { f: 'err' }).length === 4 && LW.view(Ls, { f: 'errOnly' }).length === 3, '중요만·오류·경고만·⚠ 오류만');
  ok(LW.view(Ls, { kinds: ['rest'] }).length === 1 && LW.view(Ls, { kinds: ['read', 'warn'] }).length === 5, '종류 단추(여러 개 함께)');
  ok(LW.view(Ls, { q: '시간 넘음' }).length === 3 && /<mark>시간 넘음<\/mark>/.test(LW.rowHtml(Ls[3], '시간 넘음')), '찾기 + 맞은 곳 칠함');
  const fv = LW.view(Ls, { fold: true }); const f3 = fv.find((e) => e.n === 3); ok(fv.length === 5 && f3 && /9/.test(f3.x) && /×3/.test(LW.rowHtml(f3)), '같은 줄 접기 — 숫자만 다른 줄 셋 → 한 줄 ×3');
  const gv = LW.view(Ls, { group: true }); ok(gv.filter((e) => e.g).length === 2 && gv[0].g && gv[0].err === 3, '시간 묶음(10분마다 머리줄 · 오류 수)');
  ok(LW.stopWhy({ on: false }).length === 1 && /꺼져/.test(LW.stopWhy({ on: false })[0].t), '멈춘 까닭: 꺼짐');
  const sw = LW.stopWhy({ on: true, auto: { on: true, msg: '이번 시간 240장 다 씀' }, pace: { coolMs: 300000 }, chrome: { coolUntil: '2026-11-09 22:30:00', last: { why: '바로 꺼짐' } }, y24: { on: true, login: 'need' } });
  ok(sw.length === 4 && sw.some((x) => /240장/.test(x.t)) && sw.some((x) => /429/.test(x.t)) && sw.some((x) => /22:30/.test(x.t)) && sw.some((x) => /예스24 로그인/.test(x.t)), '멈춘 까닭: 쉼·429·크롬 쉼·예스24 로그인', sw.map((x) => x.t).join(' | '));
  ok(!LW.stopWhy({ on: true, y24: { on: true, login: 'need' } }, 'logger').some((x) => /예스24/.test(x.t)) && !LW.kindsFor('logger').includes('y24') && LW.kindsFor('office').includes('y24'), '로거: 예스24 까닭·종류 단추 없음');
  ok(/로거/.test(LW.roundsHtml([{ h: '21시', reads: 1, same: 1, diff: 0, no: 0, fail: 0, avgMs: 4000, err: 0, warn: 0, y24: 3, rest: [] }], 'logger')) && !/예스24/.test(LW.roundsHtml([{ h: '21시', reads: 1, same: 1, diff: 0, no: 0, fail: 0, avgMs: 4000, err: 0, warn: 0, y24: 3, rest: [] }], 'logger')), '회차 요약의 일 이름이 PC 종류에 맞음(로거는 예스24 없음)');

  console.log('③ 옆 창 기록창 — 진짜 크로미움');
  const A = await L.fakeAladin(() => null);
  const H = await L.startHelper({ aladin: A.base, cfg: { pc: 'MJ-TEST', watch: { tickSec: 60 } } });
  const br = await L.chromium().launch(); const errs = [], dialogs = [];
  try {
    const lines = [{ x: '번외 수집 켬', l: 'ok' }, { x: '자세한 줄', l: 'detail' }];
    for (let i = 1; i <= 4; i++) lines.push({ x: `그림자 읽기 ${100 + i} — ✗ 시간 넘음`, k: 'read', l: 'err', m: '알라딘', d: { id: String(100 + i), ok: false, ms: 30000 } });
    lines.push({ x: '그림자 읽기 200 — ✓ 좋은 책 · 같음', k: 'read', l: 'ok', m: '알라딘', d: { id: '200', ok: true, ms: 4200, v: 'same' } }, { x: '⏸ 자동 읽기 쉼 — 이번 시간 240장 다 씀', k: 'rest', m: '쉼' }, { x: 'Cookie: SID=zzsecretzz 받음', l: 'warn' });
    ok((await H.api('POST', '/test/note', { lines })).j.n === lines.length, '시험 줄 넣음');
    ok((await H.api('GET', '/log/lines?after=0')).j.lines.every((e) => !/zzsecretzz/.test(e.x)), '기록 길(/log/lines)에도 쿠키 값 없음');
    ok((await H.req('GET', '/log/lines?after=0')).st === 403, '기록 길은 머리(X-RN-Col2) 없으면 거절');
    const ctx = await br.newContext({ viewport: { width: 380, height: 560 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await p.goto(`http://127.0.0.1:${H.port}/`); await p.waitForSelector('#jwBtn');
    const vis = () => p.evaluate(() => { const w = document.getElementById('rn-jw'); return !!w && getComputedStyle(w).display !== 'none'; });
    ok(!(await vis()), '처음엔 닫힘(옆 창 상태가 가려지지 않게 · 연 상태는 기억)');
    await p.click('#jwBtn'); await p.waitForFunction(() => document.querySelectorAll('#rnjB > div[data-s]').length > 3, null, { timeout: 8000 }).catch(() => {});
    ok(await vis() && await p.evaluate(() => document.getElementById('jwBtn').classList.contains('on')), '🗒 기록 단추 한 번 = 열림(단추 색이 상태를 따름)');
    const hdr = await p.evaluate(() => ({ t: document.getElementById('rnjT').textContent, tabs: [...document.querySelectorAll('[data-jt]')].map((b) => b.textContent), f: [...document.querySelectorAll('#rnjF option')].map((o) => o.textContent), a: !!document.getElementById('rnjA'), d: document.getElementById('rnjD').textContent, x: document.getElementById('rnjX').textContent, w: document.getElementById('rn-jw').getBoundingClientRect().width, sw: document.documentElement.scrollWidth }));
    ok(/작업 기록 — MJ-TEST · 🏢 사무실/.test(hdr.t) && hdr.tabs.join() === '오늘 기록,전체 기록' && /중요만/.test(hdr.f[0]) && /오류·경고만/.test(hdr.f.join()) && hdr.a && /내려받기·비우기/.test(hdr.d) && hdr.x === '닫기', '운영 기록창과 같은 띠: 이름 · 오늘/전체 기록 · 중요만/전체/오류·경고만 · 검색 · 자동 스크롤 · 내려받기·비우기 · 닫기', JSON.stringify(hdr).slice(0, 200));
    ok(hdr.w <= 380 && hdr.sw <= 380, '작은 창(380) 안에 들어감 · 가로 넘침 없음', `${hdr.w} / ${hdr.sw}`);
    const rows = () => p.evaluate(() => [...document.querySelectorAll('#rnjB > div[data-s]')].map((d) => d.className + '|' + d.textContent));
    let R = await rows(); ok(R.some((r) => /^err\|.*×4/.test(r)) && R.length === 6, '같은 줄 접기(기본 켬) — 시간 넘음 넷이 한 줄 ×4', R.length + '줄');
    ok(/\d+\. \d+\. \d\d:\d\d:\d\d/.test(R[0]) && R.some((r) => /^ok\|/.test(r)) && R.some((r) => /^detail\|/.test(r)), '줄 모양 = 시각 · 일 이름 · 글 · 색(수준)');
    const stop = await p.evaluate(() => document.getElementById('rnjO').textContent); ok(/⛔ 번외 수집이 꺼져 있음/.test(stop) && /회차 요약/.test(stop), '맨 위: ⛔ 멈춘 까닭 바로 + 🧾 회차 요약', stop.slice(0, 80));
    await p.click('[data-o="fold"]'); R = await rows(); ok(R.length === 9, '접기 풀면 모두', R.length + '줄');
    await p.selectOption('#rnjF', 'errOnly'); R = await rows(); ok(R.length === 4 && R.every((r) => /^err\|/.test(r)), '⚠ 오류만');
    await p.selectOption('#rnjF', 'imp'); R = await rows(); ok(!R.some((r) => /^detail\|/.test(r)), '중요만 = 자세한 줄 뺌');
    await p.selectOption('#rnjF', 'all'); await p.click('[data-k="rest"]'); R = await rows(); ok(R.length === 1 && /240장/.test(R[0]), '종류 단추 ⏸ 쉼만'); await p.click('[data-k="rest"]');
    await p.fill('#rnjQ', '좋은 책'); R = await rows(); ok(R.length === 1 && (await p.evaluate(() => document.querySelectorAll('#rnjB mark').length)) === 1, '찾기 — 맞은 줄만 · 칠함');
    await p.press('#rnjQ', 'Enter'); ok(await p.evaluate(() => !!document.querySelector('#rnjB mark.cur')), 'Enter = 다음 맞은 곳으로'); await p.fill('#rnjQ', '');
    await p.click('[data-o="group"]'); ok((await p.evaluate(() => document.querySelectorAll('#rnjB .gh').length)) >= 1, '시간 묶음 머리줄'); await p.click('[data-o="group"]');
    await p.click('[data-jt="hist"]'); await p.waitForSelector('details.jd', { timeout: 5000 }).catch(() => {}); ok((await p.evaluate(() => document.querySelectorAll('details.jd').length)) === 1, '전체 기록 = 날짜별'); await p.click('[data-jt="today"]');
    await p.click('#rnjX'); ok(!(await vis()), '닫기'); await p.keyboard.press('Alt+L'); ok(await vis(), 'Alt+L = 열기'); await p.keyboard.press('Escape'); ok(!(await vis()), 'Esc = 닫기');
    await p.keyboard.press('Alt+L'); await p.reload(); await p.waitForSelector('#jwBtn'); await wait(500); ok(await vis(), '연 상태를 기억(다시 열어도 열린 채)');
    ok(await p.evaluate(() => Object.keys(localStorage).every((k) => k.startsWith('rn3-'))), '기기 저장은 rn3- 열쇠만');
    await p.click('#rnjD'); ok(/한 번 더/.test(await p.textContent('#rnjD')), '내려받기·비우기 = 팝업 대신 두 번 누르기');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.click('#rnjD')]); const txt = fs.readFileSync(await dl.path(), 'utf8');
    ok(/^readnow-col2-log-MJ-TEST-\d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename()) && /좋은 책/.test(txt) && !/zzsecretzz/.test(txt), '받은 파일 = 모든 기록(가린 글)', dl.suggestedFilename() + ' · ' + txt.length + '자 ' + txt.slice(0, 80));
    await wait(800); ok(fs.readdirSync(path.join(H.D, 'home', 'journal', 'old')).length >= 1, '비운 기록은 journal/old 에 남음(지우지 않음)');
    await p.click('#rnjP'); await wait(900); const la = H.T.clog().find((l) => /--app=\S*\/log/.test(l)) || '';
    ok(/col2-log-chrome/.test(la) && /--window-size=380,560/.test(la) && !(await vis()), '↗ 따로 창 = 작은 앱 창 380×560 · 따로 된 프로필 · 옆 창 안 기록창은 닫힘', la.slice(0, 160));
    await H.api('POST', '/win/hrect', { p: 'log', x: 40, y: 30, w: 420, h: 600 }); ok((await H.api('GET', '/status')).j.hwin == null || (await H.api('GET', '/status')).j.hwin.x !== 40, '따로 창 자리는 그 창 칸에만(옆 창 자리와 안 섞임)');
    const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message)); p2.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); }); await p2.goto(`http://127.0.0.1:${H.port}/log`); await wait(800);
    ok(await p2.evaluate(() => { const w = document.getElementById('rn-jw'); return w.classList.contains('full') && w.classList.contains('on') && !document.getElementById('rnjP'); }), '/log = 창 가득 기록창(늘 열림)');
    const pg = (await H.req('GET', '/')).b + (await H.req('GET', '/log')).b + fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-logwin.js'), 'utf8');
    ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(pg.replace(/\/\*[\s\S]*?\*\//g, '')), '팝업 함수 없음');
    ok(!dialogs.length && !errs.length, '브라우저 팝업·화면 오류 없음', (dialogs.concat(errs)).slice(0, 3).join(' | '));
    console.log('④ 로거 PC 화면');
    await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); await H.api('POST', '/test/note', { x: '🟦 예스24 로그인 필요', k: 'y24' }); await H.api('POST', '/test/note', { x: '판매관리 주문 송장 확인' });
    const lj = (await H.api('GET', '/log/lines?after=0')).j; ok(lj.kind === 'logger' && !lj.lines.some((e) => /예스24|판매관리|주문|송장/.test(e.x)), '로거: 기록에 우리 숍·예스24 흔적 없음');
    await p2.reload(); await wait(1500); const lt = await p2.evaluate(() => ({ t: document.getElementById('rnjT').textContent, k: document.getElementById('rnjK').textContent, o: document.getElementById('rnjO').textContent }));
    ok(/🛰 로거/.test(lt.t) && !/예스24/.test(lt.k + lt.o) && /로거/.test(lt.o), '로거 화면: 이름에 🛰 로거 · 예스24 단추·줄 없음 · 회차 요약 일 이름이 로거 것', JSON.stringify(lt).slice(0, 160));
  } finally { await br.close(); await H.stop(); for (const pp of fs.readdirSync('/proc').filter((x) => /^\d+$/.test(x))) { try { if (fs.readFileSync('/proc/' + pp + '/cmdline', 'utf8').includes(H.D)) process.kill(+pp); } catch (e) {} } A.srv.close(); }
  L.done('t_logwin');
})();
