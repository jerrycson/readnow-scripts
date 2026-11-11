// tSPFB1111 — 11/11 engfix1: 수요 지수 매일 표본(spPanelTick)이 공식 조회 전부 실패(오류 999 · 11/01부터)일 때 ① sp_panel.err·ttbBadSince에 남김 ② 시장 지표(36시간 안)로 채움 · 매입 통계 날짜별 줄(tl) · 진단에 날짜별 연구 문서
// 실행: cd pw && node tSPFB1111.js (../cloud/index.js) · 가짜 Firestore · 가짜 응답 · 지어낸 값만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOT = path.join(__dirname, '..'); const src = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const i0 = src.indexOf('async function spPanelTick()'); const i1 = src.indexOf('setInterval(() => spPanelTick()', i0); ok(i0 > 0 && i1 > i0, 'spPanelTick 있음');
const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); const cp = (v) => JSON.parse(JSON.stringify(v));
  const Q = (n, fl) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]]), select: () => Q(n, fl), get: async () => { const docs = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => (op === 'in' ? x.includes(v[k]) : v[k] === x))).map(([id, v]) => ({ id, exists: true, data: () => cp(v) })); return { docs, forEach: (f) => docs.forEach(f) }; } });
  const C = (n) => ({ ...Q(n, []), doc: (id) => ({ _n: n, _id: id, get: async () => ({ exists: !!col(n)[id], data: () => (col(n)[id] ? cp(col(n)[id]) : undefined) }), set: async (v, o) => { const v2 = JSON.parse(JSON.stringify(v, (k, x) => (x && x.__inc != null ? x.__inc : x))); col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...v2, ...(v2.v && (col(n)[id] || {}).v ? { v: { ...col(n)[id].v, ...v2.v } } : {}) } : v2; } }) });
  const db = { getAll: async (...refs) => Promise.all(refs.map((r) => C(r._n).doc(r._id).get())) }; return { D, C, db }; };
const FV = { increment: (n) => ({ __inc: n }) }; const W = () => ({ writer: 'cloud' });
const run = async (FS, http) => { const f = new Function('C', 'db', 'nowIso', 'W', 'FV', 'extKeysC', 'extHttp', 'sleep', 'extUsedAddC', 'log', src.slice(i0, i1) + '\nreturn spPanelTick;')(FS.C, FS.db, () => new Date().toISOString(), W, FV, async () => ({ aladinTtb: 'K' }), http, async () => {}, () => {}, () => {}); return f(); };
(async () => {
  const hh = new Date(Date.now() + 9 * 3600e3).getUTCHours(); if (hh < 4) { console.log('  (한국 4시 전이라 회차가 쉼 — 시험 건너뜀)'); console.log('✓ tSPFB1111 통과'); return; }
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const I = Array.from({ length: 12 }, (_, i) => '97900000000' + String(10 + i));
  const F = mkFS(); F.D.app_settings = { sp_panel: { isbns: I } }; F.D.prd_books = {}; F.D.prd_book_metrics = {};
  I.forEach((x, i) => { F.D.prd_books['bk_' + i] = { isbn13: x }; if (i < 8) F.D.prd_book_metrics['bk_' + i] = { salesPoint: 100 + i, priceSales: 9000, lastCheckedAt: i < 6 ? new Date().toISOString() : '2020-01-01T00:00:00Z' }; });
  const r = await run(F, async () => ({ text: JSON.stringify({ errorCode: 999, errorMessage: 'x' }) }));
  const v = F.D.sp_daily[day].v; const P = F.D.app_settings.sp_panel;
  ok(r.ok === 0 && r.fb === 6 && v[I[0]][0] === 100 && /^mkt /.test(v[I[0]][2]) && v[I[7]][0] == null && v[I[11]][0] == null, '공식 조회 모두 실패 → 36시간 안 시장 지표가 있는 6권만 채움(오래된 것·없는 것은 비움) · 출처 mkt', { r, v0: v[I[0]], v7: v[I[7]] });
  ok(/모두 실패\(err999\)/.test(P.err) && P.ttbBadSince === day && P.errAt, '실패를 sp_panel.err·ttbBadSince에 남김(예전엔 늘 null)', P);
  const F2 = mkFS(); F2.D.app_settings = { sp_panel: { isbns: I.slice(0, 3), ttbBadSince: '2026-11-01' } };
  const r2 = await run(F2, async () => ({ text: JSON.stringify({ item: [{ salesPoint: 55, priceSales: 1000, stockStatus: '' }] }) }));
  ok(r2.ok === 3 && r2.fb === 0 && F2.D.app_settings.sp_panel.err === null && F2.D.app_settings.sp_panel.ttbBadSince === null && F2.D.sp_daily[day].v[I[0]][0] === 55, '공식 조회가 되면 그대로(시장 지표 안 씀) · 실패 표시 지움', F2.D.app_settings.sp_panel);
  ok(/const TL = \{\};/.test(src) && /tl: Object\.values\(TL\)\.sort/.test(src), '매입 통계에 날짜별 [끝난 날, 신청 등급, 보냄, 매입] 줄(tl) — R12 채점 재료');
  ok(/\|y24_mkt\|ml_oop_study\|ml_sp_obs\|ml_buyback_stats\)\\\/\[A-Za-z0-9_\\-\.\]\+\$\/\.test\(p0\)/.test(src), '진단이 날짜별 연구 문서(ml_oop_study·ml_sp_obs·ml_buyback_stats)를 읽음 — 엔진이 지난 판으로 바로 채점');
  console.log(bad ? `❌ tSPFB1111 실패 ${bad}` : '✓ tSPFB1111 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
