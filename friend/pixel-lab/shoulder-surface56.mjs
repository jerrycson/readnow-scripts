import {add,sub,mul,dot,cross,norm,lerp} from './geometry.mjs';
import {poseShoulders54} from './shoulder-rig54.mjs';

const restCache=new WeakMap();
const sleeveTopology=new WeakMap();
const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};

function sleeveHinges(mesh){
  if(sleeveTopology.has(mesh.faces))return sleeveTopology.get(mesh.faces);
  const edges=new Map(),hinges=[];
  for(const face of mesh.faces)for(let k=0;k<3;k++){
    const i=face[k],j=face[(k+1)%3],opposite=face[(k+2)%3];
    const key=Math.min(i,j)+'/'+Math.max(i,j);
    if(edges.has(key))hinges.push([i,j,edges.get(key),opposite]);
    else edges.set(key,opposite);
  }
  sleeveTopology.set(mesh.faces,hinges);
  return hinges;
}
function hingeCosine(points,[i,j,a,b]){
  const axis=norm(sub(points[j],points[i]));
  const radial=k=>{const v=sub(points[k],points[i]);return sub(v,mul(axis,dot(axis,v)));};
  const va=radial(a),vb=radial(b),ra=Math.hypot(...va),rb=Math.hypot(...vb);
  if(Math.min(ra,rb)<1e-7)return null;
  const u=mul(va,1/ra),v=mul(vb,1/rb);
  return dot(u,v);
}
function sleeveCorrection(rest,posed,amount){
  const reference=rest.vertices.map(v=>v.p),original=posed.vertices.map(v=>v.p);
  const points=original.slice();
  const hinges=sleeveHinges(rest);
  // 몸통과 팔에 연결된 양 끝 고리를 고정하고, 중립에서 더 꺾인 자리만 고친다.
  const mobility=rest.weights54.map(t=>Math.sin(Math.PI*t)**2*(t>0&&t<1));
  let influence=original.map(()=>0);
  for(const h of hinges){
    const before=hingeCosine(reference,h),after=hingeCosine(original,h);
    if(before===null||after===null)continue;
    const increase=after-Math.max(.35,before);
    const weight=smooth(increase/.38);
    for(const k of h)influence[k]=Math.max(influence[k],weight);
  }
  if(!influence.some(Boolean))return posed;
  const neighbors=points.map(()=>new Set());
  for(const [a,b,c] of rest.faces){
    neighbors[a].add(b).add(c);neighbors[b].add(a).add(c);neighbors[c].add(a).add(b);
  }
  for(let step=0;step<3;step++)influence=influence.map((w,i)=>Math.max(w,...[...neighbors[i]].map(j=>.70*influence[j])));
  let normals=points.map(()=>[0,0,0]);
  const areaVector=(p,[a,b,c])=>cross(sub(p[b],p[a]),sub(p[c],p[a]));
  for(const face of rest.faces){
    const n=areaVector(points,face);
    for(const k of face)normals[k]=add(normals[k],n);
  }
  for(let step=0;step<3;step++)normals=normals.map((n,i)=>{
    const sum=[...neighbors[i]].reduce((s,j)=>add(s,normals[j]),[0,0,0]);
    return lerp(n,mul(sum,1/neighbors[i].size),.65);
  });
  const constraints=rest.faces.flatMap(f=>{
    const w=f.map(k=>mobility[k]*influence[k]);
    if(!w.some(Boolean))return [];
    const n=norm(f.reduce((s,k)=>add(s,normals[k]),[0,0,0]));
    const area=Math.hypot(...areaVector(original,f)),restArea=Math.hypot(...areaVector(reference,f));
    return [{f,n,w,target:.48*Math.max(area,.4*restArea)}];
  });
  for(let pass=0;pass<40;pass++){
    let fixed=0;
    for(const {f,n,w,target} of constraints){
      const deficit=target-dot(areaVector(points,f),n);
      if(deficit<1e-8)continue;
      const gradients=f.map((_,k)=>cross(sub(points[f[(k+1)%3]],points[f[(k+2)%3]]),n));
      const denom=gradients.reduce((sum,g,i)=>sum+w[i]*dot(g,g),0);
      if(denom<1e-10)continue;
      f.forEach((k,i)=>{points[k]=add(points[k],mul(gradients[i],.75*w[i]*deficit/denom));});
      fixed++;
    }
    if(!fixed)break;
  }
  const moved=new Set();
  points.forEach((p,k)=>{if(Math.hypot(...sub(p,original[k]))>1e-9)moved.add(k);});
  if(!moved.size)return posed;
  const touched=hinges.filter(h=>h.some(k=>moved.has(k))).map(h=>({h,cos:hingeCosine(original,h)??1}));
  const capCos=Math.max(...touched.map(e=>e.cos)),sharp=-Math.cos(125*Math.PI/180);
  const limits=touched.map(({h,cos})=>({h,limit:cos>=sharp?Math.min(1,capCos+.0001):Math.max(.565,cos+.000001)}));
  const at=t=>points.map((p,k)=>moved.has(k)?lerp(original[k],p,t):original[k]);
  const permitted=q=>limits.every(({h,limit})=>(hingeCosine(q,h)??1)<=limit)
    &&constraints.every(({f})=>Math.hypot(...areaVector(q,f))>=.23*Math.hypot(...areaVector(original,f)));
  // 조작 중 건너갈 중간 강도도 검사해 다른 자리에 급한 접힘이 생기기 전에 제한한다.
  let safe=0;
  for(let step=1;step<=8;step++){
    let cap=step/8;
    if(permitted(at(cap))){safe=cap;continue;}
    for(let j=0;j<7;j++){
      const mid=(safe+cap)/2;
      if(permitted(at(mid)))safe=mid;else cap=mid;
    }
    break;
  }
  if(!safe)return posed;
  const final=at(amount*safe);
  const faceNormals=final.map(()=>[0,0,0]),oldNormals=final.map(()=>[0,0,0]);
  for(const [a,b,c] of posed.faces){
    const n=cross(sub(final[b],final[a]),sub(final[c],final[a]));
    const old=cross(sub(original[b],original[a]),sub(original[c],original[a]));
    for(const k of [a,b,c]){
      faceNormals[k]=add(faceNormals[k],n);oldNormals[k]=add(oldNormals[k],old);
    }
  }
  const vertices=posed.vertices.map((v,k)=>{
    if(!mobility[k])return v;
    const n=norm(add(v.n,sub(norm(faceNormals[k]),norm(oldNormals[k]))));
    return {...v,p:final[k],n};
  });
  return {...posed,vertices};
}
export function correctShoulder56(rest,posed,pose,amount){
  if(!amount||pose.joined===false)return posed;
  const unilateral=pose.side==='left'||pose.side==='right';
  const sign=pose.side==='left'?-1:1,width=Math.abs(rest.joints.right.shoulder[0]);
  const parts=posed.parts.map((mesh,i)=>{
    const ref=rest.parts[i];
    if(ref===mesh)return mesh;
    if(mesh.weights54&&(!unilateral||(mesh.name.startsWith('right')?1:-1)===sign)){
      return sleeveCorrection(ref,mesh,amount);
    }
    if(!unilateral||!mesh.weights54&&!['ribcage-waist-pelvis','upper-arm'].includes(mesh.name))return mesh;
    const vertices=mesh.vertices.map((v,j)=>{
      const old=ref.vertices[j],w=amount*smooth((-old.p[0]*sign/width-.04)/.21);
      if(!w)return v;
      return w===1?old:{...v,p:lerp(v.p,old.p,w),n:norm(lerp(v.n,old.n,w))};
    });
    return {...mesh,vertices};
  });
  return {...posed,parts};
}
export function poseShoulders56(base,pose){
  const amount=pose?.surface56??0;
  if(!Number.isFinite(amount)||amount<0||amount>1)throw RangeError('어깨 표면 보정 범위를 확인하세요.');
  const posed=poseShoulders54(base,pose);
  if(!amount||!posed.shoulder54||pose.joined===false)return posed;
  if(!restCache.has(base))restCache.set(base,poseShoulders54(base,{}));
  return correctShoulder56(restCache.get(base),posed,pose,amount);
}
