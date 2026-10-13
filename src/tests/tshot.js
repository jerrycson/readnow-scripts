// 나눈 수집기(본체 + 모듈)를 Tampermonkey처럼 이어 붙여 가짜 알라딘 화면에서 띄움: 시작 오류 없음 · 관제판·두 패널·모듈 확인
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const OUT = '/home/claude/w/out/'; const R = __dirname + '/repo/'; const FB = __dirname + '/fb/package/';
const PATCH = (fs.readFileSync(__dirname + '/tone.js', 'utf8').match(/body \+= `([^`]*)`/) || [])[1];
const main = fs.readFileSync(OUT + process.argv[2] || 'readnow-collector.user.js', 'utf8');
const reqs = [...main.matchAll(/\/\/ @require\s+(\S+)/g)].map((m) => m[1]);
const load = (u) => { const f = u.split('?')[0].split('/').pop(); if (/gstatic/.test(u)) { let b = fs.readFileSync(FB + f, 'utf8'); if (/storage-compat/.test(f)) b += PATCH; return b; } if (/xlsx/.test(u)) return 'window.XLSX={};'; if (fs.existsSync(OUT + f)) return fs.readFileSync(OUT + f, 'utf8'); if (fs.existsSync(R + f)) return fs.readFileSync(R + f, 'utf8'); throw new Error('없음 ' + f); };
const shim = `window.GM_info = { script: { version: '${(main.match(/@version\s+(\S+)/) || [])[1]}' } }; const _k = (k) => 'gm:' + k;
window.GM_getValue = (k, d) => { const v = localStorage.getItem(_k(k)); return v == null ? d : JSON.parse(v); }; window.GM_setValue = (k, v) => localStorage.setItem(_k(k), JSON.stringify(v)); window.GM_deleteValue = (k) => localStorage.removeItem(_k(k));
window.GM_listValues = () => Object.keys(localStorage).filter((x) => x.startsWith('gm:')).map((x) => x.slice(3)); window.GM_addValueChangeListener = (key, fn) => addEventListener('storage', (e) => { if (e.key === _k(key)) fn(key, e.oldValue && JSON.parse(e.oldValue), e.newValue && JSON.parse(e.newValue), true); });
window.GM_xmlhttpRequest = () => {}; window.GM_notification = () => {}; window.GM_openInTab = () => ({ close() {} }); localStorage.setItem('gm:rnu-pcname', JSON.stringify('TEST-PC'));`;
const code = reqs.map(load).join('\n;\n') + '\n;\n' + main;
(async () => { const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1300, height: 950 } }); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Firestore|firestore|net::|Failed to load/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
  await p.route('**/*', (rt) => { const u = rt.request().url(); if (/aladin\.co\.kr\/scm\/worder_preparatory_complete/.test(u)) return rt.fulfill({ contentType: 'text/html; charset=utf-8', body: '<html><head><title>샵매니저</title></head><body><a href="/wC2Cuser_logout.aspx">로그아웃</a><div style="height:1500px">가짜 판매관리</div></body></html>' }); return rt.fulfill({ status: 404, body: '' }); });
  await p.goto('https://www.aladin.co.kr/scm/worder_preparatory_complete.aspx'); await p.evaluate(shim);
  await p.addScriptTag({ content: '(function(){' + code + '\n})();' }).catch((e) => errs.push('ADD ' + e.message.slice(0, 200)));
  await p.waitForTimeout(6000);
  const st = await p.evaluate(() => ({ mods: window.__rnMods, ok: window.__rnModsOk, ctl: !!document.querySelector('#rn-ctl'), crmIn: !!document.querySelector('#rn-ctl #rn-crm'), prdIn: !!document.querySelector('#rn-ctl #rnp'), badge: (document.querySelector('#rnCtlBadge') || {}).textContent, aladin: !!window.ReadnowAladin, red: [...document.querySelectorAll('div')].some((d) => /모듈 판이 맞지 않음/.test(d.textContent) && d.style.position === 'fixed'), prdApi: Object.keys(window.__rnPrd || {}).join(','), crmApi: Object.keys(window.__rnCrm || {}).length }));
  console.log(JSON.stringify(st, null, 1)); for (const t of ['ov','crm','prd']) { await p.click('#rn-uni [data-t="'+t+'"]'); await p.waitForTimeout(1200); await p.screenshot({ path: __dirname + '/v142_'+t+'.png', clip: { x: 860, y: 0, width: 440, height: 950 } }); console.log(t, (await p.evaluate(() => document.querySelector('#rn-ctl').innerText.replace(/\s+/g,' ').slice(0,1500)))); }
  console.log('ERR', errs.slice(0, 8)); await br.close(); })();
