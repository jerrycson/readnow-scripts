// tFIX5 — (11/11 fix5 · 정범님 11/11 저녁)
//  ① 🏪 매입처 상세의 '잘 팔린 책'(판매)·'오래 안 팔린 책'·상품 목록(등록) 상품명을 누르면 그 상품 페이지(openItem·openProduct) — 예전엔 잘 팔린 책이 그냥 글이었음
//  ② ⚙ 🟩 네이버 칸: 로거 번외가 옛 판(0.1.21)이면 '새 판 받기' 할 일에 까닭(마지막 새 판 확인 결과)·어디서(🪟 수집 작업 창 🧪 줄 · 번외 상태 창) · c2Sum이 upd를 남김
//  ④ 🛍 우리숍 설정: app_settings/main을 받을 때 S.app을 통째로 바꿔도 bqCfg가 남음 · 저장 전 빈칸 덮어쓰기 막음('-'면 그 칸만 지움)
//  ③ 예스24 로그인 풀림 안내: 저장 계정으로 스스로 다시 로그인되면 수동 [🔐 예스24 로그인] 안내 대신 그 말 · 계정 없음·멈춤이면 까닭과 함께 수동 안내 · 옛 번외(re 없음)는 예전 글
// 시험 자료 상품은 가짜 · 쓰는 법: RN_PORT=<포트> node tFIX5.js (pw/ 안 — harness.js 옆)
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); if (!c) bad++; };
require('./harness.js')(async (p) => {
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; S.user = S.user || { email: 't@x' };
    S.plist.clear(); for (let i = 0; i < 4; i++) { const uc = 'U9' + (100000 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, title: '시험책 ' + i, price: 5000, qty: 1, status: i % 2 ? '판매완료' : '판매중', active: !(i % 2), sku: 'BLKCMN', registeredAt: '2026-10-0' + (i + 1) + 'T10:00:00' }); }
    S.prodLoaded = true; S.pmatchLoaded = true; S.orders.clear(); S.orders.set('o1', { id: 'o1', orderNo: '1', kind: 'sale', orderedAt: '2026-10-20T10:00:00', customerId: 'c1', items: [{ lineStatus: 'normal', title: '시험책 1', sku: 'BLKCMN', aladinUsedCode: 'U9100001', qty: 1, price: 5000 }] }); S.ordersLoaded = true;
    S.pur = S.pur || {}; Object.assign(S.pur, { loaded: true, fresh: true, loading: false, heonot: [], aOrders: [], existing: [], set: { ...PSET_DEFAULT }, entries: [] }); MEMO.clear();
    openSupplier('gen'); await W(300); let sh = $('#sheet');
    const best = [...sh.querySelectorAll('h3')].find((h) => /잘 팔린 책/.test(h.textContent)).parentElement.querySelector('.list .item'); out.bestLink = !!(best && best.dataset.gb);
    best.querySelector('span').click(); await W(600); out.bestOpen = JSON.stringify(S.detail); history.back(); await W(500);
    sh = $('#sheet'); const old = [...sh.querySelectorAll('h3')].find((h) => /오래 안 팔린/.test(h.textContent)).parentElement.querySelector('[data-pid]'); old.click(); await W(500); out.oldOpen = JSON.stringify(S.detail); history.back(); await W(900);
    sh = $('#sheet'); out.back2 = JSON.stringify(S.detail); if (!sh.querySelector('#sup_list')) { openSupplier('gen'); await W(300); } sh.querySelector('#sup_list [data-pid]').click(); await W(500); out.listOpen = JSON.stringify(S.detail); history.back(); await W(400);
    // ② 네이버 — 로거 번외 옛 판
    NVW.lg = { beats: { pcs: { LOGGER: { ver: '1.89.270', atMs: Date.now() - 30e3 } } }, ctl: { LOGGER: { at: new Date().toISOString(), st: { ver: '0.1.21', upd: { at: '11-11 21:30', msg: '읽는 중 — 다음에' } } } } }; NVW.lgAt = Date.now();
    out.nv = nvLgInfo(null).todo.join(' | '); out.c2u = (c2Sum({ ver: '0.1.21', upd: { at: 'x', msg: '새 판 없음(GitHub 0.1.23)' } }) || {}).upd;
    // ③ 예스24
    out.y1 = y24LoginTxt({ has: true, on: true, auto: true }, { at: 1, why: '앞 시도 뒤 5분 기다림' }, 'HOME'); out.y2 = y24LoginTxt({ has: false, on: true, auto: false }, null); out.y3 = y24LoginTxt({ has: true, on: true, auto: false, stop: '연속 2번 실패 — 틀림' }, null); out.y4 = y24LoginTxt(null, '모름');
    out.todoA = (y24OpsTodo({}, {}, {}, 'need', { has: true, on: true, auto: true }, null)[0] || {}); out.todoB = (y24OpsTodo({}, {}, {}, 'need', { has: false }, null)[0] || {});
    out.al = y24HoldAlertOf({ used: true, h: 'HOME', age: 1000, stale: false, hlp: true /* (rel3) y24ops3 — 상태 줄엔 늘 hlp가 있음 */, others: [], login: 'need', re: { has: true, on: true, auto: true }, reWhy: '앞 시도 뒤 5분 기다림' }); out.al2 = y24HoldAlertOf({ used: true, h: 'HOME', age: 1000, stale: false, hlp: true /* (rel3) y24ops3 — 상태 줄엔 늘 hlp가 있음 */, others: [], login: 'need', re: null });
    out.ys = c2ySum({ login: 'need', re: { has: true, on: true, auto: true, stop: null }, reWhy: { at: 1, why: 'x' } });
    // ④ 🛍 우리숍 설정 — app_settings/main을 받아도 bqCfg가 남음 · 빈칸 덮어쓰기 막음
    const SHOP = { open: 0, name: '북스퀸', bank: { name: '시험은행', acct: '000-000', holder: '손님A' }, biz: { name: '시험상호', no: '000-00-00000', tel: '010-0000-0000' } };
    await db.collection('app_settings').doc('shop').set(SHOP); bqCfgLoad(); await W(300); out.bq0 = bqCfg().bank.acct;
    await db.collection('app_settings').doc('main').set({ feeRate: 0.11, at: Date.now() }, { merge: true }); await W(400); out.bq1 = (S.app.bqCfg || {}).bank && S.app.bqCfg.bank.acct; out.feeOk = S.app.feeRate === 0.11;
    delete S.app.bqCfg; out.bq2 = bqCfg().bank.acct; /* 혹시 사라져도 원본으로 */
    openShopAdm(); await W(400); out.formAcct = ($('#bqc_acct') || {}).value;
    const w1 = bqCfgWipe(S._bqCfg0, { bank: { name: '시험은행', acct: '', holder: '손님A' }, biz: { name: '시험상호', no: '', tel: '010-0000-0000' } });
    const v2 = { bank: { name: '시험은행', acct: '-', holder: '손님A' }, biz: { name: '시험상호', no: '000-00-00000', tel: '010-0000-0000' } }; const w2 = bqCfgWipe(S._bqCfg0, v2); const w3 = bqCfgWipe(null, v2);
    out.wipe = { e1: w1.err || '', ok2: !!w2.ok && v2.bank.acct === '', e3: w3.err || '' };
    $('#bqc_acct').value = ''; const sb = $('#bqc_save'); sb.click(); await W(100); sb.click(); await W(500); out.afterSave = ((await db.collection('app_settings').doc('shop').get()).data() || {}).bank;
    history.back(); await W(300);
    return out; });
  ok(r.bestLink && /"product":"aladin_U9100001"/.test(r.bestOpen), '① 잘 팔린 책 상품명 → 그 상품 페이지', r.bestOpen);
  ok(/"product":/.test(r.oldOpen) && /"product":/.test(r.listOpen), '① 오래 안 팔린 책·상품 목록도 그대로 상품 페이지', [r.oldOpen, r.listOpen]);
  ok(/0\.1\.21 → 0\.1\.25/.test(r.nv) && /읽는 중 — 다음에/.test(r.nv) && /수집 작업 창/.test(r.nv) && /깔고 켜기/.test(r.nv), '② 로거 번외 옛 판 — 까닭·어디서', r.nv.slice(0, 200));
  ok(r.c2u && /GitHub 0\.1\.23/.test(r.c2u.msg), '② 번외 상태 요약이 새 판 확인 결과를 남김', r.c2u);
  ok(r.y1.auto && /스스로 다시 로그인/.test(r.y1.t) && !/\[🔐 예스24 로그인\]/.test(r.y1.t) && /앞 시도 뒤 5분/.test(r.y1.t), '③ 저장 계정 — 수동 안내 없음 · 지금 까닭', r.y1.t);
  ok(!r.y2.auto && /\[🔐 예스24 로그인\]/.test(r.y2.t) && /저장된 예스24 계정 없음/.test(r.y2.t), '③ 계정 없음 — 까닭과 수동 안내', r.y2.t);
  ok(/멈춤 — 연속 2번 실패/.test(r.y3.t) && /\[🔐 예스24 로그인\]/.test(r.y3.t), '③ 저장 계정이 멈춤 — 까닭과 수동 안내', r.y3.t);
  ok(/\[🔐 예스24 로그인\]/.test(r.y4.t) && /지금: 모름/.test(r.y4.t), '③ 옛 번외(re 없음)는 예전 안내', r.y4.t);
  ok(/저장된 계정으로/.test(r.todoA.todo) && !/\[🔐/.test(r.todoA.todo) && /\[🔐/.test(r.todoB.todo), '③ 할 일 카드도 같음', [r.todoA.todo, r.todoB.todo]);
  ok(r.al && /스스로 다시 로그인함/.test(r.al.t) && !/\[🔐/.test(r.al.t) && /\[🔐 예스24 로그인\]/.test(r.al2.t), '③ 맡은 PC 경보도 같음', [r.al.t, r.al2.t]);
  ok(r.ys && r.ys.re && r.ys.re.auto === true, '③ c2ySum이 re를 넘김', r.ys && r.ys.re);
  ok(r.bq0 === '000-000' && r.bq1 === '000-000' && r.feeOk && r.bq2 === '000-000', '④ 기본 설정(main)을 받아도 우리숍 설정이 남음', [r.bq0, r.bq1, r.feeOk, r.bq2]);
  ok(r.formAcct === '000-000', '④ 다시 그린 ⚙ 우리숍 설정 칸에 값이 그대로', r.formAcct);
  ok(/계좌 번호/.test(r.wipe.e1) && /사업자등록번호/.test(r.wipe.e1) && r.wipe.ok2 && /받지 못해/.test(r.wipe.e3), '④ 빈칸 덮어쓰기 막음 · \'-\'면 그 칸만 지움 · 받기 전엔 저장 안 함', r.wipe);
  ok(r.afterSave && r.afterSave.acct === '000-000', '④ 계좌를 비운 채 [저장] 두 번 → 서버 값 그대로', r.afterSave);
  console.log(bad ? `❌ tFIX5 ${bad}개 실패` : '✓ tFIX5 모두 통과');
});
