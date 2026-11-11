// tREGPLAT1111 — (11/11 정범님) 📥 등록 🚦 등록할 곳 토글: 🟥 알라딘 등록 · 🟦 예스24 등록 켜짐/꺼짐
//  ① 처음 기본 = 알라딘 켬 · 예스24 끔 · 이 기기에만 기억(localStorage rn-regplat-*) — 서버 설정에 안 씀
//  ② 맨 위 작업대 줄(고정)과 👁 살핀 상품 패널(💰 매입가 구획과 따로)에 두 토글
//  ③ 토글 → 지금 작업대 카드의 개별 단추가 모두 따라감(개별로 바꾼 상품도) · 다른 작업대는 그대로
//  ④ 새로 넣는 상품은 토글 값을 가짐 · ⑤ 꺼진 플랫폼은 안 보냄(대량 확정 줄·창 없이 자동·채워서 열기·예스24 자동 올림 후보) · 이미 예스24에 올라간 것은 안 건드림
// 실행: cd pw && RN_PORT=<포트> node tREGPLAT1111.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html'), path.resolve(__dirname, '..', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
{ const i = T.indexOf('◆regplat 시작'); const j = T.indexOf('/* ◆regplat 끝 */'); const blk = i > 0 && j > i ? T.slice(i, j) : '';
  ok(blk && /const REGPLAT_DEF = \{ al: 1, y24: 0 \}/.test(blk) && /'rn-regplat-' \+ k/.test(blk), '처음 기본 알라딘 켬 · 예스24 끔 · 기기 열쇠 rn-regplat-');
  ok(blk && !/\balert\(|\bconfirm\(|\bprompt\(/.test(blk) && !/01[016789]-?\d{3,4}-?\d{4}/.test(blk) && !/app_settings/.test(blk), '새 덩어리에 브라우저 창·전화 번호 꼴·서버 설정 쓰기 없음');
  ok(/\$\{tools\}\$\{regPlatBar\(\)\}/.test(T) && /actions: A, buyp: true, plat: true/.test(T), '작업대 줄 · 살핀 상품 패널에 토글');
  ok(/const regAutoWhyNot = \(it\) => \{ if \(!regAlOn\(it\)\)/.test(T) && /if \(!regAlOn\(it\)\) \{ bad\.push/.test(T) && /if \(!regAlOn\(it\)\) return toast\('🟥 알라딘 등록이 꺼진 상품/.test(T), '알라딘으로 보내는 길(대량 줄·창 없이 자동·채워서 열기)이 모두 토글 값을 봄');
  ok(/doc\.alReg = regPlatOn\('al'\) \? 1 : 0; doc\.y24Reg = regPlatOn\('y24'\) \? 1 : 0;/.test(T), '새로 넣는 상품에 이 기기 토글 값'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tREGPLAT1111 ${bad}개 실패` : '✓ tREGPLAT1111 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('② 화면');
  let reached = false;
  await require(path.join(process.cwd(), 'harness.js'))(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require(path.join(process.cwd(), 'seed.js'))); await p.waitForTimeout(500);
    await p.evaluate(() => { ['al', 'y24'].forEach((k) => localStorage.removeItem('rn-regplat-' + k)); localStorage.setItem('rn-reg-ws', 'main'); localStorage.setItem('rn-reg-view', 'full'); S.tab = 'home'; renderTabs(); renderMainNow(); openRegister(); });
    await p.waitForTimeout(1500);
    await p.evaluate(async () => { await regSaveCfg({ wsList: [{ id: 'main', name: '작업대 1' }, { id: 'wsA', name: '작업대 A' }], wsGone: [] }); const t0 = new Date().toISOString();
      const mk = async (id, ws, st, ex) => { const d = { stage: st, grade: 2, qty: 1, price: 5000, ws, createdAt: t0, info: { title: '등록할 곳 시험 책 ' + id, isbn13: '97911000' + String(10000 + Math.abs([...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 90000).padStart(5, '0'), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t0 }, ...(ex || {}) }; await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); };
      for (let i = 0; i < 3; i++) await mk('p' + i, 'main', 'sel'); await mk('k0', 'main', 'pick'); await mk('k1', 'main', 'pick', { alReg: 0 }); await mk('x0', 'wsA', 'sel');
      S.regT = 'sel'; regRerender(); });
    await p.waitForTimeout(1300);
    const A = (sel) => p.evaluate((sel) => { const b = document.querySelector(sel); return b ? { on: b.classList.contains('on'), t: b.textContent } : null; }, sel);
    // ① 기본값 · ② 자리
    const d0 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const ws = sh.querySelector(':scope > .rgws'); const sp = document.getElementById('seenp'); return { al: regPlatOn('al'), y24: regPlatOn('y24'), barAl: !!(ws && ws.querySelector('[data-regplat="al"].on')), barY: !!(ws && ws.querySelector('[data-regplat="y24"]')) && !ws.querySelector('[data-regplat="y24"].on'), sp: !!(sp && sp.querySelector('.seenp-plat [data-regplat="al"]') && sp.querySelector('.seenp-plat [data-regplat="y24"]')), spSep: !!(sp && sp.querySelector('.seenp-plat') && !sp.querySelector('.seenp-plat').closest('.seenp-buyp') && !(sp.querySelector('.seenp-buyp') || document.createElement('i')).querySelector('[data-regplat]')), chipP0: !!sh.querySelector('[data-rgalreg="p0"].on'), chipK1off: /data-rgalreg="k1"/.test(regAlChip(S.regItems.get('k1'))) && !/ on"/.test(regAlChip(S.regItems.get('k1'))), y24P0off: !!sh.querySelector('[data-y24w="p0"]') && !sh.querySelector('[data-y24w="p0"].on'), sticky: getComputedStyle(ws).position }; });
    ok(d0.al && !d0.y24, '① 처음 기본 = 🟥 알라딘 켬 · 🟦 예스24 끔', d0);
    ok(d0.barAl && d0.barY && d0.sticky === 'sticky', '② 맨 위 작업대 줄(고정)에 🟥 알라딘 등록 켜짐 · 🟦 예스24 등록 꺼짐', d0);
    ok(d0.sp && d0.spSep, '② 👁 살핀 상품 패널에 🚦 등록할 곳 구획(💰 매입가 구획과 따로)', d0);
    ok(d0.chipP0 && d0.chipK1off && d0.y24P0off, '카드 개별 단추 — 기본 켬(🟥) · 개별로 끈 상품은 꺼짐 · 🟦는 기본 끔', d0);
    // ③ 🟥 끄기 → 지금 작업대 카드 모두 꺼짐(다른 작업대 그대로)
    await p.click('.rgws [data-regplat="al"]'); await p.waitForTimeout(1300);
    const d1 = await p.evaluate(async () => { const ids = ['p0', 'p1', 'p2', 'k0', 'k1']; const srv = await Promise.all(ids.concat('x0').map((id) => db.collection('reg_items').doc(id).get().then((d) => (d.data() || {}).alReg))); const sh = document.getElementById('sheet');
      return { ls: localStorage.getItem('rn-regplat-al'), srv, loc: ids.map((id) => S.regItems.get(id).alReg), chipsOff: ids.filter((id) => S.regItems.get(id).stage === S.regT).every((id) => sh.querySelector(`[data-rgalreg="${id}"]`) && !sh.querySelector(`[data-rgalreg="${id}"].on`)), bar: !document.querySelector('.rgws [data-regplat="al"].on'), sp: !document.querySelector('#seenp [data-regplat="al"].on'), cfg: JSON.stringify(((S.app || {}).reg) || {}).includes('regplat') }; });
    ok(d1.ls === '0' && d1.srv.slice(0, 5).every((v) => v === 0) && d1.loc.every((v) => v === 0) && d1.srv[5] === undefined, '③ 🟥 끄기 → 지금 작업대 상품 5개 모두 alReg 0(서버·화면) · 다른 작업대 상품은 그대로', d1);
    ok(d1.chipsOff && d1.bar && d1.sp, '③ 카드 🟥 단추·맨 위·살핀 패널 토글 모두 꺼짐으로', d1);
    ok(!d1.cfg, '① 기기별 — 서버 등록 설정(app_settings)에 쓰지 않음', d1);
    // ⑤ 꺼진 플랫폼은 안 보냄
    const d2 = await p.evaluate(() => { const R = regRows(['k0'], regCfg()); return { rows: R.rows.length, bad: R.bad.some((b) => /🟥 알라딘 등록 꺼짐/.test(b)), auto: /🟥 알라딘 등록 꺼짐/.test(regAutoWhyNot(S.regItems.get('k0'))) }; });
    ok(!d2.rows && d2.bad && d2.auto, '⑤ 🟥 꺼진 상품은 대량 확정 줄에서 빠지고(까닭 🟥) · 창 없이 자동 등록도 안 맡김', d2);
    await p.evaluate(() => { regOpenAladin('k0'); }); await p.waitForTimeout(400); ok(await p.evaluate(() => /🟥 알라딘 등록이 꺼진 상품/.test((document.getElementById('toast') || document.body).textContent)), '⑤ 채워서 열기도 막고 까닭 알림');
    // ③ 다시 켜기 → 개별로 끈 k1도 따라 켜짐
    await p.click('#seenp [data-regplat="al"]'); await p.waitForTimeout(1300);
    const d3 = await p.evaluate(async () => { const v = await db.collection('reg_items').doc('k1').get().then((d) => (d.data() || {}).alReg); const R = regRows(['k0'], regCfg()); return { ls: localStorage.getItem('rn-regplat-al'), k1: v, all: ['p0', 'p1', 'p2', 'k0', 'k1'].every((id) => S.regItems.get(id).alReg === 1), noRed: !R.bad.some((b) => /🟥/.test(b)) }; });
    ok(d3.ls === '1' && d3.k1 === 1 && d3.all && d3.noRed, '③ 살핀 패널에서 🟥 켜기 → 개별로 껐던 상품도 따라 켜짐 · 확정 줄에 🟥 까닭 없음', d3);
    // 개별 단추는 그 상품만
    await p.click('[data-rgalreg="p2"]'); await p.waitForTimeout(900);
    ok(await p.evaluate(() => S.regItems.get('p2').alReg === 0 && S.regItems.get('p1').alReg === 1 && regPlatOn('al')), '개별 🟥 단추 = 그 상품만 끔(토글·다른 카드 그대로)');
    // 🟦 예스24 켜기(살핀 패널) → 카드 🟦 모두 켬
    await p.click('#seenp [data-regplat="y24"]'); await p.waitForTimeout(1300);
    const d4 = await p.evaluate(() => { const W = y24W(); const sh = document.getElementById('sheet'); return { ls: localStorage.getItem('rn-regplat-y24'), w: ['p0', 'p1', 'p2', 'k0', 'k1'].map((id) => (W[id] || {}).on), x0: W.x0, chip: !!sh.querySelector('[data-y24w="p0"].on'), on: y24WOn('p1') }; });
    ok(d4.ls === '1' && d4.w.every((v) => v === 1) && d4.x0 === undefined && d4.chip && d4.on, '③ 🟦 켜기 → 지금 작업대 상품 🟦 모두 켬(올림 장부 w) · 다른 작업대 그대로', d4);
    // ④ 새로 넣는 상품 = 토글 값
    await p.evaluate(async () => { await regAdd('9791100088881', regCfg()); }); await p.waitForTimeout(700);
    const d5 = await p.evaluate(() => { const it = [...S.regItems.values()].find((x) => x.isbn === '9791100088881'); return it ? { al: it.alReg, y: it.y24Reg } : null; });
    ok(d5 && d5.al === 1 && d5.y === 1, '④ 새로 넣는 상품은 넣을 때 이 기기 토글 값(🟥 1 · 🟦 1)', d5);
    // 🟦 끄기 → 이미 예스24에 올라간(올림 장부) 확정 상품은 건드리지 않음 · 꺼진 상품은 자동 올림 후보에서 빠짐
    const d6 = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const t0 = new Date().toISOString(); const mkD = async (id, uc) => { const d = { stage: 'done', grade: 2, qty: 1, price: 5000, ws: 'main', createdAt: t0, info: { title: '확정 ' + id, isbn13: '9791100077' + uc.slice(-3), categories: [], page1: [] }, final: { price: 5000, qty: 1 }, result: { state: 'live', usedCode: uc } }; await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); };
      await mkD('d0', '900001'); await mkD('d1', '900002'); await y24WantSet(['d0', 'd1'], true); await db.collection('app_settings').doc('y24_reg').set({ r: { aladin_900001: { lid: 'aladin_900001', st: 'sent', ok: 1, at: t0, skus: ['Z1'] } } }, { merge: true }); await Wt(300);
      S.regT = 'done'; regRerender(); await Wt(900); document.querySelector('.rgws [data-regplat="y24"]').click(); await Wt(1300); const W = y24W(); const L = y24WantLids();
      return { ls: localStorage.getItem('rn-regplat-y24'), d0: (W.d0 || {}).on, d1: (W.d1 || {}).on, led: !!(y24RegLed().aladin_900001), lidOff: !L.has('aladin_900002'), selOff: (W.p0 || {}).on }; });
    ok(d6.ls === '0' && d6.d1 === 0 && d6.lidOff && d6.selOff === 0, '⑤ 🟦 끄기 → 확정 탭의 아직 안 올린 상품·고르기 상품 꺼짐 · 자동 올림 후보에서 빠짐', d6);
    ok(d6.d0 === 1 && d6.led, '⑤ 이미 예스24에 올라간 상품(올림 장부)은 건드리지 않음', d6);
    // 📋 한눈에도 🟥 단추
    await p.evaluate(() => { S.regT = 'sel'; localStorage.setItem('rn-reg-view', 'compact'); regRerender(); }); await p.waitForTimeout(1200);
    ok(await p.evaluate(() => !!document.querySelector('#sheet .rgrow [data-rgalreg="p0"]') && /🟥✓/.test(document.querySelector('#sheet [data-rgalreg="p0"]').textContent)), '📋 한눈에 줄에도 🟥 단추(짧게 🟥✓)');
    // ① 기기별 — 이 기기 기억을 지우면 처음 기본으로
    ok(await p.evaluate(() => { ['al', 'y24'].forEach((k) => localStorage.removeItem('rn-regplat-' + k)); return regPlatOn('al') && !regPlatOn('y24'); }), '① 이 기기 기억이 없으면(새 기기) 처음 기본 = 알라딘 켬 · 예스24 끔');
    ok(await p.evaluate(() => !!document.querySelector('#sheet .rgsearch, #sheet .btabs')), '등록 화면이 그대로 열림');
    ok(!dlg.length, '브라우저 창 0: ' + dlg.join(' / ')); reached = true; }, { vp: { width: 1400, height: 900 } });
  ok(reached, '화면 시험이 끝까지 돎');
  console.log(bad ? `❌ tREGPLAT1111 ${bad}개 실패` : '✓ tREGPLAT1111 모두 통과'); process.exit(bad ? 1 : 0); })();
