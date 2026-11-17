import assert from 'node:assert/strict';
import {prepareDefinition,renderDefinitionView} from '../definition-model.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {applyTorso53,torsoPresets53} from '../torso53.mjs';

const position=p=>p.map(v=>Math.round(v*1e7)).join(',');
const seamEdge=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const paired=new Set(['ribcage-waist-pelvis','thigh','pelvis-thigh-surface53']);
function checkSeams(scene){
  const usage=new Map();
  for(const mesh of scene.parts.filter(m=>paired.has(m.name))){
    const join=mesh.name==='pelvis-thigh-surface53',coords=mesh.vertices.map(v=>position(v.p));
    for(const [i,j,k] of mesh.faces){
      const corners=[coords[i],coords[j],coords[k]];
      assert.equal(corners.length,new Set(corners).size,'퇴화한 삼각형');
      for(let e=0;e<3;e++){
        const edge=seamEdge(corners[e],corners[(e+1)%3]),record=usage.get(edge)??[0,0];
        record[Number(join)]++;usage.set(edge,record);
      }
    }
  }
  const stitched=[...usage.values()].filter(([,j])=>j>0);
  assert(stitched.length>0,'새 연결면 누락');
  assert(stitched.every(([o,j])=>o+j===2),'연결면에 열린 모서리 또는 중복 면');
  return stitched.filter(([o,j])=>o===1&&j===1).length;
}
const results=[];
for(const sex of ['female','male'])for(const n of [2,3,4,5,6,7,8]){
  const study=prepareDefinition(sex+'-'+n);
  const combines=[{}, {adiposity:0,muscularity:1}, {adiposity:1,muscularity:1}];
  for(const b of combines){
    const base=applyBody52(study,b),shape=applyTorso53(study,base,torsoPresets53.joined);
    const kept=base.parts.filter(m=>!paired.has(m.name));
    assert(kept.every(m=>shape.parts.includes(m)),'얼굴·팔·다리 하단 또는 발 변경');
    const torso=base.parts.find(m=>m.name==='ribcage-waist-pelvis');
    const target=shape.parts.find(m=>m.name===torso.name);
    const hip=study.scene.joints.pelvis[1],height=study.scene.proportions.shoulderY-hip;
    let protectedCount=0;
    for(let i=0;i<torso.vertices.length;i++)if(torso.vertices[i].p[1]>=hip+.48*height){
      assert.equal(target.vertices[i],torso.vertices[i],'보호한 가슴 피부의 좌표 또는 법선 변경');
      protectedCount++;
    }
    const seams=checkSeams(shape);
    assert.equal(applyTorso53(study,shape,torsoPresets53.original),base,'원형 복구 실패');
    const frame=(s,yaw,pitch)=>renderDefinitionView(study,s,{yaw,pitch,size:48}).data;
    let changed=0;
    for(const [yaw,pitch] of [[0,0],[48,13],[-90,0],[180,-8]]){
      const x=frame(base,yaw,pitch),y=frame(shape,yaw,pitch);
      for(let i=0;i<x.length;i+=4)if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2]||x[i+3]!==y[i+3])changed++;
    }
    assert(changed>0);
    results.push({id:study.id,body:b,seams,protectedCount,changed});
  }
}
console.log(JSON.stringify(results));
