// tEDKW2_1117 — (판본 대조 판 ② · 정범님 I-1117-1952-22 · I-1117-1400-12.2 · edkw2) 괄호 갈래 나누기 · 후보 문턱 세 단계 · 사람 확인 상품 시장 지표 숨김 · 거꾸로 검사(값 틈 경보) · 상품 코드 · 권·구성 · 사람이 고른 판
// 쓰는 법: node tEDKW2_1117.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const load = (f) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl }, { filename: f }); return m.exports; };
const P = load('readnow-products-core.js');
const APP = rd(fs.existsSync(path.join(R, 'src/app.html')) ? 'src/app.html' : 'app/index.html');

console.log('① 괄호 갈래 — 판본 낱말 / 판본과 상관없는 괄호');
for (const t of ['어떤 책 (양장)', '어떤 책 (개정판)', '어떤 책 양장본', '어떤 책 (Special Edition)']) { const s = P.edSuspect(t); ok(s.on && s.tier === 1 && s.kw.length > 0, `${t} → 판본 의심(바로 검색 · 낱말 ${s.kw.join('·')})`); }
for (const [t, k] of [['어떤 책 (1)', 'vol'], ['영화 (2disc)', 'disc'], ['어떤 책 (1~5권)', 'range'], ['어떤 책 (2020)', 'year']]) { const s = P.edSuspect(t); ok(!s.on && s.brx.some((x) => x.k === k), `${t} → 판본 의심 아님 · 권·구성 괄호(${k})로만`); }
{ const s = P.edSuspect('어떤 책 (나의 부제)'); ok(s.on && s.tier === 2 && !s.kw.length, '판본 낱말 없는 부제 괄호 → 2단계(한가할 때 · 값은 판 ① 그대로)'); }
ok(Array.isArray(P.ED_ALL) && P.ED_ALL.length > P.ED_KW.length && ['양장', '개정판', '감독판', '사인본'].every((w) => P.ED_ALL.includes(w)), `낱말 표 ${P.ED_ALL.length}개(정범님 16개 + 판 ② 더함)`);
ok(P.ED_KW.length === 16, '⑮ 정범님 16개 목록(ED_KW)은 그대로');

console.log('② 권·구성 대조 — 끝 괄호를 떼어 같은 권으로 보던 구멍');
ok(P.sameVolume('어떤 책 (1)', '어떤 책 (2)') === false, '(1) ↔ (2) 다른 상품');
ok(P.sameVolume('영화 (1disc)', '영화 (2disc)') === false, '1disc ↔ 2disc 다른 상품');
ok(P.sameVolume('어떤 책 (1)', '어떤 책 1') === true, '(1) ↔ 1 같은 권');

console.log('③ 표지 그림 주소 속 상품 코드');
ok(P.edCodeOf('https://image.aladin.co.kr/product/123/45/cover/K012345678_1.jpg') === 'K012345678', 'K코드 읽음');
ok(P.edCodeOf('https://image.aladin.co.kr/product/1/2/cover/8937460440_1.jpg') === '8937460440', '10자리 ISBN 읽음');
ok(P.edOurCode({ isbn13: '9788937460449' }) === '8937460440', '우리 978 ISBN → 10자리로 맞춤');
{ const our = { title: '어떤 책 (리커버 한정판)', bookId: 'bk_1', bookTitle: '어떤 책', code: 'K012345678' };
  const d = P.edDecide(our, { src: 'usedSearch', cands: [{ itemId: '7', title: '어떤 책 (한정판)', cov: 0.95, img: 'https://x/cover/K012345678_1.jpg' }, { itemId: '8', title: '어떤 책 (리커버 한정판)', cov: 0.95 }] });
  ok(d.use === 'srch' && d.pick && d.pick.itemId === '7' && d.pick.codeHit, '코드가 같은 후보 → 낱말이 조금 달라도 그 판(읽는 수 0)'); }

