const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      let n = 0; const o = window.renderMainNow; let mut = 0; const mo = new MutationObserver((L) => { mut += L.length; }); mo.observe(document.body, { childList: true, subtree: true, attributes: true });
      const cnt = async (lab) => { n = 0; mut = 0; const t = performance.now(); let busy = 0; const iv = setInterval(() => {}, 100); await wait(6000); OUT[lab] = { mut, sh: document.querySelectorAll('*').length }; };
      S.tab = 'home'; renderTabs(); renderMain(); await wait(2000); await cnt('home');
      S.tab = 'biz'; renderTabs(); renderMain(); await wait(3000); await cnt('biz');
      const m = document.querySelector('#main'); const tgt = m.querySelector('#bench_hub'); OUT.hub = !!tgt;
      /* which nodes change */ const ch = {}; const mo2 = new MutationObserver((L) => L.forEach((x) => { const k = (x.target.className || x.target.tagName || '') + '|' + x.type + '|' + (x.attributeName || ''); ch[k] = (ch[k] || 0) + 1; })); mo2.observe(document.body, { childList: true, subtree: true, attributes: true }); await wait(4000); mo2.disconnect(); OUT.top = Object.entries(ch).sort((a, b) => b[1] - a[1]).slice(0, 12);
    } catch (e) { OUT.ERR = e.message; }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); await br.close(); })();`);
