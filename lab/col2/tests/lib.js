/* 번외 수집 일꾼(col2) 시험 도구 — Windows 실기기 없이
 * · 가짜 알라딘(이 PC 안 작은 서버 · 빈 포트) — 공개 상품 화면·429·19금 넘김 · 받은 요청(쿠키 실림 여부·시각)을 적음
 * · 가짜 PowerShell(창 다루기 흉내 — 프로필 폴더 이름이 명령 줄에 든 프로세스를 /proc에서 찾아 '창'으로 봄)
 * · 크롬 = Playwright 크로미움(진짜 크롬 · 화면 없이) — 감싸개가 받은 인자를 적고, 상태 창(--app)은 잠자는 가짜 프로세스로
 * · 도우미는 시험 포트(기본 8775 · COL2_TEST_PORT)로 · 자료 폴더는 임시 폴더 · 운영 공용 파일은 운영 저장소에서 읽기만(RN_COL2_CORE_DIR) */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const ROOT = path.join(__dirname, '..');
const PORT = +process.env.COL2_TEST_PORT || 8775;
const PROD_REPO = process.env.COL2_PROD_REPO || '/home/user/readnow-scripts';
const PW = process.env.COL2_PW || '/opt/node-tools/node_modules/playwright';
/* (11/11 col2rep4) 시험 뒷정리 — 시험이 끝나거나·실패·시간 넘음·중단(SIGINT/SIGTERM/SIGHUP)·잡히지 않은 오류일 때 이 시험이 띄운 크롬·도우미·가짜 창을 모두 끄고 /tmp/col2t_* 폴더를 지움
 * · 뿌리 = ① 이 시험이 직접 띄운 프로세스(child_process.spawn을 감싸 pid·시작 시각을 /tmp/col2t_pids_<표>에 적음 — Playwright 크롬도 이 길로 뜸)
 *         ② 이 시험이 만든 임시 폴더(col2t_·col2raw_·col2self_ — fs.mkdtempSync를 감싸 기록 · 폴더 안 .col2t_run에 표를 적음) 이름이 명령 줄에 든 프로세스(도우미가 띄운 크롬·작은 앱 창)
 *         ③ (살아 있을 때) 이 시험 프로세스의 자손 — 뿌리의 자손(크롬 렌더러 등)도 모두 끔 · detached·다른 프로세스 그룹이어도(부모가 죽어 1번에 붙어도) ①②로 찾음
 * · 부하가 큰 기계에서도 빠르게 — /proc/<pid>/stat(커널 값)으로 부모·자손을 잇고, 명령 줄은 한 번씩만 읽음(환경 변수는 읽지 않음 · 남의 메모리를 끌어오면 수 분 걸림)
 * · 표(COL2T_RUN)가 다른 옛 크롬(다른 시험·다른 일꾼 것)은 건드리지 않음 · run-all.sh는 시험마다 새 표를 주고 끝난 뒤 'node tests/lib.js --sweep <표>'로 한 번 더 쓸어 냄(SIGKILL로 죽은 시험 대비) */
