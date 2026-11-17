// tshard — 수동 일괄 그룹 문서 쪼개 담기(조각 ~s) · 옮기기 · 다시 읽기 · 저장 · 칸 모으기 · 지우기
//  (11/17 bkfold1) 옛 틀(파일 인자·/home/claude 길)에서는 문지기로 돌 수 없어 harness 꼴로 옮김 · 확인값은 같음
//  + 📁 묶음 실시간 받기(_bkfold)가 없는 가짜 db에서도 그룹 줄 셈이 멈추지 않는지
// 실행: pw/ 안(harness.js 옆) RN_PORT=<포트> node tshard.js · 시험 자료에 손님 정보 없음
let bad = 0; let fin = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.waitForTimeout(2000);
  const OUT = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); await wait(1500); const OUT = {}; const store = {}; const FV = firebase.firestore.FieldValue;
    const isDel = (v) => v && ((v._delegate && v._delegate._methodName === 'FieldValue.delete') || v.__del === 1);
    const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (isDel(x)) delete o[k]; else if (x && typeof x === 'object' && !Array.isArray(x) && !x._delegate && o[k] && typeof o[k] === 'object') o[k] = merge(o[k], x); else if (x && x._delegate) o[k] = 'TS'; else o[k] = x; } return o; };
    const snap = (pairs) => { const docs = pairs.map(([id, v]) => ({ id, data: () => v, ref: { delete: async () => { delete store[id]; } } })); return { docs, forEach: (f) => docs.forEach(f), size: docs.length }; };
    db.collection = (name) => ({ get: async () => snap(name === 'prd_price_batches' ? Object.entries(store) : []), doc: (id) => ({ id, get: async () => (name === 'prd_price_batches' ? { exists: !!store[id], id, data: () => store[id] } : { exists: true, data: () => ({ watchVer: '0.6.0' }) }), set: async (v) => { if (name === 'prd_price_batches') store[id] = merge(store[id], v); }, delete: async () => { delete store[id]; } }),
      where: (f, op, v) => ({ get: async () => snap(name === 'prd_price_batches' ? Object.entries(store).filter(([, x]) => x[f] === v) : []), onSnapshot: (cb) => { cb({ forEach: () => {} }); return () => {}; } }), add: async () => ({}) });
    db.runTransaction = async (fn) => fn({ get: async () => ({ data: () => ({}) }), set: () => {} });
    const picks = {}; for (let i = 0; i < 100; i++) picks['aladin_P' + i] = { price: 9000, at: '2026-10-07T00:00:00Z', by: 'x' };
    store.gA = { name: 'GA', cond: { name: 'GA' }, picks, decided: { aladin_D1: { price: 1, at: '2026-10-07T00:00:00Z', from: 2 } }, start: { P1: 10000 } };
    S.prBatches = undefined; batchSlots(); await wait(300); const g = S.prBatches.find((x) => x.id === 'gA'); OUT.assembled = [S.prBatches.length, Object.keys(g.picks).length, Object.keys(g.decided).length, g._legacy].join(',');
    await batchMigrate(g); const shards = Object.keys(store).filter((k) => k.includes('~s')); OUT.afterMig = `shards=${shards.length} mainPicks=${Object.keys(store.gA.picks || {}).length} shardPicks=${shards.reduce((a, k) => a + Object.keys(store[k].picks || {}).length, 0)}`;
    const g2 = await batchLoadOne('gA'); OUT.reload = [Object.keys(g2.picks).length, Object.keys(g2.decided).length, g2.start.P1, g2._legacy].join(',');
    await batchSave('gA', { picks: { aladin_P0: FV.delete(), aladin_NEW: { price: 5 } }, lastRunAt: 'now' }); const g3 = await batchLoadOne('gA'); OUT.saved = [Object.keys(g3.picks).length, !!g3.picks.aladin_NEW, !!g3.picks.aladin_P0, store.gA.lastRunAt].join(',');
    S.prBatches = undefined; batchSlots(); await wait(300); OUT.slots = S.prBatches.map((x) => x.id).join(',');
    window.alert = () => {}; await batchDelete([{ id: 'gA', name: 'GA' }]); OUT.afterDel = Object.keys(store).length;
    return OUT; });
  console.log('SH', JSON.stringify(OUT));
  ok(OUT.assembled === '1,100,1,true', '옛 한 문서 그룹 = 칸 하나 · 고른 100 · 결정 1 · 옛 꼴 표시', OUT.assembled);
  ok(/^shards=\d+ mainPicks=0 shardPicks=100$/.test(OUT.afterMig) && +OUT.afterMig.match(/shards=(\d+)/)[1] > 0, '옮기기 = 고른 100개가 조각으로 · 본 문서엔 0', OUT.afterMig);
  ok(OUT.reload === '100,1,10000,false', '다시 읽기 = 100·1·시작가 그대로 · 새 꼴', OUT.reload);
  ok(OUT.saved === '100,true,false,now', '저장 = 하나 지우고 하나 더함 · 본 칸 값 저장', OUT.saved);
  ok(OUT.slots === 'gA', '칸 모으기 = 조각·묶음 문서는 칸이 아님', OUT.slots);
  ok(OUT.afterDel === 0, '지우기 = 조각까지 모두', OUT.afterDel); fin = 1;
}).then(() => { if (!fin) { bad++; console.log('  ❌ 시험이 끝까지 못 감(위 ERRORS)'); } console.log(bad ? `❌ tshard ${bad}개 실패` : '✓ tshard 통과'); process.exitCode = bad ? 1 : 0; });
