// 🔬 (10/27) 조회수 실험 넓힘 — 실험 페이지: ⏰ 매일 자동 칸·설정 저장 · 🧭 방문 구분(기기·출처·시간대·범위·기간) · 👥 방문자(목록·누르면 방문 기록·Esc) · 그룹 SP×등급 칸·비교 표·정렬(또 누르면 반대)·한 바퀴 시간 · 매일 자동 끄기 · 🖼 그림 위치 · 건너뜀 표시 · 휴대폰 너비
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {}; const bad = [];
  await p.evaluate(async () => { S.app.cloudUrl = 'https://cloud.test'; S.devOk = true; S.app.adminDevices = [deviceName() || '']; await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.test' }, { merge: true });
    const day = (o) => new Date(Date.now() + 9 * 3600e3 - o * 864e5).toISOString().slice(0, 10); const now = new Date().toISOString(); const base = S.plist.get('aladin_U215983410');
    const lids = []; const cell = {}, sp = {}; const cs = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < 16; i++) { const uc = 'U8' + String(1000 + i); const lid = String(600000000 + i); S.plist.set('aladin_' + uc, { ...base, id: 'aladin_' + uc, usedCode: uc, listingId: lid, title: '칸 책 ' + i, status: '판매중', active: true, grade: i % 2 ? '상' : '중' }); lids.push(lid); cell[lid] = cs[i % 4]; sp[lid] = cs[i % 4] <= 'B' ? 6000 + i : 100 + i;
      await db.collection('px_exp').doc(lid).set({ lid, on: true, state: 'done', addedAt: new Date(Date.now() - 3 * 864e5).toISOString(), src: 'g:sp_grade_2000', chkAt: now, ...(i === 1 ? { autoTxt: '상태 양호합니다.' } : {}) });
      await db.collection('px_views').doc(lid + '_' + day(0).replace(/-/g, '')).set({ lid, day: day(0), n: i + 2, human: i + 1, bot: 1, ours: 0, bs: ['k' + i], nw: ['n1', 'n' + (i % 3)], x: { dv: { mobile: i + 1 }, os: { iOS: i + 1 }, br: { 사파리: i + 1 }, app: { 카카오톡: 1, 없음: i }, rf: { m_origin: i + 1 }, hr: { 14: i + 1 }, ipv: { v6: i + 1 }, cks: { '처음·쿠키 없음': i + 1 }, bn: { Googlebot: 1 } }, lastAt: now }); }
    await db.collection('px_exp').doc('600000099').set({ lid: '600000099', skipAt: now, skipWhy: '유의 사항이 비어 있음 — 중 상태는 …', grade: '중' });
    await db.collection('px_views').doc('600000000_' + day(1).replace(/-/g, '')).set({ lid: '600000000', day: day(1), n: 3, human: 1, ours: 2, x: { od: { '사무실-1': 2 }, dv: { pc: 1 }, rf: { w_origin: 1 }, hr: { 9: 1 } }, lastAt: now });
    await db.collection('px_exp_groups').doc('sp_grade_2000').set({ gid: 'sp_grade_2000', name: '🔬 SP×등급 2000', lids, cell, sp, cellNames: { A: 'SP≥5000 · 중', B: 'SP≥5000 · 상', C: 'SP≤500 · 중', D: 'SP≤500 · 상' }, cells: { A: { pool: 900, note: 300, noteUnknown: 100, noNote: 500, picked: 400, short: 100 } }, on: true, auto: true, importedAt: now, lastImportAt: now, lastRid: day(0), runs: { [day(0)]: { plan: 16, n: 16, ms: 16 * 6500, first: new Date(Date.now() - 3 * 3600e3).toISOString(), last: now, edit: 10, check: 4, skip: 1, fail: 1, readd: 1, auto: 2, slices: 4, daily: true }, [day(1)]: { n: 5, ms: 30000 } } });
    await db.collection('app_settings').doc('pxDaily').set({ at: '09:00', cap: 300, recap: 300, lastPlan: { at: now, day: day(0), groups: 1, n: 16, plan: [{ g: 'sp_grade_2000', name: '🔬 SP×등급 2000', add: 12, chk: 4, addLeft: 0 }] } });
    await db.collection('shp_cmds').doc('pxd1').set({ type: 'pxExp', op: 'add', daily: true, rid: day(0), gid: 'sp_grade_2000', gname: '🔬 SP×등급 2000', listingIds: ['600000099', '600000001'], status: 'held', nextAt: new Date(Date.now() + 5 * 60e3).toISOString(), createdAt: now, results: { 600000099: { state: 'skip', kind: 'skip', msg: '유의 사항이 비어 있음 — 중', ms: 2100 } }, prog: { done: 1, total: 2 } });
    for (let i = 0; i < 3; i++) await db.collection('px_vis').doc('vkey000000000000' + i).set({ key: 'key000000000000' + i, kind: i === 2 ? 'ours' : 'human', dev: i === 2 ? '사무실-1' : null, n: 5 - i, lastAt: new Date(Date.now() - i * 60e3).toISOString(), lastLid: '600000000', days: [day(1), day(0)], p: { 600000000: 3, 600000001: 2 }, ua: { dv: 'mobile', os: 'iOS', br: '사파리', app: '카카오톡' }, uas: ['a'], nets: ['n1', 'n2'], ckN: 2, noCkN: 1 });
    await db.collection('px_evt').doc('key0000000000000_' + day(0).replace(/-/g, '')).set({ key: 'key0000000000000', day: day(0), ev: [{ t: '14:31:02', lid: '600000000', rf: 'm_origin', dv: 'mobile', os: 'iOS', br: '사파리', app: '카카오톡', nk: 'n1abcdef', ck: 1, k: 'human' }, { t: '10:01:00', lid: '600000001', rf: 'w_origin', dv: 'pc', os: 'Windows', br: '크롬', nk: 'n2', ck: 0, k: 'human' }] }); });
  await p.waitForTimeout(800); await p.evaluate(() => openPxExp()); await p.waitForTimeout(1500);
  const chk = (k, c, info) => { R[k] = c ? true : info; if (!c) bad.push(k); };
  // ⏰ 매일 자동 칸
  const d1 = await p.evaluate(() => { const d = document.querySelector('#px_daily'); return d ? { t: d.textContent.replace(/\s+/g, ' '), at: d.querySelector('[data-pxdcfg="at"]').value, cap: d.querySelector('[data-pxdcfg="cap"]').value } : null; });
  chk('daily', d1 && d1.at === '09:00' && d1.cap === '300' && /지난 계획/.test(d1.t) && /붙임 12 · 확인 4/.test(d1.t) && /다음 조각/.test(d1.t), d1);
  await p.evaluate(() => { localStorage.setItem('rn-device', 'HOME'); S.devOk = true; pxDailyPaint(); }); await p.waitForTimeout(200);
  await p.fill('#px_daily [data-pxdcfg="cap"]', '200'); await p.dispatchEvent('#px_daily [data-pxdcfg="cap"]', 'change'); await p.waitForTimeout(500);
  chk('capSave', await p.evaluate(() => window.__FS.app_settings.pxDaily.cap === 200 && /하루 최대 붙이기 200/.test(document.body.textContent)));
  // 맡긴 일 — 건너뜀·매일 표시
  chk('cmdSkip', await p.evaluate(() => { const t = [...document.querySelectorAll('#sheet .pxcmd')].map((x) => x.textContent).join(' '); return /⏰ 매일 붙이기·확인/.test(t) && /⏭/.test(t) && /다음 조각/.test(t); }));
  // 🧭 방문 구분
  const b1 = await p.evaluate(() => { const b = document.querySelector('#px_brk'); const t = b.textContent.replace(/\s+/g, ' '); return { t: t.slice(0, 400), mob: /휴대폰/.test(t), kakao: /카카오톡/.test(t), rf: /알라딘 모바일 화면/.test(t), hr: !!b.querySelector('.pxhr svg rect'), bot: /Googlebot/.test(t), v6: /IPv6/.test(t), sum: /사람 137/.test(t) }; });
  chk('brk', b1.mob && b1.kakao && b1.rf && b1.hr && b1.bot && b1.v6 && b1.sum, b1);
  await p.click('#px_brk [data-pxbd="30"]'); await p.waitForTimeout(200); const b30 = await p.evaluate(() => document.querySelector('#px_brk').textContent.replace(/\s+/g, ' '));
  chk('brk30', /최근 30일/.test(b30) && /사무실-1/.test(b30) && /사람 137/.test(b30), b30.slice(0, 300));
  await p.click('#px_brk [data-pxbs="g:sp_grade_2000:B"]'); await p.waitForTimeout(200); const bB = await p.evaluate(() => document.querySelector('#px_brk .pxbsum').textContent.replace(/\s+/g, ' '));
  chk('brkCell', /SP≥5000 · 상/.test(bB) && /사람 32 /.test(bB), bB); /* B칸 = i 1,5,9,13 → 사람 2+6+10+14 */
  // 👥 방문자
  await p.click('#sheet [data-pxvisd] > summary'); await p.waitForTimeout(800);
  const v1 = await p.evaluate(() => { const rows = [...document.querySelectorAll('#px_vis tr.pxvr')]; return { n: rows.length, t: document.querySelector('#px_vis').textContent.replace(/\s+/g, ' ').slice(0, 300) }; });
  chk('visList', v1.n === 2 && /휴대폰 · iOS · 사파리 · 카카오톡/.test(v1.t) && /다시/.test(v1.t), v1);
  await p.click('#px_vis [data-pxvk="ours"]'); await p.waitForTimeout(200); chk('visOurs', await p.evaluate(() => { const r = document.querySelectorAll('#px_vis tr.pxvr'); return r.length === 1 && /사무실-1/.test(r[0].textContent); }));
  await p.click('#px_vis [data-pxvk="human"]'); await p.waitForTimeout(200);
  await p.click('#px_vis tr.pxvr[data-pxvis="key0000000000000"]'); await p.waitForTimeout(900);
  const e1 = await p.evaluate(() => { const d = document.querySelector('#px_vis .pxev'); return d ? d.textContent.replace(/\s+/g, ' ') : null; });
  chk('visEvt', e1 && /14:31:02/.test(e1) && /칸 책 0/.test(e1) && /🍪 다시/.test(e1) && /알라딘 모바일 화면/.test(e1), e1 && e1.slice(0, 300));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); chk('visEsc', await p.evaluate(() => !document.querySelector('#px_vis .pxev') && !!(S.detail && S.detail.pxexp)));
  // 그룹 — 한 바퀴 시간 · 칸 비교 · 정렬
  await p.evaluate(() => { const d = document.querySelector('#sheet details[data-pxgid="sp_grade_2000"]'); d.open = true; d.dispatchEvent(new Event('toggle')); }); await p.waitForTimeout(800);
  const g1 = await p.evaluate(() => { const d = document.querySelector('#sheet details[data-pxgid="sp_grade_2000"]'); const t = d.textContent.replace(/\s+/g, ' '); return { run: /상품당 평균 6\.5초/.test(t) && /한 바퀴/.test(t) && /다시 붙임 1/.test(t), ct: d.querySelectorAll('.pxct tbody tr').length, short: /100개 모자람/.test(t), auto: /⏰ 매일 자동 켜짐/.test(t), noBulk: !d.querySelector('[data-pxgadd]'), rows: d.querySelectorAll('.pxgrow').length }; });
  chk('grp', g1.run && g1.ct === 4 && g1.short && g1.auto && g1.noBulk && g1.rows === 16, g1);
  await p.click('#sheet [data-pxgcell="sp_grade_2000|B"]'); await p.waitForTimeout(500);
  const g2 = await p.evaluate(() => { const r = [...document.querySelectorAll('#sheet details[data-pxgid="sp_grade_2000"] .pxgrow')]; return { n: r.length, allB: r.every((x) => /SP≥5000 · 상/.test(x.textContent)) }; }); chk('cellB', g2.n === 4 && g2.allB, g2);
  await p.click('#sheet [data-pxgsort="sp_grade_2000|v30"]'); await p.waitForTimeout(500); const s1 = await p.evaluate(() => [...document.querySelectorAll('#sheet details[data-pxgid="sp_grade_2000"] .pxgrow .pxgt')].map((x) => x.textContent.trim()));
  await p.click('#sheet [data-pxgsort="sp_grade_2000|v30"]'); await p.waitForTimeout(500); const s2 = await p.evaluate(() => [...document.querySelectorAll('#sheet details[data-pxgid="sp_grade_2000"] .pxgrow .pxgt')].map((x) => x.textContent.trim()));
  chk('sort', s1[0] === '칸 책 13' && s1[3] === '칸 책 1' && s2[0] === '칸 책 1' && s2[3] === '칸 책 13', { s1, s2 });
  // 매일 자동 끄기(한 번) — 기록
  await p.click('#sheet [data-pxgauto="sp_grade_2000"]'); await p.waitForTimeout(600);
  chk('autoOff', await p.evaluate(() => { const g = window.__FS.px_exp_groups.sp_grade_2000; return g.auto === false && (g.hist || []).some((h) => h.op === 'autoOff') && !!document.querySelector('#sheet [data-pxgadd="sp_grade_2000"]'); }));
  // 🖼 그림 위치
  await p.evaluate(() => { const d = document.querySelector('#sheet [data-pxwhere]'); d.open = true; }); await p.waitForTimeout(200);
  chk('where', await p.evaluate(() => { const d = document.querySelector('#sheet [data-pxwhere]'); return d.querySelectorAll('.pxw').length === 4 && d.querySelectorAll('.pxw-mag').length === 4 && /상태 양호합니다/.test(d.textContent) && /cloud\.test\/px\//.test(d.textContent); }));
  // 상품 카드 — '상태 양호합니다.' 적음 · 확인 시각
  chk('card', await p.evaluate(() => { const c = document.querySelector('#sheet .pxcard[data-pxid="600000001"]'); return !!c && /'상태 양호합니다\.' 적음/.test(c.textContent) && /확인 /.test(c.textContent); }));
  // 🔍 기능 찾기
  chk('feat', await p.evaluate(() => FEAT.filter((f) => /방문 구분|방문자 목록|매일 자동 붙이기|SP×등급 2000|어디에 붙나/.test(f.t)).length === 5));
  // 휴대폰 너비 — 가로로 넘치지 않음
  await p.setViewportSize({ width: 390, height: 800 }); await p.evaluate(() => pxDraw(true)); await p.waitForTimeout(600);
  const ov = await p.evaluate(() => { const sh = document.querySelector('#sheet'); const W = sh.clientWidth; const wide = [...sh.querySelectorAll('.card')].filter((c) => c.getBoundingClientRect().right > window.innerWidth + 2).map((c) => c.className + ':' + Math.round(c.getBoundingClientRect().right)); return { W, sw: sh.scrollWidth, wide: wide.slice(0, 4) }; });
  chk('mobile', ov.sw <= ov.W + 2 && !ov.wide.length, ov);
  await p.screenshot({ path: '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/pxw/tX_m.png', fullPage: false });
  chk('errs', !errs.length, errs);
  console.log(JSON.stringify(R, null, 1)); console.log(bad.length ? '❌ tX 실패 — ' + bad.join(', ') : '✓ tX 통과'); });
