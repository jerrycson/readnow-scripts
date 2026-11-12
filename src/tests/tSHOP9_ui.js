// tSHOP9_ui — tSHOP9_1112 ③ 화면(휴대폰 390px · PC 1280px) — tSHOP9_1112.js가 부름(RN_UI=1) · 사진은 RN_SHOT 폴더
module.exports = async function ({ base, ok, ADM }) {
  console.log('③ 화면');
  const SHOT = process.env.RN_SHOT || require('os').tmpdir() + '/'; require('fs').mkdirSync(SHOT, { recursive: true }); const { chromium } = require('playwright');
  const b = await chromium.launch(); const errs = [], dlg = [];
  const page = async (vp) => { const p = await b.newPage(vp); p.on('dialog', (d) => { dlg.push(d.message()); d.dismiss().catch(() => {}); }); p.on('pageerror', (e) => errs.push(e.message)); await p.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (rt) => rt.fulfill({ status: 404, body: '' })); await p.addInitScript((u) => { window.BQ_API = u; }, base); return p; };
  const wide = async (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const T = (await ADM({ op: 'mkTest', n: 2 })).L;
  /* 1) 휴대폰 — 시험 계정으로 로그인 → 반 별 리뷰 → 마이페이지에 보임 */
  const p = await page({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(base + '/index.html#/me'); await p.waitForSelector('.bqa-auth'); ok(/로그인하면/.test(await p.textContent('#main')), '로그인 전 내 정보 → 로그인·가입 안내'); await p.screenshot({ path: SHOT + 'm_me_out.png' });
  await p.goto(base + '/index.html#/login?j=1'); await p.waitForSelector('#l_nick'); await p.screenshot({ path: SHOT + 'm_join.png', fullPage: true }); await p.click('#lgo'); await p.waitForTimeout(200); ok(/필수 동의/.test(await p.textContent('#lf')) || await p.locator('[data-f].bad').count() > 0, '가입: 동의 없으면 칸 알림(창 없음)');
  await p.goto(base + '/index.html#/login'); await p.waitForSelector('#l_em'); await p.fill('#l_em', T[0].em); await p.fill('#l_pw', T[0].pw); await p.click('#lgo'); await p.waitForSelector('.bqa-me', { timeout: 8000 });
  ok(/🧪 시험 계정/.test(await p.textContent('.bqa-me')) && /적립금/.test(await p.textContent('.bqa-me')), '시험 계정 로그인 → 마이페이지(🧪 표 · 적립금·쿠폰 자리)'); await p.screenshot({ path: SHOT + 'm_me_test.png', fullPage: true });
  await p.goto(base + '/index.html#/b/aladin_U3'); await p.waitForSelector('#bqa h2', { timeout: 8000 }); await p.waitForSelector('#bqaAct .bqa-rd');
  ok(await p.locator('#bqaAct [data-rd]').count() === 3 && await p.locator('#bqaPr').count() === 1, '책 화면: 서재 세 칸·값 내림 알림 단추'); await p.click('[data-rd="ing"]'); await p.waitForTimeout(400); ok(await p.locator('[data-rd="ing"].on').count() === 1, '📖 읽는 중 담기');
  await p.click('#bqaWr'); await p.waitForSelector('#bqaF'); await p.click('[data-st="7"]'); ok(/3\.5점/.test(await p.textContent('#bqaSn')), '반 별: 일곱째 칸 = 3.5점');
  await p.fill('#bqaS1', '시험 계정으로 남긴 100자평 — 반 별 시험'); await p.click('#bqaF summary'); await p.fill('#bqaBd', '긴 글 시험입니다. 줄거리는 적지 않고 느낌만 적어 봅니다. 충분히 길게.'); await p.screenshot({ path: SHOT + 'm_review_form.png', fullPage: true });
  await p.click('#bqaGo'); await p.waitForSelector('.bqa-rv.mine', { timeout: 8000 }); ok(/시험 — 나만 보임/.test(await p.textContent('.bqa-rv.mine')) && /3\.5/.test(await p.textContent('.bqa-rv.mine')), '올린 리뷰: 내 리뷰 칸 · 🧪 나만 보임 · 3.5'); await p.screenshot({ path: SHOT + 'm_item_reviews.png', fullPage: true });
  ok(await wide(p), '휴대폰 폭 옆 넘침 없음(책 화면)');
  await p.goto(base + '/index.html#/me?t=rv'); await p.waitForSelector('#mt .bqa-rv', { timeout: 8000 }); ok(/반 별 시험/.test(await p.textContent('#mt')), '마이페이지 ⭐ 리뷰 칸에 방금 리뷰'); await p.screenshot({ path: SHOT + 'm_me_reviews.png', fullPage: true });
  await p.goto(base + '/index.html#/me?t=rd'); await p.waitForSelector('#mt .chips'); ok(/읽는 중 1/.test(await p.textContent('#mt')), '마이페이지 📚 서재(읽는 중 1)');
  await p.goto(base + '/index.html#/b/aladin_U3'); await p.waitForSelector('#bqaAct .bqa-rd'); await p.click('#bqaWr').catch(() => {});
  /* 2) 다른 브라우저(로그인 없음)에선 시험 리뷰가 안 보임 */
  const p2 = await page({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await p2.goto(base + '/index.html#/b/aladin_U3'); await p2.waitForSelector('#bqa h2', { timeout: 8000 }); ok(!/반 별 시험/.test(await p2.textContent('#bqa')), '로그인 없는 손님에겐 시험 리뷰 안 보임');
  /* 3) 진짜(가짜 이름) 손님 — 가입 → 리뷰 공감·공유 카드·밑줄·북리스트·알림·팔로우·공개 서재 (PC 1280) */
  const q = await page({ viewport: { width: 1280, height: 900 } }); await q.goto(base + '/index.html#/login?j=1'); await q.waitForSelector('#l_nick');
  await q.fill('#l_nick', '화면손님'); await q.fill('#l_em', 'ui-guest@example.com'); await q.fill('#l_pw', 'abcd1234'); await q.fill('#l_pw2', 'abcd1234'); await q.check('#l_all'); await q.click('#lgo'); await q.waitForSelector('.bqa-me', { timeout: 8000 }); ok(/화면손님/.test(await q.textContent('.bqa-me')), '가입 → 바로 마이페이지');
  await q.goto(base + '/index.html#/b/aladin_U1'); await q.waitForSelector('#bqa .bqa-sum', { timeout: 8000 }); ok(await q.locator('#bqaStar .bqst').count() === 1, '제목 아래 별점 요약');
  const lk = q.locator('[data-like]').first(); if (await lk.count()) { await lk.click(); await q.waitForTimeout(400); ok(await q.locator('[data-like].on').count() >= 1, '👍 공감 누름 표시'); }
  await q.fill('#bqaQt', '화면 시험 밑줄 문장입니다'); await q.fill('#bqaQp', '7'); await q.click('#bqaQf button'); await q.waitForTimeout(600); ok(/화면 시험 밑줄/.test(await q.textContent('#bqaQ')), '✏ 밑줄 남기기 → 바로 보임');
  await q.click('#bqaList'); await q.fill('#bqaNlN', '화면 시험 목록'); await q.click('#bqaNl button'); await q.waitForTimeout(600); ok(await q.locator('#bqaListBox [data-lid]:checked').count() === 1, '📋 북리스트 만들고 담기');
  await q.click('#bqaPr'); await q.waitForTimeout(400); ok(/켜짐/.test(await q.textContent('#bqaPr')), '🔔 값 내림 알림 켜기');
  await q.screenshot({ path: SHOT + 'pc_item.png', fullPage: true });
  await q.click('[data-card]'); await q.waitForSelector('.bqa-ov img', { timeout: 5000 }); ok(await q.locator('.bqa-ov a[download]').count() === 1, '📤 공유 카드(그림 저장)'); await q.screenshot({ path: SHOT + 'pc_share_card.png' }); await q.click('#ovX');
  const nick = await q.locator('.bqa-rv:not(.mine) .nk').first(); if (await nick.count()) { await nick.click(); await q.waitForSelector('.bqa-me h1', { timeout: 8000 }); ok(/님의 서재/.test(await q.textContent('.bqa-me')), '별명 → 그 손님 공개 서재'); await q.click('#fb'); await q.waitForTimeout(700); ok(/팔로잉/.test(await q.textContent('#fb')), '＋ 팔로우'); await q.screenshot({ path: SHOT + 'pc_profile.png', fullPage: true }); }
  for (const t of ['ord', 'al', 'bl', 'fol', 'q', 'info']) { await q.goto(base + '/index.html#/me?t=' + t); await q.waitForSelector('#mt > *:not(.grid)', { timeout: 8000 }).catch(() => {}); await q.waitForTimeout(300); await q.screenshot({ path: SHOT + `pc_me_${t}.png`, fullPage: true }); }
  ok(/값 내림 기다리는 중/.test(await (async () => { await q.goto(base + '/index.html#/me?t=al'); await q.waitForSelector('#mt .rows', { timeout: 8000 }); return q.textContent('#mt'); })()), '마이페이지 🔔 알림 칸');
  await q.goto(base + '/index.html#/me?t=bl'); await q.waitForSelector('.bqa-bl h3 a'); await q.click('.bqa-bl h3 a'); await q.waitForSelector('h1.pt'); ok(/화면 시험 목록/.test(await q.textContent('h1.pt')) && await q.locator('.grid .card').count() === 1, '북리스트 공개 화면'); await q.screenshot({ path: SHOT + 'pc_list.png', fullPage: true });
  await q.goto(base + '/index.html#/'); await q.waitForSelector('.bqa-newrv', { timeout: 8000 }).catch(() => {}); ok(await q.locator('.bqa-nr').count() >= 1, '첫 화면 ⭐ 새로 올라온 리뷰'); await q.screenshot({ path: SHOT + 'pc_home.png', fullPage: true });
  await p.goto(base + '/index.html#/'); await p.waitForSelector('.bqa-newrv', { timeout: 8000 }).catch(() => {}); await p.screenshot({ path: SHOT + 'm_home.png', fullPage: true }); ok(await wide(p), '휴대폰 첫 화면 옆 넘침 없음');
  await p.goto(base + '/index.html#/me?t=al'); await p.waitForSelector('#mt .bqa-nt', { timeout: 8000 }); ok(await wide(p), '휴대폰 마이페이지 옆 넘침 없음'); await p.screenshot({ path: SHOT + 'm_me_alerts.png', fullPage: true });
  await p.goto(base + '/index.html#/p/privacy'); await p.waitForSelector('.doc'); ok(/회원 가입\(선택\)/.test(await p.textContent('.doc')), '개인정보 처리방침에 회원 항목');
  /* (shop9 2회) 카드 별점 · 리뷰 요약 · 가게 답글 · 팔로잉·추천 */
  { const rl = await ADM({ op: 'rvList', days: 30 }); const lo = rl.L.filter((r) => r.k === 'i9788900000002' && !r.hid && !r.test).sort((a, b) => a.st - b.st)[0]; if (lo) await ADM({ op: 'rvReply', id: lo.rid, tx: '불편을 드려 죄송합니다' }); }
  await q.goto(base + '/index.html#/list?s=new'); await q.waitForSelector('.grid .card'); await q.waitForTimeout(400); ok(await q.locator('.card .crv').count() >= 1, '목록 카드에 ★ 별점(수)'); await q.screenshot({ path: SHOT + 'pc_list_stars.png' });
  await q.goto(base + '/index.html#/b/aladin_U2'); await q.waitForSelector('#bqa .bqa-sum', { timeout: 8000 }); ok(await q.locator('.bqa-sm .chip').count() >= 1 && await q.locator('.bqa-pn').count() >= 1, '리뷰 요약: 자주 쓴 말·좋은 평/아쉬운 평');
  await q.selectOption('#bqaS', 'lo'); await q.waitForTimeout(600); ok(/가게 답글/.test(await q.textContent('#bqa')), '🏪 가게 답글 보임'); await (await q.$('#bqa')).screenshot({ path: SHOT + 'pc_review_summary_reply.png' });
  await q.goto(base + '/index.html#/me?t=fol'); await q.waitForSelector('#mt .hint', { timeout: 8000 }); await q.waitForTimeout(500); ok(/팔로잉/.test(await q.textContent('#mt')), '👥 팔로우 칸: 팔로잉 목록'); await q.screenshot({ path: SHOT + 'pc_me_fol2.png', fullPage: true });
  ok(!dlg.length && !errs.length, '브라우저 창(alert·confirm) 0 · 화면 오류 0', { dlg, errs });
  await b.close();
};
