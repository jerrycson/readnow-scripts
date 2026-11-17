import {humanScene} from './anatomy.mjs?v=52-hair';
import {validateSettings} from './model.mjs';
import {FACIAL_OPTIONS} from './facial.mjs';
import {HAIR_DESIGNS} from './hair-design.mjs';
import {buildHair52} from './hair-sheet52.mjs';
import {applyBody52,supportsBody52} from './body-composition52.mjs';
import {faceOptions50} from './face-options50.mjs';
import {placeResearchHair52} from './hair-anchor52.mjs';

const faces=new Set(faceOptions50.map(item=>item.id));
const hairs=new Set(HAIR_DESIGNS.map(item=>item.id));
const cache=new WeakMap();
export const facialGroups52=Object.freeze({faceShape:'얼굴형',eyeShape:'눈',noseShape:'코',mouthShape:'입',earShape:'귀'});
export function supportsAppearance52(id){return supportsBody52(id)||faces.has(id);}
export function appearanceScene52(study,scene,values={}){
  if(!supportsAppearance52(study.id))return scene;
  const hair=hairs.has(values.hair)?values.hair:'none';
  if(supportsBody52(study.id)){
    const design={hair};
    for(const [key,options] of Object.entries(FACIAL_OPTIONS)){
      const index=values[key];
      design[key]=Number.isInteger(index)&&options[index]?index:study.settings[key];
    }
    const custom=Object.keys(design).some(key=>design[key]!==study.settings[key]);
    let styled=scene;
    if(custom){
      const key=JSON.stringify(design),last=cache.get(study);
      if(last?.base===scene&&last.key===key)styled=last.styled;
      else{
        const generated=humanScene(validateSettings({...study.settings,...design}),0,'idle',{designHair:buildHair52});
        const baseIndex=scene.parts.findIndex(p=>p.name==='head'),headIndex=generated.parts.findIndex(p=>p.name==='head');
        if(baseIndex<0||headIndex<0)throw Error('전신의 머리 이음을 찾을 수 없습니다.');
        styled={...scene,parts:[...scene.parts.slice(0,baseIndex),...generated.parts.slice(headIndex)]};
        cache.set(study,{base:scene,key,styled});
      }
    }
    return applyBody52(study,values,styled);
  }
  if(hair==='none')return scene;
  const reference=study.model?.round49??study.scene;
  return placeResearchHair52(reference,scene,hair,buildHair52,study.settings.heads);
}
