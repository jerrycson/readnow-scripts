// Firestore 규칙 에뮬레이터 시험 — firestore/firestore.rules(직원 목록 자리를 시험 계정으로 채워) · 시험 자료는 모두 지어낸 값
// 돌리기(도구는 저장소 밖 임시 폴더에 설치 — README는 firestore/README 대신 이 머리말):
//   T=$(mktemp -d) && (cd $T && npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10)
//   RULES_NODE_MODULES=$T/node_modules node firestore/rules.test.js   (에뮬레이터를 스스로 띄움 · Java 11 이상)
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
if (process.env.RULES_NODE_MODULES) module.paths.unshift(process.env.RULES_NODE_MODULES);
const STAFF = ['staff1@test.example', 'staff2@test.example'];
const SRC = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
const fill = (s) => s.replace(/'__STAFF_EMAILS__'/, STAFF.map((e) => `'${e}'`).join(',\n          '));
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const allowed = async (p) => { try { await p; return true; } catch (e) { if (/PERMISSION_DENIED|false for|permission/i.test(String(e && (e.code || e.message)))) return false; throw e; } };

async function main() {
  ok(SRC.includes("'__STAFF_EMAILS__'") && !/@(?!test\.example)[a-z0-9.-]+\.[a-z]{2,}/i.test(SRC.replace(/\/\/.*$/gm, '')), '공개 원본에 실제 계정 전자우편 없음(자리 표시만)');
  const { initializeTestEnvironment, assertSucceeds } = require('@firebase/rules-unit-testing');
  const firebase = require('firebase/compat/app'); require('firebase/compat/firestore');
  const port = +(process.env.FIRESTORE_EMULATOR_PORT || 8089);
  const env = await initializeTestEnvironment({ projectId: 'demo-readnow-rules', firestore: { rules: fill(SRC), host: '127.0.0.1', port } });
  const FV = firebase.firestore.FieldValue;
  const as = (email) => env.authenticatedContext('u_' + email.split('@')[0], { email }).firestore();
  const S = as(STAFF[0]); const S2 = as(STAFF[1]); const X = as('stranger@test.example'); const N = env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async (c) => { const d = c.firestore(); await d.doc('prd_listings/aladin_1').set({ price: 1000 }); await d.doc('prd_locks/aladin_9').set({ on: true, why: 'x', by: STAFF[0], at: '2026-11-17T00:00:00Z', lid: '9', hist: [{ act: 'lock', at: '2026-11-17T00:00:00Z' }, { act: 'why', at: '2026-11-17T00:01:00Z' }] }); });

  { let v0; await env.withSecurityRulesDisabled(async (c) => { v0 = (await c.firestore().doc('prd_locks/aladin_9').get()).data(); }); ok(v0 && v0.hist.length === 2, '시험 자료 준비(잠금 문서 기록 2)'); }
  console.log('① 예전 그대로 — 직원은 모든 칸 읽기·쓰기 · 다른 사람은 아무것도 못 함');
  ok(await allowed(S.doc('prd_listings/aladin_1').get()), '직원 읽기(prd_listings)');
  ok(await allowed(S.doc('prd_listings/aladin_1').set({ price: 2000 }, { merge: true })), '직원 쓰기(prd_listings)');
  ok(await allowed(S2.doc('prd_system/wguard').set({ allowUntil: '2026-11-18T00:30:00Z' }, { merge: true })), '둘째 직원 쓰기(prd_system/wguard — 쓰기 지킴이 풀기)');
  ok(await allowed(S.doc('prd_price_batches_trash/g1~20261118000000000').set({ name: 'G', _trash: { kind: 'group' } })), '직원 쓰기(가격 그룹 휴지통)');
  ok(await allowed(S.doc('prd_listings/aladin_1').delete()), '직원 지우기(다른 칸은 예전처럼 됨)');
  ok(await allowed(S.doc('a/b/c/d').set({ z: 1 })), '직원 하위 칸 쓰기');
  ok(await allowed(S.collectionGroup('c').get()), '직원 칸 묶음 읽기(collectionGroup)');
  ok(!(await allowed(X.doc('prd_listings/aladin_1').get())), '목록 밖 계정 읽기 막힘');
  ok(!(await allowed(X.doc('prd_listings/aladin_2').set({ a: 1 }))), '목록 밖 계정 쓰기 막힘');
  ok(!(await allowed(N.doc('prd_system/wguard').get())), '로그인 안 한 읽기 막힘');
  ok(!(await allowed(N.doc('prd_system/wguard').set({ allowUntil: '2099-01-01T00:00:00Z' }))), '로그인 안 한 쓰기 막힘(지킴이 몰래 풀기 못 함)');

  console.log('② 🔒 상품 잠금(prd_locks)');
  const ev = (act, at) => ({ on: act !== 'unlock', act, why: '', by: STAFF[0], at, dev: null });
  const lockDoc = (at) => ({ on: true, why: '값 지킴', grp: '', by: STAFF[0], at, lid: '12', usedCode: '34', sku: 'A1', title: '책', img: null, plat: '알라딘', hist: FV.arrayUnion(ev('lock', at)), lockedAt: at, vals: { price: 9000, qty: 1, state: '판매중', grade: '상', code: 'A1' } });
  ok(await allowed(S.doc('prd_locks/aladin_12').get()), '직원 잠금 읽기');
  ok(!(await allowed(X.doc('prd_locks/aladin_12').get())), '목록 밖 계정 잠금 읽기 막힘');
  ok(await allowed(S.doc('prd_locks/aladin_12').set(lockDoc('2026-11-18T01:00:00Z'), { merge: true })), '잠그기(웹앱 plkSet과 같은 칸 · merge)');
  ok(await allowed(S.doc('prd_locks/aladin_12').set({ why: '까닭 고침', hist: FV.arrayUnion({ ...ev('why', '2026-11-18T01:02:00Z') }) }, { merge: true })), '까닭만 고치기(why + 기록 하나 더함)');
  ok(await allowed(S.doc('prd_locks/aladin_12').set({ on: false, why: '', grp: '', by: STAFF[0], at: '2026-11-18T01:05:00Z', lid: '12', usedCode: '34', sku: 'A1', title: '책', img: null, plat: '알라딘', hist: FV.arrayUnion(ev('unlock', '2026-11-18T01:05:00Z')), unlockedAt: '2026-11-18T01:05:00Z' }, { merge: true })), '풀기(on=false · 기록 더함)');
  ok(await allowed(S.doc('prd_locks/aladin_12').set({ on: true, mode: 'cond', cond: { floor: 8000, gapUp: 10, until: null, memo: '' }, out: true, from: { k: 'batch', id: 'g1', nm: '그룹' }, by: STAFF[0], at: '2026-11-18T01:06:00Z', hist: FV.arrayUnion(ev('cond', '2026-11-18T01:06:00Z')) }, { merge: true })), '(lockcond1) 조건 잠금으로 바꾸기(mode·cond·from·out)');
  ok(await allowed(S.doc('prd_locks/aladin_12').set({ hit: { n: 1, at: '2026-11-18T01:07:00Z', p: null, want: 7000, why: '하한가' }, day: { d: '2026-11-18', n: 1, amt: 500 } }, { merge: true })), '(lockcond1) 조건이 막은 횟수·오늘 바꾼 횟수 적기(hit·day · 기록 칸 없이 merge)');
  ok(!(await allowed(S.doc('prd_locks/aladin_12').set({ mode: 'cond', price: 1 }, { merge: true }))), '(lockcond1) 새 칸이 있어도 정해진 칸 밖(price)은 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_12').delete())), '잠금 문서 지우기 막힘(직원도)');
  ok(!(await allowed(S.doc('prd_locks/aladin_9').set({ on: false, hist: [] }, { merge: true }))), '기록(hist) 비우기 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_9').update({ hist: FV.arrayRemove({ act: 'lock', at: '2026-11-17T00:00:00Z' }) }))), '기록 하나 빼기 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_9').update({ hist: FV.delete() }))), '기록 칸 지우기 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_9').set({ on: false, by: STAFF[0], at: '2026-11-18T02:00:00Z' }))), '통째로 덮어쓰기(merge 없이 기록이 사라짐) 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_9').set({ price: 1 }, { merge: true }))), '정해진 칸 밖(price) 쓰기 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_13').set({ on: true, hist: 'x' }))), '기록이 목록이 아니면 막힘');
  ok(!(await allowed(X.doc('prd_locks/aladin_14').set(lockDoc('2026-11-18T03:00:00Z'), { merge: true }))), '목록 밖 계정 잠그기 막힘');
  ok(!(await allowed(S.doc('prd_locks/aladin_9/sub/x').set({ a: 1 }))), '잠금 아래 하위 칸 쓰기 막힘(뒷길 없음)');
  let left; await env.withSecurityRulesDisabled(async (c) => { left = (await c.firestore().doc('prd_locks/aladin_9').get()).data(); }); /* withSecurityRulesDisabled는 값을 돌려주지 않음 */
  ok(left && left.hist.length === 2 && left.on === true, '막힌 시도 뒤 잠금 문서 그대로(기록 2 · 잠김)');
  console.log('③ 🎛 관제소 날마다 요약(ctl_kpi_m·ctl_kpi_days · kpib1)');
  await env.withSecurityRulesDisabled(async (c) => { const d = c.firestore(); await d.doc('ctl_kpi_m/2026-11').set({ ym: '2026-11', ver: 1, d: { 19: { T: { n: 3, top: 1 } } } }); await d.doc('ctl_kpi_days/2026-11-19').set({ day: '2026-11-19', ver: 1, lowS: '1,2' }); });
  for (const p of ['ctl_kpi_m/2026-11', 'ctl_kpi_days/2026-11-19']) {
    ok(await allowed(S.doc(p).get()), `직원 읽기 ${p}`);
    ok(!(await allowed(X.doc(p).get())), `목록 밖 계정 읽기 막힘 ${p}`);
    ok(!(await allowed(S.doc(p).set({ ver: 9 }, { merge: true }))), `직원 고치기 막힘 ${p}`);
    ok(!(await allowed(S.doc(p).delete())), `직원 지우기 막힘 ${p}`);
    ok(!(await allowed(S.doc(p + '/sub/x').set({ a: 1 }))), `요약 아래 하위 칸 쓰기 막힘 ${p}`);
  }
  ok(!(await allowed(S.doc('ctl_kpi_days/2026-11-20').set({ day: '2026-11-20' }))), '직원 새 요약 만들기 막힘');
  ok(!(await allowed(S.collection('ctl_kpi_m').doc('2026-12').set({ ym: '2026-12' }))), '직원 새 달 문서 만들기 막힘');
  let kd; await env.withSecurityRulesDisabled(async (c) => { kd = (await c.firestore().doc('ctl_kpi_m/2026-11').get()).data(); });
  ok(kd && kd.ver === 1 && kd.d && kd.d['19'], '막힌 시도 뒤 요약 문서 그대로');
  ok(await allowed(S.doc('prd_listings/aladin_1').set({ price: 1200 }, { merge: true })), '다른 칸(prd_listings) 직원 쓰기는 예전 그대로 됨');
  await env.cleanup();
}

