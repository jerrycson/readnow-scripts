// tMKT1C_1113 — (11/13 verify1 · mkt1 남은 일) 수집기 PC 등록 조회(lookupBook)도 클라우드 /lookup(0.35.141)처럼 빈 중고 화면을 걸러 냄
//  ① 첫 중고 화면이 비었으면(전체 중고 수 없음·줄 0) 한 번 더 읽음 → 두 번째에 읽히면 usedErr 없음
//  ② 두 번 다 비면 usedErr(웹앱이 '읽는 중'으로 다시 맡김) · ③ 처음부터 읽히면 한 번만 읽음 · ④ 수집기 머리(==UserScript==) 그대로
// 실행: node src/tests/tMKT1C_1113.js · 시험 자료는 가짜 책(손님 정보 없음)
const fs = require('fs'), path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'readnow-collector.src.js'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
const a = SRC.indexOf('  async function lookupBook(url, code) {'); const b = SRC.indexOf('series: p.series || null }; }', a);
ok(a > 0 && b > a, 'lookupBook을 원본에서 찾음');
const FN = SRC.slice(a, b + 'series: p.series || null }; }'.length);
const mk = (pages) => { const calls = []; const lookDoc = async (u) => { calls.push(u); return /UsedShop/.test(u) ? { doc: pages.shift() || 'empty' } : { doc: 'prod', finalUrl: u }; };
  const P = { parseProductPage: () => ({ aladinItemId: '111', isbn13: '9788900000001', title: '시험책', contributors: [], categories: [] }), parseUsedPage: (d) => (d === 'full' ? { usedTotal: 140, listings: [{ p: 1000 }], mins: null } : { usedTotal: null, listings: [] }) };
  const f = new Function('P', 'lookDoc', 'sleep', 'RGF', 'AL', 'PUBONLY', 'PACE_P', 'nowIso', FN + '; return lookupBook;')(P, lookDoc, async () => {}, () => null, {}, false, 0, () => '2026-11-13T00:00:00Z');
  return { f, calls }; };
(async () => {
  { const { f, calls } = mk(['empty', 'full']); const r = await f('/shop/wproduct.aspx?ISBN=9788900000001', null); ok(r.usedTotal === 140 && !r.usedErr && calls.filter((u) => /UsedShop/.test(u)).length === 2, '① 첫 화면이 비면 한 번 더 → 읽히면 usedErr 없음', { ut: r.usedTotal, e: r.usedErr, n: calls.length }); }
  { const { f, calls } = mk(['empty', 'empty']); const r = await f('/shop/wproduct.aspx?ISBN=9788900000001', null); ok(r.usedTotal == null && /두 번 다 못 읽음/.test(r.usedErr || '') && calls.filter((u) => /UsedShop/.test(u)).length === 2, '② 두 번 다 비면 usedErr', r.usedErr); }
  { const { f, calls } = mk(['full']); const r = await f('/shop/wproduct.aspx?ISBN=9788900000001', null); ok(r.usedTotal === 140 && !r.usedErr && calls.filter((u) => /UsedShop/.test(u)).length === 1, '③ 처음부터 읽히면 한 번만'); }
  const head = SRC.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/); ok(head && !/lookupBook|usedErr/.test(head[0]), '④ 수집기 머리는 그대로(본문만 바뀜)');
  console.log(bad ? `❌ tMKT1C_1113 ${bad}개 실패` : '✅ tMKT1C_1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
