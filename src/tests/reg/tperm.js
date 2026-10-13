const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob';
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 390, height: 844 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try {
    ${SETUP}
    localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; localStorage.removeItem('rn-perm-auto');
    const DENY = new Set(['crm_hist']); const st = window.__store; let writes = 0;
    const dc = db.collection; db.collection = (n) => { const c = dc(n); c.limit = () => ({ get: async () => { if (n === 'ext_probe') { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; } return c.get(); } }); const d0 = c.doc; c.doc = (id) => { const r = d0(id); r.__n = n; r.delete = async () => { delete st[n][id]; }; return r; }; return c; };
    const rb = db.batch; db.batch = () => { const ops = []; return { set: (ref, v) => ops.push(['s', ref, v]), delete: (ref) => ops.push(['d', ref]), commit: async () => { if (ops.some((o) => DENY.has(o[1].__n))) { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; } for (const o of ops) { if (o[0] === 's') { await o[1].set(o[2]); writes++; } else await o[1].delete(); } } }; };
    st.rn_status = { perm_JS_SUB: { pc: 'JS-SUB', ver: '1.57.3', at: new Date().toISOString(), bad: ['ext_basic'] } };
    const v = await permAuto(true); OUT.n = v.n; OUT.bad = JSON.stringify(v.bad.map((b) => [b.col, b.read, b.write])); OUT.pcs = JSON.stringify(v.pcs.map((x) => [x.pc, x.bad]));
    OUT.leftover = Object.entries(st).flatMap(([n, docs]) => Object.keys(docs || {}).filter((id) => /_permprobe_/.test(id)).map((id) => n + '/' + id)).length; OUT.writes = writes;
    const A = bizAlerts(bizCalc()); OUT.alert = (A.find((a) => a.key === 'perm') || {}).t || 'NONE';
    const h = await permCheck(); const d = document.createElement('div'); d.innerHTML = h; OUT.chk = d.innerText.replace(/\\s+/g, ' ').slice(0, 500);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 4).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5))); await br.close(); })();`);
