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
  const H = await L.startHelper({ aladin: A.base, cfg: { pc: 'MJ-TEST', watch: { tickSec: 60, lwRetryMs: 1500 } } });
  const br = await L.chromium().launch(); const errs = [], dialogs = [];
  try {
    const lines = [{ x: '번외 수집 켬', l: 'ok' }, { x: '자세한 줄', l: 'detail' }];
    for (let i = 1; i <= 4; i++) lines.push({ x: `그림자 읽기 ${100 + i} — ✗ 시간 넘음`, k: 'read', l: 'err', m: '알라딘', d: { id: String(100 + i), ok: false, ms: 30000 } });
    lines.push({ x: '그림자 읽기 200 — ✓ 좋은 책 · 같음', k: 'read', l: 'ok', m: '알라딘', d: { id: '200', ok: true, ms: 4200, v: 'same' } }, { x: '⏸ 자동 읽기 쉼 — 이번 시간 240장 다 씀', k: 'rest', m: '쉼' }, { x: 'Cookie: SID=zzsecretzz 받음', l: 'warn' });
    ok((await H.api('POST', '/test/note', { lines })).j.n === lines.length, '시험 줄 넣음');
    ok((await H.api('GET', '/log/lines?after=0')).j.lines.every((e) => !/zzsecretzz/.test(e.x)), '기록 길(/log/lines)에도 쿠키 값 없음');
    ok((await H.req('GET', '/log/lines?after=0')).st === 403, '기록 길은 머리(X-RN-Col2) 없으면 거절');
    const ctx = await br.newContext({ viewport: { width: 380, height: 560 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await H.api('POST', '/ui', { ui: { logPop: false, at: Date.now() + 864e5 }, quiet: true }); /* (0.1.8) 아래 ③은 옆 창 안 칸(⚙에서 고른 경우) — 따로 창(기본)은 ③-2 */
    await p.addInitScript(() => { try { if (!sessionStorage.getItem('t-init')) { sessionStorage.setItem('t-init', '1'); localStorage.setItem('rn3-ui', JSON.stringify({ logPop: false, at: Date.now() + 2 * 864e5 })); } } catch (e) {} });
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
    console.log('③-2 (0.1.8) 🗒 기록창 = 따로 작은 창(기본) — 옆 창 밖으로');
    { const st = async () => (await H.api('GET', '/status')).j; const spawns = () => H.T.clog().filter((l) => /--app=\S*\/log/.test(l)).length; const acts = () => H.T.win().acts || []; const btnOn = () => p.evaluate(() => document.getElementById('jwBtn').classList.contains('on'));
      ok(require(path.join(L.ROOT, 'helper', 'col2-ui.js')).normalize({}).logPop === true, '기본값 = 따로 작은 창(설정이 없으면)');
      if (await vis()) await p.click('#rnjX'); await H.api('POST', '/win/log', { act: 'close', why: '시험 처음' }); await wait(400);
      await p.click('#setBtn'); await wait(300); await p.check('#lpop1'); await wait(500); await p.click('#setBtn'); await wait(200);
      ok((await H.api('GET', '/ui')).j.ui.logPop === true, '⚙ › 창 › 🗒 기록창 여는 곳 = 따로 작은 창으로 바꿔 저장(PC마다)');
      const n0 = spawns(); await p.click('#jwBtn'); await wait(1000); let s = await st();
      const la = H.T.clog().filter((l) => /--app=\S*\/log/.test(l)).pop() || '';
      ok(spawns() === n0 + 1 && /col2-log-chrome/.test(la) && /--window-size=\d+,\d+/.test(la) && !(await vis()) && s.lwin && s.lwin.open && (await btnOn()), '🗒 한 번 = 따로 작은 앱 창(따로 된 프로필 · 기억한 크기) · 옆 창 안 칸은 안 열림 · 단추 색 켜짐', la.slice(0, 140));
      { H.T.setWin((S) => { S['col2-log-chrome'] = { r: { x: 300, y: 200, w: 1280, h: 900 }, tool: false, front: 0, ...(S['col2-log-chrome'] || {}), ic: true }; }); await wait(450); /* (11/10) 창이 알리는 보임·자리(진짜는 바뀌는 즉시 · 가짜는 0.3초마다) */ const a0 = acts().length; await p.click('#jwBtn'); await wait(900); const A1 = acts().slice(a0); s = await st();
        ok(A1.includes('show:col2-log-chrome') && !A1.includes('close:col2-log-chrome') && spawns() === n0 + 1 && s.lwin.open, '이미 떠 있는데 작게 내렸으면 🗒 = 앞으로(새로 띄우지 않음)', A1.join(',')); }
      H.T.setWin((S) => { if (S['col2-log-chrome']) { S['col2-log-chrome'].ic = false; S['col2-log-chrome'].r = { x: -4000, y: 50, w: 400, h: 580 }; } }); await wait(450); { const a0 = acts().length; await p.click('#jwBtn'); await wait(900); const A1 = acts().slice(a0);
        ok(A1.includes('show:col2-log-chrome') && !A1.includes('close:col2-log-chrome'), '화면 밖에 있으면 🗒 = 화면 안으로 앞으로(약속 15)', A1.join(',')); }
      H.T.setWin((S) => { if (S['col2-log-chrome']) S['col2-log-chrome'].r = { x: 900, y: 120, w: 410, h: 600 }; }); await wait(450); { const a0 = acts().length; await p.click('#jwBtn'); await wait(1000); const A1 = acts().slice(a0); s = await st();
        ok(A1.includes('close:col2-log-chrome') && !s.lwin.open && !(await btnOn()) && s.lwin.rect && s.lwin.rect.x === 900 && s.lwin.rect.w === 410, '보이는데 다시 누르면 닫힘 · 닫기 전 자리·크기 기억(900,120 · 410×600)', JSON.stringify(s.lwin)); }
      await p.keyboard.press('Alt+L'); await wait(1000); const la2 = H.T.clog().filter((l) => /--app=\S*\/log/.test(l)).pop() || ''; s = await st();
      ok(spawns() === n0 + 2 && /--window-size=410,600/.test(la2) && /--window-position=900,120/.test(la2) && s.lwin.open, 'Alt+L = 따로 창을 기억한 자리·크기로 다시 엶', la2.slice(-80));
      await p2.reload(); await wait(900); ok((await H.api('GET', '/status')).j.lwin.open, '따로 창이 살아 있다는 소식(15초마다) — 단추 색이 맞음');
      { const a0 = acts().length; await p2.keyboard.press('Alt+L'); await wait(900); ok(acts().slice(a0).includes('close:col2-log-chrome') && !(await st()).lwin.open, '따로 창 안에서 Alt+L = 그 창을 닫음'); }
      await p.click('#setBtn'); await wait(300); await p.check('#lpop0'); await wait(400); await p.click('#setBtn'); await wait(200); const n2 = spawns(); await p.click('#jwBtn'); await wait(700);
      ok(await vis() && spawns() === n2 && (await H.api('GET', '/ui')).j.ui.logPop === false, '⚙에서 "이 옆 창 안"을 고르면 예전처럼 옆 창 안 칸'); await p.click('#rnjX');
      ok(!dialogs.length && !errs.length, '③-2 팝업·화면 오류 없음', (dialogs.concat(errs)).slice(0, 3).join(' | ')); }
    console.log('③-3 (11/10 아침 정범님 "기록 단추가 작동하지 않아") 기록창이 확실히 뜸 · 못 뜨면 2초 안에 옆 창 안으로 · 굳지 않음 · 한 줄 알림');
    { const st = async () => (await H.api('GET', '/status')).j; const spawns = () => H.T.clog().filter((l) => /--app=\S*\/log/.test(l)).length; const acts = () => H.T.win().acts || [];
      const msgT = () => p.evaluate(() => { const m = document.getElementById('rnjMsg'); return m ? m.textContent : ''; });
      await H.api('POST', '/win/log', { act: 'close', why: '시험' }); await wait(400); await p.click('#setBtn'); await wait(300); await p.check('#lpop1'); await wait(400); await p.click('#setBtn'); await wait(200);
      /* ① PowerShell이 아주 느려도(4초) 누름의 답은 곧바로 · 크롬은 PowerShell을 기다리지 않고 바로 뜸 */
      fs.writeFileSync(path.join(H.D, 'ps-slow'), '4000'); const n0 = spawns(), a0 = acts().length; const t0 = Date.now(); const r1 = await H.api('POST', '/win/log', { act: 'toggle', why: '시험' }); const ms = Date.now() - t0;
      ok(r1.j && r1.j.ok && r1.j.spawned && ms < 500, '창 찾기 PowerShell이 4초 걸려도 🗒 답은 곧바로(PowerShell을 기다리지 않음)', ms + 'ms');
      await wait(700); ok(spawns() === n0 + 1 && acts().length === a0 && (await st()).lwin.open, '크롬을 바로 띄우고 창이 떴다는 소식으로 확인(PowerShell 0번)', `띄움 ${spawns() - n0} · PowerShell ${acts().length - a0}`);
      fs.unlinkSync(path.join(H.D, 'ps-slow')); await H.api('POST', '/win/log', { act: 'close', why: '시험' }); await wait(600);
      /* ② 단추로 띄우면 한 줄 알림 '떴음' */
      await p.click('#jwBtn'); await wait(900); ok(/떴음/.test(await msgT()) && !(await vis()), '🗒 누른 뒤 한 줄 — "따로 기록창이 떴음 (n초)" · 옆 창 안 칸은 안 열림', await msgT());
      await p.click('#jwBtn'); await wait(700); ok(/닫음/.test(await msgT()) && !(await st()).lwin.open, '다시 누르면 한 줄 — "닫음"', await msgT()); await wait(400);
      /* ③ 크롬이 곧바로 끝나면(띄우기 실패) 2초 안에 옆 창 안 칸으로 저절로 · 까닭 한 줄 */
      fs.writeFileSync(path.join(H.D, 'app-die'), '21'); const tc = Date.now(); await p.click('#jwBtn'); let fellMs = null; for (let k = 0; k < 30; k++) { await wait(100); if (await vis()) { fellMs = Date.now() - tc; break; } }
      ok(fellMs != null && fellMs <= 2600, '따로 창을 못 띄우면 2초 안에 옆 창 안 기록 칸으로 저절로', fellMs + 'ms'); ok(/옆 창 안에 엶/.test(await msgT()) && /끝 코드 21|소식/.test(await msgT()), '까닭을 한 줄로(크롬 끝 코드)', await msgT());
      ok(await p.evaluate(async () => { const t = Date.now(); await new Promise((r) => setTimeout(r, 50)); return Date.now() - t < 400; }), '기다리는 동안 화면이 굳지 않음');
      fs.unlinkSync(path.join(H.D, 'app-die')); await p.click('#jwBtn'); await wait(300); ok(!(await vis()), '그 칸은 🗒으로 다시 닫힘'); await wait(2500);
      /* ④ 같은 프로필을 쥔 굳은 크롬(새 크롬이 넘기고 소식 없음) → 정한 시간 뒤 굳은 크롬을 끝내고 한 번 더 띄움 · 늦게 뜨면 옆 창 안 칸을 닫음 */
      fs.writeFileSync(path.join(H.D, 'app-silent'), '1'); const n1 = spawns(), k0 = acts().filter((x) => x === 'kill:col2-log-chrome').length; await p.click('#jwBtn'); await wait(2400);
      ok(await vis(), '소식이 없으면 2초 뒤 옆 창 안 칸'); await wait(900);
      ok(acts().filter((x) => x === 'kill:col2-log-chrome').length === k0 + 1 && spawns() === n1 + 2, '굳은 크롬을 끝내고(그 프로필만) 한 번 더 띄움', `띄움 ${spawns() - n1} · 끝냄 ${acts().filter((x) => x === 'kill:col2-log-chrome').length - k0}`);
      fs.unlinkSync(path.join(H.D, 'app-silent')); await wait(1500); ok(!(await vis()) && /늦게 떴음/.test(await msgT()) && (await st()).lwin.open, '따로 창이 늦게 뜨면 옆 창 안 칸은 저절로 닫고 한 줄', await msgT());
      const jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/따로 기록창이 떴음/.test(jl) && /굳은 크롬을 끝내고/.test(jl), '기록창에도 남음(띄움·떴음·다시 띄움)');
      await H.api('POST', '/win/log', { act: 'close', why: '시험 끝' }); await wait(400);
      ok(!dialogs.length && !errs.length, '③-3 팝업·화면 오류 없음', (dialogs.concat(errs)).slice(0, 3).join(' | ')); }
    console.log('④ 로거 PC 화면');
    await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); await H.api('POST', '/test/note', { x: '🟦 예스24 로그인 필요', k: 'y24' }); await H.api('POST', '/test/note', { x: '판매관리 주문 송장 확인' });
    const lj = (await H.api('GET', '/log/lines?after=0')).j; ok(lj.kind === 'logger' && !lj.lines.some((e) => /예스24|판매관리|주문|송장/.test(e.x)), '로거: 기록에 우리 숍·예스24 흔적 없음');
    await p2.reload(); await wait(1500); const lt = await p2.evaluate(() => ({ t: document.getElementById('rnjT').textContent, k: document.getElementById('rnjK').textContent, o: document.getElementById('rnjO').textContent }));
    ok(/🛰 로거/.test(lt.t) && !/예스24/.test(lt.k + lt.o) && /로거/.test(lt.o), '로거 화면: 이름에 🛰 로거 · 예스24 단추·줄 없음 · 회차 요약 일 이름이 로거 것', JSON.stringify(lt).slice(0, 160));
  } finally { await br.close(); await H.stop(); for (const pp of fs.readdirSync('/proc').filter((x) => /^\d+$/.test(x))) { try { if (fs.readFileSync('/proc/' + pp + '/cmdline', 'utf8').includes(H.D)) process.kill(+pp); } catch (e) {} } A.srv.close(); }
  L.done('t_logwin');
})();
