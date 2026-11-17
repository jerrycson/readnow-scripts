// tSEENP1117 — (정범님 11/17 I-1117-1932-21) 🧮 수동 일괄 👁 살핀 상품 패널 셋
//  ① 탭에서 빠지면 패널 목록에서도 그 자리에서 빠짐 — 카드 「⏸ 보류」 · 「✖ 빼기」 · 다른 기기에서 온 실시간 바뀜(보류) · 「처리 뒤에도 남기기」는 그대로 지킴
//  ② 패널 단추로 옮긴 뒤 화면이 그 자리에 머묾 — 맨 위에 보이던 카드가 옮겨지면 그다음 남은 카드가 그 자리에 섬(넓은 화면 · 휴대폰) · 창 scrollY 그대로 · 탭 그대로
//     결정 대기 탭의 「살핀 것 선택 대기로」도 결정 대기 탭에 머묾
//  ③ 결정 대기 탭 하위 탭(전체 · ⬇ 내림 · ⬆ 오름 · ＝ 그대로 · ❔ 가격 없음) — 결정한 가격 기준 셈 · 누르면 그 상품만 보임 · 선택 대기 하위 탭 고름과 따로 기억
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tSEENP1117.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; window.__DLG = 0; window.alert = window.confirm = window.prompt = () => { window.__DLG++; return true; };
    /* 스텁 Firestore에 점(.) 칸 질의를 덧댐 — 화면 쪽 질의(approval.batchId == 그룹)가 실제처럼 걸리게 */
    const C0 = db.collection.bind(db); const val = (d, f) => (f === '__id' ? d.id : f.split('.').reduce((o, k) => (o == null ? o : o[k]), d.data()));
    const flt = (sn, ex) => { const docs = sn.docs.filter((d) => ex.every(([f, op, v]) => { const x = val(d, f); return op === '==' ? x === v : op === 'in' ? v.includes(x) : true; })); return { ...sn, docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn), docChanges: () => docs.map((d) => ({ type: 'added', doc: d })) }; };
    const wrap = (q, ex) => new Proxy(q, { get(t, k) { if (k === 'where') return (f, op, v) => (/\./.test(f) || f === '__id' ? wrap(t, (ex || []).concat([[f, op, v]])) : wrap(t.where(f, op, v), ex)); if (ex && k === 'get') return async () => flt(await t.get(), ex); if (ex && k === 'onSnapshot') return (a, b) => t.onSnapshot((sn) => (typeof a === 'function' ? a : b)(flt(sn, ex))); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    db.collection = (n) => wrap(C0(n));
    const now = new Date().toISOString(); const pc = { watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } }; await db.collection('prd_system').doc('pricing').set(pc, { merge: true }); S.prCfg = pc;
    const A0 = [...S.plist.values()].filter((l) => l.active); for (let j = 0; j < 160; j++) { const b = A0[j % A0.length]; const u = 'UZ' + (1000 + j); S.plist.set('aladin_' + u, { ...b, usedCode: u, title: '시험책 ' + j, price: 10000 + j * 100 }); }
    const L = [...S.plist.values()].filter((l) => l.active && /^UZ/.test(l.usedCode)).slice(0, 160); S.pmetrics = S.pmetrics || new Map(); L.forEach((l, j) => { l.bookId = 'bk' + j; S.pmetrics.set('bk' + j, { availability: 'onSale', salesPoint: 1234 + j }); });
    /* 0 내림 · 1 내림 · 2 오름 · 3 오름 · 4 그대로(고친 값) · 5 추천가 없음 · 6·7 결정 대기 */
    const tg = [(l) => l.price - 500, (l) => l.price - 1000, (l) => l.price + 800, (l) => l.price + 300, (l) => l.price - 300, () => null, (l) => l.price - 200, (l) => l.price - 400];
    S.batchRes = L.map((l, j) => ({ l, target: tg[j % 8](l), reasons: ['시험'], page1: [], at: now, out: false, critOff: j % 8 === 5 })); S.batchId = 'bQ'; S.prBatches = [{ id: 'bQ', name: '시험 그룹' }];
    const k = (j) => 'aladin_' + L[j].usedCode;
    /* 결정 대기 6개 — 내림 2(6·7) · 오름 1(14) · 그대로 1(15) · 가격 없음 1(22) · 내림 1(23) */
    const picks = { [k(6)]: { price: L[6].price - 200, at: now }, [k(7)]: { price: L[7].price - 400, at: now }, [k(14)]: { price: L[14].price + 500, at: now }, [k(15)]: { price: L[15].price, at: now }, [k(22)]: { price: null, at: now }, [k(23)]: { price: L[23].price - 100, at: now } };
    S.batchSt = { start: {}, picks, decided: {}, held: {}, trashed: {}, added: {} }; S.batchEdit = { bQ: { [k(4)]: L[4].price } };
    S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.batchSubP = 'all'; S.bqWhy = null; S.bqOpen = new Set(); S.bqAddQ = ''; try { localStorage.removeItem('rn-bq-view'); localStorage.setItem('rn-bbase', 'cur'); localStorage.setItem('rn-bpct', '100'); } catch (e) {} S.batchBase = null; S.batchPctB = null;
    window.__K = k; window.__P = { down: [k(6), k(7), k(23)], up: [k(14)], same: [k(15)], none: [k(22)] };
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '시험 그룹' }))); await W(600); }); };
/* 탭을 열고 위에서부터 훑어 카드를 '살핀' 상태로 만든 뒤, 맨 위에 보이는 카드 · 패널 단추 · 살핀 목록을 돌려줌 */
const PREP = async ([tab, until]) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); S.batchT = tab; S.batchLim = 400; document.querySelector('[data-btab="' + tab + '"]').click(); await W(500); sh.scrollTop = 0; await W(300);
  for (let y = 0; y <= until; y += 300) { sh.scrollTop = y; await W(550); }
  window.__vis = () => { const R0 = sh.getBoundingClientRect(); const c = [...sh.querySelectorAll('.card.pq.bq[data-mk], .bqc[data-mk]')].find((e) => e.getBoundingClientRect().bottom > R0.top + 8); return c ? [c.dataset.mk, Math.round(c.getBoundingClientRect().top - R0.top)] : null; };
  window.__seen = () => [...(SEENP.seen.get(SEENP.scope) || new Map()).keys()];
  return { y0: sh.scrollTop, wy: window.scrollY, v0: window.__vis(), seen: window.__seen(), scope: SEENP.scope, btns: [...document.querySelectorAll('#seenp [data-spact]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()) }; };
/* 패널 단추(ai번째)를 누르고 3초 동안 다시 그리기를 기다림 */
const PRESS = async (ai) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); const b = document.querySelectorAll('#seenp [data-spact]')[ai]; if (!b) return { err: '단추 없음' }; const lab = b.textContent.replace(/\s+/g, ' ').trim(); b.click(); await W(3000);
  return { lab, y1: sh.scrollTop, wy: window.scrollY, v1: window.__vis(), seen: window.__seen(), T: S.batchT, picks: Object.keys(S.batchSt.picks || {}) }; };
const SCROLLCASE = async (p, nm) => { const a = await p.evaluate(PREP, ['sel', 2700]); ok(a.seen.length >= 3 && a.y0 > 1000 && a.btns.length >= 2, `${nm}: 선택 대기 탭을 훑으면 살핀 상품이 쌓이고 패널 단추가 나옴`, a);
  const n0 = await p.evaluate(() => Object.keys(S.batchSt.picks || {}).length); const b = await p.evaluate(PRESS, 0); const moved = new Set(b.picks); ok(/결정 대기로/.test(b.lab) && b.picks.length > n0, `${nm}: 「살핀 것 … 결정 대기로」가 살핀 상품을 옮김`, { lab: b.lab, n: b.picks.length });
  ok(b.T === 'sel', `${nm}: 단추 뒤에도 선택 대기 탭 그대로`, b.T);
  ok(b.y1 > 300, `${nm}: 단추 뒤 화면이 맨 위로 올라가지 않음(안쪽 스크롤 칸 ${a.y0} → ${b.y1})`, b);
  ok(b.wy === a.wy, `${nm}: 창 scrollY 그대로(${a.wy} → ${b.wy})`, b);
  ok(b.v1 && !moved.has(b.v1[0]) && Math.abs(b.v1[1] - Math.max(a.v0[1], 0)) <= 24, `${nm}: 맨 위에 보이던 카드가 옮겨지면 그다음 남은 카드가 그 자리에 섬(${JSON.stringify(a.v0)} → ${JSON.stringify(b.v1)})`, { a: a.v0, b: b.v1 });
  ok(!b.seen.some((k) => moved.has(k)), `${nm}: 옮긴 상품은 살핀 목록에서도 빠짐`, b.seen); };

(async () => {
  await H(async (p) => { await setup(p); try {
    // ① 목록에서 빠짐
    const a = await p.evaluate(PREP, ['sel', 1500]); ok(a.scope === 'batch:bQ:sel' && a.seen.length >= 3, '① 선택 대기 탭을 훑으면 살핀 목록이 쌓임', a);
    const r1 = await p.evaluate(async (ks) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const sh = document.getElementById('sheet');
      const hb = sh.querySelector(`[data-bqht="hold"][data-bqk="${CSS.escape(ks[0])}"]`); out.hb = !!hb; if (hb) hb.click(); await W(700); out.afterHold = window.__seen(); out.held = !!(S.batchSt.held || {})[ks[0]];
      const tb = sh.querySelector(`[data-bqht="trash"][data-bqk="${CSS.escape(ks[1])}"]`); out.tb = !!tb; if (tb) { tb.click(); await W(600); const t2 = sh.querySelector(`[data-bqht="trash"][data-bqk="${CSS.escape(ks[1])}"]`); if (t2) t2.click(); } await W(700); out.afterTrash = window.__seen(); out.trashed = !!(S.batchSt.trashed || {})[ks[1]];
      /* 다른 기기에서 보류(실시간 수신) — 서버 문서가 바뀐 것처럼 합침 */
      const g = (S.prBatches || []).find((x) => x.id === 'bQ') || { id: 'bQ', name: '시험 그룹' }; const g2 = JSON.parse(JSON.stringify({ ...g, ...S.batchSt })); g2.held = { ...(g2.held || {}), [ks[2]]: { at: new Date().toISOString(), by: '다른 기기', from: 'sel' } }; S._userAt = 0; S._ptrDown = false;
      out.ch = batchFreshMerge('bQ', g, g2); await W(2500); out.afterLive = window.__seen(); out.heldLive = !!(S.batchSt.held || {})[ks[2]]; out.inDom = !!sh.querySelector(`[data-mk="${CSS.escape(ks[2])}"]`);
      out.domLive = [...sh.querySelectorAll('.card.pq.bq[data-mk], .bqc[data-mk]')].map((e) => e.dataset.mk); out.panelN = [...document.querySelectorAll('#seenp [data-spact]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()); return out; }, a.seen.slice(0, 3));
    ok(r1.hb && r1.held && !r1.afterHold.includes(a.seen[0]), '① 카드 「⏸ 보류」 → 탭에서 빠지는 즉시 살핀 목록에서도 빠짐', r1);
    ok(r1.tb && r1.trashed && !r1.afterTrash.includes(a.seen[1]), '① 카드 「✖ 빼기」(두 번 눌러 확정) → 살핀 목록에서도 빠짐', r1);
    ok(r1.heldLive && !r1.inDom && !r1.afterLive.includes(a.seen[2]), '① 다른 기기에서 온 실시간 보류 → 살핀 목록에서도 빠짐', r1);
    ok(r1.afterLive.length >= 1 && r1.afterLive.every((k) => r1.domLive.includes(k)), '① 살핀 목록에 남은 상품은 모두 지금 탭에 있는 상품', { after: r1.afterLive, dom: r1.domLive.slice(0, 12) });
    // ① 「처리 뒤에도 남기기」를 켠 단추 처리는 목록에 남김(정범님이 고른 보기 지킴) · 카드에서 빠진 것만 빠짐
    const r2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const kb = document.querySelector('#seenp [data-sp="keep"]'); if (kb && !kb.checked) kb.click(); await W(200); const s0 = window.__seen(); const b = [...document.querySelectorAll('#seenp [data-spact]')].find((x) => /결정 대기로/.test(x.textContent)); if (b) b.click(); await W(2500); const s1 = window.__seen(); const kb2 = document.querySelector('#seenp [data-sp="keep"]'); if (kb2 && kb2.checked) kb2.click(); try { localStorage.setItem('rn-seenp-keep', '0'); } catch (e) {} SEENP.keep = false; return { s0, s1, b: !!b, kb: !!kb }; });
    ok(r2.b && r2.s0.length > 0 && r2.s0.every((k) => r2.s1.includes(k)), '① 「처리 뒤에도 남기기」가 켜져 있으면 단추로 처리한 살핀 상품은 목록에 남음', r2);
    // ① 공통 거름(다른 화면 — 등록·알라딘 매입도 같은 has 칸을 씀)
    const r3 = await p.evaluate(() => { const c0 = SEENP.cfg, sc0 = SEENP.scope; SEENP.cfg = { key: 'x', has: (k) => k !== 'gone' }; SEENP.scope = 'x:t'; const M = seenMap('x:t'); M.set('gone', 1); M.set('stay', 1); const n = seenPrune(); const o = { n, keys: [...M.keys()] }; SEENP.cfg = { key: 'x' }; M.set('gone', 1); o.n2 = seenPrune(); SEENP.cfg = c0; SEENP.scope = sc0; return o; });
    ok(r3.n === 1 && r3.keys.join() === 'stay' && r3.n2 === 0, '① 공통 거름 — has가 아니라고 한 상품만 빠짐 · has가 없는 화면(내보내기만)은 건드리지 않음', r3);
    // ③ 결정 대기 하위 탭
    const r4 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); S.batchT = 'pick'; document.querySelector('[data-btab="pick"]').click(); await W(700);
      const bar = sh.querySelector('.bqsub.bqsubp'); const cnt = {}; (bar ? [...bar.querySelectorAll('[data-bqsub]')] : []).forEach((b) => (cnt[b.dataset.bqsub] = +((b.querySelector('b') || {}).textContent || -1)));
      const mks = () => [...sh.querySelectorAll('.card.pq.bq[data-mk], .bqc[data-mk]')].map((e) => e.dataset.mk); const all = mks(); const sub0 = S.batchSub; const lab = bar ? bar.textContent : '';
      const res = {}; for (const f of ['down', 'up', 'same', 'none']) { const b = sh.querySelector(`.bqsubp [data-bqsub="${f}"]`); if (b) b.click(); await W(500); res[f] = mks(); }
      const bk = sh.querySelector('.bqsubh [data-bqsub="all"]'); if (bk) bk.click(); await W(500); const back = mks();
      const dir = (k) => { const p1 = +((S.batchSt.picks[k] || {}).price), l = S.plist.get(k) || {}; const p0 = +l.price; return !(p1 > 0) || !(p0 > 0) ? 'none' : p1 < p0 ? 'down' : p1 > p0 ? 'up' : 'same'; }; const exp = { down: [], up: [], same: [], none: [] }; all.forEach((k) => exp[dir(k)].push(k));
      return { bar: !!bar, lab, cnt, all, res, back, exp, subP: S.batchSubP, sub0, sub1: S.batchSub }; });
    const P = await p.evaluate(() => window.__P); const E = r4.exp; const live = (L) => L.filter((k) => r4.all.includes(k));
    ok(r4.bar && /전체/.test(r4.lab) && /내림/.test(r4.lab) && /가격 없음/.test(r4.lab), '③ 결정 대기 탭에 하위 탭 줄(전체·내림·오름·그대로·가격 없음)', r4.lab);
    ok(r4.cnt.all === r4.all.length && ['down', 'up', 'same', 'none'].every((f) => r4.cnt[f] === E[f].length) && ['down', 'up', 'same', 'none'].every((f) => live(P[f]).every((k) => E[f].includes(k))) && E.up.length && E.same.length && E.none.length, '③ 하위 탭 숫자 = 결정한 가격 기준 셈', { cnt: r4.cnt, E, P });
    ok(['down', 'up', 'same', 'none'].every((f) => r4.res[f].length === r4.cnt[f] && r4.res[f].every((k) => E[f].includes(k))), '③ 하위 탭을 누르면 그 나눔의 상품만 보임', r4.res);
    ok(r4.back.length === r4.all.length && r4.subP === 'all', '③ 「전체 보기 ›」로 다시 모두 보임', { back: r4.back.length, subP: r4.subP });
    ok(r4.sub0 === r4.sub1, '③ 결정 대기 하위 탭 고름은 선택 대기 하위 탭 고름을 바꾸지 않음', r4);
    // ② 결정 대기 탭의 「살핀 것 선택 대기로」 → 결정 대기 탭에 머묾
    const r5 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); sh.scrollTop = 0; await W(300); for (let y = 0; y <= 900; y += 300) { sh.scrollTop = y; await W(550); } const s0 = window.__seen(); const n0 = Object.keys(S.batchSt.picks).length;
      const b = [...document.querySelectorAll('#seenp [data-spact]')].find((x) => /선택 대기로/.test(x.textContent)); if (b) b.click(); await W(2500); return { b: !!b, s0, n0, n1: Object.keys(S.batchSt.picks).length, T: S.batchT, seen: window.__seen() }; });
    ok(r5.b && r5.s0.length >= 1 && r5.n1 < r5.n0, '② 결정 대기 「살핀 것 선택 대기로」가 살핀 상품을 되돌림', r5);
    ok(r5.T === 'pick', '② 단추 뒤에도 결정 대기 탭 그대로(예전: 선택 대기 탭으로 넘어감)', r5.T);
    // ② 선택 대기 탭 단추 뒤 화면 자리 — 넓은 화면
    await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.batchSt.picks = {}; S.batchSt.held = {}; S.batchSt.trashed = {}; SEENP.seen.clear(); S.batchSub = 'all'; S.batchSubP = 'all'; S.batchT = 'sel'; document.querySelector('[data-btab="sel"]').click(); await W(500); });
    await SCROLLCASE(p, '② 넓은 화면');
    ok((await p.evaluate(() => window.__DLG)) === 0, '브라우저 창(alert·confirm·prompt) 없음 — 웹앱 확인 창만');
  } catch (e) { ok(false, '넓은 화면 시험 안 오류', String(e && e.message)); } });
  // ② 휴대폰 — 예전엔 다음 남은 카드가 화면 아래(851px)로 밀려 맨 위 머리만 보였음
  await H(async (p) => { await setup(p); try { await SCROLLCASE(p, '② 휴대폰'); } catch (e) { ok(false, '휴대폰 시험 안 오류', String(e && e.message)); } }, { vp: { width: 390, height: 844 }, touch: true });
  console.log(bad ? `❌ tSEENP1117 ${bad}개 실패` : '✓ tSEENP1117 통과'); process.exitCode = bad ? 1 : 0;
})();
