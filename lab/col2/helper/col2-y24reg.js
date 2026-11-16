/* col2-y24reg.js — 🟦 예스24 자동 올림(대량 등록 엑셀 업로드를 사람 손 없이) — 정범님 11/10 밤 '알라딘에 등록하고 또 다른 절차를 거쳐서 예스24에 등록하는 품을 또 들이라는 거야?'
 * 길(사방넷·플레이오토 같은 통합 솔루션의 '상품 하나 등록 → 판매처 여러 곳 자동 전송'과 같은 생각 · 마스터 = 알라딘):
 *   웹앱(이 PC 브라우저)이 알라딘에 올라간(live) 상품 중 '🟦 예스24도'인 것을 골라 올림 장부(app_settings/y24_reg)에 먼저 적고(되풀이 0)
 *   → 엑셀(바코드용 대량 등록 양식 · 웹앱이 만든 그대로)과 줄 목록을 이 도우미에 맡김(POST /y24/reg/put · 127.0.0.1:8797 · 이 PC 안에서만)
 *   → 이 도우미가 예스24 숨은 크롬(로그인 세션 그대로)에서 상품관리 › 대량 등록(엑셀 업로드) 화면을 열고
 *      ① [바코드] 고름 ② 파일 칸에 그 엑셀을 넣음(DevTools 프로토콜 DOM.setFileInputFiles — 파일 고르기 창을 열지 않음)
 *      ③ 미리보기 목록에 우리 줄(ISBN)이 보이는지 확인 ④ [등록] 한 번(이 일 동안만 그 확인 물음에 '예') ⑤ '등록 완료' 창의 판매중·미출간 수를 읽음
 *      ⑥ 등록상품 관리 목록(조회 모양 그대로 · 읽기만)을 다시 읽어 판매자상품코드(자체코드) = 우리 SKU 인 줄이 생겼는지 확인
 *   → 결과(예스24 상품번호·까닭)를 웹앱이 받아(GET /y24/reg/state) 장부에 적음 · 이 도우미는 Firestore에 아무것도 쓰지 않음(쓰기 막이 col2_* 그대로)
 * 근거(화면 원문): readnow-chats reports/yes24_raw DOC_product_bulkregistrationbyexcel(11/07) — 라디오 바코드(01)/상품번호(02) · [엑셀파일 업로드](숨은 input[type=file]) · 미리보기 표 #productGrid · [등록] · '등록 완료' 창 '총 N개의 상품이 판매중으로/미출간으로 등록되었습니다'
 *                  DOC_product_bulkregistrationlist — '자동 로그아웃 문제가 있으니 상품은 20~30건 가량으로 끊어서 등록' · '상품 등록은 총 500,000개까지'
 * 지킴: 같은 상품·같은 SKU 두 번 안 올림(이 PC 기록 y24-reg.json — 웹앱 장부와 겹쳐 두 겹) · 처음 성공(목록에서 확인)이 없으면 1건짜리 맡김만 받음 · 한 번에 30줄 넘게 안 받음
 *       로거 PC·MJ-MAIN에서는 안 함 · 🚚 출고 중(이 PC 출고 보호)엔 기다림 · 로그인이 풀려 있으면 기다림(누르기 전에만) · [등록]을 누른 뒤 결과가 흐리면 '확실하지 않음'으로 멈춤(다시 누르지 않음)
 *       누르는 단추는 [바코드] 라디오·[등록]·완료 창 [×]뿐 — 상품삭제·판매상태 변경 등 다른 단추는 안 누름 */
'use strict';
const fs = require('fs'), path = require('path');
const PG = '/Product/BulkRegistrationByExcel';
const ID_RE = /^[\w.:-]{3,120}$/;
const GRADES = ['최상', '상', '중', '하'];
const MAXN = 30; /* 예스24 권장 20~30건(자동 로그아웃) — 웹앱은 기본 25건씩 */
const BAD_DLG = /삭제|취소|출금|판매\s*중지|판매\s*불가|탈퇴|반품|환불/;
/* (r1116-y24reg) EAN-13 바코드 검사(ISBN이 없는 음반·블루레이 — 웹앱 y24RegEan과 같음 · 바꾸지 않고 맞는지만) */
const ean13 = (v) => { const s = String(v == null ? '' : v).replace(/[\s-]/g, ''); if (!/^\d{13}$/.test(s)) return ''; let t = 0; for (let i = 0; i < 12; i++) t += +s[i] * (i % 2 ? 3 : 1); return (10 - (t % 10)) % 10 === +s[12] ? s : ''; };
/* 맡김 검사(순수 셈 · 시험 t_y24reg가 직접 부름) — rec = 이 PC 기록 { ok1, lid:{}, sku:{} } */
function checkJob(j, rec) { if (!j || !ID_RE.test(String(j.id || ''))) return '맡김 이름표가 이상함'; const R = Array.isArray(j.rows) ? j.rows : []; if (!R.length) return '올릴 줄이 없음'; if (R.length > MAXN) return `한 번에 ${MAXN}줄까지(예스24 권장 20~30건씩) — ${R.length}줄`;
  if (!(rec && rec.ok1) && R.length > 1) return '처음 한 건이 예스24 목록에서 확인되기 전에는 1건짜리 맡김만 받음';
  const seenL = new Set(), seenS = new Set();
  for (const r of R) { if (!r || !ID_RE.test(String(r.lid || ''))) return '줄 이름(lid)이 이상함'; if (r.bc != null && r.bc !== '') { if (!ean13(r.bc)) return `바코드가 이상함(${r.lid})`; } else if (!/^(97[89]\d{10}|\d{9}[\dXx])$/.test(String(r.isbn || ''))) return `ISBN이 이상함(${r.lid})`; if (!GRADES.includes(r.grade)) return `등급이 이상함(${r.lid})`;
    if (!(Number.isInteger(+r.price) && +r.price >= 100 && +r.price <= 5e6)) return `판매가가 이상함(${r.lid})`; if (+r.qty !== 1) return `자동 올림은 수량 1권만(${r.lid})`; const sk = String(r.self || '').split(',').filter(Boolean); if (!sk.length) return `자체코드(SKU) 없음(${r.lid})`;
    if (seenL.has(r.lid) || (rec && rec.lid && rec.lid[r.lid])) return `같은 상품을 이미 올림(${r.lid}) — 되풀이 0`; for (const s of sk) { if (seenS.has(s) || (rec && rec.sku && rec.sku[s])) return `같은 SKU를 이미 올림(${s}) — 되풀이 0`; seenS.add(s); } seenL.add(r.lid); }
  if (!/^[A-Za-z0-9+/=]{40,}$/.test(String(j.xlsx || '')) || String(j.xlsx).length > 3e6) return '엑셀 파일이 없거나 너무 큼'; return ''; }
