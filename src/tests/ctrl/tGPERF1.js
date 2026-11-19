// tGPERF1 — (정범님 11/19 I-1119-2153-33 · 일꾼 gperf1) 🛰 관제소 「📊 이 그룹 성과」(안쪽 창) · 「📊 묶음 성과」(묶음의 모든 그룹 합친 성과)
//  ① 글: 브라우저 창 없음 · 새 덩어리는 서버에 쓰지 않음 · 새 이름 한 번만 선언 · 기능 찾기·설명서·고친 기록에 있음 · 시트(📊 그룹 성과)는 그대로 gpPaint를 씀
//  ② 화면: 그룹 줄마다 data-gperf 단추 · 누르면 안쪽 창(시트 아님) · Esc·✕로 닫힘(관제소는 그대로) · 창 내용 = 시트 내용(같은 그림)
//        묶음 성과: 여러 그룹에 든 상품은 한 번만 · 판매는 한 번만 읽음 · 반영 기록은 그룹마다 한 번(30분 기억) · 표 줄 → 그 그룹 · ← 묶음 성과
//        빈 묶음·기록 없는 그룹 글 · 380px 가로 넘침 없음 · 가짜 Firestore 쓰기 0
// 실행: pw/ctrl 안(../harness.js·../seed.js) RN_PORT=<포트> node tGPERF1.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', '..', 'app.html'), path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 글');
{ const NEW = cut('/* ◆gpwin 시작', '/* ◆gpwin 끝 */');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창(alert·confirm·prompt) 없음');
  ok(!/\.doc\([^)]*\)\.(set|update|delete)\(|\.update\(|\.add\(\{|runTransaction|\.batch\(\)|bkfTx\(|batchSave\(/.test(NEW), '새 덩어리는 서버에 쓰지 않음(읽기만)');
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음');
  const names = ['gpFoldCompute', 'gpFoldHtml', 'gpwOpen', 'gpwPaint', 'gpwClick', 'gpwKey', 'gpwPop', 'gpwFeat', 'gpwClose', 'gpPaint', 'gpActs', 'gpByKey', 'gpFirstAt', 'gpBase', 'GP_ACT_TTL'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup);
  ok(/async function openGroupPerf\(gid\)[^\n]*\n?[^\n]*return gpPaint\(sh, gid, \{/.test(T) || /function openGroupPerf\(gid\)[\s\S]{0,900}return gpPaint\(sh, gid,/.test(T), '시트 📊 그룹 성과도 같은 그림(gpPaint)을 씀');
  ok(/history\.pushState\(\{ gperf/.test(cut('async function openGroupPerf(gid)', 'async function gpPaint(')), '시트는 예전처럼 뒤로 가기 자리를 만듦');
  ok(/data-gperf="\$\{esc\(g\.id\)\}" data-gpwin="1"[^>]*>📊 이 그룹 성과</.test(T) && /id="bkf_gperf"[^>]*>📊 묶음 성과</.test(T), '관제소 그룹 줄 「📊 이 그룹 성과」 · 「📊 묶음 성과」 단추');
  ok(/t: '📊 묶음 성과 — [^']*', w: '[^']*', k: '[^']*', go: \{ fn: \(\) => gpwFeat\(\) \}/.test(T), '기능 찾기(FEAT)에 「📊 묶음 성과」');
  ok(/\['foldPerf', '📊 묶음 성과'/.test(T), '🚪 바로 가기(GO_PAGES)에 묶음 성과');
  const man = T.indexOf('📊 묶음 성과', T.indexOf('const UPDATE_LOG') > 0 ? 0 : 0); ok(man >= 0 && (T.match(/📊 이 그룹 성과/g) || []).length >= 3, '설명서·안내에 두 단추 글이 있음');
  ok(/app: '웹앱', v: '[0-9.]+', n: \["📊 🛰 관제소 그룹 줄마다 「📊 이 그룹 성과」/.test(T), '고친 기록(UPDATE_LOG)에 한 줄');
  /* (I-1119-2213-36) ↗ 그룹 화면 */
  { const G = cut('function bkfGoGroup(', '\n'); ok(/history\.pushState\(\{ batch: 1 \}, ''\); return openBatchGroup\(gid, \{ fold: /.test(G) && !/alert\(|confirm\(|prompt\(|\.set\(|\.update\(/.test(G), '↗ = 묶음 그룹 목록과 같은 길(pushState + openBatchGroup(gid, { fold }))'); }
  ok(/<span class="bkf-tbnt">\$\{esc\(g\.name \|\| g\.id\)\}<\/span>\$\{bkfGoIc\(g\)\}<\/b>/.test(T) && /closest\('\[data-bkfgi\],\[data-bkftb\]/.test(T) && /if \(t\.dataset\.bkfgi\) return bkfGoGroup\(fid, t\.dataset\.bkfgi\);/.test(T), '상태판 이름 옆 ↗ · 위임 누름에서 이름보다 먼저');
  ok(/t: '↗ 그룹 화면으로', d: '[^']+', sel: '#bkf_tb \[data-bkfgi\]'/.test(T) && /"↗ 📊 그룹 상태판/.test(T), '설명서·고친 기록에 ↗ 한 줄');
}
if (!process.env.RN_PORT) { console.log(bad ? `❌ tGPERF1 ${bad}개 실패` : '✓ tGPERF1 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require('../harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('../seed.js')); await W(p, 500);
  const ids = await p.evaluate(async () => { if (!S.user) S.user = { email: 't@x', uid: 't' };
    const iso = (h) => new Date(Date.now() - h * 3600e3).toISOString(); const kst = (h) => new Date(Date.now() - h * 3600e3 + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
    const mk = (u, price, active) => { const l = { id: 'aladin_' + u, usedCode: u, listingId: 'L' + u, title: '성과 시험 책 ' + u, price, qty: 1, grade: '상', status: active ? '판매중' : '판매완료', active, sku: 'GPT', registeredAt: '2026-05-01T09:00:00' }; S.plist.set(l.id, l); };
    ['GP1', 'GP2', 'GP3', 'GP4', 'GP5'].forEach((u, i) => mk(u, 5000 + i * 500, !['GP1', 'GP3', 'GP4'].includes(u))); for (let i = 0; i < 6; i++) mk('GZ' + i, 3000, i > 0);
    const act = (g, u, h, f, t) => db.collection('prd_price_actions').doc(g + '_' + u).set({ key: 'aladin_' + u, usedCode: u, title: '성과 시험 책 ' + u, from: f, to: t, at: iso(h), kind: 'batch', batchId: g, by: 't' });
    await act('gpA', 'GP1', 240, 6000, 5000); await act('gpA', 'GP2', 239, 6500, 5500); await act('gpA', 'GP3', 238, 7000, 6000);
    await act('gpB', 'GP3', 100, 6000, 5800); await act('gpB', 'GP4', 99, 7000, 6500); await act('gpB', 'GP5', 98, 7000, 7500);
    S.orders = S.orders instanceof Map ? S.orders : new Map();
    S.orders.set('og1', { kind: 'sale', orderNo: 'OG1', orderedAt: kst(200), items: [{ aladinUsedCode: 'GP1', price: 5000, qty: 1, lineStatus: 'normal' }] });
    S.orders.set('og3', { kind: 'sale', orderNo: 'OG3', orderedAt: kst(50), items: [{ aladinUsedCode: 'GP3', price: 5800, qty: 1, lineStatus: 'normal' }] });
    S.orders.set('og4', { kind: 'sale', orderNo: 'OG4', orderedAt: kst(20), items: [{ aladinUsedCode: 'GP4', price: 6500, qty: 1, lineStatus: 'normal' }] });
    S.orders.set('oz0', { kind: 'sale', orderNo: 'OZ0', orderedAt: kst(60), items: [{ aladinUsedCode: 'GZ0', price: 3000, qty: 1, lineStatus: 'normal' }] });
    S.ordersLoaded = true;
    const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name }, createdAt: iso(300), lastRunAt: iso(300), by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
    await put('gpA', '성과 그룹 가'); await put('gpB', '성과 그룹 나'); await put('gpE', '성과 그룹 빈');
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gpE'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '성과 시험 묶음' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['gpA', 'gpB', 'gpE'] }); const e = await bkfTx({ t: 'new', name: '빈 시험 묶음' });
    return { fid: a.fid, efid: e.fid }; });
  const until = async (fn, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  await until((fid) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[fid] && S.bkfold.folds[fid].gids.length === 3), 60, ids.fid);
  /* 여기부터 쓰기 0 · 읽기 셈 */
  await p.evaluate(() => { window.__FSW = []; window.__RD = {}; const oc = db.collection; db.collection = function (n) { const q = oc.call(db, n); const tag = (o) => { const g = o.get; o.get = function () { window.__RD[n] = (window.__RD[n] || 0) + 1; return g.apply(this, arguments); }; const w = o.where; if (w) o.where = function () { return tag(w.apply(this, arguments)); }; return o; }; return tag(q); }; S._gpActs = null; });
  await p.evaluate((fid) => openBkfold(fid), ids.fid);
  const rows = await until(() => { const L = [...document.querySelectorAll('#bkf_scr [data-gperf][data-gpwin]')]; return L.length >= 3 && document.getElementById('bkf_gperf') ? L.map((b) => b.dataset.gperf) : null; }, 200);
  ok(rows && ['gpA', 'gpB', 'gpE'].every((g) => rows.includes(g)), '관제소 그룹 줄마다 「📊 이 그룹 성과」(data-gperf)', rows || await p.evaluate(() => ({ d: S.detail, f: S.bkfold && Object.keys(S.bkfold.folds || {}), b: (S.prBatches || []).map((x) => x.id), t: (document.getElementById('bkf_scr') || {}).innerText })));
  /* ⓐ 이 그룹 성과 → 안쪽 창 */
  await p.locator('#bkf_scr [data-gperf="gpA"][data-gpwin]').first().click();
  const w1 = await until(() => { const ov = document.getElementById('gpw_ov'); const c = ov && ov.querySelector('#gpw_c'); if (!c || !/판매율/.test(c.textContent)) return null; return { t: ov.querySelector('#gpw_t').textContent, sheet: !!document.querySelector('#sheet.on') && !!(S.detail && S.detail.gperf), ctrl: !!(S.detail && S.detail.bkfold), txt: c.innerText.replace(/\s+/g, ' ').slice(0, 600), cards: [...c.querySelectorAll('.card')].map((x) => x.innerText.replace(/\s+/g, ' ')) }; }, 80);
  ok(w1 && /📊 그룹 성과 — 성과 그룹 가/.test(w1.t) && !w1.sheet && w1.ctrl, '누르면 안쪽 창에 그 그룹 성과(시트로 넘어가지 않고 관제소 그대로)', w1 && { t: w1.t, sheet: w1.sheet, ctrl: w1.ctrl });
  /* 목록 고르기 — 창 안에서 · 시트 선택은 안 건드림 */
  const opt0 = await p.evaluate(() => JSON.stringify(S.gpOpt || null));
  await p.locator('#gpw_c [data-gpl="left"]').click(); const tg = await until(() => { const b = document.querySelector('#gpw_c [data-gpl="left"]'); return b && b.classList.contains('on') ? { opt: JSON.stringify(S.gpOpt || null), ov: !!document.getElementById('gpw_ov') } : null; }, 60);
  ok(tg && tg.ov && tg.opt === opt0, '창 안 「아직 안 팔린 것」 바꾸기는 창 안에서 · 시트 선택값은 그대로', { tg, opt0 });
  await p.keyboard.press('Escape'); await W(p, 200);
  const e1 = await p.evaluate(() => ({ ov: !!document.getElementById('gpw_ov'), ctrl: !!(S.detail && S.detail.bkfold), st: S._gpw }));
  ok(!e1.ov && e1.ctrl && !e1.st, 'Esc = 안쪽 창만 닫힘(관제소는 그대로)', e1);
  /* ⓑ 시트와 같은 내용 */
  await p.evaluate(() => { history.pushState({ x: 1 }, ''); openGroupPerf('gpA'); });
  const sh = await until(() => { const s = document.querySelector('#sheet'); if (!(S.detail && S.detail.gperf === 'gpA') || !s || !/판매율/.test(s.textContent)) return null; return { head: (s.querySelector('.sh .t') || {}).textContent, back: !!s.querySelector('#back'), cards: [...s.querySelectorAll('.card')].map((x) => x.innerText.replace(/\s+/g, ' ')) }; }, 80);
  ok(sh && /📊 그룹 성과 — 성과 그룹 가/.test(sh.head) && sh.back, '시트 📊 그룹 성과는 예전 머리(← 닫기 · 제목) 그대로', sh && sh.head);
  const a1 = (w1 && w1.cards) || [], a2 = (sh && sh.cards) || []; const nz = (x) => x.replace(/◐\uFE0F?\s*/g, '').replace(/\d+분|\d+초/g, '').trim(); /* 시트 카드는 접기 단추(◐)가 붙음 */ const same = a1.length === a2.length && a1.every((c, i) => nz(c) === nz(a2[i]));
  ok(same && a1.length >= 3, `안쪽 창 내용 = 시트 내용(카드 ${a1.length}개 같음)`, a1.map((x, i) => { const y = a2[i] || ''; const A = nz(x), B = nz(y); let k = 0; while (k < A.length && A[k] === B[k]) k++; return A === B ? '=' : [k, A.slice(k - 10, k + 40), B.slice(k - 10, k + 40)]; }));
  const nums = await p.evaluate(async () => { const R = await gpCompute('gpA'); const M = gpSummary(R); return { n: M.n, sold: M.sold, rev: M.rev }; });
  ok(nums.n === 3 && nums.sold === 2 && nums.rev === 10800, '그룹 가 셈 그대로(바꾼 3 · 팔림 2 · 매출 10,800원)', nums);
  await p.evaluate(() => history.back()); await until(() => !(S.detail && S.detail.gperf), 40);
  await until(() => !!(S.detail && S.detail.bkfold) || null, 20); await p.evaluate((fid) => { if (!(S.detail && S.detail.bkfold)) openBkfold(fid); }, ids.fid);
  await until(() => !!document.getElementById('bkf_gperf'), 60);
  /* 자리 — bkftop1 맨 위 줄(#bkf_top · ← 닫기 줄) 안 · 그 줄 단추(data-bkftool) 셈에는 안 듦 · 묶음 머리 카드에는 없음 */
  const pos = await p.evaluate(() => { const b = document.getElementById('bkf_gperf'); return { inTop: !!(b && b.closest('#bkf_top')), tool: !!(b && b.dataset.bkftool), inHead: !!document.querySelector('.bkf-head #bkf_gperf'), n: document.querySelectorAll('#bkf_gperf').length }; });
  ok(pos.inTop && !pos.tool && !pos.inHead && pos.n === 1, '「📊 묶음 성과」는 맨 위 줄(← 닫기 줄)에 하나', pos);
  /* ⓒ 묶음 성과 — 읽기 셈 */
  await p.evaluate(() => { window.__RD = {}; S._gpActs = null; });
  await p.locator('#bkf_gperf').click();
  const fw = await until(() => { const ov = document.getElementById('gpw_ov'); const c = ov && ov.querySelector('#gpw_c'); if (!c || !c.querySelector('.gpw-t')) return null; const cell = (lb) => { const m = [...c.querySelectorAll('.mgrid > *')].find((x) => x.textContent.includes(lb)); return m ? m.innerText.replace(/\s+/g, ' ') : null; };
    return { t: ov.querySelector('#gpw_t').textContent, rows: [...c.querySelectorAll('tr[data-gpwg]')].map((r) => r.dataset.gpwg), rev: cell('묶음 매출'), rate: cell('판매율'), multi: cell('여러 그룹에 든 상품'), hint: c.querySelector('p.hint').textContent, chart: !!c.querySelector('svg'), rd: { ...window.__RD } }; }, 100);
  ok(fw && /📊 묶음 성과 — 성과 시험 묶음/.test(fw.t) && fw.chart, '「📊 묶음 성과」 = 안쪽 창 · 요약 칸 · 누적 그림 · 그룹 표', fw && fw.t);
  ok(fw && fw.rows.join() === 'gpA,gpB,gpE', '그룹 표 = 묶음의 그룹 셋(기록 없는 그룹도 줄로)', fw && fw.rows);
  ok(fw && /17,300/.test(fw.rev) && /60\.0%/.test(fw.rate) && /^\s*1\b/.test(fw.multi), '겹친 상품은 한 번만 — 바꾼 5개 중 3개 팔림(60%) · 매출 17,300원 · 여러 그룹에 든 상품 1', fw && { rev: fw.rev, rate: fw.rate, multi: fw.multi });
  ok(fw && /겹침 1번 뺌/.test(fw.hint), '겹침 수를 알림', fw && fw.hint);
  ok(fw && fw.rd.shp_orders === 1 && fw.rd.prd_price_actions === 3, '판매(실시간 주문)는 한 번만 읽음 · 반영 기록은 그룹마다 한 번', fw && fw.rd);
  /* 표 줄 → 그 그룹 · ← 묶음 성과 */
  await p.locator('#gpw_c tr[data-gpwg="gpB"]').click();
  const gB = await until(() => { const ov = document.getElementById('gpw_ov'); const c = ov && ov.querySelector('#gpw_c'); if (!c || !/판매율/.test(c.textContent) || !/성과 그룹 나/.test(ov.querySelector('#gpw_t').textContent)) return null; return { n: document.querySelectorAll('#gpw_ov').length, back: !!c.querySelector('[data-gpwback]'), rd: { ...window.__RD } }; }, 80);
  ok(gB && gB.n === 1 && gB.back, '표 줄을 누르면 같은 창이 그 그룹으로 바뀜 · 「← 묶음 성과」', gB);
  ok(gB && gB.rd.prd_price_actions === 3, '그룹으로 가도 반영 기록은 다시 안 읽음(30분 기억)', gB && gB.rd);
  await p.locator('#gpw_c [data-gpwback]').click();
  const bk = await until(() => { const c = document.querySelector('#gpw_c'); return c && c.querySelector('.gpw-t') && /묶음 성과/.test(document.querySelector('#gpw_t').textContent) ? { rd: { ...window.__RD } } : null; }, 80);
  ok(bk && bk.rd.prd_price_actions === 3, '「← 묶음 성과」로 돌아옴(반영 기록 다시 안 읽음)', bk);
  /* 창 안 그룹 → 기록 없는 그룹 */
  await p.locator('#gpw_c tr[data-gpwg="gpE"]').click();
  const em = await until(() => { const c = document.querySelector('#gpw_c'); return c && /가격을 바꾼 기록이 아직 없습니다/.test(c.textContent) ? c.textContent.slice(0, 120) : null; }, 60);
  ok(!!em, '기록 없는 그룹 = 예전 빈 글', em);
  await p.locator('#gpw_ov .bigask-x').click(); await W(p, 150);
  ok(!(await p.evaluate(() => !!document.getElementById('gpw_ov'))), '✕ = 닫힘');
  /* ⓓ 빈 묶음 */
  await p.evaluate((f) => gpwOpen({ fid: f }), ids.efid);
  const ef = await until(() => { const c = document.querySelector('#gpw_c'); return c && /담긴 그룹이 없습니다/.test(c.textContent) ? true : null; }, 40);
  ok(!!ef, '빈 묶음 = 「담긴 그룹이 없습니다」');
  await p.evaluate(() => gpwClose());
  /* ⓔ 380px */
  await p.setViewportSize({ width: 380, height: 800 }); await W(p, 400);
  const v1 = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, w: innerWidth, top: (() => { const b = document.getElementById('bkf_gperf'); const r = b && b.getBoundingClientRect(); return r ? Math.round(r.right) : null; })() }));
  ok(v1.doc <= v1.w + 2 && v1.top != null && v1.top <= v1.w, '380px 관제소 가로 넘침 없음 · 「📊 묶음 성과」가 화면 안', v1);
  await p.locator('#bkf_gperf').click(); await until(() => !!document.querySelector('#gpw_c .gpw-t'), 80);
  const v2 = await p.evaluate(() => { const b = document.querySelector('#gpw_ov .bigask'); return { doc: document.documentElement.scrollWidth, w: innerWidth, box: b.scrollWidth - b.clientWidth, right: Math.round(b.getBoundingClientRect().right) }; });
  ok(v2.doc <= v2.w + 2 && v2.box <= 2 && v2.right <= v2.w, '380px 안쪽 창 가로 넘침 없음(표는 자기 칸 안에서 밀림)', v2);
  await p.evaluate(() => gpwClose()); await p.setViewportSize({ width: 1400, height: 900 });
  /* ⓕ (정범님 I-1119-2213-36) 그룹 이름 옆 ↗ — 진짜 그룹 화면으로(안쪽 창 아님) · fold 넘김 · 다시 그린 뒤에도 · 이름 누름과 함께 안 일어남 */
  await p.evaluate((fid) => { if (!(S.detail && S.detail.bkfold)) openBkfold(fid); window.__OBG = []; window.__obg0 = window.openBatchGroup; window.openBatchGroup = (g, o) => { window.__OBG.push({ g, fold: o && o.fold }); }; }, ids.fid);
  const ic = await until(() => { const L = [...document.querySelectorAll('#bkf_tb [data-bkfgi]')]; return L.length >= 3 ? L.map((b) => ({ g: b.dataset.bkfgi, t: b.title, in: !!b.closest('.bkf-tbn'), vis: b.getBoundingClientRect().width > 0 })) : null; }, 200);
  ok(ic && ['gpA', 'gpB', 'gpE'].every((g) => ic.some((x) => x.g === g && x.in && x.vis)) && ic.every((x) => / — 그룹 화면으로 가기$/.test(x.t)), '📊 그룹 상태판 그룹 이름 옆 ↗(제목 「… — 그룹 화면으로 가기」)', ic);
  const goT = async (sel, g) => { await p.evaluate(() => { window.__OBG = []; }); await p.locator(sel).first().click(); await W(p, 250); const r = await p.evaluate(() => ({ obg: window.__OBG.slice(), ctrl: !!document.getElementById('bkf_ctrl'), gsw: !!document.getElementById('gsw_ov'), gpw: !!document.getElementById('gpw_ov') }));
    /* 가짜 openBatchGroup은 화면을 안 그림 — pushState가 관제소를 뒤로 가기 자리로 떼어 두었으므로 뒤로 가서 되살림 */ await p.evaluate(() => history.back()); if (!(await until(() => document.querySelectorAll('#bkf_tb [data-bkfgi]').length >= 3 || null, 60))) await p.evaluate((fid) => openBkfold(fid), ids.fid); await until(() => document.querySelectorAll('#bkf_tb [data-bkfgi]').length >= 3 || null, 120); return r; };
  const g1 = await goT('#bkf_tb [data-bkfgi="gpB"]');
  ok(g1.obg.length === 1 && g1.obg[0].g === 'gpB' && g1.obg[0].fold === ids.fid && !g1.ctrl, '상태판 ↗ = openBatchGroup(그룹, { fold: 묶음 }) 한 번 · 거른 관제창은 안 열림', g1);
  await p.evaluate((fid) => { const el = document.getElementById('bkf_tb'); el.innerHTML = ''; S._bkfTb = null; bkfTbPaint(fid); }, ids.fid);
  await until(() => document.querySelectorAll('#bkf_tb [data-bkfgi]').length >= 3, 120);
  const g2 = await goT('#bkf_tb [data-bkfgi="gpA"]');
  ok(g2.obg.length === 1 && g2.obg[0].g === 'gpA' && g2.obg[0].fold === ids.fid && !g2.ctrl, '상태판을 다시 그린 뒤에도 ↗ 동작(위임)', g2);
  await p.locator('#bkf_tb [data-bkfcg="gpA"] .bkf-tbnt').first().click(); await W(p, 300);
  const nm = await p.evaluate(() => ({ ctrl: !!document.getElementById('bkf_ctrl'), obg: window.__OBG.length })); ok(nm.ctrl && nm.obg === 1, '이름을 누르면 예전처럼 거른 🗼 관제창(↗와 따로)', nm);
  await p.evaluate(() => { if (typeof ctrlClose === 'function') ctrlClose(); });
  const hasK = await until(() => document.querySelectorAll('#bkf_ctl tr[data-gsw] [data-bkfgi]').length >= 3 || null, 100);
  ok(!!hasK, '🛰 감시 · 🎯 전략 표 그룹 줄에도 ↗');
  if (hasK) { const g3 = await goT('#bkf_ctl tr[data-gsw="gpB"] [data-bkfgi]'); ok(g3.obg.length === 1 && g3.obg[0].g === 'gpB' && g3.obg[0].fold === ids.fid && !g3.gsw, '감시 표 ↗ = 그룹 화면 · 🎚 전략 창은 안 열림', g3); }
  await p.locator('#bkf_gperf').click(); await until(() => !!document.querySelector('#gpw_c tr[data-gpwg] [data-bkfgi]'), 80);
  const g4 = await goT('#gpw_c tr[data-gpwg="gpA"] [data-bkfgi]');
  ok(g4.obg.length === 1 && g4.obg[0].g === 'gpA' && g4.obg[0].fold === ids.fid && !g4.gpw, '📊 묶음 성과 표 ↗ = 창을 닫고 그룹 화면(fold 넘김)', g4);
  await p.setViewportSize({ width: 380, height: 800 }); await W(p, 400);
  const m1 = await p.evaluate(() => { const b = document.querySelector('#bkf_tb [data-bkfgi]'); const r = b && b.getBoundingClientRect(); const c = document.querySelector('#bkf_ctl [data-bkfgi]'); const rc = c && c.getBoundingClientRect(); return { a: r ? [Math.round(r.width), Math.round(r.right)] : null, c: rc ? [Math.round(rc.width), Math.round(rc.right)] : null, w: innerWidth, doc: document.documentElement.scrollWidth }; });
  ok(m1.a && m1.a[0] > 0 && m1.a[1] <= m1.w && m1.c && m1.c[0] > 0 && m1.c[1] <= m1.w && m1.doc <= m1.w + 2, '휴대폰(380px) 카드 모양에서도 ↗가 보임 · 가로 넘침 없음', m1);
  await p.setViewportSize({ width: 1400, height: 900 });
  /* 이 화면이 다루는 칸(그룹·묶음(prd_price_batches · _bkfold 포함)·그룹 기록·주문 명령 + 성과 창이 읽은 컬렉션)에 쓰기가 0인지 봄.
     웹앱 바탕 일(구매 정보 채우기·알림 요약·가격 점검·속도 기록)은 시험 중 때때로 저절로 쓰므로(app_settings/purchase·app_summary/alerts·prd_system/*·perf_logs/* 등) 셈 밖 ·
     prd_price_batches/b_chk…는 가격 점검이 쓰는 점검용 묶음이라 뺌 · 이번 고침과 무관 */
  const fwq = await p.evaluate(() => ({ w: (window.__FSW || []).map((x) => x.n + '/' + x.id), rd: Object.keys(window.__RD || {}) }));
  const TOUCH = new Set(['prd_price_batches', 'prd_price_actions', 'shp_cmds', ...fwq.rd.filter((n) => n !== 'perf_logs')]);
  const fsw = fwq.w.filter((k) => TOUCH.has(k.split('/')[0]) && !k.startsWith('prd_price_batches/b_chk'));
  ok(fsw.length === 0, 'Firestore 쓰기 0(이 화면이 다루는 칸 · 읽기만)', { 막힌쓰기: fsw, 바탕일쓰기: fwq.w.filter((k) => !fsw.includes(k)) });
  /* 진짜로 가 봄 — 그룹 화면 · ◀ 묶음 길잡이(S.bkfFrom) · 여기부터는 예전 그룹 화면이 하던 일(열면 계산·기록)이라 쓰기 셈 밖 */
  await p.evaluate(() => { window.openBatchGroup = window.__obg0; });
  await p.locator('#bkf_tb [data-bkfgi="gpA"]').first().click();
  const rl = await until((fid) => S.detail && S.detail.batch && S.bkfFrom && S.bkfFrom.fid === fid ? { from: S.bkfFrom, ctrl: !!document.getElementById('bkf_ctrl') } : null, 100, ids.fid);
  ok(rl && rl.from.gid === 'gpA' && !rl.ctrl, '↗ = 진짜 그룹 화면(수동 일괄) · 묶음 길잡이 살아 있음', rl);
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 없음', dlg);
  console.log(bad ? `❌ tGPERF1 ${bad}개 실패` : '✓ tGPERF1 통과'); return bad; });
