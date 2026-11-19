// tLOCKCOND2_1118 — (11/18 일꾼 lockcond1 판 ② · 정범님 I-1118-1417-15.4) 잠금 세 갈래(🆕 새로 잠금 · 🔒 완전 잠금 · 🎚 조건 잠금) + 조건 선
//   ① 조건 셈(plkClamp) — 웹앱·수집기(두 벌)·클라우드·가격 감시기가 같은 글 · 선을 넘는 값은 선까지 줄이거나 막음 · 옛 잠금(갈래 없음)·새로 잠금·조건 없음·기한 지남은 완전 잠금처럼 막음
//   ② 갈래 판정(plkMode)·조건 검사(plkCondBad)·판매가 말고는 조건 잠금도 막음(plkBlock)
//   ③ 쓰는 길마다 고치기 직전 다시 셈 — 상품 고치기(peQueue)·가격 결정(prDecide)·수동 일괄(batchExec0) · 수집기·클라우드·가격 감시기는 맡길 때 적은 시장 값(plkx)으로 다시 셈
//   ④ 화면 — 🔓 → 🆕 새로 잠금 · ▾ 고르기 판(완전·조건) · 서랍 세 칸 · 수동 일괄 그룹에서 빼기·↩ 되돌리기
// 실행: node src/tests/tLOCKCOND2_1118.js · 화면 시험은 RN_PORT가 있을 때 · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..');
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const rd = (f) => { for (const p of [path.join(ROOT, f), path.join(ROOT, 'src', f)]) if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); return ''; };
const COL = rd('src/readnow-collector.src.js'), CL = rd('cloud/index.js'), WT = rd('readnow-price-watch.user.js');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } return S.slice(i); };
const lineOf = (S, pre) => { const i = S.indexOf(pre); if (i < 0) return ''; return S.slice(i, S.indexOf('\n', i)); };
const cut = (a, b) => T.slice(T.indexOf(a), T.indexOf(b));

