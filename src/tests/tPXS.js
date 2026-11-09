// 👀 (정범님 11/08) 클라우드 조회 누적 합(pxSumRun) 함수 단위 시험 — cloud/index.js의 PXSUM 칸만 떼어 node로 돌림(가짜 io)
//  ① 기록 없음·30일 안 기록뿐이면 건너뜀 ② 처음부터 하루씩 더함 · 한 번에 최대 3일 · 상품마다 8칸 중 제 칸 · 처음/마지막 날·날 수
//  ③ 이어서 돌리면 meta.thru 다음 날부터(두 번 안 셈) ④ 다 더했으면 건너뜀 ⑤ 적다가 끊겨도(commit 실패) 다시 돌리면 같은 날을 두 번 더하지 않음 ⑥ lid 없는 문서는 버림
//  사용: node tPXS.js (wb/pw 안 · 저장소 src/tests 안 어디서나)
const fs = require('fs'); const path = require('path');
const cand = [path.join(__dirname, '../cloud/index.js'), path.join(__dirname, '../../cloud/index.js')]; const file = cand.find((f) => fs.existsSync(f));
const src = file ? fs.readFileSync(file, 'utf8') : ''; const a = src.indexOf('/* PXSUM-START'), b = src.indexOf('/* PXSUM-END */'); if (a < 0 || b < 0) { console.log('❌ tPXS 실패 — PXSUM 칸 없음'); process.exit(1); }
const L = new Function(src.slice(a, b) + '\nreturn { pxSumRun, pxSumShard, pxSumAdd, PXSUM_N, PXSUM_K };')();
const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
const cp = (x) => JSON.parse(JSON.stringify(x));
/* 가짜 Firestore — px_views(날 → 문서들) · px_sum(meta + s0~s7) · commit은 한 묶음(모두 적히거나 하나도 안 적힘) */
function mkIo(views, opt) { opt = opt || {}; const st = { meta: null, S: Array.from({ length: L.PXSUM_N }, () => ({})), commits: 0, reads: 0 };
  const io = { meta: async () => cp(st.meta || {}), shards: async () => cp(st.S),
    first: async () => { const ds = Object.keys(views).filter((d) => views[d].length).sort(); return ds[0] || null; },
    day: async (d) => { st.reads += (views[d] || []).length; return cp(views[d] || []); },
    commit: async (SH, mt) => { if (opt.failAt && st.commits + 1 === opt.failAt) { opt.failAt = 0; throw new Error('적기 실패(시험)'); } st.commits++; st.S = cp(SH); st.meta = { ...(st.meta || {}), thru: mt.thru, docs: ((st.meta || {}).docs || 0) + mt.add }; } };
  return { io, st }; }
