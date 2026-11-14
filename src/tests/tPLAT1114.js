// tPLAT1114 — (11/14 일꾼 plat1) 🧩 세 판매처 한 화면 관리: 상품 상세 맨 위 판매처 칸(앞단) · 묶음(더 보기) · ⚙ 설정 · 📚 상품 전체 보기 한 줄 보기·🧩 판매처 거르기·☑ 일괄
//   단추는 모두 기존 함수를 부르는지(peQueue·ledY24Go·ledNvGo·y24RegGo — 가짜로 바꿔 받은 값만 봄 · 실제로 안 보냄) · 🟩 네이버 쓰기 꺼짐이면 막힘 · PC 1400 · 휴대폰 390 가로 넘침 0
// 실행: pw/ 안 RN_PORT=<포트> node tPLAT1114.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const HP = path.join(__dirname, 'harness.js');
if (!fs.existsSync(HP) || !process.env.RN_PORT) { console.log('… 웹앱 시험은 빌드 폴더 pw에서 RN_PORT로(건너뜀)'); console.log('✓ tPLAT1114(건너뜀) 통과'); process.exit(0); }
const seedFn = () => { for (let i = 0; i < 12; i++) { const uc = 'U2159834' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(404935000 + i), title: '시험 책 ' + i, isbn13: '97889' + String(10000000 + i), price: 5000 + i * 700, qty: 1, grade: ['최상', '상', '중'][i % 3], status: i === 3 ? '판매완료' : i === 4 ? '일시판매중지' : '판매중', active: i !== 3, sku: 'PNK_ms', registeredAt: '2026-10-' + String(10 + i) + 'T10:00:00', lastSeenAt: new Date(Date.now() - 600e3).toISOString(), bookId: 'bk' + i }); }
  for (let i = 0; i < 4; i++) S.y24.list.set(String(195000000 + i), { id: String(195000000 + i), goodsNo: String(195000000 + i), title: '시험 책 ' + i, isbn13: '97889' + String(10000000 + i), grade: ['최상', '상', '중'][i % 3], price: 5500 + i * 700, stock: 1, state: i === 2 ? '08' : '02', firstSeenAt: '2026-11-01T00:00:00Z', lastSeenAt: new Date(Date.now() - 2400e3).toISOString() });
  S.y24.list.set('195999999', { id: '195999999', goodsNo: '195999999', title: '예스24에만 있는 책', isbn13: '9788999999999', grade: '상', price: 9000, stock: 1, state: '02' });
  S.y24.loaded = true; S.y24.ver = (S.y24.ver || 0) + 1; S.prodLoaded = true; S.pmatchLoaded = true; S.ver++; };
