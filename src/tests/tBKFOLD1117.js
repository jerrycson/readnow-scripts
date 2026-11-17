// tBKFOLD1117 — (정범님 11/17 I-1117-1307-07 ①) 🧮 수동 일괄 그룹 순서 — ⠿ 끌어서 바꾸기(상품 탭 칸 · 수동 일괄 화면 📂 그룹 줄)
//  ① 순수 셈: 순서에 없는 새 그룹은 앞 · 안 보인 그룹(보관)은 제자리 · 한 칸 옮기기 · 키(Alt+Shift+화살표)가 웹앱·브라우저 단축키와 안 겹침
//  ② 화면: 저장된 순서대로 그림(두 곳 같게) · 마우스로 끌기 · 손가락 꾹 눌러 끌기(빨리 움직이면 끌기 아님) · 키보드 Alt+Shift+←/→ · prd_price_batches/_bkfold 한 문서에 저장(모든 기기)
//        다른 기기에서 바뀐 순서가 다시 그리지 않고 칸 차례만 바뀜 · 손잡이를 눌러도 그룹이 열리지 않음 · 브라우저 창 없음
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKFOLD1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 순수 셈');
{ const blk = cut('/* ◆bkfold 시작', '/* ◆bkfold 끝 */');
  const F = new Function(blk + '\nreturn { bkfSort, bkfOrdMerge, bkfStep, bkfKeyDir, BKF_KEYS };')();
  const G = ['n1', 'a', 'b', 'c', 'n2'].map((id) => ({ id }));
  ok(F.bkfSort(G, ['c', 'a', 'b']).map((x) => x.id).join() === 'n1,n2,c,a,b', '순서에 없는 새 그룹은 앞(새것 먼저 그대로) → 그다음 정한 순서');
  ok(F.bkfSort(G, []).map((x) => x.id).join() === 'n1,a,b,c,n2' && F.bkfSort(G, null).length === 5, '순서가 없으면 예전 차례 그대로');
  ok(F.bkfSort(G, ['x', 'b', 'b', 'a']).map((x) => x.id).join() === 'n1,c,n2,b,a', '지워진 그룹 id·겹친 id가 있어도 안 깨짐');
  ok(F.bkfOrdMerge(['a', 'H', 'b', 'c'], ['c', 'a', 'b']).join() === 'c,H,a,b', '안 보인 그룹(보관)은 제자리 · 보인 것만 새 차례');
  ok(F.bkfOrdMerge(['a', 'b'], ['new', 'b', 'a']).join() === 'new,b,a', '처음 옮긴 새 그룹도 순서에 들어감');
  ok(F.bkfOrdMerge([], ['b', 'a']).join() === 'b,a' && F.bkfOrdMerge(['H', 'H'], ['a']).join() === 'H,a', '빈 순서·겹친 id');
  ok(F.bkfStep(['a', 'b', 'c'], 'b', -1).join() === 'b,a,c' && F.bkfStep(['a', 'b', 'c'], 'b', 1).join() === 'a,c,b' && F.bkfStep(['a', 'b'], 'a', -1).join() === 'a,b' && F.bkfStep(['a', 'b'], 'b', 1).join() === 'a,b', '한 칸 앞·뒤 · 끝에서는 그대로');
  const E = (key, o) => ({ key, altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, ...(o || {}) });
  ok(F.bkfKeyDir(E('ArrowLeft')) === -1 && F.bkfKeyDir(E('ArrowUp')) === -1 && F.bkfKeyDir(E('ArrowRight')) === 1 && F.bkfKeyDir(E('ArrowDown')) === 1, 'Alt+Shift+←/↑ = 앞 · →/↓ = 뒤');
  ok(!F.bkfKeyDir(E('ArrowLeft', { shiftKey: false })) && !F.bkfKeyDir(E('ArrowUp', { shiftKey: false })) && !F.bkfKeyDir(E('ArrowLeft', { ctrlKey: true })) && !F.bkfKeyDir(E('KeyB')), 'Alt+↑/↓(웹앱 이전·다음 카드)·Alt+←/→(브라우저 뒤로·앞으로)·Ctrl 조합은 안 먹음');
  /* 겹침 검사 표 — 이 키는 웹앱·브라우저·책방 친구 어디에도 없고, 이번에 '수동 일괄'로만 더함 */
  const res = cut('const KBA_RES = (() => {', 'return o; })();'); const mine = res.split('\n').filter((x) => /🧮 수동 일괄 「/.test(x));
  const others = res.split('\n').filter((x) => !/🧮 수동 일괄 「/.test(x)).join('\n');
  ok(mine.length === 1 && F.BKF_KEYS.every((k) => mine[0].includes(`['${k.replace('Alt+Shift+', '')}'`)), '겹침 검사 표에 이 네 키를 「🧮 수동 일괄」로 더함(카드 단축키를 이 키로 못 바꾸게)');
  ok(!/A\('Alt\+Shift\+'[^\n]*Arrow/.test(others) && !/Shift\+Arrow/.test(others), '다른 웹앱·브라우저·책방 친구 단축키와 겹치지 않음');
  const all = cut('/* ◆bkfold 시작', 'const bkfGrip ='); ok(!/\b(alert|confirm|prompt)\s*\(/.test(all) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(all), '새 코드에 브라우저 창·휴대전화 번호 꼴 없음');
  ok((T.match(/function bkfOrdMerge\(/g) || []).length === 1 && (T.match(/function bkf(Sort|Step|KeyDir|Drag|ApplyDom|Listen|SaveOrder)\(/g) || []).length === 7, '새 함수 이름이 웹앱 안 다른 함수(예: 서가 bkfMerge)와 겹치지 않음');
  ok(/if \(d\.id === '_bkfold'\) \{ try \{ S\.bkfold = d\.data\(\)/.test(T), '그룹 모음에서 _bkfold 문서는 그룹이 아니라 순서로 받음');
  ok((T.match(/bkfSort\(/g) || []).length >= 4 && /bkfSort\(S\.prBatches, \(S\.bkfold \|\| \{\}\)\.order\)/.test(T) && /bkfSort\(all\.filter\(\(b\) => !b\.archived \|\| S\.bslotArch\), \(S\.bkfold \|\| \{\}\)\.order\)/.test(T), '상품 탭 칸·📂 그룹 줄 두 곳이 같은 순서 함수'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD1117 ${bad}개 실패` : '✓ tBKFOLD1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async () => { window.__TL = []; const T0 = window.toast; window.toast = (m, e, ms) => { window.__TL.push(String(m)); return T0 && T0(m, e, ms); }; window.__OPEN = []; window.openBatchGroup = (g) => { window.__OPEN.push(g); };
    const now = new Date().toISOString(); const G = [['gA', '그룹 가'], ['gB', '그룹 나'], ['gC', '그룹 다'], ['gD', '그룹 라'], ['gH', '보관 그룹']];
    /* 웹앱이 스스로 만드는 확인용 그룹(b_chk1109 · 만든 뒤 그룹 목록을 다시 받아 화면을 다시 그림)을 미리 보관으로 둬 시험 중 다시 그리기를 막음 · 순서 비교는 g로 시작하는 시험 그룹만 */ await db.collection('prd_price_batches').doc('b_chk1109').set({ name: '확인용', archived: true, createdAt: '2026-11-09T00:00:00.000Z', viewOnly: true }); for (const [id, name] of G) await db.collection('prd_price_batches').doc(id).set({ name, createdAt: now, ...(id === 'gH' ? { archived: true } : {}) });
    await db.collection('prd_price_batches').doc('_bkfold').set({ order: ['gC', 'gH', 'gA', 'gB'] });
    S.prBatches = undefined; S.bkfold = undefined; S._bkfUn = null; S.bslotArch = false; try { localStorage.removeItem('rn-thin-sec'); } catch (e) {} S.tab = 'products'; S.thinPick = null; S.q = ''; renderTabs(); renderMainNow(); for (let i = 0; i < 40 && !document.querySelector('#main .bslot-row [data-bkf]'); i++) await new Promise((r) => setTimeout(r, 150)); await new Promise((r) => setTimeout(r, 300));
    /* 화면 왼쪽 아래 받기 띠(#dlp · 시험 자료가 띄움)가 손잡이를 덮으면 마우스가 띠를 누름 — 시험에서만 숨김 */ const dl = document.getElementById('dlp'); if (dl) dl.style.display = 'none'; const r = document.querySelector('#main .bslot-row'); if (r) r.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 100)); }); };
const order = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel + ' > [data-bkf]')].map((x) => x.dataset.bkf).filter((k) => /^g/.test(k)), sel);
const saved = (p) => p.evaluate(() => (((window.__FS.prd_price_batches || {})._bkfold || {}).order || []).filter((k) => /^g/.test(k)));
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); await setup(p);
  const o0 = await order(p, '#main .bslot-row');
  ok(o0.join() === 'gD,gC,gA,gB', '상품 탭 칸 = 새 그룹(순서에 없음) 먼저 → 저장된 순서 · 보관 그룹은 숨김', o0);
  ok(await p.evaluate(() => S.prBatches.every((b) => b.id !== '_bkfold') && S.prBatches.filter((b) => /^g/.test(b.id)).length === 5), '_bkfold 문서는 그룹 목록에 안 들어감');
  /* 마우스로 끌기: 그룹 라(맨 앞) → 그룹 나 뒤로 */
  const box = async (sel) => (await p.locator(sel).boundingBox());
  const gD = await box('#main [data-bkf="gD"] .bkf-grip'); const gB = await box('#main [data-bkf="gB"]');
  await p.mouse.move(gD.x + gD.width / 2, gD.y + gD.height / 2); await p.mouse.down(); await p.mouse.move(gD.x + 30, gD.y + 5, { steps: 4 }); await p.mouse.move(gB.x + gB.width - 4, gB.y + gB.height / 2, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(400);
  const o1 = await order(p, '#main .bslot-row'); const s1 = await saved(p);
  ok(o1.join() === 'gC,gA,gB,gD', '마우스로 끌어 놓으면 칸 차례가 바뀜', o1);
  ok(s1.join() === 'gC,gH,gA,gB,gD', '모든 기기 공유 문서(prd_price_batches/_bkfold)에 저장 · 보관 그룹은 제자리', s1);
  ok(await p.evaluate(() => window.__OPEN.length === 0), '손잡이를 끌어도 그룹이 열리지 않음');
  ok(await p.evaluate(() => window.__TL.some((m) => /그룹 순서 저장/.test(m))), '저장하면 알림(토스트)');
  /* 손잡이를 그냥 눌렀다 떼도 그룹이 안 열림 · 칸(이름)을 누르면 열림 */
  await p.locator('#main [data-bkf="gA"] .bkf-grip').click(); await p.waitForTimeout(150); ok(await p.evaluate(() => window.__OPEN.length === 0), '손잡이 누름 = 그룹 안 열림');
  await p.locator('#main [data-bslot="gA"]').click(); await p.waitForTimeout(150); ok(await p.evaluate(() => window.__OPEN.join() === 'gA'), '그룹 칸을 누르면 그 그룹이 열림(예전 그대로)');
  /* 키보드 — 그룹 다 손잡이에 두고 Alt+Shift+→ → 한 칸 뒤 · 그룹 칸(단추)에 두고 Alt+Shift+← */
  await p.locator('#main [data-bkf="gC"] .bkf-grip').focus(); await p.keyboard.press('Alt+Shift+ArrowRight'); await p.waitForTimeout(300);
  const o2 = await order(p, '#main .bslot-row'); ok(o2.join() === 'gA,gC,gB,gD' && (await saved(p)).join() === 'gA,gH,gC,gB,gD', '키보드 Alt+Shift+→ = 한 칸 뒤 · 저장', [o2, await saved(p)]);
  const fo = await p.evaluate(() => { const a = document.activeElement; const c = a && a.closest && a.closest('[data-bkf]'); return c ? c.dataset.bkf : String(a && a.outerHTML || '').slice(0, 160); }); ok(fo === 'gC', '옮긴 뒤에도 포커스가 그 칸에 남음(이어서 누를 수 있음)', fo);
  await p.locator('#main [data-bslot="gD"]').focus(); await p.keyboard.press('Alt+Shift+ArrowLeft'); await p.waitForTimeout(300);
  const o3 = await order(p, '#main .bslot-row'); ok(o3.join() === 'gA,gC,gD,gB', '그룹 칸에 포커스 + Alt+Shift+← = 한 칸 앞', o3);
  await p.locator('#main [data-bkf="gA"] .bkf-grip').focus(); await p.keyboard.press('Alt+Shift+ArrowLeft'); await p.waitForTimeout(200);
  ok((await order(p, '#main .bslot-row')).join() === 'gA,gC,gD,gB' && await p.evaluate(() => window.__TL.some((m) => /맨 앞/.test(m))), '맨 앞에서 더 앞으로 = 그대로 · 「맨 앞입니다」', [await order(p, '#main .bslot-row'), await p.evaluate(() => window.__TL.slice(-3))]);
  await p.locator('#main [data-bkf="gA"] .bkf-grip').focus(); await p.keyboard.press('Alt+ArrowDown'); await p.waitForTimeout(200);
  ok((await order(p, '#main .bslot-row')).join() === 'gA,gC,gD,gB', 'Alt+↓(웹앱 다음 카드)는 순서를 건드리지 않음', await order(p, '#main .bslot-row'));
  /* 다른 기기에서 바꾼 순서 → 칸 차례만 바뀜(다시 그리지 않음 — 같은 칸 요소가 그대로) */
  const r4 = await p.evaluate(async () => { /* 시험 자리는 시험 자료의 실시간 수신이 끊임없이 다시 그리므로, 이 칸만 다시 그리기를 잠깐 막고 '다시 그리지 않고 차례만 바꾸는지' 봄 */ const RM = window.renderMain, RN = window.renderMainNow; window.renderMain = () => {}; window.renderMainNow = () => {}; try { const el = document.querySelector('#main [data-bkf="gB"]'); el.__mark = 1; await db.collection('prd_price_batches').doc('_bkfold').set({ order: ['gB', 'gD', 'gC', 'gA', 'gH'] }, { merge: true }); await new Promise((r) => setTimeout(r, 300)); const o = [...document.querySelectorAll('#main .bslot-row > [data-bkf]')].map((x) => x.dataset.bkf); return { o: o.filter((k) => /^g/.test(k)), same: document.querySelector('#main [data-bkf="gB"]').__mark === 1 }; } finally { window.renderMain = RM; window.renderMainNow = RN; } });
  ok(r4.o.join() === 'gB,gD,gC,gA' && r4.same, '다른 기기에서 바꾼 순서가 바로 보임(전체 다시 그리기 없이)', r4);
  /* 보관 그룹 보기 켜면 보관 그룹도 제자리 */
  await p.evaluate(async () => { S.bslotArch = true; renderMainNow(); await new Promise((r) => setTimeout(r, 200)); });
  ok((await order(p, '#main .bslot-row')).join() === 'gB,gD,gC,gA,gH', '보관 그룹 보기 = 저장된 자리에 보관 그룹');
  /* 수동 일괄 화면 📂 그룹 줄 — 같은 순서 · 끌기 */
  await p.evaluate(async () => { S.bslotArch = false; S.batchId = 'gC'; openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '그룹 다' }))); await new Promise((r) => setTimeout(r, 500)); });
  const s0 = await order(p, '#sheet .bgrp-list'); ok(s0.join() === 'gB,gD,gC,gA,gH', '📂 그룹 줄 = 같은 저장 순서(보관 그룹 포함 — 예전처럼 모두)', s0);
  ok(await p.evaluate(() => !!document.querySelector('#sheet .bgrp-list [data-bkf="gC"] [data-bopen="gC"].on')), '지금 연 그룹 표시(on) 그대로');
  const a = await box('#sheet [data-bkf="gA"] .bkf-grip'); const b = await box('#sheet [data-bkf="gB"]');
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(a.x - 20, a.y + 4, { steps: 3 }); await p.mouse.move(b.x + 4, b.y + b.height / 2, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(400);
  const s2 = await order(p, '#sheet .bgrp-list'); ok(s2[0] === 'gA' && s2.join() === 'gA,gB,gD,gC,gH' && (await saved(p)).join() === 'gA,gB,gD,gC,gH', '📂 그룹 줄에서 끌어도 같은 문서에 저장', [s2, await saved(p)]);
  /* 손가락: 꾹 누르기(0.35초) 뒤 끌기 = 옮김 · 바로 움직이면 끌기 아님 */
  const touch = (key, toKey, hold) => p.evaluate(async ([key, toKey, hold]) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const g = document.querySelector(`#sheet [data-bkf="${key}"] .bkf-grip`); const t = document.querySelector(`#sheet [data-bkf="${toKey}"]`); const r0 = g.getBoundingClientRect(), r1 = t.getBoundingClientRect();
    const ev = (el, ty, x, y) => el.dispatchEvent(new PointerEvent(ty, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 }));
    const x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2; ev(g, 'pointerdown', x0, y0); await W(hold); ev(g, 'pointermove', x0 + 30, y0); ev(g, 'pointermove', r1.right - 3, r1.top + r1.height / 2); await W(30); ev(g, 'pointerup', r1.right - 3, r1.top + r1.height / 2); await W(300); return [...document.querySelectorAll('#sheet .bgrp-list > [data-bkf]')].map((x) => x.dataset.bkf).filter((k) => /^g/.test(k)); }, [key, toKey, hold]);
  const t1 = await touch('gH', 'gD', 60); ok(t1.join() === 'gA,gB,gD,gC,gH', '손가락으로 바로 움직이면(꾹 누르지 않음) 순서 그대로 — 줄 넘기기와 안 헷갈림', t1);
  const t2 = await touch('gH', 'gB', 450); ok(t2.join() === 'gA,gB,gH,gD,gC' && (await saved(p)).join() === 'gA,gB,gH,gD,gC', '손가락 꾹 누른 뒤 끌기 = 옮기고 저장', [t2, await saved(p)]);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.bkf-grip')).touchAction === 'none' && /끌어서 순서/.test(document.querySelector('.bkf-grip').title)), '손잡이: 터치 스크롤 대신 끌기 · 설명(title)');
  /* 그룹 목록을 다시 받는 중(S.prBatches = null)에 저장해도 안 보인 그룹 자리를 잃지 않음 */
  const r9 = await p.evaluate(async () => { const L = S.prBatches; S.prBatches = null; await bkfSaveOrder(['gB', 'gA']); S.prBatches = L; return 1; }); ok(r9 && (await saved(p)).join() === 'gB,gA,gH,gD,gC', '목록을 다시 받는 중에 저장해도 다른 그룹 자리 그대로', await saved(p));
  ok(dlg.length === 0, '브라우저 창(alert·confirm) 없음', dlg);
  const W9 = await p.evaluate(() => (window.__FSW || []).filter((w) => w.n === 'prd_price_batches').map((w) => [w.id, Object.keys(w.v || {})]));
  ok(W9.filter(([id]) => id !== '_bkfold').every(([, k]) => !k.some((f) => /^order/.test(f))) && W9.filter(([id]) => id === '_bkfold').every(([, k]) => k.every((f) => ['order', 'orderAt', 'orderBy', 'uploadedAt'].includes(f))), '순서는 _bkfold 문서에만(그룹 문서에 순서 칸을 안 씀 · 그룹 문서의 lastKeys 맞춤은 예전 그대로)', W9);
  console.log(bad ? `❌ tBKFOLD1117 ${bad}개 실패` : '✓ tBKFOLD1117 통과'); process.exitCode = bad ? 1 : 0; });
