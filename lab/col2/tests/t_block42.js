/* t_block42 — (11/11 fix5 · 정범님 'HOME 번외 ⚙ 알라딘 샵매니저 확인하고 저장이 실패 — 「로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-…)」 · 예스24는 같은 화면에서 성공')
 *  원인: 알라딘이 이 계정의 아이디·비밀번호 새 로그인을 42FB로 막음(app_settings/aladin_login 10/26~11/07 아이디 로그인 11번 모두 42FB6013-7046 · 네이버 길은 성공) — 폼·입력 방식 문제가 아님
 *  ① 42FB 알림이면 '틀림(bad)'이 아니라 '막힘(blocked)' — 까닭 글에 에러코드·'틀린 것이 아님'·네이버로 로그인
 *  ② 스스로 다시 로그인(run)에서 막힘 → 그 자리에서 멈춤(연속 실패를 기다리지 않음) · 잠가 둔 값 '틀림' 표시 안 함
 *  ③ 네이버 길(ctx.pre)이 되면 아이디·비밀번호를 열지도 넣지도 않음(how naver) · 저장 계정이 없어도 네이버 길이면 해도 됨 · preOnly면 값 칸까지 안 감
 *  ④ 비밀번호 틀림 글(42FB 아님)은 예전처럼 bad
 *  ⑤ 저장 확인(tryWith)에서 막힘 → unsure 아님 · blocked · 화면 기록에 비밀번호 없음
 * 크롬 없이(가짜 ctx) · 실행: node tests/t_block42.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const RL = require('../helper/col2-relogin.js');
const PW = 'Pw!' + Math.random().toString(36).slice(2, 10), ID = 'sel' + Math.random().toString(36).slice(2, 7);
const MSG42 = '로그인 과정에 문제가 발생하였습니다. (에러코드:42FB6013-7046-4B1A-A4DB-7BB1916B80FF)';
/* 가짜 화면 — 로그인 칸 있음 · [로그인]을 누르면 dlg 알림이 뜸(42FB 또는 틀림) · 확인(check)은 늘 로그인 화면 */
function fakeCtx(o) { o = o || {}; const T = { typed: [], navs: [], dlg: '', clicked: 0 };
  const ev = async (js) => { if (js === RL.JS_HUMAN) return ''; if (js === RL.JS_FORM) return { pw: true, id: true, form: true }; if (js === RL.JS_SUBMIT) { T.clicked++; T.dlg = o.msg || ''; return 'click'; }
    if (js === RL.JS_WHERE) return { login: true, p: '/login/wlogin.aspx', err: o.pageErr || '' }; if (/\.value\.length/.test(js)) return T.typed.length ? T.typed[T.typed.length - 1].length : 0; return true; };
  const ctx = { name: '알라딘 샵매니저', loginUrl: 'https://x/scm/wmain.aspx', nav: async (u) => { T.navs.push(u); }, ev, sleep: async () => {}, type: async (t) => { T.typed.push(t); }, key: async () => {}, lastMsg: () => T.dlg, leaveSec: 0, settle: async () => {}, check: async () => !!o.okAfter };
  if (o.pre) ctx.pre = o.pre; if (o.preOnly) ctx.preOnly = true; return { ctx, T }; }