/* '등록 완료' 창 글 → { sale, unpub } (원문: '총 0개의 상품이 판매중으로 등록되었습니다.' · '총 0개의 상품이 미출간으로 등록되었습니다.') */
function doneCounts(t) { t = String(t || '').replace(/\s+/g, ' '); const a = t.match(/총\s*([\d,]+)\s*개의\s*상품이\s*판매중으로/); const b = t.match(/총\s*([\d,]+)\s*개의\s*상품이\s*미출간으로/); if (!a && !b) return null; const n = (m) => (m ? +m[1].replace(/,/g, '') : 0); return { sale: n(a), unpub: n(b) }; }
/* 등록상품 목록 줄 → 우리 줄과 짝(자체코드 = SKU) — rows: [{lid,self}] · list: [{no,self,ean}] → { lid: no } */
function matchList(rows, list) { const out = {}; for (const r of rows || []) { const sk = String(r.self || '').split(',').filter(Boolean); const hit = (list || []).find((x) => String(x.self || '').split(/[,\s]+/).filter(Boolean).some((s) => sk.includes(s))); if (hit) out[r.lid] = String(hit.no || ''); } return out; }

/* 화면 쪽 짧은 코드 */
const JS_PICK_BARCODE = `(()=>{const r=[...document.querySelectorAll('input[type=radio]')].find((x)=>x.value==='01'&&/바코드/.test((x.closest('div')||{}).innerText||''));if(!r)return{ok:false,why:'[바코드] 고르기 칸이 없음'};if(!r.checked){const lb=document.querySelector('label[for="'+r.id+'"]');(lb||r).click()}return{ok:r.checked||true}})()`;
/* (y24first1 11/14 · HOME 20:50 첫 자동 올림 'y24a261114114548rni' — 엑셀은 들어갔는데 「미리보기 목록에 우리 줄이 안 보임」으로 멈춤) 미리보기 표 #productGrid는 RealGrid(그림으로 그리는 표)라 칸 글이 화면 글(innerText)에 없음
 *  → 화면 글에서 못 찾으면 표 자료(RealGrid GridView.getDataSource().getJsonRow — 등록상품 표 읽기 col2-y24w.js와 같은 찾기)의 칸 값에서 ISBN을 찾음 · 줄 수·칸 이름·오류 칸 글(진단용 · 값 짧게)도 돌려줌 · 누르는 것 없음(읽기만) */
const JS_PREVIEW = (isbns) => `(()=>{const g=document.getElementById('productGrid');const t=(g?g.innerText:document.body.innerText)||'';const I=${JSON.stringify(isbns)};const S=new Set(I.filter((i)=>t.includes(i)));
const isGV=(x)=>{try{return !!x&&typeof x==='object'&&typeof x.getDataSource==='function'&&typeof x.getItemIndex==='function'}catch(e){return false}};let gv=null;try{if(g&&window.RealGrid&&typeof RealGrid.getGridInstance==='function'){const x=RealGrid.getGridInstance(g)||RealGrid.getGridInstance('productGrid');if(isGV(x))gv=x}}catch(e){}
for(let el=g;el&&!gv;el=el.parentElement){for(let v=el.__vue__,d=0;v&&!gv&&d<6;v=v.$parent,d++){for(const k of Object.keys(v)){let x=null;try{x=v[k]}catch(e){}if(isGV(x)){gv=x;break}}}}
let n=null,keys=[],err=[];try{if(gv){const ds=gv.getDataSource();n=+ds.getRowCount()||0;for(let r=0;r<n&&r<300;r++){const o=ds.getJsonRow?ds.getJsonRow(r):null;if(!o)continue;if(!keys.length)keys=Object.keys(o).slice(0,40);const vals=Object.values(o).map((x)=>String(x==null?'':x));const hit=I.filter((i)=>vals.some((v)=>v.replace(/[^0-9Xx]/g,'')===i||v.includes(i)));hit.forEach((i)=>S.add(i));for(const k of Object.keys(o)){if(/ERR|MSG|RSLT|RESULT|REMARK|CHK|VALID|FAIL/i.test(k)&&o[k]!=null&&o[k]!==''&&err.length<6)err.push(k+'='+String(o[k]).replace(/\\s+/g,' ').slice(0,80))}}}}catch(e){err.push('표 읽기 오류 '+String(e&&e.message||e).slice(0,60))}
const empty=/조회된 데이터가 없습니다/.test(t)&&!S.size&&!n;const pop=[...document.querySelectorAll('.layerPop,.modal')].filter((x)=>x.offsetParent!==null||getComputedStyle(x).display!=='none').map((x)=>x.innerText.replace(/\\s+/g,' ').slice(0,200)).filter((s)=>s&&!/등록 완료/.test(s));const iv=[...document.querySelectorAll('input,textarea,select')].map((x)=>String(x.value||'')).filter((v)=>/\\d{9,}/.test(v)).slice(0,10);const inv=I.filter((i)=>iv.some((v)=>v.includes(i))).length;const fi=document.querySelector('input[type=file]');const fv=fi&&fi.files?[...fi.files].map((f)=>f.name).join(','):null;return{seen:S.size,empty,pop,grid:!!gv,n,keys,err,inv,txt:t.replace(/\\s+/g,' ').slice(0,300),gid:!!g,fv,btn:[...document.querySelectorAll('button,a.btn,input[type=button]')].filter((b)=>b.offsetParent!==null).map((b)=>(b.innerText||b.value||'').trim()).filter(Boolean).slice(0,20)}})()`;
const JS_CLICK_REG = `(()=>{const vis=(b)=>{try{return b.offsetParent!==null}catch(e){return false}};const L=[...document.querySelectorAll('button')].filter((b)=>(b.innerText||'').trim()==='등록'&&vis(b)&&!b.disabled);const b=L.find((x)=>x.closest('.btnarea_wrap_btm'))||(L.length===1?L[0]:null);if(!b)return{ok:false,why:'[등록] 단추를 하나로 못 찾음('+L.length+'개)'};b.click();return{ok:true}})()`;
const JS_DONE = `(()=>{const P=[...document.querySelectorAll('.layerPop')].filter((x)=>getComputedStyle(x).display!=='none'&&/등록\\s*완료/.test(x.innerText||''));return P.length?{txt:P[0].innerText.replace(/\\s+/g,' ').slice(0,400)}:null})()`;
const JS_CLOSE = `(()=>{const P=[...document.querySelectorAll('.layerPop')].find((x)=>getComputedStyle(x).display!=='none'&&/등록\\s*완료/.test(x.innerText||''));const c=P&&P.querySelector('button.close');if(c)c.click();return !!c})()`;

