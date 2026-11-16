import {chibiStudy} from './chibi/body.mjs';
import {norm} from './geometry.mjs';
const weights={원형:0,A:.60,B:1,C:2};
const cache=new Map();
function gate(z){
  const t=Math.min(1,Math.max(0,(z+.04)/.21));
  return t*t*(3-2*t);
}
const bell=(v,center,radius)=>Math.exp(-(((v-center)/radius)**2));
function depth(x,h,z,w){
  if(w===2){
    const jaw=.043*bell(x,0,.215)*bell(h,.055,.107);
    const lips=bell(x,0,.105)*(.015*bell(h,.182,.040)-.003*bell(h,.127,.032));
    const throat=-.014*bell(x,0,.16)*bell(h,-.070,.077);
    return gate(z)*(jaw+lips+throat);
  }
  const chin=.078*bell(h,.044,.081), lip=.052*bell(h,.182,.036);
  const fold=-.019*bell(h,.129,.027), neck=-.025*bell(h,-.068,.072);
  return w*bell(x,0,.30)*gate(z)*(chin+lip+fold+neck);
}
export function profileStudy(settings,variant){
  if(settings.heads!==4 || !Object.hasOwn(weights,variant))throw Error('4등신 31차 비교 전용');
  const source=chibiStudy(settings), w=weights[variant];if(!w)return source;
  const key=settings.sex+'-'+settings.candidate+'-'+variant;if(cache.has(key))return cache.get(key);
  const chin=source.landmarks.chin[1], delta=.0001;let minJacobian=Infinity;
  const parts=source.parts.map(part=>({...part,vertices:part.vertices.map(({p,n,...rest})=>{
    const [x,y,z]=p,h=y-chin,offset=depth(x,h,z,w);
    if(Math.abs(offset)<1e-10)return {p,n,...rest};
    const dx=(depth(x+delta,h,z,w)-depth(x-delta,h,z,w))/(2*delta);
    const dy=(depth(x,h+delta,z,w)-depth(x,h-delta,z,w))/(2*delta);
    const dz=1+(depth(x,h,z+delta,w)-depth(x,h,z-delta,w))/(2*delta);
    minJacobian=Math.min(minJacobian,dz);
    return {...rest,p:[x,y,z+offset],n:norm([n[0]-dx*n[2]/dz,n[1]-dy*n[2]/dz,n[2]/dz])};
  })}));
  const scene={...source,parts,minJacobian};cache.set(key,scene);return scene;
}

