// tPLKUI1 — (11/19 일꾼 plkui1 · 정범님 「시키지도 않고 불편하기만 해」) 잠금 서랍 자동 탭 뺌 · 설명 문단 ⓘ 접기
// 실행: node src/tests/tPLKUI1.js · 시험 자료는 가짜 값만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('닫힘 없음 ' + name); };
const esc = (s) => String(s == null ? '' : s); const num = (n) => String(n);

console.log('① 자동 탭 코드가 없음');
ok(!/plkAuto|PLK_AUTO|data-plkauto|plk-aus/.test(T), 'plkAuto·PLK_AUTO·자동 탭 설정 칸 코드 0');
ok(!/plk_autotabs/.test(T), 'app_settings/plk_autotabs 읽기·쓰기 0(문서는 그대로 둠)');
ok(!/자동 탭 켜기·끄기|⚡ 자동 탭/.test(fnIn(T, 'plkDSetHtml')), '⚙ 서랍 설정에 ⚡ 자동 탭 칸 없음');
ok(!/plkAutoUn|onSnapshot/.test(fnIn(T, 'plkTabListen').replace(/plk_tabs[\s\S]*$/, '')), '듣기: 자동 탭 구독 없음');
ok(/plk_tabs/.test(fnIn(T, 'plkTabListen')), '나만의 하위 탭 구독(plk_tabs)은 그대로');

console.log('② 하위 탭 줄 — 자동 칩 0 · 사용자 탭은 그대로');
const NORM = '';
const st = { plkTabs: { ok: true, d: { tabs: [{ id: 'a1', top: 'all', nm: '탭A', ds: '설명A', keys: ['k1'], trash: '' }] } } };
const f = new Function('S', 'esc', 'num', 'PLK_TOPS', 'plkMode', 'plkGoneTxt', 'plkGoneHtml', 'plkPickHtml', fnIn(T, 'plkSubOf') + '\n' + fnIn(T, 'plkTabsOf') + '\n' + fnIn(T, 'plkTabsHtml') + '\nreturn plkTabsHtml;')(st, esc, num, ['new', 'full', 'cond', 'all'], () => 'new', () => '', () => '', () => '');
const all = [{ id: 'k1' }, { id: 'k2' }];
const h = f({ subs: { all: 'a1' } }, all, 'all');
ok(!/plk-au|⚡|data-plksub="auto:/.test(h), '하위 탭 줄에 ⚡ 자동 칩 0개', h.slice(0, 200));
ok(/전체 2/.test(h) && /탭A 1/.test(h) && /＋ 새 탭/.test(h) && /class="plk-tdesc">설명A</.test(h), '「전체」·사용자 탭·＋ 새 탭·탭 설명 한 줄은 그대로');
{ const ff = { subs: { all: 'auto:a_cond' } }; ok(/class="btn sm on"[^>]*data-plksub=""/.test(f(ff, all, 'all')), '예전에 골라 둔 자동 탭은 「전체」로 돌아감'); }
ok(!/auto:/.test(fnIn(T, 'plkTabRows')) && !/auto:/.test(fnIn(T, 'plkSubOf')), '거름·고르기에 자동 탭 갈래 없음');

console.log('③ 설명 문단 — 기본 숨김 · ⓘ로 펼침');
const DRAW = fnIn(T, 'plkDrDraw'), FOLD = fnIn(T, 'plkFolderDraw');
ok(/class="plk-rule" data-plkrule="1"\$\{F\.ruleOpen \? '' : ' hidden'\}>잠금은 세 갈래/.test(DRAW), '서랍: 설명 문단은 ruleOpen이 아니면 hidden(기본 숨김)');
ok(/data-plkri="1"/.test(DRAW) && /aria-expanded="\$\{F\.ruleOpen/.test(DRAW) && /ⓘ/.test(DRAW), '서랍 머리에 ⓘ 단추(aria-expanded)');
ok(/id="plkf_rule" data-plkrule="1"\$\{FF\.ruleOpen \? '' : ' hidden'\}/.test(FOLD) && /data-plkri="1"/.test(FOLD), '전체 화면 폴더: 같은 방식(기본 숨김 · ⓘ)');
ok(/\.plk-rule\[hidden\]\{display:none\}/.test(T), 'hidden이 실제로 감춤(CSS)');
// 묶음 바인딩을 가짜 DOM으로 돌림
const bindSrc = fnIn(T, 'plkTabBind3'); const line = bindSrc.split('\n').find((x) => /data-plkri/.test(x)); ok(!!line, 'ⓘ 클릭 연결 줄 있음');
const mkEl = () => { const a = {}; return { dataset: {}, hidden: true, setAttribute(k, v) { a[k] = v; }, getAttribute: (k) => a[k], onclick: null }; };
const btn = mkEl(), rule = mkEl(); const F = {};
const root = { querySelectorAll: (s) => (s === '[data-plkrule]' ? [rule] : []) };
const all2 = (s) => (s === '[data-plkri]' ? [btn] : []);
new Function('all', 'F', 'root', line)(all2, F, root);
ok(typeof btn.onclick === 'function' && rule.hidden === true && !F.ruleOpen, '처음엔 접힘');
btn.onclick(); ok(F.ruleOpen === true && rule.hidden === false && btn.getAttribute('aria-expanded') === 'true', 'ⓘ 누르면 펼쳐짐');
btn.onclick(); ok(F.ruleOpen === false && rule.hidden === true && btn.getAttribute('aria-expanded') === 'false', '다시 누르면 접힘');
ok(/잠금은 세 갈래/.test(DRAW) && /여기 상품은 <b>판매 상태/.test(FOLD), '설명 글은 지우지 않고 그대로 있음');
ok(!/alert\(|confirm\(|prompt\(/.test(DRAW + FOLD + bindSrc), '브라우저 팝업 없음');

console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 통과 — tPLKUI1');
process.exit(bad ? 1 : 0);
