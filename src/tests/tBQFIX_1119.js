// tBQFIX_1119 — (11/19 정범님 I-1119-1619-18 · 일꾼 bqfix1) 수동 일괄 두 가지
//  ① 「선택대기에 잠김 상품이 그대로 있어」 — 🆕 새로 잠금·🔒 완전 잠금·🎚 조건 잠금 선 밖은 선택 대기·결정 대기·실행에서 빠짐(공용 판정 bqLockWhy) · 선 안 조건 잠금은 남음 · 상품·기록은 그대로
//  ② 「3개이하에 여전히 이미 부합 상품이 골라내지지 않는」 — 추천가 = 지금 판매가(숫자로 견줌)는 조건 이미 부합으로 · 추천가가 없는 상품은 「±0」이 아니라 「추천 못 함」과 까닭
// 실행: node tBQFIX_1119.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const lkB = cut('const plkClamp = (lk, p, x) =>', '\n/* 잠금을 알려야 하는') + '\n' + cut('const plkMap = () =>', '\nconst plkPlat') + '\n' + cut('const plkOnLid = (lid) =>', '\nconst plkOnL ') + '\n' + cut('const PLK_ML = {', '\nconst plkKst');
const bkB = cut('function bkfLkOf(x, M, k)', 'function bkfItemWhy(');
const blk = cut('const BQ_TABDEF = [', 'function bqSoldHtml(');
const S = { plk: new Map() };
const mk = () => new Function('S', 'unregOf', 'OBS_VALID', 'needSearch', 'edOf', 'edPickOf', 'edUse', 'bbNearX', 'lotCheck', 'plkCtx', 'lotFloor', 'num', 'esc',
  lkB + '\n' + bkB + '\n' + blk + '\nreturn { bqCls, bqSameP, bqLockWhy, BQ_LKT, bqLkSig, bqNoTWhy, bqLkBarHtml, bqFewNoteHtml, bkfTabP, PLK_ML };')(
  S, (l) => !!l.unreg, new Set(['green', 'blue']), () => false, () => null, () => null, () => null, () => false, () => false,
  (l) => ({ cur: l.price, list: null, cost: null, low: null, top: null }), () => null, (n) => String(n), (s) => String(s));
const M = mk();
const st = (o) => ({ picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {}, ...o });
const G = [{ c: 'green' }, { c: 'green' }, { c: 'blue' }, { c: 'green' }, { c: 'blue' }];
const X = (u, price, target, o) => ({ l: { usedCode: u, price, listingId: 'L' + u }, target, page1: G, ...(o || {}) });
const lock = (u, v) => S.plk.set('aladin_' + u, { on: true, lid: 'L' + u, ...v });
const future = new Date(Date.now() + 864e5).toISOString(), past = new Date(Date.now() - 864e5).toISOString();

