// tSDX — 정범님 11/05 (네 번째) 출고별 매출 화면
//  ① 머리의 '오늘 매출'을 단추처럼 — 누르면 오늘 매출 자세히(📦 오늘 출고 › 💰 출고별 매출)로 · 머리 접고 펴기와 겹치지 않음 · 휴대폰 너비는 아래 줄
//  ② 휴대폰(390px)에서 표를 옆으로 끝까지 밀어도 출고일 칸이 왼쪽에 붙어 있음(예전엔 주문 칸 절반쯤에서 함께 밀려 사라짐)
//  ③ 칸 순서는 모든 기기 같음 — 관리자 기기에서 바꾸면 app_settings/main.sdCols · 관리자가 아닌 기기는 따르기만(끌리지 않음 · ↺ 없음) · 다른 기기에서 바뀌면 실시간으로
//  ④ '공휴일은 미리 들어 있음' 등 안내는 ⓘ 접힘/열림(기본 접힘 · 다시 그려도 그대로)
// 시험 자료 손님은 '손님A' (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSDX.js (pw/ 안 — harness.js·seed.js 옆)
let bad = 0, ran = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const H = require('./harness.js');
const seedF = () => { const td = dstr(new Date()); const bk = (n) => rkBack(td, n); window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
  S._sdL = true; S.shpDays = new Map(); S.orders = new Map(); let k = 0;
  const sale = (d, price) => { k++; const id = 'aladin_X' + k; S.orders.set(id, { id, orderNo: 'X' + k, kind: 'sale', platform: 'aladin', orderedAt: d + 'T09:00:00', shippedAt: d + 'T15:00:00', buyer: { name: '손님A' }, items: [{ title: '시험 책 ' + k, price, qty: 1, lineStatus: 'normal' }] }); };
  for (let i = 1; i <= 40; i++) sale(bk(i), 10000 + ((i * 7919) % 23) * 1000);
  S.ship = { orders: [], tabCounts: {}, at: new Date().toISOString() }; S.shipC = { orders: [], at: new Date().toISOString(), enrich: {} }; S.shipCFromCache = false; S.ordersLoaded = true; S.shipDayN = 40;
  S.shpDays.set(td, { day: td, source: 'tab', readAt: new Date().toISOString(), entries: [{ id: 'aladin_T1', orderNo: 'T1', ex: [], items: [{ title: '오늘 시험 책', price: 30000, qty: 1 }] }] }); S.shpDaysV = (S.shpDaysV || 0) + 1; S._sdm = null; S.ver = (S.ver || 0) + 1;
  try { ['rn-rkfx', 'rn-rkfx-seen', 'rn-rkfx-seen-o', 'rn-rkfx-hd', 'rn-sd-cols', 'rn-rkfx-day'].forEach((x) => localStorage.removeItem(x)); localStorage.setItem('rn-device', 'JS-MAIN'); localStorage.setItem('rn-rkfx-seen', JSON.stringify({ d: td, k: 'top', g: 3, low: 1 })); } catch (e) {} S.devOk = true; S._rkfxMg = 1; S._sdColMg = 1; S.app = { ...(S.app || {}), rankFx: { k: {}, on: false } }; delete S.app.sdCols;
  window.rkfxHeadSoon = () => {}; /* 축하·응원 연출은 다른 시험(tFX3·tFX4)이 봄 — 여기서는 화면을 가리지 않게 */ return { td }; };
