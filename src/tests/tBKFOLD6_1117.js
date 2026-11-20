// tBKFOLD6_1117 — (정범님 11/17 18:26 I-1117-1826-19.8 「전부 너 추천대로」 · 설계안 BKFOLD_DESIGN_1117 14절 ② (가)) 📥 나머지 그룹
//  ① 글: 새 이름은 파일 전체에서 한 번 · 브라우저 창 없음 · 서버에 쓰지 않음(읽기만) · 기본값 칸(BATCH_DEF)에 안 넣음(옛 그룹 그대로 = 꺼짐)
//  ② 화면: 같은 묶음 앞 그룹들이 가져간 상품(조건 + 고름)만 빠짐 · 앞 그룹도 나머지면 차례대로 · 차례를 바꾸면 대상이 달라짐 · 묶음 밖이면 빼는 것 없음
//        편집기 칸(켜기·뺀 개수 안내) · 칩에 📥 표 · 겹침 없음(앞 그룹과) · 390px 넘침 없음
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD6_1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 글');
{ const NEW = cut('/* (판 ⑥ · 정범님 I-1117-1826-19.8 「전부 너 추천대로」', 'const BKF_Q = [];');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창(alert·confirm·prompt) 없음');
  ok(!/prd_price_decisions|batchSave\(|\.set\(|\.update\(|bkfTx\(/.test(NEW), '나머지 그룹 셈은 서버에 쓰지 않음(읽기만)');
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음');
  const names = ['bkfRestEx', 'bkfRestTag']; const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup);
  ok(!/const BATCH_DEF = \{[^;]*\brest:/.test(T), 'BATCH_DEF에 rest 칸 없음 — 옛 그룹·새 그룹 모두 꺼짐이 기본');
  ok((T.match(/const restEx = c\.rest && gid (?:&& !past )?\? bkfRestEx\(gid\) : null;/g) || []).length === 1 && /if \(restEx && restEx\.has\('aladin_' \+ l\.usedCode\)\) return false;/.test(T), 'batchFilter 한 곳에서만 뺌(그룹 화면·편집기 개수·겹침 검사 같은 셈)'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD6_1117 ${bad}개 실패` : '✓ tBKFOLD6_1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await W(p, 500);
  const D = (d) => new Date(Date.now() - d * 864e5).toISOString();
  const fid = await p.evaluate(async ([d10, d3]) => { window.prompt = () => null; window.__ANS = true; window.confirm = () => window.__ANS; if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 12; i++) { const uc = 'U6600000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(606937000 + i), title: '나머지 시험 책 ' + i, price: 7000 + i * 100, qty: 1, grade: ['최상', '상', '중', '하'][i % 4], status: '판매중', active: true, sku: 'RRR', registeredAt: '2026-09-0' + ((i % 9) + 1) + 'T09:00:00', bookId: 'br' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 9000 + n * 900, pubDate: String(1995 + (n % 25)) + '-03-01' });
      if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400 + n * 60, sellerCode: '1', listingId: '9' + n }, { usedCode: l.usedCode, grade: l.grade, price: l.price, sellerCode: '996008', listingId: l.listingId }], usedTotal: n + 1, salesPoint: n * 37, lastCheckedAt: new Date().toISOString() }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const put = (id, name, cond, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, recentDays: 0, kw: '나머지 시험', ...cond }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, ...(x || {}) });
    /* 가 = 최상 3개 + 손으로 더한 「하」 하나(U660000013 · 더함 added — 조건 밖에서 고르기만 한 것은 「조건 밖」이라 가져간 것으로 안 침, 감시기와 같음) · 나 = 상 3개 · 다 = 나머지(조건 넓음) · 라 = 나머지(다 뒤 — 다가 다 가져가 0) · 밖 = 나머지인데 묶음에 없음 */
    await put('rA', '최상 그룹', { grades: ['최상'] }, { added: { aladin_U660000013: { at: d3, by: 't' } } }); await put('rB', '상 그룹', { grades: ['상'] }); await put('rR', '그 밖 전부', { rest: true }); await put('rR2', '그 밖 둘째', { rest: true }); await put('rX', '묶음 밖 나머지', { rest: true });
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'rX'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '나머지 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['rA', 'rB', 'rR', 'rR2'] }); return a.fid; }, [D(10), D(3)]);
  const until = async (fn, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  await until(() => !!bkfOf(bkfNorm(S.bkfold, null), 'rR2'), 60);
  const take = (gid) => p.evaluate((gid) => { const g = (S.prBatches || []).find((x) => x.id === gid); const c = bkfCond(g); return batchFilter(c, gid).map((l) => l.usedCode).filter((u) => /^U66/.test(u)).sort(); }, gid);
  /* ⓐ 차례 가·나·다·라 — 다는 최상·상 6개와 가가 고른 1개를 뺀 5개 · 라는 다까지 가져가 0 */
  { const a = await take('rA'), b = await take('rB'), r = await take('rR'), r2 = await take('rR2'), x = await take('rX');
    ok(a.length === 3 && b.length === 3, '앞 그룹 — 최상 3 · 상 3 (보통 그룹 그대로)', { a, b });
    ok(r.length === 5 && !r.some((u) => a.includes(u) || b.includes(u)) && !r.includes('U660000013'), '📥 나머지 그룹 = 앞 그룹이 가져간 6개 + 가가 손으로 더한 1개를 뺀 5개', r);
    ok(r2.length === 0, '나머지 뒤 나머지 = 앞 나머지가 다 가져가 0개(차례대로 셈)', r2);
    ok(x.length === 12, '묶음 밖 나머지 그룹 = 빼는 것 없음(12개 전부)', x.length); }
  /* ⓑ 겹침 없음 — 나머지 그룹 구성원은 앞 그룹 구성원과 겹치지 않음 */
  const ov = await p.evaluate(() => { const m = (id) => { const g = (S.prBatches || []).find((x) => x.id === id); return bkfMembers(bkfCond(g), id, bkfSt(g)).keys; }; const A = new Set([...m('rA'), ...m('rB')]); return { n: m('rR').length, hit: m('rR').filter((k) => A.has(k)) }; });
  ok(ov.n === 5 && ov.hit.length === 0, '앞 그룹 구성원(조건 + 더함)과 겹치는 상품 없음 — 막기(가) 규칙에 걸리지 않음', ov);
  /* ⓒ 차례를 바꾸면 대상이 달라짐 — 다를 맨 앞으로 → 12개 전부 · 가는 그대로 3개 */
  await p.evaluate(async (fid) => { await bkfTx({ t: 'put', fid, gids: ['rR', 'rA', 'rB', 'rR2'] }); }, fid);
  await until((fid) => (S.bkfold.folds[fid].gids[0] === 'rR' ? true : null), 60, fid);
  { const r = await take('rR'), a = await take('rA'), r2 = await take('rR2'); ok(r.length === 12 && a.length === 3 && r2.length === 0, '맨 앞의 나머지 그룹 = 빼는 것 없음(12개) · 뒤 그룹은 그대로 · 마지막 나머지는 0', { r: r.length, a: a.length, r2: r2.length }); }
  await p.evaluate(async (fid) => { await bkfTx({ t: 'put', fid, gids: ['rA', 'rB', 'rR', 'rR2'] }); }, fid); await until((fid) => (S.bkfold.folds[fid].gids[2] === 'rR' ? true : null), 60, fid);
  /* ⓓ 앞 그룹 조건을 바꾸면 다시 셈(담아 둔 것은 서명이 달라져 버림) */
  { const r = await p.evaluate(() => { const g = (S.prBatches || []).find((x) => x.id === 'rB'); const keep = g.cond; g.cond = { ...keep, grades: ['상', '중'] }; const n = batchFilter(bkfCond((S.prBatches || []).find((x) => x.id === 'rR')), 'rR').filter((l) => /^U66/.test(l.usedCode)).length; g.cond = keep; return n; }); ok(r === 2, '앞 그룹이 중까지 넓히면 나머지 그룹은 2개로 줄어듦(바로 다시 셈)', r); }
  /* ⓔ 편집기 — 📥 칸 켜짐 · 뺀 개수 안내 · 칩 표 */
  await p.evaluate(() => { history.pushState({ batch: 1 }, ''); openBatchGroup('rR'); });
  const ed = await until(() => { const r = document.querySelector('#sheet .bkfrest'); if (!r || S.batchId !== 'rR') return null; const cb = r.querySelector('[data-bk="rest"]'); return { on: cb && cb.checked, txt: r.textContent, tag: document.querySelectorAll('#sheet .bkfrest-t').length, cnt: (document.querySelector('#sheet #bcount') || {}).textContent || '' }; }, 120);
  ok(ed && ed.on && /앞 그룹 2개가 가져간 7개를 뺌/.test(ed.txt) && /차례를 바꾸면/.test(ed.txt), '편집기 📥 칸 — 켜짐 · 「앞 그룹 2개가 가져간 7개를 뺌」 · 차례 안내', ed);
  ok(ed && ed.tag >= 1, '그룹 칩에 📥 표', ed && ed.tag);
  /* 끄면 다시 12개 · 다시 켜면 5개(편집기 개수) */
  await p.evaluate((v) => { const e = document.querySelector('#sheet [data-bk="rest"]'); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, false); await W(p, 400);
  const off = await until(() => { const r = document.querySelector('#sheet .bkfrest'); const t = (document.querySelector('#sheet #bcount') || {}).textContent || ''; return r && r.dataset.bkfrest === '0' && /해당 상품/.test(t) ? { t, c: S.batchC && S.batchC.rest } : null; }, 60);
  ok(off && off.c === false, '📥 끄면 칸이 꺼짐(rest=false)', off);
  await p.evaluate((v) => { const e = document.querySelector('#sheet [data-bk="rest"]'); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, true); await W(p, 400);
  const on2 = await until(() => { const r = document.querySelector('#sheet .bkfrest'); return r && r.dataset.bkfrest === '1' && /가져간 7개/.test(r.textContent) ? true : null; }, 60);
  ok(on2, '다시 켜면 뺀 개수 안내가 다시 그려짐');
  /* ⓕ 390px 넘침 없음 */
  await p.setViewportSize({ width: 390, height: 844 }); await W(p, 400);
  const w = await p.evaluate(() => { const r = document.querySelector('#sheet .bkfrest'); return { doc: document.documentElement.scrollWidth, w: innerWidth, row: r ? r.scrollWidth - r.clientWidth : null }; });
  ok(w.doc <= w.w + 2 && w.row != null && w.row <= 2, '390px에서 📥 칸 가로 넘침 없음', w);
  await p.setViewportSize({ width: 1400, height: 900 });
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음', dlg);
  console.log(bad ? `❌ tBKFOLD6_1117 ${bad}개 실패` : '✓ tBKFOLD6_1117 통과'); return bad; });
