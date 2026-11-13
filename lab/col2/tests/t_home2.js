/* t_home2 — (11/13 home2 · 정범님 두 물음)
 *  1) '번외를 크롬(웹앱·수집기 탭)이랑 항상 같이 열어 줘야 하나?' — 🔌 홀로 연결이 알라딘 그림자 견줄 운영 칸(prd_listings·shp_state·crm_interactions)도
 *     클라우드에서 거른 꼴(번호·상태·값만)로 줌 · 로거에는 안 줌(약속 0) · 손님 정보 칸(구매자·수령인·주소·전화·문의 글)은 없음
 *  2) '로그인 정보를 저장했는데 왜 자꾸 손으로 다시 로그인하라고 하나' — 스스로 다시 로그인:
 *     ① '됨' 뒤 몇 분 안에 다시 풀리면 자취에 남기고 2시간에 2번이면 2시간 멈춤(헛되이 하루 몫을 다 쓰지 않게) → 정한 시간 뒤 저절로 풀림
 *     ② '연속 2번 실패' 멈춤도 2시간 뒤 저절로 다시(값 틀림·보안 문자·사이트 막음 멈춤은 그대로)
 *     ③ 하루 몫 글 = 지난 24시간 · 가장 오래된 시도가 빠지는 시각
 *     ④ 고친 판이 처음 켜질 때 한 번만 예전 판이 헛되이 쓴 예스24 셈을 풂(보안 문자 멈춤은 그대로)
 *     ⑤ 상태에 자취(시각·됨·까닭 — 아이디·비밀번호 없음)
 * 실행: node tests/t_home2.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makeDb } = require('./fakefs-admin.js'); const SOLO = require('../../../cloud/col2solo.js');
const { makeRelogin } = require(path.join(L.ROOT, 'helper', 'col2-relogin.js'));

(async () => {
  console.log('1) 🔌 홀로 연결 — 알라딘 그림자 견줄 운영 칸');
  { const PII = { buyerName: '손님A', receiver: '손님A', addr: '어딘가 1', phone: '010-0000-0000', question: '문의 글' };
    const v = SOLO.alTrim('prd_listings', { usedCode: 'U1', listingId: 77, status: 'sale', price: 5000, sku: 'ABCDEF1', qty: 1, ...PII });
    ok(v && v.listingId === 77 && v.price === 5000 && !('buyerName' in v) && !('phone' in v), '상품 줄 = 번호·상태·값만(손님 정보 없음)', v);
    const s = SOLO.alTrim('shp_state', { at: 't', tabCounts: { a: 1 }, orders: [{ orderNo: 'O1', items: [{ listingId: 9, buyer: '손님A' }], deliveryNo: 'D1', receiver: '손님A', addr: 'x', phone: '010-0000-0000' }] });
    ok(s.orders.length === 1 && s.orders[0].orderNo === 'O1' && s.orders[0].items[0].listingId === '9' && !JSON.stringify(s).includes('손님A') && !JSON.stringify(s).includes('010-'), '출고 상태 = 주문 번호·상품 번호·송장만', s);
    const q = SOLO.alTrim('crm_interactions', { questionId: 'Q1', answerStatus: 'done', question: '문의 글', buyerName: '손님A' }); ok(q.questionId === 'Q1' && !q.question && !q.buyerName, '문의 = 번호·답 상태만', q);
    /* 진짜 cloud/col2solo.js api — 서명 확인을 건너뛰려고 check만 바꿔 끼우지 않고, 등록한 공개 열쇠로 서명 */
    const crypto = require('crypto'); const F = makeDb(); const kp = crypto.generateKeyPairSync('ed25519'); const pub = kp.publicKey.export({ type: 'spki', format: 'pem' });
    const kp2 = crypto.generateKeyPairSync('ed25519'); const pub2 = kp2.publicKey.export({ type: 'spki', format: 'pem' });
    await F.C('app_settings').doc('col2_solo').set({ pcs: { HOME: { pub, kind: 'office' }, LOGGER: { pub: pub2, kind: 'logger' } } });
    await F.C('prd_listings').doc('aladin_77').set({ usedCode: 'U1', listingId: 77, status: 'sale', price: 5000, ...PII });
    await F.C('shp_state').doc('current').set({ at: 't', orders: [{ orderNo: 'O1', items: [{ listingId: 9 }], receiver: '손님A', phone: '010-0000-0000' }] });
    const API = SOLO.makeSolo({ db: F.db, C: F.C, FV: F.FV, log: () => {}, mods: async () => ({}) });
    const call = async (pc, key, want) => { const b = { pc, ts: Date.now(), nonce: crypto.randomBytes(8).toString('hex'), op: 'sync', ver: '0.1.49', want }; const raw = Buffer.from(JSON.stringify(b)); return API.api(raw, crypto.sign(null, raw, key).toString('base64')); };
    const want = [{ c: 'prd_listings', id: 'aladin_77' }, { c: 'shp_state', id: 'current' }, { c: 'crm_interactions', id: 'aladin_qna_5' }, { c: 'prd_listings', id: 'bad/id' }, { c: 'shp_state', id: 'confirmX' }];
    const [c1, r1] = await call('HOME', kp.privateKey, want); const D = r1.docs || [];
    ok(c1 === 200 && r1.alDocs === 1 && D.length === 3, '사무실 PC = 이름 규칙에 맞는 세 칸만 받음 · 답에 alDocs 표시', { c1, alDocs: r1.alDocs, n: D.length, ids: D.map((d) => d.id) });
    ok(!JSON.stringify(D).includes('손님A') && !JSON.stringify(D).includes('010-') && D.find((d) => d.c === 'prd_listings').v.price === 5000 && D.find((d) => d.c === 'crm_interactions').v === null, '받은 칸에 손님 정보 없음 · 없는 문서는 null', D);
    const [c2, r2] = await call('LOGGER', kp2.privateKey, want); ok(c2 === 200 && !r2.alDocs && !(r2.docs || []).length, '로거 = 이 세 칸을 주지 않음(약속 0)', { c2, alDocs: r2.alDocs, docs: r2.docs });
    /* 상태 거름에 예스24 다시 로그인 자취(값 없음) */
    const s2 = SOLO.stSum({ ver: '0.1.49', y24: { on: true, login: 'need', re: { has: true, auto: true, today: 3, next: 123, hist: [{ at: 1, ok: true, how: 'click', why: null }, { at: 2, ok: false, how: 'drop', why: "'됨' 9초 뒤 다시 로그인 화면", pw: 'secret' }] } } });
    ok(s2.y24 && s2.y24.re && s2.y24.re.today === 3 && s2.y24.re.hist.length === 2 && s2.y24.re.hist[1].how === 'drop' && !JSON.stringify(s2).includes('secret'), '홀로 연결 상태에 다시 로그인 자취(시각·됨·까닭만)', s2.y24 && s2.y24.re); }

  console.log('2) 🔐 스스로 다시 로그인');
  const mk = (D, rc, notes, TEST) => makeRelogin({ HOME: D, TEST, cred: { has: () => true, PF: { y24: { name: '예스24 판매관리' } }, sum: () => ({ y24: { has: true } }) }, cfg: () => ({ relogin: rc || {} }), isLogger: () => false, note: (m) => notes && notes.push(m) });
  const okCtx = { name: '예스24 판매관리', loginUrl: 'x', pre: async () => ({ ok: true }), nav: async () => {}, ev: async () => '', sleep: async () => {}, type: async () => {}, check: async () => true };
  const failCtx = { name: '예스24 판매관리', loginUrl: 'x', nav: async () => {}, ev: async () => '', sleep: async () => {}, type: async () => {}, check: async () => false };
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2h2_')); L.track(D); const nt = []; const R = mk(D, { gapMin: 0, dropMin: 5 }, nt);
    await R.run('y24', okCtx); ok(R.dropAfterOk('y24', '창 주소가 로그인 화면으로 바뀜(/Login/Login)') === true && !/멈춤/.test(R.why('y24', {}) || ''), "① '됨' 뒤 곧 풀림 1번 = 자취만(멈추지 않음)");
    await R.run('y24', okCtx); R.dropAfterOk('y24', '창 주소가 로그인 화면으로 바뀜(/Login/Login)'); const w = R.why('y24', {}) || '';
    ok(/멈춤 — 다시 로그인이 '됨' 뒤 몇 분 안에 또 풀림 2번/.test(w) && /저절로 다시 해 봄/.test(w), "① 2시간에 2번이면 멈춤 · 언제 저절로 다시 하는지 보임", w);
    const sm = R.sum().y24; ok(sm.hist.length === 4 && sm.hist.filter((h) => h.how === 'drop').length === 2 && !JSON.stringify(sm.hist).match(/pw|비밀번호:/), '⑤ 자취 4줄(됨 2 · 풀림 2) · 값 없음', sm.hist);
    const S0 = JSON.parse(fs.readFileSync(path.join(D, 'relogin.json'), 'utf8')); S0.y24.stop.until = Date.now() - 1000; fs.writeFileSync(path.join(D, 'relogin.json'), JSON.stringify(S0));
    const R2 = mk(D, { gapMin: 0, dropMin: 5 }, nt); ok(R2.why('y24', {}) === null && !R2.sum().y24.stop, '① 정한 시간이 지나면 저절로 풀림(사람 손 없음)', R2.why('y24', {}));
    ok(nt.some((m) => /저절로 다시 해 봄/.test(m)), '① 기록에 저절로 다시 해 본다는 줄'); }
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2h2_')); L.track(D); const R = mk(D, { gapMin: 0 }, [], true);
    await R.run('y24', okCtx); ok(R.dropAfterOk('y24', 'x') === false, '① 시험(TEST)에선 dropMin을 정하지 않으면 셈하지 않음(일부러 지우는 시험 장면)'); }
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2h2_')); L.track(D); const R = mk(D, { gapMin: 0, perHour: 50 }, []);
    await R.run('y24', failCtx); await R.run('y24', failCtx); const w = R.why('y24', {}) || ''; ok(/멈춤 — 연속 2번 실패/.test(w) && /저절로 다시 해 봄/.test(w), "② '연속 2번 실패' 멈춤 = 2시간 뒤 저절로 다시", w);
    const S0 = JSON.parse(fs.readFileSync(path.join(D, 'relogin.json'), 'utf8')); S0.y24.stop.until = Date.now() - 1; fs.writeFileSync(path.join(D, 'relogin.json'), JSON.stringify(S0)); ok(mk(D, { gapMin: 0, perHour: 50 }, []).why('y24', {}) === null, '② 그 시간이 지나면 다시 해도 됨');
    const S1 = JSON.parse(fs.readFileSync(path.join(D, 'relogin.json'), 'utf8')); S1.y24.stop = { at: Date.now(), why: '로그인 화면에 보안 문자 — 사람 손이 필요', human: true, until: Date.now() - 1 }; fs.writeFileSync(path.join(D, 'relogin.json'), JSON.stringify(S1));
    ok(/보안 문자/.test(mk(D, { gapMin: 0 }, []).why('y24', {}) || ''), '② 보안 문자(사람 손) 멈춤은 시간이 지나도 그대로'); }
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2h2_')); L.track(D); const R = mk(D, { gapMin: 0, perHour: 50, perDay: 3 }, []);
    for (let i = 0; i < 3; i++) await R.run('y24', okCtx); const w = R.why('y24', {}) || ''; ok(/24시간에 3번까지 — \d\d\/\d\d \d\d:\d\d부터 다시/.test(w) && !/내일/.test(w), '③ 하루 몫 글 = 지난 24시간 · 다시 되는 시각', w);
    ok(R.sum().y24.next > Date.now() + 23 * 3600e3, '③ 상태에 다시 되는 때(next)'); }
  { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'c2h2_')); L.track(D); const t = Date.now();
    fs.writeFileSync(path.join(D, 'relogin.json'), JSON.stringify({ y24: { tries: Array.from({ length: 10 }, (_, i) => t - i * 600e3), fails: 0, stop: null, auto: true, n: 30, last: { at: t, ok: true } }, al: { tries: [t], fails: 1, stop: { at: t, why: '로그인 화면에 보안 문자 — 사람 손이 필요', human: true }, auto: true } }));
    for (const m of ['.fix1111', '.fix1112']) fs.writeFileSync(path.join(D, 'relogin.json' + m), '1');
    const nt = []; const R = mk(D, {}, nt); ok(R.why('y24', {}) === null && R.sum().y24.today === 0, '④ 고친 판이 처음 켜질 때 예전 판이 헛되이 쓴 예스24 셈 10번을 한 번 풂', R.why('y24', {}));
    ok(/보안 문자/.test(R.why('al', {}) || ''), '④ 다른 일(알라딘)·사람 손 멈춤은 그대로'); ok(nt.some((m) => /헛되이 쓴 오늘 다시 로그인 셈 10번/.test(m)), '④ 기록에 한 줄', nt);
    await R.run('y24', okCtx); await R.run('y24', okCtx); const R2 = mk(D, {}, []); ok(R2.sum().y24.today === 2, '④ 한 번만(두 번째 켜질 땐 풀지 않음)', R2.sum().y24.today); }
  L.done('t_home2');
})().catch((e) => { console.log('✗ 예외', e); process.exit(1); });
