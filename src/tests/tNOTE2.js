// tNOTE2 — 📓 정범 노트 (note2 · 정범님 11/13 11:54 · 12:16)
//  ① 웹앱 app.html 안 핵심(⟦jbn core⟧)이 원본 src/notes-core.js와 글자까지 같음
//  ② 클라우드 cloud/notes.js(가짜 Firestore): MCP 연결 확인(열쇠 없이 initialize·tools/list) · 열쇠 없으면 쓰기 거절 · 쓰기 → 길게 기다리던 note_sync가 바로 답(실시간) · 모르는 칸·휴대전화 번호 거름 · 진단 notes
//  ③ 화면 핵심: 대분류›중분류›소분류 차례(중요도) · 새로 온 것/검토 나눔 · 예전 노트(kind 없음) · 보낼 글이 답글 꼴(> 인용 + 메모)
//  ④ Playwright(RN_PORT · RN_JBNOTE=아티팩트 html 있으면): 웹앱 📓 화면과 아티팩트를 같은 가짜 클라우드로 이음 — 한쪽 쓰기가 다른 쪽에 몇 초 안 · ✅ 완료·🗄·🗑·되살리기 · 글 골라 💬 메모 달기 → 통합 노트 · 순서 바꾸기 · 📨 모두 보내기(send_message 한 번 · 인용 꼴) · 연결 없으면 '이 화면에만' · 머리 줄 ☰
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const APPF = pick(process.env.RN_APP, path.join(__dirname, '..', 'app.html'));
const COREF = pick(path.join(__dirname, '..', 'notes-core.js'));
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 가짜 Firestore(서버 쪽) — collection/doc/get/set(merge)/onSnapshot(docChanges) */
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 5); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: col, D }; }

