// tBQMAN2_1118 — (11/18 정범님 I-1118-2059-24.1·24.2 · I-1118-2108-25) 수동 일괄
//  · 24.1 입력칸에 가격을 치면 추천가가 바로 바뀜 · 원래 추천가 옆 작은 「추천가로」
//  · 24.2 📉 3개이하/미등록 탭(유효 3개 이하·우리뿐·미등록 보라) — 분류만(값·자료는 그대로) · 공용 탭 목록 BQ_TABDEF
//  · 25 🔖 판본 키워드 모으기 — 이미 운영 중인 판본 판정 edOf를 그대로(새 낱말 목록 없음) · 수동 일괄 = 모든 탭 · 등록 = 선택 대기만
// 실행: node tBQMAN2_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const blk = cut('const BQ_TABDEF = [', 'function bqSoldHtml(') + cut('const BKF_TB = BQ_TABDEF', 'const BKF_TBQ = [];');
const EDR = { 'A 리커버 한정판': { on: true, kw: ['리커버', '한정판'], br: [], note: [], tier: 3 }, 'B (사인본)': { on: true, kw: [], br: ['사인본'], note: ['친필'], tier: 2 } };
const mk = (o) => new Function('unregOf', 'OBS_VALID', 'needSearch', 'edOf', 'edPickOf', 'edUse', 'bbNearX', 'lotCheck', blk + '\nreturn { BQ_TABDEF, BQ_TAB_ALWAYS, BQ_FEW_N, bqFewOf, edKwOn, edKwHits, edKwState, bqCls, BKF_TB, BKF_TBX };')(
  (l) => !!l.unreg, new Set(['green', 'blue']), () => !!o.need, (l) => EDR[l.title] || null, (l) => (o.pick || {})[l.title] || null, (l) => (o.use || {})[l.title] || null, () => false, () => false);
const M = mk({});
console.log('① 공용 탭 목록 BQ_TABDEF');
{ const keys = M.BQ_TABDEF.map((d) => d[0]); ok(keys.join(',') === 'sel,pick,done,ok,few,keep,bb,lot,gone,edkw,hold,trash,sold', '탭 차례(조건 이미 부합 바로 옆 3개이하/미등록 · 판본 키워드 포함)', keys);
  ok(M.BQ_TABDEF.every((d) => d.length >= 5 && typeof d[3] === 'string' && d[3].length > 10), '탭마다 [열쇠, 이름, 짧은 이름, 설명, 묶음 칸]');
  ok(M.BKF_TB.some((x) => x[0] === 'few') && [...M.BKF_TB, ...M.BKF_TBX].some((x) => x[0] === 'edkw'), '묶음 상태판(BKF_TB·BKF_TBX)도 같은 목록에서 — few·edkw 들어감');
  ok(M.BQ_TAB_ALWAYS.has('few') && !M.BQ_TAB_ALWAYS.has('edkw'), '3개이하/미등록은 늘 보임 · 판본 키워드는 모았을 때만'); }
console.log('② bqFewOf — 3개이하/미등록 판정');
{ const P = (a) => a.map((c) => ({ c }));
  ok(M.bqFewOf({ l: { unreg: 1 } }) === '미등록 상품(보라 시장 지표)', '미등록(보라)');
  ok(M.bqFewOf({ l: {}, page1: P(['ours']) }) === '상품이 우리밖에 없음', '우리뿐');
  ok(M.bqFewOf({ l: {}, page1: P(['ours', 'red', 'gray']) }) === '유효 상품이 우리밖에 없음', '유효 상품이 우리뿐');
  ok(/유효 상품 3개/.test(M.bqFewOf({ l: {}, page1: P(['green', 'blue', 'green', 'red']) }) || ''), '유효 3개 → 3개이하');
  ok(M.bqFewOf({ l: {}, page1: P(['green', 'blue', 'green', 'blue']) }) === null, '유효 4개 → 그대로');
  ok(M.bqFewOf({ l: {}, page1: P(['green']), m: { usedTotal: 9 } }) === null, '첫 쪽 뒤에 더 있으면 옮기지 않음');
  ok(M.bqFewOf({ l: {}, page1: [] }) === null, '시장 자료가 없으면 판정 안 함(추천 못 함 그대로)'); }
