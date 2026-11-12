/* t_pre — (11/11 col2rep5 · 약속 38·48 '번외로 모두 바꾸기') 🔎 운영 값 먼저 보기 · 하루 멈춤 · 외부 정보 넘김 넓힘 — 번외 일 돌리기(col2-jobs) 쪽
 *  ① 넘기지 않은 외부 정보 그림자: 운영 문서(ext_<묶음>/<ISBN>)를 먼저 받아 그 출처 칸이 없으면 바깥에 묻지 않음('pre' · 표본·차례 셈 밖) · 있으면 물음 · ISBN 없는 상품은 묻지 않음
 *     운영 문서를 기다리는 동안 다른 일(다른 출처)이 차례를 받음 · 못 받으면 preWaitMin분 뒤 예전처럼 물음 · jobs.preCheck:false면 예전처럼
 *  ② 운영 칸에 실패(err)만 있는 책 → '까닭 모를 다름'이 아니라 '운영 값 없음'
 *  ③ 📚 도서관 정보나루 'IP 등록이 필요' → 그날은 이 PC에서 더 묻지 않음 · 키 없음·틀림 → 30분 쉼
 *  ④ 🔎 eBay를 이 PC로 넘기면: 다시 볼 날(운영 공용 파일 기본 14일)이 지난 책만 묻고 · 결과를 운영 extSave 꼴로 ext_foreign에 맡김(150KB 넘으면 운영처럼 줄임) · 다시 볼 날 전이어도 소식(beat)
 *  ⑤ 넘김 표 = 웹앱 표(외부 정보 14곳 · TTB·도서관 정보나루 뺌) · 수집기 본문은 넘긴 출처의 ISBN 있는 책만 건너뜀 · 머리 안 바꿈
 * 실행: node tests/t_pre.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makeJobs } = require('../helper/col2-jobs.js'); const COL2 = require('../col2-config.js'); const CMP = require('../shadow/col2-compare-core.js'); const HOF = require('../shadow/col2-handoff.js');
const X0 = require(path.join(L.PROD_REPO, 'readnow-ext-core.js'));
(async () => {
  const DB = {}; const ops = [], outs = [], notes = []; let HAND = {}; const calls = []; const beats = []; let ANS = {};
  const X = { ...X0, run: async (src, o) => { calls.push([src, o.isbn]); if (ANS[src]) return ANS[src](o); return { ok: true, d: { title: '책 ' + o.isbn } }; } };
  const pass = () => ({ ok: true, waitMs: 0 }); const pace = { check: pass, take: async () => ({ ok: true }), ok() {}, fail() {} }; const site = { check: pass, take: async () => ({ ok: true }), ok() {}, fail() {} };
  const TK_OFF = (keep) => require('../shadow/col2-tasks.js').TASKS.map((t) => t.k).filter((k) => !keep.includes(k));
  let CFGJ = { on: true, off: TK_OFF(['ext.kakao']), pass: { minN: 1, waitMin: 5 } }; let T = Date.now(); const RN = Date.now;
  const ctx = { home: fs.mkdtempSync(path.join(os.tmpdir(), 'c2pre-')), cfg: () => CFGJ, kind: () => 'office', pc: () => 'HOME', PASS: COL2.PASS, BUSY: { restMs: 1000 }, busy: () => null, VERSION: 'T',
    out: (c, id, v) => outs.push({ c, id, v }), note: (m) => notes.push(m), pace, site, ext: () => X, keysFor: () => ({}), http: async () => ({ status: 200, text: '' }), redact: (v) => v,
    want: (c, id) => { const k = c + '/' + id; return k in DB ? { have: true, v: DB[k] } : null; }, handed: (k) => !!HAND[k], opOut: (job, c, id, v) => { ops.push({ job, c, id, v }); return true; }, beat: (k) => { beats.push(k); return true; } };
  L.track(ctx.home);
  const J = makeJobs(ctx); const run = async (n) => { const R = []; for (let i = 0; i < n; i++) R.push(await J.step()); return R; };
  const day = () => (J.summary() || {}); const fresh = new Date(Date.now() - 3 * 864e5).toISOString(), old = new Date(Date.now() - 20 * 864e5).toISOString();
  const bk = (n, isbn, title) => ({ itemId: String(n), bookId: 'b' + n, prod: { isbn13: isbn, title: title || '책' + n } });

  console.log('① 운영 값 먼저 보기');
  const A1 = '9788937460401', A2 = '9788937460418', A3 = '9788937460425';
  DB['ext_basic/' + A1] = { isbn: A1, src: { nl: { at: fresh, sig: 'n' } } }; /* 운영 문서는 있지만 카카오 칸이 없음 */
  DB['ext_basic/' + A2] = { isbn: A2, src: { kakao: { at: fresh, chk: fresh, sig: X0.sig({ none: false, d: { title: '책 ' + A2 } }, 'kakao'), d: { title: '책 ' + A2 } } } };
  J.feedBooks([bk(1, A1), bk(2, A2), bk(3, A3), { itemId: '9', bookId: 'b9', prod: { title: 'ISBN 없는 세트' } }]);
  let r = await run(3); const k1 = day()['ext.kakao'] || {};
  ok(calls.length === 1 && calls[0][1] === A2 && k1.n === 1 && k1.same === 1, '운영이 카카오로 읽어 둔 책만 바깥에 물음(1번) · 같음', { calls, k1 });
  ok(k1.pre === 1 && (k1.preWhy || {})['운영이 아직 이 출처로 읽지 않은 책'] === 1 && !k1.noprod, "운영 칸이 없는 책은 묻지 않음 → 'pre'로 따로 셈(운영 값 없음·표본에 안 듦)", k1);
  ok(J.tried('ext.kakao') === 1, '차례 셈(tried)엔 바깥에 물은 것만 듦 — 묻지 않은 책 때문에 그 일이 뒤로 밀리지 않음', J.tried('ext.kakao'));
  ok(r.some((x) => !x.did && /운영 문서 먼저/.test(x.why || '')), '운영 문서가 아직 안 온 책(A3)은 기다림 — 바깥 요청 없음', r);
  /* 다른 출처는 그동안 차례를 받음 */
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.kakao', 'ext.kyobo']) }; DB['ext_basic/9788937460432'] = { isbn: '9788937460432', src: { kyobo: { at: fresh, sig: 'k', d: { title: '교' } } } };
  J.feedBooks([bk(4, '9788937460432')]); calls.length = 0; await run(2);
  ok(calls.some((c) => c[0] === 'kyobo') && !calls.some((c) => c[0] === 'kakao'), '카카오가 운영 문서를 기다리는 동안 교보가 차례를 받음(굶지 않음)', calls);
  /* 10분 넘게 못 받으면 예전처럼 물음 */
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.kakao']), preWaitMin: 0 }; calls.length = 0; await run(2);
  ok(calls.some((c) => c[0] === 'kakao' && c[1] === A3), '웹앱이 preWaitMin분 안에 운영 문서를 못 넘기면 예전처럼 물음', calls);
  ok(!calls.some((c) => !c[1]), 'ISBN 없는 상품은 묻지 않음(운영 문서 이름 모름 · 견줄 수 없음)', calls);
  CFGJ = { ...CFGJ, preCheck: false, preWaitMin: 10 }; calls.length = 0; J.feedBooks([bk(5, '9788937460449')]); await run(1);
  ok(calls.length === 1 && calls[0][1] === '9788937460449', 'jobs.preCheck:false면 예전처럼 곧바로 물음', calls); CFGJ = { ...CFGJ, preCheck: true };

  console.log('② 운영 칸에 실패만 있는 책');
  let c = CMP.compareExt(X0, 'kakao', { err: { at: fresh, why: '저장 실패: unavailable' } }, { ok: true, d: { title: '가' } });
  ok(c.verdict === 'noprod', "운영 칸에 err만 있으면 '운영 값 없음'(예전엔 지문이 없어 '까닭 모를 다름')", c);
  c = CMP.compareExt(X0, 'kakao', { at: fresh, sig: X0.sig({ none: false, d: { title: '가' } }, 'kakao'), d: { title: '가' }, err: { at: fresh } }, { ok: true, d: { title: '가' } });
  ok(c.verdict === 'same', '받아 둔 값이 있고 실패가 덧붙은 칸은 그대로 견줌(같음)', c);

  console.log('③ 하루 멈춤 · 키 쉼');
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.lib']) }; ANS.lib = () => ({ ok: false, why: '일 500건 이상 요청 시 IP 등록이 필요합니다. 등록 된 IP를 확인하세요' });
  const L1 = '9788937460456', L2 = '9788937460463'; for (const b of [L1, L2]) DB['ext_lib/' + b] = { isbn: b, src: { lib: { at: old, sig: 'l', d: { n: 1 } } } };
  J.feedBooks([bk(6, L1), bk(7, L2)]); calls.length = 0; await run(4); const lb = day()['ext.lib'] || {};
  ok(calls.filter((x) => x[0] === 'lib').length === 1 && lb.fail === 1 && lb.skip >= 1, "'IP 등록이 필요' 답 한 번 → 그날은 이 PC에서 더 묻지 않음(못 읽음 1 · 나머지는 건너뜀)", { calls, lb });
  ok(notes.some((m) => /IP 등록이 필요/.test(m)), '기록창에 까닭과 할 일 한 줄', notes.slice(-3));
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.google']) }; ANS.google = () => ({ ok: false, why: '키 없음 — googleBooks' });
  const G1 = '9788937460470', G2 = '9788937460487'; for (const b of [G1, G2]) DB['ext_basic/' + b] = { isbn: b, src: { google: { at: old, sig: 'g', d: { t: 1 } } } };
  J.feedBooks([bk(8, G1), bk(10, G2)]); calls.length = 0; r = await run(3);
  ok(calls.filter((x) => x[0] === 'google').length === 1, '키 없음·틀림 → 그 출처 30분 쉼(그동안 묻지 않음)', { calls, r });

  console.log('④ eBay 넘김');
  CFGJ = { ...CFGJ, off: TK_OFF(['ext.ebay']) }; HAND = { 'ext.ebay': true }; ops.length = 0; beats.length = 0; calls.length = 0;
  const E1 = '9780060281373', E2 = '9780060523206'; DB['ext_foreign/' + E1] = { isbn: E1, src: { ebay: { at: fresh, chk: fresh, sig: 'e', d: { n: 1 } } } }; DB['ext_foreign/' + E2] = { isbn: E2, src: { ebay: { at: old, chk: old, sig: 'e2', d: { n: 2 } } } };
  const big = Array.from({ length: 400 }, (_, i) => ({ t: '아주 긴 글 '.repeat(40) + i, p: 1000 + i }));
  ANS.ebay = (o) => ({ ok: true, d: { n: 400, items: big.slice() } });
  J.feedBooks([bk(11, E1), bk(12, E2)]); await run(4); const eb = day()['ext.ebay'] || {};
  ok(calls.length === 1 && calls[0][1] === E2 && eb.skip === 1, '다시 볼 날(14일 · 운영 공용 파일 기본) 전인 책은 묻지 않음 · 지난 책만', { calls, eb });
  const o1 = ops.find((x) => x.job === 'ext.ebay'); const HD = { jobs: { 'ext.ebay': { on: true, pc: 'HOME', hands: false, at: new Date().toISOString() } } };
  ok(o1 && o1.c === 'ext_foreign' && o1.id === E2 && o1.v.obj.d.trunc === true && Buffer.byteLength(JSON.stringify(o1.v.obj.d)) <= 150000 && o1.v.obj.sig === X0.sig({ none: false, d: o1.v.obj.d }, 'ebay') && HOF.writeOk(HD, { ...o1, job: 'ext.ebay' }, 'HOME').ok,
    '결과를 운영 extSave 꼴로 ext_foreign에 맡김 · 150KB 넘는 글 목록은 운영처럼 반씩 줄임 · 지문도 줄인 값으로', o1 && { c: o1.c, id: o1.id, trunc: o1.v.obj.d.trunc, len: Buffer.byteLength(JSON.stringify(o1.v.obj.d)) });
  ok(beats.filter((k) => k === 'ext.ebay').length >= 2, '다시 볼 날 전이라 건너뛴 때도 소식(beat) — 운영이 8시간 뒤 넘김을 풀지 않게', beats);
  ok(!HOF.writeOk(HD, { ...o1, job: 'ext.ebay', c: 'ext_basic' }, 'HOME').ok && !HOF.writeOk(HD, { ...o1, job: 'ext.ridi', c: 'ext_ebook' }, 'HOME').ok, '넘긴 일·정한 칸만 씀(다른 칸·넘기지 않은 출처는 거절)');

  console.log('⑤ 넘김 표 · 수집기 본문');
  const H = fs.readFileSync(path.join(L.PROD_REPO, 'src/app.html'), 'utf8'); const i0 = H.indexOf('const C2HO_JOBS = '); const i1 = H.indexOf("\n", H.indexOf("C2HO_JOBS.bench = ", i0)); /* (11/12 handoff2) 로거 칸 일 두 줄 · (11/12 handoff3) 🎯 끝까지 한 줄까지 */
  const W = new Function(H.slice(i0, i1) + '\nreturn C2HO_JOBS;')();
  ok(Object.keys(W).length === Object.keys(HOF.JOBS).length && Object.entries(W).every(([k, j]) => HOF.JOBS[k] && HOF.JOBS[k].col === j.col && HOF.JOBS[k].idRe === j.idRe && (HOF.JOBS[k].src || null) === (j.src || null) && HOF.JOBS[k].beatMaxH === j.beatMaxH && (HOF.JOBS[k].mode || null) === (j.mode || null) && !!HOF.JOBS[k].lg === !!j.lg && JSON.stringify(HOF.JOBS[k].fields) === JSON.stringify(j.fields)), '웹앱 넘김 표 = 번외 넘김 표(외부 정보 15곳 · 로거 칸 3 더함)', Object.keys(W));
  { const i2 = H.indexOf('const C2HO_PCPLAN = '); const WP = new Function(H.slice(i2, H.indexOf('};', i2) + 2) + '\nreturn C2HO_PCPLAN;')(); ok(JSON.stringify(WP) === JSON.stringify(HOF.PC_PLAN), '맡길 PC 차림표: 웹앱 = 번외 표', WP);
    const T2 = (pc, d, can, n) => ({ d, pc, ver: '0.1.28', at: new Date().toISOString(), tasks: { nbMarket: { name: '시세', n, same: 0, un: 0, pass: { can } } } });
    const cd = HOF.candidates([T2('HOME', '2026-11-11', true, 46), T2('JS-MAIN', '2026-11-11', true, 33)]).find((x) => x.k === 'nbMarket'); const cd2 = HOF.candidates([T2('HOME', '2026-11-11', true, 46), T2('JS-MAIN', '2026-11-11', false, 33)]).find((x) => x.k === 'nbMarket');
    ok(cd.pc === 'JS-MAIN' && cd2.pc === 'HOME', "시세는 JS-MAIN이 '넘길 수 있음'을 냈으면 JS-MAIN(표본이 적어도) · 못 냈으면 표본 많은 PC", { cd, cd2 });
    /* (11/12 col2rep6) 옛 판·소식 없는 PC는 안 맡김 */
    const T3 = (pc, ver, h) => ({ d: '2026-11-12', pc, ver, at: new Date(Date.now() - h * 3600e3).toISOString(), tasks: { 'ext.ebay': { name: 'eBay', n: 40, same: 40, un: 0, pass: { can: true } } } });
    const e1 = HOF.candidates([T3('HOME', '0.1.25', 0.2), T3('JS-MAIN', '0.1.28', 0.5)]).find((x) => x.k === 'ext.ebay'); const e2 = HOF.candidates([T3('HOME', '0.1.25', 0.2), T3('JS-MAIN', '0.1.28', 5)]).find((x) => x.k === 'ext.ebay');
    ok(e1.pc === 'JS-MAIN' && e2.pc === null && /0\.1\.26 이상 필요/.test(e2.no) && /5시간째 소식 없음/.test(e2.no), '외부 정보는 0.1.26 이상·3시간 안 소식 있는 PC만 · 없으면 맡을 PC 없음 + 까닭', { e1, e2 }); }
  ok(!HOF.JOBS['ext.ttb'] && HOF.JOBS['ext.lib'] && HOF.JOBS['ext.lib'].col === 'ext_lib' && HOF.EXT_HO.every(([s, , col]) => X0.GROUPS[X0.SOURCES[s].grp].col === col), 'TTB(서비스 끝)는 뺌 · (11/12 handoff2) 도서관 정보나루는 넣음(넘길 수 있음이 난 PC만) · 칸은 운영 공용 파일 묶음과 같음');
  const SRC = fs.readFileSync(path.join(L.PROD_REPO, 'src/readnow-collector.src.js'), 'utf8'); const head = SRC.slice(0, SRC.indexOf('// ==/UserScript=='));
  ok(/const hoSkip = \(src, x\) => !!hoX\[src\] && \/\^97\[89\]\\d\{10\}\$\/\.test/.test(SRC) && (SRC.match(/&& !hoSkip\(src, x\)/g) || []).length === 2 && /c2HoLive\('ext\.' \+ s, 8\)/.test(SRC), '수집기 본문: 넘긴 출처는 ISBN 있는 책만 건너뜀(두 고르는 곳 모두) · 8시간 소식 없으면 운영이 다시');
  ok(!/hoSkip|hoX/.test(head), '수집기 머리(@match·@grant·@connect·@require)는 안 바꿈');
  L.done('t_pre');
})();
