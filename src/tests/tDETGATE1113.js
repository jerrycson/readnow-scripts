// tDETGATE1113 — (h4 11/13 16:15 · land1) 📖 상품 페이지 정보: 로그인 없이는 못 보는 상품(19금 등)은 '못 읽음(2 — 맨 뒤 차례)'으로 보내고 다음으로 넘어감 · 브라우저 필요 없음
//  ① 운영 benchDetailPass를 글자 그대로 떼어 가짜 Firestore로 부름: 차례 맨 앞 25개가 19금(needLogin) → 멈추지 않고 뒤 상품을 채움 · 19금은 v[10]=2 · 끝 줄에 '맨 뒤 차례로' 개수
//  ② 19금이 아닌 오류(인터넷 등)가 20번 연달아면 예전처럼 멈추고 '못 읽음'으로 적지 않음 · 테더링 문(tgate)은 그 자리에서 멈춤
//  ③ 다음 바퀴: 19금(2)은 차례 맨 뒤(아직 안 읽은 것 먼저)
// 실행: node src/tests/tDETGATE1113.js · 시험 자료는 모두 지어낸 값(가게 번호 9200001…)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRCF = [path.join(ROOT, 'src/readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.src.js'), path.join(ROOT, 'readnow-collector.user.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
const FN = (() => { const a = SRC.indexOf('async function benchDetailPass(T, opt) {'); const b = SRC.indexOf('async function benchDetailNote(', a); return a > 0 && b > a ? SRC.slice(a, b) : ''; })();
ok(FN.length > 3000 && /bErr && bErr\.needLogin/.test(FN), '운영 benchDetailPass 떼어 냄(로그인 필요 상품 갈래 있음)');

function mkFS() { const S = {}; const col = (name) => { S[name] = S[name] || {}; const T = S[name];
  const ref = (id) => ({ id, get: async () => ({ exists: id in T, data: () => (T[id] ? JSON.parse(JSON.stringify(T[id])) : undefined) }), set: async (v, o) => { T[id] = o && o.merge && T[id] ? { ...T[id], ...v } : { ...v }; }, collection: (c) => col(`${name}/${id}/${c}`) });
  return { doc: ref }; };
  const db = { batch: () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops.splice(0)) await f(); } }; } };
  return { S, col, db }; }

async function run({ gate = 25, plain = 15, errAll = false, tgateAt = -1, M0 = null }) {
  const F = mkFS(); const sc = '9200001';
  /* 숍 상품 칸 꼴: [값, 올린 날, 등급, …, v[6]=사라짐, v[7]=ISBN, v[8]=분류, v[9]=출간, v[10]=상품 페이지 정보(0 아직 · 1 읽음 · 2 못 읽음)] — 최근 올린 것이 차례 앞 */
  const M = M0 || {}; if (!M0) { for (let i = 0; i < gate; i++) M[String(3000000 + i)] = [5000, '20261113', '상', 1, '19금책' + i, 0, 0, null, null, null, 0]; for (let i = 0; i < plain; i++) M[String(4000000 + i)] = [5000, '20261001', '상', 1, '책' + i, 0, 0, null, null, null, 0]; }
  await F.col('bench_state').doc(sc).set({ sc, chunks: 1, detailRedo1113: '2026-11-13T00:00:00Z' });
  await F.col('bench_state').doc(sc).collection('c').doc('0').set({ s: JSON.stringify(M), n: Object.keys(M).length, fmt: 'json' });
  const order = []; let tg = 0; const logs = [];
  const benchBook = async (id) => { order.push(id); if (tgateAt >= 0 && order.length > tgateAt) throw Object.assign(new Error('테더링 문 닫힘'), { tgate: true });
    if (errAll) throw new Error('인터넷 끊김'); if (id.startsWith('3')) throw Object.assign(new Error('로그인 없이는 못 보는 화면(19금 등) — 계정과 떼어 두는 중이라 이 장은 건너뜀'), { needLogin: true });
    return { isbn: '979' + id, cat: '국내도서>소설', pubYm: '2026-10' }; };
  const sb = { console, JSON, Date, Math, Object, Array, String, Number, Set, Map, Promise, isFinite, parseInt, setTimeout, Error,
    C: (n) => F.col(n), db: F.db, W: () => ({}), nowIso: () => new Date().toISOString(), kDayB: () => '2026-11-13', log: (m) => logs.push(String(m)), ui: () => {}, stopFlag: false,
    BREG: () => ({ BENCH: { DETAIL_DEF: { max: 1000, maxMin: 30 } } }), BENCH_CFG: {}, benchNetQuota: () => ({ ok: true }), benchBook };
  sb.globalThis = sb; vm.createContext(sb); vm.runInContext(FN + '\n;globalThis.__f = benchDetailPass;', sb);
  const r = await sb.__f([{ sc, name: '가게A' }], { capped: false });
  const out = JSON.parse(F.S['bench_state/9200001/c']['0'].s); return { r, out, order, logs, items: F.S.bench_items || {} };
}

