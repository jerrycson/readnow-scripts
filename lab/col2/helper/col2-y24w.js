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
const rowsOf=(gv)=>{const ds=gv.getDataSource();const n=+ds.getRowCount()||0;const out=[];for(let r=0;r<n&&r<500;r++){const o=ds.getJsonRow?ds.getJsonRow(r):null;if(!o)continue;const kN=FK(o,/^GOODS_NO$/i),kS=FK(o,/^ENTR_GOODS_CD$|SELF|OWN_?CD/i),kQ=FK(o,/^ORD_REMAIN_CNT$|^REM_CNT$|REMAIN|STOCK|JAEGO/i),kT=FK(o,/^SALE_STATE_GB$|^(SALE_|GOODS_)?(STAT|STATE)(_GB|_CD)?$/i),kTN=FK(o,/^SALE_STATE_GB_NM$|^GOODS_STAT_GB_NM$|STATE.*NM$/i),kP=FK(o,/^(SHOP_SALE_PRICE|SHOP_SALE_PR|USED_SALE_PRICE|USED_SALE_PR|SALE_PRICE|SALE_PR|SELL_PRICE|SALE_PRC|USED_PRICE)$/i),kD=FK(o,/^SALE_DTS$/i);out.push({r,no:String(o[kN]==null?'':o[kN]),self:String(o[kS]==null?'':o[kS]),qty:o[kQ]==null?null:+o[kQ],st:String(o[kT]==null?'':o[kT]),stNm:String(o[kTN]==null?'':o[kTN]),price:kP&&o[kP]!=null&&o[kP]!==''?+o[kP]:null,dts:kD?String(o[kD]==null?'':o[kD]):null,kQ,kT,kS,kP:kP||null})}return out};`;
/* (11/11 y24ops3) 표 모양 기록 — 첫 실행을 못 본 위험(led2·y24ops1 '실제 화면 못 봄') 때문에 등록상품 표의 칸 이름·고칠 수 있는지만 남김(값 없음 · 6시간에 한 번) → 상태 grid → 수집기가 col2_ctl/<PC>.y24hb로 올림 → 진단으로 봄 */
const JS_GRID = `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표 없음'};const ds=gv.getDataSource();const o=ds.getRowCount()>0&&ds.getJsonRow?ds.getJsonRow(0):null;const keys=o?Object.keys(o).slice(0,90):[];
const ed=(f)=>{try{const c=typeof gv.columnByField==='function'?gv.columnByField(f):null;if(!c)return null;return{e:c.editable!==false&&!(c.editor&&c.editor.readOnly)&&c.readOnly!==true,h:String((c.header&&(c.header.text||c.header))||'').slice(0,30)}}catch(e){return null}};
const W=keys.filter((k)=>/PRICE|PR$|PRC|ENTR_GOODS_CD|MAN_NO|REMAIN|REM_CNT|STATE_GB$|STAT_GB$/i.test(k));const cols={};for(const k of W)cols[k]=ed(k);let gopt=null;try{gopt=typeof gv.getEditOptions==='function'?gv.getEditOptions():null;gopt=gopt?{editable:gopt.editable!==false,commitByCell:!!gopt.commitByCell}:null}catch(e){}return{ok:true,n:+ds.getRowCount()||0,keys,cols,opt:gopt}})()`;
/* (y24re 0.1.54 · 정범님 '웹앱이 예스24에 직접 반영하는 첫 일 — 실제 반영을 확인' · 헌장 제13조 원문부터) 재고수량 칸을 표가 못 고치게 해 저장이 안 됨(HOME 11/13 13:40 '경고' 상자)
 *  → 사람은 어떤 길로 수량을 바꾸는지 화면 코드에서 읽기만: 표 칸 목록(이름·칸·머리·고칠 수 있음·그림 종류) + 이 화면 구성 요소의 함수 중 상세·수정·저장·재고 관련 함수 글(앞 500자) — 누르는 것 0 · 값·손님 정보 없음(코드 글만)
 *  → 상태 grid.probe → 수집기가 col2_ctl/<PC>.y24hb.w.grid로 올림 → 진단으로 읽고 다음 판에서 그 길(상세수정 등)을 만듦 */
const JS_PROBE = `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false};const cl=(v,n)=>String(v==null?'':v).replace(/\\s+/g,' ').slice(0,n||40);let cols=[];try{const C=typeof gv.getColumns==='function'?gv.getColumns():[];cols=C.slice(0,70).map((c)=>[cl(c.name),cl(c.fieldName),cl(c.header&&(c.header.text||c.header)),c.editable===false?0:1,cl(c.renderer&&(c.renderer.type||c.renderer.name)||c.type,20),cl(c.button,10)])}catch(e){}
const M=[];const seen=new Set();const g=document.getElementById('productGrid');for(let el=g;el;el=el.parentElement){for(let v=el.__vue__,d=0;v&&d<8;v=v.$parent,d++){if(seen.has(v))continue;seen.add(v);const ms=(v.$options&&v.$options.methods)||{};for(const k of Object.keys(ms)){if(M.length>=16)break;if(!/detail|modify|edit|save|upd|stock|cnt|qty|remain|popup|open|valid|check|상세/i.test(k))continue;let src='';try{src=String(ms[k]).replace(/\\s+/g,' ').slice(0,500)}catch(e){}M.push([cl(k,40),src])}}}
let cbs=[];try{cbs=['onCellEditable','onGetEditValue','onEditCommit','onCellEdited','onEditRowChanged','onCellButtonClicked','onCellItemClicked','onCellClicked'].filter((k)=>typeof gv[k]==='function').map((k)=>[k,String(gv[k]).replace(/\\s+/g,' ').slice(0,400)])}catch(e){}
return{ok:true,url:location.pathname,cols,M,cbs}})()`;
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
const S=${JSON.stringify(self || '')};const has=(x)=>!S||x.self.split(/[,\\s]+/).filter(Boolean).includes(S);const hit=L.filter((x)=>x.no===${JSON.stringify(no)}&&has(x));const same=S?L.filter(has).length:L.filter((x)=>x.no===${JSON.stringify(no)}).length;return{ok:true,n:L.length,same,hit:hit.map((x)=>({r:x.r,no:x.no,self:x.self,qty:x.qty,st:x.st,stNm:x.stNm,price:x.price,dts:x.dts,kQ:x.kQ,kT:x.kT,kS:x.kS,kP:x.kP}))}})()`;
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
if(how!=='editor'){let c0=null;try{c0=gv.columnByField(${JSON.stringify(kQ)})}catch(e){}if(c0&&c0.editable===false)return{ok:false,lock:true,why:'등록상품 관리 표에서 이 상품의 재고수량 칸을 고칠 수 없게 돼 있음(편집 칸이 안 열림)'}} /* (y24re 11/13 판 뒤 확인 — HOME 195142826: 칸 고침 setValue · 칸 고칠 수 있음 아니오 → 예스24 "경고" 상자 · 값 그대로) 표가 못 고치게 한 칸은 억지로 값을 넣어 저장하지 않음 */
try{if(+ds.getValue(${r},${JSON.stringify(kQ)})!==${+to}){gv.setValue(it,${JSON.stringify(kQ)},${+to});if(typeof gv.commit==='function')gv.commit();how='setValue'}}catch(e){return{ok:false,why:'재고수량 칸을 못 고침: '+String(e.message||e).slice(0,80)}}
const v=+ds.getValue(${r},${JSON.stringify(kQ)});let rs=null,ce=null;try{rs=typeof ds.getRowState==='function'?String(ds.getRowState(${r})):null}catch(e){}try{const c=gv.columnByField(${JSON.stringify(kQ)});ce=c?c.editable!==false:null}catch(e){}return v===${+to}?{ok:true,how,rs,ce}:{ok:false,why:'재고수량 칸이 바뀌지 않음('+v+')'}})()`; /* (y24re 11/13) rs = 표가 본 그 줄 상태(updated면 [수정항목 저장]이 보낼 줄) · ce = 그 칸이 표에서 고칠 수 있는 칸인가 — '저장되지 않음'의 근원을 진단(hist)으로 보려고 */
/* (y24re 0.1.55 · HOME 11/13 14:04 실제 화면 '경고 × 수정한 상품이 없습니다.') 표 값만 코드로 바꾸면(setValue) 예스24 화면이 '수정한 상품'으로 세지 않음(사람이 칸을 더블 클릭해 고칠 때만 셈)
 *  → 사람과 똑같이: 그 칸 자리를 셈(JS_CELL) → 진짜 마우스 더블 클릭(DevTools 입력 = trusted) → 열린 입력 칸 글자를 모두 고르고 진짜 글자 넣기 → 진짜 Enter → 표 값이 바뀌었는지 봄 · 아직 저장은 안 누름 */
const JS_CELL = (r, kQ) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};const g=document.getElementById('productGrid');try{g.scrollIntoView({block:'center'})}catch(e){}
try{gv.setCurrent({itemIndex:it,fieldName:${JSON.stringify(kQ)}})}catch(e){}let b=null;try{if(typeof gv.getCellBounds==='function'){const c=gv.columnByField(${JSON.stringify(kQ)});b=gv.getCellBounds(it,c||${JSON.stringify(kQ)},true)||gv.getCellBounds(it,${JSON.stringify(kQ)})}}catch(e){}
const gr=g.getBoundingClientRect();if(b&&b.width>0){const x=gr.left+b.x+b.width/2,y=gr.top+b.y+b.height/2;if(x>gr.left&&x<gr.right&&y>gr.top&&y<gr.bottom)return{ok:true,x,y,how:'bounds'}}
const L=[...g.querySelectorAll('td,.rg-cell,[class*="rg-"]')].filter((e)=>vis(e)&&e.getBoundingClientRect().width>0);const cur=L.find((e)=>/focus|current/i.test(e.className||''));if(cur){const q=cur.getBoundingClientRect();return{ok:true,x:q.left+q.width/2,y:q.top+q.height/2,how:'focus'}}
return{ok:false,why:'재고수량 칸 자리를 못 셈(getCellBounds '+(typeof gv.getCellBounds)+')'}})()`;
const JS_EDSEL = `(()=>{const a=document.activeElement;const g=document.getElementById('productGrid');const ed=(a&&/INPUT|TEXTAREA/.test(a.tagName)&&g&&g.contains(a))?a:[...document.querySelectorAll('#productGrid input,#productGrid textarea')].find((x)=>x.offsetParent!==null&&!/checkbox|radio/.test(x.type||''));if(!ed)return{ok:false};try{ed.focus();ed.select()}catch(e){}return{ok:true,v:String(ed.value||'').slice(0,10)}})()`;
const JS_QV = (r, kQ) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return null;const ds=gv.getDataSource();let rs=null;try{rs=typeof ds.getRowState==='function'?String(ds.getRowState(${r})):null}catch(e){}return{v:+ds.getValue(${r},${JSON.stringify(kQ)}),rs}})()`;
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
const DATE_JS = `const dateSt=(P)=>{const ck=P.querySelector('input[type=checkbox][name=changeDateYn]');const di=[...P.querySelectorAll('input.gtDate,input[data-input],input[placeholder="YYYY-MM-DD"]')];const act=[...P.querySelectorAll('.datepicker_btngroup button.active,.btn-group button.active')].map((b)=>(b.innerText||'').trim());let cy=null;try{for(const e of [P,...P.querySelectorAll('*')].slice(0,600)){for(let v=e.__vue__,d=0;v&&d<6&&cy==null;v=v.$parent,d++){const q=v.rqData;if(q&&typeof q==='object'&&'changeDateYn' in q)cy=String(q.changeDateYn)}if(cy!=null)break}}catch(x){}return{has:!!ck,on:!!(ck&&ck.checked),dis:!!(ck&&ck.disabled),dv:di.map((x)=>x.value).join('|'),ddis:di.map((x)=>x.disabled?1:0).join(''),act:act.join('|'),cy}};`; /* (y24qty1) cy = 창 화면 자료 rqData.changeDateYn(저장 때 예스24로 가는 값 · SalesStatusDateChangePopup.clickSave 원문) */
const JS_POP_PICK = (code) => `(()=>{${GV_JS}${POP_JS}${DATE_JS}const P=pop();if(!P)return{ok:false,wait:true,why:"'판매상태/기간 변경' 창이 안 뜸"};const rd=[...P.querySelectorAll('input[type=radio][name=goodsStatGb]')].find((x)=>x.value===${JSON.stringify(code)});if(!rd)return{ok:false,why:'창에 그 판매상태 라디오가 없음'};
if(!rd.checked){const lb=P.querySelector('label[for="'+rd.id+'"]');(lb||rd).click()}const ck=P.querySelector('input[type=checkbox][name=changeDateYn]');const ds=dateSt(P);return rd.checked?{ok:true,date:!!(ck&&ck.checked),ds,txt:(P.innerText||'').replace(/\\s+/g,' ').slice(0,300)}:{ok:false,why:'라디오가 골라지지 않음'}})()`;
/* (y24re8 · HOME 11/13 19:0x 195495964 판매중지 — 창의 '기간변경' 체크가 켜진 채 열려 멈춤) 그 체크만 끔(라벨을 눌러 사람처럼) → 다시 읽은 상태를 돌려줌 · 잠긴 체크(disabled)는 건드리지 않음 · [변경]은 안 누름 */
const JS_POP_UNDATE = `(()=>{${POP_JS}${DATE_JS}const P=pop();if(!P)return{ok:false,why:"'판매상태/기간 변경' 창이 없음"};const ck=P.querySelector('input[type=checkbox][name=changeDateYn]');if(!ck)return{ok:false,why:"창에 '기간변경' 체크가 없음"};if(ck.disabled){const d0=dateSt(P);if(!ck.checked&&d0.cy!=='Y')return{ok:true,auto:true};return{ok:false,lock:true,why:"'기간변경' 체크가 잠겨 있어 끌 수 없음",ds:d0}}if(ck.checked){const lb=P.querySelector('label[for="'+ck.id+'"]');(lb||ck).click()}return{ok:true}})()`;
const JS_POP_DATE = `(()=>{${POP_JS}${DATE_JS}const P=pop();return P?{ok:true,ds:dateSt(P)}:{ok:false}})()`;
const JS_POP_GO = `(()=>{${POP_JS}const P=pop();if(!P)return{ok:false,why:"'판매상태/기간 변경' 창이 없음"};const b=[...P.querySelectorAll('button')].filter((x)=>/^\\s*변경\\s*$/.test(x.innerText||'')&&!x.disabled);if(b.length!==1)return{ok:false,why:'[변경] 단추를 하나로 못 찾음('+b.length+'개)'};b[0].click();return{ok:true}})()`;
/* (11/13 home2 · 판 뒤 확인 — HOME 11:07 hot banana fudge 수량 1권: [수정항목 저장]을 눌렀는데 브라우저 물음(confirm)이 하나도 안 뜨고 목록은 그대로 2권 → '확실하지 않음'으로 멈춤)
 *  판매관리 화면은 확인 물음을 브라우저 창이 아니라 화면 안 알림 상자(GtMessagePopup — 화면이 그때 만드는 상자)로 띄울 수 있음 → 예전엔 그 상자를 아무도 안 눌러 저장이 안 된 것으로 보임
 *  → [수정항목 저장]·[변경]을 누른 뒤 5초 동안 화면 안 상자를 살펴: 그 글을 R.dlg(진단 hist dlg)에 남기고, '저장/수정하시겠습니까' 꼴이고 위험한 말(BAD_DLG)이 없을 때만 그 상자 안 [확인]/[예]를 누름(브라우저 물음 규칙과 같음)
 *  · '수정된 … 없습니다' 같은 알림이면 그 글을 결과에 남김 · 판매상태 창(.layerPop h1 판매상태/기간 변경)은 건드리지 않음 */
const JS_MSGPOP = (click) => `(()=>{const vis=(b)=>{try{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(b).visibility!=='hidden'&&getComputedStyle(b).display!=='none'}catch(e){return false}};
const tx=(x)=>(x.innerText||'').replace(/\\s+/g,' ').trim();const C=[...document.querySelectorAll('[class*="layerPop"],[class*="msgPop"],[class*="MsgPop"],[class*="message"],[class*="Message"],[class*="modal"],[class*="alert"],[role="dialog"],[role="alertdialog"]')].filter((x)=>vis(x)&&!(x.querySelector('h1')&&/판매상태\\s*\\/\\s*기간\\s*변경/.test(tx(x.querySelector('h1'))))&&!x.closest('#productGrid'));
const P=C.filter((x)=>{const t=tx(x);return t.length>2&&t.length<400&&[...x.querySelectorAll('button,a,input[type=button]')].some((b)=>vis(b))}).sort((a,b)=>tx(a).length-tx(b).length)[0];if(!P)return{none:true};
let Q=P;for(let k=0;k<4&&tx(Q).replace(/[×xX\s]/g,'').length<12&&Q.parentElement&&Q.parentElement!==document.body&&vis(Q.parentElement)&&tx(Q.parentElement).length<500;k++)Q=Q.parentElement; /* (y24re) '경고 ×'처럼 머리줄만 잡히면 상자 몸통 글까지(위로 4칸) */const t=tx(Q).slice(0,160);const B=[...P.querySelectorAll('button,a,input[type=button]')].filter((b)=>vis(b));const bt=B.map((b)=>(b.innerText||b.value||'').replace(/\\s+/g,' ').trim().slice(0,10)).filter(Boolean).slice(0,6);
const ask=/(저장|수정)\\s*하?시겠|(저장|수정)할까|(저장|수정)\\s*됩니다/.test(t);const bad=${BAD_DLG.toString()}.test(t);let did=false;
if(${click ? 'true' : 'false'}&&ask&&!bad){const b=B.find((b)=>/^(확인|예|저장)$/.test((b.innerText||b.value||'').replace(/\\s+/g,'').trim()));if(b){b.click();did=true}}
return{t,bt,ask,bad,did}})()`;
const JS_POP_CLOSE = `(()=>{${POP_JS}const P=pop();const c=P&&P.querySelector('button.close');if(c)c.click();return !!c})()`;

/* ── (y24re8 · FOUND f_261113_y24_remcnt_locked) [상세수정] 화면 길 — 등록상품 표의 재고수량(REM_CNT)은 표 정의상 고칠 수 없는 칸(editable 0) · 표에서 고칠 수 있는 칸은 판매가·판매자상품코드뿐
 *   → 수량은 그 줄의 [상세수정] 단추(표 칸 UPDATE_BUTTON · 화면 함수 showWindowPopup = window.open 새 창)로 여는 화면에서 바꿈
 *   · 새 창을 띄우지 않음: 누르기 직전 그 탭의 window.open을 잠깐 바꿔 열 주소만 받고(되돌림) 같은 숨은 탭으로 그 주소를 엶(읽기)
 *   · 그 화면 칸 이름·저장 단추·불러온 api 주소를 원문으로 남김(R.rec.det → 💓 y24hb.w.det · 값은 앞 40자 · 손님 정보 없음 — 상품 화면)
 *   · 저장 전: 재고수량 칸이 꼭 하나 · 그 값 = 목록 값 · 저장 단추가 꼭 하나(이름 SAVE_RE · '등록'은 안 누름) · 글자를 넣은 뒤 다시 읽어 '재고수량 칸만' 바뀌었는지 → 아니면 저장 안 함
 *   · 저장 뒤: 그 화면을 다시 열어 읽고 + 등록상품 목록을 다시 읽어 '수량만 바뀌고 판매가·판매기간·상태·설명은 그대로'인지 → 맞으면 done · 아무것도 안 바뀌면 '저장되지 않음' · 그 밖은 '확실하지 않음'(멈춤 · 사람 확인) */
const SAVE_RE = /^(수정|저장|수정하기|저장하기|상품\s*수정|상품정보\s*수정|수정\s*완료|수정\s*저장)$/; /* 근거: 없음 — 판매관리 화면 단추 이름 꼴(등록상품 관리 [수정항목 저장]) · '등록'·'신규등록'은 새 상품을 만들 수 있어 넣지 않음 */
const QTY_LABEL = /재고\s*수량|^재고$/;
const IGN_LABEL = /수정\s*일|변경\s*일|최종|일시|등록\s*일/; /* 저장 뒤 비교에서 빼는 칸(저장하면 저절로 바뀌는 날짜) */
const JS_COLED = (f) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return null;try{const c=gv.columnByField(${JSON.stringify(f)});return c?c.editable!==false&&c.readOnly!==true:null}catch(e){return null}})()`;
const JS_UBCELL = (r) => `(()=>{${GV_JS}const gv=findGV();if(!gv)return{ok:false,why:'표를 못 찾음'};const it=gv.getItemIndex(${r});if(!(it>=0))return{ok:false,why:'줄 위치를 못 찾음'};const g=document.getElementById('productGrid');try{g.scrollIntoView({block:'center'})}catch(e){}
let c=null;try{c=gv.columnByField('UPDATE_BUTTON')}catch(e){}if(!c)return{ok:false,why:"표에 '상세수정'(UPDATE_BUTTON) 칸이 없음"};try{if(typeof gv.setCurrent==='function')gv.setCurrent({itemIndex:it,fieldName:'UPDATE_BUTTON'})}catch(e){}
let b=null;try{b=gv.getCellBounds(it,c,true)||gv.getCellBounds(it,'UPDATE_BUTTON')}catch(e){}const gr=g.getBoundingClientRect();if(b&&b.width>0){const x=gr.left+b.x+b.width/2,y=gr.top+b.y+b.height/2;if(x>gr.left&&x<gr.right&&y>gr.top&&y<gr.bottom)return{ok:true,x,y}}
return{ok:false,why:"'상세수정' 칸 자리를 못 셈(화면 밖이거나 getCellBounds 없음)"}})()`;
/* (y24qty1 · 11/14 원문 reports/yes24_raw/GRID_HOME_1114_0107.json probe2) 실제 [상세수정] 칸이 하는 일 = 화면 함수 callbackGridButton:
 *   '"UPDATE_BUTTON"==e.column.name&&this.$router.push({name:"SelectProduct",params:{goodsNo:a.GOODS_NO}})' — 새 창(window.open)이 아니라 같은 탭 Vue 길 이동
 *   · 0.1.56은 그 칸을 화면 자리로 눌렀는데, 칸이 표 29칸 중 25번째(가로로 화면 밖)라 getCellBounds가 자리를 못 줘 실패(11/14 01:07 ie5)
 *   → 그 줄의 상품번호(GOODS_NO)가 맡긴 번호와 같은지 표에서 다시 본 뒤, 그 화면이 쓰는 같은 함수($router.push · 길 이름은 그 화면 함수 글에서 읽음 · 없으면 SelectProduct)를 부름 — 누르기와 같은 일 · 저장은 아님
 *   · 길이 없으면(화면이 바뀜) 예전처럼 칸을 눌러 봄(가로로 그 칸까지 넘긴 뒤) */
