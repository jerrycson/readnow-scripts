// tMEMO1_1118 — (11/18 정범님 I-1118-2255-30 · I-1118-2311-31.2) 📝 판단 메모
//  · 추천가·추천 못 함 이유 등 판단 자리마다 메모 → 판정 엔진(critTarget)·판매가 평가(evalSale)·자동 출고(수집기·클라우드)가 다음 판정에 씀
//  · 고치면 바로(엔진은 메모 기록을 그대로 읽음 · 저장 없음) · 못 알아들은 메모 = 「사람 확인 필요」(저절로 내리지 않음)
//  · 값을 낮추는 규칙은 「맞음」 뒤에만 · 하한선(최대 인하 %·최소 판매가)은 늘 이김(헌장 제8조) · 메모는 학습 표본에 안 들어감(F32)
// 실행: node tMEMO1_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
const ROOT = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find((d) => fs.existsSync(path.join(d, 'readnow-pricing-core.js')));
const PRC = require(path.join(ROOT, 'readnow-pricing-core.js')); const ML = require(path.join(ROOT, 'readnow-ml-core.js'));
const M = PRC.Memo;
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const L = { grade: '상', price: 10000, priceList: 15000, usedCode: 'U1', registeredAt: '2026-10-01' };
const row = (p, c, sc, n) => ({ c, g: '상', p, s: 0, n: n || c, sc: sc || null });
const crit = { mode: 'same', maxDrop: 40, minPrice: 1000 };
const ctx = (memos) => ({ now: Date.now(), policy: {}, memos });
const mm = (text, o) => ({ id: 'lid:U1:price', scope: 'lid', key: 'U1', kind: 'price', text, ...(o || {}) });
const P1 = [row(6000, 'green', 'S1', '가게가')];

console.log('① 풀이(parse)');
{ let p = M.parse('8천원 밑으로 내리지 마'); ok(p.rules.length === 1 && p.rules[0].k === 'floor' && p.rules[0].won === 8000, '「8천원 밑으로 내리지 마」 → 바닥값 8,000원', p);
  p = M.parse('리커버라 다른 상품'); ok(p.rules.some((r) => r.k === 'diff'), '「리커버라 다른 상품」 → 다른 상품', p);
  p = M.parse('음 이건 좀 애매함'); ok(!p.rules.length && p.need.length === 1, '못 알아들은 글 → need(버리지 않음)', p);
  ok(M.lower({ k: 'fix' }) && M.lower({ k: 'ceil' }) && !M.lower({ k: 'floor' }), '값을 낮출 수 있는 규칙 = 판매가·천장·정가 %'); }

console.log('② 다음 판정에 반영(critTarget)');
const t0 = PRC.critTarget(L, P1, {}, crit, ctx(null)); ok(t0.t === 6000 && !t0.memo, '메모 없음 → 시장 6,000원', t0.t);
{ const c = PRC.critTarget(L, P1, {}, crit, ctx([mm('8천원 밑으로 내리지 마')]));
  ok(c.t === 8000 && c.reasons.some((x) => /^📝 메모 반영됨: 바닥값 8,000원/.test(x)) && c.memo && c.memo.n === 1, '바닥 메모 → 8,000원 · 이유 줄 「📝 메모 반영됨」 · out.memo', { t: c.t, r: c.reasons });
  const c2 = PRC.critTarget(L, P1, {}, crit, ctx([mm('9천원 밑으로 내리지 마')]));
  ok(c2.t === 9000, '고치면 바로 — 같은 메모를 9천원으로 고친 다음 판정 = 9,000원', c2.t);
  const c3 = PRC.critTarget(L, P1, {}, crit, ctx([mm('9천원 밑으로 내리지 마', { off: true })]));
  ok(c3.t === 6000, '휴지통(off)으로 보낸 메모는 안 씀 → 다시 6,000원', c3.t); }

console.log('③ 못 알아들은 메모 = 사람 확인 필요');
{ const c = PRC.critTarget(L, P1, {}, crit, ctx([mm('음 이건 좀 애매함')]));
  ok(c.t === 10000 && c.memoHold === 'need' && c.reasons.some((x) => /사람 확인 필요/.test(x)), '저절로 내리지 않음(지금 가격 10,000원) · 「사람 확인 필요」 줄', { t: c.t, h: c.memoHold, r: c.reasons }); }

console.log('④ 값을 낮추는 규칙은 「맞음」 뒤에만 · 하한선은 늘 이김');
{ const c = PRC.critTarget(L, [row(9500, 'green')], {}, crit, ctx([mm('7000원으로 팔아')]));
  ok(c.t === 9500 && c.reasons.some((x) => /메모 확인 전/.test(x)), '확인 전 판매가 메모(7,000원 < 지금 10,000원) → 쓰지 않고 「확인 전」 줄', { t: c.t, r: c.reasons });
  const c2 = PRC.critTarget(L, [row(9500, 'green')], {}, crit, ctx([mm('7000원으로 팔아', { ok: true })]));
  ok(c2.t === 7000, '「맞음」 뒤 → 7,000원', c2.t);
  const c3 = PRC.critTarget(L, [row(9500, 'green')], {}, crit, ctx([mm('3000원으로 팔아', { ok: true })]));
  ok(c3.t >= 6000 && c3.reasons.some((x) => /최대 40% 인하로 제한/.test(x)), `맞음이어도 최대 인하 40% 하한(6,000원)을 못 넘음 → ${c3.t}원`, { t: c3.t, r: c3.reasons });
  const c4 = PRC.critTarget({ ...L, price: 1500 }, [row(1200, 'green')], {}, { ...crit, maxDrop: 90 }, ctx([mm('500원으로 팔아', { ok: true })]));
  ok(c4.t >= 1000, `최소 판매가 1,000원도 메모보다 이김 → ${c4.t}원`, { t: c4.t, r: c4.reasons }); }

