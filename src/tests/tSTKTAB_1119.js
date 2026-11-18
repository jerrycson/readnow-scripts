// tSTKTAB — (11/18 정범님 I-1118-2245-28.4 판 ①) 📦 재고 품목 탭 틀: 탭 정의·겹쳐 속함(stkCls)·옛 바깥 설정 옮기기(stkTabNorm)·탭 줄 그림·기기 기억
// 실행: node tSTKTAB_1119.js · 시험 자료는 가짜 상품만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const i = T.indexOf('/* ◆stktab 시작'); const j = T.indexOf('/* ◆stktab 끝 */', i); if (i < 0 || j < i) throw new Error('◆stktab 덩어리 못 찾음');
const store = {}; const LS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const F = new Function('num', 'localStorage', T.slice(i, j) + '; return { STK_TABDEF, stkCls, stkTabMem, stkTabNorm, stkTabBar };')((n) => String(n), LS);
console.log('① 탭 정의');
ok(F.STK_TABDEF.map((d) => d[0]).join() === 'all,on,pause,pend,px,grp', '탭 6개 차례 = 전체·판매중·일시판매중지·반영 대기·조회수·그룹');
ok(F.STK_TABDEF.every((d) => d.length === 5 && d[1] && d[2] && d[3]), '탭마다 이름·짧은 이름·설명이 있음');
console.log('② 겹쳐 속함 (한 상품이 여러 탭에)');
{ const f = { pend: (l) => l.id === 'a', px: (l) => l.id === 'a', gAny: new Set(['a', 'c']) };
  const a = F.stkCls({ l: { id: 'a', status: '판매중' } }, f); ok([...a].sort().join() === 'all,grp,on,pend,px', '한 상품이 판매중·반영 대기·조회수·그룹 탭에 함께 속함', [...a]);
  const b = F.stkCls({ l: { id: 'b', status: '일시판매중지' } }, f); ok([...b].sort().join() === 'all,pause', '일시판매중지는 전체·중지 탭만', [...b]);
  const y = F.stkCls({ y: { goodsNo: '1' }, l: { id: 'a', status: '판매중' } }, f); ok([...y].sort().join() === 'all,on', '예스24 줄은 반영 대기·조회수·그룹 탭에 안 듦', [...y]); }
console.log('③ 옛 바깥 설정을 탭으로 (검색 안내·다른 화면이 아직 STK.pd·px·g를 씀)');
{ const n = (o, ch, mem) => { const T0 = { pd: 'all', px: 'all', st: 'all', g: null, tab: null, ...o }; const r = F.stkTabNorm(T0, ch || 'aladin', mem); return [r, T0]; };
  ok(n({})[0] === 'all', '아무 것도 없으면 전체');
  ok(n({}, 'aladin', 'pend')[0] === 'pend', '기기에 기억해 둔 탭을 씀');
  { const [r, T0] = n({ pd: 'pend' }); ok(r === 'pend' && T0.pd === 'all', 'STK.pd=pend → 반영 대기 탭 · 옛 칸 비움'); }
  { const [r, T0] = n({ px: 'on' }); ok(r === 'px' && T0.px === 'all', 'STK.px=on → 조회수 탭'); }
  { const [r] = n({ st: 'pause' }); ok(r === 'pause', 'STK.st=pause → 일시판매중지 탭'); }
  { const [r] = n({ g: 'g1', tab: 'all' }); ok(r === 'grp', '그룹을 고르며 들어오면(전략 배정 화면) 그룹 탭'); }
  ok(n({ tab: 'zzz' })[0] === 'all', '모르는 탭 이름은 전체');
  ok(n({ tab: 'grp' }, 'yes24')[0] === 'all' && n({ tab: 'px' }, 'yes24')[0] === 'all' && n({ tab: 'pend' }, 'yes24')[0] === 'all', '예스24에선 반영 대기·조회수·그룹 탭 대신 전체'); }
console.log('④ 탭 줄 그림');
{ const h = F.stkTabBar('px', { all: 10, on: 7, pause: 3, pend: 0, px: 2, grp: 4 }, false);
  ok(/class="btabs stkt"/.test(h) && (h.match(/data-stktab="/g) || []).length === 6, '수동 일괄과 같은 .btabs 줄 · 탭 6개');
  ok(/class="on" data-stktab="px"/.test(h) && !/class="on[^"]*" data-stktab="all"/.test(h), '지금 탭만 on');
  ok(/class=" z" data-stktab="pend"[^>]*>.*<b>0<\/b>/.test(h), '0개 탭은 흐리게(z)');
  ok(/<b>10<\/b>/.test(h) && /<b>7<\/b>/.test(h), '탭마다 개수');
  const hy = F.stkTabBar('all', { all: 5, on: 5, pause: 0 }, true); ok((hy.match(/data-stktab="/g) || []).length === 3 && !/data-stktab="grp"/.test(hy), '예스24는 전체·판매중·일시판매중지만'); }
console.log('⑤ 기기 기억');
{ F.stkTabMem('pend'); ok(F.stkTabMem() === 'pend' && store['rn-stk-tab'] === 'pend', '탭을 localStorage rn-stk-tab에 기억');
  const bad2 = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const G = new Function('num', 'localStorage', T.slice(i, j) + '; return { stkTabMem };')((n) => String(n), bad2); let thrown = false; try { G.stkTabMem('on'); G.stkTabMem(); } catch (e) { thrown = true; } ok(!thrown, '저장소가 막혀도 오류 없이 지나감'); }
console.log(bad ? '❌ ' + bad + '개 실패' : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
