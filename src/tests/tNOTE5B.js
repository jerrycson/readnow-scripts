// tNOTE5B — 📓 정범 노트 5 둘째 (note5 · 정범님 11/13 20:47 휴대폰에서 찾으신 것) — 휴대폰 폭 390 · 터치(tap)로 실제 누르기
//  ① 통합 메모 [목록 보기 ↓] — 예전: 부드러운 굴림이 2.5초마다 다시 그리기에 끊겨 0→2px만 움직였음 → 쌓인 목록이 화면 맨 위로
//  ② 통합 입력칸 — 누르면 설정 높이(기본 화면 55%)로 크게 · 칸 밖을 누르면 줄어듦 · 쓰던 글은 서버 칸에 그대로
//  ③ 💾 저장1·2·3 단추 작게(한 줄 · 높이 32px 아래)
//  ④ 📝 내 메모 [✏ 고치기] — 예전: 새 메모 칸에 손(포커스)이 남은 채 누르면 다시 그리기가 미뤄져 아무 일 없음 · 고치던 글이 뒤에서 다시 그리면 원래 글로 되돌아감
//  ⑤ 📝 내 메모 카드 접기·펴기(기본 접힘) · ⭐ 즐겨찾기 · 🗄 보관(지우지 않음) · 보기 칩(전체·⭐·🗄 보관함·🗑 휴지통)
//  ⑥ ⚙ 노트 설정(약속 79) — 펼침 높이 · 단추 크기 · 내 메모 처음 모양이 _meta에 저장되고 바로 적용
//  ⑦ 웹앱(RN_PORT · harness · 터치 390): 같은 핵심이라 ①④⑤가 웹앱 📓에서도 됨
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 1); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: col, D }; }
const seedOps = () => { const ops = []; for (let i = 0; i < 12; i++) ops.push({ op: 'set', id: 'c' + i, data: { kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '카드 ' + i, body: '본문 ' + i + '\n\n' + '긴 글 '.repeat(60), src: 'lead', readAt: 'x', state: 'open' } });
  for (let i = 0; i < 4; i++) ops.push({ op: 'set', id: 'm' + i, data: { kind: 'memo', text: '쌓인 메모 ' + i, by: 'jb', at: `2026-11-13T0${i}:00:00Z`, state: 'open', slot: 1 } });
  ops.push({ op: 'set', id: 'j1', data: { kind: 'jbmemo', text: '내 메모 제목\n둘째 줄 본문', by: 'jb', at: '2026-11-13T01:00:00Z', state: 'open' } });
  ops.push({ op: 'set', id: 'j2', data: { kind: 'jbmemo', text: '다른 메모', by: 'jb', at: '2026-11-13T02:00:00Z', state: 'open' } }); return ops; };

