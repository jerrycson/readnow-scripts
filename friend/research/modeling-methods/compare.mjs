import {buildSculptBase,renderSculpt,displayScene,defaultView,zero,axes,posed,sculpt,surfaceZones,pivotChoices,pivotSpec,subjects} from '../../pixel-lab/studio-sculpt-model.mjs';
import {loadRig} from '../../pixel-lab/rig32.mjs';
import {eye40} from '../../pixel-lab/eye40.mjs';
import {bindSurface} from '../../pixel-lab/surface35.mjs';
import {candidateFace47} from '../../pixel-lab/face47.mjs';
import {makeChest47} from '../../pixel-lab/chest47.mjs';
import {mountMultiview} from './multiview.mjs';
import {mountSurfaceControls} from '../../pixel-lab/studio-surface-controls46.mjs';
import {mountAngle46} from '../../pixel-lab/studio-angle46.mjs';

const el=id=>document.getElementById(id);
const models=new Map(),sessions=new Map();
let id,model,session,zone,scenes,shapeKey,scheduled=false,assets;
const view={yaw:0,pitch:0,zoom:1,size:48};
const wrap=v=>((v+180)%360+360)%360-180;
function setView(values){Object.assign(view,values);schedule();}
function buttons(host,options,value,click){
  el(host).replaceChildren(...options.map(([key,label])=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.key=key;
    b.setAttribute('aria-pressed',String(key===value));b.onclick=()=>click(key);return b;
  }));
}
function paint(canvas,frame){
  if(canvas.width!==frame.width||canvas.height!==frame.height){canvas.width=frame.width;canvas.height=frame.height;}
  canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(frame.data),frame.width,frame.height),0,0);
}
const panel=mountMultiview(el('multi'),{render:renderSculpt,openAngle:setView});
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(redraw);}}
function redraw(){
  scheduled=false;
  try{
    const camera={...defaultView(id),...view,pivot:session.pivot,angle:session.angle};
    const key=JSON.stringify([id,session.values,session.pivot,session.angle]);
    if(shapeKey!==key){
      const edited=sculpt(model.research49,id,session.values);
      scenes=[displayScene(model,'published40',posed(model.published40,id,camera)),displayScene(model,'research49',posed(edited,id,camera))];
      shapeKey=key;
    }
    paint(el('before'),renderSculpt(model,scenes[0],camera));paint(el('after'),renderSculpt(model,scenes[1],camera));
    panel.update(model,...scenes,camera);
    el('status').textContent=subjects[id]+' · 좌우 '+view.yaw.toFixed(1)+'° · 상하 '+view.pitch.toFixed(1)+'° · '+view.size+'px · '+view.zoom.toFixed(1)+'배';
    el('status').dataset.ready=id;el('undo').disabled=!session.history.length;
  }catch(e){el('status').textContent='교정 화면 오류 · '+e.message;console.error(e);}
}
function undoPoint(){return {values:{...session.values},pivot:session.pivot,angle:session.angle};}
function start(){session.before??=undoPoint();}
function commit(){
  if(session.before&&JSON.stringify(session.before)!==JSON.stringify(undoPoint()))session.history.push(session.before);
  session.before=null;if(session.history.length>80)session.history.shift();schedule();
}
const surface=mountSurfaceControls({zone:()=>zone,labels:()=>axes(id),values:()=>session.values,
  preview:values=>{start();session.values=values;surface.refresh();schedule();},commit});
