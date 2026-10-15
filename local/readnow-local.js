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
const VERSION = '1.4.2';
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
  /* (1.0.1 점검) google.com 통째가 아니라 꼭 필요한 주소만 — 알라딘 화면이 부르는 구글 쪽 주소(검색·광고·통계)가 와이파이로 나가지 않게 */
  'googleapis.com', 'firebaseio.com', 'firebaseapp.com', 'firebasedatabase.app', 'web.app', 'gstatic.com', 'accounts.google.com', 'apis.google.com', 'chromewebstore.google.com', 'clients1.google.com', 'clients2.google.com', 'clients4.google.com', 'googleusercontent.com', 'gvt1.com', 'gvt2.com', 'withgoogle.com', 'run.app', 'cloudfunctions.net',
  // GitHub(웹앱·수집기·공용 파일)·CDN·Tampermonkey
  'github.com', 'githubusercontent.com', 'github.io', 'githubassets.com', 'cdnjs.cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'tampermonkey.net',
  // 외부 정보 출처(알라딘 아님)
  /* (1.0.1 점검) 카카오·네이버도 통째가 아니라 쓰는 주소만(dapi.kakao.com · openapi/쇼핑 검색) */
  'bunjang.co.kr', 'ebay.com', 'ebayimg.com', 'frankfurter.app', 'frankfurter.dev', 'kpipa.or.kr', 'dapi.kakao.com', 'data4library.kr', 'dvdprime.com', 'koreaexim.go.kr', 'openapi.naver.com', 'search.shopping.naver.com', 'kyobobook.co.kr', 'ridibooks.com', 'joongna.com', 'abebooks.com', 'daangn.com', 'joongmo.com', 'nl.go.kr', 'yes24.com',
  // Windows·크롬 자체 업데이트
  'microsoft.com', 'windowsupdate.com', 'msftconnecttest.com', 'live.com', 'office.com', 'chromium.org',
];
/* (1.0.1 점검) 통계·광고 추적은 아예 막음(어느 길로도 안 나감) — 알라딘 화면에 심긴 통계가 이 PC를 다른 기록과 잇지 못하게 · 테더링 데이터도 아낌 */
const TRACK_HOSTS = ['google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com', 'analytics.google.com', 'facebook.com', 'facebook.net', 'criteo.com', 'criteo.net', 'wcs.naver.net', 'wcs.naver.com', 'lcs.naver.com', 'nlog.naver.com', 'pixel.kakao.com', 'track.tiara.kakao.com', 'stat.tiara.kakao.com', 'hotjar.com', 'clarity.ms', 'scorecardresearch.com', 'adnxs.com', 'mobon.net', 'dable.io', 'acecounter.com', 'logger.co.kr'];
const TRK = { n: 0, last: null };
const ALADIN = /(^|\.)aladin\.co\.kr$|(^|\.)aladin\.kr$/i; // 알라딘은 목록과 상관없이 무조건 테더링
const hostMatch = (h, list) => list.some((d) => h === d || h.endsWith('.' + d));
const isTrack = (host) => { const h = String(host || '').toLowerCase().replace(/\.$/, ''); return !ALADIN.test(h) && hostMatch(h, TRACK_HOSTS); };
/* (1.2.1) 알라딘 화면이 함께 부르는 구글 쪽 공용 파일(글꼴·jQuery·지도·자동 등록 방지·번역)은 googleapis/gstatic이어도 테더링으로 — 알라딘 화면을 볼 때 생기는 요청이 사무실 인터넷으로 하나도 나가지 않게(우리 서비스 Firebase·로그인·업데이트만 와이파이) */
const TETHER_FORCE = ['fonts.googleapis.com', 'fonts.gstatic.com', 'ajax.googleapis.com', 'maps.googleapis.com', 'maps.gstatic.com', 'translate.googleapis.com', 'translate-pa.googleapis.com', 'recaptcha.net', 'www.recaptcha.net', 'fundingchoicesmessages.google.com', 'pagead2.googlesyndication.com', 'tpc.googlesyndication.com'];
function routeOf(host) { const h = String(host || '').toLowerCase().replace(/\.$/, ''); if (ALADIN.test(h) || hostMatch(h, TETHER_FORCE)) return 'tether'; if (hostMatch(h, WIFI_HOSTS) || hostMatch(h, CFG.extraWifiHosts || [])) return 'wifi'; return 'tether'; }
function groupOf(host) { const h = String(host || '').toLowerCase();
  if (ALADIN.test(h)) return 'aladin';
  if (hostMatch(h, ['googleapis.com', 'firebaseio.com', 'firebaseapp.com', 'firebasedatabase.app', 'web.app', 'run.app', 'cloudfunctions.net'])) return 'firebase';
  if (hostMatch(h, ['accounts.google.com', 'apis.google.com', 'chromewebstore.google.com', 'clients1.google.com', 'clients2.google.com', 'clients4.google.com', 'gstatic.com', 'googleusercontent.com', 'withgoogle.com', 'gvt1.com', 'gvt2.com'])) return 'google';
  if (hostMatch(h, ['github.com', 'githubusercontent.com', 'github.io', 'githubassets.com', 'cdnjs.cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'tampermonkey.net'])) return 'update';
  if (hostMatch(h, ['bunjang.co.kr', 'ebay.com', 'ebayimg.com', 'frankfurter.app', 'frankfurter.dev', 'kpipa.or.kr', 'dapi.kakao.com', 'data4library.kr', 'dvdprime.com', 'koreaexim.go.kr', 'openapi.naver.com', 'search.shopping.naver.com', 'kyobobook.co.kr', 'ridibooks.com', 'joongna.com', 'abebooks.com', 'daangn.com', 'joongmo.com', 'nl.go.kr', 'yes24.com'])) return 'ext';
  if (hostMatch(h, ['microsoft.com', 'windowsupdate.com', 'msftconnecttest.com', 'live.com', 'office.com', 'chromium.org'])) return 'system';
  return routeOf(h) === 'tether' ? 'other_tether' : 'other'; }

/* ── 인터페이스 고르기 ── */
const VIRT = /vEthernet|VirtualBox|VMware|Hyper-V|Loopback|WSL|Bluetooth|TAP|Tailscale|ZeroTier|VPN|Npcap|Docker/i;
const WIFI_NAME = /Wi-?Fi|WLAN|무선|Wireless/i;
const T_FILE = process.env.RN_TEST_FILE || null; const T = () => (T_FILE ? JSON.parse(fs.readFileSync(T_FILE, 'utf8')) : null); const T_IF = T_FILE ? 1 : null; /* 시험용(RN_TEST_FILE이 있을 때만 — 연결·공인 IP·주소를 흉내) */
/* (1.1.1) 연결 이름만으로 고르면 '와이파이 대신 유선 랜(이더넷)'인 PC에서 이더넷이 둘(랜·USB 테더링)이 되어 아무것도 못 고르던 문제 →
 *  윈도우 장치 설명(Get-NetAdapter의 InterfaceDescription: 'Remote NDIS'·'Apple Mobile Device Ethernet' 등)과 휴대폰 테더링 주소대(아이폰 172.20.10.x · 안드로이드 192.168.42.x 등)로 테더링을 먼저 알아봄 · 남은 하나는 와이파이든 유선이든 '우리 서비스 길' */
const TETHER_DESC = /Remote NDIS|RNDIS|Apple Mobile Device|iPhone|Android|SAMSUNG Mobile|Mobile USB|USB.*(Ethernet|Tether|NCM)|NCM/i;
const TETHER_IP = /^172\.20\.10\.|^192\.168\.42\.|^192\.168\.(?:43|44|49)\./;
let DESC = {}; function loadDesc() { if (T_IF || process.platform !== 'win32') return; cp.exec('powershell -NoProfile -NonInteractive -Command "Get-NetAdapter | Select-Object Name,InterfaceDescription | ConvertTo-Json -Compress"', { timeout: 20000, windowsHide: true }, (e, out) => { if (e) return; try { const j = JSON.parse(out); const D = {}; (Array.isArray(j) ? j : [j]).forEach((x) => { if (x && x.Name) D[x.Name] = x.InterfaceDescription || ''; }); DESC = D; } catch (er) {} }); }
/* (1.2.0) 와이파이 이름(SSID) — netsh wlan show interfaces (한국어·영어 윈도우 모두) */
let SSID = {}; function loadSsid() { if (T_IF) { SSID = (T() || {}).ssid || {}; return; } if (process.platform !== 'win32') return; cp.exec('netsh wlan show interfaces', { timeout: 15000, windowsHide: true, encoding: 'buffer' }, (e, out) => { if (e || !out) return; let t = ''; try { t = new TextDecoder('euc-kr').decode(out); } catch (x) { t = out.toString(); } if (!/SSID/.test(t)) t = out.toString(); const S = {}; let cur = null; t.split(/\r?\n/).forEach((ln) => { const m = ln.match(/^\s*(Name|이름)\s*:\s*(.+?)\s*$/); if (m) cur = m[2]; const q = ln.match(/^\s*SSID\s*:\s*(.+?)\s*$/); if (q && cur) S[cur] = q[1]; }); SSID = { ...PROF, ...S }; }); }
/* 위치 권한이 꺼진 윈도우 11에서는 netsh가 SSID를 숨김 → 네트워크 프로필 이름(와이파이 목록에 보이는 이름과 같음)으로 채움 */
let PROF = {}; function loadProf() { if (T_IF || process.platform !== 'win32') return; cp.exec('powershell -NoProfile -NonInteractive -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-NetConnectionProfile | Select-Object InterfaceAlias,Name | ConvertTo-Json -Compress"', { timeout: 20000, windowsHide: true }, (e, out) => { if (e) return; try { const j = JSON.parse(out); const P = {}; (Array.isArray(j) ? j : [j]).forEach((x) => { if (x && x.InterfaceAlias && x.Name && (WIFI_NAME.test(x.InterfaceAlias) || /Wi-?Fi|Wireless|WLAN|802\.11/i.test(DESC[x.InterfaceAlias] || ''))) P[x.InterfaceAlias] = x.Name; }); /* 와이파이 연결만(유선·테더링의 '네트워크 2' 같은 이름은 빼고) */ PROF = P; Object.keys(P).forEach((k) => { if (!SSID[k]) SSID[k] = P[k]; }); } catch (er) {} }); }
loadDesc(); loadProf(); loadSsid(); setInterval(() => { loadDesc(); loadProf(); loadSsid(); }, 60e3);
const isTetherLike = (x) => TETHER_DESC.test(x.desc || '') || TETHER_IP.test(x.ip || '');
function ifaces() { if (T_IF) return T().ifaces.map((x) => ({ ...x, virt: VIRT.test(x.name) && !TETHER_DESC.test(x.desc || '') })); const L = []; const N = os.networkInterfaces(); for (const [name, arr] of Object.entries(N)) for (const a of arr || []) { if (a.family !== 'IPv4' && a.family !== 4) continue; if (a.internal || /^169\.254\./.test(a.address)) continue; const desc = DESC[name] || ''; L.push({ name, ip: a.address, desc, virt: (VIRT.test(name) || VIRT.test(desc)) && !TETHER_DESC.test(desc) }); } return L; }
function pickIfaces() { const L = ifaces(); const real = L.filter((x) => !x.virt); const by = (n) => L.find((x) => x.name === n);
  let wifi = CFG.wifiIface ? by(CFG.wifiIface) : null, tether = CFG.tetherIface ? by(CFG.tetherIface) : null; let why = '';
  if (!tether) { const t = real.filter((x) => isTetherLike(x) && (!wifi || x.name !== wifi.name)); if (t.length === 1) tether = t[0]; } /* (1.1.1) 장치 설명·주소대로 먼저 */
  if (!wifi && tether) { const w = real.filter((x) => x.name !== tether.name); const ww = w.filter((x) => WIFI_NAME.test(x.name)); if (w.length === 1) wifi = w[0]; else if (ww.length === 1) wifi = ww[0]; }
  if (!wifi) { const w = real.filter((x) => WIFI_NAME.test(x.name) && (!tether || x.name !== tether.name)); if (w.length === 1) wifi = w[0]; }
  if (!tether) { const t = real.filter((x) => (!wifi || x.name !== wifi.name) && !WIFI_NAME.test(x.name)); if (t.length === 1) tether = t[0]; else if (t.length > 1) why = `테더링 후보가 여럿(${t.map((x) => x.name).join(', ')}) — 도우미 화면(http://127.0.0.1:8899)의 🔌 연결 고르기에서 테더링을 골라 주세요`; else why = real.length ? `테더링 연결을 못 찾음(지금 연결: ${real.map((x) => x.name + (x.desc ? ' [' + x.desc + ']' : '')).join(', ')}) — 휴대폰을 USB로 꽂고 휴대폰 설정에서 USB 테더링을 켜세요` : '이 PC에 인터넷 연결이 하나도 없음 — 와이파이(또는 랜선)와 USB 테더링을 확인하세요'; }
  if (!wifi) { const w = real.filter((x) => !tether || x.name !== tether.name); if (w.length === 1) wifi = w[0]; else if (!why) why = real.length > 1 ? `우리 서비스 길(와이파이·유선)을 못 고름(${real.map((x) => x.name).join(', ')}) — 도우미 화면(http://127.0.0.1:8899)의 🔌 연결 고르기에서 우리 서비스 길을 골라 주세요` : '테더링 말고 다른 인터넷(와이파이·유선)이 없음 — 우리 서비스(Firebase·GitHub)는 와이파이로만 나가므로 와이파이(또는 랜선)를 연결하세요'; }
  if (wifi && tether && wifi.ip === tether.ip) { why = '와이파이와 테더링이 같은 연결로 보임'; tether = null; }
  return { wifi, tether, all: L, why }; }

/* ── 공인 IP 확인 (각 길로 따로) ── */
function publicIp(localAddress) { if (T_IF) return Promise.resolve(T().pubip[localAddress] || null); return new Promise((res) => { const rq = https.get({ host: 'api.ipify.org', path: '/?format=text', localAddress, timeout: 10000, family: 4, lookup: (h, o, cb) => dns.lookup(h, { family: 4 }, cb) }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => res(/^\d+\.\d+\.\d+\.\d+$/.test(b.trim()) ? b.trim() : null)); }); rq.on('timeout', () => { rq.destroy(); res(null); }); rq.on('error', () => res(null)); }); }
const ST = { tether: { ok: false, why: '아직 확인 전', ip: null, iface: null, localIp: null, at: null }, wifi: { ip: null, iface: null, localIp: null }, cand: [], startedAt: kst() };
let checking = false;
async function checkTether(reason) { if (checking) return; checking = true; try {
    const P = pickIfaces(); ST.wifi.ssid = P.wifi ? SSID[P.wifi.name] || null : null; ST.wifi.desc = P.wifi ? P.wifi.desc || null : null; ST.list = P.all.map((x) => ({ name: x.name, ip: x.ip, desc: x.desc || '', ssid: SSID[x.name] || null, virt: !!x.virt, tetherLike: isTetherLike(x), role: P.tether && P.tether.name === x.name ? 'tether' : P.wifi && P.wifi.name === x.name ? 'wifi' : null, fixed: CFG.tetherIface === x.name ? 'tether' : CFG.wifiIface === x.name ? 'wifi' : null })); ST.cand = P.all.map((x) => `${x.name}(${x.ip}${x.desc ? ' · ' + x.desc : ''})${x.virt ? '·가상' : ''}${isTetherLike(x) ? '·테더링으로 보임' : ''}`); ST.wifi.iface = P.wifi ? P.wifi.name : null; ST.wifi.localIp = P.wifi ? P.wifi.ip : null;
    if (!P.tether || !P.wifi) { setTether(false, P.why || '연결을 못 고름', null, P.tether); return; }
    const [ipT, ipW] = await Promise.all([publicIp(P.tether.ip), publicIp(P.wifi.ip)]); ST.wifi.ip = ipW;
    if (!ipT) { setTether(false, `테더링(${P.tether.name})으로 인터넷이 안 됨`, null, P.tether); return; }
    if (!ipW) { setTether(false, `와이파이(${P.wifi.name})로 공인 IP를 못 봄 — 견줄 수 없어 막아 둠`, ipT, P.tether); return; }
    if (ipT === ipW) { setTether(false, `테더링과 와이파이의 공인 IP가 같음(${ipT}) — 같은 길로 나가고 있어 막아 둠`, ipT, P.tether); return; }
    setTether(true, '', ipT, P.tether); checkDefault(); aladinTest(P.tether.ip);
  } catch (e) { setTether(false, '확인 중 오류: ' + e.message, null, null); } finally { checking = false; } }
/* (1.3.1) 알라딘 길 시험 — 테더링이 확인되면 www.aladin.co.kr 이름 찾기와 443 연결(테더링으로)만 해 봄(요청은 보내지 않음) · 상태·첫 화면에 결과 */
function aladinTest(local) { if (T_IF) { ST.aladin = { ok: true, why: '', at: kst() }; return; } lookup4('www.aladin.co.kr', (e, ip) => { if (e) { ST.aladin = { ok: false, why: e.message, at: kst() }; log('✗ 알라딘 길 시험:', e.message); return; } const s2 = net.connect({ host: ip, port: 443, localAddress: local, family: 4 }); let done = false; const end = (ok, why) => { if (done) return; done = true; try { s2.destroy(); } catch (x) {} const was = ST.aladin && ST.aladin.ok; ST.aladin = { ok, why, ip, at: kst() }; if (was !== ok) log(ok ? `✓ 알라딘 길 시험 — ${ip}:443 연결됨(테더링)` : `✗ 알라딘 길 시험 — ${why}`); }; s2.once('connect', () => end(true, '')); s2.once('error', (er) => end(false, '알라딘 서버에 연결 안 됨(' + er.code + ')')); s2.setTimeout(8000, () => end(false, '알라딘 서버 연결 시간 초과')); }, { route: 'tether', local }); }
function defaultLocalIp() { return new Promise((res) => { if (T_IF) return res((T().defaultIp) || null); const u = dgram.createSocket('udp4'); u.on('error', () => { try { u.close(); } catch (e) {} res(null); }); u.connect(53, '8.8.8.8', () => { let a = null; try { a = u.address().address; } catch (e) {} try { u.close(); } catch (e) {} res(a); }); }); } /* 보내지 않고 '기본 길'로 쓸 내 주소만 봄 */
async function checkDefault() { const a = await defaultLocalIp(); ST.defaultIp = a; ST.defaultWarn = a && ST.tether.localIp && a === ST.tether.localIp ? `윈도우 기본 길이 테더링(${ST.tether.iface})으로 잡혀 있어, 이 도우미를 거치지 않는 프로그램(윈도우 업데이트 등)의 데이터가 테더링으로 나갑니다 — 고치기: 시작 단추 오른쪽 클릭 → '터미널(관리자)'에서 설치 한 줄(irm …install.ps1 | iex)을 한 번 더 실행하면 1분마다 저절로 맞춤(바로 고치려면 같은 창에서: Set-NetIPInterface -InterfaceAlias "${ST.tether.iface}" -InterfaceMetric 9000)` : null; if (ST.defaultWarn && ST._dw !== ST.defaultWarn) log('⚠ ' + ST.defaultWarn); ST._dw = ST.defaultWarn; }
setInterval(checkDefault, 60e3);
function setTether(ok, why, ip, t) { const was = ST.tether.ok; if (ok && t && t.name !== ST._ifw) { ST._ifw = t.name; try { fs.writeFileSync(path.join(HOME, 'tether-iface.txt'), t.name); } catch (e) {} } /* (1.3.0) 관리자 예약 작업(ReadNow-TetherMetric)이 이 이름의 우선순위를 뒤로 */ ST.tether = { ok, why, ip, iface: t ? t.name : null, desc: t ? t.desc || null : null, localIp: t ? t.ip : null, at: kst() }; if (was !== ok || (!ok && why !== ST._lastWhy)) log(ok ? `✓ 테더링 확인 — ${t.name} 공인 IP ${ip} (와이파이 ${ST.wifi.ip})` : `✗ 테더링 막음 — ${why}`); ST._lastWhy = why; }
setInterval(() => checkTether('timer'), 120e3); setTimeout(() => checkTether('start'), 500);
let ifSig = JSON.stringify(ifaces()); setInterval(() => { const s = JSON.stringify(ifaces()); if (s !== ifSig) { ifSig = s; log('연결이 바뀜 → 테더링 다시 확인'); ST.tether.ok = false; checkTether('change'); } }, 5000); /* 시작할 때의 연결을 기준으로 */ /* 연결이 바뀌면 바로 막고 다시 확인 */

/* ── 사용량 (실제 주고받은 바이트) ── */
let U = null; const uPath = (m) => path.join(NET_DIR, `usage-${m}.json`);
function uLoad(m) { try { return JSON.parse(fs.readFileSync(uPath(m), 'utf8')); } catch (e) { return { month: m, days: {}, total: { tether: 0, wifi: 0 } }; } }
function uCur() { const m = month(); if (!U || U.month !== m) { if (U) uSave(); U = uLoad(m); } return U; }
function addBytes(route, group, n) { if (!n) return; const u = uCur(); const d = day(); const D = (u.days[d] = u.days[d] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }); D[route] = (D[route] || 0) + n; const gk = route + ':' + group; D.groups[gk] = (D.groups[gk] || 0) + n; u.total[route] = (u.total[route] || 0) + n; uDirty = true; if (route === 'tether') addTetherPend(n); }
/* (1.1.0) 📶 테더링을 주요/일반/기타로 나눠 셈 — 수집기가 30초마다 /meter?main=글자&gen=글자 로 '그동안 읽은 알라딘 화면 크기'를 부류별로 알려 줌
 *  10초마다 그동안 늘어난 테더링 바이트를 그 사이 알려 온 글자 몫대로 나눔 · 알려 온 것이 없으면(쉬는 중·크롬 자체·광고 등) '기타' · 45초 넘게 지난 알림은 버림
 *  여러 탭·여러 일이 함께 돌아도 글자 몫대로 나뉨 · 한 달 합(total.tiers)과 날마다(days[날].tiers)를 사용량 파일에 함께 남김 */
