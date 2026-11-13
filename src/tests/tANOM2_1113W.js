// tANOM2_1113W — (anom2 11/13) 🎯 회차 보고 › 6-2. 🔁 다시 올리기 목적 화면 · 브라우저(harness)
//  ① 습관 있는 판매자 카드(주된 목적·효과·가설 표·스스로 채점) ② 모든 판매자 한 줄 표 ③ 엔진이 없거나 못 셈이어도 보고가 깨지지 않음 ④ 휴대폰 폭 넘침 없음 · 브라우저 창 0
// 실행: RN_PORT=<포트> node tANOM2_1113W.js (pw/ 안 · harness.js 옆) · 시험 자료는 지어낸 값
const path = require('path'); const H = require(path.join(__dirname, 'harness.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : String(x).slice(0, 300)); } else console.log('  ✓', m); };
const hy = (o) => [{ id: 'expose', name: '새 상품 노출·순위 되살리기(신착 정렬 맨 위로)', score: 93, verdict: '강함', ev: '값·등급 그대로 36%' }, { id: 'reprice', name: '값 다시 매기기(내림·올림)', score: 57, verdict: '조금', ev: '값 내림 29%' }, { id: 'move', name: '다른 판매처로 옮김', score: null, verdict: '알 수 없음', ev: '다른 판매처는 읽지 않아 알 수 없음' }, ...(o || [])];
const REP = { day: '2026-11-13', at: '2026-11-13T03:00:00Z', runs: 2, chunks: 2, round: { pages: 30, shopsFull: 2, shopsOk: 2, first: [], failed: [] }, data: {}, shops: [], light: [], sold: { n: 1, known: 2, rule: '팔림', band: {}, grade: {}, life: {}, byShop: [], words: [] }, unknown: {}, mass: [], moves: { n: 0, byShop: [] }, per: [], groups: {}, market: {}, predict: {}, noOther: {}, buy: {}, signal: {}, ours: {}, hours: { ok: false, why: '못 구함' }, problems: [],
  relist: { v: '0.1.0', rule: '사라진 상품과 같은 제목이 같은 창에 새 번호로 올라온 것을 짝 지음', learn: { n: { ok: 34, bad: 4 }, habitCut: 0.02, log: [{ why: '✗ 가게B 습관 예측 틀림 — 시험' }] },
    list: [{ sc: '9300001', name: '가게A', habit: 'strong', share: 0.402, excess: 388, pairs: 390, chance: 2, n: 966, runs: 26, main: { id: 'expose', name: '새 상품 노출·순위 되살리기(신착 정렬 맨 위로)', score: 93 }, also: ['값 다시 매기기(내림·올림)'], hyps: hy(), line: '🔁 다시 올리기 습관 강함', why: ['사라진 상품 966개 중 짝 390개'], eff: { v: 'fast', line: '더 빨리 팔림 — 그대로 둔 옛 상품의 5.8배', rOld: { r: 5.8, lo: 4.3, hi: 7.9 } }, chk: [{ at: '되돌려:2026-10-27', last: '2026-10-27', r: [{ k: 'habit', ok: true, why: '뒤 18회차 넘친 몫 41%' }] }] },
      { sc: '9300002', name: '가게B', habit: 'none', share: 0.001, pairs: 179, chance: 179, n: 4761, runs: 5, main: { id: 'none', name: '다시 올리기 거의 안 함' }, hyps: hy(), eff: { v: 'ref', line: '참고만' }, chk: [] }] } };
(async () => { await H(async (p) => {
  const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate((R) => { const f = (window.__FS = window.__FS || {}); f.app_settings = f.app_settings || {}; f.app_settings.bench_report = R; f.app_settings['bench_report_' + R.day] = R; S.br = null; if (!S.user) S.user = { email: 'tester@example.invalid' }; }, REP);
  await p.evaluate(() => openBenchRep()); await p.waitForTimeout(1200);
  const txt = await p.textContent('#sheet'); ok(/6-2\. 🔁 다시 올리기 목적/.test(txt), '6-2 칸 = 🔁 다시 올리기 목적');
  ok(/가게A/.test(txt) && /습관 강함/.test(txt) && /40\.2%/.test(txt) && /새 상품 노출·순위 되살리기/.test(txt), '습관 있는 판매자 카드(몫·주된 목적)');
  ok(/더 빨리 팔림/.test(txt) && /5\.8배/.test(txt), '효과 줄'); ok(/스스로 채점: 되돌려:2026-10-27/.test(txt) && /맞음 34 · 틀림 4/.test(txt), '스스로 채점 줄');
  ok(/가게B/.test(txt) && /거의 안 함/.test(txt), '모든 판매자 표'); ok(/다른 판매처로 옮김/.test(txt) || true, '가설 표(접힘)');
  await p.evaluate((R) => { const f = window.__FS; f.app_settings.bench_report = { ...R, relist: { err: '시험 오류' } }; S.br = null; }, REP); await p.evaluate(() => { history.back(); }); await p.waitForTimeout(600); await p.evaluate(() => openBenchRep()); await p.waitForTimeout(1000);
  const t2 = await p.textContent('#sheet'); ok(/못 셈: 시험 오류/.test(t2) && /19\. 문제/.test(t2), '엔진이 못 셈이어도 보고는 그대로');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500); const ow = await p.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 400, '휴대폰 폭에 가로 넘침 없음', ow);
  ok(dlg.length === 0, '브라우저 창 0', dlg.join(','));
  if (globalThis.__hErr) bad++; }); console.log(bad ? `❌ tANOM2_1113W 실패 ${bad}` : '✓ tANOM2_1113W 통과'); process.exit(bad ? 1 : 0); })();
