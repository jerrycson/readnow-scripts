// tY24SAMP1_1119 — 11/19 y24samp1: 🧬 예스24 목록 읽기(N10) 견본 늘리기
//   ① 실패 견본을 다른 ISBN으로 메워 3권(후보 최대 6권 · 외국 ISBN은 앞서 뺌) ② 검색 화면 한 장의 새책 줄 최대 5줄로 셈
//   ③ 건강 기록에 via·줄 종류(새책·중고·전자책) ④ 견본 2권 미만이면 점수 비교 보류(옛 값은 이어 둠)
// 실행: cd src/tests && JSDOM=<jsdom 경로> node tY24SAMP1_1119.js · 지어낸 값만
const fs = require('fs'); const path = require('path');
let JSDOM; try { ({ JSDOM } = require(process.env.JSDOM || 'jsdom')); } catch (e) { ({ JSDOM } = require('/home/user/.rn-nm/node_modules/jsdom')); }
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const root = path.join(__dirname, '..', '..'); const CSRC = fs.readFileSync(path.join(root, 'cloud/index.js'), 'utf8'); const A = require(path.join(root, 'readnow-adapt-core.js'));
const cut = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); return s.slice(i, j); };
const H = new Function(cut(CSRC, 'const Y24S_MAXTRY', 'async function adaptY24(') + '\nreturn { y24Cands, y24ListSample, y24Hold, Y24S_MAXTRY, Y24S_WANT, Y24S_MIN, Y24S_ROWS };')();
const kr = (i) => 9788900000000 + i; const KR = (i) => String(kr(i)); const isKr = A.isKrIsbn;

console.log('① 후보 — 외국 ISBN 빼고 최대 6권');
{ const pk = ['9780007137282', '9788925554990', '9791168761841']; const rest = ['9780000000001', '9788936434120', '9791190000062', '9788998209039', '9788937460449', '9788937460586', '9788901234567'];
  const c = H.y24Cands(pk, rest, isKr);
  ok(c.length === 6 && !c.includes('9780007137282') && !c.includes('9780000000001'), '외국 ISBN(9780…)은 후보에서 빠지고 6권까지', c);
  ok(c[0] === '9788925554990' && c[1] === '9791168761841', '고른 순서(골든 먼저)는 그대로', c);
  ok(H.y24Cands(['9788925554990', '9788925554990'], [], isKr).length === 1 && H.y24Cands([], [], isKr).length === 0, '같은 ISBN은 한 번 · 빈 입력은 빈 목록'); }

console.log('② 목록 견본 — 새책 줄 최대 5줄');
const yb = (g) => `<li><div class="itemUnit"><div class="item_img"><a href="https://www.yes24.com/product/goods/${g.no}" class="lnk_img"><img alt="${g.t}"></a></div><div class="item_info"><div class="info_row info_name"><span class="gd_res">${g.res}</span> <a class="gd_name" href="/product/goods/${g.no}">${g.t}</a></div>
  <div class="info_row info_pubGrp"><span class="authPub info_auth"><a href="https://www.yes24.com/product/search?domain=ALL&authorNo=1&author=${g.au}">${g.au}</a> 저 </span><span class="authPub info_pub"><a href="https://www.yes24.com/product/search?&domain=ALL&company=x">출판</a></span><span class="authPub info_date">2024년 03월</span></div>
  <div class="info_row info_price"><strong class="txt_num"><em class="yes_b">9,000</em>원</strong><span class="txt_num dash"><em class="yes_m">10,000</em>원</span></div><div class="info_row info_rating"><span class="saleNum">판매지수 ${g.si}</span></div></div></div></li>`;
