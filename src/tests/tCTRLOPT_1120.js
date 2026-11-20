/* tCTRLOPT_1120 — (11/20 ctrlopt1) 관제소·수동 일괄 판매 셈·속도 고침 시험
 *  ① saleIdxX: 번호 없이 listingKey·ISBN만 온 주문 줄도 그 상품으로(하나뿐일 때·판매가·등급으로 좁힘) · 모르면 isb에만 · 취소 줄·등록 전 상품 안 셈 · 기억(같은 판이면 같은 Map)
 *  ② 「14일 안 주문」 안전 막음이 isb(어느 상품인지 모르는 같은 ISBN 주문)도 봄 · 관제소·그룹·전략 실적·밤사이 판매가 saleIdxX를 씀
 *  ③ ckSoldPer: 갈래마다 따로 기억(번갈아 불러도 다시 안 훑음) · 주문 판(S.dv.o)이 바뀌면 다시 셈 · ckSoldAgg 열쇠에도 S.dv.o
 *  ④ ckFoldKeys: 같은 자료면 같은 Set(묶음 문서 깊은 복사 한 번) · 그룹 상품 목록이 제자리로 바뀌어도 알아챔
 *  ⑤ 감시기: 잠금·상품 기록 읽기를 맡기와 함께 띄움 · 머리 줄(1~25줄)은 main과 같음
 *  손님 이름·전화 없음 · 팝업 없음 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const H = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const W = fs.readFileSync(path.join(ROOT, 'readnow-price-watch.user.js'), 'utf8');
const HL = H.split('\n');
let fail = 0; const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { fail++; console.log('  ❌ ' + m); } };

/* 이름으로 함수·상수 한 덩어리를 떼어 옴 — 시작 줄부터 문법이 맞을 때까지 줄을 붙임 */
function grab(name) { const re = new RegExp('^(async )?function ' + name + '\\(|^const ' + name + ' = '); const i = HL.findIndex((l) => re.test(l)); if (i < 0) throw new Error('못 찾음: ' + name);
  let acc = ''; for (let j = i; j < i + 60; j++) { acc += HL[j] + '\n'; try { new vm.Script(acc); return acc; } catch (e) {} } throw new Error('못 뗌: ' + name); }
function ctxWith(names, extra) { const ctx = vm.createContext({ console, Map, Set, WeakMap, Date, JSON, Math, String, Number, isFinite, Array, Object, ...(extra || {}) }); const got = new Set();
  const load = (n) => { if (got.has(n)) return; got.add(n); vm.runInContext(grab(n).replace(/^const /, 'var '), ctx); };
  names.forEach(load); ctx.__load = load; return ctx; }
function run(ctx, code) { for (let t = 0; t < 20; t++) { try { return vm.runInContext(code, ctx); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; ctx.__load(m[1]); } } throw new Error('이름이 너무 많이 빠짐'); }