console.log('① 공용 잠금 판정 bqLockWhy');
{ ok(M.bqLockWhy(X('A0', 9000, 8000), 8000) === null, '잠기지 않음 → null');
  lock('A1', { mode: 'new' }); const w1 = M.bqLockWhy(X('A1', 9000, 8000), 8000); ok(w1 && w1.out && w1.m === 'new' && w1.why === M.PLK_ML.new, '🆕 새로 잠금 → 빠짐', w1 && { out: w1.out, m: w1.m });
  lock('A2', { mode: 'full' }); ok(M.bqLockWhy(X('A2', 9000, 8000), 8000).out, '🔒 완전 잠금 → 빠짐');
  lock('A3', {}); const w3 = M.bqLockWhy(X('A3', 9000, 8000), 8000); ok(w3.out && w3.m === 'full', '옛 잠금(갈래 없음) → 완전 잠금으로 빠짐');
  lock('A4', { mode: 'cond', cond: { floor: 7000 } }); const w4 = M.bqLockWhy(X('A4', 9000, 8000), 8000); ok(w4 && !w4.out && w4.m === 'cond' && w4.Q && w4.Q.ok, '🎚 조건 잠금 하한 7000 · 8000으로 → 선 안이라 남음', w4 && { out: w4.out, why: w4.why });
  const w5 = M.bqLockWhy(X('A4', 9000, 6000), 6000); ok(w5.out || (w5.Q && w5.Q.cut), '🎚 조건 잠금 하한 7000 · 6000으로 → 선 밖(빠짐) 또는 선까지만', w5 && { out: w5.out, why: w5.why });
  lock('A6', { mode: 'cond', cond: {} }); const w6 = M.bqLockWhy(X('A6', 9000, 8000), 8000); ok(w6.out && w6.m === 'new', '조건이 빈 조건 잠금 → 새로 잠금처럼 빠짐');
  lock('A7', { mode: 'cond', cond: { floor: 7000, until: past } }); ok(M.bqLockWhy(X('A7', 9000, 8000), 8000).out, '기한 지난 조건 잠금 → 빠짐');
  lock('A8', { mode: 'cond', cond: { floor: 7000, until: future } }); ok(!M.bqLockWhy(X('A8', 9000, 8000), 8000).out, '기한 남은 조건 잠금 선 안 → 남음');
  const w9 = M.bqLockWhy(X('A4', 9000, null), null); ok(w9 && !w9.out, '조건 잠금인데 가격을 아직 모름(추천 못 함·이미 부합) → 남음(실행 때 다시 봄)');
  const Mx = new Map([['aladin_A0', { on: true, mode: 'full' }]]); ok(M.bqLockWhy(X('A0', 9000, 8000), 8000, Mx).out, '서버에서 막 읽은 잠금(M)을 쓰면 그것으로 봄(실행 쪽)');
  S.plk.set('other', { on: true, lid: 'LB1', mode: 'full' }); ok(M.bqLockWhy(X('B1', 9000, 8000), 8000).out, '상품 번호(lid)로 잠긴 것도 빠짐');
  ok(M.BQ_LKT.has('sel') && M.BQ_LKT.has('pick') && M.BQ_LKT.has('few') && M.BQ_LKT.has('ok') && !M.BQ_LKT.has('done') && !M.BQ_LKT.has('trash') && !M.BQ_LKT.has('sold'), '잠금을 보는 탭 = 값을 정하거나 실행하는 탭(확정·휴지통·판매완료 기록은 그대로)');
  const sig1 = M.bqLkSig([X('A1', 9000, 8000), X('A0', 9000, 8000)]); S.plk.get('aladin_A1').on = false; const sig2 = M.bqLkSig([X('A1', 9000, 8000), X('A0', 9000, 8000)]); ok(sig1 !== sig2, '잠금을 풀면 모양(bqLkSig)이 바뀜 → 그룹 화면을 다시 그림'); S.plk.get('aladin_A1').on = true; }

