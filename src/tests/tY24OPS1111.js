// tY24OPS1111 — (11/11 y24ops1 · 정범님 '예스24·네이버·우리숍·리드나우 2를 완성될 때까지 쉬지 않고') 🧰 예스24 운영 빈 곳 채우기
//   ① 번외 순수 셈: 운영 화면(반품·문의·정산)은 [조회]만 하는 읽기 화면 · 첫 화면 숫자 요약에 주소·손님 칸이 안 들어감 · 미답변 문의·반품 요청 수
//   ② 번외 💲 판매가 쓰기 검사: 100원~100만 원 · 10원 단위 · 이미 됨 셈 · 50% 넘게 바뀌면 안 누름(숫자 울타리)
//   ③ 웹앱 ◆y24ops 덩어리: 판매관리 일 8가지가 '웹앱 어디서'와 함께 · 할 일 카드(로그인 풀림이 맨 위) · 약속 36 울타리(제안만 막음) · 💲 맡김 줄 검사
//   ④ 웹앱 글 검사: 🟦 예스24 칸 「🧰 예스24 운영」 단추 · 두 번 누르기(y24Arm) · 브라우저 창(alert/confirm/prompt) 없음 · 기능 찾기 목록 · PC 상태 요약에 숫자만
//   ⑤ 실제 흐름(숨은 크롬 · lab/col2/tests/t_y24w.js ⑦): 판매가 고치기 → 다시 읽어 확인 · 50% 넘음·고칠 수 없는 칸·판매중지 상품은 안 누름 — RN_SKIP_COL2=1이면 건너뜀
//   ⑥ 화면(RN_PORT가 있을 때 · cwd = harness.js·seed.js 옆): 🧰 예스24 운영 열기 → 할 일 카드·기능 표·💲 두 번 누름 → 가짜 번외에 price 맡김 · 화면 사진(RN_SHOT 경로)
// 실행: node src/tests/tY24OPS1111.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), process.env.RN_REPO].filter(Boolean).find((x) => fs.existsSync(path.join(x, 'lab', 'col2', 'helper', 'col2-y24.js')));
const APP = process.env.RN_APP || path.join(ROOT, 'src', 'app.html');
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const Y = require(path.join(ROOT, 'lab', 'col2', 'helper', 'col2-y24.js')); const W = require(path.join(ROOT, 'lab', 'col2', 'helper', 'col2-y24w.js'));

