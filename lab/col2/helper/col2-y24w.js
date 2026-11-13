/* col2-y24w.js — 🟦 예스24 쓰기(수량 바꾸기 · 판매중지 · 판매재개)를 사람 손 없이 — 정범님 11/11 '🛠 처리할 일에서 예스24도 맡기기'
 * 쓰는 곳: 웹앱 🧾 통합 장부 › 🛠 처리할 일 › 예스24 줄 「🟦 예스24 … 맡기기」(두 번 누르기) → POST /y24/w/put(127.0.0.1:8797 · 이 PC 안에서만)
 *   → 이 도우미가 예스24 숨은 크롬(로그인 세션 그대로 · col2-y24.js와 같은 탭)에서 상품관리 › 등록상품 관리 화면을 열고 사람이 하는 그대로:
 *      ① 검색어 '자체상품코드' = 우리 SKU · 기간 가장 길게 · 판매상태 '전체' → [조회](읽기)
 *         (11/11 led2b) 예스24 자체코드가 비었는데 장부가 그 예스24 상품을 하나로 정한 줄(fill) — 검색어 'ISBN'(없으면 '상품명')으로 조회 → 상품번호가 꼭 맞는 줄 하나
 *           · 그 줄 자체코드가 이미 다른 값이면 짝이 다를 수 있어 아무것도 안 누름 · 일이 끝난 뒤 그 줄 '판매자상품코드 *' 칸에 우리 SKU를 채우고 [수정항목 저장] → 자체코드로 다시 조회해 확인
 *           · 그 칸을 표에서 고칠 수 없으면(잠김·칸 없음) 건너뛰고 까닭만 남김(수량·판매중지 결과는 그대로)
 *      ② 표(RealGrid #productGrid)에서 상품번호(GOODS_NO)·자체코드가 둘 다 맞는 줄이 꼭 하나인지 봄(없거나 둘 이상이면 아무것도 안 누름)
 *      ③ 이미 그 값이면(수량이 같음·이미 판매중지) 아무것도 안 누르고 끝(되풀이 0)
 *      ④ 수량: 그 줄 '재고수량 *' 칸을 고침 → [수정항목 저장] 한 번(그 확인 물음에만 '예')
 *         판매중지·재개: 그 줄 하나만 고름 → [판매상태/기간 변경] → 창에서 판매중지(08)·판매중(02) 라디오 → [변경] 한 번(그 확인 물음에만 '예')
 *      ⑤ 화면을 새로 열어 등록상품 목록을 다시 읽어(예스24 서버 값) 바뀌었는지 확인 → done · 그대로·못 읽음이면 '확실하지 않음'으로 멈춤(다시 누르지 않음)
 *   → 결과(줄마다 전·후 값·까닭·할 일)를 웹앱이 받아(GET /y24/w/state) 🛠 처리할 일 줄에 보임 · 이 도우미는 Firestore에 아무것도 쓰지 않음(쓰기 막이 col2_* 그대로)
 * 근거(화면 원문): readnow-chats reports/yes24_raw DOC_product_productlist(11/08) — 검색어 고르기(option 5 = 자체상품코드) · 판매상태 라디오 goodsStatGb('' 전체) · [조회]
 *   · 안내 '수정할 값을 더블 클릭 … 수정이 완료 되시면 반드시 수정항목 저장을 클릭' · 표 머리 '재고수량 *'·'판매상태 *'(수정 가능 칸) · 단추 [판매상태/기간 변경]·[수정항목 저장]
 *   · 창 '판매상태/기간 변경' — 라디오 goodsStatGb 02 판매중 · 08 판매중지 · 04 판매완료 · 07 판매종료 · [변경]·[취소] · '재고수량0인 상품을 판매중으로 변경하면 재고수량은 1로 자동변환'
 *   · 응답 칸 GOODS_NO·ENTR_GOODS_CD(판매자상품코드 = 우리 SKU)·ORD_REMAIN_CNT(재고수량)·SALE_STATE_GB(판매상태) — GUIDE.md 1-1
 *   (0.1.38 y24chk · 11/12 진단) 실제 응답(/api/Product/ProductList 11/12 원문) 칸 이름은 REM_CNT(재고수량)·GOODS_STAT_GB(판매상태)·SALE_PR(판매가) · MAN_NO는 서가 관리 코드(PNKLUX 등 — 상품마다 다른 SKU 아님)라 자체코드로 보지 않음
 *     — 예전 이름만 찾던 정규식이 재고 칸을 못 찾아 11/12 17:46~18:27 수량 맡김 5번이 모두 '재고수량 칸이 바뀌지 않음(NaN)'으로 저장 없이 끝남 → 두 이름 다 찾음 · 칸 이름을 못 찾으면 편집기를 아예 건드리지 않음
 *   (11/11 y24ops1) 판매가: 그 줄 판매가 칸(표에서 고칠 수 있는 칸일 때만 · 아니면 아무것도 안 누르고 사람에게) → [수정항목 저장] → 다시 읽어 확인 · 판매중인 상품만 · 한 번에 50% 넘게 바뀌면 안 누름
 * 지킴: 같은 맡김·같은 할 일(rk) 두 번 안 함(이 PC 기록 y24-w.json) · 같은 상품번호가 맡김 줄에 이미 있으면 거절 · 처음 성공(목록에서 확인)이 없으면 1건짜리 맡김만 · 한 번에 30줄까지
 *       로거 PC·MJ-MAIN에서는 안 함 · 🚚 출고 중엔 기다림(누르기 전) · 로그인이 풀리면 기다림(누르기 전) · '확실하지 않음'·누른 뒤 실패면 이 쓰기 줄 전체를 멈춤(웹앱 [▶ 이어 가기]로만 다시)
 *       누르는 단추는 [조회]·기간 '1년'·판매상태 '전체'(읽기) · 그 줄 고르기·재고수량 칸 · [수정항목 저장] · [판매상태/기간 변경]·판매중지/판매중 라디오·[변경]뿐 — 상품삭제·바이백·판매완료·판매종료 등은 안 누름 */
