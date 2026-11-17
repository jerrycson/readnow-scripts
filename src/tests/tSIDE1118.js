/* tSIDE1118 — 📚 우리 사진에서 책등 띠 저절로 자르기(readnow-cutout-core.js sideSpine·splitSpread·cropBox·spineRatio + cloud/shop-sidespine.js · 일꾼 spine4 · 리드 결정 F57)
 *  지어낸 그림: 비스듬히 세운 책 한 권(왼쪽 책등 띠·접힌 줄·원근) · 원근 없는 정면 · 바탕과 같은 색 표지 · 펼친 한 장(뒤표지|책등|앞표지)
 *  클라우드 고르기(사진 'o'만 · 사람 판정이 이김 · 잠김·이미 책등 있음 건너뜀)와 회차(빈 칸에만 씀 · 거래 안에서 다시 읽음 · 쪼개기는 기록만)를 가짜 저장소로 봄
 *  실행: node src/tests/tSIDE1118.js (node만 · 인터넷·jpeg-js 없이 — 가짜 jpeg) */
'use strict';
const path = require('path'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const CUT = require(path.join(REPO, 'readnow-cutout-core.js'));
const SS = require(path.join(REPO, 'cloud/shop-sidespine.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 400) : ''); } else console.log('  ✓', m); };
let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
function canvas(w, h, bg) { const d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { const n = (rnd() - 0.5) * 8; d[i * 4] = bg[0] + n; d[i * 4 + 1] = bg[1] + n; d[i * 4 + 2] = bg[2] + n; d[i * 4 + 3] = 255; } return { w, h, d }; }
function quad(img, xl, xr, yt, yb, col, marks) { for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { if (x < xl(y) || x > xr(y) || y < yt(x) || y > yb(x)) continue; let c = col.map((q) => q + (rnd() - 0.5) * 8); if (marks) for (const m of marks) if (Math.abs(x - m.x) < m.w && Math.abs(y - m.y) < m.h) c = m.c; const i = (y * img.w + x) * 4; img.d[i] = c[0]; img.d[i + 1] = c[1]; img.d[i + 2] = c[2]; } }
/* 비스듬히 세운 한 권 — 왼쪽 책등(sw) · 오른쪽 앞표지(cw) · 오른쪽 끝이 shrink만큼 낮아짐(원근) */
function sideBook(o) { o = Object.assign({ W: 600, H: 800, x0: 120, sw: 40, cw: 330, top: 100, bot: 700, shrink: 40, sp: [40, 50, 120], cv: [220, 200, 150], bg: [235, 235, 232] }, o || {}); const img = canvas(o.W, o.H, o.bg);
  const x1 = o.x0 + o.sw, x2 = x1 + o.cw; const yt = (x) => (x <= x1 ? o.top : o.top + (o.shrink * (x - x1)) / o.cw), yb = (x) => (x <= x1 ? o.bot : o.bot - (o.shrink * (x - x1)) / o.cw);
  if (o.sw > 1) quad(img, () => o.x0, () => x1 - 1, yt, yb, o.sp, [{ x: o.x0 + o.sw / 2, y: 300, w: 6, h: 60, c: [240, 240, 240] }]);
  quad(img, () => x1, () => x2, yt, yb, o.cv, [{ x: x1 + o.cw / 2, y: 250, w: 90, h: 14, c: [30, 30, 30] }, { x: x1 + o.cw / 2, y: 520, w: 60, h: 40, c: [150, 60, 40] }]);
  return { img, truth: { cx: o.x0 + o.sw / 2, w: o.sw, sp: o.sp } }; }
function spread(o) { o = Object.assign({ W: 900, H: 600, x0: 60, cw: 360, sw: 40, top: 80, bot: 520, back: [60, 110, 170], sp: [200, 60, 50], fr: [230, 210, 120], bg: [240, 240, 238] }, o || {}); const img = canvas(o.W, o.H, o.bg);
  const a = o.x0, b = a + o.cw, c = b + o.sw, d = c + o.cw; const T = () => o.top, B = () => o.bot;
  quad(img, () => a, () => b - 1, T, B, o.back, [{ x: a + 120, y: 200, w: 80, h: 10, c: [250, 250, 250] }, { x: a + 200, y: 430, w: 50, h: 25, c: [250, 250, 250] }]);
  quad(img, () => b, () => c - 1, T, B, o.sp, [{ x: b + o.sw / 2, y: 280, w: 5, h: 70, c: [250, 250, 250] }]);
  quad(img, () => c, () => d, T, B, o.fr, [{ x: c + 180, y: 160, w: 110, h: 16, c: [20, 20, 20] }, { x: c + 150, y: 380, w: 70, h: 60, c: [90, 140, 60] }]);
  return { img, truth: { x1: b, x2: c, ratio: o.sw / (2 * o.cw + o.sw) } }; }

console.log('① 옆면 책등 sideSpine');
ok(CUT.VERSION === '0.1.3' && typeof CUT.sideSpine === 'function' && CUT.SIDE && CUT.SIDE.auto === 0.95, '공용 셈 0.1.3 · 문턱 0.95', CUT.VERSION);
{ const S = sideBook(); const r = CUT.sideSpine(S.img); ok(r.ok && r.conf >= CUT.SIDE.auto && r.side === 'L', '비스듬히 세운 한 권 → 문턱 넘음', r);
  ok(r.box && Math.abs(r.box.cx - S.truth.cx) < 8 && Math.abs(r.box.w - S.truth.w) < 12, '띠 자리·폭 맞음', r.box);
  const c = CUT.cropBox(S.img, r.box, 900); ok(c && c.w > 10 && c.h > 400 && c.d.length === c.w * c.h * 4, '띠 잘라 세움(cropBox)', c && [c.w, c.h]);
  let m = [0, 0, 0], n = 0; for (let y = Math.round(c.h * 0.6); y < c.h * 0.9; y++) for (let x = Math.round(c.w * 0.25); x < c.w * 0.75; x++) { const i = (y * c.w + x) * 4; m[0] += c.d[i]; m[1] += c.d[i + 1]; m[2] += c.d[i + 2]; n++; }
  m = m.map((v) => v / n); ok(Math.hypot(m[0] - 40, m[1] - 50, m[2] - 120) < 25, '잘린 띠 색 = 책등 색', m.map(Math.round)); }
{ const S = sideBook({ sw: 30, shrink: 30 }); const r = CUT.sideSpine(S.img); ok(r.ok && r.conf >= 0.95 && Math.abs(r.box.cx - S.truth.cx) < 8, '좁은 책등·약한 원근도 찾음', r.box); }
{ const r = CUT.sideSpine(sideBook({ shrink: 0 }).img); ok(r.conf < 0.95, '원근 없는 정면(책등인지 표지 가장자리인지 모름) → 문턱 아래', r.conf); }
{ const r = CUT.sideSpine(sideBook({ sw: 1 }).img); ok(!r.ok && r.conf === 0, '책등 없는 정면 표지 → 0', r); }
{ const r = CUT.sideSpine(sideBook({ sp: [180, 30, 30], cv: [240, 240, 240] }).img); ok(r.conf < 0.95, '바탕과 같은 색 표지 → 받아들이지 않음', r); }
ok(!CUT.sideSpine({ w: 0, h: 0, d: new Uint8ClampedArray(0) }).ok, '빈 그림은 실패로 끝남');

console.log('② 펼친 한 장 쪼개기 splitSpread(그림자)');
for (const o of [{}, { sw: 25 }]) { const S = spread(o); const r0 = CUT.splitSpread(S.img); const r1 = CUT.splitSpread(S.img, { ratio: S.truth.ratio });
  ok(r0.ok && Math.abs(r0.seams[0] - S.truth.x1) < 10 && Math.abs(r0.seams[1] - S.truth.x2) < 10, `짐작 없이 두 경계 ±10(책등 ${o.sw || 40})`, [r0.seams, S.truth]);
  ok(r1.ok && r1.conf >= 0.6 && Math.abs(r1.seams[0] - S.truth.x1) < 4 && Math.abs(r1.seams[1] - S.truth.x2) < 4, `책등 몫 짐작을 주면 ±4·점수 ≥ 0.6(책등 ${o.sw || 40})`, [r1.seams, r1.conf]);
  ok(r1.back && r1.spine && r1.front && r1.spine.w > 0 && r1.back.w > r1.spine.w * 4, '뒤·책등·앞 칸 셋', [r1.back, r1.spine, r1.front].map((b) => b && Math.round(b.w))); }
{ const S = spread({ sp: [60, 110, 170] }); const r = CUT.splitSpread(S.img, { ratio: S.truth.ratio }); ok(r.conf < 0.2, '책등과 뒤표지가 같은 색 → 점수 낮음(기록만)', r.conf); }
{ const r = CUT.splitSpread(sideBook().img); ok(!r.ok, '세운 한 권(가로세로 비가 펼침이 아님) → 쪼개지 않음', r.why); }

console.log('③ 짐작 책등 몫 spineRatio');
ok(Math.abs(CUT.spineRatio('148x210x20') - 20 / 316) < 1e-3, "크기 '가로x세로x두께'로", CUT.spineRatio('148x210x20'));
ok(Math.abs(CUT.spineRatio('', 300) - 19 / 299) < 1e-3, '크기 없으면 쪽수×0.06+1 · 폭 140', CUT.spineRatio('', 300));
ok(CUT.spineRatio(null, 0) === 0 && CUT.spineRatio('abc', 0) === 0, '둘 다 없으면 0');
ok(SS.ratioOf({ sz: '148x210x20' }) === CUT.spineRatio('148x210x20'), '클라우드 ratioOf = 공용 셈');

console.log('④ 클라우드 고르기 pick');
ok(SS.CUT && SS.CUT.VERSION === CUT.VERSION, '클라우드가 공용 셈을 읽음(../readnow-cutout-core.js)', SS.CUT && SS.CUT.VERSION);
const IM = (k) => `https://firebasestorage.googleapis.com/v0/b/x/o/img%2F${k}%2Ffront.jpg?alt=media`;
const mk = (id, k, at, ex) => ({ x: Object.assign({ id, im: IM(k), at }, ex || {}), id: k });
const books = new Map([['bk_a', {}], ['bk_b', {}], ['bk_c', {}], ['bk_d', {}], ['bk_e', { images: { spine: { stored: 'img/bk_e/spine.jpg' } } }], ['bk_f', {}], ['bk_g', {}], ['bk_h', {}]]);
const items = [mk('1', 'bk_a', '2026-11-10'), mk('2', 'bk_b', '2026-11-12'), mk('3', 'bk_c', '2026-11-11'), mk('4', 'bk_d', '2026-11-09'), mk('5', 'bk_e', '2026-11-13'), mk('6', 'bk_f', '2026-11-14'), mk('7', 'bk_g', '2026-11-08', { sp: 'https://x/sp.jpg' }), { x: { id: '8', im: IM('bk_h'), at: '2026-11-15' }, id: 'bk_z' }];
const pkOf = (im) => (/bk_c|bk_d/.test(im) ? 'c' : 'o1');
const human = (id) => (id === '3' ? { k: 'O' } : id === '1' ? { k: 'C' } : id === '2' ? { k: 'O', src: 'https://x/y.jpg' } : null);
{ const P = SS.pick(items, { books, pk: pkOf, human, locked: new Set(['6']), seen: new Map(), n: 10 }); const ids = P.map((p) => p.id);
  ok(JSON.stringify(ids) === JSON.stringify(['bk_c']), '사진 o만·사람 O는 넣음·사람 C/고른 그림·잠김·책등 있음·서가 책등 있음·다른 도서 그림은 뺌', ids); }
{ const P = SS.pick(items, { books, pk: () => 'o1', human: () => null, locked: new Set(), seen: new Map([['bk_d', '261117.N10']]), n: 2 }); ok(JSON.stringify(P.map((p) => p.id)) === JSON.stringify(['bk_f', 'bk_b']), '최신 먼저 · 이미 본 것 뺌 · 장 수 한도', P.map((p) => p.id)); }
{ const P = SS.pick(items, { books, pk: () => 'o1', human: () => null, locked: new Set(['bk_f']), seen: new Map(), n: 10 }); ok(!P.some((p) => p.id === 'bk_f'), '도서 번호로 잠겨도 뺌'); }
ok(SS.minOf({}) === 0.95 && SS.minOf({ sideSpineMin: 0.9 }) === 0.9 && SS.minOf({ sideSpineMin: 0.3 }) === 0.95, '문턱 설정(0.8~0.99만 받음)');
ok(SS.planCfg({ sideSpine: false }).spineRule === false && SS.planCfg({}).spineRuleN === 30 && SS.planCfg({ sideSpineN: 999 }).spineRuleN === 60, '설정 → 회차 틀');
ok(SS.REC_RE.test('261118.S97~88:54:53') && SS.REC_RE.test('261118.H') && SS.REC_RE.test('261118.N42') && !SS.REC_RE.test('261118.X'), '기록 꼴');

console.log('⑤ 클라우드 회차 tick(가짜 저장소·가짜 jpeg)');
(async () => {
  const pics = new Map(); let pid = 0; const fileOf = (img) => { const b = Buffer.alloc(16); b[0] = 0xff; b[1] = 0xd8; b[2] = 0xff; b[3] = 0xe0; b.writeUInt32BE(++pid, 4); pics.set(pid, img); return b; };
  const jpeg = { decode: (buf) => { const im = pics.get(buf.readUInt32BE(4)); return { width: im.w, height: im.h, data: im.d }; }, encode: (o, q) => ({ data: Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from(`${o.width}x${o.height}q${q}`)]) }) };
  const good = sideBook().img, flat = sideBook({ shrink: 0 }).img, spr = spread().img;
  const files = { 'img/bk_p/front.jpg': fileOf(good), 'img/bk_q/front.jpg': fileOf(flat), 'img/bk_r/front.jpg': fileOf(good), 'img/bk_s/front.jpg': fileOf(spr), 'img/bk_t/front.jpg': fileOf(good) };
  const saved = {}; const bucket = () => ({ file: (p) => ({ download: async () => { if (!files[p]) throw new Error('없음 ' + p); return [files[p]]; }, save: async (buf, op) => { saved[p] = { buf, op }; } }) });
  const store = { prd_books: { bk_p: { t: 'p' }, bk_q: { t: 'q' }, bk_r: { t: 'r' }, bk_s: { t: 's' }, bk_t: { t: 't' } }, prd_locks: { L1: { on: true, lid: '99' } }, shop_sidespine: {} };
  const sneak = { bk_r: { src: 'https://image.aladin.co.kr/x_s.jpg' } }; /* 회차 중에 수집기가 책등을 넣음 → 거래 안 다시 읽기에서 H */
  const docRef = (c, id) => ({ id, get: async () => { const v = (store[c] || {})[id]; return { exists: v != null, data: () => v }; }, set: async (v, op) => { store[c] = store[c] || {}; const o = op && op.merge ? store[c][id] || {} : {}; const deep = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deep(a[k], b[k]); else a[k] = b[k]; } return a; }; store[c][id] = deep(JSON.parse(JSON.stringify(o)), v); } });
  const C = (c) => ({ doc: (id) => docRef(c, id), get: async () => ({ forEach: (f) => Object.keys(store[c] || {}).forEach((id) => f({ id, data: () => store[c][id] })) }), where: (f, op, v) => ({ get: async () => ({ docs: Object.keys(store[c] || {}).filter((id) => store[c][id][f] === v).map((id) => ({ id, data: () => store[c][id] })) }) }) });
  const db = { runTransaction: async (fn) => { const t = { get: async (ref) => { if (sneak[ref.id]) { store.prd_books[ref.id].images = { spine: sneak[ref.id] }; delete sneak[ref.id]; } return ref.get(); }, set: (ref, v, op) => { t.w.push([ref, v, op]); }, w: [] }; const r = await fn(t); for (const [ref, v, op] of t.w) await ref.set(v, op); return r; } };
  const onS = []; const E = SS.makeSideSpine({ C, db, bucket, log: () => {}, pathOf: () => null, srcOf: () => null, onSaved: (id, v) => onS.push([id, v]), jpeg });
  const bm = new Map(Object.entries(store.prd_books).map(([k, v]) => [k, v]));
  const L = ['p', 'q', 'r', 's', 't'].map((s, i) => mk(String(10 + i), 'bk_' + s, '2026-11-1' + i, s === 's' ? { sz: '148x210x20' } : {})); L.push(mk('99', 'bk_t', '2026-11-19'));
  /* 99번(잠김 lid)은 bk_t의 다른 상품 — 같은 도서라 한 번만 보지만 잠긴 상품이 먼저 나오므로 bk_t는 건너뜀 */
  const hit = await E.tick(L, bm, { pk: () => 'o1', human: () => null, sc: {} });
  ok(hit === 1, '저장 1장(bk_p)', { hit, st: E.state() });
  const sp = store.prd_books.bk_p.images && store.prd_books.bk_p.images.spine; ok(sp && sp.stored === 'img/bk_p/spine_p.jpg' && sp.src === null && sp.by === 'cloud-photo' && sp.conf >= 0.95, '도서 정보 책등 칸 = 우리 저장소 띠', sp);
  ok(store.prd_books.bk_p.t === 'p' && store.prd_books.bk_p.writer === 'cloud-shop', '다른 칸은 그대로(merge)', store.prd_books.bk_p);
  ok(saved['img/bk_p/spine_p.jpg'] && saved['img/bk_p/spine_p.jpg'].op.contentType === 'image/jpeg' && saved['img/bk_p/spine_p.jpg'].buf[0] === 0xff, '저장소에 jpeg 띠', Object.keys(saved));
  ok(!(store.prd_books.bk_q.images), '문턱 아래(원근 없음)는 안 씀'); ok(store.prd_books.bk_r.images.spine.src === 'https://image.aladin.co.kr/x_s.jpg', '회차 중 들어온 수집기 책등은 덮지 않음', store.prd_books.bk_r);
  ok(!store.prd_books.bk_s.images, '펼친 사진은 그림자(쓰지 않음)'); ok(!store.prd_books.bk_t.images, '잠긴 상품의 도서는 건너뜀');
  const rec = {}; for (const b of Object.values(store.shop_sidespine)) Object.assign(rec, b.m || {});
  ok(/^\d{6}\.S\d+$/.test(rec.bk_p) && /^\d{6}\.N\d+$/.test(rec.bk_q) && /^\d{6}\.H$/.test(rec.bk_r) && /^\d{6}\.N\d+~\d+:\d+:63$/.test(rec.bk_s) && !rec.bk_t, '기록 S·N·H·N~쪼개기(짐작 63‰) · 잠김은 기록 없음', rec);
  ok(Object.values(rec).every((v) => SS.REC_RE.test(v)), '기록이 모두 꼴에 맞음');
  ok(onS.length === 1 && onS[0][0] === 'bk_p', '저장 알림 한 번', onS.map((x) => x[0]));
  const st = E.state(); ok(st.saved === 1 && st.skip === 1 && st.seen === 4 && st.split >= 1 && st.core === '0.1.3', '상태', st);
  const hit2 = await E.tick(L, bm, { pk: () => 'o1', human: () => null, sc: {} }); ok(hit2 === 0 && E.state().seen === 4, '두 번째 회차는 본 것 다시 안 봄', E.state());
  /* 잠금 목록을 못 읽으면 쉼 */
  const C2 = (c) => (c === 'prd_locks' ? { where: () => ({ get: async () => { throw new Error('막힘'); } }) } : C(c)); const E2 = SS.makeSideSpine({ C: C2, db, bucket, log: () => {}, pathOf: () => null, srcOf: () => null, jpeg });
  const h3 = await E2.tick([mk('50', 'bk_p', '2026-11-20')], new Map([['bk_p', {}]]), { pk: () => 'o1' }); ok(h3 === 0 && /잠금/.test(E2.state().lastErr), '잠금 목록 못 읽으면 이번 회차 쉼', E2.state());
  /* 끔 설정 */
  const p = await E.plan({ sideSpine: false }); ok(p.n === 0 || p.mode === 'off', '설정 sideSpine:false → 안 돎', p);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 예외', e.stack); process.exit(1); });
