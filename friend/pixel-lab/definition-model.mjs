import {renderPixels,bodyParts} from './renderer.mjs';
import {portraitAtResolution} from './render-resolution.mjs';
import {portraitPixels} from './portrait48.mjs';
import {DEFAULTS} from './model.mjs';
import {buildSculptBase,displayScene,defaultView,posed,sculpt,zero} from './studio-sculpt-model.mjs';
import {addRound47} from './studio-bases47.mjs';
import {prepare49} from './studio-bases49.mjs';

export function prepareDefinition(id,assets) {
  const family=/^(female|male)-([2-8])$/.exec(id);
  if(family){
    const settings={...DEFAULTS,sex:family[1],heads:Number(family[2]),motion:false};
    return {id,settings,portrait:false,scene:bodyParts(settings)};
  }
  if(!['F02','M01','W'].includes(id))throw new Error('모델 선택을 확인하세요.');
  const model=addRound47(buildSculptBase(id,assets),assets);
  prepare49(model,assets);
  return {id,model,settings:model.settings,portrait:id==='W'?false:'face'};
}
export function definitionScene(study,edit={}) {
  if(!study.model)return study.scene;
  const {id,model}=study;
  const edited=sculpt(model.round49,id,{...zero(id),...edit.values});
  const view={...defaultView(id),pivot:edit.pivot||defaultView(id).pivot,angle:edit.angle||0};
  return displayScene(model,'round49',posed(edited,id,view));
}
export function renderDefinitionPair(study,scene,{yaw=0,pitch=0,zoom=1,highSize=1024,pixelSize=48}={}) {
  if(![128,512,1024,2048].includes(highSize)||![48,96].includes(pixelSize))throw new RangeError('지원하지 않는 원본 크기입니다.');
  const common={sceneOverride:scene,portrait:study.portrait,yaw,pitch,freeOrbit:true};
  // 렌더러의 고정 8px 여백을 보정해 판별 출력 크기와 관계없이 같은 시야를 사용한다.
  const field=1-8/48;
  const hx=zoom*field/(1-8/highSize),px=zoom*field/(1-8/pixelSize);
  const start=performance.now();
  const high=renderPixels(study.settings,{...common,studyResolution:highSize,highDefinition:true,outline:false,cameraZoom:hx});
  const highMs=performance.now()-start, pixelStart=performance.now();
  const pixel=portraitAtResolution(portraitPixels,study.settings,{...common,cameraZoom:px},pixelSize);
  return {high,pixel,highMs,pixelMs:performance.now()-pixelStart};
}
