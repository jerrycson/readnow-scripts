import assert from 'node:assert/strict';
import {prepareDefinition} from '../definition-model.mjs';
import {applyBody52} from '../body-composition52.mjs';
import {applyTorso53} from '../torso53.mjs';
import {poseJoinedPelvis53} from '../pelvis-pose53.mjs';
import {plantFeet55,supportRig55} from '../planted-leg55.mjs';
import {sub,cross,dot,norm} from '../geometry.mjs';

const gap=(a,b)=>Math.hypot(...sub(a,b));
const poses={light:{depth:.14},deep:{depth:.40,turnout:22,stance:.35},limit:{depth:.50,turnout:32,setback:.70,stance:.50},narrow:{depth:.26,turnout:-10,setback:-.06,stance:-.20}};
const surfaceNames=['pelvis-thigh-surface53','thigh','calf','knee','foot'];
function shapeAudit(base,scene){
  const stats={};let footGround=0,planeDrift=0,negative=0,minRatio=Infinity;
  for(let j=0;j<scene.parts.length;j++){
    const m=scene.parts[j],prior=base.parts[j];if(!surfaceNames.includes(m.name))continue;
    const part=stats[m.name]??={fold:0,crushed:0,max:0};
    if(m.name==='foot'){
      const minimum=mesh=>Math.min(...mesh.vertices.map(v=>v.p[1]));
      footGround=Math.max(footGround,Math.abs(minimum(prior)-minimum(m)));
      m.vertices.forEach((v,i)=>{planeDrift=Math.max(planeDrift,Math.abs(v.p[1]-prior.vertices[i].p[1]));});
    }
    const edges=new Map();
    function normal(mesh,a,b,c){
      const p=mesh.vertices;return cross(sub(p[b].p,p[a].p),sub(p[c].p,p[a].p));
    }
    for(const [a,b,c] of m.faces){
      const old=normal(prior,a,b,c),area=Math.hypot(...old);
      if(area<1e-9)continue;
      const now=normal(m,a,b,c),magnitude=Math.hypot(...now),r=magnitude/area;
      assert(Number.isFinite(r));if(r<.15)part.crushed++;minRatio=Math.min(minRatio,r);
      if(magnitude<1e-12){negative++;continue;}
      const dir=norm(now),oldDir=norm(old);
      for(const [ia,ib] of [[a,b],[b,c],[c,a]]){
        const key=Math.min(ia,ib)+','+Math.max(ia,ib);
        const peer=edges.get(key);
        if(peer){
          const angle=(l,h)=>Math.acos(Math.max(-1,Math.min(1,dot(l,h))))*180/Math.PI;
          const bend=angle(dir,peer.dir),origBend=angle(oldDir,peer.oldDir);
          if(bend>125&&origBend<100)part.fold++;part.max=Math.max(part.max,bend-origBend);
        }else edges.set(key,{dir,oldDir});
      }
    }
  }
  return {footGround,planeDrift,degenerate:negative,minRatio,parts:stats};
}
const rows=[],baseline=[],jointErrors=[];let frames=0;
for(const sex of ['female','male'])for(let h=2;h<=8;h++){
  const study=prepareDefinition(sex+'-'+h);
  for(const [form,shape] of Object.entries({original:{},lean:{muscularity:1,adiposity:0},broad:{muscularity:1,adiposity:1}})){
    const rest=applyTorso53(study,applyBody52(study,shape),{pelvisJoin53:true});
    assert.equal(plantFeet55(rest,{}),rest);
    const prior=poseJoinedPelvis53(rest,{left:{flex:40,knee:65},right:{flex:40,knee:65}});
    const foot=prior.parts.filter(m=>m.name==='foot');
    baseline.push({id:study.id,form,oldLowest:Math.min(...foot.flatMap(m=>m.vertices.map(v=>v.p[1]))),ankleDrift:gap(prior.joints.right.ankle,rest.joints.right.ankle)});
    for(const [key,pose] of Object.entries(poses)){
      const scene=plantFeet55(rest,pose),data=shapeAudit(rest,scene);
      assert.equal(plantFeet55(scene,null),rest);
      assert(data.footGround<1e-9&&data.planeDrift<1e-9&&data.degenerate===0);
      rows.push({id:study.id,form,pose:key,...data});
    }
    let error=0;
    for(let i=0;i<=60;i++){
      const t=i/60,rig=supportRig55(rest,{depth:.5*t,turnout:35*t,stance:.5*t,setback:.7});
      rig.legs.forEach(leg=>{error=Math.max(error,Math.abs(gap(leg.h,leg.k)-leg.thigh),Math.abs(gap(leg.k,leg.anchor)-leg.shin));});
      frames++;
    }
    assert(error<1e-8);jointErrors.push(error);
  }
}
console.log(JSON.stringify({baseline,rows,skeletonFrames:frames,maxBoneError:Math.max(...jointErrors)}));
