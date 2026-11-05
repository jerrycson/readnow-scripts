// tSHP2 — 정범님 11/05 출고 화면 네 가지
//  ① '매번 뜨는 하얀 창'(매물 1 — 아직 모으지 않은 매물입니다): 출고 머리(.shp-head)의 표시 data-pcq="1"에 마우스가 올라도 열리지 않음 · ? 칩(.pc2-q)에 올리거나 누를 때만 · 바깥을 누르면 닫힘 · 사라진 칩으로는 안 열림
//  ② 📤 발송준비시작·🚚 원스톱 진행 카드: 문제없이 끝나면 60초(설정) 뒤 저절로 숨김 · 실패 섞이면 숨기지 않음 · 숨긴 줄 보기로 다시 · 여러 진행 동시 · 0건 · 새로고침(다시 그림) 뒤에도 같음
//  ③ 총 주문 건수·매출(shp-sum) 맨 위 · ↕ 칸 순서(▲▼·끌기·처음대로) · 이 기기에 기억 · 다시 열어도 그 차례
//  ④ 알라딘 팔기 결과 기다리는 접수 상세 한 번에 최대 80건(수집기 bbWaitMax 기본·상한) — 원본 글로 확인
// 시험 자료 손님은 '손님A' · 010-0000-0000 (공개 저장소)
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const fs = require('fs'); const path = require('path');
{ const cands = [path.join(__dirname, '..', 'readnow-collector.user.js'), path.join(__dirname, '..', 'readnow-collector.src.js')]; const f = cands.find((x) => fs.existsSync(x)); const src = f ? fs.readFileSync(f, 'utf8') : '';
  const hd = src.slice(0, src.indexOf('==/UserScript==')); ok(!!src && /bbWaitMax: 80\b/.test(src.slice(hd.length)), '④ 수집기 기본값 bbWaitMax 80');
  ok(/Math\.max\(1, Math\.min\(80, \+SET\.bbWaitMax \|\| 80\)\)/.test(src), '④ 결과 기다리는 접수 상세 — 한 번에 최대 80건(설정해도 80 넘지 않음)'); }
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js'));
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; await W(1500); const sh = () => document.getElementById('sheet'); const now = () => new Date().toISOString(); const ago = (s) => new Date(Date.now() - s * 1e3).toISOString();
    window.ask = async () => true; S.user = S.user || { email: 'tester@x' }; S.prodLoaded = true; try { localStorage.removeItem('rn-ship-secord'); localStorage.removeItem('rn-shl-hide'); localStorage.removeItem('rn-ship-pcnote'); } catch (e) {}
    const it = (t, p, lid) => ({ listingId: lid, title: t, price: p, qty: 1, sku: 'PNK_ms', grade: '상' });
    S.shipC = { orders: [{ orderNo: 'A-1', buyer: '손님A', orderedAt: '2026-11-05 09:00', items: [it('확인 책 하나', 5000, '404935000')] }], at: now(), enrich: {} }; S.shipCFromCache = false;
    S.ship = { orders: [{ orderNo: 'D-1', buyer: '손님A', orderedAt: '2026-11-04 10:00', recipient: { name: '손님A' }, items: [it('준비 책', 7000, '404935002')] }], tabCounts: {}, at: now() }; S._shipLive = 1;
    await db.collection('shp_state').doc('confirm').set(JSON.parse(JSON.stringify(S.shipC))); await db.collection('shp_state').doc('current').set(JSON.parse(JSON.stringify(S.ship)));
    S.shipTab = 'confirm'; S.shipSrc = 'all'; await openShip(); await W(600);

    // ① 하얀 창
    const hd = sh().querySelector('.shp-head'); o.headPcq = !!(hd && hd.hasAttribute('data-pcq'));
    document.querySelectorAll('.uipop').forEach((x) => x.remove());
    hd.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await W(500); o.popHead = document.querySelectorAll('.uipop').length;
    hd.dispatchEvent(new MouseEvent('click', { bubbles: true })); await W(300); o.popHeadClick = document.querySelectorAll('.uipop').length;
    await showUsedInfo('1', hd); await W(100); o.popDirect = document.querySelectorAll('.uipop').length;
    const gone = document.createElement('span'); gone.className = 'pc2-q'; gone.dataset.pcq = '404935000'; await showUsedInfo('404935000', gone); o.popGone = document.querySelectorAll('.uipop').length; /* 화면에 없는 칩 */
    const chip = document.createElement('span'); chip.className = 'pc2-q'; chip.dataset.pcq = '404935000'; chip.textContent = '?'; const wrap = document.createElement('div'); wrap.className = 'prow2'; wrap.style.cssText = 'position:fixed;top:120px;left:40px;z-index:99999'; wrap.appendChild(chip); document.body.appendChild(wrap);
    S.uinfo = S.uinfo || new Map(); S.uinfo.delete('404935000'); let tl = []; const t0 = window.toast; window.toast = (m) => { tl.push(String(m)); };
    chip.click(); await W(400); o.popEmpty = document.querySelectorAll('.uipop').length; o.toastEmpty = tl.join('|'); /* 모으지 않은 매물 — 창 없이 한 줄 */
    S.uinfo.set('404935000', { note: '', photos: [] }); tl = []; chip.click(); await W(300); o.popNoNote = document.querySelectorAll('.uipop').length; o.toastNoNote = tl.join('|'); window.toast = t0;
    window.__rnScrOpenAt = performance.now(); chip.classList.add('on'); chip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await W(400); o.popHoverFresh = document.querySelectorAll('.uipop').length; /* 화면을 막 연 1초 안 */
    window.__rnScrOpenAt = 0; chip.classList.remove('on'); chip._t = null; chip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await W(400); o.popHoverOff = document.querySelectorAll('.uipop').length; /* 유의 사항 없는 칩(.on 없음) */
    S.uinfo.set('404935000', { note: '책등 낡음 — 시험 글', photos: [], checkedAt: now() });
    chip.click(); await W(400); o.popChip = document.querySelectorAll('.uipop').length; const pp = document.querySelector('.uipop'); o.popPos = pp ? Math.round(pp.getBoundingClientRect().top) : -1; o.chipBottom = Math.round(chip.getBoundingClientRect().bottom);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true })); await W(150); o.popOutside = document.querySelectorAll('.uipop').length; wrap.remove();

    // ② 진행 카드 저절로 숨김
    const cmd = (id, x) => db.collection('shp_cmds').doc(id).set({ type: 'startDelivery', createdAt: ago(200), by: 'tester@x', ...x });
    o.cfgDef = shlCfg().sdsHideSec;
    await cmd('sdOld', { orderNos: ['A-7'], status: 'done', doneAt: ago(90), claim: { pc: 'cloud' }, results: { 'A-7': { state: 'done' } }, stepNow: { at: ago(90), lv: 'ok', m: '모두 넘어감' } }); /* 끝나고 90초 — 숨김 */
    await cmd('sdNew', { orderNos: ['A-8'], status: 'done', doneAt: ago(20), claim: { pc: 'cloud' }, results: { 'A-8': { state: 'done' } }, stepNow: { at: ago(20), lv: 'ok', m: '모두 넘어감' } }); /* 끝나고 20초 — 아직 보임 */
    await cmd('sdMix', { orderNos: ['A-5', 'A-6'], status: 'done', doneAt: ago(300), claim: { pc: 'cloud' }, results: { 'A-5': { state: 'done' }, 'A-6': { state: 'fail', err: '알라딘 안내 글' } }, stepNow: { at: ago(300), lv: 'info', m: '끝' } }); /* 실패 섞임 — 남김 */
    await cmd('sdRun', { orderNos: ['A-4'], status: 'running', claim: { pc: 'cloud' }, results: {}, stepNow: { at: ago(5), lv: 'info', m: '넣는 중' } }); /* 하는 중 — 남김 */
    await db.collection('shp_cmds').doc('rdOld').set({ type: 'read', status: 'done', createdAt: ago(200), doneAt: ago(90), label: '다시 읽기', stepNow: { at: ago(90), lv: 'ok', m: '끝' } }); /* 다른 종류 — 10분 규칙 그대로(아직 보임) */
    await W(800); S.shlShowHid = false; const rows = () => shipLiveRows(); const R0 = rows(); const g = (id) => R0.find((r) => r.id === 'cmd:' + id) || {};
    o.ah = { old: !!g('sdOld').ahid, nw: !!g('sdNew').ahid, mix: !!g('sdMix').ahid, run: !!g('sdRun').ahid, rd: !!g('rdOld').ahid, has: ['sdOld', 'sdNew', 'sdMix', 'sdRun', 'rdOld'].map((k) => !!R0.find((r) => r.id === 'cmd:' + k)).join(',') };
    const lvH = () => (document.getElementById('shp_live') || {}).innerHTML || ''; shipLivePaint(); await W(200); o.liveShown = { old: /sdOld/.test(lvH()), nw: /sdNew/.test(lvH()), mix: /sdMix/.test(lvH()) };
    o.hidBtn = /숨긴 줄/.test(lvH()); S.shlShowHid = true; shipLivePaint(); await W(150); o.hidShow = /sdOld/.test(lvH()); S.shlShowHid = false;
    S.app.stepLog = { ...(S.app.stepLog || {}), sdsHideSec: 10 }; o.ah10 = !!shipLiveRows().find((r) => r.id === 'cmd:sdNew').ahid; /* 10초로 줄이면 20초 지난 것도 숨김 */
    S.app.stepLog = { ...(S.app.stepLog || {}), sdsHideSec: 0 }; o.ah0 = !!shipLiveRows().find((r) => r.id === 'cmd:sdOld').ahid; /* 0 = 10분 규칙 → 90초는 아직 보임 */
    delete S.app.stepLog.sdsHideSec; openShip(); await W(400); o.afterRedraw = !!shipLiveRows().find((r) => r.id === 'cmd:sdOld').ahid; /* 다시 그려도(새로고침과 같은 판단 — 끝난 시각 기준) */
    // 원스톱 카드
    S.os = S.os || {}; S.os.doc = { id: 'osT', status: 'done', ph: 'done', createdAt: ago(400), doneAt: ago(90), upd: ago(90), bt: [{ n: 1, al: ['D-1'], done: 1 }], sum: { batches: 1, al: 1, y24: 0, cash: 0, rows: 1, boxes: 1, printed: 1, min: 3 }, stepNow: { at: ago(90), lv: 'ok', m: '끝' }, log: [], warn: [] };
    o.osHid = /진행 보기/.test(shipOneShotHtml()); o.osRow = !!shlAutoHid(shlRowOs(S.os.doc));
    S.os.doc = { ...S.os.doc, warn: [{ m: '예스24 한 건 확인' }] }; o.osWarn = /진행 보기/.test(shipOneShotHtml());
    S.os.doc = { ...S.os.doc, warn: [], doneAt: ago(10), upd: ago(10), stepNow: { at: ago(10), lv: 'ok', m: '끝' } }; o.osFresh = /진행 보기/.test(shipOneShotHtml());
    S.os.doc = { ...S.os.doc, doneAt: ago(90), upd: ago(90), stepNow: { at: ago(90), lv: 'ok', m: '끝' } }; S.osShowDone = 'osT'; o.osShow = /진행 보기/.test(shipOneShotHtml()); S.osShowDone = null; S.os.doc = null;
    // 0건: 맡긴 일 없음
    const keep = S.shipCmds; S.shipCmds = []; S._cmdSrc = null; try { o.zero = shipLiveRows().filter((r) => String(r.id).startsWith('cmd:')).length; } catch (e) { o.zero = 'err ' + e.message; } S.shipCmds = keep;

    // ③ 칸 순서
    openShip(); await W(400); const secIds = () => [...sh().querySelectorAll('[id^="shs_"]')].filter((x) => x.id !== 'shs_ed').map((x) => x.id.slice(4)).join(','); o.def = secIds();
    const sumEl = sh().querySelector('.shp-sum'), oneEl = sh().querySelector('#shp_one'); o.sumTop = !!sumEl && !!oneEl && sumEl.getBoundingClientRect().top < oneEl.getBoundingClientRect().top;
    o.oneInHead2 = !!(sh().querySelector('#shp_oneshot') || { closest: () => null }).closest('.shp-head2');
    sh().querySelector('#shp_secord').click(); await W(400); o.edOpen = !!sh().querySelector('#shs_ed'); o.edRows = sh().querySelectorAll('.shs-row').length;
    sh().querySelector('[data-shsmv="live:-1"]').click(); await W(400); o.mv1 = secIds(); o.saved = localStorage.getItem('rn-ship-secord');
    sh().querySelector('[data-shsmv="list:-1"]').click(); await W(400); o.mv2 = secIds(); /* 목록을 처리 단추 위로 → 처리 단추는 목록 아래 */
    o.actAfterList = (() => { const a = sh().querySelector('#shs_act'); const l = sh().querySelector('section.shp-o'); return !!a && !!l && (l.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; })();
    // 끌어 놓기: one을 sum 위로
    { const src = sh().querySelector('.shs-row[data-shsk="one"]'), dst = sh().querySelector('.shs-row[data-shsk="sum"]'); const dt = new DataTransfer(); src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt })); dst.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); dst.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })); src.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt })); await W(400); }
    o.drag = JSON.parse(localStorage.getItem('rn-ship-secord') || '[]').slice(0, 2).join(',');
    // 다시 열어도 같은 차례 · 다른 단계 칸(빈 칸은 안 그림)
    S.shipSecEd = false; S.shipTab = 'deliv'; openShip(); await W(400); o.deliv = secIds(); S.shipTab = 'confirm'; openShip(); await W(300); o.again = secIds();
    // 잘못된 저장값 → 기본 차례로 고쳐 읽음
    localStorage.setItem('rn-ship-secord', '["zz","live","live"]'); o.fix = shipSecOrd().join(','); localStorage.setItem('rn-ship-secord', '{나쁨'); o.fix2 = shipSecOrd().join(',');
    localStorage.setItem('rn-ship-secord', '["live","sum"]'); S.shipSecEd = true; openShip(); await W(300); const rb = sh().querySelector('[data-shsreset]'); o.resetDis = rb ? rb.disabled : 'none'; rb && rb.click(); await W(400); o.reset = localStorage.getItem('rn-ship-secord'); o.afterReset = secIds();
    sh().querySelector('#shs_ed [data-shsed]').click(); await W(300); o.edClosed = !sh().querySelector('#shs_ed');
    // 360px 폭에서 가로 넘침 없음
    o.ovf = sh().scrollWidth - sh().clientWidth;
    return o; });
  console.log(JSON.stringify(R));
  console.log('① 하얀 창');
  ok(R.headPcq, '출고 머리에 PC 알림 숨김 표시(data-pcq)는 그대로');
  ok(R.popHead === 0 && R.popHeadClick === 0, '머리 위에 마우스를 올리거나 눌러도 유의 사항 상자가 안 뜸');
  ok(R.popDirect === 0, "출고 머리를 앵커로 한 '매물 1'은 열지 않음");
  ok(R.popGone === 0, '화면에서 사라진 칩으로는 열지 않음(왼쪽 위 상자 안 뜸)');
  ok(R.popEmpty === 0 && /모으지 않은/.test(R.toastEmpty), '모으지 않은 매물은 창 없이 짧은 한 줄(누른 때)');
  ok(R.popNoNote === 0 && /없음/.test(R.toastNoNote), '유의 사항 글·사진이 없으면 창 안 띄움');
  ok(R.popHoverFresh === 0, '화면을 막 연 1초 안에는 마우스 올림으로 안 열림');
  ok(R.popHoverOff === 0, '유의 사항 없는 칩(.on 없음)에 올려도 안 열림');
  ok(R.popChip === 1 && R.popPos >= R.chipBottom - 1, '유의 사항이 있는 ? 칩을 누르면 칩 바로 아래에 뜸');
  ok(R.popOutside === 0, '바깥을 누르면 닫힘');
  console.log('② 진행 카드 숨김');
  ok(R.cfgDef === 60, '기본 60초');
  ok(R.ah.has === 'true,true,true,true,true', '다섯 카드 모두 줄에 있음');
  ok(R.ah.old && !R.ah.nw, '끝나고 90초 = 숨김 · 20초 = 보임');
  ok(!R.ah.mix && !R.ah.run, '실패 섞임·하는 중은 숨기지 않음(여러 진행 동시)');
  ok(!R.ah.rd, '다른 종류 카드는 예전 10분 규칙 그대로');
  ok(!R.liveShown.old && R.liveShown.nw && R.liveShown.mix, '🛰 칸에 숨긴 것 빼고 그림');
  ok(R.hidBtn && R.hidShow, '숨긴 줄 보기로 다시 봄');
  ok(R.ah10 && !R.ah0, '설정(10초 · 0 = 끔)이 먹음');
  ok(R.afterRedraw, '다시 그린 뒤(새로고침과 같은 판단)도 숨김');
  ok(R.osHid && R.osRow, '원스톱 끝 90초 → 진행 막대 한 줄로 숨김 · 🛰 카드도 숨김');
  ok(!R.osWarn && !R.osFresh, '경고 있으면·끝난 지 10초면 숨기지 않음');
  ok(!R.osShow, '「진행 보기」 누르면 다시 보임');
  ok(R.zero === 0, '0건이어도 오류 없음');
  console.log('③ 칸 순서');
  ok(R.def === 'sum,one,set,live,act', '기본 차례: 총 주문·매출 → 원스톱 → 설정 → 지금 실행 중 → 처리 단추 (→ 목록) · 받은 ' + R.def);
  ok(R.sumTop, '총 주문 건수·매출이 원스톱보다 위(맨 위)');
  ok(R.oneInHead2, '원스톱 단추는 머리 아래 묶음 안(예전 자리)');
  ok(R.edOpen && R.edRows === 6, '↕ 칸 순서 편집 칸 · 6줄');
  ok(R.mv1 === 'sum,one,live,set,act' && /live/.test(R.saved || ''), '▲ 한 번 → 지금 실행 중이 설정 위 · 이 기기에 기억');
  ok(R.mv2 === 'sum,one,live,set,act' && R.actAfterList, '목록을 ▲ → 처리 단추가 목록 아래로');
  ok(R.drag === 'one,sum', '끌어 놓기로 원스톱을 맨 위로');
  ok(R.again.split(',')[0] === 'one' && R.deliv.split(',')[0] === 'one', '다른 단계·다시 열어도 같은 차례');
  ok(R.fix === 'sum,one,set,live,act,list' && R.fix2 === 'sum,one,set,live,act,list', '잘못된 저장값은 고쳐 읽음(모르는 이름·겹침 버림 · 빠진 칸 끼움)');
  ok(R.resetDis === false && R.reset === null && R.afterReset === 'sum,one,set,live,act', '↺ 처음대로');
  ok(R.edClosed, '닫기');
  ok(R.ovf <= 1, '가로 넘침 없음 (' + R.ovf + ')');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); if (bad) process.exitCode = 1;
}, { vp: { width: 360, height: 800 } });
