/* tCOL2AL — 정범님 11/09 밤 '로그인 일(알라딘 샵매니저)도 번외로' · lab/col2/LOGIN_PLAN.md ⑤-2·⑤-3
 *  웹앱 쪽:
 *   ① 번외 대신 읽기(c2RelayTick · C2R.ok)가 운영 칸 세 개(prd_listings/aladin_* · shp_state/confirm·current · crm_interactions/aladin_qna_*)를 읽어 넘김 → 번외 견줌이 '운영 문서 기다림'에서 풀림
 *   ② 넘기는 것은 번호·상태·값만 — 구매자·수령인·주소·전화·문의 글은 넘기지 않음 · 문서 이름 규칙 밖(shp_state/다른 것 · crm_interactions/손님 문서)은 읽지도 않음
 *   ③ 🧭 관리도구 PC 줄에 🟧 한 줄(알라딘 읽기 상태·오늘 읽은 수·같음/다름) · col2_ctl/<PC>.st.al에도 남음 · 브라우저 팝업 없음
 *  시험 자료의 손님은 '손님A' · 전화 010-0000-0000 (공개 저장소)
 * 실행: cd pw && RN_PORT=<포트> node tCOL2AL.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const calls = []; let al = { on: true, logger: false, login: 'ok', active: true, seat: true, pp: null, msg: '🟧 주문확인요청 읽음', day: { n: 12, same: 3, diff: 1, wait: 0 } };
  const want = [{ c: 'prd_listings', id: 'aladin_U123' }, { c: 'shp_state', id: 'confirm' }, { c: 'shp_state', id: 'current' }, { c: 'crm_interactions', id: 'aladin_qna_777' }, { c: 'shp_state', id: 'secret' }, { c: 'crm_interactions', id: 'cust_1' }, { c: 'crm_orders', id: 'X1' }];
  let wantNow = want;
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8898/, async (rt) => { const u = new URL(rt.request().url()); const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) }); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
    if (u.pathname === '/status') return J({ ok: true, ver: '1.2.2' }); if (u.pathname === '/printers') return J({ ok: true, printers: [] });
    if (u.pathname === '/col2/status') return J({ ok: true, helper: '1.2.2', ver: '0.1.6', installed: true, running: true, on: true, want: true, dayN: 5, dayCap: 1600, msg: '일할 준비' }); return J({ ok: false }); });
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); calls.push({ p: u.pathname, b: b ? JSON.parse(b) : null });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const w = wantNow; wantNow = []; return J({ ok: true, want: w, sample: 0, pool: 0, fields: [], out: [], hot: false, pc: 'HOME', pcSrc: 'web', ver: '0.1.6', al }); }
    return J({ ok: true }); });
  const r = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); localStorage.setItem('rn-device', 'HOME'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    await db.collection('prd_listings').doc('aladin_U123').set({ usedCode: 'U123', listingId: '9001', status: '판매중', price: 5000, sku: 'A01-00001', grade: '상', qty: 1, qtyList: 1, buyerName: '손님A', memo: '내부 메모' });
    await db.collection('shp_state').doc('confirm').set({ at: '2026-11-10T01:00:00Z', tabCounts: { 주문확인요청: 1 }, orders: [{ orderNo: 'O1', buyer: '손님A', receiver: '손님A', phone: '010-0000-0000', address: '시험 주소', items: [{ listingId: '9001', title: '시험 책' }], deliveryNo: null }] });
    await db.collection('crm_interactions').doc('aladin_qna_777').set({ questionId: '777', answerStatus: '답변완료', writer: '손님A', body: '문의 글' });
    await db.collection('shp_state').doc('secret').set({ x: 1 });
    S.lph.at = 0; await lphCheck(true); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); S.c2.at = 0; await c2Check(true);
    S.sec.mg_work = true; openMgr(); await sl(900); mgrRedraw(); await sl(600); const row = document.querySelector('[data-c2row="HOME"]'); return { t: row ? row.innerText : '' }; });
  const ans = calls.filter((c) => c.p === '/relay/answer').map((c) => c.b)[0] || {}; const D = ans.docs || []; const by = (c, id) => D.find((d) => d.c === c && d.id === id);
  ok(by('prd_listings', 'aladin_U123') && by('shp_state', 'confirm') && by('shp_state', 'current') && by('crm_interactions', 'aladin_qna_777'), '운영 칸 세 개를 대신 읽어 넘김(번외 견줌이 기다림에서 풀림)', D.map((d) => d.c + '/' + d.id));
  ok(!by('shp_state', 'secret') && !by('crm_interactions', 'cust_1') && !by('crm_orders', 'X1'), '문서 이름 규칙 밖·다른 칸은 읽지 않음', D.map((d) => d.c + '/' + d.id));
  const L = by('prd_listings', 'aladin_U123'); ok(L && L.v && L.v.price === 5000 && L.v.sku === 'A01-00001' && L.v.status === '판매중' && !('buyerName' in L.v) && !('memo' in L.v), '상품 칸은 번호·상태·값만', L);
  const C = by('shp_state', 'confirm'); ok(C && C.v && C.v.orders[0].orderNo === 'O1' && C.v.orders[0].items[0].listingId === '9001' && C.v.tabCounts['주문확인요청'] === 1 && Object.keys(C.v.orders[0]).sort().join(',') === 'deliveryNo,items,orderNo' && Object.keys(C.v.orders[0].items[0]).join(',') === 'listingId', '출고 칸은 주문번호·상품 번호·송장 칸·탭 숫자만', C);
  ok(by('shp_state', 'current').v === null, '없는 운영 문서는 null(번외가 \'운영 기록 없음\'으로 셈)');
  const Q = by('crm_interactions', 'aladin_qna_777'); ok(Q && Q.v && Q.v.answerStatus === '답변완료' && Object.keys(Q.v).sort().join(',') === 'answerStatus,questionId', '문의 칸은 번호·답변 상태만', Q);
  const all = JSON.stringify(calls.map((c) => c.b)); ok(!/손님A|010-0000-0000|시험 주소|문의 글|내부 메모|시험 책/.test(all), '번외에 넘긴 어떤 것에도 손님 정보 없음');
  ok(/🟧 알라딘 샵매니저 읽기\(그림자\): 읽기만 하는 중/.test(r.t) && /오늘 읽은 수 12장/.test(r.t) && /같음 3/.test(r.t) && /다름 1/.test(r.t), '🧭 PC 줄에 🟧 한 줄 — 읽는 중 · 오늘 읽은 수 · 같음/다름', r.t);
  al = { ...al, active: false, login: 'need', msg: '🔐 로그인 필요' };
  const r2 = await p.evaluate(async () => { const sl = (ms) => new Promise((x) => setTimeout(x, ms)); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); S._c2StSig = ''; S._c2NoHlp = 0; await c2StTick(); mgrRedraw(); await sl(500); const row = document.querySelector('[data-c2row="HOME"]'); const g = (await db.collection('col2_ctl').doc('HOME').get()).data() || {}; return { t: row ? row.innerText : '', g: g.st && g.st.al }; });
  ok(/🔐 알라딘 로그인 필요/.test(r2.t) && /\[🔐 알라딘 로그인\] 한 번/.test(r2.t), "로그인이 풀리면 '그 PC 옆 창에서 한 번'", r2.t);
  ok(r2.g && r2.g.login === 'need' && r2.g.n === 12 && r2.g.diff === 1, 'col2_ctl/HOME.st.al 에 남음(다른 PC 관리도구에서도 보임)', r2.g);
  al = { ...al, login: 'ok', pp: '번외 로그인 뒤 3분 만에 운영 세션이 풀림' }; const r3 = await p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); mgrRedraw(); await new Promise((x) => setTimeout(x, 400)); const row = document.querySelector('[data-c2row="HOME"]'); return row ? row.innerText : ''; });
  ok(/⛔ 핑퐁 의심으로 멈춤/.test(r3), '핑퐁 의심이면 빨간 한 줄', r3);
  ok(!/alert\(|confirm\(|prompt\(/.test(await p.evaluate(() => [c2alHtml, c2alTrim, c2RelayTick].map(String).join('\n'))), '브라우저 팝업 없음');
  console.log(bad ? `❌ tCOL2AL ${bad}개 실패` : '✓ tCOL2AL 모두 통과'); process.exit(bad ? 1 : 0); });
