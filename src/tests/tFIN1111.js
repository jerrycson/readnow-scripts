// tFIN1111 — (11/11 정범님 약속 47 '기능만 덜렁 만들고 끝내지 말 것 — 오래 걸리는 일은 기존 진행 막대 틀(세부 이정표)')
//   ① 진행 카드 공용 틀 rnStepCard — 원스톱 진행 막대와 같은 꼴(✓ 지난 › ▶ 지금 › · 남은 · 막대 · 지금 줄 · 끝 요약) · 실패는 ✗·까닭·할 일 · 문제없이 끝나면 정한 시간 뒤 한 줄로 숨김 + 「진행 보기」
//   ② 🛠 처리할 일 🟦 예스24 맡기기(y24w) — 맡김 → 번외 받음 → 예스24 열기 → 찾기 → 바꿈 → 다시 읽어 확인 → 끝 (번외 상태 글로 단계)
//   ③ 📤 예스24 자동 올림(y24auto) — 맡김 → 번외 받음 → 대량 등록 화면 열기 → 엑셀 넣음 → [등록] 누름 → 등록상품 목록에서 확인 → 끝
//   ④ 🪑 번외 알라딘 자리 — 웹앱 c2AlSeatGive가 고칠 칸 검사(c2SeatPatchOk: dev·wait의 '<PC>~col2' 하나뿐)
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tFIN1111.js · RN_SHOT=<폴더>면 사진 · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const SHOT = process.env.RN_SHOT || '';
const run = require('./harness.js'); const seed = require('./seed.js');
(async () => {
  await run(async (p) => { await p.evaluate(seed); await p.waitForTimeout(1500);
    console.log('① 진행 카드 공용 틀');
    const a = await p.evaluate(() => { const box = document.createElement('div'); box.id = 'fin_box'; box.style.cssText = 'position:fixed;left:0;top:0;width:560px;max-height:100vh;overflow:auto;z-index:99999;background:var(--bg,#fff);padding:8px'; document.body.appendChild(box);
      const st = ['맡김', '번외 받음', '예스24 열기', '찾기', '바꿈', '다시 읽어 확인', '끝'];
      const run1 = rnStepCard({ key: 't1', title: '🟦 시험 진행', steps: st, cur: 3, st: 'run', now: '900 찾는 중', at: new Date().toISOString() });
      const fail = rnStepCard({ key: 't2', title: '🟦 시험 실패', steps: st, cur: 5, st: 'fail', why: '눌렀지만 다시 읽어 확인 못 함', todo: '판매관리에서 확인' });
      const doneNew = rnStepCard({ key: 't3', title: '🟦 시험 끝', steps: st, cur: 6, st: 'done', endAt: new Date().toISOString(), sum: '확인됨 1/1건' });
      const doneOld = rnStepCard({ key: 't4', title: '🟦 오래전 끝', steps: st, cur: 6, st: 'done', endAt: new Date(Date.now() - 3600e3).toISOString(), sum: '확인됨 2/2건' });
      return { run1, fail, doneNew, doneOld }; });
    ok(/✓ 맡김/.test(a.run1) && /✓ 예스24 열기/.test(a.run1) && /▶ 찾기/.test(a.run1) && /· 바꿈/.test(a.run1) && /▶ 지금: 900 찾는 중/.test(a.run1) && /width:43%/.test(a.run1), '하는 중 = ✓ 지난 단계 › ▶ 지금 › · 남은 단계 · 막대(3/7) · 지금 줄');
    ok(/✗ 다시 읽어 확인/.test(a.fail) && /⚠ 눌렀지만/.test(a.fail) && /할 일:/.test(a.fail), '실패 = 그 단계에 ✗ · 까닭 · 할 일');
    ok(/끝 요약: 확인됨 1\/1건/.test(a.doneNew) && !/rnsc-hid/.test(a.doneNew), '막 끝남 = 끝 요약이 보임');
    ok(/rnsc-hid/.test(a.doneOld) && /진행 보기/.test(a.doneOld) && /초 뒤 진행 막대 숨김/.test(a.doneOld), '문제없이 끝나고 정한 시간이 지나면 한 줄로 숨김 + 「진행 보기」');
    console.log('② 처리할 일 — 예스24 맡기기 진행');
    const b = await p.evaluate(() => { const t = Date.now(); localStorage.setItem('rn-led-y24w', JSON.stringify({ 'S3|903': { job: 'y24w-1', rk: 'k', at: t - 30e3, st: 'run', msg: '번외 수집기에 맡김' } }));
      const r0 = ledY24WCard(); S._y24wWait = [{ id: 'y24w-1', n: 1 }]; S._y24wWhy = null; const r1 = ledY24WCard(); S._y24wWait = []; S._y24wCur = { id: 'y24w-1', step: '903 [수정항목 저장] 누름', n: 1 }; const r2 = ledY24WCard(); S._y24wCur = { id: 'y24w-1', step: '903 등록상품 목록 다시 읽어 확인', n: 1 }; const r3 = ledY24WCard();
      S._y24wCur = null; localStorage.setItem('rn-led-y24w', JSON.stringify({ 'S3|903': { job: 'y24w-1', rk: 'k', at: t - 60e3, st: 'done', msg: '판매중지 — 등록상품 목록에서 확인(판매중·1권 → 판매중지·1권)', doneAt: t - 5e3 } })); const r4 = ledY24WCard();
      localStorage.setItem('rn-led-y24w', JSON.stringify({ 'S3|903': { job: 'y24w-2', rk: 'k', at: t - 60e3, st: 'fail', msg: '예스24 등록상품 목록에서 줄을 못 찾음 — 아무것도 누르지 않음', todo: '손으로', doneAt: t - 5e3 } })); const r5 = ledY24WCard();
      document.getElementById('fin_box').innerHTML = '<h3>🛠 처리할 일 — 🟦 예스24 맡기기</h3>' + r0 + r1 + r2 + r3 + r4 + r5; return { r0, r1, r2, r3, r4, r5 }; });
    ok(/▶ 맡김/.test(b.r0) && /번외 소식 기다림/.test(b.r0), '맡긴 직후 = ▶ 맡김(번외 소식 기다림)');
    ok(/✓ 맡김/.test(b.r1) && /▶ 번외 받음/.test(b.r1), '번외 줄에 들어감 = ▶ 번외 받음');
    ok(/✓ 찾기/.test(b.r2) && /▶ 바꿈/.test(b.r2) && /\[수정항목 저장\] 누름/.test(b.r2), '저장 누름 = ▶ 바꿈 · 지금 줄에 번외 글');
    ok(/▶ 다시 읽어 확인/.test(b.r3), '다시 읽기 = ▶ 다시 읽어 확인');
    ok(/끝 요약: 확인됨 1\/1건/.test(b.r4) && /✓ 끝/.test(b.r4), '끝 = 끝 요약(확인됨 1/1)');
    ok(/✗ 찾기/.test(b.r5) && /못 함 — 예스24 등록상품 목록에서 줄을 못 찾음/.test(b.r5) && /할 일:/.test(b.r5), '못 함 = 그 단계 ✗ · 까닭 · 할 일');
    if (SHOT) await p.locator('#fin_box').screenshot({ path: path.join(SHOT, 'web-y24w-steps.png') });
    console.log('③ 예스24 자동 올림 진행');
    const c = await p.evaluate(() => { Y24A.st = { ok: true, login: 'ok', cur: { id: 'j1', step: '엑셀 넣음', n: 3 }, wait: [] }; Y24A.fly = 3; const r1 = y24AutoCard(); Y24A.st = { ok: true, login: 'ok', cur: { id: 'j1', step: '등록상품 목록에서 확인', n: 3 }, wait: [] }; const r2 = y24AutoCard(); Y24A.st = { ok: true, login: 'ok', cur: null, wait: [{ id: 'j1', n: 3 }], why: '🚚 출고 중 — 끝나면 이어감(약속 0-1)' }; const r3 = y24AutoCard(); const line = y24AutoLine();
      document.getElementById('fin_box').innerHTML = '<h3>📤 예스24 자동 올림</h3>' + r1 + r2 + r3; return { r1, r2, r3, line }; });
    ok(/✓ 대량 등록 화면 열기/.test(c.r1) && /▶ 엑셀 넣음/.test(c.r1) && /3건/.test(c.r1), '엑셀 넣는 중 = ✓ 대량 등록 화면 열기 › ▶ 엑셀 넣음');
    ok(/▶ 등록상품 목록에서 확인/.test(c.r2), '확인 중 = ▶ 등록상품 목록에서 확인');
    ok(/⏸ 번외 받음/.test(c.r3) && /출고 중/.test(c.r3), '번외가 받았지만 출고 중 = ⏸ 번외 받음 · 까닭');
    ok(/rnsc/.test(c.line), '자동 올림 한 줄 위에 진행 카드가 붙음');
    if (SHOT) await p.locator('#fin_box').screenshot({ path: path.join(SHOT, 'web-y24auto-steps.png') });
    console.log('④ 번외 알라딘 자리 — 고칠 칸 검사');
    const d = await p.evaluate(() => ({ good: c2SeatPatchOk({ dev: { 'HOME~col2': { in: true } }, wait: { 'HOME~col2': null } }, 'HOME~col2'), other: c2SeatPatchOk({ dev: { 'HOME~col2': { in: true }, 'JS-MAIN': { in: false } } }, 'HOME~col2'), key: c2SeatPatchOk({ holdUntil: 1 }, 'HOME~col2'), fn: typeof c2AlSeatGive }));
    ok(d.good && !d.other && !d.key && d.fn === 'function', '자리 문서에 적는 것은 dev·wait의 HOME~col2 하나뿐(다른 기기 칸·다른 칸이 섞이면 적지 않음)', d);
    await p.evaluate(() => document.getElementById('fin_box').remove());
  });
  console.log(bad ? `❌ tFIN1111 ${bad}개 실패` : '✓ tFIN1111 통과'); process.exit(bad ? 1 : 0);
})();
