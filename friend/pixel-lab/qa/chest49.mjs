import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {setup47} from './chest47.mjs';
import {settings,ref} from './chest38.mjs';
import {makeChest47} from '../chest47.mjs';
import {correctChestPose48} from '../chest48.mjs';
import {poseChest49,poseSpec49} from '../chest49.mjs';
import {pose34,raisedPose} from '../bust34.mjs';
import {studyView} from '../camera35.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';
const close=(a,b)=>assert(Math.abs(a-b)<1e-7);
export async function evaluate49(){
 const record=JSON.parse(readFileSync(new URL('../chest-eval49.json',import.meta.url))),env=await setup47();
 const src=makeChest47(env.base,ref),bind=bindSurface(src,settings);
 const fixed=studyView(env.neutral,false).sceneOverride;
 const straight=pose34(src,raisedPose(90)).scene;
 const cases={waist:poseChest49(src,'waist'),behindHead:poseChest49(src,'behindHead'),r47Straight90:straight,r48Straight90:correctChestPose48(straight,env.base,src,90)};
 assert.equal(poseChest49(src,'neutral'),src);
 const rest=JSON.stringify(src.parts[0].vertices[8486].p);
 for(const key of ['waist','behindHead']){
  const pose=poseSpec49(key),handles=pose34(src,pose).handles;
  for(const [name,target] of Object.entries(record.poses[key].modelJointCentres))target.forEach((v,i)=>close(handles['right.'+name][i],v));
  assert(pose['right.elbow'].bend>90);
  const old=src.parts[0].vertices,vs=old.slice();vs[8486]={...old[8486],p:old[8486].p.map((v,i)=>i===2?v+.02:v)};
  const edited={...src,parts:src.parts.map(m=>m.vertices===old?{...m,vertices:vs}:m)};
  const altered=poseChest49(edited,key).parts[0].vertices[8486].p;
  assert(Math.hypot(...altered.map((v,i)=>v-cases[key].parts[0].vertices[8486].p[i]))>.015);
 }
 assert.equal(JSON.stringify(src.parts[0].vertices[8486].p),rest);
 for(const [k,scene] of Object.entries(cases)){
  for(const view of record.frames[k]){
   const shown={...scene,parts:[...scene.parts,...surfaceParts(bind,scene.parts[0])],frame:fixed.frame,cameraCenter:fixed.cameraCenter};
   const render=(sc,n)=>createHash('sha256').update(portraitAtResolution(portraitPixels,settings,{sceneOverride:sc,yaw:view.yaw,pitch:view.pitch,freeOrbit:true},n).data).digest('hex');
   for(const n of [48,192])assert.equal(render(shown,n),view.hashes[n]);
   assert.equal(render({...shown,frame:5.25,cameraCenter:[0,6.05,.05]},192),view.upper192);
  }
 }
 const source=record.source;assert.equal(source.panels.b.markers.length,5);assert.equal(source.panels.c.markers.length,5);
 for(const [k,idx] of Object.entries({upperLower:[0,2],middleLower:[1,2],lowerPair:[3,4]})){
   const [c,s,x,y]=source.registration[k].cToB;
   for(const i of idx){const [p,q]=source.panels.c.markers[i],[u,v]=source.panels.b.markers[i];assert(Math.hypot(c*p-s*q+x-u,s*p+c*q+y-v)<.00002);}
 }
 assert.deepEqual(source.observedChange.bc.map(s=>s.change),[null,null]);
 assert(source.observedChange.ef.every(r=>r.anchorShift2pxRange[0]<0&&r.anchorShift2pxRange[1]>0));
 return {round:49,trackedLandmarks:10,sourcePanels:Object.keys(source.panels),registeredCameras:3,poseCases:Object.keys(cases),actualFrames:48,
   comparablePhotoColumns:source.observedChange.bc.map(v=>v.valid),comparableSurfaceColumns:source.observedChange.ef.map(v=>v.valid)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await evaluate49()));

