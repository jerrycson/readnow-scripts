// tSTDFILL_1120 — 🏷 시중가(정가) 빈 칸 채우기 (수집기 1.89.392 · 정범님 I-1120-1159-18 · 일꾼 sijung1)
//  까닭: 외국 책 등 시중가 칸이 빈 상품은 ✏ 상품 정보 수정 때 알라딘이 「시중가를 입력해 주세요」로 수정 전체를 막고 3번 뒤 매일 계획이 뺌(11/14 8권 · 11/20 HOME 1권)
//  ① 빈 칸만 채움 · 값이 있는 칸은 그대로 ② 값 차례 = 화면 원화 정가 → 정가 기록 → 판매가 ③ 외국도서 칸은 단위 '원' ④ 값이 없으면 채우지 않음
//  ⑤ 수정 길에 붙은 자리(등급보다 먼저 · 기록 한 줄 · 맡긴 일 stdFill · 막힘 글에 채운 값) ⑥ 상품 기록 → 도서 정가 찾기
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const CANDS = [path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', '..', 'src', 'readnow-collector.src.js'), path.join(__dirname, '..', '..', '..', 'src', 'readnow-collector.src.js'), process.env.RN_GIT_REPO && path.join(process.env.RN_GIT_REPO, 'src', 'readnow-collector.src.js')].filter(Boolean); // 시험 문지기는 src/tests를 다른 자리(w/pw)에 베껴 돌림
const s = fs.readFileSync(CANDS.find((f) => fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes('const PE_STD_MAX')) || CANDS[0], 'utf8');
const cut = (a, endMark) => { const i = s.indexOf(a); const j = s.indexOf(endMark, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };

const src = cut('  const PE_STD_MAX = 5e6;', '  const peStdCount = ');
const mk = (C) => new Function('C', src + '; return { peStdFill, peListPricePc };')(C);
const { peStdFill } = mk(() => null);
// 알라딘 수정 화면 모양(등록 화면과 같은 틀 — priceUnitForeignTr·priceUnit1..6·priceStdForeign·priceStdForeignResult·priceStd)
const page = ({ ps = '', pf = '', foreign = false, unit = '' } = {}) => { const dom = new JSDOM(`<form id="frmRecord"><table>
  <tr id="priceUnitWonTr" style="display:${foreign ? 'none' : ''}"><td><input id="priceStd" value="${ps}"></td></tr>
  <tr id="priceUnitForeignTr" style="display:${foreign ? '' : 'none'}"><td>${[1, 2, 3, 4, 5, 6].map((u) => `<input type="radio" name="priceUnit" id="priceUnit${u}" value="${u}"${String(unit) === String(u) ? ' checked' : ''}>`).join('')}<input id="priceStdForeign" value="${pf}"><input id="priceStdForeignResult" value=""></td></tr></table></form>`);
  const W = dom.window; const d = W.document; const rate = { 1: 1400, 2: 1500, 3: 1800, 4: 900, 5: 200, 6: 1 };
  W.priceStdForeignValid = (o) => { const u = (d.querySelector('input[name=priceUnit]:checked') || {}).value; const f = parseFloat(o.value); const r = isNaN(f) ? 0 : parseInt(f * rate[u] / 10) * 10; d.getElementById('priceStd').value = r; d.getElementById('priceStdForeignResult').value = r; };
  return { d, W, $: (x) => d.getElementById(x) }; };

// ① 값이 있으면 건드리지 않음
{ const p = page({ ps: '15000' }); ok(peStdFill(p.d, p.W, null) === null && peStdFill(p.d, p.W, { pl: 9000, sale: 3000 }) === null && p.$('priceStd').value === '15000', '① 국내 책 시중가 15,000원이 있으면 아무것도 안 함(덮지 않음)'); }
{ const p = page({ ps: '21000', pf: '15', foreign: true, unit: '1' }); ok(peStdFill(p.d, p.W, { pl: 9000, sale: 3000 }) === null && p.$('priceStdForeign').value === '15' && p.$('priceUnit1').checked, '① 외국 책 외화 정가 $15가 있으면 아무것도 안 함'); }
// ② 국내 빈 칸 — 정가 기록 먼저, 없으면 판매가
{ const p = page({ ps: '' }); const dry = peStdFill(p.d, p.W, null); const r = peStdFill(p.d, p.W, { pl: 12000, sale: 4500 }); ok(dry && dry.need && r && r.to === 12000 && r.from === 'pl' && p.$('priceStd').value === '12000', '② 시중가 빈 칸 → 우리 정가 기록 12,000원'); }
{ const p = page({ ps: '0' }); const r = peStdFill(p.d, p.W, { pl: 0, sale: 4500 }); ok(r && r.to === 4500 && r.from === 'sale' && p.$('priceStd').value === '4500', '② 시중가 0 · 정가 모름 → 지금 판매가 4,500원(부풀리지 않음)'); }
{ const p = page({ ps: '' }); const r = peStdFill(p.d, p.W, { pl: 99999999, sale: 4500 }); ok(r && r.to === 4500 && r.from === 'sale', '② 말이 안 되는 정가(5백만 원 넘음)는 쓰지 않고 판매가'); }
// ③ 외국도서 — 외화 칸이 비면 단위 '원' + 원화 값
{ const p = page({ ps: '', pf: '', foreign: true }); const r = peStdFill(p.d, p.W, { pl: 18000, sale: 7000 }); ok(r && r.fld === 'priceStdForeign' && r.to === 18000 && p.$('priceUnit6').checked && p.$('priceStdForeign').value === '18000' && p.$('priceStd').value === '18000' && p.$('priceStdForeignResult').value === '18000', '③ 외국 책 빈 칸 → 단위 원 · 18,000 · 원화 칸·환산 칸도 18,000'); }
{ const p = page({ ps: '23000', pf: '', foreign: true, unit: '1' }); const r = peStdFill(p.d, p.W, { pl: 18000, sale: 7000 }); ok(r && r.from === 'form' && r.to === 23000 && p.$('priceStdForeign').value === '23000' && p.$('priceUnit6').checked && p.$('priceStd').value === '23000', '③ 외화 칸만 비고 화면 원화 정가 23,000이 있으면 그 값(정가 기록보다 먼저) · 원화 칸 그대로'); }
{ const p = page({ ps: '', pf: '12.5', foreign: true, unit: '1' }); const r = peStdFill(p.d, p.W, { pl: 9000, sale: 3000 }); ok(r && r.from === 'foreign' && p.$('priceStd').value === '17500' && p.$('priceStdForeign').value === '12.5' && p.$('priceUnit1').checked, '③ 외화 $12.5가 있고 원화만 비면 외화로 다시 셈(17,500 · 외화·단위 그대로)'); }
{ const p = page({ ps: '' }); p.$('priceUnitForeignTr').remove(); const r = peStdFill(p.d, p.W, { pl: 11000, sale: 3000 }); ok(r && r.fld === 'priceStd' && p.$('priceStd').value === '11000', '③ 외국도서 줄이 없는 화면은 외화 칸을 보지 않고 원화 칸만'); }
// ④ 값이 하나도 없으면 채우지 않음
{ const p = page({ ps: '' }); const r = peStdFill(p.d, p.W, { pl: 0, sale: 0 }); ok(r && r.skip && p.$('priceStd').value === '', '④ 정가·판매가 다 모르면 채우지 않고 까닭만'); }

// ⑤ 수정 길에 붙은 자리
const pe = cut('async function prdEditPc(ref, v, id)', 'window.__rnPrdEdit = (ref, v, id)');
const iS = pe.indexOf('if (peStdFill(d, W, null))'), iG = pe.indexOf("if ('grade' in ch) { const gg"), iB = pe.indexOf('const B = cur2 || cur'), iSub = pe.indexOf("W.frmRecord_submit_C2C(false, '6', true)");
ok(iS > 0 && iB < iS && iS < iG && iG < iSub, '⑤ 채우기는 저장 직전 값(B)을 읽은 뒤 · 등급 바꾸기(정가 필요)보다 먼저 · 보내기 전');
ok(/sale: ch\.price \?\? B\.price/.test(pe) && /await peListPricePc\(v, lid\)/.test(pe), '⑤ 정가 기록을 찾고 없으면 바꿀 판매가(없으면 지금 판매가)');
ok(/window\.__rnLog\('수집기', 'info', `\$\{m\}/.test(pe) && /🏷 시중가 빈 칸 채움 — /.test(pe) && /이 PC 오늘 \$\{nTd\}번째/.test(pe) && /ref\.set\(\{ stdFill: stdF \}/.test(pe) && /k: 'std', st: 'fill'/.test(pe), '⑤ 채운 값·출처·오늘 몇 번째를 진단 기록 한 줄·진행 기록·맡긴 일(stdFill)에 남김');
ok(/\(시중가 빈 칸을 \$\{stdF\.to\}원으로 채웠는데도\)/.test(pe) && /let err = null, al = \[\], stdF = null;/.test(pe), '⑤ 채웠는데도 막히면 막힘 글에 채운 값을 붙임');

// ⑥ 정가 찾기 — 상품 기록 → 도서
(async () => {
  const fake = (docs) => (col) => ({ doc: (id) => ({ get: async () => { const x = (docs[col] || {})[id]; return { exists: !!x, data: () => x }; } }), where: (f, op, vals) => ({ limit: () => ({ get: async () => { const hit = Object.values(docs[col] || {}).filter((x) => vals.includes(x[f])); return { empty: !hit.length, docs: hit.map((x) => ({ data: () => x })) }; } }) }) });
  const A = mk(fake({ prd_listings: { aladin_1: { listingId: '111', priceList: 16000 } } })); const a = await A.peListPricePc({ listingKey: 'aladin_1' }, '111');
  ok(a.pl === 16000 && a.src === '상품 기록 정가', '⑥ 맡긴 일의 상품 열쇠 → 상품 기록 정가');
  const B2 = mk(fake({ prd_listings: { aladin_2: { listingId: 222, bookId: 'b9' } }, prd_books: { b9: { priceList: 27000 } } })); const b = await B2.peListPricePc({ listingId: '222' }, '222');
  ok(b.pl === 27000 && b.src === '도서 정가', '⑥ 열쇠 없는 조회수 실험 길 · 상품번호(숫자로 저장됨)로 찾고 정가가 없으면 도서 정가');
  const C3 = mk(() => { throw new Error('끊김'); }); const c = await C3.peListPricePc({ listingKey: 'x' }, '1');
  ok(c.pl === 0, '⑥ 기록을 못 읽어도 멈추지 않음(판매가로 넘어감)');
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
