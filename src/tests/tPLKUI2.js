// tPLKUI2 — (11/19 일꾼 plkui2 · 정범님 I-1119-2320-41.2~41.7) 잠금 서랍 — 크게 보기 · 카드 눌러 고르기 · Shift 이어 고르기 · 찾기·거르기 칩 · 탭이 사라지지 않음 · 잠금을 바꿔도 탭에 남음
// 실행: node src/tests/tPLKUI2.js · 시험 자료는 「탭A」·「책A」 같은 가짜 값만 · 운영 문서(prd_locks·plk_tabs)는 읽지도 쓰지도 않음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const T = fs.readFileSync(process.env.RN_APP || path.resolve(__dirname, '..', 'app.html'), 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('닫힘 없음 ' + name); };
const cOf = (S, name) => { const i = S.indexOf('const ' + name + ' ='); if (i < 0) throw new Error('상수 없음 ' + name); return S.slice(i, S.indexOf('\n', i)); };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); const num = (n) => String(n);
const mode = (v) => (v && v.mode) || 'new';

console.log('⑤ 탭이 사라지지 않음 — 어느 칸에서 만들었든 모든 칸에 보임');
const S = { plkTabs: { ok: true, d: { tabs: [{ id: 'a1', top: 'new', nm: '탭A', ds: '', keys: ['k1', 'k2', 'k3'], trash: '' }, { id: 'a2', top: 'full', nm: '탭B', ds: '', keys: ['k9'], trash: '1' }] } } };
const TAB = new Function('S', 'esc', 'num', 'PLK_TOPS', 'plkMode', 'plkGoneTxt', 'plkGoneHtml', 'plkPickHtml', ['plkSubOf', 'plkTabsOf', 'plkTabRows', 'plkTabVisible', 'plkTabsHtml'].map((n) => fnIn(T, n)).join('\n') + '\nreturn { tabsOf: plkTabsOf, rows: plkTabRows, vis: plkTabVisible, html: plkTabsHtml };')(S, esc, num, ['new', 'full', 'cond', 'all'], mode, () => '', () => '', () => '');
for (const top of ['new', 'full', 'cond', 'all']) ok(TAB.tabsOf(top, false).map((t) => t.id).join() === 'a1', `「${top}」 칸에서도 🆕에서 만든 탭A가 보임`);
ok(TAB.tabsOf('cond', true).map((t) => t.id).join() === 'a2', '휴지통 탭도 칸과 상관없이 🗑에 보임(지우지 않음)');
const L = [{ id: 'k1', mode: 'new' }, { id: 'k2', mode: 'full' }, { id: 'k3', mode: 'cond' }, { id: 'k4', mode: 'full' }];
for (const top of ['new', 'full', 'cond', 'all']) ok(TAB.rows(L, top, 'a1').map((v) => v.id).join() === 'k1,k2,k3', `「${top}」 칸에서 탭A를 고르면 담은 3개가 모두 보임`);
const H = TAB.html({ subs: { full: 'a1' } }, L, 'full');
ok(/탭A 3/.test(H), '탭 칩 수는 갈래와 상관없이 담은 것 수(3)', H.slice(0, 400));
ok(/어느 갈래로 바꿔도 여기 그대로/.test(H), '탭을 고르면 「그대로 남음」 안내');
ok(TAB.html({ subs: { cond: 'zz' } }, L, 'cond').includes('data-plksub=""'), '모르는 탭 번호를 기억해 두었으면 「전체」로(빈 화면 아님)');