console.log('④ 거꾸로 검사 — 값 틈 경보');
{ const base = { title: '어떤 책 (리커버 한정판)', bookId: 'bk_1', bookTitle: '어떤 책 (리커버 한정판)', price: 30000 };
  const d1 = P.edDecide({ ...base, autoN: 45, autoLow: 9000 }, null); ok(d1.use === 'check' && d1.hold && d1.gap && d1.gap.n === 45, '중고 45부 · 최저 9,000원 < 우리 30,000원의 절반 → 사람 확인(보통판 지표 의심)');
  const d2 = P.edDecide({ ...base, autoN: 12, autoLow: 9000 }, null); ok(d2.use === 'auto' && !d2.gap, '중고 12부(30부 이하) → 경보 없음');
  const d3 = P.edDecide({ ...base, autoN: 45, autoLow: 20000 }, null); ok(d3.use === 'auto' && !d3.gap, '최저가가 절반 위 → 경보 없음'); }

console.log('⑤ 후보 문턱 세 단계(⚙ ⑮) — 막는 규칙 통과 + 이름 겹침');
{ const doc = { cands: [{ itemId: '1', title: '어떤 책 (리커버 한정판)', cov: 0.92 }, { itemId: '2', title: '어떤 책 리커버 한정판 새 표지 이야기', cov: 0.66 }, { itemId: '3', title: '어떤 책과 다른 이야기 (리커버 한정판)', cov: 0.5 }, { itemId: '4', title: '어떤 책 (스페셜 에디션)', cov: 0.9 }, { itemId: '5', title: '어떤 책 (리커버 한정판) 세트', cov: 0.95 }, { itemId: '6', title: '어떤 책 (리커버 한정판) 2', cov: 0.95, vol: false }] };
  const our = { title: '어떤 책 (리커버 한정판)' }; const ids = (o) => P.edCands(our, doc, o).map((c) => c.itemId).join(',');
  ok(ids({ minCov: 0.75 }) === '1', '보수적으로 0.75 → 1개');
  ok(ids({ minCov: 0.6 }).split(',').sort().join(',') === '1,2', '보통 0.60(기본) → 2개');
  ok(ids({ minCov: 0.45 }).split(',').sort().join(',') === '1,2,3', '느슨하게 0.45 → 3개(낱말 다른 특별판은 아직 뺌)');
  ok(ids({ minCov: 0.45, loose: true }).split(',').includes('4'), '「낱말이 다른 특별판도 후보로」 켜면 스페셜 에디션도');
  ok(!ids({ minCov: 0.3, loose: true }).split(',').some((x) => x === '5' || x === '6'), '세트↔낱권·권 다름은 문턱과 상관없이 뺌');
  ok(P.edCands(our, doc, { minCov: 0.6 })[0].itemId === '1', '점수 높은 순'); }

console.log('⑥ 사람이 고른 판');
{ const our = { title: '어떤 책 (리커버 한정판)', bookId: 'bk_9' }; const doc = { src: 'usedSearch', cands: [{ itemId: '1', title: '어떤 책 (리커버 한정판)', cov: 0.95 }, { itemId: '2', title: '어떤 책 (리커버 한정판)', cov: 0.95 }] };
  ok(P.edDecide(our, doc).use === 'check', '1·2위 같음 → 기계는 사람 확인');
  const d = P.edDecide(our, doc, { pick: { itemId: '2' } }); ok(d.use === 'srch' && d.human && d.ids.join() === '2', '「이 판으로 정함」(2) → 그 후보 시장');
  const d2 = P.edDecide(our, doc, { pick: { none: true } }); ok(d2.use === 'check' && d2.hold && d2.human, '「다 아님」 → 계속 사람 확인 · 가격 안 바꿈');
  const d3 = P.edDecide(our, doc, { pick: { itemId: '999' } }); ok(d3.use === 'check' && !d3.human, '고른 후보가 검색에서 사라지면 다시 기계 판단'); }

