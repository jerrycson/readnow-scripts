const fs = require('fs'); const { chromium } = require('playwright');
const src = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8');
const a = src.indexOf("  const pvStat = "); const b = src.indexOf("  /* ───────── 검색 시세: 알라딘 미등록"); const code = src.slice(a, b);
const body = fs.readFileSync(__dirname + '/pvj_body.js', 'utf8').replace("const f = new Function(...Object.keys(env), code + '; return previewsJob;')", "const f = new Function(...Object.keys(env), CODE + '; return previewsJob;')");
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.goto('http://localhost:8765/readnow-products-core.js'); await p.addScriptTag({ url: 'http://localhost:8765/readnow-products-core.js' });
  const r = await p.evaluate(({ CODE, body }) => new Function('CODE', body)(CODE), { CODE: code, body });
  console.log(JSON.stringify(r[0]), r[1].join(' ')); console.log(r[2] ? '✓ 수집기 미리보기 일 통과' : '❌ 실패', JSON.stringify(r[3])); await br.close(); })();
