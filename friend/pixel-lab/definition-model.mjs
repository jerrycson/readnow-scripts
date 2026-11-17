import {renderPixels,bodyParts} from './renderer.mjs?ui=49-review-4c7e86d4';
import {portraitAtResolution} from './render-resolution.mjs';
import {portraitPixels} from './portrait48.mjs?ui=49-review-4c7e86d4';
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
export function renderDefinitionView(study,scene,{yaw=0,pitch=0,zoom=1,size=1024,framing='model'}={}) {
  if(![48,96,128,512,1024,2048].includes(size))throw new RangeError('지원하지 않는 원본 크기입니다.');
  let portrait=study.portrait, cameraScene=scene;
  if(framing==='face')portrait='face';
  if(framing==='upper'||framing==='body'){
    const rest=study.raw??study.model?.round49??study.scene;
    const height=rest.height, hip=rest.joints.right.hip[1];
    // 8등신 원형은 양팔 178°에서 손끝이 정수리보다 0.27신장 위로 간다.
    const centerY=framing==='body'?height*.625:(height+hip)*.5;
    const frame=framing==='body'?height*1.14:(height-hip)*1.17;
    cameraScene={...scene,frame,cameraCenter:[0,centerY,0]};
    portrait=false;
  }
  const common={sceneOverride:cameraScene,portrait,yaw,pitch,freeOrbit:true};
  // 렌더러의 고정 8px 여백을 보정해 판별 출력 크기와 관계없이 같은 시야를 사용한다.
  const field=1-8/48;
  const cameraZoom=zoom*field/(1-8/size);
  if(size<=96)return portraitAtResolution(portraitPixels,study.settings,{...common,cameraZoom},size);
  return renderPixels(study.settings,{...common,studyResolution:size,highDefinition:true,outline:false,cameraZoom});
}
export function renderDefinitionPair(study,scene,{yaw=0,pitch=0,zoom=1,highSize=1024,pixelSize=48}={}) {
  if(![128,512,1024,2048].includes(highSize)||![48,96].includes(pixelSize))throw new RangeError('지원하지 않는 원본 크기입니다.');
  const start=performance.now();
  const high=renderDefinitionView(study,scene,{yaw,pitch,zoom,size:highSize});
  const highMs=performance.now()-start, pixelStart=performance.now();
  const pixel=renderDefinitionView(study,scene,{yaw,pitch,zoom,size:pixelSize});
  return {high,pixel,highMs,pixelMs:performance.now()-pixelStart};
}