const RUN = process.env.COL2T_RUN || (process.env.COL2T_RUN = 'r' + process.pid + '_' + Date.now().toString(36));
const TMP = os.tmpdir(), PIDF = (run) => path.join(TMP, 'col2t_pids_' + String(run).replace(/[^\w.-]/g, '_'));
const DIRS = new Set(), TMPRE = /col2(t|raw|self)_$/;
const statOf = (pid) => { try { const a = fs.readFileSync('/proc/' + pid + '/stat', 'utf8').split(') ')[1].split(' '); return { st: a[0], pp: +a[1], t0: a[19] }; } catch (e) { return null; } };
const realMkdtemp = fs.mkdtempSync;
fs.mkdtempSync = function (pre, ...r) { const d = realMkdtemp.call(fs, pre, ...r); if (TMPRE.test(String(pre))) { DIRS.add(d); try { fs.writeFileSync(path.join(d, '.col2t_run'), RUN); } catch (e) {} } return d; };
const realSpawn = cp.spawn;
cp.spawn = function (...a) { const p = realSpawn.apply(cp, a); try { const s = p.pid && statOf(p.pid); if (s) fs.appendFileSync(PIDF(RUN), p.pid + ':' + s.t0 + '\n'); } catch (e) {} return p; };
const nap = (ms) => { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (e) {} };
const alive = (pid) => { const s = statOf(pid); return !!s && s.st !== 'Z'; };
/* 표 run에 딸린 살아 있는 프로세스 — 나와 내 조상은 뺌 · o.mine = 내 자손도 넣음 */
function ownedPids(run, dirs, o) { o = o || {}; if (!fs.existsSync('/proc')) return []; const T = {}, kids = {};
  for (const p of fs.readdirSync('/proc')) { if (!/^\d+$/.test(p)) continue; const s = statOf(p); if (!s) continue; T[p] = s; (kids[s.pp] = kids[s.pp] || []).push(+p); }
  const skip = new Set(); for (let p = process.pid, i = 0; p > 1 && i < 60; i++) { skip.add(p); p = T[p] ? T[p].pp : 0; }
  const roots = new Set(); let L = []; try { L = fs.readFileSync(PIDF(run), 'utf8').split('\n'); } catch (e) {}
  for (const x of L) { const [p, t0] = x.split(':'); if (p && T[p] && T[p].t0 === t0) roots.add(+p); }
  if (dirs.length) for (const p of Object.keys(T)) { if (skip.has(+p) || roots.has(+p)) continue; try { const c = fs.readFileSync('/proc/' + p + '/cmdline', 'utf8'); if (dirs.some((d) => c.includes(d + '/') || c.includes(d + '\0'))) roots.add(+p); } catch (e) {} }
  if (o.mine) for (const c of kids[process.pid] || []) roots.add(c);
  const out = new Set(), q = [...roots]; while (q.length) { const x = q.shift(); if (out.has(x) || skip.has(x)) continue; out.add(x); for (const c of kids[x] || []) q.push(c); }
  return [...out].filter((p) => T[p].st !== 'Z'); }
/* 끄고(바로 SIGKILL — 시험 크롬이라 지킬 것 없음) 다 꺼질 때까지 최대 3초 기다린 뒤 폴더·pid 장부 지움 */
function sweep(run, dirs, o) { o = o || {}; let n = 0; for (let k = 0; k < 4; k++) { const L = ownedPids(run, dirs, o); if (!L.length) break; for (const p of L) { try { process.kill(p, 'SIGKILL'); n++; } catch (e) {} } for (let i = 0; i < 30 && L.some(alive); i++) nap(100); }
  if (!o.keepDirs) { for (const d of dirs) { for (let i = 0; i < 3; i++) { try { fs.rmSync(d, { recursive: true, force: true }); break; } catch (e) { nap(200); } } } try { fs.rmSync(PIDF(run), { force: true }); } catch (e) {} }
  return n; }