let PEND_T = 0; const MET = []; function addTetherPend(n) { PEND_T += n; }
function meterAdd(q) { const m = Math.max(0, +q.main || 0), g = Math.max(0, +q.gen || 0); if (m + g > 0) MET.push({ at: Date.now(), main: m, gen: g }); }
function meterSplit() { if (!PEND_T) { while (MET.length && Date.now() - MET[0].at > 45e3) MET.shift(); return; } const n = PEND_T; PEND_T = 0; while (MET.length && Date.now() - MET[0].at > 45e3) MET.shift(); const fresh = MET; /* 최근 45초 안의 알림으로 몫을 나눔(알림은 30초마다 — 그 사이 10초 창들도 같은 몫으로) */ const cm = fresh.reduce((a, x) => a + x.main, 0), cg = fresh.reduce((a, x) => a + x.gen, 0);
  const add = (k, v) => { if (!v) return; const u = uCur(); const d = day(); const D = (u.days[d] = u.days[d] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }); D.tiers = D.tiers || {}; D.tiers[k] = (D.tiers[k] || 0) + v; u.total.tiers = u.total.tiers || {}; u.total.tiers[k] = (u.total.tiers[k] || 0) + v; uDirty = true; };
  if (cm + cg <= 0) return add('other', n); const a = Math.round(n * cm / (cm + cg)); add('main', a); add('gen', n - a); }
