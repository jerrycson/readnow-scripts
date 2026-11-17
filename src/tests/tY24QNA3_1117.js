// tY24QNA3_1117 — (11/17 y24qna3 · 정범님 I-1117-2027-23 「예스24 문의 1개 미답변인데 위 문의 카드가 알라딘만 · 답 받기 1분 넘게 · 출고처럼 플랫폼별로」)
//   ① 플랫폼 셈(qnaPlatCnt·qnaPlatSplit·qnaPlatCur·qnaPlatOfQ) — 알라딘·예스24·네이버마다 문의 수·답할 수 · 모든 플랫폼 합
//   ② 글 검사: 고객 탭 ❓ 문의 카드가 예스24를 셈 · 고른 플랫폼 이름표 · 문의 모음 판매처 칩(출고 칩 꼴) · 칩마다 답할 수 · 네이버 빈 안내
//   ③ 수집기 빠른 답 길: 새 맡김 듣기(onSnapshot st 'new' · 이 PC 맡김만) · 빠른 간격 1.5초 · 넘긴 맡김 결과 2초마다 이 PC 번외에서 봄 · 옛 확인 그대로 · 머리 안 바뀜
// 실행: node src/tests/tY24QNA3_1117.js · 시험 자료에 손님 정보 없음(손님A·지어낸 문의)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const T = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8'); const C = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
const cut = (X, a, b) => { const i = X.indexOf(a); const j = X.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return X.slice(i, j); };
const fnOf = (name) => { const i = T.indexOf('function ' + name + '('); if (i < 0) throw new Error('함수 못 찾음: ' + name); let d = 0, j = T.indexOf('{', i); for (; j < T.length; j++) { if (T[j] === '{') d++; else if (T[j] === '}' && --d === 0) break; } return T.slice(i, j + 1); };
const S = {}; let Y = [];
const P = new Function('S', 'num', 'CH', 'y24QnaList', cut(T, '/* ◆qnaplat 시작', '/* ◆qnaplat 끝 */') + '\nreturn { QNA_PLATS, qnaPlatOfQ, qnaPlatCur, qnaPlatCnt, qnaPlatSplit, qnaPlatLab, qnaAllList, qnaY24List };')(
  S, (n) => String(n), (k) => `[${k}]`, () => Y);
const Q_DONE = ['Yes', '취소된 질문']; const qNeeds = (q) => q.answerStatus != null && !Q_DONE.includes(q.answerStatus);

console.log('① 플랫폼 셈');
{ const L = [{ questionId: 'Q1', answerStatus: 'No' }, { questionId: 'Q2', answerStatus: 'Yes' }, { questionId: 'Q3', answerStatus: '취소된 질문' }, { questionId: 'y24-900001', plat: 'y24', answerStatus: '미답변' }, { questionId: 'y24-900002', plat: 'y24', answerStatus: 'Yes' }, { questionId: 'y24-900003', plat: 'y24', answerStatus: null }];
  const X = P.qnaPlatCnt(L, qNeeds);
  ok(X.al.n === 3 && X.al.need === 1 && X.y24.n === 3 && X.y24.need === 1 && X.all.n === 6 && X.all.need === 2 && X.nv.n === 0, '알라딘 3(답할 1) · 예스24 3(답할 1 — 미답변) · 전체 6(답할 2) · 네이버 0', X);
  ok(P.qnaPlatSplit(X, 'need') === '알라딘 1 · 예스24 1' && P.qnaPlatSplit(X, 'n') === '알라딘 3 · 예스24 3', '모든 플랫폼 줄 — 「알라딘 1 · 예스24 1」(네이버는 문의가 없으면 숨김)', P.qnaPlatSplit(X, 'need'));
  ok(P.qnaPlatSplit(P.qnaPlatCnt([{ plat: 'nv', answerStatus: 'No' }], qNeeds), 'need') === '알라딘 0 · 예스24 0 · 네이버 1', '네이버 문의가 생기면 네이버도 셈');
  ok(P.qnaPlatOfQ({}) === 'al' && P.qnaPlatOfQ({ plat: 'y24' }) === 'y24' && P.qnaPlatOfQ({ plat: 'nv' }) === 'nv' && P.qnaPlatOfQ(null) === 'al', '판매처 없음 = 알라딘(샵매니저 문의)');
  S.custPlat = 'yes24'; ok(P.qnaPlatCur() === 'y24', '고객 탭 플랫폼 칩 예스24 → 문의도 예스24'); S.custPlat = 'aladin'; ok(P.qnaPlatCur() === 'al', '알라딘 → 알라딘');
  S.custPlat = 'direct'; ok(P.qnaPlatCur() === 'all', '직접 거래(문의 없음) → 모든 플랫폼'); S.custPlat = 'all'; S.qnaPlat = 'nv'; ok(P.qnaPlatCur() === 'nv', '네이버 칩은 따로(S.qnaPlat)'); S.qnaPlat = null;
  ok(P.qnaPlatLab('all') === '[al][y24]' && P.qnaPlatLab('y24') === '[y24]', '카드 이름표 — 모든 플랫폼이면 알라딘·예스24 둘 다');
  S.qnaAll = [L[0]]; Y = [L[3]]; ok(P.qnaAllList().length === 2, '모음 = 알라딘 + 예스24'); S.qnaAll = null; ok(P.qnaAllList().length === 1, '알라딘을 아직 못 받아도 예스24는 보임'); }

