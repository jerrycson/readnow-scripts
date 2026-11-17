import {makeChest51,editChest51} from './chest51.mjs';
import {chestPinned51} from './chest-fits51.mjs';
import {bodyStudy52} from './chest52.mjs';
import {lowerBody51} from './lower-body51.mjs';
import {profiles53,typeProfile53} from './chest-fits53.mjs';
import {support53} from './chest-support53.mjs';

const models=new WeakMap();
const attachments=new WeakMap();
export const supportsChest53=id=>id==='W'||Object.hasOwn(typeProfile53,id);
export function chestTrial53(study){
  if(!supportsChest53(study.id))return makeChest51(study);
  if(models.has(study))return models.get(study);
  const old=makeChest51(study);
  const candidate=study.id==='W'
    ?support53(bodyStudy52(study,'lowerContact52').candidate)
    :lowerBody51(old.candidate,profiles53[typeProfile53[study.id]]);
  const result={...old,candidate,marksCache:new WeakMap(),reboundCache:new WeakMap()};
  models.set(study,result);
  return result;
}
export function editChest53(study,edit,render50){
  if(!supportsChest53(study.id))return editChest51(study,edit,render50);
  const trial=chestTrial53(study);
  const key=JSON.stringify([edit?.values||null,edit?.surface||null,edit?.markerVersion||'source']);
  let attachment=attachments.get(study);
  if(attachment?.key!==key){
    let material=chestPinned51[study.id]?study.candidate:makeChest51(study).candidate;
    if(study.id==='W')material=trial.candidate;
    let shape=trial.candidate;
    if(edit?.values){
      const values={...study.api.zero('W'),...edit.values};
      material=study.api.sculpt(material,'W',values);
      shape=study.api.sculpt(shape,'W',values);
    }
    const marksCache=new WeakMap(),reboundCache=new WeakMap();
    const settings={...study.settings,...edit?.surface};
    const editView={...trial,settings,marksCache,reboundCache};
    render50({...editView,candidate:material},{version:'candidate',markerVersion:edit?.markerVersion});
    marksCache.set(shape,marksCache.get(material));
    attachment={key,study:{...editView,candidate:shape}};
    attachments.set(study,attachment);
  }
  return render50(attachment.study,{...edit,values:undefined,surface:undefined,version:'candidate'});
}