/* run-all용 — 표가 같은 임시 폴더(.col2t_run)를 /tmp에서 찾음 */
const dirsOfRun = (run) => { let L = []; try { L = fs.readdirSync(TMP).filter((f) => /^col2(t|raw|self)_/.test(f) && !f.startsWith('col2t_pids_')); } catch (e) {} return L.map((f) => path.join(TMP, f)).filter((d) => { try { return fs.readFileSync(path.join(d, '.col2t_run'), 'utf8') === run; } catch (e) { return false; } }); };
let swept = false; const cleanup = () => { if (swept) return; swept = true; try { sweep(RUN, [...DIRS], { mine: true }); } catch (e) {} };
if (require.main !== module) {
  process.on('exit', cleanup);
  for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) process.on(sig, () => { console.log(`✗ 시험 중단(${sig}) — 띄운 크롬을 끄고 임시 폴더를 지움`); cleanup(); process.exit(128 + n); });
  process.on('uncaughtException', (e) => { console.log('✗ 시험 오류(잡히지 않음)', e && e.stack || e); cleanup(); process.exit(1); });
  process.on('unhandledRejection', (e) => { console.log('✗ 시험 오류(잡히지 않은 약속)', e && e.stack || e); cleanup(); process.exit(1); });
}
let bad = 0, good = 0; const ok = (c, m, x) => { if (c) { good++; console.log('  ✓ ' + m + (x != null ? ' — ' + x : '')); } else { bad++; console.log('  ✗ ' + m + (x != null ? ' — ' + x : '')); } return !!c; };
const done = (name) => { console.log(bad ? `✗ ${name}: ${bad}개 실패 (${good}개 통과)` : `✓ ${name} 모두 통과 (${good}개)`); process.exit(bad ? 1 : 0); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chromium = () => require(PW).chromium;

function fakeAladin(pages) { const reqs = []; const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); reqs.push({ path: u.pathname + u.search, cookie: q.headers.cookie || null, t: Date.now(), ua: q.headers['user-agent'] || '' });
    if (u.pathname === '/') { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'rnTestSid=abc; Path=/' }); return s.end('<!doctype html><title>알라딘 첫 화면</title><body>가짜 알라딘 첫 화면</body>'); }
    if (u.pathname === '/shop/wproduct.aspx') { const id = u.searchParams.get('ItemId'); if (id === '999429') { s.writeHead(429); return s.end('too many'); } if (id === '191919') { s.writeHead(302, { Location: '/login/wlogin.aspx?returnurl=x' }); return s.end(); }
      const h = pages(id); if (!h) { s.writeHead(404); return s.end('없음'); } s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return s.end(h); }
    if (u.pathname.startsWith('/login/')) { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return s.end('<title>로그인</title><input type="password">'); }
    s.writeHead(404); s.end(); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, reqs, base: `http://127.0.0.1:${srv.address().port}` }))); }

