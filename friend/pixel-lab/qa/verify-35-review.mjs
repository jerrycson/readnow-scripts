import assert from 'node:assert/strict';
import {reviewRig35} from '../ribcage35-review.mjs';
import {DEFAULTS} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {paperForms} from '../paperforms35.mjs';
import {pose34,raisedPose,response34} from '../bust34.mjs';
await loadRig();
for(const {id} of paperForms){
 const scene=reviewRig35({...DEFAULTS,sex:'female',heads:8,designStyle:'manga',paperForm:id,chestVolume:.15});
 const pose=raisedPose(178),base=pose34(scene,pose).scene.parts[0];
 for(const axis of ['vertical','side','depth']){
   const d=response34(.12,axis),moved=pose34(scene,pose,d).scene.parts[0];
   assert(moved.vertices.every(v=>v.p.every(Number.isFinite)),id);
   assert(moved.vertices.some((v,i)=>v.p.some((x,k)=>Math.abs(x-base.vertices[i].p[k])>.001)),axis);
 }
 const d=response34(2.2,'vertical');assert(Object.values(d).every(v=>v.every(x=>x===0)));
 const end=pose34(scene,pose,d).scene.parts[0];assert.deepEqual(end.vertices[97].p,base.vertices[97].p);
}
console.log('원형 21종 · 팔 178도에서 세 방향 반응 · 정지 자세 복원 확인');
