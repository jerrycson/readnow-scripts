// tMJUI2_1113 — (11/13 MJ님 요청) 📥 상품 등록 › ⚙ 가격·등록 조건 펼친 판 안을 선으로 나뉜 2열 표로
//  왼쪽 제목 칸(폭 고정) · 오른쪽 세부 내용 칸 · 줄마다 가로선 · 제목과 세로선이 줄 높이 전체 · 내용은 오른쪽 칸 안에서만 · 휴대폰 폭은 제목 위·내용 아래로 쌓임
//  겉모양만 — 안의 값·저장·적용 동작은 그대로(추천가 방식 단추·검색창 칸이 예전처럼 값을 바꿈)
// 실행: cd pw && RN_PORT=<포트> RN_APP=<app.html> node tMJUI2_1113.js (harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음 · 사진은 RN_SHOTS 폴더(없으면 건너뜀)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const SHOTS = process.env.RN_SHOTS || '';
const P = 'html .rgsetrow.rgtabs.rgtabs>details.regcfg>.bform';
console.log('① 코드 꼴');
ok(T.includes(P + '{--rgc-lw:') && T.includes(P + '>.brow{position:relative'), '⚙ 판 안 = 2열 표(제목 칸 폭 --rgc-lw)');
ok(T.includes(P + '>.brow>label:first-child{position:absolute') && /border-right:1px solid var\(--line\)/.test(T), '제목 칸 = 왼쪽 고정 · 세로선');
ok(/@media \(max-width:560px\)\{html \.rgsetrow\.rgtabs\.rgtabs>details\.regcfg>\.bform>\.brow\{/.test(T), '휴대폰 폭 = 제목 위·내용 아래');
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tMJUI2_1113 ${bad}개 실패` : '✓ tMJUI2_1113 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const shot = async (p, n) => { if (!SHOTS) return; try { fs.mkdirSync(SHOTS, { recursive: true }); const vp0 = p.viewportSize(); await p.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /시장 지표/.test(e.textContent || '') && !e.closest('#sheet')) e.style.display = 'none'; } }); /* 사진에서 떠 있는 '시장 지표' 알림만 가림(사진용) */
      const el = await p.$('#sheet > .rgsetrow'); const hh = await el.evaluate((x) => x.getBoundingClientRect().height); await p.setViewportSize({ width: vp0.width, height: Math.min(Math.ceil(hh) + 400, 6000) }); await p.waitForTimeout(300); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: path.join(SHOTS, n + '.png') }); await p.setViewportSize(vp0); await p.waitForTimeout(200); console.log('  📷', n); } catch (e) { console.log('  (사진 못 찍음)', e.message); } };
  const measure = (p) => p.evaluate(() => { const f = document.querySelector('#sheet .rgsetrow > details.regcfg > .bform'); if (!f) return null; const fr = f.getBoundingClientRect();
    const rows = [...f.querySelectorAll(':scope > .brow')].map((r) => { const rr = r.getBoundingClientRect(); const l = r.querySelector(':scope > label:first-child'); const lr = l.getBoundingClientRect(); const cs = getComputedStyle(r); const ls = getComputedStyle(l);
      const rg = document.createRange(); rg.setStartAfter(l); rg.setEnd(r, r.childNodes.length); const kids = [...rg.getClientRects()].filter((k) => k.width > 0 && k.height > 0); /* 글 조각(텍스트)까지 — 내용이 글로 시작하는 줄도 셈 */
      return { t: l.textContent.trim().slice(0, 16), rTop: Math.round(rr.top), rBot: Math.round(rr.bottom), rL: Math.round(rr.left), rR: Math.round(rr.right), lTop: Math.round(lr.top), lBot: Math.round(lr.bottom), lL: Math.round(lr.left), lR: Math.round(lr.right), lW: Math.round(lr.width), lOver: l.scrollHeight - l.clientHeight, bb: cs.borderBottomStyle + ' ' + cs.borderBottomWidth, br: ls.borderRightStyle, kidL: kids.length ? Math.round(Math.min(...kids.map((k) => k.left))) : null, kidTop: kids.length ? Math.round(Math.min(...kids.map((k) => k.top))) : null, kidR: kids.length ? Math.round(Math.max(...kids.map((k) => k.right))) : null }; });
    let over = []; for (const el of f.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.width && r.right > fr.right + 1) over.push((el.id || el.tagName) + ':' + Math.round(r.right - fr.right)); }
    return { f: { l: Math.round(fr.left), r: Math.round(fr.right), w: Math.round(fr.width) }, rows, over: over.slice(0, 8), sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  const run = (vp, tag) => H(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(SEED); await p.waitForTimeout(500); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    await p.evaluate(() => { try { localStorage.setItem('rn-rgsettab', 'cfg'); } catch (e) {} S._rgSetTab = undefined; S.regT = 'q'; S.detail = null; openRegister(); }); await p.waitForTimeout(900);
    const ph = vp.width < 560; console.log(`② 화면 ${tag}`);
    const open = await p.evaluate(() => { const d = document.querySelector('#sheet .rgsetrow > details.regcfg'); return !!(d && d.open); }); ok(open, '⚙ 가격·등록 조건 판이 펼쳐짐');
    const m = await measure(p); const R = (m && m.rows) || [];
    ok(R.length >= 7, `제목 줄 ${R.length}개(추천가 방식·기본값 판매가·화면 다시 그리기·기준·목표 자리 … 검색창·관리 코드 기준)`, R.map((r) => r.t));
    ok(R.every((r) => /solid 1px/.test(r.bb)), '줄마다 가로선(실선)', R.map((r) => r.bb));
    ok(R.every((r, i) => !i || Math.abs(r.rTop - R[i - 1].rBot) <= 1), '줄 사이 틈 없음(선이 이어짐)', R.map((r) => [r.rTop, r.rBot]));
    ok(m && !m.over.length && m.sw <= m.iw, '판 밖으로 넘치는 것 없음 · 가로 넘침 없음', m && { over: m.over, sw: m.sw, iw: m.iw });
    if (!ph) {
      const w0 = R[0] && R[0].lW;
      ok(R.every((r) => Math.abs(r.lW - w0) <= 1 && Math.abs(r.lL - r.rL) <= 1), `제목 칸 폭 고정(${w0}px) · 왼쪽 끝 맞춤`, R.map((r) => [r.t, r.lL - r.rL, r.lW]));
      ok(R.every((r) => r.br === 'solid' && Math.abs(r.lTop - r.rTop) <= 1 && Math.abs(r.lBot - r.rBot) <= 1), '제목 칸 세로선이 줄 높이 전체(위아래 이어짐)', R.map((r) => [r.t, r.lTop - r.rTop, r.lBot - r.rBot]));
      ok(R.every((r) => r.kidL == null || r.kidL >= r.lR + 4), '세부 내용은 모두 오른쪽 칸 안(제목 칸 밑으로 내려가지 않음)', R.map((r) => [r.t, r.lR, r.kidL]));
      const xs = R.filter((r) => r.kidL != null).map((r) => r.kidL); ok(Math.max(...xs) - Math.min(...xs) <= 2, '세부 내용 왼쪽 끝이 모든 줄에서 같음(세로 정렬)', xs);
      ok(R.every((r) => r.lOver <= 1), '긴 제목도 제 칸 안(넘치지 않음)', R.map((r) => [r.t, r.lOver]));
    } else {
      ok(R.every((r) => r.kidTop == null || r.kidTop >= r.lBot - 1), '휴대폰: 제목 위 · 내용 아래로 쌓임', R.map((r) => [r.t, r.lBot, r.kidTop]));
      ok(R.every((r) => r.lW >= (m.f.w - 40)), '휴대폰: 제목이 줄 너비 전체', R.map((r) => [r.t, r.lW, m.f.w]));
    }
    await shot(p, `mjui2_cfg_${tag}`);
    // 기능 그대로 — 추천가 방식 단추 · 검색창 칸
    const f1 = await p.evaluate(async () => { const was = regCfg().recMode; const b = document.querySelector('#sheet .regcfg [data-rgrec="crit"]'); b.click(); await new Promise((r) => setTimeout(r, 400)); const a = regCfg().recMode; const v = document.querySelector('#sheet .regcfg [data-rgrec="value"]'); v.click(); await new Promise((r) => setTimeout(r, 400)); return { was, a, back: regCfg().recMode, still: !!(document.querySelector('#sheet .rgsetrow > details.regcfg') || {}).open }; });
    ok(f1.a === 'crit' && f1.back !== 'crit' && f1.still, '추천가 방식 단추가 예전처럼 값을 바꿈 · 판은 펼친 채', f1);
    const f2 = await p.evaluate(async () => { const i = document.getElementById('rg_qmax'); const was = regCfg().queueMax; i.value = String((+was || 30) + 1); i.dispatchEvent(new Event('change', { bubbles: true })); i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => setTimeout(r, 400)); const a = regCfg().queueMax; const j = document.getElementById('rg_qmax'); j.value = String(was); j.dispatchEvent(new Event('change', { bubbles: true })); j.dispatchEvent(new Event('input', { bubbles: true })); await new Promise((r) => setTimeout(r, 400)); return { was, a, back: regCfg().queueMax }; });
    ok(+f2.a === (+f2.was || 30) + 1 && +f2.back === +f2.was, '검색창 「조회 대기」 칸이 예전처럼 저장됨', f2);
    ok(!dlg.length, '브라우저 팝업(alert·confirm·prompt) 없음', dlg);
  }, { vp, ...(vp.width < 560 ? { touch: true } : {}) });
  await run({ width: 1400, height: 1000 }, 'pc');
  await run({ width: 390, height: 844 }, 'phone');
  console.log(bad ? `❌ tMJUI2_1113 ${bad}개 실패` : '✓ tMJUI2_1113 모두 통과'); process.exit(bad ? 1 : 0);
})();
