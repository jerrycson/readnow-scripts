// tADAPT10_1112 — 11/12 밤 adapt10: 🔄 목표·방법 장부를 수집기(PC)·클라우드 바깥 시세·목록 화면 칸별 길에 붙임(약속 64 · 머리 그대로)
//   ① split.js가 공용 readnow-adapt-core.js ◆AG 덩어리를 readnow-pc-runtime.js 앞에 글자 그대로 넣음(ReadnowAdaptAg) · 머리 서명 8ab2f661d1d8afa8 그대로 · 이으면 원본과 같음
//   ② 수집기 장부(rnAgPc): 공용 파서(상품 화면)를 감싸 칸마다 길(운영 파서·글 이름표·구조 데이터) 성적 · 같은 화면은 한 번만 · 회차 40번 → 장부 · 원래 결과 그대로
//   ③ 알라딘이 상품 화면의 SP 표기·자리를 바꾸면(운영 파서가 못 읽음) → 칸별 길에서 운영 파서 맞음률 떨어짐·글 이름표는 읽음 → 판정 떨어짐/무너짐 → '바뀜' 줄
//   ④ 15분마다 Firestore: adapt_pc/<PC> · adapt_goals sum['pc_<엔진>@<PC>'] · finds_inbox(새 줄만) · 끄기 rn-ag-off
//   ⑤ 바깥 시세(ReadnowExt.run 감쌈 · 출처가 길) · 벤치마킹·공개 화면 길·예스24 운영 고리 · 목록 화면 extractList 칸별 길(fl) · 클라우드·웹앱 글 검사
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tADAPT10_1112.js · 지어낸 값만(손님 정보 없음)
const fs = require('fs'); const path = require('path'); const os = require('os'); const cp = require('child_process');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const find = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
const ACF = find(['readnow-adapt-core.js']); const A = require(ACF); const P = require(find(['readnow-products-core.js']));
const SRC = fs.readFileSync(find(['src/readnow-collector.src.js', 'readnow-collector.src.js']), 'utf8'); const CSRC = fs.readFileSync(find(['cloud/index.js']), 'utf8'); const APP = fs.readFileSync(find(['src/app.html', 'app.html']), 'utf8');
const SPLIT = find(['src/split.js', 'split.js']);

console.log('① 수집기에 틀 넣기 — 머리 그대로');
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'ad10-')); fs.copyFileSync(ACF, path.join(T, 'readnow-adapt-core.js')); fs.writeFileSync(path.join(T, 'c.user.js'), SRC);
const sp = cp.spawnSync('node', [SPLIT, path.join(T, 'c.user.js'), path.join(T, 'out')], { encoding: 'utf8' }); ok(sp.status === 0 && /이으면 원본과 같음/.test(sp.stdout), 'split.js 나눔 · 관문 통과', sp.stderr.slice(0, 400));
const hs = fs.readFileSync(path.join(T, 'out/pc-live-head.txt'), 'utf8').split('\n')[0].trim(); ok(hs === '8ab2f661d1d8afa8', '머리 서명 8ab2f661d1d8afa8 그대로', hs);
const RT = fs.readFileSync(path.join(T, 'out/readnow-pc-runtime.js'), 'utf8'); const blk = (t) => t.slice(t.indexOf('/* ◆AG-BEGIN'), t.indexOf('/* ◆AG-END */'));
ok(RT.includes(blk(fs.readFileSync(ACF, 'utf8'))) && RT.indexOf('ReadnowAdaptAg') < RT.indexOf('__rnModQ'), '◆AG 덩어리를 글자 그대로 · 모듈 줄보다 앞');
const col = fs.readFileSync(path.join(T, 'out/readnow-collector.user.js'), 'utf8'); ok(!/readnow-adapt-core/.test(col) && (col.match(/^\/\/ @require/gm) || []).length === (fs.readFileSync(find(['readnow-collector.user.js']), 'utf8').match(/^\/\/ @require/gm) || []).length, '@require 줄 수가 지금 GitHub 본체와 같음(새로 늘지 않음)', (col.match(/^\/\/ @require/gm) || []).length);
const sb0 = { console }; sb0.globalThis = sb0; sb0.window = sb0; require('vm').createContext(sb0); require('vm').runInContext(RT, sb0); const AG = sb0.ReadnowAdaptAg;
ok(AG && AG.VERSION === A.VERSION && ['agRecord', 'agAdapt', 'agFill', 'agFillTally', 'agSummary', 'agPick'].every((k) => typeof AG[k] === 'function'), `수집기 틀 ReadnowAdaptAg ${AG && AG.VERSION} = 공용 ${A.VERSION}`);
fs.rmSync(T, { recursive: true, force: true });

