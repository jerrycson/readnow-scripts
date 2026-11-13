/* t_y24w — (11/11 y24w · 정범님 '🛠 처리할 일에서 예스24도 맡기기') 🟦 예스24 쓰기 — 수량 바꾸기 · 판매중지 · 판매재개를 사람 손 없이
 *  가짜 예스24 판매관리(이 시험 안에서만 꾸민 작은 서버 · 로그인된 세션으로 봄) — 등록상품 관리 화면: 검색어(자체상품코드)·기간·판매상태 '전체'·[조회]
 *    · 표 #productGrid(RealGrid 흉내 — Vue 구성 요소 안 gridView: getDataSource·getItemIndex·setValue·checkItem…) · [수정항목 저장](확인 물음) · [판매상태/기간 변경] 창(라디오 02·08·04·07 · [변경] 확인 물음)
 *    · [상품삭제]·[바이백으로 전환](절대 안 누름)
 *  ① 순수 셈: 맡김 검사(처음엔 1건만 · 30줄까지 · 수량 1~999 · 같은 할 일 되풀이 0) · 이미 됨 셈 · 로거·MJ-MAIN 거절 · 확인 물음(그 일 단계에서만 '예' · 위험 낱말 '아니오')
 *  ② 실제 흐름(숨은 크롬): 수량 3→2 → [수정항목 저장] → 목록 다시 읽어 확인 → done · 첫 건 확인 전엔 둘째 맡김 거절 · 같은 할 일 다시 → 거절
 *     · 판매중지 → done · 이미 판매중지면 아무것도 안 누름 · 판매재개 · 🚚 출고 중엔 기다림 · 목록에 없으면 안 누름 · 저장해도 안 바뀌면 '확실하지 않음' → 멈춤 → 이어 가기 · 여러 줄
 * 시험 자료에 손님 정보 없음 · 실행: node tests/t_y24w.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const W = require('../helper/col2-y24w.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const killDir = (D) => { for (const p of fs.readdirSync('/proc').filter((p) => /^\d+$/.test(p))) { try { if (fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').includes(D)) process.kill(+p, 'SIGKILL'); } catch (e) {} } };
const NM = { '02': '판매중', '08': '판매중지', '04': '판매완료', '07': '판매종료' };

function fakeY24() { const S = { prods: [
    { GOODS_NO: '300000001', EAN: '9788900000101', ENTR_GOODS_CD: 'A01SKU1', ORD_REMAIN_CNT: 3, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000002', EAN: '9788900000102', ENTR_GOODS_CD: 'A01SKU2', ORD_REMAIN_CNT: 1, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000003', EAN: '9788900000103', ENTR_GOODS_CD: 'A01SKU3', ORD_REMAIN_CNT: 1, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000004', EAN: '9788900000104', ENTR_GOODS_CD: 'A01SKU4', ORD_REMAIN_CNT: 2, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000005', EAN: '9788900000105', ENTR_GOODS_CD: 'A01SKU5, B9', ORD_REMAIN_CNT: 4, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000006', EAN: '9788900000106', ENTR_GOODS_CD: '', ORD_REMAIN_CNT: 2, SALE_STATE_GB: '02' }, /* (11/11 led2b) 자체코드 없는 예스24 상품 — 같은 ISBN 다른 판매자 줄 없음 */
    { GOODS_NO: '300000007', EAN: '9788900000107', ENTR_GOODS_CD: '', ORD_REMAIN_CNT: 1, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000008', EAN: '9788900000106', ENTR_GOODS_CD: '', ORD_REMAIN_CNT: 1, SALE_STATE_GB: '02' },
    { GOODS_NO: '300000009', EAN: '9788900000109', ENTR_GOODS_CD: 'A01SKU9', ORD_REMAIN_CNT: 1, SALE_STATE_GB: '02', SHOP_SALE_PRICE: 10000 },
    { GOODS_NO: '300000010', EAN: '9788900000999', ENTR_GOODS_CD: '', ORD_REMAIN_CNT: 3, SALE_STATE_GB: '02', SHOP_SALE_PRICE: 7000 } /* (11/13 fix1113) 예스24 상품의 ISBN이 장부 ISBN(…110)과 다름 — ISBN 조회 0줄 → 제목으로 찾음 */ /* (판 내기 합침) 판매가 바꾸기(y24ops1) 시험 줄 — led2b가 006을 자체코드 없는 줄로 바꿔서 따로 */].map((p, i) => ({ SHOP_SALE_PRICE: 5000 + i * 1000, ...p })), log: [], ignoreSave: false, priceLock: false, roSelf: false };
  const page = (h, b) => `<!doctype html><html><head><meta charset="utf-8"><title>${h}</title><script>function api(p,o,cb){var x=new XMLHttpRequest();x.open('POST',p);x.setRequestHeader('Content-Type','application/json');x.onload=function(){cb&&cb(x.responseText)};x.send(JSON.stringify(o))}</script></head><body>${b}</body></html>`;
  const plist = () => page('등록상품', `<div id="app"><section>
<select id="kw"><option value="">선택하세요</option><option value="0">상품명</option><option value="3">ISBN</option><option value="5">자체상품코드</option></select> <input type="text" id="kwv">
<div role="group" class="btn-group"><button type="button" class="btn">오늘</button><button type="button" class="btn">1년</button></div>
<div class="custom-radio"><input type="radio" name="goodsStatGb" value="" id="s0"><label for="s0">전체</label></div><div class="custom-radio"><input type="radio" name="goodsStatGb" value="02" id="s1" checked><label for="s1">판매중</label></div>
<button type="button" class="btn btn-secondary" id="q"> 조회 </button></section>
<button type="button" class="btn btn-primary" id="bb">바이백으로 전환</button> <button type="button" class="btn btn-primary" id="chg">판매상태/기간 변경</button> <button type="button" class="btn btn-primary" id="save">수정항목 저장</button> <button type="button" class="btn btn-outline-primary" id="del">상품삭제</button>
<div id="wrap"><div id="productGrid" class="rg-root">조회된 데이터가 없습니다</div></div>
<div class="layerPop" id="pop" style="display:none"><h1> 판매상태/기간 변경 </h1><button type="button" class="close">×</button>
${['02', '08', '04', '07'].map((v, i) => `<div class="custom-radio"><input type="radio" name="goodsStatGb" value="${v}" id="p${i}"><label for="p${i}">${NM[v]}</label></div>`).join('')}
<input type="checkbox" name="changeDateYn" disabled value="Y"><button type="button" class="btn btn-primary" id="go"> 변경 </button><button type="button" class="btn" id="cc"> 취소 </button></div></div>
<script>window.PLOCK=${S.priceLock ? 'true' : 'false'};window.QLOCK=${S.qtyLock ? 'true' : 'false'};var ROWS=[],CHK=new Set(),DIRTY=new Set();
var ds={getRowCount:function(){return ROWS.length},getJsonRow:function(r){return Object.assign({},ROWS[r])},getValue:function(r,f){return ROWS[r][f]},setValue:function(r,f,v){ROWS[r][f]=v;DIRTY.add(r)}};
window.RO=${S.roSelf ? 'true' : 'false'};var gv={columnByField:function(f){return {fieldName:f,editable:!((f==='ENTR_GOODS_CD'&&window.RO)||(f==='SHOP_SALE_PRICE'&&window.PLOCK)||(f==='ORD_REMAIN_CNT'&&window.QLOCK))}},getDataSource:function(){return ds},getItemIndex:function(r){return r},getDataRow:function(i){return i},setCurrent:function(){},showEditor:function(){},commit:function(){},setValue:function(i,f,v){if(f==='ENTR_GOODS_CD'&&window.RO)return;ds.setValue(i,f,v)},checkAll:function(c){if(!c)CHK.clear()},checkItem:function(i,c){if(c)CHK.add(i);else CHK.delete(i)},getCheckedRows:function(){return [...CHK]}};
document.getElementById('wrap').__vue__={gridView:gv,$parent:null,title:'x'};
function draw(){document.getElementById('productGrid').innerText=ROWS.length?ROWS.map(function(r){return r.GOODS_NO+' '+r.SALE_STATE_GB+' '+r.ORD_REMAIN_CNT}).join(' | '):'조회된 데이터가 없습니다'}
document.getElementById('q').onclick=function(){var k=document.getElementById('kw').value,v=document.getElementById('kwv').value;var st=document.querySelector('input[name=goodsStatGb]:checked');api('/api/Product/ProductList',{SEARCH_GB:k,SEARCH_TXT:v,goodsStatGb:st?st.value:'02',PERIOD:window.YR?'1Y':'1D'},function(t){var j=JSON.parse(t);ROWS=j.PRODUCT_LIST;CHK.clear();DIRTY.clear();draw()})};
document.querySelectorAll('.btn-group button').forEach(function(b){b.onclick=function(){window.YR=b.innerText.trim()==='1년'}});
document.getElementById('save').onclick=function(){if(${S.silent ? 1 : 0})return;if(!DIRTY.size)return alert('수정된 항목이 없습니다');var go=function(){api('/api/Product/SaveProduct',{rows:[...DIRTY].map(function(r){return {GOODS_NO:ROWS[r].GOODS_NO,ORD_REMAIN_CNT:ROWS[r].ORD_REMAIN_CNT,SHOP_SALE_PRICE:ROWS[r].SHOP_SALE_PRICE,ENTR_GOODS_CD:ROWS[r].ENTR_GOODS_CD}})},function(){alert('저장되었습니다.');DIRTY.clear()})};if(${S.inpage ? 1 : 0}){var d=document.createElement('div');d.className='msgPop';d.style.cssText='position:fixed;top:30%;left:30%;background:#fff;padding:20px;z-index:999';d.innerHTML='<p>수정된 항목을 저장하시겠습니까?</p><button type="button" id="mpN">취소</button><button type="button" id="mpY">확인</button>';document.body.appendChild(d);document.getElementById('mpY').onclick=function(){d.remove();go()};document.getElementById('mpN').onclick=function(){d.remove()};return}if(!confirm('수정된 항목을 저장하시겠습니까?'))return;go()}; /* (11/13 home2) S.inpage = 화면 안 확인 상자(GtMessagePopup 흉내) */
document.getElementById('chg').onclick=function(){if(CHK.size<1)return alert('상품을 선택하세요');document.getElementById('pop').style.display='block'};
document.getElementById('go').onclick=function(){var r=document.querySelector('#pop input[type=radio]:checked');if(!r)return alert('판매상태를 선택하세요');if(!confirm('선택한 상품의 판매상태를 변경하시겠습니까?'))return;api('/api/Product/ChangeState',{nos:[...CHK].map(function(i){return ROWS[i].GOODS_NO}),st:r.value},function(){alert('변경되었습니다.');document.getElementById('pop').style.display='none'})};
document.querySelector('#pop .close').onclick=document.getElementById('cc').onclick=function(){document.getElementById('pop').style.display='none'};
document.getElementById('del').onclick=function(){if(confirm('상품을 삭제하시겠습니까?'))api('/api/Product/DeleteAll',{})};document.getElementById('bb').onclick=function(){if(confirm('바이백으로 전환하시겠습니까?'))api('/api/Product/Buyback',{})};</script>`);
  const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let b = ''; q.on('data', (c) => (b += c)); q.on('end', () => { S.log.push({ m: q.method, p: u.pathname, body: b.slice(0, 300) });
      const H = (code, type, body) => { s.writeHead(code, { 'Content-Type': type + '; charset=utf-8' }); s.end(body); };
      if (u.pathname === '/api/Product/ProductList') { let o = {}; try { o = JSON.parse(b || '{}'); } catch (e) {} let L0 = S.prods; if (o.SEARCH_GB === '5' && o.SEARCH_TXT) L0 = L0.filter((p) => p.ENTR_GOODS_CD.split(/[,\s]+/).includes(o.SEARCH_TXT)); if (o.SEARCH_GB === '3' && o.SEARCH_TXT) L0 = L0.filter((p) => p.EAN === o.SEARCH_TXT); if (o.goodsStatGb) L0 = L0.filter((p) => p.SALE_STATE_GB === o.goodsStatGb);
        return H(200, 'application/json', JSON.stringify({ PRODUCT_LIST: L0.map((p) => ({ ...p, SALE_STATE_GB_NM: NM[p.SALE_STATE_GB] })), TOTAL_COUNT: L0.length, RESULT_CODE: 'S000' })); }
      if (u.pathname === '/api/Product/SaveProduct') { const o = JSON.parse(b || '{}'); if (!S.ignoreSave) for (const r of o.rows || []) { const p = S.prods.find((x) => x.GOODS_NO === r.GOODS_NO); if (p) { p.ORD_REMAIN_CNT = +r.ORD_REMAIN_CNT; if (r.SHOP_SALE_PRICE != null) p.SHOP_SALE_PRICE = +r.SHOP_SALE_PRICE; if (r.ENTR_GOODS_CD != null) p.ENTR_GOODS_CD = String(r.ENTR_GOODS_CD); } } return H(200, 'application/json', '{"RESULT_CODE":"S000"}'); }
      if (u.pathname === '/api/Product/ChangeState') { const o = JSON.parse(b || '{}'); for (const n of o.nos || []) { const p = S.prods.find((x) => x.GOODS_NO === n); if (p) p.SALE_STATE_GB = o.st; } return H(200, 'application/json', '{"RESULT_CODE":"S000"}'); }
      if (u.pathname === '/api/Product/DeleteAll' || u.pathname === '/api/Product/Buyback') return H(200, 'application/json', '{}');
      if (u.pathname.startsWith('/api/')) return H(200, 'application/json', JSON.stringify({ RESULT_LIST: [], TOTAL_COUNT: 0 }));
      if (u.pathname === '/') return H(200, 'text/html', page('판매관리', '첫 화면'));
      if (u.pathname === '/Product/ProductList') return H(200, 'text/html', plist());
      return H(200, 'text/html', page('기타', '없음')); }); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, S, base: `http://127.0.0.1:${srv.address().port}` }))); }
