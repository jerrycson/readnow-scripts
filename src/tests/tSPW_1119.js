// tSPW_1119 — (정범님 11/19 14:38 I-1119-1438-13) 👁 살핀 상품 패널 검색 결과를 누르면 안쪽 창에 그 상품 카드 하나만
//  ① 누르면 다른 화면·브라우저 팝업 없이 안쪽 창(.spw)이 뜨고 그 안에 그 상품 카드 딱 하나
//  ② 다른 탭에 있는 상품도 뒤에서 그 탭을 그려 카드를 옮겨 옴 · 한눈에 보기면 그 카드만 펼침
//  ③ 창 안에서 바꾼 값(가격 칸·단추)이 원래 자료에 바로 반영 · 다시 그려도 창은 그 카드를 계속 보여 줌
//  ④ ✕·Esc로 닫으면 원래 탭·펼침으로 되돌아오고 목록은 새 값 · 카드가 제자리로(두 벌 없음)
//  ⑤ 재고 품목 화면도 같음 · 찾기가 없던 화면(등록 등)은 그려진 카드에서 찾아 같은 창으로
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tSPW_1119.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path');
const H = require('./harness.js');
const NK = 12;
const setup = async (p, view) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async ([NK, view]) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; window.__DLG = 0; window.alert = window.confirm = window.prompt = () => { window.__DLG++; return true; }; window.__OPEN = 0; window.open = () => { window.__OPEN++; return null; };
    try { Object.keys(localStorage).filter((k) => /^rn-seenp|^rn-edwin/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
    const now = new Date().toISOString(); const pc = { watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } }; await db.collection('prd_system').doc('pricing').set(pc, { merge: true }); S.prCfg = pc;
    const A0 = [...S.plist.values()].filter((l) => l.active); for (let j = 0; j < 40; j++) { const b = A0[j % A0.length]; const u = 'UZ' + (2000 + j); S.plist.set('aladin_' + u, { ...b, id: 'aladin_' + u, usedCode: u, active: true, title: j < 20 ? `시험책 ${j} (양장)` : `시험책 ${j}`, price: 10000 + j * 100 }); }
    const L = [...S.plist.values()].filter((l) => /^UZ2/.test(l.usedCode)); S.pmetrics = S.pmetrics || new Map(); L.forEach((l, j) => { l.bookId = 'bz' + j; S.pmetrics.set('bz' + j, { availability: 'onSale', salesPoint: 100 + j }); });
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 300, reasons: ['시험'], page1: [], at: now, out: false, critOff: true })); S.batchId = 'bQ'; S.prBatches = [{ id: 'bQ', name: '시험 그룹' }];
    const k = (j) => 'aladin_' + L[j].usedCode; const edkw = {}; for (let j = 0; j < NK; j++) edkw[k(j)] = { from: 'sel', at: now, kw: ['양장'] };
    S.batchSt = { start: {}, picks: {}, decided: {}, held: {}, trashed: {}, added: {}, edkw }; S.batchEdit = {}; S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.batchSubP = 'all'; S.bqWhy = null; S.bqOpen = new Set(); S.bqAddQ = '';
    try { localStorage.setItem('rn-bq-view', view); localStorage.setItem('rn-bbase', 'cur'); localStorage.setItem('rn-bpct', '100'); } catch (e) {} S.batchBase = null; S.batchPctB = null;
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '시험 그룹' }))); await W(900); }, [NK, view]); };
// 살핀 패널 검색창에 치고 결과 하나 누르기 → 창 상태
const SEARCH = async (p, q, pickRe) => p.evaluate(async ([q, pickRe]) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sp = document.getElementById('seenp'); if (!sp) return { err: 'no panel' };
  if (sp.classList.contains('fold')) { const f = sp.querySelector('[data-sp="fold"]'); f && f.click(); await W(300); }
  const inp = document.getElementById('seenp').querySelector('[data-sp="q"]'); if (!inp) return { err: 'no search box', html: document.getElementById('seenp').innerHTML.slice(0, 300) };
  inp.value = q; inp.dispatchEvent(new Event('input', { bubbles: true })); await W(700);
  const R = [...document.querySelectorAll('#seenp .seenp-qi[data-spgo]')]; const b = R.find((x) => new RegExp(pickRe).test(x.textContent)) || R[0]; if (!b) return { err: 'no result', n: R.length, html: document.getElementById('seenp').innerHTML.slice(0, 600) };
  const k = b.dataset.spgo; const href = location.href, det = S.detail; b.click(); await W(900);
  return { k, same: location.href === href && S.detail === det }; }, [q, pickRe]);