/* (y24reg3 11/17 · 0.1.72) HOME 21:40Z 블루레이 묶음 — 엑셀을 넣었는데 미리보기 표 0줄(11/14 ISBN 책도 같은 자리) → 파일 넣기를 살핌(읽기·고르기만 · 누르는 단추는 그대로)
 *  JS_MARK_FILE: 화면의 input[type=file]을 모두 적음(accept·숨김·곁 글) · [엑셀파일 업로드] 단추 곁 칸에 data-rn-up 표시(예스24 원문: b-button '엑셀파일 업로드' → $refs.excelUpload.click() · 바로 뒤 input ref=excelUpload hidden)
 *   · 그 칸의 화면 부품(Vue · clickExcelImport가 있는 것)을 찾아 엑셀 읽기(getExcelDataToJson)를 '그대로 지나가게' 감싸 몇 줄 읽었는지·칸 이름·빈 칸 이름만 적음(값은 안 적음) · change가 몇 번 왔는지 셈 */
const JS_MARK_FILE = `(()=>{const F=[...document.querySelectorAll('input[type=file]')];const tx=(e)=>e?String(e.innerText||e.value||e.textContent||'').replace(/\\s+/g,' ').trim():'';
const B=[...document.querySelectorAll('button,a,label,input[type=button]')].find((b)=>/엑셀\\s*파일\\s*업로드/.test(tx(b))&&!/다운로드/.test(tx(b))&&tx(b).length<30);let pick=-1,how='';
if(B&&B.tagName==='LABEL'&&B.htmlFor){const x=document.getElementById(B.htmlFor);if(x&&F.includes(x)){pick=F.indexOf(x);how='label'}}
for(let e=B,d=0;e&&d<5&&pick<0;e=e.parentElement,d++){const c=[...e.querySelectorAll('input[type=file]')];if(c.length){const f=c.find((x)=>B.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING)||c[0];pick=F.indexOf(f);how='단추 곁'+d+(c.length>1?' 여럿':'')}}
if(pick<0&&F.length===1){pick=0;how='하나뿐'}if(pick<0){pick=F.findIndex((x)=>/sheet|xls/i.test(x.accept||''));if(pick>=0)how='accept'}if(pick<0&&F.length){pick=0;how='첫 칸'}
const L=F.slice(0,6).map((x,i)=>({i,id:(x.id||'').slice(0,20),acc:/sheet|xls/i.test(x.accept||'')?'xlsx':String(x.accept||'').slice(0,20),hid:!!(x.hidden||getComputedStyle(x).display==='none'),dis:!!x.disabled,pv:tx(x.previousElementSibling).slice(0,24),nx:tx(x.nextElementSibling).slice(0,24)}));
F.forEach((x)=>x.removeAttribute('data-rn-up'));const el=pick>=0?F[pick]:null;if(el)el.setAttribute('data-rn-up','1');
const isVm=(v)=>{try{return !!v&&typeof v.clickExcelImport==='function'}catch(e){return false}};let vm=null,vh='';
for(let e=el;e&&!vm;e=e.parentElement){for(let v=e.__vue__,d=0;v&&!vm&&d<8;v=v.$parent,d++)if(isVm(v)){vm=v;vh='vue2'}const c=e.__vueParentComponent;for(let p=c,d=0;p&&!vm&&d<8;p=p.parent,d++)if(isVm(p.proxy)){vm=p.proxy;vh='vue3'}}
if(!vm){const A=document.querySelectorAll('*');for(let i=0;i<A.length&&i<4000&&!vm;i++){const v=A[i].__vue__;if(isVm(v)){vm=v;vh='vue2 훑음'}}}
window.__rnY24={t:Date.now(),ch:0,called:0,parsed:null,err:null};window.__rnVm=vm;
if(el&&!el.__rnL){el.__rnL=1;el.addEventListener('change',()=>{const W=window.__rnY24;if(W)W.ch++},true)}
if(vm&&!vm.__rnW&&typeof vm.getExcelDataToJson==='function'){vm.__rnW=1;const o0=vm.getExcelDataToJson;vm.getExcelDataToJson=function(){const W=window.__rnY24;if(W)W.called++;const p=o0.apply(this,arguments);try{if(p&&typeof p.then==='function')p.then((r)=>{const W=window.__rnY24;if(!W)return;const a=Array.isArray(r)?r:[];const k=a[0]&&typeof a[0]==='object'?Object.keys(a[0]).slice(0,16):[];W.parsed={n:a.length,keys:k,emp:k.filter((x)=>a[0][x]===''||a[0][x]==null)}},(e)=>{const W=window.__rnY24;if(W)W.err=String((e&&e.message)||e).slice(0,120)})}catch(e){}return p}}
return{n:F.length,pick,how,btn:!!B,vm:!!vm,vh,L}})()`;
/* 넣은 뒤 그 칸 상태 · 감싼 기록 */
const JS_UPW = `(()=>{const W=window.__rnY24||{};const el=document.querySelector('input[type=file][data-rn-up]')||document.querySelector('input[type=file]');return{ch:W.ch||0,called:W.called||0,files:el&&el.files?el.files.length:null,parsed:W.parsed||null,err:W.err||null}})()`;
/* 사이트가 change를 못 받았을 때만 한 번 보냄(이미 받았으면 두 번 읽지 않게) */
const JS_FIRE = `(()=>{const el=document.querySelector('input[type=file][data-rn-up]')||document.querySelector('input[type=file]');if(!el||!el.files||!el.files.length)return{ok:false,why:'칸에 파일이 없음'};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return{ok:true}})()`;
/* 화면 부품의 자료(예스24 원문: rqData.EXCEL_DATA_LIST = 엑셀에서 읽어 바코드가 빈 줄을 뺀 것 · rsData.PRODUCT_CHECK_RESULT = 서버 확인 결과 · RESULT_LIST[].ERROR_CODE 0=등록 가능 · REG_COUNT) — 읽기만 */
const JS_VM = `(()=>{const W=window.__rnY24||{};const vm=window.__rnVm||null;const tx=(x)=>(x&&x.innerText||'').replace(/\\s+/g,' ').trim();const out={w:{ch:W.ch||0,called:W.called||0,parsed:W.parsed||null,err:W.err||null},vm:!!vm};
if(vm){try{out.type=String(vm.selectedType||'');const rq=vm.rqData||{};const L=Array.isArray(rq.EXCEL_DATA_LIST)?rq.EXCEL_DATA_LIST:[];out.nList=L.length;if(L[0]&&typeof L[0]==='object'){const k=Object.keys(L[0]).slice(0,16);out.l0e=k.filter((x)=>L[0][x]===''||L[0][x]==null)}
const rs=vm.rsData||{};const R=rs.PRODUCT_CHECK_RESULT;out.res=!!R;if(R){out.rc=R.RESULT_CODE==null?null:String(R.RESULT_CODE);const RL=Array.isArray(R.RESULT_LIST)?R.RESULT_LIST:[];out.nRes=RL.length;const sv=(v)=>v==null?null:String(v).slice(0,12);out.rows=RL.slice(0,30).map((x)=>({bc:String(x.BARCODE==null?'':x.BARCODE),no:String(x.GOODS_NO==null?'':x.GOODS_NO),e:x.ERROR_CODE==null||x.ERROR_CODE===''?null:+x.ERROR_CODE,f:{lv:sv(x.GOODS_LEVEL_GB),lvn:sv(x.GOODS_LEVEL_GB_NM),sl:sv(x.STATE_LEVEL_GB),us:sv(x.USE_SIGNS_GB),dm:sv(x.DAMAGE_YN),ac:sv(x.ACESORI_GB),rk:sv(x.RES_KEY_GB),gs:sv(x.GOODS_STAT_GB),ty:sv(x.SALE_TYPE_GB)}}))/* (0.1.74 y24reg4) 결과 줄의 칸 값(등급·상태정보·사용흔적·손상·부속물·상품 종류·판매상태·판매형태)도 — 오류가 어느 칸 탓인지 바로 보이게 · 읽기만 */}
out.reg=rs.REG_COUNT==null?null:+rs.REG_COUNT;out.prog=Array.isArray(rs.PROGIBITION_PRODUCT_LIST)?rs.PROGIBITION_PRODUCT_LIST.length:null;out.ban=Array.isArray(rs.BANNED_WORD_USE_PRODUCT_LIST)?rs.BANNED_WORD_USE_PRODUCT_LIST.length:null}catch(e){out.verr=String(e.message||e).slice(0,80)}}
out.guide=tx(document.querySelector('.yes24_guide_type2')).slice(0,160);out.mp=[...document.querySelectorAll('[role=dialog],[role=alertdialog],.modal.show')].filter((x)=>{try{const r=x.getBoundingClientRect();return r.width>0&&r.height>0}catch(e){return false}}).map((x)=>tx(x).slice(0,160)).filter(Boolean).slice(0,3);return out})()`;
/* 예스24 오류 코드 뜻(원문 getErrorMessage 그대로 줄임) */
const ERR_MSG = { '-1': '그 바코드로 등록된 상품이 2개 이상', '-2': '그 바코드로 등록된 상품이 없음', '-3': '출시 일주일 안 신간', '-4': '상태정보(품질등급 등) 칸이 비었거나 잘못', '-5': '사용흔적 칸', '-6': '손상여부 칸', '-7': '부속물여부 칸', '-8': '재고수량은 최소 1', '-9': '판매형태가 잘못', '-10': '판매가가 정가 50배·5천만원 넘음', '-11': '소장용 판매가는 정가보다 높아야', '-12': '판매가 100원 미만', '-13': '판매가가 잘못', '-14': '예스24에 없는 상품', '-15': '적립율 10% 이상 안 됨', '-16': '재고 0으로 판매중 안 됨', '-17': '중고 등록이 안 되는 상품', '-18': '금칙어가 들어 있음' };
const PRE_HEAD = '예스24 엑셀 확인 결과(누르기 전 멈춤 · 아무것도 누르지 않음) — '; /* 클라우드 y24auto 이어 가기가 이 머리를 읽음(새 판마다 한 번 풂) */
const dig = (v) => String(v == null ? '' : v).replace(/[^0-9Xx]/g, '');
/* 순수 셈(시험이 직접 부름) — isb = 우리 줄 바코드·ISBN · vs = JS_VM 결과 → 멈출 까닭('' = 화면 부품을 못 찾았거나 결과가 아직 없음 → 예전 판단 그대로) */
function judgePre(isb, vs) { if (!vs || !vs.vm) return ''; const w = vs.w || {};
  if (w.called && w.parsed && vs.nList === 0 && (!vs.res || !(vs.rows && vs.rows.length))) return PRE_HEAD + `엑셀 ${w.parsed.n}줄을 읽었지만 '바코드' 칸이 비어 모두 버려짐(읽은 칸: ${(w.parsed.keys || []).slice(0, 12).join(',') || '없음'}${w.parsed.emp && w.parsed.emp.length ? ' · 빈 칸: ' + w.parsed.emp.slice(0, 8).join(',') : ''}) · 양식 머리글을 확인`;
  if (!vs.res) return '';
  const rows = vs.rows || []; const bad = [];
  for (const i of isb) { const r = rows.find((x) => dig(x.bc) === dig(i) || (x.no && dig(x.no) === dig(i))); if (!r) { bad.push(`${i} 결과 표에 없음`); continue; } if (r.e != null && r.e < 0) bad.push(`${i} 오류코드 ${r.e} ${ERR_MSG[String(r.e)] || '(뜻 모름)'}`); }
  if (bad.length) return PRE_HEAD + bad.slice(0, 4).join(' · ') + (bad.length > 4 ? ` 외 ${bad.length - 4}` : '') + ` (확인 ${rows.length}줄 · 등록 가능 ${vs.reg == null ? '?' : vs.reg})` + (!rows.length && w.called ? ' · 예스24가 확인 결과를 한 줄도 돌려주지 않음 — 엑셀 칸 값(품질등급 최상·상·중·하 글자 · 판매상태·판매형태 글자 1) 확인' : ''); /* (y24reg3 11/17 고침 2 · y24reg4 고침) 0줄 = 칸 값을 못 알아들음(11/17 07:41 '상'·숫자 1·1) · 등급 코드 '01'은 -4(08:07) */
  if (vs.reg === 0) return PRE_HEAD + `등록 가능한 줄 0(확인 ${rows.length}줄)`;
  return ''; }
