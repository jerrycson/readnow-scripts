export function studyView(scene,face){
  if(face)return {sceneOverride:scene,portrait:'face'};
  const sh=scene.joints.right.shoulder,hp=scene.joints.right.hip,w=Math.abs(sh[0]);
  return {sceneOverride:{...scene,frame:3.30*w,cameraCenter:[0,hp[1]+(sh[1]-hp[1])*.735,.45*w]},portrait:false};
}
