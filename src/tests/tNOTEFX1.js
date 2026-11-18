// tNOTEFX1 — 📓 정범 노트(notefx1 · 정범님 11/18 12:59 노트 묶음 b_mwllenfmptaj1 [6]·[9])
//  ① 클라우드: _meta.catOrd(부류 차례)·uiCatOpen(펼침 기억)·uiGrip(손잡이 설정)·카드 ord를 받음 · 틀린 모양은 버림
//  ② 핵심: 「급하지 않은 일 모음」은 기본 맨 아래 · catOrd가 있으면 그 차례(모르는 새 부류는 급하지 않은 일 모음 바로 앞) · 카드 ord 차례 · /_blob 사진은 아티팩트에서만 그림
//  ③ 아티팩트(RN_JBNOTE · 휴대폰 390 · 가짜 claude.ai + 진짜 cloud/notes.js): 급하지 않은 일 모음 처음 닫힘 → 펼치면 기억(새로고침 뒤 펼침)
//     · 카드 손잡이 손가락 끌기 → 차례 저장(ord) · 부류 손잡이 마우스 끌기 → catOrd · ↑↓ 키 · 손잡이 숨김 설정 · 📷 사진 여러 장 → /_blob/<id> 그림
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const COREF = [path.join(__dirname, '..', 'notes-core.js'), path.join(__dirname, '..', 'src', 'notes-core.js'), path.join(__dirname, '..', '..', 'src', 'notes-core.js')].find((f) => fs.existsSync(f));
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
{ const miss = [['노트 핵심 notes-core.js', COREF], ['클라우드 노트 cloud/notes.js', NOTESF]].filter(([, f]) => !f || !fs.existsSync(f)).map(([n]) => n); if (miss.length) { console.log('❌ 시험에 쓸 파일을 못 찾음 — ' + miss.join(' · ') + ' (건너뛰지 않고 실패로 알림)'); process.exit(1); } }
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 1); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: require('./notes-fake-tx.cjs')(col), D }; }
const LAZY = '급하지 않은 일 모음';
const card = (id, cat, sub, title, extra) => ({ op: 'set', id, data: { kind: 'card', cat, sub, imp: 2, title, body: title + ' 본문', src: 'lead', readAt: 'x', state: 'open', createdAt: '2026-11-18T0' + id.slice(-1) + ':00:00Z', ...(extra || {}) } });
const seedOps = () => [card('w1', '웹앱', '노트', '웹앱 카드 1'), card('w2', '웹앱', '노트', '웹앱 카드 2'), card('w3', '웹앱', '노트', '웹앱 카드 3'),
  card('b1', '사업', '돈', '사업 카드 1'), card('z1', LAZY, '여유', '느긋한 카드 1'), card('z2', LAZY, '여유', '느긋한 카드 2')];

