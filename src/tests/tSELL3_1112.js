// tSELL3_1112 — 11/12 일꾼 sell3 · 판매자 배우기 3차: 수집 적응 엔진이 채운 SP·출판사·출간 연월·정가를 N09 구성·N08 주력에 넣기
//  ① 공용 셈: 장르(알라딘 분류 길·국중 KDC) · 표지 값(서가 셈 'rrggbb.갈래') · 채운 정보 합치기(빈 칸만) · 새 구성 특징(SP 낮음·출판사 몰림·장르·표지) · 채움 기준(minFill)
//  ② 주력: 상품 번호('#'+번호)로 찾은 채운 정보로 SP·출판사·장르·출간 연월 · 채움 기준별 다시 셈(fillSens)
//  ③ 클라우드: 채운 상품만 읽음 · 분야·표지 잇기(우리 기록만 — 새 요청 0) · 앞 페이지 빈 상품을 수집 적응 엔진이 먼저 · 우리 판매 = 판매 기록 · 진단 bfill
//  ④ 웹앱: 🧩 채움 칸 · 장르·SP · 브라우저 팝업 없음
// 시험 자료에 손님 정보 없음(꾸민 판매자 번호·제목·값만) · 실행: node src/tests/tSELL3_1112.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 500))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SL = require(find(['../readnow-sellerlearn-core.js', '../../readnow-sellerlearn-core.js']));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js']), 'utf8');
const APP = fs.readFileSync(find(['../app.html', '../../src/app.html']), 'utf8');

console.log('① 장르 · 표지 값 · 채운 정보 합치기');
{ const g = SL.genreOf; ok(g('국내도서>소설/시/희곡>한국소설') === 'lit' && g('국내도서>만화>일본만화') === 'comic' && g('국내도서>어린이>동화/명작/고전') === 'kid' && g('국내도서>경제경영>투자') === 'biz' && g('국내도서>수험서/자격증>공무원') === 'study', '알라딘 분류 길 → 장르');
  ok(g('KDC>813.6') === 'lit' && g('KDC>813.6>add7') === 'kid' && g('KDC>911') === 'hum' && g('KDC>325.1') === 'biz' && g('KDC>004.7') === 'it' && g('KDC>657.1') === 'comic', '국중 KDC → 같은 장르(부가기호 7 = 어린이)');
  ok(g(null) === null && g('온라인 중고샵>중고국내도서') === null, '모르면 null');
  const c = SL.covOf('202020.bd'), w = SL.covOf('ff2040'); ok(c && c.b < 0.2 && c.hb === 12 && c.fg === 'bd' && w && w.s > 0.8 && w.hb === 11 && w.fg === null && SL.covOf('x') === null, '표지 값: 밝기·채도·색상 칸·글꼴 갈래', [c, w]);
  const L = [{ id: '1', sp: null, ym: '2020-01' }, { id: '2', sp: 5 }]; const r = SL.fillItems(L, new Map([['1', { sp: 900, ym: '2024-05', pub: '가나출판', cv: 'aabbcc.my', pl: 15000, cat: 'KDC>813' }], ['2', { sp: 7777 }]]));
  ok(r.n === 2 && L[0].sp === 900 && L[0].ym === '2020-01' && L[0].pub === '가나출판' && L[0].pl === 15000 && L[0].cov && L[0].cov.fg === 'my' && L[1].sp === 5, '빈 칸만 채움(있던 값은 그대로)', L); }

