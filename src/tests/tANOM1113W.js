// tANOM1113W — (anom1 11/13) 🎯 회차 보고 › 6. 🧠 자료 이상 판단 화면 · 브라우저(harness)
//  ① 판정 카드(가설 이름·통계 처리·근거 줄·가설 점수 표) ② 평소 숍은 한 줄 ③ '↩ 다시 넣기'는 두 번 눌러야 · 기존 회차 빼기 장치로 bench_days에 excl:false
//  ④ 판매자 표 '사라짐/일'이 실제 간격으로 나눈 값 ⑤ 휴대폰 폭 넘침 없음 · 브라우저 창 0
// 실행: RN_PORT=<포트> node tANOM1113W.js (pw/ 안 · harness.js 옆) · 시험 자료는 지어낸 값
const path = require('path'); const H = require(path.join(__dirname, 'harness.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : String(x).slice(0, 300)); } else console.log('  ✓', m); };
const A = (o) => ({ sc: '9000001', name: '가게A', dayId: '9000001_2026-11-13', human: null, act: 'in', anom: false, pick: { id: 'normal', name: '평소', act: 'in', conf: 1 }, line: '✓ 평소', why: [], warn: [], metrics: [], ranked: [], win: 1, relist: null, move: null, gone: 10, total: 1000, span: 1, ...o });
const REP = { day: '2026-11-13', at: '2026-11-13T03:00:00Z', runs: 3, chunks: 3, round: { pages: 30, shopsFull: 3, shopsOk: 3, first: [], failed: [] }, data: {},
  shops: [{ sc: '9000002', name: '가게B', role: '주요', total: 78283, add: 4160, gone: 13526, goneNew: 626, span: 3.73, perDay: 3626, win: 25.24, perDayReal: 536, full: true, anom: '🟢 긴 틈에 쌓인 평소 사라짐 → 통계에 넣음', act: 'in', up: 0, dn: 0 }],
  light: [], sold: { n: 1, known: 3, rule: '팔림', band: {}, grade: {}, life: {}, byShop: [], words: [] }, unknown: {}, mass: [], moves: { n: 0, byShop: [] }, per: [], groups: {}, market: {}, predict: {}, noOther: {}, buy: {}, signal: {}, ours: {}, hours: { ok: false, why: '못 구함' }, problems: [],
  anom: { v: '0.1.0', on: true, rule: '판매자마다 최근 35일 평소를 배움', relistCut: { n: 7, by: { '9000003': 7 } }, learn: { n: { fp: 1, fn: 0, ok: 2 }, log: [{ why: '사람이 다시 넣음 — 시험' }] },
    list: [A({}), A({ sc: '9000002', name: '가게B', dayId: '9000002_2026-11-13', anom: true, pick: { id: 'longgap', name: '긴 틈에 쌓인 평소 사라짐', act: 'in', conf: 0.99 }, line: '🟢 긴 틈에 쌓인 평소 사라짐 → 통계에 넣음 (확신 99%)', why: ['사라짐 13,526개 = 숍의 18%', '📏 이번 간격(3.73일)으로 나누면 크지만 실제로 사라진 때는 앞 간격 25.24일'], ranked: [{ id: 'longgap', name: '긴 틈에 쌓인 평소 사라짐', score: 3, inc: 0, ev: [{ k: 'gap', d: 3 }] }] }),
      A({ sc: '9000003', name: '가게C', dayId: '9000003_2026-11-13', act: 'out', anom: true, pick: { id: 'relist', name: '다시 올리기(내렸다 새 번호로 올림)', act: 'out', conf: 1 }, line: '📦 다시 올리기 → 통계에서 뺌', why: ['🔁 사라진 제목 다시 올라옴 100% · 대조군 0%'], ranked: [{ id: 'relist', name: '다시 올리기', score: 6.5, inc: 0, ev: [] }] })] } };
(async () => { await H(async (p) => {
  const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate((R) => { const f = (window.__FS = window.__FS || {}); f.app_settings = f.app_settings || {}; f.app_settings.bench_report = R; f.app_settings['bench_report_' + R.day] = R; S.br = null; if (!S.user) S.user = { email: 'tester@example.invalid' }; }, REP);
  await p.evaluate(() => openBenchRep()); await p.waitForTimeout(1200);
  const txt = await p.textContent('#sheet'); ok(/🧠 자료 이상 판단/.test(txt), '6번 칸 = 🧠 자료 이상 판단');
  ok(/긴 틈에 쌓인 평소 사라짐/.test(txt) && /통계에 넣음/.test(txt) && /다시 올리기/.test(txt) && /통계에서 뺌/.test(txt), '판정 카드 둘(넣음·뺌)');
  ok(/✓ 평소: 가게A/.test(txt), '평소 숍은 한 줄'); ok(/7개를 팔림에서 뺌/.test(txt), '다시 올리기 줄 뺀 수'); ok(/틀린 경보 1/.test(txt), '배운 것 줄');
  ok(/536/.test(txt) && /실제 간격 25\.2일/.test(txt), '판매자 표 사라짐/일 = 실제 간격으로 나눔');
  const b = await p.$('[data-anomx^="9000003|"]'); ok(!!b && /다시 넣기/.test(await b.textContent()), '뺀 회차에 ↩ 다시 넣기 단추');
  if (b) { await b.click(); await p.waitForTimeout(300); const w1 = await p.evaluate(() => (((window.__FS || {}).bench_days || {})['9000003_2026-11-13'] || {}).excl); ok(w1 === undefined, '한 번 누르면 아직 안 바뀜', w1);
    await p.waitForTimeout(500); const b2 = await p.$('[data-anomx^="9000003|"]'); await b2.click(); await p.waitForTimeout(900);
    const w2 = await p.evaluate(() => (((window.__FS || {}).bench_days || {})['9000003_2026-11-13'] || {})); ok(w2.excl === false && !!w2.exclBy, '두 번 누르면 bench_days excl:false(기존 회차 빼기 장치)', JSON.stringify(w2).slice(0, 200)); }
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500); const ow = await p.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 400, '휴대폰 폭에 가로 넘침 없음', ow);
  ok(dlg.length === 0, '브라우저 창 0', dlg.join(','));
  if (globalThis.__hErr) bad++; }); console.log(bad ? `❌ tANOM1113W 실패 ${bad}` : '✓ tANOM1113W 통과'); process.exit(bad ? 1 : 0); })();
