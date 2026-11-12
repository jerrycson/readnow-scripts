/* tTETH2_1112 — 정범님 11/12 테더링 휴대폰 두 대 · 🎁 여분 · 비율 하나 · 벤치 재편성
 *  ① AS.poolCalc: 11/12 기존 휴대폰 = 남은 양 ÷ 남은 날 · 새 휴대폰 11/13부터 72GB ÷ 18일 = 4GB · 여분 48GB 따로(남은 ÷ 남은 날) · 12월 = 120 ÷ 31 × 2 · 2028-02 윤년 29일
 *  ② 비율 하나(budget.mainPct 87.5 — 소수) · saveBudget이 mainPct·pool을 저장 ③ poolCaps — 평소 오늘 몫까지 · 벤치 한 바퀴 중엔 넘쳐 쓸 휴대폰 하나만 이번 달 남은 양
 *  ④ AS.budget이 pool이면 하루 몫·남은 몫을 휴대폰 합으로 ⑤ 도우미·수집기·클라우드 연결 글(여분 sm·sg · 속도 · 비율 · 네이버 와이파이 · teth1112)
 * 실행: node src/tests/tTETH2_1112.js (서버·브라우저 필요 없음) */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
require(path.join(R, 'readnow-autosched-core.js')); const RA = globalThis.ReadnowAuto; const AS = RA.AS; let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const G = 1073741824; const at = (s) => Date.parse(s + '+09:00'); const g2 = (b) => Math.round(b / G * 100) / 100;
const pool = { on: true, fb: 'p1', list: { p1: { name: '휴대폰 1 · 기존', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2 · 새', gb: 120, dev: 'USB\\B', order: 2 } }, month: { '2026-11': { p1: { from: '2026-11-09', remainGB: 88, dayUsedGB: 1.519 }, p2: { from: '2026-11-13', remainGB: 72 } } }, spare: { '2026-11': { gb: 48, from: '2026-11-12', phone: 'p2', pace: true } } };
const doc = { budget: { mainPct: 87.5, pool } };
const days = { '2026-11-09': { tether: 4.37 * G }, '2026-11-10': { tether: 4.01 * G }, '2026-11-11': { tether: 4.01 * G }, '2026-11-12': { tether: 3.69 * G, phones: { 'USB\\A': 3.69 * G } } };
const net = { capGB: 240, days, phones: [{ id: 'USB\\A', used: 50 * G, active: true, connected: true }, { id: 'USB\\B', used: 0, connected: true }], today: { key: '2026-11-12', tether: 3.69 * G, tiers: { main: 2.9 * G, gen: 0.75 * G }, phones: { 'USB\\A': 3.69 * G } } };
const a = AS.poolCalc(doc, net, at('2026-11-12T17:00:00'));
ok(g2(a.phones[0].share) === 4.06 && /÷ 19일/.test(a.phones[0].how), '① 11/12 기존 휴대폰 = 남은 77.14 ÷ 19일 = 4.06GB (' + a.phones[0].how + ')');
ok(a.phones[1].share === 0 && /11\/13부터/.test(a.phones[1].how), '① 11/12 새 휴대폰 하루 몫 0(11/13부터)');
ok(a.spare && g2(a.spare.day) === 2.53 && g2(a.spare.main) === 2.21 && !a.spare.later, '① 여분 오늘 48 ÷ 19 = 2.53GB(주요 2.21)');
ok(a.pct === 87.5 && g2(a.main) === 3.55, '② 비율 87.5% → 주요 3.55GB');
const b = AS.poolCalc(doc, { ...net, today: { key: '2026-11-13', tether: 0, tiers: {} }, days: { ...days, '2026-11-12': { tether: 3.69 * G, phones: { 'USB\\A': 3.69 * G }, tiers: { sm: 0.5 * G } } } }, at('2026-11-13T09:00:00'));
ok(g2(b.phones[1].share) === 4 && g2(b.share) === 8.08, '① 11/13 새 휴대폰 72 ÷ 18 = 4GB · 합 ' + g2(b.share) + 'GB');
ok(g2(b.spare.left0) === 47.5 && g2(b.spare.day) === 2.64, '① 여분 — 어제 쓴 여분 0.5GB 빼고 47.5 ÷ 18 = 2.64GB');
const c = AS.poolCalc(doc, { ...net, days: {}, today: { key: '2026-12-05', tether: 0, tiers: {} } }, at('2026-12-05T09:00:00'));
ok(g2(c.share) === 7.74 && !c.spare && /÷ 31일/.test(c.phones[0].how), '① 12월 = 120 ÷ 31 × 2 = 7.74GB · 여분 없음');
const f = AS.poolCalc(doc, { ...net, days: {}, today: { key: '2028-02-10', tether: 0, tiers: {} } }, at('2028-02-10T09:00:00'));
ok(g2(f.phones[0].share) === 4.14 && /÷ 29일/.test(f.phones[0].how), '① 2028-02 윤년 29일 — 120 ÷ 29 = 4.14GB');
const f2 = AS.poolCalc(doc, { ...net, days: {}, today: { key: '2027-02-10', tether: 0, tiers: {} } }, at('2027-02-10T09:00:00')); ok(g2(f2.share) === 8.57, '① 2027-02 28일 — 합 8.57GB');
ok(AS.pctOf({ budget: { mainPct: 87.5 } }) === 87.5 && AS.budgetOf({ budget: { mainPct: 87.5, tempMain: false } }).mainPct === 87.5, '② 비율 소수 그대로(87.5)');
(async () => { let saved = null; await RA.saveBudget({ cfgRef: { set: async (x) => { saved = x; } }, editsRef: () => ({ set: async () => {} }), arrayUnion: (...x) => x }, { mainPct: 80, pool: { list: { p2: { dev: 'X' } } }, junk: 1 }, 't');
  ok(saved && saved.budget.mainPct === 80 && saved.budget.pool && !('junk' in saved.budget), '② saveBudget이 mainPct·pool을 저장(예전엔 mainPct가 빠져 저장 안 됨)');
  const cp = AS.poolCaps(a, { must: false }); ok(Math.round(cp['USB\\A'].lim / G * 100) / 100 === Math.round((50 + Math.max(0, a.phones[0].left / G)) * 100) / 100, '③ 평소 기존 휴대폰 상한 = 이달 사용량 + 오늘 남은 몫');
  ok(cp['USB\\B'] && cp['USB\\B'].lim > 2 * G, '③ 여분 휴대폰(새)은 오늘 여분까지 열림');
  const cm = AS.poolCaps(a, { must: true }); ok(cm['USB\\B'].lim > 40 * G && cm['USB\\A'].lim < 51 * G, '③ 벤치 한 바퀴 중 — 넘쳐 쓸 휴대폰은 여분 휴대폰(새) 하나만 이번 달 남은 양');
  const bu = AS.budget({ budget: { mainPct: 87.5, pool, ovr: { mk: '2026-11', from: '2026-11-09', remainGB: 88, dayGB: 4, mainGB: 3.5, dayUsedGB: 1.519 } } }, { ...net, capGB: 122 }, at('2026-11-12T17:00:00'));
  ok(bu && bu.pool && bu.strict && bu.strict.pool && g2(bu.strict.share) === 4.06 && bu.strict.pct === 87.5, '④ budget — pool이면 하루 몫 4.06GB · 비율 87.5% (ovr 3.5GB 고정 대신)');
  const L = fs.readFileSync(path.join(R, 'local/readnow-local.js'), 'utf8'); const C = fs.readFileSync(fs.existsSync(path.join(R, 'src/readnow-collector.src.js')) ? path.join(R, 'src/readnow-collector.src.js') : path.join(R, 'readnow-collector.user.js'), 'utf8'); const K = fs.readFileSync(path.join(R, 'cloud/index.js'), 'utf8');
  ok(/add\('sm', b1\)/.test(L) && /sg: u\.searchParams\.get\('sg'\)/.test(L), '⑤ 도우미 — 여분 sm·sg 따로 셈');
  ok(/speed\.cloudflare\.com/.test(L) && /\/speedtest/.test(L) && /\/pctset/.test(L) && /1\/3 이하/.test(L), '⑤ 도우미 — 휴대폰별 속도·견주기·비율 바꾸기');
  ok(/'naver\.com', 'naver\.net'/.test(L), '⑤ 도우미 — 네이버는 늘 와이파이');
  ok(/function dashHtml/.test(L) && /details class=\\?"more/.test(L), '⑤ 도우미 첫 화면 개편(카드 · 자세히 접기)');
  ok(/function poolTick/.test(C) && /METC\[spT\(tierOfKey\(k\)\)\]/.test(C) && /&sm=\$\{s1\}&sg=\$\{s2\}/.test(C), '⑤ 수집기 — 휴대폰 두 대·여분 부류');
  ok(/async function teth1112/.test(K) && /TETH_MAIN/.test(K) && /spareEnd1112/.test(K), '⑤ 클라우드 — 한 번만 teth1112 · 12/1 원래대로');
  const hd = C.slice(0, C.indexOf('==/UserScript==')); ok(!/teth|pool/i.test(hd), '⑤ 수집기 머리는 그대로');
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0); })();