const JS_ROUTE = (r, no) => `(()=>{${GV_JS}const N=${JSON.stringify(String(no))};const gv=findGV();if(gv){let v=null;try{v=gv.getDataSource().getValue(${r},'GOODS_NO')}catch(e){}if(v!=null&&String(v)!==N)return{ok:false,bad:true,why:'표 줄의 상품번호('+String(v).slice(0,20)+')가 맡긴 번호와 달라 열지 않음'}}
let rt=null,pg=null;const roots=[document.getElementById('productGrid'),document.getElementById('app'),document.body&&document.body.firstElementChild].filter(Boolean);
for(const r0 of roots){for(let el=r0,d0=0;el&&d0<40;el=el.parentElement,d0++){for(let v=el.__vue__,d=0;v&&d<10;v=v.$parent,d++){const ms=(v.$options&&v.$options.methods)||{};if(!pg&&typeof ms.callbackGridButton==='function')pg=v;if(!rt&&v.$router&&typeof v.$router.push==='function')rt=v.$router}}}
if(!rt)return{ok:false,why:'화면의 길 이동($router)을 못 찾음'};let name='SelectProduct',from='기본';try{const m=String(pg&&pg.$options.methods.callbackGridButton).match(/UPDATE_BUTTON[^]{0,80}?\\$router\\.push\\(\\{name:["']([A-Za-z0-9_]+)["']/);if(m){name=m[1];from='화면 함수'}}catch(e){}
let R=null;try{R=rt.resolve({name,params:{goodsNo:N}})}catch(e){return{ok:false,why:'길 '+name+'을 못 풂('+String(e&&e.message||e).slice(0,40)+')'}}const M=(R&&((R.route&&R.route.matched)||R.matched))||[];if(!M.length)return{ok:false,why:'화면에 길 '+name+'이 없음'};
const href=String(R.href||'');try{const p=rt.push({name,params:{goodsNo:N}});if(p&&typeof p.catch==='function')p.catch(function(){})}catch(e){return{ok:false,why:'길 이동 실패('+String(e&&e.message||e).slice(0,40)+')'}}return{ok:true,name,from,href}})()`;
const JS_OPEN_HOOK = `(()=>{window.__rnOpen=[];if(!window.__rnOpen0){window.__rnOpen0=window.open;window.open=function(u){try{window.__rnOpen.push(String(u==null?'':u))}catch(e){}return{closed:false,focus:function(){},close:function(){},blur:function(){},postMessage:function(){},document:{},location:{}}}}return true})()`;
const JS_OPEN_GET = `(()=>{const vis=(x)=>{try{return getComputedStyle(x).display!=='none'&&x.getClientRects().length>0}catch(e){return false}};return{u:(window.__rnOpen||[]).slice(0,3),href:location.href,pop:[...document.querySelectorAll('.layerPop')].filter(vis).map((x)=>((x.querySelector('h1')||{}).innerText||'').replace(/\\s+/g,' ').trim().slice(0,40)).filter(Boolean)}})()`;
const JS_OPEN_UNHOOK = `(()=>{if(window.__rnOpen0){window.open=window.__rnOpen0;window.__rnOpen0=null}return true})()`;
/* 그 화면 칸 모두 읽기(누르지 않음) — 칸마다 열쇠 k(name·id·라벨+차례) · 라벨 · 값 · 보임·잠김 · 단추 이름 · 머리글 · 불러온 api 주소 · 그 상품 번호가 화면에 있는지 */
const JS_DET = (no) => `(()=>{const vis=(e)=>{try{return e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'}catch(x){return false}};const cl=(v,n)=>String(v==null?'':v).replace(/\\s+/g,' ').trim().slice(0,n||40);
if(/login/i.test(location.pathname)||document.querySelector('input[type=password]'))return{login:true};
const hid=(e)=>{const p=e.closest&&e.closest('.layerPop');return !!p&&getComputedStyle(p).display==='none'};
const lab=(e)=>{let t='';try{if(e.id){const l=document.querySelector('label[for="'+CSS.escape(e.id)+'"]');if(l)t=l.innerText}if(!t){const g=e.closest('.yes_form_group,.form-group,fieldset,tr,li,dl');if(g){const l=[...g.querySelectorAll('label,th,dt,.sub_label,legend')].find((x)=>!x.contains(e));if(l)t=l.innerText}}if(!t)t=e.getAttribute('placeholder')||e.getAttribute('aria-label')||''}catch(x){}return cl(t,30)};
const F=[];const seen={};let i=0;for(const e of document.querySelectorAll('input,select,textarea')){i++;if(hid(e))continue;const t=(e.getAttribute('type')||e.tagName).toLowerCase();if(/^(button|submit|reset|file|image|password)$/.test(t))continue;
let k=e.name?'n:'+e.name+(/radio|checkbox/.test(t)?'='+e.value:''):(e.id&&!/^__BVID__/.test(e.id)?'i:'+e.id:'l:'+lab(e)+'#'+i);if(seen[k])k+='#'+i;seen[k]=1;e.setAttribute('data-rn3-k',k);
let v;if(/radio|checkbox/.test(t))v=e.checked?'1':'0';else if(e.tagName==='SELECT'){const o=e.options[e.selectedIndex];v=o?o.value+'|'+cl(o.text,30):''}else v=String(e.value==null?'':e.value);
F.push({k,t,l:lab(e),v:v.slice(0,400),vis:vis(e),dis:!!e.disabled,ro:!!e.readOnly})}
const B=[...document.querySelectorAll('button,input[type=button],input[type=submit],a.btn')].filter((b)=>vis(b)&&!hid(b)&&!(b.closest&&b.closest('.layerPop'))).map((b)=>cl(b.innerText||b.value,20)).filter(Boolean).slice(0,40);
const H=[...document.querySelectorAll('h1,h2,h3')].filter((x)=>vis(x)&&!hid(x)).map((x)=>cl(x.innerText,40)).filter(Boolean).slice(0,10);
let api=[];try{api=[...new Set(performance.getEntriesByType('resource').map((x)=>x.name).filter((n)=>/\\/api\\//i.test(n)).map((n)=>{try{return new URL(n).pathname}catch(x){return ''}}))].slice(0,30)}catch(x){}
const N=${JSON.stringify(String(no))};const hasNo=!!N&&(location.href.indexOf(N)>=0||F.some((f)=>f.v===N||f.v.indexOf(N)>=0)||((document.body&&document.body.innerText)||'').indexOf(N)>=0);
return{ok:true,url:location.pathname+location.search,F,B,H,api,hasNo}})()`;
const JS_KPOS = (k) => `(()=>{const e=document.querySelector('[data-rn3-k="'+CSS.escape(${JSON.stringify(k)})+'"]');if(!e)return{ok:false};try{e.scrollIntoView({block:'center'})}catch(x){}const r=e.getBoundingClientRect();return r.width>0?{ok:true,x:r.left+Math.min(r.width/2,40),y:r.top+r.height/2}:{ok:false}})()`;
const JS_KSEL = (k) => `(()=>{const e=document.querySelector('[data-rn3-k="'+CSS.escape(${JSON.stringify(k)})+'"]');if(!e)return false;try{e.focus();e.select()}catch(x){}return document.activeElement===e})()`;
const JS_KBLUR = (k) => `(()=>{const e=document.querySelector('[data-rn3-k="'+CSS.escape(${JSON.stringify(k)})+'"]');if(!e)return false;try{e.dispatchEvent(new Event('change',{bubbles:true}));e.blur()}catch(x){}return true})()`;
const JS_DETSAVE = `(()=>{const vis=(b)=>{try{return b.getClientRects().length>0&&getComputedStyle(b).visibility!=='hidden'}catch(e){return false}};const RE=${SAVE_RE.toString()};const L=[...document.querySelectorAll('button,input[type=button],input[type=submit],a.btn')].filter((b)=>vis(b)&&!b.disabled&&!(b.closest&&b.closest('.layerPop'))&&RE.test(String(b.innerText||b.value||'').replace(/\\s+/g,' ').trim()));if(L.length!==1)return{ok:false,why:'저장 단추를 하나로 못 찾음('+L.length+'개)'};L[0].click();return{ok:true,t:String(L[0].innerText||L[0].value||'').trim()}})()`;
/* (y24re8) 화면 함수 원문 둘째(누르지 않음) — 0.1.54 probe는 공용 함수(showWindowPopup 등)로 16칸을 다 채워 정작 이 화면 함수(상세수정·판매상태 창)를 못 담았음
 *  → 표 둘레·판매상태 창 둘레 구성 요소마다: 이름 · 함수 이름 목록 · 이 화면 낱말(UPDATE_BUTTON·window.open·changeDate·goodsStatGb·Product/ …)이 든 함수·mounted·watch 글(앞 1500자) · 판매상태 창 data(글자·수·참거짓만) */
