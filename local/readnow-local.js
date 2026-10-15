/* 리드나우 로컬 도우미 (readnow-local) — 자동 수집 담당 PC(공개 전용 PC)에서 24시간 도는 작은 프로그램
 *
 * 하는 일
 *  1) 인터넷 길 나누기(프록시 127.0.0.1:8899): 이 PC의 크롬·엣지·수집기가 내보내는 모든 요청을 받아
 *     · 우리 서비스(Firebase·Google 로그인·GitHub·클라우드·외부 정보 출처 등, 아래 WIFI_HOSTS) → 와이파이로
 *     · 그 밖의 모든 곳(알라딘과 알라딘 화면이 부르는 광고·통계 등 — 모르는 곳은 모두) → 테더링으로
 *     · 알라딘은 무슨 일이 있어도 와이파이로 나가지 않음: 테더링이 확인되지 않으면(끊김·공인 IP가 와이파이와 같음·상한) 알라딘 요청은 실패시킴(막힘 기본)
 *  2) 테더링 확인: 2분마다 테더링으로 본 공인 IP와 와이파이로 본 공인 IP를 따로 물어 둘이 다를 때만 '확인됨'
 *  3) 데이터 사용량 측정: 길(테더링·와이파이)·날·묶음(알라딘·광고통계·Firebase·GitHub·외부 정보…)마다 실제 주고받은 바이트(압축된 실제 양)
 *     · D:\ReadNow\net\usage-YYYY-MM.json 에 30초마다 (지우지 않음) · 한 달 테더링 상한(기본 48GB)을 넘으면 테더링 길을 닫음
 *  4) 상태 알림: http://127.0.0.1:8899/ (사람이 보는 화면) · http://rn.local/status (수집기가 프록시를 통해 묻는 곳)
 *  5) 스스로 업데이트: 6시간마다 GitHub의 새 판을 받아 검사(문법)한 뒤 바꾸고 다시 켬 (실행기가 5초 뒤 다시 켬)
 *
 * 설정: 같은 폴더의 readnow-local.json (없으면 기본값). 바꾼 뒤 저절로 다시 읽음(1분).
 *   { "capGB": 48, "tetherIface": "", "wifiIface": "", "extraWifiHosts": [], "port": 8899 }
 *   · tetherIface/wifiIface: 자동으로 못 고를 때만 이름을 적음(예: "이더넷 3", "Wi-Fi") — 상태 화면에 후보 이름이 나옴
 */
'use strict';
const VERSION = '1.0.0';
const http = require('http'), https = require('https'), net = require('net'), dns = require('dns'), os = require('os'), fs = require('fs'), path = require('path'), dgram = require('dgram'), cp = require('child_process');

const HOME = process.env.RN_TEST_HOME || __dirname; const ROOT = path.resolve(HOME, '..'); // D:\ReadNow\local → D:\ReadNow
const NET_DIR = path.join(ROOT, 'net'), LOG_DIR = path.join(ROOT, 'logs');
[NET_DIR, LOG_DIR].forEach((d) => { try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} });
const kst = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString(); const day = (ms) => kst(ms).slice(0, 10), month = (ms) => kst(ms).slice(0, 7);
function log(...a) { const line = `${kst().slice(0, 19).replace('T', ' ')} ${a.join(' ')}`; try { console.log(line); } catch (e) {} try { fs.appendFileSync(path.join(LOG_DIR, `local-${day()}.log`), line + '\n'); } catch (e) {} }

/* ── 설정 ── */
const CFG_PATH = path.join(HOME, 'readnow-local.json');
const DEF = { port: 8899, capGB: 48, capStopPct: 99, tetherIface: '', wifiIface: '', extraWifiHosts: [], selfUpdate: true };
let CFG = { ...DEF }, cfgAt = 0;
function loadCfg() { try { const st = fs.statSync(CFG_PATH); if (st.mtimeMs === cfgAt) return; cfgAt = st.mtimeMs; CFG = { ...DEF, ...JSON.parse(fs.readFileSync(CFG_PATH, 'utf8').replace(/^\uFEFF/, '')) }; log('설정 읽음', JSON.stringify(CFG)); } catch (e) { if (e.code !== 'ENOENT') log('설정 파일을 못 읽음(기본값 씀):', e.message); } }
loadCfg(); setInterval(loadCfg, 60e3);

