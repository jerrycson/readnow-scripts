// 🧾 취소 근거로 저절로 끝냄(클라우드 cxEvidTick · rel11 11/12) — 가짜 Firestore · node src/tests/tCXEVID1112.js
//  ① '확인 못 함'(unknown) 취소 + 주문 기록에 맡긴 책 모두 품절취소 → done · result.state evidenceDone · 근거·전 상태 hist에 남김
//  ② 근거 일부만·취소 아님(cancelled 고객 취소·normal)·제목 없음·다른 상태(done·fail·running)·다른 종류 → 그대로 ③ 5분 막이 ④ 웹앱 글·부분 취소로 안 셈
const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '..', '..'); const src = fs.readFileSync(ROOT + '/cloud/index.js', 'utf8'); const app = fs.readFileSync(ROOT + '/src/app.html', 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const i = src.indexOf('const cxNz = '), j = src.indexOf('/* 맡긴 일 살피기 (1분마다'); if (i < 0 || j < i) { console.log('❌ cxEvidTick 못 찾음'); process.exit(1); }
const store = {}; const docOf = (col, id) => ({ id, async get() { const v = store[col + '/' + id]; return { id, exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, async set(v, o) { store[col + '/' + id] = o && o.merge ? { ...(store[col + '/' + id] || {}), ...v } : v; } });
const C = (col) => ({ doc: (id) => docOf(col, id), where: (k, op, val) => ({ limit: () => ({ async get() { const docs = Object.keys(store).filter((x) => x.startsWith(col + '/') && store[x][k] === val).map((x) => { const id = x.slice(col.length + 1); return { id, data: () => JSON.parse(JSON.stringify(store[x])) }; }); return { docs }; } }) }) });
const db = { async runTransaction(fn) { const w = []; const tx = { get: (r) => r.get(), set: (r, v, o) => w.push([r, v, o]) }; await fn(tx); for (const [r, v, o] of w) await r.set(v, o); } };
const FV = { serverTimestamp: () => 'TS' }; const logs = []; const log = (...a) => logs.push(a.join(' '));
const K = new Function('C', 'db', 'FV', 'nowIso', 'log', src.slice(i, j) + '\nreturn { cxEvidTick, cxEvidHits };')(C, db, FV, () => new Date().toISOString(), log);
const cmd = (ono, o) => { store['shp_cmds/cx_' + ono] = { type: 'cancelOrder', status: 'unknown', orderNo: ono, stage: 'deliv', reason: 2, titles: ['가짜 책 하나 (개정판)'], items: ['L1'], msg: '결과 확인 못 함', result: { state: 'unknown', sent: ['L1'] }, hist: [{ what: '처음' }], ...o }; };
const ord = (ono, items) => { store['crm_orders/aladin_' + ono] = { orderNo: ono, items, updatedAt: '2026-11-12T05:00:00Z' }; };
(async () => {
  console.log('① 근거 있음 → 저절로 완료');
  cmd('T001'); ord('T001', [{ title: '가짜 책 하나', lineStatus: 'cancelledInOrder' }, { title: '다른 책', lineStatus: 'normal' }]);
  cmd('T002', { titles: ['가짜 책 둘', '가짜 책 셋'], items: ['L2', 'L3'] }); ord('T002', [{ title: '가짜 책 둘', lineStatus: 'cancelledInOrder' }, { title: '가짜 책 셋', lineStatus: 'cancelledInOrder' }]);
  console.log('② 근거 없음·다른 것 → 그대로');
  cmd('T003', { titles: ['가짜 책 둘', '가짜 책 셋'] }); ord('T003', [{ title: '가짜 책 둘', lineStatus: 'cancelledInOrder' }, { title: '가짜 책 셋', lineStatus: 'normal' }]);
  cmd('T004'); ord('T004', [{ title: '가짜 책 하나', lineStatus: 'cancelled' }]);
  cmd('T005', { titles: [] }); ord('T005', [{ title: '가짜 책 하나', lineStatus: 'cancelledInOrder' }]);
  cmd('T006', { status: 'fail' }); ord('T006', [{ title: '가짜 책 하나', lineStatus: 'cancelledInOrder' }]);
  cmd('T007', { type: 'startDelivery' }); ord('T007', [{ title: '가짜 책 하나', lineStatus: 'cancelledInOrder' }]);
  cmd('T008'); /* 주문 기록 없음 */
  cmd('T009'); ord('T009', [{ title: '전혀 다른 제목', lineStatus: 'cancelledInOrder' }]);
  const r = await K.cxEvidTick(true); const A = store['shp_cmds/cx_T001'], B = store['shp_cmds/cx_T002'];
  ok(A.status === 'done' && A.result.state === 'evidenceDone' && A.doneAt && A.result.sent[0] === 'L1', 'T001 done · evidenceDone · 전 결과 칸 그대로 ' + JSON.stringify(A.result).slice(0, 160));
  ok(A.result.evid.prevStatus === 'unknown' && A.result.evid.prevState === 'unknown' && A.result.evid.lines[0].lineStatus === 'cancelledInOrder' && A.result.evid.src === 'crm_orders' && A.result.evid.orderReadAt, '근거·전 상태 남김');
  ok(A.hist.length === 2 && A.hist[0].what === '처음' && A.hist[1].status === 'unknown' && /근거/.test(A.hist[1].what), 'hist에 전 모습 덧붙임(지우지 않음)');
  ok(B.status === 'done' && B.result.evid.lines.length === 2, 'T002 두 권 모두 근거 → done');
  for (const [id, st] of [['T003', 'unknown'], ['T004', 'unknown'], ['T005', 'unknown'], ['T006', 'fail'], ['T007', 'unknown'], ['T008', 'unknown'], ['T009', 'unknown']]) ok(store['shp_cmds/cx_' + id].status === st && !store['shp_cmds/cx_' + id].result.evid, `${id} 그대로(${st})`);
  ok(r.done.length === 2 && r.done.includes('cx_T001') && r.done.includes('cx_T002'), '결과 done 2개 ' + JSON.stringify(r));
  console.log('③ 5분 막이 · 다시 돌려도 같음');
  ok((await K.cxEvidTick()) === null, '5분 안엔 안 돎'); const r2 = await K.cxEvidTick(true); ok(r2.done.length === 0 && store['shp_cmds/cx_T001'].hist.length === 2, '이미 끝난 것은 다시 안 씀');
  console.log('④ 웹앱·부르는 곳');
  ok(/r\.state === 'evidenceDone'\) \{ const E = r\.evid/.test(app) && /취소 완료\(저절로\)/.test(app), '웹앱 취소 창 글 ✅ 취소 완료(저절로)');
  ok(/r\.state === 'manualDone' \|\| r\.state === 'evidenceDone'\) return false/.test(app), '부분 취소 완료로 안 셈');
  ok(/await cxEvidTick\(\)/.test(src), '클라우드 회차(맡긴 일 살피기 뒤)에서 부름');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
