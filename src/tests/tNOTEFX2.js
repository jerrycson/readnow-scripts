// tNOTEFX2 — 📓 정범 노트 관리 기능(notefx2 · 정범님 11/18 14:17 「노트에 하이라이트 등 관리자에게 필요하고 유용한 모든 가능한 기능」)
//  ① 클라우드: hls(하이라이트 · 틀린 색은 노랑) · jbNote(내 메모) · jbTags(내 태그) · intent(묻기·할 일만) · seenSig를 받음
//     · 리드가 같은 카드를 다시 올려도(note-post merge) 읽음·완료·하이라이트·내 메모·내 태그가 그대로
//  ② 핵심: 탭(✨ 하이라이트 · 📚 전체) · 지문 sigOf/고쳐짐 isEdited · 낱말 여럿 찾기 · 걸러 보기 passF/fOf · 정렬 · 묶음 글에 ❓·📌 표시
//  ③ 아티팩트(RN_JBNOTE · 컴퓨터 1280 + 휴대폰 390 · deviceScaleFactor 1 · 가짜 claude.ai + 진짜 cloud/notes.js):
//     ❓ 도움말(늘 보이는 단추 · ? 키 · Esc) · 글 고름 → 🖍 색 막대 → 칠함 저장 · ✨ 탭 색 바꾸기·빼기·되살리기 · 🗒 내 메모 · 🏷 태그 · 찾기 · ⚗ 걸러 보기·정렬
//     · 🔗 링크 복사 · J/K/D 키 · ❓ 리드에게 묻기 · 📌 할 일로 · ✏ 고쳐짐 · 📚 전체 · 휴대폰 넘침 없음 · 브라우저 팝업 없음
//  ④ 웹앱(RN_PORT + harness.js): 📓에 ❓ 도움말 · 하이라이트가 Firestore jb_notes hls로 · JBN_WANT(링크로 연 카드)가 펼쳐짐
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
const card = (id, cat, sub, title, extra) => ({ op: 'set', id, data: { kind: 'card', cat, sub, imp: 2, title, body: title + ' 본문 글입니다', src: 'lead', readAt: 'x', state: 'open', createdAt: '2026-11-18T0' + id.slice(-1) + ':00:00Z', ...(extra || {}) } });
const seedOps = () => [card('w1', '웹앱', '노트', '웹앱 카드 1'), card('w2', '웹앱', '노트', '웹앱 카드 2', { imp: 3 }), card('w3', '웹앱', '노트', '웹앱 카드 3'),
  card('b1', '사업', '돈', '사업 카드 1', { src: 'h4' }), card('n1', '사업', '돈', '새 카드 1', { readAt: null })];
const repost = (id, title, body) => ({ op: 'merge', id, data: { kind: 'card', cat: '웹앱', sub: '노트', leaf: '', imp: 2, title, body, src: 'lead', srcAt: '2026-11-18T09:00:00Z', ref: '', createdAt: '2026-11-18T09:00:00Z', tags: ['리드태그'] } }); /* note-post.py md 와 같은 모양(state·readAt 없음) */

