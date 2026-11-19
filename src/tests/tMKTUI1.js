// tMKTUI1 — 정범님 11/19 23:20 (I-1119-2320) 시장 지표 「결정 가격」 줄 = 카드 추천가와 같은 쌍둥이 블록 + I-1119-2325-42 (수동 일괄 카드 상태·희귀본 판정 낱말 두드러지게)
//  ① 쌍둥이: 가격(카드 추천가처럼 빨강/초록) + 배경 아이콘 % · 「◀ 결정 가격」(등록은 「◀ 등록 가격」) · 남색 테두리 · 위아래로 움직이면 그 자리 값으로 바뀜
//  ② 수동 일괄 카드: 새책 품절/절판/판매 중 · 상태(상품 등급) · 판매 상태 큰 띠 · 시장 지표 갱신 단추 작게 · 보유 재고 상자 한 줄
//  ③ 「희귀본 후보」「희귀본 아님」 판정 낱말만 띠 — 뒤 설명 글은 글자·크기·색 그대로(다른 화면 글과 같은 틀)
//  ④ 📦 오늘 출고 카드에서도 Alt+Shift+U = 그 카드 「📊 시장 지표 갱신」(클라우드 다시 읽기) 단추
//  시험 자료에 손님 정보 없음 · 운영 자료 쓰지 않음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const W = (p, ms) => p.waitForTimeout(ms);
const NAVY = 'rgb(13, 27, 76)'; const GREEN = 'rgb(31, 111, 74)'; const RED = 'rgb(176, 50, 42)';
const P1 = [{ r: 1, n: '판매자A', sc: '1', g: '상', p: 4000, s: 2500, lid: 'Q1', c: 'green' }, { r: 2, n: '판매자B', sc: '2', g: '최상', p: 5200, s: 2500, lid: 'Q2', c: 'green' }, { r: 3, n: '판매자C', sc: '3', g: '상', p: 7000, s: 2500, lid: 'Q3', c: 'green' }, { r: 4, n: '판매자D', sc: '4', g: '중', p: 8000, s: 2500, lid: 'Q4', c: 'green' }, { r: 5, n: '판매자E', sc: '5', g: '상', p: 9500, s: 2500, lid: 'Q5', c: 'green' }, { r: 6, n: '판매자F', sc: '6', g: '상', p: 11000, s: 2500, lid: 'Q6', c: 'green' }];
const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '0', sellerName: '알라딘', ship: 0 }, { price: 7000, grade: '상', sellerCode: '778', sellerName: '판매자B', ship: 2500 }, { price: 9900, grade: '최상', sellerCode: '779', sellerName: '판매자C', ship: 2500 }];
const twinOf = (p, sel) => p.evaluate((sel) => { const r = document.querySelector(sel); if (!r) return null; const v = r.querySelector('.mtwv'); const pb = r.querySelector('.mtwp'); const pc = r.querySelector('.mtwpc'); const cs = getComputedStyle(r);
  return { val: pb ? pb.textContent.trim() : null, pcT: pc ? pc.textContent.trim() : null, pcCls: pc ? pc.className : null, pCol: pb ? getComputedStyle(pb).color : null, pFs: pb ? parseFloat(getComputedStyle(pb).fontSize) : 0, lab: (r.querySelector('.mtwl') || {}).textContent || '', oc: cs.outlineColor, ow: parseFloat(cs.outlineWidth) || 0, bc: cs.borderTopColor, bw: parseFloat(cs.borderTopWidth) || 0, row: v ? getComputedStyle(v).flexDirection : null, oneLine: pb && pc ? Math.abs(pb.getBoundingClientRect().top + pb.getBoundingClientRect().height / 2 - (pc.getBoundingClientRect().top + pc.getBoundingClientRect().height / 2)) < 6 : null, h: r.getBoundingClientRect().height, rowIdx: [...r.parentElement.children].filter((x) => x.classList.contains('pblk')).indexOf(r) }; }, sel);
const navy = (t) => (t.ow > 0 && t.oc === NAVY) || (t.bw > 0 && t.bc === NAVY);

