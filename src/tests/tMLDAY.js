// tMLDAY — 11/09 엔진 점검: '하루 모습'(ml_days)이 10/23 뒤 17일째 안 쌓임
//  원인: 매일 일(dailyJobs)의 💳 비용 기록(costDaily)이 7일마다 부르던 inventory()(사진 저장소 전부 나열 + 칸마다 25문서)가 끝나지 않아
//        dailyBusy가 풀리지 않음 → 그 뒤의 결과 기록(mlDaily)·스스로 배우기·출판 게시판·보관 정리가 모두 멈춤(오류가 아니라 lastErr도 없음)
//  ① 비용 기록이 끝나지 않아도 결과 기록이 돌고(순서·시간 한도·겹침 막기) 매일 일이 끝남
//  ② 빠진 날을 남은 기록으로 다시 만듦(있는 날은 덮지 않음 · rebuilt 표시 · 그때 값·판매중 여부·시장 칸 값)
//  ③ 멈춤 감시(공용 stallCheck · 클라우드 진단 health.mlStall · 웹앱 홈 빨강)
// 시험 자료 손님 정보 없음(상품 번호·책 번호만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
const SRC = fs.readFileSync(find(['../cloud/index.js', '../../cloud/index.js', '../../src/cloud/index.js']), 'utf8');
const ML = require(find(['../readnow-ml-core.js', '../../readnow-ml-core.js']));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 가짜 Firestore (이 시험에 필요한 만큼) ── */
function fakeDb() { const S = {}; const col = (n) => (S[n] = S[n] || new Map());
  const AU = (v) => ({ __au: v }); const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) { if (v && v.__au) o[k] = [...new Set([...(o[k] || []), ...v.__au])]; else o[k] = v; } return o; };
  const snap = (n, id) => { const v = col(n).get(id); return { id, exists: v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))), get: (k) => (v || {})[k], ref: ref(n, id) }; };
  const ref = (n, id) => ({ _n: n, id, get: async () => snap(n, id), set: async (v, o) => { col(n).set(id, o && o.merge ? merge(col(n).get(id), v) : merge({}, v)); } });
  const query = (n, F) => { const q = { where: (k, op, v) => query(n, { ...F, w: [...(F.w || []), [k, op, v]] }), orderBy: (k) => query(n, { ...F, ob: k }), select: () => query(n, F), limit: (k) => query(n, { ...F, lim: k }), startAfter: (d) => query(n, { ...F, sa: d.id }),
    get: async () => { let L = [...col(n).keys()].map((id) => snap(n, id)); const g = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
      for (const [k, op, v] of F.w || []) L = L.filter((d) => { const x = g(d.data(), k); return op === '>=' ? x >= v : op === '<=' ? x <= v : op === '>' ? x > v : op === '<' ? x < v : op === '==' ? x === v : true; });
      if (F.ob) L.sort((a, b) => String(g(a.data(), F.ob)).localeCompare(String(g(b.data(), F.ob))) || a.id.localeCompare(b.id)); if (F.sa) { const i = L.findIndex((d) => d.id === F.sa); L = L.slice(i + 1); } if (F.lim) L = L.slice(0, F.lim);
      return { empty: !L.length, size: L.length, docs: L, forEach: (fn) => L.forEach(fn) }; } }; return q; };
  const C = (n) => Object.assign(query(n, {}), { doc: (id) => ref(n, id) });
  const db = { S, col, collection: C, getAll: async (...rs) => rs.map((r) => snap(r._n, r.id)), batch: () => { const ops = []; return { set: (r, v, o) => ops.push([r, v, o]), commit: async () => { for (const [r, v, o] of ops) await r.set(v, o); } }; } };
  return { db, C, FV: { arrayUnion: (...v) => AU(v), serverTimestamp: () => 'TS' } }; }