const WIN = (p, k) => p.evaluate((k) => { const w = document.querySelector('.spw'); const sp = document.getElementById('seenp'); if (!w) return { open: false };
  const body = w.querySelector('.spw-b'); const kids = body ? [...body.children] : []; const keyOf = (e) => e.dataset.mk || e.dataset.bqsk || e.dataset.k || ''; const r = w.querySelector('.spw-box').getBoundingClientRect();
  const all = [...document.querySelectorAll(`[data-mk="${CSS.escape(k)}"]`)].filter((e) => !e.closest('.seenp'));
  return { open: true, n: kids.length, key: kids[0] ? keyOf(kids[0]) : null, ttl: (w.querySelector('.spw-ttl') || {}).textContent || '', x: !!w.querySelector('.spw-x'), ph: document.querySelectorAll('.spw-ph').length, copies: all.length, inView: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1, panelHidden: !sp || getComputedStyle(sp).visibility === 'hidden' || sp.style.display === 'none', full: !!(kids[0] && kids[0].matches('.card.pq.bq, .stk-row')), pin: !!(kids[0] && kids[0].querySelector('[data-bpin]')) }; }, k);
const BATCH = async (p, nm, view, shot) => {
  // ① 같은 탭 상품
  const a = await SEARCH(p, '시험책 31', '시험책 31'); ok(a.k && a.same, `${nm} ① 검색 결과 누르면 화면 그대로(다른 화면으로 안 감)`, a);
  const w = await WIN(p, a.k); ok(w.open && w.n === 1 && w.key === a.k && /시험책 31/.test(w.ttl), `${nm} ① 안쪽 창에 그 상품 카드 하나만`, w);
  ok(w.x && w.inView && w.panelHidden, `${nm} ① ✕ 단추 · 화면 안 · 살핀 패널은 창 뒤로 숨김`, w);
  ok(w.copies === 1 && w.ph === 1, `${nm} ① 카드는 한 벌(원래 자리엔 자리표만)`, w);
  if (view === 'compact') ok(w.full || w.pin, `${nm} ② 한눈에 보기여도 창 안 카드는 펼친 카드(가격 칸 있음)`, w);
  if (shot) await p.screenshot({ path: shot + '-same.png' });
  // ③ 창 안 가격 칸 → 자료에 반영 · 다시 그려도 창 유지
  const e = await p.evaluate(async (k) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const inp = document.querySelector('.spw .spw-b [data-bpin]'); if (!inp) return { err: 'no price box' }; inp.value = '7777'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); await W(500);
    const st = JSON.stringify([S.batchEdit, S.batchSt && S.batchSt.picks]).includes('7777'); const T0 = S.batchT; try { drawBatchRes && null; } catch (er) {} return { st, T0 }; }, a.k);
  ok(e.st, `${nm} ③ 창 안 가격 칸에 친 값이 원래 자료(수동 일괄 상태)에 바로 들어감`, e);
  const w2 = await WIN(p, a.k); ok(w2.open && w2.n === 1 && w2.key === a.k && w2.copies === 1, `${nm} ③ 바꾼 뒤 다시 그려져도 창은 그 카드 하나를 계속 보여 줌`, w2);
  const v2 = await p.evaluate(() => { const i = document.querySelector('.spw .spw-b [data-bpin]'); return i ? i.value : null; }); ok(v2 === '7777', `${nm} ③ 창 안 카드에 새 값`, { v2 });
  // ④ ✕ 닫기 → 원래 탭 · 카드 제자리 · 새 값
  const c = await p.evaluate(async (k) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector('.spw .spw-x').click(); await W(600); const sp = document.getElementById('seenp');
    const el = [...document.querySelectorAll(`[data-mk="${CSS.escape(k)}"]`)].filter((e) => !e.closest('.seenp')); const pin = el[0] && el[0].querySelector('[data-bpin]');
    return { gone: !document.querySelector('.spw') && !document.querySelector('.spw-ph'), T: S.batchT, n: el.length, val: pin ? pin.value : null, open: !!(S.bqOpen && S.bqOpen.has(k)), panel: !!sp && getComputedStyle(sp).visibility !== 'hidden', det: !!(S.detail && S.detail.batch) }; }, a.k);
  ok(c.gone && c.det && c.panel, `${nm} ④ ✕로 닫힘 · 수동 일괄 그대로 · 살핀 패널 다시 보임`, c);
  ok(c.n === 1 && (view !== 'compact' ? c.val === '7777' : !c.open), `${nm} ④ 카드 제자리(한 벌) · ${view === 'compact' ? '펼쳤던 카드는 다시 접힘' : '새 값 그대로'}`, c);
  // ② 다른 탭 상품(판본 키워드 탭) → 그 탭을 뒤에서 그려 옮겨 옴 · Esc로 닫으면 원래 탭
  const T0 = await p.evaluate(() => S.batchT);
  const b = await SEARCH(p, '시험책 3 (양장)', '시험책 3 \\(양장\\)'); const wb = await WIN(p, b.k);
  ok(b.k && wb.open && wb.n === 1 && wb.key === b.k, `${nm} ② 다른 탭(판본 키워드) 상품도 창에 그 카드 하나`, { b, wb, T0, T: await p.evaluate(() => S.batchT) });
  if (shot) await p.screenshot({ path: shot + '-other.png' });
  const x = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(600); return { gone: !document.querySelector('.spw'), T: S.batchT, det: !!(S.detail && S.detail.batch) }; });
  ok(x.gone && x.det && x.T === T0, `${nm} ④ Esc로 닫힘 · 원래 탭(${T0})으로 되돌아옴`, x);
  // ③ 창 안 단추 → 다른 탭으로 옮겨 가도 창이 따라감
  const m = await SEARCH(p, '시험책 33', '시험책 33');
  const mv = await p.evaluate(async (k) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const inp = document.querySelector('.spw .spw-b [data-bpin]'); const bt = document.querySelector('.spw .spw-b [data-bto]'); if (!inp || !bt) return { err: 'no pick button', h: (document.querySelector('.spw .spw-b') || {}).innerHTML?.slice(0, 300) };
    inp.value = '8888'; inp.dispatchEvent(new Event('input', { bubbles: true })); await W(200); bt.click(); await W(1500); const w = document.querySelector('.spw'); const kids = w ? [...w.querySelector('.spw-b').children] : [];
    return { picked: !!(S.batchSt.picks && S.batchSt.picks[k]), open: !!w, n: kids.length, key: kids[0] ? kids[0].dataset.mk : null, hint: kids[0] ? kids[0].className : '' }; }, m.k);
  ok(mv.picked, `${nm} ③ 창 안 「결정 대기로」 단추 → 원래 자료에 결정 대기로 들어감`, mv);
  ok(mv.open && mv.n === 1, `${nm} ③ 단추 뒤에도 창은 열린 채(카드가 다른 탭으로 가면 따라가거나 안내)`, mv);
  const mc = await p.evaluate(async (k) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const x = document.querySelector('.spw .spw-x'); x && x.click(); await W(600); return { gone: !document.querySelector('.spw'), T: S.batchT, here: [...document.querySelectorAll(`#b_res [data-mk="${CSS.escape(k)}"]`)].length }; }, m.k);
  ok(mc.gone && mc.T === T0, `${nm} ④ 닫으면 원래 탭 · 결정 대기로 간 상품은 원래 탭 목록에서 빠짐(새 값)`, mc);
  ok((await p.evaluate(() => window.__DLG + window.__OPEN)) === 0, `${nm} 브라우저 창(alert·confirm·prompt·새 창) 없음`);
};
const STOCK = async (p, nm) => {
  const o = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); try { closeSheet && closeSheet(); } catch (e) {} await W(300); S.prodLoaded = true; try { localStorage.setItem('rn-stk-view', 'compact'); } catch (e) {} openStockView(); await W(1200); return { on: !!(S.detail && S.detail.stock), cfg: SEENP.cfg && SEENP.cfg.key, spw: !!(SEENP.cfg && SEENP.cfg.spw) }; });
  ok(o.on && o.cfg === 'stock' && o.spw, `${nm} ⑤ 재고 품목 화면 살핀 패널에 안쪽 창 길`, o);
  if (!o.on || o.cfg !== 'stock') return;
  const a = await SEARCH(p, '시험책 37', '시험책 37'); const w = await WIN(p, a.k);
  ok(a.same && w.open && w.n === 1 && w.key === a.k, `${nm} ⑤ 재고 품목: 누르면 안쪽 창에 그 상품 하나`, { a, w });
  const c = await p.evaluate(async (k) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector('.spw .spw-x').click(); await W(600); return { gone: !document.querySelector('.spw'), n: [...document.querySelectorAll(`#sheet [data-mk="${CSS.escape(k)}"]`)].filter((e) => !e.closest('.seenp')).length, open: !!(STK.open && STK.open.has && STK.open.has(k)), det: !!(S.detail && S.detail.stock) }; }, a.k);
  ok(c.gone && c.det && c.n <= 1 && !c.open, `${nm} ⑤ 재고 품목: 닫으면 제자리 · 펼친 것 되접음`, c);
};
const DOMFIND = async (p, nm) => {
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); try { closeSheet && closeSheet(); } catch (e) {} await W(300);
    const root = document.createElement('div'); root.id = 'spwT'; root.innerHTML = ['가나 책', '다라 책', '마바 책'].map((t, i) => `<div class="card spwTc" data-k="K${i}"><b>${t}</b><button type="button" data-spwTb="K${i}">값 올리기</button><span class="v">0</span></div>`).join(''); document.body.appendChild(root);
    window.__SPWT = {}; const bind = () => root.querySelectorAll('[data-spwTb]').forEach((b) => (b.onclick = () => { const k = b.dataset.spwTb; window.__SPWT[k] = (window.__SPWT[k] || 0) + 1; b.parentElement.querySelector('.v').textContent = window.__SPWT[k]; })); bind();
    const cfg = { key: 'spwT', title: '시험 등록', alive: () => !!document.getElementById('spwT'), root: () => document.getElementById('spwT'), sel: '.spwTc', keyOf: (e) => e.dataset.k, nameOf: (e) => e.querySelector('b').textContent, has: () => true };
    seenPanelUse(cfg); await W(400); return { find: typeof cfg.find === 'function', dom: cfg.findDom === 1, spw: !!cfg.spw }; });
  ok(r.find && r.dom && r.spw, `${nm} ⑤ 찾기가 없던 화면(등록 등)도 그려진 카드에서 찾는 길이 저절로 붙음`, r);
  const a = await SEARCH(p, '다라', '다라'); const w = await WIN(p, 'K1');
  ok(a.k === 'K1' && w.open && w.n === 1 && w.key === 'K1', `${nm} ⑤ 그 카드만 안쪽 창에`, { a, w });
  const c = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const b = document.querySelector('.spw [data-spwTb="K1"]'); b && b.click(); const v = document.querySelector('.spw .v') && document.querySelector('.spw .v').textContent;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(400); const kids = [...document.getElementById('spwT').children].map((e) => e.dataset.k || e.className);
    const o = { n: window.__SPWT.K1, v, gone: !document.querySelector('.spw'), order: kids.join(',') }; document.getElementById('spwT').remove(); try { seenStop && seenStop(); } catch (e) {} return o; });
  ok(c.n === 1 && c.v === '1', `${nm} ⑤ 창 안 단추가 원래 손잡이 그대로 동작(값 바로 반영)`, c);
  ok(c.gone && c.order === 'K0,K1,K2', `${nm} ⑤ 닫으면 카드가 원래 자리(차례 그대로)`, c);
};
(async () => {
  { const src = fs.readFileSync(process.env.RN_APP || path.join(__dirname, '..', 'app.html'), 'utf8'); const cut = (a, b) => { const i = src.indexOf(a); return i < 0 ? '' : src.slice(i, src.indexOf(b, i + a.length)); };
    const core = cut('const SPW = {', 'function seenScanSoon('); ok(core.length > 500 && !/\b(alert|confirm|prompt)\(|window\.open\(/.test(core), '정적: 안쪽 창 코드에 브라우저 팝업 없음');
    ok(/spwOpen\(t\.dataset\.spgo\)/.test(src), '정적: 검색 결과 누르기 = spwOpen(탭으로만 가던 길 대신)');
    ok(/spw: spwB/.test(src) && /spw: spwS/.test(src), '정적: 수동 일괄·재고 품목에 안쪽 창 길'); }
  const shot = process.env.RN_SHOT || '';
  await H(async (p) => { await setup(p, 'full'); try { await BATCH(p, '넓은 화면·자세히', 'full', shot && shot + '-wf'); await STOCK(p, '넓은 화면'); await DOMFIND(p, '넓은 화면'); } catch (e) { ok(false, '넓은 화면 시험 안 오류', String(e && e.stack || e)); } });
  await H(async (p) => { await setup(p, 'compact'); try { await BATCH(p, '휴대폰·한눈에', 'compact', shot && shot + '-mc'); } catch (e) { ok(false, '휴대폰 시험 안 오류', String(e && e.stack || e)); } }, { vp: { width: 390, height: 844 }, touch: true });
  console.log(bad ? `❌ tSPW_1119 ${bad}개 실패` : '✓ tSPW_1119 통과'); process.exitCode = bad ? 1 : 0;
})();
