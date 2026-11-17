import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {settings,ref,start,registrations,visible,cellResult,meshCheck,poseCheck} from './chest38.mjs';
import {foldMeasure} from './chest39.mjs';
import {stress,curvature,floatingArc} from './chest40.mjs';
import {chest38} from '../chest38.mjs';
import {chest39} from '../chest39.mjs';
import {chest40} from '../chest40.mjs';
import {chest42} from '../chest42.mjs';
import {studyView} from '../camera35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';

// 그림 1 원본에서 같은 필터로 읽은 명암 상승 위치. 좌표는 원도판의 픽셀이다.
const sourceRises={
  B3:{first:114,ys:[122,123,123,124,124,125,125,126,126,126,127,127,127,127,128,128,128,128,128,128,128,128,128,128,128,128,128,128,127,127,127,126,126,126,125,125,124,124,123,123,122,121,120]},
  A5:{first:99,ys:[123,124,125,126,126,127,127,128,128,129,129,129,130,130,130,130,131,131,131,131,131,131,131,131,131,131,131,131,131,131,130,130,130,130,129,129,129,128,128]},
  S3:{first:22,ys:[97,98,99,99,100,100,100,100,100,100,100,99,99,98,98,97,97,96,96]},
};
// 512픽셀 렌더를 37차 도판 등록 좌표에 역투영한다.
function rotation([x,y,z],yaw){
  const a=yaw*Math.PI/180;
  return [x*Math.cos(a)+z*Math.sin(a),-y,z*Math.cos(a)-x*Math.sin(a)];
}
function raster(scene,id,env){
 const yaw=id[0]==='S'?-90:-26.15,cam=env.camera[id],mark=bindSurface(scene,settings);
 const fixed=studyView(env.neutral,false).sceneOverride,shown={...scene,parts:[...scene.parts,...surfaceParts(mark,scene.parts[0])],frame:fixed.frame,cameraCenter:fixed.cameraCenter};
 const image=portraitPixels(settings,{sceneOverride:shown,yaw,pitch:0,freeOrbit:true,studyResolution:512});
 const center=rotation(image.projection.center,yaw),scale=image.projection.scale,[c,s,tx,ty]=cam,det=c*c+s*s;
 const [width,height]=ref.paper[id].size,rgb=Buffer.alloc(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x-tx,v=y-ty,wx=(c*u+s*v)/det,wy=(-s*u+c*v)/det;
  const ix=Math.round(256+(wx-center[0])*scale),iy=Math.round(256+(wy-center[1])*scale),off=4*(iy*512+ix);
  const d=3*(y*width+x);
  for(let k=0;k<3;k++)rgb[d+k]=ix<0||iy<0||ix>=512||iy>=512||!image.data[off+3]?255:image.data[off+k];
 }
 return {width,height,rgb};
}
function lower(lines,x){
 let y=-Infinity;
 for(const l of lines)for(let i=1;i<l.length;i++){
  const [a,b]=[l[i-1],l[i]];if((x-a[0])*(x-b[0])>0||Math.abs(a[0]-b[0])<1e-7)continue;
  y=Math.max(y,a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));
 }
 return y;
}

function pixelEdges(registered){
 const out={};
 for(const [id,{first,ys}] of Object.entries(sourceRises)){
  const {width,rgb}=registered[id];
  const lum=(x,y)=>{const i=(y*width+x)*3;return .2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2];};
  const diffs=ys.map((rise,i)=>{
   const x=first+i,y=Math.round(lower([ref.paper[id].lines[0]],x)),at=t=>[x-1,x,x+1].reduce((s,a)=>s+(lum(a,t-1)+2*lum(a,t)+lum(a,t+1))/12,0);
   const gain=t=>at(t+1)-at(t-1);
   let edge=y-17,best=-Infinity;
   for(let t=y-17;t<=y+11;t++){const g=gain(t);if(g>best){best=g;edge=t;}}
   return {x,offset:rise-edge,gain:best};
  });
  out[id]={columns:diffs.length,samples:diffs.map(({x,offset})=>[x,offset]),absolute:diffs.reduce((s,r)=>s+Math.abs(r.offset),0)/diffs.length,
   median:diffs.map(r=>r.offset).sort((a,b)=>a-b)[Math.floor(diffs.length/2)],readable:diffs.filter(r=>r.gain>=3).length};
 }
 return out;
}

