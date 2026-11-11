// tBQ1111 — (11/11 정범님) 🧮 수동 일괄 처리 보강
//  ① ⚡ 이번만 적용: 그룹 적용(감시·적용)이 꺼져 있어도 이번 확정만 반영(두 번 누름) · 다 반영되면 저절로 다시 끔 · 꺼진 그룹 확정에 브라우저 창 없음(그 자리에서 [✅ 켜고 확정]/[⚡ 이번만 적용])
//  ② 선택 대기 하위 탭(⬇ 내림·⬆ 오름·＝ 그대로·❔ 추천가 없음) + ⚡ 빠르게 고르기 100%에서 남는 까닭별 개수·[그 상품 보기]
//  ③ 카드 강조 줄(등록 카드의 칩 함수 — 등급·새책 판매 상태(품절)·SP)  ④ ⏸ 보류·🗑 휴지통(그룹 나눔 문서 · 기록)  ⑤ 기등록 상품 찾아 더하기  ⑥ 🔎 자세히/📋 한눈에(rn-bq-view · 등록 보기 기억은 그대로)
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBQ1111.js · RN_SHOT=<폴더>면 화면 사진(PC·휴대폰) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const S = { batchBase: 'cur', batchPctB: { cur: 100 } }; const LS = { getItem: () => null, setItem: () => {} };
  const pct = cut('const BP_KEY = {', 'function batchLoss(') .replace(/function batchMktRef[\s\S]*$/, '') + cut('function batchLoss(', '\n', 0) + '\n' + cut('function batchPctList(', '\n') + '\n';
  const blk = cut('/* ◆bq1111 시작', '/* ◆bq1111 끝 */').replace(/document\.addEventListener\([\s\S]*$/, '');
  const F = new Function('S', 'localStorage', 'num', 'esc', 'batchMktRef', 'document', pct + blk + '\nreturn { bqDir, bqSubOf, bqPctWhy, bqPctWhyHtml, bqOnceLeft, bqOnceDue, bqFind, bqHtBtns, BQ_SUBS, batchPctList };')(S, LS, (n) => String(n), (s) => String(s), (l) => (l && l.ref) || null, {});
  const mk = (u, price, target) => ({ l: { usedCode: u, price, title: '책 ' + u }, target });
  const R = [mk('U1', 10000, 9000), mk('U2', 10000, 12000), mk('U3', 10000, 10000), mk('U4', 10000, null), mk('U5', 0, 5000), mk('U6', 10000, 2000)]; const keyOf = (x) => 'aladin_' + x.l.usedCode; const L = R.map((x, i) => i);
  const SUB = F.bqSubOf(L, R, {}, keyOf); ok(SUB.down.join() === '0,5' && SUB.up.join() === '1' && SUB.same.join() === '2' && SUB.none.join() === '3,4' && SUB.all.length === 6, '하위 탭 = 내림·오름·그대로·추천가 없음(지금 판매가 없음 포함)', SUB);
  const S2 = F.bqSubOf(L, R, { aladin_U1: 10000 }, keyOf); ok(S2.same.includes(0), '직접 고친 값이 먼저(지금 값과 같으면 그대로)');
  const W = F.bqPctWhy(L, R, {}, keyOf); ok(W.n === 2 && W.left === 4 && W.k.up.length === 1 && W.k.same.length === 1 && W.k.none.length === 2 && !W.k.over.length, '⚡ 지금 판매가 100% — 옮김 2 · 남는 4 = 오름 1 · 그대로 1 · 추천가 없음 2', W);
  S.batchPctB.cur = 10; const W2 = F.bqPctWhy(L, R, {}, keyOf); ok(W2.n === 1 && W2.k.over.join() === '5', '10%면 −80% 상품은 「10% 넘게 내림」으로 남음', W2);
  const h = F.bqPctWhyHtml(W); ok(/남는 <b>4<\/b>개/.test(h) && /⬆ 오름 <b>1<\/b>/.test(h) && /data-bqwhy="none"/.test(h), '단추 옆 줄: 남는 n개 · 까닭별 개수 · [그 상품 보기]', h);
  S.batchBase = 'mkt'; S.batchPctB.mkt = 100; const Rm = [{ l: { usedCode: 'M1', price: 9000, ref: 8000 }, target: 8500 }, { l: { usedCode: 'M2', price: 9000 }, target: 8500 }, { l: { usedCode: 'M3', price: 9000, ref: 9000 }, target: 8000 }]; const Wm = F.bqPctWhy([0, 1, 2], Rm, {}, keyOf); ok(Wm.n === 1 && Wm.k.above.join() === '0' && Wm.k.noref.join() === '1', '유효 최저가 기준 — 유효 최저가보다 비쌈 · 유효 최저가 없음', Wm); S.batchBase = 'cur';
  const now = Date.parse('2026-11-11T10:00:00Z'); const o = { at: '2026-11-11T09:00:00Z' }; const docs = [['a', { approvalState: 'manual', approval: { batchId: 'g', decision: 'batch', at: '2026-11-11T09:00:01Z' } }], ['b', { approvalState: 'done', approval: { batchId: 'g', decision: 'batch', at: '2026-11-11T09:00:01Z' } }], ['c', { approvalState: 'manual', approval: { batchId: 'h', decision: 'batch', at: '2026-11-11T09:30:00Z' } }]];
  ok(F.bqOnceLeft(docs, 'g', o) === 1 && F.bqOnceLeft(docs, 'h', o) === 1, '이번만 적용 — 그룹마다 아직 반영 안 끝난 확정 수');
  ok(!F.bqOnceDue(o, 1, now) && F.bqOnceDue(o, 0, now) && !F.bqOnceDue({ at: '2026-11-11T09:55:00Z' }, 0, now) && F.bqOnceDue({ at: '2026-11-08T09:00:00Z' }, 3, now), '끝 = 남은 0 · 시작 10분 뒤(바로 직후엔 안 끔) · 72시간 넘으면 남아도 끔');
  const PL = [{ usedCode: 'U9', title: '어린 왕자', isbn13: '9788900000009', sku: 'PNKLUX', listingId: '777' }, { usedCode: 'U8', title: '데미안', isbn13: '9788900000008', sku: 'BLKCMN' }];
  ok(F.bqFind(PL, '왕자').length === 1 && F.bqFind(PL, '978-8900-000008')[0].usedCode === 'U8' && F.bqFind(PL, 'pnklux')[0].usedCode === 'U9' && F.bqFind(PL, 'u8')[0] === undefined && F.bqFind(PL, 'U8 ').length === 0 && F.bqFind(PL, 'x').length === 0, '찾기 — 제목(두 글자)·ISBN(하이픈 무시)·관리코드 · 짧은 코드는 안 찾음');
  ok(/data-bqht="hold"/.test(F.bqHtBtns('sel', 'k')) && /data-bqht="unhold"/.test(F.bqHtBtns('hold', 'k')) && /data-bqht="untrash"/.test(F.bqHtBtns('trash', 'k')) && F.bqHtBtns('done', 'k') === '', '카드 단추 — ⏸ 보류·✖ 빼기 / 보류 탭 ↩ 선택 대기로 / 휴지통 ↩ 되돌리기 / 확정 탭엔 없음'); }
