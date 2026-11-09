/* t_alw — 🟧✍ 번외 알라딘 '그림자 쓰기'(정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 쓰기 비교 뒤 하나씩 넘김')
 *  ① 쓰기 0번 — 그림자 쓰기 파일 둘(col2-alw.js·col2-alw-core.js)에 알라딘·바깥으로 가는 길이 글자로 없음 · 실제로 돌려도 가짜 알라딘이 받은 요청 0
 *  ② 견줌 — 같은 입력으로 번외가 만든 요청이 운영이 보낸 요청과 칸마다 같음/다름(값·차례·요청 수) · 이미 그 상태면 요청 없음
 *  ③ 손님 정보 0 — 운영이 실수로 손님 칸을 실어 보내도 결과·상태·파일 어디에도 남지 않음(이름만 칸 · 해시)
 *  ④ 되풀이 0 · 같은 송장 두 번 금지(약속 10) — 번외라면 안 보냄(refuse)으로 따로 셈
 *  ⑤ '넘길 수 있음' 셈 · 관리도구 한 줄(같음 비율) · 로거 PC는 안 받음 · col2.json alw:false 면 안 받음
 * 시험 자료의 손님은 '손님A'·010-1234-5678 꼴만(공개 저장소) · 실행: node tests/t_alw.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const W = require('../shadow/col2-alw-core.js');
const PII = ['손님A', '010-1234-5678', '시험시 시험구 1길'];
let seq = 0; const ev = (k, input, reqs, at) => ({ id: `${k}_t${(++seq).toString(36)}`, k, at: at || Date.now(), in: W.scrubIn(input), rq: reqs.map(W.scrub), ok: true, http: 200 });
const priceReq = (lid, p) => ({ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=${lid}&priceSales=${p}&_=${Date.now()}` });
const qtyReq = (lid, q) => ({ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.stock&ItemId=${lid}&realStock=${q}&_=${Date.now()}` });

(async () => {
  console.log('① 보내는 길 없음(글자)');
  for (const f of ['helper/col2-alw.js', 'shadow/col2-alw-core.js']) { const t = fs.readFileSync(path.join(L.ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    ok(!/require\(['"](https?|net|tls|child_process|\.\/col2-cdp|\.\/col2-al)['"]?|fetch\(|XMLHttpRequest|Runtime\.evaluate|\.send\(|http\.request|https\.get/.test(t), `${f} — 알라딘·바깥으로 보내는 코드 없음(http·fetch·크롬 조종)`); }

  console.log('② 견줌(순수 함수)');
  { const e = ev('edit', { lid: '5001', ch: { price: 12000, qty: 2 }, cur: { state: 1 } }, [priceReq(5001, 12000), qtyReq(5001, 2)]);
    const r = W.compare(e.rq, W.build('edit', e.in)); ok(r.verdict === 'same', '판매가·수량 바꾸기 — 같은 입력이면 운영 요청과 같음(차례·값 · 캐시 칸 _ 는 뺌)', r.diffs);
    const r2 = W.compare([priceReq(5001, 12500), qtyReq(5001, 2)].map(W.scrub), W.build('edit', e.in)); ok(r2.verdict === 'diff' && r2.diffs.some((d) => d.f === '주소.priceSales' && d.op === '12500' && d.c2 === '12000'), '판매가가 다르면 그 칸을 짚음', r2.diffs);
    const r3 = W.compare([qtyReq(5001, 2), priceReq(5001, 12000)].map(W.scrub), W.build('edit', e.in)); ok(r3.verdict === 'diff', '차례가 바뀌어도 다름', r3.diffs.length);
    const r4 = W.compare([priceReq(5001, 12000)].map(W.scrub), W.build('edit', e.in)); ok(r4.verdict === 'diff' && r4.diffs[0].f === '요청 수', '요청 수가 다르면 다름');
    ok(W.build('edit', { lid: '5001', ch: { state: '판매중' }, cur: { state: 1 } }).length === 0, '이미 그 판매상태면 번외도 요청을 만들지 않음(운영 \'이미 그 상태\'와 같음)');
    const st = W.build('edit', { lid: '5001', ch: { state: '판매중지', code: 'BLK-1' }, cur: { state: 1 } }); ok(st.length === 2 && st[0].p === '/scm/ajaxCmd.aspx' && st[0].b.cmd === 'chg.supplieritemcode' && st[1].b.stockStatusToDo === '15' && st[1].b.stockStatusBefore === '1', '관리코드 → 판매상태 차례 · 판매중지 = 15', st);
    const dl = W.build('del', { lids: ['5001', '5002'], before: 15 }); ok(dl[0].b.stockStatusToDo === '17' && dl[0].b.items === '5001,5002', '삭제 = 묶음 17 · 상품 번호 모음');
    const cx = W.build('cancel', { ono: '111-A1', items: ['9', '8'], reason: '2', keys: ['hidX'] }); const cxOp = W.scrub({ m: 'GET', u: '/scm/ReportNotSalesLayer.aspx?ono=111-A1&hidX=zz&ordersItem=8&ordersItem=9&cancelReason=2' });
    ok(W.compare([cxOp], cx).verdict === 'same', '판매 불가 통보 — 상품 차례가 달라도 같은 모음이면 같음 · 숨은 칸은 이름만 견줌', W.compare([cxOp], cx).diffs);
    ok(W.compare([W.scrub({ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=111-A2' })], W.build('start', { ono: '111-A2' })).verdict === 'same', '발송준비시작 같음'); }

  console.log('③ 손님 정보 가림(순수 함수)');
  { const s = W.scrub({ m: 'POST', u: '/scm/x.aspx?ono=1&rcvName=손님A', b: 'txtAnswer=손님A님 010-1234-5678 로 연락&rcvTel=010-1234-5678&addr=시험시 시험구 1길' });
    ok(!PII.some((w) => JSON.stringify(s).includes(w)) && /^#h[0-9a-f]{8}\/\d+$/.test(s.b.txtAnswer) && s.x.includes('rcvName') && s.x.includes('addr'), '글 칸은 해시·길이만 · 그 밖 칸은 이름만', s);
    ok(!JSON.stringify(W.scrubIn({ note: '손님A 010-1234-5678' })).includes('010-1234-5678'), '입력의 전화 꼴도 가림');
    const rc = W.reClean({ m: 'GET', p: '/scm/x', q: { ono: '1', name: '손님A' }, b: { txtAnswer: '손님A 글' }, x: [] }); ok(!JSON.stringify(rc).includes('손님A') && rc.x.includes('name'), '운영이 가리지 않고 실어 보내도 번외가 다시 가림(믿지 않음)', rc); }

  console.log('④ 되풀이·같은 송장(순수 함수)');
  { const m = {}; ok(W.invCheck(m, 'A', '#h1').ok && W.invCheck(m, 'A', '#h1').ok && W.invCheck(m, 'B', '#h1').dup === true, '같은 송장을 다른 주문에 → 막음(약속 10) · 같은 주문 다시는 괜찮음');
    ok(W.keyOf('edit', { lid: 1, ch: { price: 100 } }) === W.keyOf('edit', { lid: 1, ch: { price: 100 } }) && W.keyOf('edit', { lid: 1, ch: { price: 100 } }) !== W.keyOf('edit', { lid: 1, ch: { price: 200 } }), '같은 일 이름(되풀이 셈)');
    const p = W.passOf('edit', { n: 30, same: 30 }); const p2 = W.passOf('edit', { n: 30, same: 29, diff: 1 }); const p3 = W.passOf('start', { n: 0 }); const p4 = W.passOf('edit', { n: 30, same: 30, c2Rep: 1 }); const p5 = W.passOf('inv', { n: 50, same: 50 });
    ok(p.ok && !p2.ok && !p3.ok && /약속 0-1/.test(p3.why.join()) && !p4.ok && !p5.ok && /이어지지 않음/.test(p5.why.join()), '넘길 수 있음: 수 ≥ 기준 · 다름 0 · 번외 되풀이 0 · 출고 일은 표본 적음 · 송장은 아직 안 이어짐', { p, p2, p3, p4, p5 });
    ok(W.passOf('edit', { n: 5, same: 5 }, { minN: { edit: 5 } }).ok, '기준 수는 설정으로 바꿈(col2.json alwPass)'); }

  console.log('⑤ 도우미 /al/wfeed — 실제로(가짜 알라딘이 받는 요청 0)');
  const F = await L.fakeAladin(() => '<html></html>');
  let H = await L.startHelper({ cfg: { on: true, y24: false, auto: false, headless: true, pc: 'OFFICE1', side: false }, env: { RN_COL2_ALADIN: F.base } }); const HOME = H.D + '/home';
  const fd = await H.api('POST', '/al/feed', { by: '시험 수집기', seat: { ok: false }, hold: { on: false } }); ok(fd.j && fd.j.alw && fd.j.alw.on === true, '/al/feed 답에 alw.on(번외가 쓰기 그림자를 받음) — 수집기가 이것을 보고만 적음', fd.j && fd.j.alw);
  const E = [];
  for (let i = 0; i < 4; i++) E.push(ev('edit', { lid: String(6000 + i), ch: { price: 10000 + i * 100 }, cur: { state: 1 } }, [priceReq(6000 + i, 10000 + i * 100)]));
  E.push(ev('edit', { lid: '6100', ch: { price: 9000 } }, [priceReq(6100, 9900)])); /* 다름 */
  E.push(ev('start', { ono: '111-B1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=111-B1', b: null }]));
  E.push(ev('cancel', { ono: '111-B2', items: ['1'], reason: '2', keys: ['rcvName', 'tel'], buyer: '손님A', tel: '010-1234-5678' }, [{ m: 'GET', u: '/scm/ReportNotSalesLayer.aspx?ono=111-B2&rcvName=손님A&ordersItem=1&cancelReason=2&tel=010-1234-5678' }]));
  E.push({ ...E[0], id: E[0].id + 'r', at: E[0].at + 30e3 }); /* 30초 만에 같은 일 = 되풀이 */
  E[7].rq = E[7].rq.map((r) => ({ ...r, q: { ...r.q, memo: '손님A' } })); /* 가리지 않은 칸이 실려 와도 */
  const r1 = await H.api('POST', '/al/wfeed', { by: '시험 수집기', w: E }); ok(r1.j && r1.j.ok && r1.j.ack.length === E.length, `받았다는 표시(ack) ${r1.j && r1.j.ack.length}/${E.length}`);
  const r2 = await H.api('POST', '/al/wfeed', { by: '시험 수집기', w: E.slice(0, 2) }); ok(r2.j.ack.length === 2, '같은 알림이 다시 와도 ack만(두 번 세지 않음)');
  const s = (await H.api('GET', '/status')).j.alw; const K = s.kinds;
  ok(K.edit.n === 5 && K.edit.same === 4 && K.edit.diff === 1 && K.edit.opRep === 1 && K.edit.refuse === 1 && K.start.same === 1 && K.cancel.same === 1, `오늘 셈 — 상품 값 같음 4 · 다름 1 · 되풀이(번외는 안 보냄) 1 · 발송준비시작·취소 같음`, K.edit);
  ok(s.n === 7 && s.same === 6 && s.pct === 85.7 && s.sent === 0, `같음 비율 ${s.pct}% · 번외가 보낸 쓰기 0`, s);
  ok(!K.edit.pass.ok && K.edit.pass.why.some((w) => /견준 수 5 < 30/.test(w)) && /다름 1/.test(K.edit.pass.why.join()), '넘김 기준 — 아직 아님(수·다름)', K.edit.pass);
  const pend = (await H.api('GET', '/relay/pending?by=t')).j; ok(pend.al && pend.al.w && pend.al.w.pct === 85.7 && pend.al.w.n === 7, '웹앱 관리도구 한 줄 재료(al.w — 같음 비율)', pend.al && pend.al.w);
  const out = JSON.parse(fs.readFileSync(HOME + '/relay-out.json', 'utf8')); const alw = out.filter((x) => x.c === 'col2_alw');
  ok(alw.length >= 8 && alw.some((x) => /^day_\d{4}-\d\d-\d\d_OFFICE1$/.test(x.id)) && out.every((x) => /^col2_/.test(x.c)), `결과는 col2_alw에만(일마다 ${alw.length - 1}건 + 하루 요약)`, out.map((x) => x.c + '/' + x.id).slice(0, 12));
  const dd = alw.find((x) => x.v.verdict === 'diff'); ok(dd && dd.v.diffs.some((d) => d.f === '주소.priceSales' && d.op === '9900' && d.c2 === '9000') && dd.v.sent === 0, '다른 칸 기록(운영 9900 · 번외 9000)', dd && dd.v.diffs);
  { let blob = ''; for (const f of fs.readdirSync(HOME)) { const p = path.join(HOME, f); if (fs.statSync(p).isFile()) blob += fs.readFileSync(p, 'utf8'); } blob += JSON.stringify((await H.api('GET', '/status')).j);
    ok(!PII.some((w) => blob.includes(w)), '손님 이름·전화가 결과·상태·도우미 파일 어디에도 없음', PII.filter((w) => blob.includes(w))); }
  ok(F.reqs.length === 0, `가짜 알라딘이 받은 요청 ${F.reqs.length}개 — 번외는 쓰기는 물론 아무 요청도 보내지 않음`);
  await H.stop(); await H.api('GET', '/status').catch(() => {});

  /* 다음 날 — 지난 하루가 기준을 넘으면 '넘길 수 있음' */
  console.log('⑥ 하루 지나 넘길 수 있음 · alw:false · 로거');
  { const D = require('fs').mkdtempSync(require('os').tmpdir() + '/col2alw_'); fs.mkdirSync(D + '/home', { recursive: true }); const y = new Date(Date.now() + 9 * 3600e3 - 86400e3).toISOString().slice(0, 10);
    fs.writeFileSync(D + '/home/alw.json', JSON.stringify({ days: { [y]: { edit: { ...W.dayNew(), n: 40, same: 40 } } } }));
    H = await L.startHelper({ dir: D, cfg: { on: true, y24: false, auto: false, headless: true, pc: 'OFFICE1', side: false }, env: { RN_COL2_ALADIN: F.base } });
    const s2 = (await H.api('GET', '/status')).j.alw; ok(s2.hand.includes('edit') && (await H.api('GET', '/relay/pending')).j.al.w.hand[0] === W.KINDS.edit.t, '어제 상품 값 바꾸기 40건 모두 같음 → 그 일 하나만 넘길 수 있음(정범님 허락 뒤)', s2.hand);
    await H.stop(); }
  H = await L.startHelper({ cfg: { on: true, y24: false, auto: false, headless: true, pc: 'OFFICE1', side: false, alw: false }, env: { RN_COL2_ALADIN: F.base } });
  { const f = (await H.api('POST', '/al/feed', { by: 't', hold: { on: false } })).j; const r = (await H.api('POST', '/al/wfeed', { w: [ev('start', { ono: '1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=1' }])] })).j;
    ok(f.alw.on === false && r.on === false && r.ack.length === 0, 'col2.json alw:false 면 받지 않음(수집기는 적지도 않음)'); await H.stop(); }
  H = await L.startHelper({ cfg: { on: true, y24: false, auto: false, headless: true, pc: 'LOGGER', side: false }, env: { RN_COL2_ALADIN: F.base } });
  { const f = (await H.api('POST', '/al/feed', { by: 't', hold: { on: false } })).j; const r = (await H.api('POST', '/al/wfeed', { w: [ev('start', { ono: '1' }, [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=1' }])] })).j;
    ok(f.alw.on === false && r.on === false, '로거 PC는 받지 않음(약속 0)'); await H.stop(); }
  ok(F.reqs.length === 0, '끝까지 가짜 알라딘 요청 0'); F.srv.close();
  L.done('t_alw');
})().catch((e) => { console.error(e); process.exit(1); });
