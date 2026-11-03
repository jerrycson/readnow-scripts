// tGUIDE — 정범님 11/03: 모든 화면 📖 화면 설명서(PAGE_GUIDES 형식) · 🚀 따라 하기(짚기·없는 요소 안내·끝 요약) · 찾기 · 휴대폰 · release-guard '화면 설명서 검사'
// 쓰는 법: RN_PORT=<포트> node tGUIDE.js  (작업 폴더 pw/ 안 — harness.js·seed.js 옆)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const path = require('path'); const fs = require('fs'); const W = path.resolve(__dirname, '..');
(async () => {
  // ── ⑥ release-guard: 빠진 화면·빠진 설명서·죽은 선택자를 잡는가 (브라우저 없이)
  { const gf = [W + '/release-guard.js', W + '/../readnow-scripts/src/tools/release-guard.js'].find((f) => fs.existsSync(f)); const g = require(gf); const t = fs.readFileSync(W + '/app.html', 'utf8');
    const run = (x) => { const b = [], w = []; g.pgdCheck(x, null, b, (s) => w.push(s), () => {}); return { b, w }; };
    const r0 = run(t); ok(!r0.b.length, '지금 코드: 화면 설명서 검사 통과 ' + JSON.stringify(r0.b.slice(0, 3)));
    const r1 = run(t.replace('\nfunction openRefund(', '\nfunction openZzNew() { S.detail = { zznew: 1 }; }\nfunction openRefund(')); ok(r1.b.some((x) => /PG_SCR\)에 없는 화면: openZzNew/.test(x)), '새 상세 화면(설명서 목록에 없음) → 빌드 멈춤');
    const r2 = run(t.replace('  refund: P(', '  refundX: P(')); ok(r2.b.some((x) => /설명서 없음: refund/.test(x)), '설명서가 빠진 화면 → 빌드 멈춤');
    const r3 = run(t.replace("'#sds_all']", "'#no_such_btn_zz']")); ok(r3.w.some((x) => /no_such_btn_zz/.test(x)), '설명서가 가리키는 단추가 코드에서 사라짐 → ⚠ 경고');
    const r4 = run(t.replace("const t = [['home', '홈', ICON.home], ", "const t = [['home', '홈', ICON.home], ['zztab', 'ZZ', ICON.home], ")); ok(r4.b.some((x) => /zztab 탭/.test(x)), '새 탭에 설명서 없음 → 빌드 멈춤'); }
  await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(700);
    const r = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { scr: {}, tabs: {}, err: [] }; window.ask = async () => true;
      const walkAll = async () => { pgwStart(); await Wt(120); let n = 0; while (document.querySelector('[data-pgw="next"]') && n < 40) { document.querySelector('[data-pgw="next"]').click(); await Wt(40); n++; } const end = document.querySelector('.pgw-tip'); const t = end ? end.textContent : ''; const c = document.querySelector('[data-pgw="close"]'); if (c) c.click(); return { n, end: /따라 하기 끝/.test(t), miss: (t.match(/아직 없음 (\d+)/) || [])[1] }; };
      // ① 모든 화면 설명서 있음 (손으로 쓴 것 또는 자리만)
      const D = pgdDefs(); o.noGuide = PG_SCR.filter((s) => !D[s[0]] && !PAGE_GUIDES[s[0]]).map((s) => s[0]).concat(Object.keys(PG_TABS).filter((k) => !D[k])); o.counts = {}; Object.entries(D).forEach(([k, g]) => { o.counts[k] = [(g.walk || []).length, (g.chapters || []).reduce((a, c) => a + c.items.length, 0)]; });
      // ② 탭마다 📖 열림 · 따라 하기 끝까지
      for (const tab of ['home', 'search', 'products', 'sellers', 'orders', 'purchase', 'biz', 'market', 'projects', 'settings']) { try { S.tab = tab; renderTabs(); renderMain(); await Wt(250); kbBtnFill(); const b = document.querySelector('header.top .pgdbtn'); b.click(); await Wt(120); o.tabs[tab] = { id: PGD.id, open: !!PGD.el, ttl: PGD.el && PGD.el.querySelector('.rgen-ttl').textContent, auto: PGD.G.chapters.filter((c) => c.auto).length, ...(await walkAll()) }; pgdClose(); } catch (e) { o.err.push(tab + ': ' + e.message); } }
      S.tab = 'home'; renderTabs(); renderMain(); await Wt(200);
      // ③ 따로 화면 — 인자 없이 열 수 있는 것은 모두 열어 📖 · 따라 하기
      const skip = new Set(['openRegister', 'openListView', 'openProduct', 'openCustomer', 'openSeller', 'openBook', 'openWho', 'openY24Product', 'openSeen', 'openCatPage', 'openSupplier', 'openLostCase', 'openShipDay', 'openShipCost', 'openOrderOps', 'openPurRec', 'openPurEdit', 'openPending', 'openKimisoDoc', 'openBuyback', 'openBench', 'openBenchVs', 'openObs', 'openMkPage', 'openGroupPerf', 'openPurEntry', 'openDrill', 'openSalesView', 'openSellerCount', 'openMarketList', 'openCashForm', 'openDispForm', 'openBbForm', 'openPurForm', 'openTabOrder', 'openInvBatch', 'openInvMatch', 'pptGroupOpen', 'openPresetEditor', 'openLogViewer', 'pptHistory']);
      for (const s of PG_SCR) { const [id, , , fn] = s; if (skip.has(fn) || typeof window[fn] !== 'function') continue; try { if (document.getElementById('sheet').classList.contains('on')) { history.back(); await Wt(250); } await window[fn](); await Wt(380); const cur = pgdCur(); kbBtnFill(); const b = document.querySelector('#sheet .pgdbtn'); if (b) b.click(); else pgdOpen(); await Wt(100); o.scr[id] = { cur, btn: !!b, open: !!PGD.el, pid: PGD.id, items: PGD.G ? PGD.G.chapters.reduce((a, c) => a + c.items.length, 0) : 0, ...(await walkAll()) }; pgdClose(); } catch (e) { o.err.push(id + ': ' + e.message); } }
      if (document.getElementById('sheet').classList.contains('on')) { history.back(); await Wt(300); }
      // ④ 짚기·없는 요소 안내·찾기 (판매중지 목록)
      openStopList(); await Wt(400); pgdOpen(); await Wt(100); PGD.G.walk.splice(1, 0, { t: '시험: 없는 단추', d: 'x', sel: '#zz_no_such' }); pgwStart(); await Wt(250); const sp = document.querySelector('.pgw-sp').getBoundingClientRect(); o.spot1 = sp.width > 4 && !document.querySelector('.pgw-sp').classList.contains('none');
      document.querySelector('[data-pgw="next"]').click(); await Wt(200); o.missMsg = (document.querySelector('.pgw-miss') || {}).textContent || ''; o.spotNone = document.querySelector('.pgw-sp').classList.contains('none');
      document.querySelector('[data-pgw="skip"]').click(); await Wt(100); o.endTxt = document.querySelector('.pgw-tip').textContent; document.querySelector('[data-pgw="close"]').click(); await Wt(50); o.walkGone = !document.querySelector('.pgw-tip') && PGD.el.style.display !== 'none';
      const q = PGD.el.querySelector('.rgen-q'); q.value = '이유'; q.dispatchEvent(new Event('input')); await Wt(300); o.search = PGD.el.querySelectorAll('.rgen-sr [data-pgdid]').length; o.mark = !!PGD.el.querySelector('.rgen-sr mark');
      q.value = ''; q.dispatchEvent(new Event('input')); await Wt(250); const ch = PGD.G.chapters[0]; PGD.el.querySelector(`[data-pgdid="${ch.items[0].id}"]`) ? PGD.el.querySelector(`.rgen-a [data-pgdid="${ch.id}"]`).click() : 0; await Wt(80); pgdShow(ch.items.find((x) => x.go).id); await Wt(60); const gb = PGD.el.querySelector('.rgen-go'); o.goBtn = !!gb; if (gb) { gb.click(); await Wt(200); o.goHl = !!document.querySelector('.rgen-hl'); }
      const autoDom = PGD.G.chapters.find((c) => c.id === 'auto-dom'); o.autoDom = autoDom ? autoDom.items.length : 0; pgdClose();
      // ⑤ Alt+G 켜고 끔 · 등록 화면은 등록 백과
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', key: 'g', altKey: true, bubbles: true })); await Wt(100); o.altOpen = !!PGD.el && PGD.id === 'stopList'; document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', key: 'g', altKey: true, bubbles: true })); await Wt(80); o.altClose = !PGD.el;
      history.back(); await Wt(300); openRegister(); await Wt(700); o.regCur = pgdCur(); kbBtnFill(); o.regNoPgd = !document.querySelector('#sheet .pgdbtn'); pgdOpen(); await Wt(150); o.regRgen = !!RGEN.el && !PGD.el; rgenClose(); history.back(); await Wt(300);
      // ⑥ 다른 작업자 PAGE_GUIDES가 자리만보다 먼저 · 목록 화면은 여는 함수로 알아봄 · 기능 찾기
      PAGE_GUIDES.holdPool = { title: '시험 덮어쓰기', ver: 'x', walk: [{ t: 'a', d: 'b', sel: '#back' }], chapters: [{ id: 'c', t: '장', items: [{ id: 'i', t: '항목', d: 'd' }] }] }; openHoldPool(); await Wt(300); pgdOpen(); await Wt(80); o.ext = PGD.el.querySelector('.rgen-ttl').textContent; pgdClose(); delete PAGE_GUIDES.holdPool; history.back(); await Wt(300);
      openMatchNone(); await Wt(300); o.listCur = pgdCur(); history.back(); await Wt(300);
      o.feat = featFind('화면 설명서').some((f) => /화면 설명서/.test(f.t)); o.featScr = (() => { const F = featIndex().filter((f) => pgdFeatScr(f) === 'ship'); return F.length; })();
      o.kbG = KB_G.some(([k]) => k === 'Alt + G');
      return o; });
    ok(!r.noGuide.length, '모든 화면·탭에 설명서 있음 (빠짐: ' + r.noGuide.join(',') + ')');
    for (const [k, v] of Object.entries(r.tabs)) ok(v.open && v.id === k && v.end && v.auto >= 1, `탭 ${k}: 📖 열림(${v.ttl}) · 따라 하기 ${v.n}단계 끝(아직 없음 ${v.miss}) · 저절로 장 ${v.auto}`);
    const S2 = Object.entries(r.scr); ok(S2.length >= 45, `따로 화면 ${S2.length}개를 열어 봄`); for (const [k, v] of S2) ok(v.open && v.cur === k && v.pid === k && v.end, `화면 ${k}: 알아봄(${v.cur}) · 📖${v.btn ? ' 단추' : ''} 열림 · 항목 ${v.items} · 따라 하기 끝(아직 없음 ${v.miss})`);
    ok(r.spot1, '따라 하기: 첫 단계 요소를 밝게 짚음'); ok(/아직 없음/.test(r.missMsg) && r.spotNone, '없는 요소 → \'이 화면에 아직 없음\' 안내 · 짚기 없음'); ok(/따라 하기 끝/.test(r.endTxt) && /아직 없음 1/.test(r.endTxt), '건너뛰기 → 끝 요약(아직 없음 1)'); ok(r.walkGone, '닫기 → 풍선 사라지고 설명서 다시 보임');
    ok(r.search > 0 && r.mark, `찾기: '이유' ${r.search}개 · 낱말 빛냄`); ok(r.goBtn && r.goHl, '➜ 바로 가기 → 그 자리 깜빡임'); ok(r.autoDom >= 1, `🧩 지금 화면의 칸·단추 ${r.autoDom}개 저절로`);
    ok(r.altOpen && r.altClose, 'Alt+G 켜고 끔'); ok(r.regCur === 'register' && r.regNoPgd && r.regRgen, '등록 화면: 📖 = 등록 백과 그대로(📖 설명서 단추 따로 없음)');
    ok(/시험 덮어쓰기/.test(r.ext), '다른 작업자 PAGE_GUIDES가 먼저 쓰임'); ok(r.listCur === 'matchNone', '목록 화면을 여는 함수로 알아봄(matchNone)'); ok(r.feat, '🔍 기능 찾기에 화면 설명서'); ok(r.featScr > 3, `출고 화면 기능 찾기 항목 ${r.featScr}개가 설명서에 저절로`); ok(r.kbG, '⌨ 단축키 표에 Alt+G');
    if (r.err.length) { bad++; console.log('  ❌ 오류', r.err.slice(0, 10)); }
    console.log('GUIDES ' + JSON.stringify(r.counts));
  });
  // ⑦ 휴대폰: 아래 시트 · 풍선은 화면 아래 · 단추
  await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
    const r = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; kbBtnFill(); o.btn = !!document.querySelector('header.top .pgdbtn'); openStopList(); await Wt(400); kbBtnFill(); const b = document.querySelector('#sheet .pgdbtn'); o.sbtn = !!b; b.click(); await Wt(150); o.mode = PGD.mode; o.cls = PGD.el.className; pgwStart(); await Wt(250); const tr = document.querySelector('.pgw-tip').getBoundingClientRect(); o.tipBottom = Math.round(innerHeight - tr.bottom); o.tipW = Math.round(tr.width); o.vw = innerWidth; pgwStop(); pgdClose(); return o; });
    ok(r.btn && r.sbtn, '휴대폰: 머리줄 📖 단추'); ok(r.mode === 'sheet' && /m-sheet/.test(r.cls), '휴대폰: 설명서 = 아래 시트'); ok(r.tipBottom <= 16 && r.tipW >= r.vw - 30, `휴대폰: 따라 하기 풍선 화면 아래 꽉(아래 ${r.tipBottom}px · 폭 ${r.tipW}/${r.vw})`);
  }, { vp: { width: 390, height: 800 }, touch: true });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ tGUIDE 모두 통과'); process.exit(bad ? 1 : 0);
})();
