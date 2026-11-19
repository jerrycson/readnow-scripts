// tPLKTAB_1119 — (11/19 일꾼 plktab1 · 정범님 I-1119-1552-16 · 설계 LOCKDESIGN_1119) 잠금 서랍 하위 탭 판 ② 바탕
// 실행: node src/tests/tPLKTAB_1119.js · 시험 자료는 「탭A」 같은 가짜 이름만(진짜 탭 이름·손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('닫힘 없음 ' + name); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const num = (n) => String(n);

console.log('① 순수 함수 — 만들기·고치기·순서·휴지통·되살리기');
const NORM = fnIn(T, 'plkTabNorm'), APPLY = fnIn(T, 'plkTabApply');
const ap = new Function('PLK_TOPS', NORM + '\n' + APPLY + '\nreturn plkTabApply;')(['new', 'full', 'cond', 'all']);
let d = {}; let r = ap(d, { t: 'add', top: 'all', id: 'a1', nm: ' 탭A ', ds: '설명A' }); ok(r.d && r.d.tabs.length === 1 && r.d.tabs[0].nm === '탭A' && r.d.tabs[0].ds === '설명A', '탭 만들기(이름 앞뒤 공백 정리 · 설명 저장)'); d = r.d;
ok(ap(d, { t: 'add', top: 'all', id: 'a2', nm: '탭A' }).err, '같은 칸에 같은 이름은 거절');
ok(!ap(d, { t: 'add', top: 'full', id: 'a2', nm: '탭A' }).err, '다른 칸에는 같은 이름 가능');
ok(ap(d, { t: 'add', top: 'all', id: 'a3', nm: '  ' }).err, '이름 없으면 거절');
ok(ap(d, { t: 'add', top: 'zz', id: 'a3', nm: 'x' }).err, '모르는 칸 거절');
d = ap(d, { t: 'add', top: 'all', id: 'a2', nm: '탭B' }).d; d = ap(d, { t: 'add', top: 'all', id: 'a3', nm: '탭C' }).d;
r = ap(d, { t: 'mv', id: 'a3', dir: -1 }); ok(r.d.tabs.map((t) => t.id).join() === 'a1,a3,a2', '앞으로 한 칸'); ok(ap(d, { t: 'mv', id: 'a1', dir: -1 }).noop, '맨 앞에서 더 앞으로는 아무 일 없음');
r = ap(d, { t: 'edit', id: 'a2', nm: '탭D', ds: '바뀐 설명' }); ok(r.d.tabs[1].nm === '탭D' && r.d.tabs[1].ds === '바뀐 설명', '이름·설명 고치기'); ok(ap(d, { t: 'edit', id: 'a2', nm: '탭A' }).err, '고치다 같은 이름이 되면 거절');
r = ap(d, { t: 'trash', id: 'a2' }, '2026-11-19T01:00:00Z'); ok(r.d.tabs.find((t) => t.id === 'a2').trash === '2026-11-19T01:00:00Z' && r.d.tabs.length === 3, '휴지통으로 — 지우지 않고 표시만(영구 삭제 없음)');
ok(!/t === 'delete'|op\.t === 'del'/.test(APPLY), '영구 삭제 길이 없음');
d = r.d; r = ap(d, { t: 'restore', id: 'a2' }); ok(!r.d.tabs.find((t) => t.id === 'a2').trash, '되살리기');
d = ap(d, { t: 'add', top: 'all', id: 'a9', nm: '탭B' }).d; r = ap(d, { t: 'restore', id: 'a2' }); ok(r.d.tabs.find((t) => t.id === 'a2').nm.includes('되살림'), '되살릴 때 같은 이름이 있으면 이름에 표시');
ok(ap(d, { t: 'keys', id: 'a1', add: ['k1', 'k2', 'k1'] }).d.tabs[0].keys.join() === 'k1,k2', '탭에 담기(겹침 없이)');
ok(ap(d, { t: 'edit', id: 'nope', nm: 'x' }).err, '없는 탭은 거절');
for (let i = 0; i < 70; i++) { const q = ap(d, { t: 'add', top: 'cond', id: 'z' + i, nm: '탭' + i }); if (q.err) { ok(/60개/.test(q.err), '탭 60개 상한'); break; } d = q.d; }

