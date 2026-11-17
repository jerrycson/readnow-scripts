import {DEFAULTS} from './model.mjs';
import {surfaceDefaults} from './surface-settings35.mjs';
import {face36,faceLines,chest36} from './contour-model36.mjs';
import {correctFernChin} from './chin37.mjs';
import {paperRig} from './paper-rig35.mjs';
import {studyView} from './camera35.mjs';
import {portraitPixels} from './portrait48.mjs';
import {portraitAtResolution,resolutionControl} from './render-resolution.mjs';
import {bindSurface,surfaceParts} from './surface35.mjs';
import {pose34,raisedPose} from './bust34.mjs';

const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const svg=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
const read=async file=>{const r=await fetch(file);if(!r.ok)throw Error(file+' 응답 '+r.status);return r.json();};
const poly=(points,color,dash='')=>svg('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':.9,'stroke-dasharray':dash,'stroke-linejoin':'round'});
const points=(ps,color)=>svg('path',{d:ps.map(([x,y])=>'M'+x+' '+y+'h.2').join(''),fill:'none',stroke:color,'stroke-width':.65,'stroke-linecap':'round'});
const lineSet=lines=>!lines?.length?[]:typeof lines[0][0]==='number'?[lines]:lines;
const paint=(c,image)=>{if(c.width!==image.width||c.height!==image.height){c.width=image.width;c.height=image.height;}c.getContext('2d').putImageData(new ImageData(image.data,image.width,image.height),0,0);};

