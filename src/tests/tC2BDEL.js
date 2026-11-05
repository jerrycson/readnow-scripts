// tC2BDEL — 정범님 11/05 '등록으로 되돌리기 하면 바로 알라딘 장바구니에서도 삭제' 수집기 쪽: 🛒 팔기 장바구니에서 빼기(shp_cmds c2bDel)
//  가짜 팔기 장바구니 화면(jsdom · parseC2BCart와 같은 tr.item[pkid] 줄) + 가짜 Firestore — 빼기 성공 · 줄 없음(누르지 않음) · 단추 없음 멈춤(probe) · 수량 2 → 1 · 같은 ISBN 두 줄은 한 줄만 · 선택 삭제 · 사람 속도(PACE.wait(sleep)) · 담기 취소된 책은 담지 않음
//  쓰는 법: node tC2BDEL.js (작업 폴더 pw/ 안 — jsdom이 있는 곳)
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const SRC = pick(path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')); const src = fs.readFileSync(SRC, 'utf8');
const PCORE = fs.readFileSync(pick(path.join(__dirname, '../../readnow-products-core.js'), path.join(__dirname, '../readnow-products-core.js')), 'utf8');
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a); const j = s.indexOf(b, i); if (j < 0) throw new Error('못 찾음: ' + b); return s.slice(i, j + b.length); };
const CODE = (() => { const i = src.indexOf('  const C2B_SEARCH = '); const j = src.indexOf('(10/26) 💬', i); if (i < 0 || j < 0) throw new Error('수집기에서 팔기 장바구니 코드를 못 찾음'); return src.slice(i, src.lastIndexOf('\n', j)); })();
function fakeFb() { const store = {}; const FV = { serverTimestamp: () => ({ __ts: 1 }), arrayUnion: (...a) => ({ __au: a }), delete: () => ({ __del: 1 }) };
  const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__au) o[k] = [...(o[k] || []), ...x.__au]; else if (x && x.__del) delete o[k]; else if (x && typeof x === 'object' && !Array.isArray(x)) o[k] = merge(o[k] && typeof o[k] === 'object' ? o[k] : {}, x); else o[k] = JSON.parse(JSON.stringify(x)); } return o; };
  const doc = (col, id) => { const p = col + '/' + id; return { id, get: async () => ({ exists: !!store[p], data: () => (store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined) }), set: async (v, o) => { store[p] = o && o.merge ? merge(store[p], v) : merge({}, v); } }; };
  return { store, FV, C: (c) => ({ doc: (id) => doc(c, id) }) }; }
