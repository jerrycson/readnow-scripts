// tLOGOPICK1118 — (11/18 logopick1) ⭐ 북스퀸 로고 고르기 · ✏ 변형 창(정범님 I-1118-1208-11.7)
//   ① 모듈: shop/brand/studio/logopick.js 있음 · 브라우저 팝업 없음 · 원본 파일 쓰기 없음(서버로 그림 올리기 없음)
//   ② 페이지: ideas.html·project.html 카드에 data-lp-* 표시 · 모듈을 스크립트 꼬리표 없이 불러 붙임 · project.html 링크 한 줄 그대로
//   ③ 빌드: 손님 숍 결과물(booksqueen.com)에는 brand/studio·logopick.js가 없음 · 관리 사이트는 shop/brand 통째(studio 포함)
//   ④ 셈: 색 읽기·채도·밝기·색조 · 윤곽선 글자 알아보기 · 기기↔클라우드 맞붙이기(새 시각이 이김 · 지우지 않음)
//   ⑤ 그림: 원본 SVG를 나눠(글자 줄·모양) 고침 기록을 얹어 그림 — 아무것도 안 바꾸면 색 그대로 · 부분 색 · 같은 색 한꺼번에 · 채도 0 · 글씨 바꾸기 · 모양 대체 · 더하기 · 숨기기 · 받기용은 표시 지움
// 실행: node src/tests/tLOGOPICK1118.js
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BD = path.join(ROOT, 'shop/brand'); const MOD = path.join(BD, 'studio/logopick.js');

console.log('① 모듈');
const S = fs.existsSync(MOD) ? fs.readFileSync(MOD, 'utf8') : '';
ok(S.length > 1000, 'studio/logopick.js 있음');
ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(S), '브라우저 팝업(alert·confirm·prompt) 없음 — 토스트·안의 창');
ok(/showModal\(\)/.test(S) && /'cancel'/.test(S) && /e\.target === dlg/.test(S) && /aria-label="닫기"/.test(S), '변형 창: 안의 창 · 닫기 ✕ · Esc · 바깥 누르기');
ok(!/method:\s*'(PUT|POST|DELETE)'/i.test(S) && !/deleteDoc|deleteField/.test(S), '원본·자료 지우기·올리기 없음(변형은 고침 기록만 · 지우지 않음)');
ok(/brand_studio/.test(S) && /merge: true/.test(S), '클라우드 저장: Firestore brand_studio/main 합쳐 쓰기');
ok(/gone: true/.test(S) && /on: false/.test(S), '빼기·버리기는 표시만(on:false · gone:true)');

