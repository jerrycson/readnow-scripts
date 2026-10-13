/* ══════════ (1.45.0) 📥 개별·미등록 등록 — 알라딘 '상품 등록' 화면(wrecord.aspx)을 웹앱에서 정한 대로 채움 ══════════
 * 웹앱 📥 등록 카드에서 '알라딘 등록 화면 채워서 열기'를 누르면 이 화면이 #rnreg=상품줄번호 로 열림 → 이 스크립트가 Firebase(reg_items)의 계획(plan)대로 채움:
 *   미등록: 상품 구분 · 'ISBN 없는 상품' 체크(확인 창 자동) · 분류(최대 3) · 상품명·원제·부제 · 지은이·옮긴이·출판사(알라딘 번호로 — 팝업 없이) 또는 직접 입력 · 19세 · 쪽수 · 규격 · 출간일 · 정가
 *   공통(개별·미등록): 상품 관리 코드 · 품질(최상·상·중 — 품질 팝업이 하는 것과 같은 요청으로 팝업 없이) · 상태 부연 설명 · 판매가 · 판매상태 · 수량 · 상품 설명(편집기)
 *   팝업이 하는 일은 저장해 둔 실제 팝업 화면(품질·저자·출판사·분류)의 스크립트를 그대로 따라 함 — 짐작으로 칸을 만들지 않음
 * 채운 뒤 오른쪽 위 판에서 칸마다 ✓ · 사진(대표·보조·설명 사진)은 아직 직접 첨부(사진 폴더에서 맞는 파일 이름을 판에 보여 줌)
 * '등록완료'(판의 단추): 실행 문(exec_log)에 시작을 적을 수 있을 때만 → 등록 전 상품 조회 최근 번호(기준) → 맡긴 일 regOne(보냄 표시) → 알라딘 화면의 등록 함수 그대로
 *   → 화면이 바뀌면 공개 확인(대량 등록과 같은 지킴이·짝짓기 — ISBN·코드·판매가·품질·수량)
 * 사진 자동 첨부를 위한 조사: 이 화면이 열릴 때 하루 한 번, 알라딘 화면의 사진 올리기·등록 함수 원문과 사진 올리기 칸 모양을 reg_probe에 기록(읽기만) */