/* 가짜 팔기 장바구니 — 줄 = { pk, isbn, qty, del(줄 안 삭제 단추), qtyIn(수량 칸), chg(변경 단추), chk(체크칸) } · page.sel = 화면의 '선택 삭제' */
function cartHtml(S) { return `<html><body><table><tbody>${S.rows.map((r) => `<tr class="item" pkid="${r.pk}" itemid="${r.pk}0"><td>${r.chk ? `<input type="checkbox" name="chk" value="${r.pk}">` : ''}</td><td class="c2b_td_int"><div class="c2b_bbb"><strong>시험 책 ${r.pk}</strong></div>ISBN13 : ${r.isbn} ISBN10 : ${r.isbn.slice(3, 12)}0</td><td>${r.qtyIn ? `<input type="text" name="qty_${r.pk}" class="qty" value="${r.qty}">` : `<span>수량 ${r.qty}</span>`}${r.chg ? `<a href="#" class="btn_chg" data-pk="${r.pk}">변경</a>` : ''}</td><td>${r.del ? `<a href="#" class="btn_del" data-pk="${r.pk}"><img alt="삭제" src="x.gif"></a>` : '<span>보관</span>'}</td></tr>`).join('')}</tbody></table>${S.sel ? '<a href="#" class="btn_seldel">선택 삭제</a>' : ''}<a href="#" class="btn_order">매입 신청</a></body></html>`; }
async function run(name, S0, items, opt) { opt = opt || {}; const F = fakeFb(); const S = JSON.parse(JSON.stringify(S0)); const clicks = []; let paced = 0, badPace = 0; const LG = [];
  const dom = new JSDOM('<html><body></body></html>', { url: 'https://www.aladin.co.kr/shop/usedshop/wc2b_sales.aspx?search=1', runScripts: 'outside-only' }); const w = dom.window;
  w.eval(PCORE); const P = w.ReadnowProducts;
  const env = { P, PACE: { wait: async (s) => { paced++; if (typeof s !== 'function') badPace++; } }, sleep: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 15))), log: (m, l) => LG.push(m), nowIso: () => new Date().toISOString(), TS: () => 'TS', PC_NAME: 'PC-T', looksLoggedOut: () => false, firebase: { firestore: { FieldValue: F.FV } }, C: F.C,
    lookDoc: async () => ({ doc: new w.DOMParser().parseFromString(cartHtml(S), 'text/html'), finalUrl: 'https://www.aladin.co.kr/shop/usedshop/wc2b_sales.aspx' }), exBegin: async () => ({ ok: true }), exEnd: async () => {}, db: {}, auth: {}, c2bAddOne: null };
  w.__rnById = (id) => w.document.getElementById(id); w.__ENV = env;
  /* 숨은 창 = 같은 jsdom 안 iframe에 가짜 장바구니를 그리고, 단추를 누르면 가짜 알라딘처럼 확인 창(confirm)을 묻고 줄을 바꿈 */
  w.__frame = async (url, ready) => { const f = w.document.createElement('iframe'); f.id = 'rn-c2b-frame'; w.document.body.appendChild(f); const d = f.contentDocument; d.open(); d.write(cartHtml(S)); d.close(); const fw = f.contentWindow;
    d.addEventListener('click', (e) => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); clicks.push(a.className);
      if (a.classList.contains('btn_del')) { if (!fw.confirm('선택한 상품을 삭제하시겠습니까?')) return; S.rows = S.rows.filter((r) => r.pk !== a.dataset.pk); }
      else if (a.classList.contains('btn_chg')) { const r = S.rows.find((x) => x.pk === a.dataset.pk); const v = +d.querySelector(`[name="qty_${r.pk}"]`).value; if (v > 0) r.qty = v; fw.alert('수량이 변경되었습니다.'); }
      else if (a.classList.contains('btn_seldel')) { const on = [...d.querySelectorAll('input[type=checkbox]:checked')].map((x) => x.value); if (!fw.confirm('삭제할까요?')) return; S.rows = S.rows.filter((r) => !on.includes(r.pk)); } });
    return { ok: true, f, doc: d }; };
  const code = CODE.replace('function c2bFrame(url, ready) {', 'function c2bFrame__real(url, ready) {').replace('  const C2B_SEARCH = ', '  const c2bFrame = (u, r) => window.__frame(u, r);\n  const C2B_SEARCH = ');
  w.eval(`(function(){ const { P, PACE, sleep, log, nowIso, TS, PC_NAME, looksLoggedOut, firebase, C, lookDoc, exBegin, exEnd, db, auth } = window.__ENV; ${code}\n window.__del = c2bDelCmd; window.__add = c2bAddCmd; })();`);
  F.store['prd_system/buyback'] = opt.bb || {};
  const ref = { id: 'cmdD', set: async (v) => { F.store['shp_cmds/cmdD'] = { ...(F.store['shp_cmds/cmdD'] || {}), ...JSON.parse(JSON.stringify(v)) }; } };
  if (opt.add) { w.__add = w.__add; await w.__add(ref, { items, createdAt: opt.createdAt }); } else await w.__del(ref, { items });
  const cmd = F.store['shp_cmds/cmdD'] || {}; const bb = F.store['prd_system/buyback'] || {};
  return { name, cmd, bb, rows: S.rows, clicks, paced, badPace, LG }; }
