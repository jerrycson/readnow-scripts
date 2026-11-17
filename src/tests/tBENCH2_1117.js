// tBENCH2_1117 — (11/17 일꾼 bench2 · RESUME_1116 9번) 🎯 미완 바퀴 이어 읽기 보장 + 📖 못 읽은 상품 화면을 매시 다시 열지 않음 · 브라우저 필요 없음
//  ① benchLeftFirst: 어제 바퀴에서 못 끝낸 판매자(목록에 있고 끝 표시 없음 · 못 끝냄)를 오늘 새 바퀴 맨 앞 · 나머지는 원래 차례 · 빼거나 더하지 않음 · 오늘 바퀴면 그대로
//  ② 이어 읽기 칸의 바퀴 시작(resumeOf): 어제 시작한 바퀴면 끝남 표시와 상관없이 오늘로(null)
//  ③ benchDetailPass: 못 읽음(2)은 그날 한 번 끝까지 다시 본 뒤 같은 날 남은 회차에서는 열지 않음 · 다음 날엔 다시 엶 · 아직 안 읽은 것(0)은 언제나 엶
// 실행: node src/tests/tBENCH2_1117.js · 시험 자료는 모두 지어낸 값(가게 번호 9300001…)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.user.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const cut = (a0, b0) => { const a = SRC.indexOf(a0); const b = SRC.indexOf(b0, a + 1); return a > 0 && b > a ? SRC.slice(a, b) : ''; };
const LF = cut('function benchLeftFirst(', 'async function benchJob(');
const DP = cut('async function benchDetailPass(T, opt) {', 'async function benchDetailNote(');
ok(LF.length > 300 && DP.length > 3000, '운영 benchLeftFirst·benchDetailPass 떼어 냄');

console.log('① 새 바퀴 = 지난 바퀴에서 못 끝낸 판매자부터');
{ const logs = []; const sb = { log: (m) => logs.push(String(m)), Date, Set, Map, String, JSON }; vm.createContext(sb); vm.runInContext(LF + '\n;this.f = benchLeftFirst;', sb); const f = sb.f;
  const D0 = Date.parse('2026-11-15T00:00:00+09:00'); const base = ['a', 'b', 'c', 'd', 'e', 'f'];
  const byS = new Map(base.map((k) => [k, { name: '가게' + k }]));
  const y = { startedAt: '2026-11-14T01:31:00Z', done: false, list: ['a', 'b', 'c', 'd', 'e', 'f'], fin: { a: '1', b: '1', c: '1' }, failed: [] };
  const r1 = f(base, y, D0, byS); ok(JSON.stringify(r1) === JSON.stringify(['d', 'e', 'f', 'a', 'b', 'c']), '어제 못 끝낸 바퀴(끝 3명) → 남은 d·e·f 먼저, 끝낸 a·b·c 뒤', r1);
  ok(logs.some((l) => /못 끝낸 판매자 3명을 오늘 바퀴 맨 앞에: 가게d → 가게e → 가게f/.test(l)), '한국어 기록 줄', logs);
  const r2 = f(base, { ...y, done: true, failed: ['e'], fin: {} }, D0, byS); ok(JSON.stringify(r2) === JSON.stringify(['e', 'a', 'b', 'c', 'd', 'f']), '어제 바퀴가 끝(done)이어도 못 끝냄(failed)이 먼저', r2);
  const r3 = f(base, { ...y, startedAt: '2026-11-15T00:05:00+09:00' }, D0, byS); ok(r3 === base, '오늘 시작한 바퀴면 차례 그대로(이어 가기는 원래 갈래)', r3);
  const r4 = f(base, { ...y, list: ['zz', 'f'], fin: {} }, D0, byS); ok(JSON.stringify(r4) === JSON.stringify(['f', 'a', 'b', 'c', 'd', 'e']) && r4.length === base.length, '목록에 없는 판매자는 더하지 않음 · 수 그대로', r4);
  ok(f(base, null, D0, byS) === base && f(base, { ...y, done: true, failed: [] }, D0, byS) === base, '지난 바퀴 없음·모두 끝남 → 그대로');
  ok(/opt && opt\.fresh \? TF\.map\(\(t\) => String\(t\.sc\)\) : benchLeftFirst\(/.test(SRC), "'처음부터 다시(fresh)'는 원래 차례 그대로");
}

console.log('② 이어 읽기 칸 — 어제 바퀴면 바퀴 시작을 오늘로');
ok(/resumeOf: XNOW \? [^]*?: \(oldDay \|\| \(old && \(Date\.parse\(old\.resumeOf \|\| old\.startedAt \|\| ''\) \|\| 0\) < D0r\)\) \? null :/.test(SRC), '끝남 표시와 상관없이 어제 시작한 바퀴 → resumeOf null');

function mkFS() { const S = {}; const col = (name) => { S[name] = S[name] || {}; const T = S[name];
  const ref = (id) => ({ id, get: async () => ({ exists: id in T, data: () => (T[id] ? JSON.parse(JSON.stringify(T[id])) : undefined) }), set: async (v, o) => { T[id] = o && o.merge && T[id] ? { ...T[id], ...v } : { ...v }; }, collection: (c) => col(`${name}/${id}/${c}`) });
  return { doc: ref }; };
  const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops.splice(0)) await f(); } }; } };
  return { S, col, db }; }

