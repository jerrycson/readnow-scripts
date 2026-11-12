// tSHOP9_1112 — (11/12 shop9) 🛍 우리숍 👤 손님 계정 · ⭐ 리뷰(별점 반 별·100자평·긴 글·사진·공감·신고·정렬) · 📚 서재·독서 목표·북리스트·밑줄·팔로우·알림 신청 · 🧪 시험 계정
//   ① 순수 셈(cloud/shop-acct.js) ② 클라우드 창구(가짜 Firestore — 겹친 칸 merge가 진짜처럼 · 진짜 http) ③ 화면(RN_UI=1 · playwright · 휴대폰 390px·PC 1280px 사진 → RN_SHOT 폴더)
// 실행: node src/tests/tSHOP9_1112.js · 화면까지: RN_UI=1 RN_SHOT=<폴더/> NODE_PATH=/opt/node-tools/node_modules node src/tests/tSHOP9_1112.js
// 시험 자료에 실제 손님 정보 없음(손님A · 010-0000-0000 · 메일은 .invalid/example.com)
const fs = require('fs'); const path = require('path'); const http = require('http'); const { Readable } = require('stream');
process.env.BQ_PW_IT = '2000'; /* 시험만 빠르게(실제 12만 번) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const SH = require(path.join(ROOT, 'cloud/shop.js')); const AC = require(path.join(ROOT, 'cloud/shop-acct.js'));
(async () => {
console.log('① 순수 셈');
{ const h = AC.pwHash('abcd1234'); ok(/^p2\$2000\$[0-9a-f]{32}\$[0-9a-f]{64}$/.test(h) && AC.pwOk('abcd1234', h) && !AC.pwOk('abcd1235', h) && !h.includes('abcd1234'), '비밀번호: PBKDF2 해시만 · 맞으면 참 · 틀리면 거짓');
  ok(AC.pwWhy('abc') && AC.pwWhy('abcdefgh') && !AC.pwWhy('abcd1234'), '비밀번호 8자·영문+숫자');
  ok(!AC.nickWhy('책읽는손님') && AC.nickWhy('가') && AC.nickWhy('01000000000') && AC.nickWhy('운영자님') && AC.nickWhy('a<b>') && AC.nickWhy('🧪가짜'), '별명: 2~12자 · 전화 번호·가게 흉내·꺾쇠·🧪 막음');
  ok(AC.kOf({ id: 'aladin_1', isbn: '9788900000001' }) === 'i9788900000001' && AC.kOf({ id: 'aladin_1' }) === 'daladin_1' && AC.K_RE.test('i9788900000001') && !AC.K_RE.test('i123'), '리뷰 열쇠 = ISBN(같은 책 다른 실물도 이어짐) · 없으면 상품 번호');
  const c = AC.rvCheck({ st: 9, s100: '좋아요 '.repeat(5), body: '' }); ok(c.v && c.v.st === 9 && !c.v.body, '리뷰 검사: 반 별(9 = ★4.5) · 긴 글 선택');
  ok(/별점/.test(AC.rvCheck({ st: 0, s100: '좋아요' }).err) && /100자/.test(AC.rvCheck({ st: 6, s100: '가'.repeat(101) }).err) && /20자/.test(AC.rvCheck({ st: 6, s100: '좋아', body: '짧음' }).err) && /주소/.test(AC.rvCheck({ st: 6, s100: 'http://x.com 와' }).err) && /전화/.test(AC.rvCheck({ st: 6, s100: '연락 010-0000-0000' }).err), '리뷰 검사: 별점 없음·101자·짧은 긴 글·주소·전화 막음');
  const S = AC.rvStats([{ st: 10, buy: 1 }, { st: 9 }, { st: 4 }, { st: 1, ph: ['x'] }]); ok(S.n === 4 && S.avg === 3 && S.d.join() === '1,1,0,0,2' && S.buy === 1 && S.ph === 1, '별점 요약: 평균(별 다섯 기준)·분포(반 별은 올림)·구매·사진', S);
  const L = [{ rid: 'a', st: 4, lk: 1, at: '2026-11-01' }, { rid: 'b', st: 10, lk: 5, at: '2026-11-02' }, { rid: 'c', st: 8, lk: 1, buy: 1, at: '2026-11-03' }]; ok(AC.rvSort(L).map((x) => x.rid).join() === 'b,c,a' && AC.rvSort(L, 'new')[0].rid === 'c' && AC.rvSort(L, 'lo')[0].rid === 'a', '정렬: 공감순(같으면 구매 인증)·최신·별점 낮은');
  ok(AC.goalOf({ goal: { y: 2026, n: 4 }, rd: { a: { s: 'done', fin: '2026-03-01' }, b: { s: 'done', fin: '2025-12-01' }, c: { s: 'ing' } } }, 2026).done === 1 && AC.goalOf({ goal: { y: 2026, n: 4 }, rd: { a: { s: 'done', fin: '2026-03-01' } } }, 2026).pct === 25, '독서 목표: 올해 다 읽은 권수 · 퍼센트');
  const V = new Map([['x1', { id: 'x1', isbn: '9788900000001', p: 5000 }], ['x2', { id: 'x2', isbn: '9788900000002', p: 9000 }]]); const A = AC.alertState({ 'price:x1': { k: 'price', id: 'x1', p: 7000 }, 'restock:9788900000002': { k: 'restock', isbn: '9788900000002' }, 'restock:9788900000009': { k: 'restock', isbn: '9788900000009' } }, V, new Set(), new Set());
  ok(A.filter((x) => x.hit).length === 2 && A.find((x) => x.k === 'price').now === 5000 && A.find((x) => x.isbn === '9788900000002').to.id === 'x2' && !A.find((x) => x.isbn === '9788900000009').hit, '알림 판정: 값 내림(지금 값<신청 값)·다시 들어옴(같은 ISBN 판매중)');
  const T = AC.mkTestOne(1, 'ab12'); ok(/\.invalid$/.test(T.em) && /^🧪/.test(T.nick) && !AC.pwWhy(T.pw), '시험 계정: 없는 메일(.invalid)·🧪 별명·규칙 맞는 비밀번호'); }

console.log('② 클라우드 창구(가짜 Firestore)');
const store = {}; const col = (n) => (store[n] = store[n] || {}); const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x) && !x.__au;
const deep = (a, b) => { const o = isObj(a) ? { ...a } : {}; for (const [k, v] of Object.entries(b)) o[k] = v && v.__au ? [...((o[k]) || []), ...v.__au] : isObj(v) && isObj(o[k]) ? deep(o[k], v) : clone(v); return o; }; /* Firestore merge처럼 겹친 칸은 안쪽까지 */
const FV = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...a) => ({ __au: a }) };
const snap = (n, id) => { const d = col(n)[id]; return { id, exists: d != null, data: () => clone(d), ref: ref(n, id) }; };
function ref(n, id) { return { _n: n, id, get: async () => snap(n, id), set: async (v, o) => { col(n)[id] = o && o.merge ? deep(col(n)[id], v) : deep({}, v); } }; }
const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => { const x = col(n)[id][f]; return op === '==' ? x === v : op === 'in' ? v.includes(x) : op === '>' ? x != null && String(x) > String(v) : true; })).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f), docs }; } }); return { ...q([]), doc: (id) => ref(n, id) }; };
const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)), runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), getAll: async (...r) => r.map((x) => snap(x._n, x.id)), set: (r, v, o) => W.push(() => r.set(v, o)) }); for (const w of W) await w(); } };
const files = {}; const bucket = () => ({ file: (n) => ({ save: async (b, o) => { files[n] = { b, o }; }, download: async () => { if (!files[n]) throw new Error('없음'); return [files[n].b]; } }) });
const L0 = (o) => ({ status: '판매중', active: true, qty: 1, price: 8000, grade: '상', sku: 'A01BC123PK', title: '시험 책', isbn13: '9788900000001', bookId: 'bk1', registeredAt: '2026-11-10T01:00:00Z', photos: [{ stored: 'p/1.jpg', thumb: 'p/1_t.jpg' }], ...o });
const B0 = { author: '지은이A', publisher: '출판사A', pubDate: '2020-05-01', categories: [{ path: '국내도서>소설/시/희곡>한국소설' }], priceList: 15000 };
for (let i = 1; i <= 5; i++) col('prd_listings')['aladin_U' + i] = L0({ title: '시험 책 ' + i, sku: 'A01BC12' + i + 'PK', bookId: 'bk' + i, isbn13: '978890000000' + i, price: 4000 + i * 1000 });
for (let i = 1; i <= 5; i++) col('prd_books')['bk' + i] = { ...B0, title: '시험 책 ' + i };
col('app_settings').shop = { open: 1, shipFee: 3500, payDays: 2, bank: { name: '시험은행', acct: '000-000', holder: '가게' }, biz: { name: '가게' } };
process.env.SHOP_ORIGINS = 'http://localhost:1';
const SHOP = SH.makeShop({ db, C, FV, log: () => {}, bucket }); const SHOPDIR = path.join(ROOT, 'shop');
const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; try { if (await SHOP.handle(req, res, p0)) return; } catch (e) { res.writeHead(500); res.end(String(e)); return; }
  if (p0 === '/__admin' && req.method === 'POST') { const ch = []; for await (const c of req) ch.push(c); const r = await SHOP.acctAdmin(JSON.parse(Buffer.concat(ch).toString() || '{}'), { email: 'admin@example.com' }); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r)); return; }
  const f = path.join(SHOPDIR, decodeURIComponent(p0 === '/' ? '/index.html' : p0)); if (f.startsWith(SHOPDIR) && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'Content-Type': /\.js$/.test(f) ? 'text/javascript' : /\.css$/.test(f) ? 'text/css' : 'text/html; charset=utf-8' }); res.end(fs.readFileSync(f)); return; } res.writeHead(404); res.end(); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
