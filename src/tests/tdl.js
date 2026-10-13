const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (rt) => rt.fulfill({ body: '<html><body>x</body></html>', contentType: 'text/html' })); await p.goto('http://t.test/');
  p.on('download', (d) => console.log('name', d.suggestedFilename()));
  await p.evaluate(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([new Uint8Array(10)], { type: 'application/vnd.ms-excel' })); a.download = 'test_3.xls'; document.body.appendChild(a); a.click(); });
  await p.waitForTimeout(1500); await br.close(); })();
