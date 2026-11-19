// tHM_F — (hmf1 11/19 판 F · 정범님 I-1119-2051-30 · 설계 reports/CTRLKPI1_1119.md 8장·9장 판 F) 공용 열 지도 + 색 눈금 + 범례
//  ① 글: HM-START/END 덩어리가 pxHeatSvg 바로 앞 · 함수 다섯 · 색 사다리 상수 한 곳(밝은·어두운 7색씩) · rn-hm try/catch · CSS .hm* · 옛 부르는 곳 그대로 · 브라우저 창 없음
//  ② 순수 함수(node vm): 분위수 경계(같은 값 많으면 단계 줄어듦 · 칸 40 아래 5단계) · 0/없음 구분 · 튀는 값 하나에도 아래 칸들이 서로 다른 단계 · 평균 대비 기대치 셈
//     · 표본 3 아래 표시(평균 대비에선 색 없음) · 옛 pxHeatSvg(wd) 그대로 그려짐 · 직선 95% 자르기 ▲ · 줄마다 합·평균 · 눈금 붙들기 📌 · 날 수 60 넘으면 평균 대비 권함 · 칸 너비 규칙 · 기억 실패해도 그려짐
//  ③ 화면(RN_PORT): 방문 구분 › 🕘 시간대 창에 새 열 지도 · 색 기준 바꿔도 창이 안 닫히고 기억(rn-hm) · 범례 칸 → 그 단계만 짙게 · 칸 → 아래 한 줄 · 어두운 화면 색
// 실행: node tHM_F.js(①②) · pw/ 안 RN_PORT=<포트> node tHM_F.js(③까지) · 시험 자료는 가짜 수만
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
const a = T.indexOf('/* HM-START'), b = T.indexOf('/* HM-END */'); const HM = a > 0 && b > a ? T.slice(a, b) : '';
ok(HM.length > 0, 'HM-START·HM-END 덩어리');
ok(/^\/\* HM-END \*\/\n\/\*[^\n]*\*\/\nfunction pxHeatSvg\(wd, o\)/.test(T.slice(b)), '덩어리 바로 뒤가 pxHeatSvg(설명 한 줄 + 껍데기)');
for (const fn of ['hmStat', 'hmStep', 'hmSvg', 'hmLegend', 'hmBar']) ok(new RegExp('function ' + fn + '\\(').test(HM), '함수 ' + fn);
ok(/const HM_SEQ = \{ lt: \[('#[0-9a-f]{6}',? ?){7}\], dk: \[('#[0-9a-f]{6}',? ?){7}\] \}/.test(HM) && /const HM_DIV = \{ lt: \[('#[0-9a-f]{6}',? ?){7}\], dk: \[('#[0-9a-f]{6}',? ?){7}\] \}/.test(HM), '색 사다리 HM_SEQ·HM_DIV 한 곳(밝은·어두운 7색씩)');
ok(/HM_DEV_B = \[0\.5, 0\.7, 0\.9, 1\.1, 1\.4, 2\.0\]/.test(HM), '평균 대비 경계 0.5·0.7·0.9·1.1·1.4·2.0');
ok(/localStorage\.getItem\('rn-hm'\)/.test(HM) && /localStorage\.setItem\('rn-hm'/.test(HM) && /function hmGet\(id\) \{ try \{/.test(HM) && /function hmSet\(id, patch\) \{ try \{/.test(HM), '고른 값 rn-hm(읽기·쓰기 try/catch)');
ok(/:root\[data-theme="dark"\] \.hm /.test(HM), '어두운 화면 색(hmCss · data-theme="dark")');
ok(/^\/\* \(hmf1 11\/19 판 F\) 공용 열 지도 \.hm\*[^\n]*\.hm\{[^\n]*:root\[data-theme="dark"\] \.hm-b\{/m.test(T), 'CSS .hm* 한 줄(밝은·어두운)');
ok(/\$\{pxHeatSvg\(R\.wd\)\}/.test(T), '옛 부르는 곳 pxHeatSvg(R.wd) 그대로');
{ const sh = T.slice(b, b + 2500); ok(/return hmSvg\(/.test(sh) && /cls: 'pxheat'/.test(sh) && /label: '요일과 시각별 사람 조회'/.test(sh), '껍데기는 hmSvg를 부르고 .pxheat·읽어 주는 이름을 지킴'); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(HM), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(HM), '전화번호 모양 없음');
ok(!/Math\.(sqrt|log)\(/.test(HM), '제곱근·로그 눈금은 넣지 않음(설계 추천 밖 · 덩어리 머리글에 까닭)');

console.log('② 순수 함수');
const store = {}; let lsBroken = false;
const localStorage = { getItem: (k) => { if (lsBroken) throw new Error('막힘'); return k in store ? store[k] : null; }, setItem: (k, v) => { if (lsBroken) throw new Error('막힘'); store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const ctx = { console, localStorage, innerWidth: 1280 }; vm.createContext(ctx);
const pre = `const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const num = (n, d = 0) => (n == null || !Number.isFinite(n) ? '-' : new Intl.NumberFormat('ko-KR', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n));`;
const shellEnd = T.indexOf('\n', T.indexOf('\n', T.indexOf('function pxHeatSvg(wd, o)') + 1) + 1); const shellEnd2 = T.indexOf('\n', shellEnd + 1);
const CODE = T.slice(a, shellEnd2);
vm.runInContext(pre + CODE + '; this.X = { hmStat, hmStep, hmSvg, hmLegend, hmBar, hmExpect, hmDevStep, hmCi, hmGet, hmSet, pxHeatSvg, HM_SEQ, HM_DIV, HM_ZERO };', ctx);
const X = ctx.X; const J = (v) => JSON.parse(JSON.stringify(v));
// 분위수 경계
{ const v = Array.from({ length: 70 }, (_, i) => i + 1); const s = J(X.hmStat(v)); ok(s.k === 7 && s.q.join(',') === '10,20,30,40,50,60' && s.n === 70, '분위수 7단계 경계(1~70 → 10·20·…·60)', s);
  ok(v.map((x) => X.hmStep(x, s.q)).filter((x, i, A) => A.indexOf(x) === i).length === 7 && X.hmStep(10, s.q) === 1 && X.hmStep(11, s.q) === 2 && X.hmStep(70, s.q) === 7, '단계 번호 1..7(경계 값은 아래 단계)');
  const s5 = J(X.hmStat(Array.from({ length: 20 }, (_, i) => i + 1))); ok(s5.k === 5 && s5.q.join(',') === '4,8,12,16', '칸 40 아래면 5단계', s5);
  const eq = J(X.hmStat([...Array(50).fill(1), ...Array(10).fill(2)])); ok(eq.k === 2 && eq.q.join(',') === '1', '같은 값이 많으면 겹친 경계를 합쳐 단계가 줄어듦(7 → 2)', eq);
  const one = J(X.hmStat(Array(45).fill(3))); ok(one.k === 1 && one.q.length === 0, '모두 같은 값이면 1단계', one);
  const lg = X.hmLegend(eq.q, 'q', '번', { k: eq.k, max: 2 }); ok((lg.match(/class="hm-li" data-hml="[12]"/g) || []).length === 2 && /~1/.test(lg) && /1 넘음/.test(lg), '범례도 단계 수만큼(2칸 · 실제 경계 수)', lg.slice(0, 300));
  ok(X.hmCi(1, 2) === 1 && X.hmCi(2, 2) === 7 && X.hmCi(1, 1) === 4 && X.hmCi(3, 5) === 4, '단계가 적으면 사다리 양 끝까지 벌림'); }
// 0과 없음
{ const s = J(X.hmStat([0, 0, null, undefined, NaN, 3, 5])); ok(s.zeros === 2 && s.miss === 3 && s.n === 2, '경계는 0보다 큰 칸만 · 0 수 · 없음 수 따로', s);
  ok(X.hmStep(0, [1]) === 0 && X.hmStep(null, [1]) === -1 && X.hmStep(undefined, [1]) === -1, 'hmStep: 0 → 0 · 없음 → -1');
  const h = X.hmSvg({ id: 'z', rows: [{ k: 0, lb: '가' }], cols: [{ k: 0, lb: 'ㄱ' }, { k: 1, lb: 'ㄴ' }, { k: 2, lb: 'ㄷ' }], val: (r, c) => [0, null, 4][c.k], w: 400 });
  ok(/data-s="0"[^>]*><title>가 ㄱ · 값 0<\/title><rect class="hm-z"[^>]*fill="#F1EEF5"/.test(h), '0 칸 = 옅은 회보라 #F1EEF5', h.slice(0, 1500));
  ok(/data-s="x"[^>]*><title>가 ㄴ · 자료 없음<\/title><rect class="hm-x"[^>]*fill="url\(#hmx\d+\)"/.test(h) && /<pattern id="hmx\d+"/.test(h), '없음 칸 = 빗금 무늬(0과 다름)');
  ok(/data-hml="0"><i class="hm-z"><\/i>0</.test(h) && /data-hml="x"><i class="hm-xs"><\/i>자료 없음/.test(h), '범례에 「0」「자료 없음」 두 칸'); }
// 튀는 값 하나
{ const v = []; for (let i = 0; i < 60; i++) v.push(1 + (i % 6)); v.push(40); const s = J(X.hmStat(v)); const st = [1, 2, 3, 4, 5, 6].map((x) => X.hmStep(x, s.q));
  ok(new Set(st).size === 6 && X.hmStep(40, s.q) === 7, '튀는 값 하나(40)에도 1~6이 서로 다른 단계', { s, st });
  const lin = 0.12 + 0.88 * (6 / 40); ok(lin < 0.3, '(견줌) 옛 직선 투명도라면 6도 0.25로 뭉침', lin); }
// 평균 대비 기대치
{ const e = X.hmExpect([[1, 2], [3, 6]]); ok(e(0, 0) === 1 && e(0, 1) === 2 && e(1, 0) === 3 && e(1, 1) === 6, '기대 = 줄 평균 × 칸 평균 ÷ 전체 평균(곱 꼴 자료면 값과 같음)');
  const e2 = X.hmExpect([[2, null], [4, 8]]); ok(Math.abs(e2(0, 0) - (2 * 3) / (14 / 3)) < 1e-9 && Math.abs(e2(1, 1) - (6 * 8) / (14 / 3)) < 1e-9, '없음 칸은 평균에서 뺌', [e2(0, 0), e2(1, 1)]);
  ok([0, 0.49, 0.5, 0.69, 0.7, 0.9, 1, 1.09, 1.1, 1.39, 1.4, 1.99, 2, 9].map(X.hmDevStep).join(',') === '1,1,2,2,3,4,4,4,5,5,6,6,7,7', '두 색 7단계 경계(0.5·0.7·0.9·1.1·1.4·2.0)');
  const R = [{ k: 0, lb: '가' }, { k: 1, lb: '나' }], C = [{ k: 0, lb: 'ㄱ' }, { k: 1, lb: 'ㄴ' }], M = [[1, 1], [1, 5]];
  const h = X.hmSvg({ id: 'dv', mode: 'dev', rows: R, cols: C, val: (r, c) => M[r.k][c.k], cnt: () => 5, w: 400 });
  ok(/나 ㄴ · 값 5 · 있던 날 5 · 기대 4\.5 · 1\.11배<\/title><rect class="hm-d5"/.test(h) && /가 ㄱ · 값 1 · 있던 날 5 · 기대 0\.5 · 2\.00배<\/title><rect class="hm-d7"/.test(h) && /가 ㄴ · 값 1 · 있던 날 5 · 기대 1\.5 · 0\.67배<\/title><rect class="hm-d2"/.test(h), '평균 대비 칸 = 기대·배수 글 + 두 색 단계', h.slice(0, 2000));
  ok(/기대 = 줄 평균 × 칸 평균 ÷ 전체 평균/.test(h) && /평소\(0\.9~1\.1배\)/.test(h), '평균 대비 범례'); }
// 표본 3 아래
{ const R = [{ k: 0, lb: '가' }], C = [{ k: 0, lb: 'ㄱ' }, { k: 1, lb: 'ㄴ' }, { k: 2, lb: 'ㄷ' }];
  const h = X.hmSvg({ id: 'lo', rows: R, cols: C, val: (r, c) => [2, 3, 4][c.k], cnt: (r, c) => [2, 3, null][c.k], w: 400 });
  ok((h.match(/class="hm-lo"|class="hm-low"/g) || []).length === 1 && /가 ㄱ · 값 2 · 있던 날 2 · 있던 날 3 아래<\/title>/.test(h) && /◥ = 있던 날 3 아래/.test(h), '있던 날 3 아래 칸만 오른쪽 위 세모 + 범례 설명', h.slice(0, 1600));
  const d = X.hmSvg({ id: 'lo2', mode: 'dev', rows: [{ k: 0, lb: '가' }, { k: 1, lb: '나' }], cols: C, val: (r, c) => 1 + r.k + c.k, cnt: (r, c) => (r.k === 0 && c.k === 0 ? 1 : 9), w: 400 });
  ok(/있던 날 1 · 있던 날 3 아래라 색 없음<\/title><rect class="hm-nc"/.test(d) && (d.match(/class="hm-nc"/g) || []).length === 1, '평균 대비 보기에선 표본 3 아래 칸을 색칠하지 않음'); }
// 옛 부르는 곳
{ const wd = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (d === 3 && h === 14 ? 40 : h > 8 && h < 22 ? (h + d) % 6 : 0)));
  const h = X.pxHeatSvg(wd); const cells = (h.match(/<g class="hm-c"/g) || []).length; const rows = [...h.matchAll(/<text class="hm-lb" x="0"[^>]*>(.)<\/text>/g)].map((m) => m[1]).join('');
  ok(/<svg class="hm-svg pxheat" viewBox="0 0 \d+ \d+" role="img" aria-label="요일과 시각별 사람 조회"/.test(h) && cells === 168, '옛 pxHeatSvg(wd) 그대로 그려짐(.pxheat · 7×24 = 168칸)', { cells, head: h.slice(0, 300) });
  ok(rows === '월화수목금토일' && /<title>수요일 14시 · 합 40번<\/title>/.test(h) && /<title>월요일 0시 · 합 0번<\/title>/.test(h), '월~일 차례 · 칸 글 「수요일 14시 · 합 40번」', rows);
  ok(!/NaN|undefined/.test(h), '그림에 NaN·undefined 없음');
  ok(/class="hm-bar"/.test(h) && /class="hm-lg"/.test(h) && /class="hm-pk"/.test(h) && /data-hm="pxwd"/.test(h), '고르는 줄 · 범례 · 누른 칸 한 줄이 함께');
  const e = X.pxHeatSvg(Array.from({ length: 7 }, () => new Array(24).fill(0))); ok((e.match(/<rect class="hm-z"/g) || []).length === 168 && !/NaN/.test(e), '모두 0이어도 그려짐(0 칸 168)');
  const dn = wd.map((r) => r.map((_, h) => (h === 14 ? 2 : 4))); const m = X.pxHeatSvg(wd, { dayN: dn, id: 'pxwd2' });
  ok(/<title>수요일 14시 · 하루 평균 20번 · 있던 날 2 · 합 40 · 있던 날 3 아래<\/title>/.test(m), '껍데기에 있던 날 수를 주면 하루 평균 + 표본 표시(판 H가 쓸 길)', m.match(/<title>수요일 14시[^<]*/)); }
// 직선 95% 자르기 · 줄마다
{ const R = Array.from({ length: 4 }, (_, i) => ({ k: i, lb: 'r' + i })), C = Array.from({ length: 10 }, (_, j) => ({ k: j, lb: '' })); const val = (r, c) => (r.k === 0 && c.k === 0 ? 500 : 1 + ((r.k * 10 + c.k) % 9));
  const h = X.hmSvg({ id: 'ln', mode: 'lin', rows: R, cols: C, val, w: 500 }); ok((h.match(/>▲<\/text>/g) || []).length === 1 && /· 위 5%<\/title>/.test(h) && /▲ = 위 5%/.test(h), '직선 보기 = 95% 자르기 · 위 5% 칸에 ▲');
  const r = X.hmSvg({ id: 'rw', mode: 'row', rows: R, cols: C, val, w: 500 }); ok((r.match(/>합 [\d,]+ · 평균 [\d.,]+<\/text>/g) || []).length === 4 && /경계는 줄마다 다름/.test(r), '줄마다 = 줄 오른쪽에 합·평균'); }
// 눈금 붙들기 · 기억 · 권함
{ const R = [{ k: 0, lb: '가' }], C = Array.from({ length: 6 }, (_, j) => ({ k: j, lb: '' })); const o = { id: 'pn', rows: R, cols: C, val: (r, c) => c.k + 1, w: 400 };
  X.hmSet('pn', { pin: [2, 4] }); const h = X.hmSvg(o); ok(/📌 붙든 눈금 · 풀기/.test(h) && /~2</.test(h) && /~4</.test(h) && /4 넘음/.test(h) && /data-s="3"[^>]*><title>가 [^<]*값 5/.test(h), '눈금 붙들기 = 붙든 경계로 칠하고 범례에 📌', h.slice(-1200));
  X.hmSet('pn', { pin: null, mode: 'row' }); ok(J(X.hmGet('pn')).mode === 'row' && !('pin' in J(X.hmGet('pn'))) && /data-mode="row"/.test(X.hmSvg(o)), '고른 색 기준을 rn-hm에 화면 id마다 기억');
  lsBroken = true; const hb = X.hmSvg(o); lsBroken = false; ok(/data-mode="q"/.test(hb) && /<g class="hm-c"/.test(hb), '기기 저장이 막혀도 기본값(분위수)으로 그려짐');
  ok(/★권함/.test(X.hmBar({ id: 'x', mode: 'q', days: 61 })) && !/★권함/.test(X.hmBar({ id: 'x', mode: 'q', days: 60 })) && !/★권함/.test(X.hmBar({ id: 'x', mode: 'dev', days: 90 })), '날 수 60 넘으면 「평균 대비」에 권함 표시');
  const bar = X.hmBar({ id: 'x', mode: 'q', rowsOpt: [['d', '날'], ['w', '주']], rows: 'w', valOpt: [['s', '합'], ['a', '하루 평균']] }); ok(/data-hmo="rows" data-hmv="w">주/.test(bar) && /hm-b on" data-hmo="rows" data-hmv="w"/.test(bar) && /data-hmo="val"/.test(bar) && (bar.match(/data-hmm=/g) || []).length === 4, 'hmBar = 줄·칸·값 고르기 + 색 기준 넷'); }
// 칸 너비 규칙
{ const C24 = Array.from({ length: 24 }, (_, j) => ({ k: j, lb: '' })), R = [{ k: 0, lb: '월' }]; const cw = (h) => +(h.match(/<rect class="[^"]+" x="(\d+)"/g) || []).slice(0, 2).map((s) => +s.match(/x="(\d+)"/)[1]).reduce((p, x) => x - p);
  const wide = X.hmSvg({ id: 'w1', rows: R, cols: C24, val: () => 3, w: 1000, bare: true }); const narrow = X.hmSvg({ id: 'w2', rows: R, cols: C24, val: () => 3, w: 300, bare: true });
  ok(cw(wide) === Math.floor((1000 - 22 - 30) / 24) && />3<\/text>/.test(wide), '넓으면 칸 = (너비 − 이름 칸) ÷ 칸 수 · 26px 넘으면 칸 안에 수', cw(wide));
  ok(cw(narrow) === 18 && !/>3<\/text>/.test(narrow), '좁으면 칸 18 아래로 안 줄고 수는 title로', cw(narrow));
  const g = X.hmSvg({ id: 'w3', rows: Array.from({ length: 7 }, (_, i) => ({ k: i, lb: '' })), cols: Array.from({ length: 52 }, (_, j) => ({ k: j, lb: '' })), val: () => 1, cw: 11, ch: 11, bare: true }); ok(/width="9" height="9"/.test(g) && (g.match(/<g class="hm-c"/g) || []).length === 364, '52주×7 잔디 꼴은 칸 11×11');
  ok(X.hmSvg({ id: 'e', rows: [], cols: C24 }).includes('그릴 칸이 없음'), '줄·칸이 없으면 빈 안내'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tHM_F ${bad}개 실패` : '✓ tHM_F 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }

console.log('③ 화면');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const A = '530000001';
  await p.evaluate(async (A) => { S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const base = S.plist.get('aladin_U215983410'); S.plist.set('aladin_U91000', { ...base, id: 'aladin_U91000', usedCode: 'U91000', listingId: A, title: '열 지도 시험 책', status: '판매중', active: true });
    const now = Date.now(); const day = (k) => pxDay(now - k * 864e5);
    for (let k = 0; k < 12; k++) await db.collection('px_views').doc(A + '_' + day(k).replace(/-/g, '')).set({ lid: A, day: day(k), n: 3 + k, human: 3 + k, bot: 0, uniq: 2, lastKind: 'human', x: { hr: { [9 + (k % 8)]: 2 + k, 21: 1 } } });
    await db.collection('px_exp').doc(A).set({ lid: A, on: true, state: 'done', addedAt: new Date(now - 20 * 864e5).toISOString(), src: 'manual' }); localStorage.removeItem('rn-hm'); pxInit(); }, A);
  await p.waitForTimeout(1000); await p.evaluate(() => { S.px.P.f = 'all'; openPxExp(); }); await p.waitForTimeout(1200);
  await p.evaluate(() => { const d = document.querySelector('[data-pxbrk]'); if (d) { d.open = true; d.scrollIntoView(); } }); await p.waitForTimeout(400);
  await p.click('#px_brk [data-pxbg="hr"]'); await p.waitForTimeout(500);
  const look = () => p.evaluate(() => { const ov = document.querySelector('.pxgwov'); const hm = ov && ov.querySelector('.hm[data-hm="pxwd"]'); const svg = hm && hm.querySelector('svg.pxheat'); return { ov: !!ov, hm: !!hm, svg: !!svg, mode: svg && svg.dataset.mode, cells: hm ? hm.querySelectorAll('.hm-c').length : 0, lg: hm ? hm.querySelectorAll('.hm-lg .hm-li').length : 0, css: !!document.getElementById('hm-css'), w: svg ? Math.round(svg.getBoundingClientRect().width) : 0 }; });
  const r1 = await look(); ok(r1.ov && r1.hm && r1.svg && r1.cells === 168 && r1.lg >= 3 && r1.css && r1.mode === 'q', '🕘 시간대 창에 새 열 지도(분위수 · 범례 · 168칸)', r1);
  await p.click('.pxgwov .hm [data-hmm="dev"]'); await p.waitForTimeout(200); const r2 = await look(); const ls = await p.evaluate(() => localStorage.getItem('rn-hm'));
  ok(r2.ov && r2.mode === 'dev' && /"pxwd":\{"mode":"dev"\}/.test(ls || ''), '색 기준을 바꿔도 창은 그대로 · rn-hm에 기억', { r2, ls });
  await p.click('.pxgwov .hm [data-hmm="q"]'); await p.waitForTimeout(200);
  const r3 = await p.evaluate(() => { const hm = document.querySelector('.pxgwov .hm'); const b = hm.querySelector('.hm-lg .hm-li[data-hml="1"]'); b.click(); const dim = hm.querySelectorAll('.hm-c.hm-dim').length, lit = hm.querySelectorAll('.hm-c:not(.hm-dim)').length, on = [...hm.querySelectorAll('.hm-c:not(.hm-dim)')].every((c) => c.dataset.s === '1'); b.click(); return { dim, lit, on, after: hm.querySelectorAll('.hm-c.hm-dim').length }; });
  ok(r3.dim > 0 && r3.lit > 0 && r3.on && r3.after === 0, '범례 칸을 누르면 그 단계 칸만 짙게 · 다시 누르면 풀림', r3);
  const r4 = await p.evaluate(() => { const hm = document.querySelector('.pxgwov .hm'); const c = [...hm.querySelectorAll('.hm-c')].find((x) => /21시/.test(x.querySelector('title').textContent) && x.dataset.s !== '0'); c.dispatchEvent(new MouseEvent('click', { bubbles: true })); return { pk: hm.querySelector('.hm-pk').textContent, sel: !!hm.querySelector('.hm-c.hm-sel'), ov: !!document.querySelector('.pxgwov') }; });
  ok(/요일 21시 · 합 \d+번/.test(r4.pk) && r4.sel && r4.ov, '칸을 누르면 아래 한 줄에 「요일 시각 · 합」(창은 안 닫힘)', r4);
  const r5 = await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); const hm = document.querySelector('.pxgwov .hm'); const r = hm.querySelector('rect.hm-s7') || hm.querySelector('rect[class^="hm-s"]'); const cls = r.getAttribute('class'); const f = getComputedStyle(r).fill; const z = getComputedStyle(hm.querySelector('rect.hm-z')).fill; document.documentElement.removeAttribute('data-theme'); const f2 = getComputedStyle(r).fill; return { cls, f, z, f2 }; });
  const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`; const ci = +(r5.cls.match(/hm-s(\d)/) || [])[1];
  ok(r5.f === rgb(X.HM_SEQ.dk[ci - 1]) && r5.z === rgb(X.HM_ZERO.dk) && r5.f2 === rgb(X.HM_SEQ.lt[ci - 1]), '어두운 화면(data-theme="dark")은 어두운 사다리 · 밝은 화면은 밝은 사다리', r5);
  await p.setViewportSize({ width: 380, height: 800 }); await p.waitForTimeout(200); const ov = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1); ok(ov, '폭 380에서 쪽 전체가 가로로 넘치지 않음');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(!(await p.evaluate(() => !!document.querySelector('.pxgwov'))), 'Esc로 창 닫힘(그대로)');
  ok(!errs.length, '페이지 오류 없음', errs);
  console.log(bad ? `❌ tHM_F ${bad}개 실패` : '✓ tHM_F 통과'); return bad ? 1 : 0; });