(async () => {
  console.log('① 맨 앞 25개가 19금 — 멈추지 않음');
  { const { r, out, order, logs, items } = await run({});
    ok(!r.stop, '멈춤 없음(예전엔 20번째에서 「상품 화면 20번 연달아 못 받음」으로 멈춤)', r);
    ok(order.length === 40 && r.tried === 40 && r.filled === 15, '40개 모두 열어 봄 · 뒤 15개 채움', { n: order.length, r });
    ok(Object.keys(out).filter((k) => k.startsWith('3')).every((k) => out[k][10] === 2), '19금 25개 = 못 읽음(2 — 다음 바퀴 맨 뒤)');
    ok(Object.keys(out).filter((k) => k.startsWith('4')).every((k) => out[k][10] === 1 && out[k][7] === '979' + k), '나머지 15개 = 읽음(1) · ISBN 채움');
    ok(Object.keys(items).length === 15, '상품 정보 저장(bench_items) 15개 — 19금은 저장 없음', Object.keys(items).length);
    ok(!r.errN && !r.err, '19금은 오류 수(errN)에 세지 않음', r);
    ok(logs.some((l) => /로그인 없이는 못 보는 상품 25개는 맨 뒤 차례로/.test(l)), "끝 줄에 '로그인 없이는 못 보는 상품 25개는 맨 뒤 차례로'", logs.filter((l) => /끝:/.test(l))); }

  console.log('② 다른 오류는 예전대로');
  { const { r, out } = await run({ errAll: true });
    ok(/상품 화면 20번 연달아 못 받음 — 인터넷 끊김/.test(r.stop || ''), '19금이 아닌 오류 20번 연달아 → 멈춤(예전대로)', r);
    ok(Object.values(out).every((v) => v[10] === 0), "열다 난 오류는 '못 읽음'으로 적지 않음(다음에 다시)"); }
  { const { r, out } = await run({ tgateAt: 5 });
    ok(r.stop === '테더링 문 닫힘' && r.tried === 6, '테더링 문(tgate)은 그 자리에서 멈춤', r);
    ok(Object.keys(out).filter((k) => out[k][10] === 2).length === 5, '닫히기 전 19금 5개만 2', Object.values(out).map((v) => v[10]).join('')); }

  console.log('③ 다음 바퀴 — 19금은 맨 뒤');
  { const M = {}; for (let i = 0; i < 3; i++) M[String(3000000 + i)] = [5000, '20261113', '상', 1, '19금책' + i, 0, 0, null, null, null, 2]; for (let i = 0; i < 3; i++) M[String(4000000 + i)] = [5000, '20261001', '상', 1, '책' + i, 0, 0, null, null, null, 0];
    const { order } = await run({ M0: M });
    ok(order.slice(0, 3).every((id) => id.startsWith('4')) && order.slice(3).every((id) => id.startsWith('3')), '아직 안 읽은 것 먼저 · 못 읽음(2)은 맨 뒤', order); }

  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과 — tDETGATE1113');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
