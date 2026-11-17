import {portraitPixels} from '../portrait48.mjs';
import {studyView} from '../camera35.mjs';
import {projectPoint} from '../renderer.mjs';
import {settings} from './chest38.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {start,ref,registrations,cellResult,visible,meshCheck,poseCheck} from './chest38.mjs';
import {chest38} from '../chest38.mjs';
import {chest39} from '../chest39.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';

export function picture(scene,yaw=0,pitch=0){
  const binding=bindSurface(scene,settings);
  const shown={...scene,parts:[...scene.parts,...surfaceParts(binding,scene.parts[0])]};
  return portraitPixels(settings,{...studyView(shown,false),yaw,pitch,freeOrbit:true,studyResolution:256});
}

const round=data=>JSON.parse(JSON.stringify(data,(_,v)=>typeof v==='number'?Number(v.toFixed(6)):v));
export async function evaluate39(){
  const base37=await start(),before=chest38(base37,ref),backup=before.parts[0].vertices.map(v=>v.p.slice());
  const after=chest39(before,ref),cameras=registrations(base37),paper={};
  for(const [version,scene] of Object.entries({before,after})){
    const actual=Object.fromEntries([-26.15,-90].map(yaw=>[yaw,visible(scene,yaw,base37)]));
    for(const id of Object.keys(ref.paper)){
      const yaw=id[0]==='S'?-90:-26.15;
      (paper[id]??={yaw,pitch:0,camera:cameras[id]})[version]=cellResult(actual[yaw],id,cameras[id]);
    }
  }
  const holdout=Object.keys(paper).filter(id=>!['B3','S3'].includes(id));
  const improved=holdout.filter(id=>{
    const sum=v=>paper[id][v].errorsPx.reduce((a,b)=>a+b,0);
    return sum('after')<sum('before');
  });
  const geometry=meshCheck(before,after),front={before:foldMeasure(before),after:foldMeasure(after)};
  const poses=poseCheck(before,after),poseGeometry={};
  for(const arm of [0,90,178]){
    const pose=s=>arm?pose34(s,raisedPose(arm)).scene:s;
    const prev=pose(before),next=pose(after);
    const check=meshCheck(prev,next);
    poseGeometry[arm]={turnsOver90:check.turnsOver90,minAreaRatio:check.minAreaRatio};
  }
  assert.deepEqual(backup,before.parts[0].vertices.map(v=>v.p));
  assert.equal(geometry.turnsOver90,0);
  assert(front.after.doubleColumns<front.before.doubleColumns);
  assert.equal(poses.length,6);
  return round({training:['B3','S3'],holdout,improved,paper,geometry,front,poses,poseGeometry});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await evaluate39(),file=new URL('../chest-eval39.json',import.meta.url);
  if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(result));
  else assert.deepEqual(result,JSON.parse(fs.readFileSync(file)));
  console.log(JSON.stringify({improved:result.improved,front:result.front,posed:result.poseGeometry,B3:result.paper.B3.after.errorsPx,S3:result.paper.S3.after.errorsPx}));
}
export function foldMeasure(scene,image=picture(scene)){
  const {c,h,top,root}=scene.paperShape.frame(1);
  const rows=[],columns=[];
  for(const sign of [-1,1]){
    const project=(x,y)=>projectPoint(image,[sign*x,y,.8]);
    const lo=project(c-.47*root,top-h*.78),hi=project(c+.59*root,top-h*1.15);
    const [l,r]=[lo[0],hi[0]].sort((a,b)=>a-b);
    const t=Math.round(lo[1]),b=Math.round(hi[1]);rows.push([l,t,r,b]);
    for(let x=Math.ceil(l);x<=Math.floor(r);x++){
      const Y=[];
      for(let y=t;y<=b;y++){
        const idx=(image.width*y+x)*4,[R,G,B]=image.data.slice(idx,idx+3);
        Y.push(.2126*R+.7152*G+.0722*B);
      }
      const smooth=Y.map((v,i)=>(Y[Math.max(0,i-1)]+2*v+Y[Math.min(i+1,Y.length-1)])/4);
      const peaks=[];
      for(let j=1;j<smooth.length-1;j++){
        if(smooth[j]>smooth[j-1]||smooth[j]>=smooth[j+1])continue;
        const left=Math.max(...smooth.slice(Math.max(0,j-5),j)),right=Math.max(...smooth.slice(j+1,j+6));
        const prominence=Math.min(left,right)-smooth[j];
        if(prominence>=3)peaks.push({y:t+j,prominence});
      }
      peaks.sort((a,b)=>b.prominence-a.prominence);
      const second=peaks.slice(1).find(p=>Math.abs(p.y-peaks[0].y)>=3);
      columns.push({x,first:peaks[0]?.prominence||0,second:second?.prominence||0});
    }
  }
  const doubled=columns.filter(c=>c.second>=3);
  return {regions:rows,columns:columns.length,doubleColumns:doubled.length,meanSecond:columns.reduce((a,b)=>a+b.second,0)/columns.length,
    meanFirst:columns.reduce((a,b)=>a+b.first,0)/columns.length};
}
