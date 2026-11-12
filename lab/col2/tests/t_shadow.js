/* t_shadow — 로그인 없는 그림자 읽기 하나(공개 상품 화면)와 그림자 비교 화면
 *  ① 도우미 그림자 읽기: 꺼지면 안 읽음 · 운영 해석 코드로 운영과 똑같은 결과 · 쿠키 없이(로그인 없음) · 떨어진 칸(알라딘 화면 쪽엔 우리 변수 없음)
 *     · 속도(한 장 뒤 기다림) · 한 번에 한 권 · 이상한 번호 거절 · 19금은 건너뜀(로그인 안 함) · 429면 쉼 · 운영 공용 파일은 읽기만
 *  ② 비교 화면(로그인 없음 · 시험이 '웹앱 대신 기록'을 흉내 — 도우미 /relay/*로 운영 문서를 넘기고 맡긴 결과를 씀): 켜기 두 번 누르기 · 운영 prd_books(읽기만)와 칸마다 견줌 — 같음/다름/출처 다름/운영 문서 없음 · 쓰기는 col2_books·col2_runs만
 *     · 막이(prd_books 쓰기 막음 + 화면에 보임) · 팝업 없음 · 기기 저장 rn3- · 표본 고르기
 * 실행: node tests/t_shadow.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const F = require('./fixtures.js'); const COL2 = require('../col2-config.js'); const CMP = require('../shadow/col2-compare-core.js');
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p); } catch (e) {} } };

(async () => {
  const A = await L.fakeAladin(F.productHtml); const IDS = ['100001', '100002', '100003', '100004'];
  const PROD = await L.prodBooks(F.productHtml, IDS, COL2.BOOK_FIXED); /* 운영 수집기가 같은 화면에서 만들 결과(운영 공용 파일 그대로) */
  const coreF = COL2.CORE_FILES.map((f) => path.join(L.PROD_REPO, f)); const mt0 = coreF.map((f) => fs.statSync(f).mtimeMs);

  console.log('① 도우미 그림자 읽기');
  let H = await L.startHelper({ aladin: A.base, cfg: { pace: { minGapMs: 1500 }, watch: { tickSec: 1 }, headless: true } });
  try {
    let r = await H.api('POST', '/read/product', { itemId: '100001' }); ok(r.st === 409 && A.reqs.length === 0, '꺼져 있으면 읽지 않음(알라딘에 요청 없음)');
    await H.api('POST', '/cfg', { on: true }); for (let k = 0; k < 40 && !(await H.api('GET', '/status')).j.alive; k++) await wait(250);
    r = await H.api('POST', '/read/product', { itemId: '100001' }); const sh = CMP.pickPage(r.j.page, COL2.BOOK_FIXED); const cmp = CMP.compareBook(PROD[0], sh, COL2.BOOK_FIXED);
    ok(r.j.ok && cmp.verdict === 'same' && cmp.n.same >= 10, '운영과 똑같은 결과(운영 해석 코드 · 같은 화면)', JSON.stringify(cmp.n));
    ok(r.j.core['readnow-products-core.js'] && r.j.coreVer === r.j.core['readnow-products-core.js'] && r.j.alVer, '결과에 운영 공용 파일 판 번호를 남김', r.j.coreVer + ' / ' + r.j.alVer);
    const land = A.reqs.find((q) => q.path === '/'), q1 = A.reqs.find((q) => q.path === '/shop/wproduct.aspx?ItemId=100001');
    ok(land && q1 && q1.cookie === null && A.reqs.some((q) => q.cookie && /rnTestSid/.test(q.cookie)), '상품 화면은 쿠키 없이 읽음(크롬엔 쿠키가 있어도) — 로그인 없음', 'cookie ' + q1.cookie);
    ok(!/HeadlessChrome/.test(q1.ua), "화면 없는 크롬이어도 이름표에 'HeadlessChrome'을 남기지 않음", q1.ua.slice(-40));
    const me = (await H.api('POST', '/test/main-eval', { expr: "typeof window.ReadnowProducts + '|' + typeof window.ReadnowAladin + '|' + location.href" })).j.v;
    ok(me === `undefined|undefined|${A.base}/`, '알라딘 화면 쪽(보통 칸)에는 우리 변수가 없음 · 작업 탭은 첫 화면에 그대로', me);
    r = await H.api('POST', '/read/product', { itemId: '100002' }); const q2 = A.reqs.find((q) => q.path === '/shop/wproduct.aspx?ItemId=100002'); const gap = q2 && q1 ? q2.t - q1.t : -1;
    ok(r.j.ok && gap >= 1500 * 0.85 - 50, '한 장 뒤 정한 만큼 기다림(속도 규칙)', gap + 'ms');
    const [c1, c2] = await Promise.all([H.api('POST', '/read/product', { itemId: '100003' }), wait(150).then(() => H.api('POST', '/read/product', { itemId: '100004' }))]);
    ok(c1.j.ok && c2.st === 429 && /한 번에 한 권/.test(c2.j.err), '한 번에 한 권(동시에 둘은 거절)', c2.j.err);
    for (const bad of ['abc', '12345678901234', '1;2', '']) ok((await H.api('POST', '/read/product', { itemId: bad })).st === 400, `이상한 번호 '${bad}' 거절`);
    const n0 = A.reqs.length; r = await H.api('POST', '/read/product', { itemId: '191919' });
    ok(!r.j.ok && r.j.needLogin && /로그인하지 않으므로/.test(r.j.why), '19금(로그인 화면으로 감) = 건너뜀', r.j.why);
    ok(!A.reqs.slice(n0).some((q) => q.cookie && /rnTestSid/.test(q.cookie) && /login/.test(q.path)) && (await H.api('POST', '/test/main-eval', { expr: 'location.href' })).j.v === A.base + '/', '로그인 화면에 쿠키를 싣지 않음 · 작업 탭이 로그인 화면으로 옮겨 가지 않음');
    r = await H.api('POST', '/read/product', { itemId: '999429' }); const r2 = await H.api('POST', '/read/product', { itemId: '100004' });
    ok(!r.j.ok && r.j.status === 429 && r2.st === 429 && r2.j.paced && /쉬는 중/.test(r2.j.err) && !A.reqs.some((q) => /100004/.test(q.path)), '알라딘이 429면 쉼(다음 읽기는 요청 없이 거절)', r2.j.err);
    const st = (await H.api('GET', '/status')).j; ok(st.reads.length >= 5 && st.pace.fails >= 1 && st.pace.dayN >= 4, '상태에 최근 읽기·속도 기록', `읽기 ${st.reads.length} · 오늘 ${st.pace.dayN}`);
    ok(coreF.every((f, i) => fs.statSync(f).mtimeMs === mt0[i]), '운영 공용 파일은 읽기만(고치지 않음)');
  } finally { await H.stop(); killDir(H.D); }

  console.log('② 그림자 비교 화면');
  H = await L.startHelper({ aladin: A.base, cfg: { pace: { minGapMs: 300 }, watch: { tickSec: 1 }, headless: true } });
  const seed = { prd_books: { b1: PROD[0], b2: { ...PROD[1], publisher: '다른출판' }, b3: { ...PROD[2], title: '교보 제목', infoFrom: { title: 'kyobo' } } }, prd_ids: { itemId_100001: { bookId: 'b1' }, itemId_100002: { bookId: 'b2' }, itemId_100003: { bookId: 'b3' } } };
  /* 가짜 웹앱(이 PC에 열린 운영 웹앱 흉내) — 0.3초마다 도우미에 물어 부탁한 운영 문서를 넘기고, 맡긴 결과를 FS에 씀(col2_* 아닌 칸은 쓰지 않음) */
  const FS = JSON.parse(JSON.stringify(seed)); const FSW = []; let webOn = true;
  const web = setInterval(async () => { if (!webOn) return; const pd = (await H.api('GET', '/relay/pending?by=' + encodeURIComponent('시험 웹앱'))).j; if (!pd || !pd.ok) return;
    const docs = (pd.want || []).map((w) => ({ c: w.c, id: w.id, v: (FS[w.c] || {})[w.id] || null })); const sample = pd.sample ? Object.entries(FS.prd_books).slice(0, pd.sample).map(([id, v]) => ({ id, ...v })) : null;
    if (docs.length || sample) await H.api('POST', '/relay/answer', { docs, sample });
    const keys = []; for (const o of pd.out || []) { if (!/^col2_/.test(o.c)) continue; (FS[o.c] = FS[o.c] || {})[o.id] = o.merge ? { ...((FS[o.c] || {})[o.id] || {}), ...o.v } : o.v; FSW.push({ c: o.c, id: o.id }); keys.push(o.k); }
    if (keys.length) await H.api('POST', '/relay/ack', { keys }); }, 300);
  const br = await L.chromium().launch(); const errs = [], dialogs = [];
  try { const ctx = await br.newContext(); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    const outside = []; await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (rt) => { outside.push(rt.request().url()); return rt.fulfill({ status: 404, body: '' }); });
    await p.setViewportSize({ width: 380, height: 560 });
    await p.goto(`http://127.0.0.1:${H.port}/compare`); await p.waitForFunction(() => /꺼짐/.test(document.getElementById('hst').textContent), null, { timeout: 15000 });
    await wait(1500); const top = await p.evaluate(() => ({ fb: !!window.firebase, login: !!document.getElementById('loginb'), rec: document.getElementById('fbst').textContent, pc: document.getElementById('pcn').textContent, al: document.getElementById('pcbar').textContent, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(!top.fb && !top.login && /웹앱이 대신 기록함/.test(top.rec) && !outside.some((u) => /gstatic|firebase/.test(u)), "구글 로그인 칸 없음 · Firebase를 열지 않음 · '웹앱이 대신 기록함' 표시", top.rec);
    ok(top.pc && top.pc !== '—' && /ⓘ/.test(top.al) && !/알라딘 로그인: 이 단계에선 안 함/.test(top.al), '맨 위에 이 PC 이름 · (11/11) 옛 「알라딘 로그인 안 함」 글은 빼고 설명은 ⓘ', top.pc);
    ok(top.sw <= top.cw, '작은 창(380px)에서 가로 넘침 없음', top.sw + ' ≤ ' + top.cw);
    await p.click('#pcb'); await p.fill('#pci', 'HOME-시험'); await p.click('#pcv'); await wait(400); const st0 = (await H.api('GET', '/status')).j;
    ok(st0.pc === 'HOME-시험' && st0.pcSrc === 'pc' && (await p.textContent('#pcn')) === 'HOME-시험', 'PC 이름 바꾸기 → 저장(웹앱 기기 이름이 덮지 않음)');
    await H.api('POST', '/cfg', { pc: 'HOME', hands: false, pcSrc: 'web' }); ok((await H.api('GET', '/status')).j.pc === 'HOME-시험', '여기서 바꾼 이름은 웹앱이 넘긴 기기 이름으로 덮이지 않음');
    await p.click('#onb'); await p.waitForFunction(() => /한 번 더 누르면 켬/.test(document.getElementById('onb').textContent), null, { timeout: 3000 }).catch(() => {}); ok(/한 번 더 누르면 켬/.test(await p.textContent('#onb')) && !(await H.api('GET', '/status')).j.on, '켜기는 두 번 누르기(한 번은 안 켜짐)');
    await p.click('#onb'); await wait(400); ok((await H.api('GET', '/status')).j.on, '두 번째 누르면 켜짐');
    await p.waitForFunction(() => /켜짐/.test(document.getElementById('hst').textContent), null, { timeout: 15000 });
    await p.fill('#ids', IDS.join('\n')); await p.click('#runb'); await p.waitForFunction(() => /4권/.test(document.getElementById('sum').textContent), null, { timeout: 90000 });
    const rows = await p.evaluate(() => [...document.querySelectorAll('#out > tr')].map((tr) => ({ id: tr.dataset.id, v: tr.dataset.v, t: tr.innerText, ks: [...tr.querySelectorAll('tr[data-f]')].map((x) => x.dataset.f + ':' + x.dataset.k) })));
    const R = Object.fromEntries(rows.map((x) => [x.id, x]));
    ok(R['100001'] && R['100001'].v === 'same', '100001 운영과 같음');
    ok(R['100002'] && R['100002'].v === 'diff' && R['100002'].ks.includes('publisher:diff') && /publisher/.test(R['100002'].t), '100002 다름 — 출판사 칸을 짚음');
    ok(R['100003'] && R['100003'].v === 'same' && R['100003'].ks.includes('title:ext'), '100003 운영 값이 바깥 정보면 출처 다름(고장 아님)');
    ok(R['100004'] && R['100004'].v === 'noprod', '100004 운영 문서 없음');
    for (let k = 0; k < 30 && FSW.length < 5; k++) await wait(300);
    const sw2 = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(sw2[0] <= sw2[1], '결과 표가 있어도 380px에서 가로 넘침 없음(표는 칸 안 가로 굴림)', sw2.join(' ≤ '));
    const FSx = { W: FSW, FS }; ok(FSx.W.length === 5 && FSx.W.every((w) => /^col2_/.test(w.c)) && FSx.W.filter((w) => w.c === 'col2_books').length === 4 && FSx.W.filter((w) => w.c === 'col2_runs').length === 1, '웹앱 대신 기록 = col2_books 4 + col2_runs 1 — 그 밖 칸은 하나도 안 씀', FSx.W.map((w) => w.c + '/' + w.id).join(' '));
    const b1 = FS.col2_books.b1; ok(b1 && b1.page.title === '시험 책 하나' && b1.cmp.verdict === 'same' && b1.coreVer && b1.itemId === '100001' && FS.col2_books.itemId_100004, 'col2_books 문서 = 그림자 결과·판정·판 번호(운영 문서 없으면 itemId_<번호>)');
    const run = Object.values(FS.col2_runs)[0]; ok(run && run.n === 4 && run.sameN === 2 && run.diffN === 1 && run.noN === 1, 'col2_runs 한 줄 요약', JSON.stringify({ n: run && run.n, s: run && run.sameN, d: run && run.diffN }));
    ok(JSON.stringify(FS.prd_books) === JSON.stringify(seed.prd_books) && JSON.stringify(FS.prd_ids) === JSON.stringify(seed.prd_ids), '운영 칸(prd_books·prd_ids)은 그대로(읽기만)');
    const g = await p.evaluate(async () => { try { await window.__col2.S.set('prd_books', 'b1', { title: 'x' }); return 'written'; } catch (e) { return e.blocked ? 'blocked' : e.message; } });
    await wait(1800); ok(g === 'blocked' && /막은 쓰기 1번/.test(await p.textContent('#blk')) && FS.prd_books.b1.title === '시험 책 하나', '운영 칸 쓰기는 막고 화면에 보임');
    const pr = await H.api('POST', '/relay/put', { c: 'prd_books', id: 'b1', v: { title: 'x' } }); const gr = await H.api('POST', '/relay/get', { c: 'app_secrets', id: 'x' });
    ok(pr.st === 400 && gr.st === 400, '도우미도 막음: 운영 칸 대신 쓰기 거절 · 웹앱에 부탁할 수 있는 읽기는 prd_ids·prd_books 뿐', pr.st + '/' + gr.st);
    await p.fill('#nsample', '2'); await p.click('#pickb'); await p.waitForFunction(() => document.getElementById('ids').value.split('\n').filter(Boolean).length === 2, null, { timeout: 10000 }).catch(() => {}); const picked = (await p.inputValue('#ids')).split('\n').filter(Boolean);
    ok(picked.length === 2 && picked.every((x) => IDS.includes(x)), '운영 도서에서 표본 고르기(읽기만)', picked.join(','));
    const ks = await p.evaluate(() => Object.keys(localStorage)); ok(ks.length > 0 && ks.every((k) => k.startsWith('rn3-')), '기기 저장 열쇠는 rn3- 만', ks.join(','));
    ok(!dialogs.length, '브라우저 팝업 없음', dialogs.join('|')); ok(!errs.length, '화면 오류 없음', errs.slice(0, 3).join(' | '));
  } finally { clearInterval(web); await br.close(); await H.stop(); killDir(H.D); A.srv.close(); }
  L.done('t_shadow');
})();
