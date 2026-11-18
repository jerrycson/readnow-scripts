// tBKGRP1118 — (정범님 11/18 I-1118-1417-15.2) 🧮 수동 일괄 📁 묶음을 펼치면 안의 그룹이 그 묶음 소속임이 뚜렷하게
//  ① 글: 꼬리표 함수(bkfInTag)·끝 단추·소속 칸 이름(bkf-kid)·어두운 화면 규칙 · 새 코드에 브라우저 창 없음
//  ② 화면(상품 탭 슬롯 줄 · 📂 그룹 카드): 묶음 안 그룹마다 「📁 묶음이름 · 몇/모두」 꼬리표와 묶음 색 띠 · 묶음 밖 그룹은 꼬리표·띠 없음
//        두 묶음을 함께 펼쳐도 각자 상자(색 다름) · 끝 단추 「◂ 📁 이름 끝 · ▴ 접기」로 접힘 · 머리 단추 「▴ 접기」 · 휴대폰 폭에서 옆 넘침 없음
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tBKGRP1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const i = T.indexOf('const bkfInTag'); const j = T.indexOf('function bkfLine', i); const blk = i >= 0 && j > i ? T.slice(i, T.indexOf('\n}\n', j)) : '';
  ok(blk.length > 0, '꼬리표 함수와 묶음 줄 함수가 있음');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tag = new Function('esc', T.slice(i, T.indexOf('\n', i)) + '\nreturn bkfInTag;')(esc);
  ok(tag(null) === '' && /📁 가을 &lt;정리&gt; · 2\/3/.test(tag({ name: '가을 <정리>', i: 2, n: 3 })), '꼬리표 = 「📁 묶음이름 · 몇/모두」(이름은 가림 처리) · 묶음 밖이면 빈 글', tag({ name: '가을 <정리>', i: 2, n: 3 }));
  ok(/class="bkf-end" data-bkfexp=/.test(blk) && /bkf-kid/.test(T.slice(T.indexOf('function bkfChip'), T.indexOf('function bkfChip') + 4000)), '끝 단추(접기와 같은 data-bkfexp)·소속 칸 이름(bkf-kid)');
  ok(/:root\[data-theme="dark"\] \.bkf-fold\.bkf-open/.test(T) && /\.bkf-kid>\.bslot\{/.test(T) && /\.bkf-in\{/.test(T), '밝은·어두운 화면 모양 규칙이 있음');
  ok(!/\b(alert|confirm)\s*\(/.test(blk), '새 코드에 브라우저 창 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKGRP1118 ${bad}개 실패` : '✓ tBKGRP1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const W = (p, ms) => p.waitForTimeout(ms);
const seed = async (p) => { await p.evaluate(require('./seed.js')); await W(p, 500);
  await p.evaluate(async () => { const now = new Date().toISOString();
    const G = [['gA', '소설 상급'], ['gB', '저가 정리'], ['gC', '희귀본 올림'], ['gD', '만화 내림'], ['gE', '여름 특가'], ['gF', '묶음 밖 그룹'], ['gG', '또 다른 밖 그룹']];
    for (const [id, name] of G) await db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name }, createdAt: now, lastRunAt: now, by: 't', writerSchema: 6, lastKeys: [], lastCount: 12 });
    await db.collection('prd_price_batches').doc('_bkfold').set({ order: ['gF', 'f:f_1', 'f:f_2', 'gG'], folds: { f_1: { name: '가을 정리', gids: ['gA', 'gB', 'gC'], color: 1, gcol: {}, joined: {} }, f_2: { name: '만화', gids: ['gD', 'gE'], color: 3, gcol: {}, joined: {} } } });
    S.prBatches = undefined; S.bkfold = undefined; S._bkfUn = null; S.bkfExp = { f_1: true, f_2: true }; try { localStorage.setItem('rn-bkfexp', JSON.stringify(S.bkfExp)); } catch (e) {}
    S.tab = 'products'; S.thinPick = null; S.q = ''; renderTabs(); renderMainNow();
    for (let i = 0; i < 40 && !document.querySelector('#main .bslot-row [data-bkf="gA"]'); i++) await new Promise((r) => setTimeout(r, 150)); await new Promise((r) => setTimeout(r, 400));
    const dl = document.getElementById('dlp'); if (dl) dl.style.display = 'none'; }); };
const look = (p, root) => p.evaluate((root) => { const R = document.querySelector(root); if (!R) return null;
  const chip = (id) => { const w = R.querySelector(`[data-bkf="${id}"]`); if (!w) return null; const f = w.closest('.bkf-fold'); const t = w.querySelector('.bkf-in'); const face = w.querySelector('.bslot, .btn'); const cs = face && getComputedStyle(face);
    return { kid: w.classList.contains('bkf-kid'), fold: f ? f.dataset.bkf : null, tag: t ? t.textContent.trim() : null, bl: cs ? cs.borderLeftColor : null, blw: cs ? parseFloat(cs.borderLeftWidth) : 0 }; };
  const fold = (fid) => { const f = R.querySelector(`[data-bkf="f:${fid}"]`); if (!f) return null; const cs = getComputedStyle(f); const end = f.querySelector('.bkf-end'); const head = f.querySelector(`.bkf-fh + [data-bkfexp="${fid}"]`);
    return { open: f.classList.contains('bkf-open'), c: cs.getPropertyValue('--bkfc').trim(), bl: cs.borderLeftColor, blw: parseFloat(cs.borderLeftWidth), end: end ? end.textContent.trim() : null, head: head ? head.textContent.trim() : null, kids: f.querySelectorAll('.bkf-kid').length }; };
  return { g: Object.fromEntries(['gA', 'gB', 'gC', 'gD', 'gE', 'gF', 'gG'].map((id) => [id, chip(id)])), f1: fold('f_1'), f2: fold('f_2'), sw: document.documentElement.scrollWidth, iw: window.innerWidth }; }, root);
const check = (v, where) => {
  ok(v && v.f1 && v.f2 && v.f1.open && v.f2.open, `${where}: 두 묶음 모두 펼친 상자`, v && [v.f1, v.f2]);
  if (!v || !v.f1 || !v.f2) return;
  ok(v.g.gA.tag === '📁 가을 정리 · 1/3' && v.g.gB.tag === '📁 가을 정리 · 2/3' && v.g.gC.tag === '📁 가을 정리 · 3/3' && v.g.gD.tag === '📁 만화 · 1/2' && v.g.gE.tag === '📁 만화 · 2/2', `${where}: 묶음 안 그룹마다 「📁 묶음이름 · 몇/모두」 꼬리표`, Object.values(v.g).map((x) => x && x.tag));
  ok(['gA', 'gB', 'gC'].every((k) => v.g[k].kid && v.g[k].fold === 'f:f_1') && ['gD', 'gE'].every((k) => v.g[k].kid && v.g[k].fold === 'f:f_2'), `${where}: 그룹은 자기 묶음 상자 안(섞이지 않음)`);
  ok(['gF', 'gG'].every((k) => v.g[k] && !v.g[k].kid && !v.g[k].tag && !v.g[k].fold), `${where}: 묶음 밖 그룹은 꼬리표·소속 표시 없음`, [v.g.gF, v.g.gG]);
  ok(v.f1.c && v.f2.c && v.f1.c !== v.f2.c && v.f1.bl !== v.f2.bl && v.f1.blw >= 5 && v.f2.blw >= 5, `${where}: 펼친 묶음마다 굵은 왼쪽 띠(색이 서로 다름)`, [v.f1.c, v.f2.c, v.f1.blw]);
  ok(['gA', 'gB', 'gC'].every((k) => v.g[k].bl === v.f1.bl && v.g[k].blw >= 3) && ['gD', 'gE'].every((k) => v.g[k].bl === v.f2.bl), `${where}: 안 그룹 칸의 왼쪽 띠 = 그 묶음 색`, Object.values(v.g).map((x) => x && [x.bl, x.blw]));
  ok(v.f1.end === '◂ 📁 가을 정리 끝 · ▴ 접기' && v.f2.end === '◂ 📁 만화 끝 · ▴ 접기' && v.f1.head === '▴ 접기', `${where}: 끝 단추 「◂ 📁 이름 끝 · ▴ 접기」 · 머리 단추 「▴ 접기」`, [v.f1.end, v.f1.head]);
};
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await seed(p);
  check(await look(p, '#main .bslot-row'), '상품 탭 슬롯 줄');
  /* 끝 단추로 접기 → 다시 펼치기 */
  await p.locator('#main .bslot-row [data-bkf="f:f_1"] .bkf-end').click(); await W(p, 500);
  let v = await look(p, '#main .bslot-row'); ok(v && !v.f1.open && v.f1.kids === 0 && !v.f1.end && v.f2.open && v.f2.kids === 2 && v.f1.head === '▾', '끝 단추를 누르면 그 묶음만 접힘(다른 묶음은 그대로)', v && [v.f1, v.f2]);
  await p.locator('#main .bslot-row [data-bkfexp="f_1"]').first().click(); await W(p, 500);
  v = await look(p, '#main .bslot-row'); ok(v && v.f1.open && v.f1.kids === 3, '머리 단추로 다시 펼침', v && v.f1);
  /* 📂 그룹 카드(수동 일괄 화면) */
  await p.evaluate(async () => { try { openBatchGroup('gG'); } catch (e) {} await new Promise((r) => setTimeout(r, 1500)); });
  const hasSheet = await p.evaluate(() => !!document.querySelector('#sheet .bgrp-list'));
  ok(hasSheet, '수동 일괄 📂 그룹 카드가 열림'); if (hasSheet) check(await look(p, '#sheet .bgrp-list'), '수동 일괄 그룹 카드');
  await p.evaluate(() => { try { closeSheet(); } catch (e) {} });
  /* 어두운 화면 · 휴대폰 폭 */
  await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); }); await W(p, 200);
  v = await look(p, '#main .bslot-row'); const bgD = await p.evaluate(() => getComputedStyle(document.querySelector('#main .bslot-row [data-bkf="f:f_1"]')).backgroundColor);
  ok(v && v.f1.open && v.g.gA.tag && !/255, 255, 255|^rgba\(0, 0, 0, 0\)/.test(bgD) && !/rgb\(2[2-5]\d, 2[2-5]\d, 2[2-5]\d\)/.test(bgD), '어두운 화면에서도 묶음 상자가 어두운 바탕으로 보임', bgD);
  await p.evaluate(() => { document.documentElement.removeAttribute('data-theme'); });
  await p.setViewportSize({ width: 390, height: 900 }); await W(p, 400);
  v = await look(p, '#main .bslot-row'); ok(v && v.f1.open && v.g.gA.tag && v.sw <= v.iw + 1, '휴대폰 폭(390)에서도 꼬리표가 보이고 옆으로 넘치지 않음', v && [v.sw, v.iw]);
  ok(!dlg.length, '브라우저 창 0', dlg);
  console.log(bad ? `❌ tBKGRP1118 ${bad}개 실패` : '✓ tBKGRP1118 통과'); if (bad) process.exitCode = 1;
});
