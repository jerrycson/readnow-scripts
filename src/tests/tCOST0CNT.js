// tCOST0CNT — (cost0cnt 11/20 · buyp1 뒤이음) 클라우드 진단 cost0cnt: 매입 연결 「예전 0원」(cost 0 + costZero 없음) 수 · 판매 중 · 🐢 천천히 내리기 멈춘 수
//   ① 그 진단 묶음이 읽기만(쓰기 함수 0 · 고객 정보 crm_ 안 읽음)
//   ② 지어낸 견본(손님 정보 없음 · Firestore 안 씀)으로 돌려 개수가 맞음
//  쓰는 법: node tCOST0CNT.js
const fs = require('fs'), path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const up = (f) => { for (const d of ['..', '../..', '../../..']) { const p = path.join(__dirname, d, f); if (fs.existsSync(p)) return p; } return null; };
const src = fs.readFileSync(up('cloud/index.js'), 'utf8');
const a = src.indexOf('      if (q.cost0cnt) {'); const b = src.indexOf('      if (q.samp) {', a); const blk = a >= 0 && b > a ? src.slice(a, b) : '';
console.log('— ① 읽기만');
ok(blk.length > 500, '진단 묶음 cost0cnt를 찾음', blk.length);
ok(!/\.(update|add|delete|create)\(|batch\(|runTransaction|FV\./.test(blk) && !/(?<!\b(LS|SH|own))\.set\(/.test(blk), '쓰기 함수 0(set·update·add·delete·batch·트랜잭션 — 메모리 Map만 set)');
ok(!/crm_|app_secrets|title|phone|addr/.test(blk.replace(/\/\*[\s\S]*?\*\//g, '')), '고객 정보·제목 칸 안 읽음');
console.log('— ② 지어낸 견본으로 셈');
const PM = { L1: { kind: 'auto', cost: 0 }, L2: { kind: 'auto', cost: 0 }, L3: { kind: 'auto', cost: 0, costZero: true }, L4: { kind: 'auto' }, L5: { kind: 'auto', cost: 1200 }, L6: { kind: 'none', cost: 0 }, L7: { kind: 'auto', cost: '0' }, L8: { kind: 'auto', cost: '' } };
const old = new Date(Date.now() - 100 * 864e5).toISOString();
const LS = { L1: { status: '판매중', active: true, qty: 1, registeredAt: old }, L2: { status: '판매완료', active: false, qty: 0 }, L4: { status: '판매중', qty: 1, registeredAt: old }, L7: { status: '일시판매중지', qty: 1 }, L5: { status: '판매중', qty: 1 } };
const SETS = { 'app_settings/strat': { on: true, as: { A1: { k: 'decay', t: 'g', tid: 'G1', mode: 'auto' }, A2: { k: 'floor', t: 'i', tid: 'L5' } } }, 'app_settings/stock_groups': { g: { G1: { ids: ['L1', 'L4', 'L5', 'L9'] } } }, 'app_settings/strat_run': { lastRun: '2026-11-20T00:00:00Z' } };
const STR = { SH: 2 }; const mtH = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
const why = { L1: '매입가를 몰라 내리지 않음(손해 막기)', L4: '매입가를 몰라 내리지 않음(손해 막기)', L5: '이미 1위' }; const SHD = [{}, {}]; for (const [lid, w] of Object.entries(why)) SHD[mtH(lid, 2)][lid] = { k: 'decay', why: w };
const snap = (id, v) => ({ id, exists: v != null, data: () => v });
const C = (c) => ({ orderBy: () => { const q = { _after: null, select: () => q, limit: () => q, startAfter: (d) => { q._after = d; return q; }, get: async () => { const docs = q._after ? [] : Object.entries(c === 'pur_matches' ? PM : {}).map(([id, v]) => snap(id, v)); return { size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } }; return q; },
  doc: (id) => ({ _c: c, _id: id, get: async () => c === 'strat_items' ? snap(id, { m: SHD[+id.slice(1)] }) : snap(id, SETS[c + '/' + id] || null) }) });
const db = { getAll: async (...refs) => { refs = refs.filter((r) => r && r._c); return refs.map((r) => snap(r._id, r._c === 'prd_listings' ? LS[r._id] || null : null)); } };
const run = new Function('q', 'out', 'C', 'db', 'FieldPath', 'STR', 'mtH', 'return (async () => {' + blk + '})();');
(async () => { const out = {}; await run({ cost0cnt: '1' }, out, C, db, { documentId: () => '__id' }, STR, mtH); const r = out.cost0cnt || {};
  ok(r.ok === true, '돌아감', r.err);
  ok(r.pm && r.pm.total === 8 && r.pm.old0 === 3 && r.pm.real0 === 1 && r.pm.blank === 2 && r.pm.pos === 1 && r.pm.none === 1, '예전 0 = 3(L1·L2·L7) · 진짜 0 = 1 · 빈칸 = 2 · 값 있음 = 1 · 연결 없음 = 1', r.pm);
  ok(r.old && r.old.selling === 1 && r.old.paused === 1 && r.old.gone === 0 && r.old.listed === 3, '예전 0 중 판매 중 1 · 일시판매중지 1', r.old);
  ok(JSON.stringify(r.oldSellSamp) === '["L1"]', '판매 중 표본 = 상품 번호만', r.oldSellSamp);
  ok(r.decay && r.decay.assigned === 3 && r.decay.old0 === 1 && r.decay.old0Stop === 1 && r.decay.blankStop === 1 && r.decay.stopAll === 2, '🐢 배정 3(L5는 상품 직접 🛡 배정이 먼저) · 예전 0으로 멈춤 1 · 빈칸으로 멈춤 1', r.decay);
  ok(r.strat && r.strat.decayAs.length === 1 && r.strat.decayAs[0].n === 3 && r.strat.on === true, '🐢 배정 목록(그룹 4 중 🐢 몫 3)', r.strat);
  ok(r.stopSamp && r.stopSamp.length === 1 && r.stopSamp[0].lid === 'L1' && r.stopSamp[0].regD >= 99 && !('title' in r.stopSamp[0]), '멈춘 표본 = 상품 번호·상태·등록 날 수만', r.stopSamp);
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tCOST0CNT 모두 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌', e.stack); process.exit(1); });
