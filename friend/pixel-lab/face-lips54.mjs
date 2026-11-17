import {frontRay} from './continuous/body.mjs';
const feature=/^(upper-lip34|lower-lip34|mouth-line34)$/;
function caster(scene){
 const skin=scene.parts[0].vertices,faces=scene.parts.filter(q=>q.vertices===skin).flatMap(q=>q.faces);
 return frontRay(skin,faces,scene.height);
}
const offsets=[[0,0],[0,-.002],[0,.002],[-.002,0],[.002,0],[0,-.005],[0,.005],[-.003,-.004],[.003,.004]];
function height(cast,point){
 const z=[];
 for(const [x,y]of offsets){
  const v=cast(point[0]+x,point[1]+y);
  if(Number.isFinite(v)&&Math.abs(v-point[2])<.10)z.push(v);
 }
 if(!z.length)return null;
 z.sort((a,b)=>a-b);return z[Math.floor(z.length/2)];
}
export function attach54(base,scene,margin=0,strength=1){
 const source=caster(base),target=caster(scene);
 return {...scene,parts:scene.parts.map((part,j)=>{
  if(!feature.test(part.name))return part;
  const vertices=part.vertices.map((v,i)=>{
   const old=base.parts[j].vertices[i],a=height(source,old.p),b=height(target,v.p);
   if(a===null||b===null)return v;
   const oldLift=Math.max(-.012,Math.min(.026,old.p[2]-a));
   const next=b+oldLift+margin*(part.name==='mouth-line34'?1:.5);
   const dz=Math.max(-.045,Math.min(.045,(next-v.p[2])*strength));
   return {...v,p:[v.p[0],v.p[1],v.p[2]+dz]};
  });return {...part,vertices};
 })};
}