console.log('⑦ 웹앱 — 사람 확인 상품은 시장 지표 숨김(값은 그대로)');
{ const a = APP.indexOf('const _edC = new WeakMap()'); const bL = APP.indexOf('function edHideHtml(l, inner)'); const b = APP.indexOf('\n', bL);
  ok(a > 0 && bL > a, '판본 도우미 묶음 찾음');
  const nbm = new Map(); const S = { app: {}, nbm };
  const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ctx = { S, esc, isMedia: () => false, PRDF: () => P, console, Math, String, Array, Object, Set, Map, WeakMap, JSON, Number };
  vm.runInNewContext(APP.slice(a, b) + '\n;this.X = { edOf, edRec, edUse, edHide, edPickOf, edCandCfg, edHideHtml, edNoteOf, ED_TH3 };', ctx);
  const X = ctx.X; const l = { id: 'aladin_1', title: '어떤 책 (리커버 한정판)', price: 30000 };
  nbm.set('aladin_1', { ed: { use: 'check', hold: false, why: '1·2위 닮음 차이가 5점 안', pick: { itemId: '1', t: '어떤 책 (리커버 한정판)', sim: 0.98 }, alt: { itemId: '2', t: '어떤 책 (리커버 한정판)', sim: 0.97 }, book: { t: '어떤 책', ok: false, miss: ['리커버', '한정'], extra: [] } } });
  ok(X.edHide(l) === true, 'hold 없는 사람 확인도 숨김');
  const h = X.edHideHtml(l, '<b>중고 12 · 최저 9,000원</b>');
  ok(/<details class="edhd"/.test(h) && !/<details[^>]*open/.test(h), '접힌 「자세히」(기본 닫힘)');
  ok(h.includes('🔖 판본이 불확실해 시장 값을 숨김 · 판매가 그대로') && !/확인 중|알아보는 중/.test(h), '한 줄 「판본이 불확실해 시장 값을 숨김 · 판매가 그대로」(확답형 · 「확인 중」 없음)');
  ok(h.includes('리커버·한정') && h.includes('자동 지표 상품: 어떤 책') && h.includes('1위') && h.includes('2위') && h.includes('닮음 98%'), '자세히 = 우리 낱말·자동 지표 상품·후보 1·2위와 닮음');
  ok(h.includes('5점 안'), '왜 못 골랐는지(1·2위 차이)');
  ok(h.includes('참고 — 이 판의 값이 아닐 수 있음') && h.indexOf('중고 12') > h.indexOf('<details'), '지표 값은 지우지 않고 자세히 안에 「참고」로만');
  ok(h.includes('data-edlist'), '판본 확인 목록 단추');
  nbm.get('aladin_1').edPick = { itemId: '2', t: 'x', by: 'a', at: '2026-11-17T20:00:00Z' }; ok(X.edUse(l) === 'srch' && !X.edHide(l), '사람이 고르면 바로 검색 시장 · 숨김 풀림');
  nbm.get('aladin_1').edPick = { none: true }; ok(X.edHide(l), '「다 아님」 → 계속 숨김');
  delete nbm.get('aladin_1').edPick; nbm.get('aladin_1').ed.use = 'srch'; ok(!X.edHide(l), '검색 시장 우선은 숨기지 않음');
  nbm.get('aladin_1').ed.use = 'auto'; ok(!X.edHide(l), '자동 지표 그대로는 숨기지 않음');
  S.app.edSearch = false; nbm.get('aladin_1').ed.use = 'check'; ok(!X.edHide({ ...l }), '⑮ 판본 검색 대조를 끄면 예전과 같음'); S.app.edSearch = true;
  ok(X.edCandCfg().minCov === 0.6 && X.edCandCfg().loose === false, '후보 기준 기본 0.60 · 느슨 끔');
  S.app.edCandTh = 0.75; ok(X.edCandCfg().minCov === 0.75, '⚙ 0.75 → 보수적'); S.app.edCandTh = 2; ok(X.edCandCfg().minCov === 0.6, '0.30~0.95 밖이면 기본');
  ok(X.ED_TH3.map((x) => x[0]).join() === '0.45,0.6,0.75', '세 단추 0.45·0.60·0.75');
  // (더함) 유의 사항 속 판본 낱말 — 제목엔 없고 유의 사항에 사인본(음반이라도)
  S.uinfo = new Map([['5001', { note: '멤버 전원 친필 사인본입니다', hasNote: true }]]); const lm = { id: 'aladin_5', listingId: 5001, title: '어느 가수 정규 8집', price: 30000 };
  ok(X.edUse(lm) === 'check' && X.edHide(lm) && X.edNoteOf(lm).includes('사인본'), '유의 사항에 사인본 → 사람 확인 · 시장 값 숨김(검색 기록이 없어도)');
  ok(X.edHideHtml(lm, '').includes('유의 사항의 판본 낱말') && !/확인 중|알아보는 중/.test(X.edHideHtml(lm, '')), '자세히에 「유의 사항의 판본 낱말」 · 확답형');
  ctx.isMedia = () => true; const lm2 = { ...lm, id: 'aladin_6' }; ok(X.edHide(lm2), '영상·음반이라도 유의 사항 판본 낱말이면 숨김'); const lm3 = { id: 'aladin_7', listingId: 5002, title: '[중고] [블루레이] 어떤 영화 (한정판)' }; ok(!X.edOf(lm3), '영상·음반 제목 낱말은 예전처럼 보지 않음(판마다 상품이 따로)'); ctx.isMedia = () => false;
  S.uinfo.set('5001', { note: '사인펜 자국이 조금 있습니다' }); ok(!X.edHide({ ...lm }), '「사인펜」은 판본 낱말 아님');
  S.uinfo.set('5001', { note: '사인본' }); nbm.set('aladin_5', { ed: { use: 'check', cands: [{ itemId: '9', t: 'x', sim: 0.9 }] }, edPick: { itemId: '9' } }); ok(X.edUse(lm) === 'srch', '사람이 판을 고르면 그 판 시장(유의 사항 낱말이 있어도)');
  ok(X.edUse({ id: 'aladin_8', listingId: 5003, title: '어떤 책 양장 특별판' }) === null, '검색 기록이 없는 제목 의심은 예전처럼(숨기지 않음)'); }

