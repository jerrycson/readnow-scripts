import {DEFAULTS} from './model.mjs';
import {renderPixels,projectPoint} from './renderer.mjs';
import {foundation} from './foundation32.mjs';
import {morphForm,bodyParams,chestParams,bodyPresets,chestPresets} from './morph33.mjs';
import {joints,limits,setAngle,presets,presetPose,articulate,commonFrame} from './articulation33.mjs';
import {kindOf,loadRig,poseScene,inspectStrain} from './rig32.mjs';
import {choices} from './choice33.mjs';
const el=id=>document.getElementById(id),svg=el('markers'),ns=svg.namespaceURI;
const state={yaw:0,pitch:0,zoom:1,offset:[0,0],pose:{},active:'right.shoulder',axis:'side',body:{},chest:{}};
let model,modelKey='',posed,poseDirty=true,frame=0,drag=null,markers=[],lastBefore='',strainCache,ready=false,beforeScene,camera;
const springs={left:{v:0,y:0},right:{v:0,y:0}};let lastTick=0,motionFrame=0,frozen=false;
const sync={},wrap=x=>((x%360)+360)%360;
const label=id=>(id.startsWith('left.')?'왼쪽 ':id.startsWith('right.')?'오른쪽 ':'')+joints[kindOf(id)].label;
function buttons(parent,title,items,run){
  const box=document.createElement('fieldset'),legend=document.createElement('legend'),row=document.createElement('div');
  legend.textContent=title;row.className='choices';box.append(legend,row);parent.append(box);
  for(const [val,txt] of items){
    const b=document.createElement('button');b.type='button';b.textContent=txt;b.dataset.value=val;
    b.onclick=()=>{run(val);for(const n of row.children)n.setAttribute('aria-pressed',String(n===b));};row.append(b);
  }
  return row;
}
function field(parent,id,title,items,initial){
  const box=document.createElement('fieldset'),legend=document.createElement('legend'),select=document.createElement('select'),row=document.createElement('div');
  legend.textContent=title;select.id=id;row.setAttribute('aria-label',title);
  for(const item of items){const [v,t]=Array.isArray(item)?item:[item,item];select.add(new Option(t,v));}
  select.value=initial;box.append(legend,select,row);parent.append(box);sync[id]=choices(select,row);return select;
}
const base=el('baseControls'),poseTools=el('poseControls');
field(base,'sex','기본형',[['female','여성'],['male','남성']],'female');
field(base,'heads','등신',[2,3,4,5,6,7,8],8);
field(base,'style','조형',[['manga','아니메'],['natural','해부 구조']],'manga');
field(base,'focus','검토 부위',[['','전신'],['face','얼굴'],['ear','귀'],['torso','흉곽'],['chest','가슴'],['legs','다리'],['hand','손'],['foot','발']],'');
field(base,'previous','왼쪽 비교',[['pose32','32차 같은 자세'],['rest32','32차 중립'],['rest33','현재 형태 중립']],'pose32');
field(base,'resolution','원본 픽셀',[48,64,96,128,192,256,512],192);
field(base,'candidate','작은 등신 원형',[['A','A'],['B','B'],['C','C']],'B');
field(poseTools,'rangeMode','관절 범위',[['human','일반 성인'],['trained','훈련된 가동 범위']],'human');
field(poseTools,'preset','자세 표본',Object.keys(presets),'중립');
field(poseTools,'side','조작 위치',[['right','오른쪽'],['left','왼쪽'],['center','중앙']],'right');
field(poseTools,'joint','관절',[],'');field(poseTools,'axis','움직임',[],'');
const settings=()=>({...DEFAULTS,sex:el('sex').value,heads:+el('heads').value,designStyle:el('style').value,candidate:el('candidate').value,resolution:Math.min(128,+el('resolution').value)});
function panel(id){for(const b of document.querySelectorAll('[data-panel]')){const on=b.dataset.panel===id;el(b.dataset.panel).hidden=!on;b.setAttribute('aria-pressed',String(on));}}
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>{panel(b.dataset.panel);if(b.dataset.panel==='chest'&&!el('chestControls').hidden){el('focus').value='chest';sync.focus();resetCam();}};
function resetCam(){state.zoom=1;state.offset=[0,0];schedule();}
function options(id,entries,value){
  el(id).replaceChildren(...entries.map(([k,v])=>new Option(v,k)));el(id).value=value;sync[id]();
}
function updateAxes(){
  const side=state.active.includes('.')?state.active.split('.')[0]:'center';el('side').value=side;sync.side();
  const kinds=side==='center'?['pelvis','lumbar','thorax','neck','jaw']:['girdle','shoulder','elbow','wrist','hip','knee','ankle','toes',...(settings().heads>=5?['digit1','digit2','digit3','digit4','digit5']:[])];
  if(!kinds.includes(kindOf(state.active)))state.active=side==='center'?kinds[0]:side+'.'+kinds[0];
  options('joint',kinds.map(k=>[side==='center'?k:side+'.'+k,joints[k].label]),state.active);
  const axes=joints[kindOf(state.active)].axes;
  if(!axes[state.axis])state.axis=Object.keys(axes)[0];options('axis',Object.entries(axes).map(([k,[n]])=>[k,n]),state.axis);
  const [a,b]=limits(state.active,state.axis,el('rangeMode').value,state.pose);
  el('angle').min=a;el('angle').max=b;angleValue();
}
function angleValue(){const value=state.pose[state.active]?.[state.axis]||0;el('angle').value=value;el('readout').textContent=value.toFixed(1)+'°';}
function awake(impulse,side){
  if(!el('dynamics').checked||settings().sex!=='female'||settings().heads<5)return;
  for(const [key,spring] of Object.entries(springs))spring.v=Math.max(-5,Math.min(5,spring.v+impulse*(side && key!==side ? .12 : 1)));
  frozen=false;el('pauseMotion').setAttribute('aria-pressed','false');if(!motionFrame){lastTick=performance.now();motionFrame=requestAnimationFrame(step);}
}
function step(now){
  const elapsed=Math.min(.12,(now-lastTick)/1000);lastTick=now;
  for(const [side,s] of Object.entries(springs)){
    const volume=(state.chest.volume||0)+(side==='left'?-1:1)*.3*(state.chest.asym||0);
    const mass=1+.3*volume;
    for(let t=0;t<elapsed;t+=.008){const dt=Math.min(.008,elapsed-t);s.v+=(-55*s.y-8*s.v)*dt/mass;s.y+=s.v*dt;}
    if(Math.abs(s.y)+Math.abs(s.v)<.014){s.y=0;s.v=0;}
  }
  motionFrame=Object.values(springs).some(s=>s.v||s.y)&&!frozen?requestAnimationFrame(step):0;
  poseDirty=true;schedule();
}
function stopMotion(){cancelAnimationFrame(motionFrame);motionFrame=0;frozen=false;el('pauseMotion').setAttribute('aria-pressed','false');for(const s of Object.values(springs)){s.y=0;s.v=0;}poseDirty=true;schedule();}
function changePose(value){el('preset').value='';sync.preset();const prev=state.pose[state.active]?.[state.axis]||0;setAngle(state.pose,state.active,state.axis,value,el('rangeMode').value);angleValue();poseDirty=true;
  if(['girdle','shoulder','thorax','lumbar','pelvis'].includes(kindOf(state.active)))awake((value-prev)*.045,state.active.includes('.')?state.active.split('.')[0]:null);schedule();}
