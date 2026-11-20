// tCTRLKPI_F — (정범님 I-1120-1213-19·I-1120-1226-20 · 일꾼 ctrlkpi2 · readnow-chats reports/CTRLKPI2_1120.md) 🛰 관제소 수치 카드 판 F
//  ① 글: 새 도우미가 CTRLKPI 덩어리 안 · Firestore 새 읽기 없음 · 첫 묶음 기본(rn-bkf-last 안 씀 · __none → 묶음 장부가 오면 첫 묶음) · ⚙ 가격 감시 설정 = priceCard()+bindPriceCard 그대로 · 브라우저 창 없음
//  ② 셈(화면 안 함수): ckOAt(한국 시각·Z 시각) · ckSpans(달 끝·2월 29일) · ckTkT/ckTk(▲ 빨강 up · ▼ 파랑 dn · ±0 · 새로 · –) · ckSoldPer(일·월·년·전체 · 앞 기간 · 취소·예스24 뺌 · 상품 거르기) · ckVwPer(가짜 조회 기록 — 일·전체·앞 기간)
//  ③ 화면(RN_PORT): 관제소 첫 열기 = 맨 앞 묶음 · 카드 여섯(감시 중 상품 수) · 최상단·유효최저가 「전체의 x%」 · 판매·방문 일/월/년/전체 칸 · 감시 창(그룹 표·켜고 끈 기록)
//     · 판매 창 기간 표 · ⚙ 가격 감시 설정(관제소·수동 일괄 맨 위 줄) → 같은 설정 창(🚀 반영 속도 포함) · 저장 = prd_system/pricing 한 곳 · 읽기 = 묶음·날마다 기록·조회 기록(한 번)·설정 문서뿐
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLKPI_F.js · 시험 자료(가짜 그룹·가짜 주문)에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('/* CTRLKPI-START'), b = T.indexOf('/* CTRLKPI-END */'); const B = a > 0 && b > a ? T.slice(a, b) : '';
  for (const f of ['ckNowK', 'ckOAt', 'ckSpans', 'ckSoldPer', 'ckVwPer', 'ckTkT', 'ckTk', 'ckWatch']) ok(new RegExp('(function ' + f + '\\(|const ' + f + ' = )').test(B), `${f} = CTRLKPI 덩어리 안`);
  const nf = B.slice(B.indexOf('const ckNowK')); ok(nf.length > 1000 && !/db\.collection\(|onSnapshot/.test(nf), '새 도우미(판 F)에 Firestore 읽기·듣기 없음');
  const OC = T.slice(T.indexOf('function openCtrlRoom('), T.indexOf('\n', T.indexOf('function openCtrlRoom(') + 200) + 600);
  ok(/ids\.find\(\(i\) => !N\.folds\[i\]\.archived\)/.test(OC) && !/rn-bkf-last/.test(OC.slice(0, OC.indexOf('S._ctrlAuto')).replace(/\/\*[\s\S]*?\*\//g, '')), '관제소 첫 열기 = 맨 앞(★ 고정 먼저) 안 보관 묶음 · 마지막 본 묶음 기억은 쓰지 않음', OC.slice(0, 400));
  ok(/S\._ctrlAuto\) \{ S\._ctrlAuto = false; if \(S\.detail && S\.detail\.bkfold === '__none'\)/.test(T), '묶음 장부가 늦게 와도(__none로 열린 채) 첫 묶음으로 바꿈');
  const PC = T.slice(T.indexOf('const prcfgBtn'), T.indexOf('function bindPriceCard('));
  ok(PC.length > 500 && /c\.innerHTML = priceCard\(\); try \{ bindPriceCard\(c\); \}/.test(PC) && !/db\.collection\(/.test(PC), '⚙ 가격 감시 설정 = 📦 상품 화면 카드 priceCard()+bindPriceCard 그대로(새 양식·새 저장 자리 없음)');
  ok(/\$\{plkFoldBtn\(1\)\}\$\{usedWinBtn\(\)\}\$\{prcfgBtn\(\)\}<\/div>/.test(T) && /\$\{B\('px', '👀 조회수 분석', '상품 조회수 분석'\)\}\$\{prcfgBtn\(\)\}/.test(T), '단추 자리 = 수동 일괄 맨 위 줄 · 관제소 맨 위 줄');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(nf + PC), '브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(nf + PC), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLKPI_F ${bad}개 실패` : '✓ tCTRLKPI_F 통과 (셈·화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
const SEED = async function (d10) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 8; i++) { const uc = 'U5900000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(509937000 + i), title: '판 F 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: '상', status: '판매중', active: true, bookId: 'bk59' + i }); }
  S.plist.set('aladin_U590000099', { id: 'aladin_U590000099', usedCode: 'U590000099', listingId: '509937099', title: '내린 책', price: 9000, qty: 1, grade: '상', status: '판매중지', active: false, bookId: 'bk5999' });
  S.pmLoaded = true; S.sellersLoaded = true;
  const K = (i) => 'aladin_U5900000' + (10 + i); const now = Date.now();
  const put = (id, name, on, keys, log) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: 'zz판F없음zz' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: keys, lastCount: keys.length, start: {}, watch: { on }, watchLog: log });
  await put('fA', '감시 켠 그룹', true, [K(0), K(1), K(2), 'aladin_U590000099'], [{ on: true, at: new Date(now - 2 * 3600e3).toISOString(), by: 't', what: '시험 켬' }]);
  await put('fB', '감시 끈 그룹', false, [K(3), K(4)], []);
  await put('fC', '둘째 묶음 그룹', false, [K(5)], []);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'fC'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '판 F 첫 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['fA', 'fB'] });
  const b = await bkfTx({ t: 'new', name: '판 F 둘째 묶음' }); await bkfTx({ t: 'put', fid: b.fid, gids: ['fC'] }); return [a.fid, b.fid]; };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  console.log('② 셈');
  const P = await p.evaluate(() => {
    const o = {}; o.at = [ckOAt('2026-11-20 09:05'), ckOAt('2026-11-20T00:30:00Z'), ckOAt('2026-11-19T15:10:00.000Z'), ckOAt('2026-11-20'), ckOAt('엉망'), ckOAt('')];
    const s1 = ckSpans('2026-03-31T10:00'), s2 = ckSpans('2028-02-29T08:15'); o.sp = [s1.d[2], s1.d[3], s1.m[2], s1.m[3], s1.y[3], s2.y[2], s2.y[3], s2.a[3]];
    o.tk = [ckTkT(5, 4), ckTkT(4, 5), ckTkT(3, 3), ckTkT(2, 0), ckTkT(null, 1), ckTkT(5, 4, { est: true }), ckTkT(1234, 1000)];
    const cls = (h) => { const d = document.createElement('div'); d.innerHTML = h; const e = d.firstElementChild; return [e.className, e.textContent]; };
    o.tc = [cls(ckTk(5, 4, { lb: '어제 대비' })), cls(ckTk(4, 5)), cls(ckTk(3, 3)), cls(ckTk(null, null, { lb: '어제 대비' }))];
    // 판매 — 오늘·어제(Z 시각)·400일 전 · 취소 줄 · 예스24
    const N = ckNowK(), td = N.slice(0, 10), yd = ckAdd(td, -1); const save = S.orders; S.orders = new Map(); const zY = new Date(Date.parse(yd + 'T00:00:00+09:00')).toISOString();
    const old = new Date(Date.now() - 400 * 864e5 + 9 * 3600e3).toISOString().slice(0, 10);
    S.orders.set('a', { kind: 'sale', platform: 'aladin', orderedAt: td + ' 00:00', items: [{ aladinUsedCode: 'U1', qty: 2, price: 1000, lineStatus: 'normal' }, { aladinUsedCode: 'U2', qty: 9, price: 1000, lineStatus: 'cancel' }] });
    S.orders.set('b', { kind: 'sale', platform: 'aladin', orderedAt: zY, items: [{ aladinUsedCode: 'U2', qty: 1, price: 3000, lineStatus: 'normal' }] });
    S.orders.set('c', { kind: 'sale', platform: 'aladin', orderedAt: old + ' 12:00', items: [{ listingKey: 'aladin_U3', qty: 3, price: 500, lineStatus: 'normal' }] });
    S.orders.set('d', { kind: 'sale', platform: 'yes24', orderedAt: td + ' 00:00', items: [{ qty: 7, price: 9000, lineStatus: 'normal' }] });
    const C = ckS(); C.spm = null; const R = ckSoldPer(null, 't1'); C.spm = null; const R1 = ckSoldPer(new Set(['aladin_U1']), 't2'); C.spm = null;
    o.sold = { d: [R.d.c, R.d.p, R.d.amt], a: [R.a.c, R.a.p], y: [R.y.c >= 2, R.y.p], first: R.first, f1: [R1.d.c, R1.a.c, R1.a.p], mem: ckSoldPer(null, 't1') === ckSoldPer(null, 't1') };
    S.orders = new Map(); C.spm = null; const R0 = ckSoldPer(null, 't3'); o.sold0 = [R0.d.c, R0.d.p, R0.d.why]; S.orders = save; C.spm = null;
    // 방문 — 가짜 조회 기록(어제 시각별 4 · 오늘 5 · 옛 합 100)
    const sx = S.px, so = S._pxVwOn; S.px = { vw: new Map([['L1', new Map([[td, { human: 5 }], [yd, { human: 4, x: { hr: { 0: 4 } } }]])], ['L2', new Map([[td, { human: 2 }]])]]), old: new Map([['L1', { human: 100 }], ['L2', { human: 10 }]]), oldOk: true, oldCut: ckAdd(td, -2), vwLoaded: true, v: 7 }; S._pxVwOn = true; C.vpm = null; C.vwm = null;
    const V = ckVwPer(new Set(['L1']), 'tv'); const hh = +N.slice(11, 13), mi = +N.slice(14, 16); o.vw = { d: [V.d.c, V.d.p, V.d.est], a: [V.a.c, V.a.p], want: hh >= 1 ? 4 : 4 * mi / 60, all: (C.vpm = null, ckVwPer(null, 'tv2').a.c) };
    S._pxVwOn = false; o.vwOff = ckVwPer(null, 'tv3'); S.px = sx; S._pxVwOn = so; C.vpm = null; C.vwm = null; return o; });
  ok(JSON.stringify(P.at) === JSON.stringify(['2026-11-20T09:05', '2026-11-20T09:30', '2026-11-20T00:10', '2026-11-20T00:00', '', '']), '주문 시각 → 한국 시각(한국 글 그대로 · Z 시각 +9시간 · 날만 = 00:00 · 엉망 = 빈 글)', P.at);
  ok(JSON.stringify(P.sp) === JSON.stringify(['2026-03-30T00:00', '2026-03-30T10:00', '2026-02-01T00:00', '2026-02-28T23:59', '2025-03-31T10:00', '2027-01-01T00:00', '2027-02-28T08:15', '2028-02-28T23:59']), '앞 기간 = 어제 같은 시각 · 지난달 같은 날(없으면 그달 끝) · 작년 같은 날(2/29 → 2/28) · 전체 = 어제까지', P.sp);
  ok(JSON.stringify(P.tk) === JSON.stringify(['▲1 (+25%)', '▼1 (−20%)', '±0 (0%)', '▲2 (새로)', '–', '≈▲1 (+25%)', '▲234 (+23.4%)']), '오르내림 글 = ▲·▼·± 차이와 %(새로·– · 어림 ≈)', P.tk);
  ok(P.tc[0][0] === 'ck-tk up' && P.tc[0][1] === '어제 대비 ▲1 (+25%)' && P.tc[1][0] === 'ck-tk dn' && P.tc[2][0] === 'ck-tk eq' && P.tc[3][0] === 'ck-tk na' && P.tc[3][1] === '어제 대비 –', '오르내림 색 갈래 = 오름 up(빨강) · 내림 dn(파랑) · 같음 eq · 모름 na', P.tc);
  ok(P.sold.d[0] === 2 && P.sold.d[1] === 1 && P.sold.d[2] === 2000 && P.sold.a[0] === 6 && P.sold.a[1] === 4 && P.sold.y[0] && P.sold.y[1] != null, '판매 기간 셈 — 일 2권(어제 같은 시각까지 1권 · Z 시각 바로 셈) · 전체 6권(어제까지 4권) · 취소 줄·예스24 뺌', P.sold);
  ok(P.sold.f1[0] === 2 && P.sold.f1[1] === 2 && P.sold.f1[2] === 0 && P.sold.mem, '상품 거르기(묶음 상품만) · 같은 때 다시 부르면 메모', P.sold);
  ok(P.sold0[0] === 0 && P.sold0[1] === null && /주문 기록 없음/.test(P.sold0[2]), '주문 기록 없음 → 앞 기간 모름(–)·까닭 글', P.sold0);
  ok(P.vw.d[0] === 5 && Math.abs(P.vw.d[1] - P.vw.want) < 1e-9 && P.vw.d[2] === false && P.vw.a[0] === 109 && P.vw.a[1] === 104 && P.vw.all === 109 + 12, '방문 기간 셈 — 오늘 5 · 어제 같은 시각까지 = 어제 시각별 기록 · 전체 = 옛 합 + 옛 합 뒤 날마다(묶음 상품만)', P.vw);
  ok(P.vwOff === null, '조회 기록 받기 전 = 방문 기간 셈 안 함(null)', P.vwOff);
  console.log('③ 화면');
  await p.evaluate(() => { try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  const [f1, f2] = await p.evaluate(async ([src, d]) => (eval('(' + src + ')'))(d), [SEED.toString(), new Date(Date.now() - 10 * 864e5).toISOString()]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate(([a, b]) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[a] && S.bkfold.folds[b] && S.bkfold.folds[a].gids.length === 2), [f1, f2])) break; await Wt(p, 150); }
  await p.evaluate(() => { window._ckR = []; const dc = db.collection; window._ckDC = dc; db.collection = function (n) { window._ckR.push(String(n)); return dc.apply(this, arguments); }; });
  const wantF = await p.evaluate(() => { const { N, ids } = ctrlFolds(); return ids.find((i) => !N.folds[i].archived); }); const notF = wantF === f1 ? f2 : f1;
  await p.evaluate((x) => { try { localStorage.setItem('rn-bkf-last', x); } catch (_) {} }, notF);
  await p.setViewportSize({ width: 1280, height: 760 }); await p.evaluate(() => openCtrlRoom());
  for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!S._ckAll && !S._ckAllRun && document.querySelectorAll('#bkf_kpi [data-ctrlkpi]').length === 6 && Object.keys(S._bkfTb || {}).length >= 2)) break; await Wt(p, 150); }
  await p.evaluate(() => { S._ctrlKpi = null; ctrlKpiPaint(); }); await Wt(p, 300);
  let m = await p.evaluate(() => ({ det: S.detail && S.detail.bkfold, on: !!S._pxVwOn }));
  ok(m.det === wantF && [f1, f2].includes(wantF), '관제소 처음 열기 = 띠 맨 앞 묶음(마지막 본 묶음 기억이 다른 묶음이어도)', { m, wantF, notF });
  ok(m.on, '관제소를 열면 조회 기록을 한 번 저절로 받기 시작(조회수 분석과 같은 불러오기)', m);
  if (m.det !== f1) { await p.evaluate((f) => { history.back(); }, f1); await Wt(p, 300); await p.evaluate((f) => openCtrlRoom(f), f1);
    for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => S.detail && S.detail.bkfold === f && !S._ckAllRun && document.querySelectorAll('#bkf_kpi [data-ctrlkpi]').length === 6, f1)) break; await Wt(p, 150); }
    await p.evaluate(() => { S._ctrlKpi = null; ctrlKpiPaint(); }); await Wt(p, 300); }
  m = await p.evaluate(() => { const C = [...document.querySelectorAll('#bkf_kpi [data-ctrlkpi]')]; const g = (k) => document.querySelector(`#bkf_kpi [data-ctrlkpi="${k}"]`);
    const W = ckWatch(S.detail.bkfold); const want = new Set(); for (const gid of ['fA']) for (const k of ckGKeys(gid)) if (CK_SALE(S.plist.get(k))) want.add(k);
    return { kinds: C.map((c) => c.dataset.ctrlkpi).join(), pct: ['top', 'low'].map((k) => (g(k).querySelector('.ck-pct') || {}).textContent || ''), totPct: !!g('tot').querySelector('.ck-pct'), tot: ctrlKpiCalc(S.detail.bkfold).tot, top: ctrlKpiCalc(S.detail.bkfold).top,
      per: ['view', 'sold'].map((k) => [...g(k).querySelectorAll('.ck-pc')].map((x) => x.dataset.ckp + ':' + x.querySelector('i').textContent).join()), wide: ['view', 'sold'].every((k) => g(k).classList.contains('ck-wide')),
      wbig: g('watch').querySelector('.pxtb').textContent, wtk: (g('watch').querySelector('.ck-tkl') || {}).textContent || '', wpct: (g('watch').querySelector('.ck-pct') || {}).textContent || '', W: W && { n: W.n, gOn: W.gOn, gAll: W.gAll, end: W.end, prev: W.prev }, want: want.size,
      out: C.filter((c) => c.getBoundingClientRect().right > innerWidth + 1).length }; });
  ok(m.kinds === 'tot,top,low,view,sold,watch', '카드 여섯 — 감시 중 상품 수 더함', m.kinds);
  ok(/^전체의 \d/.test(m.pct[0]) && /^전체의 \d/.test(m.pct[1]) && !m.totPct, '최상단·유효최저가 옆 「전체의 x%」(총 상품수엔 없음)', m);
  ok(m.per.every((x) => x === 'd:일,m:월,y:년,a:전체') && m.wide, '판매수·상품 방문수 = 일·월·년·전체 네 칸(넓은 카드)', m.per);
  ok(m.W && m.W.gOn === 1 && m.W.gAll === 2 && m.W.n === m.want && m.W.n >= 3 && m.wbig === String(m.W.n) && m.W.end >= 1, '감시 중 상품 수 = 감시 켠 그룹 판매 중 상품(내린 책 뺌)', m);
  ok(/^24시간 전 대비 ≈?▲\d+ \(새로\)$/.test(m.wtk) && m.W.prev === 0 && /^전체의 \d/.test(m.wpct), '감시 카드 오르내림 = 24시간 전(2시간 전에 켬 → 그땐 0 · 새로) · 전체의 x%', m);
  ok(!m.out, '카드가 화면 안', m);
  // 감시 창
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="watch"]').click()); await Wt(p, 200);
  let w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const tx = ov ? ov.textContent : ''; return { ov: !!ov, rows: ov ? ov.querySelectorAll('table.ck-wt tbody tr').length : 0, on: /감시 켠 그룹 1\/2개/.test(tx), log: /감시 켠 그룹 → 🟢 켬/.test(tx) && /시험 켬/.test(tx), how: !!(ov && ov.querySelector('details.ck-how')) }; });
  ok(w.ov && w.rows === 2 && w.on && w.log && w.how, '감시 창 = 그룹 표(켬·끔·판매 중·잠금) · 최근 7일 켜고 끈 기록 · 읽는 법', w);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 판매 창 — 기간 표
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="sold"]').click()); await Wt(p, 200);
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { rows: ov ? [...ov.querySelectorAll('tr[data-ckper]')].map((r) => r.dataset.ckper).join() : '' }; });
  ok(w.rows === 'd,m,y,a', '판매 창 = 일·월·년·전체 기간 표(지금·견줄 때·오르내림)', w);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // ⚙ 가격 감시 설정 — 관제소 맨 위 줄
  const r0 = await p.evaluate(() => window._ckR.length);
  await p.evaluate(() => document.querySelector('#bkf_top [data-prcfg]').click());
  for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !!document.querySelector('#prcfg_w #pr_aspd'))) break; await Wt(p, 150); }
  w = await p.evaluate(() => { const ov = document.getElementById('prcfg_w'); return { ov: !!ov, card: !!(ov && ov.querySelector('.card[data-blk="p_watch"]')), spd: !!(ov && ov.querySelector('#pr_aspd')) && !!(ov && ov.querySelector('#pr_aspd_s')), det: S.detail && S.detail.bkfold }; });
  ok(w.ov && w.card && w.spd && w.det, '관제소 「⚙ 가격 감시 설정」 → 📦 상품 화면과 같은 「가격 감시 (판정 엔진)」 카드 창(🚀 반영 속도 포함) · 관제소 그대로', w);
  await p.evaluate(() => { const i = document.querySelector('#prcfg_w #pr_aspd'); i.value = '3'; document.querySelector('#prcfg_w #pr_aspd_s').click(); });
  let sv = null; for (let i = 0; i < 40; i++) { sv = await p.evaluate(async () => { const d = await window._ckDC.call(db, 'prd_system').doc('pricing').get(); return d.exists ? d.data().applySpeed : null; }); if (sv === 3) break; await Wt(p, 150); }
  ok(sv === 3, '창에서 반영 속도 3배 저장 → prd_system/pricing(📦 상품 화면 카드와 같은 저장 자리)', sv);
  for (let i = 0; i < 40; i++) { if (await p.evaluate(() => (document.querySelector('#prcfg_w #pr_aspd') || {}).value === '3')) break; await Wt(p, 150); }
  ok(await p.evaluate(() => (document.querySelector('#prcfg_w #pr_aspd') || {}).value === '3'), '저장 뒤 창이 새 값으로 다시 그려짐');
  await p.keyboard.press('Escape'); await Wt(p, 200);
  w = await p.evaluate(() => ({ ov: !!document.getElementById('prcfg_w'), det: S.detail && S.detail.bkfold, T: S._prcfgT }));
  ok(!w.ov && w.det && !w.T, 'Esc = 설정 창만 닫음(관제소 그대로 · 다시 그리기 멈춤)', w);
  const rN = await p.evaluate((r0) => window._ckR.slice(r0), r0);
  ok(rN.every((n) => /^(prd_system|app_settings|prd_price_batches|ctl_kpi_m|ctl_kpi_days|px_\w+)$/.test(n)), '설정 창 읽기 = 설정 문서(prd_system·app_settings)뿐 · 상품마다 읽기 없음', rN);
  // 수동 일괄 화면 맨 위 줄
  await p.evaluate(() => history.back()); await Wt(p, 400);
  await p.evaluate(() => openBatch({ id: 'fB' })); await Wt(p, 600);
  const hb = await p.evaluate(() => !!document.querySelector('#sheet .sh [data-prcfg]'));
  ok(hb, '수동 일괄 화면 맨 위 줄에 「⚙ 가격 감시 설정」 단추', hb);
  if (hb) { await p.evaluate(() => document.querySelector('#sheet .sh [data-prcfg]').click()); for (let i = 0; i < 30; i++) { if (await p.evaluate(() => !!document.querySelector('#prcfg_w #pr_aspd'))) break; await Wt(p, 150); }
    w = await p.evaluate(() => ({ v: (document.querySelector('#prcfg_w #pr_aspd') || {}).value, sheet: document.getElementById('sheet').classList.contains('on') }));
    ok(w.v === '3' && w.sheet, '수동 일괄에서 연 창도 같은 값(3배) · 수동 일괄 화면 그대로', w);
    await p.evaluate(() => document.querySelector('#prcfg_w .bigask-x').click()); await Wt(p, 200); ok(!(await p.evaluate(() => !!document.getElementById('prcfg_w'))), '✕ = 닫힘'); }
  const all = await p.evaluate(() => window._ckR.slice());
  ok(all.every((n) => /^(prd_system|app_settings|prd_price_batches|ctl_kpi_m|ctl_kpi_days|px_\w+|prd_batch_\w+|prd_dec\w*|prd_price_\w+)$/.test(n)) && all.filter((n) => n === 'px_views').length <= 2, '전체 읽기 = 묶음·날마다 기록·조회 기록(한 번)·설정뿐 · 상품마다 읽기 없음', [...new Set(all)]);
  await p.evaluate(() => { db.collection = window._ckDC; try { localStorage.removeItem('rn-ck'); localStorage.removeItem('rn-bkf-last'); } catch (_) {} });
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLKPI_F ${bad}개 실패` : '✓ tCTRLKPI_F 통과'); return bad; });
