// tBENCHFIX1_1120 — (benchfix1 11/20) 🎯 집중 벤치마킹 보고 고침 · 브라우저 필요 없음
//  ① 📶 휴대폰 이달 남은 양 바닥 날 = 두 대 남은 양 합 ÷ 하루 쓰는 양 합(예 91.9GB ÷ 8.75GB ≈ 10.5일 → 11/30) · 꺼진 폰·0 사용·남은 양 모름 · 여분 몫은 섞지 않음
//  ② 🗓 며칠치를 한꺼번에 확정한 판매자(앞 회차 '처음 안 보임'을 두 번 확인 · 4일치) — 판매자 줄 N일치 · 팔림 합·가운데 값 하루치 · 판매율 기준선 z도 실제 간격으로
// 실행: node src/tests/tBENCHFIX1_1120.js · 시험 자료는 모두 지어낸 값(가게 번호 9100001…) · 쓰기 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', '..', 'cloud')) ? path.join(__dirname, '..', '..') : path.join(__dirname, '..');
const BR = require(path.join(ROOT, 'cloud', 'benchrep.js'));
const { intelCalc } = require(path.join(ROOT, 'cloud', 'intel.js'));
const APP = fs.readFileSync(path.join(ROOT, fs.existsSync(path.join(ROOT, 'src', 'app.html')) ? 'src/app.html' : 'app.html'), 'utf8');
const G = 1073741824; const GB = (x) => Math.round(x * G); const day = '2026-11-19';
const net = (phones, tether) => BR.netSum({ pcs: { LOGGER: { helper: { tether, phones } } } }, day);

console.log('① 📶 바닥 날 — 두 대 합');
{ // 11/19 진단 꼴: 휴대폰 1 남은 45.0GB · 휴대폰 2 남은 46.8GB · 어제 4.5GB + 4.2GB(합 8.75GB 남짓)
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(75), today: GB(4.5), connected: true, inet: { ok: true } }, { name: '휴대폰 2', capGB: 120, used: GB(73.2), today: GB(4.25), connected: true, inet: { ok: true } }], GB(8.75));
  ok(d.runOutBy === 'sum' && Math.abs(d.poolLeft / G - 91.8) < 0.05, '남은 양 = 두 대 합 91.8GB', d);
  ok(Math.abs(d.runOutDays - 10.5) <= 0.1, '≈ 10.5일(한 대 45GB로 셈한 5일이 아님)', d.runOutDays);
  ok(d.runOutDay === '2026-11-30', '바닥 날 약 11/30(11/24 아님)', d.runOutDay);
  ok(d.poolNames.length === 2 && d.daysLeft === 11, '두 대 모두 셈 · 남은 날 11', d); }
{ // 한 대가 0 사용(연결됨 · 남은 양 앎) — 넘겨받을 수 있으니 남은 양에 넣음 · 하루 쓰는 양은 쓰는 폰만
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(110), today: GB(5), connected: true }, { name: '휴대폰 2', capGB: 120, used: GB(100), today: 0, connected: true }], null);
  ok(d.rateBytes === GB(5) && Math.abs(d.runOutDays - 6) < 0.05, '한 대 0 사용: (10+20) ÷ 5 = 6일 · 테더링 합이 없으면 폰마다 오늘 합', d);
  ok(d.runOutDay === '2026-11-25', '→ 11/25', d.runOutDay); }
{ // 한 대가 꺼짐(연결 끊김) — 그 폰 남은 양은 못 씀
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(110), today: GB(5), connected: true }, { name: '휴대폰 2', capGB: 120, used: GB(10), today: GB(1), connected: false }], GB(5));
  ok(d.poolNames.join() === '휴대폰 1' && d.runOutDays === 2, '꺼진 폰은 남은 양에서 뺌 → 10 ÷ 5 = 2일', d); }
{ // 오늘 쓴 폰의 남은 양을 모름(상한 모름) — 이상한 날을 내지 않음
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(110), today: GB(4), connected: true }, { name: '휴대폰 2', used: GB(10), today: GB(4), connected: true }], GB(8));
  ok(d.runOutDay == null && d.runOutDays == null && (d.runOutUnknown || []).includes('휴대폰 2'), '남은 양 모름 → 바닥 날 없음 · 모름에 적음', d); }
{ // 아직 넉넉 — 이달 끝을 넘으면 날 없음(일수만)
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(20), today: GB(4), connected: true }, { name: '휴대폰 2', capGB: 120, used: GB(20), today: GB(4), connected: true }], GB(8));
  ok(d.runOutDay == null && d.runOutDays === 25, '넉넉하면 바닥 날 없음 · 25일', d); }
{ // 테더링·사용 0 — 0으로 나누지 않음
  const d = net([{ name: '휴대폰 1', capGB: 120, used: GB(20), today: 0, connected: true }], 0);
  ok(d.runOutDay == null && d.runOutDays == null, '쓰는 양 0이면 날 없음', d); }