(async () => {
  // ── ① 클라우드 ──
  const { makeNotes } = require(NOTESF);
  { const F = fakeC(); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
    await N.write([{ op: 'merge', id: '_meta', data: { catOrd: ['사업', '웹앱', 7, ''], uiCatOpen: { [LAZY]: true, '웹앱›노트': 0 }, uiGrip: false } }, { op: 'set', id: 'w1', data: { kind: 'card', title: 't', ord: 30 } }, { op: 'merge', id: '_meta', data: { uiCatOpen: [1, 2] } }], 't');
    const m = F.D.jb_notes.get('_meta') || {};
    ok(JSON.stringify(m.catOrd) === JSON.stringify(['사업', '웹앱', '7']), '① 클라우드가 부류 차례 catOrd를 받음(빈 이름은 버림) — ' + JSON.stringify(m.catOrd));
    ok(m.uiCatOpen && m.uiCatOpen[LAZY] === true && m.uiCatOpen['웹앱›노트'] === false, '① 펼침 기억 uiCatOpen = 참/거짓으로만 · 목록 모양은 버림');
    ok(m.uiGrip === false, '① 손잡이 설정 uiGrip을 받음');
    ok((F.D.jb_notes.get('w1') || {}).ord === 30, '① 카드 차례 ord를 받음');
    N.live.stop(); }
  // ── ② 핵심 ──
  const core = fs.readFileSync(COREF, 'utf8'); const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  ok(+J.version >= 8, '② 노트 핵심 8판');
  const docs = (extra) => new Map(seedOps().map((o) => [o.id, o.data]).concat(extra || []));
  const names = (M) => J.tree(M.cards, M.meta).map((a) => a.name);
  { const M = J.model(docs()); const n = names(M); ok(n[n.length - 1] === LAZY, '② 급하지 않은 일 모음은 기본 맨 아래 — ' + n.join(' › ')); }
  { const M = J.model(docs([['_meta', { catOrd: ['사업', LAZY, '웹앱'] }]])); const n = names(M); ok(n.join() === ['사업', LAZY, '웹앱'].join(), '② catOrd 차례대로(급하지 않은 일 모음도 옮긴 자리) — ' + n.join(' › ')); }
  { const M = J.model(docs([['_meta', { catOrd: ['사업', LAZY] }], ['n1', { kind: 'card', cat: '새 부류', title: '새', state: 'open' }]])); const n = names(M); ok(n.indexOf('새 부류') === n.indexOf(LAZY) - 1 && n.indexOf('웹앱') < n.indexOf(LAZY), '② 차례에 없는 부류는 급하지 않은 일 모음 바로 앞 — ' + n.join(' › ')); }
  { const M = J.model(docs([['w3', { ...seedOps()[2].data, ord: 10 }], ['w1', { ...seedOps()[0].data, ord: 20 }], ['w2', { ...seedOps()[1].data, ord: 30 }]])); const L = J.tree(M.cards, M.meta).find((a) => a.name === '웹앱').subs[0].leaves[0].cards.map((c) => c.id); ok(L.join() === 'w3,w1,w2', '② 카드 ord 차례 — ' + L.join()); }
  { const M = J.model(docs([['w2', { ...seedOps()[1].data, ord: 10 }]])); const L = J.tree(M.cards, M.meta).find((a) => a.name === '웹앱').subs[0].leaves[0].cards.map((c) => c.id); ok(L[L.length - 1] === 'w2', '② ord 없는 새 카드는 차례 정한 카드보다 위 — ' + L.join()); }
  { const h = J.md('![사진](/_blob/' + 'a'.repeat(32) + ')'); ok(!/<img/.test(h) && /아티팩트/.test(h), '② 웹앱(JBN_BLOB 없음)에서는 /_blob 사진을 그리지 않고 「아티팩트에서 보임」 표시');
    ctx.window.JBN_BLOB = true; const h2 = J.md('![사진](/_blob/' + 'a'.repeat(32) + ')'); ctx.window.JBN_BLOB = false; ok(/<img src="\/_blob\/a{32}"/.test(h2), '② 아티팩트(JBN_BLOB)에서는 /_blob 사진을 그림');
    const h3 = J.md('![x](/_blob/../../evil)'); ok(!/<img/.test(h3), '② /_blob 꼴이 아닌 주소는 그리지 않음'); }

  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  if (!chromium || !ART) { console.log('… ③ 화면 시험은 RN_JBNOTE·playwright로(건너뜀)'); console.log(bad ? `❌ ${bad}개 실패` : '✓ tNOTEFX1 통과'); process.exit(bad ? 1 : 0); }
  // ── ③ 아티팩트 화면 ──
  const b = await chromium.launch(); const errs = [];
  const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' }); await N.write(seedOps(), 'lead');
  const G = (id) => F.D.jb_notes.get(id) || {};
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const a = await ctx2.newPage(); a.on('pageerror', (e) => errs.push(e.message)); await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' }));
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
  await a.route(/^https:\/\/art\.test\/_blob\//, (r) => r.fulfill({ body: PNG, contentType: 'image/png' }));
  await a.exposeFunction('__mcpCall', async (s, t, i) => { let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
  await ctx2.addInitScript(() => { const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { if (s !== '리드나우 노트') throw Object.assign(new Error('x'), { code: 'server_not_connected' }); const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } };
    let n = 0; window.__up = []; const assets = { upload: async (blob, o) => { n++; window.__up.push({ size: blob.size, type: (o && o.type) || blob.type }); const id = ('f' + n).padEnd(32, '0'); return { id, url: '/_blob/' + id, sizeBytes: blob.size, contentType: (o && o.type) || blob.type }; } };
    window.claude = { use: async (k) => (k === 'mcp' ? mcp : k === 'assets' ? assets : null) }; });
  await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'), contentType: 'text/html; charset=utf-8' }));
  await a.goto('https://art.test/'); await a.waitForTimeout(2500);
  const st = () => a.evaluate((LZ) => ({ cats: [...document.querySelectorAll('.jbn-cat[data-catk]')].map((d) => [d.dataset.catk, d.open]), web: [...document.querySelectorAll('.jbn-cat[data-catk="웹앱"] .jbn-card')].map((c) => c.dataset.card), grips: document.querySelectorAll('.jbn-grip').length }), LAZY);
  let s = await st();
  ok(s.cats.length === 3 && s.cats[2][0] === LAZY && s.cats[2][1] === false && s.cats[0][1] === true, '③ 급하지 않은 일 모음 = 맨 아래 · 처음 닫힘(다른 부류는 펼침) — ' + JSON.stringify(s.cats));
  ok(s.grips >= 3 + 3, '③ 카드·부류 이름 옆 ⠿ 손잡이(' + s.grips + '개)');
  // 펼침 기억
  await a.tap(`.jbn-cat[data-catk="${LAZY}"] > summary`); await a.waitForTimeout(1800);
  ok(G('_meta').uiCatOpen && G('_meta').uiCatOpen[LAZY] === true, '③ 급하지 않은 일 모음을 펼치면 서버 _meta.uiCatOpen에 기억');
  await a.reload(); await a.waitForTimeout(2500); s = await st();
  ok(s.cats[2][1] === true, '③ 새로고침 뒤에도 펼친 채(모든 기기 같음)');
  // 카드 손가락 끌기: 웹앱 부류 맨 아래 카드를 맨 위로
  const before = s.web.slice(); const last = before[before.length - 1];
  const cdp = await ctx2.newCDPSession(a);
  const gp = await a.evaluate((id) => { const g = document.querySelector(`.jbn-card[data-card="${id}"] .jbn-grip`); g.scrollIntoView({ block: 'center' }); /* (notefx2) 도구 줄이 생겨 맨 아래 카드가 아래 입력칸 밑에 깔릴 수 있음 — 손가락이 닿는 곳으로 */ const r = g.getBoundingClientRect(); const t = document.querySelector('.jbn-cat[data-catk="웹앱"] .jbn-card').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, ty: t.top + 4 }; }, last);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await tp('touchStart', gp.x, gp.y); for (let i = 1; i <= 12; i++) { await tp('touchMove', gp.x, gp.y + (gp.ty - gp.y) * i / 12); await a.waitForTimeout(25); } await a.waitForTimeout(100); await tp('touchEnd'); await a.waitForTimeout(1500);
  s = await st();
  ok(s.web[0] === last, '③ 카드 손잡이를 손가락으로 끌어 맨 위로 — ' + before.join() + ' → ' + s.web.join());
  ok(G(last).ord === 10 && s.web.every((id, i) => G(id).ord === (i + 1) * 10), '③ 카드 차례가 서버 ord로 저장(웹앱 📓도 같은 칸을 읽음)');
  // 부류 마우스 끌기: 사업을 맨 위로
  const cp = await a.evaluate(() => { const g = document.querySelector('.jbn-cat[data-catk="사업"] > summary .jbn-grip'); g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (process.env.DBG) { console.log('DBG cp', JSON.stringify(cp), await a.evaluate((p) => { const e = document.elementFromPoint(p.x, p.y); return e ? e.outerHTML.slice(0, 200) : 'none'; }, cp)); await a.evaluate(() => { for (const t of ['pointerdown','pointermove','pointerup','lostpointercapture','pointercancel']) document.addEventListener(t, (e) => { (window.__ev = window.__ev || []).push(t + ':' + e.pointerType + ':' + (e.target.className||e.target.tagName)); }, true); }); }
  await a.mouse.move(cp.x, cp.y); await a.mouse.down(); await a.waitForTimeout(80);
  const top0 = await a.evaluate(() => document.querySelector('.jbn-cat[data-catk="웹앱"]').getBoundingClientRect().top);
  for (let i = 1; i <= 10; i++) { await a.mouse.move(cp.x, cp.y + (top0 - 6 - cp.y) * i / 10); await a.waitForTimeout(25); } await a.mouse.up(); await a.waitForTimeout(1500);
  s = await st(); if (process.env.DBG) console.log('DBG ev', JSON.stringify(await a.evaluate(() => (window.__ev||[]).slice(0,8).concat((window.__ev||[]).slice(-4))))); if (process.env.DBG) console.log('DBG', JSON.stringify(await a.evaluate(() => [...document.querySelectorAll('.jbn-toast,[class*=toast]')].map((x) => x.textContent).slice(-5))), JSON.stringify(G('_meta')));
  ok(s.cats[0][0] === '사업', '③ 부류 손잡이를 끌어 「사업」을 맨 위로 — ' + s.cats.map((x) => x[0]).join(' › '));
  ok(Array.isArray(G('_meta').catOrd) && G('_meta').catOrd[0] === '사업' && G('_meta').catOrd.includes(LAZY), '③ 부류 차례가 서버 _meta.catOrd로 저장 — ' + JSON.stringify(G('_meta').catOrd));
  ok(s.cats.every((x) => x[1] === true), '③ 손잡이를 눌러도 부류가 접히지 않음');
  // ↑↓ 키
  await a.focus('.jbn-cat[data-catk="사업"] > summary .jbn-grip'); await a.keyboard.press('ArrowDown'); await a.waitForTimeout(1500); s = await st();
  ok(s.cats[1][0] === '사업' && G('_meta').catOrd[1] === '사업', '③ 손잡이에 초점을 두고 ↓ 키로 한 칸 내림');
  // 📷 사진 여러 장(통합 입력칸)
  const fc = a.waitForEvent('filechooser'); await a.tap('#jbn-dock [data-act="pic"]'); const ch = await fc;
  await ch.setFiles([{ name: 'a.png', mimeType: 'image/png', buffer: PNG }, { name: 'b.png', mimeType: 'image/png', buffer: PNG }]); await a.waitForTimeout(800);
  const tv = await a.evaluate(() => document.querySelector('#jbn-feed-ta').value);
  ok((tv.match(/!\[사진\]\(\/_blob\/f\d0+\)/g) || []).length === 2, '③ 통합 입력칸 📷 → 사진 두 장이 /_blob/<id>로 칸에 들어감');
  await a.tap('[data-act="feedmemo"]'); await a.waitForTimeout(1500);
  const imgs = await a.evaluate(() => [...document.querySelectorAll('#jbn-feed img')].map((i) => i.getAttribute('src')));
  ok(imgs.filter((x) => /^\/_blob\//.test(x)).length >= 2, '③ 적은 메모에 사진 두 장이 그림으로 보임');
  // 손잡이 숨김 설정
  await a.evaluate(() => { const b = document.querySelector('[data-act="cfg"]'); if (b) b.click(); }); await a.waitForTimeout(300);
  await a.evaluate(() => { const b = document.querySelector('[data-cfg="uiGrip"][data-v="0"]'); if (b) b.click(); }); await a.waitForTimeout(1500);
  s = await st(); ok(G('_meta').uiGrip === false && s.grips === 0, '③ ⚙ 설정 「⠿ 끌어 옮기기 손잡이 = 숨김」이 저장되고 손잡이가 사라짐');
  const ow = await a.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 392, '③ 휴대폰 폭 넘침 없음(' + ow + 'px)');
  ok(!errs.length, '③ 화면 오류 없음' + (errs.length ? ' — ' + errs.slice(0, 2).join(' / ') : ''));
  N.live.stop(); await b.close();
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tNOTEFX1 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류 ' + (e && e.stack || e)); process.exit(1); });
