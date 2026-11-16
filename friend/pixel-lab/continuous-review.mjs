
import {DEFAULTS} from './model.mjs';
import {renderPixels,bodyParts,projectPoint} from './renderer.mjs';
import {originalForm,foundation} from './foundation32.mjs';
import {joints,kindOf,setAngle,loadRig,poseScene,inspectStrain} from './rig32.mjs';
const el=id=>document.getElementById(id),svg=el('markers'),ns=svg.namespaceURI;
const state={yaw:0,pitch:0,pose:{},active:'right.elbow',axis:'bend'};
let model=null,modelKey='',posed,poseDirty=true,frame=0,drag=null,markers=[],lastBefore='',strainCache=null;
const label=id=>(id.startsWith('left.')?'왼쪽 ':id.startsWith('right.')?'오른쪽 ':'')+joints[kindOf(id)].label;
const wrap=x=>((x%360)+360)%360;
const settings=()=>({...DEFAULTS,sex:el('sex').value,heads:+el('heads').value,designStyle:el('style').value,candidate:el('candidate').value,resolution:Math.min(128,+el('resolution').value)});
function updateAxes(){
  const axes=joints[kindOf(state.active)].axes;
  if(!axes[state.axis])state.axis=Object.keys(axes)[0];
  el('joint').value=state.active;el('axis').replaceChildren(...Object.entries(axes).map(([k,[title]])=>new Option(title,k)));
  el('axis').value=state.axis;
  const [,min,max]=axes[state.axis];el('angle').min=min;el('angle').max=max;angleValue();
}
function angleValue(){
  const value=state.pose[state.active]?.[state.axis]||0;
  el('angle').value=value;el('readout').textContent=value+'°';
}
function changePose(value){
  setAngle(state.pose,state.active,state.axis,value);angleValue();poseDirty=true;schedule();
}
function geometry(s){
  const key=[s.sex,s.heads,s.designStyle,s.candidate,el('previous').value].join('/');
  if(key!==modelKey){
    modelKey=key;model=foundation(s);lastBefore='';poseDirty=true;
    geometry.before=el('previous').value==='8'?bodyParts(s):originalForm(s);
  }
  if(poseDirty){posed=poseScene(model,state.pose);strainCache=null;poseDirty=false;}
}
function paint(id,r,silhouette){
  if(silhouette)for(let i=0;i<r.data.length;i+=4)if(r.data[i+3])r.data.set([40,53,47],i);
  const c=el(id);c.width=r.width;c.height=r.height;c.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);
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
    const [x,y]=project(p);if(x<0||y<0||x>1000||y>1000)continue;
    const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',id===state.active?10:7);
    if(id===state.active)c.setAttribute('class','pick');
    nodes.push(c);markers.push({id,x,y});
  }
  svg.replaceChildren(...nodes);
}
function draw(){
  const s=settings(),focus=el('focus').value,originalSize=+el('resolution').value;
  geometry(s);
  const size=drag?Math.min(96,originalSize):originalSize;
  const options={yaw:state.yaw,pitch:state.pitch,freeOrbit:true,portrait:focus||false,studyResolution:size>128?size:undefined,castShadows:!drag&&el('castShadows').checked,isolateDetail:el('isolateDetail').checked&&['hand','foot'].includes(focus)};
  s.resolution=Math.min(size,128);el('isolateDetail').disabled=!['hand','foot'].includes(focus);
  const beforeKey=[modelKey,size,focus,state.yaw,state.pitch,options.castShadows,options.isolateDetail,el('silhouette').checked].join('/');
  if(beforeKey!==lastBefore){
    paint('before',renderPixels(s,{...options,sceneOverride:geometry.before}),el('silhouette').checked);lastBefore=beforeKey;
  }
  const strain=el('strain').checked;
  if(strain&&!strainCache)strainCache=inspectStrain(posed.scene);
  const r=renderPixels(s,{...options,sceneOverride:strain?strainCache.scene:posed.scene});
  paint('after',r,el('silhouette').checked&&!strain);showMarkers(r);
  el('beforeTitle').textContent=el('previous').value+'차 · 기준 자세';
  el('status').textContent=s.heads+'등신 · 좌우 '+state.yaw.toFixed(1)+'° · 위아래 '+state.pitch.toFixed(1)+'° · '+originalSize+' px';
  el('strainStatus').hidden=!strain;
  if(strain)el('strainStatus').textContent='전체 표면에서 기준 25% 초과 '+strainCache.count.toLocaleString()+'면 · 주황 늘어남 / 파랑 눌림';
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
    if(hit){state.active=hit.id;updateAxes();}
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
  view.onkeydown=e=>{
    const d=e.shiftKey?1:5,move={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key];
    if(move){e.preventDefault();state.yaw=wrap(state.yaw+move[0]);state.pitch=wrap(state.pitch+move[1]);schedule();}
  };
}
el('joint').replaceChildren(...['neck','jaw',...['right','left'].flatMap(side=>['shoulder','elbow','wrist','hip','knee','ankle'].map(k=>side+'.'+k))].map(id=>new Option(label(id),id)));
el('joint').onchange=()=>{state.active=el('joint').value;updateAxes();schedule();};
el('axis').onchange=()=>{state.axis=el('axis').value;updateAxes();};
el('angle').oninput=()=>changePose(+el('angle').value);
el('neutral').onclick=()=>{state.pose={};poseDirty=true;angleValue();schedule();};
el('front').onclick=()=>{state.yaw=state.pitch=0;schedule();};
for(const id of ['sex','heads','style','candidate','focus','resolution','previous','handles','strain','guides','castShadows','isolateDetail','silhouette']){
  el(id).onchange=()=>{if(id==='focus'&&el(id).value==='ear')state.yaw=90;schedule();};
}
el('download').onclick=()=>{
  const left=el('before'),right=el('after'),c=document.createElement('canvas');c.width=left.width*2;c.height=left.height;
  const ctx=c.getContext('2d');ctx.drawImage(left,0,0);ctx.drawImage(right,left.width,0);
  const a=document.createElement('a');a.download='형태-관찰-32.png';a.href=c.toDataURL();a.click();
};
updateAxes();
loadRig().then(schedule).catch(err=>{el('status').textContent='관절 자료를 열 수 없습니다. '+err.message;});