/* ── 길 정하기: 와이파이로 보낼 곳(우리 서비스)만 적고, 나머지는 모두 테더링 ── */
const WIFI_HOSTS = [
  // Firebase·Google(로그인·저장소·스크립트 라이브러리) — 알라딘과 무관
  'googleapis.com', 'firebaseio.com', 'firebaseapp.com', 'firebasedatabase.app', 'web.app', 'gstatic.com', 'google.com', 'googleusercontent.com', 'gvt1.com', 'gvt2.com', 'withgoogle.com', 'run.app', 'cloudfunctions.net',
  // GitHub(웹앱·수집기·공용 파일)·CDN·Tampermonkey
  'github.com', 'githubusercontent.com', 'github.io', 'githubassets.com', 'cdnjs.cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'tampermonkey.net',
  // 외부 정보 출처(알라딘 아님)
  'bunjang.co.kr', 'ebay.com', 'frankfurter.app', 'frankfurter.dev', 'kpipa.or.kr', 'kakao.com', 'data4library.kr', 'dvdprime.com', 'koreaexim.go.kr', 'naver.com', 'kyobobook.co.kr', 'ridibooks.com', 'joongna.com', 'abebooks.com', 'daangn.com', 'joongmo.com', 'nl.go.kr', 'yes24.com',
  // Windows·크롬 자체 업데이트
  'microsoft.com', 'windowsupdate.com', 'msftconnecttest.com', 'live.com', 'office.com', 'chromium.org',
];
const ALADIN = /(^|\.)aladin\.co\.kr$|(^|\.)aladin\.kr$/i; // 알라딘은 목록과 상관없이 무조건 테더링
const hostMatch = (h, list) => list.some((d) => h === d || h.endsWith('.' + d));
function routeOf(host) { const h = String(host || '').toLowerCase().replace(/\.$/, ''); if (ALADIN.test(h)) return 'tether'; if (hostMatch(h, WIFI_HOSTS) || hostMatch(h, CFG.extraWifiHosts || [])) return 'wifi'; return 'tether'; }
function groupOf(host) { const h = String(host || '').toLowerCase();
  if (ALADIN.test(h)) return 'aladin';
  if (hostMatch(h, ['googleapis.com', 'firebaseio.com', 'firebaseapp.com', 'firebasedatabase.app', 'web.app', 'run.app', 'cloudfunctions.net'])) return 'firebase';
  if (hostMatch(h, ['google.com', 'gstatic.com', 'googleusercontent.com', 'withgoogle.com', 'gvt1.com', 'gvt2.com'])) return 'google';
  if (hostMatch(h, ['github.com', 'githubusercontent.com', 'github.io', 'githubassets.com', 'cdnjs.cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'tampermonkey.net'])) return 'update';
  if (hostMatch(h, ['bunjang.co.kr', 'ebay.com', 'frankfurter.app', 'frankfurter.dev', 'kpipa.or.kr', 'kakao.com', 'data4library.kr', 'dvdprime.com', 'koreaexim.go.kr', 'naver.com', 'kyobobook.co.kr', 'ridibooks.com', 'joongna.com', 'abebooks.com', 'daangn.com', 'joongmo.com', 'nl.go.kr', 'yes24.com'])) return 'ext';
  if (hostMatch(h, ['microsoft.com', 'windowsupdate.com', 'msftconnecttest.com', 'live.com', 'office.com', 'chromium.org'])) return 'system';
  return routeOf(h) === 'tether' ? 'other_tether' : 'other'; }

/* ── 인터페이스 고르기 ── */
const VIRT = /vEthernet|VirtualBox|VMware|Hyper-V|Loopback|WSL|Bluetooth|TAP|Tailscale|ZeroTier|VPN|Npcap|Docker/i;
const WIFI_NAME = /Wi-?Fi|WLAN|무선|Wireless/i;
const T_FILE = process.env.RN_TEST_FILE || null; const T = () => (T_FILE ? JSON.parse(fs.readFileSync(T_FILE, 'utf8')) : null); const T_IF = T_FILE ? 1 : null; /* 시험용(RN_TEST_FILE이 있을 때만 — 연결·공인 IP·주소를 흉내) */
function ifaces() { if (T_IF) return T().ifaces.map((x) => ({ ...x, virt: VIRT.test(x.name) })); const L = []; const N = os.networkInterfaces(); for (const [name, arr] of Object.entries(N)) for (const a of arr || []) { if (a.family !== 'IPv4' && a.family !== 4) continue; if (a.internal || /^169\.254\./.test(a.address)) continue; L.push({ name, ip: a.address, virt: VIRT.test(name) }); } return L; }
function pickIfaces() { const L = ifaces(); const real = L.filter((x) => !x.virt); const by = (n) => L.find((x) => x.name === n);
  let wifi = CFG.wifiIface ? by(CFG.wifiIface) : null, tether = CFG.tetherIface ? by(CFG.tetherIface) : null; let why = '';
  if (!wifi) { const w = real.filter((x) => WIFI_NAME.test(x.name) && (!tether || x.name !== tether.name)); if (w.length === 1) wifi = w[0]; }
  if (!tether) { const t = real.filter((x) => (!wifi || x.name !== wifi.name) && !WIFI_NAME.test(x.name)); if (t.length === 1) tether = t[0]; else if (t.length > 1) why = `테더링 후보가 여럿(${t.map((x) => x.name).join(', ')}) — readnow-local.json의 tetherIface에 이름을 적어 주세요`; else why = '테더링 연결이 없음(휴대폰을 USB로 꽂고 USB 테더링을 켜세요)'; }
  if (!wifi) { const w = real.filter((x) => !tether || x.name !== tether.name); if (w.length === 1) wifi = w[0]; else if (!why) why = `와이파이를 못 고름(${real.map((x) => x.name).join(', ') || '연결 없음'}) — readnow-local.json의 wifiIface에 이름을 적어 주세요`; }
  if (wifi && tether && wifi.ip === tether.ip) { why = '와이파이와 테더링이 같은 연결로 보임'; tether = null; }
  return { wifi, tether, all: L, why }; }

/* ── 공인 IP 확인 (각 길로 따로) ── */
function publicIp(localAddress) { if (T_IF) return Promise.resolve(T().pubip[localAddress] || null); return new Promise((res) => { const rq = https.get({ host: 'api.ipify.org', path: '/?format=text', localAddress, timeout: 10000, family: 4, lookup: (h, o, cb) => dns.lookup(h, { family: 4 }, cb) }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(/^\d+\.\d+\.\d+\.\d+$/.test(b.trim()) ? b.trim() : null)); }); rq.on('timeout', () => { rq.destroy(); res(null); }); rq.on('error', () => res(null)); }); }
const ST = { tether: { ok: false, why: '아직 확인 전', ip: null, iface: null, localIp: null, at: null }, wifi: { ip: null, iface: null, localIp: null }, cand: [], startedAt: kst() };
let checking = false;
async function checkTether(reason) { if (checking) return; checking = true; try {
    const P = pickIfaces(); ST.cand = P.all.map((x) => `${x.name}(${x.ip})${x.virt ? '·가상' : ''}`); ST.wifi.iface = P.wifi ? P.wifi.name : null; ST.wifi.localIp = P.wifi ? P.wifi.ip : null;
    if (!P.tether || !P.wifi) { setTether(false, P.why || '연결을 못 고름', null, P.tether); return; }
    const [ipT, ipW] = await Promise.all([publicIp(P.tether.ip), publicIp(P.wifi.ip)]); ST.wifi.ip = ipW;
    if (!ipT) { setTether(false, `테더링(${P.tether.name})으로 인터넷이 안 됨`, null, P.tether); return; }
    if (!ipW) { setTether(false, `와이파이(${P.wifi.name})로 공인 IP를 못 봄 — 견줄 수 없어 막아 둠`, ipT, P.tether); return; }
    if (ipT === ipW) { setTether(false, `테더링과 와이파이의 공인 IP가 같음(${ipT}) — 같은 길로 나가고 있어 막아 둠`, ipT, P.tether); return; }
    setTether(true, '', ipT, P.tether); checkDefault();
  } catch (e) { setTether(false, '확인 중 오류: ' + e.message, null, null); } finally { checking = false; } }
function defaultLocalIp() { return new Promise((res) => { if (T_IF) return res((T().defaultIp) || null); const u = dgram.createSocket('udp4'); u.on('error', () => { try { u.close(); } catch (e) {} res(null); }); u.connect(53, '8.8.8.8', () => { let a = null; try { a = u.address().address; } catch (e) {} try { u.close(); } catch (e) {} res(a); }); }); } /* 보내지 않고 '기본 길'로 쓸 내 주소만 봄 */
async function checkDefault() { const a = await defaultLocalIp(); ST.defaultIp = a; ST.defaultWarn = a && ST.tether.localIp && a === ST.tether.localIp ? `윈도우 기본 길이 테더링(${ST.tether.iface})으로 잡혀 있어, 이 도우미를 거치지 않는 프로그램(윈도우 업데이트 등)의 데이터가 테더링으로 나갑니다 — 관리자 PowerShell에서: Set-NetIPInterface -InterfaceAlias "${ST.tether.iface}" -InterfaceMetric 9000` : null; if (ST.defaultWarn && ST._dw !== ST.defaultWarn) log('⚠ ' + ST.defaultWarn); ST._dw = ST.defaultWarn; }
setInterval(checkDefault, 60e3);
function setTether(ok, why, ip, t) { const was = ST.tether.ok; ST.tether = { ok, why, ip, iface: t ? t.name : null, localIp: t ? t.ip : null, at: kst() }; if (was !== ok || (!ok && why !== ST._lastWhy)) log(ok ? `✓ 테더링 확인 — ${t.name} 공인 IP ${ip} (와이파이 ${ST.wifi.ip})` : `✗ 테더링 막음 — ${why}`); ST._lastWhy = why; }
setInterval(() => checkTether('timer'), 120e3); setTimeout(() => checkTether('start'), 500);
let ifSig = JSON.stringify(ifaces()); setInterval(() => { const s = JSON.stringify(ifaces()); if (s !== ifSig) { ifSig = s; log('연결이 바뀜 → 테더링 다시 확인'); ST.tether.ok = false; checkTether('change'); } }, 5000); /* 시작할 때의 연결을 기준으로 */ /* 연결이 바뀌면 바로 막고 다시 확인 */

/* ── 사용량 (실제 주고받은 바이트) ── */
let U = null; const uPath = (m) => path.join(NET_DIR, `usage-${m}.json`);
function uLoad(m) { try { return JSON.parse(fs.readFileSync(uPath(m), 'utf8')); } catch (e) { return { month: m, days: {}, total: { tether: 0, wifi: 0 } }; } }
function uCur() { const m = month(); if (!U || U.month !== m) { if (U) uSave(); U = uLoad(m); } return U; }
function addBytes(route, group, n) { if (!n) return; const u = uCur(); const d = day(); const D = (u.days[d] = u.days[d] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }); D[route] = (D[route] || 0) + n; const gk = route + ':' + group; D.groups[gk] = (D.groups[gk] || 0) + n; u.total[route] = (u.total[route] || 0) + n; uDirty = true; }
function addBlocked(host, why) { const u = uCur(); const d = day(); const D = (u.days[d] = u.days[d] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }); D.blocked = (D.blocked || 0) + 1; D.lastBlocked = { host, why, at: kst() }; uDirty = true; }
let uDirty = false; function uSave() { if (!U) return; try { const p = uPath(U.month); fs.writeFileSync(p + '.tmp', JSON.stringify(U)); fs.renameSync(p + '.tmp', p); uDirty = false; } catch (e) { log('사용량 저장 실패', e.message); } }
setInterval(() => { if (uDirty) uSave(); }, 30e3);
const capBytes = () => Math.round((+CFG.capGB || 48) * 1073741824 * Math.min(100, Math.max(50, +CFG.capStopPct || 99)) / 100);
const capped = () => (uCur().total.tether || 0) >= capBytes();
/* 연결마다 늘어난 만큼만 더함(오래 열린 연결도 10초마다) */
const live = new Set(); function track(sock, route, group) { const e = { sock, route, group, r: 0, w: 0 }; live.add(e); const flush = () => { const r = sock.bytesRead || 0, w = sock.bytesWritten || 0; addBytes(route, group, (r - e.r) + (w - e.w)); e.r = r; e.w = w; }; e.flush = flush; sock.once('close', () => { flush(); live.delete(e); }); }
setInterval(() => { for (const e of live) e.flush(); }, 10e3);

