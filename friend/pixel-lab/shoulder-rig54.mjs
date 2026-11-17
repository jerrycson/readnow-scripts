import {add,sub,mul,dot,cross,norm,lerp} from './geometry.mjs';
import {behindHead54,shoulderFrame54} from './shoulder-motion54.mjs';
import {shoulderSocket54} from './shoulder-socket54.mjs';
import {finishShoulderSurface54} from './shoulder-surface54.mjs';
import {rotateNormals50} from './body-multiview50.mjs';

const sleeveCache=new WeakMap();
const forearm=new Set(['forearm','palm','finger','thumb','mitten','elbow']);
const upperArm=new Set(['upper-arm','deltoid']);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const axis=(v,angle,p)=>{
  const s=Math.sin(angle),c=Math.cos(angle);
  return add(add(mul(p,c),mul(cross(v,p),s)),mul(v,dot(v,p)*(1-c)));
};
function rotationPower(rotate){
  const x=rotate([1,0,0]),y=rotate([0,1,0]),z=rotate([0,0,1]);
  const c=Math.min(1,Math.max(-1,(x[0]+y[1]+z[2]-1)/2)),r=Math.acos(c);
  if(r<1e-8)return p=>p;
  let v=[y[2]-z[1],z[0]-x[2],x[1]-y[0]];
  if(Math.hypot(...v)<1e-7){const col=[x,y,z],i=[x[0],y[1],z[2]].indexOf(Math.max(x[0],y[1],z[2]));v=col[i].slice();v[i]+=1;}
  v=norm(v);
  return (p,w)=>axis(v,r*w,p);
}
function torsoSkin(scene,p,frame){
  const shoulder=frame.gh,w=Math.abs(shoulder[0]),depth=scene.proportions.depth;
  const y=(p[1]-shoulder[1])/w,lateral=Math.abs(p[0])/w;
  const influence=smooth(.28,.87,lateral)*smooth(-.85,-.15,y);
  if(!influence)return p;
  const scap=smooth(-.12,.62,-p[2]/depth);
  const result=lerp(p,lerp(frame.clavicle(p),frame.scapula(p),scap),influence);
  // 팔이 올라갈 때 앞·뒤 겨드랑이 주름의 몸통 쪽 끝도 함께 올라간다.
  const lift=frame.lift*w*smooth(.26,.92,lateral)*smooth(-1.20,-.38,y);
  result[1]+=lift*(.20+.06*scap);
  return result;
}
function sleevePoint(scene,frame,p,t,curve){
  const a=torsoSkin(scene,curve.torso,frame),b=frame.upper(curve.limb);
  const chord=sub(b,a),length=Math.hypot(...chord);
  const n=curve.torsoNormal,m=frame.upperRot(curve.limbNormal);
  const tan=sub(chord,mul(n,dot(chord,n)));
  const axis=norm(sub(frame.elbow,frame.shoulder));
  // 손을 머리 위에 두어도 이음의 끝 접선은 위팔 장축을 따른다.
  const dist=Math.min(length,Math.hypot(...sub(curve.limb,frame.gh)))*.84;
  const end=mul(norm(sub(axis,mul(m,dot(axis,m)))),dist);
  const q=t*t,s=q*t;
  const bent=add(add(mul(a,2*s-3*q+1),mul(b,3*q-2*s)),add(mul(tan,s-2*q+t),mul(end,s-q)));
  const body=torsoSkin(scene,p,frame),w=smooth(0,1,t);
  const original=add(add(frame.gh,frame.partial(sub(p,frame.gh),w)),lerp(sub(body,p),sub(frame.shoulder,frame.gh),w));
  return lerp(original,bent,frame.lift);
}
function changeSurface(mesh,point){
  const vertices=mesh.vertices.map((v,i)=>{
    const p=point(v.p,i);return p===v.p?v:{...v,p};
  });
  rotateNormals50(mesh.vertices,vertices,mesh.faces,1);
  return {...mesh,vertices};
}
function rigid(mesh,point,rotate){
  return {...mesh,vertices:mesh.vertices.map(v=>({...v,p:point(v.p),n:rotate(v.n)}))};
}
export const shoulderRest54=Object.freeze({plane:'side',side:'both',elevation:0,flexion:0,twist:0,reach:false,joined:true});
export function poseShoulders54(scene,raw){
  if(!raw||!scene.proportions||!scene.parts.some(m=>m.name==='upper-arm'))return scene;
  const pose={...shoulderRest54,...raw};
  for(const [key,lo,hi] of [['elevation',0,178],['flexion',0,145],['twist',-70,70]]){
    if(!Number.isFinite(pose[key])||pose[key]<lo||pose[key]>hi)throw RangeError('어깨·팔꿈치 설정 범위를 확인하세요.');
  }
  if(!['side','scapular','front'].includes(pose.plane)||!['left','right','both'].includes(pose.side))throw RangeError('어깨 방향을 확인하세요.');
  let rest=scene;
  if(pose.joined){
    if(!sleeveCache.has(scene))sleeveCache.set(scene,shoulderSocket54(scene));
    rest=sleeveCache.get(scene);
  }
  if(!pose.elevation&&!pose.flexion&&!pose.twist&&!pose.reach)return pose.joined?{...rest,parts:finishShoulderSurface54(rest.parts,rest.parts)}:rest;
  const frames={};
  for(const side of ['left','right'])if(pose.side===side||pose.side==='both'){
    const f=pose.reach?behindHead54(rest,side,pose):shoulderFrame54(rest,side,pose);
    f.partial=rotationPower(f.upperRot);
    const arm=norm(sub(f.elbow,f.shoulder)),restArm=norm(sub(f.j.elbow,f.gh));
    f.lift=smooth(2,90,Math.acos(Math.max(-1,Math.min(1,dot(arm,restArm))))*180/Math.PI);
    frames[side]=f;
  }
  const joints={...rest.joints};
  for(const [side,f] of Object.entries(frames))joints[side]={...rest.joints[side],shoulder:f.shoulder,elbow:f.elbow,wrist:f.wrist};
  const parts=rest.parts.map(mesh=>{
    if(mesh.name==='ribcage-waist-pelvis'||mesh.name.startsWith('surface-')){
      return changeSurface(mesh,p=>{const f=frames[p[0]<0?'left':'right'];return f?torsoSkin(rest,p,f):p;});
    }
    const jointSkin=mesh.weights54;
    if(!jointSkin&&!forearm.has(mesh.name)&&!upperArm.has(mesh.name))return mesh;
    const side=mesh.vertices.reduce((a,v)=>a+v.p[0],0)<0?'left':'right',f=frames[side];
    if(!f)return mesh;
    if(!jointSkin)return forearm.has(mesh.name)?rigid(mesh,f.lower,f.lowerRot):rigid(mesh,f.upper,f.upperRot);
    return changeSurface(mesh,(p,i)=>{
      const t=jointSkin[i];if(t===1)return f.upper(p);
      if(t===0)return torsoSkin(rest,p,f);
      return sleevePoint(rest,f,p,t,mesh.curves54[i]);
    });
  });
  const skin=pose.joined?finishShoulderSurface54(rest.parts,parts):parts;
  return {...rest,parts:skin,joints,shoulder54:{...pose,angles:Object.fromEntries(Object.entries(frames).map(([side,f])=>[side,f.g]))}};
}
