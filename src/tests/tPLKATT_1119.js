// tPLKATT_1119 — (11/19 일꾼 plktab1 · 정범님 I-1119-1552-16 3절) 잠금 서랍 판 ④ 붙은 것 칩 · ⚖ 값 차이 · 읽기 전용
// 실행: node src/tests/tPLKATT_1119.js · 시험 자료는 「탭A」·「그룹A」 같은 가짜 이름만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log("  ❌", m, x === undefined ? "" : JSON.stringify(x).slice(0, 500)); } else console.log("  ✓", m); };
const APP = process.env.RN_APP || path.resolve(__dirname, "..", "app.html");
const T = fs.readFileSync(APP, "utf8");

const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('닫힘 없음 ' + name); };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const num = (n) => String(n);
const ATT = fnIn(T, 'plkAttach'), GAPC = fnIn(T, 'plkGapCalc');
const att = new Function(ATT + '\nreturn plkAttach;')(); const gapc = new Function(GAPC + '\nreturn plkGapCalc;')();
const mode = (v) => v.mode || 'full';
const C = (o) => Object.assign({ mode, groupsOf: () => [], foldOf: () => null, foldName: () => '묶음A', stratOf: () => null, tabs: [] }, o || {});
const G = (id, nm, w) => ({ g: { id, name: nm, watch: w } });

console.log('① 붙은 것이 없을 때');
let a = att({ id: 'k1', mode: 'full' }, { id: 'k1' }, C()); ok(a.chips.length === 0 && a.stop === 'full', '붙은 것 0 → 칩 0 · 완전 잠금은 멈춤');
ok(att(null, null, C()).chips.length === 0, '잠금이 없어도 안 죽음');
ok(att({ id: 'k1', mode: 'full' }, null, C({ groupsOf: () => { throw new Error('부르면 안 됨'); } })).chips.length === 0, '상품 목록에 없으면(l 없음) 그룹을 묻지 않음');

console.log('② 칩 차례 · 묶음 · 그룹 · 감시 · 전략 · 탭');
const cx = C({ groupsOf: () => [G('g1', '그룹A', { on: true, days: 7 }), G('g2', '그룹B')], foldOf: () => 'f1', stratOf: () => ({ name: '따라가기', layer: '묶음', id: 'f1' }), tabs: [{ id: 't1', top: 'all', nm: '탭A', keys: ['k1'] }, { id: 't2', top: 'all', nm: '탭B', keys: ['k9'] }, { id: 't3', top: 'all', nm: '탭C', keys: ['k1'], trash: 'x' }] });
a = att({ id: 'k1', mode: 'full' }, { id: 'k1' }, cx); const ks = a.chips.map((c) => c.k).join();
ok(ks === 'fold,grp,grp,watch,strat,tab', '차례 = 묶음 → 그룹 → 감시 → 전략 → 탭', ks);
ok(a.chips.filter((c) => c.k === 'fold').length === 1, '같은 묶음은 한 번만');
ok(a.chips.find((c) => c.k === 'tab').t === '📑 탭A' && a.chips.filter((c) => c.k === 'tab').length === 1, '담긴 탭만(휴지통 탭·안 담긴 탭 제외)');
ok(a.chips.find((c) => c.k === 'watch').t.includes('7일마다'), '감시 7일마다');

console.log('③ 멈춤 · 조건 안에서만 · 막음');
ok(a.chips.find((c) => c.k === 'watch').t.endsWith('· 멈춤') && a.chips.find((c) => c.k === 'strat').dim === 1, '완전 잠금 — 감시·전략 칩 흐리고 「멈춤」');
const ac = att({ id: 'k1', mode: 'cond', hit: { n: 4, at: 'x' } }, { id: 'k1' }, cx);
ok(ac.chips.find((c) => c.k === 'strat').t.endsWith('조건 안에서만') && ac.chips.some((c) => c.k === 'hit' && /4회/.test(c.t)), '조건 잠금 — 「조건 안에서만」 + 막음 4회');
const an = att({ id: 'k1', mode: 'none' }, { id: 'k1' }, cx); ok(!an.chips.find((c) => c.k === 'watch').dim && !/멈춤/.test(an.chips.find((c) => c.k === 'watch').t), '잠금이 아니면 멈춤 표시 없음');

