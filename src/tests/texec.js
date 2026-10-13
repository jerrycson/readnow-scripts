// 실행도구의 한 문 시험: 같은 일 두 번(동시·차례) → 한 번만, 실패 뒤 다시 → 됨, 오래된 시작 → 결과 모름, 요약
const X = require('/home/claude/w/readnow-exec-core.js');
const store = new Map(); let lock = Promise.resolve();
const db = { collection: (c) => ({ doc: (id) => ({ path: c + '/' + id, set: async (v, o) => { store.set(c + '/' + id, o && o.merge ? { ...(store.get(c + '/' + id) || {}), ...v } : v); } }) }),
  runTransaction: (fn) => { const run = lock.then(async () => { const w = []; await fn({ get: async (r) => { const v = store.get(r.path); return { exists: !!v, data: () => v }; }, set: (r, v) => w.push([r.path, v]) }); w.forEach(([k, v]) => store.set(k, v)); }); lock = run.catch(() => {}); return run; } };
(async () => { const out = []; let sent = 0; const fire = () => X.run(db, { kind: 'startDelivery', key: 'c1:O1', by: 'pc' }, async () => { sent++; await new Promise((r) => setTimeout(r, 20)); return { status: 'done' }; });
  const r = await Promise.all([fire(), fire()]); out.push(['동시 두 번 → 보낸 횟수', sent, r.map((x) => x.skipped ? 'skip:' + x.state : 'ran').join(',')]);
  const r3 = await fire(); out.push(['끝난 뒤 또', sent, r3.skipped ? r3.state : 'ran']);
  let n2 = 0; const f2 = () => X.run(db, { kind: 'c2bAdd', key: 'c2:U1', by: 'pc' }, async () => { n2++; if (n2 === 1) throw new Error('알라딘 오류'); return { status: 'done' }; });
  try { await f2(); } catch (e) { out.push(['첫 시도 실패', store.get('exec_log/c2bAdd__c2:U1').status]); } const r4 = await f2(); out.push(['실패 뒤 다시', r4.skipped ? 'skip' : 'ran', store.get('exec_log/c2bAdd__c2:U1').tries, (store.get('exec_log/c2bAdd__c2:U1').hist || []).length]);
  store.set('exec_log/price__A@2026', { kind: 'price', status: 'started', startedAt: new Date(Date.now() - 40 * 60000).toISOString(), by: 'JS-MAIN' }); const r5 = await X.begin(db, { kind: 'price', key: 'A@2026', by: 'x' }); out.push(['40분 전 시작만', r5.ok, r5.state]);
  const sm = X.summarize([...store.values()], Date.now()); out.push(['요약', JSON.stringify(sm.by), '결과 모름', sm.unknown.length]);
  out.forEach((x) => console.log(x.join(' | '))); })();
