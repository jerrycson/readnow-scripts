// tBBYpc — 정범님 11/03: 🛑 장바구니 담김 → 판매중지를 PC 수집기가 담은 직후 맡음(웹앱이 꺼져 있어도) · 웹앱과 겹쳐도 한 번만(prd_system/buyback.auto 트랜잭션)
//          수집기 원본에서 c2bAutoStop 덩어리(◆ 표시 사이)와 c2bCartQty·c2bLimitOf를 떼어 가짜 Firestore로 돌림(tCHpw.js 방식) · 판매중지 이유 표 STOP_TXT에 폐기
// 실행: node src/tests/tBBYpc.js [수집기 원본 경로]  (기본: src/readnow-collector.src.js · pw/ 사본은 ../readnow-collector.user.js)
const fs = require('fs'); const path = require('path');
const SRC = process.argv[2] || [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p));
const src = fs.readFileSync(SRC, 'utf8'); let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const a = src.indexOf('  /* ◆c2bAutoStop 시작'); const b = src.indexOf('  /* ◆c2bAutoStop 끝 */'); if (a < 0 || b < a) { console.log('❌ 수집기에서 c2bAutoStop 덩어리를 못 찾음'); process.exit(1); }
const qa = src.indexOf('  function c2bCartQty('); const qb = src.indexOf('  function c2bFrame('); if (qa < 0 || qb < qa) { console.log('❌ c2bCartQty를 못 찾음'); process.exit(1); }
// ── 가짜 Firestore (문서 get/set merge · 트랜잭션 차례로 · where == · add/doc 자동 번호 · arrayUnion · delete)
const FS = {}; let auto = 0; const DEL = { __del: 1 }; const AU = (...x) => ({ __au: x });
const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x === DEL) delete o[k]; else if (x && x.__au) o[k] = [...(Array.isArray(o[k]) ? o[k] : []), ...x.__au]; else if (x && typeof x === 'object' && !Array.isArray(x)) o[k] = merge(o[k] && typeof o[k] === 'object' ? o[k] : {}, x); else o[k] = x; } return o; };
const dref = (c, id) => ({ id, _c: c, get: async () => { const v = (FS[c] || {})[id]; return { exists: !!v, data: () => (v ? JSON.parse(JSON.stringify(v)) : undefined) }; }, set: async (v, o) => { FS[c] = FS[c] || {}; FS[c][id] = o && o.merge ? merge(FS[c][id], v) : merge({}, v); } });
const C = (c) => ({ doc: (id) => dref(c, id || 'auto' + ++auto), where: (f, op, val) => ({ get: async () => ({ docs: Object.entries(FS[c] || {}).filter(([, d]) => d[f] === val).map(([id, d]) => ({ id, data: () => d })) }) }) });
let q = Promise.resolve(); const db = { runTransaction: (fn) => { const run = q.then(async () => { const W = []; const tx = { get: (r) => r.get(), set: (r, v, o) => W.push([r, v, o]) }; const out = await fn(tx); for (const [r, v, o] of W) await r.set(v, o); return out; }); q = run.catch(() => {}); return run; } };
const firebase = { firestore: { FieldValue: { delete: () => DEL, arrayUnion: AU, serverTimestamp: () => 'TS' } } };
const X = new Function('C', 'db', 'firebase', 'auth', 'nowIso', 'PC_NAME', 'TS', 'log', src.slice(a, b) + '\n' + src.slice(qa, qb) + '\nreturn { c2bAutoStop, c2bCartQty, c2bLimitOf };')(C, db, firebase, { currentUser: { email: 'pc@x' } }, () => new Date().toISOString(), 'JS-MAIN', () => 'TS', () => {});
const BB = () => FS.prd_system.buyback; const edits = (lk) => Object.entries(FS.shp_cmds || {}).map(([id, c]) => ({ id, ...c })).filter((c) => c.type === 'prdEdit' && c.listingKey === lk);
const L = (uc, st, qty, extra) => { FS.prd_listings = FS.prd_listings || {}; FS.prd_listings['aladin_' + uc] = { usedCode: uc, listingId: '50' + uc.slice(1), title: '책 ' + uc, status: st, qty, sku: 'BLK_' + uc, ...(extra || {}) }; };
const cart = (k, st, at, isbn) => ({ [k]: { state: st, at, by: 'JS-MAIN', isbn13: isbn, stopPc: true } });
(async () => {
  const since = new Date(Date.now() - 3600e3).toISOString(); const now = () => new Date().toISOString(); const old = new Date(Date.now() - 7200e3).toISOString();
  FS.prd_system = { buyback: { autoCfg: { on: true, since } } };
  L('U1', '판매중', 1); L('U2', '판매중', 2); L('U3', '판매중지', 1); L('U5', '판매중', 1); L('U6', '판매중', 1); L('U7', '판매중', 1); L('U8', '판매중', 1);
  FS.prd_stop_reasons = { aladin_U1: { reason: 'check', history: [] } };
  const t1 = now(); await dref('prd_system', 'buyback').set({ cart: { ...cart('U1', 'added', t1, '9791100000001'), ...cart('U2', 'added', t1, '9791100000002'), ...cart('U3', 'added', t1, '9791100000003'), ...cart('REG_r1', 'added', t1, '9791100000004'), ...cart('U5', 'added', old, '9791100000005'), ...cart('U6', 'already', t1, '9791100000006'), ...cart('U6b', 'added', t1, '9791100000006'), ...cart('U7', 'added', t1, '9791100000007'), ...cart('U8', 'added', t1, '9791100000008') } }, { merge: true });
  const it = (k, extra) => ({ usedCode: k, isbn13: (BB().cart[k] || {}).isbn13, title: '책 ' + k, listingUsedCode: k.startsWith('REG_') ? null : k, ...(extra || {}) }); const r = (k) => ({ ...BB().cart[k] });
  // ① 하나뿐인 매물: 판매중지 맡김 + 이유 + 기록 · 웹앱(같은 순간)과 겹쳐도 한 번
  const webClaim = db.runTransaction(async (tx) => { const d = await tx.get(dref('prd_system', 'buyback')); const v = d.data() || {}; const cs = v.cart.U1; const a0 = (v.auto || {}).U1; if (a0 && a0.cartAt === cs.at) return false; tx.set(dref('prd_system', 'buyback'), { auto: { U1: { cartAt: cs.at, st: 'claim', dev: '웹앱', at: now() } } }, { merge: true }); return true; }); /* 웹앱 bhStopRun과 같은 잡기 */
  const [w1, p1] = await Promise.all([webClaim.then((x) => x), X.c2bAutoStop(it('U1'), r('U1'))]); /* 웹앱이 먼저 잡으면 수집기는 건너뜀 · 반대면 웹앱이 건너뜀 */
  const r1b = await X.c2bAutoStop(it('U1'), r('U1')); /* 같은 담기 다시 → 건너뜀 */
  ok((w1 ? p1.st === 'skip' : p1.st === 'done') && r1b.st === 'skip', `웹앱과 같은 순간이어도 맡는 쪽은 하나(웹앱 ${w1 ? '먼저' : '건너뜀'} · 수집기 ${p1.st}/${p1.why || ''}) · 다시 불러도 건너뜀(${r1b.why})`);
  // 웹앱이 먼저 잡은 경우를 피하려고 다음은 수집기 혼자
  FS.prd_system.buyback.auto = {}; delete FS.prd_system.buyback.sold; FS.shp_cmds = {};
  const s1 = await X.c2bAutoStop(it('U1'), r('U1')); const s1b = await X.c2bAutoStop(it('U1'), r('U1')); const e1 = edits('aladin_U1'); const sr = FS.prd_stop_reasons.aladin_U1;
  ok(s1.st === 'done' && s1b.st === 'skip' && e1.length === 1 && e1[0].ch.state === '판매중지' && e1[0].before.state === '판매중' && e1[0].status === 'queued' && e1[0].f.state.st === 'queued' && e1[0].from === 'c2bAuto', `판매중 매물 → prdEdit 판매중지 한 번(${e1.length}) · 상품 정보 수정 길 그대로`);
  ok(sr.reason === 'elsewhere' && sr.history.length === 1 && sr.history[0].from === 'check' && sr.history[0].to === 'elsewhere', "판매중지 이유 '다른 판매처에서 판매'(이전 이유 기록)");
  const so1 = BB().sold.U1, au1 = BB().auto.U1; if (process.env.V) console.log(JSON.stringify({ so1, au1 })); ok(so1 && so1.state === 'stop' && so1.auto && so1.pc && so1.cmd === e1[0].id && so1.prevReason === 'check' && !('undone' in so1) && au1.st === 'done' && au1.pc && au1.cartAt === BB().cart.U1.at && au1.dev === 'JS-MAIN', '기록: sold(stop·auto·pc·cmd) · auto(done · 그 담기 때 · 맡은 PC)');
  ok((BB().log || []).some((x) => x.act === 'autoStop' && x.pc && x.codes[0] === 'U1'), '기록(log) autoStop');
  // ② 수량 2권 매물 → 수량 −1(판매중지 아님) · 이유는 바꾸지 않음
  const s2 = await X.c2bAutoStop(it('U2'), r('U2')); const e2 = edits('aladin_U2'); ok(s2.st === 'done' && e2.length === 1 && e2[0].ch.qty === 1 && e2[0].qtyAdd === -1 && e2[0].qtyWeb === 2 && BB().sold.U2.state === 'qty' && !(FS.prd_stop_reasons || {}).aladin_U2, '여러 권 매물 = 수량 −1(qtyAdd) · 판매중지·이유 그대로');
  // ③ 이미 판매중지 매물 = 기록만 + 이유 · 등록 상품 = 기록만
  const s3 = await X.c2bAutoStop(it('U3'), r('U3')); const s4 = await X.c2bAutoStop(it('REG_r1'), r('REG_r1'));
  ok(s3.st === 'done' && edits('aladin_U3').length === 0 && BB().sold.U3.state === 'record' && FS.prd_stop_reasons.aladin_U3.reason === 'elsewhere' && s4.st === 'done' && BB().sold.REG_r1.state === 'record' && BB().sold.REG_r1.kind === 'reg', '판매중 아닌 매물·등록 상품 = 기록만(수정 안 맡김)');
  // ④ 하지 않는 것: 자동을 켜기 전 담김 · 같은 ISBN 여럿의 '이미 있음' · 꺼 둠 · 진행 중 수정 · 담긴 뒤 검토
  const s5 = await X.c2bAutoStop(it('U5'), r('U5')); const s6 = await X.c2bAutoStop(it('U6'), r('U6'));
  ok(s5.st === 'skip' && /켜기 전/.test(s5.why) && edits('aladin_U5').length === 0, '자동을 켜기 전에 담긴 책은 하지 않음: ' + s5.why);
  ok(s6.st === 'skip' && /같은 ISBN/.test(s6.why) && edits('aladin_U6').length === 0, "같은 ISBN 여럿의 '이미 있음'은 사람 확인: " + s6.why);
  FS.shp_cmds.busy1 = { type: 'prdEdit', status: 'queued', listingKey: 'aladin_U7', ch: { state: '판매중지' } }; const s7 = await X.c2bAutoStop(it('U7'), r('U7'));
  ok(s7.st === 'fail' && BB().auto.U7.st === 'fail' && /진행 중/.test(BB().auto.U7.why) && !BB().sold.U7 && edits('aladin_U7').length === 1, '앞서 맡긴 수정이 진행 중이면 실패로 적음(웹앱 「판매중지 다시」)');
  await dref('prd_system', 'buyback').set({ rev: { U8: { at: now(), by: 'x' } } }, { merge: true }); const s8 = await X.c2bAutoStop(it('U8'), r('U8')); ok(s8.st === 'skip' && /관리자/.test(s8.why), '담긴 뒤 검토로 옮긴 책은 하지 않음');
  await dref('prd_system', 'buyback').set({ autoCfg: { on: false } }, { merge: true }); FS.prd_system.buyback.rev = {}; const s8b = await X.c2bAutoStop(it('U8'), r('U8')); ok(s8b.st === 'skip' && /꺼 둠/.test(s8b.why), '자동을 꺼 두면 하지 않음');
  // ⑤ 처음(자동 켠 때 없음) — 이 담기부터
  FS.prd_system.buyback.autoCfg = {}; const s9 = await X.c2bAutoStop(it('U8'), r('U8')); ok(s9.st === 'done' && BB().autoCfg.since === BB().cart.U8.at && BB().autoCfg.on === true, '자동 켠 때가 없으면 이 담기 때로 처음 켬');
  // ⑥ 팔기 장바구니 수량·한도 글
  const row = (t, els) => ({ textContent: t, querySelectorAll: () => els }); const doc = { querySelectorAll: () => [row('책 ISBN13 : 9791100000001', [{ tagName: 'INPUT', name: 'txtQty_1', value: '2', type: 'text' }]), row('책 ISBN13 : 9791100000002 수량: 3', []), row('책 ISBN13 : 9791100000003', []), row('책 ISBN13 : 9791100000003', [])] };
  const Q = X.c2bCartQty(doc); ok(Q.qty.get('9791100000001') === 2 && Q.qty.get('9791100000002') === 3 && Q.qty.get('9791100000003') === 2 && /txtQty_1=2/.test(Q.raw.get('9791100000001')), '장바구니 수량: 수량 칸 2 · 글 3 · 줄 둘 = 2 · 칸 모양 기록');
  ok(X.c2bLimitOf('동일 상품은 최대 2권까지 팔기 신청이 가능합니다') === 2 && X.c2bLimitOf('3권 초과 매입 불가') === 3 && X.c2bLimitOf('팔기 장바구니에 담았습니다.') === null, '알림 글에서 한도 숫자(글에 있을 때만)');
  // ⑦ 판매중지 이유 표(알라딘 화면 표시)에 폐기
  const st = src.match(/const STOP_TXT = (\{[^\n]*?\});/); ok(st && /disp: \['🗑 폐기'/.test(st[1]), "수집기 판매중지 이유 표에 '🗑 폐기'");
  console.log(bad ? `❌ tBBYpc 실패 ${bad}` : '✓ tBBYpc 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
