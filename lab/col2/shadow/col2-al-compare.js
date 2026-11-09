/* col2-al-compare.js — 🟧 번외 알라딘 샵매니저 '읽기' 그림자 — 순수 함수(네트워크·저장 없음 · 도우미 Node와 시험이 같이 씀)
 * 정범님 11/09 밤 '로그인 일(알라딘 샵매니저·중고 판매 관리)도 번외로' — 오늘은 읽기만(값을 바꾸지 않는 화면). 쓰기는 설계만(lab/col2/LOGIN_PLAN.md).
 *  ① 읽어도 되는 주소(READ) — 이 다섯 길 밖은 번외가 알라딘에 보내지 않음. 같은 화면이라도 바꾸는 꼴(cmd=·edit=·method=edit·저장·삭제…)은 거절.
 *     GET 한 번으로 값이 바뀌는 길이 샵매니저에 있음(ajaxCmd 가격·수량 · worder_process 발송준비시작 · NoticeEdit?edit=del 공지 삭제) → 경로 이름으로 먼저 막음.
 *  ② 손님 정보는 번외 밖으로 안 나감 — 화면 안에서 해석한 뒤 번호·상태·값만 돌려받음(구매자·수령인·주소·전화·문의 글·작성자 없음).
 *     운영 문서도 웹앱이 넘겨줄 때 아래 trimProd로 같은 칸만 남기고 버림(메모리에도 손님 정보를 두지 않음).
 *  ③ 견주기 — 운영 수집기가 같은 화면에서 만든 운영 칸(prd_listings · shp_state/confirm·current · crm_interactions/aladin_qna_*)과 칸마다. */
