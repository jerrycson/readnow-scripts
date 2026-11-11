/* t_cred — 🔐 [확인하고 저장] (11/10 밤 정범님 '번외 수집기 비밀번호 저장이 안 돼. 입력하면 예스24는 「확인 중」만 오래 있다가 그냥 풀리고, 알라딘은 아예 안 먹혀')
 *  재현: 가짜 예스24의 로그인 화면이 답을 안 줌(느린 사이트·막힌 화면) → 예전엔 끝없이 기다리다(최대 몇 분) 도우미 답이 끊기면 화면엔 아무 글 없이 단추만 돌아옴
 *  ① 예스24 — 시간 넘음(relogin.vMaxSec)이면 그 자리에서 멈추고 '확인 못 함 — 까닭(마지막 단계)' · 저장 안 함 · [그래도 잠가 저장]만 열림(틀림이 아니라서)
 *  ② 그래도 잠가 저장 = 확인 못 한 뒤에만 · '확인 기다림'으로 저장 → 다음 다시 로그인에서 맞으면 '확인됨' · 틀리면 ⛔ 한 번에 멈춤(두 번 두드리지 않음)
 *  ③ 알라딘 — 🏠 꺼짐이면 '🏠를 켜면 확인됨' · 세션이 살아 있으면 로그인을 더 하지 않고 '확인 기다림'으로 저장 · 풀려 있으면 실제 로그인으로 확인
 *  ④ 화면 — 누르면 곧바로 '⏳ 확인 중 — 무엇을(몇 초째)' · 끝난 결과는 그 칸 아래 그대로 남음 · 도우미 답이 끊겨도 결과를 받아 보임 · 그래도 저장은 두 번 누르기
 *  ⑤ 확인하는 동안 스스로 새 판 받기(크롬을 닫음)는 미룸 · 비밀번호·아이디는 답·상태·기록에 없음
 * 실행: node tests/t_cred.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const ID = 'sellerid' + Math.random().toString(36).slice(2, 8), PW = 'Pw!' + Math.random().toString(36).slice(2, 12);

function fakeY24() { const S = { pw: PW, sess: new Set(), log: [], hang: false, held: [] };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title></head><body><h1>${h}</h1>${b}</body></html>`;
  const form = (x) => page('로그인', `<form method="post" action="/Account/Login"><input name="id"><input type="password" name="pw"><button>로그인</button></form>${x || ''}`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/sid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, type, body, x) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/Account/Login' && q.method === 'POST') { const f = new URLSearchParams(b); S.log.push({ login: true, okId: f.get('id') === ID, okPw: f.get('pw') === S.pw, t: Date.now() }); if (f.get('id') !== ID || f.get('pw') !== S.pw) return H(200, 'text/html', form('틀림')); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, 'text/html', '', { 'Set-Cookie': `sid=${id}; Path=/; HttpOnly`, Location: '/' }); }
      S.log.push({ m: q.method, p: u.pathname, auth });
      if (u.pathname === '/Account/Login') { if (S.hang) { S.held.push(s); return; } return H(200, 'text/html', form()); } /* 막힌 로그인 화면 — 답을 주지 않음 */
      if (u.pathname.startsWith('/api/')) return auth ? H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], MENU_LIST: [] })) : H(401, 'application/json', '{}');
      if (!auth) return H(302, 'text/html', '', { Location: '/Account/Login' });
      return H(200, 'text/html', page('판매관리', '첫 화면')); }); });
  S.release = () => { for (const s of S.held.splice(0)) { try { s.destroy(); } catch (e) {} } };
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
function fakeScm() { const S = { pw: PW, sess: new Set(), log: [] }; const OUT = '<a href="/scm/wC2Cuser_logout.aspx">로그아웃</a>';
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const ck = (q.headers.cookie || '').match(/asid=(\w+)/); const auth = !!(ck && S.sess.has(ck[1])); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => {
      const H = (code, body, x) => { s.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8', ...(x || {}) }); s.end(body); };
      if (u.pathname === '/login/wlogin.aspx' && q.method === 'POST') { const f = new URLSearchParams(b); S.log.push({ login: true, okPw: f.get('pw') === S.pw }); if (f.get('pw') !== S.pw) return H(200, '<title>로그인</title>틀림'); const id = Math.random().toString(36).slice(2); S.sess.add(id); return H(302, '', { 'Set-Cookie': `asid=${id}; Path=/; HttpOnly`, Location: '/scm/wmain.aspx' }); }
      if (u.pathname === '/login/wlogin.aspx') return H(200, `<!doctype html><meta charset="utf-8"><title>로그인</title><form method="post" action="/login/wlogin.aspx"><input name="id"><input type="password" name="pw"><button>로그인</button></form>`);
      if (u.pathname.startsWith('/scm/')) { if (!auth) return H(302, '', { Location: '/login/wlogin.aspx?returnurl=' + encodeURIComponent(u.pathname) }); return H(200, `<!doctype html><meta charset="utf-8"><title>샵매니저</title>${OUT}<h1>샵매니저</h1>`); }
      return H(200, '<title>알라딘</title>'); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }

(async () => {
  const Y = await fakeY24(); const A = await fakeScm();
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); const HOME = D + '/home'; fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200 };
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: true, al: true, alOwn: false, auto: false, headless: true, pc: 'MJ-TEST', pcSrc: 'pc', alcfg, relogin: { gapMin: 0, perHour: 20, perDay: 50, vGapSec: 0, vPerHour: 50, vMaxSec: 12 }, y24cfg: { keepMin: 0.02, prdH: 0, tourH: 0, ppN: 0 }, watch: { tickSec: 60, handoffMs: 200 } },
    env: { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_ALSCM: A.base, RN_COL2_AL_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  const OG = { Origin: `http://127.0.0.1:${H.port}` }; const save = (b) => H.api('POST', '/cred/save', b, OG);
  const st = async () => (await H.api('GET', '/status')).j; const y = async () => (await st()).y24;
  let seat = false; const feedY = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 0 }, hold: { on: false }, ...(b || {}) }); const feedA = () => H.api('POST', '/al/feed', { by: '시험 수집기', seat: { ok: seat, why: seat ? '' : '자리 4/4' }, hold: { on: false } });
  const feeder = setInterval(() => { feedY().catch(() => {}); feedA().catch(() => {}); }, 1000);
  const ylog = () => Y.S.log.filter((x) => x.login); const datY = path.join(HOME, 'cred', 'y24.dat'), datA = path.join(HOME, 'cred', 'al.dat');
  const chk = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).chk; } catch (e) { return null; } };
  try {
    await until(async () => (await y()).login === 'need', 80);
    console.log('① 예스24 — 로그인 화면이 답을 안 주면(재현) 시간 안에 멈추고 「확인 못 함」');
    { let r = await save({ pf: 'y24', id: ID, pw: PW, force: true }); ok(!r.j.ok && /먼저 \[확인하고 저장\]/.test(r.j.err) && !fs.existsSync(datY), '확인을 한 번도 안 했으면 「그래도 잠가 저장」은 거절', r.j.err);
      Y.S.hang = true; const seen = []; const pend = save({ pf: 'y24', id: ID, pw: PW }); const t0 = Date.now();
      await until(async () => { const j = (await st()).relogin.y24.job; if (j && j.on && j.phase && !seen.includes(j.phase)) seen.push(j.phase); return false; }, 12, 400);
      r = await pend; const sec = (Date.now() - t0) / 1000;
      ok(seen.length >= 1 && seen.every((x) => /중$/.test(x)), '확인하는 동안 상태에 「지금 무엇을 하는 중」이 보임', seen.join(' → '));
      ok(sec < 20 && !r.j.ok && r.j.kind === 'unsure' && r.j.canForce && /확인 못 함/.test(r.j.err) && /12초 안에 확인이 끝나지 않음/.test(r.j.err) && /마지막 단계: [^)]+중\)/.test(r.j.err) && /그래도 잠가 저장/.test(r.j.err) && !fs.existsSync(datY), `시간 넘음(12초)이면 그 자리에서 끝냄 · 「확인 못 함 — 까닭(마지막 단계)」 · 저장 안 함 · 그래도 저장 길 안내 (${sec.toFixed(1)}초)`, r.j.err);
      const jb = (await st()).relogin.y24.job; ok(jb && !jb.on && jb.res && jb.res.kind === 'unsure' && jb.res.canForce && /확인 못 함/.test(jb.res.msg), '끝난 결과가 도우미 상태에 남음(화면을 다시 그려도 그대로)', jb && jb.res);
      ok(!JSON.stringify(r.j).includes(PW) && !JSON.stringify(await st()).includes(PW) && !JSON.stringify(await st()).includes(ID), '답·상태에 비밀번호·아이디 없음');
      Y.S.release(); Y.S.hang = false; await until(async () => !(await st()).relogin.y24.job.on && !(await y()).busy, 40); }
    console.log('② 그래도 잠가 저장 → 다음 다시 로그인에서 확인');
    { let r = await save({ pf: 'y24', id: ID, pw: PW, force: true }); ok(r.j.ok && r.j.pending && /확인하지 못한 채 잠가 저장/.test(r.j.msg) && chk(datY) === 'pending' && r.j.relogin.y24.chk === 'pending', '확인 못 한 뒤 「그래도 잠가 저장」 = 저장(확인 기다림 표시)', r.j.msg || r.j.err);
      await H.api('POST', '/y24/run', { what: 'ord' }); const n0 = ylog().length; const s = await until(async () => (await y()).login === 'ok' && chk(datY) === 'ok', 160);
      ok(s && ylog().length === n0 + 1 && ylog()[n0].okPw, '세션이 풀려 있어 저장해 둔 값으로 스스로 다시 로그인 → 맞음 → 「확인됨」으로 바뀜', { s, chk: chk(datY), n: ylog().length - n0 });
      let jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/확인하지 못한 채 잠가 두었던 아이디·비밀번호가 맞음/.test(jl), '기록창에 「잠가 두었던 값이 맞음(확인됨)」');
      /* 틀린 값을 확인 못 한 채 저장 → 다시 로그인 한 번에 ⛔ 멈춤 */
      Y.S.sess.clear(); /* (11/11 y24ops2) 세션이 살아 있으면 이제 로그인을 더 하지 않고 '확인 기다림'으로 저장 — 이 시험은 풀린 세션에서 막힌 화면 */ Y.S.hang = true; r = await save({ pf: 'y24', id: ID, pw: 'wrong-' + PW }); ok(r.j.kind === 'unsure', '(틀린 값도 막힌 화면이면 확인 못 함)', r.j.kind); Y.S.release(); Y.S.hang = false; await until(async () => !(await y()).busy, 40);
      r = await save({ pf: 'y24', id: ID, pw: 'wrong-' + PW, force: true }); ok(r.j.ok && chk(datY) === 'pending', '그래도 잠가 저장(틀린 값)');
      const n1 = ylog().length; Y.S.sess.clear(); await H.api('POST', '/y24/run', { what: 'ord' }); const v = await until(async () => { const z = (await st()).relogin.y24; return z.stop ? z : null; }, 160); await wait(3000);
      ok(v && v.stop.bad && /확인하지 못했던 아이디·비밀번호가 맞지 않음/.test(v.stop.why) && ylog().length === n1 + 1 && chk(datY) === 'bad', '다시 로그인에서 틀림이 드러나면 한 번에 멈추고 알림(두 번 두드리지 않음) · 「맞지 않음」 표시', { stop: v && v.stop, n: ylog().length - n1, chk: chk(datY) });
      jl = (await H.api('GET', '/log/lines?after=0')).j.lines.filter((e) => e.l === 'err').map((e) => e.x).join('\n'); ok(/⛔ 예스24 판매관리 — 확인하지 못한 채 잠가 두었던 아이디·비밀번호가 맞지 않음/.test(jl), '기록창 ⛔ 줄로 알림');
      r = await save({ pf: 'y24', id: ID, pw: 'wrong2-' + PW }); ok(!r.j.ok && r.j.kind === 'bad' && !r.j.canForce && /다시 넣어 주세요/.test(r.j.err) && !/그래도 잠가 저장/.test(r.j.err), '사이트가 틀렸다고 하면 = 「다시 넣어 주세요」 · 그래도 저장 길은 없음', r.j.err);
      r = await save({ pf: 'y24', id: ID, pw: 'wrong2-' + PW, force: true }); ok(!r.j.ok && chk(datY) === 'bad', '틀림 뒤엔 「그래도 잠가 저장」도 거절', r.j.err);
      r = await save({ pf: 'y24', id: ID, pw: PW }); ok(r.j.ok && r.j.kind === 'ok' && chk(datY) === 'ok' && !(await st()).relogin.y24.stop, '바른 값 = 실제로 로그인해 확인 → 저장 · 멈춤도 풂', r.j.msg || r.j.err); }
    console.log('③ 알라딘 — 🏠 꺼짐 · 세션 살아 있음 · 풀려 있음');
    { let r = await save({ pf: 'al', id: ID, pw: PW }); ok(!r.j.ok && r.j.kind === 'own' && /🏠/.test(r.j.err) && /켜면 .*확인됨/.test(r.j.err) && r.j.canForce && A.S.log.filter((x) => x.login).length === 0 && !fs.existsSync(datA), "🏠가 꺼져 자리가 없으면 = 「⚙ › 일 켜기·끄기 맨 위 🏠를 켜면 확인됨」 · 로그인 안 함", r.j.err);
      /* (11/11 정범님 'HOME 🏠를 켜고 자리를 받으면 바로 확인 로그인') 🏠를 켰지만 자리를 아직 못 받았을 때 누르면 = 값을 메모리에만 잠시 두고, 자리를 받는 대로 곧바로 확인 */
      await H.api('POST', '/cfg', { alOwn: true, src: 'pc' }); await feedA(); await wait(600);
      { const n0 = A.S.log.filter((x) => x.login).length; const q = await save({ pf: 'al', id: ID, pw: 'wrong-' + PW }); await wait(1500);
        ok(!q.j.ok && q.j.queued && /자리를 받는 대로 저절로 확인/.test(q.j.err) && A.S.log.filter((x) => x.login).length === n0 && !fs.existsSync(datA), '🏠 켬 · 자리 아직 없음 = 「자리를 받는 대로 저절로 확인」 · 아직 로그인 안 함', q.j.err);
        const all = JSON.stringify(await st()) + (await H.req('GET', '/log/all', null, { 'X-RN-Col2': '1' })).b; ok(!all.includes('wrong-' + PW) && !all.includes(ID), '기다리는 동안 값은 상태·기록 어디에도 없음(메모리에만)');
        seat = true; await feedA(); const jr = await until(async () => { const j = ((await st()).relogin.al || {}).job; return j && !j.on && j.res && j.res.kind === 'bad' ? j : null; }, 80);
        ok(jr && A.S.log.filter((x) => x.login).length === n0 + 1 && !fs.existsSync(datA), '자리를 받자 곧바로 그 값으로 확인 로그인 — 틀린 값이라 저장 안 함 · 화면에 까닭', jr && jr.res.msg); }
      await until(async () => (await st()).al && (await st()).al.seat, 40);
      r = await save({ pf: 'al', id: ID, pw: 'wrong-' + PW }); ok(!r.j.ok && r.j.kind === 'bad' && /다시 넣어 주세요/.test(r.j.err) && !fs.existsSync(datA), '🏠 켜고 자리를 받으면 실제 로그인으로 확인 — 틀리면 저장 안 함', r.j.err);
      r = await save({ pf: 'al', id: ID, pw: PW }); ok(r.j.ok && r.j.kind === 'ok' && chk(datA) === 'ok', '맞으면 저장(그대로 로그인 된 채)', r.j.msg || r.j.err);
      const n = A.S.log.filter((x) => x.login).length; r = await save({ pf: 'al', id: ID, pw: PW });
      ok(r.j.ok && r.j.pending && r.j.kind === 'live' && /지금 로그인돼 있어서 바로 확인하지 않음/.test(r.j.msg) && /다시 로그인할 때 이 값으로 확인/.test(r.j.msg) && A.S.log.filter((x) => x.login).length === n && chk(datA) === 'pending', '세션이 살아 있으면 = 로그인을 더 하지 않고 잠가 저장 · 화면에 「바로 확인하지 않음 · 다음 다시 로그인 때 확인」', r.j.msg || r.j.err); }
    console.log('④ 화면 — 진행 글 · 결과가 남음 · 답이 끊겨도 · 두 번 누르기');
    { const br = await L.chromium().launch(); const pg = await (await br.newContext()).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1500); await pg.click('#setBtn'); await wait(500);
      await H.api('POST', '/cred/auto', { pf: 'y24', on: false }); Y.S.sess.clear(); /* (11/11 y24ops2) 풀린 세션에서 확인(살아 있으면 이제 로그인을 더 하지 않음) · 이 칸 동안 스스로 다시 로그인은 꺼 둠(확인 기다림 상태를 보려고) */ Y.S.hang = true; (await pg.$('#crch_y24') && await pg.isVisible('#crch_y24') ? await pg.click('#crch_y24') : null); await pg.fill('#cri_y24', ID); await pg.fill('#crp_y24', PW); await pg.click('#crb_y24'); await wait(1300);
      const a1 = await pg.evaluate(() => ({ m: document.getElementById('crm_y24').textContent, b: document.getElementById('crb_y24').textContent, d: document.getElementById('crb_y24').disabled }));
      ok(/⏳ 확인 중 — /.test(a1.m) && /초째/.test(a1.m) && a1.d && /확인하는 중/.test(a1.b), "누르면 곧바로 '⏳ 확인 중 — 무엇을 하는 중(몇 초째)'", a1.m);
      const a2 = await until(async () => { const v = await pg.evaluate(() => document.getElementById('crm_y24').textContent); return /확인 못 함/.test(v) ? v : null; }, 60, 500);
      ok(a2 && /12초 안에/.test(a2), '끝나면 결과(확인 못 함 · 까닭)', a2); await wait(9000);
      const a3 = await pg.evaluate(() => ({ m: document.getElementById('crm_y24').textContent, f: getComputedStyle(document.getElementById('crf_y24')).display, b: document.getElementById('crb_y24').textContent, pw: document.getElementById('crp_y24').value.length }));
      ok(/확인 못 함/.test(a3.m) && a3.f !== 'none' && a3.b === '확인하고 저장' && a3.pw > 0, '9초 뒤(화면이 몇 번 다시 그려져도) 결과가 그대로 · [그래도 잠가 저장] 보임 · 비밀번호 칸은 그대로', a3);
      Y.S.release(); Y.S.hang = false; await until(async () => !(await y()).busy, 40);
      await pg.click('#crf_y24'); const f1 = await pg.evaluate(() => document.getElementById('crf_y24').textContent); ok(/한 번 더/.test(f1) && chk(datY) === 'ok', '그래도 저장은 한 번 누르면 「한 번 더 누르면…」만(아직 안 바꿈)', f1);
      await pg.click('#crf_y24'); const f2 = await until(async () => { const v = await pg.evaluate(() => document.getElementById('crm_y24').textContent); return /확인하지 못한 채 잠가 저장/.test(v) ? v : null; }, 30, 300);
      ok(f2 && chk(datY) === 'pending' && (await pg.evaluate(() => document.getElementById('crp_y24').value)) === '', '두 번 누르면 확인 없이 잠가 저장 · 결과 줄 · 비밀번호 칸 비움', f2);
      await wait(4500); const s1 = await pg.evaluate(() => document.getElementById('crbadge_y24').textContent + ' ' + document.getElementById('crs_y24').textContent); ok(/확인 기다림/.test(s1), "상태 줄 '✓ 저장됨 · ⚠ 확인 기다림'", s1);
      /* 도우미 답이 끊김(예전 '그냥 풀림' — 화면엔 아무 글 없이 단추만 돌아옴) → 그래도 결과를 받아 보임 */
      await pg.route('**/cred/save', async (rt) => { rt.fetch().catch(() => {}); await wait(300); await rt.abort('connectionreset'); });
      Y.S.sess.clear(); (await pg.$('#crch_y24') && await pg.isVisible('#crch_y24') ? await pg.click('#crch_y24') : null); await pg.fill('#cri_y24', ID); await pg.fill('#crp_y24', PW); await pg.click('#crb_y24');
      const c1 = await until(async () => { const v = await pg.evaluate(() => document.getElementById('crm_y24').textContent); return /로그인 확인됨/.test(v) ? v : null; }, 80, 500);
      ok(c1 && chk(datY) === 'ok', '도우미 답이 끊겨도 도우미에 남은 결과를 받아 「✓ 로그인 확인됨」을 보임', c1 || await pg.evaluate(() => document.getElementById('crm_y24').textContent)); await H.api('POST', '/cred/auto', { pf: 'y24', on: true });
      await br.close(); }
    console.log('⑤ 확인하는 동안 스스로 새 판 받기는 미룸 · 팝업 없음');
    { const src = fs.readFileSync(path.join(L.ROOT, 'helper', 'readnow-col2-helper.js'), 'utf8'); ok(/RLG\.anyJob\(\)\) \{ UPD\.msg = '🔐 계정 확인 중/.test(src), '새 판 받기(크롬을 닫음)는 계정 확인 중이면 다음으로');
      const ui = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-ui.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(ui), '화면에 팝업 함수 없음');
      const all = JSON.stringify(await st()) + (await H.req('GET', '/log/all', null, { 'X-RN-Col2': '1' })).b + H.out(); ok(!all.includes(PW) && !all.includes(ID), '상태·기록창·도우미 출력에 비밀번호·아이디 없음'); }
  } finally { clearInterval(feeder); try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); A.srv.close(); L.done('t_cred');
})();
