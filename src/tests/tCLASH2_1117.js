// tCLASH2_1117 — (11/17 일꾼 clash2 · 검토 reports/CLASH_1117.md) 엔진 자동 판단 ↔ 등록·수동 일괄 처리 충돌 막기
//   F-2 예스24 자동 재개(y24up)가 사람이 다시 멈춘 것을 되살리지 않음 — 사람 명령(7일) · 최근 14일 다른 판매처 주문 · 못 읽으면 건너뜀
//   F-4 🤖 자동 내림 고르기(omniPick)가 예스24로 옮기는 중(r.reg) · 알라딘 앞선 수정·삭제 진행 중(omniBusy)을 뺌
//   F-5 ✏ 상품 수정 맡기기(peQueue)가 Firestore shp_cmds를 직접 읽어 다른 기기가 앞서 맡긴 같은 칸이 있으면 막음 · 못 읽으면 막음
//   F-6 사후 확인 다시 맡기기(rcHumanWhy)가 네이버도 사람 값 우선
//   F-8 새 주문 고르기도 보내기 직전 다시 셈(omniRecheck → omniStill)
// 실행: node src/tests/tCLASH2_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const fnOf = (name, pre) => { const i = T.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = T.indexOf('{', i); for (let j = k; j < T.length; j++) { if (T[j] === '{') d++; else if (T[j] === '}') { d--; if (!d) return T.slice(i, j + 1); } } throw new Error('함수 끝 없음 ' + name); };
(async () => {
  const L = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, omniPick, omniStill, omniRk };')();
  const I = { now: '2026-11-17T05:00:00Z', days: 30,
    al: [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U4', title: '책4', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S4'] }, { id: 'aladin_U5', title: '책5', price: 3000, qty: 1, live: true, st: '판매중', skus: ['S5'] }],
    y24: [{ no: '900', title: '책1', price: 8500, stock: 1, live: true, self: 'S1', flags: [] }, { no: '904', title: '책4', price: 3000, stock: 1, live: true, self: 'S4', flags: [] }, { no: '905', title: '책5', price: 3000, stock: 1, live: true, self: 'S5', flags: [] }],
    ord: [{ ch: 'yes24', no: 'y1', at: '2026-11-17T04:00:00Z', amt: 8500, lines: [{ sku: 'S1', qty: 1 }] }, { ch: 'aladin', no: 'o4', at: '2026-11-17T04:20:00Z', amt: 3000, lines: [{ lid: 'aladin_U4', qty: 1 }] }, { ch: 'aladin', no: 'o5', at: '2026-11-17T04:30:00Z', amt: 3000, lines: [{ lid: 'aladin_U5', qty: 1 }] }] };
  const from = '2026-11-17T03:00:00Z'; const ks = (P) => P.map((p) => p.T.key + ':' + p.a.ch).sort().join();

  console.log('① F-4 — 예스24로 옮기는 중인 실물은 자동 내림이 안 고름');
  { const TD0 = L.ledTodo(L.ledBuild(I)); ok(ks(L.omniPick(TD0, { from })) === 'S1:aladin,S4:yes24,S5:yes24', '바탕: 세 실물 모두 고름', ks(L.omniPick(TD0, { from })));
    const TD = L.ledTodo(L.ledBuild({ ...I, reg: [{ lid: 'aladin_U4', k: 'sent' }, { lid: 'aladin_U5', k: 'listed' }] })); const t4 = TD.find((x) => x.key === 'S4'), t5 = TD.find((x) => x.key === 'S5');
    ok(t4 && t4.reg === 'sent' && t5 && t5.reg === null, '처리할 일에 옮기는 중 표시(reg) — 다 올라간 것(listed)은 표시 없음', [t4 && t4.reg, t5 && t5.reg]);
    ok(ks(L.omniPick(TD, { from })) === 'S1:aladin,S5:yes24', '옮기는 중(S4) 뺌 · 다 올라간 것(S5)은 그대로 고름', ks(L.omniPick(TD, { from })));
    ok(ks(L.omniPick(TD, { from, bl: 1 })).indexOf('S4') < 0, '밀린 일 고르기(o.bl)에서도 뺌'); }
  console.log('② F-4 — 알라딘 앞선 수정·삭제가 진행 중이면 안 고름(맡겼다가 \'이미 맡김\'으로 닫히지 않게)');
  { const TD = L.ledTodo(L.ledBuild(I)); const P = L.omniPick(TD, { from, busy: (T0, a) => a.ch === 'aladin' && a.id === 'aladin_U1' }); ok(ks(P) === 'S4:yes24,S5:yes24', 'busy가 참인 알라딘 일만 뺌', ks(P));
    const mk = (pend, plist, del, log) => new Function('ledAlPend', 'S', 'prdDelOf', 'CMD_ACTIVE', fnOf('omniBusy') + '\nreturn omniBusy;')(pend, { plist, omni: { log: log || {} } }, del, ['queued', 'running', 'held', 'verify', 'stuck', 'delcheck', 'paused']);
    const T1 = { key: 'S1', last: '2026-11-17T04:00:00Z' }; const a1 = { ch: 'aladin', id: 'aladin_U1' }; const pl = new Map([['aladin_U1', { id: 'aladin_U1' }]]);
    ok(mk(() => ({ st: 'queued' }), pl, () => null)(T1, a1) === true, '판매상태·수량 수정 맡김 진행 중 → 바쁨');
    ok(mk(() => ({ st: 'queued' }), pl, () => null, { 'S1|aladin|down|0|x': { key: 'S1', id: 'aladin_U1', st: 'claim' } })(T1, a1) === false, '앞선 명령이 엔진 자신의 것(맡기다 끊김) → 골라서 \'이미 맡김\'으로 닫음(새 명령 0 · tLED3 그대로)');
    ok(mk(() => ({ st: 'queued' }), pl, () => null, { 'S9|aladin|down|0|x': { key: 'S9', id: 'aladin_U1', st: 'sent' } })(T1, a1) === true, '다른 할 일의 엔진 기록은 내 것이 아님 → 바쁨');
    ok(mk(() => ({ done: 1 }), pl, () => null)(T1, a1) === false, '이미 반영됨(done · 목록 다시 읽기 기다림) → 예전처럼 \'이미 맡김\'으로 닫힘');
    ok(mk(() => ({ fail: 1 }), pl, () => null)(T1, a1) === false, '앞선 맡김이 실패로 끝남 → 바쁘지 않음(다시 고름)');
    ok(mk(() => null, pl, () => ({ c: { status: 'delcheck' } }))(T1, a1) === true && mk(() => null, pl, () => ({ c: { status: 'done' } }))(T1, a1) === false, '삭제 요청 진행 중 → 바쁨 · 삭제 끝남 → 바쁘지 않음');
    ok(mk(() => ({ st: 'queued' }), pl, () => null)(T1, { ch: 'yes24', no: '900' }) === false && mk(() => { throw new Error('x'); }, pl, () => null)(T1, a1) === false, '예스24·네이버는 이 셈 밖 · 셈 오류는 막지 않음(예전 그대로 — 뒤 omniDo \'이미 맡김\' 막이가 남음)'); }
  console.log('③ F-8 — 새 주문 고르기도 보내기 직전 다시 셈');
  { const R = new Function('omniRk', 'omniStill', fnOf('omniRecheck') + '\nreturn omniRecheck;')(L.omniRk, L.omniStill);
    const TD = L.ledTodo(L.ledBuild(I)); const P = L.omniPick(TD, { from }).find((p) => p.T.key === 'S4');
    ok(R(P, TD, { live: true, qty: 1 }).go === 1, '그대로면 보냄');
    ok(!!R(P, TD, { live: false, qty: 1 }).shut, '예스24가 이미 판매중이 아님(사람이 먼저 내림) → 닫음(보내지 않음)');
    const TDc = L.ledTodo(L.ledBuild({ ...I, ord: I.ord.filter((o) => o.no !== 'o4') })); ok(!!R(P, TDc, { live: true, qty: 1 }).wait, '그사이 주문 취소(할 일 없어짐) → 이번엔 안 보냄', R(P, TDc, { live: true, qty: 1 }));
    const TDr = L.ledTodo(L.ledBuild({ ...I, reg: [{ lid: 'aladin_U4', k: 'sent' }] })); ok(/예스24로 옮기는 중/.test(R(P, TDr, { live: true, qty: 1 }).wait || ''), '그사이 예스24로 옮기기가 시작됨 → 이번엔 안 보냄');
    const TDn = L.ledTodo(L.ledBuild({ ...I, ord: [...I.ord, { ch: 'aladin', no: 'o6', at: '2026-11-17T04:50:00Z', amt: 3000, lines: [{ lid: 'aladin_U4', qty: 1 }] }] })); const v = R(P, TDn, { live: true, qty: 1 });
    ok(!!v.wait, '그사이 새 주문(마지막 주문 시각·할 일 열쇠가 바뀜) → 이번엔 안 보냄(다음 셈이 새 열쇠로)', v);
    const tick = cut('async function omniTick(', '\nasync function ') ; ok(/omniRecheck\(P, TD2, omniCur\(P\.T, P\.a\)\)[\s\S]*?const r = await omniDo\(P\)/.test(tick) && /busy: omniBusy/.test(tick), '1분 돌기: 모든 고른 일(새 주문 포함)이 omniDo 앞에서 다시 셈 · 고르기에 omniBusy'); }
  console.log('④ F-5 — 상품 수정 맡기기: Firestore를 직접 읽어 다른 기기가 앞서 맡긴 같은 칸을 막음');
  { const B = new Function(cut('const PE_BUSY_ST', 'async function peQueue') + '\nreturn { peBusyOf, PE_BUSY_ST };')();
    const docs = [{ type: 'prdEdit', status: 'running', ch: { state: '판매중지' }, f: { state: { st: 'running' } } }, { type: 'prdEdit', status: 'done', ch: { price: 9000 } }, { type: 'prdEdit', op: 'read', status: 'queued', ch: {} }, { type: 'regDel', status: 'queued', ch: { qty: 1 } }];
    ok(B.peBusyOf(docs, ['state', 'price']).join() === 'state', '진행 중 판매상태만 겹침 · 끝난 값·읽기·다른 명령은 안 겹침', B.peBusyOf(docs, ['state', 'price']));
    ok(B.peBusyOf(docs, ['qty']).length === 0, '다른 칸은 바로 됨');
    const mkQ = (getImpl) => { const sets = []; const toasts = []; const db = { collection: () => ({ where: () => ({ get: getImpl }), doc: () => ({ id: 'n1', set: async (v) => sets.push(v) }) }) };
      const S = { user: { email: 'x' }, peCmds: new Map() }; const env = { db, S, toast: (m) => (toasts.push(m), m), peWatch: () => {}, peLive: () => false, peFldCmd: () => null, CHF_K: { state: { l: '판매상태' } }, deviceName: () => 'PC', CK: { local: new Set() }, ckSet: () => {}, peRedraw: () => {}, pptCloudUrl: () => '', cloudCall: async () => {}, TS: () => 0 };
      const fn = new Function(...Object.keys(env), cut('const PE_BUSY_ST', 'async function peQueue') + fnOf('peQueue', 'async function ') + '\nreturn peQueue;')(...Object.values(env)); return { fn, sets, toasts }; };
    const l = { id: 'aladin_U1', listingId: '1', title: '책1' };
    { const q = mkQ(async () => ({ docs: [{ id: 'c0', data: () => ({ type: 'prdEdit', status: 'queued', listingKey: 'aladin_U1', ch: { state: '판매중' } }) }] })); const r = await q.fn(l, { state: '판매중지' }, {}, { quiet: 1 }); ok(q.sets.length === 0 && /다른 기기가 앞서 맡긴/.test(r || ''), '다른 기기가 같은 칸을 맡겨 둠(이 기기 기억엔 없음) → 맡기지 않음(겹쳐 쓰기 0)', [r, q.sets.length]); }
    { const q = mkQ(async () => { throw new Error('offline'); }); const r = await q.fn(l, { state: '판매중지' }, {}, { quiet: 1 }); ok(q.sets.length === 0 && /확인 못 함/.test(r || ''), '읽기 실패 → 막음(안전 쪽)', [r, q.sets.length]); }
    { const q = mkQ(async () => ({ docs: [] })); const r = await q.fn(l, { state: '판매중지' }, {}, { quiet: 1 }); ok(q.sets.length === 1 && r === 'n1', '겹침 없음 → 맡김 1건', [r, q.sets.length]); const r2 = await q.fn(l, { state: '판매중지' }, {}, { quiet: 1, force: 1 }); ok(q.sets.length === 2 && r2 === 'n1', '되돌리기 등 force는 예전 그대로'); } }
    { const re = new Function(cut('const OMNI_LATER_RE', '\n') + '\nreturn OMNI_LATER_RE;')(); const od = cut('async function omniDo(', '\nasync function '); const ag = fnOf('ledAlGo', 'async function '); const as = fnOf('omniAlStop', 'async function ');
      const m = /po\.no === 'read' \? '([^']+)'/.exec(ag); const m2 = /po\.no === 'read' \? '([^']+)'/.exec(as);
      ok(m && m2 && re.test(m[1]) && re.test(m2[1]) && !/이미 맡김|진행 중|이미 처리됨/.test(m[1]) && !/이미 맡김|진행 중|이미 처리됨/.test(m2[1]), '엔진 길: 확인 못 함(읽기 실패)은 \'later\'(2분 뒤 다시) — \'dup\'(닫힘)이 아님', [m && m[1], m2 && m2[1]]);
      ok(/const po = \{ quiet: true \}/.test(ag) && /const po = \{ quiet: true \}/.test(as) && od.indexOf('OMNI_LATER_RE.test(why)') > 0, '알라딘 내림·판매중지가 peQueue 사유(po.no)를 받음'); }
  console.log('⑤ F-2 — 예스24 자동 재개가 사람이 다시 멈춘 것을 되살리지 않음');
  { const Y = new Function('const Y24UP_DEF = { on: 1, days: 3, max: 10 };\n' + cut('const Y24UP_HUM_MS', 'const Y24UP_DEF') + fnOf('y24UpPlan') + '\n' + fnOf('y24UpHumOf') + '\nreturn { y24UpPlan, y24UpHumOf };')();
    const now = '2026-11-17T10:00:00Z'; const e = { key: 'SKU1', ch: 'yes24', k: 'down', to: 0, no: '195000001', self: 'SKU1', st: 'sent', at: '2026-11-16T09:00:00Z', title: '시험 책' };
    const row = (o) => ({ key: 'SKU1', title: '시험 책', sku: 'SKU1', ch: { aladin: { live: true, qty: 1, id: 'aladin_U1' } }, mc: { P: 1, sold: 0, rem: 1, acts: [], over: false }, y24c: [{ no: '195000001', self: 'SKU1', live: false }], ord: {}, ord14: {}, ...o });
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: {} }).length === 1, '바탕: 사람 명령 없음 · rem 1 · 다른 주문 없음 → 재개 1건');
    const doc = (at, rows) => ({ k: 'w', at, job: { rows } }); const man = (kind, extra) => ({ rid: 'SKU1|195000001', no: '195000001', kind, ...(extra || {}) });
    const hum1 = Y.y24UpHumOf([doc('2026-11-16T12:00:00Z', [man('stop')])]); ok(hum1['195000001'] && hum1['195000001'][0].kind === 'stop', '사람 판매중지 줄(src 없음)을 사람 명령으로 셈', hum1);
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: hum1 }).length === 0, '사람 y24down(엔진 내림 뒤) → 재개 안 함');
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: Y.y24UpHumOf([doc('2026-11-15T12:00:00Z', [man('stop', { src: 'plat' })])]) }).length === 0, '엔진 내림 앞이라도 7일 안 사람 판매중지(platBulk 포함) → 재개 안 함');
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: Y.y24UpHumOf([doc('2026-11-16T12:00:00Z', [man('qty', { to: 1 })])]) }).length === 0, '엔진 내림 뒤 사람이 수량을 고침 → 재개 안 함(사람 값이 이김)');
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: Y.y24UpHumOf([doc('2026-11-16T12:00:00Z', [man('stop', { src: 'auto' }), man('start', { src: 'y24up' })]), doc('2026-11-16T13:00:00Z', [{ ...man('qty'), src: 'price' }])]) }).length === 1, '자동(auto·y24up) 줄 · 💲 값 바꿈은 사람 명령이 아님 → 재개함');
    ok(Y.y24UpPlan({ log: [e], rows: [row()], now, hum: Y.y24UpHumOf([doc('2026-11-01T00:00:00Z', [man('stop')])]) }).length === 1, '7일 넘은 엔진 내림 앞 사람 멈춤은 쉬는 시간 끝 → 재개함');
    ok(Y.y24UpPlan({ log: [e], rows: [row({ ord14: { naver: { n: 1, first: '2026-11-10T00:00:00Z' } } })], now, hum: {} }).length === 0, '최근 14일 다른 판매처(네이버) 주문 있음 → 재개 안 함');
    ok(Y.y24UpPlan({ log: [e], rows: [row({ ord14: { yes24: { n: 1, first: '2026-11-10T00:00:00Z' } } })], now, hum: {} }).length === 1, '예스24 자기 주문은 이 셈 밖(남은 권수 rem이 따로 봄)');
    ok(Y.y24UpPlan({ log: [e], rows: [row({ mc: { rem: 0, acts: [], over: false } })], now, hum: {} }).length === 0, '장부 남은 권수 0 → 재개 안 함(그대로)');
    const up = cut('function y24UpNow(', 'async function y24UpTick') + cut('async function y24UpTick', '\nfunction ');
    ok(/if \(!hum \|\|/.test(up) && /try \{ hum = await y24UpHum\(\); \} catch \(e\) \{[^}]*st: 'skip'[^}]*\}; return; \}/.test(up) && /qs\.size >= 500\) throw/.test(up) && up.indexOf('y24UpHum()') < up.indexOf('db.runTransaction'), '사람 명령을 못 읽음·500건 넘음 → 이번 돌기 통째로 건너뜀(표 잡기 전)'); }
  console.log('⑥ F-6 — 사후 확인 다시 맡기기: 네이버도 사람 값 우선');
  { const mkH = (get, extra) => new Function('db', 'S', 'aladinLive', 'ledY24W', cut('async function rcHumanWhy(e, a)', 'async function rcRedo(') + '\nreturn rcHumanWhy;')({ collection: () => ({ where: (f, op, v) => ({ get: () => get(f, v) }) }) }, {}, () => true, () => ({}), extra);
    const snap = (L) => ({ forEach: (cb) => L.forEach((v) => cb({ data: () => v })) }); const e = { at: '2026-11-16T09:00:00Z', key: 'S1' }; const a = { ch: 'naver', origin: '1234567', k: 'down', to: 0 };
    let seen = null; const H0 = mkH(async (f, v) => { seen = [f, v]; return snap([]); }); ok((await H0(e, a)) === '' && seen && seen[0] === 'job.originNo' && seen[1] === '1234567', '기록 없음 → 다시 맡겨도 됨 · 원상품번호로 찾음', seen);
    ok(/사람이 네이버 판매상태·수량을 고침/.test(await mkH(async () => snap([{ k: 'job', at: '2026-11-16T12:00:00Z', st: 'done', job: { k: 'status', originNo: '1234567', to: 'SALE' }, led: { src: '' } }]))(e, a)), '맡긴 뒤 사람이 낸 네이버 판매상태 명령 → 다시 맡기지 않음');
    ok(/다시 판매중\(사람이 되살림\)/.test(await mkH(async () => snap([{ k: 'job', at: '2026-11-16T09:01:00Z', st: 'done', job: { k: 'status', to: 'SUSPENSION' }, led: { src: 'auto' } }]))(e, a)), '우리 자동 판매중지가 끝났는데 아직 할 일이 남음 → 사람이 되살림(다시 맡기지 않음)');
    ok((await mkH(async () => snap([{ k: 'job', at: '2026-11-16T09:01:00Z', st: 'new', job: { k: 'status' }, led: { src: 'auto' } }, { k: 'job', at: '2026-11-16T10:00:00Z', st: 'done', job: { k: 'price', price: 9000 } }, { k: 'job', at: '2026-11-15T10:00:00Z', st: 'done', job: { k: 'status' }, led: {} }, { k: 'job', at: '2026-11-16T11:00:00Z', st: 'cancelled', job: { k: 'status' }, led: {} }]))(e, a)) === '', '아직 진행 중인 우리 맡김 · 💱 값 따라가기 · 맡기기 앞 기록 · 사람이 취소한 것 → 사람 손 아님');
    ok(/못 읽음/.test(await mkH(async () => { throw new Error('offline'); })(e, a)), '기록을 못 읽음 → 사람 확인(다시 맡기지 않음)');
    ok(/원상품번호 없음/.test(await mkH(async () => snap([]))(e, { ch: 'naver' })), '원상품번호 없음 → 사람 확인'); }
  console.log('⑦ 브라우저 창 없음');
  { const src = [fnOf('omniBusy'), fnOf('omniRecheck'), cut('const PE_BUSY_ST', 'async function peQueue'), fnOf('peQueue', 'async function '), fnOf('y24UpHumOf'), fnOf('y24UpHum', 'async function '), cut('async function rcHumanWhy(e, a)', 'async function rcRedo(')].join('\n'); ok(!/\b(alert|confirm|prompt)\(/.test(src), '새 코드에 alert·confirm·prompt 없음'); }
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
