// 📜 김미소책방 매출 문서 — 클라우드 파서 단위 시험 (가짜 OCR 낱말 · 여러 형식) · node pw/kms_parse_test.js
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../cloud/index.js', 'utf8');
const a = src.indexOf('/* ══════════ 📜 김미소책방 매출 문서'), b = src.indexOf('/* ── (0.5.5) 사진 가격 조회 기록 저장·읽기');
if (a < 0 || b < a) { console.log('❌ 실패: 파서 부분을 못 찾음'); process.exit(1); }
const K = new Function('let visionClient = null;\n' + src.slice(a, b) + '\nreturn { kmsLines, kmsParse, kmsDate, kmsNums, kmsRoute };')();
// 가짜 OCR: 줄마다 [글, x] 덩어리 → 낱말 상자(글자 폭 14, 높이 20) · rot=90이면 사진을 시계 방향으로 돌린 좌표
function fake(lines, opt = {}) { const out = []; let y = 40; const H = 1000;
  for (const L of lines) { for (const [t, x, c] of L) { const w = Math.max(14, String(t).length * 14); let p = [[x, y], [x + w, y], [x + w, y + 20], [x, y + 20]];
      if (opt.rot === 90) p = p.map(([px, py]) => [H - py, px]); /* 시계 방향 90° */ if (opt.skew) p = p.map(([px, py]) => [px, py + px * opt.skew]);
      out.push([t, ...p.flat(), c == null ? 0.97 : c].join('\t')); } y += 34; }
  return out.join('\n'); }
const P = (lines, opt, ctx) => K.kmsParse(K.kmsLines(fake(lines, opt)), ctx);
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };

console.log('① 일계표 — 머리말(일자·현금·카드·합계) + 날짜 YYYY-MM-DD + 합계 줄');
const L1 = [[['김미소책방 일일 매출', 40]], [['일자', 40], ['현금', 240], ['카드', 400], ['합계', 560]], [['2023-05-01', 40], ['120,000', 220], ['80,000', 390], ['200,000', 540]], [['2023-05-02', 40], ['95,500', 225], ['104,500', 385], ['200,000', 540]], [['2023-05-03', 40], ['10,000', 225], ['20,000', 390], ['31,000', 545]], [['합계', 40], ['225,500', 220], ['204,500', 385], ['431,000', 540]]];
for (const [nm, opt] of [['바로', {}], ['90° 돌린 사진', { rot: 90 }], ['조금 기운 사진', { skew: 0.03 }]]) { const r = P(L1, opt);
  const d = r.rows.filter((x) => x.kind === 'day'); ok(d.length === 3 && d[0].date === '2023-05-01' && d[0].vals['현금'] === 120000 && d[0].vals['카드'] === 80000 && d[0].vals['합계'] === 200000, `${nm}: 일 3줄 · 칸 이름대로 (${JSON.stringify(d[0] && d[0].vals)})`);
  ok(r.salesCol === '합계', `${nm}: 매출로 셀 칸 = 합계 (${r.salesCol})`); ok(r.rows.some((x) => x.kind === 'total' && x.vals['합계'] === 431000), `${nm}: 합계 줄을 '합계'로`);
  ok((d[2].flags['합계'] || []).includes('sum≠') && !(d[0].flags['합계'] || []).includes('sum≠'), `${nm}: 현금+카드 ≠ 합계 인 줄만 표시`); }

console.log('② 월 장부 — 제목의 연·월 + 머리말 일·매출·건수 + 줄 맨 앞 날');
{ const r = P([[['2022년 3월 매출장', 40]], [['일', 40], ['매출', 260], ['건수', 460]], [['1', 44], ['150,000', 240], ['12건', 460]], [['2', 44], ['98,000', 245], ['7건', 462]], [['31', 40], ['1,200', 255], ['1건', 462]]]);
  const d = r.rows.filter((x) => x.kind === 'day'); ok(d.length === 3 && d[0].date === '2022-03-01' && d[2].date === '2022-03-31', '날짜 = 제목의 연·월 + 줄 앞 날 ' + d.map((x) => x.date).join(','));
  ok(d[0].vals['매출'] === 150000 && d[0].vals['건수'] === 12, '매출·건수 칸 ' + JSON.stringify(d[0].vals)); ok((d[0].flags.date || []).includes('dayOnly'), '날만 있는 줄은 노랑(dayOnly)'); ok(r.salesCol === '매출', '매출로 셀 칸 = 매출'); }

