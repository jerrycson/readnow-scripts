// tCTRLIMP3_SEO — (ctrlimp3 · 설계 CTRLDES3 1.4 · 정범님 11/18 23:44 결정) ⚡ 판 서 반응 시간 칸 — 가격 감시기 lagSum·lagN · 판매자 탭 ⚡ 빨리 따라 내림 칩
//  ① 가격 코어: lagMin(추격자 값이 내려간 줄에서만 · 우리가 마지막으로 값을 바꾼 뒤 분 · 0~7일만 · 모르면 null) · logEntry가 lag을 실음
//  ② 가격 감시기: chase_rel 같은 문서에 lagSum·lagN을 더함(쓰기 횟수 그대로) · 판 번호 묶음(코어·감시기·수집기·등록부 둘)
//  ③ 웹앱: ⚡ 칩 판정(3번 아래 아직 모름 · 문턱 아래만) · 빠른 순 · 자료가 없으면 「자료 쌓는 중」 · 판매자 줄 평균 · 설명서 문단
// 실행: node tCTRLIMP3_SEO.js · 판매자는 모두 지어낸 번호(9000001~) · 실제 기록·손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'readnow-pricing-core.js')));
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.join(ROOT, 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');

console.log('① 가격 코어');
const G = {}; G.window = G; vm.createContext(G); vm.runInContext(rd('readnow-pricing-core.js'), G);
const PR = G.ReadnowPricing || G.window.ReadnowPricing; const CH = G.ReadnowChase;
const CORE_V = (rd('readnow-pricing-core.js').match(/VERSION\s*=\s*'([0-9.]+)'/) || [])[1];
ok(CORE_V === '0.17.21' && CH && typeof CH.lagMin === 'function' && typeof CH.logEntry === 'function', '가격 코어 0.17.21 · ReadnowChase.lagMin 있음', CORE_V);
{ const L = CH.lagMin; const t0 = '2026-11-19T00:00:00Z'; const at = (m) => new Date(Date.parse(t0) + m * 60000).toISOString(); const pv = { lastMoveAt: t0 };
  const cases = [
    [[pv, 10000, 9900, at(42)], 42, '추격자가 내림 → 42분'],
    [[pv, 10000, 10000, at(42)], null, '추격자 값 그대로 → 없음'],
    [[pv, 9900, 10000, at(42)], null, '추격자가 올림 → 없음'],
    [[pv, null, 9900, at(42)], null, '앞 값 모름 → 없음'],
    [[pv, 10000, null, at(42)], null, '지금 값 모름 → 없음'],
    [[{}, 10000, 9900, at(42)], null, '우리가 값을 바꾼 때 모름 → 없음'],
    [[null, 10000, 9900, at(42)], null, '앞 상태 없음 → 없음'],
    [[pv, 10000, 9900, at(7 * 1440)], 7 * 1440, '딱 7일 → 셈'],
    [[pv, 10000, 9900, at(7 * 1440 + 1)], null, '7일 넘음 → 따라 내린 것으로 안 봄'],
    [[pv, 10000, 9900, at(-5)], null, '시각이 거꾸로 → 없음'],
    [[{ lastMoveAt: Date.parse(t0) }, 10000, 9900, Date.parse(t0) + 90 * 60000], 90, '숫자 시각도 읽음 → 90분'],
    [[{ lastMoveAt: { seconds: Date.parse(t0) / 1000 } }, '10000', '9000', at(3)], 3, 'Firestore 시각·글자 값 → 3분'] ];
  const wrong = cases.filter(([a, v]) => L(...a) !== v).map(([a, v, m]) => [m, v, L(...a)]); ok(!wrong.length, `lagMin ${cases.length}가지`, wrong); }
{ const src = rd('readnow-pricing-core.js'); ok(/lag: lagMin\(prev, pchp, chp, x\.now\)/.test(src), 'logEntry가 lag(분)을 줄에 실음'); }

console.log('② 가격 감시기 · 판 번호');
const PW = rd('readnow-price-watch.user.js');
ok(/@version\s+0\.10\.63\b/.test(PW) && /readnow-pricing-core\.js\?v=0\.17\.21\b/.test(PW), '가격 감시기 0.10.63 · 코어 0.17.21');
{ const line = (PW.split('\n').find((l) => /b\.set\(C\('chase_rel'\)/.test(l)) || '');
  ok(/\.\.\.\(L\.lag != null \? \{ lagSum: FV\.increment\(L\.lag\), lagN: FV\.increment\(1\) \} : \{\}\)/.test(line) && /\{ merge: true \}/.test(line), 'chase_rel 같은 문서에 lagSum·lagN 더함(merge · lag 없으면 칸 없음)');
  const sets = (PW.match(/C\('chase_rel'\)/g) || []).length; ok(sets === 1, 'chase_rel 쓰기는 한 곳 그대로(쓰기 횟수 안 늚)', sets); }
{ const COL = rd('src/readnow-collector.src.js'); ok(/@version\s+1\.89\.374\b/.test(COL) && /readnow-pricing-core\.js\?v=0\.17\.21\b/.test(COL) && /readnow-registry\.js\?v=0\.14\.210\b/.test(COL), '수집기 본 글 1.89.374 · 코어 0.17.21 · 등록부 0.14.210'); }
for (const f of ['readnow-registry.js', 'cloud/readnow-registry.js']) { const R = rd(f); ok(/VERSION = '0\.14\.210'/.test(R) && /'readnow-pricing-core\.js': '0\.17\.21'/.test(R), `${f} 0.14.210 · 코어 핀 0.17.21`); }

console.log('③ 웹앱');
ok(+((T.match(/const APP_VER = '1\.78\.(\d+)'/) || [])[1] || 0) >= 767 && /'1\.78\.767': '2026-11-19'/.test(T) && /\{ d: '2026-11-19', app: '가격 감시기', v: '0\.10\.63'/.test(T) && /\{ d: '2026-11-19', app: '수집기', v: '1\.89\.374'/.test(T), '웹앱 1.78.767 · 기록 줄(감시기 0.10.63 · 수집기 1.89.374)');
ok(/<p><b>⚡ 빨리 따라 내림 \(판 서\)<\/b>/.test(T), '설명서 문단');
ok(!/반응 시간 칸이 쌓인 뒤/.test(T), '옛 「반응 시간 칸이 쌓인 뒤」 안내 지움');
const d0 = T.indexOf('/* (판 버 · ctrlimp3'), d1 = T.indexOf('/* (판 버) 끝 */'); const BEO = d0 > 0 && d1 > d0 ? T.slice(d0, d1) : '';
ok(/\/\* \(판 서 · ctrlimp3\)/.test(BEO) && !/\b(alert|confirm|prompt)\s*\(/.test(BEO) && !/FieldValue|\.batch\(|\.set\(\{/.test(BEO), '판 서 덩이 · 브라우저 창 없음 · 쓰기 없음');
{ const names = ['slChLag', 'slChLagAny', 'slChLagTxt']; const dup = names.filter((n) => (T.match(new RegExp(`function ${n}\\s*\\(`, 'g')) || []).length !== 1); ok(!dup.length, '새 이름 한 번만 선언', dup); }
const REL = [
  { sc: '9000001', n: 12, moves: 7, lastAt: new Date().toISOString(), lagSum: 120, lagN: 6 }, // 평균 20분 → ⚡
  { sc: '9000002', n: 9, moves: 3, lastAt: new Date().toISOString(), lagSum: 600, lagN: 4 }, // 평균 150분 → 아님
  { sc: '9000003', n: 5, moves: 2, lastAt: new Date().toISOString(), lagSum: 10, lagN: 2 }, // 2번 → 아직 모름
  { sc: '9000004', n: 4, moves: 1, lastAt: new Date().toISOString() }, // 칸 없음 → 아직 모름
  { sc: '9000005', n: 20, moves: 9, lastAt: new Date().toISOString(), lagSum: 135, lagN: 3 } ]; // 평균 45분 → ⚡
let CFG = { fastLagMin: 60 };
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, Promise, Error, isFinite, setTimeout: () => 0,
  S: { tab: 'sellers', limit: 30 }, window: {}, document: { addEventListener: () => {}, getElementById: () => null },
  esc: (s) => String(s), errKo: (e) => String(e), toast: () => {}, renderMain: () => {}, renderTabs: () => {}, $: () => null,
  memo: (k, fn) => fn(), norm: (s) => String(s || ''), num: (n) => String(n), won: (n) => n + '원',
  slObsCfg: () => CFG, slObsSc: (s) => String(s.id || '').replace(/^sc_/, ''),
  db: { collection: () => ({ get: async () => ({ docs: [] }), where: () => ({ get: async () => ({ docs: [] }) }) }) } };
vm.createContext(ctx);
vm.runInContext("var OUR_SC = '996008'; var PHONE_THIN = false;\n" + BEO + '\nthis.F = { SLCH_CHIPS, slChOn, slChFilter, slChWhy, slChBar, slChLag, slChLagAny, slChLagTxt, chRelSt };', ctx);
const F = ctx.F;
const setRel = (list) => Object.assign(F.chRelSt(), { list, map: new Map(list.map((r) => [String(r.sc), r])), at: Date.now() });
setRel(REL);
const FAST = F.SLCH_CHIPS.find((c) => c[0] === 'fast');
ok(!!FAST && FAST[1] === '⚡ 빨리 따라 내림', '⚡ 빨리 따라 내림 칩이 추격 칩 끝에 있음');
{ const V = (sc) => FAST[3](ctx.S._chRel.map.get(sc)); const exp = [['9000001', true], ['9000002', false], ['9000003', null], ['9000004', null], ['9000005', true], ['9000009', false]];
  const wrong = exp.filter(([sc, v]) => V(sc) !== v).map(([sc, v]) => [sc, v, V(sc)]); ok(!wrong.length, '판정 — 문턱 60분 아래만 · 3번 아래·칸 없음은 아직 모름 · 관계 없음은 아님', wrong);
  CFG = { fastLagMin: 30 }; ok(V('9000001') === true && V('9000005') === false, '문턱을 30분으로 바꾸면 45분은 빠짐'); CFG = { fastLagMin: 60 }; }
{ const SL = ['9000001', '9000002', '9000003', '9000004', '9000005', '9000009'].map((sc) => ({ id: 'sc_' + sc }));
  F.slChOn().push('fast'); ok(F.slChFilter(SL).map((s) => s.id).join() === 'sc_9000001,sc_9000005', '⚡ 칩 — 빠른 순(평균 20분 → 45분)', F.slChFilter(SL).map((s) => s.id));
  const w = F.slChWhy({ id: 'sc_9000002' }); ok(/따라 내림 평균 2\.5시간\(4번\)/.test(w), '판매자 줄에 따라 내림 평균', w);
  ok(!/따라 내림 평균/.test(F.slChWhy({ id: 'sc_9000004' })), '칸 없으면 평균 안 보임');
  const bar = F.slChBar(SL); ok(/data-slch="fast">⚡ 빨리 따라 내림 2/.test(bar) && !/자료 쌓는 중/.test(bar), '자료가 있으면 칩에 수(2)', bar.match(/data-slch="fast">[^<]*(<small[^>]*>[^<]*<\/small>)?/));
  F.slChOn().length = 0; }
ok(F.slChLagTxt(20) === '20분' && F.slChLagTxt(150) === '2.5시간' && F.slChLagTxt(2880) === '2일', '시간 글(분·시간·일)');
setRel(REL.map((r) => { const { lagSum, lagN, ...x } = r; return x; }));
{ ok(F.slChLagAny() === false, '어느 관계에도 칸이 없음'); const bar = F.slChBar([{ id: 'sc_9000001' }]); ok(/data-slch="fast">⚡ 빨리 따라 내림<small class="hint"> 자료 쌓는 중<\/small>/.test(bar), '자료가 없으면 「자료 쌓는 중」'); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
