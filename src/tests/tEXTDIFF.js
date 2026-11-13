// tEXTDIFF — (rv1 11/13) 🔎 외부 정보 '바뀜'이 어느 칸 때문인지 남김
//   까닭: 11/10~11/13 로거 기록(진단 logs=1&pc=LOGGER)에서 교보문고 바뀜 96~100%(11/11 30/31 · 11/12 13/13 · 11/13 21/21)가 11/09 고침 뒤에도 남았는데
//         기록에 '바뀜(옛 값 보관)'만 있고 어느 칸이 다른지 없어 원인을 못 찾음(ext_hist 원문은 진단으로 못 읽음)
//   ① 공용 sigDiff: 지문과 같은 요약으로 견줘 다른 칸 이름만(값 없음 · 최대 6개) · 지문에서 빼는 칸(표지 ?t=·url·판매지수)은 안 셈 · 같으면 빈 목록
//   ② 수집기 extSave(진짜 코드 + 가짜 Firestore): 바뀜이면 ext_hist 문서에 dk · 같음·새로·keep이면 dk 없음 · 웹앱이 통째로 받는 ext_basic에는 안 넣음(메모리)
//   ③ 수집기 기록 줄에 '· 바뀐 칸 …'
// 실행: node src/tests/tEXTDIFF.js
const fs = require('fs'); const path = require('path');
const core = (n) => [path.join(__dirname, '..', '..', n), path.join(__dirname, '..', n)].find((p) => fs.existsSync(p)); const X = require(core('readnow-ext-core.js'));
const SRC = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const csrc = fs.readFileSync(SRC, 'utf8');
let bad = 0; const ok = (c, t) => { console.log((c ? '  ✓ ' : '  ❌ ') + t); if (!c) bad++; }; const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
(async () => {
  console.log('▶ ① 공용 sigDiff');
  ok(typeof X.sigDiff === 'function', 'sigDiff를 내보냄');
  const d = { title: '월든', pages: 448, priceSales: 9000, cover: 'https://contents.kyobobook.co.kr/x.jpg?t=1', url: 'https://product.kyobobook.co.kr/detail/S1', id: 'S1', salesIndex: 100, desc: '소개' };
  const P = (dd, none) => ({ none: !!none, d: dd });
  ok(X.sigDiff(P(d), P({ ...d }), 'kyobo').length === 0, '같은 값 → 빈 목록');
  ok(X.sigDiff(P(d), P({ ...d, cover: d.cover.replace('t=1', 't=9'), url: 'https://x', salesIndex: 999 }), 'kyobo').length === 0, '지문에서 빼는 칸(표지 ?t=·주소·판매지수)만 다르면 → 빈 목록(지문과 같은 셈)');
  const k1 = X.sigDiff(P(d), P({ ...d, priceSales: 8100, desc: '새 소개' }), 'kyobo'); ok(JSON.stringify(k1) === JSON.stringify(['d.desc', 'd.priceSales']), '교보 판매가·소개가 바뀜 → 그 칸 이름만: ' + JSON.stringify(k1));
  ok(!JSON.stringify(k1).includes('8100') && !JSON.stringify(k1).includes('새 소개'), '값은 담지 않음(칸 이름만)');
  const k2 = X.sigDiff(P({ items: [{ p: 10, st: 'sell', sim: 1 }] }), P({ items: [{ p: 12, st: 'sell', sim: 1 }, { p: 3, st: 'sold', sim: 1 }] }), 'ebay'); ok(k2.includes('lst.g.sell.min') && k2.includes('lst.g.sold+'), '장터: 판매중 최저가 바뀜 · 팔림 무리 새로 생김(+) → ' + JSON.stringify(k2));
  const big = {}; const big2 = {}; for (let i = 0; i < 20; i++) { big['k' + i] = i; big2['k' + i] = i + 1; } ok(X.sigDiff(P(big), P(big2), 'lib').length === 6, '많이 달라도 최대 6개');
  ok(Array.isArray(X.sigDiff(P(null, true), P(d), 'kyobo')), '옛 값이 없음(none)이어도 목록을 돌려줌');

  console.log('▶ ② 수집기 extSave(진짜 코드) + 가짜 Firestore');
  const DB = {}; const DEL = { __del: 1 }; const setPath = (o, p, v) => { const ks = p.split('.'); let x = o; for (let i = 0; i < ks.length - 1; i++) x = x[ks[i]] = x[ks[i]] || {}; if (v === DEL) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = v; };
  const C = (col) => ({ doc: (id) => ({ get: async () => { const v = (DB[col] || {})[id]; return { exists: !!v, data: () => clone(v) }; }, set: async (v) => { DB[col] = DB[col] || {}; DB[col][id] = { ...(DB[col][id] || {}), ...clone(v) }; }, update: async (u) => { const v = DB[col][id]; for (const [k, val] of Object.entries(u)) setPath(v, k, val === DEL ? DEL : clone(val)); } }) });
  let tick = 0; const nowIso = () => `2026-11-13T0${++tick % 10}:00:00.000Z`;
  const a0 = csrc.indexOf('  const extBytes = '); const a1 = csrc.indexOf("return prev ? 'changed' : 'new'; }", a0); ok(a0 > 0 && a1 > a0, '수집기에서 extSave 덩어리를 찾음');
  const CODE = csrc.slice(a0, a1 + "return prev ? 'changed' : 'new'; }".length);
  const env = { C, nowIso, PC_NAME: 'LOGGER', TS: () => 'ts', W: () => ({}), firebase: { firestore: { FieldValue: { delete: () => DEL } } }, EXT: () => X, log: () => {}, extKst: () => '2026-11-13' };
  const extSave = new Function(...Object.keys(env), CODE + '\nreturn extSave;')(...Object.values(env));
  const B = { isbn: '9791191071481', title: '월든' };
  const r0 = { ok: true, d }; ok(await extSave('kyobo', B, r0) === 'new' && !DB.ext_hist, '처음 → 새로 · 옛 값 보관 0');
  ok(await extSave('kyobo', B, { ok: true, d: { ...d, cover: d.cover.replace('t=1', 't=5') } }) === 'same', '표지 ?t=만 다름 → 같음');
  const r2 = { ok: true, d: { ...d, priceSales: 8100 } }; ok(await extSave('kyobo', B, r2) === 'changed', '판매가가 바뀜 → 바뀜');
  const H = Object.values(DB.ext_hist || {}); ok(H.length === 1 && JSON.stringify(H[0].dk) === JSON.stringify(['d.priceSales']), 'ext_hist 문서에 dk = 바뀐 칸 이름: ' + JSON.stringify(H[0] && H[0].dk));
  ok(JSON.stringify(r2._dk) === JSON.stringify(['d.priceSales']), '기록 줄에 쓸 바뀐 칸을 결과에 붙임(res._dk)');
  ok(!('dk' in DB.ext_basic[B.isbn].src.kyobo), '웹앱이 통째로 받는 ext_basic에는 dk를 넣지 않음(메모리)');
  ok(await extSave('kyobo', B, { ok: true, none: true }) === 'keep' && Object.values(DB.ext_hist).length === 1, '없음 → 받아 둔 값 그대로(keep) · 옛 값 보관 늘지 않음');
  { const env2 = { ...env, EXT: () => ({ ...X, sigDiff: undefined }) }; const ext2 = new Function(...Object.keys(env2), CODE + '\nreturn extSave;')(...Object.values(env2)); const r3 = { ok: true, d: { ...d, priceSales: 7000 } }; ok(await ext2('kyobo', B, r3) === 'changed' && r3._dk === null, '옛 공용 파일(sigDiff 없음)이어도 그대로 돎(dk 없음)'); }

  console.log('▶ ③ 수집기 기록 줄');
  ok(/st === 'changed' && res\._dk && res\._dk\.length \? ` · 바뀐 칸 \$\{res\._dk\.join\(','\)\.slice\(0, 120\)\}` : ''/.test(csrc), "기록 줄 '🌐 … → 바뀜(옛 값 보관) · 바뀐 칸 d.priceSales'");
  console.log(bad ? `❌ tEXTDIFF 실패 ${bad}` : '✓ tEXTDIFF 통과'); process.exit(bad ? 1 : 0);
})();
