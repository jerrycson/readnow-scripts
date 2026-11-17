import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {settings,start,ref,registrations,visible,cellResult,meshCheck,poseCheck} from './chest38.mjs';
import {foldMeasure} from './chest39.mjs';
import {stress,curvature} from './chest40.mjs';
import {chest38} from '../chest38.mjs';
import {chest39} from '../chest39.mjs';
import {chest40} from '../chest40.mjs';
import {chest42} from '../chest42.mjs';
import {makeChest47,fit47} from '../chest47.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';
import {studyView} from '../camera35.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';

export async function setup47(){
  const neutral=await start(),camera=registrations(neutral);
  const base=chest40(chest39(chest38(neutral,ref),ref),ref);
  return {neutral,camera,base,held:chest42(base,ref)};
}
const training=['B3','S3','A5'];
const sum=a=>a.reduce((s,x)=>s+x,0);
// Preserve every coefficient exactly. A decimal can accidentally resemble a
// phone number to the publication scanner; an integer significand avoids that.
function archiveJSON(value) {
 const phone=/(?<![0-9A-Za-z])01[016789][-. ]?\d{3,4}[-. ]?\d{4}(?![0-9A-Za-z])/;
 return JSON.stringify(value).replace(/-?\d+\.\d+(?:e[+-]?\d+)?/g, token=>{
   if(!phone.test(token))return token;
   const [mantissa,power='0']=token.split('e'),digits=mantissa.split('.')[1].length;
   const coefficient=mantissa.replace('.','').replace(/^(-?)0+(?=\d)/,'$1');
   const result=coefficient+'e'+(Number(power)-digits);
   assert.equal(Number(result),Number(token));return result;
 });
}
const targetTurn=new Map(curvature(ref.paper.S3.lines).samples);
function evaluateShape(scene,env,all=false) {
  const oblique=visible(scene,-26.15,env.neutral),side=visible(scene,-90,env.neutral);
  const cells=Object.fromEntries((all?Object.keys(ref.paper):training).map(id=>
    [id,cellResult(id.startsWith('S')?side:oblique,id,env.camera[id])]));
  const {B3:b,S3:s,A5:a}=cells, arc=curvature(s.lines);
  const error=c=>c.floors[0].source.bottom-c.floors[0].model.bottom;
  const metrics={near:b.errorsPx[0],far:b.errorsPx[1],side:s.errorsPx[0],aNear:a.errorsPx[0],aFar:a.errorsPx[1],
    bFloor:error(b),sFloor:error(s),aFloor:error(a),sTurn:sum(arc.samples.map(([x,t])=>Math.abs(targetTurn.get(x)-t)))/arc.samples.length};
  return {cells,metrics};
}
function imageMetrics(scene,env) {
  const images=Object.fromEntries(training.map(id=>[id,raster(scene,id,env)]));
  const photo=Object.fromEntries(Object.entries(pixelEdges(images)).map(([id,v])=>[id,v.absolute]));
  return {photo,fold:foldMeasure(scene)};
}
function objective(m) {
  const over=(v,limit)=>Math.max(0,v-limit);
  return m.near+.7*m.bFloor+.5*m.side+.10*m.sTurn +
    5*over(m.side,1.82)+3*over(m.aNear,1.31)+2*over(m.aFar,5.89)+4*over(m.far,1.675)+
    .9*over(Math.abs(m.sFloor),2.07)+.7*over(Math.abs(m.aFloor),1.33)+.4*over(m.sTurn,11.7);
}
export async function search47(count=220) {
  const env=await setup47(), trials=[];
  let seed=47;
  const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  const between=(a,b)=>a+random()*(b-a);
  for(let i=0;i<count;i++){
    const fit=i?{mix:between(.05,1.15),center:between(-.63,.60),top:between(.69,.91),spread:between(.09,.36),depth:between(.045,.145),
      drop:between(-.013,.078),forward:between(-.045,.055),lateral:between(-.035,.035)}:
      {mix:.7,center:.1,top:.77,spread:.26,depth:.10,drop:.018,forward:.012,lateral:0};
    const scene=makeChest47(env.base,ref,fit),{metrics}=evaluateShape(scene,env);
    trials.push({fit,metrics,score:objective(metrics)});
  }
  const best=trials.slice().sort((a,b)=>a.score-b.score).slice(0,24);
  for(const row of best) {
    const s=makeChest47(env.base,ref,{...row.fit,normalBlend:1,normalCap:180});
    Object.assign(row,imageMetrics(s,env),{mesh:meshCheck(env.base,s)});
  }
  return {count,trials,finalists:best};
}

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

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]==='--search'){
 const report=await search47(Number(process.argv[3])||220);
 writeFileSync(new URL('../chest-trials47.json',import.meta.url),archiveJSON(report));
 console.log(JSON.stringify(report.finalists.slice(0,2)));
}

