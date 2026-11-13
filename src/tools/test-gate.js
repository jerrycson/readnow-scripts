#!/usr/bin/env node
/* test-gate.js — 판 내기 직전 시험 문지기 (rv2b · 정범님 11/13 16:00 「다시는 같은 문제가 생기지 않도록」)
 * 까닭(reports/RV2B_1113.md): 11/07~11/13 실패한 시험 10개가 6일 넘게 아무 경보 없이 남았음 —
 *   ship-check(①~⑦)·release.js·worklock 어디도 시험을 돌리지 않았고, 일꾼들은 'main에서도 실패'라며 26번 넘김.
 * 하는 일 (ship-check.sh ⑧⑨⑩이 부름 · 혼자 돌려도 됨):
 *   ⑧ 빠른 시험 묶음(src/tests/QUICK.json — 출고·등록·핵심)을 밀어 올리는 커밋 그대로(git archive)로 임시 자리에서 돌림
 *      → 새로 실패하면 막음. 이미 실패 중인 시험은 '알려진 실패' 장부(src/tests/KNOWN_FAIL.json · 까닭·담당·기한)에 있어야만 통과 · 기한이 지나면 막음
 *      → 한 번 실패한 시험은 한 번 더 돌려 흔들림(두 번째 통과)은 ⚠ 알림만
 *   ⑨ 기능 함수가 바뀌었는데 그 함수를 부르는 시험 파일은 그대로면 ⚠ 알림(기대값이 바뀌는 고침이면 같은 커밋에서 시험도 고칠 것) — 딸린 시험 몇 개를 함께 돌려 결과를 보여 줌
 *   ⑩ ❓ 업데이트 기록: 이번 웹앱 판·지난 7일 판(UPDATE_DATES)에 CHANGELOG 줄이 비었거나 없으면 막음
 * 쓰는 법:
 *   node src/tools/test-gate.js [--base origin/main] [--target HEAD] [--only tA,tB] [--no-tests] [--keep]
 *   종료 코드 0 = 통과 · 1 = 막음(까닭 줄 ❌) · 2 = 시험 자리를 못 꾸림(❌ — 넘기려면 RN_QUICK_SKIP=1 + 커밋 글에 까닭)
 * 시험 틀(harness.js·fbstub.js·seed.js)은 비공개 readnow-chats/tools/session-kit/pw에서, playwright는 NODE_PATH에서 찾음 · /home/user/w(공용 빌드 폴더)는 건드리지 않음 */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), net = require('net');
const A = process.argv.slice(2); const arg = (k, d) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : d; }; const has = (k) => A.includes(k);
const TOP = cp.execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const git = (...a) => cp.execFileSync('git', a, { cwd: TOP, encoding: 'utf8', maxBuffer: 256 << 20 });
const gitOk = (...a) => { try { return git(...a); } catch (e) { return null; } };
const BASE = arg('--base', 'origin/main'), TARGET = arg('--target', process.env.RN_PUSH_SHA || 'HEAD');
let bad = 0; const no = (m) => { bad = 1; console.log('❌ ' + m); }; const warn = (m) => console.log('⚠ ' + m); const say = (m) => console.log(m);
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // 한국 날짜
const show = (rev, f) => gitOk('show', `${rev}:${f}`);
const readJ = (rev, f, d) => { const t = show(rev, f); if (t == null) return d; try { return JSON.parse(t); } catch (e) { no(`${f} JSON을 못 읽음: ${e.message}`); return d; } };
const changed = (gitOk('diff', '--name-only', BASE, TARGET) || '').split('\n').filter(Boolean);
const CODE_RE = /^(src\/app\.html|app\/|src\/readnow-collector\.src\.js|readnow-[a-z0-9-]+\.js$|cloud\/|local\/|src\/tests\/|src\/tools\/test-gate\.js)/;

