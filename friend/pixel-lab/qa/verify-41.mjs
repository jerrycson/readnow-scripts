import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DEFAULTS} from '../model.mjs';
import {loadRig} from '../rig32.mjs';
import {face36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {jaw39} from '../jaw39.mjs';
import {eye40} from '../eye40.mjs';
import {iris41} from '../iris41.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';

for(const test of ['face41.mjs','chest41.mjs'])execFileSync(process.execPath,[fileURLToPath(new URL(test,import.meta.url))],{stdio:'inherit'});
const read=file=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url)));
const observations=read('iris-eval41.json'), atlas=read('atlas35.json'), refs=read('traces36.json');
await loadRig();
for(const id of ['F02','M01']){
 const settings={...DEFAULTS,heads:8,designStyle:'manga',sex:id==='F02'?'female':'male',resolution:128};
 const ref=refs.faces[id], model=face36(settings,atlas.faces.find(f=>f.id===id),ref);
 const chin=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
 const old=jaw39(face38(chin,id,model,ref),id,model);
 const base=id==='F02'?eye40(old,id):old;
 const scenes=[base,iris41(base,id,'tint'),iris41(base,id,'bands')];
 for(const size of [48,96,192])for(const [i,[yaw,pitch]] of observations.views.entries()){
   const images=scenes.map(sceneOverride=>portraitAtResolution(portraitPixels,settings,{sceneOverride,yaw,pitch,freeOrbit:true,portrait:'face'},size).data);
   for(const [j,image] of images.slice(1).entries()){
     let count=0,maximum=0;
     for(let k=0;k<image.length;k+=4){
       assert.equal(image[k+3],images[0][k+3]);
       const delta=Math.max(...[0,1,2].map(t=>Math.abs(image[k+t]-images[0][k+t])));
       if(delta>=8)count++;maximum=Math.max(maximum,delta);
     }
     const expected=observations.pixels[id][size][i][j];
     assert.equal(count,expected.count,id+' '+size+'px '+yaw+'도 '+j+'번 색층');
     assert.equal(maximum,expected.max);
     if(yaw===180)assert.equal(count,0);
   }
 }
}
console.log('페른 40차·힘멜 39차 기하에서 8시점 3해상도 2색층의 실제 화소와 실루엣 검증');