/* ── 길마다 연결 열기 (막힘 기본) ── */
function gate(host) { const route = routeOf(host); if (route === 'tether') { if (!ST.tether.ok) return { err: '테더링 확인 안 됨 — ' + (ST.tether.why || '') }; if (capped()) return { err: `테더링 한 달 상한(${CFG.capGB}GB) 도달 — 다음 달까지 닫음` }; return { route, local: ST.tether.localIp }; } if (!ST.wifi.localIp) return { err: '와이파이 연결이 없음' }; return { route, local: ST.wifi.localIp }; }
function lookup4(host, cb) { if (net.isIPv4(host)) return cb(null, host); if (T_IF) { const D = T().dns; return D[host] ? cb(null, D[host]) : cb(new Error('주소 없음')); } dns.lookup(host, { family: 4 }, (e, a) => cb(e, a)); }
function openUp(host, port, cb) { const g = gate(host); if (g.err) return cb(new Error(g.err), null, g);
  lookup4(host, (e, ip) => { if (e) return cb(e, null, g); const s = net.connect({ host: ip, port: +port, localAddress: g.local, family: 4 }); let done = false; s.once('connect', () => { if (done) return; done = true; track(s, g.route, groupOf(host)); cb(null, s, g); }); s.once('error', (er) => { if (done) return; done = true; cb(er, null, g); }); s.setTimeout(30000, () => { if (!done) { done = true; s.destroy(); cb(new Error('연결 시간 초과'), null, g); } }); }); }

