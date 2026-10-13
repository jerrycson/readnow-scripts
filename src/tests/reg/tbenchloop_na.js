const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const src = fs.readFileSync('/home/claude/w/readnow-collector.user.js', 'utf8'); const code = src.slice(src.indexOf('  const kDayB = '), src.indexOf('  async function runChain('));
const U = '/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/'; const f = fs.readdirSync(U).find((x) => x.startsWith('73ceffa4')); let html = fs.readFileSync(U + f, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/Page_Set\('370'\)/g, "Page_Set('3')");
(async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (r) => r.abort());
  const res = await p.evaluate(async ({ code, html }) => { const store = {}; const col = (n) => (store[n] = store[n] || {}); const LOG = [];
    const ref = (c, id) => ({ get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { const NA = (x, inArr) => Array.isArray(x) ? (inArr ? (() => { throw new Error("Nested arrays are not supported") })() : x.forEach((y) => NA(y, true))) : (x && typeof x === "object" ? Object.values(x).forEach((y) => NA(y, false)) : 0); NA(v, false); col(c)[id] = o && o.merge ? { ...(col(c)[id] || {}), ...v } : v; }, delete: async () => { delete col(c)[id]; }, collection: (n) => ({ doc: (i2) => ref(c + '/' + id + '/' + n, i2) }) });
    const C = (n) => ({ doc: (id) => ref(n, id) }); const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; } };
    const firebase = { firestore: { FieldValue: { arrayUnion: (...a) => ({ AU: a }), delete: () => undefined } } }; const W = () => ({}); const nowIso = () => new Date().toISOString(); const log = (m) => LOG.push(m); const PC_NAME = 'PC'; const ui = () => {}; let stopFlag = false; const FORCE_ALL = false; const SET = {};
    const JOBS = {}; const saveProgress = async (n, prog) => { col('prd_jobs')[n] = JSON.parse(JSON.stringify(prog)); }; const loadProgress = async (n) => { const d = col('prd_jobs')[n]; return d && !d.done ? JSON.parse(JSON.stringify(d)) : null; }; const finishJob = async (n) => { col('prd_jobs')[n] = { done: true }; };
    const acquireLane = async () => ({ ok: true }); const releaseLane = async () => {}; const lockMsg = () => '';
    const base = new DOMParser().parseFromString(html, 'text/html'); const ids = [...base.querySelectorAll('input[name^="chkCart.U"]')].length;
    let calls = 0; let failAt = 3; const getDoc = async (url) => { calls++; const pg = +url.match(/page=(\d+)/)[1]; if (pg === failAt) { failAt = -1; stopFlag = true; } if (pg > 3) { const d = new DOMParser().parseFromString('<html><body>없음</body></html>', 'text/html'); return { doc: d, html: '' }; }
      const h = html.replace(/ItemId=(\d+)/g, (m, n) => 'ItemId=' + (pg * 1000000 + (+n % 1000000))).replace(/chkCart\.U/g, 'chkCart.U' + pg); return { doc: new DOMParser().parseFromString(h, 'text/html'), html: h }; };
    eval(code + '; window.__b = { benchOne };');
    const t = { sc: '579718', name: '철학' }; let err = null; try { await window.__b.benchOne(t); } catch (e) { err = e.message; }
    const mid = { err, prog: col('prd_jobs')['bench_579718'], blocks: Object.keys(col('prd_jobs/bench_579718/bk')).length };
    stopFlag = false; await window.__b.benchOne(t);
    return { perPage: ids, calls, mid: { err: mid.err, page: mid.prog && mid.prog.page, blocks: mid.blocks, hasItems: !!(mid.prog && mid.prog.items) }, state: col('bench_state')['579718'], day: Object.values(col('bench_days')).map((d) => [d.total, d.base, d.lowNow]), bk: Object.keys(col('prd_jobs/bench_579718/bk')).length, items: Object.keys(col('bench_items')).length, log: LOG.slice(-6) };
  }, { code, html });
  console.log(JSON.stringify(res, null, 1)); await br.close(); })();
