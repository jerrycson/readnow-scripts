// tOSSTALE1116 — 어제 멈춘 ALPS 도우미 일은 오늘 [▶ 출고 시작]을 막지 않음 (staleerr1 · 11/16)
//  osBlockOf 마지막 갈래(도우미 상태 _batch.helper)만 날짜를 봄:
//  ① 오늘 error → 막음(open) · ② 어제 error → 안 막음(null) + 🕘 따로 보임(osHelperStaleOf) · ③ 날짜 없음(day·at 둘 다 없음) → 막음
//  ④ 어제 run·wait → 막음(busy · 진짜 하는 중일 수 있음) · ⑤ 자정을 넘겨 이어 함(day 어제 · at 오늘) → 오늘 것으로 봄 = 막음
//  ⑥ 실행 문서·적힌 묶음(src run·rec)은 날짜와 상관없이 그대로 · ⑦ 사람이 닫은 일(closedIds)·보류 상자 일은 지금처럼 안 막음
//  브라우저 없이 node로 — app.html에서 함수 글을 그대로 꺼내 돌림 · 실행: node tOSSTALE1116.js (RN_APP=<app.html> 있으면 그것)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const cands = [process.env.RN_APP, path.join(__dirname, '..', 'app.html'), path.join(__dirname, '..', '..', 'src', 'app.html')].filter(Boolean);
const APP = cands.find((p) => { try { return fs.statSync(p).isFile() && /function osBlockOf\(/.test(fs.readFileSync(p, 'utf8')); } catch (e) { return false; } });
if (!APP) { console.log('❌ app.html(osBlockOf 있는 것)을 못 찾음', cands); process.exit(1); }
const T = fs.readFileSync(APP, 'utf8');
const grab = (head) => { const a = T.indexOf(head); if (a < 0) throw new Error('못 찾음: ' + head); let i = T.indexOf('{', a), d = 0; for (; i < T.length; i++) { const c = T[i]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } } return T.slice(a, i + 1); };
const src = [`const OS_BL_FIN = ['NEXT', 'END'];`, `const OS_PRE_UPLOAD = ['login', 'check', '로그인', '오늘 목록 겹침 검사'];`, ...['function osBatchOpenOf(', 'function osBlockOf(', 'function osKDay(', 'function osHelperDays(', 'function osHelperPreUpload(', 'function osHelperResumed(', 'function osHelperPre(', 'function osHelperStale(', 'function osHelperStaleOf('].map(grab), 'return { osBlockOf, osHelperStale, osHelperStaleOf, osKDay };'].join('\n');
const F = new Function(src)();
// 2026-11-16 10:00 한국 시각 = 01:00Z
const NOW = Date.parse('2026-11-16T01:00:00Z');
const H = (o) => ({ helper: { id: 'h1', status: 'error', file: '판매완료20261116.xlsx', step: '오늘 목록 겹침 검사', hold: false, pre: true, ...o } }); // pre = 웹앱이 도우미 기록을 받을 때 셈(접수 앞 · 이어서 실행 아님)
const B = (bl, r) => F.osBlockOf(r || null, bl, NOW);
console.log('한국 날짜(시험 시각):', F.osKDay(NOW));
ok(F.osKDay(NOW) === '2026-11-16', '한국 날짜 = 2026-11-16');
ok(F.osKDay(Date.parse('2026-11-15T15:30:00Z')) === '2026-11-16', '한국 날짜 — UTC 15:30 = 한국 다음 날 00:30');
// ① 오늘 error
{ const x = B(H({ day: '20261116', at: '2026-11-16T09:40:00.000Z' })); ok(x && x.k === 'open' && x.src === 'helper', '① 오늘 error → 막음(open)', x); }
{ const x = B(H({ day: '20261116' })); ok(x && x.k === 'open', '① 오늘 error(day만) → 막음', x); }
{ const x = B(H({ at: '2026-11-16T08:05:00.000Z' })); ok(x && x.k === 'open', '① 오늘 error(at만) → 막음', x); }
// ② 어제 error
{ const bl = H({ day: '20261115', at: '2026-11-15T17:20:00.000Z' }); const x = B(bl); ok(x === null, '② 어제 error → 안 막음(null)', x); const s = F.osHelperStaleOf(bl, NOW); ok(s && s.id === 'h1', '② 어제 error → 🕘 따로 보임(osHelperStaleOf)', s); }
{ const x = B(H({ day: '20261110' })); ok(x === null, '② 며칠 전 error(day만) → 안 막음', x); }
{ const x = B(H({ at: '2026-11-15T22:00:00.000Z' })); ok(x === null, '② 어제 error(at만 · 한국 시각 + Z 꼴) → 안 막음', x); }
// ③ 날짜 없음
{ const bl = H({}); const x = B(bl); ok(x && x.k === 'open', '③ 날짜 없음(day·at 둘 다 없음) → 막음', x); ok(F.osHelperStaleOf(bl, NOW) === null, '③ 날짜 없음 → 🕘 줄 없음'); }
{ const x = B(H({ day: 'x', at: '모름' })); ok(x && x.k === 'open', '③ 날짜를 못 읽음 → 막음', x); }
// ④ 어제 run·wait
{ const x = B(H({ status: 'run', day: '20261115', at: '2026-11-15T23:50:00.000Z' })); ok(x && x.k === 'busy' && x.src === 'helper', '④ 어제 run → 막음(busy)', x); }
{ const x = B(H({ status: 'wait', day: '20261115' })); ok(x && x.k === 'busy', '④ 어제 wait → 막음(busy)', x); ok(F.osHelperStaleOf(H({ status: 'wait', day: '20261115' }), NOW) === null, '④ 어제 wait → 🕘 줄 없음'); }
// ⑤ 자정을 넘겨 이어 함 — day 어제 고정 · at 오늘
{ const x = B(H({ day: '20261115', at: '2026-11-16T00:03:00.000Z' })); ok(x && x.k === 'open', '⑤ day 어제 · at 오늘(자정 넘겨 이어 함) → 막음', x); }
// 앞날(기기 시계 어긋남) → 안전 쪽으로 막음
{ const x = B(H({ day: '20261117' })); ok(x && x.k === 'open', '앞날 날짜 → 막음(안전 쪽)', x); }
// ⑥ 실행 문서·적힌 묶음은 날짜와 상관없이 그대로
{ const r = { id: 'R1', status: 'run', ph: 'ALPS', bt: [{ n: 1 }], cur: 0 }; const x = B(H({ day: '20261115' }), r); ok(x && x.k === 'busy' && x.src === 'run', '⑥ 실행 문서 run → 막음(어제 도우미 error와 상관없이)', x); }
{ const r = { id: 'R2', status: 'stop', ph: 'ALPS', bt: [{ n: 1, file: 'f.xlsx', al: ['1'] }], cur: 0 }; const x = B(H({ day: '20261115' }), r); ok(x && x.k === 'open' && x.src === 'run', '⑥ 끝나지 않은 실행 묶음 → 막음(open · run)', x); }
{ const bl = { ...H({ day: '20261115' }), open: { key: 'R9:1', run: 'R9', n: 1 } }; const x = B(bl, null); ok(x && x.k === 'open' && x.src === 'rec', '⑥ 적힌 미완 묶음(_batch.open) → 막음(rec)', x); }
// ⑦ 사람이 닫음·보류 상자 일
{ const bl = { ...H({ day: '20261116' }), closedIds: ['h1'] }; ok(B(bl) === null, '⑦ 사람이 닫은 오늘 일 → 안 막음(지금처럼)'); ok(F.osHelperStaleOf({ ...H({ day: '20261115' }), closedIds: ['h1'] }, NOW) === null, '⑦ 숨긴(닫은) 어제 일 → 🕘 줄 없음'); }
{ ok(B(H({ day: '20261116', hold: true })) === null, '⑦ 보류 상자 일 → 안 막음(지금처럼)'); }
// ⑧ (검토 고침) 어제 일이라도 접수(일괄주문접수)와 그 뒤에서 멈췄거나 단계를 모르면 막음 — 같은 송장 두 번 금지
{ for (const st of ['접수(일괄주문접수)', '출력(운송장)', '운송장번호 확인', '웹앱으로 넘김', '']) { const bl = H({ day: '20261115', step: st, pre: false }); const x = B(bl); ok(x && x.k === 'open', `⑧ 어제 error · 단계 「${st || '모름'}」 → 막음`, x); ok(F.osHelperStaleOf(bl, NOW) === null, `⑧ 어제 error · 단계 「${st || '모름'}」 → 🕘 줄 없음(막음 줄로)`); } }
{ const x = B(H({ day: '20261115', step: '로그인' })); ok(x === null, '⑧ 어제 error · 단계 로그인 → 안 막음', x); }
{ const x = B(H({ day: '20261115', gone: true })); ok(x && x.k === 'open', '⑧ 어제 · 도우미가 꺼져 사라진 일(gone) → 막음', x); }
// ⑩ (다시 검토 고침) 이어서 진행·보류 다시 실행은 실행을 새로 만듦(단계 모두 처음·summary 빔) — 접수 앞에서 멈춰도 어제 일로 풀지 않음
{ const R = { status: 'error', day: '20261115', summary: {}, steps: [{ k: 'login', st: 'ok' }, { k: 'check', st: 'err' }, { k: 'upload', st: 'todo' }], log: [{ t: '09:01:00', st: 'i', k: 'log', d: '이어서 판매완료20261115.xlsx · 3줄' }] }; ok(!F.osHelperStale(R, NOW), '⑩ 어제 이어서 실행이 겹침 검사(OZ 실패)에서 멈춤 → 풀지 않음(같은 송장 두 번 금지)'); }
{ const R = { status: 'error', day: '20261115', summary: {}, steps: [{ k: 'login', st: 'err' }], log: [{ d: '날짜 고정: 이 일은 20261115 일로 이어서 함(자정을 넘김)' }, { d: '이어서 판매완료20261115.xlsx · 3줄' }] }; ok(!F.osHelperStale(R, NOW), '⑩ 날짜 고정 줄 뒤 이어서 실행 · 로그인에서 멈춤 → 풀지 않음'); }
{ const R = { status: 'error', day: '20261115', summary: {}, steps: [{ k: 'login', st: 'err' }], log: [{ d: '시작 판매완료20261115.xlsx · 3줄' }] }; ok(F.osHelperStale(R, NOW), '⑩ 처음 실행 · 로그인에서 멈춤 → 어제 일(안 막음)'); }
{ const R = { status: 'error', day: '20261115', resume: true, steps: [{ k: 'check', st: 'err' }] }; ok(!F.osHelperStale(R, NOW), '⑩ resume 표시 있는 실행 → 풀지 않음'); }
{ const bl = H({ day: '20261115', step: '로그인', pre: undefined }); const x = B(bl); ok(x && x.k === 'open', '⑩ 저장된 기록에 접수 앞 표시(pre) 없음 → 막음(옛 기록·모름)', x); }
{ const bl = H({ day: '20261115', step: '로그인', pre: false }); const x = B(bl); ok(x && x.k === 'open', '⑩ 저장된 기록 pre:false(이어서 실행) · 단계 로그인 → 막음', x); }
{ const bl = H({ day: '20261115', gone: true, pre: true }); const x = B(bl); ok(x && x.k === 'open', '⑩ gone이면 pre가 있어도 막음', x); }
// ⑨ 도우미 상태 그대로(steps 배열 · 📦 ALPS 칸)
{ const R = { status: 'error', day: '20261115', steps: [{ k: 'login', st: 'ok' }, { k: 'check', st: 'ok' }, { k: 'upload', st: 'ok' }, { k: 'print', st: 'err' }, { k: 'verify', st: 'todo' }, { k: 'send', st: 'todo' }] }; ok(!F.osHelperStale(R, NOW), '⑨ 어제 · 접수 끝내고 출력에서 멈춤(steps) → 어제 일로 풀지 않음 = [▶ 이어서 진행]'); }
{ const R = { status: 'error', day: '20261115', steps: [{ k: 'login', st: 'ok' }, { k: 'check', st: 'err' }, { k: 'upload', st: 'todo' }] }; ok(F.osHelperStale(R, NOW), '⑨ 어제 · 겹침 검사에서 멈춤(steps) → 어제 일(안 막음)'); }
{ const R = { status: 'error', day: '20261115', summary: { upload: 3 }, steps: [{ k: 'check', st: 'err' }] }; ok(!F.osHelperStale(R, NOW), '⑨ 어제 · 접수 기록(summary.upload) 있음 → 풀지 않음'); }
{ const R = { status: 'error', day: '20261115', steps: [{ k: 'login', st: 'ok' }, { k: 'upload', st: 'err' }] }; ok(!F.osHelperStale(R, NOW), '⑨ 어제 · 접수 중 멈춤 → 풀지 않음(일부 접수됐을 수 있음)'); }
// 모든 호출부가 쓰는 '막음' 판정( B && (B.k === 'open' || B.src === 'helper') · if (osBlock()) )에 어제 error가 걸리지 않음
{ const x = B(H({ day: '20261115' })); const blocked = !!(x && (x.k === 'open' || x.src === 'helper')); ok(!blocked && !x, '호출부 판정 — 어제 error는 시작 전 검사·저절로 시작·단추 모두 막지 않음'); }
// 이 판정은 app.html 호출부 글 그대로인지(바뀌면 이 시험도 다시 볼 것)
{ const n = (T.match(/B && \(B\.k === 'open' \|\| B\.src === 'helper'\)/g) || []).length; ok(n >= 2, `시작 전 검사 두 곳(트랜잭션 안·누르기 직전)이 같은 판정 글 — ${n}곳`); }
{ ok(/async function osHelperResume\(B\) \{[^\n]*osHelperStale\(B\.h\)/.test(T), '[▶ 이어서 진행] 도우미 길(osHelperResume)은 어제 일을 이어 가지 않음'); ok(/R\.status === 'error' && !S\.alps\.remote && !osHelperStale\(R\)/.test(T), '📦 ALPS 칸 [▶ 이어서 진행] 단추는 오늘 멈춘 일에만'); }
if (bad) { console.log(`❌ tOSSTALE1116 ${bad}개 틀림`); process.exit(1); }
console.log('✓ tOSSTALE1116 통과');
