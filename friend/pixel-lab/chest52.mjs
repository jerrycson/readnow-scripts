import {makeChest51} from './chest51.mjs';
import {lowerBody51} from './lower-body51.mjs';

const trials={
  lowerContact52:[
    {center:-.32,width:.30,band:.84,soft:.11,down:-.007,depth:.018},
    {center:.39,width:.25,band:.87,soft:.10,down:.00532,depth:-.00342}
  ],
  floor52:[{center:.12,width:.19,band:.84,soft:.10,down:.017,depth:.009}]
};
const cache=new WeakMap();
export function bodyStudy52(study,version){
  if(study.id!=='W'||!Object.hasOwn(trials,version))return study;
  let variants=cache.get(study);if(!variants){variants=new Map();cache.set(study,variants);}
  if(!variants.has(version)){
    const old=makeChest51(study);
    const candidate=trials[version].reduce((shape,params)=>lowerBody51(shape,params),old.candidate);
    variants.set(version,{...old,candidate,marksCache:new WeakMap(),reboundCache:new WeakMap()});
  }
  return variants.get(version);
}
