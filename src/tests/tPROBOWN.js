// (11/08 정범님) 🧯 문제 상품 알림은 '그 일을 맡은 사람의 기기'에만 — 기기 7가지 × 문제 7가지 표 · 기록(probSync)은 모든 문제 · 관리자 '전체 보기' · ⚙ 설정 짝 바꾸기
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ok = []; const chk = (name, v, info) => { ok.push([name, !!v]); if (!v && info !== undefined) console.log('  ✗ ' + name + ' :: ' + JSON.stringify(info)); };
  /* 문제 7가지
   *  A 🧪 '작업대 1' 등록 시험 상품(U…11)            → JS
   *  B 🧪 '박문정' 작업대 등록 시험 상품(U…15)        → MJ
   *  G 🧪 '작업대 3'(사람 모름) 등록 시험 상품(U…17)  → 관리자
   *  C 🗑 작업대 모름 삭제 실패(맡긴 기기 없음 · U…12) → 관리자
   *  F 🗑 등록 화면(박문정 작업대 줄)에서 맡긴 삭제 실패(U…16) → MJ
   *  D ⏱ 반영 실패 — 맡긴 기기 MJ-PHONE(U…13)       → MJ
   *  E ⏱ 반영 실패 — 맡긴 기기 HOME(관리자 기기 · U…14) → 관리자 */
  await p.evaluate(async () => { S.leader = true; const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); for (const k of ['aladin_U215983411', 'aladin_U215983415', 'aladin_U215983417']) { const l0 = S.plist.get(k); if (l0) l0.registeredAt = today; }
    await db.collection('app_settings').doc('main').set({ reg: { wsList: [{ id: 'main', name: '작업대 1' }, { id: 'w2', name: '박문정' }, { id: 'w3', name: '작업대 3' }] } }, { merge: true }); /* 작업대 목록은 모든 기기 공용(app_settings/main.reg.wsList) */
    const t = new Date().toISOString();
    await db.collection('reg_items').doc('rA').set({ test: true, stage: 'done', ws: 'main', confirmedAt: t, createdAt: t, final: { title: '시험 책 A' }, result: { state: 'live', listingId: '404935001', usedCode: 'U215983411' } });
    await db.collection('reg_items').doc('rB').set({ test: true, stage: 'done', ws: 'w2', confirmedAt: t, createdAt: t, final: { title: '시험 책 B' }, result: { state: 'live', listingId: '404935005', usedCode: 'U215983415' } });
    await db.collection('reg_items').doc('rG').set({ test: true, stage: 'done', ws: 'w3', confirmedAt: t, createdAt: t, final: { title: '시험 책 G' }, result: { state: 'live', listingId: '404935007', usedCode: 'U215983417' } });
    S.regItems = S.regItems || new Map(); S.regItems.set('rF', { id: 'rF', ws: 'w2', stage: 'done', final: { title: '등록 책 F' } });
    const SC = (id, v) => db.collection('shp_cmds').doc(id).set(v); /* 맡긴 일은 shp_cmds로(웹앱이 실시간으로 받아 S.cmdAll·S.peFld를 만듦) */
    await SC('cC', { id: 'cC', type: 'regDel', status: 'done', createdAt: t, by: 'someone@x', items: [{ listingKey: 'aladin_U215983412', listingId: '404935002' }], results: { aladin_U215983412: { state: 'refused', msg: '대조 안 맞음' } } });
    await SC('cF', { id: 'cF', type: 'regDel', status: 'done', createdAt: t, dev: 'JS-MAIN', ws: 'main', by: 'someone@x', items: [{ regItem: 'rF', listingKey: 'aladin_U215983416', listingId: '404935006' }], results: { aladin_U215983416: { state: 'fail', msg: '못 지움' } } });
    const cD = { id: 'cD', type: 'prdEdit', status: 'done', listingKey: 'aladin_U215983413', ch: { price: 1 }, f: { price: { st: 'fail', msg: '반영 실패' } }, dev: 'MJ-PHONE', by: 'mj@x', createdAt: t };
    const cE = { id: 'cE', type: 'prdEdit', status: 'done', listingKey: 'aladin_U215983414', ch: { price: 1 }, f: { price: { st: 'unk', msg: '확인 못 함' } }, dev: 'HOME', by: 'js@x', createdAt: t };
    await SC('cD', cD); await SC('cE', cE);
    await new Promise((r) => setTimeout(r, 1300)); probChanged(true); await new Promise((r) => setTimeout(r, 500)); });

  const EXP = { A: 'JS', B: 'MJ', G: 'admin', C: 'admin', F: 'MJ', D: 'MJ', E: 'admin' };
  const ID = { A: 'aladin_U215983411', B: 'aladin_U215983415', G: 'aladin_U215983417', C: 'aladin_U215983412', F: 'aladin_U215983416', D: 'aladin_U215983413', E: 'aladin_U215983414' };
  // 1) 누구 일인가
  const own = await p.evaluate((ID) => { const F = probAllFull(); const o = {}; for (const [k, id] of Object.entries(ID)) { const e = F.get(id); o[k] = e ? e.P.map((x) => probOwner(x, e)) : null; } return { o, full: F.size, raw: probAllRaw().size }; }, ID);
  console.log('누구 일:', JSON.stringify(Object.fromEntries(Object.entries(own.o).map(([k, v]) => [k, v && v.map((x) => x.o + ' ← ' + x.why)]))));
  chk('문제 7개 모두 셈(거르기 전)', own.full === 7 && own.raw === 7, own);
  for (const k of Object.keys(EXP)) chk(`몫 ${k} = ${EXP[k]}`, own.o[k] && own.o[k].every((x) => x.o === EXP[k]), own.o[k]);

  // 2) 기기 × 문제 표 — 보이는 상품·띠·🧯 단추 수·맨 위 고정·알림
  const DEV = [['JS-MAIN', 'Jerry S', ['A', 'G', 'C', 'E']], ['JS-PHONE', 'Jerry S', ['A', 'G', 'C', 'E']], ['MJ-MAIN', 'M Soo', ['B', 'F', 'D']], ['MJ-PHONE', 'M Soo', ['B', 'F', 'D']], ['HOME', 'Jerry S', ['G', 'C', 'E']], ['LOGGER', 'Jerry S', ['G', 'C', 'E']], ['', 'Jerry S', []], ['TEST-PC', '정범', []], ['MJ-LAPTOP', 'M Soo', ['B', 'F', 'D']]];
  const rows = [];
  for (const [dev, gn, want] of DEV) {
    const r = await p.evaluate(({ dev, gn, ID }) => { if (dev) { localStorage.setItem('rn-device', dev); S.devOk = true; } else { localStorage.removeItem('rn-device'); S.devOk = false; } S.user.displayName = gn;
      const M = probAll(); const vis = Object.entries(ID).filter(([, id]) => M.has(id)).map(([k]) => k).sort();
      const link = probLinkHtml(); const n = (link.match(/문제 상품 <b>(\d+)<\/b>/) || [])[1] || '0'; const top = probTopHtml(false);
      const all = [...S.plist.values()]; const pin = probPin(all); const pinTop = pin.slice(0, M.size).map((l) => l.id).sort(); const A = []; probAlerts((lv, t0, k) => A.push(t0));
      const bands = Object.entries(ID).filter(([, id]) => { const l = S.plist.get(id); return l && /probband/.test(probBand(l)) && !/probband t off/.test(probBand(l)); }).map(([k]) => k).sort();
      const W = WIDGETS.probs[1](); const wsum = (W.match(/문제 상품 <b>(\d+)<\/b>/) || [])[1] || '0';
      return { vis, n: +n, topOn: /probtop on/.test(top), topNone: /probtop none/.test(top), noName: /기기 이름이 아직 없어/.test(top), noOwner: /사람 기기도 관리자 기기도 아니라/.test(top), other: (top.match(/다른 기기 몫 (\d+)개/) || [])[1] || '0', pinOk: JSON.stringify(pinTop) === JSON.stringify([...M.keys()].sort()) && (M.size ? pin !== all : pin === all), alerts: A.length, bands, wsum: +wsum, canAll: probCanAll() }; }, { dev, gn, ID });
    const w = want.slice().sort(); const good = JSON.stringify(r.vis) === JSON.stringify(w) && r.n === w.length && JSON.stringify(r.bands) === JSON.stringify(w) && r.pinOk && r.wsum === w.length && (w.length ? r.topOn && r.alerts > 0 && +r.other === 7 - w.length : r.topNone && r.alerts === 0) && (dev ? !r.noName : r.noName) && (dev === 'TEST-PC' ? r.noOwner : true) && r.canAll === ['JS-MAIN', 'JS-PHONE', 'HOME', 'LOGGER'].includes(dev);
    rows.push([dev || '(이름 없음)', gn, w.join(',') || '-', r.vis.join(',') || '-', r.n, good ? '✓' : '✗']);
    chk(`기기 ${dev || '(이름 없음)'} → ${w.join(',') || '없음'}`, good, r);
  }
  console.log('기기\t구글 이름\t기대\t보임\t🧯 수\t결과\n' + rows.map((x) => x.join('\t')).join('\n'));

  // 3) 기록 쓰기는 모든 문제 — 이 기기가 MJ-MAIN이어도 7개 모두 생김 · 몫(own)도 적음
  const rec = await p.evaluate(async () => { localStorage.setItem('rn-device', 'MJ-MAIN'); S.devOk = true; S.user.displayName = 'M Soo'; S._probSyncBusy = false; await probSync(); await new Promise((r) => setTimeout(r, 400)); const P = window.__FS.prd_problems || {}; const open = Object.values(P).filter((d) => d.open); return { n: open.length, own: Object.fromEntries(Object.entries(P).map(([k, d]) => [k, d.own])), mine: probAll().size }; });
  console.log('기록:', JSON.stringify(rec));
  chk('기록은 모든 문제(7개) — 보이기만 거름', rec.n === 7 && rec.mine === 3, rec); chk('기록에 몫 적음', rec.own['test__aladin_U215983415'] === 'MJ' && rec.own['test__aladin_U215983411'] === 'JS' && rec.own['del__aladin_U215983412'] === 'admin', rec.own);

  // 4) 🧯 문제 상품 페이지 — MJ-MAIN은 자기 몫만(전체 보기 단추 없음) · HOME은 기본 내 몫, 👥 전체 보기로 7개
  const pg = await p.evaluate(async () => { const out = {}; openProblems(); await new Promise((r) => setTimeout(r, 300)); const sh = document.getElementById('sheet');
    out.mj = { cur: sh.querySelectorAll('.probcur').length, btn: !!sh.querySelector('[data-probown]'), own: [...sh.querySelectorAll('.probown')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()).slice(0, 3), logs: sh.querySelectorAll('.problog').length }; history.back(); await new Promise((r) => setTimeout(r, 300));
    localStorage.setItem('rn-device', 'HOME'); S.user.displayName = 'Jerry S'; S.probP.all = false; openProblems(); await new Promise((r) => setTimeout(r, 300)); out.home0 = { cur: sh.querySelectorAll('.probcur').length, logs: sh.querySelectorAll('.problog').length };
    const b = sh.querySelector('[data-probown]'); out.btn = !!b; if (b) b.click(); await new Promise((r) => setTimeout(r, 300)); out.home1 = { cur: sh.querySelectorAll('.probcur').length, logs: sh.querySelectorAll('.problog').length, mineAfter: probAll().size };
    const b2 = sh.querySelector('[data-probown]'); if (b2) b2.click(); await new Promise((r) => setTimeout(r, 200)); out.home2 = sh.querySelectorAll('.probcur').length; history.back(); await new Promise((r) => setTimeout(r, 300));
    localStorage.setItem('rn-device', 'MJ-MAIN'); S.probP.all = true; out.mjForce = probAll(true).size; return out; });
  console.log('페이지:', JSON.stringify(pg));
  chk('MJ 기기 페이지 = 자기 몫 3 · 전체 보기 없음', pg.mj.cur === 3 && !pg.mj.btn && pg.mj.logs === 3 && pg.mj.own.some((x) => /MJ/.test(x) && /박문정/.test(x)), pg.mj);
  chk('HOME 페이지 기본 = 관리자 몫 3', pg.home0.cur === 3 && pg.home0.logs === 3, pg.home0);
  chk('HOME 👥 전체 보기 = 7 (알림·띠는 그대로 내 몫)', pg.btn && pg.home1.cur === 7 && pg.home1.logs === 7 && pg.home1.mineAfter === 3 && pg.home2 === 3, pg);
  chk('사람 기기는 전체 보기를 억지로 켜도 자기 몫', pg.mjForce === 3, pg.mjForce);

  // 5) ⚙ 설정 ① — 짝을 바꾸면 바로(박문정 작업대 → JS) · 기본값 되돌리기
  const st = await p.evaluate(async () => { localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S.user.displayName = 'Jerry S'; const sh = document.getElementById('sheet'); if (sh) sh.classList.remove('on'); S.detail = null; S.tab = 'settings'; renderTabs(); renderMain(); await new Promise((r) => setTimeout(r, 900));
    const box = document.getElementById('st_po'); if (!box) return { box: false }; box.open = true; const ta = box.querySelector('#st_po_ws'); const before = ta.value; const wsNow = box.textContent.includes('박문정 → MJ');
    ta.value = '작업대 1 = JS\n박문정 = JS'; box.querySelector('[data-posave]').click(); await new Promise((r) => setTimeout(r, 600));
    const saved = (window.__FS.app_settings || {}).main || {}; localStorage.setItem('rn-device', 'MJ-MAIN'); const mjAfter = [...probAll().keys()].sort(); localStorage.setItem('rn-device', 'JS-MAIN'); const jsAfter = probAll().size;
    S.tab = 'settings'; renderMain(); await new Promise((r) => setTimeout(r, 400)); const box2 = document.getElementById('st_po'); box2.querySelector('[data-podef]').click(); const defTx = box2.querySelector('#st_po_ws').value; box2.querySelector('[data-posave]').click(); await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem('rn-device', 'MJ-MAIN'); const mjBack = probAll().size; localStorage.setItem('rn-device', 'JS-MAIN');
    const bad = document.getElementById('st_po'); bad.querySelector('#st_po_ws').value = '박문정 = 누구'; const t0 = (window.__FS.app_settings.main.probOwn || {}).at; bad.querySelector('[data-posave]').click(); await new Promise((r) => setTimeout(r, 300)); const t1 = (window.__FS.app_settings.main.probOwn || {}).at;
    return { box: true, before, wsNow, savedWs: saved.probOwn && saved.probOwn.ws, mjAfter, jsAfter, defTx, mjBack, badKept: t0 === t1, log: !!((window.__FS.app_settings || {}).log) }; });
  console.log('설정:', JSON.stringify(st));
  chk('설정 칸 · 기본 짝', st.box && /박문정 = MJ/.test(st.before) && /작업대 1 = JS/.test(st.before) && st.wsNow, st);
  chk('짝 바꾸면 바로(박문정 → JS: MJ 기기는 D만 · JS 기기는 6)', st.savedWs && st.savedWs['박문정'] === 'JS' && JSON.stringify(st.mjAfter) === JSON.stringify(['aladin_U215983413']) && st.jsAfter === 6, st);
  chk('처음 값 되돌리기', /박문정 = MJ/.test(st.defTx) && st.mjBack === 3, st);
  chk('잘못 쓴 줄은 저장 안 함 · 바꾼 기록 남김', st.badKept && st.log, st);

  // 6) 작업대 이름 규칙 — 이름에 사람 표·별칭 · 모르면 관리자
  const ws = await p.evaluate(() => { S.app = { ...S.app, reg: { ...S.app.reg, wsList: [{ id: 'main', name: '작업대 1' }, { id: 'x1', name: 'MJ 둘째' }, { id: 'x2', name: '문정 임시' }, { id: 'x3', name: 'JSON 작업' }] } }; S._setV++; return ['x1', 'x2', 'x3'].map((id) => probPersonOfWs(id).p); });
  chk('작업대 이름 규칙(MJ 둘째 → MJ · 문정 임시 → MJ · JSON 작업 → 모름)', ws[0] === 'MJ' && ws[1] === 'MJ' && ws[2] === null, ws);

  console.log(ok.map(([n, v]) => (v ? '✓ ' : '✗ ') + n).join(' | '));
  console.log(ok.every((x) => x[1]) && !errs.length ? '✓ tPROBOWN 통과' : '❌ tPROBOWN 실패 ' + errs.join(' | '));
});
