// tBENCHCUT1_1120 — (benchcut1 11/20) 📶 벤치마킹 몫 줄임 · 브라우저 필요 없음
//  정범님 11/20 11:59 「주요 판매자들은 건드리지 말고, 나머지에 한해서 몫을 전부 숍 트랙킹을 끊지 않는 조건으로, 몫을 줄여봐」
//  ① 클라우드 한 번 고침 benchCut1120 — 부가 그룹(g1112_s0~s6)만 숍 전체 14일에 한 번 · 주요 10곳(g1112_main) 그대로 · 예전 light 떠 둠 · 한 번만 · 12월 예전대로
//  ② 등록부 차례 — 14일에 한 번인 부가 판매자: 숍 전체 뒤 7일째는 새 상품만(매일 읽음 그대로) · 14일째(−4시간)에 숍 전체 · 주요는 날마다 숍 전체
// 실행: node src/tests/tBENCHCUT1_1120.js · 시험 자료는 모두 지어낸 값(가게 번호 9200001…) · 쓰기 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const REG = require(path.join(ROOT, 'readnow-registry.js'));
const grab = (name) => { const i = SRC.indexOf('async function ' + name + '()'); if (i < 0) return null; let d = 0, j = SRC.indexOf('{', i); for (let k = j; k < SRC.length; k++) { if (SRC[k] === '{') d++; else if (SRC[k] === '}' && --d === 0) return SRC.slice(i, k + 1); } return null; };
const fakeDb = (doc) => { const st = { doc: JSON.parse(JSON.stringify(doc)), sets: 0 }; const ref = {}; const db = { collection: () => ({ doc: () => ref }), runTransaction: async (fn) => fn({ get: async () => ({ data: () => st.doc }), set: (r, v, o) => { st.sets++; st.doc = o && o.merge ? { ...st.doc, ...v } : v; } }) }; return { db, st }; };
const mk = (name, dbo, nowMs) => { const body = grab(name); return new Function('db', 'nowIso', 'log', 'Date', body + '; return ' + name + ';')(dbo, () => new Date(nowMs).toISOString(), () => {}, class extends Date { constructor(...a) { if (a.length) super(...a); else super(nowMs); } static now() { return nowMs; } }); };
const all = [0, 1, 2, 3, 4, 5, 6];
const base = { targets: [{ sc: '9200001', on: true }, { sc: '9200002', on: true }, { sc: '9200003', on: true }], groups: [{ id: 'g1112_main', name: '🎯 주요', unit: 'd', n: 1, sched: { mode: 'w', w: all }, scs: ['9200001'] }, { id: 'g1112_s2', name: '부가 · 화요일', unit: 'd', n: 1, sched: { mode: 'w', w: all }, light: { on: true, by: 'w', wd: [2], fullDays: 7 }, scs: ['9200002'] }, { id: 'g1112_s5', name: '부가 · 금요일', unit: 'd', n: 1, sched: { mode: 'w', w: all }, light: { on: true, by: 'w', wd: [5], fullDays: 7 }, scs: ['9200003'] }] };

(async () => {
  console.log('① 클라우드 한 번 고침');
  ok(/const VER = '0\.35\.\d+';.*\(0\.35\.\d+ benchcut1\)/.test(SRC), '클라우드 판 설명에 benchcut1');
  ok(/setTimeout\(benchCut1120,/.test(SRC) && /setTimeout\(benchCutEnd1120,/.test(SRC), '켤 때·매시간 돎');
  const T0 = Date.parse('2026-11-20T05:00:00Z'); const { db, st } = fakeDb(base);
  await mk('benchCut1120', db, T0)(); const D = st.doc; const g = (id) => D.groups.find((x) => x.id === id);
  ok(JSON.stringify(g('g1112_main')) === JSON.stringify(base.groups[0]), '주요 10곳 그룹은 한 글자도 그대로', g('g1112_main'));
  ok(g('g1112_s2').light.by === 'd' && g('g1112_s2').light.fullDays === 14 && g('g1112_s2').light.on === true && g('g1112_s5').light.fullDays === 14, '부가 그룹 숍 전체 14일에 한 번(새 상품만 읽기는 켜진 채)', D.groups);
  ok(g('g1112_s2').lightPrev1120 && g('g1112_s2').lightPrev1120.by === 'w' && g('g1112_s2').lightPrev1120.wd[0] === 2, '예전 light(매주 화요일) 떠 둠', g('g1112_s2'));
  ok(g('g1112_s2').scs.join() === '9200002' && D.targets.length === 3 && D.benchCut1120 && D.benchCut1120.n === 2, '판매자·따라가기 목록 그대로 · 기록 n=2', D.benchCut1120);
  const s1 = st.sets; await mk('benchCut1120', db, T0 + 3600e3)(); ok(st.sets === s1, '두 번째에는 아무것도 안 씀(한 번만)');
  const f2 = fakeDb(base); await mk('benchCut1120', f2.db, Date.parse('2026-12-01T01:00:00Z'))(); ok(f2.st.sets === 0, '12월(KST)에는 줄이지 않음');
  await mk('benchCutEnd1120', db, T0 + 864e5)(); ok(st.doc.groups.find((x) => x.id === 'g1112_s2').light.fullDays === 14, '11월 안에는 되돌리지 않음');
  await mk('benchCutEnd1120', db, Date.parse('2026-11-30T15:30:00Z'))(); const E = st.doc; const e2 = E.groups.find((x) => x.id === 'g1112_s2');
  ok(e2.light.by === 'w' && e2.light.wd[0] === 2 && e2.light.fullDays === 7 && !('lightPrev1120' in e2) && E.benchCut1120.endAt, '12/1(KST) 0시 넘어 예전대로(매주 화요일) · 떠 둔 칸 지움', E);
  ok(JSON.stringify(E.groups.find((x) => x.id === 'g1112_main')) === JSON.stringify(base.groups[0]), '되돌릴 때도 주요 그룹 그대로');

  console.log('② 등록부 차례(수집기·웹앱이 같이 씀)');
  const cfg = { ...base, groups: D.groups }; const full = Date.parse('2026-11-17T03:00:00Z');
  const st0 = { '9200001': { day: '2026-11-19', runAt: '2026-11-19T00:10:00Z', endAt: '2026-11-19T03:00:00Z', completeEndAt: '2026-11-19T03:00:00Z' }, '9200002': { day: '2026-11-17', runAt: '2026-11-17T00:10:00Z', endAt: new Date(full).toISOString(), completeEndAt: new Date(full).toISOString(), lightAt: '2026-11-23T01:00:00Z' } };
  const at = (iso) => { const P = REG.BENCH.plan(cfg, st0, Date.parse(iso)); return Object.fromEntries(P.map((p) => [p.sc, p.mode])); };
  ok(at('2026-11-24T00:30:00Z')['9200002'] === 'light', '숍 전체 7일 뒤(예전엔 화요일 숍 전체) → 새 상품만', at('2026-11-24T00:30:00Z'));
  ok(at('2026-11-30T23:30:00Z')['9200002'] === 'full', '14일째(−4시간) → 숍 전체', at('2026-11-30T23:30:00Z'));
  ok(at('2026-11-24T00:30:00Z')['9200001'] === 'full', '주요 판매자는 날마다 숍 전체 그대로');
  if (bad) { console.log(`❌ 실패 ${bad}`); process.exit(1); } console.log('✓ 통과 — tBENCHCUT1_1120');
})().catch((e) => { console.log('❌', e && e.stack); process.exit(1); });
