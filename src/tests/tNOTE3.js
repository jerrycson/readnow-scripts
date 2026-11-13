// tNOTE3 — 📓 정범 노트 3 (note3 · 정범님 11/13 14:03)
//  ① 화면 핵심: ⭐ 즐겨찾기(문서 칸 pinned) — 탭 '⭐ 즐겨찾기' · 검토 맨 위 ⭐ 묶음(아래 갈래에 다시 안 나옴) · 휴지통 카드는 빠짐 · ☆ 누르면 pinned 바뀜
//  ② 클라우드: 부른 쪽 by가 lastBy로(예전엔 늘 'artifact') · 진단 notes의 mcp 칸(도구마다 횟수·마지막 때·실패·열쇠 틀림 수)
//  ③ 아티팩트 껍데기(RN_JBNOTE 있으면 · Playwright): 이 화면 db의 옛 사본이 웹앱 쪽 새 값을 덮지 않음(+09:00 시각 꼴) · 이 화면에만 쓴 메모는 옮김 ·
//     허락 없음(approval_required) → 위 띠 [🔓 허락하고 잇기] → 누르면 이어짐 · 쓰기만 막히면 이 화면에 두었다가 허락 뒤 옮김 · 연결 자취 _diag · 맨 위 바로 가기 줄
//  ④ 웹앱(RN_PORT · harness): 📓 카드 ☆ → pinned true · ⭐ 즐겨찾기 탭에 보임
const fs = require('fs'), path = require('path');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const COREF = pick(path.join(__dirname, '..', 'notes-core.js'));
const NOTESF = pick(path.join(__dirname, '..', '..', 'cloud', 'notes.js'), path.join(__dirname, '..', 'cloud', 'notes.js'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fakeC() { const D = {}; const L = {};
  const col = (n) => { D[n] = D[n] || new Map(); L[n] = L[n] || new Set(); return {
    doc: (id) => ({ get: async () => ({ exists: D[n].has(id), data: () => (D[n].has(id) ? JSON.parse(JSON.stringify(D[n].get(id))) : undefined) }),
      set: async (o, opt) => { const had = D[n].has(id); const v = opt && opt.merge && had ? { ...D[n].get(id), ...o } : { ...o }; D[n].set(id, v); const ch = [{ type: had ? 'modified' : 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } }]; setTimeout(() => L[n].forEach((f) => f({ docChanges: () => ch })), 5); } }),
    onSnapshot: (f) => { const all = [...D[n].entries()].map(([id, v]) => ({ type: 'added', doc: { id, data: () => JSON.parse(JSON.stringify(v)) } })); setTimeout(() => f({ docChanges: () => all }), 5); L[n].add(f); return () => L[n].delete(f); } }; };
  return { C: col, D }; }

(async () => {
  // ── ① 화면 핵심 ──
  const core = fs.readFileSync(COREF, 'utf8'); const vm = require('vm'); const ctx = { window: {}, console }; vm.createContext(ctx); vm.runInContext(core, ctx); const J = ctx.window.JBN;
  ok(+J.version >= 2 && typeof J.isFav === 'function', '① 핵심 판 2 이상 · isFav');
  ok(J.isFav({ pinned: true }) && !J.isFav({ pinned: true, state: 'trashed' }) && !J.isFav({ pinned: false }) && J.isFav({ pinned: true, state: 'done' }), '① ⭐ = pinned · 휴지통은 빠짐 · 완료한 카드도 ⭐에 남음');

  // ── ② 클라우드 ──
  const { makeNotes } = require(NOTESF); const F = fakeC(); const KEY = 'k'.repeat(48);
  await F.C('app_secrets').doc('notes_mcp').set({ key: KEY });
  const N = makeNotes({ C: F.C, log: () => {}, ver: 'T' });
  const call = async (key, body) => { let out = ''; await N.handle({ method: 'POST' }, { writeHead() {}, end: (b) => { out = b || ''; } }, '/mcp/n/' + key, async () => body); return out ? JSON.parse(out) : null; };
  const tc = async (name, args) => (await call(KEY, { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } })).result.structuredContent;
  await tc('note_write', { ops: [{ op: 'set', id: 'c1', data: { kind: 'card', title: 'a', pinned: true } }], by: 'artifact-inbox' });
  await tc('note_write', { ops: [{ op: 'merge', id: 'c1', data: { pinned: false } }] });
  ok(F.D.jb_notes.get('c1').pinned === false, '② ⭐(pinned) 칸은 클라우드가 받아 씀(웹앱·아티팩트 같은 칸)');
  await tc('note_write', { ops: [{ op: 'merge', id: 'c1', data: { title: 'b' } }], by: 'lead' }); ok(F.D.jb_notes.get('c1').lastBy === 'lead', '② 부른 쪽 by가 lastBy로(리드·아티팩트를 가름)');
  await tc('note_sync', {}); await call('wrong', { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'note_sync', arguments: {} } });
  { const dg = await N.diag({}); const m = dg.mcp; ok(m && m.tools.note_write.n === 3 && m.tools.note_write.by === 'lead' && m.tools.note_sync.n === 1 && m.tools.note_sync.at && m.deny === 1, '② 진단 notes=1의 mcp 칸 — 도구마다 횟수·마지막 때·누가 · 열쇠 틀림 1'); }
  N.live.stop();

  // ── ③·④ 화면 ──
  const ART = process.env.RN_JBNOTE && fs.existsSync(process.env.RN_JBNOTE) ? fs.readFileSync(process.env.RN_JBNOTE, 'utf8') : null;
  let chromium = null; try { ({ chromium } = require('playwright')); } catch (e) {}
  if (!ART || !chromium) { console.log('… ③ 아티팩트 화면 시험은 RN_JBNOTE(+ playwright)로(건너뜀)'); }
  else {
    const F2 = fakeC(); await F2.C('app_secrets').doc('notes_mcp').set({ key: KEY }); const N2 = makeNotes({ C: F2.C, log: () => {}, ver: 'T' });
    // 웹앱 쪽(클라우드) 원본: c_old는 정범님이 웹앱에서 ✅ 완료(더 새것) · c_star는 ⭐
    await N2.write([{ op: 'set', id: 'c_old', data: { kind: 'card', cat: '우리숍', sub: '전용 서버', imp: 2, title: '우리숍 서버 — 손님이 늘 때', body: '본문', src: 'lead', readAt: 'x', state: 'done' } },
      { op: 'set', id: 'c_star', data: { kind: 'card', cat: '벤치마킹·엔진', sub: '엔진 점수', imp: 2, title: '엔진 점수와 맞춤률', body: '본문', src: 'lead', readAt: 'x', pinned: true } },
      { op: 'set', id: 'c_plain', data: { kind: 'card', cat: '웹앱', sub: '노트', imp: 3, title: '보통 카드', body: '본문', src: 'lead', readAt: 'x' } }], 'lead');
    const b = await chromium.launch(); const errs = [];
    const page = async (opt) => {
      const a = await b.newPage({ viewport: { width: 1100, height: 900 } }); a.on('pageerror', (e) => errs.push(e.message)); await a.route(/^https?:\/\//, (r) => r.fulfill({ status: 404, body: '' }));
      const st = { deny: new Set(opt.deny || []), calls: [], perm: [] };
      await a.exposeFunction('__mcpCall', async (server, tool, input) => { st.calls.push(tool); if (st.deny.has(tool)) { const e = { code: 'approval_required', message: 'needs approval' }; return { __err: e }; }
        let out = ''; await N2.handle({ method: 'POST' }, { writeHead() {}, end: (x) => { out = x; } }, '/mcp/n/' + KEY, async () => ({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: input } })); const r = JSON.parse(out); if (r.error) return { __err: { code: 'tool_error', message: r.error.message } }; return r.result.structuredContent; });
      await a.exposeFunction('__permReq', async (names) => { st.perm.push(names); st.deny.clear(); return names.map(() => 'granted'); });
      await a.addInitScript((seed) => { const local = new Map(seed); window.__local = local; const ls = new Set(); const snap = () => ({ docs: [...local.entries()].map(([id, v]) => ({ id, exists: true, data: () => v })) });
        const dbx = { collection: () => ({ onSnapshot: (f) => { ls.add(f); setTimeout(() => f(snap()), 10); return () => ls.delete(f); }, doc: (id) => ({ set: async (d, o) => { local.set(id, o && o.merge ? { ...(local.get(id) || {}), ...d } : d); ls.forEach((f) => f(snap())); } }) }) };
        const mcp = { listTools: async () => ({ servers: [{ server: '리드나우 노트', authStatus: 'unknown', tools: [{ name: 'note_sync' }, { name: 'note_write' }, { name: 'note_get' }, { name: 'note_info' }] }] }), callTool: async (s, t, i) => { const p = await window.__mcpCall(s, t, i); if (p && p.__err) throw Object.assign(new Error(p.__err.message), p.__err); return { content: [], payload: p }; } };
        const perms = { request: async (n) => window.__permReq(n), state: async () => 'prompt' };
        window.claude = { use: async (n) => (n === 'db' ? dbx : n === 'user' ? { id: async () => 'u_test' } : n === 'mcp' ? mcp : n === 'permissions' ? perms : null) }; }, opt.seed || []);
      await a.route('https://art.test/', (r) => r.fulfill({ body: ART.replace('<title>', '<!doctype html><meta charset="utf-8"><title>'), contentType: 'text/html; charset=utf-8' })); await a.goto('https://art.test/'); await a.waitForTimeout(opt.wait || 1800);
      return { a, st }; };
    // ③-1 옛 사본(시각 '+09:00' 글자 · 웹앱 쪽보다 옛것)과 이 화면에만 쓴 메모
    const seed = [['c_old', { kind: 'card', cat: '우리숍', sub: '전용 서버', imp: 2, title: '우리숍 서버 — 손님이 늘 때', body: '본문', src: 'lead', readAt: 'x', state: 'open', updatedAt: '2099-01-01T12:40:00+09:00'.replace('2099-01-01', new Date(Date.now() - 3600e3).toISOString().slice(0, 10)), fwd: false }],
      ['m_local', { kind: 'memo', cardId: null, text: '이 화면에만 쓴 메모', by: 'jb', at: new Date().toISOString(), state: 'open', updatedAt: new Date(Date.now() + 60e3).toISOString(), fwd: false }]];
    { const t0 = Date.now() - 2 * 3600e3; seed[0][1].updatedAt = new Date(t0 + 9 * 3600e3).toISOString().replace('Z', '+09:00').replace(/\.\d+\+/, '+'); } /* 웹앱 쪽보다 2시간 옛것(글자로는 더 커 보이는 꼴) */
    { const { a } = await page({ seed });
      ok(F2.D.jb_notes.get('c_old').state === 'done', '③ 이 화면 db의 옛 사본(+09:00 시각)이 웹앱의 ✅ 완료를 덮지 않음');
      ok(F2.D.jb_notes.get('m_local') && F2.D.jb_notes.get('m_local').text === '이 화면에만 쓴 메모' && F2.D.jb_notes.get('m_local').lastBy === 'artifact-inbox', '③ 이 화면에만 쓴 메모는 웹앱 쪽으로 옮김(by artifact-inbox)');
      const L = await a.evaluate(() => [...window.__local.entries()].reduce((o, [k, v]) => ((o[k] = v), o), {}));
      ok(L.c_old.fwd === true && L.m_local.fwd === true, '③ 옮겼거나 옛것인 사본은 fwd 표시(다시 안 옮김)');
      ok(L._diag && L._diag.mode === 'cloud' && L._diag.tools.note_sync && L._diag.tools.note_sync.okAt && L._diag.info && L._diag.info.n >= 3 && /^note[34]$/.test(L._diag.shell), '③ 연결 자취 _diag — 모드 cloud · note_sync 성공 때 · note_info 문서 수');
      const top = await a.evaluate(() => ({ jump: [...document.querySelectorAll('.rnjump a')].map((x) => x.textContent + '|' + x.href), cur: (document.querySelector('.rnjump .cur') || {}).textContent, bar: document.getElementById('connbar').hidden, conn: document.querySelector('.jbn-conn').textContent }));
      ok(top.cur === '📓 정범 노트' && top.jump.some((x) => /작업판\|https:\/\/claude\.ai\/artifact\/QSpoAQ2dd2PpGNtwHV9QfN/.test(x)) && top.jump.some((x) => /웹앱\|https:\/\/readnow\.kr\/app/.test(x)) && top.bar && /실시간/.test(top.conn), '③ 맨 위 바로 가기 줄(📓 지금 · 📋 작업판 · 🌐 웹앱) · 이어지면 위 띠 숨김 · 🟢');
      // ⭐: 검토 맨 위 묶음 · 아래 갈래에 다시 안 나옴 · ☆ 누르면 웹앱 쪽 pinned
      const v = await a.evaluate(() => ({ fav: [...document.querySelectorAll('.jbn-cat.fav [data-card]')].map((x) => x.dataset.card), all: [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card), tab: (document.querySelector('.jbn-tabs [data-tab="fav"]') || {}).textContent }));
      ok(v.fav.join() === 'c_star' && v.all.filter((x) => x === 'c_star').length === 1 && /⭐ 즐겨찾기\s*1/.test(v.tab), '③ 검토 맨 위 ⭐ 즐겨찾기 묶음 · 같은 카드가 아래에 또 나오지 않음 · 탭 수 1');
      await a.click('[data-card="c_plain"] [data-act="fav"]'); await a.waitForTimeout(500);
      ok(F2.D.jb_notes.get('c_plain').pinned === true, '③ 아티팩트 ☆ → 웹앱 원본 pinned true');
      await a.click('.jbn-tabs [data-tab="fav"]'); await a.waitForTimeout(200);
      const f2 = await a.evaluate(() => [...document.querySelectorAll('[data-card]')].map((x) => x.dataset.card).sort().join());
      ok(f2 === 'c_plain,c_star', '③ ⭐ 즐겨찾기 탭 = 별 단 카드만');
      await a.click('[data-card="c_plain"] [data-act="fav"]'); await a.waitForTimeout(500); ok(F2.D.jb_notes.get('c_plain').pinned === false, '③ ★ 한 번 더 → 빼기');
      if (process.env.RN_SHOT) { await a.click('.jbn-tabs [data-tab="review"]'); await a.waitForTimeout(200); await a.screenshot({ path: process.env.RN_SHOT + '/n3_art_fav.png' }); }
      await a.close(); }
    // ③-2 허락 없음 → 위 띠 → [🔓 허락하고 잇기]
    { const { a, st } = await page({ deny: ['note_info', 'note_sync', 'note_write'] });
      const s0 = await a.evaluate(() => ({ bar: document.getElementById('connbar').innerText, hid: document.getElementById('connbar').hidden, conn: document.querySelector('.jbn-conn').textContent }));
      ok(!s0.hid && /허락/.test(s0.bar) && /허락하고 잇기/.test(s0.bar) && /허락이 필요/.test(s0.conn), '③ 허락 없음(approval_required) → 위 띠에 까닭과 [🔓 허락하고 잇기] · 🟡 허락이 필요');
      if (process.env.RN_SHOT) await a.screenshot({ path: process.env.RN_SHOT + '/n3_art_ask.png' });
      await a.click('#askbtn'); await a.waitForTimeout(2600); /* _diag는 1.5초 모아 씀 */
      const s1 = await a.evaluate(() => ({ hid: document.getElementById('connbar').hidden, conn: document.querySelector('.jbn-conn').textContent, d: window.__local.get('_diag') }));
      ok(st.perm.length === 1 && st.perm[0][0] === 'mcp:리드나우 노트' && s1.hid && /실시간/.test(s1.conn) && s1.d.mode === 'cloud' && s1.d.modes.some((m) => m.mode === 'local' && /허락/.test(m.why)), '③ [🔓 허락하고 잇기] → permissions.request(mcp:리드나우 노트) → 🟢 · _diag에 지난 까닭 남음');
      // 쓰기만 막힘 → 이 화면에 두었다가 허락 뒤 옮김
      st.deny.add('note_write'); await a.click('[data-card="c_plain"] [data-act="archive"]'); await a.waitForTimeout(700);
      const s2 = await a.evaluate(() => ({ conn: document.querySelector('.jbn-conn').textContent, bar: document.getElementById('connbar').innerText, loc: window.__local.get('c_plain') }));
      ok(/쓰기 허락 필요/.test(s2.conn) && /허락하고 잇기/.test(s2.bar) && s2.loc && s2.loc.state === 'archived' && s2.loc.fwd === false && F2.D.jb_notes.get('c_plain').state !== 'archived', '③ 쓰기만 막히면 이 화면 db에 둠(잃지 않음) · 🟠 쓰기 허락 필요 · 웹앱 쪽은 아직 그대로');
      await a.click('#askbtn'); await a.waitForTimeout(1500);
      ok(F2.D.jb_notes.get('c_plain').state === 'archived' && F2.D.jb_notes.get('c_plain').lastBy === 'artifact-inbox', '③ 허락 뒤 이 화면에 둔 쓰기를 웹앱 쪽으로 옮김');
      await a.close(); }
    // ④ 웹앱 ☆
    const HP = pick(process.env.RN_HARNESS, path.join(__dirname, 'harness.js'), '/home/user/w/pw/harness.js');
    if (HP && process.env.RN_PORT) { const harness = require(HP);
      await harness(async (p) => { try {
        await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; });
        await p.evaluate(() => Promise.all([db.collection('jb_notes').doc('w1').set({ kind: 'card', cat: '웹앱', sub: '노트', imp: 2, title: '웹앱 카드', body: '본문', src: 'lead', readAt: 'x', state: 'open' }), db.collection('jb_notes').doc('w2').set({ kind: 'card', cat: '우리숍', sub: '서버', imp: 2, title: '예전 노트', body: '본문', src: 'lead', readAt: 'x', state: 'open', pinned: true })]));
        await p.click('#hnote'); await p.waitForTimeout(900);
        const w0 = await p.evaluate(() => ({ fav: [...document.querySelectorAll('#jbn_root .jbn-cat.fav [data-card]')].map((x) => x.dataset.card).join(), tab: document.querySelector('#jbn_root .jbn-tabs [data-tab="fav"]').textContent }));
        ok(w0.fav === 'w2' && /⭐ 즐겨찾기\s*1/.test(w0.tab), '④ 웹앱 📓 — ⭐(pinned) 카드는 검토 맨 위 ⭐ 묶음 · 탭 수 1');
        await p.click('#jbn_root [data-card="w1"] [data-act="fav"]'); await p.waitForTimeout(500);
        const pin = await p.evaluate(async () => (await db.collection('jb_notes').doc('w1').get()).data().pinned);
        ok(pin === true, '④ 웹앱 ☆ → Firestore jb_notes pinned true(아티팩트와 같은 칸)');
        if (process.env.RN_SHOT) await p.screenshot({ path: process.env.RN_SHOT + '/n3_web_fav.png' });
      } catch (e) { ok(false, '④ 웹앱 시험 멈춤: ' + String(e && e.message || e).slice(0, 200)); } });
    } else console.log('… ④ 웹앱 시험은 RN_PORT(+ harness.js)로(건너뜀)');
    ok(!errs.length, '③ 아티팩트 화면 오류 없음 ' + errs.join(' | ').slice(0, 200));
    N2.live.stop(); await b.close();
  }
  console.log(bad ? `❌ ${bad}개 실패` : '통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
