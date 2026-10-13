const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..');
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const cdp = await p.context().newCDPSession(p);
  await p.evaluate(async () => { ${SETUP}
    { const dc = db.collection; db.collection = (n) => { const c = dc(n); const w = c.where; const Q = () => { const q = w(); q.where = () => Q(); q.orderBy = () => Q(); q.limit = () => Q(); q.startAfter = () => Q(); q.limitToLast = () => Q(); return q; }; c.where = () => Q(); c.orderBy = () => Q(); c.limit = () => Q(); return c; }; }
    const N_O = 30000, N_P = 20000, N_C = 15000; const t0 = Date.parse('2024-10-01T00:00:00Z'); const G = ['최상', '상', '중'];
    for (let i = 0; i < N_P; i++) { const isbn = '978' + String(1000000000 + i).slice(0, 10); S.plist.set('aladin_U' + i, { id: 'aladin_U' + i, usedCode: 'U' + i, listingId: 'L' + i, isbn13: isbn, title: '책 제목 ' + i + ' 부제', price: 3000 + (i % 50) * 500, grade: G[i % 3], active: i % 4 !== 0, status: i % 4 ? '판매중' : '판매완료', registeredAt: new Date(t0 + (i % 700) * 864e5).toISOString().slice(0, 10), qty: 1, sku: 'S' + (i % 7) }); }
    for (let i = 0; i < N_C; i++) S.customers.set('aladin_C' + i, { customerId: 'aladin_C' + i, displayName: '고객' + i });
    for (let i = 0; i < N_O; i++) { const d = new Date(t0 + (i / N_O) * 740 * 864e5).toISOString(); const k = i % 4; S.orders.set('aladin_O' + i, { id: 'aladin_O' + i, orderNo: 'O' + i, kind: 'sale', orderedAt: d.slice(0, 19), customerId: 'aladin_C' + (i % N_C), shippingFee: 2500, items: Array.from({ length: 1 + (i % 3) }, (_, j) => ({ title: '책 제목 ' + ((i * 3 + j) % N_P), listingId: 'L' + ((i * 3 + j) % N_P), aladinUsedCode: 'U' + ((i * 3 + j) % N_P), price: 5000 + j * 1000, qty: 1, lineStatus: k === 3 && j === 0 ? 'cancel' : 'normal' })) }); }
    S.ordersLoaded = true; S.prodLoaded = true; S.custLoaded = true; bump('o'); bump('p'); bump('c'); });
  console.log('무거운 함수 ms', await p.evaluate(async () => { const o = {}; for (const f of ['overlayAll', 'bizCalc', 'prodDash', 'purStatsNow', 'bookStatsNow']) { if (typeof window[f] !== 'function') { o[f] = '없음'; continue; } bump('o'); const a = performance.now(); try { window[f](); } catch (e) { o[f] = 'ERR ' + e.message.slice(0, 60); continue; } o[f] = Math.round(performance.now() - a); } return JSON.stringify(o); }));
  const tabs = ['home', 'search', 'products', 'sellers', 'orders', 'purchase', 'biz'];
  const res = {};
  for (const t of tabs) { const ms = await p.evaluate(async (t) => { const a = performance.now(); S.tab = t; S.detail = null; try { renderTabs(); renderMainNow(); afterRender(); } catch (e) { return 'ERR ' + e.message; } const b = performance.now(); await new Promise((r) => setTimeout(r, 50)); return Math.round(b - a); }, t); 
    const ms2 = await p.evaluate(async (t) => { const a = performance.now(); renderMainNow(); afterRender(); const js = performance.now() - a; void document.body.offsetHeight; return Math.round(js) + "+" + Math.round(performance.now() - a - js) + " dom" + document.querySelectorAll('#main *').length + " html" + Math.round(document.querySelector('#main').innerHTML.length / 1024) + "KB"; }, t); res[t] = [ms, ms2]; }
  console.log('렌더 ms [처음, 다시]', JSON.stringify(res));
  const prof = process.argv[3]; if (prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    await p.evaluate(() => { for (const l of S.plist.values()) prGroupOf(l); }); await p.evaluate(async (t) => { bump("o"); bump("p"); S.tab = t; renderMainNow(); afterRender(); }, prof); const { profile } = await cdp.send('Profiler.stop');
    const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map(); profile.samples.forEach((s, i) => cnt.set(s, (cnt.get(s) || 0) + (dt[i] || 0)));
    for (const [id, us] of cnt) { const n = byId.get(id); const k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + us); }
    console.log('자기 시간 상위', [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + Math.round(v / 1000) + 'ms').join('\\n')); }
  console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await br.close(); })();`);
