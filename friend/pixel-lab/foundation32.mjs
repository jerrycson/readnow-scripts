import {chibiStudy} from './chibi/body.mjs';
import {continuousStudy} from './continuous/body.mjs';
import {profileStudy} from './profile31.mjs';
import {norm} from './geometry.mjs';

export const originalForm=s=>s.heads<5?chibiStudy(s):continuousStudy(s);
const cache=new WeakMap();
function bell(x,center,width){const d=(x-center)/width;return Math.exp(-d*d);}
function ramp(lo,hi,x){const t=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return t*t*(3-2*t);}

// All attached ink, eyes, and skin pass through the same differentiable field.
// Coordinates use head lengths. The outline is a consequence of the surface in 3D.
export function foundation(s){
  const base=s.heads<5?chibiStudy({...s,rigClearance:true}):originalForm(s);
  if(cache.has(base))return cache.get(base);
  const rest=s.heads===4?{...base,parts:[base.parts[0],...profileStudy(s,'C').parts.slice(1)]}:base;
  const n=s.heads,small=n<5,chin=rest.landmarks.chin[1],right=rest.joints.right;
  const eye=small?[.32,.36,.40][n-2]:.48,front=small?.08:rest.faceCenter[2];
  function depth(x,y,z){
    const h=y-chin,ax=Math.abs(x);
    if(h>-.03){
      const face=ramp(front-.05,front+.14,z),back=1-ramp(front-.14,front,z);
      const nose=.058*bell(x,0,small?.069:.088)*bell(h,eye-.10,.082);
      const cheek=.036*bell(ax,small?.28:.23,.13)*bell(h,eye-.095,.12);
      const orbit=-.028*bell(ax,small?.22:.18,.10)*bell(h,eye+.006,.066);
      const temple=-.045*bell(ax,small?.39:.31,.086)*bell(h,eye+.015,.132);
      const lip=.017*bell(x,0,.095)*bell(h,eye-.203,.042);
      const jaw=.025*bell(x,0,.17)*bell(h,.055,.066);
      const occiput=-.036*bell(h,.62,.23)*bell(ax,.12,.38);
      return ramp(-.03,.04,h)*((s.designStyle==='manga'?1:.55)*face*(nose+cheek+orbit+temple+lip+jaw)+back*occiput);
    }
    const g=(joint,dx,dy)=>bell(ax,Math.abs(joint[0]),dx)*bell(y,joint[1],dy);
    const shoulder=g(right.shoulder,small?.13:.21,small?.13:.25);
    const knee=g(right.knee,small?.095:.155,small?.14:.19);
    const calf=bell(ax,Math.abs(right.knee[0]+right.ankle[0])/2,small?.14:.18)*bell(y,right.ankle[1]+(right.knee[1]-right.ankle[1])*.63,small?.18:.34);
    const hip=g(right.hip,small?.16:.25,small?.16:.30);
    return (small?.75:1)*ramp(.015,.12,y)*(1-ramp(chin-.19,chin-.035,y))*
      (ramp(-.03,.12,z)*(.031*knee+.032*shoulder)-(1-ramp(-.06,.09,z))*(.043*calf+.037*hip+.018*shoulder));
  }
  const point=p=>[p[0],p[1],p[2]+depth(...p)];
  const banks=new Map(),step=.0002;
  const parts=rest.parts.map(part=>{
    if(!banks.has(part.vertices))banks.set(part.vertices,part.vertices.map(v=>{
      const [x,y,z]=v.p,n=v.n,d=depth(x,y,z);
      if(Math.abs(d)<1e-9)return v;
      const dx=(depth(x+step,y,z)-depth(x-step,y,z))/(2*step);
      const dy=(depth(x,y+step,z)-depth(x,y-step,z))/(2*step);
      const dz=1+(depth(x,y,z+step)-depth(x,y,z-step))/(2*step);
      return {...v,p:[x,y,z+d],n:norm([n[0]-dx*n[2]/dz,n[1]-dy*n[2]/dz,n[2]/dz])};
    }));
    return {...part,vertices:banks.get(part.vertices)};
  });
  const mapPoints=dict=>Object.fromEntries(Object.entries(dict).map(([k,p])=>[k,point(p)]));
  const result={...rest,parts,joints:{left:mapPoints(rest.joints.left),right:mapPoints(rest.joints.right)},rigPivots:rest.rigPivots&&mapPoints(rest.rigPivots)};
  cache.set(base,result);
  return result;
}
