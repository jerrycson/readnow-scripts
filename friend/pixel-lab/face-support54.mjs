import {candidateFace53} from './face53.mjs';
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const unit=v=>{const n=Math.hypot(...v);return n?v.map(x=>x/n):v;};
const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);


export function shape54(base,id,settings,design={}){
 if(!['F02','M01'].includes(id))return base;
 const target=candidateFace53(base,id,settings), chin=base.landmarks.chin[1], shared=new Map();
 const {shelf,side,jawMix,anchor}=design;
 return {...base,parts:base.parts.map((part,j)=>{
  if(shared.has(part.vertices))return {...part,vertices:shared.get(part.vertices)};
  const end=target.parts[j];
  const vertices=part.vertices.map((v,i)=>{
   const q=end.vertices[i],x=v.p[0],h=v.p[1]-chin,z=v.p[2],abs=Math.abs(x);
   const face=smooth(.16,.45,z)*(1-smooth(side,side+.135,abs));
   const weight=face*smooth(shelf,shelf+.13,h)*(1-smooth(.65,.9,h));
   const low=face*smooth(-.045,.05,h)*(1-smooth(.12,.30,h));
   let wn=Math.max(weight,low*.6);
   const jaw=smooth(-.19,-.035,h)*(1-smooth(.265,.39,h))*smooth(.025,.24,z);
   const blend=weight+(1-weight)*jaw*jawMix;
   const dst=lerp(v.p,q.p,blend);wn=Math.max(wn,blend);
   if(anchor){
    const tipIndex=id==='F02'?921:746;
    const rest=base.parts[0].vertices[tipIndex].p, prior=target.parts[0].vertices[tipIndex].p;
    const influence=(1-smooth(.04,.29,h))*smooth(-.11,-.02,h)*smooth(.28,.58,z)*(1-smooth(.12,.31,abs));
    for(let k=0;k<3;k++)dst[k]+=(rest[k]-prior[k])*influence*anchor;
   }
   dst[2]+=(q.p[2]-v.p[2])*.04*low;
   if(!wn&&dst.every((n,k)=>n===v.p[k]))return v;
   return {...v,p:dst,n:unit(lerp(v.n,q.n,wn))};
  });
  shared.set(part.vertices,vertices);return {...part,vertices};
 })};
}