console.log('① saleIdxX');
{ const ctx = ctxWith(['kMs', 'lineGrade', 'saleIdx', 'saleIdxX']);
  ctx.S = { orders: new Map(), plist: new Map() };
  const L = (id, isbn, price, grade, reg) => ctx.S.plist.set(id, { id, isbn13: isbn, price, grade, registeredAt: reg || '2026-10-01T00:00:00Z' });
  L('aladin_1', '9780000000001', 5000, '상'); /* ISBN A 하나뿐 */
  L('aladin_2', '9780000000002', 4000, '상'); L('aladin_3', '9780000000002', 6000, '중'); /* ISBN B 둘 — 판매가로 좁힘 */
  L('aladin_4', '9780000000003', 3000, '상'); L('aladin_5', '9780000000003', 3000, '상'); /* ISBN C 둘 — 못 좁힘 */
  L('aladin_6', '9780000000004', 3000, '상'); L('aladin_7', '9780000000004', 3000, '상', '2026-11-19T00:00:00Z'); /* ISBN D — 7은 주문 뒤 등록 */
  const O = (id, at, items, kind) => ctx.S.orders.set(id, { id, kind: kind || 'sale', orderNo: 'N' + id, orderedAt: at, items });
  O('o1', '2026-11-18T10:00:00+09:00', [{ lineStatus: 'normal', aladinUsedCode: '9', qty: 1, price: 1000 }]);
  O('o2', '2026-11-18T11:00:00+09:00', [{ lineStatus: 'normal', listingKey: 'aladin_8', qty: 2, price: 2000 }]);
  O('o3', '2026-11-18T12:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000001', qty: 1, price: 5000 }]);
  O('o4', '2026-11-18T13:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000002', qty: 1, price: 6000 }]);
  O('o5', '2026-11-18T14:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000003', qty: 1, price: 3000 }]);
  O('o6', '2026-11-18T15:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000004', qty: 1, price: 3000 }]);
  O('o7', '2026-11-18T16:00:00+09:00', [{ lineStatus: 'cancel', isbn13: '9780000000001', qty: 1, price: 5000 }]);
  O('o8', '2026-11-18T17:00:00+09:00', [{ lineStatus: 'normal', isbn13: '9780000000001', qty: 1, price: 5000 }], 'cash');
  const m = run(ctx, 'saleIdxX()'); const n = (k) => (m.get(k) || []).length;
  ok(n('aladin_9') === 1, '번호 있는 줄은 예전 그대로(saleIdx 항목)');
  ok(n('aladin_8') === 1 && m.get('aladin_8')[0].qty === 2, '번호 없이 listingKey만 있는 줄 → 그 상품');
  ok(n('aladin_1') === 1, 'ISBN만 · 같은 ISBN 우리 상품 하나 → 그 상품 (취소 줄·가게 판매는 안 셈)');
  ok(n('aladin_3') === 1 && n('aladin_2') === 0, 'ISBN 같은 상품 둘 → 판매가로 좁힘');
  ok(n('aladin_4') === 0 && n('aladin_5') === 0 && (m.isb.get('9780000000003') || []).length === 1, '끝내 못 좁히면 셈에 안 넣고 isb에만');
  ok(n('aladin_6') === 1 && n('aladin_7') === 0, '주문 뒤 등록한 상품은 후보에서 뺌');
  ok(run(ctx, 'saleIdx()').get('aladin_1') === undefined, 'saleIdx(판매됨 표시)는 그대로 — 번호 있는 줄만');
  ok(run(ctx, 'saleIdxX()') === m, '같은 판이면 같은 Map(다시 안 훑음)');
  run(ctx, 'S._saleIdx = null'); ok(run(ctx, 'saleIdxX()') !== m, '주문이 바뀌면(saleIdx 새로) 다시 만듦');
}

