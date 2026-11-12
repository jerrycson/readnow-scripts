/* t_wseat — 🪑 이 PC 운영 수집기(다리)가 꺼져 있을 때 번외 알라딘 자리를 웹앱이 자리 문서로 직접 확인 (정범님 11/11 12:26 HOME 사진 '로그인 정보 기입 즉시 판단하지 않을 이유가 있어?')
 *  ① 다리 없음 + 웹앱 있음 → 번외가 웹앱에 자리 일을 부탁(alSeat) · 웹앱 코드(운영 src/app.html c2AlSeatGive 글자 그대로)가 가짜 Firestore 트랜잭션으로 묻고 적음
 *     · 운영 규칙(__rnLoginRule — 운영 본체 글자)으로 셈 · 고치는 칸은 dev·wait의 '<PC>~col2' 하나뿐
 *  ② 빈자리 있음 → [확인하고 저장]을 누르면 그 자리에서 곧바로 확인 로그인(기다림 줄에 넣지 않음) · 맞으면 저장
 *  ③ 빈자리 없음(4/4) → 몇 대·어느 기기가 쓰는지 보여 줌 · 자리가 나면 저절로 받아 곧바로 확인
 *  ④ 운영 수집기가 다시 켜지면(다리) 웹앱은 손을 뗌(handover · 지우지 않음) — 같은 자리 이름이라 겹침 없음
 *  ⑤ 옆 창 🪑 줄 · 🔐 저장됨 배지(아이디 앞 3자만) · 화면 사진
 * 실행: node tests/t_wseat.js */
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
  const f = (p, body) => new Promise((res) => { W.sent.push({ p, body: JSON.parse(JSON.stringify(body || null)) }); const r = http.request({ host: '127.0.0.1', port, path: p, method: body ? 'POST' : 'GET', headers: { 'X-RN-Col2': '1', 'Content-Type': 'application/json' } }, (x) => { let t = ''; x.on('data', (c) => (t += c)); x.on('end', () => { try { res(JSON.parse(t)); } catch (e) { res(null); } }); }); r.on('error', () => res(null)); r.end(body ? JSON.stringify(body) : undefined); });
  const sb = { S: {}, db, IS_MOBILE_DEV: false, c2IsLogger: () => false, errKo: (e) => String((e && e.message) || e), c2By: () => '시험 웹앱', Date, JSON, Object, Math, String, Error }; vm.createContext(sb); vm.runInContext(APP.slice(a, b), sb);
  const tick = async () => { const pd = await f('/relay/pending?by=t'); await sb.c2AlSeatGive(pd, f); return pd; };
  return { DOC, W, tick, sb }; }

