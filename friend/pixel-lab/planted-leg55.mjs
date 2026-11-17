import {add,sub,mul,dot,cross,norm,lerp} from './geometry.mjs';
import {normalAt53} from './pelvis-pose53.mjs';
import {preserveHipArea55} from './hip-surface55.mjs';
import {plantSole55} from './sole-pad55.mjs';
import {applyKneeSurface55} from './knee-surface55.mjs';

const lowerParts=new Set(['ribcage-waist-pelvis','pelvis-thigh-surface53','thigh','calf','knee','foot']);
const sides=['left','right'];
const identity=[0,0,0,1],up=[0,1,0],forward=[0,0,1];
const originals=new WeakMap();
const radians=Math.PI/180;
const length=p=>Math.hypot(...p);
const scaleVector=(v,k)=>v.map(x=>x*k);
const bound=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function smooth(a,b,x){
  const t=bound((x-a)/(b-a),0,1);
  return t*t*(3-2*t);
}
function rotation(axis,angle){return [...mul(axis,Math.sin(angle/2)),Math.cos(angle/2)];}
function align(from,to){
  const a=norm(from),b=norm(to),q=[...cross(a,b),1+bound(dot(a,b),-1,1)];
  const size=length(q);
  if(size<1e-8)return rotation(norm(cross(a,Math.abs(a[0])<.8?[1,0,0]:up)),Math.PI);
  return scaleVector(q,1/size);
}
function rotate(q,p){
  const xyz=q.slice(0,3),t=mul(cross(xyz,p),2);
  return add(p,add(mul(t,q[3]),cross(xyz,t)));
}
function between(a,b,t){
  if(t<=0)return a;
  if(t>=1)return b;
  const sign=dot(a,b)<0?-1:1;
  const v=lerp(a,scaleVector(b,sign),t);
  return scaleVector(v,1/length(v));
}
const around=(p,base,target,q)=>add(target,rotate(q,sub(p,base)));
function input(raw,key,fallback,min,max){
  const x=raw[key]??fallback;
  if(!Number.isFinite(x)||x<min||x>max)throw RangeError('접지 자세 범위 확인 · '+key);
  return x;
}
export function supportRig55(rest,raw={}){
  let depth=input(raw,'depth',0,0,.52);
  const setback=input(raw,'setback',.48,-.2,1.1);
  const turnout=input(raw,'turnout',0,-15,40),stance=input(raw,'stance',0,-.22,.55);
  const support=rest.joints,legLength=support.right.hip[1]-support.right.ankle[1];
  const span=Math.abs(support.right.hip[0]-support.left.hip[0]);
  let back=-depth*legLength*setback;
  if(raw.segmentAngles){
    const thighAngle=input(raw.segmentAngles,'thigh',0,-90,140)*radians;
    const shinAngle=input(raw.segmentAngles,'shin',0,-85,100)*radians;
    const {hip,knee,ankle}=support.right;
    const upperLength=Math.hypot(knee[1]-hip[1],knee[2]-hip[2]);
    const lowerLength=Math.hypot(ankle[1]-knee[1],ankle[2]-knee[2]);
    depth=Math.max(0,1-(upperLength*Math.cos(thighAngle)+lowerLength*Math.cos(shinAngle))/legLength);
    back=ankle[2]-hip[2]-upperLength*Math.sin(thighAngle)-lowerLength*Math.sin(shinAngle);
  }
  let drop=legLength*depth;
  const legs=sides.map((side,index)=>{
    const sign=index?1:-1,{hip,knee,ankle}=support[side];
    const anchor=add(ankle,[sign*stance*span/2,0,0]);
    const thigh=length(sub(knee,hip)),shin=length(sub(ankle,knee));
    // 발 간격을 넓혔을 때 뼈가 늘어나지 않도록 골반이 실제로 닿는 최고 높이를 구한다.
    const available=(thigh+shin)**2-(anchor[0]-hip[0])**2-(anchor[2]-hip[2]-back)**2;
    if(available<=0)throw RangeError('이 체형에서 발 간격이 다리 길이를 넘었습니다.');
    drop=Math.max(drop,hip[1]-anchor[1]-Math.sqrt(available));
    return {hip,knee,ankle,anchor,sign,thigh,shin};
  });
  const delta=[0,-drop,back],pelvis=add(support.pelvis,delta);
  const torso=rotation([1,0,0],bound(-back/legLength*1.45,-.10,.58));
  const upper=p=>around(p,support.pelvis,pelvis,torso);
  for(const leg of legs){
    const {hip,knee,ankle,anchor,sign,thigh,shin}=leg;
    const h=add(hip,delta),line=sub(anchor,h),d=length(line),axis=norm(line);
    const along=(thigh*thigh-shin*shin+d*d)/(2*d);
    const rise=Math.sqrt(Math.max(0,thigh*thigh-along*along));
    const footRotation=rotation(up,turnout*sign*radians),direction=rotate(footRotation,forward);
    // 시작 자세의 미세한 무릎 오프셋까지 이어지게 굽힘면을 정한다.
    const restAxis=norm(sub(ankle,hip)),off=sub(knee,hip);
    const restPole=norm(sub(off,mul(restAxis,dot(off,restAxis))));
    const pole=norm(lerp(restPole,direction,smooth(0,.12,depth+Math.abs(stance))));
    const bendDir=norm(sub(pole,mul(axis,dot(pole,axis))));
    const k=add(h,add(mul(axis,along),mul(bendDir,rise)));
    Object.assign(leg,{h,k,footRotation,qThigh:align(sub(knee,hip),sub(k,h)),qShin:align(sub(ankle,knee),sub(anchor,k))});
  }
  const hipWidth=span*.5,cute=rest.proportions.cute;
  const kneeMesh=rest.parts.find(p=>p.name==='knee'),zs=kneeMesh.vertices.map(v=>v.p[2]);
  const kneeRadius=(Math.max(...zs)-Math.min(...zs))*.5;
  function material(p,leg){
    const {h,k,hip,knee,ankle,anchor,thigh,shin,qThigh,qShin,footRotation}=leg;
    const y=p[1],mid=hip[1],hipTop=Math.min(thigh*(cute?.9:.38),.58*(rest.proportions.shoulderY-mid));
    const hipBottom=thigh*(cute?1.10:.45);
    const kneeBand=Math.min(.68*shin,Math.max(.22*thigh,1.75*kneeRadius));
    const ankleBand=Math.min(.30*shin,Math.max(.10*shin,ankle[1]*.9));
    if(y>=mid+hipTop)return upper(p);
    const hipW=1-smooth(mid-hipBottom,mid+hipTop,y);
    const hipQ=between(torso,qThigh,hipW),hipAt=hipW>=1?h:lerp(upper(hip),h,hipW);
    if(y>=knee[1]+kneeBand)return around(p,hip,hipAt,hipQ);
    const kneeW=1-smooth(knee[1]-kneeBand,knee[1]+kneeBand,y);
    const kneeQ=between(hipQ,qShin,kneeW);
    const kneeAt=(hipW>=1||kneeW>=1)?k:lerp(around(knee,hip,hipAt,hipQ),k,kneeW);
    if(y>=ankle[1]+ankleBand)return around(p,knee,kneeAt,kneeQ);
    const ankleW=1-smooth(ankle[1]-ankleBand,ankle[1]+ankleBand,y);
    const ankleAt=kneeW>=1?anchor:lerp(around(ankle,knee,kneeAt,kneeQ),anchor,ankleW);
    return around(p,ankle,ankleAt,between(kneeQ,footRotation,ankleW));
  }
  function transform(p,part,hardSide){
    if(part==='foot'){
      const leg=legs[hardSide];return around(p,leg.ankle,leg.anchor,leg.footRotation);
    }
    if(!lowerParts.has(part))return upper(p);
    if(['knee','calf'].includes(part))return material(p,legs[hardSide]);
    const half=hipWidth*(cute?.60:.55)*Math.max(cute?.5:.07,smooth(-.62,0,(p[1]-support.pelvis[1])/legs[0].thigh));
    const w=smooth(-half,half,p[0]);
    if(w<=0)return material(p,legs[0]);
    if(w>=1)return material(p,legs[1]);
    return lerp(material(p,legs[0]),material(p,legs[1]),w);
  }
  const joints={...support,pelvis,neck:upper(support.neck)};
  for(const [i,name] of sides.entries()){
    const leg=legs[i];joints[name]=Object.fromEntries(Object.entries(support[name]).map(([k,p])=>[k,upper(p)]));
    Object.assign(joints[name],{hip:leg.h,knee:leg.k,ankle:leg.anchor});
  }
  return {legs,transform,joints,epsilon:legLength*1e-5,torso,neutral:!depth&&!back&&!turnout&&!stance};
}
export function plantFeet55(scene,raw){
  const rest=originals.get(scene)||scene;
  if(!raw)return rest;
  const rig=supportRig55(rest,raw);
  const pads=raw.supportPads===true&&rest.proportions.cute;
  if(rig.neutral&&!pads)return rest;
  const parts=rest.parts.map(original=>{
    const m=pads&&original.name==='foot'?plantSole55(original):original;
    if(rig.neutral)return m;
    const side=Number(m.vertices.reduce((s,v)=>s+v.p[0],0)>0),isLeg=lowerParts.has(m.name);
    const posed={...m,vertices:m.vertices.map(v=>({
      ...v,p:rig.transform(v.p,m.name,side),
      n:m.name==='foot'?rotate(rig.legs[side].footRotation,v.n):isLeg?normalAt53(rig,v.p,v.n,m.name,side).normal:rotate(rig.torso,v.n)
    }))};
    return m.name==='pelvis-thigh-surface53'?preserveHipArea55(m,posed,!rest.proportions.cute):posed;
  });
  const posed={...rest,parts,joints:rig.joints,feet:rest.feet.map((foot,i)=>({...foot,ankle:rig.legs[i].anchor}))};
  const result=raw.kneeSurface===true?applyKneeSurface55(rest,posed,rig):posed;
  originals.set(result,rest);
  return result;
}
