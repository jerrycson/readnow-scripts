/* t_mons — (0.1.3 · 11/14 JS-MAIN 「모니터를 못 읽었습니다」) 모니터 1·2·3대 · 배율 100/125/150% · 읽기 실패(C# 엮기 실패·0대·BOM·멈춤) · 옛 판 넘겨받기 · 진단 칸
 *  가짜 PowerShell(FAKE_MONS·FAKE_SCREENS)로 서버를 켜고 API와 화면(Playwright)을 봄
 * 실행: node lab/pcdock/tests/t_mons.js */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const PW = process.env.PCDOCK_PW || '/opt/node-tools/node_modules/playwright';
const G = require('../grid.js');
let bad = 0, n = 0; const ok = (c, m, x) => { n++; if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ✗ ' + m + (x !== undefined ? ' — ' + JSON.stringify(x).slice(0, 500) : '')); } };
const FAKE = path.join(__dirname, 'fakeps.js'); fs.chmodSync(FAKE, 0o755);
const APPJS = path.join(__dirname, '..', 'readnow-pcdock.js');
function start(extra, D, port) { D = D || fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockm-'));
  const env = { ...process.env, RN_PCDOCK_HOME: D, RN_PCDOCK_PS: FAKE, RN_PCDOCK_NOWIN: '1', RN_PCDOCK_NOUPDATE: '1', RN_PCDOCK_PORT: String(port || 20000 + Math.floor(Math.random() * 20000)), FAKE_LOG: path.join(D, 'fake.log'), FAKE_STARTUP: path.join(D, 'startup.lnk'), ...(extra || {}) };
  const p = cp.spawn(process.execPath, [APPJS], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res, rej) => { let b = ''; const t = setTimeout(() => rej(new Error('안 켜짐')), 15000); p.stdout.on('data', (d) => { b += d; const m = /PCDOCK_PORT=(\d+)/.exec(b); if (m) { clearTimeout(t); res({ p, D, port: +m[1], env }); } }); p.on('exit', () => {}); }); }
function req(port, method, p, body) { return new Promise((res) => { const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
  const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: { 'content-type': 'application/json', 'x-rn-dock': '1', origin: 'http://127.0.0.1:' + port, ...(data ? { 'content-length': data.length } : {}) } }, (s) => { let b = ''; s.on('data', (d) => (b += d)); s.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ code: s.statusCode, j }); }); });
  r.on('error', (e) => res({ code: 0, j: null, err: e.message })); if (data) r.write(data); r.end(); }); }
const stop = (S) => { try { S.p.kill(); } catch (e) {} try { fs.rmSync(S.D, { recursive: true, force: true }); } catch (e) {} };

