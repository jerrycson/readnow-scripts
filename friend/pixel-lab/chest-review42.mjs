import {DEFAULTS} from './model.mjs';
import {loadRig} from './rig32.mjs';
import {chest36} from './contour-model36.mjs';
import {chest38} from './chest38.mjs';
import {chest39} from './chest39.mjs';
import {chest40} from './chest40.mjs';
import {chest42} from './chest42.mjs';
import {bindSurface,surfaceParts} from './surface35.mjs';
import {pose34,raisedPose} from './bust34.mjs';
import {studyView} from './camera35.mjs';
import {portraitPixels} from './portrait48.mjs';
import {portraitAtResolution} from './render-resolution.mjs';
import {localChest39} from './comparison-local39.mjs';

const $=id=>document.getElementById(id);
const settings={...DEFAULTS,heads:8,designStyle:'manga',sex:'female',paperForm:'W',top:'none',showNac:true};
const angles=[
  ['정면',0,0],['왼 사선',-26.15,0],['오른 사선',26.15,0],
  ['왼 측면',-90,0],['오른 측면',90,0],['뒤',180,0],['위',0,75],['밑면',0,-75]
];
const canvases=[$('old'),$('new')];
const svgNS='http://www.w3.org/2000/svg';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fixed=x=>x.toFixed(2);
function svg(tag,attributes){
  const el=document.createElementNS(svgNS,tag);
  for(const [k,v] of Object.entries(attributes))el.setAttribute(k,v);
  return el;
}
function buttons(id,items,action){
  const host=$(id);
  for(const [key,label] of items){
    const b=document.createElement('button');
    b.type='button';b.dataset.key=key;b.textContent=label;
    b.addEventListener('click',()=>action(key));host.append(b);
  }
}
function pressed(id,key){
  for(const b of $(id).children)b.setAttribute('aria-pressed',String(b.dataset.key===String(key)));
}
async function json(file){
  const r=await fetch(file);
  if(!r.ok)throw Error(file+' 자료 응답 '+r.status);
  return r.json();
}