/* ⑩ ❓ 업데이트 기록(CHANGELOG) — 웹앱 원본이 바뀔 때 */
function changelogCheck() {
  if (!changed.includes('src/app.html')) return;
  const t = show(TARGET, 'src/app.html') || ''; const t0 = show(BASE, 'src/app.html') || '';
  const av = (t.match(/const APP_VER = '([\d.]+)'/) || [])[1]; const av0 = (t0.match(/const APP_VER = '([\d.]+)'/) || [])[1];
  const a = t.indexOf('const CHANGELOG = {'); const b = t.indexOf('\n};', a); if (a < 0 || b < 0) { no('src/app.html에서 CHANGELOG를 못 찾음'); return; }
  const CL = {}; for (const m of t.slice(a, b).matchAll(/\n\s*'(\d+\.\d+\.\d+)':\s*\[(.?)/g)) CL[m[1]] = m[2] !== ']';
  const da = t.indexOf('const UPDATE_DATES = {'); const UD = {}; if (da >= 0) for (const m of t.slice(da, t.indexOf('};', da)).matchAll(/'(\d+\.\d+\.\d+)': '(\d{4}-\d\d-\d\d)'/g)) UD[m[1]] = m[2];
  const miss = []; const need = new Set();
  if (av && av !== av0) need.add(av);
  const cut = new Date(Date.now() + 9 * 3600e3 - 7 * 864e5).toISOString().slice(0, 10);
  for (const [v, d] of Object.entries(UD)) if (d >= cut && /^1\.78\./.test(v)) need.add(v);
  for (const v of need) if (!CL[v]) miss.push(v + (v in CL ? '(빈 칸)' : '(줄 없음)'));
  if (av && av !== av0 && !UD[av]) no(`UPDATE_DATES에 이번 웹앱 판 ${av} 날짜가 없음 — ❓ 업데이트 기록·따라잡기 표가 이 판을 못 셈 (bump.py가 넣음)`);
  if (miss.length) no(`❓ 업데이트 기록(CHANGELOG)이 빈 웹앱 판 ${miss.length}개: ${miss.sort().join(', ')} — 판마다 바뀐 점 한 줄(화면 기록 UPDATE_LOG·커밋 제목에서)을 같은 판에 넣을 것 · 판 번호만 오른 판도 '판 번호만 — 무엇과 함께 낸 판'으로`);
  else say(`✓ ⑩ ❓ 업데이트 기록: 이번 판 ${av || '-'} · 지난 7일 웹앱 판 ${need.size}개 모두 CHANGELOG 있음`);
}

/* ⑨ 바뀐 기능 함수 → 그 함수를 부르는 시험이 그대로인지 */
const FN_FILES = (f) => /^(src\/app\.html|cloud\/[a-z0-9-]+\.js|src\/readnow-collector\.src\.js|readnow-[a-z0-9-]+-core\.js|readnow-registry\.js|local\/[a-z0-9-]+\.js)$/.test(f);
function changedFns() {
  const out = new Map(); // 함수 → 파일
  for (const f of changed.filter(FN_FILES)) {
    const txt = show(TARGET, f); if (txt == null) continue; const L = txt.split('\n');
    const starts = []; L.forEach((l, i) => { const m = /^\s{0,6}(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]{2,})\s*\(/.exec(l); if (m) starts.push([i + 1, m[1]]); else if (/^(?:const|let|var) [A-Za-z_$][\w$]* = [\[{]/.test(l)) starts.push([i + 1, null]); }); // 맨 앞 const 표(CHANGELOG·UPDATE_LOG 같은 자료)는 함수 바뀜으로 안 셈
    const d = gitOk('diff', '-U0', BASE, TARGET, '--', f) || '';
    for (const m of d.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const s = +m[1], n = m[2] == null ? 1 : +m[2];
      for (let ln = s; ln <= s + Math.max(0, n - 1); ln++) { let lo = 0, hi = starts.length - 1, k = -1; while (lo <= hi) { const md = (lo + hi) >> 1; if (starts[md][0] <= ln) { k = md; lo = md + 1; } else hi = md - 1; } if (k >= 0 && starts[k][1]) out.set(starts[k][1], f); if (out.size > 400) break; }
    }
  }
  return out;
}
function followCheck(Q) {
  const fns = changedFns(); if (!fns.size) return [];
  const tdir = (gitOk('ls-tree', '--name-only', TARGET, 'src/tests/') || '').split('\n').filter((x) => /^src\/tests\/t[^/]*\.js$/.test(x));
  const touched = new Set(changed.filter((x) => x.startsWith('src/tests/')));
  const texts = {}; for (const f of tdir) texts[f] = show(TARGET, f) || '';
  const hits = []; const names = [...fns.keys()].filter((n) => !/^(toast|esc|ask|render|fmt|h|el|now|log)$/.test(n));
  const re = (n) => new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b');
  const cnt = {}; for (const n of names) { const r = re(n); cnt[n] = tdir.filter((f) => r.test(texts[f])).length; }
  for (const f of tdir) { if (touched.has(f)) continue; const fsHit = names.filter((n) => cnt[n] > 0 && cnt[n] <= 25 && re(n).test(texts[f])); if (fsHit.length) hits.push([path.basename(f, '.js'), fsHit]); }
  hits.sort((a, b) => b[1].length - a[1].length);
  if (hits.length) { warn(`⑨ 바뀐 기능 함수 ${names.length}개 중 일부를 부르는 시험 ${hits.length}개가 이번 push에서 그대로임 — 기대값(규칙)이 바뀌는 고침이면 같은 커밋에서 그 시험도 고칠 것 (그대로 두면 다음 사람이 'main에서도 실패'로 넘기게 됨):`);
    hits.slice(0, 8).forEach(([t, f]) => say(`   · ${t} ← ${f.slice(0, 4).join('·')}${f.length > 4 ? ` 외 ${f.length - 4}` : ''}`)); }
  else say(`✓ ⑨ 바뀐 기능 함수 ${names.length}개 — 그 함수를 부르는 시험은 이번에 함께 고쳐졌거나 없음`);
  return hits.map((h) => h[0]);
}

/* ⑧ 빠른 시험 묶음 */
function findKit() { const c = [process.env.RN_KIT, path.join(TOP, '..', 'readnow-chats', 'tools', 'session-kit', 'pw'), '/home/user/readnow-chats/tools/session-kit/pw', '/home/claude/readnow-chats/tools/session-kit/pw'].filter(Boolean); return c.find((d) => fs.existsSync(path.join(d, 'harness.js'))); }
function findXlsx() { const c = [process.env.RN_XLSX, path.join(TOP, '..', 'w', 'pw', 'xlsx.full.min.js'), '/home/user/w/pw/xlsx.full.min.js', '/home/claude/w/pw/xlsx.full.min.js', path.join(os.homedir(), '.cache', 'rn-gate', 'xlsx.full.min.js')].filter(Boolean); return c.find((f) => fs.existsSync(f)); }
function freePort() { return new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }
function bed() { // 밀어 올리는 커밋 그대로 → Q(저장소 모양) + Q/w(공용 빌드 폴더 모양) + Q/w/srv(시험 서버) + Q/w/pw(시험 틀 + 이 커밋의 시험)
  const kit = findKit(); if (!kit) return { err: '시험 틀(readnow-chats/tools/session-kit/pw/harness.js)을 못 찾음 — readnow-chats를 readnow-scripts 옆에 받을 것' };
  try { require.resolve('playwright', { paths: [TOP, ...(process.env.NODE_PATH || '').split(':').filter(Boolean)] }); } catch (e) { return { err: 'playwright를 못 찾음 — readnow-chats tools/session-kit/setup.sh 안내대로' }; }
  const Q = fs.mkdtempSync(path.join(process.env.RN_GATE_TMP || os.tmpdir(), 'rn-gate-'));
  cp.execSync(`git archive ${TARGET} -- . ':(exclude)manual' ':(exclude)diag' ':(exclude)backups' | tar -x -C ${Q}`, { cwd: TOP, stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/bash' }); // 설명서 사본(164MB)·진단·백업 기록만 뺀 저장소 그대로
  const W = path.join(Q, 'w'); fs.mkdirSync(path.join(W, 'out'), { recursive: true });
  const ln = (a, b) => { try { fs.symlinkSync(a, b); } catch (e) {} };
  for (const f of ['app.html', 'split.js', 'release.js', 'sw.js']) if (fs.existsSync(path.join(Q, 'src', f))) fs.copyFileSync(path.join(Q, 'src', f), path.join(W, f));
  fs.copyFileSync(path.join(Q, 'src', 'readnow-collector.src.js'), path.join(W, 'readnow-collector.user.js'));
  for (const f of fs.readdirSync(Q).filter((x) => /^readnow-.*\.js$/.test(x))) { ln(path.join(Q, f), path.join(W, f)); ln(path.join(Q, f), path.join(W, 'out', f)); }
  for (const d of ['cloud', 'local', 'research', 'facts-docs']) if (fs.existsSync(path.join(Q, d))) ln(path.join(Q, d), path.join(W, d));
  if (fs.existsSync(path.join(Q, 'src', 'img'))) ln(path.join(Q, 'src', 'img'), path.join(W, 'img'));
  for (const d of ['app', 'friend', 'cloud']) if (fs.existsSync(path.join(Q, d))) ln(path.join(Q, d), path.join(W, 'out', d));
  if (fs.existsSync(path.join(Q, 'pc-live.json'))) ln(path.join(Q, 'pc-live.json'), path.join(W, 'out', 'pc-live.json'));
  const P = path.join(W, 'pw'); fs.mkdirSync(P); cp.execSync(`cp -r ${JSON.stringify(kit)}/. ${JSON.stringify(P)}/ && cp -r ${JSON.stringify(path.join(Q, 'src', 'tests'))}/. ${JSON.stringify(P)}/`, { shell: '/bin/bash' });
  const xl = findXlsx(); if (xl) fs.copyFileSync(xl, path.join(P, 'xlsx.full.min.js'));
  const S = path.join(W, 'srv'); fs.mkdirSync(S); for (const d of ['app', 'friend']) ln(path.join(W, 'out', d), path.join(S, d)); for (const f of fs.readdirSync(W).filter((x) => /^readnow-.*\.js$/.test(x))) ln(path.join(W, f), path.join(S, f));
  ln(path.join(W, 'research'), path.join(S, 'research')); ln(path.join(W, 'facts-docs'), path.join(S, 'facts-docs')); if (fs.existsSync(path.join(P, 'r15'))) ln(path.join(P, 'r15'), path.join(S, 'r15'));
  return { Q, W, P, S, xl };
}
function runOne(P, t, port, tmo) {
  return new Promise((res) => { const t0 = Date.now(); let out = '';
    const c = cp.spawn('node', [t + '.js'], { cwd: P, env: { ...process.env, RN_PORT: String(port), RN_APP: path.join(P, '..', 'app.html') }, stdio: ['ignore', 'pipe', 'pipe'] });
    const k = setTimeout(() => { out += `\n❌ 시간 넘음(${tmo}초)`; try { c.kill('SIGKILL'); } catch (e) {} }, tmo * 1000);
    c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; });
    c.on('close', (code) => { clearTimeout(k); res(judge(t, out, code, Date.now() - t0)); }); });
}
function judge(t, out, code, ms) {
  const L = out.split('\n'); const items = []; let summary = false, pass = false;
  for (const l of L) { if (/^\s*✓/.test(l)) { if (/통과|PASS/.test(l)) pass = true; continue; } const m = /^(\s*)(?:❌|✗)\s*(.*)$/.exec(l); if (!m) continue; if (m[1].length) items.push(m[2].trim().slice(0, 200)); else summary = true; }
  const tErr = (/ERRORS:\s*(\[[\s\S]*?\])/.exec(out) || [])[1] || ''; if (/"TEST /.test(tErr)) items.push('시험 안 오류: ' + (/"TEST ([^"]{0,160})/.exec(tErr) || [])[1]);
  const ok = !items.length && !summary && code === 0 && pass; const why = ok ? '' : !items.length && !summary ? (code !== 0 ? `끝 코드 ${code}` : '통과 줄 없음') : '';
  return { t, ok, items, why, ms, tail: L.filter((l) => l.trim()).slice(-6).join('\n') };
}
async function runAll(B, list, tmo, par) {
  const port = await freePort(); const srv = cp.spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: B.S, stdio: 'ignore' });
  try { for (let i = 0; i < 40; i++) { const okc = await new Promise((r) => { const s = net.connect(port, '127.0.0.1', () => { s.end(); r(true); }); s.on('error', () => r(false)); }); if (okc) break; await new Promise((r) => setTimeout(r, 150)); }
    const res = {}; let i = 0; const work = async () => { while (i < list.length) { const t = list[i++]; if (!fs.existsSync(path.join(B.P, t + '.js'))) { res[t] = { t, ok: false, items: [], why: '시험 파일 없음', ms: 0 }; continue; } let r = await runOne(B.P, t, port, tmo); if (!r.ok) { const r2 = await runOne(B.P, t, port, tmo); if (r2.ok) { r2.flaky = r; r = r2; } else r.second = r2; } res[t] = r; } };
    await Promise.all(Array.from({ length: par }, work)); return res;
  } finally { try { srv.kill('SIGKILL'); } catch (e) {} }
}
function knownCheck(K) { // 장부 꼴: { "items": [ { "test", "items"?: [항목 글 일부], "why", "owner", "until": "YYYY-MM-DD", "since" } ] }
  const L = (K && K.items) || []; const max = new Date(Date.now() + 9 * 3600e3 + 14 * 864e5).toISOString().slice(0, 10);
  for (const e of L) { const miss = ['test', 'why', 'owner', 'until'].filter((k) => !e[k]); if (miss.length) no(`KNOWN_FAIL 줄(${e.test || '?'})에 ${miss.join('·')} 없음 — 까닭·담당·기한을 모두 적을 것`); else if (!/^\d{4}-\d\d-\d\d$/.test(e.until)) no(`KNOWN_FAIL ${e.test} 기한 꼴이 YYYY-MM-DD가 아님(${e.until})`); else if (e.until > max) no(`KNOWN_FAIL ${e.test} 기한 ${e.until}이 14일보다 멂 — 오래 묵히지 않게 14일 안으로(그때 다시 판단해 늘림)`); }
  return L;
}
(async () => {
  say(`🧪 시험 문지기(test-gate) — ${TARGET} ← ${BASE} · 바뀐 파일 ${changed.length}개`);
  changelogCheck();
  const K = knownCheck(readJ(TARGET, 'src/tests/KNOWN_FAIL.json', { items: [] }));
  const QJ = readJ(TARGET, 'src/tests/QUICK.json', null);
  const codeChanged = changed.some((f) => CODE_RE.test(f));
  if (has('--no-tests') || process.env.RN_QUICK_SKIP) { if (process.env.RN_QUICK_SKIP) warn('RN_QUICK_SKIP — 빠른 시험을 넘김(까닭을 커밋 글에 적을 것)'); followCheck(); process.exit(bad); }
  if (!codeChanged && !has('--only')) { say('✓ ⑧ 코드·결과물이 안 바뀜 — 빠른 시험 건너뜀'); process.exit(bad); }
  if (!QJ || !Array.isArray(QJ.tests) || !QJ.tests.length) { no('src/tests/QUICK.json(빠른 시험 묶음)이 없거나 비었음'); process.exit(1); }
  const follow = followCheck();
  const quick = has('--only') ? arg('--only').split(',') : QJ.tests.map((x) => x.t);
  const extra = has('--only') || process.env.RN_QUICK_FOLLOW === '0' ? [] : follow.filter((t) => !quick.includes(t)).slice(0, QJ.follow_max == null ? 3 : QJ.follow_max);
  const B = bed(); if (B.err) { console.log('❌ ⑧ 빠른 시험 자리를 못 꾸림: ' + B.err + ' — 급하면 RN_QUICK_SKIP=1(까닭을 커밋 글에)'); process.exit(2); }
  if (!B.xl) warn('xlsx.full.min.js를 못 찾음 — 예스24 등록 시험(tY24REG·tY24AREG)이 거짓으로 실패할 수 있음(RN_XLSX=<파일>로 알려 줄 것)');
  const t0 = Date.now(); const R = await runAll(B, [...quick, ...extra], QJ.timeout || 240, Math.max(1, +(process.env.RN_QUICK_PAR || QJ.parallel || 3)));
  const sec = Math.round((Date.now() - t0) / 1000);
  const blocked = [], known = [], flaky = [], passed = [];
  for (const t of quick) { const r = R[t]; if (r.ok) { passed.push(t); if (r.flaky) flaky.push(t); const e = K.find((x) => x.test === t); if (e) warn(`KNOWN_FAIL ${t}가 이제 통과 — 장부에서 그 줄을 빼 주세요(담당 ${e.owner})`); continue; }
    const e = K.find((x) => x.test === t); const its = r.items.length ? r.items : ['(항목 밖 실패: ' + (r.why || '요약 줄 ❌') + ')'];
    const cover = e && (!e.items || !e.items.length || (r.items.length && r.items.every((it) => e.items.some((s) => it.includes(s)))));
    if (e && cover && e.until >= today) known.push(`${t}(까닭: ${e.why} · 담당 ${e.owner} · 기한 ${e.until})`);
    else if (e && cover) blocked.push(`${t} — 알려진 실패의 기한(${e.until})이 지남: 고치거나 리드가 다시 판단해 기한을 고칠 것 · ${its.slice(0, 2).join(' / ')}`);
    else blocked.push(`${t} — ${its.slice(0, 3).join(' / ')}${its.length > 3 ? ` 외 ${its.length - 3}` : ''}`); }
  say(`🧪 ⑧ 빠른 시험 ${quick.length}개 · ${sec}초 — 통과 ${passed.length} · 알려진 실패 ${known.length} · 막음 ${blocked.length}`);
  known.forEach((x) => warn('알려진 실패(장부에 있음): ' + x)); flaky.forEach((t) => warn(`흔들림: ${t}가 첫 번엔 실패, 다시 돌려 통과 — ${(R[t].flaky.items[0] || R[t].flaky.why || '').slice(0, 120)}`));
  for (const b of blocked) no('새 실패(막음): ' + b);
  if (blocked.length) say('   → 이번 고침 탓이면 고치고, 기능 규칙을 일부러 바꾼 것이면 같은 커밋에서 시험 기대값을 고치고, 원래부터 실패라면 \'main에서도 실패\'로 넘기지 말고 src/tests/KNOWN_FAIL.json에 {test·items·why·owner·until(14일 안)} 한 줄 + 리드에게 알림');
  for (const t of extra) { const r = R[t]; say(r.ok ? `   ✓ 딸린 시험 ${t} 통과` : `   ⚠ 딸린 시험 ${t} 실패 — ${(r.items[0] || r.why || '').slice(0, 140)} (이번 바뀜에 딸린 시험 · 기대값이 바뀐 것이면 같은 커밋에서 고칠 것 · 원래 실패면 KNOWN_FAIL에)`); }
  if (has('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(R, null, 1));
  if (has('--keep')) say('시험 자리 남김: ' + B.Q); else fs.rmSync(B.Q, { recursive: true, force: true });
  process.exit(bad);
})().catch((e) => { console.log('❌ 시험 문지기 오류: ' + (e && e.stack || e)); process.exit(2); });
