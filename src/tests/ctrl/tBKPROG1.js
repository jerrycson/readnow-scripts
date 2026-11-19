// tBKPROG1 — (bkprog1 11/19 · 정범님 I-1119-2155-34 · 조정 I-1119-2158-35) 🛰 관제소 「✅ 모두 확정」 진행바 = 그룹 화면 수동 일괄 진행바와 같은 부품
//  ① 글 검사: 확정 길(bkfRun·bkfExecOne·BKF_OPS·batchExec0)은 main과 글자 하나까지 같음(main에 이 판이 들어가기 전) · 두 화면 모두 bpCalc·bpPanelHtml을 부름
//     · 옛 잠금 줄·「이 기기」 줄은 bpRunLine 한 곳(같은 실행을 두 모양으로 안 보임) · 새 코드에 쓰기·브라우저 팝업 없음
//  ② 화면: 다른 기기가 돌리는 「모두 확정」 → 묶음 화면 실행 한 줄(그룹 k/N · 다른 기기) + 진행 칸(단계 이름 = BP_STG) · 그룹마다 줄 · 실행 고르기
//     · 끝난 뒤 묶음 진행 칸 단계 수 = 그 그룹 화면 진행 칸 단계 수(같은 셈) · 「🔎 카드 보기」 → 관제소 위 안쪽 창에 그 카드 하나만(화면 안 옮김 · 닫으면 관제소로 · pubv1 정범님 I-1119-2332-43) · 그룹 화면 실행 한 줄
//     · 화면을 떠나면 듣기·시계 끊김 · Firestore 쓰기 0 · 380px 가로 넘침 없음 · 브라우저 창 없음
// 실행: 시험 문지기(test-gate)가 pw/ctrl 안에서 RN_PORT=<포트> node ctrl/tBKPROG1.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const firstOf = (c) => c.find((x) => x && fs.existsSync(x)) || null;
const APP = firstOf([process.env.RN_APP, path.resolve(__dirname, '..', '..', 'app.html'), path.resolve(__dirname, '..', '..', '..', 'app.html'), path.resolve(__dirname, '..', '..', '..', 'src', 'app.html')]);
const T = fs.readFileSync(APP, 'utf8'); const cutIn = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + 1); if (i < 0 || j < i) return null; return S.slice(i, j); };
const cut = (a, b) => { const r = cutIn(T, a, b); if (r == null) throw new Error('덩어리 못 찾음: ' + a); return r; };
/* 확정 길 네 곳 — 함수 머리부터 같은 들여쓰기의 다음 선언까지 */
const fnOf = (S, head) => { const i = S.indexOf(head); if (i < 0) return null; const ind = (/^\s*/.exec(head) || [''])[0].replace(/\n/g, ''); const re = new RegExp('\\n' + ind + '(?:async function |function |const |let |/\\* ◆)', 'g'); re.lastIndex = i + head.length; const m = re.exec(S); return S.slice(i, m ? m.index : S.length); };
const HEADS = ['\nasync function bkfRun(', '\nasync function bkfExecOne(', '\nconst BKF_OPS = {', '\n  async function batchExec0('];
console.log('① 글 검사');
{ const now = HEADS.map((h) => fnOf(T, h)); ok(now.every((x) => x && x.length > 200), '확정 길 네 곳을 원본에서 찾음', now.map((x) => (x || '').length));
  const repo = firstOf([process.env.RN_GIT_REPO, path.resolve(__dirname, '..', '..', '..')]); let main = null;
  try { main = cp.execSync('git show origin/main:src/app.html', { cwd: repo, maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) {}
  if (main && !main.includes('/* ◆bkprog 시작')) { const old = HEADS.map((h) => fnOf(main, h)); const diff = HEADS.filter((h, i) => old[i] !== now[i]); ok(!diff.length, '확정 길(bkfRun·bkfExecOne·BKF_OPS·batchExec0)은 main과 글자 하나까지 같음', diff); }
  else console.log('  · main에 이미 이 판이 있음(또는 git 없음) — 확정 길 대조는 판 낼 때 한 번(아래 구조 검사는 늘)');
  ok(now.every((x) => !/\bbkp[A-Z]\w*\(|\bbpRunLine\(|\bbpPanelHtml\(/.test(x || '')), '확정 길 안에서 진행바 부품을 부르지 않음(보기만 덧붙임)');
  const B = cut('/* ◆bkprog 시작', '/* ◆bkprog 끝 */'); const D = cut('function drawBatchRes(', '\nfunction '); const A = cut('function bkfActHtml(fid)', '\nfunction ');
  ok(/bpCalc\(\{/.test(D) && /bpPanelHtml\(BP, /.test(D) && /bpCalc\(\{/.test(B) && /bpPanelHtml\(BP, /.test(B), '그룹 화면(drawBatchRes)과 묶음 화면(bkpFoldHtml)이 같은 셈 bpCalc·같은 그림 bpPanelHtml을 부름');
  ok(/bpProdHtml\(rows, \{[^}]*attr: `data-bkpg=/.test(B) && /bpRunLine\(\{/.test(B), '그룹마다 줄 = 같은 상품마다 보기(bpProdHtml) · 실행 한 줄 = bpRunLine');
  ok(!/data-bkflock|data-bkfme/.test(A) && /bkpFoldHtml\(fid, D, L, me, T\)/.test(A), '묶음 칸(bkfActHtml)에 옛 잠금 줄·이 기기 줄이 따로 없음 — bpRunLine 한 곳');
  ok((T.match(/data-bkflock="live"/g) || []).length === 1 && (T.match(/data-bkflock="dead"/g) || []).length === 1, '실행 한 줄 글(살아 있음·멈춤)은 파일 전체에서 한 곳');
  ok(/bpStripHtml\(\{ ep: EP, run: RUNL \}\)/.test(T), '그룹 화면 「확정 저장 중 n / N」 띠와 실행 한 줄이 한 칸');
  ok(!/(\.doc\([^)]*\)|Ref\([^)]*\)|collection\([^)]*\))\s*\.(set|update|delete|add)\(/.test(B) && !/runTransaction|\.batch\(\)|bkfTx\(|FieldValue/.test(B), '새 진행바 코드에 Firestore 쓰기 없음(문서·모음에 set·update·delete·add 없음 · 장부 고침 bkfTx 안 부름)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(B), '새 코드에 브라우저 팝업 없음');
  ok(/where\('approval\.fold\.run', '==', run\)/.test(B) && /where\('confirmedAt', 'in', part\)/.test(B), '새 읽기 = 그 실행 상품 결정 · 그 실행 확정 때 반영 기록만');
  ok(/bkpUnwatch\(\); \}/.test(cut('function bkfRunUnlisten()', '\nfunction ')), '묶음 화면 듣기를 끊을 때 진행바 듣기도 끊음');
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(B), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKPROG1 ${bad}개 실패` : '✓ tBKPROG1 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
require(firstOf([path.join(__dirname, '..', 'harness.js'), path.join(__dirname, 'harness.js')]))(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require(firstOf([path.join(__dirname, '..', 'seed.js'), path.join(__dirname, 'seed.js')]))); await W(p, 500);
  const until = async (fn, n, arg) => { for (let i = 0; i < (n || 60); i++) { const v = await p.evaluate(fn, arg).catch(() => null); if (v) return v; await W(p, 150); } return null; };
  const fid = await p.evaluate(async () => { try { localStorage.setItem('rn-chk1109', '1'); } catch (e) {} /* 앱이 한 번만 만드는 「확인용 그룹」(chkSeed · 이 판과 무관)이 시험 중에 쓰지 않게 */ if (!S.user) S.user = { email: 't@x', uid: 't' };
    for (let i = 0; i < 6; i++) { const uc = 'U4700000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(507936000 + i), title: '진행 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, sku: 'AAA', registeredAt: '2026-09-0' + (i + 1) + 'T09:00:00', bookId: 'bp' + i }); }
    if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
    for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 9000 + n * 900, pubDate: '2001-03-01' });
      if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: l.price - 300, sellerCode: '1', listingId: '9' + n }, { usedCode: l.usedCode, grade: l.grade, price: l.price, sellerCode: '996008', listingId: l.listingId }], usedTotal: 2, salesPoint: 10, lastCheckedAt: new Date().toISOString() }); }
    S.pmLoaded = true; S.sellersLoaded = true; const now = new Date().toISOString();
    const put = (id, name, c) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, ...c, name }, createdAt: now, lastRunAt: now, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0 });
    await put('gA', '진행 가', { pmin: 7000, pmax: 7600, recentDays: 0 }); await put('gB', '진행 나', { pmin: 7601, pmax: 9000, recentDays: 0 });
    S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gB'); i++) await new Promise((r) => setTimeout(r, 150));
    const a = await bkfTx({ t: 'new', name: '진행 시험' }); await bkfTx({ t: 'put', fid: a.fid, gids: ['gA', 'gB'] });
    /* 다른 기기(PC2)가 「✅ 모두 확정」을 돌리는 중 — 그룹 1/2 끝(진행 가 확정 2개) · 그 전에 한 번 더 돈 실행 하나 */
    const iso = (m) => new Date(Date.now() + m * 60000).toISOString(); const AT = iso(-20);
    await bkfRunRef(a.fid).set({ kind: 'bkfold-run', fid: a.fid, lock: { run: 'rX', op: 'execAll', by: 'other@x', dev: 'PC2', at: iso(-21), beat: iso(0), k: 1, N: 2 },
      runs: { rX: { op: 'execAll', by: 'other@x', dev: 'PC2', at: iso(-21), plan: { gids: ['gA', 'gB'] }, res: { gA: { st: 'ok', n: 2, at: AT } } }, rY: { op: 'execAll', by: 'other@x', dev: 'PC2', at: iso(-180), endAt: iso(-175), plan: { gids: ['gB'] }, res: { gB: { st: 'skip', why: '결정 대기 없음' } } } } });
    const dec = (k, st, x) => db.collection('prd_price_decisions').doc(k).set({ approvalState: st, title: k, approval: { batchId: 'gA', decision: 'batch', at: AT, fold: { fid: a.fid, run: 'rX' }, expectPrice: 7000, price: 6900 }, 'approval.batchId': 'gA', 'approval.fold.run': 'rX', ...(x || {}) });
    await dec('aladin_U470000010', 'done'); await dec('aladin_U470000011', 'done');
    const act = (k, m, verify) => db.collection('prd_price_actions').doc('act_' + k).set({ key: k, batchId: 'gA', confirmedAt: AT, at: iso(m), from: 7250, to: 7150, verify });
    await act('aladin_U470000010', -18, { state: 'ok', seenAt: iso(-10), lagLoSec: 300, lagHiSec: 600, n: 2 }); await act('aladin_U470000011', -17, { state: 'wait', n: 1, lastCheckAt: iso(-5), next: iso(30) });
    /* 듣기·시계 세기 — 진행바가 연 것만(그 실행 결정 · 그 실행 반영 기록 · 그룹 화면의 묶음 장부) */
    window.__SUB = new Map(); let sk = 0; const tag = (lab, u) => { const id = ++sk; window.__SUB.set(id, lab); return () => { window.__SUB.delete(id); return u && u(); }; };
    const wq = (q, lab) => ({ ...q, where: (f, o, v) => wq(q.where(f, o, v), lab + '|' + f), onSnapshot: (...x) => tag(lab, q.onSnapshot(...x)), doc: (id) => { const d = q.doc(id); return { ...d, onSnapshot: (...x) => tag(lab + '/' + id, d.onSnapshot(...x)) }; } });
    const C0 = db.collection.bind(db); db.collection = (n) => wq(C0(n), n);
    window.__IV = new Set(); const SI = window.setInterval.bind(window), CI = window.clearInterval.bind(window); window.setInterval = (...x) => { const id = SI(...x); window.__IV.add(id); return id; }; window.clearInterval = (id) => { window.__IV.delete(id); return CI(id); };
    window.__W0 = (window.__FSW || []).length; return a.fid; });
  /* 시험 자료를 넣은 뒤 앱이 혼자 하는 뒷일(매입 연결 자동 저장 pur_matches 등 — 이 판과 무관)이 끝날 때까지 기다린 뒤 쓰기 세기 시작 */
  { let last = -1, same = 0; for (let i = 0; i < 60 && same < 8; i++) { const n = await p.evaluate(() => (window.__FSW || []).length); same = n === last ? same + 1 : 0; last = n; await W(p, 250); } await p.evaluate(() => { window.__W0 = (window.__FSW || []).length; }); }
  const nW = () => p.evaluate(() => (window.__FSW || []).slice(window.__W0).map((x) => x.n + '/' + x.id));
  /* ⓐ 묶음 화면 — 실행 한 줄 + 진행 칸 */
  await p.evaluate((fid) => openBkfold(fid), fid);
  const A = await until(() => { const a = document.querySelector('#bkf_scr #bkf_act'); return a && a.querySelector('[data-bkpfid] .bprog') && a.querySelectorAll('[data-bkpg]').length === 2 ? 1 : null; }, 80);
  ok(!!A, '「▶ 한꺼번에」 칸 안에 「✅ 모두 확정 진행」 진행 칸 + 그룹마다 줄 두 개');
  const v = await p.evaluate(() => { const a = document.querySelector('#bkf_act'); const L = a.querySelectorAll('[data-bkflock]'); const P = a.querySelector('[data-bkpfid] .bprog');
    return { nLock: L.length, lock: L[0] ? L[0].textContent : '', me: a.querySelectorAll('[data-bkfme]').length, stg: P ? [...P.querySelectorAll('.bpstg > div')].map((d) => d.querySelector('b').textContent) : [], s1: P ? (P.querySelector('.bpstg > div > div') || {}).textContent : '', BP: BP_STG.slice(), sel: [...a.querySelectorAll('[data-bkprun] option')].map((o) => [o.value, o.selected]), g: [...a.querySelectorAll('[data-bkpg] > summary')].map((s) => s.textContent), head: (a.querySelector('[data-bkpfid]') || {}).textContent || '', W: !!S._bkpW && S._bkpW.run }; });
  ok(v.nLock === 1 && v.me === 0 && /⏳ 실행 중 — /.test(v.lock) && /그룹 1\/2/.test(v.lock) && /PC2/.test(v.lock) && /다른 기기/.test(v.lock) && /됨 1 · 건너뜀 0 · 실패 0/.test(v.lock) && /지금 「진행 나」/.test(v.lock), '실행 한 줄 하나 — 그룹 k/N · 누가·어느 기기 · 다른 기기 · 됨·건너뜀·실패 · 지금 그룹(같은 실행을 두 모양으로 안 보임)', v.lock);
  ok(JSON.stringify(v.stg) === JSON.stringify(v.BP) && v.stg.length === 4, '진행 칸 단계 이름 = 그룹 화면과 같은 BP_STG 넷', v.stg);
  ok(/1 \/ 2 \(50%\)/.test(v.s1) && /그룹 · 지금까지 확정 2개/.test(v.s1), '확정 중 ① 단계 = 그룹 i/n · 지금까지 확정 n개', v.s1);
  ok(v.sel.length === 2 && v.sel[0][0] === 'rX' && v.sel[0][1], '실행 고르기 — 최근 「모두 확정」 둘 · 기본 = 가장 최근(다른 기기 실행)', v.sel);
  ok(/^1\. 진행 가/.test(v.g[0] || '') && /됨/.test(v.g[0]) && /상품 2/.test(v.g[0]) && /^2\. 진행 나/.test(v.g[1] || '') && /지금 확정 중/.test(v.g[1]), '그룹마다 줄 — 차례 · 됨/지금 확정 중 · 상품 수', v.g);
  ok(/도는 중/.test(v.head) && /다른 기기/.test(v.head) && v.W === 'rX', '머리 = 도는 중 · 다른 기기 · 그 실행만 들음', v.head.slice(0, 200));
  /* ⓑ 그룹 줄 펼침 — 상품마다 단계 */
  await p.locator('#bkf_act details[data-bkpg="gA"] > summary').click(); await W(p, 300);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#bkf_act details[data-bkpg="gA"] .bprow')].map((r) => r.textContent));
  ok(rows.length === 2 && rows.some((t) => /공개/.test(t)), '그룹 줄을 펼치면 그 그룹 상품마다 단계·상태', rows);
  ok(await p.evaluate(() => S.bkpGOpen && S.bkpGOpen.gA === true), '펼침은 다시 그려도 그대로(기억)');
  /* ⓒ 380px — 가로 넘침 없음 */
  await p.setViewportSize({ width: 380, height: 800 }); await W(p, 400);
  const ov = await p.evaluate(() => { const a = document.querySelector('#bkf_act'); const P = a.querySelector('[data-bkpfid]'); const all = [...a.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)); return { doc: document.documentElement.scrollWidth, a: [a.scrollWidth, a.clientWidth], p: P ? [P.scrollWidth, P.clientWidth] : null, all: all.slice(0, 6) }; });
  ok(ov.doc <= 380 && ov.a[0] <= ov.a[1] + 1 && ov.p && ov.p[0] <= ov.p[1] + 1 && !ov.all.length, '380px 폭에서 가로 넘침 없음', ov);
  await p.setViewportSize({ width: 1400, height: 900 }); await W(p, 300);
  /* ⓓ 다른 실행 고르기 */
  await p.selectOption('#bkf_act [data-bkprun]', 'rY'); const y = await until(() => { const a = document.querySelector('#bkf_act [data-bkpfid]'); return a && S._bkpW && S._bkpW.run === 'rY' && S._bkpW.ready && /확정된 상품이 아직 없습니다/.test(a.textContent) ? a.textContent : null; }, 60);
  ok(!!y && /끝남/.test(y) && /건너뜀 1/.test(y), '옛 실행을 고르면 그 실행 결과(끝남 · 건너뜀)와 그 실행 상품만 — 듣기를 그 실행으로 바꿈', (y || '').slice(0, 200));
  await p.selectOption('#bkf_act [data-bkprun]', 'rX'); await until(() => S._bkpW && S._bkpW.run === 'rX' && S._bkpW.ready && document.querySelector('#bkf_act [data-bkpfid] .bprog'), 60);
  /* ⓔ 실행이 끝남 → 묶음 진행 칸 단계 수 = 그 그룹 화면 진행 칸(같은 셈) */
  await p.evaluate(async (fid) => { const d = (await bkfRunRef(fid).get()).data(); delete d.lock; d.runs.rX.endAt = new Date().toISOString(); d.runs.rX.res.gB = { st: 'skip', why: '결정 대기 없음' }; await bkfRunRef(fid).set(d); window.__W0 = (window.__FSW || []).length; }, fid);
  const fin = await until(() => { const a = document.querySelector('#bkf_act'); return a && !a.querySelector('[data-bkflock]') && a.querySelector('[data-bkpfid] .bprog') && /끝남/.test(a.querySelector('[data-bkpfid]').textContent) ? 1 : null; }, 60);
  const card = (sel) => p.evaluate((sel) => [...document.querySelectorAll(sel + ' .bpstg > div')].map((d) => d.querySelector('b').textContent + ' ' + (d.querySelector(':scope > div') || {}).textContent), sel);
  const SF = await card('#bkf_act [data-bkpfid]');
  ok(fin && SF.length === 4 && /① 확정 2 \/ 2 \(100%\)/.test(SF[0]) && /④ 알라딘 공개 반영 확인 1 \/ 2 \(50%\)/.test(SF[3]), '끝난 실행 — 잠금 줄 사라짐 · 단계 수(① 2/2 · ④ 1/2)', SF);
  const subs = () => p.evaluate(() => [...window.__SUB.values()]);
  const s0 = await subs(); ok(s0.some((x) => /prd_price_decisions\|approval\.fold\.run/.test(x)) && s0.some((x) => /prd_price_actions\|confirmedAt/.test(x)), '묶음 진행바가 그 실행 결정·반영 기록을 듣는 중', s0);
  /* ⓕ 「🔎 카드 보기」 → 관제소 위 안쪽 창(#sheet.bkfwin)에 그 카드 하나만(spw) · ✕로 닫으면 관제소로 · 그다음 그룹 화면 진행 칸 = 같은 수 */
  await p.evaluate(() => { window.__TO = []; const T0 = window.toast; window.toast = (...x) => { window.__TO.push(String(x[0]).slice(0, 120)); return T0(...x); }; window.__FL = []; new MutationObserver((ms) => ms.forEach((m) => { const t = m.target; if (t.classList && t.classList.contains('bq-flash')) window.__FL.push(t.getAttribute('data-mk')); })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
  await p.locator('#bkf_act details[data-bkpg="gA"] [data-bpgo="aladin_U470000010"]').click();
  const spwSt = () => { const b = document.querySelector('.spw .spw-b'); const e = b && b.firstElementChild; const k = e ? e.getAttribute('data-mk') || ((e.querySelector('[data-mk]') || null) && e.querySelector('[data-mk]').getAttribute('data-mk')) : null; return { b: S.batchId, batch: !!(S.detail && S.detail.batch), go: S._bkpGo, win: !!document.querySelector('#sheet.bkfwin'), spw: k, fl: window.__FL, T: S.batchT }; };
  const g = await until((f) => { const st = new Function('return ' + f)()(); return st.batch && st.b === 'gA' && st.win && st.go === null && st.spw === 'aladin_U470000010' ? 1 : null; }, 100, spwSt.toString());
  ok(!!g, '「🔎 카드 보기」 → 관제소 위 안쪽 창에 그 상품 카드 하나만(화면 옮기지 않음)', await p.evaluate((f) => new Function('return ' + f)()(), spwSt.toString()));
  await p.locator('.spw .spw-x').click();
  const gb = await until(() => S.detail && S.detail.bkfold && !S.detail.batch && !document.querySelector('#sheet.bkfwin') && !document.querySelector('.spw') ? 1 : null, 60);
  ok(!!gb, '안쪽 창 ✕ → 바로 관제소로(안쪽 창 모양·카드 창 사라짐)', await p.evaluate(() => ({ d: Object.keys(S.detail || {}), win: !!document.querySelector('#sheet.bkfwin'), spw: !!document.querySelector('.spw') })));
  await p.evaluate((fid) => bkfGoGroup(fid, 'gA'), fid);
  await until(() => S.detail && S.detail.batch && S.batchId === 'gA' && document.querySelector('#b_res .bprog') && !document.querySelector('#sheet.bkfwin') ? 1 : null, 100);
  const SG = await card('#b_res');
  ok(SG.length === 4 && JSON.stringify(SG) === JSON.stringify(SF), '묶음 진행 칸 단계 수 = 그룹 화면 진행 칸 단계 수(같은 셈 bpCalc)', { SF, SG });
  ok(await p.evaluate(() => !!S._bpGL && S._bpGL.gid === 'gA'), '그룹 화면은 이 그룹이 든 묶음 장부 하나만 들음');
  /* 그룹 화면 실행 한 줄 — 다른 기기 실행이 다시 돎(진행 나 차례) */
  await p.evaluate(async (fid) => { const d = (await bkfRunRef(fid).get()).data(); const now = new Date().toISOString(); d.lock = { run: 'rZ', op: 'execAll', by: 'other@x', dev: 'PC2', at: now, beat: now, k: 1, N: 2 }; d.runs.rZ = { op: 'execAll', by: 'other@x', dev: 'PC2', at: now, plan: { gids: ['gB', 'gA'] }, res: { gB: { st: 'ok', n: 0 } } }; await bkfRunRef(fid).set(d); window.__W0 = (window.__FSW || []).length; }, fid);
  const gl = await until(() => { const e = document.querySelector('#b_res [data-bkflock="live"]'); return e ? e.textContent : null; }, 60);
  ok(gl && /그룹 1\/2/.test(gl) && /다른 기기/.test(gl) && /이 그룹이 지금 차례\(2번째\)/.test(gl) && !/멈추기/.test(gl) && (await p.evaluate(() => document.querySelectorAll('#b_res [data-bkflock]').length)) === 1, '그룹 화면 실행 한 줄 — 그룹 i/n · 다른 기기 · 이 그룹 차례 · 멈추기는 묶음 화면에서', gl);
  /* ⓖ 떠나면 듣기·시계 끊김 */
  const tGL = await p.evaluate(() => S._bpGL && S._bpGL.t); await p.evaluate(() => history.back()); await until(() => S.detail && S.detail.bkfold && !S.detail.batch, 60); await W(p, 300);
  ok(await p.evaluate((t) => !S._bpGL && !window.__IV.has(t), tGL), '그룹 화면을 떠나면 묶음 장부 듣기·15초 시계 끊김');
  await until(() => S._bkpW && S._bkpW.ready, 40); const tW = await p.evaluate(() => S._bkpW && S._bkpW.t);
  await p.evaluate(() => history.back()); await until(() => !(S.detail && S.detail.bkfold), 60); await W(p, 400);
  const left = await p.evaluate((t) => ({ W: S._bkpW, iv: window.__IV.has(t), subs: [...window.__SUB.values()].filter((x) => /approval\.fold\.run|confirmedAt|prd_price_batches\/_bkf_/.test(x)) }), tW);
  ok(left.W === null && !left.iv && !left.subs.length, '묶음 화면을 떠나면 그 실행 결정·반영 기록 듣기와 3초 시계 끊김', left);
  /* ⓗ 쓰기 0 · 창 0 */
  /* 앱이 화면과 상관없이 혼자 쓰는 것(이 판 밖 · 이름으로 따로 셈): 대표 탭 사업 알림 요약(1분에 한 번까지) · 매입 연결 자동 저장 (확인용 그룹 chkSeed는 위에서 막음) */
  const BG = /^app_summary\/alerts$|^pur_matches\//;
  const w0 = await nW(); const w = w0.filter((x) => !BG.test(x)); if (w0.length > w.length) console.log('  · 앱 뒷일 쓰기(이 판 밖) ' + (w0.length - w.length) + '건 따로 셈: ' + [...new Set(w0.filter((x) => BG.test(x)).map((x) => x.split('/')[0]))].join('·'));
  ok(!w.length, 'Firestore 쓰기 0 — 진행바·묶음 화면·그룹 화면 이동이 쓴 것 없음(시험이 장부를 바꾼 것·앱 뒷일 말고)', w);
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 없음', dlg);
  console.log(bad ? `❌ tBKPROG1 ${bad}개 실패` : '✓ tBKPROG1 통과');
}).then(() => process.exit(bad ? 1 : 0));