console.log('② 쓰는 곳');
{ const why = HL.find((l) => l.includes("'14일 안 주문 있음(출고·반품 중일 수 있음)'")) || '';
  ok(/Z\.sIdx\.isb/.test(why) && why.includes('14일 안 같은 ISBN 주문 있음'), '「14일 안 주문」 막음이 같은 ISBN 모르는 주문도 봄');
  ok(/function bkfSIdx\(\) \{[^\n]*saleIdxX\(\)/.test(H), '수동 일괄 색인(bkfSIdx) = saleIdxX');
  ok(/const sIdx = S\.ordersLoaded \? saleIdxX\(\) : new Map\(\); const salesOf/.test(H), '추격자 전략 실적 = saleIdxX');
  ok(/P\.b !== pfB/.test(H) && /S\._ctrlPf = \{ at: X\.at, b: pfB, rows \}/.test(H), '관제소 전략 실적: 주문이 바뀌면 다시 셈');
  ok(/saleIdxX\(\) : new Map\(\); try \{ out\.strat = CH\.perf/.test(H), '그룹 실적 = saleIdxX');
  ok(/const I = saleIdxX\(\); for \(const k of K\)/.test(H), '🌅 밤사이 판매 = saleIdxX');
  ok((H.match(/^function saleIdxX\(/gm) || []).length === 1, 'saleIdxX는 한 번만 선언');
}

console.log('③ ckSoldPer·ckSoldAgg 기억');
{ let scans = 0; const ctx = ctxWith(['ckS', 'ckMd', 'ckAdd', 'ckPrevYm', 'ckNowK', 'ckOAt', 'ckSpans', 'CK_PER4', 'ckIsbOf', 'ckLineIn', 'ckSoldPer', 'kMs', 'lineGrade', 'ckIsbPl']); /* (11/20 isbnall1) ckLineIn이 주문 시각·ckIsbPl로 좁힘 */
  const orders = new Map([['a', { kind: 'sale', orderedAt: new Date(Date.now() - 3600e3).toISOString(), items: [{ lineStatus: 'normal', aladinUsedCode: '1', qty: 1, price: 1000 }] }]]);
  const O = { get size() { return orders.size; }, values() { scans++; return orders.values(); } };
  ctx.S = { orders: O, plist: new Map(), dv: { o: 1 } };
  const k1 = new Set(['aladin_1']); const r1 = run(ctx, 'ckSoldPer'); const A1 = r1(k1, 'f1'); const B1 = r1(null, 'all'); const A2 = r1(k1, 'f1'); const B2 = r1(null, 'all');
  ok(A1 === A2 && B1 === B2 && scans === 2, '묶음·전체를 번갈아 불러도 갈래마다 기억(훑기 ' + scans + '번)');
  ok(A1.d.c === 1 && B1.d.c === 1, '오늘 판매 1');
  orders.get('a').items[0].lineStatus = 'cancel'; ctx.S.dv.o++; const A3 = r1(k1, 'f1');
  ok(A3 !== A1 && A3.d.c === 0, '주문 수는 같아도 주문 판(S.dv.o)이 바뀌면 다시 셈(취소 반영)');
  ok(/function ckSoldAgg\(keys, tag\) \{ const C = ckS\(\); const key = \[S\.orders \? S\.orders\.size : 0, S\.dv \? S\.dv\.o : 0,/.test(H), 'ckSoldAgg 열쇠에도 S.dv.o');
}

console.log('④ ckFoldKeys 기억');
{ let norms = 0; const ctx = ctxWith(['ckS', 'ckFoldKeys'], {}); ctx.bkfNorm = (d) => { norms++; return JSON.parse(JSON.stringify(d)); };
  const lk = ['aladin_3']; ctx.S = { bkfold: { folds: { F: { gids: ['g1', 'g2'] } } }, _bkfTb: { g1: { cls: new Map([['aladin_1', 'x']]), sk: ['aladin_2'] } }, prBatches: [{ id: 'g2', lastKeys: lk }] };
  const s1 = run(ctx, "ckFoldKeys('F')"); const s2 = run(ctx, "ckFoldKeys('F')");
  ok(s1 === s2 && s1.size === 3 && norms === 1, '같은 자료면 같은 Set · 묶음 문서 복사 한 번(' + norms + ')');
  run(ctx, "S.prBatches[0].lastKeys = ['aladin_3','aladin_4']"); const s3 = run(ctx, "ckFoldKeys('F')");
  ok(s3 !== s1 && s3.has('aladin_4'), '그룹 상품 목록이 제자리로 바뀌어도 알아챔');
  run(ctx, "S._bkfTb = { ...S._bkfTb, g1: { sk: ['aladin_9'] } }"); const s4 = run(ctx, "ckFoldKeys('F')");
  ok(s4.has('aladin_9') && !s4.has('aladin_1'), '그룹 표 칸이 바뀌면 다시 만듦');
  run(ctx, "S.bkfold = { folds: { F: { gids: ['g2'] } } }"); const s5 = run(ctx, "ckFoldKeys('F')");
  ok(s5.size === 2 && norms === 2, '묶음 문서가 바뀌면 다시 읽음');
  ok(run(ctx, "ckFoldKeys('없음')").size === 0, '없는 묶음은 빈 Set');
}

console.log('⑤ 감시기');
{ const i1 = W.indexOf('const lkP = '), i2 = W.indexOf('got = await claim(d.ref, x, kind)');
  ok(i1 > 0 && i1 < i2, '잠금 읽기를 맡기 전에 띄움');
  ok(W.includes('const lkW = await (lkP || plkReadW(x));'), '잠금 판단은 맡은 뒤 그대로');
  ok(W.includes("const lsP = kind === 'manual' && x.key ? C('prd_listings').doc(x.key).get() : null; if (lsP) lsP.catch(() => {});"), '상품 기록 읽기도 함께 · 못 읽은 것이 처리 안 된 오류로 남지 않음');
  ok(W.includes("(await (lsP || C('prd_listings').doc(x.key).get())).data()"), '상품 기록 확인은 같은 try 안(못 읽으면 예전 그대로)');
  ok(W.includes("const Q = await Promise.all(st.map((k) => C('prd_price_decisions').where('approvalState', '==', k).get()));") && !W.includes("for (const k of st) { const q = await C('prd_price_decisions')"), '반영 대기 네 갈래 읽기를 함께(차례 그대로)');
  let base = null; try { base = cp.execSync('git show origin/main:readnow-price-watch.user.js', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) {}
  if (base) { const hd = (s) => s.split('\n').slice(0, s.split('\n').findIndex((l) => l.includes('==/UserScript==')) + 1).filter((l) => /@(match|grant|connect|require)/.test(l)).map((l) => l.replace(/readnow-exec-core\.js\?v=[\d.]+/, 'readnow-exec-core.js?v=*')).join('\n'); /* (11/20) 실행 공용 판 번호만은 정범님 허락(I-1120-1430-27a)으로 바뀜 */ ok(hd(base) === hd(W), '머리 줄(@match·@grant·@connect·@require) main과 같음'); }
  else console.log('  (main을 못 읽어 머리 비교는 건너뜀)');
}

console.log('⑦ 반영 사이 무작위 틈 (정범님 I-1120-1440-28)');
{ const m = W.match(/const apJit = async \(\) => \{([^\n]*?)await sleep\(ms\); \};/); ok(!!m, 'apJit 있음');
  ok(/if \(nDone > 1\) await apJit\(\); await apOne\(d0\);/.test(W), '반영 하나하나 앞에 틈(첫 권 빼고)');
  if (m) { const f = new Function('Math', 'let ms; ' + m[1].replace('const ms', 'ms').replace(/SPD\.jit[^;]*;/, '') + ' return ms;');
    const xs = []; for (let i = 0; i < 20000; i++) xs.push(f(Math)); const mn = Math.min(...xs), mx = Math.max(...xs), av = xs.reduce((a, b) => a + b, 0) / xs.length;
    const b = new Set(xs.map((x) => Math.floor(x / 500))).size;
    ok(mn >= 700 && mx <= 25000, `틈 0.7~25초 (${Math.round(mn)}~${Math.round(mx)}ms)`); ok(av > 2000 && av < 5000, `평균 2~5초 (${Math.round(av)}ms)`); ok(b >= 30, `일정하지 않음(0.5초 칸 ${b}개)`); }
  ok(W.includes('무작위 틈 ${Math.round((SPD.jit || 0) / 1000)}초'), '바퀴 끝 줄에 무작위 틈 합');
}

console.log('⑥ 금지');
{ let diff = ''; try { diff = cp.execSync('git diff HEAD -- src/app.html readnow-price-watch.user.js', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) {}
  const add = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(add), '브라우저 팝업 없음(더한 줄)');
  ok(!/01[016789][- ]?\d{3,4}[- ]?\d{4}/.test(add) && !/01[016789][- ]?\d{3,4}[- ]?\d{4}/.test(fs.readFileSync(__filename, 'utf8')), '전화번호 모양 없음');
  ok(!/\.delete\(\)|deleteDoc|FieldValue\.delete/.test(add), '자료 지우는 코드 없음');
}
if (fail) { console.log('❌ ' + fail + '개 실패'); process.exit(1); } console.log('✅ tCTRLOPT_1120 모두 통과');
