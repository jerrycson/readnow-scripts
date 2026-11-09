// tINFO1110 — (11/10) 📚 공식 자료 모음: 자료마다 탭(📌 판매처 확장 사실 · ⚖ 중고책·도서정가제 · 📜 예스24 이용약관 · 🏷 예스24 중고샵 판매 가이드 · 🧠 소비심리 연구) · 따로 둔 글 파일은 열 때만 받음 · 찾기는 다른 자료에서도 맞는 칸을 알려 줌 · 🔍 기능 찾기 자료마다 · 📜 알라딘 규약 오가기
// 쓰는 법: RN_PORT=<포트> node tINFO1110.js  (작업 폴더 pw/ 안 — harness.js·seed.js 옆 · 앱 = <서버>/app/index.html · <서버>/yes24-terms/·facts-docs/ 도 있어야 함)
// 브라우저 alert/confirm/prompt가 하나라도 뜨면 실패 · 화면 오류(pageerror)는 harness가 ERRORS로 찍음
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const path = require('path'); const fs = require('fs');
(async () => {
  // ── 정적 검사: 공개 저장소에 넣으면 안 되는 것이 없는가
  { const f = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x)); const t = fs.readFileSync(f, 'utf8');
    const md = JSON.parse(t.match(/const FACTS_USED_MD = ("(?:[^"\\]|\\.)*");/)[1]);
    ok(md.length > 4000 && /최종소비자에게 판매되었던 간행물로서 다시 판매하는 중고 간행물/.test(md) && /lsiSeq=277835/.test(md) && /lsiSeq=276403/.test(md), '중고책 자료에 시행령 제15조⑥4 원문·법령 링크 (' + md.length + '자)');
    ok(/300만 원/.test(md) && /400만 원/.test(md) && /500만 원/.test(md) && /2019마5464/.test(md) && /pSeq=13874/.test(md), '과태료 1·2·3차 · 대법원 결정 · 문화체육관광부 Q&A 출처');
    ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(md) && !/\d{2,4}-\d{3,4}-\d{4}/.test(md), '중고책 자료에 전화번호 꼴 없음');
    ok(!/정범|sel2|lead|PLATFORM_PLAN|readnow-chats|이 세션|우리 일|어디에 반영/.test(md), '중고책 자료에 사람 이름·내부 계획·대화 흔적 없음');
    const root = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..', '..', 'readnow-scripts'), path.resolve(__dirname, '..')].find((x) => fs.existsSync(path.join(x, 'yes24-terms', 'service.txt')));
    ok(!!root, 'yes24-terms/ 폴더가 있음');
    if (root) { const sv = fs.readFileSync(path.join(root, 'yes24-terms', 'service.txt'), 'utf8'); const gd = fs.readFileSync(path.join(root, 'yes24-terms', 'used-seller-guide.txt'), 'utf8'); const ix = JSON.parse(fs.readFileSync(path.join(root, 'yes24-terms', 'index.json'), 'utf8'));
      ok(/^# 📜 예스24 서비스 이용약관/.test(sv) && (sv.match(/^### 제\d+조/gm) || []).length >= 40 && /본 약관은 2026년 5월 1일부터 시행합니다/.test(sv), '예스24 이용약관 — 조 40개 넘음 · 시행일 줄');
      ok(!/(\d{2,4}-\d{3,4}-\d{4})/.test(sv + gd) && !/대표 *:|Copyright|채팅상담|최근 본 상품/.test(sv + gd), '예스24 글에 전화번호·회사 정보 줄·화면 꾸밈 없음');
      ok(!/작업 기록|🛰|리드나우|수집기/.test(gd) && /상품 상태, 중고가 판매가, 재고수량은 필수 입력/.test(gd), '판매 가이드에 우리 도구 글이 섞이지 않음');
      ok(ix.docs.length === 2 && ix.docs.every((d) => fs.existsSync(path.join(root, 'yes24-terms', d.file))), 'index.json의 파일이 모두 있음'); }
    ok(/'yes24-terms', true/.test(fs.readFileSync(path.join(root || '.', 'hosting', 'build.js'), 'utf8')) && /\['yes24-terms', null\]/.test(fs.readFileSync(path.join(root || '.', 'src', 'release.js'), 'utf8')), 'Hosting 결과물·release 복사 목록에 yes24-terms');
    // (11/10) 🧠 소비심리 연구 — 공개 학술·통계 요약만(우리 판매 숫자·내부 해석·사람 이름 없음)
    { const pf = path.join(root || '.', 'facts-docs', 'consumer-psych.txt'); ok(fs.existsSync(pf), 'facts-docs/consumer-psych.txt가 있음');
      if (fs.existsSync(pf)) { const ps = fs.readFileSync(pf, 'utf8'); const nG = (ps.match(/🟢/g) || []).length, nY = (ps.match(/🟡/g) || []).length;
        ok(/^# 🧠 소비심리 연구/.test(ps) && (ps.match(/^## /gm) || []).length >= 6 && nG >= 15 && nY >= 10, `소비심리 글 — 칸 ${(ps.match(/^## /gm) || []).length}개 · 🟢 ${nG} · 🟡 ${nY}`);
        ok(/Ghose/.test(ps) && /Stephens/.test(ps) && /한국은행/.test(ps) && /출판유통통합전산망/.test(ps) && /국민 독서실태조사/.test(ps) && /불법/.test(ps), '소비심리 글 — 핵심 출처(중고책 대체·월급·한국은행·전산망·독서실태) · 불법 표시');
        ok(!/정범|readnow-chats|리드나우|북스킹|수집기|이 세션|우리 판매|우리 장부|우리 주문|\d{1,3},\d{3}원\/일|권수\/일/.test(ps) && !/01[016789]-?\d{3,4}-?\d{4}/.test(ps), '소비심리 글에 사람 이름·내부 도구·우리 판매 숫자 없음'); }
      ok(/\['facts-docs', true\]/.test(fs.readFileSync(path.join(root || '.', 'hosting', 'build.js'), 'utf8')) && /\['facts-docs', null\]/.test(fs.readFileSync(path.join(root || '.', 'src', 'release.js'), 'utf8')), 'Hosting 결과물·release 복사 목록에 facts-docs'); } }
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => { const Wt = (ms) => new Promise((r) => setTimeout(r, ms)); const o = { err: [] }; const sh = document.getElementById('sheet');
      const until = async (f, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return true; await Wt(100); } return false; };
      try {
        o.docs = FACTS_DOCS.map((d) => d.k).join(','); o.feat = FACTS_DOCS.slice(1).every((d) => FEAT.some((f) => f.t.includes(d.t) && f.go && typeof f.go.fn === 'function'));
        openFacts(); await Wt(300); o.tabs = sh.querySelectorAll('#fx_tabs .fx-tab').length; o.on0 = (sh.querySelector('#fx_tabs .fx-tab.on') || {}).dataset?.fxdoc; o.al = !!sh.querySelector('#fx_al'); o.secsExt = sh.querySelectorAll('#fx_body details.fx-sec').length;
        o.y24notYet = S.fx.txt.y24 == null; // 따로 둔 글은 아직 안 받음
        // ⚖ 중고책 탭
        sh.querySelector('[data-fxdoc="used"]').click(); await Wt(200); o.on1 = (sh.querySelector('#fx_tabs .fx-tab.on') || {}).dataset?.fxdoc; o.secsUsed = sh.querySelectorAll('#fx_body details.fx-sec').length; o.usedTxt = /최종소비자에게 판매되었던/.test(sh.querySelector('#fx_body').textContent); o.usedTbl = sh.querySelectorAll('#fx_body table.fx-tb').length; o.usedDd = /기간 기준 없음/.test(sh.querySelector('#fx_dd').textContent);
        sh.querySelector('#fx_close').click(); o.closed = sh.querySelectorAll('#fx_body details.fx-sec[open]').length;
        // 📜 예스24 이용약관 탭 — 처음 누를 때 글 파일을 받음
        sh.querySelector('[data-fxdoc="y24"]').click(); o.loading = /받는 중/.test(sh.querySelector('#fx_body').textContent) || S.fx.txt.y24 != null;
        o.y24ok = await until(() => sh.querySelectorAll('#fx_body details.fx-sec').length >= 12); o.secsY24 = sh.querySelectorAll('#fx_body details.fx-sec').length; o.y24art = /제14조\(반품, 교환, 환불, 취소\)/.test(sh.querySelector('#fx_body').textContent);
        // 탭을 오가도 접힘 상태는 자료마다 따로
        sh.querySelector('[data-fxdoc="used"]').click(); await Wt(150); o.usedStillClosed = sh.querySelectorAll('#fx_body details.fx-sec[open]').length === 0;
        sh.querySelector('[data-fxdoc="y24g"]').click(); o.y24gok = await until(() => /재고수량은 필수 입력/.test(sh.querySelector('#fx_body').textContent));
        // 🧠 소비심리 연구 탭 — 열 때 받음 · 칸·표 · 출처 링크
        o.psyNotYet = S.fx.txt.psy == null; sh.querySelector('[data-fxdoc="psy"]').click(); o.psyok = await until(() => sh.querySelectorAll('#fx_body details.fx-sec').length >= 6 && /Ghose/.test(sh.querySelector('#fx_body').textContent)); o.secsPsy = sh.querySelectorAll('#fx_body details.fx-sec').length; o.psyTbl = sh.querySelectorAll('#fx_body table.fx-tb').length; o.psyBad = /undefined|NaN/.test(sh.querySelector('#fx_body').textContent);
        // 찾기: 첫 자료에서 '청약철회' → 다른 자료(예스24 약관)에도 맞음 단추
        sh.querySelector('[data-fxdoc="ext"]').click(); await Wt(150); const q = sh.querySelector('#fx_q'); q.focus(); q.value = '청약철회'; q.dispatchEvent(new Event('input')); await Wt(500);
        o.other = !!sh.querySelector('.fx-other [data-fxdoc="y24"]'); o.otherTxt = (sh.querySelector('.fx-other') || {}).textContent || ''; o.qFocus = document.activeElement === q;
        sh.querySelector('.fx-other [data-fxdoc="y24"]').click(); await Wt(300); o.on2 = (sh.querySelector('#fx_tabs .fx-tab.on') || {}).dataset?.fxdoc; o.mark = sh.querySelectorAll('#fx_body mark').length; o.qKeep = sh.querySelector('#fx_q').value === '청약철회'; o.n = sh.querySelector('#fx_n').textContent;
        q.value = '중고 간행물'; q.dispatchEvent(new Event('input')); await Wt(400); o.usedHint = !!sh.querySelector('.fx-other [data-fxdoc="used"]');
        q.value = '월급'; q.dispatchEvent(new Event('input')); await Wt(400); o.psyHint = !!sh.querySelector('.fx-other [data-fxdoc="psy"]');
        q.value = ''; q.dispatchEvent(new Event('input')); await Wt(300); o.noOther = !sh.querySelector('.fx-other');
        // 받지 못한 글 — 안내만(팝업 없음)
        FACTS_DOCS.push({ k: 'zz', t: '🧪 없는 자료', d: '시험', url: '../yes24-terms/없는파일.txt' }); fxSetDoc('zz'); o.errOk = await until(() => /글을 받지 못함/.test(sh.querySelector('#fx_body').textContent)); o.tabsZ = sh.querySelectorAll('#fx_tabs .fx-tab').length; FACTS_DOCS.pop(); fxSetDoc('ext'); await Wt(150);
        // 📜 알라딘 규약으로 갔다가 뒤로 → 공식 자료로 돌아옴
        sh.querySelector('#fx_al').click(); await Wt(500); o.alOpen = !!(S.detail && S.detail.alterms); history.back(); await Wt(500); o.back = !!(S.detail && S.detail.facts) && !!sh.querySelector('#fx_tabs');
        history.back(); await Wt(300); o.closedSheet = !S.detail;
        // 🔍 기능 찾기 줄로 바로 그 탭
        const fu = FEAT.find((f) => /⚖ 중고책/.test(f.t)); fu.go.fn(); await Wt(300); o.featTab = (sh.querySelector('#fx_tabs .fx-tab.on') || {}).dataset?.fxdoc; o.featW = fu.w; history.back(); await Wt(300);
        o.idx = (typeof featFind === 'function') ? featFind('예스24 이용약관').slice(0, 5).map((f) => f.t.slice(0, 30)) : null;
        o.idxPsy = (typeof featFind === 'function') ? featFind('소비심리').slice(0, 5).map((f) => f.t.slice(0, 30)) : null;
        const fp = FEAT.find((f) => /🧠 소비심리 연구/.test(f.t)); if (fp) { fp.go.fn(); await Wt(300); o.featPsy = (sh.querySelector('#fx_tabs .fx-tab.on') || {}).dataset?.fxdoc; history.back(); await Wt(300); }
      } catch (e) { o.err.push(e.message + ' ' + (e.stack || '').split('\n')[1]); } return o; });
    console.log(JSON.stringify(r).slice(0, 1800));
    ok(!r.err.length, '시험 중 오류 없음 ' + JSON.stringify(r.err));
    ok(r.docs === 'ext,used,y24,y24g,psy' && r.feat, '자료 5개 · 🔍 기능 찾기에 자료마다 한 줄');
    ok(r.tabs === 5 && r.on0 === 'ext' && r.al && r.secsExt >= 8 && r.y24notYet, `탭 ${r.tabs}개 · 처음은 📌 판매처 확장 사실(칸 ${r.secsExt}개) · 📜 알라딘 규약 단추 · 예스24 글은 아직 안 받음`);
    ok(r.on1 === 'used' && r.secsUsed >= 5 && r.usedTxt && r.usedTbl >= 2 && r.usedDd, `⚖ 중고책 탭 — 칸 ${r.secsUsed}개 · 표 ${r.usedTbl}개 · 시행령 문구 · 설명 줄`);
    ok(r.closed === 0 && r.usedStillClosed, '모두 접기 · 탭을 오가도 자료마다 접힘 그대로');
    ok(r.loading && r.y24ok && r.secsY24 >= 12 && r.y24art, `📜 예스24 이용약관 — 열 때 받음 · 장 ${r.secsY24}개 · 제14조`);
    ok(r.y24gok, '🏷 예스24 중고샵 판매 가이드 열림');
    ok(r.psyNotYet && r.psyok && r.secsPsy >= 6 && r.psyTbl >= 2 && !r.psyBad, `🧠 소비심리 연구 — 열 때 받음 · 칸 ${r.secsPsy}개 · 표 ${r.psyTbl}개`);
    ok(r.psyHint, "찾기 '월급' → 🧠 소비심리 연구 자료를 알려 줌");
    ok(r.featPsy === 'psy' && (!r.idxPsy || r.idxPsy.some((t) => /소비심리/.test(t))), '🔍 기능 찾기 소비심리 → 그 탭으로 바로 ' + JSON.stringify(r.idxPsy));
    ok(r.other && /예스24/.test(r.otherTxt) && r.qFocus, "찾기 '청약철회' → 다른 자료에서도 맞음(예스24 이용약관) 단추 · 찾기 칸 그대로");
    ok(r.on2 === 'y24' && r.mark > 0 && r.qKeep && /맞는 칸/.test(r.n), `단추를 누르면 그 자료로 · 표시 ${r.mark}곳 · 찾기 낱말 유지`);
    ok(r.usedHint && r.noOther, "'중고 간행물' → ⚖ 중고책 자료를 알려 줌 · 지우면 안내 사라짐");
    ok(r.errOk && r.tabsZ === 6, '글을 받지 못하면 안내만(자료 줄을 더하면 탭이 저절로 생김)');
    ok(r.alOpen && r.back && r.closedSheet, '📜 알라딘 규약으로 갔다가 뒤로 → 공식 자료 · 한 번 더 뒤로 → 닫힘');
    ok(r.featTab === 'used' && /⚖ 중고책/.test(r.featW), '🔍 기능 찾기 줄 → 그 탭으로 바로');
    ok(!r.idx || r.idx.some((t) => /예스24/.test(t)), "🔍 기능 찾기 '예스24 이용약관' 낱말로 찾아짐 " + JSON.stringify(r.idx));
    ok(!dlg.length, '브라우저 팝업(alert/confirm/prompt) 없음 ' + JSON.stringify(dlg));
  });
  console.log(bad ? `❌ tINFO1110 실패 ${bad}` : '✓ tINFO1110 모두 통과'); process.exit(bad ? 1 : 0);
})();
