// tY24 — 정범님 11/02: 🟦 예스24 연결 표 · 880 바코드 ↔ 알라딘 978 · 사람 기록(판매종료·재고·19금·전시제한) · 이중 판매 알림 · 관리자 화면 응답 풀기 · 자체코드 1줄 시험 엑셀 판정
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const L = (id, o) => S.plist.set('aladin_' + id, { id: 'aladin_' + id, usedCode: id, listingId: 'L' + id, status: '판매중', active: true, qty: 1, grade: '상', price: 30000, sku: 'PNKLUX', ...o });
    L('U045788903', { title: '[블루레이] 바케모노가타리 Vol.1', isbn13: '9789154133123', sku: 'KHKDVD', qty: 3 });
    L('U915484122', { title: '국부론', isbn13: '9791139716474', status: '판매완료', active: false });
    L('U100000001', { title: '팔린 책', isbn13: '9791100000017', status: '판매완료', active: false });
    L('U335484122', { title: '슬로모션을 다시 한번 2', isbn13: '9791164123247', grade: '최상' });
    L('U415261863', { title: 'THE FOOD LAB', isbn13: '9788931455625' }); L('U755484918', { title: 'THE FOOD LAB 다른 판', isbn13: '9788931455625', price: 180000 });
    L('U200000001', { title: '예스24에서 팔린 책', isbn13: '9791100000024' });
    S.sku.seqUn = () => {}; S.sku.map.set('aladin_U335484122', { c: ['d3120'] }); S.sku.map.set('aladin_U045788903', { c: ['d1001', 'd1002', 'd1003'] }); S.ver++;
    const now = new Date().toISOString(); const old = '2026-10-30T00:00:00.000Z';
    const Y = (no, o) => S.y24.list.set(no, { id: no, goodsNo: no, state: '02', stock: 1, grade: '상', price: 40000, firstSeenAt: old, lastSeenAt: now, isbnTried: old, ...o });
    Y('194904678', { title: '[블루레이] 바케모노가타리 Vol.1', isbn13: '8809154133129', stock: 3 }); Y('194904684', { title: '국부론', isbn13: '9791139716474' }); Y('194904699', { title: '팔린 책', isbn13: '9791100000017' });
    Y('194904680', { title: '슬로모션을 다시 한번 2', isbn13: '9791164123247', grade: '최상' }); Y('194904688', { title: 'THE FOOD LAB', isbn13: '9788931455625', stock: 14 });
    Y('194904689', { title: '', isbn13: null, stock: 3 }); Y('195000001', { title: '예스24에서 팔린 책', isbn13: '9791100000024', goneAt: now });
    S.y24.un = () => {}; S.y24.loaded = true; S.y24.ver = (S.y24.ver || 0) + 1;
    // ① 사람 기록(정범님 11/02)이 Firestore에 한 번 들어감 · 덮지 않음
    y24LkWatch(); await W(800); const lk = (FS.app_settings || {}).y24_link || {}; out.seed = { ended: (lk.m || {})['194904684'] && lk.m['194904684'].ended, food: (lk.m || {})['194904688'] && lk.m['194904688'].stock, x: Object.keys(lk.x || {}).length, by: ((lk.m || {})['194904684'] || {}).by, seeds: !!(lk.seeds || {}).seed1102 };
    await db.collection('app_settings').doc('y24_link').set({ m: { 194904688: { stock: 2 } }, seeds: {} }, { merge: true }); await W(300); await y24SeedPut(); await W(300); out.keep = ((FS.app_settings.y24_link.m || {})['194904688'] || {}).stock;
    await db.collection('app_settings').doc('y24_link').set({ m: { 194904688: { stock: 1 } } }, { merge: true }); await W(400);
    // ② 바코드 맞추기 · 연결 분류
    out.isbn = y24Isbn('8809154133129'); const R = y24LinkAll(); const by = (no) => R.find((x) => x.x.goodsNo === no) || {};
    out.blu = by('194904678').cls; out.bluSku = by('194904678').skus.join(','); out.kook = by('194904684').flags.join('|'); out.kookLive = by('194904684').live; out.sold = by('194904699').flags[0];
    out.slow = by('194904680').cls + ':' + by('194904680').skus.join(','); out.food = by('194904688').cls + ':' + by('194904688').v.stock + ':' + by('194904688').flags.includes('orange');
    out.rev = by('195000001').flags.join('|'); out.xrows = R.filter((x) => x.x._x).length; out.adult = R.filter((x) => x.v.adult).length; out.restrict = R.filter((x) => x.v.restrict).length; out.mado = (R.find((x) => x.x._x && /마도정병/.test(x.v.title)) || {}).live;
    out.chan = chansOfL(S.plist.get('aladin_U045788903')).map((c) => c.k).join(',');
    // ③ 홈 알림
    const A = []; y24DupAlerts((lv, t, key, x) => A.push({ lv, t, key, x })); out.alerts = A.map((a) => a.lv + ':' + a.key + ':' + a.x.n);
    // ④ 관리자 화면 응답 풀기
    const ar = y24AdmRow({ GOODS_NO: 194904689, EAN: '9791133424672', GOODS_NM: '새여동생 마왕의 계약자 9', AGE_LMT_YN: 'Y', GOODS_LEVEL_GB: '02', GOODS_LEVEL_GB_NM: '상', SALE_STATE_GB: '02', SALE_STATE_GB_NM: '판매중', ORD_REMAIN_CNT: 3, ENTR_GOODS_CD: 'PNKLUX', STATE_LEVEL_GB: '1' }, now);
    out.adm = [ar.ean, ar.adult, ar.grade, ar.st, ar.stock, ar.self].join(',');
    await db.collection('crm_y24_raw').doc('r1').set({ sig: 'POST /api/Product/ProductList', at: now, part: 0, parts: 1, body: JSON.stringify({ PRODUCT_LIST: [{ GOODS_NO: 194904689, EAN: '9791133424672', GOODS_NM: '새여동생', AGE_LMT_YN: 'Y', GOODS_LEVEL_GB_NM: '상', SALE_STATE_GB: '02', ORD_REMAIN_CNT: 3, ENTR_GOODS_CD: 'PNKLUX' }] }) });
    await y24AdmLoad(true); out.admN = S.y24.adm && S.y24.adm.m.size; out.adultIsbn = y24V(S.y24.list.get('194904689')).isbn + ':' + y24V(S.y24.list.get('194904689')).adult;
    // ⑤ 화면
    openY24Link(); await W(900); const sh = document.getElementById('sheet'); const t = sh.innerText; out.scr = { title: /연결 표/.test(t), red: /알라딘 팔림·예스24 판매중/.test(t), test: /1줄 시험 엑셀/.test(t), bulkOff: !!sh.querySelector('[data-y24bulk][disabled]'), adm: /관리자 화면 자료/.test(t) };
    // ⑥ 1줄 시험 엑셀 — 양식·판정
    const C = y24TestCand(); out.cand = C.map((x) => x.x.goodsNo).join(','); const aoa = y24XlsxAoa(C.slice(0, 1), 'no'); out.aoa = [aoa.length, aoa[26][1], aoa[26][7], aoa[27][1], aoa[27][7], aoa[27][4], aoa[27][10]].join('|');
    let dl = 0; window.XLSX = { utils: { book_new: () => ({}), book_append_sheet: () => {}, aoa_to_sheet: (a) => a }, writeFile: () => { dl++; } };
    sh.querySelector('[data-y24test]').click(); await W(900); const T = (FS.app_settings.y24_link || {}).test; out.test = T && T.no + ':' + T.code + ':' + dl;
    out.j0 = y24TestJudge(T).k; S.y24.adm.m.set(T.no, { no: T.no, at: new Date(Date.now() + 1000).toISOString(), self: T.code, ean: T.isbn, grade: T.grade }); out.j1 = y24TestJudge(T).k;
    S.y24.adm.m.set('199999999', { no: '199999999', at: new Date(Date.now() + 1000).toISOString(), ean: T.isbn, grade: T.grade }); out.j2 = y24TestJudge(T).k;
    // ⑦ ✏ 기록 판
    y24EdPop('194904699'); await W(100); const pop = document.getElementById('y24edp'); pop.querySelector('[data-f="ended"]').checked = true; pop.querySelector('[data-f="why"]').value = '알라딘에서 팔림'; pop.querySelector('[data-s]').click(); await W(600);
    const e = FS.app_settings.y24_link.m['194904699']; out.ed = e && e.ended + ':' + e.why + ':' + !!e.by + ':' + (by('194904699').flags[0]); out.redAfter = y24LinkAll().find((x) => x.x.goodsNo === '194904699').flags[0] || 'none';
    return out; });
  console.log(JSON.stringify(r));
  ok(r.seed.ended === 1 && r.seed.food === 1 && r.seed.x === 9 && r.seed.by === '정범님' && r.seed.seeds, '정범님 11/02 사실이 Firestore 기록으로(판매종료 4 · FOOD LAB 1 · 공개 목록 밖 9 · 누가)');
  ok(r.keep === 2, '사람이 나중에 고친 값은 다시 넣어도 덮지 않음');
  ok(r.isbn === '9789154133123' && r.blu === 'one', '블루레이 880 바코드 ↔ 알라딘 978(자동 제외 KHKDVD여도) 1:1: ' + r.blu);
  ok(r.bluSku === 'KHKDVDd1001,KHKDVDd1002,KHKDVDd1003', '자체코드 후보 = 관리코드 6자 + SKU, 재고 수만큼: ' + r.bluSku);
  ok(!r.kookLive && !/^red/.test(r.kook), '국부론: 사람이 판매종료 → 판매중 아님 · 🔴 아님: ' + r.kook);
  ok(r.sold === 'red', '기록 안 된 알라딘 팔린 책 → 🔴');
  ok(r.slow === 'one:PNKLUXd3120', '1:1 줄 SKU: ' + r.slow);
  ok(r.food === 'many:1:false', 'FOOD LAB 재고 1(사람 기록) · 🟠 아님: ' + r.food);
  ok(/revGone/.test(r.rev), '예스24 사라짐 + 알라딘 판매중 → 반대 방향 알림: ' + r.rev);
  ok(r.xrows === 9 && r.adult >= 8 && r.restrict === 1 && r.mado === false, `공개 목록 밖 기록 줄 ${r.xrows} · 19금 ${r.adult} · 전시제한 ${r.restrict} · 마도정병 판매중 아님`);
  ok(r.chan === 'aladin,yes24', '알라딘 상품 쪽에서도 예스24 채널이 보임(바코드 맞춤)');
  ok(r.alerts.some((a) => a === 'top:y24dup:1') && r.alerts.some((a) => /y24rev/.test(a)), '홈 알림 ❗ 맨 위: ' + r.alerts.join(' / '));
  ok(r.adm === '9791133424672,true,상,02,3,PNKLUX', '관리자 응답 한 줄 풀기: ' + r.adm);
  ok(r.admN === 1 && r.adultIsbn === '9791133424672:true', '관리자 화면 자료로 19금 매물 ISBN·19금이 채워짐');
  ok(r.scr.title && r.scr.red && r.scr.test && r.scr.bulkOff && r.scr.adm, '연결 표 화면(🔴 · 시험 엑셀 · 일괄은 잠김): ' + JSON.stringify(r.scr));
  ok(/^28\|바코드\/상품번호\|자체코드\|\d+\|PNKLUX/.test(r.aoa), '엑셀 양식 27행 머리 · 28행 자료: ' + r.aoa);
  ok(r.test && /:PNKLUX/.test(r.test) && /:1$/.test(r.test), '1줄 시험 엑셀 내려받기 + 기록: ' + r.test);
  ok(r.j0 === 'wait' && r.j1 === 'fixed' && r.j2 === 'new', `판정 기다림→고쳐짐→새 매물: ${r.j0} ${r.j1} ${r.j2}`);
  ok(/^1:알라딘에서 팔림:true/.test(r.ed || '') && r.redAfter !== 'red', '✏ 판매종료 기록(누가·이유) → 🔴 사라짐: ' + r.ed + ' / ' + r.redAfter);
  console.log(bad ? `❌ tY24 실패 ${bad}` : '✓ tY24 통과'); });
