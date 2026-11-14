// tSHOPMISC1_1114 — (11/14 shopmisc1 · 정범님 11/14 18:13 다섯 가지)
//   ① 🗂 우리숍 주제분류 — 알라딘 1단계 → 우리 이름 바꿈표(cloud/shop-cat.js) · 세트 종류 · 옛 주소(알라딘 이름) 읽기 · 자료(알라딘 경로)는 그대로 · 서가 세트 책장
//   ② 🧩 웹앱 주제분류에 세트(listingCat · 고르기 목록 · 👀 조회수 분석 주제 분류)
//   ③ 📏 단위 한 곳 — readnow-products-core.js unitOf · cloud/shop-cat.js unitOf · shop/shop-core.js unitOf가 같은 답(책 권 · 세트 · 디스크 장 · 테이프·굿즈 개)
//   ④ 💿 CD·DVD·블루레이 = 앞·뒤 표지 + 솟는 디스크(LP와 다름) — 화면(RN_SHELF_UI=1)에서 서가·상품 화면
//   ⑤ ⬇ 서가에서 꺼낸 책을 아래로 끌어내리면 책장에 꽂힘 + 「↩ 다시 꺼내기」 — 화면(RN_SHELF_UI=1 · 마우스·손가락)
// 실행: node src/tests/tSHOPMISC1_1114.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> NODE_PATH=/opt/node-tools/node_modules node src/tests/tSHOPMISC1_1114.js
//   시험 자료는 모두 지어낸 상품(실제 손님·상품 정보 없음)
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const SH = require(path.join(ROOT, 'cloud/shop.js')); const SC = require(path.join(ROOT, 'cloud/shop-cat.js'));
const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const BQ = require(path.join(ROOT, 'shop/shop-core.js')); const PR = require(path.join(ROOT, 'readnow-products-core.js'));
(async () => {
console.log('① 우리숍 주제분류');
{ const P = (p, t, id) => { const r = SH.shopPath({ categories: [{ path: p }] }, '', t || '책', id || 'x'); return [r.k, ...r.rest].join('>'); };
  ok(P('국내도서>소설/시/희곡>한국소설') === '국내도서>소설·시·희곡>한국소설' && P('국내도서>인문학>철학 일반') === '국내도서>인문>철학 일반' && P('국내도서>사회과학>정치') === '국내도서>사회·정치>정치', '알라딘 이름 → 우리 이름(소설·시·희곡 · 인문 · 사회·정치)');
  ok(P('국내도서>장르소설>추리/미스터리') === '국내도서>소설·시·희곡>장르소설>추리/미스터리' && P('국내도서>중학교참고서>수학') === '국내도서>중고등참고서>중학교>수학' && P('국내도서>좋은부모>육아') === '국내도서>가정·육아>육아', '알라딘만의 1단계는 우리 묶음 아래로(장르소설 → 소설 아래 · 중·고등 참고서 합침 · 좋은부모 → 가정·육아)');
  ok(P('국내도서>만화/라이트노벨>라이트 노벨') === '국내도서>만화>라이트 노벨' && P('국내도서>청소년_추천도서>x') === '국내도서>청소년>추천도서>x' && P('국내도서>모르는_분류>x') === '국내도서>모르는_분류>x', '실제 우리숍에서 찾은 남은 알라딘 이름: 만화/라이트노벨 → 만화 · 청소년_추천도서 → 청소년 › 추천도서 · 모르는 밑줄 이름은 그대로');
  ok(P('국내도서>역사>한국사') === '국내도서>역사>한국사' && P('국내도서>에세이') === '국내도서>에세이' && P('국내도서>새로생긴분야>x') === '국내도서>새로생긴분야>x', '여러 서점이 같이 쓰는 이름은 그대로 · 바꿈표에 없는 새 분야도 빠지지 않고 그대로');
  ok(P('국내도서>소설/시/희곡>한국소설', '[세트] 시험 대하소설 1~10') === '세트>소설·시·희곡' && P('국내도서>전집/중고전집>유아전집') === '세트>유아전집' && P('외국도서>소설', 'Test Boxed Set') === '세트>외국도서', '세트: 제목의 강한 신호·알라딘 전집 분류 → 세트 종류(그 책의 분야를 아래 칸으로)');
  ok(P('국내도서>에세이', '세트 메뉴 요리책') === '국내도서>에세이' && P('음반>가요', '[CD] 시험 박스 세트 1~3') === '음반>가요', "약한 신호('세트' 낱말만)는 세트 아님 · 음반·영상 박스는 그 종류 그대로");
  { const fix = 'id9 0\nid8 4'; const q = (p, t, id) => { const r = SC.ourPath(SH.kindPath({ categories: [{ path: p }] }, ''), t, id, fix); return r.k; }; ok(q('국내도서>소설/시/희곡', '[세트] 시험 1~3', 'id9') === '국내도서' && q('국내도서>소설/시/희곡', '시험 한 권', 'id8') === '세트', '관리자 바로잡기(서가 설정 「세트 권 수」): 0 = 세트 아님 · 2 넘음 = 세트(제목보다 먼저)'); }
  ok(SH.KINDS.indexOf('세트') === 2 && SC.legacyCp('국내도서>소설/시/희곡>한국소설') === '국내도서>소설·시·희곡>한국소설' && SC.legacyCp('국내도서>전집/중고전집') === '세트' && SC.legacyCp('음반>가요') === '음반>가요', '종류 차례에 세트 · 옛 주소(알라딘 이름)를 우리 경로로 읽음');
  const it = [{ id: 'a', cp: '국내도서>소설·시·희곡>한국소설', c: '소설·시·희곡', p: 1000, t: '가', at: '2026-10-01' }, { id: 'b', cp: '세트>소설·시·희곡', c: '세트', p: 1000, t: '나', at: '2026-10-01' }];
  ok(SH.listItems(it, { cp: '국내도서>소설/시/희곡' }).total === 1 && SH.listItems(it, { c: '소설/시/희곡' }).total === 1 && SH.listItems(it, { cp: '세트' }).total === 1, '목록 거르기: 옛 ?cp=·?c= 알라딘 이름 주소도 찾음 · 세트만 보기');
  const pub = SH.pubItem('u1', { status: '판매중', price: 5000, title: '[세트] 시험 1~5' }, { categories: [{ path: '국내도서>소설/시/희곡>한국소설' }] }); const B0 = { categories: [{ path: '국내도서>소설/시/희곡>한국소설' }] };
  ok(pub.cp === '세트>소설·시·희곡' && pub.c === '세트' && pub.c2 === '소설·시·희곡' && B0.categories[0].path === '국내도서>소설/시/희곡>한국소설', `공개 요약 cp ${pub.cp} · c ${pub.c} · 도서 정보(알라딘 경로)는 그대로`);
  const T = SH.catTree([pub, { cp: '국내도서>인문>철학' }]); ok(T.kinds.map((k) => k[0]).join() === '국내도서,세트', '분류 나무 종류 차례: 국내도서 → 세트');
  ok(BQS.catOf({ cp: '세트>소설·시·희곡', t: 'x' }).k === 'set' && BQS.catOf({ cp: '국내도서>사회·정치>정치' }).k === 'society' && BQS.catOf({ cp: '국내도서>컴퓨터·IT>x' }).k === 'it' && BQS.catOf({ cp: '국내도서>중고등참고서>중학교' }).k === 'exam' && BQS.catOf({ cp: '국내도서>예술·대중문화>음악' }).k === 'art' && BQS.catOf({ cp: '국내도서>가정·육아>육아' }).k === 'family',
    '서가 책장: 세트 책장 · 우리 이름도 같은 책장으로(사회·정치 · 컴퓨터·IT · 참고서 · 예술 · 가정·육아)');
  const promo = require(path.join(ROOT, 'cloud/shop-promo.js')); ok(typeof promo.kindOf === 'function' && promo.kindOf('국내도서>소설/시/희곡', '') === 'kr', '할인 규칙은 예전처럼 알라딘 경로로(규칙이 그대로 맞음)');
  ok(SC.TABLE().length >= 25 && SC.TABLE().every((r) => r.al && r.ours), `바꿈표 ${SC.TABLE().length}줄(보고서·관리 화면 안내용)`); }

console.log('② 웹앱 주제분류에 세트');
{ const A = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8');
  ok(/const SET_CAT = '세트'/.test(A) && /if \(isSetL\(l\)\) return depth === 3 \? bookCatOf\(l\.bookId, 2\) : SET_CAT;/.test(A) && /m && m\.cat\) return depth === 3 \? \(m\.sub \|\| m\.cat\) : m\.cat; if \(isSetL/.test(A), 'listingCat: 사람이 정한 분류가 먼저 → 세트 → 알라딘 분류');
  ok(/L\.includes\(SET_CAT\) \? L : \[SET_CAT, \.\.\.L\]/.test(A) && /cat: l && isSetL\(l\) \? SET_CAT/.test(A), '분류 고르기 목록에 늘 세트 · 👀 조회수 분석 주제 분류에도 세트');
  const isSet = (t, p1) => { const r = PR.setInfo(t); return (r.set && r.level === 'strong') || /^전집/.test(p1 || ''); }; ok(isSet('[세트] 시험 1~3') && isSet('시험 세트 - 전5권') && !isSet('세트 메뉴 요리책') && isSet('x', '전집/중고전집'), '웹앱 세트 판단 = 공용 setInfo 강한 신호 + 알라딘 전집'); }

console.log('③ 단위 한 곳');
{ const C = [['데미안', '국내도서>소설·시·희곡', '권'], ['[세트] 시험 1~7', '세트>소설·시·희곡', '세트'], ['[CD] 시험 5집', '음반>가요', '장'], ['[LP] 시험 1집', 'LP>가요', '장'], ['[DVD] 시험 영화', 'DVD>드라마', '장'], ['[블루레이] 시험', '블루레이>SF', '장'], ['[VHS] 시험 테이프', 'DVD>애니메이션', '개'], ['[카세트] 시험', '음반>가요', '개'], ['시험 잡지 11월호', '잡지>여성', '권']];
  for (const [t, cp, u] of C) { const a = PR.unitOf({ title: t, categories: [{ path: [cp.split('>')[0] === '세트' ? '국내도서' : cp.split('>')[0]] }] }); const b = SC.unitOf(cp, t); const c = BQ.unitOf({ cp, t }); ok(a === u && b === u && c === u, `${t}: 공용 ${a} · 우리숍 서버 ${b} · 손님 화면 ${c} (= ${u})`); }
  ok(PR.unitOf('에코백 굿즈') === '개' && PR.unitOf('') === '권' && PR.qtyMix([['데미안', 2], ['[CD] x', 1]]) === '2권 · 1장' && PR.qtyTxt(3, '[블루레이] x') === '3장', '공용: 굿즈 개 · 모르면 권 · 섞인 합 「2권 · 1장」');
  ok(BQ.unitsTxt([{ id: 'a' }, { id: 'b', n: 2 }]) === '3권' && BQ.unitsTxt([{ id: 'a' }, { id: 'c', u: '장' }]) === '1권 · 1장' && BQ.cartAdd([], { id: 'c', t: '[CD] x', cp: '음반>가요', p: 1 }).cart[0].u === '장' && !('u' in BQ.cartAdd([], { id: 'b', t: '책', cp: '국내도서>x', p: 1 }).cart[0]), '손님 화면: 장바구니 줄에 단위(책이 아닐 때만 u) · 머리 「3권」/「1권 · 1장」');
  const why = BQ.cartAdd([{ id: 'c', t: '[CD] x', u: '장', n: 2, q: 2, p: 1 }], { id: 'c', t: '[CD] x', cp: '음반>가요', q: 2, p: 1 }, 20, 5).why; ok(/2장까지/.test(why) && /재고 2장/.test(why), '같은 상품 여러 개 한도 글도 그 단위: ' + why);
  const A = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8'); const K = fs.readFileSync(path.join(ROOT, 'src/readnow-collector.src.js'), 'utf8');
  ok(/const uqL = \(n, l\) => num\(n\) \+ unitOfL\(l\);/.test(A) && (A.match(/uqL\(/g) || []).length >= 8 && /kv\('수량', uqL\(l\.qty, l\)\)/.test(A), `웹앱: 상품 줄 단위 도우미(공용 unitOf) · ${(A.match(/uqL\(/g) || []).length}곳`);
  ok((K.match(/ReadnowProducts \|\| \{\}\)\.unitOf \|\| \(\(\) => '권'\)\)/g) || []).length >= 5, '수집기 본체: 수량 바꿈 기록 글에 공용 unitOf(머리 안 건드림)'); }

console.log('④ 💿 디스크 보기 셈');
{ const h = BQ.discH({ t: '시험 앨범', cp: '음반>가요', im: 'https://x/a.jpg', bk: 'https://x/b.jpg' }); const h2 = BQ.discH({ t: '뒤 없음', cp: 'DVD>드라마', im: 'https://x/a.jpg' });
  ok(/dk-cd/.test(h) && /alt="앞표지"/.test(h) && /alt="뒤표지"/.test(h) && /dk-disc/.test(h) && /background-image:url\('https:\/\/x\/a\.jpg'\)/.test(h), 'CD: 앞표지 + 뒤표지 + 디스크(라벨 = 앞표지 그림)');
  ok(/dk-dvd/.test(h2) && /뒤표지 사진 없음/.test(h2) && BQ.discH({ cp: 'LP>가요', t: 'x' }) === '' && BQ.discH({ cp: 'DVD>x', t: '[VHS] x' }) === '' && BQ.discH({ cp: '국내도서>x', t: 'x' }) === '' && BQ.discKind({ cp: '블루레이>x' }) === 'bd', 'DVD 뒤표지 없으면 바탕 그림 + 「뒤표지 사진 없음」(지어내지 않음) · LP·VHS·책은 이 꼴을 안 씀');
  for (const f of ['shop/shelf.js', 'shop/shop-core.js', 'shop/shop.js', 'cloud/shop-cat.js']) { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(t), f + ': 브라우저 창 없음'); } }

