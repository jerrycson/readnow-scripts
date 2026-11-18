// tCTRLIMP1_1118 — (ctrlimp1 · 설계 ctrldes1 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 가(뼈대·늦게 계산)·판 나(줄 동작)
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 전화번호 모양 없음 · 「모두」 줄 칸·상태판 머리 → 관제창 · bqCtx only(일부만 계산) · 이음새(BQ_TABACT·bqPxGate·bqTabsOf) 부름
//  ② 흉내 실행(vm): 열 때 계산 0번 · 탭 40장만 계산 · 더 보기 · 400줄 상한 · 설정 기본값(lazy all · doneChg mark) · 확정 탭만 설정이면 다른 탭은 그룹 전체 · −5%/+5% · 결정 대기로(바닥 검사·잠금 다시 읽음) · 보류·빼기·선택 대기로·확정 취소가 같은 그룹 문서 칸에 씀 · 낡은 목록 표시 · ⑤ 판정
// 실행: node tCTRLIMP1_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const i0 = T.indexOf('/* ◆ctrl 시작'), i1 = T.indexOf('/* ◆ctrl 끝 */'); const BLK = i0 > 0 && i1 > i0 ? T.slice(i0, i1) : '';
console.log('① 글');
ok(!!BLK, '◆ctrl 덩이가 있음');
{ const names = ['CTRL_PAGE', 'CTRL_DEF', 'ctrlCfg', 'ctrlCfgSet', 'ctrlLazy', 'ctrlTabNm', 'ctrlKids', 'openBkfCtrl', 'ctrlKey', 'ctrlClose', 'ctrlKeys', 'ctrlOnTb', 'ctrlReset', 'ctrlCtx', 'ctrlLoad', 'ctrlChg', 'ctrlCard', 'ctrlPaint', 'ctrlInput', 'ctrlFind', 'ctrlClick', 'ctrlAct', 'ctrlPickMany'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(BLK), '브라우저 창 없음(확인은 두 번 누름 twiceArm)'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(BLK), '전화번호 모양 없음');
ok(!/\.delete\(\)\s*;?\s*$/m.test(BLK.replace(/FV\.delete\(\)/g, '')) && !/collection\('prd_price_batches'\)/.test(BLK), '그룹 문서를 지우지 않음(칸만 batchSave)');
ok(/function bkfTbAll\(fid, tab\) \{ return openBkfCtrl\(fid, tab \|\| 'done'\); \}/.test(T) && /data-bkfctrl="1"/.test(T) && /ctrlOnTb\(gid\); \} \}/.test(T), '「모두」 줄 칸·📊 상태판 머리 → 관제창 · 상태판이 그룹을 다 세면 ctrlOnTb');
ok(/const rows = opt\.only \? rows0\.filter\(\(l\) => opt\.only\.has\('aladin_' \+ l\.usedCode\)\) : rows0;[^\n]*const R = batchCompute\(c, rows\)/.test(T), 'bqCtx only = 계산 전에 그 열쇠들만 남김(계산기는 그대로)');
ok(/BQ_TABACT\(/.test(BLK) && /bqPxGate\(/.test(BLK) && /plkFreshMany\(/.test(BLK) && /bkfLkOf\(/.test(BLK) && /bkfCancelDec\(/.test(BLK) && /bkfRun\(fid, 'pickAll', tab\)/.test(BLK), '이음새 부름 — 탭 동작 BQ_TABACT · 바닥 검사 bqPxGate · 잠금 다시 읽음 · 확정 취소 bkfCancelDec · 탭 전체 bkfRun');
ok(/twiceArm\(t, '이 그룹에서 빼기'/.test(BLK) && /twiceArm\(t, `고른 \$\{L\.length\}개 → 결정 대기로`/.test(BLK) && /v === 'auto' && twiceArm\(/.test(BLK), '빼기·고른 것 보내기·자동 취소 설정은 두 번 누름');
ok(/Escape/.test(BLK) && /popstate/.test(BLK) && /e\.target === ov/.test(BLK), '닫기: Esc·뒤로·바깥 누름');
ok(/max-width:600px\)\{#bkf_ctrl \.bigask\.bkf-ctrl\{width:100vw/.test(T), '휴대폰 꽉 찬 창 꾸밈');

console.log('② 흉내 실행');
const mkEl = () => { const el = { _l: {}, innerHTML: '', id: '', className: '', addEventListener(t, f) { this._l[t] = f; }, querySelector: () => null, remove() { delete DOM[this.id]; } }; return el; };
const DOM = {}; const TOASTS = []; const SAVES = []; let NCTX = 0, NFULL = 0;
const N = 500; const plist = new Map(); const cls = new Map(); const cls2 = new Map();
for (let i = 0; i < N; i++) { const k = 'aladin_U9' + String(i).padStart(6, '0'); plist.set(k, { usedCode: k.slice(7), title: '시험 책 ' + i, price: 10000 + i * 10, grade: '상', status: '판매중' }); cls.set(k, i < 450 ? 'sel' : i < 470 ? 'keep' : 'done'); }
for (let i = 0; i < 30; i++) { const k = 'aladin_U8' + String(i).padStart(6, '0'); plist.set(k, { usedCode: k.slice(7), title: '둘째 그룹 책 ' + i, price: 5000, grade: '중', status: '판매중' }); cls2.set(k, 'sel'); }
const docs = { g1: { picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {} }, g2: { picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {} } };
const now0 = new Date().toISOString(); for (const [k, t] of cls) if (t === 'done') docs.g1.decided[k] = { price: 9000, at: now0, by: 't@x' };
const S = { plist, prCfg: {}, user: { email: 't@x' }, bkfold: {}, prBatches: [{ id: 'g1', name: '그룹 하나' }, { id: 'g2', name: '그룹 둘' }], _bkfTb: { g1: { cls, lm: now0 }, g2: { cls: cls2, lm: now0 } } };
const FV = { delete: () => ({ __del: 1 }), arrayUnion: (...a) => ({ __au: a }) };
const SRVm = new Map(); for (const [k, d] of Object.entries(docs.g1.decided)) SRVm.set(k, { approvalState: 'manual', approval: { at: d.at } });
const bqCtx = async (gid, opt) => { NCTX++; const st = JSON.parse(JSON.stringify(docs[gid])); const C0 = gid === 'g1' ? cls : cls2; const keys = [...C0.keys()].filter((k) => !opt.only || opt.only.has(k)); if (!opt.only) NFULL++; if (opt.cnt) opt.cnt.n = (opt.cnt.n || 0) + keys.length;
  const R = keys.map((k) => { const l = plist.get(k); const i = +l.usedCode.slice(2); return { l, target: C0.get(k) === 'keep' ? null : C0.get(k) === 'done' ? (i % 2 ? 9000 : 8500) : l.price - 500 }; });
  return { st, R, SRV: gid === 'g1' ? SRVm : new Map(), sold: { set: new Set() }, keyOf: (x) => 'aladin_' + x.l.usedCode }; };
const ctx = { S, console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, parseInt, Promise, Error,
  db: { collection: () => ({ doc: () => ({ set: async (v) => { SAVES.push(['cfg', v]); } }) }) }, firebase: { firestore: { FieldValue: FV } },
  document: { getElementById: (id) => DOM[id] || null, createElement: () => mkEl(), body: { appendChild: (el) => { DOM[el.id] = el; } }, addEventListener() {}, removeEventListener() {} },
  window: { ReadnowPricing: { snapDown: (v) => Math.floor(v / 100) * 100, snapUp: (v) => Math.ceil(v / 100) * 100 }, addEventListener() {}, removeEventListener() {} },
  history: { pushState() {} }, CSS: { escape: (s) => s }, toast: (m, e) => TOASTS.push([m, e || 0]), num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원', kTime: (s) => s, kMs: (v) => Date.parse(v) || 0,
  BKF_STALE_H: 72, BKF_BULK: { sel: 'pickAll', lot: 'pickAll', pick: 'execAll' }, BQ_TABACT: (k) => ({ sel: { edit: 1 }, keep: { edit: 1, chk: 'toSel', need: 1 }, few: { edit: 1, chk: 'fewsel' } })[k] || {},
  bkfTbCols: () => [['sel', '선택 대기'], ['pick', '결정 대기'], ['done', '확정'], ['keep', '추천 못 함'], ['hold', '보류'], ['trash', '휴지통']], bkfNorm: () => ({ folds: { f1: { gids: ['g1', 'g2'] } } }), bkfGl: (g) => S.prBatches.find((x) => x.id === g) || null,
  bqCls: (x, c) => { const k = 'aladin_' + x.l.usedCode; if (c.st.trashed[k]) return 'trash'; if (c.st.held[k]) return 'hold'; if (c.st.picks[k]) return 'pick'; if (c.st.decided[k]) return 'done'; return (x.l.usedCode.startsWith('U8') ? cls2 : cls).get(k); },
  bkfDirty: () => {}, errKo: (e) => String((e && e.message) || e), bkfTabP: (x, T) => (T === 'keep' ? null : x.target != null ? Math.round(x.target) : null), plkOn: () => false, bkfItemWhy: () => null, bkfSIdx: () => null, batchIsOn: () => true, bkfName: () => '시험 묶음', bkfTbPaint() {}, openBatchGroup() {},
  twiceArm: () => 'go', bkfRun: async () => {}, batchSave: async (gid, p) => { SAVES.push([gid, p]); }, bkfGlSet() {}, plkFreshMany: async () => new Map(), bkfLkOf: (x, M, k) => M.get(k) || null,
  bqPxGate: (x, v) => (!(+v >= 10) ? (x && x.target == null ? '추천가가 없는 상품' : '가격이 없음') : ''), bqFewOf: () => '유효 상품 2개', bkfCancelDec: async () => [true, ''] };
vm.createContext(ctx); vm.runInContext(BLK + '\n;this.__C = { openBkfCtrl, ctrlLoad, ctrlClick, ctrlAct, ctrlCfg, ctrlChg, ctrlPickMany, CTRL_PAGE, CTRL_CAP };', ctx);
const C = ctx.__C; const P = () => S._bkfCtrl; const tick = () => new Promise((r) => setTimeout(r, 0)); const settle = async () => { for (let i = 0; i < 50 && P() && P().load; i++) await tick(); await tick(); };
(async () => {
  ok(C.ctrlCfg().lazy === 'all' && C.ctrlCfg().doneChg === 'mark', '설정 기본값 = 늦게 계산 모든 탭 · 표시와 취소 단추');
  NCTX = 0; ctx.bqCtx = bqCtx;
  vm.runInContext('openBkfCtrl("f1", "sel")', ctx); const k0 = P().keys.length; ok(NCTX <= 1 && P().cnt.n <= 40 && k0 === 480 && /ctrlKeys\(\); ctrlPaint\(\); ctrlLoad\(\);/.test(BLK), '열 때 탭 수·열쇠 목록은 상태판 셈(cls)에서(계산 없이 먼저 그림) · 그 뒤 첫 쪽만 계산 · sel 480개(두 그룹)', { NCTX, k0 });
  await settle(); ok(P().rows.length === 40 && P().cnt.n === 40, '탭 앞 40장만 계산(계산한 상품 40)', { rows: P().rows.length, n: P().cnt.n });
  for (let i = 0; i < 12; i++) { await C.ctrlLoad(); await settle(); }
  ok(P().rows.length === 400 && P().fold === 80 && P().pos === 480, '더 보기 → 400줄 상한 · 앞 80장 접음', { r: P().rows.length, f: P().fold, pos: P().pos });
  // 탭 바꾸기 — 줄 버리고 새 탭 40장
  await C.ctrlClick({ target: { closest: (s) => (s === 'button' ? { dataset: { ctab: 'keep' }, disabled: false } : null) } }); await settle();
  ok(P().tab === 'keep' && P().rows.length === 20 && P().fold === 0, '탭을 바꾸면 앞 탭 줄은 버리고 새 탭만(추천 못 함 20)');
  // 추천 못 함 — 가격 없이 결정 대기 막힘 · 넣으면 감 · −5%/+5%
  const it = P().rows[0]; SAVES.length = 0; TOASTS.length = 0; const r1 = await C.ctrlAct(it, 'pick');
  ok(r1 === false && !SAVES.length && /추천가가 없는/.test(TOASTS[0][0]), '추천가 없는 상품은 가격을 넣어야 결정 대기(bqPxGate)', TOASTS);
  P().val.set(it.id, ''); await C.ctrlClick({ target: { closest: (s) => (s === 'button' ? { dataset: { cstep: '-1', cid: it.id }, disabled: false } : null) } });
  const lp = it.x.l.price; ok(+P().val.get(it.id) === Math.floor(lp * 0.95 / 100) * 100, '−5% (빈 칸이면 지금 판매가 바탕 · snapDown)', P().val.get(it.id));
  await C.ctrlClick({ target: { closest: (s) => (s === 'button' ? { dataset: { cstep: '1', cid: it.id }, disabled: false } : null) } });
  const v2 = +P().val.get(it.id); ok(v2 >= Math.floor(lp * 0.95 / 100) * 100 * 1.05 - 1 && v2 % 100 === 0, '+5% (snapUp)', v2);
  const r2 = await C.ctrlAct(it, 'pick'); const sv = SAVES[0]; ok(r2 && sv[0] === 'g1' && sv[1].picks[it.k].price === v2 && sv[1].picks[it.k].via === 'ctrl', '결정 대기로 → 그 그룹 picks 칸 · 기록 via ctrl', sv);
  // 잠금 — 누르는 순간 다시 읽어 막음
  const it2 = P().rows[1]; P().val.set(it2.id, '7000'); ctx.plkFreshMany = async (ks) => new Map(ks.map((k) => [k, { on: 1 }])); SAVES.length = 0; TOASTS.length = 0;
  ok((await C.ctrlAct(it2, 'pick')) === false && !SAVES.length && /잠긴/.test(TOASTS[0][0]), '잠긴 상품은 보내지 않음(plkFreshMany 다시 읽음)'); ctx.plkFreshMany = async () => new Map();
  // 보류·빼기·선택 대기로 — 같은 그룹 문서 칸
  SAVES.length = 0; await C.ctrlAct(P().rows[2], 'hold'); await C.ctrlAct(P().rows[3], 'trash'); await C.ctrlAct(P().rows[4], 'tosel');
  const [h, tr, ts] = SAVES.map((s) => s[1]); ok(h.held && h.held[P().rows[2].k].from === 'keep' && h.listLog && tr.trashed && tr.trashed[P().rows[3].k] && ts.fewsel[P().rows[4].k].p === Math.floor(P().rows[4].x.l.price * 0.95 / 100) * 100 && ts.fewsel[P().rows[4].k].from === 'keep', '보류 held · 빼기 trashed · 선택 대기로 fewsel(5% 내린 값 p) — 그룹 화면과 같은 칸', SAVES);
  // 확정 탭 — ⑤ 판정 · 확정 취소 → 결정 대기
  await C.ctrlClick({ target: { closest: (s) => (s === 'button' ? { dataset: { ctab: 'done' }, disabled: false } : null) } }); await settle();
  const chg = P().rows.filter((x) => x.chg); ok(P().rows.length === 30 && chg.length === 15 && chg[0].chg.from === 9000 && chg[0].chg.to === 8500, '⑤ 반영 전 확정인데 지금 추천이 다름 → 표시(30 중 15)', { n: P().rows.length, c: chg.length, z: chg[0] && chg[0].chg });
  SAVES.length = 0; await C.ctrlAct(chg[0], 'cancel'); const cs = SAVES[0][1]; ok(cs.decided[chg[0].k].__del && cs.picks[chg[0].k].price === 9000 && cs.undone[chg[0].k].undoneAt, '확정 취소 → decided 지움 · 같은 값으로 picks · undone 기록', cs);
  // 설정 자동 취소 — 보는 순간 저절로
  S.prCfg.ctrlCfg = { doneChg: 'auto' }; SAVES.length = 0; vm.runInContext('openBkfCtrl("f1", "done")', ctx); await settle(); for (let i = 0; i < 40; i++) await tick();
  ok(SAVES.filter((s) => s[1].undone).length === 15, '설정 「자동 취소」 = 확정 탭을 볼 때 바뀐 15개를 저절로 취소', SAVES.length);
  // 설정 확정 탭만 — 다른 탭은 그룹 전체 계산
  S.prCfg.ctrlCfg = { lazy: 'done' }; NFULL = 0; vm.runInContext('openBkfCtrl("f1", "sel")', ctx); await settle();
  ok(NFULL === 1 && P().pre.has('g1') && P().cnt.n === 500 && P().rows.length === 40, '설정 「확정 탭만」 = 다른 탭은 그 그룹 전체를 한 번 계산해 둠(쪽은 40장씩)', { NFULL });
  S.prCfg.ctrlCfg = {};
  // 낡은 목록 — 다른 탭으로 옮겨진 것 표시
  docs.g1.held[[...cls.keys()][0]] = { at: now0 }; vm.runInContext('openBkfCtrl("f1", "sel")', ctx); await settle();
  ok(P().rows[0].moved === 'hold', '계산해 보니 다른 탭이면 「방금 다른 탭으로 옮겨짐」(moved)', P().rows[0].moved);
  // 고른 것 한꺼번에 — 그룹마다 한 번씩 씀
  SAVES.length = 0; const L = P().rows.slice(1, 6); await C.ctrlPickMany(P(), L); ok(SAVES.length === 1 && Object.keys(SAVES[0][1].picks).length === 5, '고른 5개 → 그룹마다 한 번 씀', SAVES.map((s) => s[0]));
  ok(!TOASTS.some((t) => /undefined|NaN/.test(t[0])), '알림 글에 undefined·NaN 없음', TOASTS.slice(-3));
  console.log(bad ? `❌ tCTRLIMP1_1118 ${bad}개 실패` : '✓ tCTRLIMP1_1118 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 흉내 실행 오류', e && e.stack); process.exit(1); });
