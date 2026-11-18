// tFBOPS1118 — (fbops1 11/18 · 정범 노트 [2]·[9]) 읽기만 진단 fssize=1(Firestore DB별 저장 크기) · iam=1(배포 계정 gh-deployer 역할) · 브라우저 필요 없음
//  ① 바꾸는 요청 없음(iam은 getIamPolicy POST 하나뿐 · setIamPolicy·PATCH·DELETE 없음) ② 사람 계정은 가림 ③ 규칙 관리 역할 알아봄 ④ 크기 지표는 DB별로 ⑤ 오류는 err ⑥ 진단에 이어짐
// 실행: node src/tests/tFBOPS1118.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const i = CL.indexOf("const IAM_GH = "); const k = CL.indexOf('async function fsSizeRead(', i); const j = CL.indexOf('\n', k);
(async () => {
  ok(i > 0 && k > i && j > k, 'iamRead·fsSizeRead 덩어리가 있음');
  const blk = CL.slice(i, j);
  ok(!/setIamPolicy|method\s*:\s*'(PATCH|DELETE|PUT)'/.test(blk), '바꾸는 요청 없음');
  ok((blk.match(/method\s*:\s*'POST'/g) || []).length === 1 && /:getIamPolicy'/.test(blk), 'POST는 getIamPolicy 하나뿐');
  const mk = new Function('gToken', 'fetch', blk + '\nreturn { iamRead, fsSizeRead };')(async () => 'never', async () => { throw new Error('never'); });
  const calls = []; const fake = (h) => async (u, o) => { calls.push({ u, o }); const [st, body] = h(u, o); return { ok: st >= 200 && st < 300, status: st, json: async () => body }; };
  const GH = 'serviceAccount:gh-deployer@readnow-3a385.iam.gserviceaccount.com';
  const pol = { version: 3, bindings: [
    { role: 'roles/firebaserules.admin', members: [GH, 'user:someone@test.example'] },
    { role: 'roles/firebasehosting.admin', members: [GH] },
    { role: 'roles/owner', members: ['user:boss@test.example'] },
    { role: 'roles/editor', members: ['serviceAccount:123-compute@developer.gserviceaccount.com'] },
    { role: 'roles/viewer', members: ['user:v@test.example'] } ] };
  let r = await mk.iamRead(async () => 'tk', fake(() => [200, pol]));
  ok(calls.length === 1 && calls[0].u === 'https://cloudresourcemanager.googleapis.com/v1/projects/readnow-3a385:getIamPolicy' && calls[0].o.method === 'POST', 'getIamPolicy 한 번', calls[0] && calls[0].u);
  ok(JSON.parse(calls[0].o.body).options.requestedPolicyVersion === 3 && calls[0].o.headers.Authorization === 'Bearer tk', '정책 판 3 · 클라우드 계정 토큰');
  ok(JSON.stringify(r.gh) === JSON.stringify(['roles/firebasehosting.admin', 'roles/firebaserules.admin']) && r.rulesAdmin === true, 'gh-deployer 역할·규칙 관리 알아봄', r);
  ok(r.acct === 'gh-deployer@readnow-3a385.iam.gserviceaccount.com' && r.n === 5, '계정·묶음 수', r);
  ok(!JSON.stringify(r).includes('test.example') && r.watch['roles/owner'][0] === '사람 계정', '사람 계정 가림', r.watch);
  ok(!r.watch['roles/viewer'] && r.watch['roles/editor'][0].startsWith('serviceAccount:'), '지켜볼 역할만 · 서비스 계정은 그대로');
  r = await mk.iamRead(async () => 'tk', fake(() => [200, { bindings: [{ role: 'roles/firebasehosting.admin', members: [GH] }] }])); ok(r.rulesAdmin === false, '규칙 관리 없으면 false', r);
  r = await mk.iamRead(async () => 'tk', fake(() => [403, { error: { code: 403 } }])); ok(/^HTTP 403/.test(r.err), '권한 없음은 err', r);
  r = await mk.iamRead(async () => { throw new Error('토큰 못 받음 500'); }, fake(() => [200, {}])); ok(/토큰 못 받음/.test(r.err), '예외도 err', r);
  calls.length = 0;
  const NOW = Date.parse('2026-11-18T04:00:00Z');
  r = await mk.fsSizeRead(async () => 'tk', fake((u) => {
    if (u.includes('/metricDescriptors?')) return [200, { metricDescriptors: [{ type: 'firestore.googleapis.com/storage/data_and_index_storage_bytes' }, { type: 'firestore.googleapis.com/document/read_count' }, { type: 'firestore.googleapis.com/api/request_sizes' }] }];
    return [200, { timeSeries: [
      { resource: { labels: { database_id: '(default)' } }, metric: { labels: {} }, points: [{ value: { int64Value: '12000000000' }, interval: { endTime: '2026-11-18T00:00:00Z' } }, { value: { int64Value: '1' } }] },
      { resource: { labels: { database_id: 'readnow-research' } }, metric: { labels: {} }, points: [{ value: { doubleValue: 5e8 } }] } ] }];
  }), NOW);
  ok(JSON.stringify(r.types) === JSON.stringify(['firestore.googleapis.com/storage/data_and_index_storage_bytes']), '크기 지표만 고름(요청·읽기 수 뺌)', r.types);
  ok(calls.length === 2 && calls.every((c) => !c.o.method), '읽기(GET)만 두 번', calls.length);
  ok(decodeURIComponent(calls[1].u).includes('interval.startTime=2026-11-14T04:00:00.000Z') && calls[1].u.includes('ALIGN_MEAN'), '최근 4일 · 날마다 평균');
  const v = r.vals['firestore.googleapis.com/storage/data_and_index_storage_bytes'];
  ok(v['(default)'].v === 12e9 && v['(default)'].at === '2026-11-18T00:00:00Z' && v['readnow-research'].v === 5e8, 'DB별 최근 값', v);
  r = await mk.fsSizeRead(async () => 'tk', fake(() => [403, { error: {} }]), NOW); ok(/^HTTP 403/.test(r.err), '지표 목록 못 읽으면 err', r);
  ok(/if \(q\.fssize\) out\.fssize = await fsSizeRead\(\);/.test(CL) && /if \(q\.iam\) out\.iam = await iamRead\(\);/.test(CL), '진단 fssize·iam에 이어짐');
  // (fbops1 11/18 2차) 규칙 배포는 구글 확인 통로가 열린 deploy-cloud.yml 안에서만(따로 만든 rules-deploy.yml은 통로 조건에 막혀 뺌)
  //  시험 문(test-gate)은 이 파일을 <사본>/w/pw에서 돌림 — cloud는 <사본>/w에 이어져 있지만 .github는 <사본>에만 있어 위로 찾아 올라감
  const GROOT = [path.join(__dirname, '..'), path.join(__dirname, '..', '..'), path.join(__dirname, '..', '..', '..')].find((d) => fs.existsSync(path.join(d, '.github', 'workflows', 'deploy-cloud.yml')));
  ok(!!GROOT, 'deploy-cloud.yml을 찾음'); if (!GROOT) { console.log(`❌ ${bad}개 실패`); process.exit(1); }
  const WF = fs.readFileSync(path.join(GROOT, '.github', 'workflows', 'deploy-cloud.yml'), 'utf8');
  ok(!fs.existsSync(path.join(GROOT, '.github', 'workflows', 'rules-deploy.yml')), '통로에 막히는 rules-deploy.yml은 없음');
  ok(/^\s+rules: \{ description: .*type: string, default: '' \}/m.test(WF) && /case "\$RU_IN" in view\|deploy\)/.test(WF), '손으로 돌리기 rules 칸(view·deploy만)');
  const RJ = WF.slice(WF.indexOf('\n  rules:\n'), WF.indexOf('\n  deploy:\n'));
  ok(RJ.length > 100 && /if: needs\.what\.outputs\.rules != '' && github\.ref == 'refs\/heads\/main'/.test(RJ), '규칙 작업은 rules 칸 + main에서만');
  ok(/RU_IN.*exit 0; fi/.test(WF) && WF.indexOf('RU_IN=') < WF.indexOf('B="${{ github.event.before }}"'), 'rules 칸이면 클라우드 배포 판단 전에 끝냄(배포 안 함)');
  ok(/node src\/tools\/rules-deploy\.js \$A/.test(RJ) && /\[ "\$RU" = deploy \] && A="--deploy"/.test(RJ) && /if: env\.RU == 'deploy'/.test(RJ), 'deploy일 때만 --deploy(시험 통과 때만 배포)');
  ok(/testIamPermissions/.test(RJ) && /\[ "\$N" = "4" \]/.test(RJ) && /\[ "\$GOT" = "\$WANT" \]/.test(RJ), '권한 4개 확인 · 배포 뒤 풀이 확인');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})();
