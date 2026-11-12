/* t_ui — (0.1.7 정범님 11/09 밤) 📊 옆 창 골격: 🔗 바로 가기(평소 크롬 · 로거에서 숨김) · ❓ 설명서 · ⚙ 단축키 바꾸기·겹침 검사 · 칸 접기·순서·숨기기 · ▁ 작은 단추·복원 · 설정 저장·내보내기·가져오기·기본값
 * 순수 함수(node) + 진짜 크로미움(Playwright) · 가짜 PowerShell(창 자리 흉내) · 시험에선 바로 가기가 크롬을 띄우지 않고 go.log에 적음
 * 실행: node tests/t_ui.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const UI = require('../helper/col2-ui.js'); const GO = require('../helper/col2-go.js'); const HELP = require('../helper/col2-help.js');

(async () => {
  console.log('① 순수 함수 — 단축키 이름·겹침·설정 꼴·바로 가기');
  ok(UI.normCombo('alt+l') === 'Alt+L' && UI.normCombo('shift+alt+x') === 'Alt+Shift+X' && UI.normCombo('esc') === 'Esc' && UI.normCombo('Shift+?') === '?' && UI.normCombo('Hyper+L') === null && UI.normCombo('') === '', '단축키 글을 한 꼴로(이상하면 버림)');
  ok(UI.comboOf({ altKey: true, code: 'KeyL', key: 'ㅣ' }) === 'Alt+L' && UI.comboOf({ key: '/', code: 'Slash' }) === '/' && UI.comboOf({ key: '?', shiftKey: true, code: 'Slash' }) === '?' && UI.comboOf({ key: 'Escape' }) === 'Esc' && UI.comboOf({ key: 'Alt', altKey: true }) === '', '누른 키 → 이름(한글 입력 중에도 Alt+L)');
  const dk = UI.defKeys(); ok(UI.check(dk).ok && dk.log === 'Alt+L' && dk.close === 'Esc' && dk.find === '/', '기본 단축키는 겹치지 않음(Alt+L · Esc · / …)');
  { const w0 = UI.check(dk).warns || []; ok(dk.set === 'Alt+O' && dk.go === 'Ctrl+K' && dk.mini === 'Alt+Shift+M' && dk.reload === 'Alt+U' && dk.help === 'Alt+H' && !w0.length, '(11/10) 기본 단축키가 웹앱과 다른 일로 겹치지 않음(설정 Alt+O · 바로 가기 Ctrl+K · 작게 Alt+Shift+M · 새로 보기 Alt+U)', w0);
    const w1 = UI.check({ ...dk, set: 'Alt+S' }); ok(w1.ok && w1.warns.some((x) => x.a === 'set' && /웹앱/.test(x.why) && /검색창/.test(x.why)), '웹앱에서 다른 일을 하는 키를 고르면 ⚠ 노란 알림(저장은 됨)', w1.warns);
    const mg = UI.normalize({ keys: { set: 'Alt+S', go: 'Alt+G', mini: 'Alt+M', reload: 'Alt+R', log: 'Alt+J' } }); const mg2 = UI.normalize({ kv: 2, keys: { set: 'Alt+S' } });
    ok(mg.kv === 2 && mg.keys.set === 'Alt+O' && mg.keys.go === 'Ctrl+K' && mg.keys.mini === 'Alt+Shift+M' && mg.keys.reload === 'Alt+U' && mg.keys.log === 'Alt+J' && mg2.keys.set === 'Alt+S', '예전 기본값만 한 번 새 기본값으로 옮김 · 일부러 고른 키·옮긴 뒤 고른 키는 그대로', mg.keys); }
  let ck = UI.check({ ...dk, help: 'Alt+L' }); ok(!ck.ok && ck.errs.some((e) => e.a === 'help' && /겹침/.test(e.why)), '겹침 검사 — 같은 키 두 번', ck.errs.map((e) => e.why).join(' · '));
  ck = UI.check({ ...dk, set: 'Ctrl+W', mini: 'K' }); ok(!ck.ok && ck.errs.some((e) => e.a === 'set' && /크롬/.test(e.why)) && ck.errs.some((e) => e.a === 'mini' && /Alt·Ctrl/.test(e.why)), '크롬이 쓰는 키·글자 하나만은 못 고름');
  ok(UI.check({ ...dk, help: '' }).ok, '비우면 끔(겹침 아님)');
  const n = UI.normalize({ order: ['go', 'zzz', 'now', 'go'], cards: { go: { hide: true }, zzz: { open: true } }, keys: { log: 'alt+k', bad: 'Alt+Q' }, miniW: 9999, goProf: 'Profile 1' });
  ok(n.order[0] === 'go' && n.order[1] === 'now' && n.order.length === UI.CARDS.length && !n.cards.zzz && n.cards.go.hide && n.cards.tail.hide && n.cards.rect.hide && !n.cards.now.hide && n.keys.log === 'Alt+K' && !n.keys.bad && n.miniW === UI.MINI.w && n.goProf === 'Profile 1', '설정 꼴 — 모르는 칸 버림 · 빠진 칸 뒤에 · 옛 칸(도우미 글 끝·자리 숫자)은 처음엔 숨김 · 이상한 크기는 기본값');
  ok(UI.normalize({ goProf: '../x;rm' }).goProf === '', '프로필 이름에 이상한 글자면 버림');
  const ex = UI.exportDoc(n, { side: true, y24: false }, { ver: '0.1.7', pc: 'MJ' }); const im = UI.importDoc(JSON.stringify(ex));
  ok(im.ok && im.ui.cards.go.hide && im.ui.keys.log === 'Alt+K' && im.opts.side === true && im.opts.y24 === false && !/cookie|password|token|rn-cred/i.test(JSON.stringify(ex)), '내보내기 → 가져오기 그대로(비밀값 없음)');
  ok(!UI.importDoc('{"kind":"other"}').ok && !UI.importDoc('not json').ok, '다른 파일은 가져오지 않음');
  ok(GO.urlOf('al-scm', '', 'logger').logger && GO.urlOf('y24-scm', '', 'logger').err && GO.urlOf('al-home', '', 'logger').url === 'https://www.aladin.co.kr/' && !GO.urlOf('nope').url, '바로 가기 — 로거는 우리 숍·계정 화면 거절 · 표에 없는 주소 거절');
  ok(GO.urlOf('al-find', '어린 왕자\n<b>', 'office').url.endsWith(encodeURIComponent('어린 왕자  b')) || /SearchWord=%EC%96%B4/.test(GO.urlOf('al-find', '어린 왕자', 'office').url), '찾기 낱말은 주소 꼴로(줄바꿈·꺾쇠 뺌)');
  ok(GO.chromeArgs('https://x/', 'Profile 1').join(' ') === '--profile-directory=Profile 1 https://x/' && GO.chromeArgs('https://x/', '').join(' ') === 'https://x/', '크롬 인자 = (프로필) + 주소뿐 — 데이터 폴더·조종 길 없음');
  const hO = HELP.html({ kind: 'office', keys: dk, actions: UI.ACTIONS, cards: UI.CARDS }), hL = HELP.html({ kind: 'logger', keys: { ...dk, log: 'Alt+K' }, actions: UI.ACTIONS, cards: UI.CARDS });
  ok(['무엇을 하나', '화면 칸마다 뜻', '단추', '단축키', '멈춤 까닭과 대처', '로거와 사무실 차이', '⚙ 설정'].every((t) => hO.includes(t)) && /🔐 예스24 로그인/.test(hO) && !/🔐 예스24 로그인 필요/.test(hL) && /Alt\+K/.test(hL) && /기본 Alt\+L/.test(hL), '설명서 — 절 모두 · 단축키 표는 지금 값 · 로거엔 예스24 대처 줄 없음');

  console.log('② 옆 창 — 진짜 크로미움');
  const A = await L.fakeAladin(() => null);
  const H = await L.startHelper({ aladin: A.base, cfg: { pc: 'MJ-TEST', watch: { tickSec: 60 } } }); const HOME = path.join(H.D, 'home');
  const goLog = () => { try { return fs.readFileSync(path.join(HOME, 'go.log'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch (e) { return []; } };
  const br = await L.chromium().launch(); const errs = [], dialogs = [];
  try {
    const ctx = await br.newContext({ viewport: { width: 380, height: 560 }, acceptDownloads: true }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await p.goto(`http://127.0.0.1:${H.port}/`); await p.waitForFunction(() => /MJ-TEST/.test(document.getElementById('hdP').textContent), null, { timeout: 8000 }).catch(() => {});
    const vis = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }, sel);
    const order = () => p.evaluate(() => [...document.querySelectorAll('#cards > details.card')].filter((e) => e.style.display !== 'none').map((e) => e.dataset.card));
    const hd = await p.evaluate(() => ({ t: document.getElementById('hdP').textContent, b: ['jwBtn', 'helpBtn', 'setBtn', 'miniBtn'].map((i) => !!document.getElementById(i)), sw: document.documentElement.scrollWidth }));
    ok(/이 PC: MJ-TEST · 🏢 사무실/.test(hd.t) && hd.b.every(Boolean) && hd.sw <= 380, '머리띠 = 이 PC 이름·종류 · 🗒 ❓ ⚙ ▁ · 380 폭 안(가로 넘침 없음)', JSON.stringify(hd));
    ok(JSON.stringify(await order()) === JSON.stringify(['now', 'y24', 'go', 'al', 'reads', 'work']), '처음 칸 = 지금 · 예스24 · 바로 가기 · 🟧 알라딘 읽기 · 최근 읽기 · 작업 창(옛 칸 둘은 숨김 — 지우지 않음)', (await order()).join(','));
    ok(await p.evaluate(() => !document.querySelector('[data-card="work"]').open && !document.querySelector('[data-card="reads"]').open && !document.querySelector('[data-card="now"]').open && !!document.getElementById('glance') && !!document.getElementById('fRead') && !!document.getElementById('fPause')), '점검용 칸(작업 창·최근 읽기)은 처음엔 접힘 · (11/11) 앞면은 한눈 카드(▶ 지금 읽기 · ⏸ 멈춤) · 자세한 상태 칸도 접힘');
    console.log('  · (11/12 col2ui2) 큰 상태 줄 · 주요 카드 · 🔧 자세히 접기');
    { await p.waitForFunction(() => document.getElementById('glLv').textContent !== '확인 중', null, { timeout: 6000 }).catch(() => {});
      const g = await p.evaluate(() => ({ lv: document.getElementById('glLv').textContent, cls: document.getElementById('glance').className, pc: document.getElementById('glPc').textContent, ver: document.getElementById('glVer').textContent, now: document.getElementById('glNow').textContent,
        mc: ['mcAl', 'mcY24', 'mcNv', 'mcJobs', 'mcLoad'].map((i) => { const e = document.getElementById(i); return i + ':' + (!!e && !e.hidden && e.getBoundingClientRect().height > 0); }), more: document.getElementById('more').open, inMore: !!document.querySelector('#more #cards [data-card="now"]'), cardsVis: document.querySelector('[data-card="now"] > summary').checkVisibility() }));
      ok(/✅ 정상|🖐 사람 손 필요|⏸ 쉬는 중|⛔ 멈춤/.test(g.lv) && /gl big (ok|human|rest|stop)/.test(g.cls) && g.pc === 'MJ-TEST' && /번외 /.test(g.ver) && g.now, '맨 위 큰 상태 줄 = 전체 상태(색)·이 PC·번외 판·지금 하는 일', JSON.stringify(g));
      ok(g.mc.join() === 'mcAl:true,mcY24:true,mcNv:false,mcJobs:true,mcLoad:true', '주요 카드 밖에 — 🟧 알라딘 · 🟦 예스24 · 📋 맡긴 일 · 🔋 부하(🟩 네이버는 로거·맡은 PC만)', g.mc.join());
      ok(!g.more && g.inMore && g.cardsVis === false, '나머지 칸(자세한 상태·바로 가기·작업 창 …)은 🔧 자세히 안 — 처음엔 접힘(지우지 않음)', JSON.stringify([g.more, g.inMore, g.cardsVis]));
      const lgBtn = await p.evaluate(() => ({ al: document.getElementById('mAlB').textContent, y: document.getElementById('mY24B').textContent }));
      ok(!/로그인/.test(lgBtn.al + lgBtn.y), '사람 손이 필요 없으면 카드에 큰 로그인 단추 없음', JSON.stringify(lgBtn));
      { const mv = await p.evaluate(async () => { const b = document.createElement('button'); b.id = 'alimp'; b.textContent = '🔁 평소 크롬의 알라딘 로그인 가져오기'; document.getElementById('alb').appendChild(b); await window.__side.load(); return { inMain: !!document.querySelector('#mAlX #alimp'), n: document.querySelectorAll('[id="alimp"]').length }; });
        ok(mv.inMain && mv.n === 1, '(cookie1과 합침) 🟧 칸이 그린 「🔁 평소 크롬의 알라딘 로그인 가져오기」는 주요 🟧 알라딘 카드 바깥으로 옮김(하나만)', JSON.stringify(mv)); }
      await p.click('#more > summary'); await wait(400); ok(await p.evaluate(() => document.getElementById('more').open && document.querySelector('[data-card="now"] > summary').checkVisibility()), '🔧 자세히 누르면 펼침'); }
    console.log('  · 🔗 바로 가기');
    await p.evaluate(() => { document.querySelector('[data-card="go"]').open = true; }); /* (11/11 col2ui1) 바로 가기 칸은 처음엔 접힘 */ await wait(300);
    const goIds = await p.evaluate(() => [...document.querySelectorAll('#gobox [data-go]')].map((b) => b.dataset.go));
    ok(['al-home', 'al-shop', 'al-scm', 'al-orders', 'y24-scm', 'y24-prd'].every((i) => goIds.includes(i)) && /평소 크롬/.test(await p.textContent('#gobox')), '알라딘(우리 숍·샵매니저·주문…)·예스24(판매관리·등록상품) 단추 · 어느 크롬으로 여는지 보임', goIds.join(','));
    await p.click('[data-go="al-scm"]'); await p.waitForFunction(() => /✓/.test(document.getElementById('gom').textContent), null, { timeout: 4000 }).catch(() => {});
    let g = goLog(); ok(g.length === 1 && g[0].args.join(' ') === 'https://www.aladin.co.kr/scm/wmain.aspx' && !g.some((x) => x.args.some((a) => /user-data-dir|remote-debugging/.test(a))) && /평소 크롬/.test(await p.textContent('#gom')), '샵매니저 단추 → 평소 크롬에 그 주소만(번외 프로필·조종 길 없음)', JSON.stringify(g));
    await p.fill('#goq', '9788901234567'); await p.press('#goq', 'Enter'); await wait(500); g = goLog(); ok(g.length === 2 && /SearchTarget=Used&SearchWord=9788901234567$/.test(g[1].args[0]), '찾기 칸 + Enter = 알라딘 중고 찾기', g[1] && g[1].args[0]);
    ok((await H.api('POST', '/go', { id: 'https://evil.example/' })).st === 404, '표에 없는 주소는 도우미가 거절');
    console.log('  · ❓ 설명서');
    await p.click('#helpBtn'); ok(await vis('#ovHelp') && /멈춤 까닭과 대처/.test(await p.textContent('#helpBody')) && /Alt\+L/.test(await p.textContent('#helpBody')), '❓ = 설명서 겹창(멈춤 까닭·단축키 표)');
    await p.click('[data-hj="h-keys"]'); ok(await p.evaluate(() => document.getElementById('h-keys').open), '목차 누르면 그 절이 펼쳐짐');
    await p.keyboard.press('Escape'); ok(!(await vis('#ovHelp')), 'Esc = 설명서 닫기'); await p.keyboard.press('Alt+H'); ok(await vis('#ovHelp'), 'Alt+H = 설명서 열기'); await p.click('[data-ovx="help"]');
    const hp = await ctx.newPage(); hp.on('pageerror', (e) => errs.push(e.message)); await hp.goto(`http://127.0.0.1:${H.port}/help`); await hp.waitForFunction(() => /단축키/.test(document.body.textContent), null, { timeout: 5000 }).catch(() => {}); ok(/로거와 사무실 차이/.test(await hp.textContent('body')), '따로 주소 /help 도 같은 설명서'); await hp.close();
    console.log('  · ⚙ 칸 숨기기·순서·접기');
    await p.click('#setBtn'); await p.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ ok(await vis('#ovSet') && (await p.evaluate(() => document.querySelectorAll('#setCards [data-cid]').length)) === 8, '⚙ = 설정 겹창 · 칸 8개(숨긴 것도 다시 켤 수 있게)');
    await p.click('[data-cid="go"] [data-c="show"]'); await wait(600); ok(!(await order()).includes('go') && (await H.api('GET', '/ui')).j.ui.cards.go.hide, '바로 가기 칸 숨김 → 화면에서 빠지고 도우미(col2.json)에 저장');
    await p.click('[data-cid="go"] [data-c="show"]'); await p.click('[data-cid="go"] [data-c="up"]'); await p.click('[data-cid="go"] [data-c="up"]'); await wait(600);
    ok(JSON.stringify((await order()).slice(0, 3)) === JSON.stringify(['go', 'now', 'y24']), '▲ 두 번 → 바로 가기가 맨 위', (await order()).join(','));
    await p.click('[data-cid="tail"] [data-c="show"]'); await wait(300); ok((await order()).includes('tail'), '숨겨 둔 옛 칸(도우미 글 끝)도 설정에서 다시 켬'); await p.click('[data-cid="tail"] [data-c="show"]');
    await p.keyboard.press('Escape'); ok(!(await vis('#ovSet')), 'Esc = 설정 닫기');
    await p.click('[data-card="now"] > summary'); await wait(600); ok((await H.api('GET', '/ui')).j.ui.cards.now.open === true, '칸 머리 누르면 펼침(11/11부터 처음엔 접힘) → 기억');
    await p.reload(); await p.waitForSelector('#cards'); await wait(1200);
    ok(JSON.stringify((await order()).slice(0, 2)) === JSON.stringify(['go', 'now']) && await p.evaluate(() => document.querySelector('[data-card="now"]').open), '다시 열어도 순서·펼침 그대로');
    console.log('  · ⚙ 단축키 바꾸기·겹침');
    await p.click('#setBtn'); await p.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ await p.click('[data-kid="log"] [data-k="cap"]'); ok(/누르세요/.test(await p.textContent('[data-kid="log"] .kb')), '키 단추 → "키를 누르세요…"');
    await p.keyboard.press('Alt+K'); await wait(600); ok((await H.api('GET', '/ui')).j.ui.keys.log === 'Alt+K' && /Alt\+K/.test(await p.textContent('[data-kid="log"] .kb')), 'Alt+K 를 누르면 기록창 단축키가 Alt+K 로 저장');
    await p.click('[data-kid="help"] [data-k="cap"]'); await p.keyboard.press('Alt+K'); await wait(600);
    ok(/겹침/.test(await p.textContent('#setKeys')) && (await H.api('GET', '/ui')).j.ui.keys.help === 'Alt+H', '같은 키를 다른 일에 고르면 빨간 글 · 고칠 때까지 저장 안 함');
    ok((await H.api('POST', '/ui', { ui: { keys: { log: 'Alt+J', help: 'Alt+J' } } })).st === 400, '도우미도 겹친 단축키는 거절');
    await p.click('[data-kid="help"] [data-k="def"]'); await wait(600); ok(!/겹침/.test(await p.textContent('#setKeys')) && (await H.api('GET', '/ui')).j.ui.keys.help === 'Alt+H', '[기본] = 기본값으로');
    await p.keyboard.press('Escape');
    const jw = async () => { await wait(700); const inner = await p.evaluate(() => { const w = document.getElementById('rn-jw'); return !!w && getComputedStyle(w).display !== 'none'; }); return inner || !!(await H.api('GET', '/status')).j.lwin.open; }; /* (0.1.8) 기록창 기본 = 따로 작은 창 — 옆 창 안 칸이거나 따로 창이 떠 있으면 열림 */
    await p.keyboard.press('Alt+L'); ok(!(await jw()), '바꾼 뒤엔 옛 키 Alt+L 로 안 열림'); await p.keyboard.press('Alt+K'); ok(await jw(), '새 키 Alt+K = 기록창 열기'); await p.keyboard.press('Alt+K'); ok(!(await jw()), 'Alt+K 다시 = 닫기');
    ok(/Alt\+K/.test(await p.getAttribute('#jwBtn', 'title')), '🗒 단추 풍선 글도 새 키');
    console.log('  · ▁ 작은 단추 · 복원');
    await H.api('POST', '/win/app?p=status', { why: '시험' }); await wait(800);
    await p.click('#miniBtn'); await wait(900); let W = H.T.win()['col2-stat-chrome'];
    ok(await p.evaluate(() => document.body.classList.contains('mini')) && await vis('#miniIc') && !(await vis('#cards')), '▁ = 창 전체가 작은 단추(나머지는 감춤)');
    ok(W && W.r.w === UI.MINI.w && W.r.h === UI.MINI.h && W.top && W.r.x === 300 + 1280 - UI.MINI.w && (await H.api('GET', '/ui')).j.ui.mini, '도우미가 앱 창을 132×104 · 오른쪽 위 모서리 · 늘 위로 줄임 · 작게 둔 것 기억', JSON.stringify(W && W.r));
    ok(/dot (ok|warn|err)/.test(await p.getAttribute('#miniIc .dot', 'class')) && /꺼져 있음/.test(await p.textContent('#miniIc small')), '작은 단추에 상태 색 점 · 멈춘 까닭 한 줄');
    const hw0 = (await H.api('GET', '/status')).j.hwin; await H.api('POST', '/win/hrect', { x: 5, y: 5, w: 300, h: 300 }); ok(JSON.stringify((await H.api('GET', '/status')).j.hwin) === JSON.stringify(hw0) && hw0.w === 1280, '작게 둔 동안엔 원래 자리·크기를 덮지 않음');
    await p.click('#miniIc'); await wait(900); W = H.T.win()['col2-stat-chrome'];
    ok(!(await p.evaluate(() => document.body.classList.contains('mini'))) && await vis('#cards') && W.r.w === 1280 && W.r.x === 300 && !W.top && !(await H.api('GET', '/ui')).j.ui.mini, '작은 단추 누르면 원래 자리·크기(보통 창)로', JSON.stringify(W.r));
    await p.keyboard.press('Alt+Shift+M'); await wait(500); ok(await p.evaluate(() => document.body.classList.contains('mini')), 'Alt+Shift+M = 작게'); await p.keyboard.press('Alt+Shift+M'); await wait(500); ok(!(await p.evaluate(() => document.body.classList.contains('mini'))), 'Alt+Shift+M 다시 = 펼침');
    await p.keyboard.press('Control+k'); ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'goq'), 'Ctrl+K = 바로 가기 찾기 칸으로(웹앱 검색창 Ctrl+K와 같은 뜻 · 11/10)');
    console.log('  · 내보내기 · 가져오기 · 기본값');
    await p.click('#setBtn'); await p.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), p.click('#setExp')]); const ftxt = fs.readFileSync(await dl.path(), 'utf8'); const fj = JSON.parse(ftxt);
    ok(/^readnow-col2-settings-MJ-TEST-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()) && fj.kind === 'readnow-col2-settings' && fj.ui.keys.log === 'Alt+K' && fj.ui.order[0] === 'go' && !/cookie|password|token|rn-cred|y24-tpl/i.test(ftxt), '⤓ 내보내기 = 설정 파일(칸 순서·단축키 · 비밀값 없음)', dl.suggestedFilename());
    await p.click('#setReset'); ok(/한 번 더/.test(await p.textContent('#setReset')), '기본값 되돌리기 = 두 번 누르기'); await p.click('#setReset'); await wait(800);
    let u = (await H.api('GET', '/ui')).j.ui; ok(u.keys.log === 'Alt+L' && u.order[0] === 'now' && (await H.api('GET', '/status')).j.pc === 'MJ-TEST', '↺ 기본값 — 칸·단축키만 처음으로(이 PC 이름은 그대로)');
    fj.ui.cards.reads.hide = true; const impF = path.join(H.D, 'imp.json'); fs.writeFileSync(impF, JSON.stringify(fj)); await p.setInputFiles('#setImpF', impF); await wait(400);
    ok(/MJ-TEST의 설정/.test(await p.textContent('#setm')) && await vis('#setImp'), '⤒ 가져올 파일 고르면 무엇인지 먼저 보임');
    await p.click('#setImp'); u = (await H.api('GET', '/ui')).j.ui; ok(u.keys.log === 'Alt+L', '한 번 누름으로는 안 바뀜'); await p.click('#setImp'); await wait(800); u = (await H.api('GET', '/ui')).j.ui;
    ok(u.keys.log === 'Alt+K' && u.order[0] === 'go' && u.cards.reads.hide && !(await order()).includes('reads'), '두 번 누르면 가져온 설정으로(칸·단축키)');
    ok(await p.evaluate(() => Object.keys(localStorage).every((k) => k.startsWith('rn3-'))), '기기 저장은 rn3- 열쇠만');
    const cfgF = JSON.parse(fs.readFileSync(path.join(HOME, 'col2.json'), 'utf8')); ok(cfgF.ui && cfgF.ui.keys.log === 'Alt+K', 'PC마다 저장 — 도우미 col2.json 의 ui');
    console.log('③ 로거 PC');
    await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); await p.reload(); await p.waitForFunction(() => /로거/.test(document.getElementById('hdP').textContent), null, { timeout: 8000 }).catch(() => {}); await wait(800);
    { const m = await p.evaluate(() => ({ y: document.getElementById('mcY24').hidden, nv: document.getElementById('mcNv').hidden, ch: document.getElementById('mAlCh').textContent, k: document.getElementById('glKind').textContent, more: document.getElementById('more').open }));
      ok(m.y && !m.nv && /공개 화면만/.test(m.ch) && /로거/.test(m.k) && m.more, '로거: 🟦 예스24 카드 없음 · 🟩 네이버 카드 보임 · 🟧 알라딘 = 공개 화면만 · 🔧 자세히 연 상태는 기억', JSON.stringify(m)); }
    const lgo = await p.evaluate(() => [...document.querySelectorAll('#gobox [data-go],#gobox [data-gq]')].map((b) => b.dataset.go || b.dataset.gq));
    ok(/🛰 로거/.test(await p.textContent('#hdP')) && !(await order()).includes('y24') && lgo.length && lgo.every((i) => GO.LINKS.find((l) => l.id === i) && !GO.LINKS.find((l) => l.id === i).shop), '로거: 예스24 칸 없음 · 바로 가기는 알라딘 공개 화면·설명서만', lgo.join(','));
    const gr = await H.api('POST', '/go', { id: 'al-shop' }); ok(gr.st === 403 && goLog().length === 2, '로거에서 우리 숍 열기는 도우미가 거절(약속 0) · 크롬에 안 넘김', gr.j && gr.j.err);
    await p.click('#setBtn'); await p.evaluate(() => document.querySelectorAll('details.grp').forEach((d) => (d.open = true))); /* (11/11 col2ui1) ⚙ 자세히 묶음은 처음엔 접힘 — 시험은 펼쳐 봄 */ ok(!(await p.evaluate(() => !!document.querySelector('#setCards [data-cid="y24"]'))) && !(await vis('#tgy')), '로거 설정: 예스24 칸·예스24 켜기 없음');
    await p.click('#helpBtn'); ok(!/🔐 예스24 로그인 필요/.test(await p.textContent('#helpBody')) && /로거 PC/.test(await p.textContent('#helpBody')), '로거 설명서: 로거용 글');
    const lp = await ctx.newPage(); lp.on('pageerror', (e) => errs.push(e.message)); await lp.goto(`http://127.0.0.1:${H.port}/log`); await wait(700); ok(await lp.evaluate(() => !!window.Col2UI && document.getElementById('rn-jw').classList.contains('on')), '/log 따로 창도 같은 단축키 표를 씀'); await lp.close();
    const pg = (await H.req('GET', '/')).b + ['col2-ui.js', 'col2-go.js', 'col2-help.js'].map((f) => fs.readFileSync(path.join(L.ROOT, 'helper', f), 'utf8')).join('');
    ok(!/(^|[^.\w])(alert|confirm|prompt)\s*\(/m.test(pg.replace(/\/\*[\s\S]*?\*\//g, '')) && !dialogs.length && !errs.length, '브라우저 팝업·화면 오류 없음', dialogs.concat(errs).slice(0, 3).join(' | '));
  } finally { await br.close(); await H.stop(); for (const pp of fs.readdirSync('/proc').filter((x) => /^\d+$/.test(x))) { try { if (fs.readFileSync('/proc/' + pp + '/cmdline', 'utf8').includes(H.D)) process.kill(+pp); } catch (e) {} } A.srv.close(); }
  L.done('t_ui');
})();
