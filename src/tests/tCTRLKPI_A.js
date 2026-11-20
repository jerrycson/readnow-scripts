// tCTRLKPI_A — (정범님 I-1119-2051-30·I-1119-2056-31 · 일꾼 kpia1 판 A · 설계 readnow-chats reports/CTRLKPI1_1119.md 4장·5-0·9장 A줄) 🛰 관제소 수치 카드 다섯(ctrlkpi2부터 여섯) — 가게 전체 작은 글 · 빈 상태 · 안쪽 창 틀(읽는 법)
//  ① 글: CTRLKPI 덩어리가 ◆ctrlhist 끝 바로 뒤 · Firestore 읽기 없음 · rn-ck 기기 저장 try · 판본 대조 기록 저절로 읽기 막음 · 빈 상태 글 셋 · 브라우저 창 없음
//  ② 화면(RN_PORT): 단추가 맨 위 줄에만(묶음 칩 줄엔 없음) · ← 닫기·Esc 그대로 · 카드 다섯 · 큰 수 = 묶음 · 작은 글 = 가게 전체(손으로 센 값과 같음)
//     · 유효 최저가 창 = 같거나 더 쌈(≤)과 더 싸야만(<) 따로 · 「어제 대비 — 오늘 밤부터 기록」 · 「읽는 법」 접힘·펼침 기억 · 폭 380 가로 넘침 없음
//     · 묶음 없음(__none) = 가게 전체 카드 + 「묶음을 만들면 묶음 수가 여기 나옵니다」 · 조회 기록 안 불러온 채로는 카드·창·가게 전체 셈 모두 새 읽기 0 · 「👀 조회수 불러오기」 한 번 → 카드에 숫자
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLKPI_A.js · 시험 자료(가짜 그룹 5개·가짜 주문 셋)에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('/* CTRLKPI-START'), b = T.indexOf('/* CTRLKPI-END */'); const B = a > 0 && b > a ? T.slice(a, b) : '';
  ok(B.length > 2000 && T.lastIndexOf('/* ◆ctrlhist 끝 */', a) > a - 40, 'CTRLKPI 덩어리 하나 · ◆ctrlhist 끝 바로 뒤', { a, b });
  const DC = [...B.matchAll(/db\.collection\(([^)]*)\)\.doc\([^)]*\)\.(\w+)\(/g)].map((m) => m[1] + '.' + m[2]); /* (판 D) 날마다 기록 두 칸만 읽음 — 그 밖 읽기·실시간 듣기·쓰기 없음 */
  ok(DC.length >= 2 && DC.length === (B.match(/db\.collection\(/g) || []).length && DC.every((x) => /^'ctl_kpi_(m|days)'\.get$/.test(x)) && !/onSnapshot|firestore\(|runTransaction|\.batch\(\)|FieldValue/.test(B), 'CTRLKPI 덩어리 Firestore = 날마다 기록(ctl_kpi_m·ctl_kpi_days) 읽기(get)만 · 실시간 듣기·쓰기 없음', DC);
  const P = B.slice(B.indexOf('function ckPref('), B.indexOf('\n', B.indexOf('function ckPref(')));
  ok(/'rn-ck'/.test(P) && (P.match(/try \{/g) || []).length >= 2, '기기 저장 rn-ck · 읽기·쓰기 모두 try/catch');
  ok(/function ckP1\(l\) \{ const p0 = S\._nbmP; if \(!S\.nbmLoaded\) S\._nbmP = true;[\s\S]{0,200}finally \{ S\._nbmP = p0; \}/.test(B), '시장 지표 셈 중 판본 대조 기록을 저절로 읽지 않음(ckP1)');
  const KP = T.slice(T.indexOf('/* ◆ctrlkpi'), T.indexOf('/* ◆ctrl 시작'));
  ok(/const R = ckP1\(l\);/.test(KP) && !/page1FromMetrics\(/.test(KP), '묶음 카드 셈도 같은 막음(ckP1)');
  ok(/if \(o\.cur < o\.low\) lowS\+\+/.test(KP) && /if \(o\.cur < o\.low\) K\.lowS\+\+/.test(B), '더 싸야만(<) 수를 따로 셈(묶음·가게 전체)');
  const ALL = B + KP;
  ok(/묶음을 만들면 묶음 수가 여기 나옵니다/.test(ALL) && /오늘 밤부터 기록/.test(ALL) && /조회 기록 받기 전/.test(ALL), '빈 상태 글 셋(묶음 없음·날마다 기록 없음·조회 기록 받기 전)');
  ok(/<details class="ck-how"/.test(B) && /ckPref\('how', d\.open \? 1 : 0\)/.test(B), '「이 숫자를 읽는 법」 접힘 · 펼침 기억');
  ok(/data-ctrlkpiload/.test(KP) && /ckViewLoad\(\)/.test(KP) && /pxViewsOn\(\)/.test(B) && /if \(!S\._ckVwAuto && S\.user[^\n]{0,80}\{ S\._ckVwAuto = 1; try \{ ckViewLoad\(\); \}/.test(T), '「👀 조회수 불러오기」 = 조회수 분석과 같은 불러오기(pxViewsOn) · (ctrlkpi2) 관제소 처음 열 때 이 기기에서 한 번 저절로');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(ALL), '브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(ALL), '전화번호 모양 없음');
  ok(!/때문에|덕분에|효과|올렸다/.test(B), '화면 글에 원인을 단정하는 말 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLKPI_A ${bad}개 실패` : '✓ tCTRLKPI_A 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SEED = async function (d10) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 12; i++) { const uc = 'U5800000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(508937000 + i), title: '수치 카드 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk58' + i }); }
  S.plist.set('aladin_U580000099', { id: 'aladin_U580000099', usedCode: 'U580000099', listingId: '508937099', title: '내린 책', price: 9000, qty: 1, grade: '상', status: '판매중지', active: false, bookId: 'bk5899' });
  S.plist.set('yes24_T58', { id: 'yes24_T58', listingId: 'Y58', title: '예스24 책', price: 9000, qty: 1, grade: '상', status: '판매중', active: true, bookId: 'bk58y' });
  if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
  for (const l of S.plist.values()) { if (!/^aladin_U58/.test(l.id)) continue; n++; const dp = [0, -400, 400][n % 3]; /* 같은 값 · 남이 더 쌈 · 우리가 더 쌈 */
    if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) + dp, sellerCode: '0', sellerName: '알라딘', listingId: '9' + n }] }); }
  S.pmLoaded = true; S.sellersLoaded = true;
  const day = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); /* 가짜 주문 셋 — 손님 칸 없음 */
  S.orders.set('t_ck1', { id: 't_ck1', kind: 'sale', platform: 'aladin', orderedAt: day(Date.now()) + ' 09:00', items: [{ aladinUsedCode: 'U580000010', qty: 2, price: 7000, lineStatus: 'normal' }, { aladinUsedCode: 'U580000011', qty: 1, price: 7250, lineStatus: 'cancel' }] });
  S.orders.set('t_ck2', { id: 't_ck2', kind: 'sale', platform: 'yes24', orderedAt: day(Date.now() - 3 * 864e5) + ' 11:00', items: [{ qty: 1, price: 9000, lineStatus: 'normal' }] });
  S.orders.set('t_ck3', { id: 't_ck3', kind: 'sale', platform: 'aladin', orderedAt: day(Date.now() - 40 * 864e5) + ' 11:00', items: [{ aladinUsedCode: 'U580000012', qty: 5, price: 7500, lineStatus: 'normal' }] });
  const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
  const ids = ['gA', 'gB', 'gC', 'gD', 'gE']; for (let i = 0; i < 5; i++) await put(ids[i], '수치 카드 그룹 ' + i);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gE'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '카드 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ids }); return a.fid; };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  await p.evaluate(() => { try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  const f = await p.evaluate(async ([src, d]) => (eval('(' + src + ')'))(d), [SEED.toString(), new Date(Date.now() - 10 * 864e5).toISOString()]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f] && S.bkfold.folds[f].gids.length === 5), f)) break; await Wt(p, 150); }
  const px0 = await p.evaluate(() => !!S._pxVwOn); ok(!px0, '시작 때 조회 기록을 불러오지 않은 상태', px0);
  // 읽기 세기 — 이름별(조회 기록·판본 대조 기록이 저절로 읽히지 않는지)
  await p.evaluate(() => { window._ckR = []; const dc = db.collection; window._ckDC = dc; db.collection = function (n) { window._ckR.push(String(n)); return dc.apply(this, arguments); }; });
  const open = async (w, h, fid) => { await p.setViewportSize({ width: w, height: h }); await p.evaluate((f) => openBkfold(f), fid);
    for (let i = 0; i < 60; i++) { if (await p.evaluate((none) => (none || (!!document.getElementById('bkf_tb') && Object.keys(S._bkfTb || {}).length >= 3)) && !!S._ckAll && !S._ckAllRun && document.querySelectorAll('#bkf_kpi [data-ctrlkpi]').length === 6, fid === '__none')) break; await Wt(p, 150); }
    await p.evaluate(() => { S._ctrlKpi = null; ctrlKpiPaint(); }); await Wt(p, 200); };
  await open(1280, 720, f);
  const exp = await p.evaluate(() => { const re = /^(판매중|일시판매중지)$/; let tot = 0, mk = 0, top = 0, cmp = 0, low = 0, lowS = 0; const p0 = S._nbmP; S._nbmP = true;
    for (const l of S.plist.values()) { if (!l.listingId || !l.active || String(l.id).startsWith('yes24_') || !re.test(String(l.status || ''))) continue; tot++; let R = null; try { R = page1FromMetrics(l); } catch (e) {} if (!(R && R.length)) continue; mk++; if (ctrlKpiTop(R)) top++; const o = plkCtx(l, R); if (o.low != null && o.cur != null) { cmp++; if (o.cur <= o.low) low++; if (o.cur < o.low) lowS++; } }
    S._nbmP = p0; const A = S._ckAll && S._ckAll.K; return { tot, mk, top, cmp, low, lowS, A }; });
  ok(exp.A && exp.A.tot === exp.tot && exp.A.top === exp.top && exp.A.low === exp.low && exp.A.lowS === exp.lowS && exp.A.mk === exp.mk && exp.A.cmp === exp.cmp, '가게 전체 셈 = 손으로 센 값(판매 중 알라딘만 · 내림·예스24 뺌)', exp);
  ok(exp.A && exp.A.sold === 2 && exp.A.soldY === 1 && exp.A.amt === 14000, '가게 전체 판매 = 최근 30일 정상 줄 권수(취소 줄·40일 전 뺌 · 예스24 따로)', exp.A);
  ok(exp.low >= exp.lowS && exp.low > exp.lowS, '같은 값 겨룸이 있어 ≤ 수가 < 수보다 큼(시험 자료)', exp);
  const m = await p.evaluate(() => { const top = document.getElementById('bkf_top'); const row = document.querySelector('#bkf_scr .csw-row'); const C = [...top.querySelectorAll('#bkf_kpi [data-ctrlkpi]')];
    return { inTop: top.querySelectorAll('[data-bkftool]').length, inRow: row ? row.querySelectorAll('[data-bkftool]').length : -1, back: !!top.querySelector('#back'), n: C.length, kinds: C.map((c) => c.dataset.ctrlkpi).join(), big: C.map((c) => c.querySelector('.pxtb').textContent), sub: C.map((c) => c.querySelector('.pxts').textContent), K: ctrlKpiCalc(S.detail.bkfold), on: !!S._pxVwOn }; });
  ok(m.inTop === 7 && m.inRow === 0 && m.back, '단추 = 맨 위 줄(← 닫기 옆)에만 · 묶음 칩 줄엔 없음', m);
  ok(m.n === 6 && m.kinds === 'tot,top,low,view,sold,watch', '카드 여섯(감시 중 상품 수 더함)', m.kinds);
  ok(m.big[0] === m.K.tot.toLocaleString('ko-KR') && m.big[1] === m.K.top.toLocaleString('ko-KR') && m.big[2] === m.K.low.toLocaleString('ko-KR'), '큰 수 = 고른 묶음', m);
  ok(m.sub[0].includes('전체 ' + exp.tot.toLocaleString('ko-KR')) && m.sub[1].includes('전체 ' + exp.top.toLocaleString('ko-KR')) && m.sub[2].includes('전체 ' + exp.low.toLocaleString('ko-KR')) && /최근 30일 알라딘 2권/.test(m.sub[4]), '아래 작은 글 = 가게 전체', m.sub);
  ok(m.on, '(ctrlkpi2) 관제소를 열면 조회 기록을 한 번 저절로 받기 시작', m.on);
  // 유효 최저가 창 — ≤·< 따로 · 어제 대비 · 읽는 법
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="low"]').click()); await Wt(p, 150);
  let w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const tx = ov ? ov.textContent : ''; const st = ov && ov.querySelector('.ck-strict'); const K = ctrlKpiCalc(S.detail.bkfold); const d = ov && ov.querySelector('details.ck-how');
    return { ov: !!ov, strict: st ? st.textContent : '', K: { low: K.low, lowS: K.lowS }, all: (ov.querySelector('#ck_all') || {}).textContent || '', yd: /어제 대비 — 오늘 밤부터 기록/.test(tx), how: !!d, howOpen: d ? d.open : null, more: /오늘 밤부터 기록|아직 기록한 날이 없습니다|날마다 기록 읽는 중/.test((ov.querySelector('[data-ctrlkpimore]') || {}).textContent || '') }; });
  ok(w.ov && w.strict.includes(`더 싸야만(<) 센 수 ${w.K.lowS.toLocaleString('ko-KR')}개`) && w.strict.includes(`같은 값 겨룸 ${(w.K.low - w.K.lowS).toLocaleString('ko-KR')}개`), '유효 최저가 창 — 더 싸야만(<) 수·같은 값 겨룸 수 따로', w);
  ok(w.all.includes(`더 싸야만(<) ${exp.lowS.toLocaleString('ko-KR')}개`) && w.all.includes('가게 전체'), '창 안 가게 전체 줄', w.all);
  ok(w.yd && w.more, '날마다 기록 없음 — 「어제 대비 — 오늘 밤부터 기록」 · 창 아래 「아직 기록한 날이 없습니다」', w);
  ok(w.how && w.howOpen === false, '「이 숫자를 읽는 법」 처음엔 접힘', w);
  await p.evaluate(() => { const d = document.querySelector('#ctrl_kpi details.ck-how'); d.open = true; }); await Wt(p, 150);
  let pf = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('rn-ck') || '{}'); } catch (_) { return null; } }); ok(pf && pf.how === 1, '펼침 → 기기에 기억(rn-ck)', pf);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="top"]').click()); await Wt(p, 150);
  w = await p.evaluate(() => { const d = document.querySelector('#ctrl_kpi details.ck-how'); return { open: d && d.open, txt: d ? d.textContent : '' }; });
  ok(w.open && /모름/.test(w.txt) && /시장 지표가 있는 상품 수/.test(w.txt), '다른 카드 창도 펼친 채(기억) · 최상단 읽는 법 = 모름은 세지 않음·나눔수', w);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 방문수 — (ctrlkpi2) 저절로 한 번 받은 조회 기록으로 카드·창을 다시 그림 · 판본 대조 기록 읽기 0
  for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !!(S.px && S.px.vwLoaded) && !S._ckVwT)) break; await Wt(p, 250); }
  await p.evaluate(() => { S._ctrlKpi = null; ctrlKpiPaint(); }); await Wt(p, 300);
  for (let i = 0; i < 30; i++) { if (await p.evaluate(() => !!S._ckAll && !S._ckAllRun && S._ckAll.K.pxOn)) break; await Wt(p, 150); await p.evaluate(() => ctrlKpiPaint()); }
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="view"]').click()); await Wt(p, 200);
  w = await p.evaluate(() => { const c = document.querySelector('#bkf_kpi [data-ctrlkpi="view"]'); const ov = document.getElementById('ctrl_kpi'); return { on: !!S._pxVwOn, ld: !!(S.px && S.px.vwLoaded), big: c ? c.querySelector('.pxtb').textContent : '', sub: c ? c.querySelector('.pxts').textContent : '', win: ov ? !!ov.querySelector('[data-ctrlkpiload]') : null, n: window._ckR.filter((n) => n === 'px_views').length, R: window._ckR.slice() }; });
  ok(w.on && w.ld && /^[0-9≈]/.test(w.big) && /최근 30일/.test(w.sub) && w.win === false && w.n >= 1, '조회 기록을 한 번 받고 방문수 카드·창을 다시 그림(불러오기 단추 사라짐)', w);
  ok(!w.R.some((n) => n === 'prd_market_nobook'), '판본 대조 기록 읽기 0', w.R);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 폭 380 — 가로 넘침 없음
  await open(380, 700, f);
  const nw = await p.evaluate(() => { const sh = document.getElementById('sheet'); const C = [...document.querySelectorAll('#bkf_kpi [data-ctrlkpi]')]; return { n: C.length, out: C.filter((c) => c.getBoundingClientRect().right > innerWidth + 1 || c.getBoundingClientRect().left < -1).length, sw: document.documentElement.scrollWidth, shsw: sh.scrollWidth, iw: innerWidth }; });
  ok(nw.n === 6 && !nw.out && nw.sw <= nw.iw && nw.shsw <= nw.iw + 1, '폭 380: 카드 여섯이 화면 안 · 가로 넘침 없음', nw);
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="tot"]').click()); await Wt(p, 150);
  const nw2 = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const r = ov && ov.querySelector('.bigask').getBoundingClientRect(); return { ok: !!r && r.left >= 0 && r.right <= innerWidth + 1, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  ok(nw2.ok && nw2.sw <= nw2.iw, '폭 380: 안쪽 창도 화면 안', nw2); await p.keyboard.press('Escape'); await Wt(p, 150);
  // ← 닫기 · Esc 그대로
  await open(1280, 720, f); await p.evaluate(() => document.getElementById('back').click()); await Wt(p, 500);
  let c = await p.evaluate(() => ({ det: !!(S.detail && S.detail.bkfold), on: document.getElementById('sheet').classList.contains('on') }));
  ok(!c.det, '← 닫기 → 관제소 닫힘', c);
  await open(1280, 720, f); await p.keyboard.press('Escape'); await Wt(p, 500);
  c = await p.evaluate(() => ({ det: !!(S.detail && S.detail.bkfold) })); ok(!c.det, 'Esc → 관제소 닫힘(안쪽 창이 없을 때)', c);
  await open(1280, 720, f); await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="sold"]').click()); await Wt(p, 150); await p.keyboard.press('Escape'); await Wt(p, 300);
  c = await p.evaluate(() => ({ ov: !!document.getElementById('ctrl_kpi'), det: !!(S.detail && S.detail.bkfold) })); ok(!c.ov && c.det, 'Esc 한 번 = 안쪽 창만 닫고 관제소 그대로', c);
  await p.evaluate(() => history.back()); await Wt(p, 400);
  // 묶음 없음(__none) — 가게 전체 카드
  await p.evaluate(() => { window._ckR.length = 0; S._ckAll = null; }); await open(1280, 720, '__none');
  const nb = await p.evaluate(() => { const C = [...document.querySelectorAll('#bkf_kpi [data-ctrlkpi]')]; return { det: S.detail && S.detail.bkfold, n: C.length, big: C.map((x) => x.querySelector('.pxtb').textContent), sub: C.map((x) => x.querySelector('.pxts').textContent), A: S._ckAll && S._ckAll.K }; });
  ok(nb.det === '__none' && nb.n === 6 && nb.A && nb.big[0] === nb.A.tot.toLocaleString('ko-KR') && nb.big[2] === nb.A.low.toLocaleString('ko-KR') && nb.sub[0] === '묶음을 만들면 묶음 수가 여기 나옵니다', '묶음 없음 → 큰 수 = 가게 전체 · 「묶음을 만들면 묶음 수가 여기 나옵니다」', nb);
  await p.evaluate(() => document.querySelector('#bkf_kpi [data-ctrlkpi="tot"]').click()); await Wt(p, 150);
  const nb2 = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); return { ov: !!ov, h: ov ? ov.querySelector('.bigask-h').textContent : '', nb: !!(ov && ov.querySelector('.ck-nb')), how: !!(ov && ov.querySelector('details.ck-how')) }; });
  ok(nb2.ov && /가게 전체/.test(nb2.h) && nb2.nb && nb2.how, '묶음 없음 — 카드 누름 → 가게 전체 창(빈 상태 글·읽는 법)', nb2);
  await p.keyboard.press('Escape'); await Wt(p, 150);
  await p.evaluate(() => { db.collection = window._ckDC; try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLKPI_A ${bad}개 실패` : '✓ tCTRLKPI_A 통과'); return bad; });
