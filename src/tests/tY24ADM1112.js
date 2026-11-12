// tY24ADM1112 — (11/12 일꾼 y24adm) 🧰 예스24 판매관리 등록상품 응답 풀기(y24AdmRow)가 실제 칸 이름을 읽는지
//   · 새 칸 이름(11/12 진단 원문): 재고 REM_CNT · 판매상태 GOODS_STAT_GB / GOODS_STAT_GB_NM · 판매가 SALE_PR
//   · 옛 칸 이름(GUIDE.md 1-1): ORD_REMAIN_CNT · SALE_STATE_GB / SALE_STATE_GB_NM · 계속 받음
//   · 칸이 없으면 빈칸(null) · MAN_NO(서가 관리 코드)는 자체코드로 쓰지 않음 · 응답(crm_y24_raw) → y24AdmLoad → y24V 재고·판매완료까지
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tY24ADM1112.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const out = {}; const now = new Date().toISOString(); const pick = (o) => o && { st: o.st, stNm: o.stNm, stock: o.stock, price: o.price, self: o.self };
    out.nw = pick(y24AdmRow({ GOODS_NO: 194904701, EAN: '9791100000031', GOODS_NM: '새 칸 책', GOODS_LEVEL_GB_NM: '상', GOODS_STAT_GB: '02', GOODS_STAT_GB_NM: '판매중', REM_CNT: 2, SALE_PR: 12000, MAN_NO: 'PNKLUX' }, now));
    out.nw0 = pick(y24AdmRow({ GOODS_NO: 194904702, GOODS_STAT_GB: '8', GOODS_STAT_GB_NM: '판매중지', REM_CNT: '0', SALE_PR: '9000' }, now));
    out.old = pick(y24AdmRow({ GOODS_NO: 194904703, SALE_STATE_GB: '04', SALE_STATE_GB_NM: '판매완료', ORD_REMAIN_CNT: 1, ENTR_GOODS_CD: 'd1234', SALE_PRICE: 15000 }, now));
    out.both = pick(y24AdmRow({ GOODS_NO: 194904704, ORD_REMAIN_CNT: 5, REM_CNT: 3, SALE_STATE_GB: '02', GOODS_STAT_GB: '08' }, now));
    out.none = pick(y24AdmRow({ GOODS_NO: 194904705, GOODS_NM: '칸 없는 책', MAN_NO: 'PNKLUX' }, now));
    out.emp = pick(y24AdmRow({ GOODS_NO: 194904706, REM_CNT: '', GOODS_STAT_GB: '', GOODS_STAT_GB_NM: '' }, now));
    // 응답 → 불러오기 → 매물 판단
    const Y = (no, o) => S.y24.list.set(no, { id: no, goodsNo: no, state: '02', stock: 1, grade: '상', price: 40000, firstSeenAt: '2026-10-30T00:00:00.000Z', lastSeenAt: '2026-11-01T00:00:00.000Z', ...o });
    Y('194904711', { title: '새 칸 판매완료' }); Y('194904712', { title: '새 칸 재고 4' }); S.y24.un = () => {}; S.y24.loaded = true;
    await db.collection('crm_y24_raw').doc('adm1').set({ sig: 'POST /api/Product/ProductList', at: now, part: 0, parts: 1, body: JSON.stringify({ PRODUCT_LIST: [
      { GOODS_NO: 194904711, GOODS_STAT_GB: '04', GOODS_STAT_GB_NM: '판매완료', REM_CNT: 0, MAN_NO: 'PNKLUX' }, { GOODS_NO: 194904712, GOODS_STAT_GB: '02', GOODS_STAT_GB_NM: '판매중', REM_CNT: 4, SALE_PR: 8000 }] }) });
    await y24AdmLoad(true); const v1 = y24V(S.y24.list.get('194904711')); const v2 = y24V(S.y24.list.get('194904712'));
    out.load = { n: S.y24.adm && S.y24.adm.m.size, sold: v1.admSold, st1: v1.admSt, self1: v1.self, stock2: v2.stock, st2: v2.admSt };
    return out; });
  ok(r.nw && r.nw.st === '02' && r.nw.stNm === '판매중' && r.nw.stock === 2 && r.nw.price === 12000, '새 칸 이름(REM_CNT·GOODS_STAT_GB(_NM)·SALE_PR)을 읽음', r.nw);
  ok(r.nw && r.nw.self == null, 'MAN_NO(서가 관리 코드)는 자체코드로 쓰지 않음', r.nw);
  ok(r.nw0 && r.nw0.stock === 0 && r.nw0.st === '08' && r.nw0.stNm === '판매중지' && r.nw0.price === 9000, '재고 "0"은 0으로 · 상태 코드는 두 자리로', r.nw0);
  ok(r.old && r.old.st === '04' && r.old.stNm === '판매완료' && r.old.stock === 1 && r.old.self === 'd1234' && r.old.price === 15000, '옛 칸 이름(ORD_REMAIN_CNT·SALE_STATE_GB(_NM)·ENTR_GOODS_CD)도 계속 받음', r.old);
  ok(r.both && r.both.stock === 3 && r.both.st === '08', '두 이름이 함께 오면 새 이름 먼저', r.both);
  ok(r.none && r.none.st == null && r.none.stNm == null && r.none.stock == null && r.none.self == null && r.none.price == null, '칸이 없으면 빈칸', r.none);
  ok(r.emp && r.emp.st == null && r.emp.stNm == null && r.emp.stock == null, '빈 글자 칸도 빈칸', r.emp);
  ok(r.load && r.load.n === 2 && r.load.sold === true && r.load.st1 === '판매완료' && r.load.self1 == null && r.load.stock2 === 4 && r.load.st2 === '판매중', '응답 → 불러오기 → 매물 재고·판매완료 판단이 새 칸으로', r.load);
  console.log(bad ? `✗ tY24ADM1112 실패 ${bad}` : '✓ tY24ADM1112 모두 통과'); process.exitCode = bad ? 1 : 0; });
