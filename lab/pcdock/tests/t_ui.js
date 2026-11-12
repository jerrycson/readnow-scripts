/* t_ui — 진짜 크로미움(Playwright)으로 화면을 눌러 봄: 처음 화면 단추 4개 · ① 배치도에 끌어 놓기·모서리 늘리기·겹침 막기·칸 수 바꾸기·탐색기 끌어 놓기·저장 · ④ 정리 미리보기·두 번 누르기
 *  가짜 PowerShell(모니터 3대 — 1920×1080 · 2560×1080 · 3840×2160 150%) · 스크린샷(deviceScaleFactor 1)은 PCDOCK_SHOTS 폴더(없으면 임시 폴더)에
 * 실행: node lab/pcdock/tests/t_ui.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const PW = process.env.PCDOCK_PW || '/opt/node-tools/node_modules/playwright';
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 400) : '')); } };
const SHOTS = process.env.PCDOCK_SHOTS || fs.mkdtempSync(path.join(os.tmpdir(), 'pcdock-shots-'));
(async () => { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdocku-')); const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk') };
  const sp = cp.spawn(process.execPath, [path.join(__dirname, '..', 'readnow-pcdock.js')], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  const port = await new Promise((res) => { let b = ''; sp.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) res(+m[1]); }); });
  const br = await require(PW).chromium.launch(); const errs = [];
  try {
    const ctx = await br.newContext({ viewport: { width: 340, height: 470 }, deviceScaleFactor: 1 }); const pg = await ctx.newPage(); pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => { errs.push('팝업: ' + d.message()); d.dismiss(); });
    await pg.goto(`http://127.0.0.1:${port}/`); await pg.waitForFunction(() => /판 /.test(document.querySelector('#ver').textContent));
    console.log('① 처음 화면');
    ok(await pg.$$eval('#home .big', (L) => L.length) === 4, '단추 4개'); ok(/모니터 3대/.test(await pg.textContent('#b1s')), '모니터 수가 보임');
    await pg.screenshot({ path: path.join(SHOTS, '1-home.png') });
    await pg.click('#b2'); await pg.waitForFunction(() => document.querySelector('#b2sw').classList.contains('on')); ok(/켜짐/.test(await pg.textContent('#b2s')) && fs.existsSync(path.join(D, 'startup.lnk')), '② 누르면 켜짐(시작 프로그램 바로가기)');
    console.log('② 설정 — 배치도');
    await pg.setViewportSize({ width: 1180, height: 760 }); await pg.click('#b1'); await pg.waitForSelector('.cell');
    const cells = await pg.$$eval('.cell', (L) => L.length); ok(cells === 12 + 15 + 12, '칸 수 — 4×3 + 5×3(울트라와이드) + 4×3(4K)', cells);
    ok(/150%/.test(await pg.textContent('#map')) && /2560×1080/.test(await pg.textContent('#map')), '모니터마다 해상도·배율·칸 수 글');
    const C = async (mon, c, r) => { const b = await (await pg.$(`.cell[data-mon="${mon.replace(/\\/g, '\\\\')}"][data-c="${c}"][data-r="${r}"]`)).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    const drag = async (from, to) => { const el = await pg.$(from); await el.scrollIntoViewIfNeeded(); if (typeof to === 'function') to = await to(); const b = await el.boundingBox(); const sx = /\.rz$/.test(from) ? b.x + b.width / 2 : b.x + 6, sy = b.y + b.height / 2; await pg.mouse.move(sx, sy); await pg.mouse.down(); await pg.mouse.move(b.x + 40, b.y + 10, { steps: 3 }); await pg.mouse.move(to.x, to.y, { steps: 8 }); await pg.mouse.up(); };
    const D1 = '\\\\.\\DISPLAY1', D2 = '\\\\.\\DISPLAY2', D3 = '\\\\.\\DISPLAY3';
    await drag('.app[data-app="kakao"]', await C(D2, 4, 0)); ok(await pg.$$eval('.blk', (L) => L.length) === 1, '카카오톡을 울트라와이드 5번째 칸에 끌어 놓음');
    await drag('.app[data-app="chrome"]', await C(D1, 0, 0)); await drag('.blk[data-i="1"] .rz', await C(D1, 1, 2));
    const pl = await pg.evaluate(() => C.place); ok(pl[1] && pl[1].w === 2 && pl[1].h === 3, '크롬 덩이 모서리를 끌어 2×3으로 늘림', pl);
    await drag('.app[data-app="word"]', await C(D1, 1, 1)); ok((await pg.evaluate(() => C.place)).length === 2 && /한 칸에 하나/.test(await pg.textContent('#toast')), '이미 찬 칸에는 안 놓임(한 칸에 하나 쪽지)');
    await drag('.app[data-app="claude"]', await C(D3, 0, 0)); await drag('.blk[data-i="2"] .rz', await C(D3, 1, 1));
    await drag('.app[data-app="excel"]', await C(D1, 2, 0)); await drag('.blk[data-i="3"]', await C(D1, 3, 2)); ok((await pg.evaluate(() => C.place))[3].c === 3, '놓은 덩이를 끌어 다른 칸으로 옮김', await pg.evaluate(() => [C.place, document.querySelector("#toast").textContent]));
    await pg.click('.app[data-app="claude"]'); await pg.fill('[data-f=room]', 'https://claude.ai/chat/0b9f3a10-1111-2222-3333-444455556666'); ok(/claude:\/\//.test(await pg.textContent('#detail')), 'Claude 세부 설정(방 주소 · 여는 길)');
    await pg.click('.app[data-app="chrome"]'); await pg.fill('[data-f=urls]', 'https://readnow.kr/app/\nhttps://readnow.kr/manual/');
    /* 탐색기에서 .exe를 끌어다 놓음(브라우저 DataTransfer 흉내) */
    await pg.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['MZ'], 'Tool.exe')); const el = document.querySelector('#apps'); for (const t of ['dragenter', 'dragover', 'drop']) el.dispatchEvent(new DragEvent(t, { dataTransfer: dt, bubbles: true, cancelable: true })); });
    await pg.waitForFunction(() => C.apps.some((a) => a.name === 'Tool' && /Tool\.exe$/.test(a.exe))); ok(true, '탐색기에서 끌어 놓은 프로그램(.exe)이 목록에 더해짐(경로는 도우미가 찾음)');
    await pg.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['L'], '메모장.lnk')); const el = document.querySelector('#apps'); el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
    await pg.waitForFunction(() => C.apps.some((a) => /notepad\+\+/.test(a.exe || ''))); ok(true, '바로가기(.lnk)도 대상을 풀어 더함');
    await pg.selectOption('#monopts .mo:nth-child(3) select', '2x2'); ok(await pg.$$eval(`.cell[data-mon="${D3.replace(/\\/g, '\\\\')}"]`, (L) => L.length) === 4 && (await pg.evaluate(() => C.place))[2].w === 1, '4K 모니터를 2×2로 — 놓은 자리도 비율대로 옮김', await pg.evaluate(() => C.place[2]));
    await pg.screenshot({ path: path.join(SHOTS, '2-settings.png') });
    await pg.click('#setOk'); await pg.waitForSelector('#home.on');
    const saved = JSON.parse(fs.readFileSync(path.join(D, 'settings.json'), 'utf8')); ok(saved.place.length === 4 && saved.apps.some((a) => a.name === 'Tool') && saved.mons[D3].grid === '2x2' && saved.apps.find((a) => a.id === 'chrome').urls.length === 2, '✔ 확인 → settings.json에 저장(자리 4 · 더한 프로그램 · 2×2)', saved.place);
    ok(saved.auto.on === true, '저장해도 시작 자동 켜짐은 그대로');
    console.log('③ 실행·배치 · 정리');
    await pg.setViewportSize({ width: 340, height: 470 }); await pg.click('#b3'); await pg.waitForFunction(() => /끝/.test(document.querySelector('#last').textContent)); { const t = await pg.textContent('#last'); ok(t.match(/✅/g).length === 3 && /⏭ 엑셀 — 실행 파일을 못 찾음/.test(t), '③ 결과 줄이 처음 화면에 보임(놓은 3 · 못 찾은 엑셀은 까닭과 함께 건너뜀)', t); }
    await pg.screenshot({ path: path.join(SHOTS, '3-home-after-run.png') });
    await pg.setViewportSize({ width: 560, height: 720 }); await pg.click('#b4'); await pg.click('#lvs button[data-lv="3"]'); await pg.click('#scan'); await pg.waitForSelector('#doClean');
    ok(/OneDrive/.test(await pg.textContent('#scanout')) && /Add-MpPreference/.test(await pg.textContent('#scanout')) && !(await pg.$('[data-pid="11"]')) && await pg.$eval('[data-pid="15"]', (x) => x.disabled), '깊게 미리보기 — 끌 후보(크롬 없음 · Adobe 보조 막힘) · Defender 제안 글');
    ok(/권하는 정도/.test(await pg.textContent('#advice')), '어디까지 비우면 좋은지 조언 단락');
    await pg.screenshot({ path: path.join(SHOTS, '4-clean.png'), fullPage: true });
    await pg.check('[data-pid="13"]'); await pg.click('#doClean'); ok(/한 번 더/.test(await pg.textContent('#doClean')) && !fs.readFileSync(path.join(D, 'fake.log'), 'utf8').includes('"cleanrun"'), '첫 번째 누름은 글만 바뀜(아직 안 지움)');
    await pg.click('#doClean'); await pg.waitForFunction(() => /끝/.test(document.querySelector('#scanout').textContent)); ok(/OneDrive/.test(await pg.textContent('#scanout')), '두 번째 누름에 정리 · 결과(지운 크기·끈 프로그램)');
    ok(!errs.length, '화면 오류·브라우저 팝업 없음', errs);
  } finally { await br.close(); sp.kill(); fs.rmSync(D, { recursive: true, force: true }); }
  console.log('스크린샷: ' + SHOTS);
  console.log(bad ? `✗ t_ui ${bad}/${n} 실패` : `✓ t_ui ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
