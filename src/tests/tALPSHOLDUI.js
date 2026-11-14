// tALPSHOLDUI — (0.5.8 shipfix1 · 정범님 11/14 17:26 「송장 입력 등은 전부 평일같이 끝까지 · 따로 변경하지 마」)
//  ① 웹앱 출고 화면 ALPS 칸의 '🧭 지역 지연 보류 n상자' 한 줄이 도우미 상태(holds)로 그려짐 · 받는 분 이름 없이
//  ② 송장 입력 흐름(ALPS 뒤 알라딘 송장 입력 맡김 · 원스톱 INV → Y24)은 휴일·평일 가리지 않고 예전 그대로 — 휴일 막기 같은 갈래가 없음
// 실행: node src/tests/tALPSHOLDUI.js (웹앱 원본 src/app.html을 읽어 봄 · 브라우저 없이)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const i = app.indexOf('${(R.holds || []).length ? (() => {'); ok(i > 0, '보류 한 줄 자리 있음');
const expr = app.slice(i + 2, app.indexOf("})() : ''}", i) + 9);
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const draw = (holds) => vm.runInNewContext(expr, { R: { holds }, esc });
ok(draw([]) === '' && draw(undefined) === '', '보류가 없으면(옛 도우미 포함) 아무것도 안 그림');
{ const h = draw([{ id: 'a', day: '20261114', boxes: 2, rows: 3, released: 0, kinds: ['region'], why: ['읍/면/리 구역은 주7일 배송 불가합니다.'], areas: ['전라남도 신안군'], checkedAt: '2026-11-14T16:20:05.000Z' }]);
  ok(/🧭 지역 지연 보류 2상자/.test(h) && /주7일 배송 불가/.test(h) && /전라남도 신안군/.test(h) && /11\/14 출고/.test(h) && /엔진이 다시 확인 중/.test(h) && /마지막 확인 11-14 16:20/.test(h), '보류 2상자 · 까닭 · 지역 · 날짜 · 마지막 확인 ' + h.replace(/<[^>]+>/g, '').slice(0, 160)); }
{ const h = draw([{ id: 'a', day: '20261114', boxes: 1, released: 1, why: [], areas: [] }, { id: 'b', day: '20261115', boxes: 2, released: 0, why: ['<b>x</b>'], areas: [] }]);
  ok(/보류 3상자/.test(h) && /풀림 1상자 — 출력 대기/.test(h) && !/<b>x<\/b>/.test(h), '여러 날 합침 · 풀림 표시 · 글은 이스케이프'); }
{ const f = (app.match(/async function alpsInvAuto\([\s\S]*?\n(?=function alpsInvCount)/) || [])[0] || '';
  ok(f && /status: 'queued', items,/.test(f) && !/holiday|shipHoliday|isBizDay/.test(f), '알라딘 송장 입력 맡김은 휴일·평일 모두 바로 queued(예전 그대로)'); }
{ const k = app.indexOf("const out = await alpsInvAuto(M, b.file || 'ALPS 자동 처리', b.alpsId, { force: true, os: r.id });"); const seg = app.slice(k, k + 400);
  ok(k > 0 && /^const out = await alpsInvAuto\([^\n]*\n\s*if \(!out \|\| out === 'none'\) return osPut\(r\.id, \{ ph: 'Y24'/.test(seg), '원스톱 INV → Y24(예스24 발송처리)로 그대로 이어 감 — 휴일 멈춤 없음'); }
ok(!/holidayNoInput|invHolidayRelease|function shipHoliday/.test(app), "'휴일엔 송장 입력 안 함' 같은 설정·갈래가 없음(정범님 17:26)");
console.log(bad ? `❌ tALPSHOLDUI 실패 ${bad}` : '✓ tALPSHOLDUI 통과'); process.exit(bad ? 1 : 0);