const openSec = async () => { S.sec.o_shipday = true; if (S.tab === 'orders') S.tab = 'home'; uxTabGo('orders'); for (let i = 0; i < 60 && !document.getElementById('sd_tbl'); i++) await new Promise((r) => setTimeout(r, 150)); await new Promise((r) => setTimeout(r, 400)); };
(async () => {
  // ── 칸 하나: 휴대폰 390 — ② 출고일 칸 끝까지 · ① 오늘 매출 아래 줄·누르기 · ④ 안내 접힘
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + src.seed + ')')(); try { await (0, eval)('(' + src.open + ')')();
      const tw = document.getElementById('sd_tw'); o.xs = tw.classList.contains('xs'); o.max = tw.scrollWidth - tw.clientWidth; const L = [];
      for (const f of [0, 0.25, 0.5, 0.75, 1]) { tw.scrollLeft = Math.round(o.max * f); await W(80); const a = tw.getBoundingClientRect(); const rows = [...document.querySelectorAll('#sd_tbl tr')].slice(0, 6); L.push({ f, sl: tw.scrollLeft, off: Math.max(...rows.map((tr) => Math.abs(Math.round(tr.firstElementChild.getBoundingClientRect().left - a.left)))) }); }
      o.L = L; o.end = tw.scrollLeft >= o.max - 1; o.ov = document.documentElement.scrollWidth - innerWidth;
      /* 끝까지 민 채 첫 칸이 다음 칸을 덮고 있음(보이는 글이 출고일) */ { tw.scrollIntoView({ block: 'center' }); await W(150); const a = tw.getBoundingClientRect(); const td0 = document.querySelector('#sd_tbl tbody tr td'); const b = td0.getBoundingClientRect(); const e = document.elementFromPoint(a.left + 6, b.top + b.height / 2); o.hit = !!(e && td0.contains(e)); o.txt = td0.textContent.trim(); }
      /* ① 오늘 매출 — 아래 줄 · 바 안 */ { const bar = document.getElementById('sdbar').getBoundingClientRect(); const t = document.getElementById('sd_today'); const tr = t.getBoundingClientRect(); const ti = document.querySelector('#sdbar .sdb-t').firstChild; const rg = document.createRange(); rg.selectNodeContents(document.querySelector('#sdbar .sdb-t')); const first = rg.getClientRects()[0];
        o.today = { txt: t.textContent.trim(), top: Math.round(tr.top), titleTop: Math.round(first.top), l: Math.round(tr.left), r: Math.round(tr.right), barL: Math.round(bar.left), barR: Math.round(bar.right), barB: Math.round(bar.bottom), b: Math.round(tr.bottom), ov2: document.documentElement.scrollWidth - innerWidth }; }
      /* ④ 안내 접힘 */ { const d = document.getElementById('sd_help'); o.help = { has: !!d, open0: d && d.open, holi: d && /공휴일은 미리 들어 있음/.test(d.textContent), vis0: d ? [...d.querySelectorAll('p')].some((x) => x.checkVisibility()) : null }; d.querySelector('summary').click(); await W(150); o.help.open1 = d.open; o.help.vis1 = [...d.querySelectorAll('p')].some((x) => x.checkVisibility()); renderMainNow(); await W(300); o.help.keep = document.getElementById('sd_help').open; document.querySelector('#sd_help summary').click(); await W(150); o.help.close = !document.getElementById('sd_help').open; }
      /* 누르기 — 오늘 출고 › 💰 출고별 매출 · 머리 접힘 안 바뀜 */ { const sec0 = !!S.sec.o_shipday; document.getElementById('sd_today').click(); for (let i = 0; i < 30 && !(document.getElementById('sheet').classList.contains('on') && document.querySelector('#sheet .ss-hero')); i++) await W(150); await W(200); const sh = document.getElementById('sheet');
        o.go = { on: sh.classList.contains('on'), ship: !!(S.detail && S.detail.ship), tab: S.shipTab, hero: !!sh.querySelector('.ss-hero'), heroTxt: ((sh.querySelector('.ss-hero') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 80), sec: !!S.sec.o_shipday === sec0 }; if (sh.classList.contains('on')) { history.back(); await W(400); } }
      return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, { seed: seedF.toString(), open: openSec.toString() });
    console.log('  휴대폰:', JSON.stringify(r).slice(0, 1500));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.xs && r.max > 200 && r.end && r.L.every((x) => x.off <= 1) && r.hit && /오늘|\(/.test(r.txt) && r.ov <= 0, `휴대폰 390: 표를 옆으로 끝까지(${r.max}px) 밀어도 출고일 칸이 왼쪽에 붙어 있음 · 화면 가로 넘침 없음: ` + JSON.stringify(r.L));
    ok(r.today && /오늘 매출/.test(r.today.txt) && r.today.top > r.today.titleTop + 8 && r.today.l >= r.today.barL && r.today.r <= r.today.barR && r.today.b <= r.today.barB && r.today.ov2 <= 0, '휴대폰: 오늘 매출 단추는 아래 줄(제목 아래) · 머리 띠 안: ' + JSON.stringify(r.today));
    ok(r.help && r.help.has && !r.help.open0 && r.help.holi && !r.help.vis0 && r.help.open1 && r.help.vis1 && r.help.keep && r.help.close, "안내('공휴일은 미리 들어 있음' 등) 기본 접힘 · 누르면 펼침 · 다시 그려도 그대로 · 다시 누르면 접힘: " + JSON.stringify(r.help));
    ok(r.go && r.go.on && r.go.ship && r.go.tab === 'sales' && r.go.hero && /오늘/.test(r.go.heroTxt) && r.go.sec, '오늘 매출을 누르면 📦 오늘 출고 › 💰 출고별 매출(오늘 매출 자세히)로 · 머리 접고 펴기는 그대로: ' + JSON.stringify(r.go)); ran++;
  }, { vp: { width: 390, height: 800 }, touch: true });
  // ── 칸 둘: PC 1400 — ① 오늘 매출 같은 줄 · 키보드 · 머리 다른 곳은 접고 폄 ③ 관리자 기기 저장 → 모든 기기 · 관리자가 아닌 기기는 따르기만
  await H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (src) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; (0, eval)('(' + src.seed + ')')(); try { await (0, eval)('(' + src.open + ')')();
      { const t = document.getElementById('sd_today').getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(document.querySelector('#sdbar .sdb-t')); const f = rg.getClientRects()[0]; o.pcLine = Math.abs(Math.round(t.top - f.top)) <= 6 || Math.abs(Math.round((t.top + t.bottom) / 2 - (f.top + f.bottom) / 2)) <= 6; o.cur = getComputedStyle(document.getElementById('sd_today')).cursor; }
      /* 키보드 Enter */ { const t = document.getElementById('sd_today'); t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await W(600); o.key = !!(S.detail && S.detail.ship) && S.shipTab === 'sales'; if (document.getElementById('sheet').classList.contains('on')) { history.back(); await W(400); } }
      /* 머리의 다른 곳(제목)을 누르면 접힘 — 예전대로 */ { document.querySelector('#sdbar .sdb-h').click(); await W(300); o.fold = !S.sec.o_shipday && !(document.getElementById('sheet').classList.contains('on')); S.sec.o_shipday = true; renderMain(); await W(300); }
      return o; } catch (e) { o.err = e.message + ' ' + (e.stack || '').slice(0, 300); return o; } }, { seed: seedF.toString(), open: openSec.toString() });
    // 관리자 기기에서 끌기(실제 마우스) — 매출 칸을 맨 앞으로
    await p.evaluate(() => { const t = document.getElementById('sd_tbl'); document.body.scrollTop += t.getBoundingClientRect().top - 260; document.documentElement.scrollTop += t.getBoundingClientRect().top - 260; }); await p.waitForTimeout(400);
    const bx = async (k) => p.evaluate((k) => { const r = document.querySelector(`#sd_tbl th[data-sdcol="${k}"]`).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, k);
    const drag = async (from, to) => { const a = await bx(from), d = await bx(to); await p.mouse.move(a.x + a.w / 2, a.y + a.h / 2); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(a.x + a.w / 2 + (d.x + 3 - a.x - a.w / 2) * i / 8, a.y + a.h / 2); await p.mouse.up(); await p.waitForTimeout(700); };
    await drag('amt', 'd');
    const cols = () => p.evaluate(() => [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join());
    const g = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await W(300); const d = await db.collection('app_settings').doc('main').get(); const x = d.exists ? d.data() : {}; return { cols: [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(), shared: ((x.sdCols || {}).order || []).join(), by: (x.sdCols || {}).by || '', log: (x.sdColsLog || []).length, app: ((S.app.sdCols || {}).order || []).join(), ro: document.getElementById('sd_tbl').classList.contains('sd-ro'), reset: !!document.querySelector('[data-sdcolreset]') }; });
    // 관리자가 아닌 기기 — 같은 공유 값을 따름 · 끌어도 그대로 · ↺ 없음 · 이 기기의 예전 rn-sd-cols는 쓰지 않음
    await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); localStorage.setItem('rn-device', 'OTHER-PC'); localStorage.setItem('rn-sd-cols', JSON.stringify(['out', 'cash'])); S.devOk = true; renderMainNow(); await W(300); });
    const n0 = await p.evaluate(() => ({ adm: isAdminDevice(), cols: [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(), ro: document.getElementById('sd_tbl').classList.contains('sd-ro'), reset: !!document.querySelector('[data-sdcolreset]'), title: document.querySelector('#sd_tbl th').title, hint: ((document.getElementById('sd_help') || {}).textContent || '').includes('관리자 기기에서 정한 순서') }));
    await drag('cash', 'd'); const n1 = await cols(); const n2 = await p.evaluate(() => { const r = sdColSave(['q']); return { r, app: ((S.app.sdCols || {}).order || []).join() }; });
    // 다른(관리자) 기기에서 바뀜 → 실시간 수신으로 이 기기도 따라 바뀜
    const n3 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = ['out', 'd', 'src', 'cut', 'n', 'q', 'amt', 'rk', 'sh', 'cash']; await db.collection('app_settings').doc('main').set({ sdCols: { order: o, by: 'admin@x', at: new Date().toISOString() } }, { merge: true }); for (let i = 0; i < 20 && [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join() !== o.join(); i++) await W(150); return [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(); });
    // 관리자 기기로 돌아와 ↺ 처음대로 → 모든 기기
    const n4 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); localStorage.setItem('rn-device', 'JS-MAIN'); renderMainNow(); await W(300); const b = document.querySelector('[data-sdcolreset]'); if (b) b.click(); for (let i = 0; i < 30 && [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol)[0] !== 'd'; i++) await W(150); /* 시험은 다시 그리기가 몰려 늦게 그려질 수 있음 */ const d = await db.collection('app_settings').doc('main').get(); const x = d.data() || {}; return { had: !!b, cols: [...document.querySelectorAll('#sd_tbl th[data-sdcol]')].map((x) => x.dataset.sdcol).join(), shared: (x.sdCols || {}).order, log: (x.sdColsLog || []).length }; });
    console.log('  PC:', JSON.stringify([r, g, n0, n1, n2, n3, n4]).slice(0, 2000));
    ok(!r.err, '시험 중 오류 없음 ' + (r.err || ''));
    ok(r.pcLine && r.cur === 'pointer', 'PC: 오늘 매출 단추는 제목과 같은 줄 · 누를 수 있는 모양: ' + JSON.stringify([r.pcLine, r.cur]));
    ok(r.key, 'PC: 오늘 매출 단추 Enter로도 오늘 출고 › 💰 출고별 매출');
    ok(r.fold, '머리의 다른 곳을 누르면 예전대로 접고 폄(오늘 출고 화면은 안 열림)');
    ok(g.cols.startsWith('amt,d,') && g.shared === g.cols && g.app === g.cols && !!g.by && g.log >= 1 && !g.ro && g.reset, '관리자 기기에서 끌어 바꾸면 app_settings/main.sdCols에 저장(누가 · 기록 sdColsLog) — 모든 기기 같음: ' + JSON.stringify(g));
    ok(!n0.adm && n0.cols === g.cols && n0.ro && !n0.reset && /관리자 기기에서 정함/.test(n0.title) && n0.hint, '관리자가 아닌 기기: 공유 순서를 그대로 따름(이 기기 예전 값 무시) · 끌기 꺼짐 · ↺ 없음 · 안내 글: ' + JSON.stringify(n0));
    ok(n1 === g.cols && n2.r === false && n2.app === g.cols, '관리자가 아닌 기기에서 끌어도·저장 불러도 그대로(공유 값 안 바뀜): ' + JSON.stringify([n1, n2]));
    ok(n3 === 'out,d,src,cut,n,q,amt,rk,sh,cash', '다른 기기(관리자)에서 바꾼 순서가 실시간으로 이 기기에도: ' + n3);
    ok(n4.had && n4.cols === 'd,src,cut,n,q,amt,rk,sh,cash,out' && n4.shared === null && n4.log >= 2, '관리자 기기 ↺ 처음대로 → 공유 값도 처음대로(기록은 남음): ' + JSON.stringify(n4)); ran++;
  });
  ok(ran === 2, `시험 칸 둘이 끝까지 돎(${ran}/2)`);
  console.log(bad ? `❌ tSDX 실패 ${bad}` : '✓ tSDX 모두 통과'); process.exit(bad ? 1 : 0);
})();
