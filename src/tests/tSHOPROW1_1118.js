// tSHOPROW1_1118 — (11/18 shoprow1) 🎞 우리숍 첫 화면 한 줄 띠 · 끌면 관성으로 굴러감 · 끝과 처음이 이어져 끝없이 돎 · 내 섹션 더하기·차례·배수는 설정(정범님 11/18 12:08)
//   ① 순수 셈: 꾸밈 틀(shop/shop-look.js BQL) 새 칸 기본값·범위 · 굴러갈 책 수(PC 한 줄 × 배수) · 되감기(wrap)·책 한 칸 맞춤(snapTo) · 값 읽기(5천·1만 2천)
//      · 내 섹션 글(「제목 | 조건 | 작은 풀이」) 읽기 · 못 읽거나 「-」면 안 보임 · 줄 차례 글(이름·별명) · 옛 기본 줄 그대로 · 클라우드 /shop/cfg가 새 칸을 넘김 · 브라우저 창 없음
//   ② 화면(RN_UI=1 · playwright · 가짜 클라우드 · 지어낸 책 · 손님A 없음): PC 1280 · 휴대폰 390 — 줄마다 한 줄 띠 · 「전체」 고리 · 앞뒤 복제 · 끌면 움직이고 끝을 넘어도 이어짐
//      · 끈 뒤 책이 눌리지 않음(그냥 누르면 열림) · 세로로 밀면 화면이 내려감 · 내 섹션이 차례대로 나옴 · 띠 끄면 옛 가로 줄 · 움직임 줄이기 · 가로 넘침 0
// 실행: node src/tests/tSHOPROW1_1118.js · 화면까지: RN_UI=1 RN_SHOT=<사진 폴더> node src/tests/tSHOPROW1_1118.js
const fs = require('fs'); const path = require('path'); const http = require('http'); const os = require('os');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x !== undefined ? JSON.stringify(x).slice(0, 600) : ''); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BQL = require(path.join(ROOT, 'shop/shop-look.js')); const SH = require(path.join(ROOT, 'cloud/shop.js'));
(async () => {
console.log('① 순수 셈');
{ const c = BQL.cfgOf({});
  ok(c.rollOn === true && c.rollPc === 6 && c.rollMob === '2.4' && c.rollX === '2' && c.rollAuto === 'off' && c.rollBtn === true && c.rowOrder === '' && [1, 2, 3, 4, 5, 6].every((i) => c['sec' + i] === ''), '기본값: 한 줄 띠 켬 · PC 한 줄 6권 · 휴대폰 2.4권 · 배수 2 · 저절로 흐르기 끔 · ‹ › 단추 켬 · 내 섹션 비어 있음', c);
  ok(Object.keys(BQL.cfgDiff({})).length === 0 && c.rows.join() === 'kinds,new,rare,pick,sale,cheap,cats,seen,reviews,trust', '기본값만이면 저장할 칸 0 · 옛 기본 줄 10개 그대로');
  const d = BQL.cfgOf({ rollPc: 99, rollX: '9', rollMob: '7', rollAuto: 'z', rollOn: 'x', sec1: '<b>만원</b> 아래 | 1만원 아래' });
  ok(d.rollPc === 10 && d.rollX === '2' && d.rollMob === '2.4' && d.rollAuto === 'off' && !/[<>]/.test(d.sec1), '틀린 값은 범위 안으로·기본값으로 · 꺾쇠 글 지움', d);
  ok(BQL.rollN(c) === 12 && BQL.rollN(BQL.cfgOf({ rollPc: 10, rollX: '4' })) === 40 && BQL.rollN(BQL.cfgOf({ rollPc: 4, rollX: '3' })) === 12 && BQL.rollN(BQL.cfgOf({ rollPc: 3, rollX: '1.5' })) >= 3, '굴러갈 책 수 = PC 한 줄 × 배수(6×2=12 · 10×4=40 · 4×3=12) · 한 줄보다 적지 않음');
  ok(BQL.wrap(-5, 100) === 95 && BQL.wrap(250, 100) === 50 && BQL.wrap(0, 100) === 0 && BQL.snapTo(130, 50) === 150 && BQL.snapTo(124, 50) === 100, '되감기: 한 벌 너비 안으로(끝 다음은 처음) · 끈 뒤 책 한 칸에 맞춤');
  ok(BQL.money('5천') === 5000 && BQL.money('1만 2천') === 12000 && BQL.money('12,000') === 12000 && BQL.money('3만원') === 30000, '값 읽기: 5천 · 1만 2천 · 12,000 · 3만원');
  const s1 = BQL.secOf('만원 아래 | 1만원 아래 | 싼 책', 1); ok(s1 && s1.k === 'u1' && s1.t === '만원 아래' && s1.sub === '싼 책' && s1.api.pmax === '10000' && s1.href === '#/list?pr=-10000&s=new', '내 섹션 「만원 아래 | 1만원 아래 | 싼 책」 → 1만 원 아래 · 「전체」는 값 범위 목록', s1);
  const s2 = BQL.secOf('소설 | 분야 국내도서>소설, 세트 빼기, 싼 차례', 2); ok(s2 && s2.api.cp === '국내도서>소설' && s2.api.xs === 'x' && s2.api.s === 'low' && /cp=/.test(s2.href) && /xs=x/.test(s2.href) && /s=low/.test(s2.href), '분야·세트 빼기·싼 차례 묶음', s2);
  const s3 = BQL.secOf('최상 희귀본 | #/list?bd=rare&g=최상', 3); ok(s3 && s3.api.bd === 'rare' && s3.api.g === '최상', '목록 주소(#/list?…)를 그대로 붙여도 읽음', s3);
  const s4 = BQL.secOf('할인 | 할인, 3천-9천', 4); ok(s4 && s4.api.sale === '1' && s4.api.pmin === '3000' && s4.api.pmax === '9000', '할인 · 값 범위 3천-9천', s4);
  ok(BQL.secOf('-잠깐 숨김 | 할인', 1) === null && BQL.secOf('아무 말 | 아무 말', 1) === null && BQL.secOf('', 1) === null && BQL.secOf('제목만', 1) === null, '「-」로 시작하면 숨김 · 못 읽는 조건·빈 글·제목만은 안 보임(엉뚱한 책을 보이지 않음)');
  const H = BQL.homeRows(BQL.cfgOf({ sec1: '만원 아래 | 1만원 아래', rowOrder: '5천 원 아래, 새로 들어온 책, 내 섹션 1' }));
  ok(H.rows.join() === 'kinds,cheap,rare,pick,sale,new,u1,cats,seen,reviews,trust' && H.secs.u1 && H.secs.u1.t === '만원 아래', '줄 차례 글: 적은 줄끼리만 자리를 바꿈(5천 원 아래 ↔ 새로 들어온 책) · 내 섹션은 책 줄 뒤', H.rows);
  const H2 = BQL.homeRows(BQL.cfgOf({ sec2: '할인 | 할인', sec1: '-숨김 | 할인', rowOrder: '할인, 새 책' })); ok(!H2.secs.u1 && H2.secs.u2 && H2.rows.indexOf('u2') < H2.rows.indexOf('new') && H2.rows.indexOf('u2') > 0, '내 섹션 제목·별명으로도 차례 · 숨긴 섹션은 빠짐', H2.rows);
  ok(BQL.homeRows(BQL.cfgOf({})).rows.join() === 'kinds,new,rare,pick,sale,cheap,cats,seen,reviews,trust', '아무것도 안 적으면 줄 차례 그대로');
  const R = BQL.SCHEMA.filter((p) => p.group === '첫 화면 한 줄 띠').map((p) => p.k); const U = BQL.SCHEMA.filter((p) => p.group === '첫 화면 내 섹션').map((p) => p.k);
  ok(R.join() === 'rollOn,rollPc,rollMob,rollX,rollAuto,rollBtn,rowOrder' && U.join() === 'sec1,sec2,sec3,sec4,sec5,sec6' && BQL.SCHEMA.every((p) => /^[A-Za-z][A-Za-z0-9]{0,23}$/.test(p.k)) && BQL.SCHEMA.length <= 60, '⚙ 🎨 우리숍 꾸밈 카드에 「첫 화면 한 줄 띠」 7칸 · 「첫 화면 내 섹션」 6칸 · 칸 이름이 클라우드 공개 거름 안', [R, U]);
  const P = SH.pubCfg({ open: 1, look: { rollX: '3', rollPc: 5, sec1: '만원 아래 | 1만원 아래', rowOrder: '새 책' } }, null, {}); ok(P.look.rollX === '3' && P.look.rollPc === 5 && P.look.sec1 === '만원 아래 | 1만원 아래' && P.look.rowOrder === '새 책', '클라우드 /shop/cfg가 새 칸을 손님에게 그대로 넘김', P.look);
  const js = rd('shop/shop.js'); const css = rd('shop/shop.css'); const ix = rd('shop/index.html');
  ok(/function rollArm\(/.test(js) && /translate3d/.test(js) && /requestAnimationFrame\(rollTick\)/.test(js) && /prefers-reduced-motion/.test(js) && /touch-action: pan-y/.test(css) && /\.roll \.rt/.test(css), '엔진: transform + requestAnimationFrame · 세로 밀기는 화면에 · 움직임 줄이기 따름');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(rd('shop/shop-look.js') + js), '브라우저 창 없음(팝업 금지)');
  ok(/^0\.1\.([4-9]|\d\d)$/.test(BQL.VER) && new RegExp('shop-look\\.js\\?v=' + BQL.VER.replace(/\./g, '\\.')).test(ix) && /shop\.css\?v=0\.2\.(\d\d)/.test(ix), `판 번호: 꾸밈 틀 ${BQL.VER} · 첫 화면이 새 판을 부름`);
  ok(/xs: q\.xs \|\| ''/.test(js), '목록 화면이 주소의 세트 거름(xs)을 읽음 — 내 섹션 「세트 빼기」의 「전체」 고리가 맞게 거름'); }
if (!process.env.RN_UI) { console.log(bad ? `❌ tSHOPROW1_1118 ${bad}개 실패` : '✓ tSHOPROW1_1118 순수 셈 통과 (화면 시험은 RN_UI=1)'); process.exit(bad ? 1 : 0); }

console.log('② 화면(가짜 클라우드 · 지어낸 책)');
const SHOT = process.env.RN_SHOT || path.join(os.tmpdir(), 'shoprow1'); fs.mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
const CATS = ['소설/시/희곡', '인문학', '어린이', '경제경영', '역사', '에세이']; const COL = ['#2f4858', '#86bbd8', '#f26419', '#33658a', '#f6ae2d', '#55a630', '#9d4edd', '#e63946', '#264653', '#e9c46a'];
const T0 = ['푸른 바다의 기억', '도시의 새벽', '작은 정원 이야기', '오래된 지도', '별을 세는 밤', '나무와 바람', '고양이 탐정', '경제의 속살', '역사 산책', '여름 편지'];
const items = Array.from({ length: 120 }, (_, i) => { const c = CATS[i % 6]; const p = [1500, 3000, 4500, 6800, 9000, 12000, 18000][i % 7];
  return { id: 'X' + i, t: T0[i % 10] + ' ' + (i + 1), a: ['지은이A', '지은이B'][i % 2], pb: '출판사가', g: ['최상', '상', '중', '하'][i % 4], p, lp: Math.round(p * 2.2 / 100) * 100, im: `/s/cv/${i}.svg`, ph: [], at: new Date(Date.now() - i * 3 * 3600e3).toISOString(), c, cp: `국내도서>${c}`, isbn: '979110000' + String(i).padStart(4, '0'), bd: i % 4 === 0 ? ['rare'] : i % 5 === 0 ? ['pick'] : i % 3 === 0 ? ['sale'] : [], ...(i % 3 === 0 ? { p0: Math.round(p * 1.3) } : {}), q: 1 }; });
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${COL[n % COL.length]}"/><text x="150" y="190" font-size="64" text-anchor="middle" fill="#fff" font-family="sans-serif">${n + 1}</text></svg>`;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
let LOOKCFG = {}; const SHOPDIR = process.env.RN_SHOPDIR || path.join(ROOT, 'shop'); const LISTQ = [];
const srv = http.createServer((req, res) => { const u = new URL(req.url, 'http://x'); const J = (o, s) => { res.writeHead(s || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); }; const q = Object.fromEntries(u.searchParams);
  if (u.pathname === '/shop/a') return J({ ok: true, me: null });
  if (u.pathname === '/shop/cfg') { const T = SH.catTree(items); return J({ ok: true, open: 1, name: '북스퀸', n: items.length, shipFee: 3500, freeOver: 30000, pay: { how: 'wait' }, biz: { name: '북스퀸', ceo: '대표A', no: '000-00-00000' }, kinds: T.kinds, cats: CATS.map((c, i) => [c, 20 - i]), shelf: {}, promo: {}, look: LOOKCFG }); }
  if (u.pathname === '/shop/cats') return J({ ok: true, n: items.length, ...SH.catTree(items) });
  if (u.pathname === '/shop/list') { LISTQ.push(u.search); const r = SH.listItems(items, q); return J({ ok: true, ...r }); }
  if (u.pathname === '/shop/item') { const x = items.find((y) => y.id === q.id); return x ? J({ ok: true, item: { ...x, st: 's', cpk: x.cp }, info: { b: {}, t: {} }, same: [], rel: [] }) : J({ ok: false }, 404); }
  if (u.pathname.startsWith('/shop/')) return J({ ok: true });
  const m = u.pathname.match(/^\/s\/cv\/(\d+)\.svg$/); if (m) { res.writeHead(200, { 'Content-Type': 'image/svg+xml' }); return res.end(svg(+m[1])); }
  const f = path.join(SHOPDIR, u.pathname.replace(/^\/s\//, '').replace(/\.\./g, '') || 'index.html'); if (!u.pathname.startsWith('/s/') || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('{}'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const kill = setTimeout(() => { console.log('  ❌ 300초 넘음'); process.exit(1); }, 300000); const br = await chromium.launch({ args: ['--disable-gpu', '--no-sandbox'] });
const M = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }; const PC = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };
const newp = async (o) => { const ctx = await br.newContext(o); const p = await ctx.newPage(); const errs = []; const dlg = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dlg.push(d.message()); d.dismiss().catch(() => {}); }); await p.addInitScript((u) => { window.BQ_API = u; }, base); return { ctx, p, errs, dlg }; };
const home = async (p) => { await p.goto(base + '/s/index.html?r=' + Date.now() + '#/'); await p.waitForSelector('#nwg [data-roll] .card', { timeout: 15000 }); for (let y = 0; y < 14; y++) { await p.evaluate(() => window.scrollBy(0, 600)); await p.waitForTimeout(120); } await p.waitForTimeout(500); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); };
const strip = (p, sel) => p.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const st = el._rl; const tr = el.querySelector('.rt'); const m = /translate3d\((-?[\d.]+)px/.exec(tr.style.transform || ''); const vr = el.querySelector('.rv').getBoundingClientRect();
  const vis = [...tr.children].filter((c) => { const r = c.getBoundingClientRect(); return r.left >= vr.left - 2 && r.right <= vr.right + 2; }).length;
  return { n: st && st.n, kids: tr.children.length, clones: tr.querySelectorAll('.rc').length, loop: st && st.loop, x: m ? -parseFloat(m[1]) : 0, S: st && st.S, step: st && st.step, pos: st && st.pos, vis, nol: el.classList.contains('nol'), btn: getComputedStyle(el.querySelector('.rb')).display !== 'none', title: (el.closest('.sec') && el.closest('.sec').querySelector('h2') || {}).textContent || '' }; }, sel);
