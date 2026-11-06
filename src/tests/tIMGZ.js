// tIMGZ — 정범님 11/06 '선택 대기에서 책 사진에 마우스를 올리면 앞면만 사진과 세 장 사진이 함께 겹쳐 나옴'
//  원인: 마우스 올림 큰 보기가 두 갈래였음 — ① 🖼 사진 크게(.imgzoom · 설정 앞면만/세 장을 따름 · .rgc 같은 카드 안 모든 사진)
//        ② 큰 보기 창(#pzbox · data-pz가 붙은 표지 · 설정을 모르고 늘 앞면·뒷면·옆면 세 칸) — 등록 카드 표지(.rgcov)에는 둘 다 붙어 한 번에 두 창
//  고침: 큰 보기는 #pzbox 하나(pzShow 한 함수)만 · 설정(rn-imgzoom)을 따름
// 돌리기: RN_PORT=<포트> node tIMGZ.js
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const H = require('./harness.js');
const W = (p, ms) => p.waitForTimeout(ms);
/* 보이는 큰 보기 창과 그 안 사진 수 */
const vis = (p) => p.evaluate(() => { const L = [...document.querySelectorAll('#pzbox, .imgzoom')].filter((z) => getComputedStyle(z).display !== 'none' && z.offsetWidth > 0);
  return { n: L.length, ids: L.map((z) => z.id || z.className), imgs: L.map((z) => z.querySelectorAll('figure img, .pz-f img').length), cap: L.map((z) => [...z.querySelectorAll('figcaption')].map((c) => c.textContent.replace(/\s*\d+×\d+/, '').trim()).join('/')), no: L.map((z) => z.querySelectorAll('.pz-no').length), src: L.map((z) => [...z.querySelectorAll('img')].map((i) => (i.getAttribute('src') || '').slice(0, 40))) }; });
const hover = async (p, sel) => { const bb = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (!bb) return false; await p.mouse.move(5, 5); await W(p, 120); await p.mouse.move(bb.x, bb.y, { steps: 3 }); await W(p, 450); return true; };
const seed = async (p, view) => { await p.evaluate(require('./seed.js')); await W(p, 400); await p.addStyleTag({ content: '#seenp,.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
  await p.evaluate(async (view) => { const pic = (c, t) => { const cv = document.createElement('canvas'); cv.width = 120; cv.height = 170; const g = cv.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, 120, 170); g.fillStyle = '#fff'; g.font = '20px sans-serif'; g.fillText(t, 10, 90); return cv.toDataURL('image/png'); };
    window.__P = { f1: pic('#2F5D50', '앞1'), b1: pic('#7A4A20', '뒤1'), s1: pic('#204A7A', '등1'), f2: pic('#5D2F50', '앞2'), b2: pic('#4A7A20', '뒤2'), s2: pic('#7A2040', '등2') };
    const t = new Date().toISOString(); S.regItems = S.regItems || new Map(); window.ask = async () => true;
    const mk = (id, k) => ({ stage: 'sel', isbn: '97911000004' + id.slice(-2), grade: 2, qty: 1, ws: regWsCur(), createdAt: t, code: 'BLKCMN', codeManual: true, price: 8000,
      info: { title: '사진 책 ' + id, isbn13: '97911000004' + id.slice(-2), cover: __P['f' + k], imgs: { front: __P['f' + k], back: __P['b' + k], spine: __P['s' + k] }, categories: [{ path: ['국내도서', '소설/시/희곡'] }], priceList: 15000, priceSales: 13500, at: t } });
    for (const [id, k] of [['z01', 1], ['z02', 2]]) { const d = mk(id, k); await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); }
    localStorage.setItem('rn-reg-view', view); S._regOpen = new Set(); S.regT = 'sel'; openRegister(); }, view);
  await W(p, 1600); };
