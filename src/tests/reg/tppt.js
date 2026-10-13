// 1.10.0: 하위 탭 · 시험 · 블록 지우기 · 벤치 상세 · 전체 보기
const fs = require('fs'); const HEAD = fs.readFileSync(__dirname + '/h_head.js', 'utf8'); const SETUP = fs.readFileSync(__dirname + '/h_setup.txt', 'utf8');
const SP = require('path').resolve(__dirname, '..'); eval(HEAD.replace(/__dirname/g, 'SP').replace(/\n$/, '') + `
  await p.setViewportSize({ width: +process.env.VW || 1300, height: 900 }); await p.goto('http://t.test/app/'); await p.waitForTimeout(7000);
  const r = await p.evaluate(async () => { const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const OUT = {}; window.confirm = (m) => { OUT.conf = (OUT.conf || []).concat([String(m).slice(0, 160)]); return true; }; window.alert = (m) => { OUT.alerts = (OUT.alerts || []).concat([m]); };
    try {
    ${SETUP}
    firebase.firestore.FieldPath = firebase.firestore.FieldPath || { documentId: () => '__id' };
    S.plist.set('aladin_U9', { id: 'aladin_U9', usedCode: 'U9', isbn13: '9788977396005', active: true, grade: '상', price: 7000, sku: 'BLKCMN', status: '판매중', title: 'x', registeredAt: '2026-09-01' }); S.prodLoaded = true; bump('p');
    const inf = { ...INFO['9788977396005'], at: new Date().toISOString() }; const inf2 = { ...INFO['9780000000002'], at: new Date().toISOString() };
    const base = { isbn: '9788977396005', branch: 1, grade: 2, qty: 1, saleState: 1, price: 6000, descMode: 'none', desc: '', info: inf };
    const sh = document.querySelector('#sheet'); sh.classList.add('on'); sh.innerHTML = '<div class="card ppt-it" id="x1"><span class="ppt-n">1</span><div id="info"><b>시나리오 모델</b><div class="hint">프랑시스 바누아 · 동문선</div></div><div class="pq-r" id="mk">시장 목록</div></div>';
    vzScan && vzScan(); try { if (typeof vzApply === 'function') vzApply(); } catch (e) {} await wait(600);
    const card = document.querySelector('#x1'); if (!card.querySelector('.vztg')) card.insertAdjacentHTML('afterbegin', '<button class="vztg">◐</button>');
    const R = (sel) => { const r = card.querySelector(sel).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; };
    OUT.pos = { vw: innerWidth, num: R('.ppt-n'), info: R('#info'), mk: R('#mk'), tg: R('.vztg') };
    } catch (e) { OUT.ERR = e.message + ' ' + e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' / '); }
    return JSON.stringify(OUT, null, 1); });
  console.log(r); console.log('PAGEERR', JSON.stringify(errs.filter((e) => /PAGEERR/.test(e)).slice(0, 5)));
  await p.screenshot({ path: SP + '/reg/rprod.png' }); await br.close(); })();`);