console.log('① 조건 셈(plkClamp) — 네 곳 같은 글');
const cl = (S) => (S.match(/const plkClamp = \(lk, p, x\) => \{.*\};/g) || []);
const CA = cl(T), CC = cl(COL), CK = cl(CL), CW = cl(WT);
ok(CA.length === 1 && CC.length === 2 && CK.length === 1 && CW.length === 1, '웹앱 1 · 수집기 2 · 클라우드 1 · 가격 감시기 1', [CA.length, CC.length, CK.length, CW.length]);
ok([...CC, ...CK, ...CW].every((x) => x === CA[0]), '모두 한 글자도 다르지 않음');
const plkClamp = new Function(CA[0] + '\nreturn plkClamp;')();
const C = (cond, o) => ({ on: true, mode: 'cond', cond, ...(o || {}) });
const kday = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
{
  let r = plkClamp({ on: true }, 9000, { cur: 10000 }); ok(!r.ok && /완전 잠금/.test(r.why), '옛 잠금(갈래 없음) → 완전 잠금처럼 막음', r);
  r = plkClamp({ on: true, mode: 'new' }, 9000, { cur: 10000 }); ok(!r.ok, '🆕 새로 잠금 → 막음', r);
  r = plkClamp({ on: true, mode: 'full' }, 9000, { cur: 10000 }); ok(!r.ok, '🔒 완전 잠금 → 막음', r);
  r = plkClamp(C({}), 9000, { cur: 10000 }); ok(!r.ok && /조건이 없어/.test(r.why), '조건 잠금인데 조건이 비면 → 막음', r);
  r = plkClamp(C({ memo: '메모만' }), 9000, { cur: 10000 }); ok(!r.ok, '메모·기한만 있고 숫자 조건이 없으면 → 막음', r);
  r = plkClamp(C({ floor: 8000, until: new Date(Date.now() - 60e3).toISOString() }), 9000, { cur: 10000 }); ok(!r.ok && /기한/.test(r.why), '기한 지난 조건 잠금 → 막음', r);
  r = plkClamp({ on: false }, 5000, {}); ok(r.ok && r.p === 5000, '풀린 상품 → 그대로', r);
  // 하한가
  r = plkClamp(C({ floor: 8000 }), 9000, { cur: 10000 }); ok(r.ok && r.p === 9000 && !r.cut, '하한가 안쪽 값은 그대로', r);
  r = plkClamp(C({ floor: 8000 }), 7000, { cur: 10000 }); ok(r.ok && r.p === 8000 && r.cut, '하한가 넘는 값 → 하한가까지 줄임', r);
  r = plkClamp(C({ floor: 8000 }), 7000, { cur: 8000 }); ok(!r.ok, '이미 하한가면 더 못 내림(막음)', r);
  r = plkClamp(C({ ceil: 12000 }), 15000, { cur: 10000 }); ok(r.ok && r.p === 12000, '상한가 → 상한가까지 줄임', r);
  r = plkClamp(C({ floor: 8000 }), 9000, { cur: 6000 }); ok(r.ok && r.p === 9000, '지금 값이 하한가 아래면 올리기는 됨', r);
  // 유효 최저가와의 격차
  r = plkClamp(C({ gapDn: 10 }), 8000, { cur: 10000, low: 10000 }); ok(r.ok && r.p === 9000 && r.cut, '유효 최저가보다 10% 넘게 아래로 안 감 → 9,000원', r);
  r = plkClamp(C({ gapDn: 10 }), 8000, { cur: 10000, low: null }); ok(!r.ok && /모름/.test(r.why), '유효 최저가를 모르면 막음(안전)', r);
  r = plkClamp(C({ gapUp: 20 }), 15000, { cur: 10000, low: 10000 }); ok(r.ok && r.p === 12000, '유효 최저가보다 20% 넘게 비싸지지 않음 → 12,000원', r);
  // 최저가 ± · 최상단
  r = plkClamp(C({ lowOff: -500 }), 8000, { cur: 10000, low: 9000 }); ok(r.ok && r.p === 8500, '유효 최저가 −500원 아래로 안 감 → 8,500원', r);
  r = plkClamp(C({ topOff: 0 }), 7000, { cur: 10000, top: 9000 }); ok(r.ok && r.p === 9000, '최상단 가격까지만 → 9,000원', r);
  r = plkClamp(C({ topOff: -1000 }), 7000, { cur: 10000, top: 9000 }); ok(r.ok && r.p === 8000, '최상단보다 1,000원 아래까지 → 8,000원', r);
  r = plkClamp(C({ topOff: 0 }), 7000, { cur: 10000, top: null }); ok(!r.ok, '최상단 가격을 모르면 막음', r);
  // 정가의 % · 원가 +
  r = plkClamp(C({ listPct: 50 }), 4000, { cur: 10000, list: 16000 }); ok(r.ok && r.p === 8000, '정가 16,000원의 50% 아래로 안 감 → 8,000원', r);
  r = plkClamp(C({ listPct: 50, ref: { list: 16000 } }), 4000, { cur: 10000 }); ok(r.ok && r.p === 8000, '정가를 모르면 조건 정한 때 정가(ref)로 셈', r);
  r = plkClamp(C({ costPlus: 1000 }), 3000, { cur: 10000, cost: 5000 }); ok(r.ok && r.p === 6000, '원가 5,000 + 1,000원 아래로 안 감', r);
  r = plkClamp(C({ costPlus: 1000 }), 3000, { cur: 10000 }); ok(!r.ok, '원가를 모르면 막음', r);
  // 한 번 폭 · 하루 횟수 · 하루 금액
  r = plkClamp(C({ stepPct: 10 }), 5000, { cur: 10000 }); ok(r.ok && r.p === 9000, '한 번에 10%까지 → 9,000원', r);
  r = plkClamp(C({ stepPct: 10 }), 20000, { cur: 10000 }); ok(r.ok && r.p === 11000, '올릴 때도 한 번 10%까지 → 11,000원', r);
  r = plkClamp(C({ stepPct: 10 }), 9000, { cur: null }); ok(!r.ok, '한 번 폭인데 지금 값을 모르면 막음', r);
  r = plkClamp(C({ dayN: 2 }, { day: { d: kday, n: 2, amt: 0 } }), 9000, { cur: 10000 }); ok(!r.ok && /2번을 다 씀/.test(r.why), '오늘 2번 다 쓰면 막음', r);
  r = plkClamp(C({ dayN: 2 }, { day: { d: kday, n: 2, amt: 0 } }), 9000, { cur: 10000, noDay: true }); ok(r.ok, '수집기·클라우드가 다시 셀 때(noDay)는 하루 횟수를 또 세지 않음', r);
  r = plkClamp(C({ dayN: 2 }, { day: { d: '2000-01-01', n: 9, amt: 0 } }), 9000, { cur: 10000 }); ok(r.ok, '어제 센 것은 오늘 세지 않음', r);
  r = plkClamp(C({ dayAmt: 1000 }, { day: { d: kday, n: 1, amt: 600 } }), 8000, { cur: 10000 }); ok(r.ok && r.p === 9600, '하루 1,000원 중 600원 썼으면 400원만 더 내림', r);
  // 조건끼리 맞지 않음 · 값 없음
  r = plkClamp(C({ floor: 9000, ceil: 8000 }), 8500, { cur: 10000 }); ok(!r.ok && /맞지 않음/.test(r.why), '하한가 > 상한가 → 막음', r);
  r = plkClamp(C({ floor: 8000 }), null, { cur: 10000 }); ok(!r.ok, '바꿀 값이 없으면 막음', r);
  r = plkClamp(C({ floor: 8000, gapDn: 5 }), 7000, { cur: 10000, low: 9000 }); ok(r.ok && r.p === 8550, '조건 여럿이면 가장 센 선(하한 8,000 · 최저가 5% 아래 8,550 → 8,550원)', r);
}

