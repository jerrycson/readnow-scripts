/* tOFF1 — 정범님 11/05 '수집을 Tampermonkey 탭에서 빼기' Q1 가(같은 크롬 안 보이지 않는 작업 창) · Q2 시범 HOME·JS-MAIN · 로그인 없는 바깥 사이트 읽기 따로 · 「수집 상태 보기」 · 창 자리·크기 저장
 *  ① PC 도우미(local/readnow-print.js + readnow-work.js · 가짜 powershell·가짜 크롬): 출처 막기 · 꺼 두면 창을 안 엶 · 켜면 작업 창을 엶(#rnWork · 화면 밖 자리) → 화면 밖·작업 표시줄 숨김
 *     · 신호 받기 · 보이기(저장 자리) · 옮긴 뒤 숨기기 = 자리 저장 · 웹앱 자리는 더 늦은 쪽 · 상태 창 자리 저장·열기·앞으로 · 그려 읽기(알라딘 거절) · 다시 열기 · 끄면 창을 닫음
 *  ② 수집기 역할(가짜 알라딘 탭 · 바탕 모듈의 rnWork·rnRole 그대로): 꺼 두면 예전 그대로 · 켜면 사람 탭이 하던 일을 마친 뒤 작업 창 탭에 넘김 · 새 사람 탭은 쉼 · 작업 창을 닫으면 사람 탭이 이어받음(되돌리기) · 다시 끄면 작업 창 탭이 우선하지 않음
 *  ③ 웹앱 🧭 관리도구 › 🪟 수집 작업 창: 상태 보임 · 켜기(묻기) · 시범 아닌 PC는 못 켬 · 📊 수집 상태 보기 명령 · 꺼진 PC 보이기 막음 · 자리·크기 저장
 * 실행: cd pw && RN_PORT=<포트> node tOFF1.js */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const find = (rel) => [path.join(__dirname, '..', rel), path.join(__dirname, '../..', rel), path.join('/home/user/wk-off1', rel), path.join('/home/user/readnow-scripts', rel)].find((p) => fs.existsSync(p));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: 8898, path: p, method: m, headers: { 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });
const W = { 'X-RN-Work': '1' };

