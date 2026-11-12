// tVOICE_INC1112 — (voice2 11/12) 🗣 구매평 요약 증분 셈 · 🩺 클라우드 메모리 감시 · 브라우저 필요 없음
//  ① 나눠 센 합 = 한 번에 센 값(조각·줄 상한을 아주 작게 해서 수십 회차로 나눠도 같은 요약)
//  ② 처음 전체를 다 센 뒤엔 새로 쓰인 문서(uploadedAt)만 읽어 더함 — 더한 결과 = 처음부터 다시 센 값 · 꼬리 조각(덮어써짐)·다시 쓴 번호 조각·문의 글은 두 번 세지 않음
//  ③ 쓰다가 죽어도(상태 쓰기 도중 오류) 앞 상태 그대로 → 다음 회차가 이어 셈 · 끝나지 않은 채 죽었으면 6시간 쉬고 줄 수 반
//  ④ 메모리 상한 — 구매평 20만 건을 셀 때 셈이 늘린 힙 < 300MB · memMB에 걸리면 거기까지(이어 셈)
//  ⑤ 클라우드 메모리 감시(cloud/memwatch.js) 연결·앞 판 기록·진단 mem·clog
// 실행: cd src/tests && node --expose-gc tVOICE_INC1112.js   (../../cloud/*.js) · 시험 자료는 모두 지어낸 값(가게 번호 9000001…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const V = require(path.join(ROOT, 'cloud', 'voice.js')); const SRC = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');

/* 가짜 Firestore — 문서 이름 차례·uploadedAt 차례·startAfter(글/문서)·바이트(Buffer) 그대로 */
const clone = (v) => (Buffer.isBuffer(v) ? Buffer.from(v) : Array.isArray(v) ? v.map(clone) : v instanceof Date ? new Date(v) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);
function mkFS(data, o2) { o2 = o2 || {}; const st = { reads: 0, writes: 0, failAfter: null };
  const snap = (n, id, v) => ({ id, exists: v !== undefined, data: () => (v === undefined ? undefined : clone(v)), _ord: v && v.uploadedAt });
  const Q = (n, o) => ({ orderBy: (f) => Q(n, { ...o, ord: typeof f === 'string' ? f : '__id' }), select: () => Q(n, o), where: (k, op, v) => Q(n, { ...o, w: [k, op, v] }), limit: (x) => Q(n, { ...o, lim: x }), startAfter: (d) => Q(n, { ...o, after: d }),
    get: async () => { let L = Object.entries(data[n] || {}); if (o.w) { const [k, op, v] = o.w; L = L.filter(([, x]) => (op === '==' ? x[k] === v : op === '>' ? x[k] != null && +new Date(x[k]) > +new Date(v) : true)); }
      if (o.ord === 'uploadedAt') L.sort((a, b) => +new Date(a[1].uploadedAt) - +new Date(b[1].uploadedAt) || (a[0] < b[0] ? -1 : 1)); else L.sort((a, b) => (a[0] < b[0] ? -1 : 1));
      if (o.after != null) { if (typeof o.after === 'string') L = L.filter(([id]) => id > o.after); else { const i = L.findIndex(([id]) => id === o.after.id); L = L.slice(i + 1); } }
      if (o.lim) L = L.slice(0, o.lim); st.reads += L.length || 1; const docs = L.map(([id, v]) => snap(n, id, v)); return { size: docs.length, empty: !docs.length, docs, forEach: (f) => docs.forEach(f) }; } });
  const C = (n) => ({ ...Q(n, {}), doc: (id) => ({ get: async () => { st.reads++; return snap(n, id, (data[n] || {})[id]); }, set: async (v, opt) => { if (st.failAfter != null && st.writes >= st.failAfter) throw new Error('가짜 멈춤(쓰기 도중)'); st.writes++; const cur = (data[n] || {})[id]; (data[n] = data[n] || {})[id] = opt && opt.merge && cur ? { ...cur, ...clone(v) } : clone(v); } }) });
  return { C, st, FieldPath: { documentId: () => '__name__' } }; }