function addBlocked(host, why) { const u = uCur(); const d = day(); const D = (u.days[d] = u.days[d] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }); D.blocked = (D.blocked || 0) + 1; D.lastBlocked = { host, why, at: kst() }; uDirty = true; }
let uDirty = false; function uSave() { if (!U) return; try { const p = uPath(U.month); fs.writeFileSync(p + '.tmp', JSON.stringify(U)); fs.renameSync(p + '.tmp', p); uDirty = false; } catch (e) { log('사용량 저장 실패', e.message); } }
setInterval(() => { if (uDirty) uSave(); }, 30e3);
const capBytes = () => Math.round((+CFG.capGB || 48) * 1073741824 * Math.min(100, Math.max(50, +CFG.capStopPct || 99)) / 100);
const capped = () => (uCur().total.tether || 0) >= capBytes();
/* 연결마다 늘어난 만큼만 더함(오래 열린 연결도 10초마다) */
const live = new Set(); function track(sock, route, group) { const e = { sock, route, group, r: 0, w: 0 }; live.add(e); const flush = () => { const r = sock.bytesRead || 0, w = sock.bytesWritten || 0; addBytes(route, group, (r - e.r) + (w - e.w)); e.r = r; e.w = w; }; e.flush = flush; sock.once('close', () => { flush(); live.delete(e); }); }
setInterval(() => { for (const e of live) e.flush(); meterSplit(); }, 10e3);

