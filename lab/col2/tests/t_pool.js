/* t_pool — (0.1.2 정범님 11/06 '당연히 표본을 늘려야 — 같은 책을 다시 읽어서 얻는 게 뭐가 있어?')
 *  표본 = 운영 prd_books 전체를 한 바퀴씩: 웹앱이 문서 이름 차례로 묶음씩 이어 넘김(도우미가 '어디까지 받았나'를 pool-at.json에 적고 그 뒤부터 부탁)
 *  · 한 번 읽은 책은 한 바퀴를 다 돌 때까지 다시 안 읽음 · 늦게 온 옛 묶음은 버림 · 끝 묶음까지 읽으면 다음 바퀴를 처음부터
 *  · 예전 웹앱의 무작위 표본은 남은 책이 없을 때만 받음 · 큰 표본 파일(pool.json)은 한 권마다 다시 쓰지 않음
 * 실행: node tests/t_pool.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };

(async () => {
  const A = await L.fakeAladin(F.productHtml); const IDS = ['100001', '100002', '100003', '100004'];
  const PROD = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED); const bk = (i) => ({ id: 'b' + (i + 1), ...PROD[i] });
  const reads = (id) => A.reqs.filter((q) => q.path === '/shop/wproduct.aspx?ItemId=' + id).length;
  const H = await L.startHelper({ aladin: A.base, cfg: { pace: { minGapMs: 300 }, watch: { tickSec: 60 }, headless: true } }); const D = H.D; const HOME = path.join(D, 'home');
  try {
    let pd = (await H.api('GET', '/relay/pending?by=x')).j;
    ok(pd.pool === COL2.RELAY.poolN && pd.poolAfter === null && pd.poolLap === 1, `처음 = 1바퀴 첫 묶음(${COL2.RELAY.poolN}권)을 맨 앞부터 부탁`, pd);
    await H.api('POST', '/relay/answer', { pool: [bk(0), bk(1)], poolFor: null, poolNext: 'b2', poolEnd: false, poolLap: 1 });
    let s = (await H.api('GET', '/status')).j; ok(s.auto.poolN === 2 && s.auto.lap.after === 'b2' && !s.auto.lap.end, "받은 묶음을 붙이고 '어디까지 받았나'(b2)를 적음", s.auto.lap);
    const st = await H.api('POST', '/relay/answer', { pool: [bk(2)], poolFor: null, poolNext: 'b3', poolLap: 1 }); s = (await H.api('GET', '/status')).j;
    ok(s.auto.poolN === 2 && s.auto.lap.after === 'b2' && /늦게 온 표본 묶음은 버림/.test(H.out()), '늦게 온 옛 묶음(이미 받은 자리)은 버림 — 같은 책이 두 번 들지 않음');
    await H.api('POST', '/relay/answer', { pool: [bk(1), bk(2), bk(3)], poolFor: 'b2', poolNext: 'b4', poolEnd: true, poolLap: 1 }); s = (await H.api('GET', '/status')).j;
    ok(s.auto.poolN === 4 && s.auto.left === 4 && s.auto.lap.end && s.auto.lap.got === 4, '다음 묶음은 그 뒤에 이어 붙임(같은 상품 번호는 빼고) · 끝 묶음 표시', s.auto.lap);
    const poolF = path.join(HOME, 'pool.json'), atF = path.join(HOME, 'pool-at.json'); const m0 = fs.statSync(poolF).mtimeMs;
    ok((await H.api('POST', '/relay/answer', { pool: [bk(0)] })).j.n === 0, '예전 웹앱의 무작위 표본은 남은 책이 있으면 받지 않음(다시 읽기 막음)');

    await H.api('POST', '/cfg', { on: true });
    for (let k = 0; k < 120 && !((s = (await H.api('GET', '/status')).j).auto.lap.n === 2); k++) await wait(250);
    ok(s.auto.lap.n === 2 && IDS.every((id) => reads(id) === 1) && s.auto.lap.done.slice(-1)[0].read === 4, '한 바퀴(4권)를 모두 한 번씩 읽고 다음 바퀴로 — 같은 책 다시 읽기 0', { reads: IDS.map(reads), lap: s.auto.lap });
    await wait(2500); s = (await H.api('GET', '/status')).j;
    ok(IDS.every((id) => reads(id) === 1) && /기다림/.test(s.auto.msg || ''), '다음 바퀴 묶음이 오기 전엔 읽지 않고 기다림(옛 묶음을 처음부터 다시 돌지 않음)', s.auto.msg);
    pd = (await H.api('GET', '/relay/pending?by=x')).j; ok(pd.pool === COL2.RELAY.poolN && pd.poolAfter === null && pd.poolLap === 2, '다음 바퀴는 맨 앞부터 다시 부탁', pd);
    ok(fs.statSync(poolF).mtimeMs === m0 || JSON.parse(fs.readFileSync(poolF, 'utf8')).pool.length === 0, '큰 표본 파일(pool.json)은 한 권마다 다시 쓰지 않음(바뀔 때만)');
    const at = JSON.parse(fs.readFileSync(atF, 'utf8')); ok(at.lap && at.lap.n === 2 && at.day && at.day.n === 4 && at.lap.done.length === 1, '읽은 자리·바퀴·오늘 셈은 작은 파일(pool-at.json)에 — 다시 켜도 이어감', at.lap);
    const runs = (await H.api('GET', '/relay/pending?by=x')).j.out.filter((o) => o.c === 'col2_runs'); ok(runs.length === 1 && runs[0].v.lap >= 1 && runs[0].v.lapRead != null, '하루 요약에 바퀴 번호·이번 바퀴 읽은 수', runs[0] && runs[0].v);
    await H.api('POST', '/relay/answer', { pool: [bk(0)] }); s = (await H.api('GET', '/status')).j; ok(s.auto.poolN === 1, '남은 책이 없을 때는 예전 웹앱 표본도 받음(멈추지 않게)');
  } finally { await H.stop(); killDir(D); }
  A.srv.close(); L.done('t_pool');
})();
