// tSHELF3FIT1111 — (11/11 shelf3) 📚 서가 책장 책등 글 맞춤 · 표면 단추 · 큰 분야 표찰 · 색 70 · 무늬 50 · 할인가·배지
//   정범님: '확대하면 전체, 축소하면 줄임' · 리드 화면 확인(250%): 제목이 '밤에:'처럼 잘림 · 책등 밖으로 넘침 · 서로 겹침 · 글자 반쯤 잘림 · 장식이 글을 가림 · 단추가 책등 옆에 붙어 보임
//   ① 순수 셈(shop/shelf-core.js): 색 70(서로 구별 · 처음 20은 그대로) · 무늬 50 · 조합 수 · 글 자리(장식 피함) · 큰 분야(경로 쉼표·배열 · 짧은 이름 · 서점 차례 · 짐작 · 여러 분야는 맨 뒤) · 할인 띠
//   ② 화면(브라우저 하나 · 끝나면 닫음): 시범 책 60권(긴 제목·영문·숫자 섞음)을 확대 100%·150%·250%·400% 와 휴대폰에서
//      책등마다 '글자 잘림 0 · 넘침 0(글 자리 · 책등 밖) · 겹침 0(제목↔지은이 · 띠·머리 장식)' · 250%·400%는 「…」 줄임 0(전체) · 표면 단추가 책등 안
//   ③ (정범님 11/12) 화살표: 도는 방향 뒤집음(다음 책장은 오른쪽 · → ] 왼쪽 쓸기) · 작은 책등 모양 · 다가가면 엿보기 · 돌 때 먼지·종이 · 끝↔처음 한 바퀴 표시 · 움직임 줄이기면 효과 없음
//   RN_FONTS=1 = 구글 글꼴을 실제로 받아 맞춤(받은 뒤 다시 맞춤) · RN_DBG=1 = 잘린 책등 자세히·맞춤 시간
// 실행: node src/tests/tSHELF3FIT1111.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELF3FIT1111.js (playwright 필요) · 시험 자료는 지어낸 책(손님 정보 없음)
const fs = require('fs'); const path = require('path'); const http = require('http');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
(async () => {
console.log('① 순수 셈');
{ const C = BQS.COLORS; let md = 1e9, mp = ''; for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) { const d = BQS.cdist(C[i].hex, C[j].hex); if (d < md) { md = d; mp = C[i].name + '·' + C[j].name; } }
  ok(C.length === 70 && new Set(C.map((x) => x.hex)).size === 70 && md >= 35 && C.every((x) => /^#[0-9a-f]{6}$/.test(x.hex) && x.name), `색 70 · 모두 다름 · 가장 가까운 두 색(${mp})도 거리 ${Math.round(md)} ≥ 35`);
  ok(C[0].hex === '#63171c' && C[19].hex === '#ceccca' && C[19].name === '미색', '처음 20색은 그대로(뒤에 덧붙이기만 — 저장된 책등이 안 바뀜)');
  const cb = BQS.combos(); ok(BQS.PATTERNS.length === 50 && cb.P === 50 && cb.C === 70 && cb.core === 50 * 70 * 50 * 68 * 50 && cb.core === 595000000 /* (shelf5) 글꼴 50 → 68 */, `조합 = 디자인 ${cb.D} × 색 ${cb.C} × 무늬 ${cb.P} × 글꼴 ${cb.F} × 모양 ${cb.S} = ${cb.core.toLocaleString('ko-KR')}`);
  const css = fs.readFileSync(path.join(ROOT, 'shop/shelf.css'), 'utf8'); ok([41, 50].every((n) => css.includes(`.sp[data-p="${n}"]`)), '무늬 41~50 CSS 있음');
  ok(BQS.decode('0.t.1.70.50.1.1.1.v') && !BQS.decode('0.t.1.71.1.1.1.1.v') && !BQS.decode('0.t.1.1.51.1.1.1.v') && SH.SPINE_RE.test('0.t.1.70.50.1.1.1.v'), '저장 글: 색 70·무늬 50까지 받음 · 넘으면 버림'); }
{ const z37 = BQS.zoneOf(37), z9 = BQS.zoneOf(9), z1 = BQS.zoneOf(1); ok(z37.zb >= 19 && z9.zt >= 17 && z9.zb >= 17 && z1.zt === 6 && BQS.zoneOf(38).zb >= 38 && BQS.zoneOf(13).zt >= 22, '글 자리: 라벨(아래)·문고판 흰 종이·띠지·동그라미를 피함');
  const L = BQS.look({ id: 'z1', t: '섬' }, BQS.DEF); ok(L.zt > 0 && L.zb > 0 && L.zs > 0, '책등 꼴에 글 자리 칸'); }
{ const A = BQS.catOf({ c: '국내도서,종교/역학,기독교(개신교),기독교(개신교) 신앙생활' }), Bx = BQS.catOf({ c: '국내도서>소설/시/희곡>한국소설' }), Cx = BQS.catOf({ c: '종교/역학', c2: '불교' });
  ok(A.b === '종교' && A.s === '기독교' && Bx.b === '소설·시' && Bx.s === '한국소설' && Cx.s === '불교' && BQS.catOf({ c: '인문학', c2: '철학' }).b === '인문', `분류 경로 → 짧은 이름: '${A.b} › ${A.s}' · '${Bx.b} › ${Bx.s}' (쉼표·> 둘 다 · 인문학은 소설 아님)`);
  const g = [['성경 묵상 365', '종교'], ['해커스 토익 기출 1000제', '수험서·참고서'], ['파이썬 코딩 첫걸음', '컴퓨터·IT'], ['아이와 함께 그림책 놀이', '어린이'], ['주식 투자 첫걸음', '경제경영'], ['한밤의 추리소설', '소설·시'], ['모래의 끝에서', '여러 분야']];
  ok(g.every(([t, b]) => BQS.catOf({ t, c: null }).b === b), '분류 없는 책 → 제목 낱말로 큰 분야 짐작 · 맞는 것이 없을 때만 「여러 분야」');
  const it = [...Array.from({ length: 30 }, (_, i) => ({ id: 'r' + i, t: '책 ' + i, c: '종교/역학', c2: '기독교(개신교)', at: '2026-09-01' })), ...Array.from({ length: 10 }, (_, i) => ({ id: 'n' + i, t: '소설 ' + i, c: '소설/시/희곡', c2: '한국소설', at: '2026-09-01' })), ...Array.from({ length: 12 }, (_, i) => ({ id: 'u' + i, t: '모래 ' + i, at: '2026-09-01' })), ...Array.from({ length: 8 }, (_, i) => ({ id: 'e' + i, t: '에세이 ' + i, c: '에세이', at: '2026-09-01' }))];
  const P = BQS.plan(it.map((x) => ({ ...x })), BQS.cfgOf({ cap: 20, pack: false }), 'cat'); const names = P.cases.map((c) => c.name);
  ok(names[0] === '소설·시' && names[1] === '에세이' && names[names.length - 1] === '여러 분야' && P.cases.filter((c) => c.name === '여러 분야').length === 1 && names.some((n) => n === '종교 1/2'), `서점 일반 차례: ${names.join(' → ')} (종교는 뒤 · 여러 분야 한 곳 맨 뒤)`);
  const rel = P.cases.find((c) => c.name === '종교 1/2'); ok(rel.slots[0].lab === '종교 › 기독교' && !/국내도서|,|\(/.test(rel.slots[0].lab) && rel.sub === '기독교', `표찰 = '${rel.slots[0].lab}' · 책장 이름 '${rel.name}' · 작은 분야 '${rel.sub}'`);
  const P2 = BQS.plan(it.map((x) => ({ ...x })), BQS.cfgOf({ cap: 20, pack: false, catFirst: '종교' }), 'cat'); ok(P2.cases[0].name === '종교 1/2', '설정 「맨 앞에 둘 분야」 = 종교 → 첫 책장이 종교');
  const P3 = BQS.plan(it.map((x) => ({ ...x })), BQS.cfgOf({ cap: 20, pack: false, catOrder: 'n' }), 'cat'); ok(P3.cases[0].name === '종교 1/2', '설정 「책이 많은 분야 먼저」'); }
{ const t1 = BQS.tagOf({ p: 7000, p0: 10000 }), t2 = BQS.tagOf({ p: 7000, bd: ['new'] }), t3 = BQS.tagOf({ p: 7000, lp: 9000 }); ok(t1.k === 'sale' && t1.t === '−30%' && t2.k === 'new' && !t3, '책등 띠: 할인 −30% · 배지 NEW · 정가보다 싼 것만으로는 띠 안 붙임');
  const cols = SH.SHELF_COLS; const R = SH.shelfRows([{ id: 'a', t: '책', p: 7000, p0: 10000, bd: ['sale'], c: '에세이', c2: '한국에세이', at: '2026-09-01' }], new Set(), new Set(), new Map(), new Map());
  const U = BQS.unpack({ cols, pre: [], rows: R }); ok(cols.slice(-4, -1).join() === 'c2,p0,bd' && U[0].p0 === 10000 && U[0].bd[0] === 'sale' && U[0].c2 === '한국에세이' && U[0].p === 7000, '서가 자료 열 c2·p0·bd(뒤에 덧붙임) → 손님 화면이 할인가·배지·작은 분야를 받음');
  const U0 = BQS.unpack({ cols: cols.slice(0, 17), pre: [], rows: R.map((r) => r.slice(0, 17)) }); ok(U0[0].p0 === 0 && U0[0].bd === null, '옛 클라우드(열 17개)도 그대로 읽음'); }
{ const pub = SH.pubItem('x1', { status: '판매중', price: 5000, title: '시험' }, { categories: [{ path: ['국내도서', '종교/역학', '기독교(개신교)', '신앙생활'] }] }); ok(pub.c === '종교/역학' && pub.c2 === '기독교(개신교)', `클라우드: 분류 경로 배열 → c '${pub.c}' · c2 '${pub.c2}'(전엔 쉼표로 이어 통째로 들어감)`);
  const pub2 = SH.pubItem('x2', { status: '판매중', price: 5000, title: '시험' }, { categories: [{ path: '국내도서>소설/시/희곡>한국소설' }] }); ok(pub2.c === '소설/시/희곡' && pub2.c2 === '한국소설', '클라우드: > 경로도 같게'); }

/* (shelf4 · 정범님 11/12) 책등엔 이름만 · 글꼴 갈래 · 앞표지 셈(클라우드) · 청구기호 · 낮은 대비 글 상자 */
{ const A = [['지은이 가', '가'], ['글쓴이 갑, 옮긴이 을', '갑, 을'], ['홍길동 (지은이), 김철수 (옮긴이)', '홍길동, 김철수'], ['김가 지음 · 이나 옮김', '김가·이나'], ['지은이 나 외 2명', '나 외 2명'], ['A. Writer', 'A. Writer'], ['엮은이 둘', '둘']];
  ok(A.every(([a, b]) => BQS.auName(a) === b), `책등 지은이 = 이름만('지은이'·'글쓴이'·'옮긴이'·'(지은이)'·'지음' 뺌): ${A.slice(0, 4).map(([a, b]) => `'${a}'→'${b}'`).join(' · ')}`);
  ok(BQS.FGEN.length === BQS.FONTS.length && BQS.FGEN.every((g) => BQS.GENRES[g]) && Object.keys(BQS.GENRES).every((g) => g === 'tw' || BQS.fontsOfGenre(g).length >= 2), `글꼴 ${BQS.FONTS.length}개 모두 갈래(명조·고딕·굵은 제목체·둥근·손글씨·붓·타자기·꾸밈) · 갈래마다 2개 넘게`);
  const ids = Array.from({ length: 60 }, (_, i) => ({ id: 'fg' + i, t: '모래 ' + i, fg: 'my' })); ok(ids.every((x) => BQS.FGEN[BQS.assign(x, BQS.DEF).fi - 1] === 'my'), '앞표지 글꼴 갈래(cv의 .my) → 그 갈래(명조) 글꼴만 고름(60권)');
  const cl = ids.map((x) => BQS.assign(x, BQS.DEF)).filter((a) => BQS.dgenOf(a.d) === 'cute'); ok(!cl.length, '명조 제목엔 귀여운 디자인(동그라미·아치·별) 안 붙음');
  ok(JSON.stringify(BQS.cvOf('8a2b1c.my')) === JSON.stringify({ cc: '#8a2b1c', fg: 'my', cv: 1 }) && BQS.cvOf('x').cv === 1 && !BQS.cvOf('zz').cv, '서가 칸 cv = 대표색.갈래 · x = 셈했지만 색 없음');
  const cn = BQS.callNo({ id: 'q', t: '길의 끝에서', c: '소설/시/희곡' }); ok(/^813\.\d$/.test(cn[0]) && /^ㄱ\d{2}$/.test(cn[1]), `도서관 라벨 디자인에 청구기호 '${cn.join(' ')}'(빈 흰 네모 → 번호)`);
  const lows = BQS.demoItems(400, 9).map((x) => BQS.look(x, BQS.DEF)); const bgOf = (L) => (L.d === 9 || L.d === 44 ? '#f4efe4' : L.tp || L.c); const thinL = lows.filter((L) => L.thin); ok(lows.every((L) => BQS.contrast(bgOf(L), L.k) >= 4.5) && thinL.every((L) => BQS.contrast(bgOf(L), L.k) >= 6.5), `제목 대비: 400권 모두 4.5 넘음 · 가는 글꼴 ${thinL.length}권은 6.5 넘음 · 글 상자 띠 ${lows.filter((L) => L.tp).length}권`);
  const CV = require(path.join(ROOT, 'cloud/shop-cover.js')); const W = 300, H = 440; const px = new Uint8ClampedArray(W * H * 4); for (let i = 0; i < W * H; i++) { px[i * 4] = 190; px[i * 4 + 1] = 30; px[i * 4 + 2] = 40; px[i * 4 + 3] = 255; }
  for (let y = 40; y < 150; y += 22) for (let x = 30; x < 270; x += 30) for (let yy = y; yy < y + 14; yy++) for (let xx = x; xx < x + 4; xx++) { const i = (yy * W + xx) * 4; px[i] = px[i + 1] = px[i + 2] = 250; } /* 세로 획 4px · 가로 획 없음 */
  const v = CV.analyze(px, W, H); ok(/^be1e28/.test(v) || /^[a-f0-9]{6}/.test(v) && BQS.cdist('#' + v.slice(0, 6), '#be1e28') < 30, `클라우드 앞표지 셈: 빨간 표지 → 대표색 '${v}'`);
  ok(CV.keyOfIm('https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_256472146%2Ffront_t.webp?alt=media') === 'bk_256472146' && !CV.keyOfIm('https://image.aladin.co.kr/product/1/2/cover/x.jpg'), '표지 주소 → 저장소 그림 폴더(bk_도서) · 우리 저장소 그림만');
  const R2 = SH.shelfRows([{ id: 'a', t: '책', p: 7000, im: 'https://firebasestorage.googleapis.com/v0/b/x/o/img%2Fbk_9%2Ffront_t.webp?alt=media', at: '2026-09-01' }, { id: 'b', t: '새 책', p: 5000, at: '2026-10-01' }], new Set(), new Set(), new Map(), new Map(), (im) => (CV.keyOfIm(im) ? '8a2b1c.my' : null));
  const U2 = BQS.unpack({ cols: SH.SHELF_COLS, pre: [], rows: R2 }); ok(U2[0].id === 'b' && U2[1].cc === '#8a2b1c' && U2[1].fg === 'my' && !U2[0].cv, '서가 자료: 새 책 먼저(첫 묶음만 받아도 첫 책장) · 칸 cv → 손님 화면 대표색·갈래'); }

if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELF3FIT1111 ${bad}개 실패` : '✓ tSHELF3FIT1111 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면 — 확대 단계마다 책등 글 잘림·넘침·겹침 검사');
/* (shelf4) 구글 글꼴을 받을 수 있으면 받아서 시험(손님 화면과 같게) — 못 받는 곳(인터넷 막힘)에선 대체 글꼴(세로 글자 자리가 틀린 중국어 글꼴)이라 잉크 검사는 건너뜀 */
let FONTS_OK = false;
const INK = require('./shelf_ink.js');
const SHOT = process.env.RN_SHOT || require('os').tmpdir(); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
/* 시범 책 60권 — 리드가 찾은 것과 같은 꼴(콜론 부제·긴 제목·영문·숫자·지은이 여럿) + 시범 자료 · 지어낸 책 */
const LONG = ['밤에: 우리가 몰랐던 별의 이야기', '고양이의 끝에서: 아주 길고 긴 부제가 붙은 책', '모래의 끝에서', '건강 취미 생활 백과 — 걷기·요가·등산', '1984', '제2권 바다의 노래 3', 'The Road to Somewhere Far Away', '해리와 Python 3 코딩 100일',
  '어린 왕자', '섬', '아주 길고 긴 제목이 붙은 책의 이야기 모음 두 번째 권 특별판', 'ABC 영어 회화 365', '조선 왕조 오백 년의 비밀 1', '나의 라임오렌지나무', '봄·여름·가을·겨울 그리고 다시 봄', 'C++ 프로그래밍 입문 2판', '시간의 역사', '우리 동네 고양이 열두 마리와 강아지 한 마리', '詩', '사랑 1·2·3'];
const AU = ['지은이 가', '지은이 나 외 2명', 'A. Writer', '글쓴이 갑, 옮긴이 을', '엮은이 둘', null, '아주 긴 이름의 지은이와 그린이 셋'];
const D = BQS.demoItems(40, 3); const items = [...LONG.map((t, i) => ({ ...D[i], id: 'L' + i, t, a: AU[i % AU.length], p0: i % 4 === 0 ? D[i].p + 3000 : 0, bd: i % 4 === 0 ? ['sale'] : i % 7 === 1 ? ['new'] : null, st: i === 5 ? 'o' : 's' })), ...D.map((x, i) => ({ ...x, id: 'D' + i }))];
const rows = items.map((x) => [x.id, x.t, x.a, x.c, x.p, x.lp, x.g, x.at, null, null, null, x.st, x.sr || null, x.pg, x.pb, x.sz, null, x.c2 || null, x.p0 || null, x.bd || null]);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const CFG = { cap: 100, sort0: 'reg', orient: 'rand' };
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/shop/cfg') return J({ ok: true, open: 1, name: '북스퀸', shipFee: 3500, freeOver: 30000, maxItems: 20, n: rows.length, cats: [], pay: { how: 'wait' }, biz: {}, shelf: CFG });
  if (u.pathname === '/shop/shelf') return J({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows });
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 300초 넘음 — 브라우저를 닫고 끝냄'); process.exit(1); }, 300000);
const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
if (process.env.RN_FONTS !== '0') { const tp = await br.newPage(); try { const r = await tp.goto('https://fonts.googleapis.com/css2?family=Jua', { timeout: 8000 }); FONTS_OK = !!r && r.status() === 200; } catch (e) {} await tp.close(); }
if (FONTS_OK) process.env.RN_FONTS = '1'; console.log(FONTS_OK ? '  (구글 글꼴을 받아 손님 화면과 같게 시험)' : '  (구글 글꼴 못 받음 — 잉크 검사는 건너뜀 · 대체 글꼴은 세로 글자 자리가 틀림)');
/* 지금 책장의 책등마다 검사(책등 그림이 없는 것 전부) */
const CHECK = () => { const E = 0.75; const R = (el) => el.getBoundingClientRect(); const inside = (a, b) => a.left >= b.left - E && a.right <= b.right + E && a.top >= b.top - E && a.bottom <= b.bottom + E; const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > E && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > E;
  const out = { n: 0, clip: [], over: [], hit: [], cut: 0, cutT: [], small: [], wrong: [], fmin: 99, fmax: 0 };
  for (const b of document.querySelectorAll('.bqs-case.cur .sp')) { if (b.classList.contains('img') && b.classList.contains('ok')) continue; out.n++; const sk = b.querySelector('.sk'), tx = b.querySelector('.tx'), tt = b.querySelector('.tt'), au0 = b.querySelector('.au'), au = au0 && au0.style.display !== 'none' ? au0 : null; /* (shelf4) 너무 좁아 숨긴 지은이는 뺌 */ const rs = R(sk), rx = R(tx), rt = R(tt), ra = au ? R(au) : null; const id = b.dataset.id;
    if (tx.scrollWidth > tx.clientWidth + 1 || tx.scrollHeight > tx.clientHeight + 1 || tt.scrollHeight > tt.clientHeight + 1 || (au && au.scrollHeight > au.clientHeight + 1)) out.clip.push(id + (window.__DBG ? JSON.stringify([tx.scrollWidth, tx.clientWidth, tt.offsetWidth, tt.scrollWidth, au && au.offsetWidth, au && au.scrollWidth, tt.style.fontSize, au && au.style.fontSize, tt.innerHTML, au && au.innerHTML, b.dataset.o]) : ''));
    if (!inside(rt, rx) || (ra && !inside(ra, rx)) || !inside(rx, rs)) out.over.push(id);
    const deco = [...b.querySelectorAll('.bt,.hb,.hd')].map(R); if ((ra && meet(rt, ra)) || deco.some((d) => meet(d, rt) || (ra && meet(d, ra)))) out.hit.push(id);
    const f = parseFloat(getComputedStyle(tt).fontSize); out.fmin = Math.min(out.fmin, f); out.fmax = Math.max(out.fmax, f); if (f < 8.99) out.small.push(id);
    if (b.classList.contains('cut')) { out.cut++; out.cutT.push(tt.textContent); } else { const want = (b.getAttribute('aria-label') || '').split(' · ')[0]; if (tt.textContent !== want) out.wrong.push(id + ':' + tt.textContent); } }
  out.fitN = +(document.querySelector('.bqs').dataset.fit || 0); out.ms = +(document.querySelector('.bqs').dataset.fitMs || 0); out.fonts = document.fonts ? document.fonts.size : 0; return out; };
const open = async (ctx, z) => { const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('창: ' + d.message()); d.dismiss().catch(() => {}); });
  if (!process.env.RN_FONTS) await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript(([u, zz, dbg]) => { window.BQ_API = u; window.__DBG = dbg; try { localStorage.setItem('bq-shelf-zoom', JSON.stringify(zz)); localStorage.removeItem('bq-shelf-lk'); } catch (e) {} }, [base, z, !!process.env.RN_DBG]);
  await p.goto(base + '/s/index.html#/shelf'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 15000 }); await p.waitForTimeout(process.env.RN_FONTS ? 4000 : 400); await p.waitForFunction(() => !document.querySelector('.bqs').dataset.fitBusy, null, { timeout: 15000 }); return { p, errs }; }; /* (shelf4) 화면 밖 책등은 뒤에서 맞추므로 다 맞출 때까지 기다림 */
try {
  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  for (const z of [1, 1.5, 2.5, 4]) { const { p, errs } = await open(ctx, z); const A = await p.evaluate(CHECK);
    const tag = Math.round(z * 100) + '%'; ok(A.n >= 37 && !A.clip.length && !A.over.length && !A.hit.length && !A.small.length && !A.wrong.length && !errs.length, `확대 ${tag}: 책등 ${A.n}권 · 글자 잘림 ${A.clip.length} · 넘침 ${A.over.length} · 겹침 ${A.hit.length} · 최소 글자 아래 ${A.small.length} · 글 다름 ${A.wrong.length} · 글자 ${A.fmin.toFixed(1)}~${A.fmax.toFixed(1)}px · 「…」 줄임 ${A.cut}권${process.env.RN_DBG ? ` · 맞춤 ${A.fitN}번 ${A.ms}ms · 글꼴 ${A.fonts}` : ''}${A.clip.length + A.over.length + A.hit.length ? ' · ' + [...A.clip, ...A.over, ...A.hit].slice(0, 6).join(',') : ''}${errs.length ? ' · 오류 ' + errs[0] : ''}`);
    if (z >= 2.5) ok(A.cut === 0, `확대 ${tag}: 크게 보면 제목·지은이 전체(줄임 ${A.cut}${A.cut ? ' — ' + A.cutT.slice(0, 3).join(' / ') : ''})`);
    if (z === 1) ok(A.cut <= Math.ceil(A.n * 0.35), `확대 100%: 줄임(…)은 가장 작은 글자로도 안 들어가는 책만 — ${A.cut}/${A.n}권`);
    await p.screenshot({ path: path.join(SHOT, `zoom_${tag.replace('%', '')}.png`) });
    /* (shelf4 · 리드 화면 확인 250%: '3'↔'Python'·'비밀'↔'1'·두 줄 엉킴을 글 상자 검사가 못 잡음) → 실제 그려진 잉크로: 줄 엉킴 · 글자 붙음 · 줄 어긋남 · 제목↔지은이 · 글↔띠·머리 장식 · 책등 밖 */
    if (FONTS_OK && (z === 1 || z === 2.5)) { const pk = await open(ctx, z); const I = await INK.inkCheck(pk.p); ok(I.n >= 25 && !I.bad.length, `확대 ${tag} 잉크 검사: 화면 안 책등 ${I.n}권 · 겹침·붙음·엉킴 ${I.bad.length}${I.bad.length ? ' — ' + I.bad.slice(0, 4).map((x) => x.t + ' ' + x.bad.join('/')).join(' | ') : ''}`); await pk.p.close(); }
    if (z === 1 || z === 2.5) { /* 표면 단추 — 좁은 책·넓은 책 */
      const ids = await p.evaluate(() => { const L = [...document.querySelectorAll('.bqs-case.cur .sp')].map((b) => [b.dataset.id, b.querySelector('.sk').getBoundingClientRect()]).filter(([, r]) => r.top > 120 && r.bottom < innerHeight - 20); L.sort((a, b) => a[1].width - b[1].width); return [L[0][0], L[L.length - 1][0]]; });
      for (const [k, id] of [['narrow', ids[0]], ['wide', ids[1]]]) { await p.click(`.bqs-case.cur .sp[data-id="${id}"]`); await p.waitForTimeout(250);
        const P = await p.evaluate(() => { const q = document.querySelector('.bqs-pop'); const b = document.querySelector('.sp.out .sk').getBoundingClientRect(); const pa = q.querySelector('.pa').getBoundingClientRect(); const bs = [...q.querySelectorAll('.pa > *')].map((x) => x.getBoundingClientRect()); const E = 1.5;
          return { on: !q.hidden && q.classList.contains('onsp'), w: Math.round(b.width), slim: q.classList.contains('slim'), n: bs.length, inX: pa.left >= b.left - E && pa.right <= b.right + E, inY: bs.every((r) => r.top >= b.top - E && r.bottom <= b.bottom + E), col: bs.every((r, i) => !i || r.top >= bs[i - 1].bottom - 0.5), cap: !!q.querySelector('.pcap b') }; });
        ok(P.on && P.n === 3 && P.inX && P.inY && P.col && P.cap && (P.w >= 46 || P.slim), `확대 ${tag} ${k === 'narrow' ? '좁은' : '넓은'} 책(폭 ${P.w}px): 단추 셋이 책등 표면 안에 세로로${P.slim ? '(작은 아이콘만)' : ''} · 제목 이름표`);
        await p.screenshot({ path: path.join(SHOT, `press_${tag.replace('%', '')}_${k}.png`) }); await p.keyboard.press('Escape'); await p.waitForTimeout(120); } }
    if (z === 1) { /* (shelf4 · 원칙 56) 100%에서 얇은 책 글이 작음 → 마우스를 올리면 그 책등만 앞으로 나오며 커짐(얇을수록 크게) */
      const id = await p.evaluate(() => { const L = [...document.querySelectorAll('.bqs-case.cur .sp')].map((b) => [b.dataset.id, b.querySelector('.sk').getBoundingClientRect()]).filter(([, r]) => r.top > 150 && r.bottom < innerHeight - 30); L.sort((a, b) => a[1].width - b[1].width); return L[0][0]; });
      const w0 = await p.evaluate((i) => document.querySelector(`.sp[data-id="${i}"] .sk`).getBoundingClientRect().width, id); await p.hover(`.bqs-case.cur .sp[data-id="${id}"]`); await p.waitForTimeout(350);
      const H = await p.evaluate((i) => { const b = document.querySelector(`.sp[data-id="${i}"]`); const r = b.querySelector('.sk').getBoundingClientRect(); const n = b.nextElementSibling && b.nextElementSibling.querySelector('.sk'); return { w: r.width, z: +getComputedStyle(b).zIndex || 0, top: n ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null }; }, id);
      ok(H.w / w0 >= 1.3 && H.z >= 6, `100% 얇은 책(폭 ${Math.round(w0)}px)에 마우스 → ${(H.w / w0).toFixed(2)}배로 뽑혀 나옴(옆 책 위로)`); await p.screenshot({ path: path.join(SHOT, 'hover_pull.png') }); await p.mouse.move(5, 5); }
    await p.close(); }
  /* 확대 단추로 바꿀 때도 다시 맞춤 */
  { const { p } = await open(ctx, 1); for (let i = 0; i < 4; i++) await p.click('.bqs-zoom [data-z="+"]'); await p.waitForTimeout(300); const A = await p.evaluate(CHECK); const zv = await p.textContent('.bqs-zv');
    ok(!A.clip.length && !A.over.length && !A.hit.length && A.cut <= 3, `확대 단추 + 네 번(${zv}): 다시 재서 맞춤 · 잘림·넘침·겹침 0 · 줄임 ${A.cut}`);
    for (let i = 0; i < 6; i++) await p.click('.bqs-zoom [data-z="-"]'); await p.waitForTimeout(300); const B2 = await p.evaluate(CHECK); ok(!B2.clip.length && !B2.over.length && !B2.hit.length && B2.cut >= A.cut, `축소(${await p.textContent('.bqs-zv')}): 넘침 없이 줄임(…) ${B2.cut}권${B2.clip.length + B2.over.length + B2.hit.length ? ' · 잘림 ' + B2.clip.slice(0, 3).join(',') + ' 넘침 ' + B2.over.slice(0, 3).join(',') + ' 겹침 ' + B2.hit.slice(0, 3).join(',') : ''}`); await p.screenshot({ path: path.join(SHOT, 'zoom_out.png') }); await p.close(); }
  /* 큰 분야 표찰 — 시범 자료 1,200권 · 주제 분류 */
  { const p = await ctx.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.setItem('bq-shelf-zoom', '1'); localStorage.setItem('bq-shelf-sort', '"cat"'); } catch (e) {} }, base);
    await p.goto(base + '/s/index.html#/shelf?demo=1200&s=cat'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 15000 }); await p.waitForTimeout(300);
    const L = await p.evaluate(() => ({ h: document.querySelector('.bqs-case.cur .bqs-top b').textContent, labs: [...document.querySelectorAll('.bqs-case.cur .lab span')].map((x) => x.textContent) }));
    ok(/^소설·시/.test(L.h) && L.labs[0].startsWith('소설·시 ›') && L.labs.every((x) => !/,|국내도서/.test(x) && x.length <= 20), `첫 책장 '${L.h}' · 표찰 ${L.labs.slice(0, 4).join(' | ')}`); await p.screenshot({ path: path.join(SHOT, 'cat_labels.png') });
    /* (정범님 11/12) 도는 방향 뒤집음 — 다음 책장은 오른쪽에 서 있다가 → 로 다가옴 · 화살표 = 작은 책등 · 다가가면 엿보기 · 돌 때 먼지·종이 · 끝↔처음 한 바퀴 표시 */
    const pos = await p.evaluate(() => { const st = document.querySelector('.bqs-stage').getBoundingClientRect(); const cx = (j) => { const c = document.querySelector(`.bqs-case[data-j="${j}"]`); if (!c) return null; const r = c.getBoundingClientRect(); return r.left + r.width / 2; }; return { mid: st.left + st.width / 2, nx: cx(1), pv: cx(-1), here: document.querySelector('.bqs-here small').textContent, N: document.querySelectorAll('.bqs-dots i').length }; });
    ok(pos.nx > pos.mid && pos.pv < pos.mid && /다음 책장은 (북동|동)쪽/.test(pos.here) && BQS.compass(1, 0, 16) === '북동' && BQS.compass(15, 0, 16) === '북서', `다음 책장은 오른쪽(동쪽)에 · 이전은 왼쪽 — '${pos.here}'`);
    await p.screenshot({ path: path.join(SHOT, 'arrows_idle.png') });
    const ar = await p.locator('.bqs-arrow.r').boundingBox(); await p.mouse.move(ar.x - 30, ar.y + ar.height / 2, { steps: 4 }); await p.waitForTimeout(600);
    const pk = await p.evaluate(() => ({ cls: document.querySelector('.bqs').className, pk: document.querySelector('.bqs-arrow.r .pk').textContent, op: +getComputedStyle(document.querySelector('.bqs-arrow.r .pk')).opacity, nx: document.querySelector('.bqs-nx').textContent }));
    ok(/peekr/.test(pk.cls) && pk.op > 0.9 && pk.nx.includes(pk.pk.replace(' ›', '')), `오른쪽 화살표에 다가가면 엿보기 — 이름표 '${pk.pk}' · 책장이 그쪽으로 살짝 돎`); await p.screenshot({ path: path.join(SHOT, 'arrows_peek.png') });
    const name1 = await p.evaluate(() => document.querySelector('.bqs-nx span').textContent); await p.mouse.click(ar.x + ar.width / 2, ar.y + ar.height / 2); await p.waitForTimeout(260);
    const mid = await p.evaluate(() => ({ dust: document.querySelectorAll('.bqs-dust').length, turning: document.querySelector('.bqs').classList.contains('turning') })); await p.screenshot({ path: path.join(SHOT, 'arrows_turn_mid.png') });
    await p.waitForTimeout(1100); const after = await p.evaluate(() => ({ h: document.querySelector('.bqs-here b').textContent, i: document.querySelector('.bqs-here small').textContent }));
    ok(mid.dust >= 8 && mid.turning && after.h === name1 && /^2 \//.test(after.i), `→ 누름: 오른쪽 책장이 다가옴(${after.h}) · 도는 동안 먼지·종이 ${mid.dust}개`);
    await p.mouse.move(700, 300); await p.keyboard.press('['); await p.waitForTimeout(1200); await p.keyboard.press('['); await p.waitForTimeout(150); const lap = await p.evaluate(() => (document.querySelector('.bqs-lapt') || {}).textContent || ''); await p.screenshot({ path: path.join(SHOT, 'arrows_loop.png') }); await p.waitForTimeout(1200);
    const back = await p.evaluate(() => document.querySelector('.bqs-here small').textContent); ok(/거꾸로 한 바퀴/.test(lap) && /^(\d+) \/ \1 ·/.test(back), `[ 두 번: 처음 책장에서 거꾸로 넘어가면 '${lap}' · 마지막 책장(${back.split(' ·')[0]})`);
    await p.close(); }
  { const rm = await br.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' }); const p = await rm.newPage(); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.setItem('bq-shelf-sort', '"cat"'); } catch (e) {} }, base);
    await p.goto(base + '/s/index.html#/shelf?demo=1200&s=cat'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 15000 }); const ar = await p.locator('.bqs-arrow.r').boundingBox(); await p.mouse.move(ar.x - 30, ar.y + ar.height / 2, { steps: 3 }); await p.waitForTimeout(300); const pe = await p.evaluate(() => /peekr/.test(document.querySelector('.bqs').className));
    await p.mouse.click(ar.x + ar.width / 2, ar.y + ar.height / 2); await p.waitForTimeout(80); const R2 = await p.evaluate(() => ({ dust: document.querySelectorAll('.bqs-dust').length, i: document.querySelector('.bqs-here small').textContent })); ok(!pe && R2.dust === 0 && /^2 \//.test(R2.i), '움직임 줄이기 설정: 엿보기·먼지 없이 바로 넘어감'); await rm.close(); }
  await ctx.close();
  /* 휴대폰 */
  const m = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  { const { p, errs } = await open(m, 1); const A = await p.evaluate(CHECK); ok(A.n >= 37 && !A.clip.length && !A.over.length && !A.hit.length && !errs.length, `휴대폰 390px: 책등 ${A.n}권 · 잘림 ${A.clip.length} · 넘침 ${A.over.length} · 겹침 ${A.hit.length} · 줄임 ${A.cut}`); await p.screenshot({ path: path.join(SHOT, 'mobile.png') });
    /* (shelf4 · 정범님 11/12 휴대폰은 형식을 달리) 톡 누름 → 아래 시트 · 줄 가로 쓸기(책장은 그대로) · 길게 누름 → 찜 · 분야 칩 · 표지 보기 · 누름 자리 44px */
    const T = await m.newCDPSession(p); const touch = async (type, pts) => T.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
    const M0 = await p.evaluate(() => ({ mob: document.querySelector('.bqs').classList.contains('mob'), chips: document.querySelectorAll('.bqs-chips button').length, bar: !document.querySelector('.bqs-mbar').hidden, small: [...document.querySelectorAll('.bqs-mbar > *, .bqs-chips button')].filter((b) => b.getBoundingClientRect().height < 44).length, sw: document.documentElement.scrollWidth, rows: document.querySelectorAll('.bqs-case.cur .mrow').length }));
    ok(M0.mob && M0.bar && M0.rows >= 1 && M0.small === 0 && M0.sw <= 390, `휴대폰: 줄마다 가로 선반 ${M0.rows}줄 · 아래 고정 줄(정렬·표지·찜·장바구니) · 누름 자리 모두 44px 넘음 · 가로 넘침 없음(${M0.sw}px)`);
    const id = await p.evaluate(() => { const b = [...document.querySelectorAll('.bqs-case.cur .mstrip .sp')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 120 && r.bottom < innerHeight - 90 && r.left > 0 && r.right < innerWidth; }); return b && b.dataset.id; }); await p.tap(`.bqs-case.cur .sp[data-id="${id}"]`); await p.waitForTimeout(350);
    const SH = await p.evaluate(() => { const q = document.querySelector('.bqs-sheet'); const bs = [...q.querySelectorAll('.sh-act > *')].map((b) => b.getBoundingClientRect().height); return { on: !q.hidden && q.classList.contains('on'), n: bs.length, big: bs.every((h) => h >= 48), t: (q.querySelector('.sh-tx b') || {}).textContent }; });
    ok(SH.on && SH.n === 3 && SH.big, `톡 누름 → 아래에서 시트(「${SH.t}」 · 담기·찜·자세히 단추 ${SH.n}개 모두 48px 넘음)`); await p.screenshot({ path: path.join(SHOT, 'mobile_press.png') });
    { const r = await p.evaluate(() => { const b = document.querySelector('.bqs-sheet .sh-p').getBoundingClientRect(); return [b.left + b.width / 2, b.top + 20]; }); await touch('touchStart', [r]); for (let k = 1; k <= 6; k++) await touch('touchMove', [[r[0], r[1] + k * 30]]); await touch('touchEnd', []); await p.waitForTimeout(350);
      ok(await p.evaluate(() => document.querySelector('.bqs-sheet').hidden || !document.querySelector('.bqs-sheet').classList.contains('on')), '시트를 아래로 쓸면 닫힘'); }
    { const r = await p.evaluate(() => { const s0 = document.querySelector('.bqs-case.cur .mstrip'); s0.scrollLeft = 0; const b = s0.getBoundingClientRect(); return { x: b.left + b.width * 0.8, y: b.top + b.height / 2, i: document.querySelector('.bqs-case.cur').dataset.i }; });
      await touch('touchStart', [[r.x, r.y]]); for (let k = 1; k <= 8; k++) await touch('touchMove', [[r.x - k * 30, r.y]]); await touch('touchEnd', []); await p.waitForTimeout(500);
      const a = await p.evaluate(() => ({ sl: document.querySelector('.bqs-case.cur .mstrip').scrollLeft, i: document.querySelector('.bqs-case.cur').dataset.i, sh: !document.querySelector('.bqs-sheet').hidden && document.querySelector('.bqs-sheet').classList.contains('on') }));
      ok(a.sl > 40 && a.i === r.i && !a.sh, `선반 줄을 가로로 쓸면 그 줄만 넘어감(${Math.round(a.sl)}px) · 책장은 그대로 · 시트 안 뜸`); }
    { const b = await p.evaluate((id0) => { const x = [...document.querySelectorAll('.bqs-case.cur .mstrip .sp')].find((e) => { const r = e.getBoundingClientRect(); return e.dataset.id !== id0 && !e.classList.contains('wished') && r.top > 120 && r.bottom < innerHeight - 90 && r.left > 0 && r.right < innerWidth; }); const r = x.getBoundingClientRect(); return { id: x.dataset.id, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, id);
      await touch('touchStart', [[b.x, b.y]]); await p.waitForTimeout(700); await touch('touchEnd', []); await p.waitForTimeout(300);
      const w = await p.evaluate((i0) => ({ on: document.querySelector(`.sp[data-id="${i0}"]`).classList.contains('wished'), sh: !document.querySelector('.bqs-sheet').hidden && document.querySelector('.bqs-sheet').classList.contains('on'), n: document.querySelector('.bqs-wn2').textContent }), b.id);
      ok(w.on && !w.sh && +w.n >= 1, `길게 누름(0.7초) → 바로 찜(찜 ${w.n}) · 시트는 안 뜸`); }
    if (M0.chips > 1) { const i0 = await p.evaluate(() => document.querySelector('.bqs-case.cur').dataset.i); await p.tap('.bqs-chips button:nth-child(2)'); await p.waitForTimeout(400); const i1 = await p.evaluate(() => document.querySelector('.bqs-case.cur').dataset.i); ok(i1 === '1' && i0 !== i1, '위 분야 칩을 누르면 그 책장으로'); }
    await p.tap('.mb-v'); await p.waitForTimeout(600); const cv = await p.evaluate(() => ({ n: document.querySelectorAll('.bqs-case.cur .cvb').length, lab: document.querySelector('.mb-v').textContent })); ok(cv.n > 5 && /책등/.test(cv.lab), `「표지 보기」 → 표지 ${cv.n}권 · 단추가 '${cv.lab}'로`); await p.screenshot({ path: path.join(SHOT, 'mobile_cover.png') }); await p.tap('.mb-v'); await p.waitForTimeout(300);
    await p.close(); }
  await m.close();
  /* 색 견본표(정범님 결정 — 색 70) */
  { const c2 = await br.newContext({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 1 }); const p = await c2.newPage();
    const cells = BQS.COLORS.map((c, i) => `<div class="c" style="background:${c.hex};color:${BQS.inkFor(c.hex, 0.5)}"><b>${i + 1}</b><span>${c.name}</span><small>${c.hex}</small>${i >= 20 ? '<i>새</i>' : ''}</div>`).join('');
    await p.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:16px;font-family:system-ui,sans-serif;background:#f6f1e7}h1{font-size:18px;margin:0 0 10px}.g{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}.c{position:relative;height:96px;border-radius:4px;padding:6px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-end;font-size:12px;box-shadow:inset 3px 0 4px rgba(255,255,255,.2),inset -4px 0 5px rgba(0,0,0,.3)}.c b{position:absolute;top:5px;left:7px;font-size:11px;opacity:.8}.c span{font-weight:800}.c small{opacity:.8}.c i{position:absolute;top:5px;right:6px;font-style:normal;font-size:10px;background:rgba(0,0,0,.25);color:#fff;padding:0 4px;border-radius:3px}</style><h1>📚 책등 색 70 (1~20 처음 색 · 21~70 shelf3 덧붙임 — 순서는 덧붙이기만)</h1><div class="g">${cells}</div>`);
    await p.screenshot({ path: path.join(SHOT, 'colors.png'), fullPage: true }); await c2.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 오류', e.message); }
clearTimeout(kill); await br.close(); srv.close();
console.log(bad ? `❌ tSHELF3FIT1111 ${bad}개 실패` : '✓ tSHELF3FIT1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
