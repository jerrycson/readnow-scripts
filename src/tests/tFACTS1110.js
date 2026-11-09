// tFACTS1110 — (11/10) ① 📚 공식 자료 화면(경영 탭 카드 · 🚪 바로 가기 · 🔍 기능 찾기 · 펼침/접힘 · 찾기 · 출처 링크·등급) ② 📋 확인용 그룹 한 번 만들기(보기 전용 · 감시·자동 반영 꺼짐 · 확정 막힘 · 카드 메모)
// 쓰는 법: RN_PORT=<포트> node tFACTS1110.js  (작업 폴더 pw/ 안 — harness.js·seed.js 옆 · 앱 = <서버>/app/index.html)
// 브라우저 alert/confirm/prompt가 하나라도 뜨면 실패 · 화면 오류(pageerror)는 harness가 ERRORS로 찍음
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const path = require('path'); const fs = require('fs');
(async () => {
  // ── 정적 검사: 공개 저장소에 넣으면 안 되는 것이 없는가 (앱 파일 = 이 폴더 위 app.html 또는 RN_APP)
  { const f = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x)); const t = fs.readFileSync(f, 'utf8');
    const md = JSON.parse(t.match(/const FACTS_MD = ("(?:[^"\\]|\\.)*");/)[1]);
    ok(md.length > 5000 && /§0\./.test(md) && /§7\./.test(md), '공식 자료 글이 들어 있음 (' + md.length + '자)');
    ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(md), '공식 자료에 휴대전화 번호 꼴 없음');
    ok(!/정범|sel2|lead|PLATFORM_PLAN|readnow-chats|이 세션/.test(md), '공식 자료에 사람 이름·내부 계획·대화 흔적 없음');
    ok(!/### 우리 일|### 어디에 반영|\*\*우리 일\*\*/.test(md), '공식 자료에 내부 판단 칸(우리 일·어디에 반영) 없음');
    ok((md.match(/https?:\/\//g) || []).length > 50 && /🟢/.test(md) && /🟡/.test(md) && /⚪/.test(md) && /2026-11-09/.test(md), '출처 링크·등급·확인 날짜가 남아 있음');
    const ck = t.match(/const CHK1109 = '([^']*)';/)[1].split(','); const us = ck.map((x) => x.split(':')[0]);
    ok(ck.length === 630 && new Set(us).size === 630 && us.every((u) => /^U\d{6,}$/.test(u)) && ck.every((x) => x.split(':').length === 5 && x.split(':').slice(1).every((v) => /^\d+$/.test(v))), '확인용 목록 = 매물 U번호 630개 + 숫자만');
    ok(!/CHK1109[^\n]{0,400}(판매자|담합|무리|추격)/.test(t.slice(t.indexOf('const CHK1109'), t.indexOf('const CHK1109') + 200)), '목록 줄에 판매자·연구 낱말 없음'); }
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { err: [] };
      try { // ① 공식 자료
        o.go = GO_PAGES.some((g) => g[0] === 'facts'); o.feat = FEAT.some((f) => /📚 공식 자료/.test(f.t)); o.scr = PG_SCR.some((s) => s[0] === 'facts' && s[3] === 'openFacts');
        S.ordersLoaded = true; S.tab = 'biz'; renderTabs(); renderMain(); await Wt(1500); o.bizCard = !!document.querySelector('#main [data-gopage="facts"], [data-gopage="facts"]');
        S.tab = 'home'; renderTabs(); renderMain(); await Wt(200);
        openFacts(); await Wt(300); const sh = document.getElementById('sheet');
        o.open = sh.classList.contains('on') && !!sh.querySelector('#fx_q'); o.secs = sh.querySelectorAll('#fx_body details.fx-sec').length; o.links = sh.querySelectorAll('#fx_body a[href^="http"][target="_blank"]').length; o.tables = sh.querySelectorAll('#fx_body table.fx-tb').length;
        o.grades = sh.querySelectorAll('#fx_body .fx-g').length; o.openedAtStart = sh.querySelectorAll('#fx_body details.fx-sec[open]').length; o.date = /2026-11-09/.test(sh.textContent);
        sh.querySelector('#fx_close').click(); o.closedAll = sh.querySelectorAll('#fx_body details.fx-sec[open]').length; sh.querySelector('#fx_open').click(); o.openAll = sh.querySelectorAll('#fx_body details.fx-sec[open]').length;
        const q = sh.querySelector('#fx_q'); q.focus(); q.value = '현금영수증'; q.dispatchEvent(new Event('input')); await Wt(400); o.qSecs = sh.querySelectorAll('#fx_body details.fx-sec').length; o.qMark = sh.querySelectorAll('#fx_body mark').length; o.qOpen = [...sh.querySelectorAll('#fx_body details.fx-sec')].every((d) => d.open); o.qFocus = document.activeElement === q; o.qN = sh.querySelector('#fx_n').textContent;
        q.value = '없는낱말zz'; q.dispatchEvent(new Event('input')); await Wt(400); o.qNone = /맞는 칸이 없음/.test(sh.querySelector('#fx_body').textContent);
        q.value = ''; q.dispatchEvent(new Event('input')); await Wt(400); o.qBack = sh.querySelectorAll('#fx_body details.fx-sec').length;
        o.pid = pgdCur && pgdCur(); history.back(); await Wt(300);
        // ② 확인용 그룹 — 한 번만 · 보기 전용
        localStorage.removeItem('rn-chk1109'); const rows = CHK1109.split(',').map((x) => x.split(':')); const u0 = rows[0][0], u1 = rows[1][0];
        [u0, u1].forEach((u, i) => S.plist.set('aladin_' + u, { id: 'aladin_' + u, usedCode: u, listingId: String(500000000 + i), title: '확인 책 ' + i, isbn13: '978890000000' + i, price: +rows[i][2] || 3000, status: '판매중', active: true, grade: '중', registeredAt: '2026-10-01' }));
        o.m1 = await chkSeed(); const G = (window.__FS.prd_price_batches || {})[CHK_G.id] || {}; o.doc = { name: G.name, n: (G.cond || {}).only && G.cond.only.length, critOff: (G.cond || {}).critOff, watch: G.watch || null, viewOnly: G.viewOnly, memoN: Object.keys(G.chkMemo || {}).length, ctrl: (G.cond || {}).ctrlPct, seed: !!(G.seed && G.seed.at) };
        o.off = ((window.__FS.prd_system || {}).pricing || {}).batchOff; o.flag = localStorage.getItem('rn-chk1109');
        localStorage.removeItem('rn-chk1109'); const nm0 = G.createdAt; o.m2 = await chkSeed(); o.same = ((window.__FS.prd_price_batches || {})[CHK_G.id] || {}).createdAt === nm0;
        S.prBatches = undefined; await openBatchGroup(CHK_G.id); await Wt(1500); o.vo = !!(S.batchMeta && S.batchMeta.viewOnly); o.banner = /보기 전용 그룹/.test(sh.textContent); o.fix = /확인용 목록\(11\/09\)/.test(sh.textContent);
        const l0 = S.plist.get('aladin_' + u0); const cell = (k, v) => `<span class="bqi-c"><i>${k}</i>${v}</span>`; o.memo = bqMemoHtml(l0, cell); o.memoCard = sh.querySelectorAll('.bqi-memo').length;
        const before = JSON.stringify([...S.plist.values()].map((l) => l.price)); const W0 = (window.__FSW || []).length; o.pricesSame = before === JSON.stringify([...S.plist.values()].map((l) => l.price));
        o.actW = (window.__FSW || []).slice(W0).filter((w) => /prd_price_actions|shp_cmds/.test(w.n)).length; history.back(); await Wt(300);
      } catch (e) { o.err.push(e.message + ' ' + (e.stack || '').split('\n')[1]); } return o; });
    console.log(JSON.stringify(r).slice(0, 1500));
    ok(!r.err.length, '시험 중 오류 없음 ' + JSON.stringify(r.err));
    ok(r.go && r.feat && r.scr, '🚪 바로 가기 · 🔍 기능 찾기 · 화면 설명서 목록에 📚 공식 자료');
    ok(r.bizCard, '경영 탭에 📚 공식 자료 카드');
    ok(r.open && r.secs >= 8 && r.links > 50 && r.tables >= 1 && r.grades >= 5 && r.date, `화면이 열리고 칸 ${r.secs}개 · 링크 ${r.links}개 · 표 ${r.tables}개 · 등급 표시 ${r.grades}개 · 확인 날짜`);
    ok(r.openedAtStart >= 1 && r.openedAtStart < r.secs && r.closedAll === 0 && r.openAll === r.secs, '처음엔 앞 칸만 펼침 · 모두 접기/펼치기');
    ok(r.qSecs >= 2 && r.qSecs < r.secs && r.qMark > 3 && r.qOpen && r.qFocus && /맞는 칸/.test(r.qN), `찾기 '현금영수증' → 칸 ${r.qSecs}개 · 표시 ${r.qMark}곳 · 펼쳐짐 · 찾기 칸 그대로`);
    ok(r.qNone && r.qBack === r.secs, '없는 낱말은 안내 · 지우면 다시 전부');
    ok(r.m1 === true && r.doc.name === '📋 확인용 630권(11/09)' && r.doc.n === 630 && r.doc.critOff === true && !r.doc.watch && r.doc.viewOnly === true && r.doc.memoN === 630 && r.doc.ctrl === 0 && r.doc.seed, '그룹 하나 만듦 — 630권 고정 · 추천가 판정 꺼짐 · 감시 없음 · 비교군 0 · 보기 전용 · 메모 630 · 만든 기록 ' + JSON.stringify(r.doc));
    ok(r.off && r.off.b_chk1109 === true && r.flag === '1', '가격 감시기 쪽에서도 이 그룹 끔(batchOff) · 이 기기 다시 안 봄');
    ok(r.m2 === false && r.same, '이미 있으면 다시 안 만듦');
    ok(r.vo && r.banner && r.fix, '그룹을 열면 📋 보기 전용 띠 · 대상 고정 이름');
    ok(/📋 참고값/.test(r.memo) && /차이/.test(r.memo) && /가게/.test(r.memo) && /등록 3개월/.test(r.memo), '카드 메모: 참고값·차이·가게 수·등록 3개월 ' + (r.memoCard ? `(화면 카드 ${r.memoCard}장)` : '(화면 카드는 결과 계산 뒤)'));
    ok(r.pricesSame && r.actW === 0, '값을 바꾸지 않음 — 가격 반영·수집 명령 쓰기 0');
    ok(!dlg.length, '브라우저 팝업(alert/confirm/prompt) 없음 ' + JSON.stringify(dlg));
  });
  console.log(bad ? `❌ tFACTS1110 실패 ${bad}` : '✓ tFACTS1110 모두 통과'); process.exit(bad ? 1 : 0);
})();
