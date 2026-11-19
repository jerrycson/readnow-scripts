// tPANEL3_1119 — (정범님 11/19 I-1119-1247-09) 🧮 수동 일괄 👁 살핀 상품 패널 · 🔖 판본 확인 목록 여섯
//  ① 「판본 확인」(목록 화면) → 뒤로 오면 살핀 패널이 다시 보이고 접힘·펼침 그대로
//  ② 살핀 패널 안에 「🔖 판본 확인 목록 n개」 단추
//  ③ 목록 숫자 = 그룹의 🔖 판본 키워드 탭 숫자(전엔 기계가 '사람 확인'으로 정한 것만 세서 0)
//  ④ 다른 화면으로 가지 않고 수동 일괄 안의 떠 있는 창 · ✕ 닫기 · Esc 닫기 · 브라우저 팝업 없음
//  ⑤ 접으면 머리줄 전체(제목·단추 둘)가 잘리지 않고 보임
//  ⑥ 머리줄 두 번 누르기 = 접기/펴기 · 한 번 누르기(접기 단추)는 그대로
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> node tPANEL3_1119.js · 시험 자료에 손님 정보 없음
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path');
const H = require('./harness.js');
const NK = 12; /* 판본 키워드 탭에 모은 상품 수 */
const setup = async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(async (NK) => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); window.ask = async () => true; window.__DLG = 0; window.alert = window.confirm = window.prompt = () => { window.__DLG++; return true; };
    try { Object.keys(localStorage).filter((k) => /^rn-seenp-fold|^rn-edwin/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
    const now = new Date().toISOString(); const pc = { watchVer: '0.10.47', watchTab: 't', watchPc: 'TEST', watchBeat: now, batchOff: { bQ: true } }; await db.collection('prd_system').doc('pricing').set(pc, { merge: true }); S.prCfg = pc;
    const A0 = [...S.plist.values()].filter((l) => l.active); for (let j = 0; j < 40; j++) { const b = A0[j % A0.length]; const u = 'UZ' + (2000 + j); S.plist.set('aladin_' + u, { ...b, id: 'aladin_' + u, usedCode: u, active: true, title: j < 20 ? `시험책 ${j} (양장)` : `시험책 ${j}`, price: 10000 + j * 100 }); }
    const L = [...S.plist.values()].filter((l) => /^UZ2/.test(l.usedCode)); S.pmetrics = S.pmetrics || new Map(); L.forEach((l, j) => { l.bookId = 'bz' + j; S.pmetrics.set('bz' + j, { availability: 'onSale', salesPoint: 100 + j }); });
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 300, reasons: ['시험'], page1: [], at: now, out: false, critOff: true })); S.batchId = 'bQ'; S.prBatches = [{ id: 'bQ', name: '시험 그룹' }];
    const k = (j) => 'aladin_' + L[j].usedCode; const edkw = {}; for (let j = 0; j < NK; j++) edkw[k(j)] = { from: 'sel', at: now, kw: ['양장'] };
    S.batchSt = { start: {}, picks: {}, decided: {}, held: {}, trashed: {}, added: {}, edkw }; S.batchEdit = {}; S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.batchSubP = 'all'; S.bqWhy = null; S.bqOpen = new Set(); S.bqAddQ = '';
    try { localStorage.removeItem('rn-bq-view'); localStorage.setItem('rn-bbase', 'cur'); localStorage.setItem('rn-bpct', '100'); } catch (e) {} S.batchBase = null; S.batchPctB = null; window.__EDK = Object.keys(edkw);
    openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '시험 그룹' }))); await W(900); }, NK); };
const PANEL = () => { const el = document.getElementById('seenp'); if (!el || el.style.display === 'none') return null; const r = el.getBoundingClientRect(); const h = el.querySelector('.seenp-h'); const hr = h ? h.getBoundingClientRect() : null;
  const kids = h ? [...h.children].map((c) => { const q = c.getBoundingClientRect(); return { t: c.tagName, w: Math.round(q.width), l: Math.round(q.left), r: Math.round(q.right), sw: c.scrollWidth, cw: c.clientWidth }; }) : [];
  const edl = el.querySelector('.seenp-edl'); return { fold: el.classList.contains('fold'), ico: el.classList.contains('ico'), r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], cw: el.clientWidth, sw: el.scrollWidth, ch: el.clientHeight, sh: el.scrollHeight, hr: hr && [Math.round(hr.left), Math.round(hr.top), Math.round(hr.right), Math.round(hr.bottom)], kids, edl: edl ? edl.textContent.replace(/\s+/g, ' ').trim() : null }; };
