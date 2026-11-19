// tCTRLIMP2_RA — (ctrlimp2 · 설계 CTRLDES1 7절 · CTRLDES2 0장·1.10 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 라(+하) — 🔁 자동 재편성
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 결정 문서(prd_price_decisions)·확정 취소(bkfCancelDec)를 쓰지 않음 · 설정 칸 · 설명서 문단
//  ② 7일 안 확정 추천 바뀜(vm · 진짜 bqCls): 늘 표시만(설정 move여도 · 정범님 I-1120-0051-01) · 확정 탭 그대로 · 감시 「바로 반영」 한도 안/밖 · 잠김·보류·휴지통·반영 중·수동·결정 대기·추격 중·막힘·같은 값·7일 지남은 건드리지 않음 · 앞 확정 그대로 두기
//  ③ 재편성 셈(vm): 탭 옮김 · 사람이 누른 동작·확정 쪽 움직임은 안 셈 · 그룹 옮김 두 차례 모두 · 빠짐 · 하루 한 줄 기록 · 계기가 몰려도 다시 세기 한 번
// 실행: node tCTRLIMP2_RA.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음(저장은 흉내)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const r0 = T.indexOf('/* (판 라(+하) · ctrlimp2'), r1 = T.indexOf('/* 카드 하나 — 그룹 화면 카드와 같은 동작 칸'); const RA = r0 > 0 && r1 > r0 ? T.slice(r0, r1) : '';
const line = (re) => { const m = T.match(re); return m ? m[0] : ''; };
console.log('① 글');
ok(!!RA, '판 라 덩이가 있음');
{ const names = ['bqReoMv', 'CTRL_RC', 'ctrlReoBox', 'ctrlReoAdd', 'ctrlReorgSeen', 'ctrlReoOf', 'ctrlReoDone', 'ctrlReoLog', 'ctrlReoBar', 'ctrlReoLine'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(RA), '브라우저 창 없음');
ok(!/prd_price_decisions|bkfCancelDec|db\.collection/.test(RA), '결정 문서·확정 취소를 쓰지 않음(그룹 문서 decided[k].reo·listLog만)');
ok(/reoDone: 'move'/.test(T) && !/data-ccfg="reoDone:move"/.test(T) && /🔁 표시만 — 확정 탭에 그대로/.test(T), '설정 = 표시만(옛 값 move는 코어와 같게 두되 화면 고름 없음 · 정범님 I-1120-0051-01)');
ok(/await ctrlReorgSeen\(gid, prev, C0, sig\)/.test(T), '상태판 다시 셀 때 재편성 셈');
ok(/data-breo=/.test(T) && /a === 'unreo'/.test(T) && /data-brep=/.test(T) && /a === 'redec'/.test(T), '그룹 화면·관제창 모두 「그대로 둠」·「다시 결정 대기로」(사람만)');
ok(/🔁 자동 재편성 \(판 라\)/.test(T), '설명서 문단');

const mkS = () => ({ user: { email: 't@x' }, prCfg: {}, bkfold: {}, _bkfTb: {}, _bkfCtrl: null, prBatches: [{ id: 'g1', name: '그룹 하나' }, { id: 'g2', name: '그룹 둘' }] });
const TM = []; let tid = 0; const fakeT = (f) => { const i = ++tid; TM.push({ i, f }); return i; }; const clearT = (i) => { const j = TM.findIndex((t) => t.i === i); if (j >= 0) TM.splice(j, 1); };
const runT = async () => { while (TM.length) { const t = TM.shift(); await t.f(); } };
const W = []; const PAINT = [];
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error, setTimeout: fakeT, clearTimeout: clearT,
  firebase: { firestore: { FieldValue: { arrayUnion: (...a) => ({ __au: a }), delete: () => ({ __del: 1 }) } } },
  num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', kMs: (v) => Date.parse(v) || 0, kstDay: (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10),
  bkfOf: () => 'f1', bkfNorm: () => ({ folds: { f1: { gids: ['g1', 'g2'] } } }), bkfGl: (g) => ctx.S.prBatches.find((x) => x.id === g) || null,
  ctrlKids: () => ctx.S.prBatches, ctrlCfg: () => ({ reoDone: 'move', ...ctx.CF }), CF: {},
  bqFewOf: () => '', bbNearX: () => null, lotCheck: () => false, plkOn: (k) => ctx.LK.has(k), LK: new Set(), bkfItemWhy: (x) => x.why || null, bkfSIdx: () => null,
  bkfTabP: (x, k, C) => (k === 'done' ? Math.round(C.st.decided[C.keyOf(x)].price) : x.target),
  bkfTbSum: (C) => { const c = { st: C.st, SRV: C.SRV, sold: C.sold.set }; const cls = new Map(); for (const x of C.R) cls.set(C.keyOf(x), ctx.bqCls(x, c)); return { cls }; },
  bkfGlSet: (gid, p) => W.push(['gl', gid, p]), batchSave: async (gid, p) => { W.push(['save', gid, p]); }, ctrlPaint: () => PAINT.push('ctrl'), bkfTbPaint: (f) => PAINT.push('tb:' + f), bkfPaintMarks() {} };
