// tNAVER1111 — (11/11 naver1 · 정범님 결정 (나)) 🟩 네이버 스마트스토어: ⚙ 설정 칸 · 로거 대신 쓰기 · 🧾 통합 장부 판매처 naver(LED_ORD_AD)
//   ① 순수 셈(app.html ◆ledger 덩어리): 네이버 주문 줄 → 장부 주문 꼴(UTC 시각 · 수수료 · 취소·반품) · 매물 줄(관리코드 = SKU면 그 실물 줄에 붙음 · 판매중지 = live 아님)
//        · 네이버에서 팔린 실물 → 알라딘·예스24 '내리기' 할 일 · 알라딘에서 팔린 실물 → 네이버 '내리기' 할 일
//   ② 화면(harness): ⚙ 설정 › 🟩 네이버 스마트스토어 — 상태 줄(로거 소식·받는 열쇠·저장된 값·연결 시험·주문·상품·쓰기) · 값 넣기 → 이 화면에서 잠금(RSA-OAEP+AES-GCM)
//        → col2_naver_cmd에 암호문만(Firebase 전체 어디에도 평문 없음 · 진짜 비밀 열쇠로 풀면 같은 값) · 입력 칸 바로 비움 · 진행 막대 ①~④ · 로거가 done을 쓰면 ✅
//        · 시크릿 꼴이 아니면 보내지 않음 · 쓰기 켜기 = 연결 시험 맞기 전엔 막힘 · 두 번 눌러야 맡김 · 관리자 아니면 값 넣기 칸 없음
//   ③ 로거 PC 웹앱 대신 쓰기(가짜 127.0.0.1:8797): 공개 열쇠 → col2_naver/pub · 새 명령 넘김 → done · 봉투(env) 지움 · 읽은 주문·매물 → crm_naver_orders·nv_listings · ack · 상태 → col2_naver/state
//        · 로거가 아닌 기기는 127.0.0.1:8797/nv 를 부르지 않음
//   ④ 🧾 통합 장부 — 네이버 매물 칩(🟩 네이버 판매중) · 네이버 주문 매출 합 · 브라우저 창(alert·confirm·prompt) 0
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tNAVER1111.js · RN_SHOT=<파일> 이면 설정 칸 사진 · RN_SHOT2=<파일> 이면 통합 장부 사진 · 시험 자료에 손님 정보 없음(받는 분 '받는분A')
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, ledNvOrd, ledNvLst, CH_DEF, omniPick };')();
const NR = new Function(cut('/* ◆nvreg 시작 */', '/* ◆nvreg 끝 */') + '\nreturn { nvRegMiss };')(); /* (naver2) 등록 빠진 칸 셈 */
console.log('① 순수 셈');
{ const o = F.ledNvOrd({ id: 'PO1', at: '2026-11-10T10:00:00.000+09:00', amt: 9000, fee: 510.4, qty: 1, sku: 'S1', rcv: { name: '받는분A' } });
  ok(o.ch === 'naver' && o.no === 'PO1' && o.at === '2026-11-10T01:00:00.000Z' && o.fee === 510 && o.lines[0].sku === 'S1' && !JSON.stringify(o).includes('받는분'), '주문 줄 → 장부 꼴(UTC 시각 · 수수료 반올림 · SKU · 받는 분은 옮기지 않음)', o);
  ok(F.ledNvOrd({ id: 'PO2', cancel: true }).cancel && F.ledNvOrd({ id: 'PO3', ret: true }).cancel && F.ledNvOrd({}) === null, '취소·반품 끝남 = cancel · 빈 줄 = 없음');
  const l = F.ledNvLst({ originNo: '66', no: '77', sku: 'S1', live: true, qty: 1, price: 9000, disc: 8500, st: 'SALE', name: '책1' }); ok(l.ch === 'naver' && l.no === '77' && l.price === 8500 && l.st === '판매중' && l.live, '매물 줄 → 장부 other 꼴(할인가 · 판매중)', l);
  ok(F.ledNvLst({ originNo: '1', st: 'SUSPENSION', live: false }).st === '판매중지', '상태 이름 한국어'); }
{ const now = '2026-11-11T03:00:00Z'; const al = [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }, { id: 'aladin_U2', title: '책2', price: 5000, qty: 1, live: true, st: '판매중', skus: ['S2'] }];
  const other = [F.ledNvLst({ originNo: '61', no: '71', sku: 'S1', live: true, qty: 1, price: 9000, st: 'SALE' }), F.ledNvLst({ originNo: '62', no: '72', sku: 'S2', live: true, qty: 1, price: 6000, st: 'SALE' })];
  const ord = [F.ledNvOrd({ id: 'PO1', at: '2026-11-10T10:00:00.000+09:00', amt: 9000, fee: 500, qty: 1, sku: 'S1' }), { ch: 'aladin', no: 'o2', at: '2026-11-09T00:00:00Z', amt: 5000, lines: [{ lid: 'aladin_U2', qty: 1, amt: 5000 }] }];
  const V = F.ledBuild({ al, y24: [], other, ord, reg: [], days: 30, now }); const r1 = V.rows.find((r) => r.key === 'S1'), r2 = V.rows.find((r) => r.key === 'S2');
  ok(r1 && r1.ch.naver && r1.ch.naver.live && r1.ch.naver.no === '71' && V.rows.length === 2, '네이버 매물이 관리코드(SKU)로 그 실물 줄에 붙음(줄이 늘지 않음)', V.rows.map((r) => r.key));
  ok(V.sum.naver && V.sum.naver.ord === 1 && V.sum.naver.amt === 9000 && V.sum.naver.fee === 500, '판매처 합계 — 네이버 주문 1 · 매출 · 수수료(주문의 실제 값)', V.sum.naver);
  const TD = F.ledTodo(V); const t1 = TD.find((x) => x.key === 'S1'), t2 = TD.find((x) => x.key === 'S2');
  ok(t1 && t1.acts.some((a) => a.ch === 'aladin' && a.k === 'down') && t2 && t2.acts.some((a) => a.ch === 'naver' && a.k === 'down' && a.no === '72'), '네이버에서 팔림 → 알라딘 내리기 · 알라딘에서 팔림 → 네이버 내리기(상품번호)', TD.map((x) => [x.key, x.acts.map((a) => a.ch + ':' + a.k)])); }

