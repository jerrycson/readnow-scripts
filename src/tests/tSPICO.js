// tSPICO — 11/05 정범님: 👁 살핀 상품 패널을 수집기처럼 아이콘 하나로 접기(▁) · 아이콘 누르면 다시 펼침 · 접힘 상태·자리 새로고침 뒤 유지 · 아이콘도 끌어 옮김(화면 밖 안 나감) · 패널이 나오는 모든 화면에 단추 · 머리줄 접기(▾) 그대로
// 돌리기: RN_PORT=<포트> node tSPICO.js   (PC 1400 · 휴대폰 390 두 번)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const W = (p, ms) => p.waitForTimeout(ms);
const H = require('./harness.js');
const mk = () => { const box = document.createElement('div'); box.id = 'tsp'; box.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:11;background:#fff';
  box.innerHTML = Array.from({ length: 20 }, (_, i) => `<div class="tcard" data-k="k${i}" style="height:200px;border:1px solid #ccc;box-sizing:border-box">카드 ${i}</div>`).join(''); document.body.appendChild(box);
  window.__use = () => seenPanelUse({ key: 'tsp', scope: 'a', title: '시험 화면', alive: () => !!document.getElementById('tsp'), root: () => document.getElementById('tsp'), sel: '.tcard[data-k]', keyOf: (el) => el.dataset.k, nameOf: (el, k) => '책 ' + k, actions: [{ label: '살핀 것 보통 처리', run: async (keys) => `보통 ${keys.length}개` }] }); window.__use(); };
const st = (p) => p.evaluate(() => { const el = document.getElementById('seenp'); const r = el.getBoundingClientRect(); return { cls: el.className, disp: getComputedStyle(el).display, x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom, vw: innerWidth, vh: innerHeight, txt: el.innerText, fold: localStorage.getItem('rn-seenp-fold:tsp'), ipos: localStorage.getItem('rn-seenp-ipos:tsp'), pos: localStorage.getItem('rn-seenp-pos:tsp'), bg: getComputedStyle(el).backgroundColor, n: seenKeys().length }; });
const inView = (s) => s.x >= 0 && s.y >= 0 && s.r <= s.vw && s.b <= s.vh;
const drag = async (p, sel, dx, dy) => { const bb = await (await p.$(sel)).boundingBox(); const x = bb.x + Math.min(10, bb.width / 2), y = bb.y + Math.min(8, bb.height / 2); await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x + dx, y + dy, { steps: 6 }); await p.mouse.up(); await W(p, 150); };