const credOf = (has) => { const st = { chk: 'pending', marked: [] }; return { st, has: () => has, open: async () => ({ ok: true, id: ID, pw: PW }), chkOf: () => st.chk, mark: (pf, v) => { st.chk = v; st.marked.push(v); }, sum: () => ({ al: { has } }), PF: { al: { name: '알라딘 샵매니저' } } }; };
(async () => {
  console.log('① 42FB 알림 = 막힘(틀림 아님)');
  { const { ctx, T } = fakeCtx({ msg: MSG42 }); const r = await RL.doLogin(ctx, async () => ({ ok: true, id: ID, pw: PW }));
    ok(r && !r.ok && r.blocked && !r.bad, '막힘으로 봄(bad 아님)', JSON.stringify({ blocked: r.blocked, bad: r.bad }));
    ok(/42FB6013-7046/.test(r.why) && /틀린 것이 아님/.test(r.why) && /네이버로 로그인/.test(r.why), '까닭에 에러코드·틀린 것 아님·네이버 길', r.why.slice(0, 120));
    ok(T.clicked === 1, '[로그인]은 한 번만 누름', T.clicked); ok(RL.isBlock(MSG42) && RL.codeOf(MSG42) === '42FB6013-7046' && !RL.isBlock('아이디 또는 비밀번호가 일치하지 않습니다'), '막힘 글·코드 알아보기(운영 수집기 BLOCK_RE와 같은 뜻)'); }
  console.log('④ 비밀번호 틀림 글은 예전처럼 bad');
  { const { ctx } = fakeCtx({ msg: '아이디 또는 비밀번호가 일치하지 않습니다' }); const r = await RL.doLogin(ctx, async () => ({ ok: true, id: ID, pw: PW })); ok(r && r.bad && !r.blocked, 'bad', JSON.stringify(r).slice(0, 120)); }
  console.log('③ 네이버 길(값 없이) 먼저');
  { let opened = 0; const { ctx, T } = fakeCtx({ msg: MSG42, pre: async () => ({ ok: true }) }); const r = await RL.doLogin(ctx, async () => { opened++; return { ok: true, id: ID, pw: PW }; });
    ok(r.ok && r.how === 'naver', '네이버 길로 됨', JSON.stringify(r)); ok(opened === 0 && T.typed.length === 0 && T.clicked === 0, '아이디·비밀번호를 열지도 넣지도 않음', `${opened}/${T.typed.length}/${T.clicked}`); }
  { let opened = 0; const { ctx, T } = fakeCtx({ pre: async () => ({ ok: false, why: '이 번외 크롬에 네이버 로그인이 없음' }), preOnly: true }); const r = await RL.doLogin(ctx, async () => { opened++; return { ok: true, id: ID, pw: PW }; });
    ok(!r.ok && opened === 0 && T.typed.length === 0 && T.navs.length === 0, 'preOnly(저장 계정 없음) — 네이버 길이 안 되면 값 칸까지 안 감', JSON.stringify(r)); }
  { const { ctx, T } = fakeCtx({ msg: MSG42, pre: async () => ({ ok: false, why: '이 번외 크롬에 네이버 로그인이 없음' }) }); const r = await RL.doLogin(ctx, async () => ({ ok: true, id: ID, pw: PW }));
    ok(r.blocked && /네이버로 로그인: 이 번외 크롬에 네이버 로그인이 없음/.test(r.why) && T.typed.length === 2, '네이버 길 실패 → 저장 값으로 한 번 → 42FB면 두 까닭을 함께', r.why.slice(-80)); }
  console.log('② run — 막힘이면 바로 멈춤 · 저장 값 틀림 표시 안 함');
  const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'c2b42-')); const notes = [];
  { const cred = credOf(true); const R = RL.makeRelogin({ HOME, note: (m) => notes.push(m), cred, cfg: () => ({}), isLogger: () => false });
    ok(R.why('al', {}) === null, '해도 됨(자리·출고 문제 없음)'); const { ctx } = fakeCtx({ msg: MSG42 }); const r = await R.run('al', ctx); const s = R.sum().al;
    ok(!r.ok && r.blocked, '막힘', r.why.slice(0, 60)); ok(s.stop && s.stop.blocked && /42FB/.test(s.stop.why), '한 번에 멈춤(연속 2번을 기다리지 않음)', JSON.stringify(s.stop).slice(0, 100));
    ok(!cred.st.marked.includes('bad'), '잠가 둔 값을 틀림으로 표시하지 않음', JSON.stringify(cred.st.marked)); ok(/멈춤/.test(R.why('al', {}) || ''), '멈춘 뒤엔 다시 안 함', R.why('al', {}));
    ok(notes.some((n) => /네이버로 로그인/.test(n) && /⛔/.test(n)), '알림에 할 일(네이버로 로그인)', notes.filter((n) => /⛔/.test(n))[0]); }
  { const HOME2 = fs.mkdtempSync(path.join(os.tmpdir(), 'c2b42b-')); const cred = credOf(false); const R = RL.makeRelogin({ HOME: HOME2, note: () => {}, cred, cfg: () => ({}), isLogger: () => false });
    ok(/저장된 계정 없음/.test(R.why('al', {}) || '') && R.why('al', { naver: true }) === null, '저장 계정이 없으면 네이버 길일 때만 해도 됨');
    const { ctx } = fakeCtx({ pre: async () => ({ ok: true }), preOnly: true }); const r = await R.run('al', ctx); ok(r.ok && r.how === 'naver' && !cred.st.marked.length, '네이버 길로 다시 로그인 됨 · 저장 계정 표시는 안 건드림', JSON.stringify(r));
    ok(R.why('al', { naver: true }) !== null, '바로 뒤엔 간격 규칙(앞 시도 뒤 5분)', R.why('al', { naver: true }));
    const LG = RL.makeRelogin({ HOME: HOME2, note: () => {}, cred, cfg: () => ({}), isLogger: () => true }); ok(/로거/.test(LG.why('al', { naver: true }) || ''), '로거 PC는 네이버 길도 안 함(약속 0)'); }
  console.log('⑤ 저장 확인(tryWith) — 막힘은 확인 못 함이 아니라 막힘');
  { const HOME3 = fs.mkdtempSync(path.join(os.tmpdir(), 'c2b42c-')); const nt = []; const R = RL.makeRelogin({ HOME: HOME3, note: (m) => nt.push(m), cred: credOf(false), cfg: () => ({}), isLogger: () => false });
    const { ctx } = fakeCtx({ msg: MSG42 }); const r = await R.tryWith('al', ctx, ID, PW); ok(!r.ok && r.blocked && !r.unsure && !r.bad, 'blocked · unsure 아님 · bad 아님', JSON.stringify({ b: r.blocked, u: r.unsure, bad: r.bad }));
    const all = JSON.stringify(nt) + fs.readFileSync(path.join(HOME3, 'relogin.json'), 'utf8'); ok(!all.includes(PW) && !all.includes(ID), '기록·상태 파일에 아이디·비밀번호 없음'); }
  for (const d of fs.readdirSync(os.tmpdir()).filter((x) => /^c2b42/.test(x))) { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch (e) {} }
  L.done('t_block42');
})().catch((e) => { console.log('✗ 시험 멈춤', e.stack); process.exit(1); });
