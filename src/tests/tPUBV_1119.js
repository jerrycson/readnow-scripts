// tPUBV_1119 — (11/19 pubv1 · 정범님 I-1119-2332-43) 공개 반영 확인을 「직접 열어 보세요」로 끝내지 않고 반영될 때까지 · 10원 단위 막힘의 진짜 원인 · 「카드로 가기」 → 안쪽 창
//  ① 새상품 번호(ItemId) 없음 → 책 기록·ISBN으로 알라딘 상품 페이지에서 찾아 채우고 목록 확인을 이어 감 · ISBN이 다르면 안 씀 · 끝내 못 찾으면 우리 상품 페이지로 확인
//  ② 첫 바퀴(48시간)에 못 보면 끝내지 않고 다시 확인 바퀴 · 다시 확인 바퀴까지 다 쓰면 hand(해 본 것 남김) · 정밀 표본(verifyPg)은 예전 그대로
//  ③ 10원 단위: 감시기가 보내기 전에 올림 · 「돌려준 값(12,010)이 보낸 가격(12001)과 다름」 막힘은 다시 보내지 않고 반영됨으로 + 확인 이어 감(한 번만 · 옛 까닭 남김)
//  ④ 이미 끝난 옛 실패는 한 번만 다시 줄 세움(표 · 옛 확인은 verifyHist에 덧붙임 · 같은 상품은 가장 늦은 것만) ⑤ 웹앱 진행 칸 「카드 보기」 = 안쪽 창(spwOpen) · 화면 안 옮김
// 실행: node tPUBV_1119.js · 시험 자료에 손님 정보 없음(상품 번호만 · '손님A'도 안 씀) · 가짜 Firestore만(운영 자료·prd_locks 안 건드림)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const find = (L) => L.map((x) => path.resolve(__dirname, x)).find((x) => fs.existsSync(x));
const PW = fs.readFileSync(process.env.RN_PW || find(['../../readnow-price-watch.user.js', '../readnow-price-watch.user.js']), 'utf8');
const APP = fs.readFileSync(process.env.RN_APP || find(['../app.html', '../../src/app.html']), 'utf8');
const cutOf = (T, a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i + a.length); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const H = 3600e3; const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();

/* 가짜 Firestore — set(merge)는 깊게 합침 · arrayUnion · where '=='·'in'(점 경로) · 트랜잭션은 차례대로 */
function fakeDb() { const S = new Map(); let seq = 0; const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__au) o[k] = [...(Array.isArray(o[k]) ? o[k] : []), ...v.__au.filter((x) => !(o[k] || []).some((y) => JSON.stringify(y) === JSON.stringify(x)))]; else if (v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = merge(o[k], v); else o[k] = v; } return o; };
  const pathGet = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const ref = (col, id) => ({ id, path: col + '/' + id, get: async () => snap(col, id), set: async (d, o) => put(col, id, d, o) });
  const snap = (col, id) => { const v = S.get(col + '/' + id); return { id, exists: v !== undefined, ref: ref(col, id), data: () => clone(v) }; };
  const put = (col, id, d, o) => { const k = col + '/' + id; const strip = (x) => JSON.parse(JSON.stringify(x, (kk, v) => (v && v.__au ? v.__au : v))); S.set(k, o && o.merge ? merge(S.get(k), d) : strip(d)); };
  const coll = (col, F = []) => ({ doc: (id) => ref(col, id == null ? 'auto' + ++seq : String(id)), where: (f, op, v) => coll(col, [...F, [f, op, v]]),
    get: async () => { const docs = [...S.keys()].filter((k) => k.startsWith(col + '/') && k.indexOf('/', col.length + 1) < 0).map((k) => snap(col, k.slice(col.length + 1))).filter((d) => F.every(([f, op, v]) => { const x = pathGet(d.data(), f); return op === '==' ? x === v : op === 'in' ? v.includes(x) : false; })); return { docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn) }; } });
  const db = { collection: (n) => coll(n), runTransaction: async (fn) => fn({ get: async (r) => r.get(), set: (r, d, o) => r.set(d, o), update: (r, d) => r.set(d, { merge: true }) }) };
  return { db, S, put, get: (col, id) => clone(S.get(col + '/' + id)) }; }