console.log('④ 전략 — policyFor·ruleFor가 있을 때와 없을 때');
console.log('  (지금 main에 policyFor ' + (/function policyFor\(/.test(T) ? '있음' : '없음') + ' — 어느 쪽이든 통과해야 함)');
const without = C({ groupsOf: () => [G('g1', '그룹A')], foldOf: () => 'f1', stratOf: () => null }); ok(!att({ id: 'k1', mode: 'full' }, { id: 'k1' }, without).chips.some((c) => c.k === 'strat'), '전략 함수가 없으면 전략 칩 없음(안 죽음)');
const withP = C({ groupsOf: () => [G('g1', '그룹A')], foldOf: () => 'f1', stratOf: () => ({ name: '규칙X', layer: '그룹', id: 'g1' }) }); ok(att({ id: 'k1', mode: 'full' }, { id: 'k1' }, withP).chips.find((c) => c.k === 'strat').t.startsWith('🎚 규칙X · 그룹'), '있으면 층(그룹)까지 보임');
const boom = C({ groupsOf: () => [G('g1', '그룹A')], stratOf: () => { throw new Error('x'); } }); ok(att({ id: 'k1', mode: 'full' }, { id: 'k1' }, boom).chips.length === 1, '전략 함수가 터져도 나머지 칩은 나옴');
const sv = fnIn(T, 'plkAttCtx'); ok(/typeof policyFor === 'function'/.test(sv), '앱 쪽은 policyFor가 있을 때만 부름');

console.log('⑤ ⚖ 값 차이');
const NOW = Date.parse('2026-11-19T00:00:00Z');
let g = gapc({ ourVsMin: 1.2, at: NOW - 864e5 }, NOW); ok(g.pct === 20 && g.cls === 'hi' && !g.old, '비쌈 +20% 주황 · 하루 전 읽음');
g = gapc({ ourVsMin: 0.8, at: NOW - 8 * 864e5 }, NOW); ok(g.pct === -20 && g.cls === 'lo' && g.old, '쌈 −20% 초록 · 8일 전 읽음이면 흐림');
g = gapc({ ourVsMin: 1.02, at: NOW }, NOW); ok(g.cls === '', '±5% 안은 색 없음');
ok(gapc(null, NOW) === null && gapc({ ourVsMin: null }, NOW) === null, '지표가 없으면 칩 없음(0이 아님)');
g = gapc({ ourVsMin: 1.1, at: new Date(NOW - 864e5).toISOString() }, NOW); ok(g.at === NOW - 864e5, '읽은 때가 글자여도 읽음');

console.log('⑥ 새 읽기 0 · 쓰기 0 · 캐시');
const BLK = [ATT, GAPC, fnIn(T, 'plkAttCtx'), fnIn(T, 'plkAttOf'), fnIn(T, 'plkAttRow'), fnIn(T, 'plkGapOf'), fnIn(T, 'plkGapHtml'), fnIn(T, 'plkAttGo')].join('\n');
ok(!/prd_locks/.test(BLK) && !/plkSet\(/.test(BLK) && !/\.set\(|\.update\(|\.add\(|\.delete\(/.test(BLK.replace(/M\.set\(|S\._plkAt/g, '').replace(/seen\.add\(/g, '')), '붙은 것 코드에 쓰기가 없음');
ok(!/\.get\(\)|onSnapshot|mktSigLoad|batchSlots\(|bkfReG\(/.test(BLK.replace(/function plkAttRow[\s\S]*?\n/, '')), '칩을 그릴 때 새 읽기 0(받아 둔 자료만)');
ok(/data-plkatload/.test(fnIn(T, 'plkAttRow')) && /붙은 것 보기/.test(fnIn(T, 'plkAttRow')), '그룹을 못 받았으면 「붙은 것 보기」 단추');
ok(/S\._plkAt = null/.test(fnIn(T, 'plkDrClose')), '서랍을 닫으면 칩 캐시를 비움');
ok(/PLK_ATT_MAX/.test(fnIn(T, 'plkAttRow')) && /'\+' \+/.test(fnIn(T, 'plkAttRow')), '4개 넘으면 +n');
ok(/plkAttRow\(v, F\)/.test(fnIn(T, 'plkDrDraw')) && /plkAttRow\(/.test(fnIn(T, 'plkFolderDraw')), '서랍 줄과 잠금 폴더 카드 둘 다에 붙음');
ok(!/alert\(|confirm\(|prompt\(/.test(BLK), '브라우저 팝업 없음');
ok(/function plkTabSort[\s\S]*?'gap'/.test(T) && /plkGapOf\(v\)/.test(fnIn(T, 'plkTabSort')), '⚖ 비싼 순 정렬이 있음');
console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 통과 — tPLKATT_1119');
process.exit(bad ? 1 : 0);
