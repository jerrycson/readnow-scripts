import {form34} from './bust34.mjs';
import {paperShape} from './paper-shape35.mjs';
import {orientedSkin} from './skin-normals35.mjs';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function paperRig(settings){
  const scene=form34(settings,'shallow'),torso=scene.parts[0],tissue=scene.tissue34;
  if(!tissue)return scene;
  const hip=scene.joints.right.hip[1],sh=scene.joints.right.shoulder[1],w=tissue.width;
  const shape=paperShape(settings,w,hip,sh),responses=tissue.responses.slice(),old=torso.vertices;
  const y0=hip+(sh-hip)*.30,range=(sh-hip)*.75;
  const ridge=Array.from({length:49},(_,i)=>{
    const y=y0+range*i/48;
    const candidates=old.filter(v=>Math.abs(v.p[0])<w*.10&&Math.abs(v.p[1]-y)<range*.045&&v.p[2]>.1*w);
    return candidates.length?candidates.reduce((s,v)=>s+v.p[2],0)/candidates.length:.44*w;
  });
  const vertices=old.map((v,i)=>{
    const [x,y,z]=v.p,side=x<0?-1:1,{c,top,foot,root}=shape.frame(side);
    const q=Math.abs(x-c)/root,u=(top-y)/(top-foot);
    if(u<-.18||u>1.38||q>1.34||z<=.03*w)return v;
    const region=(1-smooth(1,1.32,q))*smooth(-.18,0,u)*(1-smooth(1,1.38,u))*smooth(.03,.28,z/w);
    const k=clamp((y-y0)/range*48,0,47.999),j=Math.floor(k);
    const wall=ridge[j]+(k-j)*(ridge[j+1]-ridge[j])-w*(.18*(x/w)**2+.21*(x/w)**4);
    const base=z+(wall-z)*region,p=shape.point(x,y,base,region);
    const free=Math.max(0,1-q*q)*Math.sin(Math.PI*clamp(u,0,1))**.75*region;
    const prior=responses[i]||{side,outer:0};responses[i]={...prior,free,lower:free*smooth(.36,.88,u)};
    return {...v,p};
  });
  const geometry=orientedSkin(old,vertices,torso.faces);
  const formed=vertices.map((v,i)=>v===old[i]?v:geometry[i]);
  return {...scene,parts:scene.parts.map(m=>m.vertices===old?{...m,vertices:formed}:m),
    tissue34:{...tissue,responses},surfaceAnchors:[-1,1].map(s=>shape.marker(s)),paperShape:shape,restSkin35:old};
}
