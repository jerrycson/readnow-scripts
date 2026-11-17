import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {visible,cellResult,settings,start,ref,registrations,meshCheck,poseCheck} from './chest38.mjs';
import {foldMeasure} from './chest39.mjs';
import {chest38} from '../chest38.mjs';
import {chest39} from '../chest39.mjs';
import {chest40} from '../chest40.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {studyView} from '../camera35.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';

function reflected(scene){
 const flip=vs=>vs.map(v=>({...v,p:[-v.p[0],v.p[1],v.p[2]],n:[-v.n[0],v.n[1],v.n[2]]}));
 const mesh=scene.parts[0];
 return {...scene,restSkin35:flip(scene.restSkin35),parts:[{...mesh,vertices:flip(mesh.vertices)}]};
}
export function floatingArc(lines){
 const low=lines.flat().reduce((a,b)=>a[1]>b[1]?a:b),heights=[];
 for(let i=-12;i<=12;i++){
  const x=Math.round(low[0])+i,ys=[];
  for(const [a,b] of lines){if((a[0]-x)*(b[0]-x)>0||Math.abs(a[0]-b[0])<1e-5)continue;ys.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
  heights.push(ys.length?Math.max(...ys):null);
 }
 const angles=[];
 for(let i=3;i<heights.length-3;i++){
  const [a,b,c]=[heights[i-3],heights[i],heights[i+3]];if([a,b,c].some(v=>v===null))continue;
  angles.push(Math.abs(Math.atan2(c-b,3)-Math.atan2(b-a,3))*180/Math.PI);
 }
 return {maxTurn:angles.length?Math.max(...angles):null,samples:angles.length};
}
export function stress(scene,neutral,camera,onImage){
 const bind=bindSurface(scene,settings),result=[];
 const fixed=studyView(neutral,false).sceneOverride;
 for(const arm of [0,90,178]){
  const moved=arm?pose34(scene,raisedPose(arm)).scene:scene;
  const opposite=reflected(moved),baseMirrored=reflected(neutral);
  const shown={...moved,parts:[...moved.parts,...surfaceParts(bind,moved.parts[0])]};
  for(const yaw of [-90,90,-26.15,26.15]){
   const id=Math.abs(yaw)===90?'S3':'B3',reverse=yaw>0;
   const raw=visible(reverse?opposite:moved,-Math.abs(yaw),reverse?baseMirrored:neutral);
   const cell=cellResult(raw,id,camera[id],false);
   const lines=cell.lines.slice(0,cell.runsBySide[0]);
   result.push({arm,yaw,...(lines.length?floatingArc(lines):{maxTurn:null,samples:0})});
   if(onImage){
    const view={...shown,frame:fixed.frame,cameraCenter:fixed.cameraCenter};
    const frame=portraitPixels(settings,{sceneOverride:view,portrait:false,yaw,pitch:0,freeOrbit:true,studyResolution:256});
    onImage(frame);
   }
  }
 }
 return result;
}
function heightAt(lines,x){
 let high=-Infinity;
 for(const line of lines)for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],dx=b[0]-a[0];
  if(Math.min(a[0],b[0])-1e-8>x||Math.max(a[0],b[0])+1e-8<x||Math.abs(dx)<1e-8)continue;
  high=Math.max(high,a[1]+(x-a[0])*(b[1]-a[1])/dx);
 }
 return Number.isFinite(high)?high:null;
}
export function curvature(lines){
 const x=Array.from({length:25},(_,i)=>19+i),y=x.map(v=>heightAt(lines,v)),a=[];
 // The 3-pixel arcs suppress one-pixel staircase noise in the reference.
 for(let k=3;k<y.length-3;k++)if([y[k-3],y[k],y[k+3]].every(Number.isFinite)){
  a.push([x[k],(Math.atan2(y[k+3]-y[k],3)-Math.atan2(y[k]-y[k-3],3))*180/Math.PI]);
 }
 return {samples:a,maxTurn:Math.max(...a.map(v=>Math.abs(v[1])))};
}

export async function evaluate40(){
 const neutral=await start(),camera=registrations(neutral);
 const before=chest39(chest38(neutral,ref),ref);
 const original=before.parts[0].vertices.map(v=>[...v.p,...v.n]);
 const after=chest40(before,ref),paper={},stressPoses={};
 const curvatureS3={source:curvature(ref.paper.S3.lines)};
 const target=new Map(curvatureS3.source.samples);
 for(const [version,scene] of Object.entries({before,after})){
  const side=visible(scene,-90,neutral),oblique=visible(scene,-26.15,neutral);
  for(const id of Object.keys(ref.paper)){
   const profile=id[0]==='S',yaw=profile?-90:-26.15;
   (paper[id]??={yaw,pitch:0,camera:camera[id]})[version]=cellResult(profile?side:oblique,id,camera[id]);
  }
  const arc=curvature(paper.S3[version].lines);
  arc.meanError=arc.samples.reduce((sum,[x,t])=>sum+Math.abs(target.get(x)-t),0)/arc.samples.length;
  curvatureS3[version]=arc;
  const hashes=[];
  const samples=stress(scene,neutral,camera,frame=>{
   hashes.push(createHash('sha256').update(frame.data).digest('hex'));
  });
  stressPoses[version]=samples.map((s,i)=>({...s,rgba256:hashes[i]}));
 }
 const training=['B3','S3','A5'],holdout=Object.keys(paper).filter(id=>!training.includes(id));
 const sum=run=>run.errorsPx.reduce((a,b)=>a+b,0);
 const improved=holdout.filter(id=>sum(paper[id].after)<sum(paper[id].before));
 const geometry=meshCheck(before,after),poses=poseCheck(before,after),poseGeometry={};
 for(const arm of [0,90,178]){
  const pose=s=>arm?pose34(s,raisedPose(arm)).scene:s;
  const check=meshCheck(pose(before),pose(after));
  poseGeometry[arm]={turnsOver90:check.turnsOver90,minAreaRatio:check.minAreaRatio};
  assert.equal(check.turnsOver90,0);
 }
 const front={before:foldMeasure(before),after:foldMeasure(after)};
 assert.deepEqual(original,before.parts[0].vertices.map(v=>[...v.p,...v.n]));
 assert(curvatureS3.after.meanError<curvatureS3.before.meanError);
 assert(stressPoses.after.every((row,i)=>row.maxTurn<stressPoses.before[i].maxTurn&&row.rgba256!==stressPoses.before[i].rgba256));
 assert(front.after.doubleColumns<front.before.doubleColumns);
 const data={training,holdout,improved,paper,curvature:curvatureS3,geometry,front,poses,poseGeometry,stressPoses};
 return JSON.parse(JSON.stringify(data,(_,v)=>typeof v==='number'?Number(v.toFixed(6)):v));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await evaluate40(),file=new URL('../chest-eval40.json',import.meta.url);
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(result));
 else assert.deepEqual(result,JSON.parse(fs.readFileSync(file)));
 console.log(JSON.stringify({improved:result.improved,geometry:result.geometry,front:result.front,curvature:result.curvature.after.maxTurn,poses:result.poseGeometry}));
}
