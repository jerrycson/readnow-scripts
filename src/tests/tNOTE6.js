// tNOTE6 — 📓 정범 노트 휴대폰(정범님 11/14 12:33 · I-1114-1233-05)
//  ① 찾기 칸에서 한글 조합(compositionstart → input 여러 번 → compositionend) 동안 칸 요소가 바뀌지 않고 value가 그대로 · 끝난 뒤 목록이 걸러짐
//  ② 카드 메모·통합 입력칸·내 메모 칸도 조합 중 뒤에서 다시 그리기(클라우드 바뀜)가 와도 칸·글자 그대로
//  ③ 390폭에서 긴 문장·긴 주소·코드·표·긴 ref 카드가 페이지를 가로로 넘치지 않음 · 접힌 카드 제목은 말줄임
const fs = require('fs'), path = require('path');
const NOTESF = [path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js')].find((f) => fs.existsSync(f));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {}; const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return { doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }), set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 1); } }), onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; }; return { C: col, D }; }
const LONG = '이것은아주긴문장입니다띄어쓰기가없이계속이어지는한국어글자들이화면오른쪽밖으로뻗어나가는지보려는시험용문장입니다'.repeat(3);
const URL = 'https://example.com/' + 'abcdefghij'.repeat(15);
const BODY = `${LONG}\n\n${URL}\n\n\`${'a_b_c_d'.repeat(20)}\`\n\n\`\`\`\n${'x'.repeat(200)}\n\`\`\`\n\n| 칸 | 긴 칸 |\n|---|---|\n| 1 | ${LONG} |\n\n- ${LONG}\n\n> ${URL}\n\n**${LONG}**`;
(async () => {
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null; let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!ART || !chromium) { console.log('… RN_JBNOTE·playwright로(건너뜀)'); console.log('통과'); process.exit(0); }
  const { makeNotes } = require(NOTESF); const b = await chromium.launch();
  const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  await N.write([{ op: 'set', id: 'c1', data: { kind: 'card', title: '제목이아주길어서한줄에다들어가지않는카드제목입니다'.repeat(3), body: BODY, src: 'lead', readAt: 'x', state: 'open', ref: 'ref_' + 'z'.repeat(80) } }, { op: 'set', id: 'c2', data: { kind: 'card', title: '짧은 카드', body: LONG, src: 'lead', readAt: 'x', state: 'open' } }], 'lead');
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }); const a = await ctx.newPage(); const errs = []; a.on('pageerror', (e) => errs.push(e.message));
  await a.exposeFunction('__mcpCall', async (s, t, i) => { if (t === '__list') return { ok: 1 }; let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); return JSON.parse(out).result.structuredContent; });
  await ctx.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
    const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
    const E = (p) => Object.assign(new Error(p.__err.message), p.__err);
    const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw E(p); return { content: [], payload: p }; } };
    window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
  await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' })); await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'), contentType: 'text/html; charset=utf-8' }));
  await a.goto('https://art.test/'); await a.waitForTimeout(2000);
  const sw = () => a.evaluate(() => { const se = document.scrollingElement; const wide = [...document.querySelectorAll('.jbn *')].filter((e) => !e.closest('.jbn-tabs,.jbn-tbl,pre') && e.getBoundingClientRect().right > innerWidth + 1).slice(0, 14).map((e) => e.tagName + '.' + e.className + ' r=' + Math.round(e.getBoundingClientRect().right) + ' ' + e.outerHTML.slice(0, 90)); return { sw: se.scrollWidth, cw: se.clientWidth, iw: innerWidth, wide }; });
  const W0 = await sw(); ok(W0.sw <= W0.cw && W0.iw === 390 && !W0.wide.length, '③ 접힌 카드 — 페이지 가로 넘침 0 (폭 ' + W0.sw + '/' + W0.cw + ') ' + W0.wide.join(' | ').slice(0, 200));
  const el = await a.evaluate(() => { const t = document.querySelector('[data-card="c1"] .jbn-tt'); const cs = getComputedStyle(t); return { ell: cs.textOverflow, ws: cs.whiteSpace, cut: t.scrollWidth > t.clientWidth }; });
  ok(el.ell === 'ellipsis' && el.ws === 'nowrap' && el.cut, '③ 접힌 카드 긴 제목은 한 줄 말줄임(…) ' + JSON.stringify(el));
  if (process.env.RN_SHOT) await a.screenshot({ path: process.env.RN_SHOT + '_closed.png' });
  await a.click('[data-card="c1"] .jbn-tt'); await a.waitForTimeout(800);
  const W1 = await sw(); ok(W1.sw <= W1.cw && W1.iw === 390 && !W1.wide.length, '③ 펼친 카드(긴 문장·주소·코드·표·인용) — 페이지 가로 넘침 0 (폭 ' + W1.sw + '/' + W1.cw + ') ' + W1.wide.join(' | ').slice(0, 200));
  const pw = await a.evaluate(() => { const p = document.querySelector('[data-card="c1"] pre'); return p ? p.scrollWidth <= p.clientWidth + 1 : false; }); ok(pw, '③ 코드 묶음도 칸 안에서 줄바꿈(가로 굴림 없음)');
  if (process.env.RN_SHOT) await a.screenshot({ path: process.env.RN_SHOT + '_open.png', fullPage: true });
  const comp = async (sel, bg) => { await a.focus(sel); await a.evaluate((s) => { document.querySelector(s).__tag = 'orig'; }, sel);
    const p = a.evaluate(async (s) => { const el = document.querySelector(s); const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const fire = (t, d) => el.dispatchEvent(new CompositionEvent(t, { bubbles: true, data: d }));
      const typ = async (v) => { el.value = v; el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', data: v.slice(-1), isComposing: true })); };
      const base = el.value; fire('compositionstart', ''); await typ(base + 'ㅊ'); await wait(300); await typ(base + '채'); await wait(1200); await typ(base + '책'); await wait(1200);
      const mid = document.querySelector(s); const midOk = mid === el && mid.value === base + '책' && document.activeElement === el; fire('compositionend', '책'); await wait(600);
      const now = document.querySelector(s); return { midOk, same: now === el && now.__tag === 'orig', val: now.value, focus: document.activeElement === now }; }, sel);
    if (bg) { await a.waitForTimeout(200); await bg(); } return p; };
  const q = await comp('#jbn-q'); ok(q.midOk && q.same && q.val === '책' && q.focus, '① 찾기 칸 조합 — 칸 요소 그대로 · 값 「책」 그대로 · 손(포커스) 그대로 ' + JSON.stringify(q));
  await a.waitForTimeout(400); const nC = await a.evaluate(() => document.querySelectorAll('.jbn-card').length); ok(nC === 0, '① 조합이 끝난 뒤 목록이 「책」으로 걸러짐(맞는 카드 0)');
  await a.evaluate(() => { const q = document.querySelector('#jbn-q'); q.value = ''; q.dispatchEvent(new InputEvent('input', { bubbles: true })); q.blur(); }); await a.waitForTimeout(500);
  let k = 0; const bump = () => N.write([{ op: 'set', id: 'c9_' + (k++), data: { kind: 'card', title: '뒤에서 온 카드 ' + k, body: '새 글', src: 'lead', state: 'open' } }], 'lead');
  if (!(await a.$('[data-card="c1"] [data-ta]'))) { await a.click('[data-card="c1"] .jbn-tt'); await a.waitForTimeout(500); }
  const m1 = await comp('[data-card="c1"] [data-ta]', bump); ok(m1.midOk && m1.same && m1.val === '책', '② 카드 메모 칸 — 조합 중 뒤에서 다시 그리기가 와도 칸·글자 그대로 ' + JSON.stringify(m1));
  await a.evaluate(() => document.activeElement && document.activeElement.blur()); await a.waitForTimeout(3000);
  const f1 = await comp('#jbn-feed-ta', bump); ok(f1.midOk && f1.same && f1.val === '책', '② 통합 입력칸 — 조합 중 칸·글자 그대로 ' + JSON.stringify(f1));
  await a.evaluate(() => document.activeElement && document.activeElement.blur()); await a.waitForTimeout(1500);
  await a.click('.jbn-tabs [data-tab="mine"]'); await a.waitForTimeout(400);
  const n1 = await comp('#jbn-mine-ta', bump); ok(n1.midOk && n1.same && n1.val === '책', '② 내 메모 칸 — 조합 중 칸·글자 그대로 ' + JSON.stringify(n1));
  await a.evaluate(() => document.activeElement && document.activeElement.blur()); await a.waitForTimeout(3000);
  const seen = await a.evaluate(() => /뒤에서 온 카드/.test(document.body.textContent) || document.querySelector('.jbn-tabs [data-tab="new"] .n').textContent); ok(!!seen, '② 조합이 끝난 뒤 미뤘던 다시 그리기가 이뤄짐(새 카드 수 보임)');
  // ── ④ 웹앱 📓(같은 핵심) — 휴대폰 폭 390 ──
  const HP = [process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js'].find((f) => f && fs.existsSync(f));
  if (HP && process.env.RN_PORT) { await require(HP)(async (p) => { try {
      await p.evaluate((B) => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; return db.collection('jb_notes').doc('w1').set({ kind: 'card', title: '웹앱긴제목'.repeat(12), body: B, src: 'lead', readAt: 'x', state: 'open', ref: 'ref_' + 'z'.repeat(80) }); }, BODY);
      await p.click('#hnote'); await p.waitForTimeout(1200);
      await p.click('#jbn_root [data-card="w1"] .jbn-tt'); await p.waitForTimeout(600);
      const ww = await p.evaluate(() => { const r = document.querySelector('#jbn_root'); const c = r.querySelector('[data-card="w1"]'); return { r: r.scrollWidth <= r.clientWidth + 1, card: c ? c.getBoundingClientRect().right <= innerWidth + 1 : false, doc: document.documentElement.scrollWidth }; });
      ok(ww.r && ww.card, '④ 웹앱 📓 펼친 긴 카드가 노트 칸·화면 폭 안 ' + JSON.stringify(ww));
      await p.focus('#jbn_root #jbn-q');
      const wq = await p.evaluate(async () => { const el = document.querySelector('#jbn_root #jbn-q'); const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const fire = (t, d) => el.dispatchEvent(new CompositionEvent(t, { bubbles: true, data: d }));
        const typ = (v) => { el.value = v; el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', isComposing: true })); };
        fire('compositionstart', ''); typ('ㅊ'); await wait(300); typ('채'); await wait(400); typ('책'); await wait(400); fire('compositionend', '책'); await wait(600);
        const now = document.querySelector('#jbn_root #jbn-q'); return { same: now === el, val: now.value, focus: document.activeElement === now }; });
      ok(wq.same && wq.val === '책' && wq.focus, '④ 웹앱 📓 찾기 칸 조합 — 칸 그대로 · 값 「책」 ' + JSON.stringify(wq));
    } catch (e) { ok(false, '④ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } }, { vp: { width: 390, height: 800 }, touch: true });
  } else console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
  ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
  await b.close(); N.live && N.live.stop && N.live.stop(); console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