export async function launchRound38({atlas,ref,fit}){
  $('legacyViewer').hidden=true;$('subjects').hidden=true;$('notice').hidden=true;$('photoEngine').hidden=true;document.body.classList.add('round38');
  document.title='37·38차 같은 조건 비교 · 책방 친구';document.querySelector('main>h1').textContent='37차와 38차를 같은 조건에서';
  document.querySelector('main>p').textContent='원본의 선을 보면서 두 판을 나란히 돌리고, 같은 시점에서 즉시 A/B로 비교합니다.';
  const host=node('section');host.id='round38';host.innerHTML=`
    <div id="subjects38" class="controls38" role="group" aria-label="비교 대상"></div>
    <div id="views38" class="controls38" role="group" aria-label="원본 그림과 시점"></div>
    <p id="load38" role="status">38차 실제 모델과 투영 검증 자료를 읽는 중입니다.</p>
    <div class="source38"><article><h2>실제 원본과 두 판의 선</h2><svg id="overlay38" viewBox="0 0 248 248" role="img" aria-label="원본 관측선과 37·38차 실제 가시 윤곽"></svg>
    <div class="controls38"><label><input type="checkbox" id="photo38" checked>원본</label><label class="inkSource38"><input type="checkbox" id="trace38" checked>관측선</label><label class="ink37"><input type="checkbox" id="prior38" checked>37차 선</label><label class="ink38"><input type="checkbox" id="next38" checked>38차 선</label></div>
    <label>원본 농도 <input type="range" id="opacity38" min="0" max="100" value="85"></label><p id="sourceInfo38"></p><a id="credit38" target="_blank" rel="noopener">선택 원전 열기</a><p class="small38">공식 원화는 원전 서버에서 직접 읽고, 논문 도판은 기존 보존 구획을 표시합니다. 사선 가시점은 순서 없는 점으로, 측면 턱밑은 앞쪽 선과 따로 표시합니다.</p></article>
    <article><h2>같은 카메라의 회전 비교</h2><div id="resolution38"></div><div class="controls38" id="angles38" role="group" aria-label="두 모델 공통 회전"></div>
    <p id="camera38"></p><label id="armBox38">양팔 <input id="arm38" type="range" min="0" max="178" value="0"><output id="armOut38">0°</output></label>
    <label id="markerBox38"><input id="marker38" type="checkbox" checked>유두·유륜 표시</label><p><button id="reset38" type="button">시점·확대 복원</button></p>
    <p id="coverage38" class="coverage38"></p><p>아래 어느 그림을 끌어도 두 판이 함께 회전합니다. 휠로 확대, 방향키로 회전합니다.</p></article></div>
    <div class="controls38" id="mode38" role="group" aria-label="비교 표시 방식"></div>
    <div class="pair38"><figure id="priorFigure38"><figcaption>37차 기준 <span id="priorTag38"></span></figcaption><canvas id="priorOrbit38" width="192" height="192" tabindex="0" aria-label="37차 기준 모델. 드래그와 방향키로 두 판 함께 회전"></canvas></figure><figure id="nextFigure38"><figcaption>38차 후보</figcaption><canvas id="nextOrbit38" width="192" height="192" tabindex="0" aria-label="38차 후보 모델. 드래그와 방향키로 두 판 함께 회전"></canvas></figure></div>
    <p id="comparisonState38" role="status"></p><p class="small38">페른의 37차 기준은 .75 턱 후보를 독립 생성한 판입니다. 힘멜과 가슴의 37차는 변경이 없어 36차 메시를 유지합니다. 자유 회전에서 원본이 없는 방향은 실측 검증으로 세지 않습니다. 기존 판은 <a href="contour36.html?case=F02">35·36차 관찰창</a>과 <a href="contour36.html?case=F02&amp;cell=side&amp;variant=chin37">37차 보존 관찰창</a>에서 다시 볼 수 있습니다.</p>`;
  $('legacyViewer').before(host);
  let id=['F02','M01','W'].includes(new URL(location.href).searchParams.get('case'))?new URL(location.href).searchParams.get('case'):'F02';
  let cell=new URL(location.href).searchParams.get('cell')||'front',yaw=0,pitch=0,zoom=1,arm=0,mode='both',model,record,faceData,chestData,face38,chest38,loading=true,pending=false,drag=null,sourceVersion=0;
  const face=()=>id!=='W',names={F02:'페른',M01:'힘멜',W:'도판 가슴 기본형'},cache=new Map(),poseCache=new Map();
  const settings=()=>({...DEFAULTS,...surfaceDefaults,showNac:true,top:'none',heads:8,sex:id==='M01'?'male':'female',designStyle:'manga',paperForm:'W'});
  const buttonGroup=(where,items,selected,fn)=>{$(where).replaceChildren(...items.map(([k,title])=>{const b=node('button',title);b.type='button';b.dataset.key=k;b.setAttribute('aria-pressed',String(k===selected));b.onclick=()=>fn(k);return b;}));};
  const resolution=resolutionControl($('resolution38'),queue);
  const projection=()=>faceData?.views?.find(v=>v.id===id&&v.imageNumber===(cell==='oblique4'?4:2));
  const options=()=>face()?[['front','원화 1 · 정면'],['oblique2','원화 2 · 사선'],['side','원화 3 · 측면'],['oblique4','원화 4 · 사선']]:Object.keys(ref.paper).map(k=>[k,k.replace('S','측면 ').replace('B','사선 B').replace('A','사선 A')]);
  function sourceAngle(){if(!face())return {yaw:chestData?.paper?.[cell]?.yaw??(cell[0]==='S'?-90:-26.15),pitch:0};if(cell==='front')return {yaw:0,pitch:0};if(cell==='side')return {yaw:-90,pitch:0};const p=projection()?.pose;return {yaw:p?.yaw??0,pitch:p?.pitch??0};}
  function setCell(next){cell=options().some(([k])=>k===next)?next:face()?'front':'B3';const p=sourceAngle();yaw=p.yaw;pitch=p.pitch;zoom=1;sourceVersion++;buttonGroup('views38',options(),cell,setCell);const u=new URL(location.href);u.searchParams.set('round','38');u.searchParams.set('case',id);u.searchParams.set('cell',cell);history.replaceState(null,'',u);drawSource();queue();}
  function choose(next){if(loading)return;id=next;poseCache.clear();if(!cache.has(id)){if(face()){record=atlas.faces.find(r=>r.id===id);const base=face36(settings(),record,ref.faces[id]);const prior=id==='F02'?correctFernChin(base.after,id,base,ref.faces[id],.75):base.after;cache.set(id,{base,prior,next:face38(prior,id,base,ref.faces[id])});}else{const prior=chest36(settings(),ref,fit.fit),next=chest38(prior,ref);cache.set(id,{prior,next,bindingPrior:bindSurface(prior,settings()),bindingNext:bindSurface(next,settings())});}}model=cache.get(id);record=face()?atlas.faces.find(r=>r.id===id):null;arm=0;$('arm38').value=0;$('armBox38').hidden=$('markerBox38').hidden=face();$('priorTag38').textContent=id==='F02'?'· 턱 .75 독립 기준':'· 36차 유지';buttonGroup('subjects38',Object.entries(names),id,choose);setCell(cell);}
  function drawSource(){
    if(!model)return;const plate=$('overlay38');plate.replaceChildren();let source,observed,prior,next,pointMode=false,width=248,height=248;
    if(face()){
      if(cell==='oblique2'||cell==='oblique4'){const p=projection();if(!p)throw Error(id+' 사선 투영 검증 자료가 없습니다.');source=p.source;observed=p.handSegments;prior=p.visible37;next=p.visible38;pointMode=true;$('sourceInfo38').textContent='원화 '+p.imageNumber+' · 눈·코·입으로 정합한 공통 고정 카메라. 턱은 자세 정합에 쓰지 않았습니다. '+(p.meanDistancePx?'원본 관측점 → 가시점 평균: 37차 '+p.meanDistancePx[0]+'px → 38차 '+p.meanDistancePx[1]+'px. ':'')+(p.omitted||'');}
      else{source=record.views[cell==='front'?0:2].url;observed=[ref.faces[id][cell]];prior=faceLines(model.prior,model.base)[cell];next=faceLines(model.next,model.base)[cell];let description='원화 '+(cell==='front'?'1 · 정면':'3 · 측면')+' · 37차와 38차를 같은 원본 좌표에 표시합니다.';if(cell==='side'){const side=faceData?.cases?.[id]?.side;if(!side)throw Error(id+' 측면 턱밑 검증 자료가 없습니다.');source=side.source||source;const range=side.visibleRangeX,visible=lines=>lineSet(lines).map(l=>l.filter(p=>p[0]>=range[0]&&p[0]<=range[1])).filter(l=>l.length>1);observed=[...observed,...lineSet(side.handSegments)];prior=[...prior,...visible(side.under37)];next=[...next,...visible(side.under38)];description+=' 턱밑 선은 앞쪽 윤곽과 별도입니다. 원본에서 확인되는 x '+range.join('~')+'px 범위만 겹치고 머리카락 뒤의 목 연결은 검증선에서 제외했습니다. '+(side.omitted||'');}$('sourceInfo38').textContent=description;}
    }else{const r=ref.paper[cell],p=chestData?.paper?.[cell];if(!p)throw Error('가슴 '+cell+' 밑선 검증 자료가 없습니다.');[width,height]=r.size;source='wallner-fig1-crop35.webp';observed=r.lines;prior=p.before.lines;next=p.after.lines;const diagonal=Math.hypot(width,height),error=record=>(record.errorsPx||record.errors?.map(v=>v*diagonal))?.map(v=>v.toFixed(2)+'px').join(' / ');$('sourceInfo38').textContent=cell+' · 측면·사선의 실제 관측 밑선. 팔 0°의 도판과 고정 카메라로 비교합니다. '+(error(p.before)&&error(p.after)?'원본 표식부터 최저점까지의 아래 절반에서 잰 양방향 RMS: 37차 '+error(p.before)+' → 38차 '+error(p.after)+'. ':'')+'자유 회전·팔 올림은 아래 모델에서 별도 관찰합니다.';}
    plate.setAttribute('viewBox','0 0 '+width+' '+height);
    if($('photo38').checked){let image;if(face())image=svg('image',{href:source,width,height});else{const [x,y]=ref.paper[cell].box;image=svg('image',{href:source,x:-x,y:-y,width:Math.round(2007*725/1280),height:1143,preserveAspectRatio:'none'});}image.setAttribute('opacity',+$('opacity38').value/100);image.onerror=()=>{$('sourceInfo38').textContent+=' · 원본 서버 그림을 읽지 못했습니다. 원전 링크에서 확인하세요.';};plate.append(image);}
    for(const [key,set,color,dash]of [['trace38',observed,'#007b8c',''],['prior38',prior,'#79549b','3 2'],['next38',next,'#b34419','']])if($(key).checked){const group=svg('g',{'data-layer':key});if(pointMode&&key!=='trace38')group.append(points(set,color));else for(const line of lineSet(set))group.append(poly(line,color,dash));plate.append(group);}
    $('credit38').href=face()?record.source:'https://doi.org/10.1007/s00266-021-02753-y';
  }
  function queue(){if(loading||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;try{draw();}catch(e){$('load38').textContent='38차 그리기 오류 · '+e.message;console.error(e);}});}
  function displayed(which){const scene=model[which];if(face())return scene;const k=[which,arm,$('marker38').checked].join('/');if(!poseCache.has(k)){const posed=arm?pose34(scene,raisedPose(arm)).scene:scene,bind=model[which==='prior'?'bindingPrior':'bindingNext'];poseCache.set(k,{...posed,parts:[...posed.parts,...($('marker38').checked?surfaceParts(bind,posed.parts[0]):[])]});}return poseCache.get(k);}
  function draw(){
    const size=resolution.sync(192),baseCamera=studyView(model.prior,face()),base=baseCamera.sceneOverride;for(const [which,canvasId]of [['prior','priorOrbit38'],['next','nextOrbit38']]){const scene=displayed(which),cameraScene={...scene,height:base.height,faceCenter:base.faceCenter,frame:base.frame,cameraCenter:base.cameraCenter};const image=portraitAtResolution(portraitPixels,settings(),{...baseCamera,sceneOverride:cameraScene,yaw,pitch,freeOrbit:true,cameraZoom:zoom},size);const canvas=$(canvasId);paint(canvas,image);Object.assign(canvas.dataset,{yaw:String(yaw),pitch:String(pitch),zoom:String(zoom),arm:String(arm),resolution:String(size),version:which==='prior'?'37':'38'});}
    $('camera38').textContent='공통 좌우 '+yaw.toFixed(1)+'° · 상하 '+pitch.toFixed(1)+'° · 확대 '+Math.round(zoom*100)+'% · '+size+'px';$('armOut38').value=arm+'°';const p=sourceAngle(),gap=(a,b)=>Math.abs((((a-b+180)%360)+360)%360-180);$('coverage38').textContent=gap(yaw,p.yaw)<1&&gap(pitch,p.pitch)<1?'선택 원본 방향의 모델 관찰입니다. 원본 위의 고정 정합과 자유 회전 캔버스의 구도를 구별해 보세요.':'현재 방향의 같은 대상 원본은 이 선택 칸에서 확인하지 않았습니다. 모형의 연속성을 보는 회전이며 원전 모사 통과로 세지 않습니다.';
    $('comparisonState38').textContent=names[id]+' · 37/38차 동일 시점·확대·해상도·팔 자세. '+(mode==='both'?'나란히 비교':mode==='prior'?'A · 37차만 보기':'B · 38차만 보기');
    $('priorFigure38').hidden=mode==='next';$('nextFigure38').hidden=mode==='prior';document.querySelector('.pair38').classList.toggle('single38',mode!=='both');
  }
  function orbit(canvas){canvas.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,canvas};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(drag?.id!==e.pointerId||drag.canvas!==canvas)return;yaw+=.75*(e.clientX-drag.x);pitch+=.75*(e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;queue();};canvas.onlostpointercapture=()=>drag=null;canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.5,Math.min(3,zoom*Math.exp(-e.deltaY*.0015)));queue();};canvas.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];queue();}};}
  orbit($('priorOrbit38'));orbit($('nextOrbit38'));
  buttonGroup('mode38',[['both','37·38차 나란히'],['prior','A · 37차만'],['next','B · 38차만']],mode,()=>{});
  $('mode38').onclick=e=>{const b=e.target.closest('button[data-key]');if(!b)return;mode=b.dataset.key;for(const child of $('mode38').children)child.setAttribute('aria-pressed',String(child===b));queue();};
  buttonGroup('angles38',[[0,'정면'],[-45,'왼 45°'],[45,'오른 45°'],[-90,'왼 측면'],[90,'오른 측면'],[180,'뒤'],[270,'반대 회전'],['top','위'],['bottom','아래']],null,k=>{if(k==='top'||k==='bottom'){yaw=0;pitch=k==='top'?90:-90;}else{yaw=k;pitch=0;}queue();});
  $('reset38').onclick=()=>{const p=sourceAngle();yaw=p.yaw;pitch=p.pitch;zoom=1;queue();};$('arm38').oninput=()=>{arm=+$('arm38').value;queue();};$('marker38').oninput=queue;
  for(const key of ['photo38','trace38','prior38','next38','opacity38'])$(key).oninput=()=>{try{drawSource();}catch(e){$('load38').textContent=e.message;}};
  buttonGroup('subjects38',Object.entries(names),id,choose);
  try{const modules=await Promise.all([import('./face38.mjs'),import('./chest38.mjs'),read('face-eval38.json'),read('chest-eval38.json')]);face38=modules[0].face38;chest38=modules[1].chest38;faceData=modules[2];chestData=modules[3];if(typeof face38!=='function'||typeof chest38!=='function'||!faceData.views?.length||!chestData.paper)throw Error('38차 실제 변형 또는 투영 자료가 준비되지 않았습니다.');loading=false;choose(id);draw();$('load38').textContent='38차 실제 변형과 원본 투영 검증 자료를 읽었습니다. 37·38차 후보 비교이며 정범님 승인과 구별합니다.';host.dataset.ready='true';}
  catch(e){$('load38').textContent='38차 준비 확인 필요 · '+e.message;host.dataset.ready='false';console.error(e);}
}
