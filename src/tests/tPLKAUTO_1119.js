// tPLKAUTO_1119 — (11/19 일꾼 plktab1 · 정범님 I-1119-1619-18) 잠금 서랍 자동 탭 — 보기만 거르고 잠금은 안 바꿈 · 켜기/끄기는 공유 문서
// 실행: node src/tests/tPLKAUTO_1119.js · 시험 자료는 가짜 값만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } throw new Error('닫힘 없음 ' + name); };
const esc = (s) => String(s == null ? '' : s); const num = (n) => String(n);
const lockedAt = (v) => v.at || '';
const hit = new Function('plkLockedAt', fnIn(T, 'plkAutoHit') + '\nreturn plkAutoHit;')(lockedAt);
const NOW = Date.parse('2026-11-19T00:00:00Z'); const D = (n) => new Date(NOW - n * 864e5).toISOString();
const c0 = (o) => Object.assign({ now: NOW, mode: 'full', listed: true, gap: null, att: false }, o || {});

console.log('① 기본으로 켜진 것(기준이 분명한 것)과 기본 끔(애매한 것)');
const AUTO = new Function(T.slice(T.indexOf('const PLK_AUTO = ['), T.indexOf('];', T.indexOf('const PLK_AUTO = [')) + 2) + '\nreturn PLK_AUTO;')();
const on = AUTO.filter((x) => x.on).map((x) => x.id).join(), off = AUTO.filter((x) => !x.on).map((x) => x.id).join();
ok(on === 'a_cond,a_full,a_new,a_7d', '기본 켬 = 조건 잠금만 · 완전 잠금만 · 새 잠금 · 최근 7일 잠금', on);
ok(off === 'a_today,a_hit,a_att,a_old,a_gap', '기본 끔 = 오늘 손볼 것 · 조건이 막은 적 · 감시·전략 붙었는데 완전 잠금 · 90일 넘게 · 값 차이', off);
ok(AUTO.every((x) => x.nm && x.ds && !/\d{3}-\d{3,4}-\d{4}/.test(x.nm + x.ds)), '모든 탭에 이름과 기준 글이 있음');

console.log('② 탭별 기준');
ok(hit('a_cond', { at: D(1) }, c0({ mode: 'cond' })) && !hit('a_cond', { at: D(1) }, c0()), '조건 잠금만');
ok(hit('a_full', { at: D(1) }, c0()) && !hit('a_full', { at: D(1) }, c0({ mode: 'new' })), '완전 잠금만');
ok(hit('a_new', { at: D(1) }, c0({ mode: 'new' })) && !hit('a_new', { at: D(1) }, c0()), '새 잠금');
ok(hit('a_7d', { at: D(6) }, c0()) && !hit('a_7d', { at: D(8) }, c0()) && !hit('a_7d', {}, c0()), '최근 7일 잠금 — 6일 전 O · 8일 전 X · 잠근 때를 모르면 X');
ok(hit('a_hit', { at: D(1), hit: { n: 1 } }, c0()) && !hit('a_hit', { at: D(1) }, c0()), '조건이 막은 적 있는 것');
ok(hit('a_att', { at: D(1) }, c0({ att: true })) && hit('a_att', { at: D(1) }, c0({ att: true, mode: 'new' })) && !hit('a_att', { at: D(1) }, c0({ att: true, mode: 'cond' })) && !hit('a_att', { at: D(1) }, c0()), '감시·전략 붙었는데 완전(새) 잠금 — 조건 잠금은 아님');
ok(hit('a_old', { at: D(91) }, c0()) && !hit('a_old', { at: D(91) }, c0({ listed: false })) && !hit('a_old', { at: D(89) }, c0()), '90일 넘게 잠김 + 아직 목록에 있음(안 팔림)');
ok(hit('a_gap', { at: D(1) }, c0({ gap: 21 })) && hit('a_gap', { at: D(1) }, c0({ gap: -21 })) && !hit('a_gap', { at: D(1) }, c0({ gap: 20 })) && !hit('a_gap', { at: D(1) }, c0()), '값 차이 ±20% 넘음(지표 없으면 X)');

