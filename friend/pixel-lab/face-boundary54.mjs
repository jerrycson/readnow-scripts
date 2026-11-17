import {candidateSupport53} from './face-support53.mjs';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const unit=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
function boundaries(scene,skin){
 const mesh=scene.parts.filter(m=>m.vertices===skin&&m.name==='portrait-skin34');
 const angles=[[0,0],[-45,0],[45,0],[-90,0],[90,0],[-135,0],[135,0],[180,0],[0,30],[0,-30],[22,-21],[-76,17],[22,-11],[-41,6.5],[45,-5],[-28,1],[-4,7],[-2.75,4.75]];
 const axes=angles.map(([yaw,pitch])=>{const a=yaw*Math.PI/180,b=pitch*Math.PI/180;return [-Math.sin(a)*Math.cos(b),Math.sin(b),Math.cos(a)*Math.cos(b)];});
 const edges=new Map(),neighbors=new Map(),marked=new Set();
 for(const m of mesh)for(const tri of m.faces){
  const [a,b,c]=tri.map(i=>skin[i].p),u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const mask=axes.reduce((bits,t,i)=>bits|((t[0]*n[0]+t[1]*n[1]+t[2]*n[2]>0?1:0)<<i),0);
  for(let e=0;e<3;e++){
   const i=tri[e],j=tri[(e+1)%3],key=Math.min(i,j)*skin.length+Math.max(i,j);
   if(!neighbors.has(i))neighbors.set(i,new Set());neighbors.get(i).add(j);
   if(!neighbors.has(j))neighbors.set(j,new Set());neighbors.get(j).add(i);
   if(!edges.has(key))edges.set(key,{i,j,mask,seen:1});
   else{const other=edges.get(key);other.seen++;if(mask!==other.mask){marked.add(i);marked.add(j);}}
  }
 }
 for(const {i,j,seen} of edges.values())if(seen===1){marked.add(i);marked.add(j);}
 return new Set([...marked].flatMap(i=>[i,...(neighbors.get(i)||[])]));
}
export function soften54(scene,id,r34,mode='local',ratio=.8,lock=false){
 const filtered=candidateSupport53(scene,id,r34,mode),skin=scene.parts[0].vertices,reference=filtered.parts[0].vertices;
 const locked=lock?boundaries(scene,skin):new Set();
 const chin=scene.landmarks.chin[1],mouth=scene.parts.find(m=>m.name==='mouth-line34').vertices,lip=mouth.reduce((s,v)=>s+v.p[1],0)/mouth.length-chin;
 const vertices=skin.map((v,i)=>{
  const r=reference[i],[x,y,z]=v.p,h=y-chin,a=Math.abs(x);
  const ink=(1-smooth(.065,.160,a))*(1-smooth(.010,.055,Math.abs(h-lip)));
  const w=ratio*smooth(-.14,-.025,h)*(1-smooth(.285,.39,h))*smooth(.02,.20,z)*(1-ink);
  if(!w||locked.has(i))return v;
  return {...v,p:v.p.map((n,k)=>n+(r.p[k]-n)*w),n:unit(v.n.map((n,k)=>n+(r.n[k]-n)*w))};
 });
 return {...scene,parts:scene.parts.map(m=>m.vertices===skin?{...m,vertices}:m)};
}
