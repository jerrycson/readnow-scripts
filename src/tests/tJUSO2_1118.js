/* (juso2 · 정범님 11/18 12:08 「도로명주소 검색 API 승인키 등록했어, 확인해주고 적용할 곳을 적용해」) 📮 도로명주소 찾기 넓힘 — 순수 시험(바깥 연결 없음 · 주소는 공공기관 예시 주소만 · 손님 정보 없음)
 *  ① 클라우드 공용 묶음 cloud/juso.js — 검색어 다듬기·답 읽기·승인키 없음·찾음·10분 기억·틀린 키면 다시 읽기·진단은 키 값을 안 돌려줌
 *  ② 우리숍 창구 /shop/juso — 막이(IP·가게 하루)·설정으로 끔·/shop/cfg juso 표시 · ③ 진단 juso=1 · ④ 웹앱 우리숍 설정 사업장 주소 🔎 + 켜기 칸 · ⑤ 손님 주문서 안의 칸(팝업 없음·닫기 ✕) */
const fs = require('fs'), path = require('path'), assert = require('assert');
const ok = (m) => console.log('✓ ' + m);
const up = (...p) => path.join(__dirname, '..', '..', ...p); /* src/tests → 저장소 꼭대기 · 문지기(Q/w/pw) → Q */
const J = require(up('cloud', 'juso.js'));
const A = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const SH = fs.readFileSync(up('cloud', 'shop.js'), 'utf8'), CL = fs.readFileSync(up('cloud', 'index.js'), 'utf8'), SJ = fs.readFileSync(up('shop', 'shop.js'), 'utf8'), SC = fs.readFileSync(up('shop', 'shop.css'), 'utf8');
const FAKEKEY = 'TESTKEYabcdefghij0123456789'; /* 시험용 가짜 — 진짜 승인키 아님 */
const ANS = { results: { common: { errorCode: '0', totalCount: '1', errorMessage: '정상' }, juso: [{ roadAddr: '서울특별시 중구 세종대로 110 (태평로1가)', roadAddrPart1: '서울특별시 중구 세종대로 110', jibunAddr: '서울특별시 중구 태평로1가 31', zipNo: '04524', bdNm: '서울특별시청' }] } };

