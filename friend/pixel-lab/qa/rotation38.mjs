import {readFileSync} from 'node:fs';
import {DEFAULTS} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {face36,chest36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {chest38} from '../chest38.mjs';
import {surfaceDefaults} from '../surface-settings35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';
import {studyView} from '../camera35.mjs';

const json=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
export const angles=[0,-45,-90,-135,180,135,90,45];
export async function rotationSamples(){
  await loadRig();
  const refs=json('traces36.json'),records=json('atlas35.json').faces,results=[];
  for(const id of ['F02','M01','W']){
    const face=id!=='W';
    const s={...DEFAULTS,...surfaceDefaults,heads:8,sex:id==='M01'?'male':'female',designStyle:'manga',showNac:true,top:'none',paperForm:'W',resolution:48};
    let before,after;
    if(face){
      const ref=refs.faces[id],model=face36(s,records.find(row=>row.id===id),ref);
      before=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
      after=face38(before,id,model,ref);
    }else{
      before=chest36(s,refs,json('fit36.json').fit);
      after=chest38(before,refs);
    }
    const camera=studyView(before,face),frame=camera.sceneOverride;
    function version(scene){
      const parts=face?scene.parts:[...scene.parts,...surfaceParts(bindSurface(scene,s),scene.parts[0])];
      const sceneOverride={...scene,parts,height:frame.height,faceCenter:frame.faceCenter,frame:frame.frame,cameraCenter:frame.cameraCenter};
      return angles.map(yaw=>portraitPixels(s,{...camera,sceneOverride,yaw,pitch:0,freeOrbit:true}));
    }
    results.push({id,before:version(before),after:version(after)});
  }
  return results;
}
