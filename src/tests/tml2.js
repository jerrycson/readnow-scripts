const ML = require('/home/claude/w/readnow-ml-core.js'); const fs = require('fs');
// ① 예전 클라우드 코드(인라인)와 rawRow가 같은 줄을 만드는지
const inline = fs.readFileSync(__dirname + '/inline_row.js', 'utf8').replace("  const now = Date.parse(day + 'T23:59:59+09:00');", '');
const mkOld = new Function('L', 'M', 'lastAct', 'watch', 'now', inline + '; return rows;');
const L = [], M = new Map(), lastAct = new Map(), watch = new Map(); const now = Date.parse('2026-10-08T23:59:59+09:00'); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 300; i++) { const g = ['최상', '상', '중'][i % 3]; const price = 2000 + Math.round(rnd() * 15000 / 100) * 100; L.push({ id: 'aladin_U' + i, usedCode: 'U' + i, price, grade: g, sku: 'KHKA' + (i % 9) + '01', registeredAt: '2026-0' + (1 + (i % 9)) + '-1' + (i % 9) }); const P1 = [...Array(i % 8)].map((_, k) => ({ sellerCode: k === 0 ? '996008' : 'S' + k, usedCode: k === 0 ? 'U' + i : 'X', price: price + Math.round((rnd() - 0.5) * 6000), grade: ['최상', '상', '중'][k % 3] }));
  M.set('B' + i, { usedFirstPage: P1, priceList: i % 4 ? 18000 : null, salesPoint: Math.round(rnd() * 5000), usedTotal: (i % 8) + Math.round(rnd() * 20), buyback: { 상: 1200 }, lastCheckedAt: '2026-10-0' + (1 + (i % 7)) + 'T10:00:00Z' }); L[i].bookId = 'B' + i; if (i % 5 === 0) lastAct.set(L[i].id, { at: '2026-10-05T10:00:00Z', from: price + 500, batchId: 'b1' }); if (i % 7 === 0) watch.set(L[i].id, 'g1'); }
const A = mkOld(L, M, lastAct, watch, now), B = L.map((l) => ML.rawRow(l, M.get(String(l.bookId)), lastAct.get(l.id), watch.get(l.id), now));
console.log('rawRow == 예전 클라우드 줄:', JSON.stringify(A) === JSON.stringify(B), A.length);
// ② 배우기: 진짜 규칙(1위·싸면 잘 팔림)으로 만든 가짜 판매 → 모델이 기준선보다 나은지
const rows = [], y = []; for (let d = 0; d < 20; d++) B.forEach((r) => { const rr = { ...r, price: Math.max(1000, r.price + Math.round((rnd() - 0.5) * 2000)) }; rr.rank = rr.minAll ? (rr.price < rr.minAll ? 1 : 2 + Math.floor(rnd() * 5)) : 1; const z = -2.2 + (rr.rank === 1 ? 1.2 : 0) - 1.5 * Math.log((rr.price) / (rr.sameMin || rr.price)) + 0.0002 * (rr.sp || 0); rows.push(rr); y.push(rnd() < 1 / (1 + Math.exp(-z)) ? 1 : 0); });
const n = rows.length, cut = Math.floor(n * 0.75); const t0 = Date.now(); const mdl = ML.train(rows.slice(0, cut).map(ML.feats), y.slice(0, cut)); const base = ML.trainBase(rows.slice(0, cut), y.slice(0, cut));
const ev = (Mx) => ML.evaluate(rows.slice(cut).map((r) => ML.predict(Mx, r)), y.slice(cut));
console.log('배우기', Date.now() - t0, 'ms · 줄', cut, '· 판매율', (y.reduce((a, v) => a + v, 0) / n).toFixed(3)); console.log('모델', JSON.stringify(ev(mdl))); console.log('기준선', JSON.stringify(ev(base)));
const ex = [1, 2, 3].map(() => ({ champ: ev(base), chall: ev(mdl) })); console.log('승격?', JSON.stringify(ML.shouldPromote(ex)));
const r0 = B.find((r) => r.sameMin); const q1 = ML.predict(mdl, r0), q2 = ML.predict(mdl, ML.withPrice(r0, Math.round(r0.price * 0.85))); console.log('15% 내리면 7일 판매 확률', q1.toFixed(3), '→', q2.toFixed(3), '· 하루 기대 남는 돈', ML.dailyValue(q1, r0.price, 0.1, 2000).toFixed(1), '→', ML.dailyValue(q2, r0.price * 0.85, 0.1, 2000).toFixed(1));
console.log('AUC 시험 (완벽=1, 거꾸로=0):', ML.evaluate([0.1, 0.2, 0.8, 0.9], [0, 0, 1, 1]).auc, ML.evaluate([0.9, 0.8, 0.2, 0.1], [0, 0, 1, 1]).auc, ML.evaluate([0.5, 0.5, 0.5, 0.5], [0, 1, 0, 1]).auc);
