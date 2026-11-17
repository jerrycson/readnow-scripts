import {candidateFace48} from './face48.mjs';
import {makeChest48,correctChestPose48} from './chest48.mjs';
import {bindSurface} from './surface35.mjs';

export function prepare48(model,assets) {
  if(model.round48)return;
  if(model.id==='W'){
    model.round48=makeChest48(model.prior,assets.traces);
    model.bindings.round48=bindSurface(model.round48,model.settings);
  }else{
    model.round48=candidateFace48(model.round47,model.id);
  }
}

export function poseComparison48(model,base,scene,view) {
  if(base==='round48'&&model.id==='W'&&view.pivot==='arms.raise'&&view.angle>0){
    return correctChestPose48(scene,model.prior,model.round47,view.angle);
  }
  return scene;
}
