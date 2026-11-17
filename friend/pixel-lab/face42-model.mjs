import {DEFAULTS} from './model.mjs';
import {surfaceDefaults} from './surface-settings35.mjs';
import {face36} from './contour-model36.mjs';
import {correctFernChin} from './chin37.mjs';
import {face38} from './face38.mjs';
import {jaw39} from './jaw39.mjs';
import {eye40} from './eye40.mjs';
import {jaw42} from './jaw42.mjs';
import {portraitPixels} from './portrait48.mjs?v=41';
import {portraitAtResolution} from './render-resolution.mjs';
import {renderPixels,projectPoint} from './renderer.mjs?v=41';

export function pair42(id,atlas,ref) {
  const settings={...DEFAULTS,...surfaceDefaults,showNac:true,top:'none',heads:8,
    designStyle:'manga',sex:id==='F02'?'female':'male',paperForm:'W'};
  const trace=ref.faces[id],record=atlas.faces.find(r=>r.id===id);
  const model=face36(settings,record,trace);
  const previous=id==='F02'?correctFernChin(model.after,id,model,trace,.75):model.after;
  const jaw=jaw39(face38(previous,id,model,trace),id,model);
  const prior=id==='F02'?eye40(jaw,id):jaw;
  const next=jaw42(prior,id,model);
  // 눈은 파츠 전체에서 사용한 정점만 가져온다. 화면에서는 가림을 계산한 완성 프레임을 잘라 본다.
  const eyes=prior.parts.filter(p=>p.name==='eye34'||p.name==='brow34').flatMap(p=>[...new Set(p.faces.flat())].map(i=>p.vertices[i].p));
  return {prior,next,settings,eyes};
}

export function frame42(pair,which,{size,scope,yaw,pitch,zoom}) {
  const scene=pair[which],portrait=scope==='body'?false:'face';
  const options={sceneOverride:scene,portrait,freeOrbit:true,yaw,pitch,cameraZoom:zoom};
  const rendered=portraitAtResolution(portraitPixels,pair.settings,options,size);
  return {rendered,options};
}

export function eyeBounds42(pair,frame) {
  let image=frame.rendered;
  const size=image.width;
  // portrait48은 완성된 RGBA만 반환한다. 동일한 192px→48px 경로의 투영정보를
  // 빈 파츠 목록으로 읽어, 눈 정점 위치를 실제 표시 화소에 옮긴다.
  if(!image.projection){
    const o=frame.options;
    image=renderPixels(pair.settings,{...o,sceneOverride:{...o.sceneOverride,parts:[]},studyResolution:192,cameraZoom:o.cameraZoom*160/184});
  }
  const ratio=size/image.width,coords=pair.eyes.map(p=>projectPoint(image,p).map(v=>v*ratio));
  const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]),pad=Math.max(1,Math.ceil(size*.025));
  const x=Math.max(0,Math.floor(Math.min(...xs))-pad),y=Math.max(0,Math.floor(Math.min(...ys))-pad);
  const right=Math.min(size,Math.ceil(Math.max(...xs))+pad),bottom=Math.min(size,Math.ceil(Math.max(...ys))+pad);
  return right>x&&bottom>y?[x,y,right-x,bottom-y]:null;
}
