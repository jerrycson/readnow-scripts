// tRV31113 — (11/13 rv3) 통합 솔루션·우리숍 다음 단계 — 상품 관리
//   ① 순수 셈: omniRecon 🟩 네이버(실물 없음·관리코드 짝 없음·관리코드 없음·합계 · 네이버에서 팔렸는데 알라딘 판매중 · 같은 SKU는 예스24 먼저 · 예전 예스24 결과 그대로)
//        · bqVisAudit 🧺 우리숍 진열 점검(알라딘 판매중 → 우리숍에 보임 · 빠진 까닭 미끼·19금·값 없음·제목 없음 · 주문 중)
//   ② 화면(harness): 🧾 통합 장부 › 🛠 처리할 일 › 🔍 재고 맞추기에 네이버 줄 · 🟩 판매중지 맡기기 한 번 = 0건 · 두 번 = 맡긴 일 1건(src recon)
//        · 네이버에서 팔린 알라딘 줄 이름 · ⚙ 🛍 우리숍 화면 🧺 진열 점검 카드 숫자 · 목록 보기 · 브라우저 창 0
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tRV31113.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + cut('/* ◆shop 시작', '/* ◆shop 끝 */') + '\nreturn { omniRecon, bqVisAudit, BQ_VIS_OUT };')();
console.log('① 순수 셈');
{ const al = [{ id: 'a1', st: '판매중', live: true, skus: ['K1'], qty: 1, title: '살아 있는 책' }, { id: 'a2', st: '판매완료', live: false, skus: ['K2'] }, { id: 'a3', st: '판매중지', live: false, skus: ['K3'] },
    { id: 'a4', st: '판매중', live: true, skus: ['K4'], qty: 1, title: '네이버에서 팔린 책', reg: '2026-10-01T00:00:00Z' }, { id: 'a5', st: '판매중', live: true, skus: ['K5'], qty: 1, title: '둘 다 팔았다는 책', reg: '2026-10-01T00:00:00Z' },
    { id: 'a6', st: '판매중', live: true, skus: ['K6'], qty: 1, title: '팔린 뒤 다시 올림', reg: '2026-11-12T00:00:00Z' }];
  const nv = [{ no: 'N1', origin: 'O1', sku: 'K1', live: true, qty: 1, title: '네이버 1' }, { no: 'N2', origin: 'O2', sku: 'K2', live: true, qty: 1, title: '나간 책' }, { no: 'N3', origin: 'O3', sku: 'K3', live: true, qty: 1 },
    { no: 'N9', origin: 'O9', sku: 'K9', live: true, qty: 1 }, { no: 'N0', origin: 'O0', sku: '', live: true, qty: 1 }, { no: 'N8', origin: 'O8', sku: 'K2', live: false, qty: 0 }];
  const R = F.omniRecon({ al, y24: [], nv, y24sold: [{ sku: 'K5', at: '2026-11-01T00:00:00Z', no: 'Y5', src: 'ord' }], nvsold: [{ sku: 'K4', at: '2026-11-05T00:00:00Z', no: 'NO4' }, { sku: 'K5', at: '2026-11-02T00:00:00Z', no: 'NO5' }, { sku: 'K6', at: '2026-11-05T00:00:00Z', no: 'NO6' }] });
  const nb = R.bad.filter((b) => b.ch === 'naver'); const g = (k) => nb.filter((b) => b.kind === k).map((b) => b.no).join();
  ok(g('gone') === 'N2' && g('nomatch') === 'N9' && g('noself') === 'N0', '네이버: 실물 없음(알라딘 판매완료) N2 · 짝 없음 N9 · 관리코드 없음 N0 — 판매중지(실물 있음) N3·판매 안 함 N8은 어긋남 아님', nb.map((b) => b.no + b.kind));
  const n2 = nb.find((b) => b.no === 'N2'); ok(n2 && n2.to === 0 && n2.origin === 'O2' && n2.self === 'K2' && /네이버 판매중/.test(n2.why), '실물 없음 줄 = 판매중지 할 일(to 0 · 원상품번호·SKU)', n2);
  ok(R.sum.naver && R.sum.naver.live === 5 && R.sum.naver.phys === 2, '네이버 합계(판매중 5줄 · 실물 있음 2 — K1·K3)', R.sum.naver);
  const A = R.bad.filter((b) => b.kind === 'alsold'); const a4 = A.find((b) => b.id === 'a4'), a5 = A.find((b) => b.id === 'a5');
  ok(a4 && a4.from === 'naver' && a4.to === 0 && /^네이버에서 1권 팔림/.test(a4.why) && /NO4/.test(a4.why), '네이버에서 팔렸는데 알라딘 판매중 → 알라딘 판매중지 할 일(from naver)', a4);
  ok(a5 && !a5.from && /^예스24에서/.test(a5.why) && /Y5/.test(a5.why), '같은 SKU를 예스24도 팔았다면 예스24 쪽을 먼저(한 SKU = 한 권 · 예전 글 그대로)', a5);
  ok(!A.find((b) => b.id === 'a6'), '네이버에서 팔린 뒤 다시 올린 상품(등록 > 주문)은 뺌', A.map((b) => b.id));
  const R0 = F.omniRecon({ al, y24: [{ no: '1', self: 'K2', live: true, stock: 1 }] }); ok(!('naver' in R0.sum) && R0.bad.length === 1 && R0.bad[0].ch === 'yes24' && R0.bad[0].kind === 'gone', '네이버 자료가 없으면 예전 결과 모양 그대로(sum.naver 없음)', R0);
  ok(R.bad.map((b) => b.kind).indexOf('gone') === 0, '차례: 실물 없음 먼저', R.bad.map((b) => b.kind)); }
{ const L = [{ id: 'p1', title: '보이는 책', status: '판매중', qty: 1, sku: 'S1', price: 5000 }, { id: 'p2', title: '미끼', status: '판매중', qty: 1, sku: 'DUPES-1', price: 5000 }, { id: 'p3', title: '어른 책', status: '판매중', qty: 1, adult: 1, price: 5000 },
    { id: 'p4', title: '값 없음', status: '판매중', qty: 1, price: 0 }, { id: 'p5', title: '', status: '판매중', qty: 1, price: 3000 }, { id: 'p6', title: '팔림', status: '판매완료', qty: 0, price: 3000 }, { id: 'p7', title: '수량 0', status: '판매중', qty: 0, price: 3000 },
    { id: 'p8', title: '주문 중', status: '판매중', qty: 1, price: 4000 }, { id: 'p9', title: '숨김', status: '판매중', active: false, qty: 1, price: 4000 }];
  const V = F.bqVisAudit(L, new Set(['p8']));
  ok(V.live === 6 && V.shown === 2 && V.held === 1, '알라딘 판매중 6(판매완료·수량 0·숨김 뺌) → 우리숍에 보임 2 · 그중 주문 중 1', V);
  ok(V.out.dupes === 1 && V.out.adult === 1 && V.out.noPrice === 1 && V.out.noTitle === 1 && V.ids.noPrice.join() === 'p4' && V.ids.noTitle.join() === 'p5', '빠진 까닭: 미끼·19금·값 없음·제목 없음(상품 번호 목록)', V);
  ok(F.BQ_VIS_OUT.noPrice[1] === 1 && F.BQ_VIS_OUT.dupes[1] === 0, '고칠 것(값·제목)과 일부러 뺀 것(미끼·19금)을 나눔'); }
{ const src = cut('/* (11/13 rv3) 🧺 진열 점검 카드', '/* ══ (11/12 shop9) 👥 우리숍 손님 계정'); ok(!/\b(alert|confirm|prompt)\s*\(/.test(src) && !/db\.|collection\(/.test(src), '진열 점검 카드 = 읽기만(쓰기·브라우저 창 없음)'); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const P0 = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const live = [...S.plist.values()].filter((x) => aladinLive(x) && !/DUPES/i.test(String(x.sku || '')) && (x.qty == null || +x.qty <= 1)); if (live.length < 2) return { none: 1 };
    live.forEach((x, i) => S.sku.map.set(x.id, { c: ['nv' + String(i).padStart(3, '0')] })); const two = live.filter((x) => (y24SkuSelf(x) || []).length); if (two.length < 2) return { none: 2 };
    const gone = two[0], sold = two[1]; const kg0 = (y24SkuSelf(gone) || [])[0]; gone.status = '판매완료'; gone.qty = 0; sold.registeredAt = '2026-01-01T00:00:00Z';
    const kg = kg0, ks = (y24SkuSelf(sold) || [])[0];
    S._nvDataUn = 1; S.nvl = new Map([['7001', { no: '7001', originNo: '8001', sku: kg, live: true, qty: 1, st: 'SALE', name: '네이버 나간 책' }]]); S.nvlOk = 1;
    S.nvo = new Map([['NV1', { id: 'NV1', at: new Date(Date.now() - 40 * 864e5).toISOString(), sku: ks, qty: 1, amt: 5000, st: 'PAYED' }]]); S.nvoOk = 1;
    S.y24.loaded = true; S.y24o.loaded = true; const y0 = window.y24LinkAll; window.y24LinkAll = () => []; const r = await omniReconRun(true); window.y24LinkAll = y0;
    S._ledView = 'todo'; (S._ledFold = S._ledFold || {}).rc = true; openLedger(); await w(500); document.querySelectorAll('#omni_rc, #omni_rc details').forEach((d) => (d.open = true));
    const sh = document.getElementById('sheet'); const nr = sh.querySelector('[data-omninvrow="7001"]'); const ar = sh.querySelector(`[data-omnialrow="${sold.id}"]`);
    return { kg, ks, sold: sold.id, bad: (r.bad || []).map((b) => b.ch + ':' + b.kind + ':' + (b.no || b.id)), sum: (r.sum || {}).naver || null, nr: nr ? nr.textContent : '', ar: ar ? ar.textContent : '', top: (sh.querySelector('#omni_rc .omni-sum') || {}).textContent || '' }; });
  ok(!P0.none && P0.bad.includes('naver:gone:7001') && /실물 없음 — 네이버 판매중/.test(P0.nr) && /네이버 7001 판매중지 맡기기/.test(P0.nr), '🔍 재고 맞추기 — 알라딘에서 나간 실물이 네이버 판매중 → 🟩 줄 + 맡기기 단추', P0);
  ok(/네이버에서 팔림 — 알라딘 판매중/.test(P0.ar) && /🟩 네이버 판매중/.test(P0.top), '40일 전 네이버 주문 SKU인데 알라딘 판매중 → 「네이버에서 팔림」 줄 · 위 합계에 🟩 네이버', { ar: P0.ar, top: P0.top });
  const nCmd = () => p.evaluate(async () => { const g = await db.collection('col2_naver_cmd').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.led && v.led.src === 'recon') L.push({ st: v.st, job: v.job, led: v.led }); }); return L; });
  await p.evaluate(async () => { const st = { at: new Date().toISOString(), pc: 'LOGGER', nv: { test: { ok: 1 }, write: { on: 1 } } }; await db.collection('col2_naver').doc('state').set(st); nvDocLoad(); NVW.doc = { ...(NVW.doc || {}), state: st }; }); /* 로거 번외 소식 = 살아 있음 · 연결 시험 맞음 · 쓰기 켬(가짜) */
  const c0 = (await nCmd()).length; await p.locator('[data-omninv="7001"]').click(); await p.waitForTimeout(600); const c1 = (await nCmd()).length;
  await p.locator('[data-omninv="7001"]').click(); await p.waitForTimeout(1200); const C = await nCmd();
  ok(c0 === 0 && c1 === 0 && C.length === 1 && C[0].job.originNo === '8001' && C[0].job.to === 'SUSPENSION' && C[0].led.no === '7001', '한 번 = 무장(0건) · 두 번 = 네이버 판매중지 맡긴 일 1건(원상품 8001 · 출처 재고 맞추기)', { c0, c1, C });
  const V = await p.evaluate(async () => { const w = (ms) => new Promise((r) => setTimeout(r, ms)); const L = [...S.plist.values()].filter((x) => aladinLive(x) && !/DUPES/i.test(String(x.sku || '')) && !x.adult); if (L.length < 3) return { none: 1 }; L[2].price = 0;
    const exp = bqVisNow(); openShopAdm(); await w(600); const c = document.querySelector('#bq_vis'); const t = c ? c.textContent : ''; const b = c && c.querySelector('[data-bqvis="noPrice"]'); if (b) { b.click(); await w(500); }
    return { exp: { live: exp.live, shown: exp.shown, np: exp.out.noPrice }, t, btn: !!b, list: (document.getElementById('sheet') || {}).textContent.slice(0, 200) }; });
  ok(!V.none && V.exp.np >= 1 && new RegExp('우리숍에 보임 ' + V.exp.shown.toLocaleString('ko-KR') + '권').test(V.t) && /판매가 없음/.test(V.t) && V.btn, '⚙ 🛍 우리숍 › 🧺 진열 점검 — 판매중·보임·값 없음 숫자 · 목록 보기 단추', V);
  ok(/우리숍에 안 보임/.test(V.list), '목록 보기 → 그 상품 목록(상품 상세로 고침)', V.list);
  ok(!dlg.length, '브라우저 창(alert/confirm/prompt) 0', dlg);
  console.log(bad ? `❌ tRV31113 ${bad}개 실패` : '✓ tRV31113 통과');
});