console.log('① 그룹 화면·실행·상태판이 모두 bqLockWhy를 부름(잠긴 상품이 선택 대기에 남던 원인 = 「이 그룹에서 뺀」 잠금만 빼던 탭 나누기)');
{ ok(/R\.forEach\(\(x, i\) => \{ if \(PLO\.has\(keyOf\(x\)\)\) return void outI\.push\(i\); const t = cls\(x\); if \(BQ_LKT\.has\(t\)\) \{ const W = bqLockWhy\(x, t === 'ok' \? null : bkfTabP\(x, t, \{ keyOf, st \}\), null\); if \(W && W\.out\) \{ LK\.i\.push\(i\)/.test(T), '탭 나누기 — 잠겨서 빠짐은 탭에 넣지 않음(LK)');
  ok(/const W = bqLockWhy\(p\.x, p\.price, M\); if \(!W\) continue; const v = W\.v; if \(W\.m !== 'cond'\) \{ lk\.push\(p\); continue; \}/.test(T), '실행(결정 대기 확정) — 서버 잠금 M으로 bqLockWhy');
  ok(/const W = bqLockWhy\(x, p, M\); if \(W\) \{ if \(W\.out\) return W\.m !== 'cond' \? '🔒 잠금' : '🎚 조건 잠금 선 밖';/.test(T), '📊 묶음 상태판(bkfItemWhy)도 같은 판정');
  ok(/if \(\(bqLockWhy\(x, x\.target\) \|\| \{\}\)\.out\) continue;/.test(T), '그룹 칸 선택 대기 수에서도 뺌');
  ok(/\$\{bqLkBarHtml\(LK, R, keyOf\)\}/.test(T) && /data-bqlkv="1"/.test(T) && /closest\('\[data-bqlkv\]'\)[^\n]*plkDrawer\(\{ mark: true \}\)/.test(T), '「🔒 잠겨서 빠짐」 줄 + 잠금 서랍에서 그 상품들 먼저 보기');
  ok(/bqLkSig\(S\.batchRes\) !== S\._bqLkS\) \{ S\._bqLkS = bqLkSig\(S\.batchRes\); S\._plkBRe\(\); \}/.test(T), '잠금·풀기가 생기면 그룹 화면을 다시 셈(plkPaint)');
  S._bqLkKeys = null; const h = M.bqLkBarHtml({ i: [0, 1, 2], n: { new: 1, full: 1, cond: 1 }, inN: 2 }, [X('A1'), X('A2'), X('A4')], (x) => 'aladin_' + x.l.usedCode);
  ok(/🔒 잠겨서 빠짐 3개/.test(h) && /🆕 새로 잠금 1/.test(h) && /🔒 완전 잠금 1/.test(h) && /조건 잠금 선 밖 1/.test(h) && /선 안 2개는 탭에 남김/.test(h) && /상품·그룹 기록은 그대로/.test(h) && /다음:/.test(h), '화면 글 — 수·갈래·까닭·남긴 수·다음에 할 일', h);
  ok(JSON.stringify(S._bqLkKeys) === JSON.stringify(['aladin_A1', 'aladin_A2', 'aladin_A4']), '서랍에 넘길 열쇠');
  ok(M.bqLkBarHtml({ i: [], n: {}, inN: 0 }, [], () => '') === '', '잠긴 것이 없으면 줄 없음');
  ok(!/\b(alert|confirm|prompt)\(/.test(cut('function bqNoTWhy(', '/* 탭 나누기 — drawBatchRes')), '브라우저 팝업 없음'); }

console.log('② 3개이하/미등록 · 이미 부합');
{ const thin = [{ c: 'green' }, { c: 'red' }]; const Y = (u, price, target) => ({ l: { usedCode: u, price }, target, page1: thin });
  ok(M.bqCls(Y('F1', 8000, 8000), { st: st() }) === 'ok', '추천가 = 지금(숫자) → 조건 이미 부합');
  ok(M.bqCls(Y('F2', 8000, '8000'), { st: st() }) === 'ok', '추천가가 글자 "8000"이어도 → 조건 이미 부합(예전엔 === 라 3개이하에 남음)');
  ok(M.bqCls(Y('F3', 8000, 8000.0004), { st: st() }) === 'ok', '소수 찌꺼기 8000.0004도 → 조건 이미 부합');
  ok(M.bqCls(Y('F4', 8000, 7900), { st: st() }) === 'few', '추천가가 다르면 3개이하/미등록 그대로');
  ok(M.bqCls(Y('F5', 8000, null), { st: st() }) === 'few', '추천가가 없으면 3개이하/미등록에 남음(이미 부합 아님)');
  ok(M.bqCls({ ...Y('F6', 8000, 8000), critOff: 1 }, { st: st() }) === 'sel', '「그래도 바꾸기」로 보낸 것은 선택 대기');
  ok(M.bqCls(X('N1', 8000, '8000'), { st: st() }) === 'ok', '시장이 넉넉한 상품도 글자/숫자 섞여도 이미 부합');
  ok(M.bqSameP(8000, 8000) && M.bqSameP('8000', 8000) && !M.bqSameP(null, 8000) && !M.bqSameP(8000, null) && !M.bqSameP('', 8000) && !M.bqSameP(0, 0), 'bqSameP — 둘 다 있고 같은 원 단위일 때만');
  ok(/판본/.test(M.bqNoTWhy({ reasons: ['🔖 판본 확인 필요 — 판매가 그대로'] })) && /미등록/.test(M.bqNoTWhy({ reasons: ['알라딘 미등록 상품 — 수집기의 검색 시세'] })) && /시장 자료 없음/.test(M.bqNoTWhy({ reasons: ['시장 자료(첫 페이지)가 없음 — 상품 수집기'] })), '추천가 없는 까닭 한마디');
  const R = [Y('F1', 8000, 8000), Y('F5', 8000, null), Y('F4', 8000, 7900)]; const nh = M.bqFewNoteHtml([1, 2], [0], R);
  ok(/이 탭 2개/.test(nh) && /추천가 있음 1/.test(nh) && /추천가 없음 1/.test(nh) && /옮긴 1개/.test(nh), '3개이하 탭 머리 — 추천가 있음·없음·이미 부합으로 옮긴 수', nh);
  ok(/\(T === 'few' && x\.target == null && BEi\[k\] == null\)\) return x\.target == null \?/.test(T), '추천가 없는 3개이하 카드 — 「지금 = 같은 값」 대신 추천 못 함 + 까닭');
  ok(/\(T === 'few' && ev == null\)\);/.test(T), '한눈에 보기 카드도 ±0.0% 대신 추천 못 함'); }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
