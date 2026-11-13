// tNOTE5 — 📓 정범 노트 5 (note5 · 정범님 11/13 18:01)
//  ① 클라우드: kind slot(💾 저장 칸)·jbmemo(📝 내 메모) · slot·slotCur(1~3)·draft를 받아 씀 · 진단 목록에 내 메모 글이 나오지 않음
//  ② 핵심: queueOf(M, 칸)은 그 칸만 · 내 메모는 queueOf·compose에 안 잡힘
//  ③ 아티팩트(RN_JBNOTE · 390폭 · 가짜 claude.ai + 진짜 cloud/notes.js): 저장1·2·3 단추 · 쓰는 대로 서버 저장 · 칸 바꾸기 · 버블 인용도 그 칸 ·
//     새로고침 뒤 남음 · [저장n 보내기]는 그 칸만 보내고 비움(다른 칸 그대로) · 내 메모 쓰기·고치기·찾기·휴지통·되살리기 · 휴대폰 폭 넘침 없음
//  ④ 웹앱(RN_PORT · harness): 📓 통합 입력칸 위 저장1·2·3 · 📝 내 메모 쓰기 → Firestore jb_notes kind jbmemo
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const COREF = path.join(__dirname, '..', 'notes-core.js');
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 1); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: col, D }; }

