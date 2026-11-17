// tPLOCK1117 — (11/17 일꾼 plock1 · 정범님 I-1117-2027-23) 🔒 상품 잠금 — 잠긴 상품은 판매 상태(·팔려서 줄어드는 수량) 말고 아무것도 바뀌지 않음
//   ① 잠금 판정(plkBlock)이 웹앱·수집기(두 곳)·클라우드·가격 감시기에서 같은 글이고 바르게 가름
//   ② 쓰는 길마다 지킴 줄이 있음(웹앱 상품 고치기·가격 결정·수동 일괄·삭제·앞 페이지 올리기·등록 삭제·그림 붙이기·예스24 고치기 · 수집기 · 클라우드 · 감시기)
//   ③ 「🔒 잠금 N」 칩 — 상품이 보이는 페이지 목록(PLK_SHEETS)과 안 보이는 목록(PLK_NOPE)이 모든 페이지를 나눔 · 새 페이지를 어느 쪽에도 안 넣으면 이 시험이 실패
//   ④ 잠금 쓰기(plkSet)는 prd_locks 한 문서만 · 풀기는 잠금 칸만 바꾸고 기록(hist)은 덧붙임 · 서랍의 풀기도 plkSet(…, false)만
//   ⑤ 카드·상세·수동 일괄 칩 · 머리 칩 #hplk · 잠금 폴더 · 홈 칸 · 페이지 안내
// 실행: node src/tests/tPLOCK1117.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const pick = (...a) => a.find((x) => x && fs.existsSync(x));
const APP = pick(process.env.RN_APP, path.resolve(__dirname, '..', 'app.html'));
const COL = pick(path.resolve(__dirname, '..', 'readnow-collector.src.js'), path.resolve(__dirname, '..', 'readnow-collector.user.js'));
const CLD = pick(path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', 'cloud', 'index.js'));
const PW = pick(path.resolve(__dirname, '..', '..', 'readnow-price-watch.user.js'), path.resolve(__dirname, '..', 'readnow-price-watch.user.js'));
const T = fs.readFileSync(APP, 'utf8'); const K = fs.readFileSync(COL, 'utf8'); const CL = fs.readFileSync(CLD, 'utf8'); const W = fs.readFileSync(PW, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('함수 끝 없음 ' + name); };
const blockLines = (S) => S.split('\n').filter((x) => /const plkBlock = \(lk, ks, down\) =>/.test(x)).map((x) => x.trim().replace(/\s*\/\*.*$/, ''));
(async () => {
  console.log('① 잠금 판정이 모든 곳에서 같음');
  const all = [['웹앱', blockLines(T)], ['수집기', blockLines(K)], ['클라우드', blockLines(CL)], ['가격 감시기', blockLines(W)]];
  ok(all[0][1].length === 1 && all[1][1].length === 2 && all[2][1].length === 1 && all[3][1].length === 1, '판정 줄 수 — 웹앱 1·수집기 2(두 갈래)·클라우드 1·감시기 1', all.map((x) => [x[0], x[1].length]));
  const ref = all[0][1][0]; ok(all.every((x) => x[1].every((y) => y === ref)), '판정 글이 모두 같음');
  const plkBlock = new Function(ref + '\nreturn plkBlock;')();
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  ok(eq(plkBlock(null, ['price', 'state']), { keep: ['price', 'state'], drop: [] }), '잠금 없으면 그대로');
  ok(eq(plkBlock({ on: false }, ['price']), { keep: ['price'], drop: [] }), '풀린 잠금이면 그대로');
  ok(eq(plkBlock({ on: true }, ['price', 'state', 'code', 'grade', 'note', 'qty']), { keep: ['state'], drop: ['price', 'code', 'grade', 'note', 'qty'] }), '잠기면 판매 상태만 — 판매가·관리코드·등급·유의 사항·수량 늘리기 막음');
  ok(eq(plkBlock({ on: true }, ['qty', 'state'], true), { keep: ['qty', 'state'], drop: [] }), '잠겨도 팔려서 수량 줄이기는 됨');
  ok(eq(plkBlock({ on: true }, ['price'], true), { keep: [], drop: ['price'] }), '수량 줄이기 표시가 있어도 판매가는 막음 (사인본 음반 상품 1,000원 사건)');

  console.log('② 쓰는 길마다 지킴');
  const has = (S, name, re, m, pre) => { let f = ''; try { f = fnIn(S, name, pre); } catch (e) { return ok(false, m + ' — ' + e.message); } ok(re.test(f), m); };
  has(T, 'peQueue', /plkFresh\(l\.id, l\)[\s\S]*plkBlock\(lk/, '웹앱 상품 고치기(peQueue) — 맡기기 직전 다시 읽고 판정', 'async function ');
  has(T, 'prDecide', /plkFresh\(x\.key/, '웹앱 가격 결정(prDecide) — 잠기면 결정 안 함', 'async function ');
  ok(/drop\(lk, '🔒 잠금이라 건너뜀'\)/.test(T) && /plkSkipped\(.{0,80}'수동 일괄'\)/.test(T), '웹앱 수동 일괄 — 잠긴 줄 빼고 「🔒 잠금이라 건너뜀」');
  has(T, 'prdDelQueue', /plkFreshMany\(/, '웹앱 상품 삭제 — 잠긴 상품 빼기', 'async function ');
  has(T, 'fbQueue', /plkFreshMany\([\s\S]*plkHit\(lkM, l\)/, '웹앱 앞 페이지 올리기 맡김 — 잠긴 상품 건너뜀', 'async function ');
  has(T, 'fbTick', /PLK_WAIT/, '웹앱 앞 페이지 올리기 차례 — 잠긴 상품 기다림', 'async function ');
  has(T, 'regDelQueue', /plkLockedIds\(/, '웹앱 등록 삭제 — 잠긴 상품 빼기', 'async function ');
  has(T, 'pxQueue', /plkLockedIds\(/, '웹앱 그림 붙이기(유의 사항) — 잠긴 상품 빼기', 'async function ');
  has(T, 'y24WSend', /plkLockedIds\([\s\S]*'start'[\s\S]*'stop'/, '웹앱 예스24 고치기 — 잠기면 판매 시작·중지(·수량 줄이기)만', 'async function ');
  has(K, 'prdEditPc', /plkReadPc\(v\)[\s\S]*plkBlock\(lk === undefined \? \{ on: true \} : lk/, '수집기 상품 고치기 — 알라딘을 고치기 직전 다시 읽음 · 못 읽으면 잠긴 것으로', 'async function ');
  has(K, 'regDelCmd', /plkReadPc\([\s\S]*🔒 잠김 — 건너뜀/, '수집기 등록 삭제 — 잠기면 「🔒 잠김 — 건너뜀」', 'async function ');
  has(CL, 'prdEditRun', /plkReadCl\(v\)[\s\S]*plkBlock\(lk === undefined \? \{ on: true \} : lk[\s\S]*mark\(k, 'claim'\)/, '클라우드 상품 고치기 — 알라딘을 고치기 직전(claim 앞) 다시 읽음', 'async function ');
  has(CL, 'pxExpRun', /prd_locks[\s\S]*plkL\.has\(String\(lid\)\)/, '클라우드 그림 붙이기 — 잠긴 상품 건너뜀', 'async function ');
  ok(/plkSetW\(\)\)\.has\(key\)/.test(W) && /plkReadW\(/.test(W) && /🔒 잠김 — 건너뜀/.test(W), '가격 감시기 — 자동 승인에서 빼고 보내기 직전 다시 읽어 건너뜀');
  { const m = K.match(/@version\s+\S+/); ok(!!m, '수집기 머리 그대로(머리 글은 release.js가 HSIG로 검사)'); }
  { // 웹앱 상품 고치기 — 잠긴 상품 판매가를 맡기지 않음(작동)
    const calls = []; const toasts = []; const skipped = [];
    const S = { user: { email: 't@x' }, plkOk: true };
    const fakeLocks = { aladin_U1: { on: true, why: '사인본' } };
    const plkFresh = async (k) => fakeLocks[k] || null;
    const plkSkipped = (ks, w) => skipped.push([ks, w]); const toast = (m) => toasts.push(m);
    const pq = fnIn(T, 'peQueue', 'async function ');
    const i = pq.indexOf('{', pq.indexOf('opt = opt || {};') + 'opt = opt || {};'.length); let d = 0, j = i; for (; j < pq.length; j++) { if (pq[j] === '{') d++; else if (pq[j] === '}') { d--; if (!d) break; } }
    const guard = pq.slice(i, j + 1);
    const CHF_K = { price: { l: '판매가' }, state: { l: '판매 상태' } };
    const run = new Function('plkFresh', 'plkBlock', 'plkSkipped', 'toast', 'S', 'calls', 'CHF_K', 'return async (l, ch, before, opt) => { opt = opt || {}; ' + guard + ' return { ch, opt }; };')(plkFresh, plkBlock, plkSkipped, toast, S, calls, CHF_K);
    let r; try { r = await run({ id: 'aladin_U1', listingId: '1' }, { price: 1000, state: '판매중지' }, {}, {}); } catch (e) { r = { err: e.message }; }
    ok(r && !r.err && r.ch && !('price' in r.ch) && r.ch.state === '판매중지', '잠긴 상품 — 판매가 1,000원은 빠지고 판매 상태만 남음', r);
    ok(skipped.length === 1 && /상품 고치기/.test(skipped[0][1]), '건너뜀 알림(서랍 표시)', skipped);
    let r2; try { r2 = await run({ id: 'aladin_U1', listingId: '1' }, { price: 1000 }, {}, {}); } catch (e) { r2 = { err: e.message }; }
    ok(!(r2 && r2.ch) && /🔒 잠금이라 건너뜀 — 판매가/.test(toasts[toasts.length - 1] || ''), '판매가만 바꾸려 하면 아무것도 맡기지 않고 「🔒 잠금이라 건너뜀」', [r2, toasts]);
    let r3; try { r3 = await run({ id: 'aladin_U2', listingId: '2' }, { price: 9000 }, {}, {}); } catch (e) { r3 = { err: e.message }; }
    ok(r3 && r3.ch && r3.ch.price === 9000, '안 잠긴 상품은 그대로', r3);
  }
  { // 못 읽으면 잠긴 것으로(안전 쪽)
    const S = { plkOk: false }; const M = new Map();
    const f = new Function('S', 'db', 'plkMap', 'plkOnLid', 'return ' + fnIn(T, 'plkFresh', 'async function ') + ';')(S, { collection: () => ({ doc: () => ({ get: async () => { throw new Error('끊김'); } }) }) }, () => M, () => false);
    const v = await f('aladin_U9', { listingId: '9' }); ok(!!v && v.on === true, '웹앱 — 잠금 상태를 못 읽고 실시간 받기도 아직이면 잠긴 것으로', v);
  }

  console.log('③ 「🔒 잠금 N」 칩 — 모든 페이지가 나뉨');
  const arr = (n) => { const m = T.match(new RegExp('const ' + n + ' = (\\[[^\\]]*\\])')); return m ? new Function('return ' + m[1])() : null; };
  const A = arr('PLK_SHEETS'), B = arr('PLK_NOPE');
  ok(Array.isArray(A) && Array.isArray(B) && A.length > 20, '목록 둘이 코드 한곳에 있음', [A && A.length, B && B.length]);
  const classify = (src) => { const keys = new Set([...src.matchAll(/S\.detail\s*=\s*\{\s*([A-Za-z_$][\w$]*)\s*:/g)].map((m) => m[1])); return { miss: [...keys].filter((k) => !A.includes(k) && !B.includes(k)), extra: [...A, ...B].filter((k) => !keys.has(k)), both: A.filter((k) => B.includes(k)) }; };
  const c = classify(T);
  ok(!c.miss.length, '모든 페이지가 칩 보임/안 보임 어느 한쪽에', c.miss); ok(!c.extra.length, '없는 페이지 이름이 목록에 없음', c.extra); ok(!c.both.length, '두 목록에 겹치는 이름 없음', c.both);
  ok(classify(T + '\nS.detail = { newPageX: 1 };').miss.includes('newPageX'), '새 페이지를 목록에 안 넣으면 이 시험이 실패함(자가 확인)');
  for (const k of ['product', 'batch', 'bigTable', 'list', 'fbump', 'ship', 'stock', 'y24', 'plkf']) ok(A.includes(k), `상품이 보이는 「${k}」 페이지에 칩`);
  ok(/function plkSheetHook\(/.test(T) && /MutationObserver/.test(fnIn(T, 'plkSheetHook')), '페이지가 열릴 때마다 머리에 칩을 붙임(MutationObserver)');

  console.log('④ 잠금 쓰기는 prd_locks 한 문서만 · 풀기는 잠금만');
  { const W2 = []; const M = new Map([['aladin_U1', { id: 'aladin_U1', on: true, why: '사인본', lockedAt: '2026-11-17T11:00:00Z', vals: { price: 30000 }, hist: [{ act: 'lock' }] }]]);
    const db = { collection: (n) => ({ doc: (k) => ({ set: async (doc, o) => { W2.push({ n, k, doc, o }); } }) }) };
    const FV = { arrayUnion: (...a) => ({ __union: a }) };
    const plkSet = new Function('S', 'db', 'firebase', 'deviceName', 'plkMap', 'plkImg', 'plkPlat', 'plkPaint', 'return ' + fnIn(T, 'plkSet', 'async function ') + ';')({ user: { email: 't@x' } }, db, { firestore: { FieldValue: FV } }, () => 'PC1', () => M, () => null, () => '알라딘', () => {});
    await plkSet({ id: 'aladin_U1' }, false, {});
    ok(W2.length === 1 && W2[0].n === 'prd_locks' && W2[0].k === 'aladin_U1' && W2[0].o && W2[0].o.merge === true, '풀기 — prd_locks/aladin_U1 한 문서에 합치기(merge)로만', W2.map((x) => [x.n, x.k, x.o]));
    const d0 = W2[0].doc; ok(d0.on === false && !!d0.unlockedAt && !('vals' in d0) && !('lockedAt' in d0) && d0.hist && d0.hist.__union && d0.hist.__union[0].act === 'unlock', '풀기 — on·unlockedAt만 바꾸고 잠근 때·값은 남김 · 기록 덧붙임(지우지 않음)', d0);
    ok(!Object.keys(d0).some((k) => ['price', 'qty', 'state', 'grade', 'note', 'code'].includes(k)), '풀기 — 상품 값 칸은 하나도 안 씀');
    W2.length = 0; await plkSet({ id: 'aladin_U2', listingId: '2', price: 30000, qty: 1, status: '판매중', title: '사인본 음반 상품' }, true, { why: '사인본' });
    ok(W2.length === 1 && W2[0].n === 'prd_locks' && W2[0].doc.on === true && W2[0].doc.vals.price === 30000 && W2[0].doc.why === '사인본' && !!W2[0].doc.lockedAt, '잠그기 — 까닭·잠근 때·그때 값 남김', W2[0] && W2[0].doc);
    W2.length = 0; await plkSet({ id: 'aladin_U2' }, true, { act: 'why', why: '바꾼 까닭' });
    ok(W2.length === 1 && eq(Object.keys(W2[0].doc).sort(), ['hist', 'why']), '까닭 고치기 — 까닭과 기록만', W2[0] && Object.keys(W2[0].doc)); }
  { const start = T.indexOf('/* ── (11/17 plock1'); const end = T.indexOf('async function peQueue(', start);
    const blk = start >= 0 && end > start ? T.slice(start, end) : '';
    const cols = [...blk.matchAll(/collection\('([^']+)'\)/g)].map((m) => m[1]);
    ok(blk.length > 1000 && cols.length && cols.every((x) => x === 'prd_locks'), '잠금 도우미 덩어리는 prd_locks 말고 아무 칸도 안 건드림', [...new Set(cols)]);
    ok(!/\.delete\(\)/.test(blk) && !/alert\(|confirm\(/.test(blk), '잠금 기록을 지우지 않음 · 브라우저 팝업 없음');
    const un = [...blk.matchAll(/plkSet\(unOf\([^)]*\), false, \{\}\)/g)].length; ok(un >= 2, '서랍의 풀기(하나·고른 것)는 plkSet(…, false)만', un);
    ok(/twiceArm\(/.test(blk), '풀기는 두 번 눌러야(twiceArm)'); }

  console.log('⑤ 화면');
  ok(/plkChip\(l\)/.test(fnIn(T, 'prodCard2')), '상품 카드에 잠금 칩');
  ok(/✏ 상품 정보 · 채널별[\s\S]{0,200}plkChip\(/.test(T), '상품 상세 편집 머리에 잠금 칩');
  ok(/plkChip\(\{ \.\.\.l, id: l\.id \|\| 'aladin_' \+ l\.usedCode \}\)/.test(T), '수동 일괄 줄마다 잠금 칩');
  ok(/id="hplk" data-plkdrawer="1"/.test(T), '앱 머리 「🔒 잠금 N」(#hplk) — 누르면 서랍');
  ok(/plkFoldBtn\(\) \+ \(pc\('pt_all'\)/.test(T) && /\$\{plkFoldBtn\(1\)\}/.test(T), '상품 탭·수동 일괄에 🔒 잠금 폴더 단추');
  ok(/plk: \['🔒 잠긴 상품', \(\) => plkWidget\(\)/.test(T), '홈 칸(대시보드 카드)');
  ok(/\['plkf', '🔒 잠금 폴더', \(d\) => d\.plkf, 'openPlkFolder'\]/.test(T) && /PAGE_GUIDES\['plkf'\]/.test(T) && /\['plkFold', '🔒 잠금 폴더'/.test(T), '잠금 폴더 — 페이지 목록·안내·바로 가기');
  ok(/plkOff: !L\.includes\('plk'\)/.test(T) && /rn-home-plkseen/.test(T), '홈 배치 — 처음엔 넣고 빼서 저장하면 다시 안 넣음');
  ok(/function plkSkipped\(/.test(T) && /dataset\.plkdrawer = 'mark'/.test(fnIn(T, 'plkSkipped')) && /plkDrawer\(\{ mark: hd\.dataset\.plkdrawer === 'mark' \}\)/.test(T), '「🔒 잠금이라 건너뜀 N」 → 누르면 서랍에 건너뛴 상품 표시');

  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e && e.stack); process.exit(1); });