H(async (p) => {
  await p.evaluate(require('./seed.js')); await W(p, 500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
  console.log('① 수동 일괄 — 쌍둥이 줄 · 카드 큰 띠 · 희귀본 판정 낱말');
  await p.evaluate(async (P1) => { const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 };
    S.batchRes = [...S.plist.values()].filter((l) => l.active).slice(0, 3).map((l, i) => ({ l, target: [6900, 9000, 5100][i % 3], reasons: ['시험'], page1: P1, at: '2026-11-19' }));
    S.pmetrics = S.pmetrics || new Map(); S.batchRes.forEach((x, i) => { x.l.price = [5000, 5700, 6000][i]; if (!x.l.bookId) x.l.bookId = 'BKT' + i; x.l.priceList = 10000; S.pmetrics.set(x.l.bookId, { ...(S.pmetrics.get(x.l.bookId) || {}), availability: ['품절', '절판', 'onSale'][i], usedTotal: [3, 40, 12][i], priceList: 10000 }); x.l.status = i === 1 ? '일시판매중지' : '판매중'; });
    S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {};
    drawBatchRes(sh, { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }, 'g1'); sh.scrollTop = 0; await new Promise((r) => setTimeout(r, 900)); }, P1);
  await p.waitForSelector('#b_res .card.pq.bq[data-mk] .pblk.mark.mtw', { timeout: 8000 }).catch(() => {});
  const c0 = '#b_res .card.pq.bq[data-mk]:nth-of-type(1)';
  const cards = await p.evaluate(() => [...document.querySelectorAll('#b_res .card.pq.bq[data-mk]')].slice(0, 3).map((c) => ({ mk: c.dataset.mk, twin: !!c.querySelector('.pblk.mark.mtw'), big: [...c.querySelectorAll('.bqbig')].map((b) => ({ t: b.textContent.trim(), cls: b.className, fs: parseFloat(getComputedStyle(b).fontSize), fw: +getComputedStyle(b).fontWeight, bg: getComputedStyle(b).backgroundColor, col: getComputedStyle(b).color })), rjw: [...c.querySelectorAll('.rjw')].map((b) => ({ t: b.textContent.trim(), k: b.dataset.rjw, bg: getComputedStyle(b).backgroundColor })), tgt: (() => { const e = c.querySelector('.pq-tgt, .bqtg, [data-btgt]'); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; })() })));
  ok(cards.length === 3 && cards.every((c) => c.twin), '수동 일괄 카드 셋 모두 시장 지표에 쌍둥이 「결정 가격」 줄(.pblk.mark.mtw)', cards.map((c) => c.twin));
  const ids = cards.map((c) => c.mk);
  const T0 = await twinOf(p, `#b_res [data-mk="${ids[0]}"] .pblk.mark.mtw`);
  ok(T0 && T0.val === '6,900원' && T0.pcT === '+38.0%' && /\bup\b/.test(T0.pcCls), '쌍둥이 = 결정 가격 6,900원 + 배경 아이콘 % +38.0%(지금 판매가 5,000원 대비 — 카드 추천가 옆 %와 같은 셈)', T0);
  ok(T0 && T0.pCol === GREEN, '올리는 가격은 카드 추천가와 같은 초록(#1F6F4A)', T0 && T0.pCol);
  ok(T0 && T0.row === 'row' && T0.oneLine, '가격과 % 아이콘이 한 줄에 나란히(아래로 떨어지지 않음)', T0);
  ok(T0 && /^◀\s*결정 가격$/.test(T0.lab.trim()), '오른쪽 문구 「◀ 결정 가격」 — 화살표가 왼쪽(추천가 쪽)을 향함', T0 && T0.lab);
  ok(T0 && navy(T0), '쌍둥이 줄 테두리 = 우리 블록 남색 #0d1b4c', T0 && [T0.oc, T0.ow, T0.bc, T0.bw]);
  const other = await p.evaluate((mk) => { const r = document.querySelector(`#b_res [data-mk="${mk}"] .pblk:not(.mark):not(.head)`); return r ? r.getBoundingClientRect().height : 0; }, ids[0]);
  ok(T0 && T0.h > other + 4, '쌍둥이 줄이 다른 매물 줄보다 위아래로 넓음(숨 쉴 공간)', { twin: T0 && T0.h, other });
  // 값을 낮추면(입력칸) 줄이 위로 옮겨 가며 그 값·%·빨강으로 바뀜
  await p.evaluate((mk) => { const c = document.querySelector(`#b_res [data-mk="${mk}"]`); const i = c.querySelector('[data-bpin]'); i.value = '4500'; i.dispatchEvent(new Event('input', { bubbles: true })); }, ids[0]); await W(p, 300);
  const T1 = await twinOf(p, `#b_res [data-mk="${ids[0]}"] .pblk.mark.mtw`);
  ok(T1 && T1.val === '4,500원' && T1.pcT === '−10.0%' && T1.pCol === RED && T1.rowIdx < T0.rowIdx, '가격을 4,500원으로 → 줄이 위로 옮겨 가고 값 4,500원 · −10.0% · 빨강(카드 추천가와 같은 색)', { T0: T0 && T0.rowIdx, T1 });
  await p.evaluate((mk) => { const c = document.querySelector(`#b_res [data-mk="${mk}"]`); const i = c.querySelector('[data-bpin]'); i.value = '6900'; i.dispatchEvent(new Event('input', { bubbles: true })); }, ids[0]); await W(p, 300);
  // 큰 띠 — 새책 품절/절판/판매 중 · 상태 · 판매 상태
  const big = (i) => cards[i].big.map((b) => b.t).join(' | ');
  ok(/품절/.test(big(0)) && /절판/.test(big(1)) && /판매\s?중/.test(big(2)), '카드 맨 앞 큰 띠: 새책 품절 · 절판 · 판매 중', [big(0), big(1), big(2)]);
  ok(cards.every((c) => c.big.length && c.big.every((b) => b.fs >= 13.5 && b.fw >= 800 && b.col === 'rgb(255, 255, 255)')), '큰 띠는 14px 굵게(900) 흰 글자 + 색 바탕 — 작은 칩보다 훨씬 두드러짐', cards.map((c) => c.big));
  ok(cards[0].big.some((b) => /oop|on|tmp|old|rsv|etc/.test(b.cls) && b.bg === RED) && cards[2].big.some((b) => /판매\s?중/.test(b.t) && b.bg === GREEN), '품절·절판 = 빨강 바탕 · 판매 중 = 초록 바탕', cards.map((c) => c.big.map((b) => b.t + ':' + b.bg)));
  ok(cards.every((c) => c.big.some((b) => /^상태 /.test(b.t) && /\bgr\b|g최상|g상|g중/.test(b.cls))), '① 상품 상태(등급)도 같은 무게의 큰 띠 「상태 …」(품절/절판 띠와 같은 크기·굵기)', cards.map((c) => c.big.map((b) => b.t)));
  ok(cards[1].big.some((b) => /일시판매중지/.test(b.t)) && !cards[0].big.some((b) => /^판매중$/.test(b.t)), '① 판매 상태가 판매중이 아니면(일시판매중지) 같은 큰 띠 · 평소 판매중은 띠 없음', cards.map((c) => c.big.map((b) => b.t)));
  // 단추·재고 상자
  const ui = await p.evaluate((mk) => { const c = document.querySelector(`#b_res [data-mk="${mk}"]`); const m = c.querySelector('[data-bqmet]'); const s = c.querySelector('.stkb'); const lh = s ? parseFloat(getComputedStyle(s).lineHeight) || 18 : 0; return { met: m ? { fs: parseFloat(getComputedStyle(m).fontSize), h: m.getBoundingClientRect().height } : null, stk: s ? { h: s.getBoundingClientRect().height, w: s.getBoundingClientRect().width, lh } : null }; }, ids[0]);
  ok(ui.met && ui.met.fs <= 11 && ui.met.h <= 22, '「📈 시장 지표 갱신」 단추 작게(글자 ≤11px · 높이 ≤22px)', ui.met);
  ok(ui.stk && ui.stk.h <= 26 && ui.stk.w > ui.stk.h * 3, '보유 재고 상자 = 한 줄로 길게(높이 ≤26px · 폭이 높이의 3배 넘음)', ui.stk);
  // 희귀본 판정 낱말 — 수동 일괄만 띠 · 설명 글은 다른 화면과 글자 하나까지 같음
  ok(cards[0].rjw.length === 1 && cards[0].rjw[0].k === 'cand' && /희귀본 후보/.test(cards[0].rjw[0].t), '② 품절 + 중고 3개 = 「💎 희귀본 후보」 판정 낱말이 띠(.rjw.cand)로', cards[0].rjw);
  ok(cards[1].rjw.length === 1 && cards[1].rjw[0].k === 'no' && cards[1].rjw[0].t === '희귀본 아님', '② 절판 + 중고 40개 = 「희귀본 아님」 판정 낱말이 띠(.rjw.no)로', cards[1].rjw);
  ok(cards.every((c) => c.rjw.every((r) => r.bg !== 'rgba(0, 0, 0, 0)')), '② 판정 낱말 띠는 바탕색이 있음(두드러짐)', cards.map((c) => c.rjw));
  const same = await p.evaluate(() => { const strip = (h) => h.replace(/<(b|span)[^>]*title="[^"]*">(💎 희귀본 확인|💎 희귀본 후보|희귀본 아님)<\/(b|span)>/g, '§').replace(/<a href="#" data-rinfo-off="[a-z]+" title="[^"]*"/g, '<a OFF'); /* ✕ 끄기 단추의 화면 이름만 다름 */ const O = [{ avail: '품절', used: 3, list: 10000, price: 5000, isbn: '9791100000001' }, { avail: '절판', used: 40, list: 10000, price: 5700, isbn: '9791100000002' }, { avail: '절판', used: 1, list: 30000, price: 25000, isbn: '9791100000003' }];
    return O.map((o) => { const a = rinfoHtml(o, 'batch'); const b = rinfoHtml(o, 'px'); return { eq: !!a && strip(a) === strip(b), hasJ: /§/.test(strip(a)), rjwB: /class="rjw/.test(a), rjwX: /class="rjw/.test(b), a: a.slice(0, 160), b: b.slice(0, 160) }; }); });
  ok(same.every((s) => s.eq && s.hasJ), '② 판정 낱말을 뺀 나머지(설명 글) 틀이 다른 화면(상품 상세)과 글자 하나까지 같음 — 설명은 바꾸지 않음', same);
  ok(same.every((s) => s.rjwB && !s.rjwX), '② 띠는 수동 일괄(batch)에만 · 다른 화면은 예전 그대로', same.map((s) => [s.rjwB, s.rjwX]));
  const desc = await p.evaluate((mk) => { const j = document.querySelector(`#b_res [data-mk="${mk}"] .rjw`); if (!j) return null; const box = j.parentElement; const cs = getComputedStyle(box); const n = j.nextSibling; return { boxFs: cs.fontSize, boxCol: cs.color, next: n && n.nodeType === 3 ? n.textContent.slice(0, 20) : n && n.textContent ? n.textContent.slice(0, 20) : null, nextIsText: !!n && n.nodeType === 3 }; }, ids[0]);
  ok(desc && desc.nextIsText && /^\s*—/.test(desc.next), '② 판정 낱말 바로 뒤 설명 글은 감싸지 않은 글 그대로(띠 밖 · 글자·크기·색은 바깥 줄 그대로)', desc);

  console.log('② 등록 — 쌍둥이 「◀ 등록 가격」 · 남색 · 끄는 동안 그 자리 값');
  await p.evaluate(async (PG) => { S.regItems = S.regItems || new Map(); S.uinfo = S.uinfo || new Map(); window.ask = async () => true; window.__regSetPrice = () => {};
    const d = { stage: 'sel', isbn: '9791100007701', grade: 2, qty: 1, price: 6500, ws: regWsCur(), createdAt: new Date().toISOString(), code: 'BLKCMN', codeManual: true, info: { title: '시험 등록 책', isbn13: '9791100007701', itemId: '7701', categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: PG, priceList: 15000, priceSales: 13500, usedTotal: 4 } };
    await db.collection('reg_items').doc('rT1').set(d); S.regItems.set('rT1', { id: 'rT1', ...d });
    localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(['rT1']); S.regT = 'sel'; S.regSub = { sel: 'one', pick: 'one' }; S.detail = null; openRegister(); }, PG);
  await W(p, 1800);
  const R0 = await twinOf(p, '[data-rgblk] .pblk.mark.mtw');
  ok(R0 && R0.val === '6,500원' && /^◀\s*등록 가격$/.test(R0.lab.trim()), '등록 시장 지표에도 쌍둥이 줄 · 문구 「◀ 등록 가격」', R0);
  ok(R0 && navy(R0), '등록 쌍둥이 줄 테두리도 남색', R0 && [R0.oc, R0.ow, R0.bc, R0.bw]);
  ok(R0 && (R0.pcT == null || /%$/.test(R0.pcT)), '등록 % = 엔진 추천가 대비(추천가가 없으면 % 칸 없음)', R0 && R0.pcT);
  const lv = await p.$('[data-rgblk] .pblk.mark.mtw .mklever');
  if (!lv) ok(false, '등록 쌍둥이 줄에 끄는 손잡이(⠿)'); else { await lv.scrollIntoViewIfNeeded(); await W(p, 200);
    const b = await lv.boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await W(p, 60);
    for (let k = 1; k <= 8; k++) { await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2 - k * 12); await W(p, 30); }
    const mid = await twinOf(p, '[data-rgblk] .pblk.mark.mtw');
    ok(mid && mid.val && mid.val !== R0.val && /원$/.test(mid.val), '손잡이로 위로 끄는 동안 쌍둥이 값이 그 자리의 가격으로 바뀜', { before: R0 && R0.val, during: mid && mid.val });
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await W(p, 60); await p.mouse.up(); await W(p, 400); }

  console.log('③ 📦 오늘 출고 — Alt+Shift+U = 그 카드 「📊 시장 지표 갱신」');
  const ship = await p.evaluate(async () => { const sh = document.getElementById('sheet'); sh.classList.add('on'); S.detail = { ship: 1 }; window.__mkre = [];
    sh.innerHTML = '<div class="shp-blk2" style="height:120px"><button data-mkre="o1">📊 시장 지표 갱신</button></div><div class="shp-blk2" style="height:120px"><button data-mkre="o2">📊 시장 지표 갱신</button></div>';
    window.shipMkOne = (a) => window.__mkre.push(a.dataset.mkre); /* 진짜 단추 처리(문서 click 잡이 → shipMkOne)만 바꿔 끼움 — shp_cmds 안 씀 */
    const r = sh.querySelectorAll('.shp-blk2')[1].getBoundingClientRect(); KBC.mx = r.left + 10; KBC.my = r.top + 10; if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return { on: kbaShipOn(), tbl: (KBA_SCR.ship || {}).acts }; });
  ok(ship.on === 'ship' && ship.tbl && ship.tbl.some((a) => a[0] === 'ref' && a[2] === 'Alt+Shift+KeyU'), '출고 화면 단축키 표에 「시장 지표 갱신 Alt+Shift+U」', ship);
  await p.keyboard.press('Alt+Shift+KeyU'); await W(p, 300);
  const clicked = await p.evaluate(() => window.__mkre);
  ok(clicked.length === 1 && clicked[0] === 'o2', 'Alt+Shift+U = 마우스가 올라간 출고 카드의 「📊 시장 지표 갱신」 단추 한 번', clicked);
  await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.innerHTML = ''; sh.classList.remove('on'); S.detail = null; });

  console.log('④ 설정 — 켜고 끄기·글자 크기');
  const st = await p.evaluate(() => ({ on: typeof mkTwinOn === 'function', px: typeof mkTwinPx === 'function' ? mkTwinPx() : null, src: /st_mktwin/.test(document.documentElement.innerHTML) || /st_mktwin/.test(String(window.drawSettings || '')) }));
  ok(st.on && st.px >= 11 && st.px <= 24, '⚙ 설정 「결정 가격 쌍둥이 블록」 켜고 끄기(mkTwinOn) · 글자 크기(기본 16px · 11~24)', st);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); if (bad) process.exitCode = 1;
});