const setMode = (p, m) => p.evaluate((m) => { const b = document.querySelector(`[data-imgz="${m}"]`); if (b) b.click(); else localStorage.setItem('rn-imgzoom', m); }, m);
const COV1 = '[data-rgcid="z01"] img.rgcov', COV2 = '[data-rgcid="z02"] img.rgcov';
const PCDONE = H(async (p) => {
  console.log('── 자세히 카드(선택 대기)');
  await seed(p, 'full');
  const has = await p.evaluate((s) => !!document.querySelector(s), COV1); ok(has, '선택 대기 자세히 카드에 표지 사진이 있음', has);
  // ① 앞면만
  await setMode(p, 'front'); await hover(p, COV1); let v = await vis(p);
  ok(v.n === 1 && v.imgs[0] === 1, '「앞면만」: 큰 보기 창 하나 · 사진 한 장', v);
  ok(v.n === 1 && v.src[0].join() === (await p.evaluate(() => __P.f1.slice(0, 40))), '「앞면만」: 그 한 장 = 앞면', v);
  // ② 세 장
  await setMode(p, 'three'); await hover(p, COV1); v = await vis(p);
  ok(v.n === 1 && v.imgs[0] === 3 && /앞/.test(v.cap[0]) && /(뒤|뒷)/.test(v.cap[0]) && /(옆|책등)/.test(v.cap[0]), '「세 장」: 큰 보기 창 하나 · 앞·뒤·옆면 세 장 묶음 하나', v);
  const fbs = await p.evaluate(() => [__P.f1, __P.b1, __P.s1].map((x) => x.slice(-40))); const got = await p.evaluate(() => [...document.querySelectorAll('#pzbox img')].map((i) => (i.getAttribute('src') || '').slice(-40)));
  ok(got.join() === fbs.join(), '「세 장」 세 장 = 그 책의 알라딘 앞·뒤·책등 사진(조회 때 받은 것)', { got: got.length });
  // ③ 다른 사진으로 옮기면 앞 것은 사라지고 새 것 하나
  await hover(p, COV2); v = await vis(p); const f2 = await p.evaluate(() => __P.f2.slice(0, 40));
  ok(v.n === 1 && v.imgs[0] === 3 && v.src[0][0] === f2, '다른 카드 사진으로 옮기면 앞 창은 사라지고 그 책 세 장 하나만', v);
  await p.mouse.move(700, 880); await W(p, 400); v = await vis(p); ok(v.n === 0, '사진 밖으로 나가면 창 닫힘', v);
  // ④ 다시 그린 뒤에도 하나
  await p.evaluate(() => { openRegister(); regRerender(); openRegister(); }); await W(p, 1200);
  await setMode(p, 'front'); await hover(p, COV1); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '여러 번 다시 그린 뒤에도 「앞면만」 창 하나·한 장', v);
  await hover(p, COV2); await hover(p, COV1); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '이리저리 옮겨도 창 하나', v);
  const nBox = await p.evaluate(() => document.querySelectorAll('#pzbox, .imgzoom').length); ok(nBox === 1, '큰 보기 엘리먼트는 화면에 하나뿐', nBox);
  console.log('── 📋 한눈에 줄');
  await seed(p, 'compact');
  await setMode(p, 'front'); const R1 = '.rgrow img.rgr-cov'; await hover(p, R1); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '한눈에 줄 표지 「앞면만」: 창 하나 · 한 장', v);
  await setMode(p, 'three'); await hover(p, R1); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 3, '한눈에 줄 표지 「세 장」: 창 하나 · 세 장', v);
  console.log('── 다른 화면(오늘 출고와 같은 data-pz 사진)');
  await p.evaluate(() => { const P = { f: __P.f1, th: __P.f1, b: __P.b1, s: '', pp: [], t: '출고 책', fromBook: true }; const d = document.createElement('div'); d.id = 'tship'; d.className = 'shp-it'; d.style.cssText = 'position:fixed;left:40px;top:300px;z-index:20000;background:#fff;padding:10px';
    d.innerHTML = shipImgTag(__P.f1, 'ph', P, true); document.body.appendChild(d); });
  await setMode(p, 'front'); await hover(p, '#tship img'); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '출고 사진 「앞면만」: 창 하나 · 한 장', v);
  await setMode(p, 'three'); await hover(p, '#tship img'); v = await vis(p); ok(v.n === 1 && v.imgs[0] + v.no[0] === 3, '출고 사진 「세 장」: 창 하나 · 세 칸(없는 면은 「없음」)', v);
  console.log('── 고름 단추 — 웹앱 전체 하나(📦 오늘 출고 · ⚙ 설정 · 등록)');
  const so = await p.evaluate(async () => { localStorage.setItem('rn-imgzoom', 'front'); let err = null; try { await openShip(); } catch (e) { err = String(e && e.message); } await new Promise((r) => setTimeout(r, 700)); const bar = document.querySelector('#sheet .imgzrow .imgzbar'); return { err, bar: !!bar, on: bar ? (bar.querySelector('.on') || {}).dataset.imgz : null }; });
  ok(so.bar && so.on === 'front', '📦 오늘 출고 탭 줄 아래 「🖼 사진 크게」 단추 · 지금 고름(앞면만) 표시', so);
  await p.click('#sheet .imgzrow [data-imgz="three"]'); await W(p, 300);
  let m = await p.evaluate(() => ({ ls: localStorage.getItem('rn-imgzoom'), on: [...document.querySelectorAll('[data-imgz].on')].map((b) => b.dataset.imgz) }));
  ok(m.ls === 'three' && m.on.length && m.on.every((x) => x === 'three'), '출고에서 「세 장」을 누르면 이 기기 고름이 세 장 · 화면의 모든 고름 단추가 세 장', m);
  await p.evaluate(() => { const P = { f: __P.f1, th: __P.f1, b: __P.b1, s: __P.s1, pp: [], t: '출고 책', fromBook: true }; const d = document.createElement('div'); d.id = 'tship'; d.className = 'shp-it'; d.style.cssText = 'position:fixed;left:40px;top:300px;z-index:20000;background:#fff;padding:10px'; d.innerHTML = shipImgTag(__P.f1, 'ph', P, true); document.body.appendChild(d); });
  await hover(p, '#tship img'); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 3, '출고 「세 장」 → 출고 사진 창 하나 · 세 장', v);
  await p.click('#sheet .imgzrow [data-imgz="front"]'); await W(p, 300); await hover(p, '#tship img'); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '출고 「앞면만」 → 출고 사진 창 하나 · 한 장', v);
  await p.evaluate(() => { document.getElementById('tship').remove(); const b = document.querySelector('#sheet #back'); if (b) b.click(); }); await W(p, 400);
  await p.click('#sheet .imgzrow [data-imgz="three"]').catch(() => {}); await p.evaluate(() => localStorage.setItem('rn-imgzoom', 'three'));
  await seed(p, 'full'); m = await p.evaluate(() => (document.querySelector('.btabs .imgzbar .on') || {}).dataset.imgz); ok(m === 'three', '출고에서 바꾼 고름이 등록 화면 단추에도(세 장)', m);
  await hover(p, COV1); v = await vis(p); ok(v.n === 1 && v.imgs[0] === 3, '출고에서 바꾼 고름대로 등록 카드도 세 장 · 창 하나', v);
  const st = await p.evaluate(async () => { const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('on'); S.detail = null; S.tab = 'settings'; renderTabs(); renderMain(); await new Promise((r) => setTimeout(r, 900)); const z = document.querySelector('#st_imgz'); return { has: !!z, on: z ? (z.querySelector('.on') || {}).dataset.imgz : null, txt: z ? z.innerText.slice(0, 40) : '' }; });
  ok(st.has && st.on === 'three', '⚙ 설정 ① 이 기기에 「🖼 사진 크게 보기」 한 줄 · 지금 고름 표시', st);
  await p.click('#st_imgz [data-imgz="front"]'); await W(p, 300); m = await p.evaluate(() => localStorage.getItem('rn-imgzoom')); ok(m === 'front', '⚙ 설정에서 「앞면만」 → 이 기기 고름 앞면만', m);
  console.log(bad ? `❌ 실패 ${bad}` : '✅ tIMGZ PC 모두 통과');
});
/* 휴대폰 390 — 누르면 열기(data-pzt)도 고름을 따름 · 창 하나 */
PCDONE.then(() => H(async (p) => { console.log('── 휴대폰 390 누르면 열기'); const b0 = bad; await seed(p, 'compact');
  await p.evaluate(() => { const P = { f: __P.f1, th: __P.f1, b: __P.b1, s: __P.s1, pp: [], t: '출고 책', fromBook: true }; const d = document.createElement('div'); d.id = 'tship'; d.className = 'ss-it'; d.style.cssText = 'position:fixed;left:20px;top:200px;z-index:20000;background:#fff;padding:10px'; d.innerHTML = shipImgTag(__P.f1, 'ss-ph', P, 1); document.body.appendChild(d); });
  for (const [mo, n] of [['front', 1], ['three', 3]]) { await p.evaluate((mo) => { localStorage.setItem('rn-imgzoom', mo); pzHide(); }, mo); await p.tap('#tship img'); await W(p, 400); const v = await vis(p);
    ok(v.n === 1 && v.imgs[0] === n, `휴대폰 「${mo === 'front' ? '앞면만' : '세 장'}」 누르면: 창 하나 · ${n}장`, v); await p.evaluate(() => pzHide()); }
  const r1 = await p.evaluate(() => { const i = document.querySelector('.rgrow img.rgr-cov'); if (!i) return null; i.scrollIntoView({ block: 'center' }); const r = i.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (r1) { await p.evaluate(() => localStorage.setItem('rn-imgzoom', 'front')); await p.touchscreen.tap(r1.x, r1.y); await W(p, 500); const v = await vis(p); ok(v.n === 1 && v.imgs[0] === 1, '휴대폰 한눈에 줄 표지 누르면 「앞면만」 창 하나 · 한 장', v); await p.evaluate(() => pzHide()); }
  else ok(false, '휴대폰 한눈에 줄 표지가 있음');
  console.log(bad ? `❌ 실패 ${bad}` : '✅ tIMGZ 모두 통과');
}, { vp: { width: 390, height: 800 }, touch: true }));
