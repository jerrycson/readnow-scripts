// tOMNI1111 — (11/11 omni1 · 통합 솔루션) 🤖 자동 내림 · 🔍 재고 맞추기 · 📋 주문 모음 · 팔린 알라딘 상품이 장부에서 빠지던 것
//   (11/11 omni2 더함) ③ 재고 맞추기 알라딘 쪽(예스24에서 팔렸는데 알라딘 판매중 · 30일 밖 주문도 SKU · 판매 뒤 다시 올린 것은 뺌) · 💓 웹앱 열린 PC 없음 경보(omniAlarm)
//        · 🛍 우리숍 주문 어댑터 자리(LED_ORD_AD — shop1 shop_orders 모양) → 장부·자동 내림 · ☁ 클라우드 대신 자동 내림(cloud/index.js omniCloudTick — 가짜 Firestore)
//        · 화면: 홈 알림 '못 맡김 n건'·'PC 없음' → 누르면 🛠 처리할 일 › 🤖 자동 내림 카드 · 휴대폰 공유 요약에도 · 카드 💓 맥박 줄 · 🔍 알라딘 줄 맡기기 두 번 · 📋 주문 모음 🛍 칩
//   ① 순수 셈: ◆ledger 덩어리만 떼어 돌림 — omniPick(켠 뒤 주문만 · 팔린 판매처는 안 건드림 · 예스24는 하나로 정해질 때(자체코드 = SKU · (11/11 led2b) 자체코드가 비어도 이은 예스24 상품이 꼭 하나면) · 같은 열쇠 한 번 · 상한) · omniRecon(실물 없음·짝 없음·자체코드 없음 · 판매처 합계)
//   ② 화면(harness): 🛠 처리할 일 위 🤖 자동 내림 카드(기본 켬) → 1분 돌기(omniTick) 한 번 = 예스24 주문 → 알라딘 판매중지 맡김 1건 · 다시 돌아도 되풀이 0 · 단계 줄
//        · 알라딘 주문 → 예스24 판매중지를 번외(가짜 127.0.0.1:8797)에 맡김 · 끄면(두 기기 같은 설정) 맡기지 않음 · 켜기 전 주문은 안 맡김 · 로거 PC는 안 돎
//        · 🔍 재고 맞추기 카드 · 실물 없음 줄 🟦 맡기기 두 번 = 번외에 판매중지 1건 · 📋 주문 모음 보기(판매처 칩·상태)
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tOMNI1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, ledY24One, omniPick, omniRk, omniRecon, OMNI_LIM, omniAlarm, OMNI_HB_MIN };')();
console.log('① 순수 셈');
{ const I = { now: '2026-11-11T05:00:00Z', days: 30,
    al: [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U3', title: '책3', price: 3000, qty: 0, live: false, st: '판매완료', skus: ['S3'] }, { id: 'aladin_U4', title: '책4', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S4'] }],
    y24: [{ no: '900', title: '책1', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '903', title: '책3', price: 3000, stock: 1, live: true, self: 'S3', flags: [] }, { no: '904', title: '책4', price: 3000, stock: 1, live: true, self: '', alIds: ['aladin_U4'], flags: [] }],
    ord: [{ ch: 'yes24', no: 'y1', at: '2026-11-11T04:00:00Z', amt: 8500, lines: [{ sku: 'S1', qty: 1 }] }, { ch: 'aladin', no: 'o3', at: '2026-11-11T04:10:00Z', amt: 3000, lines: [{ lid: 'aladin_U3', qty: 1 }] }, { ch: 'aladin', no: 'o4', at: '2026-11-11T04:20:00Z', amt: 3000, lines: [{ lid: 'aladin_U4', qty: 1 }] }] };
  const TD = F.ledTodo(F.ledBuild(I)); const t1 = TD.find((x) => x.key === 'S1'), t3 = TD.find((x) => x.key === 'S3');
  ok(t1 && t1.from.join() === 'yes24' && t3 && t3.from.join() === 'aladin', '처리할 일에 어디서 팔렸는지(from)', TD.map((x) => [x.key, x.from]));
  ok(t3 && t3.acts.some((a) => a.ch === 'yes24' && a.k === 'down' && a.no === '903'), '알라딘에서 팔려 판매완료가 된 상품도 장부에 남아 → 예스24 내릴 일이 생김(예전엔 사라졌음)', t3);
  const P = F.omniPick(TD, { from: '2026-11-11T03:00:00Z' }); const ks = P.map((p) => p.T.key + ':' + p.a.ch).sort();
  ok(JSON.stringify(ks) === JSON.stringify(['S1:aladin', 'S3:yes24', 'S4:yes24']), '고르기: 예스24 주문 → 알라딘 · 알라딘 주문 → 예스24(자체코드 = SKU) · (led2b) 자체코드 없는 예스24도 이은 상품이 꼭 하나면 자동(번호로 찾고 자체코드 채움)', ks);
  { const t4 = TD.find((x) => x.key === 'S4'); const a4 = t4.acts.find((a) => a.ch === 'yes24'); const o4 = F.ledY24One(t4, a4); ok(o4.mode === 'fill' && o4.no === '904' && o4.fill === 'S4' && !o4.self, '(led2b) 자체코드 없는 예스24 904 = 하나로 정해짐 → 번호 904로 맡기고 자체코드 S4 채움', o4); }
  { /* 같은 ISBN 예스24 상품이 둘(905·906)이고 둘 다 알라딘 U5와 이어짐 → 하나로 못 정함 = 자동 안 함 · 사람이 고르면(pk) 그것으로 자동도 됨 · 같은 책 알라딘 여럿과 이은 예스24(multi)도 사람 손 */
    const I2 = { ...I, al: I.al.concat([{ id: 'aladin_U5', title: '책5', isbn: '9788900000005', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S5'] }, { id: 'aladin_U6', title: '책6', isbn: '9788900000006', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S6'] }, { id: 'aladin_U7', title: '책6', isbn: '9788900000006', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S7'] }]),
      y24: I.y24.concat([{ no: '905', title: '책5', isbn: '9788900000005', stock: 1, live: true, self: '', alIds: ['aladin_U5'], flags: [] }, { no: '906', title: '책5', isbn: '9788900000005', stock: 1, live: true, self: '', alIds: ['aladin_U5'], flags: [] }, { no: '907', title: '책6', isbn: '9788900000006', stock: 1, live: true, self: '', alIds: ['aladin_U6', 'aladin_U7'], flags: [] }]),
      ord: I.ord.concat([{ ch: 'aladin', no: 'o5', at: '2026-11-11T04:30:00Z', amt: 3000, lines: [{ lid: 'aladin_U5', qty: 1 }] }, { ch: 'aladin', no: 'o6', at: '2026-11-11T04:31:00Z', amt: 3000, lines: [{ lid: 'aladin_U6', qty: 1 }] }]) };
    const TD2 = F.ledTodo(F.ledBuild(I2)); const t5 = TD2.find((x) => x.key === 'S5'), t6 = TD2.find((x) => x.key === 'S6'); const a5 = t5 && t5.acts.find((a) => a.ch === 'yes24'), a6 = t6 && t6.acts.find((a) => a.ch === 'yes24');
    const o5 = a5 && F.ledY24One(t5, a5), o6 = a6 && F.ledY24One(t6, a6); const k2 = F.omniPick(TD2, { from: '2026-11-11T03:00:00Z' }).map((p) => p.T.key + ':' + p.a.ch);
    ok(o5 && o5.mode === 'pick' && /2개/.test(o5.why) && a5.cands.length === 2 && o6 && o6.mode === 'pick' && /여럿/.test(o6.why) && !k2.includes('S5:yes24') && !k2.includes('S6:yes24'), '같은 ISBN 예스24 상품이 둘 · 알라딘 여럿과 이은 예스24 = 하나로 못 정함 → 자동 안 함(그 줄에서 고르기)', { o5, o6, k2 });
    const o5p = F.ledY24One(t5, a5, { S5: '906' }); const k3 = F.omniPick(TD2, { from: '2026-11-11T03:00:00Z', pk: { S5: '906' } }).find((p) => p.T.key === 'S5' && p.a.ch === 'yes24');
    ok(o5p.mode === 'fill' && o5p.no === '906' && o5p.fill === 'S5' && k3, '사람이 906을 고르면 그 상품으로 정해짐(맡기기·자동 모두)', { o5p, k3: !!k3 });
    const I3 = { ...I2, y24: I2.y24.map((y) => (y.no === '906' ? { ...y, man: true } : y)) }; const TD3 = F.ledTodo(F.ledBuild(I3)); const t5m = TD3.find((x) => x.key === 'S5'); const o5m = F.ledY24One(t5m, t5m.acts.find((a) => a.ch === 'yes24'));
    ok(o5m.mode === 'fill' && o5m.no === '906', '연결 표에서 사람이 고른 짝(man)이 꼭 하나면 그것으로 정함(다른 기기에서도)', o5m); }
  ok(!P.some((p) => p.a.ch === p.T.from[0]), '팔린 판매처 자신은 건드리지 않음');
  ok(F.omniPick(TD, { from: '2026-11-11T04:25:00Z' }).length === 0 && F.omniPick(TD, { from: '' }).length === 0, '켠 시각 앞 주문은 안 고름 · 켠 시각이 없으면 아무것도 안 고름');
  const done = new Set([P[0].rk]); ok(F.omniPick(TD, { from: '2026-11-11T03:00:00Z', done }).length === P.length - 1, '같은 할 일 열쇠는 한 번만');
  ok(F.omniPick(TD, { from: '2026-11-11T03:00:00Z', lim: { aladin: 0 } }).every((p) => p.a.ch !== 'aladin'), '판매처마다 한 번에 맡기는 수 상한');
  const t1b = { ...t1, last: '2026-11-11T06:00:00Z' }; ok(F.omniRk(t1b, t1.acts[0]) !== F.omniRk(t1, t1.acts[0]), '새로 팔리면(주문 시각이 바뀌면) 새 열쇠');
  const R = F.omniRecon({ al: [{ id: 'a', st: '판매중', live: true, skus: ['K1'], qty: 1 }, { id: 'b', st: '판매완료', live: false, skus: ['K2'] }, { id: 'c', st: '판매중지', live: false, skus: ['K5'] }],
    y24: [{ no: '1', self: 'K1', live: true, stock: 1 }, { no: '2', self: 'K2', live: true, stock: 1, title: '나간 책' }, { no: '3', self: 'K9', live: true, stock: 1 }, { no: '4', self: '', live: true, stock: 1 }, { no: '5', self: 'K5', live: true, stock: 1 }, { no: '6', self: 'K2', live: false, stock: 1 }] });
  ok(R.bad.map((b) => b.no + b.kind).join() === '2gone,3nomatch,4noself' && R.bad[0].to === 0, '재고 맞추기: 실물 없음(알라딘 판매완료) · 짝 없음 · 자체코드 없음 — 판매중지(실물은 있음)·예스24 판매 안 함은 어긋남 아님', R.bad);
  ok(R.sum.yes24.live === 5 && R.sum.yes24.phys === 2 && R.sum.aladin.live === 1, '판매처 합계(판매중 줄·실물)', R.sum); }
console.log('③ (omni2) 재고 맞추기 알라딘 쪽 · PC 없음 경보 · 우리숍 어댑터 · 클라우드 대신');
{ const R = F.omniRecon({ al: [{ id: 'a1', live: true, skus: ['K1'], qty: 1, title: '오래전 예스24에서 팔린 책', reg: '2026-09-01T00:00:00Z' }, { id: 'a2', live: true, skus: ['K2', 'K3'], qty: 2, title: '두 권 중 한 권', reg: '2026-10-01T00:00:00Z' }, { id: 'a3', live: true, skus: ['K4'], qty: 1, reg: '2026-11-10T00:00:00Z' }, { id: 'a4', live: true, skus: ['K5'], qty: 1 }, { id: 'a5', live: false, st: '판매완료', skus: ['K6'] }, { id: 'a6', live: true, skus: ['K7'], qty: 1 }],
    y24: [], y24sold: [{ sku: 'K1', at: '2026-10-01T02:00:00Z', no: 'Y1', src: 'ord' }, { sku: 'K2', at: '2026-11-09T00:00:00Z', no: 'Y2', src: 'ord' }, { sku: 'K4', at: '2026-11-05T00:00:00Z', no: 'Y4', src: 'ord' }, { sku: 'K5', at: null, no: '905', src: 'adm' }, { sku: 'K6', at: '2026-11-09T00:00:00Z', src: 'ord' }] });
  const A = R.bad.filter((b) => b.kind === 'alsold'); const g = (id) => A.find((b) => b.id === id);
  ok(g('a1') && g('a1').to === 0 && g('a1').src === 'ord' && /2026-10-01/.test(g('a1').why), '예스24에서 41일 전 팔린 SKU(처리할 일·장부 창 밖) → 알라딘 판매중지 할 일', g('a1'));
  ok(g('a2') && g('a2').to === 1 && g('a2').cur === 2, '두 권 중 한 권 팔림 → 알라딘 수량 1권으로', g('a2'));
  ok(!g('a3') && g('a4') && g('a4').src === 'adm' && !g('a5') && !g('a6'), '팔린 뒤 다시 올린 상품(등록 > 주문)은 뺌 · 주문 기록 없으면 예스24 판매완료 표시로 · 이미 판매중 아님·안 팔린 것은 어긋남 아님', A.map((b) => b.id));
  const R2 = F.omniRecon({ al: [{ id: 'b', st: '판매완료', live: false, skus: ['Q1'] }, { id: 'c', live: true, skus: ['Q2'] }], y24: [{ no: '1', self: 'Q1', live: true, stock: 1 }, { no: '2', self: 'Q9', live: true, stock: 1 }], y24sold: [{ sku: 'Q2', at: '2026-11-01T00:00:00Z', src: 'ord' }] });
  ok(R2.bad.map((b) => b.kind).join() === 'gone,alsold,nomatch', '차례: 실물 없음(예스24) → 예스24 팔림(알라딘) → 짝 없음', R2.bad.map((b) => b.kind)); }
{ const now = '2026-11-11T05:00:00Z'; const ago = (m) => new Date(Date.parse(now) - m * 60e3).toISOString(); const W = (o) => F.omniAlarm({ on: 1, now, ...o });
  const w0 = W({ hb: {} }); ok(w0 && w0.k === 'pc' && w0.lv === 'red' && /기록 없음/.test(w0.t) && /알라딘 쪽도 멈춤/.test(w0.t), '맥박 기록이 없으면 🔴 웹앱 열린 PC 없음(알라딘 쪽도 멈춤)', w0);
  const w1 = W({ hb: { 'PC-A': { at: ago(20), y24: 1 } }, cloud: { at: ago(3) } }); ok(w1 && w1.k === 'pc' && w1.lv === 'amber' && w1.cloudOk && /20분째/.test(w1.t) && /클라우드가 대신/.test(w1.t), '20분째 PC 없음 + 클라우드가 보는 중 → ▲ 노랑(알라딘 쪽은 클라우드)', w1);
  const w2 = W({ hb: { 'PC-A': { at: ago(2), y24: 0 }, 'PC-B': { at: ago(200), y24: 1 } } }); ok(w2 && w2.k === 'y24' && /3시간째/.test(w2.t), '웹앱 PC는 도는데 번외 PC가 없음 → 예스24 쪽 멈춤 경보', w2);
  ok(W({ hb: { 'PC-A': { at: ago(2), y24: 1 } } }) === null && F.omniAlarm({ on: 0, hb: {}, now }) === null && W({ hb: { 'PC-A': { at: ago(F.OMNI_HB_MIN - 1), y24: 1 } } }) === null, '번외 PC가 돌면 경보 없음 · 자동 내림을 끄면 경보 없음 · 기준(분) 안이면 없음'); }
{ /* 🛍 우리숍 — shop1 shopLedOrds와 같은 모양 { ch:'shop', no, at, amt, fee, cancel, lines:[{ lid, sku, qty, amt }] } */ const chs = [{ k: 'aladin', n: '알라딘', on: 1, role: 'master' }, { k: 'yes24', n: '예스24', on: 1 }, { k: 'shop', n: '우리숍', on: 0 }, { k: 'cash', n: '현금', on: 1, offline: 1 }];
  const I = { now: '2026-11-11T05:00:00Z', days: 30, chs, al: [{ id: 'aladin_S9', title: '우리숍에서 팔린 책', price: 9000, qty: 1, live: true, st: '판매중', skus: ['S9'] }, { id: 'aladin_S8', title: '취소된 책', price: 9000, qty: 1, live: true, st: '판매중', skus: ['S8'] }],
    y24: [{ no: '909', title: '우리숍에서 팔린 책', price: 9500, stock: 1, live: true, self: 'S9', flags: [] }],
    ord: [{ ch: 'shop', no: 'BQ20261111-AAAAA', at: '2026-11-11T04:30:00Z', amt: 9000, fee: 0, cancel: false, lines: [{ lid: 'aladin_S9', sku: 'S9', qty: 1, amt: 9000 }] }, { ch: 'shop', no: 'BQ20261111-BBBBB', at: '2026-11-11T04:31:00Z', amt: 9000, fee: 0, cancel: true, lines: [] }] };
  const V = F.ledBuild(I); const TD = F.ledTodo(V); const P = F.omniPick(TD, { from: '2026-11-11T04:00:00Z' }); const ks = P.map((p) => p.T.key + ':' + p.a.ch).sort();
  ok(TD.length === 1 && TD[0].from.join() === 'shop' && JSON.stringify(ks) === JSON.stringify(['S9:aladin', 'S9:yes24']), '🛍 우리숍 주문(가짜 자료) → 장부 처리할 일 · 🤖 자동 내림이 알라딘·예스24 둘 다 내림 · 취소 주문은 할 일 없음', { TD, ks });
  ok(V.sum.shop && V.sum.shop.ord === 1 && V.sum.shop.cancel === 1 && V.sum.shop.amt === 9000, '판매처 칸 우리숍 — 30일 주문 1 · 취소 1 · 매출', V.sum.shop); }
{ /* ☁ 클라우드 대신 자동 내림 — cloud/index.js 덩어리만 떼어 가짜 Firestore로 */ const CF = [path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', 'cloud', 'index.js')].find((x) => fs.existsSync(x)); const CT = fs.readFileSync(CF, 'utf8');
  const a = CT.indexOf('/* ══ (11/11 omni2 · 통합 솔루션) 🤖 자동 내림 — 웹앱 열린 PC가'), b = CT.indexOf('async function stratTick(force) {'); ok(a > 0 && b > a, '클라우드 덩어리 찾음');
  const D = new Map(); const cp = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const put = (cur, v) => { for (const [k, x] of Object.entries(v)) { if (x && x.__fv === 'ts') cur[k] = new Date().toISOString(); else if (x && x.__fv === 'au') cur[k] = [...(Array.isArray(cur[k]) ? cur[k] : []), ...x.v]; else if (x && typeof x === 'object' && !Array.isArray(x) && cur[k] && typeof cur[k] === 'object' && !Array.isArray(cur[k])) put(cur[k], x); else cur[k] = cp(x); } return cur; };
  let auto = 0; const ref = (c, id) => ({ id, get: async () => { const d = D.get(c + '/' + id); return { exists: !!d, id, data: () => cp(d), ref: ref(c, id) }; }, set: async (v, o) => { const cur = D.get(c + '/' + id); D.set(c + '/' + id, put(o && o.merge && cur ? cur : {}, v)); } });
  const C = (c) => ({ doc: (id) => ref(c, id || 'auto' + ++auto), where: (f, op, v) => ({ get: async () => { const docs = [...D.entries()].filter(([k]) => k.split('/')[0] === c).map(([k, d]) => ({ id: k.split('/')[1], data: () => cp(d), ref: ref(c, k.split('/')[1]) })).filter((d) => { const x = d.data()[f]; return op === '>=' ? String(x || '') >= v : x === v; }); return { docs, forEach: (fn) => docs.forEach(fn) }; } }) });
  const db = { runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o) }) }; const FV = { serverTimestamp: () => ({ __fv: 'ts' }), arrayUnion: (...v) => ({ __fv: 'au', v }) };
  const G = new Function('C', 'db', 'FV', 'nowIso', 'VER', 'log', CT.slice(a, b) + '\nreturn { omniCloudTick, OMNI_C };')(C, db, FV, () => new Date().toISOString(), 'test', () => {});
  const T0 = Date.now(); const iso = (m) => new Date(T0 + m * 60e3).toISOString(); const set = (k, v) => D.set(k, cp(v));
  set('app_settings/platforms', { omni: { autoDown: { on: 1, from: iso(-60) } } }); set('app_settings/omni_auto', { hb: { 'PC-A': { at: iso(-30), y24: 1 } } });
  set('app_settings/sku_seq', { mapN: 0 }); set('app_settings/sku_map_0', { m: { aladin_A: { c: ['ab12c'] }, aladin_B: { c: ['cd34e', 'cd34f'] }, aladin_C: { c: ['ef56g'] }, aladin_E: { c: ['gh78i'] } } });
  for (const [id, o] of Object.entries({ aladin_A: { qty: 1 }, aladin_B: { qty: 2 }, aladin_C: { qty: 1, registeredAt: iso(-1) }, aladin_D: { qty: 1 }, aladin_E: { qty: 1 }, aladin_F: { qty: 1 } })) set('prd_listings/' + id, { status: '판매중', active: true, listingId: id.slice(-1), title: '시험 책 ' + id.slice(-1), ...o });
  set('crm_y24_orders/Y1', { orderNo: 'Y1', lastSeenAt: iso(-1), orderedAt: iso(-10), items: [{ self: 'PNKab12cEX', qty: 1 }] }); set('crm_y24_orders/Y2', { orderNo: 'Y2', lastSeenAt: iso(-1), orderedAt: iso(-9), items: [{ self: 'PNKcd34eEX', qty: 1 }] });
  set('crm_y24_orders/Y3', { orderNo: 'Y3', lastSeenAt: iso(-1), orderedAt: iso(-8), items: [{ self: 'PNKef56gEX', qty: 1 }] }); set('crm_y24_orders/Y4', { orderNo: 'Y4', lastSeenAt: iso(-1), orderedAt: iso(-7), stNm: '주문취소', items: [{ self: 'PNKgh78iEX', qty: 1 }] });
  set('crm_y24_orders/Y5', { orderNo: 'Y5', lastSeenAt: iso(-1), orderedAt: iso(-90), items: [{ self: 'PNKgh78iEX', qty: 1 }] }); /* 켠 시각 앞 */
  set('shop_orders/BQ1', { no: 'BQ1', at: iso(-5), st: 'new', items: [{ lid: 'aladin_D', t: '우리숍 책' }] }); set('shop_orders/BQ2', { no: 'BQ2', at: iso(-4), st: 'cancel', items: [{ lid: 'aladin_F' }] });
  const cmds = () => [...D.entries()].filter(([k]) => k.startsWith('shp_cmds/')).map(([, v]) => v);
  (async () => { const r1 = await G.omniCloudTick(); const L = cmds(); const ox = D.get('app_settings/omni_auto') || {};
    ok(r1 && r1.n === 2 && L.length === 2 && L.every((c) => c.type === 'prdEdit' && c.ch.state === '판매중지' && c.by === 'omni-cloud') && L.map((c) => c.listingKey).sort().join() === 'aladin_A,aladin_D', '☁ PC 30분 없음 → 예스24 주문(자체코드 고유 5칸)·우리숍 주문(상품 열쇠) 한 권짜리 알라딘 판매중지 2건 맡김', { r1, L: L.map((c) => c.listingKey) });
    ok(r1.skip >= 2 && !L.some((c) => ['aladin_B', 'aladin_C', 'aladin_E', 'aladin_F'].includes(c.listingKey)), '여러 권(B)·판매 뒤 다시 올림(C)·취소(E·F)·켠 시각 앞 주문은 안 건드림(PC/사람 몫)', r1);
    const cs = Object.values(ox.c || {}); ok(cs.length === 2 && cs.every((e) => e.st === 'sent' && e.dev === '☁ 클라우드' && e.id) && ox.cloud && ox.cloud.n === 2 && ox.hb && ox.hb['PC-A'] && D.get('prd_stop_reasons/aladin_A').reason === 'elsewhere', '기록: omni_auto.c(웹앱 카드와 같은 자리 · 같은 열쇠) · cloud 상태 · 맥박 그대로 · 판매중지 까닭', { cs, cloud: ox.cloud });
    G.OMNI_C.at = 0; const r2 = await G.omniCloudTick(); ok(r2 && r2.n === 0 && cmds().length === 2, '다시 돌아도 되풀이 0(같은 열쇠·진행 중 수정)', r2);
    set('app_settings/omni_auto', { ...D.get('app_settings/omni_auto'), hb: { 'PC-A': { at: iso(-2), y24: 1 } } }); G.OMNI_C.at = 0; const r3 = await G.omniCloudTick(); ok(r3 && r3.idle === 'pc', 'PC 맥박이 있으면 클라우드는 쉼(PC가 함)', r3);
    set('app_settings/platforms', { omni: { autoDown: { on: 0, from: iso(-60) } } }); G.OMNI_C.at = 0; const r4 = await G.omniCloudTick(); ok(r4 && r4.idle === 'off', '자동 내림을 끄면 클라우드도 안 함', r4);
    ok(!/\b(alert|confirm|prompt)\s*\(/.test(CT.slice(a, b)) && !/buyer|rcv|phone|addr/.test(CT.slice(a, b)), '클라우드 덩어리 — 손님 정보 칸(구매자·받는 이·전화·주소)을 읽지 않음'); })().then(() => after()).catch((e) => { ok(false, '클라우드 시험 오류', e.message); after(); }); }