(async () => { let br = null;
  try {
    console.log('① 모니터 1·2·3대 · 배율 100/125/150%');
    for (const [set, want] of [['one', { n: 1, sc: [100] }], ['two125', { n: 2, sc: [125, 125] }], ['mix', { n: 3, sc: [100, 125, 150] }]]) {
      const S = await start({ FAKE_MONS: set }); try {
        const r = await req(S.port, 'GET', '/api/state'); const m = (r.j && r.j.mons) || [];
        ok(r.j && r.j.ok && m.length === want.n && !r.j.monErr && JSON.stringify(m.map(G.scaleOf)) === JSON.stringify(want.sc), `${set}: 모니터 ${want.n}대 · 배율 ${want.sc.join('/')}% · 까닭 칸 비어 있음`, r.j && { n: m.length, e: r.j.monErr });
        /* 배율과 상관없이 칸은 실제 화소로 — 일하는 칸을 다 덮음 */
        const cover = m.every((mm) => { const g = G.gridOf(mm, 'auto'); const a = G.cellRect(mm, g, 0, 0, g.cols, g.rows); const wa = mm.wa; return a.x === wa.x && a.y === wa.y && a.w === wa.w && a.h === wa.h; });
        ok(cover, `${set}: 칸 전체 = 일하는 칸(실제 화소 · 배율 영향 없음)`);
        const d = await req(S.port, 'GET', '/api/diag'); ok(d.j && d.j.app === 'readnow-pcdock' && d.j.mons === want.n && d.j.monErr === '' && d.j.ver, `${set}: 진단 칸(/api/diag) — 모니터 ${want.n}대`, d.j);
      } finally { stop(S); } }
    { const m = { b: { x: 2560, y: 0, w: 1920, h: 1080 }, wa: { x: 2560, y: 0, w: 1920, h: 1032 }, dpi: 120 }; const c = G.cellRect(m, G.gridOf(m), 3, 2); ok(c.x === 2560 + 1440 && c.w === 480 && c.y === 688 && c.h === 344, '125% 두 번째 모니터 맨 오른쪽 아래 칸 = 실제 화소 480×344', c); }

    console.log('② 모니터 읽기 실패 — 까닭이 화면·기록·진단에 남음');
    { const S = await start({ FAKE_SCREENS: 'fail' }); try {
        const r = await req(S.port, 'GET', '/api/state'); ok(r.j && r.j.ok && r.j.mons.length === 0 && /C# 글\(pcdock-win\.cs\)을 엮지 못함/.test(r.j.monErr || ''), 'C# 엮기 실패 → 상태에 모니터 0대 + 까닭(monErr)', r.j && r.j.monErr);
        const s2 = await req(S.port, 'POST', '/api/screens', {}); ok(s2.j && s2.j.ok === false && /엮지 못함/.test(s2.j.err || ''), '「모니터 다시 읽기」도 ok:false + 같은 까닭', s2.j);
        const lg = fs.readFileSync(path.join(S.D, 'pcdock.log'), 'utf8'); ok(/✗ 윈도우 일 실패\(screens\)/.test(lg), '기록(pcdock.log)에 실패가 남음(0.1.2까지는 안 남았음)');
        const dj = JSON.parse(fs.readFileSync(path.join(S.D, 'diag.json'), 'utf8')); ok(dj.errs.length >= 1 && dj.errs[0].act === 'screens', '진단 파일(diag.json)에 최근 실패');
        const d = await req(S.port, 'GET', '/api/diag'); ok(d.j && d.j.mons === 0 && /엮지 못함/.test(d.j.monErr) && !/someone/.test(JSON.stringify(d.j)) && /%USERPROFILE%/.test(JSON.stringify(d.j)), '진단 칸 — 까닭 · 사용자 폴더 이름은 가림', d.j);
        const r2 = await req(S.port, 'GET', '/api/diag'); ok(r2.code === 200, '진단 칸은 GET(수집기가 읽음)');
      } finally { stop(S); } }
    for (const [mode, re, desc] of [['empty', /0대/, '0대로 알려 줌'], ['crash', /윈도우 일 실패\(screens\)/, 'JSON 없이 끝남']]) {
      const S = await start({ FAKE_SCREENS: mode }); try { const r = await req(S.port, 'GET', '/api/state'); ok(r.j && r.j.ok && !r.j.mons.length && re.test(r.j.monErr || ''), `${desc} → 까닭: ${(r.j && r.j.monErr || '').slice(0, 40)}`, r.j && r.j.monErr); } finally { stop(S); } }
    { const S = await start({ FAKE_SCREENS: 'bom', FAKE_MONS: 'two125' }); try { const r = await req(S.port, 'GET', '/api/state'); ok(r.j && r.j.mons.length === 2 && !r.j.monErr, '답 앞에 BOM이 붙어 와도 읽음', r.j && r.j.monErr); } finally { stop(S); } }

    console.log('③ 화면 — 까닭이 보임 · 다시 읽기');
    br = await require(PW).chromium.launch();
    { const S = await start({ FAKE_SCREENS: 'fail' }); try { const pg = await (await br.newContext({ viewport: { width: 1180, height: 760 } })).newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('dialog', (d) => { errs.push('팝업'); d.dismiss(); });
        await pg.goto(`http://127.0.0.1:${S.port}/`); await pg.waitForFunction(() => /판 /.test(document.querySelector('#ver').textContent));
        ok(await pg.isVisible('#monWarn') && /모니터를 못 읽음 — .*엮지 못함/.test(await pg.textContent('#monWarn')), '처음 화면에 「⚠ 모니터를 못 읽음 — 까닭」');
        await pg.click('#b1'); await pg.waitForSelector('#map .bad'); const t = await pg.textContent('#map'); ok(/모니터를 못 읽었습니다/.test(t) && /까닭: .*엮지 못함/.test(t) && !/윈도우 일 실패\(screens\)/.test(t), '배치도에 까닭 그대로(앞머리 뺌)', t.slice(0, 200));
        await pg.click('#reMon'); await pg.waitForFunction(() => /모니터를 못 읽음/.test(document.querySelector('#toast').textContent)); ok(/엮지 못함/.test(await pg.textContent('#toast')), '다시 읽기 → 쪽지에 까닭');
        ok(!errs.length, '화면 오류·팝업 없음', errs);
      } finally { stop(S); } }
    { const S = await start({ FAKE_MONS: 'mix' }); try { const pg = await (await br.newContext({ viewport: { width: 1180, height: 760 } })).newPage();
        await pg.goto(`http://127.0.0.1:${S.port}/`); await pg.waitForFunction(() => /판 /.test(document.querySelector('#ver').textContent)); ok(!(await pg.isVisible('#monWarn')), '읽히면 경고 없음');
        await pg.click('#b1'); await pg.waitForSelector('.cell'); const cells = await pg.$$eval('.cell', (L) => L.length); const t = await pg.textContent('#map');
        ok(cells === 12 + 12 + 12 && /125%/.test(t) && /150%/.test(t), '배율이 섞인 3대 — 칸 4×3씩 · 125%·150% 글', { cells });
        await pg.click('#reMon'); await pg.waitForFunction(() => /모니터 3대를 읽었습니다/.test(document.querySelector('#toast').textContent)); ok(true, '다시 읽기 → 「모니터 3대를 읽었습니다」');
      } finally { stop(S); } }

    console.log('④ 옛 판 서버를 새 판이 넘겨받음 · 새 판 바꾸기 단추');
    { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'pcdockm-')); const port = 20000 + Math.floor(Math.random() * 20000);
      const A = await start({ RN_PCDOCK_VER_TEST: '0.1.2' }, D, port); const pa = await req(port, 'GET', '/api/ping'); ok(pa.j && pa.j.ver === '0.1.2', '옛 판(0.1.2 흉내) 서버가 켜짐');
      const B = await start({ FAKE_OLD_PID: String(A.p.pid) }, D, port); const pb = await req(B.port, 'GET', '/api/ping');
      ok(B.port === port && pb.j && pb.j.ver === require('../pcdock-config.js').PCDOCK_VER && /옛 판 0\.1\.2 서버.*넘겨받음\(\w+\) — 끔/.test(fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8')), '새 판이 옛 서버를 끄고 같은 포트에서 켜짐', pb.j);
      const st = fakeStop(D); ok(!st && /넘겨받음\(quit\)/.test(fs.readFileSync(path.join(D, 'pcdock.log'), 'utf8')), '(0.1.4) 0.1.4 이상끼리는 PowerShell 없이 /api/quit로 끔(stopold 안 부름 · 0.1.3 넘겨받기는 t_show ⑥)', st);
      const rs = await req(port, 'POST', '/api/restart', {}); ok(rs.j && rs.j.ok === false && /새 판이 없음/.test(rs.j.err), '받아 둔 새 판이 없으면 바꾸기 단추는 아무것도 안 함', rs.j);
      const C = cp.spawnSync(process.execPath, [APPJS], { env: { ...B.env, RN_PCDOCK_PORT: String(port) }, timeout: 10000 }); ok(C.status === 0 && (await req(port, 'GET', '/api/ping')).j.ver === pb.j.ver, '같은 판이면 넘겨받지 않고 창만 엶');
      try { B.p.kill(); } catch (e) {} try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} }
  } catch (e) { bad++; console.log('  ✗ 시험이 멈춤: ' + e.message); } finally { if (br) await br.close(); }
  console.log(bad ? `✗ t_mons ${bad}/${n} 실패` : `✓ t_mons ${n}개 모두 통과`); process.exit(bad ? 1 : 0); })();
function fakeStop(D) { try { return fs.readFileSync(path.join(D, 'fake.log'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((x) => x.act === 'stopold').pop(); } catch (e) { return null; } }
