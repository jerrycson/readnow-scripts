const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'); const fs = require('fs');
const src = fs.readFileSync(__dirname + '/benchcol.js', 'utf8'); const fn = src.slice(src.indexOf('function benchParse'), src.indexOf('  async function benchJob'));
(async () => { const br = await chromium.launch(); const p = await br.newPage();
  const box = (u, b, t, pr, g) => `<div class="ss_book_box"><table><tr><td><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${u}"><img></a></td><td><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${u}" class="bo3"><b>[중고] ${t}</b></a><br>저자 | 출판사 | 2019년 3월<br><span>정가 25,000원</span> <span class="ss_p2"><b>${pr}원</b></span> 품질 : ${g}<br><a href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${b}">새상품 보기</a></td></tr></table></div>`;
  const rowT = (u, t, pr, g) => `<tr><td><a href="/shop/wproduct.aspx?ItemId=${u}">${t}</a></td><td>[중고-${g}]</td><td>${pr}원</td></tr>`;
  const html1 = `<html><body><div id="list">${box(901, 11, '관광서비스의 이해', '6,000', '상')}${box(902, 12, '너만 모르는 진실', '12,500', '최상').replace('</td></tr>', ' <span class="used_label_04">최저가</span></td></tr>')}</div></body></html>`;
  const html2 = `<html><body><table>${rowT(801, '책 하나', '3,000', '중')}${rowT(802, '책 둘', '9,900', '상')}</table></body></html>`;
  for (const h of [html1, html2]) { await p.setContent(h); console.log(JSON.stringify(await p.evaluate(`(${fn.replace(/^function benchParse/, 'function')})(document)`))); }
  await br.close(); })();
