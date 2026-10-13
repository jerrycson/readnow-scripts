const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8'); const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const OUT = {}; try { ${SETUP}
    const P = [5000, 7000, 8000, 8000, 9000, 12000].map((p, i) => ({ r: i + 1, n: '판매자' + i, sc: String(100 + i), g: i % 2 ? '상' : '중', p, s: 2500, lid: 'L' + i, c: 'green' }));
    const txt = (h) => { const d = document.createElement('div'); d.innerHTML = h; return [...d.querySelectorAll('.pblk')].map((b) => (b.classList.contains('ghost') ? '👻' : b.classList.contains('me') ? 'ME' : '') + b.querySelector('.pp').textContent).join(' | '); };
    OUT.a = txt(prBlocks({ page1: P, me: { g: '상', p: 8000 }, ghost: { g: '상', p: 8000, lid: 'X' } }));
    OUT.b = txt(prBlocks({ page1: P, me: { g: '상', p: 20000 }, ghost: { g: '상', p: 20000, lid: 'X' } }));
    OUT.c = txt(prBlocks({ page1: P, me: { g: '상', p: 7000 }, ghost: { g: '상', p: 7000, lid: 'L1' } }));
    const sh = document.querySelector('#sheet'); sh.classList.add('on'); sh.innerHTML = '<div class="card" style="width:380px">' + prBlocks({ page1: P, me: { g: '상', p: 8000 }, ghost: { g: '상', p: 8000, lid: 'X' } }) + '</div>'; document.querySelectorAll('.verbar').forEach((x) => x.remove());
    } catch (e) { OUT.ERR = e.message; } return JSON.stringify(OUT, null, 1); }); console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)))); await p.screenshot({ path: SP + '/reg/ghost.png', clip: { x: 0, y: 0, width: 420, height: 260 } }); await br.close(); })();`);
