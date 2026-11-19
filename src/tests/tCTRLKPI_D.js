// tCTRLKPI_D — (정범님 I-1119-2051-30·I-1119-2056-31 · 일꾼 kpia1 판 D · 설계 readnow-chats reports/CTRLKPI1_1119.md 5-0~5-3·9장 D줄) 🛰 관제소 ①②③ 창 「📋 날마다 기록」 + 카드 어제 대비
//  판 B(kpib1) 클라우드가 아직 운영에 없어 가짜 달 문서(ctl_kpi_m/{달}.d.{날})·가짜 날 문서(ctl_kpi_days/{날})를 가짜 Firestore에만 심고 봄(운영 쓰기 없음)
//  ① 글: 읽는 칸은 ctl_kpi_m·ctl_kpi_days 두 개 get만 · 빈 날 「없음」 글 · 거르지 않은 동급 최저 딱지 · 브라우저 창 없음 · 원인 단정 말 없음
//  ② 화면(RN_PORT): 카드 어제 대비 = 01시 기록 두 날 차이 · 창 = 기간·묶기·범위·수/비율 · 기록 없는 날 = 「없음」(0 아님 · 선 끊김) · 비율 = ÷시장 지표 있음(nM)
//     · 되살린 날 = lowU + 딱지 · 주·달 묶음 얻음·잃음·판매 합 = 날 합 · 묶음/가게 전체 바꿈 · 날 줄 누름 = 날 문서 읽기 정확히 1번(다시 눌러도 0)
//     · 「n개 더 있음」 = 목록 넘친 수 + cut · 묶음 범위 = 묶음 상품만 · 상품 이름 → 상품 창 · 읽기 실패 → 다시 읽기(저절로 되풀이 안 함) · 폭 380 가로 넘침 없음
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLKPI_D.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('/* CTRLKPI-START'), b = T.indexOf('/* CTRLKPI-END */'); const B = a > 0 && b > a ? T.slice(a, b) : '';
  const DC = [...B.matchAll(/db\.collection\(([^)]*)\)\.doc\([^)]*\)\.(\w+)\(/g)].map((m) => m[1] + '.' + m[2]);
  ok(DC.length === 2 && DC.includes("'ctl_kpi_m'.get") && DC.includes("'ctl_kpi_days'.get") && (B.match(/db\.collection\(/g) || []).length === 2, '읽는 칸 = 달 문서·날 문서 get 두 군데뿐', DC);
  ok(/function ckLoad\(yms\)[\s\S]{0,400}ckFresh/.test(B) && /const CK_TTL = 30 \* 60e3/.test(B), '달 문서 30분 메모(같은 달 두 번 안 받음)');
  ok(/Date\.now\(\) - C\.failAt < 60e3/.test(B), '읽기 실패 뒤 1분은 저절로 다시 읽지 않음(되풀이 막음)');
  ok(/없음\$\{p\.why \? ' — ' \+ esc\(p\.why\) : ' — 기록한 날이 아님'\}/.test(B), '기록 없는 날 줄 = 「없음」');
  ok(/거르지 않은 동급 최저/.test(B) && /되살린 날/.test(B), '거르지 않은 동급 최저·되살린 날 딱지 글');
  ok(/function ctrlKpiMore\(kind, K\) \{ return ckMore\(kind, K\); \}/.test(T) && /ckYdLine\(kind, K\)/.test(T) && /ckYdSub\(k, K \? fid : null\)/.test(T), '◆ctrlkpi 창·카드가 판 D를 부름');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(B), '브라우저 창 없음'); ok(!/때문에|덕분에|효과|올렸다/.test(B), '원인을 단정하는 말 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(B), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLKPI_D ${bad}개 실패` : '✓ tCTRLKPI_D 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SEED = async function (d10) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 12; i++) { const uc = 'U5800000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(508937000 + i), title: '수치 카드 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk58' + i }); }
  S.plist.set('aladin_U580000099', { id: 'aladin_U580000099', usedCode: 'U580000099', listingId: '508937099', title: '내린 책', price: 9000, qty: 1, grade: '상', status: '판매중지', active: false, bookId: 'bk5899' });
  S.plist.set('yes24_T58', { id: 'yes24_T58', listingId: 'Y58', title: '예스24 책', price: 9000, qty: 1, grade: '상', status: '판매중', active: true, bookId: 'bk58y' });
  if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
  for (const l of S.plist.values()) { if (!/^aladin_U58/.test(l.id)) continue; n++; const dp = [0, -400, 400][n % 3]; /* 같은 값 · 남이 더 쌈 · 우리가 더 쌈 */
    if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) + dp, sellerCode: '0', sellerName: '알라딘', listingId: '9' + n }] }); }
  S.pmLoaded = true; S.sellersLoaded = true;
  const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
  const ids = ['gA', 'gB', 'gC', 'gD', 'gE']; for (let i = 0; i < 5; i++) await put(ids[i], '수치 카드 그룹 ' + i);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gE'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '카드 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ids }); return a.fid; };
