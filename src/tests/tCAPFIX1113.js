/* tCAPFIX1113 — 11/13 09:03 로거 '🛡 이번 달 테더링 상한(242.63GB) 도달 — 다음 달까지 쉼' 거짓 글 고침 시험 · 도우미 1.8.25 · 수집기 capWhyOf
 *  사실: 이달 테더링 58GB / 모든 휴대폰 합 상한 242.63GB — 닫힌 까닭은 '휴대폰 1의 오늘 몫(수집기 /phcap lim)'인데, 도우미가 capWhy를 보내지 않아 수집기가 '이번 달 상한'으로 적었음
 *  ① 도우미(시험 모드): 휴대폰 1만 꽂힘 · 오늘 몫 닿음(lim = 지금 사용량) → capped true · capWhy 'phoneDay'
 *  ② 수집기 capWhyOf·tgateCalc: capWhy 없는 옛 도우미도 숫자(capUsed < capBytesPlan · 지금 휴대폰 used < capGB)로 'phoneDay' → '오늘 몫 … 내일 0시' 글 · 진짜 이달 상한이면 'month'
 *  ③ 0시 자동 회차 글 = '🎯 오늘 바퀴 시작(⏰ 0시 회차)' · 손으로 누른 것만 '강제 실행'
 * 실행: node src/tests/tCAPFIX1113.js (서버·브라우저 필요 없음 · 127.0.0.1의 빈 포트 하나만 씀) */
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'local/readnow-local.js')));
const SRC = path.join(R, 'local/readnow-local.js');
const CSRC = fs.existsSync(path.join(R, 'src/readnow-collector.src.js')) ? path.join(R, 'src/readnow-collector.src.js') : path.join(R, 'readnow-collector.user.js');
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const G = 1073741824;
const P1 = 'USB\\VID_04E8&PID_6863\\AAAA0001', P2 = 'USB\\VID_04E8&PID_6863\\BBBB0002';
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tcapfix_')); const LOC = path.join(HOME, 'local'); fs.mkdirSync(LOC);
const PORT = 19600 + Math.floor(Math.random() * 1500);
const TF = path.join(HOME, 'fake.json');
const base = {
  ifaces: [{ name: '이더넷', ip: '192.168.0.10', desc: 'Realtek PCIe GbE' }, { name: '휴대폰 테더링', ip: '10.99.73.178', desc: 'Remote NDIS based Internet Sharing Device' }],
  hw: { '이더넷': { id: 'PCI\\VEN_10EC&DEV_8168\\X' }, '휴대폰 테더링': { id: P1 } },
  pubip: { '192.168.0.10': '125.1.1.1', '10.99.73.178': '39.7.7.7' },
  mobile: { '39.7.7.7': { mobile: true, isp: 'SKT' }, '125.1.1.1': { mobile: false, isp: 'KT 유선' } },
  speed: { [P1]: { rtt: 40, mbps: 20.7, bytes: 3e6, ms: 1100 } }, defaultIp: '192.168.0.10' };
fs.writeFileSync(TF, JSON.stringify(base));
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷', netRetryMin: 0.02, speedEveryMin: 5, capGB: 120, phCap1024: 'x', phName1026: 'x',
  phones: { [P1]: { name: '휴대폰 1 · 기존', capGB: 120, order: 1 }, [P2]: { name: '휴대폰 2 · 새', capGB: 120, order: 2 } } }));
