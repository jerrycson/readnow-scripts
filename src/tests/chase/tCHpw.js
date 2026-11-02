// tCHpw — 가격 감시기 ↔ 🎯 추격자 엔진 연결 시험: 감시기 원본에서 stratOf·chaseFor·chaseRecord·watchJudge를 떼어 가짜 Firestore로 돌림
// 실행: node src/tests/chase/tCHpw.js [저장소 경로]
const fs = require('fs'); const path = require('path'); const ROOT = process.argv[2] || path.join(__dirname, '../../..');
const PR = require(path.join(ROOT, 'readnow-pricing-core.js')); const src = fs.readFileSync(path.join(ROOT, 'readnow-price-watch.user.js'), 'utf8');
const a = src.indexOf('  const presetOf = '); const b = src.indexOf('  async function followUps('); if (a < 0 || b < a) { console.log('❌ 감시기에서 함수를 못 찾음'); process.exit(1); }
let bad = 0, n = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('  ❌', m); } else if (process.env.V) console.log('  ✓', m); };
const FS = {}; const inc = (x) => ({ __inc: x }); const mergeIn = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__inc != null) o[k] = (o[k] || 0) + x.__inc; else if (x && typeof x === 'object' && !Array.isArray(x) && o[k] && typeof o[k] === 'object') o[k] = mergeIn(o[k], x); else if (x && typeof x === 'object' && !Array.isArray(x)) o[k] = mergeIn({}, x); else o[k] = x; } return o; };
let auto = 0; const col = (nm) => ({ doc: (id) => ({ _n: nm, _id: id || 'auto' + ++auto }), where: () => ({ get: async () => ({ docs: Object.values(FS[nm] || {}).map((d) => ({ data: () => d })) }) }) });
const db = { batch: () => { const ops = []; return { set: (r, v) => ops.push([r, v]), commit: async () => { for (const [r, v] of ops) { FS[r._n] = FS[r._n] || {}; FS[r._n][r._id] = mergeIn(FS[r._n][r._id], v); } } }; } };
const firebase = { firestore: { FieldValue: { increment: inc } } }; const logs = []; const log = (m) => logs.push(m);
function load(SET) { return new Function('PR', 'SET', 'C', 'db', 'firebase', 'W', 'log', src.split('\n').find((l) => /^  const engineSettings = /.test(l)) + '\n' + src.slice(a, b) + '\nreturn { stratOf, chaseFor, chaseRecord, watchJudge, CHE };')(PR, SET, col, db, firebase, () => ({ w: 1 }), log); }
const listing = { usedCode: 'U1', key: 'aladin_U1', price: 10000, grade: '상', registeredAt: '2026-10-01T00:00:00+09:00', status: '판매중', ship: 2500, title: '시험 책', sku: 'ABC' };
const sellers = { sc_111: { name: '갑' }, sc_222: { name: '을' } };
const rows = [{ sellerCode: '111', sellerName: '갑', price: 9000, grade: '상', ship: 2500, rank: 1, firstSeenAt: '2026-10-01T00:00:00Z' }, { sellerCode: '222', sellerName: '을', price: 9500, grade: '상', ship: 2500, rank: 2, firstSeenAt: '2026-10-01T00:00:00Z' }, { usedCode: 'U1', sellerCode: '996008', price: 10000, grade: '상', ship: 2500, rank: 3 }];
const P1c = [{ r: 1, sc: '111', n: '갑', g: '상', p: 9000, s: 2500, c: 'green' }, { r: 2, sc: '222', n: '을', g: '상', p: 9500, s: 2500, c: 'green' }, { r: 3, sc: '996008', g: '상', p: 10000, c: 'ours', uc: 'U1' }];
const wg = { id: 'g1', name: '감시1', watch: { mode: 'auto', on: true } }; const now = '2026-11-02T03:00:00.000Z'; const used = { buyback: null };
const ctxOf = (chase) => ({ now, core: { classifySellerDoc: () => ({ cls: 'green' }) }, RS: {}, chase, chaseMoves: {}, policy: { fee: 2500 }, settings: {} });
(async () => {
  { // 정책 꺼짐: 예전처럼 — 추격자 지도에 있는 111을 그룹 전략(자동 = 양보)으로
    const X = load({ autoChase: { name: 'yield' } }); ok(X.CHE === PR.Chase, '감시기가 판정 엔진 안 추격자 엔진을 씀');
    const J = X.watchJudge(wg, null, listing, { at: now, rows }, sellers, ctxOf({ 111: { active: true } }), P1c.map((w) => ({ ...w })), used, {}, now);
    ok(J.chaser && J.chaser.sellerCode === '111' && J.strat && J.strat.name === 'yield' && /추격자 전략: 양보/.test(J.reasons[0]), `정책 꺼짐: 예전 그대로 양보 (${J.target} · ${J.reasons[0]})`);
    const old = PR.chaseStep({ strat: { name: 'yield' }, state: null, now, cur: 10000, base: J.chR.t, yieldT: J.chR.t, chaser: { sellerCode: '111', name: '갑', price: 9000, grade: '상' }, floor: J.floor, start: 10000 }); ok(J.strat.phase === old.state.phase, '정책 꺼짐 = 옛 chaseStep 단계');
    await X.chaseRecord(J, { key: 'aladin_U1', usedCode: 'U1', bookId: 'b1', title: '시험 책', now, cur: 10000, start: 10000, chaser: J.chaser }, null);
    ok(Object.keys(FS.chase_log || {}).length === 1 && FS.chase_rel['111'].n === 1 && FS.chase_rel['111'].books.b1.n === 1 && FS.chase_day['2026-11-02'].yield.steps === 1 && Object.keys(FS.chase_eps).length === 1, '기록: 한 줄·관계·하루 수·전략 한 판');
    await X.chaseRecord(J, { key: 'aladin_U1', usedCode: 'U1', bookId: 'b1', title: '시험 책', now: '2026-11-02T09:00:00Z', cur: J.target, start: 10000, chaser: J.chaser, prevChP: 9000 }, J.strat); ok(Object.keys(FS.chase_log).length === 1, '같은 판정이면 기록 안 늘어남'); }
  { // 정책 켬: 111 무시 · 222 지정 아님 → 무시 판매자는 추격 기록 없이도 빼고 다음(을 9,500) 기준
    const POL = { on: true, sellers: { 111: { stance: 'ignore', name: '갑' } } }; const X = load({ chaseEng: POL });
    const J = X.watchJudge(wg, null, listing, { at: now, rows }, sellers, ctxOf(PR.Chase.mapWithPolicy({}, POL)), P1c.map((w) => ({ ...w })), used, {}, now);
    ok(J.chaser && J.chaser.who === 'specific' && J.strat.name === 'yield' && J.strat.who === 'specific' && /지정 판매자\(무시/.test(J.reasons[0]), `무시: 지정 판매자 표시 · 양보 (${J.target} · ${J.reasons[0]})`);
    ok(J.target === 9500, `무시 판매자를 빼고 을(9,500)과 동가 (${J.target})`);
    const X2 = load({ chaseEng: { ...POL, rec: false } }); const c0 = Object.keys(FS.chase_log).length; await X2.chaseRecord(J, { key: 'aladin_U9', usedCode: 'U9', bookId: 'b9', now, cur: 10000, start: 10000, chaser: J.chaser }, null); ok(Object.keys(FS.chase_log).length === c0, '기록 끄면 쓰지 않음'); }
  { // 정책 켬: 111 공격적 → 끌어내리기(한 단위 아래 8,950)
    const POL = { on: true, sellers: { 111: { stance: 'aggressive' } } }; const X = load({ chaseEng: POL });
    const J = X.watchJudge(wg, null, listing, { at: now, rows }, sellers, ctxOf({}), P1c.map((w) => ({ ...w })), used, {}, now);
    ok(J.strat.name === 'lure' && J.target === 8950, `공격적: 끌어내리기 8,950 (${J.target})`); }
  console.log(`tCHpw: ${n - bad}/${n} 통과`); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌', e.stack); process.exit(1); });