/* 꾸민 숍 6곳 × 30일 — 앞 240개에 채운 정보 · 숍마다 '어린이 몫'이 날마다 바뀌고 다음 날 판매가 따라감 */
const mkShop = (s, fillShare) => { const cur = {}, F = new Map(); const days = []; const d0 = Date.UTC(2026, 9, 1); let id = 100000 * s;
  for (let i = 0; i < 30; i++) { const day = new Date(d0 + i * 864e5).toISOString().slice(0, 10); const kidS = 0.2 + 0.6 * ((i * 7 + s) % 5) / 4; const add = []; for (let k = 0; k < 60; k++) { id++; const kid = k < 60 * kidS; cur[id] = [3000 + (k % 7) * 1000, day.replace(/-/g, ''), '상', 1, (kid ? '초등 ' : '') + '꾸민 책 ' + id, 0]; add.push(id);
      if ((id % 100) / 100 < fillShare) F.set(String(id), { sp: kid ? 2000 + k : 20 + k, ym: kid ? '2026-03' : '2012-01', pub: kid ? '어린이출판' + (k % 3) : '일반출판' + (k % 9), cat: kid ? '국내도서>어린이>동화' : 'KDC>813.7', cv: kid ? 'f0c040.bd' : '303030.my', pl: 12000 }); }
    const sold = Math.round(20 + 40 * kidS); days.push({ sc: String(s), day, spanDays: 1, complete: true, full: true, total: 600 + i * 60, add: 60, gone: sold, sumGone: sold * 4000, goneList: [], addList: [] }); }
  days.push({ sc: String(s), day: '2026-09-30', base: true, total: 600 }); return { sc: String(s), cur, F, days }; };

