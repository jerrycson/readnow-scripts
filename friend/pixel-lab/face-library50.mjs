import {DEFAULTS} from './model.mjs';
import {surfaceDefaults} from './surface-settings35.mjs';
import {fittedFace} from './fitting35.mjs';
import {prepareDefinition,definitionScene} from './definition-model.mjs';

import {faceOptions50} from './face-options50.mjs';
export {faceOptions50};
export function createFaceStudy50(id,assets){
 const option=faceOptions50.find(item=>item.id===id);
 if(!option)throw new RangeError('교체할 얼굴 연구 ID를 확인하세요.');
 const record=assets.atlas.faces.find(item=>item.id===id);
 if(!record||record.name!==option.label)throw new Error('인물 ID와 원래 설정화 장부가 일치하지 않습니다.');
 const evidence={title:record.name,page:record.source,views:record.views.map(v=>({label:v.label,url:v.url})),
   frontIndex:record.active,profileIndex:record.extra?.index,heldIndex:record.blindView?.index,limits:option.limits??'49차 중립 보존'};
 if(option.preserved){
   const study=prepareDefinition(id,assets);
   return {...study,scene:definitionScene(study),evidence,preserved:true};
 }
 const settings={...DEFAULTS,...surfaceDefaults,showNac:true,top:'none',heads:8,designStyle:'manga',sex:option.sex,paperForm:'W'};
 const scene=fittedFace(settings,record);
 return {id,settings,scene,portrait:'face',evidence,preserved:false};
}
