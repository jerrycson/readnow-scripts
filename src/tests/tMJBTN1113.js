// tMJBTN1113 — (11/13 MJ님 · 작업판 MJ 카드) 상품 상세 「✏ 상품 정보 · 채널별」 제목 바로 옆에 단추
//  ① 평소: 「✏ 편집」이 제목 바로 옆(예전엔 오른쪽 끝)
//  ② 편집 중: 「확정 → 샵매니저 반영」·「편집 끄기」도 제목 바로 옆 · 기능 그대로(편집 켜기·끄기)
//  ③ PC 폭(1400)·휴대폰 폭(390) 모두 제목·단추·안내 글·◐ 단추가 서로 겹치지 않고 카드 밖으로 나가지 않음
// 실행: cd pw && RN_PORT=<포트> node tMJBTN1113.js (harness.js·seed.js 옆) · 포트 없으면 코드 꼴만 · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/<b>✏ 상품 정보 · 채널별<\/b>\$\{[^]*?canEd \? `<span class="ped-btns">/.test(T), '단추 묶음(ped-btns)이 제목 바로 뒤');
ok(!/<span style="flex:1"><\/span>\$\{canEd \? \(ED \?/.test(T), '단추를 오른쪽 끝으로 밀던 빈 칸 없음');
ok(/id="ped_go"/.test(T) && /id="ped_off">편집 끄기</.test(T) && /id="ped_on">✏ 편집</.test(T), '단추 셋(id·글) 그대로');
ok(/상품 번호가 없거나 삭제된 상품 — 편집 불가/.test(T), '편집 불가 안내 그대로');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJBTN1113 ${bad}개 실패` : '✓ tMJBTN1113 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const over = (a, b) => a && b && a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
  const boxes = (p) => p.evaluate(() => { const box = document.querySelector('#pedbox'); if (!box) return null; const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return b.width && b.height ? { x: b.x, y: b.y, width: b.width, height: b.height } : null; };
    const h = box.querySelector('.ped-h'); return { card: r(box), title: r(h.querySelector('b')), hint: r(h.querySelector('small.hint')), on: r(box.querySelector('#ped_on')), go: r(box.querySelector('#ped_go')), off: r(box.querySelector('#ped_off')), vz: r(box.querySelector('.vztg')), sw: document.documentElement.scrollWidth, vw: innerWidth }; });
  const check = (B, tag, edit) => {
    ok(!!B, `${tag} 편집 칸 보임`); if (!B) return;
    const btns = edit ? [B.go, B.off] : [B.on];
    ok(btns.every(Boolean), `${tag} 단추 ${edit ? '확정·편집 끄기' : '편집'} 보임`, B);
    if (!btns.every(Boolean)) return;
    const first = btns[0];
    const nextTo = (first.x >= B.title.x + B.title.width - 1 && first.x - (B.title.x + B.title.width) < 24 && Math.abs((first.y + first.height / 2) - (B.title.y + B.title.height / 2)) < 14) || (first.y > B.title.y + B.title.height - 2 && first.x - B.card.x < 40);
    ok(nextTo, `${tag} 첫 단추가 제목 바로 옆(또는 좁으면 바로 아래 줄 왼쪽)`, { title: B.title, first });
    const all = [['제목', B.title], ['안내', B.hint], ['◐', B.vz], ...btns.map((b, i) => ['단추' + i, b])].filter((x) => x[1]);
    const hits = []; for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (over(all[i][1], all[j][1])) hits.push(all[i][0] + '×' + all[j][0]);
    ok(!hits.length, `${tag} 제목·단추·안내·◐ 서로 안 겹침`, hits);
    ok(btns.every((b) => b.x >= B.card.x - 0.5 && b.x + b.width <= B.card.x + B.card.width + 0.5), `${tag} 단추가 카드 안`);
    ok(B.sw <= B.vw + 1, `${tag} 가로 스크롤 없음`, { sw: B.sw, vw: B.vw });
  };
  for (const vp of [{ n: 'PC', width: 1400, height: 900 }, { n: '휴대폰', width: 390, height: 844 }]) {
    console.log(`② ${vp.n} 폭 ${vp.width}`);
    await H(async (p) => {
      p.on('dialog', (d) => { ok(false, '브라우저 팝업이 뜸', d.message()); d.dismiss().catch(() => {}); });
      await p.evaluate(SEED); await p.waitForTimeout(400); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
      await p.evaluate(() => { window.peReadNow = async () => {}; /* 클라우드 읽기 맡김은 시험 밖 */ });
      await p.evaluate(() => openProduct('aladin_U215983410')); await p.waitForTimeout(1500);
      await p.evaluate(() => { const b = document.querySelector('#pedbox'); if (b) b.scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(300);
      check(await boxes(p), vp.n + ' 평소', false);
      if (SHOTS) await (await p.$('#pedbox')).screenshot({ path: path.join(SHOTS, `mjbtn_${vp.n === 'PC' ? 'pc' : 'phone'}_view.png`) });
      await p.click('#ped_on'); await p.waitForTimeout(900);
      ok(await p.evaluate(() => !!(S.peEdit && document.querySelector('#pedbox.on'))), vp.n + ' 「✏ 편집」 누르면 편집 켜짐(기능 그대로)');
      check(await boxes(p), vp.n + ' 편집 중', true);
      if (SHOTS) await (await p.$('#pedbox')).screenshot({ path: path.join(SHOTS, `mjbtn_${vp.n === 'PC' ? 'pc' : 'phone'}_edit.png`) });
      await p.click('#ped_off'); await p.waitForTimeout(900);
      ok(await p.evaluate(() => !S.peEdit && !!document.querySelector('#ped_on')), vp.n + ' 「편집 끄기」 누르면 꺼짐(기능 그대로)');
    }, { vp: { width: vp.width, height: vp.height }, ...(vp.n === '휴대폰' ? { touch: true } : {}) });
  }
  console.log(bad ? `❌ tMJBTN1113 ${bad}개 실패` : '✓ tMJBTN1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