const run = (vp) => require(HP)(async (p) => {
  await p.waitForTimeout(1200); const mob = vp.width < 500;
  await p.evaluate(seedFn);
  console.log(mob ? '— 휴대폰 390' : '— PC 1400');
  await p.evaluate(() => openProduct('aladin_U215983410')); await p.waitForTimeout(1200);
  const a = await p.evaluate(() => { const sh = document.querySelector('#sheet'); const c = sh.querySelector('#platcard'); const L = [...sh.querySelectorAll('.plat-lane')].map((x) => ({ k: x.dataset.platk, st: x.querySelector('.plat-st').textContent.trim(), acts: [...x.querySelectorAll('.plat-acts button')].map((b) => b.textContent.trim()), sy: (x.querySelector('.plat-sy') || {}).textContent || '' }));
    const G = [...sh.querySelectorAll('.plat-grp')].map((d) => [d.dataset.pdg, d.open]); const bar = [...sh.querySelectorAll('.plat-bar button')].map((b) => b.textContent.trim()); return { has: !!c, L, G, bar, sw: sh.scrollWidth, cw: sh.clientWidth, top: c ? Math.round(c.getBoundingClientRect().top) : null, nCard: sh.querySelectorAll('.card').length, ped: !!sh.querySelector('#pedbox') }; });
  ok(a.has && a.top < 140, '상세 맨 위에 🧩 판매처 칸(앞단)', a.top);
  ok(a.L.map((x) => x.k).join() === 'aladin,yes24,naver', '판매처 칸 셋 — 알라딘·예스24·네이버(우리숍은 처음 숨김)', a.L);
  ok(/판매중/.test(a.L[0].st) && a.L[0].acts.some((t) => /맡기기/.test(t)) && a.L[0].acts.some((t) => /중지/.test(t)) && /읽음 10분 전/.test(a.L[0].sy), '🟥 알라딘: 판매중 · 💲 맡기기·⏸ 중지 · 읽음 10분 전', a.L[0]);
  ok(/판매중/.test(a.L[1].st) && a.L[1].acts.some((t) => /맡기기/.test(t)) && /읽음 40분 전/.test(a.L[1].sy), '🟦 예스24: 판매중 · 💲 맡기기(🧰 운영과 같은 data-y24pgo 길)', a.L[1]);
  ok(/승인 대기/.test(a.L[2].st) && !a.L[2].acts.length, '🟩 네이버: 🔒 승인 대기 · 단추 없음(설정 쓰기 꺼짐)', a.L[2]);
  ok(a.bar.length === 7 && a.G.find((g) => g[0] === 'money')[1] === true && a.G.find((g) => g[0] === 'book')[1] === false && a.G.find((g) => g[0] === 'plat')[1] === false, '묶음 바 7 · 💰 펼침 · 📖·🧩 자세히 처음 접힘(옛 칸은 그 안에 그대로)', a.G);
  ok(a.ped && a.nCard >= 21, '옛 칸 모두 남음(✏ 상품 정보·채널별 포함 · 카드 ' + a.nCard + ')');
  ok(a.sw <= a.cw + 1, '가로 넘침 없음 ' + a.sw + '/' + a.cw);
  // 단추 → 기존 함수
  const b = await p.evaluate(async () => { const got = []; const o1 = window.peQueue, o2 = window.ledY24Go, o3 = window.ledNvGo; window.peQueue = async (l, ch, before) => { got.push(['pe', l.id, ch, before]); return 'x'; }; window.ledY24Go = async (it, o) => { got.push(['y24', it.map((z) => [z.T.alId, z.a.k, z.a.no]), o]); return ''; }; window.ledNvGo = async () => { got.push(['nv']); return ''; };
    const click2 = async (sel) => { const e = document.querySelector(sel); e.click(); await new Promise((r) => setTimeout(r, 450)); const e2 = document.querySelector(sel); e2.click(); await new Promise((r) => setTimeout(r, 300)); };
    const inp = document.querySelector('[data-platpx="al|aladin_U215983410"]'); inp.value = '6200'; await click2('[data-platgo="al|price|aladin_U215983410"]');
    await click2('[data-platgo="al|stop|aladin_U215983410"]'); await click2('[data-platgo="y24|down|aladin_U215983410"]');
    const nvOff = platNvWhy(); window.peQueue = o1; window.ledY24Go = o2; window.ledNvGo = o3; return { got, nvOff }; });
  ok(b.got[0] && b.got[0][0] === 'pe' && b.got[0][2].price === 6200 && b.got[0][3].price === 5000, '💲 알라딘 = peQueue({price}) 두 번 누름 뒤에만', b.got[0]);
  ok(b.got[1] && b.got[1][2].state === '일시판매중지', '⏸ 알라딘 = peQueue({state:일시판매중지})', b.got[1]);
  ok(b.got[2] && b.got[2][0] === 'y24' && b.got[2][1][0][1] === 'down' && b.got[2][1][0][2] === '195000000', '⏸ 예스24 = ledY24Go(장부 🛠 처리할 일과 같은 길)', b.got[2]);
  ok(/승인 대기/.test(b.nvOff), '🟩 네이버 쓰기 꺼짐 까닭', b.nvOff);
  if (!mob) {
    const c = await p.evaluate(async () => { const r0 = (S.app || {}).plat; S.app.plat = { ...(r0 || {}), on: 0 }; S._prodDraw(); await new Promise((r) => setTimeout(r, 300)); const off = { wrap: !!document.querySelector('#sheet .plat-wrap'), card: !!document.querySelector('#platcard'), n: document.querySelectorAll('#sheet .card').length };
      S.app.plat = { ...(r0 || {}), on: 1, chs: ['yes24', 'aladin', 'naver', 'shop'], hide: { shop: 1, naver: 1 }, grp: ['money', 'look', 'plat', 'stock', 'hist', 'book', 'note'] }; S._prodDraw(); await new Promise((r) => setTimeout(r, 300));
      const on = { L: [...document.querySelectorAll('.plat-lane')].map((x) => x.dataset.platk), G: [...document.querySelectorAll('.plat-grp')].map((d) => d.dataset.pdg) }; S.app.plat = r0; return { off, on }; });
    ok(!c.off.wrap && !c.off.card && c.off.n >= 21, '설정 끔 = 예전 상세 그대로(묶음·판매처 칸 없음)', c.off);
    ok(c.on.L.join() === 'yes24,aladin' && c.on.G[0] === 'money', '설정 순서·숨기기가 따라감(판매처·묶음)', c.on);
    const d = await p.evaluate(() => { const C = platCfg({ chs: ['zzz', 'naver'], grp: 'x', fold: null, nvWrite: 'yes' }); return { chs: C.chs, grp: C.grp.length, nv: C.nvWrite, fold: C.fold }; });
    ok(d.chs.join() === 'naver,aladin,yes24,shop' && d.grp === 7 && d.nv === 1, '설정 읽기 — 모르는 값은 빼고 빠진 것은 뒤에', d);
    const e = await p.evaluate(() => { localStorage.removeItem('rn-regplat-y24'); const r0 = (S.app || {}).plat; S.app.plat = { defCh: { y24: 1 } }; const a1 = regPlatOn('y24'); localStorage.setItem('rn-regplat-y24', '0'); const a2 = regPlatOn('y24'); localStorage.removeItem('rn-regplat-y24'); S.app.plat = r0; return [a1, a2, regPlatOn('y24')]; });
    ok(e[0] === true && e[1] === false && e[2] === false, '🚦 새 기기 기본 판매처 = 설정 · 이 기기에서 바꾼 값이 먼저', e);
    // 목록
    await p.evaluate(() => history.back()); await p.waitForTimeout(400); await p.evaluate(() => openProdAll()); await p.waitForTimeout(900);
    const f = await p.evaluate(() => { const sh = document.querySelector('#sheet'); const rows = sh.querySelectorAll('tr[data-btpid], tr[data-y24pid]'); const y = sh.querySelectorAll('tr[data-y24pid]').length; const th = [...sh.querySelectorAll('.bt-tb th')].map((x) => x.textContent.trim()); const btn = [...sh.querySelectorAll('[data-btf^="plat|"]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()); return { n: rows.length, y, th, btn, chips: sh.querySelectorAll('.plat-chip').length }; });
    ok(f.y === 1 && f.n === 13, '🧩 한 줄 보기 — 알라딘과 이어진 예스24 4줄은 알라딘 줄에 붙고 예스24에만 있는 1줄만 따로', f);
    ok(f.th.includes('판매처') && f.chips > 20, '판매처 칩 칸', f.th);
    ok(f.btn.some((t) => /예스24 미등록\(알라딘 판매중\) 7/.test(t)), '🧩 판매처 거르기 — 예스24 미등록(알라딘 판매중) 7', f.btn);
    const g = await p.evaluate(async () => { document.querySelector('#plb_on').click(); await new Promise((r) => setTimeout(r, 200)); ['aladin_U215983410', 'aladin_U215983411', 'aladin_U215983412', 'aladin_U215983415'].forEach((id) => { const cb = document.querySelector(`[data-platsel="${id}"]`); cb.checked = true; cb.dispatchEvent(new Event('change')); });
      const got = []; const o2 = window.ledY24Go; window.ledY24Go = async (it) => { got.push(it.map((z) => [z.T.alId, z.a.k])); return ''; }; const b = () => document.querySelector('[data-plb="y24down"]'); b().click(); await new Promise((r) => setTimeout(r, 450)); b().click(); await new Promise((r) => setTimeout(r, 400)); window.ledY24Go = o2;
      const nv = document.querySelector('[data-plb="nvdown"]').disabled; return { got, nv, n: document.querySelector('.platn').textContent }; });
    ok(g.got[0] && g.got[0].length === 2 && g.got[0].every((x) => x[1] === 'down'), '☑ 일괄 예스24 중지 — 고른 4개 중 예스24 판매중 2개만 ledY24Go로', g);
    ok(g.nv === true, '☑ 일괄 🟩 네이버 중지 — 쓰기 꺼짐이면 흐림', g.nv);
  }
}, { vp });
(async () => { await run({ width: 1400, height: 900 }); await run({ width: 390, height: 844 }); console.log(bad ? `❌ tPLAT1114 ${bad}개 실패` : '✓ tPLAT1114 모두 통과'); process.exit(bad ? 1 : 0); })();
