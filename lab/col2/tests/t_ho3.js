/* t_ho3 — (11/11 col2rep3 · 약속 38·48 '번외로 모두 바꾸기 ⑤ 일 하나씩 넘기기' 3회차) 넘기는 길 넓힘 — 번외 일 돌리기(col2-jobs) 쪽
 *  ① 🔎 국중을 이 PC로 넘기면: 운영처럼 다시 볼 날(120일)이 지난 책만 묻고(먼저 운영 문서를 받아 봄 · 바깥 요청 없음) · 결과는 운영 extSave 꼴 {at, chk, sig, none, d, by, q}로 운영 칸(ext_basic)에 맡김 · 지문은 운영 공용 파일 그대로
 *  ② 🅣 알라딘 TTB '이 주소의 OpenAPI 서비스는 종료' → 못 읽음으로 세지 않고 건너뜀 · 그날은 더 묻지 않음
 *  ③ 💱 환율: 한국 11:35 뒤·운영 키(eximKey)가 온 뒤에만 읽음 · 넘기면 수출입은행 고시를 ext_fx에 없을 때만 맡김(frankfurter는 안 맡김)
 *  ④ 🔍 시세를 넘기면 7일 안에 본 상품은 차례에 넣지 않음(운영 nbDays와 같음)
 *  ⑤ 외부 정보 견주기: 칸마다 다른 곳(rows) · 기본 정보의 값·상태·표지만 다르고 운영이 6시간 넘게 전에 읽었으면 '때가 다름'
 *  ⑥ 수집기 본문: 넘긴 일만 쉼(국중 = extFill에서 뺌 · 환율 = extFx 쉼 · 시세 = 처음 보는 상품만) · 머리는 안 바꿈
 * 실행: node tests/t_ho3.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makeJobs } = require('../helper/col2-jobs.js'); const COL2 = require('../col2-config.js'); const CMP = require('../shadow/col2-compare-core.js'); const HOF = require('../shadow/col2-handoff.js');
const X0 = require(path.join(L.PROD_REPO, 'readnow-ext-core.js'));
(async () => {
  const DB = {}; const ops = [], outs = [], notes = []; let HAND = {}; const calls = []; let keys = {};
  const X = { ...X0, run: async (src, o) => { calls.push([src, o.isbn]); if (src === 'ttb') return { ok: false, why: '999 www.aladin.co.kr 도메인을 통한 OpenAPI서비스는 종료되었습니다.' }; if (src === 'nl') return { ok: true, d: { title: '책 ' + o.isbn, publisher: '출판사' } }; return { ok: true, none: true }; },
    fxRun: async (o) => (o.keys && o.keys.eximKey ? { ok: true, rates: { USD: 1343.3 }, src: 'koreaexim', date: '2026-11-11' } : { ok: true, rates: { USD: 1339.01 }, src: 'frankfurter', date: '2026-11-11' }) };
  const pass = () => ({ ok: true, waitMs: 0 }); const pace = { check: pass, take: async () => ({ ok: true }), ok() {}, fail() {} }; const site = { check: pass, take: async () => ({ ok: true }), ok() {}, fail() {} };
  let CFGJ = { on: true, off: TK_OFF(['ext.nl', 'ext.ttb', 'ext.fx']), pass: { minN: 1, waitMin: 5 } };
  function TK_OFF(keep) { return require('../shadow/col2-tasks.js').TASKS.map((t) => t.k).filter((k) => !keep.includes(k)); }
  const ctx = { home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2ho3-')), cfg: () => CFGJ, kind: () => 'office', pc: () => 'JS-MAIN', PASS: COL2.PASS, BUSY: { restMs: 1000 }, busy: () => null, VERSION: 'T',
    out: (c, id, v) => outs.push({ c, id, v }), note: (m) => notes.push(m), pace, site, ext: () => X, keysFor: () => keys, http: async () => ({ status: 200, text: '' }), redact: (v) => v,
    want: (c, id) => { const k = c + '/' + id; return k in DB ? { have: true, v: DB[k] } : null; }, handed: (k) => !!HAND[k], opOut: (job, c, id, v) => { ops.push({ job, c, id, v }); return true; } };
  const J = makeJobs(ctx); const run = async (n) => { const R = []; for (let i = 0; i < n; i++) R.push(await J.step()); return R; };
  const day = () => (J.summary() || {});

  console.log('① 국중 넘김');
  HAND = { 'ext.nl': true }; const old = new Date(Date.now() - 200 * 864e5).toISOString(), fresh = new Date(Date.now() - 3 * 864e5).toISOString();
  const B1 = '9788937460449', B2 = '9788937460456'; J.feedBooks([{ itemId: '1', bookId: 'b1', prod: { isbn13: B1, title: '가' } }, { itemId: '2', bookId: 'b2', prod: { isbn13: B2, title: '나' } }]);
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.nl']) }; let r = await run(2);
  ok(r.every((x) => !x.did && /운영 문서 먼저/.test(x.why)) && !calls.length, '운영 문서를 받기 전엔 묻지 않음(바깥 요청 0 · 차례 뒤로)', r);
  DB['ext_basic/' + B1] = { isbn: B1, src: { nl: { at: fresh, chk: fresh, sig: 'x', d: { title: '가' } } } }; DB['ext_basic/' + B2] = { isbn: B2, src: { nl: { at: old, chk: old, sig: X0.sig({ none: false, d: { title: '옛' } }, 'nl'), d: { title: '옛' } } } };
  r = await run(6); const nlOps = ops.filter((o) => o.job === 'ext.nl');
  ok(calls.length === 1 && calls[0][1] === B2 && (day()['ext.nl'] || {}).skip === 1, '다시 볼 날(120일) 전인 책은 묻지 않음 · 지난 책만 물음', { calls, d: day()['ext.nl'] });
  const o1 = nlOps[0]; const HD = { jobs: { 'ext.nl': { on: true, pc: 'JS-MAIN', at: new Date().toISOString() } } };
  ok(nlOps.length === 1 && o1.c === 'ext_basic' && o1.id === B2 && o1.v.obj.sig === X0.sig({ none: false, d: { title: '책 ' + B2, publisher: '출판사' } }, 'nl') && o1.v.obj.by === '번외 JS-MAIN' && HOF.writeOk(HD, { ...o1, job: 'ext.nl', c: o1.c }, 'JS-MAIN').ok, '결과를 운영 extSave 꼴로 운영 칸(ext_basic)에 맡김 · 지문 = 운영 공용 파일 sig', o1);
  const P = HOF.extPlan(DB['ext_basic/' + B2], 'nl', o1.v.obj, 'basic', X0.sameSig); ok(P.st === 'changed' && P.hist && P.hist.d.title === '옛', "운영 판단 규칙(extPlan): 다르면 '바뀜' · 옛 값을 보관", P.st);
  ok(HOF.extPlan({ src: { nl: { ...o1.v.obj, at: old } } }, 'nl', o1.v.obj, 'basic', X0.sameSig).st === 'same' && HOF.extPlan({ src: { nl: { at: old, d: { title: '옛' } } } }, 'nl', { ...o1.v.obj, none: true, d: null }, 'basic', X0.sameSig).st === 'keep', "같은 지문 = 확인 시각만 · 받아 둔 값이 있는데 '없음' = 받아 둔 값 그대로(운영 11/08 규칙)");
  HAND = {}; ops.length = 0; DB['ext_basic/9788937460463'] = { isbn: '9788937460463', src: { nl: { at: fresh, chk: fresh, sig: 'y', d: { title: '다' } } } }; /* (col2rep5) 넘기지 않은 그림자는 운영이 읽어 둔 책만 묻는다 */ J.feedBooks([{ itemId: '3', bookId: 'b3', prod: { isbn13: '9788937460463', title: '다' } }]); calls.length = 0; await run(4);
  ok(calls.length === 1 && !ops.length, '넘기지 않았으면 예전처럼 그림자로만(다시 볼 날 상관없이 묻고 · 운영 칸에 안 맡김)', { calls, ops });

  console.log('② TTB 서비스 끝');
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.ttb']) }; calls.length = 0; J.feedBooks([{ itemId: '4', bookId: 'b4', prod: { isbn13: '9788937460470', title: '라' } }, { itemId: '5', bookId: 'b5', prod: { isbn13: '9788937460487', title: '마' } }]); await run(4);
  const tt = day()['ext.ttb'] || {}; ok(calls.filter((c) => c[0] === 'ttb').length === 0 && !tt.fail, "TTB는 종료됨(ttb1 · 2026-10-30) — 아예 묻지 않음 · 못 읽음으로 세지 않음", JSON.stringify({ calls, tt }));

  console.log('③ 환율');
  const kmin = (() => { const t = new Date(Date.now() + 9 * 3600e3); return t.getUTCHours() * 60 + t.getUTCMinutes(); })(); CFGJ = { ...CFGJ, off: TK_OFF(['ext.fx']) }; calls.length = 0; ops.length = 0; HAND = { 'ext.fx': true };
  keys = {}; await run(2); const q0 = J.qLen('ext.fx'); keys = { eximKey: 'k' }; await run(1); const ran1 = J._S().fxDay;
  if (kmin >= 11 * 60 + 35) ok(q0 === 0 && !J._S().fxDay === false || ran1, '한국 11:35 뒤 · 운영 키가 온 뒤에만 읽음(키 오기 전엔 안 읽음)', { q0, ran1 });
  else ok(!ran1, '한국 11:35 전엔 읽지 않음(수출입은행 고시 전 · 운영 extFx와 같음)', { ran1, kmin });
  if (ran1) { DB['ext_fx/2026-11-11'] = null; /* 웹앱이 '문서 없음'으로 넘김 */ await run(3); }
  { const J2 = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2ho3b-')) }); const S = J2._S(); /* 넘김 쓰기만 따로 — 운영 문서가 없고 수출입은행이면 맡김 · frankfurter·있는 날은 안 맡김 */
    const src = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-jobs.js'), 'utf8'); ok(/function hoFx\(w, v\) \{ if \(!handed\('ext\.fx'\)\) return;.*if \(ctx\.beat\) ctx\.beat\('ext\.fx'\); if \(v\) return;/.test(src) && /res\.src !== 'koreaexim'\) return/.test(src), "환율 맡김: 운영 ext_fx 문서가 없을 때만 · 수출입은행(koreaexim)일 때만", S ? 'ok' : ''); }
  if (ran1) { const fxo = ops.filter((o) => o.job === 'ext.fx'); ok(fxo.length === 1 && fxo[0].v.src === 'koreaexim' && fxo[0].id === '2026-11-11', '넘긴 환율: 수출입은행 고시를 운영 칸(ext_fx)에 맡김', fxo); }

  { /* (11/17 bunoe1 · 정범님 'Tampermonkey 0') ③-2 운영 ext_fx 문서가 이미 있어도 수출입은행을 읽었으면 소식(beat) — 없으면 넘긴 뒤 다음 날부터 소식이 끊겨 30시간 뒤 운영(로거 Tampermonkey)이 다시 떠맡았음(진단 11/17) */
    const kd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const DB2 = { ['ext_fx/' + kd]: { date: kd, rates: { USD: 1343.3 }, src: 'koreaexim' }, 'ext_fx/2026-11-11': { date: '2026-11-11', rates: { USD: 1343.3 }, src: 'koreaexim' } };
    const mk = (kk) => { const beats = [], ops2 = []; const J3 = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2ho3c-')), cfg: () => ({ ...CFGJ, off: TK_OFF(['ext.fx']), fx: { after: '00:00', at: ['00:00'], keyWaitMin: 0 } }), keysFor: () => kk,
      want: (c, id) => { const k = c + '/' + id; return k in DB2 ? { have: true, v: DB2[k] } : null; }, handed: (k) => k === 'ext.fx', opOut: (job, c, id, v) => { ops2.push({ job, c, id, v }); return true; }, beat: (k) => { beats.push(k); return true; } }); return { J3, beats, ops2 }; };
    const A = mk({ eximKey: 'k' }); for (let i = 0; i < 4; i++) await A.J3.step();
    ok(A.beats.includes('ext.fx') && !A.ops2.some((o) => o.job === 'ext.fx'), '운영 문서가 이미 있어도 수출입은행을 읽으면 소식(beat) · 쓰기는 안 함(없을 때만)', { beats: A.beats, ops: A.ops2 });
    const B = mk({}); for (let i = 0; i < 4; i++) await B.J3.step();
    ok(!B.beats.includes('ext.fx') && !B.ops2.length, 'frankfurter로 읽은 날은 소식 없음(일을 못 한 것 → 30시간 뒤 운영이 다시)', { beats: B.beats, ops: B.ops2 }); }
  { /* (11/17 bunoe1 · 정범님 19.2) ③-3 💱 정해진 시각 — 넘겨받은 PC는 jobs.fx.at 시각마다 한 번(운영 키가 온 뒤) · 다른 PC로 넘겼으면 받지 않음(그 값만 읽음) · 안 넘겼으면 예전 그림자 */
    const kd = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); let AT = ['00:00', '23:59']; let KK = {};
    const mk = (o) => { const calls3 = [], beats = []; const X3 = { ...X, fxRun: async (q) => { calls3.push(q.day); return X.fxRun(q); } };
      const J4 = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2ho3d-')), ext: () => X3, cfg: () => ({ ...CFGJ, off: TK_OFF(['ext.fx']), fx: { after: '00:00', at: AT, keyWaitMin: 0 } }), keysFor: () => KK,
        want: (c, id) => ({ have: true, v: { date: id, rates: { USD: 1343.3 }, src: 'koreaexim' } }), handed: (k) => !!o.mine && k === 'ext.fx', handedElse: (k) => !!o.other && k === 'ext.fx', opOut: () => true, beat: (k) => { beats.push(k); return true; } }); return { J4, calls3, beats }; };
    const H1 = mk({ mine: true }); KK = {}; for (let i = 0; i < 3; i++) await H1.J4.step(); ok(!H1.calls3.length, '넘겨받은 PC — 운영 키가 오기 전엔 시각이 돼도 받지 않음', H1.calls3);
    KK = { eximKey: 'k' }; for (let i = 0; i < 3; i++) await H1.J4.step(); ok(H1.calls3.length === 1 && H1.J4._S().fxSlot === kd + '_0' && H1.beats.includes('ext.fx'), '넘겨받은 PC — 첫 시각(00:00)에 한 번 받고 소식', { c: H1.calls3, s: H1.J4._S().fxSlot });
    for (let i = 0; i < 3; i++) await H1.J4.step(); ok(H1.calls3.length === 1, '같은 시각 칸 안에선 다시 안 받음', H1.calls3);
    AT = ['00:00', '00:01']; for (let i = 0; i < 3; i++) await H1.J4.step(); ok(H1.calls3.length === 2 && H1.J4._S().fxSlot === kd + '_1', '둘째 시각이 되면 한 번 더(하루 두 번)', { c: H1.calls3, s: H1.J4._S().fxSlot });
    AT = ['23:59']; const H0 = mk({ mine: true }); for (let i = 0; i < 3; i++) await H0.J4.step(); const km = (() => { const t = new Date(Date.now() + 9 * 3600e3); return t.getUTCHours() * 60 + t.getUTCMinutes(); })(); if (km < 23 * 60 + 59) ok(!H0.calls3.length, '정한 시각 전엔 받지 않음', H0.calls3);
    AT = ['00:00']; const H2 = mk({ other: true }); for (let i = 0; i < 3; i++) await H2.J4.step(); ok(!H2.calls3.length, '다른 PC(JS-MAIN)로 넘겼으면 이 PC 번외는 환율을 받지 않음(공용 값만 읽음)', H2.calls3);
    const H3 = mk({}); for (let i = 0; i < 3; i++) await H3.J4.step(); ok(H3.calls3.length === 1, '아무 데도 안 넘겼으면 예전 그림자(하루 한 번)', H3.calls3);
    const hs = fs.readFileSync(path.join(L.ROOT, 'helper', 'readnow-col2-helper.js'), 'utf8'); ok(/handedElse: \(k\) => hoElse\(k\)/.test(hs) && /const hoElse = \(k\) =>/.test(hs), '도우미가 다른 PC로 넘긴 일을 알려 줌(handedElse)'); }

  console.log('④ 시세 넘김 — 7일 안에 본 상품은 차례에 안 넣음');
  HAND = { nbMarket: true }; CFGJ = { ...CFGJ, off: TK_OFF(['nbMarket']) }; const n = J.feedNb([{ id: 'aladin_U1', v: { title: '가', usedCode: 'U1', at: new Date(Date.now() - 2 * 864e5).toISOString() } }, { id: 'aladin_U2', v: { title: '나', usedCode: 'U2', at: new Date(Date.now() - 9 * 864e5).toISOString() } }]);
  ok(n === 1 && J.qLen('nbMarket') === 1, '넘긴 뒤엔 7일 지난 상품만 다시 봄(운영 nbDays와 같음)', n);
  HAND = {}; const J3 = makeJobs({ ...ctx, home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2ho3c-')), handed: () => false }); ok(J3.feedNb([{ id: 'aladin_U3', v: { title: '다', usedCode: 'U3', at: new Date().toISOString() } }]) === 1, '넘기지 않았으면 예전처럼 모두 그림자 차례');

  console.log('⑤ 외부 정보 견주기 — 칸마다 · 때가 다름');
  const ago = new Date(Date.now() - 30 * 3600e3).toISOString(); const pv = (d) => ({ at: ago, chk: ago, sig: X0.sig({ none: false, d }, 'kakao'), d });
  let c = CMP.compareExt(X0, 'kakao', pv({ title: '가', priceSales: 9000, cover: 'a?t=1' }), { ok: true, d: { title: '가', priceSales: 8500, cover: 'a?t=2' } });
  ok(c.verdict === 'diff' && c.reasons[0] === 'move' && c.rows.length === 2 && c.rows.every((x) => x.k === 'move'), "값·표지만 다르고 운영이 30시간 전에 읽음 → '때가 다름'(까닭 있음) · 칸 2개", c);
  c = CMP.compareExt(X0, 'kakao', pv({ title: '가', publisher: '갑' }), { ok: true, d: { title: '가', publisher: '을' } }); ok(c.reasons[0] === 'diff' && c.rows[0].f === 'publisher' && c.rows[0].prod === '갑', "출판사처럼 바뀌지 않는 칸이 다르면 그대로 '까닭 모름' · 어느 칸인지 보임", c.rows);
  c = CMP.compareExt(X0, 'kakao', { ...pv({ priceSales: 1 }), chk: new Date().toISOString() }, { ok: true, d: { priceSales: 2 } }); ok(c.reasons[0] === 'diff', '운영이 방금 읽었는데 값이 다르면 까닭 모름(때 차이로 덮지 않음)');

  /* (11/12 col2rep6) 칸 줄이 빈 다름 — 구글 북스 201건(진단 11/12) */
  c = CMP.compareExt(X0, 'google', { at: ago, chk: ago, none: true, sig: X0.sig({ none: true, d: null }, 'google'), d: null }, { ok: true, d: { title: '가' } });
  ok(c.reasons[0] === 'fill' && c.rows[0].f === '(지문)' && /없음/.test(c.rows[0].prod), "운영은 '없음', 그림자는 찾음 → '운영 칸 빔(그림자만 값)'(까닭 있음) · 한 줄 남김", c);
  c = CMP.compareExt(X0, 'google', { at: ago, chk: ago, sig: 'zz:1' }, { ok: true, none: true, d: null });
  ok(c.reasons[0] === 'diff' && c.rows.length === 1 && /받아 둔 값 없음/.test(c.rows[0].prod) && /없음/.test(c.rows[0].shadow), "운영 칸에 값 원문이 없고 그림자는 '없음' → 다름 그대로 + 무엇이 없는지 한 줄", c);

  console.log('⑥ 수집기 본문');
  const SRC = fs.readFileSync(path.join(L.PROD_REPO, 'src/readnow-collector.src.js'), 'utf8'); const head = SRC.slice(0, SRC.indexOf('// ==/UserScript=='));
  ok(/async function c2HoLive\(k, maxH\)/.test(SRC) && /!\(hoNl && s === 'nl'\)/.test(SRC) && /c2HoLive\('ext\.fx', 30\); if \(ho\) return null;/.test(SRC) && /hoNb \? !have\.get\(k\)/.test(SRC), '넘긴 일만 쉼: 국중은 외부 정보 한 바퀴에서 뺌 · 환율은 쉼(지금 받기 force는 그대로) · 시세는 처음 보는 상품만');
  ok(!/c2Ho|col2_handoff/.test(head), '수집기 머리(@match·@grant·@connect·@require)는 안 바꿈');
  ok(Object.keys(HOF.JOBS).length === 8 + HOF.EXT_HO.length && HOF.JOBS.bench.mode === 'bench' && HOF.JOBS.bench.lg && HOF.JOBS.product.mode === 'pub' && !HOF.JOBS.product.lg && /* (11/12 handoff4) 📦 */ /* (11/12 handoff3) 🎯 끝까지 */ ['dynamic', 'shopSum'].every((k) => HOF.JOBS[k].mode === 'plan' && HOF.JOBS[k].lg) && /* (11/12 handoff2) 로거 칸 2 */ ['ext.nl', 'nbMarket', 'ext.fx', ...HOF.EXT_HO.map((x) => 'ext.' + x[0])].every((k) => HOF.JOBS[k].mode && HOF.JOBS[k].ops && HOF.JOBS[k].beatMaxH), '넘김 표: KPIPA + 국중·시세·환율(쓰기 꼴·운영 쪽 쉬는 곳·소식 시간)');
  L.done('t_ho3');
})();
