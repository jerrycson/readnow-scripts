#!/usr/bin/env node
/* tWORKLOCKQ1117 — 순서표 기다리는 줄(lockq1 · 11/17)
 * 까닭: 부탁(ask)이 한 칸뿐이고 wait가 10분마다만 남겨서, 먼저 기다린 지피티 Actions가 칸이 비는 순간 늦게 온 일꾼에게 몇 번이고 밀렸음.
 * 시험: 임시 저장소(가짜 origin)에 work-lock 가지를 만들고 새 대본(src/tools/worklock.sh)과 옛 대본(ship/worklock_old_1117.sh = main 5a468a8b 판 · 지금 다른 일꾼·지피티 Actions가 쓰는 판)을 함께 돌림.
 *  ① 빈 표에서 먼저 기다린 쪽이 잡음 · 늦게 온 쪽은 YIELD · 잡은 뒤 줄 다음 칸이 맨 앞
 *  ② 옛 한 칸 ask 객체를 줄 맨 앞으로 받아들임 · 옛 대본이 그 차례로 잡음
 *  ③ 30분 넘게 새로 하지 않은 칸은 무시
 *  ④ 옛 대본은 새 줄 맨 앞(ask 비춤)을 보고 비키고 · 덮지 않고 · 지우지 못함
 *  ⑤ 새 대본은 옛 대본의 ask를 망가뜨리지 않음 · 옛 대본이 그 ask를 지우면 줄에서도 빠짐
 *  ⑥ step(wait의 1분 한 번)은 내 칸의 at만 새로 하고 first는 그대로 · clearask는 남의 칸을 못 뺌 · status 출력
 *  ⑦ who=gpt·RN_LOCK_PRIO=1은 저절로 먼저 섬(wake1 · 정범님 I-1117-1827-20) — ①② 셋째 칸은 그래서 friend로 씀
 * node · git만 씀 · 몇십 초 */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const find = (...c) => c.find((f) => fs.existsSync(f));
