// tPWFAST_1120 — (11/20 리드 · 정범님 I-1120-0913-09 · I-1120-0937-10) 샵매니저 반영을 언제나 맨 먼저
//   0.10.74: 한 건 보낼 때마다 공개 확인(알라딘 목록 최대 5쪽 × 2권)을 하던 것 → 없앰 · 200건 넘으면 apMore
//   0.10.75: ① 반영 중에는 공개 확인을 아예 안 함 · ② 반영 대기가 남는 동안 tick은 반영만 되풀이(확인·판정은 다 끝난 뒤)
//            ③ 새 확정이 들어오면(apWant) 공개 확인·판정 바퀴가 그 자리에서 비킴 · ④ 샵매니저로 보내는 요청은 알라딘 간격 장치의 '먼저 받기'(prio)
//            ⑤ 간격 자체·실행 문(xGate)·72시간·잠금 검사는 그대로
// 실행: node src/tests/tPWFAST_1120.js · 가짜만 씀(Firestore·알라딘에 닿지 않음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = fs.readFileSync(path.resolve(__dirname, '..', '..', 'readnow-price-watch.user.js'), 'utf8');
const i0 = W.indexOf('  async function executeApproved() {'); const i1 = W.indexOf('\n  /* ── (0.7.0) 공개 반영 확인', i0); const EA = W.slice(i0, i1);
ok(i0 > 0 && i1 > i0, '반영 함수를 찾음');
ok(!/verifyStep\(/.test(EA.replace(/\/\*[\s\S]*?\*\//g, '')), '① 반영 함수 안에 공개 확인이 없음(주석 빼고)');
ok(/apMore = false; apWant = false; if \(!docs\.length\) return;/.test(EA) && /if \(\+\+nDone > 200\) \{ apMore = true;/.test(EA), '② 200건 넘게 남으면 apMore');
ok(/stop = false; await executeApproved\(\); for \(let k = 0; apMore && k < 500 && !stop && !SET\.killSwitch && isMine\(\); k\+\+\) await executeApproved\(\);[^\n]*if \(apMore \|\| apWant\) return; await verifyStep\(60, 4 \* 60000\);/.test(W), '② tick은 반영 대기가 0이 될 때까지 반영만 · 그 뒤에 공개 확인');
ok(/quietNow\(\) \|\| apWant \|\| apMore\) break;/.test(W), '③ 공개 확인 고리가 새 확정에 비킴');
ok(/if \(i % 10 === 9 \|\| apMore \|\| apWant\) \{ await loadSet\(\); await executeApproved\(\);/.test(W), '③ 판정 바퀴도 상품마다 새 확정부터');
ok(/'added'\)\) return; apWant = true;/.test(W) && /where\('approvalState', 'in', \['approved', 'manual'\]\)\.limit\(20\)\.onSnapshot\(/.test(W), '③ 웹앱 확정이 들어오면 apWant');
ok(/await apPace\(\); const r = await fetch\(P\.scmAction\.price/.test(EA) && /const post = async \(url, body\) => \{ await apPace\(\);/.test(EA) && /const apPace = async \(\) => \{ const t = Date\.now\(\); await PACE\.wait\(sleep, 1, true\);/.test(EA), '④ 샵매니저 요청은 먼저 받기(prio)');
ok(/if \(!\(await xGate\('price'\)\)\)/.test(EA) && /72 \* 3600e3/.test(EA) && /plkReadW\(x\)/.test(EA), '⑤ 실행 문·72시간·잠금 검사 그대로');
// tick 흉내: 반영 대기 450건(한 번에 200) → 확인은 반영이 다 끝난 뒤 한 번
(async () => {
  let left = 450, order = []; let apMore = false, apWant = false; const SET = {}; const stop = false; const isMine = () => true;
  const executeApproved = async () => { const n = Math.min(200, left); left -= n; order.push('반영' + n); apMore = left > 0; };
  const verifyStep = async () => { order.push('확인'); };
  const line = (W.match(/stop = false; (await executeApproved\(\); for \(let k[^\n]*?await verifyStep\(60, 4 \* 60000\);)/) || [])[1];
  ok(!!line, 'tick 줄을 떼어 냄');
  await new Function('executeApproved', 'verifyStep', 'g', `return (async () => { let { apMore, apWant, SET, stop, isMine } = g; const ex = async () => { await executeApproved(); apMore = g.m(); }; ${line.replace(/await executeApproved\(\)/g, 'await ex()')} })();`)(executeApproved, verifyStep, { apMore, apWant, SET, stop, isMine, m: () => left > 0 });
  ok(order.join(',') === '반영200,반영200,반영50,확인', '반영 450건을 다 보낸 뒤에야 확인: ' + order.join(','));
  // PACE prio: 먼저 받기 표시가 있으면 보통 요청은 비킴(코어 그대로 씀)
  global.localStorage = (() => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; })();
  const PC = require(path.resolve(__dirname, '..', '..', 'readnow-products-core.js'));
  const P = (PC && PC.makePacer) ? PC : globalThis.ReadnowProducts; const pc = P.makePacer('t_prio');
  let t = 1e12; const RealNow = Date.now; Date.now = () => t; const sl = async (ms) => { t += ms; };
  const got = []; await pc.wait(sl, 1, true); got.push('반영'); const before = t; await pc.wait(sl); got.push('확인'); Date.now = RealNow;
  ok(got.join(',') === '반영,확인' && t - before >= 300, '④ 먼저 받기 뒤 보통 요청은 기다림(' + (t - before) + 'ms)');
  ok(/\/\/ @version {6}0\.10\.(7[5-9]|[89]\d|\d{3})/.test(W), '판 번호 0.10.75 뒤');
  const CS = fs.readFileSync([path.resolve(__dirname, '..', 'readnow-collector.src.js'), path.resolve(__dirname, '..', 'readnow-collector.user.js')].find((f) => fs.existsSync(f)), 'utf8'); /* 저장소에선 src/ 원본 · 시험 문지기 자리(pw)에선 ../readnow-collector.user.js가 원본 사본 */
  ok(/await PACE_P\.wait\(sleep\);[^\n]{0,200}await st\(3\); const ac = new AbortController\(\)/.test(CS) && /await PACE_P\.wait\(sleep\); sent = true;/.test(CS), '④ 수집기 대량 등록(올리기·등록 완료)도 먼저 받기');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