'use strict';
const fs = require('fs'), path = require('path');
const PG = '/Product/ProductList';
const ID_RE = /^[\w.:|-]{3,160}$/;
const MAXN = 30;
const KINDS = { qty: '수량', stop: '판매중지', start: '판매재개', price: '판매가' }; /* (11/11 y24ops1) price = 판매가 바꾸기(웹앱 🧰 예스24 운영에서 사람이 두 번 눌러 맡김 · 가격 감시 제안과 이음) */
const PRICE_JUMP = 0.5; /* 한 번에 50% 넘게 바뀌는 판매가는 누르지 않고 사람에게(근거: 없음 — 잘못 친 값·자리 밀림 막이) */
const ST_CODE = { stop: '08', start: '02' };
const SELF_RE = /^[\w.-]{2,40}$/;
const sp = (s) => String(s || '').split(/[,\s]+/).filter(Boolean);
const BAD_DLG = /삭제|바이백|출금|탈퇴|반품|환불|판매\s*완료|판매\s*종료|취소하시|일괄/;
/* 맡김 검사(순수 셈 · 시험 t_y24w가 직접 부름) — rec = 이 PC 기록 { ok1, rk:{} } */
function checkJob(j, rec) { if (!j || !ID_RE.test(String(j.id || ''))) return '맡김 이름표가 이상함'; const R = Array.isArray(j.rows) ? j.rows : []; if (!R.length) return '고칠 줄이 없음'; if (R.length > MAXN) return `한 번에 ${MAXN}줄까지 — ${R.length}줄`;
  if (!(rec && rec.ok1) && R.length > 1) return '처음 한 건이 예스24 목록에서 확인되기 전에는 1건짜리 맡김만 받음';
  const seenN = new Set(), seenR = new Set();
  for (const r of R) { if (!r || !ID_RE.test(String(r.rid || ''))) return '줄 이름(rid)이 이상함'; if (!/^\d{5,15}$/.test(String(r.no || ''))) return `예스24 상품번호가 이상함(${r.rid})`; if (r.self) { if (!SELF_RE.test(String(r.self))) return `자체코드(SKU)가 이상함(${r.rid})`; }
    else { if (r.fill && !SELF_RE.test(String(r.fill))) return `채울 자체코드(SKU)가 이상함(${r.rid})`; if (!/^\d{10,13}$/.test(String(r.isbn || '')) && String(r.q || '').trim().length < 2) return `자체코드가 없으면 찾을 ISBN·제목이 있어야 함(${r.rid})`; }
    if (!KINDS[r.kind]) return `할 일 종류가 이상함(${r.rid})`; if (r.kind === 'qty' && !(Number.isInteger(+r.to) && +r.to >= 1 && +r.to <= 999)) return `수량은 1~999권(${r.rid}) — 0권이면 판매중지로`;
    if (r.kind === 'price' && !(Number.isInteger(+r.to) && +r.to >= 100 && +r.to <= 1000000 && +r.to % 10 === 0)) return `판매가는 100원~100만 원 · 10원 단위(${r.rid})`;
    const rk = String(r.rk || ''); if (!ID_RE.test(rk)) return `할 일 열쇠(rk)가 이상함(${r.rid})`;
    if (seenN.has(r.no)) return `같은 상품번호가 한 맡김에 두 번(${r.no})`; if (seenR.has(rk) || (rec && rec.rk && rec.rk[rk])) return `같은 할 일을 이미 함(${r.no}) — 되풀이 0`; seenN.add(r.no); seenR.add(rk); }
  return ''; }
/* 줄 값이 목표와 같은가(이미 됨) — v = { qty, st } */
function isDone(r, v) { if (!v) return false; if (r.kind === 'qty') return +v.qty === +r.to; if (r.kind === 'price') return v.price != null && +v.price === +r.to; return String(v.st || '') === ST_CODE[r.kind]; }

