import {contactLip50,contactValues50} from './face-contact50.mjs';
import {supportedLip50} from './face-support50.mjs';
// 49차 중립 씬의 얼굴 앞쪽에서 입술과 맞닿은 피부에 같은 변환을 준다.
const lipNames = new Set(['upper-lip34','lower-lip34','mouth-line34']);
export const variants50 = Object.freeze(['C','D','E']);
const parametersC = {
  F02:{width:.83, lift:.006, depth:-.001, center:0},
  M01:{width:.93, lift:.007, depth:-.016, center:-.003}
};
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
function smooth(radius){if(radius>=1)return 0;const x=1-radius*radius;return x*x*x;}
function supportMap(center,half,params){
 return p=>{
  const [x,y,z]=sub(p,center);
  const w=smooth(Math.abs(x)/(half*2.35))*smooth(Math.abs(y)/.085)*smooth(Math.abs(z)/.16);
  return [p[0]+w*(params.center+(params.width-1)*x),p[1]+w*params.lift,p[2]+w*params.depth];
 };
}
function transformed(v,at){
 const p=at(v.p);if(p.every((n,i)=>n===v.p[i]))return v;
 const cols=[0,1,2].map(i=>{const hi=[...v.p],lo=[...v.p];hi[i]+=.00001;lo[i]-=.00001;return sub(at(hi),at(lo)).map(n=>n/.00002);});
 const cof=[cross(cols[1],cols[2]),cross(cols[2],cols[0]),cross(cols[0],cols[1])];
 const n=norm([0,1,2].map(k=>cof.reduce((s,c,i)=>s+c[k]*v.n[i],0)));
 return {...v,p,n};
}
export function candidateFaceSurface50(base,id,variant='base'){
 if(!parametersC[id]||!variants50.includes(variant))return base;
 if(variant==='E')return contactLip50(base,id,contactValues50[id]);
 if(variant==='D')return supportedLip50(base,id);
 const seam=base.parts.find(p=>p.name==='mouth-line34'),upper=base.parts.find(p=>p.name==='upper-lip34');
 if(!seam||!upper)return base;
 const center=seam.vertices[2*43+21].p,half=(seam.vertices[42].p[0]-seam.vertices[0].p[0])/2;
 const map=supportMap(center,half,parametersC[id]),skin=base.parts[0].vertices;
 const vs=skin.map(v=>transformed(v,map));
 const parts=base.parts.map(part=>{
  if(part.vertices===skin)return {...part,vertices:vs};
  if(!lipNames.has(part.name))return part;
  const vertices=part.vertices.map((v,i)=>{
   if(part.name!=='upper-lip34')return transformed(v,map);
   const col=i%37,u=col/18-1,row=Math.floor(i/37)/4,top=part.vertices[4*37+col],bottom=part.vertices[col];
   const roundBow=1-.65*Math.exp(-(((Math.abs(u)-.34)/.26)**2));
   return transformed({...v,p:mix(bottom.p,top.p,row*roundBow)},map);
  });
  return {...part,vertices};
 });
 return {...base,parts};
}
