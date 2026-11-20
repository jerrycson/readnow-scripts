// 0.10.79 — 샵매니저 화면의 옛 도구가 Array.from을 바꿔 둬도 반영 줄이 뜨는지 (정범님 I-1120-1316-22)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../readnow-price-watch.user.js'), 'utf8');
const i = src.indexOf('  async function executeApproved() {'), j = src.indexOf('\n  }\n', i) + 4;
const EA = src.slice(i, j); let bad = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) bad++; };
ok(!/Array\.from\(/.test(src), '감시기 본체에 Array.from이 없음(페이지가 바꿔 둔 함수에 기대지 않음)');
async function run(protoLike) {
  const AF = Array.from; if (protoLike) Array.from = function (it) { const r = []; for (let k = 0; k < it.length; k++) r.push(it[k]); return r; };
  try {
    let stop = false, running = false, apMore, apWant; const SET = { watchTab: 't', watchPc: 'HOME', applySpeed: 2 }, TAB = 't', PC = 'HOME';
    const isMine = () => SET.watchTab === TAB && SET.watchPc === PC, loadSet = async () => {}, unstick = async () => {}; const logs = [], log = (m) => logs.push(m);
    const mk = (n) => ({ id: 'd' + n, ref: { set: async () => {} }, data: () => ({ key: 'k' + n, approvalState: 'manual', title: 'b' + n, approval: { decision: 'batch', batchId: 'g', price: 1000, at: new Date().toISOString() } }) });
    const C = (n) => ({ where: (a, b, k) => ({ get: async () => ({ docs: n === 'prd_price_decisions' && k === 'manual' ? [mk(1), mk(2), mk(3)] : [] }) }), doc: () => ({ get: async () => ({ data: () => null }) }) });
    let claims = 0; const PXLC = null, pxlReadW = async () => ({ lock: false }), claim = async () => { claims++; return false; }, apSpdW = async () => {}, sleep = async () => {}, PACE = { wait: async () => {} }, W = () => ({}); const applyLanes = () => 2;
    eval(EA); await executeApproved(); void stop, running, apMore, apWant, PC, TAB; return { claims, logs };
  } finally { Array.from = AF; }
}
(async () => {
  const a = await run(false), b = await run(true);
  ok(a.claims === 3, `보통 브라우저: 3건 모두 맡음 (${a.claims})`);
  ok(b.claims === 3, `Array.from이 바뀐 화면(샵매니저): 3건 모두 맡음 (${b.claims}) — 0.10.78까진 0`);
  ok(b.logs.some((l) => /반영 바퀴 끝: 대기 3건 중 맡음 3/.test(l)), '바퀴 끝 줄에 맡음 3');
  const head = (s) => s.split('\n').filter((l) => /^\/\/ @(match|grant|connect|require)/.test(l)).join('\n');
  let mainSrc = ''; try { mainSrc = require('child_process').execSync('git show origin/main:readnow-price-watch.user.js', { cwd: path.join(__dirname, '../..') }).toString(); } catch (e) {}
  ok(!mainSrc || head(mainSrc) === head(src), '머리(@match·@grant·@connect·@require) main과 같음');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