function geometry(s){
  const key=JSON.stringify([s.sex,s.heads,s.designStyle,s.candidate,state.body,state.chest,el('previous').value]);
  if(key!==modelKey){modelKey=key;model=morphForm(s,state.body,state.chest);lastBefore='';poseDirty=true;geometry.old=foundation(s);}
  if(poseDirty){
    const motion=springs.left.y||springs.right.y?{left:springs.left.y,right:springs.right.y}:0;
    posed=articulate(model,state.pose,motion);strainCache=null;
    if(el('previous').value==='pose32'){
      if(geometry.previousPose!==JSON.stringify(state.pose)||geometry.previousModel!==geometry.old){
        const legacy=poseScene(geometry.old,state.pose);geometry.leftPose=legacy.scene;geometry.previousPose=JSON.stringify(state.pose);geometry.previousModel=geometry.old;
      }
      beforeScene=geometry.leftPose;
    }else beforeScene=el('previous').value==='rest32'?geometry.old:model;
    poseDirty=false;
  }
}
function paint(id,r,silhouette){
  if(silhouette)for(let i=0;i<r.data.length;i+=4)if(r.data[i+3])r.data.set([40,53,47],i);
  const c=el(id);if(c.width!==r.width)c.width=r.width;if(c.height!==r.height)c.height=r.height;c.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);
}
function showMarkers(r){
  const nodes=[],handles=el('handles').checked;
  const project=p=>projectPoint(r,p).map(x=>x*1000/r.width);
  function line(a,b){const l=document.createElementNS(ns,'line');l.setAttribute('class','guide');for(const [k,v] of Object.entries({x1:a[0],y1:a[1],x2:b[0],y2:b[1]}))l.setAttribute(k,v);nodes.push(l);}
  if(el('guides').checked && !el('focus').value){
    for(const side of ['left','right'])for(const chain of [['shoulder','elbow','wrist'],['hip','knee','ankle']]){
      const pts=chain.map(k=>project(posed.handles[side+'.'+k]));line(pts[0],pts[1]);line(pts[1],pts[2]);
    }
    if(state.pitch===0)for(let k=0;k<=model.height;k++){const [,y]=project([0,k,0]);line([0,y],[1000,y]);}
  }
  markers=[];
  if(handles)for(const [id,p] of Object.entries(posed.handles)){
    if(id.includes('.digit')&&el('focus').value!=='hand'&&id!==state.active)continue;
    const [x,y]=project(p);if(x<0||y<0||x>1000||y>1000)continue;
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',id===state.active?10:7);
    if(id===state.active)c.setAttribute('class','pick');
    nodes.push(c);markers.push({id,x,y});
  }
  svg.replaceChildren(...nodes);
}

