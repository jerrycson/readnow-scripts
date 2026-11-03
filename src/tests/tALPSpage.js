process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalpst'); const { chromium } = require('playwright'); console.log('불러오는 중'); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); console.log('모듈 됨');
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 380, height: 560 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const posted = [];
  let saved = true; await p.route('**/*', (rt) => { const u = rt.request().url(); if (u.endsWith('/alps')) return rt.fulfill({ body: A.pageHtml(), contentType: 'text/html' });
    if (u.includes('/alps/status')) return rt.fulfill({ body: JSON.stringify({ ok: true, ver: '0.2.4', cfg: {}, cred: saved ? { saved: true, at: '2026-11-03 15:00', idMask: 'ab****' } : { saved: false }, key: null, remote: {}, run: null }), contentType: 'application/json' });
    if (u.includes('/alps/config') || u.includes('/alps/cred')) { posted.push([u.split('/').pop(), rt.request().postData()]); return rt.fulfill({ body: '{"ok":true}', contentType: 'application/json' }); }
    if (u.includes('/printers')) return rt.fulfill({ body: '{"printers":[]}', contentType: 'application/json' }); return rt.abort(); });
  await p.goto('http://127.0.0.1:8898/alps'); await p.waitForTimeout(800);
  const r = await p.evaluate(() => ({ ok: getComputedStyle(document.getElementById('cok')).display !== 'none', form: getComputedStyle(document.getElementById('cfm')).display !== 'none', id: document.getElementById('cid').textContent }));
  await p.evaluate(() => document.querySelectorAll('details.card').forEach((d) => (d.open = true))); await p.click('#cch'); await p.waitForTimeout(300); const r2 = await p.evaluate(() => getComputedStyle(document.getElementById('cfm')).display !== 'none');
  await p.click('#cx'); await p.waitForTimeout(300); const r3 = await p.evaluate(() => getComputedStyle(document.getElementById('cok')).display !== 'none');
  await p.waitForTimeout(2300); const win = posted.find((x) => x[0] === 'config' && /win/.test(x[1]));
  let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
  ok(r.ok && !r.form && /ab\*/.test(r.id), "저장돼 있으면 칸 대신 '✓ 저장됨 · 아이디 ab****'"); ok(r2, "「바꾸기」를 누르면 칸이 열림"); ok(r3, "「그대로 두기」로 다시 닫힘"); ok(!!win, '창 위치를 도우미에 저장: ' + (win && win[1])); ok(!errs.length, '페이지 오류 없음 ' + errs.join('|'));
  const wd = require('path').join(require('os').tmpdir(), 'rnalpst'); process.env.RN_ALPS_HOME = wd; console.log(bad ? '❌ 실패' : '✓ ALPS 설정 화면 통과'); await br.close(); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ ' + e.message); process.exit(1); });