// Refine seeded candidates with continuous geometry first, then render the
// finalists. Limit the optimizer to the three published neutral targets.
export async function refine47(count=420) {
 const env=await setup47();
 let seed=41047;
 const rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const zero={mix:1,center:.25,top:.8,spread:.28,depth:.09,drop:0,forward:0,lateral:0,returnCenter:-.25,returnDrop:0,returnFront:0};
 const ranges={mix:[.1,1.30],center:[-.65,.65],top:[.65,.91],spread:[.10,.37],depth:[.047,.14],drop:[-.03,.12],forward:[-.07,.08],lateral:[-.04,.04],returnCenter:[-.64,.59],returnDrop:[-.08,.09],returnFront:[-.065,.07]};
 const cost=m=>.6*m.bFloor+1.65*m.near+1.5*m.far+1.6*m.side+.21*m.sTurn+1.4*m.aNear+.2*m.aFar+
   13*Math.max(0,m.side-1.78)+17*Math.max(0,m.aNear-1.29)+6*Math.max(0,m.far-1.65)+
   2.6*Math.max(0,m.sTurn-12.2)+1.3*Math.max(0,Math.abs(m.sFloor)-2.35);
 const assess=fit=>{const model=makeChest47(env.base,ref,fit),{metrics}=evaluateShape(model,env);return {fit,metrics,score:cost(metrics)};};
 const initial=JSON.parse(readFileSync(new URL('../chest-trials47.json',import.meta.url)));
 const starts=initial.trials.slice().sort((a,b)=>cost(a.metrics)-cost(b.metrics)).slice(0,12).map(r=>({...zero,...r.fit}));
 const pool=[zero,...starts].map(assess),trials=[...pool];
 const keys=Object.keys(ranges);
 for(let i=0;i<count;i++){
   const parent=i%pool.length;
   const fit={...pool[parent].fit};
   for(let k=0;k<1+i%4;k++){
     const key=keys[Math.floor(rand()*keys.length)],[lo,hi]=ranges[key],radius=(hi-lo)*(.30-.22*i/count);
     fit[key]=Math.max(lo,Math.min(hi,fit[key]+radius*(2*rand()-1)));
   }
   const row=assess(fit);
   if(row.score<pool[parent].score)pool[parent]=row;
   trials.push(row);
 }
 const choices=[],seen=new Set();
 for(const mode of [row=>row.score,row=>row.metrics.bFloor+.4*row.metrics.near,row=>row.metrics.sTurn,row=>row.metrics.aNear,row=>row.metrics.side]){
   const sorted=trials.filter(r=>r.metrics.side<1.82&&r.metrics.aNear<1.312&&r.metrics.far<1.678&&r.metrics.bFloor<7.7&&r.metrics.near<6.89)
    .sort((a,b)=>mode(a)-mode(b));
   for(const row of sorted){const m=row.metrics,key=[m.sTurn,m.near,m.bFloor,m.aNear].map(v=>v.toFixed(2)).join();
     if(seen.has(key))continue;seen.add(key);choices.push(row);if(choices.length%14===0)break;
   }
 }
 const finalists=[];
 for(const r of choices){
  const model=makeChest47(env.base,ref,r.fit),mesh=meshCheck(env.base,model);
  if(mesh.turnsOver90||mesh.minAreaRatio<.25)continue;
  finalists.push({...r,...imageMetrics(model,env),mesh});
 }
 return {seed:41047,count,trials,finalists};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]==='--refine'){
 const report=await refine47(Number(process.argv[3])||420);
 writeFileSync(new URL('../chest-refine47.json',import.meta.url),archiveJSON(report));
 console.log('세부 탐색',report.count,'실렌더',report.finalists.length);
}

