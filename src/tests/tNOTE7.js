// tNOTE7 — 📓 정범 노트: 카드 [💬 메모 달기]가 문장 메모(고른 글 버블에 적은 것)도 통합 노트에 쌓음 (정범님 11/14 14:24 · I-1114-1424-09)
//  ① 카드 메모 칸이 비어도 문장 메모가 있으면 [💬 메모 달기] → 통합 노트에 쌓임 · 버블 닫힘
//  ② 버블에 적은 채 다른 문장을 고르면 앞 문장 메모를 잃지 않고 초안으로 둠 → [💬 메모 달기]로 차례대로 둘 다 쌓임
//  ③ 문장 메모 + 카드 메모 둘 다 → 둘 다 쌓임(차례: 문장 메모들 → 카드 메모)
//  ④ 둘 다 없음 → 아무것도 안 쌓임(짧은 안내 한 줄 · 팝업 없음)
//  ⑤ 두 번 눌러도 한 번만(초안은 쌓은 뒤 비움) · 클라우드에 저장된 뒤에도 같은 수
const fs = require('fs'), path = require('path');
const NOTESF = [path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js')].find((f) => fs.existsSync(f));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
function fakeC() { const D = {}; const L = {}; const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return { doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }), set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, JSON.parse(JSON.stringify(v))); for (const f of L[n]) f({ docChanges: () => [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(D[n].get(id))) } }] }); } }), onSnapshot: (f) => { L[n].add(f); setTimeout(() => f({ docChanges: () => [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })) }), 5); return () => L[n].delete(f); }, get: async () => ({ docs: [...D[n].entries()].map(([id, v]) => ({ id, exists: true, data: () => JSON.parse(JSON.stringify(v)) })) }) }; }; return { C: col, D }; }
const S1 = '첫째 문장은 순이익 셈에 관한 것입니다', S2 = '둘째 문장은 출고 시각에 관한 것입니다', S3 = '셋째 문장은 매입가 나눔에 관한 것입니다', S4 = '넷째 문장은 끌올 주기에 관한 것입니다';
(async () => {
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null; let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!ART || !chromium) { console.log('… RN_JBNOTE·playwright로(건너뜀)'); console.log('통과'); process.exit(0); }
  const { makeNotes } = require(NOTESF); const b = await chromium.launch();
  const F = fakeC(); const KEY = 'k'.repeat(48); await F.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  await N.write([{ op: 'set', id: 'c1', data: { kind: 'card', title: '문장 메모 시험 카드', body: `${S1}.\n\n${S2}.\n\n${S3}.\n\n${S4}.`, src: 'lead', readAt: 'x', state: 'open' } }], 'lead');
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 }); const a = await ctx.newPage(); const errs = []; a.on('pageerror', (e) => errs.push(e.message));
  const dlg = []; a.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await a.exposeFunction('__mcpCall', async (s, t, i) => { if (t === '__list') return { ok: 1 }; let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: t, arguments: i } })); return JSON.parse(out).result.structuredContent; });
  await ctx.addInitScript(() => { const local = new Map(); const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
    const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
    const E = (p) => Object.assign(new Error(p.__err.message), p.__err);
    const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw E(p); return { content: [], payload: p }; } };
    window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : null) }; });
  await a.route(/^https?:\/\/(?!art\.test)/, (r) => r.fulfill({ status: 404, body: '' })); await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'), contentType: 'text/html; charset=utf-8' }));
  await a.goto('https://art.test/'); await a.waitForTimeout(2000);
  await a.click('[data-card="c1"] .jbn-tt'); await a.waitForTimeout(600);
  // 본문 글 고르기 → 떠 있는 [💬 메모 달기] → 버블에 메모 적기(Enter·💬 쌓기는 누르지 않음)
  const pick = async (s, memo) => { await a.evaluate((s) => { const el = document.querySelector('[data-body="c1"]'); const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const k = n.nodeValue.indexOf(s); if (k < 0) continue; const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + s.length); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return; } }, s);
    await a.waitForTimeout(400); const vis = await a.evaluate(() => { const b = document.querySelector('.jbn-selbtn'); return !!b && !b.hidden; }); if (!vis) return false;
    await a.evaluate(() => { const b = document.querySelector('.jbn-selbtn'); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); b.click(); }); await a.waitForTimeout(150);
    await a.evaluate((m) => { const t = document.querySelector('#jbn-bub-ta'); t.value = m; t.dispatchEvent(new InputEvent('input', { bubbles: true })); }, memo); return true; };
  // 카드 [💬 메모 달기] 누르기 — 사람처럼 mousedown(버블 밖) → click
  const press = () => a.evaluate(() => { const b = document.querySelector('[data-card="c1"] [data-act="memo"]'); b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); b.click(); });
  const feed = () => a.evaluate(() => [...document.querySelectorAll('#jbn-feed .jbn-memo')].map((m) => ({ q: ((m.querySelector('.qt') || {}).textContent || '').replace(/[“”]/g, ''), t: (m.querySelector('.tx') || {}).textContent || '' })));
  const bubHidden = () => a.evaluate(() => document.querySelector('.jbn-bub').hidden);
  const toastT = () => a.evaluate(() => { const t = document.querySelector('.jbn-toast'); return t && !t.hidden ? t.textContent : ''; });

  // ④ 둘 다 없음
  await press(); await a.waitForTimeout(300); let F0 = await feed(); const t0 = await toastT();
  ok(F0.length === 0 && !!t0, '④ 카드 메모·문장 메모 둘 다 없음 → 아무것도 안 쌓임 · 짧은 안내 「' + t0 + '」');
  // ① 문장 메모만
  ok(await pick(S1, '메모 하나'), '① 본문 글을 고르면 [💬 메모 달기] 떠 있는 단추가 보임 → 버블 열림');
  await press(); await a.waitForTimeout(400); let F1 = await feed();
  ok(F1.length === 1 && F1[0].q.includes(S1) && F1[0].t === '메모 하나', '① 카드 메모 칸이 비어도 문장 메모가 통합 노트에 쌓임 ' + JSON.stringify(F1));
  ok(await bubHidden(), '① 쌓은 뒤 버블이 닫히고 버블 글이 비워짐');
  // ⑤ 두 번 눌러도 한 번만
  await press(); await a.waitForTimeout(300); const F1b = await feed(); ok(F1b.length === 1, '⑤ 한 번 더 눌러도 다시 쌓이지 않음(초안 비움) — ' + F1b.length + '건');
  // ② 두 문장 메모(버블에 적은 채 다른 문장 고르기) → 둘 다 차례로
  await pick(S2, '메모 둘'); await pick(S3, '메모 셋');
  const dn = await a.evaluate(() => document.querySelectorAll('[data-card="c1"] [data-sdraft]').length);
  ok(dn >= 1, '② 다른 문장을 고르면 앞 문장 메모는 카드 안 「아직 안 쌓은 문장 메모」로 남음(' + dn + '개)');
  await press(); await press(); await a.waitForTimeout(400); const F2 = await feed();
  ok(F2.length === 3 && F2[1].q.includes(S2) && F2[1].t === '메모 둘' && F2[2].q.includes(S3) && F2[2].t === '메모 셋', '② 문장 메모 두 개가 고른 차례대로 쌓임 · 빠르게 두 번 눌러도 한 번만 ' + JSON.stringify(F2.slice(1)));
  // ③ 문장 메모 + 카드 메모 둘 다
  await pick(S4, '메모 넷');
  await a.evaluate(() => { const t = document.querySelector('[data-card="c1"] [data-ta]'); t.value = '카드 전체 메모'; t.dispatchEvent(new InputEvent('input', { bubbles: true })); });
  await press(); await a.waitForTimeout(400); const F3 = await feed();
  ok(F3.length === 5 && F3[3].q.includes(S4) && F3[3].t === '메모 넷' && !F3[4].q && F3[4].t === '카드 전체 메모', '③ 둘 다 → 둘 다 쌓임(차례: 문장 메모 → 카드 메모) ' + JSON.stringify(F3.slice(3)));
  const ta = await a.evaluate(() => (document.querySelector('[data-card="c1"] [data-ta]') || {}).value); ok(ta === '', '③ 쌓은 뒤 카드 메모 칸 비움');
  // 클라우드에 저장된 뒤에도 같은 수 · 문장 메모 칠하기
  await a.waitForTimeout(3500); const F4 = await feed();
  const all = [...(F.D.jb_notes || new Map()).values()].filter((d) => d.kind === 'memo' && d.state !== 'trashed');
  ok(F4.length === 5 && all.length === 5, '⑤ 클라우드 저장 뒤 통합 노트 5건 · 저장소 메모 5건(두 번 쌓임 없음) — 화면 ' + F4.length + ' · 저장소 ' + all.length);
  const hl = await a.evaluate(() => document.querySelectorAll('[data-body="c1"] mark.jbn-hl').length); ok(hl === 4, '문장 메모가 달린 문장 4개가 본문에서 노랗게 칠해짐(' + hl + ')');
  // 빼기는 기존 그대로(휴지통 · 지우지 않음)
  await a.evaluate(() => { const b = document.querySelector('#jbn-feed [data-act="memotrash"]'); b.click(); }); await a.waitForTimeout(400); ok((await feed()).length === 4, '통합 노트 [빼기]는 기존 그대로');
  ok(!dlg.length, '브라우저 팝업 없음'); ok(!errs.length, '화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
  await b.close(); N.live && N.live.stop && N.live.stop(); console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
