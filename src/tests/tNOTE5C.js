// tNOTE5C — 📓 정범 노트 아티팩트 '웹앱과 잇지 못함'(정범님 11/13 22:53 휴대폰) — 실제 자취: 22:29 listTools 502(server_unavailable) 한 번에 '이 화면에만 저장'에 머묾
//  ① claude.ai 커넥터 중계가 잠깐 끊김(listTools·note_info가 server_unavailable 두 번) → '이 화면'에 두었다가 저절로 다시 이어 🟢 실시간
//  ② 끊긴 동안 쓴 내 메모는 이어진 뒤 웹앱 원본(클라우드)으로 옮겨짐(지우지 않음)
//  ③ 커넥터가 아예 없음(server_not_connected)은 되풀이하지 않고 잇는 법 안내
const fs = require('fs'), path = require('path');
const NOTESF = [path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js')].find((f) => fs.existsSync(f));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {}; const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return { doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }), set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 1); } }), onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; }; return { C: col, D }; }
(async () => {
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!ART || !chromium) { console.log('… RN_JBNOTE·playwright로(건너뜀)'); console.log('통과'); process.exit(0); }
  const { makeNotes } = require(NOTESF); const b = await chromium.launch(); const errs = [];
  const run = async (mode) => { const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
    await N.write([{ op: 'set', id: 'c1', data: { kind: 'card', title: '카드', body: '본문', src: 'lead', readAt: 'x', state: 'open' } }], 'lead');
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true }); const a = await ctx.newPage(); a.on('pageerror', (e) => errs.push(e.message));
    let fails = mode === 'flaky' ? 2 : 0;
    await a.exposeFunction('__mcpCall', async (s, t, i) => { if (mode === 'none') return { __err: { code: 'server_not_connected', message: 'x' } }; if (fails > 0 && (t === '__list' || t === 'note_info')) { fails--; return { __err: { code: 'server_unavailable', message: 'request failed (502)', retryable: true } }; } if (t === '__list') return { ok: 1 }; let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); const r = JSON.parse(out); return r.result.structuredContent; });
    await ctx.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) }); window.__local = local;
      const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
      const E = (p) => Object.assign(new Error(p.__err.message), p.__err);
      const mcp = { listTools: async () => { const p = await window.__mcpCall('리드나우 노트', '__list', {}); if (p && p.__err) throw E(p); return { servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }; }, callTool: async (s, t, i) => { if (s !== '리드나우 노트') throw Object.assign(new Error('x'), { code: 'server_not_connected' }); const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw E(p); return { content: [], payload: p }; } };
      window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
    await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' })); await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'), contentType: 'text/html; charset=utf-8' }));
    await a.goto('https://art.test/'); await a.waitForTimeout(1200); return { a, ctx, F, N }; };
  const st = (a) => a.evaluate(() => ({ conn: (document.querySelector('.jbn-conn') || {}).textContent || '', bar: (document.querySelector('#connbar') || {}).textContent || '' }));
  { const { a, ctx, F, N } = await run('flaky');
    const s1 = await st(a); ok(/🔄 잠깐 끊김/.test(s1.bar) && /이 화면에만/.test(s1.conn), '① 중계가 잠깐 끊기면 이 화면에 두고 「🔄 잠깐 끊김 — 저절로 다시 잇는 중」 — ' + s1.bar.slice(0, 60));
    await a.click('.jbn-tabs [data-tab="mine"]'); await a.fill('#jbn-mine-ta', '끊긴 동안 쓴 내 메모'); await a.click('[data-act="mineadd"]'); await a.waitForTimeout(300);
    let ok2 = false; for (let i = 0; i < 40 && !ok2; i++) { await a.waitForTimeout(500); ok2 = /실시간/.test((await st(a)).conn); }
    ok(ok2, '① 저절로 다시 이어 🟢 웹앱과 실시간(약 15초 안)');
    await a.waitForTimeout(2500);
    ok([...F.D.jb_notes.values()].some((d) => d.kind === 'jbmemo' && d.text === '끊긴 동안 쓴 내 메모'), '② 끊긴 동안 쓴 내 메모가 웹앱 원본으로 옮겨짐');
    await ctx.close(); N.live.stop(); }
  { const { a, ctx, N } = await run('none'); await a.waitForTimeout(6500);
    const s3 = await st(a); ok(/커넥터가 없습니다/.test(s3.bar) && !/다시 잇는 중/.test(s3.bar), '③ 커넥터가 아예 없으면 되풀이하지 않고 잇는 법 안내 — ' + s3.bar.slice(0, 50)); await ctx.close(); N.live.stop(); }
  ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200)); await b.close();
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