const drag = async (p, sel, dx, steps, ms) => { await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollBy(0, r.top - 120); }, sel); await p.waitForTimeout(60); const b = await p.locator(sel + ' .rv').boundingBox(); const y = b.y + b.height * 0.35; const x0 = b.x + b.width / 2; await p.mouse.move(x0, y); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(x0 + (dx * i) / steps, y); await p.waitForTimeout(ms || 16); } await p.mouse.up(); };
try {
  for (const [nm, O] of [['pc1280', PC], ['m390', M]]) { const { ctx, p, errs, dlg } = await newp(O); LOOKCFG = { sec1: '만원 아래 | 1만원 아래 | 지갑 가벼운 날', rowOrder: '5천 원 아래, 새로 들어온 책' };
    await home(p);
    const A = await strip(p, '#nwg [data-roll]'); const per = nm === 'pc1280' ? 6 : 2;
    ok(A && A.n === 12 && A.clones === 24 && A.kids === 36 && A.loop && !A.nol, `${nm} 새로 들어온 책 띠: 책 12권(PC 6 × 배수 2) + 앞뒤 복제 24 · 끝없이 돎`, A);
    ok(A && A.vis >= per && A.vis <= per + 1, `${nm} 한 화면에 ${A && A.vis}권(설정 ${nm === 'pc1280' ? 'PC 6' : '휴대폰 2.4'})`, A);
    const all = await p.evaluate(() => [...document.querySelectorAll('#hc .sec')].map((s) => ({ h: (s.querySelector('h2') || {}).textContent || '', roll: !!s.querySelector('[data-roll]'), more: (s.querySelector('.sec-h a') || {}).getAttribute ? s.querySelector('.sec-h a').getAttribute('href') : '' })).filter((x) => x.roll));
    const T = all.map((x) => x.h.replace(/오늘.*$/, '').trim()); const iC = T.findIndex((t) => /5천 원 아래/.test(t)), iN = T.findIndex((t) => /새로 들어온 책/.test(t)), iU = T.findIndex((t) => /만원 아래/.test(t) && !/5천/.test(t));
    ok(iC >= 0 && iN > iC && iU > iN && all[iU].more === '#/list?pr=-10000&s=new' && all.every((x) => x.more), `${nm} 줄 차례: 5천 원 아래 → 새로 들어온 책 → … 내 섹션 「만원 아래」 · 줄마다 「전체」 고리`, all);
    const u1 = await strip(p, `#hc .sec:nth-of-type(${1 + (await p.evaluate(() => [...document.querySelectorAll('#hc .sec')].findIndex((s) => /만원 아래/.test(s.textContent) && !/5천/.test((s.querySelector('h2') || {}).textContent))))}) [data-roll]`);
    ok(u1 && u1.n >= 6, `${nm} 내 섹션 띠에 1만 원 아래 책`, u1);
    if (nm === 'pc1280') ok(A.btn, 'PC: ‹ › 단추 보임'); else ok(!A.btn, '휴대폰: ‹ › 단추 숨김(손가락으로 끔)');
    await p.evaluate(() => window.scrollTo(0, 0));
    await shot(p, nm + '_home', false);
    // 끌기: 왼쪽으로 한 벌 너비보다 더 끌어도 이어짐
    const S = A.S; let L = []; for (let k = 0; k < 4; k++) { await drag(p, '#nwg', -(A.step * 2.5), 10, 16); await p.waitForTimeout(80); L.push(await strip(p, '#nwg [data-roll]')); }
    await p.waitForTimeout(1300); const B1 = await strip(p, '#nwg [data-roll]');
    ok(Math.abs(B1.pos) > A.step * 6 && B1.x >= 0 && B1.x <= 2 * S + 1 && Math.abs((B1.x / B1.step) - Math.round(B1.x / B1.step)) < 0.02, `${nm} 끌기 네 번(한 벌 너비 넘게) → 처음 책 다음으로 이어짐 · 그림 위치는 늘 복제 안(${Math.round(B1.x)}px / ${Math.round(2 * S)}) · 책 한 칸에 맞춤`, { B1, L: L.map((z) => Math.round(z.x)) });
    const before = await p.evaluate(() => location.hash); await drag(p, '#nwg', A.step * 1.2, 6, 16); await p.waitForTimeout(250); const after = await p.evaluate(() => location.hash);
    ok(before === after, `${nm} 끈 뒤 손을 뗀 자리의 책이 열리지 않음(잘못 눌림 막음)`, [before, after]);
    // 빠르게 튕기면 관성으로 더 감
    await p.waitForTimeout(700); const f0 = await strip(p, '#nwg [data-roll]'); await drag(p, '#nwg', -A.step * 0.8, 3, 8); await p.waitForTimeout(1400); const f1 = await strip(p, '#nwg [data-roll]');
    ok(f1.pos - f0.pos > A.step * 0.8 + 2, `${nm} 빠르게 튕기면 관성으로 끈 거리보다 더 굴러감(${Math.round((f1.pos - f0.pos) / A.step * 10) / 10}칸)`, [f0.pos, f1.pos]);
    await shot(p, nm + '_after_drag', false);
    // (11/18 사진 칸 고르게) 띠가 화면에 들어오면 사진을 한꺼번에 받음(복제 칸까지) · 사진 칸은 사진과 상관없이 칸 너비 그대로 3:4
    const G = await p.evaluate((PXs) => { const el = document.querySelector('#nwg [data-roll]'); const C = [...el.querySelectorAll('.rt > .cw')]; const im0 = C[0].querySelector('.im img'); const keep = im0.getAttribute('src'); im0.setAttribute('src', PXs);
      const R = C.map((c) => { const w = c.getBoundingClientRect().width, m = c.querySelector('.card .im').getBoundingClientRect(); return [Math.round(w * 10) / 10, Math.round(m.width * 10) / 10, Math.round(m.height * 10) / 10]; }); im0.setAttribute('src', keep);
      return { left: el.querySelectorAll('img[data-src],img[loading="lazy"]').length, n: C.length, bad: R.filter((r) => Math.abs(r[0] - r[1]) > 1 || Math.abs(r[2] - r[1] * 4 / 3) > 1.5), r0: R[0] }; }, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    ok(G.left === 0 && G.n === A.kids && !G.bad.length, `${nm} 띠 사진 한꺼번에 받음(남은 칸 ${G.left}) · 사진 칸 ${G.n}개 모두 칸 너비 그대로 3:4(1×1 빈 그림이어도)`, G);
    // 그냥 누르면 책이 열림
    await p.waitForTimeout(500); await p.evaluate(() => { const r = document.querySelector('#nwg').getBoundingClientRect(); window.scrollBy(0, r.top - 120); }); await p.waitForTimeout(100); const vis = await p.evaluate(() => { const vr = document.querySelector('#nwg .rv').getBoundingClientRect(); const c = [...document.querySelectorAll('#nwg .rt > .cw')].find((x) => { const r = x.getBoundingClientRect(); return r.left > vr.left + 4 && r.right < vr.right - 4; }); const a = c && c.querySelector('a[href^="#/b/"]'); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 60), h: a.getAttribute('href') }; });
    if (vis) { await p.mouse.click(vis.x, vis.y); await p.waitForTimeout(500); } const h2 = await p.evaluate(() => location.hash); ok(vis && h2 === vis.h, `${nm} 끌지 않고 누르면 책이 열림(${h2})`, vis);
    // 세로로 밀면 화면이 내려감(띠가 막지 않음)
    await home(p); const y0 = await p.evaluate(() => scrollY); const b = await p.locator('#nwg .rv').boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + 40); await p.mouse.wheel(0, 400); await p.waitForTimeout(400); const y1 = await p.evaluate(() => scrollY); const st2 = await strip(p, '#nwg [data-roll]');
    ok(y1 > y0 + 100 && Math.abs(st2.pos) < 1, `${nm} 띠 위에서 세로 굴리기 → 화면이 내려감 · 띠는 그대로`, [y0, y1, st2.pos]);
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) && !errs.length && !dlg.length, `${nm} 가로 넘침 0 · 오류 0 · 브라우저 창 0`, { errs, dlg });
    await ctx.close(); }
  { // 설정: 배수 3 · PC 5권 · 띠 끄기 · 움직임 줄이기
    const { ctx, p } = await newp(PC); LOOKCFG = { rollPc: 5, rollX: '3' }; await home(p); const A = await strip(p, '#nwg [data-roll]');
    ok(A && A.n === 15 && A.vis >= 5 && A.vis <= 6, `설정 PC 5권 × 배수 3 → 띠에 ${A && A.n}권 · 한 화면 ${A && A.vis}권`, A);
    const q24 = LISTQ.filter((s) => /s=new/.test(s) && /p=1/.test(s)).length; LOOKCFG = { rollPc: 10, rollX: '4' }; await home(p); const A2 = await strip(p, '#nwg [data-roll]');
    ok(A2 && A2.n === 40 && LISTQ.filter((s) => /s=new/.test(s) && /p=1/.test(s)).length > q24, `배수 4 × 10권 = 40권 → 한 쪽(24권)보다 많아 다음 쪽도 받아 이어 붙임(${A2 && A2.n}권)`, A2);
    LOOKCFG = { rollOn: false }; await home(p).catch(() => {}); await p.waitForSelector('#nwg .rail .card', { timeout: 15000 }); const old = await p.evaluate(() => ({ roll: document.querySelectorAll('[data-roll]').length, rail: document.querySelectorAll('#hc .grid.rail').length }));
    ok(old.roll === 0 && old.rail >= 3, '「한 줄 띠」를 끄면 예전 가로 줄 그대로', old);
    await ctx.close(); }
  { const { ctx, p } = await newp({ ...PC, reducedMotion: 'reduce' }); LOOKCFG = { rollAuto: 'mid' }; await home(p); const a = await strip(p, '#nwg [data-roll]'); await p.waitForTimeout(1500); const b = await strip(p, '#nwg [data-roll]');
    ok(a.pos === b.pos, '기기 「움직임 줄이기」면 저절로 흐르기 없음', [a.pos, b.pos]); await ctx.close();
    const P2 = await newp(PC); await home(P2.p); await P2.p.mouse.move(5, 5); const c0 = await strip(P2.p, '#nwg [data-roll]'); await P2.p.waitForTimeout(5800); const c1 = await strip(P2.p, '#nwg [data-roll]');
    ok(c1.pos > c0.pos + 20, `저절로 흐르기(보통) 켜면 천천히 흐름(${Math.round(c1.pos - c0.pos)}px)`, [c0.pos, c1.pos]); await P2.ctx.close(); }
} catch (e) { bad++; console.log('  ❌ 화면 시험 오류', e.message.split('\n')[0]); }
await br.close(); srv.close(); clearTimeout(kill);
console.log(bad ? `❌ tSHOPROW1_1118 ${bad}개 실패` : `✓ tSHOPROW1_1118 통과 · 사진 ${SHOT}`); process.exit(bad ? 1 : 0);
async function shot(p, n, full) { await p.screenshot({ path: path.join(SHOT, n + '.png'), fullPage: !!full }); }
})();