/* (11/11 naver2) 매물 원상품번호 · 🤖 자동 내림 고르기에 네이버 · 등록 빠진 칸 */
{ const l = F.ledNvLst({ originNo: '66', no: '77', sku: 'S1', live: true, qty: 1, price: 9000, st: 'SALE' }); ok(l.origin === '66', '매물 줄에 원상품번호(판매 상태 바꾸기 API가 쓰는 번호)', l);
  const V = F.ledBuild({ al: [{ id: 'aladin_U1', title: '책1', price: 8000, qty: 1, live: true, st: '판매중', skus: ['S1'] }], y24: [], other: [l], ord: [{ ch: 'aladin', no: 'o1', at: '2026-11-10T00:00:00Z', amt: 8000, lines: [{ lid: 'aladin_U1', qty: 1, amt: 8000 }] }], reg: [], days: 30, now: '2026-11-11T03:00:00Z' });
  const TD = F.ledTodo(V); const a = (TD[0] || { acts: [] }).acts.find((x) => x.ch === 'naver'); ok(a && a.origin === '66' && a.k === 'down', '🛠 할 일에 네이버 원상품번호가 따라옴', a);
  const P = F.omniPick(TD, { from: '2026-11-01T00:00:00Z' }); ok(P.some((x) => x.a.ch === 'naver' && x.a.origin === '66'), '🤖 자동 내림 고르기 — 알라딘에서 팔림 → 네이버 판매중지', P.map((x) => x.a.ch));
  const TD2 = TD.map((T) => ({ ...T, acts: T.acts.map((x) => ({ ...x, origin: null })) })); ok(!F.omniPick(TD2, { from: '2026-11-01T00:00:00Z' }).some((x) => x.a.ch === 'naver'), '원상품번호가 없으면 자동 내림이 네이버를 고르지 않음(사람이 🛠에서)');
  const G = { leafCategoryId: '50005000', deliveryCompany: 'HYUNDAI', asTel: '000-0000-0000', shippingAddressId: 1, returnAddressId: 2 }; const B = { title: '책', isbn13: '9788900000011', author: '저자', publisher: '출판사', pubDate: '2020-03-15', price: 8000, nImg: 1 };
  ok(NR.nvRegMiss(B, G).length === 0 && NR.nvRegMiss({ ...B, nImg: 0 }, { ...G, returnAddressId: '' }).join() === '사진,반품지 주소록 번호' && NR.nvRegMiss({}, {}).includes('출고지 주소록 번호'), '등록 빠진 칸 셈 — 다 차면 없음 · 사진·주소록 번호 빠짐을 이름으로(번외 nvBody와 같은 칸)', NR.nvRegMiss({ ...B, nImg: 0 }, { ...G, returnAddressId: '' })); }

