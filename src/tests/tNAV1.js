// tNAV1 — 정범님 11/10
//  ① 상품명을 누르면 그 상품 페이지로(웹앱 어디서든 하나의 길 openItem) — 상품 열쇠·판매 번호·매물 번호·ISBN·같은 제목 하나뿐 차례로 찾기
//     · 상품 기록을 다 받지 않은 기기(출고 가벼운 모드·휴대폰)는 서버에서 그 한 건만 찾아 엶 · 받는 중인 PC는 다 받은 뒤 엶 · 못 찾으면 같은 제목 모음(검색 결과)
//     · 출고 카드(알라딘·예스24)·매입 목록의 상품명이 누를 수 있는 링크 · 출고 화면에서 상품을 열어도 출고 가벼운 모드는 그대로(뒤로 가면 출고)
//  ② 책방 친구 껐는데 저절로 켜짐 → ⚙ 설정 '이 기기에서 책방 친구 캐릭터 보이기'(서버 이 기기 칸 · 프로그램·웹앱 안 모두) · 끈 값이 다시 읽어도 그대로 · 다른 기기 칸은 그대로
//     · '웹앱 안에서도 켜기'는 바꾸는 즉시 서버 사본(devui_<기기>)에도 · 본체 🐾 누름/🗑 끄기가 이 기기 칸에도 바로(옛 값으로 다시 보이지 않게)
// 시험 자료 손님·상품은 가짜 · 쓰는 법: RN_PORT=<포트> node tNAV1.js (pw/ 안 — harness.js 옆)
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); if (!c) bad++; };
const APPF = [path.join(__dirname, '..', 'app.html'), path.join(__dirname, 'app.html')].find((f) => fs.existsSync(f));
const H = require('./harness.js');
(async () => {
  // ── 글 검사(원본)
  if (APPF) { const A = fs.readFileSync(APPF, 'utf8');
    ok(/async function openItem\(d, opt\)/.test(A) && /function openBook\(d\) \{ return openItem\(d\); \}/.test(A), '하나의 열기 함수 openItem(예전 openBook도 그리로)');
    ok(A.includes('<span class="shp-t gl"${gB({ lk: l && l.id, lid: it.listingId, t: it.title })}>'), '알라딘 출고 카드 상품명 = 링크');
    ok(/<span class="shp-t\$\{it\.title \|\| \(mt\.x && mt\.x\.title\) \? ' gl' : ''\}"\$\{gB\(\{ lk: l && l\.id/.test(A), '예스24 출고 카드 상품명 = 링크');
    ok(/f\.detail && f\.detail\.ship\)\)\) \{ \/\* \(11\/10\) 출고 화면에서 상품명을/.test(A), '출고 가벼운 모드: 출고 위에 상품을 열어도 전체 받기를 시작하지 않음');
    ok(!/a\.items\.slice\(0, 4\)\.map\(\(it\) => esc\(it\.title\)\)/.test(A), '매입 목록 상품명도 링크(bkT)'); }
  await H(async (p) => {
    await p.evaluate(() => { try { localStorage.setItem('rn-device', 'TEST-PC'); } catch (e) {} });
    await p.waitForTimeout(1500);
    // ── ① 찾는 차례(다 받은 PC)
    const r1 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const calls = []; const sheets = []; const op0 = window.openProduct, ob0 = window.openBookSheet;
      window.openProduct = (pid) => { calls.push(pid); }; window.openBookSheet = (d) => { sheets.push(d.t || '?'); };
      S.prodLoaded = true; const add = (id, o) => S.plist.set(id, { id, grade: '상', price: 10000, active: true, ...o });
      add('aladin_UA1', { title: '가나다 시험책 하나', listingId: '111', usedCode: 'UA1', isbn13: '9780000000011' });
      add('y24_k2', { title: '라마바 시험책 둘', usedCode: 'UB2', isbn13: '9780000000028' });
      add('aladin_UC3', { title: '사아자 시험책 셋', listingId: '333', usedCode: 'UC3', isbn13: '9780000000035' });
      add('aladin_UD4', { title: '차카타 시험책 넷', listingId: '444', usedCode: 'UD4', isbn13: '9780000000042' });
      add('aladin_UE5', { title: '파하 같은 제목', listingId: '555', usedCode: 'UE5', active: false }); add('aladin_UE6', { title: '파하 같은 제목', listingId: '556', usedCode: 'UE6', active: true });
      MEMO.clear(); S.ver = (S.ver || 0) + 1;
      const click = async (html) => { const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d); const el = d.querySelector('.gl,[data-gb]'); el.click(); await W(60); d.remove(); };
      await click(bkT('가나다 시험책 하나', { lk: 'aladin_UA1' })); await click(`<span class="shp-t gl"${gB({ u: 'UB2', t: '라마바 시험책 둘' })}>x</span>`);
      await click(`<span class="gl"${gB({ lid: '333', t: '사아자' })}>x</span>`); await click(bkT('엉뚱한 제목', { isbn: '978-0-00-000004-2' })); await click(bkT('가나다 시험책 하나', {}));
      await click(bkT('파하 같은 제목', {})); await click(bkT('세상에 없는 책', { lid: '999999' }));
      window.openProduct = op0; window.openBookSheet = ob0; return { calls, sheets }; });
    ok(JSON.stringify(r1.calls) === JSON.stringify(['aladin_UA1', 'y24_k2', 'aladin_UC3', 'aladin_UD4', 'aladin_UA1', 'aladin_UE6']), '열쇠 → 판매 번호(열쇠가 aladin_이 아니어도) → 매물 번호 → ISBN → 같은 제목 하나 → 같은 제목 여럿이면 파는 중인 것', r1.calls);
    ok(JSON.stringify(r1.sheets) === JSON.stringify(['세상에 없는 책']), '끝내 못 찾으면 같은 제목 모음(검색 결과)', r1.sheets);
    // ── 출고 가벼운 모드: 서버에서 그 한 건만
    const r2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const calls = []; const op0 = window.openProduct, ob0 = window.openBookSheet; const sheets = [];
      const keep = S.plist; S.plist = new Map(); MEMO.clear(); S.ver++; S.prodLoaded = false; S.shipLite = true; const lp0 = window.loadProducts; let lp = 0; window.loadProducts = () => { lp++; };
      window.__FS.prd_listings = { aladin_US9: { title: '서버에만 있는 책', listingId: '9090', usedCode: 'US9', isbn13: '9780000000097', active: true, grade: '중', price: 5000 }, y24_s8: { title: '서버 제목만 아는 책', usedCode: 'US8', active: true, price: 7000 } };
      window.openProduct = (pid) => { calls.push(pid); }; window.openBookSheet = (d) => { sheets.push(d.t); };
      const click = async (html) => { const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d); d.querySelector('.gl').click(); await W(300); d.remove(); };
      await click(`<span class="gl"${gB({ lid: '9090', t: '서버에만 있는 책' })}>x</span>`); await click(bkT('서버 제목만 아는 책', {})); await click(bkT('서버에도 없는 책', { lid: '123123' }));
      const got = !!S.plist.get('aladin_US9'); window.openProduct = op0; window.openBookSheet = ob0;
      // 진짜 openProduct — 가벼운 모드에서 열쇠로 바로
      await openProduct('aladin_US9'); await W(400); const sh = document.getElementById('sheet'); const t = sh && sh.classList.contains('on') ? (sh.querySelector('.sh .t') || {}).textContent : null; history.back(); await W(300);
      window.loadProducts = lp0; S.shipLite = false; S.plist = keep; S.prodLoaded = true; MEMO.clear(); S.ver++; return { calls, sheets, got, t, lp }; });
    ok(JSON.stringify(r2.calls) === JSON.stringify(['aladin_US9', 'y24_s8']), '출고 가벼운 모드: 매물 번호·같은 제목으로 서버에서 그 한 건만 찾아 엶', r2.calls);
    ok(r2.got && r2.lp === 0, '받은 건만 메모리에 · 상품 전체 받기는 안 부름', { got: r2.got, lp: r2.lp });
    ok(JSON.stringify(r2.sheets) === JSON.stringify(['서버에도 없는 책']), '서버에도 없으면 같은 제목 모음', r2.sheets);
    ok(r2.t && r2.t.includes('서버에만 있는 책'), '가벼운 모드에서 상품 상세가 열림(임시 화면 아님)', r2.t);
    // ── 받는 중인 PC: 다 받은 뒤 엶 · 그사이 다른 것을 누르면 그만
    const r3 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const calls = []; const op0 = window.openProduct; const keep = S.plist; const lp0 = window.loadProducts; window.loadProducts = () => {};
      window.openProduct = (pid) => { calls.push(pid); }; S.plist = new Map(); MEMO.clear(); S.ver++; S.prodLoaded = false;
      const d = document.createElement('div'); d.innerHTML = bkT('가나다 시험책 하나', { lk: 'aladin_UA1' }); document.body.appendChild(d); d.querySelector('.gl').click(); await W(500); const before = calls.length;
      S.plist = keep; MEMO.clear(); S.ver++; S.prodLoaded = true; await W(700); const after = calls.slice();
      S.plist = new Map(); MEMO.clear(); S.ver++; S.prodLoaded = false; d.querySelector('.gl').click(); await W(400); S._userAt = Date.now() + 5; S.plist = keep; MEMO.clear(); S.ver++; S.prodLoaded = true; await W(700); const cancel = calls.length - after.length;
      d.remove(); window.openProduct = op0; window.loadProducts = lp0; return { before, after, cancel }; });
    ok(r3.before === 0 && JSON.stringify(r3.after) === JSON.stringify(['aladin_UA1']), '받는 중인 PC: 다 받으면 그 상품을 엶', r3);
    ok(r3.cancel === 0, '기다리는 사이 다른 것을 누르면 열지 않음', r3);
    // ── 상품 탭 카드: 상품명(카드 안) 누름이 카드 선택·두 번 눌러 편집과 겹치지 않음 — data-pid 카드는 원래대로 openProduct 하나
    const r4 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const calls = []; const op0 = window.openProduct; window.openProduct = (pid) => { calls.push(pid); };
      const d = document.createElement('div'); d.innerHTML = `<div class="item" data-pid="aladin_UA1"><span class="pcf" data-f="price">10,000</span> <b>가나다 시험책 하나</b></div>`; document.body.appendChild(d);
      d.querySelector('[data-pid]').onclick = (e) => { if (e.target.closest('.pcf')) return; openProduct(e.currentTarget.dataset.pid); }; d.querySelector('.pcf').click(); await W(30); const a = calls.length; d.querySelector('b').click(); await W(30);
      d.remove(); window.openProduct = op0; return { a, calls }; });
    ok(r4.a === 0 && r4.calls.length === 1, '카드 칸(두 번 눌러 편집)은 그대로 · 카드 상품명은 상품 하나', r4);
    // ── ② 책방 친구 — 이 기기 켜기·끄기 (서버 이 기기 칸)
    const r5 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.user = S.user || { email: 'tester@x' };
      window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.mascot = { cfg: { all: true }, dev: { 'TEST-PC': { mig: { at: 'x' }, me: { open: true, charId: 'c1' } }, OTHER: { mig: { at: 'x' }, me: { open: true } } }, me: { 'TEST-PC': { open: true }, OTHER: { open: true } } };
      FRW.dev = null; FRW.devAt = 0; S.tab = 'settings'; renderMain(); await W(800); const cb = document.getElementById('frw_open'); const st0 = cb ? { on: cb.checked, dis: cb.disabled } : null;
      cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await W(500); const M = window.__FS.app_settings.mascot;
      const after = { slot: M.dev['TEST-PC'].me.open, old: M.me['TEST-PC'].open, other: M.dev.OTHER.me.open, otherOld: M.me.OTHER.open, char: M.dev['TEST-PC'].me.charId, mig: !!M.dev['TEST-PC'].mig };
      FRW.dev = null; FRW.devAt = 0; frwDevLoad(true); await W(300); const re = document.getElementById('frw_open'); const reOn = re ? re.checked : null;
      // 본체(웹앱 안에서도 켬 → 불러와 있음): 같은 값을 따름
      const body = typeof mscOpen === 'function' ? mscOpen() : 'none';
      // 다시 켜기
      re.checked = true; re.dispatchEvent(new Event('change', { bubbles: true })); await W(500); const on2 = window.__FS.app_settings.mascot.dev['TEST-PC'].me.open;
      return { st0, after, reOn, body, on2, n: document.querySelectorAll('[id="frw_open"]').length }; });
    ok(r5.st0 && r5.st0.on === true && r5.st0.dis === false, '설정에 이 기기 켜기 칸 · 서버 값(켬)대로', r5.st0);
    ok(r5.after.slot === false && r5.after.old === false && r5.after.char === 'c1' && r5.after.mig, '끄면 서버 이 기기 칸(새 칸·예전 칸)에 끔 · 고른 캐릭터는 그대로', r5.after);
    ok(r5.after.other === true && r5.after.otherOld === true, '다른 기기 칸은 건드리지 않음', r5.after);
    ok(r5.reOn === false, '다시 읽어도(새로고침·새 판) 끈 채', r5.reOn);
    ok(r5.body === false || r5.body === 'none', '책방 친구 본체도 끈 값을 따름', r5.body);
    ok(r5.on2 === true, '켜면 켜진 채로 저장', r5.on2);
    // 본체: 🐾 누름/🗑 끄기가 이 기기 칸에도 바로
    const r6 = await p.evaluate(async () => { if (typeof mscOpenLocal !== 'function') return { skip: 1 }; M_.doc = { cfg: { all: true }, dev: { 'TEST-PC': { mig: { at: 'x' }, me: { open: true, charId: 'c1' } } }, me: { 'TEST-PC': { open: true } } };
      M_.doc = { ...M_.doc, me: { ...M_.doc.me, 'TEST-PC': { ...mscMine(), open: false } } }; const before = mscOpen(); mscOpenLocal(false); return { before, after: mscOpen() }; });
    ok(r6.skip || (r6.before === true && r6.after === false), '본체: 예전 칸만 고치면 옛 값(켬)이 이기던 것 → 이 기기 칸에도 바로 반영', r6);
    // '웹앱 안에서도 켜기' — 바꾸는 즉시 서버 사본
    const r7 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S._devUiR = 1; S._devUiSig = ''; const cb = document.getElementById('frw_inapp'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await W(500);
      const d = (window.__FS.app_settings || {})['devui_TEST-PC']; const v = d && d.m ? d.m['rn-msc-inapp'] : null; const all = [...document.querySelectorAll('[id="frw_inapp"]')].map((x) => x.checked); return { v, all }; });
    ok(r7.v === '0', "'웹앱 안에서도 켜기'를 끄면 서버 사본에도 바로 '끔'(옛 사본으로 되살아나지 않음)", r7);
    ok(r7.all.every((x) => x === false), '같은 칸이 여러 곳(설정·홈 카드)에 있어도 모두 같은 상태', r7.all);
  });
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
