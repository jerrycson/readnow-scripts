const fs = require('fs'); let HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8');
HEAD = HEAD.replace("if (/xlsx.*\\.js/.test(u))", "if (u.includes('jszip.min.js')) return rt.fulfill({ body: fs.readFileSync(SP + '/node_modules/jszip/dist/jszip.min.js'), contentType: 'text/javascript' }); if (/xlsx.*\\.js/.test(u))");
const SP = require('path').resolve(__dirname, '..'); const MODE = process.argv[3] || 'dir'; eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  p.on('console', (m) => { if (/DBG/.test(m.text())) console.log(m.text().slice(0,400)); }); await p.goto('http://t.test/app/'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async (MODE) => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {};
    try { window.confirm = () => true; localStorage.removeItem('rn-fbx-run');
      const DATA = { crm_orders: 12345, sellers: 30, empty_col: 0 }; let reads = 0, failOnce = 1;
      const mkQ = (name, isG) => { const ids = Array.from({ length: isG ? 700 : DATA[name] || 0 }, (_, i) => (isG ? 'p/x' + i + '/' + name + '/' : '') + 'd' + String(i).padStart(6, '0')); const q = { lim: 500, aft: null, orderBy() { return q2(); } }; const q2 = () => { const o = { lim: 500, aft: null, limit(n) { o.lim = n; return o; }, startAfter(v) { o.aft = v; return o; }, get: async () => { reads++; if (name === 'sellers' && failOnce) { failOnce = 0; throw Object.assign(new Error('unavailable'), { code: 'unavailable' }); } await wait(2); const st = o.aft ? ids.findIndex((x) => x > o.aft) : 0; const sl = st < 0 ? [] : ids.slice(st, st + o.lim); const docs = sl.map((id) => ({ id: id.split('/').pop(), ref: { path: isG ? id : name + '/' + id }, data: () => ({ v: id, t: { toDate: () => new Date(0) } }) })); return { empty: !docs.length, size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } }; return o; }; return q; };
      db.collection = (n) => mkQ(n, false); db.collectionGroup = (n) => mkQ(n, true);
      window.fbDataCols = () => ['crm_orders', 'empty_col', 'sellers']; S.fbInv = { ok: true, at: 'x', cols: [{ id: 'crm_orders', n: 12345, estBytes: 1e6 }, { id: 'sellers', n: 30 }], subs: [{ id: 'log', n: 700 }] }; window.fbInventory = async () => S.fbInv;
      const FS = {}; const mkDir = (path) => ({ name: path, getDirectoryHandle: async (n) => mkDir(path + '/' + n), getFileHandle: async (n) => ({ createWritable: async () => { let t = ''; return { write: async (x) => { t += x; }, close: async () => { FS[path + '/' + n] = t; } }; } }), queryPermission: async () => 'granted', requestPermission: async () => 'granted' });
      window.showDirectoryPicker = async () => mkDir('ROOT'); let HH = null; window.fbxHandle = async (set) => { if (set === undefined) return HH; HH = set; return true; };
      const DL = []; const oc = document.createElement.bind(document); document.createElement = (t) => { const e = oc(t); if (t === 'a') e.click = () => DL.push(e.download); return e; };
      const sh = document.querySelector('#sheet'); sh.classList.add('on'); sh.innerHTML = '<div class="card"><div id="fbx_box">' + fbxHtml() + '</div></div>'; fbxBind(document.getElementById('fbx_box')); await wait(300);
      OUT.modeUi = document.querySelector('#fbx_run').innerText.replace(/\\s+/g, ' ').slice(0, 200);
      if (MODE === 'zip') document.querySelector('input[name=fbx_mode][value=zip]').checked = true;
      console.log('DBG start'); setInterval(() => console.log('DBG t', JSON.stringify({ L: !!S.fbxLive, i: S.fbxLive && S.fbxLive.R.i, msg: S.fbxLive && S.fbxLive.msg, busy: S.fbxLive && S.fbxLive.busy, out: (document.getElementById('fb_export_out')||{}).textContent, ask: !!document.querySelector('.askbox') })), 2000); const P = exportAllFirebase(document.getElementById('fb_export'), document.getElementById('fb_export_out'));
      for (let k = 0; k < 50 && !(S.fbxLive && S.fbxLive.busy); k++) await wait(50);
      for (let k = 0; k < 200 && !((S.fbxLive.R.done.crm_orders || {}).chunks >= 1); k++) await wait(20);
      fbxRunDraw(); OUT.pauseBtn = !!document.getElementById('fbx_pause'); document.getElementById('fbx_pause').click(); await P; await wait(100);
      const R1 = fbxLoadRun(); OUT.paused = JSON.stringify({ i: R1.i, n: R1.done.crm_orders.n, chunks: R1.done.crm_orders.chunks, last: R1.done.crm_orders.last, part: R1.part }); OUT.ui1 = document.querySelector('#fbx_run').innerText.replace(/\\s+/g, ' ').slice(0, 400);
      S.fbxLive = null; /* 다시 열었다고 치고 */ document.querySelector('#fbx_box').innerHTML = fbxHtml(); fbxBind(document.getElementById('fbx_box'));
      setInterval(() => console.log('DBG', JSON.stringify({ i: S.fbxLive && S.fbxLive.R.i, msg: S.fbxLive && S.fbxLive.msg, d: S.fbxLive && S.fbxLive.R.done, busy: S.fbxLive && S.fbxLive.busy })), 2000); await fbxRun(fbxLoadRun()); await wait(200);
      const R2 = fbxLoadRun(); OUT.fin = !!R2.finAt; OUT.done = JSON.stringify(Object.fromEntries(Object.entries(R2.done).map(([k, v]) => [k, [v.n, v.chunks, v.err || '']]))); OUT.reads = reads; OUT.msg = R2.msg;
      if (MODE === 'dir') { OUT.files = Object.keys(FS).sort().join(','); let all = 0; for (const [k, v] of Object.entries(FS)) if (/crm_orders/.test(k)) all += v.split('\\n').length; OUT.crmLines = all; const ids = new Set(); for (const [k, v] of Object.entries(FS)) if (/crm_orders/.test(k)) v.split('\\n').forEach((l) => ids.add(JSON.parse(l)._id)); OUT.crmUniq = ids.size; OUT.sum = (FS['ROOT/' + R2.id + '/_summary.json'] || '').slice(0, 200); }
      else OUT.dl = DL.join(',');
      OUT.ui2 = document.querySelector('#fbx_run').innerText.replace(/\\s+/g, ' ').slice(0, 300);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); }, MODE);
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/bk.png' }); await br.close(); })();`);