let dial;
function setJoint(){
  const s=pivotSpec(session.pivot);el('joint').value=session.pivot;
  for(const input of [el('pose'),el('deg')]){input.min=s.min;input.max=s.max;input.step=1;input.value=session.angle;}
  dial?.sync();
}
function setZone(key){zone=model.zones.find(z=>z.key===key)||model.zones[0];session.zone=zone.key;
  buttons('regionbar',model.zones.map(z=>[z.key,z.label]),zone.key,setZone);surface.refresh();
}
function change(key){
  if(session)commit();
  id=key;
  if(!models.has(id)){
    const m=buildSculptBase(id,assets);
    m.published40=id==='M01'?eye40(m.prior,id):m.prior;
    m.research49=id==='W'?makeChest47(m.prior,assets.traces):candidateFace47(id==='F02'?m.next:m.prior,id);
    if(id==='W'){m.bindings.published40=m.bindings.prior;m.bindings.research49=bindSurface(m.research49,m.settings);}
    m.zones=surfaceZones(m.research49,id);models.set(id,m);
  }
  model=models.get(id);if(!sessions.has(id))sessions.set(id,{values:zero(id),pivot:defaultView(id).pivot,angle:0,zone:null,history:[],before:null});
  session=sessions.get(id);setZone(session.zone);
  el('joint').replaceChildren(...pivotChoices(id).map(k=>new Option(pivotSpec(k).label,k)));setJoint();
  buttons('subjects',Object.entries(subjects),id,change);
  el('original49').href='../../pixel-lab/studio-sculpt.html?round=49&case='+id;
  const url=new URL(location.href);url.searchParams.set('case',id);history.replaceState(null,'',url);
  shapeKey=null;schedule();
}
function sizes(n){view.size=n;buttons('sizes',[48,96,192,256,512].map(x=>[x,x+'px']),n,sizes);schedule();}
for(const canvas of [el('before'),el('after')]){
  let last;
  canvas.onpointerdown=e=>{if(e.button)return;canvas.setPointerCapture(e.pointerId);last=[e.clientX,e.clientY];};
  canvas.onpointermove=e=>{if(last){setView({yaw:wrap(view.yaw+(e.clientX-last[0])*.65),pitch:wrap(view.pitch+(e.clientY-last[1])*.5)});last=[e.clientX,e.clientY];}};
  canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>last=null;
  canvas.onwheel=e=>{e.preventDefault();setView({zoom:Math.max(.5,Math.min(2.5,view.zoom+(e.deltaY<0?.1:-.1)))});};
  canvas.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowDown:[0,-5],ArrowUp:[0,5]}[e.key];if(d){e.preventDefault();setView({yaw:wrap(view.yaw+d[0]),pitch:wrap(view.pitch+d[1])});}};
}
el('joint').onchange=e=>{start();session.pivot=e.target.value;session.angle=0;setJoint();commit();};
el('pose').oninput=e=>{start();session.angle=e.target.valueAsNumber;setJoint();schedule();};
el('pose').onchange=commit;el('deg').addEventListener('change',commit);
el('undo').onclick=()=>{commit();const last=session.history.pop();if(last){Object.assign(session,last);setJoint();surface.refresh();schedule();}};
el('reset').onclick=()=>{start();session.values=zero(id);session.angle=0;setJoint();surface.refresh();commit();};
el('copyFeedback').onclick=async()=>{
  if(!session)return;
  const edits=Object.entries(session.values).filter(([,v])=>v!==0).map(([k,v])=>axes(id)[k]+' '+v).join(', ')||'기본형';
  const text='49차 · '+el('status').textContent+' · '+pivotSpec(session.pivot).label+' '+session.angle+'° · '+edits;
  try{await navigator.clipboard.writeText(text);el('copied').textContent=' 복사됨';}catch{el('copied').textContent=text;}
};
async function main(){
  const read=async name=>{const r=await fetch('../../pixel-lab/'+name+'.json');if(!r.ok)throw Error(name+' '+r.status);return r.json();};
  const [atlas,traces,fit]=await Promise.all([read('atlas35'),read('traces36'),read('fit36'),loadRig()]);
  assets={atlas,traces,fit};const requested=new URL(location.href).searchParams.get('case');
  change(Object.hasOwn(subjects,requested)?requested:'F02');sizes(48);
  dial=mountAngle46({host:el('dial'),range:el('pose'),number:el('deg'),joint:el('joint')});
}
main().catch(e=>{el('status').textContent='모델을 열 수 없습니다 · '+e.message;console.error(e);});