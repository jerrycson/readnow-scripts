// tMJREG4_1113 — (11/13 MJ님 · 작업판 MJ 카드) 📥 등록 › 선택 대기 › 🔎 자세히 카드 「등록 정보」
//  ① 줄마다 구분선 · 제목 왼쪽 | 내용 오른쪽(세로선) — 위 두 줄은 두 칸씩(등록 방식·상태 / 수량·판매상태)
//  ② 관리 코드 · 매입처 · 부가 코드는 각각 한 줄 전체(wide)
//  ③ PC 폭(1400)·휴대폰 폭(390) 겹침·가로 스크롤 없음 · 단추 기능 그대로(상태 고르기)
//  ④ (셋째 카드) 미등록 상품 정보도 같은 꼴 — 도서명 / 부제·원제 / 상품 구분 / 분류 / 지은이 / 출판사 / 쪽수·규격 / 출간일·정가 · 입력 그대로 저장
// 실행: cd pw && RN_PORT=<포트> node tMJREG4_1113.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/<div class="rgsec rgreg"><div class="rgsh">등록 정보<\/div>/.test(T), '등록 정보 칸 표시(rgreg)');
ok(/<div class="rgf wide"><label>매입처<\/label>/.test(T) && /<div class="rgf wide"><label>부가 코드<\/label>/.test(T) && /<div class="rgf wide"><label>관리 코드<\/label>/.test(T), '관리 코드·매입처·부가 코드 = 한 줄 전체');
ok(/<div class="regnew rnt">/.test(T) && /<div class="rnr2 rnr2-dp">/.test(T) && /\.rnt \.rnr\{display:grid/.test(T), '미등록 상품 정보 줄 틀(rnt · 출간일·정가 두 칸)');
ok(/\.rgreg \.rgf:not\(\.rgpricef\)\{border-bottom:1px solid/.test(T) && /\.rgreg \.rgf:not\(\.rgpricef\)>label\{border-right:1px solid/.test(T), '줄 구분선 · 제목|내용 세로선');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJREG4_1113 ${bad}개 실패` : '✓ tMJREG4_1113 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const PG = [{ price: 4000, grade: '중', sellerCode: '777', sellerName: '판매자A', ship: 2500 }, { price: 5200, grade: '상', sellerCode: '778', sellerName: '판매자B', ship: 2500 }, { price: 6100, grade: '상', sellerCode: '779', sellerName: '판매자C', ship: 0 }];
  const seed = async (p, view, keepLs) => { p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async ({ PG, view, keepLs }) => { const T0 = Date.parse('2026-11-12T01:00:00Z'); const at = (k) => new Date(T0 + k * 60e3).toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
      const mk = (id, k, o) => ({ stage: 'sel', method: 'one', isbn: '97911000077' + String(k).padStart(2, '0'), grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: at(k), code: 'MJ3CMN', codeManual: true, info: { title: '세 가지 시험 책 ' + id, isbn13: '97911000077' + String(k).padStart(2, '0'), itemId: '77' + k, author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: PG, priceList: 15000, priceSales: 13500, salesPoint: 1200, usedTotal: 3, at: at(k) }, ...o });
      const fbI = (id, k, o) => mk(id, k, { method: 'bulk', alReg: 1, itemId: '78' + k, price: 24000, priceFb: { kind: 'c', price: 24000, why: '시장표·검색 모두 없음 — 정가 12,000원 × 2', at: at(k) }, info: { title: '기본값 시험 책 ' + id, isbn13: '97911000078' + String(k).padStart(2, '0'), itemId: '78' + k, author: '지은이을', publisher: '시험출판', pubDate: '2002-06-03', categories: [{ path: ['국내도서', '과학'] }], page1: [], priceList: 12000, priceSales: 10800, usedTotal: 0, at: at(k), ...(o || {}) } });
      const L = { d1: mk('d1', 1, {}), d2: mk('d2', 2, { descMode: 'quick', descQuick: '사용감 조금 있음' }), d3: mk('d3', 3, { descMode: 'manual', descEdit: '예전 직접 입력 글', desc: '예전 직접 입력 글' }), f1: fbI('f1', 4, { mktChk: { tries: 2, at: at(4) }, availability: '절판', srch: { q: '기본값 시험 책', at: at(4), rows: [] } }) /* (price2) 정가 × 2는 시장 없음 확인 + 검색 시세에도 없음 + 새상품 절판일 때만 */, f2: fbI('f2', 5, null) };
      for (const [id, d] of Object.entries(L)) { await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
      for (const k of [...S.regItems.keys()]) if (!L[k]) S.regItems.delete(k);
      try { REG_MKT_RE.at = new Map(); REG_MKT_RE.tries = new Map(); REG_MKT_RE.busy = false; REG_MKT_RE.at.set('f1', Date.now()); REG_MKT_RE.at.set('f2', Date.now()); } catch (e) {}
      window.pcFirst = async () => new Promise(() => {}); /* 저절로 다시 읽기가 시험을 흔들지 않게 */
      if (S.app && S.app.reg) delete S.app.reg.descBtns; S.regChk = new Set(); if (!keepLs) { localStorage.removeItem('rn-reg-fbopen'); localStorage.removeItem('rn-reg-fbtop'); }
      localStorage.setItem('rn-reg-view', view); localStorage.removeItem('rn-reg-sort'); S._regOpen = new Set(); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister(); }, { PG, view, keepLs });
    await p.waitForTimeout(1800); };
  const shotEl = async (p, sel, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const el = await p.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); await el.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } } catch (e) {} };
  const lay = (p, id) => p.evaluate((id) => { const c = document.querySelector(`#sheet [data-rgcid="${id}"]`); if (!c) return null; const sec = c.querySelector('.rgsec.rgreg'); if (!sec) return { none: 1 }; const form = sec.querySelector('.rgform'); const fr = form.getBoundingClientRect();
    const rows = [...form.querySelectorAll(':scope > .rgf')].map((f) => { const r = f.getBoundingClientRect(); const lb = f.querySelector(':scope > label'); const dv = f.querySelector(':scope > div'); const L = lb.getBoundingClientRect(); const D = dv.getBoundingClientRect(); const cs = getComputedStyle(f); const ls = getComputedStyle(lb);
      return { t: lb.textContent.trim().replace(/\s+/g, ' ').slice(0, 12), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), full: Math.abs(r.width - fr.width) < 3, bb: cs.borderBottomStyle !== 'none' && parseFloat(cs.borderBottomWidth) > 0, br: ls.borderRightStyle !== 'none' && parseFloat(ls.borderRightWidth) > 0, labR: Math.round(L.right), divL: Math.round(D.left), price: f.classList.contains('rgpricef') }; });
    const sheet = document.getElementById('sheet'); return { rows, over: sheet.scrollWidth - sheet.clientWidth, cover: c.scrollWidth - c.clientWidth }; }, id);
  await H(async (p) => {
    p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
    for (const vw of [1400, 390]) { await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 }); await seed(p, 'full');
      console.log(`② 등록 정보 (폭 ${vw})`);
      const L = await lay(p, 'd1'); ok(L && L.rows && L.rows.length >= 7, '등록 정보 줄 보임', L);
      if (!L || !L.rows) continue; const by = (t) => L.rows.find((r) => r.t.startsWith(t));
      const rs = L.rows.filter((r) => !r.price);
      ok(rs.every((r) => r.bb), '줄마다 아래 구분선', rs.filter((r) => !r.bb).map((r) => r.t));
      ok(rs.every((r) => r.br && r.divL >= r.labR), '제목 왼쪽 | 내용 오른쪽(세로선 · 겹침 없음)', rs.filter((r) => !(r.br && r.divL >= r.labR)));
      ok(['관리 코드', '매입처', '부가 코드'].every((t) => by(t) && by(t).full), '관리 코드·매입처·부가 코드 각각 한 줄 전체', ['관리 코드', '매입처', '부가 코드'].map(by));
      const mc = by('매입처'), ac = by('부가 코드'), cc = by('관리 코드'); ok(cc && mc && ac && cc.y < mc.y && mc.y < ac.y, '차례: 관리 코드 → 매입처 → 부가 코드(위에서 아래로)');
      if (vw > 500) { const m = by('등록 방식'), g = by('상태'), q = by('수량'), s = by('판매상태'); ok(m && g && q && s && Math.abs(m.y - g.y) < 3 && Math.abs(q.y - s.y) < 3 && g.x > m.x && s.x > q.x, 'PC: 등록 방식·상태 한 줄 · 수량·판매상태 한 줄(두 칸씩)', [m, g, q, s]); }
      ok(L.over <= 0 && L.cover <= 0, '가로 스크롤 없음', { over: L.over, cover: L.cover });
      await shotEl(p, '#sheet [data-rgcid="d1"] .rgsec.rgreg', `mjreg4_reginfo_${vw}`); }
    console.log('③ 기능 그대로 — 상태 고르기');
    await p.setViewportSize({ width: 1400, height: 900 }); await seed(p, 'full');
    await p.click('#sheet [data-rgcid="d1"] [data-rgg="d1"][data-v="1"]'); await p.waitForTimeout(900);
    ok(await p.evaluate(() => +(S.regItems.get('d1') || {}).grade === 1), '「최상」 누르면 상태가 최상으로');

    console.log('④ 미등록 상품 정보');
    const nlay = () => p.evaluate(() => { const c = document.querySelector('#sheet [data-rgcid="n1"]'); if (!c) return null; const box = c.querySelector('.regnew.rnt'); if (!box) return { none: 1 }; const br = box.getBoundingClientRect(); const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) }; };
      const rows = [...box.querySelectorAll('.rnr:not(.rnfull)')].map((f) => { const lb = f.querySelector(':scope > .rnl'); const dv = f.querySelector(':scope > .rnv'); const cs = getComputedStyle(f); const ls = getComputedStyle(lb); return { t: lb.textContent.trim().replace(/\s+/g, ' ').slice(0, 10), ...R(f), bb: parseFloat(cs.borderBottomWidth) > 0, br: parseFloat(ls.borderRightWidth) > 0, labR: Math.round(lb.getBoundingClientRect().right), divL: Math.round(dv.getBoundingClientRect().left), inside: f.getBoundingClientRect().right <= br.right + 1 }; });
      const sheet = document.getElementById('sheet'); return { rows, seg: !!box.querySelector('.rnfull [data-rgbranch]'), over: sheet.scrollWidth - sheet.clientWidth, cover: c.scrollWidth - c.clientWidth }; });
    const seedN = async () => { await p.evaluate(async () => { const d = { stage: 'sel', method: 'new', branch: 1, grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: new Date().toISOString(), code: 'MJ3CMN', codeManual: true, q: '미등록 시험 책', new: { titleCore: '미등록 시험 책', title: '미등록 시험 책', tPre: [], tSuf: [] } };
      await db.collection('reg_items').doc('n1').set(d); S.regItems.set('n1', { id: 'n1', ...d }); regRerender(); }); await p.waitForTimeout(1500); };
    for (const vw of [1400, 390]) { await p.setViewportSize({ width: vw, height: vw > 500 ? 900 : 844 }); await seed(p, 'full'); await seedN();
      const N = await nlay(); ok(N && N.rows && N.rows.length >= 7, `(폭 ${vw}) 미등록 칸 줄 보임`, N); if (!N || !N.rows) continue;
      const by = (t) => N.rows.find((r) => r.t.startsWith(t));
      ok(N.rows.every((r) => r.bb && r.br && r.divL >= r.labR && r.inside), `(폭 ${vw}) 줄마다 구분선 · 제목|내용 세로선 · 카드 안`, N.rows.filter((r) => !(r.bb && r.br && r.divL >= r.labR && r.inside)));
      ok(N.seg, `(폭 ${vw}) 상품 구분 단추 = 제목 칸 없는 한 줄`);
      const want = ['도서명', '부제', '원제', '분류', '지은이', '출판사', '쪽수', '규격', '출간일', '정가']; ok(want.every((t) => by(t)), `(폭 ${vw}) 칸 모두 있음`, want.filter((t) => !by(t)));
      const ord = ['도서명', '부제', '분류', '지은이', '출판사', '쪽수', '출간일'].map((t) => by(t) && by(t).y); ok(ord.every((y, i) => i === 0 || y > ord[i - 1]), `(폭 ${vw}) 차례 = 그림대로`, ord);
      if (vw > 500) { const pr = [['부제', '원제'], ['쪽수', '규격'], ['출간일', '정가']]; ok(pr.every(([a, b]) => by(a) && by(b) && Math.abs(by(a).y - by(b).y) < 3 && by(b).x > by(a).x), 'PC: 부제·원제 / 쪽수·규격 / 출간일·정가 두 칸씩 한 줄', pr.map(([a, b]) => [by(a), by(b)])); }
      ok(N.over <= 0 && N.cover <= 0, `(폭 ${vw}) 가로 스크롤 없음`, { over: N.over, cover: N.cover });
      await shotEl(p, '#sheet [data-rgcid="n1"] .regnew.rnt', `mjreg5_new_${vw}`); }
    await p.setViewportSize({ width: 1400, height: 900 }); await seed(p, 'full'); await seedN();
    await p.fill('#sheet [data-rgcid="n1"] [data-rgnf="n1"][data-k="pages"]', '321'); await p.press('#sheet [data-rgcid="n1"] [data-rgnf="n1"][data-k="pages"]', 'Tab'); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => +((S.regItems.get('n1') || {}).new || {}).pages === 321), '쪽수 입력이 그대로 저장(기능 그대로)', await p.evaluate(() => (S.regItems.get('n1') || {}).new));
  });
  console.log(bad ? `❌ tMJREG4_1113 ${bad}개 실패` : '✓ tMJREG4_1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