console.log('⑧ 가격 쪽 — 사람 확인이면 추천가를 내지 않음');
ok(/const eu0 = edUse\(l\);[^\n]*if \(eu0 === 'check'\)/.test(APP), '일괄 계산: hold가 없어도 사람 확인이면 판매가 그대로');
{ const pw = rd('readnow-price-watch.user.js'); ok(/e\.use === 'srch' \|\| e\.use === 'check'\)\) return null/.test(pw) && /dd\.edPick/.test(pw), '가격 감시기: 사람 확인은 모두 막음 · 사람이 고른 판 따름'); }
ok(/판본 낱말이 같은 검색 상품이 없어 추천가를 채우지 않음/.test(APP) && /PC\.edMatch\(ttl, r\.title/.test(APP), '등록 준비: 판본 낱말이 다른 검색 상품 값으로 추천가를 채우지 않음');
ok(/edHide\(l0\) \? edHideHtml\(l0, w\)/.test(APP), '시장 블록(prBlocks) 숨김');
ok(/prd_edkw_truth/.test(APP) && /edPick: v \|\| FV\.delete\(\)/.test(APP), '「이 판으로 정함」 → edPick + 정답 표본 prd_edkw_truth');
{ const col = rd(fs.existsSync(path.join(R, 'src/readnow-collector.src.js')) ? 'src/readnow-collector.src.js' : 'readnow-collector.user.js'); ok(/nbEdJudge\(l, cands, th, old && old\.edPick\)/.test(col), '수집기가 사람이 고른 판(edPick)을 판정에 넘김'); ok(/x\.tier === 1 \? 100/.test(col), '수집기 검색 차례: 판본 낱말(1단계) 먼저 · 괄호만(2단계)은 뒤'); }

console.log('⑨ 더함 — 괄호 없이도 강한 낱말 · 약한 낱말은 자리 규칙 · 권·디스크는 판정에서 뺌 · 유의 사항');
for (const t of ['어떤 책 양장 특별판', '사인본 에디션 어떤 책 이야기', '어떤 책 리커버 이야기', '어떤 책 개정판 이야기', '한정판 어떤 책']) { const s = P.edSuspect(t); ok(s.on && s.tier === 1, `${t} → 괄호 없이도 판본 의심(낱말 ${s.kw.join('·')})`); }
ok(!P.edSuspect('알라딘 이야기').on, '「알라딘 이야기」 — 약한 낱말 혼자 → 의심 아님'); ok(!P.edSuspect('특별한 하루').on, '「특별한 하루」 → 의심 아님'); ok(!P.edSuspect('기념일의 아침').on, '「기념일의 아침」 → 의심 아님');
ok(P.edSuspect('어떤 책 (알라딘)').kw.includes('알라딘'), '「(알라딘)」 괄호 안 → 의심'); ok(P.edSuspect('어떤 책 알라딘 단독').kw.includes('알라딘'), '「알라딘 단독」 자리꼴 → 의심'); ok(P.edSuspect('어떤 책 특별판').kw.includes('특별'), '「특별판」 → 의심');
ok(!P.edSuspect('특전사 이야기').on, '「특전사」는 특전 아님');
for (const t of ['어떤 책 (1)', '영화 (2disc)', '어떤 책 (1~5권)', '어떤 책 (2020)', '어떤 책 (상)']) ok(!P.edSuspect(t).on, `${t} → 판본 판정에서 뺌(권·구성 대조에만)`);
ok(P.edSuspect('어떤 책', null, { extra: '리커버 시리즈' }).kw.includes('리커버'), '시리즈 칸·부제(opt.extra)의 강한 낱말도');
ok(P.edNoteKw('멤버 전원 사인본').includes('사인본') && P.edNoteKw('친필 사인 있음').includes('사인본') && P.edNoteKw('저자 서명 있음').includes('서명본') && P.edNoteKw('넘버링 0123').includes('넘버링') && P.edNoteKw('한정 수량 500부').includes('한정판'), '유의 사항 강한 낱말 다섯 갈래');
ok(!P.edNoteKw('사인펜 자국').length && !P.edNoteKw('사인본 아님').length && !P.edNoteKw('한정식집 영수증 끼움').length && !P.edNoteKw('서명란 비어 있음').length && !P.edNoteKw('').length, '「사인펜」·「사인본 아님」·「한정식」·「서명란」은 빼기');
{ const d = P.edDecide({ title: '어느 가수 정규 8집', note: '사인본', bookId: 'bk_1' }, null); ok(d.on && d.use === 'check' && d.hold && /유의 사항/.test(d.why), '판정: 유의 사항 사인본 → 사람 확인 · 판매가 그대로');
  const d2 = P.edDecide({ title: '어느 가수 정규 8집', note: '사인본', bookId: 'bk_1' }, { src: 'usedSearch', cands: [{ itemId: '9', title: '어느 가수 정규 8집', cov: 0.95 }] }); ok(d2.use === 'check' && d2.hold, '검색에 같은 이름 상품이 있어도 사람 확인(보통판일 수 있음)');
  const d3 = P.edDecide({ title: '어느 가수 정규 8집', note: '사인본', bookId: 'bk_1' }, { src: 'usedSearch', cands: [{ itemId: '9', title: '어느 가수 정규 8집', cov: 0.95 }] }, { pick: { itemId: '9' } }); ok(d3.use === 'srch' && d3.human, '사람이 고르면 그 판'); }
ok(/R = await edNoteFix\(c, batchCompute\(c, rows\)\)/.test(APP) && /async function edNotePrefetch\(ls, cap\)/.test(APP), '수동 일괄: 판매가를 바꾸려는 줄만 유의 사항을 받아 다시 계산');
ok(/!ed && edNw\.length && edUse\(l\) === 'check'/.test(APP), '일괄 계산: 유의 사항 판본 낱말 → 추천가 내지 않음');
{ const pw = rd('readnow-price-watch.user.js'); ok(/async function edNoteOfL\(l, uinfo\)/.test(pw) && /edBlockOf\(l, key, uinfo\)/.test(pw), '가격 감시기: 유의 사항 판본 낱말이면 자동 반영 막음'); }
{ const fl = ['🔖 판본 확인 중', '판본 알아보는 중']; ok(!fl.some((w) => APP.includes(w)), '「판본 확인 중」·「알아보는 중」 문구 없음'); }

console.log(`\n${bad ? '❌' : '✓ 통과'} ${n - bad}/${n}`); process.exit(bad ? 1 : 0);