function tools(D) { fs.mkdirSync(D + '/bin', { recursive: true }); const WJ = D + '/win.json'; fs.writeFileSync(WJ, JSON.stringify({}));
  fs.writeFileSync(D + '/bin/powershell.exe', `#!/usr/bin/env node
const fs=require('fs');const A=process.argv;if(fs.existsSync(${JSON.stringify(D)}+'/ps-slow'))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,+fs.readFileSync(${JSON.stringify(D)}+'/ps-slow','utf8')||3000);const g=(k)=>{const j=A.indexOf('-'+k);return j<0?null:A[j+1]};const act=g('Act')||'find',mark=g('Mark')||'',place=g('Place')||'off';
const procs=fs.readdirSync('/proc').filter((p)=>/^\\d+$/.test(p)&&+p!==process.pid).filter((p)=>{try{const c=fs.readFileSync('/proc/'+p+'/cmdline','utf8');return c.includes(mark)&&c.includes(${JSON.stringify(D)})}catch(e){return false}});
const S=JSON.parse(fs.readFileSync(${JSON.stringify(WJ)},'utf8'));const vs={x:0,y:0,w:1920,h:1080};S.acts=(S.acts||[]).concat([act+':'+mark]);
if(!procs.length)delete S[mark];else if(!S[mark])S[mark]={r:{x:300,y:200,w:1280,h:900},tool:false,ic:false,front:0};
const w=S[mark];const n=(k)=>{const v=g(k);return v==null?null:+v};
if(w&&procs.length){if(act==='hide'){const W=Math.max(400,n('W')||0),H=Math.max(300,n('H')||0);w.r=place==='edge'?{x:1914,y:1074,w:W,h:H}:{x:vs.x-W-400,y:40,w:W,h:H};w.tool=true;w.ic=false}
else if(act==='show'){w.tool=false;let X=n('X'),Y=n('Y'),W=n('W'),H=n('H');if(!(W>=60&&H>=40)){W=1200;H=820;X=360;Y=130}w.r={x:X,y:Y,w:W,h:H};w.top=g('Top')==='1';w.front++}
else if(act==='front'){w.front++}
else if(act==='close'){procs.forEach((p)=>{try{process.kill(+p)}catch(e){}});delete S[mark]}}
let killed=0;if(act==='kill'){procs.forEach((p)=>{try{process.kill(+p,'SIGKILL');killed++}catch(e){}});delete S[mark];S.kills=(S.kills||0)+killed}
const tmp=${JSON.stringify(WJ)}+'.'+process.pid;fs.writeFileSync(tmp,JSON.stringify(S));fs.renameSync(tmp,${JSON.stringify(WJ)});const W2=act==='kill'?null:S[mark]; /* 한 번에 바꿔 끼움(읽는 쪽이 반쯤 쓴 파일을 보지 않게) */
process.stdout.write('잡음 줄\\n'+JSON.stringify({ok:true,act,vs,wa:vs,killed,n:W2?1:0,list:W2?[{h:1,r:W2.r,vis:true,ic:!!W2.ic,zm:false,tool:!!W2.tool}]:[]}));`);
  const real = chromium().executablePath();
  fs.writeFileSync(D + '/bin/chrome', `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(D + '/chrome.log')}
for a in "$@"; do case "$a" in --app=*) exec node ${JSON.stringify(D + '/bin/fakeapp.js')} "$@";; esac; done
if [ -f ${JSON.stringify(D + '/chrome-die')} ]; then echo "기존 브라우저 세션에서 여는 중입니다." >&2; exit $(cat ${JSON.stringify(D + '/chrome-die')}); fi
exec ${JSON.stringify(real)} --headless=new --no-sandbox --disable-background-networking --disable-component-update "$@"
`);
  /* (11/10) 작은 앱 창 흉내 — /log 창은 진짜 크롬처럼 화면을 불러 3초마다(시험은 0.3초) 살아 있다는 소식(beat: 보임·자리 — 가짜 창 상태 win.json에서) · app-die면 그 코드로 곧바로 끝남 · app-silent면 소식 없이 잠만 잠 */
  fs.writeFileSync(D + '/bin/fakeapp.js', `const fs=require('fs'),http=require('http');const A=process.argv.slice(2);const g=(k)=>{const a=A.find((x)=>x.startsWith(k+'='));return a?a.slice(k.length+1):null};
const D=${JSON.stringify(D)};if(fs.existsSync(D+'/app-die')){process.stderr.write('기존 브라우저 세션에서 여는 중입니다.');process.exit(+fs.readFileSync(D+'/app-die','utf8')||1)}
const url=g('--app')||'',mark=(g('--user-data-dir')||'').split('/').pop();const sz=(g('--window-size')||'380,560').split(',').map(Number),ps=(g('--window-position')||'1500,0').split(',').map(Number);
const id='fk'+process.pid;let n=0;const beat=()=>{if(fs.existsSync(D+'/app-silent'))return;let w=null;try{w=JSON.parse(fs.readFileSync(D+'/win.json','utf8'))[mark]||null}catch(e){}const r=w&&w.r?w.r:{x:ps[0],y:ps[1],w:sz[0],h:sz[1]};const u=new URL(url);
const q=http.request({host:u.hostname,port:u.port,path:'/win/log',method:'POST',headers:{'X-RN-Col2':'1','Content-Type':'application/json'}},(x)=>x.resume());q.on('error',()=>{});q.end(JSON.stringify({act:'beat',id,vis:w&&w.ic?'hidden':'visible',x:r.x,y:r.y,w:r.w,h:r.h}));n++};
if(/\\/log$/.test(url)){beat();setInterval(beat,300)}else setInterval(()=>{},1e9);`);
  fs.chmodSync(D + '/bin/powershell.exe', 0o755); fs.chmodSync(D + '/bin/chrome', 0o755);
  return { WJ, win: () => JSON.parse(fs.readFileSync(WJ, 'utf8')), setWin: (f) => { const S = JSON.parse(fs.readFileSync(WJ, 'utf8')); f(S); fs.writeFileSync(WJ + '.t', JSON.stringify(S)); fs.renameSync(WJ + '.t', WJ); }, clog: () => { try { return fs.readFileSync(D + '/chrome.log', 'utf8').trim().split('\n').filter(Boolean); } catch (e) { return []; } } }; }

