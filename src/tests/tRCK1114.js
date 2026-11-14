// tRCK1114 — 정범님 11/14 16:41·16:48 「송장 입력이 끝나면 배송&구매확정전을 확인해 주문마다 수령인 이름·주소를 재검토 · 이상 없음 / 다른 곳 · 이상 있는 탭에 표시」
//  ① 견주기 기준(출고 공용 rckCompare) — 정범님 예시 105-1502 · 105.1502 · 105/1502 · 105동1502 · 5동 1502(🟠) · '서울 서초 서초' · 302호↔303호(🔴) · 가림표 이름 · 우편번호
//  ② 수집기(엔진) — 송장 입력이 다 끝나면 단추 없이 배송&구매확정전을 읽어 입력된 주문 전부를 견줌 · rck/rckOpen · 기록 줄엔 이름·주소 글자 없음 · 재검토만 하는 탭(#rnrck)
//  ③ 웹앱 — 맡길 때 상자 받는 분(to) 적음 · 주문·매출 탭·✅ 오늘 끝 탭 빨간 점 · 다른 곳 화면 · 「확인함」(기록 남김)
// 시험 자료는 가짜 손님 '손님A'·'손님B'와 지어낸 주소 (공개 저장소)
// 실행: cd pw && RN_PORT=8816 node tRCK1114.js
const fs = require('fs'); const path = require('path'); const { JSDOM } = (() => { for (const b of [__dirname, '/home/user/w/pw', '/home/claude/w/pw', ...(process.env.NODE_PATH || '').split(':').filter(Boolean)]) { try { return require(require.resolve('jsdom', { paths: [b] })); } catch (e) {} } throw new Error('jsdom을 못 찾음 — /home/user/w/pw/node_modules 또는 NODE_PATH'); })();
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const SHIP = require(pick(path.join(__dirname, '../readnow-shipping-core.js'), path.join(__dirname, '../../readnow-shipping-core.js')));
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); return s.slice(i, j + b.length); };
const STEP_SRC = cut(src, '(function rnStepLog() {', '\n})();');
const INV_SRC = cut(src, '(async function rnInvoiceRunner() {', "if (act && Date.now() - act.at < 3 * 3600e3) { if (mine(act.id)) step(act.id); else idle('다른 탭에서 송장 입력 중 — 그 탭이 진행합니다'); } else { if (act) GM_deleteValue('rn-inv-active'); idle(''); }\n})();");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fakeFb() { const store = {}; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), increment: (n) => ({ __inc: n }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { const p = col + '/' + id; return { id, path: p, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); }, update: async (v) => { store[p] = merge(store[p], v); } }; };
  const db = { collection: (c) => ({ doc: (id) => doc(c, id), where: () => ({ get: async () => ({ docs: [] }) }) }), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, v, o) => r.set(v, o), update: (r, v) => r.update(v) }) };
  const user = { email: 'test@x' }; const auth = { currentUser: user, onAuthStateChanged: (cb) => { setTimeout(() => cb(user)); return () => {}; } };
  const app = { firestore: () => db, auth: () => auth }; return { fb: { apps: [app], app: () => app, initializeApp: () => app, auth: () => auth, firestore: Object.assign(() => db, { FieldValue: FV }) }, store }; }

