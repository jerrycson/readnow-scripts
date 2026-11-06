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
const fs=require('fs');const A=process.argv;const g=(k)=>{const j=A.indexOf('-'+k);return j<0?null:A[j+1]};const act=g('Act')||'find',mark=g('Mark')||'',place=g('Place')||'off';
const procs=fs.readdirSync('/proc').filter((p)=>/^\\d+$/.test(p)&&+p!==process.pid).filter((p)=>{try{const c=fs.readFileSync('/proc/'+p+'/cmdline','utf8');return c.includes(mark)&&c.includes(${JSON.stringify(D)})}catch(e){return false}});
const S=JSON.parse(fs.readFileSync(${JSON.stringify(WJ)},'utf8'));const vs={x:0,y:0,w:1920,h:1080};S.acts=(S.acts||[]).concat([act+':'+mark]);
if(!procs.length)delete S[mark];else if(!S[mark])S[mark]={r:{x:300,y:200,w:1280,h:900},tool:false,ic:false,front:0};
const w=S[mark];const n=(k)=>{const v=g(k);return v==null?null:+v};
if(w&&procs.length){if(act==='hide'){const W=Math.max(400,n('W')||0),H=Math.max(300,n('H')||0);w.r=place==='edge'?{x:1914,y:1074,w:W,h:H}:{x:vs.x-W-400,y:40,w:W,h:H};w.tool=true;w.ic=false}
else if(act==='show'){w.tool=false;let X=n('X'),Y=n('Y'),W=n('W'),H=n('H');if(!(W>=200&&H>=150)){W=1200;H=820;X=360;Y=130}w.r={x:X,y:Y,w:W,h:H};w.front++}
else if(act==='close'){procs.forEach((p)=>{try{process.kill(+p)}catch(e){}});delete S[mark]}}
let killed=0;if(act==='kill'){procs.forEach((p)=>{try{process.kill(+p,'SIGKILL');killed++}catch(e){}});delete S[mark];S.kills=(S.kills||0)+killed}
const tmp=${JSON.stringify(WJ)}+'.'+process.pid;fs.writeFileSync(tmp,JSON.stringify(S));fs.renameSync(tmp,${JSON.stringify(WJ)});const W2=act==='kill'?null:S[mark]; /* 한 번에 바꿔 끼움(읽는 쪽이 반쯤 쓴 파일을 보지 않게) */
process.stdout.write('잡음 줄\\n'+JSON.stringify({ok:true,act,vs,wa:vs,killed,n:W2?1:0,list:W2?[{h:1,r:W2.r,vis:true,ic:!!W2.ic,zm:false,tool:!!W2.tool}]:[]}));`);
  const real = chromium().executablePath();
  fs.writeFileSync(D + '/bin/chrome', `#!/bin/bash
printf '%s\\n' "$*" >> ${JSON.stringify(D + '/chrome.log')}
for a in "$@"; do case "$a" in --app=*) exec node -e "setInterval(()=>{},1e9)" -- "$@";; esac; done
if [ -f ${JSON.stringify(D + '/chrome-die')} ]; then echo "기존 브라우저 세션에서 여는 중입니다." >&2; exit $(cat ${JSON.stringify(D + '/chrome-die')}); fi
exec ${JSON.stringify(real)} --headless=new --no-sandbox --disable-background-networking --disable-component-update "$@"
`);
  fs.chmodSync(D + '/bin/powershell.exe', 0o755); fs.chmodSync(D + '/bin/chrome', 0o755);
  return { WJ, win: () => JSON.parse(fs.readFileSync(WJ, 'utf8')), setWin: (f) => { const S = JSON.parse(fs.readFileSync(WJ, 'utf8')); f(S); fs.writeFileSync(WJ + '.t', JSON.stringify(S)); fs.renameSync(WJ + '.t', WJ); }, clog: () => { try { return fs.readFileSync(D + '/chrome.log', 'utf8').trim().split('\n').filter(Boolean); } catch (e) { return []; } } }; }

async function startHelper(o) { o = o || {}; const D = o.dir || fs.mkdtempSync(path.join(os.tmpdir(), 'col2t_')); const T = tools(D); fs.mkdirSync(D + '/home', { recursive: true });
  if (o.cfg) fs.writeFileSync(D + '/home/col2.json', JSON.stringify(o.cfg));
  const env = { ...process.env, RN_COL2_TEST: '1', RN_COL2_PORT: String(o.port || PORT), RN_COL2_HOME: D + '/home', RN_COL2_CORE_DIR: PROD_REPO, RN_COL2_ALADIN: o.aladin || '', RN_COL2_CHROME: D + '/bin/chrome', RN_COL2_PS: D + '/bin/powershell.exe', ...(o.env || {}) };
  const pr = cp.spawn(process.execPath, [path.join(ROOT, 'helper', 'readnow-col2-helper.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; pr.stdout.on('data', (c) => (out += c)); pr.stderr.on('data', (c) => (out += c));
  const H = { port: o.port || PORT, D, T, pr, out: () => out };
  H.req = (m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: H.port, path: p, method: m, headers: { 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b, h: x.headers }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });
  H.api = (m, p, body, hd) => H.req(m, p, body, { 'X-RN-Col2': '1', ...(hd || {}) });
  H.stop = async () => { try { await H.api('POST', '/cfg', { on: false }); } catch (e) {} await wait(400); pr.kill('SIGTERM'); await wait(300); };
  for (let k = 0; k < 60; k++) { const r = await H.api('GET', '/status'); if (r.st === 200) break; await wait(200); }
  return H; }

/* 운영 수집기가 같은 화면에서 만들 prd_books 문서 — 운영 공용 파일로 해석 · BOOK_FIXED 칸 중 값이 있는 것(refreshOne0 '고정형: 처음 한 번 저장')
 * 운영 공용 파일은 운영 저장소에서 읽기만 */
async function prodBooks(htmlOf, ids, fields) { const br = await chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.setContent('<!doctype html><title>운영 해석</title>');
    for (const f of ['readnow-aladin-core.js', 'readnow-products-core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(PROD_REPO, f), 'utf8') });
    return await p.evaluate(({ L, F }) => L.map(([id, html]) => { const doc = new DOMParser().parseFromString(html, 'text/html'); const pg = window.ReadnowProducts.parseProductPage(doc, 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=' + id); const o = { aladinItemId: pg.aladinItemId, isbn13: pg.isbn13 }; for (const f of F) if (pg[f] != null) o[f] = pg[f]; return o; }), { L: ids.map((id) => [id, htmlOf(id)]), F: fields });
  } finally { await br.close(); } }

module.exports = { ok, done, wait, ROOT, PORT, PROD_REPO, chromium, fakeAladin, startHelper, prodBooks, bad: () => bad };
