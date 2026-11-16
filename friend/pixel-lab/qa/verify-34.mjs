import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DEFAULTS} from '../model.mjs';
import {renderPixels,projectPoint} from '../renderer.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {loadRig} from '../rig32.mjs';
import {articulate} from '../articulation33.mjs';
import {types,form34,raisedPose,pose34,response34} from '../bust34.mjs';

await loadRig();
const fingerprint=r=>createHash('sha256').update(r.data).digest('hex');
const cfg=(sex,heads)=>({...DEFAULTS,sex,heads,designStyle:'manga',candidate:'B',resolution:48});
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const area=(a,b,c)=>{const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);};
let faces=0,poses=0,views=0,triangles=0,minArea=Infinity,maxArea=0;
for(const sex of ['female','male'])for(const heads of [5,6,7,8]){
  const s=cfg(sex,heads),sc=form34(s),hashes=new Set();
  for(const yaw of [-90,-45,0,22.5,45,67.5,90]){
    const opt={portrait:'face',sceneOverride:sc,yaw,freeOrbit:true},result=portraitPixels(s,opt);
    assert.equal(result.width,48);assert.equal(result.data.length,48*48*4);
    const raw=renderPixels(s,opt),point=[0,sc.landmarks.chin[1]+.174,.65], [x,y]=projectPoint(raw,point).map(Math.round);
    const near=[];for(let j=y-2;j<=y+2;j++)for(let i=x-3;i<=x+3;i++){
      if(i<0||i>47||j<0||j>47)continue;const p=(j*48+i)*4,d=result.data;
      if(d[p+3])near.push(d[p+1]);
    }
    assert(near.length>2&&Math.max(...near)-Math.min(...near)>14,sex+' '+heads+' 입술 주변 명암 '+yaw);
    hashes.add(fingerprint(result));faces++;
  }
  assert.equal(hashes.size,7);
}
for(const heads of [5,6,7,8]){
  const s=cfg('female',heads),profiles=new Set();
  for(const [kind] of types)for(const volume of [-1,0,1]){
    const sc=form34(s,kind,{volume}),t=sc.tissue34;
    const rest=sc.parts[0],sh=sc.joints.right.shoulder,hp=sc.joints.right.hip;
    const zone=rest.faces.filter(f=>f.every(i=>(t.responses[i]?.free??0)>.16));
    assert(zone.length>16);const areas=zone.map(f=>area(...f.map(i=>rest.vertices[i].p)));
    for(const arm of [0,90,178]){
      const pose=raisedPose(arm),skinned=pose34(sc,pose).scene,vs=skinned.parts[0].vertices;
      if(!arm)assert.equal(skinned,sc);
      assert(vs.every(v=>v.p.every(Number.isFinite)&&v.n.every(Number.isFinite)));
      zone.forEach((f,k)=>{
        if(areas[k]<1e-7)return;const ratio=area(...f.map(i=>vs[i].p))/areas[k];
        assert(ratio>.025&&ratio<12,JSON.stringify({heads,kind,volume,arm,ratio}));triangles++;minArea=Math.min(minArea,ratio);maxArea=Math.max(maxArea,ratio);
      });
      if(arm===178){
        const plain=articulate(sc,pose).scene.parts[0].vertices;
        let moved=0;for(let i=0;i<vs.length;i++)if(!t.responses[i])assert(dist(vs[i].p,plain[i].p)<1e-8);else if(dist(vs[i].p,plain[i].p)>.003)moved++;
        assert(moved>40);
      }
      for(const yaw of [0,45,90]){
        const r=renderPixels(s,{sceneOverride:{...skinned,frame:sh[0]*2.65,cameraCenter:[0,.78*sh[1]+.22*hp[1],.26]},yaw});
        assert(r.metrics.opaque>160);
        if(arm===0&&yaw===90)profiles.add(fingerprint(r));views++;
      }
      poses++;
    }
    assert.equal(pose34(sc,raisedPose(0),response34(2.2)).scene,sc);
  }
  assert.equal(profiles.size,types.length*3);
}
const s=cfg('female',8),sc=form34(s,'low',{volume:.8}),left=raisedPose(178,'left','bend');
const against=articulate(sc,left).scene.parts[0].vertices,vs=pose34(sc,left).scene.parts[0].vertices;
let moving=0;for(let i=0;i<vs.length;i++){const d=dist(vs[i].p,against[i].p);
 if(sc.tissue34.responses[i]?.side<0)moving+=d>.001?1:0;else assert(d<1e-8);
}assert(moving>25);
for(const [a,k] of [['side',0],['vertical',1],['depth',2]]){
 const soft=response34(.09,a,'left',.8,.06,.1),firm=response34(.09,a,'left',.8,.06,.95);
 assert(Math.abs(soft.left[k])>Math.abs(firm.left[k]));assert(Math.abs(soft.left[k])>9*Math.abs(soft.right[k]));
 assert(Math.abs(soft.left[k])>=Math.max(...soft.left.map(Math.abs))-.00001);
}
console.log(JSON.stringify({faces,poses,views,triangles,minArea,maxArea}));
