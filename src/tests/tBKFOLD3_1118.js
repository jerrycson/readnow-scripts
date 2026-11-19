// tBKFOLD3_1118 — (정범님 11/18 I-1118-2059-24.3~24.7 · I-1118-2156-27) 📁 묶음 폴더: 탭 표 모두 셈·안쪽 창·탭별 손익 합·「한꺼번에」(두 번 확인·막힘 건너뜀·되돌리기)·🔁 다시 계산 후 옮기기·🛰 감시·전략 · 꺼진 원본(복사로 바뀐 그룹)은 저절로 빼지 않고 「빼려면 누르세요」 제안만(1.78.777 bkpin1 · 정범님 11/19 13:10 「지금 상태로 고정」)
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 전화번호 모양 없음 · 겹침 정리(bkfDupFix)·바뀐 그룹 찾기(bkfReplOf) 셈
//  ② 화면(RN_PORT): 꺼진 그룹도 셈 · 칸 → 안쪽 창(Esc·바깥 누름 닫힘) · 한꺼번에 단추 · 두 번째 확인에서 멈추면 아무것도 안 씀 · 바뀐 그룹 자동 빼기(그룹 문서는 그대로)
// 실행: pw/ 안 RN_PORT=<포트> node tBKFOLD3_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const fn = (n) => { const i = T.indexOf('function ' + n + '('); if (i < 0) throw new Error('못 찾음 ' + n); const j = T.indexOf('\nfunction ', i + 9), k = T.indexOf('\nconst ', i + 9), l = T.indexOf('\n/*', i + 9); return T.slice(i, Math.min(...[j, k, l].filter((v) => v > 0))); };
console.log('① 글');
{ const names = ['BQ_TABDEF', 'BKF_STALE_H', 'BKF_BIGCUT', 'BKF_SHIPD', 'BKF_BULK', 'BKF_UNDOABLE', 'BKF_DONE_MV', 'BKF_CPRE', 'bkfTbCols', 'bkfItemWhy', 'bkfTbSum', 'bkfTabKeys', 'bkfDupFix', 'bkfBulkNote', 'bkfBulkAsk', 'bkfUndoSave', 'bkfDecMap', 'bkfCancelDec', 'bkfReplOf', 'bkfReplFix', 'bkfMvShow', 'bkfExecOne', 'bkfTbAll', 'bkfPop', 'bkfPopKey', 'bkfPopClose', 'bkfPopLoad', 'bkfPopPaint', 'bkfPopClick', 'bkfTool', 'bkfToolHtml'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup);
  ok(!/_bkfTbOn/.test(T) && /function bkfTbCols\(\) \{ const base = BQ_TABDEF\.map/.test(T), '꺼진 그룹 「누르면 셈」(_bkfTbOn) 없어짐 · 묶음판 칸 = 공용 BQ_TABDEF 모든 탭(더보기칸 접기 없음)');
  ok(/const BKF_DONE_MV = 'mark';/.test(T) && /const mark = plan\.map[^\n]*if \(BKF_DONE_MV !== 'move'\) plan\.splice\(0\)/.test(T) && !/why: '🔁 다시 계산', fold: ctx\.fid, run: ctx\.run, was: \+e\.d\.price/.test(T), '확정 뒤 추천 바뀜은 한 곳(BKF_DONE_MV) · 표시만 — 사람 손 없이 확정을 취소해 선택 대기로 보내지 않음(정범님 I-1120-0051-01 · 옛 11/18 23:11 옮김을 바꿈)');
  const NEW = ['bkfItemWhy', 'bkfTbSum', 'bkfDupFix', 'bkfBulkAsk', 'bkfExecOne', 'bkfReplFix', 'bkfPopClick', 'bkfMvShow', 'bkfTool'].map(fn).join('\n');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음');
  ok(!/collection\('prd_price_batches'\)\.doc\([^)]*\)\.delete\(\)/.test(NEW), '그룹 문서를 지우지 않음');
  ok(/두 번째 확인/.test(fn('bkfBulkAsk')), '한꺼번에 = 두 번 확인');
  const W = fn('bkfItemWhy'); ok(['등록 안 됨', '판매중이 아님', '14일 안 주문', '시장 지표 없음', '72시간', '10원 아래', '하한선 아래', '묶음 경계', '10분의 1', '정가 넘음'].every((w) => W.includes(w)), '막는 까닭 10가지가 모두 있음');
  ok(/bkfUndoSave\(/.test(fn('bkfExecOne')) && fn('bkfExecOne').indexOf('bkfUndoSave(') < fn('bkfExecOne').indexOf("batchSave("), '확정 실행은 되돌리기 기록을 먼저 씀');
  ok(/batchExecProg/.test(fn('bkfExecOne')) && /batchIsOn/.test(fn('bkfExecOne')), '확정 실행은 다른 실행 중·꺼진 그룹을 다시 봄');
  ok(/at >= 0 \? \{ at \}/.test(fn('bkfCopyGroup')) && /t: 'out', fid: opt\.fid, gids: \[gid\]/.test(fn('bkfCopyGroup')), '복사 + 원본 끄기 = 사본을 원본 자리에 넣고 원본은 묶음에서 뺌(그룹은 그대로)');
  /* 겹침 정리 셈 — 앞 그룹이 이김 · 값이 다르면 둘 다 뺌 */
  const dupFix = new Function(fn('bkfDupFix') + '; return bkfDupFix;')();
  const P = { X: {}, rows: [{ gid: 'a', info: { keys: [['k1', 100, 90], ['k2', 200, 210], ['k3', 50, 40]] } }, { gid: 'b', info: { keys: [['k1', 100, 90], ['k2', 199, 210]] } }, { gid: 'c', info: { keys: [['k3', 50, 40]] } }] }; P.todo = P.rows.slice(); dupFix(P);
  ok(P.X.dupX === 1 && P.X.dup === 2 && P.rows[0].info.keys.map((x) => x[0]).join() === 'k1,k3' && P.rows[1].info.n === 0 && P.rows[1].skip === 'zero' && P.rows[2].skip === 'zero' && P.todo.length === 1 && P.rows[0].info.amt === 20, '겹침: 같은 값은 앞 그룹만 · 값이 다르면 둘 다 뺌 · 0개 그룹은 건너뜀', P);
  /* 바뀐 그룹 찾기 셈 */
  const replOf = new Function('BKF_CPRE', fn('bkfReplOf') + '; return bkfReplOf;')(/\s*\((?:\d+|사본)\)\s*$/);
  const gs = [{ id: 'o', name: '1만-3만 중상태' }, { id: 'n', name: '1만-3만 중상태(2)' }, { id: 'x', name: '다른 그룹' }, { id: 'y', name: '사본 아님', copiedFrom: { gid: 'x' } }];
  const on = (g) => g !== 'o' && g !== 'x'; const R = { pairs: [{ a: 'o', b: 'n', n: 553 }, { a: 'x', b: 'y', n: 3 }], per: { o: 553, x: 40 } };
  const L = replOf(gs, R, on); ok(L.length === 1 && L[0].old === 'o' && L[0].neu === 'n', '꺼진 원본 + 켜진 「이름(2)」 + 90% 넘게 겹침 → 원본만 뺄 대상(겹침 적은 사본은 그대로)', L);
  ok(replOf(gs, R, () => true).length === 0, '원본이 켜져 있으면 빼지 않음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFOLD3_1118 ${bad}개 실패` : '✓ tBKFOLD3_1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const until = async (f, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(f, arg).catch(() => null); if (v) return v; await Wt(p, 150); } return null; };
  const fid = await p.evaluate(async (d10) => { if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 6; i++) { const uc = 'U5600000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(506937000 + i), title: '묶음 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk56' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400, sellerCode: '1', listingId: '9' + n }] }); }
    S.pmLoaded = true; S.sellersLoaded = true;
    const put = (id, name, x) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 8900, recentDays: 0, kw: '묶음 시험' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {}, ...(x || {}) });
    await put('hA', '1만-3만 중상태'); await put('hB', '1만-3만 중상태(2)', { copiedFrom: { gid: 'hA', name: '1만-3만 중상태', at: d10 } }); await put('hC', '다른 그룹');
    await db.collection('prd_system').doc('pricing').set({ batchOff: { hA: true }, mode: 'manual' }); S.prCfg = { ...(S.prCfg || {}), batchOff: { hA: true } };
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'hC'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '전체 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['hA', 'hB', 'hC'] }); return a.fid; }, new Date(Date.now() - 10 * 864e5).toISOString());
  await until((fid) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[fid] && S.bkfold.folds[fid].gids.length === 3), 60, fid);
  await p.evaluate((fid) => openBkfold(fid), fid);
  const tb = await until(() => { const c = S._bkfTb || {}; const el = document.getElementById('bkf_tb'); if (!el || !(c.hA && c.hA.n && c.hC && c.hC.n)) return null; return { off: !!el.querySelector('[data-bkftbr="hA"] [data-bkftb]'), dis: el.querySelectorAll('[data-bkftb][disabled]').length, bulk: el.querySelectorAll('[data-bkfbulk]').length, tot: !!el.querySelector('[data-bkftb="*"]'), r2: !!document.querySelector('[data-bkfrun="recalc2"]'), tool: !!document.querySelector('#bkf_top [data-bkftool="watch"]') && !document.querySelector('#bkf_act [data-bkftool]') }; /* (bkftop1 · 정범님 I-1119-1955-27) 🛰 감시·전략 단추는 실행 카드 아래 띠(.bkf-tools)에서 관제소 맨 위 줄(#bkf_top)로 옮김 */ }, 200);
  ok(tb && tb.off && tb.dis === 0 && tb.tot, '꺼진 그룹도 셈 · 모든 칸이 눌림 · 모두 합계 줄', tb);
  ok(tb && tb.bulk >= 2 && tb.r2 && tb.tool, '「한꺼번에」 단추 · 🔁 다시 계산 후 옮기기 · 🛰 감시·전략 단추는 맨 위 줄', tb);
  /* 칸 → 안쪽 창 · Esc 닫힘 · 바깥 누름 닫힘 · 묶음 화면 그대로 */
  await p.locator('[data-bkftb="hC"][data-bkftbt="sel"]').click(); const o1 = await until(() => (document.getElementById('bkf_pop') ? { g: S._bkfPop && S._bkfPop.gid, t: S._bkfPop && S._bkfPop.tab, bid: S.batchId || null } : null), 60);
  ok(o1 && o1.g === 'hC' && o1.t === 'sel', '칸을 누르면 그 그룹·그 탭 안쪽 창(그룹 화면으로 가지 않음)', o1);
  await p.keyboard.press('Escape'); ok(!!(await until(() => !document.getElementById('bkf_pop') && !!document.getElementById('bkf_tb'), 30)), 'Esc → 닫히고 묶음 화면');
  await p.locator('[data-bkftb="hC"][data-bkftbt="sel"]').click(); await until(() => !!document.getElementById('bkf_pop'), 60); await p.mouse.click(4, 4);
  ok(!!(await until(() => !document.getElementById('bkf_pop') && !!document.getElementById('bkf_tb'), 30)), '바깥 누름 → 닫히고 묶음 화면');
  /* 두 번 확인 — 둘째에서 멈추면 아무것도 쓰지 않음 */
  const tw = await p.evaluate(async (fid) => { const asks = []; const keep = window.ask; let i = 0; window.ask = async (m) => { asks.push(String(m).slice(0, 40)); return i++ === 0; };
    try { await bkfRun(fid, 'pickAll', 'sel'); } catch (e) { asks.push('오류 ' + e.message); } window.ask = keep;
    const pk = (S.prBatches || []).filter((g) => ['hA', 'hB', 'hC'].includes(g.id)).map((g) => Object.values(g.picks || {}).filter((x) => x && /📁/.test(x.why || '')).length).reduce((a, b) => a + b, 0); return { asks, pk }; }, fid);
  ok(tw.pk === 0 && (tw.asks.length === 0 || (tw.asks.length === 2 && /두 번째/.test(tw.asks[1]))), '한꺼번에: 첫 확인 뒤 둘째 확인 · 둘째에서 멈추면 고른 가격을 쓰지 않음', tw);
  /* 27 — (1.78.777 bkpin1 · 정범님 11/19 13:10) 꺼진 원본(hA) + 사본(hB) 겹침 → 저절로 빼지 않음 · 제안 띠만 · 누르면 그때 뺌 · 그룹 문서 그대로 */
  await p.evaluate((fid) => { try { localStorage.removeItem('rn-bkf-keep'); } catch (e) {} S._bkfRF = new Set(); bkfReplFix(fid, { pairs: [{ a: 'hA', b: 'hB', n: 6 }], per: { hA: 6, hB: 6 } }); }, fid);
  const bar = await until(() => { const b = document.getElementById('bkf-bar'); return b && /빼려면 누르세요/.test(b.textContent) ? { t: b.textContent, btn: !!b.querySelector('button') } : null; }, 40);
  await p.waitForTimeout(600);
  const kept = await p.evaluate(async (fid) => { const f = S.bkfold.folds[fid]; const d = await db.collection('prd_price_batches').doc('hA').get(); return { gids: f.gids.slice(), doc: d.exists }; }, fid);
  ok(bar && bar.btn && kept.doc && kept.gids.join() === 'hA,hB,hC', '꺼진 원본은 묶음에 그대로 남고(저절로 안 뺌) 「빼려면 누르세요」 띠만 뜸 · 그룹 문서 그대로', { bar, kept });
  await p.locator('#bkf-bar button').click();
  const rf = await until(async (fid) => { const f = S.bkfold.folds[fid]; if (f.gids.includes('hA')) return null; const d = await db.collection('prd_price_batches').doc('hA').get(); return { gids: f.gids, doc: d.exists }; }, 80, fid);
  ok(rf && rf.doc && rf.gids.join() === 'hB,hC', '띠의 「묶음에서 빼기」를 누르면 그때 원본만 빠짐 · 그룹 문서는 그대로', rf);
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tBKFOLD3_1118 ${bad}개 실패` : '✓ tBKFOLD3_1118 통과'); return bad; });