console.log('· 코드 확인');
{ const ex0 = cut('async function batchExec0(', "if (snapRows.length) decSnap("); ok(!/\balert\s*\(/.test(ex0) && /O\.once/.test(ex0) && /bqOnceStart\(id/.test(ex0) && /expectPrice: l\.price/.test(ex0) && /movedNote/.test(ex0), '확정 함수: 브라우저 alert 없음 · 이번만 적용 · 반영 직전 안전장치(expectPrice·다른 기기 바뀜 확인) 그대로');
  const blk = cut('/* ◆bq1111 시작', '/* ◆bq1111 끝 */'); ok(!/\b(alert|confirm|prompt)\s*\(/.test(blk) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(blk), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  const PW = [path.resolve(path.dirname(APP), '..', 'readnow-price-watch.user.js')].find((x) => fs.existsSync(x)); if (PW) ok(/\(SET\.batchOff \|\| \{\}\)\[a\.batchId\]/.test(fs.readFileSync(PW, 'utf8')), '가격 감시기는 그대로(batchOff만 봄 — 이번만 적용은 웹앱이 그동안만 batchOff를 풂)'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBQ1111 ${bad}개 실패` : '✓ tBQ1111 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SHOT = process.env.RN_SHOT || '';
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); };
    /* 스텁 Firestore에 점(.) 칸·문서 번호 고르기를 덧댐 — 화면 쪽 질의(approval.batchId == 그룹)가 실제처럼 걸리게 */
    const C0 = db.collection.bind(db); const val = (d, f) => (f === '__id' ? d.id : f.split('.').reduce((o, k) => (o == null ? o : o[k]), d.data()));
    const flt = (sn, ex) => { const docs = sn.docs.filter((d) => ex.every(([f, op, v]) => { const x = val(d, f); return op === '==' ? x === v : op === 'in' ? v.includes(x) : true; })); return { ...sn, docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn), docChanges: () => docs.map((d) => ({ type: 'added', doc: d })) }; };
    const wrap = (q, ex) => new Proxy(q, { get(t, k) { if (k === 'where') return (f, op, v) => (/\./.test(f) || f === '__id' ? wrap(t, (ex || []).concat([[f, op, v]])) : wrap(t.where(f, op, v), ex)); if (ex && k === 'get') return async () => flt(await t.get(), ex); if (ex && k === 'onSnapshot') return (a, b) => t.onSnapshot((sn) => (typeof a === 'function' ? a : b)(flt(sn, ex))); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    db.collection = (n) => wrap(C0(n));
    const now = new Date().toISOString(); await db.collection('prd_system').doc('pricing').set({ watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } }, { merge: true });
    S.prCfg = { watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } };
    const L = [...S.plist.values()].filter((l) => l.active).slice(0, 8); S.pmetrics = S.pmetrics || new Map(); L.forEach((l, j) => { l.bookId = 'bk' + j; S.pmetrics.set('bk' + j, { availability: j === 0 ? '품절' : 'onSale', salesPoint: 1234 + j }); });
    /* 0 내림 · 1 내림 · 2 오름 · 3 오름 · 4 그대로(고친 값) · 5 추천가 없음(판정 꺼짐) · 6·7 결정 대기 */
    const tg = [(l) => l.price - 500, (l) => l.price - 1000, (l) => l.price + 800, (l) => l.price + 300, (l) => l.price - 300, () => null, (l) => l.price - 200, (l) => l.price - 400];
    S.batchRes = L.map((l, j) => ({ l, target: tg[j](l), reasons: ['시험'], page1: [], at: now, out: false, critOff: j === 5 })); S.batchId = 'bQ'; S.prBatches = [{ id: 'bQ', name: '3만원초과 전체(시험)' }];
    const k = (j) => 'aladin_' + L[j].usedCode; S.batchSt = { start: {}, picks: { [k(6)]: { price: L[6].price - 200, at: now }, [k(7)]: { price: L[7].price - 400, at: now } }, decided: {}, held: {}, trashed: {}, added: {} }; S.batchEdit = { bQ: { [k(4)]: L[4].price } };
    S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.bqWhy = null; S.bqOpen = new Set(); S.bqAddQ = ''; try { localStorage.removeItem('rn-bq-view'); localStorage.setItem('rn-reg-view', 'full'); localStorage.setItem('rn-bbase', 'cur'); localStorage.setItem('rn-bpct', '100'); } catch (e) {} S.batchBase = null; S.batchPctB = null;
    window.__L = L.map((l) => l.usedCode); window.__open = async () => { openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '3만원초과 전체(시험)' }))); await W(500); }; await window.__open(); }); };
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); await setup(p);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; const sh = document.getElementById('sheet'); const res = () => sh.querySelector('#b_res'); const q = (s) => res().querySelector(s); const U = window.__L; const K = (j) => 'aladin_' + U[j];
    const cards = () => [...res().querySelectorAll('.card.pq.bq[data-mk], .bqc[data-mk]')].map((c) => c.dataset.mk);
    // ② 하위 탭
    out.sub = [...res().querySelectorAll('[data-bqsub]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()).slice(0, 5); out.subHead = (q('.bqsubh') || {}).innerText || '';
    out.why = ((q('#b_pctwhy') || {}).innerText || '').replace(/\s+/g, ' '); out.pctn = (q('#b_pctn') || {}).textContent;
    q('[data-bqsub="up"]').click(); await W(250); out.upCards = cards(); out.upHead = ((q('.bqsubh') || {}).innerText || '').replace(/\s+/g, ' '); out.upPctn = (q('#b_pctn') || {}).textContent;
    q('[data-bqsub="all"]').click(); await W(250); q('[data-bqwhy="none"]').click(); await W(250); out.noneCards = cards(); out.noneOn = ((q('[data-bqsub].on') || {}).textContent || '').trim();
    q('[data-bqsub="down"]').click(); await W(250); out.downCards = cards(); q('#b_pickpct').click(); await W(300); out.downPicked = [K(0), K(1)].every((k) => S.batchSt.picks[k]) && !S.batchSt.picks[K(2)];
    // ③ 카드 강조 줄
    S.batchSub = 'all'; delete S.batchSt.picks[K(0)]; delete S.batchSt.picks[K(1)]; await window.__open(); const c0 = res().querySelector(`.card.pq.bq[data-mk="${K(0)}"]`); out.hi = c0 ? { bqhi: !!c0.querySelector('.bqhi'), gsq: !!c0.querySelector('.bqhi .gsq'), oos: ((c0.querySelector('.bqhi .rgi.oos') || {}).textContent || ''), sp: /SP 1,234/.test((c0.querySelector('.bqhi') || {}).textContent || '') } : null;
    // ④ 보류 · 휴지통
    q(`.card[data-mk="${K(2)}"] [data-bqht="hold"]`).click(); await W(300); out.held = !!S.batchSt.held[K(2)] && !cards().includes(K(2));
    const shardOf = (k) => Object.entries(FS.prd_price_batches || {}).find(([id, v]) => /^bQ~s/.test(id) && v.held && v.held[k]); out.heldSaved = !!shardOf(K(2));
    sh.querySelector('[data-btab="hold"]').click(); await W(300); out.holdTab = { cards: cards(), btn: !!q(`[data-bqht="unhold"][data-bqk="${K(2)}"]`) };
    q(`[data-bqht="unhold"][data-bqk="${K(2)}"]`).click(); await W(300); out.unheld = !S.batchSt.held[K(2)];
    sh.querySelector('[data-btab="pick"]').click(); await W(300); const tb = q(`[data-bqht="trash"][data-bqk="${K(6)}"]`); tb.click(); await W(150); out.trash1 = !S.batchSt.trashed[K(6)]; await W(500); tb.click(); await W(300); out.trash2 = !!S.batchSt.trashed[K(6)] && !S.batchSt.picks[K(6)];
    sh.querySelector('[data-btab="trash"]').click(); await W(300); out.trashTab = cards(); q(`[data-bqht="untrash"][data-bqk="${K(6)}"]`).click(); await W(300); out.untrash = !S.batchSt.trashed[K(6)];
    out.log = ((FS.prd_price_batches || {}).bQ || {}).listLog ? FS.prd_price_batches.bQ.listLog.map((e) => e.what).join(',') : '';
    // ① 꺼진 그룹 확정
    S.batchSt.picks[K(6)] = { price: S.batchRes[6].l.price - 200, at: new Date().toISOString() }; S.batchT = 'pick'; await window.__open();
    out.off = { chooser: !!q('#b_offc'), exec: !!q('#b_exec'), once: !!q('#b_once'), onexec: !!q('#b_onexec'), label: ((sh.querySelector('#b_on') || {}).parentElement || {}).textContent };
    await window.__batchExecOne(S.batchRes.findIndex((x) => 'aladin_' + x.l.usedCode === K(7)), S.batchRes.find((x) => 'aladin_' + x.l.usedCode === K(7)).l.price - 400, K(7)); await W(300);
    out.offExec = { dec: Object.keys(FS.prd_price_decisions || {}).length, toast: window.__TL.filter((t) => /이번만 적용/.test(t)).join(' / '), notes: document.querySelectorAll('#rn-notes [role=alert]').length };
    const ob = q('#b_once'); ob.click(); await W(200); out.once1 = { dec: Object.keys(FS.prd_price_decisions || {}).length, armed: ob.classList.contains('ux2-armed') }; await W(500); ob.click();
    for (let i = 0; i < 40 && Object.keys(FS.prd_price_decisions || {}).length < 2; i++) await W(200); await W(500);
    const PD = FS.prd_price_decisions || {}; const PC = FS.prd_system.pricing; out.once = { dec: Object.keys(PD).sort().join(','), st: [K(6), K(7)].map((k) => PD[k] ? [PD[k].approvalState, PD[k].approval.decision, PD[k].approval.batchId, PD[k].approval.once, PD[k].approval.expectPrice != null].join('|') : '-'), off: (PC.batchOff || {}).bQ, onceAt: !!((PC.batchOnce || {}).bQ || {}).at, n: ((PC.batchOnce || {}).bQ || {}).n, watch: !!((FS.prd_price_batches || {}).bQ || {}).watch, log: (PC.batchOffLog || []).slice(-1)[0] };
    await W(300); out.onceLabel = ((sh.querySelector('#b_on') || {}).parentElement || {}).textContent || '';
    // 반영 끝 → 저절로 다시 끔
    Object.values(PD).forEach((v) => { v.approvalState = 'done'; }); FS.prd_system.pricing.batchOnce.bQ.at = new Date(Date.now() - 11 * 60e3).toISOString(); S.prCfg.batchOnce.bQ.at = FS.prd_system.pricing.batchOnce.bQ.at; await bqOnceSweep(); await W(200);
    out.sweep = { off: (FS.prd_system.pricing.batchOff || {}).bQ, once: !!((FS.prd_system.pricing.batchOnce || {}).bQ), local: batchIsOn('bQ'), why: ((FS.prd_system.pricing.batchOffLog || []).slice(-1)[0] || {}).why };
    // ⑤ 찾아 더하기
    S.batchT = 'sel'; await window.__open(); const other = [...S.plist.values()].find((l) => !U.includes(l.usedCode) && l.usedCode); const aq = q('#b_addq'); aq.value = other.title.slice(0, 8); aq.oninput(); await W(400);
    out.find = { rows: res().querySelectorAll('#b_addres .bqadr').length, add: !!res().querySelector(`#b_addres [data-bqadd="aladin_${other.usedCode}"]`), have: res().querySelectorAll('#b_addres .bqadr.have').length, rgrow: !!res().querySelector('#b_addres .rgrow') };
    res().querySelector(`#b_addres button[data-bqadd="aladin_${other.usedCode}"]`).click(); await W(400); out.added = { st: !!S.batchSt.added['aladin_' + other.usedCode], inR: S.batchRes.some((x) => x.l.usedCode === other.usedCode), saved: Object.entries(FS.prd_price_batches || {}).some(([id, v]) => v.added && v.added['aladin_' + other.usedCode]) };
    { const a2 = q('#b_addq'); a2.value = other.title.slice(0, 8); a2.oninput(); await W(400); out.find2 = ((res().querySelector(`#b_addres .bqadr.have .bqc-c`) || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 120); a2.value = ''; a2.oninput(); S.bqAddQ = ''; await W(300); }
    // ⑥ 한눈에 / 자세히
    out.vbar = !!document.querySelector('[data-bqview="compact"]'); document.querySelector('[data-bqview="compact"]').click(); await W(400);
    out.compact = { rows: res().querySelectorAll('.bqc .rgrow').length, full: res().querySelectorAll('.card.pq.bq').length, ls: localStorage.getItem('rn-bq-view'), reg: localStorage.getItem('rn-reg-view'), btn: !!res().querySelector('.bqc [data-bqpick]') };
    const r0 = res().querySelector('.bqc[data-bqexp] .rgr-t') || res().querySelector('.bqc[data-bqexp]'); r0.click(); await W(400); out.exp = { fold: res().querySelectorAll('[data-bqfold]').length, full: res().querySelectorAll('.card.pq.bq').length };
    res().querySelector('[data-bqfold]').click(); await W(300); out.fold = res().querySelectorAll('.card.pq.bq').length;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', key: 'v', altKey: true, bubbles: true })); await W(400); out.altV = { ls: localStorage.getItem('rn-bq-view'), full: res().querySelectorAll('.card.pq.bq').length };
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 1));
  ok(r.sub.length === 5 && /^전체 6/.test(r.sub[0]) && /내림 2/.test(r.sub[1]) && /오름 2/.test(r.sub[2]) && /그대로 1/.test(r.sub[3]) && /추천가 없음 1/.test(r.sub[4]), '② 선택 대기 하위 탭 [전체 6] [⬇ 내림 2] [⬆ 오름 2] [＝ 그대로 1] [❔ 추천가 없음 1]', r.sub);
  ok(/선택 대기에 지금 있는 상품 모두/.test(r.subHead) && /오름/.test(r.upHead) && /시장이 우리보다 비쌈/.test(r.upHead), '② 하위 탭 머리 = 뜻 한 줄(개념) · 아래 = 그 상품 카드(실물)', [r.subHead, r.upHead]);
  ok(r.pctn === '2' && /남는 4\s*개/.test(r.why) && /오름 2/.test(r.why) && /그대로 1/.test(r.why) && /추천가 없음 1/.test(r.why), '② 빠르게 고르기 100% → 2개 · 남는 4개: 오름 2 · 그대로 1 · 추천가 없음 1', r.why);
  ok(r.upCards.length === 2 && r.upPctn === '0', '② ⬆ 오름 하위 탭 = 그 2개만 · 빠르게 고르기도 이 보기 기준(0개)', r.upCards);
  ok(r.noneCards.length === 1 && /추천가 없음/.test(r.noneOn), '② [그 상품 보기] → 그 하위 탭으로', r);
  ok(r.downCards.length === 2 && r.downPicked, '② ⬇ 내림 하위 탭에서 빠르게 고르기 = 그 2개만 결정 대기로');
  ok(r.hi && r.hi.bqhi && r.hi.gsq && /품절/.test(r.hi.oos) && r.hi.sp, '③ 카드 강조 줄 — 등록 카드 함수(등급 칩·새책 품절 띠·SP)', r.hi);
  ok(r.held && r.heldSaved && r.holdTab.cards.length === 1 && r.holdTab.btn && r.unheld, '④ ⏸ 보류 → 보류 탭(그룹 나눔 문서에 저장 · 모든 기기) → ↩ 선택 대기로', r);
  ok(r.trash1 && r.trash2 && r.trashTab.length === 1 && r.untrash, '④ ✖ 빼기 = 두 번 누름 → 🗑 휴지통(결정 대기에서 빠짐) → ↩ 되돌리기', r);
  ok(/hold/.test(r.log) && /unhold/.test(r.log) && /trash/.test(r.log) && /untrash/.test(r.log), '④ 기록 남김(그룹 문서 listLog)', r.log);
  ok(r.off.chooser && !r.off.exec && r.off.once && r.off.onexec && /적용\(확정 가격 반영\)/.test(r.off.label), '① 꺼진 그룹 결정 대기 = 그 자리에서 [✅ 켜고 확정] / [⚡ 이번만 적용] 고르기', r.off);
  ok(r.offExec.dec === 0 && /이번만 적용/.test(r.offExec.toast) && r.offExec.notes === 0, '① 꺼진 그룹에서 하나 확정 → 확정 안 함 · 알림창 대신 토스트(고르는 칸으로)', r.offExec);
  ok(r.once1.dec === 0, '① [⚡ 이번만 적용] 한 번 = 무장만(아무것도 안 씀)', r.once1);
  ok(r.once.st.every((x) => /^manual\|batch\|bQ\|1\|true$/.test(x)) && r.once.off === undefined && r.once.onceAt && r.once.n === 2 && !r.once.watch && r.once.log && r.once.log.once === 1, '① 두 번 = 결정 대기 2개 확정(반영 직전 확인 expectPrice 그대로) · 그동안만 적용 켬 · 🛰 감시는 안 켬 · 기록', r.once);
  ok(/이번만 켜짐/.test(r.onceLabel), '① 적용 칸에 「⚡ 이번만 켜짐 — 다 반영되면 저절로 다시 꺼짐」', r.onceLabel);
  ok(r.sweep.off === true && !r.sweep.once && !r.sweep.local && /이번만 적용 끝/.test(r.sweep.why || ''), '① 이번 확정이 다 반영되면 저절로 다시 끔(기록)', r.sweep);
  ok(r.find.rows >= 1 && r.find.add && r.find.rgrow, '⑤ 기등록 상품 찾기 → 등록 한눈에 줄 모양 목록 · [➕ 이 그룹에 더함]', r.find);
  ok(r.added.st && r.added.inR && r.added.saved && /이미 이 그룹에 있음/.test(r.find2), '⑤ 누르면 이 그룹에 더함(나눔 문서 added) · 다시 찾으면 「이미 이 그룹에 있음 — 탭」', [r.added, r.find2]);
  ok(r.vbar && r.compact.rows >= 3 && r.compact.full === 0 && r.compact.ls === 'compact' && r.compact.reg === 'full' && r.compact.btn, '⑥ 📋 한눈에 = 등록 한눈에 줄 + 가격 한 줄 · 이 기기에 기억(rn-bq-view) · 📥 등록 보기 기억은 그대로', r.compact);
  ok(r.exp.fold === 1 && r.exp.full === 1 && r.fold === 0 && r.altV.ls === 'full' && r.altV.full >= 3, '⑥ 줄을 누르면 그 상품만 자세히 · ▲ 접기 · Alt+V로 🔎 자세히', [r.exp, r.fold, r.altV]);
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 0번', dlg);
}, { vp: { width: 1400, height: 900 }, onPage: null }).then(async () => {
  if (!SHOT) return finish();
  /* 화면 사진 — PC·휴대폰 */
  for (const [nm, vp] of [['pc', { width: 1400, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    await require('./harness.js')(async (p) => { await setup(p); await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.batchT = 'sel'; await window.__open(); await W(300); const s = document.getElementById('sheet'); const t = s.querySelector('.bqsub'); if (t) t.scrollIntoView({ block: 'start' }); s.scrollTop -= 60; }); await p.waitForTimeout(500); await p.screenshot({ path: path.join(SHOT, `bq_${nm}_sel.png`) });
      await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.batchT = 'pick'; await window.__open(); await W(300); const b = document.getElementById('b_offc'); if (b) b.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(SHOT, `bq_${nm}_off.png`) });
      await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); try { localStorage.setItem('rn-bq-view', 'compact'); } catch (e) {} S.batchT = 'sel'; await window.__open(); await W(300); const s = document.getElementById('sheet'); const t = s.querySelector('.bqc'); if (t) t.scrollIntoView({ block: 'start' }); s.scrollTop -= 120; }); await p.waitForTimeout(500); await p.screenshot({ path: path.join(SHOT, `bq_${nm}_compact.png`) });
      await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const q = document.querySelector('#b_addq'); q.value = '테스트 책 1'; q.oninput(); await W(400); q.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(400); await p.screenshot({ path: path.join(SHOT, `bq_${nm}_find.png`) }); }, { vp, ...(nm === 'phone' ? { touch: true } : {}) }); }
  finish(); });
function finish() { console.log(bad ? `❌ tBQ1111 ${bad}개 실패` : '✓ tBQ1111 통과'); process.exitCode = bad ? 1 : 0; }
