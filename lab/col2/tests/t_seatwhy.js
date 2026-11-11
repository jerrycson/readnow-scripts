/* t_seatwhy — 🪑 번외 알라딘 자리를 못 받았을 때 '무엇이 자리를 쥐고 있는지·지금 할 일'을 보여 줌 (11/11 col2rep1 · 정범님 15:00 HOME 화면
 *   「✗ 10분 안에 번외 알라딘 자리를 받지 못해 확인하지 않았고 저장하지 않았습니다 — 🏠가 켜져 있는지 보고 다시」 — 막연한 안내 대신)
 *  ① 11/11 14시 실제 자리 문서 꼴(JS-MAIN·MJ-MAIN 상시 살아 있음 · 클라우드 자리 · HOME 운영 신호 3시간 전 · HOME~col2 옛 자리 in:true 3시간 전 · 휴대폰 0)
 *     → 이 PC 운영 수집기가 꺼져 있어도 웹앱 자리 문서로 곧바로 자리 받음 → [확인하고 저장]이 그 자리에서 실제 로그인 확인 → 저장 (예전 0.1.21은 다리만 기다려 10분 뒤 실패)
 *  ② 꽉 참(상시 2 + 휴대폰 2) → 기다리다 시간 넘음 → 글에 '자리를 쥔 기기(이름·마지막 신호 시각)'·'지금 할 일' · 🏠 글귀 없음
 *  ③ 웹앱이 옛 판(자리 답을 안 보냄) → '웹앱이 옛 판일 수 있음 — 새로고침'
 *  ④ 웹앱도 다리도 없음 → '웹앱을 열어 두고 다시'
 *  ⑤ 옆 창 🪑 줄 아래 '→ 지금 할 일' · 화면 사진
 *  (11/11 seatfix1 · 정범님 16:48 HOME — 웹앱은 jerrycson.github.io 주소) ①은 github.io 주소 웹앱(요청 머리 Origin)으로 자리 받기·확인 저장 · ③은 readnow.kr 주소
 *  ⑥ 우리 두 주소의 미리 묻기(OPTIONS) 허락 · 다른 주소는 막고 '막은 부름'으로 남김 ⑦ 구글 로그인 전 웹앱(/web/hello) → '로그인 전' 안내 ⑧ 아무도 없음 → 웹앱 주소·판·마지막 소식 · 할 일에 두 주소
 * 실행: node tests/t_seatwhy.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const ID = 'jerry' + Math.random().toString(36).slice(2, 6), PW = 'Pw!' + Math.random().toString(36).slice(2, 12);
const SHOT = process.env.COL2_SHOT_DIR || '';
function fakeScm() { const S = { pw: PW, sess: new Set(), log: [] }; const OUT = '<a href="/scm/wC2Cuser_logout.aspx">로그아웃</a>';
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/asid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, body, x) => { s.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/login/wlogin.aspx' && q.method === 'POST') { const f = new URLSearchParams(b); S.log.push({ login: true, okPw: f.get('pw') === S.pw }); if (f.get('pw') !== S.pw) return H(200, '<title>로그인</title>틀림'); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, '', { 'Set-Cookie': `asid=${id}; Path=/; HttpOnly`, Location: '/scm/wmain.aspx' }); }
      if (u.pathname === '/login/wlogin.aspx') return H(200, `<!doctype html><meta charset="utf-8"><title>로그인</title><form method="post" action="/login/wlogin.aspx"><input name="id"><input type="password" name="pw"><button>로그인</button></form>`);
      if (u.pathname.startsWith('/scm/')) { if (!auth) return H(302, '', { Location: '/login/wlogin.aspx?returnurl=' + encodeURIComponent(u.pathname) }); return H(200, `<!doctype html><meta charset="utf-8"><title>샵매니저</title>${OUT}<h1>샵매니저</h1>`); }
      return H(200, '<title>알라딘</title>'); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
/* 운영 웹앱 글자 그대로 — c2SeatPatchOk·c2AlSeatGive만 떼어 가짜 Firestore(문서 하나)로 돌림 */
function webApp(port) { const APP = fs.readFileSync(path.join(L.PROD_REPO, 'src', 'app.html'), 'utf8'); const a = APP.indexOf('function c2SeatPatchOk('); const b = APP.indexOf('async function c2RelayTick()'); if (a < 0 || b < 0) throw new Error('웹앱에서 c2AlSeatGive를 못 찾음');
  const DOC = { dev: {}, wait: {}, cfg: {}, tries: [{ at: 1, who: 'X', net: '1.2' }] }; const W = { writes: [], sent: [] };
  const db = { collection: (c) => ({ doc: (id) => ({ c, id }) }), runTransaction: async (fn) => { for (let k = 0; k < 3; k++) { const snap = JSON.parse(JSON.stringify(DOC)); const tx = { get: async () => ({ exists: true, data: () => JSON.parse(JSON.stringify(snap)) }), set: (ref, P, o) => { W.writes.push({ P: JSON.parse(JSON.stringify(P)), merge: !!(o && o.merge) }); const mg = (t, x) => { for (const [k2, v] of Object.entries(x)) { if (v === null) delete t[k2]; else if (v && typeof v === 'object' && !Array.isArray(v)) { t[k2] = t[k2] && typeof t[k2] === 'object' ? t[k2] : {}; mg(t[k2], v); } else t[k2] = v; } }; mg(DOC, P); } }; return await fn(tx); } } };
  const f = (p, body) => new Promise((res) => { W.sent.push({ p, body: JSON.parse(JSON.stringify(body || null)) }); const r = http.request({ host: '127.0.0.1', port, path: p, method: body ? 'POST' : 'GET', headers: { 'X-RN-Col2': '1', 'Content-Type': 'application/json', ...(W.org ? { Origin: W.org } : {}) } }, (x) => { let t = ''; x.on('data', (c) => (t += c)); x.on('end', () => { try { res(JSON.parse(t)); } catch (e) { res(null); } }); }); r.on('error', () => res(null)); r.end(body ? JSON.stringify(body) : undefined); });
  const sb = { S: {}, db, IS_MOBILE_DEV: false, c2IsLogger: () => false, errKo: (e) => String((e && e.message) || e), c2By: () => '시험 웹앱', Date, JSON, Object, Math, String, Error }; vm.createContext(sb); vm.runInContext(APP.slice(a, b), sb);
  const tick = async () => { const pd = await f('/relay/pending?by=t' + (W.ver ? '&v=' + W.ver + '&u=1' : '')); await sb.c2AlSeatGive(pd, f); return pd; };
  return { DOC, W, tick, sb }; }


