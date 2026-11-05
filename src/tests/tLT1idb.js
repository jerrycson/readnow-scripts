// tLT1idb — 리더 탭 '기록 창 열림' 5분 칸 긴 작업 13~20초(화면을 막은 스크립트 1위 IDBRequest.onsuccess 최대 10.6~11.0초)의 원인 재현·고친 뒤 확인
//  원인: ⏰ 고객 문의(xx:02·xx:30)·전체주문(xx:00) 뒤 올리기(taskUpload)·점수(taskScore)가
//        이 PC 고객 저장소(IndexedDB 'readnow-crm')를 칸마다 통째로 읽고(getAll) 그 onsuccess 안(약속이 풀린 뒤 이어지는 일)에서
//        올릴 문서 계산(buildDocs 뒷부분 — 문의·구매평·판매자 1.5만 곳·정리 clean)·문서 지문(docHash) 비교를 한 번에 함
//  시험: 실제 크로미움 IndexedDB에 실제 크기 비슷한 자료를 넣고, 수집기 소스에서 그 함수들을 그대로 뽑아 돌려
//        크롬 '긴 화면 그림' 기록(long-animation-frame)으로 한 번 일 최대 시간 · IDBRequest.onsuccess 최대 시간을 잼
//        + 결과(올릴 문서 수·지문)가 고치기 전과 똑같은지
// 실행: cd pw && node tLT1idb.js            (고친 소스만)
//       RN_CPU=6 node tLT1idb.js  (느린 PC 흉내 · CPU 6배 느리게) · RN_ORD=24000 RN_SEL=30000 (자료 4배)
//       RN_COL_OLD=<고치기 전 소스> node tLT1idb.js   (고치기 전/뒤 견줌)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const pick = (...ps) => ps.filter(Boolean).find((p) => fs.existsSync(p));
const COL = pick(process.env.RN_COL, path.join(__dirname, '../readnow-collector.user.js'), path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../../src/readnow-collector.src.js'));
const CORE = pick(path.join(__dirname, '../readnow-orders-core.js'), path.join(__dirname, '../../readnow-orders-core.js'));
// 자료 크기(근거: 수집기 주석의 실측 — crm_orders 5,791건 · crm_interactions 약 7천 건 · 고객 5,120명 · 판매자 1.5만 곳 · 판매자 툴팁 약 10MB)
const N = { orders: +process.env.RN_ORD || 6000, sellers: +process.env.RN_SEL || 15000, qna: 2000, reviews: 4000, returns: 300, exOnly: 2000, sheet: 600 };

function extract(src) { const L = src.split('\n'); const at = (re, from) => { for (let i = from || 0; i < L.length; i++) if (re.test(L[i])) return i; throw new Error('못 찾음 ' + re); };
  const fnFrom = (re, from) => { const s = at(re, from); for (let i = s + 1; i < L.length; i++) if (/^  \}\s*$/.test(L[i])) return L.slice(s, i + 1).join('\n'); throw new Error('끝 못 찾음 ' + re); };
  const db = L.slice(at(/^  const reqP = /), at(/^  const sameRec = /)).join('\n');
  const one = (re) => L[at(re)];
  const helpers = [/^  const docHash = /, /^  const hashStr = /, /^  const clean = /, /^  const uniq = /, /^  const stripUsed = /, /^  const normTitle = /, /^  const numK = /, /^  const selLite = /].map(one).join('\n') + '\n' + L.slice(at(/^  const stableStr = /), at(/^  const stableStr = /) + 2).join('\n');
  const coop = (() => { try { return one(/^  let coopT = /) + '\n' + fnFrom(/^  async function crmCoop\(/); } catch (e) { return ''; } })(); const coopF = (() => { try { return fnFrom(/^  async function coopMap\(/) + '\n' + fnFrom(/^  async function coopToMap\(/) + '\n' + fnFrom(/^  async function coopFilter\(/); } catch (e) { return ''; } })();
  const build = fnFrom(/^  async function buildDocs\(opt\)/); const tip = fnFrom(/^  function tooltipSellerDocs\(raw\)/); const agg = '';
  const up = L.slice(at(/^    const sent = skipB/), at(/^    const todo = /, at(/^    const sent = skipB/)) + 1).join('\n');
  const sc0 = at(/^  async function taskScore\(\)/); const sc = L.slice(at(/^    const sent = .*dbAll\('uploaded'\)/, sc0), at(/^    const todo0 = /, sc0) + 1).join('\n');
  return { db, helpers, coop, coopF, build, tip, agg, up, sc }; }

function pageScript(X) { return `(() => { const STORES = ['orderLines', 'popups', 'returns', 'qnaList', 'qnaDetail', 'reviews', 'jobs', 'issues', 'meta', 'uploaded', 'excelLines', 'sheetRows', 'sellerRaw'];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const P = window.ReadnowOrders; let sellerLinksAt = 0, selSrc = null, selFullAt = 0, sellerLinkMap = new Map(); function setSellerLinks() {} let serverOrdersCache = window.__SOC || [];
  window.__mk = async () => { const db = await new Promise((res, rej) => { const r = indexedDB.open('readnow-crm', 4); r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: '_key' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
${X.db}
${X.helpers}
${X.coop}
${X.coopF}
${X.tip}
${X.agg}
${X.build}
    return { db, dbAll, dbPutRaw, docHash, clean, stableStr, hashStr, buildDocs,
      upStep: async (docs) => { const skipB = null;
${X.up}
        return todo; },
      scoreStep: async (custs) => {
${X.sc}
        return todo0; } }; }; })();`; }

(async () => {
  const br = await chromium.launch(); const p = await br.newPage(); await p.route('**/*', (rt) => rt.fulfill({ body: '<html><head></head><body>시험</body></html>', contentType: 'text/html' })); await p.goto('http://t.test/crm');
  await p.addScriptTag({ content: fs.readFileSync(CORE, 'utf8') });
  // ── 자료 넣기(실제 크로미움 IndexedDB · 한 번만 — 고치기 전/뒤가 같은 자료를 읽음)
  const seeded = await p.evaluate(async (N) => { const STORES = ['orderLines', 'popups', 'returns', 'qnaList', 'qnaDetail', 'reviews', 'jobs', 'issues', 'meta', 'uploaded', 'excelLines', 'sheetRows', 'sellerRaw'];
    const db = await new Promise((res) => { const r = indexedDB.open('readnow-crm', 4); r.onupgradeneeded = () => { for (const s of STORES) r.result.createObjectStore(s, { keyPath: '_key' }); }; r.onsuccess = () => res(r.result); });
    const put = (s, arr) => new Promise((res) => { const t = db.transaction(s, 'readwrite'); const st = t.objectStore(s); arr.forEach((o) => st.put(o)); t.oncomplete = res; });
    const T = ['어린 왕자', '데미안', '코스모스', '사피엔스', '총 균 쇠', '이기적 유전자', '정의란 무엇인가', '미움받을 용기']; const ttl = (i) => `${T[i % T.length]} ${i % 97}권`;
    const day = (i) => new Date(Date.UTC(2025, 0, 1) + i * 3600e3 * 3).toISOString().slice(0, 16).replace('T', ' ');
    const lines = [], pops = [], excel = []; const soc = [];
    for (let i = 0; i < N.orders; i++) { const ono = String(1000000 + i); const k = 1 + (i % 3 === 0 ? 1 : 0) + (i % 11 === 0 ? 2 : 0); const items = [];
      for (let j = 0; j < k; j++) { lines.push({ _key: `sale|${ono}|${j}`, kind: 'sale', orderNo: ono, page: 1 + (i >> 5), seq: j, title: ttl(i + j), rawTitle: '[중고-상] ' + ttl(i + j), condition: '상', qty: 1, price: 3000 + (i % 50) * 100, rowStatus: '정상', orderedAt: day(i), paidAt: day(i), buyerName: '손님A' + (i % 5120), buyerEmailMasked: 'ab***@example.com', recipientLabel: '상동', collectedAt: '2026-11-05T01:00:00Z', rowNote: null });
        items.push({ title: ttl(i + j), raw: '[중고-상] ' + ttl(i + j), condition: '상', option: null, isbn13: '979' + String(1e9 + ((i * 7 + j) % 900000)).padStart(10, '0'), isbnAlt: null, sku: 'S' + i + '-' + j, note: null, cancelQty: 0, cancelled: false }); }
      pops.push({ _key: ono, orderNo: ono, customerKey: String(500000 + (i % 5120)), items, stage: '배송완료', orderStatus: '정상', invoiceNo: '6' + String(i).padStart(11, '0'), totalAmount: 9000, fee: 900, shippingFee: 2500, buyer: { name: '손님A' + (i % 5120), email: `c${i % 5120}@example.com`, phone1: null, phone2: null }, recipient: { name: '손님A' + (i % 5120), phone1: null, phone2: null, zip: '00000', address: `주소A ${i % 5120}동` }, recipientSameAsBuyer: true, shippingRequest: '문 앞', piiAvailable: true, piiCollectedAt: '2026-11-05T01:00:00Z', collectedAt: '2026-11-05T01:00:00Z', orderedDate: day(i), shipped: { date: day(i + 8), raw: '배송완료' } });
      if (i % 3 === 0) excel.push({ _key: `ex|${ono}`, orderNo: ono, title: ttl(i), price: 3000 + (i % 50) * 100, qty: 1, recipientName: '손님A', buyerName: '손님A', phone1: null, phone2: null, zip: '00000', address: `주소A ${i % 5120}동`, publisher: '출판사', aladinUsedCode: 'U' + i, isbn13: null, memo: null, note: null, status: '정상', platform: 'aladin', orderedAt: day(i) });
      soc.push({ _id: 'aladin_' + ono, customerId: 'aladin_' + (500000 + (i % 5120)), buyer: { name: '손님A' + (i % 5120), email: `c${i % 5120}@example.com`, phone1: null, phone2: null }, recipient: { address: `주소A ${i % 5120}동` }, items: items.map((x) => ({ isbn13: x.isbn13, title: x.title })), orderedAt: day(i) }); }
    for (let i = 0; i < N.exOnly; i++) excel.push({ _key: `exo|${i}`, orderNo: 'Y' + (2000000 + i), title: ttl(i), price: 5000, qty: 1, recipientName: '손님A', buyerName: '손님A', phone1: null, phone2: null, zip: '00000', address: `주소A ${i}동`, platform: 'yes24', orderedAt: day(i), memo: null, note: null, status: '정상', publisher: '출판사', isbn13: null });
    const qnaL = [], qnaD = [], rev = [], ret = [], sheet = [], sell = [];
    for (let i = 0; i < N.qna; i++) { qnaL.push({ _key: 'q' + i, answered: 'Yes' }); qnaD.push({ _key: 'q' + i, customerKey: String(500000 + (i % 5120)), orderNo: String(1000000 + i), itemId: 'I' + i, title: ttl(i), condition: '상', authorMasked: 'ab***', question: '책 상태가 어떤가요? '.repeat(3), answer: '좋습니다. '.repeat(3), createdDate: day(i), collectedAt: '2026-11-05T01:00:00Z' }); }
    for (let i = 0; i < N.reviews; i++) rev.push({ _key: `${1000000 + i}|${i}|1`, orderNo: String(1000000 + i), title: ttl(i), condition: '상', rating: 5, comment: '잘 받았습니다 '.repeat(4), authorMasked: 'cd***', createdDate: day(i), collectedAt: '2026-11-05T01:00:00Z' });
    for (let i = 0; i < N.returns; i++) ret.push({ _key: 'r' + i, claimId: 'C' + i, orderNo: String(1000000 + i * 7), itemId: 'I' + i, title: ttl(i * 7), condition: '상', sku: 'S' + i * 7 + '-0', registeredAt: day(i), price: 4000, qty: 1, reason: '단순 변심', status: '반품완료', tab: 'done', history: [{ at: day(i), st: '접수' }, { at: day(i + 1), st: '완료' }] });
    for (let i = 0; i < N.sheet; i++) sheet.push(i < 100 ? { _key: 'seller_' + i, type: 'seller', name: '책방' + i, grade: '전문', sheet: '판매자', sheetRow: i + 2 } : { _key: 'b' + i, type: ['blacklist', 'customerCancel', 'otherCustomer'][i % 3], sheet: '블랙리스트', sheetRow: i, name: '손님A' + i, email: `c${i}@example.com`, phones: [], items: [{ title: ttl(i), isbn13: null }], reason: '메모 '.repeat(5), date: day(i) });
    for (let i = 0; i < N.sellers; i++) { const snaps = {}; for (let s = 0; s < 3; s++) snaps['s' + s] = { fetchedAt: 1.76e12 + s * 864e5, sellerName: '책방' + i, sellerGrade: '전문셀러', totalItems: String(1000 + i), domesticBookCount: String(800 + i), foreignBookCount: '10', musicCount: '0', videoCount: '0', rating: '98.5', reviewCount: '1,234', totalReviewCount: '2,345', outstockRate: '0.5', shippingDays: '1.2', freeShipping: '20000', shippingFee: '2500', notices: ['공지 없음'], domesticCategories: [{ name: '소설', count: '120' }, { name: '인문', count: '80' }] };
      const quick = {}; for (let q = 0; q < 10; q++) quick['q' + q] = { fetchedAt: 1.76e12 + q * 36e5, rowRating: '98', rowShippingFee: 2500 };
      sell.push({ _key: 'sc' + i, _sc: 'sc' + i, snapshots: snaps, quickUpdates: quick, company: { name: `책방${i}, 대표A`, phone: null, asPhone: null, email: `s${i}@example.com`, bizRegNo: '000-00-00000', address: '주소A', courier: '우체국', returnAddress: `반품 주소A ${i}`, noticeIntro: '안내 '.repeat(10) }, importedAt: '2026-11-05T00:00:00Z', fileName: 'tooltip-db' }); }
    const put2 = async (s, arr) => { for (let i = 0; i < arr.length; i += 2000) await put(s, arr.slice(i, i + 2000)); };
    await put2('orderLines', lines); await put2('popups', pops); await put2('excelLines', excel); await put2('qnaList', qnaL); await put2('qnaDetail', qnaD); await put2('reviews', rev); await put2('returns', ret); await put2('sheetRows', sheet); await put2('sellerRaw', sell);
    db.close(); window.__SOC = soc; return { orderLines: lines.length, popups: pops.length, excel: excel.length, qna: qnaD.length, reviews: rev.length, returns: ret.length, sheet: sheet.length, sellerRaw: sell.length, soc: soc.length }; }, N);
  console.log('자료:', JSON.stringify(seeded));
  if (+process.env.RN_CPU > 1) { const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.RN_CPU }); console.log(`느린 PC 흉내: CPU ${process.env.RN_CPU}배 느리게`); } /* HOME 같은 느린 PC — 고치기 전 10.6초 ≈ 이 서버 0.5초 × 약 20 */

  // ── 한 판(소스) 돌리기: 올릴 문서 계산 + 올릴 것 고르기(지문 비교) · 점수의 올릴 고객 고르기 — 각 구간의 긴 작업을 잼
  const runOne = async (label, srcPath, first) => { const X = extract(fs.readFileSync(srcPath, 'utf8')); await p.addScriptTag({ content: pageScript(X) });
    return p.evaluate(async ({ first }) => { const E = []; const ob = new PerformanceObserver((l) => { for (const e of l.getEntries()) E.push({ t: e.startTime, d: e.duration, s: (e.scripts || []).map((x) => ({ k: `${x.invokerType}:${x.invoker}`, d: x.duration })) }); }); ob.observe({ type: 'long-animation-frame', buffered: false });
      const LT = []; const ob2 = new PerformanceObserver((l) => { for (const e of l.getEntries()) LT.push({ t: e.startTime, d: e.duration }); }); ob2.observe({ type: 'longtask', buffered: false });
      let raf = true; const tick = () => { document.body.textContent = '시험 ' + performance.now().toFixed(0); if (raf) requestAnimationFrame(tick); }; requestAnimationFrame(tick); /* 화면이 계속 그려져야 크롬이 긴 화면 그림을 기록함(실제 기록 창처럼) */
      const H = await window.__mk(); const W = (ms) => new Promise((r) => setTimeout(r, ms)); const win = async (fn) => { await W(300); const a = performance.now(); const v = await fn(); await W(400); const b = performance.now(); const lt = LT.filter((x) => x.t >= a && x.t < b); const lf = E.filter((x) => x.t >= a - 50 && x.t < b); const idb = lf.flatMap((x) => x.s).filter((s) => /IDBRequest/.test(s.k));
          const top = {}; lf.flatMap((x) => x.s).forEach((s) => { top[s.k] = Math.max(top[s.k] || 0, s.d); }); return { v, ms: Math.round(b - a - 400), maxTask: Math.round(Math.max(0, ...lt.map((x) => x.d))), n50: lt.length, sum: Math.round(lt.reduce((s, x) => s + x.d, 0)), maxIdb: Math.round(Math.max(0, ...idb.map((s) => s.d))), top: Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, d]) => `${k} ${Math.round(d)}ms`), nLoaf: E.length }; };
      // 처음 한 번: 지난 올리기가 모두 올렸다고 적어 둠(실제처럼 '올릴 문서 0~몇 개')
      if (first) { const docs = await H.buildDocs({ noCust: true }); await H.dbPutRaw('uploaded', docs.map((d) => ({ _key: `${d.col}/${d.id}`, hash: H.docHash(d), at: 'x' }))); }
      let DOCS = null; const A = await win(async () => { const docs = await H.buildDocs({ noCust: true }); const todo = await H.upStep(docs); DOCS = docs; return { docs: docs.length, todo: todo.length }; });
      A.v.sig = H.hashStr(DOCS.map((d) => d.col + '/' + d.id + '=' + H.docHash(d)).join('|')); DOCS = null; /* 결과 지문은 잰 구간 밖에서(시험 자체의 일) */
      /* 고객 요약(점수 계산이 Firebase 자료로 만드는 것)은 모양만 같게 5,120명 — 이 구간은 '올린 것' 저장소 읽기 + 지문 비교만 잼 */
      const custs = []; for (let i = 0; i < 5120; i++) custs.push({ customerId: 'aladin_' + (500000 + i), platform: 'aladin', names: ['손님A' + i], emails: [`c${i}@example.com`], phones: [], addresses: { ['주소A ' + i + '동']: 2 }, orderIds: Array.from({ length: 1 + (i % 4) }, (_, k) => 'aladin_' + (1000000 + i + k * 5120)), saleOrderCount: 1 + (i % 4), saleItemQty: 2, salesAmount: 9000, firstOrderAt: '2025-01-01', lastOrderAt: '2026-11-01', scores: { total: i % 100, recency: 3, frequency: 2, monetary: 4, day: '2026-11-05' }, autoFlags: { vip: { on: i % 50 === 0, why: [] }, caution: { on: false, why: [] } }, interactions: { qna: i % 3, review: i % 2 } }); if (first) await H.dbPutRaw('uploaded', custs.slice(5).map((c) => ({ _key: `crm_customers/${c.customerId}`, hash: H.hashStr(H.stableStr(H.clean({ ...c, scores: { ...c.scores, day: undefined } }))), at: 'x' })));
      const B = await win(async () => { const t = await H.scoreStep(custs); return { custs: custs.length, todo0: t.length }; });
      raf = false; ob.disconnect(); ob2.disconnect(); H.db.close(); return { A, B }; }, { first }); };

  const res = {};
  if (process.env.RN_COL_OLD) { res.old = await runOne('고치기 전', process.env.RN_COL_OLD, true); console.log('고치기 전:', JSON.stringify(res.old)); }
  res.neu = await runOne('고친 뒤', COL, !res.old); console.log('고친 뒤 :', JSON.stringify(res.neu));
  const n = res.neu;
  ok(n.A.v.docs > 30000, `올릴 문서 계산이 돎 (문서 ${n.A.v.docs.toLocaleString()}개 · 올릴 것 ${n.A.v.todo}개)`);
  ok(n.A.maxTask < 50 || n.A.maxTask === 0, `올리기 구간 한 번 일 최대 ${n.A.maxTask}ms < 50ms (50ms 넘은 일 ${n.A.n50}번 · 전체 ${n.A.ms}ms)`);
  ok(n.A.maxIdb < 50, `올리기 구간 IDBRequest.onsuccess 최대 ${n.A.maxIdb}ms < 50ms`);
  ok(n.B.maxTask < 50 || n.B.maxTask === 0, `점수 구간 한 번 일 최대 ${n.B.maxTask}ms < 50ms (고객 ${n.B.v.custs.toLocaleString()}명 · 올릴 것 ${n.B.v.todo0}명)`);
  if (res.old) { const o = res.old; ok(o.A.v.docs === n.A.v.docs && o.A.v.sig === n.A.v.sig && o.A.v.todo === n.A.v.todo, `결과 같음 — 문서 ${o.A.v.docs}개 · 지문 ${o.A.v.sig} · 올릴 것 ${o.A.v.todo}개`); ok(o.B.v.todo0 === n.B.v.todo0, `점수 올릴 고객 수 같음 (${o.B.v.todo0}명)`);
    console.log(`  ▶ 올리기 구간: 한 번 일 최대 ${o.A.maxTask}ms → ${n.A.maxTask}ms · IDB onsuccess 최대 ${o.A.maxIdb}ms → ${n.A.maxIdb}ms · 전체 ${o.A.ms}ms → ${n.A.ms}ms`);
    console.log(`  ▶ 점수 구간:   한 번 일 최대 ${o.B.maxTask}ms → ${n.B.maxTask}ms · IDB onsuccess 최대 ${o.B.maxIdb}ms → ${n.B.maxIdb}ms · 전체 ${o.B.ms}ms → ${n.B.ms}ms`); }
  await br.close(); console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