export async function tuneImages47(count=224){
 const env=await setup47(),from=JSON.parse(readFileSync(new URL('../chest-refine47.json',import.meta.url)));
 const empty={mix:1,center:.25,top:.8,spread:.28,depth:.09,drop:0,forward:0,lateral:0,returnCenter:-.25,returnDrop:0,returnFront:0,normalBlend:.75,normalCap:10};
 const starts=[empty,...[0,6,4,15,33].filter(i=>from.finalists[i]).map(i=>({...empty,...from.finalists[i].fit}))];
 let seed=47042;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const ranges={mix:[.25,1.3],center:[-.6,.62],top:[.65,.9],spread:[.10,.34],depth:[.052,.14],drop:[-.04,.10],forward:[-.08,.08],lateral:[-.04,.04],returnCenter:[-.64,.59],returnDrop:[-.07,.07],returnFront:[-.065,.07],normalBlend:[.2,1],normalCap:[3,18]};
 const over=(v,goal)=>Math.max(0,v-goal);
 const assess=fit=>{
   const scene=makeChest47(env.base,ref,fit),{metrics:m}=evaluateShape(scene,env);
   const {photo:p,fold}=imageMetrics(scene,env);
   const score=.85*m.bFloor+.5*m.near+.20*m.sTurn+2*p.B3+3*p.S3+5*p.A5
    +5*over(p.B3,7.65)+14*over(p.A5,1.1795)+6*over(p.S3,1.79)
    +8*over(m.sTurn,12)+7*over(m.side,1.79)+9*over(m.aNear,1.31)+8*over(m.far,1.67)+2*over(8.5,fold.meanFirst);
   return {fit,metrics:m,photo:p,fold,score};};
 const pool=starts.map(assess),trials=[...pool],keys=Object.keys(ranges);
 for(let i=0;i<count;i++){
  const k=i%pool.length,fit={...pool[k].fit};
  for(let n=0;n<1+(i%3);n++){
   const p=keys[Math.floor(rand()*keys.length)],[lo,hi]=ranges[p],radius=(hi-lo)*(.25-.19*i/count);
   fit[p]=Math.max(lo,Math.min(hi,fit[p]+(2*rand()-1)*radius));
  }
  const row=assess(fit);if(row.score<pool[k].score)pool[k]=row;trials.push(row);
 }
 return {seed:47042,count,trials,finalists:pool.sort((a,b)=>a.score-b.score)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]==='--tune'){
 const results=await tuneImages47(Number(process.argv[3])||224);
 writeFileSync(new URL('../chest-light47.json',import.meta.url),archiveJSON(results));console.log('조명·윤곽 결합',results.count);
}

