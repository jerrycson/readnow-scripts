/* tLED4_1113 — 리드 결정 11/13(일꾼 led4) 시험
 *  ① 🧾 먼저 떼는 몫(공용 일정표 0.18.27): ⭐ 판매자 다시 읽기 40MB를 하루 몫에서 먼저 떼어 둠 · 벤치마킹 남겨 둘 몫은 그만큼 줄임 · 셈 식 글 · 상품 정보 0.5GB(n1113n)는 꺼 둔 줄
 *  ② 수집기: budLeft(그 일만 먼저 떼는 몫) · 일반 몫 바로잡음에서 먼저 떼는 몫 남은 양을 뺌 · 휴대폰 상한 알림 keep · 신호 pace.rv
 *  ③ 늦게 받아 거절된 재고·판매중지 맡김 → 같은 문서를 맡긴 일 줄(hold)로 되돌림(웹앱 nvLateRequeue · 수집기 두 다리) · 3번까지 · 가격·등록은 그대로 거절
 *  ④ 클라우드 진단: regprice 가리개(메일) · heads에 수집기 신호 나이(beatMin)
 * 실행: node src/tests/tLED4_1113.js (서버·브라우저 필요 없음) */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'readnow-autosched-core.js')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const G = 1073741824, MB = 1048576; const DEC = Date.parse('2026-12-02T09:00:00+09:00'); /* (led4 둘째) 11월은 여분 일반 몫에서 — 하루 몫에서 떼는 셈은 12월부터(tSPARE1113 ⑤) */
