// tY24ALL1117 — (11/17 y24all1 · 정범님 「예스24에서 팔리면 알라딘도 맞춤」) 예스24 주문 줄 자체코드가 비어도 장부가 실물에 이음
//   까닭: 11/17 대조 — 살아 있는 예스24 상품 90개 모두 자체코드가 비어 있음 → 예스24 주문 줄(sku 없음)이 실물 줄에 안 이어져
//         예스24에서 팔려도 🤖 자동 내림이 알라딘 판매중지·수량 줄이기를 만들지 않았음(omni_auto 기록 예스24 → 알라딘 0건)
//   ① 자체코드 없는 예스24 주문 + 장부가 이은 예스24 상품(ISBN+등급 하나 · 🔗 사람 짝) → 알라딘 할 일(1권 = 판매중지 · 3권 = 수량 2) · 자동 내림이 고름
//   ② 같은 ISBN 알라딘 상품이 여럿(짝 못 정함) · 짝 없는 예스24 상품 · 예스24 목록에 없는 번호 → 잇지 않음(사람 손 · 엉뚱한 상품을 내리지 않음)
//   ③ 자체코드 = SKU 주문은 예전 그대로 · 사람이 이미 알라딘을 줄였으면 다시 줄이지 않음(같은 일 두 번 0) · 취소 주문은 셈에서 빠짐
//   ④ ☁ 클라우드 대신 길(PC가 다 꺼졌을 때) — 자체코드 없는 예스24 줄도 🔗 사람 짝이 꼭 하나면 그 한 권짜리 알라딘 판매중지 · 짝 없음·여럿은 넘긴 까닭만 남김 · 두 번 0
// 실행: node tY24ALL1117.js (순수 셈만 · 시험 자료에 손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, omniPick, Y24_ORD_HOW };')();
const NOW = '2026-11-17T12:00:00Z'; const FROM = '2026-11-11T00:00:00Z';
const AL = [
  { id: 'aladin_A1', title: '한 권 책', isbn: '9788900001001', grade: '상', price: 8000, qty: 1, live: true, st: '판매중', skus: ['PNKa1'] },
  { id: 'aladin_A3', title: '세 권 책', isbn: '9788900001003', grade: '중', price: 5000, qty: 3, live: true, st: '판매중', skus: ['PNKa3a', 'PNKa3b', 'PNKa3c'] },
  { id: 'aladin_M1', title: '두 곳 책', isbn: '9788900001005', grade: '상', price: 6000, qty: 1, live: true, st: '판매중', skus: ['PNKm1'] },
  { id: 'aladin_M2', title: '두 곳 책', isbn: '9788900001005', grade: '상', price: 6100, qty: 1, live: true, st: '판매중', skus: ['PNKm2'] },
  { id: 'aladin_S1', title: '자체코드 책', isbn: '9788900001007', grade: '상', price: 7000, qty: 1, live: true, st: '판매중', skus: ['PNKs1'] }];
const Y = [
  { no: '7001', title: '한 권 책', isbn: '9788900001001', grade: '상', price: 8500, stock: 1, live: true, self: '', alIds: ['aladin_A1'], man: false, flags: [] },
  { no: '7003', title: '세 권 책', isbn: '9788900001003', grade: '중', price: 5500, stock: 3, live: true, self: '', alIds: ['aladin_A3'], man: true, flags: [] },
  { no: '7005', title: '두 곳 책', isbn: '9788900001005', grade: '상', price: 6500, stock: 1, live: true, self: '', alIds: ['aladin_M1', 'aladin_M2'], man: false, flags: [] },
  { no: '7006', title: '짝 없는 책', isbn: '9788900001006', grade: '상', price: 4000, stock: 1, live: true, self: '', alIds: [], man: false, flags: [] },
  { no: '7007', title: '자체코드 책', isbn: '9788900001007', grade: '상', price: 7500, stock: 1, live: true, self: 'PNKs1', alIds: [], man: false, flags: [] }];
