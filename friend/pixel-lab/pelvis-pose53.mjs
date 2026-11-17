// 53차 중립 골반 접합 뒤에 적용하는 국소 자세 연구. 도(deg), +z 앞, +x 모델 오른쪽.
const rad = Math.PI / 180;
const names = new Set(['ribcage-waist-pelvis','pelvis-thigh-surface53','thigh','calf','knee','foot']);
const sides = ['left','right'];
const restScenes = new WeakMap();
const profiles = {
  narrow: {top:.18, bottom:.34, middle:.49},
  wide: {top:.31, bottom:.57, middle:.65},
  gradual: {top:.44, bottom:.69, middle:.73},
  compact1: {top:.76, bottom:.82, middle:.83,midFloor:.50},
  compact2: {top:1.06, bottom:.85, middle:1.18,midFloor:.48},
  compact3: {top:1.28, bottom:.92, middle:1.43,midFloor:.56}
};
const sub = (p,q) => p.map((x,i)=>x-q[i]);
const add = (p,q) => p.map((x,i)=>x+q[i]);
const mix = (a,b,t) => a.map((v,k)=>v+(b[k]-v)*t);
const cross = ([a,b,c],[d,e,f]) => [b*f-c*e,c*d-a*f,a*e-b*d];
const normalize = v => {const length=Math.hypot(...v)||1;return v.map(x=>x/length);};
function smooth(start,end,v) {
  const t=Math.max(0,Math.min(1,(v-start)/(end-start)));
  return t*t*(3-2*t);
}
function rx([x,y,z],a) {
  return a?[x,y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)]:[x,y,z];
}
function rz([x,y,z],a) {
  return a?[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z]:[x,y,z];
}
function checked(v,range) {
  if(v==null)return 0;
  if(!Number.isFinite(v)||Math.abs(v)>range)throw new RangeError('자세 각도가 실험 범위를 벗어났습니다.');
  return v*rad;
}
export function makeHipRig53(scene,pose={},options={}) {
  const rest=restScenes.get(scene)||scene;
  const method=options.method||'arc';
  const {joints}=rest;
  const tilt=checked(pose.pelvisTilt,45),list=checked(pose.pelvisList,40);
  const scale=Math.hypot(...sub(joints.right.knee,joints.right.hip));
  const width=(joints.right.hip[0]-joints.left.hip[0])*.5;
  const kneeMesh=rest.parts.find(m=>m.name==='knee');
  const kneeDepth=kneeMesh.vertices.map(v=>v.p[2]);
  const kneeRadius=(Math.max(...kneeDepth)-Math.min(...kneeDepth))*.5;
  // 2등신은 대퇴 길이에 비해 무릎이 굵다. 발등까지 휘지 않은 시험 폭을 사용한다.
  const kneeBand=Math.max(.20*scale,kneeRadius*(options.kneeBandFactor??1.85));
  const adaptive=!options.profile||options.profile==='auto';
  const profileName=adaptive?(rest.proportions.cute?'compact3':'gradual'):options.profile;
  const profile=profiles[profileName];
  if(!profile||!['rigidParts','linear','arc'].includes(method))throw new Error('골반 자세 실험 설정을 확인하세요.');
  const upper=adaptive?Math.min(profile.top,.64*(rest.proportions.shoulderY-joints.pelvis[1])/scale):profile.top;
  const bands=sides.map((side,index)=>{
    const hip=joints[side].hip, knee=joints[side].knee, input=pose[side]||{};
    return {index,hip,knee,flex:checked(input.flex,130),abd:checked(input.abduct,75)*(index?1:-1),bend:checked(input.knee,145)};
  });
  const neutral=!tilt&&!list&&bands.every(b=>!b.flex&&!b.abd&&!b.bend);
  const root=p=>!tilt&&!list?p:add(joints.pelvis,rz(rx(sub(p,joints.pelvis),tilt),list));
  const thigh=(p,b,w)=>!w||(!b.flex&&!b.abd)?p:add(b.hip,rx(rz(sub(p,b.hip),b.abd*w),-b.flex*w));
  const lower=(p,b,w)=>!w||!b.bend?p:add(b.knee,rx(sub(p,b.knee),b.bend*w));
  const fk=(p,b,hw,kw)=>{
    if(method==='linear'){
      const corrected=mix(p,lower(p,b,1),kw);
      return mix(corrected,thigh(corrected,b,1),hw);
    }
    return thigh(lower(p,b,kw),b,hw);
  };
  function transform(p,part,hardSide) {
    if(!names.has(part))return root(p);
    if(method==='rigidParts') {
      if(part==='pelvis-thigh-surface53'||part==='ribcage-waist-pelvis')return root(p);
      const b=bands[hardSide],kw=part==='thigh'?0:part==='knee'?.5:1;
      return root(fk(p,b,1,kw));
    }
    const [x,y]=p;
    const height=(y-joints.pelvis[1])/scale;
    const hipWeight=1-smooth(-profile.bottom,upper,height);
    if(!hipWeight)return root(p);
    // 허벅지 아래는 각 다리에 속한다. 몸통과 새들의 원래 같은 위치에서는
    // 메시 이름·정점 번호와 무관하게 양쪽 다리의 가중치가 일치한다.
    const movingJoint=part==='calf'||part==='foot'||part==='knee';
    const midWidth=width*profile.middle*Math.max(profile.midFloor||.06,smooth(-.61,-.01,height));
    const side=movingJoint?hardSide:smooth(-midWidth,midWidth,x);
    const optionsFor=b=>{
      const kneeWeight=1-smooth(-kneeBand,kneeBand,y-b.knee[1]);
      return fk(p,b,hipWeight,kneeWeight);
    };
    if(side<=0)return root(optionsFor(bands[0]));
    if(side>=1)return root(optionsFor(bands[1]));
    return root(mix(optionsFor(bands[0]),optionsFor(bands[1]),side));
  }
  const changedJoints={...joints,pelvis:root(joints.pelvis),neck:root(joints.neck)};
  for(const b of bands) {
    const side=sides[b.index],map={};
    for(const [name,p] of Object.entries(joints[side])) {
      const q=name==='ankle'?thigh(lower(p,b,1),b,1):name==='knee'?thigh(p,b,1):p;
      map[name]=root(q);
    }
    changedJoints[side]=map;
  }
  return {rest,transform,joints:changedJoints,neutral,epsilon:scale*2e-5,
    direction:(n)=>rz(rx(n,tilt),list),rootMotion:!!(tilt||list)};
}
// 각 원래 정점에서 수치 편미분한 접평면을 이용해 원형의 법선과 표면 굴곡을 함께 보존한다.
export function normalAt53(rig,p,n,part,side) {
  const step=rig.epsilon;
  const columns=[0,1,2].map(axis=>{
    const a=p.slice(),b=p.slice();a[axis]-=step;b[axis]+=step;
    return sub(rig.transform(b,part,side),rig.transform(a,part,side)).map(v=>v/(2*step));
  });
  const cofactors=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
  const mapped=n.map((_,i)=>cofactors.reduce((sum,col,k)=>sum+n[k]*col[i],0));
  return {normal:normalize(mapped),det:columns[0].reduce((sum,x,i)=>sum+x*cofactors[0][i],0)};
}
export function poseJoinedPelvis53(scene,pose={},options={}) {
  const rig=makeHipRig53(scene,pose,options),rest=rig.rest;
  if(rig.neutral)return rest;
  if(!rest.parts.some(m=>m.name==='pelvis-thigh-surface53'))throw new Error('53차 골반을 이은 중립 몸통을 먼저 불러오세요.');
  const parts=rest.parts.map(mesh=>{
    const active=names.has(mesh.name);
    if(!active&&!rig.rootMotion)return mesh;
    const side=Number(mesh.vertices.reduce((s,v)=>s+v.p[0],0)>0);
    const vertices=mesh.vertices.map(v=>{
      const p=rig.transform(v.p,mesh.name,side);
      if(p===v.p)return v;
      const n=active?normalAt53(rig,v.p,v.n,mesh.name,side).normal:rig.direction(v.n);
      return {...v,p,n};
    });
    return {...mesh,vertices};
  });
  const out={...rest,parts,joints:rig.joints};restScenes.set(out,rest);
  return out;
}
