// tSPFB1111 — 11/11 engfix1 → ttb1: 수요 지수 매일 표본(spPanelTick) — 알라딘 OpenAPI(TTB)가 2026-10-30에 끝나 TTB는 묻지 않음(헛호출 0) · ① 시장 지표(36시간 안) ② 남은 책은 알라딘 공개 상품 화면 · 못 채우면 sp_panel.err · 매입 통계 날짜별 줄(tl) · 진단에 날짜별 연구 문서
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
const run = async (FS, http, pub) => { const f = new Function('C', 'db', 'nowIso', 'W', 'FV', 'extKeysC', 'extHttp', 'sleep', 'extUsedAddC', 'log', 'getPage', 'alPubItem', 'TTB_END', 'TTB_END_MSG', src.slice(i0, i1) + '\nreturn spPanelTick;')(FS.C, FS.db, () => new Date().toISOString(), W, FV, async () => ({ aladinTtb: 'K' }), http, async () => {}, () => {}, () => {}, async () => ({ fake: 1 }), pub, '2026-10-30', '알라딘 OpenAPI(TTB) 종료(2026-10-30)'); return f(); };
(async () => {
  const hh = new Date(Date.now() + 9 * 3600e3).getUTCHours(); if (hh < 4) { console.log('  (한국 4시 전이라 회차가 쉼 — 시험 건너뜀)'); console.log('✓ tSPFB1111 통과'); return; }
  const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const I = Array.from({ length: 12 }, (_, i) => '97900000000' + String(10 + i));
  const F = mkFS(); F.D.app_settings = { sp_panel: { isbns: I } }; F.D.prd_books = {}; F.D.prd_book_metrics = {};
  I.forEach((x, i) => { F.D.prd_books['bk_' + i] = { isbn13: x }; if (i < 8) F.D.prd_book_metrics['bk_' + i] = { salesPoint: 100 + i, priceSales: 9000, lastCheckedAt: i < 6 ? new Date().toISOString() : '2020-01-01T00:00:00Z' }; });
  let nHttp = 0; const http = async () => { nHttp++; return { text: JSON.stringify({ errorCode: 999, errorMessage: 'x' }) }; }; const asked = [];
  const pub = async (p, o) => { asked.push(o.isbn); const k = I.indexOf(o.isbn); return k >= 6 && k <= 8 ? { salesPoint: 77, priceSales: 8000, stockStatus: '', isbn13: o.isbn } : k === 9 ? { gate: 1 } : k === 10 ? { salesPoint: null } : null; };
  const r = await run(F, http, pub);
  const v = F.D.sp_daily[day].v; const P = F.D.app_settings.sp_panel;
  ok(nHttp === 0, '(ttb1) TTB는 한 번도 묻지 않음 — 헛호출 0', nHttp);
  ok(r.fb === 6 && v[I[0]][0] === 100 && v[I[0]][3] === 'mkt' && asked.length === 6 && !asked.includes(I[0]), '① 36시간 안 시장 지표가 있는 6권은 시장 지표로(출처 mkt · 공개 화면 안 읽음)', { r, v0: v[I[0]], asked });
  ok(r.pg === 3 && v[I[6]][0] === 77 && v[I[6]][3] === 'pg' && v[I[7]][0] === 77 && v[I[9]][0] == null && v[I[9]][2] === 'gate' && v[I[10]][2] === 'nosp' && v[I[11]][2] === 'none', '② 남은 책은 알라딘 공개 상품 화면(출처 pg) — 오래된 시장 지표(7·8번)도 화면으로 · 19금(gate)·SP 없음·못 찾음은 비움', { r, v6: v[I[6]], v9: v[I[9]] });
  ok(P.err === null && P.ttbEnded === '2026-10-30' && /공개 상품 화면/.test(P.src) && P.ttbBadSince === null && F.D.sp_daily[day].fromPage === 3 && F.D.sp_daily[day].fromMkt === 6, "채웠으면 err 없음 · '알라딘 OpenAPI 종료 → 대체 출처' 표시 · 출처별 수", P);
  const F2 = mkFS(); F2.D.app_settings = { sp_panel: { isbns: I.slice(0, 3), ttbBadSince: '2026-11-01' } }; F2.D.prd_books = {}; F2.D.prd_book_metrics = {};
  const r2 = await run(F2, http, async () => { throw new Error('화면 막힘'); });
  ok(r2.fb === 0 && r2.pg === 0 && /모두 못 채움/.test(F2.D.app_settings.sp_panel.err || '') && F2.D.app_settings.sp_panel.errAt && nHttp === 0, '시장 지표·공개 화면 모두 못 채우면 sp_panel.err에 남김(아무도 모르게 비지 않음)', F2.D.app_settings.sp_panel);
  ok(!/ttb\/api|ItemLookUp\.aspx|ItemSearch\.aspx|ItemList\.aspx/.test(src), '클라우드 어디에도 TTB 주소가 없음');
  ok(/const TL = \{\};/.test(src) && /tl: Object\.values\(TL\)\.sort/.test(src), '매입 통계에 날짜별 [끝난 날, 신청 등급, 보냄, 매입] 줄(tl) — R12 채점 재료');
  ok(/\|y24_mkt(\|wx_sum)?\|ml_oop_study\|ml_sp_obs\|ml_buyback_stats\)\\\/\[A-Za-z0-9_\\-\.\]\+\$\/\.test\(p0\)/.test(src), '진단이 날짜별 연구 문서(ml_oop_study·ml_sp_obs·ml_buyback_stats)를 읽음 — 엔진이 지난 판으로 바로 채점');
  console.log(bad ? `❌ tSPFB1111 실패 ${bad}` : '✓ tSPFB1111 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
