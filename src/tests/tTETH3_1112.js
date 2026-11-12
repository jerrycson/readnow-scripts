/* tTETH3_1112 — 정범님 11/12 21시 로거 알라딘 막힘(새 휴대폰이 인터넷 안 되는데 그 휴대폰만 고름 · blocked 157) 고침 시험 · 도우미 1.8.22
 *  도우미(local/readnow-local.js)를 시험 모드(RN_TEST_FILE — 연결·공인 IP·장치 번호·속도를 흉내)로 띄워 /status로 봄
 *  ① 휴대폰 1(오늘 몫 닿음 · 수집기 /phcap) + 휴대폰 2(인터넷 없음) → 휴대폰 2를 '인터넷 없음'으로 두고 몇 초 안에 휴대폰 1로 이어 씀(tetherOk true)
 *  ② 인터넷 없음은 정한 간격(시험 0.02분)마다 다시 재어, 살아나면 다시 후보 → 몫이 남은 휴대폰 2로 돌아감
 *  ③ 휴대폰 목록에서 휴대폰이 아닌 연결(PCI 내장 · 'DESC:이더넷 2')은 뺌 · 다른 회사 USB 휴대폰(애플 05AC)은 그대로
 *  ④ 네이버는 늘 와이파이 · 알라딘은 늘 테더링(휴대폰 길) — 이어 쓰는 중에도
 *  ⑤ 속도 재기 — 30분마다 작게(500KB) · 6시간마다 3MB · 속도 실패 + 공인 IP 못 봄 = 인터넷 없음
 * 실행: node src/tests/tTETH3_1112.js (서버·브라우저 필요 없음 · 127.0.0.1의 빈 포트 하나만 씀) */
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'local/readnow-local.js')));
const SRC = path.join(R, 'local/readnow-local.js');
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const G = 1073741824;
const P1 = 'USB\\VID_04E8&PID_6863\\AAAA0001', P2 = 'USB\\VID_04E8&PID_6863\\BBBB0002';
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tteth3_')); const LOC = path.join(HOME, 'local'); fs.mkdirSync(LOC);
const PORT = 18000 + Math.floor(Math.random() * 1500);
const TF = path.join(HOME, 'fake.json');
const fake = (o) => fs.writeFileSync(TF, JSON.stringify(o));
const base = {
  ifaces: [{ name: '이더넷', ip: '192.168.0.10', desc: 'Realtek PCIe GbE' }, { name: '휴대폰 테더링', ip: '10.99.73.178', desc: 'Remote NDIS based Internet Sharing Device' }, { name: '이더넷 3', ip: '192.168.42.2', desc: 'Remote NDIS based Internet Sharing Device #2' }],
  hw: { '이더넷': { id: 'PCI\\VEN_10EC&DEV_8168\\X' }, '휴대폰 테더링': { id: P1 }, '이더넷 3': { id: P2 } },
  pubip: { '192.168.0.10': '125.1.1.1', '10.99.73.178': '39.7.7.7' /* 휴대폰 2(192.168.42.2)는 공인 IP 못 봄 = 인터넷 없음 */ },
  mobile: { '39.7.7.7': { mobile: true, isp: 'SKT' }, '39.8.8.8': { mobile: true, isp: 'KT' }, '125.1.1.1': { mobile: false, isp: 'KT 유선' } },
  speed: { [P1]: { rtt: 40, mbps: 20.7, bytes: 3e6, ms: 1100 }, [P2]: { rtt: null, err: 'connect ETIMEDOUT' } }, defaultIp: '192.168.0.10' };
fake(base);
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷', netRetryMin: 0.02, speedEveryMin: 0.01, capGB: 120, planGB: 120,
  phones: { [P1]: { name: '휴대폰 1 · 기존', capGB: 120, order: 1 }, [P2]: { name: '휴대폰 2 · 새', capGB: 120, order: 2 }, 'DESC:이더넷 2': { name: 'USB 연결 1', capGB: 120, order: 3 }, 'PCI\\VEN_8086&DEV_A33F\\3&1': { name: 'USB 연결 3', capGB: 120, order: 4 }, 'USB\\VID_05AC&PID_12A8\\IPHONE1': { name: '아이폰', capGB: 10, order: 5, desc: 'Apple Mobile Device Ethernet' } } }));