(async () => {
  const A = await fakeScm();
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200 };
  const H = await L.startHelper({ dir: D, port: L.PORT + 40 + Math.floor(Math.random() * 60), /* 다른 일꾼 시험과 포트가 겹치지 않게 */ cfg: { on: true, y24: false, al: true, alOwn: true, auto: false, headless: true, pc: 'HOME', pcSrc: 'pc', alcfg, relogin: { gapMin: 0, perHour: 20, perDay: 50, vGapSec: 0, vPerHour: 50, vMaxSec: 40 }, watch: { tickSec: 60, handoffMs: 200 } },
    env: { RN_COL2_ALSCM: A.base, RN_COL2_AL_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO, RN_COL2_DPAPI: D + '/bin/dpapi', RN_COL2_CQ_SCALE: '0.1', RN_COL2_WS_SCALE: '0.03' } });
  const OG = { Origin: `http://127.0.0.1:${H.port}` }; const save = (b) => H.api('POST', '/cred/save', b, OG);
  const st = async () => (await H.api('GET', '/status')).j; const datA = path.join(D, 'home', 'cred', 'al.dat'); const chk = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).chk; } catch (e) { return null; } };
  const WA = webApp(H.port); WA.W.org = 'https://jerrycson.github.io'; WA.W.ver = '1.78.482'; let mode = 'new'; /* new = 자리 확인 있는 웹앱 · old = 대기 일만 받고 자리 답 없음(옛 판) · off = 웹앱 닫힘 */
  const web = setInterval(() => { if (mode === 'fast') WA.sb.S._c2seat = null; if (mode === 'new' || mode === 'fast') WA.tick().catch(() => {}); else if (mode === 'old') H.api('GET', '/relay/pending?by=' + encodeURIComponent('웹앱 HOME 옛 판'), null, { Origin: 'https://readnow.kr' }).catch(() => {}); else if (mode === 'hello') H.api('GET', '/web/hello?u=0&v=1.78.482&by=x', null, { Origin: 'https://jerrycson.github.io' }).catch(() => {}); }, 1000);
  const logins = () => A.S.log.filter((x) => x.login).length; const job = async () => ((await st()).relogin.al || {}).job;
  const endJob = async (n) => until(async () => { const j = await job(); return j && !j.on && j.res && j.res.kind !== 'queued' ? j : null; }, n || 120);
  try {
    console.log('① 11/11 14시 실제 자리 문서 꼴 — 운영 수집기 꺼짐 · 빈자리 1 → 곧바로 받고 곧바로 확인');
    { const t = Date.now(), m = 60e3; WA.DOC.cfg = {}; WA.DOC.dev = { 'JS-MAIN': { in: true, at: t - 13 * m, use: t - 13 * m, pri: 2, how: '상시', ids: { a: t - 13 * m } }, 'MJ-MAIN': { in: true, at: t - 1 * m, pri: 3, how: '상시', ids: { b: t - m } }, cloud: { in: true, at: t - 6 * m, pri: 0, how: '자리' },
        HOME: { in: true, at: t - 206 * m, pri: 3, how: '상시', ids: { c: t - 206 * m } }, 'HOME~col2': { in: true, at: t - 237 * m, use: t - 237 * m, pri: 1, how: '자리' } }; WA.DOC.wait = {};
      const s0 = await until(async () => { const s = await st(); return s.al && s.al.seat ? s : null; }, 60);
      ok(s0 && s0.al.seatBy === 'web', '웹앱이 자리 문서로 자리를 줌(운영 수집기 없이 · 2/4대 상시 + 클라우드 1 → 빈자리 1)', s0 && JSON.stringify(s0.al.ws));
      ok(WA.DOC.dev['HOME~col2'].in === true && Date.now() - WA.DOC.dev['HOME~col2'].at < 60e3, '자리 문서의 HOME~col2가 새 신호로 바뀜(옛 3시간 전 자리 → 지금)');
      const n0 = logins(); const t0 = Date.now(); const r = await save({ pf: 'al', id: ID, pw: PW }); const sec = (Date.now() - t0) / 1000;
      ok(r.j.ok && r.j.kind === 'ok' && logins() === n0 + 1 && chk(datA) === 'ok', `[확인하고 저장] → 그 자리에서 실제 로그인 확인 → 잠가 저장 (${sec.toFixed(1)}초 · 기다림 줄 없음)`, r.j.msg || r.j.err);
      const wb = (await st()).relay.web; ok(wb && wb.pullOrg === 'jerrycson.github.io' && wb.pullVer === '1.78.482' && wb.org === 'jerrycson.github.io', 'github.io 주소 웹앱(정범님 HOME 북마크)으로 자리 받기·확인 저장 — 번외가 웹앱 주소·판을 앎', wb); }
    console.log('② 꽉 참 → 기다리다 시간 넘음 → 자리를 쥔 기기(이름·마지막 신호)·지금 할 일');
    { A.S.sess.clear(); await H.api('POST', '/al/run', { what: 'chk' }); const nd = await until(async () => (await st()).al.login === 'need', 80); ok(nd, '(준비) 세션이 풀려 로그인 필요');
      const t = Date.now(), m = 60e3; WA.DOC.cfg = { phones: ['JS-phone', 'MJ-phone'] }; delete WA.DOC.dev.cloud; WA.DOC.dev['JS-MAIN'] = { in: true, at: t - 4 * m, pri: 2, how: '상시' }; WA.DOC.dev['MJ-MAIN'] = { in: true, at: t - 2 * m, pri: 3, how: '상시' }; WA.DOC.dev['HOME~col2'] = { in: false, at: t, pri: 1, how: '번외 쉼' };
      WA.sb.S._c2seat = null; /* 웹앱이 곧바로 다시 물음(실제는 다음 신호 때) */ await until(async () => { const s = await st(); return s.al && !s.al.seat && s.al.ws && s.al.ws.n === 4 ? s : null; }, 80);
      mode = 'fast'; /* 시험은 시간을 줄여(묵음 9초) 웹앱이 1초마다 다시 묻게 — 실제는 묵음 5분 안에 15초마다 */
      const n0 = logins(); const r = await save({ pf: 'al', id: ID, pw: PW }); ok(!r.j.ok && r.j.queued && /할 일:/.test(r.j.err) && logins() === n0, '꽉 참: 기다림 줄에 넣고 그 자리에서 할 일을 보여 줌 · 로그인 안 함', r.j.err);
      const j = await endJob(400); const msg = (j && j.res && j.res.msg) || '';
      ok(/자리를 받지 못해/.test(msg) && /JS-MAIN\(🔒 상시 · \d\d:\d\d 신호\)/.test(msg) && /MJ-MAIN/.test(msg) && /휴대폰 2대/.test(msg) && /지금 할 일:/.test(msg) && /4\/4대/.test(msg), '시간 넘음 글 = 몇 대 · 자리를 쥔 기기(이름·마지막 신호 시각) · 지금 할 일', msg);
      ok(!/🏠가 켜져 있는지/.test(msg), '막연한 「🏠가 켜져 있는지」 글귀 없음');
      const s = await st(); ok(s.al.tell && s.al.tell.src === 'web' && /JS-MAIN/.test(s.al.tell.now) && s.al.tell.todo, '상태 al.tell(옆 창·웹앱이 읽음) = 웹앱 자리 문서 · 쥔 기기 · 할 일', JSON.stringify(s.al.tell));
      const br = await L.chromium().launch(); const pg = await (await br.newContext({ viewport: { width: 400, height: 900 } })).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1800);
      const td = await pg.evaluate(() => (document.getElementById('alSeatTodo') || {}).textContent || ''); ok(/→ 지금 할 일:/.test(td), '옆 창 🪑 줄 아래 「→ 지금 할 일」', td);
      if (SHOT) await pg.screenshot({ path: path.join(SHOT, 'col2-seat-why.png'), fullPage: true }); await br.close(); }
    mode = 'new';
    console.log('③ 웹앱이 옛 판(대기 일만 받고 자리 답 없음) → 새로고침 안내');
    { mode = 'old'; const tl = await until(async () => { const s = await st(); const x = s.al && s.al.tell; return x && x.src === 'webOld' && /옛 판/.test(x.now) && /웹앱 HOME 옛 판/.test(x.now) ? x : null; }, 90, 500);
      ok(tl && /옛 판/.test(tl.now) && /새로고침/.test(tl.todo) && /웹앱 HOME 옛 판/.test(tl.now), '「웹앱은 보이지만 자리 답을 보내지 않음 — 옛 판일 수 있음」 · 할 일 = 새로고침(F5)', tl && JSON.stringify(tl));
      await until(async () => /readnow\.kr/.test(((await st()).al.tell || {}).now || ''), 20, 300); const t2 = (await st()).al.tell; ok(/웹앱 마지막 소식 \d\d:\d\d .*\(readnow\.kr\)/.test(t2.now), '옛 판 안내에 웹앱 주소(readnow.kr)·마지막 소식', t2.now); }
    console.log('④ 웹앱도 다리도 없음 → 웹앱을 열어 두라는 안내');
    { mode = 'off'; const tl = await until(async () => { const s = await st(); const x = s.al && s.al.tell; return x && x.src === 'none' ? x : null; }, 60, 500);
      ok(tl && /웹앱도 안 보임/.test(tl.now) && /웹앱 마지막 답/.test(tl.now) && /readnow\.kr/.test(tl.todo), '「운영 수집기도 웹앱도 안 보임 · 마지막 소식」 · 할 일 = 이 PC에서 웹앱을 열어 두고 다시', tl && JSON.stringify(tl)); }
    console.log('⑥ 우리 두 주소의 미리 묻기 허락 · 다른 주소는 막고 남김');
    { for (const og of ['https://jerrycson.github.io', 'https://readnow.kr']) { const r = await H.req('OPTIONS', '/relay/pending', null, { Origin: og, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-rn-col2', 'Access-Control-Request-Private-Network': 'true' });
        ok(r.st === 204 && r.h['access-control-allow-origin'] === og && r.h['access-control-allow-private-network'] === 'true' && /X-RN-Col2/i.test(r.h['access-control-allow-headers'] || ''), `미리 묻기 허락 — ${og} (이 기기 네트워크 허락 머리 포함)`, r.h); }
      for (const og of ['https://evil.example', 'https://jerrycson.github.io.evil.example', 'http://readnow.kr']) { const r = await H.api('GET', '/relay/pending?by=x', null, { Origin: og }); ok(r.st === 403 && !r.h['access-control-allow-origin'], `다른 주소는 막음 — ${og}`, r.st); }
      const wb = (await st()).relay.web; ok(wb.rej && wb.rej.org === 'http://readnow.kr' && wb.rej.n >= 1, '막은 부름(주소·시각·횟수)을 남김', wb.rej);
      ok(/우리 웹앱 주소가 아닌 곳의 부름을 막음/.test(H.out()), '막은 부름을 기록에 한 줄', ''); }
    console.log('⑦ 구글 로그인 전 웹앱(github.io) → 「열려 있지만 로그인 전」');
    { mode = 'hello'; const tl = await until(async () => { const x = (await st()).al.tell; return x && x.src === 'webLogin' ? x : null; }, 60, 300);
      ok(tl && /jerrycson\.github\.io/.test(tl.now) && /1\.78\.482/.test(tl.now) && /구글 로그인 전/.test(tl.now) && /구글 로그인/.test(tl.todo), '「웹앱(github.io · 판)은 열려 있지만 구글 로그인 전」 · 할 일 = 그 탭에서 구글 로그인', tl && JSON.stringify(tl)); }
    console.log('⑧ 아무도 없음 → 웹앱 주소·판·마지막 소식 · 할 일에 두 주소');
    { mode = 'off'; const tl = await until(async () => { const x = (await st()).al.tell; return x && x.src === 'none' ? x : null; }, 90, 500);
      ok(tl && /웹앱 마지막 소식 \d\d:\d\d/.test(tl.now) && /jerrycson\.github\.io/.test(tl.now) && /readnow\.kr 또는 jerrycson\.github\.io\/readnow-scripts\/app\//.test(tl.todo), '「웹앱 마지막 소식 시각(주소 · 판)」 · 할 일에 두 주소 모두', tl && JSON.stringify(tl));
      const s = await st(); ok(s.al.webLine && /웹앱 마지막 소식/.test(s.al.webLine), '상태 al.webLine(옆 창 🌐 줄)', s.al.webLine);
      const br = await L.chromium().launch(); const pg = await (await br.newContext({ viewport: { width: 400, height: 900 } })).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1800);
      const tx = await pg.evaluate(() => ((document.getElementById('alSeat') || {}).parentNode || document.body).textContent || ''); ok(/웹앱 마지막 소식/.test(tx) && /jerrycson\.github\.io/.test(tx), '옆 창에 웹앱 주소·마지막 소식이 보임', tx.slice(0, 400));
      if (SHOT) await pg.screenshot({ path: path.join(SHOT, 'col2-seat-web.png'), fullPage: true }); await br.close(); }
    console.log('⑤ 운영 수집기(다리)가 자리를 못 받음 → 다리 이름·마지막 소식·다리가 알린 까닭');
    { await H.api('POST', '/al/feed', { by: 'HOME 수집기', seat: { ok: false, why: '알라딘 판매자 로그인 4/4대(휴대폰 2대 · 🔒 상시 PC JS-MAIN·MJ-MAIN) — 자리 기다림' }, hold: { on: false } });
      const s = await st(); const x = s.al.tell; ok(x && x.src === 'bridge' && /HOME 수집기/.test(x.now) && /마지막 소식 \d\d:\d\d/.test(x.now) && /4\/4대/.test(x.now) && /저절로 받음/.test(x.todo), '다리 이름 · 마지막 소식 · 다리가 알린 까닭 · 할 일', x && JSON.stringify(x)); }
  } catch (e) { ok(false, '시험 중 오류', e.stack); } finally { clearInterval(web); try { H.pr.kill('SIGKILL'); } catch (e) {} A.srv.close(); }
  if (L.bad() && process.env.DBG) console.log(H.out().slice(-6000));
  L.done('t_seatwhy');
})();
