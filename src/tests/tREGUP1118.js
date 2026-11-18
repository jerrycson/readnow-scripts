// tREGUP1118 — (regup1 · MJ님 11/18 카드 「미등록 상품 등록 중 사진이 계속 '올리는 중'」) 등록 사진 올리기 단계별 시간 제한 · 칸마다 '올리는 중' · 실패하면 그 칸에 「⟳ 다시 올리기」
//  ① 코드 꼴 — 줄이기 20초 · 60초 멈춤이면 취소 · 주소 받기 20초 · 저장 25초 · 시작 때 다시 시도 한도 60초 · 예전 하나로 센 S._regUp 없음 · 다섯 올리기 자리 모두 새 도우미
//  ② 화면 — 올리기가 멈추면(바이트 0) 시간 지나 취소 → 그 칸 표시가 반드시 풀림(S.regUpQ 비움) · 실패 줄·칸에 「⟳ 다시 올리기」 · 누르면 같은 칸에 다시 올려 들어감
//  ③ 한 칸이 멈춰도 다른 칸은 끝남 · 머리 줄엔 멈춘 칸만 · 주소 받기가 멈춰도 경로만으로 저장 · 줄이기 멈춤 → 원본 · HEIC는 까닭 알림 · 저장 늦음은 'slow'
// 실행: cd pw && RN_PORT=<포트> node tREGUP1118.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 코드 꼴');
ok(/const RUP_T = \{ shrink: 20e3, stall: 60e3, url: 20e3, save: 25e3 \};/.test(T), '단계별 시간: 줄이기 20초 · 멈춤 60초 · 주소 20초 · 저장 25초');
ok(/setMaxUploadRetryTime\(60000\)/.test(T), '시작 때 저장소 다시 시도 한도 60초');
ok(!/S\._regUp\b(?!Q|Fail|Seq)/.test(T), '예전 하나로 센 S._regUp 없음(칸마다 S.regUpQ)');
ok(/task\.cancel\(\)/.test(T) && /code: 'rn\/stall'/.test(T), '바이트가 안 가면 task.cancel() 뒤 실패');
ok(/finally \{ S\.regUpQ\.delete\(k\); regRerender\(\); \}/.test(T), '끝나면(성공·실패·시간 초과) 그 칸 표시를 반드시 지움');
ok((T.match(/regStorUp\(\(base\) =>/g) || []).length >= 4 && /const r = await regStorPut\(pth, blob\)/.test(T), '다섯 올리기 자리(등록 칸·폴더 사진·사진 모음·상품 수정·잘라 낸 사진) 모두 새 도우미');
ok(!/alert\(|confirm\(/.test((T.slice(T.indexOf('const RUP_T'), T.indexOf('async function regShrink(file)')) + T.slice(T.indexOf('async function regPhotoPut('), T.indexOf('async function regPhotoDel(', T.indexOf('async function regPhotoPut('))))), '브라우저 팝업 없음');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tREGUP1118 ${bad}개 실패` : '✓ tREGUP1118 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  await H(async (p) => { p.on('dialog', (d) => { bad++; console.log('  ❌ 브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(async () => { S.regItems = S.regItems || new Map(); window.ask = async () => true;
      const d = { stage: 'sel', method: 'one', isbn: '9791100009901', grade: 2, qty: 1, price: 9000, ws: regWsCur(), createdAt: '2026-11-18T01:00:00Z', code: 'BLKCMN', codeManual: true, info: { title: '사진 올리기 시험 책', isbn13: '9791100009901', itemId: '9901', author: '지은이갑', publisher: '시험출판', pubDate: '2015-01-01', categories: [{ path: ['국내도서', '어린이'] }], page1: [], priceList: 15000, priceSales: 13500, cover: 'https://x/c.jpg', at: '2026-11-18T01:00:00Z' } };
      await db.collection('reg_items').doc('u1').set(d); S.regItems.set('u1', { id: 'u1', ...d });
      for (const k of [...S.regItems.keys()]) if (/^m\d+$/.test(k)) S.regItems.delete(k);
      localStorage.setItem('rn-reg-view', 'full'); S._regOpen = new Set(['u1']); S.regT = 'sel'; S.regSub = { sel: 'all', pick: 'all' }; S.detail = null; openRegister();
      /* 시험용 가짜 올리기 — mode: hang(바이트 0에서 멈춤) · ok(진행 뒤 끝) · urlhang(올리기는 되고 주소 받기가 멈춤) */
      const st = firebase.storage(); window.__ref0 = st.ref; window.__up = { mode: 'hang', canceled: 0, puts: [] };
      st.ref = (pth) => ({ put: (blob) => { const U = window.__up; U.puts.push(pth); const m = U.hangRe && U.hangRe.test(pth) ? 'hang' : U.mode; let cb = {}; const task = { on: (ev, n, e, c) => { cb = { n, e, c }; if (m === 'hang') setTimeout(() => n({ bytesTransferred: 0, totalBytes: blob.size }), 10); else { setTimeout(() => n({ bytesTransferred: Math.round(blob.size / 2), totalBytes: blob.size }), 20); setTimeout(() => { n({ bytesTransferred: blob.size, totalBytes: blob.size }); c(); }, 60); } }, cancel: () => { U.canceled++; setTimeout(() => cb.e && cb.e({ code: 'storage/canceled', message: 'canceled' }), 5); return true; }, then: (a, b) => Promise.resolve().then(a, b) }; return task; },
        getDownloadURL: () => (window.__up.urlHang ? new Promise(() => {}) : Promise.resolve('https://x/' + encodeURIComponent(pth))) });
      Object.assign(RUP_T, { shrink: 400, stall: 500, url: 400, save: 600 });
      window.__img = (nm) => new Promise((res) => { const c = document.createElement('canvas'); c.width = 40; c.height = 30; const g = c.getContext('2d'); g.fillStyle = '#3a6'; g.fillRect(0, 0, 40, 30); c.toBlob((b) => res(new File([b], nm, { type: 'image/png' })), 'image/png'); });
    });
    await p.waitForTimeout(1500);
    ok(await p.evaluate(() => !!document.querySelector('[data-rgdrop="u1"][data-slot="main"]')), '등록 카드 사진 칸 보임');

    console.log('② 멈춘 올리기 → 시간 지나 취소 → 칸 표시 풀림 · 「⟳ 다시 올리기」');
    await p.evaluate(async () => { window.__pr = regPhotoPut('u1', 'main', null, await window.__img('대표.png')); });
    await p.waitForTimeout(250);
    const mid = await p.evaluate(() => ({ q: S.regUpQ.size, head: (document.querySelector('[data-rgcid="u1"] .rgupq, #sheet .rgupq') || {}).textContent || '', ov: !!document.querySelector('[data-rgdrop="u1"][data-slot="main"] .rgupov') }));
    ok(mid.q === 1 && /대표/.test(mid.head) && /초/.test(mid.head), '올리는 동안: 그 칸 하나만 · 머리 줄에 「대표 … 초」', mid);
    ok(mid.ov, '그 칸 위에 올리는 중 표시', mid);
    await p.evaluate(() => window.__pr); await p.waitForTimeout(700);
    const af = await p.evaluate(() => { const f = [...S.regUpFail.values()]; const row = document.querySelector('.rgupfail'); return { q: S.regUpQ.size, fail: f.length, why: f[0] && f[0].why, file: !!(f[0] && f[0].file), can: window.__up.canceled, toast: (document.getElementById('toast') || {}).textContent || '', row: row ? row.textContent : '', slotBtn: !!document.querySelector('[data-rgdrop="u1"][data-slot="main"] [data-rgupre]'), head: !!document.querySelector('.rgupq'), main: (S.regItems.get('u1').photos || {}).main || null }; });
    ok(af.q === 0 && !af.head, '시간 지나면 올리는 중 표시가 반드시 풀림(남거나 음수 없음)', af);
    ok(af.can >= 1, '멈춘 올리기는 취소(task.cancel)', af);
    ok(af.fail === 1 && af.file && /시간 초과/.test(af.why), '실패 기록(파일 기억 · 까닭 = 시간 초과)', af);
    ok(/시간 초과/.test(af.toast) && /대표/.test(af.toast), '알림에 칸과 까닭(한국어)', af);
    ok(/⟳ 다시 올리기/.test(af.row) && af.slotBtn, '실패 줄과 그 칸에 「⟳ 다시 올리기」', af);
    ok(!af.main, '사진 칸은 비어 있음(반쯤 저장 없음)', af);

    await p.evaluate(() => { window.__up.mode = 'ok'; }); await p.click('.rgupfail [data-rgupre]'); await p.waitForTimeout(1200);
    const re = await p.evaluate(() => { const m = (S.regItems.get('u1').photos || {}).main; const lg = S.regItems.get('u1').photoUpLog || []; return { q: S.regUpQ.size, fail: S.regUpFail.size, path: m && m.path, url: m && m.url, has: !!document.querySelector('[data-rgdrop="u1"][data-slot="main"].has'), lg: lg[lg.length - 1] }; });
    ok(re.q === 0 && re.fail === 0 && /^reg_photos\/u1\/main_/.test(re.path || '') && re.url, '「⟳ 다시 올리기」 → 같은 칸(대표)에 들어감 · 실패 줄 사라짐', re);
    ok(re.has, '대표 칸에 사진 보임', re);
    ok(re.lg && re.lg.ok === 1 && re.lg.slot === 'main' && !('name' in re.lg), '올리기 기록(photoUpLog · 칸·걸린 시간만 · 파일 이름 없음)', re);

    console.log('③ 한 칸이 멈춰도 다른 칸은 끝남');
    await p.evaluate(async () => { const fz = await window.__img('추가.png'), fd = await window.__img('설명.png'); window.__up.mode = 'ok'; window.__up.hangRe = /\/u1\/z0_/; RUP_T.stall = 1500; window.__p1 = regPhotoPut('u1', 'z', 0, fz); await new Promise((r) => setTimeout(r, 30)); window.__p2 = regPhotoPut('u1', 'desc', 0, fd); await window.__p2; });
    await p.waitForFunction(() => /추가 1/.test((document.querySelector('.rgupq') || {}).textContent || ''), null, { timeout: 1200 }).catch(() => {});
    const par = await p.evaluate(() => ({ q: [...S.regUpQ.values()].map((q) => q.slot), head: (document.querySelector('.rgupq') || {}).textContent || '', desc: ((S.regItems.get('u1').photos || {}).desc || []).length }));
    ok(par.desc === 1 && par.q.join(',') === 'z', '설명 칸은 끝남 · 추가 1 칸만 아직 올리는 중', par);
    ok(/추가 1/.test(par.head) && !/설명/.test(par.head), '머리 줄엔 멈춘 칸만', par);
    await p.evaluate(() => window.__p1); await p.evaluate(() => { RUP_T.stall = 500; window.__up.hangRe = null; }); await p.waitForTimeout(500);
    const z = await p.evaluate(() => ({ q: S.regUpQ.size, f: [...S.regUpFail.values()].map((f) => f.slot + f.idx), btn: !!document.querySelector('[data-rgdrop="u1"][data-slot="z"][data-idx="0"] [data-rgupre]') }));
    ok(z.q === 0 && z.f.join(',') === 'z0' && z.btn, '멈춘 추가 1 칸 → 풀림 · 그 칸에 다시 올리기', z);
    await p.click('[data-rgdrop="u1"][data-slot="z"][data-idx="0"] [data-rgupre]'); await p.waitForTimeout(1000);
    const z2 = await p.evaluate(() => ({ z0: !!(((S.regItems.get('u1').photos || {}).z || [])[0]), fail: S.regUpFail.size, picker: document.querySelectorAll('input[type=file]').length }));
    ok(z2.z0 && z2.fail === 0, '칸 안 「⟳ 다시 올리기」 → 추가 1 칸에 들어감', z2);

    console.log('④ 주소 받기 멈춤 · 줄이기 멈춤 · HEIC · 저장 늦음');
    await p.evaluate(() => { window.__up.urlHang = 1; });
    await p.evaluate(async () => regPhotoPut('u1', 'z', 1, await window.__img('추가2.png')));
    const u = await p.evaluate(() => { const x = ((S.regItems.get('u1').photos || {}).z || [])[1]; return { path: x && x.path, url: x && x.url, q: S.regUpQ.size }; });
    ok(u.path && u.url === null && u.q === 0, '주소 받기가 멈추면 주소 없이 경로만 저장', u);
    const sh = await p.evaluate(async () => { const f = await window.__img('a.png'); const b = await regShrinkT(f, () => new Promise(() => {})); let heic = ''; try { await regShrinkT(new File([new Uint8Array(8)], 'b.HEIC', { type: '' }), () => new Promise(() => {})); } catch (e) { heic = rupWhy(e); } const slow = await rupSoftSave(new Promise(() => {})); return { same: b === f, heic, slow }; });
    ok(sh.same, '줄이기가 멈추면 원본으로', sh);
    ok(/HEIC/.test(sh.heic) && /높은 호환성/.test(sh.heic), 'HEIC는 못 읽는 까닭 알림', sh);
    ok(sh.slow === 'slow', '저장이 늦으면 멈추지 않고 slow', sh);
    const nostub = await p.evaluate(async () => { const st = firebase.storage(); st.ref = window.__ref0; const r = await regStorUp((b) => `${b}/u1/t.jpg`, new Blob(['x'])); return r && r.path; });
    ok(nostub === 'reg_photos/u1/t.jpg', 'on이 없는 올리기(시험 틀)도 그대로 됨', nostub);
  });
  console.log(bad ? `❌ tREGUP1118 ${bad}개 실패` : '✓ tREGUP1118 통과'); process.exit(bad ? 1 : 0);
})();
