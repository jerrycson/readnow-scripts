// tMJUI1113 — (11/13 MJ님 요청) 📥 상품 등록 › 설정 세 칸(📝 상품 설명 일괄 적용 · ⚙ 가격·등록 조건 · 💾 저장한 등록 설정)
//  세 칸은 한 줄 탭으로 고정 · 누른 탭은 연두색으로 바뀌고 바로 아래 같은 색 판이 펼쳐짐 · 다시 누르면 접힘 · 한 번에 하나만 · 이 기기에 마지막 펼친 것 기억
//  겉모양만 — 각 칸 안의 저장·적용 동작은 그대로(안의 칸이 그대로 있고 눌림) · 휴대폰 폭에서도 한 줄 · 가로 넘침 없음
// 실행: cd pw && RN_PORT=<포트> RN_APP=<app.html> node tMJUI1113.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
console.log('① 코드 꼴');
ok(/<div class="rgsetrow rgtabs"/.test(T) && /\.rgsetrow\.rgtabs\{[^}]*display:grid/.test(T), '설정 줄 = 세 칸 탭(grid)');
ok(/regSetTab\(\) === 'bulk' \? 'open'/.test(T) && /regSetTab\(\) === 'cfg' \? 'open'/.test(T) && /regSetTab\(\) === 'ps' \? ' open'/.test(T), '세 칸 펼침 = 지금 탭 하나');
ok(/regSetTabBind\(sh\);/.test(T) && /localStorage\.setItem\('rn-rgsettab'/.test(T), '한 번에 하나 · 이 기기 기억(rn-rgsettab)');
ok(/:root\[data-theme="dark"\] \.rgsetrow\.rgtabs\{/.test(T) && /@media \(max-width:560px\)\{\.rgsetrow\.rgtabs/.test(T), '어두운 모양 색 · 휴대폰 폭 규칙');
{ const i = T.indexOf('const RG_SETTABS'); const blk = T.slice(i, i + 1600); ok(i > 0 && !/\balert\(|\bconfirm\(|\bprompt\(/.test(blk), '새 덩어리에 브라우저 창 없음'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJUI1113 ${bad}개 실패` : '✓ tMJUI1113 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const shot = async (p, n, full) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const el = await p.$('#sheet > .rgsetrow'); if (el && !full) { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); const b = await el.boundingBox(); await p.screenshot({ path: path.join(SHOTS, n + '.png'), clip: { x: 0, y: Math.max(0, b.y - 60), width: p.viewportSize().width, height: Math.min(b.height + 120, 1400) }, fullPage: false }); } else await p.screenshot({ path: path.join(SHOTS, n + '.png') }); console.log('  📷', n); } catch (e) { console.log('  (사진 못 찍음)', e.message); } };
  const open = async (p) => { await p.evaluate(() => { S._rgSetTab = undefined; openRegister(); }); await p.waitForTimeout(900); };
  const st = (p) => p.evaluate(() => { const row = document.querySelector('#sheet .rgsetrow'); const rr = row.getBoundingClientRect(); const g = (s) => { const d = row.querySelector(s); const sm = d.querySelector(':scope > summary'); const r = sm.getBoundingClientRect(); const dr = d.getBoundingClientRect(); return { open: d.open, top: Math.round(r.top - rr.top), left: Math.round(r.left - rr.left), w: Math.round(r.width), h: Math.round(r.height), bg: getComputedStyle(sm).backgroundColor, dTop: Math.round(dr.top - rr.top), dW: Math.round(dr.width), dBg: getComputedStyle(d).backgroundColor }; };
    let mem = null; try { mem = localStorage.getItem('rn-rgsettab'); } catch (e) {}
    return { row: { top: Math.round(rr.top), w: Math.round(rr.width), h: Math.round(rr.height) }, bulk: g('details.regbulk'), cfg: g('details.regcfg'), ps: g('details.rgps'), mem, tab: S._rgSetTab, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  const run = (vp, tag) => H(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(() => { try { localStorage.removeItem('rn-rgsettab'); } catch (e) {} S.regT = 'q'; S.detail = null; }); await open(p);
    const ph = vp.width < 500; console.log(`② 화면 ${tag}`);
    const s0 = await st(p);
    ok(!s0.bulk.open && !s0.cfg.open && !s0.ps.open, '처음엔 셋 다 접힘', s0);
    ok(s0.bulk.top === s0.cfg.top && s0.cfg.top === s0.ps.top && s0.bulk.left < s0.cfg.left && s0.cfg.left < s0.ps.left, '세 칸이 한 줄(같은 높이 · 왼쪽부터 설명·조건·저장 설정)', s0);
    ok(s0.row.h <= 60 && Math.abs(s0.bulk.w - s0.cfg.w) <= 3 && Math.abs(s0.cfg.w - s0.ps.w) <= 3, '세 칸 너비 같음 · 접혀 있으면 줄 높이 60px 안', s0);
    await shot(p, `mjui1_closed_${tag}`);
    // 상품 설명 일괄 적용 누름 → 색 바뀜 · 아래로 펼쳐짐 · 탭 자리 그대로
    await p.click('#sheet .rgsetrow > details.regbulk > summary', { position: { x: 20, y: 12 } }); await p.waitForTimeout(250);
    const s1 = await st(p);
    ok(s1.bulk.open && !s1.cfg.open && !s1.ps.open && s1.tab === 'bulk' && s1.mem === 'bulk', '📝 누르면 그 칸만 펼침 · 이 기기에 기억', s1);
    ok(s1.bulk.top === s0.bulk.top && Math.abs(s1.bulk.left - s0.bulk.left) <= 1 && Math.abs(s1.bulk.w - s0.bulk.w) <= 3 && s1.cfg.top === s0.cfg.top && Math.abs(s1.ps.left - s0.ps.left) <= 1, '펼쳐도 세 탭은 제자리(고정)', { s0: s0.bulk, s1: s1.bulk });
    ok(s1.bulk.bg !== s0.bulk.bg && s1.bulk.bg === s1.bulk.dBg, '누른 탭 색이 바뀌고 아래 판과 같은 색', { before: s0.bulk.bg, after: s1.bulk.bg, panel: s1.bulk.dBg });
    ok(s1.bulk.dTop >= s1.bulk.top + s1.bulk.h && Math.abs(s1.bulk.dW - s1.row.w) <= 2 && s1.row.h > 150, '판은 탭 줄 바로 아래 · 줄 너비 전체', s1);
    const inner = await p.evaluate(() => { const c = document.getElementById('rgb_on'); if (!c) return null; const r = c.getBoundingClientRect(); return { vis: r.width > 0 && r.height > 0, in: !!c.closest('details.regbulk') }; });
    ok(inner && inner.vis && inner.in, '판 안의 「모든 상품에 적용」 칸이 그대로 보임(기능 그대로)', inner);
    await shot(p, `mjui1_bulk_${tag}`);
    // 가격·등록 조건 누름 → 설명 판은 접히고 조건 판이 펼쳐짐
    await p.click('#sheet .rgsetrow > details.regcfg > summary', { position: { x: 20, y: 12 } }); await p.waitForTimeout(300);
    const s2 = await st(p);
    ok(!s2.bulk.open && s2.cfg.open && !s2.ps.open && s2.mem === 'cfg', '⚙ 누르면 📝은 접히고 ⚙만 펼침(한 번에 하나)', s2);
    ok(s2.cfg.top === s0.cfg.top && Math.abs(s2.cfg.left - s0.cfg.left) <= 1 && s2.cfg.bg === s2.cfg.dBg && s2.bulk.bg === s0.bulk.bg, '⚙ 탭도 제자리에서 색만 바뀜 · 📝 탭은 원래 색', s2);
    await shot(p, `mjui1_cfg_${tag}`);
    // 다시 누르면 접힘
    await p.click('#sheet .rgsetrow > details.regcfg > summary', { position: { x: 20, y: 12 } }); await p.waitForTimeout(250);
    const s3 = await st(p);
    ok(!s3.bulk.open && !s3.cfg.open && !s3.ps.open && s3.mem === '' && s3.row.h <= 60, '같은 탭을 다시 누르면 접힘 · 기억도 「접힘」', s3);
    // 저장한 등록 설정 → 다시 그려도 · 새로 열어도 기억
    await p.click('#sheet .rgsetrow > details.rgps > summary', { position: { x: 20, y: 12 } }); await p.waitForTimeout(250);
    await open(p); const s4 = await st(p);
    ok(s4.ps.open && !s4.bulk.open && !s4.cfg.open && s4.ps.top === s0.ps.top, '💾 펼친 채 등록 화면을 다시 열어도 💾 펼침(이 기기 기억)', s4);
    await shot(p, `mjui1_ps_${tag}`);
    // 설명서 「이 기능으로 가기」처럼 코드가 펼쳐도 하나만
    await p.evaluate(() => { document.querySelector('#sheet .rgsetrow > details.regbulk').open = true; }); await p.waitForTimeout(250);
    const s5 = await st(p); ok(s5.bulk.open && !s5.ps.open && s5.mem === 'bulk', '코드로 펼쳐도(설명서 가기) 하나만 · 기억 따라감', s5);
    // 넘침
    ok(s5.sw <= s5.iw + 1, '가로 넘침 없음', { sw: s5.sw, iw: s5.iw });
    if (ph) { const o = await p.evaluate(() => { const W = innerWidth + 1; return [...document.querySelectorAll('#sheet .rgsetrow > details > summary')].filter((e) => e.getBoundingClientRect().right > W).length; }); ok(o === 0, '휴대폰: 세 탭 모두 화면 안', o); }
    // 어두운 모양(웹앱에 data-theme="dark"가 생기면) — 사진만
    await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; }); await p.waitForTimeout(150);
    const dk = await p.evaluate(() => getComputedStyle(document.querySelector('#sheet .rgsetrow > details.regbulk')).backgroundColor);
    ok(dk === 'rgb(31, 51, 32)', '어두운 모양: 판 색이 어두운 연두', dk);
    await shot(p, `mjui1_dark_${tag}`); await p.evaluate(() => { delete document.documentElement.dataset.theme; });
    ok(!dlg.length, '브라우저 팝업(alert·confirm·prompt) 없음', dlg);
  }, { vp });
  await run({ width: 1400, height: 900 }, 'pc');
  await run({ width: 390, height: 844 }, 'phone');
  console.log(bad ? `❌ tMJUI1113 ${bad}개 실패` : '✓ tMJUI1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
