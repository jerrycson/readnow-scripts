// tCTRLIMP2_MA — (ctrlimp2 · 설계 CTRLDES1 6.2·6.3·2.3 · CTRLDES2 1.3·1.6·3.2 · 정범님 11/18 23:44 결정 ③ㄴ) 🗼 묶음 관제창 판 마 — 📌 상품 개별 설정 · 📈 가격 변동 기록 · 까닭 한 줄
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 가격 결정 문서를 쓰지 않음 · 계산 세 길(관제창·그룹 화면·선택 대기 셈)에 걸림 · 설명서 문단
//  ② 개별 설정(vm): 바닥값은 추천을 올리기만 · 개별 조건은 같은 계산기를 다시 부름(가격 칸만) · 그룹을 옮겨도 따라감 · 되돌리기는 칸만 지우고 기록에 남음 · 정가 넘는 바닥값 막음
//  ③ 기록(vm): 그룹·반영·결정·전략·개별 설정 기록을 때 차례로 합침 · 주인 표시 · 까닭 한 줄 차례
// 실행: node tCTRLIMP2_MA.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음(저장은 흉내)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 마 · ctrlimp2'), m1 = T.indexOf('function ctrlPaint() {'); const MA = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
console.log('① 글');
ok(!!MA, '판 마 덩이가 있음');
{ const names = ['CTRL_PCK', 'CTRL_PLOG', 'ctrlPerRef', 'ctrlPerMap', 'ctrlPerLoad', 'ctrlPerCk', 'ctrlPerCond', 'ctrlPerApply', 'ctrlPerFix', 'ctrlPerSave', 'ctrlPerTxt', 'ctrlPerDraft', 'ctrlPerOf', 'ctrlPerChk', 'ctrlPerPv', 'ctrlPerPanel', 'CTRL_OWN', 'ctrlOwnOf', 'ctrlHistLocal', 'ctrlHist', 'ctrlHistSort', 'ctrlHistBox', 'ctrlWhy', 'ctrlPerClick'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(MA), '브라우저 창 없음');
ok(!/prd_price_decisions|bkfCancelDec|\.update\(\s*\{\s*price/.test(MA), '가격 결정 문서·확정 취소·가격 쓰기 없음');
ok((MA.match(/db\.collection\('prd_price_batches'\)\.doc\('_bkfc'\)/g) || []).length === 1 && /tx\.set\(ref, \{ per:/.test(MA), '쓰는 곳은 개별 설정 문서 _bkfc 하나뿐');
ok(/ctrlPerFix\(c, R0\)/.test(T) && /ctrlPerFix\(c, R1\)/.test(T) && /ctrlPerFix\(c, batchCompute\(c, part\)\)/.test(T), '관제창·그룹 화면·선택 대기 셈 모두 같은 개별 설정을 얹음');
ok(/data-chist=/.test(T) && /data-cper=/.test(T) && /ctrlWhy\(it\)/.test(T), '카드에 📈 기록 · ⚙ 개별 · 까닭 한 줄');
ok(/twiceArm\(t, '개별 설정 저장'/.test(MA) && /twiceArm\(t, '그룹 설정으로 되돌리기'/.test(MA), '저장·되돌리기는 두 번 누름');
ok(/📌 개별 설정·📈 기록·까닭 한 줄 \(판 마\)/.test(T), '설명서 문단');

// ② vm — 계산기는 흉내(조건 pct만큼 내린 값 · 사람이 보는 까닭 한 줄)
const CALLS = [];
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error,
  firebase: { firestore: { FieldValue: { delete: () => ({ __del: 1 }) } } },
  num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', kMs: (v) => (typeof v === 'number' ? v : Date.parse(v) || 0), kTime: (s) => String(s).slice(0, 16), errKo: (e) => String(e && e.message),
  plkOn: (k) => ctx.LK.has(k), LK: new Set(), toast: () => {}, bkfDirty: (g) => ctx.DIRTY.push(g), DIRTY: [],
  batchCondNorm: (c) => c, batchCompute: (c, rows) => { CALLS.push(c); return rows.map((l) => ({ l, target: Math.round(l.price * (1 - (+c.pct || 0) / 100)), reasons: [`조건 ${c.pct}%`] })); } };
const DOC = { per: {}, log: [] }; let writes = [];
ctx.db = { collection: (n) => ({ doc: (id) => ({ __p: n + '/' + id, get: async () => ({ exists: true, data: () => JSON.parse(JSON.stringify(DOC)) }) }), where: (f, op, v) => ({ limit: () => ({ get: async () => { const L = (ctx.QS[n] || []).filter((r) => r[f] === v); return { forEach: (fn) => L.forEach((r) => fn({ data: () => r })) }; } }) }) }),
  runTransaction: async (fn) => fn({ get: async (ref) => ({ exists: true, data: () => JSON.parse(JSON.stringify(DOC)) }), set: (ref, v, o) => { writes.push([ref.__p, v, o]); for (const [k, x] of Object.entries(v.per)) { if (x && x.__del) delete DOC.per[k]; else DOC.per[k] = x; } DOC.log = v.log; } }) };
ctx.QS = {}; ctx.S = { user: { email: 't@x' }, _ctrlPer: null };
vm.createContext(ctx);
vm.runInContext(MA + '\n;this.__M = { ctrlPerLoad, ctrlPerFix, ctrlPerApply, ctrlPerSave, ctrlPerOf, ctrlPerChk, ctrlPerPv, ctrlPerTxt, ctrlHist, ctrlHistLocal, ctrlWhy, ctrlOwnOf, ctrlHistSort };', ctx);
const M = ctx.__M;
const L = (i, price, o) => ({ usedCode: 'U8' + i, title: '시험 책 ' + i, price, ...(o || {}) });
(async () => {
  console.log('② 개별 설정');
  const c = { pct: 10, minPrice: 1000 };
  await M.ctrlPerLoad(true);
  let R = M.ctrlPerFix(c, ctx.batchCompute(c, [L(1, 10000), L(2, 10000)]));
  ok(R[0].target === 9000 && !R[0].per, '개별 설정이 없으면 그대로');
  const it1 = { k: 'aladin_U81', gid: 'g1', id: 'g1|aladin_U81', x: { l: L(1, 10000, { priceList: 12000 }), target: 9000 }, C: { c, st: {}, g: {} } };
  writes = []; await M.ctrlPerSave(it1, { floor: 9500 }, '귀한 판본');
  ok(writes.length === 1 && writes[0][0] === 'prd_price_batches/_bkfc' && writes[0][2] && writes[0][2].merge, '저장은 _bkfc 한 문서에 merge', writes);
  ok(DOC.log.length === 1 && DOC.log[0].unit === 'item' && DOC.log[0].prev === null && DOC.log[0].next.floor === 9500 && DOC.log[0].why === '귀한 판본', '기록에 앞·뒤·까닭', DOC.log);
  ok(ctx.DIRTY.includes('g1'), '상태판 다시 셈 표시');
  R = M.ctrlPerFix(c, ctx.batchCompute(c, [L(1, 10000), L(2, 10000)]));
  ok(R[0].target === 9500 && R[0].perFloor && R[0].perFloor.from === 9000 && /개별 바닥값/.test(R[0].reasons[0]), 'PER_FLOOR 바닥값 밑으로는 추천 안 함(올림)', R[0]);
  ok(R[1].target === 9000 && !R[1].per, '다른 상품은 그대로');
  const hi = M.ctrlPerFix(c, ctx.batchCompute({ pct: 0 }, [L(1, 10000)]));
  ok(hi[0].target === 10000 && !hi[0].perFloor, '바닥값은 올리기만 — 추천이 더 높으면 그대로');
  const c2 = { pct: 30 }; const R2 = M.ctrlPerFix(c2, ctx.batchCompute(c2, [L(1, 10000)]));
  ok(R2[0].target === 9500, 'PER_FOLLOW 다른 그룹(다른 조건)으로 옮겨도 같은 상품 열쇠면 따라감');
  // 개별 조건 — 같은 계산기를 그룹 조건 위에 가격 칸만 덮어 다시 부름
  CALLS.length = 0; await M.ctrlPerSave(it1, { cond: { pct: 50, colors: ['x'] } }, '');
  ok(DOC.log.length === 2 && DOC.log[1].prev && DOC.log[1].prev.floor === 9500, '덮어쓴 저장도 앞 값을 기록');
  const o2 = M.ctrlPerApply(c, { l: L(1, 10000), target: 9000, reasons: [] }, { cond: { pct: 50, rubbish: 1, recentDays: 3 } });
  const last = CALLS[CALLS.length - 1];
  ok(o2.target === 5000 && last.pct === 50 && last.minPrice === 1000 && last.rubbish === undefined && last.recentDays === undefined && /개별 조건\(pct\)/.test(o2.reasons[0]), '개별 조건 = 가격 칸만 덮고 같은 계산기(batchCompute)를 다시 부름', [o2, last]);
  ok(JSON.stringify(M.ctrlPerTxt('pct=20\nmode="x"\nrecentDays=3\n엉뚱')) === JSON.stringify({ pct: 20, mode: 'x' }), '칸=값 줄은 가격 칸만 받음');
  const D = { floor: '13000', watch: 'off', chase: '', strat: 'group', why: '', txt: '', c_pct: '15', c_mode: '', c_minPrice: '', c_maxDrop: '', c_maxRise: '', c_dir: '', c_newPct: '' };
  const o3 = M.ctrlPerOf(D); ok(o3.floor === 13000 && o3.watch === 'off' && o3.cond.pct === 15 && !('strat' in o3) && !('chase' in o3), '패널 초안 → 설정(비운 칸은 그룹대로)', o3);
  ok(/정가/.test(M.ctrlPerChk(it1, o3) || ''), '정가보다 높은 바닥값은 막음');
  ok(M.ctrlPerChk(it1, { floor: 11000 }) === null, '정가 안 바닥값은 통과');
  const pv = M.ctrlPerPv(it1, { floor: 9800 }); ok(pv && pv.from === 9000 && pv.to === 9800, '미리 보기 = 같은 계산 길의 지금 추천 → 바꾼 뒤', pv);
  // 되돌리기
  writes = []; await M.ctrlPerSave(it1, null, '그룹 설정으로 되돌림');
  ok(!DOC.per['aladin_U81'] && writes[0][1].per['aladin_U81'].__del && DOC.log.length === 3 && DOC.log[2].next === null && DOC.log[2].prev && DOC.log[2].prev.cond, '되돌리기 = 개별 칸만 지움 · 기록에 남음', DOC.log[2]);
  ok(!writes.some((w) => /price|decision/.test(w[0].replace('prd_price_batches', ''))), '가격·결정 문서는 안 건드림');
  R = M.ctrlPerFix(c, ctx.batchCompute(c, [L(1, 10000)])); ok(R[0].target === 9000 && !R[0].per, '되돌린 뒤 그룹 설정대로');

  console.log('③ 기록·까닭');
  ctx.QS = { prd_price_actions: [{ key: 'aladin_U81', at: '2026-11-10T03:00:00Z', by: 'price-watch:PC1', from: 11000, to: 10000 }],
    prd_price_reviews: [{ key: 'aladin_U81', at: '2026-11-12T03:00:00Z', by: 'a@x', decision: 'batch', price: 9000, batchName: '그룹 하나' }],
    strat_log: [{ lid: 'aladin_U81', at: '2026-11-11T03:00:00Z', act: 'price', from: 10000, to: 9800, mode: 'auto', why: '시장 따라감' }, { lid: 'aladin_X', at: '2026-11-11T03:00:00Z', act: 'price' }] };
  const it2 = { ...it1, C: { c, st: { start: { U81: 12000 }, picks: {}, decided: { aladin_U81: { price: 9000, at: '2026-11-13T03:00:00Z', by: 'a@x' } }, held: {}, trashed: {} }, g: { createdAt: '2026-11-01T00:00:00Z', listLog: [{ at: '2026-11-09T00:00:00Z', by: 'a@x', k: 'aladin_U81', t: '⏸ 보류', via: 'ctrl' }, { at: '2026-11-09T00:00:00Z', k: 'aladin_Y', t: '남의 것' }] } } };
  const P = { hist: new Map() }; ctx.ctrlPaint = () => {}; ctx.S._bkfCtrl = P;
  const B = await M.ctrlHist(P, it2); const ats = B.rows.map((r) => r.at);
  ok(B.rows.length === 9 && !B.busy && !B.err, 'HIST 그룹 시작·확정·그룹 기록·반영·결정·전략·개별 설정 기록 3줄을 모두 모음(남의 상품은 뺌)', B.rows.map((r) => r.what));
  ok(JSON.stringify(ats) === JSON.stringify([...ats].sort((a, b) => Date.parse(a) - Date.parse(b))), 'HIST 때 차례', ats);
  const own = Object.fromEntries(B.rows.map((r) => [r.src, r.own])); ok(own['반영 기록'] === 'watch' && own['전략 기록'] === 'strat' && own['결정 기록'] === 'human' && own['그룹'] === 'human' || own['그룹'] === 'sys', '주인 표시(🛰 감시기 · ⚡ 전략 · 🧑 사람)', own);
  ok(M.ctrlOwnOf('chase-bot', '') === 'chase', '🎯 추격자 표시');
  const mk = (o) => ({ k: 'aladin_U81', x: { l: L(1, 10000), target: 9000, reasons: ['조건 10%'], ...(o.x || {}) }, C: { st: { picks: {}, decided: {}, ...(o.st || {}) }, SRV: new Map(o.srv || []), sold: { set: new Set(o.sold || []) }, g: o.g || {} } });
  ok(/^까닭: 그룹 조건 추천/.test(M.ctrlWhy(mk({}))), 'WHY 아무것도 없으면 그룹 조건 추천');
  ok(/^까닭: 🛰 그룹 감시 · 밀린 것: 그룹 조건 추천/.test(M.ctrlWhy(mk({ g: { watch: { on: true } } }))), 'WHY 감시 > 조건 추천');
  ok(/^까닭: 📌 개별 바닥값 9500원 · 밀린 것: 🎯 추격 중/.test(M.ctrlWhy(mk({ x: { perFloor: { from: 9000, to: 9500 } }, srv: [['aladin_U81', { strat: { active: true } }]] }))), 'WHY 바닥값 > 추격');
  ok(/^까닭: 🧑 사람이 확정/.test(M.ctrlWhy(mk({ st: { decided: { aladin_U81: { price: 9000, at: new Date().toISOString() } } }, x: { memo: 1 } }))), 'WHY 7일 안 사람 > 메모');
  ctx.LK.add('aladin_U81'); ok(/^까닭: 🔒 가격 잠금 · 밀린 것: 🧑/.test(M.ctrlWhy(mk({ st: { picks: { aladin_U81: { price: 1 } } } }))), 'WHY 잠금 > 사람');
  ok(/^까닭: 🏷 팔림·주문 있음 · 밀린 것: 🔒/.test(M.ctrlWhy(mk({ sold: ['aladin_U81'] }))), 'WHY 팔림 > 잠금'); ctx.LK.clear();
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 예외', e && e.stack); process.exit(1); });
