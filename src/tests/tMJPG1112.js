// tMJPG1112 — (11/12 MJ 등록 담당) 📥 등록 › 선택 대기 — 조회된 상품 카드 책 정보 줄에 쪽수
//  🔎 자세히 카드 상품명 아래 줄 '… · 지은이 · 출판사 · 출간일 · 248쪽' · 📋 한눈에 줄도 '… · 출판사 · 248쪽' · 쪽수가 없으면 아무것도 안 붙음
//  미등록 카드(직접 입력 쪽수 칸)는 그대로 — 조회한 도서 정보(it.info.pages)만 씀
// 실행: cd pw && RN_PORT=<포트> node tMJPG1112.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/const regPgTxt = \(inf\) =>/.test(T), '쪽수 글 함수 regPgTxt');
ok(/String\(inf\.pubDate\)\.slice\(0, 10\)\) : ''\}\$\{regPgTxt\(inf\)\}<\/span><\/div><\/div><div class="rgacts">/.test(T), '자세히 카드 출간일 뒤에 쪽수');
ok(/\[inf\.author, inf\.publisher\]\.filter\(Boolean\)\.join\(' · '\)\)\}\$\{\(inf\.isbn13 \|\| it\.isbn \|\| N\.isbn \|\| inf\.author \|\| inf\.publisher\) \? regPgTxt\(inf\)/.test(T), '한눈에 줄 출판사 뒤에 쪽수');
ok(/상품명 아래 줄: 상품 구분 · ISBN · 지은이 · 출판사 · 출간일 · 쪽수/.test(T), '설명서 card-title 문구');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJPG1112 ${bad}개 실패` : '✓ tMJPG1112 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }];
  const seed = async (p, view) => { p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async ({ PG, view }) => { const T0 = Date.parse('2026-11-12T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
      const mk = (id, k, inf) => ({ stage: 'sel', method: 'one', isbn: '97911000099' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), code: 'BLKCMN', codeManual: true, info: { title: '쪽수 시험 책 ' + id, isbn13: '97911000099' + String(k).padStart(2, '0'), itemId: '99' + k, author: '지은이갑, 지은이을', publisher: '시험출판', pubDate: '2009-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: PG, priceList: 15000, priceSales: 13500, at: at(k), ...inf } });
      const L = { p1: mk('p1', 1, { pages: 248, size: '188*257mm' }), p0: mk('p0', 2, {}), ps: mk('ps', 3, { pages: '312' }),
        n1: { stage: 'sel', method: 'new', grade: 2, qty: 1, price: 7000, ws: regWsCur(), createdAt: at(4), q: '미등록 쪽수 시험', newInfo: { title: '미등록 쪽수 시험' }, new: { title: '미등록 쪽수 시험', pages: 120 } } };
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-sort'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { PG, view });
    await p.waitForTimeout(1800); };
  const shotEl = async (p, sel, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await el.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } } catch (e) {} };
  await H(async (p) => { await seed(p, 'full');
    console.log('② 🔎 자세히 카드');
    const m = await p.evaluate(() => { const g = (id) => { const c = document.querySelector(`#sheet [data-rgcid="${id}"] .rgmeta .hint`); return c ? c.textContent.trim() : null; }; const n1 = document.querySelector('#sheet [data-rgcid="n1"]'); return { p1: g('p1'), p0: g('p0'), ps: g('ps'), n1: !!n1, n1pg: n1 ? !!n1.querySelector('[data-rgnf="n1"][data-k="pages"]') : null, n1meta: n1 && n1.querySelector('.rgmeta .hint') ? n1.querySelector('.rgmeta .hint').textContent : '' }; });
    ok(m.p1 && /지은이갑, 지은이을 · 시험출판 · 2009-01-01 · 248쪽$/.test(m.p1), '쪽수 있음 → 「… · 2009-01-01 · 248쪽」', m);
    ok(m.p0 && /시험출판 · 2009-01-01$/.test(m.p0) && !/쪽/.test(m.p0), '쪽수 없음 → 아무것도 안 붙음', m);
    ok(m.ps && /2009-01-01 · 312쪽$/.test(m.ps), '쪽수가 글자("312")여도 「312쪽」', m);
    ok(m.n1 && m.n1pg !== false && !/120쪽/.test(m.n1meta), '미등록 카드는 그대로(직접 입력 쪽수 칸 · 책 정보 줄에 붙이지 않음)', m);
    await shotEl(p, '#sheet [data-rgcid="p1"]', 'mjpg1_full_p1');
    await seed(p, 'compact');
    console.log('③ 📋 한눈에 보기');
    const g = await p.evaluate(() => { const t = (id) => { const r = document.querySelector(`.rgrow[data-rgexp="${id}"] .rgr-t > small`); return r ? r.textContent.trim() : null; }; return { p1: t('p1'), p0: t('p0'), n1: t('n1') }; });
    ok(g.p1 && /시험출판 · 248쪽$/.test(g.p1), '한눈에 쪽수 있음 → 「… · 시험출판 · 248쪽」', g);
    ok(g.p0 && /시험출판$/.test(g.p0) && !/쪽/.test(g.p0), '한눈에 쪽수 없음 → 아무것도 안 붙음', g);
    ok(g.n1 == null || !/120쪽/.test(g.n1), '한눈에 미등록 줄은 그대로', g);
    await shotEl(p, '.rgrow[data-rgexp="p1"]', 'mjpg1_glance_p1');
  });
  console.log(bad ? `❌ tMJPG1112 ${bad}개 실패` : '✓ tMJPG1112 모두 통과'); process.exit(bad ? 1 : 0);
})();