/* 감시기 확인 덩어리를 그대로 떼어 가짜 세상에서 돌림 */
const VBLK = cutOf(PW, '  const V_STEPS = [', '\n  const vMatch') + '\n' + PW.match(/\n  const vMatch = [^\n]*/)[0];
const RFBLK = PW.match(/\n  function listingSync\(tx, lref, ls, a, aid\) \{[\s\S]*?\n  async function settle\(/)[0].replace(/\n  async function settle\($/, '');
function world(pages) { const F = fakeDb(); const calls = []; const logs = [];
  const P = { parseProductPage: (doc) => doc.prod || {}, parseUsedPage: (doc) => ({ listings: doc.rows || [] }), parseUsedItemPrice: (doc) => doc.item || null };
  const aladinDoc = async (u) => { calls.push(u); const d = pages[u]; if (d instanceof Error) throw d; return { ...(d || {}), querySelectorAll: () => [] }; };
  const firebase = { firestore: { FieldValue: { arrayUnion: (...x) => ({ __au: x }) } } };
  const env = { C: (n) => F.db.collection(n), db: F.db, P, aladinDoc, W: () => ({ by: 'test' }), VER: '0.10.72', PC: 'PC-T', log: (m) => logs.push(m), firebase, SREF: F.db.collection('prd_system').doc('pricing'), PR: { VERSION: 'p-test' }, stop: false, SET: {}, isMine: () => true, quietNow: () => false, pxlLagW: () => Promise.resolve() }; /* (1120) 공개 반영 평균 기록은 덩어리 밖 함수 — 여기선 빈 것(그 셈은 tLAGSTALL_1120·tPRLOCK_1120) */
  const names = Object.keys(env); const M = new Function(...names, RFBLK + '\n' + VBLK + '\nreturn { vJudge, verifyBook, vNextOf, vFindItem, vRequeue, roundFixOf, roundFixOne, roundFixOnce, ceil10, vMoved, V_RETRY, VID, listingSync };')(...names.map((k) => env[k]));
  return { F, M, calls, logs }; }
const actOf = (F, id, a) => { F.put('prd_price_actions', id, a); const r = F.db.collection('prd_price_actions').doc(id); return { id, ref: r, ...F.get('prd_price_actions', id) }; };
const due = () => ({ state: 'wait', n: 3, si: 4, next: isoAgo(60000) });

(async () => {
  console.log('① 새상품 번호(ItemId) 없음 → ISBN으로 찾아 채우고 목록 확인을 이어 감');
  { const { F, M, calls } = world({ '/shop/wproduct.aspx?ISBN=9790000000017': { prod: { aladinItemId: 777, isbn13: '9790000000017' } }, '/shop/UsedShop/wuseditemall.aspx?ItemId=777&TabType=0': { rows: [{ listingId: 'L1', usedCode: 'U1', price: 9000 }] } });
    F.put('prd_listings', 'aladin_U1', { bookId: 'B1', isbn13: '9790000000017', listingId: 'L1', price: 9000 }); F.put('prd_books', 'B1', { title: '시험 책' }); F.put('prd_price_decisions', 'aladin_U1', { approvalState: 'done' });
    const a = actOf(F, 'A1', { key: 'aladin_U1', usedCode: 'U1', listingId: 'L1', from: 10000, to: 9000, at: isoAgo(2 * H), aladinItemId: null, verify: due() });
    await M.verifyBook([a]); const A = F.get('prd_price_actions', 'A1');
    ok(A.verify.state === 'ok' && A.aladinItemId === '777' && A.itemIdFill && /^isbn:/.test(A.itemIdFill.by), 'ISBN13으로 알라딘 상품 페이지 → ItemId 777 → 온라인 중고 목록에서 새 가격 봄 = 성공', A);
    ok(F.get('prd_books', 'B1').aladinItemId === '777' && F.get('prd_price_decisions', 'aladin_U1').aladinItemId === '777', '책 기록·결정에도 채움(비어 있을 때만) — 다음부터 바로 씀');
    ok(calls[0] === '/shop/wproduct.aspx?ISBN=9790000000017' && calls.some((u) => /wuseditemall\.aspx\?ItemId=777/.test(u)), '찾는 길 차례: ISBN 상품 페이지 → 목록', calls); }
  { const { F, M } = world({ '/shop/wproduct.aspx?ISBN=9790000000017': { prod: { aladinItemId: 555, isbn13: '9790000000099' } }, '/shop/wproduct.aspx?ItemId=L2': { item: { price: 9000, sellerCode: '996008' } } });
    F.put('prd_listings', 'aladin_U2', { isbn13: '9790000000017', listingId: 'L2' });
    const a = actOf(F, 'A2', { key: 'aladin_U2', usedCode: 'U2', listingId: 'L2', from: 10000, to: 9000, at: isoAgo(2 * H), verify: due() });
    await M.verifyBook([a]); const A = F.get('prd_price_actions', 'A2');
    ok(!A.aladinItemId && A.verify.state === 'ok' && A.verify.via === 'page' && A.verify.noItem && A.verify.noItem.tried.includes('9790000000017'), 'ISBN이 다른 책으로 가면 안 씀 → 우리 상품 페이지 판매가로 확인 = 성공(끝내지 않음)', A); }
  { const { F, M } = world({}); const a = actOf(F, 'A3', { key: 'aladin_U3', usedCode: 'U3', listingId: null, from: 10000, to: 9000, at: isoAgo(2 * H), verify: due() });
    await M.verifyBook([a]); const v = F.get('prd_price_actions', 'A3').verify;
    ok(v.state === 'wait' && v.errs === 1 && /없음/.test(v.lastErr) && v.next, '번호도 상품번호도 없으면 noitem으로 끝내지 않고 다음 때 다시(오류 남김)', v); }

  console.log('② 첫 바퀴에 못 보면 다시 확인 바퀴 · 다 쓰면 hand(해 본 것)');
  { const { M } = world({}); const a = { at: isoAgo(50 * H), from: 10000, to: 9000, verify: {} };
    const x1 = M.vJudge({ state: 'wait', n: 20, si: 20, old: 19 }, a, 10000, true, new Date().toISOString());
    ok(x1.state === 'wait' && x1.rb && x1.round === 2 && x1.next && Date.parse(x1.next) > Date.now() && x1.old === 20, '48시간 지나도 옛 값 → timeout으로 끝내지 않고 2바퀴째 다시 확인(1시간쯤 뒤)', x1);
    const x2 = M.vJudge({ state: 'wait', n: 40, si: M.V_RETRY.length - 1, rb: isoAgo(15 * 24 * H), round: 2, notFound: 40 }, a, null, false, new Date().toISOString());
    ok(x2.state === 'hand' && x2.why === 'notfound' && x2.notFound === 41 && x2.n === 41 && x2.doneAt, '다시 확인 바퀴(14일)까지 다 써야 hand · 까닭·횟수 남김', x2);
    const x3 = M.vJudge({ state: 'wait', n: 20, si: 40 }, a, 10000, true, new Date().toISOString(), true);
    ok(x3.state === 'timeout', '정밀 표본 상품 페이지(verifyPg)는 예전처럼 48시간에서 끝(목록 확인이 이어 감)', x3);
    const x4 = M.vJudge({ state: 'wait', n: 3, si: 0, rb: isoAgo(5 * 60000), round: 2 }, a, 9000, true, new Date().toISOString());
    ok(x4.state === 'ok', '다시 확인 바퀴에서 새 가격 보이면 성공', x4); }
  { const { F, M } = world({ '/shop/UsedShop/wuseditemall.aspx?ItemId=88&TabType=0': { rows: [] }, '/shop/wproduct.aspx?ItemId=L4': { item: { price: 9000, sellerCode: '996008' } } });
    const a = actOf(F, 'A4', { key: 'aladin_U4', usedCode: 'U4', listingId: 'L4', aladinItemId: '88', from: 10000, to: 9000, at: isoAgo(3 * H), verify: { ...due(), notFound: 2 } });
    await M.verifyBook([a]); const v = F.get('prd_price_actions', 'A4').verify; ok(v.state === 'ok' && v.via === 'page', '목록에서 거듭 못 찾으면 우리 상품 페이지도 봄 — 새 가격이면 성공', v); }
  { const { F, M } = world({}); F.put('prd_price_actions', 'A5b', { key: 'aladin_U5', at: isoAgo(1 * H), to: 8000, kind: 'batch' });
    const a = actOf(F, 'A5', { key: 'aladin_U5', usedCode: 'U5', listingId: 'L5', aladinItemId: '99', from: 10000, to: 9000, at: isoAgo(60 * H), verify: { ...due(), rb: isoAgo(2 * H), round: 2 } });
    await M.verifyBook([a]); const v = F.get('prd_price_actions', 'A5').verify; ok(v.state === 'moved' && /또 바꿈/.test(v.note), '다시 확인 바퀴 중 뒤에 같은 상품 가격을 또 바꿨으면 moved(새 반영이 이어 받음)', v); }

  console.log('③ 10원 단위 — 진짜 원인 고침 · 막힌 것 풀기(한 번만)');
  { const { M } = world({});
    ok(M.ceil10(12001) === 12010 && M.ceil10(12010) === 12010 && M.ceil10(9995) === 10000, '알라딘처럼 10원 단위 올림');
    ok(JSON.stringify(M.roundFixOf({ execNote: '알라딘이 돌려준 값(12,010)이 보낸 가격(12001)과 다름' })) === '{"ret":12010,"sent":12001}', '「돌려준 값(12,010)이 보낸 가격(12001)과 다름」 = 10원 단위 올림');
    ok(M.roundFixOf({ execNote: '알라딘이 돌려준 값(12,500)이 보낸 가격(12001)과 다름' }) === null && M.roundFixOf({ execNote: '알라딘이 돌려준 값(12,000)이 보낸 가격(12000)과 다름' }) === null, '진짜로 다른 값(12,500)·같은 값은 풀지 않음(막힘 그대로)');
    ok(/const price = ceil10\(price0\)/.test(PW) && /await settlePush\(|sendPrice|price\b/.test(PW) && !/const price = Math\.round\(kind === 'manual'/.test(PW), '감시기가 보내기 전에 10원 단위로 맞춤(잠금 검사·보내기·기록 모두 이 값)');
    ok(/asked: price0/.test(PW) && /정한 값 \$\{price0\}원 → 알라딘 10원 단위/.test(PW), '정한 값과 보낸 값이 다르면 기록·까닭에 둘 다 남김'); }
  { const { F, M } = world({}); const at = isoAgo(5 * H);
    F.put('prd_price_decisions', 'aladin_U6', { approvalState: 'blocked', title: '시험 책 6', usedCode: 'U6', listingId: 'L6', execFailAt: at, execNote: '알라딘이 돌려준 값(12,010)이 보낸 가격(12001)과 다름', approval: { price: 12001, at: isoAgo(6 * H), batchId: 'g1', batchName: '시험 묶음', decision: 'batch', expectPrice: 13000 } });
    F.put('prd_listings', 'aladin_U6', { price: 13000, lastSeenAt: isoAgo(9 * H) });
    F.put('prd_price_decisions', 'aladin_U7', { approvalState: 'blocked', execNote: '알라딘이 돌려준 값(12,500)이 보낸 가격(12001)과 다름', approval: { price: 12001 } });
    await M.roundFixOnce(); const D = F.get('prd_price_decisions', 'aladin_U6'); const acts = [...F.S.keys()].filter((k) => k.startsWith('prd_price_actions/')).map((k) => F.S.get(k));
    ok(D.approvalState === 'done' && D.roundFix && /돌려준 값\(12,010\)/.test(D.roundFix.was) && D.roundFix.sent === 12001 && D.roundFix.ret === 12010 && /10원 단위/.test(D.execNote), '막힘 → 반영됨(다시 보내지 않음) · 옛 까닭은 roundFix.was에 그대로', D);
    ok(acts.length === 1 && acts[0].to === 12010 && acts[0].asked === 12001 && acts[0].from === 13000 && acts[0].batchId === 'g1' && acts[0].verify.state === 'wait' && acts[0].roundFix, '반영 기록을 남겨 ④ 공개 반영 확인을 이어 감(그룹 진행 칸에 잡힘)', acts[0]);
    ok(F.get('prd_listings', 'aladin_U6').price === 12010, '그 뒤 수집기가 안 본 상품 기록은 새 값으로');
    ok(F.get('prd_price_decisions', 'aladin_U7').approvalState === 'blocked', '진짜로 다른 값은 막힘 그대로');
    const s1 = F.get('prd_system', 'pricing').roundFix; await M.roundFixOnce(); const acts2 = [...F.S.keys()].filter((k) => k.startsWith('prd_price_actions/')).length;
    ok(s1.state === 'done' && s1.n === 1 && acts2 === 1, '한 번만(표 prd_system/pricing.roundFix) — 다시 돌려도 더 안 만듦', s1); }

  console.log('④ 이미 끝난 옛 실패 — 한 번만 다시 줄 세움');
  { const { F, M } = world({});
    F.put('prd_price_actions', 'O1', { key: 'aladin_K1', at: isoAgo(5 * 24 * H), to: 9000, verify: { state: 'timeout', n: 21, old: 21, doneAt: isoAgo(3 * 24 * H) } });
    F.put('prd_price_actions', 'O2', { key: 'aladin_K1', at: isoAgo(2 * 24 * H), to: 8800, verify: { state: 'notfound', n: 21, notFound: 21, doneAt: isoAgo(1 * 24 * H) } });
    F.put('prd_price_actions', 'O3', { key: 'aladin_K2', at: isoAgo(4 * 24 * H), to: 7000, verify: { state: 'noitem', doneAt: isoAgo(4 * 24 * H) } });
    F.put('prd_price_actions', 'O4', { key: 'aladin_K3', at: isoAgo(4 * 24 * H), to: 7000, verify: { state: 'ok' } });
    const n = await M.vRequeue(); const o1 = F.get('prd_price_actions', 'O1'), o2 = F.get('prd_price_actions', 'O2'), o3 = F.get('prd_price_actions', 'O3');
    ok(n === 3 && o2.verify.state === 'wait' && o2.verify.round === 2 && o2.verify.rb && o2.verify.prev === 'notfound' && o3.verify.state === 'wait' && o3.verify.prev === 'noitem', '같은 상품은 가장 늦은 반영만 다시 확인 바퀴로 · noitem도', [o2.verify, o3.verify]);
    ok(o1.verify.state === 'moved' && o1.verify.prev === 'timeout', '앞의 반영은 moved(뒤 반영이 이어 받음)', o1.verify);
    ok([o1, o2, o3].every((o) => o.verifyRequeue && o.verifyRequeue.ver === '0.10.72' && Array.isArray(o.verifyHist) && o.verifyHist.length === 1 && o.verifyHist[0].state) && o2.verifyHist[0].notFound === 21, '표(verifyRequeue)를 남기고 옛 확인은 verifyHist에 덧붙임(지우지 않음)');
    ok(!F.get('prd_price_actions', 'O4').verifyRequeue, '성공한 것은 안 건드림');
    F.put('prd_price_actions', 'O2', { verify: { state: 'notfound', n: 50 } }, { merge: true }); const n2 = await M.vRequeue();
    ok(n2 === 0 && F.get('prd_price_actions', 'O2').verify.state === 'notfound', '두 번째로는 다시 줄 세우지 않음(한 번만)', n2);
    ok(/roundFixOnce\(\)\.catch/.test(PW) && /const rq = await vRequeue\(\)/.test(PW), '감시기 켜질 때 한 번(한 PC만) 돌림'); }

  console.log('⑤ 웹앱 — 진행 칸 「카드 보기」 = 안쪽 창 · 화면 안 옮김 · 10원 단위 확정');
  { const D = cutOf(APP, 'function drawBatchRes(', '\nfunction '); const line = D.split('\n').find((l) => /querySelectorAll\('\[data-bpgo\]'\)/.test(l));
    const run = (cfg) => { const spw = [], go = []; const b = { dataset: { bpgo: 'aladin_X1' } }; const res = { querySelectorAll: (q) => (q === '[data-bpgo]' ? [b] : []) };
      new Function('res', 'SEENP', 'spwOpen', 'goK', line)(res, { cfg }, (k) => spw.push(k), (k) => go.push(k)); b.onclick(); return { spw, go }; };
    const r1 = run({ key: 'batch', spw: {} }); ok(r1.spw[0] === 'aladin_X1' && !r1.go.length, '수동 일괄 화면 → spwOpen(안쪽 창) · goK(화면 옮김) 안 부름', r1);
    const r2 = run(null); ok(r2.go[0] === 'aladin_X1' && !r2.spw.length, '안쪽 창 길이 없을 때만 예전처럼 카드로 옮김', r2);
    ok(/data-bpgo="\$\{esc\(r\.k\)\}"[^>]*>🔎 카드 보기</.test(APP), '단추 글 「🔎 카드 보기」(안쪽 창)');
    ok(/Math\.ceil\(p0 \/ 10\) \* 10/.test(D) || /Math\.ceil\(p0 \/ 10\) \* 10/.test(APP), '웹앱 확정 때도 10원 단위로 올림(감시기와 같은 셈)');
    const blk = cutOf(APP, 'const BP_STG = [', 'function bqMorph('); const PR_ST = {}; const esc = (s) => String(s); const won = (n) => n + '원'; const num = (n) => String(n); const kTime = (s) => String(s);
    const W = new Function('S', 'esc', 'won', 'num', 'kTime', 'PR_ST', blk + '\nreturn { bpRowOf, bpRoundFixOf, BP_VWHY };')({}, esc, won, num, kTime, PR_ST);
    const rr = W.bpRowOf('k', { approvalState: 'blocked', execNote: '알라딘이 돌려준 값(12,010)이 보낸 가격(12001)과 다름', approval: { at: isoAgo(H) } }, null, null);
    ok(rr.st === 'run' && /10원 단위/.test(rr.txt) && rr.to === 12010, '10원 단위로 막힌 줄 = 실패가 아니라 진행 중(감시기가 풀어 줌) · 풀이', rr);
    const rb = W.bpRowOf('k', { approvalState: 'blocked', execNote: '알라딘이 돌려준 값(12,500)이 보낸 가격(12001)과 다름', approval: {} }, null, null); ok(rb.st === 'bad', '진짜로 다른 값은 실패 그대로', rb);
    ok(Object.values(W.BP_VWHY).every((w) => !/직접 열어/.test(w[0] + w[1])), '진행 칸 글에 「직접 열어 보세요」 없음');
    ok(/data-bpre=/.test(APP) && /twiceArm\(b, '공개 반영 다시 확인 맡기기'/.test(APP) && !/\b(alert|confirm|prompt)\(/.test(line), '「🔁 다시 확인 맡기기」는 두 번 누름 · 브라우저 팝업 없음'); }

  console.log('⑤-2 관제소·묶음 진행 칸 「🔎 카드 보기」 = 관제소 위 안쪽 창 · 화면 안 옮김 · 닫으면 관제소로');
  { const i0 = APP.indexOf("document.addEventListener('click', (e) => { const t = e.target && e.target.closest && e.target.closest('#bkf_act [data-bkpg] [data-bpf]"); const H0 = APP.slice(i0, APP.indexOf('\ndocument.addEventListener(\'toggle\'', i0));
    ok(i0 > 0 && /\[data-bpre\]/.test(H0), '관제소 진행 칸에서도 「🔁 다시 확인 맡기기」를 받음');
    const calls = { push: [], open: [], win: 0, re: 0, paint: 0, back: 0 }; let hnd = null; const S = { detail: { bkfold: 'F1' } };
    const doc = { addEventListener: (ty, f) => { if (ty === 'click') hnd = f; } }; const hist = { pushState: (st) => calls.push.push(st), back: () => calls.back++ };
    const env = new Function('document', 'S', 'history', 'openBatchGroup', 'bkfWinOn', 'bkfRunPaint', 'bpReAsk', H0 + '\nreturn { bkpCardWin };')(doc, S, hist, (g, o) => { calls.open.push([g, o]); S.detail = { batch: 1 }; return Promise.resolve(); }, () => calls.win++, () => calls.paint++, () => calls.re++);
    const T = (ds) => ({ dataset: ds, closest: (q) => (q === '[data-bkpg]' ? { dataset: { bkpg: 'G1' } } : null) }); const ev = (ds) => { const t = T(ds); return { target: { closest: () => t }, preventDefault() {} }; };
    await hnd(ev({ bpgo: 'aladin_K1' })); await new Promise((r) => setTimeout(r, 5));
    ok(calls.open.length === 1 && calls.open[0][0] === 'G1' && calls.push[0] && calls.push[0].bkfwin === 1 && !calls.push.some((x) => x.batch) && calls.win === 1, '관제소 → 그 그룹을 관제소 위 안쪽 창(bkfwin)으로 엶 · 새 화면(batch 쌓기) 아님', calls);
    ok(S._bkpGo && S._bkpGo.k === 'aladin_K1' && S._bkpGo.win === 1 && S._bkpWin === 'G1', '그룹이 뜨면 그 카드만 안쪽 창으로 띄우라는 표시', S._bkpGo);
    S.detail = { bkfold: 'F1' }; hnd(ev({ bpre: 'act1' })); ok(calls.re === 1, '관제소 「🔁 다시 확인 맡기기」 = 그룹 화면과 같은 bpReAsk');
    const isL = APP.split('\n').find((l) => /^const bkfWinIs = /.test(l)); const isF = new Function('S', isL + '\nreturn bkfWinIs;');
    ok(isF({ _bkpWin: 'G1', detail: { batch: 1 } })() === true && isF({ _bkpWin: null, detail: { batch: 1 } })() === false, '관제소에서 연 그룹만 안쪽 창 모양(그냥 연 그룹 화면은 그대로)');
    const D = cutOf(APP, 'function drawBatchRes(', '\nfunction '); const gl = D.split('\n').find((l) => /S\._bkpGo && S\._bkpGo\.gid === id/.test(l)).trim();
    const runG = (win) => { const r = { spw: [], go: [], back: 0 }; const S2 = { _bkpGo: { gid: 'G1', k: 'aladin_K1', win }, batchSrvReady: true, batchSrvId: 'G1', _bkpWin: win ? 'G1' : null, detail: { batch: 1 } };
      new Function('S', 'id', 'R', 'SEENP', 'spwOpen', 'goK', 'setTimeout', 'history', gl)(S2, 'G1', [1], { cfg: { key: 'batch', spw: {} } }, (k, o) => r.spw.push([k, o]), (k) => r.go.push(k), (f) => f(), { back: () => r.back++ });
      if (r.spw[0] && r.spw[0][1] && r.spw[0][1].onClose) r.spw[0][1].onClose(); return r; };
    const g1 = runG(1); ok(g1.spw.length === 1 && g1.spw[0][0] === 'aladin_K1' && !g1.go.length && g1.back === 1, '관제소에서 왔으면 그 카드만 안쪽 창 · 닫으면 뒤로(관제소로)', g1);
    const g2 = runG(0); ok(g2.go[0] === 'aladin_K1' && !g2.spw.length, '표시가 없으면 예전 길(카드로) 그대로', g2);
    const SW = cutOf(APP, 'const SPW = {', "document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || e.isComposing || !spwOn())");
    const SP = new Function('SEENP', 'queueMicrotask', 'setTimeout', 'clearTimeout', SW + '\nreturn { spwOpen, spwClose, SPW };')({ cfg: { key: 'batch', spw: { prep: () => 1, undo: () => {} }, root: () => null } }, () => {}, () => 0, () => {});
    let oc = 0; SP.spwOpen('aladin_K1', { onClose: () => oc++ }); SP.spwClose(); ok(oc === 0, '창이 저절로 닫힐 때(다른 카드·다시 그림)는 관제소로 가지 않음');
    SP.spwOpen('aladin_K1', { onClose: () => oc++ }); SP.spwClose(true); ok(oc === 1 && SP.SPW.oc === null, '사람이 닫을 때(✕·Esc·바깥)만 한 번 부름');
    ok(!/카드로 가기」는 그 그룹 화면/.test(APP) && !/\b(alert|confirm|prompt)\(/.test(H0), '「화면을 옮김」 설명 글 없음 · 브라우저 팝업 없음'); }

  console.log('⑥ 감시기 머리 그대로 · 판 번호만');
  { const head = PW.slice(0, PW.indexOf('// ==/UserScript==')); ok(/@version\s+0\.10\.\d+/.test(head) && (head.match(/@require/g) || []).length === 9 && /@connect\s+www\.yes24\.com/.test(head), '머리(@match·@grant·@connect·@require 9개) 그대로', (head.match(/@require/g) || []).length); }
  console.log(bad ? `\n❌ ${bad}건 실패` : '\n✓ 전부 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
