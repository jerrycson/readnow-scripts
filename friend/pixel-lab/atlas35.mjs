import {studyView} from './camera35.mjs';
import {comparisonAngle,registerModel} from './overlay35.mjs';
import {DEFAULTS} from './model.mjs';
import {loadRig} from './rig32.mjs';
import {portraitPixels} from './portrait48.mjs';
import {form34,pose34,raisedPose,response34} from './bust34.mjs';
import {fittedChest,fittedFace} from './fitting35.mjs';
import {surfaceDefaults,surfaceAxes,surfaceValues,tipShapes} from './surface-settings35.mjs';
import {bindSurface,surfaceParts} from './surface35.mjs';
let editionNotes=[];
import {drawScan} from './scan35.mjs';

const el=id=>document.getElementById(id),make=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const svgNS='http://www.w3.org/2000/svg';
function svgNode(tag,attrs){const node=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);return node;}
const groups=[['F','여성 얼굴 20'],['M','남성 얼굴 20'],['chest','가슴 형태 20'],['scans','자세 실측 15쌍']];
const url=new URL(location.href),key='readnow-friend-surface35-v1';
let anatomy={...surfaceDefaults},saveHint='이 브라우저에 자동 저장됩니다.';
try{anatomy=surfaceValues(JSON.parse(localStorage.getItem(key)||'{}'));}catch{saveHint='이 브라우저의 설정을 읽지 못해 기본값을 표시합니다.';}
let atlas,scans,group='F',caseRow,scanId=1,index=0,photo=false,layer='trace',yaw=0,pitch=0,zoom=1,heads=8,sex='female',arm=0,phase=0,frame=0;
let overlayKey='',layerModel='fit',over=null,restKey='',rest=[],posedKey='',posed=[],bindingKey='',bindings=null,lastNative='',rigReady=false,drag=null;
const currentGroup=()=>group==='chest'?atlas.bodies:atlas.faces.filter(r=>r.category===group);
function buttons(id,items,value,act){
  el(id).replaceChildren(...items.map(([k,txt])=>{const b=make('button',txt);b.type='button';b.dataset.id=k;b.setAttribute('aria-pressed',String(k===value));b.onclick=()=>act(k);return b;}));
}
function saved(){try{localStorage.setItem(key,JSON.stringify(anatomy));saveHint='이 브라우저에 저장됨';}catch{saveHint='현재 화면에만 적용됨';}el('saveState').textContent=saveHint;}
function setUrl(){const u=new URL(location.href);u.searchParams.delete('case');u.searchParams.delete('group');if(group==='scans'){u.searchParams.set('group','scans');u.searchParams.set('scan',scanId);}else{u.searchParams.delete('scan');u.searchParams.set('case',caseRow.id);}history.replaceState(null,'',u);}
function paint(c,img){if(c.width!==img.width||c.height!==img.height){c.width=img.width;c.height=img.height;}c.getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);}
function orbit(canvas){
  canvas.onpointerdown=e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};};
  canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=.7*(e.clientX-drag.x);pitch+=.7*(e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;redraw();};
  canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null;redraw();};
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(3.5,zoom*Math.exp(-e.deltaY*.0013)));redraw();},{passive:false});
  canvas.onkeydown=e=>{const delta={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];
    if(delta){e.preventDefault();yaw+=delta[0];pitch+=delta[1];redraw();}};
}
function drawSource(r,idx,mini=false){
  const view=r.views[idx],[x0,y0,x1,y1]=view.box,w=view.width*(x1-x0),h=view.height*(y1-y0);
  const svg=svgNode('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':r.name+' '+view.label});
  const box=svgNode('g',{transform:'scale('+w/100+' '+h/100+')'});svg.append(box);
  if(!mini&&photo&&layer!=='trace'){
    const im=svgNode('image',{x:-100*x0/(x1-x0),y:-100*y0/(y1-y0),width:100/(x1-x0),height:100/(y1-y0),href:view.url,preserveAspectRatio:'none'});
    im.addEventListener('error',()=>{el('coverage').textContent+=' · 제공처의 사진을 불러오지 못했습니다. 원전 열기로 확인해 주세요.';});box.append(im);
  }
  if(!mini&&over&&layerModel!=='none'){
    const g=svgNode('g',{opacity:Number(el('modelFade').value)/100});
    if(layerModel==='skin')g.append(svgNode('image',{href:over.bitmap,x:0,y:0,width:over.size,height:over.size,transform:'matrix('+over.matrix.join(' ')+')'}));
    else if(!over.lines.length)g.append(svgNode('image',{href:over.bitmap,x:0,y:0,width:over.size,height:over.size,transform:'matrix('+over.matrix.join(' ')+')'}));
    else for(const l of over.lines)g.append(svgNode('polyline',{points:l.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#bb581f','stroke-width':Math.max(w,h)*.007,'stroke-linecap':'round','stroke-linejoin':'round'}));
    svg.append(g);
  }
  const lines=idx===r.active?r.lines:idx===r.extra?.index?r.extra.lines:idx===r.blindView?.index?r.blindView.lines:[];
  if(mini||layer!=='photo')for(const line of lines)box.append(svgNode('polyline',{points:line.points.map(p=>p.join(',')).join(' '),fill:'none',stroke:mini?'currentColor':photo&&layer==='both'?'#1ae4d0':'#235f56','stroke-width':mini?2.2:1.1,'stroke-linejoin':'round','stroke-linecap':'round',opacity:mini?1:Number(el('fade').value)/100}));

  if(mini&&lines.length){const ps=lines.flatMap(l=>l.points),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);svg.setAttribute('viewBox',[(x-5)*w/100,(y-5)*h/100,(Math.max(...xs)-x+10)*w/100,(Math.max(...ys)-y+10)*h/100].join(' '));}
  return svg;
}
function cards(){
  const filter=el('filter').value.trim().toLocaleLowerCase(),rs=group==='scans'?[]:currentGroup();
  const list=rs.filter(r=>[r.id,r.name,r.evidence,r.preference?.origin,r.preference?.anchor].join(' ').toLocaleLowerCase().includes(filter));
  el('cards').replaceChildren(...list.map(r=>{const b=make('button','');b.dataset.id=r.id;b.setAttribute('aria-pressed',String(r===caseRow));b.append(drawSource(r,r.active,true),make('span',r.id+' '+r.name));b.onclick=()=>pick(r);return b;}));
  if(rs.length&&!list.length)el('cards').append(make('p','일치하는 사례가 없습니다.'));
}
function source(){
  const r=caseRow;el('picture').replaceChildren(drawSource(r,index));el('original').href=(index===r.extra?.index&&r.extra.source)||r.source;
  buttons('compareControls',[['none','원자료만'],['fit','시안선 겹치기'],['skin','입체 시안 겹치기']],layerModel,k=>{layerModel=k;source();redraw();});
  el('registration').textContent=over?over.reason+(over.error===null?'':' · 선 차이 '+(over.error*100).toFixed(2)+'% (원자료 대각선 기준)'):'이 시점은 원자료를 눈으로 비교합니다.';
  buttons('layers',[['trace','모사선'],['both','원본 위에 겹치기'],['photo','원본만']],layer,k=>{photo=k!=='trace';layer=k;source();});
  buttons('views',r.views.map((v,i)=>[i,(i===r.blindView?.index?'별도 확인 · ':'')+v.label+' '+(i+1)]),index,i=>{
    index=i;over=null;const v=r.views[i],direction=r.kind==='chest'?Math.sign(r.marks[1][0]-r.marks[0][0]):1;
    yaw=comparisonAngle(r,i);pitch=0;
    if(i!==r.active&&i!==r.extra?.index&&i!==r.blindView?.index){photo=true;layer='photo';}source();redraw();
  });
  const traced=index===r.active||index===r.extra?.index||index===r.blindView?.index;
  el('coverage').textContent=r.views.length+'개 원본 구획 · '+(traced?(index===r.active?'모사한 시점':index===r.blindView?.index?'보정에 쓰지 않은 확인 시점':'다른 시점의 모사선'):'원본 열람 시점 · 모사선 없음');
  el('fadeLabel').hidden=layer==='photo';
}
function surfaceControls(){
  const on=group==='chest';el('skinTools').hidden=!on;if(!on)return;
  buttons('sexes',[['female','여성 기본형'],['male','남성 기본형']],sex,k=>{sex=k;surfaceControls();redraw();});
  el('showNac').checked=anatomy.showNac;el('showNac').onchange=e=>{anatomy.showNac=e.target.checked;saved();surfaceControls();redraw();};
  const femaleOptions=anatomy.showNac&&sex==='female';el('skinAxes').hidden=el('tipChoices').hidden=!femaleOptions;el('saveState').textContent=saveHint;
  el('skinAxes').replaceChildren(...surfaceAxes.map(([k,label])=>{const l=make('label',label+' '),o=make('output',Math.round(100*anatomy[k])),i=make('input','');i.type='range';i.min=0;i.max=100;i.step=1;i.value=o.textContent;i.dataset.setting=k;i.oninput=()=>{anatomy[k]=Number(i.value)/100;o.value=i.value;saved();redraw();};l.append(o,i);return l;}));
  buttons('tipChoices',tipShapes,anatomy.nippleShape,k=>{anatomy.nippleShape=k;saved();surfaceControls();redraw();});
}
function pick(r){
  over=null;overlayKey='';caseRow=r;index=r.active;sex=group==='M'?'male':'female';arm=0;el('arm').value=0;phase=0;
  const face=r.kind==='face';yaw=comparisonAngle(r,index);pitch=0;zoom=1;layer='trace';photo=false;
  el('name').textContent=r.id+' · '+r.name;el('armBox').hidden=face;el('pulseBox').hidden=face;el('pulse').value=0;el('phaseOut').value='0초';
  el('finding').textContent=r.preference?r.preference.origin+' · 기준 '+r.preference.anchor+' · '+r.preference.why:r.evidence;
  if(r.preference?.angles.length)el('finding').textContent+=' 정범님 표시 시점은 '+r.preference.angles.join('·')+'입니다.';
  el('native35').hidden=!face;el('degrees').value='0°';cards();source();surfaceControls();setUrl();redraw();
}
function setGroup(next,id){
  group=next;el('filter').value='';buttons('groups',groups,group,v=>setGroup(v));
  const isScan=group==='scans';el('desk').hidden=isScan;el('scanDesk').hidden=!isScan;document.querySelector('.catalog').hidden=isScan;
  if(isScan){const k=Number(new URL(location.href).searchParams.get('scan'));if(scans.cases.some(r=>r.id===k))scanId=k;yaw=0;pitch=0;zoom=1;setUrl();scanButtons();redraw();return;}
  el('catalogTitle').textContent=groups.find(v=>v[0]===group)[1];
  const rs=currentGroup();pick(rs.find(v=>v.id===id)||rs[0]);
}
function scanButtons(){buttons('scanIds',scans.cases.map(r=>[r.id,'사례 '+r.id]),scanId,k=>{scanId=k;setUrl();scanButtons();redraw();});}
function draw(){
  if(group==='scans'){
    const r=scans.cases.find(r=>r.id===scanId);for(const k of ['prone','supine'])drawScan(el(k),r[k],yaw,pitch,zoom);
    el('scanText').textContent='공통 격자 '+r.overlap+'개 · 높이 차 절댓값의 중앙값 '+r.medianAbs+'mm · '+(r.prone.landmarkConventionInferred?'엎드림 표식의 두 축 반전을 추정 적용함. 원 좌표에서 최근접 '+r.prone.rawNearestMm+'mm, 정합 뒤 '+r.prone.usedNearestMm+'mm.':'원본 표식 좌표 사용.');return;
  }
  if(!rigReady||!caseRow)return;
  const face=caseRow.kind==='face',s={...DEFAULTS,heads,sex,candidate:'B',designStyle:'manga'},rk=[caseRow.id,heads,sex].join('/');
  if(restKey!==rk){
    rest=[form34(s),face?fittedFace(s,caseRow):sex==='female'?fittedChest(s,caseRow):form34(s)];
    restKey=rk;posedKey='';bindingKey='';
  }
  const pk=[rk,arm,phase].join('/');if(pk!==posedKey){const pose=raisedPose(arm),d=phase?response34(phase):{};posed=rest.map(scene=>pose34(scene,pose,d).scene);posedKey=pk;}
  const cfg=sex==='female'?anatomy:{...surfaceDefaults,showNac:anatomy.showNac},bk=JSON.stringify([rk,cfg]);
  if(bk!==bindingKey){bindings=!face?bindSurface(rest[1],{...s,...cfg}):null;bindingKey=bk;}
  const decorated=bindings?{...posed[1],parts:[...posed[1].parts,...surfaceParts(bindings,posed[1].parts[0])]}:posed[1];
  const size=drag?96:192;
  [posed[0],decorated].forEach((scene,i)=>paint(el(i?'new':'old'),portraitPixels({...s,resolution:96},{...studyView(scene,face),yaw,pitch,freeOrbit:true,studyResolution:size===192?192:undefined,cameraZoom:zoom})));
  if(face&&lastNative!==rk){lastNative=rk;el('native35').replaceChildren(make('span','실제 48px'));for(const a of [0,45,90]){const c=make('canvas','');c.setAttribute('aria-label',a+'도 · 실제 48픽셀');paint(c,portraitPixels({...s,resolution:48},{sceneOverride:rest[1],portrait:'face',yaw:a}));el('native35').append(c);}}
  el('position').textContent=heads+'등신 · 좌우 '+Math.round(yaw%360)+'° · 상하 '+Math.round(pitch%360)+'° · 확대 '+Math.round(zoom*100)+'%';
  const ok=[rk,index].join('/');
  if(ok!==overlayKey){overlayKey=ok;over=null;
    if(face?heads>=5:sex==='female'){const angle=comparisonAngle(caseRow,index),sc=rest[1],img=portraitPixels({...s,resolution:96},{...studyView(sc,face),yaw:angle,pitch:0,freeOrbit:true,studyResolution:256});
      const fit=registerModel(sc,img,caseRow,index);
      if(fit){const c=make('canvas','');paint(c,img);over={...fit,size:img.width,bitmap:c.toDataURL()};}
    }
    source();
  }
  const fit=rest[1].fit35;el('residual').textContent=face?'정면에서 관찰한 눈·입·턱 특징을 적용했습니다. 모사하지 않은 방향의 동일성은 별도로 검토합니다.':sex==='male'?'남성 흉곽에 맞춘 부착·표시를 확인합니다.':fit?'정면 보정 전의 측면 적합 오차 '+fit.before.toFixed(3)+' → '+fit.after.toFixed(3)+' · 정면 밑선·표식 보정을 이어 적용했습니다. 사선·팔 올림은 별도 확인 조건입니다.':'이 등신은 단순형 기본선을 사용합니다.';
}
function redraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;try{draw();}catch(e){el('position').textContent='그리기 오류 · '+e.message;console.error(e);}});}
function papers(){
  const out=el('papers');out.replaceChildren();
  const link=make('a','전체 자료별 연구 노트 · 한 문단 요약과 A4 상세 설명');link.href='study-note35.html';out.append(link);
  for(const r of editionNotes.filter(r=>['wallner','rated','artz','sculpt'].includes(r.noteId))){
    const a=make('article',''),h=make('h3',r.title),p=make('p',r.unit),more=make('a','상세 설명 읽기');more.href='study-note35.html?id='+r.noteId;a.append(h,p,more);out.append(a);
  }
}
async function start(){
  const load=async file=>{const r=await fetch(file);if(!r.ok)throw Error(file+' '+r.status);return r.json();};
  [atlas,scans,editionNotes]=await Promise.all([load('atlas35.json'),load('scan35.json'),load('notes35.json')]);
  for(const id of ['old','new','prone','supine'])orbit(el(id));
  el('filter').oninput=cards;el('fade').oninput=source;el('modelFade').oninput=source;
  el('arm').oninput=e=>{arm=Number(e.target.value);el('degrees').value=arm+'°';redraw();};
  el('pulse').oninput=e=>{phase=Number(e.target.value)/1000;el('phaseOut').value=phase.toFixed(2)+'초';redraw();};
  el('reset').onclick=()=>{yaw=0;pitch=0;zoom=1;redraw();};el('scanReset').onclick=el('reset').onclick;
  function angles(){buttons('angles',[[0,'정면'],[45,'45°'],[90,'측면'],[180,'뒤'],[-90,'반대 측면']],yaw,a=>{yaw=a;pitch=0;angles();redraw();});}
  function dimensions(){buttons('dimensions',[2,3,4,5,6,7,8].map(v=>[v,v+'등신']),heads,v=>{heads=v;dimensions();redraw();});}
  angles();dimensions();papers();const id=url.searchParams.get('case'),g=url.searchParams.get('group'),row=[...atlas.faces,...atlas.bodies].find(r=>r.id===id);
  setGroup(row?.kind==='chest'?'chest':row?.category|| (groups.some(([k])=>g===k)?g:'F'),id);
  await loadRig();rigReady=true;redraw();
}
start().catch(e=>{el('position').textContent='자료를 여는 중 오류 · '+e.message;console.error(e);});