(async () => {
  const { makeNotes } = require(NOTESF);
  { const F = fakeC(); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' }); await N.write([{ op: 'merge', id: '_meta', data: { uiDockH: 70, uiSlotSz: 'm', uiMineOpen: true } }, { op: 'merge', id: '_meta', data: { uiDockH: 3, uiSlotSz: 'x' } }], 't'); const m = F.D.jb_notes.get('_meta');
    ok(m.uiDockH === 70 && m.uiSlotSz === 'm' && m.uiMineOpen === true, '⑥ 클라우드가 노트 설정(_meta uiDockH·uiSlotSz·uiMineOpen)을 받음 · 틀린 값은 버림'); N.live.stop(); }
  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!chromium) { console.log('… 화면 시험은 playwright로(건너뜀)'); console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0); }
  const b = await chromium.launch(); const errs = [];
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  if (!ART) console.log('… 아티팩트 화면 시험은 RN_JBNOTE로(건너뜀)');
  else {
    const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' }); await N.write(seedOps(), 'lead');
    const G = (id) => F.D.jb_notes.get(id) || {};
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const a = await ctx.newPage(); a.on('pageerror', (e) => errs.push(e.message)); await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' }));
    await a.exposeFunction('__mcpCall', async (s, t, i) => { let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
    await ctx.addInitScript(() => { const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { if (s !== '리드나우 노트') throw Object.assign(new Error('x'), { code: 'server_not_connected' }); const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } }; window.claude = { use: async (n) => (n === 'mcp' ? mcp : null) }; });
    await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'), contentType: 'text/html; charset=utf-8' }));
    await a.goto('https://art.test/'); await a.waitForTimeout(2500);
    // ① 목록 보기
    await a.tap('[data-act="tofeed"]'); await a.waitForTimeout(3200); /* 다시 그리기 한 바퀴(2.5초)보다 길게 */
    const f1 = await a.evaluate(() => Math.round(document.querySelector('#jbn-feed').getBoundingClientRect().top));
    ok(f1 >= -2 && f1 <= 60, '① [목록 보기 ↓] → 쌓인 목록이 화면 맨 위(top ' + f1 + 'px)');
    // ③ 단추 작게
    const sh = await a.evaluate(() => [...document.querySelectorAll('.jbn-slot')].map((x) => Math.round(x.getBoundingClientRect().height)));
    ok(sh.length === 3 && sh.every((h) => h <= 32), '③ 저장1·2·3 단추 작게(한 줄) — 높이 ' + sh.join('·') + 'px');
    // ② 입력칸 펼침·줄어듦
    await a.tap('#jbn-feed-ta'); await a.waitForTimeout(250);
    const big = await a.evaluate(() => ({ big: document.querySelector('#jbn-dock').classList.contains('big'), h: Math.round(document.querySelector('#jbn-feed-ta').getBoundingClientRect().height) }));
    ok(big.big && big.h >= 0.5 * 780, '② 입력칸을 누르면 크게(화면 55% · ' + big.h + 'px)');
    await a.keyboard.type('펼친 칸에 쓰는 글'); await a.waitForTimeout(900);
    await a.tap('.jbn-top h2'); await a.waitForTimeout(400);
    const sm = await a.evaluate(() => ({ big: document.querySelector('#jbn-dock').classList.contains('big'), h: Math.round(document.querySelector('#jbn-feed-ta').getBoundingClientRect().height), v: document.querySelector('#jbn-feed-ta').value }));
    ok(!sm.big && sm.h < 200 && sm.v === '펼친 칸에 쓰는 글', '② 칸 밖을 누르면 줄어듦(' + sm.h + 'px) · 쓰던 글 그대로');
    ok(G('slot_1').draft === '펼친 칸에 쓰는 글', '② 쓰던 글은 서버 저장1 칸에 저장됨');
    // ④⑤ 내 메모
    await a.tap('.jbn-tabs [data-tab="mine"]'); await a.waitForTimeout(400);
    ok((await a.$$('.jbn-mi[data-open="0"]')).length === 2 && !(await a.$('.jbn-mi .tx')), '⑤ 내 메모 카드는 처음에 접혀 있음(제목 줄만)');
    await a.tap('[data-mine="j1"] [data-act="mtoggle"]'); await a.waitForTimeout(300);
    ok(await a.evaluate(() => /둘째 줄 본문/.test((document.querySelector('[data-mine="j1"] .tx') || {}).textContent || '')), '⑤ 제목 줄을 누르면 펼침');
    // ④ 새 메모 칸에 손(포커스)이 남은 채 [✏ 고치기] — 휴대폰 사파리처럼 단추가 포커스를 가져가지 않는 경우를 흉내
    await a.tap('#jbn-mine-ta'); await a.waitForTimeout(200);
    await a.evaluate(() => { document.querySelector('#jbn-mine-ta').focus(); document.querySelector('[data-mine="j1"] [data-act="medit"]').click(); }); await a.waitForTimeout(300);
    ok(!!(await a.$('#jbn-med')), '④ 새 메모 칸에 손이 남아 있어도 [✏ 고치기]가 바로 열림');
    await a.fill('#jbn-med', '내 메모 제목 고침\n둘째 줄 본문'); await a.evaluate(() => document.querySelector('#jbn-med').blur());
    await N.write([{ op: 'merge', id: 'c0', data: { title: '카드 0 바뀜' } }], 'lead'); await a.waitForTimeout(3500); /* 뒤에서 다른 문서가 바뀌어 다시 그려짐 */
    ok((await a.inputValue('#jbn-med')) === '내 메모 제목 고침\n둘째 줄 본문', '④ 고치던 글은 뒤에서 다시 그려져도 그대로(예전엔 원래 글로 되돌아감)');
    await a.tap('[data-mine="j1"] [data-act="msave"]'); await a.waitForTimeout(900);
    ok(G('j1').text === '내 메모 제목 고침\n둘째 줄 본문' && !!G('j1').editedAt, '④ [저장] → 서버 글 바뀜');
    // ⑤ ⭐ · 보관 · 칩
    await a.tap('[data-mine="j1"] [data-act="mfav"]'); await a.waitForTimeout(700);
    ok(G('j1').pinned === true, '⑤ ☆ 누르면 ⭐ 즐겨찾기(pinned)');
    await a.tap('[data-mview="fav"]'); await a.waitForTimeout(300);
    ok((await a.evaluate(() => [...document.querySelectorAll('.jbn-mi')].map((x) => x.dataset.mine).join())) === 'j1', '⑤ ⭐ 즐겨찾기 보기 = 즐겨찾기한 것만');
    await a.tap('[data-mview="all"]'); await a.waitForTimeout(300);
    if (!(await a.$('[data-mine="j1"] [data-act="march"]'))) { await a.tap('[data-mine="j1"] [data-act="mtoggle"]'); await a.waitForTimeout(300); }
    await a.tap('[data-mine="j1"] [data-act="march"]'); await a.waitForTimeout(800);
    ok(G('j1').state === 'archived' && !(await a.$('[data-mine="j1"]')), '⑤ [🗄 보관] → state archived(지우지 않음) · 전체에서 빠짐');
    await a.tap('[data-mview="arch"]'); await a.waitForTimeout(300);
    ok(!!(await a.$('[data-mine="j1"]')), '⑤ 🗄 보관함 보기에 있음');
    if (!(await a.$('[data-mine="j1"] [data-act="mrestore"]'))) { await a.tap('[data-mine="j1"] [data-act="mtoggle"]'); await a.waitForTimeout(300); }
    await a.tap('[data-mine="j1"] [data-act="mrestore"]'); await a.waitForTimeout(800);
    ok(G('j1').state === 'open', '⑤ [↩ 보관에서 꺼내기] → 전체로');
    await a.tap('[data-mview="all"]'); await a.waitForTimeout(300);
    // ⑥ 설정
    await a.tap('[data-act="cfg"]'); await a.waitForTimeout(300);
    await a.tap('[data-cfg="uiMineOpen"][data-v="1"]'); await a.waitForTimeout(900);
    ok(G('_meta').uiMineOpen === true && (await a.$$('.jbn-mi[data-open="1"]')).length === 2, '⑥ 설정 「내 메모 처음 모양 = 펼침」 → 저장 · 바로 모두 펼침');
    await a.tap('[data-cfg="uiDockH"][data-v="70"]'); await a.waitForTimeout(700);
    await a.tap('[data-cfg="uiSlotSz"][data-v="m"]'); await a.waitForTimeout(900);
    ok(G('_meta').uiDockH === 70 && G('_meta').uiSlotSz === 'm', '⑥ 설정 「펼침 높이 70%」·「단추 보통」 저장');
    await a.tap('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(400);
    const sh2 = await a.evaluate(() => Math.round(document.querySelector('.jbn-slot').getBoundingClientRect().height));
    await a.tap('#jbn-feed-ta'); await a.waitForTimeout(250);
    const h2 = await a.evaluate(() => Math.round(document.querySelector('#jbn-feed-ta').getBoundingClientRect().height));
    ok(sh2 > 34 && h2 >= 0.66 * 780, `⑥ 바로 적용 — 단추 보통 ${sh2}px · 펼침 ${h2}px(70%)`);
    await a.tap('.jbn-top h2'); await a.waitForTimeout(300);
    const wide = await a.evaluate(() => document.documentElement.scrollWidth); ok(wide <= 390, '휴대폰 폭(390) 가로 넘침 없음 — ' + wide);
    if (process.env.RN_SHOT) { await a.tap('.jbn-tabs [data-tab="mine"]'); await a.waitForTimeout(300); await a.screenshot({ path: process.env.RN_SHOT + '/n5b_mine.png' }); }
    await ctx.close(); N.live.stop();
  }
  // ── ⑦ 웹앱 ──
  const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js');
  if (HP && process.env.RN_PORT) { const harness = require(HP);
    await harness(async (p) => { try {
      await p.evaluate(async (ops) => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; for (const o of ops) await db.collection('jb_notes').doc(o.id).set(o.data); }, seedOps());
      await p.evaluate(() => openNotes()); await p.waitForTimeout(1200);
      await p.tap('#jbn_root [data-act="tofeed"]'); await p.waitForTimeout(800);
      const fr = await p.evaluate(() => { const sh = document.querySelector('#sheet'); const f = document.querySelector('#jbn-feed'); const hd = sh.querySelector('.sh'); const hb = hd ? hd.getBoundingClientRect().bottom : sh.getBoundingClientRect().top; return Math.round(f.getBoundingClientRect().top - hb); });
      ok(fr >= -2 && fr <= 70, '⑦ 웹앱 📓 [목록 보기 ↓] → 쌓인 목록이 머리 아래 맨 위(' + fr + 'px)');
      const sh = await p.evaluate(() => [...document.querySelectorAll('#jbn_root .jbn-slot')].map((x) => Math.round(x.getBoundingClientRect().height)));
      ok(sh.length === 3 && sh.every((h) => h <= 32), '⑦ 웹앱 저장 단추 작게 — ' + sh.join('·'));
      await p.tap('#jbn_root #jbn-feed-ta'); await p.waitForTimeout(250);
      ok(await p.evaluate(() => document.querySelector('#jbn-dock').classList.contains('big')), '⑦ 웹앱 입력칸 누르면 크게');
      await p.tap('#jbn_root .jbn-tabs [data-tab="mine"]'); await p.waitForTimeout(400);
      await p.tap('#jbn_root [data-mine="j1"] [data-act="mtoggle"]'); await p.waitForTimeout(300);
      await p.tap('#jbn_root [data-mine="j1"] [data-act="medit"]'); await p.waitForTimeout(300);
      await p.fill('#jbn-med', '웹앱에서 고침'); await p.tap('#jbn_root [data-act="msave"]'); await p.waitForTimeout(600);
      const t = await p.evaluate(async () => (await db.collection('jb_notes').doc('j1').get()).data().text);
      ok(t === '웹앱에서 고침', '⑦ 웹앱 📝 내 메모 [✏ 고치기] → 저장');
      await p.tap('#jbn_root [data-mine="j1"] [data-act="mfav"]'); await p.waitForTimeout(400);
      if (!(await p.$('#jbn_root [data-mine="j1"] [data-act="march"]'))) { await p.tap('#jbn_root [data-mine="j1"] [data-act="mtoggle"]'); await p.waitForTimeout(300); }
      await p.tap('#jbn_root [data-mine="j1"] [data-act="march"]'); await p.waitForTimeout(500);
      const d = await p.evaluate(async () => (await db.collection('jb_notes').doc('j1').get()).data());
      ok(d.pinned === true && d.state === 'archived', '⑦ 웹앱 내 메모 ⭐ · 🗄 보관');
      if (process.env.RN_SHOT) await p.screenshot({ path: process.env.RN_SHOT + '/n5b_web.png' });
    } catch (e) { ok(false, '⑦ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } }, { vp: { width: 390, height: 780 }, touch: true });
  } else console.log('… ⑦ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
  ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
  await b.close();
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
