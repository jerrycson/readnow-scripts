/* tHOST — 11/10 🌐 결과물을 Firebase Hosting에도 함께 내기(1단계 · 지금 주소는 그대로)
 *  ① hosting/build.js: 받는 파일(웹앱·설명서·수집기·공용·도우미)은 담고, 설명 글(.md)·진단·원본·클라우드 코드는 담지 않음 · 경로는 지금 주소와 같은 모양 · robots·도장
 *  ② firebase.json → REST 설정 바꾸기 · 같은 파일은 늘 같은 지문(바뀐 것만 올라감)
 *  ③ hosting/deploy.js 흐름(가짜 Hosting 서버): 새 판 → 지문 알림 → '없다'고 한 것만 올림 → 닫기 → 내보내기 · 두 번째는 0개 올림
 *  ④ 준비 전(403)이면 경고만 · 0으로 끝남 / HOSTING_STRICT=1이면 실패
 * 실행: node src/tests/tHOST.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process');
const ROOT = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'hosting/build.js')) && fs.existsSync(path.join(p, 'readnow-collector.user.js')));
const { build } = require(path.join(ROOT, 'hosting/build.js'));
const { deploy, hashFiles, restConfig } = require(path.join(ROOT, 'hosting/deploy.js'));
(async () => {
  const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'thost_')) + '/public';
  const r = build(ROOT, OUT); const has = (p) => fs.existsSync(path.join(OUT, p));
  console.log(`  (모은 파일 ${r.stamp.files}개 · ${(r.stamp.bytes / 1048576).toFixed(1)}MB)`);
  ok(has('app/index.html') && has('app/readnow-webapp.js') && has('index.html'), '웹앱 담음(app/ · 뿌리 index.html)');
  ok(has('readnow-collector.user.js') && has('readnow-price-watch.user.js') && has('readnow-core.js') && has('readnow-pc-products.js') && has('pc-live.json'), '수집기·감시기·공용·pc-live.json 담음(뿌리 경로 그대로)');
  ok(has('local/readnow-local.js') && has('local/install.ps1') && has('manual/latest.json') && has('friend'), '도우미·설치 글·설명서·책방 친구 담음');
  ok(!has('diag') && !has('src') && !has('cloud') && !has('research') && !has('backups') && !has('friend-app') && !has('.github'), '진단·원본·클라우드·근거·백업·앱 원본은 담지 않음');
  const mds = []; (function w(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) w(p); else if (/\.md$/i.test(n) || n.startsWith('.')) mds.push(p); } })(OUT);
  ok(mds.length === 0, '설명 글(.md)·숨김 파일 없음 ' + mds.slice(0, 3).join(','));
  ok(/Disallow: \//.test(fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8')), 'robots.txt = 검색 막음');
  const S = JSON.parse(fs.readFileSync(path.join(OUT, 'hosting-stamp.json'), 'utf8')); ok(/^[0-9a-f]{40}$/.test(S.commit || '') && S.pcLive, '도장(커밋·수집기 판) ' + String(S.commit).slice(0, 7) + ' ' + S.pcLive);
  ok(fs.readFileSync(path.join(OUT, 'readnow-collector.user.js'), 'utf8') === fs.readFileSync(path.join(ROOT, 'readnow-collector.user.js'), 'utf8'), '수집기 파일은 한 글자도 바꾸지 않음(머리 그대로)');

  /* ② 설정·지문 */
  const C = restConfig(); const all = C.headers.find((x) => x.glob === '**');
  ok(all && all.headers['X-Robots-Tag'] === 'noindex, nofollow' && all.headers['Access-Control-Allow-Origin'] === '*', 'REST 설정: 모든 파일 noindex · 다른 출처 읽기 허용(수집기 fetch)');
  ok(C.headers.some((x) => /js\|json/.test(x.glob) && x.headers['Cache-Control'] === 'no-cache'), 'js·json·html은 늘 새로 확인(no-cache)');
  const h1 = hashFiles(OUT), h2 = hashFiles(OUT); ok(JSON.stringify(h1.files) === JSON.stringify(h2.files), '같은 파일 = 같은 지문(두 번 셈)');
  ok(Object.keys(h1.files).every((k) => k.startsWith('/')), '경로는 /로 시작');

  /* ③ 가짜 Hosting 서버 */
  const known = new Set(); const calls = []; let fail403 = false;
  const srv = http.createServer((q, s) => { let b = []; q.on('data', (c) => b.push(c)); q.on('end', () => { const body = Buffer.concat(b); calls.push(q.method + ' ' + q.url.split('?')[0]);
    if (fail403) { s.writeHead(403); return s.end(JSON.stringify({ error: { message: 'PERMISSION_DENIED' } })); }
    if (q.headers.authorization !== 'Bearer t0k') { s.writeHead(401); return s.end('{}'); }
    const send = (j) => { s.writeHead(200, { 'content-type': 'application/json' }); s.end(JSON.stringify(j)); };
    if (q.method === 'POST' && /\/sites\/rn-test\/versions$/.test(q.url)) { const j = JSON.parse(body); if (!j.config || !j.config.headers) { s.writeHead(400); return s.end('{}'); } return send({ name: 'sites/rn-test/versions/v1' }); }
    if (/:populateFiles$/.test(q.url)) { const f = JSON.parse(body).files; return send({ uploadRequiredHashes: [...new Set(Object.values(f))].filter((h) => !known.has(h)), uploadUrl: `http://127.0.0.1:${srv.address().port}/upload/sites/rn-test/versions/v1/files` }); }
    if (/\/upload\//.test(q.url)) { known.add(q.url.split('/').pop()); return send({}); }
    if (q.method === 'PATCH') return send({ status: 'FINALIZED' });
    if (/\/releases/.test(q.url)) return send({ name: 'sites/rn-test/releases/r1' });
    s.writeHead(404); s.end('{}'); }); });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const API = `http://127.0.0.1:${srv.address().port}`;
  const SMALL = fs.mkdtempSync(path.join(os.tmpdir(), 'thost_s_')); fs.mkdirSync(SMALL + '/app'); fs.writeFileSync(SMALL + '/app/index.html', '<p>가</p>'); fs.writeFileSync(SMALL + '/a.js', 'x'); fs.writeFileSync(SMALL + '/b.js', 'x'); fs.writeFileSync(SMALL + '/pc-live.json', '{"ver":"1.0.0"}');
  const runDeploy = (env) => new Promise((res) => cp.execFile(process.execPath, [path.join(ROOT, 'hosting/deploy.js'), SMALL, 'rn-test'], { env: { ...process.env, HOSTING_API: API, HOSTING_TOKEN: 't0k', ...env } }, (e, so, se) => res({ code: e ? e.code : 0, out: so + se })));
  let d = await runDeploy({}); ok(d.code === 0 && /바뀐 3개 업로드/.test(d.out), '첫 올리기: 파일 4개 중 다른 내용 3개 올림 — ' + d.out.trim().split('\n').pop());
  ok(['POST /v1beta1/sites/rn-test/versions', 'PATCH /v1beta1/sites/rn-test/versions/v1', 'POST /v1beta1/sites/rn-test/releases'].every((c) => calls.includes(c)), '흐름: 새 판 → 닫기 → 내보내기');
  d = await runDeploy({}); ok(d.code === 0 && /바뀐 0개 업로드/.test(d.out), '두 번째: 바뀐 것 없음 → 0개 올림');
  fs.writeFileSync(SMALL + '/a.js', 'y'); d = await runDeploy({}); ok(/바뀐 1개 업로드/.test(d.out), '한 파일만 바꾸면 1개만 올림');
  /* ④ 준비 전 */
  fail403 = true; d = await runDeploy({}); ok(d.code === 0 && /::warning::Firebase Hosting 준비 전/.test(d.out), '403 → 경고만 · 초록으로 끝남');
  d = await runDeploy({ HOSTING_STRICT: '1' }); ok(d.code !== 0 && /::error::/.test(d.out), 'HOSTING_STRICT=1 → 실패로');
  d = await runDeploy({ HOSTING_TOKEN: '' }); ok(d.code === 0 && /HOSTING_TOKEN 없음/.test(d.out), '토큰 없으면 건너뜀');
  const dry = await deploy(OUT, 'x', { dry: true }); ok(dry.dry && dry.files === r.stamp.files, '시험 모드(HOSTING_DRY): 올리지 않고 셈만 ' + dry.files + '개');
  srv.close(); fs.rmSync(path.dirname(OUT), { recursive: true, force: true }); fs.rmSync(SMALL, { recursive: true, force: true });
  console.log(bad ? `❌ tHOST 실패 ${bad}` : '✅ tHOST 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e.stack); process.exit(1); });