const page = (L) => `<html><body><ul id="yesSchList">${L.map(yb).join('')}</ul></body></html>`;
const Y = []; for (let i = 1; i <= 7; i++) Y.push({ no: 100 + i, t: '새책 시험 ' + i, au: '가' + i, si: 1000 + i, res: '[도서]' }); Y.splice(2, 0, { no: 900, t: '중고 시험', au: '나', si: 5, res: '[중고도서]' }); Y.splice(4, 0, { no: 901, t: '전자 시험', au: '다', si: 6, res: '[eBook]' });
const doc = new JSDOM(page(Y)).window.document; const X = A.extractList(doc, { kind: 'y24_list' });
const lst = H.y24ListSample({ rows: X.rows.map((r) => ({ ...r })), boxes: X.boxes, fp: X.fp });
ok(X.rows.length === 9 && lst.rowsAll === 9, '검색 화면 한 장에 9줄(새책 7 · 중고 1 · 전자책 1)', { n: X.rows.length, all: lst.rowsAll });
ok(lst.rows.length === 5 && lst.rows.every((r) => r.used === 'new' && r.goodsNo), '새책 줄만 최대 5줄로 셈(중고·전자책 줄은 뺌)', lst.rows.map((r) => r.used));
ok(lst.kinds.new === 7 && lst.kinds.used === 1 && lst.kinds.ebook === 1, '③ 줄 종류 새책 7 · 중고 1 · 전자책 1을 남김', lst.kinds);
const LH = A.healthOfList([lst], 'y24_list'); ok(LH.rows === 5 && LH.fields.author.fill === 1 && LH.fields.salesIndex.fill === 1, '칸 채움률은 5줄로 나눔(저자·판매지수 100%)', { rows: LH.rows, a: LH.fields.author, s: LH.fields.salesIndex });
const first = X.rows.find((r) => r.used !== 'used' && r.goodsNo); ok(first && first.goodsNo === '101', '첫 새책 줄 고르기(상품 화면 읽기)는 그대로', first && first.goodsNo);
ok(H.y24ListSample(null) === null && H.y24ListSample({ main: true, rows: [] }).rows.length === 0, '빈 화면·첫 화면 신호는 그대로 지나감');

console.log('④ 견본 2권 미만 → 보류');
const prevK = { y24_product: { health: { score: 0.97 }, judge: { broken: [] } }, y24_list: { health: { score: 0.94 }, judge: { broken: [] } }, al_list: { health: { score: 0.99 } } };
for (const n of [0, 1]) { const hd = H.y24Hold(prevK, n, '2026-11-19', '2026-11-17'); ok(hd && hd.y24_list.held === '2026-11-19' && hd.y24_list.health.score === 0.94 && hd.y24_product.health.score === 0.97 && hd.y24_list.heldSince === '2026-11-17' && !('al_list' in hd), `견본 ${n}권 → 보류 · 옛 점수 그대로 이어 둠 · 알라딘은 안 건드림`); }
ok(H.y24Hold(prevK, 2, 'd', 'p') === null && H.y24Hold(prevK, 3, 'd', 'p') === null, '견본 2권·3권이면 보류 아님(평소대로 비교)');
ok(JSON.stringify(H.y24Hold({}, 0, 'd', 'p')) === '{}' && JSON.stringify(H.y24Hold(null, 1, 'd', 'p')) === '{}', '이어 둘 옛 값이 없으면 빈 칸(오류 없음)');
ok(prevK.y24_list.held === undefined, '옛 기록 객체는 바꾸지 않음(복사해서 이음)');
const again = H.y24Hold({ y24_list: { health: { score: 0.94 }, held: '2026-11-19', heldSince: '2026-11-17' } }, 0, '2026-11-20', '2026-11-19'); ok(again.y24_list.heldSince === '2026-11-17' && again.y24_list.held === '2026-11-20', '이틀 이어 보류해도 처음 보류한 날은 그대로');

console.log('연결 — 매일 점검 코드');
ok(/for \(const isbn of y24Cands\(pick, rest, A\.isKrIsbn\)\) \{ if \(yx\.length >= Y24S_WANT\) break;/.test(CSRC), '견본 후보 반복: 3권 차면 멈춤 · 실패는 다음 후보로');
ok(/y24ListSample\(lst\); if \(!no\) return \{ none: 1/.test(CSRC), '검색 화면 줄 줄이기가 상품 번호 고르기 뒤에 들어감(첫 새책 줄은 그대로 씀)');
ok(/const y24Held = y24Hold\(prevK, yx\.length, day, H0\.day\)/.test(CSRC) && /yl = y24Held \? \[\] :/.test(CSRC), '보류면 오늘 견본으로 새 점수를 만들지 않음');
ok(/if \(v\.held\) continue; \(v\.judge\.broken/.test(CSRC) && /if \(v\.held\) continue; const F = /.test(CSRC), '보류한 종류는 깨짐·경고·적응 장부에 다시 세지 않음');
ok(/y24: \{ want: Y24S_WANT, tried: ySm\.length, ok: yx\.length, hold:/.test(CSRC) && /samples: ySm/.test(CSRC), '③ 건강 기록에 via·줄 종류·견본 표 남김');
ok(/Object\.values\(kinds\)\.reduce\(\(s, v\) => s \+ v\.health\.score/.test(CSRC), '점수 평균에는 이어 둔 옛 값이 들어가 오르내리지 않음');
ok(!/예스24 자동 등록|y24Reg/.test(cut(CSRC, 'const Y24S_MAXTRY', 'async function adaptY24(')), '등록 경로는 손대지 않음');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
