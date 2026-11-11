/* tDOM — 11/10 🌐 사용자 지정 도메인 등록·상태(hosting/domain.js) · 가짜 Hosting 서버
 *  ① 없으면 등록(POST ?customDomainId=) 뒤 상태를 읽어 DNS 바람·인증서를 찍음 ② 이미 있으면 GET만(POST 없음) ③ status 길은 없어도 등록 안 함 ④ 403이면 실패(1)
 * 실행: node src/tests/tDOM.js */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const ROOT = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'hosting/domain.js')));
(async () => {
  let have = false, deny = false, race = false; const calls = [];
  const CD = { name: 'projects/63884079760/sites/rn-test/customDomains/readnow.kr', hostState: 'HOST_MISMATCH', ownershipState: 'OWNERSHIP_MISSING', reconciling: true,
    cert: { type: 'GROUPED', state: 'CERT_VALIDATING', verification: { http: { path: '/.well-known/acme-challenge/abc', desiredResponse: 'abc.def' } } },
    requiredDnsUpdates: { checkTime: '2026-11-10T00:00:00Z',
      desired: [{ domainName: 'readnow.kr', records: [{ domainName: 'readnow.kr', type: 'A', rdata: '199.36.158.100', requiredAction: 'ADD' }, { domainName: 'readnow.kr', type: 'TXT', rdata: 'hosting-site=rn-test', requiredAction: 'ADD' }] }],
      discovered: [{ domainName: 'readnow.kr', records: [{ domainName: 'readnow.kr', type: 'A', rdata: '1.2.3.4', requiredAction: 'REMOVE' }] }] } };
  const srv = http.createServer((q, s) => { q.resume(); q.on('end', () => { calls.push(q.method + ' ' + q.url);
    const send = (c, j) => { s.writeHead(c, { 'content-type': 'application/json' }); s.end(JSON.stringify(j)); };
    if (deny) return send(403, { error: { message: 'PERMISSION_DENIED' } });
    if (q.headers.authorization !== 'Bearer t0k') return send(401, {});
    if (q.method === 'GET' && q.url === '/v1beta1/projects/readnow-3a385/sites/rn-test/customDomains/readnow.kr') return have ? send(200, CD) : send(404, { error: { message: 'not found' } });
    if (q.method === 'POST' && q.url === '/v1beta1/projects/readnow-3a385/sites/rn-test/customDomains?customDomainId=readnow.kr') { if (race) { have = true; return send(409, { error: { message: 'ALREADY_EXISTS' } }); } have = true; return send(200, { name: 'operations/x', done: false }); }
    if (q.method === 'GET' && q.url === '/v1beta1/sites/rn-test/domains') return send(200, { domains: [] });
    send(404, {}); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const API = `http://127.0.0.1:${srv.address().port}`;
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'tdom_'));
  const run = (env) => new Promise((res) => cp.execFile(process.execPath, [path.join(ROOT, 'hosting/domain.js'), 'readnow.kr', 'rn-test'], { cwd: T, env: { ...process.env, HOSTING_API: API, HOSTING_TOKEN: 't0k', DOMAIN_WAIT_MS: '10', GITHUB_STEP_SUMMARY: path.join(T, 'sum.md'), ...env } }, (e, so, se) => res({ code: e ? e.code : 0, out: so + se })));

  let d = await run({ DOMAIN_MODE: 'status' });
  ok(d.code === 0 && /등록 안 됨/.test(d.out) && !calls.some((c) => c.startsWith('POST')), '읽기만: 없으면 등록하지 않음');
  calls.length = 0; d = await run({});
  ok(d.code === 0 && /새로 등록함/.test(d.out) && calls.filter((c) => c.startsWith('POST')).length === 1, '없으면 한 번 등록(POST ?customDomainId=readnow.kr)');
  ok(/\| readnow\.kr \| A \| `199\.36\.158\.100` \| 더함 \|/.test(d.out) && /hosting-site=rn-test/.test(d.out), 'Firebase가 바라는 A·TXT 레코드를 표로 찍음');
  ok(/`1\.2\.3\.4` \| 지움/.test(d.out), '지금 DNS의 옛 레코드는 지움으로 찍음');
  ok(/CERT_VALIDATING/.test(d.out) && /acme-challenge\/abc/.test(d.out) && /HOST_MISMATCH/.test(d.out) && /OWNERSHIP_MISSING/.test(d.out), '인증서·호스트·주인 확인 상태 찍음');
  ok(/새로 등록함/.test(fs.readFileSync(path.join(T, 'sum.md'), 'utf8')), '작업 요약(GITHUB_STEP_SUMMARY)에도 씀');
  const J = JSON.parse(fs.readFileSync(path.join(T, 'domain-status.json'), 'utf8')); ok(J.made === true && J.customDomain.hostState === 'HOST_MISMATCH', 'domain-status.json 결과물');
  calls.length = 0; d = await run({});
  ok(d.code === 0 && /이미 등록돼 있음/.test(d.out) && !calls.some((c) => c.startsWith('POST')), '이미 있으면 GET만(바꾸지 않음)');
  have = false; race = true; calls.length = 0; d = await run({}); race = false;
  ok(d.code === 0 && /이미 등록돼 있음/.test(d.out) && /HOST_MISMATCH/.test(d.out), '그 사이 콘솔에서 먼저 등록(409)이면 실패 아님 → 상태만 읽음');
  deny = true; d = await run({}); ok(d.code === 1 && /403/.test(d.out), '권한 없음(403)이면 실패로 알림');
  d = await new Promise((res) => cp.execFile(process.execPath, [path.join(ROOT, 'hosting/domain.js'), 'bad domain'], { cwd: T, env: { ...process.env, HOSTING_TOKEN: 'x' } }, (e, so) => res({ code: e ? e.code : 0, out: so })));
  ok(d.code === 1 && /도메인 꼴이 아님/.test(d.out), '이상한 도메인 글은 거절');
  const Y = fs.readFileSync(path.join(ROOT, '.github/workflows/hosting-domain.yml'), 'utf8');
  ok(/workflow_dispatch:/.test(Y) && !/\n  push:/.test(Y) && /custom_domain:/.test(Y) && /node hosting\/domain\.js/.test(Y), '작업 파일: 손으로만 돎 · custom_domain 입력 · domain.js 부름');
  srv.close(); console.log(bad ? `tDOM ❌ ${bad}개 실패` : 'tDOM ✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