const NEW = find(path.join(__dirname, '..', 'tools', 'worklock.sh'), path.join(__dirname, '..', '..', 'src', 'tools', 'worklock.sh'), process.env.RN_GIT_REPO && path.join(process.env.RN_GIT_REPO, 'src', 'tools', 'worklock.sh'));
const OLD = find(path.join(__dirname, 'ship', 'worklock_old_1117.sh'));
let bad = 0; const ok = (c, m, x) => { if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ❌ ' + m + (x ? ' — ' + String(x).slice(0, 300) : '')); } };
if (!NEW || !OLD) { console.log('❌ 대본을 못 찾음 ' + JSON.stringify({ NEW, OLD })); process.exit(1); }
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-wlq-'));
const env0 = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_CONFIG_NOSYSTEM: '1', HOME: T };
const sh = (c, o = {}) => cp.execSync(c, { cwd: o.cwd || T, env: { ...env0, ...(o.env || {}) }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: '/bin/bash' });
sh('git init -q --bare origin.git && git init -q w && cd w && git remote add origin ../origin.git && git commit -q --allow-empty -m 시작 && git push -q origin HEAD:refs/heads/main');
const W = path.join(T, 'w');
fs.mkdirSync(path.join(W, 'src', 'tools'), { recursive: true }); fs.copyFileSync(NEW, path.join(W, 'src', 'tools', 'worklock.sh')); fs.copyFileSync(OLD, path.join(W, 'old.sh'));
const run = (script, host, ...args) => { const r = cp.spawnSync('bash', [script, ...args], { cwd: W, env: { ...env0, RN_LOCK_HOST: host }, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
const N = (host, ...a) => run('src/tools/worklock.sh', host, ...a); const O = (host, ...a) => run('old.sh', host, ...a);
const iso = (secAgo) => new Date(Math.floor(Date.now() / 1000 - secAgo) * 1000).toISOString().replace('.000', '');
const get = () => JSON.parse(N('x', 'get').out || '{}');
const setLock = (j) => { const f = path.join(T, 'L.json'); fs.writeFileSync(f, JSON.stringify(j, null, 1) + '\n'); sh(`git fetch -q origin '+refs/heads/work-lock:refs/remotes/origin/work-lock' 2>/dev/null || true; B=$(git hash-object -w ${f}); TR=$(printf '100644 blob %s\\tLOCK.json\\n' $B | git mktree); P=$(git rev-parse -q --verify origin/work-lock || true); C=$(git commit-tree $TR \${P:+-p $P} -m 시험); git push -q -f origin $C:refs/heads/work-lock`, { cwd: W }); };
const qs = (j) => (j.queue || []).map((e) => e.who + '@' + e.host);
const wait1 = () => cp.execSync('sleep 1.1');

console.log('① 빈 표에서 먼저 기다린 쪽이 잡음');
let r = N('vm-a', 'ask', 'lead', '판 A'); ok(r.code === 0 && /줄 1번째/.test(r.out), 'A가 줄에 섬(1번째)', r.out);
wait1(); r = N('vm-b', 'ask', 'lead', '판 B'); ok(r.code === 0 && /줄 2번째/.test(r.out), 'B가 뒤에 섬(2번째)', r.out);
wait1(); r = N('actions-1', 'ask', 'friend', 'PR 45'); ok(r.code === 0 && /줄 3번째/.test(r.out), '친구 방이 3번째', r.out);
let j = get(); ok(JSON.stringify(qs(j)) === JSON.stringify(['lead@vm-a', 'lead@vm-b', 'friend@actions-1']), '줄 차례 A·B·친구 방', qs(j));
ok(j.ask && j.ask.host === 'vm-a', 'ask 칸은 줄 맨 앞(A)을 옛 꼴로 비춤', JSON.stringify(j.ask));
r = N('vm-b', 'take', 'lead', '판 B'); ok(r.code === 3 && /YIELD|줄 맨 앞/.test(r.out), '늦게 온 B는 비킴(YIELD · 3)', r.out);
r = N('vm-z', 'take', 'lead', '끼어들기'); ok(r.code === 3, '줄에 없는 쪽도 비킴', r.out);
r = N('vm-a', 'take', 'lead', '판 A'); ok(r.code === 0, '먼저 기다린 A가 잡음', r.out);
j = get(); ok(j.holder === 'lead' && j.host === 'vm-a' && JSON.stringify(qs(j)) === JSON.stringify(['lead@vm-b', 'friend@actions-1']) && j.ask.host === 'vm-b', '잡은 뒤 A 칸은 빠지고 맨 앞은 B', JSON.stringify(j));
r = N('vm-b', 'take', 'lead', '판 B'); ok(r.code === 3 && /다른 쪽이 잡고/.test(r.out), 'A가 잡은 동안 B는 BUSY', r.out);
r = N('vm-a', 'release', 'lead', '한 일 A'); ok(r.code === 0, 'A 놓음', r.out);
r = N('actions-1', 'take', 'friend', 'PR 45'); ok(r.code === 3, '놓인 순간 친구 방(3번째)는 B를 앞지르지 못함', r.out);
r = N('vm-b', 'step', 'lead', '판 B'); ok(r.code === 0, 'B가 step으로 잡음', r.out);
r = N('vm-b', 'release', 'lead', '한 일 B'); r = N('vm-c', 'step', 'lead', '새로 옴'); ok(r.code === 3 && /줄 2번째/.test(r.out), '새로 온 C는 step으로 줄 2번째(친구 방 뒤)', r.out);
r = N('actions-1', 'step', 'friend', 'PR 45'); ok(r.code === 0, '먼저 기다린 친구 방이 잡음', r.out);
N('actions-1', 'release', 'friend', '한 일'); N('vm-c', 'clearask', 'lead');

console.log('② 옛 한 칸 ask 객체를 줄 맨 앞으로');
setLock({ holder: 'lead', host: 'vm-k', what: '다른 판', since: iso(300), beat: iso(60), ask: { who: 'lead', host: 'vm-old', why: '옛 대본 부탁', at: iso(120) }, last: null });
r = N('actions-2', 'ask', 'friend', 'PR 45'); ok(r.code === 0 && /줄 2번째/.test(r.out), '새로 선 친구 방은 옛 ask 뒤(2번째)', r.out);
j = get(); ok(j.queue && j.queue[0].host === 'vm-old' && j.queue[0].first === j.queue[0].at && j.ask.host === 'vm-old', '옛 ask가 줄 맨 앞 칸(first = 옛 at)', JSON.stringify(j.queue));
r = N('x', 'status'); ok(r.code === 0 && /1\. lead \(vm-old\).*옛 대본.*다음 차례/.test(r.out) && /2\. friend \(actions-2\)/.test(r.out), 'status에 줄 차례가 보임', r.out);
setLock({ ...get(), holder: null, host: null, what: null, since: null, beat: null });
r = N('actions-2', 'take', 'friend', 'PR 45'); ok(r.code === 3, '표가 비어도 친구 방은 옛 ask 차례를 지킴', r.out);
r = O('vm-old', 'take', 'lead', '옛 대본 판'); ok(r.code === 0, '옛 대본이 자기 ask 차례로 잡음', r.out);
j = get(); ok(j.holder === 'lead' && j.host === 'vm-old' && !j.ask && Array.isArray(j.queue), '옛 대본이 쓴 뒤에도 queue가 남음', JSON.stringify(j));
r = N('actions-2', 'step', 'friend', 'PR 45'); j = get(); ok(r.code === 3 && JSON.stringify(qs(j)) === JSON.stringify(['friend@actions-2']) && j.ask.host === 'actions-2', '옛 쪽이 잡은 뒤 줄은 친구 방만 · 맨 앞 비춤', JSON.stringify(j));
r = O('vm-old', 'release', 'lead', '옛 대본 한 일'); ok(r.code === 0, '옛 대본 놓음', r.out);
r = N('actions-2', 'take', 'friend', 'PR 45'); ok(r.code === 0, '그다음 친구 방이 잡음', r.out); N('actions-2', 'release', 'friend', '한 일');

console.log('③ 30분 넘게 새로 하지 않은 칸은 무시');
setLock({ holder: null, queue: [{ who: 'gpt', host: 'dead', why: '죽음', first: iso(7200), at: iso(1860) }], ask: { who: 'gpt', host: 'dead', why: '죽음', at: iso(1860), first: iso(7200) } });
r = N('vm-e', 'take', 'lead', '판 E'); ok(r.code === 0, '31분 된 칸·ask는 무시하고 잡음', r.out);
j = get(); ok(!(j.queue || []).length && !j.ask, '죽은 칸은 줄에서 빠짐', JSON.stringify(j));
setLock({ holder: 'lead', host: 'vm-dead', since: iso(4000), beat: iso(1900), queue: [{ who: 'lead', host: 'vm-f', why: 'F', first: iso(600), at: iso(30) }], ask: null });
r = N('vm-g', 'take', 'lead', '판 G'); ok(r.code === 3, '잡은 쪽이 죽었어도 살아 있는 줄 맨 앞(F)이 먼저', r.out);
r = N('vm-f', 'take', 'lead', '판 F'); ok(r.code === 0, 'F가 죽은 표를 넘겨받음', r.out); N('vm-f', 'release', 'lead', 'F');

console.log('④ 옛 대본은 새 줄 맨 앞을 존중');
r = N('vm-n', 'ask', 'lead', '새 대본 N');
r = O('vm-o', 'take', 'lead', '옛 대본 O'); ok(r.code === 3, '옛 대본 take는 비킴(YIELD)', r.out);
r = O('vm-o', 'ask', 'lead', '옛 대본 O'); j = get(); ok(r.code === 6 && j.ask.host === 'vm-n', '옛 대본 ask는 새 맨 앞을 덮지 않음(6)', r.out);
r = O('vm-o', 'clearask', 'lead'); j = get(); ok(j.ask && j.ask.host === 'vm-n', '옛 대본 clearask는 남의 차례를 못 지움', r.out);
r = N('vm-n', 'take', 'lead', 'N'); ok(r.code === 0, 'N이 잡음', r.out); N('vm-n', 'release', 'lead', 'N');

console.log('⑤ 새 대본은 옛 대본의 ask를 망가뜨리지 않음');
r = O('vm-h', 'ask', 'lead', '옛 대본 H'); ok(r.code === 0, '빈 칸에 옛 대본 ask', r.out);
wait1(); r = N('vm-i', 'ask', 'lead', '새 대본 I'); j = get(); ok(j.ask.host === 'vm-h' && j.ask.why === '옛 대본 H' && JSON.stringify(qs(j)) === JSON.stringify(['lead@vm-h', 'lead@vm-i']), '새 대본이 써도 옛 ask(H)가 맨 앞 그대로', JSON.stringify(j));
r = N('vm-i', 'take', 'lead', 'I'); ok(r.code === 3, 'I는 H 차례를 지킴', r.out);
r = O('vm-h', 'clearask', 'lead'); ok(r.code === 0, '옛 대본 H가 그만두며 ask를 지움', r.out);
r = N('vm-i', 'take', 'lead', 'I'); j = get(); ok(r.code === 0 && !(j.queue || []).length, '옛 H 칸도 줄에서 빠지고 I가 잡음', r.out + JSON.stringify(j)); N('vm-i', 'release', 'lead', 'I');

console.log('⑥ step은 at만 새로 · clearask는 내 칸만 · status');
const f0 = iso(900);
setLock({ holder: 'lead', host: 'vm-k', since: iso(100), beat: iso(10), queue: [{ who: 'gpt', host: 'actions-3', why: 'PR', first: f0, at: iso(600) }, { who: 'lead', host: 'vm-j', why: 'J', first: iso(300), at: iso(200) }], ask: { who: 'gpt', host: 'actions-3', why: 'PR', at: iso(600), first: f0 } });
r = N('actions-3', 'step', 'gpt', 'PR'); j = get(); const g = j.queue.find((e) => e.host === 'actions-3');
ok(r.code === 3 && /줄 1번째/.test(r.out) && g.first === f0 && Date.now() / 1000 - Date.parse(g.at) / 1000 < 30 && j.ask.at === g.at, 'step: first 그대로 · at 새로 · ask 비춤도 새로', JSON.stringify(j));
r = N('vm-j', 'clearask', 'gpt'); j = get(); ok(r.code === 0 && j.queue.length === 2, '이름이 다르면 남의 칸을 못 뺌', JSON.stringify(j.queue));
r = N('vm-x', 'clearask', 'lead'); j = get(); ok(r.code === 0 && j.queue.length === 2, '세션(host)이 다르면 같은 이름표라도 남의 칸을 못 뺌', JSON.stringify(j.queue));
r = N('vm-j', 'clearask', 'lead'); j = get(); ok(r.code === 0 && JSON.stringify(qs(j)) === JSON.stringify(['gpt@actions-3']), '내 칸만 뺌', JSON.stringify(j.queue));
r = N('vm-q', 'release', 'lead', '남의 표'); ok(r.code === 4, '남의 표는 놓지 못함(4)', r.out);
N('actions-3', 'clearask', 'gpt'); setLock({ ...get(), holder: null, host: null, beat: null, since: null });
r = N('vm-w', 'wait', 'lead', '판 W', '1'); j = get(); ok(r.code === 0 && /✅ 잡음/.test(r.out) && j.holder === 'lead' && j.host === 'vm-w' && !j.ask, 'wait: 표가 비고 줄이 없으면 첫 번에 잡음', r.out);
r = N('x', 'status'); ok(/🔒 잡은 쪽: lead \(vm-w\)/.test(r.out) && /기다리는 줄 없음/.test(r.out), 'status: 잡은 쪽·빈 줄', r.out);
ok(j.what === '판 W', 'wait로 잡으면 하는 일은 그대로(앞말 없음)', j.what); N('vm-w', 'release', 'lead', '한 일 W');
r = N('x', 'status'); ok(/🔓 비어 있음/.test(r.out) && /🕘 마지막: lead · 한 일 W/.test(r.out), 'status: 마지막 한 일', r.out);

console.log('⑦ 지피티(who=gpt)·RN_LOCK_PRIO=1은 저절로 먼저 섬(정범님 I-1117-1827-20)');
const NP = (host, ...a) => { const r = cp.spawnSync('bash', ['src/tools/worklock.sh', ...a], { cwd: W, env: { ...env0, RN_LOCK_HOST: host, RN_LOCK_PRIO: '1' }, encoding: 'utf8' }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
setLock({ holder: null, host: null, queue: [], ask: null, last: null });
r = N('vm-a', 'ask', 'lead', '판 A'); wait1(); r = N('vm-b', 'ask', 'lead', '판 B'); wait1();
r = N('actions-9', 'ask', 'gpt', 'PR 50'); ok(r.code === 0 && /줄 1번째/.test(r.out), '늦게 온 지피티가 줄 1번째', r.out);
j = get(); ok(j.ask && j.ask.host === 'actions-9' && j.ask.prio === 1, 'ask 칸은 지피티를 비춤(옛 대본도 비킴)', JSON.stringify(j.ask));
r = N('vm-a', 'take', 'lead', '판 A'); ok(r.code === 3, '먼저 기다린 A도 지피티에게 비킴', r.out);
r = O('vm-o', 'take', 'lead', '옛 대본'); ok(r.code === 3, '옛 대본도 지피티에게 비킴', r.out);
r = N('x', 'status'); ok(/1\. gpt \(actions-9\).*먼저 섬/.test(r.out) && /2\. lead \(vm-a\)/.test(r.out), 'status에 「먼저 섬」과 차례', r.out);
r = N('actions-9', 'take', 'gpt', 'PR 50'); ok(r.code === 0, '지피티가 잡음', r.out); N('actions-9', 'release', 'gpt', '한 일');
wait1(); r = NP('vm-p', 'ask', 'lead', '급한 판'); ok(r.code === 0 && /줄 1번째/.test(r.out), 'RN_LOCK_PRIO=1이면 줄 1번째', r.out);
r = N('vm-p', 'step', 'lead', '급한 판'); j = get(); const pe = (j.queue || []).find((e) => e.host === 'vm-p');
ok(r.code === 3 && pe && !pe.prio, 'RN_LOCK_PRIO 없이 다시 서면 먼저 섬이 풀리고 먼저 기다린 차례로 돌아감', JSON.stringify(j)); N('vm-p', 'clearask', 'lead');
r = N('vm-a', 'take', 'lead', '판 A'); ok(r.code === 0, '그다음 먼저 기다린 A가 잡음', r.out); N('vm-a', 'release', 'lead', 'A'); N('vm-b', 'clearask', 'lead');

try { fs.rmSync(T, { recursive: true, force: true }); } catch (e) {}
if (bad) { console.log(`❌ 순서표 줄 시험 ${bad}개 실패`); process.exit(1); }
console.log('✅ 순서표 줄 시험 모두 통과');
