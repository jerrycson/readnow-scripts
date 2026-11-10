// tBENCH1110 — (11/10 일꾼 bench1) 🏢 성공 사례 견줌 화면(경영 탭 카드 · 🚪 바로 가기 · 🔍 기능 찾기 · 🧾 통합 장부 머리 링크 · 🧪 프로젝트 리드나우 2 카드) + 공개 판 facts-docs/bench.json 깨끗함 + 관리자 기기 관측(app_settings/bench_obs)
// 쓰는 법: RN_PORT=<포트> node tBENCH1110.js  (작업 폴더 pw/ 안 — harness.js·seed.js 옆 · 앱 = <서버>/app/index.html · <서버>/facts-docs/bench.json)
// 브라우저 alert/confirm/prompt가 하나라도 뜨면 실패 · 화면 오류(pageerror)는 harness가 ERRORS로 찍음
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const path = require('path'); const fs = require('fs');
(async () => {
  // ── 정적 검사: 공개 판에 넣으면 안 되는 것이 없는가
  const bf = process.env.RN_BENCH || [path.resolve(__dirname, '..', '..', 'facts-docs', 'bench.json'), path.resolve(__dirname, '..', 'facts-docs', 'bench.json')].find((x) => fs.existsSync(x));
  ok(!!bf, '공개 판 facts-docs/bench.json 있음'); const raw = bf ? fs.readFileSync(bf, 'utf8') : '{}'; const B = JSON.parse(raw);
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(raw), '휴대전화 번호 꼴 없음');
  ok(!/정범님 \d|readnow-chats|UX_BENCH|MULTI_CHANNEL|PLATFORM_PLAN|Y24S_|이 세션/.test(raw), '날짜 붙은 지시 인용·비공개 저장소·내부 문서 이름 없음');
  ok((B.cases || []).length >= 20 && (B.items || []).length >= 25 && (B.cases || []).every((c) => c.grade !== '공식' || (c.urls || []).length) && (B.items || []).every((i) => B.states[i.st] || i.st === 'gone'), `사례 ${(B.cases || []).length} · 적용 줄 ${(B.items || []).length} · 공식 사례엔 원문 주소 · 상태 낱말 맞음`);
  ok(['web', 'ui2', 'col2', 'ledger', 'shop'].every((k) => (B.surfaces || {})[k]), '대상 다섯(웹앱·리드나우 2·번외·통합 장부·우리숍)');
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async (NI) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { err: [] };
      try {
        o.go = GO_PAGES.some((g) => g[0] === 'benchCase'); o.feat = FEAT.some((f) => /🏢 성공 사례 견줌/.test(f.t)); o.scr = PG_SCR.some((s) => s[0] === 'benchCase' && s[3] === 'openBenchCase');
        o.thin = THIN_SEC.biz.secs.some((x) => x[0] === 'bz_bcase') && THIN_X.biz.some((x) => x[0] === 'bz_bcase'); o.guide = !!PAGE_GUIDES.benchCase;
        S.tab = 'projects'; renderTabs(); renderMain(); for (let n = 0; n < 20 && !document.querySelector('#pj_ui2 [data-gopage="benchCase"]'); n++) await Wt(100); o.pjBtn = !!document.querySelector('#pj_ui2 [data-gopage="benchCase"]');
        S.ordersLoaded = true; S.tab = 'biz'; renderTabs(); renderMain(); await Wt(1500); o.bizCard = !!document.querySelector('#main [data-gopage="benchCase"]');
        S.tab = 'home'; renderTabs(); renderMain(); await Wt(200);
        // 관리자 기기로 열기 → 관측 저장
        localStorage.setItem('rn-device', 'JS-MAIN'); S.devOk = true; S._bcSaved = null;
        openBenchCase(); const sh = document.getElementById('sheet'); for (let n = 0; n < 40 && !sh.querySelector('#bc_items'); n++) await Wt(100);
        o.open = sh.classList.contains('on') && !!sh.querySelector('#bc_items'); o.nIt = sh.querySelectorAll('#bc_items .bc-it').length; o.links = sh.querySelectorAll('#bc_items a[href^="https://"][target="_blank"]').length;
        o.gapRows = sh.querySelectorAll('#bc_gaps tr').length - 1; o.wRows = sh.querySelectorAll('#bc_w tr').length - 1; o.col = sh.querySelectorAll('#bc_col .item').length; o.no = sh.querySelectorAll('#bc_no .bc-it').length;
        o.yes = (sh.querySelector('#bc_items').textContent.match(/✓ 이 판에 있음/g) || []).length; o.notYet = (sh.querySelector('#bc_items').textContent.match(/✗ 이 판엔 아직 없음/g) || []).length;
        await Wt(300); const ob = ((window.__FS || {}).app_settings || {}).bench_obs || null; o.obs = ob && { ver: ob.ver, mc: ob.chk && ob.chk.mcPlan, n: ob.chk ? Object.keys(ob.chk).length : 0, day: !!ob.day };
        // 거르기 — 대상 통합 장부만
        const lb = sh.querySelector('[data-bcsurf="ledger"]'); lb.click(); await Wt(200); o.ledgerOnly = [...sh.querySelectorAll('#bc_items .bc-it')].every((x) => /대상: 통합 장부/.test(x.textContent)); o.nLed = sh.querySelectorAll('#bc_items .bc-it').length;
        sh.querySelector('[data-bcsurf=""]').click(); await Wt(200); sh.querySelector('[data-bcst="done"]').click(); await Wt(200); o.doneOnly = [...sh.querySelectorAll('#bc_items .bc-it')].every((x) => /✅/.test(x.textContent)); sh.querySelector('[data-bcst=""]').click(); await Wt(200);
        const q = sh.querySelector('#bc_q'); q.value = 'Sellbrite'; q.dispatchEvent(new Event('input')); await Wt(500); o.qN = sh.querySelectorAll('#bc_items .bc-it').length; o.qFocus = document.activeElement && document.activeElement.id === 'bc_q';
        const q2 = sh.querySelector('#bc_q'); q2.value = ''; q2.dispatchEvent(new Event('input')); await Wt(500); o.qBack = sh.querySelectorAll('#bc_items .bc-it').length;
        // 두 번째로 열어도 관측은 하루 한 번
        const W0 = (window.__FSW || []).filter((w) => /bench_obs/.test(w.n || '')).length; history.back(); await Wt(300); o.freed = S.bc === null || S.bc === undefined; openBenchCase(); await Wt(800); o.obsW2 = (window.__FSW || []).filter((w) => /bench_obs/.test(w.n || '')).length - W0; history.back(); await Wt(300);
        // 통합 장부 머리 링크
        try { openLedger(); await Wt(1200); o.ledLink = !!document.querySelector('#sheet [data-gopage="benchCase"]'); history.back(); await Wt(300); } catch (e) { o.ledErr = e.message; }
        // 관리자가 아닌 기기는 관측을 쓰지 않음
        S.devOk = false; localStorage.setItem('rn-device', 'OFFICE-1'); S._bcSaved = null; if (window.__FS && window.__FS.app_settings) delete window.__FS.app_settings.bench_obs; openBenchCase(); await Wt(800); o.noAdminObs = !(((window.__FS || {}).app_settings || {}).bench_obs); history.back(); await Wt(300);
        o.writesOther = (window.__FSW || []).filter((w) => /prd_price_actions|shp_cmds|prd_listings/.test(w.n || '')).length;
      } catch (e) { o.err.push(e.message + ' ' + (e.stack || '').split('\n')[1]); } return o; }, (B.items || []).length);
    console.log(JSON.stringify(r).slice(0, 1500));
    const NI = (B.items || []).length;
    ok(!r.err.length, '시험 중 오류 없음 ' + JSON.stringify(r.err));
    ok(r.go && r.feat && r.scr && r.guide, '🚪 바로 가기 · 🔍 기능 찾기 · 화면 목록 · 화면 설명서에 🏢 성공 사례 견줌');
    ok(r.thin, '휴대폰 고르기(경영 탭)에 🏢 카드 항목');
    ok(r.bizCard, '경영 탭에 🏢 성공 사례 견줌 카드');
    ok(r.pjBtn, '🧪 프로젝트 › 🧩 리드나우 2 카드에 🏢 단추');
    ok(r.ledLink, '🧾 통합 장부 머리에 🏢 링크 ' + (r.ledErr || ''));
    ok(r.open && r.nIt === NI && r.links > 20, `화면이 열리고 적용 줄 ${r.nIt}/${NI} · 원문 링크 ${r.links}개`);
    ok(r.gapRows > 5 && r.wRows === (B.cases || []).length && r.col > 5 && r.no >= 1, `빈 곳 ${r.gapRows}줄 · 가중치 ${r.wRows}줄 · 모을 정보 ${r.col} · 안 쓴 사례 ${r.no}`);
    ok(r.yes >= 5 && r.notYet >= 1, `이 판 확인 — 있음 ${r.yes} · 아직 없음 ${r.notYet}(가지에 있는 기능)`);
    ok(r.obs && r.obs.mc === true && r.obs.n >= 5 && r.obs.day && /^\d+\.\d+\.\d+$/.test(r.obs.ver || ''), '관리자 기기 관측 app_settings/bench_obs(판 번호 · 확인 함수 참거짓) ' + JSON.stringify(r.obs));
    ok(r.obsW2 === 0, '관측은 하루 한 번');
    ok(r.noAdminObs, '관리자가 아닌 기기는 관측을 쓰지 않음');
    ok(r.ledgerOnly && r.nLed >= 5 && r.doneOnly, `거르기 — 통합 장부 ${r.nLed}줄만 · 적용됨만`);
    ok(r.qN >= 1 && r.qN < NI && r.qFocus && r.qBack === NI, `찾기 'Sellbrite' → ${r.qN}줄 · 찾기 칸 그대로 · 지우면 다시 전부`);
    ok(r.freed, '닫으면 받은 판을 버림(메모리)');
    ok(r.writesOther === 0, '값·상품·수집 명령 쓰기 0');
    ok(!dlg.length, '브라우저 팝업(alert/confirm/prompt) 없음 ' + JSON.stringify(dlg));
  });
  console.log(bad ? `❌ tBENCH1110 실패 ${bad}` : '✓ tBENCH1110 모두 통과'); process.exit(bad ? 1 : 0);
})();
