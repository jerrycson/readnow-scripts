// 🔁 (정범님 11/13 16:00 pxgrow) 🔬 조회수 실험 › ⏰ 매일 자동 붙이기·다시 확인 › 🔁 새 상품 덧붙임 칸 — 낮 시각·간격 보임·저장(app_settings/pxDaily) · 10분 아래는 10 · 그룹 칸에 지난 덧붙임
//  사용: w/pw 안에서 RN_PORT=8765 node tPXGROWUI1113.js
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const bad = []; const chk = (k, c, info) => { R[k] = c ? true : info === undefined ? false : info; if (!c) bad.push(k); };
  await p.evaluate(async () => { localStorage.setItem('rn-device', 'TEST-PC'); S.devOk = true; S.app.adminDevices = ['TEST-PC']; S.app.cloudUrl = 'https://cloud.test'; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test', adminDevices: ['TEST-PC'] }, { merge: true }); const now = new Date().toISOString();
    await db.collection('px_exp_groups').doc('g_all1107').set({ gid: 'g_all1107', name: '🔬 전체 상품(11/07)', lids: ['1', '2'], empty: 'bare', on: true, auto: true, from: 'g_bare1107', importedAt: now, lastImportAt: now, growAt: now, growLast: { at: now, mode: 'inc', read: 120, cand: 3, add: 2, gap: 30, day: true } }); pxInit(); });
  await p.waitForTimeout(900); await p.evaluate(() => openPxExp()); await p.waitForTimeout(1200);
  R.row = await p.evaluate(() => { const r = document.querySelector('#px_daily #px_grow'); if (!r) return null; const v = (k) => { const i = r.querySelector(`[data-pxdcfg="${k}"]`); return i ? i.value : null; }; return { t: r.textContent.replace(/\s+/g, ' '), from: v('growFrom'), to: v('growTo'), day: v('growDay'), night: v('growNight'), dis: !!r.querySelector('input[disabled]') }; });
  chk('row', R.row && /새 상품 덧붙임/.test(R.row.t) && R.row.from === '05:00' && R.row.to === '17:00' && R.row.day === '30' && R.row.night === '360', R.row);
  const setv = (k, v) => p.evaluate(([k, v]) => { const i = document.querySelector(`#px_grow [data-pxdcfg="${k}"]`); i.value = v; i.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
  if (R.row && !R.row.dis) { await setv('growDay', '45'); await p.waitForTimeout(500); await setv('growNight', '3'); await p.waitForTimeout(500); await setv('growFrom', '06:30'); await p.waitForTimeout(500);
    R.saved = await p.evaluate(async () => { const d = (await db.collection('app_settings').doc('pxDaily').get()).data() || {}; return { day: d.growDay, night: d.growNight, from: d.growFrom }; });
    chk('save', R.saved.day === 45 && R.saved.night === 10 && R.saved.from === '06:30', R.saved); }
  else chk('admin', false, '관리자 기기가 아니라 칸이 막힘');
  await p.waitForTimeout(600);
  R.card = await p.evaluate(() => { const g = document.querySelector('details[data-pxgid="g_all1107"]'); return g ? g.textContent.replace(/\s+/g, ' ').slice(0, 600) : null; });
  chk('card', /바뀐 것만 120개 읽음 · 2개 더함/.test(R.card || '') && /낮 06:30~17:00 45분 · 밤 10분마다/.test(R.card || ''), R.card);
  chk('noErr', errs.length === 0, errs);
  console.log(JSON.stringify(R, null, 1).slice(0, 2500)); console.log(bad.length ? '❌ tPXGROWUI1113 실패 — ' + bad.join(', ') : '✓ tPXGROWUI1113 통과 ' + Object.keys(R).filter((k) => R[k] === true).length + '항목');
});
