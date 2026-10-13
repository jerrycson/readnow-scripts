const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { ${SETUP}
      S.fsOk = true; S.fsPing = "x"; const hang = { where() { return hang; }, orderBy() { return hang; }, limit() { return hang; }, startAfter() { return hang; }, get: () => new Promise(() => {}), onSnapshot: () => () => {} };
      const oc = db.collection; db.collection = (n) => (n === 'zz_test' ? hang : oc(n));
      let body = null; window.fetch = async (u, o) => { body = o && o.body; return { ok: true, status: 200, json: async () => [{ document: { name: 'projects/p/databases/(default)/documents/zz_test/A1', fields: { title: { stringValue: '책' }, price: { integerValue: '9000' }, uploadedAt: { timestampValue: '2026-10-11T09:00:00.123456Z' }, at: { timestampValue: '2026-10-10T00:00:00Z' } } } }, { readTime: 'x' }] }; };
      await idbPut('meta', [{ k: 'zz_sync', last: 1000, done: true, at: 1 }]);
      const M = new Map(); const t0 = Date.now(); await syncColl('zz_test', 'plist', M, 'zz_sync'); OUT.ms = Date.now() - t0; OUT.got = JSON.stringify([...M.values()]); OUT.q = body; OUT.meta = JSON.stringify(await idbGet('meta', 'zz_sync'));
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);