/* ── 길마다 연결 열기 (막힘 기본) ── */
function gate(host) { const route = routeOf(host); if (route === 'tether') { if (!ST.tether.ok) return { err: '테더링 확인 안 됨 — ' + (ST.tether.why || '') }; if (capped()) return { err: `테더링 한 달 상한(${CFG.capGB}GB) 도달 — 다음 달까지 닫음` }; return { route, local: ST.tether.localIp }; } if (!ST.wifi.localIp) return { err: '와이파이 연결이 없음' }; return { route, local: ST.wifi.localIp }; }
/* (1.3.0) 테더링으로 나갈 주소(알라딘 등)의 이름 찾기(DNS)도 테더링으로 · 공용 DNS(1.1.1.1·8.8.8.8)에 직접 물음 — 윈도우 hosts(이 PC의 다른 프로그램이 알라딘에 못 가게 막아 둔 것)를 보지 않고, 사무실 인터넷으로 '알라딘 주소'를 묻지도 않음 */
/* (1.3.1) 테더링 DNS — ① 공용 DNS(1.1.1.1·8.8.8.8)를 테더링으로 ② 안 되면 이 PC에 잡힌 DNS 서버들을 테더링으로 ③ 그래도 안 되면 공용 DNS를 기본 길로(이름만 묻는 것 — 알라딘 접속 자체는 늘 테더링)
 *  윈도우 hosts(이 PC의 다른 프로그램을 막아 둔 0.0.0.0)는 보지 않음 · 0.0.0.0·127.x 같은 답은 버림 · 5분 기억 */
