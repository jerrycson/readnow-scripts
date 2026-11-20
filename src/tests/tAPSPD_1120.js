// tAPSPD_1120 — (11/20 리드 · 정범님 I-1120-1027-15 「확정건을 샵매니저에 반영하는 시간을 두 배로 빨리 · 내가 언제든 고치게 · 추천 속도 표시」)
//   감시기 0.10.76: 반영 고리를 N줄(prd_system/pricing.applySpeed · 1~4 · 기본·추천 2)로 함께 처리
//   ① 설정 없음·이상한 값 → 2 · 1~4로 묶음 ② 같은 상품(key)은 한 줄에서 차례로 ③ 줄들이 실제로 함께 돎
//   ④ 멈춤(전체 정지·로그인 풀림)은 모든 줄을 세움 ⑤ 200건 넘으면 apMore ⑥ settle.last를 기다리기 전에 잡음
//   ⑦ 엔진 자동 반영 쉼은 줄 수만큼 늘림(전체 박자 그대로) ⑧ 알라딘 요청 간격 장치(PACE)는 하나 그대로 ⑨ 웹앱 칸·추천 2배 표시
// 실행: node src/tests/tAPSPD_1120.js · 가짜만 씀(Firestore·알라딘에 닿지 않음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = fs.readFileSync(path.resolve(__dirname, '..', '..', 'readnow-price-watch.user.js'), 'utf8');
const i0 = W.indexOf('  async function executeApproved() {'); const i1 = W.indexOf('\n  /* ── (0.7.0) 공개 반영 확인', i0); const EA = W.slice(i0, i1);
ok(i0 > 0 && i1 > i0, '반영 함수를 찾음');
(async () => {
  // ① 속도 값
  const hl = (W.match(/const APPLY_SPEED_DEF = 2, APPLY_SPEED_MAX = 4; const applyLanes = [^\n]*/) || [])[0];
  ok(!!hl, '① 속도 셈 줄이 있음(기본 2 · 상한 4)');
  const lanesOf = (SET) => new Function('SET', hl + '; return applyLanes();')(SET);
  ok(lanesOf({}) === 2 && lanesOf(null) === 2 && lanesOf({ applySpeed: 'x' }) === 2 && lanesOf({ applySpeed: 0 }) === 2, '① 설정 없음·이상한 값 → 2(추천)');
  ok(lanesOf({ applySpeed: 1 }) === 1 && lanesOf({ applySpeed: 3 }) === 3 && lanesOf({ applySpeed: 9 }) === 4 && lanesOf({ applySpeed: 2.4 }) === 2, '① 1·3 그대로 · 9 → 4 · 2.4 → 2');
  // ②③④⑤ 줄 나누기·함께 돌기 — 실제 줄을 떼어 가짜 one으로 돌림
  const qL = (EA.match(/\n    const lanesQ = \[\];[^\n]*/) || [])[0], lL = (EA.match(/\n    const lane = async \(\) => [^\n]*/) || [])[0], pL = (EA.match(/\n    await Promise\.all\(Array\.from\(\{ length: Math\.min\(APX\.lanes, lanesQ\.length\) \|\| 1 \}, lane\)\);/) || [])[0];
  ok(!!(qL && lL && pL), '줄 나누기·줄 돌기·함께 기다리기 세 줄을 떼어 냄');
  const run = async (docs, lanes, oneImpl) => { const g = { apMore: false }; const logs = [];
    await new Function('docs', 'APX', 'one', 'g', 'log', `return (async () => { let nDone = 0; let stop = false; let apMore = false; ${qL}${lL}${pL}; g.apMore = apMore; })();`)(docs, { halt: false, lanes }, (d) => oneImpl(d), g, (m) => logs.push(m));
    return g; };
  const D = (id, key) => ({ id, data: () => ({ key }) });
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  let live = 0, peak = 0; const seenK = {}; const order = [];
  const docs = [D('a1', 'A'), D('b1', 'B'), D('a2', 'A'), D('c1', 'C'), D('b2', 'B'), D('d1', 'D')];
  const t0 = Date.now();
  await run(docs, 2, async (d) => { const k = d.data().key; ok(!seenK[k] || seenK[k] === 'done', `② 같은 상품 ${k}는 겹쳐 돌지 않음(${d.id})`); seenK[k] = 'busy'; live++; peak = Math.max(peak, live); await nap(40); live--; seenK[k] = 'done'; order.push(d.id); });
  const el = Date.now() - t0;
  ok(peak === 2, '③ 2줄이 실제로 함께 돎(최대 동시 ' + peak + ')');
  ok(order.length === 6 && order.indexOf('a1') < order.indexOf('a2') && order.indexOf('b1') < order.indexOf('b2'), '② 같은 상품은 들어온 차례대로: ' + order.join(','));
  ok(el < 6 * 40 * 0.8, '③ 6건 × 40ms를 한 줄보다 빨리(' + el + 'ms)');
  live = 0; peak = 0; await run(docs, 1, async () => { live++; peak = Math.max(peak, live); await nap(5); live--; }); ok(peak === 1, '③ 1배면 예전처럼 한 건씩');
  let n4 = 0; const APXs = { halt: false };
  await new Function('docs', 'APX', 'one', 'log', `return (async () => { let nDone = 0; let stop = false; let apMore = false; ${qL}${lL}${pL} })();`)(docs.concat([D('e1', 'E'), D('f1', 'F')]), Object.assign(APXs, { lanes: 3 }), async () => { n4++; await nap(10); if (n4 >= 2) APXs.halt = true; }, () => {});
  ok(n4 <= 4, '④ 한 줄이 멈춤(halt)을 걸면 다른 줄도 새 건을 안 잡음(' + n4 + '건에서 멈춤)');
  const many = Array.from({ length: 230 }, (_, i) => D('m' + i, 'K' + i)); let n5 = 0;
  const g5 = await run(many, 2, async () => { n5++; });
  ok(g5.apMore === true && n5 === 200, '⑤ 200건까지만 하고 apMore(' + n5 + '건)');
  // 멈춤 길: continue 없이 return · 멈추는 return은 APX.halt
  const body = EA.slice(EA.indexOf('const one = async (d0) => {'), EA.indexOf('\n    const lane = async'));
  ok(!/\bcontinue\b/.test(body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')), '줄 안에 continue가 남지 않음(모두 return)');
  ok(/if \(stop \|\| SET\.killSwitch \|\| !isMine\(\)\) \{ APX\.halt = true; return; \}/.test(body) && (body.match(/로그인[^\n]{0,160}APX\.halt = true; return;/g) || []).length >= 3, '④ 전체 정지·감시 탭 바뀜·로그인 풀림은 모든 줄을 세움');
  // ⑥ settle.last
  ok(/const sP = settle\(d\.ref, x, \{[\s\S]*?\}, actDoc\); const aL = settle\.last; await sP; if \(VQ && aL\) VQ\.push\(\{ id: aL\.id, ref: aL, \.\.\.actDoc \}\);/.test(body) && !/VQ\.push\(\{ id: settle\.last/.test(body), '⑥ settle.last를 기다리기 전에 잡음(다른 줄이 덮지 못함)');
  { const settle = async () => { await nap(10); }; let vq = []; const one = async (id) => { const sP = (settle.last = { id }, settle()); const aL = settle.last; await sP; vq.push([id, aL.id]); }; await Promise.all([one('x'), one('y')]); ok(vq.every(([a, b]) => a === b), '⑥ 두 줄이 겹쳐도 확인 대기열에 제 기록이 들어감'); }
  // ⑦⑧
  ok(/await sleep\(GAP\(\(\(x\.approval \|\| \{\}\)\.decision === 'auto'\) \? 'auto' : null\) \* APX\.lanes\);/.test(body), '⑦ 엔진 자동 반영 쉼 × 줄 수(사람 확정만 빨라짐)');
  ok((W.match(/P\.makePacer\('aladin'\)/g) || []).length === 1 && /await PACE\.wait\(sleep, 1, true\); const r = await fetch\(P\.scmAction\.price/.test(body), '⑧ 알라딘 요청 간격 장치는 하나 그대로 · 줄마다 그 장치를 거침');
  ok(/\/\/ @version {6}0\.10\.(7[6-9]|[89]\d)/.test(W), '판 번호 0.10.76 뒤');
  // ⑨ 웹앱
  const A = fs.readFileSync(path.resolve(__dirname, '..', 'app.html'), 'utf8');
  ok(/id="pr_aspd" min="1" max="4"/.test(A) && /추천 2배/.test(A) && /샵매니저 반영 속도/.test(A), '⑨ 웹앱 가격 감시 카드에 속도 칸(1~4)·추천 2배 표시');
  const cardHead = A.slice(A.indexOf('id="pr_aspd"') - 2000, A.indexOf('id="pr_aspd"'));
  ok(!/<details class="prmore"/.test(cardHead.slice(cardHead.lastIndexOf('<div class="brow"'))), '⑨ 속도 칸은 접힌 설정 안이 아니라 바로 보임');
  ok(/w\(\{ applySpeed: v \}\)/.test(A) && /if \(!\(v >= 1 && v <= 4\)\) return toast\(/.test(A), '⑨ 저장은 prd_system/pricing.applySpeed · 1~4 밖은 막음(팝업 없음)');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