console.log('② 옛 묶음(grp) → 「모든 잠금」 탭 옮김');
r = ap({}, { t: 'mig', items: [{ nm: '묶음A', keys: ['k1', 'k2'] }, { nm: '묶음B', keys: ['k3'] }, { nm: '묶음A', keys: ['k4'] }] }, '2026-11-19T01:02:03Z');
ok(r.d.tabs.length === 2 && r.d.tabs.every((t) => t.top === 'all' && t.from === 'grp') && r.d.tabs[0].keys.join() === 'k1,k2,k4' && !!r.d.mig, '이름마다 탭 하나 · 담긴 상품 모음 · 옮김 표시');
ok(ap(r.d, { t: 'mig', items: [{ nm: '묶음Z', keys: ['k9'] }] }).noop, '이미 옮겼으면 다시 안 함(한 번만)');
ok(new Set(r.d.tabs.map((t) => t.id)).size === r.d.tabs.length, '옮긴 탭 번호가 겹치지 않음');

console.log('③ 잠금 문서(prd_locks)는 건드리지 않음');
const BLK = [NORM, APPLY, fnIn(T, 'plkTabTx'), fnIn(T, 'plkTabListen'), fnIn(T, 'plkTabAfter'), fnIn(T, 'plkTabMigrate', 'async function '), fnIn(T, 'plkSubOf'), fnIn(T, 'plkSubSet'), fnIn(T, 'plkTabsOf'), fnIn(T, 'plkTabVisible'), fnIn(T, 'plkTabRows'), fnIn(T, 'plkTabsHtml'), fnIn(T, 'plkTabBind')].join('\n');
ok(!/prd_locks/.test(BLK) && !/plkSet\(/.test(BLK), '탭 코드에 prd_locks·plkSet이 없음(잠금 쓰기 0)');
ok(/collection\('app_settings'\)\.doc\('plk_tabs'\)/.test(BLK), '한 문서 app_settings/plk_tabs만 씀');
ok(/db\.runTransaction/.test(fnIn(T, 'plkTabTx')) && /PLK_TABQ/.test(fnIn(T, 'plkTabTx')), '트랜잭션 + 차례 줄(겹쳐 써도 안 덮음)');
ok(!/alert\(|confirm\(|prompt\(/.test(BLK), '브라우저 팝업 없음');

console.log('④ 화면 — 서랍과 폴더');
const DRAW = fnIn(T, 'plkDrDraw'), FOLD = fnIn(T, 'plkFolderDraw');
ok(/\['all', '모든 잠금'\]/.test(DRAW) && !/\['all', '전체'\]/.test(DRAW), '네 번째 칸 이름이 「모든 잠금」');
ok(/plkTabsHtml\(F, all, F\.tab\)/.test(DRAW) && /class="plk-stick"/.test(DRAW), '서랍: 하위 탭 줄이 한 덩어리(sticky) 안에 있음');
ok(/plkTabRows\(L, F\.tab, plkSubOf\(F, F\.tab\)\)/.test(DRAW), '서랍: 고른 하위 탭으로 거름');
ok(/plkTabBind\(dr, F, F\.tab, plkDrDraw\)/.test(DRAW), '서랍: 하위 탭 단추 연결');
ok(/id="plkaddt"/.test(DRAW) && /t: 'keys'/.test(DRAW), '서랍: 여러 상품 잠그기에 「담을 탭」');
ok(/id="plkgrp"/.test(DRAW), '옛 묶음 거르기 칸도 그대로');
ok(/plkTabsHtml\(FF, all0, 'all'\)/.test(FOLD) && /plkTabRows\(all0, 'all'/.test(FOLD) && /plkTabBind\(sh, FF, 'all', plkFolderDraw\)/.test(FOLD), '폴더: 같은 줄을 쓰고 거르고 연결');
ok(/plkTabListen\(true\)/.test(fnIn(T, 'plkDrawer')) && /plkTabListen\(true\)/.test(fnIn(T, 'openPlkFolder')) && /plkTabListen\(false\)/.test(fnIn(T, 'plkDrClose')), '서랍·폴더를 열 때 듣기 시작 · 서랍을 닫으면 멈춤');
{ const st = { plkTabs: { ok: true, d: { tabs: [{ id: 'a1', top: 'all', nm: '탭A', ds: '설명A', keys: ['k1'], trash: '' }, { id: 'a2', top: 'all', nm: '탭B', ds: '', keys: [], trash: '2026-11-19' }] } } };
  const f = new Function('S', 'esc', 'num', 'PLK_TOPS', 'plkMode', 'plkGoneTxt', 'plkGoneHtml', 'plkPickHtml', NORM + '\n' + fnIn(T, 'plkSubOf') + '\n' + fnIn(T, 'plkTabsOf') + '\n' + fnIn(T, 'plkTabsHtml') + '\nreturn plkTabsHtml;')(st, esc, num, ['new', 'full', 'cond', 'all'], () => 'new', () => '', () => '', () => '');
  const all = [{ id: 'k1' }, { id: 'k2' }]; const F = { subs: { all: 'a1' } };
  const h = f(F, all, 'all'); ok(/data-plksub=""/.test(h) && /전체 2/.test(h) && /탭A 1/.test(h) && /title="설명A"/.test(h), '「전체」와 사용자 탭(상품 수) · 설명이 말풍선', h.slice(0, 300));
  ok(/class="plk-tdesc">설명A</.test(h), '고른 탭의 설명 줄(.plk-tdesc)'); ok(!/탭B 0/.test(h) && /🗑 1/.test(h), '휴지통 탭은 줄에 안 나오고 🗑 칩에 개수');
  ok(/＋ 새 탭/.test(h) && /data-plktmv="-1"/.test(h) && /data-plktdel/.test(h) && /data-plkted/.test(h), '새 탭 · 순서 · 휴지통 · 고치기 단추');
  F.tabTrash = true; ok(/data-plktre="a2"/.test(f(F, all, 'all')) && !/data-plkt(rdel|perm)/.test(f(F, all, 'all')), '휴지통 칸: 되살리기만 있고 영구 삭제 단추 없음'); F.tabTrash = false;
  F.tabForm = { top: 'all', id: '', nm: '"<b>', ds: '' }; ok(/id="plktn"/.test(f(F, all, 'all')) && !/<b>"/.test(f(F, all, 'all')), '새 탭 입력 칸 · 입력값은 이스케이프'); }
{ const st = { plkTabs: { ok: true, d: { tabs: [{ id: 'a1', top: 'all', nm: '탭A', ds: '', keys: ['k1'], trash: '' }] } } };
  const g = new Function('S', 'plkMode', fnIn(T, 'plkTabsOf') + '\n' + fnIn(T, 'plkTabRows') + '\nreturn plkTabRows;')(st, () => 'new');
  ok(g([{ id: 'k1' }, { id: 'k2' }], 'all', 'a1').length === 1 && g([{ id: 'k1' }, { id: 'k2' }], 'all', '').length === 2 && g([{ id: 'k1' }, { id: 'k2' }], 'all', 'gone').length === 2, '하위 탭 거르기 · 전체 · 없어진 탭은 전체처럼'); }
{ const g = new Function('S', 'localStorage', fnIn(T, 'plkTabsOf') + '\n' + fnIn(T, 'plkSubOf') + '\n' + fnIn(T, 'plkSubSet') + '\nreturn {plkSubOf, plkSubSet};')({ plkTabs: { d: { tabs: [{ id: 'a1', top: 'all', trash: '', keys: [] }] } } }, { getItem() { throw new Error('막힘'); }, setItem() { throw new Error('막힘'); } });
  const F = {}; g.plkSubSet(F, 'all', 'a1'); ok(g.plkSubOf(F, 'all') === 'a1', '기기 저장이 막혀도 고른 탭이 동작(try/catch)'); }

console.log('⑤ 문서·검색·쪽 안내');
ok(/PAGE_GUIDES\['plkf'\] = \{ title: '🔒 잠금 폴더', ver: '2026-11-19'/.test(T) && /t: '하위 탭'/.test(T), '쪽 안내(PAGE_GUIDES plkf)에 하위 탭 단계');
ok(/잠금 서랍 하위 탭 \(전체 · 새 탭/.test(T) && /<b>🗂 잠금 서랍 하위 탭<\/b>/.test(T), '기능 찾기 낱말 · ❓ 설명서 문단');
ok(/\.plk-stick\{position:sticky/.test(T) && /\.plk-sub\{display:flex;gap:6px;overflow-x:auto/.test(T), '폰 너비: 줄이 옆으로 밀림 · 머리가 붙음');
ok(/QUICK/.test('QUICK') && (()=>{const q=JSON.parse(fs.readFileSync(path.resolve(__dirname, 'QUICK.json'), 'utf8'));return Object.values(q).filter(Array.isArray)[0];})().some((x) => x.t === 'tPLKTAB_1119'), 'QUICK.json에 등록됨');
console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
