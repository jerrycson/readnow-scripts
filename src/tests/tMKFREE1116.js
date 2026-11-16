// tMKFREE1116 — (🔬 정밀 점검 11/16 🪶 mkfree1) 🌐 알라딘 밖 정보 보관본을 30분 안 쓰면 메모리에서 내림 · 시장 화면을 보는 중·받는 중엔 안 내림 · 다시 쓰면 보관본에서 다시 꺼냄
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const out = {}; const M = S.mk; const fill = () => { for (const g of MK_G) { M.docs[g] = new Map(); for (let i = 0; i < 50; i++) M.docs[g].set('97911' + i, { g, i }); } M.loaded = true; M.busy = false; S._mkRowC = new Map([['a', { sg: 1, r: {} }]]); MEMO.set('mkRows|1|250', { v: 0, t: 0, u: 0, r: [1] }); MEMO.set('mkMap|1|250', { v: 0, t: 0, u: 0, r: new Map() }); };
    const tab0 = S.tab, det0 = S.detail;
    fill(); S.tab = 'home'; S.detail = null; M.useAt = Date.now() - 10 * 60e3; mkIdleFree(); out.keep10 = M.loaded && M.docs.basic.size === 50;
    M.useAt = Date.now() - 31 * 60e3; S.tab = 'market'; mkIdleFree(); out.keepOnTab = M.loaded && M.docs.basic.size === 50 && Date.now() - M.useAt < 5e3;
    M.useAt = Date.now() - 31 * 60e3; S.tab = 'home'; S.detail = { xhub: 1 }; mkIdleFree(); out.keepOnHub = M.loaded; S.detail = { mk: 'mk_sp' }; M.useAt = Date.now() - 31 * 60e3; mkIdleFree(); out.keepOnMkPage = M.loaded;
    S.detail = null; M.useAt = Date.now() - 31 * 60e3; M.busy = true; mkIdleFree(); out.keepBusy = M.loaded; M.busy = false;
    M.tryAt = Date.now(); mkIdleFree(); out.freed = !M.loaded && MK_G.every((g) => M.docs[g].size === 0) && S._mkRowC === null && !MEMO.has('mkRows|1|250') && !MEMO.has('mkMap|1|250') && M.tryAt === 0 && M.freed && M.freed.n === 250;
    /* 다시 쓰면: extRef가 쓴 때를 적고(내리지 않음) mkSync가 다시 받을 수 있음(tryAt 0) */
    const l = [...S.plist.values()][0]; try { extRef(l); } catch (e) {} out.reUse = Date.now() - M.useAt < 5e3;
    S.tab = tab0; S.detail = det0; return out; });
  console.log(JSON.stringify(r), errs.join('|'));
  const ok = r.keep10 && r.keepOnTab && r.keepOnHub && r.keepOnMkPage && r.keepBusy && r.freed && r.reUse && !errs.length;
  console.log(ok ? '✓ tMKFREE1116 통과' : '❌ tMKFREE1116 실패');
});
