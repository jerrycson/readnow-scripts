// tCTRLIMP2_SA — (ctrlimp2 · 설계 CTRLDES1 8절 · CTRLDES2 1.11 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 사 — 📊 배움 성적표
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 쓰기 없음(읽기만) · 관제창·카드·누름·확정에 걸림 · 설명서 문단
//  ② 성적(vm): 판매율·판매 일수·판 값 비율·사람이 고친 수·후회 · 20건 아래 「아직 모름」 · 제안은 글만
// 실행: node tCTRLIMP2_SA.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 사 · ctrlimp2'), m1 = T.indexOf('/* (판 마 · ctrlimp2'); const SA = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
console.log('① 글');
ok(!!SA, '판 사 덩이가 있음');
{ const names = ['CTRL_SC_N', 'CTRL_SC_W', 'CTRL_SC_EDIT', 'CTRL_SC_SAME', 'ctrlFew', 'ctrlScore', 'ctrlSuggest', 'ctrlEpsLoad', 'ctrlScoreBtn', 'ctrlScoreClick', 'ctrlScoreBox', 'ctrlSellLine', 'ctrlRecOf'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(SA), '브라우저 창 없음');
ok(!/\.(set|update|add|delete)\(|batchSave|runTransaction|bkfGlSet/.test(SA), '쓰는 곳 없음(읽기만)');
ok((SA.match(/db\.collection\(/g) || []).length === 1 && /db\.collection\('chase_eps'\)\.get\(\)/.test(SA), '새 읽기는 추격 판 기록 하나뿐');
ok(/ctrlScoreBtn\(P\)/.test(T) && /ctrlScoreBox\(P\)/.test(T) && /ctrlSellLine\(P, it\)/.test(T) && /d\.cscore\) return ctrlScoreClick\(P\)/.test(T), '관제창·카드·누름에 걸림');
ok((T.match(/ctrlRecOf\(\(st\.picks\[key\] \|\| \{\}\)\.rec \?\? x\.target\)/g) || []).length === 2 && (T.match(/ctrlRecOf\(bkfTabP\(/g) || []).length === 2, '고를 때·확정할 때 추천을 함께 남김(네 곳)');
ok(/📊 배움 성적표 \(판 사\)/.test(T), '설명서 문단');

// ② vm
const D = 864e5, now = Date.parse('2026-11-19T00:00:00Z'); const iso = (ms) => new Date(ms).toISOString();
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error, window: {}, num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', errKo: (e) => String(e && e.message), S: {}, SOLD: [] };
ctx.bqSoldList = () => ({ rows: ctx.SOLD, set: new Set(ctx.SOLD.map((r) => r.key)) });
vm.createContext(ctx);
vm.runInContext(SA + '\n;this.__M = { ctrlScore, ctrlSuggest, ctrlScoreBox, ctrlFew, ctrlRecOf, ctrlSellLine };', ctx);
const M = ctx.__M;
console.log('② 성적');
{ // 확정 4개: k1(10일 전·2일 뒤 팔림 9000원) k2(10일 전·안 팔림) k3(3일 전·반나절 뒤 팔림) k4(40일 전 — 창 밖)
  const g = { id: 'g1', name: '시험 그룹', decided: { k1: { price: 10000, at: iso(now - 10 * D), rec: 9000 }, k2: { price: 8000, at: iso(now - 10 * D), rec: 8000 }, k3: { price: 5000, at: iso(now - 3 * D), reo: { p: 4000, days: 2 } }, k4: { price: 1, at: iso(now - 40 * D) } },
    undone: { k5: { price: 7000, at: iso(now - 5 * D), undoneAt: iso(now - 4 * D) } }, picks: { k6: { price: 3000, at: iso(now - D), rec: 3500 } } };
  ctx.SOLD = [{ key: 'k1', ms: now - 8 * D, price: 9000 }, { key: 'k3', ms: now - 3 * D + D / 2, price: 5000 }];
  const o = M.ctrlScore(g, now, null, null);
  ok(o.dec === 3 && o.n === 4, '30일 창 안 확정 3 · 되돌림 1', o);
  ok(o.r7.n === 2 && o.r7.s === 1 && o.r7.v === 0.5, '7일 판매율 = 7일 지난 확정만(2개 중 1)', o.r7);
  ok(o.r14.n === 0 && o.r14.v === null, '14일 지난 확정은 없음', o.r14);
  ok(o.sold === 2 && Math.abs(o.days - 1.25) < 1e-9, '평균 판매 일수 (2+0.5)/2', [o.sold, o.days]);
  ok(Math.abs(o.pr - 0.95) < 1e-9 && o.prN === 2, '판 값÷확정값 평균', o.pr);
  ok(o.edN === 3 && o.ed === 2 && o.up === 1 && o.dn === 1, '사람이 고친 수(추천 남긴 것만 · 결정 대기 포함)', [o.edN, o.ed, o.up, o.dn]);
  ok(o.low3 === 2 && o.fast1 === 1, '후회: 3일 안 다시 내림 2 · 하루 안 팔림 1', [o.low3, o.fast1]);
  ok(o.sg && o.sg.few && o.sg.n === 3, '표본 20건 아래 → 아직 모름', o.sg);
  ok(Array.isArray(o.strat) && !o.strat.length, '추격 엔진 없으면 전략 칸 빔');
  const H = M.ctrlScoreBox({ score: true, scoreL: [o] }); ok(/아직 모름 \(2건\)/.test(H) && /<table/.test(H), '성적표에 「아직 모름 (n건)」');
  ok(/세는 중/.test(M.ctrlScoreBox({ score: true, scoreL: null })) && M.ctrlScoreBox({ score: false }) === '', '세는 중 · 닫히면 빈칸'); }
{ // 제안: 25건 중 20건 올림(+10%) → 글만
  const smp = []; for (let i = 0; i < 25; i++) smp.push(i < 20 ? { rec: 10000, price: 11000 } : { rec: 10000, price: 10000 });
  const s = M.ctrlSuggest({ smp, ed: 20, up: 20, dn: 0 });
  ok(s && s.up && s.pct === 10 && s.same === 20 && /올림/.test(s.t) && /제안만/.test(s.t), '같은 쪽 70% 넘으면 제안 글', s);
  ok(s.aft < s.bef, '옮기면 차이 평균이 줄어듦', [s.bef, s.aft]);
  ok(Object.keys(s).every((k) => ['up', 'pct', 'n', 'same', 'bef', 'aft', 't'].includes(k)), '제안은 값만 돌려줌(아무것도 바꾸지 않음)');
  ok(M.ctrlSuggest({ smp, ed: 5, up: 5, dn: 0 }) === null, '고친 것 10건 아래면 제안 없음');
  ok(M.ctrlSuggest({ smp, ed: 20, up: 12, dn: 8 }) === null, '방향이 섞이면 제안 없음'); }
ok(M.ctrlFew(19) && !M.ctrlFew(20), '20건 경계');
ok(JSON.stringify(M.ctrlRecOf(4321.4)) === '{"rec":4321}' && JSON.stringify(M.ctrlRecOf(null)) === '{}' && JSON.stringify(M.ctrlRecOf(0)) === '{}', '추천 남기기는 값 있을 때만');
ok(M.ctrlSellLine({ tab: 'sel' }, { x: {} }) === '', '모델 안 받았으면 팔릴 확률 줄 없음(새로 읽지 않음)');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