console.log('③ bqCls — 분류만');
{ const st = (o) => ({ picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {}, ...o }); const k = 'aladin_U1';
  const x = { l: { usedCode: 'U1', price: 9000 }, target: 8000, page1: [{ c: 'ours' }] };
  ok(M.bqCls(x, { st: st() }) === 'few', '우리뿐 → few');
  ok(M.bqCls(x, { st: st({ fewsel: { [k]: { at: 'x' } } }) }) === 'sel', '「선택 대기로」 표시 → sel');
  ok(M.bqCls(x, { st: st({ edkw: { [k]: { from: 'few' } } }) }) === 'edkw', '판본 키워드 표시 → edkw');
  ok(M.bqCls(x, { st: st({ edkw: { [k]: { from: 'few' } }, trashed: { [k]: 1 } }) }) === 'trash', '휴지통이 판본 키워드보다 먼저');
  ok(M.bqCls(x, { st: st({ picks: { [k]: { price: 8000 } } }) }) === 'pick', '결정 대기가 3개이하보다 먼저');
  const y = { l: { usedCode: 'U2', price: 9000 }, target: 8000, page1: [{ c: 'green' }, { c: 'green' }, { c: 'blue' }, { c: 'green' }] };
  ok(M.bqCls(y, { st: st() }) === 'sel', '시장이 넉넉하면 그대로 선택 대기'); }
console.log('④ 판본 키워드 = edOf 그대로');
{ ok(M.edKwOn({ title: 'A 리커버 한정판' }) && !M.edKwOn({ title: '보통 책' }), 'edOf가 on일 때만 모음');
  const h = M.edKwHits({ title: 'B (사인본)' }); ok(h.includes('(사인본)') && h.includes('유의:친필'), '근거 = 낱말·괄호·유의 사항', h);
  const M2 = mk({ pick: { 'A 리커버 한정판': { itemId: '1' } }, use: { 'B (사인본)': 'check' } });
  ok(/이미 판을 정함/.test(M2.edKwState({ title: 'A 리커버 한정판' })), '사람이 판을 고른 상품 표시(edPickOf)');
  ok(M2.edKwState({ title: 'B (사인본)' }) === '사람 확인 필요', '사람 확인 필요(edUse)');
  ok(!/const ED_KW_LIST|edKwList/.test(T), '새 낱말 목록을 따로 만들지 않음'); }
console.log('⑤ 화면 글·묶음');
{ ok(/data-bqrec="\$\{i\}"[^>]*>추천가로<\/button>/.test(T), '24.1 원래 추천가 옆 「추천가로」 단추');
  ok(/el\._bqT = setTimeout/.test(T) && /bqVLive\(ii, vv\)/.test(T), '24.1 입력하면 그 자리에서 추천가 칸을 다시 그림');
  ok(/label: '🔖 판본 키워드 모으기'[^\n]*all: \(\) => cand\(\)\.length/.test(T), '수동 일괄 살핀 패널 — 모든 탭');
  ok(/const cand = \(\) => by\.sel\.filter\(\(it\) => edKwOn\(regEdL\(it\)\)\)/.test(T), '등록 살핀 패널 — 선택 대기만');
  ok(/data-rgekback=/.test(T) && /data-bunedkw=/.test(T) && /data-bunfew=/.test(T), '원래 탭으로 되돌리는 단추(등록·수동 일괄 둘 다)');
  ok((T.match(/data-edlist="1"/g) || []).length >= 2, '🔖 판본 확인 목록 단추');
  ok(!/\b(alert|confirm|prompt)\(['"`]🔖/.test(T), '브라우저 팝업 없음');
  for (const f of ['fewsel', 'edkw']) ok(new RegExp(`BITEM = new Set\\(\\[[^\\]]*'${f}'`).test(T) && new RegExp(`for \\(const f of \\[[^\\]]*'${f}'[^\\]]*\\]\\) \\{ const loc`).test(T), `${f} — 조각 저장·합치기에 들어감`); }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
