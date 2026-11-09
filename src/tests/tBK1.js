// tBK1 — 로거 도우미 📦 기록 보관(arc): 가짜 git 거울·가짜 디스크·출고 중 미룸·하루 한 개·열쇠 찾기 + 수집기 신호·웹앱 표시 글 확인
// (노드만 · 도우미 코드에서 '기록 보관' 부분만 떼어 임시 폴더에서 돌림 — tVh와 같은 방식)
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const LOCAL = pick(path.join(__dirname, '..', 'local', 'readnow-local.js'), path.join(__dirname, '..', '..', 'local', 'readnow-local.js'));
const COL = pick(path.join(__dirname, '..', 'readnow-collector.user.js'), path.join(__dirname, '..', 'readnow-collector.src.js'));
const APP = pick(path.join(__dirname, '..', 'app.html'), path.join(__dirname, '..', 'srv', 'app.html'));
const SRC = fs.readFileSync(LOCAL, 'utf8');
const a = SRC.indexOf('/* ══ 📦 기록 보관(arc) 시작'); const b = SRC.indexOf('/* ══ 📦 기록 보관(arc) 끝');
const out = []; const ok = (c, m) => out.push((c ? '✓ ' : '❌ ') + m);
ok(a > 0 && b > a, '도우미에 기록 보관 부분이 있음');
const code = SRC.slice(a, b).replace(/^if \(!T_IF\) \{ setTimeout\(\(\) => arcRun[^\n]*\n/m, '');
ok(code.indexOf('setInterval') < 0, '시험에서는 시계(setInterval) 없이');

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rnarc-')); const HOME = path.join(ROOT, 'local'); const BK_DIR = path.join(ROOT, 'backup'); fs.mkdirSync(HOME, { recursive: true });
let clock = Date.parse('2026-11-09T01:00:00Z'); /* 한국 10:00 */
const kst = (ms) => new Date((ms || clock) + 9 * 3600e3).toISOString();
const logs = []; let free = 50; let calls = 0; let wifi = '192.168.0.5';
/* 가짜 git: 거울 폴더에 파일을 새 파일로 바꿔 씀(tmp → rename · 진짜 거울과 같은 방식) + state 파일에 커밋 */
const REMOTE = { 'readnow-scripts': { sha: 'aaaaaaa1111', files: { 'src/PROJECT_STATE.md': '상태 1', 'app.html': '<html>1' } }, 'readnow-chats': { sha: 'ccccccc2222', files: { 'DIGEST.md': '요약 1', 'HANDOFF/lead_CURRENT.md': '바통 1' } } };
const GHST = { at: null, sha: null, err: null, run: false }; const GHST2 = { at: null, sha: null, err: null, run: false, on: false };
async function ghMirror(force) { calls++; const put = (nm, GS) => { const R = REMOTE[nm]; const base = path.join(BK_DIR, 'github', nm); for (const [p, v] of Object.entries(R.files)) { const f = path.join(base, ...p.split('/')); fs.mkdirSync(path.dirname(f), { recursive: true }); let cur = null; try { cur = fs.readFileSync(f, 'utf8'); } catch (e) {} if (cur !== v) { fs.writeFileSync(f + '.tmp', v); fs.renameSync(f + '.tmp', f); } }
    fs.writeFileSync(path.join(BK_DIR, 'github', nm === 'readnow-scripts' ? 'state.json' : 'state-' + nm + '.json'), JSON.stringify({ sha: R.sha, at: kst() })); GS.sha = R.sha; GS.at = kst(); GS.err = null; };
  put('readnow-scripts', GHST); const tok = ctx.arcTok(); GHST2.on = !!tok; if (tok) put('readnow-chats', GHST2); }
const ctx = { fs, path, ROOT, HOME, BK_DIR, CFG: {}, ST: { wifi: { localIp: wifi } }, GHST, GHST2, kst, log: (...x) => logs.push(x.join(' ')), bkFree: () => free, ghMirror, T_IF: 1, JSON, String, Math, Number, Object, Date: { now: () => clock, parse: Date.parse }, Error };
vm.createContext(ctx); vm.runInContext(code + '\nthis.arcRun = arcRun; this.arcShip = arcShip; this.arcTok = arcTok; this.arcPub = arcPub; this.arcCfg = arcCfg; this.ARC = ARC; this.ARC_DIR = ARC_DIR;', ctx);
const AD = path.join(ROOT, 'archive'); const rd = (...p) => fs.readFileSync(path.join(AD, ...p), 'utf8');

(async () => {
  ok(ctx.ARC_DIR === AD, '보관 자리 = D:\\ReadNow\\archive (ROOT\\archive)');
  { const c = ctx.arcCfg(); ok(c.on && c.everyMin === 60 && c.minFreeGB === 5 && c.shipMin === 3, '기본 설정 — 60분마다 · 여유 5GB · 출고 신호 3분'); }
  // ① 열쇠 없음 → 공개 저장소만 사본 · 대화 저장소는 '열쇠 없음'으로 신호
  await ctx.arcRun(); let P = ctx.arcPub();
  ok(calls === 1 && fs.existsSync(path.join(AD, '2026-11-09', 'readnow-scripts', 'src', 'PROJECT_STATE.md')), '① 첫 회 — 거울을 맞춘 뒤 오늘 사본(readnow-scripts)');
  const M1 = JSON.parse(rd('2026-11-09', 'MANIFEST.json')); ok(M1.repos['readnow-scripts'].sha === 'aaaaaaa1111' && M1.repos['readnow-scripts'].files === 2 && M1.repos['readnow-chats'].missing === true, '① MANIFEST — 커밋·파일 수 · 대화 저장소 빠짐 표시');
  ok(/README/.test(fs.readdirSync(AD).join(',')) && /TRANSFER\.md/.test(rd('README.txt')), '① archive\\README.txt(여는 법 · TRANSFER.md 안내)');
  ok(/^📦 기록 보관: 11-09 10:00 · /.test(P.line) && /scripts aaaaaaa/.test(P.line) && /chats 없음/.test(P.line) && /열쇠 없음/.test(P.err), '① 신호 한 줄: ' + P.line);
  // ② 열쇠: 🔐 보안 보관 사본(app_secrets.json의 gh_archive) → 대화 저장소도 받음 · 같은 날은 사본 하나(덮지 않음)
  fs.mkdirSync(path.join(ROOT, 'secure', 'latest'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'secure', 'latest', 'app_secrets.json'), JSON.stringify({ kind: 'x', docs: { gh_archive: { token: 'github_pat_FAKE0000000000000000000000' } } }));
  clock += 61 * 60e3; REMOTE['readnow-scripts'].files['app.html'] = '<html>2'; REMOTE['readnow-scripts'].sha = 'bbbbbbb3333'; await ctx.arcRun(); P = ctx.arcPub();
  ok(calls === 2 && P.key === '보안 보관' && fs.existsSync(path.join(BK_DIR, 'github', 'readnow-chats', 'DIGEST.md')), '② 열쇠를 🔐 보안 보관 사본에서 찾아 대화 저장소 거울도 받음');
  ok(rd('2026-11-09', 'readnow-scripts', 'app.html') === '<html>1' && !fs.existsSync(path.join(AD, '2026-11-09', 'readnow-chats')), '② 같은 날 두 번째 — 사본은 하루 한 개(그날 첫 모습 그대로 · 덮지 않음)');
  ok(fs.readFileSync(path.join(BK_DIR, 'github', 'readnow-scripts', 'app.html'), 'utf8') === '<html>2', '② 거울은 새 내용(하드 링크여도 지난 사본이 바뀌지 않음)');
  ok(!JSON.stringify(P).includes('FAKE') && !logs.join('\n').includes('FAKE'), '② 열쇠 값은 신호·기록에 안 나옴');
  // ③ 파일 열쇠가 먼저
  fs.writeFileSync(path.join(HOME, 'gh-chats-token.txt'), '\uFEFFgithub_pat_FILE000000000000000000000\n'); ok(ctx.arcTok() === 'github_pat_FILE000000000000000000000' && ctx.ARC.key === '파일', '③ local\\gh-chats-token.txt가 있으면 그것 먼저');
  // ④ 60분 안에는 다시 안 함
  clock += 10 * 60e3; await ctx.arcRun(); ok(calls === 2, '④ 설정 시간(60분) 안에는 다시 받지 않음');
  ctx.CFG.archive = { everyMin: 5 }; ok(ctx.arcCfg().everyMin === 15, '④ 설정 everyMin은 15분 밑으로 못 내림'); ctx.CFG.archive = {};
  // ⑤ 출고 중 미룸
  clock += 60 * 60e3; ctx.arcShip(true); await ctx.arcRun(); P = ctx.arcPub(); ok(calls === 2 && /출고 보호 중/.test(P.wait) && /출고 보호 중/.test(P.line), '⑤ 출고 보호 중(수집기 ship=1) — 받지 않고 미룸');
  ctx.arcShip(false); await ctx.arcRun(true); ok(calls === 2, '⑤ 신호가 3분 안이면 강제여도 미룸');
  clock += 4 * 60e3; await ctx.arcRun(); P = ctx.arcPub(); ok(calls === 3 && !P.wait, '⑤ 출고 신호가 끊기고 3분 뒤 — 다시 함');
  // ⑥ 다음 날 → 새 사본 · 지난 사본 그대로
  clock = Date.parse('2026-11-10T00:30:00Z'); REMOTE['readnow-chats'].files['DIGEST.md'] = '요약 2'; await ctx.arcRun(); P = ctx.arcPub();
  ok(fs.existsSync(path.join(AD, '2026-11-10', 'MANIFEST.json')) && rd('2026-11-10', 'readnow-scripts', 'app.html') === '<html>2' && rd('2026-11-10', 'readnow-chats', 'DIGEST.md') === '요약 2', '⑥ 다음 날 — 새 사본(두 저장소)');
  ok(rd('2026-11-09', 'readnow-scripts', 'app.html') === '<html>1' && fs.existsSync(path.join(AD, '2026-11-09', 'MANIFEST.json')), '⑥ 지난 날 사본은 지우지도 바꾸지도 않음');
  ok(P.days === 2 && P.sha['readnow-chats'] === 'ccccccc2222' && P.sha['readnow-scripts'] === 'bbbbbbb3333' && !P.err, '⑥ 신호: 사본 2일 · 두 커밋 · 오류 없음 — ' + P.line);
  // ⑦ 디스크 여유 부족 → 멈추고 보고
  clock += 2 * 3600e3; free = 2; await ctx.arcRun(); P = ctx.arcPub(); ok(calls === 4 && /디스크 여유 2GB — 설정 5GB 밑이라 멈춤/.test(P.err) && /⚠ 디스크/.test(P.line), '⑦ 디스크 여유가 설정값 밑 — 멈추고 신호에 적음');
  ctx.CFG.archive = { minFreeGB: 1 }; clock += 2 * 3600e3; await ctx.arcRun(); ok(calls === 5 && !ctx.arcPub().err, '⑦ 설정 minFreeGB를 내리면 다시 함'); ctx.CFG.archive = {}; free = 50;
  // ⑧ 서비스 길(와이파이·랜선)이 없으면 받지 않음(테더링으로 GitHub에 가지 않음)
  clock += 2 * 3600e3; ctx.ST.wifi.localIp = null; await ctx.arcRun(); ok(calls === 5 && /서비스 길/.test(ctx.arcPub().err), '⑧ 서비스 길이 없으면 쉼 — 테더링으로 받지 않음'); ctx.ST.wifi.localIp = wifi;
  // ⑨ 끔
  ctx.CFG.archive = { on: false }; clock += 2 * 3600e3; await ctx.arcRun(); ok(calls === 5, '⑨ archive.on:false면 하지 않음'); ctx.CFG.archive = {};
  // ⑩ 이어 붙인 곳들(도우미 /status · 거울 열쇠 · 수집기 신호 · 웹앱)
  ok(/arcShip\(u\.searchParams\.get\('ship'\) === '1'\)/.test(SRC) && /arc: arcPub\(\)/.test(SRC) && /const tok = arcTok\(\);/.test(SRC) && !/gh-chats-token\.txt'\), 'utf8'\)\.replace\(\/\^\\uFEFF\/, ''\)\.trim\(\); \} catch \(e\) \{\} GHST2/.test(SRC), '⑩ 도우미: /status?ship=1 받음 · 상태에 arc · 거울이 arcTok 씀');
  ok(!/child_process|execFile\('git'|git pull/.test(code), '⑩ git을 부르지 않음(나가는 길을 못 고름 — 약속 0)');
  ok(!/aladin/i.test(code.replace(/\/\*[\s\S]*?\*\//g, '')), '⑩ 기록 보관 코드에 알라딘 쪽 길·쿠키 없음');
  if (COL) { const C = fs.readFileSync(COL, 'utf8'); ok(/window\.__rnSgOn && window\.__rnSgOn\(\) \? '&ship=1' : ''/.test(C) && /arc: HELPER && HELPER\.arc \? \{ line:/.test(C), '⑩ 수집기: 출고 보호면 ship=1 · 로거 신호(pcBeat)에 arc 한 줄'); } else ok(false, '수집기 파일 없음');
  if (APP) { const H = fs.readFileSync(APP, 'utf8'); ok(/<div id="arc_box">\$\{arcBeatHtml\(\)\}<\/div>/.test(H) && /function arcBeatHtml\(\)/.test(H) && /doc\('gh_archive'\)/.test(H) && /secvHtml\(\) \+ arcKeyHtml\(\)/.test(H), '⑩ 웹앱: 🖥 기기 운영 보고에 📦 한 줄 · ⚙ 🔐 보안 보관에 📦 보관 열쇠 넣기');
    ok(!/value="\$\{[^}]*token/.test(H.slice(H.indexOf('function arcKeyBody'), H.indexOf('function arcKeyHtml'))), '⑩ 웹앱: 열쇠 값을 화면에 다시 넣지 않음'); } else ok(false, '웹앱 파일 없음');
  fs.rmSync(ROOT, { recursive: true, force: true });
  console.log(out.join('\n')); const bad = out.filter((x) => !x.startsWith('✓')).length; console.log(bad ? `❌ tBK1 실패 ${bad}개` : `✓ tBK1 통과 (${out.length}개)`); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log(out.join('\n')); console.log('❌ tBK1 멈춤: ' + e.stack); process.exit(1); });
