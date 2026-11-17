import assert from 'node:assert/strict';
import {prepareDefinition} from '../definition-model.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {applyTorso53,torsoPresets53} from '../torso53.mjs';
import {poseShoulders54,shoulderRest54} from '../shoulder-rig54.mjs';
import {shoulderFrame54,behindHead54} from '../shoulder-motion54.mjs';
import {sub,cross,norm,dot} from '../geometry.mjs';

const distance=(a,b)=>Math.hypot(...sub(a,b));
const key=p=>p.map(x=>Math.round(x*1e7)).join('/');
const edge=(a,b)=>a<b?a+';'+b:b+';'+a;
function seams(scene){
  const uses=new Map(),skinEdges=new Set(),pairs=[];
  for(const m of scene.parts){
    if(!m.weights54&&!['ribcage-waist-pelvis','upper-arm'].includes(m.name))continue;
    const coords=m.vertices.map(v=>key(v.p));
    for(const [i,j,k] of m.faces){
      const a=coords[i],b=coords[j],c=coords[k];
      for(const e of [edge(a,b),edge(b,c),edge(c,a)])uses.set(e,(uses.get(e)||0)+1);
      if(!m.weights54)continue;
      for(const e of [edge(a,b),edge(b,c),edge(c,a)])skinEdges.add(e);
      pairs.push([m,i,j,k]);
    }
  }
  assert(skinEdges.size>0);
  for(const e of skinEdges)assert.equal(uses.get(e),2,'어깨 이음에 열린 모서리 또는 겹면 '+e);
  return pairs;
}
function folded(pairs){
  const edges=new Map();let sharp=0,max=0;
  for(const [m,i,j,k] of pairs){
    const [a,b,c]=[i,j,k].map(n=>m.vertices[n].p);
    const normal=norm(cross(sub(b,a),sub(c,a)));
    assert(normal.every(Number.isFinite));
    for(const [p,q] of [[a,b],[b,c],[c,a]]){
      const e=edge(key(p),key(q));
      if(edges.has(e)){
        const d=dot(normal,edges.get(e)),deg=Math.acos(Math.min(1,Math.max(-1,d)))*180/Math.PI;
        if(deg>125)sharp++;max=Math.max(max,deg);
      }else edges.set(e,normal);
    }
  }
  return {sharp,maxDegrees:Math.round(max)};
}
let bones=0,maxError=0;const cases=[];
for(const sex of ['female','male'])for(let height=2;height<=8;height++){
  const study=prepareDefinition(sex+'-'+height),scene=study.scene;
  assert.equal(poseShoulders54(scene,null),scene);
  for(const side of ['left','right'])for(const plane of ['side','scapular','front']){
    const j=scene.joints[side];
    for(let angle=0;angle<=180;angle+=5){
      const pose={...shoulderRest54,plane,elevation:Math.min(178,angle),flexion:angle%140,twist:(angle%125)-60};
      for(const frame of [shoulderFrame54(scene,side,pose),behindHead54(scene,side,pose)]){
        const err=Math.max(Math.abs(distance(j.shoulder,j.elbow)-distance(frame.shoulder,frame.elbow)),Math.abs(distance(j.elbow,j.wrist)-distance(frame.elbow,frame.wrist)));
        maxError=Math.max(maxError,err);assert(err<1e-9);bones++;
      }
    }
  }
  for(const [index,shape] of [{},{muscularity:1,adiposity:0},{muscularity:1,adiposity:1}].entries()){
    const body=applyBody52(study,shape),base=applyTorso53(study,body,torsoPresets53.joined);
    for(const [label,pose] of Object.entries({rest:{},side75:{elevation:75},side140:{elevation:140},front90:{plane:'front',side:'right',elevation:90,flexion:45},behind:{elevation:120,plane:'scapular',reach:true}})){
      const result=poseShoulders54(base,pose),angle=folded(seams(result));
      if(height<=4){
        const rigid=poseShoulders54(base,{...pose,joined:false});
        const raw=rigid.parts.filter(m=>m.name==='upper-arm'),joined=result.parts.filter(m=>m.name==='upper-arm');
        raw.forEach((m,k)=>{for(let v=36;v<m.vertices.length;v++)assert(distance(m.vertices[v].p,joined[k].vertices[v].p)<1e-9,'짧은 위팔의 팔꿈치 단면 이동');});
      }
      assert(base.parts.filter(m=>m.name.includes('eye')||m.name==='thigh'||m.name==='calf'||m.name==='pelvis-thigh-surface53').every(m=>result.parts.includes(m)));
      if(pose.side==='right')assert.deepEqual(result.joints.left,base.joints.left);
      cases.push({id:study.id,index,label,...angle});
    }
  }
}
console.log(JSON.stringify({bones,maxError,cases}));
