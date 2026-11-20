// tTABBAR — (11/19 정범님 I-1118-2245-28.4 판 ⑤) 세 화면(재고 품목·수동 일괄·등록) 탭 줄을 공용 부품 tabBarHtml로 갈아 끼움 → 예전 세 벌의 결과 HTML과 글자 하나까지 같은지 · 🧮 수동 일괄 선택 대기로(고른 재고 → 대상 고정 그룹을 엶 · 저장 안 함) · 옛 모드 단추 빠짐
// 실행: node tTABBAR_1119.js · 시험 자료는 가짜 상품만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return T.slice(i, j); };
const num = (n) => Number(n).toLocaleString('ko-KR'); const won = (n) => num(n) + '원'; const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TB = cut('function tabBarHtml(', '\nfunction stkTabBar(');
const STKB = cut('function stkTabBar(', '\n');
const tabBarHtml = new Function(TB + '; return tabBarHtml;')();
const evalConst = (name) => { const s = cut('const ' + name + ' = ', '];'); return new Function('return ' + s.slice(('const ' + name + ' = ').length) + ']')(); };
const STK_TABDEF = evalConst('STK_TABDEF'); const STK_Y24NO = evalConst('STK_Y24NO'); const REG_TABS = evalConst('REG_TABS');
const stkTabBar = new Function('tabBarHtml', 'STK_TABDEF', 'STK_Y24NO', 'num', STKB + '; return stkTabBar;')(tabBarHtml, STK_TABDEF, STK_Y24NO, num);

console.log('① 재고 품목 탭 줄 — 예전 판(판 ①) 글과 같음');
{ const OLD = (cur, cnt, y24) => `<div class="btabs stkt">${STK_TABDEF.filter((d) => !(y24 && STK_Y24NO.includes(d[0]))).map((d) => `<button class="${cur === d[0] ? 'on' : ''}${cnt[d[0]] ? '' : ' z'}" data-stktab="${d[0]}" title="${d[3]}"><span class="ts">${d[2]}</span><span class="tn">${d[1]}</span> <b>${num(cnt[d[0]] || 0)}</b></button>`).join('')}</div>`;
  const cnt = Object.fromEntries(STK_TABDEF.map((d, i) => [d[0], i % 3 ? i * 1234 : 0]));
  for (const cur of [STK_TABDEF[0][0], STK_TABDEF[2][0], 'edkw', 'zzz']) for (const y of [false, true]) ok(stkTabBar(cur, cnt, y) === OLD(cur, cnt, y), `지금 탭 ${cur} · 예스24 ${y}`);
  ok(STK_TABDEF.length >= 7, '재고 탭 수', STK_TABDEF.length); }

console.log('② 수동 일괄 탭 줄 — 예전 drawBatchRes 글과 같음');
{ const line = T.split('\n').find((x) => x.includes('tabBarHtml(TT, T,')); ok(!!line, '수동 일괄이 공용 부품을 부름');
  const NEW = new Function('tabBarHtml', 'TT', 'T', 'SOLD', 'tabs', 'tabSum', 'refBarHtml', 'refPanelHtml', 'return `' + line.trim().replace(/^`|`$/g, '') + '`;');
  const OLD = (TT, T, SOLD, tabs, tabSum) => `<div class="btabs">${TT.map(([k, l], j) => `${j === 3 ? '<span class="bsep"></span>' : j > 3 ? ' ' : j ? '<span class="barr">›</span>' : ''}<button class="${T === k ? 'on' : ''}" data-btab="${k}">${l} <b>${k === 'sold' ? SOLD.rows.length : tabs[k].length}</b>${tabSum(k)}</button>`).join('')}</div>`;
  const BQ = evalConst('BQ_TABDEF'); const TT = BQ.map((d) => [d[0], d[1], d[3]]); const tabs = Object.fromEntries(BQ.map((d, i) => [d[0], new Array(i * 2).fill(0)])); const SOLD = { rows: [1, 2, 3] }; const tabSum = (k) => (k === 'pick' ? ' <small>₩9,000 · 손실 1,200</small>' : '');
  for (const cur of ['sel', 'pick', 'edkw', 'sold', 'trash']) ok(NEW(tabBarHtml, TT, cur, SOLD, tabs, tabSum, () => '', () => '') === OLD(TT, cur, SOLD, tabs, tabSum), `지금 탭 ${cur}`);
  ok(NEW(tabBarHtml, TT.slice(0, 2), 'sel', SOLD, tabs, tabSum, () => '', () => '') === OLD(TT.slice(0, 2), 'sel', SOLD, tabs, tabSum), '탭 일부만 보일 때(상품 없는 탭 숨김)'); }

