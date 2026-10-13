const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8'); const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const OUT = {}; try { ${SETUP}
    S.sellers.set('sc_111', { id: 'sc_111', sc: '111', reviewCount: '5000', rating: 9.8, outstockRate: 0.1, grade: '파워셀러' }); S.sellers.set('sc_222', { id: 'sc_222', sc: '222', reviewCount: '3', rating: 5, outstockRate: 20 });
    const rows = [{ sc: '111', c: 'unknown' }, { sc: '222', c: 'unknown' }, { sc: '333', c: 'unknown' }, { sc: null, c: 'aladin' }, { sc: '996008', c: 'ours' }];
    OUT.r = JSON.stringify(shipRecolor(rows).map((x) => x.c)); OUT.direct = JSON.stringify(['sc_111', 'sc_222'].map((k) => RNC.classifySellerDoc(S.sellers.get(k), RS).cls));
    } catch (e) { OUT.ERR = e.message; } return JSON.stringify(OUT); }); console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)))); await br.close(); })();`);