console.log('② 새 구성 특징 · 채움 기준 · 주력');
{ const S = [1, 2, 3, 4, 5, 6].map((s) => mkShop(s, 0.6)); const pre = [], sets = [];
  for (const x of S) { const L = SL.shopItems(x.cur, x.days); SL.fillItems(L, x.F); sets.push([x.sc, SL.hashSet(L)]); const P = SL.shopFronts(x.days, L, 240); if (P) pre.push([x.sc, P]); }
  ok(pre.length === 6, '숍 6곳 앞 페이지 되살림', pre.length);
  const F0 = pre[0][1].fronts[20]; const big = new Set(['어린이출판0', '어린이출판1', '어린이출판2']); const f = SL.frontFeat(F0, pre[0][1].rate[20].d, { bigPub: big });
  ok(f && f.spMed != null && f.spLo != null && f.spHi != null && f.pubTop != null && f.pubDiv != null && f.pubBig != null && f['g:kid'] != null && f['g:lit'] != null && f.genDiv != null && f.newPub != null && f.pubAge != null && f.disc != null && f.covB != null && f.covDark != null && f.covBold != null && f.covMy != null, '채움 60% → SP·출판사·장르·출간·정가 대비·표지 특징이 생김', f);
  const fl = SL.frontFill(F0); ok(fl && fl.sp > 0.4 && fl.sp < 0.8 && fl.cat > 0.4 && fl.cov > 0.4, '앞 페이지 채움률', fl);
  const f2 = SL.frontFeat(F0, pre[0][1].rate[20].d, { minFill: 0.9 }); ok(f2 && f2.spMed == null && f2['g:kid'] == null && f2.pubTop == null && f2.covB == null && f2.ageMed != null, '채움 기준 90%면 새 특징을 만들지 않음(옛 특징은 그대로)');
  const rows = pre.flatMap(([g, P]) => SL.panelFrom(g, P, { rare: SL.rareOf(sets, g), kw: [], bigPub: big })); ok(rows.length > 100 && rows.every((r) => r.fill && r.fill.n >= 24) && !rows.some((r) => 'fill' in r.x), '날짜 줄마다 채움률(특징 칸에는 안 넣음)', rows.length);
  const sens = SL.fillSens((t) => pre.flatMap(([g, P]) => SL.panelFrom(g, P, { rare: SL.rareOf(sets, g), kw: [], bigPub: big, minFill: t })), { B: 99, B2: 199 });
  ok(Array.isArray(sens) && sens.length === 3 && sens.map((z) => z.t).join() === '0.1,0.3,0.5' && sens[0].rowsNew >= sens[2].rowsNew && sens[1].feats > 5, '채움 기준 10·30·50%별 다시 셈(새 재료 특징만)', sens.map((z) => [z.t, z.rowsNew, z.feats, z.tests, z.sig]));
  const kidTop = (sens[1].top || []).find((t) => /^g:kid|^spMed|^spLo|^pubAge|^covBold|^newPub/.test(t.f)); ok(sens[1].sig >= 1 && kidTop && kidTop.r !== 0, '꾸민 관계(어린이 몫 ↑ → 판매 ↑)를 새 특징이 잡음', sens[1].top);
  const S2 = [1, 2, 3, 4, 5, 6].map((s) => mkShop(s, 0.1)); const pre2 = S2.map((x) => { const L = SL.shopItems(x.cur, x.days); SL.fillItems(L, x.F); return [x.sc, SL.shopFronts(x.days, L, 240)]; });
  const s2 = SL.fillSens((t) => pre2.flatMap(([g, P]) => SL.panelFrom(g, P, { minFill: t })), { B: 99, B2: 199 }); ok(s2[1].rowsNew === 0 && s2[2].rowsNew === 0 && s2[0].rowsNew > 0, '채움 10%뿐이면 30·50% 기준엔 새 특징 줄이 없음 · 10% 기준에서만', s2.map((z) => [z.t, z.rowsNew]));
  // 주력: 사라진 줄(goneList)의 상품 번호로 채운 정보를 찾음
  const runs = []; for (let i = 0; i < 6; i++) { const day = new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10); runs.push({ sc: '9', day, spanDays: 1, complete: true, full: true, total: 1000, add: 10, gone: 10, sumGone: 50000, goneList: Array.from({ length: 10 }, (_, k) => JSON.stringify([`${i}${k}`, '꾸민 제목', 5000, '상', 3, '20261001', 0, null, null, null])), addList: [] }); }
  const look = {}; for (let i = 0; i < 6; i++) for (let k = 0; k < 10; k++) if (k < 7) look['#' + i + k] = { sp: 100 * k, pub: '가나출판', au: '꾸민 지은이', ym: '2026-01', cat: k < 5 ? '국내도서>어린이>동화' : 'KDC>813', pl: 10000 };
  const p = SL.profile(runs, look); ok(p && p.spKnownS === 0.7 && p.paKnownS === 0.7 && p.spMed != null && p.pubs[0].k === '가나출판' && p.gens[0].k === 'kid' && p.genKnownS === 0.7 && p.years.new12S > 0.6 && p.ymFillN === 42 && p.discMed === 0.5, '주력: 상품 번호로 SP·출판사·장르·출간 연월·정가 대비', p && { sp: p.spKnownS, pa: p.paKnownS, g: p.gens, y: p.years, ym: p.ymFillN, d: p.discMed });
  const p0 = SL.profile(runs); ok(p0 && p0.spKnownS === 0 && p0.genKnownS === 0, '채운 정보가 없으면 예전과 같음'); }

