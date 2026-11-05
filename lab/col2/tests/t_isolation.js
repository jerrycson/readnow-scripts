/* t_isolation — 운영과 떨어져 있는지 글자로 검사(실행 없이)
 *  · BOOK_FIXED가 운영 수집기 원본과 같은가(운영이 바뀌면 여기서 알림) · 운영 포트·운영 크롬 프로필 이름을 쓰지 않음 · 운영 도우미 모듈을 불러오지 않음
 *  · Firestore 쓰기는 막이(Col2Store)를 거쳐 col2_* 칸만 · 기기 저장은 rn3- 만 · 브라우저 팝업 없음 · 휴대전화 번호 없음 · 이 폴더는 따로 된 git
 * 실행: node tests/t_isolation.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path');
const COL2 = require('../col2-config.js'); const R = L.ROOT;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === '.git' || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(R); const rel = (f) => path.relative(R, f); const code = files.filter((f) => /\.(js|html)$/.test(f) && !/^tests\//.test(rel(f))); const rd = (f) => fs.readFileSync(f, 'utf8');

console.log('① 운영과 같은 기준');
const src = path.join(L.PROD_REPO, 'src', 'readnow-collector.src.js');
if (fs.existsSync(src)) { const m = rd(src).match(/const BOOK_FIXED = (\[[^\]]+\]);/); const prod = m ? JSON.parse(m[1].replace(/'/g, '"')) : null; ok(prod && JSON.stringify(prod) === JSON.stringify(COL2.BOOK_FIXED), 'BOOK_FIXED = 운영 수집기 원본과 같음', prod ? prod.length + '칸' : '못 찾음'); }
else ok(false, '운영 수집기 원본을 못 찾음(COL2_PROD_REPO)');
for (const f of COL2.CORE_FILES) ok(fs.existsSync(path.join(L.PROD_REPO, f)) && /parseProductPage|decode/.test(rd(path.join(L.PROD_REPO, f))), `운영 공용 파일 ${f} 있음(그대로 받아 씀)`);

console.log('② 운영과 겹치지 않음');
ok(!COL2.PROD_PORTS.includes(COL2.PORT) && COL2.PORT !== L.PORT, `번외 도우미 포트 ${COL2.PORT} ≠ 운영 ${COL2.PROD_PORTS.join('·')} · 시험 포트 ${L.PORT}와도 다름`);
const runCode = code.filter((f) => rel(f) !== 'col2-config.js');
ok(runCode.every((f) => !/(127\.0\.0\.1|localhost):88(98|99)\b/.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, ''))), '실행 코드에 운영 도우미 주소(127.0.0.1:8898·8899)를 부르는 곳 없음');
ok(runCode.every((f) => !/chrome-(workwin|render|pub)\b|alps[\\/]+chrome/.test(rd(f))), '운영 크롬 프로필 이름(chrome-workwin·chrome-render·chrome-pub·alps\\chrome)을 쓰지 않음');
ok(runCode.every((f) => !/require\([^)]*readnow-(work|print|local|alps)/.test(rd(f))), '운영 도우미 모듈을 불러오지 않음(완전히 따로)');
ok(runCode.every((f) => !/리드나우 작업 창/.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, ''))), "운영 작업 창 표시('리드나우 작업 창')로 창을 찾지 않음");
ok(runCode.every((f) => !/GM_|unsafeWindow|Tampermonkey\.|@grant/.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))), 'Tampermonkey(GM_*)를 쓰지 않음 — 운영 수집기 저장소·탭 알림과 안 섞임');
ok(runCode.every((f) => !/\/scm\/|wlogin|rn-cred|rnp-cred/.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, ''))), '판매자 센터(scm)·로그인·알라딘 계정을 다루는 코드 없음');

console.log('③ 쓰기·저장·팝업');
const shadow = code.filter((f) => /^shadow\//.test(rel(f)));
const writes = shadow.flatMap((f) => [...rd(f).matchAll(/\bS\.(set|add)\(\s*'([^']+)'/g)].map((m) => m[2]));
ok(writes.length >= 2 && writes.every((c) => c.startsWith('col2_')), 'Firestore 쓰기는 col2_* 칸만', [...new Set(writes)].join(','));
ok(shadow.filter((f) => rel(f) !== 'shadow/col2-store.js').every((f) => !/\.collection\(|\.doc\(/.test(rd(f))), 'Firestore는 막이(col2-store.js)로만 — 화면 코드가 직접 칸을 열지 않음');
ok(code.filter((f) => rel(f) !== 'shadow/col2-store.js').every((f) => !/localStorage|sessionStorage/.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, ''))), '기기 저장은 col2-store.js(rn3-)로만');
ok(code.every((f) => !/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(rd(f).replace(/\/\*[\s\S]*?\*\//g, ''))), '브라우저 팝업(alert·confirm·prompt) 없음');
ok(files.filter((f) => /\.(js|html|md|json)$/.test(f)).every((f) => !/01[016789]-?\d{3,4}-?\d{4}/.test(rd(f).replace(/010-0000-0000/g, ''))), '휴대전화 번호 없음');

console.log('④ 따로 된 폴더');
ok(fs.existsSync(path.join(R, '.git')) && !path.resolve(R).startsWith(path.resolve(L.PROD_REPO) + path.sep), '이 폴더는 따로 된 git(운영 저장소 밖)');
const pl = JSON.parse(rd(path.join(R, 'PLAN.json'))); ok(pl.kind === 'readnow-col2-plan' && Array.isArray(pl.stages) && pl.stages.every((s) => s.n != null && s.name && s.state), 'PLAN.json 모양(단계·상태)');
ok(/이름표\s*\*\*col2\*\*/.test(rd(path.join(R, 'CLAUDE.md'))) && /col2_\*/.test(rd(path.join(R, 'CLAUDE.md'))) && /rn3-/.test(rd(path.join(R, 'CLAUDE.md'))), 'CLAUDE.md 규칙(이름표 col2 · col2_* · rn3-)');
L.done('t_isolation');
