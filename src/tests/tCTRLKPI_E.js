// tCTRLKPI_E — (정범님 I-1119-2051-30·I-1119-2056-31 · 일꾼 kpia1 판 E · 설계 readnow-chats reports/CTRLKPI1_1119.md 5-4·5-5·6장·9장 E줄) 🛰 관제소 사건 띠·앞뒤 견주기·④ 방문수·⑤ 판매수 창
//  판 B(kpib1) 클라우드가 아직 운영에 없어 가짜 달 문서·가짜 묶음 장부(prd_price_batches/_bkf_<묶음>)·가짜 조회 기록(S.px)·가짜 주문(S.orders)을 가짜 Firestore·기기 안에만 둠(운영 쓰기 없음 · 손님 정보 없음)
//  ① 글: 읽는 칸 두 군데 그대로(장부는 bkfLedger · 전략 기록은 누를 때만 stratLogLoad) · 끝 두 문장 · 원인 단정 말 없음 · 브라우저 창 없음
//  ② 화면(RN_PORT): 되돌린 실행은 띠·딱지·겹침에서 빠짐(「되돌린 것도 보기」로만) · 겹침 딱지 · 앞뒤 7일 = 요일 맞음(3일은 「요일 안 맞음」) · 사건 날은 빼고 셈
//     · 바뀜의 차이 = 우리 무리 − 견줄 무리 · 바깥 사건 = 「견줄 무리 없음」 · 하루 평균 5 아래 = % 숨김 · 장부 읽기는 묶음마다 1번(30분 메모)
//     · ④ 방문수 = 사람 조회·100개당·셀 수 있는 상품(어림) · 그림 붙은 상품 없는 묶음 = 안내 글 · ⑤ 판매수 = 권수·금액·1,000개당·날 누름 = 상품 줄만 · 폭 380 넘침 없음
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLKPI_E.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('/* CTRLKPI-START'), b = T.indexOf('/* CTRLKPI-END */'); const B = a > 0 && b > a ? T.slice(a, b) : '';
  ok((B.match(/db\.collection\(/g) || []).length === 2, '판 E도 새 읽는 칸 없음(db.collection 두 군데 그대로)');
  ok(/bkfLedger\(f\)/.test(B) && /i \+= 5/.test(B) && /CK_TTL/.test(B), '묶음 장부 = bkfLedger · 5개씩 · 30분 메모');
  ok((B.match(/stratLogLoad\(/g) || []).length === 1 && /k === 'stl'/.test(B), '전략 기록 = 「불러오기」를 눌렀을 때만 읽음');
  ok(B.includes('이 표는 같은 때 일어난 일을 나란히 놓은 것입니다. 무엇이 무엇을 일으켰는지는 이것만으로 알 수 없습니다.') && B.includes('여러 수를 함께 보면 한둘은 우연히 커 보입니다.'), '앞뒤 견주기 끝 두 문장');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(B), '브라우저 창 없음'); ok(!/때문에|덕분에|효과|올렸다/.test(B), '원인을 단정하는 말 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(B), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLKPI_E ${bad}개 실패` : '✓ tCTRLKPI_E 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
/* 상품 12개(묶음 안 · 값 6,900~18,900) + 6개(묶음 밖 · 값 5만 원 = 견줄 무리) · 그룹 다섯 · gA에 8일 전 감시 켬 */
const SEED = async function ([d10, w8]) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 18; i++) { const uc = 'U5900000' + (10 + i); const out = i >= 12; S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(509937000 + i), title: (out ? '견줄 책 ' : '사건 띠 시험 책 ') + i, price: out ? 50000 : 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk59' + i }); }
  const put = (id, name, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {}, ...(x || {}) });
  const ids = ['gA', 'gB', 'gC', 'gD', 'gE']; for (let i = 0; i < 5; i++) await put(ids[i], '사건 띠 그룹 ' + i, i === 0 ? { watchLog: [{ on: true, at: w8, by: 't', what: '감시 켬' }] } : null);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gE'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '사건 띠 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ids }); return a.fid; };