/* ── 화면 쪽 짧은 코드(그 탭에서 Runtime.evaluate) ── */
/* 표 찾기 — RealGrid GridView(getDataSource)를 #productGrid 둘레 Vue 구성 요소에서 찾음 · 줄 값 칸 이름은 응답 칸 이름(GOODS_NO·ENTR_GOODS_CD·ORD_REMAIN_CNT·SALE_STATE_GB) 정규식으로 */
const GV_JS = `const isGV=(x)=>{try{return !!x&&typeof x==='object'&&typeof x.getDataSource==='function'&&typeof x.getItemIndex==='function'}catch(e){return false}};
const findGV=()=>{const g=document.getElementById('productGrid');if(!g)return null;if(isGV(window.__rnY24GV))return window.__rnY24GV;let gv=null;try{if(window.RealGrid&&typeof RealGrid.getGridInstance==='function'){const x=RealGrid.getGridInstance(g)||RealGrid.getGridInstance('productGrid');if(isGV(x))gv=x}}catch(e){}
for(let el=g;el&&!gv;el=el.parentElement){for(let v=el.__vue__,d=0;v&&!gv&&d<6;v=v.$parent,d++){for(const k of Object.keys(v)){let x=null;try{x=v[k]}catch(e){}if(isGV(x)){gv=x;break}}}}if(gv)window.__rnY24GV=gv;return gv};
const vis=(b)=>{try{return b.offsetParent!==null&&getComputedStyle(b).visibility!=='hidden'}catch(e){return false}};const inPop=(b)=>!!(b.closest&&b.closest('.layerPop'));
const busy=()=>{try{const lb=document.getElementById('loading-bg');const cs=lb&&getComputedStyle(lb);return !!cs&&cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity!==0}catch(e){return false}};
const FK=(o,re)=>Object.keys(o||{}).find((k)=>re.test(k));
const rowsOf=(gv)=>{const ds=gv.getDataSource();const n=+ds.getRowCount()||0;const out=[];for(let r=0;r<n&&r<500;r++){const o=ds.getJsonRow?ds.getJsonRow(r):null;if(!o)continue;const kN=FK(o,/^GOODS_NO$/i),kS=FK(o,/^ENTR_GOODS_CD$|SELF|OWN_?CD/i),kQ=FK(o,/^ORD_REMAIN_CNT$|^REM_CNT$|REMAIN|STOCK|JAEGO/i),kT=FK(o,/^SALE_STATE_GB$|^(SALE_|GOODS_)?(STAT|STATE)(_GB|_CD)?$/i),kTN=FK(o,/^SALE_STATE_GB_NM$|^GOODS_STAT_GB_NM$|STATE.*NM$/i),kP=FK(o,/^(SHOP_SALE_PRICE|SHOP_SALE_PR|USED_SALE_PRICE|USED_SALE_PR|SALE_PRICE|SALE_PR|SELL_PRICE|SALE_PRC|USED_PRICE)$/i);out.push({r,no:String(o[kN]==null?'':o[kN]),self:String(o[kS]==null?'':o[kS]),qty:o[kQ]==null?null:+o[kQ],st:String(o[kT]==null?'':o[kT]),stNm:String(o[kTN]==null?'':o[kTN]),price:kP&&o[kP]!=null&&o[kP]!==''?+o[kP]:null,kQ,kT,kS,kP:kP||null})}return out};`;
/* (11/11 y24ops3) 표 모양 기록 — 첫 실행을 못 본 위험(led2·y24ops1 '실제 화면 못 봄') 때문에 등록상품 표의 칸 이름·고칠 수 있는지만 남김(값 없음 · 6시간에 한 번) → 상태 grid → 수집기가 col2_ctl/<PC>.y24hb로 올림 → 진단으로 봄 */
const JS_GRID = `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표 없음'};const ds=gv.getDataSource();const o=ds.getRowCount()>0&&ds.getJsonRow?ds.getJsonRow(0):null;const keys=o?Object.keys(o).slice(0,90):[];
const ed=(f)=>{try{const c=typeof gv.columnByField==='function'?gv.columnByField(f):null;if(!c)return null;return{e:c.editable!==false&&!(c.editor&&c.editor.readOnly)&&c.readOnly!==true,h:String((c.header&&(c.header.text||c.header))||'').slice(0,30)}}catch(e){return null}};
const W=keys.filter((k)=>/PRICE|PR$|PRC|ENTR_GOODS_CD|MAN_NO|REMAIN|REM_CNT|STATE_GB$|STAT_GB$/i.test(k));const cols={};for(const k of W)cols[k]=ed(k);let gopt=null;try{gopt=typeof gv.getEditOptions==='function'?gv.getEditOptions():null;gopt=gopt?{editable:gopt.editable!==false,commitByCell:!!gopt.commitByCell}:null}catch(e){}return{ok:true,n:+ds.getRowCount()||0,keys,cols,opt:gopt}})()`;
/* ① 검색 칸 채우고 [조회] — 읽기만(자체상품코드 = 우리 SKU · 기간 1년 · 판매상태 전체) */
const SRCH = { 5: ['자체상품코드', '자체상품코드'], 3: ['ISBN', 'ISBN'], 0: ['상품명', '상품명'] };
const JS_SEARCH = (self, opt) => { const op = String(opt == null ? 5 : opt); const nm = (SRCH[op] || SRCH[5])[0]; return `(()=>{${GV_JS}if(/login/i.test(location.pathname)||document.querySelector('input[type=password]'))return{login:true};
const sel=[...document.querySelectorAll('select')].find((s)=>[...s.options].some((o)=>o.value===${JSON.stringify(op)}&&o.textContent.indexOf(${JSON.stringify(nm)})>=0));if(!sel)return{ok:false,why:'검색어 고르기 칸(${nm})이 없음'};
sel.value=${JSON.stringify(op)};sel.dispatchEvent(new Event('change',{bubbles:true}));const inp=(sel.parentElement&&sel.parentElement.querySelector('input[type=text]'))||null;if(!inp)return{ok:false,why:'검색어 넣는 칸이 없음'};
const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(inp,${JSON.stringify(self)});inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));
const yr=[...document.querySelectorAll('button')].find((b)=>(b.innerText||'').trim()==='1년'&&vis(b)&&!inPop(b));if(yr)yr.click();
const all=[...document.querySelectorAll('input[type=radio][name=goodsStatGb]')].find((x)=>x.value===''&&!inPop(x));if(all&&!all.checked){const lb=document.querySelector('label[for="'+all.id+'"]');(lb||all).click()}
const q=[...document.querySelectorAll('button')].filter((b)=>/^\\s*조회\\s*$/.test(b.innerText||'')&&vis(b)&&!inPop(b));if(!q.length)return{ok:false,why:'[조회] 단추가 없음'};q[0].click();return{ok:true,yr:!!yr,all:!!all}})()`; };
/* ② 표에서 우리 줄 찾기 */
const JS_FIND = (no, self) => `(()=>{${GV_JS}if(busy())return{busy:true};const gv=findGV();if(!gv)return{ok:false,nogv:true,why:'등록상품 표(RealGrid)를 못 찾음'};let L;try{L=rowsOf(gv)}catch(e){return{ok:false,why:'표 줄 읽기 실패: '+String(e.message||e).slice(0,80)}}
const S=${JSON.stringify(self || '')};const has=(x)=>!S||x.self.split(/[,\\s]+/).filter(Boolean).includes(S);const hit=L.filter((x)=>x.no===${JSON.stringify(no)}&&has(x));const same=S?L.filter(has).length:L.filter((x)=>x.no===${JSON.stringify(no)}).length;return{ok:true,n:L.length,same,hit:hit.map((x)=>({r:x.r,no:x.no,self:x.self,qty:x.qty,st:x.st,stNm:x.stNm,price:x.price,kQ:x.kQ,kT:x.kT,kS:x.kS,kP:x.kP}))}})()`;
/* (11/11 led2b) '판매자상품코드 *' 칸에 우리 SKU 넣기 — 수량 칸과 같은 길(편집기 → 값 → 확정 · 안 되면 표 API) · 칸이 잠겨 있으면(editable false) 손대지 않음 · 아직 저장하지 않음 */
const JS_SELF = (r, kS, v) => !kS ? `({ok:false,ro:true,why:"등록상품 표에서 '판매자상품코드'(자체코드) 칸을 못 찾음 — 채우지 않음"})` : `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const ds=gv.getDataSource();const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};const K=${JSON.stringify(kS)},V=${JSON.stringify(String(v))};
try{const col=typeof gv.columnByField==='function'?gv.columnByField(K):null;if(col&&(col.editable===false||(col.editor&&col.editor.readOnly)))return{ok:false,ro:true,why:"'판매자상품코드' 칸이 표에서 잠겨 있음"}}catch(e){}
let how='';try{gv.setCurrent({itemIndex:it,fieldName:K});if(typeof gv.showEditor==='function'){gv.showEditor();const ed=[...document.querySelectorAll('#productGrid .rg-editor input,#productGrid .rg-editor textarea,#productGrid input.rg-editor,#productGrid textarea.rg-editor')].find((x)=>vis(x));
if(ed){const P=ed.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(P,'value').set.call(ed,V);ed.dispatchEvent(new Event('input',{bubbles:true}));if(typeof gv.commit==='function')gv.commit();how='editor'}}}catch(e){}
try{if(String(ds.getValue(${r},K)==null?'':ds.getValue(${r},K))!==V){gv.setValue(it,K,V);if(typeof gv.commit==='function')gv.commit();how='setValue'}}catch(e){return{ok:false,ro:true,why:"'판매자상품코드' 칸을 못 고침: "+String(e.message||e).slice(0,80)}}
const x=String(ds.getValue(${r},K)==null?'':ds.getValue(${r},K));return x===V?{ok:true,how}:{ok:false,ro:true,why:"'판매자상품코드' 칸이 바뀌지 않음"}})()`;
/* ③ 수량 칸 고치기(사람이 칸을 두 번 눌러 고치는 것과 같은 길 — 편집기 → 값 → 확정 · 편집기가 안 뜨면 표 API setValue) · 아직 저장하지 않음 */
const JS_QTY = (r, kQ, to) => !kQ ? `({ok:false,why:'등록상품 표에서 재고수량 칸 이름을 못 찾음 — 아무 칸도 건드리지 않음'})` : `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const ds=gv.getDataSource();const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};
let how='';try{gv.setCurrent({itemIndex:it,fieldName:${JSON.stringify(kQ)}});if(typeof gv.showEditor==='function'){gv.showEditor();const ed=[...document.querySelectorAll('#productGrid .rg-editor input,#productGrid .rg-editor textarea,#productGrid input.rg-editor,#productGrid textarea.rg-editor')].find((x)=>vis(x));
if(ed){const P=ed.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(P,'value').set.call(ed,${JSON.stringify(String(to))});ed.dispatchEvent(new Event('input',{bubbles:true}));if(typeof gv.commit==='function')gv.commit();how='editor'}}}catch(e){}
try{if(+ds.getValue(${r},${JSON.stringify(kQ)})!==${+to}){gv.setValue(it,${JSON.stringify(kQ)},${+to});if(typeof gv.commit==='function')gv.commit();how='setValue'}}catch(e){return{ok:false,why:'재고수량 칸을 못 고침: '+String(e.message||e).slice(0,80)}}
const v=+ds.getValue(${r},${JSON.stringify(kQ)});return v===${+to}?{ok:true,how}:{ok:false,why:'재고수량 칸이 바뀌지 않음('+v+')'}})()`;
/* ③-2 (11/11 y24ops1) 판매가 칸 고치기 — 표에서 그 칸이 고칠 수 있는 칸일 때만(RealGrid columnByField(...).editable === false 면 아무것도 안 함) · 아직 저장하지 않음 */
const JS_PRICE = (r, kP, to) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const ds=gv.getDataSource();const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};
let col=null;try{col=typeof gv.columnByField==='function'?gv.columnByField(${JSON.stringify(kP)}):null}catch(e){}if(col&&(col.editable===false||col.readOnly===true))return{ok:false,lock:true,why:'등록상품 표의 판매가 칸은 고칠 수 없는 칸'};
try{gv.setCurrent({itemIndex:it,fieldName:${JSON.stringify(kP)}});if(typeof gv.showEditor==='function'){gv.showEditor();const ed=[...document.querySelectorAll('#productGrid .rg-editor input,#productGrid input.rg-editor')].find((x)=>vis(x));if(ed){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(ed,${JSON.stringify(String(to))});ed.dispatchEvent(new Event('input',{bubbles:true}));if(typeof gv.commit==='function')gv.commit()}}}catch(e){}
try{if(+ds.getValue(${r},${JSON.stringify(kP)})!==${+to}){gv.setValue(it,${JSON.stringify(kP)},${+to});if(typeof gv.commit==='function')gv.commit()}}catch(e){return{ok:false,why:'판매가 칸을 못 고침: '+String(e.message||e).slice(0,80)}}
const v=+ds.getValue(${r},${JSON.stringify(kP)});return v===${+to}?{ok:true}:{ok:false,why:'판매가 칸이 바뀌지 않음('+v+')'}})()`;
/* ④ 그 줄 하나만 고름(판매상태 변경용) */
const JS_CHECK = (r) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};try{if(typeof gv.checkAll==='function')gv.checkAll(false);gv.checkItem(it,true)}catch(e){return{ok:false,why:'줄 고르기 실패: '+String(e.message||e).slice(0,80)}}
let c=[];try{c=(gv.getCheckedRows&&gv.getCheckedRows())||(gv.getCheckedItems&&gv.getCheckedItems().map((i)=>gv.getDataRow(i)))||[]}catch(e){}return c.length===1&&+c[0]===${r}?{ok:true}:{ok:false,why:'고른 줄이 하나가 아님('+c.length+'줄)'}})()`;
/* 단추 하나(이름 그대로 · 보이는 것 하나만 · 창 밖) */
const JS_BTN = (name) => `(()=>{${GV_JS}const L=[...document.querySelectorAll('button')].filter((b)=>(b.innerText||'').replace(/\\s+/g,' ').trim()===${JSON.stringify(name)}&&vis(b)&&!b.disabled&&!inPop(b));if(L.length!==1)return{ok:false,why:'['+${JSON.stringify(name)}+'] 단추를 하나로 못 찾음('+L.length+'개)'};L[0].click();return{ok:true}})()`;
/* ⑤ '판매상태/기간 변경' 창 — 라디오 고름(아직 [변경] 안 누름) / [변경] 누름 */
const POP_JS = `const pop=()=>[...document.querySelectorAll('.layerPop')].find((x)=>getComputedStyle(x).display!=='none'&&/판매상태\\s*\\/\\s*기간\\s*변경/.test((x.querySelector('h1')||{}).innerText||''));`;
const JS_POP_PICK = (code) => `(()=>{${GV_JS}${POP_JS}const P=pop();if(!P)return{ok:false,wait:true,why:"'판매상태/기간 변경' 창이 안 뜸"};const rd=[...P.querySelectorAll('input[type=radio][name=goodsStatGb]')].find((x)=>x.value===${JSON.stringify(code)});if(!rd)return{ok:false,why:'창에 그 판매상태 라디오가 없음'};
if(!rd.checked){const lb=P.querySelector('label[for="'+rd.id+'"]');(lb||rd).click()}const ck=P.querySelector('input[type=checkbox][name=changeDateYn]');return rd.checked?{ok:true,date:!!(ck&&ck.checked)}:{ok:false,why:'라디오가 골라지지 않음'}})()`;
const JS_POP_GO = `(()=>{${POP_JS}const P=pop();if(!P)return{ok:false,why:"'판매상태/기간 변경' 창이 없음"};const b=[...P.querySelectorAll('button')].filter((x)=>/^\\s*변경\\s*$/.test(x.innerText||'')&&!x.disabled);if(b.length!==1)return{ok:false,why:'[변경] 단추를 하나로 못 찾음('+b.length+'개)'};b[0].click();return{ok:true}})()`;
const JS_POP_CLOSE = `(()=>{${POP_JS}const P=pop();const c=P&&P.querySelector('button.close');if(c)c.click();return !!c})()`;

