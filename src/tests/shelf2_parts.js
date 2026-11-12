// shelf2_parts — tSHELF1111이 부르는 (11/11 shelf2) 늘린 시험 조각(혼자 돌리지 않음) · 시험 자료는 지어낸 책(손님 정보 없음 · 전화는 010-0000-0000만)
//   pure: 책등 조합 수(실제 목록 × CSS 규칙) · 영구 모양(encode·decode) · 고르는 차례(책등 그림 → 앞표지 대표색 → 제목 낱말·분야 → 랜덤) · 판형 크기 · 글 맞추기
//   cloud: 판형 sz · 책등 모양 저장 창구 /shop/spines(먼저 정한 것이 이김 · 세대) · 장바구니 살펴보기 /shop/check · 장바구니 고침 셈
//   ui·mobile: 영구 모양(설정을 바꿔도·다른 기기에서도 같은 책 같은 모양) · 다시 정하기 · 책장 종류 14 사진 · 장바구니 알림·무료 배송 막대 · 주문서 바로 검사 · 휴대폰 주문 단추
const fs = require('fs'); const path = require('path'); const http = require('http');

function pure(ok, BQS, items, ROOT) {
  const css = fs.readFileSync(path.join(ROOT, 'shop/shelf.css'), 'utf8'); const has = (re) => re.test(css);
  const cb = BQS.combos(); const dCss = [...new Set([...css.matchAll(/\.sp\[data-d="(\d+)"\]/g)].map((m) => +m[1]))].length + 1, pCss = [...new Set([...css.matchAll(/\.sp\[data-p="(\d+)"\]/g)].map((m) => +m[1]))].length + 1, sCss = ([...new Set([...css.matchAll(/\[data-s="(\d+)"\]/g)].map((m) => +m[1]))].length + 1) /* (shelf7) :is([data-s="11"], …) 묶음 규칙도 셈 */ * ([...new Set([...css.matchAll(/\.sp\[data-h="(\d+)"\]/g)].map((m) => +m[1]))].length + 1);
  ok(cb.core === 57 * 98 * 72 * 68 * 115 /* (shelf7) 디자인 57 · 색 98 · 무늬 72 · 모양 115(몸 23 × 머리 5) — 덧붙이기만 */ && cb.C === 98 && cb.P === 72 && cb.S === 115 && cb.uq && cb.uq.N >= 1e8 && cb.total === cb.core * 4 * 2 && dCss === cb.D && pCss === cb.P && sCss === cb.S, `책등 조합 ${cb.total.toLocaleString('ko-KR')}가지 = 디자인 ${cb.D}(CSS ${dCss}) × 색 ${cb.C} × 무늬 ${cb.P}(CSS ${pCss}) × 글꼴 ${cb.F} × 모양 ${cb.S}(몸×머리 CSS ${sCss}) × 장식색 ${cb.A} × 글 방향 ${cb.O} — 목록 곱 ${cb.core.toLocaleString('ko-KR')} · 겉으로 뚜렷한 고유 ${cb.uq && cb.uq.N.toLocaleString('ko-KR')}(1억 넘음)`);
  ok(BQS.CASES.every(([k]) => k === 'oak' || has(new RegExp('\\.bqs\\.wood-' + k + '\\b'))) && BQS.SCHEMA.find((p) => p.k === 'wood').opts.steel === '철제 앵글', '책장 종류 14가지 모두 CSS 그림 있음(참나무 = 기본) · 설정 「책장 종류」');
  const c = BQS.cfgOf({}); const L = items.slice(0, 300).map((x) => BQS.look(x, c));
  ok(L.every((x) => BQS.CODE_RE.test(x.code)) && L.every((x, i) => JSON.stringify(BQS.decode(x.code)) === JSON.stringify(BQS.assign(items[i], c))), '모양 글(세대.출처.디자인.색.무늬.글꼴.모양.장식.방향) ↔ 조합 그대로 오감');
  const SH = require(path.join(ROOT, 'cloud/shop.js')); ok(L.every((x) => SH.SPINE_RE.test(x.code)) && ['0.t.58.1.1.1.1.1.v', '0.t.1.99.1.1.1.1.v', '0.t.1.1.73.1.1.1.v', '0.t.1.1.1.1.116.1.v', '0.t.1.1.1.1.1.1.v.99', '0.q.1.1.1.1.1.1.v', '0.t.1.1.1.1.1.1.x', '<b>'].every((b) => !BQS.decode(b)) && !SH.SPINE_RE.test('<b>'), '클라우드도 같은 꼴만 받음 · 범위 밖 번호(디자인 58·색 99·무늬 73·모양 116·곁색 99)·이상한 글은 버림');
  const x0 = items[5]; const A0 = BQS.assign(x0, c); const keep = BQS.dress(x0, BQS.decode(BQS.encode(A0)), BQS.cfgOf({ palette: 'mono', designs: ['4'], fonts: ['jua'] }));
  const fresh = BQS.look(x0, BQS.cfgOf({ palette: 'mono', designs: ['4'], fonts: ['jua'] })); const first = BQS.look(x0, c);
  ok(keep.c === first.c && keep.d === first.d && keep.f === first.f && keep.p === first.p && (fresh.d === 4 && fresh.f === 'jua'), '영구: 저장한 모양은 설정(색 묶음·디자인·글꼴)을 바꿔도 그대로 · 새로 정하는 책만 새 설정');
  const g1 = BQS.assign(x0, BQS.cfgOf({ lookGen: 1 })); ok(g1.g === 1 && BQS.encode(g1) !== BQS.encode(A0), '다시 정하기(세대 1) → 새 조합 · 세대가 모양 글 맨 앞');
  const fam = (x) => BQS.COLORS[BQS.assign(x, c).ci - 1].fam; const sea = Array.from({ length: 40 }, (_, i) => ({ id: 'sea' + i, t: '바다로 가는 ' + i }));
  ok(sea.every((x) => ['blue', 'teal', 'navy'].includes(fam(x))) && sea.every((x) => BQS.assign(x, c).src === 't'), '제목 낱말: 「바다」 → 파랑·청록·남색 무리(40권 모두)');
  const kids = Array.from({ length: 60 }, (_, i) => ({ id: 'k' + i, t: '책' + i, c: '어린이' })); const kf = kids.map((x) => BQS.assign(x, c)); const CUTE = new Set([9, 12, 13, 23, 26, 27, 29, 30]);
  ok(kf.filter((a) => CUTE.has(a.fi)).length > 30 && kf.every((a) => [3, 4, 5, 6].includes(BQS.COLORS[a.ci - 1].t)), `분야: 어린이 → 밝은 색 · 동글동글 글꼴(${kf.filter((a) => CUTE.has(a.fi)).length}/60)`);
  const red = BQS.assign({ id: 'cv1', t: '바다', im: 'x' }, c, '#c42a2a'); ok(red.src === 'c' && BQS.COLORS[red.ci - 1].fam === 'red', '앞표지 대표색이 있으면 제목 낱말보다 먼저 — 빨간 표지 → 빨강 책등');
  ok(BQS.assign({ id: 'sp1', t: '바다', sp: 'https://x/spine.jpg' }, c).src === 's' && BQS.assign({ id: 'zz9', t: 'qwxy' }, c).src === 'r', '책등 그림이 있으면 그것(출처 s) · 아무 정보도 없으면 랜덤(출처 r)');
  const px = []; for (let i = 0; i < 256; i++) { const inB = i % 16 > 4 && i % 16 < 12 && i > 60 && i < 200; px.push(...(inB ? [40, 90, 200, 255] : [250, 250, 250, 255])); } const dm = BQS.dominant(px);
  ok(/^#/.test(dm) && parseInt(dm.slice(5, 7), 16) > 150 && BQS.dominant([]) === null, `대표색: 흰 여백보다 파란 그림 쪽(${dm})`);
  const s46 = BQS.sizeOf({ id: 'a', sz: '127x188x12' }, c), sA4 = BQS.sizeOf({ id: 'a', sz: '210x297x40' }, c), sPg = BQS.sizeOf({ id: 'a', pg: 600 }, c), sPg2 = BQS.sizeOf({ id: 'a', pg: 100 }, c);
  ok(s46.h < sA4.h && sA4.h === 100 && s46.w < sA4.w && sPg.w > sPg2.w && s46.real && !BQS.sizeOf({ id: 'q' }, c).real, `판형: 46판 키 ${s46.h}% < A4 100% · 두께 ${s46.w}px < ${sA4.w}px · 판형 없으면 쪽수(600쪽 ${sPg.w}px > 100쪽 ${sPg2.w}px)`);
  const t1 = BQS.textFit('섬', '갑', 24, 130), t2 = BQS.textFit('아주 길고 긴 제목이 붙은 책의 이야기 모음 두 번째', '지은이 가나다라', 24, 130);
  ok(t1.ft > t2.ft && t2.ft < 9 && t1.ft >= 14 && t2.fa > 0, `글 맞추기: 짧은 제목 ${t1.ft}px · 긴 제목 ${t2.ft}px(× 확대가 9px 아래면 줄임)`);
  ok(BQS.SCHEMA.find((p) => p.k === 'lookGen').hide && BQS.cfgOf({ popMode: 'zz' }).popMode === 'spine' && BQS.cfgOf({}).fullText && BQS.cfgOf({}).lookKeep, '설정: 책등 누르면 기본 = 책등 표면 단추 · 글 전체 · 영구 모양 · 세대 칸은 숨김');
}

async function cloud(ok, BQS, SH) {
  ok(SH.szOf('148*210*20mm') === '148x210x20' && SH.szOf('128x188') === '128x188' && SH.szOf('9*9*9') === null && SH.szOf(null) === null, '판형 글 → 가로x세로x두께(이상하면 버림)');
  const have = new Map([['A', '0.t.1.1.1.1.1.1.v'], ['B', '3.t.1.1.1.1.1.1.v']]); const T = SH.spineTake([['A', '0.t.2.2.2.2.2.2.h'], ['B', '0.r.2.2.2.2.2.2.h'], ['C', '0.c.2.2.2.2.2.2.h'], ['C', '0.c.3.3.3.3.3.3.h'], ['D', '1.t.1.1.1.1.1.1.v'], ['Z', '0.t.1.1.1.1.1.1.v'], ['E', '<img>'], 'x'], have, (id) => id !== 'Z', 0);
  ok(JSON.stringify(T) === JSON.stringify([['B', '0.r.2.2.2.2.2.2.h'], ['C', '0.c.2.2.2.2.2.2.h']]), '저장 거름: 이미 정한 책(A)은 그대로 · 옛 세대(B)는 새로 · 같은 책 두 번은 처음 것 · 세대 다름(D)·판매중 아님(Z)·이상한 글은 버림');
  const DB = {}; const col = (n) => (DB[n] = DB[n] || {}); const snap = (n, id) => { const v = col(n)[id]; return { id, exists: !!v, data: () => v }; };
  const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => (op === '==' ? col(n)[id][f] === v : true))).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f) }; } }); return { ...q([]), doc: (id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v, o) => { const old = col(n)[id] || {}; col(n)[id] = o && o.merge && v.m && old.m ? { ...old, ...v, m: { ...old.m, ...v.m } } : { ...old, ...v }; } }) }; };
  const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)) }; const FV = { serverTimestamp: () => new Date(), arrayUnion: (...a) => a };
  for (let i = 0; i < 30; i++) { col('prd_listings')['L' + i] = { status: '판매중', active: true, qty: 1, price: 3000 + i * 100, grade: '상', sku: 'A' + i, title: '시험 책 ' + i, bookId: 'b' + i, registeredAt: '2026-10-01T00:00:0' + (i % 10) + 'Z' }; col('prd_books')['b' + i] = { author: '지은이', size: i % 2 ? '152*225*' + (10 + i) + 'mm' : null, pages: 200 }; }
  col('shop_holds').L2 = { on: 1, no: 'BQ1' }; col('shop_spines').b00 = { m: { L9: '0.t.9.9.9.9.9.1.v' } }; col('app_settings').shop = { open: 1, shelf: { lookGen: 0 } };
  const SHOP = SH.makeShop({ db, C, FV, log: () => {} }); const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; if (await SHOP.handle(req, res, p0)) return; res.writeHead(404); res.end(); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const call = (m, p, body) => new Promise((ok2) => { const rq = http.request(base + p, { method: m, headers: { 'Content-Type': 'application/json' } }, (r) => { const ch = []; r.on('data', (d) => ch.push(d)); r.on('end', () => ok2({ s: r.statusCode, j: JSON.parse(Buffer.concat(ch).toString('utf8') || '{}') })); }); if (body) rq.write(JSON.stringify(body)); rq.end(); });
  const P = await call('POST', '/shop/spines', { g: 0, L: [['L1', '0.c.4.5.6.7.8.2.h'], ['L9', '0.r.1.1.1.1.1.1.v'], ['NOPE', '0.r.1.1.1.1.1.1.v']] }); const P2 = await call('POST', '/shop/spines', { g: 0, L: [['L1', '0.r.1.1.1.1.1.1.v']] });
  const S = await call('GET', '/shop/shelf'); const rows = BQS.unpack(S.j); const r1 = rows.find((x) => x.id === 'L1'), r9 = rows.find((x) => x.id === 'L9'), r3 = rows.find((x) => x.id === 'L3');
  ok(P.j.n === 1 && P2.j.n === 0 && r1.lk === '0.c.4.5.6.7.8.2.h' && r9.lk === '0.t.9.9.9.9.9.1.v' && r3.sz === '152x225x13' && !rows.find((x) => x.id === 'L4').sz, '책등 모양 저장: 새 책 1권 받음 · 먼저 정한 것이 이김(L1 두 번째·L9 저장된 것) · 없는 상품 버림 · 묶음에 lk·sz 칸');
  await SHOP.spinesFlush(); const b1 = SH.spineBucket('L1'); ok(col('shop_spines')[b1] && col('shop_spines')[b1].m.L1 === '0.c.4.5.6.7.8.2.h' && col('shop_spines').b00.m.L9 === '0.t.9.9.9.9.9.1.v', `클라우드 shop_spines/${b1}에 모아 씀(다른 책 모양은 그대로)`);
  col('app_settings').shop.shelf.lookGen = 2; SHOP._spn.at = 0; await new Promise((r) => setTimeout(r, 5)); const P3 = await call('POST', '/shop/spines', { g: 0, L: [['L5', '0.r.1.1.1.1.1.1.v']] });
  const Ck = await call('GET', '/shop/check?ids=L1,L2,GONE,L1'); ok(Ck.j.st.L1 === 's' && Ck.j.st.L2 === 'o' && Ck.j.st.GONE === 'x' && Ck.j.p.L1 === 3100 && !('GONE' in Ck.j.p), '장바구니 살펴보기 /shop/check: 판매중 s · 주문 중 o · 없음 x · 지금 값');
  ok(P3.j.n === 0 || P3.j.gen === 0, '세대가 다른 모양은 받지 않음(설정 1분 기억 안에서는 옛 세대 그대로)'); srv.close();
  const BQ = require(path.join(__dirname, '..', '..', 'shop/shop-core.js')); const cart = [{ id: 'a', t: '책A', p: 5000 }, { id: 'b', t: '책B', p: 7000 }, { id: 'c', t: '책C', p: 3000 }];
  const f = BQ.cartFix(cart, { a: 's', b: 'x', c: 'o' }, { a: 6000 }); ok(f.cart.length === 1 && f.cart[0].p === 6000 && f.gone.length === 2 && /팔렸/.test(f.gone[0].why) && /먼저 주문/.test(f.gone[1].why) && f.moved[0].b === 6000, '장바구니 고침: 팔린 책·주문 중인 책은 빼고 까닭 · 값 바뀐 책은 새 값');
  ok(BQ.freeLeft(12000, { shipFee: 3500, freeOver: 30000 }) === 18000 && BQ.freeLeft(31000, { shipFee: 3500, freeOver: 30000 }) === 0 && BQ.freeLeft(1000, { shipFee: 3500 }) === null, '무료 배송까지 남은 돈(기준이 없으면 막대 없음)');
}

