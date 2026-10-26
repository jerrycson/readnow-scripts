// 🔬 클라우드 pxExpRun — 개수 제한 없음 · 회차 시간이 다 되면 한 것까지 적고 '대기'로 · 다음 회차가 이어 함(한 것은 건너뜀)
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../cloud/index.js', 'utf8'); const a = src.indexOf('async function pxExpRun('); const b = src.indexOf('\n    if (J.retain', a) > 0 ? src.indexOf("log('🔬 조회수 실험', v.op || 'add', JSON.stringify(res).slice(0, 300)); }", a) : -1; const code = src.slice(a, b + "log('🔬 조회수 실험', v.op || 'add', JSON.stringify(res).slice(0, 300)); }".length);
const store = { px_exp: {} }; let clock = 0; const notes = {};
const C = (n) => ({ doc: (id) => ({ get: async () => ({ data: () => (n === 'app_settings' ? { cloudUrl: 'https://cloud.test' } : store[n] && store[n][id]) }), set: async (o) => { store[n] = store[n] || {}; store[n][id] = { ...(store[n][id] || {}), ...o }; } }) });
const peRead = async (p, lid) => { clock += 3000; return { ok: true, uid: lid, noteHtml: notes[lid] || '<p>글 ' + lid + '</p>' }; };
const peFormSubmit = async (lid, w) => { clock += 2000; notes[lid] = w.noteHtml; return {}; };
const curPage = () => ({ evaluate: async () => ({ http: 200, kept: true }) });
const FV = { arrayUnion: (x) => x, serverTimestamp: () => 'ts' };
const mk = new Function('C', 'peRead', 'peFormSubmit', 'curPage', 'FV', 'sleep', 'nowIso', 'log', 'W', 'login', 'peTxt', 'Date', code + '\nreturn pxExpRun;');
const FakeDate = { now: () => clock }; const peTxt = (h) => String(h || '').replace(/<[^>]+>/g, '');
const run = mk(C, peRead, peFormSubmit, curPage, FV, async (ms) => { clock += ms; }, () => new Date(1e12 + clock).toISOString(), () => {}, () => ({}), async () => {}, peTxt, FakeDate);
(async () => { const R = {}; const ids = Array.from({ length: 23 }, (_, i) => String(404935100 + i)); let cmd = { type: 'pxExp', op: 'add', listingIds: ids, status: 'running' };
  const ref = { set: async (o) => { const res = { ...(cmd.results || {}), ...(o.results || {}) }; cmd = { ...cmd, ...o, results: res }; } };
  clock = 0; await run(null, ref, cmd, 60e3); R.r1 = { st: cmd.status, done: cmd.prog && cmd.prog.done, total: cmd.prog && cmd.prog.total, claim: cmd.claim };
  let rounds = 1; while (cmd.status === 'queued' && rounds < 20) { rounds++; clock = 0; await run(null, ref, { ...cmd }, 60e3); }
  const tagged = ids.filter((k) => (notes[k] || '').includes('/px/' + k + '.gif')).length; const twice = ids.filter((k) => ((notes[k] || '').match(/\/px\//g) || []).length > 1).length;
  R.end = { st: cmd.status, rounds, done: cmd.prog.done, n: Object.keys(cmd.results).length, tagged, twice, on: ids.filter((k) => store.px_exp[k] && store.px_exp[k].on).length };
  // 시간 제한 없이(예전 PC 등) 부르면 한 번에 다 함 — 10개 제한 없음
  const ids2 = Array.from({ length: 15 }, (_, i) => String(404936100 + i)); let c2 = { type: 'pxExp', op: 'add', listingIds: ids2 }; const ref2 = { set: async (o) => { c2 = { ...c2, ...o }; } }; clock = 0; await run(null, ref2, c2); R.nolimit = { st: c2.status, n: Object.keys(c2.results).length };
  console.log(JSON.stringify(R));
  const ok = R.r1.st === 'queued' && R.r1.done > 0 && R.r1.done < 23 && R.r1.total === 23 && R.r1.claim === null && R.end.st === 'done' && R.end.rounds > 2 && R.end.done === 23 && R.end.n === 23 && R.end.tagged === 23 && R.end.twice === 0 && R.end.on === 23 && R.nolimit.st === 'done' && R.nolimit.n === 15;
  console.log(ok ? '✓ t94d 통과' : '❌ t94d 실패'); })();