/* 새로고침: 서비스 워커가 시험 틀의 firebase 가짜를 건너뛰지 않게 먼저 풀고 */
const rl = async (p) => { await p.evaluate(async () => { try { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map((r) => r.unregister())); } catch (e) {} }); await p.reload(); await W(p, 3500); };
const run = (vw) => async (p) => { try { await run0(vw, p); } catch (e) { bad++; console.log('  ❌ 시험 중 오류', e.message); } };
const run0 = async (vw, p) => { console.log(`── 화면 폭 ${vw}px`); await p.evaluate(require('./seed.js')); await p.evaluate(() => { ['rn-seenp-fold:tsp', 'rn-seenp-ipos:tsp', 'rn-seenp-pos:tsp'].forEach((k) => localStorage.removeItem(k)); });
  await p.evaluate(mk); await W(p, 800);
  let s = await st(p); ok(s.disp !== 'none' && !/ico/.test(s.cls), '패널이 펼쳐져 떠 있음'); ok(await p.$('#seenp [data-sp="ico"]') && await p.$('#seenp [data-sp="fold"]'), '머리줄에 ▾ 접기와 ▁ 아이콘 단추 둘 다');
  // ① 기존 머리줄 접기 그대로
  await p.click('#seenp [data-sp="fold"]'); await W(p, 100); s = await st(p); ok(/\bfold\b/.test(s.cls) && s.fold === '1' && /살핀 상품/.test(s.txt) && !/마지막:/.test(s.txt), `▾ 머리줄만 남기고 접기 (저장 ${s.fold})`);
  await p.click('#seenp [data-sp="fold"]'); await W(p, 100); s = await st(p); ok(!/fold|ico/.test(s.cls.replace('seenp', '')) && s.fold === '0' && /마지막:/.test(s.txt), '▴ 다시 펼침');
  // 패널 자리 옮겨 두기(펼침 자리)
  await drag(p, '#seenp .seenp-h b', -60, -120); const sp = await st(p); ok(sp.pos, `펼친 패널 자리 저장 ${sp.pos}`);
  // ② 아이콘으로 접기
  await p.click('#seenp [data-sp="ico"]'); await W(p, 150); s = await st(p);
  ok(/\bico\b/.test(s.cls) && s.fold === '2' && s.w <= 44 && s.h <= 44 && s.w >= 36, `▁ → 아이콘 하나(${Math.round(s.w)}×${Math.round(s.h)}) · 저장 ${s.fold}`);
  ok(s.bg === 'rgb(47, 93, 80)', `불투명 웹앱 녹색 (${s.bg})`); ok(!/마지막:|살핀 것 보통/.test(s.txt) && s.txt.includes(String(s.n)), `아이콘엔 살핀 수만 (${s.txt.trim()})`); ok(inView(s) && s.vw - s.r < 40 && s.vh - s.b < 60, `처음 자리 오른쪽 아래 화면 안 (${Math.round(s.x)},${Math.round(s.y)})`);
  // ③ 아이콘 끌어 옮기기 — 옮긴 뒤 놓아도 펼치지 않음 · 자리 저장
  await drag(p, '#seenp .seenp-icon', -150, -200); const s2 = await st(p); ok(/\bico\b/.test(s2.cls) && Math.abs(s2.x - (s.x - 150)) < 5 && Math.abs(s2.y - (s.y - 200)) < 5 && s2.ipos, `아이콘 끌어 옮김 (${Math.round(s.x)},${Math.round(s.y)}) → (${Math.round(s2.x)},${Math.round(s2.y)}) · 펼치지 않음 · 저장 ${s2.ipos}`);
  // ④ 화면 밖으로 안 나감(네 방향)
  for (const [dx, dy, nm] of [[-3000, -3000, '왼쪽 위'], [3000, 3000, '오른쪽 아래']]) { await drag(p, '#seenp .seenp-icon', dx, dy); const s3 = await st(p); ok(inView(s3) && /\bico\b/.test(s3.cls), `${nm} 끝까지 끌어도 화면 안 (${Math.round(s3.x)},${Math.round(s3.y)}) ${Math.round(s3.r)}/${s3.vw}`); }
  await drag(p, '#seenp .seenp-icon', -200, -250); const sKeep = await st(p);
  // ⑤ 새로고침 뒤 아이콘·자리 그대로
  await rl(p); await p.addStyleTag({ content: '.verbar{display:none!important}' }); await p.evaluate(require('./seed.js')); await p.evaluate(mk); await W(p, 600);
  s = await st(p); ok(/\bico\b/.test(s.cls) && Math.abs(s.x - sKeep.x) < 2 && Math.abs(s.y - sKeep.y) < 2, `새로고침 뒤 아이콘 그대로 · 자리 그대로 (${Math.round(s.x)},${Math.round(s.y)})`);
  // 화면 크기가 줄어도 안 나감
  await p.setViewportSize({ width: Math.max(320, vw - 300), height: 500 }); await W(p, 200); s = await st(p); ok(inView(s), `창이 작아져도 아이콘 화면 안 (${Math.round(s.r)}/${s.vw}, ${Math.round(s.b)}/${s.vh})`); await p.setViewportSize({ width: vw, height: vw < 500 ? 800 : 900 }); await W(p, 200);
  // ⑥ 아이콘 누르면 다시 펼침 — 펼친 패널은 원래 펼친 자리
  await p.click('#seenp .seenp-icon'); await W(p, 150); s = await st(p); const pp = JSON.parse(sp.pos);
  ok(!/\bico\b/.test(s.cls) && s.fold === '0' && /마지막:/.test(s.txt) && /살핀 것 보통/.test(s.txt), '아이콘 누름 → 다시 펼침'); ok(Math.abs(s.x - Math.min(pp.x, s.vw - s.w - 4)) < 3 && inView(s), `펼친 자리는 펼친 패널 자리로 (${Math.round(s.x)},${Math.round(s.y)} · 저장 ${sp.pos})`);
  // 키보드로도: 아이콘 → Enter
  await p.click('#seenp [data-sp="ico"]'); await W(p, 100); await p.focus('#seenp .seenp-icon'); await p.keyboard.press('Enter'); await W(p, 100); s = await st(p); ok(!/\bico\b/.test(s.cls), '아이콘에서 Enter로도 펼침');
  // ⑦ 머리줄 접기도 새로고침 뒤 유지
  await p.click('#seenp [data-sp="fold"]'); await W(p, 100); await rl(p); await p.addStyleTag({ content: '.verbar{display:none!important}' }); await p.evaluate(require('./seed.js')); await p.evaluate(mk); await W(p, 600);
  s = await st(p); ok(/\bfold\b/.test(s.cls) && !/\bico\b/.test(s.cls), '새로고침 뒤 머리줄 접힘 그대로'); await p.click('#seenp [data-sp="fold"]'); await W(p, 100);
  await p.evaluate(() => document.getElementById('tsp').remove()); await W(p, 1300);
  // ⑧ 패널이 나오는 모든 화면(알라딘 매입·📥 등록·🧮 수동 일괄·🔭 매입 상품 조회)에 ▁ 단추 · 아이콘 ↔ 펼침
  const chk = async (nm, key) => { const r = await p.evaluate(async (key) => { const el = document.getElementById('seenp'); if (!el || getComputedStyle(el).display === 'none') return { no: 1 }; const b = el.querySelector('[data-sp="ico"]'); if (!b) return { nob: 1, txt: el.innerText.slice(0, 80) }; b.click(); await new Promise((r) => setTimeout(r, 80)); const a = { ico: el.classList.contains('ico'), ls: localStorage.getItem('rn-seenp-fold:' + key), w: el.getBoundingClientRect().width }; const ic = el.querySelector('.seenp-icon'); ic && ic.click(); await new Promise((r) => setTimeout(r, 80)); a.back = !el.classList.contains('ico') && !!el.querySelector('.seenp-acts'); return a; }, key);
    ok(r.ico && r.ls === '2' && r.w <= 44 && r.back, `${nm}: ▁ 단추 → 아이콘 → 누르면 펼침 ${JSON.stringify(r)}`); };
  await p.evaluate(async () => { const L = [...S.plist.values()].filter((l) => l.active).slice(0, 8); S.bbuyRes = { hit: new Map(L.map((l) => [l.usedCode, { buy: 3000, floor: 4000, target: 4000 }])), scanned: L.length, at: Date.now() }; S.bbuySt = { moved: {}, skip: {}, cart: {} }; S._bbuyUn = () => {}; S.bbuyBusy = null; openAladinSell({ t: 'cand' }); await new Promise((r) => setTimeout(r, 500)); });
  await chk('🏷 알라딘 매입', 'bbuy'); await p.evaluate(() => history.back()); await W(p, 1300);
  await p.evaluate(async () => { const now = new Date().toISOString(); window.__FS.reg_items = {}; for (let i = 0; i < 6; i++) window.__FS.reg_items['r' + i] = { stage: 'sel', isbn: '978891000000' + i, q: '978891000000' + i, method: 'bulk', grade: 2, qty: 1, price: 5000 + i * 100, createdAt: now, info: { title: '등록 시험 책 ' + i, isbn13: '978891000000' + i, priceList: 15000, priceSales: 13500, page1: [], categories: ['국내도서'], at: now } }; S.regT = 'sel'; openRegister(); await new Promise((r) => setTimeout(r, 1500)); });
  await chk('📥 등록', 'reg'); await p.evaluate(() => history.back()); await W(p, 1000);
  await p.evaluate(async () => { const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 }; S.batchRes = [...S.plist.values()].filter((l) => l.active).map((l) => ({ l, target: l.price - 500, reasons: ['시험'], page1: [], at: '2026-11-01' })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {}; drawBatchRes(sh, { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }, 'g1'); await new Promise((r) => setTimeout(r, 400)); });
  await chk('🧮 수동 일괄', 'batch');
  await p.evaluate(async () => { S.detail = { bl: 1 }; S._blW = 1; S._blIW = { gid: 'g', un: () => {} }; S.blG = [{ id: 'g', name: '시험 조회', platforms: ['aladin'], status: 'done' }]; S.blItems = Array.from({ length: 12 }, (_, i) => ({ id: 'g__97889' + i, gid: 'g', title: '조회 책 ' + i, isbn13: '97889' + i, priceSales: 10000, usedMin: 3000 })); S.blView = { v: 'group', id: 'g' }; window.__FS.bench_lookup = { g: { name: '시험 조회', platforms: ['aladin'], status: 'done' } }; window.__FS.bench_lookup_items = Object.fromEntries(S.blItems.map((x) => [x.id, x])); const G0 = S.blG, I0 = S.blItems; await new Promise((r) => setTimeout(r, 300)); S.blG = G0; S.blItems = I0; document.getElementById('sheet').scrollTop = 0; blDraw(); await new Promise((r) => setTimeout(r, 600)); });
  await chk('🔭 매입 상품 조회', 'bl');
};
(async () => { await H(run(1400), { vp: { width: 1400, height: 900 } }); await H(run(390), { vp: { width: 390, height: 800 } }); console.log(bad ? `❌ tSPICO 실패 ${bad}` : '✓ tSPICO 통과'); })();
