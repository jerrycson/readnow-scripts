const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// 원화 1·2·3번에서 선택했다. 4번 및 실제 축소 화면을 본 뒤 값을 바꾸지 않았다.
const params={
 F02:{width:.9,open:.8,tilt:-.36,lift:-.034,wrap:0,browY:.03,shelf:0,shift:.013},
 M01:{width:.81,open:1.16,tilt:-.14,lift:-.034,wrap:-.28,browY:.03,shelf:0,shift:-.014,tiltGlobal:-.16}
};
export function eyeTrial40(scene,id,opt){
 if(!['F02','M01'].includes(id)||!opt)return scene;
 const chin=scene.landmarks.chin[1],eyes=[...new Set(scene.parts.filter(m=>m.name==='eye34').map(m=>m.vertices))];
 if(eyes.length!==2)return scene;
 const centers=eyes.map(v=>[0,1].map(k=>v.reduce((s,p)=>s+p.p[k],0)/v.length)).sort((a,b)=>a[0]-b[0]);
 function warp(p){
  const [x,y,z]=p,h=y-chin,a=Math.abs(x),sg=Math.sign(x),c=centers[sg>0?1:0],dx=a-Math.abs(c[0]),dy=y-c[1];
  if(h<=.29||h>=.72||a<=.015||a>=.405||z<=.27)return p;
  const w=(opt.strength??1)*smooth(.29,.385,h)*(1-smooth(.60,.72,h))*smooth(.015,.075,a)*(1-smooth(.285,.405,a))*smooth(.27,.46,z);
  const lid=1-smooth(.045,.117,dy),brow=Math.exp(-.5*((dy-.10)/.039)**2),socket=Math.exp(-.5*(dy/.073)**2);
  return [x+sg*w*((opt.shift||0)+dx*((opt.width??1)-1)),
   y+w*((opt.lift||0)+lid*(dy*((opt.open??1)-1)+((opt.tilt||0)+sg*(opt.tiltGlobal||0))*dx)+(opt.browY||0)*brow),
   z+w*(-(opt.wrap||0)*dx+(opt.shelf||0)*brow+((opt.forward||0)-.28*(opt.shelf||0))*socket)];
 }
 const base=scene.parts[0].vertices,shared=new Map();
 const parts=scene.parts.map(m=>{
  if(m.vertices!==base&&!['cheek-orbit34','eye34','lid34','lower-lid34','brow34'].includes(m.name))return m;
  if(!shared.has(m.vertices))shared.set(m.vertices,m.vertices.map(v=>{
   const p=warp(v.p);if(p===v.p)return v;
   const d=.00010,columns=[0,1,2].map(k=>{
    const a=v.p.slice(),b=v.p.slice();a[k]-=d;b[k]+=d;
    const l=warp(a),r=warp(b);return r.map((n,i)=>(n-l[i])/(2*d));
   });
   const cof=[cross(columns[1],columns[2]),cross(columns[2],columns[0]),cross(columns[0],columns[1])];
   const normal=[0,1,2].map(k=>cof.reduce((s,t,j)=>s+v.n[j]*t[k],0)),len=Math.hypot(...normal)||1;
   return {...v,p,n:normal.map(x=>x/len)};
  }));
  return {...m,vertices:shared.get(m.vertices)};
 });
 return {...scene,parts};
}
// B의 강도는 A를 보존한 후 원면의 면적·방향만으로 결정했다.
export const eye40Cases=Object.freeze({F02:{strength:.875},M01:{strength:.25}});
export function eye40(scene39,id){return Object.hasOwn(eye40Cases,id)?eye40AtStrength(scene39,id,eye40Cases[id].strength):scene39;}
export function eye40AtStrength(scene39,id,strength){return Object.hasOwn(params,id)?eyeTrial40(scene39,id,{...params[id],strength}):scene39;}
