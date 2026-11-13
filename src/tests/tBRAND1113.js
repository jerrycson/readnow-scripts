// tBRAND1113 — (11/13 shoplogo1) 👑 북스퀸 로고 시안(정범님 11/13 20:12 · 20:47 「6개 더 개선 · 옛 판은 버리지 않고 판을 붙여 비교 · 웹앱 프로젝트에 페이지 · 설명·일지」)
//   ① 파일: 시안마다 판(v1·v2…)별 밝은 바탕·어두운 바탕·정사각 아이콘 SVG · 바깥 글꼴·바깥 주소·<text>·스크립트 없음(글자는 윤곽선) · 옛 평평한 경로(qNN.svg)도 그대로 남음(v1과 같은 그림)
//   ② 목록: logos.json(판 목록·지금 판) = brand-core.js LIST · 일지 journal.json(시각 차례·종류) · 프로젝트 페이지·미리보기가 자료를 부름
//   ③ 셈: BQB.parse/of('q01' · 'q01@v2' · 모르는 값 → '') · src(판 폴더) · uiOf(범위) · headerHtml(가로형·아이콘만·아이콘+글자·헌책방 글) · options(판 고정 칸)
//   ④ 빌드: 숍 결과물(build-shop)이 brand/와 판 폴더를 담고 html은 뺌 · 관리 사이트(build.js)가 shop/brand를 담음
//   ⑤ 클라우드: /shop/cfg 공개 칸 brandLogo·brandUi(꼴만 거름)
//   ⑥ 웹앱 🧪 프로젝트 탭 › 👑 북스퀸 로고 카드(◆brand 덩어리) — 링크·설정 칸·미리 보기·저장 전 표시
// 실행: node src/tests/tBRAND1113.js
const fs = require('fs'); const path = require('path'); const os = require('os');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const BD = path.join(ROOT, 'shop/brand');
const B = require(path.join(BD, 'brand-core.js')); const J = JSON.parse(fs.readFileSync(path.join(BD, 'logos.json'), 'utf8')); const JN = JSON.parse(fs.readFileSync(path.join(BD, 'journal.json'), 'utf8'));
const clean = (s) => /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[\d. ]+"/.test(s) && !/<text|<script|@font-face|font-family|href=|url\(|on\w+=/i.test(s) && /<title>/.test(s) && s.length < 40000;

console.log('① 파일');
ok(B.IDS.length === 10 && new Set(B.IDS).size === 10, '시안 10개 · 번호 겹침 없음');
for (const x of J.logos) { const fl = x.versions.flatMap((V) => ['light', 'dark', 'icon'].map((k) => V.files[k]));
  const ex = fl.every((f) => fs.existsSync(path.join(BD, f))); const cl = ex && fl.every((f) => clean(fs.readFileSync(path.join(BD, f), 'utf8')));
  const sq = ex && x.versions.every((V) => /viewBox="0 0 512 512"/.test(fs.readFileSync(path.join(BD, V.files.icon), 'utf8')));
  const legacy = ['', '-dark', '-icon'].every((a) => fs.existsSync(path.join(BD, x.id + a + '.svg')) && fs.readFileSync(path.join(BD, x.id + a + '.svg'), 'utf8') === fs.readFileSync(path.join(BD, x.id + '/v1' + a + '.svg'), 'utf8'));
  ok(ex && cl && sq && legacy, `${x.id} ${x.name}: 판 ${x.versions.map((V) => V.v).join('·')} 파일 모두 · 윤곽선만 · 아이콘 정사각 · 옛 경로 ${x.id}.svg = v1 그대로`); }
{ const two = J.logos.filter((x) => x.versions.length > 1).map((x) => x.id).sort().join(' '); ok(two === 'q01 q02 q03 q04 q06 q10', '더 다듬은 시안 6개(q01·q02·q03·q04·q06·q10)만 v2 · 나머지 4개는 v1 그대로');
  ok(J.logos.filter((x) => x.versions.length > 1).every((x) => x.cur === 'v2' && x.versions[1].changes.length >= 2 && fs.readFileSync(path.join(BD, x.versions[0].files.light), 'utf8') !== fs.readFileSync(path.join(BD, x.versions[1].files.light), 'utf8')), 'v2 = 지금 판 · 바꾼 점 2줄 이상 · v1과 실제로 다른 그림'); }
