/* tHLPINST — 정범님 11/05 '단추 하나로': 이 PC에 도우미가 없으면 「⬇ 이 PC에 도우미 설치」 → 설치 파일(.cmd) 내려받기(안에 설치 한 줄) → 도우미가 켜지면 저절로 알아봄 */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, JSON.stringify(x || '')); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); let up = false;
  await p.route(/127\.0\.0\.1:8898/, (rt) => { if (!up) return rt.abort(); const u = new URL(rt.request().url()); const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(x) }); if (u.pathname === '/status') return J({ ok: true, ver: '1.1.7' }); if (u.pathname === '/printers') return J({ ok: true, printers: [] }); return J({ ok: false }); });
  await p.evaluate(async () => { const C = LBL(); C.mode = 'pc'; lblSave(C); await lphCheck(true); openLblCfg(); }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!(LBL_OV && LBL_OV.querySelector('[data-hlpinst]'))), '도우미가 없으면 라벨 인쇄 설정에 「⬇ 이 PC에 도우미 설치」');
  const dl = p.waitForEvent('download'); await p.click('[data-hlpinst]'); const d = await dl; const path = await d.path(); const txt = require('fs').readFileSync(path, 'utf8');
  ok(d.suggestedFilename() === 'readnow-helper-setup.cmd' && /install-print\.ps1/.test(txt) && /powershell -NoProfile -ExecutionPolicy Bypass/.test(txt), '누르면 설치 파일 내려받기(안에 설치 한 줄)', { n: d.suggestedFilename(), txt: txt.slice(0, 200) });
  up = true; await p.waitForTimeout(6500); ok(await p.evaluate(() => S.lph.ok === true), '도우미가 켜지면 5초 안에 저절로 알아봄'); }).then(() => { console.log(bad ? `❌ ${bad}개 실패` : '✓ tHLPINST 통과'); process.exit(bad ? 1 : 0); });