console.log('⑤ 판매자 메모 · 다른 상품');
{ const sm = { id: 'seller:S1:seller', scope: 'seller', key: 'S1', kind: 'seller', text: '이 판매자 허위 재고 무시', name: '가게가' };
  const c = PRC.critTarget(L, [row(6000, 'green', 'S1', '가게가'), row(8500, 'green', 'S2', '나')], {}, crit, ctx([sm]));
  ok(c.t === 8500 && c.reasons.some((x) => /📝 메모 반영됨: 판매자/.test(x)), '메모로 뺀 판매자(6,000원) 매물 빼고 → 8,500원', { t: c.t, r: c.reasons });
  const c2 = PRC.critTarget(L, P1, {}, crit, ctx([mm('리커버라 다른 상품', { kind: 'edkw' })]));
  ok(c2.t === 10000 && c2.memoHold === 'diff', '다른 상품 메모 → 시장으로 정한 값 안 씀(지금 가격)', { t: c2.t, h: c2.memoHold });
  const c5 = PRC.critTarget(L, P1, {}, crit, { now: Date.now(), policy: {}, memoD: { n: 1, get ign() { throw new Error('깨진 묶음'); } } });
  ok(c5.memoHold === 'err' && c5.t === 10000, '메모를 못 읽으면(오류) 그 상품 판정을 세움 — 지금 가격', { t: c5.t, h: c5.memoHold }); }

console.log('⑥ 판매가 평가(evalSale) · 자동 출고');
{ const rows = [row(9000, 'green', 'S2', '나'), row(9500, 'green', 'S3', '다')]; const base = { p: 7000, g: '상', rows, lid: 'L1' };
  const e0 = ML.evalSale(base); ok(!e0.memoStop && !e0.memo, '메모 없음 → 예전 평가 그대로');
  const D = M.digest([{ ...mm('8천원 밑으로 내리지 마'), key: 'L1' }], rows); const e1 = ML.evalSale({ ...base, memo: JSON.parse(JSON.stringify(D)) });
  ok(e1.memoStop && /메모 바닥값 8,000원/.test(e1.memoStop), '메모 바닥값 8,000원보다 싸게(7,000원) 팔림 → memoStop(사람 검토)', e1);
  const e2 = ML.evalSale({ ...base, memo: M.digest([mm('리커버라 다른 상품')], rows) }); ok(e2.memoStop && /다른 상품/.test(e2.verdict || ''), '다른 상품 메모 → 평가 안 함 · 사람 확인', e2);
  const SH = fs.readFileSync(path.join(ROOT, 'readnow-shipping-core.js'), 'utf8'); ok(/memoStop/.test(SH) && /add\('memo'/.test(SH), '출고 공용: memoStop이면 자동 출고 검토(종류 memo)');
  const COL = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8'); ok(/async function auJmemo\(\)/.test(COL) && /prd_judge_memos/.test(COL) && /evalSale: evMemo/.test(COL), '수집기 자동 출고가 판단 메모(60초 기억)를 판매가 평가에 넣음');
  const CL = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8'); ok(/async function jmemoIdxNode\(\)/.test(CL) && /evalSale: evMemo/.test(CL), '클라우드 자동 출고도 같은 메모를 씀');
  const RU = fs.readFileSync(path.join(ROOT, 'firestore', 'firestore.rules'), 'utf8'); ok(/match \/\{document=\*\*\}/.test(RU) && !/prd_judge_memos/.test(RU.replace(/\/\/.*$/gm, '')) ? /allow write: if staff\(\)/.test(RU) : /prd_judge_memos/.test(RU), 'Firestore 규칙: 직원이 prd_judge_memos에 쓸 수 있음(나머지 칸 규칙)'); }

console.log('⑦ 웹앱 — 한 공용 칸·모아 보기·F32');
{ const T = fs.readFileSync(path.join(ROOT, 'src', 'app.html'), 'utf8');
  for (const f of ['function jmemoListen(', 'function jmemoHtml(', 'function jmemoAdd(', 'function jmemoEdit(', 'function jmemoFlag(', 'function openJmemoHub(', 'function jmHubDraw(', 'function jmUseNote(', 'function jmemoReapply(']) ok(T.includes(f), '공용 함수 ' + f.replace('function ', '').replace('(', ''));
  ok(/memos: JL/.test(T) && /jmemoFor\(l\)/.test(T), '수동 일괄 batchCompute가 그 상품 메모를 엔진에 넘김(등록·묶음도 같은 함수)');
  ok(/arrayUnion/.test(T.slice(T.indexOf('function jmemoEdit('), T.indexOf('function jmemoFlag('))), '고칠 때 옛 글은 hist에 남김(지우지 않음)');
  const sb = T.slice(T.indexOf('function saleEvalBits'), T.indexOf('function saleEvalBits') + 6000); ok(/evM = ML\.evalSale\(\{ \.\.\.evA, memo: JD \}\)/.test(sb), '출고 카드: 저장하는 평가(ev)엔 메모를 안 넣고 보이는 평가만(학습 표본 아님 F32)');
  ok(!/confirm\(|alert\(|prompt\(/.test(T.slice(T.indexOf('function jmemoListen('), T.indexOf('function jmHubDraw('))), '브라우저 팝업 없음'); }

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