console.log('② 수집기 장부 — 상품 화면 칸마다 길');
const IIFE = (() => { const a = SRC.indexOf('(function rnAgPc() {'); const b = SRC.indexOf('\n})();', a); return SRC.slice(a, b + 6); })(); ok(IIFE.length > 3000, '수집기 원본에 rnAgPc 덩어리');
const GM = {}; const W = []; const FB = { apps: [1], auth: () => ({ currentUser: { uid: 'u' } }) };
const fsDoc = (c, id) => ({ set: async (v, o) => W.push({ op: 'set', c, id, v, o }), update: async (...a) => W.push({ op: 'update', c, id, a }) });
FB.firestore = Object.assign(() => ({ collection: (c) => ({ doc: (id) => fsDoc(c, id) }) }), { FieldPath: function (...p) { this.p = p; }, FieldValue: { arrayUnion: (...x) => ({ union: x }) } });
const XRUN = []; const EXS = { SOURCES: { kyobo: { grp: 'basic' }, nl: { grp: 'lib' } }, run: async (src) => { XRUN.push(src); return src === 'nl' ? { ok: false, why: '시간 넘음' } : { ok: true, price: 1 }; } };
const timers = []; const sb = { console, JSON, Date, Math, Object, Array, String, Number, Set, Map, WeakMap, RegExp, Promise, parseInt, isFinite, setInterval: (f) => timers.push(f), addEventListener: () => {},
  GM_getValue: (k, d) => (k in GM ? JSON.parse(GM[k]) : d), GM_setValue: (k, v) => { GM[k] = JSON.stringify(v); }, firebase: FB, ReadnowAdaptAg: A, ReadnowProducts: { ...P }, ReadnowExt: EXS, __rnPcName: { get: () => 'PC 시험' } };