const get = (p, h) => new Promise((res, rej) => { const rq = http.get({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: '127.0.0.1:' + PORT, ...(h || {}) }, timeout: 4000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res({ raw: b }); } }); }); rq.on('error', rej); rq.on('timeout', () => { rq.destroy(); rej(new Error('timeout')); }); });
const st = () => get('/status');
const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { try { const s = await st(); if (f(s)) return s; } catch (e) {} await sleep(250); } return st().catch(() => ({})); };
const phcap = (l1) => get('/phcap?d=' + encodeURIComponent(JSON.stringify({ [P1]: { lim: l1, sim: 'p1', name: '휴대폰 1 · 기존' } })), { 'X-RN-Meter': '1' });
let child = null; let out = ''; const L = fs.readFileSync(SRC, 'utf8'); const C = fs.readFileSync(CSRC, 'utf8');
(async () => {
  ok(/const VERSION = '1\.8\.(2[5-9]|[3-9]\d)'/.test(L), '⓪ 도우미 판 1.8.25 이상');
  ok(/capWhy: capWhyNow\(\)/.test(L), '⓪ 도우미 /status에 capWhy');
  /* ① 도우미 */
  try {
    child = cp.spawn(process.execPath, [SRC], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
    let s = await until((x) => x.tether && x.tether.ok, 10000);
    ok(s.tether && s.tether.ok && s.capped === false && s.capWhy == null, '① 처음: 테더링 됨 · 닫히지 않음 · capWhy 없음 ' + JSON.stringify({ capped: s.capped, w: s.capWhy }));
    await phcap(0); /* 오늘 몫 닿음(지금 사용량 0 = lim 0) */
    s = await until((x) => x.capped === true, 8000);
    ok(s.capped === true && s.capWhy === 'phoneDay', '① 휴대폰 1 오늘 몫 닿음 → capped · capWhy phoneDay (이번 달 상한 아님) ' + JSON.stringify({ capped: s.capped, w: s.capWhy, cu: s.capUsed, cb: s.capBytesPlan }));
    ok(s.capUsed < s.capBytesPlan, '① 모든 휴대폰 합 이번 달 상한에는 안 닿음');
    /* ② 그 상태를 수집기 판정에 */
    const g = tgate(s);
    ok(g.capWhy === 'phoneDay' && /오늘 몫에 닿음/.test(g.why) && /내일 0시/.test(g.why) && !/다음 달까지 알라딘 일을 쉼/.test(g.why), '② 수집기 글 = 오늘 몫 · 내일 0시 (다음 달까지 쉼 아님) · ' + g.why);
  } catch (e) { bad++; console.log('  ❌ 도우미 오류', e && e.stack); }
  finally { try { child && child.kill(); } catch (e) {} }
  /* ② capWhy 없는 옛 도우미(1.8.23·1.8.24) 숫자 — 11/13 09:03 로거 값 그대로 */
  try {
    const H0 = { ok: true, tether: { ok: true }, capped: true, capGB: 242.63, capBytes: 257916758970, capBytesPlan: 257916758970, capUsed: 62759550269,
      phones: [{ id: 'p1', name: '휴대폰 1 · 기존', capGB: 120, used: 62106082745, active: true, lim: 62106082745 }, { id: 'p2', name: '휴대폰 2 · 새 120GB', capGB: 120, used: 2290, active: false }] };
    const a = tgate(H0); ok(a.capWhy === 'phoneDay' && /휴대폰 1 · 기존/.test(a.why) && /242\.63GB/.test(a.why) && !/다음 달까지 알라딘 일을 쉼/.test(a.why), '② 옛 도우미(capWhy 없음)·11/13 숫자 → 오늘 몫 · ' + a.why);
    const b = tgate({ ...H0, capUsed: 258e9 }); ok(b.capWhy === 'month' && /이번 달 테더링 상한\(242\.63GB\) 도달/.test(b.why), '② 진짜로 모든 휴대폰 합 상한에 닿으면 그대로 이번 달 상한 · ' + b.why);
    const c = tgate({ ...H0, phones: [{ ...H0.phones[0], used: 119 * G }] }); ok(c.capWhy === 'phoneMonth' && /한 달 상한에 닿음/.test(c.why), '② 지금 휴대폰이 제 상한(120GB의 99%)에 닿으면 phoneMonth · ' + c.why);
    const d = tgate({ ...H0, capWhy: 'month' }); ok(d.capWhy === 'month', '② 도우미가 capWhy를 주면 그것을 먼저 믿음');
    const e = tgate({ ok: true, tether: { ok: true }, capped: true, capGB: 48 }); ok(e.capWhy === 'month', '② 숫자가 하나도 없는 아주 옛 도우미는 예전 글 그대로(month)');
  } catch (e) { bad++; console.log('  ❌ 수집기 판정 오류', e && e.stack); }
  /* ③ 0시 회차 글 */
  try {
    const i = C.indexOf('const RUNLBL = '); ok(i > 0, '③ RUNLBL 있음');
    const src = C.slice(i, C.indexOf('})();', i) + 5).replace(/^const RUNLBL = /, 'return ');
    const lbl = (auto, slot, resume, xnow) => { const window = { __rnAuto: auto, __rnAutoSlot: slot }; return new Function('window', 'RESUME', 'XNOW', src)(window, resume, xnow); };
    const z = lbl(true, 'sl_bench@2026-11-13@s0000', false, false); ok(z && `🎯 ${z.a} 시작(${z.t})` === '🎯 오늘 바퀴 시작(⏰ 0시 회차)', '③ 0시 자동 = ' + (z && `🎯 ${z.a} 시작(${z.t})`));
    const r = lbl(true, 'sl_res@2026-11-13@s0800', true, false); ok(r && `${r.a}(${r.t})` === '이어 읽기(⏰ 8시 칸)', '③ 8시 이어 읽기 칸 = ' + (r && `${r.a}(${r.t})`));
    const h = lbl(true, 'x@2026-11-13@s2130', false, false); ok(h && h.t === '⏰ 21시 30분 회차', '③ 분이 있으면 분까지 ' + (h && h.t));
    ok(lbl(false, null, false, false) === null && lbl(undefined, 'x@d@s0000', false, false) === null, '③ 손으로 누른 실행(자동 아님) = null → 예전 그대로 \'강제 실행\'');
    ok(/RUNLBL \? `🎯 \$\{RUNLBL\.a\} 시작\(\$\{RUNLBL\.t\}\)/.test(C) && /`🎯 강제 실행 시작 — 주기와 상관없이 맨 처음 판매자부터/.test(C), '③ 시작 글: 자동이면 회차 이름 · 아니면 강제 실행');
  } catch (e) { bad++; console.log('  ❌ 회차 글 오류', e && e.stack); }
  if (bad) console.log(out.split('\n').slice(-30).join('\n'));
  try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {}
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
/* 수집기 원본에서 capWhyOf·tgateCalc를 떼어 와서 PUBONLY 로거로 돌림 */
function tgate(H) {
  const C = fs.readFileSync(CSRC, 'utf8'); const a = C.indexOf('  function capWhyOf(H)'); const b = C.indexOf('\n', C.indexOf('  function tgateCalc(H)')); const e = C.indexOf('\n', b + 1);
  const code = C.slice(a, e) + '\n }'; /* tgateCalc의 둘째 줄(테더링·상한)까지 — 함수 닫기를 덧붙임 */
  const f = new Function('PUBONLY', 'aladinLoggedHere', 'window', code + '\n return tgateCalc;')(true, () => false, {});
  return f(H);
}
