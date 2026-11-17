// 기존 중립의 물질점이 피부에 남도록 하부 변위를 더하고 이후 같은 자세 리그를 사용한다.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,v)=>a+(b-a)*v;
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);};
const xyz=(a,b)=>a.map((x,k)=>x-b[k]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const cache=new WeakMap();
function chart(scene){
 if(cache.has(scene.paperShape))return cache.get(scene.paperShape);
 const m=scene.parts[0],w=scene.paperShape.scale,zones=[],indices=new Set(),vs=scene.restSkin35;
 for(let i=0;i<vs.length;i++){const [x,y,z]=vs[i].p;if(z<.02)continue;const hand=Math.sign(x)||1,f=scene.paperShape.frame(hand),q=(x-f.c)*hand/f.root;
  if(q<=-.992||q>=1.12)continue;const h=scene.paperShape.frame(hand,hand*clamp(q,-.985,.985)),u=(h.top-y)/(h.top-h.foot);
  if(u<.38||u>1.06)continue;const p={i,u,q,hand,w};zones.push(p);indices.add(i);
 }
 const faces=m.faces.filter(t=>t.some(i=>indices.has(i))),neighbors=new Map(zones.map(q=>[q.i,new Set()]));
 for(const tri of faces)for(const i of tri){const n=neighbors.get(i);if(n)for(const j of tri)if(i!==j)n.add(j);}
 const state={zones,faces,indices,neighbors};cache.set(scene.paperShape,state);return state;
}
export function lowerBody51(scene,tuning){
 if(!scene?.paperShape||!scene?.restSkin35||!tuning)return scene;
 const {down=0,rise=0,depth=0,center=0,width=.45,band=.81,soft=.13,lap=0,normals=.7}=tuning;
 const src=scene.parts[0].vertices,out=src.slice(),state=chart(scene);
 for(const {i,u,q,w} of state.zones){
  const lower=ramp(.46,.64,u)*(1-ramp(.91,1.035,u))*Math.exp(-.5*((u-band)/soft)**2),outer=1-ramp(.70,.985,Math.abs(q));
  const ell=Math.exp(-.5*((q-center)/width)**2),wall=ramp(.64,.90,u)*(1-ramp(.935,1.035,u))*outer;
  const weight=lower*outer;if(weight<1e-6&&wall<1e-6)continue;
  const p=src[i].p.slice();
  p[1]+=w*weight*(-down*ell+rise*Math.min(1,((q-center)/width)**2)*ell);
  p[2]+=w*(depth*weight*ell);
  if(lap){const adj=[...state.neighbors.get(i)],mean=[0,1,2].map(k=>adj.reduce((s,j)=>s+src[j].p[k],0)/(adj.length||1));
   const neutralNormal=src[i].n,along=dot(xyz(mean,src[i].p),neutralNormal);
   for(let k=0;k<3;k++)p[k]+=lap*wall*along*neutralNormal[k];
  }
  if(Math.hypot(...xyz(p,src[i].p))>1e-9)out[i]={...src[i],p};
 }
 const nsum=new Map();
 for(const t of state.faces){
  if(t.every(i=>out[i]===src[i]))continue;
  const normal=vs=>cross(xyz(vs[t[1]].p,vs[t[0]].p),xyz(vs[t[2]].p,vs[t[0]].p)),o=normal(src),n=normal(out),a=unit(o),b=unit(n),k=cross(a,b),co=dot(a,b),area=Math.hypot(...o);
  if(co<-.95)continue;
  for(const i of t){if(out[i]===src[i])continue;const prev=src[i].n,v=cross(k,prev),v2=cross(k,v),sum=nsum.get(i)||[0,0,0];for(let d=0;d<3;d++)sum[d]+=area*(prev[d]+v[d]+v2[d]/(1+co));nsum.set(i,sum);}
 }
 for(const [i,n]of nsum){const a=src[i].n,b=unit(n);out[i]={...out[i],n:unit(a.map((x,k)=>mix(x,b[k],normals)))};}
 return {...scene,parts:scene.parts.map(p=>p.vertices===src?{...p,vertices:out}:p)};
}
