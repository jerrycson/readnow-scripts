// 감시기 0.10.78 — 반영 멈춤 까닭 남기기·설정 다시 읽고 이어 감·한 건 3분 넘으면 건너뜀·공개 반영 확인 세밀 설정 (정범님 I-1120-1316-22·I-1120-1329-24·I-1120-1332-25)
const fs = require('fs'), path = require('path');
const S = fs.readFileSync(path.join(__dirname, '../../readnow-price-watch.user.js'), 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) bad++; };
(async () => {
  // ① apOk: 설정을 다시 읽어 이 탭이 맞으면 이어 감 · 아니면 까닭을 남기고 멈춤
  const L = (S.match(/\n    const apOk = async \(\) => [^\n]*/) || [])[0], W = (S.match(/\n    const apWhy = [^\n]*/) || [])[0];
  ok(!!L && !!W, '① 다시 확인(apOk)·까닭(apWhy) 줄이 있음');
  const mk = (st) => new Function('st', `let { stop, running, SET, PC, TAB } = st; const APX = { halt: false }; let haltWhy = '', okChk = 0; const isMine = () => SET.watchTab === TAB && SET.watchPc === PC; const loadSet = async () => { SET = st.fresh; }; ${W}${L}; return (async () => { const r = await apOk(); return { r, haltWhy, halt: APX.halt, stop }; })();`)(st);
  let o = await mk({ stop: true, running: false, SET: { watchPc: 'X', watchTab: 'b' }, PC: 'HOME', TAB: 'a', fresh: { watchPc: 'HOME', watchTab: 'a' } });
  ok(o.r === true && !o.halt && o.stop === false, '① 옛 설정으로 「내 탭 아님」이었어도 다시 읽어 내 탭이면 이어 감(멈춤 표시도 풀림)');
  o = await mk({ stop: false, running: false, SET: {}, PC: 'HOME', TAB: 'a', fresh: { watchPc: 'JS', watchTab: 'z' } });
  ok(o.r === false && o.halt && /감시 탭이 아님/.test(o.haltWhy), '① 정말 다른 탭이면 멈추고 까닭 「감시 탭이 아님」을 남김');
  o = await mk({ stop: false, running: false, SET: {}, PC: 'HOME', TAB: 'a', fresh: { watchPc: 'HOME', watchTab: 'a', killSwitch: true } });
  ok(o.r === false && /전체 정지/.test(o.haltWhy), '① 전체 정지면 그대로 멈춤(까닭 「전체 정지」)');
  o = await mk({ stop: true, running: true, SET: {}, PC: 'HOME', TAB: 'a', fresh: { watchPc: 'HOME', watchTab: 'a' } });
  ok(o.r === false && /멈춤 표시/.test(o.haltWhy), '① 사람이 멈춤 단추를 누른 바퀴(running 중 stop)는 풀지 않음');
  // ② 한 건 3분 넘으면 건너뜀 · 오류는 그 건만
  ok(/AP_ONE_MS = 3\s*\*\s*60000/.test(S) && /Promise\.race/.test(S) && /await apOne\(d0\)/.test(S), '② 한 건이 3분 넘으면 그 건만 건너뜀(줄 전체가 서지 않음)');
  ok(/반영 바퀴 끝/.test(S) && /멈춘 까닭/.test(S), '③ 바퀴마다 「반영 바퀴 끝 … 멈춘 까닭」 한 줄을 늘 남김(조용한 멈춤 없음)');
  // ④ 공개 반영 확인 세밀 설정
  const V = (S.match(/\n  const vCfg = [^\n]*/) || [])[0]; ok(!!V, '④ verifyCfg 읽는 줄');
  const vc = (c) => new Function('SET', V + '; return vCfg();')({ verifyCfg: c });
  ok(vc(undefined).max === 60 && vc(undefined).budgetMs === 240000, '④ 기본 60건·4분');
  ok(vc({ max: 500, budgetMin: 30 }).max === 200 && vc({ max: 500, budgetMin: 30 }).budgetMs === 600000 && vc({ max: 3, budgetMin: 0 }).max === 60, '④ 범위 밖은 자름(200·10분) · 너무 작으면 기본');
  ok(/sort\(\(a, b\) => vDueMs\(a\) - vDueMs\(b\)\)/.test(S), '④ 확인 때가 가장 오래 지난 것부터(숫자 비교)');
  ok(/RREF\.set\(\{ verify: \{/.test(S), '④ 바퀴마다 pricing_run.verify에 상태(기다림·때 지남·본 수·남은 수·늦은 분·초)');
  const vs = S.slice(S.indexOf('async function verifyStep('), S.indexOf('async function verifyStep(') + 6000);
  ok(/apWant \|\| apMore/.test(vs), '⑤ 반영 대기가 생기면 확인은 그 자리에서 비킴(샵매니저 반영 먼저)');
  ok(!/applyPrice|setPrice|prdEdit/.test(vs.slice(0, 600)), '⑤ 확인 설정 줄은 값을 바꾸지 않음(헌장 제45조 — 시장이 알아볼 때까지 다시 안 바꿈)');
  const H = (t) => (t.match(/^\/\/ @(match|grant|connect|require)[^\n]*$/gm) || []).join('\n');
  let main = ''; try { main = require('child_process').execSync('git show origin/main:readnow-price-watch.user.js', { cwd: path.join(__dirname, '../..'), encoding: 'utf8' }); } catch (e) {}
  ok(!main || H(main) === H(S), '⑥ 머리 줄(@match·@grant·@connect·@require)이 main과 같음');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
