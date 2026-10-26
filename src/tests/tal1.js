// 알림 개편: 알림 생성(백업·결과 모름) · ℹ 자세히 · ✓ 완료(두 번) · 건 열쇠 바뀜 → 다시 뜸 · ✓ 완료 목록 · ↩ 복원
const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const r = {};
  r.gen = await p.evaluate(async () => { const old = new Date(Date.now() - 3 * 3600e3).toISOString();
    S.backupLog = { last: { at: '2026-10-10T00:00:00Z', kind: 'inc', dev: 'JS-MAIN' }, runs: [] }; S._bkLogAt = Date.now(); S._dbkAt = Date.now(); S.dbk = { state: 'idle', at: old, endAt: new Date(Date.now() - 3600e3).toISOString(), done: 30, cols: 80, docs: 400000, pc: 'LOGGER' };
    const X = window.ReadnowExec; await db.collection('exec_log').doc(X.docId('cashStop', 'c1#2')).set({ status: 'done' });
    await db.collection('exec_log').doc(X.docId('cashStop', 'c1#1')).set({ kind: 'cashStop', key: 'c1#1', label: '현금 판매 → 판매중지', status: 'started', startedAt: old, by: 'cloud', detail: { title: '책A' } });
    await db.collection('exec_log').doc(X.docId('startDelivery', 'k9:111')).set({ kind: 'startDelivery', key: 'k9:111', label: '발송준비시작', status: 'unknown', startedAt: old, by: 'JS-MAIN', detail: { ono: '111' } });
    await db.collection('app_settings').doc('sys_health').set({ alerts: [], events: [] }); mgrWatch(); await new Promise((res) => setTimeout(res, 300));
    const A1 = bizAlerts(bizCalc()); await new Promise((res) => setTimeout(res, 400)); const A = bizAlerts(bizCalc());
    const bk = A.find((a) => a.x && a.x.k === 'backup'), ex = A.find((a) => a.x && a.x.k === 'execunk'), ex1 = A1.find((a) => a.x && a.x.k === 'execunk');
    return { bkLv: bk && bk.lv, bkT: bk && bk.t, ex1: ex1 && ex1.x.n, ex: ex && ex.x.n, noCashInfo: !A.some((a) => /자동 처리 중/.test(a.t)) }; });
  // 화면에 그리기
  await p.evaluate(() => { const A = bizAlerts(bizCalc()); const d = document.createElement('div'); d.id = 'altest'; d.style.cssText = 'position:fixed;left:0;top:0;width:700px;z-index:99999;background:#fff;max-height:900px;overflow:auto'; document.body.appendChild(d); d.innerHTML = alertsLaid(alertsHtml(A)); });
  await p.waitForTimeout(300);
  r.btns = await p.evaluate(() => ({ info: document.querySelectorAll('#altest [data-alinfo]').length, done: document.querySelectorAll('#altest .alrow [data-aldone], #altest .altrow [data-aldone]').length, rows: document.querySelectorAll('#altest .alrow, #altest .altrow').length }));
  // ℹ 자세히 (백업)
  await p.evaluate(() => { const b = document.querySelector('#altest button.al[data-ak="backup"]'); b.closest('.alrow,.altrow').querySelector('[data-alinfo]').click(); });
  r.det = await p.evaluate(() => { const d = document.querySelector('#altest .aldet'); return d ? { now: /지금 상태/.test(d.innerText), why: /왜 지금 떴나/.test(d.innerText), todo: /무엇을 하면/.test(d.innerText), logger: /칸 30\/80/.test(d.innerText) } : null; });
  await p.screenshot({ path: SP + 'tal1a.png', clip: { x: 0, y: 0, width: 700, height: 700 } });
  await p.keyboard.press('Escape'); r.escClosed = await p.evaluate(() => !document.querySelector('#altest .aldet'));
  // ℹ 결과 모름 → 줄과 됐음 단추
  await p.evaluate(() => { const b = document.querySelector('#altest button.al[data-ak="execunk"]'); b.closest('.alrow,.altrow').querySelector('[data-alinfo]').click(); });
  r.exDet = await p.evaluate(() => ({ rows: document.querySelectorAll('#altest .alxr').length, sup: document.querySelectorAll('#altest .alxsup').length, ok: document.querySelectorAll('#altest [data-alexok]').length }));
  // ✓ 완료 — 한 번은 안 됨, 두 번째에 됨
  const clickDone = (k) => p.evaluate((k) => { const b = document.querySelector(`#altest button.al[data-ak="${k}"]`); b.closest('.alrow,.altrow').querySelector(':scope > [data-aldone]').click(); }, k);
  await clickDone('backup'); r.once = await p.evaluate(() => !!document.querySelector('#altest .alrow:not(.x) button.al[data-ak="backup"]') && !document.querySelector('#altest .alhid button.al[data-ak="backup"]'));
  await clickDone('backup'); await p.waitForTimeout(300);
  r.hidden = await p.evaluate(() => !!document.querySelector('#altest .alhid button.al[data-ak="backup"]'));
  r.saved = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('alert_done').get(); const v = d.data() || {}; return { has: !!(v.items && v.items.backup && v.items.backup.s), log: (v.log || []).length }; });
  r.foot = await p.evaluate(() => /숨긴 알림 1개/.test((document.querySelector('#altest .alfoot') || {}).innerText || ''));
  // 같은 건 → 다시 그려도 숨김 · 새 주(건 글 바뀜) → 다시 뜸
  r.sameHidden = await p.evaluate(() => { const d = document.getElementById('altest'); d.innerHTML = alertsLaid(alertsHtml(bizAlerts(bizCalc()))); return !!d.querySelector('.alhid button.al[data-ak="backup"]'); });
  r.newWeek = await p.evaluate(() => { const A = bizAlerts(bizCalc()); A.forEach((a) => { if (a.x && a.x.k === 'backup') a.x = { ...a.x, s: '2026-10-31' }; }); const d = document.getElementById('altest'); d.innerHTML = alertsLaid(alertsHtml(A)); return !!d.querySelector('.alrow button.al[data-ak="backup"], .altrow button.al[data-ak="backup"]'); });
  // 결과 모름 완료 → 새 대상(id)이 생기면 다시 뜸 · 대상이 줄면 계속 숨김
  r.ids = await p.evaluate(async () => { const d = document.getElementById('altest'); d.innerHTML = alertsLaid(alertsHtml(bizAlerts(bizCalc()))); const b = d.querySelector('button.al[data-ak="execunk"]'); await alDoneMark(b); const g = alSig(b); const D = alDoneOf('execunk');
    return { fewer: alSame(D, { s: '', n: 0, ids: [] }), more: alSame(D, { s: '', n: 2, ids: [...g.ids, 'new_id'] }), cnt: alSame(D, { s: '', n: 5, ids: null }) }; });
  // ✓ 완료 목록 페이지 → ↩ 복원
  await p.evaluate(() => openAlertDone()); await p.waitForTimeout(400);
  r.page = await p.evaluate(() => ({ rows: document.querySelectorAll('#sheet .adrow').length, rest: document.querySelectorAll('#sheet [data-adrest]').length, back: document.querySelectorAll('#sheet .ad_back').length }));
  await p.evaluate(() => document.querySelector('#sheet [data-adsort="at"]').click()); r.sortRev = await p.evaluate(() => S.adP.dir);
  await p.evaluate(() => { const q = document.querySelector('#ad_q'); q.value = 'Firebase 백업'; q.oninput(); }); r.search = await p.evaluate(() => [...document.querySelectorAll('#sheet .adrow')].filter((x) => x.style.display !== 'none').length);
  await p.screenshot({ path: SP + 'tal1b.png', clip: { x: 0, y: 0, width: 1100, height: 600 } });
  await p.evaluate(() => document.querySelector('#sheet [data-adrest="backup"]').click()); await p.waitForTimeout(300);
  r.restored = await p.evaluate(() => { const D = alDoneOf('backup'); const d = document.getElementById('altest'); d.innerHTML = alertsLaid(alertsHtml(bizAlerts(bizCalc()))); return { r: !!(D && D.r), shown: !!d.querySelector('.alrow button.al[data-ak="backup"], .altrow button.al[data-ak="backup"]') }; });
  r.goPage = await p.evaluate(() => GO_PAGES.some((g) => g[0] === 'alertDone') && !!WIDGETS.go_alertDone && FEAT.some((f) => /완료한 알림/.test(f.t)));
  console.log(JSON.stringify(r), 'errs', errs.join(' | '));
  const ok = r.gen.bkLv === 'info' && /받는 중/.test(r.gen.bkT) && r.gen.ex1 >= 1 && r.gen.ex === 1 && r.gen.noCashInfo && r.btns.info === r.btns.rows && r.btns.done >= 2 && r.det && r.det.now && r.det.why && r.det.todo && r.det.logger && r.escClosed
    && r.exDet.rows === 2 && r.exDet.sup === 1 && r.exDet.ok === 2 && r.once && r.hidden && r.saved.has && r.saved.log >= 1 && r.foot && r.sameHidden && r.newWeek && r.ids.fewer && !r.ids.more && !r.ids.cnt
    && r.page.rows === 2 && r.page.rest === 2 && r.sortRev === 1 && r.search === 1 && r.restored.r && r.restored.shown && r.goPage && !errs.length;
  console.log(ok ? '✓ tal1 통과' : '❌ tal1 실패');
});
