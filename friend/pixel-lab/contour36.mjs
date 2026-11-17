import {correctCitation} from './citation37.mjs';
import {resolutionControl,portraitAtResolution} from './render-resolution.mjs';
import {correctFernChin,underside} from './chin37.mjs';
import {readApplied,reshapeHead} from './photo-apply36.mjs?v=44-lab';
import {DEFAULTS} from './model.mjs';
import {loadRig} from './rig32.mjs';
import {face36,faceLines,unseenJaw,chest36} from './contour-model36.mjs';
import {studyView} from './camera35.mjs';
import {portraitPixels} from './portrait48.mjs';
import {raisedPose,pose34} from './bust34.mjs';
import {paperRig} from './paper-rig35.mjs';
import {bindSurface,surfaceParts} from './surface35.mjs';
import {surfaceDefaults} from './surface-settings35.mjs';
import {scanImage,silhouette} from './scan-view36.mjs';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const resolution=resolutionControl($('resolution36'),queue);
const el=(tag,txt)=>Object.assign(document.createElement(tag),{textContent:txt});
const svg=(tag,props)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))e.setAttribute(k,v);return e;};
function buttons(id,opts,selected,fn){$(id).replaceChildren(...opts.map(([key,title])=>{const b=el('button',title);b.type='button';b.setAttribute('aria-pressed',key===selected);b.onclick=()=>fn(key);return b;}));}
const fetchJSON=async name=>{const r=await fetch(name);if(!r.ok)throw Error(name+' 자료를 읽을 수 없습니다.');return r.json();};
const names={F02:'페른',M01:'힘멜',W:'도판 가슴 기본형',scan:'실제 인물 360°'};
const params=new URLSearchParams(location.search);
let id=Object.hasOwn(names,params.get('case'))?params.get('case'):'F02',view,rev='after',yaw=0,pitch=0,zoom=1;
let atlas,ref,fit,head,notes,model,rec,bindings,poses=new Map(),pending=false,drag=null,aligning=null;
const local=new Map(),key=()=>id+'/'+view,face=()=>id==='F02'||id==='M01';
const settings=()=>({...DEFAULTS,...surfaceDefaults,showNac:true,top:'none',heads:8,sex:id==='M01'?'male':'female',designStyle:'manga',paperForm:'W'});
function go(next,sub){
 id=next;view=sub||(face()?'front':id==='W'?'B3':'scan');aligning=null;poses.clear();zoom=1;rev='after';
 if(face()){rec=atlas.faces.find(r=>r.id===id);model=face36(settings(),rec,ref.faces[id]);}
 if(id==='W'){model={before:paperRig(settings()),after:chest36(settings(),ref,fit.fit)};bindings=Object.fromEntries(['before','after'].map(k=>[k,bindSurface(model[k],settings())]));}
 $('applyBox').hidden=!applied||!face();$('arm').value=0;$('armBox').hidden=$('markerBox').hidden=id!=='W';$('own').hidden=id==='scan';
 $('sourceTitle').textContent=id==='scan'?'실측 두상과 두 모델의 윤곽':'원본과 윤곽';
 $('modelTitle').textContent=id==='scan'?'같은 인물의 회전 모델':'교정한 모델';
 buttons('subjects',Object.entries(names),id,k=>go(k));
 versions();
 changeView(view);
}
function versions(){const options=[['before',id==='scan'?'거친 메시':'35차'],['after',id==='scan'?'정밀 메시':'36차']];if(id==='F02')options.push(['chin37','37차 턱 후보']);buttons('versions',options,rev,version);}
function version(k){rev=k;if(k==='chin37'&&!model.chin37)model.chin37=correctFernChin(model.after,id,model,ref.faces[id],.75);versions();queue();}
function views(){return face()?[['front','정면'],['side','측면'],['other','별도 작화']]:id==='W'?Object.keys(ref.paper).map(k=>[k,k.replace('S','측면 ').replace('B','사선 B').replace('A','사선 A')]):[['scan','실측 원형']];}
function changeView(v){
 view=views().some(a=>a[0]===v)?v:views()[0][0];aligning=null;
 buttons('viewChoices',views(),view,changeView);yaw=face()?(view==='front'?0:view==='side'?-90:rec.blindView.yaw):id==='W'?(view[0]==='S'?-90:-26.15):0;pitch=0;
 const url=new URL(location.href);url.searchParams.set('case',id);url.searchParams.set('cell',view);history.replaceState(null,'',url);
 $('file').value='';syncLocal();queue();
}
function syncLocal(){const l=local.get(key());$('align').disabled=$('restore').disabled=!l;
 $('fileStatus').textContent=aligning?'사진에서 '+(aligning.points.length?'두 번째':'첫 번째')+' 기준점('+aligning.labels[aligning.points.length]+')을 누르세요.':l?'이 탭에서 연 그림입니다. 두 점을 맞추면 회전·배율·위치가 함께 정렬됩니다.':'같은 시점의 그림을 열어 두 기준점을 맞출 수 있습니다. 파일은 이 탭에서만 사용합니다.';}
