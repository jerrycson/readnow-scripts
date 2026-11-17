import assert from 'node:assert/strict';
import {prepareDefinition} from '../definition-model.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {applyTorso53,torsoPresets53} from '../torso53.mjs';
import {poseShoulders54} from '../shoulder-rig54.mjs';
import {poseShoulders56} from '../shoulder-surface56.mjs';
import {plantFeet55} from '../planted-leg55.mjs';
import {sub} from '../geometry.mjs';

const distance=(a,b)=>Math.hypot(...sub(a,b));
function sleeveDelta(a,b,which){
 let max=0;
 for(const [i,m] of a.parts.entries())if(m.weights54&&(!which||m.name.startsWith(which))){
  const other=b.parts[i];assert.equal(other.name,m.name);assert.equal(m.vertices.length,other.vertices.length);
  for(const [k,v] of m.vertices.entries()){
   const d=distance(v.p,other.vertices[k].p);assert(Number.isFinite(d));max=Math.max(max,d);
  }
 }
 return max;
}
const cases=[];
for(const id of ['male-8','female-6','male-2']){
 const s=prepareDefinition(id),base=applyTorso53(s,applyBody52(s,{adiposity:1,muscularity:1}),torsoPresets53.joined);
 const rest=poseShoulders54(base,{}),order=[0,.001,1,15,45,75,89,90,91,105,140,178,105,90,45,0];
 const samples=new Map();let last,previousAngle;
 for(const angle of order){
  const pose={side:'right',plane:'front',elevation:angle,flexion:angle?45:0};
  const old=poseShoulders54(base,pose),zero=poseShoulders56(base,{...pose,surface56:0});
  assert.equal(sleeveDelta(old,zero),0);
  const corrected=poseShoulders56(base,{...pose,surface56:1});
  const repeat=samples.get(angle);
  if(repeat)assert.equal(sleeveDelta(corrected,repeat),0);
  samples.set(angle,corrected);
  const ground={depth:angle/178*.18,turnout:0,stance:0};
  const withLeg=plantFeet55(corrected,ground),oldWithLeg=plantFeet55(old,ground);
  const boneError=Math.max(...['left','right'].flatMap(side=>[['hip','knee'],['knee','ankle'],['shoulder','elbow'],['elbow','wrist']].map(([a,b])=>
   Math.abs(distance(withLeg.joints[side][a],withLeg.joints[side][b])-distance(rest.joints[side][a],rest.joints[side][b])))));
  const ankleDrift=Math.max(...['left','right'].map(side=>distance(rest.joints[side].ankle,withLeg.joints[side].ankle)));
  const effect=sleeveDelta(old,corrected),combinedEffect=sleeveDelta(oldWithLeg,withLeg);
  assert(boneError<1e-7&&ankleDrift<1e-7&&Math.abs(effect-combinedEffect)<1e-7);
  assert(sleeveDelta(rest,corrected,'left')<1e-7);
  cases.push({id,angle,previousAngle,step:last?sleeveDelta(last,corrected):null,oldStep:last?sleeveDelta(last.old,old):null,
   effect,combinedEffect,boneError,ankleDrift});
  last={...corrected,old};previousAngle=angle;
 }
}
console.log(JSON.stringify({cases,unit:'머리 높이',limits:'같은 자세를 복원하며 어깨·팔꿈치 및 골반·무릎 뼈 길이와 발목 위치를 검사했다. 사람 동작의 피부나 접지력 실측은 별도다.'},null,2));