const GEN_M = /^(showWindowPopup|showMsgPopup|showPopup|closePopup|showBalloonPopup|showGridProgressPopup|checkValidation|checkServiceResult|showOrderDetailPopup|setGridCheckbarVisible|setColumnEditable|setColumnStyleToCheckBox|setColumnTextBoxEditorStyle)$/;
const JS_PROBE2 = `(()=>{const cl=(v,n)=>String(v==null?'':v).replace(/\\s+/g,' ').slice(0,n||40);const GEN=${GEN_M.toString()};const KEY=/UPDATE_BUTTON|window\\.open|showWindowPopup\\(|Product\\/|changeDate|goodsStatGb|SALE_DTS|saleEnd|REM_CNT|onCellItemClicked|CellButton|ItemClicked/i;
const out={c:[],src:[],data:[]};const seen=new Set();let budget=36000;const add=(nm,f)=>{let s='';try{s=String(f).replace(/\\s+/g,' ')}catch(e){}if(!s||!KEY.test(s))return;s=s.slice(0,1500);if(budget-s.length<0||out.src.length>=24)return;budget-=s.length;out.src.push(nm+' ¦ '+s)};
const walk=(el,tag)=>{for(let e=el,d0=0;e&&d0<40;e=e.parentElement,d0++){for(let v=e.__vue__,d=0;v&&d<8;v=v.$parent,d++){if(seen.has(v))continue;seen.add(v);const o=v.$options||{};const nm=cl(o.name||o._componentTag||'?',30);const ms=o.methods||{};out.c.push(tag+' ¦ '+nm+' ¦ '+cl(Object.keys(ms).join(','),700));
for(const k of Object.keys(ms))if(!GEN.test(k))add(nm+'.'+k,ms[k]);for(const h of ['mounted','created','beforeMount']){const L=o[h];(Array.isArray(L)?L:L?[L]:[]).forEach((f,i)=>add(nm+'.'+h+i,f))}const W=o.watch||{};for(const k of Object.keys(W))add(nm+'.watch.'+k,typeof W[k]==='function'?W[k]:W[k]&&W[k].handler);
if(tag==='pop'){let D={};try{D=v.$data||{}}catch(e){}for(const k of Object.keys(D).slice(0,60)){const x=D[k];if(x==null||['string','number','boolean'].includes(typeof x))out.data.push(nm+'.'+k+' ¦ '+cl(x,40))}}}}};
const g=document.getElementById('productGrid');if(g)walk(g,'grid');const h=[...document.querySelectorAll('.layerPop h1')].find((x)=>/판매상태\\s*\\/\\s*기간\\s*변경/.test(x.innerText||''));if(h){const P=h.closest('.layerPop');const inner=P&&P.querySelector('[class*=box_body]');walk(inner||P,'pop')}
out.c=out.c.slice(0,30);return{ok:true,url:location.pathname,...out}})()`;

