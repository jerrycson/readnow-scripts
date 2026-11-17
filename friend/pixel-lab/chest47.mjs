import {chest42} from './chest42.mjs';

// Parameterise each patch on the material skin of the neutral W, so a posed
// chest reuses the same vertices. The thoracic insertion and axilla stay fixed.
const cached = new WeakMap();
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x-a)/(b-a)));
  return t*t*(3-2*t);
};
const minus = (a,b) => a.map((v,k)=>v-b[k]);
const dot = (a,b) => a.reduce((sum,v,k)=>sum+v*b[k],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => {const n=Math.hypot(...a)||1;return a.map(v=>v/n);};

function prepare(base, ref) {
  if (cached.has(base)) return cached.get(base);
  const mesh=base.parts[0], held=chest42(base,ref).parts[0].vertices, active=[];
  base.restSkin35.forEach(({p:[x,y,z]},i)=>{
    if(z<.05) return;
    const hand=x<0?-1:1, f=base.paperShape.frame(hand), q=(x-f.c)*hand/f.root;
    if(Math.abs(q)>=.80) return;
    const local=base.paperShape.frame(hand,hand*q), u=(local.top-y)/(local.top-local.foot);
    if(u<=.38||u>=.965) return;
    const gate=smooth(.58,.71,u)*(1-smooth(.88,.965,u))*(1-smooth(.58,.80,Math.abs(q)))*smooth(.06,.17,Math.abs(x)/base.paperShape.scale);
    active.push({i,hand,q,u,gate,delta:minus(held[i].p,mesh.vertices[i].p)});
  });
  const ids=new Set(active.map(v=>v.i));
  const faces=mesh.faces.filter(f=>f.some(i=>ids.has(i)));
  const result={active,faces};cached.set(base,result);return result;
}
function rotateNormals(src,vs,faces,amount,cap) {
  const sum=new Map();
  for(const tri of faces) {
    const [a,b,c]=tri, norm=verts=>cross(minus(verts[b].p,verts[a].p),minus(verts[c].p,verts[a].p));
    const old=norm(src),fresh=norm(vs),weight=Math.hypot(...old);
    if(weight<1e-8||Math.hypot(...fresh)<1e-8)continue;
    const normal=unit(old),next=unit(fresh),axis=cross(normal,next),cos=dot(normal,next);
    if(cos<-.999)continue;
    for(const i of tri) {
      if(src[i]===vs[i])continue;
      const n=src[i].n,k1=cross(axis,n),k2=cross(axis,k1),acc=sum.get(i)||[0,0,0];
      for(let k=0;k<3;k++)acc[k]+=weight*(n[k]+k1[k]+k2[k]/(1+cos));
      sum.set(i,acc);
    }
  }
  for(const [i,acc] of sum) {
    const old=src[i].n, target=unit(acc);
    const angle=Math.acos(Math.max(-1,Math.min(1,dot(old,target))))*180/Math.PI;
    const blend=Math.min(amount,cap/Math.max(.001,angle));
    vs[i]={...vs[i],n:unit(old.map((v,k)=>v+blend*(target[k]-v)))};
  }
}

// A local lobe changes height and anterior projection together. It tapers to
// zero before the attached lower border. Keep the rejected settings reproducible.
export const fit47 = {
  mix: 1.183554754,
  center: -0.396764172,
  top: 0.768865478,
  spread: 0.29917349,
  depth: 0.065784331,
  drop: -0.027829153,
  forward: 0.058243562,
  lateral: -0.030565492,
  returnCenter: -0.730089671,
  returnDrop: 0.000219444,
  returnFront: 0.01370773,
  normalBlend: 1,
  normalCap: 9.923954141
};

export function makeChest47(base, ref, fit=fit47) {
  if(base?.paperShape?.form?.id!=='W'||!base.tissue34||!ref?.paper?.B3)return base;
  const mesh=base.parts[0], src=mesh.vertices, vertices=src.slice(), scale=base.paperShape.scale;
  const {active,faces}=prepare(base,ref);
  for(const {i,hand,q,u,gate,delta} of active) {
    const w=scale*gate*Math.exp(-.5*(((q-fit.center)/fit.spread)**2+((u-fit.top)/fit.depth)**2));
    const rw=scale*gate*Math.exp(-.5*(((q-(fit.returnCenter??-.25))/.18)**2+((u-.82)/.075)**2));
    const d=[fit.lateral*hand*w,-fit.drop*w-(fit.returnDrop??0)*rw,
      fit.forward*w+(fit.returnFront??0)*rw].map((v,k)=>v+fit.mix*delta[k]);
    if(Math.hypot(...d)<1e-7)continue;
    vertices[i]={...src[i],p:src[i].p.map((v,k)=>v+d[k])};
  }
  rotateNormals(src,vertices,faces,fit.normalBlend??.75,fit.normalCap??10);
  return {...base,parts:base.parts.map(part=>part.vertices===src?{...part,vertices}:part)};
}
export const chest47=makeChest47;
