/* t71 — 등록 기등록(♻ 보유재고 수량 증가 C) 처리 + 🔢 판매 수량 재집계(관리 화면) 시험
 * (note2b 11/17 · 정범님 (나) 「t71에 진짜 검사와 통과 줄」) — 전엔 값만 찍는 기록용이라 통과 줄이 없어 시험 문지기가 늘 막았음.
 *   이제 찍던 값마다 기대값을 검사함: 모의(m1)는 알라딘 수량 바꿈 맡김을 넣지 않고 기록만 3→4 · 시험(r1)은 prdEdit 맡김 하나(수량 5→6 · +1 · 웹 기록 기준)
 *   · 등록 뒤 화면 띠 글 · 관리 화면 재집계 두 번 누름(첫 번은 '한 번 더' · 두 번째에 판매 중 상품 전체를 qty_chk 대기로) · 페이지 오류 0 */
const os = require('os'), path = require('path');
let bad = 0, nOk = 0; const ok = (c, m, x) => { nOk++; if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluate(async () => { S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); const t = new Date().toISOString();
    const Ls = [{ id: 'LX1', listingId: '7001', title: '월가', isbn13: '9790000000011', aladinItemId: '9001', grade: '상', qty: 3, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'U1' },
      { id: 'LX9', listingId: '7009', title: '스토너', isbn13: '9790000000035', aladinItemId: '9003', grade: '상', qty: 5, status: '판매중', active: true, sku: 'BLKCMN', price: 9000, usedCode: 'U9' }];
    Ls.forEach((l) => { S.plist.set(l.id, l); S.uinfo.set(l.listingId, { none: true }); }); S.ver++;
    const mk = async (k, isbn, iid, g, ex) => { const doc = { stage: 'pick', isbn, info: { title: '시험 ' + k, isbn13: isbn, itemId: iid, categories: [1], page1: [], priceList: 20000, at: t }, grade: g, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, descMode: 'manual', descParts: { a: '', b: '', c: '' }, ...ex }; await db.collection('reg_items').doc(k).set(doc); S.regItems.set(k, { id: k, ...doc }); };
    await mk('m1', '9790000000011', '9001', 2, { mock: true }); await mk('r1', '9790000000035', '9003', 2, { test: true });
    S.regT = 'pick'; openRegister(); });
  await p.waitForTimeout(2500);

  /* ① 기등록 갈래 — 같은 상태(등급 상 · 유의 사항 없음)의 재고가 여러 부(3·5권) → C(보유재고 수량 증가) · 라벨 ② */
  const K = await p.evaluate(() => ['m1', 'r1'].map((id) => { const K = regDupKind(S.regItems.get(id)); return K && { id, k: K.k, lbl: K.lbl, copies: K.copies, c: K.C.map((l) => l.id) }; }));
  console.log('kinds', JSON.stringify(K));
  ok(K[0] && K[0].k === 'C' && K[0].lbl === 2 && K[0].copies === 3 && K[0].c.join() === 'LX1', 'm1 기등록 갈래 = C(보유재고 수량 증가) · 라벨 ② · 재고 LX1 3부', K[0]);
  ok(K[1] && K[1].k === 'C' && K[1].lbl === 2 && K[1].copies === 5 && K[1].c.join() === 'LX9', 'r1 기등록 갈래 = C · 라벨 ② · 재고 LX9 5부', K[1]);

  /* ② 처리 — 둘 다 성공 · 모의는 알라딘 맡김 없음 · 시험 상품만 prdEdit 하나 */
  const before = await p.evaluate(async () => (await db.collection('shp_cmds').get()).docs.filter((d) => d.data().type === 'prdEdit').length);
  const r = await p.evaluate(async () => regDupProcess(['m1', 'r1'])); console.log('process', JSON.stringify(r));
  ok(r && r.ok === 2 && r.w === 0 && r.bad === 0, '처리 결과 성공 2 · 기다림 0 · 실패 0', r);
  await p.waitForTimeout(800);
  const cm = await p.evaluate(async () => (await db.collection('shp_cmds').get()).docs.filter((d) => d.data().type === 'prdEdit').map((d) => { const x = d.data(); return { id: d.id, lk: x.listingKey, ch: x.ch, before: x.before, qtyAdd: x.qtyAdd, qtyWeb: x.qtyWeb, regItem: x.regItem, status: x.status }; }));
  console.log('prdEdit before', before, 'cmds', JSON.stringify(cm));
  ok(before === 0 && cm.length === 1, 'prdEdit 맡김이 처리 뒤 딱 하나(모의 m1은 알라딘 수량 바꿈을 넣지 않음)', { before, n: cm.length });
  const c9 = cm.find((x) => x.lk === 'LX9') || {};
  ok(c9.regItem === 'r1' && c9.ch && c9.ch.qty === 6 && c9.before && c9.before.qty === 5 && c9.qtyAdd === 1 && c9.qtyWeb === 5, 'r1 맡김 = LX9 수량 5 → 6 (+1 · 웹 기록 5 기준)', c9);
  ok(!cm.some((x) => x.lk === 'LX1' || x.regItem === 'm1'), '모의 m1(LX1)에는 알라딘 맡김 없음', cm);

  /* ③ 처리 기록(post) */
  const P = await p.evaluate(() => ({ m1: S.regItems.get('m1').post, r1: S.regItems.get('r1').post })); console.log('post', JSON.stringify(P));
  const m1 = P.m1 || {}, r1 = P.r1 || {};
  ok(m1.kind === 'qty' && m1.mock === true && m1.dupKind === 'C' && m1.labelKind === 2 && m1.lid === 'LX1' && m1.listingId === '7001' && m1.from === 3 && m1.to === 4 && m1.n === 1 && m1.cmd == null, 'm1 기록 = 모의 · LX1(7001) 수량 3 → 4 · 맡김 없음', m1);
  ok(r1.kind === 'qty' && r1.test === true && r1.dupKind === 'C' && r1.labelKind === 2 && r1.lid === 'LX9' && r1.listingId === '7009' && r1.from === 5 && r1.to === 6 && r1.n === 1 && r1.base === 'web' && r1.cmd === c9.id, 'r1 기록 = 시험 · LX9(7009) 수량 5 → 6 · 웹 기록 기준 · 맡김 번호가 실제 맡김과 같음', { r1, cmd: c9.id });

  /* ④ 등록 뒤(post) 화면 띠 */
  await p.evaluate(() => { S.regT = 'post'; regRerender(); }); await p.waitForTimeout(1000);
  const pv = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.rgpost2')].map((x) => [x.dataset.rgcid, { ban: x.querySelector('.rgp-ban') ? x.querySelector('.rgp-ban').textContent.replace(/\s+/g, ' ').trim() : '', pr: x.querySelector('[data-rgpprint]') ? x.querySelector('[data-rgpprint]').textContent.trim() : '' }])));
  console.log('post 화면', JSON.stringify(pv));
  ok(pv.m1 && /모의/.test(pv.m1.ban) && /알라딘 수량은 바꾸지 않음/.test(pv.m1.ban) && /U1 수량 3 → 4/.test(pv.m1.ban) && /기등록 C/.test(pv.m1.ban) && /SKU 인쇄 \(1장\)/.test(pv.m1.pr), 'm1 띠 = 🧷 모의(알라딘 수량 안 바꿈) · U1 수량 3 → 4 · 기등록 C · SKU 1장', pv.m1);
  ok(pv.r1 && /보유재고 수량 증가 처리됨/.test(pv.r1.ban) && /시험/.test(pv.r1.ban) && /U9 수량 5 → 6/.test(pv.r1.ban) && /웹앱 기록 기준/.test(pv.r1.ban) && /기등록 C/.test(pv.r1.ban) && !/모의/.test(pv.r1.ban) && /SKU 인쇄 \(1장\)/.test(pv.r1.pr), 'r1 띠 = ♻ 보유재고 수량 증가 처리됨 · 🧪 시험 · U9 수량 5 → 6(웹앱 기록 기준) · 기등록 C · SKU 1장', pv.r1);

  /* ⑤ 관리 화면 🔢 판매 수량 재집계 — 두 번 눌러야 맡김 · 판매 중 상품 전체가 qty_chk 대기로 */
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.sec.mg_qchk = true; openMgr(); }); await p.waitForTimeout(3000);
  const q1 = await p.evaluate(() => { const d = document.querySelector('[data-sec="mg_qchk"]'); const b = document.querySelector('[data-qchkall]'); return { sec: d ? d.innerText.replace(/\s+/g, ' ') : null, btn: b ? b.textContent : null, dis: b ? b.disabled : null, nAct: [...S.plist.values()].filter((l) => l.active !== false && /판매중/.test(l.status || '')).length }; });
  console.log('qsec', (q1.sec || 'NONE').slice(0, 300));
  const nBtn = +((/\((\d+)개\)/.exec(q1.btn || '') || [])[1] || 0);
  ok(q1.sec && /판매 수량 재집계/.test(q1.sec) && /정보수정 화면/.test(q1.sec), '관리 화면에 🔢 판매 수량 재집계 칸이 뜸', (q1.sec || '').slice(0, 120));
  ok(q1.dis === false && /지금 전체 다시 세기/.test(q1.btn || '') && nBtn >= 2, '「🔢 지금 전체 다시 세기 (N개)」 단추가 눌림 · N ≥ 2(시험 상품 둘 포함)', q1);
  const qBefore = await p.evaluate(async () => (await db.collection('qty_chk').get()).size);
  await p.evaluate(() => document.querySelector('[data-qchkall]').click()); await p.waitForTimeout(300);
  const armed = await p.evaluate(() => document.querySelector('[data-qchkall]').textContent); console.log('armed', armed);
  const qMid = await p.evaluate(async () => (await db.collection('qty_chk').get()).size);
  ok(/한 번 더 누르면/.test(armed) && qMid === qBefore, '첫 번 누름은 「⚠ 한 번 더 누르면 …」만 · 아직 맡김 없음', { armed, qBefore, qMid });
  await p.evaluate(() => document.querySelector('[data-qchkall]').click()); await p.waitForTimeout(2000);
  const qd = await p.evaluate(async () => (await db.collection('qty_chk').get()).docs.map((d) => ({ st: d.data().status, items: d.data().items || [] })));
  const all = qd.flatMap((d) => d.items); console.log('qty_chk', qd.length, '묶음 ·', all.length, '상품 ·', [...new Set(qd.map((d) => d.st))].join(','));
  ok(qd.length >= 1 && qd.every((d) => d.st === 'queued') && qd.every((d) => d.items.length >= 1 && d.items.length <= 40), '두 번째 누름에 qty_chk 묶음(40개 이하씩)이 모두 대기(queued)로 들어감', qd.map((d) => [d.st, d.items.length]));
  ok(all.some((x) => x.k === 'LX1' && x.lid === '7001') && all.some((x) => x.k === 'LX9' && x.lid === '7009'), '맡긴 상품에 시험 상품 LX1(7001)·LX9(7009)가 들어 있음', all.slice(-4));
  ok(all.length === nBtn && new Set(all.map((x) => x.k)).size === all.length, `맡긴 상품 수 = 단추에 보인 ${nBtn}개 · 겹침 없음`, { n: all.length, nBtn });

  try { await p.screenshot({ path: path.join(process.env.RN_SHOT_DIR || os.tmpdir(), 't71.png'), fullPage: false }); } catch (e) {}
  ok(!errs.length, '페이지 오류 없음', errs);
  console.log(bad ? `❌ t71 ${bad}개 실패 (검사 ${nOk}개)` : `✓ t71 모두 통과 (검사 ${nOk}개)`); process.exitCode = bad ? 1 : 0;
});
