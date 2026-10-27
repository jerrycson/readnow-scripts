// tT — 정범님 10/27: 🔎 설명서 찾기 · 🖥 기기 상태 폴더 · 🧹 폴더 모두 지우기 · 🎯 알림 → 그 건 60초 강조 · 📋 점검 개선안·문제점 · 기록 경고 풀이
const fs = require('fs');
const MD = fs.readFileSync('/home/claude/readnow-scripts/src/audits/2026-10-26.md', 'utf8');
const MD2 = fs.readFileSync('/home/claude/readnow-scripts/src/audits/2026-10-16.md', 'utf8');
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const R = {}; const ok = []; const bad = [];
  const chk = (n, c, x) => (c ? ok : bad).push(n + (c ? '' : ' → ' + JSON.stringify(x === undefined ? '' : x).slice(0, 300)));
  // ① 설명서 찾기
  await p.evaluate(() => openManual()); await p.waitForTimeout(400);
  R.m1 = await p.evaluate(async () => { const q = document.querySelector('#msr .msr-q'); const run = async (v) => { q.value = v; q.dispatchEvent(new Event('input')); await new Promise((r) => setTimeout(r, 300)); return { n: (MSR.last || { R: [] }).R.length, rows: document.querySelectorAll('#msr .msr-r').length, typo: (MSR.last || {}).typo || [], f: document.querySelectorAll('#msr .msr-f').length, mk: document.querySelectorAll('#msr .msr-res mark').length }; };
    const a = await run('로거 멈춤'); const b = await run('ㄹㄱ'); const c = await run('테더랑'); const d = await run('송장'); const e = await run('설명서'); const z = await run('qqqzzzxx');
    await run('로거 멈춤'); const first = document.querySelector('#msr .msr-r'); first.click(); await new Promise((r) => setTimeout(r, 200)); const hit = document.querySelector('.msr-hit'); const det = hit && hit.closest('details.man');
    q.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); const cur = MSR.cur; const sticky = getComputedStyle(document.querySelector('#msr')).position;
    q.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await new Promise((r) => setTimeout(r, 50));
    return { a, b, c, d, e, z, hit: !!hit, open: !!(det && det.open), cur, sticky, cleared: q.value === '' && !!document.querySelector('#sheet.on'), recent: msrLs() }; });
  const m = R.m1; chk('찾기: 로거 멈춤', m.a.n > 0 && m.a.rows > 0 && m.a.mk > 0, m.a); chk('찾기: 초성 ㄹㄱ', m.b.n > 0, m.b); chk('찾기: 오타 테더랑→테더링', m.c.n > 0 && m.c.typo.length > 0, m.c); chk('찾기: 같은 뜻(송장→출고)', m.d.n > 0, m.d); chk('찾기: 기능 바로 가기', m.e.f > 0, m.e); chk('찾기: 없는 말 0', m.z.n === 0, m.z);
  chk('찾기: 결과 누르면 장 펼침·깜빡', m.hit && m.open, m); chk('찾기: Enter = 다음', m.cur === 1, m.cur); chk('찾기: 붙박이', m.sticky === 'sticky', m.sticky); chk('찾기: Esc 지우기(설명서 그대로)', m.cleared, m); chk('찾기: 최근 찾은 말', m.recent[0] === '로거 멈춤', m.recent);
  R.man = await p.evaluate(() => { const t = document.querySelector('#sheet').textContent; return { a: /🔎 설명서 찾기/.test(t), b: /🎯 알림을 누르면 그 건으로/.test(t), c: /PC 이름 옆 경고 수/.test(t), d: /📋 개선안·문제점 · 🔬 정밀 점검/.test(t) }; });
  chk('설명서 단락 넷', R.man.a && R.man.b && R.man.c && R.man.d, R.man);
  await p.evaluate(() => history.back()); await p.waitForTimeout(300);
  // ② 띠는 기본 숨김 · 켜면 보임 · 기기 상태 기록
  R.band = await p.evaluate(async () => { const W = { st: { LOGGER: { k: 'down', msg: '🌐 로거(LOGGER)가 20분째 신호 없음', since: new Date(Date.now() - 20 * 60e3).toISOString() } } }; S.devEv = { ev: {} }; lwBand(W); const off = !document.getElementById('lgwarn'); localStorage.setItem('rn-devband', '1'); lwBand(W); const on = !!document.getElementById('lgwarn'); localStorage.setItem('rn-devband', '0'); lwBand(W); const off2 = !document.getElementById('lgwarn');
    devEvLogger(W); const n1 = Object.keys(S.devEv.ev).length; devEvLogger(W); const n2 = Object.keys(S.devEv.ev).length; const w1 = (window.__FSW || []).filter((x) => x.id === 'dev_events').length; devEvLogger({ st: {} }); const e = Object.values(S.devEv.ev)[0];
    devEvCloud({ at: new Date().toISOString(), type: 'startDelivery', pc: 'JS-MAIN', why: '20초', n: 2 }); return { off, on, off2, n1, n2, w1, ended: !!e.end, cnt: Object.keys(S.devEv.ev).length }; });
  chk('띠 기본 숨김·켜면 보임', R.band.off && R.band.on && R.band.off2, R.band); chk('기기 상태 한 번만 적음·풀리면 끝', R.band.n1 === 1 && R.band.n2 === 1 && R.band.w1 === 1 && R.band.ended && R.band.cnt === 2, R.band);
  // ③ 오늘 확인할 것 — 폴더·배지·모두 지우기
  R.al = await p.evaluate(async () => { const box = document.createElement('div'); box.id = 'tT_al'; document.body.appendChild(box); S.alay = { order: [], folders: [{ id: 'f_defer', name: '미루기', aids: [] }] };
    const A = [{ lv: 'red', t: '알라딘 매입가보다 싸게 파는 상품 2종', key: 'under', x: { k: 'under', n: 2, ids: ['LZ1', 'LZ2'], why: '테스트' } }, { lv: 'amber', t: '테스트 노랑 3건', key: 'goal', x: { k: 'goal', s: '2026-10' } }];
    box.innerHTML = alertsHtml(A); alertsEnhance(box.querySelector('.alerts')); const c = box.querySelector('.alerts'); const aid = c.querySelector('.alrow').dataset.aid; S.alay.folders[0].aids = [aid]; alertsEnhance(c, true);
    const fd = c.querySelector('.alfold[data-fid="f_defer"]'); const badge = fd.querySelector('.alfc').textContent; const clr = fd.querySelector('[data-alfclr]'); const dev = c.querySelector('.alfold.aldev'); const devN = dev && dev.querySelector('.alfc').textContent; const devRows = dev ? dev.querySelectorAll('.aldevr').length : 0;
    clr.click(); const armed = clr.dataset.armed === '1'; clr.click(); await new Promise((r) => setTimeout(r, 120)); const done = Object.keys((S.alDone || {}).items || {}).length;
    const empty = document.createElement('div'); empty.innerHTML = alertsHtml([]); document.body.appendChild(empty); alertsEnhance(empty.querySelector('.alerts')); const emptyDev = !!empty.querySelector('.aldev');
    const dc = c.querySelector('[data-aldevclr]') || box.querySelector('[data-aldevclr]'); let devClr = null; if (dc) { dc.click(); dc.click(); await new Promise((r) => setTimeout(r, 120)); devClr = devEvList().length; }
    box.remove(); empty.remove(); return { badge, devN, devRows, armed, done, emptyDev, devClr }; });
  chk('폴더 배지·모두 지우기(두 번)', R.al.badge === '1' && R.al.armed && R.al.done >= 1, R.al); chk('🖥 기기 상태 폴더', R.al.devN === '2' && R.al.devRows === 2, R.al); chk('빈 알림에도 기기 상태 폴더', R.al.emptyDev, R.al); chk('기기 상태 모두 지우기(끝난 것만)', R.al.devClr === 1, R.al);
  // ④ 알림 → 그 건 강조 + 설명 띠
  R.f = await p.evaluate(async () => { S.plist.set('LZ1', { id: 'LZ1', title: '같은책', price: 3000, active: true }); S.plist.set('LZ2', { id: 'LZ2', title: '다른책', price: 2000, active: true });
    openListView({ title: '알라딘 매입가보다 싸게 파는 상품', rows: [{ l: S.plist.get('LZ1') }, { l: S.plist.get('LZ2') }], text: (x) => x.l.title, row: ({ l }) => `<button class="item" data-pid="${l.id}"><span>${l.title}</span></button>` });
    alFocus({ key: 'under', k: 'under', ids: ['LZ2'], t: '알라딘 매입가보다 싸게 파는 상품 2종', why: '판매가 < 매입가', lv: 'red' }); await new Promise((r) => setTimeout(r, 900));
    const ov = [...document.querySelectorAll('.alf-hl')].filter((o) => o.style.display === 'block'); const band = document.querySelector('.alf-band'); const tgt = document.querySelector('#sheet [data-pid="LZ2"]').getBoundingClientRect(); const o = ov[0] && ov[0].getBoundingClientRect();
    const r = { ov: ov.length, band: !!band, hasDo: band && /할 일/.test(band.textContent), near: o && Math.abs(o.left - tgt.left) < 12 && Math.abs(o.top - tgt.top) < 12, sec: band && band.querySelector('.alfb-s').textContent };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); r.bandClosed = !document.querySelector('.alf-band'); r.hlKept = document.querySelectorAll('.alf-hl').length > 0; alfStop(); r.stopped = !document.querySelector('.alf-hl'); history.back(); return r; });
  chk('알림 → 그 건 테두리·설명 띠', R.f.ov === 1 && R.f.band && R.f.hasDo && R.f.near && /초/.test(R.f.sec), R.f); chk('설명 띠 Esc 닫힘·테두리 남음', R.f.bandClosed && R.f.hlKept && R.f.stopped, R.f);
  await p.waitForTimeout(300);
  // ⑤ 점검 개선안·문제점
  R.a = await p.evaluate(async ([md, md2]) => { const it = audParse(md, 'day_2026-10-26'); const it2 = audParse(md2, 'day_2026-10-16'); AUD.list = [{ id: 'day_2026-10-26', kind: 'fable', at: '2026-10-26T22:30:00+09:00', title: '정밀', md, items: it, src: 'gh' }, { id: 'day_2026-10-16', kind: 'daily', at: '2026-10-16T22:00:00+09:00', title: '매일', md: md2, items: it2, src: 'gh' }]; S.audSt = {};
    openAudits(); await new Promise((r) => setTimeout(r, 200)); const sh = document.querySelector('#sheet'); const rows0 = sh.querySelectorAll('.aui').length; const ty = { 개선안: it.filter((x) => x.ty === '개선안').length, 문제점: it.filter((x) => x.ty === '문제점').length, web: it.filter((x) => x.ar === '웹앱').length, fx: it.filter((x) => x.fx).length };
    const b = sh.querySelector('.aui [data-auis="done"]'); const id = b.dataset.auiid; b.click(); await new Promise((r) => setTimeout(r, 200)); const st = ((S.audSt.st || {})[id] || {}).s; const log = (S.audSt.log || []).length;
    const fdone = sh.querySelector('[data-auif="done"]'); fdone.click(); const rowsDone = document.querySelectorAll('#sheet .aui').length; const days = document.querySelectorAll('#sheet details.aud-day').length; const logBox = !!document.querySelector('#sheet details.aui-log');
    history.back(); return { n: it.length, n2: it2.length, ty, rows0, st, log, rowsDone, days, logBox }; }, [MD, MD2]);
  chk('점검: 항목 뽑기', R.a.n >= 12 && R.a.ty.개선안 >= 6 && R.a.ty.문제점 >= 6 && R.a.ty.web >= 2 && R.a.n2 >= 3, R.a); chk('점검: 처리 저장·기록', R.a.st === 'done' && R.a.log >= 1 && R.a.rowsDone === 1, R.a); chk('점검: 날짜별 접기·처리 기록', R.a.days === 2 && R.a.logBox && R.a.rows0 > 0, R.a);
  // ⑥ 기록 풀이·GO_PAGES·FEAT
  R.w = await p.evaluate(() => ({ a: logWhy('12:00:01 [고객] ! 요청 실패 (응답 시간 초과). 10초 뒤 다시 시도합니다.'), b: logWhy('12:00:02 [성능] ! ⏱ 긴 작업'), c: logWhy('12:00:03 [오류] ⚠ mySwiper is not defined (wgate.aspx:1)'), d: logWhy('12:00:04 [상품] ! 무엇인가'), g: !!GO_PAGES.find((x) => x[0] === 'audits'), wd: !!WIDGETS.go_audits, f: FEAT.some((x) => /설명서 찾기/.test(x.t)) && FEAT.some((x) => /기기 상태 폴더/.test(x.t)) }));
  chk('기록 풀이', /다시 읽음/.test(R.w.a) && /느렸음/.test(R.w.b) && /알라딘 자체 오류/.test(R.w.c) && /계속/.test(R.w.d), R.w); chk('GO_PAGES·홈 칸·FEAT', R.w.g && R.w.wd && R.w.f, R.w);
  // ⑦ 설정 스위치
  R.s = await p.evaluate(async () => { S.tab = 'settings'; renderTabs(); renderMain(); await new Promise((r) => setTimeout(r, 300)); const c = document.querySelector('#st_devband'); if (!c) return { none: 1 }; c.checked = true; c.dispatchEvent(new Event('change')); const v1 = localStorage.getItem('rn-devband'); c.checked = false; c.dispatchEvent(new Event('change')); return { v1, v2: localStorage.getItem('rn-devband') }; });
  chk('설정 스위치(이 기기)', R.s.v1 === '1' && R.s.v2 === '0', R.s);
  console.log(ok.map((x) => '  ✓ ' + x).join('\n')); if (bad.length) console.log(bad.map((x) => '  ✗ ' + x).join('\n'));
  console.log(bad.length ? `❌ tT 실패 (${bad.length})` : `✓ tT 통과 (${ok.length})`);
});
