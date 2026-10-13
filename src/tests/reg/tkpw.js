const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); const MOB = process.argv[3] === 'mob';
eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  ${MOB ? "await p.setViewportSize({ width: 400, height: 860 });" : ''}
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try {
    ${SETUP}
    { const dc = db.collection; db.collection = (n) => { const c = dc(n); const w = c.where; const Q = () => { const q = w(); q.where = () => Q(); q.orderBy = () => Q(); q.limit = () => Q(); q.startAfter = () => Q(); q.limitToLast = () => Q(); return q; }; c.where = () => Q(); c.orderBy = () => Q(); c.limit = () => Q(); return c; }; }
    const st = window.__store; st.mkt_kpipa = {}; const t0 = Date.parse('2025-06-01T00:00:00Z');
    for (let i = 0; i < 495; i++) { const d = new Date(t0 + i * 864e5).toISOString().slice(0, 10); const w = new Date(d + 'T00:00:00Z').getUTCDay(); const f = (1 + 0.15 * Math.sin(i / 58)) * (w === 1 ? 1.25 : w === 0 ? 0.6 : 1) * (1 + i / 4000);
      st.mkt_kpipa[d.replace(/-/g, '')] = { date: d, onOff: { series: { '오프라인(대형서점)': { qty: Math.round(90000 * f), titles: 30000, amt: Math.round(1.6e9 * f) }, '오프라인(지역서점)': { qty: Math.round(11000 * f), titles: 6000, amt: Math.round(1.8e8 * f) }, '온라인': { qty: Math.round(150000 * f * (1 + i / 3000)), titles: 50000, amt: Math.round(2.7e9 * f) } } }, bookType: { series: { '종이책': { qty: 1, titles: 1, amt: 1 } } } }; }
    st.app_settings = st.app_settings || {}; st.app_settings.kpipa = { days: 730, status: { lastRunAt: new Date().toISOString(), by: 'JS-MAIN', wrote: 495, changed: 0, days: 495 } };
    for (let i = 0; i < 480; i++) { const d = new Date(t0 + i * 864e5 + 3 * 864e5).toISOString().slice(0, 10); S.orders.set('o' + i, { id: 'o' + i, kind: 'sale', orderedAt: d + 'T10:00:00', items: [{ title: 't', price: 6000, qty: 1 + (i % 3), lineStatus: 'normal' }] }); }
    S.ordersLoaded = true; bump('o');
    S.tab = 'biz'; renderMain(); await wait(1500); const sec = document.querySelector('[data-sec="bz_kpipa"]'); OUT.card = sec ? (sec.open + " " + getComputedStyle(sec).display + " " + (sec.closest("[hidden],[style*=none]") ? "hidden-anc" : "") + " " + sec.textContent).replace(/\\s+/g, " ").slice(0, 400) : "none " + document.querySelector("#main").innerText.slice(0, 300) + [...document.querySelectorAll("[data-sec]")].map((x) => x.dataset.sec).join(",");
    openKpipa(); await wait(1500); OUT.det = document.querySelector('#sheet').innerText.replace(/\\s+/g, ' ').slice(0, 1500);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/kp_${MOB ? 'm' : 'pc'}.png', fullPage: false }); 
  await p.evaluate(() => { document.querySelector('#sheet').scrollTop = 600; }); await p.screenshot({ path: SP + '/reg/kp2_${MOB ? 'm' : 'pc'}.png' }); await br.close(); })();`);