console.log('① 번외 운영 화면 읽기(순수 셈)');
{ const P = Y.OPS_PAGES.map((x) => x.p); ok(['/Claim/ReturnManagementS1', '/Claim/CancelReturnList', '/CustomerService/QAList', '/Order/CalculatePlannedList', '/Calculation/CalculationHistoryList'].every((p) => P.includes(p)), '운영 화면 5곳(반품·교환 요청 · 반품현황 · 상품 문의 · 배송중/정산예정 · 정산내역)', P);
  ok(Y.OPS_PAGES.every((x) => !Y.SECRET.test(x.p)) && Y.SAFE.test('조회') && Y.DANGER.test('승인') && Y.DANGER.test('답변') && Y.DANGER.test('출금'), '읽기 화면만 · 누르는 단추는 [조회]뿐(승인·답변·출금은 위험 낱말)');
  const m = Y.mainSum({ ORDER_COUNT: 2, PREPARE_DELIVERY: '1', NOREPLY: 3, RETURN_RECEIPT: 1, DEPOSIT: 12000, SENDING_ADDRESS: '주소', RETURN_STREET_ADDRESS: '주소', USER_ID: 'abc' });
  ok(m && m.ord === 2 && m.prep === 1 && m.noreply === 3 && m.retIn === 1 && m.dep === 12000 && !JSON.stringify(m).includes('주소') && !JSON.stringify(m).includes('abc'), '첫 화면 요약은 숫자만(주소·아이디 칸 버림)', m);
  ok(Y.mainSum({ USER_ID: 'x' }) === null && Y.mainSum(null) === null, '숫자가 없으면 요약 없음');
  ok(JSON.stringify(Y.opsNum('/api/CustomerService/QAList', { NO_ANSWER_COUNT: 4, QA_LIST: [{ MEM_ID: 'x' }] })) === '{"qaNo":4}' && JSON.stringify(Y.opsNum('/api/Claim/SearchReturnTotal', { RETURN_REQUEST: 2, RETURN_ENTER: 1, RETURN_COMPLETE: 5 })) === '{"retReq":2,"retEnter":1,"retDone":5}' && Y.opsNum('/api/Order/OrderTotalList', { TOTAL_COUNT: 3 }) === null, '미답변 문의 수 · 반품 요청 합계만 뽑음(목록 줄은 안 남김)');
  const src = fs.readFileSync(path.join(ROOT, 'lab', 'col2', 'helper', 'col2-y24.js'), 'utf8'); ok(/opsH: 3/.test(src) && /what === 'ops'/.test(src) && /sleepR\(8000, 20000\)/.test(src.slice(src.indexOf('async function opsRun'), src.indexOf('async function step'))), '운영 화면은 3시간마다(설정 opsH) · 지금 읽기(/y24/run ops) · 화면 사이 8~20초(사람 속도)');
  const cfg = fs.readFileSync(path.join(ROOT, 'lab', 'col2', 'col2-config.js'), 'utf8'); ok(/COL2_VER: '0\.1\.2[2-9]'/.test(cfg), '번외 판 번호를 올림(0.1.22 이상 — 인쇄 도우미가 사람 손 없이 새 판을 받음)', (cfg.match(/COL2_VER: '[^']+'/) || [])[0]); }

console.log('② 번외 💲 판매가 쓰기 검사');
{ const row = (o) => ({ rid: 'y24p|300000001', rk: 'price|300000001|9000|20261111', no: '300000001', self: 'A01SKU1', kind: 'price', to: 9000, ...o }); const J = (r) => ({ id: 'y24p-t1', rows: [r] }); const R1 = { ok1: 1, rk: {} };
  ok(W.KINDS.price === '판매가' && W.checkJob(J(row()), R1) === '', '판매가 맡김 받음');
  ok(/10원/.test(W.checkJob(J(row({ to: 9005 })), R1)) && /100원/.test(W.checkJob(J(row({ to: 90 })), R1)) && /100만/.test(W.checkJob(J(row({ to: 2000000 })), R1)), '100원~100만 원 · 10원 단위');
  ok(/1건짜리/.test(W.checkJob({ id: 'y24p-t2', rows: [row(), row({ rid: 'y24p|300000002', rk: 'k2', no: '300000002' })] }, { ok1: null, rk: {} })), '처음 한 건이 확인되기 전엔 1건만(다른 쓰기와 같은 문)');
  ok(W.isDone({ kind: 'price', to: 9000 }, { price: 9000 }) && !W.isDone({ kind: 'price', to: 9000 }, { price: 9100 }) && W.PRICE_JUMP === 0.5, '이미 됨 셈 · 50% 울타리'); }

console.log('③ 웹앱 ◆y24ops 덩어리');
const F = new Function(cut('/* ◆y24ops 시작', '/* ◆y24ops 끝 */') + '\nreturn { Y24OPS_FN, Y24OPS_HOW, y24OpsTodo, y24PriceGuard, y24PriceRow };')();
{ const K = F.Y24OPS_FN.map((f) => f.k); ok(['ack', 'ship', 'cancel', 'qa', 'calc', 'price', 'stop', 'reg'].every((k) => K.includes(k)) && F.Y24OPS_FN.every((f) => f.w && F.Y24OPS_HOW[f.how] && /^\//.test(f.u)), '판매관리 일 8가지 — 웹앱 어디서·어떻게·판매관리 주소', K);
  ok(F.Y24OPS_FN.filter((f) => f.how === 'hand').every((f) => f.why), '사람 손인 일(반품 승인·문의 답)은 왜 사람 손인지 적음');
  const L = F.y24OpsTodo({ ord: 1, noreply: 2, retIn: 1, post: 1 }, { qaNo: 3, retReq: 2 }, { act: 2 }, 'need');
  ok(L[0].k === 'login' && /로그인/.test(L[0].t) && L[0].todo && L.find((x) => x.k === 'ack').n === 2 && L.find((x) => x.k === 'qa').n === 3 && L.find((x) => x.k === 'cancel').n === 2 && L.find((x) => x.k === 'ship') && L.every((x) => x.todo), '할 일 카드: 로그인 풀림이 맨 위 · 주문·문의·반품·발송 지연 수(큰 쪽) · 모두 할 일 글', L.map((x) => x.k));
  ok(F.y24OpsTodo(null, null, null, 'ok').length === 0 && F.y24OpsTodo({}, {}, {}, null).length === 0, '할 일 없으면 빈 목록 · 번외 없는 기기는 로그인 카드 없음');
  const now = Date.parse('2026-11-11T05:00:00Z'); const r = (d) => ({ x: { firstSeenAt: new Date(now - d * 864e5).toISOString() } });
  ok(/진행 중/.test(F.y24PriceGuard(r(200), true, null, now)) && /3개월/.test(F.y24PriceGuard(r(30), false, null, now)) && /14일/.test(F.y24PriceGuard(r(200), false, new Date(now - 5 * 864e5).toISOString(), now)) && F.y24PriceGuard(r(200), false, null, now) === '', '약속 36: 주문 진행 중·등록 3개월 안·14일 안 고친 상품은 제안 안 함');
  const P = F.y24PriceRow('300000001', 'A01SKU1', 9000, 8000, '시험 책', '2026-11-11');
  ok(P.row && P.row.kind === 'price' && P.row.to === 9000 && P.row.rid === 'y24p|300000001' && /price\|300000001\|9000\|20261111/.test(P.row.rk), '💲 맡김 줄 = 번외 쓰기 꼴(kind price · 할 일 열쇠에 값·날짜)', P);
  ok(/자체코드/.test(F.y24PriceRow('300000001', '', 9000, 8000).err) && /10원/.test(F.y24PriceRow('300000001', 'SK', 9005, 8000).err) && /같음/.test(F.y24PriceRow('300000001', 'SK', 8000, 8000).err) && /50%/.test(F.y24PriceRow('300000001', 'SK', 20000, 8000).err) && /상품번호/.test(F.y24PriceRow('x', 'SK', 9000, 8000).err), '맡기기 전 검사: 자체코드 · 10원 단위 · 같은 값 · 50% · 상품번호'); }

console.log('④ 웹앱 글 검사');
{ ok(/data-y24ops="1"[^>]*>🧰 예스24 운영</.test(T) && /function openY24Ops\(\)/.test(T), '상품 탭 › 🟦 예스24 칸에 「🧰 예스24 운영」 → openY24Ops');
  const blk = T.slice(T.indexOf('const Y24OPS_W ='), T.indexOf('setTimeout(y24OpsPoll, 30000);')); ok(/y24Arm\(t, /.test(blk) && /ledY24Guard\(\)/.test(blk) && !/\b(alert|confirm|prompt)\(/.test(blk), '💲 맡기기 = 두 번 누르기 · 로거·MJ-MAIN·출고 보호 문 · 브라우저 창 없음');
  ok(/go: \{ fn: \(\) => openY24Ops\(\) \}/.test(T), '기능 찾기 목록에 🧰 예스24 운영');
  ok(/main: c2yNums\(y\.main\)/.test(T) && /function c2yNums\(o\)/.test(T), 'PC 상태 요약(col2_ctl)엔 첫 화면·운영 화면 숫자만'); }

(async () => {
  if (process.env.RN_SKIP_COL2 !== '1') { console.log('⑤ 실제 흐름(숨은 크롬) — lab/col2/tests/t_y24w.js'); const r = spawnSync(process.execPath, ['tests/t_y24w.js'], { cwd: path.join(ROOT, 'lab', 'col2'), encoding: 'utf8', timeout: 480e3 }); const out = String(r.stdout || '') + String(r.stderr || '');
    ok(r.status === 0 && /⑦ \(11\/11 y24ops1\) 판매가 바꾸기/.test(out) && /모두 통과/.test(out), '판매가 고치기 → 다시 읽어 확인 · 50% 넘음·고칠 수 없는 칸·판매중지 상품은 안 누름(t_y24w ⑦)', out.split('\n').filter((l) => /❌|⑦|모두/.test(l)).slice(0, 8)); }
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tY24OPS1111 ${bad}개 실패` : '✓ tY24OPS1111 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('⑥ 화면 — 가짜 번외 도우미');
  const H = require(path.join(process.cwd(), 'harness.js'));
  await H(async (p) => { try { const dialogs = []; p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
    const FK = { y24: { login: 'need', main: { ord: 1, prep: 0, deliv: 2, done: 5, retIn: 1, dep: 15000, noreply: 2, at: Date.now() }, opsNum: { qaNo: 2, retReq: 1, at: Date.now() }, ops: { at: Date.now() - 60e3, end: Date.now(), stop: null, res: {} }, opsNextMs: 170 * 60e3 }, puts: [], runs: [] };
    await p.route(/^http:\/\/127\.0\.0\.1:8797\//, async (r) => { const u = new URL(r.request().url()); const J = (o, c) => r.fulfill({ status: c || 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(o) });
      if (u.pathname === '/status') return J({ ok: true, y24: FK.y24 }); if (u.pathname === '/y24/run') { FK.runs.push(JSON.parse(r.request().postData() || '{}')); return J({ ok: true, msg: '🧰 운영 화면(반품·문의·정산) 읽기를 곧 시작' }); }
      if (u.pathname === '/y24/w/put') { const b = JSON.parse(r.request().postData() || '{}'); FK.puts.push(b); return J({ ok: true, took: b.id }); } if (u.pathname === '/y24/w/state') return J({ ok: true, res: {}, wait: [], cur: null }); return J({ ok: false }, 404); });
    await p.evaluate(require(path.join(process.cwd(), 'seed.js'))); await p.waitForTimeout(400);
    const setup = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); if (!S.prodLoaded) await loadProducts(); await Wt(300); localStorage.setItem('rn-c2seen', '1'); localStorage.setItem('rn-device', 'HOME'); S.devOk = true;
      S.y24.loaded = true; S.y24.un = S.y24.un || (() => {}); S.y24.lkUn = S.y24.lkUn || (() => {}); S.y24.lk = S.y24.lk || { m: {}, x: {}, seeds: {} }; S.y24.adm = { t: Date.now(), m: new Map() }; S.app.platforms = { y24: {} };
      const old = new Date(Date.now() - 200 * 864e5).toISOString(); [['300000001', '시험 책 하나', 8000, 'A01SKU1'], ['300000002', '시험 책 둘', 12000, 'A01SKU2']].forEach(([no, t, pr, sk]) => { S.y24.list.set(no, { id: no, goodsNo: no, title: t, price: pr, grade: '상', state: '02', stock: 1, firstSeenAt: old, lastSeenAt: new Date().toISOString(), isbn13: '9788900000' + no.slice(-3) }); S.y24.adm.m.set(no, { no, self: sk, price: pr, st: '02', at: new Date().toISOString() }); }); S.y24.ver++;
      openY24Ops(); await Wt(900); const sh = document.getElementById('sheet'); return { on: sh.classList.contains('on'), txt: sh.innerText.slice(0, 3000), btn: sh.querySelectorAll('[data-y24pgo]').length }; });
    ok(setup.on && /예스24 운영/.test(setup.txt) && /로그인/.test(setup.txt) && /미답변 상품 문의 2건/.test(setup.txt) && /반품·교환 요청 1건/.test(setup.txt) && /판매관리 일 — 웹앱 어디서/.test(setup.txt) && /예치금/.test(setup.txt) && setup.btn === 2, '🧰 예스24 운영: 로그인 풀림 카드 · 미답변 문의 · 반품 요청 · 기능 표 · 예치금 · 💲 단추 2개', setup.txt.slice(0, 500));
    if (process.env.RN_SHOT) await p.screenshot({ path: process.env.RN_SHOT, fullPage: false });
    await p.click('[data-y24opsrun]'); await p.waitForTimeout(400); ok(FK.runs.length === 1 && FK.runs[0].what === 'ops', '「🔁 운영 화면 지금 읽기」 → 번외 /y24/run ops');
    await p.fill('[data-y24pto="300000001"]', '8800'); await p.click('[data-y24pgo="300000001"]'); await p.waitForTimeout(300); ok(FK.puts.length === 0, '💲 한 번 누름 = 아직 안 맡김(두 번 누르기)');
    await p.click('[data-y24pgo="300000001"]'); await p.waitForTimeout(800); const pu = FK.puts[0]; ok(pu && pu.rows.length === 1 && pu.rows[0].kind === 'price' && pu.rows[0].to === 8800 && pu.rows[0].self === 'A01SKU1' && pu.rows[0].no === '300000001', '두 번째 누름 → 번외에 판매가 8,800원 맡김(자체코드 = SKU)', pu);
    const after = await p.evaluate(() => document.getElementById('sheet').innerText); ok(/8,800원으로 고치는 중/.test(after), '맡긴 줄에 ⏳ 고치는 중', after.slice(after.indexOf('💲'), after.indexOf('💲') + 400));
    await p.fill('[data-y24pto="300000002"]', '30000'); await p.click('[data-y24pgo="300000002"]'); await p.waitForTimeout(400); ok(FK.puts.length === 1, '50% 넘게 바뀌는 값은 맡기지 않음(까닭 알림)');
    ok(!dialogs.length, '브라우저 창(alert/confirm) 0', dialogs);
    if (process.env.RN_SHOT2) await p.screenshot({ path: process.env.RN_SHOT2, fullPage: false }); } catch (e) { ok(false, '화면 시험 오류', e.message); } });
  console.log(bad ? `❌ tY24OPS1111 ${bad}개 실패` : '✓ tY24OPS1111 모두 통과'); process.exit(bad ? 1 : 0); })();
