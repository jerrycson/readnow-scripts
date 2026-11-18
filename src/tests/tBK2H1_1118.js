/* tBK2H1_1118 — 정범님 11/18 17:19 「매일 백업을 하루 12회차로 나눠서 2시간마다」 · 「Github의 모든 자료도 로거에 백업되고 있어?」 (일꾼 bk2h1)
 *  ① 수집기 회차 계산(bkSlotOf): 한국 00·02·…·22시 칸 · 날짜 넘김 · 하루 12칸
 *  ② 두 도우미의 봉인 덩어리(bkWrite)를 떼어 돌림: 회차 파일 <날짜>-<시>-inc.jsonl · 회차마다 새 파일 · 덮지 않음 · 예전 이름 그대로 · 봉인된 회차 파일은 -2
 *  ③ 되돌리기·목록 이름 규칙(수집기 LFR.FILE · 도우미 LF_RE)이 새 이름과 예전 이름을 모두 받음
 *  ④ GitHub 보관 저장소 넷 · 권한 없음 글 · 이슈·PR 보관(가짜 GitHub · 읽기만 · 바뀐 것만 · 새 이름 · 지우지 않음)
 *  ⑤ 수집기 회차 문 · 사진·보안 자료 2시간 · 웹앱 글
 * 실행: node src/tests/tBK2H1_1118.js */
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const R = (...p) => pick(path.join(__dirname, '..', ...p), path.join(__dirname, '..', '..', ...p));
const LOCAL = R('local', 'readnow-local.js'), PRINT = R('local', 'readnow-print.js');
const COLS = pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', '..', 'src', 'readnow-collector.src.js'));
const APP = pick(path.join(__dirname, '..', 'app.html'), path.join(__dirname, '..', '..', 'src', 'app.html'));
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const S1 = fs.readFileSync(LOCAL, 'utf8'), S2 = fs.readFileSync(PRINT, 'utf8'), C = fs.readFileSync(COLS, 'utf8'), A = fs.readFileSync(APP, 'utf8');
(async () => {
  /* ── ① 회차 계산 */
  const m = C.match(/const BK_EVERY_H = 2; const bkSlotOf = (\(ms\) => \{[\s\S]*?return \{[^}]*\}; \});/);
  ok(!!m, '수집기에 BK_EVERY_H = 2 · bkSlotOf 가 있음');
  const slotOf = vm.runInNewContext('const BK_EVERY_H = 2; (' + m[1] + ')', { Date, Math, String });
  const at = (iso) => slotOf(Date.parse(iso));
  let s = at('2026-11-18T00:30:00+09:00'); ok(s.day === '2026-11-18' && s.hh === '00' && s.key === '2026-11-18-00' && s.startMs === Date.parse('2026-11-18T00:00:00+09:00'), '한국 00:30 → 00시 칸');
  s = at('2026-11-18T01:59:59+09:00'); ok(s.hh === '00', '한국 01:59 → 00시 칸');
  s = at('2026-11-18T02:00:00+09:00'); ok(s.hh === '02' && s.key === '2026-11-18-02', '한국 02:00 → 02시 칸');
  s = at('2026-11-18T17:19:00+09:00'); ok(s.hh === '16', '한국 17:19 → 16시 칸');
  s = at('2026-11-18T23:59:00+09:00'); ok(s.hh === '22' && s.day === '2026-11-18', '한국 23:59 → 22시 칸(그날)');
  s = at('2026-11-18T15:00:00Z'); ok(s.day === '2026-11-19' && s.hh === '00', 'UTC 15:00 = 한국 다음 날 00시 칸(날짜 넘김)');
  const keys = new Set(); for (let t = Date.parse('2026-11-18T00:00:00+09:00'); t < Date.parse('2026-11-19T00:00:00+09:00'); t += 10 * 60e3) keys.add(slotOf(t).key);
  ok(keys.size === 12, '하루 = 12회차 (' + [...keys].map((k) => k.slice(-2)).join('·') + ')');

  /* ── ② 봉인 덩어리 떼어 돌리기(두 도우미) */
  const cut = (S) => { const a = S.indexOf('/* ══ 🔏 백업 봉인 시작'), b = S.indexOf('/* ══ 🔏 백업 봉인 끝'); return a > 0 && b > a ? S.slice(a, b) : null; };
  const B1 = cut(S1), B2 = cut(S2); ok(B1 && B1 === B2, '두 도우미의 봉인 덩어리가 글자 하나 다르지 않음(회차 이름 포함)');
  for (const [nm, B] of [['로거', B1], ['인쇄', B2]]) {
    const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rnbk2h-')); const BK_DIR = path.join(ROOT, 'backup'); let clock = Date.parse('2026-11-18T12:00:00+09:00');
    const ctx = vm.createContext({ fs, path, BK_DIR, bkName: (x) => String(x || '').replace(/[^0-9A-Za-z_\-]/g, '').slice(0, 60), bkFree: () => 50, log: () => {}, require: (q) => (q === 'child_process' ? { execFile: (c, a, o, cb) => setImmediate(() => cb(null, '', '')) } : require(q)), process: { platform: 'linux' }, setTimeout, setInterval, setImmediate, Promise, JSON, Date, Math, Number, String, Error, Map, Set, Buffer, console });
    vm.runInContext(B + '\nglobalThis.__T = { SEAL, SEAL_RE, bkWrite, sealSweep };', ctx); const T = ctx.__T; T.SEAL.now = () => clock;
    const col = 'prd_listings', dir = path.join(BK_DIR, 'firestore', col); const F = (n) => path.join(dir, n); const rd = (n) => fs.readFileSync(F(n), 'utf8');
    let w = T.bkWrite(col, '2026-11-18', 'full', [{ id: 'a' }], '10'); ok(w.file === '2026-11-18-full.jsonl', nm + ': 전부(full)는 회차를 붙이지 않음 — 예전 이름 그대로');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'b' }], '10'); ok(w.file === '2026-11-18-10-inc.jsonl', nm + ': 10시 회차 바뀐 것 = 2026-11-18-10-inc.jsonl');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'c' }], '12'); ok(w.file === '2026-11-18-12-inc.jsonl' && rd('2026-11-18-10-inc.jsonl') === '{"id":"b"}\n', nm + ': 다음 회차는 새 파일 — 앞 회차 파일은 그대로(덮지 않음)');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'd' }], '12'); ok(w.file === '2026-11-18-12-inc.jsonl' && rd('2026-11-18-12-inc.jsonl') === '{"id":"c"}\n{"id":"d"}\n', nm + ': 같은 회차 안에서 이어 보내면 뒤에 덧붙임(앞 줄 그대로)');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'e' }]); ok(w.file === '2026-11-18-inc.jsonl', nm + ': 회차 없이 오면(예전 수집기) 예전 이름 <날짜>-inc.jsonl');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'f' }], '25'); ok(w.file === '2026-11-18-inc.jsonl', nm + ': 이상한 회차(25)는 무시 — 예전 이름');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'g' }], '../x'); ok(w.file === '2026-11-18-inc.jsonl' && fs.readdirSync(dir).every((f) => !f.includes('..')), nm + ': 회차 칸으로 길을 바꿀 수 없음');
    ok(T.SEAL_RE.test('2026-11-18-10-inc.jsonl') && T.SEAL_RE.exec('2026-11-18-10-inc-2.jsonl')[1] === '2026-11-18' && T.SEAL_RE.exec('2026-11-18-10-inc.jsonl')[2] === 'inc' && T.SEAL_RE.test('2026-11-18-full.jsonl'), nm + ': 봉인 이름 규칙이 회차 파일도 받음(날짜·종류 칸 그대로)');
    /* 다음 날 → 지난 회차 파일 봉인 → 같은 이름에 다시 오면 -2 */
    clock = Date.parse('2026-11-19T09:00:00+09:00'); const old = (clock - 5 * 3600e3) / 1000; for (const f of fs.readdirSync(dir)) fs.utimesSync(F(f), old, old);
    await T.sealSweep(); const before = rd('2026-11-18-10-inc.jsonl');
    w = T.bkWrite(col, '2026-11-18', 'inc', [{ id: 'late' }], '10'); ok(w.file === '2026-11-18-10-inc-2.jsonl' && rd('2026-11-18-10-inc.jsonl') === before, nm + ': 봉인된 회차 파일에는 쓰지 않고 -2 새 이름');
  }

  /* ── ③ 이름 규칙 */
  const lfr = new RegExp(C.match(/FILE: \/(\^\\d\{4\}[^/]*)\/i/)[1], 'i');
  ok(['2026-11-18-full.jsonl', '2026-11-18-inc.jsonl', '2026-11-18-10-inc.jsonl', '2026-11-18-10-inc-2.jsonl', '2026-11-17-full-2.jsonl'].every((f) => lfr.test(f)) && !lfr.test('2026-11-18-1-inc.jsonl') && !lfr.test('x.jsonl'), '수집기 되돌리기(LFR.FILE)가 예전 이름·회차 이름·-2를 모두 받음');
  const lf = new RegExp(S1.match(/const LF_RE = \/([^/]*)\/;/)[1]);
  ok(['2026-11-18-full.jsonl', '2026-11-18-inc.jsonl', '2026-11-18-22-inc.jsonl', '2026-11-18-22-inc-3.jsonl'].every((f) => lf.test(f)), '도우미 되돌리기 목록(LF_RE)도 같음');
  ok(/bkWrite\(col, d, kind, L, u\.searchParams\.get\('slot'\)\)/.test(S1) && /bkWrite\(col, d, kind, L, u\.searchParams\.get\('slot'\)\)/.test(S2), '두 도우미 /bk-put 이 slot 을 받아 넘김');
  ok(/\$\{kind === 'inc' \? '&slot=' \+ slot : ''\}/.test(C), '수집기는 바뀐 것(inc)만 회차를 붙여 보냄');

  /* ── ④ GitHub 넷 · 권한 없음 · 이슈·PR */
  ok(/const ARC_REPOS = \['readnow-scripts', 'readnow-chats', 'readnow-collab', 'readnow-ui2'\]/.test(S1), '기록 보관 사본 = 저장소 넷');
  ok(/\['jerrycson\/readnow-collab', 'readnow-collab'\], \['jerrycson\/readnow-ui2', 'readnow-ui2'\]/.test(S1), '거울 = collab·ui2 더함(같은 열쇠)');
  ok(/보관 열쇠에 이 저장소 권한 없음 \(HTTP \$\{hm\[1\]\}\)/.test(S1) && /HTTP \(401\|403\|404\)/.test(S1), '401·403·404 → 「보관 열쇠에 이 저장소 권한 없음」');
  ok(!/commits\/main`/.test(S1) && /default_branch/.test(S1), '기본 갈래를 저장소에서 읽음(main 고정 아님)');
  ok(/more: GHSTX, issues: GHISS/.test(S1) && /ghMore: GHSTX, ghIssues: GHISS/.test(S1), '/bk-gh·/bk-stat 이 넷 상태·이슈 상태를 보여 줌');
  { const a = S1.indexOf('const GH_MORE = '), b = S1.indexOf('setTimeout(() => ghMirror()', a); const code = S1.slice(a, b);
    ok(a > 0 && b > a && !/method: '(POST|PUT|PATCH|DELETE)'/.test(code) && !/unlink|rmSync|rmdir/.test(code), '이슈·PR 보관은 읽기만(GET) · 지우는 코드 없음');
    const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rnghi-')); const BK_DIR = path.join(ROOT, 'backup'); let clock = Date.parse('2026-11-18T09:00:00Z'); const urls = [];
    let DB = { issues: [{ id: 1, number: 1, updated_at: '2026-11-18T01:00:00Z', title: '하나' }, { id: 2, number: 2, updated_at: '2026-11-18T02:00:00Z', title: '둘', pull_request: {} }], 'issues/comments': [{ id: 11, updated_at: '2026-11-18T02:00:00Z', body: '댓글' }], 'pulls/comments': [] };
    let deny = false;
    const getBufP = async (u) => { urls.push(u); if (deny) throw new Error('HTTP 404'); const q = new URL(u); const ep = q.pathname.replace(/^\/repos\/[^/]+\/[^/]+\//, ''); const since = q.searchParams.get('since'); const L = (DB[ep] || []).filter((x) => !since || x.updated_at >= since); return Buffer.from(JSON.stringify(L)); };
    const ctx = vm.createContext({ fs, path, BK_DIR, getBufP, bkFree: () => 50, log: () => {}, kst: () => new Date(clock + 9 * 3600e3).toISOString(), bkUniq: (fp) => { if (!fs.existsSync(fp)) return fp; const e = path.extname(fp); for (let i = 2; ; i++) { const q = fp.slice(0, -e.length) + '-' + i + e; if (!fs.existsSync(q)) return q; } }, Date: (() => { const RD = Date; class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(clock); } static now() { return clock; } } return FD; })(), JSON, Math, Object, String, Error, Array, Buffer, encodeURIComponent, URL });
    vm.runInContext(code + '\nthis.ghIssues = ghIssues; this.GH_ALL = GH_ALL; this.GHISS = GHISS;', ctx);
    ok(ctx.GH_ALL.length === 4 && ctx.GH_ALL.map((x) => x[1]).join(',') === 'readnow-scripts,readnow-chats,readnow-collab,readnow-ui2', '이슈·PR 보관 = 저장소 넷');
    const D = path.join(BK_DIR, 'github', 'readnow-collab-issues'); const ls = () => fs.readdirSync(D).filter((f) => f !== 'state.json').sort();
    let r = await ctx.ghIssues('jerrycson/readnow-collab', 'readnow-collab', 'github_pat_TEST000000000000000000');
    const f1 = ls(); const J1 = JSON.parse(fs.readFileSync(path.join(D, f1[0]), 'utf8'));
    ok(f1.length === 1 && /^2026-11-18-180000-issues\.json$/.test(f1[0]) && J1.issues.length === 2 && J1.issueComments.length === 1 && r.n === 3, '첫 회 — 이슈·PR 2 + 댓글 1을 한 파일(' + f1[0] + ')');
    ok(urls.every((u) => /^https:\/\/api\.github\.com\/repos\/jerrycson\/readnow-collab\/(issues|issues\/comments|pulls\/comments)\?/.test(u)) && urls.some((u) => /state=all/.test(u)), '읽는 길 = issues(state=all · PR 포함)·issues/comments·pulls/comments');
    clock += 2 * 3600e3; urls.length = 0; await ctx.ghIssues('jerrycson/readnow-collab', 'readnow-collab', 'x'.repeat(30)); ok(urls.length === 0, '6시간 안에는 다시 읽지 않음');
    clock += 5 * 3600e3; await ctx.ghIssues('jerrycson/readnow-collab', 'readnow-collab', 'x'.repeat(30)); ok(ls().length === 1 && ctx.GHISS['readnow-collab'].n === 0, '바뀐 것이 없으면 새 파일을 만들지 않음(경계 같은 시각은 이미 받은 것으로 거름)');
    DB.issues.push({ id: 3, number: 3, updated_at: '2026-11-18T20:00:00Z', title: '셋' }); DB['issues/comments'][0] = { ...DB['issues/comments'][0], updated_at: '2026-11-18T20:30:00Z', body: '고친 댓글' };
    clock += 7 * 3600e3; await ctx.ghIssues('jerrycson/readnow-collab', 'readnow-collab', 'x'.repeat(30)); const f3 = ls(); const J3 = JSON.parse(fs.readFileSync(path.join(D, f3[f3.length - 1]), 'utf8'));
    ok(f3.length === 2 && J3.issues.length === 1 && J3.issues[0].id === 3 && J3.issueComments[0].body === '고친 댓글' && fs.readFileSync(path.join(D, f1[0]), 'utf8') === JSON.stringify(J1), '바뀐 것만 새 파일 · 앞 파일 그대로(덮지 않음)');
    deny = true; clock += 7 * 3600e3; r = await ctx.ghIssues('jerrycson/readnow-ui2', 'readnow-ui2', 'x'.repeat(30)); ok(r.noPerm && /보관 열쇠에 이 저장소 권한 없음 \(HTTP 404/.test(r.err) && ls().length === 2, '열쇠가 못 보는 저장소 → 「보관 열쇠에 이 저장소 권한 없음」 · 다른 저장소 파일은 그대로');
    ok(!JSON.stringify(ctx.GHISS).includes('github_pat_TEST'), '열쇠 값은 상태에 안 나옴');
  }

  /* ── ⑤ 수집기 문 · 사진 · 보안 자료 · 웹앱 글 */
  ok(/ST\.slot === SL\.key/.test(C) && !/ST\.day === day \|\| hr < 2/.test(C) && /ST\.read\.n >= 400000/.test(C), '자료 보관 문 = 2시간 칸마다 한 번(02시 뒤 하루 한 번 아님) · 40만 하루 합 그대로');
  ok(/Date\.now\(\) - last < BK_EVERY_H \* 3600e3/.test(C), '사진 보관 = 2시간마다');
  ok(/L\.key === P\.key/.test(C) && /P\.start \+ BK_EVERY_H \* 3600e3/.test(C), '보안 자료 보관 = 2시간 칸마다 한 번');
  ok(/cs\.bigD !== day/.test(C) && /BK_BIGCAP - \(\+cs\.bigN \|\| 0\)/.test(C), '큰 분석 칸 상한은 하루 합(회차마다 새로 받지 않음)');
  ok(/if \(fullNow\.length \|\| ST\.logDay !== day\)/.test(C), '백업 기록(backup_log)은 전부 받은 칸이 있거나 그날 첫 번째일 때만 — 정리(retainSweep) 범위 그대로');
  ok(/if \(hr < 2 \|\| hr >= 5\) return false/.test(C), '로거 대신 보관 PC 동작은 그대로(02~05시 창)');
  ok(/2시간마다 한 회차\(한국 00·02·…·22시 · 하루 12번\)/.test(A) && /D:\\\\ReadNow\\\\images · 2시간마다 새 사진만/.test(A), '웹앱 ⑪ 글 = 2시간마다');
  ok(/readnow-scripts·readnow-chats·readnow-collab·readnow-ui2/.test(A), '웹앱 글에 저장소 넷');
  console.log(bad ? `❌ ${bad}개 틀림` : '✓ 모두 맞음'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험이 멈춤', e); process.exit(1); });
