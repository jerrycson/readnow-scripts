// 큰 벤치마킹 기록을 이 기기 보관본(IndexedDB meta)에 넣음 — 🎯 집중 벤치마킹(bkf) 행 N개 · 🔭 벤치마킹 조회(bkb) M개
module.exports = async ({ nf, nb }) => { const R = (n) => Math.floor(Math.random() * n); const day = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  const NS = 200, NBOOK = 60000; const pg = 3000; let page = []; let pages = 0;
  for (let i = 0; i < nf; i++) { const b = R(NBOOK); const hasI = b % 3 === 0; const sc = String(1000 + R(NS)); const gone = Math.random() < 0.45;
    page.push(['bi' + i, sc, hasI ? '97911' + String(10000000 + b) : '', '벤치 책 ' + b + ' ' + ['소설', '역사', '경제', '과학'][b % 4] + ' 이야기 (개정판)', '저자' + (b % 3000) + ' (지은이)', 15000 + (b % 20) * 1000, '2019-0' + (1 + (b % 9)), 3000 + R(20000), ['최상', '상', '중'][R(3)], gone ? day(R(120)) : null, Math.random() < 0.1 ? 1 : 0, R(4), day(120 + R(200))]);
    if (page.length === pg) { await idbPut('meta', [{ k: 'bkf_p' + pages, rows: page }]); pages++; page = []; } }
  if (page.length) { await idbPut('meta', [{ k: 'bkf_p' + pages, rows: page }]); pages++; }
  await idbPut('meta', [{ k: 'bkf_meta', pages, n: nf, cursor: null, done: true, maxTs: Date.now(), deltas: 0, at: Date.now() }]);
  const pb = 2000; let bp = 0; page = [];
  for (let i = 0; i < nb; i++) { const b = R(NBOOK); const p1 = []; for (let k = 0; k < 20; k++) p1.push({ price: 3000 + R(15000), sellerCode: String(1000 + R(5000)), soldOut: false });
    page.push(['lk' + i, '조회 책 ' + b, b % 2 ? '97911' + String(10000000 + b) : '97889' + String(10000000 + (b % 25000)), String(300000000 + b), '저자' + (b % 3000), '출판사' + (b % 400), '2020-01-01', 'https://image.aladin.co.kr/product/' + b + '/cover.jpg', R(5000), R(40), R(30), p1, 15000, 13500, { 최상: R(5000), 상: R(4000) }, '정상', new Date().toISOString(), new Date().toISOString(), 'g' + R(20)]);
    if (page.length === pb) { await idbPut('meta', [{ k: 'bkb_p' + bp, rows: page }]); bp++; page = []; } }
  if (page.length) { await idbPut('meta', [{ k: 'bkb_p' + bp, rows: page }]); bp++; }
  await idbPut('meta', [{ k: 'bkb_meta', pages: bp, n: nb, cursor: null, done: true, maxTs: Date.now(), deltas: 0, at: Date.now() }]);
  return { pages, bp }; };