function queue(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;try{draw();}catch(e){$('notice').textContent='관찰창 오류 · '+e.message;console.error(e);}});}
function addLine(plate,lines,color,dash=''){
 for(const p of lines)plate.append(svg('polyline',{points:p.map(v=>v.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':1.15,'stroke-linejoin':'round','stroke-dasharray':dash}));
}
function anchors(){
 if(face()){const r=ref.faces[id];if(view==='front')return [[r.eye.slice(0,2),r.eye.slice(2)],['화면 왼눈 중심','화면 오른눈 중심']];
 if(view==='other')return [rec.blindView.marks.map(p=>p.map(v=>v*2.48)),['화면 왼눈 중심','화면 오른눈 중심']];
 return [[r.sideEye,r.side.reduce((a,b)=>a[0]<b[0]?a:b)],['보이는 눈 중심','코끝']];}
 const c=ref.paper[view];return c.marks.length===2?[c.marks,['가까운 쪽 유두 중심','먼 쪽 유두 중심']]:[[c.marks[0],c.lines[0].reduce((a,b)=>a[1]>b[1]?a:b)],['보이는 유두 중심','아래 윤곽 최저점']];
}
function plate(){
 const p=$('overlay');p.replaceChildren();
 if(id==='scan'){const raw=scanImage(head.meshes[0],yaw,pitch,256,zoom),cv=document.createElement('canvas');cv.width=cv.height=256;cv.getContext('2d').putImageData(raw,0,0);p.setAttribute('viewBox','0 0 256 256');
  if($('photo').checked)p.append(svg('image',{href:cv.toDataURL(),width:256,height:256}));
  for(const [k,m,c] of [['trace',0,'#007b8c'],['prior',1,'#79549b'],['next',2,'#b34419']])if($(k).checked)p.append(svg('path',{d:silhouette(m?scanImage(head.meshes[m],yaw,pitch,256,zoom):raw),stroke:c,'stroke-width':1,fill:'none'}));
  $('gap').textContent='동일 카메라 50시점 · 실측 원형 17,684면 / 거친 메시 300면 / 정밀 메시 3,600면';return;}
 const faceMode=face(),size=faceMode?[248,248]:ref.paper[view].size,[w,h]=size,l=local.get(key());
 p.setAttribute('viewBox','0 0 '+w+' '+h);
 if($('photo').checked){
  let im;
  if(l)im=svg('image',{href:l.url,width:w,height:h,preserveAspectRatio:'xMidYMid meet',transform:aligning?'':l.transform||''});
  else if(faceMode)im=svg('image',{href:rec.views[view==='front'?0:view==='side'?2:1].url,width:w,height:h});
  else{const [x,y]=ref.paper[view].box;im=svg('image',{href:'wallner-fig1-crop35.webp',x:-x,y:-y,width:Math.round(2007*725/1280),height:1143,preserveAspectRatio:'none'});}
  im.setAttribute('opacity',$('opacity').value/100);im.addEventListener('error',()=>{if(p.contains(im))$('fileStatus').textContent='원본 서버에서 그림을 열지 못했습니다. 원전에서 같은 그림을 열어 내 참고 그림에 선택할 수 있습니다.';});p.append(im);
 }
 if(aligning){for(const q of aligning.points)p.append(svg('circle',{cx:q[0],cy:q[1],r:2.4,fill:'red'}));return;}
 const source=faceMode?[ref.faces[id][view]]:ref.paper[view].lines,sets={};
 if(faceMode)for(const k of ['before','after'])sets[k]=view==='other'?unseenJaw(model[k],rec,model.before):faceLines(model[k],model)[view];
 else for(const k of ['before','after'])sets[k]=fit.paper[view][k].lines;
 if($('trace').checked){addLine(p,source,'#007b8c');if(!faceMode)for(const q of ref.paper[view].marks)p.append(svg('circle',{cx:q[0],cy:q[1],r:2.2,stroke:'#007b8c',fill:'none'}));}
 if($('prior').checked)addLine(p,sets.before,'#79549b','4 2');
 if($('next').checked){if(rev==='chin37'&&view==='side'){const q=faceLines(model.chin37,model).side;addLine(p,q,'#b34419','2 1');addLine(p,[underside(model.chin37,model,ref.faces[id])],'#b34419');}
 else if(rev==='chin37'){addLine(p,view==='other'?unseenJaw(model.chin37,rec,model.before):faceLines(model.chin37,model).front,'#b34419','2 1');}else addLine(p,sets.after,'#b34419','2 1');}
 $('gap').textContent=faceMode?'248px 원화의 가시선 → 모델 평균 거리 · 35차 '+fit.faces[id][view][0].toFixed(2)+'px → 36차 '+fit.faces[id][view][1].toFixed(2)+'px':('대각선 대비 평균제곱근 거리 · 35차 '+fit.paper[view].before.errors.map(v=>(100*v).toFixed(2)+'%').join(' / ')+' → 36차 '+fit.paper[view].after.errors.map(v=>(100*v).toFixed(2)+'%').join(' / '));
}
let applied=null,modified=null,readCount=0;
async function refreshApplied(activate=false){if(['38','39','40','41'].includes(params.get('round')))return;const ticket=++readCount;try{const next=await readApplied();if(ticket!==readCount)return;applied=next;modified=null;$('applyBox').hidden=!applied||!face();if(applied)$('userModel').checked=activate||localStorage.getItem('bookfriend-face-enabled36')!=='0';queue();}catch(e){$('notice').textContent=e.message;}}
const bus='BroadcastChannel' in window?new BroadcastChannel('bookfriend-photo-model36'):null;if(bus)bus.onmessage=e=>{if(e.data?.kind==='apply')refreshApplied(true);};
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===$('engineFrame').contentWindow&&e.data?.type==='bookfriend-face-fit36')refreshApplied(true);});
$('engineFold').ontoggle=()=>{if($('engineFold').open&&!$('engineFrame').getAttribute('src'))$('engineFrame').src='photo-engine36.html';};$('userModel').oninput=()=>{localStorage.setItem('bookfriend-face-enabled36',$('userModel').checked?'1':'0');queue();};
window.addEventListener('storage',e=>{if(e.key==='bookfriend-face-enabled36'&&applied){$('userModel').checked=e.newValue!=='0';queue();}});
let plateKey='';
function draw(){
 const c=$('orbit'),rawKey=[id,view,rev,...['photo','trace','prior','next'].map(k=>$(k).checked),$('opacity').value,local.get(key())?.url,local.get(key())?.transform,aligning?.points.length,id==='scan'?[yaw,pitch,zoom].join('/'):''].join('|');
 if(plateKey!==rawKey){plate();plateKey=rawKey;}
 let pixels;
 const size=resolution.sync(id==='scan'?256:192);
 if(id==='scan')pixels=scanImage(head.meshes[rev==='after'?2:1],yaw,pitch,size,zoom);
 else{let sc=model[rev];if(id==='W'){
  const a=Number($('arm').value),k=[rev,a,$('marker').checked].join('/');
  if(!poses.has(k)){const posed=a?pose34(sc,raisedPose(a)).scene:sc;poses.set(k,{...posed,parts:[...posed.parts,...($('marker').checked?surfaceParts(bindings[rev],posed.parts[0]):[])]});}
  sc=poses.get(k);$('armOut').value=a+'°';}
  if(face()&&rev!=='before'&&applied&&$('userModel').checked){if(modified?.base!==sc)modified={base:sc,result:reshapeHead(sc,applied)};sc=modified.result;}
  const image=portraitAtResolution(portraitPixels,settings(),{...studyView(sc,face()),yaw,pitch,freeOrbit:true,cameraZoom:zoom},size);pixels=new ImageData(image.data,image.width,image.height);
 }
 c.width=pixels.width;c.height=pixels.height;c.getContext('2d').putImageData(pixels,0,0);
 $('extra37').hidden=rev!=='chin37';if(rev==='chin37')$('extra37').textContent='37차 페른의 턱 후보 · 측면 실선은 턱밑의 가시 경계입니다. 35→36차 수치는 기존 판 사이의 거리입니다.';
 $('camera').textContent='좌우 '+yaw.toFixed(1)+'° · 상하 '+pitch.toFixed(1)+'°';
 $('credit').href=id==='scan'?head.source:face()?rec.source:'https://doi.org/10.1007/s00266-021-02753-y';
 $('notice').textContent=id==='scan'?'실제 한 인물의 스캔을 같은 카메라에서 돌립니다. 목 아래 절단면·표면으로 가려진 안쪽은 원자료의 범위 밖입니다.':face()?'왼쪽은 선택한 원화 시점에 고정됩니다. 오른쪽은 같은 교정 메시를 자유롭게 돌린 모습입니다. 정면·측면은 교정에 썼고 별도 작화는 검증에만 썼습니다.':'왼쪽은 도판의 정지 자세입니다. 15칸은 사선과 측면의 형태 변주이며 정면·뒤·밑면은 같은 인물의 실측 원본이 없습니다. 양팔을 들면 오른쪽 모델에만 적용됩니다.';
}
$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;const state=key(),url=URL.createObjectURL(f),img=new Image();img.src=url;
 try{await img.decode();}catch{URL.revokeObjectURL(url);$('fileStatus').textContent='그림을 열 수 없습니다.';return;}
 if(key()!==state||$('file').files[0]!==f){URL.revokeObjectURL(url);return;}
 const prev=local.get(state);if(prev)URL.revokeObjectURL(prev.url);local.set(state,{url});aligning=null;$('photo').checked=true;syncLocal();queue();};
