import {add,sub,cross,dot,norm} from './geometry.mjs';
const cache=new WeakMap();
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function plantSole55(mesh){
  if(cache.has(mesh))return cache.get(mesh);
  const xs=mesh.vertices.map(v=>v.p[0]),ys=mesh.vertices.map(v=>v.p[1]),zs=mesh.vertices.map(v=>v.p[2]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),height=Math.max(...ys)-y0;
  const z0=Math.min(...zs),length=Math.max(...zs)-z0;
  const moved=[],result=mesh.vertices.map((v,i)=>{
    const [x,y,z]=v.p,u=(z-z0)/length,lateral=Math.abs(2*(x-x0)/(x1-x0)-1);
    const arch=smooth(.36,.49,u)*(1-smooth(.53,.67,u));
    const cut=height*(.115+.050*smooth(.52,.70,u))*(1-.91*arch)*(1-.64*smooth(.55,.95,lateral));
    const h=y-y0,shift=Math.min(h,cut)*(1-smooth(cut,height*.44,h));
    moved[i]=shift>1e-9;return moved[i]?{...v,p:[x,y-shift,z]}:v;
  });
  const key=p=>p.map(n=>Math.round(n*1e7)).join('/'),sums=new Map(),changed=new Set();
  for(const ids of mesh.faces){
    const [a,b,c]=ids.map(i=>result[i].p);
    const n=cross(sub(b,a),sub(c,a));if(Math.hypot(...n)<1e-10)continue;
    const [ra,rb,rc]=ids.map(i=>mesh.vertices[i]);
    const sign=dot(cross(sub(rb.p,ra.p),sub(rc.p,ra.p)),ra.n)<0?-1:1;
    for(const i of ids){const k=key(mesh.vertices[i].p);sums.set(k,add(sums.get(k)||[0,0,0],n.map(t=>sign*t)));if(ids.some(j=>moved[j]))changed.add(k);}
  }
  mesh.vertices.forEach((v,i)=>{const k=key(v.p);if(changed.has(k)&&sums.has(k))result[i]={...result[i],n:norm(sums.get(k))};});
  const out={...mesh,vertices:result};cache.set(mesh,out);return out;
}