console.log('③ 영수증 꼴 — 머리말 없음 · YY.MM.DD · 원');
{ const r = P([[['23.04.05', 40], ['매출', 200], ['45,000원', 300]], [['23.04.06', 40], ['매출', 200], ['52,000원', 300]], [['감사합니다', 40]]]);
  const d = r.rows.filter((x) => x.kind === 'day'); ok(d.length === 2 && d[0].date === '2023-04-05' && d[0].vals['값1'] === 45000, '두 줄 · ' + JSON.stringify(d.map((x) => [x.date, x.vals]))); ok((d[0].flags.date || []).includes('yy'), '두 자리 연도는 노랑(yy)'); ok(r.salesCol === '값1', '금액 칸이 하나면 그 칸을 매출로'); }

console.log('④ 월 합계표 — YYYY년 M월 + 합계');
{ const r = P([[['2022년 1월', 40], ['3,200,000', 300]], [['2022년 2월', 40], ['2,900,000', 300]], [['합계', 40], ['6,100,000', 300]]]);
  const m = r.rows.filter((x) => x.kind === 'month'); ok(m.length === 2 && m[0].ym === '2022-01' && m[1].vals['값1'] === 2900000, '월 2줄 ' + JSON.stringify(m.map((x) => [x.ym, x.vals]))); ok(r.rows.some((x) => x.kind === 'total' && x.vals['값1'] === 6100000), '합계 줄'); }

console.log('⑤ n월 n일(요일) — 연도는 제목에서 빌림 · OCR이 쪼갠 숫자(12 , 000) 붙이기');
{ const r = P([[['2021년', 40], ['매출', 120]], [['5월', 40], ['1일(월)', 90], ['12', 300], [',', 328], ['000', 342]], [['5월', 40], ['2일', 90], ['8,500', 300]]]);
  const d = r.rows.filter((x) => x.kind === 'day'); ok(d.length === 2 && d[0].date === '2021-05-01' && d[0].vals['값1'] === 12000, JSON.stringify(d.map((x) => [x.date, x.vals]))); ok((d[0].flags.date || []).includes('noYear'), '연도를 빌린 날짜는 노랑(noYear)'); }

console.log('⑥ 연도를 모르면 날짜를 지어내지 않음 · 쉼표 없는 숫자 · 낮은 확신도 · 빼는 값');
{ const r = P([[['5/1', 40], ['120000', 300, 0.42]], [['5/2', 40], ['(3,000)', 300]]]); const d = r.rows;
  ok(d[0].date === null && d[0].md === '05-01' && (d[0].flags.date || []).includes('noDate'), '연도 없으면 date=null · 사람 확인'); ok((d[0].flags['값1'] || []).includes('bare') && d[0].conf['값1'] === 0.42, '쉼표 없는 금액 bare · 확신도 0.42 그대로'); ok(d[1].vals['값1'] === -3000, '(3,000) = -3000'); }
console.log('⑦ 앞 사진의 연·월·머리말 이어받기(ctx)');
{ const r1 = P([[['2020년 7월', 40]], [['일', 40], ['현금', 240], ['카드', 400], ['합계', 560]], [['1', 44], ['10,000', 230], ['5,000', 395], ['15,000', 550]]]); const r2 = P([[['2', 44], ['20,000', 230], ['5,000', 395], ['25,000', 550]]], {}, r1.ctx);
  ok(r2.rows[0].date === '2020-07-02' && r2.rows[0].vals['합계'] === 25000, '둘째 사진 ' + JSON.stringify(r2.rows[0])); }
{ const r1 = P([[['일', 40], ['현금', 240], ['카드', 400], ['합계', 560]], [['1', 44], ['10,000', 230], ['5,000', 395], ['15,000', 550]]], {}, { year: 2020, month: 7 }); const r3 = P([[['3', 44], ['9,000', 330]]], {}, r1.ctx);
  ok(Object.values(r3.rows[0].flags).some((f) => f.includes('col?')), '앞 사진 머리말인데 숫자 수가 다르면 칸 짐작(col?)으로 노랑 ' + JSON.stringify(r3.rows[0].flags)); }
console.log('⑧ 다시 나누기({ocr}만 · Vision 안 부름)');
K.kmsRoute({ ocr: { text: '', w: 0, h: 0, wds: fake(L1) } }).then((x) => { ok(x.ok && !x.vision && x.parse.rows.length === 4, '다시 나누기 ' + x.parse.rows.length + '줄');
  console.log(bad ? `❌ 실패 ${bad}개` : '✓ 통과'); process.exit(bad ? 1 : 0); });