$('restore').onclick=()=>{const prev=local.get(key());if(prev)URL.revokeObjectURL(prev.url);local.delete(key());aligning=null;$('file').value='';syncLocal();queue();};
$('align').onclick=()=>{const [targets,labels]=anchors();aligning={points:[],targets,labels};$('photo').checked=true;syncLocal();queue();};
$('overlay').onclick=e=>{if(!aligning)return;
 const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('overlay').getScreenCTM().inverse());aligning.points.push([p.x,p.y]);
 if(aligning.points.length===2){const [[a,b],[c,d]]=aligning.points,[[u,v],[s,t]]=aligning.targets,dx=c-a,dy=d-b,den=dx*dx+dy*dy;
  if(den<16){aligning.points.pop();$('fileStatus').textContent='두 점이 너무 가깝습니다. 두 번째 점을 다시 눌러 주세요.';return;}
  const co=((s-u)*dx+(t-v)*dy)/den,si=((t-v)*dx-(s-u)*dy)/den;local.get(key()).transform='matrix('+[co,si,-si,co,u-co*a+si*b,v-si*a-co*b].join(' ')+')';aligning=null;}
 syncLocal();queue();};
for(const name of ['photo','trace','prior','next','arm','marker','opacity'])$(name).oninput=queue;
const orbit=$('orbit');orbit.onpointerdown=e=>{if(e.button!==0)return;drag=[e.pointerId,e.clientX,e.clientY];orbit.setPointerCapture(e.pointerId);};
orbit.onpointermove=e=>{if(drag?.[0]!==e.pointerId)return;yaw=(yaw+.75*(e.clientX-drag[1]))%360;pitch=(pitch+.75*(e.clientY-drag[2]))%360;drag=[e.pointerId,e.clientX,e.clientY];queue();};orbit.onlostpointercapture=()=>drag=null;
orbit.onwheel=e=>{e.preventDefault();zoom=Math.max(.5,Math.min(3,zoom*Math.exp(-e.deltaY*.0015)));queue();};
orbit.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];queue();}};
buttons('angles',[[0,'정면'],[-45,'사선'],[-90,'측면'],[180,'뒤'],[91,'밑면']],null,k=>{yaw=k===91?0:k;pitch=k===91?-90:0;queue();});
try{[atlas,ref,fit,head,notes]=await Promise.all(['atlas35.json','traces36.json','fit36.json','head36.json','notes36.json'].map(fetchJSON));await loadRig();
 const docs=el('p','원자료와 이용 조건 · ');for(const [name,url] of [['두상 이용 조건','https://creativecommons.org/licenses/by/3.0/'],['도판 이용 조건','https://creativecommons.org/licenses/by/4.0/'],['체표 원 연구','https://doi.org/10.1002/btm2.70044'],['인체 유선 발달','https://pmc.ncbi.nlm.nih.gov/articles/PMC3706056/'],['유두·유륜 영상해부','https://doi.org/10.1186/s13244-020-00896-1']]){const a=el('a',name);a.href=url;docs.append(a,'　');}$('notes').append(docs);
 for(const n of notes.map(correctCitation)){const d=el('details',''),s=el('summary',n.title);d.append(s,el('p',n.line),el('p',n.unit));for(const p of n.detail.split('\n\n'))d.append(el('p',p));const a=el('a','원전 열기');a.href=n.url;d.append(a);$('notes').append(d);}
 if(params.get('round')==='41'){const {launchRound41}=await import('./comparison41.mjs');await launchRound41({atlas,ref,fit});}else if(params.get('round')==='40'){const {launchRound40}=await import('./comparison40.mjs');await launchRound40({atlas,ref,fit});}else if(params.get('round')==='39'){const {launchRound39}=await import('./comparison39.mjs?v=41');await launchRound39({atlas,ref,fit});}else if(params.get('round')==='38'){const {launchRound38}=await import('./comparison38.mjs');await launchRound38({atlas,ref,fit});}else{go(id,params.get('cell'));if(id==='F02'&&params.get('variant')==='chin37')version('chin37');await refreshApplied();}if(location.hash==='#photoEngine')$('engineFold').open=true;}catch(e){$('notice').textContent='자료를 열 수 없습니다. '+e.message;}
