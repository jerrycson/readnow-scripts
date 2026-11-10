/* tVOICE — (11/10 정범님) 🗣 판매자 구매평·문의 글 — 웹앱 쪽
 *  ① 순수: 아이디 가림(앞 2자+***) · 주제 나누기 · 번외 조각 + 운영 평가 묶음에서 같은 글은 한 번만 · 연구 셈(주제·불만 끌림·달마다·규모·우리 숍·새 낱말 후보) · 거르기
 *  ② 번외 중계(c2RelayTick): 판매자 목록 부탁 lists sellers → 숍 번호·이름·평가 수만(손님 연결·연락처·사업자 정보 없음 · 우리 숍 뺌) · 로거 PC에도 줌 · 로거엔 prd_market_nobook 목록은 여전히 안 줌
 *  ③ 🧑‍💼 판매자 상세 › 🗣 구매평·문의 글 카드: 그 판매자 글 모두 · 아이디 가림 · 불만족 거르기 · 비밀글 글 없음
 *  ④ 📊 🗣 구매평·문의 연구 화면: 주제 표 · 대표 글 · 주제 줄 누르면 거름 · 새 낱말 후보 두 번 눌러 더함(app_settings/voice_lex) · 연구 요약(app_settings/voice_study)엔 글 원문·아이디 없음 · 브라우저 팝업 없음
 *  지어낸 값만(실제 숍·손님 없음)
 * 실행: cd pw && RN_PORT=<포트> node tVOICE.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 700) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  let dlg = 0; p.on('dialog', (d) => { dlg++; d.dismiss().catch(() => {}); });
  console.log('① 순수');
  const R1 = await p.evaluate(() => { const lex = voLex(); const c2 = [{ sc: '12345', kind: 'r', items: [{ k: 'a', d: '2026-10-01', r: 'bad', c: '배송이 너무 늦어요 포장도 허술', a: 'tu***' }, { k: 'b', d: '2026-10-02', r: 'good', c: '책 상태 깨끗하고 친절해요', a: 'ab***' }, { k: 'c', d: '2026-10-03', r: 'bad', c: '설명과 다르게 밑줄이 많아요', a: 'cd***' }] }, { sc: '12345', kind: 'q', items: [{ d: '2026-10-04', t: '사진과 같은 책인가요', a: 'ef***', sec: false, ans: true, reply: '네 같습니다' }, { d: '2026-10-05', t: '', a: 'gh***', sec: true }] }];
    const op = [{ sc: '12345', sellerId: 'sc_12345', items: [{ d: '2026-10-01', r: 'bad', c: '배송이 너무 늦어요 포장도 허술', a: 'tuvwxyz' }, { d: '2026-09-01', r: 'bad', c: '찢어진 채로 왔어요 환불 요청 찢어진', a: 'qwerty1' }, { d: '2026-09-02', r: 'bad', c: '곰팡이핌 곰팡이핌 냄새', a: 'qw' }, { d: '2026-09-03', r: 'bad', c: '먼지투성이 왔음', a: 'q1' }, { d: '2026-09-04', r: 'bad', c: '먼지투성이 별로', a: 'q2' }, { d: '2026-09-05', r: 'bad', c: '먼지투성이 실망', a: 'q3' }] }];
    const rows = voRows(c2, op, lex); const st = voStats(rows, { lex, sizeOf: () => '작음(<300)', ours: [{ r: 'good', c: '빠른 배송 감사' }, { r: 'bad', c: '파손되어 왔어요' }] });
    return { mask: [voMask('tuvwxyz'), voMask('ab***'), voMask(''), voMask('홍길동')], rows: rows.map((x) => ({ k: x.k, a: x.a, tp: x.tp, src: x.src, sec: x.sec })), st: { n: st.n, q: st.q, qSec: st.qSec, cnt: st.cnt, ship: st.tp.find((t) => t.k === 'ship'), gap: st.tp.find((t) => t.k === 'gap'), months: st.months.map((m) => m.m), sizes: st.sizes, ours: st.ours, cands: st.cands.map((c) => c.w) },
      f: voFilter(rows, { tp: 'damage' }).length, fq: voFilter(rows, { q: '밑줄' }).length, fk: voFilter(rows, { k: 'q' }).length }; });
  ok(R1.mask.join(',') === 'tu***,ab***,,홍길***', '아이디 가림 = 앞 2자 + ***', R1.mask);
  ok(R1.rows.length === 10 && R1.rows.filter((x) => x.k === 'r').length === 8 && R1.rows.every((x) => !x.a || /^.{1,2}\*\*\*$/.test(x.a)), '번외 조각 + 운영 평가 묶음 — 같은 글(숍·날짜·만족도·글)은 한 번만 · 운영 칸 원래 아이디도 가려서', R1.rows.length);
  ok(R1.st.n === 8 && R1.st.q === 2 && R1.st.qSec === 1 && R1.st.cnt.bad === 7 && R1.st.ship.n === 1 && R1.st.ship.bad === 1 && R1.st.gap.n === 1 && R1.st.months.join() === '2026-09,2026-10', '연구 셈: 구매평·문의·비밀글 · 주제마다 언급·불만 · 달마다', R1.st);
  ok(R1.st.ours.n === 2 && R1.st.ours.cnt.bad === 1 && R1.st.ours.tp.damage === 1 && R1.st.sizes[0].g === '작음(<300)', '우리 숍 견줌(주제 몫) · 판매자 규모마다', R1.st.ours);
  ok(R1.st.cands.includes('먼지투성이') && !R1.st.cands.some((w) => /배송|포장/.test(w)), "새 낱말 후보 = 주제를 못 찾은 불만족 글에 3번 넘게 나온 낱말('먼지투성이') · 이미 사전에 있는 낱말은 안 냄", R1.st.cands);
  ok(R1.f === 1 && R1.fq === 1 && R1.fk === 2, '거르기: 주제(파손) · 낱말 · 문의만');

  console.log('② 번외 중계 — 판매자 목록');
  const calls = []; let pend = null; let pcNow = 'LOGGER-1'; const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); calls.push({ p: u.pathname, b: b ? JSON.parse(b) : null });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') { const x = pend || {}; pend = null; return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: pcNow, pcSrc: 'web', ver: '0.1.13', ...x }); } return J({ ok: true }); });
  await p.evaluate(async () => { localStorage.setItem('rn-c2seen', '1'); S.devOk = true;
    await db.collection('sellers').doc('sc_12345').set({ sc: '12345', name: '가게일', totalReviewCount: '1,234', phone: '010-0000-0000', owner: '대표A', linkedCustomers: [{ customerId: 'c1' }] });
    await db.collection('sellers').doc('sc_996008').set({ sc: '996008', name: '우리', totalReviewCount: 50 }); await db.collection('sellers').doc('sc_777').set({ sc: '777', name: '가게둘' });
    await db.collection('prd_market_nobook').doc('K1').set({ usedCode: 'U1', title: '시험 책' }); });
  const tick = async (pc, x) => { calls.length = 0; pcNow = pc; pend = x; await p.evaluate(async (pc) => { localStorage.setItem('rn-device', pc); S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); }, pc); return calls.slice(); };
  let C = await tick('LOGGER-1', { kind: 'logger', lists: [{ c: 'sellers', n: 10, after: null }, { c: 'prd_market_nobook', n: 5 }] }); const an = (C.find((c) => c.p === '/relay/answer') || {}).b || {}; const SL = (an.lists || {}).sellers || [];
  ok(SL.length === 3 && SL.find((d) => d.id === 'sc_12345').v.n === 1234 && SL.find((d) => d.id === 'sc_996008').v === null && SL.find((d) => d.id === 'sc_777').v.sc === '777', '로거 PC에도 판매자 목록 — 숍 번호·이름·평가 수 · 우리 숍은 빈 값', SL);
  ok(!/010-0000-0000|대표A|linkedCustomers|c1/.test(JSON.stringify(an)) && !(an.lists || {}).prd_market_nobook, '연락처·대표자·손님 연결은 넘기지 않음 · 로거엔 우리 상품 목록(prd_market_nobook) 안 줌', Object.keys(an.lists || {}));

  console.log('③ 판매자 상세 카드');
  await p.evaluate(async () => { await db.collection('col2_voice').doc('12345_r0001').set({ sc: '12345', kind: 'r', seq: 1, items: [{ k: 'a', d: '2026-10-01', r: 'bad', c: '배송이 너무 늦어요', a: 'tu***' }, { k: 'b', d: '2026-10-02', r: 'good', c: '책 상태 깨끗해요', a: 'ab***' }] });
    await db.collection('col2_voice').doc('12345_qtail').set({ sc: '12345', kind: 'q', seq: 'tail', items: [{ d: '2026-10-04', t: '사진과 같은 책인가요', a: 'ef***', ans: true, reply: '네' }, { d: '2026-10-05', t: '', a: 'gh***', sec: true }] });
    await db.collection('col2_voice_s').doc('12345').set({ sc: '12345', r: { n: 2, done: true }, q: { state: 'ok', n: 2, sec: 1, done: true }, at: '2026-11-10T10:00:00Z' });
    await db.collection('seller_reviews').doc('sc_12345_2026-09').set({ sc: '12345', sellerId: 'sc_12345', month: '2026-09', items: [{ d: '2026-09-09', r: 'bad', c: '파손되어 왔어요', a: 'realid99' }] });
    S.sellers.set('sc_12345', { id: 'sc_12345', sc: '12345', name: '가게일', totalReviewCount: 1234 }); openSeller('sc_12345'); });
  await p.waitForTimeout(1500); const card = await p.evaluate(() => { const el = document.getElementById('voCard'); return el ? el.innerText : null; });
  ok(card && /구매평 3/.test(card) && /문의 2/.test(card) && /배송이 너무 늦어요/.test(card) && /파손되어 왔어요/.test(card) && /re\*\*\*/.test(card) && !/realid99/.test(card) && /비밀글/.test(card) && /판매자 답: 네/.test(card), '판매자 상세 › 🗣 구매평·문의 글: 번외 글 + 운영 평가 글 · 아이디 가림 · 비밀글 글 없음 · 판매자 답', card && card.slice(0, 600));
  await p.click('#voCard [data-vocf="r:bad"]'); const card2 = await p.evaluate(() => document.getElementById('voCard').innerText);
  ok(/배송이 너무 늦어요/.test(card2) && !/깨끗해요/.test(card2) && !/사진과 같은/.test(card2), '불만족만 거르기');

  console.log('④ 연구 화면');
  await p.click('#voCard [data-voopen]'); await p.waitForTimeout(1200); const sh = await p.evaluate(() => ({ t: $('#sheet').innerText, d: S.detail }));
  ok(sh.d && sh.d.voice && /주제 — 무엇을 말하나/.test(sh.t) && /🚚 배송 속도/.test(sh.t) && /대표 글/.test(sh.t) && /우리 숍과 견줌/.test(sh.t) && /판매자 규모마다/.test(sh.t) && /새 낱말 후보/.test(sh.t), '🗣 구매평·문의 연구 화면: 주제 표·대표 글·달마다·규모·우리 숍·새 낱말 후보', sh.t.slice(0, 500));
  await p.click('[data-votp="damage"]'); const f1 = await p.evaluate(() => ({ tp: S.vo.f.tp, t: $('#sheet').innerText }));
  ok(f1.tp === 'damage' && /맞는 글 1건/.test(f1.t), '주제 줄을 누르면 그 주제 글만', f1.tp);
  /* 새 낱말 후보 — 시험용 글로 후보를 만들고 두 번 눌러 더함 */
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); S.vo.op.push({ sc: '777', sellerId: 'sc_777', items: [1, 2, 3, 4].map((i) => ({ d: '2026-08-0' + i, r: 'bad', c: '먼지투성이 왔음 ' + i, a: 'zz' + i })) }); voRe(); voDraw(); });
  const has = await p.evaluate(() => !!document.querySelector('[data-voadd="먼지투성이"]')); ok(has, "후보 '먼지투성이'가 보임");
  if (has) { await p.selectOption('[data-vocand="먼지투성이"]', 'cond'); await p.click('[data-voadd="먼지투성이"]'); const w0 = await p.evaluate(() => (window.__FS.app_settings || {}).voice_lex || null); await p.click('[data-voadd="먼지투성이"]'); await p.waitForTimeout(300);
    const w1 = await p.evaluate(() => (window.__FS.app_settings || {}).voice_lex || null); const gone = await p.evaluate(() => !document.querySelector('[data-voadd="먼지투성이"]')); ok(!w0 && w1 && (w1.add.cond || []).includes('먼지투성이') && gone, '두 번 눌러야 더함 → app_settings/voice_lex · 더한 뒤엔 후보에서 빠짐(주제를 찾음)', w1); }
  /* 연구 요약 — 다 받은 뒤 관리자 기기에서 하루 한 번 · 글 원문·아이디 없음 */
  await p.evaluate(() => { localStorage.setItem('rn-device', 'JS-MAIN'); for (let i = 0; i < 50; i++) S.vo.c2.push({ sc: '12345', kind: 'r', items: [{ d: '2026-07-' + String(1 + (i % 28)).padStart(2, '0'), r: 'good', c: '좋아요 글 ' + i, a: 'xx' + i }] }); S.vo.more = false; S.vo.opMore = false; S._voSaved = null; voRe(); voSave(); });
  await p.waitForTimeout(300); const VS = await p.evaluate(() => (window.__FS.app_settings || {}).voice_study || null);
  ok(VS && VS.n >= 50 && Array.isArray(VS.tp) && !/좋아요 글|배송이 너무|xx1|tu\*\*\*/.test(JSON.stringify(VS)), '연구 요약(app_settings/voice_study) = 숫자·낱말만 · 글 원문·아이디 없음', VS && Object.keys(VS));
  ok(dlg === 0, '브라우저 팝업 없음');
  await p.evaluate(() => history.back()); await p.waitForTimeout(400); ok(await p.evaluate(() => S.vo === null || S.vo === undefined || !S.detail || !S.detail.voice), '닫으면 모은 글을 버림(메모리)');
  console.log(bad ? `✗ tVOICE ${bad}개 실패` : '✓ tVOICE 모두 통과');
});