(async () => {
  console.log('③ 못 읽음(2)은 하루 한 번만 다시');
  const F = mkFS(); const sc = '9300001'; const M = {};
  for (let i = 0; i < 30; i++) M[String(3000000 + i)] = [5000, '20261110', '상', 1, '19금책' + i, 0, 0, null, null, null, 2];
  for (let i = 0; i < 5; i++) M[String(4000000 + i)] = [5000, '20261116', '상', 1, '책' + i, 0, 0, null, null, null, 0];
  await F.col('bench_state').doc(sc).set({ sc, chunks: 1, detailRedo1113: '2026-11-13T00:00:00Z' });
  await F.col('bench_state').doc(sc).collection('c').doc('0').set({ s: JSON.stringify(M), n: Object.keys(M).length, fmt: 'json' });
  let day = '2026-11-16'; const order = []; const logs = [];
  const benchBook = async (id) => { order.push(id); if (id.startsWith('3')) throw Object.assign(new Error('로그인 없이는 못 보는 화면'), { needLogin: true }); return { isbn: '979' + id, cat: '국내도서>소설', pubYm: '2026-10' }; };
  const sb = { console, JSON, Date, Math, Object, Array, String, Number, Set, Map, Promise, isFinite, parseInt, setTimeout, Error,
    C: (n) => F.col(n), db: F.db, W: () => ({}), nowIso: () => new Date().toISOString(), kDayB: () => day, log: (m) => logs.push(String(m)), ui: () => {}, stopFlag: false,
    BREG: () => ({ BENCH: { DETAIL_DEF: { max: 1000, maxMin: 30 } } }), BENCH_CFG: {}, benchNetQuota: () => ({ ok: true }), benchBook };
  sb.globalThis = sb; vm.createContext(sb); vm.runInContext(DP + '\n;globalThis.__f = benchDetailPass;', sb); const T = [{ sc, name: '가게B' }];
  const r1 = await sb.__f(T, { capped: false });
  ok(r1.tried === 35 && r1.filled === 5 && order.slice(0, 5).every((id) => id.startsWith('4')), '그날 첫 회차: 안 읽은 5개 먼저 채우고 못 읽은 30개도 끝까지 다시 봄', { r1, n: order.length });
  ok((F.S.bench_state[sc] || {}).detail2Day === '2026-11-16', '못 읽음까지 끝까지 본 날 적음(detail2Day)', F.S.bench_state[sc]);
  order.length = 0; logs.length = 0;
  const r2 = await sb.__f(T, { capped: false });
  ok(r2.tried === 0 && order.length === 0, '같은 날 다음 회차: 못 읽은 30개를 다시 열지 않음(예전엔 매시 30번)', { r2, order });
  ok(logs.some((l) => /못 읽은 30개\(로그인 없이는 못 보는 상품 등\)는 오늘 이미 한 번 다시 봐서 내일 다시/.test(l)), '까닭 줄(한국어)', logs);
  { const M2 = JSON.parse(F.S[`bench_state/${sc}/c`]['0'].s); M2['4100000'] = [5000, '20261116', '상', 1, '새 책', 0, 0, null, null, null, 0]; await F.col('bench_state').doc(sc).collection('c').doc('0').set({ s: JSON.stringify(M2), n: Object.keys(M2).length, fmt: 'json' }); }
  order.length = 0; const r3 = await sb.__f(T, { capped: false });
  ok(r3.tried === 1 && r3.filled === 1 && order[0] === '4100000', '같은 날 새로 들어온 안 읽은 상품은 그대로 엶', { r3, order });
  day = '2026-11-17'; order.length = 0; const r4 = await sb.__f(T, { capped: false });
  ok(r4.tried === 30 && order.every((id) => id.startsWith('3')), '다음 날 첫 회차엔 못 읽은 30개를 다시 엶(빼지 않음)', { r4, n: order.length });
  { const F2 = mkFS(); sb.C = (n) => F2.col(n); sb.db = F2.db; await F2.col('bench_state').doc(sc).set({ sc, chunks: 1, detailRedo1113: 'x' }); await F2.col('bench_state').doc(sc).collection('c').doc('0').set({ s: JSON.stringify(M), n: 35, fmt: 'json' });
    sb.BREG = () => ({ BENCH: { DETAIL_DEF: { max: 10, maxMin: 30 } } }); order.length = 0; const r5 = await sb.__f(T, { capped: true });
    ok(r5.tried === 10 && !(F2.S.bench_state[sc] || {}).detail2Day, '개수 제한으로 못 읽음까지 못 간 회차는 날을 적지 않음(다음 회차가 이어 봄)', { r5, st: F2.S.bench_state[sc] }); }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과 — tBENCH2_1117');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
