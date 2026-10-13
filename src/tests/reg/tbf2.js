const fs = require('fs'); const store = {}; const col = (n) => (store[n] = store[n] || {});
const ref = (path) => ({ get: async () => ({ data: () => col(path.c)[path.id] }), set: async (v, o) => { const cur = col(path.c)[path.id] || {}; if (o && o.merge) { const nv = { ...cur }; for (const [k, x] of Object.entries(v)) nv[k] = x && x.AU ? (cur[k] || []).concat(x.AU) : x; col(path.c)[path.id] = nv; } else col(path.c)[path.id] = v; }, collection: (n) => ({ doc: (id) => ref({ c: path.c + '/' + path.id + '/' + n, id }) }) });
const C = (n) => ({ doc: (id) => ref({ c: n, id }) }); const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; } };
const firebase = { firestore: { FieldValue: { arrayUnion: (...a) => ({ AU: a }) } } }; const W = () => ({}); const nowIso = () => new Date().toISOString(); const log = (m) => console.log('LOG', m); const PC_NAME = 'PC';
eval(fs.readFileSync(__dirname + '/bf.js', 'utf8'));
(async () => { const t = { sc: '9', name: 'X' };
  // [id, p, g, ti, isbn, ym, pl, low, page]
  await benchFinish(t, { day: '2026-10-08', page: 3, items: [['a', 1000, '상', 'A', null, null, null, 1, 1], ['b', 2000, '중', 'B', null, null, null, 1, 2], ['d', 3000, '상', 'D', null, null, null, 0, 2]] }, {});
  let st = col('bench_state')['9']; await benchFinish(t, { day: '2026-10-09', page: 3, items: [['a', 1000, '상', 'A', null, null, null, 0, 1], ['d', 2900, '상', 'D', null, null, null, 1, 2], ['c', 5000, '최상', 'C', null, null, null, 1, 3]] }, st);
  const d = col('bench_days')['9_2026-10-09']; console.log(JSON.stringify({ lowNow: d.lowNow, lowOn: d.lowOn, lowOff: d.lowOff, goneLow: d.goneLow, addLow: d.addLow, lowBand: d.lowBand, on: d.lowOnList, off: d.lowOffList, goneList: d.goneList }));
  st = col('bench_state')['9']; await benchFinish(t, { day: '2026-10-10', page: 3, items: [['a', 1000, '상', 'A', null, null, null, 1, 1], ['d', 2900, '상', 'D', null, null, null, 1, 2], ['c', 5000, '최상', 'C', null, null, null, 1, 3]] }, st);
  const I = col('bench_items'); console.log(JSON.stringify({ a: I['9_a'].lowEvents.map((e) => [e.d, e.on, e.gone || false, e.p, e.page]), b: I['9_b'].lowEvents.map((e) => [e.d, e.on, e.gone || false, e.p]), d: I['9_d'].lowEvents.map((e) => [e.d, e.on]), c: I['9_c'].lowEvents.map((e) => [e.d, e.on]), state: col('bench_state')['9'].lowNow }));
})();
