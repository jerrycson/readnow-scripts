// t97 (10/26): ⓘ 설명 팝업(아무 데나 누르면 닫힘) · 🏅 등급 계산 팝업 · 판매자 평점 6개월 통일 · 예상 영업이익 한 계산
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); const R = {};
  await p.evaluate(() => { const mk = (i, r, n, c) => ({ id: 'sc_' + (500000 + i), sc: String(500000 + i), name: '판매자' + i, shopPeriods: { '최근 6개월': { rating: r, count: n, good: n - 2, soso: 1, bad: 1 }, '전체 기간': { rating: r - 0.002, count: n * 3 } }, cancel3m: c, rating: 0.95, shopAt: '2026-10-25T10:00:00Z' });
    for (let i = 0; i < 20; i++) { const s = mk(i, 0.97 + (i % 10) * 0.003, 20 + i * 10, 0.005 + (i % 5) * 0.004); S.sellers.set(s.id, s); }
    S.sellers.set('sc_996008', { id: 'sc_996008', sc: '996008', name: '북스킹', aladinGrade: '전문셀러', isPro: true, shopPeriods: { '최근 6개월': { rating: 0.999, count: 180, good: 175, soso: 3, bad: 2 }, '전체 기간': { rating: 0.989, count: 900 } }, cancel3m: 0.006, rating: 0.97, shopAt: '2026-10-25T11:00:00Z' });
    S.sellers.set('sc_old', { id: 'sc_old', sc: '777777', name: '옛판매자', rating: 0.962 }); /* 숍 화면 기록 없음 → 툴팁 값 + * */
    S.sellersLoaded = true; bump('s');
    const box = document.createElement('div'); box.id = 'tbox'; box.style.cssText = 'position:fixed;left:20px;top:80px;width:520px;background:#fff;z-index:50;padding:8px'; box.innerHTML = WIDGETS.shopPerf[1](); document.body.appendChild(box); });
  // 1) 등급 글자 → 팝업
  await p.click('#tbox .sp-gr'); await p.waitForTimeout(150);
  R.g1 = await p.evaluate(() => { const d = document.querySelector('.rn-ipop'); return d ? d.innerText : null; });
  // 2) 팝업 안을 누르면 닫힘
  if (R.g1) { await p.click('.rn-ipop table'); await p.waitForTimeout(100); } R.g2 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  // 3) 다시 열고 → 같은 글자 다시 누르면 닫힘
  await p.click('#tbox .sp-gr'); await p.waitForTimeout(100); R.g3 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length); await p.click('#tbox .sp-gr', { force: true }); await p.waitForTimeout(100); R.g4 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  // 4) 다시 열고 바깥 누르면 닫힘 · Esc
  await p.click('#tbox .sp-gr'); await p.waitForTimeout(100); await p.mouse.click(900, 700); await p.waitForTimeout(100); R.g5 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  await p.click('#tbox .sp-gr'); await p.waitForTimeout(100); await p.keyboard.press('Escape'); await p.waitForTimeout(100); R.g6 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  // 5) 구매평 견주기 ⓘ (구매평 없음이어도 안 깨짐)
  R.rv = await p.evaluate(() => { S.reviewsLoaded = true; try { return IPOP.revsat().includes('모은 구매평'); } catch (e) { return 'ERR ' + e.message; } });
  // 6) 판매자 평점 = 숍 화면 6개월
  R.sl = await p.evaluate(() => [slRate(S.sellers.get('sc_996008')), slRate(S.sellers.get('sc_old')), slRateTxt(S.sellers.get('sc_old'))].map((x) => (typeof x === 'string' ? x : [x.v, x.six, x.src].join('|'))));
  await p.evaluate(() => { document.getElementById('tbox').remove(); openSeller('sc_996008'); }); await p.waitForTimeout(300);
  R.sd = await p.evaluate(() => { const t = document.querySelector('#sheet').innerText; return [t.includes('99.9%'), t.includes('숍 화면 6개월'), !!document.querySelector('#sheet [data-ipop="slrate"]')]; });
  await p.click('#sheet [data-ipop="slrate"]'); await p.waitForTimeout(150); R.sp = await p.evaluate(() => { const d = document.querySelector('.rn-ipop'); return d ? d.innerText.includes('지금 씀') : false; });
  await p.mouse.click(700, 600); await p.waitForTimeout(100); R.sp2 = await p.evaluate(() => document.querySelectorAll('.rn-ipop').length);
  // 7) 정렬: 평점 높은 순이 6개월 값으로
  R.sort = await p.evaluate(() => { history.back(); S.sellerSort = 'rating'; S.sellerRev = false; S.tab = 'sellers'; S.q = ''; const m = document.createElement('div'); renderSellers(m); const names = [...m.querySelectorAll('.item .name')].map((x) => x.textContent); return names.slice(0, 3); });
  // 8) 매물 유의 사항(.uipop) — 안을 눌러도 닫힘
  await p.waitForTimeout(200);
  await p.evaluate(() => { S.uinfo = S.uinfo || new Map(); S.uinfo.set('9001', { note: '띠지 없음', photos: [], sellerCode: '1', sellerName: 'x' }); const a = document.createElement('button'); a.id = 'qq'; a.textContent = '?'; a.style.cssText = 'position:fixed;left:40px;top:120px;z-index:60'; document.body.appendChild(a); showUsedInfo('9001', a); });
  await p.waitForTimeout(150); R.u1 = await p.evaluate(() => document.querySelectorAll('.uipop').length); await p.click('.uipop div[style*="pre-wrap"]'); await p.waitForTimeout(100); R.u2 = await p.evaluate(() => document.querySelectorAll('.uipop').length);
  // 9) 예상 영업이익 한 계산 — 경영 탭 칸과 같은 값
  R.op = await p.evaluate(() => { S.ordersLoaded = true; try { const X = opForecast(); const h = costInsightHtml(bizCalc()); const t = won(Math.round(X.op)); return [Number.isFinite(X.op), h.includes(t), h.includes('data-ipop="opfc"'), IPOP.opfc().includes('계산 방식'), X.how]; } catch (e) { return 'ERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]; } });
  console.log(JSON.stringify(R), errs.join(' | '));
  const ok = R.g1 && R.g1.includes('계산 방식') && R.g1.includes('견줄 판매자') && R.g1.includes('구매만족도') && R.g2 === 0 && R.g3 === 1 && R.g4 === 0 && R.g5 === 0 && R.g6 === 0 && R.rv === true
    && R.sl[0] === '0.999|true|숍 화면 6개월' && R.sl[1].startsWith('0.962|false') && R.sl[2] === '96.2%*' && R.sd.every(Boolean) && R.sp === true && R.sp2 === 0 && R.sort[0] === '북스킹'
    && R.u1 === 1 && R.u2 === 0 && Array.isArray(R.op) && R.op[0] && R.op[1] && R.op[2] && R.op[3] && !errs.length;
  console.log(ok ? '✓ t97 통과' : '❌ t97 실패');
});