console.log('③ 등록 탭 줄 — 예전 등록 화면 글과 같음');
{ const line = T.split('\n').find((x) => x.includes('tabBarHtml(REG_TABS, T,')); ok(!!line, '등록이 공용 부품을 부름');
  const expr = line.slice(line.indexOf('tabBarHtml(REG_TABS'), line.indexOf(') + `') + 1);
  const NEW = new Function('tabBarHtml', 'REG_TABS', 'T', 'by', 'sums', 'nDup', 'num', 'won', 'return ' + expr + ';');
  const OLD = (T, by, sums, nDup) => REG_TABS.map(([k, l], j) => `${j ? '<span class="barr">›</span>' : ''}<button class="${T === k ? 'on' : ''}${k === 'pick' ? ' rgpickt' + (nDup ? ' hasdup' : '') : ''}" data-rgt="${k}">${l} <b>${k === 'sel' ? by.sel.length + by.bbr.length : by[k].length}</b>${k !== 'q' && sums[k].sum ? ` <small>${won(sums[k].sum)}</small>` : ''}${k === 'pick' ? `<span class="rgdupq" data-rgdupq="1" title="♻ 기등록 — 우리 재고에 같은 상품이 있는 상품 ${nDup ? num(nDup) + '개 · 누르면 기등록 하위 탭' : '없음'}">${nDup ? `♻ 기등록 <b>${num(nDup)}</b>` : ''}</span>` : ''}</button>`).join('');
  const by = { q: [1], sel: [1, 2], bbr: [1], pick: [1, 2, 3, 4], done: [] }; const sums = { q: { sum: 5 }, sel: { sum: 12000 }, pick: { sum: 0 }, done: { sum: 3300 } };
  for (const cur of ['q', 'sel', 'pick', 'post']) for (const nDup of [0, 7]) ok(NEW(tabBarHtml, REG_TABS, cur, by, sums, nDup, num, won) === OLD(cur, by, sums, nDup), `지금 탭 ${cur} · 기등록 ${nDup}`); }

console.log('④ 공용 부품 자체');
{ const h = tabBarHtml([['a', '가', 't<1>'], ['b', '나']], 'b', { attr: 'data-x', ti: (d) => d[2], n: (k) => (k === 'a' ? 3 : 0) });
  ok(h === '<button class="" data-x="a" title="t<1>">가 <b>3</b></button><button class="on" data-x="b">나 <b>0</b></button>', '단추·지금 탭·title(없으면 안 붙음 · 이스케이프는 부르는 쪽)', h);
  ok(tabBarHtml([], 'a') === '', '빈 목록 = 빈 글'); ok(/data-tab="a"/.test(tabBarHtml([['a', '가']], '')), '속성 기본 data-tab'); }