(async () => {
  const I1 = '9788900000011', I2 = '9788900000028';
  // ① 한 권 — 줄 안 삭제 단추 → 확인 창 예 → 다시 읽어 빠짐
  { const r = await run('one', { rows: [{ pk: 'p1', isbn: I1, qty: 1, del: true }, { pk: 'p2', isbn: I2, qty: 1, del: true }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1; const c = r.bb.cart.U1;
    ok(x.state === 'removed' && x.qty0 === 1 && x.qty1 === 0 && r.rows.length === 1 && r.rows[0].isbn === I2 && r.clicks.join() === 'btn_del', `빼기 성공 — 그 ISBN 줄의 삭제 단추만 누름(${r.clicks.join()}) · 다른 책은 그대로`);
    ok(r.cmd.status === 'done' && c.state === 'removed' && c.del.st === 'removed' && c.del.cmd === 'cmdD' && c.del.qty0 === 1 && c.del.qty1 === 0, '맡김 문서 done · prd_system/buyback cart.U1 state removed · del{st, cmd, qty}');
    ok(r.paced >= 2 && r.badPace === 0, `사람 속도 — PACE.wait(sleep) ${r.paced}번 · sleep을 안 넘긴 것 ${r.badPace}`); }
  // ② 장바구니에 그 책이 없음 → 누르지 않고 removed(이미 없음)
  { const r = await run('none', { rows: [{ pk: 'p2', isbn: I2, qty: 1, del: true }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1;
    ok(x.state === 'removed' && x.none && !r.clicks.length && r.rows.length === 1, '줄 없음 — 아무것도 누르지 않음 · 이미 없음으로 적음'); }
  // ③ 줄 안에 삭제 단추·선택 삭제가 없음 → 멈춤(누르지 않음) + 줄·단추 꼴
  { const r = await run('nobtn', { rows: [{ pk: 'p1', isbn: I1, qty: 1, del: false }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1; const c = r.bb.cart.U1;
    ok(x.state === 'delFailed' && /못 찾음/.test(x.msg) && !r.clicks.length && r.rows.length === 1, '단추 없음 — 아무것도 누르지 않고 멈춤: ' + x.msg);
    ok(c.state === 'delFailed' && c.del.st === 'failed' && c.del.probe && c.del.probe.rows === 1 && Array.isArray(c.del.probe.row) && !r.clicks.includes('btn_order'), `까닭과 화면 조각(줄·단추 꼴) 기록 · 다른 단추(매입 신청) 안 누름 — ${JSON.stringify(c.del.probe).slice(0, 120)}`); }
  // ④ 한 줄 수량 2권 → 수량 칸 −1 + 변경(줄은 그대로)
  { const r = await run('qty', { rows: [{ pk: 'p1', isbn: I1, qty: 2, del: true, qtyIn: true, chg: true }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1;
    ok(x.state === 'removed' && x.qty0 === 2 && x.qty1 === 1 && r.rows.length === 1 && r.rows[0].qty === 1 && r.clicks.join() === 'btn_chg' && x.how === 'qty', `수량 2 → 1 — 줄을 통째 지우지 않고 수량만(${r.clicks.join()})`); }
  // ④-2 수량 2권인데 수량 칸이 없음 → 줄을 지우지 않고 멈춤
  { const r = await run('qtyno', { rows: [{ pk: 'p1', isbn: I1, qty: 2, del: true }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1;
    ok(r.rows.length === 1 && r.rows[0].qty === 2 && x.state === 'delFailed' && !r.clicks.length, '수량 칸이 없는 여러 권 — 줄을 통째 지우지 않고 멈춤: ' + (x.msg || '')); }
  // ⑤ 같은 ISBN 두 줄(각 1권) → 한 줄만
  { const r = await run('two', { rows: [{ pk: 'p1', isbn: I1, qty: 1, del: true }, { pk: 'p3', isbn: I1, qty: 1, del: true }] }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1;
    ok(x.state === 'removed' && x.qty0 === 2 && x.qty1 === 1 && r.rows.length === 1 && r.clicks.length === 1, '같은 책 두 줄 → 한 줄(한 권)만 뺌'); }
  // ⑥ 줄 안 삭제 단추 없음 + 그 줄 체크칸 + 화면 '선택 삭제' → 그 줄만 체크하고 선택 삭제
  { const r = await run('sel', { rows: [{ pk: 'p1', isbn: I1, qty: 1, chk: true }, { pk: 'p2', isbn: I2, qty: 1, chk: true }], sel: true }, [{ usedCode: 'U1', isbn13: I1 }]); const x = r.cmd.results.U1;
    ok(x.state === 'removed' && x.how === 'sel' && r.rows.length === 1 && r.rows[0].isbn === I2, "줄 안 단추가 없으면 그 줄 체크칸만 + '선택 삭제' — 다른 책은 그대로"); }
  // ⑦ 담기 맡김이 그사이 취소됨(등록 환원) → 담지 않음
  { const t0 = new Date(Date.now() - 60e3).toISOString(); const r = await run('addcancel', { rows: [] }, [{ usedCode: 'U9', isbn13: I1 }], { add: true, createdAt: t0, bb: { cart: { U9: { state: 'cancelled', at: new Date().toISOString() } } } }); const x = (r.cmd.results || {}).U9 || {};
    ok(x.state === 'cancelled' && (r.bb.cart.U9 || {}).state === 'cancelled', '담기 대기 중 웹앱이 취소한 책은 수집기가 담지 않음'); }
  console.log(bad ? `❌ tC2BDEL 실패 ${bad}` : '✓ tC2BDEL 통과'); process.exit(bad ? 1 : 0); })().catch((e) => { console.log('❌ tC2BDEL 오류', e); process.exit(1); });
