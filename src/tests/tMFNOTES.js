// tMFNOTES — (11/10 정범님 새벽) 판매자 탭 🧭 판매자 군집·시장 공정성 지표 — 날짜 접점(⚠ 추정 · 증거 아님) 칸
//  ① 공개 코드엔 날짜·판매자 번호가 없음(자료에서만) ② 기기 사이 자료(app_settings/market_fair_notes)를 열 때만 읽어 보임 ③ 📂 파일 자료는 메모리에만 · 줄마다 '⚠ 추정 · 증거 아님' · 글은 가려 그림(HTML 안 됨) ④ 팝업 없음
// 쓰는 법: RN_PORT=<포트> node tMFNOTES.js (harness.js 옆에서) · 시험 자료는 지어낸 글(손님·판매자 정보 없음)
const fs = require('fs'); const path = require('path');
const APP = fs.readFileSync(['../app.html', '../../src/app.html'].map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x)), 'utf8');
let bad = 0; const ok = (c, m, o) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || o === undefined ? '' : ' — ' + JSON.stringify(o).slice(0, 300))); if (!c) bad++; };
{ const a = APP.indexOf('function mfNotesNorm'), b = APP.indexOf('function miniLine('); const blk = APP.slice(a, b);
  ok(a > 0 && b > a && !/\b20\d\d-\d\d-\d\d\b/.test(blk) && !/\b\d{6,}\b/.test(blk), '공개 코드(칸 덩어리)에 날짜·긴 번호가 없음 — 보이는 글은 자료에서만');
  ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(blk), '브라우저 팝업 함수 없음'); }
const hp = path.join(__dirname, 'harness.js'); if (!fs.existsSync(hp) || !process.env.RN_PORT) { console.log('  (화면 시험은 harness·RN_PORT가 없어 건너뜀)'); console.log(bad ? `❌ 실패 ${bad}` : '✓ tMFNOTES 모두 통과'); process.exitCode = bad ? 1 : 0; return; }
require(hp)(async (p) => { await p.waitForTimeout(800);
  const R = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; let pops = 0; window.alert = () => { pops++; }; window.confirm = () => { pops++; return true; }; window.prompt = () => { pops++; return ''; };
    o.fn = typeof mfNotesCard === 'function'; if (!o.fn) return o; S.mfN = { open: false }; o.closed = mfNotesCard(); o.closedRead = !!S.mfN.busy;
    await db.collection('app_settings').doc('market_fair_notes').set({ at: '2026-11-10T01:00:00Z', items: [{ id: 'a', t: '시험 접점 하나', body: '<b>굵게</b> 둘째 줄', look: '시험 날' }] });
    S.mfN = { open: true }; mfNotesCard(); await Wt(600); o.doc = mfNotesCard();
    S.mfN.file = mfNotesNorm({ items: [{ t: '파일 접점', body: 'x' }, { t: '', body: '' }] }); S.mfN.fileName = 't.json'; o.file = mfNotesCard(); o.fileN = S.mfN.file.items.length; o.pops = pops; return o; });
  ok(R.fn, '칸 함수 있음');
  ok(R.closed && /⚠ 추정 · 증거 아님/.test(R.closed) && !R.closedRead, '접힌 채로는 자료를 읽지 않음(제목에 ⚠ 추정 · 증거 아님)');
  ok(/시험 접점 하나/.test(R.doc || '') && /&lt;b&gt;굵게/.test(R.doc || '') && (R.doc.match(/⚠ 추정 · 증거 아님/g) || []).length >= 3 && /살펴볼 날: 시험 날/.test(R.doc), '펼치면 기기 사이 자료를 읽어 보임 · 줄마다 ⚠ 추정 · 증거 아님 · 글은 가려 그림');
  ok(/파일 접점/.test(R.file || '') && /메모리에만/.test(R.file) && R.fileN === 1 && !/시험 접점 하나/.test(R.file), '📂 파일 자료는 메모리에만 · 빈 줄은 버림 · 파일이 있으면 그것을 보임');
  ok(R.pops === 0, '브라우저 팝업 없음');
}).then(() => { console.log(bad ? `❌ 실패 ${bad}` : '✓ tMFNOTES 모두 통과'); process.exitCode = bad ? 1 : 0; });