async function start(){
  const [ref,fit,report]=await Promise.all([json('traces36.json'),json('fit36.json'),json('chest-eval42.json'),loadRig()]);
  const neutral=chest36(settings,ref,fit.fit);
  const original=chest40(chest39(chest38(neutral,ref),ref),ref);
  const scenes=[original,chest42(original,ref)];
  const marks=scenes.map(s=>bindSurface(s,settings));
  const camera=studyView(neutral,false).sceneOverride;
  const options=new URL(location.href).searchParams;
  let cell=Object.hasOwn(report.paper,options.get('cell'))?options.get('cell'):'B3';
  let yaw=report.paper[cell].yaw,pitch=0,arm=0,size=192,zoom=1,local=false;
  let lastPose='',posed=[],queued=false,drag=null;
  function draw(){
    const key=arm+'/'+local;
    if(key!==lastPose){
      posed=scenes.map((model,i)=>{
        const body=arm?pose34(model,raisedPose(arm)).scene:model;
        const marked={...body,parts:[...body.parts,...surfaceParts(marks[i],body.parts[0])]};
        const shown=local?localChest39(marked,original):marked;
        return {...shown,frame:camera.frame,cameraCenter:camera.cameraCenter};
      });
      lastPose=key;
    }
    canvases.forEach((canvas,i)=>{
      const image=portraitAtResolution(portraitPixels,settings,{
        sceneOverride:posed[i],yaw,pitch,cameraZoom:zoom,freeOrbit:true
      },size);
      if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;}
      canvas.getContext('2d').putImageData(new ImageData(image.data,size,size),0,0);
      Object.assign(canvas.dataset,{version:i?'42':'40',yaw,pitch,arm,zoom,resolution:size,scope:local?'local':'body'});
    });
    $('arm').value=arm;$('armValue').value=arm+'°';$('skinInfo').hidden=!local;
    $('position').textContent='좌우 '+yaw.toFixed(1)+'° · 상하 '+pitch.toFixed(1)+'° · 양팔 '+arm+'° · '+size+' × '+size+'픽셀 · '+zoom.toFixed(2)+'배';
    pressed('poses',arm);pressed('sizes',size);
    pressed('angles',angles.findIndex(([,a,b])=>Math.abs(yaw-a)<.01&&Math.abs(pitch-b)<.01));
  }
  function redraw(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;draw();});
  }
  function reset(){
    yaw=report.paper[cell].yaw;pitch=0;arm=0;zoom=1;redraw();
  }
  function drawPlate(){
    const source=ref.paper[cell],row=report.paper[cell],plate=$('plate');
    plate.replaceChildren();
    plate.setAttribute('viewBox','0 0 '+source.size.join(' '));
    if($('source').checked){
      const [x,y]=source.box;
      const crop=svg('svg',{x:0,y:0,width:source.size[0],height:source.size[1],overflow:'hidden'});
      crop.append(svg('image',{href:'wallner-fig1-crop35.webp',x:-x,y:-y,width:Math.round(2007*725/1280),height:1143,preserveAspectRatio:'none'}));
      plate.append(crop);
    }
    for(const [id,lines,color,dash] of [
      ['trace',source.lines,'#007580',''],['oldLine',row.before.lines,'#73479a','3 2'],['newLine',row.after.lines,'#a23d17','']
    ]){
      if(!$(id).checked)continue;
      const group=svg('g',{'data-layer':id});
      for(const line of lines)group.append(svg('polyline',{points:line.map(p=>p.join(',')).join(' '),stroke:color,fill:'none',
        'stroke-width':1.5,'stroke-dasharray':dash,'stroke-linejoin':'round','vector-effect':'non-scaling-stroke'}));
      plate.append(group);
    }
    const pairs=row.before.errorsPx.map((v,i)=>fixed(v)+'→'+fixed(row.after.errorsPx[i]));
    $('metric').textContent=cell+' · '+(pairs.length===1?'측면 윤곽 오차 ':'가까운 쪽 / 먼 쪽 윤곽 오차 ')+pairs.join(' / ')+'픽셀 (40차→42차).';
    const before=row.before.floors[0],after=row.after.floors[0];
    const distance=side=>Math.abs(side.model.bottom-side.source.bottom);
    let note='최저점 높이 차 '+fixed(distance(before))+'→'+fixed(distance(after))+'픽셀.';
    if(report.photo.before[cell])note+=' 피부가 다시 밝아지는 경계의 차이는 '+fixed(report.photo.before[cell].absolute)+'→'+fixed(report.photo.after[cell].absolute)+'픽셀입니다.';
    if(!report.training.includes(cell))note+=' 이 도판은 후보를 고른 뒤에 대조했습니다.';
    $('boundary').textContent=note;
  }
  for(const canvas of canvases){
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0||drag)return;
      drag={canvas,id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(drag?.canvas!==canvas||drag.id!==e.pointerId)return;
      yaw=(yaw+(e.clientX-drag.x)*.75)%360;pitch=clamp(pitch+(e.clientY-drag.y)*.75,-90,90);
      drag.x=e.clientX;drag.y=e.clientY;redraw();
    });
    canvas.addEventListener('lostpointercapture',()=>{if(drag?.canvas===canvas)drag=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.0015),.5,3);redraw();},{passive:false});
    canvas.addEventListener('keydown',e=>{
      const delta={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];
      if(!delta)return;
      e.preventDefault();yaw=(yaw+delta[0])%360;pitch=clamp(pitch+delta[1],-90,90);redraw();
    });
  }
  buttons('angles',angles.map(([name],i)=>[i,name]),i=>{[,yaw,pitch]=angles[i];redraw();});
  buttons('poses',[0,45,90,135,178].map(n=>[n,n+'°']),n=>{arm=n;redraw();});
  buttons('sizes',[[48,'48픽셀'],[192,'192픽셀']],n=>{size=n;redraw();});
  $('arm').oninput=()=>{arm=Number($('arm').value);redraw();};
  $('localSkin').oninput=()=>{local=$('localSkin').checked;redraw();};
  $('reset').onclick=reset;
  const ordered=[...report.training,...report.holdout];
  for(const id of ordered)$('cell').append(new Option(id+' · '+(id[0]==='S'?'측면':'사선'),id));
  $('cell').value=cell;
  $('cell').onchange=()=>{
    cell=$('cell').value;
    const url=new URL(location.href);url.searchParams.set('cell',cell);history.replaceState(null,'',url);
    drawPlate();reset();
  };
  for(const id of ['source','trace','oldLine','newLine'])$(id).oninput=drawPlate;
  const a=report.metrics.before,b=report.metrics.after;
  $('summary').textContent='B3 가까운 바닥이 높은 정도는 '+fixed(a.bFloor)+'→'+fixed(b.bFloor)+'픽셀로 줄었습니다. A5 가까운 최저점의 높이 차는 '+fixed(a.aFloor)+'→'+fixed(b.aFloor)+'픽셀로, 명암 경계의 차이는 '+fixed(report.photo.before.A5.absolute)+'→'+fixed(report.photo.after.A5.absolute)+'픽셀로 커졌습니다. 뒤·밑·팔 올림에는 대응 원도판이 없습니다.';
  drawPlate();draw();document.body.dataset.ready='true';
  $('status').textContent='같은 카메라와 광원에서 40차와 42차 성인 W 기본형을 비교합니다.';
}
start().catch(e=>{$('status').textContent='비교 화면을 열 수 없습니다. '+e.message;document.body.dataset.ready='false';console.error(e);});
