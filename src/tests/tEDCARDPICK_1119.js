// tEDCARDPICK — (11/19 정범님 I-1119-1438-13 · 판본 판 ② 걸음 ②) 수동 일괄 카드·재고 품목 카드에 「🔖 판본 낱말 확인 → 후보 중 고르기」
//  · 두 카드가 같은 함수(edCardBox) · 펼친 칸 = 재고 품목 🔖 칸(stkEkPanel — 먼저 들어간 함수) · 후보 = edCands · 고름 = edSetPick(두 번 누름 · data-edpick)
//  · 등록 카드(regcand2b 몫)는 건드리지 않음 · 칸 안 누름은 카드를 펼치거나 상품을 열지 않음
// 실행: node tEDCARDPICK_1119.js · 시험 자료는 지어낸 책 이름·번호만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'readnow-products-core.js')));
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.join(ROOT, 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (src, a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return src.slice(i, j); };
const P = require(path.join(ROOT, 'readnow-products-core.js'));
const BLK = cut(T, '/* (edall2 판본 판 ② 시작', '/* (edall2 판본 판 ② 끝) */');
console.log('① 카드 자리');
const lineOf = (re) => T.split('\n').find((x) => re.test(x)) || '';
const bqC = lineOf(/data-bqexp="\$\{esc\(k\)\}" title="누르면 이 상품만 자세히"/); ok(/data-bqexp2=[^\n]*🔎 자세히<\/button><\/span><\/div>\$\{typeof edCardBox === 'function' \? edCardBox\(S\.plist\.get\(k\) \|\| l\) : ''\}<\/div>`; \}/.test(T) && !!bqC, '수동 일괄 한눈에 카드에 판본 칸');
ok(/<\/small> \$\{bqMetBtn\(k\)\}\$\{typeof edCardBox === 'function' \? edCardBox\(S\.plist\.get\(k\) \|\| l\) : ''\}/.test(T), '수동 일괄 자세히 카드에 판본 칸');
ok(/\$\{prodCard2\(l\)\}\$\{!EK && edK\(l\) \? edCardBox\(l\) : ''\}\$\{ekP\}/.test(T) && /const ekP = EK \? stkEkPanel\(l\) : '';/.test(T), '재고 품목 카드에 판본 칸(🔖 탭은 늘 펼침 그대로)');
const reg = cut(T, 'function regRepickHtml(it)', '\n'); ok(!/edCardBox/.test(reg) && (T.match(/edCardBox\(/g) || []).length === 5, '등록 카드는 건드리지 않음 · 쓰는 곳 3 + 정의·다시 그림');
console.log('② 단추·펼침·고르기');
const S = { plist: new Map(), nbm: new Map(), app: {}, user: { email: 't@x' }, nbmLoaded: true }; let L = []; const sent = []; const toasts = [];
const PANEL = (l) => { const C = P.edCands({ title: l.title, bookId: l.bookId, code: null }, S.nbm.get(l.id), { minCov: 0.6 }); return `<div class="stkek" data-stkek="${l.id}">${C.map((c) => `<button data-edpick="${l.id}" data-edit="${c.itemId}">이 판으로 정함</button>`).join('')}${C.length ? '' : `<button data-stkmet1="${l.id}">🔎 판본 검색 맡기기</button>`}</div>`; };
const els = new Map(); const doc = { addEventListener: (t, f, cap) => { L.push([t, f, cap]); }, querySelectorAll: (q) => { const m = /data-edcp="([^"]+)"/.exec(q); return m && els.has(m[1]) ? [els.get(m[1])] : []; } };
const env = { S, PRDF: () => P, isMedia: () => false, toast: (m) => toasts.push(m), num: String, esc: String, errKo: (e) => e.message, $: () => null, CSS: { escape: (x) => x }, db: {}, firebase: {}, TS: () => 'TS', slimNbm: (x) => x, bump: () => {}, edRedraw: () => {}, _edC: new WeakMap(),
  edOf: (l) => (P.edSuspect(l.title).on ? { kw: ['리커버'] } : null), edPickOf: (l) => ((S.nbm.get(l.id) || {}).edPick) || null, edKwHits: () => ['리커버'], stkEkPanel: PANEL, stkMetSend: async (ids, lb) => { sent.push([ids, lb]); return {}; }, isAdminDevice: () => false, p1Scan: () => {}, document: doc };
const names = Object.keys(env); const F = new Function(...names, BLK + '; return { edCardBox, edCardBtn };')(...names.map((k) => env[k]));
const A = { id: 'aladin_900011', usedCode: '900011', bookId: '9000011', title: '가상 별빛 정원 (리커버 한정판)', price: 15000 }; S.plist.set(A.id, A);
S.nbm.set(A.id, { src: 'usedSearch', cands: [{ itemId: '8100001', title: '가상 별빛 정원 (리커버 한정판)', cov: 1, vol: true, match: true, channels: { seller: { min: 12000, count: 2 } } }, { itemId: '8100002', title: '가상 별빛 정원', cov: 0.95, vol: true, match: true, channels: { seller: { min: 5000, count: 9 } } }] });
const B = { id: 'aladin_900012', usedCode: '900012', title: '가상 숲속 편지', price: 8000 }; S.plist.set(B.id, B);
let h = F.edCardBox(A); ok(/data-edcp="aladin_900011"/.test(h) && /🔖 판본 낱말 확인 → 후보 중 고르기/.test(h) && /data-edcard="aladin_900011"/.test(h) && !/data-stkek/.test(h), '닫힌 칸 — 단추 「🔖 판본 낱말 확인 → 후보 중 고르기」·낱말');
ok(F.edCardBox(B) === '', '판본 낱말 없는 상품엔 칸 없음');
const cap = L.find((x) => x[0] === 'click' && x[2] === true); ok(!!cap, '누름은 앞질러 받음(카드 펼침·상품 열기보다 먼저)');
const mk = (attrs, box) => ({ dataset: attrs, disabled: false, closest(sel) { if (sel === '[data-edcp]') return box; if (sel === '[data-edcard]') return attrs.edcard ? this : null; if (sel === '[data-stkmet1]') return attrs.stkmet1 ? this : null; return null; } });
const box = { set outerHTML(v) { box.html = v; } }; els.set(A.id, box); let stopped = 0; const ev = (t) => ({ target: t, stopPropagation: () => stopped++, preventDefault: () => {} });
cap[1](ev(mk({ edcard: A.id }, box))); ok(/data-stkek="aladin_900011"/.test(box.html) && /▾ 접기/.test(box.html) && stopped === 1, '누르면 그 자리에서 펼침 — 재고 품목 🔖 칸 그대로');
ok((box.html.match(/data-edpick="aladin_900011"/g) || []).length >= 1, '후보 줄 「이 판으로 정함」(data-edpick → edSetPick 두 번 누름)');
cap[1](ev(mk({}, box))); ok(stopped === 2, '칸 안 다른 곳 누름도 카드로 안 번짐');
cap[1](ev(mk({ edcard: A.id }, box))); ok(!/data-stkek/.test(box.html) && /후보 중 고르기/.test(box.html), '한 번 더 누르면 접힘');
S.nbm.set(A.id, { src: 'usedSearch', cands: [] }); cap[1](ev(mk({ edcard: A.id }, box))); cap[1](ev(mk({ stkmet1: A.id }, box)));
setTimeout(() => { ok(sent.length === 1 && sent[0][0][0] === A.id, '후보가 없으면 「판본 검색 맡기기」가 칸 안에서도 됨', sent);
  ok(/t\.closest\('\[data-edlist\],\[data-edpick\]/.test(T) && /edSetPick\(D\.edpick/.test(T), '고름은 원래 edSetPick 그대로');
  ok(/class="rgrepick"/.test(h), '등록 카드 「후보 다시 고르기」와 같은 모양(rgrepick)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0); }, 10);
