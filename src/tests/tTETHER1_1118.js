/* tTETHER1_1118 — 일꾼 tether1(11/18 리드): 로거 테더링 11/17 16.27GB · 상세 읽기 23,553쪽에 ISBN 0
 *  ① 테더링 문 — 휴대폰 목록 밖·꺼 둔(off) USB 휴대폰은 지금까지 쓴 양에서 /phcap 문이 닫힘(예전엔 문이 없어 도우미 자기 한 달 상한까지 열려 있었음)
 *     · 목록에 켜진 휴대폰(p1·p2)의 문은 그대로 · 무시 목록·USB 아닌 연결(이더넷·와이파이)은 건드리지 않음
 *  ② 중고 상품 화면(판매자 중고 번호로 연 wproduct)에는 기본 정보의 ISBN 줄·books:isbn이 없음 → 제목 옆 검색 고리·미리보기·출간 알림·표지 이름 차례로 ISBN을 찾음
 *     · 새책 화면은 기본 정보 그대로(basic) · K코드·U+중고 번호는 ISBN 아님(null)
 *  ③ 이미 읽은 상세(bench_books)는 저장된 표지 이름으로 되살림(isbnFromPage)
 *  ④ 수집기가 되살리기를 부름(benchIsbnHeal·benchIsbnHealShop)
 * 실행: node src/tests/tTETHER1_1118.js (JSDOM=<jsdom 경로> 없으면 ②는 건너뛰지 않고 실패로 셈) · 화면 조각은 지어낸 것(손님 정보 없음) */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