function after() {
{ ok(!/\b(alert|confirm|prompt)\s*\(/.test(cut('/* ══ (11/11 omni1 · 통합 솔루션)', 'function openLedger() {')), '새 코드에 브라우저 창 없음');
  ok(!/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(cut('/* ══ (11/11 omni1 · 통합 솔루션)', 'function openLedger() {')), '새 코드에 휴대전화 번호 꼴 없음'); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(cut('/* (11/11 omni2) 💓 맥박 · 🔔 홈 알림', 'setTimeout(omniTick, 40e3);')), 'omni2 화면 코드에 브라우저 창 없음');
if (!process.env.RN_PORT) { console.log(bad ? `❌ tOMNI1111 ${bad}개 실패` : '✓ tOMNI1111 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const C2 = { puts: [], res: {}, wait: [] };
  await p.route(/127\.0\.0\.1:8797\//, async (rt) => { const u = new URL(rt.request().url()); let b = {}; try { b = JSON.parse(rt.request().postData() || '{}'); } catch (e) {} const J = (o, st) => rt.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (u.pathname === '/y24/w/put') { C2.puts.push(b); C2.wait = [{ id: b.id, n: b.rows.length }]; return J({ ok: true, took: b.id }); }
    if (u.pathname === '/y24/w/state') return J({ ok: true, ok1: 1, stop: null, wait: C2.wait, cur: null, res: C2.res });
    if (u.pathname === '/y24/w/ack') return J({ ok: true });
    return J({ ok: false }, 404); });
  const cmds = () => p.evaluate(async () => { const g = await db.collection('shp_cmds').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.type === 'prdEdit') L.push({ id: d.id, ...v }); }); return L; });
  /* 장부 자료: 410 = 예스24에서 팔림(알라딘 판매중) · 414 = 알라딘에서 팔림(예스24 777 판매중 · 자체코드 SK14) */
  await p.evaluate(() => { window.__T0 = Date.now(); window.__sold = [['yes24', 'aladin_U215983410'], ['aladin', 'aladin_U215983414']];
    window.ledNow = () => { const al = ['aladin_U215983410', 'aladin_U215983414'].map((id) => { const l = S.plist.get(id); return { id, title: l.title, price: l.price, qty: 1, live: aladinLive(l), st: l.status, skus: ['SK' + id.slice(-2)] }; });
      const ord = window.__sold.map(([ch, id], i) => ({ ch, no: 'n' + i, at: new Date(window.__T0 - 60e3).toISOString(), amt: 5000, lines: [ch === 'yes24' ? { sku: 'SK' + id.slice(-2), qty: 1 } : { lid: id, qty: 1 }] }));
      return ledBuild({ al, y24: [{ no: '777', title: '예스24 줄', price: 6000, stock: 1, live: true, self: 'SK14', flags: [] }], ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S.y24.loaded = true; S.y24o.loaded = true; localStorage.removeItem('rn-c2seen'); });
  await p.evaluate(async () => { await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); S.app = { ...S.app }; delete S.app.platforms; /* 다른 설정 듣기가 S.app을 통째로 바꾼 꼴 */ S._ledView = 'todo'; openLedger(); });
  await p.waitForTimeout(600);
  const A0 = await p.evaluate(() => { const c = document.querySelector('#omni_card'); return { card: !!c, on: !!(c && c.querySelector('#omni_on').checked), txt: c ? c.textContent : '', rc: !!document.querySelector('#omni_rc'), tabs: [...document.querySelectorAll('[data-ledview]')].map((b) => b.textContent.trim()) }; });
  ok(A0.card && A0.on && /켬/.test(A0.txt) && A0.rc && A0.tabs.length === 3 && /주문 모음/.test(A0.tabs[2]), '🛠 처리할 일 위 🤖 자동 내림 카드(켬) · 🔍 재고 맞추기 카드 · 보기 칸 셋(전체·처리할 일·📋 주문 모음)', A0);
  /* 돌기 한 번 — 이 기기엔 번외 없음 → 알라딘 쪽만 */
  await p.evaluate(async () => { await omniTick(); }); await p.waitForTimeout(600); const C1 = await cmds();
  const L1 = await p.evaluate(async () => { await omniLoad(true); return Object.values(S.omni.log); });
  ok(C1.length === 1 && C1[0].listingKey === 'aladin_U215983410' && C1[0].ch && C1[0].ch.state === '판매중지', '예스24 주문 → 1분 돌기에서 알라딘 판매중지 저절로 맡김 1건(🛠 맡기기와 같은 길 · shp_cmds prdEdit)', C1.map((c) => [c.listingKey, c.ch]));
  ok(L1.length === 1 && L1[0].st === 'sent' && L1[0].ch === 'aladin' && L1[0].dev !== undefined && !C2.puts.length, '기록(app_settings/omni_auto) — 누가·어느 기기·맡김 · 번외 없는 기기는 예스24 쪽을 안 함', L1);
  await p.evaluate(async () => { S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(500); ok((await cmds()).length === 1, '다시 돌아도 같은 할 일은 되풀이 0');
  /* 번외가 있는 기기 → 예스24 쪽 */
  await p.evaluate(async () => { localStorage.setItem('rn-c2seen', '1'); localStorage.setItem('rn-device', 'HOME'); /* (y24ops4) 번외 있는 PC = 예스24를 맡은 PC(기본 HOME) — 이 PC 번외로 바로 */ S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(600);
  const r0 = C2.puts[0] && C2.puts[0].rows[0];
  ok(C2.puts.length === 1 && r0 && r0.no === '777' && r0.self === 'SK14' && r0.kind === 'stop', '알라딘 주문 → 예스24 777(자체코드 SK14) 판매중지를 번외에 저절로 맡김', C2.puts);
  const V = await p.evaluate(() => { S._omniWhy = null; ledRedraw(); const c = document.querySelector('#omni_card'); return { stp: c.querySelectorAll('.shl-stp li').length, rows: c.querySelectorAll('.omni-r').length, txt: c.textContent }; });
  ok(V.stp === 4 && V.rows === 2 && /반영 기다림|고치는 중/.test(V.txt) && /에서 팔림/.test(V.txt), '카드: 단계 줄(주문 확인 → 맡김 → 판매처 반영 → 목록 확인) · 줄마다 어디서 팔렸는지·지금 상태', V);
  /* 끄기 → 새 주문이 와도 맡기지 않음 */
  await p.evaluate(async () => { const cb = document.querySelector('#omni_on'); cb.checked = false; await cb.onchange(); });
  await p.waitForTimeout(400); const off = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('platforms').get(); window.__sold.push(['yes24', 'aladin_U215983415']); return { cfg: (((d.data() || {}).omni || {}).autoDown) || null, card: document.querySelector('#omni_card .omni-st').textContent }; });
  await p.evaluate(async () => { const l = S.plist.get('aladin_U215983415'); if (l) { window.ledNow0 = window.ledNow; } S.omni.at = 0; await omniTick(); }); await p.waitForTimeout(400);
  ok(off.cfg && off.cfg.on === 0 && off.cfg.by && off.card === '끔' && (await cmds()).length === 1, '끄기 = 설정 저장(모든 기기 · 누가·언제) · 끈 동안 맡기지 않음', off);
  /* 다시 켜면 켠 시각부터 — 앞서 온 주문은 안 맡김 */
  const on2 = await p.evaluate(async () => { window.__sold = [['yes24', 'aladin_U215983410'], ['aladin', 'aladin_U215983414'], ['yes24', 'aladin_U215983411']]; const l = S.plist.get('aladin_U215983411'); l.status = '판매중'; l.active = true;
    const n0 = window.ledNow; window.ledNow = () => { const v = n0(); return v; }; const cb = document.querySelector('#omni_on'); cb.checked = true; await cb.onchange(); S.omni.at = 0; await omniTick(); return omniCfg(); });
  await p.waitForTimeout(400); ok(on2.on === 1 && Date.parse(on2.from) > Date.now() - 60e3 && (await cmds()).length === 1, '다시 켜면 그 시각 뒤 주문부터(밀린 줄은 사람이 🛠에서)', on2);
  /* 로거 PC는 안 돎 */
  const LG = await p.evaluate(() => { const d0 = localStorage.getItem('rn-device'); localStorage.setItem('rn-device', 'LOGGER'); const w = omniWhy(); if (d0 == null) localStorage.removeItem('rn-device'); else localStorage.setItem('rn-device', d0); return w; });
  ok(/로거/.test(LG), '로거 PC에서는 자동 내림이 돌지 않음(약속 0)', LG);
  /* 🔍 재고 맞추기 카드 — 실물 없음 줄 맡기기 두 번 */
  const RC = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); S.omni.recon = { day: kst(new Date()), at: new Date().toISOString(), dev: 'TEST', sum: { aladin: { live: 9, qty: 9, phys: 9 }, yes24: { live: 2, qty: 2, phys: 1 } }, nBad: 1, bad: [{ kind: 'gone', ch: 'yes24', no: '555', self: 'SK99', title: '나간 책', cur: 1, to: 0, why: '같은 SKU 알라딘 상품이 판매완료' }] }; ledRedraw(); await w(200);
    const sh = document.getElementById('sheet'); const b = sh.querySelector('[data-omnirc]'); const tab = (sh.querySelector('[data-ledview="todo"]') || {}).textContent || ''; const txt = sh.querySelector('#omni_rc').textContent; if (!b) return { b: false, txt }; b.click(); await w(500); const mid = window.__puts; return { b: true, txt, tab, arm: (sh.querySelector('[data-omnirc]') || {}).textContent || '' }; });
  const nRc0 = C2.puts.length; await p.locator('[data-omnirc]').click(); await p.waitForTimeout(800); const pr = C2.puts[C2.puts.length - 1]; const rr = pr && pr.rows[0];
  ok(RC.b && /실물 없음/.test(RC.txt) && /어긋남\s*1/.test(RC.txt) && /🔍1/.test(RC.tab) && /한 번 더/.test(RC.arm), '🔍 재고 맞추기 카드 — 판매처 합계·어긋남 · 처리할 일 칸에 🔍 수 · 한 번 = 무장', RC);
  ok(C2.puts.length === nRc0 + 1 && rr && rr.no === '555' && rr.self === 'SK99' && rr.kind === 'stop', '두 번 = 번외에 예스24 555 판매중지 1건', pr);
  const RN = await p.evaluate(async () => { S.y24LinkAll0 = window.y24LinkAll; const l = S.plist.get('aladin_U215983410'); S.sku.map.set(l.id, { c: ['ab12c'] }); const sk = (y24SkuSelf(l) || [])[0] || ''; window.y24LinkAll = () => [{ x: { goodsNo: 321 }, v: { self: sk, stock: 1, title: '예스24 줄' }, live: true }]; l.status = '판매완료'; l.active = false; const r = await omniReconRun(true); window.y24LinkAll = S.y24LinkAll0; const d = await db.collection('app_settings').doc('omni_auto').get(); return { r, sk, saved: !!((d.data() || {}).recon) }; });
  ok(RN.sk && RN.r && RN.r.bad.some((b) => b.kind === 'gone' && b.no === '321') && RN.saved && RN.r.force === 1, '↻ 지금 다시 맞추기 = 상품 기록·예스24 목록으로 다시 견줌 · 결과는 모든 기기 같은 자리(omni_auto.recon)', RN);
  /* 📋 주문 모음 */
  const OV = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); S.orders.set('o_t1', { id: 'o_t1', kind: 'sale', orderNo: 'AL0001', orderedAt: now, items: [{ title: '테스트 책 1', price: 5000, qty: 1 }] }); S.orders.set('o_t2', { id: 'o_t2', kind: 'sale', orderNo: 'AL0002', orderedAt: now, invoice: '1234', items: [{ title: '테스트 책 2', price: 6000, qty: 1 }] });
    S.y24o.m.set('Y0001', { orderNo: 'Y0001', orderedAt: now, ystage: 'new', items: [{ title: '예스24 책', price: 7000, qty: 1, self: 'SK14' }] }); S._ledO = null; S.y24o.ver = (S.y24o.ver || 0) + 1;
    document.querySelector('#sheet [data-ledview="ord"]').click(); await w(500); const sh = document.getElementById('sheet'); const rows = [...sh.querySelectorAll('.bt-tb tr')].slice(1).map((tr) => tr.textContent);
    const f = [...sh.querySelectorAll('[data-btf^="och|"]')].map((b) => b.textContent.trim()); const st = [...sh.querySelectorAll('[data-btf^="ost|"]')].map((b) => b.textContent.trim()); return { rows, f, st, on: (sh.querySelector('[data-ledview].on') || {}).dataset.ledview, ship: !!sh.querySelector('[data-ledship]') }; });
  ok(OV.on === 'ord' && OV.rows.length === 3 && OV.rows.some((t) => /예스24/.test(t) && /진행 중/.test(t)) && OV.rows.some((t) => /AL0002|0002/.test(t) && /출고·송장/.test(t)), '📋 주문 모음 — 알라딘·예스24 주문 한 목록 · 상태(진행 중·출고·송장)', OV);
  ok(OV.f.some((t) => /예스24\s*1/.test(t)) && OV.f.some((t) => /알라딘\s*2/.test(t)) && OV.st.some((t) => /진행 중\s*2/.test(t)) && OV.ship, '판매처 칩·상태 거르기 · 진행 중 주문은 출고 › 바로 가기', { f: OV.f, st: OV.st });
  /* ── (11/11 omni2) 📋 주문 모음 🛍 우리숍 칩(어댑터 자리) */
  const SH = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); LED_ORD_AD.push(() => [{ ch: 'shop', no: 'BQ20261111-AAAAA', at: new Date().toISOString(), amt: 9000, fee: 0, cancel: false, lines: [{ lid: null, sku: 'SKS1', qty: 1, amt: 9000, t: '우리숍 시험 책' }] }]); S._ledO = null; S._led = null; S._ledView = 'ord'; openLedger(); await w(500);
    const sh = document.getElementById('sheet'); return { f: [...sh.querySelectorAll('[data-btf^="och|"]')].map((b) => b.textContent.trim()), rows: [...sh.querySelectorAll('.bt-tb tr')].slice(1).map((tr) => tr.textContent).filter((t) => /우리숍/.test(t)), card: [...sh.querySelectorAll('.ledcard')].map((c) => c.textContent).find((t) => /우리숍/.test(t)) || '' }; });
  ok(SH.f.some((t) => /우리숍\s*1/.test(t)) && SH.rows.length === 1 && /진행 중/.test(SH.rows[0]) && /30일 1건/.test(SH.card), '📋 주문 모음 — 우리숍 어댑터 주문이 🛍 칩·줄·판매처 칸으로(판매처가 아직 준비 중이어도)', SH);
  /* ── 🤖 카드 💓 맥박 줄 · 경보 */
  const HB = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); S._ledView = 'todo'; S.omni.at = Date.now(); S.omni.hb = { 'PC-A': { at: new Date(Date.now() - 2 * 60e3).toISOString(), y24: 1 } }; S.omni.cloud = { at: new Date().toISOString(), idle: 'PC가 돎 — 클라우드는 쉼' }; openLedger(); await w(400);
    const a = (document.querySelector('#omni_card .omni-hb') || {}).textContent || ''; const wa = !!document.querySelector('#omni_card .omni-warn'); S.omni.hb = { 'PC-A': { at: new Date(Date.now() - 30 * 60e3).toISOString(), y24: 1 } }; S.omni.cloud = null; ledRedraw(); await w(300);
    const b = (document.querySelector('#omni_card .omni-warn') || {}).textContent || ''; const red = !!document.querySelector('#omni_card .omni-warn.red'); return { a, wa, b, red }; });
  ok(/PC-A/.test(HB.a) && /2분 전/.test(HB.a) && /클라우드는 쉼/.test(HB.a) && !HB.wa, '카드 「💓 돌리는 PC」 줄 — 기기·몇 분 전·🟦 번외 · ☁ 클라우드 대신 상태 · 경보 없음', HB);
  ok(HB.red && /30분째 없음/.test(HB.b) && /알라딘 쪽도 멈춤/.test(HB.b), '30분째 PC 없음 + 클라우드 기록 없음 → 카드에 🔴 경보 줄', HB.b);
  /* ── 홈 알림: 못 맡김 n건 · PC 없음 → 누르면 🛠 처리할 일 › 🤖 자동 내림 카드 */
  const AL = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const now = new Date().toISOString(); S.omni.at = Date.now(); S.omni.log = { 'zz|aladin|down|0|1': { key: 'zz', ch: 'aladin', k: 'down', to: 0, title: '시험 책', st: 'fail', msg: '시험 실패', at: now } };
    const A = bizAlerts(bizCalc()).filter((a) => a.key === 'omni'); const html = alertsHtml(A); const live = omniLiveFix('<div class="alerts"><i class="alnone" hidden></i><div class="hint">✓ 지금 확인할 문제 없음</div></div>');
    history.state && S.detail && history.back(); await w(300); openAlert('omni'); await w(700); const c = document.getElementById('omni_card');
    return { A: A.map((a) => [a.lv, a.t, a.x && a.x.k, a.x && a.x.n]), doc: !!(ALERT_DOC.omnibad && ALERT_DOC.omnipc && ALERT_DOC.omnibad.go), btn: /data-alert="omni"/.test(html), live: (live.match(/data-alert="omni"/g) || []).length, view: S._ledView, big: S.detail && S.detail.bigTable, flash: !!(c && c.classList.contains('omni-flash')) }; });
  const ab = AL.A.find((a) => a[2] === 'omnibad'), ap = AL.A.find((a) => a[2] === 'omnipc');
  ok(ab && ab[0] === 'red' && ab[3] === 1 && /못 맡긴 일 1건/.test(ab[1]) && /통합 장부 › 🛠 처리할 일/.test(ab[1]), "홈 '오늘 확인할 것' — 🔴 🤖 자동 내림 못 맡긴 일 1건(어디서 하는지 길 함께)", AL.A);
  ok(ap && ap[0] === 'red' && /웹앱 열린 PC/.test(ap[1]) && AL.doc && AL.btn, '🔴 웹앱 열린 PC 없음 알림 · ℹ 설명(무엇·언제 사라짐·할 일 단계)', AL.A);
  ok(AL.live === 2, '휴대폰(공유 요약을 보이는 기기)도 이 기기가 실시간으로 두 알림을 끼움', AL.live);
  ok(AL.big === 'ledger' && AL.view === 'todo' && AL.flash, '알림을 누르면 🧾 통합 장부 › 🛠 처리할 일 › 🤖 자동 내림 카드로 가서 카드가 빛남', AL);
  /* ── 🔍 재고 맞추기 알라딘 쪽 — 실제 셈(예스24 주문 SKU) → 줄 → 두 번 = 알라딘 판매중지 맡김 */
  const n0 = (await cmds()).length;
  const RA = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const l = [...S.plist.values()].find((x) => aladinLive(x) && !ledAlPend(x.id) && !/DUPES/i.test(String(x.sku || '')) && (x.qty == null || +x.qty <= 1)); if (!l) return { none: 1 }; l.registeredAt = '2026-01-01T00:00:00Z';
    S.sku.map.set(l.id, { c: ['qq77z'] }); const sk = (y24SkuSelf(l) || [])[0]; S.y24o.m.set('YT9', { orderNo: 'YT9', orderedAt: new Date(Date.now() - 40 * 864e5).toISOString(), ystage: 'new', items: [{ self: sk, qty: 1, title: '예스24에서 팔린 책' }] });
    const y0 = window.y24LinkAll; window.y24LinkAll = () => []; const r = await omniReconRun(true); window.y24LinkAll = y0; S._ledView = 'todo'; openLedger(); await w(400); const sh = document.getElementById('sheet'); const row = sh.querySelector(`[data-omnialrow="${l.id}"]`);
    return { id: l.id, sk, al: (r.bad || []).filter((b) => b.kind === 'alsold').map((b) => b.id), row: row ? row.textContent : '', tab: (sh.querySelector('[data-ledview="todo"]') || {}).textContent || '' }; });
  ok(!RA.none && RA.al.includes(RA.id) && /예스24에서 팔림 — 알라딘 판매중/.test(RA.row) && /🔍/.test(RA.tab), '🔍 재고 맞추기 — 40일 전 예스24 주문(SKU)인데 알라딘 판매중 → 줄 · 처리할 일 칸 🔍 수', RA);
  await p.locator(`[data-omnial="${RA.id}"]`).click(); await p.waitForTimeout(600); const mid = (await cmds()).length; await p.locator(`[data-omnial="${RA.id}"]`).click(); await p.waitForTimeout(800);
  const C3 = (await cmds()).filter((c) => c.listingKey === RA.id); const R3 = await p.evaluate((id) => { const r = document.querySelector(`[data-omnialrow="${id}"]`); return r ? { t: r.textContent, btn: !!r.querySelector('[data-omnial]') } : null; }, RA.id);
  ok(mid === n0 && C3.length === 1 && C3[0].ch.state === '판매중지', '한 번 = 무장(맡김 0) · 두 번 = 알라딘 판매중지 1건(shp_cmds prdEdit — 🛠 맡기기와 같은 길)', { n0, mid, C3: C3.map((c) => c.ch) });
  ok(R3 && !R3.btn && /⏳/.test(R3.t), '맡긴 뒤 그 줄은 ⏳ 진행 표시(단추 사라짐 — 두 번 맡기지 않음)', R3);
  ok(!dlg.length, '브라우저 창(alert/confirm/prompt) 0', dlg);
  console.log(bad ? `❌ tOMNI1111 ${bad}개 실패` : '✓ tOMNI1111 통과');
});
}