if (!process.env.RN_PORT) { console.log(bad ? `❌ tNAVER1111 ${bad}개 실패` : '✓ tNAVER1111 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const KP = crypto.generateKeyPairSync('rsa', { modulusLength: 3072, publicKeyEncoding: { type: 'spki', format: 'der' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } }); const SPKI = Buffer.from(KP.publicKey).toString('base64');
const open = (env) => { const raw = crypto.privateDecrypt({ key: KP.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(env.ek, 'base64')); const all = Buffer.from(env.ct, 'base64'); const d = crypto.createDecipheriv('aes-256-gcm', raw, Buffer.from(env.iv, 'base64')); d.setAuthTag(all.subarray(all.length - 16)); return JSON.parse(Buffer.concat([d.update(all.subarray(0, all.length - 16)), d.final()]).toString('utf8')); };
const APPID = 'nvTestApp' + Math.random().toString(36).slice(2, 8), SEC = '$2a$04$' + 'Qx9' + Math.random().toString(36).slice(2, 21).padEnd(19, 'z');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  const C2 = { st: 0, cmds: [], feeds: [], nvHits: 0 }; let ON = true;
  await p.route(/127\.0\.0\.1:8797\//, async (rt) => { const u = new URL(rt.request().url()); let b = {}; try { b = JSON.parse(rt.request().postData() || '{}'); } catch (e) {} const J = (o, s) => rt.fulfill({ status: s || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (/^\/nv\//.test(u.pathname)) C2.nvHits++;
    if (u.pathname === '/nv/st') { C2.st++; return J({ ok: true, ver: '0.1.22', pc: 'LOGGER', nv: { on: ON, pub: SPKI, cred: { has: true, at: Date.now(), chk: 'ok', idTail: '…abcd' }, test: { ok: true, at: Date.now(), msg: '✅ 연결됨 — 시험' }, write: { on: false }, ord: { at: Date.now(), n: 1 }, prd: { at: Date.now(), n: 2 }, q: 2 } }); }
    if (u.pathname === '/nv/cmd') { C2.cmds.push(b); return J({ ok: true, saved: true, test: { ok: true, msg: '✅ 연결됨' } }); }
    if (u.pathname === '/nv/feed') { C2.feeds.push(b); if (b.ack) return J({ ok: true, out: [] }); return J({ ok: true, out: [{ k: 'crm_naver_orders/PO9', c: 'crm_naver_orders', id: 'PO9', v: { id: 'PO9', ch: 'naver', at: new Date(Date.now() - 864e5).toISOString(), amt: 9000, fee: 500, qty: 1, sku: 'NVSKU', st: 'PAYED', rcv: { name: '받는분A' } }, merge: true }, { k: 'nv_listings/669', c: 'nv_listings', id: '669', v: { originNo: '669', no: '779', sku: 'NVSKU', live: true, qty: 1, price: 9000, st: 'SALE', name: '네이버 시험 책' }, merge: true }, { k: 'prd_books/x', c: 'prd_books', id: 'x', v: { bad: 1 } }] }); }
    return J({ ok: false }, 404); });
  /* 관리자 기기(HOME) · 설정 칸 열기 */
  await p.evaluate((spki) => { localStorage.setItem('rn-device', 'HOME'); S.devOk = true; db.collection('col2_naver').doc('pub').set({ spki, pc: 'LOGGER', at: new Date().toISOString() }); db.collection('col2_naver').doc('state').set({ pc: 'LOGGER', ver: '0.1.22', at: new Date().toISOString(), nv: { cred: { has: false }, test: null, write: { on: false }, ord: {}, prd: {} } });
    S.tab = 'settings'; S.sec = S.sec || {}; S.sec.set_naver = true; renderTabs(); renderMain(); }, SPKI);
  await p.waitForSelector('#nv_box #nv_send', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
  const V0 = await p.evaluate(() => { const b = document.getElementById('nv_box'); return b ? { t: b.textContent, send: !!b.querySelector('#nv_send:not([disabled])'), wr: b.querySelector('#nv_write') && b.querySelector('#nv_write').disabled, sec: b.querySelector('#nv_sec') && b.querySelector('#nv_sec').type } : null; });
  ok(V0 && /로거 번외/.test(V0.t) && /🔑 있음/.test(V0.t) && /저장된 값\s*없음/.test(V0.t) && /신청 순서/.test(V0.t) && /내 아이피/.test(V0.t) && V0.send && V0.wr === true && V0.sec === 'password', '🟩 칸 — 상태 줄 · 받는 열쇠 있음 · 값 없음 · 신청 순서(공인 IP 확인) · 시크릿 칸은 가림 · 연결 시험 전 쓰기 켜기 막힘', V0 && { k: /🔑 있음/.test(V0.t), n: /저장된 값\s*없음/.test(V0.t), s: V0.send, w: V0.wr, sec: V0.sec, ip: /내 아이피/.test(V0.t) });
  /* 꼴이 아닌 시크릿 → 보내지 않음 */
  await p.fill('#nv_id', APPID); await p.fill('#nv_sec', 'plain-secret'); await p.click('#nv_send'); await p.waitForTimeout(400);
  const n0 = await p.evaluate(async () => { const g = await db.collection('col2_naver_cmd').get(); return g.size; }); ok(n0 === 0, '시크릿이 $2a$ 꼴이 아니면 보내지 않음', n0);
  /* 사진(값 넣기 전 칸) */
  /* 진짜 보내기 */
  await p.fill('#nv_id', APPID); await p.fill('#nv_sec', SEC); await p.click('#nv_eye'); const eyeT = await p.$eval('#nv_sec', (i) => i.type); await p.click('#nv_send'); await p.waitForTimeout(1500);
  const S1 = await p.evaluate(async () => { const g = await db.collection('col2_naver_cmd').get(); const L = []; g.forEach((d) => L.push({ id: d.id, ...d.data() })); return { L, all: JSON.stringify(window.__FS || {}), ls: JSON.stringify(localStorage), id: document.getElementById('nv_id').value, sec: document.getElementById('nv_sec').value, prog: (document.getElementById('nv_prog') || {}).textContent || '' }; });
  const c1 = S1.L[0] || {}; let dec = null; try { dec = open(c1.env); } catch (e) { dec = { err: e.message }; }
  ok(eyeT === 'text' && S1.L.length === 1 && c1.k === 'cred' && c1.st === 'new' && c1.env && c1.env.alg === 'RSA-OAEP-256+A256GCM', '🔒 잠가 보내기 — 명령 1건(cred · new · 봉투)', { n: S1.L.length, k: c1.k });
  ok(!S1.all.includes(SEC) && !S1.all.includes(APPID) && !S1.ls.includes(SEC) && !S1.ls.includes(APPID), 'Firebase 전체·기기 저장소 어디에도 아이디·시크릿 평문 없음');
  ok(dec && dec.id === APPID && dec.sec === SEC && Math.abs(Date.now() - dec.ts) < 60e3, '로거 비밀 열쇠로 풀면 넣은 값 그대로(번외 col2-nv.js와 같은 꼴)', dec && dec.err);
  ok(S1.id === '' && S1.sec === '' && /②|③|로거/.test(S1.prog), '입력 칸 바로 비움 · 진행 막대(③ 로거가 받기를 기다림)', S1.prog.slice(0, 200));
  await p.evaluate((id) => db.collection('col2_naver_cmd').doc(id).set({ st: 'took' }, { merge: true }), c1.id); await p.waitForTimeout(300);
  const pTook = await p.evaluate(() => (document.getElementById('nv_prog') || {}).textContent || '');
  await p.evaluate((id) => db.collection('col2_naver_cmd').doc(id).set({ st: 'done', res: { ok: true, saved: true, test: { ok: true, msg: '✅ 연결됨 — 토큰 받음' } } }, { merge: true }), c1.id); await p.waitForTimeout(600);
  const pDone = await p.evaluate(() => (document.getElementById('nv_prog') || {}).textContent || '');
  ok(/④|연결 시험/.test(pTook) && /완료|저장됨/.test(pDone) && /연결됨/.test(pDone), '로거가 받음 → ④ 연결 시험 중 → 끝나면 ✅ 저장됨·연결됨(진행 막대에 남음)', { pTook: pTook.slice(0, 120), pDone: pDone.slice(0, 160) });
  /* 쓰기 켜기 — 상태가 연결 맞음일 때 · 두 번 */
  await p.evaluate(() => db.collection('col2_naver').doc('state').set({ pc: 'LOGGER', ver: '0.1.22', at: new Date().toISOString(), nv: { cred: { has: true, at: Date.now(), chk: 'ok', idTail: '…abcd' }, test: { ok: true, at: Date.now(), msg: '✅ 연결됨' }, write: { on: false }, ord: { at: Date.now(), n: 3 }, prd: { at: Date.now(), n: 12 } } })); await p.waitForTimeout(500);
  const wb = p.locator('#nv_write'); const dis = await wb.isDisabled(); await wb.click(); await p.waitForTimeout(500); const nW1 = await p.evaluate(async () => { const g = await db.collection('col2_naver_cmd').get(); let n = 0; g.forEach((d) => { if ((d.data() || {}).k === 'write') n++; }); return n; });
  await p.locator('#nv_write').click(); await p.waitForTimeout(600); const W2 = await p.evaluate(async () => { const g = await db.collection('col2_naver_cmd').get(); const L = []; g.forEach((d) => { const v = d.data() || {}; if (v.k === 'write') L.push(v); }); return L; });
  ok(!dis && nW1 === 0 && W2.length === 1 && W2[0].on === true, '쓰기 켜기 — 연결 맞은 뒤 열림 · 한 번 = 무장만 · 두 번 = 명령 1건(on)', { dis, nW1, W2 });
  if (process.env.RN_SHOT) { await p.evaluate(() => document.querySelector('[data-sec="set_naver"]').scrollIntoView()); await p.waitForTimeout(300); const el = await p.$('[data-sec="set_naver"]'); await el.screenshot({ path: process.env.RN_SHOT }); }
  /* 관리자 아님 */
  const NA = await p.evaluate(() => { const d0 = S.devOk; S.devOk = false; const h = nvSetHtml(); S.devOk = d0; return { inp: /id="nv_sec"/.test(h), hint: /관리자 기기에서만/.test(h) }; }); ok(!NA.inp && NA.hint, '관리자 기기가 아니면 값 넣기 칸 없음');
  console.log('③ 로거 웹앱 대신 쓰기');
  /* 로거가 아닌 기기(HOME)에서 한 번 돌림 → 8797/nv를 부르지 않음 */
  const h0 = C2.nvHits; await p.evaluate(async () => { S._nvNo = 0; await nvRelayTick(); }); ok(C2.nvHits === h0, '로거가 아닌 기기 — 127.0.0.1:8797/nv 를 부르지 않음', C2.nvHits - h0);
  await p.evaluate(async () => { localStorage.setItem('rn-device', 'LOGGER'); S._nvNo = 0; await db.collection('col2_naver').doc('pub').set({ spki: 'old', pc: 'LOGGER', at: '2026-11-01T00:00:00Z' }); await db.collection('col2_naver_cmd').doc('ctest1').set({ k: 'test', st: 'new', by: 'HOME', at: new Date().toISOString() }); await db.collection('col2_naver_cmd').doc('ccred1').set({ k: 'cred', st: 'new', env: { alg: 'RSA-OAEP-256+A256GCM', ek: 'x', iv: 'x', ct: 'x' }, by: 'HOME', at: new Date().toISOString() }); await nvRelayTick(); });
  await p.waitForTimeout(400);
  const R = await p.evaluate(async () => { const g = async (c, id) => { const d = await db.collection(c).doc(id).get(); return d.exists ? d.data() : null; }; const L = []; (await db.collection('col2_naver_cmd').get()).forEach((d) => L.push({ id: d.id, ...d.data() }));
    return { pub: await g('col2_naver', 'pub'), st: await g('col2_naver', 'state'), ord: await g('crm_naver_orders', 'PO9'), lst: await g('nv_listings', '669'), bad: await g('prd_books', 'x'), cmds: L }; });
  const cT = R.cmds.find((c) => c.id === 'ctest1'), cC = R.cmds.find((c) => c.id === 'ccred1'), c0 = R.cmds.find((c) => c.id === c1.id);
  ok(R.pub && R.pub.spki === SPKI, '번외 공개 열쇠가 바뀌었으면 col2_naver/pub 고침');
  ok(cT && cT.st === 'done' && cT.res && cT.res.ok && C2.cmds.some((c) => c.k === 'test') && C2.cmds.some((c) => c.k === 'write' && c.on === true), '새 명령(test·write)을 번외에 넘기고 done · 결과', { cT, n: C2.cmds.length });
  ok(cC && cC.st === 'done' && !('env' in cC) && C2.cmds.some((c) => c.k === 'cred' && c.env && c.env.ct === 'x') && c0 && c0.st === 'done' && C2.cmds.filter((c) => c.k === 'cred').length === 1, '새 cred 봉투는 번외에 넘긴 뒤 지움 · 이미 done인 명령은 다시 안 넘김', cC && Object.keys(cC));
  ok(R.ord && R.ord.sku === 'NVSKU' && R.lst && R.lst.live && !R.bad && C2.feeds.some((f) => f.ack && f.ack.includes('crm_naver_orders/PO9')), '읽은 주문·매물 → crm_naver_orders·nv_listings(허락한 칸만 · prd_books 거절) · ack', { ord: !!R.ord, lst: !!R.lst, bad: R.bad });
  ok(R.st && R.st.pc === 'LOGGER' && R.st.nv && R.st.nv.test && R.st.nv.test.ok && !JSON.stringify(R.st).includes('pub'), '상태 → col2_naver/state(값 없음)', R.st && Object.keys(R.st.nv));
  console.log('④ 통합 장부');
  const LD = await p.evaluate(async () => { localStorage.setItem('rn-device', 'HOME'); nvDataLoad(); await new Promise((r) => setTimeout(r, 400)); S._led = null; const v = ledNow(); S._ledView = 'all'; openLedger(); await new Promise((r) => setTimeout(r, 500)); const sh = document.getElementById('sheet');
    const chips = [...sh.querySelectorAll('.ledch')].map((x) => x.textContent.trim()).filter((t) => /네이버/.test(t)); return { rows: v.rows.filter((r) => r.ch.naver).length, sum: v.sum.naver, chips: chips.slice(0, 3), live: chips.some((t) => /판매중/.test(t)) }; });
  ok(LD.rows === 1 && LD.sum && LD.sum.ord === 1 && LD.sum.amt === 9000 && LD.live, '통합 장부 — 네이버 매물 줄 · 🟩 네이버 판매중 칩 · 주문 합계', LD);
  if (process.env.RN_SHOT2) { const sh = await p.$('#sheet'); if (sh) await sh.screenshot({ path: process.env.RN_SHOT2 }); }
  console.log('⑤ 📦 오늘 출고 — 🟩 네이버 칩·카드·발주 확인·송장 → 발송 처리');
  const iso = () => new Date().toISOString(); const stOn = (on) => p.evaluate((on) => db.collection('col2_naver').doc('state').set({ pc: 'LOGGER', ver: '0.1.22', at: new Date().toISOString(), nv: { cred: { has: true }, test: { ok: true, msg: '✅' }, write: { on }, ord: {}, prd: {} } }), on);
  await stOn(true);
  await p.evaluate((now) => { const R = { name: '받는분A', tel: '010-0000-0000', zip: '00000', addr: '시험시 시험구 시험로 1', addr2: '101호' }; const o = (id, oid, x) => db.collection('crm_naver_orders').doc(id).set({ id, orderId: oid, ch: 'naver', at: now, st: 'PAYED', place: 'NOT_YET', name: '네이버 출고 책 ' + id, qty: 1, unit: 9000, amt: 9000, sku: 'NVSKU', rcv: R, ...(x || {}) });
    return Promise.all([o('PA1', 'NO1'), o('PA2', 'NO2', { place: 'OK' }), o('PA3', 'NO3', { place: 'OK' }), o('PA4', 'NO4', { place: 'OK' }), o('PX9', 'NX9', { cancel: true, st: 'CANCELED' })]); }, iso());
  await p.evaluate(async () => { S.shipSrc = 'nv'; S.shipTab = 'confirm'; await openShip(); }); await p.waitForTimeout(1200);
  const V1 = await p.evaluate(() => { const sh = document.getElementById('sheet'); const ch = sh.querySelector('.shp-src[data-ssrc="nv"]'); const c = sh.querySelector('[data-anc="nv:NO1"]'); return { chip: ch ? ch.textContent.trim() : null, card: c ? c.textContent.replace(/\s+/g, ' ').slice(0, 400) : null, other: !!sh.querySelector('[data-anc="nv:NO2"]'), cx: !!sh.querySelector('[data-anc="nv:NX9"]'), conf: !!sh.querySelector('[data-nvconf="NO1"]:not([disabled])'), rows: shipRows().filter((r) => r.src === 'nv').map((r) => r.id + ':' + r.stage) }; });
  ok(V1.chip && /네이버/.test(V1.chip) && V1.card && /발주 확인/.test(V1.card) && /받는분A/.test(V1.card) && !V1.other && !V1.cx && V1.conf, '판매처 칩 🟩 네이버 · 🆕 확인할 주문 칸에 네이버 카드(발주 확인 전만 · 취소 주문 없음) · 🟩 발주 확인 맡기기', V1);
  ok(V1.rows.includes('NO1:confirm') && V1.rows.includes('NO2:deliv') && !V1.rows.some((r) => /NX9/.test(r)), '단계 — 발주 확인 전 = 확인 · 확인 끝 = 출고 준비', V1.rows);
  if (process.env.RN_SHOT3) { const el = await p.$('[data-anc="nv:NO1"]'); if (el) await el.screenshot({ path: process.env.RN_SHOT3 }); }
  await p.click('[data-nvconf="NO1"]'); await p.waitForTimeout(700); const cf0 = await p.evaluate(async () => { let n = 0; (await db.collection('col2_naver_cmd').get()).forEach((d) => { const v = d.data() || {}; if (v.k === 'job' && v.job && v.job.k === 'confirm') n++; }); return n; });
  await p.click('[data-nvconf="NO1"]'); await p.waitForTimeout(700);
  const CF = await p.evaluate(async () => { const L = []; (await db.collection('col2_naver_cmd').get()).forEach((d) => { const v = d.data() || {}; if (v.k === 'job' && v.job && v.job.k === 'confirm') L.push(v.job); }); const d = (await db.collection('crm_naver_orders').doc('PA1').get()).data(); return { L, sConf: d.sConf, st: shipRows().find((r) => r.id === 'NO1') }; });
  ok(cf0 === 0 && CF.L.length === 1 && CF.L[0].ids.join() === 'PA1' && /^nvcf:NO1:1$/.test(CF.L[0].id) && CF.sConf && CF.sConf.st === 'queued', '🟩 발주 확인 — 한 번 = 무장만 · 두 번 = 맡김 1건(confirm · 상품 주문 번호) · 우리 칸 sConf', CF);
  /* 송장 직접 입력 → 발송 처리 맡김 */
  await p.evaluate(async () => { S.shipTab = 'deliv'; await openShip(); }); await p.waitForTimeout(800);
  await p.fill('#nvno_NO2', '123456789012'); await p.click('[data-nvinv="NO2"]'); await p.waitForTimeout(700); await p.click('[data-nvinv="NO2"]'); await p.waitForTimeout(900);
  const DS = await p.evaluate(async () => { const L = []; (await db.collection('col2_naver_cmd').get()).forEach((d) => { const v = d.data() || {}; if (v.k === 'job' && v.job && v.job.k === 'dispatch') L.push(v.job); }); const d = (await db.collection('crm_naver_orders').doc('PA2').get()).data(); return { L, sInv: d.sInv, sDisp: d.sDisp, row: (shipRows().find((r) => r.id === 'NO2') || {}).stage }; });
  ok(DS.sInv && DS.sInv.no === '123456789012' && DS.sInv.co === 'HYUNDAI' && DS.sInv.via === 'hand' && DS.L.length === 1 && DS.L[0].rows[0].po === 'PA2' && DS.L[0].rows[0].co === 'HYUNDAI' && DS.L[0].rows[0].no === '123456789012' && DS.row === 'sending', '송장 직접 입력(두 번) → 우리 칸 sInv · 쓰기 켬이면 곧바로 발송 처리 맡김(롯데택배 = HYUNDAI) · 📤 보내는 중', DS);
  /* 같은 송장을 다른 주문에(약속 10) · 결과 done → ✅ 오늘 끝 */
  const U = await p.evaluate(() => nvInvPut('NO3', '롯데택배', '123456789012', 'hand')); ok(U && !U.ok && /약속 10/.test(U.msg), '같은 송장을 다른 네이버 주문에 거절(약속 10)', U);
  await p.evaluate(async (id) => { await db.collection('col2_naver_jobs').doc(nvJobKey(id)).set({ id, k: 'dispatch', st: 'done', ok: true, at: Date.now() }); }, DS.L[0].id); await p.waitForTimeout(600);
  ok(await p.evaluate(() => (shipRows().find((r) => r.id === 'NO2') || {}).stage) === 'done', '번외 결과 done → ✅ 오늘 끝');
  /* 📦 ALPS — 후보 · 결과 송장 → 발송 처리 */
  const AL = await p.evaluate(async () => { const C = alpsXCand(); const x = C.all.find((y) => y.key === 'nv:NO3'); const Y = y24oAlpsOrders(['nv:NO3']); await y24oInvSave([{ key: 'nv:NO3', invoice: '555566667777', status: 'ok', orderNo: 'X|nv:NO3' }], 'run1'); await new Promise((r) => setTimeout(r, 500)); const d = (await db.collection('crm_naver_orders').doc('PA3').get()).data(); const L = []; (await db.collection('col2_naver_cmd').get()).forEach((q) => { const v = q.data() || {}; if (v.k === 'job' && v.job && v.job.k === 'dispatch' && /NO3/.test(v.job.id)) L.push(v.job); }); return { why: x ? x.why : 'none', n: Y[0] && Y[0].o, src: Y[0] && Y[0].src, sInv: d.sInv, alps: d.alps, L }; });
  ok(AL.why === null && AL.src === 'nv' && AL.n && AL.n.recipient.address.includes('101호') && AL.n.items.length === 1, 'ALPS 「알라딘 밖 주문」 후보에 네이버 주문(발주 확인 끝 · 받는 분 주소)', { why: AL.why, src: AL.src });
  ok(AL.sInv && AL.sInv.via === 'alps' && AL.sInv.no === '555566667777' && AL.alps && AL.alps.res === 'inv' && AL.L.length === 1, 'ALPS 결과 송장 → 우리 칸(롯데택배) → 쓰기 켬이면 발송 처리 맡김', AL);
  /* 쓰기 꺼짐 → 송장만 적고 맡기지 않음 */
  await stOn(false); await p.waitForTimeout(300); const OFF = await p.evaluate(async () => { const r = await nvInvPut('NO4', 'CJ대한통운', '888899990000', 'hand'); let n = 0; (await db.collection('col2_naver_cmd').get()).forEach((q) => { const v = q.data() || {}; if (v.k === 'job' && v.job && /NO4/.test(v.job.id)) n++; }); return { r, n }; });
  ok(OFF.r.ok && /맡기지 않음/.test(OFF.r.msg) && OFF.n === 0, '쓰기 꺼짐 — 송장만 적고 발송 처리는 맡기지 않음(까닭)', OFF);
  if (process.env.RN_SHOT4) { await p.evaluate(async () => { S.shipSrc = 'nv'; S.shipTab = 'printed'; await openShip(); }); await p.waitForTimeout(700); const sh = await p.$('#sheet'); if (sh) await sh.screenshot({ path: process.env.RN_SHOT4 }); }
  console.log('⑥ 🛠 처리할 일 — 🟩 네이버 맡기기');
  const TQ = await p.evaluate(async () => { const T = { key: 'S1', title: '책1', last: '2026-11-11T00:00:00Z', acts: [] }; const a = { ch: 'naver', k: 'down', to: 0, cur: 1, origin: '669', no: '779', why: '알라딘에서 팔림' }; T.acts = [a]; const off = await ledNvGo([{ T, a }]); const cell0 = ledTodoCell(T);
    await db.collection('col2_naver').doc('state').set({ pc: 'LOGGER', ver: '0.1.22', at: new Date().toISOString(), nv: { test: { ok: true }, write: { on: true } } }); await new Promise((r) => setTimeout(r, 300)); const cell1 = ledTodoCell(T); const go = await ledNvGo([{ T, a }]);
    const L = []; (await db.collection('col2_naver_cmd').get()).forEach((q) => { const v = q.data() || {}; if (v.k === 'job' && v.job && v.job.k === 'status') L.push(v.job); }); const st1 = ledNvSt(T, a); const dup = await ledNvGo([{ T, a }]);
    await db.collection('col2_naver_jobs').doc(nvJobKey(L[0].id)).set({ id: L[0].id, k: 'status', st: 'done', ok: true, at: Date.now() }); await new Promise((r) => setTimeout(r, 300)); const st2 = ledNvSt(T, a);
    return { off, dis: /data-lednvgo[^>]*disabled/.test(cell0), btn: /data-lednvgo="S1\|nv\|669"/.test(cell1) && !/data-lednvgo[^>]*disabled/.test(cell1), go, L, st1, dup, st2, cell2: ledTodoCell(T).replace(/<[^>]+>/g, '').slice(0, 160) }; });
  ok(/꺼져/.test(TQ.off) && TQ.dis, '쓰기 꺼짐 — 「🟩 네이버 … 맡기기」 막힘 · 까닭', TQ.off);
  ok(TQ.btn && TQ.go === '' && TQ.L.length === 1 && TQ.L[0].k === 'status' && TQ.L[0].originNo === '669' && TQ.L[0].to === 'SUSPENSION' && TQ.st1 && TQ.st1.st === 'run' && /이미 맡김/.test(TQ.dup), '쓰기 켬 — 맡김 1건(원상품 669 판매중지) · 진행 중 · 같은 할 일 두 번 안 맡김', TQ);
  ok(TQ.st2 && TQ.st2.st === 'done' && /반영 기다림/.test(TQ.cell2), '번외 결과 done → ⏳ 반영 기다림(매물 줄이 고쳐지면 빠짐)', TQ.cell2);
  console.log('⑦ 📥 등록 — 🟩 네이버 토글 · ⚙ 등록 기본 설정');
  const RG = await p.evaluate(async () => { const bar = regPlatBar(); try { localStorage.removeItem('rn-regplat-nv'); } catch (e) {} const def = regPlatOn('nv');
    { const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('on'); S.detail = null; document.body.style.overflow = ''; } S.tab = 'settings'; S.sec = S.sec || {}; S.sec.set_naver = true; renderMain(); await new Promise((r) => setTimeout(r, 500)); const d = document.getElementById('nv_regset'); if (d) d.open = true; const miss0 = d ? d.querySelector('summary').textContent : '';
    const fill = (k, v) => { const i = document.getElementById('nvr_' + k); if (i) i.value = v; }; fill('leafCategoryId', '50005000'); fill('asTel', '000-0000-0000'); fill('baseFee', '3000'); fill('shippingAddressId', '101'); fill('returnAddressId', '102');
    document.getElementById('nv_regsave').click(); await new Promise((r) => setTimeout(r, 500)); const pf = (await db.collection('app_settings').doc('platforms').get()).data() || {};
    return { bar: /data-regplat="nv"/.test(bar) && /🟩 네이버 등록 <b>꺼짐/.test(bar), def, miss0, reg: (pf.nv || {}).reg || null, after: (document.querySelector('#nv_regset summary') || {}).textContent || '' }; });
  ok(RG.bar && RG.def === false, '🚦 등록할 곳에 🟩 네이버 등록(처음 꺼짐)', RG);
  ok(/빠진 칸/.test(RG.miss0) && RG.reg && RG.reg.leafCategoryId === '50005000' && RG.reg.deliveryCompany === 'HYUNDAI' && RG.reg.shippingAddressId === 101 && RG.reg.returnAddressId === 102 && /다 참/.test(RG.after), '⚙ 🟩 📥 등록 기본 설정 — 빠진 칸 표시 → 저장(app_settings/platforms.nv.reg) → 다 참', RG);
  if (process.env.RN_SHOT5) { const el = await p.$('#nv_regset'); if (el) await el.screenshot({ path: process.env.RN_SHOT5 }); }
  ok(dlg.length === 0, '브라우저 창(alert·confirm·prompt) 0', dlg);
  console.log(bad ? `❌ tNAVER1111 ${bad}개 실패` : '✓ tNAVER1111 모두 통과');
}).then(() => process.exit(bad ? 1 : 0));
