// tY24DOWN_1116 — (정밀 점검 11/14 ④·⑦ '위험 2 이중 판매') 🛑 알라딘에서 팔린 책 → 예스24 매물 판매중지 맡김(cloud/y24auto.js downStep)
//   자동 올림과 같은 길: 같은 장부(app_settings/y24_reg r[상품].down) · 같은 실행 주체(col2_y24_cmd → 수집기 wRelay → 맡은 PC 번외 판매중지)
//   ① 팔림 표시(판매완료·수량 0·주문)가 있으면 맡김 · 판매중이면 안 함 · 표시 없이 판매중 아님이면 holdMin분 기다림
//   ② 되풀이 0(장부 상태) · 한 차례 상한 · 하루 상한 · 실패 → gapMin분 뒤 새 열쇠로 · tries번 실패 → 사람 확인
//   ③ 맡긴 일 줄(hold) → 다시 셈 뒤 같은 문서 다시 보냄(at 새로 — 수집기 W_STALE) · 알라딘에 다시 판매중이면 닫음
//   ④ 겹침 막기: 통합 장부 자동 내림 기록(omni_auto.c) · 끝나지 않은 예스24 쓰기 맡김(같은 번호) · 웹앱 y24PFind가 이 줄을 클라우드에 맡김
//   ⑤ 예스24가 이미 판매중 아님 · 예스24에서 팔림 → '이미' · 맡은 PC가 아니면 안 함 · 로거·MJ-MAIN 안 함 · 자동 올림을 꺼도 돎 · 대량 막이
//   ⑥ 만든 맡김을 번외 실행 주체 검사(lab/col2/helper/col2-y24w.js checkJob)가 받음 · 상태 한 줄(autoSt._ALSOLD)
// 실행: node src/tests/tY24DOWN_1116.js · 지어낸 자료(손님 정보 없음) · 실제 Firebase·예스24에 아무 요청도 안 함(가짜 저장소)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const TOP = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(TOP, f), 'utf8');
const { makeDb } = require(path.join(TOP, 'lab/col2/tests/fakefs-admin.js'));
const { makeY24Auto, downCfg, DOWN_DEF } = require(path.join(TOP, 'cloud/y24auto.js'));
const { checkJob } = require(path.join(TOP, 'lab/col2/helper/col2-y24w.js'));
const noNet = { getText: async () => { throw new Error('시험 — 공용 셈 덩어리 안 받음'); }, getUrl: async () => { throw new Error('시험 — 바깥 안 감'); } };
const ST = () => ({ login: 'ok', hold: false, en: true });
function world(T0) { let T = Date.parse(T0); const now = () => T; const F = makeDb(); const { store } = F;
  const put = (c, id, v) => { (store[c] = store[c] || {})[id] = JSON.parse(JSON.stringify(v)); };
  put('app_settings', 'main', { reg: { srcX: [] } }); put('app_settings', 'platforms', { y24: {} }); put('app_settings', 'ship_auto', {}); put('app_settings', 'y24_link', { m: {}, x: {} }); put('app_settings', 'sku_seq', { mapN: 0 }); put('app_settings', 'sku_map_0', { m: {} });
  const logs = []; const Y = makeY24Auto({ db: F.db, C: F.C, FV: F.FV, now, log: (...a) => logs.push(a.join(' ')), ...noNet });
  return { F, store, put, Y, now, adv: (ms) => { T += ms; }, led: () => store.app_settings.y24_reg || {}, cmds: () => Object.entries(store.col2_y24_cmd || {}) }; }