/* 가짜 날마다 기록 45일 · 사건 날(10일 전) = 일괄 실행 · 앞 7일 묶음 최상단 2/10 · 뒤 7일 5/10 · 사건 날 10/10(빼고 세는지 봄) · 가게 전체 30/80 그대로 · 20일 전 총 상품수 100 → 120(바깥 사건)
   장부: r1 = 10일 전 실행 · r2 = 13일 전 실행 → r3 = 12일 전 r2 되돌리기(둘 다 「되돌린 것」) · 조회: 묶음 상품 하루 1번씩(뒤 창 2번씩 · 사건 날 100번씩) · 묶음 밖 하루 1번씩 · 판매: 묶음 상품 하루 1권 */
const KSEED = async function (fid) { const t = ckDay(); const M = {}; const at = (i, h) => new Date(Date.parse(ckAdd(t, -i) + 'T' + String(h).padStart(2, '0') + ':00:00+09:00')).toISOString();
  for (let i = 0; i <= 45; i++) { const d = ckAdd(t, -i); const ym = d.slice(0, 7), dd = d.slice(8, 10); M[ym] = M[ym] || {}; const fTop = i === 10 ? 10 : i < 10 && i >= 3 ? 5 : i < 3 ? 5 : 2;
    M[ym][dd] = { T: { n: i > 20 ? 100 : 120, nM: 80, nF: 5, top: 30, topU: 2, tie: 1, low: 40, lowLt: 20, lowN: 70, lowX: 10, lowU: 50, px: 18, lk: 0, lkc: 0 }, mvT: { g: 1, l: 1, k: 29, w: { sold: 1 }, gw: { new: 1 } }, mvL: { g: 1, l: 1, k: 39, w: {}, gw: {} }, act: {},
      F: { [fid]: { n: 12, nM: 10, top: fTop, low: 6, g: 0, l: 0, gL: 0, lL: 0 } }, fl: { sold: 1, amt: 7000 } }; }
  for (const [ym, d] of Object.entries(M)) await db.collection('ctl_kpi_m').doc(ym).set({ ym, ver: 1, upAt: new Date().toISOString(), d });
  await db.collection('prd_price_batches').doc('_bkf_' + fid).set({ runs: { r1: { op: 'metrics', at: at(10, 11), by: 't', plan: { gids: ['gA'] }, res: { gA: { st: 'ok', n: 3 } } }, r2: { op: 'metrics', at: at(13, 11), by: 't', plan: { gids: ['gB'] }, res: { gB: { st: 'ok', n: 2 } } }, r3: { op: 'metrics', at: at(12, 11), by: 't', undoOf: 'r2', plan: { gids: ['gB'] }, res: { gB: { st: 'ok', n: 2 } } } } }, { merge: true });
  const keys = [...ckFoldKeys(fid)]; const lids = new Set(keys.map((k) => String(S.plist.get(k).listingId)));
  S.px.exp = new Map(); S.px.vw = new Map(); for (const l of S.plist.values()) { if (!/^aladin_U59/.test(l.id)) continue; const lid = String(l.listingId); S.px.exp.set(lid, { addedAt: at(45, 9), on: true, gaps: [], title: l.title }); const m = new Map();
    for (let i = 0; i <= 45; i++) { const ins = lids.has(lid); const h = !ins ? 1 : i === 10 ? 100 : i < 10 ? 2 : 1; m.set(ckAdd(t, -i), { human: h, bot: 3, ours: 1, x: { hr: { 14: h } }, bs: new Set(['b' + lid]) }); } S.px.vw.set(lid, m); }
  S.px.v = (S.px.v || 0) + 1; S.px.vwLoaded = true; S._pxVwOn = 1;
  if (!(S.orders instanceof Map)) S.orders = new Map(); for (let i = 0; i <= 45; i++) S.orders.set('t59o' + i, { kind: 'sale', platform: 'aladin', orderedAt: ckAdd(t, -i) + ' 15:30', items: [{ listingKey: keys[0], qty: 1, price: 7000, lineStatus: 'normal', title: '사건 띠 시험 책 판매' }] });
  S._ck = null; S._ckAll = null; return { keys: keys.length, lids: lids.size }; };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  await p.evaluate(() => { try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  const f = await p.evaluate(async ([src, a]) => (eval('(' + src + ')'))(a), [SEED.toString(), [new Date(Date.now() - 50 * 864e5).toISOString(), new Date(Date.parse(new Date(Date.now() + 9 * 3600e3 - 8 * 864e5).toISOString().slice(0, 10) + 'T12:00:00+09:00')).toISOString()]]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f] && S.bkfold.folds[f].gids.length === 5), f)) break; await Wt(p, 150); }
  const open = async (w, h, fid) => { await p.setViewportSize({ width: w, height: h }); await p.evaluate((f) => openBkfold(f), fid);
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.getElementById('bkf_tb') && Object.keys(S._bkfTb || {}).length >= 3 && document.querySelectorAll('#bkf_kpi [data-ctrlkpi]').length === 5)) break; await Wt(p, 150); } };
  const win = async (kind) => { await p.evaluate((k) => document.querySelector(`#bkf_kpi [data-ctrlkpi="${k}"]`).click(), kind); for (let i = 0; i < 50; i++) { if (await p.evaluate(() => !!document.querySelector('#ctrl_kpi [data-ctrlkpimore]') && !(S._ck && (S._ck.wl || S._ck.busy.size || S._ck.ledBusy)))) break; await Wt(p, 150); } await Wt(p, 200); };
  const click = async (sel) => { const r = await p.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, sel); for (let i = 0; i < 40; i++) { if (await p.evaluate(() => !(S._ck && (S._ck.wl || S._ck.busy.size || S._ck.ledBusy)))) break; await Wt(p, 120); } await Wt(p, 150); return r; };
  const txt = (s) => p.evaluate((s) => (document.querySelector(s) || {}).textContent || '', s);
  const baRows = () => p.evaluate(() => [...document.querySelectorAll('#ctrl_kpi .ckd-ba tbody tr')].map((r) => ({ c: [...r.cells].map((c) => c.textContent.trim()), dim: r.classList.contains('ckd-dim') })));
  await open(1280, 720, f);
  // ④ 방문수 — 조회 기록을 안 불러온 채 = 안내 글 + 불러오기 단추(새 읽기 없음)
  await win('view'); let w = await txt('#ctrl_kpi [data-ctrlkpimore]');
  ok(/조회 기록을 아직 불러오지 않았습니다/.test(w) && (await p.evaluate(() => !!document.querySelector('#ctrl_kpi [data-ctrlkpiload="view"]'))), '방문수 창 · 조회 기록 안 불러옴 = 안내 글 + 「👀 조회수 불러오기」', w.slice(0, 200));
  await p.keyboard.press('Escape'); await Wt(p, 150);
  const sd = await p.evaluate(async ([src, f]) => (eval('(' + src + ')'))(f), [KSEED.toString(), f]); ok(sd.keys === 12 && sd.lids === 12, '묶음 상품 12개(묶음 밖 6개 = 견줄 무리)', sd);
  await p.evaluate(() => { window._ckL = 0; const o = window.bkfLedger; window._ckLo = o; window.bkfLedger = function () { window._ckL++; return o.apply(this, arguments); }; });
  await open(1280, 720, f); await win('view');
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const th = [...ov.querySelectorAll('.ckd > .ckd-tw .ckd-t thead th')].map((x) => x.textContent); const tr = ov.querySelector('.ckd > .ckd-tw .ckd-t tbody tr'); return { th, r: tr ? [...tr.cells].map((c) => c.textContent.trim()) : null, line: !!ov.querySelector('svg.ckd-line'), band: !!ov.querySelector('svg.ckd-band'), heat: (ov.querySelector('svg.pxheat') || {}).outerHTML || '', chips: [...ov.querySelectorAll('.ckd-evs .ckd-ev')].map((b) => [b.dataset.ckev, b.classList.contains('und')]) }; });
  ok(w.th.includes('100개당 방문') && w.th.includes('조회 셀 수 있는 상품') && w.r && w.r[1] === '24' && w.r[2] === '36' && w.r[6] === '12어림' && w.r[7] === '200', '방문수 오늘 줄 = 사람 24(묶음 12개 × 2) · 로봇 36 · 셀 수 있는 상품 12(어림) · 100개당 200', { th: w.th, r: w.r });
  ok(w.line && w.band && /요일과 시각별 사람 조회\(하루 평균\)/.test(w.heat) && /하루 평균/.test(w.heat), '선 그림 · 사건 띠 · 요일×시각(하루 평균)', w.heat.slice(0, 160));
  const ids = w.chips.map((x) => x[0]); ok(ids.some((x) => /^run:.*:r1$/.test(x)) && !ids.some((x) => /:r2$|:r3$/.test(x)) && ids.some((x) => /^watch:/.test(x)) && ids.some((x) => /^x:n:/.test(x)) && w.chips.every((x) => !x[1]), '사건 딱지 = 실행 r1 · 감시 켬 · 총 상품수 바뀜(바깥) — 되돌린 r2·되돌리기 r3는 빠짐', w.chips);
  ok((await p.evaluate(() => window._ckL)) === 1, '묶음 장부 읽기 = 1번', await p.evaluate(() => window._ckL));
  // r1 앞뒤 견주기 — 앞뒤 7일 · 사건 날 뺌
  const r1 = ids.find((x) => /:r1$/.test(x)); await click(`#ctrl_kpi .ckd-ev[data-ckev="${r1}"]`); let R = await baRows(); let ba = await txt('#ctrl_kpi .ckd-ba');
  const top = R.find((x) => /최저가배지 비율/.test(x.c[1])), vis = R.find((x) => /100개당 방문/.test(x.c[1])), sold = R.find((x) => /1,000개당 판매/.test(x.c[1]));
  ok(top && top.c[2] === '20%' && top.c[3] === '50%' && /^\+30%p/.test(top.c[4]) && /^−4\.3%p$/.test(top.c[5]) && top.c[6] === '+34.3%p', '배지 비율 = 앞 2/10 → 뒤 5/10(사건 날 10/10은 뺌) · 견줄 무리 28/70 → 25/70 · 차이 +34.3%p', top);
  ok(vis && vis.c[2] === '100' && vis.c[3] === '200' && /\+100 \(\+100%\)/.test(vis.c[4]) && vis.c[5] === '±0' && vis.c[6] === '+100', '100개당 방문 = 100 → 200(사건 날 100번씩은 뺌) · 견줄 무리 ±0 · 차이 +100 · 하루 평균 12라 % 보임', vis);
  ok(sold && /하루 평균 5 아래 — % 숨김/.test(sold.c[4]), '1,000개당 판매 = 하루 평균 1권 → % 숨김', sold);
  ok(/⚠ 겹침 1건/.test(ba) && /감시 켬/.test(ba) && !/요일 안 맞음/.test(ba) && R.every((x) => x.dim), '겹침 = 감시 켬 1건(되돌린 것은 안 셈) · 7일 = 요일 맞음 · 딱지 있으면 줄 흐림', ba.slice(0, 300));
  ok(/사건 날\(\d+\/\d+\)은 앞뒤 어느 쪽에도 넣지 않음/.test(ba) && /같은 칸에서 고른 무리는 아님/.test(ba) && /무엇이 무엇을 일으켰는지는 이것만으로 알 수 없습니다/.test(ba) && /한둘은 우연히 커 보입니다/.test(ba), '사건 날 뺌 · 견줄 무리 설명 · 끝 두 문장', ba.slice(-400));
  await click('#ctrl_kpi [data-ckset="ban:3"]'); ba = await txt('#ctrl_kpi .ckd-ba'); R = await baRows();
  ok(/요일 안 맞음/.test(ba) && R.find((x) => /최저가배지/.test(x.c[1])).c[2] === '20%', '앞뒤 3일 = 「요일 안 맞음」 딱지 · 값은 3일 창으로', ba.slice(0, 200)); await click('#ctrl_kpi [data-ckset="ban:7"]');
  // 되돌린 것도 보기 = 줄 그음 딱지 · 겹침에 들어옴
  await click('#ctrl_kpi [data-ckset="evu:1"]'); w = await p.evaluate(() => ({ und: [...document.querySelectorAll('#ctrl_kpi .ckd-ev.und')].map((b) => b.dataset.ckev), ba: (document.querySelector('#ctrl_kpi .ckd-ba') || {}).textContent || '' }));
  ok(w.und.length === 2 && /⚠ 겹침 3건/.test(w.ba), '「되돌린 것도 보기」 = r2·r3 줄 그음 · 그때만 겹침 3건', w); await click('#ctrl_kpi [data-ckset="evu:0"]');
  // 바깥 사건(총 상품수 바뀜) = 견줄 무리 없음
  const xn = ids.find((x) => /^x:n:/.test(x)); await click(`#ctrl_kpi .ckd-ev[data-ckev="${xn}"]`); R = await baRows();
  ok(R.length >= 2 && R.filter((x) => x.c[5]).every((x) => x.c[5] === '견줄 무리 없음' && x.c[6] === '—'), '바깥 사건 = 모든 줄 「견줄 무리 없음」 · 차이 —', R);
  ok((await p.evaluate(() => window._ckL)) === 1, '딱지를 여러 번 눌러도 장부 다시 안 읽음(30분 메모)', await p.evaluate(() => window._ckL));
  if (process.env.RN_SHOT) { await click(`#ctrl_kpi .ckd-ev[data-ckev="${r1}"]`); await p.evaluate(() => { const b = document.querySelector('#ctrl_kpi .ckd-band'); if (b) b.scrollIntoView(); }); await p.screenshot({ path: process.env.RN_SHOT + '_view.png' }); }
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // ⑤ 판매수
  await win('sold'); w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const th = [...ov.querySelectorAll('.ckd > .ckd-tw .ckd-t thead th')].map((x) => x.textContent); const tr = ov.querySelector('.ckd > .ckd-tw .ckd-t tbody tr'); return { th, r: tr ? [...tr.cells].map((c) => c.textContent.trim()) : null, k: tr && tr.dataset.cksold, sum: (ov.querySelector('.ckd-sum') || {}).textContent || '', heat: (ov.querySelector('svg.pxheat') || {}).outerHTML || '' }; });
  ok(w.th.includes('1,000개당 판매') && w.r && w.r[1] === '1' && w.r[2] === '7,000원' && w.r[4] === '12' && w.r[5] === '83.3' && /알라딘 판매 30권/.test(w.sum), '판매수 = 오늘 1권 · 7,000원 · 묶음 상품 12 · 1,000개당 83.3 · 30일 합 30권', w);
  ok(/요일과 시각별 판매/.test(w.heat) && /15시 — \d+권/.test(w.heat), '요일×시각 = 주문 시각(권)', w.heat.slice(0, 200));
  await click(`#ctrl_kpi tr[data-cksold="${w.k}"]`); w = await txt('#ckd_day'); ok(/팔린 상품/.test(w) && /사건 띠 시험 책 판매/.test(w) && /7,000원 · 1권/.test(w) && /주문한 분 정보는 보이지 않음/.test(w), '판매 날 누름 = 그날 상품 줄(값·권수만)', w);
  await click('#ctrl_kpi [data-ckset="vw:r"]'); w = await p.evaluate(() => [...document.querySelectorAll('#ctrl_kpi .ckd-sel button.on')].map((b) => b.textContent)); ok(w.includes('1,000개당'), '보기 단추 = 「1,000개당」', w); await click('#ctrl_kpi [data-ckset="vw:n"]');
  await p.keyboard.press('Escape'); await Wt(p, 150);
  // 최상단 창에도 사건 띠
  await win('top'); ok(await p.evaluate(() => !!document.querySelector('#ctrl_kpi svg.ckd-band') && document.querySelectorAll('#ctrl_kpi .ckd-ev').length >= 3), '①②③ 창에도 사건 띠·딱지'); await p.keyboard.press('Escape'); await Wt(p, 150);
  // 그림 붙은 상품 없는 묶음
  await p.evaluate(() => { window._ckExp = S.px.exp; S.px.exp = new Map(); S.px.v++; }); await win('view'); w = await txt('#ctrl_kpi [data-ctrlkpimore]');
  ok(/이 묶음에 조회 그림이 붙은 상품이 없습니다/.test(w), '그림 붙은 상품 없는 묶음 = 안내 글', w.slice(0, 200)); await p.evaluate(() => { S.px.exp = window._ckExp; S.px.v++; }); await p.keyboard.press('Escape'); await Wt(p, 150);
  // 폭 380
  await open(380, 700, f); await win('view'); await click(`#ctrl_kpi .ckd-ev[data-ckev="${r1}"]`);
  w = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); const r = ov.querySelector('.bigask').getBoundingClientRect(); return { ok: r.left >= 0 && r.right <= innerWidth + 1, sw: document.documentElement.scrollWidth, iw: innerWidth, ba: !!ov.querySelector('.ckd-ba') }; });
  ok(w.ok && w.sw <= w.iw && w.ba, '폭 380: 방문수 창·앞뒤 견주기 가로 넘침 없음', w); await p.keyboard.press('Escape'); await Wt(p, 150);
  await p.evaluate(() => { if (window._ckLo) window.bkfLedger = window._ckLo; try { localStorage.removeItem('rn-ck'); } catch (_) {} });
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLKPI_E ${bad}개 실패` : '✓ tCTRLKPI_E 통과'); return bad; });