require(process.env.RN_AS || path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;
const P = require(process.env.RN_PC || path.join(R, 'readnow-products-core.js'));
const G = 1073741824; const at = (s) => Date.parse(s + '+09:00');

console.log('① 목록 밖·꺼 둔 USB 휴대폰은 테더링 문이 지금 쓴 양에서 닫힘');
{
  const pool = { on: true, fb: 'p1', ignore: ['DESC:이더넷 2'], list: { p1: { name: '휴대폰 1', gb: 120, dev: 'USB\\A', order: 1 }, p2: { name: '휴대폰 2', gb: 120, dev: 'USB\\B', order: 2 }, p3: { name: '예전 휴대폰', gb: 30, dev: 'USB\\C', order: 3, off: true } },
    month: { '2026-11': { p1: { from: '2026-11-09', remainGB: 88 }, p2: { from: '2026-11-09', remainGB: 72 } } } };
  const doc = { budget: { mainPct: 87.5, pool } };
  const net = { capGB: 240, days: {}, phones: [
    { id: 'USB\\A', used: 3 * G, active: true, connected: true }, { id: 'USB\\B', used: 2 * G, active: false, connected: true },
    { id: 'USB\\C', used: 5 * G, active: false, connected: true }, { id: 'USB\\X', used: 1.5 * G, active: false, connected: true },
    { id: 'DESC:이더넷 2', used: 9 * G, connected: true }, { id: 'PCI\\WIFI', used: 4 * G, connected: true }],
    today: { key: '2026-11-18', tether: 1 * G, tiers: { main: 1 * G, gen: 0 }, phones: { 'USB\\A': 1 * G } } };
  const now = at('2026-11-18T09:00:00');
  const pc = AS.poolCalc(doc, net, now);
  ok(pc && Array.isArray(pc.closed), 'poolCalc가 닫을 휴대폰 목록(closed)을 냄', pc && pc.closed);
  const cl = (pc && pc.closed) || []; const byDev = Object.fromEntries(cl.map((c) => [c.dev, c]));
  ok(byDev['USB\\C'] && byDev['USB\\C'].why === 'off' && byDev['USB\\C'].id === 'p3', '꺼 둔 휴대폰(off) USB\\C는 closed · 까닭 off', byDev['USB\\C']);
  ok(byDev['USB\\X'] && byDev['USB\\X'].why === 'unlisted', '목록 밖 USB\\X는 closed · 까닭 unlisted', byDev['USB\\X']);
  ok(!byDev['USB\\A'] && !byDev['USB\\B'], '켜진 p1·p2는 closed에 없음', Object.keys(byDev));
  ok(!byDev['DESC:이더넷 2'] && !byDev['PCI\\WIFI'], '무시 목록·USB 아닌 연결은 closed에 없음', Object.keys(byDev));
  const caps = AS.poolCaps(pc) || {};
  ok(caps['USB\\C'] && caps['USB\\C'].lim === 5 * G && caps['USB\\C'].shut === 'off', 'USB\\C 문 = 지금 쓴 5GB에서 닫힘', caps['USB\\C']);
  ok(caps['USB\\X'] && caps['USB\\X'].lim === Math.round(1.5 * G) && caps['USB\\X'].shut === 'unlisted' && caps['USB\\X'].name === '', 'USB\\X 문 = 지금 쓴 1.5GB에서 닫힘 · 이름 안 바꿈', caps['USB\\X']);
  ok(caps['USB\\A'] && caps['USB\\A'].lim > 3 * G && !caps['USB\\A'].shut, '휴대폰 1 문은 예전처럼 하루 몫만큼 열림', caps['USB\\A'] && { lim: caps['USB\\A'].lim / G });
  ok(!caps['DESC:이더넷 2'] && !caps['PCI\\WIFI'], '이더넷·와이파이에는 문을 보내지 않음', Object.keys(caps));
  /* 고치기 전 판과 같은 결과인지(closed 없을 때) — 켜진 휴대폰 문은 한 바이트도 안 바뀜 */
  const pc0 = { ...pc, closed: [] }; const caps0 = AS.poolCaps(pc0) || {};
  ok(JSON.stringify(caps0['USB\\A']) === JSON.stringify(caps['USB\\A']) && JSON.stringify(caps0['USB\\B']) === JSON.stringify(caps['USB\\B']), 'p1·p2 문은 닫힘 셈과 상관없이 같음');
  const pcN = AS.poolCalc({ budget: { mainPct: 87.5, pool: { ...pool, ignore: undefined } } }, { ...net, phones: net.phones.filter((x) => !/^USB\\[CX]/.test(x.id)) }, now);
  ok(pcN && pcN.closed.length === 0, '모르는 휴대폰이 없으면 closed 0', pcN && pcN.closed);
}

console.log('② 중고 상품 화면 ISBN 대체 자리');
{
  let JSDOM = null; for (const b of [process.env.JSDOM, 'jsdom']) { if (JSDOM || !b) continue; try { JSDOM = require(b).JSDOM; } catch (e) {} } /* tRCK1114처럼 여러 곳에서 찾음 */
  for (const b of [__dirname, '/home/user/w/pw', '/home/claude/w/pw', '/home/user/.rn-nm', ...(process.env.NODE_PATH || '').split(':').filter(Boolean)]) { if (JSDOM) break; try { JSDOM = require(require.resolve('jsdom', { paths: [b] })).JSDOM; } catch (e) {} }
  ok(!!JSDOM, 'jsdom 있음(JSDOM=<경로>)');
  if (JSDOM) {
    const page = (body, head) => new JSDOM(`<!doctype html><html><head>${head || ''}</head><body>${body}</body></html>`).window.document;
    const used = (extra, cover) => `<div class="Ere_prod_titlewrap"><span class="Ere_bo_title">지어낸 책</span>${extra.search || ''}</div>
      <img id="CoverMainImage" src="${cover || 'https://image.aladin.co.kr/product/1/2/cover500/k012345678_1.jpg'}">
      <input type="hidden" class="hd_ISBN" value="${extra.hidden || 'U123456789'}">${extra.preview || ''}${extra.alarm || ''}
      <div class="conts_info_list1"><ul><li>300쪽</li><li>152*225mm</li></ul></div>`;
    const par = (h) => P.parseProductPage(page(h), 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123456789');
    let r = par(used({ search: '<a href="/search/wsearchresult.aspx?SearchTarget=All&SearchWord=9791185585482">같은 책</a>' }));
    ok(r.isbn13 === '9791185585482' && r.isbnFrom === 'search', '제목 옆 검색 고리 SearchWord=ISBN13 → search', { isbn: r.isbn13, from: r.isbnFrom });
    r = par(used({ preview: '<a href="https://www.aladin.co.kr/shop/book/wletslookViewer.aspx?ISBN=8972596809">미리보기</a>' }));
    ok(r.isbn13 === '9788972596806' && r.isbnFrom === 'preview', '미리보기 ISBN=ISBN10 → ISBN13 바꿈 · preview', { isbn: r.isbn13, from: r.isbnFrom });
    r = par(used({ alarm: `<a href="#" onclick="fn_newEbookAlarm2('9788995020531', 0); return false;">알림</a>` }));
    ok(r.isbn13 === '9788995020531' && r.isbnFrom === 'alarm', '출간 알림 인자 → alarm', { isbn: r.isbn13, from: r.isbnFrom });
    r = par(used({}, 'https://image.aladin.co.kr/product/1/2/cover500/8972596809_1.gif'));
    ok(r.isbn13 === '9788972596806' && r.isbnFrom === 'cover', '다른 자리 없으면 표지 이름(ISBN10) → cover', { isbn: r.isbn13, from: r.isbnFrom });
    r = par(used({ preview: '<a href="https://www.aladin.co.kr/shop/book/wletslookViewer.aspx?ISBN=K012345678">미리보기</a>' }));
    ok(r.isbn13 === null && r.isbnFrom === null, 'K코드(미리보기·표지)·U+중고 번호(hidden)는 ISBN 아님 → null', { isbn: r.isbn13, from: r.isbnFrom });
    r = par(used({ search: '<a href="/search/wsearchresult.aspx?SearchWord=9791185585481">틀린 검증 숫자</a>' }));
    ok(r.isbn13 === null, '검증 숫자 틀린 13자리는 받지 않음', r.isbn13);
    r = par(used({ search: '<a href="/search/wsearchresult.aspx?SearchWord=%EC%A7%80%EC%96%B4%EB%82%B8">낱말</a>', preview: '<a href="x/wletslookViewer.aspx?ISBN=8972596809">미리보기</a>' }));
    ok(r.isbn13 === '9788972596806' && r.isbnFrom === 'preview', '검색 고리가 낱말이면 다음 자리(미리보기)로', { isbn: r.isbn13, from: r.isbnFrom });
    const fresh = `<div class="Ere_prod_titlewrap"><span class="Ere_bo_title">지어낸 새책</span><a href="/search/wsearchresult.aspx?SearchWord=9791185585482">x</a></div>
      <img id="CoverMainImage" src="https://image.aladin.co.kr/product/1/2/cover500/8972596809_1.gif"><div class="conts_info_list1"><ul><li>200쪽</li><li>ISBN : 9788995020531</li></ul></div>`;
    r = P.parseProductPage(page(fresh), 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1');
    ok(r.isbn13 === '9788995020531' && r.isbnFrom === 'basic', '새책 화면은 기본 정보 ISBN 그대로(basic · 대체 자리 안 봄)', { isbn: r.isbn13, from: r.isbnFrom });
    r = P.parseProductPage(page('<div class="conts_info_list1"><ul><li>200쪽</li></ul></div>', '<meta property="books:isbn" content="9791185585482">'), 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=2');
    ok(r.isbn13 === '9791185585482' && r.isbnFrom === 'meta', 'books:isbn 칸이 있으면 meta', { isbn: r.isbn13, from: r.isbnFrom });
  }
}

console.log('③ 이미 읽은 상세 되살리기(표지 이름)');
{
  ok(P.isbnFromCover('https://image.aladin.co.kr/product/1/2/cover500/8972596809_1.gif') === '9788972596806', 'cover500 ISBN10 → ISBN13');
  ok(P.isbnFromCover('https://image.aladin.co.kr/product/1/2/cover/9791185585482_2.jpg') === '9791185585482', 'cover ISBN13 그대로');
  ok(P.isbnFromCover('https://image.aladin.co.kr/product/1/2/cover500/k012345678_1.jpg') === null, 'K코드 표지는 null');
  ok(P.isbnFromCover('') === null && P.isbnFromCover(null) === null, '빈 값 null');
  ok(P.isbnFromPage({ isbn13: null, images: { front: 'https://image.aladin.co.kr/product/1/2/cover200/8972596809_1.jpg' } }) === '9788972596806', 'isbnFromPage — 저장된 쪽(ISBN 없음)을 표지로 되살림');
  ok(P.isbnFromPage({ isbn13: '978-89-950205-3-1', images: { front: 'https://image.aladin.co.kr/product/1/2/cover500/8972596809_1.gif' } }) === '9788995020531', 'isbnFromPage — 있던 ISBN(줄표 섞임)이 먼저');
  ok(P.isbnFromPage(null) === null && P.isbnFromPage({}) === null, 'isbnFromPage — 빈 쪽 null');
  ok(P.isbnNorm('897259680X') === null && P.isbnNorm('8972596809') === '9788972596806', 'isbnNorm — ISBN10 검증 숫자 확인');
}

console.log('④ 수집기가 되살리기를 부름');
{
  const src = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8');
  ok(/async function benchIsbnHeal\(/.test(src) && /async function benchIsbnHealShop\(/.test(src), '되살리기 함수 둘이 있음');
  ok(/if \(b && b\.saved && !b\.isbn\) await benchIsbnHeal\(ref, b\)/.test(src), 'benchBook이 저장된 상세(ISBN 없음)를 표지로 되살림');
  ok(/await benchIsbnHealShop\(sc, name, st, parts\)/.test(src), '상세 읽기 한 바퀴 앞에 숍 하루 한 번 되살리기');
  const m = src.match(/async function benchIsbnHealShop\([\s\S]*?\n  }\n/); const body = m ? m[0] : '';
  ok(body && !/fetchText|GM_xmlhttpRequest|helperFetch|aladin\.co\.kr/.test(body), '되살리기는 알라딘을 열지 않음(저장된 bench_books만 읽음)', body.slice(0, 80));
  // (edkw3 11/18) 판 번호를 못 박지 않음 — 공용 파일의 지금 VERSION을 읽어 수집기 @require ?v=가 그 판인지 + 테더 고침이 든 판(0.19.11·0.18.33) 이상인지 봄(다음 판이 공용 판을 올려도 시험이 깨지지 않게)
  const verOf = (f) => ((fs.readFileSync(path.join(R, f), 'utf8').match(/const VERSION = '([0-9.]+)'/) || [])[1] || '');
  const vge = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return true; };
  const reqv = (f) => ((src.match(new RegExp('@require\\s+https://readnow\\.kr/' + f.replace(/[.]/g, '\\.') + '\\?v=([0-9.]+)')) || [])[1] || '');
  const pv = verOf('readnow-products-core.js'), av = verOf('readnow-autosched-core.js'), pr = reqv('readnow-products-core.js'), ar = reqv('readnow-autosched-core.js');
  ok(pr === pv && ar === av && vge(pv, '0.19.11') && vge(av, '0.18.33'), '수집기가 새 공용 파일 판을 부름', { products: [pr, pv], autosched: [ar, av] });
}

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과');
process.exit(bad ? 1 : 0);