async function ui(ok, p, base, SHOT2, UI, BQS) {
  await p.goto(base + '/s/index.html#/shelf'); await p.waitForSelector('.bqs-case.cur .sp'); await p.waitForTimeout(3200);
  const snap = () => p.evaluate(() => [...document.querySelectorAll('.bqs-case.cur .sp')].slice(0, 40).map((b) => [b.dataset.id, b.style.getPropertyValue('--c'), b.dataset.d, b.dataset.p, b.dataset.s, b.style.fontFamily.split(',')[0]]));
  const a = await snap(); const lk = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('bq-shelf-lk') || '{}')).length); const sent = UI.posts.reduce((n, j) => n + (j.L || []).length, 0);
  ok(lk >= 100 && sent >= 100 && UI.posts.every((j) => j.g === 0 && (j.L || []).every(([, c]) => BQS.CODE_RE.test(c))), `정한 모양 저장: 이 기기 ${lk}권 · 클라우드로 ${sent}권(세대 0 · 꼴 맞음)`);
  UI.shelf = { cap: 150, palette: 'mono', designs: ['4'], fonts: ['jua'] }; await p.reload(); await p.waitForSelector('.bqs-case.cur .sp'); await p.waitForTimeout(400); const b = await snap();
  ok(JSON.stringify(a) === JSON.stringify(b), '설정을 흑백·디자인 하나·글꼴 하나로 바꿔도 이미 정한 책 40권은 그대로');
  const ctx2 = await p.context().browser().newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); const q = await ctx2.newPage(); await q.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort()); const sortA = await p.evaluate(() => localStorage.getItem('bq-shelf-sort')); await q.addInitScript(([u, so]) => { window.BQ_API = u; try { if (so) localStorage.setItem('bq-shelf-sort', so); } catch (e) {} }, [base, sortA]); /* 같은 정렬로(정렬은 그 기기 기억) */
  await q.goto(base + '/s/index.html#/shelf'); await q.waitForSelector('.bqs-case.cur .sp'); await q.waitForTimeout(300);
  const c2 = await q.evaluate(() => [...document.querySelectorAll('.bqs-case.cur .sp')].slice(0, 40).map((b) => [b.dataset.id, b.style.getPropertyValue('--c'), b.dataset.d, b.dataset.p, b.dataset.s, b.style.fontFamily.split(',')[0]]));
  ok(JSON.stringify(a) === JSON.stringify(c2), '다른 기기(빈 저장소)에서도 클라우드에 저장된 모양 그대로');
  UI.shelf = { cap: 150, lookGen: 1 }; await q.reload(); await q.waitForSelector('.bqs-case.cur .sp'); await q.waitForTimeout(300); const d2 = await q.evaluate(() => [...document.querySelectorAll('.bqs-case.cur .sp')].slice(0, 40).map((b) => b.dataset.d + b.style.getPropertyValue('--c')));
  ok(d2.filter((v, i) => v !== a[i][2] + a[i][1]).length > 30, `관리 화면 「다시 정하기」(세대 1) → 새 모양(${d2.filter((v, i) => v !== a[i][2] + a[i][1]).length}/40 바뀜)`); await ctx2.close(); UI.shelf = { cap: 150 };
  await p.reload(); await p.waitForSelector('.bqs-case.cur .sp'); await p.click('.bqs-gear'); await p.waitForSelector('[data-v="wood"]');
  const kinds = BQS.CASES.map((x) => x[0]); for (const k of kinds) { await p.selectOption('[data-v="wood"]', k); await p.waitForTimeout(120); await p.screenshot({ path: path.join(SHOT2, `shelf2_case_${k}.png`), clip: { x: 0, y: 60, width: 1440, height: 640 } }); }
  ok(await p.evaluate(() => document.querySelector('.bqs').classList.contains('wood-pipe') && JSON.parse(localStorage.getItem('bq-shelf-view')).wood === 'pipe'), `손님 ⚙ 보기 › 책장 종류 ${kinds.length}가지 바꿔 봄(이 기기만 기억 · 사진 shelf2_case_*.png)`);
  await p.selectOption('[data-v="wood"]', 'oak');
  /* 장바구니: 팔린 책 알림 · 값 바뀜 · 무료 배송 막대 */
  await p.evaluate(() => localStorage.setItem('bq-cart', JSON.stringify([{ id: 'demo11', t: '시험 책 하나', g: '상', p: 1, im: null }, { id: 'demo12', t: '시험 책 둘', g: '상', p: 9000, im: null }, { id: 'demo13', t: '시험 책 셋', g: '중', p: 4000, im: null }])));
  UI.check = { sold: 'demo12', price: 'demo11' }; await p.goto(base + '/s/index.html#/cart'); await p.waitForSelector('.fresh', { timeout: 8000 }).catch(() => {});
  const ct = await p.evaluate(() => ({ fresh: (document.querySelector('.fresh') || {}).textContent || '', n: JSON.parse(localStorage.getItem('bq-cart')).length, free: !!document.querySelector('.free i'), go: (document.querySelector('#toOrder') || {}).textContent || '' }));
  await p.screenshot({ path: path.join(SHOT2, 'shop2_cart.png'), fullPage: true });
  ok(/시험 책 둘/.test(ct.fresh) && /팔렸/.test(ct.fresh) && /값이/.test(ct.fresh) && ct.n === 2 && ct.free && /주문하기/.test(ct.go), '장바구니: 주문 전에 팔린 책은 빼고 알림 · 값 바뀐 책 알림 · 무료 배송까지 막대 · 단추에 합계');
  await p.click('[data-del="demo13"]'); await p.waitForTimeout(150); const un = await p.evaluate(() => !!document.querySelector('#toast .undo')); if (un) await p.click('#toast .undo'); await p.waitForTimeout(150);
  ok(un && (await p.evaluate(() => JSON.parse(localStorage.getItem('bq-cart')).some((x) => x.id === 'demo13'))), '✕로 뺀 책은 4초 안에 「되돌리기」');
  UI.check = null; await p.goto(base + '/s/index.html#/order'); await p.waitForSelector('#f_name'); await p.focus('#f_name'); await p.focus('#f_phone'); await p.waitForTimeout(80);
  const v1 = await p.evaluate(() => ({ bad: document.querySelector('[data-f="name"]').classList.contains('bad'), ph: document.querySelector('[data-f="phone"]').classList.contains('bad') }));
  await p.fill('#f_name', '손님A'); await p.fill('#f_phone', '010-0000-0000'); await p.focus('#f_zip'); await p.waitForTimeout(80); const v2 = await p.evaluate(() => ({ good: document.querySelector('[data-f="name"]').classList.contains('good'), ph: document.querySelector('[data-f="phone"]').classList.contains('good') }));
  await p.screenshot({ path: path.join(SHOT2, 'shop2_order.png'), fullPage: true });
  ok(v1.bad && !v1.ph && v2.good && v2.ph, '주문서: 칸을 떠나면 그 칸만 바로 검사(손대지 않은 칸은 조용) · 고치면 바로 초록');
}

async function mobile(ok, q, base, SHOT2, UI) {
  await q.evaluate(() => localStorage.setItem('bq-cart', JSON.stringify([{ id: 'demo21', t: '시험 책 넷', g: '상', p: 12000, im: null }])));
  await q.goto(base + '/s/index.html#/cart'); await q.waitForSelector('.free'); await q.screenshot({ path: path.join(SHOT2, 'shop2_cart_mobile.png') });
  await q.goto(base + '/s/index.html#/order'); await q.waitForSelector('#go'); await q.waitForTimeout(150); const g = await q.evaluate(() => { const r = document.querySelector('#go').getBoundingClientRect(); return { b: r.bottom, h: innerHeight, sw: document.documentElement.scrollWidth }; });
  await q.screenshot({ path: path.join(SHOT2, 'shop2_order_mobile.png') }); ok(g.b <= g.h && g.b > g.h - 120 && g.sw <= 392, `휴대폰 주문서: 주문 단추가 늘 화면 아래에(${Math.round(g.b)}/${g.h}px) · 가로 넘침 없음`);
}
module.exports = { pure, cloud, ui, mobile };