(async () => {
  // ── ① 두 사본 ──
  const core = fs.readFileSync(COREF, 'utf8').replace(/\n+$/, '\n'); const app = fs.readFileSync(APPF, 'utf8');
  { const i = app.indexOf('/* ⟦jbn core 시작⟧'), j = app.indexOf('/* ⟦jbn core 끝⟧ */\n', i); ok(i > 0 && j > i && app.slice(i, j + '/* ⟦jbn core 끝⟧ */\n'.length) === core, '① 웹앱 app.html의 노트 핵심 = src/notes-core.js(글자까지 같음)'); }
  ok(/id="hnote"/.test(app) && /id="hmenu"/.test(app) && /id="tbmore"/.test(app) && /<span class="tbmore" id="tbmore"[^]*?id="dlbtn"[^]*?id="hpend"[^]*?id="hmgr"[^]*?id="hauto"[^]*?id="hman"[^]*?<\/span><\/span>/.test(app), '① 머리 줄: 📓 노트 · ☰ 안에 받기·연결 확정·관리도구·자동·설명서');

  // ── ② 클라우드 ──
  const { makeNotes } = require(NOTESF); const F = fakeC(); const KEY = 'k'.repeat(48);
  await F.C('app_secrets').doc('notes_mcp').set({ key: KEY });
  const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  const call = async (key, body) => { let code = 0, H = {}, out = ''; const res = { writeHead: (c, h) => { code = c; H = h || {}; }, end: (b) => { out = b || ''; } }; await N.handle({ method: 'POST' }, res, '/mcp/n/' + key, async () => body); return { code, H, j: out ? JSON.parse(out) : null }; };
  { const r = await call('wrong', { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }); ok(r.code === 200 && r.j.result.protocolVersion === '2025-06-18' && r.j.result.capabilities.tools && r.H['Mcp-Session-Id'], '② initialize — 열쇠 없이도 답(연결 확인) · 판 맞춤 · 세션 머리'); }
  { const r = await call('wrong', { jsonrpc: '2.0', id: 2, method: 'tools/list' }); ok(r.j.result.tools.map((t) => t.name).join(',') === 'note_info,note_sync,note_get,note_write', '② tools/list 네 도구'); }
  { const r = await call('wrong', { jsonrpc: '2.0', method: 'notifications/initialized' }); ok(r.code === 202, '② 알림은 202'); }
  { const r = await call('wrong', { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'note_write', arguments: { ops: [{ op: 'set', id: 'x', data: { title: 'a' } }] } } }); ok(r.j.error && /열쇠/.test(r.j.error.message) && !F.D.jb_notes, '② 열쇠가 틀리면 쓰기 거절(아무것도 안 씀)'); }
  const tc = async (name, args) => (await call(KEY, { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } })).j.result.structuredContent;
  const s0 = await tc('note_sync', {}); ok(s0.full && s0.docs.length === 0 && /:/.test(s0.cursor), '② 처음 sync = 전부(빈 저장소)');
  const w1 = await tc('note_write', { ops: [{ op: 'set', id: 'c1', data: { kind: 'card', cat: '웹앱', title: '첫 카드', body: '본문', imp: 9, evil: 'x', state: 'zzz' } }, { op: 'set', id: 'c2', data: { kind: 'card', title: '전화 010-1234-5678' } }] });
  ok(w1.n === 1 && w1.bad.length === 1 && /휴대전화/.test(w1.bad[0]), '② 휴대전화 번호 꼴은 거름');
  { const d = F.D.jb_notes.get('c1'); ok(d && !('evil' in d) && !('state' in d) && !('imp' in d) && d.updatedAt && d.lastBy === 'mcp', '② 모르는 칸·틀린 값은 버리고 updatedAt·lastBy는 서버가 찍음(by를 안 주면 mcp — note3)'); }
  await sleep(30); const s1 = await tc('note_sync', { cursor: s0.cursor }); ok(s1.docs.length === 1 && s1.docs[0].id === 'c1' && !s1.full, '② cursor 뒤 바뀐 것만');
  { const t0 = Date.now(); const pr = tc('note_sync', { cursor: s1.cursor, wait: 10 }); await sleep(300); await N.write([{ op: 'merge', id: 'c1', data: { state: 'done' } }], 'lead'); const s2 = await pr; const dt = Date.now() - t0;
    ok(s2.docs.length === 1 && s2.docs[0].state === 'done' && s2.docs[0].lastBy === 'lead' && dt < 1500, `② 길게 기다리던 note_sync가 쓰기 순간 답함(실시간 ${dt}ms · 리드 /kp-in 길 쓰기)`); }
  { const t0 = Date.now(); const s3 = await tc('note_sync', { cursor: (await tc('note_sync', {})).cursor, wait: 1 }); ok(s3.docs.length === 0 && Date.now() - t0 >= 900, '② 바뀐 것이 없으면 wait만큼 기다렸다 빈 답'); }
  await N.write([{ op: 'set', id: 'b1', data: { kind: 'batch', text: '보낼 글', status: 'queued', via: 'outbox', memoIds: ['m1'] } }], 'artifact');
  await sleep(40); { const dg = await N.diag({}); ok(dg.n === 2 && dg.queued.length === 1 && dg.queued[0].text === '보낼 글', '② 진단 notes — 보낼 묶음(queued)을 리드가 읽음'); }
  N.live.stop();

  // ── ③ 화면 핵심(순수 함수) ──
  const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  const docs = new Map([['a', { kind: 'card', cat: '웹앱', sub: '노트', imp: 1, title: '낮음', srcAt: '2026-11-13T01:00:00Z', src: 'lead', readAt: 'x' }], ['b', { kind: 'card', cat: '웹앱', sub: '노트', imp: 3, title: '높음', srcAt: '2026-11-13T00:00:00Z', src: 'lead' }], ['c', { kind: 'card', cat: '참고LOST', sub: '지시', imp: 3, title: 'LOST', src: 'lead', readAt: 'x' }], ['o', { title: '예전', folder: '사업', body: 'x' }], ['m', { kind: 'memo', cardId: 'b', quote: '고른 문장', text: '내 메모', at: '2026-11-13T02:00:00Z', ord: 5 }], ['m2', { kind: 'memo', cardId: null, text: '바로 씀', at: '2026-11-13T01:00:00Z', ord: 10 }]]);
  const M = J.model(docs); const T = J.tree(M.cards);
  ok(T[0].name === '완수 관제탑' && T.find((x) => x.name === '웹앱').subs[0].leaves[0].cards.map((c) => c.title).join(',') === '높음,낮음', '③ 대분류 차례(중요도 → 정한 차례) · 같은 칸 안 중요도 높은 것부터 · 완수 관제탑(옛 이름 참고LOST) 자리');
  ok(J.tabOf({ id: 'b', ...docs.get('b') }) === 'new' && J.tabOf({ id: 'a', ...docs.get('a') }) === 'review' && J.tabOf({ id: 'o', ...docs.get('o') }) === 'review', '③ 안 읽은 리드 카드 = 새로 온 것 · 읽은 것 = 검토 · 예전 노트(kind 없음)는 검토');
  { const Q = J.queueOf(M); const txt = J.compose(Q, new Map(M.cards.map((c) => [c.id, c])), 'L'); ok(Q.map((x) => x.id).join() === 'm,m2' && /\[1\] 「높음」 \(웹앱 › 노트\)\n> 고른 문장\n내 메모/.test(txt) && /\[2\] \(통합 노트에 바로 씀\)\n바로 씀/.test(txt), '③ 보낼 대기 차례(ord) · 보낼 글 = [번호] 카드 + "> 인용" + 메모(채팅 답글 꼴)'); }
  ok(J.md('# 제목\n- a\n- b\n\n| x | y |\n|---|---|\n| 1 | 2 |\n<script>alert(1)</script>').includes('<table>') && !J.md('<script>x</script>').includes('<script>'), '③ 마크다운 표·목록 · 글 속 스크립트는 글자로');

  // ── ④ Playwright ──
  const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js');
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  if (!HP || !process.env.RN_PORT) { console.log('… ④ 화면 시험은 RN_PORT(+ harness.js)로(건너뜀)'); }
  else { const SHOT = process.env.RN_SHOT || null; const F2 = fakeC(); await F2.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N2 = makeNotes({ C: F2.C, log: () => {}, ver: 'T' });
    const at = new Date().toISOString();
    await N2.write([{ op: 'set', id: 'c_bench', data: { kind: 'card', cat: '벤치마킹·엔진', sub: '집중 벤치마킹', leaf: '새벽 보고', imp: 3, title: '새벽 집중 벤치마킹 보고', body: '## 한 줄 요약\n어제 저녁 4시간 남짓 멈췄다가 23:06에 되살아났습니다.\n\n- 판매자 40곳 · 쪽 1,200', src: 'lead', srcAt: at, readAt: at } }, { op: 'set', id: 'c_ship', data: { kind: 'card', cat: '출고·주문', sub: '자동판정', imp: 2, title: '순이익 계산 고침', body: '새 공식은 판매가 − 수수료 − 택배비입니다.', src: 'lead', srcAt: at } }], 'lead');
    const harness = require(HP); const { chromium } = require('playwright');
    await harness(async (p) => { try {
      const pushQ = []; let relayOn = true; // 웹앱 쪽 가짜 Firestore ↔ 서버 쪽(=실제로는 같은 Firestore) 잇기
      await p.exposeFunction('__jbnToSrv', async (id, d) => { await F2.C('jb_notes').doc(id).set(d); });
      await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; db.collection('jb_notes').onSnapshot((ss) => ss.docChanges().forEach((ch) => { const d = ch.doc.data(); if (d && d.lastBy === 'webapp') window.__jbnToSrv(ch.doc.id, d); })); });
      F2.C('jb_notes').onSnapshot((ss) => ss.docChanges().forEach((ch) => { const d = ch.doc.data(); if (d.lastBy === 'webapp') return; if (relayOn) pushQ.push([ch.doc.id, d]); }));
      const relay = setInterval(async () => { while (pushQ.length) { const [id, d] = pushQ.shift(); try { await p.evaluate(([id, d]) => db.collection('jb_notes').doc(id).set(d), [id, d]); } catch (e) {} } }, 150);
      await p.waitForTimeout(600);
      // 아티팩트 쪽 페이지
      const b2 = await chromium.launch(); const a = await b2.newPage({ viewport: { width: 1100, height: 900 } }); const aErr = []; a.on('pageerror', (e) => aErr.push(e.message)); await a.route(/^https?:\/\//, (r) => r.fulfill({ status: 404, body: '' }));
      const sent = []; await a.exposeFunction('__mcpCall', async (server, tool, input) => { if (server === 'Claude Code Remote') { sent.push(input); return { ok: true }; } const r = await (async () => { let out = ''; await N2.handle({ method: 'POST' }, { writeHead() {}, end: (b) => { out = b; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: input } })); return JSON.parse(out); })(); if (r.error) throw new Error(r.error.message); return r.result.structuredContent; });
      await a.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
        const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
        const mcp = { listTools: async () => (window.__noConn ? { servers: [] } : { servers: [{ server: '리드나우 노트', authStatus: 'connected', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); return { content: [], payload: p }; } };
        window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
      if (!ART) { console.log('… ④ 아티팩트 html(RN_JBNOTE) 없음 — 웹앱만'); }
      else { await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' })); await a.goto('https://art.test/'); await a.waitForTimeout(1500); }
      // 웹앱 📓 열기
      await p.click('#hnote'); await p.waitForTimeout(900);
      const w0 = await p.evaluate(() => document.getElementById('jbn_root').innerText);
      ok(/새벽 집중 벤치마킹 보고/.test(w0) && /새로 온 것\s*1/.test(w0) && /실시간/.test(w0), '④ 웹앱 📓 — 리드 카드(서버 쓰기)가 보임 · 새로 온 것 1 · 🟢 실시간');
      if (ART) { const a0 = await a.evaluate(() => document.getElementById('root').innerText); ok(/새벽 집중 벤치마킹 보고/.test(a0) && /웹앱과 실시간/.test(a0), '④ 아티팩트 — 같은 카드 · 🟢 웹앱과 실시간');
        if (SHOT) await a.screenshot({ path: SHOT + '/art_review.png' });
        // 웹앱에서 ✅ 완료 → 아티팩트에 몇 초 안
        const t0 = Date.now(); await p.click('[data-card="c_bench"] [data-act="done"]');
        let seen = false; for (let i = 0; i < 40 && !seen; i++) { await a.waitForTimeout(150); seen = await a.evaluate(() => /✅ 완료\s*1/.test(document.querySelector('.jbn-tabs').innerText)); }
        ok(seen, `④ 웹앱 [✅ 완료] → 아티팩트 완료 탭에 ${Date.now() - t0}ms 안에 보임`);
        // 아티팩트: 새로 온 것 → 펼침(읽음) → 글 고르기 → 💬 메모 달기
        await a.click('.jbn-tabs [data-tab="new"]'); await a.click('[data-card="c_ship"] [data-act="toggle"]'); await a.waitForTimeout(400);
        await a.evaluate(() => { const el = document.querySelector('[data-body="c_ship"] p'); const r = document.createRange(); const tn = el.firstChild; r.setStart(tn, 0); r.setEnd(tn, 12); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); }); await a.waitForTimeout(400);
        ok(await a.evaluate(() => { const b = document.querySelector('.jbn-selbtn'); return b && !b.hidden && b.textContent === '💬 메모 달기'; }), '④ 글을 고르면 떠 있는 [💬 메모 달기]');
        await a.click('.jbn-selbtn'); await a.fill('#jbn-bub-ta', '수수료율도 판매처마다 달라요'); await a.press('#jbn-bub-ta', 'Enter'); /* (note4) 고른 글 → 그 자리 버블 → Enter */
        const t1 = Date.now(); let got = ''; for (let i = 0; i < 40 && !/수수료율도/.test(got); i++) { await p.waitForTimeout(150); got = await p.evaluate(() => (document.getElementById('jbn-feed') || {}).innerText || ''); }
        ok(/수수료율도 판매처마다 달라요/.test(got) && /새 공식은 판매가/.test(got) && /순이익 계산 고침/.test(got), `④ 아티팩트 메모(고른 글 + 메모) → 웹앱 통합 노트에 ${Date.now() - t1}ms 안 · 무엇에 대한 메모인지 함께`);
        // 웹앱 통합 노트에 바로 쓰기 → 아티팩트 대기 2개 → 순서 바꾸기
        await p.fill('#jbn-feed-ta', '오늘 안에 정리해 주세요'); await p.click('[data-act="feedmemo"]'); for (let i = 0; i < 40; i++) { await a.waitForTimeout(150); if ((await a.evaluate(() => document.querySelectorAll('#jbn-feed .jbn-memo .tx').length)) >= 2) break; } /* (note3) 아티팩트는 2.5초마다 물음 — 1.5초 고정 기다림은 때를 잘못 만나면 거짓 실패 */
        const q1 = await a.evaluate(() => [...document.querySelectorAll('#jbn-feed .jbn-memo .tx')].map((x) => x.textContent));
        ok(q1.length === 2 && /수수료율/.test(q1[0]), '④ 웹앱에서 통합 노트에 쓴 글이 아티팩트 대기에(2개)');
        await a.click('#jbn-feed [data-act="qdown"]'); await a.waitForTimeout(800);
        const q2 = await a.evaluate(() => [...document.querySelectorAll('#jbn-feed .jbn-memo .tx')].map((x) => x.textContent)); ok(/오늘 안에/.test(q2[0]), '④ 대기 순서 바꾸기(↓)');
        if (SHOT) { await a.evaluate(() => document.getElementById('jbn-feed').scrollIntoView()); await a.screenshot({ path: SHOT + '/art_feed.png' }); }
        await a.click('[data-act="send"]'); await a.waitForTimeout(1200);
        ok(sent.length === 1 && sent[0].session_id === 'session_01JBtYnPJWa6rqnariMPVUCw' && /\n> 새 공식은 판매가/.test(sent[0].message) && /\[1\] \(통합 노트에 바로 씀\)/.test(sent[0].message), '④ [📨 모두 보내기] → send_message 한 번 · 리드 세션 · 인용(> ) + 메모 꼴: ' + JSON.stringify((sent[0] || {}).message || '').slice(0, 120));
        const fb = await a.evaluate(() => document.getElementById('jbn-feed').innerText); ok(/보냄 .*2건 · 💬 리드 채팅으로 보냄/.test(fb) && !/수수료율도/.test(fb.split('보냄')[0]), '④ 보낸 묶음은 \'보냄\'으로 접힘 · 대기는 빔');
        // 🗑 → 휴지통 → 되살리기(웹앱)
        await a.click('.jbn-tabs [data-tab="review"]'); await a.click('[data-card="c_ship"] [data-act="trash"]'); await p.waitForTimeout(1500); await p.click('#jbn_root .jbn-tabs [data-tab="trashed"]'); await p.waitForTimeout(300);
        ok(await p.evaluate(() => !!document.querySelector('#jbn_root [data-card="c_ship"] [data-act="restore"]')), '④ 아티팩트 [🗑 휴지통] → 웹앱 휴지통에 (지우지 않음 · ↩ 되살리기)');
        await p.click('#jbn_root [data-card="c_ship"] [data-act="restore"]'); await a.waitForTimeout(1500); ok(await a.evaluate(() => !!document.querySelector('[data-card="c_ship"] [data-act="done"]')), '④ 웹앱 ↩ 되살리기 → 아티팩트 검토로');
        if (SHOT) { await p.screenshot({ path: SHOT + '/web_notes.png' }); await a.setViewportSize({ width: 400, height: 860 }); await a.waitForTimeout(300); await a.evaluate(() => scrollTo(0, 0)); await a.screenshot({ path: SHOT + '/art_phone.png' }); }
        // 연결 없음 → 이 화면에만
        const c2 = await b2.newPage(); await c2.route(/^https?:\/\//, (r) => r.fulfill({ status: 404, body: '' })); await c2.addInitScript(() => { window.__noConn = 1; window.claude = { use: async (n) => (n === 'db' ? { collection: () => ({ onSnapshot: (f) => { setTimeout(() => f({ docs: [{ id: 'x1', exists: true, data: () => ({ kind: 'card', cat: '노트', title: '이 화면 카드', src: 'lead', readAt: 'x' }) }] }), 10); return () => {}; }, doc: () => ({ set: async () => {} }) }) } : n === 'user' ? { id: async () => 'u' } : n === 'mcp' ? { listTools: async () => ({ servers: [] }), callTool: async () => { throw { code: 'server_not_connected' }; } } : null) }; });
        await c2.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' })); await c2.goto('https://art.test/'); await c2.waitForTimeout(1200); const c2t = await c2.evaluate(() => document.getElementById('root').innerText); ok(/이 화면에만 저장/.test(c2t) && /이 화면 카드/.test(c2t), '④ 커넥터가 없으면 🟡 이 화면에만 저장(아티팩트 db) · 카드는 보임');
        ok(!aErr.length, '④ 아티팩트 화면 오류 없음 ' + aErr.join(' | ').slice(0, 200)); }
      // 머리 줄 ☰ (휴대폰 폭 포함)
      await p.evaluate(() => history.back()); await p.waitForTimeout(400);
      await p.click('#hmenu'); await p.waitForTimeout(200); const mv = await p.evaluate(() => ['dlbtn', 'hpend', 'hmgr', 'hauto', 'hman'].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.height > 0; }));
      ok(mv.every(Boolean), '④ ☰ 누르면 받기·연결 확정·관리도구·자동·설명서가 보임');
      if (SHOT) await p.screenshot({ path: SHOT + '/web_menu.png', clip: { x: 700, y: 0, width: 700, height: 360 } });
      await p.click('#hmenu'); await p.setViewportSize({ width: 400, height: 800 }); await p.waitForTimeout(400); await p.click('#hmenu'); await p.waitForTimeout(200);
      const mv2 = await p.evaluate(() => ['hmgr', 'hauto', 'hman'].map((id) => document.getElementById(id).getBoundingClientRect().width > 0)); ok(mv2.every(Boolean), '④ 휴대폰 폭(400)에서도 ☰ 안 단추가 보임(예전 ⋯ 숨김 규칙에 안 가려짐)');
      if (SHOT) await p.screenshot({ path: SHOT + '/web_phone_menu.png' });
      clearInterval(relay); relayOn = false; N2.live.stop(); await b2.close();
    } catch (e) { ok(false, '④ 화면 시험 멈춤: ' + String(e && e.message || e).slice(0, 300)); } });
  }
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
