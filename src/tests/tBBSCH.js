/* tBBSCH — 📮 결과 기다리는 알라딘 팔기 접수가 있는 동안 4시간마다 (정범님 11/05 '그렇게 해')
 *  ① 칸 넣기(AS.bbSlotEnsure): 하루 한 번 칸 뒤에 켜진 채로 · 이미 있으면(꺼 둔 것도) 그대로
 *  ② 대기 접수 있으면 4시간마다 차례(02·06·10·14·18·22시) · 없으면(조건 안 맞음·모름) 안 함 · 하루 한 번 칸은 그대로
 *  ③ 결과 기다림 판정(AS.bbWaiting) · ④ 끄기(칸 꺼짐 → 안 함) · ⑤ 웹앱 ⏰ 칸 편집기에 칸이 보이고 스위치로 끄고 저장 */
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluate(() => { window.__rnAdminForce = 1; try { localStorage.setItem('rn-admin-dev', '1'); } catch (e) {} });
  const r = await p.evaluate(async () => { const AS = ReadnowAuto.AS; const o = {}; const at = (hhmm, day = '2026-11-05') => Date.parse(`${day}T${hhmm}:00+09:00`);
    const base = [{ id: 'qna', job: 'crm:qna', trig: { t: 'time', times: ['09:00'] } }, { id: 'buyback', job: 'prd:buyback', trig: { t: 'time', times: ['00:05'] } }, { id: 'aladinBuy', job: 'prd:aladinBuy', trig: { t: 'time', times: ['22:00'] } }].map(AS.sanitize);
    // ① 칸 넣기
    const e1 = AS.bbSlotEnsure(base); o.add = e1.added && e1.slots.map((s) => s.id).join() === 'qna,buyback,bbWait,aladinBuy';
    const e2 = AS.bbSlotEnsure(e1.slots); o.again = !e2.added && e2.slots.length === 4;
    const offL = e1.slots.map((s) => (s.id === 'bbWait' ? { ...s, on: false } : s)); const e3 = AS.bbSlotEnsure(offL); o.keepOff = !e3.added && e3.slots.find((s) => s.id === 'bbWait').on === false;
    const clean = e1.slots.map(AS.sanitize).filter(Boolean); const bb = clean.find((s) => s.id === 'bbWait');
    o.san = !!bb && bb.cond === 'bbWait' && bb.trig.t === 'every' && bb.trig.min === 240 && bb.on === true && !('cond' in clean.find((s) => s.id === 'qna'));
    o.desc = AS.describe(bb); o.descOk = /4시간마다/.test(o.desc) && /접수가 있을 때만/.test(o.desc);
    o.leg = AS.legacyItems(clean).buyback.on === true; /* 하루 한 번 칸은 예전 모양 그대로 */
    const doc = { on: true, slots: clean };
    // ② 대기 접수 있으면 4시간마다 차례
    const yes = () => true, no = () => false; const k = (now, cond, R) => AS.due(doc, R || {}, { now, pc: 'A', crmOk: false, cond }).filter((x) => x.slot.id === 'bbWait').map((x) => x.key + ':' + x.mark);
    o.w0630 = k(at('06:30'), yes); o.w1415 = k(at('14:15'), yes); o.w2359 = k(at('23:59'), yes); o.w0130 = k(at('01:30'), yes);
    o.wNo = k(at('06:30'), no); o.wNoCtx = k(at('06:30'), undefined);
    o.done = k(at('07:59'), yes, { 'bbWait@2026-11-05@e0600': { state: 'done', at: new Date(at('06:10')).toISOString() } });
    o.next = k(at('10:01'), yes, { 'bbWait@2026-11-05@e0600': { state: 'done', at: new Date(at('06:10')).toISOString() } });
    o.perDay = ((AS.dayPlan(doc, {}, { now: at('12:00') }, () => 60e3) || {}).bbWait || []).map((x) => x.tag).join();
    // 없으면 하루 한 번 — 하루 한 번 칸(buyback)은 조건과 상관없이
    o.daily = AS.due(doc, {}, { now: at('00:30'), pc: 'A', cond: no }).filter((x) => x.slot.job.startsWith('prd:buyback')).map((x) => x.key);
    // ④ 끄기
    const docOff = { on: true, slots: clean.map((s) => (s.id === 'bbWait' ? { ...s, on: false } : s)) }; o.off = AS.due(docOff, {}, { now: at('06:30'), cond: yes }).filter((x) => x.slot.id === 'bbWait').length;
    // ③ 결과 기다림 판정
    const now = at('12:00'); const W = (x) => AS.bbWaiting(x, now);
    o.waitJudge = [W({ status: '접수완료', date: '2026-11-03', items: [{ result: null }, { result: 'bought' }] }), W({ status: '접수완료', date: '2026-11-03', items: [] }), W({ status: '정산완료', doneDate: '2026-11-04', items: [{ result: 'bought' }] }), W({ status: '접수취소', date: '2026-11-03' }), W({ status: '접수완료', date: '2026-09-20', items: [{}] }), W({ status: '검수중', items: [{ result: 'bought' }, { result: 'discard' }] }), AS.bbWaiting({ status: '접수완료', date: '2026-09-20' }, now, 0)].join();
    // ⑤ 웹앱 ⏰ 칸 편집기
    try { localStorage.setItem('rn-device', 'TEST-PC'); } catch (e) {} S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; o.adm = isAdminDevice();
    await db.collection('prd_system').doc('autoSched').set({ on: true, slots: JSON.parse(JSON.stringify(clean)), rev: 3 }, { merge: true });
    openAuto(); await new Promise((r) => setTimeout(r, 900)); const E = S.auto && S.auto.E; if (E && !E.isOpen() && E.open) { try { E.open(); } catch (e) {} } await new Promise((r) => setTimeout(r, 600));
    const ov = document.getElementById('rnas'); o.edOpen = !!ov; o.edHas = !!ov && /결과 기다리는 접수만/.test(ov.textContent);
    const cb = ov && ov.querySelector('[data-con="bbWait"]'); o.cb = !!cb && cb.checked;
    if (cb) { cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true })); await new Promise((r) => setTimeout(r, 300)); S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; o.adm2 = isAdminDevice(); const sv = document.querySelector('#rnas #as_save'); o.svOk = !!sv && !sv.disabled; if (sv) sv.click(); await new Promise((r) => setTimeout(r, 900)); }
    const d2 = (await db.collection('prd_system').doc('autoSched').get()).data() || {}; const s2 = (d2.slots || []).find((s) => s.id === 'bbWait'); o.saved = s2 ? { on: s2.on, cond: s2.cond, min: s2.trig && s2.trig.min } : null;
    return o; });
  console.log(JSON.stringify(r), errs.join('|'));
  const ok = r.add && r.again && r.keepOff && r.san && r.descOk && r.leg
    && r.w0630.join() === 'bbWait@2026-11-05@e0600:run' && r.w1415.join() === 'bbWait@2026-11-05@e1400:run' && r.w2359.join() === 'bbWait@2026-11-05@e2200:run' && r.w0130.length === 0
    && r.wNo.length === 0 && r.wNoCtx.length === 0 && r.done.length === 0 && r.next.join() === 'bbWait@2026-11-05@e1000:run' && r.perDay === '02:00,06:00,10:00,14:00,18:00,22:00'
    && r.daily.join() === 'buyback@2026-11-05@00:05' && r.off === 0 && r.waitJudge === 'true,true,false,false,false,false,true'
    && r.edOpen && r.edHas && r.cb && r.svOk && r.saved && r.saved.on === false && r.saved.cond === 'bbWait' && r.saved.min === 240 && !errs.length;
  console.log(ok ? '✓ tBBSCH 통과' : '❌ tBBSCH 실패');
});