function makeY24W(o) { const { HOME, note } = o; const now = () => Date.now(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const SC = o.SC || 1;
  const REC_F = path.join(HOME, 'y24-w.json'), Q_F = path.join(HOME, 'y24-wq.json');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }; const wr = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (e) { o.log && o.log('예스24 쓰기 파일 저장 실패: ' + e.message); } };
  const R = { rec: rd(REC_F, { ok1: null, rk: {}, stop: null }), q: rd(Q_F, { jobs: [], res: {} }), cur: null, msg: '', dlg: [], phase: '' };
  R.rec.rk = R.rec.rk || {}; R.q.jobs = Array.isArray(R.q.jobs) ? R.q.jobs : []; R.q.res = R.q.res || {};
  /* (11/13 home2) 0.1.49까지 '눌렀지만 목록 값이 그대로'(저장이 안 됨)를 '확실하지 않음'으로 보고 쓰기를 멈췄던 것 — 고친 판이 처음 켜질 때 한 번만 그 멈춤을 풂(값을 정해 넣는 일이라 다시 해도 겹치지 않음) */
  { const MK = REC_F + '.fix1113b'; if (!fs.existsSync(MK)) { if (R.rec.stop && /눌렀지만 등록상품 목록 값이/.test(String(R.rec.stop.why || ''))) { const w = R.rec.stop.why; R.rec.stop = null; wr(REC_F, R.rec); try { note(`▶ 예스24 쓰기 — 예전 판이 '저장이 안 된 것'을 '확실하지 않음'으로 보고 건 멈춤을 고친 판에서 한 번 풂(${String(w).slice(0, 60)})`); } catch (e) {} } try { fs.writeFileSync(MK, String(Date.now())); } catch (e) {} } }
  { const MK = REC_F + '.fix1113c'; if (!fs.existsSync(MK)) { if (R.rec.stop && /목록 값이/.test(String(R.rec.stop.why || '')) && /칸 고칠 수 있음 아니오|화면 상자: 경고/.test(String(R.rec.stop.why || ''))) { const w = R.rec.stop.why; R.rec.stop = null; wr(REC_F, R.rec); try { note(`▶ 예스24 쓰기 — 표가 못 고치게 한 재고수량 칸을 0.1.52가 억지로 넣어 '경고'만 뜨고 값이 그대로였던 멈춤을 한 번 풂(저장된 것 없음 · ${String(w).slice(0, 50)})`); } catch (e) {} } try { fs.writeFileSync(MK, String(Date.now())); } catch (e) {} } } /* (y24re 0.1.53) */
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
  function state() { return { ok: true, ver: 1, pc: pc(), ban: banPc() || null, ok1: R.rec.ok1 || null, hist: (R.rec.hist || []).slice(0, 20), grid: R.rec.grid || null, det: R.rec.det || null, pop: R.rec.pop || null, stop: R.rec.stop || null, wait: R.q.jobs.filter((j) => j.st === 'wait').map((j) => ({ id: j.id, n: j.rows.length, at: j.at, rids: j.rows.map((r) => r.rid) })), cur: R.cur ? { id: R.cur.id, step: R.cur.step || '', n: R.cur.rows.length, rids: R.cur.rows.map((r) => r.rid) } : null, res: R.q.res, why: R.q.jobs.length ? why0() || null : null, msg: R.msg, login: o.login(), hold: !!o.holdOn() }; }
  const pick = () => !R.cur && !why0() && R.q.jobs.find((j) => j.st === 'wait');
  const cur = () => !!R.cur;
  /* 확인 물음 — 이 일의 저장·변경 단추를 누른 뒤에만 '예'(그 일에 맞는 낱말 · 위험 낱말 없음) · 그 밖은 늘 '아니오' · 알림(alert)은 닫음 */
  /* (11/13 home2) 누른 뒤 화면 안 알림 상자 — 5초 동안 · 글은 R.dlg에(진단) · 저장 물음이면 [확인] 한 번 */
  /* (y24re 0.1.55) 사람처럼 수량 칸 고치기 — { ok, how, rs, ce } | { ok:false, lock?, why } */
  async function humanQty(h, to) { const c = await o.ev(JS_CELL(h.r, h.kQ)); if (!c || !c.ok) return { ok: false, why: (c && c.why) || '재고수량 칸 자리를 못 셈' };
    await o.inp.dbl(c.x, c.y); await sleep(500 * SC); let s = await o.ev(JS_EDSEL); if (!s || !s.ok) { await o.inp.dbl(c.x, c.y); await sleep(700 * SC); s = await o.ev(JS_EDSEL); }
    if (!s || !s.ok) return { ok: false, lock: true, why: `등록상품 관리 표에서 재고수량 칸을 사람처럼 더블 클릭해도 입력 칸이 안 열림(${c.how})` };
    await o.inp.text(String(to)); await sleep(200 * SC); await o.inp.key('Enter'); await sleep(600 * SC); const q = await o.ev(JS_QV(h.r, h.kQ));
    return q && q.v === +to ? { ok: true, how: 'dblclick:' + c.how + (s.v ? '(전 ' + s.v + ')' : ''), rs: q.rs, ce: true } : { ok: false, why: `더블 클릭해 ${to}을 넣었지만 표 값이 ${q ? q.v : '?'} — 저장하지 않음` }; }
  /* (y24re8) [상세수정] 화면 — 열기(새 창 없이 같은 탭) · 다 그려질 때까지 읽기 · 원문 남기기 */
  const fStr = (f) => `${f.k} ¦ ${f.t} ¦ ${f.l} ¦ ${String(f.v).slice(0, 40)} ¦ ${f.vis ? '보임' : '숨음'}${f.dis ? '·잠김' : ''}${f.ro ? '·읽기만' : ''}`;
  const saveDet = (x) => { R.rec.det = { v: 1, at: now(), ...x }; saveRec(); };
  async function readDet(no) { let d = null, prev = ''; for (let k = 0; k < 30; k++) { d = await o.ev(JS_DET(no), 15000); if (d && d.login) return d; const sig = d && d.ok ? JSON.stringify(d.F.map((f) => f.k + '=' + f.v)) : ''; if (d && d.ok && d.F.length >= 2 && sig === prev) return d; prev = sig; await sleep(500 * SC); } return d; }
  /* (y24qty1) 먼저 화면의 길 이동으로 · 안 되면 칸 누르기 */
  async function routeDet(h, no) { let href0 = ''; try { href0 = await o.ev('location.href'); } catch (e) {} let x = null;
    for (let k = 0; k < 8; k++) { x = await o.ev(JS_ROUTE(h.r, no)); if (x && (x.ok || x.bad)) break; await sleep(600 * SC); }
    if (!x || !x.ok) return { no: true, bad: !!(x && x.bad), why: (x && x.why) || '길 이동 못 함' };
    let href = href0; for (let k = 0; k < 20; k++) { await sleep(400 * SC); try { href = await o.ev('location.href'); } catch (e) {} if (href !== href0) break; }
    if (href === href0) return { no: true, why: `길 ${x.name}로 옮겼지만 화면 주소가 그대로` };
    await sleep(1200 * SC); let d = null; for (let k = 0; k < 10; k++) { d = await readDet(no); if (!d || d.login || !d.ok) break; if (d.F.some((f) => f.vis && QTY_LABEL.test(f.l) && String(f.v).trim() !== '')) break; await sleep(800 * SC); } /* 같은 탭 길 이동은 칸 틀이 먼저 그려지고 값이 나중에 옴 — 재고수량 값이 찰 때까지(8초) */
    if (d && d.login) return { login: true }; if (!d || !d.ok) return { err: '[상세수정] 화면을 못 읽음', url: href };
    return { d, url: href, how: `화면 길 이동(${x.name} · ${x.from})`, route: true }; }
  async function openDet(h, no) { const rd0 = await routeDet(h, no); if (!rd0.no) return rd0; if (rd0.bad) return { err: rd0.why };
    const c = await o.ev(JS_UBCELL(h.r)); if (!c || !c.ok) return { err: `${(c && c.why) || "'상세수정' 칸 자리를 못 셈"} · 길 이동도 안 됨(${rd0.why})` };
    await o.ev(JS_OPEN_HOOK); let href0 = ''; try { href0 = await o.ev('location.href'); } catch (e) {} let g = null;
    try { await o.inp.click(c.x, c.y); for (let k = 0; k < 12; k++) { await sleep(400 * SC); g = await o.ev(JS_OPEN_GET); if (g && (g.u.length || g.href !== href0 || g.pop.length)) break; } } finally { await o.ev(JS_OPEN_UNHOOK).catch(() => {}); }
    let url = '', how = ''; if (g && g.u.length) { let U = null; try { U = new URL(g.u[0], o.BASE + '/'); } catch (e) { U = null; } const B0 = new URL(o.BASE + '/'); if (!U || U.origin !== B0.origin) return { err: `[상세수정]이 여는 주소가 예스24 판매관리 밖(${String(g.u[0]).slice(0, 60)}) — 열지 않음` }; url = U.href; how = '새 창 주소를 같은 탭으로'; await o.nav(url, 30); }
    else if (g && g.href !== href0) { url = g.href; how = '같은 탭으로 넘어감'; }
    else if (g && g.pop.length) { await o.ev(JS_POP_CLOSE).catch(() => {}); return { err: `[상세수정]이 화면 안 상자(${g.pop[0]})로 열림 — 그 꼴은 아직 모름(원문만 남김)`, pop: g.pop }; }
    else return { err: '[상세수정]을 눌러도 아무 화면도 안 열림' };
    await sleep(1200 * SC); const d = await readDet(no); if (d && d.login) return { login: true }; if (!d || !d.ok) return { err: '[상세수정] 화면을 못 읽음', url, how };
    return { d, url, how }; }
  const fMap = (F) => Object.fromEntries((F || []).map((f) => [f.k, f]));
  /* 두 번 읽은 칸 견주기 — 바뀐 칸 열쇠들(저절로 바뀌는 날짜 칸·숨은 칸은 뺌 · 칸이 생기거나 없어져도 바뀐 것으로) */
  const fDiff = (A, B) => { const a = fMap(A), b = fMap(B); const out = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k], y = b[k]; const f = x || y; if (f.t === 'hidden' || IGN_LABEL.test(f.l || '')) continue; if (!x || !y || x.v !== y.v) out.push(k); } return out; };
  async function detQty(j, r, h, before, what) { const failP = (msg, todo, x) => ({ state: 'fail', pre: true, msg: `${msg} — 아무것도 저장하지 않음`, before, todo: todo || '예스24 판매관리 › 등록상품 관리 › 그 상품 [상세수정]에서 손으로 고친 뒤 「✓ 예스24에서 고쳤음」 · 리드나우 방에 알려 주세요(원문은 남김)', ...(x || {}) });
    j.step = `${r.no} [상세수정] 화면 여는 중`; const D = await openDet(h, r.no); if (D.login) return { state: 'login' };
    if (D.err) { saveDet({ err: D.err, url: D.url || null, pop: D.pop || null }); return failP(D.err); }
    const d = D.d; saveDet({ url: d.url, how: D.how, F: d.F.slice(0, 90).map(fStr), B: d.B, H: d.H, api: d.api, hasNo: d.hasNo, no: r.no });
    if (!d.hasNo) return failP(`[상세수정] 화면에서 상품번호 ${r.no}를 못 봄(그 상품 화면인지 확인 못 함)`);
    const Q = d.F.filter((f) => f.vis && !f.dis && !f.ro && /^(text|number|tel)$/.test(f.t) && QTY_LABEL.test(f.l)); if (Q.length !== 1) return failP(`[상세수정] 화면에서 재고수량 칸을 하나로 못 찾음(${Q.length}개 · 칸 라벨 ${d.F.filter((f) => f.vis).map((f) => f.l).filter(Boolean).slice(0, 12).join('·')})`);
    const q = Q[0]; if (String(+q.v) !== String(+h.qty)) return failP(`[상세수정] 화면 재고수량(${q.v})이 등록상품 목록 값(${h.qty})과 달라 고치지 않음`);
    const SB = d.B.filter((t) => SAVE_RE.test(t)); if (SB.length !== 1) return failP(`[상세수정] 화면에서 저장 단추를 하나로 못 찾음(단추 ${d.B.slice(0, 12).join('·')})`);
    if (o.holdOn()) return { state: 'hold' };
    j.step = `${r.no} [상세수정] 재고수량 칸 고치는 중`; const p = await o.ev(JS_KPOS(q.k)); if (!p || !p.ok) return failP('[상세수정] 재고수량 칸 자리를 못 셈');
    await o.inp.click(p.x, p.y); await sleep(300 * SC); await o.ev(JS_KSEL(q.k)); await o.inp.text(String(to(r))); await sleep(300 * SC); await o.ev(JS_KBLUR(q.k)); await sleep(600 * SC);
    const d1 = await o.ev(JS_DET(r.no), 15000); const df1 = d1 && d1.ok ? fDiff(d.F, d1.F) : null; const v1 = d1 && d1.ok ? (fMap(d1.F)[q.k] || {}).v : null;
    if (!(df1 && df1.length === 1 && df1[0] === q.k && String(v1) === String(to(r)))) { try { await o.nav(o.BASE + PG + '?t=' + now(), 30); } catch (e) {} return failP(`[상세수정]에 ${to(r)}을 넣은 뒤 다시 읽으니 재고수량 칸만 바뀐 것이 아님(바뀐 칸 ${df1 ? df1.slice(0, 6).join('·') || '없음' : '못 읽음'} · 재고수량 ${v1 == null ? '?' : v1})`); }
    j.st = 'click'; j.at1 = r.rid; j.step = `${r.no} [상세수정] 저장 누름`; saveQ(); R.phase = 'qty'; const c = await o.ev(JS_DETSAVE); if (!c || !c.ok) { R.phase = ''; j.st = 'run'; saveQ(); return failP((c && c.why) || '[상세수정] 저장 단추를 못 누름'); }
    await msgPop(); await sleep(2500 * SC); R.phase = ''; const dl = R.dlg.slice(-2).join(' / ');
    j.step = `${r.no} [상세수정] 화면 다시 열어 확인`; let d2 = null; try { if (D.route) { const a2 = await look(r); const h2 = a2 && a2.hit && a2.hit.length === 1 ? a2.hit[0] : null; const D2 = h2 ? await routeDet(h2, r.no) : null; d2 = D2 && D2.d ? D2.d : null; } else { await o.nav(D.url, 30); await sleep(1000 * SC); d2 = await readDet(r.no); } } catch (e) { d2 = null; } /* (y24qty1) 길 이동으로 연 화면은 주소만으로 다시 못 열 수 있어(길 params) 목록에서 같은 길로 다시 엶 */
    j.step = `${r.no} 등록상품 목록 다시 읽어 확인`; let b = null; try { b = await look(r); } catch (e) { b = { err: String(e.message || e).slice(0, 100) }; } j.st = 'run'; saveQ();
    const after = b && b.hit && b.hit.length === 1 ? vOf(b.hit[0]) : null; const df2 = d2 && d2.ok ? fDiff(d.F, d2.F) : null; const v2 = d2 && d2.ok ? (fMap(d2.F)[q.k] || {}).v : null;
    R.rec.det.post = { at: now(), save: c.t, dlg: R.dlg.slice(-3).map((m) => String(m).slice(0, 80)), diff: df2 ? df2.slice(0, 10) : null, v: v2 == null ? null : String(v2).slice(0, 10), list: after ? vTxt(after) : null }; saveRec();
    const keep = after && before && after.price === before.price && after.st === before.st && String(after.dts) === String(before.dts);
    if (after && +after.qty === +to(r) && df2 && df2.length === 1 && df2[0] === q.k && keep) return { state: 'done', msg: `${what} — [상세수정]에서 재고수량만 고쳐 저장 · 등록상품 목록과 [상세수정] 화면을 다시 읽어 확인(${vTxt(before)} → ${vTxt(after)} · 판매가·판매기간·상태·다른 칸 그대로)${dl ? ' · 예스24 알림: ' + dl : ''}`, before, after, how: 'detail' };
    if (after && JSON.stringify(after) === JSON.stringify(before) && df2 && df2.length === 0) return { state: 'fail', pre: true, same: true, msg: `[상세수정]에서 저장을 눌렀지만 ${dl ? '예스24가 저장했다는 말 없이(' + dl.slice(0, 60) + ')' : '아무 물음·알림도 없이'} 목록·[상세수정] 화면 값이 그대로 ${vTxt(after)}(바라는 값 ${what}) — 저장되지 않음`, before, after, todo: '🛠 처리할 일에서 다시 맡기기 · 되풀이되면 리드나우 방이 [상세수정] 원문을 보고 고침' };
    return { state: 'unsure', msg: `[상세수정]에서 저장을 누른 뒤 다시 읽으니 바라던 꼴이 아님(목록 ${after ? vTxt(after) : '못 읽음'} · [상세수정] 바뀐 칸 ${df2 ? df2.slice(0, 6).join('·') || '없음' : '못 읽음'})${dl ? ' — 예스24 알림: ' + dl : ''}`, before, after, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품의 수량·판매가·판매기간을 보고, 다르면 손으로 바로잡은 뒤 「✓ 예스24에서 고쳤음」(다시 누르지 않고 멈춤)' }; }
  const to = (r) => +r.to;
  async function msgPop() { let seen = ''; for (let k = 0; k < 10; k++) { await sleep(500 * SC); let m = null; try { m = await o.ev(JS_MSGPOP(true), 8000); } catch (e) { m = null; } if (!m || m.none) { if (seen) break; continue; }
      if (m.t && m.t !== seen) { seen = m.t; R.dlg.push('화면 상자: ' + m.t + (m.bt && m.bt.length ? ' [' + m.bt.join('|') + ']' : '') + (m.did ? ' → [확인] 누름' : m.bad ? ' → 위험한 말이라 안 누름' : '')); note(`🟦 예스24 쓰기 — 화면 안 상자: ${m.t.slice(0, 80)}${m.did ? ' → [확인] 누름' : ''}`); } if (!m.did) break; } return seen; }
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
    if (f.n > 0 && !(R.rec.grid && now() - (+R.rec.grid.at || 0) < 6 * 3600e3)) { try { const g = await o.ev(JS_GRID); if (g && g.ok) { R.rec.grid = { at: now(), n: g.n, keys: g.keys, cols: g.cols, opt: g.opt, probe: (R.rec.grid && R.rec.grid.probe) || null }; saveRec(); } } catch (e) {} }
    if (f.n > 0 && R.rec.grid && !(R.rec.grid.probe && R.rec.grid.probe.v === 1)) { try { const p = await o.ev(JS_PROBE, 15000); if (p && p.ok) { R.rec.grid.probe = { v: 1, at: now(), url: p.url, cols: p.cols, M: p.M, cbs: p.cbs }; saveRec(); note(`🔬 예스24 등록상품 표·화면 함수 읽음(누르지 않음) — 칸 ${p.cols.length} · 함수 ${p.M.length} · 표 이벤트 ${p.cbs.length}`); } } catch (e) {} } /* (y24re 0.1.54) 한 번만 — 수량을 바꾸는 사람의 길 원문 */
    if (f.n > 0 && R.rec.grid && !(R.rec.grid.probe2 && R.rec.grid.probe2.v === 2)) { try { const p = await o.ev(JS_PROBE2, 15000); if (p && p.ok) { R.rec.grid.probe2 = { v: 2, at: now(), url: p.url, c: p.c, src: p.src, data: p.data }; saveRec(); note(`🔬 예스24 등록상품 화면 함수 원문 둘째 읽음(누르지 않음) — 구성 요소 ${p.c.length} · 함수 글 ${p.src.length} · 판매상태 창 칸 ${p.data.length}`); } } catch (e) {} } /* (y24re8) */ return f; }
  const vOf = (h) => (h ? { qty: h.qty, st: h.st, stNm: h.stNm, price: h.price == null ? null : +h.price, dts: h.dts == null ? null : String(h.dts) } : null); /* (y24re8) dts = 판매시작일/판매종료일(SALE_DTS) — 수량·판매중지 뒤 판매기간이 그대로인지 봄 */
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
    if (o.holdOn()) return { state: 'hold' }; R.dlg = []; R.qhow = '';
    if (r.kind === 'qty' && o.inp && o.inp.click) { let ce = null; try { ce = await o.ev(JS_COLED(h.kQ)); } catch (e) { ce = null; } if (ce === false) return await detQty(j, r, h, before, what); } /* (y24re8) 표가 재고수량 칸을 못 고치게 한 상품(실제 예스24 REM_CNT editable 0) → [상세수정] 화면 길 */
    if (r.kind === 'qty' || r.kind === 'price') { const pr = r.kind === 'price'; j.step = `${r.no} ${pr ? '판매가' : '재고수량'} 칸 고치는 중`; const e = pr ? await o.ev(JS_PRICE(h.r, h.kP, r.to)) : (o.inp ? await humanQty(h, r.to) : await o.ev(JS_QTY(h.r, h.kQ, r.to))); /* (y24re 0.1.55) 수량은 사람처럼 더블 클릭·글자·Enter */
      if (!pr && e && e.lock) return { state: 'fail', pre: true, lock: true, msg: `${e.why} — 아무것도 누르지 않음(값을 억지로 넣어 저장하면 예스24가 '경고'를 띄우고 저장하지 않음)`, before, todo: '이 상품은 표에서 수량을 못 바꿈 — [상세수정] 화면 길이 필요(리드나우 방이 원문을 보고 만듦)' };
      if (pr && e && e.lock) return { state: 'fail', pre: true, lock: true, msg: '등록상품 관리 표에서 판매가 칸을 고칠 수 없게 돼 있음 — 아무것도 누르지 않음', before, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품을 열어 손으로 판매가를 고친 뒤 「✓ 예스24에서 고쳤음」(다른 길은 리드나우 방이 원문을 보고 만듦)' }; if (!e || !e.ok) return { state: 'fail', pre: true, msg: `${(e && e.why) || (pr ? '판매가' : '재고수량') + ' 칸을 못 고침'} — 저장하지 않음`, before, todo: '예스24 판매관리에서 손으로 고친 뒤 「✓ 예스24에서 고쳤음」' }; R.qhow = pr ? '' : ` · 칸 고침 ${e.how || '?'} · 줄 상태 ${e.rs == null ? '?' : e.rs} · 칸 고칠 수 있음 ${e.ce == null ? '?' : e.ce ? '예' : '아니오'}`; /* (y24re) */
      await sleep(800 * SC); j.st = 'click'; j.at1 = r.rid; j.step = `${r.no} [수정항목 저장] 누름`; saveQ(); R.phase = 'qty'; const c = await o.ev(JS_BTN('수정항목 저장')); if (!c || !c.ok) { R.phase = ''; j.st = 'run'; saveQ(); return { state: 'fail', pre: true, msg: `${(c && c.why) || '[수정항목 저장]을 못 누름'} — 아무것도 저장되지 않음`, before, todo: '예스24 판매관리에서 손으로' }; } await msgPop(); }
    else { j.step = `${r.no} 줄 고르는 중`; const c1 = await o.ev(JS_CHECK(h.r)); if (!c1 || !c1.ok) return { state: 'fail', pre: true, msg: `${(c1 && c1.why) || '줄을 못 고름'} — 아무것도 누르지 않음`, before, todo: '예스24 판매관리에서 손으로' };
      const c2 = await o.ev(JS_BTN('판매상태/기간 변경')); if (!c2 || !c2.ok) return { state: 'fail', pre: true, msg: `${(c2 && c2.why) || '[판매상태/기간 변경]을 못 누름'} — 아무것도 바뀌지 않음`, before, todo: '예스24 판매관리에서 손으로' };
      let pk = null; for (let k = 0; k < 20; k++) { await sleep(300 * SC); pk = await o.ev(JS_POP_PICK(ST_CODE[r.kind])); if (pk && (pk.ok || !pk.wait)) break; }
      if (!pk || !pk.ok) { await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: `${(pk && pk.why) || '판매상태 창이 안 뜸'}${R.dlg.length ? ' — 예스24 알림: ' + R.dlg.slice(-1)[0] : ''} — [변경]은 누르지 않음`, before, todo: '예스24 판매관리에서 손으로' }; }
      R.rec.pop = { v: 1, at: now(), no: r.no, kind: r.kind, b: pk.ds || null, txt: pk.txt || '' }; saveRec(); /* (y24re8) 판매상태 창 원문(체크·기간 칸·고른 기간 단추) */
      if (pk.date) { j.step = `${r.no} 창의 '기간변경' 체크 끄는 중`; const u = await o.ev(JS_POP_UNDATE); await sleep(500 * SC); const a2 = await o.ev(JS_POP_DATE); const b0 = pk.ds || {}, a0 = (a2 && a2.ds) || {}; R.rec.pop.a = a0; R.rec.pop.u = u ? { ok: !!u.ok, why: u.why || null, auto: !!u.auto } : null; saveRec(); /* (y24qty1 · HOME 11/14 01:17·01:19 원문 pop: 판매중지를 고르면 예스24 창이 '기간변경'을 스스로 끄고 잠금(dis·꺼짐) — 0.1.56은 그것을 '잠겨 끌 수 없음'으로 보고 멈췄음 → 꺼진 채 잠긴 것은 바라는 꼴(판매기간 안 바뀜)이라 그대로 · 켜진 채 잠긴 것만 멈춤 · 창 자료 changeDateYn이 'Y'면 멈춤) */
        if (!(u && u.ok && a2 && a2.ok && a0.on === false && a0.cy !== 'Y' && a0.dv === b0.dv && a0.act === b0.act)) { await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: `창의 '기간변경'이 켜진 채 열렸는데 ${u && !u.ok ? u.why : `끈 뒤 다시 읽으니 그대로가 아님(체크 ${a0.on ? '켜짐' : '꺼짐'} · 판매종료일 '${b0.dv || ''}'→'${a0.dv || ''}' · 기간 단추 '${b0.act || ''}'→'${a0.act || ''}')`} — 판매기간을 건드리지 않으려고 멈춤 · [변경]은 누르지 않음`, before, todo: '예스24 판매관리에서 손으로 · 리드나우 방에 알려 주세요(창 원문은 남김)' }; } }
      await sleep(600 * SC); j.st = 'click'; j.at1 = r.rid; j.step = `${r.no} [변경] 누름`; saveQ(); R.phase = 'state'; const c3 = await o.ev(JS_POP_GO); if (!c3 || !c3.ok) { R.phase = ''; j.st = 'run'; saveQ(); await o.ev(JS_POP_CLOSE).catch(() => {}); return { state: 'fail', pre: true, msg: `${(c3 && c3.why) || '[변경]을 못 누름'} — 아무것도 바뀌지 않음`, before, todo: '예스24 판매관리에서 손으로' }; } await msgPop(); }
    /* 이 줄 뒤로는 다시 누르지 않음 — 목록을 새로 읽어 확인만 */
    await sleep(2500 * SC); R.phase = ''; await o.ev(JS_POP_CLOSE).catch(() => {}); const dl = R.dlg.slice(-2).join(' / ');
    j.step = `${r.no} 등록상품 목록 다시 읽어 확인`; let b = null; try { b = await look(r); } catch (e) { b = { err: String(e.message || e).slice(0, 100) }; }
    j.st = 'run'; saveQ();
    if (!b || b.login || b.err || !b.hit || b.hit.length !== 1) return { state: 'unsure', msg: `눌렀지만 다시 읽어 확인하지 못함(${b && b.login ? '로그인 풀림' : (b && b.err) || '줄을 하나로 못 찾음'})${dl ? ' — 예스24 알림: ' + dl : ''}`, before, todo: '예스24 판매관리 › 등록상품 관리에서 바뀌었는지 보고, 바뀌었으면 「✓ 예스24에서 고쳤음」 · 안 바뀌었으면 손으로' };
    const after = vOf(b.hit[0]);
    if (isDone(r, after) && (r.kind === 'stop' || r.kind === 'start') && before && before.dts != null && String(after.dts) !== String(before.dts)) return { state: 'unsure', msg: `${what}는 됐지만 판매기간이 바뀜(${before.dts} → ${after.dts})${dl ? ' — 예스24 알림: ' + dl : ''}`, before, after, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품의 판매기간을 보고 손으로 바로잡은 뒤 「✓ 예스24에서 고쳤음」(다시 누르지 않고 멈춤)' }; /* (y24re8) */
    if (isDone(r, after)) return { state: 'done', msg: `${what} — 등록상품 목록에서 확인(${vTxt(before)} → ${vTxt(after)})${dl ? ' · 예스24 알림: ' + dl : ''}`, before, after };
    if (!/저장\s*되었|수정\s*되었|완료\s*되었|처리\s*되었/.test(dl) && before && JSON.stringify(vOf(before)) === JSON.stringify(after)) return { state: 'fail', pre: true, same: true, msg: `눌렀지만 예스24가 ${dl ? '저장했다는 말 없이(' + dl.slice(0, 60) + ')' : '아무 물음·알림도 안 띄웠고'} 등록상품 목록 값도 그대로 ${vTxt(after)}(바라는 값 ${what}) — 저장되지 않음${R.qhow || ''}`, before, after, todo: '🛠 처리할 일에서 다시 맡기기(값을 정해 넣는 일이라 다시 해도 겹치지 않음)' }; /* (11/13 home2) 예스24가 물음·알림을 하나도 안 띄우고(저장 확인 없음) 값도 그대로 = 저장이 안 된 것 — 멈추지 않음(예전엔 '확실하지 않음'으로 쓰기를 멈춰 사람 손이 필요했음) · '저장되었습니다' 알림이 떴는데 그대로면 예전처럼 확실하지 않음·멈춤 */
    return { state: 'unsure', msg: `눌렀지만 등록상품 목록 값이 ${vTxt(after)}(바라는 값 ${what})${dl ? ' — 예스24 알림: ' + dl : ''}${R.qhow || ''}`, before, after, todo: '예스24 판매관리 › 등록상품 관리에서 그 상품을 보고 손으로 고친 뒤 「✓ 예스24에서 고쳤음」(다시 누르지 않고 멈춤)' }; }
  function end(j, res) { j.st = 'end'; R.q.res[j.id] = { ...res, at: now(), dlg: R.dlg.slice(-4) };
    { const hs = Array.isArray(R.rec.hist) ? R.rec.hist : []; for (const r of j.rows) { const x = (res.rows || {})[r.rid] || {}; hs.unshift({ at: now(), job: j.id, no: r.no, kind: r.kind, fill: r.fill ? 1 : 0, st: x.state || res.state, fillSt: x.fill ? x.fill.state : null, msg: String(x.msg || res.msg || '').slice(0, 220), dlg: R.dlg.slice(-2).map((m) => String(m).replace(/\d{6,}/g, '#').slice(0, 60)) }); } R.rec.hist = hs.slice(0, 20); saveRec(); } /* (11/11 y24ops3) 줄마다 결과를 이 PC에 20개까지 — 웹앱이 결과를 받아 지워도(ack) 첫 실행이 어땠는지 남음 */ R.q.jobs = R.q.jobs.filter((x) => x.id !== j.id); saveQ(); R.cur = null; R.phase = ''; R.msg = `${res.state === 'done' ? '✅' : res.state === 'unsure' ? '⚠' : '⛔'} 예스24 쓰기 ${j.rows.length}건: ${res.msg || res.state}`; note(R.msg); return res; }
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