(async () => {
  const A = await fakeScm();
  const D = fs.mkdtempSync(path.join(require('os').tmpdir(), 'col2t_')); const HOME = D + '/home'; fs.mkdirSync(D + '/bin', { recursive: true }); fs.writeFileSync(D + '/bin/dpapi', `#!/usr/bin/env node
const A=process.argv;const act=A[A.indexOf('-Act')+1];let t='';process.stdin.on('data',(c)=>t+=c);process.stdin.on('end',()=>{const k=Buffer.from('rn3-test-key');const x=(b)=>Buffer.from(b.map((v,i)=>v^k[i%k.length]));
if(act==='protect')process.stdout.write('ok:'+x([...Buffer.from(t,'utf8')]).toString('base64'));else process.stdout.write('ok:'+x([...Buffer.from(t.trim(),'base64')]).toString('utf8'))});`); fs.chmodSync(D + '/bin/dpapi', 0o755);
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200 };
  const H = await L.startHelper({ dir: D, cfg: { on: true, y24: false, al: true, alOwn: true, auto: false, headless: true, pc: 'HOME', hands: false, pcSrc: 'pc', alcfg, relogin: { gapMin: 0, perHour: 20, perDay: 50, vGapSec: 0, vPerHour: 50, vMaxSec: 40 }, watch: { tickSec: 60, handoffMs: 200 } },
    env: { RN_COL2_ALSCM: A.base, RN_COL2_AL_SCALE: '0.05', RN_COL2_CORE_DIR: L.PROD_REPO, RN_COL2_DPAPI: D + '/bin/dpapi' } });
  const OG = { Origin: `http://127.0.0.1:${H.port}` }; const save = (b) => H.api('POST', '/cred/save', b, OG);
  const st = async () => (await H.api('GET', '/status')).j; const datA = path.join(HOME, 'cred', 'al.dat'); const chk = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).chk; } catch (e) { return null; } };
  const WA = webApp(H.port); let webOn = true; const web = setInterval(() => { if (webOn) WA.tick().catch(() => {}); }, 1000); /* 웹앱이 열려 있음(시험은 1초마다 · 실제는 1분 · 급할 땐 2초) */
  const logins = () => A.S.log.filter((x) => x.login).length;
  try {
    console.log('① 다리 없음 — 웹앱이 자리 문서로 확인');
    { /* 빈자리 없음: 상시 PC 둘 + 휴대폰 둘 = 4/4 */ const t = Date.now(); WA.DOC.cfg = { phones: ['JS-phone', 'MJ-phone'] }; WA.DOC.dev = { 'JS-MAIN': { in: true, at: t, pri: 1, how: '상시' }, 'MJ-MAIN': { in: true, at: t, pri: 1, how: '상시' } };
      const pd = await until(async () => { const p = await WA.tick(); return p && p.alSeat ? p : null; }, 40);
      ok(pd && pd.alSeat && pd.alSeat.who === 'HOME~col2' && pd.alSeat.want && pd.alSeat.own, '다리가 없으면 번외가 웹앱에 자리 일을 부탁(HOME~col2 · 받기 · 🏠 이어받기)', pd && JSON.stringify(pd.alSeat));
      const sc = WA.W.sent.find((x) => x.p === '/al/seatcalc'); ok(sc && !JSON.stringify(sc.body).includes('tries') && !JSON.stringify(sc.body).includes('1.2'), '번외에 보내는 것은 dev·wait·cfg뿐(로그인 기록·주소 없음)');
      ok(WA.W.writes.length && WA.W.writes.every((w) => w.merge && Object.keys(w.P).every((k) => ['dev', 'wait'].includes(k) && Object.keys(w.P[k]).join() === 'HOME~col2')), '자리 문서에 적는 칸은 dev·wait의 HOME~col2 하나뿐', JSON.stringify(WA.W.writes[0]));
      const a = await until(async () => { const s = await st(); return s.al && s.al.ws && !s.al.seat ? s.al : null; }, 40);
      ok(a && a.ws.max === 4 && a.ws.n === 4 && a.ws.held.some((x) => /JS-MAIN/.test(x)) && a.ws.held.some((x) => /휴대폰 2대/.test(x)) && /4\/4대/.test(a.ws.why), '빈자리 없음 = 몇 대(4/4)·어느 기기가 쓰는지', a && JSON.stringify(a.ws));
      ok(WA.DOC.wait['HOME~col2'] && WA.DOC.dev['HOME~col2'] && WA.DOC.dev['HOME~col2'].in === false, '자리 문서에 HOME~col2 기다림 줄이 섬(운영 규칙 그대로)'); }
    console.log('② 4/4일 때 [확인하고 저장] → 쓰는 기기를 보여 주고 기다림 · 자리가 나면 저절로 곧바로 확인');
    { const n0 = logins(); const r = await save({ pf: 'al', id: ID, pw: PW });
      ok(!r.j.ok && r.j.queued && /빈 알라딘 로그인 자리가 없음/.test(r.j.err) && /4\/4대/.test(r.j.err) && /JS-MAIN/.test(r.j.err) && logins() === n0, '「빈 자리 없음 — 4/4대 · 쓰는 기기」 · 로그인 안 함 · 자리를 받는 대로 확인', r.j.err);
      delete WA.DOC.dev['MJ-MAIN']; /* MJ-MAIN이 로그인 일을 끝냄 → 빈자리 */
      const jr = await until(async () => { const j = ((await st()).relogin.al || {}).job; return j && !j.on && j.res && j.res.kind === 'ok' ? j : null; }, 120);
      ok(jr && logins() === n0 + 1 && chk(datA) === 'ok', '자리가 나자 웹앱이 받아 주고 → 번외가 곧바로 확인 로그인 → 맞아 잠가 저장', jr && jr.res.msg);
      ok(WA.DOC.dev['HOME~col2'] && WA.DOC.dev['HOME~col2'].in === true && !WA.DOC.wait['HOME~col2'], '자리 문서: HOME~col2 자리 받음 · 기다림 줄 지움'); }
    console.log('③ 빈자리 있음 → 누르자마자 곧바로 확인(기다림 없음)');
    { /* 세션을 풀고 자리는 있는 채로 — 다시 눌러 실제로 확인 */ A.S.sess.clear(); await H.api('POST', '/al/run', { what: 'chk' }); await until(async () => (await st()).al.login === 'need', 80);
      const n0 = logins(); const t0 = Date.now(); const r = await save({ pf: 'al', id: ID, pw: PW }); const sec = (Date.now() - t0) / 1000;
      ok(r.j.ok && r.j.kind === 'ok' && logins() === n0 + 1 && sec < 40, `자리가 있으면 그 자리에서 실제 로그인으로 확인 → 저장 (${sec.toFixed(1)}초)`, r.j.msg || r.j.err);
      const s = await st(); ok(s.al.seat && s.al.seatBy === 'web', '상태: 자리 받음 · 웹앱이 자리 문서로 확인', s.al.seatBy); }
    console.log('④ 운영 수집기가 다시 켜짐 → 웹앱은 손을 뗌(같은 자리 이름 · 겹침 없음)');
    { const nW = WA.W.writes.length; await H.api('POST', '/al/feed', { by: '시험 수집기', seat: { ok: true, why: '자리 받음(3/4대)' }, hold: { on: false } });
      const pd = await WA.tick(); ok(pd.alSeat && pd.alSeat.handover && !pd.alSeat.want, '다리가 보이면 웹앱에 「넘겨줌」', JSON.stringify(pd.alSeat));
      await WA.tick(); ok(WA.W.writes.length === nW && WA.DOC.dev['HOME~col2'].in === true, '웹앱은 자리 문서를 더 고치지 않음 · 자리는 그대로(운영 수집기가 같은 이름으로 이어 지킴)');
      const s = await st(); ok(s.al.seat && s.al.seatBy === 'bridge', '상태: 이제 다리가 알린 자리', s.al.seatBy); }
    console.log('⑤ 옆 창 — 🪑 줄 · 🔐 저장됨 배지(아이디 앞 3자) · 사진');
    { const br = await L.chromium().launch(); const pg = await (await br.newContext({ viewport: { width: 400, height: 900 } })).newPage(); await pg.goto(`http://127.0.0.1:${H.port}/`); await wait(1800);
      const seat = await pg.evaluate(() => (document.getElementById('alSeat') || {}).textContent || ''); ok(/🪑 알라딘 로그인 자리: 받음/.test(seat), '알라딘 칸에 🪑 자리 줄', seat);
      if (SHOT) await pg.screenshot({ path: path.join(SHOT, 'col2-al-seat.png'), fullPage: true });
      await pg.click('#setBtn'); await pg.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ await wait(600); const v = await pg.evaluate(() => ({ b: (document.getElementById('crbadge_al') || {}).textContent || '', ph: (document.getElementById('cri_al') || {}).placeholder || '', hid: getComputedStyle(document.getElementById('crin_al')).display }));
      ok(/🔐 저장됨 · 확인됨 · 아이디 jer\*\*\*/.test(v.b) && v.hid === 'none', '저장된 계정 = 큰 초록 「🔐 저장됨 · 확인됨 · 아이디 jer***」 · 칸은 [바꾸기] 전엔 닫힘', JSON.stringify(v));
      const ms = await pg.evaluate(() => { const e = document.getElementById('crms_al'); return e ? { t: e.textContent, d: getComputedStyle(e).display } : null; });
      ok(ms && ms.d !== 'none' && /🔐 알라딘 계정 확인 로그인/.test(ms.t) && /✓ 자리 확인/.test(ms.t) && /✓ 잠가 저장/.test(ms.t) && /끝 요약/.test(ms.t), '🔐 계정 확인 로그인 진행 막대(자리 확인 › 창 준비 › … › 잠가 저장) · 끝 요약', ms && ms.t);
      const all = JSON.stringify(await st()) + await pg.content(); ok(!all.includes(PW) && !all.includes(ID), '상태·화면에 아이디 전체·비밀번호 없음(앞 3자만)');
      if (SHOT) { await pg.evaluate(() => document.getElementById('crbox').scrollIntoView()); await pg.screenshot({ path: path.join(SHOT, 'col2-cred-badge.png'), fullPage: false }); }
      await br.close(); }
  } catch (e) { ok(false, '시험 중 오류', e.stack); } finally { clearInterval(web); try { H.pr.kill('SIGKILL'); } catch (e) {} A.srv.close(); }
  L.done('t_wseat');
})();
