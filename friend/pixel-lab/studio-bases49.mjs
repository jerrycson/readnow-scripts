import {posed} from './studio-sculpt-model.mjs';
import {prepare48,poseComparison48} from './studio-bases48.mjs';
import {expressMouth49,probeEyeOpening49} from './face49.mjs';
import {poseChest49} from './chest49.mjs';
export function prepare49(model,assets){
  prepare48(model,assets);
  // 도판에서 실측한 자세는 47차 중립 피부를 출발점으로 쓴다.
  model.round49=model.round47;
  if(model.id==='W')model.bindings.round49=model.bindings.round47;
}
export function applyPose49(model,base,source,view,performance){
  if(model.id==='W'){
    if(performance&&performance.pose!=='neutral')return poseChest49(source,performance.pose);
    return poseComparison48(model,base,posed(source,'W',view),view);
  }
  let face=source;
  if(model.id==='F02'&&performance?.lid)face=probeEyeOpening49(source,performance.lid);
  if(model.id==='M01'&&performance&&(performance.corner||performance.opening)){
    face=expressMouth49(source,performance.corner/100,performance.opening/100);
  }
  return posed(face,model.id,view);
}