console.log('⑥ 완전·조건 잠금으로 바꿔도 탭에 남음');
ok(['new', 'full', 'cond'].every((m) => TAB.vis({ id: 'k1', mode: m }, 'new', 'a1')), '탭A의 k1 — 새로·완전·조건 어느 갈래여도 보임');
ok(!TAB.vis({ id: 'k4', mode: 'full' }, 'new', 'a1'), '탭에 안 담긴 것은 안 보임');
ok(TAB.vis({ id: 'k4', mode: 'full' }, 'full', '') && !TAB.vis({ id: 'k4', mode: 'full' }, 'new', ''), '탭을 안 고르면 칸(갈래) 거름은 그대로');
{ const G = new Function('PLK_TOPS', 'plkMode', fnIn(T, 'plkTabGone') + '\nreturn plkTabGone;')(['new', 'full', 'cond', 'all'], mode); const M = new Map([['k1', { id: 'k1', on: true, mode: 'full' }], ['k2', { id: 'k2', on: true, mode: 'cond' }], ['k3', { id: 'k3', on: false }]]); const g = G(['k1', 'k2', 'k3'], 'new', M);
  ok(g.vis.join() === 'k1,k2' && g.off.join() === 'k3' && !g.out.length, '갈래 밖으로 숨는 것 0 — 풀린 것만 「풀림」', g); }
const NORM = fnIn(T, 'plkTabNorm'), APPLY = fnIn(T, 'plkTabApply');
const ap = new Function('PLK_TOPS', NORM + '\n' + APPLY + '\nreturn plkTabApply;')(['new', 'full', 'cond', 'all']);
{ const d0 = { v: 1, tabs: [{ id: 'a1', top: 'new', nm: '탭A', ds: '', keys: ['k1'], trash: '', from: '' }] };
  ok(!!ap(d0, { t: 'add', top: 'cond', id: 'a3', nm: '탭A' }).err, '다른 칸에서도 같은 이름은 거절(모든 칸에 보이므로)');
  const r = ap(d0, { t: 'add', top: 'cond', id: 'a3', nm: '탭C' }); ok(!r.err && r.d.tabs.length === 2 && r.d.tabs[0].keys.join() === 'k1', '새 탭을 더해도 있던 탭·담은 것은 그대로'); }