(async () => {
  /* ① 매일 일: 비용 기록이 영영 안 끝나도 결과 기록이 돌고 매일 일이 끝남 */
  { const a = SRC.indexOf('let mlBusy = false'), b = SRC.indexOf('} finally { dailyBusy = false; } return out; }', a); ok(a > 0 && b > a, '클라우드: djTO·djRun·dailyJobs가 있음');
    let body = SRC.slice(a, b + '} finally { dailyBusy = false; } return out; }'.length).replace(/3 \* 60e3, '비용 기록'/, "300, '비용 기록'").replace(/10 \* 60e3, '결과 기록'/, "800, '결과 기록'").replace(/6 \* 60e3, '빠진 하루 모습 메우기'/, "800, '빠진 하루 모습 메우기'");
    const calls = []; const { db, C, FV } = fakeDb(); const never = () => new Promise(() => {});
    const deps = { cjobs: async () => ({ all: true, ml: true, costs: true, learn: true, kpb: false, px: false, retain: false }), settingsOnce1101: async () => null, pxDailyTick: async () => null, pxSumTick: async () => null,
      mlDaily: async () => { calls.push('ml'); await C('app_settings').doc('ml_state').set({ lastDay: '2026-11-09', at: new Date().toISOString(), days: FV.arrayUnion('2026-11-09') }, { merge: true }); return { snap: { n: 3 } }; },
      mlRebuild: async () => { calls.push('reb'); return { made: [{ day: '2026-10-24', n: 2 }], left: 0 }; }, costDaily: () => { calls.push('cost'); return never(); }, /* 10/23처럼 끝나지 않는 비용 기록 */
      extCloud: async () => ({ skip: 'x' }), retainSweep: async () => ({ n: 0 }), kpbTick: async () => ({}), kpbOcrTick: async () => ({}), devOpsTick: async () => { calls.push('devops'); return null; }, mlLearn: async () => { calls.push('learn'); return { skip: 'x' }; }, ghActDaily: async () => { calls.push('gh'); return { skip: 'x' }; }, log: () => {}, C, nowIso: () => new Date().toISOString(), VER: 'test' };
    const names = Object.keys(deps); const pre = 'let dailyBusy = false, lastDailyAt = 0, pxSumNextAt = 0, costNextAt = 0, mlNextAt = 0, extNextAt = 0, retainNextAt = 0, kpbNextAt = 0, kpbOcrNextAt = 0, learnNextAt = 0, ghNextAt = 0;\n'; /* (11/10 fence3) 합친 뒤 dailyJobs가 바깥 ghNextAt(💳 GitHub 실행 분)을 씀 — 시험 틀에 줌 */
    const M = new Function(...names, pre + body + '\nreturn { dailyJobs, djTO, djRun, st: () => ({ mlBusy, costBusy, dailyBusy }) };')(...names.map((k) => deps[k]));
    const t0 = Date.now(); const out = await M.dailyJobs(); const ms = Date.now() - t0;
    ok(calls.indexOf('ml') === 0 && calls.indexOf('reb') === 1 && calls.indexOf('cost') === 2, `결과 기록 → 빠진 날 메우기 → 비용 기록 순서 (${calls.join('→')})`);
    ok(out.ml && out.ml.snap && out.mlReb && /비용 기록 0초 넘김|비용 기록 \d+초 넘김/.test(out.costsErr || ''), `비용 기록이 안 끝나도 시간 한도로 넘어감(${out.costsErr || '-'}) · 결과 기록은 됨`);
    ok(calls.includes('devops') && calls.includes('learn') && ms < 5000, `그 뒤 일(기기 운영·스스로 배우기)도 돔 · 매일 일이 끝남(${ms}ms)`);
    ok(M.st().dailyBusy === false && M.st().costBusy === true, '매일 일 바쁨은 풀림 · 끝나지 않은 비용 기록만 바쁨으로 남아 겹쳐 돌지 않음');
    const c0 = calls.length; const out2 = await M.dailyJobs(); const sk = await M.djRun('cost'); ok(calls.slice(c0).filter((x) => x === 'cost').length === 0 && !out2.costsErr && sk && sk.skip, `다음 회차: 비용 기록은 30분 뒤 다시 보고 · 앞 것이 아직 돌면 새로 부르지 않음(${sk && sk.skip})`);
    const st = (await C('app_settings').doc('ml_state').get()).data(); ok(st.lastDay === '2026-11-09', 'ml_state.lastDay가 오늘로 — 하루 모습 기록이 다시 쌓임');
    ok(!/await inventory\(\)/.test(SRC.slice(SRC.indexOf('async function costDaily'), SRC.indexOf('let costNextAt'))) && /fsSizeEst\(90e3\)/.test(SRC) && /fsTryAt/.test(SRC), '비용 기록은 inventory()(사진 저장소 전부 나열)를 부르지 않음 · Firestore 크기 어림은 90초 안·하루 한 번 시도'); }

  /* ② fsSizeEst: 시간 한도 안에서만 */
  { const a = SRC.indexOf('async function fsSizeEst('), b = SRC.indexOf('async function inventory()'); const cs = SRC.slice(SRC.indexOf('async function colStat('), SRC.indexOf('const stGroupOf'));
    const mk = (n, slow) => ({ id: n, count: () => ({ get: async () => { await sleep(slow); return { data: () => ({ count: 10 }) }; } }), limit: () => ({ get: async () => ({ size: 1, docs: [{ data: () => ({ a: 1 }), ref: { path: n + '/x' } }] }) }) });
    const db = { listCollections: async () => [mk('a', 5), mk('b', 5), mk('c', 400), mk('d', 5)], collectionGroup: (g) => mk(g, 1) };
    const F = new Function('db', 'SUB_GROUPS', cs + SRC.slice(a, b) + '\nreturn fsSizeEst;')(db, ['log']);
    const r1 = await F(5000); const r2 = await F(100); ok(r1.done && r1.bytes > 0 && r1.n === 4, `다 셈(${r1.n}칸 · ${r1.bytes}바이트)`); ok(!r2.done && r2.n < 4, `시간 한도를 넘으면 멈추고 done:false(${r2.n}/${r2.of}칸) — 지난 값을 씀`); }

  /* ③ 빠진 날 메우기 (공용 listingAsOf·asOfMetrics + 클라우드 mlRebuild) */
  { const kd = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); const ago = (d) => kd(Date.now() - d * 864e5); const iso = (day, hh) => new Date(Date.parse(`${day}T${hh}:00+09:00`)).toISOString();
    const D0 = ago(6), D1 = ago(5), D2 = ago(4), D3 = ago(3), D4 = ago(2), D5 = ago(1); /* D0 기록 있음 · D1 빠짐 · D2 있음(머리 문서는 있는데 날짜 목록에서만 빠짐) · D3·D4·D5 빠짐 */
    // 순수 함수
    const cut = Date.parse(D3 + 'T01:00:00+09:00');
    const l0 = { id: 'aladin_1', usedCode: '1', bookId: 'B1', price: 9000, grade: '상', registeredAt: D0, active: true, status: '판매중' };
    const A = [{ at: Date.parse(D1 + 'T10:00:00+09:00'), from: 10000, to: 9500 }, { at: Date.parse(D4 + 'T10:00:00+09:00'), from: 9500, to: 9000 }];
    ok(ML.listingAsOf(l0, A, null, cut).price === 9500, '그때 값 = 그 앞 마지막 가격 변경의 to(9,500 · 지금 값 9,000이 아님)');
    ok(ML.listingAsOf(l0, [A[1]], null, cut).price === 9500, '그 앞 변경이 없으면 그 뒤 첫 변경의 from');
    ok(ML.listingAsOf({ ...l0, active: false, status: '판매완료' }, [], Date.parse(D4 + 'T12:00:00+09:00'), cut) && !ML.listingAsOf({ ...l0, active: false, status: '판매완료' }, [], Date.parse(D2 + 'T12:00:00+09:00'), cut), '그 뒤에 팔린 상품은 그날 판매중 · 그 앞에 팔린 것은 아님');
    ok(!ML.listingAsOf({ ...l0, registeredAt: D4 }, [], null, cut), '그날 뒤에 등록한 상품은 뺌');
    const pgOld = [{ sellerCode: '1', usedCode: 'x1', price: 8000, grade: '상' }], pgNew = [{ sellerCode: '1', usedCode: 'x1', price: 7000, grade: '상' }];
    const EV = [{ at: Date.parse(D1 + 'T05:00:00+09:00'), changes: { salesPoint: { from: 100, to: 120 } } }, { at: Date.parse(D2 + 'T05:00:00+09:00'), kind: 'usedListings', page: pgOld, usedTotal: 5 }, { at: Date.parse(D4 + 'T05:00:00+09:00'), changes: { salesPoint: { from: 120, to: 150 }, priceList: { from: 15000, to: 16000 } } }, { at: Date.parse(D4 + 'T06:00:00+09:00'), kind: 'usedListings', page: pgNew, usedTotal: 4 }];
    const cur = { salesPoint: 150, priceList: 16000, usedTotal: 4, usedFirstPage: pgNew, lastCheckedAt: iso(D5, '09:00') }; const m = ML.asOfMetrics(cur, EV, cut);
    ok(m.salesPoint === 120 && m.priceList === 15000 && m.usedTotal === 5 && m.usedFirstPage === pgOld && m.lastCheckedAt === undefined, `그때 시장: SP 120·정가 15,000(뒤 바뀜의 from)·전체 중고 5·첫 페이지는 그 앞 기록 · 읽은 때는 모름`);
    const m2 = ML.asOfMetrics(cur, EV.slice(3), cut); ok(Array.isArray(m2.usedFirstPage) && !m2.usedFirstPage.length, '그 앞 첫 페이지 기록이 없고 뒤에만 있으면 모름(빈 페이지 → 자리 모름)');
    const m3 = ML.asOfMetrics(cur, [], cut); ok(m3.usedFirstPage === pgNew && m3.salesPoint === 150, '그사이 바뀜 기록이 없으면 지금 값 그대로');
    // 클라우드 mlRebuild — 가짜 Firestore
    const a = SRC.indexOf('/* MLREB-START'), b = SRC.indexOf('/* MLREB-END */'); ok(a > 0 && b > a, '클라우드: mlRebuild 칸이 있음');
    const w0 = SRC.indexOf('async function mlWriteDay('); const w1 = SRC.indexOf('\n', SRC.indexOf('await b.commit(); return { n: rows.length, shards: parts.length }; }', w0)); const writer = SRC.slice(w0, w1);
    const { db, C, FV } = fakeDb();
    await C('app_settings').doc('ml_state').set({ lastDay: D0, at: iso(D0, '01:00'), days: [D0] });
    await C('ml_days').doc(D0).set({ day: D0, shards: 1, n: 1, mark: '원래' }); await C('ml_days').doc(D2).set({ day: D2, shards: 1, n: 1, mark: '원래' });
    await C('prd_listings').doc('aladin_1').set({ usedCode: '1', bookId: 'B1', price: 9000, grade: '상', registeredAt: D0, active: true, status: '판매중' });
    await C('prd_listings').doc('aladin_2').set({ usedCode: '2', bookId: 'B1', price: 12000, grade: '최상', registeredAt: D0, active: false, status: '판매완료' }); // D4에 팔림
    await C('prd_listings').doc('aladin_3').set({ usedCode: '3', bookId: 'B2', price: 5000, grade: '중', registeredAt: D4, active: true, status: '판매중' }); // D4에 등록
    await C('prd_book_metrics').doc('B1').set(cur); await C('prd_book_metrics').doc('B2').set({ salesPoint: 10, usedFirstPage: [] });
    await C('prd_price_actions').doc('p1').set({ key: 'aladin_1', at: iso(D1, '10:00'), from: 10000, to: 9500 }); await C('prd_price_actions').doc('p2').set({ key: 'aladin_1', at: iso(D4, '10:00'), from: 9500, to: 9000 });
    EV.forEach((e, i) => C('prd_metric_changes').doc('c' + i).set({ bookId: 'B1', at: new Date(e.at).toISOString(), kind: e.kind || undefined, changes: e.changes || undefined, page: e.page || undefined, usedTotal: e.usedTotal }));
    const mlSales = async () => new Map([['2', [{ at: Date.parse(D4 + 'T15:00:00+09:00'), ono: 'o1' }]]]);
    const deps = { db, C, FV, ML_VER: 1, shard: (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }, W: () => ({ writer: 'cloud' }), nowIso: () => new Date().toISOString(), kday: kd, mlMod: async () => ML, mlSales };
    const names = Object.keys(deps); const F = new Function(...names, writer + '\n' + SRC.slice(a, b) + '\nreturn mlRebuild;')(...names.map((k) => deps[k]));
    const r = await F(60e3); const st = (await C('app_settings').doc('ml_state').get()).data();
    ok(r.made.map((x) => x.day).join(',') === [D1, D3, D4, D5].join(','), `빠진 날 ${r.made.map((x) => x.day).join(',')} 를 다시 만듦(D2는 머리 문서가 있어 덮지 않음)`);
    ok((await C('ml_days').doc(D0).get()).data().mark === '원래' && (await C('ml_days').doc(D2).get()).data().mark === '원래', '이미 있는 날(D0·D2)은 그대로 — 덮지 않음');
    const h3 = (await C('ml_days').doc(D3).get()).data(), s3 = (await C('ml_days').doc(D3 + '_00').get()).data(); const col = (k, key) => s3.cols[k][s3.cols.key.indexOf(key)];
    ok(h3.rebuilt === true && /되살림/.test(h3.how) && s3.rebuilt === true, '되살린 날 머리·조각에 rebuilt 표시와 만든 방법(how)');
    ok(s3.cols.key.length === 2 && s3.cols.key.includes('aladin_1') && s3.cols.key.includes('aladin_2') && !s3.cols.key.includes('aladin_3'), 'D3 판매중 = 1번(지금 판매중)·2번(D4에 팔림) · 3번(D4 등록)은 뺌');
    ok(col('price', 'aladin_1') === 9500 && col('sp', 'aladin_1') === 120 && col('used', 'aladin_1') === 5 && col('rank', 'aladin_1') === 2 && col('p1', 'aladin_1') === 1 && col('mkt', 'aladin_1') === null, `D3 1번 줄: 값 9,500 · SP 120 · 전체 중고 5 · 자리 2위(그때 첫 페이지 8,000원 다음 · 지금 페이지 7,000원이 아님) · 시장 읽은 지 모름`);
    const s5 = (await C('ml_days').doc(D5 + '_00').get()).data(); ok(!s5.cols.key.includes('aladin_2') && s5.cols.key.includes('aladin_3'), 'D5: 팔린 2번 빠지고 새로 등록한 3번 들어옴');
    ok([D1, D2, D3, D4, D5].every((d) => st.days.includes(d)) && st.rebuiltDays.length === 4 && !st.rebuiltDays.includes(D2) && st.lastDay === D0 && st.at === iso(D0, '01:00'), 'ml_state.days에 더함 · rebuiltDays에 되살린 날 · lastDay·at(심장 박동)은 그대로');
    const r2 = await F(60e3); ok(!r2.made.length, '두 번째엔 할 일 없음(같은 날 다시 만들지 않음)'); }

  /* ④ 멈춤 감시 */
  { const now = Date.parse('2026-11-09T07:30:00Z'); const docs = { ml_state: { lastDay: '2026-10-23', at: '2026-10-22T16:00:28Z', learn: { at: '2026-10-22T17:10:18Z' } }, value_model: { trainedAt: '2026-11-08T17:20:39Z', days: ['2026-10-22', '2026-10-23'] }, sp_obs: { days: ['2026-10-23'] } };
    const s = ML.stallCheck(docs, now); const red = s.rows.filter((x) => x.red).map((x) => x.k);
    ok(s.stallH === 36 && red.join(',') === 'ml_days,ml_learn,value_data,sp_obs', `11/09 실제 모습: 빨강 = ${red.join(',')} (판매가치 표는 매일 다시 배우지만 우리 자료가 10/23에 멈춤)`);
    const fresh = ML.stallCheck({ ml_state: { lastDay: '2026-11-09', at: '2026-11-08T16:05:00Z', learn: { at: '2026-11-08T17:10:00Z' } }, value_model: { trainedAt: '2026-11-08T17:20:00Z', days: ['2026-11-08'] }, sp_obs: { days: ['2026-11-08'] } }, now);
    ok(!fresh.rows.some((x) => x.red), '날마다 돌면 빨강 없음');
    { /* (11/10 아침 확인) value_data·sp_obs는 D 자료가 D+1 23시 배우기에 들어옴 → 나이는 D+2일 0시부터 */
      const d10 = { ml_state: { lastDay: '2026-11-10', at: '2026-11-09T16:10:00Z', learn: { at: '2026-11-09T17:00:00Z' } }, value_model: { trainedAt: '2026-11-09T14:10:00Z', days: ['2026-11-08'] }, sp_obs: { days: ['2026-11-08'] } };
      const r = (iso, k) => ML.stallCheck(d10, Date.parse(iso)).rows.find((x) => x.k === k);
      ok(ML.DATA_LAG_D === 2 && ['value_data', 'sp_obs'].every((k) => !r('2026-11-10T03:00:00Z', k).red && !r('2026-11-10T13:59:00Z', k).red), '11/10 실제 모습: 자료 마지막 날 11/08 · 낮 12시~23시(한국)에도 빨강 없음(예전엔 약 11시간 빨강)');
      ok(Math.round(r('2026-11-10T14:00:00Z', 'value_data').ageH) === 23, '11/10 23시(한국) 나이 = 23시간(11/10 0시부터 셈)');
      ok(['value_data', 'sp_obs'].every((k) => r('2026-11-11T03:10:00Z', k).red && !r('2026-11-11T02:50:00Z', k).red), '배우기 한 회차를 거르면 11/11 12시(한국 · 0시+36시간)부터 빨강');
      ok(/D\+2일 0시부터 셈/.test(r('2026-11-10T03:00:00Z', 'sp_obs').name), '화면 글(엔진 이름)에 셈 기준 D+2일 0시');
      const ml = r('2026-11-10T03:00:00Z', 'ml_days'); ok(ml.at === Date.parse('2026-11-10T01:10:00+09:00') && !ml.red, 'ml_days(하루 모습)는 예전 셈 그대로'); }
    ok(ML.stallCheck({ ml_state: { ...docs.ml_state, stallH: 1000 } }, now).rows.find((x) => x.k === 'ml_days').red === false, '기준 시간은 ml_state.stallH로 바꿈');
    ok(/H\.mlStall = sc \?/.test(SRC) && /ML\.stallCheck\(\{ ml_state: ms0, value_model: vm, sp_obs/.test(SRC), '클라우드 진단 health에 mlStall(4시간 점검이 읽는 숫자 요약)'); }

  /* ⑤ 웹앱 홈 빨강 — 브라우저(harness가 있을 때) */
  const hp = ['/home/user/wb-ml1/pw/harness.js', path.join(__dirname, 'harness.js')].find((x) => fs.existsSync(x));
  if (!hp) { console.log('  (웹앱 화면 시험은 harness가 없어 건너뜀)'); return fin(); }
  require(hp)(async (p) => { const seed = path.join(path.dirname(hp), 'seed.js'); if (fs.existsSync(seed)) await p.evaluate(require(seed)); await p.waitForTimeout(600);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
      await db.collection('app_settings').doc('ml_state').set({ lastDay: '2026-10-23', at: '2026-10-22T16:00:28Z', learn: { at: '2026-10-22T17:10:18Z' }, lastErr: null });
      await db.collection('app_settings').doc('sp_obs').set({ days: ['2026-10-23'], bands: [] }); S._mlStall = null;
      const al = () => { let A = []; try { A = bizAlerts(bizCalc()); } catch (e) { o.err = e.message; } return A.find((a) => a.x && a.x.k === 'mlstall'); };
      al(); await W(700); const a1 = al(); o.a1 = a1 ? { lv: a1.lv, t: a1.t, key: a1.key, why: a1.x.why } : null;
      await db.collection('app_settings').doc('ml_state').set({ lastDay: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), at: new Date().toISOString(), learn: { at: new Date().toISOString() } });
      await db.collection('app_settings').doc('sp_obs').set({ days: [new Date(Date.now() - 15 * 3600e3).toISOString().slice(0, 10)] }); S._mlStall = null; al(); await W(700); o.a2 = !!al(); o.pops = pops; return o; });
    ok(R.a1 && R.a1.lv === 'red' && /학습 엔진 \d곳이 36시간 넘게 멈춤/.test(R.a1.t) && /하루 모습/.test(R.a1.t) && R.a1.key === 'mgr', `웹앱 홈: 빨강 '${R.a1 && R.a1.t}' → 관리도구`);
    ok(R.a1 && /마지막/.test(R.a1.why) && /stallH/.test(R.a1.why), '알림 까닭에 엔진마다 마지막 시각·기준 설정 자리');
    ok(R.a2 === false, '다시 돌면 빨강 사라짐'); ok(R.pops === 0, '브라우저 팝업 없음'); if (R.err) ok(false, '알림 셈 오류: ' + R.err);
  }).then(fin);
  function fin() { console.log(bad ? `❌ 실패 ${bad}` : '✓ 모두 통과'); process.exitCode = bad ? 1 : 0; }
  if (!hp) fin();
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exitCode = 1; });