console.log('② 갈래 판정·조건 검사·칸 막기');
{
  const H = cut('const PLK_ML =', '/* 조건 셈에 쓰는 지금 값');
  const G = new Function(H + '\nreturn { plkMode, plkCondBad, plkCondPick, plkCondTxt, plkCondOk };')();
  ok(G.plkMode({ on: true }) === 'full', '옛 잠금(갈래 없음) → 🔒 완전 잠금');
  ok(G.plkMode({ on: true, mode: 'new' }) === 'new' && G.plkMode({ on: true, mode: 'full' }) === 'full', '새로·완전');
  ok(G.plkMode(C({ floor: 1000 })) === 'cond', '조건 있는 조건 잠금 → 🎚');
  ok(G.plkMode(C({})) === 'new' && G.plkMode(C({ floor: 1000, until: '2000-01-01T00:00:00Z' })) === 'new', '조건이 비었거나 기한 지난 조건 잠금 → 🆕 새로 잠금 칸(다시 정하기)');
  ok(G.plkMode({ on: false, mode: 'cond' }) === '' && G.plkMode(null) === '', '풀림 → 빈칸');
  ok(/하나 이상/.test(G.plkCondBad(null)) && /하나 이상/.test(G.plkCondBad({ memo: 'x' })), '조건이 없으면 저장 안 됨');
  ok(/상한가보다/.test(G.plkCondBad({ floor: 9000, ceil: 8000 })), '하한가 > 상한가 → 저장 안 됨');
  ok(/100%/.test(G.plkCondBad({ listPct: 120 })) && /0보다/.test(G.plkCondBad({ floor: -1 })), '말이 안 되는 % · 음수 → 저장 안 됨');
  ok(/정수/.test(G.plkCondBad({ dayN: 1.5 })) && /0%/.test(G.plkCondBad({ stepPct: 0 })), '하루 횟수 정수 · 한 번 폭 0% 막음');
  ok(/지남/.test(G.plkCondBad({ floor: 1000, until: '2000-01-01T00:00:00Z' })), '지난 기한 → 저장 안 됨');
  ok(G.plkCondBad({ floor: 8000, topOff: -1000, lowOff: -500 }) === '', '최상단·최저가 ±는 음수 됨');
  const pk = G.plkCondPick({ floor: '8000', ceil: '', junk: 1, memo: 'x', until: '2099-01-01T00:00' }); ok(pk.floor === 8000 && !('ceil' in pk) && !('junk' in pk) && pk.memo === 'x' && /^2099-01-01T/.test(pk.until), '저장할 조건만 숫자로 골라 냄', pk);
  ok(/하한 8,000원/.test(G.plkCondTxt({ floor: 8000 })) && /최상단 -1,000원/.test(G.plkCondTxt({ topOff: -1000 })), '조건 글(서랍·칩 풀이)');
  const plkBlock = new Function(lineOf(T, 'const plkBlock = ') + '\nreturn plkBlock;')();
  let b = plkBlock({ on: true }, ['price', 'state', 'note'], false); ok(b.drop.includes('price') && b.keep.join() === 'state', '옛 잠금 — 판매가도 막음(판매 상태만)', b);
  b = plkBlock(C({ floor: 1 }), ['price', 'state', 'note', 'grade', 'code'], false); ok(b.keep.sort().join() === 'price,state' && b.cond, '조건 잠금 — 판매가·판매 상태만 · 유의 사항·등급·관리코드는 막음', b);
  b = plkBlock(C({ floor: 1, until: '2000-01-01T00:00:00Z' }), ['price'], false); ok(b.drop.includes('price'), '기한 지난 조건 잠금 — 판매가 막음', b);
  ok(lineOf(T, 'const plkBlock = ') === lineOf(COL, 'const plkBlock = ').trim() || COL.includes(lineOf(T, 'const plkBlock = ').trim()), '수집기 칸 막기도 같은 글');
}

