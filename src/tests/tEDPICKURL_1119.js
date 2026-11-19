// tEDPICKURL — (11/19 정범님 I-1118-2245-28.3 판 ④ · 걸음 (나)) 🔗 후보에 없는 판을 알라딘 주소로 붙여 정함
//  웹앱: 주소 꼴 검사(알라딘 주소·ItemId) · 엉뚱한 주소 막음 · 그 상품을 읽지 못하면 저장 안 함 · 제목이 많이 다르면 ⚠ 경고 뒤 한 번 더 · edSetPick(src 'url') · 되돌리기 단추 · 주소로 정한 판 줄
//  수집기: 주소로 정한 판이 검색 후보에 없으면 그 상품 중고 화면을 한 장 더 읽어 후보에 더함 → 공용 코어 edDecide가 사람 판(srch)으로 따름
// 실행: node tEDPICKURL_1119.js · 시험 자료는 가짜 상품만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'readnow-products-core.js')));
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.join(ROOT, 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (src, a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return src.slice(i, j); };
const P = require(path.join(ROOT, 'readnow-products-core.js'));
const BLK = cut(T, '/* (invimp2 판 ④ 걸음 (나)', 'function edCandHead()');
const S = { plist: new Map(), nbm: new Map(), user: { email: 't@x' } }; const toasts = []; const picks = []; const looks = []; let asks = []; let askAns = []; let textAns = null; let LOOK = {};
const env = { S, PRDF: () => P, edSplitTxt: () => "", toast: (m, e) => toasts.push([m, e]), num: (n) => String(n), won: (n) => n + '원', esc: (x) => String(x), errKo: (e) => e.message,
  edChMin: (c) => (c.channels && c.channels.seller ? c.channels.seller.min : null), edChN: (c) => (c.channels && c.channels.seller ? c.channels.seller.count : 0), hlSpecial: (x) => x,
  edCandsOf: (l) => l._C || [], edPickOf: (l) => ((S.nbm.get(l.id) || {}).edPick) || null, edCandRow: (l, c) => `<div data-edpick="${l.id}" data-edit="${c.itemId}"></div>`, edHideHtml: () => '',
  edSetPick: async (id, pick) => { picks.push([id, pick]); S.nbm.set(id, { ...(S.nbm.get(id) || {}), edPick: pick }); },
  cloudCall: async (p, b) => { looks.push([p, b]); const id = b.itemIds[0]; if (LOOK.throw) throw new Error('끊김'); return LOOK[id] ? { items: { ['id_' + id]: LOOK[id] } } : { items: {}, errs: { ['id_' + id]: '알라딘에서 이 책을 못 찾음' } }; },
  ask: async (m, o) => { asks.push([m, o]); return askAns.length ? askAns.shift() : true; }, askText: async () => textAns };
const names = Object.keys(env); const F = new Function(...names, BLK + '; return { edUrlId, edUrlCheck, edUrlRow, edUrlBtn, edPickByUrl, edListRow, edUrlOut };')(...names.map((k) => env[k]));
const L = (id, t, o) => { const l = { id, title: t, price: 15000, ...o }; S.plist.set(id, l); return l; };
(async () => {
  console.log('① 주소 꼴 검사');
  { const g = (s) => F.edUrlId(s); ok(g('https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123456789').id === '123456789', '알라딘 상품 주소 → ItemId');
    ok(g('www.aladin.co.kr/shop/wproduct.aspx?start=we&ItemId=5550001').id === '5550001', '앞에 https 없어도 · 인자 순서 달라도'); ok(g('https://m.aladin.co.kr/m/mproduct.aspx?ItemId=777777').id === '777777', '모바일 주소'); ok(g(' 98765432 ').id === '98765432', 'ItemId 숫자만');
    ok(/알라딘 주소가 아님/.test(g('https://www.yes24.com/Product/Goods/123456').err), '다른 가게 주소는 막음'); ok(/알라딘 주소가 아님/.test(g('https://aladin.co.kr.evil.example/x?ItemId=1234567').err), '알라딘을 흉내 낸 주소 막음');
    ok(/ItemId/.test(g('https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=x').err), '상품 번호 없는 알라딘 주소 막음'); ok(g('').err && g('12').err, '빈칸·너무 짧은 숫자 막음'); }
  console.log('② 정함 걸음 — 읽어 보여 준 뒤에만 저장');
  { const l = L('a', '어린 왕자 (리커버 특별판)'); LOOK = { '1001': { title: '어린 왕자 (리커버 특별판)', isbn13: '9790000000011', publisher: '가짜 출판사' } };
    asks = []; askAns = [true]; const r = await F.edPickByUrl('a', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=1001');
    ok(looks.length === 1 && looks[0][0] === '/lookup' && looks[0][1].itemIds[0] === '1001', '클라우드 /lookup으로 그 상품을 한 번 읽음'); ok(asks.length === 1 && /9790000000011/.test(asks[0][0]) && /리커버 특별판/.test(asks[0][0]) && asks[0][1].keep, '확인 칸에 제목·ISBN (바깥 눌러도 안 닫힘)', asks[0]);
    ok(/알라딘 등록·재고·판매가는 그대로/.test(asks[0][0]), '확인 칸에 시장 기준 판만 바뀐다고 밝힘'); ok(r.ok && picks.length === 1 && picks[0][1].src === 'url' && picks[0][1].itemId === '1001' && picks[0][1].isbn === '9790000000011' && !picks[0][1].warn, 'edSetPick(src url · ItemId · ISBN)', picks[0]); }
  { picks.length = 0; asks = []; askAns = [false]; const r = await F.edPickByUrl('a', '1001'); ok(r.cancel && picks.length === 0, '확인에서 취소하면 저장 안 함'); }
  { picks.length = 0; asks = []; const t0 = toasts.length; const r = await F.edPickByUrl('a', '2002'); ok(r.err && picks.length === 0 && asks.length === 0 && /못 읽음/.test(toasts.slice(t0).map((x) => x[0]).join(' ')), '그 상품을 못 읽으면 묻지도 저장하지도 않음'); }
  { picks.length = 0; LOOK.throw = 1; const r = await F.edPickByUrl('a', '1001'); ok(r.err && picks.length === 0, '클라우드가 끊겨도 저장 안 함'); LOOK.throw = 0; }
  { picks.length = 0; looks.length = 0; const r = await F.edPickByUrl('a', 'https://www.yes24.com/Product/Goods/1'); ok(r.err && looks.length === 0 && picks.length === 0, '엉뚱한 주소는 읽지도 않음'); }
  { picks.length = 0; textAns = null; const r = await F.edPickByUrl('a'); ok(r === null && picks.length === 0, '붙여 넣기 칸에서 취소'); }
  console.log('③ 엉뚱한 책 — ⚠ 경고 뒤 한 번 더');
  { L('b', '토지 1 (한정판)'); LOOK['3003'] = { title: '수학의 정석 기본편', isbn13: '9790000000028' }; picks.length = 0; asks = []; askAns = [true, false];
    const r = await F.edPickByUrl('b', '3003'); ok(asks.length === 2 && /⚠ 다른 책일 수 있음/.test(asks[0][0]) && /한 번 더/.test(asks[1][0]), '제목이 많이 다르면 경고 · 한 번 더 물음', asks.map((x) => x[0].slice(0, 60)));
    ok(r.cancel && picks.length === 0, '두 번째에서 취소하면 저장 안 함'); asks = []; askAns = [true, true]; const r2 = await F.edPickByUrl('b', '3003'); ok(r2.ok && picks[0][1].warn && picks[0][1].warn.length, '두 번 다 확인하면 경고를 달아 저장', picks[0]);
    const ck = F.edUrlCheck({ title: '해리 포터 1 (리커버)' }, { title: '해리 포터 2 (리커버)' }); ok(ck.warn.includes('권·구성 다름'), '권 번호가 다르면 경고', ck); }
  console.log('④ 판본 확인 줄 — 단추 · 주소로 정한 판 줄 · 되돌리기');
  { const l = L('c', '데미안 (리커버)'); l._C = [{ itemId: '11', t: '데미안' }]; S.nbm.set('c', {}); let h = F.edListRow(l); ok(/data-edurl="c"/.test(h) && /후보에 없는 판/.test(h), '「＋ 후보에 없는 판 — 알라딘 주소 붙여 넣기」 단추'); ok(!/edurl-r/.test(h), '정하기 전엔 주소 판 줄 없음');
    S.nbm.set('c', { edPick: { itemId: '4004', t: '데미안 (리커버 한정)', isbn: '9790000000035', src: 'url', by: 't@x' } }); h = F.edListRow(l);
    ok(/edurl-r/.test(h) && /ItemId=4004/.test(h) && /주소로 정함/.test(h) && /9790000000035/.test(h) && /수집기 다음 바퀴/.test(h), '후보에 없는 주소 판 — 따로 한 줄(제목·ISBN·시장은 다음 바퀴)'); ok(/data-edundo="c"/.test(h), '되돌리기 단추');
    S.nbm.set('c', { edPick: { itemId: '4004', t: 'x', src: 'url' }, cands: [{ itemId: '4004', channels: { seller: { min: 12000, count: 4 } } }] }); h = F.edListRow(l); ok(/최저 12000원/.test(h) && /중고 4/.test(h), '수집기가 읽은 뒤엔 그 판 시장 값');
    l._C = [{ itemId: '4004', t: 'x' }]; ok(!F.edUrlOut(l, l._C, S.nbm.get('c').edPick), '후보 목록에 들면 따로 줄을 안 그림(후보 줄이 「정한 판」)'); }
  console.log('⑤ 수집기 — 후보 밖 주소 판을 후보에 더하고 사람 판으로');
  { const C = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8'); const fn = cut(C, '    async function nbUrlCand(hp)', '\n    const nbAU');
    ok(/hpU && edOn && !cands\.some/.test(C) && /cands\.push\(await nbUrlCand\(hpU\)\)/.test(C), '판정 전에 주소 판을 후보에 더함');
    const pages = []; const doc = { kind: 'used' }; const P2 = { ...P, parseUsedPage: () => ({ mins: { '판매자 중고': { count: 3, min: 9000 }, '알라딘 직접 배송 중고': { count: 1, min: 11000 }, '광활한 우주점': { count: 2, min: 10000 } } }) };
    const nbUrlCand = new Function('getDoc', 'P', fn.trim() + '; return nbUrlCand;')(async (u) => { pages.push(u); return { doc }; }, P2);
    const c = await nbUrlCand({ itemId: '5005', t: '어린 왕자 (리커버 특별판)', src: 'url' }); ok(pages.length === 1 && /wuseditemall\.aspx\?ItemId=5005&TabType=0/.test(pages[0]) && /^https:\/\/www\.aladin\.co\.kr\//.test(pages[0]), '그 상품 공개 중고 화면 한 장만', pages);
    ok(c.itemId === '5005' && c.channels.seller.min === 9000 && c.channels.aladin.min === 11000 && c.channels.store.min === 10000 && c.byUrl && c.cov === 1, '후보 한 줄(판매자·알라딘 직접·매장 최저가)', c);
    const our = { title: '어린 왕자 (리커버 특별판)', bookId: '77', set: false, unreg: false };
    const base = [{ itemId: '6006', title: '어린 왕자 (리커버 특별판)', cov: 1, vol: true }, { itemId: '6007', title: '어린 왕자', cov: 0.9, vol: true }];
    const d0 = P.edDecide(our, { src: 'usedSearch', cands: base }, { th: 0.9, pick: { itemId: '5005' } }); ok(!d0.human, '(옛 길) 후보 밖 사람 판은 무시됐음', d0.use);
    const d1 = P.edDecide(our, { src: 'usedSearch', cands: [...base, c] }, { th: 0.9, pick: { itemId: '5005', src: 'url' } }); ok(d1.use === 'srch' && d1.human && d1.ids.length === 1 && d1.ids[0] === '5005', '더한 뒤 — 그 판 시장(srch · 사람 판)', d1);
    const d2 = P.edDecide(our, { src: 'usedSearch', cands: [...base, { ...c, title: '' }] }, { th: 0.9, pick: { itemId: '5005', src: 'url' } }); ok(d2.use === 'srch' && d2.human, '제목이 비어도 사람 판을 따름'); }
  console.log(bad ? '❌ ' + bad + '개 실패' : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
