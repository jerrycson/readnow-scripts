// tRGPEEK — 정범님 11/05 '등록 페이지에서 내부 팝업으로 알라딘 매입 페이지를 열어 잠시 확인 용도로'
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(800);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; const sh = document.getElementById('sheet');
    openRegister(); await W(800); o.btn = !!document.getElementById('rg_bbpeek'); sh.scrollTop = 120; o.y0 = sh.scrollTop;
    document.getElementById('rg_bbpeek').click(); await W(800); o.peek = sh.classList.contains('peek') && document.body.classList.contains('peekbd'); o.bb = !!(S.detail && S.detail.bbuy); o.x = document.querySelectorAll('#bbpeek_x').length; o.txt = /알라딘 매입/.test(sh.innerText);
    const xr = document.getElementById('bbpeek_x').getBoundingClientRect(); o.xH = Math.round(xr.height);
    document.getElementById('bbpeek_x').click(); await W(900); o.back = !!(S.detail && S.detail.reg) && !!document.getElementById('rg_bbpeek'); o.off = !sh.classList.contains('peek') && !document.body.classList.contains('peekbd') && !document.getElementById('bbpeek_x'); o.y1 = sh.scrollTop;
    return o; });
  console.log(JSON.stringify(r));
  ok(r.btn, '등록 화면 머리에 「🏷 알라딘 매입 잠깐 보기」');
  ok(r.peek && r.bb && r.x === 1 && r.txt && r.xH >= 44, '누르면 알라딘 매입 페이지가 팝업 모양으로(뒤 화면 어둡게) · 위에 큰 「✕ 닫고 등록으로」');
  ok(r.back && r.off && r.y1 === r.y0, '닫으면 등록 화면 그대로(스크롤 자리까지 ' + r.y0 + '→' + r.y1 + ') · 팝업 모양 풀림');
  console.log(bad ? `❌ tRGPEEK 실패 ${bad}` : '✓ tRGPEEK 통과'); });