const views=[
 {yaw:0,pitch:0,arm:0},{yaw:-26.15,pitch:0,arm:0},{yaw:-90,pitch:0,arm:0},
 {yaw:26.15,pitch:0,arm:90},{yaw:90,pitch:0,arm:178},{yaw:-90,pitch:0,arm:178},
 {yaw:38.7,pitch:-22,arm:73},{yaw:-64.9,pitch:17,arm:123},{yaw:151.2,pitch:19,arm:48},{yaw:0,pitch:-34,arm:178}
];
function frames(scene,neutral){
 const mark=bindSurface(scene,settings),fixed=studyView(neutral,false).sceneOverride;
 return views.map(({yaw,pitch,arm})=>{
  const body=arm?pose34(scene,raisedPose(arm)).scene:scene;
  const shown={...body,parts:[...body.parts,...surfaceParts(mark,body.parts[0])],frame:fixed.frame,cameraCenter:fixed.cameraCenter};
  return Object.fromEntries([48,192].map(size=>[size,portraitAtResolution(portraitPixels,settings,{sceneOverride:shown,yaw,pitch,freeOrbit:true},size)]));
 });
}
function pixels(old,next){
 let changed=0,sum=0;for(let i=0;i<old.data.length;i+=4){
  let d=0;for(let k=0;k<4;k++)d+=Math.abs(next.data[i+k]-old.data[i+k]);
  if(d)changed++;sum+=d;
 }
 return {changed,sum,hash:createHash('sha256').update(next.data).digest('hex')};
}
function region(a,b,x0,x1,y0,y1){
 let changed=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const i=(y*a.width+x)*3;if([0,1,2].some(k=>a.rgb[i+k]!==b.rgb[i+k]))changed++;
 }
 return {x0,x1,y0,y1,changed,area:(x1-x0+1)*(y1-y0+1)};
}
function contact(before,after){
 const buckets={lower:{vertices:0,moved:0,maxMove:0},return:{vertices:0,moved:0,maxMove:0},lateral:{vertices:0,moved:0,maxMove:0}};
 before.restSkin35.forEach(({p:[x,y,z]},i)=>{
  if(z<.05)return;const hand=Math.sign(x),f=before.paperShape.frame(hand),q=(x-f.c)*hand/f.root;
  if(Math.abs(q)>=.995)return;const g=before.paperShape.frame(hand,hand*q),u=(g.top-y)/(g.top-g.foot);
  const b=u>=.965&&u<=1.035&&Math.abs(q)<=.72?buckets.return:q>=.8&&q<=.99&&u>=.05&&u<=.96?buckets.lateral:Math.abs(q)<=.58&&u>=.60&&u<=.90?buckets.lower:null;
  if(!b)return;b.vertices++;
  const a=before.parts[0].vertices[i].p,p=after.parts[0].vertices[i].p,d=Math.hypot(...p.map((v,k)=>v-a[k]));
  if(d>1e-7)b.moved++;b.maxMove=Math.max(b.maxMove,d);
 });
 return buckets;
}
function curveMeasure(actual){
 const source=[ref.paper.B3.lines[0]],model=actual.lines.slice(0,actual.runsBySide[0]),residual=[];
 for(let x=117;x<=153;x++){
  const turn=l=>{const ya=lower(l,x-3),yb=lower(l,x),yc=lower(l,x+3);return (Math.atan2(yc-yb,3)-Math.atan2(yb-ya,3))*180/Math.PI;};
  const a=turn(source),b=turn(model);if(Number.isFinite(a+b))residual.push(Math.abs(a-b));
 }
 return {samples:residual.length,meanError:residual.reduce((a,b)=>a+b,0)/residual.length};
}

const reference=curvature(ref.paper.S3.lines);
function metrics(scene,setup,paper){
 const oblique=visible(scene,-26.15,setup.neutral),side=visible(scene,-90,setup.neutral);
 const {B3:b,S3:s,A5:a}=paper;
 const shape=curvature(s.lines),target=new Map(reference.samples);
 const residual=shape.samples.map(([x,turn])=>Math.abs(turn-target.get(x)));
 const floor=chart=>Math.abs(chart.floors[0].model.bottom-chart.floors[0].source.bottom);
 const full=cellResult(oblique,'B3',setup.camera.B3,false),turn=floatingArc(full.lines.slice(0,full.runsBySide[0]));
 const profileFull=cellResult(side,'S3',setup.camera.S3,false);
 return {near:b.errorsPx[0],far:b.errorsPx[1],sTurn:floatingArc(profileFull.lines).maxTurn,bTurn:turn.maxTurn,bFloor:floor(b),bWidth:Math.abs(b.floors[0].model.width-b.floors[0].source.width),
   bFarFloor:Math.abs(b.floors[1].model.bottom-b.floors[1].source.bottom),aFloor:floor(a),
   sFloor:floor(s),sWidth:Math.abs(s.floors[0].model.width-s.floors[0].source.width),side:s.errorsPx[0],
  aNear:a.errorsPx[0],aFar:a.errorsPx[1],turn:shape.maxTurn,refTurn:reference.maxTurn,
  turnMae:residual.reduce((a,b)=>a+b,0)/residual.length,turnCount:residual.length};
}

