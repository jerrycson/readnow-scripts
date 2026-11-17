// tFBREV1117 — ⬆ 앞 페이지 올리기 지킴(fbrev1 · 정범님 11/17 15:28 「지운 뒤 다시 등록해도 기존 정보가 확실히 유지 · 최초 등록일처럼 다시는 복구되지 않는 값은 절대 사라지지 않게 · 실행한 날짜를 철저히 기록」)
//   꾸민 자료·가짜 Firestore·가짜 수집기만 — 실제 알라딘 지우기·등록은 하지 않음
// 실행: cd pw && RN_PORT=<포트> node tFBREV1117.js (harness.js·fbstub.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 1200)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.waitForTimeout(300);
  /* 도우미 — 화면 안에 한 번 깔아 둠 */
  await p.evaluate(() => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const F = (c) => (window.__FS[c] = window.__FS[c] || {}); const D = (n) => new Date(Date.now() - n * 864e5).toISOString();
    const COLS = ['prd_bump', 'prd_bump_snap', 'prd_bump_hist', 'prd_relinks', 'shp_cmds', 'reg_items', 'prd_listings', 'prd_used_info', 'pur_matches']; let plW = 0;
    /* 평생 장부 쓰기 실패 흉내 — window.__failHist가 켜져 있으면 장부를 읽는 거래가 던짐 */
    if (!window.__rt0) { window.__rt0 = db.runTransaction; db.runTransaction = (fn) => window.__rt0((tx) => fn({ ...tx, get: (r) => { if (window.__failHist && String(r.path || '').startsWith('prd_bump_hist/')) throw new Error('흉내: 장부 못 읽음'); return tx.get(r); } })); }
    const idle = async () => { await W(80); for (let i = 0; i < 200 && S._fbBusy; i++) await W(30); };
    const reset = async () => { await W(380); await idle(); plW += (window.__FSW || []).filter((w) => w.n === 'prd_listings').length; COLS.forEach((c) => { window.__FS[c] = {}; });
      window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.front_bump_cfg = { ab: false, noPhoto: true, dayCap: 500, auto: false, maxQty: 99, ...(window.__fbCfgX || {}) };
      S.user = S.user || { email: 'test@x' }; S.leader = true; S.fbTestRun = true; S.devOk = true; S.plist.clear(); S.fbH.clear(); S._fbLateAt = 0; S._fbPosC = null; pl(true); S.regCmds = new Map(); S.regItems = new Map(); S.orders.delete('fbrev_o1'); S._saleIdx = null; S._cashIdx = null; window.__failHist = false;
      fbWatch(); fbCfg(); await db.collection('zz_fbrev').doc('kick').set({ at: Date.now() }); await W(80); S.fb.jobs.clear(); fbLinks().clear(); S._fbOv = null; window.__FSW = []; };
    const mk = (n, o) => ({ id: 'aladin_U' + n, usedCode: 'U' + n, listingId: String(900000 + n), title: '시험 책 ' + n, isbn13: String(9788900000000 + n), price: 8000, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_' + n, registeredAt: '2026-05-02T10:00:00', firstSeenAt: '2026-05-02T10:20:00', bookId: 'bk' + n, publisher: '출판사', ...(o || {}) });
    const put = (l, note, srv) => { S.plist.set(l.id, l); F('prd_listings')[l.id] = { ...l, ...(srv || {}) }; F('prd_used_info')[l.listingId] = { note: note || '' }; return l; };
    /* '상품 목록을 아직 못 받음' 흉내 — 가짜 Firestore가 쓰기 때마다 듣기를 다시 돌려 표시가 켜지므로 잠가 둠 */
    const pl = (on) => { delete S.prodLoaded; if (on) S.prodLoaded = true; else Object.defineProperty(S, 'prodLoaded', { get: () => false, set: () => {}, configurable: true, enumerable: true }); };
    /* 상품 값 바꿈(화면 목록·서버 흉내 둘 다) · v가 null이면 뺌 */
    const mod = (n, v) => { const k = 'aladin_U' + n; if (v === null) { S.plist.delete(k); delete F('prd_listings')[k]; return; } if (S.plist.get(k)) Object.assign(S.plist.get(k), v); if (F('prd_listings')[k]) Object.assign(F('prd_listings')[k], v); };
    const seed = async (c, id, v) => { await db.collection(c).doc(id).set(v); };
    const q = async (ls, meta) => { const r = await fbQueue(ls.map((l) => ({ l, x: fbX(l), score: 0.1, pred: 0.1 })), { ab: false, ...(meta || {}) }); await W(80); return r; };
    const tick = async () => { await idle(); await fbTick(); await W(160); };
    const cmds = (type) => Object.entries(F('shp_cmds')).filter(([, v]) => v.type === type).map(([id, v]) => ({ id, ...v }));
    const jobs = () => Object.entries(F('prd_bump')).map(([id, v]) => ({ id, ...v })); const job = (key) => jobs().filter((j) => j.key === key).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0] || null;
    /* 가짜 수집기 — 대기 중인 지우기 명령에 결과를 적음(st: 글자 또는 (줄) => 글자) */
    const delDone = async (st, msg, bf) => { for (const c of cmds('regDel').filter((x) => x.status === 'queued')) { const res = {}; c.items.forEach((x) => { res[x.listingKey] = { state: typeof st === 'function' ? st(x) : st || 'deleted', ...(msg ? { msg } : {}), ...(bf ? { before: bf } : {}) }; }); await db.collection('shp_cmds').doc(c.id).set({ status: 'done', results: res }, { merge: true }); } await W(60); };
    /* 가짜 수집기 — 대기 중인 대량 등록 명령에 결과를 적음(fn(줄, 차례) → 결과) */
    const regDone = async (fn, status) => { for (const c of cmds('regBulk').filter((x) => x.status === 'queued')) { const res = {}; c.rows.forEach((r, i) => { const v = fn(r, i); if (v) res[r.regItem] = v; }); await db.collection('shp_cmds').doc(c.id).set({ status: status || 'done', results: res }, { merge: true }); } await W(60); };
    /* 알라딘에 새로 보이는 상품(수집기가 새 번호로 받아 온 것) — 등록일·처음 본 날은 지금 */
    const live = (row, n, o) => { const now = new Date().toISOString(); const l = mk(n, { isbn13: String(row.isbn), price: row.price, qty: row.qty, sku: row.code || '', title: row.title, registeredAt: now, firstSeenAt: now, ...(o || {}) }); put(l, row.desc || ''); return { state: 'live', usedCode: l.usedCode, listingId: l.listingId }; };
    /* 맡김 → 지움 → 다시 등록 명령까지 */
    const toReg = async (ls) => { const r = await q(ls); await tick(); await delDone('deleted'); await tick(); return r; };
    window.TB = { W, F, D, reset, mk, put, pl, mod, seed, q, tick, cmds, jobs, job, delDone, regDone, live, toReg, idle, plW: () => plW + (window.__FSW || []).filter((w) => w.n === 'prd_listings').length }; });

  /* A. 60일이 지난 뒤의 두 번째 끌올 — 처음 등록일은 평생 장부·고리에서 · 알라딘의 새 날짜를 처음 값으로 삼지 않음 · 실행 날짜는 덧붙음(덮지 않음) */
  const A = await p.evaluate(async () => { const T = window.TB; await T.reset(); const F0 = '2025-03-02T10:00:00', S0 = '2025-03-02T10:20:00', d70 = T.D(70);
    await T.seed('prd_relinks', 'U200', { from: 'U100', to: 'U200', kind: 'bump', first: F0, firstSeen: S0, regG: false, root: 'aladin_U100', n: 1, job: 'oldjob', doneAt: d70, foundAt: d70, fromKey: 'aladin_U100', toKey: 'aladin_U200' });
    await T.seed('prd_bump_hist', 'aladin_U100', { root: 'aladin_U100', keys: ['aladin_U100', 'aladin_U200'], title: '시험 책 200', n: 1, reg0: F0, seen0: S0, regG0: false, reg0Src: 'doc', reg0At: d70, reg0Job: 'oldjob', reg0Key: 'aladin_U100', ev: [{ job: 'oldjob', k: 'b', n: 1, st: 'done', at: d70, doneAt: d70, from: 'aladin_U100', to: 'aladin_U200' }] });
    await T.seed('prd_bump', 'oldjob', { key: 'aladin_U100', newKey: 'aladin_U200', state: 'done', open: false, at: d70, doneAt: d70, n: 1, origRegAt: F0, origFirstSeenAt: S0, origSrc: 'doc', hid: 'aladin_U100' });
    await T.seed('pur_matches', 'aladin_U200', { purId: 'pur_1', cost: 3000 });
    const l = T.put(T.mk(200, { qty: 2, registeredAt: '2026-09-08T11:00:00', firstSeenAt: '2026-09-08T11:30:00' }), '모서리 살짝 눌림'); await T.W(120);
    const old60 = S.fb.jobs.has('oldjob'); S._fbOv = null; fbOverlay(l); const ov0 = { reg: l.registeredAt, seen: l.firstSeenAt, al: l._alRegAt, n: l.bump && l.bump.n };
    const r = await T.q([l]); const j0 = T.job('aladin_U200'); const sn = j0 && T.F('prd_bump_snap')[j0.id]; await T.tick(); const del = T.cmds('regDel')[0]; await T.delDone('deleted'); await T.tick(); const reg = T.cmds('regBulk')[0];
    await T.regDone((row) => T.live(row, 300)); await T.tick(); await T.tick(); const j1 = T.job('aladin_U200'); const H = T.F('prd_bump_hist').aladin_U100; const nl = S.plist.get('aladin_U300'); S._fbOv = null; fbOverlay(nl);
    return { F0, S0, d70, old60, ov0, r, j0, sn: sn && { orig: sn.orig, fromServer: sn.fromServer, reg: sn.doc && sn.doc.registeredAt, note: sn.note, key: sn.key }, del: del && { it: del.items[0], n: del.items.length }, row: reg && reg.rows[0], j1, lk: T.F('prd_relinks').U300, H, hids: Object.keys(T.F('prd_bump_hist')), pm: T.F('pur_matches').aladin_U300, pm0: T.F('pur_matches').aladin_U200,
      ov1: { reg: nl.registeredAt, seen: nl.firstSeenAt, al: nl._alRegAt, n: nl.bump && nl.bump.n }, chain: fbChainKeys('aladin_U300'), oldDoc: !!T.F('prd_listings').aladin_U200, plW: T.plW() }; });
  ok(A.old60 === false && A.ov0.reg === A.F0 && A.ov0.seen === A.S0 && A.ov0.al === '2026-09-08T11:00:00' && A.ov0.n === 1, 'A 60일 넘은 끌올 — 일 장부(60일 창)엔 없어도 고리로 처음 등록일을 보임 · 알라딘 값은 따로 둠', [A.old60, A.ov0]);
  ok(A.r && A.r.n === 1 && A.j0 && A.j0.origRegAt === A.F0 && A.j0.origFirstSeenAt === A.S0 && A.j0.origSrc === 'hist' && A.j0.n === 2 && A.j0.hid === 'aladin_U100' && A.j0.alRegAt === '2026-09-08T11:00:00' && A.j0.alSeenAt === '2026-09-08T11:30:00' && A.j0.qty === 2, 'A 두 번째 맡김 — 🔒 처음 등록일은 평생 장부 값 그대로(알라딘의 새 날짜 아님) · 2회차 · 같은 장부', [A.r, A.j0]);
  ok(A.sn && A.sn.fromServer === true && A.sn.orig && A.sn.orig.reg0 === A.F0 && A.sn.reg === '2026-09-08T11:00:00' && A.sn.note === '모서리 살짝 눌림' && A.sn.key === 'aladin_U200', 'A 지우기 전 원본 보관 — 서버 원본 전체 + 처음 값', A.sn);
  ok(A.del && A.del.n === 1 && A.del.it.usedCode === 'U200' && A.del.it.registeredAt === '2026-09-08T11:00:00' && A.del.it.qty === 2 && A.del.it.price === 8000 && A.del.it.sku === 'PNK_200' && A.del.it.bump === A.j0.id, 'A 지우기 명령 — 알라딘에 보이는 등록일·수량·판매가·관리 코드로 대조하게 넘김', A.del);
  ok(A.row && A.row.isbn === '9788900000200' && A.row.code === 'PNK_200' && A.row.price === 8000 && A.row.qty === 2 && A.row.desc === '모서리 살짝 눌림' && A.row.grade === 2, 'A 다시 등록 줄 — ISBN·관리 코드·판매가·수량·설명·등급 그대로', A.row);
  ok(A.j1 && A.j1.state === 'done' && A.j1.newKey === 'aladin_U300' && A.j1.histOk === true && A.j1.pmOk === true && A.j1.verify && A.j1.verify.ok === true, 'A 끝남 — 새 상품으로 이어 붙임 · 평생 기록·매입 연결 맞춤 · 옮긴 뒤 다시 읽어 대조 맞음', A.j1);
  ok(A.lk && A.lk.kind === 'bump' && A.lk.first === A.F0 && A.lk.firstSeen === A.S0 && A.lk.root === 'aladin_U100' && A.lk.n === 2 && A.lk.from === 'U200' && A.lk.job === A.j0.id, 'A 이어 붙임 고리(끝없이 간직) — 🔒 처음 등록일·처음 본 날·뿌리·회차', A.lk);
  { const H = A.H || {}; const e0 = (H.ev || [])[0] || {}, e1 = (H.ev || []).find((v) => v.job === (A.j0 || {}).id) || {};
    ok(H.reg0 === A.F0 && H.seen0 === A.S0 && H.reg0At === A.d70 && H.reg0Src === 'doc' && H.n === 2 && (H.ev || []).length === 2 && e0.job === 'oldjob' && e0.at === A.d70 && e0.doneAt === A.d70 && e0.to === 'aladin_U200' && e1.st === 'done' && e1.to === 'aladin_U300' && e1.n === 2 && !!e1.at && !!e1.doneAt && H.first === A.d70 && H.last === e1.doneAt && (H.keys || []).includes('aladin_U300') && A.hids.length === 1, 'A 평생 장부 — 처음 값 안 바뀜 · 옛 회차 줄(날짜) 그대로 · 새 회차 줄이 덧붙음 · 장부는 하나', [H, A.hids]); }
  ok(A.pm && A.pm.purId === 'pur_1' && A.pm.cost === 3000 && A.pm.bumpFrom === 'aladin_U200' && A.pm0 && A.pm0.purId === 'pur_1', 'A 매입 연결 — 새 열쇠로 복사 · 옛 것은 그대로', [A.pm, A.pm0]);
  ok(A.ov1.reg === A.F0 && A.ov1.seen === A.S0 && A.ov1.n === 2 && !!A.ov1.al && A.ov1.al !== A.F0 && JSON.stringify(A.chain) === JSON.stringify(['aladin_U300', 'aladin_U200', 'aladin_U100']), 'A 새 상품 줄 — 등록일은 처음 등록일 · ⬆ 2번 · 옛 열쇠 사슬(메모 등 같이 읽기)', [A.ov1, A.chain]);
  ok(A.oldDoc === true && A.plW === 0, 'A 웹앱은 상품 기록(prd_listings)에 쓰지 않음 · 옛 상품 문서도 지우지 않음', [A.oldDoc, A.plW]);

  /* A2~A4. 처음 값의 출처 — 고리만 · 옛 꼴 앞 일만 · 못 찾으면 올리지 않음 */
  const A2 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const F2 = '2024-11-05T09:00:00', S2 = '2024-11-05T09:40:00', F4 = '2025-01-07T08:00:00', S4 = '2025-01-07T08:30:00';
    await T.seed('prd_relinks', 'U210', { from: 'U110', to: 'U210', kind: 'bump', first: F2, firstSeen: S2, regG: true, root: 'aladin_U110', n: 3, job: 'oj2', doneAt: T.D(80) });
    await T.seed('prd_bump_hist', 'aladin_U120', { root: 'aladin_U120', keys: ['aladin_U120', 'aladin_U220'], n: 1, ev: [{ job: 'oj3', k: 'b', n: 1, st: 'done', at: T.D(100), doneAt: T.D(100), from: 'aladin_U120', to: 'aladin_U220' }] });
    await T.seed('prd_bump', 'oldj', { key: 'aladin_U130', newKey: 'aladin_U230', state: 'done', open: false, at: T.D(80), doneAt: T.D(80), n: 1, origRegAt: F4, origFirstSeenAt: S4 });
    const a = T.put(T.mk(210, { registeredAt: '2026-08-20T10:00:00', firstSeenAt: '2026-08-20T10:10:00' })), b = T.put(T.mk(220, { registeredAt: '2026-08-01T10:00:00', firstSeenAt: '2026-08-01T10:10:00' })), c = T.put(T.mk(230, { registeredAt: '2026-08-25T10:00:00', firstSeenAt: '2026-08-25T10:10:00' })); await T.W(120); S.prodLoaded = false;
    const r = await T.q([a, b, c]); const H = T.F('prd_bump_hist'); return { F2, S2, F4, S4, r, ja: T.job('aladin_U210'), jb: T.job('aladin_U220'), jc: T.job('aladin_U230'), ha: H.aladin_U110, hb: H.aladin_U120, hc: H.aladin_U130, hids: Object.keys(H).sort() }; });
  ok(A2.ja && A2.ja.origRegAt === A2.F2 && A2.ja.origFirstSeenAt === A2.S2 && A2.ja.origSrc === 'relink' && A2.ja.origRegG === true && A2.ja.hid === 'aladin_U110' && A2.ja.n === 4 && A2.ha && A2.ha.reg0 === A2.F2 && A2.ha.reg0Src === 'relink' && A2.ha.keys.includes('aladin_U210'), 'A2 장부 없이 고리만 — 고리의 처음 등록일·뿌리·회차(3 → 4)를 이어 감', [A2.ja, A2.ha]);
  ok(!A2.jb && A2.r.skip.some((s) => /시험 책 220/.test(s) && /처음 등록일 기록을 못 찾음/.test(s)) && A2.hb && A2.hb.ev.length === 1 && !A2.hb.reg0, 'A3 앞서 올린 상품인데 처음 등록일 기록이 없음 — 올리지 않음(새 날짜를 처음 값으로 못 박지 않음)', [A2.r, A2.hb]);
  ok(A2.jc && A2.jc.origRegAt === A2.F4 && A2.jc.origFirstSeenAt === A2.S4 && A2.jc.origSrc === 'job:oldj' && A2.jc.hid === 'aladin_U130' && A2.jc.n === 2 && A2.hc && A2.hc.reg0 === A2.F4 && A2.r.n === 2, 'A4 옛 꼴 앞 끌올 일만 — 그 일의 처음 등록일을 이어 감 · 2회차 · 앞 일의 장부에 적음', [A2.jc, A2.hc, A2.r]);

  /* B. 평생 장부를 못 적으면 올리지 않음 · 끝난 뒤 못 적은 것은 다음 틱에 다시 맞춤 */
  const B = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(240)); window.__failHist = true; const r0 = await T.q([l]); const n0 = T.jobs().length; window.__failHist = false;
    const r1 = await T.q([l]); const h1 = JSON.parse(JSON.stringify(T.F('prd_bump_hist').aladin_U240 || null)); await T.tick(); await T.delDone('deleted'); await T.tick(); window.__failHist = true; await T.regDone((row) => T.live(row, 340)); await T.tick();
    const j2 = T.job('aladin_U240'); const h2 = JSON.parse(JSON.stringify(T.F('prd_bump_hist').aladin_U240)); window.__failHist = false; await T.tick(); const j3 = T.job('aladin_U240'); return { r0, n0, r1, h1, j2, h2, j3, h3: T.F('prd_bump_hist').aladin_U240 }; });
  ok(B.r0.n === 0 && B.n0 === 0 && B.r0.skip.some((s) => /평생 기록\(prd_bump_hist\)을 못 적음/.test(s)), 'B 평생 장부를 못 적으면 맡기지 않음(날짜 기록이 빠진 끌올은 없음)', B.r0);
  ok(B.r1.n === 1 && B.h1 && B.h1.reg0 === '2026-05-02T10:00:00' && B.h1.seen0 === '2026-05-02T10:20:00' && B.h1.reg0Src === 'doc' && B.h1.ev.length === 1 && ['queued', 'del_wait'].includes(B.h1.ev[0].st) /* 맡긴 직후 저절로 도는 틱이 먼저 지나가면 del_wait */ && !!B.h1.ev[0].at, 'B 처음 올리는 상품 — 맡길 때 🔒 처음 등록일을 평생 장부에 못 박고 회차 줄(날짜)을 먼저 적음', B.h1);
  ok(B.j2 && B.j2.state === 'done' && B.j2.histOk === false && B.h2.ev[0].st !== 'done', 'B 끝날 때 장부 쓰기 실패 — 일은 끝내되 「평생 기록 못 맞춤」 표시', [B.j2 && { s: B.j2.state, h: B.j2.histOk }, B.h2.ev]);
  ok(B.j3 && B.j3.histOk === true && B.h3.ev[0].st === 'done' && B.h3.ev[0].to === 'aladin_U340' && !!B.h3.ev[0].doneAt && B.h3.n === 1 && B.h3.keys.includes('aladin_U340') && B.h3.reg0 === '2026-05-02T10:00:00', 'B 다음 틱에 다시 맞춤 — 회차 줄 끝남·끝난 날짜·새 열쇠', [B.j3 && B.j3.histOk, B.h3]);

  /* C. 지우려 보니 이미 없음 — 다시 등록하지 않음 → 사람이 ♻로 맡길 때만 */
  const C = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(250)); await T.q([l]); await T.tick(); await T.delDone('gone'); await T.tick(); const j1 = T.job('aladin_U250'); const n1 = T.cmds('regBulk').length;
    await db.collection('prd_bump').doc(j1.id).set(fbRetryPatch(S.fb.jobs.get(j1.id)), { merge: true }); await T.tick(); const j2 = T.job('aladin_U250'); return { j1, n1, j2, n2: T.cmds('regBulk').length, row: (T.cmds('regBulk')[0] || { rows: [] }).rows[0] }; });
  ok(C.j1.state === 'need_human' && C.j1.gone === true && C.j1.open === false && C.n1 === 0 && /이미 없음/.test(C.j1.why), 'C 알라딘에 이미 없음(팔렸거나 누가 지움) — 저절로 다시 등록하지 않고 사람 확인', C.j1);
  ok(C.j2.state === 'reg_wait' && C.j2.goneOk === true && C.n2 === 1 && C.row && C.row.code === 'PNK_250', 'C 사람이 ♻로 맡기면 그때만 다시 등록', [C.j2, C.n2]);

  /* D. 맡긴 뒤 바뀐 상품은 지우지 않음 */
  const Dd = await p.evaluate(async () => { const T = window.TB; await T.reset(); const L = [T.put(T.mk(261)), T.put(T.mk(262, { qty: 3 })), T.put(T.mk(263)), T.put(T.mk(264)), T.put(T.mk(265)), T.put(T.mk(266)), T.put(T.mk(267))]; T.pl(false); const r = await T.q(L); await T.W(400); await T.tick();
    const w0 = T.jobs().map((j) => [j.state, j.wait]); const n0 = T.cmds('regDel').length;
    T.mod(261, { price: 7500 }); T.mod(262, { qty: 2 }); T.mod(263, { status: '판매중지' }); T.mod(264, null); T.mod(267, { sku: 'PNK_999' });
    S.orders.set('fbrev_o1', { id: 'fbrev_o1', kind: 'sale', orderNo: 'ORD-1', orderedAt: new Date().toISOString(), items: [{ lineStatus: 'normal', aladinUsedCode: 'U265', qty: 1, price: 8000 }] }); S._saleIdx = null; T.pl(true); await T.tick();
    const o = {}; for (const n of [261, 262, 263, 264, 265, 266, 267]) { const j = T.job('aladin_U' + n); o[n] = [j.state, j.why || '']; } const del = T.cmds('regDel'); S.orders.delete('fbrev_o1'); S._saleIdx = null; return { r, w0, n0, o, items: del.flatMap((c) => c.items.map((x) => x.usedCode)) }; });
  ok(Dd.r.n === 7 && Dd.n0 === 0 && Dd.w0.every(([s, w]) => s === 'queued' && /상품 목록을 아직 다 못 받음/.test(w || '')), 'D 상품 목록을 다 받기 전엔 지우기를 맡기지 않음', [Dd.r, Dd.w0]);
  ok(Dd.o[261][0] === 'del_fail' && /판매가 8000→7500/.test(Dd.o[261][1]) && Dd.o[262][0] === 'del_fail' && /수량 3→2/.test(Dd.o[262][1]) && Dd.o[263][0] === 'del_fail' && /판매중이 아님/.test(Dd.o[263][1]) && Dd.o[264][0] === 'del_fail' && /목록에 없음/.test(Dd.o[264][1]) && Dd.o[267][0] === 'del_fail' && /관리 코드/.test(Dd.o[267][1]), 'D 맡긴 뒤 판매가·수량(팔림)·판매 상태·관리 코드가 바뀌었거나 목록에서 빠진 상품은 지우지 않음', Dd.o);
  ok(Dd.o[265][0] === 'del_fail' && /주문|팔림/.test(Dd.o[265][1]), 'D 맡긴 뒤 주문이 들어온 상품은 지우지 않음', Dd.o[265]);
  ok(Dd.o[266][0] === 'del_wait' && JSON.stringify(Dd.items) === JSON.stringify(['U266']), 'D 그대로인 상품만 지우기 명령에 들어감', [Dd.o[266], Dd.items]);

  /* E. 다시 등록 — 중복 등록을 막는 차례 */
  const E1 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(270)); await T.toReg([l]); await T.regDone(() => ({ state: 'unknown', msg: '응답 없음' })); await T.tick(); await T.tick(); return { j: T.job('aladin_U270'), n: T.cmds('regBulk').length }; });
  ok(E1.j.state === 'need_human' && /등록 결과를 확인 못 함/.test(E1.j.why) && E1.n === 1, 'E1 등록 결과 모름 — 저절로 다시 올리지 않고 사람 확인(중복 등록 막기)', E1);
  const E2 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(271)); await T.toReg([l]); const j0 = T.job('aladin_U271'); await db.collection('prd_bump').doc(j0.id).set({ regAt: new Date(Date.now() - 4 * 3600e3).toISOString() }, { merge: true }); await T.tick(); const j1 = T.job('aladin_U271'); const n1 = T.cmds('regBulk').length;
    await db.collection('prd_bump').doc(j0.id).set({ regAt: new Date(Date.now() - 7 * 3600e3).toISOString() }, { merge: true }); await T.tick(); return { j1: [j1.state, j1.tries], n1, j2: T.job('aladin_U271'), c: T.cmds('regBulk').map((c) => c.status) }; });
  ok(E2.j1[0] === 'reg_wait' && E2.j1[1] === 1 && E2.n1 === 1, 'E2 등록 명령이 아직 대기(수집기가 안 잡음)면 3시간이 넘어도 명령을 또 만들지 않음', E2);
  ok(E2.j2.state === 'need_human' && /6시간 넘게 등록 명령을 잡지 않음/.test(E2.j2.why) && E2.c.length === 1, 'E2 6시간 넘으면 사람 확인(등록 PC 확인)', [E2.j2.state, E2.j2.why, E2.c]);
  const E3 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const a = T.put(T.mk(272)), b = T.put(T.mk(273)); await T.toReg([a, b]); await T.regDone(() => ({ state: 'fail', msg: '등록 실패' })); const now = new Date().toISOString();
    T.put(T.mk(372, { isbn13: a.isbn13, sku: 'PNK_272', registeredAt: now, firstSeenAt: now })); T.put(T.mk(373, { isbn13: b.isbn13, sku: 'PNK_273', registeredAt: now, firstSeenAt: now })); await T.tick(); const ja = T.job('aladin_U272'), jb = T.job('aladin_U273'); const n1 = T.cmds('regBulk').length;
    const linked = await fbDone(S.fb.jobs.get(ja.id), { usedCode: ja.cand.usedCode, listingId: ja.cand.listingId }); await db.collection('prd_bump').doc(jb.id).set(fbRetryPatch(S.fb.jobs.get(jb.id)), { merge: true }); await T.tick();
    const C2 = T.cmds('regBulk'); return { ja, jb, n1, linked, ja2: T.job('aladin_U272'), jb2: T.job('aladin_U273'), lk: T.F('prd_relinks').U372, n2: C2.length, rows2: C2.filter((c) => c.status === 'queued').flatMap((c) => c.rows.map((r) => r.regItem)) }; });
  ok(E3.ja.state === 'need_human' && E3.ja.cand && E3.ja.cand.key === 'aladin_U372' && E3.jb.state === 'need_human' && E3.jb.cand && E3.jb.cand.key === 'aladin_U373' && /같은 상품이 이미 알라딘에 새로 보임/.test(E3.ja.why) && E3.n1 === 1, 'E3 등록 실패로 왔는데 같은 상품이 이미 새로 보임 — 다시 올리지 않고 멈춤(🔗 잇기 후보)', [E3.ja, E3.jb, E3.n1]);
  ok(E3.linked === true && E3.ja2.state === 'done' && E3.ja2.newKey === 'aladin_U372' && E3.lk && E3.lk.first === '2026-05-02T10:00:00' && E3.lk.kind === 'bump', 'E3 🔗 잇기 — 그 새 상품으로 이어 붙임(처음 등록일 이어짐)', [E3.ja2, E3.lk]);
  ok(E3.jb2.state === 'reg_wait' && (E3.jb2.candNo || []).includes('aladin_U373') && E3.n2 === 2 && E3.rows2.length === 1 && E3.rows2[0] === E3.jb.regItem, 'E3 잇지 않고 ♻ — 그 후보는 다른 상품으로 보고 한 번 더 등록(같은 후보로 다시 막지 않음)', [E3.jb2, E3.n2, E3.rows2]);
  const E4 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(274)); await T.toReg([l]); await T.regDone(() => ({ state: 'live', listingId: '955274' })); await T.tick(); const j1 = T.job('aladin_U274'); const now = new Date().toISOString();
    T.put(T.mk(374, { listingId: '955274', isbn13: l.isbn13, sku: 'PNK_274', registeredAt: now, firstSeenAt: now })); await T.tick(); return { j1: [j1.state, j1.newKey || null], j2: T.job('aladin_U274'), n: T.cmds('regBulk').length }; });
  ok(E4.j1[0] === 'reg_wait' && !E4.j1[1] && E4.j2.state === 'done' && E4.j2.newKey === 'aladin_U374' && E4.n === 1, 'E4 새 상품 번호(U코드)를 모르면 끝내지 않고 기다림 → 목록에 보이면 이어 붙임', E4);
  const E5 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(275)); await T.q([l]); await T.tick(); await T.delDone('deleted'); await T.idle(); const j = { ...S.fb.jobs.get(T.job('aladin_U275').id) }; await fbRegQueue([j]); await fbRegQueue([j]); await T.W(100); return { st: j.state, n: T.cmds('regBulk').length, j2: T.job('aladin_U275') }; });
  ok(E5.st === 'del_wait' && E5.n === 1 && E5.j2.state === 'reg_wait' && E5.j2.tries === 1, 'E5 같은 일을 두 번 맡겨도(기기 둘·낡은 값) 등록 명령은 하나', E5);

  /* F. 같은 상품을 두 번 맡김 — 둘째는 건너뜀 */
  const Ff = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(280)); S.prodLoaded = false; const r1 = await T.q([l]); const r2 = await T.q([l]); return { r1, r2, n: T.jobs().filter((j) => j.key === 'aladin_U280').length, ev: T.F('prd_bump_hist').aladin_U280.ev.length }; });
  ok(Ff.r1.n === 1 && Ff.r2.n === 0 && Ff.r2.skip.some((s) => /이미 올리는 중/.test(s)) && Ff.n === 1 && Ff.ev === 1, 'F 같은 상품을 또 맡기면(다른 기기·다른 탭) 건너뜀 — 일도 회차 줄도 하나', Ff);

  /* G. 옮긴 뒤 다시 읽어 대조 — 어긋나면 알리고, 사람이 확인할 때까지 새로 올리지도 지우지도 않음 */
  const G = await p.evaluate(async () => { const T = window.TB; await T.reset(); const a = T.put(T.mk(281)), b = T.put(T.mk(282)), c = T.put(T.mk(283)); await T.toReg([a]); T.pl(false); await T.q([c]); await T.W(400);
    await T.regDone((row) => T.live(row, 381, { price: 7000 })); await T.tick(); await T.tick(); const ja = T.job('aladin_U281'); T.pl(true); await T.tick(); const jc1 = T.job('aladin_U283'); const r = await T.q([b]); const nDel1 = T.cmds('regDel').length;
    await db.collection('prd_bump').doc(ja.id).set({ verify: { ...ja.verify, ack: new Date().toISOString(), ackBy: 'test' } }, { merge: true }); await T.tick(); const jc2 = T.job('aladin_U283'); const r2 = await T.q([b]); return { ja, jc1: [jc1.state, jc1.wait], r, nDel1, jc2: jc2.state, r2n: r2.n, H: T.F('prd_bump_hist').aladin_U281 }; });
  ok(G.ja.state === 'done' && G.ja.verify && G.ja.verify.ok === false && G.ja.verify.diff.some((d) => /판매가 8000→7000/.test(d)) && G.H.ev[0].vOk === false, 'G 옮긴 뒤 다시 읽어 대조 — 판매가가 다르면 어긋남으로 적음(평생 장부 줄에도)', [G.ja.verify, G.H.ev]);
  ok(G.jc1[0] === 'queued' && /대조가 어긋남/.test(G.jc1[1] || '') && G.nDel1 === 1 && G.r.n === 0 && /대조가 어긋남/.test(G.r.why || ''), 'G 어긋남을 사람이 확인하기 전엔 — 기다리던 일은 지우지 않고 · 새로 맡기지도 않음', [G.jc1, G.nDel1, G.r]);
  ok(G.jc2 === 'del_wait' && G.r2n === 1, 'G 사람이 확인하면 다시 진행', [G.jc2, G.r2n]);

  /* H. 끌올로 이어진 고리는 '끊기'로 끊지 못함 */
  const H = await p.evaluate(async () => { const T = window.TB; const b = document.createElement('button'); b.dataset.rlcut = 'U381'; b.id = 'fbrev_cut'; document.body.appendChild(b); b.click(); await T.W(400); const lk = T.F('prd_relinks').U381; b.remove(); return { lk: lk && { kind: lk.kind, rejected: lk.rejected || null, first: lk.first } }; });
  ok(H.lk && H.lk.kind === 'bump' && !H.lk.rejected && H.lk.first === '2026-05-02T10:00:00', 'H 끌올 고리(처음 등록일이 매달림)는 끊기 단추로 끊기지 않음', H);

  /* I. 맡기기 전 대조 — 원본을 못 읽거나 화면과 다르면 올리지 않음 */
  const I = await p.evaluate(async () => { const T = window.TB; await T.reset(); const a = T.mk(290); S.plist.set(a.id, a); const b = T.put(T.mk(291, { firstSeenAt: '2026-11-17T13:00:00' })); const c = T.put(T.mk(292, { qty: 12 })); const d = T.put(T.mk(293), '', { price: 9000 }); const e = T.put(T.mk(294), '', { status: '판매중지' }); const f = T.put(T.mk(295, { registeredAt: null, firstSeenAt: null }));
    const r = await T.q([a, b, c, d, e, f]); return { r, n: T.jobs().length, h: Object.keys(T.F('prd_bump_hist')).length, del: T.cmds('regDel').length }; });
  { const s = I.r.skip || []; const has = (n, re) => s.some((x) => new RegExp('시험 책 ' + n).test(x) && re.test(x));
    ok(I.r.n === 0 && I.n === 0 && I.h === 0 && I.del === 0 && s.length === 6 && has(290, /서버 원본\(prd_listings\)을 못 읽음/) && has(291, /11\/17 사고/) && has(292, /수량 12개/) && has(293, /서버 원본과 화면 값이 다름\(판매가\)/) && has(294, /서버 원본이 판매중이 아님/) && has(295, /등록일이 없음/), 'I 서버 원본 없음 · 11/17 사고로 덮인 「처음 본 날」 · 수량 10개 넘음 · 서버와 화면 값 다름 · 판매중 아님 · 등록일 없음 → 모두 올리지 않음', I); }

  /* J. 사람 확인으로 닫힌 뒤 늦게 등록이 끝남 — 그 새 상품으로 이어 붙임 */
  const J = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(296)); await T.toReg([l]); await T.regDone(() => ({ state: 'unknown' })); await T.tick(); const j1 = T.job('aladin_U296'); const c = T.cmds('regBulk')[0];
    const res = {}; res[j1.regItem] = T.live(c.rows[0], 396); await db.collection('shp_cmds').doc(c.id).set({ results: res }, { merge: true }); await T.W(80); S._fbLateAt = 0; await T.tick(); return { s1: j1.state, j2: T.job('aladin_U296'), lk: T.F('prd_relinks').U396, H: T.F('prd_bump_hist').aladin_U296 }; });
  ok(J.s1 === 'need_human' && J.j2.state === 'done' && J.j2.newKey === 'aladin_U396' && J.lk && J.lk.first === '2026-05-02T10:00:00' && J.H.n === 1 && J.H.ev[0].st === 'done' && J.H.ev[0].to === 'aladin_U396', 'J 닫힌 뒤 늦게 끝난 등록 — 새 상품에 처음 등록일·평생 기록이 이어 붙음(이어지지 않은 새 상품이 남지 않음)', J);

  /* K. 지운 뒤 주문이 보임 — 다시 등록하지 않음 */
  const K = await p.evaluate(async () => { const T = window.TB; await T.reset(); const l = T.put(T.mk(297)); await T.q([l]); await T.tick(); const s0 = T.job('aladin_U297').state;
    S.orders.set('fbrev_o1', { id: 'fbrev_o1', kind: 'sale', orderNo: 'ORD-2', orderedAt: new Date().toISOString(), items: [{ lineStatus: 'normal', aladinUsedCode: 'U297', qty: 1, price: 8000 }] }); S._saleIdx = null; await T.delDone('deleted'); await T.tick(); const j = T.job('aladin_U297'); S.orders.delete('fbrev_o1'); S._saleIdx = null; return { s0, j, n: T.cmds('regBulk').length }; });
  ok(K.s0 === 'del_wait' && K.j.state === 'need_human' && K.j.sold === true && /다시 등록하지 않음/.test(K.j.why) && K.n === 0, 'K 지우는 사이 주문이 들어옴 — 팔린 책을 다시 올리지 않고 사람 확인', K);

  /* L. 평생 장부 지킴 — 처음 값·옛 회차 줄(날짜)은 어떤 쓰기로도 안 바뀌고 줄이 줄면 쓰지 않음 */
  const L = await p.evaluate(async () => { const T = window.TB; await T.reset(); await T.seed('prd_bump_hist', 'h_L', { root: 'h_L', keys: ['h_L', 'k2'], reg0: '2025-01-01T00:00:00', seen0: '2025-01-01T00:10:00', reg0At: 'T0', reg0Src: 'doc', n: 1, ev: [{ job: 'j1', k: 'b', st: 'done', n: 1, at: 'A', doneAt: 'B', from: 'h_L', to: 'k2' }] });
    const r1 = await fbHistUp('h_L', (d) => { d.reg0 = '2026-11-17T00:00:00'; d.seen0 = null; d.reg0At = 'zzz'; d.reg0Src = 'x'; d.ev[0].at = 'changed'; d.ev[0].doneAt = 'changed'; d.ev[0].to = 'other'; d.keys = []; d.ev.push({ job: 'j2', k: 'b', st: 'queued', at: 'C', from: 'k2' }); return d; });
    const d1 = JSON.parse(JSON.stringify(T.F('prd_bump_hist').h_L)); const r2 = await fbHistUp('h_L', (d) => { d.ev = d.ev.filter((v) => v.job !== 'j1'); return d; }); const r3 = await fbHistUp('h_L', (d) => { fbReg0Put(d, { reg0: '2026-11-17T09:00:00', seen0: '2026-11-17T09:10:00', src: 'doc' }, 'j9', 'k9'); return d; });
    return { r1, d1, r2, r3, d3: T.F('prd_bump_hist').h_L }; });
  ok(L.r1 === true && L.d1.reg0 === '2025-01-01T00:00:00' && L.d1.seen0 === '2025-01-01T00:10:00' && L.d1.reg0At === 'T0' && L.d1.reg0Src === 'doc' && L.d1.ev[0].at === 'A' && L.d1.ev[0].doneAt === 'B' && L.d1.ev[0].to === 'k2' && L.d1.keys.includes('h_L') && L.d1.keys.includes('k2') && L.d1.ev.length === 2, 'L 평생 장부 — 처음 값·옛 줄의 날짜·열쇠 목록은 덮어도 그대로 · 새 줄은 덧붙음', L.d1);
  ok(L.r2 === false && L.d3.ev.length === 2 && L.r3 === true && L.d3.reg0 === '2025-01-01T00:00:00' && (L.d3.reg0Alt || []).length === 1 && L.d3.reg0Alt[0].reg0 === '2026-11-17T09:00:00', 'L 옛 줄을 빼는 쓰기는 거절 · 다른 처음 값이 들어오면 덮지 않고 따로 남김', [L.r2, L.r3, L.d3]);

  /* M. 지우기 명령이 수집기를 기다리는 틈 지킴 — 지울 때 판매중이 아니었으면 되살리지 않음 · 끝난 뒤 옛 번호 주문이 보이면 알리고 멈춤 · 수량은 기본 1개짜리만 */
  const M = await p.evaluate(async () => { const T = window.TB; await T.reset(); const a = T.put(T.mk(301)); await T.q([a]); await T.tick(); await T.delDone('deleted', null, '판매중지'); await T.tick(); const j1 = T.job('aladin_U301'); const nReg1 = T.cmds('regBulk').length;
    await db.collection('prd_bump').doc(j1.id).set(fbRetryPatch({ id: j1.id, ...j1 }), { merge: true }); await T.W(80); await T.tick(); const j2 = T.job('aladin_U301'); const nReg2 = T.cmds('regBulk').length;
    const b = T.put(T.mk(302)); await T.q([b]); await T.tick(); await T.delDone('deleted', null, '판매중'); await T.tick(); const j3 = T.job('aladin_U302'); return { j1: [j1.state, j1.why, j1.stopped, j1.open], nReg1, j2: [j2.state, j2.goneOk], nReg2, j3: j3.state, nReg3: T.cmds('regBulk').length }; });
  ok(M.j1[0] === 'need_human' && /판매중지/.test(M.j1[1] || '') && M.j1[2] === true && M.nReg1 === 0, "M 지울 때 알라딘 상태가 '판매중지'였으면(맡긴 뒤 멈춘 상품) 다시 등록하지 않고 사람 확인", [M.j1, M.nReg1]);
  ok(M.j2[0] === 'reg_wait' && M.nReg2 === 1 && M.j3 === 'reg_wait' && M.nReg3 === 2, 'M 사람이 ♻로 맡기면 그때만 다시 등록 · 판매중이던 상품은 그대로 다시 등록', [M.j2, M.nReg2, M.j3, M.nReg3]);
  const M2 = await p.evaluate(async () => { const T = window.TB; await T.reset(); const a = T.put(T.mk(311)), b = T.put(T.mk(312)); await T.toReg([a]); await T.regDone((r) => T.live(r, 411)); await T.tick(); await T.tick(); const j1 = T.job('aladin_U311');
    S.orders.set('fbrev_o1', { id: 'fbrev_o1', kind: 'sale', orderNo: 'ORD-2', orderedAt: new Date().toISOString(), items: [{ lineStatus: 'normal', aladinUsedCode: 'U311', qty: 1, price: 8000 }] }); S._saleIdx = null; await T.tick(); const j2 = T.job('aladin_U311'); const r = await T.q([b]); await T.tick(); const j3 = T.job('aladin_U311');
    S.orders.delete('fbrev_o1'); S._saleIdx = null; return { v1: j1.verify, s1: j1.state, v2: j2.verify, r, nBad: fbVerifyBad().length, same: JSON.stringify(j3.verify) === JSON.stringify(j2.verify) }; });
  ok(M2.s1 === 'done' && M2.v1 && M2.v1.ok === true && M2.v2 && M2.v2.ok === false && M2.v2.late === true && M2.v2.diff.some((d) => /옛 번호로 .*주문/.test(d)) && M2.nBad === 1 && M2.r.n === 0 && M2.same, 'M 끝난 뒤 옛 번호로 주문이 들어온 것이 보이면 대조 어긋남으로 알리고 새 올리기를 멈춤(한 번만 적음)', M2);
  const M3 = await p.evaluate(async () => { const T = window.TB; window.__fbCfgX = { maxQty: null }; await T.reset(); const a = T.put(T.mk(321, { qty: 2 })), b = T.put(T.mk(322)); const P = fbPool(); const pool = P.L.map((x) => x.l.id); const pw = Object.keys(P.why); const r = await T.q([a, b]); await T.tick(); const sk = T.jobs().map((j) => [j.key, j.state, j.why || '']); window.__fbCfgX = null; return { r, sk, pool, pw, def: FB_DEF.maxQty }; });
  ok(M3.def === 1 && M3.r.n === 1 && !M3.pool.includes('aladin_U321') && M3.pool.includes('aladin_U322') && M3.pw.some((w) => /수량 1개 넘음/.test(w)) && (M3.r.skip || []).some((x) => /수량 2개/.test(x)) && M3.sk.length === 1 && M3.sk[0][0] === 'aladin_U322' && M3.sk[0][1] === 'del_wait', 'M 수량 2개 이상은 기본으로 올리지 않음(지우는 사이 한 권 팔리면 옛 수량으로 다시 올라가는 틈 막기) · 수량 1개는 그대로', M3);

  const Z = await p.evaluate(() => window.TB.plW()); ok(Z === 0, '끝까지 — 웹앱이 상품 기록(prd_listings)에 쓴 것 0번(처음 등록일을 서버에서 덮지 않음)', Z);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); });