/* 에뮬레이터 띄우기(이미 떠 있으면 FIRESTORE_EMULATOR_PORT로 붙음) */
(async () => {
  if (process.env.FIRESTORE_EMULATOR_PORT) { await main(); } else {
    const bin = require.resolve('firebase-tools/lib/bin/firebase.js'); const port = 8089; const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'rnrules-'));
    fs.writeFileSync(path.join(dir, 'firebase.json'), JSON.stringify({ emulators: { firestore: { host: '127.0.0.1', port }, ui: { enabled: false } } }));
    const p = spawn(process.execPath, [bin, 'emulators:start', '--only', 'firestore', '--project', 'demo-readnow-rules'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] }); let out = '';
    await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('에뮬레이터가 3분 안에 안 뜸\n' + out.slice(-1500))), 180e3); const on = (b) => { out += b; if (/All emulators ready|Emulator started at|is running on/i.test(out) && /firestore/i.test(out)) { clearTimeout(t); res(); } }; p.stdout.on('data', on); p.stderr.on('data', on); p.on('exit', (c) => { clearTimeout(t); rej(new Error('에뮬레이터 꺼짐 ' + c + '\n' + out.slice(-1500))); }); });
    process.env.FIRESTORE_EMULATOR_PORT = String(port);
    try { await main(); } finally { p.kill('SIGINT'); await new Promise((r) => setTimeout(r, 1500)); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
  }
  console.log(bad ? `❌ 규칙 시험 ${bad}개 실패` : '✅ 규칙 시험 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && (e.stack || e.message)); process.exit(1); });
