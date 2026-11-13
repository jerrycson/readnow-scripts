/* tHELPERUI_1113 — 정범님 11/13 「로거 도우미가 왜 예전 그대로야?」 · 도우미 1.8.26 휴대폰 카드 실시간
 *  도우미(local/readnow-local.js)를 시험 모드(RN_TEST_FILE — 연결·공인 IP·장치 번호·속도를 흉내)로 띄워 /phcards·/status·/mini·/ 를 봄
 *  ① 휴대폰마다 카드: 이름 · ● 지금 쓰는 폰 · 🔌 연결됨 · 🌐 인터넷 됨(마지막 확인) · ⚡ 속도 · 오늘·이번 달·남은 양
 *  ② 인터넷 안 되는 휴대폰(데이터 꺼짐) = 📵 인터넷 안 됨 + 까닭(모바일 데이터 꺼짐 추정·할 일)
 *  ③ 데이터를 켜면(공인 IP 보임) 다시 됨 → 곧바로 속도를 다시 재 '속도 재기 실패'가 남지 않음
 *  ④ 휴대폰을 빼면 몇 초 안에 ✕ 끊김(○시 ○분부터) · 다시 꽂으면 🔌 연결됨 · sig가 바뀜(화면이 2초마다 바뀐 것만 다시 그림)
 *  ⑤ 안 꽂히고 이번 달 사용 없는 옛 항목(USB 연결 4)은 '🗂 예전 기기'로 접힘(지우지 않음 · 설정에는 그대로)
 * 실행: node src/tests/tHELPERUI_1113.js (서버·브라우저 필요 없음 · 127.0.0.1의 빈 포트 하나만 씀) */
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'local/readnow-local.js')));
const SRC = path.join(R, 'local/readnow-local.js');
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const P1 = 'USB\\VID_04E8&PID_6863\\AAAA0001', P2 = 'USB\\VID_04E8&PID_6863\\BBBB0002', P4 = 'USB\\VID_04E8&PID_6863\\CCCC0004';
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'thelperui_')); const LOC = path.join(HOME, 'local'); fs.mkdirSync(LOC);
const PORT = 19600 + Math.floor(Math.random() * 1500);
const TF = path.join(HOME, 'fake.json');
const fake = (o) => fs.writeFileSync(TF, JSON.stringify(o));
const base = {
  ifaces: [{ name: '이더넷', ip: '192.168.0.10', desc: 'Realtek PCIe GbE' }, { name: '휴대폰 테더링', ip: '10.99.73.178', desc: 'Remote NDIS based Internet Sharing Device' }, { name: '이더넷 3', ip: '192.168.42.2', desc: 'Remote NDIS based Internet Sharing Device #2' }],
  hw: { '이더넷': { id: 'PCI\\VEN_10EC&DEV_8168\\X' }, '휴대폰 테더링': { id: P1 }, '이더넷 3': { id: P2 } },
  pubip: { '192.168.0.10': '125.1.1.1', '10.99.73.178': '39.7.7.7' /* 휴대폰 2는 처음엔 데이터 꺼짐 = 공인 IP 못 봄 */ },
  mobile: { '39.7.7.7': { mobile: true, isp: 'SKT' }, '39.8.8.8': { mobile: true, isp: 'KT' }, '125.1.1.1': { mobile: false, isp: 'KT 유선' } },
  speed: { [P1]: { rtt: 40, mbps: 20.7, bytes: 3e6, ms: 1100 }, [P2]: { rtt: null, err: 'connect ETIMEDOUT' } }, defaultIp: '192.168.0.10' };
const on2 = { ...base, pubip: { ...base.pubip, '192.168.42.2': '39.8.8.8' }, speed: { ...base.speed, [P2]: { rtt: 33, mbps: 41.5, bytes: 5e5, ms: 100 } } };
fake(base);
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷', netRetryMin: 0.02, speedEveryMin: 30, capGB: 120, planGB: 120, planId: 'p20261021b', planSince: '2026-10-21', planPre: 0, planPrePh: {}, phCap1024: 'x', phName1026: 'x',
  phones: { [P1]: { name: '휴대폰 1 · 기존', capGB: 120, order: 1 }, [P2]: { name: '휴대폰 2 · 새 120GB', capGB: 120, order: 2 }, [P4]: { name: 'USB 연결 4', capGB: 120, order: 3, at: '2026-10-30T10:00:00.000Z' } } }));