require(path.join(R, 'readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS;

console.log('① 🧾 먼저 떼는 몫');
{ ok(/const VERSION = '0\.18\.(2[7-9]|[3-9]\d)'/.test(rd('readnow-autosched-core.js')), '공용 일정표 0.18.27 이상');
  const L = AS.resvOf({}); const s = L.find((r) => r.id === 'sellerRe'), p = L.find((r) => r.id === 'prodInfo');
  ok(s && s.on && s.mb === 40 && s.jobs.includes('rev6mStale'), '기본: ⭐ 판매자 다시 읽기 40MB 켜짐(rev6mStale 포함)', s);
  ok(p && !p.on && p.mb === 512, '상품 정보 0.5GB(n1113n)는 꺼 둔 줄', p);
  ok(AS.resvOf({ budget: { resv: { prodInfo: { on: true } } } }).find((r) => r.id === 'prodInfo').on === true, '설정 한 줄(budget.resv.prodInfo.on)로 켤 수 있음');
  ok(AS.resvOf({ budget: { resv: { sellerRe: { mb: 60 } } } }).find((r) => r.id === 'sellerRe').mb === 60, '크기도 설정으로 바꿈');
  const RV = AS.resvCalc({}, { rev6mStale: 10 * MB, bench: 5 * G }, DEC);
  ok(RV.total === 40 * MB && RV.left === 30 * MB && RV.eff === 10 * MB, '오늘 쓴 10MB → 남은 30MB', { t: RV.total, l: RV.left });
  ok(RV.of('prd:rev6mStale') && RV.of('revTop') && !RV.of('market') && !RV.of('bench'), '그 일만 먼저 떼는 몫을 씀(시장 지표·벤치마킹은 아님)');
  const RV2 = AS.resvCalc({}, { rev6mStale: 90 * MB }, DEC); ok(RV2.left === 0 && RV2.eff === 40 * MB, '몫을 넘겨 쓰면 남은 0(넘친 양은 일반 몫으로 셈)');
  /* 11/13 08:13 실제 숫자: 하루 몫 8.03GB · 벤치마킹 남겨 둠 7.95GB · 하는 중 */
  const now = Date.parse('2026-11-13T08:13:00+09:00');
  const a = AS.genPace({}, { now, dayCap: 8.03 * G, usedT: 7.5 * G, umT: 7.5 * G, mainCap: 7.95 * G, owe: true });
  const b = AS.genPace({}, { now, dayCap: 8.03 * G, usedT: 7.5 * G, umT: 7.5 * G, mainCap: 7.95 * G, owe: true, resv: AS.resvCalc({}, {}, DEC) });
  ok(Math.abs(a.mainRes - b.mainRes - 40 * MB) < 2, '벤치마킹 남겨 둘 몫이 40MB 줄어듦', { a: a.mainRes / G, b: b.mainRes / G });
  ok(Math.abs(a.pool - b.pool) < 2, '일반 몫(시간대 나눔 몫)은 그대로 — 먼저 떼는 몫은 따로', { a: a.pool / MB, b: b.pool / MB });
  ok(/먼저 떼는 몫 ⭐ 판매자 다시 읽기 40MB\(오늘 쓴 0MB · 남은 40MB\)/.test(b.txt) && /− 먼저 떼는 몫 40MB =/.test(b.txt), '셈 식 글에 먼저 떼는 몫이 보임: ' + b.txt.slice(0, 200));
  ok(b.resvT === 40 * MB && b.resvLeft === 40 * MB, 'genPace가 먼저 떼는 몫 합·남은 양을 돌려줌');
  const c = AS.genPace({}, { now, dayCap: 8.03 * G, usedT: 8.0 * G, umT: 7.9 * G, mainCap: 7.95 * G, owe: false, resv: AS.resvCalc({}, { rev6mStale: 30 * MB }, DEC) });
  ok(Math.abs(c.used - (0.1 * G - 30 * MB)) < 2, '일반에 쓴 양 = 전체 − 벤치마킹 − 먼저 떼는 몫 안에서 쓴 양', c.used / MB);
  ok(AS.genPace({}, { now, dayCap: G, usedT: 0, umT: 0, mainCap: 0.5 * G, owe: true }).txt.indexOf('먼저 떼는') < 0, 'resv를 안 넘기면 예전 글 그대로(옛 수집기와 함께 써도 됨)');
  /* poolCaps keep — 벤치마킹이 하루 몫을 넘겨 써 휴대폰 오늘 몫이 바닥 */
  const pc = { nLeft: 18, phones: [{ id: 'A', dev: 'USB\\A', devUsed: 10 * G, left: 0, share: 4 * G, monthLeft: 50 * G, active: true, connected: true, name: '휴대폰 1' }, { id: 'B', dev: 'USB\\B', devUsed: 3 * G, left: 0, share: 4 * G, monthLeft: 80 * G, connected: true, name: '휴대폰 2' }], spare: null };
  const k0 = AS.poolCaps(pc, { must: false }), k1 = AS.poolCaps(pc, { must: false, keep: 40 * MB });
  ok(k0['USB\\A'].lim === 10 * G && k1['USB\\A'].lim === 10 * G + 40 * MB && k1['USB\\A'].keep === 40 * MB && k1['USB\\B'].lim === 3 * G, 'keep 40MB → 지금 쓰는 휴대폰만 40MB 더 열림', k1);
  const pc2 = JSON.parse(JSON.stringify(pc)); pc2.phones[0].left = G; ok(AS.poolCaps(pc2, { must: false, keep: 40 * MB })['USB\\A'].lim === 11 * G, '휴대폰에 오늘 몫이 남아 있으면 더 열지 않음');
  ok(AS.poolCaps(pc, { must: true, keep: 40 * MB })['USB\\A'].keep == null, '벤치마킹 한 바퀴 중(must)에는 더하지 않음');
  const pc3 = JSON.parse(JSON.stringify(pc)); pc3.phones[0].monthLeft = 0; pc3.phones[1].active = false; pc3.phones[1].connected = false; ok(AS.poolCaps(pc3, { must: false, keep: 40 * MB })['USB\\A'].lim === 10 * G, '그 휴대폰 이달 남은 양이 0이면 더 열지 않음(120GB 상한 지킴)'); }

console.log('② 수집기');
{ const C = rd('src/readnow-collector.src.js');
  ok(/const rv = BUD\.resv && BUD\.resv\.of \? BUD\.resv\.of\(k\) : null; if \(rv && rv\.left > 0\) return rv\.left \+ Math\.max\(0, BUD\.left\.gen\);/.test(C), 'budLeft — 먼저 떼는 몫 일은 그 몫 + 일반 몫');
  ok(/if \(BUD\.benchOwe\) return 0; const rv = /.test(C), '벤치마킹 한 바퀴 전에는 지금처럼 0(정범님 10/25)');
  ok(/genCap = Math\.max\(0, dayCap - usedT - \(owe \? Math\.max\(0, mainCap - rT - umT\) : 0\) - rL\)/.test(C), '일반 몫 바로잡음에서 먼저 떼는 몫 남은 양을 뺌');
  ok(/AS\.genPace\(SCHED \|\| \{\}, \{ now: Date\.now\(\), dayCap, usedT, umT, mainCap, owe, resv: RV \}\)/.test(C), 'genPace에 resv');
  ok(/AS\.poolCaps\(pc, \{ must: !!b\.benchMust, keep: \+poolTick\._keep \|\| 0 \}\)/.test(C) && /poolTick\._keep = b\.benchOwe \|\| !b\.resv \? 0 :/.test(C), '휴대폰 상한 알림에 keep(벤치마킹 한 바퀴 뒤에만)');
  ok(/slice\(0, 480\), rv: BUD\.resv/.test(C), '신호 pace에 먼저 떼는 몫(rv) · 글 480자');
  ok(/🧾 먼저 떼는 몫 열림 — /.test(C), '하루 한 번 기록 줄(내일 0시 뒤 확인 거리)');
  ok(/LATE_RQ_MAX = 3/.test(C) && (C.match(/LATE_RQ_MAX = 3/g) || []).length === 2, '늦음 되돌림 상한 3(두 다리)');
  ok(/st: 'hold', holdAt: iso\(\), holdWhy: why\.slice\(0, 200\), lateN: n, lastRej:/.test(C), '🟦 예스24 다리: 늦게 받은 맡김 → 같은 문서 hold · 까닭 lastRej');
  ok(/rows0\.every\(\(x\) => x && x\.rid && x\.rk && x\.src !== 'price'\)/.test(C), '🟦 다시 셀 수 있는 줄만(가격은 예전처럼 거절)');
  ok(/String\(\(c\.job \|\| \{\}\)\.k \|\| ''\) === 'status' && n <= LATE_RQ_MAX/.test(C), '🟩 네이버 수집기 다리: 재고·판매중지(status)만 되돌림');
  ok(/lookupBook/.test(C) && /usedErr/.test(C), '(mkt1) lookupBook 빈 중고 화면 고침이 같은 판에'); }

console.log('③ 웹앱 — 늦게 받아 거절된 맡김 되돌림');
{ const A = rd('src/app.html'); const m = A.match(/const PEND_LATE_MAX = 3;[^\n]*\nconst nvLateRej = [^\n]*\nfunction nvLateRequeue[\s\S]*?\n  return \{[^\n]*\n/);
  ok(!!m, 'nvLateRequeue 함수 있음');
  if (m) { const f = new Function('deviceName', m[0] + '; return { nvLateRequeue, nvLateRej, PEND_LATE_MAX };')(() => 'MJ-MAIN'); const late = { ok: false, late: true, err: '늦게 받은 맡김(웹앱이 보낸 지 30분 넘음) — 받지 않음' };
    const c = { k: 'job', led: { rid: 'S1|nv|123' }, job: { k: 'status', originNo: '123' } };
    const r1 = f.nvLateRequeue(c, late); ok(r1 && r1.st === 'hold' && r1.lateN === 1 && /늦게 받은 맡김으로 거절/.test(r1.holdWhy) && r1.lastRej && r1._t, '재고·판매중지 늦음 거절 → hold · 1/3 · 까닭 남김', r1);
    ok(f.nvLateRequeue({ ...c, lateN: 3 }, late) === null, '3번 넘으면 되돌리지 않음(되풀이 0 · 사람 확인)');
    ok(f.nvLateRequeue({ ...c, job: { k: 'price' } }, late) === null && f.nvLateRequeue({ k: 'job', job: { k: 'status' } }, late) === null, '가격·장부 줄 없는 맡김은 되돌리지 않음');
    ok(f.nvLateRequeue(c, { ok: false, err: '네이버가 거절' }) === null && f.nvLateRequeue(c, { ok: true }) === null, '다른 거절·성공은 그대로');
    ok(f.nvLateRej({ ok: false, err: '늦게 받은 맡김(웹앱이 보낸 지 30분 넘음)' }), '옛 번외(late 칸 없음)도 글로 알아봄'); }
  ok(/const rq = nvLateRequeue\(c, r\); if \(rq\) \{ const \{ _t, \.\.\.rq0 \} = rq; await db\.collection\('col2_naver_cmd'\)\.doc\(c\.id\)\.set\(\{ \.\.\.rq0, env: firebase\.firestore\.FieldValue\.delete\(\), trail: firebase\.firestore\.FieldValue\.arrayUnion\(_t\) \}, \{ merge: true \}\); next = 3e3; continue; \}/.test(A), '로거 웹앱 nvRelayTick이 같은 문서를 되돌림(새 맡김 안 만듦 → 겹침 0)'); }

console.log('④ 클라우드 진단');
{ const CL = rd('cloud/index.js');
  ok(/out\.regPrice = diagScrubRaw\(\(ss\.docs \|\| \[\]\)\.map/.test(CL), 'regprice 결과에 가리개(diagScrubRaw — 메일·전화)');
  const sc = CL.match(/const DIAG_PII_K = [^\n]*\nconst diagScrub = [^\n]*\n/); if (sc) { const f = new Function(sc[0] + '; return diagScrub;')(); const o = f({ log: [{ by: 'someone@example.com', at: 'x' }] }); ok(o.log[0].by === '(메일 가림)', '메일 주소가 (메일 가림)으로', o); }
  ok(/beatMin: b0 && \+b0\.atMs > 0/.test(CL) && /doc\('pcBeat'\)/.test(CL), 'heads에 수집기 신호(pcBeat) 나이·판'); }

console.log(bad ? `❌ tLED4_1113 실패 ${bad}` : '✓ tLED4_1113 모두 통과'); process.exit(bad ? 1 : 0);