const RESV = new Map(); function resvFor(local, servers) { const k = (local || '-') + '|' + servers.join(','); let r = RESV.get(k); if (!r) { r = new dns.Resolver({ timeout: 3000, tries: 2 }); if (local) { try { r.setLocalAddress(local); } catch (e) {} } try { r.setServers(servers); } catch (e) {} RESV.set(k, r); } return r; }
const DNSC = new Map(); const goodIp = (a) => net.isIPv4(a) && !/^(0\.|127\.|10\.|192\.168\.|169\.254\.)/.test(a);
function resolveVia(local, host, cb) { const sys = dns.getServers().filter((x) => net.isIPv4(x) && !/^127\./.test(x)); const plans = [[local, ['1.1.1.1', '8.8.8.8', '1.0.0.1']], [local, sys], [null, ['1.1.1.1', '8.8.8.8']]].filter(([, sv]) => sv.length); let i = 0, why = [];
  const next = () => { if (i >= plans.length) return cb(new Error('테더링으로 주소를 못 찾음(' + why.join(' · ') + ')')); const [lo, sv] = plans[i++]; resvFor(lo, sv).resolve4(host, (e, a) => { const ok = (a || []).filter(goodIp); if (!e && ok.length) { if (i > 1) ST.dnsNote = `DNS ${i}번째 길(${lo ? '테더링' : '기본 길'} · ${sv[0]})로 찾음`; return cb(null, ok[0]); } why.push((lo ? '테더링' : '기본') + ' ' + sv[0] + ' ' + (e ? e.code : '쓸 수 없는 답')); next(); }); }; next(); }
function lookup4(host, cb, g) { if (net.isIPv4(host)) return cb(null, host); if (T_IF) { const D = T().dns; return D[host] ? cb(null, D[host]) : cb(new Error('주소 없음')); }
  if (g && g.route === 'tether') { const c = DNSC.get(host); if (c && Date.now() - c.at < 300e3) return cb(null, c.ip); return resolveVia(g.local, host, (e, ip) => { if (!e) DNSC.set(host, { ip, at: Date.now() }); cb(e, ip); }); }
  dns.lookup(host, { family: 4 }, (e, a) => cb(e, a)); }
function openUp(host, port, cb) { const g = gate(host); if (g.err) return cb(new Error(g.err), null, g);
  lookup4(host, (e, ip) => { if (e) return cb(e, null, g); const s = net.connect({ host: ip, port: +port, localAddress: g.local, family: 4 }); let done = false; s.once('connect', () => { if (done) return; done = true; track(s, g.route, groupOf(host)); cb(null, s, g); }); s.once('error', (er) => { if (done) return; done = true; cb(er, null, g); }); s.setTimeout(30000, () => { if (!done) { done = true; s.destroy(); cb(new Error('연결 시간 초과'), null, g); } }); }, g); }

/* ── 상태 화면·API ── */
function status() { const u = uCur(); const d = u.days[day()] || { tether: 0, wifi: 0, groups: {}, blocked: 0 }; return { ok: true, ver: VERSION, at: kst(), track: { ...TRK }, tether: ST.tether, aladin: ST.aladin || null, dnsNote: ST.dnsNote || null, wifi: ST.wifi, cand: ST.cand, list: ST.list || [], fixed: { tether: CFG.tetherIface || null, wifi: CFG.wifiIface || null }, capGB: +CFG.capGB || 48, capBytes: capBytes(), capped: capped(), month: { key: u.month, tether: u.total.tether || 0, wifi: u.total.wifi || 0, tiers: u.total.tiers || {} }, today: { key: day(), tether: d.tether || 0, wifi: d.wifi || 0, tiers: d.tiers || {}, groups: d.groups || {}, blocked: d.blocked || 0, lastBlocked: d.lastBlocked || null }, days: Object.fromEntries(Object.entries(u.days).map(([k, v]) => [k, { tether: v.tether || 0, wifi: v.wifi || 0, groups: v.groups || {} }])), startedAt: ST.startedAt, updAt: UPD.at, updMsg: UPD.msg, defaultWarn: ST.defaultWarn || null }; }
const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* (1.2.0) 🔌 연결 고르기 표 — 연결마다 이름·와이파이 이름·장치 설명·주소, 지금 맡은 일, [테더링으로] [우리 서비스 길로] · 맨 아래 [둘 다 자동으로]
 *  테더링으로 보이지 않는 연결을 테더링으로 고르면 바로 하지 않고 옆에 '정말 테더링' 단추가 한 번 더 나옴(잘못 고르면 알라딘이 사무실 인터넷으로 나갈 수 있음 — 공인 IP가 같으면 어차피 막힘) */