(async () => {
  const core = fs.readFileSync(COREF, 'utf8'); const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  // ── ① 클라우드 ──
  const { makeNotes } = require(NOTESF); const F = fakeC(); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  await N.write([{ op: 'set', id: 'j1', data: { kind: 'jbmemo', text: '나만 보는 글 비밀아님', by: 'jb', at: 'x', state: 'open' } },
    { op: 'merge', id: 'slot_2', data: { kind: 'slot', slot: 2, draft: '쓰던 글', at: 'x' } }, { op: 'merge', id: '_meta', data: { slotCur: 3 } },
    { op: 'set', id: 'm1', data: { kind: 'memo', text: 'a', slot: 2, state: 'open', at: 'x' } }, { op: 'set', id: 'm9', data: { kind: 'memo', text: 'b', slot: 9, state: 'open', at: 'x' } }], 'artifact');
  const g = (id) => F.D.jb_notes.get(id) || {};
  ok(g('j1').kind === 'jbmemo', '① 클라우드가 kind jbmemo(📝 내 메모)를 받음 — 예전엔 버려서 card로 바뀌었음');
  ok(g('slot_2').kind === 'slot' && g('slot_2').slot === 2 && g('slot_2').draft === '쓰던 글', '① kind slot · slot · draft(쓰던 글)를 받음');
  ok(g('_meta').slotCur === 3, '① _meta.slotCur(고른 칸)를 받음');
  ok(g('m1').slot === 2 && g('m9').slot === undefined, '① 메모 slot 1~3만 받음(9는 버림)');
  const dg = await N.diag({}); const dj = JSON.stringify(dg.recent);
  ok(!dj.includes('나만 보는 글') && !dj.includes('쓰던 글') && dg.mine === 1, '① 진단 목록(리드가 읽는 것)에 내 메모·쓰던 글이 나오지 않음(수만)');
  N.live.stop();
  // ── ② 핵심 ──
  const M = J.model(new Map(Object.entries({ a: { kind: 'memo', text: '1', at: '1', state: 'open' }, b: { kind: 'memo', text: '2', slot: 2, at: '2', state: 'open' }, c: { kind: 'jbmemo', text: '내 것', at: '3', state: 'open' }, slot_2: { kind: 'slot', slot: 2, draft: 'd' } })));
  ok(J.queueOf(M, 1).map((m) => m.id).join() === 'a' && J.queueOf(M, 2).map((m) => m.id).join() === 'b' && J.queueOf(M, 3).length === 0, '② queueOf(칸) = 그 칸만(예전 메모는 저장1)');
  ok(J.queueOf(M).every((m) => m.kind === 'memo') && M.mine.length === 1 && !J.compose(J.queueOf(M), new Map()).includes('내 것'), '② 내 메모는 보낼 대기·보낼 글에 안 잡힘');
  ok(M.slots.get(2).draft === 'd', '② 칸 문서 slot_<n> 읽힘');

  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!chromium) { console.log('… ③④ 화면 시험은 playwright로(건너뜀)'); console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0); }
  const b = await chromium.launch(); const errs = [];
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  if (!ART) console.log('… ③ 아티팩트 화면 시험은 RN_JBNOTE로(건너뜀)');
  else {
    const F2 = fakeC(); const KEY = 'k'.repeat(48); await F2.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N2 = makeNotes({ C: F2.C, log: () => {}, ver: 'T' });
    await N2.write([{ op: 'set', id: 'c1', data: { kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '인용할 카드', body: '첫째 문장은 인용할 글입니다.\n\n둘째 문단.', src: 'lead', readAt: 'x', state: 'open' } }], 'lead');
    const G = (id) => F2.D.jb_notes.get(id) || {}; const memos = (slot) => [...F2.D.jb_notes.values()].filter((d) => d.kind === 'memo' && !d.batchId && d.state !== 'trashed' && (d.slot || 1) === slot);
    const ctxp = await b.newContext({ viewport: { width: 390, height: 800 }, hasTouch: false });
    const a = await ctxp.newPage(); a.on('pageerror', (e) => errs.push(e.message)); await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' }));
    await a.exposeFunction('__mcpCall', async (server, tool, input) => { if (server !== '리드나우 노트') return { __err: { code: 'server_not_connected', message: 'x' } }; let out = ''; await N2.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: input } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
    await ctxp.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
      const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
      const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } };
      window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
    await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' }));
    await a.goto('https://art.test/'); await a.waitForTimeout(1800);
    const slotTxt = () => a.evaluate(() => [...document.querySelectorAll('.jbn-slot')].map((x) => (x.getAttribute('aria-pressed') === 'true' ? '*' : '') + x.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
    ok((await a.$$('.jbn-dock .jbn-slot')).length === 3, '③ 통합 입력칸 위 💾 저장1·저장2·저장3 — ' + (await slotTxt()));
    ok(/^\*💾 저장1/.test(await slotTxt()), '③ 처음엔 저장1이 골라짐(표시)');
    // 저장1: 쓰던 글이 곧바로 서버에
    await a.click('#jbn-feed-ta'); await a.keyboard.type('저장1 쓰던 글'); await a.waitForTimeout(1200);
    ok(G('slot_1').draft === '저장1 쓰던 글', '③ 입력할 때마다 서버(노트 저장소)에 곧바로 저장 — 저장1 draft');
    ok(/저장됨/.test(await a.evaluate(() => (document.querySelector('[data-sv]') || {}).textContent || '')), '③ 입력칸 위에 「💾 저장됨 시:분」 표시');
    await a.keyboard.press('Enter'); await a.waitForTimeout(900);
    ok(memos(1).length === 1 && memos(1)[0].text === '저장1 쓰던 글' && G('slot_1').draft === '', '③ Enter = 저장1에 메모로 쌓임 · 쓰던 글 칸은 비움');
    // 버블 인용 → 저장1
    await a.evaluate(() => { const t = document.querySelector('[data-card="c1"] [data-act="toggle"]'); t.click(); });
    await a.waitForTimeout(400);
    await a.evaluate(() => { const p = document.querySelector('[data-body="c1"] p'); const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await a.waitForTimeout(500); await a.click('.jbn-selbtn'); await a.waitForTimeout(200);
    await a.fill('#jbn-bub-ta', '인용 메모'); await a.press('#jbn-bub-ta', 'Enter'); await a.waitForTimeout(900);
    ok(memos(1).length === 2 && memos(1).some((m) => m.quote && /인용할 글/.test(m.quote) && m.slot === 1), '③ 버블 인용도 고른 칸(저장1)에 쌓임');
    ok(/저장1\s*메모 2 · 인용 1/.test(await slotTxt()), '③ 칸 단추에 메모·인용 수 — ' + (await slotTxt()));
    // 저장2로 바꾸기 → 빈 칸
    await a.click('.jbn-slot[data-slot="2"]'); await a.waitForTimeout(700);
    ok(/^💾 저장1.*\| \*💾 저장2/.test(await slotTxt()) && (await a.inputValue('#jbn-feed-ta')) === '', '③ 저장2를 누르면 저장2가 골라지고 빈 입력칸');
    ok(G('_meta').slotCur === 2, '③ 고른 칸도 서버에(다른 기기에서 열어도 같은 칸)');
    ok((await a.evaluate(() => document.querySelectorAll('#jbn-feed .jbn-memo').length)) === 0, '③ 저장2 목록은 비어 있음(저장1 것 안 보임)');
    await a.click('#jbn-feed-ta'); await a.keyboard.type('저장2 첫 메모'); await a.keyboard.press('Enter'); await a.waitForTimeout(900);
    await a.click('#jbn-feed-ta'); await a.keyboard.type('저장2 쓰다 만 글'); await a.waitForTimeout(1200);
    ok(memos(2).length === 1 && G('slot_2').draft === '저장2 쓰다 만 글', '③ 저장2에 메모 1 + 쓰던 글 서버 저장');
    // 새로고침 뒤 남음
    await a.reload(); await a.waitForTimeout(2200);
    ok(/\*💾 저장2/.test(await slotTxt()) && (await a.inputValue('#jbn-feed-ta')) === '저장2 쓰다 만 글', '③ 새로고침 뒤에도 저장2 · 쓰던 글 그대로');
    ok(/저장1\s*메모 2 · 인용 1/.test(await slotTxt()), '③ 새로고침 뒤 저장1 쌓인 것 그대로 — ' + (await slotTxt()));
    // 다른 기기(새 창 · 기기 저장 없음)에서도 같음
    { const c2 = await b.newContext({ viewport: { width: 390, height: 800 } }); const a2 = await c2.newPage(); await a2.exposeFunction('__mcpCall', async (s, t, i) => { let out = ''; await N2.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); return JSON.parse(out).result.structuredContent; });
      await a2.addInitScript(() => { const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => ({ content: [], payload: await window.__mcpCall(s, t, i) }) }; window.claude = { use: async (n) => (n === 'mcp' ? mcp : null) }; });
      await a2.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' })); await a2.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' }));
      await a2.goto('https://art.test/'); await a2.waitForTimeout(2200);
      const v2 = await a2.evaluate(() => ({ ta: (document.querySelector('#jbn-feed-ta') || {}).value, cur: (document.querySelector('.jbn-slot[aria-pressed="true"]') || {}).dataset?.slot }));
      ok(v2.cur === '2' && v2.ta === '저장2 쓰다 만 글', '③ 다른 기기(기기 저장 없음)에서 열어도 같은 칸·같은 글');
      await c2.close(); }
    // 저장1로 돌아가 보내기 → 저장1만 비움
    await a.click('.jbn-slot[data-slot="1"]'); await a.waitForTimeout(700);
    ok((await a.inputValue('#jbn-feed-ta')) === '' && (await a.evaluate(() => document.querySelectorAll('#jbn-feed .jbn-memo').length)) === 2, '③ 저장1로 돌아가면 저장1 내용(메모 2) 그대로');
    await a.click('[data-act="send"]'); await a.waitForTimeout(1200);
    const bt = [...F2.D.jb_notes.values()].filter((d) => d.kind === 'batch');
    ok(bt.length === 1 && bt[0].slot === 1 && bt[0].memoIds.length === 2 && /인용할 글/.test(bt[0].text) && !/저장2/.test(bt[0].text), '③ [저장1 보내기] = 저장1 메모 2건만 한 묶음(slot 1)');
    ok(memos(1).length === 0 && memos(2).length === 1 && G('slot_2').draft === '저장2 쓰다 만 글', '③ 보낸 뒤 저장1은 비고 저장2는 그대로');
    ok(/💾 저장1\s*비어 있음/.test(await slotTxt()), '③ 저장1 단추 = 비어 있음 — ' + (await slotTxt()));
    // 📝 내 메모
    await a.click('.jbn-tabs [data-tab="mine"]'); await a.waitForTimeout(300);
    ok(!(await a.$('#jbn-dock')), '③ 📝 내 메모 탭에는 리드에게 보내는 입력칸이 없음');
    await a.fill('#jbn-mine-ta', '나만 볼 메모 하나'); await a.click('[data-act="mineadd"]'); await a.waitForTimeout(800);
    await a.fill('#jbn-mine-ta', '두 번째 기억할 것'); await a.press('#jbn-mine-ta', 'Control+Enter'); await a.waitForTimeout(800);
    const mine = () => [...F2.D.jb_notes.values()].filter((d) => d.kind === 'jbmemo');
    ok(mine().length === 2 && mine().every((d) => d.state === 'open' && d.by === 'jb'), '③ 내 메모 쓰기([📝 적기] · Ctrl+Enter) → 서버 kind jbmemo');
    ok((await a.evaluate(() => (document.querySelector('.jbn-tabs [data-tab="mine"] .n') || {}).textContent)) === '2', '③ 📝 내 메모 탭 수 2');
    const jid = mine().find((d) => d.text === '나만 볼 메모 하나'); const jidk = [...F2.D.jb_notes.entries()].find(([, v]) => v === jid)[0];
    await a.click(`[data-mine="${jidk}"] [data-act="medit"]`); await a.fill('#jbn-med', '나만 볼 메모 — 고침'); await a.click(`[data-mine="${jidk}"] [data-act="msave"]`); await a.waitForTimeout(800);
    ok(G(jidk).text === '나만 볼 메모 — 고침' && !!G(jidk).editedAt, '③ 내 메모 고치기');
    await a.fill('#jbn-q', '기억할'); await a.waitForTimeout(500);
    ok((await a.evaluate(() => [...document.querySelectorAll('.jbn-mi .tx')].map((x) => x.textContent).join('|'))) === '두 번째 기억할 것', '③ 위 찾기 칸으로 내 메모 찾기');
    await a.fill('#jbn-q', ''); await a.waitForTimeout(500);
    await a.click(`[data-mine="${jidk}"] [data-act="mtrash"]`); await a.waitForTimeout(800);
    ok(G(jidk).state === 'trashed' && (await a.evaluate(() => document.querySelectorAll('.jbn-mine > .jbn-mi').length)) === 1, '③ 🗑 휴지통으로(지우지 않음) · 목록에서 빠짐');
    await a.evaluate(() => { const d = document.querySelector('.jbn-mine details'); if (d) d.open = true; });
    await a.click(`[data-mine="${jidk}"] [data-act="mrestore"]`); await a.waitForTimeout(800);
    ok(G(jidk).state === 'open', '③ 휴지통에서 ↩ 되살리기');
    ok(![...F2.D.jb_notes.values()].some((d) => d.kind === 'batch' && /기억할|나만 볼/.test(d.text || '')) && !(await N2.diag({})).recent.some((r) => /기억할|나만 볼/.test(r.title || '')), '③ 내 메모는 보낸 묶음·리드 진단에 안 나옴');
    const wide = await a.evaluate(() => document.documentElement.scrollWidth); ok(wide <= 390, '③ 휴대폰 폭(390) 가로 넘침 없음 — ' + wide);
    if (process.env.RN_SHOT) { await a.screenshot({ path: process.env.RN_SHOT + '/n5_mine.png' }); await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(400); await a.screenshot({ path: process.env.RN_SHOT + '/n5_slots.png' }); }
    await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(300);
    const w2 = await a.evaluate(() => { const d = document.querySelector('.jbn-slots').getBoundingClientRect(); return d.right; }); ok(w2 <= 390, '③ 저장 단추 셋이 휴대폰 폭 안 — ' + Math.round(w2));
    await ctxp.close(); N2.live.stop();
  }
  // ── ④ 웹앱 ──
  const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js');
  if (HP && process.env.RN_PORT) { const harness = require(HP);
    await harness(async (p) => { try {
      await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; });
      await p.click('#hnote'); await p.waitForTimeout(900);
      ok((await p.$$('#jbn_root .jbn-slot')).length === 3, '④ 웹앱 📓 통합 입력칸 위 저장1·2·3');
      await p.click('#jbn_root .jbn-slot[data-slot="3"]'); await p.waitForTimeout(400);
      await p.fill('#jbn_root #jbn-feed-ta', '웹앱 저장3 글'); await p.press('#jbn_root #jbn-feed-ta', 'Enter'); await p.waitForTimeout(600);
      const m3 = await p.evaluate(async () => { const out = []; const ss = await db.collection('jb_notes').get(); ss.forEach((d) => { const v = d.data(); if (v.kind === 'memo') out.push(v.slot); }); return out.join(); });
      ok(m3 === '3', '④ 웹앱 저장3에 쌓으면 Firestore 메모 slot 3 — ' + m3);
      await p.click('#jbn_root .jbn-tabs [data-tab="mine"]'); await p.waitForTimeout(300);
      await p.fill('#jbn_root #jbn-mine-ta', '웹앱 내 메모'); await p.click('#jbn_root [data-act="mineadd"]'); await p.waitForTimeout(600);
      const k = await p.evaluate(async () => { const out = []; const ss = await db.collection('jb_notes').get(); ss.forEach((d) => { const v = d.data(); if (v.kind === 'jbmemo') out.push(v.text); }); return out.join(); });
      ok(k === '웹앱 내 메모', '④ 웹앱 📝 내 메모 → Firestore kind jbmemo');
    } catch (e) { ok(false, '④ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } });
  } else console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
  ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
