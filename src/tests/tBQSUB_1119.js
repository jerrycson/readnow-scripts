// tBQSUB_1119 — (11/19 정범님 I-1119-1619-18) 수동 일괄 「3개이하/미등록·추천 못 함·보류」 탭에도
//  선택 대기와 같은 하위 탭(전체·⬇ 내림·⬆ 오름·＝ 그대로·❔ 추천가 없음) · ⚡ 빠르게 고르기 · (보류) 고르기·결정 대기로
//  탭 이름 대신 탭 동작 표시(sub·quick · 보류는 g 칸 = 그룹 화면에서만 합침 · 관제창은 그대로)
// 실행: node tBQSUB_1119.js · 시험 자료에 손님 정보 없음 · 순수 글·셈 검사
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const blk = cut('const BQ_TABDEF = [', 'function bqSoldHtml(');
const M = new Function('unregOf', 'OBS_VALID', 'needSearch', 'edOf', 'edPickOf', 'edUse', 'bbNearX', 'lotCheck', blk + '\nreturn { BQ_TABDEF, BQ_TABACT, BQ_TABACT_G, bqTabsOf, bqPxGate };')(
  () => false, new Set(['green', 'blue']), () => false, () => null, () => null, () => null, () => false, () => false);
const D = cut('function drawBatchRes(', '\nfunction ') + cut('function batchCardK(', '\nfunction drawBatchRes('); /* (allcard1) 카드 도우미·카드 글은 batchCardK·batchCardHtml로 옮김(그룹 화면·관제소 안쪽 창이 함께 씀) */
console.log('① 탭 동작 표시');
{ for (const t of ['sel', 'few', 'keep']) { const a = M.BQ_TABACT_G(t); ok(a.sub && a.quick && a.edit, `${t} = 하위 탭(sub) · 빠르게 고르기(quick) · 값 고침(edit)`, a); }
  const H = M.BQ_TABACT_G('hold'); ok(H.edit && H.sub && H.quick && H.chk === 'holdsel', '보류(그룹 화면) = 선택 대기와 같은 동작 + 고르기(holdsel)', H);
  const H0 = M.BQ_TABACT('hold'); ok(!H0.edit && !H0.pin && !H0.chk && !H0.sub, '관제창이 읽는 BQ_TABACT(hold)는 그대로(동작 없음) — g 칸에만 있음', H0);
  ok(!M.bqTabsOf('chk').includes('hold') && !M.bqTabsOf('edit').includes('hold'), 'bqTabsOf는 보류를 안 넣음(관제창 보호)', M.bqTabsOf('edit'));
  ok(M.bqTabsOf('chk').join(',') === 'few,keep', 'bqTabsOf(chk) 그대로'); }
console.log('② 화면 글 검사');
{ ok(/: TA\.sub \? bqSubOf\(L, R, BEi, keyOf\) : null;/.test(D), '하위 탭은 탭 이름이 아니라 TA.sub로');
  ok(/S\.batchSubX/.test(D) && /setSub\(/.test(D), '탭마다 하위 탭 기억(batchSubX) · setSub');
  ok(/\$\{TA\.quick \? \(\(\) => \{ const bb = batchBase\(\)/.test(D), '⚡ 빠르게 고르기 줄은 TA.quick으로');
  ok(!/T === 'sel' && S\.batchPctSort/.test(D) && /TA\.quick && S\.batchPctSort/.test(D), '% 이내 모아 보기도 TA.quick으로');
  ok(/const needOf = \(x\) => !!TA\.need \|\| \(T === 'hold' && x\.target == null\)/.test(D), '보류 안 추천가 없는 상품은 추천 못 함처럼(빈 칸 · 바닥 검사)');
  ok(/const heldOut = \(keys\)/.test(D) && /const hoc = heldOut\(keys\)/.test(D) && /held: hoc\.p/.test(D), '결정 대기로 보낼 때 보류 표지를 풂(일괄·하나씩·전체 고르기)');
  ok(/TA\.chk === 'holdsel'/.test(D) && /bqLogN\('unhold'/.test(D), '보류 고르기 줄 = 「↩ 선택 대기로」 한꺼번에 + 기록');
  ok(/const SUMT = \[[^\]]*'hold'\]/.test(D) && /hold: '지금 판매가/.test(D), '보류 탭에도 합계(이득·손해) 줄');
  ok(/function bqSubBar\(SUB, MF, P, nm\)/.test(T), '하위 탭 줄이 탭 이름을 받음(선택 대기 글 고정 아님)');
  ok(/S\.batchSubX = \{\}/.test(D), '탭·그룹을 바꾸면 하위 탭 기억을 비움'); }
console.log('③ 판 글 · 안내');
{ const h = T.match(/'나중에 볼 상품 — 카드의[^']*'/); ok(h && /하위 탭/.test(h[0]) && /빠르게 고르기/.test(h[0]) && /보류는 풀림/.test(h[0]), '보류 탭 안내글에 하위 탭 · 빠르게 고르기 · 보류 풀림 설명', h && h[0].slice(0, 120)); }
console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ tBQSUB_1119 전부 통과'); process.exit(bad ? 1 : 0);
