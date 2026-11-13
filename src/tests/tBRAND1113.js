// tBRAND1113 — (11/13 shoplogo1) 👑 북스퀸 로고 시안 10개(정범님 11/13 20:12)
//   ① 파일: 시안마다 가로형 밝은 바탕·어두운 바탕·정사각 아이콘 SVG 세 개 · 바깥 글꼴·바깥 주소·<text>·스크립트 없음(글자는 윤곽선) · viewBox 있음 · 아이콘은 정사각
//   ② 목록: shop/brand/logos.json과 brand-core.js(BQB) 목록·비율이 같음 · 미리보기 html이 모든 파일을 부름
//   ③ 셈: BQB.of(모르는 값 → '' = 지금 글자 로고) · src · headerImg(높이 범위·비율 너비) · options(첫 칸 = 지금 글자 로고)
//   ④ 빌드: hosting/build-shop.js가 brand/의 svg·json·js를 담고 미리보기 html은 손님 사이트에 올리지 않음
// 실행: node src/tests/tBRAND1113.js
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BD = path.join(ROOT, 'shop/brand');
const B = require(path.join(BD, 'brand-core.js')); const J = JSON.parse(fs.readFileSync(path.join(BD, 'logos.json'), 'utf8'));

console.log('① 파일');
ok(B.IDS.length === 10 && new Set(B.IDS).size === 10, '시안 10개 · 번호 겹침 없음');
for (const x of J.logos) {
  const fl = ['light', 'dark', 'icon'].map((k) => x.files[k]); const ex = fl.every((f) => fs.existsSync(path.join(BD, f)));
  let clean = ex, sq = false, small = ex;
  if (ex) for (const f of fl) { const s = fs.readFileSync(path.join(BD, f), 'utf8');
    if (!/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[\d. ]+"/.test(s) || /<text|<script|@font-face|font-family|href=|url\(|on\w+=/i.test(s) || !/<title>/.test(s)) clean = false;
    if (s.length > 40000) small = false;
    if (f.endsWith('-icon.svg')) sq = /viewBox="0 0 512 512"/.test(s); }
  ok(ex && clean && sq && small, `${x.id} ${x.name}: 세 파일 · 윤곽선만(바깥 글꼴·주소·스크립트 없음) · 아이콘 정사각 · 한 파일 40KB 아래`);
}
console.log('② 목록');
ok(JSON.stringify(J.logos.map((x) => [x.id, x.name, x.ratio])) === JSON.stringify(B.LIST), 'logos.json = brand-core.js 목록(번호·이름·비율)');
ok(J.default === '' && J.logos.every((x) => x.idea && x.idea.length > 10), '기본 = 빈 값(지금 글자 로고) · 시안마다 의도 한 줄');
{ const pv = fs.readFileSync(path.join(BD, 'preview.html'), 'utf8'); ok(J.logos.every((x) => Object.values(x.files).every((f) => pv.includes('src="' + f + '"'))), '미리보기 html이 30개 파일을 모두 부름'); }
console.log('③ 셈');
ok(B.of('Q03') === 'q03' && B.of(' q10 ') === 'q10' && B.of('q11') === '' && B.of(null) === '' && B.of('<x>') === '', 'of: 대소문자·빈칸 정리 · 모르는 값은 빈 값');
ok(B.src('q03', 'dark') === 'brand/q03-dark.svg' && B.src('q03', 'icon', 'https://booksqueen.com/brand/') === 'https://booksqueen.com/brand/q03-icon.svg' && B.src('q03') === 'brand/q03.svg' && B.src('zz', 'dark') === '', 'src: 종류별 파일 주소 · 모르면 빈 글');
{ const h = B.headerImg('q01', 34); ok(/src="brand\/q01-dark\.svg"/.test(h) && /height="34"/.test(h) && /width="97"/.test(h) && /alt="북스퀸"/.test(h), 'headerImg: 머리띠(어두운 바탕) 그림 · 높이 34 · 너비는 비율로');
  ok(/height="80"/.test(B.headerImg('q02', 500)) && /height="16"/.test(B.headerImg('q02', 1)) && B.headerImg('', 34) === '' && B.headerImg('"><script>', 34) === '', 'headerImg: 높이 16~80 · 빈 값·이상한 값은 그림 없음(글자 로고 그대로)'); }
ok(B.options().length === 11 && B.options()[0][0] === '' && B.options()[3][0] === 'q03', 'options: 첫 칸 = 지금 글자 로고 + 시안 10개');
console.log('④ 빌드');
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tbrand_')); const r = require(path.join(ROOT, 'hosting/build-shop.js')).build(ROOT, out);
  ok(B.IDS.every((i) => fs.existsSync(path.join(out, 'brand', i + '-dark.svg'))) && fs.existsSync(path.join(out, 'brand/logos.json')) && fs.existsSync(path.join(out, 'brand/brand-core.js')) && !fs.existsSync(path.join(out, 'brand/preview.html')) && fs.existsSync(path.join(out, 'index.html')), '숍 결과물: brand/ 그림·목록·셈 담음 · 미리보기 html은 뺌 · 손님 화면 그대로');
  fs.rmSync(out, { recursive: true, force: true }); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
