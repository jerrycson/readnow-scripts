import {reconstruct,surfaceEdit} from './hull36.mjs';
import {orientedSkin} from './skin-normals35.mjs';
export async function readApplied(id=localStorage.getItem('bookfriend-face-fit36')){
 if(!id)return null;
 const db=await new Promise((ok,bad)=>{const q=indexedDB.open('bookfriend-photo-model',1);q.onupgradeneeded=()=>q.result.createObjectStore('versions',{keyPath:'id'});q.onsuccess=()=>ok(q.result);q.onerror=()=>bad(q.error);});
 try{const entry=await new Promise((ok,bad)=>{const r=db.transaction('versions').objectStore('versions').get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error);});if(!entry)return null;
 let mesh=reconstruct(entry.shots);for(const [k,[w,d]] of Object.entries(entry.tuning))if(mesh&&(w||d))mesh=surfaceEdit(mesh,k,w,d);return mesh;
 }finally{db.close();}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const minus=(a,b)=>a.map((x,k)=>x-b[k]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

// 각 정점에 인접한 넓은 삼각형을 따라 중립 변위를 현재 자세의 좌표로 옮긴다.
function localFrame(vertices,face){
 const [a,b,c]=face.map(i=>vertices[i].p);
 const edge=minus(b,a),normal=cross(edge,minus(c,a));
 const length=Math.hypot(...edge),area=Math.hypot(...normal);
 if(length<1e-12||area<1e-12)return null;
 const u=edge.map(x=>x/length),n=normal.map(x=>x/area);
 return [u,cross(n,u),n];
}
function posedHead(scene,hull){
 const rest=scene.restScene,edited=reshapeHead(rest,hull),shared=new Map();
 const parts=scene.parts.map((part,k)=>{
  const source=rest.parts[k],fitted=edited.parts[k];
  if(!source||source.name!==part.name||source.vertices.length!==part.vertices.length)return part;
  if(shared.has(part.vertices))return {...part,vertices:shared.get(part.vertices)};
  const restVertices=source.vertices,posed=part.vertices;
  const faces=scene.parts.filter(m=>m.vertices===posed).flatMap(m=>m.faces);
  const best=new Map();
  for(const face of faces){
   if(!face.some(i=>restVertices[i]!==fitted.vertices[i]))continue;
   const [a,b,c]=face.map(i=>restVertices[i].p),normal=cross(minus(b,a),minus(c,a)),area=dot(normal,normal);
   for(const i of face)if(area>(best.get(i)?.area??0))best.set(i,{face,area});
  }
  const frames=new Map();
  const vertices=posed.map((vertex,i)=>{
   const origin=restVertices[i],target=fitted.vertices[i];
   if(origin===target)return vertex;
   const face=best.get(i)?.face;
   // 정점 주변까지 움직이지 않은 얼굴은 중립 교정과 정확히 같은 좌표를 갖는다.
   if(vertex.p===origin.p&&(!face||face.every(j=>posed[j].p===restVertices[j].p)))
    return {...vertex,p:target.p,n:target.n};
   if(!face)return vertex;
   if(!frames.has(face))frames.set(face,[localFrame(restVertices,face),localFrame(posed,face)]);
   const [before,after]=frames.get(face);
   if(!before||!after)return vertex;
   const d=minus(target.p,origin.p),weights=before.map(axis=>dot(d,axis));
   const p=vertex.p.map((x,k)=>x+weights.reduce((s,w,j)=>s+w*after[j][k],0));
   return {...vertex,p};
  });
  const result=posed===scene.parts[0].vertices?orientedSkin(posed,vertices,faces):vertices;
  shared.set(posed,result);
  return {...part,vertices:result};
 });
 return {...scene,parts,restScene:edited};
}
export function reshapeHead(scene,hull){
 if(!hull)return scene;
 if(scene.restScene)return posedHead(scene,hull);
 const chin=scene.landmarks.chin[1],height=scene.height-chin,centerZ=scene.faceCenter?.[2]??.25,base=scene.parts[0].vertices,count=hull.rings.length;
 const angles=hull.steps,rows=Array.from({length:count},()=>new Float64Array(angles));
 for(const v of base){const [x,y,z]=v.p,h=(y-chin)/height;if(h<0||h>1)continue;
  const a=(Math.atan2(z-centerZ,x)+2*Math.PI)%(2*Math.PI),k=Math.round(a*angles/(2*Math.PI))%angles,j=Math.round((1-h)*(count-1));
  rows[j][k]=Math.max(rows[j][k],Math.hypot(x,z-centerZ));}
 const distances=rows.map((row,j)=>Array.from(row,(_,i)=>{let sum=0,weight=0;for(let h=-2;h<=2;h++)for(let k=-3;k<=3;k++){const r=rows[j+h]?.[(i+k+angles)%angles];if(!r)continue;const w=1/(1+h*h+k*k);sum+=w*r;weight+=w;}return weight?sum/weight:0;}));
 function shift(p){const [x,y,z]=p,h=(y-chin)/height;if(h<=0||h>=1)return p;
  const pos=clamp((1-h)*(count-1),0,count-1),a=(Math.atan2(z-centerZ,x)+2*Math.PI)%(2*Math.PI),ak=a*angles/(2*Math.PI),k=Math.floor(ak);
  function delta(j,k){const ring=hull.rings[j],r=distances[j]?.[k];if(!ring||!r)return 0;
   const i=3*ring.ids[k],target=height*Math.hypot(hull.v[i]-ring.center[0],hull.v[i+2]-ring.center[1]);return clamp(target-r,-.105*height,.105*height);}
  const weight=Math.min(1,h/.12,(1-h)/.08),u=ak-k,v=pos-Math.floor(pos);
  const at=j=>(1-u)*delta(j,k)+u*delta(j,(k+1)%angles);
  const d=weight*((1-v)*at(Math.floor(pos))+v*at(Math.min(count-1,Math.ceil(pos))));
  return [x+Math.cos(a)*d,y,z+Math.sin(a)*d];}
 const arrays=new Map(),parts=scene.parts.map(m=>{if(!arrays.has(m.vertices)){const vs=m.vertices.map(v=>{const p=shift(v.p);return p===v.p?v:{...v,p};});arrays.set(m.vertices,m.vertices===base?orientedSkin(base,vs,scene.parts.filter(s=>s.vertices===base).flatMap(s=>s.faces)):vs);}return {...m,vertices:arrays.get(m.vertices)};});
 return {...scene,parts};
}
