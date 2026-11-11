// tRGWS — (11/11 정범님 '등록의 작업대 줄은 맨 위로 가고 고정되게' · '작업대를 삭제하고 이름을 바꿀 수도 있고 나열 순서도 변경 가능하게')
//  ⑮ 작업대 줄이 머리줄 바로 아래(🔎 넣고 조회보다 위) · 굴려도 그 자리에 붙음(머리줄과 겹치지 않음 · 떠 있지 않음) · 붙으면 한 줄 · 카드가 튀지 않음 · 휴대폰 · 끄면 예전 자리
//  ✎ 이름 그 자리 입력(Enter 저장·Esc 취소) · ◀ ▶·끌어 놓기 순서(서버 저장) · 🗑 없애기(두 번 누르기 · 상품은 기본 작업대로 · 기록) · ♻ 되살리기
const G = (f) => async (p) => { try { await f(p); } catch (e) { bad++; console.log('  ❌ 시험 멈춤:', String(e.message).slice(0, 300)); } };
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } else console.log('  ✓', m); };
/* 작업대 셋(기본 · 작업대 A · 작업대 B) + 기본 작업대에 선택 대기 상품 30개(화면이 굴러가게) + 작업대 A에 3개 */
const SEED = async () => { localStorage.removeItem('rn-ux2'); localStorage.setItem('rn-reg-ws', 'main'); await regSaveCfg({ wsList: [{ id: 'main', name: '작업대 1' }, { id: 'wsA', name: '작업대 A' }, { id: 'wsB', name: '작업대 B' }], wsGone: [] });
  const t0 = new Date().toISOString(); const mk = async (id, ws) => { const d = { stage: 'sel', grade: 2, qty: 1, price: 5000, ws, createdAt: t0, info: { title: '작업대 시험 책 ' + id, isbn13: '97911000' + String(10000 + Math.abs([...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 90000).padStart(5, '0'), categories: [{ path: ['국내도서', '소설/시/희곡'] }], page1: [], priceList: 15000, at: t0 } }; await db.collection('reg_items').doc(id).set(d); S.regItems.set(id, { id, ...d }); };
  for (let i = 0; i < 30; i++) await mk('m' + i, 'main'); for (let i = 0; i < 3; i++) await mk('a' + i, 'wsA'); };
const OPEN = async (p) => { await p.evaluate(() => { S.tab = 'home'; renderTabs(); renderMainNow(); openRegister(); }); await p.waitForTimeout(1500); await p.evaluate(SEED); await p.evaluate(() => { localStorage.setItem('rn-reg-view', 'full'); S.regT = 'sel'; regRerender(); }); await p.waitForTimeout(1200); };
/* 지금 자리: 머리줄 아래끝 · 작업대 줄 위·아래 · 넣고 조회 위 · 작업대 줄 바로 아래 점이 무엇인지(겹침) */
const POS = (p) => p.evaluate(() => { const sh = document.getElementById('sheet'); const hd = sh.querySelector(':scope > .sh').getBoundingClientRect(); const ws = sh.querySelector(':scope > .rgws'); const w = ws.getBoundingClientRect(); const q = sh.querySelector(':scope > .rgsearch').getBoundingClientRect();
  const under = document.elementFromPoint(Math.round(w.left + 30), Math.round(w.bottom + 3)); const mid = document.elementFromPoint(Math.round(w.left + 30), Math.round(w.top + w.height / 2));
  return { y: Math.round(sh.scrollTop), hdB: Math.round(hd.bottom), hdT: Math.round(hd.top), wsT: Math.round(w.top), wsB: Math.round(w.bottom), wsH: Math.round(w.height), qT: Math.round(q.top), stuck: ws.classList.contains('stuck'), pos: getComputedStyle(ws).position, underWs: !!(under && (under.closest('.rgws') || under.closest('#sheet > .sh'))), midWs: !!(mid && mid.closest('.rgws')), sw: document.documentElement.scrollWidth, iw: innerWidth, act: (document.activeElement || {}).id || '' }; });
const SCROLL = (p, y) => p.evaluate((y) => { document.getElementById('sheet').scrollTop = y; }, y).then(() => p.waitForTimeout(350));
require('./harness.js')(G(async (p) => {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await OPEN(p);
  // ── ⑮ 맨 위 · 붙음
  const a0 = await POS(p);
  ok(Math.abs(a0.wsT - a0.hdB) <= 2 && a0.wsT < a0.qT && !a0.stuck && a0.pos === 'sticky', '⑮ 작업대 줄이 머리줄 바로 아래 · 🔎 넣고 조회보다 위 · 처음엔 펼친 줄', a0);
  for (const y of [600, 2500, 6000]) { await SCROLL(p, y); const a = await POS(p); ok(a.y > 100 && a.hdT === 0 && Math.abs(a.wsT - a.hdB) <= 1 && a.stuck && a.wsH <= 40 && a.midWs && !a.underWs, `⑮ ${y}px 굴림: 작업대 줄이 머리줄 바로 아래에 붙음(겹침·뜸 없음 · 한 줄 ${a.wsH}px · 아래는 카드)`, a); }
  { // 카드가 튀지 않음: 붙는 순간(0 → 30px) 첫 상품 카드 위치가 굴린 만큼만 움직임
    await SCROLL(p, 0); const c0 = await p.evaluate(() => Math.round(document.querySelector('#sheet [data-rgcid], #sheet .rgc').getBoundingClientRect().top)); await SCROLL(p, 30);
    const c1 = await p.evaluate(() => Math.round(document.querySelector('#sheet [data-rgcid], #sheet .rgc').getBoundingClientRect().top)); ok(Math.abs((c0 - c1) - 30) <= 2, '⑮ 붙어 한 줄로 줄어도 카드 자리가 튀지 않음(굴린 30px만큼만)', { c0, c1 }); }
  { // 다시 그려도 붙은 채 · 굴린 자리 그대로
    await SCROLL(p, 2500); const b0 = await POS(p); await p.evaluate(() => regRerender()); await p.waitForTimeout(900); const b1 = await POS(p); ok(b1.stuck && Math.abs(b1.y - b0.y) <= 3 && Math.abs(b1.wsT - b1.hdB) <= 1, '⑮ 다시 그려도 붙은 채 · 굴린 자리 그대로', { b0, b1 }); }
  await SCROLL(p, 0); { const a = await POS(p); ok(!a.stuck && Math.abs(a.wsT - a.hdB) <= 2, '⑮ 맨 위로 오면 다시 펼친 줄(제자리)', a); }
  { // 스캐너 입력 칸: 커서가 검색창에 있으면 다시 그려도 그대로 · 넣기 단추·Enter 그대로
    await p.focus('#rg_in'); await SCROLL(p, 1500); await p.evaluate(() => regRerender()); await p.waitForTimeout(900); const a = await POS(p); ok(a.act === 'rg_in' || a.act === '', '⑮ 굴린 뒤 다시 그려도 검색창 커서를 다른 칸이 빼앗지 않음', a);
    await SCROLL(p, 0); await p.fill('#rg_in', '9791100099999'); await p.press('#rg_in', 'Enter'); await p.waitForTimeout(900); ok(await p.evaluate(() => [...S.regItems.values()].some((x) => x.isbn === '9791100099999' || ((x.info || {}).isbn13 === '9791100099999') || String(x.q || x.input || '').includes('9791100099999'))), '⑮ 🔎 넣고 조회: Enter로 넣으면 조회 대기에 들어감(그대로)'); }
  { // scrollIntoView(카드 이동)가 붙은 줄 밑에 숨지 않음
    await p.evaluate(() => { const L = regCardEls(); S._regCur = regCardIdOf(L[12]); regCurApply(true); }); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const ws = document.querySelector('#sheet > .rgws').getBoundingClientRect(); const c = document.querySelector('#sheet .rgcur').getBoundingClientRect(); return { wsB: Math.round(ws.bottom), cT: Math.round(c.top) }; }); ok(r.cT >= r.wsB - 1, '⑮ Alt+↑↓ 카드 이동: 고른 카드 머리가 작업대 줄 밑에 가리지 않음', r); }
  // ── 끄면 예전 자리
  await p.evaluate(() => { ux2Put('rgws', 0); ux2Apply(); }); await SCROLL(p, 0);
  { const a = await POS(p); ok(a.pos === 'static' && a.wsT > a.qT, '⑮ 끄면 예전 자리(🔎 넣고 조회 아래 · 붙지 않음)', a); await SCROLL(p, 2500); const b = await POS(p); ok(!b.stuck && b.wsB < b.hdB, '⑮ 끄면 굴릴 때 함께 올라감(예전 그대로)', b); }
  await p.evaluate(() => { localStorage.removeItem('rn-ux2'); ux2Apply(); }); await SCROLL(p, 0);
  ok(await p.evaluate(() => /⑮ 등록 화면: 🗂 작업대 줄 맨 위/.test(ux2SetHtml())), '⑮ 되돌리기 스위치가 ⚙ 설정 › 🧩 화면 고침에 있음');
  // ── ✎ 이름 그 자리에서
  await p.click('#rg_wsren'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.activeElement && document.activeElement.id === 'rg_wsname' && document.querySelector('.rgws #rg_wsname').value === '작업대 1'), '✎ 이름: 그 자리에 이름 칸이 열리고 커서가 들어감(늘 포커스가 빼앗지 않음)');
  await p.fill('#rg_wsname', '작업대 하나'); await p.press('#rg_wsname', 'Enter'); await p.waitForTimeout(1300);
  ok(await p.evaluate(() => regWsList()[0].name === '작업대 하나' && !document.getElementById('rg_wsname')), '✎ Enter = 저장(모든 기기 설정)', await p.evaluate(() => regWsList()));
  await p.click('#rg_wsren'); await p.waitForTimeout(400); await p.fill('#rg_wsname', '버릴 이름'); await p.press('#rg_wsname', 'Escape'); await p.waitForTimeout(1300);
  ok(await p.evaluate(() => regWsList()[0].name === '작업대 하나' && !document.getElementById('rg_wsname')), '✎ Esc = 취소(이름 그대로)');
  // ── 순서 ◀ ▶ · 끌어 놓기
  await p.click('.rgws [data-rgws="wsB"]'); await p.waitForTimeout(800); await p.click('.rgws [data-rgwsmv="-1"]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => regWsList().map((w) => w.id).join() === 'main,wsB,wsA' && [...document.querySelectorAll('.rgws [data-rgws]')].map((b) => b.dataset.rgws).join() === 'main,wsB,wsA'), '순서 ◀: 작업대 B가 한 칸 왼쪽(화면·저장 모두)', await p.evaluate(() => regWsList().map((w) => w.id)));
  ok(await p.evaluate(async () => { const d = await db.collection('app_settings').doc('main').get(); const L = ((d.data() || {}).reg || {}).wsList || []; return L.map((w) => w.id).join() === 'main,wsB,wsA'; }), '순서는 서버(app_settings/main.reg.wsList)에 저장 — 모든 기기 같음');
  await p.dragAndDrop('.rgws [data-rgws="wsA"]', '.rgws [data-rgws="main"]'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => regWsList().map((w) => w.id).join() === 'wsA,main,wsB'), '순서 끌어 놓기: 작업대 A를 맨 앞으로', await p.evaluate(() => regWsList().map((w) => w.id)));
  await p.click('.rgws [data-rgws="main"]'); await p.waitForTimeout(700); ok(await p.evaluate(() => !document.getElementById('rg_wsdel')), '기본 작업대에는 🗑 없애기가 없음');
  // ── 🗑 없애기(두 번 누르기) · ♻ 되살리기
  await p.click('.rgws [data-rgws="wsA"]'); await p.waitForTimeout(800); await p.click('#rg_wsdel'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => regWsList().some((w) => w.id === 'wsA') && document.getElementById('rg_wsdel').classList.contains('ux2-armed') && /한 번 더/.test(document.getElementById('rg_wsdel').textContent)), '🗑 첫 누름 = 「— 한 번 더」(아직 안 지움)');
  await p.click('#rg_wsdel'); await p.waitForTimeout(1500);
  const del = await p.evaluate(async () => { const it = ['a0', 'a1', 'a2'].map((id) => S.regItems.get(id)); const srv = await Promise.all(['a0', 'a1', 'a2'].map((id) => db.collection('reg_items').doc(id).get().then((d) => d.data() || {}))); return { list: regWsList().map((w) => w.id).join(), cur: regWsCur(), loc: it.map((x) => x && x.ws).join(), srv: srv.map((x) => x.ws + '/' + x.wsFrom).join(), gone: regWsGone().map((g) => g.id + ':' + g.n).join(), alive: it.every((x) => x && x.stage === 'sel' && !x.deleted) }; });
  ok(del.list === 'main,wsB' && del.cur === 'main' && del.loc === 'main,main,main' && del.srv === 'main/wsA,main/wsA,main/wsA' && del.gone === 'wsA:3' && del.alive, '🗑 두 번째 누름 = 없앰 · 담긴 상품 3개는 지우지 않고 기본 작업대로 · 지운 기록', del);
  await p.click('#rg_wsgone'); await p.waitForTimeout(600); await p.click('[data-rgwsback="wsA"]'); await p.waitForTimeout(1500);
  const bk = await p.evaluate(() => ({ list: regWsList().map((w) => w.id).join(), loc: ['a0', 'a1', 'a2'].map((id) => S.regItems.get(id).ws).join(), back: !!(regWsGone()[0] || {}).back, btn: !!document.getElementById('rg_wsgone') }));
  ok(bk.list === 'wsA,main,wsB' && bk.loc === 'wsA,wsA,wsA' && bk.back && !bk.btn, '♻ 되살리기 = 원래 자리로 · 옮겨 갔던 상품도 다시 그 작업대로 · 기록은 남음(back 표시)', bk);
  // ── ⑪ 두 번 누르기를 끄면 예전 확인 창(취소 = 그대로)
  await p.evaluate(() => ux2Put('twice', 0)); await p.click('.rgws [data-rgws="wsB"]'); await p.waitForTimeout(800); await p.click('#rg_wsdel'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !!document.querySelector('.askbox') && /작업대 B/.test(document.querySelector('.askbox').textContent)), '🗑 두 번 누르기를 끄면 확인 창(무엇을 없애는지)'); await p.click('.askbox .ask-no'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => regWsList().some((w) => w.id === 'wsB')), '🗑 확인 창 취소 = 작업대 그대로'); await p.evaluate(() => localStorage.removeItem('rn-ux2'));
}), { vp: { width: 1400, height: 900 } }).then(() => require('./harness.js')(G(async (p) => {
  // ── 📱 휴대폰
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500); await OPEN(p);
  const a0 = await POS(p); ok(Math.abs(a0.wsT - a0.hdB) <= 2 && a0.wsT < a0.qT && a0.sw <= a0.iw + 1, '📱 작업대 줄이 머리줄 바로 아래 · 넣고 조회보다 위 · 가로로 넘치지 않음', a0);
  for (const y of [800, 4000]) { await SCROLL(p, y); const a = await POS(p); ok(a.hdT === 0 && Math.abs(a.wsT - a.hdB) <= 1 && a.stuck && a.wsH <= 40 && a.midWs && !a.underWs && a.sw <= a.iw + 1, `📱 ${y}px 굴림: 머리줄 바로 아래 한 줄로 붙음(겹침 없음 · 가로 넘침 없음)`, a); }
  await SCROLL(p, 0); { const a = await POS(p); ok(!a.stuck, '📱 맨 위로 오면 펼친 줄', a); }
}), { vp: { width: 390, height: 844 }, touch: true })).then(() => { console.log(bad ? `❌ tRGWS 실패 ${bad}` : '✓ tRGWS 통과'); process.exit(bad ? 1 : 0); });