/* raw를 짧게(장부 칸 · 클라우드는 3000자 넘으면 잘라 둠) */
function fitRaw(raw, lim) { lim = lim || 2800; const s = () => JSON.stringify(raw).length; if (s() <= lim) return raw;
  if (Array.isArray(raw.net)) raw.net = raw.net.map((x) => ({ ...x, req: x.req ? String(x.req).slice(0, 120) : x.req, body: x.body ? String(x.body).slice(0, 160) : x.body })); if (s() <= lim) return raw;
  if (raw.vs && Array.isArray(raw.vs.rows)) raw.vs.rows = raw.vs.rows.slice(0, 5); if (raw.fi && Array.isArray(raw.fi.L)) raw.fi.L = raw.fi.L.slice(0, 2); raw.btn = (raw.btn || []).slice(0, 6); raw.txt = String(raw.txt || '').slice(0, 120); if (s() <= lim) return raw;
  if (Array.isArray(raw.net)) raw.net = raw.net.slice(0, 3).map((x) => ({ p: x.p, st: x.st, body: x.body ? String(x.body).slice(0, 80) : x.body })); if (s() <= lim) return raw;
  return { cut: true, s: JSON.stringify(raw).slice(0, lim - 40) }; }

function makeY24Reg(o) { const { HOME, note, TEST } = o; const now = () => Date.now(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const SC = o.SC || 1;
  const REC_F = path.join(HOME, 'y24-reg.json'), Q_F = path.join(HOME, 'y24-regq.json'), DIR = path.join(HOME, 'y24reg');
  const rd = (f, d) => { try { const v = JSON.parse(fs.readFileSync(f, 'utf8')); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }; const wr = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (e) { o.log && o.log('예스24 자동 올림 파일 저장 실패: ' + e.message); } };
  const R = { rec: rd(REC_F, { ok1: null, lid: {}, sku: {} }), q: rd(Q_F, { jobs: [], res: {} }), cur: null, msg: '', dlg: [] };
  R.rec.lid = R.rec.lid || {}; R.rec.sku = R.rec.sku || {}; R.q.jobs = Array.isArray(R.q.jobs) ? R.q.jobs : []; R.q.res = R.q.res || {};
  /* 도우미가 [등록]을 누르는 사이에 꺼졌으면(다시 켜짐) — 다시 누르지 않고 '확실하지 않음'으로 알림 */
  for (const j of R.q.jobs) if (j.st === 'click' || j.st === 'run') { R.q.res[j.id] = { state: j.st === 'click' ? 'unsure' : 'fail', pre: j.st !== 'click', msg: j.st === 'click' ? '[등록]을 누르는 사이 도우미가 다시 켜짐 — 예스24 등록상품 관리에서 올라갔는지 사람이 확인(다시 누르지 않음)' : '올리기 준비 중 도우미가 다시 켜짐 — 아무것도 누르지 않음', at: now(), rows: j.rows.map((r) => r.lid) }; j.st = 'end'; }
  R.q.jobs = R.q.jobs.filter((j) => j.st !== 'end'); const saveQ = () => wr(Q_F, { jobs: R.q.jobs.map((j) => ({ ...j, xlsx: undefined })), res: R.q.res });
  saveQ();
  const pc = () => String(o.pcName() || ''); const banPc = () => (o.isLogger() ? '로거 PC — 예스24 자동 올림 안 함(약속 0)' : /^MJ-MAIN/i.test(pc()) ? 'MJ-MAIN(등록·출고 PC) — 예스24 자동 올림 안 함(출고 보호)' : '');
  function put(b) { const ban = banPc(); if (ban) return { code: 409, body: { ok: false, err: ban } }; if (!o.enabled()) return { code: 409, body: { ok: false, err: '번외 예스24 판매관리 읽기가 꺼져 있음 — 옆 창에서 켜기' } };
    if (R.q.res[b && b.id] || R.q.jobs.some((j) => j.id === (b && b.id))) return { code: 200, body: { ok: true, already: true } };
    const why = checkJob(b, R.rec); if (why) return { code: 400, body: { ok: false, err: why } };
    for (const j of R.q.jobs) for (const r of j.rows) if (b.rows.some((x) => x.lid === r.lid || String(x.self).split(',').some((s) => String(r.self).split(',').includes(s)))) return { code: 400, body: { ok: false, err: `같은 상품·SKU가 이미 맡김 줄에 있음(${r.lid}) — 되풀이 0` } };
    const j = { id: String(b.id), rows: b.rows.map((r) => ({ lid: String(r.lid), isbn: String(r.isbn), ...(r.bc ? { bc: String(r.bc) } : {}), grade: r.grade, price: +r.price, qty: 1, self: String(r.self), title: String(r.title || '').slice(0, 60) })), xlsx: String(b.xlsx), st: 'wait', at: now(), by: String(b.by || '').slice(0, 60) };
    R.q.jobs.push(j); try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(path.join(DIR, j.id + '.xlsx'), Buffer.from(j.xlsx, 'base64')); } catch (e) {} /* (0.1.19 🔬 정밀 점검 11/10) 받은 즉시 엑셀을 파일로 — 저장 파일(y24-regq.json)은 xlsx를 빼므로 '기다림' 중 도우미가 다시 켜지면 엑셀이 없어 영어 오류로 끝났음 */ saveQ(); note(`🟦 예스24 자동 올림 맡김 받음 — ${j.rows.length}건(${j.rows[0].title}${j.rows.length > 1 ? ' 외' : ''})`); o.kick(300); return { code: 200, body: { ok: true, took: j.id } }; }
  function ack(ids) { for (const id of Array.isArray(ids) ? ids.map(String) : []) delete R.q.res[id]; saveQ(); return { ok: true }; }
  const why0 = () => banPc() || (!o.enabled() ? '예스24 읽기 꺼짐' : o.login() !== 'ok' ? '예스24 로그인 기다림(누르기 전)' : o.holdOn() ? '🚚 출고 중 — 끝나면 이어감(약속 0-1)' : '');
  function state() { return { ok: true, ver: 1, bc: 1 /* (r1116-y24reg) ISBN 없는 상품의 바코드 줄을 앎 — 웹앱·클라우드는 이 표시가 있을 때만 바코드 줄을 맡김 */, pc: pc(), ban: banPc() || null, ok1: R.rec.ok1 || null, done: Object.keys(R.rec.lid).length, wait: R.q.jobs.filter((j) => j.st === 'wait').map((j) => ({ id: j.id, n: j.rows.length, at: j.at })), cur: R.cur ? { id: R.cur.id, step: R.cur.step || '', n: R.cur.rows.length } : null, res: R.q.res, why: R.q.jobs.length ? why0() || null : null, msg: R.msg, login: o.login(), re: o.re ? o.re() : null, /* (11/11 fix5) 저장 계정으로 스스로 다시 로그인되는 상태인지 */ hold: !!o.holdOn(), en: !!o.enabled() /* (headless1) 클라우드가 판단할 때 씀 */ }; }
  const pick = () => !R.cur && !why0() && R.q.jobs.find((j) => j.st === 'wait');
  const active = () => !!(R.cur && R.cur.st === 'click');
  /* 확인 물음 — 이 일의 [등록] 뒤에만 '예'(글에 '등록'이 있고 위험 낱말이 없을 때) · 그 밖은 늘 '아니오' */
  function dialog(p) { const m = String(p.message || '').replace(/\s+/g, ' ').slice(0, 160); R.dlg.push(m); if (p.type === 'alert') return true; return /등록/.test(m) && !BAD_DLG.test(m); }
  function end(j, res) { j.st = 'end'; try { if (o.Y) o.Y.upW = null; } catch (e) {} R.q.res[j.id] = { ...res, at: now(), rows: j.rows.map((r) => r.lid), dlg: R.dlg.slice(-4) }; R.q.jobs = R.q.jobs.filter((x) => x.id !== j.id); saveQ(); R.cur = null; R.msg = `${res.state === 'done' ? '✅' : res.state === 'unsure' ? '⚠' : '⛔'} 예스24 자동 올림 ${j.rows.length}건: ${res.msg || res.state}`; note(R.msg); try { fs.unlinkSync(path.join(DIR, j.id + '.xlsx')); } catch (e) {} return res; }
  const mark = (j, gno) => { for (const r of j.rows) { R.rec.lid[r.lid] = { at: now(), job: j.id, gno: (gno && gno[r.lid]) || null }; for (const s of r.self.split(',')) R.rec.sku[s] = r.lid; } wr(REC_F, R.rec); };
  /* 등록상품 관리 목록을 읽어 자체코드 짝 찾기(읽기만 · 조회 모양은 그 화면이 보낸 그대로) */
  async function verify(j) { if (!o.Y.tpl.ProductList) { const lr = await o.learn('/Product/ProductList', 'ProductList'); if (lr !== 'ok') return { err: '등록상품 조회 모양을 못 배움(' + lr + ')' }; }
    const T = o.Y.tpl.ProductList; const sh = o.ordShift(T); let base = null; try { base = sh.isJ ? JSON.parse(sh.body) : Object.fromEntries(new URLSearchParams(sh.body)); } catch (e) { base = {}; } const ks = Object.keys(base);
    const kP = ks.find((k) => /^(PAGE_?(NO|INDEX|NUM|NUMBER)|CUR(RENT)?_?PAGE|pageNo|pageIndex|pageNum|page)$/i.test(k)); const kS = ks.find((k) => /(PAGE_?SIZE|ROW_?(CNT|COUNT|SIZE)|LIST_?(SIZE|CNT)|pageSize|rows|perPage|limit)$/i.test(k)); const kSt = ks.find((k) => /^(SALE_|GOODS_|USED_)?(STAT|STATE|STS)(_GB|_CD)?$/i.test(k) && !/LEVEL/i.test(k));
    let found = {}; const list = [];
    for (let pg = 1; pg <= 5; pg++) { const b2 = { ...base }; if (kSt) b2[kSt] = ''; if (kP) b2[kP] = sh.isJ && typeof base[kP] === 'number' ? pg : String(pg); if (kS) b2[kS] = sh.isJ && typeof base[kS] === 'number' ? 100 : '100';
      const r = await o.rawList(T, { body: sh.isJ ? JSON.stringify(b2) : new URLSearchParams(b2).toString(), isJ: sh.isJ }); if (!r || r.st !== 200 || !Array.isArray(r.rows)) return { err: `등록상품 목록 읽기 실패(${(r && (r.st || r.err)) || '응답 없음'})`, list };
      list.push(...r.rows); found = matchList(j.rows, list); if (Object.keys(found).length === j.rows.length || r.rows.length < 100 || !kP) break; await sleep(2000 * SC); }
    return { found, n: list.length }; }
  async function once() { const j = pick(); if (!j) return false; R.cur = j; R.dlg = []; j.st = 'run'; j.step = '준비'; saveQ();
    try { fs.mkdirSync(DIR, { recursive: true }); const F = path.join(DIR, j.id + '.xlsx'); if (j.xlsx) fs.writeFileSync(F, Buffer.from(j.xlsx, 'base64')); else if (!fs.existsSync(F)) return end(j, { state: 'fail', pre: true, msg: '도우미가 다시 켜진 뒤 엑셀 파일이 없음 — 아무것도 누르지 않음', todo: '📤 장부에서 이 줄을 「↩ 다시 올릴 수 있게」 뒤 「▶ 이어 가기」' }); /* (0.1.19) 다시 켜진 뒤엔 받을 때 둔 파일을 씀 */
      j.step = '대량 등록 화면 엶'; await o.nav(o.BASE + PG, 30); if (o.isLoginSt(await o.ev(o.JS_STATE))) { o.setLogin('need', '대량 등록 화면이 로그인 화면'); j.st = 'wait'; j.step = ''; R.cur = null; saveQ(); R.msg = '🔐 예스24 로그인이 풀려 자동 올림 기다림(아무것도 안 누름)'; return true; }
      await sleep(1500 * SC); const pb = await o.ev(JS_PICK_BARCODE); if (!pb || !pb.ok) return end(j, { state: 'fail', pre: true, msg: `대량 등록 화면 모양이 다름 — ${(pb && pb.why) || '바코드 칸 못 찾음'} · 아무것도 누르지 않음`, todo: '예스24 대량 등록 화면이 바뀌었을 수 있음 — 📤 엑셀 길(손)로 올리고 리드나우 방에 알려 주세요' });
      j.step = '엑셀 넣음'; const b = o.Y.br; const fi = await o.ev(JS_MARK_FILE).catch((e) => ({ err: String(e.message || e).slice(0, 120) })); /* (0.1.72) 파일 칸 수·곁 글을 적고 [엑셀파일 업로드] 곁 칸을 고름 */
      const doc = await b.cdp.send('DOM.getDocument', { depth: 0 }, b.sid); let q = await b.cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type=file][data-rn-up]' }, b.sid).catch(() => null);
      if (!q || !q.nodeId) q = await b.cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type=file]' }, b.sid);
      if (!q || !q.nodeId) return end(j, { state: 'fail', pre: true, raw: fitRaw({ fi }), msg: '파일 넣는 칸(input[type=file])이 없음 — 아무것도 누르지 않음', todo: '예스24 대량 등록 화면이 바뀌었을 수 있음 — 📤 엑셀 길(손)로' });
      o.Y.upW = []; /* (0.1.72) 이 동안 예스24 상품 쪽 요청·응답 앞부분을 적음(col2-y24.js take) */
      await b.cdp.send('DOM.setFileInputFiles', { files: [F], nodeId: q.nodeId }, b.sid);
      await sleep(1500 * SC); let up = await o.ev(JS_UPW).catch(() => null); let fired = null;
      if (up && !up.ch && !up.called && up.files) { fired = await o.ev(JS_FIRE).catch((e) => ({ ok: false, why: String(e.message || e).slice(0, 80) })); } /* 사이트가 change를 못 받았을 때만 한 번 보냄 */
      const isb = [...new Set(j.rows.map((r) => r.bc || r.isbn))]; /* (r1116-y24reg) 바코드 줄은 바코드로 찾음 */ let pv = null, vs = null;
      for (let k = 0; k < 60; k++) { await sleep(500 * SC); pv = await o.ev(JS_PREVIEW(isb)); vs = await o.ev(JS_VM).catch(() => null);
        if (pv && pv.pop && pv.pop.length) break; if (vs && vs.vm) { if (vs.res || (k > 8 && vs.w && vs.w.parsed && vs.nList === 0)) break; } else if (pv && pv.seen >= Math.min(isb.length, 1)) break; }
      if (vs && vs.vm && vs.res && !(pv && pv.seen)) { await sleep(800 * SC); pv = await o.ev(JS_PREVIEW(isb)).catch(() => pv); } /* 결과가 오고 표가 그려질 틈 */
      up = await o.ev(JS_UPW).catch(() => up); const net = Array.isArray(o.Y.upW) ? o.Y.upW.slice(0, 12) : []; o.Y.upW = null;
      const raw = () => fitRaw({ fi: fi ? { n: fi.n, pick: fi.pick, how: fi.how, btn: fi.btn, vm: fi.vm, vh: fi.vh, L: fi.L, err: fi.err } : null, up, fired, vs, net, txt: (pv && pv.txt) || '', inv: (pv && pv.inv) || 0, gid: !!(pv && pv.gid), fv: (pv && pv.fv) || null, btn: (pv && pv.btn) || [], pop: (pv && pv.pop) || [], empty: !!(pv && pv.empty), n: pv ? pv.n : null, dlg: R.dlg.slice(-4) });
      const why = judgePre(isb, vs); if (why) return end(j, { state: 'fail', pre: true, raw: raw(), msg: why + ' · [등록]은 누르지 않음', todo: '예스24가 알려 준 오류를 고친 뒤(값·등급·바코드) 📤 장부에서 「↩ 다시 올릴 수 있게」 — 고칠 수 없는 상품이면 예스24 올림에서 뺌' });
      const okVm = !!(vs && vs.vm && vs.res && isb.every((i) => (vs.rows || []).some((x) => dig(x.bc) === dig(i) && x.e === 0))); /* 서버 확인에서 우리 줄이 모두 오류 0이면 표 읽기가 빗나가도 지나감 */
      if ((!pv || !pv.seen) && !okVm) return end(j, { state: 'fail', raw: raw(), pre: true, msg: `엑셀을 넣었지만 미리보기 목록에 우리 줄이 안 보임${pv ? ` (표 ${pv.grid ? (pv.n == null ? '?' : pv.n) + '줄' : '못 찾음'}${pv.err && pv.err.length ? ' · ' + pv.err.join(' · ') : ''}${pv.keys && pv.keys.length ? ' · 칸 ' + pv.keys.slice(0, 12).join(',') : ''})` : ''} · 파일 칸 ${fi && fi.n != null ? fi.n + '개(' + (fi.how || '?') + ')' : '?'} · change ${up ? up.ch : '?'}·읽기 ${up ? up.called : '?'}${fired ? ' · 다시 보냄' : ''}${vs && vs.vm ? ' · 읽은 줄 ' + (vs.nList == null ? '?' : vs.nList) + ' · 확인 ' + (vs.res ? '옴' : '안 옴') : ' · 화면 부품 못 찾음'}${pv && pv.pop && pv.pop.length ? ' — 예스24 알림: ' + pv.pop[0] : ''}${R.dlg.length ? ' — ' + R.dlg.slice(-1)[0] : ''} · [등록]은 누르지 않음`, todo: '예스24 대량 등록 화면에서 같은 엑셀을 손으로 올려 보고 오류 글을 확인' });
      await sleep(1500 * SC); j.st = 'click'; j.step = '[등록] 누름'; saveQ(); /* 이 줄 뒤로는 다시 누르지 않음(도우미가 꺼져도 '확실하지 않음') */
      const ck = await o.ev(JS_CLICK_REG); if (!ck || !ck.ok) { j.st = 'run'; return end(j, { state: 'fail', pre: true, msg: ((ck && ck.why) || '[등록] 단추 못 누름') + ' — 아무것도 올라가지 않음', todo: '📤 엑셀 길(손)로' }); }
      let dn = null; for (let k = 0; k < 120 && !dn; k++) { await sleep(500 * SC); dn = await o.ev(JS_DONE).catch(() => null); }
      const cnt = dn ? doneCounts(dn.txt) : null; await o.ev(JS_CLOSE).catch(() => {});
      if (!cnt) return end(j, { state: 'unsure', msg: `[등록]을 눌렀지만 '등록 완료' 창을 못 봄${R.dlg.length ? ' — 예스24 알림: ' + R.dlg.slice(-1)[0] : ''}`, todo: '예스24 판매관리 › 등록상품 관리에서 이 상품이 올라갔는지 보고, 📤 예스24 이전 화면 장부에서 「올라감 확인」 또는 「↩ 다시 올릴 수 있게」' });
      const n = cnt.sale + cnt.unpub; if (!n) return end(j, { state: 'fail', msg: `예스24가 0건 등록했다고 함${R.dlg.length ? ' — ' + R.dlg.slice(-1)[0] : ''}`, cnt, todo: '예스24 대량 등록 화면에서 같은 엑셀을 손으로 올려 미리보기의 오류 칸을 확인(값·등급·바코드)' });
      j.step = '등록상품 목록에서 확인'; await sleep(3000 * SC); const v = await verify(j);
      const got = (v && v.found) || {}; const k = Object.keys(got).length; mark(j, got); /* 예스24가 받았다고 한 뒤엔 되풀이 막이에 넣음(목록 확인과 상관없이) */
      if (k === j.rows.length) { if (!R.rec.ok1) { R.rec.ok1 = now(); wr(REC_F, R.rec); } return end(j, { state: 'done', gno: got, cnt, msg: `올라감 — 판매중 ${cnt.sale}·미출간 ${cnt.unpub} · 등록상품 목록에서 자체코드 확인 ${k}/${j.rows.length}` }); }
      return end(j, { state: k ? 'part' : 'unsure', gno: got, cnt, msg: `예스24가 ${n}건 등록했다고 함 · 등록상품 목록에서 자체코드로 확인 ${k}/${j.rows.length}${v && v.err ? ' (' + v.err + ')' : ''}`, todo: '예스24 판매관리 › 등록상품 관리에서 확인 못 한 줄을 보고 📤 장부에서 「올라감 확인」 또는 「↩ 다시 올릴 수 있게」' }); }
    catch (e) { const clicked = j.st === 'click'; return end(j, { state: clicked ? 'unsure' : 'fail', pre: !clicked, msg: (clicked ? '[등록] 뒤 오류 — ' : '올리기 전 오류(아무것도 안 누름) — ') + String(e.message || e).slice(0, 140), todo: clicked ? '예스24 등록상품 관리에서 올라갔는지 사람이 확인' : '잠시 뒤 웹앱 📤 화면에서 「▶ 자동 올림 이어 가기」' }); } }
  return { put, ack, state, pick, once, active, dialog, R };
}
module.exports = { makeY24Reg, checkJob, doneCounts, matchList, MAXN, judgePre, fitRaw, ERR_MSG, PRE_HEAD, _js: { JS_MARK_FILE, JS_UPW, JS_FIRE, JS_VM } };
