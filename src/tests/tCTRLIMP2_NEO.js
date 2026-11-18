// tCTRLIMP2_NEO — (ctrlimp2 · 설계 CTRLDES2 1.11 · 아이디어 11 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 너 — 🧭 배움 세 갈래 · 후회 셈 · ↩ 되돌림 규칙 후보
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 쓰기는 승인 하나(쉬기 칸만 · 두 번 누름) · 가격 셈 함수는 이 덩이를 부르지 않음(정범님 선택 = 채점 자료만) · 설명서 문단
//  ② vm: 채점(추천대로·올림·내림) · 후회 셋 · 되돌림 2번 넘어야 후보 · 20건 아래 「아직 모름」 · 정범님이 고친 값을 바꿔도 추천값 쪽 결과는 그대로
// 실행: node tCTRLIMP2_NEO.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const n0 = T.indexOf('/* (판 너 · ctrlimp2'), n1 = T.indexOf('/* (판 너) 끝 */'); const NEO = n0 > 0 && n1 > n0 ? T.slice(n0, n1) : '';
const m0 = T.indexOf('/* (판 사 · ctrlimp2'), m1 = T.indexOf('/* (판 마 · ctrlimp2'); const SA = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
const fnBody = (name) => { const i = T.search(new RegExp(`(?:async )?function ${name}\\s*\\(`)); if (i < 0) return ''; let d = 0, j = T.indexOf('{', i); for (let k = j; k < T.length; k++) { if (T[k] === '{') d++; else if (T[k] === '}' && --d === 0) return T.slice(i, k + 1); } return ''; };
console.log('① 글');
ok(!!NEO && !!SA, '판 너·판 사 덩이가 있음');
{ const names = ['CTRL_NEO_D', 'CTRL_NEO_REV', 'ctrlGrade', 'ctrlGradeTxt', 'ctrlNeoLids', 'ctrlRevOf', 'ctrlNeo', 'ctrlNeoFill', 'ctrlNeoBox', 'ctrlNeoApprove'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEO), '브라우저 창 없음');
ok(!/\d{2,3}-\d{3,4}-\d{4}/.test(NEO), '전화번호 모양 없음');
ok(!/\.(delete|update)\(|collection\([^)]*\)\.add\(|runTransaction|FieldValue\.delete|batchSave/.test(NEO), '지우기·고치기·덧붙이기 없음');
{ const sets = NEO.match(/\)\.set\(\{/g) || []; ok(sets.length === 1 && /db\.collection\('strat_items'\)\.doc\(h\)\.set\(\{ m \}, \{ merge: true \}\)/.test(NEO), '쓰기는 승인의 쉬기 칸 하나뿐(strat_items · merge)'); }
{ const A = fnBody('ctrlNeoApprove'); ok(A.indexOf("twiceArm(t,") > 0 && A.indexOf("twiceArm(t,") < A.indexOf('.set('), '승인은 두 번 누른 뒤에만 씀'); ok(/m\[lid\] = \{ hold \}/.test(A) && !/price|peQueue|batchSave/.test(A), '승인은 쉬기만 — 값을 바꾸지 않음'); }
ok((NEO.match(/db\.collection\(/g) || []).length === 1, '새 읽기 없음(전략 기록은 있던 stratLogLoad·stratItemsLoad)');
{ const price = ['batchCompute', 'bkfTabP', 'ctrlPerFix', 'edNoteFix', 'stratSim', 'batchRows'].map(fnBody); const leak = price.filter((b) => /ctrlScore|ctrlSuggest|ctrlGrade|ctrlNeo|ctrlRevOf/.test(b));
  ok(price.every(Boolean) && !leak.length, '가격 셈 함수(batchCompute·bkfTabP·ctrlPerFix·edNoteFix·stratSim·batchRows)는 성적표·채점을 부르지 않음 — 정범님 선택은 학습 입력 아님'); }
ok(/await ctrlNeoFill\(P, now\)/.test(SA) && /ctrlNeoBox\(P\)/.test(SA) && /d\.cneoap\) return ctrlNeoApprove\(P, t, d\.cneoap\)/.test(T), '성적표 열기·상자·누름에 걸림');
ok(/🧭 배움 세 갈래·후회 셈·↩ 되돌림 규칙 후보 \(판 너\)/.test(T), '설명서 문단');

// ② vm
const D = 864e5, now = Date.parse('2026-11-19T00:00:00Z'); const iso = (ms) => new Date(ms).toISOString();
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error, window: {}, num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', errKo: (e) => String(e && e.message), toast: () => {}, S: { plist: new Map() }, SOLD: [] };
ctx.bqSoldList = () => ({ rows: ctx.SOLD, set: new Set(ctx.SOLD.map((r) => r.key)) });
vm.createContext(ctx);
vm.runInContext(SA + '\n' + NEO + '\n;this.__M = { ctrlScore, ctrlGrade, ctrlGradeTxt, ctrlRevOf, ctrlNeo, ctrlNeoBox, ctrlNeoLids };', ctx);
const M = ctx.__M;
console.log('② 채점·후회·후보');
{ // 14일 지난 확정: 추천대로 3(2 팔림) · 올림 2(0 팔림 → 안 내려서 못 팜 2) · 내림 1(1 팔림) · 5일 전 확정 1(창 안이지만 14일 안 지남 → 채점 밖)
  const dec = { a1: { price: 9000, rec: 9000, at: iso(now - 20 * D) }, a2: { price: 9000, rec: 9000, at: iso(now - 20 * D) }, a3: { price: 9000, rec: 9000, at: iso(now - 20 * D) },
    b1: { price: 11000, rec: 9000, at: iso(now - 20 * D) }, b2: { price: 12000, rec: 9000, at: iso(now - 16 * D) }, c1: { price: 7000, rec: 9000, at: iso(now - 15 * D) }, d1: { price: 9000, rec: 9000, at: iso(now - 5 * D) } };
  const g = { id: 'g1', name: '시험 그룹', decided: dec, start: { U1: 1, U2: 1 } };
  ctx.SOLD = [{ key: 'a1', ms: now - 18 * D, price: 9000 }, { key: 'a2', ms: now - 15 * D, price: 9000 }, { key: 'c1', ms: now - 14.5 * D, price: 7000 }, { key: 'd1', ms: now - 4.5 * D, price: 9000 }];
  const B = M.ctrlGrade(g, now);
  ok(B.fol.n === 3 && B.fol.s === 2 && B.up.n === 2 && B.up.s === 0 && B.dn.n === 1 && B.dn.s === 1 && B.miss === 2, '채점: 추천대로 3(2) · 올림 2(0) · 내림 1(1) · 못 판 올림 2', B);
  // 정범님이 고친 값만 바꿔도 추천값(rec)은 그대로 — 채점 칸만 움직임
  const g2 = JSON.parse(JSON.stringify(g)); g2.decided.b1.price = 9000; const B2 = M.ctrlGrade(g2, now);
  ok(B2.fol.n === 4 && B2.up.n === 1 && JSON.stringify(Object.values(g2.decided).map((d) => d.rec)) === JSON.stringify(Object.values(g.decided).map((d) => d.rec)), '고친 값을 바꾸면 채점 칸만 바뀌고 추천값은 그대로', B2);
  // 되돌림: 같은 배정 a7 3번(내림 2) · 배정 a8 1번 → 후보는 a7 하나 · 그룹 밖 상품 되돌림은 셈 안 함
  ctx.S.plist = new Map([['L1', { id: 'L1', usedCode: 'U1' }], ['L2', { id: 'L2', usedCode: 'U2' }], ['L9', { id: 'L9', usedCode: 'U9' }]]);
  const log = [{ lid: 'L1', aid: 'a7', k: 'shadow', act: 'price', from: 9000, to: 8000, at: iso(now - 2 * D), reverted: { at: 1 } }, { lid: 'L2', aid: 'a7', k: 'shadow', act: 'price', from: 9000, to: 8500, at: iso(now - 3 * D), reverted: { at: 1 } },
    { lid: 'L1', aid: 'a7', k: 'shadow', act: 'state', from: '판매중', to: '일시판매중지', at: iso(now - 4 * D), reverted: { at: 1 } }, { lid: 'L2', aid: 'a8', k: 'lure', act: 'price', from: 9000, to: 9500, at: iso(now - D), reverted: { at: 1 } },
    { lid: 'L9', aid: 'a7', k: 'shadow', act: 'price', from: 9000, to: 8000, at: iso(now - D), reverted: { at: 1 } }, { lid: 'L1', aid: 'a7', k: 'shadow', act: 'price', from: 9000, to: 8000, at: iso(now - D) }, { lid: 'L1', aid: 'a7', k: 'shadow', act: 'price', from: 9000, to: 8000, at: iso(now - 40 * D), reverted: { at: 1 } }];
  ok(M.ctrlNeoLids(g).size === 2, '그룹 열쇠 → 상품 번호 2개');
  const R = M.ctrlRevOf(g, log, now); ok(R.dn === 2 && R.list.length === 2 && R.list[0].aid === 'a7' && R.list[0].n === 3, '되돌림 모음: a7 3번(내림 2) · a8 1번 · 그룹 밖·안 되돌린 것·30일 밖은 뺌', R);
  const items = new Map([['L2', { aid: 'a7', hold: { at: 'x' } }]]);
  const o = M.ctrlScore(g, now, null, null); const Z = M.ctrlNeo(o, B, R, items);
  ok(Z.cand.length === 1 && Z.cand[0].aid === 'a7' && Z.cand[0].held === 1 && Z.cand[0].lids.length === 2, '후보는 2번 넘은 배정 하나 · 이미 쉬는 상품 수', Z.cand);
  ok(Z.reg.under === o.low3 && Z.reg.over === o.fast1 + 2 && Z.reg.miss === 2 && Z.reg.n === Z.reg.over + Z.reg.under + Z.reg.miss, '후회 셋과 합', Z.reg);
  const H = M.ctrlNeoBox({ score: true, scoreL: [o], neo: [Z] }); ok(/🧭 배움 세 갈래/.test(H) && /data-cneoap="g1\|a7"/.test(H) && /아직 모름/.test(H) && /후회 <b>/.test(H), '상자: 세 줄 · 승인 단추 · 표본 적으면 아직 모름');
  ok(/세는 중/.test(M.ctrlNeoBox({ score: true, scoreL: [o], neo: null })) && M.ctrlNeoBox({ score: false }) === '', '세는 중 · 닫히면 빈칸'); }
{ // 채점 글 — 표본 20건 넘을 때만 견줌
  const sg = { up: true, t: '제안' }; const few = { fol: { n: 5, v: 0.4 }, up: { n: 30, v: 0.6 }, dn: { n: 0 } }; ok(/아직 근거 없음/.test(M.ctrlGradeTxt({ sg }, few)), '추천대로 20건 아래면 아직 근거 없음');
  ok(/더 잘 팔림/.test(M.ctrlGradeTxt({ sg }, { fol: { n: 25, v: 0.4 }, up: { n: 30, v: 0.6 }, dn: { n: 0 } })), '고친 쪽이 더 잘 팔리면 그렇다고');
  ok(/근거 없음/.test(M.ctrlGradeTxt({ sg }, { fol: { n: 25, v: 0.7 }, up: { n: 30, v: 0.6 }, dn: { n: 0 } })), '고친 쪽이 못하면 제안을 따를 근거 없음');
  ok(M.ctrlGradeTxt({ sg: null }, few) === '' && M.ctrlGradeTxt({ sg: { few: true } }, few) === '', '판 사 제안이 없으면 채점 글도 없음'); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
