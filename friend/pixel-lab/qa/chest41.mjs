import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {start,ref,settings,registrations,cellResult,visible,meshCheck,poseCheck} from './chest38.mjs';
import {foldMeasure} from './chest39.mjs';
import {curvature,stress,floatingArc} from './chest40.mjs';
import {chest38} from '../chest38.mjs';
import {chest39} from '../chest39.mjs';
import {chest40} from '../chest40.mjs';
import {chest41} from '../chest41.mjs';
import {studyView} from '../camera35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {pose34,raisedPose} from '../bust34.mjs';

const rotation=([x,y,z],yaw)=>{const a=yaw*Math.PI/180;return [x*Math.cos(a)+z*Math.sin(a),-y,z*Math.cos(a)-x*Math.sin(a)];};
// Source luminance-rise rows from x=114 through 156 of Wallner Figure 1, B3.
const sourceRises=[122, 123, 123, 124, 124, 125, 125, 126, 126, 126, 127, 127, 127, 127, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 127, 127, 127, 126, 126, 126, 125, 125, 124, 124, 123, 123, 122, 121, 120];
function raster(scene,id,env,override){
 const yaw=id[0]==='S'?-90:-26.15,cam=override||env.camera[id],mark=bindSurface(scene,settings);
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
function brightnessRows(width,rgb){
 const rows=[];
 for(let x=114;x<=156;x++){
  const p=lower([ref.paper.B3.lines[0]],x),r=Math.round(p);
  const Y=(x,y)=>{const i=(y*width+x)*3;return .2126*rgb[i]+.7152*rgb[i+1]+.0722*rgb[i+2];};
  const at=y=>[x-1,x,x+1].reduce((t,xx)=>t+(Y(xx,y-1)+2*Y(xx,y)+Y(xx,y+1))/12,0);
  const sample=Array.from({length:29},(_,j)=>r-17+j),gain=y=>at(y+1)-at(y-1);
  const edge=sample.reduce((a,b)=>gain(b)>gain(a)?b:a);
  rows.push({x,y:p,rise:edge,gain:gain(edge),residual:p-edge});
 }
 return rows;
}
function shade(scene,env){
 const {width,rgb}=raster(scene,'B3',env),rows=brightnessRows(width,rgb);
 const sorted=rows.map(a=>a.residual).sort((a,b)=>a-b);
 return {medianSigned:sorted[21],meanAbsolute:sorted.reduce((s,x)=>s+Math.abs(x),0)/sorted.length,
  readable:rows.filter(a=>a.gain>=3).length,rows};
}


export async function evaluate41(){
 const neutral=await start(),before=chest40(chest39(chest38(neutral,ref),ref),ref),camera=registrations(neutral);
 const env={neutral,camera},training=['B3','S3','A5'],holdout=Object.keys(ref.paper).filter(id=>!training.includes(id));
 const sourceCurvature=curvature(ref.paper.S3.lines),target=new Map(sourceCurvature.samples),original=before.parts[0].vertices.map(v=>[...v.p,...v.n]);
 const angles=[0,15,30,45,60,75,90,105,120,135,150,165,178],pose=(s,a)=>a?pose34(s,raisedPose(a)).scene:s;
 const posedBefore=angles.map(a=>pose(before,a));
 function measure(scene){
  const paper={},sides=new Map([-90,-26.15].map(yaw=>[yaw,visible(scene,yaw,neutral)]));
  for(const id of Object.keys(ref.paper)){
   const yaw=id[0]==='S'?-90:-26.15;
   paper[id]=cellResult(sides.get(yaw),id,camera[id]);
  }
  const brightness=shade(scene,env);
  const sourceDifference=brightness.rows.map((r,i)=>sourceRises[i]-r.rise);
  brightness.sameFilterMeanAbsolute=sourceDifference.reduce((s,v)=>s+Math.abs(v),0)/sourceDifference.length;
  brightness.sameFilterMedianSigned=sourceDifference.slice().sort((a,b)=>a-b)[21];
  const curve=curvature(paper.S3.lines);
  curve.meanError=curve.samples.reduce((s,[x,t])=>s+Math.abs(t-target.get(x)),0)/curve.samples.length;
  const poses=angles.map((angle,i)=>{
   const m=meshCheck(posedBefore[i],pose(scene,angle));assert.equal(m.turnsOver90,0);
   return {angle,turnsOver90:m.turnsOver90,minAreaRatio:m.minAreaRatio};
  });
  const hashes=[],turnStress=stress(scene,neutral,camera,image=>hashes.push(createHash('sha256').update(image.data).digest('hex')));
  const extraViews=[];
  for(const arm of [0,50,135]){
   const posed=pose(scene,arm);
   for(const yaw of [-40,-55,-70]){
    const cell=cellResult(visible(posed,yaw,neutral),'B3',camera.B3,false),near=cell.lines.slice(0,cell.runsBySide[0]);
    extraViews.push({arm,yaw,...(near.length?floatingArc(near):{samples:0,maxTurn:null})});
   }
  }
  return {paper,geometry:meshCheck(before,scene),front:foldMeasure(scene),brightness,curvature:curve,
   poses,extraViews,stress:turnStress.map((r,i)=>({...r,rgba256:hashes[i]}))};
 }
 const baseline=measure(before),candidates={};
 for(const [choice,label,status] of [['balanced','밑면과 측면 함께 조정','회전 비교 후보'],['lower','B3 밑면을 더 내림','B3 전용 비교 후보 · S3와 A5 거리 증가']]){
  const scene=chest41(before,ref,choice),m=measure(scene),sum=p=>p.errorsPx.reduce((a,b)=>a+b,0);
  const improved=holdout.filter(id=>sum(m.paper[id])<sum(baseline.paper[id]));
  assert(m.brightness.sameFilterMeanAbsolute<baseline.brightness.sameFilterMeanAbsolute);
  assert(m.paper.B3.floors[0].model.bottom>baseline.paper.B3.floors[0].model.bottom);
  assert(m.geometry.changedVertices>0);
  candidates[choice]={label,status,...m,improved,poseRenders:poseCheck(before,scene).filter(r=>r.version==='after')};
 }
 assert.deepEqual(original,before.parts[0].vertices.map(v=>[...v.p,...v.n]));
 const paper={};
 for(const id of Object.keys(baseline.paper)){
  paper[id]={yaw:id[0]==='S'?-90:-26.15,pitch:0,camera:camera[id],before:baseline.paper[id],after:candidates.balanced.paper[id]};
 }
 return JSON.parse(JSON.stringify({recommendation:'keep40',defaultCandidate:'balanced',training,holdout,paper,candidates,
  baseline:{...baseline,paper:undefined},sourceCurvature,sourceRises},(_,v)=>typeof v==='number'?Number(v.toFixed(6)):v));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const data=await evaluate41(),file=new URL('../chest-eval41.json',import.meta.url);
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(data));
 else assert.deepEqual(data,JSON.parse(fs.readFileSync(file)));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(data.candidates).map(([k,v])=>[k,{floor:v.paper.B3.floors[0],pixels:v.brightness.sameFilterMeanAbsolute,holdout:v.improved,poses:v.poses}]))));
}