function fillBand(cell){
 const model=cell.lines.slice(0,cell.runsBySide[0]),reference=[ref.paper.B3.lines[0]];
 const gaps=[];
 for(let x=114;x<=156;x++){
  const y=lower(model,x);if(Number.isFinite(y))gaps.push(lower(reference,x)-y);
 }
 return {centralMean:gaps.reduce((s,v)=>s+v,0)/gaps.length,centralCount:gaps.length};
}

function compare(actual,expected,path){
  if(typeof expected==='number'){
    if(Number.isInteger(expected))assert.equal(actual,expected,path);
    else assert(Math.abs(actual-expected)<1e-8,path+' '+actual+' / '+expected);
    return;
  }
  if(expected&&typeof expected==='object'){
    assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),path);
    for(const key of Object.keys(expected))compare(actual[key],expected[key],path+'.'+key);
    return;
  }
  assert.equal(actual,expected,path);
}

export async function evaluate42(){
  const report=JSON.parse(fs.readFileSync(new URL('../chest-eval42.json',import.meta.url)));
  const neutral=await start(),camera=registrations(neutral),env={neutral,camera};
  const before=chest40(chest39(chest38(neutral,ref),ref),ref);
  const original=structuredClone(before.parts[0].vertices);
  const after=chest42(before,ref);
  assert.equal(after.restSkin35,before.restSkin35);
  assert.equal(chest42(before,{}),before);
  const other={...before,paperShape:{...before.paperShape,form:{id:'other'}}};
  assert.equal(chest42(other,ref),other);
  const allFrames={},plates={},paper={};
  for(const [version,scene] of Object.entries({before,after})){
    const rays=new Map([-26.15,-90].map(yaw=>[yaw,visible(scene,yaw,neutral)]));
    const measured={};
    for(const id of Object.keys(ref.paper)){
      const yaw=id[0]==='S'?-90:-26.15;
      measured[id]=cellResult(rays.get(yaw),id,camera[id]);
      paper[id]??={yaw,camera:camera[id]};
      paper[id][version]=measured[id];
    }
    const registered=Object.fromEntries(Object.keys(sourceRises).map(id=>[id,raster(scene,id,env)]));
    plates[version]=registered.B3;
    compare(pixelEdges(registered),report.photo[version],'photo.'+version);
    compare({...metrics(scene,env,measured),...fillBand(measured.B3)},report.metrics[version],'metrics.'+version);
    compare(curveMeasure(measured.B3),report.curve[version],'curve.'+version);
    compare(foldMeasure(scene),report.front[version],'front.'+version);
    compare(stress(scene,neutral,camera),report.stresses[version],'stresses.'+version);
    allFrames[version]=frames(scene,neutral);
  }
  compare(paper,report.paper,'paper');
  const improved=report.holdout.filter(id=>{
    const sum=row=>row.errorsPx.reduce((a,b)=>a+b,0);
    return sum(paper[id].after)<sum(paper[id].before);
  });
  assert.deepEqual(improved,report.improved);
  for(const id of report.training){
    paper[id].after.errorsPx.forEach((err,i)=>assert(err<paper[id].before.errorsPx[i]));
  }
  const images=views.map((view,i)=>({...view,...Object.fromEntries([48,192].map(size=>
    [size,pixels(allFrames.before[i][size],allFrames.after[i][size])]))}));
  compare(images,report.images,'images');
  compare(meshCheck(before,after),report.mesh,'mesh');
  compare(contact(before,after),report.material,'material');
  const poses=[0,15,30,45,60,75,90,105,120,135,150,165,178].map(arm=>{
    const posed=scene=>arm?pose34(scene,raisedPose(arm)).scene:scene;
    const m=meshCheck(posed(before),posed(after));
    assert.equal(m.turnsOver90,0);
    return {arm,turnsOver90:m.turnsOver90,minAreaRatio:m.minAreaRatio};
  });
  compare(poses,report.poses,'poses');
  const bindings=poseCheck(before,after).filter(row=>row.version==='after')
    .map(({arm,maxAttachmentError})=>({arm,maxAttachmentError}));
  compare(bindings,report.bindings,'bindings');
  const {before:a,after:b}=plates;
  compare({axillary:region(a,b,171,192,49,96),thoracic:region(a,b,114,156,145,162)},
    report.registeredSkinRegions,'registeredSkinRegions');
  assert.deepEqual(before.parts[0].vertices,original);
  return {round:42,geometryVertices:report.mesh.changedVertices,sourceCells:Object.keys(paper).length,
    photoColumns:Object.values(sourceRises).reduce((n,s)=>n+s.ys.length,0),armPoses:poses.length,
    actualFrames:images.length*2,improvedHoldout:improved};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(JSON.stringify(await evaluate42()));
}