const Lst = (W, id, x) => W.put('prd_listings', 'aladin_' + id, { listingId: 7000 + id.length, usedCode: id, title: '시험 책 ' + id, isbn13: '97889000' + String(id.replace(/\D/g, '')).padStart(5, '0'), grade: '상', price: 5000, qty: 1, active: true, status: '판매중', lastSeenAt: '2026-11-15T00:00:00Z', ...(x || {}) });
const Led = (lid, gno, x) => ({ [lid]: { lid, title: '시험 책 ' + lid, isbn: '9788900000011', st: 'sent', ok: 1, gno, skus: ['ABC_' + lid.slice(7) + 'x'], at: '2026-11-10T00:00:00Z', ...(x || {}) } });
(async () => {
  /* 0 — 설정 기본값 · 상한 */
  ok(DOWN_DEF.on === 1 && DOWN_DEF.day === 30 && DOWN_DEF.run === 3 && DOWN_DEF.gapMin === 30 && DOWN_DEF.tries === 3, '0 기본 = 켬 · 하루 30건 · 한 차례 3건 · 실패 뒤 30분 · 3번이면 사람', DOWN_DEF);
  const c1 = downCfg({ y24: { down: { day: 9999, run: 0, on: 0 } } }); ok(c1.day === 200 && c1.run === 1 && c1.on === 0, '0 ⚙ platforms.y24.down 값은 상한 안으로 자름(하루 ≤200 · 한 차례 ≥1)', c1);

  /* 1 — 한 세상: 여러 경우 */
  const W = world('2026-11-16T03:00:00Z'); const { put, Y, store } = W;
  Lst(W, 'B1', { status: '판매완료', qty: 0, active: false }); /* 알라딘에서 팔림 */
  Lst(W, 'B2'); /* 아직 판매중 — 내리면 안 됨 */
  Lst(W, 'B3', { status: '일시판매중지' }); put('prd_stop_reasons', 'aladin_B3', { reason: 'keep', note: '보관' }); /* 팔림 표시 없음 — holdMin 기다림 */
  Lst(W, 'B4', { status: '판매중지' }); put('prd_stop_reasons', 'aladin_B4', { reason: 'elsewhere', note: '예스24 주문으로 팔림' }); /* 예스24에서 팔림 */
  Lst(W, 'B5', { status: '판매완료', qty: 0 }); /* 예스24 관리자 목록에서 이미 판매중지(08) */
  Lst(W, 'B6', { status: '판매완료', qty: 0 }); /* 통합 장부 자동 내림이 이미 맡음 */
  Lst(W, 'B7', { status: '판매완료', qty: 0 }); /* 끝나지 않은 예스24 쓰기 맡김이 있음 */
  Lst(W, 'B9', { lastSeenAt: '2026-11-15T00:00:00Z' }); put('crm_orders', 'aladin_O9', { kind: 'sale', platform: 'aladin', orderedAt: '2026-11-15T09:00:00Z', orderNo: 'O9', items: [{ listingKey: 'aladin_B9', lineStatus: 'normal' }] }); /* 올린 뒤 주문 — 목록은 아직 판매중 */
  Lst(W, 'B11', { status: '판매완료', qty: 0 }); Lst(W, 'B12', { status: '판매완료', qty: 0 });
  Lst(W, 'B13', { status: '판매완료', qty: 0 }); put('crm_orders', 'yes24_O13', { kind: 'sale', platform: 'yes24', orderedAt: '2026-11-15T10:00:00Z', orderNo: 'O13', items: [{ listingKey: 'aladin_B13', lineStatus: 'normal' }] }); /* 예스24 주문으로 팔림 */
  put('app_settings', 'y24_reg', { auto: { stop: { why: '시험 — 자동 올림 멈춤' } }, r: { ...Led('aladin_B1', '300000001'), ...Led('aladin_B2', '300000002'), ...Led('aladin_B3', '300000003'), ...Led('aladin_B4', '300000004'), ...Led('aladin_B5', '300000005'), ...Led('aladin_B6', '300000006'), ...Led('aladin_B7', '300000007'),
    ...Led('aladin_B8', null, { skus: [] }), ...Led('aladin_B9', '300000009'), ...Led('aladin_B10', '300000010', { st: 'auto' }), ...Led('aladin_B11', '300000011'), ...Led('aladin_B12', '300000012'), ...Led('aladin_B13', '300000013') } });
  put('crm_y24_raw', 'adm1', { sig: 'POST /api/Product/ProductList', at: '2026-11-16T02:00:00Z', body: JSON.stringify({ PRODUCT_LIST: [{ GOODS_NO: '300000005', GOODS_STAT_GB: '08' }, { GOODS_NO: '300000001', GOODS_STAT_GB: '02' }] }) });
  put('app_settings', 'omni_auto', { c: { k6: { ch: 'yes24', no: '300000006', st: 'sent', at: '2026-11-16T01:00:00Z' }, kOld: { ch: 'yes24', no: '300000011', st: 'sent', at: '2026-11-01T01:00:00Z' } } }); /* B11 기록은 3일 넘음 — 겹침 아님 */
  put('col2_y24_cmd', 'webjob7', { k: 'w', st: 'hold', holder: 'HOME', at: '2026-11-16T02:30:00Z', job: { id: 'webjob7', rows: [{ rid: 'ABC_B7x|300000007', rk: 'ABC_B7x|300000007|stop||x', no: '300000007', kind: 'stop' }] } });
  const n0 = Object.keys(store.col2_y24_cmd).length;

  /* 1-a 로거·MJ-MAIN·맡은 PC가 아님 → 맡김 0 · 장부 손대지 않음 */
  let y = await Y.step('LOGGER-1', { st: ST() }); ok(!y.down && Object.keys(store.col2_y24_cmd).length === n0, '⑤ 로거 PC 차례엔 팔린 책 내림도 안 함', y.down);
  y = await Y.step('MJ-MAIN', { st: ST() }); ok(!y.down && Object.keys(store.col2_y24_cmd).length === n0, '⑤ MJ-MAIN(출고 PC) 차례엔 안 함', y.down);
  const regOf = () => JSON.stringify({ ...W.led(), autoSt: undefined }); const regBefore = regOf(); y = await Y.step('OFFICE2', { st: ST() }); ok(y.down && /맡은 PC\(HOME\)가 아님/.test(y.down.why) && Object.keys(store.col2_y24_cmd).length === n0 && regOf() === regBefore && !(W.led().autoSt || {})._ALSOLD, '⑤ 맡은 PC(기본 HOME)가 아니면 안 함 · 장부·팔린 책 상태 글도 안 씀(그 PC의 자동 올림 상태 칸 CLOUD_<PC>만 예전처럼)', y.down);

  /* 1-b 로그인 전 → 새 맡김 미룸 */
  y = await Y.step('HOME', { st: { ...ST(), login: 'need' } }); ok(y.down && /로그인 기다림/.test(y.down.why) && Object.keys(store.col2_y24_cmd).length === n0, '⑤ 예스24 로그인 전이면 새 판매중지 맡김을 미룸', y.down && y.down.why);
  ok(W.led().r.aladin_B4.down && W.led().r.aladin_B4.down.st === 'already' && /예스24에서 팔림/.test(W.led().r.aladin_B4.down.why), '⑤ 예스24에서 팔린 책(판매중지 까닭 elsewhere·예스24) → 맡기지 않고 already', W.led().r.aladin_B4.down);
  ok(W.led().r.aladin_B5.down && W.led().r.aladin_B5.down.st === 'already' && /이미 판매중 아님\(08\)/.test(W.led().r.aladin_B5.down.why), '⑤ 예스24 관리자 목록이 이미 판매중지(08) → already', W.led().r.aladin_B5.down);
  ok(W.led().r.aladin_B13.down && W.led().r.aladin_B13.down.st === 'already' && /예스24 주문/.test(W.led().r.aladin_B13.down.why), '⑤ 예스24 주문으로 팔린 책 → already', W.led().r.aladin_B13.down);

  /* 1-c 첫 차례 — 자동 올림이 멈춰 있어도(auto.stop) 돎 · 한 차례 상한 3 */
  W.adv(121e3); y = await Y.step('HOME', { st: ST() }); const d1 = y.down || {};
  const sentL = () => Object.entries(W.led().r).filter(([, e]) => e.down && e.down.st === 'sent').map(([k]) => k).sort();
  ok(d1.sent === 3 && d1.jobs.length === 3, '② 한 차례 상한 3건(⚙ run) — 그 넘는 것은 다음 차례', d1);
  ok(sentL().includes('aladin_B9') && sentL().includes('aladin_B1'), '① 올린 뒤 주문 들어온 B9(목록은 아직 판매중)·팔린 B1이 먼저 맡겨짐', sentL());
  ok(!sentL().includes('aladin_B2') && !(W.led().r.aladin_B2.down), '① 알라딘에 아직 판매중인 B2는 손대지 않음', W.led().r.aladin_B2);
  ok(!(W.led().r.aladin_B10.down), '① 장부에서 아직 올라가지 않은 줄(st auto)은 대상 아님');
  ok(!W.led().r.aladin_B3.down || W.led().r.aladin_B3.down.st !== 'sent', '① 팔림 표시 없이 일시판매중지(B3 보관)는 holdMin분 전엔 맡기지 않음', W.led().r.aladin_B3.down);
  ok(!(W.led().r.aladin_B6.down && W.led().r.aladin_B6.down.st === 'sent') && !(W.led().r.aladin_B7.down && W.led().r.aladin_B7.down.st === 'sent'), '④ 통합 장부 자동 내림이 맡은 B6 · 끝나지 않은 예스24 쓰기 맡김이 있는 B7은 건너뜀(두 번 내리지 않음)', { b6: W.led().r.aladin_B6.down, b7: W.led().r.aladin_B7.down });
  ok(store.col2_y24_cmd.webjob7.st === 'hold' && !store.col2_y24_cmd.webjob7.sentBy, '④ 웹앱이 맡긴 B7 문서는 그대로(클라우드가 건드리지 않음)', store.col2_y24_cmd.webjob7);
  ok(W.led().r.aladin_B8.down == null, '⑤ 예스24 번호를 모르는 줄(B8)은 맡기지 않음');
  const J = d1.jobs.map((id) => store.col2_y24_cmd[id]); const j0 = J[0] || {};
  ok(J.every((v) => v && v.k === 'w' && v.st === 'new' && v.holder === 'HOME' && v.src === 'alsold' && v.job.rows.length === 1 && v.job.rows[0].kind === 'stop' && v.job.rows[0].src === 'alsold' && v.at === new Date(W.now()).toISOString()), '⑥ 맡김 문서 = 웹앱 y24WSend와 같은 꼴(k w · st new · holder · at 지금) · 한 줄 · 종류 stop', J);
  ok(J.every((v) => checkJob(v.job, { ok1: 0, rk: {} }) === ''), '⑥ 번외 실행 주체 검사(col2-y24w checkJob — 처음 한 건 전에도)가 받음', J.map((v) => checkJob(v.job, { ok1: 0, rk: {} })));
  ok(J.every((v) => !/보내기 직전에 다시 셈/.test(JSON.stringify(v))), '⑥ 수집기 wReNos 다시 보냄 글(「보내기 직전에 다시 셈」)을 쓰지 않음');
  const rB1 = (store.col2_y24_cmd[W.led().r.aladin_B1.down.job].job.rows[0]); ok(rB1.rid === 'ABC_B1x|300000001' && rB1.self === 'ABC_B1x' && rB1.no === '300000001', '④ 줄 열쇠 rid = 웹앱 ledY24Row와 같은 꼴(SKU 첫 값|번호) → 웹앱 y24PRid가 이 맡김을 보고 다시 맡기지 않음', rB1);
  const AS1 = W.led().autoSt && W.led().autoSt._ALSOLD; ok(AS1 && /3건 예스24 판매중지 맡김/.test(AS1.why) && AS1.dayN === 3 && AS1.dayMax === 30 && AS1.pc === 'HOME', '⑥ 상태 한 줄 autoSt._ALSOLD(웹앱 y24AutoLine이 보임)', AS1);
  ok(W.led().downDay && W.led().downDay.n === 3, '② 하루 셈(downDay)이 장부에 남음', W.led().downDay);

  /* 1-d 같은 차례 바로 또 부름 → everyS 안 — 아무것도 안 함 · 시간이 지나도 이미 맡긴 것은 되풀이 0 */
  let nC = W.cmds().length; y = await Y.step('HOME', { st: ST() }); ok(y.down && y.down.skip && W.cmds().length === nC, '② everyS초 안에 다시 부르면 그냥 지나감', y.down);
  put('app_settings', 'platforms', { y24: { down: { day: 4 } } }); W.adv(121e3); y = await Y.step('HOME', { st: ST() });
  ok(y.down.sent === 1 && W.cmds().length === nC + 1, '② 다음 차례 — 남은 1건만 · 이미 맡긴 3건은 다시 안 맡김(장부 down.st sent)', y.down);
  const all4 = sentL(); ok(all4.length === 4 && ['aladin_B1', 'aladin_B9', 'aladin_B11', 'aladin_B12'].every((k) => all4.includes(k)), '① 팔린 4권(B1·B9·B11·B12) 모두 맡김 · B11의 3일 넘은 통합 장부 기록은 겹침이 아님', all4);

  /* 1-e holdMin 지나면 B3(보관 일시판매중지)도 → 그런데 하루 상한(4)에 걸림 */
  W.adv(11 * 60e3); nC = W.cmds().length; y = await Y.step('HOME', { st: ST() });
  ok(W.cmds().length === nC && /오늘 판매중지 상한 4건을 다 씀/.test(y.down.why) && W.led().downDay.n === 4, '② 하루 상한(⚙ day=4)을 다 쓰면 더 맡기지 않고 상태 글로 알림', y.down.why);
  put('app_settings', 'platforms', { y24: {} }); W.adv(121e3); y = await Y.step('HOME', { st: ST() });
  ok(W.led().r.aladin_B3.down && W.led().r.aladin_B3.down.st === 'sent' && /10분 넘게/.test(W.led().r.aladin_B3.down.why), '① 팔림 표시 없이 판매중 아님이 holdMin(10분) 넘게 이어지면 맡김', W.led().r.aladin_B3.down);

  /* 2 — 결과 받기: 성공 · 실패(간격 뒤 새 열쇠) · 3번이면 사람 · 맡긴 일 줄(hold) 다시 보냄 · 다시 판매중이면 닫음 */
  const dn = (lid) => W.led().r[lid].down; const cmd = (lid) => store.col2_y24_cmd[dn(lid).job];
  cmd('aladin_B1').st = 'done'; cmd('aladin_B1').res = { state: 'done', rows: { [dn('aladin_B1').rid]: { state: 'done', msg: '판매중지 됨' } } };
  const j9a = dn('aladin_B9').job; const rk9a = dn('aladin_B9').rk; cmd('aladin_B9').st = 'done'; cmd('aladin_B9').res = { state: 'fail', msg: '예스24 판매관리에서 그 상품을 못 찾음' };
  const j11 = dn('aladin_B11').job; Object.assign(store.col2_y24_cmd[j11], { st: 'hold', retryAt: new Date(W.now() - 60e3).toISOString(), at: '2026-11-16T03:00:00.000Z', reN: 1 });
  const j12 = dn('aladin_B12').job; Object.assign(store.col2_y24_cmd[j12], { st: 'hold', retryAt: new Date(W.now() - 60e3).toISOString() }); Lst(W, 'B12'); /* B12 — 알라딘에 다시 판매중(반품 들어와 다시 올림) */
  W.adv(121e3); y = await Y.step('HOME', { st: ST() });
  ok(dn('aladin_B1').st === 'done', '② 번외 결과 done → 장부 down done(끝 · 다시 안 함)', dn('aladin_B1'));
  ok(dn('aladin_B9').st === 'fail' && Date.parse(dn('aladin_B9').nextAt) - W.now() > 29 * 60e3, '② 실패 → fail · 다음 시도 30분 뒤(gapMin)', dn('aladin_B9'));
  const c11 = store.col2_y24_cmd[j11]; ok(c11.st === 'new' && c11.at === new Date(W.now()).toISOString() && c11.tries === 1 && c11.holder === 'HOME' && /다시 보냄/.test(JSON.stringify(c11.trail)), '③ 맡긴 일 줄(hold · 다시 시도 때 지남) → 다시 셈 뒤 같은 문서를 st new · at 새로(수집기 30분 묵음 막이) · tries+1', c11);
  const c12 = store.col2_y24_cmd[j12]; ok(c12.st === 'done' && c12.res.state === 'already' && dn('aladin_B12').st === 'cancel', '③ 다시 셀 때 알라딘에 다시 판매중이면 예스24를 내리지 않고 그 맡김을 닫음 · 장부 cancel', { c12, d: dn('aladin_B12') });
  W.adv(121e3); nC = W.cmds().length; y = await Y.step('HOME', { st: ST() }); ok(W.cmds().length === nC && dn('aladin_B9').job === j9a, '② 실패 뒤 30분 안엔 다시 맡기지 않음', dn('aladin_B9'));
  W.adv(31 * 60e3); y = await Y.step('HOME', { st: ST() });
  ok(dn('aladin_B9').st === 'sent' && dn('aladin_B9').job !== j9a && dn('aladin_B9').n === 2 && dn('aladin_B9').rk !== rk9a && dn('aladin_B9').rid === 'ABC_B9x|300000009', '② 30분 뒤 새 맡김(새 rk — 번외 되풀이 0에 안 걸림 · 같은 rid) · n 2', dn('aladin_B9'));
  ok(checkJob(cmd('aladin_B9').job, { ok1: 1, rk: { [rk9a]: 1 } }) === '', '⑥ 다시 맡긴 줄도 번외 검사 통과(옛 rk가 기록돼 있어도)');
  for (let i = 0; i < 2; i++) { cmd('aladin_B9').st = 'done'; cmd('aladin_B9').res = { state: 'fail', msg: '못 찾음' }; W.adv(121e3); await Y.step('HOME', { st: ST() }); if (dn('aladin_B9').st === 'fail') { W.adv(31 * 60e3); await Y.step('HOME', { st: ST() }); } }
  ok(dn('aladin_B9').st === 'human' && /3번 못 내림/.test(dn('aladin_B9').why), '② 3번(⚙ tries) 실패 → 사람 확인(human) · 더 맡기지 않음', dn('aladin_B9'));
  nC = W.cmds().length; W.adv(3 * 3600e3); await Y.step('HOME', { st: ST() }); ok(W.cmds().length === nC, '② 사람 확인 줄은 시간이 지나도 다시 맡기지 않음');
  ok(/사람 확인 1/.test(JSON.stringify(W.led().autoSt._ALSOLD)) || W.led().autoSt._ALSOLD.human >= 1, '⑥ 상태 글에 사람 확인 건수', W.led().autoSt._ALSOLD);
  /* 2-b 알라딘에 다시 올라간 책(B1) → 장부 down이 live로 돌아가 다음에 팔리면 다시 내릴 수 있음 */
  Lst(W, 'B1'); W.Y._M.dataAt = 0; W.adv(2 * 3600e3); await Y.step('HOME', { st: ST() }); ok(dn('aladin_B1').st === 'live' && dn('aladin_B1').prev === 'done', '② 다시 판매중이 된 책은 장부 down live(다음에 팔리면 다시 내림)', dn('aladin_B1'));

  /* 3 — 꺼 둠 · 예스24 꺼 둠 */
  put('app_settings', 'platforms', { y24: { down: { on: 0 } } }); W.adv(121e3); nC = W.cmds().length; y = await Y.step('HOME', { st: ST() }); ok(/꺼 둠/.test(y.down.why) && W.cmds().length === nC && /꺼 둠/.test(W.led().autoSt._ALSOLD.why), '⑤ ⚙ platforms.y24.down.on = 0 → 꺼 둠(상태 글에도)', y.down);
  put('app_settings', 'platforms', { y24: { off: 1 } }); W.adv(121e3); y = await Y.step('HOME', { st: ST() }); ok(!y.down, '⑤ 예스24 꺼 둠(⚙ y24.off)이면 내림도 안 함');

  /* 4 — 대량 막이 · 알라딘 판매중 목록이 비면 멈춤 */
  const W2 = world('2026-11-16T03:00:00Z'); Lst(W2, 'K0'); const R2 = {}; for (let i = 1; i <= 50; i++) { Lst(W2, 'K' + i, { status: '판매완료', qty: 0 }); Object.assign(R2, Led('aladin_K' + i, String(400000000 + i))); } W2.put('app_settings', 'y24_reg', { r: R2 });
  y = await W2.Y.step('HOME', { st: ST() }); ok(!W2.cmds().length && /한꺼번에 너무 많음/.test(y.down.why), '⑥ 대량 막이 — 후보가 40(⚙ trip)을 넘고 올린 줄 절반을 넘으면 하나도 안 맡기고 멈춤', y.down);
  const W3 = world('2026-11-16T03:00:00Z'); Lst(W3, 'Z1', { status: '판매완료', qty: 0 }); W3.put('app_settings', 'y24_reg', { r: Led('aladin_Z1', '500000001') });
  y = await W3.Y.step('HOME', { st: ST() }); ok(!W3.cmds().length && /판매중 목록이 비어/.test(y.down.why), '⑥ 알라딘 판매중 목록이 비면(자료 덜 옴) 안 맡김', y.down);

  /* 5 — 웹앱 쪽: 이 줄(src alsold)은 클라우드에 맡김 · 상태 한 줄은 읽기만 */
  const H = rd('src/app.html'); ok(/if \(src === 'alsold'\) return 'wait';/.test(H), "④ 웹앱 y24PFind — src 'alsold'는 'wait'(웹앱이 보내지도 닫지도 않음 · 클라우드가 맡음)");
  ok(/autoSt\) \|\| \{\}\)\._ALSOLD/.test(H) && /팔린 책 예스24 내림/.test(H), '⑥ 웹앱 y24AutoLine — 클라우드 상태 한 줄을 보임');
  const src = rd('cloud/y24auto.js'); const blk = src.slice(src.indexOf('const msOf = (v)'), src.indexOf('/* 한 차례 — pc =')); ok(blk.length > 5000 && !/fetch\(|getUrl|getText|https?:\/\/[^'"]*yes24/i.test(src.slice(src.indexOf('const msOf = (v)'), src.indexOf('/* 한 차례 — pc ='))), '지킴 — 팔린 책 내림 코드는 예스24에 직접 요청하지 않음(번외 실행 주체만)');
  /* 7 — (합동 검토 「고친 뒤 내기」) 큰 켜 캐시(판매중 상품 45분)가 묵어도 주문 신호 없이 알라딘에서 방금 팔린 책은 10분 안에 판매중지 후보가 되고 맡겨짐 — 판매 상태만 작은 켜(바뀐 줄만)로 */
  { const W7 = world('2026-11-16T03:00:00Z'); const S = W7.store; Lst(W7, 'S1'); Lst(W7, 'S2'); Lst(W7, 'S3'); Lst(W7, 'K0');
    W7.put('app_settings', 'y24_reg', { r: { ...Led('aladin_S1', '600000001'), ...Led('aladin_S2', '600000002'), ...Led('aladin_S3', '600000003') } });
    const stamp = (id) => { S.prd_listings[id].uploadedAt = new Date(W7.now()); }; /* 운영 = 서버 시각(serverTimestamp) */
    let y = await W7.Y.step('HOME', { st: ST() }); const big0 = W7.Y._M.bigAt; ok(big0 > 0 && !W7.cmds().length, '7 첫 차례 — 큰 켜를 읽어 둠 · 팔린 책 없음', y.down);
    W7.adv(20 * 60e3); y = await W7.Y.step('HOME', { st: ST() }); ok(!W7.cmds().length && y.down && y.down.fresh && y.down.fresh.via === 'delta', '7 20분 뒤 — 작은 켜(바뀐 줄만)를 읽음 · 아직 팔린 책 없음', y.down);
    const tSold = W7.now(); Object.assign(S.prd_listings.aladin_S1, { status: '판매완료', qty: 0, active: false }); stamp('aladin_S1'); /* 작은 켜를 읽은 바로 뒤 알라딘에서만 팔림(주문 신호 없음) — 가장 나쁜 때 */
    Object.assign(S.prd_listings.aladin_S2, { price: 5500 }); stamp('aladin_S2'); /* 값만 바뀜 — 판매중 그대로 */
    let tSent = 0; for (let k = 0; k < 10 && !tSent; k++) { W7.adv(121e3); y = await W7.Y.step('HOME', { st: ST() }); if (W7.led().r.aladin_S1.down && W7.led().r.aladin_S1.down.st === 'sent') tSent = W7.now(); }
    ok(tSent && tSent - tSold <= 10 * 60e3, '7 알라딘에서 방금 팔린 S1 → 10분 안에 판매중지 맡김(큰 켜 45분을 기다리지 않음)', { 분: tSent ? (tSent - tSold) / 60e3 : null, down: y.down });
    ok(W7.Y._M.bigAt === big0 && tSent - big0 < 45 * 60e3, '7 그동안 큰 켜는 다시 읽지 않음(묵은 채) — 작은 켜가 잡음', { big0, bigAt: W7.Y._M.bigAt });
    const j1 = tSent ? S.col2_y24_cmd[W7.led().r.aladin_S1.down.job] : null; ok(j1 && j1.job.rows[0].no === '600000001' && /판매완료/.test(JSON.stringify(j1)), '7 맡김은 맡기기 전 새로 읽은 판매완료 근거로', j1);
    ok(!W7.led().r.aladin_S2.down && !W7.led().r.aladin_S3.down, '7 값만 바뀐 S2 · 그대로인 S3는 내리지 않음(판매중)', { s2: W7.led().r.aladin_S2.down, s3: W7.led().r.aladin_S3.down });
    ok(W7.Y._M.big.idx.get('aladin_S1').status === '판매완료' && +W7.Y._M.big.idx.get('aladin_S2').price === 5500, '7 큰 켜의 그 줄도 새 값으로 바뀜(자동 올림 차례도 같은 값)');
    /* 7-b 바뀐 줄 읽기가 실패하면(색인 없음 등) → 올린 책 중 판매중으로 보이는 것만 한 권씩 */
    const orig = W7.F.db.collection; W7.F.db.collection = (c) => { const r = orig(c); if (c !== 'prd_listings') return r; return { ...r, where: (k, ...a) => { if (k === 'uploadedAt') throw new Error('시험 — 바뀐 줄 읽기 실패'); return r.where(k, ...a); } }; };
    Object.assign(S.prd_listings.aladin_S3, { qty: 0, status: '판매완료' }); /* uploadedAt도 안 찍힘 */
    let tS3 = 0; const t3 = W7.now(); for (let k = 0; k < 10 && !tS3; k++) { W7.adv(121e3); y = await W7.Y.step('HOME', { st: ST() }); if (W7.led().r.aladin_S3.down && W7.led().r.aladin_S3.down.st === 'sent') tS3 = W7.now(); }
    ok(tS3 && tS3 - t3 <= 10 * 60e3 && y.down.fresh && /^doc/.test(y.down.fresh.via), '7-b 바뀐 줄 읽기 실패 → 올린 책을 한 권씩 다시 읽어 S3도 10분 안에 맡김', { 분: tS3 ? (tS3 - t3) / 60e3 : null, fresh: y.down && y.down.fresh });
    ok(!W7.led().r.aladin_S2.down, '7-b 한 권씩 다시 읽어도 판매중인 S2는 그대로');
    W7.F.db.collection = orig;
    /* 7-c 바뀐 줄이 너무 많으면(수집기 몰아 쓰기 · 상한 = max(100, 올린 책)) → 올린 책을 콕 집어 읽음 */
    for (let i = 0; i < 120; i++) { Lst(W7, 'Z' + String(i).padStart(3, '0')); stamp('aladin_Z' + String(i).padStart(3, '0')); }
    W7.adv(121e3); await W7.Y.step('HOME', { st: ST() }); /* 몰아 쓴 줄을 한 번 지나 보냄 */
    Object.assign(S.prd_listings.aladin_S2, { qty: 0, status: '판매완료' }); for (let i = 0; i < 120; i++) stamp('aladin_Z' + String(i).padStart(3, '0'));
    let tS2 = 0; const t2 = W7.now(); for (let k = 0; k < 10 && !tS2; k++) { W7.adv(121e3); y = await W7.Y.step('HOME', { st: ST() }); if (W7.led().r.aladin_S2.down && W7.led().r.aladin_S2.down.st === 'sent') tS2 = W7.now(); }
    ok(tS2 && tS2 - t2 <= 10 * 60e3 && y.down.fresh && /바뀐 줄 \d+\+/.test(y.down.fresh.via) && y.down.fresh.reads <= 100 + 3, '7-c 바뀐 줄이 상한(100)을 넘으면 올린 책만 콕 집어 읽어 S2도 10분 안에 맡김 · 한 차례 읽기 ≤ 상한 + 올린 책', { 분: tS2 ? (tS2 - t2) / 60e3 : null, fresh: y.down && y.down.fresh }); }
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
