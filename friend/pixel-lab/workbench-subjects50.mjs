import {faceOptions50} from './face-options50.mjs';
import {chestOptions50} from './chest-options50.mjs';
const chests=new Set(chestOptions50.map(o=>o.id));
export const isChestSubject=id=>chests.has(id);
export const modelNames=Object.freeze(Object.fromEntries([...faceOptions50,...chestOptions50].map(o=>[o.id,o.label])));
export function isWorkbenchSubject(id){
  return typeof id==='string'&&(Object.hasOwn(modelNames,id)||/^(female|male)-[2-8]$/.test(id));
}
