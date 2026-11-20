// tPWFAST_1120 — (11/20 리드 · 정범님 I-1120-0913-09) 수동 일괄 확정 뒤 샵매니저 반영이 한 건 1~5분으로 느려 「멈춘 듯」하던 것
//   ① 한 건 보낼 때마다 공개 확인(알라딘 목록 최대 5쪽 × 2권)을 하지 않음 — 5분에 한 번만(진짜 글을 떼어 가짜 시계로 돌림)
//   ② 반영 대기가 200건 넘게 남으면 apMore → 판정 바퀴가 상품마다 반영부터
//   ③ 웹앱 확정(manual)도 바로 깨움(onSnapshot 'in' approved·manual)
//   ④ 알라딘 간격 장치(PACE)·실행 문(xGate)·72시간·잠금 검사는 그대로
// 실행: node src/tests/tPWFAST_1120.js · 가짜만 씀(Firestore·알라딘에 닿지 않음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = fs.readFileSync(path.resolve(__dirname, '..', '..', 'readnow-price-watch.user.js'), 'utf8');
const i0 = W.indexOf('  async function executeApproved() {'); const i1 = W.indexOf('\n  /* ── (0.7.0) 공개 반영 확인', i0); const EA = W.slice(i0, i1);
ok(i0 > 0 && i1 > i0, '반영 함수를 찾음');
ok(!/await verifyStep\(2, 30000\)/.test(EA), '① 한 건마다 30초 공개 확인이 없어짐');
const gate = (EA.match(/if \(Date\.now\(\) - apVAt > AP_V_EVERY\) \{ apVAt = Date\.now\(\); await verifyStep\([^)]*\); \}/) || [])[0];
ok(!!gate, '① 공개 확인은 5분 문 안에서만');
// 진짜 글 조각을 가짜 시계로 — 반영 300건을 3초 간격으로 보내면(15분) 공개 확인은 3~4번만
(async () => {
  let now = 1e12, calls = 0; const RealNow = Date.now; Date.now = () => now;
  const verifyStep = async () => { calls++; }; let apVAt = 0; const AP_V_EVERY = (W.match(/const AP_V_EVERY = ([^;]+);/) || [])[1];
  ok(AP_V_EVERY === '5 * 60000', '① 문 간격 5분', AP_V_EVERY);
  const step = new Function('verifyStep', 'st', `return (async () => { let apVAt = st.v; const AP_V_EVERY = ${AP_V_EVERY}; ${gate} st.v = apVAt; })();`);
  const st = { v: apVAt }; for (let k = 0; k < 300; k++) { await step(verifyStep, st); now += 3000; }
  Date.now = RealNow;
  ok(calls >= 3 && calls <= 4, `① 300건(15분)에 공개 확인 ${calls}번(예전 300번)`);
  ok(/apMore = false; if \(!docs\.length\) return;/.test(EA) && /if \(\+\+nDone > 200\) \{ apMore = true;/.test(EA), '② 200건 넘게 남으면 apMore');
  ok(/if \(i % 10 === 9 \|\| apMore\) \{ await loadSet\(\); await executeApproved\(\); if \(i % 10 === 9\) await followUps\(5, true\); \}/.test(W), '② 판정 바퀴가 상품마다 반영부터');
  ok(/where\('approvalState', 'in', \['approved', 'manual'\]\)\.limit\(20\)\.onSnapshot\(/.test(W), '③ 웹앱 확정도 바로 깨움');
  ok(/await PACE\.wait\(sleep\); const r = await fetch\(P\.scmAction\.price/.test(EA), '④ 알라딘 간격 장치 그대로');
  ok(/if \(!\(await xGate\('price'\)\)\)/.test(EA) && /72 \* 3600e3/.test(EA) && /plkReadW\(x\)/.test(EA), '④ 실행 문·72시간·잠금 검사 그대로');
  ok(/stop = false; await executeApproved\(\); await verifyStep\(60, 4 \* 60000\);/.test(W), '④ 1분 차례의 공개 확인(60건·4분)은 그대로 — 확인이 멈추지 않음');
  ok(/\/\/ @version {6}0\.10\.74/.test(W), '판 번호 0.10.74');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
