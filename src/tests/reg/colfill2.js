(function rnRegFill() {
  /* (1.47.0) 채우는 일을 '틀'(makeFiller)로 묶음 — 사람이 보는 등록 화면(이 탭)과, 창 없이 하는 자동 등록(보이지 않는 틀 안의 등록 화면) 둘 다 같은 것을 씀 */
  const UW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const PC_NAME = (() => { try { return (window.__rnPcName && window.__rnPcName.get()) || GM_getValue('pcName', null) || 'PC'; } catch (e) { return 'PC'; } })(); // 수집기와 같은 이 PC 이름
  const nowIso = () => new Date().toISOString(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) firebase.initializeApp({ apiKey: 'AIzaSyCpHjgQgqB-P1Bh4JLlRbX3FItPOALXbEk', authDomain: 'readnow-3a385.firebaseapp.com', projectId: 'readnow-3a385', storageBucket: 'readnow-3a385.firebasestorage.app', messagingSenderId: '63884079760', appId: '1:63884079760:web:4f538bf29af5898ca51e15' });
  const db = firebase.app().firestore(); const auth = firebase.app().auth(); const TS = () => firebase.firestore.FieldValue.serverTimestamp(); const C = (n) => db.collection(n);
  const RG = () => window.ReadnowRegister || globalThis.ReadnowRegister || null; const XC = () => window.ReadnowExec || globalThis.ReadnowExec || null; const PR = () => window.ReadnowProducts || globalThis.ReadnowProducts || null;
  const KEY_PEND = 'rn-reg-pending'; const TAB = Math.random().toString(36).slice(2, 8);
  const whenAuth = () => new Promise((res) => { if (auth.currentUser) return res(auth.currentUser); const un = auth.onAuthStateChanged((u) => { if (u) { un(); res(u); } }); setTimeout(() => res(auth.currentUser), 15000); });
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ERR_RE = /실패|오류|입력해|선택해|확인해|없습니다|불가|잘못/;
  /* 사진 받기: 웹앱이 사진 폴더에서 Firebase 저장소(reg_photos/…)에 올려 둔 것 → 이 PC로 (알라딘 화면에 넣을 파일) */
  async function getPhoto(x) { if (!x || !x.path) throw new Error('저장소 경로 없음'); const url = await firebase.storage().ref(x.path).getDownloadURL();
    const blob = await new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'blob', timeout: 60000, onload: (r) => (r.status === 200 ? res(r.response) : rej(new Error('HTTP ' + r.status))), onerror: () => rej(new Error('받기 실패')), ontimeout: () => rej(new Error('시간 초과')) }));
    return new File([blob], x.name || 'photo.jpg', { type: blob.type || 'image/jpeg' }); }
  function makeFiller(doc, W0, opt) { opt = opt || {};
    const $ = (id) => doc.getElementById(id);
    const fire = (el) => { if (!el) return; ['input', 'change', 'keyup', 'blur'].forEach((t) => { try { el.dispatchEvent(new Event(t, { bubbles: true })); } catch (e) {} }); };
    const setV = (id, v) => { const el = $(id); if (!el) return false; el.removeAttribute && el.removeAttribute('readonly'); el.value = v == null ? '' : String(v); fire(el); return true; };
    const selectVal = (el, want) => { if (!el) return false; const w = String(want); const o = [...el.options].find((op) => op.value === w || +op.value === +w || op.text.trim() === w || (+op.text.trim() === +w && w !== '')); if (!o) return false; el.value = o.value; fire(el); return true; };
    async function readyEditor() { for (let i = 0; i < 80; i++) { if (W0.EditorManager && W0.Editor && $('frmRecord')) return true; await sleep(250); } return false; }
    async function quality(plan) { /* 품질 팝업(wc2c_itemsales.aspx)의 frmsubmit과 같은 일 — 같은 추천가 요청 → 같은 칸 */
      const ps = $('priceStd') && $('priceStd').value; if (!(+ps > 0)) throw new Error('정가가 없어 품질을 정할 수 없음');
      const r = await fetch(`/shop/usedshop/c2c_sales_ajax.aspx?method=recomPriceSales&priceStd=${encodeURIComponent(ps)}&itemQuailty=${+plan.grade}`, { credentials: 'include' }); const j = JSON.parse(await r.text());
      setV('QualityType', String(+plan.grade)); /* (1.49.0) 품질 창의 '상태 부연 설명'은 입력 칸이 없어 건드리지 않음 · 창 아래 확인 질문(ISBN이 맞습니까 · 정가가 맞습니까)은 '예'와 같음 = 정가 그대로(priceStd)·추천가 요청 */ const pS = $('priceSales'); if (pS) { pS.readOnly = false; pS.value = j.PriceSales; } setV('QualityTypeKOR', j.QualityTypeDesc || ''); const g = $('Guaranted'); if (g) g.checked = true;
      try { W0.PercentPriceSales(); W0.calcSummaryC2C(); } catch (e) {} return j; }
    /* 대학교장터(등록 화면의 '대학교장터 상품으로 등록하기' 칸들 — 저장해 둔 실제 화면 그대로): 체크 → SetIsUniv() · 카테고리는 팝업이 부르는 UnivCategory_Selected(번호, 경로) · 학부·학과(필수)·사용년도·과목명·사용학년·사용학기·교수명 */
    function univ(plan, ok) { const u = plan.univ; if (!u || !u.on) return; const ck = $('chkIsUniv'); if (ck && !ck.checked) { ck.checked = true; fire(ck); try { W0.SetIsUniv(); } catch (e) {} } ok('대학교장터', !!(ck && ck.checked));
      if (u.catId) { let d0 = false; try { W0.UnivCategory_Selected(String(u.catId), String(u.catNav || '')); d0 = true; } catch (e) { d0 = setV('UnivCategoryId', u.catId); } ok('대학교장터 카테고리', d0, u.catNav || u.catId); } else ok('대학교장터 카테고리', false, '고르지 않음');
      ok('학부·학과', !!String(u.dept || '').trim() && setV('UnivColleage', String(u.dept).slice(0, 20)), u.dept);
      [['CourseYear', u.year, 4], ['Course', u.course, 20], ['CourseGrade', u.grade, 1], ['CourseTerm', u.term, 10], ['ProfessorName', u.prof, 20]].forEach(([id, v, n]) => { if (v != null && v !== '') setV(id, String(v).slice(0, n)); });
      const sv = $('chkSaveUnivInfo'); if (sv) sv.checked = false; /* 알라딘 계정의 '대학교장터 기본 등록정보'는 건드리지 않음 (우리 기본값은 웹앱 등록 설정에) */ }
    async function fill(plan) { const out = []; const ok = (k, v, note) => out.push({ k, ok: !!v, note: note || '' });
      if (!(await readyEditor())) throw new Error('알라딘 등록 화면이 다 열리지 않음 (편집기 없음 — 로그인이 풀렸을 수 있음)');
      const nativeConfirm = W0.confirm; W0.confirm = () => true; // 'ISBN 없는 상품' 확인 창 등 — 채우는 동안만 '확인'
      try {
        if (plan.method === 'new') { const N = plan.new || {};
          const rb = $('SelectType' + plan.branch); if (rb) { rb.checked = true; try { W0.fn_formSet(+plan.branch); } catch (e) {} } ok('상품 구분', rb && rb.checked);
          univ(plan, ok);
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
        } else { univ(plan, ok); if (plan.priceStd && !(+($('priceStd') || {}).value > 0)) ok('정가', setV('priceStd', +plan.priceStd)); }
        ok('관리 코드', setV('supItemCode', plan.code), plan.code);
        try { const j = await quality(plan); ok('품질', true, `${j.QualityTypeDesc || ''} · ISBN·정가 확인 '예'`); } catch (e) { ok('품질', false, e.message); }
        ok('판매가', setV('priceSales', +plan.price), (+plan.price).toLocaleString() + '원'); try { W0.calcSummaryC2C(); } catch (e) {}
        const st = $('stockState'); ok('판매상태', selectVal(st, { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1])); try { W0.stockStatusChg(); } catch (e) {}
        ok('수량', setV('stockCount', Math.max(1, +plan.qty || 1)));
        if (plan.descHtml) { let d0 = false; try { W0.EditorManager.loadContent(plan.descHtml); d0 = true; } catch (e) {} ok('상품 설명', d0); }
      } finally { W0.confirm = nativeConfirm; }
      return out; }
    /* 사진 한 장: 알라딘 화면의 사진 단추와 같은 imgUp2(칸, 6, 0)를 부른 뒤 → 생긴 '파일 고르기' 칸(숨은 imgUploader 틀 · 새 창 · 화면 안)에 파일을 넣고 바뀜을 알림 → 그 칸(mainCover·zoomCoverN)에 사진 주소가 들어올 때까지 기다림
     *  파일 고르기 창은 사람이 누를 때만 뜨므로 여기서는 열리지 않음. 칸이 안 채워지면 ✗ (그 사진만 직접) */
    /* (1.52.0) 사진 올리기 — 정범이 저장해 준 알라딘 사진 창 2개(2026-10-09) 그대로:
     *  ① 대표·추가 사진 창 /scm/upload/imgUpPopup.aspx : 폼 fSCMImgUploader(multipart) → 같은 주소로 보냄 · 칸 SCMImg(파일) · Action=1 · targetO=칸 이름(mainCover·zoomCoverN) · branchType=6
     *     → 알라딘이 돌려주는 화면이 window.opener(등록 화면)의 그 칸·그림을 채움(창 안 함수 pd(id) = opener.document.getElementById(id))
     *  ② 편집기(설명 안) 사진 창 /scm/upload/wimage_upload_scm.aspx : 폼 Myform(multipart) → 같은 주소 · 칸 uploadFile(파일) · action=1 · imgalign=1(왼쪽 · 창 기본값) · 가로 570픽셀 이하
     *     → 돌려주는 화면이 opener.InsertHtml(그림)을 불러 편집기에 넣음 (등록 화면: function InsertHtml(img){ EditorManager.pasteContent(img); })
     *  방법: 창을 띄우지 않고 그 폼과 똑같은 내용을 직접 보냄(fetch · 같은 알라딘 로그인) → 돌려받은 화면을 보이지 않는 빈 틀에 그대로 그리되 그 틀의 opener를 등록 화면으로 정해 둠
     *  → 사람이 창에서 올렸을 때와 똑같이 알라딘 화면 스크립트가 칸을 채움. 예전(1.50~1.51)엔 틀이 새 화면으로 넘어가며 opener가 사라져 안 들어갔음
     *  돌려받은 화면은 처음 몇 번 reg_probe/{mainImg·editorImg}에 남김(안 맞으면 그걸로 고침) */
    const sniffText = async (r) => { const buf = await r.arrayBuffer(); const ct = String(r.headers.get('content-type') || ''); let cs = (ct.match(/charset=([\w-]+)/i) || [])[1]; let t = new TextDecoder(cs || 'utf-8').decode(buf); if (!cs) { const m = t.slice(0, 2000).match(/charset=["']?([\w-]+)/i); if (m && !/utf-?8/i.test(m[1])) { try { t = new TextDecoder(m[1]).decode(buf); } catch (e) {} } } return t; };
    const runAsPopup = async (html, url) => { const fr = doc.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-4000px;top:0;width:560px;height:480px;border:0;opacity:0;pointer-events:none'; doc.body.appendChild(fr); const w = fr.contentWindow; const d = fr.contentDocument; const errs = [];
      try { try { w.opener = W0; } catch (e) {} w.onerror = (m) => { errs.push(String(m).slice(0, 200)); return true; }; w.alert = (m) => errs.push('(알림) ' + String(m).slice(0, 200)); w.close = () => {}; try { w.resizeTo = () => {}; } catch (e) {}
        d.open(); try { w.opener = W0; } catch (e) {} const base = `<base href="${String(url).replace(/"/g, '')}">`; d.write(/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html); d.close(); } catch (e) { errs.push('그리기 오류: ' + e.message); }
      await sleep(1500); setTimeout(() => { try { fr.remove(); } catch (e) {} }, 8000); return errs; };
    let probeN = 0; const probeUp = async (kind, data) => { if (probeN++ > 6) return; try { await C('reg_probe').doc(kind).set({ last: { at: nowIso(), pc: PC_NAME, ...data }, pc: PC_NAME, ...W() }, { merge: true }); } catch (e) {} };
    /* 편집기 사진은 가로 570픽셀 이하만 받음(창 안내) → 넓으면 줄여서 JPEG로 (세로는 비율대로) · 이름 확장자도 jpg로 */
    async function fitWidth(file, maxW) { try { const bmp = await createImageBitmap(file); if (bmp.width <= maxW && /\.(jpe?g|png|gif)$/i.test(file.name)) { bmp.close && bmp.close(); return file; } const r = Math.min(1, maxW / bmp.width); const cv = doc.createElement('canvas'); cv.width = Math.round(bmp.width * r); cv.height = Math.round(bmp.height * r); cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close && bmp.close();
      const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.9)); return new File([blob], String(file.name || 'photo').replace(/\.[^.]*$/, '') + '.jpg', { type: 'image/jpeg' }); } catch (e) { return file; } }
    async function postUpload(kind, url, fields, fileKey, file) { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); fd.append(fileKey, file, file.name || 'photo.jpg');
      const r = await fetch(url, { method: 'POST', body: fd, credentials: 'include' }); const html = await sniffText(r); if (!r.ok) throw new Error('알라딘이 받지 않음 HTTP ' + r.status);
      if (/로그인|login/i.test(html) && /<form[^>]+login/i.test(html)) throw new Error('알라딘 로그인이 풀림'); const errs = await runAsPopup(html, r.url || url); return { html, errs }; }
    async function attachOne(field, file) { const inp0 = $(field); if (!inp0) return { ok: false, why: '사진 칸 없음' }; const before = inp0.value; const imgEl = $(field + 'img'); const src0 = imgEl ? imgEl.getAttribute('src') : null; let res = null, why = '';
      try { res = await postUpload('mainImg', '/scm/upload/imgUpPopup.aspx', { Action: '1', targetO: field, branchType: '6' }, 'SCMImg', file); } catch (e) { why = e.message; }
      for (let i = 0; i < 20 && res; i++) { const v = ($(field) || {}).value; const s2 = imgEl ? imgEl.getAttribute('src') : null; if ((v && v !== before) || (s2 && s2 !== src0 && !/space/i.test(s2))) { await probeUp('mainImg', { field, ok: true, value: v || null, src: s2 || null, html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, where: '직접 올림' }; } await sleep(300); }
      if (res) await probeUp('mainImg', { field, ok: false, html: res.html.slice(0, 30000), errs: res.errs });
      const old = await attachOneOld(field, file); if (old.ok) return old; return { ok: false, why: `${why || '올렸지만 칸이 안 채워짐'}${res && res.errs.length ? ' · ' + res.errs.join(' / ').slice(0, 160) : ''} — 돌려받은 화면을 reg_probe/mainImg에 남김` }; }
    /* 예전 방식(사진 단추 imgUp2를 불러 생긴 파일 칸에 넣기) — 직접 올리기가 안 될 때만 */
    async function attachOneOld(field, file) { const inp0 = $(field); if (!inp0) return { ok: false, why: '사진 칸 없음' }; const before = inp0.value; let popup = null;
      const nOpen = W0.open; W0.open = function () { popup = nOpen.apply(W0, arguments); return popup; };
      try { if (typeof W0.imgUp2 !== 'function') return { ok: false, why: '알라딘 사진 단추 함수(imgUp2)가 없음' }; W0.imgUp2(field, 6, 0); } catch (e) { return { ok: false, why: 'imgUp2 오류: ' + e.message }; } finally { W0.open = nOpen; }
      let fi = null, where = ''; for (let i = 0; i < 40 && !fi; i++) { await sleep(250); try { const fr = $('imgUploader'); const d = fr && fr.contentDocument; const x = d && d.querySelector('input[type=file]'); if (x && !x.dataset.rnUsed) { fi = x; where = '숨은 틀'; } } catch (e) {}
        if (!fi && popup) { try { const x = popup.document.querySelector('input[type=file]'); if (x) { fi = x; where = '새 창'; } } catch (e) {} } if (!fi) { const x = [...doc.querySelectorAll('input[type=file]')].find((y) => !y.dataset.rnUsed); if (x) { fi = x; where = '화면'; } } }
      if (!fi) return { ok: false, why: '사진 올리기 칸을 찾지 못함' };
      try { const DT = (fi.ownerDocument.defaultView && fi.ownerDocument.defaultView.DataTransfer) || DataTransfer; const dt = new DT(); dt.items.add(file); fi.files = dt.files; fi.dataset.rnUsed = '1'; ['input', 'change'].forEach((t) => fi.dispatchEvent(new Event(t, { bubbles: true }))); } catch (e) { return { ok: false, why: '파일을 넣지 못함: ' + e.message }; }
      for (let i = 0; i < 80; i++) { await sleep(500); const v = ($(field) || {}).value; if (v && v !== before) { try { if (popup && !popup.closed) popup.close(); } catch (e) {} return { ok: true, where }; } if (i === 8 && fi.form && !fi.form.dataset.rnSent) { fi.form.dataset.rnSent = '1'; try { fi.form.submit(); } catch (e) {} } }
      return { ok: false, why: `올렸지만 칸에 사진이 들어오지 않음 (${where})` }; }
    /* 사진 목록 (웹앱 카드의 사진 칸 그대로): 대표 → mainCover · 추가 1~8 → zoomCover0~7 · 설명 안 사진 → 편집기(자동 넣기 없음 — 받아서 편집기 사진 넣기로) · (1.48.0) 예전 계획(subs·desc 이름만)도 읽음 */
    function photoTodo(plan) { const im = plan.images || {}; const out = []; if (im.main && im.main.path) out.push({ field: 'mainCover', x: im.main, label: '대표(기본) 이미지' });
      (im.zoom || []).forEach((x, i) => { if (x && x.path) out.push({ field: 'zoomCover' + i, x, label: '추가 이미지 ' + (i + 1) }); }); (im.subs || []).filter((x) => x && x.path).slice(0, 2).forEach((x, i) => out.push({ field: 'zoomCover' + i, x, label: '추가 이미지 ' + (i + 1) }));
      (im.desc || []).filter((x) => x && x.path).forEach((x, i) => out.push({ field: null, x, label: '설명 안 사진 ' + (i + 1) })); return out; }
    /* (1.50.0) 설명 안 사진(편집기): 사람이 편집기 '사진' 단추를 누르면 뜨는 창(알라딘 편집기 설정 popPageUrl = /scm/upload/wimage_upload_scm.aspx)을
     *  보이지 않는 틀로 열고(그 창의 opener = 이 등록 화면) → 파일 칸에 사진을 넣고 → 그 창의 올리기 단추·폼을 누름 → 올린 뒤 화면의 '넣기·확인' 단추(InsertHtml 부르는 것)를 누름
     *  → 편집기 글에 새 <img>가 들어왔는지 확인. 창 모양은 처음 보는 것이라 화면을 reg_probe/editorImg에 남김(안 맞으면 그걸로 고침) · 안 들어가면 ✗ → 자동 등록은 보내지 않음 */
    async function editorPhoto(file, label) { const getC = () => { try { return W0.Editor.getContent(); } catch (e) { return ''; } }; const nImg = (h) => (String(h || '').match(/<img\b/gi) || []).length; const n0 = nImg(getC());
      let got = null; const nIns = W0.InsertHtml; W0.InsertHtml = function (img) { got = String(img || ''); try { return nIns.apply(W0, arguments); } catch (e) { try { W0.EditorManager.pasteContent(img); } catch (e2) { try { W0.EditorManager.pasteContentBottom(img); } catch (e3) {} } } };
      let res = null, why = ''; const f2 = await fitWidth(file, 570);
      try { try { res = await postUpload('editorImg', '/scm/upload/wimage_upload_scm.aspx', { action: '1', imgalign: '1' }, 'uploadFile', f2); } catch (e) { why = e.message; }
        for (let i = 0; i < 20 && res; i++) { if (got || nImg(getC()) > n0) { await probeUp('editorImg', { ok: true, inserted: (got || '').slice(0, 2000), html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, note: label }; } await sleep(300); }
        /* 알라딘 화면 스크립트가 넣지 않았을 때: 돌려받은 화면 안의 올린 그림 주소(image.aladin.co.kr …)를 찾으면 그 그림을 편집기에 넣음 */
        if (res) { const m = res.html.match(/https?:\/\/[\w.-]*aladin\.co\.kr\/[^"'\s<>()]+\.(?:jpe?g|png|gif)/i); if (m) { try { W0.InsertHtml(`<img src="${m[0]}">`); } catch (e) {} if (nImg(getC()) > n0) { await probeUp('editorImg', { ok: true, via: 'url', url: m[0], html: res.html.slice(0, 30000), errs: res.errs }); return { ok: true, note: label + ' (주소로 넣음)' }; } }
          await probeUp('editorImg', { ok: false, html: res.html.slice(0, 30000), errs: res.errs }); } }
      finally { W0.InsertHtml = nIns; }
      const old = await editorPhotoOld(file, label); if (old.ok) return old; return { ok: false, why: `${why || '올렸지만 편집기에 안 들어감'}${res && res.errs.length ? ' · ' + res.errs.join(' / ').slice(0, 160) : ''} — 돌려받은 화면을 reg_probe/editorImg에 남김` }; }
    async function editorPhotoOld(file, label) { const before = (() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })(); const nImg = (h) => (String(h || '').match(/<img\b/gi) || []).length; const n0 = nImg(before); const trace = [];
      let got = null; const nIns = W0.InsertHtml; W0.InsertHtml = function (img) { got = String(img || ''); trace.push('InsertHtml'); try { return nIns.apply(W0, arguments); } catch (e) { try { W0.EditorManager.pasteContentBottom(img); } catch (e2) {} } };
      const fr = doc.createElement('iframe'); fr.style.cssText = 'position:fixed;left:-4000px;top:0;width:560px;height:480px;border:0;opacity:0;pointer-events:none'; const ld = () => new Promise((res) => { const t = setTimeout(() => res(false), 30000); fr.addEventListener('load', () => { clearTimeout(t); res(true); }, { once: true }); });
      let p = ld(); fr.src = '/scm/upload/wimage_upload_scm.aspx'; doc.body.appendChild(fr); const probe = async (stage, dd) => { try { await C('reg_probe').doc('editorImg').set({ [stage]: { at: nowIso(), html: dd && dd.documentElement ? dd.documentElement.outerHTML.slice(0, 60000) : null, trace }, pc: PC_NAME }, { merge: true }); } catch (e) {} };
      try { if (!(await p)) return { ok: false, why: '편집기 사진 창이 열리지 않음' }; const w = fr.contentWindow; try { w.opener = W0; } catch (e) {} const d = fr.contentDocument; await probe('open', d);
        const fi = d.querySelector('input[type=file]'); if (!fi) return { ok: false, why: '편집기 사진 창에 파일 칸이 없음 (화면을 reg_probe에 남김)' };
        try { const dt = new DataTransfer(); dt.items.add(file); fi.files = dt.files; } catch (e) { return { ok: false, why: '파일을 넣지 못함: ' + e.message }; } ['input', 'change'].forEach((t) => fi.dispatchEvent(new Event(t, { bubbles: true }))); trace.push('file');
        await sleep(800); const clickable = (dd, rx) => [...dd.querySelectorAll('button,input[type=button],input[type=submit],input[type=image],a,img,span')].find((el) => rx.test((el.getAttribute('onclick') || '') + ' ' + (el.value || '') + ' ' + (el.textContent || '') + ' ' + (el.alt || '') + ' ' + (el.title || '')));
        if (!got && nImg((() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })()) <= n0) { const up = clickable(d, /upload|올리기|업로드|첨부|확인|등록|submit/i); p = ld(); if (up) { up.click(); trace.push('click:' + (up.value || up.textContent || up.alt || '').trim().slice(0, 20)); } else { const f = fi.form; if (f) { f.submit(); trace.push('form.submit'); } } await Promise.race([p, sleep(20000)]); }
        for (let i = 0; i < 3 && !got; i++) { await sleep(700); let d2 = null; try { d2 = fr.contentDocument; } catch (e) {} if (!d2) break; if (i === 0) await probe('after', d2); const ins = clickable(d2, /InsertHtml|opener|넣기|삽입|적용|확인/); if (ins) { trace.push('click2:' + (ins.value || ins.textContent || '').trim().slice(0, 20)); try { fr.contentWindow.opener = W0; } catch (e) {} ins.click(); } else break; }
        for (let i = 0; i < 20; i++) { const h = (() => { try { return W0.Editor.getContent(); } catch (e) { return ''; } })(); if (nImg(h) > n0) return { ok: true, note: label }; await sleep(300); }
        await probe('fail', (() => { try { return fr.contentDocument; } catch (e) { return null; } })()); return { ok: false, why: `편집기 글에 사진이 안 들어감 (${trace.join(' → ') || '단계 없음'}) — 창 화면을 reg_probe/editorImg에 남김` }; }
      finally { W0.InsertHtml = nIns; setTimeout(() => { try { fr.remove(); } catch (e) {} }, 1500); } }
    async function attachImages(plan) { const out = []; for (const t of photoTodo(plan)) { if (!t.field) { let r; try { const f = await getPhoto(t.x); r = await editorPhoto(f, t.x.name); } catch (e) { r = { ok: false, why: e.message }; } out.push({ k: t.label, ok: r.ok, note: r.ok ? t.x.name : `${t.x.name} — ${r.why}`, photo: true }); continue; } let r; try { const f = await getPhoto(t.x); r = await attachOne(t.field, f); } catch (e) { r = { ok: false, why: e.message }; } out.push({ k: t.label, ok: r.ok, note: r.ok ? t.x.name : `${t.x.name} — ${r.why}`, photo: true }); } return out; }
    async function newestListing(code) { const P = PR(); const r = await fetch(`/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=1&SortOrder=6&itemStockStatus=${code}&categoryId=0`, { credentials: 'include' }); const d = new DOMParser().parseFromString(await r.text(), 'text/html'); return Math.max(0, ...P.parseScmList(d, new Date().getFullYear()).rows.map((x) => +x.listingId || 0)); }
    /* 보내기 전 기록: 실행 문(exec_log) 시작 → 등록 전 상품 조회 최근 번호(공개 확인 기준) → 맡긴 일 regOne '보냄' + 상품 줄 '확정' (한 번에) — 못 적으면 보내지 않음 */
    async function prep(itemId, it, plan, rep, cmdIdIn) { const X = XC(); if (!X) throw new Error('실행 문 공용 파일이 없음 — 기록 없이 등록하지 않음');
      const tries = (it.tries || 0) + 1; const execKey = `${itemId}#${tries}`; let g; try { g = await X.begin(db, { kind: 'regOne', key: execKey, by: PC_NAME, detail: { title: plan.title || null, price: plan.price, auto: !!cmdIdIn } }); } catch (e) { throw new Error('실행 기록(exec_log)을 못 적어 등록하지 않음 — ' + (e.code || e.message)); }
      if (!g.ok) throw new Error('실행 문이 막음: ' + g.why);
      const sc = { 1: 1, 2: 3, 3: 15 }[+plan.saleState || 1]; let base = 0; try { base = Math.max(await newestListing(1), sc !== 1 ? await newestListing(sc) : 0); } catch (e) {} const cur = +(((await C('prd_system').doc('cursor').get()).data() || {}).maxListingId || 0); base = Math.max(base, cur);
      const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const cmdId = cmdIdIn || `ro_${itemId}_${tries}`; const row = { isbn: plan.isbn || '', state: +plan.saleState || 1, qty: Math.max(1, +plan.qty || 1), grade: +plan.grade || 2, price: Math.round(+plan.price), title: String(plan.title || '').slice(0, 100), code: plan.code, desc: '', regItem: itemId };
      const ref = C('shp_cmds').doc(cmdId); const b = db.batch();
      b.set(ref, { type: 'regOne', method: plan.method, itemId, auto: !!cmdIdIn, status: 'running', claim: { pc: PC_NAME, tab: TAB, at: nowIso() }, step: 5, sent: true, sentAt: nowIso(), beatAt: nowIso(), rows: [row], n: 1, qty: row.qty, sum: row.price * row.qty, day: today, regDay: today, verify: base ? { base, codes: [sc], until: new Date(Date.now() + 90 * 60000).toISOString(), tries: 0 } : null, fill: rep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}`).join(' · ').slice(0, 900), ...(cmdIdIn ? {} : { createdAt: nowIso(), by: PC_NAME }), uploadedAt: TS() }, { merge: true });
      b.set(C('reg_items').doc(itemId), { stage: 'done', via: plan.method, cmdId, tries, day: today, confirmedAt: nowIso(), confirmedBy: PC_NAME, result: null, final: { isbn: row.isbn, price: row.price, code: row.code, grade: row.grade, qty: row.qty, state: row.state, desc: '', title: row.title }, uploadedAt: TS() }, { merge: true });
      await b.commit(); // 못 적으면 여기서 멈춤 — 등록하지 않음
      return { cmdId, execKey, ref, X }; }
    /* 알림·확인 창: 사람이 보는 화면은 기록하고 그대로 띄움 · 자동(틀 안)은 기록만 — 확인 창은 '등록·저장하시겠습니까'만 예, 그 밖(중복 경고 등)은 아니오(보내지 않음) */
    function hook(sink, auto) { const nA = W0.alert, nC = W0.confirm;
      W0.alert = function (msg) { sink.push(String(msg).slice(0, 200)); if (!auto) return nA.call(W0, msg); };
      W0.confirm = function (msg) { const m = String(msg); sink.push('(확인) ' + m.slice(0, 200)); if (!auto) return nC.call(W0, msg); return /(등록|저장|진행)\s*하시겠습니까/.test(m) && !/중복|이미|다시/.test(m); }; }
    return { fill, attachImages, attachOne, photoTodo, prep, hook, $ }; }
  window.__rnRegMake = makeFiller;
  /* ── 창 없이 하는 자동 등록 (웹앱 '🤖 자동 등록' → 맡긴 일 regOne auto): 보이지 않는 틀 안에 알라딘 등록 화면을 열고 같은 방법으로 채움 → 못 채운 칸이 하나라도 있으면 보내지 않음 → 보냄 → 화면이 바뀌면 공개 확인 ── */
  let autoChain = Promise.resolve(); /* 한 PC에서 하나씩 (틀이 여럿 동시에 열리지 않게) — 기다리는 일은 1분마다 '살아 있음'(beatAt)을 남겨 지킴이가 멈춘 일로 보지 않게 */
  window.__rnRegAuto = (ref, v, id) => { const hb = setInterval(() => ref.set({ beatAt: nowIso(), waitMsg: '이 PC의 앞 자동 등록이 끝나길 기다림' }, { merge: true }).catch(() => {}), 60000);
    const p = autoChain.then(() => { clearInterval(hb); return regAutoOne(ref, v, id); }).catch((e) => console.warn('[리드나우] 자동 등록', e)).finally(() => clearInterval(hb)); autoChain = p; return p; };
  async function regAutoOne(ref, v, id) { const itemId = v.itemId; await ref.set({ beatAt: nowIso(), waitMsg: null, step: 1 }, { merge: true }).catch(() => {}); const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null;
    const notSent = async (msg, extra) => { await ref.set({ status: 'fail', sent: false, msg: (v.mock ? '🧷 모의 등록 — ' : '자동 등록 — 보내지 않음: ') + msg, doneAt: nowIso(), ...(extra || {}), uploadedAt: TS() }, { merge: true }).catch(() => {}); await C('reg_items').doc(itemId).set(v.mock ? { mockResult: { at: nowIso(), ok: false, msg: '못 채움 — ' + String(msg).slice(0, 200), fill: (extra && extra.fill) || null, kind: 'auto' }, autoCmd: null, uploadedAt: TS() } : { lookErr: '🤖 자동 등록 멈춤: ' + String(msg).slice(0, 200), autoCmd: null, uploadedAt: TS() }, { merge: true }).catch(() => {}); };
    if (!it || !it.plan) return notSent('등록 계획이 없음 — 웹앱에서 다시');
    if (it.stage !== 'pick' || (it.cmdId && it.cmdId !== id)) return notSent('결정 대기가 아님(이미 등록을 보냈거나 옮겨짐)');
    const plan = it.plan; const url = plan.method === 'one' ? `/scm/wrecord.aspx?ISBN=${encodeURIComponent(plan.isbn)}` : '/scm/wrecord.aspx';
    const fr = document.createElement('iframe'); fr.id = 'rnRegAuto_' + TAB + '_' + Date.now().toString(36); fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:1280px;height:1000px;border:0;opacity:0;pointer-events:none'; fr.setAttribute('aria-hidden', 'true');
    const loaded = (ms) => new Promise((res) => { const t = setTimeout(() => res(false), ms); fr.addEventListener('load', () => { clearTimeout(t); res(true); }, { once: true }); });
    const p0 = loaded(60000); fr.src = url; document.body.appendChild(fr); const clean = () => setTimeout(() => { try { fr.remove(); } catch (e) {} }, 3000);
    try { if (!(await p0)) return await notSent('알라딘 등록 화면이 1분 안에 열리지 않음'); await sleep(1500);
      const uf = UW.document.getElementById(fr.id); const W = uf && uf.contentWindow; const d = fr.contentDocument; if (!W || !d || !/wrecord\.aspx/i.test(String(W.location.pathname))) return await notSent('등록 화면이 아님(로그인이 풀렸을 수 있음)');
      const F = makeFiller(d, W, { auto: true }); let rep; try { rep = await F.fill(plan); /* (1.49.0) 사진 칸(대표·추가)의 사진도 넣음 — 넣은 뒤 칸에 사진 주소가 들어왔는지 확인(attachOne) · 하나라도 안 되면 아래에서 보내지 않음 · 설명 안 사진(편집기)은 자동으로 못 넣음 */ const todo = F.photoTodo(plan); if (todo.length) { /* (1.50.0) 설명 안 사진(편집기)도 넣음 — editorPhoto */ await ref.set({ beatAt: nowIso(), step: 2, waitMsg: `사진 ${todo.length}장 넣는 중` }, { merge: true }).catch(() => {}); rep.push(...(await F.attachImages(plan))); } } catch (e) { return await notSent('채우지 못함: ' + e.message); }
      const bad = rep.filter((x) => !x.ok); const fillTxt = rep.map((x) => `${x.ok ? '✓' : '✗'} ${x.k}${x.note && !x.ok ? ' (' + x.note + ')' : ''}`).join(' · ').slice(0, 900);
      if (bad.length) return await notSent('못 채운 칸 ' + bad.map((x) => x.k + (x.note ? ` (${x.note})` : '')).join(', ') + ' — 카드에서 고치거나 \'채워서 열기\'로 직접', { fill: fillTxt });
      if (v.mock) { /* (1.50.0) 🧷 모의 등록: 모든 칸·사진을 채웠으니 여기서 멈춤 — 실행 문·보냄 기록도 만들지 않고, 알라딘 '등록'은 누르지 않음 */ const msg = `알라딘에 보내지 않음 · ${rep.length}칸 모두 채움`; await ref.set({ status: 'done', mock: true, sent: false, step: 4, fill: fillTxt, msg: '🧷 모의 등록 — ' + msg, results: { [itemId]: { state: 'mock', at: nowIso(), msg } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await C('reg_items').doc(itemId).set({ mockResult: { at: nowIso(), ok: true, msg, fill: fillTxt, kind: 'auto' }, autoCmd: null, lookErr: null, uploadedAt: TS() }, { merge: true }).catch(() => {}); return; }
      let P; try { P = await F.prep(itemId, it, plan, rep, id); } catch (e) { return await notSent(e.message, { fill: fillTxt }); }
      const al = []; F.hook(al, true); const nav = loaded(30000); try { W.frmRecord_submit_C2C(false, '6', plan.method === 'one'); } catch (e) { al.push('보내기 함수 오류: ' + e.message); }
      const went = await nav; const errA = al.some((a) => ERR_RE.test(a) || /^\(확인\)/.test(a));
      if (!went && al.length) { /* 화면이 그대로 + 알림 = 알라딘이 막음 → 보내지 않음으로 되돌림 */
        await P.ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, autoCmd: null, lookErr: '🤖 알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
        await P.X.finish(db, { kind: 'regOne', key: P.execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {}); return; }
      if (!went) return; /* 알림 없이 화면이 그대로 = 아직 모름 → '보냄'으로 둠(지킴이가 15분 뒤 공개 확인) — 되돌리면 두 번 등록될 수 있어서 */
      const ok = !errA; await P.ref.set({ status: 'verify', step: 6, regAt: nowIso(), reg: { alerts: al.slice(0, 5), auto: true }, results: { [itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + al.slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, autoCmd: null, uploadedAt: TS() }, { merge: true }).catch(() => {});
      await P.X.finish(db, { kind: 'regOne', key: P.execKey }, ok ? 'done' : 'unknown', { msg: al.join(' / ') || null }).catch(() => {});
    } finally { clean(); } }
  if (window.top !== window || !/\/scm\/wrecord(_edit)?\.aspx/i.test(location.pathname)) return;
  const onRecord = /\/scm\/wrecord\.aspx/i.test(location.pathname); const W0 = UW;
  /* ── ① 보낸 뒤 화면이 바뀌었으면: 그 일을 공개 확인으로 (보낸 뒤 10분 안 · 이 PC) ── */
  (async () => { const pd = GM_getValue(KEY_PEND, null); if (!pd || Date.now() - pd.at > 10 * 60000 || pd.url === location.href && Date.now() - pd.at < 4000) return; await whenAuth(); if (!auth.currentUser) return;
    GM_deleteValue(KEY_PEND); const ref = C('shp_cmds').doc(pd.cmdId); const ok = !(pd.alerts || []).some((a) => ERR_RE.test(a));
    await ref.set({ status: 'verify', step: 6, regAt: pd.sentAt || nowIso(), reg: { alerts: (pd.alerts || []).slice(0, 5), after: location.pathname }, results: { [pd.itemId]: { state: ok ? 'registered' : 'unknown', at: nowIso(), msg: ok ? null : '알라딘 알림: ' + (pd.alerts || []).slice(0, 2).join(' / ') } }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    await C('reg_items').doc(pd.itemId).set({ result: { state: ok ? 'registered' : 'unknown', at: nowIso() }, uploadedAt: TS() }, { merge: true }).catch(() => {});
    const X = XC(); if (X) await X.finish(db, { kind: 'regOne', key: pd.execKey }, ok ? 'done' : 'unknown', { msg: (pd.alerts || []).join(' / ') || null }).catch(() => {}); })();
  if (!onRecord) return;
  /* ── ② 조사 (하루 한 번 · 읽기만): 사진 올리기·등록 함수 원문과 사진 칸 모양 → reg_probe (자동 첨부가 안 맞을 때 고치는 자료) ── */
  (async () => { const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); if (GM_getValue('rn-reg-probe', '') === day) return; await sleep(4000); await whenAuth(); if (!auth.currentUser) return;
    const src = {}; ['imgUp2', 'imgRemove', 'frmRecord_submit', 'frmRecord_submit_C2C', 'setCategory', 'setBookInfo', 'checkAutoIsbn2', 'catPopUp', 'authorSearch', 'openBrand', 'fn_formSet', 'stockStatusChg', 'checkOver1Digit', 'SetIsUniv', 'UnivCategory_Selected', 'FindUnivCategory_Show'].forEach((k) => { try { const f = W0[k]; if (typeof f === 'function') src[k] = String(f).slice(0, 20000); } catch (e) {} });
    let up = null; try { const fr = document.getElementById('imgUploader'); const d = fr && (fr.contentDocument || (fr.contentWindow && fr.contentWindow.document)); up = { src: fr ? fr.getAttribute('src') : null, html: d && d.documentElement ? d.documentElement.outerHTML.slice(0, 30000) : null }; } catch (e) { up = { err: e.message }; }
    const files = [...document.querySelectorAll('input[type=file]')].map((x) => x.outerHTML.slice(0, 300)); const scripts = [...document.querySelectorAll('script[src]')].map((x) => x.src).slice(0, 40);
    try { await C('reg_probe').doc('wrecord_' + day + '_' + TAB).set({ at: nowIso(), pc: PC_NAME, url: location.href, src, uploader: up, files, scripts, uploadedAt: TS() }); GM_setValue('rn-reg-probe', day); } catch (e) {} })();
  const m = location.hash.match(/rnreg=([\w-]+)/); if (!m) return; const itemId = m[1];
  /* ── ③ 판 (사람이 보는 등록 화면) ── */
  const box = document.createElement('div'); box.id = 'rnRegFill'; box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483646;width:360px;max-height:92vh;overflow:auto;background:#fff;border:2px solid #2F5D50;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:13px/1.5 system-ui,"Malgun Gothic",sans-serif;color:#1E2B28';
  const paint = (html) => { box.innerHTML = `<div style="background:#2F5D50;color:#fff;padding:8px 12px;font-weight:800;display:flex;justify-content:space-between"><span>📥 리드나우 등록 도우미</span><span id="rnRfX" style="cursor:pointer">✕</span></div><div style="padding:10px 12px">${html}</div>`; const x = box.querySelector('#rnRfX'); if (x) x.onclick = () => (box.style.display = 'none'); };
  const mount = () => { if (!box.isConnected) document.body.appendChild(box); }; if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  paint('Firebase에서 등록 계획을 읽는 중…'); const F = makeFiller(document, W0, {});
  async function submit(it, plan, rep) { const P = await F.prep(itemId, it, plan, rep, null);
    const pend = { cmdId: P.cmdId, itemId, execKey: P.execKey, at: Date.now(), sentAt: nowIso(), url: location.href, alerts: [] }; GM_setValue(KEY_PEND, pend);
    const sink = { push: (msg) => { try { const p = GM_getValue(KEY_PEND, null); if (p) { p.alerts = [...(p.alerts || []), msg]; GM_setValue(KEY_PEND, p); } } catch (e) {} } }; F.hook(sink, false);
    W0.frmRecord_submit_C2C(false, '6', plan.method === 'one');
    /* 화면이 그대로면(알라딘이 입력을 막음 = 보내지 않음) 5초 뒤: 알림 글을 보여 주고 이 일은 '보내지 않음'으로 — 다시 고쳐서 누를 수 있게 */
    setTimeout(async () => { const p = GM_getValue(KEY_PEND, null); if (!p || p.cmdId !== P.cmdId) return; const al = p.alerts || []; if (!al.length) return; // 알림 없이 기다리는 중이면 화면이 바뀔 때 처리
      if (al.some((a) => /등록되었|완료/.test(a))) return; GM_deleteValue(KEY_PEND);
      await P.ref.set({ status: 'fail', sent: false, msg: '알라딘이 입력을 막음: ' + al.join(' / ').slice(0, 300), results: { [itemId]: { state: 'fail', at: nowIso(), msg: al.join(' / ').slice(0, 200) } }, doneAt: nowIso(), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await C('reg_items').doc(itemId).set({ stage: 'pick', cmdId: null, final: null, lookErr: '알라딘 등록 화면: ' + al.join(' / ').slice(0, 200), uploadedAt: TS() }, { merge: true }).catch(() => {});
      await P.X.finish(db, { kind: 'regOne', key: P.execKey }, 'failed', { msg: al.join(' / ') }).catch(() => {});
      paint(`<b style="color:#B0322A">알라딘이 등록을 막았습니다</b><div style="margin:6px 0">${al.map(esc).join('<br>')}</div><div>알라딘에 등록되지 않았습니다. 화면에서 고친 뒤 알라딘의 '등록완료'를 직접 누르거나, 웹앱에서 고쳐 다시 여세요.</div>`); }, 5000); }
  (async () => { await whenAuth(); if (!auth.currentUser) return paint('Firebase 로그인이 안 됨 — 수집기 탭에서 로그인한 뒤 다시 여세요');
    const sn = await C('reg_items').doc(itemId).get().catch(() => null); const it = sn && sn.exists ? sn.data() : null; if (!it || !it.plan) return paint('등록 계획을 찾지 못함 — 웹앱에서 다시 \'채워서 열기\'');
    if (it.stage === 'done') return paint('이미 등록을 보낸 상품입니다 (웹앱 확정 탭에서 결과 확인) — 다시 채우지 않음');
    const plan = it.plan; let rep = []; try { rep = await F.fill(plan); } catch (e) { return paint(`<b style="color:#B0322A">채우지 못함</b><div>${esc(e.message)}</div>`); }
    /* (1.48.0) 사진: 자동으로 넣지 않음 — 칸마다 사진을 보여 주고 '받기'(이 PC에 내려받기 → 알라딘 '찾아보기'에서 고름) · '넣기 (시험)'(한 칸만 자동 시도) */
    const todo = F.photoTodo(plan); let photoState = {};
    const photoHtml = () => todo.length ? `<div style="background:#F4F8FE;border:1px solid #B9CCEB;border-radius:8px;padding:6px 8px;margin:6px 0"><b>📷 사진 ${todo.length}장</b> <small style="color:#5B6B66">받기 → 아래 알라딘 사진 칸의 '찾아보기'에서 고름</small>${todo.map((t, i) => `<div style="display:flex;gap:6px;align-items:center;margin-top:4px"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(t.label)}</b> <small style="color:#5B6B66">${esc(t.x.name)}${t.field ? ' → ' + esc(t.field) : ' → 편집기 사진 넣기'}</small>${photoState[i] ? ` <small style="color:${photoState[i].ok ? '#2F5D50' : '#B0322A'}">${esc(photoState[i].msg)}</small>` : ''}</span><button data-rnpdl="${i}" style="border:1px solid #2F5D50;background:#fff;color:#2F5D50;border-radius:6px;padding:2px 8px;cursor:pointer">받기</button>${t.field ? `<button data-rnpput="${i}" style="border:1px solid #9FB3AC;background:#fff;color:#5B6B66;border-radius:6px;padding:2px 6px;cursor:pointer" title="이 칸에 자동으로 넣어 봄 (시험 — 안 되면 받기로)">넣기</button>` : ''}</div>`).join('')}</div>` : (plan.method === 'new' ? '<div style="color:#A8661B;margin:6px 0">미등록 상품은 대표 이미지가 필수 — 웹앱 카드의 사진 칸에 끌어 놓거나, 화면 아래 \'대표 이미지\'에서 직접 첨부</div>' : '');
    const draw = () => { const bad = rep.filter((x) => !x.ok);
      paint(`<div style="font-weight:800;font-size:14px">${esc(plan.method === 'new' ? '미등록 상품 등록' : '개별 등록')}${plan.univ && plan.univ.on ? ' · 🎓 대학교장터' : ''} · ${esc(plan.title || '')}</div>
      <div style="margin:4px 0;color:#5B6B66">${esc(plan.code)} · ${(+plan.price).toLocaleString()}원 · ${esc({ 1: '최상', 2: '상', 3: '중' }[+plan.grade])} · ${+plan.qty || 1}부</div>
      <div style="margin:6px 0">${rep.map((x) => `<div style="color:${x.ok ? '#2F5D50' : '#B0322A'}">${x.ok ? '✓' : '✗'} ${esc(x.k)}${x.note ? ` <small style="color:#5B6B66">${esc(x.note)}</small>` : ''}</div>`).join('')}</div>
      ${photoHtml()}${bad.length ? `<div style="color:#B0322A;margin:4px 0">✗ 칸은 화면에서 직접 확인·입력</div>` : ''}
      <button id="rnRfGo" style="width:100%;margin-top:6px;padding:10px;border:0;border-radius:8px;background:#B0322A;color:#fff;font-weight:800;font-size:14px;cursor:pointer">확인했음 → 등록완료 (기록 남기고 알라딘에 보냄)</button>
      <div style="color:#5B6B66;font-size:11.5px;margin-top:4px">알라딘의 '등록완료'를 직접 눌러도 등록되지만, 그러면 웹앱이 결과를 모릅니다 — 이 단추로 누르세요.</div>`);
      box.querySelectorAll('[data-rnpdl]').forEach((b) => (b.onclick = async () => { const t = todo[+b.dataset.rnpdl]; b.disabled = true; try { const f = await getPhoto(t.x); const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = (t.field ? t.field + '_' : 'desc_') + (t.x.name || 'photo.jpg').replace(/\.[^.]+$/, '') + '.jpg'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); photoState[+b.dataset.rnpdl] = { ok: true, msg: '받음' }; } catch (e) { photoState[+b.dataset.rnpdl] = { ok: false, msg: e.message }; } draw(); }));
      box.querySelectorAll('[data-rnpput]').forEach((b) => (b.onclick = async () => { const i = +b.dataset.rnpput; const t = todo[i]; b.disabled = true; b.textContent = '넣는 중'; let r; try { r = await F.attachOne(t.field, await getPhoto(t.x)); } catch (e) { r = { ok: false, why: e.message }; } photoState[i] = { ok: r.ok, msg: r.ok ? '들어감' : '안 됨 — 받기로: ' + r.why }; draw(); }));
      const go = box.querySelector('#rnRfGo'); go.onclick = async () => { go.disabled = true; go.textContent = '보내는 중…'; try { await submit(it, plan, rep); go.textContent = '보냄 — 알라딘 화면 결과를 기다리는 중'; } catch (e) { go.disabled = false; go.textContent = '확인했음 → 등록완료'; alert('등록하지 않음: ' + e.message); } }; };
    draw();
  })();
})();