let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); const pick = (a) => a[Math.floor(rnd() * a.length)];
const words = ['배송이 빨라요', '포장이 꼼꼼', '책 상태 깨끗', '사진과 달라요', '찢어져 왔어요', '가격 저렴', '친절한 응대', '다른 책이 왔어요', '품절 취소', '좋아요 감사', '먼지투성이 책', '냄새나는 종이', '그냥 그래요', '표지가 누렇', '모서리 눌림', '띠지 없음', '누락되었네요', '구김 있음'];
const mkItem = (i) => ({ d: `2026-${String(1 + Math.floor(rnd() * 10)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`, r: pick(['good', 'good', 'good', 'mid', 'bad']), c: pick(words) + ' ' + pick(words) + ' 낱말' + String.fromCharCode(44032 + (i % 900)) + String.fromCharCode(44100 + (i % 37)), reply: i % 9 === 0 ? '사과드립니다 교환' : undefined });
const T0 = Date.now(); const at = (min) => new Date(T0 + min * 60e3); /* 처음 자료는 지금보다 앞 · 새로 쓰는 문서는 now()(셈이 시작한 뒤) */ const now = () => new Date();
function mkData(S, per) { const c2 = {}, op = {}; let k = 0; for (let s = 0; s < S; s++) { const sc = String(9000001 + s);
    for (let j = 0; j < 3; j++) c2[`${sc}_r${String(j).padStart(4, '0')}`] = { sc, kind: 'r', seq: j, items: Array.from({ length: per }, () => mkItem(k++)), uploadedAt: at(-600 + s) };
    c2[`${sc}_q0000`] = { sc, kind: 'q', seq: 0, items: Array.from({ length: 8 }, (_, i) => ({ d: '2026-10-0' + (1 + (i % 9)), c: pick(words), sec: i % 3 === 0, ans: i % 2 === 0 })), uploadedAt: at(-600) };
    c2[`${sc}_rtail`] = { sc, kind: 'r', seq: 'tail', items: Array.from({ length: 5 }, () => mkItem(k++)), uploadedAt: at(-500) }; c2[`${sc}_qtail`] = { sc, kind: 'q', seq: 'tail', items: [{ d: '2026-11-01', c: '문의 꼬리', sec: false, ans: false }], uploadedAt: at(-500) };
    op[`sc_${sc}_2026-10`] = { sc, sellerId: 'sc_' + sc, month: '2026-10', items: [...c2[`${sc}_r0000`].items.slice(0, 7), ...Array.from({ length: per >> 1 }, () => mkItem(k++))], uploadedAt: at(-550) }; }
  return { col2_voice: c2, seller_reviews: op, col2_voice_s: Object.fromEntries(Array.from({ length: S }, (_, s) => [String(9000001 + s), { n: s % 2 ? 120 : 5000 }])), sellers: {}, app_settings: { voice_lex: { add: { cond: ['먼지'] } } },
    crm_interactions: { i1: { type: 'review', rating: '만족', body: '배송 빨라요' }, i2: { type: 'review', rating: '불만족', body: '찢어져 왔어요' } } }; }
/* 한 번에 센 값(기준) — 옛 흘려 셈과 같은 차례: 번외 번호 조각(문서 이름 차례) → 운영 평가 → 꼬리 조각 */
function oneShot(data) { const N = new Map(Object.entries(data.col2_voice_s).map(([k, v]) => [k, v.n])); const A = V.makeAcc({ lex: V.lexOf(data.app_settings.voice_lex.add), sizeOf: (sc) => V.voSize(N.has(sc) ? N.get(sc) : null) });
  const ids = Object.keys(data.col2_voice).sort(); ids.filter((id) => !/tail$/.test(id)).forEach((id) => A.c2(data.col2_voice[id])); Object.keys(data.seller_reviews).sort().forEach((id) => A.op(data.seller_reviews[id]));
  const scs = [...new Set([...Object.keys(data.col2_voice_s)])]; for (const sc of scs) for (const k of ['r', 'q']) { const v = data.col2_voice[`${sc}_${k}tail`]; if (v) A.c2(v); }
  return V.docOf(A.result([{ r: 'good', c: '배송 빨라요' }, { r: 'bad', c: '찢어져 왔어요' }]), '2026-11-12'); }
