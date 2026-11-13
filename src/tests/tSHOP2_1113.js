// tSHOP2_1113 — (11/13 shop2) 📚 우리숍 서가 설정 묶음(정범님 11/13 19:35)
//   ① 순수 셈: 가격대 기본 경계(1천원대~4천원대 · 5천원대 · 1만~4만원대 · 5만원 이상) · 상품명 글자 묶음 3가지 · 구역 바로 가기 목록(큰 주제·작은 주제·글자·가격대 · 책장 번호)
//      수량 여러 권(한 권만 + ×수량 / 모두 진열 · 최대 권 수) · 서가 자료 q 칸(클라우드 → 손님 화면) · 새 설정 칸이 설정 틀(SCHEMA)에 있음(관리 웹앱 📚 서가 책장 설정이 저절로 그림)
//   ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 책): PC 1280 — 가격대·상품명·주제 링크 줄 → 다른 책장의 구역을 누르면 그 책장으로 넘어가 그 표찰로 · 등록순은 줄 없음 · 설정으로 끔
//      휴대폰 390 — 위치 표시 + 링크 줄이 화면 위에 붙음 · 링크 줄은 한 줄 가로 밀기 · 가로 넘침 없음 · 누르기 쉬운 크기(40px) · 휴대폰 책 누름 3가지(아래 창 · 앞으로 나와 펼침 · 쏙 나오고 한 번 더) · 수량 표시
// 실행: node src/tests/tSHOP2_1113.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHOP2_1113.js · 손님 정보 없음(모두 지어낸 책)
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
(async () => {
console.log('① 순수 셈');
{ const c = BQS.cfgOf({}); const B = BQS.bandsOf(c.bands);
  const nm = (p) => BQS.bandName(B, p, c.bandStyle)[1]; const want = [[500, '1천원 아래'], [1000, '1천원대'], [1999, '1천원대'], [2500, '2천원대'], [3000, '3천원대'], [4900, '4천원대'], [5000, '5천원대'], [9999, '5천원대'], [10000, '1만원대'], [25000, '2만원대'], [39000, '3만원대'], [41000, '4만원대'], [50000, '5만원 이상'], [120000, '5만원 이상']];
  const got = want.map(([p]) => nm(p)); ok(want.every(([, w], i) => got[i] === w) && c.bandStyle === 'dae' && BQS.bandRange(B, 5) === '5,000~9,999원', `가격대 기본 경계 ${B.join(',')} → ${[...new Set(got)].join(' · ')} · 5천원대 = ${BQS.bandRange(B, 5)}`);
  ok(BQS.bandName(B, 7000)[1] === '5천원~1만원' && BQS.bandName(B, 7000, 'range')[1] === '5천원~1만원', '가격대 이름 「범위로」(옛 꼴)도 고를 수 있음');
  const T = ['가나', '까치', '나무', '바다', '빵', 'Apple', 'zoo', '123', '「사과」', '★별'];
  ok(T.map((t) => BQS.titleKey(t, 'cho')).join() === 'ㄱ,ㄱ,ㄴ,ㅂ,ㅂ,A–Z,A–Z,숫자,ㅅ,기호·그 밖' && T.map((t) => BQS.titleKey(t, 'az')).slice(5, 7).join() === 'A,Z' && T.map((t) => BQS.titleKey(t, 'wide')).join() === 'ㄱ~ㄷ,ㄱ~ㄷ,ㄱ~ㄷ,ㄹ~ㅂ,ㄹ~ㅂ,A–Z,A–Z,숫자·기호,ㅅ~ㅇ,숫자·기호',
    '상품명 글자 묶음: 첫소리(ㄲ→ㄱ · 따옴표 건너뜀) · 영문 글자마다 · 크게 다섯 묶음');
  const it = BQS.demoItems(900, 3); const P = BQS.plan(it, c, 'price'); const J = BQS.jumps(P, c);
  ok(J.length >= 5 && J.every((j, i) => !i || j.ci >= J[i - 1].ci) && J.reduce((a, j) => a + j.n, 0) === 900 && J.every((j) => P.cases[j.ci].slots.some((s) => s.lab && 'g' + s.gi === j.k)), `가격대 링크 ${J.length}개(${J.map((j) => `${j.name} ${j.n}권@${j.ci + 1}`).join(' · ')}) · 권 수 합 900 · 링크마다 그 책장에 표찰`);
  const PT = BQS.plan(it, c, 'title'); const JT = BQS.jumps(PT, c); ok(JT.length >= 6 && JT[0].name === 'ㄱ' && JT.some((j) => j.name === 'A–Z'), `상품명 링크: ${JT.map((j) => j.name).join(' ')}`);
  const cs = BQS.cfgOf({ jumpCat: 'small' }); const JC = BQS.jumps(BQS.plan(it, cs, 'cat'), cs); const JB = BQS.jumps(BQS.plan(it, c, 'cat'), c);
  ok(JB.every((j) => !j.lv) && JB[0].name === '소설·시' && JC.some((j) => j.lv === 1 && j.name === '한국소설') && JC.filter((j) => !j.lv).length === JB.length, `주제 링크: 큰 주제 ${JB.length}개 · 작은 주제까지 ${JC.length}개(예 ${JC.slice(0, 4).map((j) => (j.lv ? '› ' : '') + j.name).join(' ')})`);
  ok(!BQS.jumps(BQS.plan(it, c, 'reg'), c).length && !BQS.jumps(P, BQS.cfgOf({ jumpOn: false })).length && !BQS.jumps(P, BQS.cfgOf({ jumpSorts: ['cat'] })).length, '등록순·판매량·추천순은 링크 없음 · 설정으로 끔 · 정렬마다 고름');
  const q = it.map((x, i) => ({ ...x, q: i === 4 ? 3 : i === 9 ? 40 : 1 })); const n1 = BQS.plan(q, c, 'reg').n; const ca = BQS.cfgOf({ qtyMode: 'all', qtyMax: 10 }); const Pa = BQS.plan(q, ca, 'reg'); const ids = Pa.cases.flatMap((cs2) => cs2.slots.filter((s) => !s.lab).map((s) => s.id));
  ok(n1 === 900 && Pa.n === 900 + 2 + 9 && ids.filter((v) => v === q[4].id).length === 3 && ids.filter((v) => v === q[9].id).length === 10 && c.qtyMode === 'one' && c.qtyMax === 10, `수량: 한 권만 진열(기본) 900권 · 모두 진열이면 ${Pa.n}권(수량 3 → 3권 나란히 · 수량 40 → 최대 10권)`);
  const R = SH.shelfRows([{ id: 'x1', t: '책', p: 5000, q: 3, at: '2026-10-01' }, { id: 'x2', t: '책2', p: 5000, q: 1, at: '2026-10-01' }]); const U = BQS.unpack({ cols: SH.SHELF_COLS, pre: [], rows: R });
  ok(SH.SHELF_COLS.includes('q') && U.find((x) => x.id === 'x1').q === 3 && U.find((x) => x.id === 'x2').q === 1 && BQS.unpack({ cols: ['id', 't', 'p'], rows: [['a', 'b', 1]] })[0].q === 1, '서가 자료 q 칸(수량 2 넘을 때만) → 손님 화면 · 옛 클라우드(q 칸 없음)는 1권');
  const K = BQS.SCHEMA.map((p) => p.k); ok(['bandStyle', 'titleGroup', 'jumpOn', 'jumpSorts', 'jumpCat', 'jumpN', 'jumpMob', 'jumpStick', 'qtyMode', 'qtyMax', 'mobPop'].every((k) => K.includes(k)) && c.mobPop === 'sheet' && BQS.cfgOf({ mobPop: 'open' }).mobPop === 'open' && BQS.cfgOf({ mobPop: 'x' }).mobPop === 'sheet',
    '새 설정 칸 11개가 설정 틀에 있음(관리 웹앱 📚 서가 책장 설정이 그대로 그림) · 휴대폰 책 누름 기본 = 아래 창(지금 동작)');
  for (const f of ['shop/shelf.js', 'shop/shelf-core.js']) { const x = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(x), f + ': 브라우저 창 없음'); }
  const s = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf-core\.js\?v=0\.2\.(8|9|1[0-9])/.test(s) && /shelf\.js\?v=0\.2\.(8|9|1[0-9])/.test(s) && /shelf\.css\?v=0\.2\.(8|9|1[0-9])/.test(s), '우리숍: 서가 0.2.8 판 맞춤');
  ok(/x\.cpk \? `<li class="crumbs">/.test(s) && /v\.cpk = it\.cp/.test(fs.readFileSync(path.join(ROOT, 'cloud/shop.js'), 'utf8')) && /cnavH\(r, p0\)/.test(s), '상세: 🗂 종류 › 분류 › … 길 링크(누르면 그 분류 목록) · 책 찾기 분류 고르기'); }
console.log('①-2 종류·분류(정범님 11/13 19:42)');
{ const K = (p, sku) => { const r = SH.kindPath({ categories: [{ path: p }] }, sku); return r.k + (r.rest.length ? ':' + r.rest.join('/') : ''); };
  const C = [['온라인 중고샵>중고국내도서>소설/시/희곡>세계의 소설>중동/튀르키예소설', '국내도서:소설/시/희곡/세계의 소설/중동/튀르키예소설'], ['외국도서>ELT/어학/사전>워크북', '외국도서:ELT/어학/사전/워크북'], ['온라인 중고샵>중고외국도서>어린이>놀이책', '외국도서:어린이/놀이책'],
    ['DVD/블루레이>블루레이>드라마/코미디', '블루레이:드라마/코미디'], ['DVD/블루레이>애니메이션', 'DVD:애니메이션'], ['국내도서>잡지>여성/패션', '잡지:여성/패션'], ['외국도서>일본 도서>일본잡지>코믹/게임', '잡지:외국 잡지/일본 도서/코믹/게임'], ['음반>가요>발라드', '음반:가요/발라드'], ['음반>LP>가요', 'LP:가요'], ['소설/시/희곡>한국소설', '국내도서:소설/시/희곡/한국소설']];
  const got = C.map(([p]) => K(p)); ok(C.every(([, w], i) => got[i] === w) && K('', 'KHKDVD001') === 'DVD' && K('', 'KHKCPD01') === '음반' && K('', 'A01') === '그 밖', `알라딘 경로 → 종류·분류: ${got.slice(0, 7).join(' · ')} … · 경로 없으면 관리 코드(DVD·음반)`);
  ok(SH.KINDS.join() === '국내도서,외국도서,잡지,음반,LP,DVD,블루레이,그 밖', '종류 8가지: ' + SH.KINDS.join(' · '));
  const it = [{ id: 'a', cp: '국내도서>소설/시/희곡>한국소설', p: 1000, t: '가', at: '2026-10-01' }, { id: 'b', cp: '국내도서>소설/시/희곡>외국소설', p: 1000, t: '나', at: '2026-10-01' }, { id: 'c', cp: '외국도서>ELT/어학/사전>워크북', p: 1000, t: '다', at: '2026-10-01' }, { id: 'd', cp: '블루레이>드라마/코미디', p: 1000, t: '라', at: '2026-10-01' }, { id: 'e', cp: '잡지>여성/패션', p: 1000, t: '마', at: '2026-10-01' }];
  const T = SH.catTree(it); const M = new Map(T.tree);
  ok(T.kinds.map((k) => k.join(' ')).join() === '국내도서 2,외국도서 1,잡지 1,블루레이 1' && M.get('국내도서>소설/시/희곡') === 2 && M.get('국내도서>소설/시/희곡>한국소설') === 1 && !M.has('음반'), `분류 나무(상품 있는 칸만): ${T.tree.length}칸 · 종류 ${T.kinds.map((k) => k.join(' ')).join(' · ')}`);
  const L1 = SH.listItems(it, { cp: '국내도서>소설/시/희곡' }), L2 = SH.listItems(it, { cp: '국내도서>소설/시/희곡>한국소설' }), L3 = SH.listItems(it, { cp: '블루레이' }), L4 = SH.listItems(it, { cp: '국내도서>소설' });
  ok(L1.total === 2 && L2.total === 1 && L3.total === 1 && L4.total === 0, `목록 거르기(cp): 소설/시/희곡 ${L1.total} · 한국소설 ${L2.total} · 블루레이 ${L3.total} · 이름 앞부분만 같은 칸은 안 섞임(${L4.total})`);
  const pi = SH.pubItem('Z1', { status: '판매중', active: true, qty: 1, price: 3000, title: '시험 블루레이', sku: 'A01' }, { categories: [{ path: ['DVD/블루레이', '블루레이', '드라마/코미디'] }] });
  const pk = SH.pubItem('Z2', { status: '판매중', active: true, qty: 1, price: 3000, title: '시험 책', sku: 'A01' }, { categories: [{ path: '온라인 중고샵>중고국내도서>소설/시/희곡>한국소설' }] });
  ok(pi.cp === '블루레이>드라마/코미디' && pi.c === '블루레이' && pk.c === '소설/시/희곡' && pk.c2 === '한국소설' && SH.SHELF_COLS.includes('cp'), `공개 요약: 블루레이 c=${pi.c} · 중고국내도서 경로도 c=${pk.c}·c2=${pk.c2}(전엔 '중고국내도서') · 서가 자료 cp 칸`);
  const c0 = BQS.cfgOf({}); const xs = [...BQS.demoItems(200, 2), ...['외국도서>ELT/어학/사전>워크북', '블루레이>드라마/코미디', 'DVD>애니메이션', '잡지>여성/패션', '음반>가요', 'LP>재즈', '국내도서>소설/시/희곡>세계의 소설>중동/튀르키예소설'].map((cp, i) => ({ id: 'k' + i, t: '종류 ' + i, p: 3000, cp, at: '2026-10-01' }))];
  const Pc = BQS.plan(xs, c0, 'cat'); const nm = Pc.cases.flatMap((cs) => cs.groups.map((g) => g.name)); const J = BQS.jumps(Pc, c0).map((j) => j.name);
  const deep = BQS.catOf({ cp: '국내도서>소설/시/희곡>세계의 소설>중동/튀르키예소설' }, true), sh = BQS.catOf({ cp: '국내도서>소설/시/희곡>세계의 소설>중동/튀르키예소설' });
  ok(['외국도서', '블루레이', 'DVD', '잡지', '음반(CD)', 'LP'].every((k) => nm.includes(k) && J.includes(k)) && deep.b === '소설·시' && deep.s === '세계의 소설 › 중동/튀르키예소설' && sh.s === '세계의 소설' && BQS.catOf({ cp: '블루레이>드라마/코미디' }).s === '드라마/코미디',
    `서가: 종류 책장(외국도서·잡지·음반(CD)·LP·DVD·블루레이)과 링크 · 표찰 깊이 설정 — 둘째 단계 「${sh.s}」 / 가장 작은 분류까지 「${deep.s}」`); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHOP2_1113 ${bad}개 실패` : '✓ tSHOP2_1113 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shop2'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const CATS = ['소설/시/희곡', '인문학', '어린이', '경제경영', '역사', '에세이', '예술/대중문화', '과학']; const SUB = { '소설/시/희곡': ['한국소설', '외국소설'], 에세이: ['한국에세이'] };
const items = BQS.demoItems(900, 6).map((x, i) => ({ ...x, id: 'F' + i, c: CATS[i % 8], c2: SUB[CATS[i % 8]] ? SUB[CATS[i % 8]][i % 2 % SUB[CATS[i % 8]].length] : null, q: i % 40 === 2 ? 3 : 1, im: null, bk: null, cp: i % 10 === 7 ? '외국도서>ELT/어학/사전>워크북' : i % 10 === 8 ? '블루레이>드라마/코미디' : i % 30 === 9 ? '잡지>여성/패션' : null }));
const PUB = items.map((x) => ({ ...x, cp: x.cp || '국내도서>' + x.c + (x.c2 ? '>' + x.c2 : '') })); const KN = SH.catTree(PUB).kinds;
const rows = items.map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : x[k] == null ? null : x[k])));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/shop/cfg') return J({ ok: true, open: 1, name: '북스퀸', n: rows.length, cats: [], pay: { how: 'wait' }, biz: {}, kinds: KN, cats: [['소설/시/희곡', 90], ['인문학', 80]], shelf: { cap: 120, sort0: 'cat', fontsOn: false, coverColor: false, edgeSpine: false } });
  if (u.pathname === '/shop/shelf') return J({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows });
  if (u.pathname === '/shop/cats') { const T = SH.catTree(PUB); return J({ ok: true, n: PUB.length, ...T }); }
  if (u.pathname === '/shop/list') return J({ ok: true, ...SH.listItems(PUB, Object.fromEntries(u.searchParams)) });
  if (u.pathname === '/shop/item') { const x = items.find((y) => y.id === u.searchParams.get('id')); return x ? J({ ok: true, item: { ...x, st: 's', info: {}, pvs: [] }, same: [], rel: [] }) : J({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 240초 넘음'); process.exit(1); }, 240000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash) => { const ctx = await br.newContext(ctxO); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); } catch (e) {} }, base);
  await p.goto(base + '/s/index.html' + hash); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(600); return { ctx, p, errs }; };
const cfgQ = (o) => '&cfg=' + BQS.previewArg(BQS.cfgOf(o));
try {
  { const { ctx, p, errs } = await open({ viewport: { width: 1280, height: 860 } }, '#/shelf?s=price');
    const A = await p.evaluate(() => { const nv = document.querySelector('.bqs-jump'); return { vis: !nv.hidden, L: [...nv.querySelectorAll('.jl')].map((b) => [b.dataset.jk, b.textContent.trim(), +b.dataset.ci]), nav: !document.querySelector('.bqs-nav').hidden, here: document.querySelector('.bqs-here b').textContent }; });
    await p.screenshot({ path: path.join(SHOT, 'pc1280_price.png') });
    ok(A.vis && A.L.length >= 5 && /1천원대|2천원대/.test(A.L.map((x) => x[1]).join()) && A.nav, `PC 가격대: 링크 줄 ${A.L.length}개(${A.L.map((x) => x[1].replace(/\s+/g, ' ')).join(' / ')}) · 위치 길잡이(‹ ${A.here} ›) 그대로`);
    const far = A.L.filter((x) => x[2] > 0).pop(); await p.click(`.bqs-jump .jl[data-jk="${far[0]}"]`); await p.waitForTimeout(900);
    const Bj = await p.evaluate((k) => { const c = document.querySelector('.bqs-case.cur'); const t = c.querySelector(`[data-jk="${k}"]`); const r = t && t.getBoundingClientRect(); return { i: +c.dataset.i, top: r ? r.top : -1, on: (document.querySelector('.bqs-jump .jl.on') || {}).dataset ? document.querySelector('.bqs-jump .jl.on').dataset.jk : '', bar: document.querySelector('.bqs-bar').getBoundingClientRect().bottom }; }, far[0]);
    await p.screenshot({ path: path.join(SHOT, 'pc1280_price_jump.png') });
    ok(Bj.i === far[2] && Bj.top >= Bj.bar - 4 && Bj.top < 400 && Bj.on === far[0], `다른 책장 구역(${far[1].replace(/\s+/g, ' ')}) 누름 → 책장 ${far[2] + 1}로 넘어가 그 표찰이 위(${Math.round(Bj.top)}px · 도구 막대 아래 ${Math.round(Bj.bar)}px)에 · 그 링크에 불`);
    await p.selectOption('.bqs-sort', 'title'); await p.waitForTimeout(600); const Tt = await p.evaluate(() => [...document.querySelectorAll('.bqs-jump .jl')].map((b) => b.firstChild.textContent.trim()));
    await p.selectOption('.bqs-sort', 'reg'); await p.waitForTimeout(500); const Rg = await p.evaluate(() => document.querySelector('.bqs-jump').hidden);
    await p.selectOption('.bqs-sort', 'cat'); await p.waitForTimeout(600); const Ct = await p.evaluate(() => [...document.querySelectorAll('.bqs-jump .jl')].map((b) => b.firstChild.textContent.trim())); await p.screenshot({ path: path.join(SHOT, 'pc1280_cat.png') });
    ok(Tt[0] === 'ㄱ' && Tt.length >= 6 && Rg && Ct[0] === '소설·시' && Ct.length >= 10 && ['외국도서', '블루레이', '잡지'].every((k) => Ct.includes(k)), `상품명 링크 ${Tt.join(' ')} · 등록순은 줄 숨김 · 주제 링크 ${Ct.join(' · ')}`);
    ok(!errs.length, 'PC 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open({ viewport: { width: 1280, height: 860 } }, '#/shelf?s=price' + cfgQ({ jumpOn: false }));
    ok(await p.evaluate(() => document.querySelector('.bqs-jump').hidden), '설정 「링크 줄 보이기」를 끄면 줄 없음'); await ctx.close(); }
  const M = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  { const { ctx, p, errs } = await open(M, '#/shelf?s=cat' + cfgQ({ jumpCat: 'small' }));
    const A = await p.evaluate(() => { const nv = document.querySelector('.bqs-jump'); const ls = nv.querySelector('.jls'); const L = [...nv.querySelectorAll('.jl')]; const r = L.map((b) => b.getBoundingClientRect()); return { vis: !nv.hidden, n: L.length, h: Math.min(...r.map((x) => x.height)), row: new Set(r.map((x) => Math.round(x.top))).size, scroll: ls.scrollWidth > ls.clientWidth, sw: document.documentElement.scrollWidth, mp: document.querySelector('.bqs-mpos').getBoundingClientRect().height, sub: L.filter((b) => b.classList.contains('sub')).length }; });
    await p.screenshot({ path: path.join(SHOT, 'm390_top.png') });
    ok(A.vis && A.n >= 8 && A.h >= 40 && A.row === 1 && A.scroll && A.sw <= 390 && A.mp <= 40 && A.sub >= 2, `휴대폰 주제(작은 주제까지): 링크 ${A.n}개 한 줄 · 옆으로 밀기 · 높이 ${A.h}px(누르기 쉬움) · 작은 주제 ${A.sub}개 · 화면 가로 넘침 없음(${A.sw}px) · 위치 표시 ${A.mp}px`);
    const far = await p.evaluate(() => { const L = [...document.querySelectorAll('.bqs-jump .jl:not(.sub)')]; const b = L[L.length - 1]; return [b.dataset.jk, +b.dataset.ci, b.textContent.trim()]; });
    await p.evaluate((k) => document.querySelector(`.bqs-jump .jl[data-jk="${k}"]`).scrollIntoView({ inline: 'center', block: 'nearest' }), far[0]); await p.tap(`.bqs-jump .jl[data-jk="${far[0]}"]`); await p.waitForTimeout(1100);
    const Bj = await p.evaluate((k) => { const c = document.querySelector('.bqs-case.cur'); const t = c.querySelector(`[data-jk="${k}"]`); const st = document.querySelector('.bqs-stick').getBoundingClientRect(); const hd = document.querySelector('header.top').getBoundingClientRect(); return { i: +c.dataset.i, top: t ? t.getBoundingClientRect().top : -1, stTop: st.top, stBot: st.bottom, hd: hd.bottom, y: scrollY, on: (document.querySelector('.bqs-jump .jl.on[aria-current]') || { dataset: {} }).dataset.jk }; }, far[0]);
    await p.screenshot({ path: path.join(SHOT, 'm390_jump.png') });
    ok(Bj.i === far[1] && Bj.top >= Bj.stBot - 4 && Bj.top < Bj.stBot + 140 && Math.abs(Bj.stTop - Bj.hd) < 3 && Bj.y > 0 && Bj.on === far[0], `휴대폰 「${far[2].replace(/\s+/g, ' ')}」 누름 → 책장 ${far[1] + 1}로 · 그 표찰이 붙은 줄 바로 아래(${Math.round(Bj.top)}px) · 위치 표시·링크 줄이 머리 밑(${Math.round(Bj.stTop)}px)에 붙어 있음`);
    await p.evaluate(() => window.scrollBy(0, 900)); await p.waitForTimeout(400); const on2 = await p.evaluate(() => (document.querySelector('.bqs-jump .jl[aria-current]') || { dataset: {} }).dataset.jk || ''); await p.screenshot({ path: path.join(SHOT, 'm390_scrolled.png') });
    ok(!!on2, `내려가면 지금 구역 링크에 불(${on2})`);
    ok(!errs.length, '휴대폰 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const ctx = await br.newContext(M); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.addInitScript((u) => { window.BQ_API = u; }, base);
    await p.goto(base + '/s/index.html#/'); await p.waitForSelector('.chips.kinds .chip', { timeout: 15000 }); await p.waitForTimeout(300); const H0 = await p.evaluate(() => [...document.querySelectorAll('.chips.kinds .chip')].map((a) => a.textContent.trim())); await p.screenshot({ path: path.join(SHOT, 'm390_home_kinds.png') });
    ok(H0.length >= 4 && H0.some((t) => /외국도서/.test(t)) && H0.some((t) => /블루레이/.test(t)) && H0.some((t) => /잡지/.test(t)), `첫 화면 「종류」: ${H0.join(' · ')}`);
    await p.goto(base + '/s/index.html#/list'); await p.waitForSelector('.cn-kids .chip', { timeout: 15000 }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(SHOT, 'm390_list_root.png') });
    await p.click('.cn-kids .chip >> text=국내도서'); await p.waitForSelector('.cn-crumb b', { timeout: 8000 }); await p.waitForTimeout(500); const L1 = await p.evaluate(() => ({ cr: document.querySelector('.cn-crumb').textContent.replace(/\s+/g, ' ').trim(), kids: [...document.querySelectorAll('.cn-kids .chip')].map((a) => a.textContent.trim()), n: (document.querySelector('#lh') || {}).textContent || '', sw: document.documentElement.scrollWidth }));
    await p.click('.cn-kids .chip >> text=소설/시/희곡'); await p.waitForTimeout(700); await p.click('.cn-kids .chip >> nth=0'); await p.waitForTimeout(800);
    const L2 = await p.evaluate(() => ({ cr: document.querySelector('.cn-crumb').textContent.replace(/\s+/g, ' ').trim(), end: !!document.querySelector('.cn-end'), h: location.hash, n: (document.querySelector('#lh') || {}).textContent || '', cards: document.querySelectorAll('#lg .grid > *').length })); await p.screenshot({ path: path.join(SHOT, 'm390_list_leaf.png') });
    ok(/전체\s*›\s*(📚 )?국내도서/.test(L1.cr) && L1.kids.length >= 5 && L1.sw <= 390 && /전체\s*›\s*(📚 )?국내도서\s*›\s*소설\/시\/희곡\s*›\s*\S/.test(L2.cr) && L2.end && /cp=/.test(L2.h) && L2.cards > 0, `휴대폰 책 찾기: 「${L1.cr}」 아래 칸 ${L1.kids.length}개(가로 넘침 없음) → 「${L2.cr}」 가장 작은 분류 · 책 ${L2.cards}권 · ${L2.n.trim()}`);
    ok(!errs.length, '책 찾기 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  for (const [mode, want] of [['sheet', 'sheet'], ['open', 'ob'], ['lift', 'lift']]) { const { ctx, p, errs } = await open(M, '#/shelf?s=reg' + cfgQ({ mobPop: mode }));
    const id = await p.evaluate(() => [...document.querySelectorAll('.bqs-case.cur .sp')].find((b) => b.getBoundingClientRect().top > 200 && b.getBoundingClientRect().width > 10).dataset.id); const sel = `.bqs-case.cur .sp[data-id="${id}"]`;
    await p.tap(sel); for (let w = 0; w < 40; w++) { await p.waitForTimeout(100); if ((await p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '')) === 'open' || w > 14 && (await p.evaluate(() => !document.querySelector('.bqs-ob')))) break; } const R1 = await p.evaluate(() => ({ sheet: !document.querySelector('.bqs-sheet').hidden, ob: !!document.querySelector('.bqs-ob'), ph: document.querySelector('.bqs').dataset.obPhase || '', lift: !!document.querySelector('.sp.lift'), cap: (document.querySelector('.bqs-lcap') || {}).textContent || '' }));
    await p.screenshot({ path: path.join(SHOT, `m390_pop_${mode}_1.png`) }); let R2 = null;
    if (mode === 'lift') { await p.tap(sel); for (let w = 0; w < 40; w++) { await p.waitForTimeout(100); if ((await p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '')) === 'open') break; } R2 = await p.evaluate(() => ({ ob: !!document.querySelector('.bqs-ob'), ph: document.querySelector('.bqs').dataset.obPhase, lift: !!document.querySelector('.sp.lift') })); await p.screenshot({ path: path.join(SHOT, `m390_pop_${mode}_2.png`) }); }
    if (mode === 'sheet') ok(R1.sheet && !R1.ob, '휴대폰 책 누름 「아래 정보 창」(기본 · 지금까지 방식)');
    if (mode === 'open') ok(R1.ob && R1.ph === 'open' && !R1.sheet, `휴대폰 책 누름 「책이 뽑혀 앞으로 나와 펼쳐짐」 → ${R1.ph}`);
    if (mode === 'lift') ok(R1.lift && !R1.ob && /한 번 더/.test(R1.cap) && R2.ob && R2.ph === 'open' && !R2.lift, '휴대폰 「쏙 나오고 한 번 더」: 첫 누름 책등이 앞으로(이름·값 말풍선) → 둘째 누름 펼쳐짐');
    ok(!errs.length, `휴대폰(${mode}) 오류 0 ` + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  for (const mode of ['one', 'all']) { const { ctx, p } = await open(M, '#/shelf?s=reg' + cfgQ({ qtyMode: mode }));
    const Q = await p.evaluate(() => { const S = [...document.querySelectorAll('.bqs-case.cur .sp')]; const cnt = {}; S.forEach((b) => { cnt[b.dataset.id] = (cnt[b.dataset.id] || 0) + 1; }); const id = (S.find((b) => b.querySelector('.qn')) || S.find((b) => cnt[b.dataset.id] > 1) || {}).dataset; const L = id ? S.filter((b) => b.dataset.id === id.id) : []; window.__qid = id && id.id; return { n: L.length, qn: L.map((b) => (b.querySelector('.qn') || {}).textContent || '').join('|'), lab: L.map((b) => b.getAttribute('aria-label')).join(' / ') }; });
    if (mode === 'one') ok(Q.n === 1 && Q.qn === '×3' && /3권 있음/.test(Q.lab), `수량 3권 상품 — 한 권만 진열 + 「×3」 표시`); else ok(Q.n === 3 && !Q.qn.replace(/\|/g, '') && /같은 책/.test(Q.lab), '수량 3권 상품 — 여러 권 모두 진열: 같은 책등 3권 나란히');
    await p.evaluate(() => { const b = document.querySelector(`.bqs-case.cur .sp[data-id="${window.__qid}"]`); if (b) b.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, `m390_qty_${mode}.png`) }); await ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 예외', e && e.stack ? e.stack.slice(0, 600) : e); }
await br.close(); srv.close(); clearTimeout(kill);
console.log(bad ? `❌ tSHOP2_1113 ${bad}개 실패 · 사진 ${SHOT}` : `✓ tSHOP2_1113 모두 통과 · 사진 ${SHOT}`); process.exit(bad ? 1 : 0);
})();
