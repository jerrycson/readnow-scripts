// tMKT1_1112 — (11/12 MJ 등록 담당 '이 책은 시장 지표가 있는데') 📥 등록 › 선택 대기 › 🔎 자세히 카드
//  조회 때 온라인 중고 첫 페이지가 비어 온 상품(알라딘 실제 140개인데 그 순간 빈 화면을 받아 '중고 0개'로 적힘)
//  ① 우리 판매가 칸에 「⏳ 시장 지표 읽는 중 — 판매가 확정 전」 + ↻ 지금 다시 읽기
//  ② ③ 정가 × 2 기본값으로는 → 결정 대기(두 번 누르기)·모두 결정 대기로·확정(regRows)이 막힘 · 판매가를 직접 넣으면(✎ 직접) 넘어감
//  ③ 다시 읽기(pcFirst regLookup)로 첫 페이지가 오면 info를 바꾸고 정가 × 2 값을 지움(결정 대기였으면 선택 대기로)
//  ④ 세 번 읽어도 0줄이면 확인(mktChk)으로 두고 넘김 · 첫 페이지가 빈 24시간 안 조회 기록은 다시 쓰지 않음
// 실행: cd pw && RN_PORT=<포트> node tMKT1_1112.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(/const regMktWait = \(it\) => /.test(T) && /regMktEmpty\(it\.info\) && !it\.info\.mktChk/.test(T), 'regMktWait = 첫 페이지 0줄 + 확인 기록 없음');
ok(/else if \(need\('price'\) && regMktHold\(it, f\)\) out\.push\('⏳ 시장 지표 읽는 중 — 판매가 확정 전'\)/.test(T), '필수 검사(regMissing)에 ⏳ 시장 지표');
ok(/if \(regMktHold\(it, f\)\) \{ hold\+\+; continue; \}/.test(T), '모두 결정 대기로(regToPickL)에서 건너뜀');
ok(/if \(regMktHold\(it, f\)\) \{ bad\.push\(`\$\{nm\(it\)\}: ⏳ 시장 지표 읽는 중/.test(T), '확정(regRows)에서 막음');
ok(/Array\.isArray\(r\.page1\) && r\.page1\.length \/\* \(mkt1\)/.test(T) && /Array\.isArray\(x\.page1\) && x\.page1\.length \/\* \(mkt1\) \*\//.test(T), '첫 페이지가 빈 24시간 조회 기록은 다시 쓰지 않음(묶음·고른 상품 둘 다)');
ok(/setTimeout\(\(\) => \{ try \{ regMktRecheck\(\); \} catch \(e\) \{\} \}, 0\);/.test(T), '등록 화면 열 때 다시 읽기 차례 확인');
ok(/id: 'card-mktwait'/.test(T), '📖 등록 백과 항목');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMKT1_1112 ${bad}개 실패` : '✓ tMKT1_1112 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ listingId: '9001', price: 2000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 3300 }, { listingId: '9002', price: 2400, grade: '상', sellerCode: '778', sellerName: '판매자B', ship: 3100 }, { listingId: '9003', price: 2600, grade: '상', sellerCode: '779', sellerName: '판매자C', ship: 2900 }];
  const seed = async (p, reply) => { p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async ({ PG, reply }) => { const T0 = Date.parse('2026-11-12T05:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
      /* 다시 읽기 길 — pcFirst를 가짜로(부른 횟수·돌려줄 첫 페이지) */ window.__mk1 = { n: 0, reply }; window.pcFirst = async (o) => { window.__mk1.n++; window.__mk1.last = o; await new Promise((r) => setTimeout(r, 120)); const id = (o.payload.itemIds || [])[0]; const rows = window.__mk1.reply === 'full' ? PG : []; return { items: { ['id_' + id]: { itemId: id, isbn13: '9791100009901', title: '시장 시험 책 ' + id, priceList: 12000, priceSales: 10800, categories: [{ path: ['국내도서', '과학'] }], usedTotal: rows.length ? 140 : 0, page1: rows, at: new Date().toISOString() } } }; };
      const mk = (id, k, o) => ({ stage: 'sel', method: 'bulk', alReg: 1, isbn: '97911000099' + String(k).padStart(2, '0'), itemId: '99' + k, grade: 2, qty: 1, ws: regWsCur(), createdAt: at(k), code: 'MKTCMN', codeManual: true, info: { title: '시장 시험 책 ' + id, isbn13: '97911000099' + String(k).padStart(2, '0'), itemId: '99' + k, author: '지은이갑', publisher: '시험출판', pubDate: '2002-06-03', categories: [{ path: ['국내도서', '과학'] }], page1: [], priceList: 12000, priceSales: 10800, usedTotal: 0, at: at(k) }, ...o });
      const L = { m1: mk('m1', 1, {}), m2: mk('m2', 2, { stage: 'pick', price: 24000, priceFb: { kind: 'c', price: 24000, why: '시장표·검색 모두 없음 — 정가 12,000원 × 2', at: at(2) } }), m3: mk('m3', 3, { info: { title: '시장 시험 책 m3', isbn13: '9791100009903', itemId: '993', categories: [{ path: ['국내도서', '과학'] }], page1: PG, priceList: 12000, priceSales: 10800, usedTotal: 3, at: at(3) } }) };
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      for (const k of [...S.regItems.keys()]) if (!L[k]) S.regItems.delete(k);
      REG_MKT_RE.at = new Map(); REG_MKT_RE.tries = new Map(); REG_MKT_RE.busy = false; REG_MKT_RE.at.set('m1', Date.now()); REG_MKT_RE.at.set('m2', Date.now()); /* 처음엔 저절로 다시 읽지 않게(화면 확인 먼저) */
      localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { PG, reply });
    await p.waitForTimeout(1800); };
  const st = (p, id) => p.evaluate((id) => { const it = S.regItems.get(id) || {}; const F = regFinals([it], regCfg()).get(id) || {}; const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); return { stage: it.stage, price: it.price ?? null, fb: it.priceFb ? it.priceFb.kind : null, wait: regMktWait(it), hold: regMktHold(it, F), miss: regMissing(it, F), n1: (it.info.page1 || []).length, chk: it.info.mktChk || null, err: it.info.mktErr || null, card: c ? !!c.querySelector('.rgmktw') : null, cardT: c && c.querySelector('.rgmktw') ? c.querySelector('.rgmktw').textContent.slice(0, 80) : null }; }, id);
  await H(async (p) => { await seed(p, 'full');
    console.log('② 첫 페이지 빈 카드 — ⏳ 표시와 막힘');
    let a = await st(p, 'm1');
    ok(a.wait && a.hold && a.card && /시장 지표 읽는 중/.test(a.cardT || ''), '선택 대기 카드에 ⏳ 시장 지표 읽는 중', a);
    ok(a.miss.includes('⏳ 시장 지표 읽는 중 — 판매가 확정 전'), '필수 칸 목록에 ⏳ 시장 지표', a.miss);
    const c3 = await st(p, 'm3'); ok(!c3.wait && !c3.card && !c3.miss.length, '첫 페이지가 있는 카드는 그대로(막힘 없음)', c3);
    const mv = await p.evaluate(async () => { const r = await regMoveStage('m1', 'pick', regFinals([S.regItems.get('m1')], regCfg()).get('m1')); return { r, st: S.regItems.get('m1').stage }; });
    ok(mv.r === false && mv.st === 'sel', '→ 결정 대기(regMoveStage) 막힘', mv);
    const rr = await p.evaluate(() => { const cfg = regCfg(); const x = regRows(['m2'], cfg); return { bad: x.bad, n: x.rows.length }; });
    ok(rr.n === 0 && rr.bad.some((t) => /시장 지표 읽는 중/.test(t)), '결정 대기에 있던 정가 × 2 상품은 확정(regRows)에서 막힘', rr);
    console.log('③ 판매가를 직접 넣으면 넘어감');
    const man = await p.evaluate(async () => { const it = S.regItems.get('m1'); const t = { ...it, price: 3000, priceManual: true }; return { hold: regMktHold(t, regFinals([t], regCfg()).get('m1')), miss: regMissing(t, { price: 3000, isbn: t.isbn }) }; });
    ok(!man.hold && !man.miss.length, '✎ 직접 3,000원이면 막지 않음', man);
    console.log('④ ↻ 지금 다시 읽기 → 첫 페이지 옴 → 정가 × 2 지움');
    await p.click('#sheet [data-rgcid="m1"] [data-rgmktre]'); await p.waitForTimeout(1200);
    a = await st(p, 'm1'); const n1 = await p.evaluate(() => ({ n: window.__mk1.n, cloud: window.__mk1.last && window.__mk1.last.cloudPath, type: window.__mk1.last && window.__mk1.last.type, ids: window.__mk1.last && window.__mk1.last.payload.itemIds }));
    ok(n1.n === 1 && n1.type === 'regLookup' && n1.cloud === '/lookup' && n1.ids.join() === '991', '다시 읽기 = 기존 등록 조회 길(regLookup → PC 먼저 · 남으면 /lookup) 상품 번호로', n1);
    ok(a.n1 === 3 && a.chk && a.chk.n === 3 && !a.wait && !a.card, '첫 페이지 3줄이 들어오고 ⏳ 사라짐', a);
    await p.evaluate(() => { REG_MKT_RE.at.delete('m2'); regMktRecheck(); }); await p.waitForTimeout(1500);
    const b = await st(p, 'm2');
    ok(b.n1 === 3 && b.price === null && b.fb === null && b.stage === 'sel', '결정 대기에 있던 정가 × 2(24,000원)는 지우고 선택 대기로', b);
  });
  await H(async (p) => { await seed(p, 'empty');
    console.log('⑤ 다시 읽어도 0줄 — 세 번째에 확인으로 둠');
    for (let i = 1; i <= 3; i++) { await p.evaluate(() => { REG_MKT_RE.at.delete('m1'); }); await p.evaluate(() => regMktReread('m1')); await p.waitForTimeout(300); const s = await st(p, 'm1'); console.log('    ' + i + '번째', JSON.stringify({ wait: s.wait, chk: !!s.chk, err: s.err })); if (i === 1) ok(s.wait && !s.chk && /다시 읽어도 첫 페이지 0줄/.test(s.err || ''), '첫 번째: 아직 읽는 중(0줄 · 까닭 남김)', s); }
    const s3 = await st(p, 'm1');
    ok(!s3.wait && s3.chk && s3.chk.tries >= 2 && !s3.miss.length, '0개가 되풀이되면 확인(mktChk)으로 두고 넘김', s3);
    ok(s3.card && /번 읽어도 0개/.test(s3.cardT || ''), '카드에 「n번 읽어도 0개」 남음', s3.cardT);
    console.log('⑥ 첫 페이지가 빈 24시간 조회 기록은 쓰지 않음');
    const fbuse = await p.evaluate(async () => { await db.collection('prd_lookups').add({ key: 'id_992', itemId: '992', title: '빈 기록', categories: [{ path: ['국내도서'] }], page1: [], usedTotal: 0, at: new Date().toISOString() }); const rec = await pptRecent(['id_992']); const x = rec['id_992']; return { got: !!x, use: !!(x && x.title && Array.isArray(x.categories) && Array.isArray(x.page1) && x.page1.length) }; });
    ok(fbuse.got && !fbuse.use, '빈 첫 페이지 기록은 다시 쓰는 조건에 안 맞음', fbuse);
  });
  console.log(bad ? `❌ tMKT1_1112 ${bad}개 실패` : '✓ tMKT1_1112 모두 통과'); process.exit(bad ? 1 : 0);
})();
