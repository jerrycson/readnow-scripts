/* tBKFAST1113 — 📖 책 정보 모으기 빠르게(cloud/bookinfo.js 0.1.7 · bkfast 11/13): 예스24 번호 아는 책 먼저 · 그려 읽기 끔 · 막힘 화면 감지 · 다시 떠도 하루 쓴 수·쉼 이어받기 · 책 목록 기억
 * 돌리기: node src/tests/tBKFAST1113.js (node만 · 인터넷 없음 · 가짜 Firestore) */
'use strict';
const path = require('path'); const REPO = process.env.RN_REPO || path.resolve(__dirname, '../..');
const B = require(path.join(REPO, 'cloud/bookinfo.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ❌ ' + m); } };

console.log('① 막힘 화면 감지');
ok(B.isBlockPage('<html><body>비정상적인 접근이 감지되었습니다. 자동입력 방지 문자를 입력해 주세요</body></html>'), '작은 캡차·접근 제한 화면 = 막힘');
ok(!B.isBlockPage('<html>' + 'x'.repeat(70000) + ' captcha </html>'), '큰 상품 화면(로그인 칸 등 captcha 낱말) = 막힘 아님');
ok(!B.isBlockPage('<script>var recaptcha=1;</script><div>저자 소개 글</div>'), '스크립트 안 낱말만이면 막힘 아님');
ok(!B.isBlockPage(''), '빈 글 = 막힘 아님');

console.log('② 차례 — 판매 중 책 안에서 예스24 번호 앎 → 교보 번호 앎 → 그 밖');
{ const now = Date.parse('2026-11-13T12:00:00Z'); const C = [{ isbn: '9788900000101', st: 'act', reg: '2026-11-01T00:00:00Z' }, { isbn: '9788900000102', st: 'act', reg: '2026-10-01T00:00:00Z' }, { isbn: '9788900000103', st: 'act', reg: '2026-09-01T00:00:00Z' }, { isbn: '9788900000104', st: 'other' }, { isbn: '9788900000105', st: 'other' }];
  const R = { '9788900000103': 0, '9788900000102': 1, '9788900000105': 0 }; const r = B.planQ(C, new Map(), now, (c) => (c.isbn in R ? R[c.isbn] : 2));
  ok(JSON.stringify(r.list.map((x) => x.isbn.slice(-1))) === JSON.stringify(['3', '2', '1', '5', '4']), `차례 ${r.list.map((x) => x.isbn.slice(-1)).join(',')}`);
  ok(JSON.stringify(B.planQ(C, new Map(), now).list.map((x) => x.isbn.slice(-1))) === JSON.stringify(['1', '2', '3', '4', '5']), '순위가 없으면 예전 차례 그대로'); }

console.log('③ 기억 줄 글');
{ const c = { isbn: '9788900000101', st: 'act', reg: '2026-11-01T00:00:00Z', bookId: '123' }; const c2 = B.candOf(B.candLine(c)); ok(c2.isbn === c.isbn && c2.st === 'act' && c2.reg === c.reg && c2.bookId === '123', '책 목록 줄 왕복');
  const h = B.haveOf(B.haveLine('9788900000101', { nx: 123, tries: 2, full: true, f: ['intro', 'toc'], pvN: 3, pvAt: 'x' })); ok(h[0] === '9788900000101' && h[1].nx === 123 && h[1].tries === 2 && h[1].full && h[1].f.join() === 'intro,toc' && h[1].pvN === 3 && h[1].pvAt, '가진 책 줄 왕복');
  ok(B.candOf('abc|1||') === null && B.haveOf('x|1') === null, '잘못된 줄은 버림');
  const parts = B.chunks(Array.from({ length: 100 }, (x, i) => 'l' + i), 50); ok(parts.length > 5 && parts.join('\n').split('\n').length === 100, `나눠 담기 ${parts.length}조각`);
  ok(B.idxGot('2026-11-10') && !B.idxGot('E 2026-11-10 1') && !B.idxGot(null), '색인 값: 받은 날짜만'); }
ok(B.PACE_DEF.aladin.cap >= 4000 && B.PACE_DEF.aladin.min >= 6000, '알라딘 하루 4,000 · 간격 6초부터');

