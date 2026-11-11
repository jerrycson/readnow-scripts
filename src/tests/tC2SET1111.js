// tC2SET1111 — (11/11 col2ui1 정범님 '번외 수집기 굳은 값 대부분을 설정으로 · 직관적이고 심플하게') ⚙ 설정 › 🧪 번외 수집기 칸
//   ① 표 사본(C2SET)·범위 검사 — 번외 col2-settings.js와 같은 이름·범위·기본값(사본 일치는 lab/col2/tests/t_settings.js가 봄)
//   ② 칸 그리기 — ⭐ 자주 바꾸는 것 · 📏 한도·속도 · ⏰ 주기·시간대 · 🖥 기기 표 · 🕘 바꾼 기록 · 바꾼 값엔 '기본 …'과 ↺
//   ③ 1분 고리 c2CfgSync — 번외 옆 창에서 바꾼 공통 값(setPend)을 문서에 올리고 확인(sharedAck) · 문서가 더 새것이면 번외에 넘김
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tC2SET1111.js · RN_SHOT=<폴더>면 사진 · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const SHOT = process.env.RN_SHOT || '';
const run = require('./harness.js'); const seed = require('./seed.js');
(async () => {
  await run(async (p) => { await p.evaluate(seed); await p.waitForTimeout(1500);
    console.log('① 표 사본 · 범위 검사');
    const a = await p.evaluate(() => ({ n: C2SET.length, day: C2SET.find((r) => r.k === 'pace.dayCap'), c0: c2SetCheck('pace.dayCap', 0), c1: c2SetCheck('pace.dayCap', 900), gap: c2SetCheck('pace.minGapMs', 500), tm: c2SetCheck('kpipa.after', '7:05'), site: c2SetRow('siteCfg.kyobo.dayCap'), pc: C2SET.some((r) => ['on', 'y24', 'alOwn'].includes(r.k)) }));
    ok(a.n >= 35 && a.day && a.day.d === 1600 && a.day.u === '장', '표 사본 — 알라딘 화면 하루 기본 1,600장', a.n);
    ok(!a.c0.ok && /사이로/.test(a.c0.err) && a.c1.ok && a.c1.v === 900 && !a.gap.ok && a.tm.v === '07:05', '범위 검사(하루 1~20,000 · 쉼 0.7초 아래 거절 · 시각 꼴)', a);
    ok(a.site && a.site.site === 'kyobo' && !a.pc, '바깥 사이트는 사이트마다 · 이 PC만 켜끔(예스24·🏠)은 이 칸에 없음(그 PC 옆 창에서)');
    console.log('② 칸 그리기');
    const b = await p.evaluate(() => { S.c2cfg = { v: { 'pace.dayCap': 1200, nightOn: false, 'siteCfg.kyobo.dayCap': 50 }, at: Date.now(), by: '웹앱 시험', log: [{ k: 'pace.dayCap', t: '🟧 알라딘 화면 하루', from: '1,600 장', to: '1,200 장', by: 'HOME 옆 창', at: Date.now() - 60e3 }] };
      S.c2ctl = { HOME: { at: new Date().toISOString(), st: { ver: '0.1.22', running: true, on: true, dayN: 420, dayCap: 1200, al: { on: true, login: 'ok' }, y24: { on: true, login: 'need' }, set: { n: 1, d: { 'pace.hourCap': { v: '100 장', s: 'pc' } }, pend: 0 } } } }; S._c2Un = 1;
      S.devOk = true; localStorage.setItem('rn-device', 'HOME'); S.sec.set_col2_limit = true; S.sec.set_col2_dev = true; S.sec.set_col2_log = true;
      const box = document.createElement('div'); box.id = 'c2s_t'; box.style.cssText = 'position:fixed;left:0;top:0;width:520px;max-height:100vh;overflow:auto;z-index:99999;background:var(--bg,#fff);padding:10px;border:1px solid #ccc'; box.innerHTML = '<h3>⚙ 설정 › 🧪 번외 수집기</h3>' + c2SetHtml(); document.body.appendChild(box);
      const t = box.innerText; return { adm: isAdminDevice(), t, inp: box.querySelector('[data-c2sk="pace.dayCap"]').value, reset: !!box.querySelector('[data-c2sreset="pace.dayCap"]'), site: !!box.querySelector('[data-c2sk="siteCfg.kyobo.dayCap"]'), html: box.innerHTML.length }; });
    ok(/자주 바꾸는 것/.test(b.t) && /한도·속도/.test(b.t) && /주기·시간대/.test(b.t) && /기기 표/.test(b.t) && /바꾼 기록/.test(b.t), '묶음 — 자주 · 한도 · 주기 · 기기 표 · 기록');
    ok(b.inp === '1200' && b.reset && /기본 1,600 장/.test(b.t) && b.site, '바꾼 값은 그 값 · 기본값 글 · ↺ · 바깥 사이트 줄', b.inp);
    ok(/HOME/.test(b.t) && /420\/1,200/.test(b.t) && /로그인 필요/.test(b.t) && /알라딘 화면 한 시간 100 장/.test(b.t) && /HOME 옆 창/.test(b.t), '기기 표(오늘/한도 · 로그인 · 그 PC만 다른 값) · 누가 바꿨는지');
    if (SHOT) await p.locator('#c2s_t').screenshot({ path: path.join(SHOT, 'web-col2-settings.png') });
    console.log('③ 1분 고리 — 올리기 · 넘기기');
    const c = await p.evaluate(async () => { const calls = []; const f = async (u, b) => { calls.push({ u, b }); return { ok: true }; }; const W = [];
      const st = { v: { 'pace.dayCap': 1200 }, at: 1000, log: [] };
      const oldTx = db.runTransaction; db.runTransaction = async (fn) => fn({ get: async () => ({ exists: true, data: () => st }), set: (r, d) => { W.push(d); Object.assign(st, d); } }); const oldDoc = db.collection; const col = db.collection.bind(db); db.collection = (n) => n === 'app_settings' ? { doc: () => ({ onSnapshot: () => () => {} }) } : col(n);
      try { await c2CfgSync({ setPend: { 'pace.hourCap': { v: 100, at: Date.now() - 5000, by: 'HOME 옆 창' }, 'x.bad': { v: 1, at: 1 } }, sharedAt: 0 }, f);
        const up = { w: W[0], call: calls[0] }; calls.length = 0; S.c2cfg = { v: { 'pace.dayCap': 1300 }, at: Date.now() + 1000, by: '웹앱 MJ' }; await c2CfgSync({ sharedAt: 5 }, f); const down = calls[0]; calls.length = 0; await c2CfgSync({ sharedAt: S.c2cfg.at }, f); return { up, down, none: calls.length }; }
      finally { db.runTransaction = oldTx; db.collection = oldDoc; } });
    ok(c.up.w && c.up.w.v['pace.hourCap'] === 100 && c.up.w.v['pace.dayCap'] === 1200 && !c.up.w.v['x.bad'] && c.up.w.log[0].by === 'HOME 옆 창', '옆 창에서 바꾼 값을 문서에 올림(모르는 이름은 버림 · 누가 바꿨는지)', c.up.w);
    ok(c.up.call.u === '/cfg' && c.up.call.b.sharedAck.keys.includes('pace.hourCap') && c.up.call.b.shared.v['pace.hourCap'] === 100, '올린 뒤 번외에 확인과 새 문서를 넘김', c.up.call);
    ok(c.down && c.down.b.shared.v['pace.dayCap'] === 1300 && c.none === 0, '문서가 더 새것이면 번외에 넘김 · 같으면 넘기지 않음', c.down);
    await p.evaluate(() => document.getElementById('c2s_t').remove());
  });
  console.log(bad ? `❌ tC2SET1111 ${bad}개 실패` : '✓ tC2SET1111 통과'); process.exit(bad ? 1 : 0);
})();
