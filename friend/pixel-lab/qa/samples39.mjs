import {readFileSync} from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {DEFAULTS} from '../model.mjs';
import {face36,chest36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {chest38} from '../chest38.mjs';
import {jaw39} from '../jaw39.mjs';
import {chest39} from '../chest39.mjs';
import {surfaceDefaults} from '../surface-settings35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {studyView} from '../camera35.mjs';
import {bindSurface,surfaceParts} from '../surface35.mjs';

const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
export const views={face:[[-90,0],[-45,0],[-105,18],[60,-16]],W:[[0,0],[-26.15,0],[-90,0],[26.15,0]]};
export async function makeSamples(){
  await loadRig();
  const refs=read('traces36.json'),atlas=read('atlas35.json'),result=[];
  for(const id of ['F02','M01','W']){
    const face=id!=='W',settings={...DEFAULTS,...surfaceDefaults,heads:8,sex:id==='M01'?'male':'female',designStyle:'manga',showNac:true,top:'none',paperForm:'W'};
    let before,after;
    if(face){
      const ref=refs.faces[id],base=face36(settings,atlas.faces.find(r=>r.id===id),ref);
      const prior=id==='F02'?correctFernChin(base.after,id,base,ref,.75):base.after;
      before=face38(prior,id,base,ref);after=jaw39(before,id,base);
    }else{
      before=chest38(chest36(settings,refs,read('fit36.json').fit),refs);
      after=chest39(before,refs);
    }
    const camera=studyView(before,face),frame=camera.sceneOverride;
    const angles=views[face?'face':'W'];
    const draw=scene=>{
      const parts=face?scene.parts:[...scene.parts,...surfaceParts(bindSurface(scene,settings),scene.parts[0])];
      const sceneOverride={...scene,parts,height:frame.height,faceCenter:frame.faceCenter,frame:frame.frame,cameraCenter:frame.cameraCenter};
      return angles.map(([yaw,pitch])=>portraitPixels(settings,{...camera,sceneOverride,yaw,pitch,studyResolution:192,freeOrbit:true}));
    };
    result.push({id,before:draw(before),after:draw(after)});
  }
  return result;
}