const views47=[
 {yaw:-26.15,pitch:0,arm:0},{yaw:-90,pitch:0,arm:0},{yaw:0,pitch:0,arm:0},
 {yaw:-52.75,pitch:0,arm:107},{yaw:68.25,pitch:-13,arm:122},{yaw:93.5,pitch:9,arm:178},
 {yaw:0,pitch:-33,arm:178}
];
function trueFrames(scene,env){
 const binding=bindSurface(scene,settings),camera=studyView(env.neutral,false).sceneOverride;
 return views47.map(({yaw,pitch,arm})=>{
  const body=arm?pose34(scene,raisedPose(arm)).scene:scene;
  const shown={...body,parts:[...body.parts,...surfaceParts(binding,body.parts[0])],frame:camera.frame,cameraCenter:camera.cameraCenter};
  return Object.fromEntries([48,192].map(size=>[size,portraitAtResolution(portraitPixels,settings,{sceneOverride:shown,yaw,pitch,freeOrbit:true},size)]));
 });
}
function visibleFloor47(scene,env,arm,yaw) {
 const body=arm?pose34(scene,raisedPose(arm)).scene:scene;
 const groups=visible(body,yaw,env.neutral);
 return groups.map(ls=>ls.map(run=>[run[0],run.at(-1)]));
}
function measuredSupport(base,scene) {
 const result={lower:{total:0,moved:0,max:0},return:{total:0,moved:0,max:0},axilla:{total:0,moved:0,max:0}};
 for(const [i,v] of base.restSkin35.entries()){
  const [x,y,z]=v.p;if(z<.05)continue;
  const hand=Math.sign(x),frame=base.paperShape.frame(hand),q=(x-frame.c)*hand/frame.root;if(Math.abs(q)>=.995)continue;
  const local=base.paperShape.frame(hand,hand*q),u=(local.top-y)/(local.top-local.foot);
  let key;
  if(Math.abs(q)<=.58&&u>=.60&&u<=.90)key='lower';
  else if(Math.abs(q)<=.72&&u>=.965&&u<=1.035)key='return';
  else if(q>=.8&&q<=.99&&u>=.05&&u<=.96)key='axilla';
  if(!key)continue;
  const a=base.parts[0].vertices[i],b=scene.parts[0].vertices[i];
  const dist=Math.hypot(...a.p.map((v,k)=>v-b.p[k])),row=result[key];
  row.total++;if(dist>1e-7)row.moved++;row.max=Math.max(row.max,dist);
 }
 return result;
}
// The bottom of each visible arc is a 2-D observation. Only identify a mesh
// vertex if its projected position coincides to sub-pixel precision.
function floorVertex(scene,cell,camera,yaw) {
 const [c,s,tx,ty]=camera;
 const points=cell.lines.slice(0,cell.runsBySide[0]).flat();
 const floor=points.reduce((a,b)=>a[1]>b[1]?a:b);
 let best={index:null,distance:Infinity};
 scene.restSkin35.forEach(({p:[x,y,z]},i)=>{
   if(x<=0||z<.05)return;
   const f=scene.paperShape.frame(1),q=(x-f.c)/f.root;if(Math.abs(q)>1.02)return;
   const local=scene.paperShape.frame(1,q),u=(local.top-y)/(local.top-local.foot);
   if(u<.45||u>1.03)return;
   const [a,b]=rotation(scene.parts[0].vertices[i].p,yaw),px=c*a-s*b+tx,py=s*a+c*b+ty;
   const distance=Math.hypot(px-floor[0],py-floor[1]);
   if(distance<best.distance)best={index:i,distance,q,u};
 });
 return {point:floor,...best,coincident:best.distance<.025};
}
function changedPixels(a,b) {
 let count=0;for(let i=0;i<a.length;i+=4){
  if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])count++;
 }
 return count;
}
export async function evaluate47(saveFigures=false){
 const env=await setup47(),before=env.base.parts[0].vertices;
 const original=createHash('sha256').update(JSON.stringify(before)).digest('hex');
 const scenes={baseline40:env.base,held42:env.held,candidate47:makeChest47(env.base,ref)};
 assert.equal(makeChest47(env.base,{}),env.base);
 const other={...env.base,paperShape:{...env.base.paperShape,form:{id:'other'}}};assert.equal(makeChest47(other,ref),other);
 const paper=Object.fromEntries(Object.keys(ref.paper).map(id=>[id,{yaw:id.startsWith('S')?-90:-26.15,pitch:0,camera:env.camera[id]}]));
 const metrics={},frames={},registered={},stresses={},novel={},support={};
 for(const [key,scene] of Object.entries(scenes)){
  const res=evaluateShape(scene,env,true);
  for(const [id,cell] of Object.entries(res.cells))paper[id][key]=cell;
  registered[key]=Object.fromEntries(training.map(id=>[id,raster(scene,id,env)]));
  const pixels=pixelEdges(registered[key]);
  metrics[key]={...res.metrics,photo:Object.fromEntries(Object.entries(pixels).map(([id,v])=>[id,v.absolute])),front:foldMeasure(scene),
    floorVertices:Object.fromEntries(training.map(id=>[id,floorVertex(scene,res.cells[id],env.camera[id],id.startsWith('S')?-90:-26.15)]))};
  frames[key]=trueFrames(scene,env);stresses[key]=stress(scene,env.neutral,env.camera);
  novel[key]=[0,107,178].map(arm=>({yaw:-52.75,pitch:0,arm,lines:visibleFloor47(scene,env,arm,-52.75)}));
  support[key]=measuredSupport(env.base,scene);
 }
 const mesh=meshCheck(env.base,scenes.candidate47),poses=[];
 for(const arm of [0,15,30,45,60,75,90,105,120,135,150,165,178]){
  const posed=scene=>arm?pose34(scene,raisedPose(arm)).scene:scene;
  const baseline=posed(env.base),candidate=posed(scenes.candidate47);
  const g=meshCheck(baseline,candidate);
  assert.equal(g.turnsOver90,0);
  poses.push({arm,minAreaRatio:g.minAreaRatio,turnsOver90:g.turnsOver90});
 }
 const images=views47.map((v,i)=>({...v,resolutions:Object.fromEntries([48,192].map(size=>{
   const left=frames.baseline40[i][size].data,right=frames.candidate47[i][size].data;
   return [size,{changedFrom40:changedPixels(left,right),changedFrom42:changedPixels(frames.held42[i][size].data,right),
    hashes:Object.fromEntries(Object.keys(scenes).map(k=>[k,createHash('sha256').update(frames[k][i][size].data).digest('hex')]))}];
 }))}));
 const bindings=poseCheck(env.base,scenes.candidate47).filter(v=>v.version==='after').map(({arm,maxAttachmentError})=>({arm,maxAttachmentError}));
 assert.equal(createHash('sha256').update(JSON.stringify(before)).digest('hex'),original);
 assert(mesh.changedVertices>0&&mesh.turnsOver90===0&&support.candidate47.return.moved===0&&support.candidate47.axilla.moved===0);
 const published=JSON.parse(readFileSync(new URL('../chest-eval42.json',import.meta.url)));
 for(const [version,old] of [['baseline40','before'],['held42','after']]){
   for(const id of training){
     assert.deepEqual(paper[id][version].errorsPx,published.paper[id][old].errorsPx);
     assert.equal(metrics[version].photo[id],published.photo[old][id].absolute);
   }
 }
 for(const id of training){
   assert(paper[id].candidate47.errorsPx.every((v,i)=>v<paper[id].baseline40.errorsPx[i]));
   assert(metrics.candidate47.photo[id]<metrics.baseline40.photo[id]);
 }
 assert(images.every(v=>v.resolutions[48].changedFrom40>0&&v.resolutions[192].changedFrom40>0));
 assert(Object.values(novel).every(rows=>rows.every(r=>r.lines.every(g=>g.length))));
 const withheld=Object.keys(paper).filter(id=>!training.includes(id));
 const betterThan=name=>withheld.filter(id=>sum(paper[id].candidate47.errorsPx)<sum(paper[id][name].errorsPx));
 const report={round:47,recommended:'baseline40',candidate:'candidate47',fit:fit47,
   source:'https://doi.org/10.1007/s00266-021-02753-y',training,withheld,improvedAgainst40:betterThan('baseline40'),improvedAgainst42:betterThan('held42'),
   candidateSource:{file:'chest-guard47.json',trial:8,coefficientDecimals:9},
   experiments:[
    {script:'node qa/chest47.mjs --search 260',file:'chest-trials47.json',tested:260,rejectedExample:254},
    {script:'node qa/chest47.mjs --refine 580',file:'chest-refine47.json',tested:580},
    {script:'node qa/chest47.mjs --tune 374',file:'chest-light47.json',tested:374},
    {script:'node qa/chest47.mjs --guard 156',file:'chest-guard47.json',tested:156}
   ],
   units:{errorsPx:'원도판 픽셀 · 가시선 양방향 호 길이 가중 RMS',photo:'원본과 실렌더 명암 상승 위치 평균 절대차 · 원도판 픽셀',
    floors:'도판 바닥 y - 모형 바닥 y · 양수면 모형이 높음',sTurn:'측면 3픽셀 곡률 창의 회전각 평균 절대 오차 · 도',
    novel:'카메라 좌표의 모형 가시선 · 원도판 대응 각도 없음'},
   registration:'36차 중립 재질 표점과 측면 단면 끝점의 2차원 유사변환 고정',metrics,paper,mesh,support,stresses,novel,poses,bindings,images};
 if(saveFigures){
  const {plate47,posePlate47}=await import('./chest-images47.mjs');
  writeFileSync(new URL('../chest-plate47.svg',import.meta.url),plate47(ref,paper,registered));
  writeFileSync(new URL('../chest-poses47.svg',import.meta.url),posePlate47(views47,frames));
 }
 return JSON.parse(JSON.stringify(report,(_,v)=>typeof v==='number'?Number(v.toFixed(8)):v));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&[undefined,'--write'].includes(process.argv[2])){
 const save=process.argv[2]==='--write',r=await evaluate47(save),file=new URL('../chest-eval47.json',import.meta.url);
 if(save)writeFileSync(file,JSON.stringify(r));else assert.deepEqual(r,JSON.parse(readFileSync(file)));
 console.log(JSON.stringify({mesh:r.mesh,poses:r.poses.length,images:r.images.length*2,metrics:r.metrics,holdout:r.improvedAgainst40.length}));
}

