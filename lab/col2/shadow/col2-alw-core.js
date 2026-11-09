/* col2-alw-core.js — 🟧✍ 번외 알라딘 '그림자 쓰기' — 순수 함수(네트워크·저장 없음 · 도우미 Node와 시험이 같이 씀)
 * 정범님 11/09 밤 '돈 걸린 쓰기는 하루 그림자 쓰기 비교 뒤 하나씩 넘김'(lab/col2/LOGIN_PLAN.md ④-4):
 *  ① 운영 수집기가 알라딘에 쓰기 요청을 실제로 보낸 직후, 그 요청 꼴(주소·보낸 값·순서 — 번호·값만)과 그 일의 입력을 이 PC 번외 도우미에 알림(POST /al/wfeed)
 *  ② 번외는 같은 입력으로 '보낼 요청'을 만들기만 하고(build) 운영이 보낸 요청과 칸마다 견줌(compare) — **보내지 않음**(이 파일·도우미 col2-alw.js 어디에도 보내는 길이 없음)
 *  ③ 손님 정보는 처음부터 없음: 아래 scrub이 남기는 값은 KEEP 칸(번호·값)뿐 · 글 칸(답변·송장 번호)은 '#h<해시>/<길이>'로만 · 그 밖 칸은 이름만(x)
 *     운영 수집기(src/readnow-collector.src.js rnC2w)에도 글자 그대로 같은 규칙이 있음 — src/tests/tC2W.js가 두 쪽 결과가 같음을 확인
 *  ④ 같은 일 두 번 금지(되풀이 0) · 같은 송장 두 번 금지(약속 10) — 번외라면 보내지 않았을 일은 'refuse'(번외가 더 조심함)로 따로 셈
 *  ⑤ '넘길 수 있음' 셈(passOf) — 그 일 하나씩 · 하루(한국 날짜) 단위 · 근거: 없음, 설정(col2.json alwPass)으로 바꿈 */
