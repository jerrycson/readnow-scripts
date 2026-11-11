// tHUB1111 — (11/11 일꾼 hub1) 🔬 연구 모음: 공개 판 facts-docs/research.json 깨끗함 · 들어가는 곳 넷(홈 바로가기 · 경영 탭 카드 · 🚪 바로 가기 · 🔍 기능 찾기) · 연구마다 한 줄(이름·물음·상태·마지막 갱신·최신 결과·열기·원본) · 화면 없는 연구 표시 · 🌦 기상청 날씨 표(지점·모은 기간·평균 기온) · [열기]가 그 화면으로 · 닫으면 버림
// 쓰는 법: RN_PORT=<포트> node tHUB1111.js  (작업 폴더 pw/ 안 — harness.js·seed.js 옆 · 앱 = <서버>/app/index.html · <서버>/facts-docs/research.json) · 화면 사진: RN_SHOT=<폴더>
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const path = require('path'); const fs = require('fs');
(async () => {
  const rf = process.env.RN_RESEARCH || [path.resolve(__dirname, '..', '..', 'facts-docs', 'research.json'), path.resolve(__dirname, '..', 'facts-docs', 'research.json')].find((x) => fs.existsSync(x));
  ok(!!rf, '공개 판 facts-docs/research.json 있음'); const raw = rf ? fs.readFileSync(rf, 'utf8') : '{}'; const D = JSON.parse(raw); const ST = D.studies || [];
  ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(raw), '휴대전화 번호 꼴 없음');
  ok(!/readnow-chats|정범님 \d|이 세션|유착|특혜|공모/.test(raw), '비공개 저장소 이름·날짜 붙은 지시·비공개 가설 낱말 없음');
  ok(ST.length >= 30 && ST.every((x) => x.id && x.name && x.q && D.states[x.st] && (x.open || x.noScr)), `연구 ${ST.length}개 · 모두 이름·물음·상태 · 열기 또는 '화면 없음' 까닭`);
  ok(ST.filter((x) => /^C\d/.test(x.id)).every((x) => !x.open && /비공개/.test(x.q)), '시장 구조 연구(C…)는 이름·결과 비공개');
  ok(ST.some((x) => x.id === 'W01' && x.open === 'wx'), '🌦 기상청 날씨 줄(⚙ 설정으로 열기)');
  const shot = process.env.RN_SHOT || null;
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    await p.evaluate(() => { const F = (window.__FS = window.__FS || {}); F.app_settings = F.app_settings || {}; F.app_settings.wx_run = { key: { tail: 'abcd', at: '2026-11-10T01:00:00Z' }, stn: { 108: { lo: '20241111', hi: '20261110', n: 3, loDone: true }, 119: { lo: '20261101', hi: '20261110', n: 2 } }, last: { at: '2026-11-11T02:00:00Z' } };
      F.app_settings.wx = { cfg: { stns: [108, 119] } }; F.wx_sum = { 108: { stn: 108, rows: { 20261108: [0, 10, 5, 1, 50], 20261109: [0, 12, 7, 2, 50], 20261110: [0, 14, 9, 3, 50] } }, 119: { stn: 119, rows: { 20261109: [0, 9, 4, 1, 40], 20261110: [1, 10, 6, 2, 40] } } };
      F.app_settings.voice_study = { day: '2026-11-11', at: '2026-11-11T01:00:00Z', n: 10 }; });
    const r = await p.evaluate(async (N) => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { err: [] };
      try {
        o.go = GO_PAGES.some((g) => g[0] === 'research'); o.feat = FEAT.some((f) => /🔬 연구 모음/.test(f.t)); o.scr = PG_SCR.some((s) => s[0] === 'research' && s[3] === 'openResearch'); o.guide = !!PAGE_GUIDES.research;
        o.thin = THIN_SEC.biz.secs.some((x) => x[0] === 'bz_rhub') && THIN_X.biz.some((x) => x[0] === 'bz_rhub');
        o.home = /data-gopage="research"/.test(WIDGETS.shortcuts[1]());
        o.openKeys = Object.keys(RH_OPEN).every((k) => rhOpenOk(k));
        S.ordersLoaded = true; S.tab = 'biz'; renderTabs(); renderMain(); await Wt(1500); const bc = document.querySelector('#main [data-gopage="research"]'); o.bizCard = !!bc;
        // 경영 탭 카드로 열기
        bc.click(); const sh = document.getElementById('sheet'); for (let n = 0; n < 40 && !(sh.querySelector('#rh_list .rh-it') && sh.querySelector('#rh_wx td') && sh.querySelector('#rh_list .rh-tag')); n++) await Wt(100);
        o.open = sh.classList.contains('on') && S.detail && S.detail.research; o.nRow = sh.querySelectorAll('#rh_list .rh-it').length; o.nOpen = sh.querySelectorAll('#rh_list [data-rhopen]').length; o.nNo = (sh.querySelector('#rh_list').textContent.match(/아직 웹앱 화면 없음/g) || []).length;
        o.noneCard = (sh.querySelector('#rh_none') || {}).textContent || ''; const t = sh.querySelector('#rh_list').textContent; o.hasQ = /❓/.test(t) && /📌 문서에 적힌 최신 결과/.test(t) && /📂 원본: 비공개 연구 폴더/.test(t) && /설계 단계/.test(t);
        const vrow = sh.querySelector('[data-rhid="N06"]'); o.voiceAt = vrow ? /기록 11-11 10:00/.test(vrow.textContent) : false;
        o.ev0 = ((sh.querySelector('#rh_ev') || {}).textContent || ''); o.ev0Rows = (sh.querySelector('#rh_list').textContent.match(/아직 셈 없음/g) || []).length; o.ev0Svg = sh.querySelectorAll('.rh-sp').length;
        const wx = sh.querySelector('#rh_wx'); o.wx = wx ? wx.textContent : ''; o.wxRows = wx ? wx.querySelectorAll('tr').length - 1 : 0;
        // 거르기·찾기
        // 셈 기록이 없으면 모든 줄이 ⚪ 아직 셈 없음 — '돌고 있음' 표시 0건
        o.tags0 = [...sh.querySelectorAll('#rh_list .rh-tag')].map((x) => x.dataset.rhk); o.liveFake0 = [...sh.querySelectorAll('#rh_list .rh-it')].filter((x) => /돌고 있음|결과 있음|자료 모으는 중/.test((x.querySelector('.bc-st') || {}).textContent || '')).length;
        sh.querySelector('[data-rhst="none"]').click(); await Wt(200); o.noneOnly = sh.querySelectorAll('#rh_list .rh-it').length; o.noLive = !sh.querySelector('[data-rhst="live"]'); sh.querySelector('[data-rhst=""]').click(); await Wt(200);
        const q = sh.querySelector('#rh_q'); q.value = '날씨'; q.dispatchEvent(new Event('input')); await Wt(500); o.qN = sh.querySelectorAll('#rh_list .rh-it').length; o.qFocus = document.activeElement && document.activeElement.id === 'rh_q';
        const q2 = sh.querySelector('#rh_q'); q2.value = ''; q2.dispatchEvent(new Event('input')); await Wt(500); o.qBack = sh.querySelectorAll('#rh_list .rh-it').length;
        window.scrollTo(0, 0); sh.scrollTop = 0; await Wt(100);
        o.ready = true;
      } catch (e) { o.err.push(e.message + ' ' + (e.stack || '').split('\n')[1]); } return o; }, ST.length);
    if (shot) { await p.screenshot({ path: path.join(shot, 'hub1_research.png') }); await p.evaluate(() => { document.getElementById('sheet').scrollTop = document.querySelector('[data-rhid="W01"]').offsetTop - 60; }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(shot, 'hub1_research_wx.png') }); }
    const r2 = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { err: [] }; const sh = document.getElementById('sheet');
      try {
        // [열기] → 그 화면 · 뒤로 → 연구 모음으로 돌아옴
        const click = async (k) => { const b = sh.querySelector(`[data-rhopen="${k}"]`); if (!b) return 'no-btn'; b.click(); await Wt(700); return null; };
        o.e1 = await click('voice'); o.voice = !!(S.detail && S.detail.voice); history.back(); await Wt(700); o.back1 = !!(S.detail && S.detail.research) && !!sh.querySelector('#rh_list'); o.keep = !!S.rh;
        o.e2 = await click('benchCase'); o.bench = !!(S.detail && S.detail.benchCase); history.back(); await Wt(700);
        o.e3 = await click('cons'); o.psy = !!(S.detail && S.detail.cons); history.back(); await Wt(700); /* (11/11 합침) N05 🧠 소비심리 연구 → 📊 경영 › 🧠 소비심리 화면(cons) */
        o.e4 = await click('pxExp'); o.px = !!(S.detail && S.detail.pxExp !== undefined ? 1 : S.detail); history.back(); await Wt(700);
        // 화면 있는 연구 모두 한 번씩 열어 봄(설정 칸 🌦은 아래에서 따로)
        o.allBad = []; for (const k of [...new Set([...sh.querySelectorAll('[data-rhopen]')].map((b) => b.dataset.rhopen))].filter((k) => k !== 'wx')) { /* (11/11 합침) 연구 줄에 실제로 걸린 열쇠만(쓰지 않는 열쇠는 단추가 없음) */ const pe = (window.__pe = []); const h = (e) => pe.push(String(e.message || e)); window.addEventListener('error', h); const b = sh.querySelector(`[data-rhopen="${k}"]`); if (!b) { o.allBad.push(k + ':단추 없음'); continue; } b.click(); await Wt(600); const moved = !(S.detail && S.detail.research); window.removeEventListener('error', h); if (!moved || pe.length) o.allBad.push(k + (moved ? '' : ':안 열림') + (pe.length ? ':' + pe[0].slice(0, 60) : '')); if (moved) { history.back(); await Wt(600); } if (!(S.detail && S.detail.research)) { o.allBad.push(k + ':못 돌아옴'); while (S.detail) { history.back(); await Wt(400); if (!document.getElementById('sheet').classList.contains('on')) break; } openResearch(); await Wt(800); } }
        o.backOk = !!(S.detail && S.detail.research);
        // 🌦 → ⚙ 설정 › 🌦 기상청 날씨 칸(평균 기온 칸 포함)
        o.e5 = await click('wx'); for (let n = 0; n < 30 && !document.querySelector('#main details[data-sec="set_wx"][open] #wx_box table td'); n++) await Wt(200);
        o.setTab = S.tab; const box = document.querySelector('#main details[data-sec="set_wx"]'); o.setOpen = !!(box && box.open); for (let n = 0; n < 20 && !/7도/.test((document.getElementById('wx_box') || {}).textContent || ''); n++) { await Wt(200); if (typeof wxRedraw === 'function') wxRedraw(); }
        o.setWx = ((document.getElementById('wx_box') || {}).textContent || ''); o.sheetOff = !sh.classList.contains('on'); await Wt(300); o.freed = !S.rh;
        // 🔍 기능 찾기 · 🚪 바로 가기 · 홈 바로가기
        const f = FEAT.find((x) => /🔬 연구 모음/.test(x.t)); await featGo(f); await Wt(600); o.viaFeat = !!(S.detail && S.detail.research); history.back(); await Wt(500);
        GO_PAGES.find((g) => g[0] === 'research')[3](); await Wt(500); o.viaGo = !!(S.detail && S.detail.research); history.back(); await Wt(500);
        S.tab = 'home'; renderTabs(); renderMain(); await Wt(800); const hb = document.querySelector('#main .sc [data-gopage="research"]'); o.homeBtn = !!hb; if (hb) { hb.click(); await Wt(500); o.viaHome = !!(S.detail && S.detail.research); history.back(); await Wt(500); }
        // 🧬 진화 증거 기록이 있을 때(엔진 회차가 올린 꼴 그대로)
        const day = (n) => new Date(Date.now() - n * 864e5).toISOString(); window.__FS.app_settings.research_pulse = { at: day(0), round: 3, studies: { R02: { at: day(0), metric: '검증 AUC', value: 0.762, trend: [[day(2).slice(0, 10), 0.70], [day(1).slice(0, 10), 0.74], [day(0).slice(0, 10), 0.762]], champ: { name: '기준선', v: 0.484 }, chall: { name: '도전자', v: 0.762 }, swapAt: day(1), changed: '도전자 AUC 0.74 → 0.762' }, R06: { at: day(5), metric: '중앙 오차', value: 12, trend: [5] } } };
        openResearch(); for (let n = 0; n < 30 && !sh.querySelector('[data-rhid="R02"] .rh-sp'); n++) await Wt(100);
        const r02 = sh.querySelector('[data-rhid="R02"] .rh-ev'); o.ev1 = r02 ? r02.textContent : ''; o.ev1Pts = sh.querySelectorAll('[data-rhid="R02"] .rh-sp circle').length; o.tag1 = Object.fromEntries([...sh.querySelectorAll('#rh_list .rh-it')].map((x) => [x.dataset.rhid, (x.querySelector('.rh-tag') || {}).dataset ? x.querySelector('.rh-tag').dataset.rhk : '?'])); o.tag1t = ((sh.querySelector('[data-rhid="R06"] .rh-tag') || {}).textContent || '') + ' | ' + ((sh.querySelector('[data-rhid="R02"]') || {}).textContent || '').slice(0, 120);
        o.liveFake1 = [...sh.querySelectorAll('#rh_list .rh-it')].filter((x) => /돌고 있음/.test((x.querySelector('.bc-st') || {}).textContent || '') && !/마지막 셈/.test(x.querySelector('.rh-ev') ? x.querySelector('.rh-ev').textContent : '')).length;
        const r06 = sh.querySelector('[data-rhid="R06"] .rh-ev'); o.ev1Stale = !!(r06 && r06.classList.contains('rh-stale') && /멈춤 5일/.test(r06.textContent) && /점 1개/.test(r06.textContent));
        o.ev1Sum = (sh.querySelector('#rh_ev') || {}).textContent || ''; o.ev1None = /아직 셈 없음/.test((sh.querySelector('[data-rhid="R01"]') || {}).textContent || ''); history.back(); await Wt(500);
        o.writes = (window.__FSW || []).filter((w) => /research|prd_price_actions|shp_cmds|prd_listings|wx_/.test(w.n || '')).length;
      } catch (e) { o.err.push(e.message + ' ' + (e.stack || '').split('\n')[1]); } return o; });
    if (shot) { await p.evaluate(async () => { openResearch(); await new Promise((r) => setTimeout(r, 1200)); const sh = document.getElementById('sheet'); const e = sh.querySelector('#rh_ev'); sh.scrollTop = e ? e.offsetTop - 60 : 0; }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(shot, 'hub1_research_pulse.png') }); await p.evaluate(() => history.back()); await p.waitForTimeout(400); }
    console.log(JSON.stringify(r).slice(0, 1200)); console.log(JSON.stringify(r2).slice(0, 1200));
    const N = ST.length; const nNo = ST.filter((x) => x.noScr).length;
    ok(!r.err.length && !r2.err.length, '시험 중 오류 없음 ' + JSON.stringify([r.err, r2.err]));
    ok(r.go && r.feat && r.scr && r.guide, '🚪 바로 가기 · 🔍 기능 찾기 · 화면 목록 · 화면 설명서에 🔬 연구 모음');
    ok(r.thin, '휴대폰 고르기(경영 탭)에 🔬 카드 항목'); ok(r.bizCard, '경영 탭에 🔬 연구 모음 카드'); ok(r.home && r2.homeBtn && r2.viaHome, '홈 › 바로가기 칸에 🔬 연구 모음 단추 → 열림');
    ok(r.openKeys, '[열기] 화면 열쇠마다 여는 함수가 이 판에 있음');
    ok(r.open && r.nRow === N && r.nOpen === N - nNo && r.nNo === nNo, `연구 ${r.nRow}/${N}줄 · 열기 ${r.nOpen} · 화면 없음 ${r.nNo}/${nNo}`);
    ok(r.hasQ, '줄마다 물음 · 최신 결과 · 마지막 갱신 · 원본 위치');
    ok(/N04/.test(r.noneCard) && /C01/.test(r.noneCard), '② 화면 없는 연구 목록(판매자 가치·시장 구조 연구 등)');
    ok(r.voiceAt, '요약 문서(app_settings/voice_study)의 at이 더 새것이면 마지막 갱신으로');
    ok(r.wxRows === 2 && /서울/.test(r.wx) && /2024-11-11 ~ 2026-11-10/.test(r.wx) && /7도/.test(r.wx) && /5도/.test(r.wx), '🌦 날씨 표 — 지점 둘 · 모은 기간 · 평균 기온(서울 7도 · 수원 5도) ' + r.wx.slice(0, 160));
    ok(r.tags0.length === N && r.tags0.every((k) => k === 'none') && r.liveFake0 === 0 && r.noneOnly === N && r.noLive, `셈 기록이 없으면 모든 줄 ⚪ 아직 셈 없음 · '돌고 있음' 표시 ${r.liveFake0}건 · 거르기 '아직 셈 없음' ${r.noneOnly}/${N}`); ok(r.qN >= 1 && r.qN < N && r.qFocus && r.qBack === N, `찾기 '날씨' → ${r.qN}줄 · 찾기 칸 그대로 · 지우면 다시 전부`);
    ok(!r2.e1 && r2.voice && r2.back1 && r2.keep, '[열기] 🗣 구매평·문의 연구 → 뒤로 → 연구 모음으로 돌아옴(받은 판 쥠)');
    ok(!r2.e2 && r2.bench && !r2.e3 && r2.psy && !r2.e4 && r2.backOk, '[열기] 🏢 성공 사례 견줌 · 🧠 소비심리 화면 · 👀 조회수 → 뒤로 돌아옴');
    ok(!r2.e5 && r2.setTab === 'settings' && r2.setOpen && r2.sheetOff && /평균 기온/.test(r2.setWx) && /7도/.test(r2.setWx), '[열기] 🌦 → ⚙ 설정 › 🌦 기상청 날씨 칸이 열림 · 그 표에도 평균 기온');
    ok(!r2.allBad.length, '화면 있는 연구 [열기] 모두 그 화면이 열리고 뒤로 돌아옴 ' + JSON.stringify(r2.allBad));
    ok(/아직 셈 없음/.test(r.ev0) && /엔진 회차가 안 돌았음/.test(r.ev0) && r.ev0Rows === 2 * N && r.ev0Svg === 0, `🧬 진화 증거 기록이 없으면 '아직 셈 없음 · 엔진 회차가 안 돌았음' 그대로(위 표시·진화 증거 줄 ${r.ev0Rows}/${2 * N} · 그래프 0)`);
    ok(/검증 AUC: 0.762/.test(r2.ev1) && r2.ev1Pts === 3 && /챔피언 기준선 0.484/.test(r2.ev1) && /도전자 도전자 0.762/.test(r2.ev1) && /바뀐 날/.test(r2.ev1) && /이번 회차에 바뀐 것: 도전자 AUC 0.74 → 0.762/.test(r2.ev1), '🧬 기록이 있으면 마지막 셈·핵심 숫자·추세 선(3점)·챔피언/도전자·바뀐 날·이번 회차에 바뀐 것 ' + r2.ev1.slice(0, 200));
    ok(r2.tag1.R02 === 'live' && r2.tag1.R06 === 'stale' && /멈춤 5일/.test(r2.tag1t) && /마지막 셈/.test(r2.tag1t) && Object.entries(r2.tag1).filter(([k]) => !['R02', 'R06'].includes(k)).every(([, v]) => v === 'none') && r2.liveFake1 === 0, `셈 기록대로 위 표시 — R02 🟢 돌고 있음(마지막 셈) · R06 ⏸ 멈춤 5일 · 나머지 ⚪ · 셈 없음인데 돌고 있음 ${r2.liveFake1}건 ` + r2.tag1t.slice(0, 120));
    ok(r2.ev1Stale && /멈춤 1/.test(r2.ev1Sum.replace(/\s+/g, ' ')) && /셈 있는 연구 2/.test(r2.ev1Sum.replace(/\s+/g, ' ')) && r2.ev1None, '🧬 5일 전 셈은 빨강 ⏸ 멈춤 5일 · 요약(셈 있는 연구 2 · 멈춤 1) · 기록 없는 연구는 아직 셈 없음 ' + r2.ev1Sum.slice(0, 160));
    ok(r2.freed, '연구 모음을 닫으면 받은 판을 버림(메모리)');
    ok(r2.viaFeat && r2.viaGo, '🔍 기능 찾기 · 🚪 바로 가기로도 열림');
    ok(r2.writes === 0, '쓰기 0(값·상품·수집 명령·연구 문서)');
    ok(!dlg.length, '브라우저 팝업(alert/confirm/prompt) 없음 ' + JSON.stringify(dlg));
  });
  console.log(bad ? `❌ tHUB1111 실패 ${bad}` : '✓ tHUB1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