const get = (p, h) => new Promise((res, rej) => { const rq = http.get({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: '127.0.0.1:' + PORT, ...(h || {}) }, timeout: 4000 }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res({ raw: b }); } }); }); rq.on('error', rej); rq.on('timeout', () => rq.destroy(new Error('시간 초과'))); });
const st = () => get('/status');
const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { try { const s = await st(); if (f(s)) return s; } catch (e) {} await sleep(250); } return st().catch(() => ({})); };
/* 수집기처럼 휴대폰 1은 오늘 몫 닿음(lim = 지금 사용량 0) · 휴대폰 2는 넉넉히 */
const phcap = (l1, l2) => get('/phcap?d=' + encodeURIComponent(JSON.stringify({ [P1]: { lim: l1, sim: 'p1', name: '휴대폰 1 · 기존' }, [P2]: { lim: l2, sim: 'p2', name: '휴대폰 2 · 새' } })), { 'X-RN-Meter': '1' });
let child = null; let out = ''; const L = fs.readFileSync(SRC, 'utf8');
(async () => {
  try {
    /* ⓪ 소스 검사 */
    ok(/const VERSION = '1\.8\.22'/.test(L), '⓪ 도우미 판 1.8.22');
    ok(/'naver\.com', 'naver\.net'/.test(L), '⓪ 네이버 주소는 와이파이 목록에 그대로');
  } catch (e) { bad++; console.log('  ❌ 소스 읽기', e.message); }
  try {
  child = cp.spawn(process.execPath, [SRC], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
  await until((s) => s && s.ver, 8000);
  /* 처음: 몫 소식 전 — 순서대로 휴대폰 1 */
  let s = await until((x) => x.tether && x.tether.ok, 8000);
  ok(s.tether && s.tether.ok && s.tether.phone === P1, '① 처음엔 순서대로 휴대폰 1(인터넷 됨) ' + JSON.stringify({ ok: s.tether && s.tether.ok, ph: s.tether && s.tether.phoneName }));
  /* 수집기: 휴대폰 1 오늘 몫 닿음 → 예전 판은 휴대폰 2로만 가서 막혔음 */
  await phcap(0, 50 * G);
  s = await until((x) => (x.phones || []).some((p) => p.id === P2 && p.net && p.net.bad) && x.tether && x.tether.ok, 8000);
  const p2 = (s.phones || []).find((p) => p.id === P2) || {};
  ok(p2.net && p2.net.bad && /인터넷/.test(p2.net.why), '① 휴대폰 2(공인 IP 못 봄) = 📵 인터넷 없음으로 표시 · ' + (p2.net && p2.net.why));
  ok(s.tether && s.tether.ok && s.tether.phone === P1 && s.tether.borrow === true, '① 몇 초 안에 인터넷 되는 휴대폰 1로 이어 씀(오늘 몫은 닿았지만 이번 달 상한 안) · tetherOk ' + (s.tether && s.tether.ok));
  ok(/이어 씀/.test(out) && /인터넷 없음으로 표시/.test(out), '① 도우미 기록에 까닭(인터넷 없음·이어 씀)');
  /* ③ 목록 */
  const ids = (s.phones || []).map((p) => p.id);
  ok(!ids.includes('DESC:이더넷 2') && !ids.some((x) => /^PCI/.test(x)), '③ 휴대폰이 아닌 연결(PCI 내장 · DESC:이더넷 2)은 목록에서 뺌');
  ok(ids.includes(P1) && ids.includes(P2) && ids.includes('USB\\VID_05AC&PID_12A8\\IPHONE1'), '③ 삼성 두 대와 다른 회사 USB 휴대폰(애플)은 그대로');
  const cfg = JSON.parse(fs.readFileSync(path.join(LOC, 'readnow-local.json'), 'utf8'));
  ok(cfg.phones['DESC:이더넷 2'] && cfg.phones['PCI\\VEN_8086&DEV_A33F\\3&1'], '③ 설정에서는 지우지 않음(데이터 지우지 않기)');
  ok(!Object.keys(cfg.phones).some((k) => /^PCI\\VEN_10EC/.test(k)), '③ 휴대폰이 아닌 랜(PCI)은 새로 등록하지 않음');
  /* ④ 길 — 알라딘은 휴대폰 1 테더링 · 네이버는 와이파이 */
  const g = (h) => new Promise((res) => { const c2 = cp.spawn(process.execPath, ['-e', `const L=require(${JSON.stringify(SRC)}); for (const h of ${JSON.stringify(h)}) console.log(h+'='+L.routeOf(h)); process.exit(0)`], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'tteth3r_')) + '/local' } }); let b = ''; c2.stdout.on('data', (x) => (b += x)); c2.on('exit', () => res(b)); });
  const HO = ['www.aladin.co.kr', 'image.aladin.co.kr', 'naver.com', 'www.naver.com', 'search.shopping.naver.com', 'smartstore.naver.com', 'commerce.naver.com', 'phinf.pstatic.net', 'firestore.googleapis.com'];
  const rr = await g(HO); const RT = Object.fromEntries(rr.trim().split('\n').map((x) => x.split('=')));
  ok(RT['www.aladin.co.kr'] === 'tether' && RT['image.aladin.co.kr'] === 'tether', '④ 알라딘 = 테더링 ' + RT['www.aladin.co.kr']);
  ok(['naver.com', 'www.naver.com', 'search.shopping.naver.com', 'smartstore.naver.com', 'commerce.naver.com', 'phinf.pstatic.net'].every((h) => RT[h] === 'wifi'), '④ 네이버(어느 주소든) = 와이파이 ' + JSON.stringify(RT));
  ok(RT['firestore.googleapis.com'] === 'wifi', '④ 우리 서비스(Firebase) = 와이파이');
  ok(s.tether.localIp === '10.99.73.178' && s.wifi && s.wifi.localIp === '192.168.0.10', '④ 이어 쓰는 중에도 알라딘은 휴대폰 1 주소(10.99…)로 · 와이파이는 따로');
  /* ⑤ 속도 */
  s = await until((x) => (x.phones || []).some((p) => p.id === P1 && p.speed && p.speed.mbps), 6000);
  const sp1 = ((s.phones || []).find((p) => p.id === P1) || {}).speed || {};
  ok(sp1.mbps === 20.7 && sp1.small === false && sp1.bigIso, '⑤ 처음 속도 재기는 3MB(큰 것)');
  s = await until((x) => { const q = ((x.phones || []).find((p) => p.id === P1) || {}).speed; return q && q.small === true; }, 6000);
  const sp1b = ((s.phones || []).find((p) => p.id === P1) || {}).speed || {};
  ok(sp1b.small === true && sp1b.bigIso === sp1.bigIso, '⑤ 그다음은 정한 간격마다 작게(500KB) 다시 잼 · 큰 것 시각은 그대로');
  ok(/speedBytesSmall \|\| 5e5/.test(L) && /speedEveryMin \|\| 30/.test(L) && /speedEveryH \|\| 6/.test(L), '⑤ 기본 30분마다 500KB · 6시간마다 3MB');
  /* ② 휴대폰 2가 살아남 → 다시 후보 → 휴대폰 1은 몫이 닿았으므로 휴대폰 2로 */
  fake({ ...base, pubip: { ...base.pubip, '192.168.42.2': '39.8.8.8' }, speed: { ...base.speed, [P2]: { rtt: 50, mbps: 30, bytes: 3e6, ms: 800 } } });
  s = await until((x) => x.tether && x.tether.ok && x.tether.phone === P2, 10000);
  const p2b = (s.phones || []).find((p) => p.id === P2) || {};
  ok(!p2b.net && s.tether.phone === P2 && !s.tether.borrow, '② 휴대폰 2 인터넷 살아남 → 표시 풂 → 몫 남은 휴대폰 2로 돌아감 ' + JSON.stringify({ ph: s.tether && s.tether.phoneName, net: p2b.net || null }));
  ok(/인터넷 다시 됨/.test(out), '② 기록: 인터넷 다시 됨');
  /* ② 또 끊김 → 30분(시험 0.02분) 안에 다시 휴대폰 1 */
  fake(base); await phcap(0, 50 * G);
  s = await until((x) => x.tether && x.tether.ok && x.tether.phone === P1, 10000);
  ok(s.tether && s.tether.ok && s.tether.phone === P1, '② 휴대폰 2가 다시 끊기면 휴대폰 1로(2분 확인 안에)');
  /* 두 대 모두 몫 남음 + 휴대폰 2만 인터넷 없음: 순서 앞(휴대폰 1)을 계속 · 휴대폰 1이 빠지면 휴대폰 2(인터넷 없음뿐) — 막혀도 까닭 */
  await phcap(200 * G, 200 * G);
  fake({ ...base, ifaces: base.ifaces.filter((x) => x.name !== '휴대폰 테더링') });
  s = await until((x) => x.tether && !x.tether.ok && /인터넷/.test(x.tether.why || ''), 12000);
  ok(s.tether && !s.tether.ok && /인터넷이 안 됨/.test(s.tether.why || ''), '휴대폰 1을 빼면 남은 휴대폰 2(인터넷 없음)뿐 — 막고 까닭 보임 · ' + (s.tether && s.tether.why));
  /* 휴대폰 이어 쓰기 판단은 이번 달 상한(진짜 상한)은 넘지 않음 — 소스 검사 */
  ok(/phoneUsed\(c\.id\) < phoneCap\(c\.id\)/.test(L), '이어 쓰기는 이번 달 상한(요금제)까지만');
  const C = fs.readFileSync(fs.existsSync(path.join(R, 'src/readnow-collector.src.js')) ? path.join(R, 'src/readnow-collector.src.js') : path.join(R, 'readnow-collector.user.js'), 'utf8'); const hd = C.slice(0, C.indexOf('==/UserScript==')); ok(!/netBad|NETBAD/.test(hd), '수집기 머리는 그대로(이번 고침은 도우미만)');
  } catch (e) { bad++; console.log('  ❌ 오류', e && e.stack); }
  finally { try { child && child.kill(); } catch (e) {} if (bad) console.log(out.split('\n').slice(-40).join('\n')); try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
