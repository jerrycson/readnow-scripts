// tNOTE4 — 📓 정범 노트 4 (note4 · 정범님 11/13 14:57)
//  ① 클라우드: state 'held'(⏸ 보류)를 받아 씀(전엔 버려져 보류가 저장되지 않았음)
//  ② 화면 핵심(Playwright · 가짜 저장소): 새로 온 것 카드를 펼치는 순간 읽음(readAt) = 검토로 옮김 · 펼친 동안은 새로 온 것 목록에 그대로(튀지 않음) ·
//     접으면 새로 온 것 목록에서 빠지고 검토 탭에 있음 · ⏸ 보류 탭 · [⏸ 보류] → state held → 보류 탭 · [↩ 검토로] → 검토
//  ③ 아티팩트 껍데기(RN_JBNOTE 있으면): 맨 위 바로 가기 다섯 단추(📓 · 📋 앞 · 설계안 · 결정 판 · 점검 과제) + 웹앱 · 보류 쓰기가 클라우드까지
//  ④ 웹앱(RN_PORT · harness): 📓 ⏸ 보류 탭 · [⏸ 보류] → Firestore jb_notes state held
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const COREF = pick(path.join(__dirname, '..', 'notes-core.js'));
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 5); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: col, D }; }
const JUMP = [['📓 정범 노트', 'VQdVQndKFHTTVhwmarrvko'], ['📋 작업판', 'QSpoAQ2dd2PpGNtwHV9QfN'], ['🏗 리드나우 2 설계안', '3f9yMZiMDDvpKeWPCiXzZ5'], ['🙋 결정 판', '8Ti2qi1ggdrt6uSAuBbYxb'], ['🗂 점검 과제 차례', 'Vk5XZ8pebDUA7gcupfUQCB']];