function draw(){
  if(!ready)return;
  const s=settings(),focus=el('focus').value,size=Number(el('resolution').value);
  geometry(s);camera=commonFrame(beforeScene,posed.scene,state.yaw,state.pitch);
  const options={yaw:state.yaw,pitch:state.pitch,freeOrbit:true,cameraZoom:state.zoom,screenOffset:state.offset,portrait:focus||false,studyResolution:size>128?size:undefined,castShadows:el('castShadows').checked,isolateDetail:el('isolateDetail').checked&&['hand','foot'].includes(focus)};
  s.resolution=Math.min(size,128);el('isolateDetail').disabled=!['hand','foot'].includes(focus);
  const sceneFor=sc=>focus?sc:{...sc,...camera};
  const beforeKey=JSON.stringify([modelKey,size,options,state.pose,camera,el('silhouette').checked]);
  if(lastBefore!==beforeKey){paint('before',renderPixels(s,{...options,sceneOverride:sceneFor(beforeScene)}),el('silhouette').checked);lastBefore=beforeKey;}
  const strain=el('strain').checked;
  if(strain&&!strainCache)strainCache=inspectStrain(posed.scene);
  const r=renderPixels(s,{...options,sceneOverride:sceneFor(strain?strainCache.scene:posed.scene)});
  paint('after',r,el('silhouette').checked&&!strain);showMarkers(r);
  el('beforeTitle').textContent=el('previous').selectedOptions[0].text;
  el('status').textContent=s.heads+'등신 · 좌우 '+state.yaw.toFixed(1)+'° / 상하 '+state.pitch.toFixed(1)+'° · '+Math.round(state.zoom*100)+'% · '+r.width+'px';
  el('strainStatus').hidden=!strain;if(strain)el('strainStatus').textContent='중립 대비 변 길이 ±25% 초과 '+strainCache.count.toLocaleString()+'면 · 주황 늘어남 / 파랑 눌림';
}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
function markerAt(e,rect){
  const x=(e.clientX-rect.left)/rect.width*1000,y=(e.clientY-rect.top)/rect.height*1000;
  const radius=1000*(e.pointerType==='touch'?18:10)/rect.width;
  return markers.map(m=>({...m,d:Math.hypot(m.x-x,m.y-y)})).filter(m=>m.d<=radius).sort((a,b)=>Math.abs(a.d-b.d)<1?(a.id===state.active?-1:b.id===state.active?1:0):a.d-b.d)[0];
}
for(const id of ['leftViewport','rightViewport']){
  const view=el(id);
  view.onpointerdown=e=>{
    if(drag||e.button!==0||!posed)return;
    const rect=view.getBoundingClientRect(),hit=id==='rightViewport'&&el('handles').checked&&markerAt(e,rect);
    if(hit){state.active=hit.id;panel("pose");updateAxes();}
    drag={pointer:e.pointerId,view,hit:!!hit,x:e.clientX,y:e.clientY,width:rect.width,yaw:state.yaw,pitch:state.pitch,angle:state.pose[state.active]?.[state.axis]||0};
    view.setPointerCapture(e.pointerId);view.focus({preventScroll:true});e.preventDefault();schedule();
  };
  view.onpointermove=e=>{
    if(!drag||drag.pointer!==e.pointerId||drag.view!==view)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(drag.hit)changePose(drag.angle+dx/drag.width*240);
    else{state.yaw=wrap(drag.yaw+dx/drag.width*360);state.pitch=wrap(drag.pitch+dy/drag.width*360);schedule();}
  };
  const end=e=>{if(drag?.pointer!==e.pointerId||drag.view!==view)return;drag=null;schedule();};
  view.onpointerup=view.onpointercancel=view.onlostpointercapture=end;
  view.addEventListener('wheel',e=>{
    e.preventDefault();const rect=view.getBoundingClientRect();
    const old=state.zoom,next=Math.max(.45,Math.min(6,old*Math.exp(-e.deltaY*(e.deltaMode===1?.036:.0018))));
    const factor=next/old;state.zoom=next;state.offset=[e.clientX-rect.left,e.clientY-rect.top].map((v,i)=>{const at=v/(i?rect.height:rect.width)-.5;return at-(at-state.offset[i])*factor;});schedule();
  },{passive:false});
  view.onkeydown=e=>{
    const d=e.shiftKey?1:5,move={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key];
    if(move){e.preventDefault();state.yaw=wrap(state.yaw+move[0]);state.pitch=wrap(state.pitch+move[1]);schedule();}
  };
}