(async () => {
  /* ① 순수 함수 */
  assert.strictEqual(J.clean(" 세종대로 110; DROP <b>'"), '세종대로 110 b'); ok('검색어에서 특수문자·SQL 낱말 뺌(웹앱 jusoQ와 같은 규칙)');
  assert.strictEqual(J.clean('가'.repeat(200)).length, 80); ok('검색어 80자까지');
  const p = J.parse(ANS); assert(p.ok && p.total === 1 && p.list[0].zip === '04524' && /세종대로 110/.test(p.list[0].road)); ok('주소 서버 답 → 도로명·우편번호');
  const pe = J.parse({ results: { common: { errorCode: 'E0001', errorMessage: '승인되지 않은 KEY 입니다.' } } }); assert(!pe.ok && pe.code === 'E0001' && /틀림/.test(pe.why)); ok('틀린 승인키 → 까닭');
  assert(!J.parse(null).ok && J.parse(null, 502).unsure); ok('읽지 못한 답 → 실패(멈추지 않음)');

  /* makeJuso — 가짜 Firestore·가짜 주소 서버 */
  let store = null, reads = 0, calls = [], clock = 1e12; const C = (col) => { assert.strictEqual(col, 'app_secrets'); return { doc: (id) => { assert.strictEqual(id, 'juso'); return { get: async () => { reads++; return { exists: !!store, data: () => store }; } }; } }; };
  let reply = ANS; const http = async (o) => { calls.push(o.url); return { status: 200, text: JSON.stringify(reply) }; };
  const M = J.makeJuso({ C, log: () => {}, http, now: () => clock });
  const n0 = await M.search({ q: '세종대로 110' }); assert(!n0.ok && n0.code === 'NOKEY' && /도로명주소 찾기/.test(n0.why) && calls.length === 0); ok('승인키 없음 → NOKEY(주소 서버를 부르지 않음 · 설정 자리 안내)');
  const i0 = await M.info(); assert(i0.has === false && i0.len === 0); ok('진단: 키 없음');
  store = { key: FAKEKEY, at: '2026-11-18T03:05:00.000Z', by: 'admin' };
  const c0 = await M.search({ q: '세종대로 110' }); assert(!c0.ok && c0.code === 'NOKEY'); ok('키를 30분 기억(바로 다시 읽지 않음)');
  clock += 31 * 60e3; const s1 = await M.search({ q: '세종대로 110' }); assert(s1.ok && s1.via === 'cloud' && s1.list[0].zip === '04524' && calls.length === 1); ok('30분 뒤 새 키로 찾음');
  assert(calls[0].startsWith(J.API + '?confmKey=') && /keyword=%EC%84%B8%EC%A2%85%EB%8C%80%EB%A1%9C%20110/.test(calls[0]) && /resultType=json/.test(calls[0])); ok('주소 서버 부르는 꼴(검색어 인코딩 · JSON)');
  const s2 = await M.search({ q: '세종대로 110' }); assert(s2.ok && s2.cached && calls.length === 1); ok('같은 검색어 10분 기억(바깥 API 덜 부름)');
  const inf = await M.info(true); assert(inf.has && inf.len === FAKEKEY.length && inf.shapeOk && inf.at === store.at && !JSON.stringify(inf).includes(FAKEKEY) && !JSON.stringify(inf).includes(FAKEKEY.slice(-4))); ok('진단 info: 있음·길이·저장 시각만 — 키 값·끝 4자 없음');
  reply = { results: { common: { errorCode: 'E0001', errorMessage: '승인되지 않은 KEY 입니다.' } } }; const r0 = reads; const e1 = await M.search({ q: '덕수궁길 15' }); assert(!e1.ok && e1.code === 'E0001');
  await M.search({ q: '덕수궁길 15' }); assert(reads > r0); ok('틀린 키 답 → 다음엔 키를 다시 읽음(정범님이 바꿨을 수 있음)');
  const t1 = await M.search({ q: '세종대로 110', key: 'bad key!' }); assert(!t1.ok && t1.code === 'E0001'); ok('저장 전 확인 키 꼴이 틀리면 부르지 않음');
  assert(!(await M.search({ q: '가' })).ok); ok('한 글자는 안 찾음');
  const Mx = J.makeJuso({ C: () => ({ doc: () => ({ get: async () => { throw new Error('PERMISSION_DENIED'); } }) }), log: () => {}, http }); const ix = await Mx.info(); assert(!ix.has && /PERMISSION/.test(ix.readErr)); assert((await Mx.search({ q: '세종대로 110' })).code === 'NOKEY'); ok('키 칸을 못 읽으면 없음으로(멈추지 않음)');
  const Mh = J.makeJuso({ C, log: () => {}, http: async () => { throw new Error('응답 없음(15초)'); } }); const h1 = await Mh.search({ q: '세종대로 110' }); assert(!h1.ok && h1.unsure); ok('주소 서버가 안 닿으면 확실치 않음으로');
  assert(!/confmKey=[A-Za-z0-9]{12}/.test(fs.readFileSync(up('cloud', 'juso.js'), 'utf8'))); ok('코드에 키 값 없음');

  /* ② 우리숍 창구 */
  const RL = require(up('cloud', 'shop.js')).JUSO_RL; assert(Array.isArray(RL) && RL[0] === 20 && RL[1] === 200 && RL[2] === 5000); ok('막이: IP당 1분 20번·하루 200번 · 가게 하루 5천 번');
  const R = (() => { const i = SH.indexOf("path === '/shop/juso'"); return SH.slice(i, SH.indexOf('\n      if (path ===', i + 10)); })(); assert(R.length > 100 && R.length < 4000);
  assert(/req\.method === 'GET'/.test(R) && /addrFind === 0/.test(R) && /limitWait\('jm'/.test(R) && /limitWait\('jd'/.test(R) && /JUSO_RL\[2\]/.test(R) && /JUSO\.search\(\{ q:/.test(R)); ok('/shop/juso — GET만 · 설정으로 끔 · IP·하루 막이 · 공용 묶음으로 찾음');
  assert(!/\bkey\s*:/.test(R) && !/q\.key/.test(R) && !/\blog\(/.test(R)); ok('/shop/juso — 키를 받지 않음 · 검색어를 로그에 안 남김');
  assert(/no-store/.test(SH.slice(SH.indexOf('const send = '), SH.indexOf('const send = ') + 300))); ok('주소 답은 CDN에 안 남김(no-store 기본)');
  assert(/path === '\/shop\/cfg'[^\n]*JUSO\.has\(\)[^\n]*juso: jk \? 1 : 0/.test(SH)); ok('/shop/cfg juso 표시 = 키 있음 + 안 끔');
  assert(/require\('\.\/juso\.js'\)\.makeJuso\(\{ C, log \}\)/.test(SH)); ok('숍 전용 서버도 같은 묶음(index.js 안 읽음)');

  /* ②-2 진짜 창구(가짜 Firestore + 진짜 http · 주소 서버만 가짜) — 키 있음·없음·끔·막이 */
  { const http = require('http'); const SHM = require(up('cloud', 'shop.js')); const store = { app_settings: { shop: { open: 1, shipFee: 3500, payDays: 2, bank: { name: '시험은행', acct: '000-000', holder: '가게' }, biz: { name: '가게' } } }, app_secrets: {}, prd_listings: {}, prd_books: {} };
    const col = (n) => (store[n] = store[n] || {}); const snap = (n, id) => ({ id, exists: col(n)[id] != null, data: () => (col(n)[id] == null ? undefined : JSON.parse(JSON.stringify(col(n)[id]))) });
    const ref = (n, id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v) => { col(n)[id] = { ...(col(n)[id] || {}), ...v }; } });
    const Cq = (n) => { const q = () => ({ where: () => q(), select: () => q(), limit: () => q(), orderBy: () => q(), get: async () => { const docs = Object.keys(col(n)).map((id) => ({ ...snap(n, id), ref: ref(n, id) })); return { size: docs.length, empty: !docs.length, docs, forEach: (f) => docs.forEach(f) }; } }); return { ...q(), doc: (id) => ref(n, id) }; };
    const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)), runTransaction: async (fn) => fn({ get: (r) => r.get(), set: () => {} }) };
    const F0 = globalThis.fetch; let jcalls = 0; globalThis.fetch = async (u, o) => { if (String(u).startsWith(J.API)) { jcalls++; return { status: 200, text: async () => JSON.stringify(ANS) }; } return F0(u, o); };
    let SHOP = null; const mk = () => { SHOP = SHM.makeShop({ db, C: Cq, FV: { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...x) => x }, log: () => {} }); };
    const srv = http.createServer(async (req, res) => { const p0 = (req.url || '/').split('?')[0]; try { if (await SHOP.handle(req, res, p0)) return; } catch (e) { res.writeHead(500); res.end(String(e && e.message)); return; } res.writeHead(404); res.end(); });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
    const G = async (pth) => { const r = await F0(base + pth, { headers: { Origin: 'https://booksqueen.com' } }); const tx = await r.text(); let j = null; try { j = JSON.parse(tx); } catch (e) {} return { s: r.status, j, tx, cc: r.headers.get('cache-control') }; };
    try {
      mk(); const c0 = await G('/shop/cfg'); assert(c0.s === 200 && c0.j && c0.j.juso === 0, JSON.stringify(c0).slice(0, 300)); const n0 = await G('/shop/juso?q=' + encodeURIComponent('세종대로 110')); assert(n0.j && n0.j.ok === false && n0.j.code === 'NOKEY' && /직접/.test(n0.j.why) && jcalls === 0); ok('창구: 키 없음 → 주문서에 단추 안 보임(juso 0) · 찾기는 NOKEY + 손 입력 안내');
      store.app_secrets.juso = { key: FAKEKEY, at: '2026-11-18T03:05:00.000Z', by: 'admin' }; mk();
      const c1 = await G('/shop/cfg'); assert(c1.j.juso === 1 && !c1.tx.includes(FAKEKEY) && !c1.tx.includes(FAKEKEY.slice(-4))); ok('창구: 키 있음 → juso 1 · 설정 답에 키 없음');
      const s1 = await G('/shop/juso?q=' + encodeURIComponent('세종대로 110')); assert(s1.s === 200 && s1.j.ok && s1.j.list[0].zip === '04524' && /세종대로 110/.test(s1.j.list[0].road) && !s1.tx.includes(FAKEKEY) && /no-store/.test(s1.cc || '') && jcalls === 1, JSON.stringify(s1).slice(0, 300)); ok('창구: 찾음 → 도로명·우편번호(키 없음 · no-store)');
      let w = null; for (let i = 0; i < 25; i++) { const r = await G('/shop/juso?q=' + encodeURIComponent('세종대로 ' + (110 + i))); if (r.s === 429) { w = { i, r }; break; } } assert(w && w.i >= 18 && w.i <= 20 && /직접/.test(w.r.j.err), JSON.stringify(w && w.r).slice(0, 200)); ok('창구: 한 사람 1분 20번 넘으면 잠시 쉼(429 · 손 입력 안내)');
      store.app_settings.shop.addrFind = 0; mk(); const c2 = await G('/shop/cfg'); const o2 = await G('/shop/juso?q=' + encodeURIComponent('세종대로 110')); assert(c2.j.juso === 0 && o2.j.code === 'OFF'); ok('창구: 우리숍 설정에서 끄면 단추 숨김·찾기 닫힘');
    } finally { globalThis.fetch = F0; srv.close(); } }

  /* ③ 수집 서버 */
  assert(/const JUSOM = require\('\.\/juso\.js'\)\.makeJuso\(/.test(CL) && /async function jusoSearch\(b\) \{ return JUSOM\.search\(b\); \}/.test(CL)); ok('/juso 대신 부르기 = 공용 묶음');
  const D = CL.slice(CL.indexOf('if (q.juso)'), CL.indexOf('if (q.ebay)')); assert(D.length > 50 && D.length < 3000 && /JUSOM\.info\(true\)/.test(D) && /세종대로 110/.test(D) && !/\.key\b/.test(D) && !/\bby\b/.test(D.replace(/저장한 사람/g, ''))); ok('진단 juso=1 — 있음·길이·시각 + 시험 검색(공공 주소) · 키 값 없음');

  /* ④ 웹앱 */
  assert(A.includes("${k === 'addr' ? jusoBtn('#bqc_b_addr') : ''}")); ok('우리숍 설정 사업장 주소 옆 🔎 주소 찾기');
  assert(/id="bqc_addr"\$\{c\.addrFind === 0 \|\| c\.addrFind === false \? '' : ' checked'\}/.test(A) && A.includes("addrFind: g('bqc_addr') ? 1 : 0")); ok('우리숍 설정 「주문서 주소 찾기」 켜기 칸 · 저장(기본 켬)');
  assert(A.includes("jusoBtn('#cash_addr', 1)") && A.includes("jusoBtn('#pf_saddr')") && A.includes('jusoBtn(\'[data-bs="saddr"]\')')); ok('예전 3곳 그대로');

  /* ⑤ 손님 주문서 */
  assert(/\$\{c\.juso \? '<div class="jrow"><button type="button" class="btn ghost" id="jgo"/.test(SJ)); ok('주문서 🔎 주소 찾기 — 키가 있을 때만 보임(없으면 손 입력 그대로)');
  const B = SJ.slice(SJ.indexOf("const jg = $('#jgo', form)"), SJ.indexOf("const jg = $('#jgo', form)") + 6000); assert(B.length > 1000);
  assert(/api1\('\/shop\/juso\?q=' \+ encodeURIComponent\(/.test(B) && /catch \(e\) \{ o = \(e && e\.j\)/.test(B)); ok('같은 주소 /shop/juso 부름 · 실패해도 멈추지 않음');
  assert(/\[\['zip', x\.zip\], \['addr1', x\.road\]\]/.test(B) && /touched\.add\(k\)/.test(B) && /live\(\)/.test(B) && /#f_addr2/.test(B)); ok('고르면 우편번호·주소 칸 채우고 상세 주소로');
  assert(/data-jx/.test(B) && /✕/.test(B) && /Escape/.test(B)); ok('닫기 ✕ · Esc (약속 A칸 100)');
  assert(/직접 넣어 주세요/.test(B)); ok('못 찾거나 막히면 손 입력 안내');
  assert(!/\b(alert|confirm|prompt)\(/.test(B) && !/window\.open\(/.test(B)); ok('브라우저 팝업 없음(안의 칸)');
  assert(/\.jpan \{/.test(SC) && /\.jpick \{/.test(SC) && /\.jpan\[hidden\]/.test(SC)); ok('주문서 주소 찾기 꾸밈');
  console.log('✅ tJUSO2_1118 통과');
})().catch((e) => { console.error('❌', e && e.stack || e); process.exit(1); });
