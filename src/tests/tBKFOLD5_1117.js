// tBKFOLD5_1117 — (정범님 11/17 I-1117-1318-08·I-1117-1704-17 · 설계안 BKFOLD_DESIGN_1117 판 ⑤) 🏷 생성후판매완료 탭 · 📊 묶음 그룹 상태판 · 🧭 그룹 길잡이 · 🏷 매입가 하한 모두 알라딘 매입으로
//  ① 글: 새 이름은 파일 전체에서 한 번 · 브라우저 창 없음 · 가격 결정 문서를 쓰지 않음 · 옛 bhSendL 부르는 곳 그대로 · 지표 갱신은 판매완료를 뺌
//  ② 화면: 기준 때(묶음에 들어온 때 ↔ 그룹 만든 때 · 들어가면 다시 0부터) · 읽기만 탭 · 고른 것도 판매완료면 실행에서 빠짐 · 같은 상품이 여러 그룹에
//        상태판 수 = 그룹 화면 탭 수 · 칸 누르면 그 탭 · 길잡이로 다음 그룹(탭 그대로) · 묶음으로 돌아가기 · 꺼진 그룹 = 누르면 셈 · 보관 그룹 = 셈에서 뺌 · 390px 넘침 없음
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD5_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 글');
{ const NEW = cut('/* ◆bqsold (판 ⑤', '/* ◆bqsold 끝 */');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창(alert·confirm·prompt) 없음');
  ok(!/prd_price_decisions/.test(NEW) && !/batchSave\(|\.set\(|\.update\(/.test(NEW), '새 덩어리는 서버에 쓰지 않음(읽기만 · 가격 결정 문서 손대지 않음)');
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음');
  const names = ['bqBaseAt', 'BQS_CH', 'bqSoldOf', 'bqSoldList', 'bqCls', 'bqSoldHtml', 'BKF_TB', 'BKF_TBX', 'BKF_TBQ', 'BKF_tbBusy', 'bkfTbSig', 'bkfTbSum', 'bkfTbKick', 'bkfTbHtml', 'bkfTbPaint', 'bkfTbClick', 'bkfNavHtml', 'bkfBbIdx'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup);
  const calls = (T.match(/bhSendL\([^)]*?\{ k: [^}]*\}[^;]*?\)/g) || []); ok(/async function bhSendL\(ls, src, xOf, skuOf, opt\)/.test(T) && /return bhSend\(recs, src, opt\); \}/.test(T), 'bhSendL에 다섯째 칸(opt)만 더함 — 옛 네 곳은 그대로(opt 없음 = 예전과 같음)', calls.length);
  ok(/X\.info\[g\.id\] = \{ keys: C\.R\.filter\(\(x\) => !x\.sold\)\.map\(C\.keyOf\) \}/.test(T), '📈 지표 모두 갱신은 생성후판매완료 상품을 뺌');
  ok(/const cls = \(x\) => bqCls\(x, \{ st, SRV, sold: SOLD\.set \}\);/.test(T) && (T.match(/if \(\(st\.held \|\| \{\}\)\[k\]\) return 'hold';/g) || []).length === 1, '탭 나누기는 bqCls 한 곳(그룹 화면·상태판 같은 셈)');
  ok(/const L = T === 'sold' \? \[\] : tabs\[T\];/.test(T), '생성후판매완료 탭은 카드(입력칸) 목록이 비어 있음 — 실행·끌기·가격 바꾸기 대상 아님'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD5_1117 ${bad}개 실패` : '✓ tBKFOLD5_1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await W(p, 500);
  const D = (d) => new Date(Date.now() - d * 864e5).toISOString();
  const fid = await p.evaluate(async ([d10, d5, d3, d20]) => { window.prompt = () => null; window.__ANS = true; window.confirm = () => window.__ANS; if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 8; i++) { const uc = 'U5500000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(505937000 + i), title: '판매 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중', '하'][i % 4], status: '판매중', active: true, sku: ['AAA_hd', 'BBB', 'CCC_ms'][i % 3], registeredAt: '2026-09-0' + (i + 1) + 'T09:00:00', bookId: 'bz' + i }); }
    const L = (i) => S.plist.get('aladin_U5500000' + (10 + i));
    Object.assign(L(0), { status: '판매완료', active: false, goneFromActiveAt: d5 }); /* 5일 전 목록에서 빠짐(추정) */
    Object.assign(L(1), { status: '판매완료', active: false, soldBy: { kind: 'cash', at: d3 } }); /* 3일 전 현금 판매 */
    Object.assign(L(2), { status: '판매완료', active: false, goneFromActiveAt: d20 }); /* 그룹 만들기 전에 팔림 — 탭에 안 들어감 */
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 9000 + n * 900, pubDate: String(1995 + (n % 25)) + '-03-01' });
      if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400 + n * 60, sellerCode: '1', listingId: '9' + n }, { usedCode: l.usedCode, grade: l.grade, price: l.price, sellerCode: '996008', listingId: l.listingId }], usedTotal: n + 1, salesPoint: n * 37, lastCheckedAt: new Date().toISOString() }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const start = {}; for (let i = 0; i < 8; i++) start['U5500000' + (10 + i)] = 7000 + i * 250;
    const put = (id, name, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 8900, recentDays: 0, kw: '판매 시험' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: { ...start }, ...(x || {}) });
    await put('gA', '그룹 가'); await put('gB', '그룹 나', { picks: { aladin_U550000010: { price: 6000, at: d3, by: 't' } } }); await put('gC', '그룹 다'); await put('gD', '그룹 꺼짐'); await put('gZ', '그룹 보관', { archived: true });
    await db.collection('prd_system').doc('pricing').set({ batchOff: { gD: true }, mode: 'manual' }); S.prCfg = { ...(S.prCfg || {}), batchOff: { gD: true } };
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gZ'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '판매 시험 묶음' }); return a.fid; }, [D(10), D(5), D(3), D(20)]);
  const until = async (fn, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  /* ⓐ 기준 때 — 묶음 밖 = 그룹 만든 때 · 묶음에 넣으면 그때부터 다시 0 */
  const b0 = await p.evaluate(() => { const g = (S.prBatches || []).find((x) => x.id === 'gA'); const B = bqBaseAt('gA', g); const SO = bqSoldList('gA', g, { start: g.start, picks: {}, decided: {}, held: {}, added: {}, trashed: {} }); return { ms: B.ms, how: B.how, cr: Date.parse(g.createdAt), n: SO.rows.length, keys: SO.rows.map((r) => r.key), ch: SO.rows.map((r) => r.ch), est: SO.rows.map((r) => r.est), live: SO.live }; });
  ok(b0.how === 'group' && Math.abs(b0.ms - b0.cr) < 2000 && b0.n === 2 && b0.keys.includes('aladin_U550000010') && b0.keys.includes('aladin_U550000011') && !b0.keys.includes('aladin_U550000012'), '묶음 밖 그룹 = 그룹 만든 때 기준 — 그 뒤 팔린 2개만(만들기 전에 팔린 것은 뺌)', b0);
  ok(b0.ch.includes('cash') && b0.ch.includes('gone') && b0.est[b0.ch.indexOf('gone')] === true && b0.est[b0.ch.indexOf('cash')] === false, '판매 기록(현금)이 먼저 · 기록 없으면 목록에서 빠진 때(추정 표시)', b0);
  await p.evaluate(async (fid) => { await bkfTx({ t: 'put', fid, gids: ['gA', 'gC', 'gD', 'gZ'] }); }, fid); await until(() => !!bkfOf(bkfNorm(S.bkfold, null), 'gA'), 60);
  const b1 = await p.evaluate(([fid, d4]) => { const g = (S.prBatches || []).find((x) => x.id === 'gA'); const st = { start: g.start, picks: {}, decided: {}, held: {}, added: {}, trashed: {} }; const B = bqBaseAt('gA', g); const n1 = bqSoldList('gA', g, st).rows.length;
    const f = S.bkfold.folds[fid]; const keep = JSON.stringify(f.joined || {}); f.joined = { ...(f.joined || {}), gA: [...((f.joined || {}).gA || []), d4] }; const S4 = bqSoldList('gA', g, st); f.joined = JSON.parse(keep); return { how: B.how, ago: Date.now() - B.ms, n1, n4: S4.rows.map((r) => r.key) }; }, [fid, D(4)]);
  ok(b1.how === 'join' && b1.ago < 120000 && b1.n1 === 0, '묶음에 넣으면 기준 = 묶음에 들어온 때 → 다시 0부터', b1);
  ok(b1.n4.length === 1 && b1.n4[0] === 'aladin_U550000011', '들어온 때가 4일 전이면 그 뒤(3일 전) 팔린 것만', b1);
  /* ⓑ 같은 상품이 여러 그룹에 — 묶음 밖 그룹 나에서는 2개 · 묶음 안 그룹 가에서는 0 */
  const multi = await p.evaluate(async () => { const a = await bqCtx('gA', { dry: true }); const b = await bqCtx('gB', { dry: true }); return { a: a.sold.rows.length, b: b.sold.rows.length, bSoldInR: b.R.filter((x) => x.sold).map(b.keyOf), bMet: b.R.filter((x) => !x.sold).map(b.keyOf).includes('aladin_U550000010') }; });
  ok(multi.a === 0 && multi.b === 2 && !multi.bMet, '같은 상품도 그룹마다 따로 셈(가 0 · 나 2) · 지표 갱신 열쇠에서 빠짐', multi);
  /* ⓒ 그룹 나 화면 — 고른 상품도 판매완료면 결정 대기가 아니라 🏷 탭 · 읽기만 */
  await p.evaluate(() => { history.pushState({ batch: 1 }, ''); openBatchGroup('gB', { tab: 'sold' }); });
  const sc = await until(() => { const q = document.querySelector('#b_res [data-bqsold]'); if (!q || S.batchId !== 'gB') return null; const tb = {}; document.querySelectorAll('#b_res [data-btab]').forEach((b) => (tb[b.dataset.btab] = +((b.querySelector('b') || {}).textContent || -1))); const box = document.querySelector('#b_res .bqsoldl');
    return { T: S.batchT, tb, rows: document.querySelectorAll('#b_res .bqsr').length, inp: box ? box.querySelectorAll('input,textarea,select,button,[contenteditable],[draggable="true"]').length : -1, cards: document.querySelectorAll('#b_res [data-bk]').length, txt: q.textContent.slice(0, 200) }; }, 120);
  ok(sc && sc.T === 'sold' && sc.tb.sold === 2 && sc.rows === 2 && sc.inp === 0, '🏷 생성후판매완료 탭 = 2개 · 입력칸·단추·끌기 없음(읽기만)', sc);
  ok(sc && sc.tb.pick === 0, '고른 가격이 있던 상품도 판매완료면 결정 대기(실행 대상)에서 빠짐', sc && sc.tb);
  ok(sc && /판매율/.test(sc.txt) && /평균/.test(sc.txt), '머리에 판매율·판매까지 평균', sc && sc.txt);
  const nav0 = await p.evaluate(() => !!document.querySelector('[data-bkfnav]')); ok(!nav0, '묶음 밖 그룹 화면에는 묶음 길잡이 없음');
  /* ⓓ 묶음 화면 — 상태판 */
  await p.evaluate(async (fid) => { history.back(); await new Promise((r) => setTimeout(r, 300)); openBkfold(fid); }, fid);
  const tb = await until(() => { const c = S._bkfTb || {}; if (!(c.gA && c.gA.n && c.gC && c.gC.n)) return null; const el = document.getElementById('bkf_tb'); if (!el || !el.querySelector('[data-bkftbr="gA"] [data-bkftb]')) return null;
    return { gA: c.gA.n, gC: c.gC.n, gD: !!c.gD, off: !!el.querySelector('[data-bkftbon="gD"]'), arch: (el.querySelector('[data-bkftbr="gZ"]') || {}).textContent || '', tot: !!el.querySelector('.bkf-tbt') }; }, 200);
  ok(tb && tb.tot && tb.off && !tb.gD && /보관/.test(tb.arch), '상태판: 켜진 그룹은 저절로 셈 · 꺼진 그룹은 「누르면 계산」 · 보관 그룹은 셈에서 뺌 · 합계 줄', tb);
  if (tb) { await p.locator('[data-bkftbon="gD"]').click(); const d = await until(() => (S._bkfTb || {}).gD && S._bkfTb.gD.n ? S._bkfTb.gD.n : null, 120); ok(!!d, '꺼진 그룹을 누르면 그 그룹만 셈', d); }
  /* 칸 누름 → 그 그룹 그 탭 · 상태판 수 = 탭 수 */
  const pick = await p.evaluate(() => { const n = S._bkfTb.gC.n; const k = ['sel', 'ok', 'keep', 'bb'].find((x) => n[x] > 0) || 'sel'; return { k, n }; });
  await p.locator(`[data-bkftb="gC"][data-bkftbt="${pick.k}"]`).click();
  const g1 = await until(() => { if (S.batchId !== 'gC' || !Array.isArray(S.batchRes) || !document.querySelector('#b_res [data-btab]')) return null; const tb = {}; document.querySelectorAll('#b_res [data-btab]').forEach((b) => (tb[b.dataset.btab] = +((b.querySelector('b') || {}).textContent || -1))); return { T: S.batchT, tb, from: S.bkfFrom, nav: !!document.querySelector('[data-bkfnav]') }; }, 160);
  const same = g1 && ['sel', 'pick', 'done', 'ok', 'keep', 'bb', 'sold'].every((k) => (pick.n[k] || 0) === (g1.tb[k] || 0)); /* 0개 탭은 머리에 안 보일 수 있음 */
  ok(g1 && g1.T === pick.k && g1.from && g1.from.fid === fid && g1.nav, `칸을 누르면 그 그룹의 그 탭(${pick.k}) · 묶음 길잡이 보임`, g1);
  ok(same, '상태판 수 = 그룹 화면 탭 수(같은 셈)', { board: pick.n, tabs: g1 && g1.tb });
  /* 길잡이 — 다음 그룹(탭 그대로) · 묶음으로 돌아가기 */
  const nx = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-bkfnav] [data-bkfnavgo]')].find((x) => x.dataset.bkfnavgo !== 'gC' && /다음/.test(x.textContent)); return b ? b.dataset.bkfnavgo : null; });
  if (nx) { await p.locator(`[data-bkfnav] button[data-bkfnavgo="${nx}"]`).first().click(); const g2 = await until((nx) => (S.batchId === nx && Array.isArray(S.batchRes) ? { T: S.batchT, from: S.bkfFrom } : null), 120, nx); ok(g2 && g2.T === pick.k && g2.from && g2.from.fid === fid, '다음 › = 같은 묶음의 다음 그룹 · 탭 그대로 · 돌아갈 묶음 기억', { nx, g2 }); } else ok(false, '다음 › 단추가 없음');
  await p.locator('[data-bkfnav] [data-bkfnavback]').first().click(); const back = await until((fid) => (S.detail && S.detail.bkfold === fid && document.getElementById('bkf_tb') ? true : null), 80, fid);
  ok(back, '「◀ 📁 묶음」 = 묶음 화면으로 돌아감');
  /* ⓔ 매입가 하한 모두 보내기 — 단추가 있고, 하한 상품이 없으면 그룹마다 건너뜀(쓰기 없음) */
  const bb = await p.evaluate(async () => { const g = await batchLoadOne('gA'); const X = { info: {} }; const r = await BKF_OPS.bbuy.pre(g, X); return { r, btn: !!document.querySelector('#bkf_act [data-bkfrun="bbuy"]') }; });
  ok(bb.btn && Array.isArray(bb.r) && bb.r[0] === 'zero', '「🏷 매입가 하한 모두 알라딘 매입으로」 단추 · 하한 상품 0개 그룹은 건너뜀', bb);
  /* ⓕ 390px 넘침 없음 */
  await p.setViewportSize({ width: 390, height: 844 }); await W(p, 400);
  const ov = await p.evaluate(() => { const el = document.getElementById('bkf_tb'); const c = el && el.querySelector('.bkf-tb'); return { doc: document.documentElement.scrollWidth, w: innerWidth, el: c ? c.scrollWidth - c.clientWidth : null, row: (() => { const r = el && el.querySelector('[data-bkftbr="gA"]'); return r ? r.scrollWidth - r.clientWidth : null; })() }; });
  ok(ov.doc <= ov.w + 2 && ov.el != null && ov.el <= 2 && ov.row <= 2, '390px에서 상태판 가로 넘침 없음(줄이 카드로)', ov);
  await p.setViewportSize({ width: 1400, height: 900 });
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음', dlg);
  console.log(bad ? `❌ tBKFOLD5_1117 ${bad}개 실패` : '✓ tBKFOLD5_1117 통과'); return bad; });
