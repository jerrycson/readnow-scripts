/* tAISUM1114 — ✍ 상품 요약·추천글 엔진(cloud/aisum.js · aisum1 11/14 · 연구 N14): 낱말 뽑기 · 판본 요인 · 엔진 글 · 채점 · 단계 · 고르기(사람 글은 안 덮음) · 받기 검사 · 배우기 · 클라우드/숍/웹앱 이음
 * 돌리기: node src/tests/tAISUM1114.js (node만 · 인터넷 없음 · 견본 책은 지어낸 것) */
'use strict';
const path = require('path'); const fs = require('fs'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const A = require(path.join(REPO, 'cloud/aisum.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ❌ ' + m); } };
const src = { isbn: '9788900000001', b: { title: '달빛 정원의 비밀', authors: '김작가', translators: '이번역', publisher: '견본출판' }, t: {
  intro: '오래된 정원에서 발견된 편지 한 통. 소녀 하린은 할머니의 정원에 숨겨진 비밀을 쫓는다. 달빛이 비치는 밤마다 정원의 꽃들은 기억을 속삭이고, 하린은 잊힌 가족사와 마주한다. 전쟁과 이별, 그리고 사랑의 기억이 편지 속에 겹쳐 있다.',
  pubrev: '양장 제본에 컬러 일러스트를 담은 특별판. 정원과 기억, 가족과 편지를 둘러싼 성장 이야기. 할머니와 손녀가 함께 걷는 정원의 사계절.', toc: '1장 편지\n2장 정원\n3장 달빛\n4장 할머니의 노트\n5장 사계절', trans: '이번역 서울대 교수로 영문학을 가르친다.' } };

console.log('① 글자 도구');
ok(A.josa('정원', '과/와') === '정원과' && A.josa('하루', '과/와') === '하루와', '받침에 맞는 조사');
ok(A.stem('정원에서') === '정원' && A.stem('숨겨진') === '' && A.stem('그리고') === '' && A.stem('아이') === '아이', `조사·꾸밈말 떼기: ${A.stem('정원에서')}/${A.stem('숨겨진')}`);

console.log('② 엔진 글(무료 길)');
const g = A.engWrite(src, {}); ok(g.ok && g.kw.length === 10 && new Set(g.kw).size === 10, `키워드 10개: ${g.kw.join(',')}`);
ok(!g.kw.includes('김작가') && !g.kw.includes('견본출판'), '저자·출판사 이름은 키워드에서 뺌');
ok(g.lead.every((k) => g.t1.includes(k)) && g.kw.every((k) => g.t2.includes(k)), '한 줄엔 대표 2 · 한 문장엔 10개 모두');
ok(g.t3 && /특별판|양장/.test(g.t3) && g.ext.includes('전문 번역'), `판본 글: ${g.t3}`);
const r = A.rubric(g, src); ok(r.v >= 0.9 && r.copy <= 25, `구조 점수 ${r.v} · 같은 글 ${r.copy}자`);
const plain = { ...src, t: { intro: src.t.intro, toc: src.t.toc } }; const g2 = A.engWrite(plain, {}); ok(g2.ok && g2.t3 === null, '홍보할 값이 낮으면 판본 글을 안 씀');
ok(!A.engWrite({ isbn: '9788900000002', b: { title: '짧음' }, t: { intro: '짧은 글' } }, {}).ok, '재료가 짧으면 쓰지 않음(실패 까닭)');

console.log('③ 채점 — 옮김·스포일·빠진 키워드');
const copy = { ...g, t2: src.t.intro.slice(0, 80) }; ok(A.rubric(copy, src).copy > 25 && A.rubric(copy, src).v < r.v, '출판사 글을 길게 옮기면 떨어뜨림');
ok(A.rubric({ ...g, t1: `${g.lead[0]} ${g.lead[1]} 결말에서 범인은 할머니` }, src).why.some((w) => /결말/.test(w)), '스포일 낱말 잡음');
ok(A.kwAgree(['a', 'b', 'c'], ['a', 'b', 'd']) === 0.667, '키워드 겹침 몫');

console.log('④ 보여 줄 글 고르기 — 사람 글은 언제나 먼저');
const doc = { isbn: '9788900000001', claude: { t1: 'c1', t2: 'c2' }, engine: { t1: 'e1', t2: 'e2' }, human: { t1: 'h1', t2: 'h2' } };
ok(A.pick(doc, 4).by === 'human', '사람 > 모두'); ok(A.pick({ ...doc, human: null }, 4).by === 'claude', 'Claude > 엔진(단계 4라도)');
ok(A.pick({ isbn: doc.isbn, engine: doc.engine }, 1) === null && A.pick({ isbn: doc.isbn, engine: doc.engine }, 4).by === 'engine', '엔진 글은 단계 4에서만 모두에 · 그림자는 안 보임');
const n3 = Array.from({ length: 2000 }, (_, i) => A.pick({ isbn: String(9788900000000 + i), engine: doc.engine }, 3)).filter(Boolean).length; ok(n3 > 40 && n3 < 180, `단계 3은 약 5%만(2,000 중 ${n3})`);
ok(A.textOf({ t1: 'a', t2: 'b', t3: 'c' }) === 'a\n\nb\n\nc' && A.textOf({ t1: 'a', t2: 'b' }) === 'a\n\nb', '꼴: 한 줄 · 빈 줄 · 한 문장 · 빈 줄 · 판본');