(async () => {
  const core = fs.readFileSync(COREF, 'utf8'); const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  ok(J.tabOf({ kind: 'card', state: 'held' }) === 'held' && J.stateOf({ state: 'held' }) === 'held' && !J.isNew({ kind: 'card', state: 'held' }), '② 핵심: state held = ⏸ 보류 탭(새로 온 것에 안 섞임)');

  // ── ① 클라우드 ──
  const { makeNotes } = require(NOTESF); const F = fakeC(); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  await N.write([{ op: 'set', id: 'h1', data: { kind: 'card', title: 'a', state: 'open' } }], 'lead');
  await N.write([{ op: 'merge', id: 'h1', data: { state: 'held', stateAt: 'x' } }], 'artifact');
  ok(F.D.jb_notes.get('h1').state === 'held', '① 클라우드가 state held(⏸ 보류)를 받아 씀');
  await N.write([{ op: 'merge', id: 'h1', data: { state: 'nope' } }], 'artifact'); ok(F.D.jb_notes.get('h1').state === 'held', '① 모르는 상태 글자는 여전히 버림');
  N.live.stop();

  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!chromium) { console.log('… ② 화면 시험은 playwright로(건너뜀)'); console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0); }
  const b = await chromium.launch(); const errs = [];
  // ── ② 화면 핵심(가짜 저장소) ──
  { const a = await b.newPage({ viewport: { width: 1000, height: 900 } }); a.on('pageerror', (e) => errs.push(e.message));
    await a.setContent('<!doctype html><meta charset="utf-8"><div id="root"></div>');
    await a.addScriptTag({ content: core });
    await a.evaluate(() => { const docs = new Map([
        ['n1', { kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '새 카드 하나', body: '본문 하나\n\n'.repeat(40), src: 'lead', state: 'open' }],
        ['n2', { kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '새 카드 둘', body: '본문 둘', src: 'lead', state: 'open' }],
        ['r1', { kind: 'card', cat: '우리숍', sub: '서버', imp: 2, title: '검토 카드', body: '본문', src: 'lead', readAt: 'x', state: 'open' }]]);
      const subs = new Set(); window.__docs = docs; window.__ops = [];
      const store = { docs: () => docs, onChange: (f) => subs.add(f), status: () => ({ ok: true, label: '시험' }), send: async () => ({ status: 'queued' }),
        write: async (ops) => { for (const o of ops) { window.__ops.push(o); docs.set(o.id, o.op === 'set' ? { ...o.data } : { ...(docs.get(o.id) || {}), ...o.data }); } setTimeout(() => subs.forEach((f) => f()), 5); } };
      try { localStorage.removeItem('jbn-ui'); } catch (e) {}
      window.__ui = JBN.mount(document.getElementById('root'), store, {}); });
    const ids = () => a.evaluate(() => [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card).join());
    const cnt = (k) => a.evaluate((k) => (document.querySelector(`.jbn-tabs [data-tab="${k}"] .n`) || {}).textContent || '', k);
    const tabs = await a.evaluate(() => [...document.querySelectorAll('.jbn-tabs [data-tab]')].map((x) => x.dataset.tab).join());
    ok(/new,held,done/.test(tabs), '② 탭 줄에 ⏸ 보류(새로 온 것 다음) — ' + tabs);
    await a.click('.jbn-tabs [data-tab="new"]'); await a.waitForTimeout(100);
    ok((await ids()) === 'n1,n2' || (await ids()) === 'n2,n1', '② 새로 온 것 탭 = 안 읽은 두 장');
    await a.click('[data-card="n1"] [data-act="toggle"]'); await a.waitForTimeout(150);
    const s1 = await a.evaluate(() => ({ readAt: !!window.__docs.get('n1').readAt, open: !!document.querySelector('[data-card="n1"] [data-body]'), moved: (document.querySelector('[data-card="n1"]') || {}).dataset?.moved, ids: [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card).sort().join() }));
    ok(s1.readAt, '② 펼치는 순간 읽음(readAt) 저장 = 검토로 옮김');
    ok(s1.open && s1.ids === 'n1,n2' && s1.moved === '1', '② 펼친 동안은 새로 온 것 목록에 그대로(읽던 카드가 튀지 않음) · "검토로 옮겨짐" 표시');
    ok((await cnt('new')) === '1' && (await cnt('review')) === '2', '② 탭 수는 바로 바뀜(새로 온 것 1 · 검토 2)');
    // 다른 쓰기가 와서 다시 그려져도 펼친 카드는 그 자리
    await a.evaluate(() => window.__ui.render()); ok((await ids()).split(',').sort().join() === 'n1,n2', '② 다시 그려도 펼친 카드는 그 자리');
    await a.click('[data-card="n1"] [data-act="toggle"]'); await a.waitForTimeout(150);
    ok((await ids()) === 'n2', '② 접으면 새로 온 것 목록에서 빠짐');
    await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(100);
    ok((await ids()).split(',').sort().join() === 'n1,r1', '② 접은 카드는 검토 탭에 있음');
    // ⏸ 보류
    await a.click('[data-card="r1"] [data-act="hold"]'); await a.waitForTimeout(150);
    ok(await a.evaluate(() => window.__docs.get('r1').state === 'held'), '② [⏸ 보류] → state held 저장');
    ok(!(await ids()).includes('r1') && (await cnt('held')) === '1', '② 보류한 카드는 검토에서 빠지고 ⏸ 보류 탭 수 1');
    await a.click('.jbn-tabs [data-tab="held"]'); await a.waitForTimeout(100);
    const h = await a.evaluate(() => ({ ids: [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card).join(), acts: [...document.querySelectorAll('[data-card="r1"] [data-act]')].map((x) => x.dataset.act).join() }));
    ok(h.ids === 'r1' && /restore/.test(h.acts) && /done/.test(h.acts) && /trash/.test(h.acts) && !/hold/.test(h.acts), '② ⏸ 보류 탭 = 보류 카드 · [↩ 검토로][✅ 완료][🗑 휴지통]');
    await a.click('[data-card="r1"] [data-act="restore"]'); await a.waitForTimeout(150);
    ok(await a.evaluate(() => window.__docs.get('r1').state === 'open'), '② [↩ 검토로] → 다시 검토');
    const empty = await a.evaluate(() => (document.querySelector('.jbn-empty') || {}).textContent || '');
    ok(/보류한 카드가 없습니다/.test(empty), '② 빈 보류 탭 안내 글');
    if (process.env.RN_SHOT) { await a.evaluate(() => { window.__docs.set('r1', { ...window.__docs.get('r1'), state: 'held' }); window.__ui.render(); }); await a.screenshot({ path: process.env.RN_SHOT + '/n4_core_held.png' }); await a.evaluate(() => { window.__docs.set('r1', { ...window.__docs.get('r1'), state: 'open' }); window.__ui.render(); }); }
    // ── ②-2 (정범님 15:06) 고른 글 → 그 자리 버블 → Enter · 아래 붙은 통합 입력칸 ──
    await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(100);
    await a.click('[data-card="n1"] [data-act="toggle"]'); await a.waitForTimeout(150);
    const pickText = () => a.evaluate(() => { const el = document.querySelectorAll('[data-body="n1"] p')[3]; el.scrollIntoView({ block: 'center' }); const r = document.createRange(); const tn = el.firstChild; r.setStart(tn, 0); r.setEnd(tn, 5); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); return scrollY; });
    const y0 = await pickText(); await a.waitForTimeout(350);
    ok(await a.evaluate(() => { const b = document.querySelector('.jbn-selbtn'); return b && !b.hidden; }), '②-2 글을 고르면 [💬 메모 달기]');
    await a.click('.jbn-selbtn'); await a.waitForTimeout(120);
    const bb = await a.evaluate(() => { const b = document.querySelector('.jbn-bub'); const r = b.getBoundingClientRect(); return { show: !b.hidden, focus: document.activeElement && document.activeElement.id, y: scrollY, top: r.top, bottom: r.bottom, qt: b.querySelector('[data-bq]').textContent, inView: r.top >= 0 && r.bottom <= innerHeight, ta: !!document.querySelector('[data-comp="n1"] textarea:focus') }; });
    ok(bb.show && bb.focus === 'jbn-bub-ta' && bb.y === y0 && bb.inView && /본문 하나/.test(bb.qt) && !bb.ta, '②-2 [💬 메모 달기] → 그 자리 버블(인용 보임 · 입력칸에 바로 · 화면 안 움직임 · 카드 아래 입력칸으로 안 내려감)');
    await a.type('#jbn-bub-ta', '첫 줄'); await a.keyboard.down('Shift'); await a.keyboard.press('Enter'); await a.keyboard.up('Shift'); await a.type('#jbn-bub-ta', '둘째 줄');
    ok(await a.evaluate(() => !document.querySelector('.jbn-bub').hidden && document.getElementById('jbn-bub-ta').value === '첫 줄\n둘째 줄'), '②-2 Shift+Enter = 줄바꿈(버블 그대로)');
    const n0 = await a.evaluate(() => window.__ops.length);
    await a.press('#jbn-bub-ta', 'Enter'); await a.waitForTimeout(200);
    const sv = await a.evaluate((n0) => { const o = window.__ops.slice(n0).find((x) => x.data && x.data.kind === 'memo'); return { o, hid: document.querySelector('.jbn-bub').hidden, y: scrollY, feed: (document.getElementById('jbn-feed') || {}).innerText || '' }; }, n0);
    ok(sv.o && sv.o.data.cardId === 'n1' && sv.o.data.quote === '본문 하나' && sv.o.data.text === '첫 줄\n둘째 줄' && sv.hid && Math.abs(sv.y - y0) < 2 && /첫 줄/.test(sv.feed), '②-2 Enter → 인용+메모가 통합 노트에 쌓임 · 버블 닫힘 · 읽던 자리 그대로');
    await pickText(); await a.waitForTimeout(350); await a.click('.jbn-selbtn'); await a.waitForTimeout(100); await a.type('#jbn-bub-ta', '버릴 글'); await a.press('#jbn-bub-ta', 'Escape'); await a.waitForTimeout(100);
    ok(await a.evaluate((n) => document.querySelector('.jbn-bub').hidden && window.__ops.length === n, n0 + 1), '②-2 Esc → 닫힘(쌓지 않음)');
    await a.evaluate(() => scrollTo(0, 0)); await a.waitForTimeout(80);
    const dk = await a.evaluate(() => { const d = document.getElementById('jbn-dock'); const r = d.getBoundingClientRect(); return { pos: getComputedStyle(d).position, bottom: r.bottom, h: innerHeight, n: d.querySelector('.dn').textContent, long: document.documentElement.scrollHeight > innerHeight * 1.5 }; });
    ok(dk.pos === 'sticky' && dk.long && Math.abs(dk.bottom - dk.h) <= 2 && /쌓인 메모 1건 · 인용 1건/.test(dk.n), '②-2 통합 입력칸은 화면 아래에 붙음(sticky · 맨 위에서도 보임) · 쌓인 수·인용 수 — ' + dk.n);
    await a.fill('#jbn-feed-ta', '바로 쓰는 말'); await a.press('#jbn-feed-ta', 'Enter'); await a.waitForTimeout(200);
    ok(await a.evaluate(() => window.__ops.some((o) => o.data && o.data.kind === 'memo' && o.data.text === '바로 쓰는 말' && !o.data.cardId) && /쌓인 메모 2건/.test(document.querySelector('#jbn-dock .dn').textContent)), '②-2 아래 입력칸 Enter → 통합 노트에 바로 적힘 · 수 2');
    await a.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await a.waitForTimeout(80);
    const fd = await a.evaluate(() => { const f = document.getElementById('jbn-feed').getBoundingClientRect(), d = document.getElementById('jbn-dock').getBoundingClientRect(); return f.bottom <= d.top + 1; });
    ok(fd, '②-2 맨 아래에서 통합 노트 목록을 입력칸이 가리지 않음');
    if (process.env.RN_SHOT) { await pickText(); await a.waitForTimeout(350); await a.click('.jbn-selbtn'); await a.type('#jbn-bub-ta', '이 문장 다시 확인'); await a.screenshot({ path: process.env.RN_SHOT + '/n4_core_bubble.png' }); await a.press('#jbn-bub-ta', 'Escape'); }
    // 휴대폰 폭
    await a.setViewportSize({ width: 400, height: 800 }); await a.waitForTimeout(150);
    await pickText(); await a.waitForTimeout(350); await a.click('.jbn-selbtn'); await a.waitForTimeout(120);
    const ph = await a.evaluate(() => { const b = document.querySelector('.jbn-bub').getBoundingClientRect(); const d = document.getElementById('jbn-dock').getBoundingClientRect(); return { b: [b.left, b.right, b.top], d: [d.left, d.right], sw: document.documentElement.scrollWidth, w: innerWidth }; });
    ok(ph.b[0] >= 0 && ph.b[1] <= 400 && ph.b[2] < 80 && ph.d[1] <= 401 && ph.sw <= ph.w, '②-2 휴대폰 폭: 버블은 화면 위(자판에 안 가림) · 입력칸·버블이 옆으로 넘치지 않음 ' + JSON.stringify(ph));
    if (process.env.RN_SHOT) await a.screenshot({ path: process.env.RN_SHOT + '/n4_core_phone.png' });
    await a.press('#jbn-bub-ta', 'Escape');
    await a.close(); }

  // ── ②-3 (정범님 16:00) 단추 즉시 반응(저장은 뒤에서 · 실패하면 되돌림) · 작업판 카드 링크 ──
  { const a = await b.newPage({ viewport: { width: 1000, height: 900 } }); a.on('pageerror', (e) => errs.push(e.message));
    await a.setContent('<!doctype html><meta charset="utf-8"><div id="root"></div>'); await a.addScriptTag({ content: core });
    await a.evaluate(() => { const docs = new Map(); for (let i = 0; i < 40; i++) docs.set('k' + i, { kind: 'card', cat: ['웹앱', '우리숍', '참고LOST'][i % 3], sub: '묶음' + (i % 5), imp: 1 + (i % 3), title: '카드 ' + i, body: ('본문 ' + i + ' ').repeat(60), src: 'lead', readAt: 'x', state: 'open' });
      docs.set('b1', { kind: 'card', cat: '웹앱', sub: '노트', imp: 3, title: '작업판과 이어진 카드', body: '작업판 n1113p 에서 고르시면 됩니다.', ref: '작업판 n1113p', src: 'lead', readAt: 'x', state: 'open' });
      const subs = new Set(); window.__docs = docs; window.__slow = 1500; window.__fail = false;
      const store = { docs: () => docs, onChange: (f) => subs.add(f), status: () => ({ ok: true, label: '시험' }), send: async () => ({ status: 'queued' }),
        write: (ops) => new Promise((res, rej) => setTimeout(() => { if (window.__fail) return rej(Object.assign(new Error('커넥터 거절'), { code: 'tool_error' })); for (const o of ops) docs.set(o.id, o.op === 'set' ? { ...o.data } : { ...(docs.get(o.id) || {}), ...o.data }); subs.forEach((f) => f()); res(); }, window.__slow)) };
      try { localStorage.removeItem('jbn-ui'); } catch (e) {}
      window.__ui = JBN.mount(document.getElementById('root'), store, {}); });
    await a.waitForSelector('[data-card="k3"] [data-act="done"]'); /* (note5) 잰 값 = 페이지 안에서 누름 → 화면 바뀜(Playwright가 누르기 전에 기다리는 시간은 빼고 — 컴퓨터가 바쁠 때 1초 넘게 튀었음) */
    const fast = await a.evaluate(() => { const t0 = performance.now(); document.querySelector('[data-card="k3"] [data-act="done"]').click(); return { gone: !document.querySelector('[data-card="k3"]'), done: (document.querySelector('.jbn-tabs [data-tab="done"] .n') || {}).textContent, saved: window.__docs.get('k3').state, dt: Math.round(performance.now() - t0) }; });
    const dt = fast.dt;
    ok(fast.gone && fast.done === '1' && fast.saved === 'open' && dt < 600, `②-3 [✅ 완료] → 저장(1.5초 걸리는 커넥터)을 기다리지 않고 화면이 바로 바뀜(${dt}ms) · 저장은 뒤에서`);
    await a.waitForTimeout(1700); ok(await a.evaluate(() => window.__docs.get('k3').state === 'done' && window.__ui.U.ov.size === 0), '②-3 저장이 끝나면 덧씌움을 걷음(원본 = 완료)');
    await a.evaluate(() => { window.__fail = true; window.__slow = 400; }); await a.click('[data-card="k5"] [data-act="archive"]');
    ok(await a.evaluate(() => !document.querySelector('[data-card="k5"]')), '②-3 실패할 쓰기도 먼저 화면에서 옮김');
    await a.waitForTimeout(700);
    const rb = await a.evaluate(() => ({ back: !!document.querySelector('[data-card="k5"]'), toast: (document.querySelector('.jbn-toast') || {}).textContent || '' }));
    ok(rb.back && /되돌렸습니다/.test(rb.toast), '②-3 저장 실패 → 화면을 되돌리고 "저장 못 함 — 되돌렸습니다"');
    const rms = await a.evaluate(() => { const t = performance.now(); for (let i = 0; i < 10; i++) window.__ui.render(); return (performance.now() - t) / 10; });
    ok(rms < 60, `②-3 카드 41장 전체 다시 그리기 한 번 ${rms.toFixed(1)}ms`);
    const ln = await a.evaluate(() => ({ btn: (document.querySelector('[data-card="b1"] .jbn-bdb') || {}).href, txt: (document.querySelector('[data-card="b1"] .jbn-bdb') || {}).textContent }));
    ok(ln.btn === 'https://claude.ai/artifact/QSpoAQ2dd2PpGNtwHV9QfN#n1113p' && /작업판 n1113p/.test(ln.txt), '②-3 작업판 카드와 이어진 노트 카드 → [📋 작업판 n1113p ↗] (주소 #n1113p로 그 카드)');
    await a.evaluate(() => { window.__fail = false; window.__slow = 0; }); await a.click('[data-card="b1"] [data-act="toggle"]'); await a.waitForTimeout(150);
    ok(await a.evaluate(() => (document.querySelector('[data-body="b1"] a.jbn-bd') || {}).href === 'https://claude.ai/artifact/QSpoAQ2dd2PpGNtwHV9QfN#n1113p'), '②-3 본문 속 카드 번호도 링크');
    console.log(`  (잰 값) 단추 → 화면 바뀜 ${dt}ms · 다시 그리기 ${rms.toFixed(1)}ms`);
    await a.close(); }

  // ── ③ 아티팩트 껍데기 ──
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  if (!ART) console.log('… ③ 아티팩트 화면 시험은 RN_JBNOTE로(건너뜀)');
  else {
    const F2 = fakeC(); const KEY = 'k'.repeat(48); await F2.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N2 = makeNotes({ C: F2.C, log: () => {}, ver: 'T' });
    await N2.write([{ op: 'set', id: 'c1', data: { kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '보류할 카드', body: '본문', src: 'lead', readAt: 'x', state: 'open' } }], 'lead');
    const a = await b.newPage({ viewport: { width: 1100, height: 900 } }); a.on('pageerror', (e) => errs.push(e.message)); await a.route(/^https?:\/\//, (r) => r.fulfill({ status: 404, body: '' }));
    await a.exposeFunction('__mcpCall', async (server, tool, input) => { let out = ''; await N2.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: input } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
    await a.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
      const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
      const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } };
      window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
    await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' })); await a.goto('https://art.test/'); await a.waitForTimeout(1800);
    const top = await a.evaluate(() => ({ cur: (document.querySelector('.rnjump .cur') || {}).textContent, all: [...document.querySelectorAll('.rnjump > a, .rnjump > span.cur')].map((x) => x.textContent + '|' + (x.href || '')) }));
    const five = top.all.slice(0, 5);
    ok(top.cur === '📓 정범 노트' && five.length === 5 && JUMP.every(([t, id], i) => five[i].startsWith(t) && (i === 0 || five[i].includes(id))) && top.all.some((x) => /웹앱\|https:\/\/readnow\.kr\/app/.test(x)), '③ 맨 위 다섯 단추(📓·📋 앞 · 설계안 · 결정 판 · 점검 과제) + 웹앱 — ' + top.all.map((x) => x.split('|')[0]).join(' · '));
    const tgt = await a.evaluate(() => [...document.querySelectorAll('.rnjump a')].every((x) => x.target === '_blank' && /noopener/.test(x.rel)));
    ok(tgt, '③ 바로 가기 링크는 새 탭(target _blank · noopener)');
    await a.click('[data-card="c1"] [data-act="hold"]'); await a.waitForTimeout(800);
    ok(F2.D.jb_notes.get('c1').state === 'held', '③ 아티팩트 [⏸ 보류] → 웹앱 원본(클라우드) state held');
    await a.click('.jbn-tabs [data-tab="held"]'); await a.waitForTimeout(200);
    ok((await a.evaluate(() => [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card).join())) === 'c1', '③ 아티팩트 ⏸ 보류 탭에 보임');
    if (process.env.RN_SHOT) await a.screenshot({ path: process.env.RN_SHOT + '/n4_art_jump.png' });
    await a.close(); N2.live.stop();
  }
  // ── ④ 웹앱 ──
  const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js');
  if (HP && process.env.RN_PORT) { const harness = require(HP);
    await harness(async (p) => { try {
      await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; });
      await p.evaluate(() => db.collection('jb_notes').doc('w1').set({ kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '웹앱 카드', body: '본문', src: 'lead', readAt: 'x', state: 'open' }));
      await p.click('#hnote'); await p.waitForTimeout(900);
      const t = await p.evaluate(() => [...document.querySelectorAll('#jbn_root .jbn-tabs [data-tab]')].map((x) => x.dataset.tab).join());
      ok(/held/.test(t), '④ 웹앱 📓 탭 줄에 ⏸ 보류');
      await p.click('#jbn_root [data-card="w1"] [data-act="hold"]'); await p.waitForTimeout(500);
      const st = await p.evaluate(async () => (await db.collection('jb_notes').doc('w1').get()).data().state);
      ok(st === 'held', '④ 웹앱 [⏸ 보류] → Firestore jb_notes state held(아티팩트와 같은 칸)');
      await p.click('#jbn_root .jbn-tabs [data-tab="held"]'); await p.waitForTimeout(300);
      ok((await p.evaluate(() => [...document.querySelectorAll('#jbn_root [data-card]')].map((x) => x.dataset.card).join())) === 'w1', '④ 웹앱 ⏸ 보류 탭에 보임');
      if (process.env.RN_SHOT) await p.screenshot({ path: process.env.RN_SHOT + '/n4_web_held.png' });
    } catch (e) { ok(false, '④ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } });
  } else console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
  ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