console.log('④ 가짜 Firestore 회차');
(async () => { const store = new Map();
  const mkDoc = (col, id) => ({ col, id, get: async () => { const v = store.get(col + '/' + id); return { exists: !!v, id, data: () => v }; }, set: async (v, o) => { const k = col + '/' + id; const cur = store.get(k) || {}; const clean = JSON.parse(JSON.stringify(v, (kk, x) => (x && x._fv ? undefined : x))); store.set(k, o && o.merge ? { ...cur, ...clean } : clean); } });
  const reads = { prd_listings: 0, bk_info: 0 };
  const qOf = (col, rows) => { const q = { where() { return q; }, select() { return q; }, limit() { return q; }, startAfter() { return { get: async () => ({ empty: true, size: 0, docs: [], forEach() {} }) }; }, get: async () => { reads[col] = (reads[col] || 0) + 1; const docs = rows().map(([id, v]) => ({ id, data: () => v, ref: mkDoc(col, id) })); return { empty: !docs.length, size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } }; return q; };
  const C = (col) => ({ doc: (id) => mkDoc(col, id), ...qOf(col, () => [...store.entries()].filter(([k]) => k.startsWith(col + '/')).map(([k, v]) => [k.slice(col.length + 1), v])) });
  const db = { getAll: async (...a) => Promise.all(a.filter((x) => x && x.get).map((r) => r.get())) };
  const A = '9788900000201', Bk = '9788900000202', Cc = '9788900000203';
  store.set('prd_listings/L1', { isbn13: Bk, status: '판매중', active: true, firstSeenAt: '2026-10-12T00:00:00Z', bookId: 'B1', title: '번호 모름' });
  store.set('prd_listings/L2', { isbn13: A, status: '판매중', active: true, firstSeenAt: '2026-09-12T00:00:00Z', bookId: 'B2', title: '예스24 번호 앎' });
  store.set('prd_listings/L3', { isbn13: Cc, status: '판매중', active: true, firstSeenAt: '2026-08-12T00:00:00Z', bookId: 'B3', title: '교보 번호 앎' });
  store.set('ext_index/yes24_' + (+A.slice(-2) % 8), { m: { [A]: '2026-11-10', [Bk]: 'E 2026-11-10 1' } });
  store.set('ext_index/kyobo_' + (+Cc.slice(-2) % 8), { m: { [Cc]: '2026-11-09' } });
  store.set('ext_basic/' + A, { src: { yes24: { d: { id: '555' } } } });
  const Y = (isbn) => `<html><head><meta property="og:title" content="책 | 저자 | 출판 - 예스24"></head><body><div id="infoset_specific"><table><tr><th>ISBN13</th><td>${isbn}</td></tr></table></div><div id="infoset_introduce"><h4 class="tit_txt">책소개</h4><div>소개 글입니다</div></div><div id="infoset_toc"><h4 class="tit_txt">목차</h4><div>1장<br>2장</div></div><div id="infoset_authorGrp"><h4 class="tit_txt">저자 소개</h4><div class="authorInfoGrp"><div class="author_name">저 : 김</div><span class="author_info info_origin">작가 소개</span></div></div><div id="infoset_deli"></div></body></html>`;
  const urls = []; let renders = 0; const resp = (u, t, st) => ({ ok: (st || 200) < 400, status: st || 200, url: u, text: async () => t, headers: { get: () => 'text/html' } });
  const fetchFn = async (u) => { urls.push(u); if (/Goods\/555/.test(u)) return resp(u, Y(A)); if (/kyobobook/.test(u)) return resp(u, '<html><body>비정상적인 접근이 감지되었습니다</body></html>'); return resp(u, '', 404); };
  const mk = (extra) => B.makeBookInfo({ db, C, FV: {}, log: () => {}, W: () => ({ uploadedAt: { _fv: 1 } }), fetchFn, rnd: () => 0.5, render: async () => { renders++; return { ok: true, html: '' }; }, bucket: () => ({ file: () => ({ save: async () => {} }) }), ...(extra || {}) });
  const M = mk(); const r = await M.tick(4000);
  ok(M.state.q.list.map((x) => x.isbn).join() === [A, Cc, Bk].join(), `차례: 예스24 번호 앎 → 교보 번호 앎 → 번호 모름(${M.state.q.list.map((x) => x.isbn.slice(-1)).join(',')})`);
  const dA = store.get('bk_info/' + A); ok(dA && dA.full && dA.srcs.yes24.ok && dA.srcs.yes24.via === 'ext', '예스24 한 번 받기로 다 참');
  ok(renders === 0, '예스24 검색 그려 읽기 안 함(설정 y24render 없으면)');
  ok((M.state.y24st.noId || 0) >= 1 && M.state.y24st.ext >= 1, `예스24 번호 찾기 기록: ${JSON.stringify(M.state.y24st)}`);
  ok(M.state.idxN && M.state.idxN.y24 === 1 && M.state.idxN.kb === 1, `색인: 예스24 1 · 교보 1 (못 읽음 'E'는 뺌) ${JSON.stringify(M.state.idxN)}`);
  ok(M.state.blk.kyobo && M.state.blk.kyobo.n >= 1 && M.state.pace.kyobo.err >= 1, `교보 막힘 화면 감지 → 오류로 셈·간격 늘림(간격 ${M.state.pace.kyobo.gap}ms)`);
  ok(!urls.some((u) => /aladin/.test(u)), '막힘·번호 모름이면 알라딘으로 넘기지 않음(어느 출처도 답 못 함 → 6시간 뒤)');
  ok(store.get('bk_info/_cache_c') && store.get('bk_info/_cache_c').lines === 3, '책 목록을 기억 문서에');
  await M.state; /* 회차 기록(bkinfo_run) 꼴 */ ok(r.n >= 1 && store.get('app_settings/bkinfo_run') && store.get('app_settings/bkinfo_run').used, '회차 기록에 오늘 쓴 수');

  /* 다시 뜬 것처럼 — 오늘 쓴 수·쉼을 이어받고, 책 목록은 기억에서 */
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  store.set('app_settings/bkinfo_run', { at: 'x', used: { [day]: { aladin: 3999, kyobo: 10 } }, pace: { kyobo: { gap: 9000, pauseUntil: new Date(Date.now() + 3600e3).toISOString() } } });
  store.set('bk_info/_cache_h', { n: 0, at: 0 }); /* 가진 책 기억 없음 → 전체 */
  const pl0 = reads.prd_listings; const M2 = mk(); await M2.tick(2000);
  ok(M2.state.candVia === 'cache' && M2.state.cands.length === 3, `다시 떠도 책 목록은 기억에서(${M2.state.candVia})`);
  ok(M2.state.used.aladin === 3999 && M2.state.used.kyobo >= 10, `오늘 쓴 수 이어받음 ${JSON.stringify(M2.state.used)}`);
  ok(M2.state.pace.kyobo.pauseUntil > Date.now() && M2.state.pace.kyobo.gap === 9000, '쉬던 출처(교보)는 다시 떠도 쉼');
  const dg = await M2.diag(); ok(dg.v === B.VER && dg.real && 'h1' in dg.real && dg.via.cands === 'cache' && dg.idx, `진단: 실제 속도 칸·기억 여부 ${JSON.stringify({ real: dg.real, via: dg.via })}`);
  /* 가진 책 기억 */
  M2.state.haveCacheAt = 0; await M2.tick(500); const hc = store.get('bk_info/_cache_h'); ok(hc && hc.n >= 1 && hc.lines >= 1, `가진 책 표 기억(${hc && hc.lines}줄)`);
  const M3 = mk(); await M3.tick(500); ok(/^cache\+/.test(M3.state.haveVia || '') && M3.state.have.get(A) && M3.state.have.get(A).full, `가진 책도 기억 + 바뀐 것만(${M3.state.haveVia})`);
  ok(M3.state.have.size === M2.state.have.size && ![...M3.state.have.keys()].some((k) => k.startsWith('_')), '기억 문서(_cache)는 책으로 세지 않음');
  /* (0.1.9) 예스24 글 검색: 목록 틀만 오고 번호가 없으면 그 길을 계속 쓰지 않음 */
  { const M4 = mk({ rnd: () => 0, fetchFn: async (u) => { urls.push(u); if (/product\/search/.test(u)) return resp(u, '<div id="yesSchList"><ul></ul></div>'); return resp(u, '', 404); } }); await M4.testOne(Bk);
    ok(M4.state.y24Get === false && (M4.state.y24st.listNoId || 0) >= 1 && urls.some((u) => /order=SINDEX_ONLY/.test(u)), `목록 틀만 → 글 검색 계속 안 씀(${JSON.stringify(M4.state.y24st)})`); }
  console.log(`\n${fail ? '❌' : '✓'} tBKFAST1113: ${pass}개 통과 · ${fail}개 실패`); process.exit(fail ? 1 : 0); })().catch((e) => { console.log('❌ 예외', e); process.exit(1); });