(function (root) {
  'use strict';
  const STATUS = { 판매중: 1, 판매대기: 41, 일시판매중지: 3, 판매중지: 15, 판매완료: 18, 판매금지: 16 }; /* 운영 수집기 STATUS와 같음 */
  /* 운영 수집기 listUrl과 글자 하나까지 같은 주소(같은 화면 = 같은 결과) */
  const listUrl = (code, page) => `/scm/wrecord_edit.aspx?chkItemStockStatus=${code}&chkItemInDate=0&searchCat1=0&searchType=1&keyword=&ViewRowsCount=100&page=${page}&SortOrder=6&itemStockStatus=${code}&categoryId=0`;
  const READ = {
    chk: { t: '로그인 확인', url: () => '/scm/wmain.aspx' },
    list: { t: '상품 조회 목록', url: (o) => listUrl(STATUS[o && o.st] || 1, Math.max(1, Math.min(60, +(o && o.page) || 1))) },
    confirm: { t: '주문확인요청', url: () => '/scm/worder_preparatory_complete.aspx' },
    deliv: { t: '발송 요청', url: () => '/scm/worder_delivery.aspx?orderstep=4' },
    qna: { t: '묻고 답하기 목록', url: (o) => `/scm/wUsedShopC2CQnASellerList.aspx?page=${Math.max(1, Math.min(20, +(o && o.page) || 1))}` },
  };
  const READ_PATHS = ['/scm/wmain.aspx', '/scm/wrecord_edit.aspx', '/scm/worder_preparatory_complete.aspx', '/scm/worder_delivery.aspx', '/scm/wUsedShopC2CQnASellerList.aspx'];
  /* 값을 바꾸는 길(GET이라도) — 읽기 목록에 실수로 들어와도 여기서 막음 */
  const WRITE_PATH = /ajaxCmd|worder_process|usedbatch|upload|NoticeEdit|ReportNotSales|deliveryNoBulk|BulkReg|wrecord\.aspx|C2CAnswer|account_make|wc2b_sales|logout|login|worder_excel/i;
  const WRITE_QUERY = /(^|[?&])(cmd|edit|method|fn|action|act|mode)=|del|remove|cancel|save|proc|update|insert|confirm|apply|send|logout|pay|refund|excel|down/i;
  function isReadUrl(u) { let x; try { x = new URL(u, 'https://www.aladin.co.kr'); } catch (e) { return false; }
    if (!READ_PATHS.includes(x.pathname)) return false; if (WRITE_PATH.test(x.pathname)) return false;
    if (x.pathname === '/scm/worder_delivery.aspx') return x.search === '?orderstep=4';
    return !WRITE_QUERY.test(x.search.replace(/^\?/, '&')); }

  /* 운영 문서 → 견주는 칸만(손님 정보 버림) · 칸 이름·문서 이름 규칙 밖은 null */
  const PROD_ID = { prd_listings: /^aladin_[\w-]{1,40}$/, shp_state: /^(confirm|current)$/, crm_interactions: /^aladin_qna_\d{1,15}$/ };
  const pick = (v, ks) => { const o = {}; for (const k of ks) if (v && v[k] !== undefined) o[k] = v[k]; return o; };
  function trimProd(c, id, v) { if (!PROD_ID[c] || !PROD_ID[c].test(String(id || ''))) return undefined; if (v == null) return null; if (typeof v !== 'object') return null;
    if (c === 'prd_listings') return pick(v, ['usedCode', 'listingId', 'status', 'price', 'sku', 'grade', 'qty', 'qtyList', 'active', 'lastSeenAt', 'seenBy_scm']);
    if (c === 'shp_state') return { at: v.at || null, tabCounts: v.tabCounts && typeof v.tabCounts === 'object' ? { ...v.tabCounts } : null, orders: Array.isArray(v.orders) ? v.orders.map((o) => ({ orderNo: String((o && o.orderNo) || ''), items: Array.isArray(o && o.items) ? o.items.map((i) => ({ listingId: i && i.listingId != null ? String(i.listingId) : null })) : [], deliveryNo: (o && o.deliveryNo) || null })) : null };
    if (c === 'crm_interactions') return pick(v, ['questionId', 'answerStatus']);
    return null; }

  const tsOf = (v) => { if (v == null) return null; if (typeof v === 'number') return v; if (typeof v === 'string') { const t = Date.parse(v); return Number.isFinite(t) ? t : null; } if (v && typeof v.seconds === 'number') return v.seconds * 1000; if (v && typeof v._seconds === 'number') return v._seconds * 1000; return null; };
  const eq = (a, b) => (a == null || a === '' ? null : String(a).trim()) === (b == null || b === '' ? null : String(b).trim());
  const LIST_F = [['s', 'status', '판매 상태'], ['p', 'price', '판매가'], ['k', 'sku', '관리코드'], ['g', 'grade', '등급']];
  /* 상품 조회 목록 — 줄마다 운영 prd_listings/aladin_<U코드>와(수량은 운영이 정보수정 화면으로 고치므로 목록 숫자 qtyList와만 · 정범님 10/25) */
  function cmpList(rows, prod, at) { const R = { n: 0, same: 0, diff: 0, missing: 0, wait: 0, nocode: 0, diffs: [], byField: {} };
    for (const r of rows || []) { R.n++; if (!r.u) { R.nocode++; continue; } const d = prod(`aladin_${r.u}`); if (d === undefined) { R.wait++; continue; } if (d === null) { R.missing++; if (R.diffs.length < 30) R.diffs.push({ u: r.u, f: '운영 기록 없음' }); continue; }
      const bad = []; for (const [a, b, name] of LIST_F) if (!eq(r[a], d[b])) bad.push({ f: name, c2: r[a] == null ? null : r[a], op: d[b] == null ? null : d[b] });
      const opq = d.qtyList != null ? d.qtyList : d.qty; if (r.q != null && opq != null && +r.q !== +opq) bad.push({ f: '수량(목록)', c2: r.q, op: opq });
      if (bad.length) { R.diff++; const seen = tsOf(d.seenBy_scm) || tsOf(d.lastSeenAt); const age = seen && at ? Math.round((at - seen) / 60e3) : null; for (const b of bad) { R.byField[b.f] = (R.byField[b.f] || 0) + 1; if (R.diffs.length < 30) R.diffs.push({ u: r.u, ...b, opAgeMin: age }); } } else R.same++; }
    R.verdict = R.wait ? 'wait' : R.diff || R.missing ? 'diff' : 'same'; return R; }
  /* 주문확인요청·발송 요청 — 운영 shp_state/confirm(주문확인요청) · shp_state/current(발송 요청)와: 탭 숫자 · 주문번호 모음 · 주문마다 상품 번호 · (발송 요청) 송장 칸 */
  function cmpShip(kind, sum, d, at) { if (d === undefined) return { verdict: 'wait' }; if (d === null) return { verdict: 'diff', why: '운영 기록 없음' };
    const R = { verdict: 'same', tab: {}, onlyC2: [], onlyOp: [], items: [], inv: [], opAgeMin: null }; const opAt = tsOf(d.at); R.opAgeMin = opAt && at ? Math.round((at - opAt) / 60e3) : null;
    const tc = sum.tab || {}, to = d.tabCounts || {}; for (const k of new Set([...Object.keys(tc), ...Object.keys(to)])) if (+tc[k] !== +to[k]) R.tab[k] = { c2: tc[k] == null ? null : +tc[k], op: to[k] == null ? null : +to[k] };
    const mC = new Map((sum.orders || []).map((o) => [String(o.o), o])), mO = new Map((d.orders || []).map((o) => [String(o.orderNo), o]));
    for (const k of mC.keys()) if (!mO.has(k)) R.onlyC2.push(k); for (const k of mO.keys()) if (!mC.has(k)) R.onlyOp.push(k);
    for (const [k, o] of mC) { const p = mO.get(k); if (!p) continue; const a = (o.it || []).map(String).sort().join(','), b = (p.items || []).map((i) => String(i.listingId)).sort().join(','); if (a !== b) R.items.push({ o: k, c2: a, op: b });
      if (kind === 'deliv' && !eq(o.d, p.deliveryNo)) R.inv.push({ o: k, c2: o.d || null, op: p.deliveryNo || null }); }
    if (Object.keys(R.tab).length || R.onlyC2.length || R.onlyOp.length || R.items.length || R.inv.length) R.verdict = 'diff';
    R.timing = R.verdict === 'diff' && R.opAgeMin != null && Math.abs(R.opAgeMin) > 10; /* 운영 기록이 10분 넘게 오래됨 — 그사이 주문이 들어오고 나간 다름일 수 있음 */
    return R; }
  /* 묻고 답하기 목록 — 문의마다 운영 crm_interactions/aladin_qna_<번호>의 답변 상태와 */
  function cmpQna(rows, prod) { const R = { n: 0, same: 0, diff: 0, missing: 0, wait: 0, diffs: [] };
    for (const r of rows || []) { R.n++; const d = prod(`aladin_qna_${r.q}`); if (d === undefined) { R.wait++; continue; } if (d === null) { R.missing++; if (R.diffs.length < 30) R.diffs.push({ q: r.q, f: '운영 기록 없음' }); continue; }
      if (!eq(r.a, d.answerStatus)) { R.diff++; if (R.diffs.length < 30) R.diffs.push({ q: r.q, f: '답변 상태', c2: r.a, op: d.answerStatus == null ? null : d.answerStatus }); } else R.same++; }
    R.verdict = R.wait ? 'wait' : R.diff || R.missing ? 'diff' : 'same'; return R; }
  /* 견줄 때 받아야 하는 운영 문서 */
  function wantsOf(kind, sum) { if (kind === 'list') return (sum.rows || []).filter((r) => r.u).map((r) => ({ c: 'prd_listings', id: `aladin_${r.u}` }));
    if (kind === 'confirm') return [{ c: 'shp_state', id: 'confirm' }]; if (kind === 'deliv') return [{ c: 'shp_state', id: 'current' }];
    if (kind === 'qna') return (sum.rows || []).filter((r) => r.q).map((r) => ({ c: 'crm_interactions', id: `aladin_qna_${r.q}` })); return []; }
  function compare(kind, sum, get, at) { if (kind === 'list') return cmpList(sum.rows, (id) => get('prd_listings', id), at); if (kind === 'confirm') return cmpShip('confirm', sum, get('shp_state', 'confirm'), at);
    if (kind === 'deliv') return cmpShip('deliv', sum, get('shp_state', 'current'), at); if (kind === 'qna') return cmpQna(sum.rows, (id) => get('crm_interactions', id)); return { verdict: 'same' }; }

  /* 화면 안(번외 크롬 · 떨어진 칸)에서 도는 읽기 — 운영 공용 파일(ReadnowAladin·ReadnowProducts·ReadnowShipping·ReadnowOrders)로 해석하고 번호·상태·값만 돌려줌 */
  const READ_FN = `async (url, kind, ms) => { const AL = globalThis.ReadnowAladin, P = globalThis.ReadnowProducts, SH = globalThis.ReadnowShipping, O = globalThis.ReadnowOrders;
  if (!AL || !P || !SH || !O) return { ok: false, why: '운영 공용 파일이 안 들어감', kind: 'error' };
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), ms); let r, buf;
  try { r = await fetch(url, { credentials: 'include', cache: 'no-store', signal: ac.signal }); buf = await r.arrayBuffer(); } catch (e) { return { ok: false, why: e.name === 'AbortError' ? '알라딘이 시간 안에 답하지 않음' : '연결 실패: ' + String(e.message || e).slice(0, 80), kind: e.name === 'AbortError' ? 'timeout' : 'error' }; } finally { clearTimeout(to); }
  if (r.status === 429 || r.status === 503) return { ok: false, st: r.status, why: '서버 응답 ' + r.status + ' (요청이 너무 많음 — 쉼)', kind: '429' };
  if (!r.ok) return { ok: false, st: r.status, why: '서버 응답 ' + r.status, kind: 'error' };
  const html = AL.decode(buf, r.headers.get('content-type')); const doc = new DOMParser().parseFromString(html, 'text/html'); let fin = '/'; try { fin = new URL(r.url).pathname; } catch (e) {}
  if (AL.isMaintenance(doc)) return { ok: false, why: '알라딘 점검 중', kind: 'maint' };
  if (AL.looksLoggedOut(r.url, doc, { scmNeedsLogout: true, url })) return { ok: false, login: true, why: '샵매니저가 로그인 화면으로 감(' + fin + ')', kind: 'login' };
  if (kind === 'chk') return { ok: true, st: r.status, sum: { loggedIn: true } };
  if (kind === 'list') { const x = P.parseScmList(doc, new Date().getFullYear()); return { ok: true, st: r.status, sum: { page: x.page, lastPage: x.lastPage, rows: x.rows.map((z) => ({ u: z.usedCode || null, l: z.listingId || null, s: z.status, p: z.price, k: z.sku, g: z.grade, q: z.qty })) } }; }
  if (kind === 'confirm' || kind === 'deliv') { const x = SH.parseDeliveryPage(doc); return { ok: true, st: r.status, sum: { tab: x.tabCounts || {}, orders: (x.orders || []).map((o) => ({ o: o.orderNo, it: (o.items || []).map((i) => i.listingId || null), d: o.deliveryNo || null })) } }; }
  if (kind === 'qna') { const x = O.parseQnaList(doc); return { ok: true, st: r.status, sum: { rows: x.map((z) => ({ q: z.questionId, a: z.answered == null ? null : String(z.answered) })) } }; }
  return { ok: false, why: '모르는 읽기', kind: 'error' }; }`;
  const CORE_FILES = ['readnow-aladin-core.js', 'readnow-products-core.js', 'readnow-shipping-core.js', 'readnow-orders-core.js'];
  const api = { STATUS, READ, READ_PATHS, listUrl, isReadUrl, PROD_ID, trimProd, cmpList, cmpShip, cmpQna, wantsOf, compare, READ_FN, CORE_FILES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Al = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