(function (root) {
  'use strict';
  /* 값을 남기는 칸(번호·상태·값) — 이 밖의 칸은 이름만 */
  const KEEP = /^(cmd|ItemId|priceSales|realStock|supCode|fn|stockStatusBefore|stockStatusToDo|items|ono|ordersItem|cancelReason|questionid|method|orderstep|edit|pkid|action|UpdateItemId|bookid|stockCount|supItemCode|stockState|QualityType|Action|targetO|branchType|imgalign|excelAction|regItemAction|isbn|directDelivery|halfDelivery|deliveryPriceType|deliveryPolicyRP|expectDeliveryType|optMinOrderPrice|deliveryPrice3|deliveryPrice2|freeDeliveryMinPrice|deliveryPriceRP|deliveryPriceHalf|minOrderPrice|startDateY|startDateM|startDateD|endDateY|endDateM|endDateD|isPause)$/;
  /* 글이 들어가는 칸 — 해시와 길이만(답변 글·송장 번호) */
  const HASH = /^(txtAnswer|answer|deliveryNo|invoiceNo|invNo|songjangNo|invH|itemSubTitle|noticeMsg|tokenId|excelKey)$|^deliveryNo\.[\w-]{1,40}$/i;
  const PHONE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g;
  const fnv = (s) => { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
  const hashTxt = (v) => '#h' + fnv(v) + '/' + String(v).length;
  const val = (v) => String(v == null ? '' : v).slice(0, 200).replace(PHONE, '#전화');
  /* 요청 하나 → {m, p, q, b, x} (m = GET·POST · p = 경로 · q·b = 남긴 칸 · x = 값을 버린 칸 이름) */
  function scrub(r) { r = r || {}; let u; try { u = new URL(String(r.u || ''), 'https://www.aladin.co.kr'); } catch (e) { return { m: String(r.m || 'GET').toUpperCase(), p: '?', q: {}, b: null, x: [] }; }
    const x = new Set(); const put = (o, k, v) => { if (k === '_') return; if (KEEP.test(k)) { const s = val(v); if (k in o) o[k] = [].concat(o[k], s); else o[k] = s; } else if (HASH.test(k)) o[k] = hashTxt(v); else x.add(String(k).slice(0, 60)); };
    const q = {}; u.searchParams.forEach((v, k) => put(q, k, v));
    let b = null; const B = r.b;
    if (B != null) { b = {}; if (typeof B === 'string' || (typeof URLSearchParams !== 'undefined' && B instanceof URLSearchParams)) new URLSearchParams(String(B)).forEach((v, k) => put(b, k, v));
      else if (Array.isArray(B.keys)) B.keys.forEach((k) => x.add(String(k).slice(0, 60))); /* 파일 양식(FormData) — 칸 이름만 */ }
    return { m: String(r.m || 'GET').toUpperCase(), p: u.pathname, q, b, x: [...x].sort() }; }
  /* 입력(그 일의 결정) — 숫자·짧은 글만 · 전화 꼴은 가림 · 깊이 3 */
  function scrubIn(v, d) { d = d || 0; if (v == null) return null; if (typeof v === 'number' || typeof v === 'boolean') return v; if (typeof v === 'string') return val(v).slice(0, 80);
    if (d >= 3) return null; if (Array.isArray(v)) return v.slice(0, 400).map((x) => scrubIn(x, d + 1)); if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v).slice(0, 30)) o[String(k).slice(0, 40)] = HASH.test(k) && typeof v[k] === 'string' && !/^#h/.test(v[k]) ? hashTxt(v[k]) : scrubIn(v[k], d + 1); return o; } return null; }

  const PE_ST = { 판매중: 1, 일시판매중지: 3, 판매중지: 15 }; /* 운영 수집기 PE_ST와 같음 */
  const enc = encodeURIComponent; const esc = typeof escape === 'function' ? escape : (s) => enc(s);
  const batch = (before, to, items) => ({ m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: `fn=stockstatusbulkchg&stockStatusBefore=${before}&stockStatusToDo=${to}&items=${items}` });
  /* 일 종류 — conn = 운영 수집기에 알림이 이어져 있음 · ship = 보통 🚚 출고 보호 안에서 하는 일(약속 0-1로 알리지 않으므로 표본이 거의 없음) · minN = 하루 견줌 최소 수(근거: 없음, 설정으로 바꿈) */
  const KINDS = {
    edit: { t: '상품 값 바꾸기(판매가·수량·관리코드·판매상태)', w: 'W1·W2·W3·W4', money: true, conn: true, ship: false, minN: 30 },
    state: { t: '판매상태 바꾸기(현금 판매 중지·재개)', w: 'W4', money: true, conn: true, ship: true, minN: 10 },
    del: { t: '상품 삭제', w: 'W5', money: true, conn: true, ship: false, minN: 5 },
    start: { t: '발송준비시작', w: 'W9', money: false, conn: true, ship: true, minN: 10 },
    cancel: { t: '판매 불가 통보(주문 취소)', w: 'W12', money: true, conn: true, ship: true, minN: 3 },
    inv: { t: '송장 입력(한 건 · 입력완료)', w: 'W10', money: false, conn: true, ship: true, minN: 20 },
    /* (11/10) 화면 단추·양식으로 보내는 쓰기 — 운영 수집기가 양식 값이 정해진 때(단추 누르기 직전·보낸 직후) 그 양식 꼴을 알림 · 화면에서 온 칸(숨은 칸·__VIEWSTATE 등)은 운영 양식 그대로 두고, 우리가 정한 칸만 번외가 같은 입력으로 다시 채워 견줌 */
    invs: { t: '송장 입력(여러 건 · 선택 입력완료)', w: 'W10', money: false, conn: true, ship: true, minN: 10 },
    invcsv: { t: '송장 일괄 올리기(CSV)', w: 'W11', money: false, conn: true, ship: true, minN: 5 },
    info: { t: '상품 정보 수정(등급·부제·사진 · 수정 화면 양식)', w: 'W6', money: true, conn: true, ship: false, minN: 10 },
    reg: { t: '상품 등록(한 권 · 등록 화면 양식)', w: 'W7', money: true, conn: true, ship: false, minN: 10 },
    bulk: { t: '대량 등록(엑셀 올리기·등록 완료)', w: 'W8', money: true, conn: true, ship: false, minN: 3 },
    answer: { t: '문의 답변', w: 'W13', money: false, conn: true, ship: false, minN: 5 },
    notice: { t: '공지 저장', w: 'W14', money: false, conn: true, ship: false, minN: 3 },
    ndel: { t: '공지 삭제', w: 'W14', money: false, conn: true, ship: false, minN: 3 },
    shop: { t: '가게 배송 설정 저장', w: 'W14', money: true, conn: true, ship: false, minN: 3 },
    sell: { t: '팔기 장바구니 담기(알라딘 매입)', w: 'W15', money: true, conn: true, ship: false, minN: 10 },
  };
  const PE_GR = { 최상: 1, 상: 2, 중: 3 }; /* 운영 수집기 PE_GR와 같음 */
  const isH = (v) => /^#h[0-9a-f]{8}\/\d{1,6}$/.test(String(v));
  const setVal = (k, v) => (HASH.test(k) ? (isH(v) ? String(v) : hashTxt(v)) : Array.isArray(v) ? v.map(val) : val(v));
  /* 양식 하나 — 방법·주소는 번외가 아는 값(def.m·def.p) · 화면에서 온 칸은 운영 양식(tpl) 그대로 · 우리가 정한 칸(set → 양식 몸 · GET 양식이면 주소 칸 / setQ → 주소 칸)만 번외가 채움 */
  function formReq(def, i, tpl0) { const tpl = tpl0 ? reClean(tpl0) : { m: '', p: '', q: {}, b: null, x: [] }; const S = def.set ? def.set(i) || {} : {}, SQ = def.setQ ? def.setQ(i) || {} : {};
    const m = def.m || tpl.m || 'POST'; const toB = tpl.b != null || (!tpl0 && m !== 'GET'); const q = {}, b = toB ? {} : null;
    for (const [k, v] of Object.entries(tpl.q || {})) if (!(k in SQ) && (toB || !(k in S))) q[k] = v;
    if (toB) for (const [k, v] of Object.entries(tpl.b || {})) if (!(k in S)) b[k] = v;
    for (const [k, v] of Object.entries(S)) if (v != null) (toB ? b : q)[k] = setVal(k, v); for (const [k, v] of Object.entries(SQ)) if (v != null) q[k] = setVal(k, v);
    return { _pre: 1, m, p: def.p, q, b, x: (tpl.x || []).filter((k) => !(k in S) && !(k in SQ)) }; }
  const pre = (m, p, q, b, x) => ({ _pre: 1, m, p, q: q || {}, b: b === undefined ? null : b, x: (x || []).slice().sort() });
  const i10Of = (i13) => { i13 = String(i13 || ''); if (!/^978\d{10}$/.test(i13)) return null; const b = i13.slice(3, 12); let t = 0; for (let k = 0; k < 9; k++) t += +b[k] * (10 - k); const c = (11 - (t % 11)) % 11; return b + (c === 10 ? 'X' : String(c)); }; /* 운영 수집기 c2bAddOne과 같은 셈 */
  const FORM = {
    inv: { p: '/scm/worder_delivery.aspx', set: (i) => ({ ['deliveryNo.' + i.ono]: i.invH }) },
    invs: { p: '/scm/worder_delivery.aspx', set: (i) => { const o = {}; for (const x of i.L || []) o['deliveryNo.' + x.ono] = x.invH; return o; } },
    info: { m: 'POST', p: '/scm/wrecord.aspx', set: (i) => { const ch = i.ch || {}, B = i.base || {}; const o = { UpdateItemId: String(i.lid), priceSales: Math.round(+(ch.price != null ? ch.price : B.price)), stockCount: Math.round(+(ch.qty != null ? ch.qty : B.qty)), supItemCode: ch.code != null ? ch.code : B.code == null ? '' : B.code, stockState: ch.state != null ? PE_ST[ch.state] : B.state };
      if (ch.grade != null) o.QualityType = PE_GR[ch.grade]; if (i.itemSubTitle != null) o.itemSubTitle = i.itemSubTitle; return o; } },
    reg: { m: 'POST', p: '/scm/wrecord.aspx', set: (i) => { const P = i.plan || {}; return { priceSales: +P.price, stockCount: Math.max(1, +P.qty || 1), stockState: { 1: 1, 2: 3, 3: 15 }[+P.saleState || 1], supItemCode: P.code == null ? '' : P.code, QualityType: +P.grade }; } },
    answer: { m: 'POST', p: '/scm/wUsedShopC2CAnswer.aspx', setQ: (i) => ({ questionid: i.questionid }), set: (i) => ({ txtAnswer: i.txtAnswer }) },
    notice: { p: '/scm/NoticeEdit.aspx', set: (i) => { const [sy, sm, sd] = String(i.start || '').split('-'), [ey, em, ed] = String(i.end || '').split('-'); const o = { noticeMsg: i.noticeMsg, startDateY: +sy, startDateM: +sm, startDateD: +sd, endDateY: +ey, endDateM: +em, endDateD: +ed, edit: 'save' }; if (+i.pkid > 0) o.pkid = i.pkid; return o; } },
    shop: { p: '/scm/wC2Cuser_account_make.aspx', set: (i) => { const o = {}; for (const [k, v] of Object.entries(i.want || {})) if (/^(directDelivery|halfDelivery|deliveryPriceType|deliveryPolicyRP|expectDeliveryType|optMinOrderPrice|deliveryPrice3|deliveryPrice2|freeDeliveryMinPrice|deliveryPriceRP|deliveryPriceHalf|minOrderPrice)$/.test(k)) o[k] = v; return o; } },
  };
  /* 번외가 '보낼 요청'을 만듦(보내지 않음) — 운영 수집기와 같은 순서·같은 주소 */
  const BUILD = {
    edit: (i) => { const L = [], ch = (i && i.ch) || {}, lid = String(i.lid); const cur = (i && i.cur) || {};
      if ('price' in ch) L.push({ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.pricesales&ItemId=${enc(lid)}&priceSales=${Math.round(ch.price)}` });
      if ('qty' in ch) L.push({ m: 'GET', u: `/scm/ajaxCmd.aspx?cmd=chg.stock&ItemId=${enc(lid)}&realStock=${Math.round(ch.qty)}` });
      if ('code' in ch) L.push({ m: 'POST', u: '/scm/ajaxCmd.aspx', b: `cmd=chg.supplieritemcode&ItemId=${enc(lid)}&supCode=${esc(ch.code)}` });
      if ('state' in ch) { const to = PE_ST[ch.state]; if (to != null && to !== +cur.state) L.push(batch(cur.state, to, lid)); }
      return L; },
    state: (i) => [{ m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(i.before), stockStatusToDo: String(i.to), items: String(i.lid) }).toString() }],
    del: (i) => [{ m: 'POST', u: '/scm/wrecord_edit_usedbatch.aspx', b: new URLSearchParams({ fn: 'stockstatusbulkchg', stockStatusBefore: String(i.before), stockStatusToDo: '17', items: (i.lids || []).map(String).join(',') }).toString() }],
    start: (i) => [{ m: 'GET', u: `/scm/worder_process.aspx?cmd=StartDelivery&ono=${enc(i.ono)}` }],
    cancel: (i) => { const q = new URLSearchParams(); for (const k of i.keys || []) q.append(k, ''); q.append('ono', i.ono); q.append('cancelReason', String(i.reason)); for (const it of i.items || []) q.append('ordersItem', String(it)); return [{ m: 'GET', u: '/scm/ReportNotSalesLayer.aspx?' + q.toString() }]; },
    /* (11/10) 화면 단추·양식 쓰기 — op = 운영이 알린 요청(화면에서 온 칸의 틀로만 씀 · 우리가 정한 칸은 번외가 입력으로 채움) */
    inv: (i, op) => [formReq(FORM.inv, i, op[0])],
    invs: (i, op) => [formReq(FORM.invs, i, op[0])],
    invcsv: () => [pre('POST', '/scm/worder_deliveryNoBulk.aspx', {}, {}, ['csvFile'])],
    info: (i, op) => { const ups = (i.ups || []).map((u) => (u && u.t === 'desc' ? pre('POST', '/scm/upload/wimage_upload_scm.aspx', {}, { action: '1', imgalign: '1' }, ['uploadFile']) : pre('POST', '/scm/upload/imgUpPopup.aspx', {}, { Action: '1', targetO: val(u && u.f), branchType: '6' }, ['SCMImg']))); return [...ups, formReq(FORM.info, i, op[ups.length])]; },
    reg: (i, op) => [formReq(FORM.reg, i, op[0])],
    bulk: (i) => [pre('POST', '/scm/UsedItemBulkReg.aspx', {}, { excelAction: '1', excelKey: setVal('excelKey', i.excelKey) }, ['excelFileInput', 'excelFileInputText', 'x', 'y']),
      pre('GET', '/scm/UsedItemBulkReg.aspx', { regItemAction: '1', tokenId: setVal('tokenId', i.tokenId) }, null, [...(i.pairs || []).map((pk) => 'chk_' + pk), 'x', 'y'])],
    answer: (i, op) => [formReq(FORM.answer, i, op[0])],
    notice: (i, op) => [formReq(FORM.notice, i, op[0])],
    ndel: (i) => [{ m: 'GET', u: '/scm/NoticeEdit.aspx?edit=del&pkid=' + enc(i.pkid) }],
    shop: (i, op) => [formReq(FORM.shop, i, op[0])],
    sell: (i) => { const i10 = i10Of(i.isbn13) || (i.isbn10 ? String(i.isbn10) : ''); return [pre('CLICK', '/shop/usedshop/wc2b_search.aspx', { isbn: val(i10) }, null, ['c2b_add'])]; },
  };
  /* 번외가 '보낼 요청'을 만듦(보내지 않음) · op = 운영이 알린 요청(양식 쓰기에서 화면이 정한 칸의 틀로만) */
  function build(kind, input, op) { const f = BUILD[kind]; if (!f) throw new Error('번외가 아직 만들 줄 모르는 쓰기: ' + kind); const O = Array.isArray(op) ? op : [];
    return f(input || {}, O).map((r) => { if (r && r._pre) { const { _pre, ...z } = r; return z; } return scrub(r); }); }
  /* 같은 일인지 가리는 이름(되풀이 막기) */
  function keyOf(kind, i) { i = i || {}; const s = (a) => (a || []).map(String).sort().join(',');
    if (kind === 'edit') { const ch = i.ch || {}; return `edit|${i.lid}|${['price', 'qty', 'code', 'state'].filter((k) => k in ch).map((k) => k + '=' + ch[k]).join('&')}`; }
    if (kind === 'state') return `state|${i.lid}|${i.before}>${i.to}`; if (kind === 'del') return `del|${s(i.lids)}`; if (kind === 'start') return `start|${i.ono}`;
    if (kind === 'cancel') return `cancel|${i.ono}|${s(i.items)}|${i.reason}`; if (kind === 'inv') return `inv|${i.ono}|${i.invH || ''}`;
    if (kind === 'invs' || kind === 'invcsv') return `${kind}|${s((i.L || []).map((x) => x.ono + ':' + (x.invH || '')))}`;
    if (kind === 'info') return `info|${i.lid}|${JSON.stringify(i.ch || {})}|${i.itemSubTitle || ''}|${(i.ups || []).length}`; if (kind === 'reg') return `reg|${i.item || ''}|${(i.plan || {}).isbn || ''}`;
    if (kind === 'bulk') return `bulk|${s(i.pairs)}`; if (kind === 'answer') return `answer|${i.questionid}|${i.txtAnswer || ''}`; if (kind === 'notice') return `notice|${i.pkid || 0}|${i.noticeMsg || ''}|${i.start}~${i.end}`;
    if (kind === 'ndel') return `ndel|${i.pkid}`; if (kind === 'shop') return `shop|${Object.entries(i.want || {}).map(([k, v]) => k + '=' + v).sort().join('&')}`; if (kind === 'sell') return `sell|${i.isbn13}|${i.cq0 == null ? 0 : i.cq0}`;
    return kind + '|' + JSON.stringify(i).slice(0, 200); }
  /* 그 일에 든 송장(주문번호·송장 해시) — 같은 송장 두 번 금지(약속 10) 셈 */
  const invsOf = (kind, i) => (kind === 'inv' ? [{ ono: i.ono, invH: i.invH }] : kind === 'invs' || kind === 'invcsv' ? (i.L || []) : []).filter((x) => x && x.invH);
  /* 같은 송장 두 번 금지(약속 10) — 송장(해시) → 주문번호 · 다른 주문에 같은 송장이면 dup */
  function invCheck(map, ono, invH) { if (!invH) return { ok: true }; const was = map[invH]; if (was && String(was) !== String(ono)) return { ok: false, dup: true, was: String(was) }; map[invH] = String(ono); return { ok: true }; }

  /* 운영이 알린 요청(이미 가린 꼴)을 한 번 더 가림 — 칸 규칙 밖 값이 들어와도 버림(믿지 않음) */
  function reClean(r) { r = r && typeof r === 'object' ? r : {}; const fix = (o) => { if (o == null || typeof o !== 'object') return null; const z = {}; for (const [k, v] of Object.entries(o).slice(0, 60)) { if (KEEP.test(k)) z[k] = Array.isArray(v) ? v.slice(0, 200).map(val) : val(v); else if (HASH.test(k)) z[k] = /^#h[0-9a-f]{8}\/\d{1,6}$/.test(String(v)) ? String(v) : hashTxt(v); } return z; };
    const xs = (Array.isArray(r.x) ? r.x : []).concat(Object.keys(r.q || {}).filter((k) => !KEEP.test(k) && !HASH.test(k)), Object.keys(r.b || {}).filter((k) => !KEEP.test(k) && !HASH.test(k)));
    return { m: String(r.m || '').toUpperCase().slice(0, 6), p: String(r.p || '').slice(0, 120), q: fix(r.q) || {}, b: r.b == null ? null : fix(r.b), x: [...new Set(xs.map((k) => String(k).slice(0, 60)))].sort() }; }
  const norm = (v) => (Array.isArray(v) ? v.map(String).sort().join(',') : v == null ? null : String(v));
  /* 칸마다 견줌 — 요청 수·차례·방법·경로·남긴 칸 값·이름만 칸 */
  function compare(opRq, c2Rq) { const A = (opRq || []).map(reClean), B = c2Rq || []; const diffs = [];
    if (A.length !== B.length) diffs.push({ f: '요청 수', op: A.length, c2: B.length });
    for (let i = 0; i < Math.min(A.length, B.length); i++) { const a = A[i], b = B[i];
      if (a.m !== b.m) diffs.push({ i, f: '방법', op: a.m, c2: b.m }); if (a.p !== b.p) diffs.push({ i, f: '주소', op: a.p, c2: b.p });
      for (const part of ['q', 'b']) { const x = a[part] || {}, y = b[part] || {}; if ((a[part] == null) !== (b[part] == null)) diffs.push({ i, f: part === 'q' ? '주소 칸' : '보낸 값', op: a[part] == null ? '없음' : '있음', c2: b[part] == null ? '없음' : '있음' });
        for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (norm(x[k]) !== norm(y[k])) diffs.push({ i, f: (part === 'q' ? '주소.' : '값.') + k, op: x[k] == null ? null : norm(x[k]), c2: y[k] == null ? null : norm(y[k]) }); }
      if (a.x.join(',') !== (b.x || []).join(',')) diffs.push({ i, f: '이름만 칸', op: a.x.join(','), c2: (b.x || []).join(',') }); }
    return { verdict: diffs.length ? 'diff' : 'same', diffs: diffs.slice(0, 30), n: A.length }; }

  /* 일마다 받는 입력 칸(그 밖은 버림 — 운영이 실수로 손님 칸을 실어도 남지 않게) */
  const IN = { edit: ['lid', 'ch', 'cur'], state: ['lid', 'before', 'to'], del: ['lids', 'before'], start: ['ono'], cancel: ['ono', 'items', 'reason', 'keys'], inv: ['ono', 'invH'],
    invs: ['L'], invcsv: ['L'], info: ['lid', 'ch', 'base', 'itemSubTitle', 'ups'], reg: ['item', 'plan'], bulk: ['pairs', 'n', 'tokenId', 'excelKey'], answer: ['questionid', 'txtAnswer', 'edit'],
    notice: ['pkid', 'noticeMsg', 'start', 'end'], ndel: ['pkid'], shop: ['want'], sell: ['isbn13', 'isbn10', 'cq0', 'multi'] };
  const hOf = (v) => (v == null ? v : isH(v) ? String(v) : hashTxt(v)); const pick = (o, ks) => { const z = {}; if (o && typeof o === 'object') for (const k of ks) if (o[k] !== undefined) z[k] = o[k]; return z; };
  function pickIn(kind, v) { v = v && typeof v === 'object' ? v : {}; const o = {}; for (const k of IN[kind] || []) if (v[k] !== undefined) o[k] = v[k];
    if (o.ch && typeof o.ch === 'object') o.ch = pick(o.ch, kind === 'info' ? ['price', 'qty', 'code', 'state', 'grade'] : ['price', 'qty', 'code', 'state']);
    if (o.base) o.base = pick(o.base, ['price', 'qty', 'code', 'state']); if (o.plan) o.plan = pick(o.plan, ['price', 'qty', 'grade', 'code', 'saleState', 'isbn']); if (o.want) o.want = pick(o.want, Object.keys(o.want).filter((k) => /^\w{1,40}$/.test(k)).slice(0, 20));
    if (Array.isArray(o.L)) o.L = o.L.slice(0, 200).map((x) => ({ ono: String((x && x.ono) || ''), invH: hOf(x && x.invH) })); if (Array.isArray(o.ups)) o.ups = o.ups.slice(0, 20).map((u) => (u && u.t === 'desc' ? { t: 'desc' } : { t: 'cov', f: String((u && u.f) || '').slice(0, 40) }));
    if (Array.isArray(o.pairs)) o.pairs = o.pairs.slice(0, 400).map(String); for (const k of ['itemSubTitle', 'txtAnswer', 'noticeMsg', 'tokenId', 'excelKey']) if (o[k] != null) o[k] = hOf(o[k]);
    if (o.cur && typeof o.cur === 'object') o.cur = { state: o.cur.state }; if (o.invH != null && !/^#h[0-9a-f]{8}\/\d{1,6}$/.test(String(o.invH))) o.invH = hashTxt(o.invH);
    if (Array.isArray(o.keys)) o.keys = o.keys.map((k) => String(k).slice(0, 60)).filter((k) => /^[\w$.\-\[\]]{1,60}$/.test(k)); return o; }
  /* 하루 셈 한 칸 */
  const dayNew = () => ({ n: 0, same: 0, diff: 0, bad: 0, refuse: 0, opRep: 0, dupInv: 0, c2Rep: 0, c2DupInv: 0, sent: 0 });
  /* '넘길 수 있음' — 그 일 하나 · 하루치 셈으로
   *   견준 수 ≥ minN · 다름 0 · 못 만듦 0 · 번외가 같은 일을 두 번 보내려 한 수 0(되풀이 0) · 번외가 같은 송장을 다른 주문에 쓰려 한 수 0(약속 10) · 번외가 알라딘에 보낸 쓰기 0
   *   운영이 같은 일을 다시 보냄(opRep)·운영이 같은 송장을 두 번(dupInv)은 번외가 막은 것 — 넘김을 막지 않고 따로 알림
   *   근거: 없음, 설정(col2.json alwPass {minN: {edit: 30 …}})으로 바꿈 */
  function passOf(kind, d, cfg) { d = { ...dayNew(), ...(d || {}) }; const K = KINDS[kind] || {}; const c = cfg || {}; const minN = +((c.minN || {})[kind]) || K.minN || 30; const why = [];
    if (!K.conn) why.push('운영 수집기에 아직 이어지지 않음');
    if (d.n < minN) why.push(`견준 수 ${d.n} < ${minN}` + (K.ship ? ' (출고 중 일이라 약속 0-1로 알리지 않음 — 표본이 적음)' : ''));
    if (d.diff) why.push(`다름 ${d.diff}`); if (d.bad) why.push(`못 만듦 ${d.bad}`); if (d.c2Rep) why.push(`번외 되풀이 ${d.c2Rep}`); if (d.c2DupInv) why.push(`번외 같은 송장 ${d.c2DupInv}`); if (d.sent) why.push(`번외가 보낸 쓰기 ${d.sent}`);
    return { ok: !why.length, n: d.n, same: d.same, minN, why, rule: `견준 수 ≥ ${minN} · 다름 0 · 못 만듦 0 · 번외 되풀이 0 · 번외 같은 송장 0 · 번외가 보낸 쓰기 0`, warn: [d.opRep ? `운영이 같은 일을 다시 보냄 ${d.opRep}번(번외는 안 보냄)` : '', d.dupInv ? `운영이 같은 송장을 다른 주문에 ${d.dupInv}번(번외는 막음 · 약속 10 확인 필요)` : ''].filter(Boolean) }; }

  const api = { KEEP, HASH, fnv, hashTxt, scrub, scrubIn, reClean, KINDS, PE_ST, PE_GR, BUILD, FORM, build, IN, pickIn, keyOf, invsOf, invCheck, compare, dayNew, passOf, i10Of };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Alw = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