ok(!/F17|여분 몫.*\+|spare/i.test(String(BR.netSum).match(/runOutBy[\s\S]*?daysLeft = daysLeft/)[0].replace(/\/\*[\s\S]*?\*\//g, '')), '이달 여분 몫(F17)은 바닥 셈에 섞지 않음');

console.log('② 🗓 며칠치 확정 판매자');
const J = (a) => JSON.stringify(a);
const gl = (pre, n, p) => Array.from({ length: n }, (_, i) => J([pre + i, `${pre} 제목 ${i}`, p, '상', 3 + i, '20261110', 0]));
const runs = [
  { sc: '9100001', name: '가게곰', day, dayId: '9100001_' + day, total: 10000, add: 10, gone: 40, goneNew: 8, missOnce: 5, moved: 0, spanDays: 1, full: true, complete: true, readTo: 200, runLastPage: 200, runAt: '2026-11-18T15:10:00Z', at: '2026-11-18T15:40:00Z', goneList: gl('g', 8, 2000), addList: [], movedList: [], lowOffList: [] },
  { sc: '9100002', name: '가게낮', day, dayId: '9100002_' + day, total: 5000, add: 10, gone: 10, goneNew: 4, missOnce: 8, moved: 0, spanDays: 1, full: true, complete: true, readTo: 100, runLastPage: 100, runAt: '2026-11-18T16:10:00Z', at: '2026-11-18T16:30:00Z', goneList: gl('h', 4, 1000), addList: [], movedList: [], lowOffList: [] }];
const hp = (sc, d, o) => ({ sc, day: d, dayId: sc + '_' + d, total: sc === '9100001' ? 10000 : 5000, add: 10, gone: 10, missOnce: 9, spanDays: 1, full: true, complete: true, runAt: d + 'T00:10:00Z', ...o });
const hist = [hp('9100001', '2026-11-10'), hp('9100001', '2026-11-11'), hp('9100001', '2026-11-12'), hp('9100001', '2026-11-15', { missOnce: 40, spanDays: 4 }), hp('9100002', '2026-11-16'), hp('9100002', '2026-11-17'), hp('9100002', '2026-11-18', { missOnce: 10 })];
const acc = BR.makeAcc({ day, runs, hist, role: { '9100001': 'main', '9100002': 'main' }, force: { done: true, startedAt: '2026-11-18T15:00:00Z', doneAt: '2026-11-18T17:00:00Z', failed: [] }, net: net([], 0), prevRep: null, plan: [], intel: null });
acc.shop('9100001', {}); acc.endShop('9100001'); acc.shop('9100002', {}); acc.endShop('9100002'); acc.ours([]);
const P = acc.done(); const sG = P.shops.find((s) => s.sc === '9100001'), sH = P.shops.find((s) => s.sc === '9100002');
ok(sG && Math.abs(sG.win - 4) < 0.01 && sG.days === 4, '가게곰: 앞 회차 처음 안 보임 40을 이번에 확정 → 4일치(판매자 줄)', sG);
ok(sH && sH.days == null, '가게낮: 하루치 — N일치 없음', sH);
ok(P.sold.n === 12 && P.sold.med === 2000, '날 것 그대로: 팔림 12 · 가운데 값 2,000원(가게곰 8개가 끌어올림)', P.sold);
ok(P.sold.nDay === 6, '하루치 팔림 합 = 8/4 + 4 = 6', P.sold.nDay);
ok(P.sold.medDay === 1000, '하루치 가운데 값 = 1,000원(가게곰 한 개 무게 1/4)', P.sold.medDay);
const bG = (P.sold.byShop || []).find((b) => b.name === '가게곰');
ok(bG && bG.days === 4 && bG.nDay === 2 && !(P.sold.byShop.find((b) => b.name === '가게낮') || {}).days, '숍마다 줄에도 4일치 · 하루 2', P.sold.byShop);
ok(P.problems.some((p) => /가게곰 4일치/.test(p) && /팔림 6개/.test(p)), '문제 칸에 며칠치 판매자·하루치 숫자', P.problems.filter((p) => /🗓/.test(p)));

console.log('② 판매율 기준선 z — 실제 간격');
{ const mk = (d, o) => ({ sc: '9100001', name: '가게곰', day: d, total: 10000, gone: 50, missOnce: 50, spanDays: 1, complete: true, full: true, ...o });
  const days = [mk('2026-11-12', { gone: 48 }), mk('2026-11-13', { gone: 52 }), mk('2026-11-14', { gone: 50 }), mk('2026-11-15', { gone: 49 }), mk('2026-11-16', { gone: 51 }), mk('2026-11-18', { spanDays: 4, missOnce: 200, gone: 51 }), mk(day, { gone: 200, missOnce: 50 })];
  const R = intelCalc(days, [{ sc: '9100001' }], day);
  ok(!(R.anom || []).some((a) => a.kind === '판매율' && a.name === '가게곰'), '4일치 확정 200 ÷ 4일 = 하루 50 → 기준선 경보 없음', R.anom);
  const R2 = intelCalc(days.map((v) => (v.day === '2026-11-18' ? { ...v, missOnce: 0 } : v)), [{ sc: '9100001' }], day);
  ok((R2.anom || []).some((a) => a.kind === '판매율' && a.name === '가게곰' && a.z >= 3), '두 번 확인이 아니면(앞 회차 처음 안 보임 0) 하루 200 → 경보', R2.anom); }

ok(/const F = \[[^\]]*'missOnce'/.test(fs.readFileSync(path.join(ROOT, 'cloud', 'intel.js'), 'utf8')), '기준선 읽기 칸에 처음 안 보임(missOnce)도 읽음');
console.log('웹앱 화면 글');
ok(/da\.runOutBy === 'sum' \? `휴대폰 \$\{\(da\.poolNames \|\| \[\]\)\.length\}대 합한`/.test(APP) && /이달 여분 몫은 따로/.test(APP), '바닥 날 = 휴대폰 N대 합 · 여분 몫 따로');
ok(/s\.days > 1 \? ` <small[^`]*\$\{Math\.round\(s\.days \* 10\) \/ 10\}일치/.test(APP), '판매자 표 숍 이름 옆 N일치');
ok(/하루치로 고르면 팔림 <b>\$\{brN\(so\.nDay\)\}<\/b>개 · 가운데 값 <b>\$\{brW\(so\.medDay\)\}/.test(APP), '팔린 것 특징에 하루치 팔림·가운데 값');
ok(/x\.days > 1 \? ` · \$\{Math\.round\(x\.days \* 10\) \/ 10\}일치 → 하루 \$\{num\(x\.nDay\)\}`/.test(APP), '숍마다 가운데 값 줄에 N일치');

if (bad) { console.log(`❌ 실패 ${bad}`); process.exit(1); } console.log('✓ 통과 — tBENCHFIX1_1120');
