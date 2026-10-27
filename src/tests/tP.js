// (MJ 10/27) 상태 모음 네 모양 — A 빠른 찾기 창 · B 옆 서랍 · C 칩 한 줄 · D / 치면서 고르기 · 기기별 설정
const SP = '/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad/';
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const ok = []; const bad = []; const chk = (n, c, x) => { (c ? ok : bad).push(n + (c ? '' : ' ' + JSON.stringify(x === undefined ? '' : x).slice(0, 300))); console.log(c ? '  ok ' : '  XX ', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); };
  await p.evaluate(async () => { localStorage.setItem('rn-device', 'PC-A'); localStorage.setItem('rn-phui|PC-B', JSON.stringify({ B: true, bFold: true })); localStorage.setItem('rn-phui-rec|PC-B', JSON.stringify([{ k: 'a', t: 'B기기 문구' }])); S._phuiC = null;
    S.regItems = S.regItems || new Map(); const t = new Date().toISOString(); const doc = { stage: 'sel', isbn: '9790000000777', info: { title: '시험책', isbn13: '9790000000777', categories: [1], page1: [], at: t }, grade: 2, qty: 1, price: 9000, by: S.user.email, ws: regWsCur(), createdAt: t, descMode: 'manual', descParts: { a: '', b: '', c: '' } };
    await db.collection('reg_items').doc('c1').set(doc); S.regItems.set('c1', { id: 'c1', ...doc });
    await db.collection('app_settings').doc('reg_phrases').set({ a: [{ f: '띠지류', id: 'f1', pin: false, items: [{ t: '띠지 있음', pin: false }, { t: '겉커버 없습니다.', pin: true }] }, { t: '도장 있음', pin: false }], b: ['색바램 조금', '변색 있음', '밑줄 몇 쪽'], c: ['깨끗함', '전체적으로 양호'] });
    S.regT = 'sel'; try { localStorage.setItem('rn-reg-view', 'full'); } catch (e) {} openRegister(); });
  await p.waitForTimeout(1800);
  const st0 = await p.evaluate(() => ({ c: !!document.querySelector('.phui-c[data-phuic="c1"]'), old: !!document.querySelector('.regdesc .rgph3'), a: !!document.querySelector('[data-phuia="c1"]'), set: !!document.querySelector('[data-phuiset="c1"]'), drawer: !!document.getElementById('phui_b'), cfg: phuiCfg() }));
  chk('기본 A+C (칩 줄·🔍 있음 · 기존 세 칸·서랍 없음)', st0.c && !st0.old && st0.a && st0.set && !st0.drawer && st0.cfg.A && st0.cfg.C && !st0.cfg.B && !st0.cfg.D, st0);
  // A — ② 칸에 커서 → Alt+A → 초성 ㅂㅅ → Enter
  await p.click('textarea[data-rgslot="c1"][data-k="b"]'); await p.keyboard.type('앞글'); await p.keyboard.press('Alt+KeyA'); await p.waitForTimeout(200);
  const a1 = await p.evaluate(() => ({ open: !!document.querySelector('.phui-a'), foc: document.activeElement && document.activeElement.classList.contains('phui-q'), tgt: (document.querySelector('.phui-a .phui-tgt') || {}).textContent, folders: [...document.querySelectorAll('.phui-a .phui-f')].map((b) => b.textContent) }));
  chk('A 창 열림·찾기 칸 커서·폴더 목록', a1.open && a1.foc && /시험책/.test(a1.tgt) && a1.folders.some((f) => /띠지류/.test(f)), a1);
  await p.screenshot({ path: SP + 'tP_a.png' });
  await p.keyboard.type('ㅂㅅ'); await p.waitForTimeout(150);
  const a2 = await p.evaluate(() => [...document.querySelectorAll('.phui-a .phui-r .phui-t')].map((x) => x.textContent));
  chk('A 초성 찾기 ㅂㅅ → 변색 있음', a2.length === 1 && a2[0] === '변색 있음', a2);
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const a3 = await p.evaluate(() => { const el = document.querySelector('textarea[data-rgslot="c1"][data-k="b"]'); return { open: !!document.querySelector('.phui-a'), v: el.value, foc: document.activeElement === el, j: (document.querySelector('[data-rgjt="c1"]') || {}).value }; });
  chk('A Enter → ② 커서 자리에 넣고 닫힘·커서 돌아옴', !a3.open && a3.v === '앞글 변색 있음' && a3.foc && /변색 있음/.test(a3.j), a3);
  // A — 폴더 고르기 + Shift+Enter 계속 + ① 문구는 ① 칸으로 + Esc
  await p.keyboard.press('Alt+KeyA'); await p.waitForTimeout(150); await p.evaluate(() => [...document.querySelectorAll('.phui-a .phui-f')].find((b) => /띠지류/.test(b.textContent)).click()); await p.waitForTimeout(100);
  const a4 = await p.evaluate(() => [...document.querySelectorAll('.phui-a .phui-r .phui-t')].map((x) => x.textContent));
  chk('A 📁 폴더 고르기', a4.length === 2 && a4.includes('띠지 있음'), a4);
  await p.focus('.phui-a .phui-q'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Shift+Enter'); await p.waitForTimeout(150);
  const a5 = await p.evaluate(() => ({ open: !!document.querySelector('.phui-a'), a: document.querySelector('textarea[data-rgslot="c1"][data-k="a"]').value, b: document.querySelector('textarea[data-rgslot="c1"][data-k="b"]').value }));
  chk('A Shift+Enter 넣고 계속 · ① 문구는 ① 끝에', a5.open && a5.a.length > 0 && a5.b === '앞글 변색 있음', a5);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  chk('A Esc 닫힘', await p.evaluate(() => !document.querySelector('.phui-a')));
  await p.keyboard.press('Alt+KeyA'); await p.waitForTimeout(100); await p.mouse.click(5, 450); await p.waitForTimeout(100);
  chk('A 바깥 누르면 닫힘', await p.evaluate(() => !document.querySelector('.phui-a')));
  await p.waitForTimeout(1300);
  const sv = await p.evaluate(() => S.regItems.get('c1').descParts);
  chk('넣은 글이 저장됨(descParts)', /변색 있음/.test(sv.b) && sv.a.length > 0, sv);
  // C — 칩(🕘 최근) · 더 보기 격자
  await p.evaluate(() => regRerender()); await p.waitForTimeout(600);
  const c1 = await p.evaluate(() => [...document.querySelectorAll('[data-phuic="c1"] .phui-chip')].map((b) => b.textContent));
  chk('C 칩 줄 = 🕘 최근 + ★ 고정', c1.some((t) => /변색 있음/.test(t)) && c1.some((t) => /★.*겉커버/.test(t)) && !c1.some((t) => /B기기/.test(t)), c1);
  await p.click('[data-phuic="c1"] .phui-chip.pin'); await p.waitForTimeout(100);
  chk('C 칩 누르면 제 자리(①)에', await p.evaluate(() => /겉커버 없습니다\./.test(document.querySelector('textarea[data-rgslot="c1"][data-k="a"]').value)));
  await p.click('[data-phuicx="c1"]'); await p.waitForTimeout(150);
  const c2 = await p.evaluate(() => ({ cx: !!document.querySelector('.phui-cx'), foc: document.activeElement && document.activeElement.dataset.phuim, n: document.querySelectorAll('.phui-cx .phui-r').length, grid: document.querySelector('.phui-cx .phui-rl') && getComputedStyle(document.querySelector('.phui-cx .phui-rl')).display }));
  chk('C 더 보기 → 넓은 격자 + 찾기 칸 커서', c2.cx && c2.foc === 'C' && c2.n === 8 && c2.grid === 'grid', c2);
  await p.keyboard.type('양호'); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  const c3 = await p.evaluate(() => ({ v: document.querySelector('textarea[data-rgslot="c1"][data-k="c"]').value, cx: !!document.querySelector('.phui-cx') }));
  chk('C 찾아 Enter → ③에 넣고 펼친 채', c3.v === '전체적으로 양호' && c3.cx, c3);
  await p.screenshot({ path: SP + 'tP_c.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  chk('C Esc 접힘', await p.evaluate(() => !document.querySelector('.phui-cx')));
  // 설정 — ⚙ 모양 → D·B·기존 켜기 (이 기기 키만)
  await p.click('[data-phuiset="c1"]'); await p.waitForTimeout(150);
  await p.click('[data-phuitg="D"]'); await p.waitForTimeout(600); await p.click('[data-phuitg="B"]'); await p.waitForTimeout(600); await p.click('[data-phuitg="old"]'); await p.waitForTimeout(700);
  const s1 = await p.evaluate(() => ({ a: JSON.parse(localStorage.getItem('rn-phui|PC-A')), b: localStorage.getItem('rn-phui|PC-B'), toast: document.getElementById('toast').textContent, old: !!document.querySelector('.regdesc .rgph3'), drawer: !!document.getElementById('phui_b'), bon: document.documentElement.classList.contains('phui-bon'), fs: JSON.stringify(window.__FS.app_settings || {}).includes('phui') }));
  chk('설정 바로 적용 + 토스트 + 이 기기 키에만', s1.a.D && s1.a.B && s1.a.old && s1.a.A && s1.a.C && s1.b === JSON.stringify({ B: true, bFold: true }) && /이 기기\(PC-A\)/.test(s1.toast) && s1.old && s1.drawer && s1.bon && !s1.fs, s1);
  // D — / 치면서 고르기
  await p.click('textarea[data-rgslot="c1"][data-k="c"]'); await p.keyboard.press('End'); await p.keyboard.type(' /깨'); await p.waitForTimeout(150);
  const d1 = await p.evaluate(() => [...document.querySelectorAll('.phui-d .phui-r .phui-t')].map((x) => x.textContent));
  chk('D / + 글자 → 추천 목록', d1.length === 1 && d1[0] === '깨끗함', d1);
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const d2 = await p.evaluate(() => ({ v: document.querySelector('textarea[data-rgslot="c1"][data-k="c"]').value, d: !!document.querySelector('.phui-d') }));
  chk('D Enter → /깨 자리에 넣고 닫힘(줄바꿈 안 들어감)', d2.v === '전체적으로 양호 깨끗함' && !d2.d, d2);
  await p.keyboard.type(' 1/2'); await p.waitForTimeout(100);
  chk('D 문장 중간 1/2는 안 뜸', await p.evaluate(() => !document.querySelector('.phui-d')));
  await p.keyboard.type(' /색'); await p.waitForTimeout(100); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const d3 = await p.evaluate(() => ({ c: document.querySelector('textarea[data-rgslot="c1"][data-k="c"]').value, b: document.querySelector('textarea[data-rgslot="c1"][data-k="b"]').value }));
  chk('D 다른 자리(②) 문구는 /색을 지우고 ② 끝에', d3.c === '전체적으로 양호 깨끗함 1/2 ' && /색바램 조금$/.test(d3.b), d3);
  await p.keyboard.type('/'); await p.waitForTimeout(100);
  const d4 = await p.evaluate(() => document.querySelectorAll('.phui-d .phui-r').length); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  chk('D /만 = 최근·고정 · Esc 닫힘', d4 > 0 && await p.evaluate(() => !document.querySelector('.phui-d')), d4);
  // B — 서랍: 커서 있는 칸에 넣음
  await p.click('textarea[data-rgslot="c1"][data-k="a"]'); await p.keyboard.press('End'); await p.waitForTimeout(100);
  const b1 = await p.evaluate(() => ({ tgt: document.querySelector('#phui_b .phui-tgt').textContent, sheetR: getComputedStyle(document.getElementById('sheet')).right }));
  await p.fill('#phui_b .phui-q', '도장'); await p.waitForTimeout(100); await p.click('#phui_b .phui-r'); await p.waitForTimeout(100);
  const b2 = await p.evaluate(() => ({ a: document.querySelector('textarea[data-rgslot="c1"][data-k="a"]').value, drawer: !!document.querySelector('#phui_b .phui-body') }));
  chk('B 서랍 → 넣을 곳 표시 · 커서 칸에 넣음 · 열린 채 · 화면 옆으로', /시험책.*① 구성·표시 칸/.test(b1.tgt) && /도장 있음$/.test(b2.a) && b2.drawer && b1.sheetR === '340px', { b1, b2 });
  await p.screenshot({ path: SP + 'tP_b.png' });
  await p.keyboard.press('Alt+KeyB'); await p.waitForTimeout(150);
  const b3 = await p.evaluate(() => ({ fold: document.getElementById('phui_b').classList.contains('fold'), cfg: JSON.parse(localStorage.getItem('rn-phui|PC-A')).bFold, r: getComputedStyle(document.getElementById('sheet')).right }));
  chk('B Alt+B 접힘 = 얇은 띠 (이 기기 기억)', b3.fold && b3.cfg === true && b3.r === '30px', b3);
  // 🛠 관리 — 기존 도구 그대로(새 문구 더하기)
  await p.keyboard.press('Alt+KeyA'); await p.waitForTimeout(100); await p.click('.phui-a [data-phuimg="A"]'); await p.waitForTimeout(150);
  const m1 = await p.evaluate(() => ({ cols: document.querySelectorAll('.phui-a .rgphc').length, add: !!document.querySelector('.phui-a [data-rgphadd="c"]') }));
  await p.fill('.phui-a [data-rgphadd="c"]', '새로 더한 문구'); await p.press('.phui-a [data-rgphadd="c"]', 'Enter'); await p.waitForTimeout(900);
  const m2 = await p.evaluate(() => ({ saved: JSON.stringify(window.__FS.app_settings.reg_phrases.c || []).includes('새로 더한 문구'), still: !!document.querySelector('.phui-a .rgphc'), shown: document.querySelector('.phui-a').textContent.includes('새로 더한 문구') }));
  chk('🛠 관리 = 기존 도구(세 모음·새 문구 더하기 → 모든 기기 저장)', m1.cols === 3 && m1.add && m2.saved && m2.still && m2.shown, { m1, m2 });
  await p.keyboard.press('Escape');
  // 기기 나눔 — 이름을 PC-B로 바꾸면 PC-B 설정을 읽고 PC-A 것은 그대로
  const dv = await p.evaluate(() => { const A0 = localStorage.getItem('rn-phui|PC-A'); localStorage.setItem('rn-device', 'PC-B'); const c = phuiCfg(); const rec = phuiRec(); localStorage.setItem('rn-device', 'PC-A'); const c2 = phuiCfg(); return { b: c, rec, a: c2, same: A0 === localStorage.getItem('rn-phui|PC-A') }; });
  chk('기기별 저장 — 다른 기기 키는 서로 안 건드림', dv.b.B && !dv.b.A && !dv.b.C && dv.b.bFold && dv.rec.length === 1 && dv.a.A && dv.a.D && dv.same, dv);
  // 모두 끄면 기존 모양이 켜짐
  const off = await p.evaluate(() => { const ks = ['A', 'B', 'C', 'D', 'old']; ks.forEach((k) => phuiSet(k, false)); const c = phuiCfg(); phuiSave({ A: true, C: true }); return c; });
  chk('모두 끄면 ▦ 기존 모양 켜 둠', off.old && !off.A && !off.B, off);
  // 메모리 — 닫으면 버림
  chk('닫힌 창은 DOM에 없음', await p.evaluate(() => !document.querySelector('.phui-a, .phui-d') && !(S._phuiS.A.list || []).length && !(S._phuiS.D.list || []).length));
  console.log('통과:', ok.length, ok.join(' / ')); if (bad.length) console.log('실패:', bad.join('\n'));
  console.log(!bad.length && !errs.length ? '✓ tP 통과' : '❌ tP 실패 ' + errs.join('|'));
});