async function startHelper(o) { o = o || {}; const D = o.dir || fs.mkdtempSync(path.join(os.tmpdir(), 'col2t_')); const T = tools(D); fs.mkdirSync(D + '/home', { recursive: true });
  if (o.cfg) fs.writeFileSync(D + '/home/col2.json', JSON.stringify(o.cfg));
  const env = { ...process.env, RN_COL2_TEST: '1', RN_COL2_PORT: String(o.port || PORT), RN_COL2_HOME: D + '/home', RN_COL2_CORE_DIR: PROD_REPO, RN_COL2_ALADIN: o.aladin || '', RN_COL2_CHROME: D + '/bin/chrome', RN_COL2_PS: D + '/bin/powershell.exe', ...(o.env || {}) };
  const pr = cp.spawn(process.execPath, [path.join(ROOT, 'helper', 'readnow-col2-helper.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; pr.stdout.on('data', (c) => (out += c)); pr.stderr.on('data', (c) => (out += c));
  const H = { port: o.port || PORT, D, T, pr, out: () => out };
  H.req = (m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: H.port, path: p, method: m, headers: { 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b, h: x.headers }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });
  H.api = (m, p, body, hd) => H.req(m, p, body, { 'X-RN-Col2': '1', ...(hd || {}) });
  H.stop = async () => { try { await H.api('POST', '/cfg', { on: false }); } catch (e) {} await wait(400); pr.kill('SIGTERM'); await wait(300); try { sweep('-', [D], { keepDirs: true }); } catch (e) {} }; /* 도우미가 띄운 크롬(그 폴더 프로필)도 끔 · 폴더는 시험이 끝날 때 지움 */
  DIRS.add(D);
  for (let k = 0; k < 60; k++) { const r = await H.api('GET', '/status'); if (r.st === 200) break; await wait(200); }
  return H; }

/* 운영 수집기가 같은 화면에서 만들 prd_books 문서 — 운영 공용 파일로 해석 · BOOK_FIXED 칸 중 값이 있는 것(refreshOne0 '고정형: 처음 한 번 저장')
 * 운영 공용 파일은 운영 저장소에서 읽기만 */
async function prodBooks(htmlOf, ids, fields) { const br = await chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.setContent('<!doctype html><title>운영 해석</title>');
    for (const f of ['readnow-aladin-core.js', 'readnow-products-core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(PROD_REPO, f), 'utf8') });
    return await p.evaluate(({ L, F }) => L.map(([id, html]) => { const doc = new DOMParser().parseFromString(html, 'text/html'); const pg = window.ReadnowProducts.parseProductPage(doc, 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=' + id); const o = { aladinItemId: pg.aladinItemId, isbn13: pg.isbn13 }; for (const f of F) if (pg[f] != null) o[f] = pg[f]; return o; }), { L: ids.map((id) => [id, htmlOf(id)]), F: fields });
  } finally { await br.close(); } }

module.exports = { ok, done, wait, ROOT, PORT, PROD_REPO, chromium, fakeAladin, startHelper, prodBooks, bad: () => bad, RUN, ownedPids, sweep, track: (d) => DIRS.add(d) };

/* node tests/lib.js --sweep <표> — run-all.sh가 시험 하나 끝날 때마다 부름(그 시험이 SIGKILL로 죽어 스스로 못 치웠어도 그 표의 크롬·폴더만 치움) */
if (require.main === module && process.argv[2] === '--sweep') { const run = process.argv[3]; if (!run) { console.log('표가 없음'); process.exit(2); }
  const dirs = dirsOfRun(run); const n = sweep(run, dirs); if (n || dirs.length) console.log(`  · 뒷정리 — 남은 프로세스 ${n}개 끔 · 임시 폴더 ${dirs.length}개 지움`); }
