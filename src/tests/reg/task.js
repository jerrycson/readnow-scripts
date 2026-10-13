const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(5000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      const b = document.createElement('button'); b.textContent = '모두 발송준비시작 (3건)'; b.className = 'btn'; b.style.cssText = 'position:fixed;top:200px;left:300px'; document.body.appendChild(b);
      b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); const pr = ask('주문확인요청 3건을 모두 발송준비시작 할까요?'); await wait(200); const box = document.querySelector('.askbox'); OUT.box = box ? box.innerText.replace(/\\s+/g, ' ') : 'NONE'; const r1 = box.getBoundingClientRect(); OUT.pos = Math.round(r1.top) + ',' + Math.round(r1.left); OUT.anc = b.classList.contains('ask-anc');
      box.querySelector('.ask-ok').click(); OUT.v1 = await pr; await wait(250); OUT.gone = !document.querySelector('.askbox');
      const p2 = ask('x'); await wait(100); document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); OUT.v2 = await p2;
      const p3 = ask('y', { keep: true }); await wait(100); document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(100); OUT.keepOpen = !!document.querySelector('.askbox'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); OUT.v3 = await p3;
      window.confirm = () => true; OUT.v4 = await ask('z');
      // deep link attrs
      const g = document.createElement('span'); g.setAttribute('data-gc', 'aladin_1'); g.setAttribute('data-gxt', 'x'); OUT.deep = JSON.stringify(deepAttrs(g));
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack; }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await p.screenshot({ path: SP + '/reg/ask.png' }); await br.close(); })();`);