console.log('⑤ 🧮 수동 일괄 선택 대기로 — 고른 재고로 대상 고정 그룹을 엶 · 여기선 저장 안 함');
{ const BLK = cut('function stkBqPlan(', '/* ◆stkbq 끝 */'); const asks = []; const toasts = []; let opened = null, ran = 0; const hist = [];
  const plist = new Map(); const add = (id, o) => plist.set(id, { id, title: '책 ' + id, ...o });
  add('aladin_1', { active: true, usedCode: '1001' }); add('aladin_2', { active: true, usedCode: '1002' }); add('aladin_3', { active: false, usedCode: '1003' }); add('aladin_4', { active: true, usedCode: '' }); add('yes24_5', { active: true, usedCode: '9' });
  const S = { plist };
  const env = { S, toast: (m, e) => toasts.push([m, e]), num, askText: async (m, d) => { asks.push([m, d]); return asks.answer === undefined ? d : asks.answer; }, kTime: () => '11-19 12:34', BATCH_DEF: { name: '', grades: [], only: [], ctrlPct: 0, critOff: false, recentDays: 30 }, history: { pushState: (s) => hist.push(s) },
    openBatch: (c) => { opened = c; }, $: (q) => (q === '#sheet' ? { querySelector: (x) => (x === '#b_run' ? { click: () => ran++ } : null) } : null) };
  const names = Object.keys(env); const F = new Function(...names, BLK + '; return { stkBqPlan, stkToBatch };')(...names.map((k) => env[k]));
  const P = F.stkBqPlan(['aladin_1', 'aladin_2', 'aladin_3', 'aladin_4', 'yes24_5', 'aladin_none']);
  ok(P.L.map((l) => l.usedCode).join() === '1001,1002' && P.no === 3 && P.why['판매중 아님'] === 1 && P.why['상품번호 없음'] === 1 && P.why['예스24'] === 1, '알라딘 판매중·상품번호 있는 것만 · 뺀 까닭별 수', P);
  (async () => {
    const snap = JSON.stringify([...plist.values()]);
    const n = await F.stkToBatch(['aladin_1', 'aladin_2', 'aladin_3']);
    ok(n === 2 && opened && opened.only.join() === '1001,1002', '고른 2개로 대상 고정(only)', opened);
    ok(opened.name === '📦 재고에서 고른 2개 1119' && opened.fixLbl && opened.recentDays === 0 && opened.obs === 'stock:sel', '그룹 이름(물음 기본값)·대상 고정 표시·최근 바꾼 상품 거르기 끔', opened);
    ok(S.batchT === 'sel' && S.batchId === null && S.batchC === null && ran === 1 && hist.length === 1, '새 그룹(아직 저장 안 함) · 선택 대기 탭 · 계산 한 번 돌림');
    ok(/확정 전에는 가격이 바뀌지 않음/.test(asks[0][0]) && /뺀 1개: 판매중 아님 1/.test(asks[0][0]), '물음에 저장·가격 안내와 뺀 까닭', asks[0][0]);
    ok(JSON.stringify([...plist.values()]) === snap, '재고 자료는 그대로');
    opened = null; asks.answer = null; ok(await F.stkToBatch(['aladin_1']) === 0 && opened === null, '이름 물음에서 취소하면 안 엶');
    asks.answer = '   '; ok(await F.stkToBatch(['aladin_1']) === 0 && opened === null, '빈 이름이면 안 엶');
    asks.answer = undefined; const t0 = toasts.length; ok(await F.stkToBatch(['aladin_3', 'yes24_5']) === 0 && opened === null && /옮길 알라딘 판매중 상품이 없음/.test(toasts[t0][0]) && /예스24 1/.test(toasts[t0][0]), '옮길 것이 없으면 까닭 알림·안 엶', toasts[t0]);
    ok(BLK.indexOf('db.') < 0 && BLK.indexOf('.set(') < 0, '이 길에는 Firestore 쓰기가 없음');

    console.log('⑥ 아래 줄 단추·옛 모드 단추');
    const SB = cut('function stkSelBar(', '\nconst STK_MET_MS'); ok(/data-stkbq="1"/.test(SB) && /🧮 수동 일괄 선택 대기로/.test(SB) && /class="btn ghost sm stkx" data-stkbq/.test(SB), '고름 줄에 🧮 (휴대폰은 ⋯ 안)');
    ok(T.indexOf('data-stkbq') > 0 && /D\('data-stkbq'\)[^\n]*stkToBatch\(selNow\(\)\)/.test(T), '누르면 고른 것으로 stkToBatch');
    ok(!/data-stkdel="1"/.test(T) && T.indexOf("old1(D('data-stkdel')") < 0, '옛 「🗑 삭제 고르기…」 모드 단추 빠짐');
    ok(T.indexOf("go: { sel: '[data-stkdel]' }") < 0, '도움말이 빠진 단추를 가리키지 않음');
    ok(/🧮 재고에서 고른 상품 → 수동 일괄 선택 대기로/.test(T) && /🔖 재고 품목 키워드 상품 탭/.test(T), '기능 찾기에 두 줄');
    console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
  })();
}
