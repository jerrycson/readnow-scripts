// tALLCARD1_1120 — (allcard1 · 정범님 I-1120-0108-02 ②·I-1120-0112-03) 🛰 관제소에서 여는 그룹 상품 창(🗼 모아 보기·그룹 칸 창)의 카드 = 그룹 화면 실제 수동 일괄 카드
//  ① 글: ctrlCard → ctrlFullCard → batchCardHtml · 카드 단추가 ctrlAct 한 길(그 그룹 문서) · 칸 창도 같은 카드 · 단축키 자리 · 브라우저 창 없음 · 새 이름 한 번 선언
//  ② 화면(RN_PORT): 칸 창·모아 보기 모두 간단 카드 없이 실제 카드 · 단추(결정 대기로·보류·빼기·±5%·입력칸·시장 지표 갱신) · 눌러서 그 그룹 문서가 그룹 화면과 같게 바뀜 · 480px 넘침 없음
// 실행: pw/ 안 RN_PORT=<포트> node tALLCARD1_1120.js · 시험 자료에 손님 정보 없음 · 실제 운영 잠금·Firestore 안 씀(시험 틀 가짜 db)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const fn = (n) => { const i = T.search(new RegExp('(?:async )?function ' + n + '\\(')); if (i < 0) throw new Error('못 찾음 ' + n); const j = T.indexOf('\nfunction ', i + 9), k = T.indexOf('\nasync function ', i + 9), l = T.indexOf('\n/*', i + 9), m = T.indexOf('\nconst ', i + 9); return T.slice(i, Math.min(...[j, k, l, m].filter((v) => v > 0))); };
console.log('① 글');
{ const names = ['ctrlFullK', 'ctrlFullCard', 'ctrlFullFill', 'ctrlFullIt', 'ctrlFullVal', 'ctrlBqClick', 'ctrlBqInput', 'ctrlSelSet', 'bkfPopCp', 'bkfPopInput', 'kbaOvBox', 'kbaBqBox'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 한 번만 선언`, dup); }
ok(/^function ctrlCard\(P, it\) \{ \{ const F = ctrlFullCard\(P, it\); if \(F\) return F; \}/m.test(T), '관제 카드는 먼저 실제 카드(ctrlFullCard)를 그림');
ok(/function bqRefChip1\(K, x, k\) \{ if \(K\.bqRefChipH\) return K\.bqRefChipH\(k\);/.test(T) && /BQK\.bqRefChipH = bqRefChipH;/.test(T) && /const bqRefChipH = \(kk\) => bqRefChip1\(K, x, kk\);/.test(fn('batchCardHtml')), '🔎 참고 탭 표지(reo1): 그룹 화면 셈 그대로 · 관제창은 같은 bqRefOf');
ok(/batchCardK\(\{ id: it\.gid/.test(fn('ctrlFullK')) && /batchCardHtml\(K, i, j0\)/.test(fn('ctrlFullCard')), '실제 카드 = 그룹 화면 batchCardK·batchCardHtml 그대로');
{ const B = fn('ctrlBqClick'); const need = ['bto', 'bnowp', 'bstep', 'bqrec', 'bback', 'bto2', 'bcancel', 'bre', 'breo', 'brep', 'brex', 'bunfew', 'bunedkw', 'bundo', 'bqht', 'bqmet', 'bused', 'bqexp2', 'bqfold']; const miss = need.filter((n) => !new RegExp('d\\.' + n + '\\b').test(B)); ok(!miss.length, '카드 단추 모두 받음', miss);
  ok(/twiceArm\(b, '이 그룹에서 빼기'[^)]*\); if \(r !== 'go'\) return true;/.test(B), '빼기는 두 번 누름(twiceArm)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(B + fn('ctrlBqInput') + fn('bkfPopClick') + fn('ctrlFullCard')), '브라우저 창 없음');
  ok(!/batchSave|db\.collection/.test(B + fn('ctrlBqInput')), '카드 단추는 직접 쓰지 않고 ctrlAct 한 길로'); }
{ const A = fn('ctrlAct'); ok(/a === 'reopick'/.test(A) && /what: 'reopick', from: 'done'/.test(A) && /x\.target \?\? d\.reo\.p/.test(A), 'ctrlAct: 🔁 다시 결정 대기로(reo1 data-brep와 같은 기록·값)'); ok(/a === 're'/.test(A) && /a === 'unfew' \|\| a === 'unedkw'/.test(A) && /o\.P \|\| S\._bkfCtrl/.test(A) && /patch\.held = \{ \[k\]: FV\.delete\(\) \}/.test(A), 'ctrlAct: 다시 결정·표지 풂·보류 풂 · 칸 창 P도 같은 길'); }
ok(/bkfPopCp\(P, L\)/.test(fn('bkfPopPaint')) && /ctrlCard\(cp, it\)/.test(fn('bkfPopPaint')) && !/<table class="bkf-tb">/.test(fn('bkfPopPaint')), '그룹 칸 창도 표 대신 같은 실제 카드');
ok(/ctrlBqClick\(P\.cp, e, bkfPopPaint\)/.test(fn('bkfPopClick')) && /openBkfCtrl\(fid, tab, \{ gf: \[d\.cpopctrl\] \}\)/.test(fn('bkfPopClick')), '칸 창 카드 단추 · 「모아 보기에서 열기」');
ok(/'bkf_pop'/.test(fn('kbaOvBox')) && /'bkf_ctrl'/.test(fn('kbaOvBox')) && /kbaOvBox\(\)/.test(T.slice(T.indexOf('function kbaScr'), T.indexOf('function kbaScr') + 600)), '단축키가 안쪽 창 카드에도');
ok(/#bkf_ctrl \.ctrl-full\[data-cid\], #bkf_pop \.ctrl-full\[data-cid\]/.test(T) && /__ctrlBqPick/.test(T), '블록 가격 단추도 그 그룹 결정 대기로');
ok(/@media \(max-width:480px\)\{\.ctrl-full/.test(T), '좁은 화면 줄바꿈 CSS');
if (!process.env.RN_PORT) { console.log(bad ? `❌ tALLCARD1_1120 ${bad}개 실패` : '✓ tALLCARD1_1120 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const until = async (f, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(f, arg).catch(() => null); if (v) return v; await Wt(p, 150); } return null; };
  const fid = await p.evaluate(async (d10) => { if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 8; i++) { const uc = 'U5710000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(507100000 + i), title: '모아 시험 책 ' + i, price: 7000 + i * 200, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk57' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400, sellerCode: '1', listingId: '9' + n }] }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 8900, recentDays: 0, kw: '모아 시험' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
    await put('mA', '모아 시험 그룹'); await db.collection('prd_system').doc('pricing').set({ mode: 'manual' });
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'mA'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '모아 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['mA'] }); return a.fid; }, new Date(Date.now() - 10 * 864e5).toISOString());
  await until((fid) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[fid] && S.bkfold.folds[fid].gids.length === 1), 60, fid);
  await p.evaluate((fid) => { window.__nBC = 0; const o = window.batchCardHtml; window.batchCardHtml = function () { window.__nBC++; return o.apply(this, arguments); }; openBkfold(fid); }, fid);
  const tb = await until(() => { const c = S._bkfTb || {}; return c.mA && c.mA.n ? c.mA.n : null; }, 80); ok(!!tb, '묶음 상태판이 셈', tb);
  const tabOf = await p.evaluate(() => { const n = (S._bkfTb.mA || {}).n || {}; return ['sel', 'lot', 'bb', 'few', 'keep'].find((t) => (n[t] || 0) >= 3) || null; }); ok(!!tabOf, '상품 3개 넘는 탭이 있음', tabOf);
  const doc = (k) => p.evaluate(async (k) => { const d = (await batchLoadOne('mA')) || {}; return { pick: !!(d.picks || {})[k], held: !!(d.held || {})[k], tr: !!(d.trashed || {})[k], from: ((d.held || {})[k] || (d.trashed || {})[k] || {}).from || null }; }, k);
  const feat = (sel) => p.evaluate((sel) => { const ov = document.querySelector(sel); if (!ov) return null; const c = ov.querySelector('.ctrl-full'); const q = (s) => !!(c && c.querySelector(s));
    return { full: ov.querySelectorAll('.ctrl-full .card.pq.bq').length, simple: ov.querySelectorAll('.ctrl-c:not(.ctrl-full)').length, tbl: !!ov.querySelector('table.bkf-tb'), bto: q('[data-bto]'), hold: q('[data-bqht="hold"]'), trash: q('[data-bqht="trash"]'), met: q('[data-bqmet]'), step: q('[data-bstep]'), pin: q('[data-bpin]'), right: q('.pq-r'), memo: q('.jm,.jmemo,[data-jm],[data-jmemo]') || /메모/.test(c ? c.textContent : ''), grp: q('[data-cgo]'), view: !!ov.querySelector('.rgvwf'), nBC: window.__nBC }; }, sel);
  /* ── 길 1: 그룹 × 탭 칸 → 칸 창 ── */
  await p.locator(`[data-bkftb="mA"][data-bkftbt="${tabOf}"]`).click();
  await until(() => !!document.querySelector('#bkf_pop .ctrl-full .card.pq.bq'), 80);
  const f1 = await feat('#bkf_pop'); ok(f1 && f1.full >= 3 && f1.simple === 0 && !f1.tbl && f1.nBC > 0, '칸 창: 간단 카드·표 없이 실제 수동 일괄 카드(batchCardHtml)', f1);
  ok(f1 && f1.bto && f1.hold && f1.trash && f1.met && f1.step && f1.pin && f1.right && f1.grp && f1.view, '칸 창 카드 기능: 결정 대기로·보류·빼기·시장 지표 갱신·±5%·값 입력·오른쪽 시장 칸·그룹 칩·보기 바꿈', f1);
  ok(!!(await p.evaluate(() => document.querySelector('#bkf_pop [data-cpopctrl]'))), '칸 창 카드: 「모아 보기에서 열기」 단추');
  const ks = await p.evaluate(() => [...document.querySelectorAll('#bkf_pop .ctrl-full[data-cid]')].slice(0, 3).map((w) => w.dataset.cid.split('|').slice(1).join('|')));
  /* 결정 대기로 */
  await p.evaluate(() => { const w = document.querySelector('#bkf_pop .ctrl-full[data-cid]'); const i = w.querySelector('[data-bpin]'); if (i && !(+i.value >= 10)) { i.value = '7300'; i.dispatchEvent(new Event('input', { bubbles: true })); } w.querySelector('[data-bto]').click(); });
  ok(!!(await until(async (k) => { const d = (await batchLoadOne('mA')) || {}; return !!((d).picks || {})[k]; }, 60, ks[0])), '칸 창 ⇢ 결정 대기로 → 그 그룹 문서 picks', ks[0]);
  /* 보류 */
  await until((k) => { const w = [...document.querySelectorAll('#bkf_pop .ctrl-full[data-cid]')].find((x) => x.dataset.cid.endsWith('|' + k)); const b = w && w.querySelector('[data-bqht="hold"]'); if (b && !b.disabled) { b.click(); return true; } return null; }, 40, ks[1]);
  ok(!!(await until(async (k) => { const d = (await batchLoadOne('mA')) || {}; return !!((d).held || {})[k]; }, 60, ks[1])), '칸 창 ⏸ 보류 → 그 그룹 문서 held');
  { const d = await doc(ks[1]); ok(d.held && d.from === tabOf && !d.pick, '보류 기록 = 그룹 화면과 같은 꼴(from = 그 탭 · 결정 대기 아님)', d); }
  /* 빼기 — 한 번은 무장만, 두 번째에 뺌 */
  const clickTr = (k) => until((k) => { const w = [...document.querySelectorAll('#bkf_pop .ctrl-full[data-cid]')].find((x) => x.dataset.cid.endsWith('|' + k)); const b = w && w.querySelector('[data-bqht="trash"]'); if (b && !b.disabled) { b.click(); return true; } return null; }, 40, k);
  await clickTr(ks[2]); await Wt(p, 400); ok(!(await doc(ks[2])).tr, '✖ 빼기 한 번 누름 = 아직 안 뺌');
  await clickTr(ks[2]); ok(!!(await until(async (k) => { const d = (await batchLoadOne('mA')) || {}; return !!((d).trashed || {})[k]; }, 60, ks[2])), '두 번째 누름 → 그 그룹 문서 trashed');
  await p.keyboard.press('Escape'); ok(!!(await until(() => !document.getElementById('bkf_pop'), 30)), 'Esc → 칸 창 닫힘');
  /* ── 길 2: 🗼 모아 보기(묶음 모든 그룹의 그 탭) ── */
  await p.evaluate(([fid, t]) => { window.__nBC = 0; bkfTbAll(fid, t); }, [fid, tabOf]);
  await until(() => !!document.querySelector('#bkf_ctrl .ctrl-full .card.pq.bq'), 100);
  const f2 = await feat('#bkf_ctrl'); ok(f2 && f2.full >= 1 && f2.simple === 0 && f2.nBC > 0, '모아 보기: 간단 카드 없이 실제 수동 일괄 카드', f2);
  ok(f2 && f2.bto && f2.hold && f2.trash && f2.met && f2.step && f2.pin && f2.right && f2.grp && f2.view, '모아 보기 카드 기능 모두', f2);
  ok(!!(await p.evaluate(() => { const c = document.querySelector('#bkf_ctrl .ctrl-full'); return c && c.querySelector('[data-chist]') && c.querySelector('[data-cper]') && c.querySelector('[data-cpeek]'); })), '모아 보기 덧붙임(📈 기록·⚙ 개별·🔭 감시·전략) 그대로');
  ok(await p.evaluate(() => typeof kbaScr !== 'function' || kbaScr() === 'batch'), '단축키가 모아 보기 카드를 봄');
  /* 넘침 — 480px 아래 */
  await p.setViewportSize({ width: 420, height: 800 }); await Wt(p, 400);
  const ov = await p.evaluate(() => { const L = [...document.querySelectorAll('#bkf_ctrl .ctrl-full')]; return { doc: document.documentElement.scrollWidth - innerWidth, card: Math.max(0, ...L.map((c) => c.scrollWidth - c.clientWidth)) }; });
  ok(ov.doc <= 1 && ov.card <= 2, '420px: 화면·카드 가로 넘침 없음', ov);
  await p.setViewportSize({ width: 1280, height: 900 });
  const k4 = await p.evaluate(() => { const w = document.querySelector('#bkf_ctrl .ctrl-full[data-cid]'); if (!w) return null; const i = w.querySelector('[data-bpin]'); if (i && !(+i.value >= 10)) { i.value = '7400'; i.dispatchEvent(new Event('input', { bubbles: true })); } w.querySelector('[data-bto]').click(); return w.dataset.cid.split('|').slice(1).join('|'); });
  ok(!!(await until(async (k) => { const d = (await batchLoadOne('mA')) || {}; return !!((d).picks || {})[k]; }, 60, k4)), '모아 보기 ⇢ 결정 대기로 → 그 그룹 문서 picks', k4);
  /* 결정 대기 탭 — ↩ 선택 대기로 */
  await p.evaluate((fid) => { ctrlClose(); bkfTbAll(fid, 'pick'); }, fid);
  await until(() => !!document.querySelector('#bkf_ctrl .ctrl-full [data-bback]'), 100);
  const kb = await p.evaluate(() => { const w = document.querySelector('#bkf_ctrl .ctrl-full[data-cid]'); const st = !!w.querySelector('[data-bstep]'); w.querySelector('[data-bback]').click(); return [w.dataset.cid.split('|').slice(1).join('|'), st]; });
  ok(kb[1], '결정 대기 탭 카드에도 ±5%');
  ok(!!(await until(async (k) => { const d = (await batchLoadOne('mA')) || {}; return !((d).picks || {})[k]; }, 60, kb[0])), '결정 대기 탭 ↩ → 그 그룹 문서 picks에서 빠짐', kb[0]);
  ok(!dlg.length, '브라우저 창 안 뜸', dlg);
  console.log(bad ? `❌ tALLCARD1_1120 ${bad}개 실패` : '✅ tALLCARD1_1120 모두 통과'); process.exit(bad ? 1 : 0); });
