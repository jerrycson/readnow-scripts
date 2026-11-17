import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {prepareDefinition} from '../definition-model.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {applyTorso53,torsoPresets53} from '../torso53.mjs';
import {poseShoulders54} from '../shoulder-rig54.mjs';
import {poseShoulders56} from '../shoulder-surface56.mjs';
import {poseShoulders57} from '../shoulder-transition57.mjs';
import {plantFeet55} from '../planted-leg55.mjs';
import {plantFeetKnee57,supportsKneeSurface57} from '../knee-surface57.mjs';
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const same=(a,b)=>assert(isDeepStrictEqual(a.parts,b.parts)&&isDeepStrictEqual(a.joints,b.joints),'표면·재질·격자·관절이 달라짐');
function surfaceDelta(a,b){
 let max=0;
 for(const [i,m]of a.parts.entries())if(m.weights54||['upper-arm','ribcage-waist-pelvis'].includes(m.name))
  for(const [j,v]of m.vertices.entries())max=Math.max(max,distance(v.p,b.parts[i].vertices[j].p));
 return max;
}
let checks=0;const reports=[];
for(const id of ['male-8','female-6','male-2']){
 const study=prepareDefinition(id),base=applyTorso53(study,applyBody52(study,{muscularity:1,adiposity:1}),torsoPresets53.joined);
 const neutral=poseShoulders54(base,{}),pose={side:'right',plane:'front',elevation:.00001,flexion:0,twist:0,joined:true,surface56:1};
 const old=poseShoulders56(base,pose),next=poseShoulders57(base,{...pose,transition57:1});
 same(poseShoulders57(base,{...pose,transition57:0}),old);checks++;
 assert(surfaceDelta(neutral,next)<.000001);checks++;
 reports.push({id,firstBefore:surfaceDelta(neutral,old),firstAfter:surfaceDelta(neutral,next)});
 for(const elevation of [10,45,178]){const p={...pose,elevation};same(poseShoulders57(base,{...p,transition57:1}),poseShoulders56(base,p));checks++;}
 same(poseShoulders57(base,{...pose,transition57:1}),next);checks++;
 const knee={depth:.000001,setback:.48,stance:0,turnout:0,kneeSurface:true};
 same(plantFeetKnee57(base,knee),plantFeet55(base,knee));checks++;
 const first=plantFeetKnee57(base,{...knee,kneeSurface57:true});
 if(supportsKneeSurface57(base)){
  assert.equal(first.kneeSurface57,true);
  assert.strictEqual(plantFeetKnee57(first,null),base);
  for(const side of ['left','right'])for(const [a,b]of [['hip','knee'],['knee','ankle']]){
   assert(Math.abs(distance(first.joints[side][a],first.joints[side][b])-distance(base.joints[side][a],base.joints[side][b]))<1e-8);checks++;
  }
 }else same(first,plantFeet55(base,{...knee,kneeSurface57:true}));
 checks++;
}
assert.throws(()=>poseShoulders57(prepareDefinition('male-8').scene,{transition57:NaN}),RangeError);
console.log(JSON.stringify({checks:checks+1,reports,scope:'첫 움직임·꺼짐·범위 밖 이전형·복원·뼈 길이 계약. 시각 및 해부학 승인 아님.'}));
