const { chromium, devices } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const FILE = process.argv[2]; const src = fs.readFileSync(__dirname + '/tboot.js', 'utf8');
// reuse route setup by eval-ing parts is messy; do minimal copy
const SP = __dirname + '/../'; const FB = SP + 'fb/package/'; const R = SP + 'repo/'; const FAKE = fs.readFileSync(__dirname + '/fakefs.js', 'utf8');
const AUTH = src.match(/const AUTH = (`[\s\S]*?`);\n/)[1]; const AUTHS = eval(AUTH.replace('${FAKE}', '').replace(/^`|`$/g, '"').replace(/"/g, '`')).replace(';;return r', ';' + FAKE + ';return r');
const mkOrders = eval('(' + src.match(/const mkOrders = (\(n\) => \{[\s\S]*?return L; \});/)[1] + ')');
(async () => { const br = await chromium.launch(); const ctx = await br.newContext({ ...devices['Pixel 5'] }); const p = await ctx.newPage();
  await p.route('**/*', (rt) => { const u = rt.request().url();
    if (u.startsWith('https://www.gstatic.com/firebasejs/')) { const f = FB + u.split('/').pop(); let body = fs.readFileSync(f, 'utf8'); if (/storage-compat/.test(u)) body += AUTHS; return rt.fulfill({ body, contentType: 'text/javascript' }); }
    if (u.startsWith('http://t.test/app/sw.js')) return rt.fulfill({ status: 404, body: '' });
    if (u.startsWith('http://t.test/app/')) return rt.fulfill({ body: fs.readFileSync(FILE), contentType: 'text/html' });
    if (u.startsWith('http://t.test/')) { const f = R + u.replace('http://t.test/', '').split('?')[0]; return fs.existsSync(f) ? rt.fulfill({ body: fs.readFileSync(f), contentType: 'text/javascript' }) : rt.fulfill({ status: 404, body: '' }); }
    return rt.abort(); });
  await p.addInitScript(({ orders }) => { window.__LAT = 50; window.__SEED = { 'shp_state/confirm': { orders, at: new Date().toISOString(), sig: 's1', pc: 'cloud' }, 'shp_state/current': { orders: [], sig: 'c1' }, shp_cmds: [] }; }, { orders: mkOrders(+(process.env.NORD || 25)) });
  await p.goto('http://t.test/app/?go=confirm'); await p.waitForTimeout(5000);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const ms = await p.evaluate(async () => { const t = []; for (let i = 0; i < 5; i++) { const a = performance.now(); await openShip(); t.push(Math.round(performance.now() - a)); } return t; });
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map((n) => [n.id, n])); profile.samples.forEach((id, i) => { const n = byId.get(id); const k = n.callFrame.functionName + ' ' + (n.callFrame.url.split('/').pop() || '') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
  console.log('openShip ms x5 (no throttle):', ms); console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v / 1000).toFixed(1)}ms ${k}`).join('\n')); await br.close(); })();
