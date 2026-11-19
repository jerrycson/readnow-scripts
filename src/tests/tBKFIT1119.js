// tBKFIT1119 — (정범님 I-1119-1304-10) 📁 묶음 페이지: 창 크기에 맞춤 · 🛰 감시·전략 단추 = 안쪽 창
//  ① 글: 안쪽 창 함수·닫기 길·바깥 누름 연결 · 브라우저 창 없음 · 전화번호 모양 없음
//  ② 화면(RN_PORT): 폭 360·768·1024·1280·1680·1920에서 문서 가로 넘침 없음(구역 오른쪽 끝도 창 안) · 7개 단추(🛰 감시·전략 5 + 🎯 종합 비교 + 👀 조회수 분석)가 묶음 위 안쪽 창으로 열림 · 뒤로·Esc·바깥 누름·✕로 닫히고 묶음으로 돌아옴
// 실행: pw/ 안 RN_PORT=<포트> node tBKFIT1119.js · 시험 자료(가짜 그룹 5개)에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const i = T.indexOf('function bkfTool('); const NEW = T.slice(i, T.indexOf('function bkfToolHtml(', i));
  ok(/function bkfWinOn\(/.test(NEW) && /function bkfWinOff\(/.test(NEW) && /bkfWinOn\(\); \} catch/.test(NEW), '도구를 열면 안쪽 창 상태로(bkfWinOn) · 닫히면 풀림(bkfWinOff)');
  ok(/popstate', \(\) => setTimeout\(bkfWinOff/.test(NEW), '뒤로 가기(popstate)로 안쪽 창이 풀림');
  ok(/getElementById\('bkfwin_x'\)/.test(T) && /#bbpeek_x,#bkfwin_x/.test(T), '바깥 누름·✕가 뒤로 가기로 이어짐');
  ok(/#sheet\.bkfwin\{/.test(T) && /class="sh bkfsh"/.test(T), '안쪽 창 · 묶음 페이지 CSS');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFIT1119 ${bad}개 실패` : '✓ tBKFIT1119 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SEED = async function (d10) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 12; i++) { const uc = 'U5600000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(506937000 + i), title: '묶음 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk56' + i }); }
  if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
  for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400, sellerCode: '1', listingId: '9' + n }] }); }
  S.pmLoaded = true; S.sellersLoaded = true;
  const put = (id, name, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {}, ...(x || {}) });
  const ids = ['gA', 'gB', 'gC', 'gD', 'gE']; const nm = ['1만-3만 중상태 아주 긴 그룹 이름 시험', '1만-3만 중상태(2)', '다른 그룹', '5천원 이하 최상 신간 위주 그룹', '그룹 다섯번째'];
  for (let i = 0; i < 5; i++) await put(ids[i], nm[i]);
  await db.collection('prd_system').doc('pricing').set({ batchOff: { gA: true }, mode: 'manual' }); S.prCfg = { ...(S.prCfg || {}), batchOff: { gA: true } };
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gE'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '전체처리v1' }); await bkfTx({ t: 'put', fid: a.fid, gids: ids }); return a.fid; };

const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const f = await p.evaluate(async ([src, d]) => (eval('(' + src + ')'))(d), [SEED.toString(), new Date(Date.now() - 10 * 864e5).toISOString()]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f] && S.bkfold.folds[f].gids.length === 5), f)) break; await Wt(p, 150); }
  for (const w of [360, 768, 1024, 1280, 1680, 1920]) {
    await p.setViewportSize({ width: w, height: 900 }); await p.evaluate((f) => openBkfold(f), f);
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.getElementById('bkf_tb') && Object.keys(S._bkfTb || {}).length >= 3)) break; await Wt(p, 150); }
    await Wt(p, 300);
    const m = await p.evaluate(() => { const iw = innerWidth, sh = document.getElementById('sheet'); const bad = []; ['.bkf-head', '#bkf_tb', '#bkf_ctl', '.bkf-glist'].forEach((s) => { const e = document.querySelector(s); if (e && e.getBoundingClientRect().right > iw + 1) bad.push(s); });
      return { iw, sw: document.documentElement.scrollWidth, shsw: sh.scrollWidth, bad }; });
    ok(m.sw <= m.iw && m.shsw <= m.iw + 1 && !m.bad.length, `폭 ${w}: 문서·묶음 페이지 가로 넘침 없음 · 구역 오른쪽 끝이 창 안`, m); }
  await p.setViewportSize({ width: 1280, height: 900 }); await p.evaluate((f) => openBkfold(f), f); await Wt(p, 600);
  const open = (n) => p.evaluate((n) => { const b = document.querySelector('[data-bkftool="' + n + '"]'); if (!b) return false; b.click(); return true; }, n);
  const st = () => p.evaluate(() => ({ win: document.getElementById('sheet').classList.contains('bkfwin'), bd: document.body.classList.contains('peekbd'), x: !!document.getElementById('bkfwin_x'), det: Object.keys(S.detail || {}).join(), back: !!document.getElementById('bkf_scr') }));
  const keys = { watch: 'prmon', strat: 'strat', lock: 'plkf', res: 'research', found: 'found', cmp: 'benchHub', px: 'pxexp' }; /* (bkftop1) 맨 위 줄로 옮긴 뒤 🎯 종합 비교·👀 조회수 분석도 안쪽 창 */
  for (const n of Object.keys(keys)) {
    ok(await open(n), `「${n}」 단추가 있음`); await Wt(p, 700); let s = await st();
    ok(s.win && s.bd && s.x && !s.back, `「${n}」 = 안쪽 창으로 열림(묶음 위 · 바깥 어둡게 · ✕)`, s);
    const box = await p.evaluate(() => { const b = document.getElementById('sheet').getBoundingClientRect(); return { l: b.left, r: innerWidth - b.right, t: b.top }; }); ok(box.l >= 8 && box.r >= 8 && box.t >= 8, '새 페이지(전체 화면)가 아니라 가장자리가 보이는 창', box);
    await p.goBack(); await Wt(p, 500); s = await st(); ok(!s.win && !s.bd && !s.x && s.back, `「${n}」 뒤로 가기 → 창 닫히고 묶음 화면으로`, s);
  }
  await open('strat'); await Wt(p, 600); await p.keyboard.press('Escape'); await Wt(p, 500); let s2 = await st(); ok(!s2.win && s2.back, 'Esc → 닫히고 묶음으로', s2);
  await open('watch'); await Wt(p, 600); await p.mouse.click(3, 450); await Wt(p, 500); s2 = await st(); ok(!s2.win && s2.back, '바깥(어두운 곳) 누름 → 닫히고 묶음으로', s2);
  await open('lock'); await Wt(p, 600); await p.evaluate(() => document.getElementById('bkfwin_x').click()); await Wt(p, 500); s2 = await st(); ok(!s2.win && s2.back, '✕ → 닫히고 묶음으로', s2);
  await p.setViewportSize({ width: 360, height: 800 }); await open('watch'); await Wt(p, 600);
  const nw = await p.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, shsw: document.getElementById('sheet').scrollWidth })); ok(nw.sw <= nw.iw && nw.shsw <= nw.iw + 1, '좁은 폭(360)에서 안쪽 창도 가로 넘침 없음', nw);
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tBKFIT1119 ${bad}개 실패` : '✓ tBKFIT1119 통과'); return bad; });