let ip = 10; const J = async (m, u, b, tok, raw) => { const r = await fetch(base + u, { method: m, headers: { ...(b && !raw ? { 'Content-Type': 'application/json' } : {}), ...(tok ? { Authorization: 'Bearer ' + tok } : {}), 'X-Forwarded-For': '9.9.9.' + (ip % 250) }, body: raw || (b ? JSON.stringify(b) : undefined) }); let j = null; try { j = await r.json(); } catch (e) {} return { s: r.status, j, h: r.headers }; };
const A = (b, tok) => { if (b.op === 'join') ip++; return J('POST', '/shop/a', b, tok); }; /* 가입은 IP당 시간 5번 — 시험은 IP를 바꿔 가며 */ const ADM = (b) => J('POST', '/__admin', b).then((r) => r.j);
const AG = { privacy: true, terms: true };
const j1 = await A({ op: 'join', em: 'guest1@example.com', pw: 'abcd1234', nick: '책읽는손님', agree: AG }); ok(j1.s === 200 && /^u_[0-9a-f]{16}\.[0-9a-f]{32}$/.test(j1.j.tok) && j1.j.me.nick === '책읽는손님', '가입 → 열쇠·내 정보', j1.j);
const U1 = j1.j.me.uid; const d1 = col('shop_users')[U1]; ok(d1 && !JSON.stringify(d1).includes('abcd1234') && !JSON.stringify(d1).includes(j1.j.tok.split('.')[1]) && /^p2\$/.test(d1.pw) && d1.sess.length === 1, '문서엔 비밀번호·열쇠 원문 없음(해시만)');
ok((await A({ op: 'join', em: 'GUEST1@example.com', pw: 'abcd1234', nick: '다른손님', agree: AG })).s === 409 && (await A({ op: 'join', em: 'g2@example.com', pw: 'abcd1234', nick: '책읽는손님', agree: AG })).s === 409, '같은 메일(대소문자 무시)·같은 별명 두 번 가입 0');
ok((await A({ op: 'join', em: 'g3@example.com', pw: 'abcd1234', nick: '손님셋' })).j.f === 'agree', '동의 없으면 가입 안 됨');
const j2 = await A({ op: 'join', em: 'guest2@example.com', pw: 'efgh5678', nick: '두번째손님', agree: AG }); const U2 = j2.j.me.uid; let T2 = j2.j.tok;
ok((await A({ op: 'login', em: 'guest1@example.com', pw: 'zzzz9999' })).s === 401 && (await A({ op: 'me' })).s === 401 && (await A({ op: 'me' }, U1 + '.' + '0'.repeat(32))).s === 401, '틀린 비밀번호·열쇠 없음·가짜 열쇠 → 401');
const lg = await A({ op: 'login', em: 'Guest1@Example.com', pw: 'abcd1234' }); const T1 = lg.j.tok; ok(lg.s === 200 && col('shop_users')[U1].sess.length === 2, '로그인 → 새 열쇠(기기 둘)');
{ const ip0 = ip; ip = 249; let last; for (let i = 0; i < 11; i++) last = await A({ op: 'login', em: 'guest1@example.com', pw: 'wrong0000' }); ok(last.s === 429, '틀린 로그인 10번 → 10분 막음'); ip = ip0; }
const me = await A({ op: 'me' }, T1); ok(me.s === 200 && me.j.me.em === 'guest1@example.com' && me.j.me.pts === 0 && Array.isArray(me.j.me.cps), '내 정보(메일은 본인만) · 적립금·쿠폰 자리');
// 서재 · 목표 · 찜
ok((await A({ op: 'rd', k: 'i9788900000002', id: 'aladin_U2', s: 'want' }, T1)).j.rd.s === 'want', '서재: 읽고 싶어요');
await A({ op: 'rd', k: 'i9788900000003', id: 'aladin_U3', s: 'done' }, T1); await A({ op: 'set', goal: 12 }, T1); const m2 = await A({ op: 'me' }, T1); ok(m2.j.me.rdN.want === 1 && m2.j.me.rdN.done === 1 && m2.j.me.goal.n === 12 && m2.j.me.goal.done === 1, '서재 권수·독서 목표 12권 중 1', m2.j.me);
await A({ op: 'rd', k: 'i9788900000002', s: null }, T1); ok((await A({ op: 'me' }, T1)).j.me.rdN.want === 0, '서재에서 빼기(겹친 칸 merge)');
await A({ op: 'wish', L: [{ id: 'aladin_U4', t: '시험 책 4', p: 8000 }, { id: '', t: '빈' }] }, T1); ok((await A({ op: 'me' }, T1)).j.me.wish.length === 1, '찜 목록 계정에 저장(빈 줄 뺌)');
// 리뷰
const rv1 = await A({ op: 'rv', k: 'i9788900000001', id: 'aladin_U1', st: 9, s100: '문장이 아름답고 오래 남는 책', body: '긴 글입니다. '.repeat(5), spo: 1 }, T1); ok(rv1.s === 200 && rv1.j.rv.st === 9 && rv1.j.new && rv1.j.rv.mine, '리뷰 쓰기(★4.5 · 100자평 · 긴 글 · 스포일러 표)', rv1.j);
ok((await A({ op: 'me' }, T1)).j.me.rd.some((r) => r.k === 'i9788900000001' && r.s === 'done'), '별점 매기면 서재에 다 읽음');
const rv1b = await A({ op: 'rv', k: 'i9788900000001', id: 'aladin_U1', st: 8, s100: '다시 읽어도 좋음' }, T1); ok(!rv1b.j.new && Object.values(col('shop_reviews')).filter((r) => r.uid === U1).length === 1, '같은 책은 한 사람 리뷰 하나(고치면 덮음)');
await A({ op: 'rv', k: 'i9788900000001', id: 'aladin_U1', st: 4, s100: '저는 별로였어요' }, T2);
const pub = await J('GET', '/shop/rv?k=i9788900000001'); ok(pub.s === 200 && pub.j.st.n === 2 && pub.j.st.avg === 3 && pub.j.items.length === 2 && !JSON.stringify(pub.j).includes('guest') && !JSON.stringify(pub.j).includes('repBy'), '공개 리뷰: 평균 ★3.0 · 메일·신고자 없음', pub.j.st);
const rid1 = rv1.j.rv.rid; ok((await A({ op: 'like', rid: rid1 }, T1)).s === 400, '내 리뷰엔 공감 못 함');
const lk = await A({ op: 'like', rid: rid1 }, T2); ok(lk.j.on && lk.j.lk === 1 && (await A({ op: 'myLikes', rids: [rid1] }, T2)).j.on[0] === rid1, '공감 → 1 · 내가 공감한 것 표시');
ok((await A({ op: 'like', rid: rid1 }, T2)).j.lk === 0, '한 번 더 누르면 공감 취소');
await A({ op: 'like', rid: rid1 }, T2); ok((await J('GET', '/shop/rv?k=i9788900000001&s=like')).j.items[0].rid === rid1, '공감순 정렬');
// 신고 3명 → 저절로 가림
const rid2 = Object.values(col('shop_reviews')).find((r) => r.uid === U2).rid; const others = []; for (let i = 0; i < 3; i++) others.push((await A({ op: 'join', em: `rp${i}@example.com`, pw: 'abcd1234', nick: '신고손님' + i, agree: AG })).j.tok);
await A({ op: 'rep', rid: rid2, why: '욕설' }, others[0]); await A({ op: 'rep', rid: rid2 }, others[0]); ok(col('shop_reviews')[rid2].rep === 1, '같은 손님 신고는 한 번만');
await A({ op: 'rep', rid: rid2 }, others[1]); await A({ op: 'rep', rid: rid2 }, others[2]); ok(col('shop_reviews')[rid2].hid === 'rep' && (await J('GET', '/shop/rv?k=i9788900000001')).j.st.n === 1, '서로 다른 3명 신고 → 저절로 가림(평균에서도 빠짐)');
await ADM({ op: 'rvHide', id: rid2, on: 0 }); ok(!col('shop_reviews')[rid2].hid && (await J('GET', '/shop/rv?k=i9788900000001')).j.st.n === 2, '운영자가 다시 보이기');
// 사진
{ const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200, 1)]); const up = await J('POST', '/shop/a/photo', jpg, T1, jpg); ok(up.s === 200 && AC.PH_RE.test(up.j.n) && files['shop_' + up.j.n], '사진 올리기 → 저장소 shop_rv/', up.j);
  ok((await J('POST', '/shop/a/photo', Buffer.from('<svg></svg>xxxxxxxxxxxxxxxxxxxx'), T1, Buffer.from('<svg></svg>xxxxxxxxxxxxxxxxxxxx'))).s === 400 && (await J('POST', '/shop/a/photo', jpg, null, jpg)).s === 401, 'JPEG·PNG·WebP만 · 로그인 없으면 안 됨');
  ok((await A({ op: 'rv', k: 'i9788900000001', id: 'aladin_U1', st: 8, s100: '사진도 붙임', ph: [up.j.n] }, T2)).s === 400, '남의 사진은 리뷰에 못 붙임');
  const r3 = await A({ op: 'rv', k: 'i9788900000001', id: 'aladin_U1', st: 8, s100: '사진도 붙임', ph: [up.j.n] }, T1); ok(r3.j.rv.ph[0] === up.j.n && (await J('GET', '/shop/rv?k=i9788900000001&f=ph')).j.total === 1, '내 사진 붙인 리뷰 · 사진 리뷰만 거르기');
  const im = await fetch(base + '/shop/rvimg?n=' + encodeURIComponent(up.j.n)); ok(im.status === 200 && /image\/jpeg/.test(im.headers.get('content-type')) && /immutable/.test(im.headers.get('cache-control')), '사진 보기(1년 캐시)'); }
