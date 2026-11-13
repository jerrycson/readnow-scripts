// tIDEAS1113 — (11/13 logo100) 💡 북스퀸 로고 아이디어 100(정범님 11/13 23:30 「서로 엄격히 다른 스타일의 새로운 로고 100개 브레인스토밍」)
//   ① 목록: ideas.json 100개 · 번호 1~100 · 이름·의도 겹침 없음 · 축 다섯(시대·매체·형태·문화·상징) · 추천 10은 목록 안 + 까닭·점수
//   ② 그림: 아이디어마다 h.svg · h-dark.svg · icon.svg(정사각 100) · 바깥 글꼴·바깥 주소·<text>·스크립트 없음(글자는 윤곽선) · 서로 같은 그림 없음
//   ③ 빌드: 손님 숍 결과물(build-shop)에는 ideas/·ideas.html이 없음 · 관리 사이트(build.js)는 shop/brand를 통째로 담음
//   ④ 페이지: ideas.html이 ideas/ideas.json을 읽음 · project.html에 링크 한 줄 · 일지 journal.json에 덧붙인 줄(지우지 않음)
// 실행: node src/tests/tIDEAS1113.js
const fs = require('fs'); const path = require('path'); const os = require('os'); const crypto = require('crypto');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BD = path.join(ROOT, 'shop/brand'); const ID = path.join(BD, 'ideas');
const M = JSON.parse(fs.readFileSync(path.join(ID, 'ideas.json'), 'utf8'));
const clean = (s) => /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[\d. ]+"/.test(s) && !/<text|<script|<image|@font-face|font-family|href=|url\((?!#)|on\w+=|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(s) && /<title>[^<]+<\/title>/.test(s) && s.length < 160000;

console.log('① 목록');
const L = M.ideas || [];
ok(L.length === 100 && L.every((x, i) => x.no === i + 1 && x.id === 'i' + String(i + 1).padStart(3, '0')), '아이디어 100개 · 번호 1~100 차례');
ok(new Set(L.map((x) => x.name)).size === 100 && new Set(L.map((x) => x.intent)).size === 100, '이름·의도 겹침 없음');
const AX = ['시대', '매체', '형태', '문화', '상징'];
ok(L.every((x) => AX.every((k) => typeof x.axes[k] === 'string' && x.axes[k].length > 0)), '아이디어마다 축 다섯이 모두 적힘');
ok(new Set(L.map((x) => AX.map((k) => x.axes[k]).join('|'))).size === 100, '축 다섯의 짝이 서로 다름');
ok(Array.isArray(M.top10) && M.top10.length === 10 && M.top10.every((id) => L.some((x) => x.id === id)) && M.top10.every((id) => M.top10_why[id] && M.top10_why[id].why && M.top10_why[id].sum > 0), '리드 추천 10 — 목록 안 · 까닭과 점수');
ok(L.every((x) => !/^q\d{2}$/.test(x.id)), '시안 번호(qNN)와 섞이지 않음');

console.log('② 그림');
const files = L.flatMap((x) => ['h', 'dark', 'icon'].map((k) => path.join(ID, x.files[k])));
const ex = files.every((f) => fs.existsSync(f)); ok(ex, '그림 300개(가로형 밝은·어두운 + 아이콘) 모두 있음');
if (ex) {
  const bads = files.filter((f) => !clean(fs.readFileSync(f, 'utf8')));
  ok(!bads.length, '바깥 글꼴·바깥 주소·<text>·스크립트 없음 · 제목 있음' + (bads.length ? ' — ' + bads.slice(0, 3).map((f) => path.relative(ID, f)).join(' ') : ''));
  ok(L.every((x) => /viewBox="0 0 100 100"/.test(fs.readFileSync(path.join(ID, x.files.icon), 'utf8'))), '아이콘은 정사각(100×100)');
  ok(L.every((x) => x.ratio > 1.2 && x.ratio < 4.5), '가로형 비율 1.2~4.5(머리띠에 넣을 수 있는 폭 · 단청은 띠를 위에 얹은 쌓은 꼴)');
  const hs = L.map((x) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ID, x.files.h))).digest('hex'));
  const is = L.map((x) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ID, x.files.icon))).digest('hex'));
  ok(new Set(hs).size === 100 && new Set(is).size === 100, '가로형·아이콘 모두 서로 다른 그림');
  const tot = files.reduce((a, f) => a + fs.statSync(f).size, 0); ok(tot < 6e6, '그림 합계 ' + Math.round(tot / 1024) + 'KB(6MB 미만)');
}

console.log('③ 빌드');
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tideas_')); require(path.join(ROOT, 'hosting/build-shop.js')).build(ROOT, out);
  ok(fs.existsSync(path.join(out, 'brand/logos.json')) && !fs.existsSync(path.join(out, 'brand/ideas')) && !fs.existsSync(path.join(out, 'brand/ideas.html')), '손님 숍 결과물: brand/는 담되 ideas/·ideas.html은 뺌');
  fs.rmSync(out, { recursive: true, force: true }); }
{ const K = require(path.join(ROOT, 'hosting/build.js')).KEEP; ok(K.some((x) => x[0] === 'shop/brand' && x[1]), '관리 사이트: shop/brand 폴더째(readnow.kr/shop/brand/ideas.html)'); }

console.log('④ 페이지·일지');
const H = fs.readFileSync(path.join(BD, 'ideas.html'), 'utf8');
ok(/fetch\(D \+ 'ideas\.json'/.test(H) && /const D = base \+ 'ideas\/'/.test(H) && /h-dark\.svg/.test(H) && /icon\.svg/.test(H) && !/\balert\(|\bconfirm\(|\bprompt\(/.test(H), 'ideas.html: 목록을 읽어 그림 · 팝업 없음');
ok(/okId/.test(H) && /esc\(it\.name\)/.test(H), 'ideas.html: 번호 꼴 거름 · 글은 가려 넣음');
const P = fs.readFileSync(path.join(BD, 'project.html'), 'utf8');
ok((P.match(/href="ideas\.html"/g) || []).length === 1, 'project.html: 💡 아이디어 100 링크 한 줄');
const JN = JSON.parse(fs.readFileSync(path.join(BD, 'journal.json'), 'utf8')).entries;
ok(JN[0].at === '2026-11-13 20:12' && JN.some((x) => x.who === 'logo100') && JN.some((x) => x.kind === '지시' && /100개/.test(x.t)), '일지: 처음 줄 그대로 · 지시·작업 줄 덧붙임');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
