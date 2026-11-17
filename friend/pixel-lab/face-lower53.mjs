import {candidateSupport53} from './face-support53.mjs';import {contourSupport53} from './face-contour53.mjs';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function layeredSupport53(base,id,r34,strength=.24,p=[0,0,0],eyeFence=false){
 const core=candidateSupport53(base,id,r34,'features'),chin=base.landmarks.chin[1],memo=new Map();
 const parts=core.parts.map((m,j)=>{
  const src=base.parts[j];if(memo.has(m.vertices))return {...m,vertices:memo.get(m.vertices)};
  const v=m.vertices.map((v,i)=>{const q=src.vertices[i],h=r34.parts[j].vertices[i].p[1]-chin;
    const t=strength+(1-strength)*smooth(.045,.31,h);
    if(t>=1||q===v)return v;
    const p=q.p.map((x,k)=>x+(v.p[k]-x)*t),n=q.n.map((x,k)=>x+(v.n[k]-x)*t),l=Math.hypot(...n)||1;
    return {...v,p,n:n.map(x=>x/l)};});memo.set(m.vertices,v);return {...m,vertices:v};
 });return contourSupport53({...core,parts},p,eyeFence);
}


