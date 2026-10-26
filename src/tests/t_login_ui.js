// 🔑 관리도구 '알라딘 로그인' 칸 — 계정 문서·하루 요약을 그리는지, 계정 쉼 두 번 누르기
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const r = await p.evaluate(async () => { const now = Date.now(); localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true;
    await db.collection('app_settings').doc('aladin_login').set({ tries: [{ at: now - 3600e3, who: 'JS-MAIN', net: '211.36', ok: false, how: 'naver', why: '알라딘 경고: 로그인 과정에 문제(에러코드:42FB6013)', code: '42FB6013', blocked: true }, { at: now - 60e3, who: 'HOME', net: '121.1', ok: true, how: 'naver' }],
      dev: { 'JS-MAIN': { in: false, at: now - 50e3, how: 'out' }, HOME: { in: true, at: now - 60e3, how: 'login' }, cloud: { in: true, at: now, how: 'session' } }, next: { 'JS-MAIN': now + 300e3 }, net: { 'JS-MAIN': '211.36' }, blk: { 'JS-MAIN·211.36': { first: now - 3600e3, last: now - 3600e3, n: 1, okAt: null } } });
    S.sec.mg_login = true; openMgr(); await new Promise((r) => setTimeout(r, 800)); mgrRedraw(); await new Promise((r) => setTimeout(r, 300));
    const sec = document.querySelector('[data-sec="mg_login"]'); const t = sec ? sec.innerText : '';
    const b = sec && sec.querySelector('[data-alg-hold="1"]'); let hold0 = null, hold1 = null; if (b) { await new Promise((r) => setTimeout(r, 1500)); document.querySelector('[data-alg-hold="1"]').click(); await new Promise((r) => setTimeout(r, 50)); hold0 = ((await db.collection('app_settings').doc('aladin_login').get()).data() || {}).holdUntil || 0; const b2 = document.querySelector('[data-alg-hold="1"]'); window.__armed = b2.dataset.armed; b2.click(); await new Promise((r) => setTimeout(r, 400)); hold1 = ((await db.collection('app_settings').doc('aladin_login').get()).data() || {}).holdUntil || 0; }
    const feat = FEAT.some((x) => /알라딘 로그인/.test(x.t)); return { t, hasBtn: !!b, hold0, hold1, feat, armed: window.__armed, toast: (document.querySelector('.toast, #toast') || {}).innerText }; });
  const ok = [/🔑 알라딘 로그인/.test(r.t), /오늘 새 로그인 시도/.test(r.t), /JS-MAIN/.test(r.t) && /🔴 풀림/.test(r.t) && /🟢 로그인됨/.test(r.t), /다음 시도/.test(r.t), /42FB 막힘/.test(r.t) && /아직/.test(r.t), /211\.36/.test(r.t), r.hasBtn, !r.hold0, r.hold1 > Date.now(), r.feat];
  console.log(JSON.stringify(ok), r.armed, r.toast, r.t.slice(0, 300).replace(/\n/g, ' | ')); console.log(ok.every(Boolean) ? '✓ 통과' : '❌ 실패');
});