/* ── 상태 화면·API ── */
function status() { const u = uCur(); const d = u.days[day()] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }; return { ok: true, ver: VERSION, at: kst(), tether: ST.tether, wifi: ST.wifi, cand: ST.cand, capGB: +CFG.capGB || 48, capBytes: capBytes(), capped: capped(), month: { key: u.month, tether: u.total.tether || 0, wifi: u.total.wifi || 0 }, today: { key: day(), tether: d.tether || 0, wifi: d.wifi || 0, groups: d.groups || {}, blocked: d.blocked || 0, lastBlocked: d.lastBlocked || null }, days: Object.fromEntries(Object.entries(u.days).map(([k, v]) => [k, { tether: v.tether || 0, wifi: v.wifi || 0, groups: v.groups || {} }])), startedAt: ST.startedAt, updAt: UPD.at, updMsg: UPD.msg, defaultWarn: ST.defaultWarn || null }; }
const gb = (b) => (b / 1073741824).toFixed(2) + 'GB';
function statusHtml() { const s = status(); const pct = Math.min(100, s.month.tether / (s.capGB * 1073741824) * 100);
  return `<!doctype html><meta charset="utf-8"><title>리드나우 로컬 도우미</title><style>body{font-family:system-ui,'Malgun Gothic';margin:20px;max-width:760px}b.ok{color:#1F6F4A}b.no{color:#B0322A}.bar{height:14px;background:#eee;border-radius:7px;overflow:hidden}.bar i{display:block;height:100%;background:${pct > 90 ? '#B0322A' : '#3F7FD1'};width:${pct}%}td{padding:2px 8px}</style>
  <h2>리드나우 로컬 도우미 ${VERSION}</h2><p>알라딘 길(테더링): ${s.tether.ok ? `<b class="ok">✓ 확인됨</b> — ${s.tether.iface} · 공인 IP ${s.tether.ip}` : `<b class="no">✗ 막아 둠</b> — ${s.tether.why}`}<br>우리 서비스 길(와이파이): ${s.wifi.iface || '없음'} · 공인 IP ${s.wifi.ip || '?'}</p>
  <p>이번 달 테더링 ${gb(s.month.tether)} / ${s.capGB}GB${s.capped ? ' <b class="no">상한 — 닫힘</b>' : ''}</p><div class="bar"><i></i></div><p>오늘: 테더링 ${gb(s.today.tether)} · 와이파이 ${gb(s.today.wifi)} · 막은 요청 ${s.today.blocked}${s.today.lastBlocked ? ` (마지막: ${s.today.lastBlocked.host} — ${s.today.lastBlocked.why})` : ''}</p>
  <table>${Object.entries(s.today.groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td align=right>${(v / 1048576).toFixed(1)}MB</td></tr>`).join('')}</table>${s.defaultWarn ? `<p><b class="no">⚠ ${s.defaultWarn}</b></p>` : ''}<p style="color:#777">연결 후보: ${s.cand.join(' · ')}<br>업데이트: ${s.updMsg || '-'} · 30초마다 새로고침</p><script>setTimeout(()=>location.reload(),30000)</script>`; }
function api(req, res) { const u = new URL(req.url, 'http://rn.local'); const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Private-Network': 'true', 'Cache-Control': 'no-store' };
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...H, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': '*' }); return res.end(); }
  if (u.pathname === '/status') { res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(status())); }
  if (u.pathname === '/recheck') { checkTether('api').then(() => { res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(status())); }); return; }
  if (u.pathname === '/start') { const go = 'https://www.aladin.co.kr/shop/usedshop/wshopitem.aspx?SC=996008&rnPub=1'; res.writeHead(200, { ...H, 'Content-Type': 'text/html; charset=utf-8' }); return res.end(`<!doctype html><meta charset="utf-8"><title>리드나우 공개 수집 — 준비 중</title><body style="font-family:system-ui,'Malgun Gothic';margin:30px"><h2>리드나우 공개 수집</h2><p id="m">테더링 확인을 기다리는 중…</p><p style="color:#777">테더링이 확인되면 알라딘 공개 화면(수집기)으로 저절로 넘어갑니다. 확인되지 않으면 알라딘에는 아무 요청도 보내지 않습니다.</p><script>async function t(){try{const s=await (await fetch('/status',{cache:'no-store'})).json();if(s.tether.ok&&!s.capped){document.getElementById('m').textContent='✓ 테더링 확인 — 이동합니다';location.replace(${JSON.stringify(go)});return}document.getElementById('m').textContent='✗ '+(s.capped?'이번 달 테더링 상한 도달':s.tether.why)+' — 20초마다 다시 봄'}catch(e){document.getElementById('m').textContent='도우미 응답 없음 — 20초마다 다시 봄'}setTimeout(t,20000)}t()</script>`); }
  if (u.pathname === '/route') { const h = u.searchParams.get('host') || ''; res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ host: h, route: routeOf(h), group: groupOf(h), gate: gate(h).err || 'ok' })); }
  res.writeHead(200, { ...H, 'Content-Type': 'text/html; charset=utf-8' }); res.end(statusHtml()); }
const isSelf = (host) => /^(rn\.local|localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(host || ''));

/* ── 프록시 ── */
const server = http.createServer((req, res) => {
  let u; try { u = new URL(req.url.startsWith('http') ? req.url : 'http://' + (req.headers.host || 'rn.local') + req.url); } catch (e) { res.writeHead(400); return res.end('bad url'); }
  if (isSelf(u.host) || !req.url.startsWith('http')) return api(req, res); // 상태 화면(직접 열거나 rn.local로)
  const host = u.hostname, port = u.port || 80;
  openUp(host, port, (e, s, g) => { if (e) { addBlocked(host, e.message); res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'X-ReadNow-Block': encodeURIComponent(e.message) }); return res.end('리드나우 로컬 도우미: ' + e.message); }
    const hdr = { ...req.headers }; delete hdr['proxy-connection']; delete hdr['proxy-authorization'];
    const up = http.request({ createConnection: () => s, host, port, method: req.method, path: u.pathname + u.search, headers: hdr }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', (er) => { try { res.writeHead(502); res.end(er.message); } catch (x) {} }); req.pipe(up); });
});
server.on('connect', (req, cs, head) => { const m = String(req.url).match(/^\[?([^\]]+?)\]?:(\d+)$/); if (!m) { cs.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; } const [, host, port] = m;
  if (isSelf(host)) { cs.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
  openUp(host, port, (e, s) => { if (e) { addBlocked(host, e.message); try { cs.end(`HTTP/1.1 502 Bad Gateway\r\nX-ReadNow-Block: ${encodeURIComponent(e.message)}\r\n\r\n`); } catch (x) {} return; }
    cs.write('HTTP/1.1 200 Connection Established\r\n\r\n'); if (head && head.length) s.write(head); s.pipe(cs); cs.pipe(s);
    const kill = () => { try { s.destroy(); } catch (x) {} try { cs.destroy(); } catch (x) {} }; s.on('error', kill); cs.on('error', kill); s.on('close', kill); cs.on('close', kill); });
});
server.on('clientError', (e, sock) => { try { sock.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch (x) {} });
/* 테더링 길이 닫히면(확인 실패·상한) 열려 있던 테더링 연결도 바로 끊음 — 오래 열린 연결로 새지 않게 */
setInterval(() => { if (ST.tether.ok && !capped()) return; for (const e of live) if (e.route === 'tether') { try { e.sock.destroy(); } catch (x) {} } }, 3000);

server.listen(+CFG.port || 8899, '127.0.0.1', () => log(`리드나우 로컬 도우미 ${VERSION} 시작 — 127.0.0.1:${+CFG.port || 8899} · 자료 ${ROOT}`));
server.on('error', (e) => { log('프록시를 못 켬:', e.message, '(이미 켜져 있으면 무시)'); process.exit(e.code === 'EADDRINUSE' ? 0 : 1); });

/* ── 스스로 업데이트 (GitHub → 문법 검사 → 바꾸고 다시 켬) ── */
const UPD = { at: null, msg: null }; const RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-local.js';
function getText(url, cb) { https.get(url, { family: 4, localAddress: ST.wifi.localIp || undefined, timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return cb(new Error('HTTP ' + r.statusCode)); } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => cb(null, b)); }).on('error', cb).on('timeout', function () { this.destroy(new Error('시간 초과')); }); }
function selfUpdate() { if (CFG.selfUpdate === false) return; getText(RAW, (e, src) => { UPD.at = kst(); if (e) { UPD.msg = '확인 실패 ' + e.message; return; } const v = (src.match(/const VERSION = '([\d.]+)'/) || [])[1]; if (!v) { UPD.msg = '판 번호 없음'; return; }
    const n = (x) => x.split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); if (n(v) <= n(VERSION)) { UPD.msg = `최신(${VERSION})`; return; }
    const tmp = path.join(HOME, 'readnow-local.new.js'); fs.writeFileSync(tmp, src); const chk = cp.spawnSync(process.execPath, ['--check', tmp]); if (chk.status !== 0) { UPD.msg = `새 판 ${v} 검사 실패 — 그대로 둠`; log(UPD.msg); return; }
    try { fs.copyFileSync(__filename, path.join(HOME, `readnow-local.${VERSION}.bak.js`)); fs.renameSync(tmp, __filename); log(`새 판 ${v}로 바꿈 — 다시 켭니다`); uSave(); setTimeout(() => process.exit(0), 500); } catch (er) { UPD.msg = '바꾸기 실패 ' + er.message; log(UPD.msg); } }); }
if (!T_IF) setTimeout(selfUpdate, 60e3); setInterval(selfUpdate, 6 * 3600e3);
process.on('uncaughtException', (e) => { log('오류(계속 돎):', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e); });
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => { uSave(); process.exit(0); }));
module.exports = { routeOf, groupOf, pickIfaces, status, _ST: ST, _setCfg: (c) => { CFG = { ...DEF, ...c }; } };
