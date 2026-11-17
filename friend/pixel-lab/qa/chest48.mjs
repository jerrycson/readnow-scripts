import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {setup47} from './chest47.mjs';
import {settings,ref,visible,cellResult,meshCheck} from './chest38.mjs';
import {floatingArc} from './chest40.mjs';
import {makeChest47} from '../chest47.mjs';
import {makeChest48,correctChestPose48} from '../chest48.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {articulate} from '../articulation33.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {studyView} from '../camera35.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';
import {portraitPixels} from '../portrait48.mjs';

const close=(a,b)=>assert(Math.abs(a-b)<1e-7,a+' != '+b);
export async function evaluate48(){
 const data=JSON.parse(readFileSync(new URL('../chest-eval48.json',import.meta.url))),env=await setup47();
 const r47=makeChest47(env.base,ref),r48=makeChest48(env.base,ref),neutral={r40:env.base,r42:env.held,r47,r48};
 const getPose=(k,a)=>{
   const posed=a?pose34(neutral[k],raisedPose(a)).scene:neutral[k];
   return k==='r48'?correctChestPose48(posed,env.base,r47,a):posed;
 };
 const angle=(body,yaw)=>{
   const id=yaw===-90?'S3':'B3',cell=cellResult(visible(body,yaw,env.neutral),id,env.camera[id],false);
   return floatingArc(cell.lines.slice(0,cell.runsBySide[0])).maxTurn;
 };
 for(const [arm,expected] of Object.entries(data.tests)){
   const a=Number(arm),poses=Object.fromEntries(Object.keys(neutral).map(k=>[k,getPose(k,a)]));
   for(const [k,scene] of Object.entries(poses)){
     close(angle(scene,-26.15),expected[k].oblique);close(angle(scene,-90),expected[k].side);
     if(data.novel[arm])for(const [yaw,row] of Object.entries(data.novel[arm]))close(angle(scene,Number(yaw)),row[k]);
   }
   for(const [k,metric] of [['r40','areaRelative40'],['r47','areaRelative47']]){
     const actual=meshCheck(poses[k],poses.r48);assert.equal(actual.turnsOver90,0);close(actual.minAreaRatio,expected[metric]);
   }
 }
 for(const [k,measured] of Object.entries(data.targeted.allTissueVsBoneOnly)){
   close(angle(articulate(neutral[k],raisedPose(90)).scene,-26.15),measured.bones.maximum);
 }
 const fixed=studyView(env.neutral,false).sceneOverride,binds=Object.fromEntries(Object.entries(neutral).map(([k,s])=>[k,bindSurface(s,settings)]));
 for(const {yaw,pitch,arm,hashes} of data.frameResult){
   for(const k of Object.keys(neutral)){
     const sc=getPose(k,arm),shown={...sc,parts:[...sc.parts,...surfaceParts(binds[k],sc.parts[0])],frame:fixed.frame,cameraCenter:fixed.cameraCenter};
     for(const size of [48,192]){
       const frame=portraitAtResolution(portraitPixels,settings,{sceneOverride:shown,yaw,pitch,freeOrbit:true},size);
       assert.equal(createHash('sha256').update(frame.data).digest('hex'),hashes[k][size]);
     }
   }
 }
 // A local edit on the selected skin must survive application and removal of
 // the posture correction. Exercise the very point used in the diagnosis.
 const pose=pose34(r47,raisedPose(90)).scene,source=pose.parts[0].vertices,vs=source.slice(),i=8486,shift=.021;
 vs[i]={...vs[i],p:vs[i].p.map((v,k)=>k===2?v+shift:v)};
 const edited={...pose,parts:pose.parts.map(m=>m.vertices===source?{...m,vertices:vs}:m)};
 const raw=correctChestPose48(pose,env.base,r47,90),corrected=correctChestPose48(edited,env.base,r47,90);
 close(corrected.parts[0].vertices[i].p[2]-raw.parts[0].vertices[i].p[2],shift);
 close(edited.parts[0].vertices[i].p[2]-pose.parts[0].vertices[i].p[2],shift);
 assert.equal(correctChestPose48(edited,env.base,r47,0),edited);
 assert.equal(correctChestPose48(edited,env.base,r47,160),edited);
 return {round:48,poses:Object.keys(data.tests).length,otherViews:12,frames:data.frameResult.length*4*2,
   neutral:'47차와 동일',arm90:data.tests['90'].r48,heldAngles:data.heldAngles.length,vertex:i};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await evaluate48()));