console.log('③ 쓰는 길마다 고치기 직전 다시 셈');
{
  const pe = fnIn(T, 'peQueue', 'async function ');
  ok(/B\.cond && 'price' in ch/.test(pe) && /plkClamp\(lk, want/.test(pe) && /delete ch\.price/.test(pe) && /price: Q\.p/.test(pe), '상품 고치기 — 조건 잠금은 판매가를 선까지 줄이거나 빼고 맡김');
  ok(/opt\.plkx && 'price' in ch \? \{ plkx: opt\.plkx \}/.test(pe) && /plkNote\(l\.id, opt\.plkLk/.test(pe), '상품 고치기 — 맡김에 시장 값(plkx) · 하루 횟수 적기');
  const pd = fnIn(T, 'prDecide', 'async function ');
  ok(/plkCondOk\(lk\) && \['approve', 'manual', 'revert'\]\.includes\(decision\)\) lkC = lk/.test(pd) && /plkClamp\(lkC, o\.price/.test(pd) && /\.\.\.\(lkC \? \{ plkx: PX \} : \{\}\)/.test(pd), '가격 결정 — 조건 잠금은 선 안에서만 결정 · 승인에 plkx');
  ok(/plkSkipped\(\[x\.key\], '가격 결정'\); throw/.test(pd), '가격 결정 — 완전·새로 잠금은 그대로 막음');
  const be = fnIn(T, 'bqExecCore', 'async function ') /* (recf1) 확정 본문은 바깥 bqExecCore */;
  ok(/const W = bqLockWhy\(p\.x, p\.price, M\); if \(!W\) continue; const v = W\.v; if \(W\.m !== 'cond'\) \{ lk\.push\(p\); continue; \}/.test(be) && /plkClamp\(v, p\.price, X\)/.test(be) /* (bqfix1 11/19) 갈래 판정은 공용 bqLockWhy(plkMode: 조건이 비었거나 기한 지남 = 새로 잠금) */ && /drop\(cdL,/.test(be), '수동 일괄 — 완전·새로 잠금은 건너뜀 · 조건 잠금은 선 밖이면 뺌');
  ok(/drop\(cut\.filter\(\(p\) => lotCheck\(p\.x\.l, p\.price\)\)/.test(be) && /plkx \? \{ plkx: \{ \.\.\.plkx \} \}/.test(be), '수동 일괄 — 줄인 값도 묶음 경계·하한선 다시 봄 · 승인에 plkx');
  ok(/plkClamp\(/.test(COL) && /\.plkx/.test(COL) && /noDay: (true|1|!0)/.test(COL), '수집기 — 고치기 직전 plkx로 다시 셈(하루 횟수는 또 세지 않음)');
  ok(/plkClamp\(/.test(CL) && /\.plkx/.test(CL), '클라우드 — 고치기 직전 plkx로 다시 셈');
  ok(/plkClamp\(/.test(WT) && /plkx/.test(WT), '가격 감시기 — 자동 승인도 조건 선 안에서');
  const R = rd('firestore/firestore.rules'); const PK = (R.match(/function plockKeys\(\) \{\s*return \[([^\]]+)\]/) || [])[1] || '';
  ok(['mode', 'cond', 'from', 'out', 'hit', 'day'].every((k) => PK.includes(`'${k}'`)), '서버 규칙 원본에 갈래·조건 칸(배포는 리드·fbops1)');
  const ps = fnIn(T, 'plkSet', 'async function ');
  ok(/PERMISSION/.test(ps) && /S\.plkOldRule = 1/.test(ps) && /서버 잠금 규칙이 아직 옛것/.test(ps), '규칙이 옛것이면 갈래 없이 잠금(=완전) · 조건은 저장 못 한다고 알림');
  ok(/plkSet\(l, true, \{ mode: 'new', out: true, from: plkFromOf\(b\) \}\)/.test(fnIn(T, 'plkToggle', 'async function ')), '🔓 누르면 🆕 새로 잠금(완전 잠금처럼 막음 · 그 자리에서 뺌)');
  ok(/plkExpire\(M\); plkPaint\(\)/.test(T), '기한 지난 조건 잠금은 새로 잠금으로 돌려 둠');
}

console.log('④ 화면 글(서랍·고르기 판·수동 일괄)');
{
  const dd = fnIn(T, 'plkDrDraw');
  ok(/\['new', '🆕 새로 잠금'\], \['full', '🔒 완전 잠금'\], \['cond', '🎚 조건 잠금'\]/.test(dd), '서랍 세 칸 + 전체');
  ok(/data-plkbk/.test(dd) && /data-plkmd/.test(dd) && /data-plkpm0="cond"/.test(dd) && /data-plkun/.test(dd), '서랍 카드 — ↩ 원래 자리로 · 완전으로 · 조건으로 · 풀기');
  ok(['#plkx', '#plkq', '#plkplat', '#plkgrp', '#plkall', '#plkaddgo', '#plkun2'].every((s) => dd.includes('id="' + s.slice(1) + '"')), '옛 서랍 단추(찾기·판매처·묶음·고른 것 풀기·여러 상품 잠그기) 그대로');
  const pp = fnIn(T, 'plkPopDraw');
  ok(/data-plkpm="full"/.test(pp) && /data-plkpm="cond"/.test(pp) && /PLK_CF\.map/.test(pp) && /id="plkPv"/.test(pp) && /data-plkpo/.test(pp), '고르기 판 — 완전·조건 · 조건 칸 · 미리 보기 · 그룹에서 빼기');
  ok(/twiceArm\(pu/.test(pp) && !/confirm\(|alert\(/.test(pp + fnIn(T, 'plkPopSave', 'async function ')), '풀기는 두 번 누름 · 브라우저 팝업 없음');
  const br = fnIn(T, 'drawBatchRes');
  ok(/if \(PLO\.has\(keyOf\(x\)\)\) return void outI\.push\(i\)/.test(br) && /class="plk-bout"/.test(br) && /data-plkfk="batch"/.test(br), '수동 일괄 — 잠가서 뺀 상품은 탭에서 빠지고 「서랍에서 되돌리기」 단추');
  ok(/'2026-11-1[89]'/.test(lineOf(T, "PAGE_GUIDES['plkf']")) && /잠금 세 갈래/.test(T), '화면 설명서 고침');
}

if (!process.env.RN_PORT) { console.log(bad ? `❌ ${bad}개 실패` : '✓ tLOCKCOND2_1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('⑤ 화면(가짜 클라우드 · 지어낸 책 · 배율 1)');
const SHOT = process.env.RN_SHOT || ''; const shot = async (p, n, sel) => { if (SHOT) { if (sel) await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.scrollIntoView({ block: 'center' }); }, sel); await p.waitForTimeout(150); fs.mkdirSync(SHOT, { recursive: true }); await p.screenshot({ path: path.join(SHOT, n + '.png') }); } };
const wait = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await wait(p, 400);
  /* 수동 일괄 그룹 */
  await p.evaluate(async () => { const now = new Date().toISOString(); const L = [...S.plist.values()].filter((l) => l.active).slice(0, 6);
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 300 * (j + 1), reasons: ['시험'], page1: [], at: now, out: false })); S.batchId = 'bL'; S.prBatches = [{ id: 'bL', name: '조건 잠금 시험' }];
    S.batchSt = { start: {}, picks: {}, decided: {}, held: {}, trashed: {}, added: {} }; S.batchEdit = {}; S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.bqOpen = new Set(); S.bqAddQ = '';
    try { localStorage.setItem('rn-bq-view', 'compact'); } catch (e) {} openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '조건 잠금 시험' }))); await new Promise((r) => setTimeout(r, 700)); });
  const n0 = await p.evaluate(() => document.querySelectorAll('#sheet .bqc').length);
  const k0 = await p.evaluate(() => { const b = document.querySelector('#sheet .bqc [data-plk]'); const k = b.dataset.plk; b.click(); return k; }); await wait(p, 900);
  const a1 = await p.evaluate((k) => { const v = plkMap().get(k) || {}; return { on: v.on, mode: v.mode, out: v.out, from: v.from, n: document.querySelectorAll('#sheet .bqc').length, bout: (document.querySelector('#sheet .plk-bout') || {}).textContent || '' }; }, k0);
  ok(a1.on && a1.mode === 'new' && a1.out === true && a1.from && a1.from.k === 'batch', '수동 일괄 줄에서 🔓 → 🆕 새로 잠금 · 잠근 자리(그룹) 기억', a1);
  ok(a1.n === n0 - 1 && /뺀 상품 1개/.test(a1.bout), '잠근 상품은 그 그룹에서 바로 빠지고 「뺀 상품 1개 · 서랍에서 되돌리기」', { n0, ...a1 });
  await shot(p, '1_수동일괄_뺀상품', '#sheet .plk-bout');
  /* 다른 줄 ▾ → 조건 잠금 */
  const k1 = await p.evaluate(() => { const o = document.querySelector('#sheet .bqc [data-plkopt]'); o.click(); return o.dataset.plkopt; }); await wait(p, 300);
  const pop = await p.evaluate(() => { const pp = document.getElementById('plkPop'); return pp ? { full: !!pp.querySelector('[data-plkpm="full"]'), cond: !!pp.querySelector('[data-plkpm="cond"].on'), cf: pp.querySelectorAll('[data-plkcf]').length, po: !!pp.querySelector('[data-plkpo]') } : null; });
  ok(pop && pop.full && pop.cond && pop.cf === 11 && pop.po, '▾ 누르면 그 자리에서 고르기 판(완전·조건 · 조건 칸 11 · 그룹에서 빼기 고르기)', pop);
  await shot(p, '2_고르기판_조건', '#plkPop');
  const e0 = await p.evaluate(async () => { document.getElementById('plkPs').click(); await new Promise((r) => setTimeout(r, 300)); return { e: (document.getElementById('plkPe') || {}).textContent || '', open: !!document.getElementById('plkPop') }; });
  ok(e0.open && /하나 이상/.test(e0.e), '조건 없이 저장하면 판이 안 닫히고 까닭', e0);
  await p.evaluate(async () => { const i = document.querySelector('#plkPop [data-plkcf="floor"]'); i.value = '5000'; i.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 100)); });
  const pv = await p.evaluate(() => (document.getElementById('plkPv') || {}).textContent || ''); ok(/5,000원/.test(pv), '미리 보기가 움직일 수 있는 곳을 보여 줌(5,000원 ~)', pv);
  await p.evaluate(async () => { document.getElementById('plkPs').click(); await new Promise((r) => setTimeout(r, 900)); });
  const a2 = await p.evaluate((k) => { const v = plkMap().get(k) || {}; return { mode: v.mode, cond: v.cond, out: v.out, pop: !!document.getElementById('plkPop'), inGroup: !!document.querySelector(`#sheet .bqc [data-plk="${k}"]`), btn: ((document.querySelector(`#sheet [data-plk="${k}"]`) || {}).textContent || '') }; }, k1);
  ok(a2.mode === 'cond' && a2.cond && a2.cond.floor === 5000 && !a2.pop, '조건 저장 → 🎚 조건 잠금(하한 5,000원) · 판 닫힘', a2);
  ok(a2.out === false && a2.inGroup && /🎚/.test(a2.btn), '빼기를 안 고르면 그룹에 남고(선 안에서 계속 바뀜) 단추는 🎚', a2);
  /* 서랍 — 세 칸 */
  await p.evaluate(async () => { plkDrawer({}); await new Promise((r) => setTimeout(r, 300)); });
  const d1 = await p.evaluate(() => { const dr = document.getElementById('plkDr'); const t = [...dr.querySelectorAll('[data-plktab]')].map((b) => b.dataset.plktab + ':' + b.textContent.replace(/\s+/g, ' ')); return { t, act: (dr.querySelector('[data-plktab].on') || {}).dataset ? dr.querySelector('[data-plktab].on').dataset.plktab : '', rows: dr.querySelectorAll('.plk-r').length }; });
  ok(d1.t.length === 4 && d1.act === 'new' && d1.rows >= 1, '서랍 — 새로·완전·조건·전체 칸 · 새로 잠금이 있으면 그 칸부터', d1);
  await shot(p, '3_서랍_새로잠금', '#plkDr');
  const a3 = await p.evaluate(async (k) => { const b = document.querySelector(`#plkDr [data-plkmd="${k}"]`); if (!b) return { no: 1 }; b.click(); await new Promise((r) => setTimeout(r, 900)); const v = plkMap().get(k) || {}; return { mode: v.mode, out: v.out }; }, k0);
  ok(a3.mode === 'full', '서랍 「🔒 완전으로」 → 완전 잠금 칸', a3);
  const a4 = await p.evaluate(async (k) => { const dr = document.getElementById('plkDr'); const tb = dr.querySelector('[data-plktab="full"]'); if (tb) tb.click(); await new Promise((r) => setTimeout(r, 200)); const b = document.querySelector(`#plkDr [data-plkbk="${k}"]`); if (!b) return { no: 1 }; b.click(); await new Promise((r) => setTimeout(r, 900)); const v = plkMap().get(k) || {}; return { on: v.on, mode: v.mode, out: v.out }; }, k0);
  ok(a4.on === true && a4.mode === 'full' && a4.out === false, '서랍 「↩ 원래 자리로」 → 잠금은 그대로 · 그룹으로 돌아감', a4);
  await shot(p, '4_서랍_완전잠금', '#plkDr');
  await p.evaluate(async () => { plkDrClose(); await new Promise((r) => setTimeout(r, 500)); });
  const a5 = await p.evaluate((k) => ({ inGroup: !!document.querySelector(`#sheet .bqc [data-plk="${k}"]`), bout: !!document.querySelector('#sheet .plk-bout'), lk: ((document.querySelector('#sheet #b_lkbar') || {}).textContent || '').replace(/\s+/g, ' ') }), k0);
  /* (bqfix1 · 정범님 I-1119-1619-18 「선택대기에 잠김 상품이 그대로 있어」) 그룹으로 되돌려도 🔒 완전 잠금이면 탭(선택 대기 등)에는 안 들어가고 「🔒 잠겨서 빠짐」에 셈 */
  ok(!a5.inGroup && !a5.bout && /잠겨서 빠짐 1개/.test(a5.lk) && /완전 잠금 1/.test(a5.lk), '되돌린 상품은 그룹으로 돌아오되 완전 잠금이라 탭이 아닌 「🔒 잠겨서 빠짐 1개」에', a5);
  /* 휴대폰 너비 — 아래 판 */
  await p.setViewportSize({ width: 360, height: 760 }); await wait(p, 300);
  await p.evaluate(async () => { const o = document.querySelector('#sheet [data-plkopt]'); o.click(); await new Promise((r) => setTimeout(r, 300)); });
  const m1 = await p.evaluate(() => { const pp = document.getElementById('plkPop'); if (!pp) return null; const r = pp.getBoundingClientRect(); return { bs: pp.classList.contains('bs'), w: r.width, sw: document.documentElement.scrollWidth }; });
  ok(m1 && m1.bs && m1.w <= 360 && m1.sw <= 362, '휴대폰(360px) — 아래 판으로 열리고 옆으로 넘치지 않음', m1);
  await shot(p, '5_휴대폰_고르기판');
  await p.keyboard.press('Escape'); await wait(p, 200); ok(!(await p.evaluate(() => !!document.getElementById('plkPop'))), 'Esc로 닫힘');
  ok(dlg.length === 0, '브라우저 팝업 0', dlg);
}, { vp: { width: 1280, height: 900 } }).then(() => { console.log(bad ? `❌ ${bad}개 실패` : '✓ tLOCKCOND2_1118 통과'); process.exit(bad ? 1 : 0); });