function connHtml(s) { const L = (s.list || []).filter((x) => !x.virt); const role = (x) => x.role === 'tether' ? '<b style="color:#1F6F4A">📱 테더링(알라딘)</b>' : x.role === 'wifi' ? '<b style="color:#3F7FD1">🏢 우리 서비스 길</b>' : '<span style="color:#999">안 씀</span>';
  const rows = L.map((x) => `<tr><td><b>${esc(x.name)}</b>${x.ssid ? `<br><small>와이파이 ${esc(x.ssid)}</small>` : ''}${x.desc ? `<br><small style="color:#777">${esc(x.desc)}</small>` : ''}</td><td><small>${esc(x.ip)}${x.tetherLike ? '<br>📱 테더링으로 보임' : ''}</small></td><td>${role(x)}${x.fixed ? '<br><small>(직접 고름)</small>' : '<br><small style="color:#999">(자동)</small>'}</td><td><button data-r="tether" data-n="${esc(x.name)}" data-like="${x.tetherLike ? 1 : 0}">테더링으로</button> <button data-r="wifi" data-n="${esc(x.name)}">우리 서비스 길로</button></td></tr>`).join('');
  return `<h3>🔌 연결 고르기</h3><p style="color:#555;font-size:13px">보통은 저절로 고릅니다(휴대폰 테더링 = 장치 설명·주소로 알아봄, 남은 하나 = 와이파이·유선). 틀리게 골랐거나 '못 고름'이 뜨면 여기서 직접 고르세요 — 바로 저장되고 2초 안에 다시 확인합니다. 휴대폰을 다른 USB 구멍에 꽂으면 윈도우가 이름을 바꿀 수 있어, 그때는 '둘 다 자동으로'가 안전합니다.</p>
  <table border=0 style="border-collapse:collapse;font-size:14px">${rows || '<tr><td>연결이 하나도 없음</td></tr>'}</table><p><button data-r="auto">둘 다 자동으로</button> <span id="pm" style="color:#1F6F4A"></span></p>
  <script>(function(){const K=${JSON.stringify(PICK_KEY)};const m=document.getElementById('pm');let arm=null;
  async function go(role,name){m.textContent='저장하는 중…';try{const q=async(r,n)=>{const x=await fetch('/pick?k='+K+'&role='+r+'&name='+encodeURIComponent(n||''),{method:'POST'});if(!x.ok)throw new Error(await x.text());return x.json()};let st;if(role==='auto'){await q('tether','');st=await q('wifi','')}else st=await q(role,name);m.textContent='✓ 저장 — '+(st.tether.ok?'테더링 확인됨':'아직 막아 둠: '+st.tether.why);setTimeout(()=>location.reload(),1500)}catch(e){m.textContent='✗ '+e.message}}
  document.querySelectorAll('button[data-r]').forEach((b)=>b.onclick=()=>{const r=b.dataset.r,n=b.dataset.n;if(r==='tether'&&b.dataset.like!=='1'&&arm!==b){arm=b;b.textContent='⚠ 테더링으로 안 보임 — 정말 테더링(한 번 더)';return}go(r,n)})})();</script>`; }