function makeY24W(o) { const { HOME, note } = o; const now = () => Date.now(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const SC = o.SC || 1;
  const REC_F = path.join(HOME, 'y24-w.json'), Q_F = path.join(HOME, 'y24-wq.json');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }; const wr = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (e) { o.log && o.log('예스24 쓰기 파일 저장 실패: ' + e.message); } };
  const R = { rec: rd(REC_F, { ok1: null, rk: {}, stop: null }), q: rd(Q_F, { jobs: [], res: {} }), cur: null, msg: '', dlg: [], phase: '' };
  R.rec.rk = R.rec.rk || {}; R.q.jobs = Array.isArray(R.q.jobs) ? R.q.jobs : []; R.q.res = R.q.res || {};
  const saveQ = () => wr(Q_F, R.q); const saveRec = () => { const ks = Object.keys(R.rec.rk); if (ks.length > 3000) ks.sort((a, b) => R.rec.rk[a].at - R.rec.rk[b].at).slice(0, ks.length - 3000).forEach((k) => delete R.rec.rk[k]); wr(REC_F, R.rec); };
  /* 도우미가 누르는 사이에 꺼졌으면(다시 켜짐) — 다시 누르지 않고 '확실하지 않음'으로 알리고 멈춤 */
  for (const j of R.q.jobs) if (j.st === 'click' || j.st === 'run') { const clicked = j.st === 'click'; R.q.res[j.id] = { state: clicked ? 'unsure' : 'fail', pre: !clicked, msg: clicked ? '예스24에 저장·변경을 누르는 사이 도우미가 다시 켜짐 — 예스24 등록상품 관리에서 바뀌었는지 사람이 확인(다시 누르지 않음)' : '고치기 준비 중 도우미가 다시 켜짐 — 아무것도 누르지 않음', todo: clicked ? '예스24 판매관리 › 등록상품 관리에서 그 상품을 보고, 안 바뀌었으면 손으로 고친 뒤 「✓ 예스24에서 고쳤음」' : '🛠 처리할 일에서 다시 맡기기', at: now(), rows: Object.fromEntries(j.rows.map((r) => [r.rid, { state: clicked && r.rid === j.at1 ? 'unsure' : 'fail', pre: !(clicked && r.rid === j.at1) }])) }; if (clicked) R.rec.stop = { why: R.q.res[j.id].msg, at: now(), job: j.id }; j.st = 'end'; }
  R.q.jobs = R.q.jobs.filter((j) => j.st !== 'end'); saveQ(); saveRec();
  const pc = () => String(o.pcName() || ''); const banPc = () => (o.isLogger() ? '로거 PC — 예스24 쓰기 안 함(약속 0)' : /^MJ-MAIN/i.test(pc()) ? 'MJ-MAIN(등록·출고 PC) — 예스24 쓰기 안 함(출고 보호)' : '');
  const busyNo = () => { const s = new Set(); for (const j of R.q.jobs) for (const r of j.rows) s.add(String(r.no)); return s; };
  function put(b) { const ban = banPc(); if (ban) return { code: 409, body: { ok: false, err: ban } }; if (!o.enabled()) return { code: 409, body: { ok: false, err: '번외 예스24 판매관리 읽기가 꺼져 있음 — 옆 창에서 켜기' } };
    if (R.q.res[b && b.id] || R.q.jobs.some((j) => j.id === (b && b.id))) return { code: 200, body: { ok: true, already: true } };
    if (R.rec.stop) return { code: 409, body: { ok: false, stop: true, err: '⛔ 예스24 쓰기 멈춤 — ' + R.rec.stop.why + ' · 확인한 뒤 웹앱 🛠 처리할 일 「▶ 예스24 쓰기 이어 가기」' } };
    const why = checkJob(b, R.rec); if (why) return { code: 400, body: { ok: false, err: why } };
    if (!R.rec.ok1 && R.q.jobs.length) return { code: 409, body: { ok: false, err: '처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)' } };
    const BN = busyNo(); for (const r of b.rows) if (BN.has(String(r.no))) return { code: 400, body: { ok: false, err: `같은 상품(${r.no})이 이미 맡김 줄에 있음 — 되풀이 0` } };
    const j = { id: String(b.id), rows: b.rows.map((r) => ({ rid: String(r.rid), rk: String(r.rk), no: String(r.no), self: String(r.self || ''), ...(r.self ? {} : { fill: String(r.fill || ''), isbn: String(r.isbn || ''), q: String(r.q || '').slice(0, 60) }), kind: r.kind, to: r.kind === 'qty' || r.kind === 'price' ? +r.to : null, title: String(r.title || '').slice(0, 60) })), st: 'wait', at: now(), by: String(b.by || '').slice(0, 60) };
    R.q.jobs.push(j); saveQ(); note(`🟦 예스24 쓰기 맡김 받음 — ${j.rows.length}건(${j.rows[0].title || j.rows[0].no} ${KINDS[j.rows[0].kind]}${j.rows[0].kind === 'qty' ? ' ' + j.rows[0].to + '권' : j.rows[0].kind === 'price' ? ' ' + j.rows[0].to + '원' : ''}${j.rows.length > 1 ? ' 외' : ''})`); o.kick(300); return { code: 200, body: { ok: true, took: j.id } }; }
  function ack(ids) { for (const id of Array.isArray(ids) ? ids.map(String) : []) delete R.q.res[id]; saveQ(); return { ok: true }; }
  function resume(by) { const was = R.rec.stop; R.rec.stop = null; saveRec(); if (was) note(`▶ 예스24 쓰기 이어 감 — ${String(by || '').slice(0, 40)}`); o.kick(300); return { ok: true, was: !!was }; }
  const why0 = () => banPc() || (!o.enabled() ? '예스24 읽기 꺼짐' : R.rec.stop ? '⛔ 멈춤 — ' + R.rec.stop.why : o.login() !== 'ok' ? '예스24 로그인 기다림(누르기 전)' : o.holdOn() ? '🚚 출고 중 — 끝나면 이어감(약속 0-1)' : '');
  function state() { return { ok: true, ver: 1, pc: pc(), ban: banPc() || null, ok1: R.rec.ok1 || null, hist: (R.rec.hist || []).slice(0, 20), grid: R.rec.grid || null, stop: R.rec.stop || null, wait: R.q.jobs.filter((j) => j.st === 'wait').map((j) => ({ id: j.id, n: j.rows.length, at: j.at, rids: j.rows.map((r) => r.rid) })), cur: R.cur ? { id: R.cur.id, step: R.cur.step || '', n: R.cur.rows.length, rids: R.cur.rows.map((r) => r.rid) } : null, res: R.q.res, why: R.q.jobs.length ? why0() || null : null, msg: R.msg, login: o.login(), hold: !!o.holdOn() }; }
  const pick = () => !R.cur && !why0() && R.q.jobs.find((j) => j.st === 'wait');
  const cur = () => !!R.cur;
  /* 확인 물음 — 이 일의 저장·변경 단추를 누른 뒤에만 '예'(그 일에 맞는 낱말 · 위험 낱말 없음) · 그 밖은 늘 '아니오' · 알림(alert)은 닫음 */
  function dialog(p) { const m = String(p.message || '').replace(/\s+/g, ' ').slice(0, 160); R.dlg.push(m); if (p.type === 'alert') return true; if (R.phase === 'qty') return /저장|수정/.test(m) && !BAD_DLG.test(m); if (R.phase === 'state') return /변경|판매\s*중|상태/.test(m) && !BAD_DLG.test(m); return false; }
  /* 화면을 열고 검색 → 우리 줄 찾기 (읽기만) — { login } | { err } | { hit, same, n } */
  async function look(r) { await o.nav(o.BASE + PG + '?t=' + now(), 30); if (o.isLoginSt(await o.ev(o.JS_STATE))) return { login: true }; await sleep(1500 * SC);
    /* (11/13 fix1113 · 아침 점검 'hot banana fudge 195142826 — ISBN 조회 0줄') ISBN으로 두 번 다 0줄이면 제목(상품명)으로 한 번 더 조회해 상품번호(GOODS_NO)가 꼭 맞는 줄을 찾음(읽기만)
     *  · 예스24 검색어 고르기에는 '상품번호'가 없음(상품명·저자/역자·제조업체명·ISBN·홍보문구·자체상품코드 — reports/yes24_raw DOC_product_productlist 11/08) → 제목으로 좁힌 뒤 표에서 상품번호로 고름
     *  · 까닭 후보: 예스24 상품에 붙은 ISBN이 장부 ISBN과 다름(같은 책 다른 판·ISBN-10 등) — 제목으로 찾으면 줄의 ISBN은 보지 않고 상품번호만 맞춤 */
    const isbnOk = /^\d{10,13}$/.test(String(r.isbn || '')); const tq = String(r.q || r.title || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    const ser = r.self ? [[r.self, 5], [r.self, 5]] : isbnOk ? [[r.isbn, 3], [r.isbn, 3], ...(tq.length >= 2 ? [[tq, 0]] : [])] : [[tq, 0], [tq, 0]];
    let t0 = 0, f = null, how = ''; for (let tr = 0; tr < ser.length; tr++) { if (tr) await sleep(2500 * SC); /* (0.1.38 y24chk · 11/12 진단) 첫 [조회]가 0줄이면 한 번 더(읽기만) — 17:46·19:47 「hot banana fudge」 첫 맡김이 'ISBN으로 조회 0줄'로 끝났는데 1~2분 뒤 같은 조회는 그 줄을 찾음(화면이 스스로 부른 첫 목록 응답을 우리 [조회] 응답으로 본 것으로 보임) */
    t0 = now(); const s = await o.ev(JS_SEARCH(ser[tr][0], ser[tr][1])); if (s && s.login) return { login: true }; if (!s || !s.ok) return { err: (s && s.why) || '검색 칸을 못 채움', shape: true };
    for (let k = 0; k < 60 && !(o.Y.plAt > t0); k++) await sleep(250); await sleep(900 * SC);
    f = null; for (let k = 0; k < 40; k++) { f = await o.ev(JS_FIND(r.no, r.self)); if (f && !f.busy) break; await sleep(300); }
    if (f && f.ok && !f.busy && ser[tr][1] === 0 && isbnOk) how = `ISBN ${r.isbn}으로 0줄 → 제목 '${tq}'으로 ${f.n}줄`;
    if (!(f && f.ok && !f.busy && f.n === 0)) break; }
    if (f && how) f.how = how;
    if (!f || f.busy) return { err: '등록상품 목록이 다 그려지지 않음' }; if (!f.ok) return { err: f.why, shape: !!f.nogv }; if (!(o.Y.plAt > t0)) return { err: '[조회] 뒤 등록상품 목록 응답을 못 봄' };
    if (f.n > 0 && !(R.rec.grid && now() - (+R.rec.grid.at || 0) < 6 * 3600e3)) { try { const g = await o.ev(JS_GRID); if (g && g.ok) { R.rec.grid = { at: now(), n: g.n, keys: g.keys, cols: g.cols, opt: g.opt }; saveRec(); } } catch (e) {} } return f; }
  const vOf = (h) => (h ? { qty: h.qty, st: h.st, stNm: h.stNm, price: h.price == null ? null : +h.price } : null);
  const vTxt = (v) => (v ? `${v.stNm || v.st || '?'}·${v.qty == null ? '?' : v.qty}권${v.price != null ? '·' + v.price + '원' : ''}` : '?');
  /* 줄 하나 — 돌려줌 { state: done|already|fail|unsure|login, pre, msg, todo, before, after } */
  /* (11/11 led2b) 자체코드 채우기 — 수량·판매중지가 끝난(done·already) 자체코드 없는 줄만 · 실패해도 앞 결과는 그대로(까닭만 붙음) · 저장 뒤 자체코드로 다시 조회해 확인 */
  async function fillSelf(j, r) { if (o.holdOn()) return { state: 'skip', msg: '🚚 출고 중이 되어 자체코드 채우기는 건너뜀' }; j.step = `${r.no} 자체코드 칸 채우는 중`;
    const a = await look({ ...r, self: '' }); if (a.login || a.err || !a.hit || a.hit.length !== 1) return { state: 'skip', msg: `자체코드 채우기 건너뜀 — 줄을 하나로 다시 못 찾음${a.err ? '(' + a.err + ')' : ''}` };
    const h = a.hit[0]; if (sp(h.self).includes(r.fill)) return { state: 'already', msg: `자체코드 ${r.fill} 이미 있음` }; if (sp(h.self).length) return { state: 'skip', msg: `자체코드가 이미 ${h.self}라 채우지 않음` };
    if (!h.kS) return { state: 'skip', msg: "등록상품 표에 '판매자상품코드' 칸이 없어 자체코드 채우기는 건너뜀" };
    const e = await o.ev(JS_SELF(h.r, h.kS, r.fill)); if (!e || !e.ok) return { state: 'skip', msg: `${(e && e.why) || "'판매자상품코드' 칸을 못 고침"} — 자체코드 채우기는 건너뜀(저장 안 함)` };
    await sleep(800 * SC); R.dlg = []; R.phase = 'qty'; j.step = `${r.no} 자체코드 [수정항목 저장] 누름`; const c = await o.ev(JS_BTN('수정항목 저장')); if (!c || !c.ok) { R.phase = ''; return { state: 'skip', msg: `${(c && c.why) || '[수정항목 저장]을 못 누름'} — 자체코드는 그대로` }; }
    await sleep(2500 * SC); R.phase = ''; j.step = `${r.no} 자체코드 확인`; let b = null; try { b = await look({ ...r, self: r.fill }); } catch (er) { b = null; }
    if (b && b.hit && b.hit.length === 1) return { state: 'done', msg: `자체코드 ${r.fill} 채움(등록상품 목록에서 확인 — 다음부터 바로 짝지어짐)` };
    return { state: 'unsure', msg: `자체코드 저장은 눌렀지만 목록에서 확인 못 함${R.dlg.length ? ' — 예스24 알림: ' + R.dlg.slice(-1)[0] : ''}` }; }
  async function rowRun(j, r) { const x = await rowMain(j, r); if (r.fill && !r.self && !r._has && (x.state === 'done' || x.state === 'already')) { let f; try { f = await fillSelf(j, r); } catch (e) { R.phase = ''; f = { state: 'skip', msg: '자체코드 채우기 오류 — ' + String(e.message || e).slice(0, 100) }; } x.fill = f; x.msg = `${x.msg || ''} · ${f.msg}`; } return x; }
  async function rowMain(j, r) { const what = r.kind === 'qty' ? `수량 ${r.to}권` : r.kind === 'price' ? `판매가 ${r.to}원` : KINDS[r.kind]; j.step = `${r.no} 찾는 중`;
    const a = await look(r); if (a.login) return { state: 'login' }; if (a.err) return { state: 'fail', pre: true, msg: `${a.err} — 아무것도 누르지 않음`, todo: a.shape ? '예스24 등록상품 관리 화면 모양이 바뀌었을 수 있음 — 손으로 고친 뒤 「✓ 예스24에서 고쳤음」 · 리드나우 방에 알려 주세요' : '잠시 뒤 다시 맡기기 · 안 되면 손으로' };
    if (!a.hit.length) return { state: 'fail', pre: true, gone: true, msg: r.self ? `예스24 등록상품 목록에서 상품번호 ${r.no}·자체코드 ${r.self} 줄을 못 찾음(같은 자체코드 ${a.same}줄) — 아무것도 누르지 않음` : `예스24 등록상품 목록에서 상품번호 ${r.no} 줄을 못 찾음(${a.how || (r.isbn ? 'ISBN ' + r.isbn : '제목') + '으로 조회 ' + a.n + '줄'}) — 아무것도 누르지 않음`, todo: '예스24 판매관리에서 그 상품이 지워졌거나 자체코드가 다른지 보고 손으로' };
    if (a.hit.length > 1) return { state: 'fail', pre: true, msg: `같은 상품번호·자체코드 줄이 ${a.hit.length}개 — 아무것도 누르지 않음`, todo: '예스24 판매관리에서 손으로' };
    const h = a.hit[0]; const before = vOf(h);
    if (!r.self) { const hs = sp(h.self); if (hs.length && !(r.fill && hs.includes(r.fill))) return { state: 'fail', pre: true, msg: `예스24 ${r.no}의 자체코드가 이미 ${h.self} — 장부가 이은 실물(${r.fill || '?'})과 달라 아무것도 누르지 않음`, before, todo: '🔗 연결 표에서 이 예스24 상품의 짝을 확인한 뒤 손으로' }; r._has = hs.length > 0; }
    if (isDone(r, before)) return { state: 'already', msg: `이미 ${what}(${vTxt(before)}) — 아무것도 누르지 않음`, before, after: before };
    if (r.kind === 'qty' && h.st !== '02') return { state: 'fail', pre: true, msg: `판매중이 아닌 상품(${h.stNm || h.st})의 수량은 바꾸지 않음 — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 상태를 보고 손으로' };
    if (r.kind === 'price') { if (h.st !== '02') return { state: 'fail', pre: true, msg: `판매중이 아닌 상품(${h.stNm || h.st})의 판매가는 바꾸지 않음 — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 상태를 보고 손으로' };
      if (!h.kP || h.price == null) return { state: 'fail', pre: true, msg: '등록상품 목록에서 판매가 칸을 못 찾음 — 아무것도 누르지 않음', before, todo: '예스24 판매관리 › 등록상품 관리에서 손으로 판매가를 고친 뒤 「✓ 예스24에서 고쳤음」 · 리드나우 방에 알려 주세요(칸 이름 확인)' };
      if (h.price > 0 && Math.abs(r.to - h.price) / h.price > PRICE_JUMP) return { state: 'fail', pre: true, msg: `지금 ${h.price}원 → ${r.to}원은 ${Math.round(PRICE_JUMP * 100)}% 넘게 바뀜 — 잘못 친 값일 수 있어 누르지 않음`, before, todo: '값이 맞으면 예스24 판매관리에서 손으로 · 아니면 웹앱에서 값을 고쳐 다시 맡기기' }; }
    if (r.kind === 'start' && !/^(08)$/.test(h.st)) return { state: 'fail', pre: true, msg: `판매중지가 아닌 상품(${h.stNm || h.st})은 다시 열지 않음 — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 손으로' };
    if (r.kind === 'stop' && h.st !== '02') return { state: 'fail', pre: true, msg: `판매중이 아닌 상품(${h.stNm || h.st})은 판매중지로 바꾸지 않음 — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 상태를 보고 손으로' };
    if (o.holdOn()) return { state: 'hold' }; R.dlg = [];
    if (r.kind === 'qty' || r.kind === 'price') { const pr = r.kind === 'price'; j.step = `${r.no} ${pr ? '판매가' : '재고수량'} 칸 고치는 중`; const e = await o.ev(pr ? JS_PRICE(h.r, h.kP, r.to) : JS_QTY(h.r, h.kQ, r.to));
      if (pr && e && e.lock) return { state: 'fail', pre: true, lock: true, msg: '등록상품 관리 표에서 판매가 칸을 고칠 수 없게 돼 있음 — 아무것도 누르지 않음', before, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품을 열어 손으로 판매가를 고친 뒤 「✓ 예스24에서 고쳤음」(다른 길은 리드나우 방이 원문을 보고 만듦)' }; if (!e || !e.ok) return { state: 'fail', pre: true, msg: `${(e && e.why) || (pr ? '판매가' : '재고수량') + ' 칸을 못 고침'} — 저장하지 않음`, before, todo: '예스24 판매관리에서 손으로 고친 뒤 「✓ 예스24에서 고쳤음」' };
      await sleep(800 * SC); j.st = 'click'; j.at1 = r.rid; j.step = `${r.no} [수정항목 저장] 누름`; saveQ(); R.phase = 'qty'; const c = await o.ev(JS_BTN('수정항목 저장')); if (!c || !c.ok) { R.phase = ''; j.st = 'run'; saveQ(); return { state: 'fail', pre: true, msg: `${(c && c.why) || '[수정항목 저장]을 못 누름'} — 아무것도 저장되지 않음`, before, todo: '예스24 판매관리에서 손으로' }; } }
    else { j.step = `${r.no} 줄 고르는 중`; const c1 = await o.ev(JS_CHECK(h.r)); if (!c1 || !c1.ok) return { state: 'fail', pre: true, msg: `${(c1 && c1.why) || '줄을 못 고름'} — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 손으로' };
      const c2 = await o.ev(JS_BTN('판매상태/기간 변경')); if (!c2 || !c2.ok) return { state: 'fail', pre: true, msg: `${(c2 && c2.why) || '[판매상태/기간 변경]을 못 누름'} — 아무것도 바뀌지 않음`, before, todo: '예스24 판매관리에서 손으로' };
      let pk = null; for (let k = 0; k < 20; k++) { await sleep(300 * SC); pk = await o.ev(JS_POP_PICK(ST_CODE[r.kind])); if (pk && (pk.ok || !pk.wait)) break; }
      if (!pk || !pk.ok) { await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: `${(pk && pk.why) || '판매상태 창이 안 뜸'}${R.dlg.length ? ' — 예스24 알림: ' + R.dlg.slice(-1)[0] : ''} — [변경]은 누르지 않음`, before, todo: '예스24 판매관리에서 손으로' }; }
      if (pk.date) { await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: "창의 '기간변경'이 켜져 있어 멈춤(판매기간은 건드리지 않음) — [변경]은 누르지 않음", before, todo: '예스24 판매관리에서 손으로' }; }
      await sleep(600 * SC); j.st = 'click'; j.at1 = r.rid; j.step = `${r.no} [변경] 누름`; saveQ(); R.phase = 'state'; const c3 = await o.ev(JS_POP_GO); if (!c3 || !c3.ok) { R.phase = ''; j.st = 'run'; saveQ(); await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: `${(c3 && c3.why) || '[변경]을 못 누름'} — 아무것도 바뀌지 않음`, before, todo: '예스24 판매관리에서 손으로' }; } }
    /* 이 줄 뒤로는 다시 누르지 않음 — 목록을 새로 읽어 확인만 */
    await sleep(2500 * SC); R.phase = ''; await o.ev(JS_POP_CLOSE).catch(() => {}); const dl = R.dlg.slice(-2).join(' / ');
    j.step = `${r.no} 등록상품 목록 다시 읽어 확인`; let b = null; try { b = await look(r); } catch (e) { b = { err: String(e.message || e).slice(0, 100) }; }
    j.st = 'run'; saveQ();
    if (!b || b.login || b.err || !b.hit || b.hit.length !== 1) return { state: 'unsure', msg: `눌렀지만 다시 읽어 확인하지 못함(${b && b.login ? '로그인 풀림' : (b && b.err) || '줄을 하나로 못 찾음'})${dl ? ' — 예스24 알림: ' + dl : ''}`, before, todo: '예스24 판매관리 › 등록상품 관리에서 바뀌었는지 보고, 바뀌었으면 「✓ 예스24에서 고쳤음」 · 안 바뀌었으면 손으로' };
    const after = vOf(b.hit[0]);
    if (isDone(r, after)) return { state: 'done', msg: `${what} — 등록상품 목록에서 확인(${vTxt(before)} → ${vTxt(after)})${dl ? ' · 예스24 알림: ' + dl : ''}`, before, after };
    return { state: 'unsure', msg: `눌렀지만 등록상품 목록 값이 ${vTxt(after)}(바라는 값 ${what})${dl ? ' — 예스24 알림: ' + dl : ''}`, before, after, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품을 보고 손으로 고친 뒤 「✓ 예스24에서 고쳤음」(다시 누르지 않고 멈춤)' }; }
  function end(j, res) { j.st = 'end'; R.q.res[j.id] = { ...res, at: now(), dlg: R.dlg.slice(-4) };
    { const hs = Array.isArray(R.rec.hist) ? R.rec.hist : []; for (const r of j.rows) { const x = (res.rows || {})[r.rid] || {}; hs.unshift({ at: now(), job: j.id, no: r.no, kind: r.kind, fill: r.fill ? 1 : 0, st: x.state || res.state, fillSt: x.fill ? x.fill.state : null, msg: String(x.msg || res.msg || '').slice(0, 160), dlg: R.dlg.slice(-2).map((m) => String(m).replace(/\d{6,}/g, '#').slice(0, 60)) }); } R.rec.hist = hs.slice(0, 20); saveRec(); } /* (11/11 y24ops3) 줄마다 결과를 이 PC에 20개까지 — 웹앱이 결과를 받아 지워도(ack) 첫 실행이 어땠는지 남음 */ R.q.jobs = R.q.jobs.filter((x) => x.id !== j.id); saveQ(); R.cur = null; R.phase = ''; R.msg = `${res.state === 'done' ? '✅' : res.state === 'unsure' ? '⚠' : '⛔'} 예스24 쓰기 ${j.rows.length}건: ${res.msg || res.state}`; note(R.msg); return res; }
  async function once() { const j = pick(); if (!j) return false; R.cur = j; R.dlg = []; j.st = 'run'; j.step = '준비'; saveQ(); const rows = {}; let stop = null;
    try { for (const r of j.rows) { if (stop) { rows[r.rid] = { state: 'fail', pre: true, msg: '앞 줄이 멈춰 이 줄은 하지 않음 — 아무것도 누르지 않음', todo: '🛠 처리할 일에서 다시 맡기기' }; continue; }
        let x; try { x = await rowRun(j, r); } catch (e) { const clicked = j.st === 'click'; x = { state: clicked ? 'unsure' : 'fail', pre: !clicked, msg: (clicked ? '누른 뒤 오류 — ' : '누르기 전 오류(아무것도 안 누름) — ') + String(e.message || e).slice(0, 140), todo: clicked ? '예스24 등록상품 관리에서 바뀌었는지 사람이 확인' : '잠시 뒤 다시 맡기기' }; j.st = 'run'; R.phase = ''; }
        if (x.state === 'login' || x.state === 'hold') { const left = j.rows.filter((y) => !rows[y.rid]); if (left.length === j.rows.length) { j.st = 'wait'; j.step = ''; R.cur = null; saveQ(); if (x.state === 'login') o.setLogin('need', '등록상품 화면이 로그인 화면(예스24 쓰기)'); R.msg = x.state === 'login' ? '🔐 예스24 로그인이 풀려 쓰기 기다림(아무것도 안 누름)' : '🚚 출고 중 — 예스24 쓰기 기다림'; return true; }
          x = { state: 'fail', pre: true, msg: x.state === 'login' ? '예스24 로그인이 풀려 이 줄은 하지 않음' : '🚚 출고 중이 되어 이 줄은 하지 않음', todo: '🛠 처리할 일에서 다시 맡기기' }; stop = stop || null; }
        rows[r.rid] = x; if (x.state === 'done' || x.state === 'already') { R.rec.rk[r.rk] = { at: now(), job: j.id, no: r.no, st: x.state }; if (x.state === 'done' && !R.rec.ok1) R.rec.ok1 = now(); saveRec(); }
        if (x.state === 'unsure' || (x.state === 'fail' && !x.pre)) { stop = x; } else if (j.rows.length > 1) await sleep(2500 * SC); }
      const V = Object.values(rows); const nOk = V.filter((x) => x.state === 'done' || x.state === 'already').length;
      if (stop) { R.rec.stop = { why: stop.msg, at: now(), job: j.id }; saveRec(); }
      const st = nOk === V.length ? 'done' : stop ? 'unsure' : nOk ? 'part' : 'fail'; const one = V.length === 1 ? V[0] : null;
      return end(j, { state: st, rows, msg: one ? one.msg : `${nOk}/${V.length}줄 끝${stop ? ' · ⚠ 멈춤 — ' + stop.msg : ''}`, todo: one ? one.todo || null : stop ? stop.todo : null, stop: !!stop }); }
    catch (e) { return end(j, { state: 'fail', rows, msg: '예스24 쓰기 오류 — ' + String(e.message || e).slice(0, 140) }); } }
  return { put, ack, resume, state, pick, once, cur, dialog, R };
}
module.exports = { makeY24W, checkJob, isDone, KINDS, ST_CODE, MAXN, PRICE_JUMP, _js: { JS_FIND, JS_QTY, JS_SELF } }; /* _js = 시험이 화면 쪽 짧은 코드를 가짜 표로 바로 돌려 봄(0.1.38) */
