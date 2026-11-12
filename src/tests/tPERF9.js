/* tPERF9 — 11/12 perf9 '웹앱이 다시 무거워짐' 고침 시험 (웹앱 · Playwright · 빌드 폴더 pw에서 RN_PORT로)
 *  ① 🪶 새 판 모아 바꾸기: 연 지 정한 분 안이면 새 판으로 다시 열지 않음 · 0분이면 예전처럼 · 화면을 쓰는 중이면 2분 기다림
 *  ② 시장 지표 줄 글자 함께 쓰기 건너뜀(siWalkM): 숫자 사본을 풀면 원본 줄과 값이 같음 · 기기 보관 없으면 예전처럼
 *  ③ 켜기 무게 재기(kind 'boot'): 모든 기록 받기 뒤 단계별 숫자 한 번 기록
 *  ④ 공유 홈 요약: 다른 기기가 3분 안에 썼으면 바뀜 신호로는 다시 세지 않음 · 3분 넘으면 셈
 *  ⑤ 🪶 웹앱 무게 칸: 판마다 기준선·🔺 나빠진 판·까닭 후보 · ⚙ 설정 칸이 그려짐
 * 실행: RN_PORT=<시험 서버> node tPERF9.js (harness.js와 같은 폴더) */
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
(async () => {
  const HP = path.join(__dirname, 'harness.js');
  if (!fs.existsSync(HP) || !process.env.RN_PORT) { console.log('… 웹앱 시험은 빌드 폴더 pw에서 RN_PORT로(건너뜀)'); process.exit(0); }
  await require(HP)(async (p) => {
    let nav = 0; p.on('framenavigated', (f) => { if (f === p.mainFrame()) nav++; });
    // ①
    const r1 = await p.evaluate(() => { const T0 = performance.timeOrigin; const now = T0 + 10 * 60000; localStorage.removeItem('rn-upd-gap'); const a = updHoldWhy(now); localStorage.setItem('rn-upd-gap', '0'); const b = updHoldWhy(now); localStorage.setItem('rn-upd-gap', '5'); window.__rnAct = now - 30000; const c = updHoldWhy(now); window.__rnAct = now - 200000; const d = updHoldWhy(now); localStorage.removeItem('rn-upd-gap'); return { a, b, c, d, def: updGapMin() }; });
    ok(r1.def === 45 && /연 지 10분/.test(r1.a) && /45분/.test(r1.a), '① 기본 45분 — 연 지 10분이면 기다림: ' + r1.a);
    ok(r1.b === '', '① 0분이면 기다리지 않음(예전처럼)');
    ok(/화면을 쓰는 중/.test(r1.c), '① 정한 분이 지나도 화면이 보이고 30초 전에 손댔으면 2분 기다림');
    ok(r1.d === '', '① 2분 넘게 손을 안 댔으면 바꿈');
    const n0 = nav; await p.evaluate(() => { window.__rnAct = 0; autoUpdate('9.99.991'); }); await p.waitForTimeout(6000);
    const bar = await p.evaluate(() => (document.querySelector('.verbar.new') || {}).textContent || '');
    ok(nav === n0 && /모아|한 번에/.test(bar), '① 새 판이 와도 연 지 45분 안이면 다시 열지 않고 띠에 까닭: ' + bar.slice(0, 90));
    // ②
    const r2 = await p.evaluate(async () => { await IDB.readyP; const rows = []; for (let k = 0; k < 12; k++) rows.push({ listingId: String(500000000 + k), usedCode: 'U' + k, grade: ['최상', '상', '중'][k % 3], price: 2000 + k * 100, ship: [0, 2500][k % 2], halfShip: null, sellerCode: String(3000 + (k % 4)), sellerName: '판매자' + (k % 4), sellerBadge: k % 4 ? null : '전문셀러', soldOut: k === 5 });
      const doc = { id: 'bkT', isbn13: '9788900000001', usedFirstPage: JSON.parse(JSON.stringify(rows)), relationBuy: [{ itemId: '77', title: '함께' }], usedTotal: 30, salesPoint: 10, lastCheckedAt: '2026-11-12T00:00:00Z' };
      const o = slimDoc('pmetrics', doc); const m = pmMem(o); const dec = pmDec(m); const same = rows.every((r, i) => ['grade', 'listingId', 'price', 'sellerBadge', 'sellerCode', 'sellerName', 'ship', 'soldOut'].every((k) => String(r[k] ?? '') === String(dec[i][k] ?? '')));
      const sz0 = _SI.size; const db0 = IDB.db; IDB.db = null; const o2 = slimDoc('pmetrics', { id: 'bkU', usedFirstPage: [{ sellerName: '고유판매자이름XYZ', sellerCode: '9', grade: '상', price: 1 }] }); IDB.db = db0; const interned = _SI.has('고유판매자이름XYZ');
      return { same, p1: !!m._p1, n: dec.length, interned, sz0 }; });
    ok(r2.same && r2.p1 && r2.n === 12, '② 기기 보관이 있으면 줄은 숫자 묶음 · 풀면 원본 줄과 값이 같음(12줄)');
    ok(r2.interned, '② 기기 보관이 없는 기기는 예전처럼 줄 글자까지 함께 씀');
    // ③
    const r3 = await p.evaluate(async () => { S._bootSent = 0; localStorage.removeItem('rn-bootlog'); const B = bootMeasure.begin(); bootMeasure.step(B, '상품·도서'); await new Promise((r) => setTimeout(r, 350)); bootMeasure.step(B, '시장 지표'); await new Promise((r) => setTimeout(r, 350)); rdAdd('prd_listings', 5); bootMeasure.end(B, []); await new Promise((r) => setTimeout(r, 300)); const L = Object.values((window.__FS && window.__FS.perf_logs) || {}).filter((x) => x.kind === 'boot'); return { rec: S._bootRec, n: L.length }; });
    ok(r3.rec && r3.rec.kind === 'boot' && Array.isArray(r3.rec.steps) && r3.rec.steps.length === 2 && r3.rec.steps[0][0] === '상품·도서' && r3.rec.dlMs >= 600 && r3.rec.rd.prd_listings >= 5 && r3.rec.lt && 'f2n' in r3.rec.lt, '③ 받기 단계마다 [이름·ms·힙 시작·끝·최고·긴 작업 수·합] + 받은 문서 수 + 연 뒤 2분 긴 작업: ' + JSON.stringify(r3.rec && r3.rec.steps));
    ok(r3.n >= 1, '③ perf_logs에 kind boot 한 번 씀');
    const r3b = await p.evaluate(async () => { const B = bootMeasure.begin(); bootMeasure.end(B, []); await new Promise((r) => setTimeout(r, 200)); return Object.values(window.__FS.perf_logs || {}).filter((x) => x.kind === 'boot').length; });
    ok(r3b === r3.n, '③ 한 탭에서 두 번 쓰지 않음');
    // ④
    const r4 = await p.evaluate(async () => { const W0 = (window.__FSW || []).length; S._allLoaded = true; S._hsBusy = false; S._hsSkipN = 0; S.homeSum = { dev: '다른PC', at: new Date(Date.now() - 60000).toISOString(), w: {} }; await homeSumWrite(); const skip = S._hsSkipN; S.homeSum = { dev: '다른PC', at: new Date(Date.now() - 200000).toISOString(), w: {} }; S._hsBusy = false; const t = performance.now(); await homeSumWrite(); return { skip, skip2: S._hsSkipN, ms: performance.now() - t }; });
    ok(r4.skip === 1, '④ 다른 기기가 1분 전에 쓴 공유 홈 요약 — 바뀜 신호로는 다시 세지 않음');
    ok(r4.skip2 === 1, '④ 3분 넘게 지났으면 이 기기가 셈(건너뜀 그대로 1번)');
    // ⑤
    const r5 = await p.evaluate(() => { const v = (n) => '9.0.' + n; const L = []; for (let i = 1; i <= 7; i++) { for (let k = 0; k < 3; k++) L.push({ ver: v(i), dev: 'PC' + k, at: '2026-11-12T0' + i + ':00:00Z', home: i === 7 ? 9000 : 6000 }); L.push({ kind: 'mem', ver: v(i), dev: 'PC1', heapDlMax: i === 7 ? 2900 : 2000, heapIdle: 700 }); for (let k = 0; k < (i === 7 ? 12 : 3); k++) L.push({ kind: 'lt', ver: v(i), ms: 900, upMin: 1 }); L.push({ kind: 'boot', ver: v(i), dlMs: 20000, heapMax: 2000, rd: { a: 100 }, dom: 3000, steps: [['상품·도서', 4000, 300, 800, 900, 3, 2000]] }); L.push({ ver: v(i), phone: true, home: 99999 }); }
      const V = wgAgg(L); const last = V[V.length - 1]; return { n: V.length, worse: last.worse, open: last.open, base: last.base.open, first: V[0].worse.length, st: last.steps[0] }; });
    ok(r5.n === 7 && r5.open === 9 && r5.base === 6, '⑤ 판마다 열기→홈 가운데 값과 기준선(앞 판 5개) · 휴대폰 기록은 뺌');
    ok(r5.worse.includes('열기→홈') && r5.worse.includes('받는 중 힙') && r5.worse.includes('긴 멈춤') && r5.first === 0, '⑤ 나빠진 칸만 🔺: ' + r5.worse.join('·'));
    ok(r5.st && r5.st[0] === '상품·도서' && r5.st[2] === 600, '⑤ 받기 단계별 힙 오름(+600MB)');
    await p.evaluate(() => { S._userAt = Date.now(); featGo({ go: { tab: 'settings', sec: 'set_weigh' } }); }); await p.waitForTimeout(2500);
    const r6 = await p.evaluate(() => { const b = document.getElementById('wg_box'); return b ? b.innerText.slice(0, 400) : ''; });
    ok(/새 판 모아 바꾸기/.test(r6) && /(판|기록 읽는 중|못 읽음)/.test(r6), '⑤ ⚙ 설정 › 🪶 웹앱 무게 칸이 그려짐: ' + r6.replace(/\s+/g, ' ').slice(0, 120));
    await p.evaluate(() => { document.getElementById('wg_gap').value = '30'; document.getElementById('wg_gap_save').click(); }); await p.waitForTimeout(300);
    ok(await p.evaluate(() => localStorage.getItem('rn-upd-gap') === '30' && updGapMin() === 30), '⑤ 칸에서 분을 바꾸면 이 기기에 저장(30분)');
    ok(await p.evaluate(() => typeof NAV_HUB !== 'undefined' && NAV_HUB.research[0][1].includes('weigh')), '⑤ 🔬 연구 › 🔬 연구 모음에 🪶 웹앱 무게 카드');
  }, { noFriend: true });
  console.log(bad ? `❌ tPERF9 실패 ${bad}개` : '✓ tPERF9 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ tPERF9 오류: ' + (e && e.stack || e)); process.exit(1); });
