import {pose34} from './bust34.mjs';

// Angles are inputs to this rig. The original photographs only establish
// hand placement categories and do not supply 3-D joint angles.
export const chestPoses49 = Object.freeze({
  neutral: {label:'기본 자세', joints:{}},
  waist: {label:'양손 허리 · 근사 자세', panel:'b', surfacePanel:'e', joints:{
    shoulder:{bend:0,side:39,turn:-82},elbow:{bend:112,turn:-5},wrist:{bend:-34,side:1}}},
  behindHead: {label:'양손 머리 뒤 · 근사 자세', panel:'c', surfacePanel:'f', joints:{
    shoulder:{bend:-25,side:117,turn:86},elbow:{bend:141,turn:79},wrist:{bend:60,side:-10}}}
});

export function poseSpec49(key) {
  const preset=chestPoses49[key];
  if (!preset) throw new RangeError('49차 자세를 확인해 주세요.');
  const pose={};
  for(const side of ['left','right'])for(const [joint,angles] of Object.entries(preset.joints)){
    pose[side+'.'+joint]={...angles};
  }
  return pose;
}

// src is the shape after local edits and before previous joint poses. Skin
// patches and the comparison camera are attached to the returned posed body.
export function poseChest49(src,key='neutral'){
  if (!src?.tissue34||src.paperShape?.form?.id!=='W'||key==='neutral') return src;
  return pose34(src,poseSpec49(key)).scene;
}

