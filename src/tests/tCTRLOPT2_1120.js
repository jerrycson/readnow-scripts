/* tCTRLOPT2_1120 — (11/20 ctrlopt2) 🛰 관제소 속도·버그 고침 시험
 *  ① 함수가 다른 함수 안에 끼어 있지 않음(ckFoldSoldKeys 같은 일) — acorn이 있으면 문법 나무로, 없으면 이름 검사만
 *  ② bkfNR: 같은 묶음 문서면 깊은 복사 한 번 · 문서가 바뀌면 새로 · 결과는 bkfNorm과 같음 · 자주 그리는 곳이 bkfNR을 씀
 *  ③ ckSoldAgg·ckSoldPer: 크기가 같아도 다른 상품 모음이면 다시 셈 · 조회수 창은 판매수 창과 칸을 나눔
 *  ④ ckFoldKeys: 없는 묶음 = 늘 같은 빈 Set
 *  ⑤ bkfTbKick: 그룹마다 상태판을 다시 그리지 않음(0.4초에 한 번 + 끝에 한 번) · 마지막 그룹이 빠져도 끝 그림
 *  ⑥ ctrlKpiPaint가 카드 셈 오류에 멈추지 않음 · bkfTbPaint가 맨 위 줄 오류에도 그룹 세기를 시작
 *  손님 이름·전화 없음 · 팝업 없음 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const H = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
const HL = H.split('\n');
let fail = 0; const ok = (c, m) => { if (c) console.log('  ✓ ' + m); else { fail++; console.log('  ❌ ' + m); } };

function grab(name) { const re = new RegExp('^(async )?function ' + name + '\\(|^const ' + name + ' = |^let ' + name + ' = '); let i = HL.findIndex((l) => re.test(l));
  if (i < 0) { const r2 = new RegExp('(^|[;\\s])(const|let) ' + name + ' = '); i = HL.findIndex((l) => r2.test(l)); } if (i < 0) throw new Error('못 찾음: ' + name);
  let acc = ''; for (let j = i; j < i + 80; j++) { acc += HL[j] + '\n'; try { new vm.Script(acc); return acc; } catch (e) {} } throw new Error('못 뗌: ' + name); }
function mk(extra) { const ctx = vm.createContext({ console, Map, Set, WeakMap, Date, JSON, Math, String, Number, isFinite, Array, Object, RegExp, Promise, Intl, setTimeout, clearTimeout, ...(extra || {}) }); const got = new Set();
  const load = (n) => { if (got.has(n)) return; got.add(n); vm.runInContext(grab(n).replace(/(^|; )const /g, '$1var ').replace(/(^|; )let /g, '$1var '), ctx); };
  const run = (code) => { for (let t = 0; t < 80; t++) { try { return vm.runInContext(code, ctx); } catch (e) { const m = /^(\w+) is not defined/.exec(e.message); if (!m) throw e; load(m[1]); } } throw new Error('이름이 너무 많이 빠짐'); };
  return { ctx, load, run }; }
const body = (name) => grab(name);

console.log('① 함수가 다른 함수 안에 끼지 않음');
{ let acorn = null; for (const p of ['acorn', '/opt/node-tools/node_modules/acorn']) { try { acorn = require(p); break; } catch (e) {} }
  if (acorn) { const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m, nested = [], top = new Set(), perr = 0;
    while ((m = re.exec(H))) { let ast; try { ast = acorn.parse(m[1], { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowReturnOutsideFunction: true }); } catch (e) { perr++; continue; }
      for (const n of ast.body) if (n.type === 'FunctionDeclaration') top.add(n.id.name);
      const walk = (n, d) => { if (!n || typeof n.type !== 'string') return; if (n.type === 'FunctionDeclaration' && d > 0 && n.loc.start.column === 0) nested.push(n.id.name); const d2 = d + (/Function/.test(n.type) ? 1 : 0); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === 'string' && walk(x, d2)); else if (v && typeof v.type === 'string') walk(v, d2); } };
      for (const n of ast.body) walk(n, 0); }
    ok(perr === 0, '안쪽 스크립트 모두 문법 맞음');
    ok(nested.length === 0, '줄 맨 앞에서 시작하는데 다른 함수 안에 든 함수 없음' + (nested.length ? ' — ' + nested.join(',') : ''));
    for (const n of ['ckFoldKeys', 'ckFoldSoldKeys', 'ckSoldPer', 'ckSoldAgg', 'ctrlKpiPer', 'ctrlKpiCards', 'bkfNR', 'bkfTbKick', 'bkfTbPaint']) ok(top.has(n), n + ' = 맨 바깥 함수');
  } else { console.log('  (acorn 없음 — 이름 검사만)'); ok(/\n\}?[^\n]*return s; \}\n(\/\*[^\n]*\n)*( \*[^\n]*\n)*function ckFoldSoldKeys\(/.test(H), 'ckFoldSoldKeys가 ckFoldKeys 끝 줄 뒤'); }
}

console.log('② bkfNR');
{ const { run } = mk(); run(`var S = {}; var BKF_JMAX = 30; S.bkfold = { order: ['f:f_a'], folds: { f_a: { name: 'A', gids: ['b_1', 'b_2'], joined: { b_1: ['2026-11-01T00:00:00Z'] } } } };`);
  const a = run('bkfNR()'), b = run('bkfNR()');
  ok(a === b, '같은 문서면 같은 결과(깊은 복사 안 함)');
  ok(JSON.stringify(a) === JSON.stringify(run('bkfNorm(S.bkfold, null)')), '결과는 bkfNorm(S.bkfold, null)과 같음');
  run(`S.bkfold = { ...S.bkfold, folds: { ...S.bkfold.folds, f_b: { name: 'B', gids: ['b_3'] } } }`); const c = run('bkfNR()');
  ok(c !== a && !!c.folds.f_b, '문서가 바뀌면(새 객체) 새로 셈');
  run('S.bkfold = null'); ok(Object.keys(run('bkfNR()').folds).length === 0, '문서가 없으면 빈 묶음');
  for (const n of ['ctrlFolds', 'ckWatch', 'bkfPaint', 'bkfBand', 'bkfGroups', 'bkfTbPaint', 'bkfPopPaint', 'bkfTopN', 'ctrlKpiCalc']) { const t = body(n); ok(t.includes('bkfNR()') && !t.includes('bkfNorm(S.bkfold, null)'), n + ' = bkfNR(읽기만)'); }
  ok(!/bkfNR\(\)[^;\n]{0,40}\.(push|splice)\(|bkfNR\(\)\.folds\[[^\]]+\]\s*=[^=]/.test(H), 'bkfNR 결과를 고치는 곳 없음');
  ok(/PBy\.get\(g\)/.test(body('ckWatch')) && !/S\.prBatches\.find/.test(body('ckWatch')), 'ckWatch: 그룹 찾기 = Map(묶음 그룹마다 목록 훑지 않음)');
}

console.log('③ 판매 셈 기억 — 같은 모음인지');
{ const { run } = mk(); run(`var S = { plist: new Map(), orders: new Map(), dv: { o: 1, p: 1 } };
    S.plist.set('aladin_1', { id: 'aladin_1', usedCode: '1', isbn13: '9780000000001' }); S.plist.set('aladin_2', { id: 'aladin_2', usedCode: '2', isbn13: '9780000000002' });
    const at = new Date(Date.now() - 3600e3).toISOString();
    S.orders.set('o1', { id: 'o1', kind: 'sale', platform: 'aladin', orderNo: 'N1', orderedAt: at, items: [{ lineStatus: 'normal', aladinUsedCode: '1', qty: 2, price: 1000 }] });`);
  const A = run(`var KA = new Set(['aladin_1']); ckSoldPer(KA, 'f:x')`); const B = run(`var KB = new Set(['aladin_2']); ckSoldPer(KB, 'f:x')`);
  ok(A.a.c === 2, '모음 A(팔린 상품) → 전체 2권');
  ok(B.a.c === 0, '크기가 같은 다른 모음 B → 0권(예전엔 A 값을 그대로 돌려줌)');
  ok(run(`ckSoldPer(KB, 'f:x')`) === B, '같은 모음이면 기억 그대로');
  const SA = run(`ckSoldAgg(KA, 'f:y')`), SB = run(`ckSoldAgg(KB, 'f:y')`);
  ok(SA !== SB, 'ckSoldAgg도 크기가 같은 다른 모음이면 다시 셈');
  ok(run(`ckSoldAgg(KB, 'f:y')`) === SB, 'ckSoldAgg 같은 모음이면 기억 그대로');
  ok(/ckSoldAgg\(keys, tag \+ '#v'\)/.test(body('ckWinV')), '조회수 창(ckWinV)은 판매수 창과 다른 칸 — 같은 갈래에 다른 모음으로 서로 지우지 않음');
}

console.log('④ 없는 묶음');
{ const { run } = mk(); run(`var S = { bkfold: { order: [], folds: {} }, prBatches: [], _bkfTb: {} }; var BKF_JMAX = 30;`);
  const a = run(`ckFoldKeys('f_gone')`), b = run(`ckFoldKeys('f_gone')`);
  ok(a instanceof Set && a.size === 0 && a === b, '없는·지운 묶음 = 늘 같은 빈 Set(판매 셈 기억이 맞음)');
  ok(run(`ckSoldPer(ckFoldKeys('f_gone'), 'f:f_gone')`).a.c === 0, '빈 묶음 판매수 0 · 오류 없음');
}

console.log('⑤ bkfTbKick 다시 그림 횟수');
async function kick(n, ms, skipLast) { const { ctx, run, load } = mk(); load('BKF_TBQ');
  run(`var S = { detail: { bkfold: 'f_a' }, _bkfTb: {}, prBatches: [] }; var __pc = 0, __on = 0; for (let i = 0; i < ${n}; i++) S.prBatches.push({ id: 'b_' + i });
    bkfGl = (g) => S.prBatches.find((x) => x.id === g) || null; bkfTbSig = () => 's'; bkfTbPaint = () => { __pc++; }; bkfPopPaint = () => {}; ctrlOnTb = () => { __on++; }; ctrlReorgSeen = async () => {}; bkfSIdx = () => null; errKo = (e) => String(e);
    bkfTbSum = () => ({ n: {}, amt: {}, blk: {} }); bqCtx = () => new Promise((r) => setTimeout(() => r({ g: {} }), ${ms}));
    for (const b of S.prBatches) BKF_TBQ.push(b.id); ${skipLast ? "BKF_TBQ.push('b_gone');" : ''}`);
  await run('bkfTbKick()'); return { pc: run('__pc'), on: run('__on'), done: n === Object.keys(ctx.S._bkfTb).length }; }
(async () => {
  const r1 = await kick(30, 20, false);
  ok(r1.done, '30그룹 모두 셈');
  ok(r1.pc >= 1 && r1.pc <= 4, `30그룹(그룹마다 20ms) → 상태판 다시 그림 ${r1.pc}번(예전 30번)`);
  ok(r1.on === 30, '🗼 모아 보기 알림(ctrlOnTb)은 그룹마다 그대로');
  const r2 = await kick(3, 150, true);
  ok(r2.pc >= 1, `마지막이 없는 그룹이어도 끝에 그림(${r2.pc}번)`);
  const k = body('bkfTbKick'); ok(/finally \{[^\n]*pend[^\n]*bkfTbPaint\(\)/.test(k), '못 그린 채 끝나면 finally에서 한 번 그림');

  console.log('⑥ 오류에 멈추지 않음');
  { const { ctx, run } = mk(); const el = { innerHTML: '' }; ctx.__el = el;
    run(`var S = { detail: { bkfold: 'f_a' } }; var document = { getElementById: () => __el }; ctrlKpiCards = () => { throw new Error('셈 오류'); }; errKo = (e) => String(e && e.message);`);
    let threw = false; try { run('ctrlKpiPaint()'); } catch (e) { threw = true; }
    ok(!threw && /수치 카드를 못 그림/.test(el.innerHTML), 'ctrlKpiPaint: 카드 셈이 던져도 안내 글만 · 부른 쪽은 계속'); }
  ok(/try \{ bkfTopPaint\(\); \} catch \(e\) \{\} if \(q\) bkfTbKick\(\);/.test(body('bkfTbPaint')), 'bkfTbPaint: 맨 위 줄이 틀려도 그룹 세기(bkfTbKick) 시작');

  console.log(fail ? `\n❌ ${fail}개 실패` : '\n✅ 모두 통과'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