/* 가짜 날마다 기록 — 오늘부터 20일 전까지 · 5·6일 전 없음 · 10일 전 = 되살린 날(판매자 분류 없음) · 20일 전 = 첫 기록 날(어제와 맞댐 없음) · 묶음 칸 F는 8일 전부터 */
const KSEED = async function (fid) { const t = ckDay(); const M = {};
  for (let i = 0; i <= 20; i++) { if (i === 5 || i === 6) continue; const d = ckAdd(t, -i); const ym = d.slice(0, 7), dd = d.slice(8, 10); M[ym] = M[ym] || {};
    const rb = i === 10; const T = { n: 100 - i, nM: 80, nF: 5, top: 30 - i, topU: 2, tie: 1, low: rb ? null : 50 - i, lowLt: rb ? null : 20, lowN: rb ? null : 70, lowX: rb ? null : 10, lowU: 60 - i, px: 40, lk: 3, lkc: 1 };
    const e = { T, mvT: i === 20 ? null : { g: 3, l: 2, k: 25, w: { sold: 1, under: 1 }, gw: { new: 2, down: 1 } }, mvL: i === 20 ? null : { g: 2, l: 1, k: 40, w: { gone: 1 }, gw: { mkt: 2 } }, act: {} };
    if (rb) { e.rb = 1; e.lowErr = 'rebuild'; e.mvL = null; }
    if (i <= 8) e.F = { [fid]: { n: 12, nM: 10, top: 4 + (i % 3), low: 6, g: 1, l: i % 2, gL: 1, lL: 1 } };
    if (i >= 1) e.fl = { sold: 2, amt: 14000, v: null, vb: null }; M[ym][dd] = e; }
  for (const [ym, d] of Object.entries(M)) await db.collection('ctl_kpi_m').doc(ym).set({ ym, ver: 1, upAt: new Date().toISOString(), d });
  await db.collection('ctl_kpi_days').doc(t).set({ day: t, ver: 1, at: new Date().toISOString(), src: 'ml_days', G: { gA: { n: 3, nM: 2, top: 1, low: 1, g: 0, l: 0, gL: 0, lL: 0, age: 1 }, gZZ: { n: 9, nM: 8, top: 2, low: 3, g: 1, l: 1, gL: 0, lL: 0, age: 5 } },
    mv: { top: { gain: ['aladin_U580000010|new|7000|7100'], lost: ['aladin_U580000011|under|7250|7000', 'aladin_UZZZ99999|sold|8000|7900', 'aladin_U580000012|unk|7500|'] }, low: null }, cut: { topGain: 0, topLost: 5, lowGain: 0, lowLost: 0 }, lowS: 0 });
  S._ck = null; return Object.keys(M); };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  await p.evaluate(() => { try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  const f = await p.evaluate(async ([src, d]) => (eval('(' + src + ')'))(d), [SEED.toString(), new Date(Date.now() - 10 * 864e5).toISOString()]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f] && S.bkfold.folds[f].gids.length === 5), f)) break; await Wt(p, 150); }
  const yms = await p.evaluate(async ([src, f]) => (eval('(' + src + ')'))(f), [KSEED.toString(), f]);
  await p.evaluate(() => { window._ckR = []; const dc = db.collection; window._ckDC = dc; db.collection = function (n) { window._ckR.push(String(n)); return dc.apply(this, arguments); }; });
  const R = (n) => p.evaluate((n) => window._ckR.filter((x) => x === n).length, n);
  const open = async (w, h, fid) => { await p.setViewportSize({ width: w, height: h }); await p.evaluate((f) => openBkfold(f), fid);
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.getElementById('bkf_tb') && Object.keys(S._bkfTb || {}).length >= 3 && !!S._ckAll && !S._ckAllRun && document.querySelectorAll('#bkf_kpi [data-ctrlkpi]').length === 5)) break; await Wt(p, 150); }
    await p.evaluate(() => { S._ctrlKpi = null; ctrlKpiPaint(); }); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => /어제 대비/.test((document.querySelector('#bkf_kpi [data-ctrlkpi="top"] .pxts') || {}).textContent || ''))) break; await Wt(p, 150); } };
  const win = async (kind) => { await p.evaluate((k) => document.querySelector(`#bkf_kpi [data-ctrlkpi="${k}"]`).click(), kind); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !!document.querySelector('#ctrl_kpi .ckd-t') || /아직 기록한 날|기록이 없습니다|읽지 못했습니다/.test((document.querySelector('#ctrl_kpi [data-ctrlkpimore]') || {}).textContent || ''))) break; await Wt(p, 150); } };
  const set = async (v) => { await p.evaluate((v) => document.querySelector(`#ctrl_kpi [data-ckset="${v}"]`).click(), v); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !S._ck.wl && !S._ck.busy.size)) break; await Wt(p, 120); } await Wt(p, 120); };
  const row = (d) => p.evaluate((d) => { const r = document.querySelector(`#ctrl_kpi tr[data-ckday="${d}"]`); return r ? [...r.cells].map((c) => c.textContent.trim()) : null; }, d);
  const D = await p.evaluate(() => { const t = ckDay(); return { t, y: ckAdd(t, -1), d5: ckAdd(t, -5), d10: ckAdd(t, -10), d9: ckAdd(t, -9) }; });
  await open(1280, 720, f);
  // 카드 — 어제 대비(01시 기록 두 날) · 묶음 F.top 오늘 4 · 어제 5 → −1 · 가게 전체 T.top 30 vs 29
  let c = await p.evaluate(() => [...document.querySelectorAll('#bkf_kpi [data-ctrlkpi]')].map((x) => x.querySelector('.pxts').textContent));
  ok(/어제 대비 −1$/.test(c[1]) && /어제 대비 ±0$/.test(c[0]) && !/어제 대비/.test(c[3]) && !/어제 대비/.test(c[4]), '카드 어제 대비 = 묶음 01시 기록 두 날 차이(최상단 −1 · 총 ±0) · 방문수·판매수엔 안 붙음', c);
  ok((await R('ctl_kpi_m')) >= 1 && (await R('ctl_kpi_m')) <= 2 && (await R('ctl_kpi_days')) === 0, '카드 = 달 문서 1~2번만 읽음 · 날 문서 0', await p.evaluate(() => window._ckR.slice()));
  // 최상단 창 — 묶음 범위(기본)
  await win('top'); let n0 = await R('ctl_kpi_m');
  let w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { yd: (ov.querySelector('.ck-yd') || {}).textContent || '', sel: [...ov.querySelectorAll('.ckd-sel button.on')].map((b) => b.dataset.ckset), rows: ov.querySelectorAll('.ckd-t tbody tr[data-ckday]').length, svg: !!ov.querySelector('svg.ckd-line'), water: !!ov.querySelector('svg.ckd-water'), sum: (ov.querySelector('.ckd-sum') || {}).textContent || '' }; });
  ok(/^어제 대비\(01시 기록 \d+\/\d+ → \d+\/\d+\) — 이 묶음 4 · 어제 대비 −1 · 가게 전체 30 · 어제 대비 \+1$/.test(w.yd), '창 맨 위 「어제 대비」 = 01시 기록 날짜 · 이 묶음 · 가게 전체', w.yd);
  ok(w.sel.join() === 'sc:fold,rng:30,per:d,vw:n' && w.rows === 30 && w.svg && w.water, '기본 = 이 묶음 · 30일 · 날 · 수 — 날 줄 30 · 선 그림 · 얻음·잃음 그림', w);
  ok(/마지막 기록 \d+\/\d+ 01시 4/.test(w.sum) && /기록 있는 날 7\/30일/.test(w.sum), '요약 줄 = 마지막 기록 · 기록 있는 날 수(묶음은 8일 전부터 · 5·6일 전 없음 → 7일)', w.sum);
  let r = await row(D.d9); ok(r && r[1] === '없음 — 이 묶음은 이날 기록 없음', '묶음 칸이 없는 날 = 「없음」(0 아님)', r);
  r = await row(D.d5); ok(r && r[1] === '없음 — 기록한 날이 아님', '기록 없는 날 = 「없음 — 기록한 날이 아님」', r);
  r = await row(D.t); ok(r && r[1] === '4' && r[2] === '40%' && r[3] === '1' && r[4] === '0', '묶음 오늘 줄 = 최상단 4 · 비율 4÷10(묶음 시장 지표 있음) · 얻음 1 · 잃음 0', r);
  ok((await R('ctl_kpi_m')) <= 2, '30일 창 = 달 문서 2번 넘게 안 읽음(카드에서 받은 것 다시 씀)', await p.evaluate(() => window._ckR.slice()));
  // 가게 전체로 · 비율
  await set('sc:all'); r = await row(D.t); ok(r && r[1] === '30' && r[2] === '37.5%' && r[3] === '3' && r[4] === '2' && r[5] === '25', '가게 전체 오늘 줄 = 30 · 비율 30÷80(시장 지표 있음 · 총 상품수 아님) · 얻음 3 · 잃음 2 · 지킴 25', r);
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { why: [...ov.querySelectorAll('.ckd-cols table')].map((t) => t.textContent), pf: JSON.parse(localStorage.getItem('rn-ck') || '{}') }; });
  ok(w.why.length === 2 && /팔림\(좋은 잃음\)/.test(w.why[0]) && /남이 더 쌈/.test(w.why[0]) && /새 등록/.test(w.why[1]) && w.pf.sc === 'all', '잃은 까닭·얻은 까닭 표(팔림 = 좋은 잃음) · 고른 범위 기억(rn-ck)', w);
  r = await row(await p.evaluate(() => ckAdd(ckDay(), -20))); ok(r && r[1] === '10' && r[3] === '—' && r[4] === '—', '첫 기록 날 = 수는 있고 얻음·잃음은 「—」(어제와 맞댈 수 없음)', r);
  await set('vw:r'); w = await p.evaluate(() => document.querySelector('#ctrl_kpi .ckd-sum').textContent); ok(/01시 37\.5%/.test(w), '보기 「비율」 = 요약도 ÷시장 지표 있음', w); await set('vw:n');
  // 주·달 묶기 — 흐름 수 합 = 날 합
  const sums = await p.evaluate(() => { const S1 = (per, k) => ckSeries('top', 'all', 30, per, null).rows.reduce((s, r) => s + (r[k] || 0), 0); const o = {}; for (const k of ['g', 'l', 'sold', 'amt']) o[k] = [S1('d', k), S1('w', k), S1('m', k)]; return o; });
  ok(Object.values(sums).every((a) => a[0] > 0 && a[0] === a[1] && a[0] === a[2]), '주·달로 묶어도 얻음·잃음·판매 권수·금액 합 = 날 합', sums);
  await set('per:w'); w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { n: ov.querySelectorAll('.ckd-tw .ckd-t tbody tr').length, wk: [...ov.querySelectorAll('.ckd-tw .ckd-t tbody tr td:first-child')].every((td) => / 주/.test(td.textContent)), day: ov.querySelectorAll('tr[data-ckday]').length }; });
  ok(w.n >= 5 && w.n <= 6 && w.wk && w.day === 0, '주로 묶기 = 주 줄(월요일부터) · 날 누름 없음', w); await set('per:d');
  // 유효 최저가 — 되살린 날 = 거르지 않은 동급 최저(lowU) 딱지
  await p.keyboard.press('Escape'); await Wt(p, 150); await win('low');
  r = await row(D.d10); ok(r && /^50 거르지 않은 동급 최저/.test(r[1]) && r[3] === '—', '되살린 날 = lowU 50 + 「거르지 않은 동급 최저」 딱지 · 얻음·잃음 비움', r);
  r = await row(D.t); ok(r && r[1] === '50' && r[2] === '71.4%' && r[6] === '20' && r[7] === '10', '보통 날 = 유효 최저가 50 · 비율 ÷ 견줄 수 있던 수(70) · 더 싸야만 20 · 견줄 것 없음 10', r);
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { dash: !!ov.querySelector('svg.ckd-line path[stroke-dasharray]'), hol: !!ov.querySelector('svg.ckd-line circle[fill="#fff"]'), gap: ov.querySelectorAll('svg.ckd-line rect.ckd-gap').length }; });
  ok(w.dash && w.hol && w.gap === 11, '그림 = 거르지 않음 점선 · 되살린 날 속 빈 점 · 기록 없는 날 11개(5·6일 전 + 첫 기록 전 9일)는 바닥 눈금(선 끊김)', w);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 그날 누름 — 날 문서 정확히 1번
  await win('top'); const d0 = await R('ctl_kpi_days');
  await p.evaluate((d) => document.querySelector(`#ctrl_kpi tr[data-ckday="${d}"]`).click(), D.t); for (let i = 0; i < 30; i++) { if (await p.evaluate(() => !!document.querySelector('#ckd_day .ckd-li'))) break; await Wt(p, 120); }
  w = await p.evaluate(() => { const el = document.getElementById('ckd_day'); return { tx: el ? el.textContent : '', li: el ? [...el.querySelectorAll('.ckd-li button')].map((b) => b.dataset.ckprd) : [], sel: !!document.querySelector('#ctrl_kpi tr.sel') }; });
  ok((await R('ctl_kpi_days')) - d0 === 1, '날 줄 누름 = 날 문서 읽기 정확히 1번', await R('ctl_kpi_days') - d0);
  ok(w.li.length === 4 && w.li.includes('aladin_UZZZ99999') && /잃음 8/.test(w.tx) && /5개 더 있음/.test(w.tx) && /1500개까지만/.test(w.tx) && w.sel, '가게 전체 = 얻음 1·잃음 3 목록 · 잃음 8 = 3 + 클라우드가 자른 5(「5개 더 있음」)', w);
  ok(/남이 더 쌈/.test(w.tx) && /우리 7,250원 · 견준 7,000원/.test(w.tx) && /견준 —/.test(w.tx), '목록 줄 = 까닭 이름 · 우리 값 · 견준 값(없으면 —)', w.tx.slice(0, 400));
  await p.evaluate((d) => document.querySelector(`#ctrl_kpi tr[data-ckday="${d}"]`).click(), D.t); await Wt(p, 300);
  ok((await R('ctl_kpi_days')) - d0 === 1, '같은 날 다시 누름 = 더 읽지 않음(메모)', await R('ctl_kpi_days') - d0);
  await set('sc:fold'); w = await p.evaluate(() => ({ li: [...document.querySelectorAll('#ckd_day .ckd-li button')].map((b) => b.dataset.ckprd), fk: [...ckFoldKeys(S.detail.bkfold)].length, tx: (document.getElementById('ckd_day') || {}).textContent || '' }));
  ok(w.fk > 0 && w.li.length === 3 && !w.li.includes('aladin_UZZZ99999') && /이 묶음 상품만/.test(w.tx), '묶음 범위 = 그날 목록도 묶음 상품만(묶음 밖 상품 빠짐)', w);
  await p.evaluate(() => document.querySelector('#ckd_day [data-ckprd="aladin_U580000011"]').click()); await Wt(p, 500);
  w = await p.evaluate(() => ({ ov: !!document.getElementById('ctrl_kpi'), pr: (document.getElementById('sheet') || {}).textContent || '' }));
  ok(!w.ov && /수치 카드 시험 책 1/.test(w.pr), '상품 이름 누름 → 안쪽 창 닫고 상품 창', { ov: w.ov, pr: w.pr.slice(0, 120) });
  await p.evaluate(() => history.back()); await Wt(p, 500);
  // 다시 열기 = 메모(새 읽기 0) · 365일 = 없는 달은 한 번씩만
  await open(1280, 720, f); const m1 = await R('ctl_kpi_m'); await win('tot'); await Wt(p, 300);
  ok((await R('ctl_kpi_m')) === m1, '30분 안에 다시 열면 달 문서 새 읽기 0', [m1, await R('ctl_kpi_m')]);
  await set('rng:365'); const m2 = await R('ctl_kpi_m'); await set('rng:14'); await set('rng:365');
  ok(m2 - m1 <= 12 && (await R('ctl_kpi_m')) === m2, '365일 = 달 문서 13개 안에서 한 번씩만(되돌아와도 다시 안 읽음)', [m1, m2, await R('ctl_kpi_m')]);
  w = await p.evaluate(() => document.querySelectorAll('#ctrl_kpi .ckd-t tbody tr[data-ckday]').length); ok(w === 365, '365일 = 날 줄 365', w);
  await set('rng:0'); w = await p.evaluate(() => ({ n: document.querySelectorAll('#ctrl_kpi .ckd-t tbody tr[data-ckday]').length, first: ckAdd(ckDay(), -20) })); ok(w.n === 21, '전체 = 첫 기록 날(20일 전)부터 오늘까지 21줄', w); await set('rng:30');
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 읽기 실패 — 오류 글 + 다시 읽기 · 저절로 되풀이 안 함
  await p.evaluate(() => { S._ck = null; const dc = window._ckDC; db.collection = function (n) { window._ckR.push(String(n)); if (n === 'ctl_kpi_m') return { doc: () => ({ get: () => Promise.reject(Object.assign(new Error('x'), { code: 'unavailable' })) }) }; return dc.apply(this, arguments); }; });
  const e0 = await R('ctl_kpi_m'); await win('top'); await Wt(p, 1200);
  w = await p.evaluate(() => ({ tx: (document.querySelector('#ctrl_kpi [data-ctrlkpimore]') || {}).textContent || '', b: !!document.querySelector('#ctrl_kpi [data-ckset="reload:1"]') }));
  const e1 = await R('ctl_kpi_m'); ok(/읽지 못했습니다\(unavailable\)/.test(w.tx) && w.b && e1 - e0 <= 2, '읽기 실패 → 「읽지 못했습니다」 + 다시 읽기 · 저절로 되풀이 안 함', { w, n: e1 - e0 });
  await p.evaluate(() => { const dc = window._ckDC; db.collection = function (n) { window._ckR.push(String(n)); return dc.apply(this, arguments); }; }); await set('reload:1'); await Wt(p, 300);
  ok(await p.evaluate(() => !!document.querySelector('#ctrl_kpi .ckd-t')), '「다시 읽기」 → 기록이 나옴');
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 폭 380
  await open(380, 700, f); await win('low');
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const r = ov.querySelector('.bigask').getBoundingClientRect(); return { ok: r.left >= 0 && r.right <= innerWidth + 1, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  ok(w.ok && w.sw <= w.iw, '폭 380: 날마다 기록 창 가로 넘침 없음(표는 칸 안에서만 밀림)', w); await p.keyboard.press('Escape'); await Wt(p, 150);
  // 기록 없음 — 빈 상태 글
  await p.evaluate(async (yms) => { S._ck = null; for (const ym of yms) await db.collection('ctl_kpi_m').doc(ym).set({ ym, ver: 1, d: {} }); }, yms); await open(1280, 720, f); await win('top');
  w = await p.evaluate(() => ({ tx: (document.querySelector('#ctrl_kpi [data-ctrlkpimore]') || {}).textContent || '', yd: (document.querySelector('#ctrl_kpi .ck-yd') || {}).textContent || '', c: document.querySelector('#bkf_kpi [data-ctrlkpi="top"] .pxts').textContent }));
  ok(/아직 기록한 날이 없습니다/.test(w.tx) && /오늘 밤부터 기록/.test(w.yd) && !/어제 대비/.test(w.c), '기록 없음 → 「아직 기록한 날이 없습니다」 · 어제 대비 「오늘 밤부터 기록」 · 카드에 어제 대비 안 붙음', w);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  await p.evaluate(() => { db.collection = window._ckDC; try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLKPI_D ${bad}개 실패` : '✓ tCTRLKPI_D 통과'); return bad; });