(async () => {
  // ── ① 클라우드 ──
  const { makeNotes } = require(NOTESF);
  { const F = fakeC(); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' }); await N.write(seedOps(), 'lead');
    await N.write([{ op: 'merge', id: 'w1', data: { hls: [{ q: '본문 글', c: 'g', at: '2026-11-18T10:00:00Z' }, { q: '카드', c: 'zz' }, { q: '' }, { q: '뺀 글', c: 'b', off: true, offAt: 'x' }, 7], jbNote: '내 생각', jbNoteAt: '2026-11-18T10:00:00Z', jbTags: ['급함', ' 돈 ', 3, ''], seenSig: 'abc.1', state: 'done', readAt: '2026-11-18T10:00:00Z' } },
      { op: 'set', id: 'm1', data: { kind: 'memo', cardId: 'w1', text: '물음', intent: 'ask', by: 'jb', at: '2026-11-18T10:00:00Z', state: 'open' } },
      { op: 'set', id: 'm2', data: { kind: 'memo', cardId: 'w1', text: '나쁜 뜻', intent: 'hack', by: 'jb', at: '2026-11-18T10:00:00Z', state: 'open' } }], 'jb');
    const w = F.D.jb_notes.get('w1') || {};
    ok(Array.isArray(w.hls) && w.hls.length === 3 && w.hls[0].q === '본문 글' && w.hls[0].c === 'g' && w.hls[1].c === 'y' && w.hls[2].off === true, '① 클라우드가 하이라이트 hls를 받음(빈 글·틀린 모양은 버림 · 모르는 색은 노랑 · 뺀 것 off) — ' + JSON.stringify(w.hls));
    ok(w.jbNote === '내 생각' && JSON.stringify(w.jbTags) === JSON.stringify(['급함', '돈']), '① 내 메모 jbNote · 내 태그 jbTags(다듬어서)를 받음 — ' + JSON.stringify(w.jbTags));
    ok(w.seenSig === 'abc.1', '① 읽을 때 남긴 지문 seenSig를 받음');
    ok((F.D.jb_notes.get('m1') || {}).intent === 'ask' && (F.D.jb_notes.get('m2') || {}).intent == null, '① 메모 intent는 ask·todo만(다른 값은 버림)');
    const r1 = await N.write([repost('w1', '웹앱 카드 1', '웹앱 카드 1 본문 글입니다')], 'lead'); /* note-post md 그대로 다시 올림(같은 글) */
    const w1b = F.D.jb_notes.get('w1') || {};
    ok(r1.n === 1 && JSON.stringify(w1b.tags) === '["리드태그"]' && w1b.state === 'done' && w1b.readAt === '2026-11-18T10:00:00Z' && (w1b.hls || []).length === 3 && w1b.jbNote === '내 생각' && (w1b.jbTags || []).length === 2, '① note-post가 같은 카드를 그대로 다시 올려도 완료·읽음·하이라이트·내 메모·내 태그가 그대로(리드 tags만 새로)');
    await N.write([{ ...repost('w1', '웹앱 카드 1', '리드가 고친 본문'), base: { body: '웹앱 카드 1 본문 글입니다' } }], 'lead'); /* 본문을 고칠 때는 읽었던 값(base)을 함께 — 없으면 충돌로 막힘(전부터) */
    const w2 = F.D.jb_notes.get('w1') || {};
    ok(w2.body === '리드가 고친 본문' && w2.state === 'done' && w2.readAt === '2026-11-18T10:00:00Z' && (w2.hls || []).length === 3 && w2.jbNote === '내 생각' && (w2.jbTags || []).length === 2 && w2.seenSig === 'abc.1', '① 리드가 본문을 고쳐 다시 올려도(base 함께) 완료·읽음·하이라이트·내 메모·내 태그·지문이 그대로');
    N.live.stop(); }
  // ── ② 핵심 ──
  const core = fs.readFileSync(COREF, 'utf8'); const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  ok(+J.version >= 9, '② 노트 핵심 9판(' + J.version + ')');
  const tk = J.TABS.map((t) => t[0]); ok(['review', 'fav', 'mine', 'hl', 'new', 'held', 'done', 'archived', 'all', 'trashed'].every((k) => tk.includes(k)) && tk.indexOf('all') < tk.indexOf('trashed'), '② 탭 = 검토·즐겨찾기·내 메모·✨ 하이라이트·새로 온 것·보류·완료·보관함·📚 전체·휴지통 — ' + tk.join(','));
  { const c = { title: 'a', body: 'b', readAt: 'x' }; const s = J.sigOf(c); ok(s === J.sigOf({ title: 'a', body: 'b' }) && s !== J.sigOf({ title: 'a', body: 'c' }), '② 지문 sigOf = 제목+본문이 같으면 같음 · 다르면 다름');
    ok(!J.isEdited({ ...c, seenSig: s }) && J.isEdited({ ...c, body: 'c', seenSig: s }) && !J.isEdited({ ...c, body: 'c' }), '② ✏ 고쳐짐 = 읽은 뒤 지문이 바뀐 카드만(지문 없는 옛 카드는 아님)'); }
  const docs = new Map(seedOps().map((o) => [o.id, o.data]).concat([['w1', { ...seedOps()[0].data, hls: [{ q: '형광펜낱말', c: 'p' }], jbNote: '나만의메모낱말', jbTags: ['급함'] }], ['m1', { kind: 'memo', cardId: 'w2', text: '메모속낱말', by: 'jb', at: '2026-11-18T10:00:00Z', state: 'open' }]]));
  const M = J.model(docs); const ids = (L) => L.map((c) => c.id).sort().join();
  const Q = (q) => ids(M.cards.filter((c) => J.matchQ(c, M, J.qToks(q))));
  ok(Q('웹앱 2') === 'w2' && Q('형광펜낱말') === 'w1' && Q('나만의메모낱말') === 'w1' && Q('#급함') === 'w1' && Q('메모속낱말') === 'w2' && Q('본문 카드') === 'b1,n1,w1,w2,w3', '② 찾기 = 낱말 모두 든 카드 · 하이라이트·내 메모·#태그·단 메모 글까지 봄');
  const P = (f) => ids(M.cards.filter((c) => J.passF(c, M, J.fOf(f), Date.parse('2026-11-18T12:00:00Z'))));
  ok(P({ cat: '사업' }) === 'b1,n1' && P({ imp: '3' }) === 'w2' && P({ rd: 'un' }) === 'n1' && P({ src: 'h4' }) === 'b1' && P({ tag: '급함' }) === 'w1' && P({ hl: true }) === 'w1' && P({ nt: true }) === 'w1' && P({ mm: true }) === 'w2' && P({ per: '1' }) === 'b1,n1,w1,w2,w3', '② ⚗ 걸러 보기 = 부류·중요도·안 읽음·출처·태그·하이라이트·내 메모·메모 있음·기간');
  { const f = J.fOf({ imp: '9', rd: 'zz', hl: 'yes', cat: 3, per: '7' }); ok(f.imp === '' && f.rd === '' && f.hl === false && f.cat === '' && f.per === '7' && J.fCount(f) === 1, '② 기기에 기억한 걸러 보기가 틀린 모양이면 버림'); }
  ok(J.sortCards(M.cards, 'title').map((c) => c.id).join() === 'b1,n1,w1,w2,w3' && J.sortCards(M.cards, 'imp')[0].id === 'w2' && J.sortCards(M.cards, 'new')[0].id === 'w3' && J.sortCards(M.cards, 'old')[0].id === 'w1', '② 정렬 = 제목 가나다·중요도·최근·오래된 차례');
  { const t = J.compose([{ cardId: 'w1', text: '왜?', intent: 'ask' }, { cardId: 'w2', text: '해 줘', intent: 'todo' }, { cardId: 'w3', text: '그냥' }], new Map(M.cards.map((c) => [c.id, c])), ''); ok(/❓ 리드에게 묻기 — 왜\?/.test(t) && /📌 할 일로 — 해 줘/.test(t) && /\n그냥\n/.test(t), '② 묶음 글에 ❓ 묻기·📌 할 일 표시(그냥 메모는 그대로)'); }
  ok(J.KB.length >= 12 && J.KB.some((k) => k[0] === '/') && J.KB.some((k) => k[0] === 'J · K'), '② 키보드 지름길 표 ' + J.KB.length + '줄');

  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  const SHOT = process.env.RN_SHOT || '';
  if (!chromium || !ART) console.log('… ③ 화면 시험은 RN_JBNOTE·playwright로(건너뜀)');
  else {
    // ── ③ 아티팩트 화면 ──
    const b = await chromium.launch(); const errs = [];
    const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' }); await N.write(seedOps(), 'lead');
    const G = (id) => F.D.jb_notes.get(id) || {}; const memos = () => [...F.D.jb_notes.values()].filter((d) => d.kind === 'memo');
    const open = async (vp, mobile) => {
      const cx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, ...(mobile ? { hasTouch: true, isMobile: true } : {}) });
      const a = await cx.newPage(); a.on('pageerror', (e) => errs.push(e.message)); a.on('dialog', (d) => { errs.push('브라우저 팝업 ' + d.type()); d.dismiss().catch(() => {}); });
      await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' }));
      await a.exposeFunction('__mcpCall', async (s, t, i) => { let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
      await cx.addInitScript(() => { const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { if (s !== '리드나우 노트') throw Object.assign(new Error('x'), { code: 'server_not_connected' }); const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } };
        window.claude = { use: async (k) => (k === 'mcp' ? mcp : null) };
        try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__clip = t; } } }); } catch (e) {} });
      await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'), contentType: 'text/html; charset=utf-8' }));
      await a.goto('https://art.test/'); await a.waitForTimeout(2500); return a; };
    const vis = (a) => a.evaluate(() => [...document.querySelectorAll('.jbn-card[data-card]')].filter((e) => e.getClientRects().length).map((e) => e.dataset.card));
    const pickText = (a, id, txt) => a.evaluate(([id, txt]) => { const el = document.querySelector(`[data-body="${id}"]`); if (!el) return false; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.nodeValue.indexOf(txt); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + txt.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } } return false; }, [id, txt]);
    const a = await open({ width: 1280, height: 900 });
    // ❓ 도움말
    let s = await a.evaluate(() => ({ help: !!document.querySelector('[data-act="help"]'), hnew: !!document.querySelector('.jbn-hnew'), tabs: [...document.querySelectorAll('.jbn-tabs [data-tab]')].map((x) => x.dataset.tab) }));
    ok(s.help && s.hnew, '③ 머리에 늘 보이는 ❓ 도움말 단추 + 처음엔 「새 기능」 알림 줄');
    ok(s.tabs.includes('hl') && s.tabs.includes('all'), '③ 탭 줄에 ✨ 하이라이트 · 📚 전체');
    await a.click('[data-act="help"]'); await a.waitForTimeout(300);
    s = await a.evaluate(() => ({ h: !!document.querySelector('#jbn-help'), kb: document.querySelectorAll('#jbn-help-kb tr').length, hnew: !!document.querySelector('.jbn-hnew') }));
    ok(s.h && s.kb >= 12 && !s.hnew, '③ ❓ 누르면 쓰는 법(지름길 표 ' + s.kb + '줄) · 알림 줄은 사라짐');
    if (SHOT) await a.screenshot({ path: SHOT + '/nfx2_help.png' });
    await a.keyboard.press('Escape'); await a.waitForTimeout(200); ok(!(await a.$('#jbn-help')), '③ Esc로 도움말 닫힘');
    await a.keyboard.press('Shift+Slash'); await a.waitForTimeout(200); ok(!!(await a.$('#jbn-help')), '③ ? 키로 도움말 열림'); await a.keyboard.press('Escape'); await a.waitForTimeout(200);
    // 🖍 하이라이트
    await a.click('.jbn-card[data-card="w1"] .jbn-tt'); await a.waitForTimeout(800);
    ok(await pickText(a, 'w1', '본문 글'), '③ 펼친 카드 본문 글 고름');
    await a.waitForTimeout(500);
    s = await a.evaluate(() => { const h = document.querySelector('.jbn-hlbar'); return { shown: !!h && !h.hidden && h.getClientRects().length > 0, n: h ? h.querySelectorAll('[data-hlc]').length : 0, sel: !document.querySelector('.jbn-selbtn') || !document.querySelector('.jbn-selbtn').hidden }; });
    ok(s.shown && s.n === 5 && s.sel, '③ 글을 고르면 [💬 메모 달기] 옆에 다섯 색 동그라미');
    if (SHOT) await a.screenshot({ path: SHOT + '/nfx2_hlbar.png' });
    await a.click('.jbn-hlbar [data-hlc="g"]'); await a.waitForTimeout(1500);
    ok((G('w1').hls || []).length === 1 && G('w1').hls[0].q === '본문 글' && G('w1').hls[0].c === 'g', '③ 초록 동그라미 → 서버 hls에 저장 — ' + JSON.stringify(G('w1').hls));
    ok(!!(await a.$('[data-body="w1"] mark.jbn-hl2.c-g')), '③ 본문에 초록으로 칠해 보임');
    // 🗒 내 메모 · 🏷 태그
    await a.fill('[data-jbnote="w1"]', '나만의메모낱말 — 다음 주에 보기'); await a.click('[data-mg="w1"] [data-act="jbnsave"]'); await a.waitForTimeout(1500);
    ok(/나만의메모낱말/.test(G('w1').jbNote || '') && !memos().length, '③ 🗒 내 메모 저장(서버 jbNote · 보낼 메모 칸에는 안 쌓임)');
    await a.fill('[data-tagin="w1"]', '급함'); await a.press('[data-tagin="w1"]', 'Enter'); await a.waitForTimeout(1500);
    ok(JSON.stringify(G('w1').jbTags) === '["급함"]', '③ 🏷 태그 칸 + Enter → 서버 jbTags');
    if (SHOT) await a.screenshot({ path: SHOT + '/nfx2_card.png' });
    // ✨ 탭
    await a.click('.jbn-tabs [data-tab="hl"]'); await a.waitForTimeout(400);
    ok((await a.$$('.jbn-hli[data-hcard="w1"]')).length === 1, '③ ✨ 하이라이트 탭에 칠한 글이 모임');
    await a.click('.jbn-hli[data-hcard="w1"] [data-act="hlc"][data-c="r"]'); await a.waitForTimeout(1400); ok(G('w1').hls[0].c === 'r', '③ ✨ 탭에서 빨강으로 바꿈');
    await a.click('.jbn-hli[data-hcard="w1"] [data-act="hloff"]'); await a.waitForTimeout(1400); ok(G('w1').hls[0].off === true && G('w1').hls.length === 1, '③ 빼기 = 지우지 않고 off');
    await a.click('[data-act="hloffv"]'); await a.waitForTimeout(300); await a.click('.jbn-hli[data-hcard="w1"] [data-act="hlon"]'); await a.waitForTimeout(1400); ok(!G('w1').hls[0].off, '③ 🗃 뺀 것 보기 → ↩ 되살리기');
    await a.click('[data-act="hloffv"]'); await a.waitForTimeout(200);
    await a.click('[data-act="hlcopy"]'); await a.waitForTimeout(300); ok(/본문 글/.test(await a.evaluate(() => window.__clip || '')), '③ 📋 하이라이트 모두 복사');
    if (SHOT) await a.screenshot({ path: SHOT + '/nfx2_hltab.png' });
    // 찾기 · 걸러 보기 · 정렬
    await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(300);
    await a.fill('#jbn-q', '나만의메모낱말'); await a.waitForTimeout(700); ok((await vis(a)).join() === 'w1', '③ 찾기가 내 메모 글까지 봄');
    await a.fill('#jbn-q', '웹앱 2'); await a.waitForTimeout(700); ok((await vis(a)).join() === 'w2', '③ 낱말 둘(웹앱 2) = 둘 다 든 카드만');
    await a.fill('#jbn-q', ''); await a.waitForTimeout(700);
    await a.click('[data-act="fp"]'); await a.waitForTimeout(300); ok(!!(await a.$('.jbn-fp')), '③ ⚗ 걸러 보기 판 열림');
    await a.selectOption('.jbn-fp select[data-f="cat"]', '사업'); await a.waitForTimeout(500); let v = await vis(a); ok(v.length && v.every((x) => x[0] === 'b' || x[0] === 'n'), '③ 부류 「사업」만 — ' + v.join());
    await a.selectOption('.jbn-fp select[data-f="cat"]', ''); await a.waitForTimeout(300);
    await a.selectOption('.jbn-fp select[data-f="sort"]', 'imp'); await a.waitForTimeout(500); v = await vis(a); ok(v[0] === 'w2' && !(await a.$('.jbn-cat[data-catk] .jbn-card')), '③ 정렬(중요도) = 나무 대신 한 줄 · 중요도 높은 w2 맨 위 — ' + v.join());
    if (SHOT) await a.screenshot({ path: SHOT + '/nfx2_filter.png' });
    await a.click('.jbn-fp [data-act="freset"]'); await a.waitForTimeout(400); ok(!!(await a.$('.jbn-cat[data-catk]')), '③ 모두 풀기 → 부류 나무로 돌아옴');
    // 🔗 링크 · 모두 접기
    await a.click('.jbn-card[data-card="w1"] [data-act="link"]'); await a.waitForTimeout(300); ok(/w1/.test(await a.evaluate(() => window.__clip || '')), '③ 🔗 링크 복사에 카드 번호 — ' + (await a.evaluate(() => window.__clip || '')).slice(0, 80));
    await a.click('[data-act="closeall"]'); await a.waitForTimeout(400); ok(!(await a.$('[data-body]')), '③ ⤴ 카드 모두 접기');
    await a.click('[data-act="catall"][data-v="0"]'); await a.waitForTimeout(400); ok(await a.evaluate(() => [...document.querySelectorAll('.jbn-cat[data-catk]')].every((d) => !d.open)), '③ 📁 부류 모두 접기');
    await a.keyboard.press('BracketRight'); await a.waitForTimeout(400); ok(await a.evaluate(() => [...document.querySelectorAll('.jbn-cat[data-catk]')].every((d) => d.open)), '③ ] 키로 부류 모두 펼치기');
    // ⌨ J/K/D
    await a.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await a.keyboard.press('j'); await a.keyboard.press('j'); await a.keyboard.press('k'); await a.waitForTimeout(200);
    const kc = await a.evaluate(() => { const e = document.querySelector('.jbn-card.jbn-kc'); return e && e.dataset.card; }); const first = (await vis(a))[0];
    ok(kc && kc === first, '③ J·J·K → 맨 앞 카드에 고른 테두리 — ' + kc);
    await a.keyboard.press('d'); await a.waitForTimeout(1500); ok(G(kc).state === 'done', '③ D 키 → 고른 카드 ✅ 완료');
    await a.click('.jbn-tabs [data-tab="all"]'); await a.waitForTimeout(400); v = await vis(a); ok(v.includes(kc) && v.length === 5, '③ 📚 전체 탭에 완료한 카드까지 모두(' + v.length + ')');
    // ❓ 묻기 · 📌 할 일
    await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(300);
    await a.click('.jbn-card[data-card="b1"] .jbn-tt'); await a.waitForTimeout(800);
    await a.fill('[data-ta="b1"]', '이 돈 얼마?'); await a.click('.jbn-card[data-card="b1"] [data-act="ask"]'); await a.waitForTimeout(1500);
    await a.click('.jbn-card[data-card="b1"] [data-act="todo"]'); await a.waitForTimeout(1500);
    const ms = memos().filter((m) => m.cardId === 'b1');
    ok(ms.some((m) => m.intent === 'ask' && m.text === '이 돈 얼마?') && ms.some((m) => m.intent === 'todo' && /할 일/.test(m.text)) && ms.every((m) => !m.batchId), '③ ❓ 리드에게 묻기 · 📌 할 일로 → 💾 저장 칸에 쌓임(빈 칸은 기본 글 · 보내기 전)');
    // ✏ 고쳐짐: 새 카드를 읽고 → 리드가 다시 올림
    await a.click('.jbn-tabs [data-tab="new"]'); await a.waitForTimeout(300); await a.click('.jbn-card[data-card="n1"] .jbn-tt'); await a.waitForTimeout(1500);
    ok(!!G('n1').readAt && G('n1').seenSig === J.sigOf(G('n1')), '③ 새 카드를 펼치면 읽음 + 지문 seenSig');
    { const r = await N.write([{ op: 'merge', id: 'n1', data: { kind: 'card', title: '새 카드 1', body: '리드가 고친 새 본문' }, base: { body: G('n1').body } }], 'lead'); ok(r.n === 1, '③ 리드가 읽은 카드 본문을 고침(base 함께)'); } await a.waitForTimeout(400);
    await a.reload(); await a.waitForTimeout(2500); await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(300);
    ok(/고쳐짐/.test(await a.evaluate(() => (document.querySelector('.jbn-card[data-card="n1"] .jbn-meta') || {}).textContent || '')), '③ 리드가 읽은 카드를 고쳐 다시 올리면 ✏ 고쳐짐');
    ok(!!G('n1').readAt && G('n1').state !== 'new' && (G('w1').hls || []).length === 1 && /나만의메모낱말/.test(G('w1').jbNote || ''), '③ 다시 올려도 읽음·하이라이트·내 메모 그대로');
    ok(!!(await a.$('[data-body="w1"] mark.jbn-hl2.c-r')) || !(await a.$('[data-body="w1"]')), '③ 새로고침 뒤에도 칠한 색 그대로(펼쳐 있으면)');
    await a.close();
    // 📱 휴대폰
    const p = await open({ width: 390, height: 800 }, true);
    await p.tap('[data-act="help"]'); await p.waitForTimeout(300); let ow = await p.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 392, '③ 휴대폰: 도움말 펼쳐도 넘침 없음(' + ow + 'px)');
    if (SHOT) await p.screenshot({ path: SHOT + '/nfx2_phone_help.png', fullPage: false });
    await p.tap('#jbn-help [data-act="help"]'); await p.waitForTimeout(200);
    const pv = (await vis(p)).filter((x) => x !== kc && x !== 'w1'); const pid = pv[0]; ok(!!pid, '③ 휴대폰: 검토 탭에 카드 보임 — ' + pv.join());
    await p.tap('.jbn-card[data-card="' + pid + '"] .jbn-tt'); await p.waitForTimeout(800); ok(await pickText(p, pid, '본문 글'), '③ 휴대폰: 본문 글 고름(' + pid + ')'); await p.waitForTimeout(500);
    const hb = await p.evaluate(() => { const h = document.querySelector('.jbn-hlbar'); const r = h && h.getBoundingClientRect(); return h && !h.hidden && r ? { l: r.left, r: r.right } : null; });
    ok(hb && hb.l >= 0 && hb.r <= 390, '③ 휴대폰: 색 막대가 화면 안 — ' + JSON.stringify(hb));
    await p.tap('.jbn-hlbar [data-hlc="b"]'); await p.waitForTimeout(1500); ok((G(pid).hls || []).some((h) => h.c === 'b'), '③ 휴대폰: 파랑 하이라이트 저장');
    await p.tap('[data-act="fp"]'); await p.waitForTimeout(300); ow = await p.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 392, '③ 휴대폰: 걸러 보기·카드 아래 칸 펼쳐도 넘침 없음(' + ow + 'px)');
    if (SHOT) await p.screenshot({ path: SHOT + '/nfx2_phone.png', fullPage: false });
    await p.close();
    ok(!errs.length, '③ 화면 오류·브라우저 팝업 없음' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
    N.live.stop(); await b.close();
  }
  // ── ④ 웹앱 ──
  const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js', '/home/user/readnow-chats/tools/session-kit/pw/harness.js');
  if (chromium && HP && process.env.RN_PORT) { const harness = require(HP);
    await harness(async (p) => { try {
      p.on('dialog', (d) => { ok(false, '④ 브라우저 팝업 ' + d.type()); d.dismiss().catch(() => {}); });
      await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; });
      await p.evaluate(() => Promise.all([db.collection('jb_notes').doc('w1').set({ kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '웹앱 카드', body: '웹앱 본문 글입니다', src: 'lead', readAt: 'x', state: 'open' }), db.collection('jb_notes').doc('w2').set({ kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '둘째 카드', body: '둘째 본문', src: 'lead', readAt: 'x', state: 'open' })]));
      await p.evaluate(() => { window.JBN_WANT = 'w2'; }); await p.click('#hnote'); await p.waitForTimeout(1200);
      ok(!!(await p.$('#jbn_root [data-body="w2"]')), '④ 웹앱: 링크로 연 카드(JBN_WANT)가 펼쳐짐');
      ok(!!(await p.$('#jbn_root [data-act="help"]')), '④ 웹앱 📓에도 ❓ 도움말 단추');
      await p.click('#jbn_root .jbn-card[data-card="w1"] .jbn-tt'); await p.waitForTimeout(600);
      const okSel = await p.evaluate(() => { const el = document.querySelector('#jbn_root [data-body="w1"]'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.nodeValue.indexOf('본문 글'); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 4); getSelection().removeAllRanges(); getSelection().addRange(r); return true; } } return false; });
      await p.waitForTimeout(500); if (okSel) await p.click('.jbn-hlbar [data-hlc="p"]'); await p.waitForTimeout(800);
      const hl = await p.evaluate(async () => ((await db.collection('jb_notes').doc('w1').get()).data() || {}).hls);
      ok(Array.isArray(hl) && hl[0] && hl[0].c === 'p' && hl[0].q === '본문 글', '④ 웹앱: 분홍 하이라이트 → Firestore jb_notes hls(아티팩트와 같은 칸)');
      await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await p.keyboard.press('j'); await p.waitForTimeout(200);
      ok(!!(await p.$('#jbn_root .jbn-card.jbn-kc')), '④ 웹앱: J 키가 노트 카드를 고름(웹앱 지름길과 겹치지 않음)');
      if (SHOT) await p.screenshot({ path: SHOT + '/nfx2_web.png' });
    } catch (e) { ok(false, '④ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } });
  } else console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tNOTEFX2 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류 ' + (e && e.stack || e)); process.exit(1); });
