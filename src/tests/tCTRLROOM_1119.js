// tCTRLROOM_1119 — (정범님 I-1119-1552-16·1557-17) 🛰 관제소 판 ①: 모든 묶음을 한곳에서 고르기
//  ① 글: 함수 · 들어가는 길 다섯 · 권한(pt_batch) · replaceState · PAGE_GUIDES · FEAT · PG_SCR · 설명서 · 브라우저 창 없음 · 전화번호 모양 없음
//  ② 화면(RN_PORT): 묶음 1개·9개 띠 · 바꾸면 replaceState(기록 길이 그대로) · 풀린 묶음 안내 · 권한 없으면 단추 숨김 · 폭 380·760에서 가로 넘침 없음
// 실행: pw/ 안 RN_PORT=<포트> node tCTRLROOM_1119.js · 시험 자료는 「묶음A」 같은 가짜 이름만
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
console.log('① 글');
{ const a = T.indexOf('◆ctrlroom 시작'); const b = T.indexOf('◆ctrlroom 끝'); ok(a > 0 && b > a, '관제소 블록 표시(◆ctrlroom 시작·끝)');
  const NEW = a > 0 && b > a ? T.slice(a, b) : '';
  ok(/ctrlRoomOk = /.test(NEW) && /ctrlPins = /.test(NEW), '함수 ctrlRoomOk · ctrlPins');
  for (const fn of ['ctrlRoomApply', 'ctrlRecent', 'ctrlNote', 'ctrlFolds', 'bkfSwHtml', 'bkfSwitch', 'bkfSwBind', 'ctrlSwRepaint', 'ctrlGone', 'openCtrlRoom', 'ctrlPin', 'ctrlAllOpen', 'ctrlAllClose']) ok(new RegExp('function ' + fn + '\\(').test(NEW), `함수 ${fn}`);
  ok(/pt_batch/.test(NEW) && /S\.ptOnly/.test(NEW), '권한: 휴대폰 상품 탭 카드 고르기(pt_batch)를 그대로 따름');
  ok(/history\.replaceState/.test(NEW), '묶음을 바꿀 때 기록을 쌓지 않음(replaceState)');
  ok(/_bkfold|pin/.test(NEW) && /runTransaction/.test(NEW), '★ 고정은 트랜잭션으로 묶음 문서 pin에 저장');
  ok(/rn-bkf-recent/.test(NEW), '최근 본 묶음은 기기 저장');
  ok(/data-ux2qa="ctrl"/.test(T) && /openCtrlRoom\(\)/.test(T), '길 ① 헤더 검색 옆 단추');
  ok(/id="bslot_ctrl"/.test(T), '길 ② 상품 탭 「수동 일괄 처리 그룹」 카드 단추');
  ok(/id="hctrl"/.test(T), '길 ③ ☰ 더 보기 단추');
  ok(/'🛰 관제소'/.test(T) && /go: \{ fn: \(\) => openCtrlRoom\(\)/.test(T), '길 ④ 🔍 기능 찾기(FEAT)');
  ok(/\['bkfold', '🛰 관제소', \(d\) => d\.bkfold, 'openCtrlRoom'\]/.test(T), '길 ⑤ 🧭 모든 화면 지도(PG_SCR)');
  ok(/PAGE_GUIDES\['bkfold'\]|'bkfold':/.test(T) && /#bkf_scr \.csw/.test(T), '화면 안내(PAGE_GUIDES)에 묶음 고르기 띠');
  ok(/🛰 관제소 — 모든 묶음을 한곳에서 고르기/.test(T), '설명서 한 쪽');
  ok(/max-width:380px\)\{\.ux2qa\{flex-wrap:wrap\}/.test(T), '폭 380 이하 단추 줄바꿈');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tCTRLROOM_1119 ${bad}개 실패` : '✓ tCTRLROOM_1119 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SEED = async function (d10, n) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
  const ids = ['gA', 'gB', 'gC']; for (const id of ids) await put(id, '그룹' + id);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gC'); i++) await new Promise((r) => setTimeout(r, 150));
  const fids = []; for (let i = 0; i < n; i++) { const a = await bkfTx({ t: 'new', name: '묶음' + String.fromCharCode(65 + i) }); fids.push(a.fid); if (i === 0) await bkfTx({ t: 'put', fid: a.fid, gids: ids }); }
  return fids; };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const d10 = new Date(Date.now() - 10 * 864e5).toISOString();
  let fids = await p.evaluate(async ([src, d, n]) => (eval('(' + src + ')'))(d, n), [SEED.toString(), d10, 1]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f]), fids[0])) break; await Wt(p, 150); }
  await p.evaluate((f) => openCtrlRoom(f), fids[0]); await Wt(p, 600);
  let m = await p.evaluate(() => ({ csw: !!document.querySelector('#bkf_scr .csw'), chips: document.querySelectorAll('#bkf_scr .csw [data-bkf]').length, all: !!document.querySelector('#bkf_scr .csw-all') }));
  ok(m.csw && m.chips === 1, '묶음 1개: 띠가 있고 칩 1개', m); ok(!m.all, '묶음 1개: ▾ 모두 단추는 없음', m);
  // 묶음 9개로 늘림
  const more = await p.evaluate(async () => { const r = []; for (let i = 1; i < 9; i++) { const a = await bkfTx({ t: 'new', name: '묶음' + String.fromCharCode(65 + i) }); r.push(a.fid); } return r; });
  fids = fids.concat(more); await Wt(p, 800);
  await p.evaluate((f) => openCtrlRoom(f), fids[0]); await Wt(p, 600);
  m = await p.evaluate(() => ({ chips: document.querySelectorAll('#bkf_scr .csw [data-bkf]').length, all: !!document.querySelector('#bkf_scr .csw-all') }));
  ok(m.chips >= 8, '묶음 9개: 칩이 여러 개', m); ok(m.all, '묶음 9개: ▾ 모두 단추가 생김', m);
  // 바꾸면 기록이 쌓이지 않음
  const h0 = await p.evaluate(() => history.length);
  await p.evaluate((f) => bkfSwitch(f), fids[2]); await Wt(p, 500);
  const h1 = await p.evaluate(() => ({ len: history.length, det: S.detail && S.detail.bkfold }));
  ok(h1.len === h0 && h1.det === fids[2], '묶음을 바꿔도 기록 길이 그대로(replaceState) · 지금 묶음이 바뀜', { h0, h1 });
  // 풀린 묶음 안내
  await p.evaluate(async (f) => { await bkfTx({ t: 'del', fid: f }); }, fids[2]).catch(() => {}); await Wt(p, 800);
  m = await p.evaluate(() => ({ csw: !!document.querySelector('#bkf_scr .csw'), scr: !!document.getElementById('bkf_scr') }));
  ok(m.scr && m.csw, '묶음이 풀려도 화면이 굳지 않고 띠가 남음', m);
  // 가로 넘침
  for (const w of [380, 760]) { await p.setViewportSize({ width: w, height: 900 }); await p.evaluate((f) => openCtrlRoom(f), fids[0]); await Wt(p, 600);
    const o = await p.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, r: (document.querySelector('#bkf_scr .csw') || { getBoundingClientRect: () => ({ right: 0 }) }).getBoundingClientRect().right }));
    ok(o.sw <= o.iw && o.r <= o.iw + 1, `폭 ${w}: 가로 넘침 없음`, o); }
  // 권한: pt_batch 카드가 없으면 단추 숨김
  const hid = await p.evaluate(() => { const had = S.ptOnly; S.ptOnly = new Set(['pt_other']); ctrlRoomApply(); const hidden = [...document.querySelectorAll('[data-ctrlroom],[data-ux2qa="ctrl"]')].every((e) => e.hidden || e.hasAttribute('hidden')); S.ptOnly = had; ctrlRoomApply(); return hidden; });
  ok(hid, '권한이 없으면 관제소 단추가 모두 숨겨짐');
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tCTRLROOM_1119 ${bad}개 실패` : '✓ tCTRLROOM_1119 통과'); return bad; });
