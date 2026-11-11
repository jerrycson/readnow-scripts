// tC2HOPC — (11/12 col2rep6 · 진단 11/12 03:40 HOME 번외 0.1.25 · 00:12 뒤 소식 없음) 🔀 [넘기기] 단추의 맡을 PC = 그 일을 하는 번외 판 · 최근 3시간 안 소식 있는 PC만
//   ① 차림표 PC(외부 정보 = HOME)가 옛 판이면 → 새 판·소식 있는 JS-MAIN ② 둘 다 안 되면 단추 대신 까닭(pc null · no 글) ③ 국중·KPIPA는 0.1.25면 됨 ④ 소식이 3시간 넘으면 뺌 ⑤ 까닭 모를 다름이 있으면 후보 아님(예전 그대로)
// 실행: node src/tests/tC2HOPC.js
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const T = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const i = T.indexOf('const C2HO_PCPLAN'); const j = T.indexOf('\n', T.indexOf('.sort((a, b) => b.canDays - a.canDays || b.same - a.same); }', i)); if (i < 0 || j < i) throw new Error('c2HoCand 덩어리 못 찾음');
const F = new Function('C2HO_JOBS', T.slice(i, j) + '\nreturn { c2HoCand, C2HO_MINV };')({ 'ext.ebay': 1, 'ext.ridi': 1, 'ext.nl': 1, kpipa: 1 });
const now = Date.parse('2026-11-12T03:40:00+09:00'); const iso = (h) => new Date(now - h * 3600e3).toISOString();
const S = (n, can, un) => ({ name: n, n: 40, same: 40, un: un || 0, pass: { can } });
const L = [
  { d: '2026-11-11', pc: 'HOME', ver: '0.1.24', at: iso(5), tasks: { 'ext.ebay': S('eBay', true), 'ext.nl': S('국중', true), kpipa: S('KPIPA', true) } },
  { d: '2026-11-12', pc: 'HOME', ver: '0.1.25', at: iso(3.5), tasks: { 'ext.ebay': S('eBay', false), kpipa: S('KPIPA', false) } },
  { d: '2026-11-12', pc: 'JS-MAIN', ver: '0.1.28', at: iso(0.1), tasks: { 'ext.ebay': S('eBay', true), 'ext.ridi': S('리디', true), 'ext.nl': S('국중', true), kpipa: S('KPIPA', true), 'ext.kakao': S('카카오', true, 1) } },
  { d: '2026-11-12', pc: 'LOGGER', ver: '0.1.28', at: iso(4), tasks: { 'ext.ridi': S('리디', true) } }];
const C = Object.fromEntries(F.c2HoCand(L, now).map((c) => [c.k, c]));
ok(C['ext.ebay'] && C['ext.ebay'].pc === 'JS-MAIN', '① eBay: 차림표 HOME이 옛 판(0.1.25 < 0.1.26)·3.5시간 소식 없음 → JS-MAIN', C['ext.ebay']);
ok(C['ext.nl'] && C['ext.nl'].pc === 'JS-MAIN', '③ 국중: HOME 마지막 소식 3.5시간(3시간 넘음) → JS-MAIN', C['ext.nl']);
const L2 = L.map((x) => (x.pc === 'HOME' && x.d === '2026-11-12' ? { ...x, at: iso(1) } : x)); const C2 = Object.fromEntries(F.c2HoCand(L2, now).map((c) => [c.k, c]));
ok(C2.kpipa && C2.kpipa.pc === 'HOME' && C2['ext.nl'].pc === 'HOME', '③ KPIPA·국중은 0.1.25면 됨 — HOME 소식이 1시간 전이면 차림표대로 HOME', { k: C2.kpipa, n: C2['ext.nl'] });
ok(C2['ext.ebay'].pc === 'JS-MAIN', '① 외부 정보 14곳은 0.1.26 이상만 — HOME 0.1.25는 소식이 있어도 안 맡김', C2['ext.ebay']);
ok(C['ext.ridi'] && C['ext.ridi'].pc === 'JS-MAIN', '④ 리디: LOGGER는 4시간 소식 없음 → JS-MAIN', C['ext.ridi']);
const L3 = [{ d: '2026-11-12', pc: 'HOME', ver: '0.1.25', at: iso(0.2), tasks: { 'ext.ebay': S('eBay', true) } }, { d: '2026-11-12', pc: 'JS-MAIN', ver: '0.1.28', at: iso(6), tasks: { 'ext.ebay': S('eBay', true) } }];
const e3 = F.c2HoCand(L3, now)[0]; ok(e3 && e3.pc === null && /HOME 번외 0\.1\.25\(0\.1\.26 이상 필요\)/.test(e3.no) && /JS-MAIN 6시간째 소식 없음/.test(e3.no), '② 맡을 PC가 없으면 pc 없음 + PC마다 까닭', e3);
ok(!C['ext.kakao'], '⑤ 까닭 모를 다름이 있으면 후보 아님(예전 그대로)');
ok(/맡을 PC 없음 — \$\{esc\(c\.no/.test(T), '화면: 맡을 PC가 없으면 단추 대신 까닭 한 줄');
console.log(bad ? `✗ tC2HOPC: ${bad}개 실패` : '✓ tC2HOPC 모두 통과'); process.exit(bad ? 1 : 0);
