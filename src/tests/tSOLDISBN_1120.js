// tSOLDISBN_1120 — (정범님 I-1120-1359-26 · 1.78.837 lead) 🚨 판매수 — 알라딘 주문 줄에 상품 번호(listingKey·aladinUsedCode)가 없으면 ISBN으로 묶음 상품과 맞춤
//  ① 글: ckIsbOf·ckLineIn = CTRLKPI 덩어리 안 · ckSoldAgg·ckSoldPer 둘 다 ckLineIn으로 거름 · Firestore 읽기 없음 · 브라우저 창 없음
//  ② 셈: 번호 맞음 = 셈 · 번호가 다른 상품(S.plist에 있음) = 안 셈 · 번호 없고 ISBN 같음 = 셈 · 번호 없고 ISBN 다름 = 안 셈 · 모르는 번호 + ISBN 같음 = 셈 · 거름 없음 = 모두
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const a = T.indexOf('/* CTRLKPI-START'), b = T.indexOf('/* CTRLKPI-END */'); const B = a > 0 && b > a ? T.slice(a, b) : '';
console.log('① 글');
const fnSrc = (n) => { const i = B.indexOf('function ' + n + '('); if (i < 0) return ''; return B.slice(i, B.indexOf('\n', i)); };
const I = fnSrc('ckIsbOf'), L = fnSrc('ckLineIn'), P = fnSrc('ckIsbPl'); /* (11/20 isbnall1) ckLineIn이 ckIsbPl(ISBN → 우리 상품들)로 좁힘 */
ok(I && L && P, 'ckIsbOf·ckLineIn·ckIsbPl = CTRLKPI 덩어리 안');
const sa = B.slice(B.indexOf('function ckSoldAgg('), B.indexOf('\n', B.indexOf('function ckSoldAgg(') + 10) + 3000);
const sp = B.slice(B.indexOf('function ckSoldPer('), B.indexOf('function ckSoldPer(') + 3000);
ok(/ckIsbOf\(keys\)/.test(sa) && /ckLineIn\(it, k, keys, isb, oms\)/.test(sa), 'ckSoldAgg = ISBN 맞춤으로 거름');
ok(/ckIsbOf\(keys\)/.test(sp) && /ckLineIn\(it, k, keys, isb, oms\)/.test(sp), 'ckSoldPer = ISBN 맞춤으로 거름');
ok(!/db\.collection\(|onSnapshot/.test(I + L + P) && !/\b(alert|confirm|prompt)\s*\(/.test(I + L + P), 'Firestore 읽기·브라우저 창 없음');
console.log('② 셈');
const C = {}; const S = { plist: new Map([['aladin_U1', { id: 'aladin_U1', isbn13: '9781111111111' }], ['aladin_U2', { id: 'aladin_U2', isbn13: '9782222222222' }], ['aladin_U9', { id: 'aladin_U9', isbn13: '9781111111111' }]]) };
const ctx = { S, ckS: () => C, WeakMap, Set, Map, String, kMs: (v) => Date.parse(v) || 0, lineGrade: () => '' }; vm.createContext(ctx); vm.runInContext(I + '\n' + L + '\n' + P + '\nthis.ckIsbOf = ckIsbOf; this.ckLineIn = ckLineIn;', ctx);
const keys = new Set(['aladin_U1']); const isb = ctx.ckIsbOf(keys);
ok(isb.has('9781111111111') && isb.size === 1, '묶음 ISBN 모음', [...isb]);
ok(ctx.ckIsbOf(keys) === isb, '같은 묶음은 다시 셈하지 않음(기억)');
const r = [ctx.ckLineIn({}, 'aladin_U1', keys, isb), ctx.ckLineIn({ isbn13: '9781111111111' }, 'aladin_U9', keys, isb), ctx.ckLineIn({ isbn13: '9781111111111' }, '', keys, isb), ctx.ckLineIn({ isbn13: '9782222222222' }, '', keys, isb), ctx.ckLineIn({ isbn13: 9781111111111 }, 'aladin_U777', keys, isb), ctx.ckLineIn({}, '', keys, isb), ctx.ckLineIn({}, '', null, null)];
/* (11/20 isbnall1 · CTRLOPT1 15번) U9(묶음 밖)도 같은 ISBN → 번호 없는 ISBN 줄은 어느 상품인지 몰라 묶음으로 안 셈(예전엔 셈) */
ok(JSON.stringify(r) === JSON.stringify([true, false, false, false, false, false, true]), '번호 맞음 셈 · 다른 상품 번호 안 셈 · ISBN 같지만 묶음 밖 같은 ISBN 상품 있음 안 셈 · ISBN 다름 안 셈 · 모르는 번호+모호한 ISBN 안 셈 · 아무것도 없음 안 셈 · 거름 없음 모두', r);
S.plist.delete('aladin_U9'); C.ipl = null;
const r2 = [ctx.ckLineIn({ isbn13: '9781111111111' }, '', keys, isb), ctx.ckLineIn({ isbn13: 9781111111111 }, 'aladin_U777', keys, isb)];
ok(JSON.stringify(r2) === JSON.stringify([true, true]), '같은 ISBN 우리 상품이 묶음 안 하나뿐 → 번호 없음·모르는 번호도 셈', r2);
console.log(bad ? `❌ tSOLDISBN_1120 ${bad}개 실패` : '✓ tSOLDISBN_1120 통과'); process.exit(bad ? 1 : 0);