if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHOPMISC1_1114 ${bad}개 실패` : '✓ tSHOPMISC1_1114 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('⑤ 화면');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shopmisc1'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const SVG = (h, w, hh, txt) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}"><rect width="${w}" height="${hh}" fill="hsl(${h},55%,42%)"/><text x="18" y="60" font-size="28" fill="#fff" font-family="sans-serif">${txt}</text><rect x="18" y="${hh - 60}" width="${w * 0.4}" height="34" fill="#fff" opacity=".8"/></svg>`;
const D0 = BQS.demoItems(60, 7).map((x, i) => ({ ...x, id: 'D' + i, im: null, bk: null, at: '2026-09-' + String(1 + (i % 28)).padStart(2, '0') }));
/* [id, 제목, cp, 앞 그림, 뒤 그림] — 지어낸 상품 */
const SPEC = [['B1', '시험 낱권 소설', '국내도서>소설·시·희곡>한국소설', 'f_10', 'b_200'], ['C1', '[CD] 시험 가수 - 1집', '음반>가요', 'f_330', 'b_30'], ['V1', '[DVD] 시험 영화', 'DVD>드라마/코미디', 'f_120', null], ['R1', '[블루레이] 시험 우주 영화', '블루레이>SF', 'f_220', 'b_250'], ['L1', '[LP] 시험 재즈 음반', 'LP>재즈', 'f_40', null], ['S1', '[세트] 시험 대하소설 1~5', '세트>소설·시·희곡', 'f_280', null]];
const mk = (base) => [...SPEC.map(([id, t, cp, f, b], i) => ({ id, t, a: '지은이 ' + i, cp, c: cp.split('>')[0] === '국내도서' ? cp.split('>')[1] : cp.split('>')[0], p: 12000 + i * 1000, lp: 30000, at: '2026-11-14', q: id === 'C1' ? 3 : null, im: base + '/img/' + f + '.svg', bk: b ? base + '/img/' + b + '.svg' : null })), ...D0];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let rows = []; const base0 = { v: '' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const Jo = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const m = /^\/img\/([fb])_(\d+)/.exec(u.pathname); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(SVG(+m[2], 300, 300, m[1] === 'f' ? '앞표지' : '뒤표지 곡 목록')); }
  if (u.pathname === '/shop/cfg') return Jo({ ok: true, open: 1, name: '북스퀸', n: rows.length, pay: { how: 'wait' }, biz: {}, kinds: [], cats: [], shelf: { cap: 200, sort0: 'reg', fontsOn: false, popMode: 'open' } });
  if (u.pathname === '/shop/shelf') return Jo({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: [], rows });
  if (u.pathname === '/shop/item') { const x = mk(base0.v).find((y) => y.id === u.searchParams.get('id')); return x ? Jo({ ok: true, item: { ...x, cpk: x.cp, st: 's' }, same: [], rel: [] }) : Jo({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return Jo({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; base0.v = base;
rows = mk(base).map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : x[k] == null ? null : x[k])));
const kill = setTimeout(() => { console.log('  ❌ 240초 넘음'); process.exit(1); }, 240000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash, wait) => { const ctx = await br.newContext({ deviceScaleFactor: 1, ...ctxO }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); } catch (e) {} }, base); await p.goto(base + '/s/index.html' + hash); await p.waitForSelector(wait || '.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700); return { ctx, p, errs }; };
const PC = { viewport: { width: 1280, height: 860 } }; const MO = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const shot = (p, n) => p.screenshot({ path: path.join(SHOT, n + '.png') });
const phase = (p) => p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '');
const waitPh = async (p, want, n) => { for (let i = 0; i < (n || 80); i++) { if ((await phase(p)) === want) return true; await p.waitForTimeout(60); } return false; };
const sp = (id) => `.bqs-case.cur .sp[data-id="${id}"]`;
try {
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg');
    /* ⑤ 끌어내리기 — 낱권 책 */
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sp('B1')); await p.click(sp('B1')); ok(await waitPh(p, 'open'), 'PC: 책을 누르면 앞으로 나와 펼침'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const b = document.querySelector('.bqs-ob .ob-stage').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x, r.y + 20, { steps: 3 }); await p.mouse.move(r.x, r.y + 45, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(500);
    ok((await phase(p)) === 'open', '조금(45px)만 끌면 제자리로 돌아오고 펼친 채');
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x, r.y + 60, { steps: 4 }); await p.mouse.move(r.x, r.y + 160, { steps: 5 }); await shot(p, 'pc1280_drag_mid'); await p.mouse.move(r.x, r.y + 260, { steps: 5 }); await p.mouse.up();
    ok(await waitPh(p, 'shelved', 60), 'PC: 아래로 끌어내리면(260px) 책장에 꽂힘'); const u1 = await p.evaluate(() => { const u = document.querySelector('.bqs-undo'); return u ? u.textContent : ''; }); ok(/다시 꺼내기/.test(u1), '「↩ 다시 꺼내기」 단추가 뜸: ' + u1); await shot(p, 'pc1280_drag_undo');
    await p.click('.bqs-undo'); ok(await waitPh(p, 'open'), '「다시 꺼내기」를 누르면 같은 책이 다시 나옴'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 40);
    /* ④ 💿 CD·DVD·블루레이 · LP */
    const media = {}; for (const id of ['C1', 'V1', 'R1']) { await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sp(id)); await p.click(sp(id)); await p.waitForSelector('.bqs-ob .dk', { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(1300);
      media[id] = await p.evaluate(() => { const f = document.querySelector('.bqs-ob .dk'); if (!f) return null; const R = (s) => { const e = f.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width }; }; return { k: f.dataset.dk, fr: R('.dk-front'), bk: R('.dk-back'), dc: R('.dk-disc'), bkImg: !!f.querySelector('.dk-back img'), noBk: /뒤표지 사진 없음/.test(f.textContent) }; });
      await shot(p, 'pc1280_disc_' + id); if (id === 'C1') { await p.click('.bqs-ob [data-dk-sw="back"]'); await p.waitForTimeout(600); media.backOn = await p.evaluate(() => { const f = document.querySelector('.bqs-ob .dk'); return f && f.dataset.on === 'back' && !!document.querySelector('.bqs-ob'); }); await shot(p, 'pc1280_disc_C1_back'); }
      /* 디스크 보기도 끌어내리면 꽂힘 */ if (id === 'R1') { const q = await p.evaluate(() => { const b = document.querySelector('.bqs-ob .dk-front').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await p.mouse.move(q.x, q.y); await p.mouse.down(); await p.mouse.move(q.x, q.y + 120, { steps: 5 }); await p.mouse.move(q.x, q.y + 240, { steps: 5 }); await p.mouse.up(); media.dragged = await waitPh(p, 'shelved', 60); }
      else { await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 40); await p.waitForTimeout(300); } }
    const side = (M) => M && M.fr && M.bk && M.dc && M.bk.l < M.fr.l && M.dc.t < M.fr.t && M.dc.t < M.bk.t;
    ok(['C1', 'V1', 'R1'].every((id) => side(media[id])) && media.C1.k === 'cd' && media.V1.k === 'dvd' && media.R1.k === 'bd', 'CD·DVD·블루레이: 뒤표지(왼쪽)·앞표지(오른쪽)가 함께 서고 디스크가 두 표지 위로 솟음');
    ok(media.C1.bkImg && media.V1.noBk && media.backOn, 'CD 뒤표지 그림 보임 · DVD는 뒤표지 사진 없음 표시 · 「뒤표지」 단추 = 뒤표지를 앞으로(창은 그대로)'); ok(media.dragged, '디스크 보기도 아래로 끌어내리면 꽂힘');
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sp('L1')); await p.click(sp('L1')); await p.waitForTimeout(1300); const lp = await p.evaluate(() => ({ dk: !!document.querySelector('.bqs-ob .dk'), pm: !!document.querySelector('.bqs-ob .pm-lp') })); ok(!lp.dk && lp.pm, 'LP는 예전 꼴 그대로(정사각 재킷 + 판이 옆으로) — CD·영상과 다름'); await shot(p, 'pc1280_disc_L1_lp'); await p.keyboard.press('Escape'); await waitPh(p, 'shelved', 40);
    const hd = await p.evaluate(() => [...document.querySelectorAll('.bqs-case.cur .lab small, .bqs-case.cur .bqs-top small')].map((e) => e.textContent).join(' | ')); ok(/\d개/.test(hd) && !/\d권/.test(hd), '책 · CD · 영상이 섞인 책장 머리는 「개」(모두 책이면 「권」): ' + hd.slice(0, 160));
    ok(!errs.length, 'PC 서가 화면 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(PC, '#/b/C1', '.det .dk'); await p.waitForTimeout(1200); const d = await p.evaluate(() => ({ dk: !!document.querySelector('.det .gcol .dkwrap .dk-cd'), q: (document.querySelector('.facts') || {}).textContent || '', cat: (document.querySelector('.facts .crumbs') || {}).textContent || '' }));
    ok(d.dk && /같은 상품 3장/.test(d.q), `상품 화면(CD): 앞·뒤 표지 + 디스크 · 수량 「${(/같은 상품 3장[^—]*/.exec(d.q) || [''])[0].trim()}」`); await shot(p, 'pc1280_item_C1'); ok(!errs.length, '상품 화면 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(MO, '#/b/R1', '.det .dk'); await p.waitForTimeout(1200); const w = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok(w <= 0, `휴대폰 390 상품 화면(블루레이) 가로 넘침 ${w}px`); await shot(p, 'm390_item_R1'); ok(!errs.length, '휴대폰 상품 화면 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open({ ...MO }, '#/shelf?s=reg&cfg=' + BQS.previewArg(BQS.cfgOf({ mobPop: 'open' })));
    await p.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, '.bqs-case.cur .sp[data-id="B1"]'); const has = await p.$('.bqs-case.cur .sp[data-id="B1"]');
    if (has) { await p.tap('.bqs-case.cur .sp[data-id="B1"]'); const o1 = await waitPh(p, 'open', 60); if (o1) { const r = await p.evaluate(() => { const b = document.querySelector('.bqs-ob .ob-stage,.bqs-ob .pv-stage'); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
        const cdp = await ctx.newCDPSession(p); const tp = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: r.x, y }] }); await tp('touchStart', r.y); for (let k = 1; k <= 8; k++) await tp('touchMove', r.y + k * 32); await tp('touchEnd'); ok(await waitPh(p, 'shelved', 60), '휴대폰: 손가락으로 아래로 끌어내리면 꽂힘'); await shot(p, 'm390_drag_undo'); }
      else ok(true, '휴대폰: 이 설정에선 펼침 대신 정보 창(끌어내리기는 정보 창 아래로 쓸기와 같음)'); }
    ok(!errs.length, '휴대폰 서가 오류 없음 ' + errs.join(' | ')); await ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 멈춤', e.message); }
clearTimeout(kill); await br.close(); srv.close();
console.log(bad ? `❌ tSHOPMISC1_1114 ${bad}개 실패` : '✓ tSHOPMISC1_1114 통과(화면까지) · 사진 ' + SHOT); process.exit(bad ? 1 : 0);
})();