let K = 0; const row = (no, self, kind, to, o) => ({ rid: 'led|' + no, rk: 'rk-' + no + '-' + kind + '-' + (to == null ? '' : to) + '-' + (o && o.tag ? o.tag : 'a'), no, self, kind, to, title: '시험 책 ' + no });
const job = (rows) => ({ id: 'y24w-t' + ++K, rows, by: '시험 웹앱' });

(async () => {
  console.log('① 순수 셈');
  { /* (0.1.38 y24chk · 11/12 진단) 실제 예스24 응답 칸 이름(REM_CNT 재고수량 · GOODS_STAT_GB 판매상태 · SALE_PR 판매가 · MAN_NO = 서가 관리 코드 — 11/12 /api/Product/ProductList 원문) 그대로 찾는지 · 칸 이름을 못 찾으면 편집기를 건드리지 않음 */
    const vm = require('vm'); const J = W._js;
    const real = [{ GOODS_NO: 300000101, EAN: '9788900000201', SHOP_PR: 10000, SALE_PR: 8000, GOODS_STAT_GB: '02', GOODS_STAT_GB_NM: '판매중', REM_CNT: 3, MAN_NO: 'PNKLUX', USED_SALE_PR: 0 }];
    const mkCtx = (rows) => { const R = rows.map((x) => ({ ...x })); let cur = null, shown = 0; const ds = { getRowCount: () => R.length, getJsonRow: (r) => ({ ...R[r] }), getValue: (r, f) => R[r][f] };
      const gv = { getDataSource: () => ds, getItemIndex: (r) => r, setCurrent: (c) => { cur = c; }, showEditor: () => { shown++; }, commit: () => {}, setValue: (i, f, v) => { R[i][f] = v; }, columnByField: (f) => ({ fieldName: f, editable: true }) };
      const doc = { getElementById: (id) => (id === 'productGrid' ? {} : null), querySelectorAll: () => [] }; const ctx = vm.createContext({ document: doc, getComputedStyle: () => ({}), HTMLInputElement: function () {}, HTMLTextAreaElement: function () {}, Event: function () {} }); ctx.window = ctx; ctx.window.__rnY24GV = gv; return { ctx, R, st: () => ({ cur, shown }) }; };
    const A = mkCtx(real); const f = vm.runInContext(J.JS_FIND('300000101', ''), A.ctx); const h = f && f.hit && f.hit[0];
    ok(f && f.ok && f.hit.length === 1 && h.kQ === 'REM_CNT' && h.qty === 3 && h.kS === undefined && h.self === '' && h.st === '02' && h.stNm === '판매중' && h.kP === 'SALE_PR' && h.price === 8000, '실제 응답 칸 이름(REM_CNT·GOODS_STAT_GB·SALE_PR)으로 우리 줄을 찾음 · MAN_NO(서가 관리 코드 PNKLUX 등)는 자체코드로 보지 않음', JSON.stringify(f));
    const q = vm.runInContext(J.JS_QTY(h.r, h.kQ, 1), A.ctx); ok(q && q.ok && A.R[0].REM_CNT === 1, '실제 칸 이름이면 재고수량 칸이 1로 바뀜(아직 저장 전)', JSON.stringify(q));
    const B = mkCtx([{ GOODS_NO: 300000102, GOODS_STAT_GB: '02', ENTR_GOODS_CD: 'A01SKUS' }]); const q2 = vm.runInContext(J.JS_QTY(0, undefined, 1), B.ctx);
    ok(q2 && !q2.ok && /칸 이름을 못 찾음/.test(q2.why) && B.st().shown === 0 && B.st().cur === null && Object.keys(B.R[0]).length === 3, "재고 칸 이름을 못 찾으면 편집기·표를 아예 건드리지 않음(예전: fieldName undefined로 편집기를 열고 'NaN')", JSON.stringify(q2));
    const s2 = vm.runInContext(J.JS_SELF(0, undefined, 'X1'), B.ctx); ok(s2 && !s2.ok && s2.ro && B.st().shown === 0, '판매자상품코드 칸 이름을 못 찾으면 채우지 않음(건너뜀)'); }
  { const c = W.checkJob; const R0 = { ok1: null, rk: {} }; const a = row('300000001', 'A01SKU1', 'qty', 2), b = row('300000002', 'A01SKU2', 'stop');
    ok(c(job([a]), R0) === '' && /1건짜리/.test(c(job([a, b]), R0)) && c(job([a, b]), { ...R0, ok1: 1 }) === '', '처음엔 1건짜리만 · 첫 성공 뒤 여러 건');
    ok(/수량은 1~999/.test(c(job([row('300000001', 'A01SKU1', 'qty', 0)]), R0)) && /종류/.test(c(job([row('300000001', 'A01SKU1', 'del')]), R0)) && /상품번호/.test(c(job([row('x1', 'A01SKU1', 'stop')]), R0)) && /자체코드/.test(c(job([row('300000001', '', 'stop')]), R0)) && /30줄/.test(c(job(Array.from({ length: 31 }, (_, i) => row(String(300000100 + i), 'S' + i, 'stop'))), { ok1: 1 })), '수량 1~999 · 종류(수량·판매중지·판매재개만) · 상품번호·자체코드 검사 · 30줄까지');
    ok(/되풀이/.test(c(job([a]), { ...R0, rk: { [a.rk]: {} } })) && /두 번/.test(c(job([a, row('300000001', 'A01SKU1', 'stop')]), { ok1: 1 })), '되풀이 0 — 같은 할 일(rk)·같은 상품번호 한 맡김에 두 번');
    ok(c(job([{ ...row('300000006', '', 'qty', 1), fill: 'PNK0000006', isbn: '9788900000106' }]), R0) === '' && c(job([{ ...row('300000006', '', 'stop'), q: '시험 책' }]), R0) === '' && /채울 자체코드/.test(c(job([{ ...row('300000006', '', 'stop'), fill: 'a b', isbn: '9788900000106' }]), R0)) && /ISBN·제목/.test(c(job([{ ...row('300000006', '', 'stop'), fill: 'PNK0000006' }]), R0)),
      '(led2b) 자체코드 없는 줄 = ISBN(또는 제목)이 있으면 받음 · 채울 자체코드 검사 · 찾을 길이 없으면 거절');
    ok(W.isDone({ kind: 'qty', to: 2 }, { qty: 2 }) && !W.isDone({ kind: 'qty', to: 2 }, { qty: 3 }) && W.isDone({ kind: 'stop' }, { st: '08' }) && !W.isDone({ kind: 'stop' }, { st: '02' }) && W.isDone({ kind: 'start' }, { st: '02' }), '이미 됨 셈(수량 같음·판매중지·판매중)');
    const D0 = fs.mkdtempSync(path.join(os.tmpdir(), 'y24w_')); const mk = (pc) => W.makeY24W({ HOME: D0, note: () => {}, pcName: () => pc, isLogger: () => /^LOGGER/.test(pc), enabled: () => true, holdOn: () => false, login: () => 'ok', kick: () => {} });
    const A = mk('MJ-MAIN').put(job([a])), B = mk('LOGGER').put(job([a])), C0 = mk('HOME');
    ok(A.code === 409 && /MJ-MAIN/.test(A.body.err) && B.code === 409 && /로거/.test(B.body.err), 'MJ-MAIN·로거 PC는 맡김을 받지 않음(출고 보호 · 약속 0)', A.body.err + ' / ' + B.body.err);
    const d1 = C0.dialog({ type: 'confirm', message: '수정된 항목을 저장하시겠습니까?' }); C0.R.phase = 'qty'; const d2 = C0.dialog({ type: 'confirm', message: '수정된 항목을 저장하시겠습니까?' }), d3 = C0.dialog({ type: 'confirm', message: '상품을 삭제하시겠습니까?' }); C0.R.phase = 'state'; const d4 = C0.dialog({ type: 'confirm', message: '선택한 상품의 판매상태를 변경하시겠습니까?' }), d5 = C0.dialog({ type: 'confirm', message: '바이백으로 전환하시겠습니까?' }), d6 = C0.dialog({ type: 'confirm', message: '판매종료로 변경하시겠습니까?' });
    ok(!d1 && d2 && !d3 && d4 && !d5 && !d6, "확인 물음: 저장·변경 단계에서만 '예' · 삭제·바이백·판매종료는 '아니오'");
    { let lg = 'need'; const D1 = fs.mkdtempSync(path.join(os.tmpdir(), 'y24w_')); const M = W.makeY24W({ HOME: D1, note: () => {}, pcName: () => 'HOME', isLogger: () => false, enabled: () => true, holdOn: () => false, login: () => lg, kick: () => {} });
      const jl = job([{ ...row('300000006', '', 'stop'), fill: 'PNK0000006', isbn: '9788900000106' }]); const pr = M.put(jl); const s1 = M.state(); const p1 = M.pick(); lg = 'ok'; const p2 = M.pick();
      ok(pr.code === 200 && pr.body.ok && !p1 && /로그인 기다림/.test(s1.why || '') && s1.wait.length === 1 && p2 && p2.id === jl.id, "(led2b) 예스24 로그인이 풀려 있어도 맡김은 받아 쌓아 둠('로그인 기다림' · 실패로 버리지 않음) → 로그인되면 그 맡김부터 돎", s1.why); fs.rmSync(D1, { recursive: true, force: true }); }
    fs.rmSync(D0, { recursive: true, force: true }); }

  const Y = await fakeY24(); const repo = process.env.COL2_PROD_REPO || path.join(__dirname, '..', '..', '..');
  const env = { RN_COL2_Y24: Y.base, RN_COL2_Y24_SCALE: '0.05', RN_COL2_CORE_DIR: repo };
  const H = await L.startHelper({ cfg: { on: true, y24: true, pc: 'HOME', hands: false, auto: false, headless: true, watch: { tickSec: 60, handoffMs: 200 } }, env }); const D = H.D;
  const feed = (b) => H.api('POST', '/y24/feed', { by: '시험 수집기', cfg: { ordMin: 0 }, hold: { on: false }, ...(b || {}) });
  const ws = async () => (await H.api('GET', '/y24/w/state')).j;
  const resOf = async (id, n, hold) => until(async () => { await feed(hold ? { hold: { on: true, why: '시험 출고' } } : null); const s = await ws(); return s.res && s.res[id] ? s.res[id] : null; }, n || 240);
  const P = (no) => Y.S.prods.find((p) => p.GOODS_NO === no); const nCall = (p) => Y.S.log.filter((l) => l.p === p).length;
  try {
    console.log('② 실제 흐름(숨은 크롬) — 수량');
    await feed(); const lg = await until(async () => { await feed(); const s = (await H.api('GET', '/status')).j.y24; return s.login === 'ok' && s.alive ? s : null; }, 120); ok(lg, '숨은 예스24 크롬이 판매관리 세션을 봄(로그인 됨)');
    let r = await H.api('POST', '/y24/w/put', job([row('300000001', 'A01SKU1', 'qty', 2), row('300000002', 'A01SKU2', 'stop')])); ok(r.st === 400 && /1건짜리/.test(r.j.err), '처음엔 2건 맡김을 거절', r.j && r.j.err);
    const j1 = job([row('300000001', 'A01SKU1', 'qty', 2)]); r = await H.api('POST', '/y24/w/put', j1); ok(r.j.ok && r.j.took === j1.id, '1건 맡김 받음(수량 3 → 2)');
    r = await H.api('POST', '/y24/w/put', job([row('300000002', 'A01SKU2', 'stop')])); ok(r.st === 409 && /처음 한 건/.test(r.j.err), '첫 건 확인 전엔 다른 맡김을 받지 않음(1건 확인 뒤 이어 감)', r.j && r.j.err);
    r = await H.api('POST', '/y24/w/put', j1); ok(r.j.ok && r.j.already, '같은 맡김 이름표를 또 보내면 이미 받음(되풀이 0)');
    let x = await resOf(j1.id); const rr = x && x.rows && x.rows['led|300000001'];
    ok(x && x.state === 'done' && P('300000001').ORD_REMAIN_CNT === 2 && nCall('/api/Product/SaveProduct') === 1 && rr && rr.before.qty === 3 && rr.after.qty === 2, '검색 → 재고수량 칸 고침 → [수정항목 저장] → 목록 다시 읽어 확인 → done', x && x.msg);
    ok(Y.S.log.some((l) => l.p === '/api/Product/ProductList' && /"SEARCH_GB":"5"/.test(l.body) && /A01SKU1/.test(l.body) && /"goodsStatGb":""/.test(l.body) && /1Y/.test(l.body)), "검색은 자체상품코드 = 우리 SKU · 판매상태 '전체' · 기간 1년");
    let s = await ws(); ok(s.ok1 && !s.stop, '첫 성공 기록(이 PC) → 여러 건이 열림');
    await H.api('POST', '/y24/w/ack', { ids: [j1.id] }); ok(!(await ws()).res[j1.id], '웹앱이 받은 결과는 지움(ack)');
    r = await H.api('POST', '/y24/w/put', job([row('300000001', 'A01SKU1', 'qty', 2)])); ok(r.st === 400 && /되풀이/.test(r.j.err), '같은 할 일(rk)을 다시 맡기면 거절(되풀이 0)', r.j.err);
    console.log('③ 판매중지 · 이미 됨 · 판매재개');
    const j2 = job([row('300000002', 'A01SKU2', 'stop')]); await H.api('POST', '/y24/w/put', j2); x = await resOf(j2.id);
    ok(x && x.state === 'done' && P('300000002').SALE_STATE_GB === '08' && nCall('/api/Product/ChangeState') === 1, '그 줄만 고름 → [판매상태/기간 변경] → 판매중지 → [변경] → 목록에서 판매중지 확인 → done', x && x.msg);
    const j3 = job([row('300000002', 'A01SKU2', 'stop', null, { tag: 'b' })]); await H.api('POST', '/y24/w/put', j3); x = await resOf(j3.id);
    ok(x && x.state === 'done' && x.rows['led|300000002'].state === 'already' && nCall('/api/Product/ChangeState') === 1, '이미 판매중지면 아무것도 안 누르고 끝(already)', x && x.msg);
    const j4 = job([row('300000002', 'A01SKU2', 'start')]); await H.api('POST', '/y24/w/put', j4); x = await resOf(j4.id);
    ok(x && x.state === 'done' && P('300000002').SALE_STATE_GB === '02', '판매재개(판매중지 → 판매중)', x && x.msg);
    console.log('④ 출고 중 · 목록에 없음');
    const c0 = nCall('/api/Product/ChangeState'); const j5 = job([row('300000003', 'A01SKU3', 'stop')]); await feed({ hold: { on: true, why: '시험 출고' } }); await H.api('POST', '/y24/w/put', j5);
    for (let k = 0; k < 12; k++) { await feed({ hold: { on: true, why: '시험 출고' } }); await wait(250); } s = await ws(); ok(nCall('/api/Product/ChangeState') === c0 && s.wait.length === 1 && /출고/.test(s.why || ''), '🚚 출고 중엔 아무것도 안 누르고 기다림', s.why);
    x = await resOf(j5.id); ok(x && x.state === 'done' && P('300000003').SALE_STATE_GB === '08', '출고가 끝나면 이어감 → done', x && x.msg);
    const j6 = job([row('300000099', 'A01SKU9', 'stop')]); await H.api('POST', '/y24/w/put', j6); x = await resOf(j6.id);
    ok(x && x.state === 'fail' && x.rows['led|300000099'].pre && /못 찾음/.test(x.msg) && x.todo, '목록에 그 줄이 없으면 아무것도 안 누르고 까닭·할 일', x && x.msg);
    console.log("⑤ 저장해도 안 바뀌면 '확실하지 않음' → 멈춤 → 이어 가기");
    Y.S.ignoreSave = true; const sv0 = nCall('/api/Product/SaveProduct'); const j7 = job([row('300000004', 'A01SKU4', 'qty', 1)]); await H.api('POST', '/y24/w/put', j7); x = await resOf(j7.id);
    ok(x && x.state === 'unsure' && x.stop && x.todo && nCall('/api/Product/SaveProduct') === sv0 + 1, "눌렀지만 목록 값이 그대로 → '확실하지 않음'(다시 누르지 않음)", x && x.msg);
    r = await H.api('POST', '/y24/w/put', job([row('300000005', 'B9', 'qty', 3)])); ok(r.st === 409 && r.j.stop, '멈춘 동안엔 새 맡김을 받지 않음', r.j && r.j.err);
    Y.S.ignoreSave = false; r = await H.api('POST', '/y24/w/resume', { by: '시험' }); ok(r.j.ok && r.j.was && !(await ws()).stop, '[▶ 이어 가기] → 멈춤 풂');
    console.log('⑥ 여러 줄(첫 성공 뒤)');
    const j8 = job([row('300000005', 'B9', 'qty', 3), row('300000003', 'A01SKU3', 'start')]); await H.api('POST', '/y24/w/put', j8); x = await resOf(j8.id, 300);
    ok(x && x.state === 'done' && P('300000005').ORD_REMAIN_CNT === 3 && P('300000003').SALE_STATE_GB === '02', '2줄 맡김 → 둘 다 done(자체코드가 여럿인 줄도)', x && x.msg);
    console.log('⑧ (led2b) 자체코드 없는 예스24 상품 — ISBN으로 찾고 번호로 맞춤 · 자체코드 채우기');
    const sv1 = nCall('/api/Product/SaveProduct'); const j9 = job([{ ...row('300000006', '', 'qty', 1), fill: 'PNK0000006', isbn: '9788900000106' }]); r = await H.api('POST', '/y24/w/put', j9); ok(r.j.ok, '자체코드 없는 줄 맡김 받음(ISBN·채울 SKU)', r.j);
    x = await resOf(j9.id); const r9 = x && x.rows && x.rows['led|300000006'];
    ok(x && x.state === 'done' && P('300000006').ORD_REMAIN_CNT === 1 && P('300000008').ORD_REMAIN_CNT === 1 && r9 && r9.before.qty === 2 && r9.after.qty === 1, '같은 ISBN 줄이 둘이어도 상품번호로 꼭 맞춘 줄만 수량 2 → 1(다른 줄 그대로)', x && x.msg);
    ok(P('300000006').ENTR_GOODS_CD === 'PNK0000006' && r9 && r9.fill && r9.fill.state === 'done' && /자체코드 PNK0000006 채움/.test(x.msg) && nCall('/api/Product/SaveProduct') === sv1 + 2 && P('300000008').ENTR_GOODS_CD === '', "자체코드 칸('판매자상품코드')에 우리 SKU를 채우고 저장 → 자체코드로 다시 조회해 확인(다음부터 바로 짝)", x && x.msg);
    ok(Y.S.log.some((l) => l.p === '/api/Product/ProductList' && /"SEARCH_GB":"3"/.test(l.body) && /9788900000106/.test(l.body)), "자체코드가 없으면 검색어 'ISBN'으로 조회");
    const sv2 = nCall('/api/Product/SaveProduct'), cs2 = nCall('/api/Product/ChangeState'); const j10 = job([{ ...row('300000002', '', 'stop', null, { tag: 'c' }), fill: 'PNK0000099', isbn: '9788900000102' }]); await H.api('POST', '/y24/w/put', j10); x = await resOf(j10.id);
    ok(x && x.state === 'fail' && /이미 A01SKU2/.test(x.msg) && nCall('/api/Product/SaveProduct') === sv2 && nCall('/api/Product/ChangeState') === cs2 && P('300000002').ENTR_GOODS_CD === 'A01SKU2', '그 예스24 상품 자체코드가 이미 다른 값이면 짝이 다를 수 있어 아무것도 안 누름', x && x.msg);
    Y.S.roSelf = true; const j11 = job([{ ...row('300000007', '', 'stop'), fill: 'PNK0000007', isbn: '9788900000107' }]); await H.api('POST', '/y24/w/put', j11); x = await resOf(j11.id); const r11 = x && x.rows && x.rows['led|300000007'];
    ok(x && x.state === 'done' && P('300000007').SALE_STATE_GB === '08' && P('300000007').ENTR_GOODS_CD === '' && r11 && r11.fill && r11.fill.state === 'skip' && /잠겨/.test(x.msg) && !(await ws()).stop, '자체코드 칸을 표에서 고칠 수 없으면 판매중지는 그대로 done · 채우기는 건너뛰고 까닭만(멈추지 않음)', x && x.msg); Y.S.roSelf = false;
    { const j12 = job([{ ...row('300000010', '', 'qty', 1), fill: 'PNK0000010', isbn: '9788900000110' }]); await H.api('POST', '/y24/w/put', j12); x = await resOf(j12.id); const r12 = x && x.rows && x.rows['led|300000010'];
      ok(x && x.state === 'done' && P('300000010').ORD_REMAIN_CNT === 1 && r12 && r12.before.qty === 3 && Y.S.log.some((l) => l.p === '/api/Product/ProductList' && /"SEARCH_GB":"0"/.test(l.body) && /시험 책 300000010/.test(l.body)), '(11/13 fix1113) ISBN 조회가 두 번 0줄이면 제목(상품명)으로 한 번 더 → 상품번호가 꼭 맞는 줄만 고침(수량 3 → 1)', x && x.msg); }
    console.log('⑦ (11/11 y24ops1) 판매가 바꾸기');
    { const c = W.checkJob; ok(/10원 단위/.test(c(job([row('300000009', 'A01SKU9', 'price', 5005)]), { ok1: 1, rk: {} })) && /100원/.test(c(job([row('300000009', 'A01SKU9', 'price', 50)]), { ok1: 1, rk: {} })) && c(job([row('300000009', 'A01SKU9', 'price', 9000)]), { ok1: 1, rk: {} }) === '', '판매가 검사: 100원~100만 원 · 10원 단위');
      ok(W.isDone({ kind: 'price', to: 9000 }, { price: 9000 }) && !W.isDone({ kind: 'price', to: 9000 }, { price: 8000 }) && !W.isDone({ kind: 'price', to: 9000 }, { price: null }), '판매가 이미 됨 셈'); }
    const psv1 = nCall('/api/Product/SaveProduct'); const pj9 = job([row('300000009', 'A01SKU9', 'price', 11000)]); await H.api('POST', '/y24/w/put', pj9); x = await resOf(pj9.id);
    ok(x && x.state === 'done' && P('300000009').SHOP_SALE_PRICE === 11000 && nCall('/api/Product/SaveProduct') === psv1 + 1 && x.rows['led|300000009'].before.price === 10000 && x.rows['led|300000009'].after.price === 11000, '판매가 10,000 → 11,000 → [수정항목 저장] → 목록 다시 읽어 확인 → done', x && x.msg);
    const pj10 = job([row('300000009', 'A01SKU9', 'price', 30000)]); await H.api('POST', '/y24/w/put', pj10); x = await resOf(pj10.id);
    ok(x && x.state === 'fail' && x.rows['led|300000009'].pre && /50%/.test(x.msg) && P('300000009').SHOP_SALE_PRICE === 11000 && nCall('/api/Product/SaveProduct') === psv1 + 1, '한 번에 50% 넘게 바뀌는 값은 아무것도 안 누름', x && x.msg);
    { Y.S.qtyLock = true; const q0 = (Y.S.prods.find((p) => p.GOODS_NO === '300000001') || {}).ORD_REMAIN_CNT; const qj = job([row('300000001', 'A01SKU1', 'qty', q0 === 1 ? 2 : 1, { tag: 'qlock' })]); await H.api('POST', '/y24/w/put', qj); const qx = await resOf(qj.id); Y.S.qtyLock = false; const qy = (qx && qx.rows && Object.values(qx.rows)[0]) || qx || {}; ok(qy.state === 'fail' && qy.pre && /재고수량 칸을 고칠 수 없게/.test(qy.msg || '') && (Y.S.prods.find((p) => p.GOODS_NO === '300000001') || {}).ORD_REMAIN_CNT === q0 && !(qx && qx.stop), '(y24re 0.1.53) 표가 재고수량 칸을 못 고치게 하면 값을 억지로 넣지 않고 [수정항목 저장]도 안 누름 · 멈추지 않음 — ' + (qy.msg || JSON.stringify(qx)).slice(0, 120)); }
    Y.S.priceLock = true; const pj11 = job([row('300000009', 'A01SKU9', 'price', 12000)]); await H.api('POST', '/y24/w/put', pj11); x = await resOf(pj11.id); Y.S.priceLock = false;
    ok(x && x.state === 'fail' && x.rows['led|300000009'].pre && /고칠 수 없/.test(x.msg) && x.todo && P('300000009').SHOP_SALE_PRICE === 11000 && nCall('/api/Product/SaveProduct') === psv1 + 1, '표의 판매가 칸이 고칠 수 없는 칸이면 아무것도 안 누르고 까닭·할 일', x && x.msg);
    const pj12 = job([row('300000003', 'A01SKU3', 'stop', null, { tag: 'p' })]); await H.api('POST', '/y24/w/put', pj12); await resOf(pj12.id); const pj13 = job([row('300000003', 'A01SKU3', 'price', 7500)]); await H.api('POST', '/y24/w/put', pj13); x = await resOf(pj13.id);
    ok(x && x.state === 'fail' && /판매중이 아닌/.test(x.msg) && P('300000003').SHOP_SALE_PRICE === 7000, '판매중지 상품의 판매가는 안 바꿈', x && x.msg);
    { /* (11/13 home2) 저장 확인이 화면 안 상자로 뜨는 화면 — 상자 글을 남기고 [확인]을 눌러 실제로 저장 */ Y.S.inpage = true; const sv0 = nCall('/api/Product/SaveProduct'); const jI = job([row('300000005', 'A01SKU5', 'qty', 2, { tag: 'inpage' })]); const rI = await H.api('POST', '/y24/w/put', jI); const xI = await resOf(jI.id);
      ok(xI && xI.state === 'done' && P('300000005').ORD_REMAIN_CNT === 2 && nCall('/api/Product/SaveProduct') === sv0 + 1 && (xI.dlg || []).some((m) => /화면 상자: 수정된 항목을 저장하시겠습니까/.test(m) && /\[확인\] 누름/.test(m)), '저장 확인이 화면 안 상자(브라우저 물음 아님)여도 [확인]을 눌러 실제 저장 → 목록에서 확인 · 상자 글은 기록에', JSON.stringify(xI && { st: xI.state, msg: xI.msg, dlg: xI.dlg, rows: xI.rows })); Y.S.inpage = false; }
    { /* (11/13 home2) [수정항목 저장]을 눌러도 예스24가 아무 물음·알림도 안 띄우고 값도 그대로 = 저장 안 됨 → 멈추지 않음(다음 맡김을 받음) */ Y.S.silent = true; const jS = job([row('300000005', 'A01SKU5', 'qty', 1, { tag: 'silent' })]); await H.api('POST', '/y24/w/put', jS); const xS = await resOf(jS.id);
      ok(xS && xS.state === 'fail' && /저장되지 않음/.test(xS.msg) && !(await ws()).stop && P('300000005').ORD_REMAIN_CNT === 2, '눌러도 예스24가 아무 반응 없고 값이 그대로 = 저장 안 됨(실패) · 쓰기를 멈추지 않음', xS && xS.msg); Y.S.silent = false; }
    ok(!Y.S.log.some((l) => /DeleteAll|Buyback/.test(l.p)) && Y.S.prods.length === 10, '상품삭제·바이백으로 전환 같은 다른 단추는 끝까지 안 누름');
    const st = (await H.api('GET', '/status')).j.y24; ok(st.w && st.w.ok1 && st.w.stop == null, '상태(/status y24.w)에 쓰기 줄 요약');
  } finally { try { await H.stop(); } catch (e) {} killDir(D); }
  Y.srv.close(); L.done('t_y24w');
})();