const row = (st, lid) => st.S[L.pxSumShard(lid)][lid] || null;
const V = (lid, human, extra) => ({ lid, n: human + ((extra && extra.bot) || 0), human, bot: 0, ours: 0, uniq: human, fromAladin: 0, mobile: 0, ck: 0, noCk: 0, nt: 0, ...(extra || {}) });
(async () => {
  // ① 기록 없음 · 30일 안 기록뿐
  { const { io } = mkIo({}); const r = await L.pxSumRun(io, '2026-10-10', 3); chk('noRec', r.skip === '조회 기록 없음', r); }
  { const { io, st } = mkIo({ '2026-10-20': [V('111', 1)] }); const r = await L.pxSumRun(io, '2026-10-10', 3); chk('tooNew', /30일 안 기록뿐/.test(r.skip || '') && st.commits === 0, r); }
  // ② 처음부터 — 10/01~10/05 기록 · target 10/05 · 한 번에 3일
  const views = { '2026-10-01': [V('404935000', 3), V('404935001', 1, { bot: 2 })], '2026-10-02': [V('404935000', 2, { fromAladin: 1, mobile: 1 })], '2026-10-03': [{ day: '2026-10-03', n: 9, human: 9 } /* lid 없음 → 버림 */, V('shop_notice', 4)], '2026-10-04': [V('404935001', 5)], '2026-10-05': [V('404935000', 1)], '2026-10-06': [V('404935000', 100) /* target 뒤 — 더하면 안 됨 */] };
  const { io, st } = mkIo(views);
  const r1 = await L.pxSumRun(io, '2026-10-05', 3); R.r1 = r1;
  chk('first3', r1.days.join() === '2026-10-01,2026-10-02,2026-10-03' && r1.more === true && r1.thru === '2026-10-03' && st.commits === 3 && st.meta.thru === '2026-10-03', r1);
  chk('docs', r1.docs === 4 && st.meta.docs === 4, { docs: r1.docs, meta: st.meta }); /* 10/01 둘 + 10/02 하나 + 10/03 숍 하나(lid 없는 것 빠짐) */
  const a0 = row(st, '404935000'); chk('row0', a0 && a0[0] === 5 && a0[1] === 5 && a0[5] === 1 && a0[6] === 1 && a0[10] === '2026-10-01' && a0[11] === '2026-10-02' && a0[12] === 2, a0);
  const a1 = row(st, '404935001'); chk('row1bot', a1 && a1[0] === 3 && a1[1] === 1 && a1[2] === 2 && a1[12] === 1, a1);
  chk('shop', (row(st, 'shop_notice') || [])[1] === 4, row(st, 'shop_notice'));
  chk('shard', st.S.every((Lx, i) => Object.keys(Lx).every((k) => L.pxSumShard(k) === i)) && L.pxSumShard('404935000') === L.pxSumShard('404935000') && L.pxSumShard('x') < L.PXSUM_N, st.S.map((x) => Object.keys(x)));
  // ③ 이어서 — 10/04·10/05만 · 10/06(target 뒤)은 안 더함
  const r2 = await L.pxSumRun(io, '2026-10-05', 3); R.r2 = r2;
  chk('resume', r2.days.join() === '2026-10-04,2026-10-05' && r2.more === false && st.meta.thru === '2026-10-05', r2);
  const b0 = row(st, '404935000'), b1 = row(st, '404935001'); chk('sumAfter', b0[1] === 6 && b0[11] === '2026-10-05' && b0[12] === 3 && b1[1] === 6 && b1[12] === 2, { b0, b1 });
  // ④ 다 더함
  const r3 = await L.pxSumRun(io, '2026-10-05', 3); chk('done', r3.skip === '다 더함' && r3.thru === '2026-10-05', r3);
  // ⑤ 적다가 끊김 — 둘째 날 commit 실패 → 첫날만 남음 → 다시 돌리면 둘째 날부터(첫날 두 번 안 셈)
  { const { io: io2, st: st2 } = mkIo(views, { failAt: 2 }); let err = null; try { await L.pxSumRun(io2, '2026-10-05', 3); } catch (e) { err = e.message; }
    const mid = { thru: st2.meta && st2.meta.thru, h: (row(st2, '404935000') || [])[1] };
    const r4 = await L.pxSumRun(io2, '2026-10-05', 3); const r5 = await L.pxSumRun(io2, '2026-10-05', 3); const z0 = row(st2, '404935000'), z1 = row(st2, '404935001');
    chk('crash', err && mid.thru === '2026-10-01' && mid.h === 3 && r4.days[0] === '2026-10-02' && (r5.days || []).join() === '2026-10-05' && z0[1] === 6 && z0[12] === 3 && z1[1] === 6, { err, mid, r4, r5, z0, z1 }); }
  // ⑥ maxDays 기본 3
  { const { io: io3 } = mkIo(views); const r6 = await L.pxSumRun(io3, '2026-10-05'); chk('max3', r6.days.length === 3, r6); }
  console.log(JSON.stringify(R, null, 1).slice(0, 3000)); console.log(bad.length ? '❌ tPXS 실패 — ' + bad.join(', ') : '✓ tPXS 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
})().catch((e) => { console.log('❌ tPXS 실패 — ' + e.message); process.exit(1); });
