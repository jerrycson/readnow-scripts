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
  HAND = {}; ops.length = 0; J.feedBooks([{ itemId: '3', bookId: 'b3', prod: { isbn13: '9788937460463', title: '다' } }]); calls.length = 0; await run(4);
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
    const src = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-jobs.js'), 'utf8'); ok(/function hoFx\(w, v\) \{ if \(!handed\('ext\.fx'\) \|\| v\) return;/.test(src) && /res\.src !== 'koreaexim'\) return/.test(src), "환율 맡김: 운영 ext_fx 문서가 없을 때만 · 수출입은행(koreaexim)일 때만", S ? 'ok' : ''); }
  if (ran1) { const fxo = ops.filter((o) => o.job === 'ext.fx'); ok(fxo.length === 1 && fxo[0].v.src === 'koreaexim' && fxo[0].id === '2026-11-11', '넘긴 환율: 수출입은행 고시를 운영 칸(ext_fx)에 맡김', fxo); }

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

  console.log('⑥ 수집기 본문');
  const SRC = fs.readFileSync(path.join(L.PROD_REPO, 'src/readnow-collector.src.js'), 'utf8'); const head = SRC.slice(0, SRC.indexOf('// ==/UserScript=='));
  ok(/async function c2HoLive\(k, maxH\)/.test(SRC) && /!\(hoNl && s === 'nl'\)/.test(SRC) && /c2HoLive\('ext\.fx', 30\); if \(ho\) return null;/.test(SRC) && /hoNb \? !have\.get\(k\)/.test(SRC), '넘긴 일만 쉼: 국중은 외부 정보 한 바퀴에서 뺌 · 환율은 쉼(지금 받기 force는 그대로) · 시세는 처음 보는 상품만');
  ok(!/c2Ho|col2_handoff/.test(head), '수집기 머리(@match·@grant·@connect·@require)는 안 바꿈');
  ok(Object.keys(HOF.JOBS).length === 4 && ['ext.nl', 'nbMarket', 'ext.fx'].every((k) => HOF.JOBS[k].mode && HOF.JOBS[k].ops && HOF.JOBS[k].beatMaxH), '넘김 표: KPIPA + 국중·시세·환율(쓰기 꼴·운영 쪽 쉬는 곳·소식 시간)');
  L.done('t_ho3');
})();