const fullHead = (a) => a && a.hr && a.hr[0] >= a.r[0] - 1 && a.hr[2] <= a.r[2] + 1 && a.hr[1] >= a.r[1] - 1 && a.hr[3] <= a.r[3] + 1 && a.sw <= a.cw + 1 && a.sh <= a.ch + 1 && a.kids.filter((c) => c.t === 'BUTTON').every((c) => c.r <= a.r[2] + 1 && c.l >= a.r[0] - 1 && c.w >= 20) && a.r[1] >= 0 && a.r[3] <= 2000;
const CASE = async (p, nm, shot) => {
  // ② 패널 안 단추 · ③ 숫자
  const a = await p.evaluate(PANEL); const tabN = await p.evaluate(() => { const b = document.querySelector('[data-btab="edkw"] b, [data-btab="edkw"]'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
  ok(a && /🔖 판본 확인 목록/.test(a.edl || '') && new RegExp(`\\b${NK}\\b`).test(a.edl), `${nm} ② 살핀 패널 안에 「🔖 판본 확인 목록 ${NK}개」 단추`, { a, tabN });
  // ③ ④ 떠 있는 창
  const w = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const href = location.href, nav = (S.navStack || []).length, det = S.detail; document.querySelector('#seenp .seenp-edl').click(); await W(1500); const el = document.getElementById('edwin');
    const o = { open: !!el && el.style.display !== 'none', same: location.href === href && S.detail === det && (S.navStack || []).length === nav && !!document.getElementById('b_res'), ttl: el ? el.querySelector('.edwin-h b').textContent : '', rows: el ? el.querySelectorAll('.edwin-l > .card').length : -1, x: !!(el && el.querySelector('[data-ew="x"]')) };
    const r = el && el.getBoundingClientRect(); o.inView = !!r && r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0; o.overPanel = (() => { const sp = document.getElementById('seenp'); return !!el && +getComputedStyle(el).zIndex > +getComputedStyle(sp).zIndex; })();
    o.ids = el ? [...el.querySelectorAll('.edwin-l [data-edpick], .edwin-l [data-lid], .edwin-l [data-id]')].length : 0; return o; });
  ok(w.open && w.same, `${nm} ④ 다른 화면으로 가지 않고 수동 일괄 안에 떠 있는 창으로 열림`, w);
  ok(new RegExp(`\\(${NK}\\)`).test(w.ttl) && w.rows === NK, `${nm} ③ 창 숫자·줄 = 🔖 판본 키워드 탭 ${NK}개(전엔 0)`, w);
  ok(w.x && w.inView && w.overPanel, `${nm} ④ ✕ 단추 · 화면 안 · 살핀 패널 위`, w);
  if (shot) await p.screenshot({ path: shot + '-win.png' });
  const x = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector('#edwin [data-ew="x"]').click(); await W(300); const a = !document.getElementById('edwin');
    document.querySelector('#seenp .seenp-edl').click(); await W(1200); const b = !!document.getElementById('edwin'); document.body.focus(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await W(300); return { a, b, c: !document.getElementById('edwin'), det: !!(S.detail && S.detail.batch) }; });
  ok(x.a && x.b && x.c && x.det, `${nm} ④ ✕로 닫힘 · 다시 열고 Esc로 닫힘 · 수동 일괄 그대로`, x);
  // ⑤ 접으면 머리줄 전체
  const f = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); document.querySelector('#seenp [data-sp="fold"]').click(); await W(400); return null; });
  const fa = await p.evaluate(PANEL); if (shot) await p.screenshot({ path: shot + '-fold.png' });
  ok(fa && fa.fold && fullHead(fa), `${nm} ⑤ 접으면 머리줄 전체(제목·▴·▁)가 잘리지 않고 보임`, fa);
  // ① 판본 확인 화면 → 뒤로 → 패널 다시(접힘 그대로)
  const rv = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); await openEdCheckList(); await W(900); const away = { det: S.detail && !S.detail.batch, panel: (() => { const e = document.getElementById('seenp'); return !!e && e.style.display !== 'none'; })() }; history.back(); await W(2200);
    const e = document.getElementById('seenp'); return { away, back: !!(S.detail && S.detail.batch), on: !!e && e.style.display !== 'none', fold: !!e && e.classList.contains('fold'), cfg: !!SEENP.cfg }; });
  ok(rv.back && rv.on && rv.cfg, `${nm} ① 판본 확인 목록 화면 → 뒤로 → 살핀 패널 다시 보임`, rv);
  ok(rv.fold, `${nm} ① 접어 둔 패널은 다시 보일 때도 접힌 채`, rv);
  // ⑥ 머리줄 두 번 누르기
  const d = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const el = document.getElementById('seenp'); const t = el.querySelector('.seenp-ttl') || el.querySelector('.seenp-h b'); const r = t.getBoundingClientRect(); const x = r.left + Math.min(10, r.width / 2), y = r.top + r.height / 2;
    const fire = (tp) => t.dispatchEvent(new MouseEvent(tp, { bubbles: true, clientX: x, clientY: y, detail: tp === 'dblclick' ? 2 : 1 })); const f0 = el.classList.contains('fold'); fire('click'); await W(150); const f1 = document.getElementById('seenp').classList.contains('fold');
    fire('click'); fire('dblclick'); await W(300); const f2 = document.getElementById('seenp').classList.contains('fold'); const el2 = document.getElementById('seenp'); const t2 = el2.querySelector('.seenp-ttl') || el2.querySelector('.seenp-h b'); const r2 = t2.getBoundingClientRect();
    t2.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r2.left + 5, clientY: r2.top + r2.height / 2, detail: 2 })); await W(300); const f3 = document.getElementById('seenp').classList.contains('fold');
    document.querySelector('#seenp [data-sp="fold"]').click(); await W(300); const f4 = document.getElementById('seenp').classList.contains('fold'); return { f0, f1, f2, f3, f4 }; });
  ok(d.f0 === d.f1, `${nm} ⑥ 머리줄 한 번 누르기만으로는 접힘이 바뀌지 않음`, d);
  ok(d.f2 !== d.f1 && d.f3 === d.f1, `${nm} ⑥ 머리줄 두 번 누르기 = 접기/펴기 바꿈(두 번 하면 처음대로)`, d);
  ok(d.f4 !== d.f3, `${nm} ⑥ 접기 단추 한 번 누르기는 그대로 됨`, d);
  ok((await p.evaluate(() => window.__DLG)) === 0, `${nm} 브라우저 창(alert·confirm·prompt) 없음`);
};
(async () => {
  // 정적 — 따로 낱말 표 없이 edOf·edCandsOf·edListRow를 씀(F63)
  { const src = fs.readFileSync(process.env.RN_APP || path.join(__dirname, '..', 'app.html'), 'utf8'); const cut = (a, b) => { const i = src.indexOf(a); return i < 0 ? '' : src.slice(i, src.indexOf(b, i + a.length)); };
    const w = cut('function edWinShown(', 'function edWinDraw('); const bx = cut("edWinCtx({ key: 'batch:'", 'seenPanelUse(');
    ok(/edCandsOf\(/.test(w) && /edListRow/.test(w) && !/리커버|한정판|양장/.test(w), '정적: 창은 edCandsOf·edListRow를 그대로 씀(따로 낱말 표 없음)');
    ok(/edKwOn\(/.test(src.slice(src.indexOf('let edIxC'), src.indexOf('let edIxC') + 600)) && /'edkw'/.test(src.slice(src.indexOf('let edIxC'), src.indexOf('let edIxC') + 400)), '정적: 수동 일괄 목록 = 🔖 판본 키워드 탭(cls edkw) · 비면 edKwOn(edOf)');
    ok(!/\b(alert|confirm|prompt)\(/.test(cut('const EDW = {', 'function edWinDraw(')), '정적: 창 코드에 브라우저 팝업 없음'); }
  const shot = process.env.RN_SHOT || '';
  await H(async (p) => { await setup(p); try { await CASE(p, '넓은 화면', shot && shot + '-w'); } catch (e) { ok(false, '넓은 화면 시험 안 오류', String(e && e.stack || e)); } });
  await H(async (p) => { await setup(p); try { await CASE(p, '휴대폰', shot && shot + '-m'); } catch (e) { ok(false, '휴대폰 시험 안 오류', String(e && e.stack || e)); } }, { vp: { width: 390, height: 844 }, touch: true });
  console.log(bad ? `❌ tPANEL3_1119 ${bad}개 실패` : '✓ tPANEL3_1119 통과'); process.exitCode = bad ? 1 : 0;
})();