console.log('③ 클라우드 — 채운 상품만 읽기 · 분야·표지 잇기(새 요청 0) · 앞 페이지 먼저 · 우리 판매 · 진단');
{ const blk = (a, b) => { const i = SRC.indexOf(a), j = SRC.indexOf(b, i); return i >= 0 && j > i ? SRC.slice(i, j) : ''; };
  const J = blk('const SL_FILL_F', 'let SLM = null'); ok(J && /where\(f, '>=', since\)/.test(J) && /\['spAt', 'fillAt', 'jxAt'\]/.test(J), 'bench_items는 채운 칸이 있는 것만 물음(통째로 안 읽음)');
  ok(/prd_books'\)\.where\('isbn13', 'in'/.test(J) && /where\('aladinItemId', 'in'/.test(J) && /\['ext_pool', 'ext_basic'\]/.test(J) && /src\.nl\.d\.kdc/.test(J) && /C\('shop_cover'\)/.test(J), '분야 = 우리 책 분류(ISBN·새책 번호) → 국중 KDC · 표지 = 서가 셈');
  ok(!/fetch\(|getPage|evaluate\(/.test(J), '잇기는 우리 Firestore만 읽음(알라딘·국중에 새 요청 0 · 약속 0)');
  ok(/if \(!o\.dry\) \{ B\.set\(v\.ref/.test(J) && !/'cat':|\bcat: r\./.test(J) && /catX/.test(J), '진단(dry)엔 쓰지 않음 · 수집기의 cat 칸은 건드리지 않고 catX에');
  // 가짜 Firestore로 실제로 돌려 봄
  const docs = { bench_items: {}, prd_books: { bk_1: { isbn13: '9791100000017', categories: [{ path: '국내도서>어린이>동화' }] }, bk_2: { aladinItemId: '555', categories: [{ path: ['국내도서', '만화', '일본만화'] }] } }, ext_pool: { '9791100000024': { src: { nl: { d: { kdc: '813.7', addCode: '03810' } } } } }, ext_basic: {}, shop_cover: { b00: { m: { bk_1: 'f0c040.bd' } } } };
  const now = new Date().toISOString(); Object.assign(docs.bench_items, { '9_1': { sc: '9', id: '1', isbn: '9791100000017', sp: 10, spAt: now }, '9_2': { sc: '9', id: '2', newId: '555', fillAt: now, publisher: '가나' }, '9_3': { sc: '9', id: '3', isbn: '9791100000024', fillAt: now, pubYm: '2025-01' }, '9_4': { sc: '9', id: '4', cat: '국내도서>소설/시/희곡', spAt: now, sp: 3 }, '9_5': { sc: '9', id: '5', title: '안 채움' } });
  const writes = []; const ref = (c, id) => ({ path: c + '/' + id, id }); const snap = (c, id) => ({ id, ref: ref(c, id), exists: !!docs[c][id], data: () => docs[c][id] });
  const q = (c, filt) => ({ select: () => q(c, filt), where: (f, op, v) => q(c, [...filt, [f, op, v]]), get: async () => { const L = Object.keys(docs[c]).filter((id) => filt.every(([f, op, v]) => { const x = docs[c][id][f]; return op === '>=' ? x != null && x >= v : op === 'in' ? v.includes(x) : x === v; })).map((id) => snap(c, id)); return { size: L.length, docs: L, forEach: (fn) => L.forEach(fn), empty: !L.length }; } });
  const C = (c) => ({ where: (f, op, v) => q(c, [[f, op, v]]), doc: (id) => ref(c, id), get: async () => { const L = Object.keys(docs[c]).map((id) => snap(c, id)); return { forEach: (fn) => L.forEach(fn), docs: L }; } });
  const db = { getAll: async (...a) => a.filter((x) => x && x.path).map((r) => snap(r.path.split('/')[0], r.id)), batch: () => ({ set: (r, v) => writes.push([r.path, v]), commit: async () => {} }) };
  const mk = new Function('C', 'db', 'nowIso', 'W', J + '; return { slFillMap, slFillBySc, slBenchJoin };'); const F = mk(C, db, () => now, () => ({}));
  (async () => { const { M, st } = await F.slFillMap(); ok(M.size === 4 && !M.has('9_5') && st.n === 4, '채운 4개만 읽음(안 채운 것 안 읽음)', st);
    const jd = await F.slBenchJoin(M, { dry: true }); ok(jd.cand === 3 && jd.book === 2 && jd.cat === 2 && jd.kdc === 1 && jd.cv === 1 && writes.length === 0, '진단: ISBN·새책 번호로 우리 책 2 · 분류 2 · 국중 KDC 1 · 표지 1 · 쓰지 않음', jd);
    const by = F.slFillBySc(M).get('9'); ok(by.get('1').cat === '국내도서>어린이>동화' && by.get('1').cv === 'f0c040.bd' && by.get('2').cat === '국내도서>만화>일본만화' && by.get('3').cat === 'KDC>813.7>add0' && SL.genreOf(by.get('3').cat) === 'lit' && by.get('4').cat === '국내도서>소설/시/희곡', '이은 분류·KDC·표지가 셈 꼴로', [...by]);
    const M2 = (await F.slFillMap()).M; const jw = await F.slBenchJoin(M2, {}); ok(jw.cand === 3 && writes.length === 3 && writes.every(([, v]) => v.jxAt && !('cat' in v)), '쓰기: 이은 3개에 jxAt·catX/kdc/cv(빈 칸만 · cat 안 씀)', writes);
    const M3 = (await F.slFillMap()).M; for (const [p, v] of writes) Object.assign(M3.get(p.split('/')[1]), v); const j3 = await F.slBenchJoin(M3, {}); ok(j3.cand === 0, '30일 안엔 다시 잇지 않음', j3);
    const SS = blk('async function sellerLearnStudy', 'const slToDay'); ok(/SLc\.fillItems\(L, FB\.get\(x\.sc\)\)/.test(SS) && /SLc\.profile\(R, lookOf\(x\.sc\)\)/.test(SS) && /\.\.\.\(lookOf\(x\.sc\) \|\| \{\}\), \.\.\.look/.test(SS), '숍 목록(N09)·주력(N08 · 위 5곳은 ISBN 찾기와 합침)에 채운 정보');
    ok(/if \(!dry && needIds\.length\) await C\('app_settings'\)\.doc\('seller_front_need'\)/.test(SS) && /doc\.fill = \{/.test(SS), '앞 페이지 빈 상품 목록은 진단이 아닐 때만 저장 · 채움 요약 doc.fill');
    const S2 = blk('async function slStudy2', '/* ⑥ N11'); ok(/bigPub/.test(S2) && /SLc\.fillSens\(\(t\) =>/.test(S2) && /minFill: t/.test(S2) && /fillAge/.test(S2), '구성: 큰 출판사 · 채움 기준별 다시 셈 · 날짜 나이별 채움');
    const SB = blk('async function spBatchTick', '/* (adapt3)'); ok(/seller_front_need/.test(SB) && /cfg\.front !== false/.test(SB) && /L\.unshift\(\.\.\.F0\)/.test(SB) && /slice\(0, 300\)/.test(SB), '수집 적응 엔진: 앞 페이지 빈 상품을 회차마다 300개 먼저(끄기 adapt_cfg.spBatch.front=false)');
    const OI = blk('async function slOurItems', 'async function slStudy2'); ok(/'usedCode'\)\.get\(\)/.test(OI) && /SALE = await mlSales\(/.test(OI) && /SALE\.get\(String\(v\.usedCode\)\)/.test(OI), '우리 매물 팔림 = 판매 기록(soldAt만 보던 때 판 것 0)');
    ok(/if \(q\.bfill\)/.test(SRC) && /slBenchJoin\(M, \{ dry: true/.test(SRC), '진단 bfill(계산만 · 쓰지 않음)');
    console.log('④ 웹앱');
    ok(/function slFillBox\(D\)/.test(APP) && /\$\{slFillBox\(D\)\}/.test(APP) && /채움 기준별로 다시 셈/.test(APP) && /분야·표지 잇기\(새 요청 0/.test(APP), '🧑‍🏫 카드 › 🗂 구성 칸 안 🧩 채움 칸');
    ok(/const genOk = !catOk && p\.genKnownS/.test(APP) && /팔린 책 SP 가운데/.test(APP), '롤모델 주력: 장르·SP 가운데');
    const UI = APP.slice(APP.indexOf('function slFillBox'), APP.indexOf('function slMore')); ok(UI.length > 500 && !/\b(alert|confirm|prompt)\(/.test(UI), '브라우저 팝업 없음');
    console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); }); }
