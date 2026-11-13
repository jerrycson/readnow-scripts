// tBENCHREP1113W — (benchfix 11/13) 🎯 벤치마킹 회차 보고 화면 · 브라우저(harness)
//  ① 보고가 없으면 안내 글 ② 🔬 연구 탭 › 🔬 연구 모음 묶음의 🎯 회차 보고 카드 → 화면 · 19줄(묶은 칸 16 + 🕵 수집 품질) · 모름 표시 · 날 칩 · 닫기
//  ③ 휴대폰 폭 가로 넘침 없음 · 브라우저 창(alert/confirm/prompt) 0
// 실행: RN_PORT=<포트> node tBENCHREP1113W.js (pw/ 안 · harness.js 옆) · RN_REP=<보고 json>이면 그 자료로 · RN_SHOT=<폴더>면 화면 사진 · 시험 자료는 지어낸 값
const fs = require('fs'); const path = require('path'); const H = require(path.join(__dirname, 'harness.js'));
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : String(x).slice(0, 300)); } else console.log('  ✓', m); };
const REP = process.env.RN_REP ? JSON.parse(fs.readFileSync(process.env.RN_REP, 'utf8')) : { day: '2026-11-13', at: '2026-11-13T00:30:00Z', runs: 2, chunks: 2, round: { pages: 30, pagesFull: 30, pagesLight: 0, shopsFull: 2, shopsOk: 1, first: [], failed: [] }, data: { phones: [] },
  shops: [{ sc: '9000001', name: '가게A', role: '주요', total: 1000, pages: 20, lastPage: 20, add: 3, gone: 2, goneNew: 1, up: 0, dn: 1, dnPct: -30, span: 1, perDay: 2, full: true }, { sc: '9000005', name: '가게E', role: '주요', total: 300, pages: 9, lastPage: 10, add: 0, gone: null, goneNew: null, unk: true, up: 0, dn: 0, full: false, cover: 0.999, notRead: 12 }],
  light: [], sold: { n: 1, known: 1, rule: '팔림은 숍 끝까지 읽은 숍만 셈', med: 900, band: { '~3천': 1 }, grade: { 중: 1 }, life: { '4~7일': 1 }, byShop: [], words: [] }, unknown: { notFull: ['가게E'], first: [], light: [], notRead: ['가게Z'], mass: ['가게C'] },
  mass: [{ sc: '9000003', name: '가게C', gone: 12000, share: 0.13, perDay: 0.03, baseShare: 0.95, stillShare: 0.3, by: 'cloud' }], moves: { n: 1, dn: 1, up: 0, pairs: [['500→350', 1]], tail: [], byShop: [] }, per: [], groups: { volume: ['가게A'], select: [], mid: [] }, market: {}, predict: { lowOff: 1, byShop: [] }, noOther: { n: 0, top: [] }, buy: { cheap: [], togetherTop: [] }, signal: {},
  ours: { ok: true, n: 2, overlap: 1, hi: 1, hi20: 1, top: [{ t: '우리와 같은 책', p: 9000, min: 5000, gap: 0.8, shops: 1 }] }, hours: { ok: false, why: '못 구함' }, intel: { planN: 2, readN: 1, cov: 0.5, stale7: 1, anomN: 0, anom: [] }, problems: ['📦 가게C 대량 사라짐'] };
(async () => { await H(async (p) => {
  const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  const shot = async (n) => { if (process.env.RN_SHOT) await p.screenshot({ path: path.join(process.env.RN_SHOT, n), fullPage: false }); };
  await p.evaluate(() => openBenchRep()); await p.waitForTimeout(600);
  ok(/아직 보고가 없습니다/.test(await p.textContent('#sheet')), '보고가 없으면 안내 글');
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  await p.evaluate((R) => { const f = (window.__FS = window.__FS || {}); f.app_settings = f.app_settings || {}; f.app_settings.bench_report = R; f.app_settings['bench_report_' + R.day] = R; S.br = null; }, REP);
  await p.evaluate(() => { S.tab = 'research'; renderTabs(); renderMainNow(); }); await p.waitForTimeout(900);
  const card = await p.$('[data-navgo="benchRep"]'); ok(!!card, '🔬 연구 탭에 🎯 회차 보고 카드'); if (card) await card.click(); await p.waitForTimeout(1000);
  const txt = await p.textContent('#sheet'); ok(/회차 보고/.test(txt) && /19\. 문제/.test(txt) && /17\. 우리와 겹침/.test(txt), '화면 열림 · 19번 문제 · 17번 우리와 겹침');
  const n = (await p.$$('#sheet .br-s')).length; ok(n === 17, '접는 칸 17(19줄 + 🕵 수집 품질)', n);
  ok(/모름/.test(txt) && /정보 수집 품질/.test(txt) && /대량 사라짐/.test(txt), '모름 표시 · 🕵 수집 품질 · 📦 대량 사라짐'); await shot('br_pc.png');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500); const ow = await p.evaluate(() => document.documentElement.scrollWidth); ok(ow <= 400, '휴대폰 폭에 가로 넘침 없음', ow); await shot('br_ph.png'); await p.setViewportSize({ width: 1400, height: 900 });
  const chip = await p.$('#br_days [data-brday]'); ok(!!chip, '날 칩'); if (chip) { await chip.click(); await p.waitForTimeout(700); }
  await p.click('#back'); await p.waitForTimeout(600); ok(!(await p.evaluate(() => !!(S.detail && S.detail.benchRep))), '닫기');
  ok(dlg.length === 0, '브라우저 창 0', dlg.join(','));
  if (globalThis.__hErr) bad++; }); console.log(bad ? `❌ tBENCHREP1113W 실패 ${bad}` : '✓ tBENCHREP1113W 통과'); process.exit(bad ? 1 : 0); })();
