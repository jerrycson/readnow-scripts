// tBQSIMP1118 — (정범님 11/18 I-1118-1947-22.1·22.3·22.4) 🧮 수동 일괄 간소화 셋
//  ① 22.1 적용(반영) 개념 없앰 — 꺼진 그룹도 단추 하나 [✅ N개 확정 — 두 번 누름] · 한 번 = 「확정할까요?」 무장만 · 두 번 = 확정 + 이번 확정만 반영(옛 ⚡ 이번만 길 · 다 반영되면 저절로 다시 꺼짐)
//     옛 적용 칸·고르기 칸은 ⚙ 「수동 일괄 '적용' 켜고 끄기 되살리기」(기본 꺼짐)를 켤 때만 다시 보임 · 확정 탭(조건 이미 부합)도 두 번 누름 단추
//  ② 22.3 👁 살핀 상품 패널 찾기 — 제목·ISBN·SKU·관리코드 · 이 탭이면 그 카드로 가서 잠깐 빛남 · 다른 탭이면 탭 이름이 보이고 누르면 그 탭으로 가서 그 카드
//  ③ 22.4 패널 「이 목록을 선택 대기로」(두 번 누름 · 조건 이미 부합·추천 못 함·매입가 하한·보류·휴지통 탭) · 「그래도 바꾸기 → 선택 대기」는 탭을 바꾸지 않고 그 자리에 머묾
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBQSIMP1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('· 코드 확인');
{ ok(/function bqApplyUi\(\) \{ return !!\(S\.app && S\.app\.bqApplyUi\); \}/.test(T) && /sec\('set_bqapply'/.test(T) && /id="st_bqapply"/.test(T) && /set_bqapply: 'price'/.test(T), '① ⚙ 설정 칸 「수동 일괄 \'적용\' 되살리기」(app_settings · 기본 꺼짐 · 가격 갈래)');
  const i = T.indexOf('async function batchExec0('); const ex = T.slice(i, T.indexOf('if (snapRows.length) decSnap(', i)); ok(/const SIMP = !bqApplyUi\(\); if \(SIMP && !batchIsOn\(id\)\) O\.once = true;/.test(ex) && /expectPrice: l\.price/.test(ex) && /bqOnceStart\(id/.test(ex) && !/\b(alert|confirm|prompt)\s*\(/.test(ex), '① 확정 함수: 간소 모드면 꺼진 그룹도 이번만 반영 · 반영 직전 안전장치(expectPrice) 그대로 · 브라우저 창 없음');
  ok(/if \(x\.critOff \|\| x\.toSel\) return 'sel';/.test(T), '③ 선택 대기로 보낸 상품(toSel)은 어느 탭 규칙보다 먼저 선택 대기'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBQSIMP1118 ${bad}개 실패` : '✓ tBQSIMP1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('· 화면');
const H = require('./harness.js');
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); };
    const C0 = db.collection.bind(db); const val = (d, f) => (f === '__id' ? d.id : f.split('.').reduce((o, k) => (o == null ? o : o[k]), d.data()));
    const flt = (sn, ex) => { const docs = sn.docs.filter((d) => ex.every(([f, op, v]) => { const x = val(d, f); return op === '==' ? x === v : op === 'in' ? v.includes(x) : true; })); return { ...sn, docs, size: docs.length, empty: !docs.length, forEach: (fn) => docs.forEach(fn), docChanges: () => docs.map((d) => ({ type: 'added', doc: d })) }; };
    const wrap = (q, ex) => new Proxy(q, { get(t, k) { if (k === 'where') return (f, op, v) => (/\./.test(f) || f === '__id' ? wrap(t, (ex || []).concat([[f, op, v]])) : wrap(t.where(f, op, v), ex)); if (ex && k === 'get') return async () => flt(await t.get(), ex); if (ex && k === 'onSnapshot') return (a, b) => t.onSnapshot((sn) => (typeof a === 'function' ? a : b)(flt(sn, ex))); const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } });
    db.collection = (n) => wrap(C0(n));
    const now = new Date().toISOString(); const pc = { watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } }; await db.collection('prd_system').doc('pricing').set(pc, { merge: true }); S.prCfg = pc;
    S.app = { ...(S.app || {}), bqApplyUi: false };
    const A0 = [...S.plist.values()].filter((l) => l.active); for (let j = 0; j < 60; j++) { const b = A0[j % A0.length]; const u = 'US' + (1000 + j); S.plist.set('aladin_' + u, { ...b, usedCode: u, title: '간소책 ' + (100 + j), isbn13: '97889' + String(10000000 + j), price: 10000 + j * 100 }); }
    const L = [...S.plist.values()].filter((l) => l.active && /^US/.test(l.usedCode)).slice(0, 60); S.pmetrics = S.pmetrics || new Map(); L.forEach((l, j) => { l.bookId = 'bs' + j; S.pmetrics.set('bs' + j, { availability: 'onSale', salesPoint: 1000 + j }); });
    /* j%4: 0 조건 이미 부합(목표 = 지금 값) · 1 추천 못 함(목표 없음) · 2·3 선택 대기(내림) */
    const tg = [(l) => l.price, () => null, (l) => l.price - 500, (l) => l.price - 300];
    S.batchRes = L.map((l, j) => ({ l, target: tg[j % 4](l), reasons: ['시험'], page1: [], at: now, out: false, critOff: false })); S.batchId = 'bQ'; S.prBatches = [{ id: 'bQ', name: '간소 시험 그룹' }];
    const k = (j) => 'aladin_' + L[j].usedCode; window.__K = k; window.__L = L.map((l) => l.usedCode);
    S.batchSt = { start: {}, picks: { [k(2)]: { price: L[2].price - 500, at: now }, [k(3)]: { price: L[3].price - 300, at: now } }, decided: {}, held: {}, trashed: {}, added: {} }; S.batchEdit = {};
    S.batchMeta = {}; S.batchT = 'pick'; S._bFresh = true; S.batchSub = 'all'; S.batchSubP = 'all'; S.bqWhy = null; S.bqOpen = new Set(); S.bqAddQ = ''; try { localStorage.removeItem('rn-bq-view'); localStorage.setItem('rn-bbase', 'cur'); localStorage.setItem('rn-bpct', '100'); } catch (e) {} S.batchBase = null; S.batchPctB = null;
    window.__open = async () => { openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '간소 시험 그룹' }))); await W(600); }; await window.__open(); }); };
const SCAN = async ([tab, until]) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); S.batchT = tab; S.batchLim = 400; document.querySelector('[data-btab="' + tab + '"]').click(); await W(500); sh.scrollTop = 0; await W(300);
  for (let y = 0; y <= until; y += 300) { sh.scrollTop = y; await W(550); } return [...(SEENP.seen.get(SEENP.scope) || new Map()).keys()]; };
(async () => {
  await H(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); await setup(p); try {
    // ① 두 번 누름 확정
    const r1 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const sh = document.getElementById('sheet'); const q = (s) => sh.querySelector('#b_res ' + s); const out = {};
      out.ui = { exec: !!q('#b_exec[data-twice]'), txt: ((q('#b_exec') || {}).textContent || '').replace(/\s+/g, ' '), offc: !!q('#b_offc'), once: !!q('#b_once'), on: !!sh.querySelector('#b_on') };
      const b = q('#b_exec'); b.click(); await W(250); out.first = { dec: Object.keys(FS.prd_price_decisions || {}).length, armed: b.classList.contains('ux2-armed') }; await W(500);
      const b2 = q('#b_exec'); b2.click(); for (let i = 0; i < 40 && Object.keys(FS.prd_price_decisions || {}).length < 2; i++) await W(200); await W(600);
      const PD = FS.prd_price_decisions || {}; const PC = FS.prd_system.pricing; out.go = { left: Object.keys(S.batchSt.picks || {}).length, n: Object.keys(PD).length, st: Object.values(PD).map((v) => [v.approvalState, v.approval.batchId, v.approval.once, v.approval.expectPrice != null].join('|')), off: (PC.batchOff || {}).bQ, once: !!((PC.batchOnce || {}).bQ || {}).at, T: S.batchT };
      S.batchT = 'ok'; await window.__open(); out.okb = { tw: !!q('#b_okexec[data-twice]'), old: !!q('#b_okonce') };
      S.app.bqApplyUi = true; await window.__open(); out.restore = { on: !!sh.querySelector('#b_on'), lab: ((sh.querySelector('#b_on') || {}).parentElement || {}).textContent || '', okOld: !!q('#b_okonce') || !!q('#b_okexec:not([data-twice])') }; S.app.bqApplyUi = false; await window.__open();
      return out; });
    ok(r1.ui.exec && /2개 확정 — 두 번 누름/.test(r1.ui.txt) && !r1.ui.offc && !r1.ui.once && !r1.ui.on, '① 꺼진 그룹 결정 대기 = 단추 하나 [✅ 2개 확정 — 두 번 누름] · 적용 칸·고르기 칸 없음', r1.ui);
    ok(r1.first.dec === 0 && r1.first.armed, '① 한 번 누름 = 「2개를 이 가격으로 확정할까요?」 무장만(아무것도 안 씀)', r1.first);
    ok(r1.go.n >= 1 && r1.go.n + r1.go.left === 2 && r1.go.st.every((x) => /^manual\|bQ\|1\|true$/.test(x)) && r1.go.off === undefined && r1.go.once, '① 두 번 누름 = 확정(판매중 아님 같은 안전장치로 빠진 것은 결정 대기에 남음) · 이번 확정만 반영(그동안만 켬 · 다 반영되면 저절로 다시 꺼짐) · 반영 직전 확인 그대로', r1.go);
    ok(r1.okb.tw && !r1.okb.old, '① 확정 탭(조건 이미 부합)도 [✅ 고른 N개 확정 — 두 번 누름] · ⚡ 이번만 단추 없음', r1.okb);
    ok(r1.restore.on && /이번만 켜짐/.test(r1.restore.lab) && r1.restore.okOld, '① ⚙ 되살리기를 켜면 옛 적용 칸·옛 단추가 돌아옴', r1.restore);
    // ② 살핀 상품 패널 찾기
    await p.evaluate(SCAN, ['sel', 900]);
    const r2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); const out = {}; const inp = () => document.querySelector('#seenp [data-sp="q"]');
      const type = async (v) => { const i = inp(); if (!i) return null; i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); await W(500); return [...document.querySelectorAll('#seenp .seenp-qi')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()); };
      out.box = !!inp(); const okK = window.__K(4), selK = window.__K(10); const tOk = S.plist.get(okK).title, tSel = S.plist.get(selK).title;
      out.selRes = await type(tSel); const g1 = document.querySelector('#seenp .seenp-qi[data-spgo]'); if (g1) g1.click(); await W(500); const c1 = sh.querySelector(`[data-mk="${CSS.escape(selK)}"]`);
      const R0 = sh.getBoundingClientRect(); out.sel = { T: S.batchT, card: !!c1, flash: !!(c1 && c1.classList.contains('bq-flash')), vis: !!c1 && c1.getBoundingClientRect().top < R0.bottom && c1.getBoundingClientRect().bottom > R0.top };
      out.isbnRes = await type(S.plist.get(okK).isbn13); out.okRes = await type(tOk); const g2 = document.querySelector('#seenp .seenp-qi[data-spgo]'); if (g2) g2.click(); await W(900); const c2 = sh.querySelector(`[data-mk="${CSS.escape(okK)}"]`);
      out.ok = { T: S.batchT, card: !!c2, flash: !!(c2 && c2.classList.contains('bq-flash')), vis: !!c2 && c2.getBoundingClientRect().top < sh.getBoundingClientRect().bottom && c2.getBoundingClientRect().bottom > sh.getBoundingClientRect().top };
      return out; });
    ok(r2.box, '② 살핀 상품 패널에 🔎 찾기 칸', r2);
    ok(r2.selRes && r2.selRes.length === 1 && /이 탭/.test(r2.selRes[0]) && r2.sel.T === 'sel' && r2.sel.card && r2.sel.flash && r2.sel.vis, '② 이 탭 상품 = 「이 탭」 · 누르면 그 카드로 가서 잠깐 빛남', r2.sel);
    ok(r2.isbnRes && r2.isbnRes.length === 1 && /조건 이미 부합 탭/.test(r2.isbnRes[0]), '② ISBN으로도 찾음 · 다른 탭 상품은 그 탭 이름이 보임', r2.isbnRes);
    ok(r2.okRes && /조건 이미 부합 탭 →/.test(r2.okRes[0]) && r2.ok.T === 'ok' && r2.ok.card && r2.ok.flash && r2.ok.vis, '② 다른 탭 상품을 누르면 그 탭으로 바뀌고 그 카드가 보이며 빛남', r2.ok);
    // ③ 이 목록을 선택 대기로 · 그래도 바꾸기 그 자리
    const seenOk = await p.evaluate(SCAN, ['ok', 900]);
    const r3 = await p.evaluate(async (seen) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const sh = document.getElementById('sheet'); const out = {}; const okK = window.__K(4);
      const b = [...document.querySelectorAll('#seenp [data-spact]')].find((x) => /이 목록을 선택 대기로/.test(x.textContent)); out.btn = !!b; if (!b) return out;
      b.click(); await W(300); out.one = seen.filter((k) => (S.batchRes.find((x) => 'aladin_' + x.l.usedCode === k) || {}).toSel).length;
      const b2 = [...document.querySelectorAll('#seenp [data-spact]')].find((x) => /이 목록을 선택 대기로/.test(x.textContent)); b2.click(); await W(2500);
      const X = (k) => S.batchRes.find((x) => 'aladin_' + x.l.usedCode === k); out.moved = seen.map((k) => { const x = X(k); return [!!x.toSel, x.target != null && x.target < x.l.price]; }); out.T = S.batchT;
      /* 그래도 바꾸기 → 선택 대기 — 그 자리에 머묾 */
      S.batchT = 'keep'; document.querySelector('[data-btab="keep"]').click(); await W(500); const cs = [...sh.querySelectorAll('[data-bto2]')]; out.keepN = cs.length; if (cs.length < 4) return out; const tgt = cs[2]; tgt.scrollIntoView({ block: 'center' }); await W(400);
      const card = tgt.closest('[data-mk]'); const mk = card.dataset.mk; const nxt = cs[3].closest('[data-mk]').dataset.mk; const top0 = card.getBoundingClientRect().top; const y0 = sh.scrollTop; tgt.click(); await W(900);
      const n2 = sh.querySelector(`[data-mk="${CSS.escape(nxt)}"]`); out.bto2 = { T: S.batchT, toSel: !!X(mk).toSel, y0, y1: sh.scrollTop, gone: !sh.querySelector(`[data-mk="${CSS.escape(mk)}"]`), nTop: n2 ? Math.round(n2.getBoundingClientRect().top - top0) : null };
      return out; }, seenOk);
    ok(r3.btn && r3.one === 0, '③ 조건 이미 부합 탭 패널에 「이 목록을 선택 대기로」 · 한 번 누름 = 무장만', r3);
    ok(seenOk.length >= 2 && r3.moved && r3.moved.every(([a, b]) => a && b) && r3.T === 'ok', '③ 두 번 누름 = 살핀 상품이 선택 대기로(목표가 지금 값과 같으면 5% 내린 값) · 탭 그대로', { seen: seenOk.length, moved: r3.moved, T: r3.T });
    ok(r3.bto2 && r3.bto2.T === 'keep' && r3.bto2.toSel && r3.bto2.gone && r3.bto2.y1 > 0 && r3.bto2.nTop != null && Math.abs(r3.bto2.nTop) <= 80, '③ 「그래도 바꾸기 → 선택 대기」 = 탭 그대로 · 맨 위로 안 튐 · 다음 카드가 그 자리에 섬', r3);
    ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 0번', dlg);
  } catch (e) { bad++; console.log('  ❌ 시험 안 오류', e.message); } }, { vp: { width: 1400, height: 900 }, onPage: null });
  console.log(bad ? `❌ tBQSIMP1118 ${bad}개 실패` : '✓ tBQSIMP1118 통과'); process.exit(bad ? 1 : 0);
})();