function changePreset(){stopMotion();state.pose=presetPose(el('preset').value,el('rangeMode').value);poseDirty=true;resetCam();updateAxes();schedule();}
el('preset').onchange=changePreset;
el('rangeMode').onchange=()=>{if(el('preset').value){changePreset();return;}for(const [id,axes] of Object.entries(state.pose))for(const [k,v] of Object.entries(axes))setAngle(state.pose,id,k,v,el('rangeMode').value);updateAxes();poseDirty=true;schedule();};
el('side').onchange=()=>{const side=el('side').value;state.active=side==='center'?'thorax':side+'.'+(state.active.includes('.')?kindOf(state.active):'shoulder');updateAxes();schedule();};
el('joint').onchange=()=>{state.active=el('joint').value;updateAxes();schedule();};el('axis').onchange=()=>{state.axis=el('axis').value;updateAxes();};
el('angle').oninput=()=>changePose(+el('angle').value);el('neutral').onclick=()=>{el('preset').value='중립';sync.preset();changePreset();};
el('fit').onclick=resetCam;el('pulse').onclick=()=>awake(4.7);el('pulseLeft').onclick=()=>awake(4.7,'left');
el('pauseMotion').onclick=()=>{
  frozen=!frozen;el('pauseMotion').setAttribute('aria-pressed',String(frozen));
  if(frozen){cancelAnimationFrame(motionFrame);motionFrame=0;}else if(Object.values(springs).some(s=>s.y||s.v)){lastTick=performance.now();motionFrame=requestAnimationFrame(step);}
  poseDirty=true;schedule();
};el('stopMotion').onclick=stopMotion;el('dynamics').onchange=stopMotion;
for(const [txt,y,p] of [['정면',0,0],['45도',45,0],['측면',90,0],['후면',180,0],['위',0,90],['아래',0,270]]){
  const btn=document.createElement('button');btn.textContent=txt;btn.onclick=()=>{state.yaw=y;state.pitch=p;schedule();};el('angles').append(btn);
}
const lines={};
function sliders(type,defs,variants){
  const parent=el(type+'Sliders');
  for(const [name,title] of Object.entries(defs)){
    const label=document.createElement('label'),range=document.createElement('input'),out=document.createElement('output');
    range.type='range';range.id=type+'-'+name;range.min=-100;range.max=100;range.step=1;range.value=0;label.append(title+' ',out,range);parent.append(label);
    range.oninput=()=>{state[type][name]=+range.value/100;out.textContent=range.value;for(const b of el(type+'Presets').querySelectorAll('button'))b.setAttribute('aria-pressed','false');schedule();};
    lines[type+name]=()=>{range.value=Math.round(100*(state[type][name]||0));out.textContent=range.value;};lines[type+name]();
  }
  buttons(el(type+'Presets'),'형태 바로 적용',Object.keys(variants).map(k=>[k,k]),k=>{state[type]={...variants[k]};Object.keys(defs).forEach(n=>lines[type+n]());schedule();});
}
sliders('body',bodyParams,bodyPresets);sliders('chest',chestParams,chestPresets);
el('saveShape').onclick=()=>{try{localStorage.setItem('friend-form33',JSON.stringify({body:state.body,chest:state.chest,sex:el('sex').value,heads:el('heads').value,style:el('style').value}));el('saveStatus').textContent='저장됨';}catch{el('saveStatus').textContent='이 환경의 저장 공간을 열 수 없습니다.';}};
el('loadShape').onclick=()=>{try{const d=JSON.parse(localStorage.getItem('friend-form33'));if(!d)throw Error();for(const k of ['sex','heads','style'])if([...el(k).options].some(o=>o.value===d[k])){el(k).value=d[k];sync[k]();}for(const [type,params] of [['body',bodyParams],['chest',chestParams]])state[type]=Object.fromEntries(Object.keys(params).map(k=>[k,Math.max(-1,Math.min(1,Number(d[type]?.[k])||0))]));Object.values(lines).forEach(fn=>fn());scope();updateAxes();el('saveStatus').textContent='복원됨';schedule();}catch{el('saveStatus').textContent='저장한 형태가 없습니다.';}};
function scope(){const s=settings(),adult=s.heads>=5&&s.sex==='female';el('scope').textContent=adult?'성인 여성 흉곽에 부착된 연부조직을 조정합니다.':'5~8등신 성인 여성 기본형에서 열립니다.';el('chestControls').hidden=!adult;}
for(const id of ['sex','heads','style','candidate','focus','resolution','previous','handles','strain','guides','castShadows','isolateDetail','silhouette']){
  el(id).addEventListener('change',()=>{if(id==='focus'){if(el(id).value==='ear')state.yaw=90;resetCam();}if(['sex','heads'].includes(id)){stopMotion();updateAxes();}scope();schedule();});
}
el('download').onclick=()=>{
  const left=el('before'),right=el('after'),c=document.createElement('canvas');c.width=left.width*2;c.height=left.height;
  const ctx=c.getContext('2d');ctx.drawImage(left,0,0);ctx.drawImage(right,left.width,0);
  const a=document.createElement('a');a.download='형태-관찰-33.png';a.href=c.toDataURL();a.click();
};

const initial=new URLSearchParams(location.search);
if(initial.get('focus')==='face')el('focus').value='face';
if(initial.get('panel')==='chest')el('focus').value='chest';
if(initial.get('pose')==='x'){el('preset').value='캡처 · 공중 X';state.pose=presetPose(el('preset').value,'human');}
if(['pose','shape','chest'].includes(initial.get('panel')))panel(initial.get('panel'));
Object.values(sync).forEach(fn=>fn());updateAxes();scope();
loadRig().then(()=>{ready=true;schedule();}).catch(err=>{el('status').textContent='관절 자료 오류 · '+err.message;});