console.log('③ 오늘 손볼 것 — 여섯 기준(다시 볼 날은 아직 자료가 없음)');
const td = (v, c) => hit('a_today', Object.assign({ at: D(1) }, v), c0(c));
ok(td({}, { gap: 25 }), '값 차이 20% 넘음'); ok(td({ hit: { n: 4 } }), '조건이 3번 넘게 막음'); ok(!td({ hit: { n: 3 } }), '3번은 아직 아님');
ok(td({ at: D(100) }), '90일 넘게 잠겨 안 팔림'); ok(td({ mode: 'cond', cond: { until: D(-2) } }, { mode: 'cond' }), '조건 기한이 3일 안'); ok(td({ mode: 'cond', cond: { until: D(2) } }, { mode: 'cond' }), '기한이 이미 지남도 해당');
ok(!td({ mode: 'cond', cond: { until: D(-9) } }, { mode: 'cond' }), '기한이 9일 뒤면 아직 아님'); ok(td({}, { att: true }), '감시·전략 붙었는데 완전 잠금'); ok(!td({}), '아무것도 없으면 안 듦');

console.log('④ 켜기·끄기 — 공유 문서 · 기본값 · 자동 탭은 쓰기 없음');
const onLine = T.split('\n').find((x) => x.startsWith('const plkAutoOn = ')); const on_ = new Function('PLK_AUTO', 'S', onLine.replace(/^const plkAutoOn = /, 'return '))(AUTO, { plkAuto: { on: { a_today: true, a_cond: false } } });
ok(on_('a_today') === true && on_('a_cond') === false && on_('a_full') === true && on_('a_gap') === false && on_('nope') === false, '문서 값이 기본값을 이김 · 없으면 기본값 · 모르는 탭은 꺼짐');
ok(/doc\('plk_autotabs'\)/.test(fnIn(T, 'plkAutoSave', 'async function ')) && /merge: true/.test(fnIn(T, 'plkAutoSave', 'async function ')), '공유 문서 app_settings/plk_autotabs에 합쳐 씀(기기 저장 아님)');
ok(/plk_autotabs/.test(fnIn(T, 'plkTabListen')), '모든 기기가 그 문서를 같이 들음');
const BLK = [fnIn(T, 'plkAutoHit'), fnIn(T, 'plkAutoRows'), fnIn(T, 'plkAutoChips'), fnIn(T, 'plkAutoSetHtml')].join('\n');
ok(!/prd_locks/.test(BLK) && !/plkSet\(/.test(BLK) && !/\.set\(|\.update\(|\.add\(|\.delete\(|localStorage/.test(BLK), '자동 탭 거름 코드에 쓰기·기기 저장이 없음');
ok(/startsWith\('auto:'\)/.test(fnIn(T, 'plkTabRows')) && /startsWith\('auto:'\)/.test(fnIn(T, 'plkSubOf')), '하위 탭 고르기·거르기가 자동 탭을 알아봄');
ok(/plkAutoOn\(id\.slice\(5\)\)/.test(fnIn(T, 'plkSubOf')), '꺼진 자동 탭을 골라 둔 채면 「전체」로 돌아감');
ok(/null/.test(fnIn(T, 'plkDropOp')) && /startsWith\('auto:'\)/.test(fnIn(T, 'plkDropOp')), '자동 탭에는 끌어 담지 못함');
ok(/plkAutoSetHtml\(\)/.test(fnIn(T, 'plkDSetHtml')) && /data-plkauto/.test(fnIn(T, 'plkAutoSetHtml')), '⚙ 서랍 설정에서 켜고 끔');
ok(!/alert\(|confirm\(|prompt\(/.test(BLK), '브라우저 팝업 없음');
console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ 통과 — tPLKAUTO_1119');
process.exit(bad ? 1 : 0);