const DRAW = fnIn(T, 'plkDrDraw');
ok(/plkSubOf\(F, F\.tab\)/.test(DRAW) && /\(SUB \|\| F\.tab === 'all' \|\| plkMode\(v\) === F\.tab\)/.test(DRAW), '서랍: 탭을 고르면 갈래로 거르지 않음');
ok(/plkSubSet\(F, fo \? 'all' : F\.tab, id\)/.test(fnIn(T, 'plkAttGo')), '「붙은 것」 탭 칩을 누르면 지금 칸에서 그 탭을 엶(칸을 바꾸지 않음)');
ok(DRAW.indexOf('const $d =') > 0 && !/plkTabTx\(|plkTabWrite|setDoc|updateDoc/.test(DRAW.slice(0, DRAW.indexOf('const $d ='))), '서랍 그리기(단추 연결 앞)는 탭 문서를 쓰지 않음 — 그리기만으로 지우거나 덮어쓰지 않음');

console.log('④ 찾기 — 제목·저자·출판사·ISBN · 띄어 쓰면 모두 맞는 것');
const qHit = new Function(fnIn(T, 'plkQHit') + '\nreturn plkQHit;')();
const v = { id: 'aladin_U1', title: '책A 첫째 권', why: '키워드 보존', cond: { memo: '메모A' } }, l = { author: '지은이A', publisher: '출판사A', isbn13: '9788900000001' }, b = { contributors: [{ name: '옮긴이B' }], isbn: '89-000-0000-X' };
ok(qHit(v, l, b, '') && qHit(v, null, null, '   '), '빈 찾기는 모두 맞음(아무것도 안 거름)');
ok(qHit(v, l, b, '지은이a') && qHit(v, l, b, '출판사A') && qHit(v, l, b, '옮긴이'), '저자·출판사·참여자 이름(대소문자 무시)');
ok(qHit(v, l, b, '978-89-0000-0001') && qHit(v, l, b, '9788900000001') && qHit(v, l, b, '890000000x'), 'ISBN — 「-」 있어도 없어도');
ok(qHit(v, l, b, '책A 출판사A') && !qHit(v, l, b, '책A 출판사Z'), '띄어 쓴 낱말은 모두 맞아야(그리고)');
ok(qHit(v, l, b, '키워드') && qHit(v, l, b, '메모A') && qHit(v, l, b, 'u1'), '까닭·조건 메모·상품 번호');
ok(!qHit(v, l, b, '없는말'), '안 맞으면 거름');

console.log('④ 거르기 칩 — 기본 빈 것 · 이 기기에 기억(rn-plk-flt) · 저장이 막혀도 동작');
const mem = {}; let thr = false;
const lsOk = { getItem: (k) => { if (thr) throw new Error('막힘'); return k in mem ? mem[k] : null; }, setItem: (k, x) => { if (thr) throw new Error('막힘'); mem[k] = String(x); } };
const FL = new Function('localStorage', cOf(T, 'PLK_FM') + '\n' + ['plkFltOf', 'plkFltSet', 'plkFltOk'].map((n) => fnIn(T, n)).join('\n') + '\nreturn { of: plkFltOf, set: plkFltSet, ok: plkFltOk };')(lsOk);
{ const F = {}; const f = FL.of(F); ok(!f.m.length && !f.g.length, '처음엔 아무것도 안 거름'); FL.set(F, 'm', 'full'); FL.set(F, 'g', 'G1'); ok(JSON.parse(mem['rn-plk-flt']).m.join() === 'full' && JSON.parse(mem['rn-plk-flt']).g.join() === 'G1', '고른 칩은 rn-plk-flt 열쇠에 저장');
  const F2 = {}; ok(FL.of(F2).m.join() === 'full', '다시 열면 기억한 칩'); FL.set(F2, 'm', 'full'); ok(!FL.of(F2).m.length, '한 번 더 누르면 꺼짐'); FL.set(F2, 'g', null); ok(!FL.of(F2).g.length, '지우기'); }
{ mem['rn-plk-flt'] = '{"m":["bogus","cond"],"g":[1]}'; const f = FL.of({}); ok(f.m.join() === 'cond' && f.g.join() === '1', '이상한 값은 걸러 읽음'); }
{ thr = true; const F = {}; let e = null; try { FL.of(F); FL.set(F, 'm', 'new'); } catch (x) { e = x; } ok(!e && FL.of(F).m.join() === 'new', '저장소가 막혀도(사생활 창) 오류 없이 이 화면에선 동작'); thr = false; }
{ const f = { m: ['full', 'cond'], g: [] }; ok(FL.ok('full', [], f) && FL.ok('cond', [], f) && !FL.ok('new', [], f), '갈래 칩 — 같은 줄 안은 「또는」');
  const g = { m: ['full'], g: ['G1'] }; ok(FL.ok('full', ['G1', 'G2'], g) && !FL.ok('full', ['G2'], g) && !FL.ok('new', ['G1'], g), '갈래와 그룹 사이는 「그리고」');
  ok(FL.ok('new', [], { m: [], g: [] }), '빈 거르기는 다 맞음'); }
{ const H2 = new Function('esc', 'num', cOf(T, 'PLK_FM') + '\n' + fnIn(T, 'plkFltHtml') + '\nreturn plkFltHtml;')(esc, num);
  const h0 = H2({ m: [], g: [] }, { showM: true, gOk: false, mc: { new: 1, full: 2, cond: 3 }, gs: [], nHid: 0 });
  ok(/data-plkfm="full"[^>]*>🔒 완전 2/.test(h0) && /data-plkatload="1"/.test(h0) && !/data-plkfx/.test(h0) && !/ on"/.test(h0), '기본: 켜진 칩 0 · 그룹은 「그룹 목록 받기」 · 지우기 단추 없음', h0);
  const gs = Array.from({ length: 15 }, (_, i) => ({ id: 'G' + i, t: '🧮 그룹' + i, n: 15 - i }));
  const h1 = H2({ m: ['cond'], g: ['G14'] }, { showM: true, gOk: true, mc: {}, gs, more: false, nHid: 4 });
  ok(/class="plk-fc on" data-plkfm="cond" aria-pressed="true"/.test(h1) && /data-plkfg="G14"/.test(h1) && !/data-plkfg="G13"/.test(h1) && /data-plkfgm="1"/.test(h1), '켜진 칩 표시 · 그룹 12개 넘으면 접되 고른 것은 보임');
  ok(/data-plkfx="1"/.test(h1) && /4개 숨김/.test(h1), '거르는 중이면 「✕ 거르기 지우기」·숨김 수');
  ok(!/data-plkfm/.test(H2({ m: [], g: [] }, { showM: false, gOk: true, gs: [] })), '갈래 칸(🆕·🔒·🎚)에서 탭을 안 골랐으면 갈래 칩은 숨김(이미 그 갈래)'); }
ok(/rn-plk-flt/.test(fnIn(T, 'plkFltOf')) && !/rn-plk-flt/.test(DRAW.replace(/plkFltOf/g, '')), '거르기 기억 열쇠는 rn-plk-flt 하나');
ok(/\{ const vis = new Set\(L\.map\(\(v\) => v\.id\)\); for \(const k of \[\.\.\.F\.sel\]\) if \(!vis\.has\(k\)\) F\.sel\.delete\(k\); \}/.test(DRAW), '거르면 안 보이는 것은 고른 것에서 빠짐');
ok(/\$d\('#plkall'\)\.onchange = \(e\) => \{ L\.forEach/.test(DRAW), '「모두 선택」은 보이는 L만');

console.log('②③ 카드 눌러 고르기 · Shift 이어 고르기');
const SEL = new Function(cOf(T, 'PLK_NOSEL') + '\n' + ['plkRange', 'plkCardSkip', 'plkSelTap'].map((n) => fnIn(T, n)).join('\n') + '\nreturn { range: plkRange, skip: plkCardSkip, tap: plkSelTap };')();
const ids = ['a', 'b', 'c', 'd', 'e'];
ok(SEL.range(ids, 'b', 'd').join() === 'b,c,d', '아래로 b→d');
ok(SEL.range(ids, 'e', 'b').join() === 'b,c,d,e', '위로 e→b');
ok(SEL.range(ids, 'zz', 'c').join() === 'c', '기준이 안 보이면 누른 것만');
{ let r = SEL.tap(new Set(), null, ids, 'b', true, false); ok([...r.sel].join() === 'b' && r.anchor === 'b', '하나 고름'); r = SEL.tap(r.sel, r.anchor, ids, 'e', true, true); ok([...r.sel].sort().join() === 'b,c,d,e', 'Shift+누르기 — 사이 모두'); r = SEL.tap(r.sel, r.anchor, ids, 'c', false, true); ok([...r.sel].sort().join() === 'b', 'Shift로 끄면 사이 모두 꺼짐'); r = SEL.tap(r.sel, r.anchor, ids, 'd', true, false); ok([...r.sel].sort().join() === 'b,d', 'Shift 없이는 하나만'); }
const el = (hit) => ({ closest: (s) => (s.split(',').map((x) => x.trim()).some((x) => hit.includes(x)) ? {} : null) });
ok(['button', 'a', 'input', 'select', 'textarea', 'label', 'summary', 'details', '[data-plkdg]'].every((x) => SEL.skip(el([x]))), '단추·링크·입력칸·펼침 상자·끌기 손잡이는 고르기 아님');
ok(!SEL.skip(el([])), '카드 빈 곳은 고르기');
{ const SB = fnIn(T, 'plkSelBind'); ok(/row\.onclick/.test(SB) && /plkCardSkip\(e\.target\)/.test(SB) && /e\.shiftKey/.test(SB) && /stopPropagation/.test(SB) && /getSelection/.test(SB), '카드 누르기 연결 · 글자 칠하기는 고르기 아님 · 체크 상자는 두 번 안 바뀜'); }
ok(/plkSelBind\(dr, F, L\.map\(\(v\) => v\.id\)\)/.test(DRAW), '이어 고르기 차례 = 지금 보이는 차례');

console.log('① 그림 크게 보기 — 화면 안 · 마우스 떼면 닫힘');
const ZA = new Function(fnIn(T, 'plkZoomAt') + '\nreturn plkZoomAt;')();
const inV = (p, vw, vh) => p.x >= 8 && p.y >= 8 && p.x + p.w <= vw - 8 && p.y + p.h <= vh - 8;
{ const p = ZA({ left: 100, right: 150, top: 300, height: 70 }, 300, 400, 1280, 800); ok(inV(p, 1280, 800) && p.x === 162, '오른쪽에 넉넉하면 그림 오른쪽', p); }
{ const p = ZA({ left: 1100, right: 1150, top: 300, height: 70 }, 300, 400, 1280, 800); ok(inV(p, 1280, 800) && p.x + p.w <= 1100, '오른쪽이 모자라면 왼쪽', p); }
{ const p = ZA({ left: 60, right: 110, top: 5, height: 70 }, 300, 400, 360, 640); ok(inV(p, 360, 640), '좁은 화면(휴대폰)에서도 화면 안', p); }
{ const p = ZA({ left: 10, right: 60, top: 780, height: 70 }, 900, 1200, 1024, 700); ok(inV(p, 1024, 700) && p.h <= 684, '너무 크면 화면에 맞춰 줄이고 아래로 넘치지 않음', p); }
{ const ZB = fnIn(T, 'plkZoomBind'), ZS = fnIn(T, 'plkZoomShow'); ok(/onpointerenter/.test(ZB) && /pointerType === 'mouse'/.test(ZB) && /onpointerleave = \(\) => plkZoomHide\(\)/.test(ZB), '마우스 올리면 열고 떼면 닫음(손가락 터치는 안 띄움)'); ok(/scroll/.test(ZB), '굴리면 닫음'); ok(/plkDOpt\(\)/.test(ZS) && /!o\.zoom/.test(ZS), '⚙ 서랍 설정에서 끌 수 있음'); ok(/imgUrl\(b\.images\.front, false\)/.test(fnIn(T, 'plkImgBig')), '큰 그림 = 원본 주소'); }
ok(/data-plkzoom="\$\{esc\(plkImgBig\(l\) \|\| img\)\}"/.test(DRAW) && /plkZoomBind\(dr\)/.test(DRAW) && /plkZoomHide\(\)/.test(fnIn(T, 'plkDrClose')), '서랍 줄 그림에 연결 · 서랍 닫으면 크게 보기도 닫힘');
ok(/\.plk-zoom\{position:fixed;[^}]*pointer-events:none/.test(T) && /\.plk-zoom\[hidden\]\{display:none\}/.test(T), '크게 보기 상자는 마우스를 가리지 않음(pointer-events:none) · 숨김 CSS');
ok(/zoom: 1, zoomPx: 360/.test(cOf(T, 'PLK_DOPT0')) && /data-plkopt2="zoom"/.test(fnIn(T, 'plkDSetHtml')) && /data-plkopt2="zoomPx"/.test(fnIn(T, 'plkDSetHtml')), '설정 기본 켬 · 크기 360');

console.log('⑦ 지킴 — 팝업 0 · 잠금 문서 쓰기 0');
const NEW = ['plkBookOf', 'plkImgBig', 'plkQHit', 'plkFltOf', 'plkFltSet', 'plkFltOk', 'plkModeCnt', 'plkGrpCnt', 'plkFltHtml', 'plkFltBind', 'plkRange', 'plkCardSkip', 'plkSelTap', 'plkSelBind', 'plkZoomAt', 'plkZoomHide', 'plkZoomShow', 'plkZoomBind'].map((n) => fnIn(T, n)).join('\n');
ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 팝업 0');
ok(!/prd_locks|plkSet\(|plkTabTx\(|setDoc|updateDoc|addDoc|deleteDoc|runTransaction|batch\(/.test(NEW), '새 코드는 Firestore에 쓰지 않음(잠금·탭 문서 그대로)');
ok(!/getDocs|getDoc\(|onSnapshot/.test(NEW), '새 코드는 새로 읽지 않음(받아 둔 자료만)');

console.log(bad ? `\n❌ ${bad}개 실패` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