const core = (d) => { const { at: _a, ms: _m, src: _s, partial: _p, few: _f, pruned: _r, by: _b, writer: _w, uploadedAt: _u, writerSchema: _ws, ...x } = d; return JSON.stringify(x); };
const coreSet = (d) => { const x = JSON.parse(core(d)); x.sizes = (x.sizes || []).slice().sort((a, b) => (a.g < b.g ? -1 : 1)); x.cands = (x.cands || []).slice().sort((a, b) => (a.w < b.w ? -1 : 1)); const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v); return JSON.stringify(canon(x)); }; /* 주제별 수 칸의 차례도 */ /* 차례가 섞이는 칸(판매자 크기 묶음·후보 낱말 동점)은 정렬해 견줌 */
const mkVS = (F, extra) => V.makeVoiceStudy({ C: F.C, FieldPath: F.FieldPath, log: () => {}, W: () => ({ writer: 'cloud' }), ...(extra || {}) });

(async () => {
  console.log('① 나눠 센 합 = 한 번에 센 값');
  const D1 = mkData(12, 30); const want = oneShot(D1);
  const F1 = mkFS(clone(D1)); const a1 = await mkVS(F1).run(false, false, { page: 50, maxRows: 1e6 }); const d1 = F1 && (await F1.C('app_settings').doc('voice_study').get()).data();
  ok(a1.phase === 'live' && !a1.partial && core(d1) === core(want), `한 회차로 다 셈 = 기준(구매평 ${want.n} · 문의 ${want.q} · 판매자 ${want.sellers})`, { a1, d: core(d1).slice(0, 200), w: core(want).slice(0, 200) });
  const F2 = mkFS(clone(D1)); const VS2 = mkVS(F2); let runs = 0, last = null; for (; runs < 400; runs++) { last = await VS2.run(true, false, { page: 2, opPage: 1, maxRows: 40 }); if (last.phase === 'live' && !last.partial) break; }
  const d2 = (await F2.C('app_settings').doc('voice_study').get()).data(); const m2 = (await F2.C('voice_acc').doc('meta').get()).data();
  ok(runs > 10 && core(d2) === core(want), `${runs + 1}회차로 나눠 셈(조각 2개·줄 40개씩) = 한 번에 센 값`, { runs, d: core(d2).slice(0, 300), w: core(want).slice(0, 300) });
  ok(m2.v === 2 && m2.phase === 'live' && m2.seenN > 0 && m2.gen === runs + 1 && m2.base.c2Docs === 12 * 6, `셈 상태 voice_acc/meta(두 벌 번갈아 · 세대 ${m2.gen} · 같은 글 장부 ${m2.seenN}건)`, { gen: m2.gen, base: m2.base });
  ok(!JSON.stringify((await F2.C('voice_acc').doc('meta').get()).data()).match(/찢어져 왔어요|사과드립니다/), '셈 상태에 글 원문 없음(숫자·낱말·판매자 번호만)');
  const s0 = (await F2.C('voice_acc').doc(`g${m2.gen % 2}_s0`).get()).data(); ok(Buffer.isBuffer(s0.b) && s0.b.length === s0.n * 8, '같은 글 장부는 바이트 칸(8바이트 × 건수)', { n: s0.n });

  console.log('② 다 센 뒤 — 새로 쓰인 문서만 더함');
  const F3data = clone(D1); const F3 = mkFS(F3data); const VS3 = mkVS(F3); await VS3.run(false, false, { page: 5, maxRows: 1e6 });
  const before = (await F3.C('app_settings').doc('voice_study').get()).data(); ok(before.n === want.n, '처음 전체 다 셈');
  ok((await VS3.run(false, false)).skip === 1, '다 센 뒤 20시간 안엔 다시 안 셈(하루 한 번)');
  const sc = '9000003'; let k = 50000;
  F3data.col2_voice[`${sc}_r0003`] = { sc, kind: 'r', seq: 3, items: Array.from({ length: 20 }, () => mkItem(k++)), uploadedAt: now() }; /* 새 번호 조각 */
  F3data.col2_voice[`${sc}_q0001`] = { sc, kind: 'q', seq: 1, items: [{ d: '2026-11-10', c: '새 문의', sec: false, ans: true }], uploadedAt: now() };
  F3data.seller_reviews[`sc_${sc}_2026-11`] = { sc, sellerId: 'sc_' + sc, month: '2026-11', items: Array.from({ length: 9 }, () => mkItem(k++)), uploadedAt: now() }; /* 새 달 문서 */
  F3data.seller_reviews[`sc_${sc}_2026-10`].items.push(...Array.from({ length: 4 }, () => mkItem(k++))); F3data.seller_reviews[`sc_${sc}_2026-10`].uploadedAt = now(); /* arrayUnion으로 늘어난 문서(앞 글은 같은 글로 빠짐) */
  F3data.col2_voice[`${sc}_q0000`].uploadedAt = now(); /* 같은 번호 조각을 다시 씀(문의는 같은 글 판단이 없음 → 두 번 세면 안 됨) */
  F3data.col2_voice[`${sc}_rtail`] = { sc, kind: 'r', seq: 'tail', items: Array.from({ length: 3 }, () => mkItem(k++)), uploadedAt: now() }; /* 꼬리 조각을 덮어씀(앞 꼬리 글은 번호 조각으로 옮겨진 것과 같음) */
  F3data.col2_voice[`${sc}_r0004`] = { sc, kind: 'r', seq: 4, items: clone(D1.col2_voice[`${sc}_rtail`].items), uploadedAt: now() };
  const r0 = F3.st.reads; const inc = await VS3.run(true, false, {}); const rIncReads = F3.st.reads - r0; const after = (await F3.C('app_settings').doc('voice_study').get()).data();
  const fresh = oneShot(F3data); { const a = JSON.parse(coreSet(after)), f = JSON.parse(coreSet(fresh)); for (const k in f) if (JSON.stringify(a[k]) !== JSON.stringify(f[k])) console.log('    다름', k, JSON.stringify(a[k]).slice(0, 300), '|', JSON.stringify(f[k]).slice(0, 300)); } ok(coreSet(after) === coreSet(fresh), `더한 결과 = 처음부터 다시 센 값(구매평 ${before.n} → ${after.n} · 문의 ${before.q} → ${after.q})`, { a: coreSet(after).slice(0, 400), f: coreSet(fresh).slice(0, 400) });
  ok(after.q === before.q + 1 && after.n === fresh.n, '다시 쓴 문의 조각은 두 번 안 셈 · 새 문의 1건만 더함', { q0: before.q, q1: after.q });
  ok(inc.phase === 'live' && after.src.mode === 'inc' && !after.partial, '증분 결과도 partial 아님 · src.mode inc');
  const docsInc = (await F3.C('voice_acc').doc('meta').get()).data().last.docs; ok(docsInc === 7, `새로 쓰인 문서 ${docsInc}개만 읽음(전체 ${Object.keys(F3data.col2_voice).length + Object.keys(F3data.seller_reviews).length}개를 다시 읽지 않음)`, { docsInc, reads: rIncReads });
  const inc2 = await VS3.run(true, false, {}); const after2 = (await F3.C('app_settings').doc('voice_study').get()).data(); ok(core(after2) === core(after), `한 번 더 돌아도(마지막 10분은 겹쳐 읽음 — 이번 ${(await F3.C('voice_acc').doc('meta').get()).data().last.docs}개) 값 그대로`, inc2);
  F3data.app_settings.voice_lex = { add: { cond: ['먼지', '구김'] } }; const rl = await VS3.run(true, false, { maxRows: 1e6 }); const afterL = (await F3.C('app_settings').doc('voice_study').get()).data(); const freshL = (() => { const d = clone(F3data); return oneShot(d); })();
  ok(rl.phase === 'live' && coreSet(afterL) === coreSet(freshL), '주제 사전(voice_lex)이 바뀌면 처음부터 다시 셈', { rl });

  console.log('③ 쓰다가 죽어도 이어 셈');
  const F4data = clone(D1); const F4 = mkFS(F4data); const VS4 = mkVS(F4); await VS4.run(false, false, { page: 2, maxRows: 100 }); const g1 = (await F4.C('voice_acc').doc('meta').get()).data().gen;
  F4.st.failAfter = F4.st.writes + 5; let threw = null; try { await VS4.run(true, false, { page: 2, maxRows: 100 }); } catch (e) { threw = e.message; } F4.st.failAfter = null;
  const g2 = (await F4.C('voice_acc').doc('meta').get()).data().gen; ok(threw && g2 === g1, '상태 쓰기 도중 멈춤 → meta는 앞 세대 그대로(반쯤 쓴 벌은 안 씀)', { threw, g1, g2 });
  F4data.app_settings.voice_study_run = { ok: false, startAt: new Date().toISOString(), crashN: 0 }; const sk = await VS4.run(false, false, {}); ok(sk.skip === 'crash', '끝나지 않은 채 죽었으면 스스로는 6시간 쉼', sk);
  const rs = await VS4.run(true, false, { page: 2, maxRows: 100 }); ok(rs.rows <= 60 && rs.rows < 100 && (await F4.C('app_settings').doc('voice_study_run').get()).data().ok === true, `다음 회차는 줄 수를 반으로(이번 ${rs.rows}줄 — 50줄 + 마지막 쪽 하나) · 끝나면 ok`, rs);
  for (let i = 0; i < 300; i++) { const r = await VS4.run(true, false, { page: 3, maxRows: 200 }); if (r.phase === 'live' && !r.partial) break; } ok(core((await F4.C('app_settings').doc('voice_study').get()).data()) === core(want), '멈춘 곳부터 이어 끝까지 셈 = 한 번에 센 값');

  console.log('④ 메모리 상한');
  if (typeof global.gc !== 'function') ok(false, 'node --expose-gc 로 돌려야 함'); else {
    const D5 = mkData(400, 160); const n5 = Object.values(D5.col2_voice).reduce((a, v) => a + (v.kind === 'r' ? v.items.length : 0), 0) + Object.values(D5.seller_reviews).reduce((a, v) => a + v.items.length, 0); const F5 = mkFS(D5); const VS5 = mkVS(F5);
    global.gc(); const h0 = process.memoryUsage().heapUsed; let peak = 0; const tm = setInterval(() => { const h = process.memoryUsage().heapUsed - h0; if (h > peak) peak = h; }, 5);
    let rr = null, nRun = 0; for (; nRun < 50; nRun++) { rr = await VS5.run(true, false, { page: 20, maxRows: 50000, budgetMs: 600e3 }); if (rr.phase === 'live' && !rr.partial) break; } clearInterval(tm);
    const d5 = (await F5.C('app_settings').doc('voice_study').get()).data(); const pk = Math.round(peak / 1048576);
    ok(n5 > 200000 && d5.n > 190000 && nRun >= 3, `구매평 ${n5.toLocaleString()}줄을 ${nRun + 1}회차(5만 줄씩)로 셈 · 요약 ${d5.n.toLocaleString()}건`, { n5, n: d5.n, nRun });
    ok(pk < 300, `셈이 늘린 힙 최고 ${pk}MB < 300MB(같은 글 장부 ${d5.src.seen.toLocaleString()}건 · 회차 기록 +${d5.src.hiMB}MB)`, { pk });
    const F6 = mkFS(clone(D1)); const r6 = await mkVS(F6).run(true, false, { page: 1, memMB: -1 }); ok(r6.why === 'mem' && r6.partial === true, "memMB를 넘으면 거기까지('mem') · 다음 회차가 이어 셈", r6); }

  console.log('⑤ 클라우드 연결 · 메모리 감시');
  ok(/makeVoiceStudy\(\{ C, FieldPath, log, W \}\)/.test(SRC) && /setInterval\(\(\) => VOICE\.run\(\)[^\n]*30 \* 60e3\)/.test(SRC), '클라우드가 30분마다 확인(처음 전체는 나눠 이어 셈 · 다 센 뒤엔 20시간 막이)');
  ok(/require\('\.\/memwatch\.js'\)\.makeMemWatch\(/.test(SRC) && /MEMW\.start\(\)/.test(SRC) && /MEMW\.reqStart\(req\.url\)/.test(SRC), '메모리 감시 켜짐 · 요청마다 처리 중 주소 셈');
  ok(/if \(q\.mem\) \{/.test(SRC) && /if \(q\.clog\) \{[^\n]*readCloudLog/.test(SRC), '진단 mem=1(지금·앞 판 마지막 모습) · clog=<분>(Cloud Logging 읽기)');
  ok(/VOICE\.busy\(\)/.test(SRC) && /bx\('learn'/.test(SRC) && /bx\('sellerLearn'/.test(SRC), "바쁜 일 이름(구매평·배우기·판매자 배우기·tick·daily …)을 표본에 남김");
  const MW = require(path.join(ROOT, 'cloud', 'memwatch.js')); const mdata = { app_settings: { cloud_mem: { boot: '2026-11-12T08:31:00Z', at: '2026-11-12T08:39:50Z', ver: '0.35.147', upMin: 8, limitMB: 1024, s: [{ t: '08:39:40', heap: 960, busy: ['daily', 'ml'], inf: { '/shop/x': 2 } }], boots: [] } } };
  const FM = mkFS(mdata); const logs = []; const M = MW.makeMemWatch({ C: FM.C, log: (...a) => logs.push(a.join(' ')), ver: '9.9.9', busyOf: () => ['voice'] });
  const end = M.reqStart('/diag?x=1'); const s1 = M.sample(); ok(s1.inf['/diag'] === 1 && s1.busy[0] === 'voice' && s1.heap > 0, '표본 = 메모리·처리 중 주소(쿼리 뺌)·바쁜 일', s1); end(); end(); ok(!M.sample().inf['/diag'], '끝난 요청은 빠짐(두 번 불러도 한 번)');
  await new Promise((z) => setTimeout(z, 10)); const snap = M.snap(); ok(snap.ver === '9.9.9' && Array.isArray(snap.s) && snap.hits5['/diag'] === 1, '모습 = 판·뜬 뒤 분·표본·5분 동안 부른 주소');
  const mm = require(path.join(ROOT, 'cloud', 'memwatch.js')); ok(typeof mm.readCloudLog === 'function', 'Cloud Logging 읽기 함수');
  const W3 = MW.makeMemWatch({ C: FM.C, log: (...a) => logs.push(a.join(' ')), ver: '9.9.9' }); W3.sample(); await W3._put(true); const cm = mdata.app_settings.cloud_mem;
  ok(cm.boots && cm.boots[0] && cm.boots[0].boot === '2026-11-12T08:31:00Z' && cm.boots[0].tail[0].heap === 960 && cm.ver === '9.9.9' && /앞 판 마지막/.test(logs.join('\n')), '뜰 때 앞 판의 마지막 표본을 boots에 남김(죽기 직전 바쁜 일·처리 중 주소)', cm.boots);
  const SRCMW = fs.readFileSync(path.join(ROOT, 'cloud', 'memwatch.js'), 'utf8'); ok(!/customer|이름|phone|tel/.test(SRCMW.replace(/\/\*[\s\S]*?\*\//g, '')) && /split\('\?'\)\[0\]/.test(SRCMW), '주소는 쿼리를 떼고 앞 두 칸만(손님 정보 없음)');
  ok(/COPY \*\.js \.\//.test(fs.readFileSync(path.join(ROOT, 'cloud', 'Dockerfile'), 'utf8')), '새 파일 memwatch.js도 이미지에 들어감(COPY *.js)');


  console.log('⑥ 🧯 무거운 일 죽음 고리 끊기(HV)');
  { const a = SRC.indexOf('const HV_BOOT'); const b = SRC.indexOf('const BUSYX = new Set();'); ok(a > 0 && b > a, 'HV 구역 찾음');
    const mk = (data, boot) => { const F = mkFS(data); const L = []; const f = new Function('C', 'log', 'nowIso', 'BUSYX', 'Date0', SRC.slice(a, b).replace('const HV_BOOT = new Date().toISOString();', 'const HV_BOOT = Date0;') + '\nreturn HV;'); return { HV: f(F.C, (...m) => L.push(m.join(' ')), () => new Date().toISOString(), new Set(), boot), L }; };
    const hd = { app_settings: {} }; const A1 = mk(hd, 'boot1'); let ran = 0; const r1 = await A1.HV('valueLearn', async () => { ran++; return { n: 1 }; }); ok(r1.n === 1 && ran === 1 && hd.app_settings.heavy_run.valueLearn.endAt && hd.app_settings.heavy_run.valueLearn.crashN === 0, '보통은 그대로 돌고 끝 시각을 남김');
    hd.app_settings.heavy_run.valueLearn = { startAt: new Date().toISOString(), boot: 'boot1', endAt: null, crashN: 0 }; /* 앞 판이 도중에 죽음 */
    const A2 = mk(hd, 'boot2'); const r2 = await A2.HV('valueLearn', async () => { ran++; return {}; }); const v2 = hd.app_settings.heavy_run.valueLearn; ok(r2.skip === 'crashRest' && ran === 1 && v2.died && v2.crashN === 1 && Date.parse(v2.restUntil) - Date.now() > 5.9 * 3600e3 && /도중 클라우드가 죽었음/.test(A2.L.join('')), '앞 판이 이 일 도중 죽었으면 6시간 쉼(일은 안 돎)', v2);
    const r3 = await mk(hd, 'boot3').HV('valueLearn', async () => { ran++; return {}; }); ok(r3.skip === 'crashRest' && ran === 1, '쉬는 동안은 다음 판도 건너뜀');
    hd.app_settings.heavy_run.valueLearn.restUntil = new Date(Date.now() - 1000).toISOString(); const r4 = await mk(hd, 'boot4').HV('valueLearn', async () => { ran++; return { ok: 1 }; }); ok(r4.ok === 1 && ran === 2 && hd.app_settings.heavy_run.valueLearn.crashN === 0, '쉼이 끝나면 다시 돌고, 끝까지 가면 횟수 0');
    const r5 = await mk(hd, 'boot4').HV('valueFactors', async () => { throw new Error('보통 오류'); }).catch((e) => e.message); ok(r5 === '보통 오류' && hd.app_settings.heavy_run.valueFactors.endAt && !hd.app_settings.heavy_run.valueFactors.died, '보통 오류는 죽음으로 안 봄(끝 시각·오류 글)');
    ok(/HV\('valueLearn', valueLearn\)/.test(SRC) && /bx\('learn', \(\) => HV\('mlLedger', mlLedger\)/.test(SRC) && /HV\('sellerLearnStudy', sellerLearnStudy\)/.test(SRC), '뜬 뒤 90초 배우기 사슬·3시간 사슬·판매자 배우기가 HV로 감쌈');
    ok(/--max-old-space-size=1300/.test(fs.readFileSync(path.join(ROOT, 'cloud', 'Dockerfile'), 'utf8')), '힙 한도 1300MB(V8 기본 1GB에서)'); }
  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
