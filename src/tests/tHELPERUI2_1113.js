/* tHELPERUI2_1113 — (1.8.27) 공인 IP는 보이나 속도 재기가 잇달아 실패하는 휴대폰은 쓰는 폰으로 두지 않음 · 되면 풂 · 바탕 = 정범님 11/13 「로거 도우미가 왜 예전 그대로야?」 · 도우미 1.8.26 휴대폰 카드 실시간
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
fake({ ...base, pubip: { ...base.pubip, '192.168.42.2': '39.8.8.8' } }); /* 휴대폰 2(순서 앞) = 공인 IP는 보이나 내려받기 ETIMEDOUT */
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷', netRetryMin: 0.02, speedEveryMin: 30, capGB: 120, planGB: 120, planId: 'p20261021b', planSince: '2026-10-21', planPre: 0, planPrePh: {}, phCap1024: 'x', phName1026: 'x',
  phones: { [P1]: { name: '휴대폰 1 · 기존', capGB: 120, order: 2 }, [P2]: { name: '휴대폰 2 · 새 120GB', capGB: 120, order: 1 }, [P4]: { name: 'USB 연결 4', capGB: 120, order: 3, at: '2026-10-30T10:00:00.000Z' } } }));
const getRaw = (p) => new Promise((res, rej) => { const rq = http.get({ host: '127.0.0.1', port: PORT, path: p, headers: { Host: '127.0.0.1:' + PORT }, timeout: 4000 }, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => res(b)); }); rq.on('error', rej); rq.on('timeout', () => rq.destroy(new Error('시간 초과'))); });
const get = async (p) => { const b = await getRaw(p); try { return JSON.parse(b); } catch (e) { return { raw: b }; } };
const until = async (p, f, ms) => { const t = Date.now(); let x = null; while (Date.now() - t < ms) { try { x = await get(p); if (f(x)) return x; } catch (e) {} await sleep(150); } return x || {}; };
const card = (html, name) => { const i = html.indexOf('📱 ' + name); if (i < 0) return ''; const j = html.indexOf('<div class="pc', i + 5); return html.slice(i, j < 0 ? html.length : j); };
const liveOf = (html) => html.split('<details class="old')[0];
let child = null; let out = ''; const L = fs.readFileSync(SRC, 'utf8');
(async () => {
  try {
    ok(/const VERSION = '1\.8\.(2[7-9]|[3-9]\d)'/.test(L), '⓪ 도우미 판 1.8.27 이상');
    child = cp.spawn(process.execPath, [SRC], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
    let s = await until('/status', (x) => x && x.tether && x.tether.ok, 8000);
    ok(s.tether && s.tether.phone === P2, '① 처음엔 순서 앞 휴대폰 2(공인 IP는 보임)를 고름');
    s = await until('/status', (x) => x.tether && x.tether.ok && x.tether.phone === P1 && (x.phones || []).some((p) => p.id === P2 && p.net && p.net.kind === 'speed'), 10000);
    const p2 = (s.phones || []).find((p) => p.id === P2) || {};
    ok(p2.net && p2.net.kind === 'speed' && /잇달아 실패/.test(p2.net.why), '② 속도 재기 두 번 잇달아 실패 → 휴대폰 2 인터넷 안 됨(까닭 속도) · ' + (p2.net && p2.net.why));
    ok(s.tether.ok && s.tether.phone === P1, '② 쓰는 폰이 되는 휴대폰 1로 곧바로 바뀜 · ' + (s.tether && s.tether.phoneName));
    const j = await get('/phcards?v=mini'); ok(/📵 인터넷 안 됨/.test(card(j.html || '', '휴대폰 2 · 새 120GB')) && /신호가 약하거나/.test(j.html || '') && /지금 쓰는 폰/.test(card(j.html || '', '휴대폰 1 · 기존')), '② 카드: 휴대폰 2 📵(신호·데이터 막힘 추정) · 휴대폰 1 ● 지금 쓰는 폰');
    await sleep(2500); s = await get('/status'); ok(s.tether.phone === P1 && s.tether.ok, '② 몇 초 뒤에도 휴대폰 2로 되돌아가지 않음');
    /* ③ 휴대폰 2 내려받기가 다시 됨 → 다시 재어 풂 */
    fake({ ...base, pubip: { ...base.pubip, '192.168.42.2': '39.8.8.8' }, speed: { ...base.speed, [P2]: { rtt: 30, mbps: 25, bytes: 5e5, ms: 160 } } });
    s = await until('/status', (x) => (x.phones || []).some((p) => p.id === P2 && !p.net && p.speed && p.speed.mbps === 25), 10000);
    ok((s.phones || []).some((p) => p.id === P2 && !p.net && p.speed && p.speed.mbps === 25), '③ 다시 재어 되면(25Mbps) 인터넷 안 됨 표시를 풂');
    ok(/잇달아 실패/.test(out) && /인터넷 다시 됨/.test(out), '③ 기록: 잇달아 실패 · 다시 됨');
  } catch (e) { bad++; console.log('  ❌ 오류', e && e.stack); }
  finally { try { child && child.kill(); } catch (e) {} if (bad) console.log(out.split('\n').slice(-40).join('\n')); try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