// 밑줄 · 북리스트 · 팔로우 · 피드 · 공개 서재
const q1 = await A({ op: 'q', k: 'i9788900000001', id: 'aladin_U1', tx: '모든 어른은 한때 아이였다', pg: 12 }, T1); ok(q1.s === 200 && (await J('GET', '/shop/rv?k=i9788900000001')).j.q[0].tx === '모든 어른은 한때 아이였다', '밑줄(인상 깊은 문장) 남기기 → 책 화면에');
const bl = await A({ op: 'bl', nm: '겨울에 읽을 책', ds: '따뜻한 이야기' }, T1); const lid = bl.j.lid; await A({ op: 'blAdd', lid, k: 'i9788900000002', id: 'aladin_U2', on: 1, note: '첫 장이 좋음' }, T1);
const blg = await J('GET', '/shop/bl?l=' + lid); ok(blg.s === 200 && blg.j.l.items.length === 1 && blg.j.l.items[0].live === 's' && blg.j.l.items[0].p === 6000, '북리스트: 만들기·담기·공개 주소(지금 판매중·값)', blg.j);
ok((await A({ op: 'blAdd', lid, k: 'i9788900000003', id: 'aladin_U3', on: 1 }, T2)).s === 404, '남의 목록엔 못 담음');
const fl = await A({ op: 'fol', u: U1, on: 1 }, T2); ok(fl.j.on && fl.j.folN === 1 && (await A({ op: 'fol', u: U2, on: 1 }, T2)).s === 400, '팔로우 → 팔로워 1 · 나 자신은 안 됨');
const fd = await A({ op: 'feed' }, T2); ok(fd.j.L.length === 1 && fd.j.L[0].uid === U1 && fd.j.Q.length === 1, '팔로우 소식: 그 손님 리뷰·밑줄');
const pf = await J('GET', '/shop/pf?u=' + U1); ok(pf.s === 200 && pf.j.u.nick === '책읽는손님' && pf.j.L.length === 1 && pf.j.B.length === 1 && pf.j.u.folN === 1 && !JSON.stringify(pf.j).includes('guest1@') && !('wish' in pf.j.u) && !('alerts' in pf.j.u), '공개 서재: 별명·리뷰·북리스트·팔로워 — 메일·찜·알림 없음');
const mine = await A({ op: 'mine', k: 'i9788900000001', id: 'aladin_U1' }, T1); ok(mine.j.rv && mine.j.rv.mine && mine.j.rd.s === 'done' && mine.j.q.length === 1 && mine.j.lists.length === 1, '책 화면 내 것: 내 리뷰·서재 칸·밑줄·내 목록');
// 알림 신청
ok((await A({ op: 'alert', k: 'price', id: 'aladin_U2', on: 1 }, T1)).j.on && (await A({ op: 'alert', k: 'restock', id: 'aladin_U9', isbn: '9788900000009', on: 1, t: '없는 책' }, T1)).j.on, '값 내림·다시 들어옴 알림 신청');
col('prd_listings').aladin_U2.price = 5500; col('prd_listings').aladin_U2.uploadedAt = new Date().toISOString(); SHOP._cat.full = 0; await SHOP.build();
const al = await A({ op: 'alerts' }, T1); ok(al.j.L.find((x) => x.k === 'price').hit && al.j.L.find((x) => x.k === 'price').now === 5500 && !al.j.L.find((x) => x.k === 'restock').hit, '값이 내리면 알림 칸에 「값이 내렸어요」', al.j);
// 주문 ↔ 계정 · 구매 인증 · 시험 계정은 주문 못 함
const ob = (ids) => ({ items: ids, buyer: { name: '손님A', phone: '010-0000-0000' }, rcv: { zip: '06000', addr1: '서울 어딘가 1길 1' }, agree: { privacy: true, terms: true } });
const o1 = await J('POST', '/shop/order', ob(['aladin_U5']), T2); ok(o1.s === 200 && col('shop_orders')[o1.j.no].uid === U2, '로그인한 손님 주문 → 주문에 손님 번호');
const ol = await A({ op: 'orders' }, T2); ok(ol.j.L.length === 1 && ol.j.L[0].no === o1.j.no && ol.j.L[0].t === o1.j.t && !JSON.stringify(ol.j).includes('06000'), '마이페이지 주문 내역(주소 등은 안 보냄)');
col('shop_orders')[o1.j.no].st = 'paid'; const rv5 = await A({ op: 'rv', k: 'i9788900000005', id: 'aladin_U5', st: 10, s100: '상태 정말 좋았어요' }, T2); ok(rv5.j.rv.buy === 1, '입금 확인 뒤 리뷰 → 구매 인증 표');
// 시험 계정
const mk = await ADM({ op: 'mkTest', n: 3 }); ok(mk.L.length === 3 && mk.L.every((x) => /\.invalid$/.test(x.em) && /^🧪/.test(x.nick) && x.pw) && Object.values(col('shop_users')).filter((u) => u.test).length === 3, '운영자: 시험 계정 3개(🧪 · 없는 메일 · 비밀번호는 한 번 보여 줌)');
const tl = await A({ op: 'login', em: mk.L[0].em, pw: mk.L[0].pw }); const TT = tl.j.tok; ok(tl.s === 200 && tl.j.me.test === 1, '시험 계정 로그인');
ok((await J('POST', '/shop/order', ob(['aladin_U4']), TT)).s === 403 && !col('shop_holds').aladin_U4, '시험 계정은 실제 주문 못 함(재고 안 잡음 · 매출 0)');
await A({ op: 'rv', k: 'i9788900000004', id: 'aladin_U4', st: 7, s100: '시험 계정 리뷰입니다' }, TT); const p4 = await J('GET', '/shop/rv?k=i9788900000004'); ok(p4.j.st.n === 0 && p4.j.items.length === 0, '시험 리뷰는 공개 목록·평균에서 빠짐');
const my4 = await A({ op: 'myRv' }, TT); ok(my4.j.L.length === 1 && my4.j.L[0].test === 1 && (await A({ op: 'mine', k: 'i9788900000004' }, TT)).j.rv.test === 1, '시험 리뷰는 본인 마이페이지·책 화면에만(🧪 표)');
ok(!(await J('GET', '/shop/rvnew')).j.L.some((r) => r.uid === tl.j.me.uid), '첫 화면 새 리뷰에도 시험 리뷰 없음');
const us = await ADM({ op: 'users' }); ok(us.L.length === 3 && us.L.every((x) => x.test), '운영자: 시험 계정 목록');
await ADM({ op: 'arch', uid: tl.j.me.uid, on: 1 }); ok((await A({ op: 'me' }, TT)).s === 401 && (await A({ op: 'login', em: mk.L[0].em, pw: mk.L[0].pw })).s === 403 && col('shop_users')[tl.j.me.uid], '보관(숨김) → 로그인 0 · 문서는 그대로(지우지 않음)');
ok((await ADM({ op: 'arch', uid: U1, on: 1 })).err, '진짜 손님은 보관 못 함(시험 계정만)');
const rl = await ADM({ op: 'rvList', days: 30 }); ok(rl.L.length >= 4 && rl.L.some((r) => r.test) && rl.Q.length === 1, '운영자: 리뷰·밑줄 목록(시험 포함 · 신고 많은 차례)');
await ADM({ op: 'rvHide', id: rid1, on: 1 }); ok(col('shop_reviews')[rid1].hid === 'adm' && (await A({ op: 'rvDel', k: 'i9788900000001' }, T1)).s === 403, '운영자 숨김 → 손님이 못 되살림');
// 별명 바꾸기 · 비밀번호 · 로그아웃 · 탈퇴
ok((await A({ op: 'set', nick: '두번째손님' }, T1)).s === 409 && (await A({ op: 'set', nick: '새별명손님', bio: '소설을 좋아해요' }, T1)).j.me.nick === '새별명손님', '별명 바꾸기(남이 쓰는 것은 안 됨) · 소개');
ok((await A({ op: 'pw', old: 'xxxx0000', nw: 'newpw1234' }, T2)).s === 400, '비밀번호 바꾸기: 지금 비밀번호 확인');
const pw2 = await A({ op: 'pw', old: 'efgh5678', nw: 'newpw1234' }, T2); ok(pw2.s === 200 && (await A({ op: 'me' }, T2)).s === 401 && (await A({ op: 'me' }, pw2.j.tok)).s === 200, '비밀번호 바꾸면 다른 기기 열쇠는 끊김'); T2 = pw2.j.tok;
await A({ op: 'out' }, T2); ok((await A({ op: 'me' }, T2)).s === 401, '로그아웃');
const by = await A({ op: 'bye', pw: 'abcd1234' }, others[0]); ok(by.s === 200 && (await A({ op: 'login', em: 'rp0@example.com', pw: 'abcd1234' })).s === 401 && (await A({ op: 'join', em: 'rp0@example.com', pw: 'abcd1234', nick: '신고손님0', agree: AG })).s === 200, '탈퇴 → 로그인 0 · 같은 메일·별명 다시 가입 가능');
ok((await J('OPTIONS', '/shop/a')).s === 204, 'CORS 미리 묻기');
{ const r = await fetch(base + '/shop/a', { method: 'OPTIONS', headers: { Origin: 'https://booksqueen.com' } }); ok(/Authorization/.test(r.headers.get('access-control-allow-headers') || ''), 'CORS: Authorization 머리 허락'); }

if (!process.env.RN_UI) { srv.close(); console.log(bad ? `❌ tSHOP9_1112 ${bad}개 실패` : '✓ tSHOP9_1112 순수 셈·클라우드 창구 통과 (화면 시험은 RN_UI=1)'); process.exit(bad ? 1 : 0); }
global.__T = { base, ok, ADM, A, col, srv }; await require('./tSHOP9_ui.js')(global.__T);
srv.close(); console.log(bad ? `❌ tSHOP9_1112 ${bad}개 실패` : '✓ tSHOP9_1112 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
