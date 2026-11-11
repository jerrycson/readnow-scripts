// tSELL3ui — 🔭 시장조사 › 🏪 경쟁 판매자 🧑‍🏫 카드: 롤모델 주력 장르·SP · 🗂 구성 칸 안 🧩 채운 정보(채움률·분야/표지 잇기·채움 기준별) 화면 시험(sell3 · 꾸민 자료만)
// 실행: cd pw && RN_PORT=<포트> node tSELL3ui.js (harness.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((x) => setTimeout(x, ms)); S.devOk = true; S.sellersLoaded = true; S.sellers = new Map(); S.sellers.set('sc_101', { id: 'sc_101', name: '판매자1', sc: 1, totalItems: 1000 });
    const fr = { n: 240, sp: 0.42, ym: 0.4, pub: 0.41, cat: 0.18, cov: 0.05, pl: 0.4 };
    S.slL = { open: true, at: Date.now(), doc: { day: '2026-11-12', sellers: 1, cfg: { role: { by: 'rev' }, front: { per: 24, pages: 10 } }, role: [{ sc: '101' }],
      profiles: [{ sc: '101', name: '판매자1', p: { runs: 5, days: 10, soldPerDay: 5, revPerDay: 50000, stock: 900, cats: [{ k: '분류 모름', s: 1 }], catKnownS: 0, gens: [{ k: 'kid', n: 40, s: 0.4 }, { k: 'lit', n: 20, s: 0.2 }], genKnownS: 0.6, spMed: 1234, spKnownS: 0.55, discMed: 0.35, bands: [], grades: [], words: [], years: {} }, f: {} }],
      ours: { stock: 100, cats: {}, bands: {} }, plans: [], front: { pool: { n: 3 }, rows: [] },
      fill: { q: { n: 1800 }, front: fr, all: { ...fr, sp: 0.3 }, join: { cand: 900, book: 300, cat: 280, kdc: 150, cv: 120 }, needN: 2100, note: '채움 메모' },
      comp: { shops: 10, oursRows: 55, rows: 308, tests: 400, sig: 20, sigRep: 18, top: [], ledger: {}, fillAge: { '0~7일 전': { n: 60, sp: 0.4, ym: 0.38, pub: 0.4, cat: 0.2, cov: 0.05 }, '31일 넘게 전': { n: 100, sp: 0.02, ym: 0.02, pub: 0.02, cat: 0.01, cov: 0 } }, newFeats: ['spMed', 'g:kid', 'pubTop'],
        sens: { by: [{ t: 0.1, rows: 300, rowsNew: 120, shops: 9, feats: 20, tests: 60, sig: 3, sigRep: 2, top: [{ f: 'spLo', y: 'g3', r: 0.31, q: 0.04 }] }, { t: 0.3, rows: 300, rowsNew: 60, shops: 6, feats: 14, tests: 40, sig: 1, sigRep: 1, top: [] }, { t: 0.5, rows: 300, rowsNew: 0, shops: 0, feats: 0, tests: 0, sig: 0, sigRep: 0, top: [] }] } } } };
    S.slA = { at: Date.now(), doc: null }; S.slFw = { at: Date.now(), d: {} }; S.tab = 'sellers'; S.q = ''; renderTabs(); renderMainNow(); await W(500);
    const m = document.querySelector('#main'); const T = m.querySelector('#sl_learn').textContent; return { T: T.slice(0, 50),
      gen: /장르\(60% 앎\)/.test(T) && /어린이·청소년 40%/.test(T) && /팔린 책 SP 가운데 1,234/.test(T) && /정가 대비 35%/.test(T),
      fill: /채운 정보가 구성 셈에 들어간 만큼/.test(T) && /SP 42%/.test(T) && /국중 KDC 150/.test(T) && /표지\(서가 셈\) 120/.test(T) && /2,100개/.test(T),
      sens: /채움 기준별로 다시 셈/.test(T) && /10% 넘게 앎/.test(T) && /120\/300/.test(T) && /SP 50 아래 몫/.test(T), age: /31일 넘게 전 100줄/.test(T) }; });
  ok(r.gen, '롤모델 주력: 장르(아는 몫)·SP 가운데·정가 대비', r); ok(r.fill, '🧩 채움률·분야/표지 잇기·앞 페이지 빈 상품 넘김', r); ok(r.sens, '채움 기준 10·30·50%별 표', r); ok(r.age, '날짜 줄 나이별 채움(지난 날은 거의 비어 있음)', r);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); });