(function rnRegFill() {
  if (window.top !== window || !/\/scm\/wrecord(_edit)?\.aspx/i.test(location.pathname)) return;
  const onRecord = /\/scm\/wrecord\.aspx/i.test(location.pathname);
  const W0 = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const PC_NAME = (() => { try { return (window.__rnPcName && window.__rnPcName.get()) || GM_getValue('pcName', null) || 'PC'; } catch (e) { return 'PC'; } })(); // 수집기와 같은 이 PC 이름
  const nowIso = () => new Date().toISOString(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const C = (n) => db.collection(n);
  const RG = () => window.ReadnowRegister || globalThis.ReadnowRegister || null; const XC = () => window.ReadnowExec || globalThis.ReadnowExec || null; const PR = () => window.ReadnowProducts || globalThis.ReadnowProducts || null;
  const KEY_PEND = 'rn-reg-pending'; const TAB = Math.random().toString(36).slice(2, 8);
  const whenAuth = () => new Promise((res) => { if (auth.currentUser) return res(auth.currentUser); const un = auth.onAuthStateChanged((u) => { if (u) { un(); res(u); } }); setTimeout(() => res(auth.currentUser), 15000); });
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ── ① 보낸 뒤 화면이 바뀌었으면: 그 일을 공개 확인으로 (보낸 뒤 10분 안 · 이 PC) ── */
  (async () => { const pd = GM_getValue(KEY_PEND, null); if (!pd || Date.now() - pd.at > 10 * 60000 || pd.url === location.href && Date.now() - pd.at < 4000) return; await whenAuth(); if (!auth.currentUser) return;
    GM_deleteValue(KEY_PEND); const ref = C('shp_cmds').doc(pd.cmdId); const ok = !(pd.alerts || []).some((a) => /실패|오류|입력해|선택해|확인해|없습니다|불가|잘못/.test(a));
    await ref.set({ status: 'verify', step: 6, regAt: pd.sentAt || nowIso(), reg: { alerts: (pd.alerts || []).slice(0, 5), after: location.pathname }, results: { [pd.itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + (pd.alerts || []).slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    await C('reg_items').doc(pd.itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const X = XC(); if (X) await X.finish(db, { kind: 'regOne', key: pd.execKey }, ok ? 'done' : 'unknown', { msg: (pd.alerts || []).join(' / ') || null }).catch(() => {}); })();
  if (!onRecord) return;
  /* ── ② 사진 자동 첨부를 위한 조사 (하루 한 번 · 읽기만) ── */
  (async () => { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); if (GM_getValue('rn-reg-probe', '') === day) return; await sleep(4000); await whenAuth(); if (!auth.currentUser) return;
    const src = {}; ['imgUp2', 'frmRecord_submit', 'frmRecord_submit_C2C', 'setCategory', 'setBookInfo', 'checkAutoIsbn2', 'catPopUp', 'authorSearch', 'openBrand', 'fn_formSet', 'stockStatusChg', 'checkOver1Digit'].forEach((k) => { try { const f = W0[k]; if (typeof f === 'function') src[k] = String(f).slice(0, 20000); } catch (e) {} });
    let up = null; try { const fr = document.getElementById('imgUploader'); const d = fr && (fr.contentDocument || (fr.contentWindow && fr.contentWindow.document)); up = { src: fr ? fr.getAttribute('src') : null, html: d && d.documentElement ? d.documentElement.outerHTML.slice(0, 30000) : null }; } catch (e) { up = { err: e.message }; }
    const files = [...document.querySelectorAll('input[type=file]')].map((x) => x.outerHTML.slice(0, 300)); const scripts = [...document.querySelectorAll('script[src]')].map((x) => x.src).slice(0, 40);
    try { await C('reg_probe').doc('wrecord_' + day + '_' + TAB).set({ at: nowIso(), pc: PC_NAME, url: location.href, src, uploader: up, files, scripts, uploadedAt: TS() }); GM_setValue('rn-reg-probe', day); } catch (e) {} })();
  const m = location.hash.match(/rnreg=([\w-]+)/); if (!m) return; const itemId = m[1];
  /* ── ③ 판 ── */
  const box = document.createElement('div'); box.id = 'rnRegFill'; box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483646;width:360px;max-height:92vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:13px/1.5 system-ui,"Malgun Gothic",sans-serif;color:#1E2B28';
  const paint = (html) => { box.innerHTML = `<div style="background:#2F5D50;color:#fff;padding:8px 12px;font-weight:800;display:flex;justify-content:space-between"><span>📥 리드나우 등록 도우미</span><span id="rnRfX" style="cursor:pointer">✕</span></div><div style="padding:10px 12px">${html}</div>`; const x = box.querySelector('#rnRfX'); if (x) x.onclick = () => (box.style.display = 'none'); };
  const mount = () => { if (!box.isConnected) document.body.appendChild(box); }; if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  paint('Firebase에서 등록 계획을 읽는 중…');
  const $ = (id) => document.getElementById(id);
  const fire = (el) => { if (!el) return; ['input', 'change', 'keyup', 'blur'].forEach((t) => { try { el.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} }); };
  const setV = (id, v) => { const el = $(id); if (!el) return false; el.removeAttribute && el.removeAttribute('readonly'); el.value = v == null ? '' : String(v); fire(el); return true; };
  const selectVal = (el, want) => { if (!el) return false; const w = String(want); const o = [...el.options].find((op) => op.value === w || +op.value === +w || op.text.trim() === w || (+op.text.trim() === +w && w !== '')); if (!o) return false; el.value = o.value; fire(el); return true; };
  async function readyEditor() { for (let i = 0; i < 60; i++) { if (W0.EditorManager && W0.Editor && $('frmRecord')) return true; await sleep(250); } return false; }
  async function quality(plan) { /* 품질 팝업(wc2c_itemsales.aspx)의 frmsubmit과 같은 일 — 같은 추천가 요청 → 같은 칸 */
    const ps = $('priceStd') && $('priceStd').value; if (!(+ps > 0)) throw new Error('정가가 없어 품질을 정할 수 없음');
    const r = await fetch(`/shop/usedshop/c2c_sales_ajax.aspx?method=recomPriceSales&priceStd=${encodeURIComponent(ps)}&itemQuailty=${+plan.grade}`, { credentials: 'include' }); const j = JSON.parse(await r.text());
    setV('QualityType', String(+plan.grade)); setV('CommentDirty', String(plan.comment || '').slice(0, 50)); const pS = $('priceSales'); if (pS) { pS.readOnly = false; pS.value = j.PriceSales; } setV('QualityTypeKOR', j.QualityTypeDesc || ''); const g = $('Guaranted'); if (g) g.checked = true;
    try { W0.PercentPriceSales(); W0.calcSummaryC2C(); } catch (e) {} return j; }
  async function fill(plan) { const out = []; const ok = (k, v, note) => out.push({ k, ok: !!v, note: note || '' });
    if (!(await readyEditor())) throw new Error('알라딘 등록 화면이 다 열리지 않음 (편집기 없음)');
    const nativeConfirm = W0.confirm; W0.confirm = () => true; // 'ISBN 없는 상품' 확인 창 등 — 채우는 동안만 '확인'
    try {
      if (plan.method === 'new') { const N = plan.new || {};
        const rb = $('SelectType' + plan.branch); if (rb) { rb.checked = true; try { W0.fn_formSet(+plan.branch); } catch (e) {} } ok('상품 구분', rb && rb.checked);
        const ai = $('autoIsbn'); if (ai && !ai.checked) ai.click(); ok('ISBN 없는 상품', ai && ai.checked);
        (N.cats || []).slice(0, 3).forEach((c, i) => { let done = false; try { if (typeof W0.setCategory === 'function') { W0.setCategory(i, +c.cid, c.path, !!c.mag); done = true; } } catch (e) {} ok(`분류 ${i + 1}`, done, c.path); });
        ok('상품명', setV('title', String(N.title || '').slice(0, 100))); if (N.titleOrigin) ok('원제', setV('titleOrigin', N.titleOrigin)); if (N.subtitle) ok('부제', setV('itemSubTitle', N.subtitle));
        if (N.customAuthor || N.customPublisher || !N.author || !N.publisher) { const ck = $('chkCustomAuthor'); if (ck && !ck.checked) ck.click(); ok('저자 직접 입력', setV('custom_authorNm0', N.customAuthor || (N.author && N.author.name) || '')); ok('출판사 직접 입력', setV('custom_makingCompany', N.customPublisher || (N.publisher && N.publisher.name) || '')); }
        else { let a1 = false; try { W0.setBookInfo(0, N.author.id, N.author.name); a1 = true; } catch (e) {} ok('지은이', a1, N.author.name);
          if (N.translator && N.translator.id) { ok('옮긴이', setV('authorInfoId1', N.translator.id) && setV('authorInfoNm1', N.translator.name), N.translator.name); }
          ok('출판사', setV('makingCompany', N.publisher.name) && setV('makingCompanyId', N.publisher.id), N.publisher.name); }
        const ad = $('chkAgeAdultLevel'); if (ad) { ad.checked = !!N.adult; fire(ad); }
        if (N.pages) ok('쪽수', setV('ItemPage', +N.pages));
        if (N.sizeSel) { const s0 = $('selItemSize'); const r0 = selectVal(s0, N.sizeSel); try { W0.selItemSize_Change(s0); } catch (e) {} if (+N.sizeSel === 19) setV('size', N.sizeText || ''); ok('규격', r0, (s0 && s0.options[s0.selectedIndex] || {}).text); }
        if (N.pubDate) { const [y, mo, d] = String(N.pubDate).split('-').map((x) => +x); const r1 = $('noPubDate1'); if (r1) r1.checked = true; ok('출간일', selectVal($('pubY'), y) && selectVal($('pubM'), mo) && selectVal($('pubD'), d), N.pubDate); } else { const r0 = $('noPubDate0'); if (r0) r0.checked = true; }
        ok('정가', setV('priceStd', +plan.priceStd));
      } else if (plan.priceStd && !(+($('priceStd') || {}).value > 0)) ok('정가', setV('priceStd', +plan.priceStd));
      ok('관리 코드', setV('supItemCode', plan.code), plan.code);
      try { const j = await quality(plan); ok('품질', true, j.QualityTypeDesc || ''); } catch (e) { ok('품질', false, e.message); }
      ok('판매가', setV('priceSales', +plan.price), (+plan.price).toLocaleString() + '원'); try { W0.calcSummaryC2C(); } catch (e) {}
      const st = $('stockState'); ok('판매상태', selectVal(st, { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1])); try { W0.stockStatusChg(); } catch (e) {}
      ok('수량', setV('stockCount', Math.max(1, +plan.qty || 1)));
      if (plan.descHtml) { let d0 = false; try { W0.EditorManager.loadContent(plan.descHtml); d0 = true; } catch (e) {} ok('상품 설명', d0); }
    } finally { W0.confirm = nativeConfirm; }
    return out; }
  async function newestListing(code) { const P = PR(); const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=${code}&categoryId=0`, { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); return Math.max(0, ...P.parseScmList(d, new Date().getFullYear()).rows.map((x) => +x.listingId || 0)); }
  async function submit(it, plan, fillRep) { const X = XC(); if (!X) throw new Error('실행 문 공용 파일이 없음 — 기록 없이 등록하지 않음');
    const tries = (it.tries || 0) + 1; const execKey = `${itemId}#${tries}`; let g; try { g = await X.begin(db, { kind: 'regOne', key: execKey, by: PC_NAME, detail: { title: plan.title || null, price: plan.price } }); } catch (e) { throw new Error('실행 기록(exec_log)을 못 적어 등록하지 않음 — ' + (e.code || e.message)); }
    if (!g.ok) throw new Error('실행 문이 막음: ' + g.why);
    const sc = { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1]; let base = 0; try { base = Math.max(await newestListing(1), sc !== 1 ? await newestListing(sc) : 0); } catch (e) {} const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); base = Math.max(base, cur);
    const RGx = RG(); const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const cmdId = `ro_${itemId}_${tries}`; const row = { isbn: plan.isbn || '', state: +plan.saleState || 1, qty: Math.max(1, +plan.qty || 1), grade: +plan.grade || 2, price: Math.round(+plan.price), title: String(plan.title || '').slice(0, 100), code: plan.code, desc: '', regItem: itemId };
    const ref = C('shp_cmds').doc(cmdId); const b = db.batch();
    b.set(ref, { type: 'regOne', method: plan.method, status: 'running', claim: { pc: PC_NAME, tab: TAB, at: nowIso() }, step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), rows: [row], n: 1, qty: row.qty, sum: row.price * row.qty, day: today, regDay: today, verify: base ? { base, codes: [sc], until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 } : null, fill: fillRep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}`).join(' · ').slice(0, 900), createdAt: nowIso(), by: PC_NAME, uploadedAt: TS() });
    b.set(C('reg_items').doc(itemId), { stage: 'done', via: plan.method, cmdId, tries, day: today, confirmedAt: nowIso(), confirmedBy: PC_NAME, result: null, final: { isbn: row.isbn, price: row.price, code: row.code, grade: row.grade, qty: row.qty, state: row.state, desc: '', title: row.title }, uploadedAt: TS() }, { merge: true });
    await b.commit(); // 못 적으면 여기서 멈춤 — 등록하지 않음
    const pend = { cmdId, itemId, execKey, at: Date.now(), sentAt: nowIso(), url: location.href, alerts: [] }; GM_setValue(KEY_PEND, pend);
    const nativeAlert = W0.alert; W0.alert = function (msg) { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), String(msg).slice(0, 200)]; GM_setValue(KEY_PEND, p); } } catch (e) {} return nativeAlert.call(W0, msg); };
    W0.confirm = ((nc) => function (msg) { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), '(확인) ' + String(msg).slice(0, 200)]; GM_setValue(KEY_PEND, p); } } catch (e) {} return nc.call(W0, msg); })(W0.confirm);
    W0.frmRecord_submit_C2C(false, '6', plan.method === 'one');
    /* 화면이 그대로면(알라딘이 입력을 막음 = 보내지 않음) 5초 뒤: 알림 글을 보여 주고 이 일은 '보내지 않음'으로 — 다시 고쳐서 누를 수 있게 */
    setTimeout(async () => { const p = GM_getValue(KEY_PEND, null); if (!p || p.cmdId !== cmdId) return; const al = p.alerts || []; if (!al.length) return; // 알림 없이 기다리는 중이면 화면이 바뀔 때 처리
      if (al.some((a) => /등록되었|완료/.test(a))) return; GM_deleteValue(KEY_PEND);
      await ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, lookErr: '알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await X.finish(db, { kind: 'regOne', key: execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {});
      paint(`<b style="color:#B0322A">알라딘이 등록을 막았습니다</b><div style="margin:6px 0">${al.map(esc).join('<br>')}</div><div>알라딘에 등록되지 않았습니다. 화면에서 고친 뒤 알라딘의 '등록완료'를 직접 누르거나, 웹앱에서 고쳐 다시 여세요.</div>`); }, 5000); }
  (async () => { await whenAuth(); if (!auth.currentUser) return paint('Firebase 로그인이 안 됨 — 수집기 탭에서 로그인한 뒤 다시 여세요');
    const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null; if (!it || !it.plan) return paint('등록 계획을 찾지 못함 — 웹앱에서 다시 \'채워서 열기\'');
    if (it.stage === 'done') return paint('이미 등록을 보낸 상품입니다 (웹앱 확정 탭에서 결과 확인) — 다시 채우지 않음');
    const plan = it.plan; let rep = []; try { rep = await fill(plan); } catch (e) { return paint(`<b style="color:#B0322A">채우지 못함</b><div>${esc(e.message)}</div>`); }
    const bad = rep.filter((x) => !x.ok); const im = plan.images || {};
    paint(`<div style="font-weight:800;font-size:14px">${esc(plan.method === 'new' ? '미등록 상품 등록' : '개별 등록')} · ${esc(plan.title || '')}</div>
      <div style="margin:4px 0;color:#5B6B66">${esc(plan.code)} · ${(+plan.price).toLocaleString()}원 · ${esc({ 1: '최상', 2: '상', 3: '중' }[+plan.grade])} · ${+plan.qty || 1}부</div>
      <div style="margin:6px 0">${rep.map((x) => `<div style="color:${x.ok ? '#2F5D50' : '#B0322A'}">${x.ok ? '✓' : '✗'} ${esc(x.k)}${x.note ? ` <small style="color:#5B6B66">${esc(x.note)}</small>` : ''}</div>`).join('')}</div>
      ${im.main || (im.subs || []).length || (im.desc || []).length ? `<div style="background:#FFF7E0;border:1px solid #E9D79A;border-radius:8px;padding:6px 8px;margin:6px 0"><b>사진은 직접 첨부</b> (자동 첨부는 다음 판)<br>${im.main ? `대표: <b>${esc(im.main)}</b><br>` : ''}${(im.subs || []).length ? `보조: ${im.subs.map(esc).join(', ')}<br>` : ''}${(im.desc || []).length ? `설명 끝 사진(편집기의 사진 단추): ${im.desc.map(esc).join(', ')}` : ''}</div>` : plan.method === 'new' ? '<div style="color:#A8661B;margin:6px 0">미등록 상품은 대표 이미지가 필수 — 화면 아래 \'대표 이미지\'에서 첨부</div>' : ''}
      ${bad.length ? `<div style="color:#B0322A;margin:4px 0">✗ 칸은 화면에서 직접 확인·입력</div>` : ''}
      <button id="rnRfGo" style="width:100%;margin-top:6px;padding:10px;border:0;border-radius:8px;background:#B0322A;color:#fff;font-weight:800;font-size:14px;cursor:pointer">확인했음 → 등록완료 (기록 남기고 알라딘에 보냄)</button>
      <div style="color:#5B6B66;font-size:11.5px;margin-top:4px">알라딘의 '등록완료'를 직접 눌러도 등록되지만, 그러면 웹앱이 결과를 모릅니다 — 이 단추로 누르세요.</div>`);
    const go = box.querySelector('#rnRfGo'); go.onclick = async () => { go.disabled = true; go.textContent = '보내는 중…'; try { await submit(it, plan, rep); go.textContent = '보냄 — 알라딘 화면 결과를 기다리는 중'; } catch (e) { go.disabled = false; go.textContent = '확인했음 → 등록완료'; alert('등록하지 않음: ' + e.message); } };
  })();
})();