const getRaw = (p) => new Promise((res, rej) => { const rq = http.get({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: '127.0.0.1:' + PORT }, timeout: 4000 }, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }); rq.on('error', rej); rq.on('timeout', () => rq.destroy(new Error('시간 초과'))); });
const get = async (p) => { const b = await getRaw(p); try { return JSON.parse(b); } catch (e) { return { raw: b }; } };
const until = async (p, f, ms) => { const t = Date.now(); let x = null; while (Date.now() - t < ms) { try { x = await get(p); if (f(x)) return x; } catch (e) {} await sleep(150); } return x || {}; };
const card = (html, name) => { const i = html.indexOf('📱 ' + name); if (i < 0) return ''; const j = html.indexOf('<div class="pc', i + 5); return html.slice(i, j < 0 ? html.length : j); };
const liveOf = (html) => html.split('<details class="old')[0];
let child = null; let out = ''; const L = fs.readFileSync(SRC, 'utf8');
(async () => {
  try {
    ok(/const VERSION = '1\.8\.(2[6-9]|[3-9]\d)'/.test(L), '⓪ 도우미 판 1.8.26 이상');
    ok(/pathname === '\/phcards'/.test(L) && /setInterval\(connTick, T_IF \? 300 : 2000\)/.test(L), '⓪ /phcards · 연결 2초마다');
  } catch (e) { bad++; console.log('  ❌ 소스 읽기', e.message); }
  try {
    child = cp.spawn(process.execPath, [SRC], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
    await until('/status', (s) => s && s.tether && s.tether.ok, 8000);
    /* ①② 처음: 휴대폰 1 쓰는 중 · 휴대폰 2 데이터 꺼짐 */
    let j = await until('/phcards?v=mini', (x) => x.html && /📵 인터넷 안 됨/.test(x.html) && /🌐 인터넷 됨/.test(x.html) && /20\.7/.test(x.html), 10000);
    const h = j.html || ''; const c1 = card(h, '휴대폰 1 · 기존'), c2 = card(h, '휴대폰 2 · 새 120GB');
    ok(/● 지금 쓰는 폰/.test(c1) && /🔌 연결됨/.test(c1) && /🌐 인터넷 됨/.test(c1) && /20\.7/.test(c1) && /마지막 확인/.test(c1), '① 휴대폰 1 카드: 지금 쓰는 폰 · 연결됨 · 인터넷 됨 · 속도 · 마지막 확인');
    ok(/이번 달/.test(c1) && /남은/.test(c1) && /오늘/.test(c1), '① 오늘·이번 달·남은 양');
    ok(/🔌 연결됨/.test(c2) && /📵 인터넷 안 됨/.test(c2) && /모바일 데이터/.test(c2) && !/지금 쓰는 폰/.test(c2), '② 휴대폰 2 카드: 연결됨 · 📵 인터넷 안 됨 · 까닭(모바일 데이터 꺼짐 추정)');
    ok(/예전 기기 1대/.test(h) && !/USB 연결 4/.test(liveOf(h)) && /USB 연결 4/.test(h.split('<details class="old')[1] || ''), '⑤ USB 연결 4는 위 카드에 없고 🗂 예전 기기로 접힘');
    const s0 = await get('/status'); const q2 = (s0.phones || []).find((p) => p.id === P2) || {}; const q4 = (s0.phones || []).find((p) => p.id === P4);
    ok(q2.inet && q2.inet.ok === false && q2.inet.hint && q2.cAt, '② /status 휴대폰 2 inet(안 됨·할 일)·cAt');
    ok(q4 && q4.connected === false, '⑤ 예전 기기도 지우지 않음(설정·/status에 그대로)');
    ok(!/undefined|NaN|null<|>null/.test(h), '① 카드 글에 undefined·NaN 없음');
    const mini = await getRaw('/mini'); ok(/id="phc"/.test(mini) && /phcards\?v=mini/.test(mini) && /휴대폰 2 · 새 120GB/.test(mini), '① 작은 창(/mini)에 휴대폰 카드 + 2초 갱신');
    const dash = await getRaw('/'); ok(/id="phc"/.test(dash) && /phcards\?v=dash/.test(dash) && /📵 인터넷 안 됨/.test(dash) && /예전 기기/.test(dash), '① 첫 화면(/)에 같은 카드 + 2초 갱신');
    /* ③ 정범님이 휴대폰 2 데이터를 켬 → 다시 됨 → 곧바로 속도 다시 */
    fake(on2); const t3 = Date.now();
    j = await until('/phcards?v=mini', (x) => x.html && /🌐 인터넷 됨/.test(card(x.html, '휴대폰 2 · 새 120GB')) && /41\.5/.test(card(x.html, '휴대폰 2 · 새 120GB')), 10000);
    const c2b = card(j.html || '', '휴대폰 2 · 새 120GB');
    ok(/🌐 인터넷 됨/.test(c2b) && /41\.5/.test(c2b) && !/속도 재기 실패/.test(c2b), `③ 데이터 켬 → 인터넷 됨 · 속도 곧바로 다시 재어 성공(${Date.now() - t3}ms)`);
    ok(/인터넷 다시 됨/.test(out) && /속도 곧 다시 잼/.test(out), '③ 기록: 인터넷 다시 됨 · 속도 다시');
    /* ④ 휴대폰 2를 뺌 → 몇 초 안에 끊김 */
    const sigA = j.sig; fake({ ...on2, ifaces: on2.ifaces.filter((x) => x.name !== '이더넷 3') }); const t4 = Date.now();
    j = await until('/phcards?v=mini', (x) => x.html && /✕ 끊김/.test(card(x.html, '휴대폰 2 · 새 120GB')), 6000); const dt = Date.now() - t4;
    ok(/✕ 끊김/.test(card(j.html || '', '휴대폰 2 · 새 120GB')) && /부터/.test(card(j.html || '', '휴대폰 2 · 새 120GB')) && dt < 3000, `④ 빼면 ${dt}ms 안에 ✕ 끊김(○시 ○분부터)`);
    ok(j.sig && j.sig !== sigA, '④ sig 바뀜 → 화면 카드가 다시 그려짐');
    ok(/휴대폰 2 · 새 120GB: ✕ 끊김/.test(out), '④ 기록: 끊김');
    /* 다시 꽂음 */
    fake(on2); j = await until('/phcards?v=mini', (x) => x.html && /🔌 연결됨/.test(card(x.html, '휴대폰 2 · 새 120GB')), 6000); await sleep(700); /* 기록 줄은 다음 연결 보기(0.3초)에 남음 */
    ok(/🔌 연결됨/.test(card(j.html || '', '휴대폰 2 · 새 120GB')) && /휴대폰 2 · 새 120GB: 🔌 연결됨/.test(out), '④ 다시 꽂으면 🔌 연결됨 + 기록');
    /* 지금 쓰는 폰을 빼면 다른 폰으로 · 카드도 따라감 */
    fake({ ...on2, ifaces: on2.ifaces.filter((x) => x.name !== '휴대폰 테더링') });
    j = await until('/phcards?v=mini', (x) => x.html && /지금 쓰는 폰/.test(card(x.html, '휴대폰 2 · 새 120GB')) && /✕ 끊김/.test(card(x.html, '휴대폰 1 · 기존')), 10000);
    ok(/지금 쓰는 폰/.test(card(j.html || '', '휴대폰 2 · 새 120GB')) && /✕ 끊김/.test(card(j.html || '', '휴대폰 1 · 기존')), '④ 쓰던 휴대폰 1을 빼면 휴대폰 2가 ● 지금 쓰는 폰 · 휴대폰 1은 끊김 카드로 남음(이번 달 사용 있음)');
    /* ⑥ 웹앱 📶 테더링 사용 › 휴대폰 칸(netPoolCard)도 같은 모양 — 로거가 알려 준 inet·net·cAt */
    { const A = fs.readFileSync(path.join(R, 'src/app.html'), 'utf8'); const i = A.indexOf('function netPoolCard(BU)'); const j = A.indexOf('\nasync function openNetUsage', i); const S = { netLive: { phones: [{ id: 'D1', inet: { ok: true, at: '2026-11-13T09:20:00.000+09:00' }, cAt: '2026-11-13T08:00:00.000Z' }, { id: 'D2', net: { bad: true, why: '테더링으로 공인 IP를 못 봄', next: '2026-11-13T09:50:00.000Z' }, inet: { ok: false, hint: '휴대폰 모바일 데이터가 꺼져 있거나' }, cAt: '2026-11-13T09:00:00.000Z' }] } };
      const f = new Function('S', 'esc', 'isAdminDevice', A.slice(i, j) + '\nreturn netPoolCard;')(S, (x) => String(x == null ? '' : x), () => false);
      const ph = (id, name, act, con) => ({ id: 'p' + id, name, dev: id, active: act, connected: con, usedT: 1e8, share: 2e9, how: '시험', monthLeft: 5e10, speed: null });
      const html = f({ pool: { share: 4e9, pct: 70, main: 2.8e9, gen: 1.2e9, used: 2e8, phones: [ph('D1', '휴대폰 1', true, true), ph('D2', '휴대폰 2', false, true), ph('D3', '휴대폰 3', false, false)] } });
      ok(/● 지금 쓰는 폰/.test(html) && /🌐 인터넷 됨/.test(html) && /📵 인터넷 안 됨/.test(html) && /모바일 데이터/.test(html) && /✕ 끊김/.test(html) && /마지막 확인/.test(html), '⑥ 웹앱 휴대폰 칸: 지금 쓰는 폰 · 인터넷 됨/안 됨(까닭) · 끊김 · 마지막 확인'); }
    const C = fs.readFileSync(fs.existsSync(path.join(R, 'src/readnow-collector.src.js')) ? path.join(R, 'src/readnow-collector.src.js') : path.join(R, 'readnow-collector.user.js'), 'utf8'); const hd = C.slice(0, C.indexOf('==/UserScript=='));
    ok(!/phcards|inet/.test(hd), '수집기 머리는 그대로');
  } catch (e) { bad++; console.log('  ❌ 오류', e && e.stack); }
  finally { try { child && child.kill(); } catch (e) {} if (bad) console.log(out.split('\n').slice(-40).join('\n')); try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