console.log('② 글 검사 — 카드·문의 모음');
{ const nav = fnOf('custSubNav'), box = fnOf('renderQnaBox');
  ok(/qnaY24List\(\)/.test(nav) && /qnaPlatCnt\(QL, qNeeds\)/.test(nav), '고객 탭 ❓ 문의 카드가 예스24 문의도 셈(전엔 S.qnaAll — 알라딘만)');
  ok(/qnaPlatLab\(QP\) \+ '문의 모음'/.test(nav), '카드 이름표가 고른 플랫폼을 따름(예스24 칩이면 예스24)');
  ok(/qnaPlatSplit\(QC, 'need'\)/.test(nav), '모든 플랫폼이면 카드 아래에 「알라딘 n · 예스24 m」');
  ok(/data-qplat/.test(box) && /shp-srcs qn-plats/.test(box) && /shipSrcBadge\(/.test(box), '문의 모음 위 판매처 칩 — 출고 화면과 같은 꼴(shp-srcs · 같은 판매처 표)');
  ok(/답할 /.test(box) && /qn-bd/.test(box), '칩마다 답할 수 · 모든 플랫폼에선 상태 칸마다 플랫폼 나눔');
  ok(/네이버/.test(box) && /아직/.test(box), '네이버를 고르면 「아직 모으지 않음」 안내');
  ok(/qnaPlatCnt\(qnaAllList\(\), qNeeds\)\.all\.need/.test(T), '주문 줄 ❓ 숫자도 예스24 포함');
  ok(/S\.qnaPlat = null/.test(T) && /rn-custplat/.test(cut(T, "querySelectorAll('[data-qplat]')", 'renderMain(); }));')), '칩 누르면 고객 탭 플랫폼과 같게(기기에 기억)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(cut(T, '/* ◆qnaplat 시작', '/* ◆qnaplat 끝 */') + box), '브라우저 창 없음');
  ok(!/010-?\d{4}/.test(cut(T, '/* ◆qnaplat 시작', '/* ◆qnaplat 끝 */')), '손님 전화 없음'); }

console.log('③ 수집기 빠른 답 길');
{ const W = cut(C, "const W_CMD = 'col2_y24_cmd'", 'G.__rnC2yWRelay = wRelay;');
  ok(/collection\(W_CMD\)\.where\('st', '==', 'new'\)\.onSnapshot/.test(W), '새 맡김(st new)을 들음 — 옛 길은 쉴 때 60초마다 한 번 물었음');
  ok(/c\.type !== 'added'/.test(W) && /v\.holder/.test(cut(W, 'const wLiveSync', 'const wFastTick')), '새로 들어온 맡김만 · 이 PC가 맡은 것만');
  ok(/y\.mine !== false && y\.on/.test(cut(W, 'const wLiveSync', 'const wFastTick')) && /!y\.logger/.test(cut(W, 'const wLiveSync', 'const wFastTick')), '듣기는 예스24를 맡은 PC(로거 아님)에서만');
  ok(/fast \? 1500/.test(W), '빠른 간격 1.5초(옛 15초·60초 확인은 그대로)') ; ok(/60e3 : 15e3/.test(W), '옛 확인 간격 그대로 남김(듣기가 끊겨도)');
  ok(/setInterval\(\(\) => \{ wFastTick\(\)/.test(W) && /, 2000\)/.test(W) && /gxs\('GET', '\/y24\/w\/state'\)/.test(cut(W, 'const wFastTick', 'const wFastAdd')), '넘긴 맡김은 2초마다 이 PC 번외 상태(127.0.0.1 · Firestore 읽기 0)');
  ok(/hit\.forEach\(\(k\) => wFast\.delete\(k\)\)/.test(W) && /wFast\.delete\(jid\)/.test(W), '결과를 보면 바로 빼 되풀이 0');
  ok(/5 \* 60e3/.test(cut(W, 'const wFastAdd', 'const wRelay ')), '빠른 지켜봄은 5분까지만');
  ok(/if \(!fin\) wFastAdd\(/.test(W), '번외에 넘겼을 때만 지켜봄');
  ok(/wLiveSync\(pc, y\); if \(!y\.logger\) wRelay\(pc, y\)/.test(C), '틱마다 듣기 켜고 끔');
  ok(/rn-pubChrome', false\)\) \{ wLast = null; wLiveOff\(\); return; \}/.test(C) && /undo\(null\); wLast = null; wLiveOff\(\);/.test(C), '리드 탭 아님·번외가 답하지 않음 → 듣기 끔');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(W), '브라우저 창 없음');
  /* 움직여 봄 — 가짜 Firestore·가짜 번외·가짜 시계 */
  const L = { snap: null, un: 0, relay: [], ints: [], tos: [] }; let ST = { ok: true, res: {} };
  const FB = { firestore: () => ({ collection: (c) => ({ where: (f, o, v) => ({ onSnapshot: (fn, er) => { L.q = [c, f, o, v]; L.snap = fn; L.err = er; return () => { L.un++; }; } }) }) }) };
  const M = new Function('firebase', 'gxs', 'setInterval', 'clearInterval', 'setTimeout', 'L', "const W_CMD = 'col2_y24_cmd'; let wAt = 0, wBusy = false, wSeen = 0;\n" + cut(W, 'let wLast', 'const wRelay ') + "\nconst wRelay = async (pc, y, fast) => { L.relay.push([pc, fast]); wAt = Date.now(); };\nreturn { wLiveSync, wLiveOff, wFastAdd, wFastTick, wKick, st: () => ({ live: !!wLiveUn, pc: wLivePc, fast: [...wFast.keys()] }), at0: () => { wAt = 0; } };")(
    FB, async (m, u) => (u === '/y24/w/state' ? ST : null), (f, t) => { L.ints.push(t); return 7; }, () => { L.ints.push('끔'); }, (f, t) => { L.tos.push([f, t]); return 9; }, L);
  const doc = (holder) => ({ type: 'added', doc: { data: () => ({ holder }) } });
  M.wLiveSync('JS-MAIN', { logger: true, mine: true, on: true }); ok(!L.snap, '로거면 듣지 않음');
  M.wLiveSync('JS-MAIN', { mine: true, on: true }); ok(L.snap && L.q.join() === 'col2_y24_cmd,st,==,new' && M.st().live, '예스24 맡은 PC — col2_y24_cmd st==new 듣기 켬', L.q);
  M.wLiveSync('JS-MAIN', { mine: true, on: true }); ok(L.un === 0, '틱마다 다시 켜지 않음(듣기 하나)');
  L.snap({ docChanges: () => [doc('HOME')] }); ok(L.relay.length === 0, '다른 PC 맡김은 깨우지 않음');
  L.snap({ docChanges: () => [{ type: 'removed', doc: { data: () => ({}) } }] }); ok(L.relay.length === 0, '빠진 문서(넘겨 간 것)는 깨우지 않음');
  L.snap({ docChanges: () => [doc('js-main')] }); ok(L.relay.length === 1 && L.relay[0][1] === true, '이 PC 맡김이 들어오면 바로 빠른 중계', L.relay);
  L.snap({ docChanges: () => [doc('')] }); ok(L.relay.length === 1 && L.tos.length === 1 && L.tos[0][1] === 1600, '1.5초 안 두 번째는 1.6초 뒤로 미룸(Firestore 덜 읽음)', L.tos);
  M.wFastAdd('y24qa-900001-t1'); M.wFastAdd('y24qa-900002-t1'); ok(L.ints.join() === '2000', '넘긴 맡김 2초 지켜봄 하나만', L.ints);
  (async () => { await M.wFastTick(); ok(M.st().fast.length === 2 && L.relay.length === 1, '결과가 아직 없으면 그대로 기다림');
    ST = { ok: true, res: { 'y24qa-900001-t1': { state: 'done' } } }; M.at0(); await M.wFastTick(); ok(M.st().fast.join() === 'y24qa-900002-t1' && L.relay.length === 2, '결과가 보이면 그 맡김만 빼고 바로 되돌려 적기', M.st());
    M.at0(); await M.wFastTick(); ok(L.relay.length === 2, '같은 결과로 또 깨우지 않음(되풀이 0)');
    M.wLiveSync('JS-MAIN', { mine: false, on: true }); ok(!M.st().live && L.un === 1, '맡지 않게 되면 듣기 끔');
    M.wLiveSync('JS-MAIN', { mine: true, on: true }); ok(M.st().live, '다시 맡으면 켬');
    L.err(new Error('권한')); M.wLiveSync('JS-MAIN', { mine: true, on: true }); ok(!M.st().live, '듣기 오류 뒤 5분은 다시 켜지 않음(옛 15초·60초 확인이 이어 받음)');
    fin(); })();
  ok(!/@require/.test(W) && !/GM_xmlhttpRequest/.test(cut(W, 'let wLast', 'const wRelay ')), '새 권한(@grant·@connect) 없이 — 있던 번외 부르기(gxs)만'); }

function fin() { if (bad) { console.log(`✗ tY24QNA3_1117 ${bad}개 실패`); process.exit(1); } console.log('✓ tY24QNA3_1117 모두 통과'); }