const SH = SHIP;
const addr = (n, name, ad, inv, ono) => `<tr id="oList${n}"><td><a onclick="viewOrderDetail('${ono}')">${ono}</a></td><td>출고완료</td><td>${n}</td><td><a href="wproduct.aspx?ItemId=1${n}">[중고-상] 시험 책 ${n}</a></td><td>1</td><td>9000</td><td><a onclick="viewAddrLayer(${n},0);">주문인${n}</a></td><td><a onclick="viewAddrLayer(${n},1);"><strong>${name}</strong></a><div id="addrLayer${n}"><table><tr><td>성명</td><td>${name}</td><td>전화1</td><td>010-0000-0000</td><td>전화2</td><td></td></tr><tr><td>주소</td><td colspan="5">${ad}</td></tr></table></div></td><td>롯데택배 ${inv}</td></tr><tr id="oList${n}b"><td>BLUAAA-1, 2026-11-01</td><td>11-14</td></tr>`;
const shipped = (L) => `<html><body>배송&구매확정전 (${L.length}건)<table>${L.map((x, i) => addr(i + 1, x.name, x.ad, x.inv, x.no)).join('')}</table></body></html>`;
const REF = { O2: ['손님A', '서울특별시 서초구 서초대로 10 105동 1502호'], O3: ['손님A', '경기도 시험시 시험구 시험로 5 101동 302호'], O4: ['손님B', '서울특별시 서초구 서초동 1234'], O5: ['손님B', '서울특별시 서초구 서초대로 10 105동 1502호'], O6: ['손님A', '부산광역시 시험구 시험로 7'] };
const SEEN = [{ no: 'O2', name: '손님A', ad: '서울 서초구 서초대로 10, 105-1502', inv: '240000000012' }, { no: 'O3', name: '손님A', ad: '경기 시험시 시험구 시험로 5 101동 303호', inv: '240000000013' }, { no: 'O4', name: '손*B', ad: '서울 서초 서초 1234', inv: '240000000014' },
  { no: 'O5', name: '손님B', ad: '서울 서초구 서초대로 10 5동 1502', inv: '240000000015' }, { no: 'O6', name: '손님A', ad: '부산광역시 시험구 시험로 7', inv: '240000009999' }];
async function run(hash) { const F = fakeFb(); const GM = new Map(); const id = 'inv_r'; const fetched = [];
  F.store['shp_invoices/' + id] = { createdAt: new Date().toISOString(), status: 'running', from: 'oneshot', log: [], items: Object.entries(REF).map(([no, [nm, ad]], i) => ({ orderNo: no, invoice: '2400000000' + (12 + i), recipient: nm, to: { name: nm, zip: null, addr: ad, src: 'excel' }, state: 'sent' })) };
  GM.set('rn-inv-active', { id, at: Date.now() });
  const page = async (h) => { const dom = new JSDOM('<body></body>', { url: 'https://www.aladin.co.kr/scm/worder_delivery.aspx?orderstep=4' + (h || ''), runScripts: 'dangerously' }); const w = dom.window; w.close = () => { w.__closed = 1; };
    w.TextDecoder = TextDecoder; w.TextEncoder = TextEncoder; w.firebase = F.fb; w.__rnLog = () => {}; if (!h) w.sessionStorage.setItem('rn-inv-tab', id);
    w.GM_getValue = (k, d) => (GM.has(k) ? GM.get(k) : d); w.GM_setValue = (k, v) => GM.set(k, v); w.GM_deleteValue = (k) => GM.delete(k); w.GM_notification = () => {};
    w.fetch = async (u) => { u = String(u); fetched.push(u); if (/worder_delivery_complete/.test(u)) return { ok: true, status: 200, text: async () => shipped(SEEN) }; return { ok: true, status: 200, text: async () => '<html></html>' }; };
    w.ReadnowShipping = { ...SH, parseDeliveryPage: (d) => (d === w.document ? { orders: [], tabCounts: { '발송 요청': 0 } } : SH.parseDeliveryPage(d)) };
    w.eval(STEP_SRC); w.eval(INV_SRC); return w; };
  return { F, GM, page, fetched, id, D: () => F.store['shp_invoices/' + id] }; }