sb.globalThis = sb; sb.window = sb; require('vm').createContext(sb); require('vm').runInContext(IIFE, sb);
const R = sb.__rnAgPc; ok(R && typeof R.peek === 'function', '수집기 장부 열림(window.__rnAgPc)');
const prod = (sp, lbl, moved) => new JSDOM(`<html><head><meta property="books:isbn" content="9791100000017"><script type="application/ld+json">{"@type":"Book","workExample":[{"datePublished":"2024-03-02","isbn":"9791100000017"}]}</script></head><body>
  <div class="Ere_prod_titlewrap"><ul class="tlist"><li><span class="Ere_bo_title">시험 책 하나</span></li><li class="Ere_sub2_title"><a href="/x?AuthorSearch=@1">가나다</a> (지은이) <a href="/x?PublisherSearch=@2">시험 출판사</a> 2024-03-02</li></ul></div>
  ${moved ? `<div id="newRank"><span>${lbl} : <b>${sp.toLocaleString('en-US')}</b></span></div>` : `<div id="wa_product_top1_wa_Top_Ranking_pnlRanking"><div class="Ere_fs15 Ere_ht18">국내도서 10위 <div>${lbl} : <strong>${sp.toLocaleString('en-US')}</strong></div></div></div>`}
  <div class="Ere_prod_Binfowrap"><ul class="info_list"><li><span class="Litem">정가</span><span class="Ritem"><del>15,000원</del></span></li><li><span class="Litem">판매가</span><span class="Ritem"><em itemprop="price">13,500</em>원</span></li></ul></div>
  <div class="conts_info_list1"><ul><li>300쪽</li><li>ISBN : 9791100000017</li></ul></div></body></html>`, { url: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1' }).window.document;
const d0 = prod(4210, 'Sales Point'); const r1 = sb.ReadnowProducts.parseProductPage(d0, 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1'); const r2 = sb.ReadnowProducts.parseProductPage(d0);
ok(r1.salesPoint === 4210 && JSON.stringify(r1) === JSON.stringify(P.parseProductPage(d0, 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1')), '감싼 파서의 결과는 원래와 같음(SP 4,210)');
R.push(); let acc = JSON.parse(GM['rn-ag-acc']); ok(acc.al_product && acc.al_product.m.op[0] === 8 && acc.al_product.fl.salesPoint.op[0] === 1, '같은 화면을 두 번 읽어도 한 번만 셈(칸 8개 · SP 한 번)', acc.al_product && acc.al_product.m);
ok(acc.al_product.fl.salesPoint.lbl[2] === 1 && acc.al_product.fl.isbn13.ld[2] === 1 && acc.al_product.fl.pubDate.ld[2] === 1, '칸마다 길 — SP 글 이름표·ISBN/출간일 구조 데이터도 맞음', acc.al_product.fl);
for (let i = 0; i < 6; i++) sb.ReadnowProducts.parseProductPage(prod(100 + i, 'Sales Point')); R.push(); const L1 = JSON.parse(GM['rn-ag-g'] || '{}'); const g1 = L1.pc_al_product;
ok(g1 && g1.champ === 'op' && g1.fl && g1.fl.salesPoint.op[0] === 7, '회차(40칸) 차면 장부 pc_al_product · 챔피언 운영 파서', g1 && { champ: g1.champ, fl: g1.fl && g1.fl.salesPoint });
console.log('③ 알라딘이 SP 표기·자리를 바꿈');
const t0 = Date.now(); for (let k = 0; k < 4; k++) { for (let i = 0; i < 6; i++) sb.ReadnowProducts.parseProductPage(prod(200 + i, 'Sales Point')); R.push(); }
for (let k = 0; k < 4; k++) { for (let i = 0; i < 6; i++) sb.ReadnowProducts.parseProductPage(prod(300 + i, '세일즈포인트', true)); R.push(); }
const L2 = JSON.parse(GM['rn-ag-g']); const g2 = L2.pc_al_product; const sm = A.agSummary(g2); const lines = JSON.parse(GM['rn-ag-lines'] || '[]');
ok(sm.fl && sm.fl.f.salesPoint.op[2] < 0.8 && sm.fl.f.salesPoint.lbl[2] > 0.95, `칸별 길: SP 운영 파서 맞음 ${sm.fl && Math.round(sm.fl.f.salesPoint.op[2] * 100)}% · 글 이름표(세일즈포인트) ${sm.fl && Math.round(sm.fl.f.salesPoint.lbl[2] * 100)}%`, sm.fl);
const gs = L2.pc_al_sp; const jd = A.agJudge(gs); ok(['drop', 'broken'].includes(jd.st) && lines.some((l) => l.eng === 'pc_al_sp' && l.kind === '바뀜'), `SP 장부 판정 ${jd.st} · '바뀜' 줄`, { jd, lines: lines.map((l) => l.t) });
  ok(gs.smp && gs.smp.op && gs.smp.op.bad && /세일즈포인트/.test(gs.smp.op.bad.s) && /Sales Point/.test(gs.smp.op.good.s), '잘 되던 원문(Sales Point)·안 된 원문(세일즈포인트) 표본 둘 다', gs.smp);
console.log('④ Firestore로 · 끄기');
const fr = await0(R.flush(true)); function await0(p) { return p; }
(async () => {
  const f = await fr; ok(f && f.n >= 1, 'flush — 장부 보냄', f);
  const pcDoc = W.find((w) => w.c === 'adapt_pc' && w.id === 'PC_시험'); ok(pcDoc && JSON.parse(pcDoc.v.gs).pc_al_product && pcDoc.v.pc === 'PC_시험', 'adapt_pc/<PC>에 장부 몸통(글 gs)', pcDoc && Object.keys(pcDoc.v));
  const nest = (x) => Array.isArray(x) ? x.some((y) => Array.isArray(y) || nest(y)) : x && typeof x === 'object' && !(x.union) ? Object.values(x).some(nest) : x && x.union ? x.union.some(nest) : false;
  ok(W.every((w) => !nest(w.v) && !nest((w.a || []).filter((y) => !(y && y.p)))), '쓰는 모든 문서에 배열 안 배열 없음(웹 SDK가 거절 — 1.89.289에서 PC 장부가 안 올라간 까닭)', W.map((w) => w.c + '/' + w.id));
  const up = W.find((w) => w.c === 'app_settings' && w.id === 'adapt_goals' && w.op === 'update'); const ids = up ? up.a.filter((x) => x && x.p).map((x) => x.p.join('.')) : []; ok(ids.includes('sum.pc_al_product@PC_시험'), "adapt_goals sum['pc_al_product@PC_시험'](웹앱 🔄 엔진 적응 상태)", ids);
  const sv = up && up.a[up.a.findIndex((x) => x && x.p && x.p[1] === 'pc_al_product@PC_시험') + 1]; ok(sv && /· PC_시험$/.test(sv.label) && sv.fl, '요약에 PC 이름 · 칸별 길(fl)', sv && { label: sv.label });
  const fi = W.find((w) => w.c === 'app_settings' && w.id === 'finds_inbox'); ok(!lines.length || (fi && fi.v.L.union.length >= 1 && fi.v.L.union.every((x) => x.src === '엔진')), '발견 모음 넘김(새 줄만 · arrayUnion)', fi && fi.v.L);
  const n0 = W.length; const f2 = await R.flush(); ok(f2 === null && W.length === n0, '15분 안엔 다시 안 씀');
  GM['rn-ag-off'] = '1'; const a0 = GM['rn-ag-acc']; sb.ReadnowProducts.parseProductPage(prod(999, 'Sales Point')); R.push(); ok(GM['rn-ag-acc'] === a0, '끄기(rn-ag-off) — 아무것도 안 셈'); delete GM['rn-ag-off'];
  console.log('⑤ 바깥 시세 · 다른 고리');
  await sb.ReadnowExt.run('kyobo', {}); await sb.ReadnowExt.run('nl', {}); R.push(); const ac = JSON.parse(GM['rn-ag-acc']); ok(XRUN.length === 2 && ac.ext && ac.ext.m.kyobo[1] === 1 && ac.ext.m.nl[1] === 0 && ac.ext.fl.grp_basic, '바깥 시세 — 출처가 길(교보 성공·국중 실패) · 원래 결과 그대로', ac.ext);
  ok(/A\.rows\('bench_list', 'simple'/.test(SRC) && /A\.rows\('bench_list', 'box'/.test(SRC), '🎯 벤치마킹 숍 목록 — 간단히 보기·상자 두 길');
  ok(/A\.obs\('pub_read', s\.anon > b0 \? 'anon' : 'logged'/.test(SRC) && /async function read0\(kind, url, norm, valid\)/.test(SRC), '공개 화면 읽기 길(로그인 없이·로그인)');
  ok(/A\.obs\('y24_ops', mid/.test(SRC) && /rec\.c2 = 1;/.test(SRC), '🟦 예스24 운영 응답 올리기(창·번외 응답 길 구분)');
  ok(/wrap\(PR, 'parseUsedPage'/.test(SRC) && /wrap\(PR, 'parseSearchResults'/.test(SRC) && /wrap\(PR, 'parseScmList'/.test(SRC) && /wrap\(PR, 'parseYes24Search'/.test(SRC) && /wrap\(SL, 'parseShopSummary'/.test(SRC), '중고·검색 목록·샵매니저 목록·예스24 목록·판매자 숍 파서도 감쌈');
  ok(!/naver|네이버 다시 로그인|wifi/i.test(IIFE.replace(/네이버 와이파이 규칙/g, '')), '수집기 장부는 네이버·와이파이·로거 규칙을 건드리지 않음');
  const dl = new JSDOM(`<body>${[1, 2, 3].map((i) => `<div class="ss_book_box" itemid="${i}"><a class="bo3" href="/shop/wproduct.aspx?ItemId=${i}">시험 책 ${i}</a> 지은이 가나다 | 시험 출판사 | 2024년 3월 <span class="ss_p2"><em>13,500</em>원</span> 세일즈포인트 : <b>${i * 100}</b></div>`).join('')}</body>`).window.document;
  const X = A.extractList(dl, { kind: 'al_list' }); const H = A.healthOfList([X], 'al_list'); ok(X.fl && Object.keys(X.fl).length && H.fl && Object.keys(H.fl).length === Object.keys(X.fl).length, `목록 화면 칸별 길(extractList fl · healthOfList fl) — 칸 ${Object.keys((X && X.fl) || {}).length}개`, X.fl);
  ok(/AM\.agFill\(g0, T\)/.test(CSRC) && /v\.health\.fl/.test(CSRC), '클라우드 매일 점검 — 목록 화면(알라딘·예스24) 칸별 길을 장부(read_al_list·read_y24_list)에');
  ok(/agObs\('ext_' \+ \(s\.grp \|\| 'etc'\), agExtSeed\(s\.grp\), src/.test(CSRC), '클라우드 바깥 시세 — 출처 묶음마다 장부(길 = 출처)');
  ok(/async function agFoldC2\(/.test(CSRC) && /C\('col2_adapt'\)/.test(CSRC) && /\['adapt_pc', 'pc'\], \['col2_adapt', 'c2'\]/.test(CSRC), '번외 장부 옮김(col2_adapt → sum·발견 모음) · 진단 ag=1에 pc·c2');
  ok(/function agsFl\(fl\)/.test(APP) && /\$\{agsFl\(x\.fl\)\}/.test(APP), '웹앱 🔄 엔진 적응 상태 — 🧩 칸별 길 줄');
  console.log(bad ? `✗ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
