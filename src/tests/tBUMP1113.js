// tBUMP1113 — 🔼 끌올 평생 기록·효과(bump1 · 정범님 11/13 14:03 「상품마다 끌올을 언제 했고 총 몇 번 했는지 항상 추적 · 유의미한 결과가 상품 안과 연구 페이지에 계속 기록」 · 꾸민 자료·가짜 Firestore·가짜 수집기만 — 실제 알라딘은 건드리지 않음)
// 실행: cd pw && RN_PORT=<포트> node tBUMP1113.js (harness.js·fbstub.js·seed.js 옆)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.waitForTimeout(300);
  /* ① 순수 셈 — 두 판매율 차이 구간·판정 · 평균 차이 · 숍 순위 */
  const a = await p.evaluate(() => { const up = fbAC(30, 50, 10, 50), few = fbAC(5, 8, 2, 8), none = fbAC(20, 50, 19, 50), dn = fbAC(5, 60, 25, 60);
    const md = fbMeanDiff([5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [0, 1, 2, 1, 0, 2, 1, 0, 1, 2]);
    S.plist.clear(); const mk = (i, d) => ({ id: 'aladin_P' + i, usedCode: 'P' + i, listingId: String(100 + i), title: '책 ' + i, status: '판매중', active: true, registeredAt: new Date(Date.now() - d * 864e5).toISOString() });
    for (let i = 0; i < 60; i++) S.plist.set('aladin_P' + i, mk(i, i)); S._fbPosC = null; const p0 = fbPos(S.plist.get('aladin_P0')), p30 = fbPos(S.plist.get('aladin_P30')), p59 = fbPos(S.plist.get('aladin_P59'));
    return { up, few, none, dn, md, p0, p30, p59, sig: Object.keys(FB_SIG) }; });
  ok(a.up.sig === 'up' && a.up.lift === 0.4 && a.up.lo > 0 && a.up.p < 0.001, '판매율 차이 — 60% vs 20%(50개씩)는 🟢 유의하게 더 팔림 · 구간이 0보다 큼 · p 아주 작음', a.up);
  ok(a.few.sig === 'few' && a.none.sig === 'none' && a.none.lo < 0 && a.none.hi > 0 && a.dn.sig === 'down', '양쪽 10개 미만 = ⏳ 재료 부족 · 구간이 0을 지나면 ⚪ 차이 없음 · 덜 팔리면 🔴', [a.few, a.none, a.dn]);
  ok(a.md && a.md.d > 0 && a.md.lo > 0 && a.md.sig === 'up', '조회 변화 평균 차이 — 웰치 95% 구간', a.md);
  ok(a.p0.pos === 1 && a.p0.pg === 1 && a.p30.pos === 31 && a.p30.pg === 2 && a.p59.pos === 60 && a.p59.pg === 3 && a.p59.of === 60, '숍 순위 = 알라딘 등록일 새것부터 몇 번째 · 한 쪽 24개', [a.p0, a.p30, a.p59]);

  /* ② 끝까지 흐름 — 60일 넘은 옛 끌올 2번이 있는 상품 → 3번째로 셈 · 회차 줄(누가·PC·숍 순위·값) · 대조군 줄 · 상태 따라감 · 끝나면 새 상품 열쇠 */
  const b = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.user = S.user || { email: 'test@x' }; S.leader = true; S.fbTestRun = true; S.devOk = true; S.plist.clear(); S.fb.jobs.clear(); S._fbOv = null; S.fbH.clear();
    const mk = (i, o) => ({ id: 'aladin_U9' + i, usedCode: 'U9' + i, listingId: String(50000 + i), title: '옛 책 ' + i, isbn13: '978890000000' + i, price: 7000 + i * 100, qty: 1, grade: '상', status: '판매중', active: true, sku: 'PNK_' + i, registeredAt: '2026-06-0' + (i + 1) + 'T10:00:00', firstSeenAt: '2026-06-0' + (i + 1) + 'T10:05:00', bookId: 'bk' + i, publisher: '출판사', ...(o || {}) });
    [mk(1), mk(2), mk(3), mk(4)].forEach((l) => S.plist.set(l.id, l)); for (let i = 0; i < 30; i++) S.plist.set('aladin_N' + i, { id: 'aladin_N' + i, usedCode: 'N' + i, listingId: String(70000 + i), title: '새 책 ' + i, status: '판매중', active: true, registeredAt: new Date(Date.now() - i * 3600e3).toISOString() }); S.prodLoaded = true; S._fbPosC = null;
    window.__FS.prd_used_info = { 50001: { note: '모서리 살짝 눌림' }, 50002: { note: '' }, 50003: { note: '' }, 50004: { note: '' } };
    /* 옛 끌올 2번(150일·90일 전) — 일 장부(60일만 들음)엔 없고 평생 장부에만 */ window.__FS.prd_bump_hist = { aladin_U80: { root: 'aladin_U80', keys: ['aladin_U80', 'aladin_U85', 'aladin_U91'], title: '옛 책 1', n: 2, ev: [{ job: 'old1', k: 'b', n: 1, st: 'done', at: new Date(Date.now() - 150 * 864e5).toISOString(), doneAt: new Date(Date.now() - 150 * 864e5).toISOString(), from: 'aladin_U80', to: 'aladin_U85' }, { job: 'old2', k: 'b', n: 2, st: 'done', at: new Date(Date.now() - 90 * 864e5).toISOString(), doneAt: new Date(Date.now() - 90 * 864e5).toISOString(), from: 'aladin_U85', to: 'aladin_U91' }] } };
    fbWatch(); fbCfg(); await W(80); S.fbCfg = { ab: true, noPhoto: true }; const P = fbPool(fbCfg());
    const R = P.L.filter((r) => ['aladin_U91', 'aladin_U92', 'aladin_U93', 'aladin_U94'].includes(r.l.id)).map((r) => ({ ...r, score: 0.3, pred: 0.12 })); let i = 0; const q = await fbQueue(R, { strat: 'ageMed', stratName: '🕰 신선도', pool: P.L, rnd: () => [0.1, 0.9][i++ % 2] }); await W(300);
    const J0 = Object.entries(window.__FS.prd_bump || {}).map(([id, v]) => ({ id, ...v })); const jb = J0.find((j) => j.key === 'aladin_U91' && j.abArm === 'b') || J0.find((j) => j.key === 'aladin_U91');
    const H0 = JSON.parse(JSON.stringify(window.__FS.prd_bump_hist)); S.regCmds = new Map(); await fbTick(); await W(200); const delCmd = Object.entries(window.__FS.shp_cmds || {}).find(([, v]) => v.type === 'regDel'); const st1 = (window.__FS.prd_bump_hist.aladin_U80.ev.find((v) => v.job === (jb && jb.id)) || {}).st;
    const [cid, cv] = delCmd; const res = {}; cv.items.forEach((x) => { res[x.listingKey] = { state: 'deleted' }; }); window.__FS.shp_cmds[cid] = { ...cv, status: 'done', results: res };
    await W(80); await fbTick(); await W(200); const reg = Object.entries(window.__FS.shp_cmds || {}).find(([, v]) => v.type === 'regBulk'); const ri = Object.entries(window.__FS.reg_items || {}).filter(([, v]) => v.bump); const st2 = (window.__FS.prd_bump_hist.aladin_U80.ev.find((v) => v.job === jb.id) || {}).st;
    const [rid, rv] = reg; const rr = {}; ri.forEach(([k, v], n) => { rr[k] = { state: 'live', usedCode: 'U7' + n, listingId: String(77700 + n) }; S.plist.set('aladin_U7' + n, { id: 'aladin_U7' + n, usedCode: 'U7' + n, listingId: String(77700 + n), title: '옛 책', status: '판매중', active: true, registeredAt: new Date().toISOString() }); }); window.__FS.shp_cmds[rid] = { ...rv, status: 'done', results: rr }; S._fbPosC = null;
    await W(80); await fbTick(); await W(300); const H1 = JSON.parse(JSON.stringify(window.__FS.prd_bump_hist)); const ev1 = H1.aladin_U80.ev.find((v) => v.job === jb.id);
    return { q, jb: jb && { n: jb.n, hid: jb.hid, posB: jb.posB, arm: jb.abArm }, ev0: H0.aladin_U80.ev.find((v) => v.job === jb.id), st1, st2, ev1, keys: H1.aladin_U80.keys, n1: H1.aladin_U80.n, hids: Object.keys(H1), ctrl: Object.values(H1).flatMap((d) => d.ev).filter((v) => v.k === 'c') }; });
  ok(b.q.n >= 1 && b.q.nc >= 1 && b.jb && b.jb.arm === 'b', '확정 → A/B로 올림 쪽·대조군 나뉨(가짜 동전)', b.q);
  ok(b.jb.n === 3 && b.jb.hid === 'aladin_U80', '60일 넘은 옛 끌올 2번이 있는 상품 → 일 장부에 3번째로 셈(전엔 1로 다시 셈) · 평생 장부 열쇠', b.jb);
  ok(b.ev0 && b.ev0.k === 'b' && b.ev0.n === 3 && ['queued', 'del_wait'].includes(b.ev0.st) && b.ev0.by && b.ev0.dev !== undefined && b.ev0.posB != null && b.ev0.pgB != null && b.ev0.pB === 7100 && b.ev0.lidB === '50001' && b.ev0.strat === 'ageMed' && Array.isArray(b.ev0.ctrl), '평생 장부 회차 줄 — 언제·몇 번째·누가·어느 PC·전략·끌올 전 숍 순위/쪽·판매가·상품 번호·견줄 상품', b.ev0);
  ok(b.st1 === 'del_wait' && b.st2 === 'reg_wait' && b.ev1 && b.ev1.st === 'done' && b.ev1.doneAt && /^aladin_U7/.test(b.ev1.to) && b.ev1.posA === 1, '상태가 바뀔 때마다 회차 줄도 따라감(지우는 중 → 다시 등록 중 → 앞으로 옮김 · 새 상품 열쇠 · 끌올 뒤 숍 순위 1번째)', [b.st1, b.st2, b.ev1]);
  ok(b.n1 === 3 && b.keys.includes(b.ev1.to) && b.keys.includes('aladin_U80') && b.keys.length === 4, '끝난 끌올 수 3 · 바뀐 상품 열쇠가 모두 남음(지우지 않음)', [b.n1, b.keys]);
  ok(b.ctrl.length >= 1 && b.ctrl.every((v) => v.st === 'ctrl' && v.ab && v.posB != null), '대조군도 그 상품 평생 장부에 ⚖ 줄(알라딘·상품은 그대로)', b.ctrl);

  /* ③ 엔진 효과 셈 — 7일이 지난 회차만 · 견줄 상품 · 조회 · 누적(구간·판정) · 날마다 기록 · 🧬 진화 기록 */
  const c = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const H = window.__FS.prd_bump_hist; const ago = (d) => new Date(Date.now() - d * 864e5).toISOString();
    for (const d of Object.values(H)) for (const v of d.ev) { if (v.job === 'old1' || v.job === 'old2') continue; v.at = ago(9); if (v.doneAt) v.doneAt = ago(8.9); }
    /* 판정이 나오게 꾸민 회차 24개(올림 12 · 대조군 12) — 올림은 9개 팔림 · 대조군은 2개 */ for (let i = 0; i < 12; i++) { H['aladin_Z' + i] = { root: 'aladin_Z' + i, keys: ['aladin_Z' + i, 'aladin_ZN' + i], n: 1, ev: [{ job: 'zb' + i, k: 'b', n: 1, st: 'done', ab: 'abz', at: ago(20), doneAt: ago(20), from: 'aladin_Z' + i, to: 'aladin_ZN' + i, ctrl: ['aladin_ZC' + i], lidB: '9' + i, lidA: '9' + i, posB: 300 + i, pgB: 13 }] }; H['aladin_ZC' + i] = { root: 'aladin_ZC' + i, keys: ['aladin_ZC' + i], n: 0, ev: [{ job: 'zc' + i, k: 'c', st: 'ctrl', ab: 'abz', at: ago(20), from: 'aladin_ZC' + i, lidB: '8' + i }] }; }
    const sold = (k, t0, d) => { if (/^aladin_ZN(\d+)/.test(k)) return +RegExp.$1 < 9 ? 1 : 0; if (/^aladin_ZC(\d+)/.test(k)) return +RegExp.$1 < 2 ? 1 : 0; return 0; };
    const views = async (lid, t0, d, dir) => (lid ? (dir < 0 ? 3 : String(lid).startsWith('9') || String(lid).startsWith('777') ? 9 : 4) : null);
    const L = await fbHistEval({ soldOf: sold, views }); const H2 = JSON.parse(JSON.stringify(window.__FS.prd_bump_hist)); const e1 = H2.aladin_U80.ev.find((v) => v.k === 'b' && v.n === 3); const old = H2.aladin_U80.ev.find((v) => v.job === 'old1'); const z0 = H2.aladin_Z0.ev[0];
    const L2 = await fbHistEval({ soldOf: () => 1, views }); const z0b = window.__FS.prd_bump_hist.aladin_Z0.ev[0];
    window.__FS.app_settings = window.__FS.app_settings || {}; delete window.__FS.app_settings.research_pulse; await fbLifeSave(L, { champ: 0.2, chall: 0.18, n: 3 }); await W(50);
    const fe = window.__FS.app_settings.front_bump_eval || {}; const dd = window.__FS.prd_bump_evald || {}; const pu = (window.__FS.app_settings.research_pulse || {}).studies || {};
    return { L, e1: e1 && e1.eff, old: old && old.eff, z0: z0.eff, z0b: z0b.eff, wrote2: L2.wrote, life: fe.life && fe.life.nBump, days: Object.keys(dd), pu: { n13: pu.N13 && pu.N13.value, n12: pu.N12 && pu.N12.value, tr: pu.N13 && pu.N13.trend } }; });
  ok(c.e1 && c.e1.d7 && c.e1.d7.s === 0 && c.e1.d7.vB === 3 && c.e1.d7.vA === 9 && !c.e1.d14 && c.e1.d7.posN != null, '끌올 7일 뒤 — 팔렸나·견줄 상품·👀 조회 7일 전→뒤·지금 숍 순위를 회차 줄에 적음 · 14일은 아직(때가 안 됨)', c.e1);
  ok(c.z0 && c.z0.d7 && c.z0.d14 && !c.z0.d30 && c.z0.d7.s === 1 && c.z0.d7.cs === 1 && c.z0.d7.cn === 1 && c.z0.d7.vA === 9, '20일 전 끌올은 7·14일 효과까지 · 견줄 상품 팔림 수', c.z0);
  ok(c.z0b.d7.s === 1 && c.z0b.d7 && c.wrote2 >= 0 && JSON.stringify(c.z0b.d7) === JSON.stringify(c.z0.d7), '이미 적은 효과는 다시 셈해도 덮지 않음(지우지 않음 · 처음 셈 그대로)', [c.z0, c.z0b]);
  ok(c.L.nBump >= 15 && c.L.nProd >= 13 && c.L.nCtrl >= 13 && c.L.ab.d7 && c.L.ab.d7.nb >= 12 && c.L.ab.d7.sig === 'up' && c.L.ab.d7.lo > 0 && c.L.head && c.L.head.by === 'ab', '누적(60일 제한 없음) — 끌올 수·상품 수 · ⚖ 무작위 A/B 7일: 🟢 유의하게 더 팔림 · 결론은 A/B 먼저', { nBump: c.L.nBump, nProd: c.L.nProd, nCtrl: c.L.nCtrl, ab: c.L.ab.d7, head: c.L.head });
  ok(c.L.hz.d7 && c.L.hz.d7.nb >= 12 && c.L.byN['1'] && c.L.byStrat && c.L.views && c.L.views.na >= 12 && c.L.views.sig === 'up' && c.L.pos && c.L.pos.nB >= 12, '견줄 무리·몇 번째 끌올별·전략별·조회 변화·숍 순위도 셈', { hz: c.L.hz.d7, byN: c.L.byN, views: c.L.views, pos: c.L.pos });
  ok(c.life === c.L.nBump && c.days.length === 1 && c.pu.n13 && /95%/.test(c.pu.n13) && c.pu.n12 === 0.18 && Array.isArray(c.pu.tr) && c.pu.tr.length === 1, '엔진 결과가 남음 — 누적(front_bump_eval.life) · 날마다(prd_bump_evald/날짜) · 🧬 진화 기록 N13(끌올 효과)·N12(채점)', c);

  /* ④ 화면 — 📦 상품 상세 🔼 줄·회차 표 · 🔬 연구 모음 N13 · 🔼 끌올 효과 페이지 · ⬆ 머리 단추 */
  const d = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const H = window.__FS.prd_bump_hist.aladin_U80; const nk = H.keys[H.keys.length - 1]; S.fbH.clear(); const l = S.plist.get(nk) || { id: nk, title: '옛 책 1' };
    const box = document.createElement('div'); box.id = 'tb_box'; box.innerHTML = fbProdHtml(l); document.body.appendChild(box); await W(300); const T = box.textContent; const rows = box.querySelectorAll('#fb_hist table tr').length; box.remove();
    const b0 = document.createElement('div'); b0.innerHTML = fbProdHtml(S.plist.get('aladin_N5')); document.body.appendChild(b0); await W(300); const T0 = b0.textContent; b0.remove();
    let T2 = ''; try { await openProduct(nk); await W(500); T2 = (document.querySelector('#sheet') || {}).textContent || ''; history.back(); await W(300); } catch (e) { T2 = 'ERR ' + e.message; }
    window.__FS.app_settings.research_pulse = { studies: { N13: { at: new Date().toISOString(), metric: '끌올 효과', value: '+50%p', trend: [] } } }; openResearch(); await W(1500); const R = document.querySelector('#sheet').textContent; const rb = !!document.querySelector('#sheet [data-rhopen="bumpEff"]');
    document.querySelector('#sheet [data-rhopen="bumpEff"]').click(); await W(800); const E = document.querySelector('#sheet').textContent; const ids = ['be_head', 'be_ab', 'be_hz', 'be_by', 'be_vw', 'be_days', 'be_list', 'be_how'].filter((x) => !document.getElementById(x)); const pid = !!document.querySelector('#be_list [data-pid]'); const guide = !!PAGE_GUIDES.bumpEff && PG_SCR.some((x) => x[0] === 'bumpEff');
    history.back(); await W(300); history.back(); await W(300); openFrontBump(); await W(400); const fbBtn = !!document.querySelector('#sheet [data-bumpeff]'); document.querySelector('#sheet [data-bumpeff]').click(); await W(600); const opened = !!(S.detail && S.detail.bumpEff); history.back(); await W(300);
    return { T: T.slice(0, 400), rows, T0: T0.slice(0, 200), T2: /끌올 3번/.test(T2), R: /N13/.test(R) && /끌올 효과/.test(R), rb, E: E.slice(0, 300), sig: /유의하게 더 팔림/.test(E) && /95%/.test(E), ids, pid, guide, fbBtn, opened, gone: S.bEff === null }; });
  ok(/끌올 3번/.test(d.T) && /마지막 \d{4}-\d\d-\d\d/.test(d.T) && /효과/.test(d.T) && /7일/.test(d.T) && d.rows >= 4, '📦 상품 상세 — 🔼 끌올 3번 · 마지막 언제 · 효과 + 회차 표(옛 2번 + 이번 1번)', d);
  ok(/끌올 0번/.test(d.T0) && /숍 순위/.test(d.T0), '끌올 안 한 상품 — 🔼 끌올 0번 · 지금 숍 순위', d.T0);
  ok(d.T2, '실제 상품 상세(openProduct) 화면에도 🔼 끌올 3번', d);
  ok(d.R && d.rb, '🔬 연구 모음에 N13 🔼 끌올 효과 · [열기]', d);
  ok(d.sig && !d.ids.length && d.pid && d.guide, '🔼 끌올 효과 페이지 — 결론(유의·95% 구간)·A/B·견줄 무리·몇 번째/전략·조회·날마다·상품마다 · 화면 설명서', d);
  ok(d.fbBtn && d.opened && d.gone, '⬆ 앞 페이지 올리기 머리 단추로 열림 · 닫으면 받은 것 버림(메모리)', d);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); });
