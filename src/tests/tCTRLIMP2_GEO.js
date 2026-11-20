// tCTRLIMP2_GEO — (ctrlimp2 · 설계 CTRLDES2 4 판 거 · 정범님 11/18 23:44 결정) 🗼 묶음 관제창 판 거 — 마지막 자리 기억 · 탭 정리 · 거름 칩 · 하한 까닭 · 🌅 밤사이 한 장 · 상태판 순서·낡은 지표 경고·그룹 이름 누름
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 판 거 덩이는 문서를 쓰지 않음(기기 기억만 · 모두 try 안) · 걸림 자리 · 좁은 폭 줄바꿈 · 설명서 문단
//  ② 셈(vm): 기억 왕복·30개 상한 · 기기 저장이 막혀도 정상으로 열림 · 탭 묶기·흐림 · 거름 · 하한 까닭 고르기 · 그룹 순서 · 낡은 지표 경고 · 밤사이 한 장
// 실행: node tCTRLIMP2_GEO.js · 실제 가격 바꾸기·확정 실행·저장 없음 · 판매자는 번호만(이름 없음)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 거 · ctrlimp2'), m1 = T.indexOf('/* (판 거) 끝 */'); const GEO = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
console.log('① 글');
ok(!!GEO, '판 거 덩이가 있음');
{ const names = ['CTRL_MEM_K', 'CTRL_TAB_MAIN', 'CTRL_OF', 'BKF_TBSORT', 'ctrlMemAll', 'ctrlMemGet', 'ctrlMemPut', 'ctrlGeoOpen', 'ctrlOfOk', 'ctrlOfHtml', 'ctrlTabsHtml', 'ctrlFloorWhy', 'ctrlAmSince', 'ctrlAmData', 'ctrlAmHtml', 'bkfTbSortOf', 'bkfTbSortSet', 'bkfTbOrd', 'bkfGeoTop'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(GEO), '브라우저 창 없음');
ok(!/db\.|batchSave|runTransaction|bkfGlSet|savePricingCfg|ctrlPerSave|\.update\(|\.set\(/.test(GEO), '판 거 덩이는 문서를 쓰지 않음(기기 기억만)');
{ const ls = GEO.split('\n').filter((l) => /localStorage\./.test(l)); ok(ls.length >= 3 && ls.every((l) => /try \{/.test(l)), '기기 저장은 모두 try 안', ls.length); }
ok(/function openBkfCtrl\(fid, tab, flt\)/.test(T) && /ctrlGeoOpen\(S\._bkfCtrl, tab, flt\)/.test(T), '여는 때 기억·거름을 받음');
ok(/ctrlMemPut\(P\); \} \/\* \(판 거\)/.test(T), '닫을 때 마지막 자리를 기억');
ok(/if \(P\.of && !ctrlOfOk\(P, g, k\)\) continue;/.test(T), '거름 칩은 열쇠 단계(계산 전)에서 거름');
ok(/const tch = ctrlTabsHtml\(P, cols, nOf\);/.test(T) && /\$\{ctrlOfHtml\(P\)\}/.test(T) && /ctrlAmHtml\(P\)/.test(T), '관제창 그림에 걸림');
ok(/d\.ctaball\)/.test(T) && /d\.cof\)/.test(T) && /d\.cam\)/.test(T), '누름에 걸림');
ok(/sub: ctrlFloorWhy\(f\)/.test(T) && /🏷 알라딘 매입가 하한/.test(T) && /K\.floor\.sub/.test(T), '하한 까닭이 미리 보기에');
ok(/bkfTbOrd\(fid, kids\)\.map/.test(T) && /bkfGeoTop\(fid, kids\)/.test(T) && /data-bkfcg="\$\{esc\(g\.id\)\}"/.test(T), '상태판 순서·경고·그룹 이름 누름');
ok(/\[data-bkfcg\],\[data-bkfsort\],\[data-bkfcold\]/.test(T) && /if \(t\.dataset\.bkfctrl\) return openBkfCtrl\(fid\);/.test(T), '상태판 누름 — 🗼 단추는 탭 없이 열어 마지막 자리로');
ok(/\.ctrl-tabs\{flex-wrap:wrap\}/.test(T) && /\.bkf-geo\{display:flex;flex-wrap:wrap/.test(T) && /\.ctrl-amr\{display:flex;flex-wrap:wrap/.test(T), '좁은 폭에서 줄바꿈(가로 넘침 없음)');
ok(/🗼 관제창 정리·🌅 밤사이 한 장 \(판 거\)/.test(T), '설명서 문단');

// ② vm
const now = Date.parse('2026-11-19T00:30:00Z'); // KST 11/19 09:30
const store = {}; let lsThrow = false;
const LS = { getItem: (k) => { if (lsThrow) throw new Error('막힘'); return k in store ? store[k] : null; }, setItem: (k, v) => { if (lsThrow) throw new Error('막힘'); store[k] = String(v); } };
const kstDay = (ms) => new Date(ms + 9 * 36e5).toISOString().slice(0, 10);
const ctx = { console, Map, Set, Date, Math, JSON, Object, String, Number, Array, isFinite, Promise, Error, Infinity, localStorage: LS, kstDay, kMs: (v) => (v ? Date.parse(v) : 0), num: (n) => String(n), esc: (s) => String(s), won: (n) => n + '원' };
const G = [{ id: 'g1', name: '그룹1', watch: { on: true } }, { id: 'g2', name: '그룹2' }, { id: 'g3', name: '그룹3', archived: true }, { id: 'g4', name: '그룹4', watch: { on: true } }];
ctx.S = { _bkfTb: { g1: { n: { pick: 2 }, lm: new Date(now - 30 * 36e5).toISOString(), cls: new Map([['aladin_1', 'pick'], ['aladin_2', 'sel']]) }, g2: { n: { pick: 9 }, lm: new Date(now - 2 * 36e5).toISOString(), cls: new Map([['aladin_3', 'pick']]) }, g4: { n: { pick: 0 }, lm: null, cls: new Map([['aladin_4', 'sel']]) } },
  prDec: new Map([['aladin_1', { chaser: { sc: '1' } }], ['aladin_2', { strat: { active: false } }]]), _ctrlPer: { at: 1, per: { aladin_3: { floor: 5000 }, aladin_4: { why: '메모만' } } } };
ctx.window = { ReadnowML: { fenceSum: (L) => ({ ops: L.ops, done: L.done }) } };
ctx.ctrlKids = () => G.filter((g) => !g.archived); ctx.bkfTbCols = () => [['sel', '선택'], ['pick', '결정'], ['done', '확정'], ['sold', '팔림'], ['few', '적음'], ['bb', '매입'], ['trash', '휴지통']];
ctx.ctrlPerLoad = () => Promise.resolve(ctx.S._ctrlPer); ctx.ctrlReset = () => {}; ctx.ctrlPaint = () => {}; ctx.ctrlLoad = () => {}; ctx.ctrlFireOf = () => null;
ctx.ctrlFoldKeys = () => new Set(['aladin_1', 'aladin_2', 'aladin_3']);
vm.createContext(ctx);
vm.runInContext(GEO + '\n;this.__M = { ctrlMemGet, ctrlMemPut, ctrlGeoOpen, ctrlOfOk, ctrlTabsHtml, ctrlFloorWhy, ctrlAmSince, ctrlAmData, ctrlAmHtml, bkfTbOrd, bkfTbSortSet, bkfGeoTop };', ctx);
const M = ctx.__M; const Pn = (o) => ({ fid: 'f1', tab: 'done', gf: null, sort: 'grp', of: null, keys: [], y: 0, ...o });
console.log('② 셈');
{ ok(M.ctrlMemPut(Pn({ tab: 'pick', of: 'chase', sort: 'title', gf: new Set(['g2']), y: 420 })), '기억 저장');
  const P = M.ctrlGeoOpen(Pn({}), undefined, undefined); ok(P.tab === 'pick' && P.of === 'chase' && P.sort === 'title' && P.gf && P.gf.has('g2') && P.y0 === 420, '탭 없이 열면 마지막 자리(탭·거름·정렬·그룹·스크롤)', { tab: P.tab, of: P.of, sort: P.sort, y0: P.y0 });
  const P2 = M.ctrlGeoOpen(Pn({ tab: 'sel' }), 'sel', undefined); ok(P2.tab === 'sel' && !P2.of && !P2.gf, '탭을 정해 열면 기억을 쓰지 않음');
  const P3 = M.ctrlGeoOpen(Pn({ tab: 'sel' }), 'sel', { gf: ['g1', 'zz'], of: 'woff' }); ok(P3.gf && P3.gf.size === 1 && P3.gf.has('g1') && P3.of === 'woff', '거름 인자 — 묶음 밖 그룹은 버림');
  M.ctrlMemPut(Pn({ fid: 'f9', tab: 'nope' })); const P4 = M.ctrlGeoOpen(Pn({ fid: 'f9' })); ok(P4.tab === 'done', '없는 탭 기억은 무시');
  for (let i = 0; i < 40; i++) { store[M.ctrlMemGet ? 'x' : 'x'] = ''; M.ctrlMemPut(Pn({ fid: 'q' + i })); } ok(Object.keys(JSON.parse(store['rn-ctrlmem'])).length === 30, '묶음 기억은 30개까지');
  store['rn-ctrlmem'] = '{깨짐'; ok(M.ctrlMemGet('f1') === null && M.ctrlGeoOpen(Pn({})).tab === 'done', '깨진 기억이면 기본값');
  lsThrow = true; let e1 = null; try { const P5 = M.ctrlGeoOpen(Pn({})); ok(P5.tab === 'done', '기기 저장이 막혀도 정상으로 열림'); ok(M.ctrlMemPut(Pn({})) === false, '막히면 기억만 못 함'); M.bkfTbSortSet('f1', 'pick'); ok(M.bkfTbOrd('f1', G).map((g) => g.id).join() === 'g2,g1,g4,g3', '막혀도 순서는 이 화면에서 바뀜'); } catch (e) { e1 = e; } ok(!e1, '막힘에서 예외 없음', e1 && e1.message); lsThrow = false; }
{ const nOf = (k) => ({ sel: 3, pick: 2, done: 0, sold: 1, few: 4, bb: 0, trash: 0 }[k]);
  const h = M.ctrlTabsHtml(Pn({ tab: 'pick' }), ctx.bkfTbCols(), nOf); const order = [...h.matchAll(/data-ctab="(\w+)"/g)].map((m) => m[1]);
  ok(order.join() === 'sel,pick,done,sold,few', '주요 넷이 앞 · 0인 다른 탭은 숨김', order); ok(/data-ctab="done">확정 0/.test(h) && /chip ctrl-z" data-ctab="done"/.test(h), '0인 주요 탭은 흐림', h.slice(0, 300)); ok(/더 보기 2/.test(h), '「더 보기 2」');
  const h2 = M.ctrlTabsHtml(Pn({ tab: 'bb' }), ctx.bkfTbCols(), nOf); ok(/data-ctab="bb"/.test(h2) && /더 보기 1/.test(h2), '지금 탭은 0이어도 보임');
  const h3 = M.ctrlTabsHtml(Pn({ tab: 'pick', tabAll: true }), ctx.bkfTbCols(), nOf); ok([...h3.matchAll(/data-ctab=/g)].length === 7 && /접기/.test(h3), '더 보기를 펴면 모두'); }
{ const g1 = G[0], g2 = G[1];
  ok(M.ctrlOfOk(Pn({ of: 'woff' }), g2, 'x') && !M.ctrlOfOk(Pn({ of: 'woff' }), g1, 'x'), '감시 꺼진 그룹만');
  ok(M.ctrlOfOk(Pn({ of: 'chase' }), g1, 'aladin_1') && !M.ctrlOfOk(Pn({ of: 'chase' }), g1, 'aladin_2'), '추격자 붙은 것만(멈춘 추격 판은 뺌)');
  ok(M.ctrlOfOk(Pn({ of: 'per' }), g1, 'aladin_3') && !M.ctrlOfOk(Pn({ of: 'per' }), g1, 'aladin_4') && !M.ctrlOfOk(Pn({ of: 'per' }), g1, 'aladin_1'), '개별 설정만(메모만 있는 것은 뺌)'); ok(M.ctrlOfOk(Pn({}), g1, 'z'), '거름 없으면 모두'); }
{ const w = (why) => M.ctrlFloorWhy({ v: 1, why });
  ok(w('최저 1,000원 · 매입가 3,000×1.1 · 알라딘 매입가 2,000×1.15') === '매입가의 1.1배', '매입가 쪽이 가장 큼', w('최저 1,000원 · 매입가 3,000×1.1 · 알라딘 매입가 2,000×1.15'));
  ok(w('최저 1,000원 · 매입가 3,000×1.1 · 알라딘 매입가 4,000×1.15') === '알라딘 매입가의 1.15배', '알라딘 매입가 쪽이 가장 큼');
  ok(w('최저 5,000원 · 매입가 3,000×1.1') === '최저 가격 5,000원', '최저 가격이 가장 큼'); ok(w('') === '' && M.ctrlFloorWhy(null) === '', '빈 까닭'); }
{ const T2 = M.bkfTbOrd; delete ctx.S._bkfTbSort; store['rn-bkftbsort'] = JSON.stringify({});
  ok(T2('f1', G).map((g) => g.id).join() === 'g1,g2,g3,g4', '손 순서는 그대로');
  M.bkfTbSortSet('f1', 'pick'); ok(T2('f1', G).map((g) => g.id).join() === 'g2,g1,g4,g3', '결정 대기 많은 순(보관은 끝)'); ok(JSON.parse(store['rn-bkftbsort']).f1 === 'pick', '순서는 기기에 기억');
  M.bkfTbSortSet('f1', 'old'); ok(T2('f1', G).map((g) => g.id).join() === 'g4,g1,g2,g3', '지표 낡은 순(지표 없음이 먼저)');
  M.bkfTbSortSet('f1', 'hand'); ok(!('f1' in JSON.parse(store['rn-bkftbsort'])), '손 순서로 돌리면 기억을 지움(기기 칸만)');
  const realNow = Date.now; Date.now = () => now; const h = M.bkfGeoTop('f1', G); Date.now = realNow;
  ok(/하루 넘은 그룹 2개/.test(h) && /그룹4 지표 없음/.test(h) && /그룹1 30시간 전/.test(h) && !/그룹2 /.test(h) && !/그룹3/.test(h), '낡은 지표 경고 — 하루 넘은 것과 지표 없음만 · 보관 그룹 뺌', h);
  ok(/data-bkfcold="g4,g1"/.test(h) && /감시 켜진 2개/.test(h), '그 그룹들만 관제창 단추 · 감시 켜진 수'); }
{ ok(M.ctrlAmSince(now) === Date.parse('2026-11-18T21:00:00+09:00'), '밤사이 = 어제 21시 KST 뒤');
  const realNow = Date.now; Date.now = () => now;
  let D = M.ctrlAmData(Pn({}), now); ok(D.sold === null && D.ops === null && D.ch === null, '받은 것 없으면 「아직 못 셈」', D);
  ctx.S.ordersLoaded = true; ctx.saleIdx = () => new Map([['aladin_1', [{ ms: now - 3600e3, p: 7000, qty: 1 }, { ms: now - 20 * 3600e3, p: 9000, qty: 1 }]], ['aladin_9', [{ ms: now - 60e3, p: 1, qty: 1 }]]]); ctx.saleIdxX = ctx.saleIdx; /* (11/20 ctrlopt1) 밤사이 판매는 이제 saleIdxX(ISBN만 온 줄도) */
  ctx.S.engF = { day: kstDay(now), L: { ops: 1200, done: 300 } };
  ctx.S._ctrlEps = { eps: [{ key: 'aladin_1', sc: '77', startedAt: new Date(now - 3600e3).toISOString() }, { key: 'aladin_2', sc: '77', startedAt: new Date(now - 7200e3).toISOString() }, { key: 'aladin_3', sc: '996008', startedAt: new Date(now - 60e3).toISOString() }, { key: 'aladin_3', sc: '88', startedAt: new Date(now - 30 * 3600e3).toISOString() }, { key: 'aladin_9', sc: '99', startedAt: new Date(now - 60e3).toISOString() }] };
  D = M.ctrlAmData(Pn({}), now); ok(D.sold === 1 && D.amt === 7000, '팔림 — 묶음 상품 · 어제 21시 뒤만', D); ok(D.ops === 1200 && D.done === 300, '내린 몫(원장)'); ok(D.ch === 1 && D.chB === 2, '새 판매자 — 우리 가게·묶음 밖·밤 전은 뺌', D);
  const h = M.ctrlAmHtml(Pn({})); ok(/🌅 밤사이 한 장/.test(h) && /1권/.test(h) && /1곳/.test(h) && !/77/.test(h), '한 장 글 · 판매자 번호는 보이지 않음', h.slice(0, 400));
  store['rn-ctrlam'] = kstDay(now); ok(/밤사이 한 장 보기/.test(M.ctrlAmHtml(Pn({}))) && !/팔림/.test(M.ctrlAmHtml(Pn({}))), '오늘 접으면 단추만'); Date.now = realNow; }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