ctx.S = mkS(); vm.createContext(ctx);
vm.runInContext([line(/const bqReoMv = [^\n]*/), line(/\nfunction bqCls\([^\n]*/), line(/\nfunction bkfDirty\([^\n]*/), RA].join('\n') + '\n;this.__R = { bqCls, bqReoMv, bkfDirty, ctrlReoBox, ctrlReorgSeen, ctrlReoOf, ctrlReoDone, ctrlReoLog, ctrlReoBar, ctrlReoLine };', ctx);
const R = ctx.__R; const now = Date.now(); const iso = (ms) => new Date(ms).toISOString();
const K = (i) => 'aladin_U9' + String(i).padStart(6, '0'); const X = (i, target, o) => ({ l: { usedCode: K(i).slice(7), title: '시험 책 ' + i, price: 9000, status: '판매중' }, target, ...(o || {}) });
const mkC = (rows, dec, o) => { o = o || {}; const st = { picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {}, ...(o.st || {}) }; const SRV = new Map();
  for (const [i, d] of Object.entries(dec)) { const at = iso(now - (d.days || 2) * 864e5 + 3600e3); st.decided[K(i)] = { price: d.price || 9000, at, from: 10000 }; SRV.set(K(i), { approvalState: d.ap || 'done', approval: { at: d.badAt ? iso(now) : at }, ...(d.strat ? { strat: d.strat } : {}) }); }
  return { st, R: rows, SRV, sold: { set: new Set() }, keyOf: (x) => 'aladin_' + x.l.usedCode, g: { id: 'g1', ...(o.g || {}) } }; };

(async () => {
  console.log('② 7일 안 확정 추천 바뀜');
  { ctx.LK = new Set([K(2)]); W.length = 0;
    const rows = [X(1, 8000), X(2, 8000), X(3, 8000), X(4, 8000), X(5, 8000), X(6, 8000), X(7, 8000), X(8, 8000), X(9, 8000, { why: '시장 지표 72시간 넘음' }), X(10, 9000), X(11, 8000)];
    const C = mkC(rows, { 1: {}, 2: {}, 3: {}, 4: {}, 5: { ap: 'applying' }, 6: { ap: 'manual' }, 7: {}, 8: { strat: { active: true, nextAt: now + 3600e3 } }, 9: {}, 10: {}, 11: { days: 8 } },
      { st: { held: { [K(3)]: { at: iso(now) } }, trashed: { [K(4)]: { at: iso(now) } }, picks: { [K(7)]: { price: 8500, at: iso(now) } } } });
    const B = R.ctrlReoBox('fA'); const n = await R.ctrlReoDone('g1', C, B);
    const sv = W.filter((w) => w[0] === 'save'); const mv = (sv[0] || [])[2] || {};
    ok(n === 1 && sv.length === 1 && Object.keys(mv).length === 1 && Object.keys(mv.decided || {}).join() === K(1), '옮김은 1번만 · 저장은 그룹 문서 decided 한 번', { n, mv });
    const d1 = C.st.decided[K(1)]; ok(d1 && d1.price === 9000 && d1.from === 10000 && d1.reo && d1.reo.was === 9000 && d1.reo.p === 8000 && d1.reo.days === 2 && d1.reo.stay === 'mark' && /2일째/.test(d1.reo.why), '앞 확정 기록 그대로 + 🔁 표시(앞 값·새 추천·며칠째) · 설정 move여도 표시만', d1);
    ok(R.bqCls(rows[0], { st: C.st, SRV: C.SRV, sold: new Set() }) === 'done', '🔁 확정은 확정 탭에 그대로(사람 손 없이 선택 대기로 안 감)');
    ok(B.mv === 0 && B.ch === 1 && B.mk === 1, '추격 중 1개는 셈에서 뺌(🎯 따로 셈)', B);
    ok([['hold', 2], ['trash', 3], ['pick', 6]].every(([t, j]) => R.bqCls(rows[j], { st: C.st, SRV: C.SRV, sold: new Set() }) === t) && !C.st.decided[K(2)].reo && !C.st.decided[K(5)].reo && !C.st.decided[K(6)].reo && !C.st.decided[K(9)].reo && !C.st.decided[K(10)].reo && !C.st.decided[K(11)].reo, '잠김·보류·휴지통·결정 대기·반영 중·수동·막힘·같은 값·7일 지남은 건드리지 않음');
    ok((await R.ctrlReoDone('g1', C, B)) === 0, '한 번 표시한 확정은 다시 옮기지 않음');
    ok(R.ctrlReoLine(d1).includes('확정 9000원 · 지금 추천 8000원(2일째)') && R.ctrlReoLine({ price: 1 }) === '', '카드 🔁 줄 = 「확정 A원 · 지금 추천 B원(N일째)」', R.ctrlReoLine(d1));
    // 앞 확정 그대로 두기
    C.st.decided[K(1)] = { ...d1, reo: { ...d1.reo, stay: 'keep' } }; ok(R.bqCls(rows[0], { st: C.st, SRV: C.SRV, sold: new Set() }) === 'done' && R.ctrlReoOf(rows[0], K(1), C, { st: { ...C.st, picks: {}, decided: {} }, SRV: new Map(), sold: new Set() }, { now }) === null, '「앞 확정 그대로 두기」 = 확정 탭에 남고 다시 옮기지 않음');
    ok(R.ctrlReoLine(C.st.decided[K(1)]).includes('앞 확정 그대로 둠'), '그대로 둔 표시'); }
  { ctx.LK = new Set(); ctx.CF = { reoDone: 'mark' }; W.length = 0; const C = mkC([X(1, 8000)], { 1: {} }); const B = R.ctrlReoBox('fB'); await R.ctrlReoDone('g1', C, B);
    ok(C.st.decided[K(1)].reo.stay === 'mark' && R.bqCls(C.R[0], { st: C.st, SRV: C.SRV, sold: new Set() }) === 'done' && B.mk === 1 && B.mv === 0, '설정 「표시만」 = 확정 탭에 두고 표시만'); ctx.CF = {}; }
  { W.length = 0; const C = mkC([X(1, 8500), X(2, 6000)], { 1: {}, 2: {} }, { g: { watch: { on: true, apply: 'auto', guardPct: 15 } } }); const B = R.ctrlReoBox('fC'); await R.ctrlReoDone('g1', C, B);
    ok(C.st.decided[K(1)].reo.stay === 'auto' && C.st.decided[K(2)].reo.stay === 'mark' && B.mk === 2 && B.mv === 0, '감시 「바로 반영」 그룹 = 한도(15%) 안은 auto 표시 · 밖도 표시만(선택 대기로 안 옮김)', B); }
  { W.length = 0; const C = mkC([X(1, 8000)], { 1: {} }, { g: { viewOnly: true } }); ok((await R.ctrlReoDone('g1', C, R.ctrlReoBox('fD'))) === 0 && !W.length, '보기 전용 그룹은 쓰지 않음'); }
  { W.length = 0; const C = mkC([X(1, 8000)], { 1: { badAt: true } }); ok((await R.ctrlReoDone('g1', C, R.ctrlReoBox('fE'))) === 0, '반영 기록 시각이 다른 확정(다시 확정한 것)은 건드리지 않음'); }

  console.log('③ 재편성 셈');
  ctx.S = mkS(); W.length = 0; PAINT.length = 0; TM.length = 0;
  { const rows = [X(1, 8000), X(2, 9000), X(3, 8000), X(4, 8000)]; const C = mkC(rows, {}, { st: { fewsel: { [K(3)]: { at: iso(now) } } } });
    const prev = new Map([[K(1), 'sel'], [K(2), 'sel'], [K(3), 'few'], [K(4), 'pick'], [K(5), 'sel']]);
    ctx.S._bkfTb.g1 = ctx.bkfTbSum(C); ctx.S._bkfTb.g2 = { cls: new Map() }; await R.ctrlReorgSeen('g1', prev, C, 's');
    const B = ctx.S._ctrlReo.f1; ok(B.tab === 1 && (B.per.g1 || {})['sel→ok'] === 1, '시장이 바뀌어 옮긴 것만 탭 옮김(sel→ok 1)', B.per);
    ok(!(B.per.g1 || {})['few→sel'] && !(B.per.g1 || {})['pick→sel'], '사람이 선택 대기로 보낸 것·결정 대기에서 되돌린 것은 안 셈');
    ok(B.out === 1 && (B.per.g1 || {})['sel→빠짐'] === 1, '그룹에서 빠진 것 1', B);
    // 빠진 상품이 다른 그룹에 나타남(뒤 차례)
    const C2 = mkC([X(5, 8000)], {}); C2.g.id = 'g2'; const prev2 = new Map(); ctx.S._bkfTb.g2 = ctx.bkfTbSum(C2); await R.ctrlReorgSeen('g2', prev2, C2, 's');
    ok(B.out === 0 && B.grp === 1 && (B.per.g1 || {})['sel→📁그룹 둘'] === 1 && !(B.per.g1 || {})['sel→빠짐'], '빠짐 → 그룹 옮김으로 바뀜(다른 그룹이 뒤에 셈)', B.per);
    ok(PAINT.length === 0, '관제창이 닫혀 있으면 그리지 않음');
    // 기록 하루 한 줄
    await runT(); const lg = W.filter((w) => w[0] === 'save' && w[2].listLog); ok(lg.length === 1 && lg[0][1] === 'g1' && lg[0][2].listLog.__au[0].what === 'reorg' && /탭1·그룹1·빠짐0/.test(lg[0][2].listLog.__au[0].t), '기록 = 그룹마다 하루 한 줄(🔁 자동 재편성 탭·그룹·빠짐)', lg.map((x) => x[2].listLog));
    R.ctrlReoLog('f1'); await runT(); ok(W.filter((w) => w[0] === 'save' && w[2].listLog).length === 1, '같은 날 두 번째는 쓰지 않음(띠에만)');
    ok(/🔁 재편성 — 탭 옮겨짐 1 · 그룹 옮겨짐 1 · 빠짐 0/.test(R.ctrlReoBar({ fid: 'f1' })) && R.ctrlReoBar({ fid: 'none' }) === '', '관제창 띠'); }
  { ctx.S = mkS(); const C1 = mkC([], {}); const C2 = mkC([X(5, 8000)], {}); C2.g.id = 'g2'; ctx.S._bkfTb.g2 = ctx.bkfTbSum(C2); ctx.S._bkfTb.g1 = ctx.bkfTbSum(C1);
    await R.ctrlReorgSeen('g1', new Map([[K(5), 'lot']]), C1, 's'); const B = ctx.S._ctrlReo.f1; ok(B.grp === 1 && B.out === 0 && (B.per.g1 || {})['lot→📁그룹 둘'] === 1, '그룹 옮김(다른 그룹이 먼저 셈)', B); }
  { ctx.S = mkS(); const C = mkC([X(1, 8000)], { 1: {} }); ctx.S._bkfTb.g1 = ctx.bkfTbSum(C); const prev = new Map(ctx.S._bkfTb.g1.cls); W.length = 0;
    await R.ctrlReorgSeen('g1', prev, C, 's'); const B = ctx.S._ctrlReo.f1; ok(B.mv === 0 && B.mk === 1 && B.tab === 0 && ctx.S._bkfTb.g1.cls.get(K(1)) === 'done', '🔁 확정은 표시만 · 확정 탭 그대로(탭 옮김 0)', B);
    const p2 = new Map(ctx.S._bkfTb.g1.cls); await R.ctrlReorgSeen('g1', p2, C, 's'); ok(B.tab === 0 && B.mv === 0 && B.mk === 1, '다음 셈에서도 두 번 세지 않음', B); }
  { ctx.S = mkS(); ctx.S._bkfCtrl = { fid: 'f1' }; ctx.S._bkfTb.g1 = { cls: new Map() }; PAINT.length = 0; TM.length = 0; for (let i = 0; i < 12; i++) R.bkfDirty('g1');
    ok(TM.length >= 1, '다시 세기 예약'); await runT(); ok(PAINT.filter((p) => p === 'tb:f1').length === 1, '계기가 12번 몰려도 상태판 다시 세기는 한 번', PAINT); }
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e && e.stack); process.exit(1); });
