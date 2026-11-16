import {form34} from './bust34.mjs';
import {paperShape} from './paper-shape35.mjs';
import {orientedSkin} from './skin-normals35.mjs';
import {bankFor} from './rig32.mjs';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function smooth(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
const charts=new Map();
function ribcage(scene,settings){
 const key=[settings.sex,settings.heads,settings.designStyle,settings.candidate,settings.palette].join('/');
 if(charts.has(key))return charts.get(key);
 const mesh=scene.parts[0],old=mesh.vertices,hip=scene.joints.right.hip[1],shoulder=scene.joints.right.shoulder[1];
 const w=scene.tissue34.width,height=shoulder-hip;
 const arms=['left','right'].map(side=>bankFor(scene,mesh,side+'.shoulder'));
 const gates=old.map(({p:[x,y,z]},i)=>{
   const v=(y-hip)/height,arm=Math.max(arms[0][i],arms[1][i])/255;
   return smooth(.32,.49,v)*(1-smooth(1.01,1.10,v))*(1-smooth(.84,1.17,Math.abs(x)/w))*smooth(.03,.26,z/w)*(1-smooth(.10,.62,arm));
 });
 const edges=Array.from({length:old.length},()=>new Set());
 for(const face of mesh.faces)for(const [j,a] of face.entries()){
   const b=face[(j+1)%3];if(gates[a]||gates[b]){edges[a].add(b);edges[b].add(a);}
 }
 const indices=[];for(let i=0;i<gates.length;i++)if(gates[i]>.001&&edges[i].size>2)indices.push(i);
 // Fix the boundary. Positive edge weights spread the material coordinates through
 // the old fold so overlapping projections need not map to the same skin point.
 const rows=indices.map(i=>{
   const links=[...edges[i]].map(j=>[j,1/Math.max(w*.006,Math.hypot(...old[i].p.map((v,k)=>v-old[j].p[k])))]);
   const sum=links.reduce((s,l)=>s+l[1],0);return links.map(([j,a])=>[j,a/sum]);
 });
 let uv=old.map(v=>v.p.slice(0,2)),next=uv.map(v=>v.slice());
 for(let pass=0;pass<160;pass++){
   indices.forEach((i,k)=>{
     const g=gates[i]*.94;
     for(let axis=0;axis<2;axis++){
       let sum=0;for(const [j,a] of rows[k])sum+=a*uv[j][axis];
       next[i][axis]=uv[i][axis]*.22+.78*(g*sum+(1-g)*old[i].p[axis]);
     }
   });
   [uv,next]=[next,uv];
 }
 const ridge=Array.from({length:49},(_,i)=>{
   const y=hip+height*(.3+.84*i/48);
   const pts=old.filter(v=>Math.abs(v.p[0])<w*.10&&Math.abs(v.p[1]-y)<height*.041&&v.p[2]>.11*w);
   return pts.length?pts.reduce((s,v)=>s+v.p[2],0)/pts.length:w*.44;
 });
 const base=old.map((v,i)=>{
   const g=gates[i];if(!g)return v;
   const [x,y]=uv[i],u=x/w,k=clamp(((y-hip)/height-.30)*48/.84,0,47.999),j=Math.floor(k);
   const d=ridge[j]+(ridge[j+1]-ridge[j])*(k-j)-w*(.22*u*u+.22*u**4);
   return {...v,p:[x,y,v.p[2]+(d-v.p[2])*g]};
 });
 const data={base,gates,hip,shoulder,w};charts.set(key,data);return data;
}
export function reviewRig35(settings){
 const scene=form34(settings,'shallow');if(!scene.tissue34)return scene;
 const mesh=scene.parts[0],old=mesh.vertices,{base,gates,hip,shoulder,w}=ribcage(scene,settings);
 const shape=paperShape(settings,w,hip,shoulder),responses=scene.tissue34.responses.slice();
 const vertices=base.map((v,i)=>{
   if(!gates[i])return old[i];
   const [x,y,z]=v.p,side=x<0?-1:1,f=shape.frame(side),q=(x-f.c)/f.root,u=(f.top-y)/(f.top-f.foot);
   const free=gates[i]*Math.max(0,1-q*q)*Math.sin(Math.PI*clamp(u,0,1))**.75,outer=free*smooth(0,.8,side*q);
   responses[i]={side,free,outer,lower:free*smooth(.36,.88,u)};
   return {...v,p:shape.point(x,y,z,gates[i])};
 });
 const skin=orientedSkin(old,vertices,mesh.faces);
 return {...scene,parts:scene.parts.map(m=>m.vertices===old?{...m,vertices:skin}:m),
   tissue34:{...scene.tissue34,responses},restSkin35:base,surfaceAnchors:[-1,1].map(k=>shape.marker(k)),paperShape:shape};
}