const gb = (b) => (b / 1073741824).toFixed(2) + 'GB';
function statusHtml() { const s = status(); const pct = Math.min(100, s.month.tether / (s.capGB * 1073741824) * 100);
  return `<!doctype html><meta charset="utf-8"><title>리드나우 로컬 도우미</title><style>body{font-family:system-ui,'Malgun Gothic';margin:20px;max-width:760px}b.ok{color:#1F6F4A}b.no{color:#B0322A}.bar{height:14px;background:#eee;border-radius:7px;overflow:hidden}.bar i{display:block;height:100%;background:${pct > 90 ? '#B0322A' : '#3F7FD1'};width:${pct}%}td{padding:2px 8px}</style>
  <h2>리드나우 로컬 도우미 ${VERSION}</h2><p>알라딘 길(테더링): ${s.tether.ok ? `<b class="ok">✓ 확인됨</b> — ${s.tether.iface} · 공인 IP ${s.tether.ip}` : `<b class="no">✗ 막아 둠</b> — ${s.tether.why}`}${s.tether.ok && s.aladin ? (s.aladin.ok ? ` · 알라딘 연결 시험 <b class="ok">✓</b>` : ` · 알라딘 연결 시험 <b class="no">✗ ${esc(s.aladin.why)}</b>`) : ''}<br>우리 서비스 길(와이파이·유선): ${s.wifi.iface ? esc(s.wifi.iface) + (s.wifi.ssid ? ` — 와이파이 <b>${esc(s.wifi.ssid)}</b>` : '') : '없음'} · 공인 IP ${s.wifi.ip || '?'}${s.tether.iface ? `<br>테더링 연결: <b>${esc(s.tether.iface)}</b>${s.tether.desc ? ` (${esc(s.tether.desc)})` : ''}` : ''}</p>${connHtml(s)}
  <p>이번 달 테더링 ${gb(s.month.tether)} / ${s.capGB}GB${s.capped ? ' <b class="no">상한 — 닫힘</b>' : ''}</p><div class="bar"><i></i></div><p>이번 달 나눔: 주요 ${gb((s.month.tiers || {}).main || 0)} · 일반 ${gb((s.month.tiers || {}).gen || 0)} · 기타 ${gb((s.month.tiers || {}).other || 0)} <small style="color:#777">(수집기가 알려 준 일 부류로 · 1.1.0부터)</small></p><p>오늘: 테더링 ${gb(s.today.tether)} · 와이파이 ${gb(s.today.wifi)} · 막은 요청 ${s.today.blocked}${s.today.lastBlocked ? ` (마지막: ${s.today.lastBlocked.host} — ${s.today.lastBlocked.why})` : ''}</p>
  <table>${Object.entries(s.today.groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td align=right>${(v / 1048576).toFixed(1)}MB</td></tr>`).join('')}</table>${s.defaultWarn ? `<p><b class="no">⚠ ${s.defaultWarn}</b></p>` : ''}<p style="color:#777">업데이트: ${s.updMsg || '-'} · 30초마다 새로고침</p><script>setTimeout(()=>location.reload(),30000)</script>`; }
function api(req, res) { const u = new URL(req.url, 'http://rn.local'); if (/^\/img-/.test(u.pathname)) return imgApi(u, req, res); const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Private-Network': 'true', 'Cache-Control': 'no-store' };
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...H, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': '*' }); return res.end(); }
  if (u.pathname === '/meter') { meterAdd({ main: u.searchParams.get('main'), gen: u.searchParams.get('gen') }); res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end('{"ok":true}'); }
  if (u.pathname === '/status') { res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify(status())); }
  if (u.pathname === '/pick') { const org = req.headers.origin || ''; if (req.method !== 'POST' || (org && !/^http:\/\/(127\.0\.0\.1|localhost|rn\.local)(:\d+)?$/.test(org)) || u.searchParams.get('k') !== PICK_KEY) { res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('상태 화면에서만 고를 수 있음'); }
    const role = u.searchParams.get('role'), name = u.searchParams.get('name') || ''; if (!['tether', 'wifi'].includes(role)) { res.writeHead(400); return res.end('bad'); } pickSet(role, name).then(() => { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(status())); }); return; }
  if (u.pathname === '/recheck') { checkTether('api').then(() => { res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(status())); }); return; }
  if (u.pathname === '/start') { const go = 'https://www.aladin.co.kr/usedstore/wgate.aspx#rnPub'; /* (1.2.1) 누구나 여는 중고매장 첫 화면 · #rnPub은 알라딘 서버로 가지 않음 */ res.writeHead(200, { ...H, 'Content-Type': 'text/html; charset=utf-8' }); return res.end(`<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>리드나우 공개 수집 — 준비 중</title><body style="font-family:system-ui,'Malgun Gothic';margin:30px"><h2>리드나우 공개 수집</h2><p id="tm" style="line-height:1.7"></p><p id="m">테더링 확인을 기다리는 중…</p><p id="nm" style="line-height:1.7"></p><p style="color:#777">테더링이 확인되면 알라딘 공개 화면(수집기)으로 저절로 넘어갑니다. 확인되지 않으면 알라딘에는 아무 요청도 보내지 않습니다.</p><script>const RAWU='https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/readnow-collector.user.js';let colOk=null;function colCheck(){const v=document.documentElement.getAttribute('data-rn-collector');const el=document.getElementById('tm');if(v){colOk=v;el.innerHTML='✓ 이 크롬에 리드나우 수집기 '+v.replace(/[^0-9.]/g,'')+' 있음';return true}colOk=false;el.innerHTML='<b style=color:#B0322A>✗ 이 크롬에서 리드나우 수집기가 돌지 않음</b> — 알라딘으로 넘어가지 않고 기다립니다. 하나씩 확인:<ol><li>크롬 웹스토어에서 <b>Tampermonkey</b> 설치(이 크롬에서)</li><li>주소창에 <code>chrome://extensions</code> → Tampermonkey <b>세부정보</b> → <b>사용자 스크립트 허용</b> 켜기(없으면 오른쪽 위 <b>개발자 모드</b> 켜기)</li><li><a href='+RAWU+' target=_blank>여기를 눌러 수집기 설치</a> → Tampermonkey 화면에서 <b>설치</b>(이미 있으면 <b>다시 설치/업데이트</b>) · 다른 PC에서 동기화로 들어온 「로컬 폴더 껍데기」가 있으면 지우고 이것으로</li><li>Tampermonkey <b>동기화는 끔</b> · 이 화면 새로고침</li></ol>';return false}
