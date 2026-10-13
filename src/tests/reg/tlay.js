// 1.10.0: 하위 탭 · 시험 · 블록 지우기 · 벤치 상세 · 전체 보기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  await p.setViewportSize({ width: +process.env.VW || 1300, height: 900 }); const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = (m) => { OUT.conf = (OUT.conf || []).concat([String(m).slice(0, 160)]); return true; }; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    firebase.firestore.FieldPath = firebase.firestore.FieldPath || { documentId: () => '__id' };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: 'x', registeredAt: '2026-09-01' }); S.prodLoaded = true; bump('p');
    const inf = { ...INFO['9788977396005'], at: new Date().toISOString() }; const inf2 = { ...INFO['9780000000002'], at: new Date().toISOString() };
    const base = { isbn: '9788977396005', branch: 1, grade: 2, qty: 1, saleState: 1, price: 6000, descMode: 'none', desc: '', info: inf };
    col('reg_items').b1 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:01:00Z' }; col('reg_items').b2 = { ...base, stage: 'pick', createdAt: '2026-10-09T00:02:00Z' };
    col('reg_items').o1 = { ...base, stage: 'pick', method: 'one', createdAt: '2026-10-09T00:03:00Z', photos: { main: { name: 'a.jpg', path: 'reg_photos/o1/main.jpg', url: 'x' }, z: [], desc: [] } };
    col('reg_items').o2 = { ...base, isbn: '9780000000002', info: inf2, stage: 'pick', createdAt: '2026-10-09T00:04:00Z' };
    col('reg_items').n1 = { stage: 'pick', method: 'new', branch: 1, grade: 2, qty: 1, saleState: 1, price: 5000, descMode: 'none', new: { title: '세트' }, createdAt: '2026-10-09T00:05:00Z' };
    col('reg_items').d1 = { stage: 'done', day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 6500, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'x' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('reg_items').d2 = { stage: 'done', test: true, day: '2026-10-09', confirmedAt: '2026-10-09T01:00:00Z', cmdId: 'c9', final: { isbn: '9788977396005', price: 9000, code: 'BLKCMN', grade: 2, qty: 1, state: 1, title: 'y' }, info: inf, createdAt: '2026-10-09T00:00:00Z' };
    col('shp_cmds').c9 = { type: 'regBulk', status: 'done', step: 6, createdAt: new Date().toISOString(), results: { d1: { state: 'live', usedCode: 'U9' } } };
    liveReset('cmdhub'); S.cmdAll = null; cmdHub();
    const longNote = '구판절판 개정판 출간에 따라 유통중단, 개정판 구입만 가능합니다. 아주 길게 이어지는 안내 문구 테스트';
    col('reg_items').b1.info = { ...col('reg_items').b1.info, availability: longNote, subtitle: '그림의 침묵을 깨우는 인문학자의 미술독법, 개정증보판', cover: '' };
    openRegister(); await wait(800); S.regT = 'pick'; S.regSub = { pick: 'bulk' }; regRerender(); await wait(1200);
    [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '확인').forEach((b) => b.click());
    const sh = document.querySelector('#sheet'); const c = sh.querySelector('.rgc'); const our = c.querySelector('.rgour'); const pr = c.querySelector('.pq-r');
    OUT.ourInRight = !!(pr && pr.contains(our)); const ro = our.getBoundingClientRect(), rr = pr.querySelector('.pblk, .prow, div:nth-child(2)') ? pr.getBoundingClientRect() : null; OUT.ourTop = Math.round(ro.top); OUT.rightTop = rr && Math.round(rr.top);
    const ttl = c.querySelector('.rgttl b').getBoundingClientRect(); OUT.titleW = Math.round(ttl.width); OUT.titleH = Math.round(ttl.height);
    window.scrollTo(0,0); sh.scrollTop = c.offsetTop - 60;
    document.querySelector('#rg_chkall').click(); await wait(700); OUT.bulkBtns = [...document.querySelectorAll('#sheet [data-rgbulk]')].map((b) => b.textContent);
    const c2 = document.querySelector('#sheet .rgc'); c2.scrollIntoView(); await wait(300);
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  const VW = +process.env.VW || 1300; await p.screenshot({ path: SP + '/reg/lay_' + VW + '.png' }); await br.close(); })();`);
