// tPRICE2_1112 — (정범님 11/12 저녁) 📥 등록 추천가 '③ 정가 × 2' 기본값은 땜빵용 — 세 조건이 모두 맞을 때만
//  (1) 시장 지표(온라인 중고 첫 페이지 매물)가 없음(⏳ 다시 읽어 확인 끝) (2) 검색 시세(상품명 검색 — 미등록으로 올라간 같은 책까지)를 읽었는데 매물이 없어 우리만 유일 (3) 새상품 품절·절판
//  하나라도 아니면 판매가를 비우고(제시 가격 없음) 카드에 「💬 판매가 비워 둠 — 까닭」 · 결정 대기로 못 넘어감(필수 막힘) · 모두 결정 대기로도 남김
//  검색 시세를 아직 못 읽은 책(새상품 품절·절판 · 첫 페이지 0줄 확인 뒤)은 그 책만 기존 등록 조회 길(regLookup)로 다시 읽음
//  예전에 넣어 둔 정가 × 2 값이 조건에 안 맞으면 지우고 선택 대기로(직접 정한 ✎ 값은 그대로)
// 실행: cd pw && RN_PORT=<포트> node tPRICE2_1112.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(/function regFbX\(it, cfg\)/.test(T) && /function regFb\(it, cfg\) \{ return regFbX\(it, cfg\)\.fb; \}/.test(T), 'regFbX = 값 + 까닭 · regFb는 값만');
ok(/const REG_FB_SOLD = \/\(\?<!일시\)품절\|절판\/;/.test(T), '③은 새상품 품절·절판일 때만(1.78.521부터 일시품절 뺌 — 정범님 11/12 규칙)');
ok(/out\.set\(it\.id, \{ x, price, fb: fbk, fbNo, base,/.test(T), '등록 줄(regRows 셈)에 까닭 fbNo');
ok(/data-rgfbno=/.test(T) && /💬 판매가 비워 둠/.test(T), '카드에 💬 판매가 비워 둠');
ok(/noP\+\+; continue; \}/.test(T), '모두 결정 대기로 — 판매가 빈 상품은 남김');
ok(/id: 'card-fbno'/.test(T), '📖 등록 백과 항목');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tPRICE2_1112 ${bad}개 실패` : '✓ tPRICE2_1112 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ listingId: '9101', price: 2000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 3300 }];
  const SR0 = { q: '값 시험 책', at: '2026-11-12T05:00:00Z', rows: [] }; /* 검색 시세 읽음 · 같은 책 매물 없음 */
  const SR1 = { q: '값 시험 책', at: '2026-11-12T05:00:00Z', rows: [{ itemId: '5551', title: '값 시험 책', cov: 1, vol: true, channels: { seller: { min: 3500, count: 1 } } }] };
  const errs = []; const oL = console.log; console.log = (...a) => { const s = a.join(' '); if (/^ERRORS:/.test(s) && /TEST |PAGEERR/.test(s)) errs.push(s); oL(...a); };
  await H(async (p) => { p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    console.log('② 세 조건 조합 (regFbX)');
    const R = await p.evaluate(({ PG, SR0, SR1 }) => { const cfg = regCfg(); cfg.fb = { a: true, b: true, c: true, mult: 2, match: 0.9 }; const chk = { at: '2026-11-12T05:10:00Z', n: 0, ut: 0, tries: 2 };
      const mk = (o) => ({ id: 'z', stage: 'sel', method: 'bulk', itemId: '881', grade: 2, info: { title: '값 시험 책', itemId: '881', page1: [], priceList: 12000, usedTotal: 0, mktChk: chk, ...o } });
      const C = { all: mk({ availability: '절판', srch: SR0 }), sold: mk({ availability: '품절', srch: SR0 }), tmp: mk({ availability: '일시품절', srch: SR0 }), onsale: mk({ availability: 'onSale', priceSales: 10800, srch: SR0 }), unknown: mk({ srch: SR0 }), nosrch: mk({ availability: '절판' }), srchErr: mk({ availability: '절판', srch: { q: 'x', rows: [], err: '검색 결과 없음' } }), wait: mk({ availability: '절판', srch: SR0, mktChk: null }), market: mk({ availability: '절판', srch: SR0, page1: PG }), srchHit: mk({ availability: '절판', srch: SR1 }), noList: mk({ availability: '절판', srch: SR0, priceList: null }) };
      const out = {}; for (const [k, it] of Object.entries(C)) { const x = regFbX(it, cfg); out[k] = { kind: x.fb ? x.fb.kind : null, price: x.fb ? x.fb.price : null, no: x.no }; }
      const cfgB = { ...cfg, fb: { ...cfg.fb, b: false } }; const x2 = regFbX(C.srchHit, cfgB); out.srchHitBoff = { kind: x2.fb ? x2.fb.kind : null, no: x2.no };
      const cfgC = { ...cfg, fb: { ...cfg.fb, c: false } }; const x3 = regFbX(C.all, cfgC); out.cOff = { kind: x3.fb ? x3.fb.kind : null, no: x3.no };
      return out; }, { PG, SR0, SR1 });
    ok(R.all.kind === 'c' && R.all.price === 24000 && !R.all.no, '세 조건 모두(시장 없음 확인 · 검색 시세 매물 없음 · 절판) → 정가 × 2 = 24,000원', R.all);
    ok(R.sold.kind === 'c' && !R.tmp.kind && /일시품절」\(품절·절판 아님\)/.test(R.tmp.no || ''), '품절은 ③ · 일시품절은 비움+까닭(1.78.521 정밀 점검 · 곧 다시 들어오는 책)', [R.sold, R.tmp]);
    ok(!R.onsale.kind && /새상품 판매 중이라 정가 × 2 안 씀/.test(R.onsale.no || ''), '새상품 판매 중 → 비움 · 까닭', R.onsale);
    ok(!R.unknown.kind && /새상품 판매 상태를 모름/.test(R.unknown.no || ''), '새상품 상태 모름 → 비움', R.unknown);
    ok(!R.nosrch.kind && /검색 시세 확인 전/.test(R.nosrch.no || ''), '검색 시세 안 읽음 → 비움 · 「검색 시세 확인 전」', R.nosrch);
    ok(!R.srchErr.kind && /검색 시세 확인 전/.test(R.srchErr.no || ''), '검색 시세를 읽다 오류(빈 줄 + err) → 확인 전으로 봄', R.srchErr);
    ok(!R.wait.kind && /시장 지표 읽는 중/.test(R.wait.no || ''), '첫 페이지 0줄 확인 전 → 비움 · 「시장 지표 읽는 중」', R.wait);
    ok(R.market.kind === 'a' && R.market.price === 2000, '시장표 매물이 있으면 ① 시장표 최저가(그대로)', R.market);
    ok(R.srchHit.kind === 'b' && R.srchHit.price === 3500, '검색 시세에 같은 책 매물 → ② 검색 최저가(그대로)', R.srchHit);
    ok(!R.srchHitBoff.kind && /검색 시세에 같은 책 매물 1개/.test(R.srchHitBoff.no || ''), '② 꺼짐 + 검색 매물 있음 → 우리만 유일 아님 → 비움', R.srchHitBoff);
    ok(!R.noList.kind && /정가를 몰라/.test(R.noList.no || ''), '정가 없음 → 비움', R.noList);
    ok(!R.cOff.kind && R.cOff.no === null, '⚙ ③ 꺼짐 → 비움(까닭 없음 — 예전 그대로)', R.cOff);
    console.log('③ 화면 — 카드 까닭 · 결정 대기 막힘 · 모두 결정 대기로 · 예전 정가 × 2 지움 · 검색 시세 자동 읽기');
    await p.evaluate(async ({ SR0 }) => { const T0 = Date.parse('2026-11-12T05:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true; const chk = { at: at(0), n: 0, ut: 0, tries: 2 };
      window.__p2 = { n: 0 }; window.pcFirst = async (o) => { window.__p2.n++; window.__p2.last = o; await new Promise((r) => setTimeout(r, 100)); const id = (o.payload.itemIds || [])[0]; return { items: { ['id_' + id]: { itemId: id, title: '값 시험 책 ' + id, categories: [{ path: ['국내도서', '과학'] }], page1: [], usedTotal: 0, priceList: 12000, availability: '절판', srch: { q: '값 시험 책', at: at(9), rows: [] } } } }; };
      const mk = (id, k, o, io) => ({ stage: 'sel', method: 'bulk', alReg: 1, isbn: '97911000088' + String(k).padStart(2, '0'), itemId: '88' + k, grade: 2, qty: 1, ws: regWsCur(), createdAt: at(k), code: 'MKTCMN', codeManual: true, ...o, info: { title: '값 시험 책 ' + id, isbn13: '97911000088' + String(k).padStart(2, '0'), itemId: '88' + k, author: '지은이병', publisher: '시험출판', pubDate: '2002-06-03', categories: [{ path: ['국내도서', '과학'] }], page1: [], priceList: 12000, usedTotal: 0, mktChk: chk, at: at(k), ...io } });
      const L = { p1: mk('p1', 1, {}, { availability: 'onSale', priceSales: 10800, srch: SR0 }), p2: mk('p2', 2, {}, { availability: '절판', srch: SR0 }), p3: mk('p3', 3, { stage: 'pick', price: 24000, priceFb: { kind: 'c', price: 24000, why: '예전 정가 × 2', at: at(3) } }, { availability: 'onSale', priceSales: 10800, srch: SR0 }), p4: mk('p4', 4, { stage: 'pick', price: 24000, priceManual: true }, { availability: 'onSale', priceSales: 10800, srch: SR0 }), p5: mk('p5', 5, {}, { availability: '절판' }) };
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      for (const k of [...S.regItems.keys()]) if (!L[k]) S.regItems.delete(k);
      REG_MKT_RE.at = new Map(); REG_MKT_RE.tries = new Map(); REG_MKT_RE.st = new Map(); REG_MKT_RE.busy = false; REG_MKT_RE.at.set('p5', Date.now()); /* p5는 처음엔 저절로 읽지 않게(화면 먼저) */
      localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { SR0 });
    await p.waitForTimeout(2000);
    const st = (id) => p.evaluate((id) => { const it = S.regItems.get(id) || {}; const F = regFinals([it], regCfg()).get(id) || {}; const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); const nb = c && c.querySelector('[data-rgfbno]'); return { stage: it.stage, price: it.price ?? null, fprice: F.price ?? null, fb: F.fb ? F.fb.kind : null, no: F.fbNo || null, miss: regMissing(it, F), nbT: nb ? nb.textContent : null, btn: !!(nb && nb.querySelector('[data-rgmktre]')), srch: !!((it.info || {}).srch) }; }, id);
    let a = await st('p1');
    ok(a.fprice === null && !a.fb && /새상품 판매 중이라 정가 × 2 안 씀/.test(a.nbT || ''), '새상품 판매 중 카드 — 판매가 비움 · 💬 까닭 한 줄', a);
    ok(a.miss.includes('판매가'), '판매가 빈칸은 필수 막힘', a.miss);
    const mv = await p.evaluate(async () => { const r = await regMoveStage('p1', 'pick', regFinals([S.regItems.get('p1')], regCfg()).get('p1')); return { r, st: S.regItems.get('p1').stage }; });
    ok(mv.r === false && mv.st === 'sel', '→ 결정 대기(regMoveStage) 막힘', mv);
    const b = await st('p2'); ok(b.fprice === 24000 && b.fb === 'c' && !b.nbT && !b.miss.length, '세 조건 맞는 카드 — 🟥 정가 × 2 = 24,000원(그대로 넘어갈 수 있음)', b);
    const c3 = await st('p3'); ok(c3.stage === 'sel' && c3.price === null && c3.fprice === null, '예전에 넣어 둔 정가 × 2(새상품 판매 중)는 지우고 선택 대기로', c3);
    const c4 = await st('p4'); ok(c4.stage === 'pick' && c4.price === 24000, '직접 정한 24,000원(✎ 직접)은 그대로', c4);
    const e5 = await st('p5'); ok(e5.fprice === null && /검색 시세 확인 전/.test(e5.nbT || '') && e5.btn, '검색 시세 안 읽은 절판 책 — 비움 · 「검색 시세 확인 전」 · ↻ 검색 시세 읽기', e5);
    console.log('④ 모두 결정 대기로 — 빈 판매가는 남김');
    await p.evaluate(() => { S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(600); await p.click('#sheet #rg_allpick'); await p.waitForTimeout(1500);
    const all = await p.evaluate(() => ({ s1: S.regItems.get('p1').stage, s2: S.regItems.get('p2').stage, s3: S.regItems.get('p3').stage, s5: S.regItems.get('p5').stage, t: [...document.querySelectorAll('.toast,#toast,[class*=toast]')].map((x) => x.textContent).join(' | ').slice(0, 400) }));
    ok(all.s1 === 'sel' && all.s3 === 'sel' && all.s5 === 'sel' && all.s2 === 'pick', '「모두 결정 대기로」 — 판매가 빈 p1·p3·p5는 선택 대기에 남고 p2(정가 × 2 조건 맞음)만 옮김', all);
    await p.evaluate(() => { S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(500);
    console.log('⑤ 검색 시세 자동 읽기 — 그 책만(기존 등록 조회 길)');
    await p.evaluate(() => { REG_MKT_RE.at.delete('p5'); regMktRecheck(); }); await p.waitForTimeout(1500);
    const n5 = await p.evaluate(() => ({ n: window.__p2.n, type: window.__p2.last && window.__p2.last.type, ids: window.__p2.last && window.__p2.last.payload.itemIds }));
    ok(n5.n === 1 && n5.type === 'regLookup' && (n5.ids || []).join() === '885', 'regLookup으로 p5만 다시 읽음', n5);
    const f5 = await st('p5'); ok(f5.srch && f5.fb === 'c' && f5.fprice === 24000 && !f5.nbT, '검색 시세가 들어와 매물 없음 확인 → 그때 정가 × 2', f5);
    const k5 = await p.evaluate(() => { const it = S.regItems.get('p5'); return { chk: !!(it.info && it.info.mktChk), wait: regMktWait(it) }; }); ok(k5.chk && !k5.wait, '이미 한 시장 지표 확인(0줄)은 그대로 — ⏳로 돌아가지 않음', k5);
  });
  if (errs.length) { bad++; console.log('  ❌ 화면 오류', errs.join(' ').slice(0, 600)); }
  console.log(bad ? `❌ tPRICE2_1112 ${bad}개 실패` : '✓ tPRICE2_1112 모두 통과'); process.exit(bad ? 1 : 0);
})();
