import {regions} from './continuous/regions33.mjs';
const decoded=new Map();
export function weights(id,count){
  if(!decoded.has(id)){
    const a=new Uint8Array(count);
    for(const [vertex,weight] of regions[id]||[])a[vertex]=weight;
    decoded.set(id,a);
  }
  return decoded.get(id);
}
export const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
export function ramp(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t);}
export const bell=(x,c,w)=>Math.exp(-(((x-c)/w)**2));