// 클라우드 shipAutoTick 모의 실행 — 가짜 Firestore로 판단·맡김·중복 방지·결과 따라가기·알림을 확인
const fs = require('fs'); const vm = require('vm'); const src = fs.readFileSync(require('path').join(__dirname, '../cloud/index.js'), 'utf8');
const a = src.indexOf('/* ══════════ 🤖 (정범님 10/26) 자동 발송요청'); const b = src.indexOf('async function shipNotifyTick(p) {'); const code = src.slice(a, b);
const store = {}; const col = (n) => (store[n] = store[n] || {});
const snap = (n, id) => ({ id, exists: id in col(n), data: () => (id in col(n) ? JSON.parse(JSON.stringify(col(n)[id])) : undefined), ref: ref(n, id) });
const merge = (o, v) => { const r = { ...(o || {}) }; for (const k in v) r[k] = v[k] && v[k].__ts ? new Date().toISOString() : v[k]; return r; };
function ref(n, id) { return { id, get: async () => snap(n, id), set: async (v, o) => { col(n)[id] = o && o.merge ? merge(col(n)[id], v) : merge({}, v); } }; }
function q(n, fs0) { return { where: (f, op, v) => q(n, [...fs0, [f, op, v]]), limit: () => q(n, fs0), get: async () => { const docs = Object.keys(col(n)).filter((id) => fs0.every(([f, op, v]) => { const x = col(n)[id][f]; return op === 'in' ? v.includes(x) : op === 'array-contains' ? (x || []).includes(v) : x === v; })).map((id) => snap(n, id)); return { docs, size: docs.length, forEach: (cb) => docs.forEach(cb), empty: !docs.length }; } }; }
const C = (n) => ({ doc: (id) => ref(n, id), where: (f, op, v) => q(n, [[f, op, v]]) });
const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => { r.set(v, o); } }) };
const pushes = []; const SH = require('../readnow-shipping-core.js'); const ML = require('../readnow-ml-core.js');
const ctx = { C, db, FV: { serverTimestamp: () => ({ __ts: 1 }) }, W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), log: () => {}, VER: 'test', wonT: (n) => Math.round(+n || 0).toLocaleString('ko-KR') + '원', pushSend: async (names, p, kind) => { pushes.push({ kind, ...p }); return { me: 'ok' }; }, shipCoreNode: () => SH, mlMod: async () => ML, lastConfirm: [], kickFlag: false, console, Date, JSON, Math, Map, Set, String, Number, Promise, Object };
vm.createContext(ctx); vm.runInContext(code + '\n;globalThis.T = shipAutoTick; globalThis.M = autoMem; globalThis.setTrack = (v) => { autoTrackAt = v; }; globalThis.setLC = (L) => { lastConfirm = L; };', ctx);
let bad = 0; const ok = (c, m) => { console.log(c ? '  ✓' : '  ❌', m); if (!c) bad++; };
const row = (c, g, p) => ({ c, g, p, s: 0, so: 0 }); const E = (rows) => ({ mkt: { at: 'x', rows, isbnOk: true }, via: 'ours' });
const J = { cmds: true, confirm: true };
(async () => {
  const nowK = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
  const o1 = { orderNo: 'O1', buyer: '갑', orderedAt: nowK, items: [{ listingId: '1', title: '좋은 책', price: 9000, qty: 1, grade: '상' }] };
  const o2 = { orderNo: 'O2', buyer: '을', orderedAt: nowK, items: [{ listingId: '2', title: '너무 싼 책', price: 5000, qty: 1, grade: '상' }] };
  const o3 = { orderNo: 'O3', buyer: '병', orderedAt: nowK, items: [{ listingId: '3', title: '시장 없음', price: 7000, qty: 1, grade: '상' }] };
  const o4 = { orderNo: 'O4', buyer: '정', orderedAt: nowK, recipient: { name: '블랙이', sameAsBuyer: false }, items: [{ listingId: '4', title: '고객 책', price: 7000, qty: 1, grade: '상' }] };
  const o5 = { orderNo: 'O5', buyer: '무', orderedAt: '2020-01-01 10:00', items: [{ listingId: '5', title: '옛 주문', price: 7000, qty: 1, grade: '상' }] };
  const o6 = { orderNo: 'O6', buyer: '기', orderedAt: nowK, items: [{ listingId: '6', title: '사람이 누름', price: 7000, qty: 1, grade: '상' }] };
  col('crm_customers').c1 = { names: ['블랙이'], flags: { blacklist: { on: true, reason: '테스트' } } };
  col('shp_cmds').h6 = { type: 'startDelivery', orderNos: ['O6'], status: 'queued' };
  ctx.setLC([o1, o2, o3, o4, o5, o6]); const cr = { enrich: { 1: E([row('green', '상', 9500)]), 2: E([row('dkgreen', '상', 10000)]), 4: E([row('green', '상', 7100)]), 5: E([]), 6: E([]) } };
  let r = await ctx.T(cr, J);
  const A = col('shp_auto');
  ok(A.O1 && A.O1.state === 'sent' && col('shp_cmds').auto_O1 && col('shp_cmds').auto_O1.status === 'queued' && col('shp_cmds').auto_O1.orderNos[0] === 'O1', 'O1 통과 → shp_cmds/auto_O1 맡김');
  ok(ctx.kickFlag === true, '맡긴 뒤 kickFlag (바로 처리)');
  ok(A.O2 && A.O2.state === 'review' && /50% 쌈/.test(A.O2.reasons[0]) && !col('shp_cmds').auto_O2, 'O2 50% 쌈 → 검토 · 맡기지 않음: ' + (A.O2 && A.O2.reasons[0]));
  ok(A.O3 && A.O3.state === 'wait', 'O3 시장 없음 → 기다림 기록');
  ok(A.O4 && A.O4.state === 'review' && /수령인 블랙이: ⛔/.test(A.O4.reasons.join()), 'O4 수령인 블랙리스트 → 검토');
  ok(A.O5 && A.O5.state === 'skip', 'O5 켜기 전 주문 → skip');
  ok(A.O6 && A.O6.state === 'human' && !col('shp_cmds').auto_O6, 'O6 사람이 이미 맡김 → 손대지 않음');
  ok(pushes.filter((x) => x.title.startsWith('🔎')).length === 2 && pushes.every((x) => /총 /.test(x.title)) && pushes.some((x) => /「너무 싼 책」 5,000원/.test(x.body)), '검토 알림 2건(총액·대표 상품)');
  ok(col('app_settings').ship_auto && col('app_settings').ship_auto.since, '처음 켜짐 → since 기록');
  // 다시 돌려도 두 번 맡기지 않음 · 알림 다시 안 보냄 (기억을 지워도)
  ctx.M.clear(); const n0 = pushes.length; ctx.setTrack(Date.now()); r = await ctx.T(cr, J); ok(pushes.length === n0, '두 번째 회차: 알림 없음(기억을 지워도)');
  col('shp_auto').O1.state = 'sent'; // 그대로
  // 결과 따라가기: auto_O1 done
  col('shp_cmds').auto_O1 = { ...col('shp_cmds').auto_O1, status: 'done', results: { O1: { state: 'done', at: new Date().toISOString(), proof: 'inDelivery' } } };
  ctx.setTrack(0); await new Promise((r) => setTimeout(r, 5)); r = await ctx.T(cr, J);
  ok(A.O1.state === 'done' && pushes.some((x) => x.kind === 'autodone' && /총 9,000원/.test(x.title) && /「좋은 책」 9,000원/.test(x.body)), 'auto_O1 끝남 → done · ✅ 완료 알림(총액·대표 상품)');
  // 시장 기다림 끝 → 검토
  ctx.M.get('O3').firstAt = Date.now() - 11 * 60e3; r = await ctx.T(cr, J); ok(A.O3.state === 'review' && /10분 기다려도/.test(A.O3.reasons[0]), 'O3 10분 지나 → 검토(시장 자료 없음)');
  // 실패 따라가기
  const o7 = { orderNo: 'O7', buyer: '경', orderedAt: nowK, items: [{ listingId: '7', title: '실패 책', price: 7000, qty: 1, grade: '상' }] }; ctx.setLC([o7]); cr.enrich[7] = E([]); await ctx.T(cr, J); ok(A.O7.state === 'sent', 'O7 맡김');
  col('shp_cmds').auto_O7 = { ...col('shp_cmds').auto_O7, status: 'done', results: { O7: { state: 'fail', msg: '이미 처리' } } }; ctx.setTrack(0); await ctx.T(cr, J); ok(A.O7.state === 'fail' && pushes.some((x) => x.kind === 'autorev' && /실패/.test(x.body)), 'O7 알라딘 실패 → fail · 검토 알림');
  console.log(bad ? `❌ tA3 실패 ${bad}` : '✓ tA3 통과');
})().catch((e) => { console.log('❌ 오류', e.stack); });