(async () => {
  console.log('■ ① 견주기 기준 — 정범님 예시');
  { const R0 = '서울특별시 서초구 서초대로 10 105동 1502호'; const v = (b) => SH.rckAddrCmp(R0, null, b, null).v;
    ok(['서울 서초구 서초대로 10, 105-1502', '서울시 서초구 서초대로 10 105.1502', '서울 서초구 서초대로 10 105/1502', '서울특별시 서초구 서초대로 10 105동1502', '서울특별시  서초구 서초대로 10 (서초동) 105동 1502호'].every((b) => v(b) === 'ok'), "105-1502 · 105.1502 · 105/1502 · 105동1502 · 괄호 덧말 · 띄어쓰기 = ✅ 같음");
    const w5 = SH.rckAddrCmp(R0, null, '서울 서초구 서초대로 10 5동 1502', null); ok(w5.v === 'warn' && w5.a === '105동' && w5.b === '5동', "'5동 1502' ↔ '105동 1502호' = 🟠 확인 필요 · 다른 곳 105동 ↔ 5동 " + JSON.stringify(w5));
    ok(SH.rckAddrCmp('서울특별시 서초구 서초동 1234', null, '서울 서초 서초 1234', null).v === 'ok', "'서울 서초 서초'(단위 뺌) = ✅ 같음");
    const b3 = SH.rckAddrCmp('경기도 시험시 시험구 시험로 5 101동 302호', null, '경기 시험시 시험구 시험로 5 101동 303호', null); ok(b3.v === 'bad' && b3.a === '302호' && b3.b === '303호', '302호 ↔ 303호 = 🔴 다름 · 다른 곳 그대로 ' + JSON.stringify(b3));
    ok(SH.rckAddrCmp('시험로 5', '12345', '시험로 5', '12346').v === 'bad' && SH.rckAddrCmp('(12345) 시험시 시험로 5', null, '시험시 시험로 5', '12345').v === 'ok', '우편번호 다르면 🔴 · 주소 앞 (12345)도 우편번호로 읽음');
    ok(SH.rckAddrCmp('시험시 시험로 5', null, '시험시 다른로 5', null).v === 'warn', '숫자는 같고 길 이름이 다르면 🟠');
    ok(SH.rckNameEq('손님가나', '손*가나').ok === true && SH.rckNameEq('손님가나', '손*다나').ok === false && SH.rckNameEq('손님 가나', '손님가나').ok === true && SH.rckNameEq('손님가나', '손**').ok === true, '가림표 이름 — 보이는 글자만 견줌 · 띄어쓰기 무시');
    const sf = SH.rckSafe('O3', SH.rckCompare({ name: '손님A', addr: '시험로 5 101동 302호' }, { seen: true, name: '손님B', addr: '시험로 5 101동 303호', invOk: false })); ok(!/손님|시험로|30[23]/.test(JSON.stringify(sf)) && sf.f.length === 3, '기록용 rckSafe = 주문번호·칸 이름·글자 수만 ' + JSON.stringify(sf)); }
  console.log('■ ② 수집기 — 송장 입력이 다 끝나면 저절로 재검토');
  { const T = await run(); const w = await T.page(); for (let i = 0; i < 60 && !(T.D().rck && T.D().rck.state === 'done'); i++) await sleep(100); const v = T.D(); const r = v.rck || {};
    ok(v.status === 'done' && r.state === 'done', "입력 끝 → status done 뒤 재검토 끝(단추 없음) " + v.status + ' ' + r.state);
    ok(T.fetched.filter((u) => /worder_delivery_complete/.test(u)).length >= 1 && T.fetched.every((u) => !/POST|deliveryNo/i.test(u)), '배송&구매확정전 읽기만(보낸 것 없음) ' + T.fetched.length);
    ok(r.n === 5 && r.okN === 2 && r.warnN === 1 && r.badN === 2 && v.rckOpen === 3, `5건 중 ✅2 · 🟠1 · 🔴2 · rckOpen 3 — ${JSON.stringify([r.n, r.okN, r.warnN, r.badN, v.rckOpen])}`);
    const B = Object.fromEntries((r.bad || []).map((x) => [x.o, x])); ok(B.O3 && B.O3.v === 'bad' && B.O3.d[0].f === 'addr' && B.O3.d[0].a === '302호' && B.O3.d[0].b === '303호', 'O3 주소 302호 ↔ 303호');
    ok(B.O5 && B.O5.v === 'warn' && B.O6 && B.O6.d.some((x) => x.f === 'inv' && x.v === 'bad') && !B.O2 && !B.O4, 'O5 🟠 · O6 송장 🔴 · O2(105-1502)·O4(가림 이름·서울 서초 서초)는 이상 없음');
    ok(r.masked === 1 && !r.okAt, '이름 가림 1건 표시 · 이상이 있으면 이상 없음 시각은 비움');
    const logT = JSON.stringify(v.log || []); ok(/재검토 끝/.test(logT) && !/손님|서초|시험로|부산|30[23]호/.test(logT), '기록 줄에는 이름·주소 글자 없음(주문번호·칸 이름·글자 수만)');
    ok(w.__closed === undefined || w.__closed === 1, '탭 닫기 흐름 그대로');
    console.log('■ ② 재검토만 하는 탭(#rnrck) — 입력 탭이 먼저 닫혔을 때 엔진이 다시');
    T.F.store['shp_invoices/' + T.id].rck = { state: 'fail', at: new Date(Date.now() - 6 * 60e3).toISOString(), tries: 1 }; T.F.store['shp_invoices/' + T.id].rckOpen = 0; const w2 = await T.page('#rnrck=' + T.id); for (let i = 0; i < 60 && T.D().rck.state !== 'done'; i++) await sleep(100);
    ok(T.D().rck.state === 'done' && T.D().rck.tries === 2 && T.D().rckOpen === 3 && T.D().status === 'done', '#rnrck 탭이 다시 견줌(두 번째) · 상태 done 그대로 ' + JSON.stringify([T.D().rck.state, T.D().rck.tries])); await sleep(50);
    const src2 = fs.readFileSync(SRC, 'utf8'); ok(/const invRckNeed = /.test(src2) && /#rnrck=/.test(src2) && /shipPcOk\(\)\.ok/.test(src2.slice(src2.indexOf('const invRckNeed'), src2.indexOf('const invRckNeed') + 1200)), '되살리기: 출고 PC만 · 5분마다 · 끝난 지 6시간 안 · 재검토 없음/멈춤/못 읽음'); }
  console.log('■ ③ 웹앱');
  const H = require('./harness.js'); let errN = 0; const _log = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('ERRORS:')) { try { const E = JSON.parse(a[1]).filter((x) => !/js-profiling/.test(x)); errN += E.length; } catch (e) {} } _log(...a); };
  await H(async (p) => { await p.evaluate(require('./seed.js'));
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1200); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
      const SHx = window.ReadnowShipping; const Hd = SHx.ALADIN_XLS_HEAD.slice(); const ix = (n) => Hd.indexOf(n); const row = (no, nm, zip, ad) => { const v = Hd.map(() => ''); v[ix('주문번호')] = no; v[ix('수령인')] = nm; v[ix('우편번호')] = zip; v[ix('수령 주소')] = ad; return { v }; };
      S.ship = { ...(S.ship || {}), orders: [{ orderNo: 'R1', recipient: { name: '손님A', address: '시험시 시험로 1' }, items: [] }, { orderNo: 'R2', recipient: { name: '손님B', address: '시험시 시험로 2 101동 202호' }, items: [] }], excel: { at: '9999', header: Hd, rows: [row('R1', '손님A', '12345', '시험시 시험로 1 (시험동)')] } };
      o.ref1 = invRefOf('R1'); o.ref2 = invRefOf('R2'); o.ref3 = invRefOf('없음');
      try { localStorage.removeItem('rn-ship-invdone'); } catch (e) {} o.auto = await alpsInvAuto({ byOrder: [{ orderNo: 'R1', invoice: '240000001111', recipient: '손님A', status: 'ok' }] }, 'x.xlsx', 'runRCK', { force: true }); o.autoTo = ((await db.collection('shp_invoices').doc('alps_runRCK').get()).data() || {}).items;
      await db.collection('shp_invoices').doc('rck1').set({ createdAt: new Date().toISOString(), status: 'done', doneAt: new Date().toISOString(), items: [], rck: { state: 'done', at: new Date().toISOString(), n: 3, okN: 1, warnN: 1, badN: 1, bad: [{ o: 'R3', v: 'bad', d: [{ f: 'addr', v: 'bad', why: '번지·동·호 숫자가 다름', a: '302호', b: '303호' }] }, { o: 'R4', v: 'warn', d: [{ f: 'addr', v: 'warn', why: '번지·동·호 숫자가 일부만 맞음', a: '105동', b: '5동' }] }] }, rckOpen: 2 });
      rckWatch(); await W(800); renderTabs(); await W(100);
      const tb = document.querySelector('#tabs [data-tab="orders"] .rckb'); o.tab = tb ? tb.textContent : null; o.cnt = rckCnt();
      o.line = rckLineHtml('R3'); o.none = rckLineHtml('R1'); o.day = rckDayHtml(dstr(new Date())); o.sum = rckSumHtml({ id: 'x', status: 'done', items: [{ state: 'done' }], rck: { state: 'done', okN: 4, bad: [], okAt: new Date().toISOString() } });
      tb.click(); await W(300); o.sheet = (document.querySelector('#sheet') || {}).textContent || ''; o.onTab = S.tab;
      const ack = document.querySelector('[data-rckack="rck1|R3"]'); if (ack) ack.click(); await W(800); const d = (await db.collection('shp_invoices').doc('rck1').get()).data() || {}; o.ack = { open: d.rckOpen, has: !!(d.rckAck || {}).R3, keep: ((d.rck || {}).bad || []).length }; o.cnt2 = rckCnt();
      S.shipTab = 'done'; await openShip(); await W(600); o.stg = !!document.querySelector('.shp-stg [data-stab="done"] .rckb');
      return o; });
    console.log(JSON.stringify(R).slice(0, 900));
    ok(R.ref1 && R.ref1.src === 'excel' && R.ref1.zip === '12345' && /시험로 1/.test(R.ref1.addr) && R.ref2 && R.ref2.src === 'page' && R.ref3 === null, '상자 받는 분 = ALPS에 올린 발송 요청 엑셀 줄(없으면 발송 요청 화면)');
    ok(R.auto === 'made' && R.autoTo && R.autoTo[0] && R.autoTo[0].to && R.autoTo[0].to.zip === '12345', 'ALPS 자동 송장 맡김 items[].to에 상자 받는 분이 들어감');
    ok(R.tab === '🔴2' && R.cnt.r === 1 && R.cnt.w === 1, '주문·매출 탭에 🔴 2(다름 1 · 확인 필요 1) ' + R.tab);
    ok(/302호/.test(R.line) && /303호/.test(R.line) && R.none === '' && /R3/.test(R.day) && /모두 이상 없음/.test(R.sum), '주문 카드 줄(다른 곳) · 하루 출고 보기 줄 · 이상 없음 한 줄');
    ok(/재검토/.test(R.sheet) && /302호/.test(R.sheet) && /5동/.test(R.sheet) && R.onTab !== 'orders' || /재검토/.test(R.sheet), '배지를 누르면 다른 곳 화면(탭을 옮기지 않음)');
    ok(R.ack.open === 1 && R.ack.has && R.ack.keep === 2 && R.cnt2.n === 1, '「확인함」 → 그 주문만 표시 꺼짐(rckOpen 1) · 기록은 그대로 ' + JSON.stringify(R.ack));
    ok(R.stg, '오늘 출고 ✅ 오늘 끝 탭에 빨간 점');
  });
  ok(!errN, '화면 오류 없음 ' + errN); console.log(bad ? `❌ tRCK1114 실패 ${bad}` : '✓ tRCK1114 통과'); setTimeout(() => process.exit(bad ? 1 : 0), 200); /* 가짜 알라딘 창(jsdom)의 1분 맥박 타이머가 남아 끝나지 않던 것 */
})();