const yo = (no, gno, sku, at, o) => ({ ch: 'yes24', no, at: at || '2026-11-17T03:00:00Z', amt: 5000, lines: [{ lid: null, sku: sku || null, gno, qty: 1, amt: 5000 }], ...(o || {}) });
const run = (ord, al) => { const V = F.ledBuild({ now: NOW, days: 30, al: al || AL, y24: Y, ord, chs: undefined }); return { V, TD: F.ledTodo(V) }; };
const alAct = (TD, key) => { const t = TD.find((x) => x.key === key); return t && t.acts.find((a) => a.ch === 'aladin'); };
console.log('① 자체코드 없는 예스24 주문 → 알라딘 할 일');
{ const { TD } = run([yo('y1', '7001'), yo('y3', '7003')]);
  const a1 = alAct(TD, 'PNKa1'); ok(a1 && a1.k === 'down' && a1.to === 0 && a1.id === 'aladin_A1', 'ISBN+등급으로 이은 예스24 상품(하나)에서 1권 팔림 → 알라딘 판매중지(0)', a1);
  const a3 = alAct(TD, 'PNKa3a'); ok(a3 && a3.k === 'qty' && a3.to === 2 && a3.id === 'aladin_A3', '🔗 사람 짝 · 실물 3권 중 1권 팔림 → 알라딘 수량 2(F38 — 0이 될 때만 판매중지)', a3);
  const P = F.omniPick(TD, { from: FROM }); const pa = P.filter((p) => p.a.ch === 'aladin').map((p) => p.a.id).sort(); ok(JSON.stringify(pa) === '["aladin_A1","aladin_A3"]', '🤖 자동 내림이 두 알라딘 할 일을 고름(켠 뒤 주문)', pa);
  const P2 = F.omniPick(TD, { from: FROM, done: new Set(P.map((p) => p.rk)) }); ok(!P2.some((p) => p.a.ch === 'aladin'), '같은 할 일 열쇠는 한 번만(다시 안 고름)', P2.map((p) => p.rk));
  ok(!F.omniPick(TD, { from: '2026-11-17T05:00:00Z' }).some((p) => p.a.ch === 'aladin'), '켜기 전 주문은 밀린 일 — 미리보기 없이 바로 안 고름(예전 규칙 그대로)'); }
console.log('② 못 정하면 잇지 않음');
{ const { TD } = run([yo('y5', '7005'), yo('y6', '7006'), yo('y9', '7999')]);
  ok(!TD.some((t) => t.acts.some((a) => a.ch === 'aladin')), '같은 ISBN 알라딘 상품 둘(여럿) · 짝 없음 · 목록에 없는 번호 → 알라딘 할 일 없음(사람 손)', TD.map((t) => [t.key, t.acts]));
  ok(F.Y24_ORD_HOW.join(',') === 'self,man,pick', '믿는 짝 = 자체코드·사람 짝·하나뿐인 ISBN+등급'); }
console.log('③ 예전 길·두 번 막기·취소');
{ const { TD } = run([yo('ys', '', 'PNKs1')]); const a = alAct(TD, 'PNKs1'); ok(a && a.k === 'down' && a.id === 'aladin_S1', '자체코드 = SKU 주문은 예전 그대로 이어짐', a);
  const { TD: T2 } = run([yo('yx', '7007', 'PNKLUX')]); const b = alAct(T2, 'PNKs1'); ok(b && b.k === 'down', '자체코드가 실물 SKU가 아닌 값(PNKLUX)이어도 상품 번호로 이음', b);
  const al2 = AL.map((l) => (l.id === 'aladin_A3' ? { ...l, qty: 2 } : l)); const { TD: T3 } = run([yo('y3', '7003')], al2); ok(!alAct(T3, 'PNKa3a'), '사람이 이미 알라딘을 2권으로 줄였으면 할 일 없음(두 번 줄이지 않음)', T3.map((t) => [t.key, t.acts]));
  const { TD: T4 } = run([yo('y1', '7001', null, null, { cancel: true })]); ok(!alAct(T4, 'PNKa1'), '취소 주문은 셈에서 빠짐'); }