async function partHelper() { console.log('① PC 도우미 — 작업 창 다루기'); const HELP = find('local/readnow-print.js'); const WORKF = find('local/readnow-work.js'); if (!HELP || !WORKF) { ok(false, '도우미 파일을 못 찾음'); return; }
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'toff1_')); fs.mkdirSync(D + '/bin'); fs.mkdirSync(D + '/work'); fs.copyFileSync(HELP, D + '/readnow-print.js'); fs.copyFileSync(WORKF, D + '/readnow-work.js');
  fs.writeFileSync(D + '/work/work.json', JSON.stringify({ tickSec: 2 })); const WJ = D + '/win.json'; fs.writeFileSync(WJ, JSON.stringify({ list: [] }));
  /* 가짜 powershell: -Act가 있으면 창 흉내(win.json) · 없으면(프린터 일) 빈 목록 */
  fs.writeFileSync(D + '/bin/powershell.exe', `#!/usr/bin/env node
const fs=require('fs');const A=process.argv;const i=A.indexOf('-Act');if(i<0){process.stdout.write('[]');process.exit(0)}
const act=A[i+1];const g=(k)=>{const j=A.indexOf('-'+k);return j<0?null:+A[j+1]};const place=(A[A.indexOf('-Place')+1]||'off');const S=JSON.parse(fs.readFileSync(${JSON.stringify(WJ)},'utf8'));const vs={x:0,y:0,w:1920,h:1080};
const mk=/^hf/.test(act)?'리드나우 수집 상태':'리드나우 작업 창';const L=S.list.filter((w)=>w.title.includes(mk));
if(L.length){const w=L[0];if(act==='hide'){const W=Math.max(400,g('W')||0),H=Math.max(300,g('H')||0);w.r=place==='edge'?{x:1914,y:1074,w:W,h:H}:{x:vs.x-W-400,y:40,w:W,h:H};w.tool=true;w.ic=false;}
else if(act==='show'||act==='hfront'){w.tool=false;let X=g('X'),Y=g('Y'),W=g('W'),H=g('H');if(!(W>=200&&H>=150)){W=1200;H=820;X=360;Y=130}w.r={x:X,y:Y,w:W,h:H};w.front=(w.front||0)+1}
else if(act==='close'){S.list=S.list.filter((x)=>!x.title.includes(mk))}}
fs.writeFileSync(${JSON.stringify(WJ)},JSON.stringify(S));const L2=S.list.filter((w)=>w.title.includes(mk));
process.stdout.write('잡음\\n'+JSON.stringify({ok:true,act,vs,wa:vs,n:L2.length,list:L2.map((w)=>({h:1,r:w.r,vis:true,ic:!!w.ic,zm:false,tool:!!w.tool}))}));`);
  /* 가짜 크롬: 받은 인자를 적고 · 작업 창/상태 창을 win.json에 · --dump-dom이면 HTML */
  fs.writeFileSync(D + '/bin/chrome', `#!/usr/bin/env node
const fs=require('fs');const A=process.argv.slice(2);fs.appendFileSync(${JSON.stringify(D + '/chrome.log')},JSON.stringify(A)+'\\n');
if(A.includes('--dump-dom')){process.stdout.write('<html><body><a href="https://x.test/1">책 하나</a></body></html>');process.exit(0)}
const S=JSON.parse(fs.readFileSync(${JSON.stringify(WJ)},'utf8'));
if(A.includes('--new-window')&&A.some((x)=>/#rnWork$/.test(x)))S.list.push({title:'🪟 리드나우 작업 창 · 주문조회 - Chrome',r:{x:300,y:200,w:1280,h:900},tool:false});
if(A.some((x)=>/^--app=http:\\/\\/127\\.0\\.0\\.1:8898\\/work$/.test(x)))S.list.push({title:'📊 리드나우 수집 상태',r:{x:0,y:0,w:440,h:660},tool:false});
fs.writeFileSync(${JSON.stringify(WJ)},JSON.stringify(S));`);
  fs.chmodSync(D + '/bin/powershell.exe', 0o755); fs.chmodSync(D + '/bin/chrome', 0o755);
  const env = { ...process.env, PATH: D + '/bin:' + process.env.PATH, RN_PRINT_NOUPDATE: '1', RN_WORK_HOME: D + '/work', RN_WORK_PS: D + '/bin/powershell.exe', RN_WORK_CHROME: D + '/bin/chrome' };
  const pr = cp.spawn(process.execPath, [D + '/readnow-print.js'], { cwd: D, env, stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; pr.stdout.on('data', (c) => (out += c)); pr.stderr.on('data', (c) => (out += c));
  const S = () => JSON.parse(fs.readFileSync(WJ, 'utf8')).list; const work = () => S().find((w) => w.title.includes('리드나우 작업 창')); const clog = () => { try { return fs.readFileSync(D + '/chrome.log', 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch (e) { return []; } };
  try { for (let k = 0; k < 40; k++) { const r = await req('GET', '/status', null, { 'X-RN-Print': '1' }); if (r.st === 200) break; await wait(250); }
    const s0 = await req('GET', '/status', null, { 'X-RN-Print': '1' }); ok(s0.j && s0.j.work === '0.1.0', `인쇄 도우미가 작업 창 모듈을 불러옴 (work ${s0.j && s0.j.work})`);
    ok((await req('GET', '/work/status')).st === 403, '머리(X-RN-Work) 없으면 거절');
    ok((await req('GET', '/work/status', null, { ...W, Origin: 'https://www.aladin.co.kr' })).st === 403, '알라딘 화면 출처는 거절');
    ok((await req('GET', '/work/status', null, { ...W, Origin: 'https://jerrycson.github.io' })).st === 403, '웹앱 출처도 거절(수집기·상태 창만)');
    const st0 = await req('GET', '/work/status', null, { ...W, Origin: 'chrome-extension://abc' }); ok(st0.st === 200 && st0.j.on === false, 'Tampermonkey(확장) 출처는 받음 · 처음엔 꺼짐');
    await req('POST', '/work/cfg', { pc: 'HOME', on: false }, W); await wait(3000); ok(clog().length === 0 && !work(), '꺼 두면 작업 창을 열지 않음');
    await req('POST', '/work/cfg', { pc: 'HOME', on: true, ext: true, place: 'off' }, W); for (let k = 0; k < 30 && !(work() && work().tool); k++) await wait(300);
    const L1 = clog().find((a) => a.includes('--new-window')); ok(!!L1 && L1.some((x) => x === 'https://www.aladin.co.kr/scm/worders.aspx#rnWork') && L1.some((x) => /^--window-position=-32000/.test(x)) && !L1.some((x) => /user-data-dir/.test(x)), '켜면 사람 크롬(같은 프로필)에 새 창으로 주문조회#rnWork (화면 밖 자리로)');
    const w1 = work(); ok(w1 && w1.tool === true && w1.r.x + w1.r.w <= 0, `작업 창을 화면 밖·작업 표시줄 밖으로 (${w1 && JSON.stringify(w1.r)})`);
    await req('POST', '/work/beat', { pc: 'HOME', role: 'lead', ver: '1.89.209', now: { job: '시험 일 하는 중', prog: { i: 3, n: 10 } }, lines: [{ t: Date.now(), l: 'info', m: '수집기', x: '시험 기록 줄' }] }, W);
    const st1 = (await req('GET', '/work/status', null, W)).j; ok(st1.beat && st1.beat.now.job === '시험 일 하는 중' && st1.beat.lines.length === 1 && st1.open, '작업 창 탭 신호(지금 하는 일·기록 끝)를 받음');
    const sh = await req('POST', '/work/show', { why: '시험' }, W); const w2 = work(); ok(sh.j && sh.j.ok && w2.tool === false && w2.r.x >= 0 && sh.j.state.shown, `보이기 — 저장 자리 없으면 가운데 기본 크기 (${JSON.stringify(w2.r)})`);
    const Sx = JSON.parse(fs.readFileSync(WJ, 'utf8')); Sx.list.find((w) => w.title.includes('리드나우 작업 창')).r = { x: 100, y: 50, w: 1000, h: 700 }; fs.writeFileSync(WJ, JSON.stringify(Sx));
    const hd = await req('POST', '/work/hide', {}, W); const w3 = work(); ok(hd.j.ok && hd.j.state.win && hd.j.state.win.x === 100 && hd.j.state.win.w === 1000 && w3.tool && w3.r.x < 0, '사람이 옮긴 뒤 숨기기 = 그 자리·크기 저장 + 다시 화면 밖');
    await req('POST', '/work/show', {}, W); ok(JSON.stringify(work().r) === JSON.stringify({ x: 100, y: 50, w: 1000, h: 700 }), '다시 보이기 = 저장한 자리·크기로');
    await req('POST', '/work/cfg', { on: true, win: { x: 5, y: 5, w: 900, h: 600, at: 1 } }, W); let sw = (await req('GET', '/work/status', null, W)).j.win; ok(sw.x === 100, '웹앱 자리가 PC에서 옮긴 것보다 옛것이면 쓰지 않음');
    await req('POST', '/work/cfg', { on: true, win: { x: 300, y: 60, w: 1100, h: 750, at: Date.now() + 5000 } }, W); sw = (await req('GET', '/work/status', null, W)).j.win; ok(sw.x === 300 && sw.w === 1100, '웹앱에서 더 늦게 고친 자리는 씀');
    ok((await req('POST', '/work/win', { win: { x: 1, y: 1, w: 50, h: 50 } }, W)).st === 400, '너무 작은 자리·크기는 거절');
    await req('POST', '/work/hrect', { x: 1500, y: 0, w: 440, h: 660 }, W, { Origin: 'http://127.0.0.1:8898' });
    const s3 = (await req('GET', '/work/status', null, W)).j; ok(s3.hwin && s3.hwin.x === 1500 && s3.hwin.h === 660, '수집 상태 창이 알린 자기 자리·크기를 저장');
    const sw1 = await req('POST', '/work/status', { why: '웹앱' }, W); await wait(1200); const La = clog().find((a) => a.some((x) => /^--app=/.test(x))); ok(sw1.j.ok && La && La.includes('--window-position=1500,0') && La.includes('--window-size=440,660') && La.some((x) => /chrome-workwin/.test(x)), '📊 수집 상태 창 열기 = 창 전용 프로필 · 저장한 자리·크기');
    const sw2 = await req('POST', '/work/status', {}, W); ok(sw2.j.ok && /앞으로/.test(sw2.j.msg) && clog().filter((a) => a.some((x) => /^--app=/.test(x))).length === 1, '이미 열려 있으면 새로 띄우지 않고 앞으로');
    ok((await req('POST', '/render?url=' + encodeURIComponent('https://www.aladin.co.kr/shop/x'), {}, { 'X-RN-Render': '1' })).st === 400, '그려 읽기 — 알라딘 주소는 거절');
    ok((await req('POST', '/render?url=' + encodeURIComponent('https://x.test/a'), {})).st === 403, '그려 읽기 — 머리 없으면 거절');
    const rd = await req('POST', '/render?url=' + encodeURIComponent('https://x.test/a') + '&wait=3000', {}, { 'X-RN-Render': '1' }); const Lr = clog().find((a) => a.includes('--dump-dom'));
    ok(rd.j && rd.j.ok && /x\.test\/1/.test(rd.j.html) && Lr && Lr.some((x) => /chrome-render/.test(x)) && Lr.includes('--headless=new') && !Lr.some((x) => /--profile-directory/.test(x)), '그려 읽기 = 따로 된 프로필(chrome-render · 로그인 안 함 · 화면 없음)');
    await req('POST', '/work/cfg', { on: true, ext: false }, W); ok((await req('POST', '/render?url=' + encodeURIComponent('https://x.test/a'), {}, { 'X-RN-Render': '1' })).st === 403, '바깥 사이트 읽기 따로를 끄면 그려 읽기 안 함'); await req('POST', '/work/cfg', { on: true, ext: true }, W);
    const pg = await req('GET', '/work'); ok(pg.st === 200 && /리드나우 수집 상태/.test(pg.b) && /작업 창 보이기/.test(pg.b), '주소창 /work = 수집 상태 창 화면');
    ok((await req('GET', '/work', null, { Origin: 'https://evil.test' })).st === 403, '상태 창 화면은 다른 출처에서 못 엶');
    const n0 = clog().filter((a) => a.includes('--new-window')).length; const ro = await req('POST', '/work/reopen', {}, W); await wait(1200); ok(ro.j.ok && clog().filter((a) => a.includes('--new-window')).length === n0 + 1, '↻ 다시 열기 = 닫고 새로 엶');
    await req('POST', '/work/cfg', { on: false }, W); for (let k = 0; k < 20 && work(); k++) await wait(300); ok(!work(), '끄면 작업 창을 닫음(사람 탭이 이어받음)');
    ok((await req('POST', '/work/show', {}, W)).j.ok === false, '꺼진 동안 보이기는 하지 않음');
    ok(/작업 창 모드 끔/.test(out) && /작업 창을 엶/.test(out), '도우미 기록 줄이 남음');
  } finally { pr.kill(); } }

async function partRole() { console.log('② 수집기 역할 — 작업 창 탭 우선 · 넘김 · 되돌리기'); const SRC = find('src/readnow-collector.src.js'); if (!SRC) return ok(false, '수집기 원본을 못 찾음'); const s = fs.readFileSync(SRC, 'utf8');
  const a = s.indexOf('(function rnWork() {'), b = s.indexOf('(function rnPcName() {'); if (a < 0 || b < a) return ok(false, 'rnWork·rnRole 자리를 못 찾음'); const CODE = s.slice(a, b);
  const STUB = `(function(){const P='gm:';window.__xhrs=[];window.__logs=[];window.GM_getValue=(k,d)=>{const v=localStorage.getItem(P+k);return v==null?d:JSON.parse(v)};window.GM_setValue=(k,v)=>localStorage.setItem(P+k,JSON.stringify(v));window.GM_deleteValue=(k)=>localStorage.removeItem(P+k);
  window.GM_addValueChangeListener=(k,f)=>{addEventListener('storage',(e)=>{if(e.key===P+k)f(k,null,e.newValue==null?null:JSON.parse(e.newValue),true)});return 1};window.GM_info={script:{version:'1.89.209'}};
  window.GM_xmlhttpRequest=(o)=>{window.__xhrs.push({url:o.url,data:o.data?JSON.parse(o.data):null,h:o.headers});setTimeout(()=>o.onload({status:200,responseText:'{"ok":true}'}),5)};
  window.__rnLog=(m,l,x)=>window.__logs.push(l+' '+x);window.__rnPcName={get:()=>'HOME'};window.__BUSY=false;window.__rnPrd={busy:()=>window.__BUSY,pause:()=>{}};})();`;
  const { chromium } = require('playwright'); const br = await chromium.launch(); const ctx = await br.newContext(); const errs = [];
  await ctx.route(/^https:\/\/www\.aladin\.co\.kr\//, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><title>주문조회</title></head><body>가짜 알라딘</body></html>' }));
  const open = async (hash) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto('https://www.aladin.co.kr/scm/worders.aspx' + (hash || '')); await p.addScriptTag({ content: STUB + '\n' + CODE }); return p; };
  const role = (p) => p.evaluate(() => window.__rnRole && window.__rnRole());
  try { const H1 = await open(); await wait(1500); ok((await role(H1)) === 'lead', '꺼 둔 채: 사람 탭이 수집기(지도자) — 예전과 같음');
    const Wt = await open('#rnWork'); await wait(1500); const wi = await Wt.evaluate(() => ({ h: location.hash, ss: sessionStorage.getItem('rn-w'), mark: window.__rnWork.mark, isWork: window.__rnWork.isWork(), title: document.title }));
    ok(wi.h === '' && wi.ss === '1' && wi.mark && !wi.isWork, '작업 창 탭은 주소 표시를 지우고 탭 안에 기억 · 꺼 둔 동안엔 보통 탭');
    ok((await role(Wt)) === 'follow' && (await role(H1)) === 'lead', '꺼 둔 채: 작업 창 탭이 사람 탭을 앞지르지 않음');
    await H1.evaluate(() => { window.__BUSY = true; }); await H1.evaluate(() => GM_setValue('rn-work-cfg', { on: true, ext: true, at: Date.now() }));
    await wait(12500); ok((await role(H1)) === 'lead' && (await H1.evaluate(() => window.__logs.some((x) => /마치면 수집을 작업 창에 넘깁니다/.test(x)))), '켬 + 사람 탭이 일하는 중 → 끊지 않고 기다림(기록 한 번)');
    ok(await Wt.evaluate(() => document.title.startsWith('🪟 리드나우 작업 창') && !!GM_getValue('rnu-work', null)), '작업 창 탭: 창 제목 표시(도우미가 찾음) · 5초 신호');
    await H1.evaluate(() => { window.__BUSY = false; }); for (let k = 0; k < 30 && (await role(Wt)) !== 'lead'; k++) await wait(500);
    ok((await role(Wt)) === 'lead' && (await role(H1)) === 'follow', '하던 일이 끝나면 사람 탭이 작업 창 탭에 수집을 넘김');
    ok(await H1.evaluate(() => window.__logs.some((x) => /수집을 이 PC의 작업 창에 넘겼습니다/.test(x))), '넘김 기록 줄');
    ok(await H1.evaluate(() => (GM_getValue('rnu-lead', {}) || {}).page === 'rnWork' && window.__rnPageName('rnWork') === '🪟 작업 창'), '지도자 신호에 작업 창으로 적힘(웹앱·기록에 「🪟 작업 창」)');
    await wait(4500); ok(await Wt.evaluate(() => window.__xhrs.some((x) => /127\.0\.0\.1:8898\/work\/beat$/.test(x.url) && x.h['X-RN-Work'] === '1' && x.data && x.data.role && x.data.pc === 'HOME' && Array.isArray(x.data.lines))), '작업 창 탭이 PC 도우미에 신호(역할·기록 끝 · 25초에 한 번)');
    await Wt.evaluate(() => window.__rnWorkShow('시험 — 사람 손')); ok(await Wt.evaluate(() => window.__xhrs.some((x) => /\/work\/show$/.test(x.url))), '사람 손이 필요할 때 작업 창을 앞으로 꺼내 달라고 도우미에 맡김');
    const H2 = await open(); await wait(2500); ok((await role(H2)) === 'follow', '작업 창이 일하는 동안 새로 연 사람 탭은 쉼(화면 기능만)');
    await Wt.close(); let lead = null; for (let k = 0; k < 30 && !lead; k++) { await wait(500); const r1 = await role(H1), r2 = await role(H2); lead = r1 === 'lead' ? 'H1' : r2 === 'lead' ? 'H2' : null; }
    ok(!!lead, `작업 창을 닫으면 사람 탭(${lead})이 바로 이어받음 — 되돌리기`);
    await H1.evaluate(() => GM_setValue('rn-work-cfg', { on: false, at: Date.now() })); const W2 = await open('#rnWork'); await wait(12500);
    ok((await role(W2)) === 'follow' && [await role(H1), await role(H2)].includes('lead'), '다시 끄면 작업 창 탭이 와도 사람 탭이 그대로 수집');
    ok(!errs.length, '페이지 오류 없음 ' + errs.slice(0, 3).join(' | '));
  } finally { await br.close(); } }

(async () => { await partHelper(); await partRole();
  console.log('③ 웹앱 🧭 관리도구 › 🪟 수집 작업 창');
  await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
    const r = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); const now = Date.now(); localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; const O = {};
      await db.collection('crm_system').doc('work_win').set({ state: { HOME: { atMs: now - 30e3, at: new Date(now - 30e3).toISOString(), helper: '0.1.0', on: true, open: true, shown: false, lead: 'work', beatAt: new Date(now - 20e3).toISOString(), win: { x: 10, y: 20, w: 900, h: 700, at: 1 }, msg: '작업 창 숨김 · 일하는 중' }, 'MJ-MAIN': { atMs: now - 60e3, helper: null, err: '도우미에 닿지 못함' } } });
      S.sec.mg_work = true; openMgr(); await sl(900); mgrRedraw(); await sl(400); const sec = () => document.querySelector('[data-sec="mg_work"]'); const t = sec() ? sec().innerText : ''; O.t = t;
      O.has = /HOME/.test(t) && /JS-MAIN/.test(t) && /시범 PC/.test(t) && /🪟 작업 창/.test(t) && /PC 도우미 없음/.test(t) && /수집 상태 보기/.test(t);
      O.mjDis = !!(sec().querySelector('[data-wwon="MJ-MAIN"]') || {}).disabled; O.homeDis = !!(sec().querySelector('[data-wwon="HOME"]') || {}).disabled;
      const nc = window.confirm; window.confirm = () => true; const cb = sec().querySelector('[data-wwon="HOME"]'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); await sl(400); window.confirm = nc;
      const g = async () => ((await db.collection('crm_system').doc('work_win').get()).data() || {}); let d = await g(); O.on = !!(((d.cfg || {}).pcs || {}).HOME || {}).on; mgrRedraw(); await sl(200);
      sec().querySelector('[data-wwcmd="HOME|status"]').click(); await sl(400); d = await g(); O.cmd = ((d.cmds || {}).HOME || {}).cmd;
      sec().querySelector('[data-wwcmd="JS-MAIN|show"]').click(); await sl(300); d = await g(); O.noJs = !((d.cmds || {})['JS-MAIN']);
      const det = sec().querySelector('[data-wwsave="HOME"]').closest('details'); det.open = true; const set = (k, q, v) => { det.querySelector(`[data-wwr="HOME|${k}|${q}"]`).value = v; }; set('win', 'x', 50); set('win', 'y', 60); set('win', 'w', 1000); set('win', 'h', 720);
      det.querySelector('[data-wwsave="HOME"]').click(); await sl(400); d = await g(); const w = (((d.cfg || {}).pcs || {}).HOME || {}).win || {}; O.win = w.x === 50 && w.w === 1000 && w.h === 720 && w.at > now;
      O.feat = !!(window.FEAT || []).length || true; return O; });
    ok(r.has, '칸에 PC별 상태(시범 PC·🪟 작업 창이 수집·도우미 없음)와 📊 수집 상태 보기 단추');
    ok(r.mjDis && !r.homeDis, '시범 아닌 PC(MJ-MAIN)는 켤 수 없고 시범 PC(HOME)는 켤 수 있음');
    ok(r.on, '켜기(한 번 묻고) → cfg.pcs.HOME.on');
    ok(r.cmd === 'status', '📊 수집 상태 보기 → 그 PC에 명령(status)');
    ok(r.noJs, '꺼진 PC는 작업 창 보이기 명령을 보내지 않음');
    ok(r.win, '자리·크기 저장 → cfg.pcs.HOME.win(고친 때 함께)');
  });
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tOFF1 모두 통과'); process.exit(bad ? 1 : 0); })();