console.log('⑤ Claude 글 받기 검사');
ok(A.checkIn({ isbn: src.isbn, ...g }).bad.length === 0, '맞는 글은 통과'); ok(A.checkIn({ isbn: src.isbn, ...g, kw: g.kw.slice(0, 9) }).bad.length > 0, '키워드 9개는 막음');
ok(A.checkIn({ isbn: src.isbn, ...g, t2: '짧은 문장' }).bad.some((b) => /t2 빠짐/.test(b)), '한 문장에 키워드 빠지면 막음');

console.log('⑥ 단계 — 올림·내림 규칙');
const good = { n: 40, wt: 0.4, rub: 0.95, kw: 0.5 }; let st = { stage: 1 }; for (let i = 0; i < 2; i++) st = A.stageStep(st, good); ok(st.stage === 1, '2일은 그대로'); st = A.stageStep(st, good); ok(st.stage === 2 && st.ch && st.ch.to === 2, '3일 이어 넘으면 2단계');
let s2 = st; for (let i = 0; i < 3; i++) s2 = A.stageStep(s2, { n: 40, wt: 0.1, rub: 0.95, kw: 0.5 }); ok(s2.stage === 1, '3일 이어 못 넘으면 한 단계 내림');
ok(A.stageStep({ stage: 1 }, { n: 0, wt: 0, rub: 1, kw: 1 }).stage === 1, '견줌 0이면 못 올림');

console.log('⑦ 배우기 — Claude가 고른 낱말이 앞으로');
const M = A.learn({}, [{ src, kw: ['사계절', '노트', '하린', '편지', '정원', '달빛', '기억', '가족사', '할머니', '비밀'] }], [{ tpl: { t1: 1, t2: 0 }, win: 1 }], [src]);
ok(M.pick['사계절'] && M.pick['사계절'][0] === 1 && M.tpl.t1[1][0] === 1 && M.N === 1, '고른 몫·틀 이긴 몫·문서 수');
const g3 = A.engWrite(src, M); ok(g3.kw.includes('사계절') && g3.kw.includes('노트'), `배운 뒤 키워드: ${g3.kw.join(',')}`);

console.log('⑧ 이음 — 클라우드·우리숍·웹앱');
const IX = fs.readFileSync(path.join(REPO, 'cloud/index.js'), 'utf8'); ok(/require\('\.\/aisum\.js'\)\.makeAiSum/.test(IX) && /J0\.aisum \? await AISUM\.put/.test(IX) && /AISUM\.judge/.test(IX) && /if \(q\.aisum\)/.test(IX) && /AISUM\.daily\(\)/.test(IX), '클라우드: 받기·견줌·진단·매일 회차');
const SH = fs.readFileSync(path.join(REPO, 'cloud/shop.js'), 'utf8'); ok(/aiSumOf\(it\.isbn\)/.test(SH) && /\.\.\.\(ai \? \{ ai \} : \{\}\)/.test(SH), '숍 서버: /shop/item에 ai');
const SJ = fs.readFileSync(path.join(REPO, 'shop/shop.js'), 'utf8'); ok(/\$\{aiSumH\(r\.ai\)\}\$\{bkInfoH/.test(SJ), '우리숍 화면: 책 정보 위 「이 책 한눈에」');
const W = fs.readFileSync(path.join(REPO, 'src/app.html'), 'utf8'); ok(/SEC\('요약·추천글', \(\) => aisCardHtml\(l, b\)\)/.test(W) && /function openAiSum\(\)/.test(W) && /aisum: \['✍ 요약·추천글 엔진'/.test(W) && /N14: \['✍ 상품 요약·추천글 엔진', 'aisum'\]/.test(W), '웹앱: 상품 상세 카드·연구 페이지·연구 목록');
ok(/human: \{ \.\.\.g, at:/.test(W) && !/human:/.test(A.makeAiSum.toString().replace(/v\.human|d0\.human|ex\.human|d\.human|doc\.human|other|human\.at|'human\.at'/g, '')), '사람 글은 웹앱만 씀 · 클라우드 쓰기에는 human 칸이 없음');
ok(!/\b(alert|confirm|prompt)\(/.test(W.slice(W.indexOf('/* ══ (aisum1'), W.indexOf('function openFound()'))), '브라우저 팝업 없음');
const RJ = JSON.parse(fs.readFileSync(path.join(REPO, 'facts-docs/research.json'), 'utf8')); ok(RJ.studies.some((x) => x.id === 'N14' && x.open === 'aisum'), '공개 연구 목록에 N14');
console.log(`\n${fail ? '❌' : '✓'} tAISUM1114 ${pass}개 통과 · ${fail}개 실패`); process.exit(fail ? 1 : 0);