console.log('② 페이지');
const I = fs.readFileSync(path.join(BD, 'ideas.html'), 'utf8'); const P = fs.readFileSync(path.join(BD, 'project.html'), 'utf8');
for (const [n, h] of [['ideas.html', I], ['project.html', P]]) {
  ok(/data-lp-key="/.test(h) && /data-lp-light="/.test(h) && /data-lp-dark="/.test(h) && /data-lp-icon="/.test(h), n + ': 카드에 고르기 표시(data-lp-*)');
  ok(/'studio\/logopick\.js\?v=\d+'/.test(h) && /LP\.mount\(/.test(h) && !/<script src=/.test(h), n + ': 모듈을 스크립트 꼬리표 없이 불러 붙임');
}
ok((P.match(/href="ideas\.html"/g) || []).length === 1, 'project.html: 아이디어 100 링크 한 줄 그대로');
ok(/data-lp-key="idea:' \+ it\.id/.test(I) && /esc\(it\.no \+ ' ' \+ it\.name\)/.test(I), 'ideas.html: 열쇠 idea:iNNN · 이름은 가려 넣음');

console.log('③ 빌드');
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tlogopick_')); require(path.join(ROOT, 'hosting/build-shop.js')).build(ROOT, out);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(out).map((f) => path.relative(out, f));
  ok(fs.existsSync(path.join(out, 'brand/logos.json')) && !fs.existsSync(path.join(out, 'brand/studio')) && !files.some((f) => /logopick/.test(f)), '손님 숍 결과물(booksqueen.com): brand/는 담되 studio/·logopick.js는 없음');
  ok(!files.some((f) => /brand[\\/](ideas|project)\.html$/.test(f)), '손님 숍 결과물: 로고 페이지(ideas.html·project.html) 없음');
  fs.rmSync(out, { recursive: true, force: true }); }
{ const K = require(path.join(ROOT, 'hosting/build.js')).KEEP; ok(K.some((x) => x[0] === 'shop/brand' && x[1]), '관리 사이트: shop/brand 통째(readnow.kr/shop/brand/studio/logopick.js)'); }

console.log('④ 셈');
const H = require(MOD);
ok(H.norm('#abc') === '#aabbcc' && H.norm('rgb(29, 43, 69)') === '#1d2b45' && H.norm('none') === null && H.norm('url(#g)') === null && H.norm('white') === '#ffffff', '색 읽기(#rgb · rgb() · none · url · 이름)');
ok(H.adjust('#c9a24a', { sat: 0 }).slice(1, 3) === H.adjust('#c9a24a', { sat: 0 }).slice(3, 5), '채도 0 = 회색');
ok(H.adjust('#1d2b45', { light: 100 }) === '#ffffff' && H.adjust('#1d2b45', { light: -100 }) === '#000000' && H.adjust('#1d2b45', {}) === '#1d2b45', '밝기 ±100 · 바꾸지 않으면 그대로');
ok(H.adjust('#ff0000', { hue: 120 }) === '#00ff00', '색조 120° 돌리기');
{ const g = H.glyph('translate(12.5 64) scale(0.046 -0.046)'); ok(g && g.x === 12.5 && g.y === 64 && g.s === 0.046 && !H.glyph('translate(1 2) scale(2 2)'), '윤곽선 글자 알아보기(translate·scale(s -s))'); }
{ const m = H.mergeMap({ a: { on: true, t: 5 }, b: { on: true, t: 9 } }, { a: { on: false, t: 7 }, c: { on: true, t: 1 }, b: { on: false, t: 3 } });
  ok(m.out.a.on === false && m.out.b.on === true && m.out.c.on === true && m.up.join() === 'b', '맞붙이기: 새 시각이 이김 · 없는 것은 더함 · 내 쪽이 새것만 올림'); }
ok(H.KEY.test('idea:i080') && H.KEY.test('q01@v3') && !H.KEY.test('a"b') && H.FILE.test('ideas/i080/h.svg') && !H.FILE.test('../x.svg') && !H.FILE.test('https://x/a.svg'), '열쇠·그림 경로 거름');
ok(H.SHAPES.length >= 20 && H.SHAPES.every((s) => s.id && s.n && s.d.length) && ['crown', 'bookopen', 'ribbon', 'star', 'queen'].every((id) => H.SHAPES.some((s) => s.id === id)), '바꿀 모양 모음(왕관·책·리본·별·체스 여왕 …)');
ok(H.FONTS.filter((f) => f.k === '한').length >= 15 && H.FONTS.filter((f) => f.k === '영').length >= 8, '무료 글꼴(한글 15+ · 영문 8+)');

console.log('⑤ 그림(jsdom)');
const { JSDOM } = require(process.env.JSDOM || 'jsdom');
const W = new JSDOM('').window;
const cnt = (s, re) => (s.match(re) || []).length;
{ const src = fs.readFileSync(path.join(BD, 'ideas/i080/h.svg'), 'utf8'); const Pp = H.prep(src, W);
  ok(Pp.lines.length >= 1 && Pp.lines.every((L) => L.n > 0 && L.U === 1000), 'i080: 윤곽선 글자 줄을 찾음(' + Pp.lines.length + '줄)');
  const r0 = H.render(Pp, H.blank()); const c0 = (s) => (s.match(/fill="#[0-9a-f]{6}"/gi) || []).map((x) => x.toLowerCase()).sort().join();
  const orig = H.render(Pp, H.blank(), { clean: true });
  ok(!/data-lp/.test(orig) && cnt(orig, /<path/g) === cnt(src, /<path/g), '아무것도 안 바꾸면: 모양 수 그대로 · 받기용은 표시 지움');
  ok(Pp.pal.includes('#1e2a3a') && /fill="#1e2a3a"/.test(r0), '아무것도 안 바꾸면 원래 색 그대로');
  const L0 = Pp.lines[0].id;
  const r1 = H.render(Pp, { g: {}, pal: {}, parts: { [L0]: { fill: '#ff0000' } }, adds: [] }); ok(/fill="#ff0000"/.test(r1) && c0(r1) !== c0(r0), '부분 색 바꾸기(글자 줄)');
  const r2 = H.render(Pp, { g: {}, pal: { '#1e2a3a': '#00aa00' }, parts: {}, adds: [] }); ok(/<path[^>]*\sfill="#00aa00"/.test(r2) && !/<path[^>]*\sfill="#1e2a3a"/.test(r2), '같은 색 한꺼번에 바꾸기');
  const r3 = H.render(Pp, { g: { sat: 0 }, pal: {}, parts: {}, adds: [] }); ok((r3.match(/<path[^>]*\sfill="#([0-9a-f]{6})"/gi) || []).map((x) => x.slice(-8)).every((x) => { const h = x.slice(1, 7); return h.slice(0, 2) === h.slice(2, 4) && h.slice(2, 4) === h.slice(4, 6); }), '전체 채도 0 = 모두 회색');
  const r4 = H.render(Pp, { g: {}, pal: {}, parts: { [L0]: { txt: '북스퀸<b>', font: 'Jua', fs: 120 } }, adds: [] });
  ok(/<text[^>]*font-family="'Jua'/.test(r4) && /북스퀸&lt;b&gt;/.test(r4) && cnt(r4, /data-lpl="/g) === 0 + cnt(r0, /data-lpl="/g) - Pp.lines[0].n, '글씨 바꾸기: 윤곽선 대신 고른 글꼴 글씨(가려 넣음)');
  const r5 = H.render(Pp, { g: {}, pal: {}, parts: { [L0]: { hide: true } }, adds: [] }); ok(cnt(r5, /<path/g) === cnt(r0, /<path/g) - Pp.lines[0].n, '숨기기');
  const r6 = H.render(Pp, { g: { pad: 10 }, pal: {}, parts: { [L0]: { s: 150, r: 20 } }, adds: [{ id: 'a1', type: 'shape', shape: 'crown', cx: 50, cy: 50, size: 30, col: '#c9a24a' }, { id: 'a2', type: 'text', txt: 'BOOKSQUEEN', cx: 50, cy: 80, size: 20 }] });
  ok(/data-lp="a1"/.test(r6) && /data-lp="a2"/.test(r6) && /BOOKSQUEEN/.test(r6) && /rotate\(20\)/.test(r6) && /viewBox="-29\.64 -10 355\.68 120"/.test(r6), '크기·돌리기 · 모양·글씨 더하기 · 여백');
  ok(fs.readFileSync(path.join(BD, 'ideas/i080/h.svg'), 'utf8') === src, '원본 파일 그대로');
  const u = H.usedFonts({ parts: { [L0]: { txt: '북스', font: 'Jua' } }, adds: [] }, Pp); ok(u.length === 1 && u[0].f.n === 'Jua' && u[0].t === '북스', '받기 때 SVG 안에 넣을 글꼴·글자'); }
{ const src = fs.readFileSync(path.join(BD, 'q01/v3.svg'), 'utf8'); const Pp = H.prep(src, W);
  ok(Pp.shapes.length > 3 && Pp.pal.includes('#c9a24a') && Pp.pal.includes('#1d2b45'), 'q01 v3: 모양 나눔 · 색 모음');
  const rect = Pp.shapes.find((s) => s.tag === 'rect'); Pp.bb[rect.id] = { x: 1, y: 1, w: 62, h: 62 };
  const r = H.render(Pp, { g: {}, pal: {}, parts: { [rect.id]: { rep: 'shield', round: 0 } }, adds: [] }); ok(/data-lp="p0"><g transform="translate\(1 1\) scale\(0\.62\)"><path d="M50 4 L90 18/.test(r), '모양 대체(네모 → 방패 · 같은 자리·크기)');
  const r2 = H.render(Pp, { g: {}, pal: {}, parts: { [rect.id]: { round: 100 } }, adds: [] }); ok(/rx="31"/.test(r2), '둥글기(네모 모서리)'); }
{ let thrown = false; try { H.prep('<svg', W); } catch (e) { thrown = true; } ok(thrown, '깨진 SVG는 읽지 않음(오류 안내)');
  const Pp = H.prep('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script><rect onclick="x()" width="5" height="5" fill="red"/></svg>', W); const r = H.render(Pp, H.blank());
  ok(!/<script|onclick/.test(r), '그림 속 스크립트·on… 속성은 떼어 냄'); }

console.log(bad ? '❌ ' + bad + '개 실패' : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