console.log('② 목록·일지·페이지');
ok(JSON.stringify(J.logos.map((x) => [x.id, x.name, x.cur, Object.fromEntries(x.versions.map((V) => [V.v, V.ratio]))])) === JSON.stringify(B.LIST), 'logos.json = brand-core.js 목록(번호·이름·지금 판·판별 비율)');
ok(J.default === '' && J.logos.every((x) => x.idea && x.idea.length > 10 && x.versions[0].v === 'v1'), '기본 = 빈 값(지금 글자 로고) · 시안마다 의도 · 판은 v1부터');
{ const E = JN.entries; ok(E.length >= 8 && E.every((e, i) => /^\d{4}-\d\d-\d\d \d\d:\d\d$/.test(e.at) && ['지시', '작업', '결정', '판'].includes(e.kind) && e.t && (!i || E[i - 1].at <= e.at)), '일지: 시각 차례(옛것 위) · 종류 지시·작업·결정·판 · 글 있음');
  ok(E.filter((e) => e.kind === '결정').length >= 2 && E.some((e) => e.kind === '지시' && /20:47/.test(e.at)), '일지: 정범님 결정 기록 · 20:47 지시 원문'); }
{ const pg = fs.readFileSync(path.join(BD, 'project.html'), 'utf8'); ok(/get\('logos\.json'\)/.test(pg) && /get\('journal\.json'\)/.test(pg) && !/<script src=|https?:\/\/(?!booksqueen|readnow)/.test(pg.replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')) && /prefers-color-scheme: dark/.test(pg), '프로젝트 페이지: 자료 두 개를 읽어 그림 · 바깥 스크립트 없음 · 밤 화면');
  const pv = fs.readFileSync(path.join(BD, 'preview.html'), 'utf8'); ok(J.logos.every((x) => pv.includes('src="' + x.id + '.svg"')), '첫 미리보기(v1)는 그대로 남음'); }
console.log('③ 셈');
ok(B.of('Q03') === 'q03' && B.of(' q01@V1 ') === 'q01@v1' && B.of('q05@v2') === '' && B.of('q11') === '' && B.of(null) === '' && B.of('<x>') === '', 'of: 판까지 고르기 · 없는 판·모르는 값은 빈 값');
ok(B.info('q01').v === 'v2' && B.info('q01@v1').v === 'v1' && B.info('q05').v === 'v1' && B.info('q01@v1').pin === true, 'info: 판 안 고르면 지금 판 · 고르면 그 판 고정');
ok(B.src('q03', 'dark') === 'brand/q03/v2-dark.svg' && B.src('q03@v1', 'icon', 'https://booksqueen.com/brand/') === 'https://booksqueen.com/brand/q03/v1-icon.svg' && B.src('q05') === 'brand/q05/v1.svg' && B.src('zz', 'dark') === '', 'src: 판 폴더 주소 · 모르면 빈 글');
{ const u = B.uiOf({ mode: 'x', h: 999, hm: 1, fav: 0, tag: 1 }); ok(u.mode === 'full' && u.h === 56 && u.hm === 18 && u.fav === false && u.tag === true && JSON.stringify(B.uiOf(null)) === JSON.stringify(B.UI_DEF), 'uiOf: 모르는 꼴은 가로형 · 크기 범위(PC 20~56 · 휴대폰 18~44) · 빈 값은 기본'); }
{ const f = B.headerHtml('q01', {}, false); const i = B.headerHtml('q02@v1', { mode: 'icon', h: 40 }, false); const it = B.headerHtml('q10', { mode: 'iconText', tag: true, hm: 24 }, true);
  ok(/src="brand\/q01\/v2-dark\.svg"/.test(f) && /height="34"/.test(f) && /width="101"/.test(f) && /alt="북스퀸"/.test(f), 'headerHtml 가로형: 어두운 바탕 그림 · 높이 34 · 너비는 비율');
  ok(/q02\/v1-icon\.svg/.test(i) && /width="40" height="40"/.test(i) && /class="sr">북스퀸/.test(i) && /q10\/v2-icon\.svg/.test(it) && /height="24"/.test(it) && /logo-t">북스퀸/.test(it) && !/헌책방/.test(it) && /헌책방/.test(B.headerHtml('q10', { tag: true }, false)), 'headerHtml 아이콘만(읽는 이름 숨김 글)·아이콘+글자(휴대폰 높이) · 헌책방 글은 PC만');
  ok(B.headerHtml('', {}, false) === '' && B.headerHtml('"><script>', {}, false) === '' && /q04\/v2-dark/.test(B.headerImg('q04', 30)), '빈 값·이상한 값 = 그림 없음(지금 글자 로고) · 옛 이름 headerImg 그대로'); }
{ const o = B.options(); ok(o[0][0] === '' && o.length === 1 + 10 + 16 && o.some((x) => x[0] === 'q02@v1') && !o.some((x) => x[0] === 'q05@v2'), 'options: 지금 글자 로고 + 시안 10 + 판 고정 16'); }
ok(B.favicon('q06', {}) === 'brand/q06/v2-icon.svg' && B.favicon('q06', { fav: false }) === '', 'favicon: 켜면 그 판 아이콘 · 끄면 없음');
console.log('④ 빌드');
{ const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tbrand_')); require(path.join(ROOT, 'hosting/build-shop.js')).build(ROOT, out);
  ok(J.logos.every((x) => x.versions.every((V) => fs.existsSync(path.join(out, 'brand', V.files.dark)))) && fs.existsSync(path.join(out, 'brand/q01-dark.svg')) && fs.existsSync(path.join(out, 'brand/journal.json')) && fs.existsSync(path.join(out, 'brand/brand-core.js')) && !fs.existsSync(path.join(out, 'brand/preview.html')) && !fs.existsSync(path.join(out, 'brand/project.html')) && fs.existsSync(path.join(out, 'index.html')), '숍 결과물: 판 폴더·옛 경로·목록·일지·셈 담음 · html은 뺌');
  fs.rmSync(out, { recursive: true, force: true }); }
{ const K = require(path.join(ROOT, 'hosting/build.js')).KEEP; ok(K.some((x) => x[0] === 'shop/brand' && x[1]), '관리 사이트: shop/brand 폴더를 담음(readnow.kr/shop/brand/project.html)');
  ok(/'shop\/brand\/\*\*'/.test(fs.readFileSync(path.join(ROOT, '.github/workflows/deploy-hosting.yml'), 'utf8')), '관리 사이트 배포 길: shop/brand가 바뀌면 다시 올림'); }
console.log('⑤ 클라우드');
{ const SH = require(path.join(ROOT, 'cloud/shop.js')); const a = SH.pubCfg({ brandLogo: ' Q02@V1', brandUi: { mode: 'icon', h: 999, hm: 'x', fav: true, tag: 'y', evil: '<b>' } }, null, {}); const b = SH.pubCfg({ brandLogo: '<img onerror=1>' }, null, {});
  ok(a.brandLogo === 'q02@v1' && a.brandUi.mode === 'icon' && a.brandUi.h === 56 && a.brandUi.hm === null && a.brandUi.fav === true && a.brandUi.tag === null && !('evil' in a.brandUi) && b.brandLogo === '' && b.brandUi.mode === null, '/shop/cfg: brandLogo 꼴 거름 · brandUi 칸만·범위 · 이상한 값 버림'); }
console.log('⑥ 웹앱 로고 카드');
{ const A = fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8'); const i0 = A.indexOf('/* ◆brand 시작'); const i1 = A.indexOf('/* ◆brand 끝 */');
  ok(i0 > 0 && i1 > i0 && /show\('pj_logo'\) \? logo/.test(A) && /\['pj_logo', '👑 북스퀸 로고'/.test(A) && /sel: '#pj_logo'/.test(A), '프로젝트 탭: 👑 카드 · 휴대폰 카드 고르기 칸 · 기능 찾기 줄');
  const S = { _bqbBase: '../shop/brand/', _bqbCfg: { brandLogo: 'q03@v1', brandUi: { mode: 'full' }, at: '2026-11-13T12:00:00Z', by: 'a@b' }, _bqbMeta: { L: J, J: JN }, tab: 'x' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const kTime = (s) => String(s).slice(5, 16);
  const win = { BQB: B }; const F = new Function('S', 'esc', 'kTime', 'window', 'db', 'toast', 'renderMain', 'y24Arm', 'errKo', 'document', A.slice(i0, i1) + '\nreturn { pjLogoHtml, bqBrandLib };');
  const P = F(S, esc, kTime, win, null, () => {}, () => {}, () => true, (e) => e.message, {});
  const h = P.pjLogoHtml(); ok(/href="\.\.\/shop\/brand\/project\.html"/.test(h) && /\?only=changed/.test(h) && /시안 10개 · 판 16개/.test(h) && /value="q03@v1" selected/.test(h) && /q03\/v1-dark\.svg/.test(h) && /<button class="btn sm" id="pjl_save" disabled>/.test(h), '카드: 프로젝트 페이지 링크 · 시안·판 수 · 저장된 값(q03 v1 고정) 골라짐 · 미리 보기 · 바꾸기 전 저장 단추 꺼짐');
  S._bqbEd = { logo: 'q10', ui: B.uiOf({ mode: 'iconText', h: 40 }) }; const h2 = P.pjLogoHtml(); ok(/value="q10" selected/.test(h2) && /q10\/v2-icon\.svg/.test(h2) && /logo-t">북스퀸/.test(h2) && /아직 저장 전/.test(h2) && /id="pjl_save">저장/.test(h2) && /value="40"/.test(h2), '카드: 바꾼 값 미리 보기(아이콘+글자 · PC 40) · 저장 전 표시 · 저장 단추 켜짐');
  S._bqbEd = null; S._bqbCfg = { brandLogo: '', brandUi: {} }; ok(/♛<\/span>북스퀸/.test(P.pjLogoHtml()) && /아직 저장한 적 없음/.test(P.pjLogoHtml()), '카드: 빈 값 = 지금 글자 로고 미리 보기'); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
