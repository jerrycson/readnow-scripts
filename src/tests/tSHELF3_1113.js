// tSHELF3_1113 — (11/13 shelf3) 📷 표지 그림 / 물건 전체 사진 가르기 · 📀 책이 아닌 제품(CD·DVD·블루레이·VHS·LP) · 🎨 고유 디자인 표지 · 관리자 표지 차례
//   정범님 지시 11/13 21:28(사진 가르기·제품 모양·크기 비례·누르면 사진/제품답게·표지 모드 고유 디자인) · 21:40(관리자가 고른 표지가 늘 먼저)
//   ① 순수 셈: 판정 셈(지어낸 그림 — 정면 표지·자리 그림·비스듬한 상자·입체 상자·흰 바탕 표지) · 표지 차례 ①~④ · 관리자 값이 클라우드 판정을 이김(서가 자료 pk·ac)
//      제품 종류·실제 크기(mm) · 고유 디자인이 상품 번호로 늘 같음 · 설정 칸(SCHEMA) · 숍 파일 판 번호 · 브라우저 창 없음
//   ② 화면(RN_SHELF_UI=1 · playwright · 가짜 클라우드 · 지어낸 상품): PC 1280 표지 모드·책등 모드 · 물건 사진 누름 → 사진 자체 · CD·LP·DVD·VHS 누름 → 제품답게 열림 · 움직임 줄이기
//      휴대폰 390 표지 모드·아래 창 · 화면 사진(deviceScaleFactor 2)은 RN_SHOT 폴더에
//   표본 견줌(선택): RN_PHOTO_LAB=<labels.json 있는 폴더> — 실제 사진 정답표와 판정을 견줌(연구 상자에서만)
// 실행: node src/tests/tSHELF3_1113.js · 화면까지: RN_SHELF_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHELF3_1113.js · 손님 정보 없음(모두 지어낸 상품)
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BQS = require(path.join(ROOT, 'shop/shelf-core.js')); const SH = require(path.join(ROOT, 'cloud/shop.js')); const PH = require(path.join(ROOT, 'cloud/shop-photo.js'));
/* 지어낸 그림 — RGBA */
const canvas = (w, h, bg) => { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { d[i * 4] = bg[0]; d[i * 4 + 1] = bg[1]; d[i * 4 + 2] = bg[2]; d[i * 4 + 3] = 255; } return { d, w, h }; };
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const poly = (C, P, col, tex) => { for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) if (inPoly(x + 0.5, y + 0.5, P)) { const i = (y * C.w + x) * 4; const t = tex ? ((x >> 4) + (y >> 4)) % 2 * 30 : 0; C.d[i] = Math.min(255, col[0] + t); C.d[i + 1] = Math.min(255, col[1] + t); C.d[i + 2] = Math.min(255, col[2]); } };
const rect = (C, x0, y0, x1, y1, col) => poly(C, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], col);
const J = (C) => PH.judge(C.d, C.w, C.h);
(async () => {
console.log('① 순수 셈 — 사진 판정');
{ /* 정면 표지: 가장자리까지 그림(띠마다 다른 색) */ const A = canvas(400, 580, [30, 60, 120]); for (let k = 0; k < 12; k++) rect(A, 0, k * 48, 400, k * 48 + 30, [40 + k * 17, 200 - k * 12, 90 + (k * 37) % 150]); rect(A, 60, 200, 340, 260, [250, 240, 200]);
  const a = J(A); ok(a.k === 'c', `정면 표지(가장자리까지 그림) → 표지(${a.k} · ${a.why})`);
  /* 자리 그림: 밝은 회색 바탕 + 연한 글자 */ const N = canvas(400, 580, [245, 245, 245]); for (let k = 0; k < 3; k++) rect(N, 110, 220 + k * 40, 290, 236 + k * 40, [190, 190, 190]); const n = J(N); ok(n.k === 'n', `「제공된 상품이미지가 없습니다」 꼴 자리 그림 → 자리 그림(${n.k} · ${n.why})`);
  /* 비스듬히 세운 상자: 흰 바탕 + 기운 네모 */ const O = canvas(600, 800, [255, 255, 255]); poly(O, [[170, 90], [480, 150], [430, 720], [120, 660]], [120, 40, 60], true); const o = J(O); ok(o.k === 'o' && o.s >= 50, `흰 바탕에 비스듬한 물건 → 물건 사진(${o.k} ${o.s} · ${o.why})`);
  /* 입체 상자(앞면 + 옆면 + 윗면 · 육각 윤곽) */ const H = canvas(600, 700, [255, 255, 255]); poly(H, [[120, 160], [420, 160], [420, 640], [120, 640]], [30, 70, 140], true); poly(H, [[420, 160], [500, 110], [500, 590], [420, 640]], [20, 40, 90]); poly(H, [[120, 160], [200, 110], [500, 110], [420, 160]], [60, 100, 170]);
  const h = J(H); ok(h.k === 'o', `책등·윗면이 보이는 입체 상자 → 물건 사진(${h.k} · ${h.why})`);
  /* 흰 바탕 표지(흩어진 그림·글 덩어리) — 물건으로 보면 안 됨 */ const W = canvas(400, 580, [252, 252, 250]); rect(W, 40, 60, 360, 110, [20, 20, 20]); rect(W, 40, 130, 220, 150, [60, 60, 60]); poly(W, [[60, 300], [140, 260], [200, 340], [120, 420]], [200, 60, 40]); poly(W, [[250, 380], [330, 330], [350, 470], [280, 500], [240, 450]], [40, 120, 80]); rect(W, 40, 520, 160, 540, [30, 30, 30]);
  const w = J(W); ok(w.k === 'c', `흰 바탕에 그림·글이 흩어진 정면 표지 → 표지(${w.k} · ${w.why})`);
  /* 흰 여백 속 반듯한 표지(네모) → 표지 */ const R = canvas(500, 600, [255, 255, 255]); rect(R, 60, 40, 440, 560, [90, 30, 30]); const r = J(R); ok(r.k === 'c', `흰 여백 속 반듯한 네모 표지 → 표지(${r.k})`);
  ok(PH.pkStr(o) === 'o' + o.s && PH.pkStr(a) === 'c' && PH.PK_RE.test(PH.pkStr(n)) && PH.bucketOf('bk_x1') === PH.bucketOf('bk_x1'), `저장 꼴: ${PH.pkStr(o)} · ${PH.pkStr(a)} · ${PH.pkStr(n)} (shop_photo/b00~b31 · 영구)`);
  ok(PH.wants({ im: 'https://x/o/img%2Fbk_xab%2Ffront_t.webp', cp: '국내도서>소설' }, 'unreg') && PH.wants({ im: 'https://x/o/img%2Fbk_12%2Ff', cp: 'DVD>드라마' }, 'unreg') && !PH.wants({ im: 'https://x/o/img%2Fbk_12%2Ff', cp: '국내도서>소설' }, 'unreg') && PH.wants({ im: 'https://x/o/img%2Fbk_12%2Ff', cp: '국내도서' }, 'all'),
    '판정 대상: 미등록(우리 사진 폴더 bk_x) + 음반·LP·DVD·블루레이·그 밖 · 설정 「모든 상품」이면 전부'); }
console.log('①-2 표지 차례(정범님 21:40 — ① 관리자 ② 알라딘 ③ 알맞은 우리 사진 ④ 고유 디자인)');
{ const c = BQS.cfgOf({}); const AL = 'https://fb/o/img%2Fbk_123%2Ffront_t.webp', US = 'https://fb/o/img%2Fbk_xab%2Ffront_t.webp', ADM = 'https://fb/o/img%2Fbk_xab%2Fp2.jpg';
  const F = (x) => BQS.faceOf(x, c); const S = (f) => f.step + ':' + f.use + ':' + f.by;
  const L = [[{ id: 'a', im: US, pk: 'o70', ac: ADM }, '1:cover:admin', '관리자가 고른 표지 사진(판정이 물건 사진이어도)'], [{ id: 'b', im: US, pk: 'C' }, '1:cover:admin', '관리자 「표지다」(클라우드 판정을 덮음)'], [{ id: 'c', im: AL }, '2:cover:aladin', '알라딘 표지'], [{ id: 'd', im: US, pk: 'c' }, '3:cover:auto', '표지로 알맞음 판정 난 우리 사진'], [{ id: 'e', im: US, pk: 'o62' }, '4:photo:auto', '물건 전체 사진 → 고유 디자인(누르면 사진)'], [{ id: 'f', im: US, pk: 'n99' }, '4:art:auto', '자리 그림 → 고유 디자인'], [{ id: 'g', im: AL, pk: 'O' }, '4:photo:admin', '관리자 「표지 아님」(알라딘 그림이어도)'], [{ id: 'h', im: null }, '4:art:none', '그림 없음 → 고유 디자인'], [{ id: 'i', im: US, pk: 'N' }, '4:art:admin', '관리자 「그림 없음」']];
  const got = L.map(([x]) => S(F(x))); ok(L.every(([, w], i) => got[i] === w), `차례: ${L.map(([, w, m], i) => `${m} → ${got[i]}`).join(' · ')}`);
  ok(S(BQS.faceOf({ id: 'e', im: US, pk: 'o62' }, BQS.cfgOf({ photoJudge: false }))) === '3:cover:auto', '설정 「물건 사진은 표지로 쓰지 않기」를 끄면 예전처럼 사진을 표지로');
  /* 클라우드 서가 자료 — 관리자 값이 판정을 이김 · 꼴 지킴 */ const PI = SH.pickMap({ X1: { k: 'C' }, X2: { k: 'O' }, X3: { src: ADM.replace('https://fb/o/', 'https://firebasestorage.googleapis.com/v0/b/readnow-3a385.firebasestorage.app/o/') }, X4: { k: 'Z', src: 'https://evil.example/a.jpg' }, 'bad id!': { k: 'C' } });
  const R = SH.shelfRows([{ id: 'X1', t: '가', p: 1, im: US, at: '2026-11-01' }, { id: 'X2', t: '나', p: 1, im: AL, at: '2026-11-01' }, { id: 'X3', t: '다', p: 1, im: US, at: '2026-11-01' }, { id: 'X4', t: '라', p: 1, im: US, at: '2026-11-01' }], null, null, null, null, null, null, () => 'o55', PI);
  const U = BQS.unpack({ cols: SH.SHELF_COLS, pre: SH.SHELF_PRE, rows: R }); const g = (id) => U.find((x) => x.id === id);
  ok(SH.SHELF_COLS.includes('pk') && SH.SHELF_COLS.includes('ac') && g('X1').pk === 'C' && g('X2').pk === 'O' && g('X3').pk === 'C' && /^https:\/\/firebasestorage/.test(g('X3').ac) && g('X4').pk === 'o55' && !g('X4').ac && PI.size === 3,
    `서가 자료 pk·ac: 관리자 C·O가 클라우드 판정(o55)을 이김 · 고른 사진은 ac(우리 저장소·알라딘 주소만 · 바깥 주소·이상한 값은 버림) · 관리자 값 없는 상품은 판정 그대로`);
  ok(BQS.faceOf(g('X1'), c).step === 1 && BQS.faceOf(g('X3'), c).src === g('X3').ac && BQS.faceOf(g('X4'), c).use === 'photo', '손님 화면에서도 같은 차례(① 관리자 표지 사진이 먼저)'); }
console.log('①-3 책이 아닌 제품 · 고유 디자인 · 설정');
{ const c = BQS.cfgOf({}); const K = [['[블루레이] 매트릭스', '블루레이', 'bd'], ['[DVD] 시험', 'DVD>드라마', 'dvd'], ['가요 앨범', '음반>가요', 'cd'], ['재즈 명반 LP', '음반>재즈', 'lp'], ['클래식', 'LP>클래식', 'lp'], ['[VHS] 옛 영화', 'DVD', 'vhs'], ['[CD] 동요', null, 'cd'], ['소설', '국내도서>소설', 'book'], ['비디오테이프 그리고 부분 마취', '국내도서>소설/시/희곡', 'book'], ['VHS 시대의 영화', '외국도서>예술', 'book'], ['비디오테이프 그리고 부분 마취', '그 밖', 'book'], ['[VHS] 비디오테이프 묶음', '그 밖', 'vhs'], ['옛 영화 VHS', 'DVD>고전', 'vhs']];
  const got = K.map(([t, cp]) => BQS.kindOf({ t, cp })); ok(K.every(([, , w], i) => got[i] === w), `종류: ${K.map(([t], i) => `${t}→${got[i]}`).join(' · ')}`);
  const D = (cp, t) => BQS.dimOf({ t: t || 'x', cp }, c); const d = { cd: D('음반'), dvd: D('DVD'), bd: D('블루레이'), vhs: D('DVD', '[VHS] x'), lp: D('LP') };
  ok([d.cd.W, d.cd.H, d.cd.D].join() === '142,125,10' && [d.dvd.W, d.dvd.H, d.dvd.D].join() === '135,190,14' && [d.bd.W, d.bd.H, d.bd.D].join() === '135,171,12' && [d.vhs.W, d.vhs.H, d.vhs.D].join() === '104,188,25' && [d.lp.W, d.lp.H, d.lp.D].join() === '314,314,3' && d.lp.fmt === 'LP 재킷',
    `실제 크기(mm 가로×세로×두께): CD ${d.cd.W}×${d.cd.H}×${d.cd.D} · DVD ${d.dvd.W}×${d.dvd.H}×${d.dvd.D} · 블루레이 ${d.bd.W}×${d.bd.H}×${d.bd.D} · VHS ${d.vhs.W}×${d.vhs.H}×${d.vhs.D} · LP ${d.lp.W}×${d.lp.H}×${d.lp.D}`);
  const z = (cp, t) => BQS.sizeOf({ id: 'q', t: t || 'x', cp }, c); const zc = z('음반'), zd = z('DVD'), zb = z('블루레이'), zv = z('DVD', '[VHS] x'), zl = z('LP');
  ok(zd.h > zb.h && zb.h > zc.h && zv.w > zd.w && zd.w > zb.w && zl.h === 100 && Math.abs(zd.h - 190 / 2.97) < 0.2, `책등 비례: 키 DVD ${zd.h}% > 블루레이 ${zb.h}% > CD ${zc.h}% · 두께 VHS ${zv.w}px > DVD ${zd.w}px > 블루레이 ${zb.w}px · LP는 선반 높이(100%)`);
  const c2 = BQS.cfgOf({ szCD: '150x130x12', mediaOn: true }); ok(BQS.dimOf({ t: 'x', cp: '음반' }, c2).W === 150 && !BQS.dimOf({ t: 'x', cp: '음반' }, BQS.cfgOf({ mediaOn: false })).kd && BQS.dimOf({ t: 'x', cp: '음반' }, BQS.cfgOf({ szCD: '이상' })).W === 142, '크기 설정으로 바꿈 · 끄면 책처럼 · 잘못 적으면 기본값');
  const A1 = BQS.artOf({ id: 'aladin_U1', t: '가' }), A1b = BQS.artOf({ id: 'aladin_U1', t: '제목이 바뀌어도' }), codes = new Set(Array.from({ length: 2000 }, (_, i) => BQS.artOf({ id: 'aladin_U' + i }).code));
  ok(A1.code === A1b.code && A1.bg !== A1.ac && codes.size >= 1990 && BQS.ART_PATS.length === 16 && BQS.ART_LAYS.length === 6 && BQS.artOf({ id: 'z', cp: 'LP', t: 'x' }).who === '아티스트', `고유 디자인: 상품 번호로 늘 같음(${A1.code}) · 2,000개 중 서로 다른 ${codes.size}개 · 무늬 ${BQS.ART_PATS.length} × 배치 ${BQS.ART_LAYS.length} × 색 ${BQS.COLORS.length}×${BQS.COLORS.length - 1}`);
  const Kk = BQS.SCHEMA.map((p) => p.k); const need = ['mediaOn', 'szCD', 'szDVD', 'szBD', 'szVHS', 'szLP', 'mediaOpen', 'mediaMs', 'photoJudge', 'photoOpen', 'artOn', 'artText', 'photoScope'];
  ok(need.every((k) => Kk.includes(k)) && BQS.SCHEMA.filter((p) => need.includes(p.k)).every((p) => p.group === '제품·사진') && c.mediaOpen === 'prod' && c.photoOpen === 'photo' && c.artOn === true && c.photoScope === 'unreg', `설정 칸 ${need.length}개(묶음 「제품·사진」 — 관리 웹앱 📚 서가 책장 설정이 저절로 그림) · 기본값 = 정범님 지시대로`);
  for (const f of ['shop/shelf.js', 'shop/shelf-core.js', 'cloud/shop-photo.js']) { const x = fs.readFileSync(path.join(ROOT, f), 'utf8'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(x), f + ': 브라우저 창 없음'); }
  const s = fs.readFileSync(path.join(ROOT, 'shop/shop.js'), 'utf8'); ok(/shelf\.js\?v=0\.2\.1[1-9]/.test(s) && /shelf\.css\?v=0\.2\.1[1-9]/.test(s) && /shelf-core\.js\?v=0\.2\.1[1-9]/.test(s) && /shop\.js\?v=0\.2\.([3-9]|1\d)\b/.test(fs.readFileSync(path.join(ROOT, 'shop/index.html'), 'utf8')) && /^0\.3\.([6-9]|1\d)$/.test(BQS.VER), '판 번호: 서가 0.2.11 이후 · 손님 화면 shop.js 0.2.3 이후 · 설정 틀 0.3.6 이후');
  const css = fs.readFileSync(path.join(ROOT, 'shop/shelf.css'), 'utf8'); ok(BQS.ART_PATS.every((p) => css.includes('.art.ap-' + p)) && BQS.ART_LAYS.every((l) => css.includes('.art.al-' + l)) && ['cd', 'dvd', 'bd', 'vhs', 'lp'].every((k) => css.includes('.sp.md-' + k)) && /prefers-reduced-motion[^}]*\.pm/.test(css), '꾸밈: 무늬 16·배치 6 · 제품 다섯 가지 책등 · 움직임 줄이기 규칙'); }
if (process.env.RN_PHOTO_LAB) { console.log('①-4 실제 사진 정답표와 견줌'); const jpeg = require(require.resolve('jpeg-js', { paths: [process.env.RN_PHOTO_LAB + '/lab', process.env.RN_PHOTO_LAB] })); const IMG = require(path.join(ROOT, 'cloud/shop-img.js'));
  const L = JSON.parse(fs.readFileSync(path.join(process.env.RN_PHOTO_LAB, 'labels.json'), 'utf8')); const cm = {}; for (const f of Object.keys(L)) { if (L[f] === '?') continue; const im = IMG.decode(fs.readFileSync(path.join(process.env.RN_PHOTO_LAB, f)), jpeg); const r = PH.judge(im.data, im.width, im.height); const k = L[f] + '>' + r.k; cm[k] = (cm[k] || 0) + 1; }
  const fpC = (cm['c>o'] || 0) + (cm['c>n'] || 0); const nC = fpC + (cm['c>c'] || 0); ok(fpC / nC < 0.01, `정답표 ${JSON.stringify(cm)} — 정면 표지를 잘못 본 비율 ${(fpC / nC * 100).toFixed(1)}%`); }
if (!process.env.RN_SHELF_UI) { console.log(bad ? `❌ tSHELF3_1113 ${bad}개 실패` : '✓ tSHELF3_1113 순수 셈 통과 (화면 시험은 RN_SHELF_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shelf3'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const SVG = { cover: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="430"><rect width="300" height="430" fill="hsl(${h},55%,40%)"/><rect y="250" width="300" height="70" fill="hsl(${(h + 150) % 360},60%,70%)"/><text x="24" y="90" font-size="34" fill="#fff" font-family="sans-serif">표지 ${h}</text></svg>`,
  photo: () => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#fff"/><polygon points="170,90 480,150 430,720 120,660" fill="#783c3c"/><polygon points="120,660 430,720 440,740 128,684" fill="#ddd"/><text x="200" y="400" font-size="34" fill="#fff" transform="rotate(10 300 400)">실물 사진</text></svg>`,
  disc: (h) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="hsl(${h},45%,30%)"/><circle cx="200" cy="200" r="120" fill="hsl(${(h + 60) % 360},70%,60%)"/><text x="40" y="370" font-size="30" fill="#fff" font-family="sans-serif">앨범 ${h}</text></svg>` };
const srvBase = { v: '' };
const D0 = BQS.demoItems(160, 9).map((x, i) => ({ ...x, id: 'D' + i, im: null, bk: null, at: '2026-09-' + String(1 + (i % 28)).padStart(2, '0') }));
const SPEC = [['P1', '여름 바다 산책 (실물 사진)', '지은이 가', '국내도서>에세이', 'photo', 'o72'], ['P2', '이미지 없는 책', '지은이 나', '국내도서>소설/시/희곡', 'cover', 'n99'], ['P3', '알라딘 표지 책', '지은이 다', '국내도서>인문학', 'cover', null], ['P4', '관리자가 표지로 고른 책', '지은이 라', '국내도서>역사', 'photo', 'o80'],
  ['M1', '[CD] 시험 앨범', '가수 하나', '음반>가요', 'disc', 'c'], ['M2', '[DVD] 시험 영화', '감독 둘', 'DVD>드라마', 'cover', 'c'], ['M3', '[블루레이] 시험 영화', '감독 셋', '블루레이>SF', 'cover', 'c'], ['M4', '[VHS] 옛 비디오', '감독 넷', 'DVD>고전', 'cover', null], ['M5', '재즈 명반 LP', '연주자 다섯', 'LP>재즈', 'disc', null], ['M6', '[블루레이] 박스 세트(실물 사진)', '감독 여섯', '블루레이>박스', 'photo', 'o66']];
const mk = (base) => [...SPEC.map(([id, t, a, cp, img, pk], i) => ({ id, t, a, cp, c: cp.split('>')[1] || cp.split('>')[0], p: 3000 + i * 500, lp: 9000, at: '2026-11-13', im: base + '/img/' + (id === 'P3' ? 'cover' : img) + '_' + (40 * i) + (id.startsWith('P') && id !== 'P3' ? '&bk_x' : '') + '.svg', pk, ac: id === 'P4' ? base + '/img/cover_200.svg' : null })), ...D0];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
let rows = [];
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const Jo = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
  const m = /^\/img\/(cover|photo|disc)_(\d+)/.exec(u.pathname); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(SVG[m[1]](+m[2])); }
  if (u.pathname === '/shop/cfg') return Jo({ ok: true, open: 1, name: '북스퀸', n: rows.length, pay: { how: 'wait' }, biz: {}, kinds: [], cats: [], shelf: { cap: 200, sort0: 'reg', fontsOn: false, coverColor: false, edgeSpine: false } });
  if (u.pathname === '/shop/shelf') return Jo({ ok: true, n: rows.length, k: 0, kn: 1, cols: SH.SHELF_COLS, pre: [], rows });
  if (u.pathname === '/shop/item') { const x = mk(srvBase.v).find((y) => y.id === u.searchParams.get('id')); return x ? Jo({ ok: true, item: { ...x, st: 's', info: {}, pvs: [] }, same: [], rel: [] }) : Jo({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return Jo({ ok: true });
  const f = path.join(ROOT, 'shop', u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f)) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port; srvBase.v = base;
/* 우리 사진 폴더 흉내(bk_x) — 주소에 'img%2Fbk_x'를 넣어 손님 화면이 '우리 사진'으로 알게 */
rows = mk(base).map((x) => SH.SHELF_COLS.map((k) => (k === 'st' ? 's' : k === 'im' && x.im && /&bk_x/.test(x.im) ? x.im.replace('&bk_x', '') + '?p=img%2Fbk_x1%2F' : x[k] == null ? null : x[k])));
const kill = setTimeout(() => { console.log('  ❌ 240초 넘음'); process.exit(1); }, 240000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const open = async (ctxO, hash, rm) => { const ctx = await br.newContext({ deviceScaleFactor: 2, ...ctxO, ...(rm ? { reducedMotion: 'reduce' } : {}) }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); } catch (e) {} }, base);
  await p.goto(base + '/s/index.html' + hash); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700); return { ctx, p, errs }; };
const cfgQ = (o) => '&cfg=' + BQS.previewArg(BQS.cfgOf(o));
const PC = { viewport: { width: 1280, height: 860 } }; const M = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const waitOpen = async (p) => { for (let w = 0; w < 40; w++) { await p.waitForTimeout(100); if (await p.evaluate(() => !!document.querySelector('.bqs-pvw.go,.bqs-ob.on .ob-book') && (document.querySelector('.bqs').dataset.obPhase || '') === 'open')) break; } await p.waitForTimeout(250); };
const closeOb = async (p) => { await p.keyboard.press('Escape'); for (let w = 0; w < 30; w++) { await p.waitForTimeout(100); if (await p.evaluate(() => !document.querySelector('.bqs-ob'))) break; } };
try {
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg');
    const S = await p.evaluate(() => { const g = (id) => { const b = document.querySelector(`.bqs-case.cur .sp[data-id="${id}"]`); if (!b) return null; const r = b.querySelector('.sk').getBoundingClientRect(); return { cls: b.className, w: Math.round(r.width * 10) / 10, h: Math.round(r.height), eg: !!b.querySelector('.eg') }; }; return Object.fromEntries(['M1', 'M2', 'M3', 'M4', 'M5', 'P1', 'P3'].map((k) => [k, g(k)])); });
    await p.evaluate(() => document.querySelector('.bqs-case.cur .sp[data-id="M1"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOT, 'pc1280_spines_media.png') });
    ok(/md-cd/.test(S.M1.cls) && /md-dvd/.test(S.M2.cls) && /md-bd/.test(S.M3.cls) && /md-vhs/.test(S.M4.cls) && /md-lp/.test(S.M5.cls) && S.M2.h > S.M3.h && S.M3.h > S.M1.h && S.M4.w > S.M2.w && S.M2.w > S.M3.w,
      `책등 모드: 제품 다섯 가지 모양(CD·DVD·블루레이·VHS·LP) · 키 DVD ${S.M2.h} > 블루레이 ${S.M3.h} > CD ${S.M1.h}px · 두께 VHS ${S.M4.w} > DVD ${S.M2.w} > 블루레이 ${S.M3.w}px`);
    await p.click('.bqs-case.cur .sp[data-id="P1"]'); await waitOpen(p); const R1 = await p.evaluate(() => ({ pv: document.querySelector('.bqs').dataset.pv || '', img: (document.querySelector('.bqs-pvw .pv-ph img') || {}).src || '', book: !!document.querySelector('.bqs-ob .ob-book'), cart: !!document.querySelector('.bqs-pvw [data-a="cart"]') }));
    await p.screenshot({ path: path.join(SHOT, 'pc1280_photo_open.png') }); ok(R1.pv === 'photo' && /photo_0/.test(R1.img) && !R1.book && R1.cart, `물건 사진 책(P1) 누름 → 책 펼침 대신 사진 자체가 앞으로(${R1.pv}) · 담기 단추 그대로`); await closeOb(p);
    for (const [id, kd, file] of [['M1', 'cd', 'pc1280_cd_open.png'], ['M5', 'lp', 'pc1280_lp_open.png'], ['M2', 'dvd', 'pc1280_dvd_open.png'], ['M4', 'vhs', 'pc1280_vhs_open.png']]) {
      await p.evaluate((i) => document.querySelector(`.bqs-case.cur .sp[data-id="${i}"]`).scrollIntoView({ block: 'center' }), id); await p.click(`.bqs-case.cur .sp[data-id="${id}"]`); await waitOpen(p); await p.waitForTimeout(900);
      const R = await p.evaluate(() => { const el = document.querySelector('.bqs-pvw'); const pm = el && el.querySelector('.pm'); const lid = pm && pm.querySelector('.lid'); const vin = pm && pm.querySelector('.vin,.tape'); return { pv: document.querySelector('.bqs').dataset.pv || '', go: !!(el && el.classList.contains('go')), lid: lid ? getComputedStyle(lid).transform : '', vin: vin ? getComputedStyle(vin).transform : '', w: pm ? pm.offsetWidth : 0, h: pm ? pm.offsetHeight : 0 }; });
      await p.screenshot({ path: path.join(SHOT, file) }); const moved = (kd === 'lp' || kd === 'vhs' ? R.vin : R.lid) !== 'none';
      ok(R.pv === 'media:' + kd && R.go && moved, `${kd.toUpperCase()}(${id}) 누름 → 제품답게 열림(${kd === 'lp' ? '판이 재킷에서 반쯤' : kd === 'vhs' ? '테이프가 슬리브에서' : '케이스 뚜껑이 열리며 디스크'}) · 비율 ${R.w}×${R.h}px`); await closeOb(p); }
    await p.selectOption('.bqs-sort', 'reg').catch(() => {}); const cvBtn = await p.$('.bqs-cv, [data-a="cov"], .bqs-view-cov');
    ok(!errs.length, 'PC 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg', false); await p.evaluate(() => { try { localStorage.setItem('bq-shelf-cov', 'true'); } catch (e) {} }); await ctx.close(); }
  /* 표지 모드(PC) — 손님 ⚙ 보기 '표지' 단추 대신 기억 칸으로 켬 */
  { const ctx = await br.newContext({ ...PC, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); for (const k of ['bq-shelf-cov', 'bqs-cov', 'bq-shelf-v1-cov']) localStorage.setItem(k, 'true'); } catch (e) {} }, base); await p.goto(base + '/s/index.html#/shelf?s=reg'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700);
    let cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); if (!cov) { const t = await p.$('[data-a="cov"],.bqs-cov,button[aria-label*="표지"]'); if (t) { await t.click(); await p.waitForTimeout(800); } cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); }
    const Cv = await p.evaluate(() => { const g = (id) => { const b = document.querySelector(`.bqs-case.cur .cvb[data-id="${id}"]`); if (!b) return null; const f = b.querySelector('.cvf'); const r = f.getBoundingClientRect(); return { art: !!f.querySelector('.art'), img: (f.querySelector('img') || {}).src || '', txt: (f.querySelector('.art b') || {}).textContent || '', au: (f.querySelector('.art small') || {}).textContent || '', w: Math.round(r.width), h: Math.round(r.height), cls: b.className }; }; return Object.fromEntries(['P1', 'P2', 'P3', 'P4', 'M1', 'M5', 'M6'].map((k) => [k, g(k)])); });
    await p.screenshot({ path: path.join(SHOT, 'pc1280_cover_mode.png') });
    ok(cov && Cv.P1 && Cv.P1.art && !Cv.P1.img && /여름 바다/.test(Cv.P1.txt) && Cv.P1.au === BQS.auName('지은이 가') && Cv.P2.art && /cover_80/.test(Cv.P3.img) && /cover_200/.test(Cv.P4.img) && !Cv.P4.art, `표지 모드: 물건 사진 책 → 고유 디자인(제목 「${Cv.P1 && Cv.P1.txt}」·지은이) · 자리 그림 → 고유 디자인 · 알라딘 표지 그대로 · ① 관리자가 고른 표지가 판정(물건 사진)을 이김`);
    ok(Cv.M6 && Cv.M6.art && /박스 세트/.test(Cv.M6.txt) && Cv.M6.au === '감독 여섯' && Cv.M1 && /md-cd/.test(Cv.M1.cls) && Math.abs(Cv.M1.w / Cv.M1.h - 142 / 125) < 0.08 && Cv.M5 && Math.abs(Cv.M5.w / Cv.M5.h - 1) < 0.06, `표지 모드 제품: 실물 사진 블루레이 → 고유 디자인 + 제목·아티스트(${Cv.M6 && Cv.M6.au}) · CD 케이스 비율 ${Cv.M1 && (Cv.M1.w / Cv.M1.h).toFixed(2)}(142÷125=1.14) · LP 정사각 ${Cv.M5 && (Cv.M5.w / Cv.M5.h).toFixed(2)}`);
    const A2 = await p.evaluate(() => (document.querySelector('.bqs-case.cur .cvb[data-id="P1"] .art') || {}).dataset ? document.querySelector('.bqs-case.cur .cvb[data-id="P1"] .art').dataset.art : ''); await p.reload(); await p.waitForSelector('.bqs-case.cur .cvb', { timeout: 20000 }); await p.waitForTimeout(500);
    const A3 = await p.evaluate(() => (document.querySelector('.bqs-case.cur .cvb[data-id="P1"] .art') || { dataset: {} }).dataset.art || ''); ok(A2 && A2 === A3, `고유 디자인은 다시 열어도 같음(${A2})`);
    ok(!errs.length, 'PC 표지 모드 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  /* 움직임 줄이기 — 바로 끝 모습 */
  { const { ctx, p, errs } = await open(PC, '#/shelf?s=reg', true); await p.evaluate(() => document.querySelector('.bqs-case.cur .sp[data-id="M1"]').scrollIntoView({ block: 'center' })); await p.click('.bqs-case.cur .sp[data-id="M1"]'); await p.waitForTimeout(150);
    const R = await p.evaluate(() => ({ go: !!document.querySelector('.bqs-pvw.go'), ms: (document.querySelector('.pm') || { style: { getPropertyValue: () => '' } }).style.getPropertyValue('--ms') })); ok(R.go && R.ms === '0ms', `움직임 줄이기 설정: 움직이지 않고 바로 열린 모습(--ms ${R.ms})`); ok(!errs.length, '움직임 줄이기 오류 0'); await ctx.close(); }
  /* 설정: 예전처럼(책 펼침) */
  { const { ctx, p } = await open(PC, '#/shelf?s=reg' + cfgQ({ mediaOpen: 'book', photoOpen: 'book' })); await p.click('.bqs-case.cur .sp[data-id="P1"]'); for (let w = 0; w < 30; w++) { await p.waitForTimeout(100); if ((await p.evaluate(() => document.querySelector('.bqs').dataset.obPhase || '')) === 'open') break; }
    const R = await p.evaluate(() => ({ book: !!document.querySelector('.bqs-ob .ob-book'), pv: !!document.querySelector('.bqs-pvw') })); ok(R.book && !R.pv, '설정 「책 펼침(예전)」으로 바꾸면 책처럼 펼침'); await ctx.close(); }
  /* 휴대폰 390 */
  { const { ctx, p, errs } = await open(M, '#/shelf?s=reg'); await p.screenshot({ path: path.join(SHOT, 'm390_spines.png') });
    await p.tap('.bqs-case.cur .sp[data-id="P1"]'); await p.waitForTimeout(500); const S1 = await p.evaluate(() => ({ sheet: !document.querySelector('.bqs-sheet').hidden, im: (document.querySelector('.bqs-sheet .sh-im') || {}).tagName || '' })); await p.screenshot({ path: path.join(SHOT, 'm390_sheet_photo.png') });
    ok(S1.sheet && S1.im === 'IMG', '휴대폰 아래 창: 물건 사진 상품은 사진 그대로'); ok(!errs.length, '휴대폰 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const { ctx, p, errs } = await open(M, '#/shelf?s=reg' + cfgQ({ mobPop: 'open' })); await p.tap('.bqs-case.cur .sp[data-id="M5"]'); await waitOpen(p); await p.waitForTimeout(900);
    const R = await p.evaluate(() => ({ pv: document.querySelector('.bqs').dataset.pv || '', sw: document.documentElement.scrollWidth })); await p.screenshot({ path: path.join(SHOT, 'm390_lp_open.png') }); ok(R.pv === 'media:lp', `휴대폰 「앞으로 나와 펼침」 설정에서 LP → 판이 반쯤(${R.pv})`); await closeOb(p);
    await p.tap('.bqs-case.cur .sp[data-id="P1"]'); await waitOpen(p); await p.screenshot({ path: path.join(SHOT, 'm390_photo_open.png') }); ok((await p.evaluate(() => document.querySelector('.bqs').dataset.pv || '')) === 'photo', '휴대폰 물건 사진 → 사진 자체'); ok(!errs.length, '휴대폰 펼침 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
  { const ctx = await br.newContext({ ...M, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.addInitScript((u) => { window.BQ_API = u; try { localStorage.clear(); for (const k of ['bq-shelf-cov', 'bqs-cov', 'bq-shelf-v1-cov']) localStorage.setItem(k, 'true'); } catch (e) {} }, base); await p.goto(base + '/s/index.html#/shelf?s=reg'); await p.waitForSelector('.bqs-case.cur .sp', { timeout: 20000 }); await p.waitForTimeout(700);
    let cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); if (!cov) { const t = await p.$('[data-a="cov"],.bqs-cov,button[aria-label*="표지"]'); if (t) { await t.tap(); await p.waitForTimeout(800); } cov = await p.evaluate(() => !!document.querySelector('.bqs-case.cur .cvb')); }
    const R = await p.evaluate(() => ({ art: !!document.querySelector('.bqs-case.cur .cvb[data-id="P1"] .art'), sw: document.documentElement.scrollWidth })); await p.screenshot({ path: path.join(SHOT, 'm390_cover_mode.png') });
    ok(cov && R.art && R.sw <= 390, `휴대폰 표지 모드: 물건 사진 상품은 고유 디자인 · 가로 넘침 없음(${R.sw}px)`); ok(!errs.length, '휴대폰 표지 모드 오류 0 ' + errs.slice(0, 2).join(' | ')); await ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 예외', e && e.stack ? e.stack.slice(0, 700) : e); }
await br.close(); srv.close(); clearTimeout(kill);
console.log(bad ? `❌ tSHELF3_1113 ${bad}개 실패 · 사진 ${SHOT}` : `✓ tSHELF3_1113 모두 통과 · 사진 ${SHOT}`); process.exit(bad ? 1 : 0);
})();