export async function guard47(count=156){
 const env=await setup47(),past=JSON.parse(readFileSync(new URL('../chest-light47.json',import.meta.url)));
 const starts=[265,121,115,169],pool=starts.map(i=>past.trials[i]);
 let seed=748265;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const score=({metrics:m,photo:p,fold:f})=>m.bFloor+.8*m.near+.38*m.sTurn+.25*m.side+
   12*Math.max(0,m.aNear-1.3037)+12*Math.max(0,m.side-1.8)+9*Math.max(0,m.far-1.67)+
   15*Math.max(0,p.B3-7.7441861)+12*Math.max(0,p.A5-1.179488)+12*Math.max(0,p.S3-2)+1.8*Math.max(0,8.65-f.meanFirst);
 const amplitudes={mix:.15,center:.14,top:.028,spread:.06,depth:.028,drop:.018,forward:.016,lateral:.012,returnCenter:.14,returnDrop:.015,returnFront:.012,normalCap:3,normalBlend:.13};
 const keys=Object.keys(amplitudes),trials=[...pool];
 for(let i=0;i<count;i++){
  const k=i%pool.length,fit={...pool[k].fit};
  for(let j=0;j<1+i%3;j++){const p=keys[Math.floor(rand()*keys.length)];fit[p]+=(2*rand()-1)*amplitudes[p]*(1-.65*i/count);}
  const scene=makeChest47(env.base,ref,fit),{metrics}=evaluateShape(scene,env),row={fit,metrics,...imageMetrics(scene,env)};
  row.score=score(row);if(row.score<score(pool[k]))pool[k]=row;trials.push(row);
 }
 return {seed:748265,count,trials,finalists:pool.sort((a,b)=>score(a)-score(b))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]==='--guard'){
 const results=await guard47(Number(process.argv[3])||156);
 writeFileSync(new URL('../chest-guard47.json',import.meta.url),archiveJSON(results));console.log('세 도판 퇴행 재검',results.count);
}
