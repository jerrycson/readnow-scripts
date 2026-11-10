/* t_auto — (0.1.1 정범님 11/05 밤 '자야 되니까 번외 수집기가 돌아가게만 · 새벽에도 · 사람 손 없이 새 판')
 *  ① 저절로 돌기: 웹앱이 넘긴 표본 목록에서 사람이 누르지 않아도 차례로 그림자 읽기·비교 · 결과는 맡겨 두었다가(파일) 웹앱이 대신 씀(col2_* 만)
 *     · 웹앱이 닫혀 있어도 계속 읽고 쌓음 · 도우미가 다시 켜져도 표본·맡긴 결과를 잃지 않음 · 하루 요약은 한 문서(col2_runs/auto_<날짜>)
 *     · 하루 상한을 다 쓰면 멈추고 다음 날 이어감 · 새벽에도 돎(nightOn 기본 켬) · 상태에 '오늘 n/상한 · 다음 읽기 n초 뒤 · 마지막 기록'
 *  ② 스스로 새 판 받기: GitHub 판이 높으면 받아 검사 뒤 바꿔 끼우고 끝냄(운영 인쇄 도우미가 다시 켬) · 검사 실패면 옛 판 그대로
 * 실행: node tests/t_auto.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p); } catch (e) {} } };
const kday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

(async () => {
  const A = await L.fakeAladin(F.productHtml); const IDS = ['100001', '100002', '100003'];
  const PROD = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED);
  console.log('① 저절로 돌기');
  ok(COL2.PACE.minGapMs === 4000 && COL2.PACE.hourCap === 240 && COL2.PACE.dayCap === 1600 && COL2.PACE.cool429Min === 10 && COL2.PACE.floorMs === 700, '속도 = 사람 속도 두 배(한 장 뒤 4초 · 시간 240 · 하루 1,600) · 429 쉼 10분 · 최소 0.7초 그대로(정범님 11/05 밤)');
  let H = await L.startHelper({ aladin: A.base, cfg: { pace: { minGapMs: 300 }, watch: { tickSec: 1 }, headless: true } }); const D = H.D;
  try {
    let pd = (await H.api('GET', '/relay/pending?by=x')).j; ok(pd.ok && pd.pool === COL2.RELAY.poolN && Array.isArray(pd.fields) && pd.fields.includes('title'), `표본 목록이 없으면 웹앱에 ${COL2.RELAY.poolN}권을 부탁`, pd.pool);
    ok((await H.api('GET', '/relay/pending?by=x')).j.pool === 0, '부탁은 10분에 한 번(웹앱이 같은 큰 읽기를 거듭하지 않게)');
    let s = (await H.api('GET', '/status')).j; ok(s.auto && s.auto.nightOn === true && s.auto.auto === true && !s.auto.on, '자동 읽기 기본 켬 · 새벽에도(nightOn 기본 켬) · 번외 수집을 켜야 돎');
    await H.api('POST', '/cfg', { on: true });
    const pool = PROD.map((b, i) => ({ id: 'b' + (i + 1), ...b })).concat([{ id: 'bx', aladinItemId: 'abc' }]);
    await H.api('POST', '/relay/answer', { pool });
    for (let k = 0; k < 80 && !((s = (await H.api('GET', '/status')).j).auto.day.n >= 3); k++) await wait(250);
    if (s.auto.day.fail) console.log('    (읽기 기록)', JSON.stringify(s.reads), JSON.stringify(s.auto.last));
    ok(s.auto.day.n >= 3 && s.auto.poolN === 3 && A.reqs.filter((q) => /wproduct/.test(q.path)).length >= 3, '단추를 누르지 않아도 표본에서 차례로 그림자 읽기(이상한 번호는 목록에서 뺌)', JSON.stringify(s.auto.day));
    ok(s.auto.day.same >= 3 && s.auto.on && s.auto.dayCap === 1600, '운영 문서와 견줘 같음으로 셈 · 하루 상한 1,600', JSON.stringify({ d: s.auto.day, cap: s.auto.dayCap }));
    ok(s.auto.prodShare === COL2.AUTO.prodShare && COL2.AUTO.prodShare > 0 && COL2.AUTO.prodShare < 1 && s.auto.prodFull === (s.auto.day.n >= Math.floor(1600 * COL2.AUTO.prodShare)), `(11/10 밤) 상품 화면이 하루 몫의 ${Math.round(COL2.AUTO.prodShare * 100)}%를 넘게 읽은 날은 그림자 일 먼저(prodFull) — 지금은 아님`, JSON.stringify({ sh: s.auto.prodShare, full: s.auto.prodFull, n: s.auto.day.n }));
    ok(s.relay.outN >= 4 && !s.relay.ackAt, '웹앱이 아직 안 가져가도 결과를 쌓아 둠', s.relay.outN);
    const pg = await H.req('GET', '/'); ok(/function autoLine/.test(pg.b) && /자동으로 도는 중/.test(pg.b) && /다음 읽기/.test(pg.b) && /마지막 기록/.test(pg.b), "상태 창에 '자동으로 도는 중 · 오늘 n/상한 · 다음 읽기 n초 뒤 · 마지막 기록 n분 전'");
    const outF = path.join(D, 'home', 'relay-out.json'), poolF = path.join(D, 'home', 'pool.json');
    ok(JSON.parse(fs.readFileSync(outF, 'utf8')).length >= 4 && JSON.parse(fs.readFileSync(poolF, 'utf8')).pool.length === 3, '맡긴 결과·표본 목록은 그 PC 파일에(relay-out.json · pool.json)');

    console.log('  도우미를 다시 켜도 이어감 · 웹앱이 열리면 올림');
    await H.stop(); killDir(D); H = await L.startHelper({ dir: D, aladin: A.base });
    pd = (await H.api('GET', '/relay/pending?by=' + encodeURIComponent('웹앱 HOME'))).j;
    const books = pd.out.filter((o) => o.c === 'col2_books'), runs = pd.out.filter((o) => o.c === 'col2_runs');
    ok(books.length >= 3 && runs.length === 1 && runs[0].id === 'auto_' + kday() && runs[0].v.auto && runs[0].v.n >= 3, '다시 켠 뒤에도 맡긴 결과 그대로 · 하루 요약은 한 문서(col2_runs/auto_<날짜>)', pd.out.map((o) => o.c + '/' + o.id).join(' '));
    ok(pd.out.every((o) => /^col2_/.test(o.c)) && books.every((o) => o.v.cmp && o.v.page && o.v.auto && o.v.itemId), '맡긴 것은 모두 col2_* · 그림자 결과·판정이 듦');
    const ack = (await H.api('POST', '/relay/ack', { keys: pd.out.map((o) => o.k) })).j; s = (await H.api('GET', '/status')).j;
    ok(ack.done === pd.out.length && s.relay.outN === 0 && s.relay.ackAt && s.relay.pullBy === '웹앱 HOME', '웹앱이 다 쓰면 지움 · 마지막 기록 시각·누가', JSON.stringify(s.relay));
    const ack2 = await H.api('POST', '/relay/ack', { keys: [], errs: { x: 'permission-denied' } }); s = (await H.api('GET', '/status')).j; ok(s.relay.err === 'permission-denied', '웹앱이 못 쓴 까닭(오류 코드)을 상태에 남김(화면에 보임)');
    await H.api('POST', '/cfg', { on: true, pace: { minGapMs: 300 } });
    for (let k = 0; k < 40 && !/기다림/.test(((s = (await H.api('GET', '/status')).j).auto.msg || '')); k++) await wait(250);
    ok(/기다림/.test(s.auto.msg || '') && s.auto.left === 0, '(0.1.2) 표본을 다 읽으면 처음부터 다시 읽지 않고 다음 묶음을 기다림', s.auto.msg);
    await H.api('POST', '/relay/answer', { pool }); /* 남은 책이 없으니 다음 표본을 받음 */
    await H.api('POST', '/cfg', { on: true, pace: { minGapMs: 300, dayCap: s.pace.dayN + 1 } });
    for (let k = 0; k < 60 && !/다음 날/.test(((s = (await H.api('GET', '/status')).j).auto.msg || '')); k++) await wait(250);
    ok(/하루 .*장까지/.test(s.auto.msg) && /다음 날 이어감/.test(s.auto.msg) && s.auto.nextMs > 60e3, '하루 상한을 다 쓰면 멈추고 다음 날 이어감', s.auto.msg + ' · ' + Math.round(s.auto.nextMs / 60000) + '분 뒤');
    { const pj = JSON.parse(fs.readFileSync(poolF, 'utf8')), pa = JSON.parse(fs.readFileSync(path.join(D, 'home', 'pool-at.json'), 'utf8')); ok(Number.isFinite(pa.cur) && pj.pool.length === 3 && pa.day && pa.day.n >= 3, '읽은 자리(cur)·오늘 셈을 파일(pool-at.json)에 남겨 다시 켜면 이어 읽음', JSON.stringify({ cur: pa.cur, n: pa.day && pa.day.n })); }
    const bad = await H.api('POST', '/relay/answer', { docs: [{ c: 'app_secrets', id: 'k', v: { x: 1 } }] }); ok(bad.j.n === 0, '웹앱이 넘긴 것도 prd_ids·prd_books 밖이면 받지 않음');
  } finally { await H.stop(); killDir(D); }

  console.log('② 스스로 새 판 받기(사람 손 없이)');
  const mkRaw = (ver, broken) => { const RD = fs.mkdtempSync(path.join(os.tmpdir(), 'col2raw_')); for (const f of ['col2-config.js', 'bundle.json', 'helper', 'shadow']) fs.cpSync(path.join(L.ROOT, f), path.join(RD, f), { recursive: true });
    const cf = path.join(RD, 'col2-config.js'); fs.writeFileSync(cf, fs.readFileSync(cf, 'utf8').replace(/COL2_VER: '[\d.]+'/, `COL2_VER: '${ver}'`)); if (broken) fs.appendFileSync(path.join(RD, 'helper', 'col2-pace.js'), '\n}}} 문법 틀림');
    const srv = http.createServer((q, r) => { const f = path.join(RD, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!f.startsWith(RD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); r.end(fs.readFileSync(f)); });
    return new Promise((res) => srv.listen(0, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/` }))); };
  const runApp = (rawUrl) => { const B = fs.mkdtempSync(path.join(os.tmpdir(), 'col2self_')); const APP = path.join(B, 'app'); for (const f of ['col2-config.js', 'bundle.json', 'helper', 'shadow']) fs.cpSync(path.join(L.ROOT, f), path.join(APP, f), { recursive: true });
    const pr = cp.spawn(process.execPath, [path.join(APP, 'helper', 'readnow-col2-helper.js')], { cwd: B, env: { ...process.env, RN_COL2_TEST: '1', RN_COL2_PORT: String(L.PORT + 1), RN_COL2_HOME: B, RN_COL2_RAW: rawUrl, RN_COL2_SELFUPD_MS: '1500', RN_COL2_CORE_DIR: L.PROD_REPO }, stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; pr.stdout.on('data', (c) => (out += c)); pr.stderr.on('data', (c) => (out += c));
    return { B, APP, pr, out: () => out, exited: () => pr.exitCode != null }; };
  const ver = (d) => (fs.readFileSync(path.join(d, 'col2-config.js'), 'utf8').match(/COL2_VER: '([\d.]+)'/) || [])[1];
  { const R = await mkRaw('9.9.9'); const X = runApp(R.url); for (let k = 0; k < 60 && !X.exited(); k++) await wait(250);
    ok(X.exited() && ver(X.APP) === '9.9.9' && ver(path.join(X.B, 'app.old')) === COL2.COL2_VER && /스스로 새 판으로 바꿈/.test(X.out()), `GitHub 판이 높으면 받아 검사 → 바꿔 끼우고 끝냄(운영 인쇄 도우미 지킴이가 새 판으로 다시 켬 · 예전 것은 app.old)`, ver(X.APP));
    try { X.pr.kill(); } catch (e) {} R.srv.close(); }
  { const R = await mkRaw('9.9.9', true); const X = runApp(R.url); await wait(4500); let st = null;
    st = await new Promise((res) => http.get({ host: '127.0.0.1', port: L.PORT + 1, path: '/status', headers: { 'X-RN-Col2': '1' } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res(null); } }); }).on('error', () => res(null)));
    ok(!X.exited() && ver(X.APP) === COL2.COL2_VER && st && /검사 실패/.test(st.upd.msg || ''), '받은 새 판이 검사에 실패하면 옛 판 그대로 돎', st && st.upd.msg);
    X.pr.kill(); await wait(300); R.srv.close(); }
  { const R = await mkRaw(COL2.COL2_VER); const X = runApp(R.url); await wait(3500); ok(!X.exited() && ver(X.APP) === COL2.COL2_VER, '같은 판이면 그대로'); X.pr.kill(); await wait(300); R.srv.close(); }
  A.srv.close(); L.done('t_auto');
})();