async function t(){if(colOk===null){await new Promise((r)=>setTimeout(r,2500));if(!colCheck()){setTimeout(()=>{colOk=null;t()},5000);return}}try{const s=await (await fetch('/status',{cache:'no-store'})).json();if(s.tether.ok&&!s.capped&&(!s.aladin||s.aladin.ok)){document.getElementById('m').textContent='✓ 테더링 확인 — 이동합니다';(function(){const a=document.createElement('a');a.rel='noreferrer';a.href=${JSON.stringify(go)};document.body.appendChild(a);a.click()})();return}document.getElementById('m').textContent='✗ '+(s.capped?'이번 달 테더링 상한 도달':!s.tether.ok?s.tether.why:'알라딘 연결 시험 실패 — '+(s.aladin&&s.aladin.why))+' — 20초마다 다시 봄';const E=(x)=>String(x||'').replace(/[&<>"']/g,(c)=>'&#'+c.charCodeAt(0)+';');const w=s.wifi||{},T=s.tether||{};document.getElementById('nm').innerHTML='📱 테더링: '+(T.iface?'<b>'+E(T.iface)+'</b>'+(T.desc?' ('+E(T.desc)+')':''):'못 찾음')+'<br>🏢 우리 서비스 길: '+(w.iface?'<b>'+E(w.iface)+'</b>'+(w.ssid?' — 와이파이 <b>'+E(w.ssid)+'</b>':''):'못 찾음')+'<br><a href="/">🔌 연결 고르기·자세히</a>'}catch(e){document.getElementById('m').textContent='도우미 응답 없음 — 20초마다 다시 봄'}setTimeout(t,20000)}t()</script>`); }
  if (u.pathname === '/route') { const h = u.searchParams.get('host') || ''; res.writeHead(200, { ...H, 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ host: h, route: isTrack(h) ? 'blocked(track)' : routeOf(h), group: groupOf(h), gate: gate(h).err || 'ok' })); }
  res.writeHead(200, { ...H, 'Content-Type': 'text/html; charset=utf-8' }); res.end(statusHtml()); }
/* (1.2.0) 🔌 연결 고르기 — 상태 화면에서 '이것이 테더링 / 이것이 우리 서비스 길 / 자동'을 고르면 readnow-local.json에 적고 바로 다시 확인
 *  이 PC의 웹 페이지(알라딘 화면 등)가 몰래 바꾸지 못하게: POST만 · 상태 화면에만 심긴 일회성 열쇠(PICK_KEY — /status에 안 나감) · 다른 출처(Origin)면 거절 · 같은 연결을 둘 다로는 못 고름 */
const PICK_KEY = require('crypto').randomBytes(16).toString('hex');
function pickSet(role, name) { let J = {}; try { J = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { J = {}; }
  const other = role === 'tether' ? 'wifiIface' : 'tetherIface'; const key = role === 'tether' ? 'tetherIface' : 'wifiIface';
  if (name && (J[other] || CFG[other]) === name) J[other] = ''; J[key] = name || ''; fs.writeFileSync(CFG_PATH, JSON.stringify({ ...J }, null, 1)); cfgAt = 0; loadCfg(); CFG[key] = name || ''; if (name && CFG[other] === name) CFG[other] = '';
  log(`🔌 연결 고르기: ${role === 'tether' ? '테더링' : '우리 서비스 길'} = ${name || '자동'}`); ST.tether.ok = false; return checkTether('pick'); }
/* (1.4.0) 📷 사진 보관(D:\\ReadNow\\images) — 로거의 수집기가 Firebase 저장소·사진 칸에서 새 사진만 받아(와이파이) 여기로 보냄 · 이 PC에 저장소와 같은 길(img/…, pur_photos/…)로 씀
 *  있는 파일은 절대 덮지 않음 · 이 PC의 웹 페이지(알라딘 화면 등)는 쓸 수 없음: 꼭 'X-RN-Img' 머리(브라우저 페이지는 이 머리를 붙이면 사전 확인에서 막힘 — 이 길에는 CORS 허락을 주지 않음) · 이름은 글자·숫자·_-./만, '..' 금지 */
const IMG_DIR = path.join(ROOT, 'images'); let IMGX = null, IMGX_AT = 0; const IMGST = { put: 0, bytes: 0, skip: 0, last: null };
const imgName = (n) => { n = String(n || '').replace(/\\/g, '/'); return /^[A-Za-z0-9_\-.][A-Za-z0-9_\-./]{0,300}$/.test(n) && !n.includes('..') && !n.includes('//') ? n : null; };
function imgIndex() { if (IMGX && Date.now() - IMGX_AT < 600e3) return IMGX; const M = new Map(); const walk = (d, rel) => { let L = []; try { L = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; } for (const x of L) { const r = rel ? rel + '/' + x.name : x.name; if (x.isDirectory()) walk(path.join(d, x.name), r); else if (x.isFile()) { try { M.set(r, fs.statSync(path.join(d, x.name)).size); } catch (e) {} } } }; walk(IMG_DIR, ''); IMGX = M; IMGX_AT = Date.now(); return M; }
function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); req.on('error', cb); }
function imgApi(u, req, res) { const J = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/img-stat') { const M = imgIndex(); let b = 0; for (const v of M.values()) b += v; return J(200, { ok: true, dir: IMG_DIR, count: M.size, bytes: b, run: IMGST }); }
  if (req.method === 'OPTIONS' || req.headers['x-rn-img'] !== '1' || req.method !== 'POST') return J(403, { ok: false, err: '수집기만 쓸 수 있음' });
  if (u.pathname === '/img-have') return readBody(req, 20 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let L = []; try { L = JSON.parse(b.toString('utf8')).names || []; } catch (x) { return J(400, { ok: false, err: 'bad json' }); } const M = imgIndex(); J(200, { ok: true, missing: L.filter((n) => { const k = imgName(n); return k && !M.has(k) && !M.has('readnow-photos/' + k); }) }); /* (1.4.2) 웹앱 ② 사진 내려받기(📁)가 만든 readnow-photos 폴더째 images에 넣어도 그 안의 것은 건너뜀 */ });
  if (u.pathname === '/img-put') { const k = imgName(u.searchParams.get('name')); if (!k) return J(400, { ok: false, err: '이름이 이상함' }); return readBody(req, 40 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); const f = path.join(IMG_DIR, ...k.split('/')); if (!f.startsWith(IMG_DIR + path.sep)) return J(400, { ok: false, err: 'bad path' });
      if (fs.existsSync(f)) { IMGST.skip++; return J(200, { ok: true, skip: true }); } try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', b); fs.renameSync(f + '.tmp', f); } catch (er) { return J(500, { ok: false, err: er.message }); }
      const M = imgIndex(); M.set(k, b.length); IMGST.put++; IMGST.bytes += b.length; IMGST.last = { name: k, at: kst() }; J(200, { ok: true, size: b.length }); }); }
  return J(404, { ok: false }); }
const isSelf = (host) => /^(rn\.local|localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(host || ''));

/* ── 프록시 ── */
const server = http.createServer((req, res) => {
  let u; try { u = new URL(req.url.startsWith('http') ? req.url : 'http://' + (req.headers.host || 'rn.local') + req.url); } catch (e) { res.writeHead(400); return res.end('bad url'); }
  if (isSelf(u.host) || !req.url.startsWith('http')) return api(req, res); // 상태 화면(직접 열거나 rn.local로)
  const host = u.hostname, port = u.port || 80;
  if (isTrack(host)) { TRK.n++; TRK.last = host; res.writeHead(204); return res.end(); }
  openUp(host, port, (e, s, g) => { if (e) { addBlocked(host, e.message); res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', 'X-ReadNow-Block': encodeURIComponent(e.message) }); return res.end('리드나우 로컬 도우미: ' + e.message); }
    const hdr = { ...req.headers }; delete hdr['proxy-connection']; delete hdr['proxy-authorization'];
    const up = http.request({ createConnection: () => s, host, port, method: req.method, path: u.pathname + u.search, headers: hdr }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', (er) => { try { res.writeHead(502); res.end(er.message); } catch (x) {} }); req.pipe(up); });
});
server.on('connect', (req, cs, head) => { const m = String(req.url).match(/^\[?([^\]]+?)\]?:(\d+)$/); if (!m) { cs.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; } const [, host, port] = m;
  if (isSelf(host)) { cs.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
  if (isTrack(host)) { TRK.n++; TRK.last = host; cs.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
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