console.log('④ ☁ 클라우드 대신 길 — 자체코드 없는 예스24 줄');
const CL = fs.readFileSync([path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', 'cloud', 'index.js')].find((x) => fs.existsSync(x)), 'utf8');
(async () => { const a = CL.indexOf('/* ══ (11/11 omni2 · 통합 솔루션) 🤖 자동 내림 — 웹앱 열린 PC가'), b = CL.indexOf('async function stratTick(force) {'); ok(a > 0 && b > a, '클라우드 덩어리 찾음');
  const D = new Map(); const cpj = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const put = (cur, v) => { for (const [k, x] of Object.entries(v)) { if (x && x.__fv === 'ts') cur[k] = new Date().toISOString(); else if (x && x.__fv === 'au') cur[k] = [...(Array.isArray(cur[k]) ? cur[k] : []), ...x.v]; else if (x && typeof x === 'object' && !Array.isArray(x) && cur[k] && typeof cur[k] === 'object' && !Array.isArray(cur[k])) put(cur[k], x); else cur[k] = cpj(x); } return cur; };
  let auto = 0; const ref = (c, id) => ({ id, get: async () => { const d = D.get(c + '/' + id); return { exists: !!d, id, data: () => cpj(d), ref: ref(c, id) }; }, set: async (v, o) => { const cur = D.get(c + '/' + id); D.set(c + '/' + id, put(o && o.merge && cur ? cur : {}, v)); } });
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + ++auto), where: (f, op, v) => ({ get: async () => { const docs = [...D.entries()].filter(([k]) => k.split('/')[0] === c).map(([k, d]) => ({ id: k.split('/')[1], data: () => cpj(d), ref: ref(c, k.split('/')[1]) })).filter((d) => { const x = d.data()[f]; return op === '>=' ? String(x || '') >= v : x === v; }); return { docs, forEach: (fn) => docs.forEach(fn) }; } }) });
  const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }) }; const FV = { serverTimestamp: () => ({ __fv: 'ts' }), arrayUnion: (...v) => ({ __fv: 'au', v }) };
  const G = new Function('C', 'db', 'FV', 'nowIso', 'VER', 'log', CL.slice(a, b) + '\nreturn { omniCloudTick, OMNI_C };')(C, db, FV, () => new Date().toISOString(), 'test', () => {});
  const T0 = Date.now(); const iso = (m) => new Date(T0 + m * 60e3).toISOString(); const set = (k, v) => D.set(k, cpj(v)); const cmds = () => [...D.entries()].filter(([k]) => k.startsWith('shp_cmds/')).map(([, v]) => v);
  set('app_settings/sku_seq', { mapN: 0 }); set('app_settings/sku_map_0', { m: {} });
  for (const id of ['aladin_M', 'aladin_N', 'aladin_Q']) set('prd_listings/' + id, { status: '판매중', active: true, qty: 1, listingId: id.slice(-1), title: '시험 책 ' + id.slice(-1) });
  set('app_settings/y24_link', { m: { 8001: { al: ['aladin_M'] }, 8002: { al: ['aladin_N', 'aladin_Q'] } } });
  set('app_settings/platforms', { omni: { autoDown: { on: 1, from: iso(-60) } } }); set('app_settings/omni_auto', { hb: {} });
  set('crm_y24_orders/Z1', { orderNo: 'Z1', lastSeenAt: iso(-1), orderedAt: iso(-10), items: [{ self: '', goodsNo: 8001, qty: 1, title: '짝 하나' }] });
  set('crm_y24_orders/Z2', { orderNo: 'Z2', lastSeenAt: iso(-1), orderedAt: iso(-9), items: [{ goodsNo: '8002', qty: 1, title: '짝 둘' }] });
  set('crm_y24_orders/Z3', { orderNo: 'Z3', lastSeenAt: iso(-1), orderedAt: iso(-8), items: [{ goodsNo: '8003', qty: 1, title: '짝 없음' }] });
  const r1 = await G.omniCloudTick(); const L = cmds(); const cx = Object.values((D.get('app_settings/omni_auto') || {}).c || {}); const n1 = (D.get('app_settings/omni_auto') || {}).cloud || {};
  ok(r1 && r1.n === 1 && L.length === 1 && L[0].listingKey === 'aladin_M' && L[0].ch.state === '판매중지' && cx.length === 1 && cx[0].st === 'sent' && cx[0].from === 'yes24', 'PC 없음 → 자체코드 없는 예스24 주문의 🔗 사람 짝(하나) 알라딘 판매중지 1건', { r1, L: L.map((c) => c.listingKey), cx });
  ok(r1.skip === 2 && (n1.ex || []).some((x) => x.no === 'Z2' && /2개/.test(x.why)) && (n1.ex || []).some((x) => x.no === 'Z3' && /사람 짝 없음/.test(x.why)), '짝 여럿·짝 없음은 안 건드리고 넘긴 까닭만(웹앱 🙋 카드)', n1.ex);
  G.OMNI_C.at = 0; const r2 = await G.omniCloudTick(); ok(cmds().length === 1 && !(r2 && r2.n > 0), '다시 돌아도 되풀이 0(이미 판매중지 맡김)', r2);
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(CL.slice(a, b)) && !/buyer|rcv|phone|addr/.test(CL.slice(a, b)), '클라우드 덩어리 — 브라우저 창·손님 정보 칸 없음');
})().catch((e) => ok(false, '클라우드 시험 오류', e.stack)).then(() => { console.log(bad ? `❌ tY24ALL1117 ${bad}개 실패` : '✓ tY24ALL1117 통과'); process.exit(bad ? 1 : 0); });
