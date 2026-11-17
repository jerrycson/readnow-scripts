import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadRig} from '../rig32.mjs';
import {DEFAULTS} from '../model.mjs';
import {surfaceDefaults} from '../surface-settings35.mjs';
import {face36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {jaw39} from '../jaw39.mjs';
import {eye40} from '../eye40.mjs';
import {studyView} from '../camera35.mjs';
import {portraitPixels} from '../portrait48.mjs';
import {portraitAtResolution} from '../render-resolution.mjs';
const json=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const digest=data=>createHash('sha256').update(data).digest('hex');
for(const filename of ['face40.mjs','chest40.mjs'])
  execFileSync(process.execPath,[fileURLToPath(new URL(filename,import.meta.url))],{stdio:'inherit'});
const atlas=json('atlas35.json'),references=json('traces36.json'),samples=json('native40.json');
assert.equal(samples.candidateSha,digest(readFileSync(new URL('../eye40.mjs',import.meta.url))));
await loadRig();
for(const id of ['F02','M01']){
  const settings={...DEFAULTS,...surfaceDefaults,heads:8,designStyle:'manga',sex:id==='F02'?'female':'male',showNac:true,top:'none',paperForm:'W'};
  const ref=references.faces[id],model=face36(settings,atlas.faces.find(r=>r.id===id),ref);
  const s37=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
  const before=jaw39(face38(s37,id,model,ref),id,model),after=eye40(before,id),camera=studyView(before,true);
  for(const size of [48,96]){
    const list=samples.subjects[id][size];assert.equal(list.length,7);
    for(const [index,entry] of list.entries()){
      const {yaw,pitch}=entry;assert.deepEqual([yaw,pitch],samples.views[index]);
      for(const [slot,sceneOverride] of [['prior',before],['next',after]]){
        const frame=portraitAtResolution(portraitPixels,settings,{...camera,sceneOverride,yaw,pitch,freeOrbit:true,cameraZoom:1},size);
        assert.equal(frame.width,size);assert.equal(digest(frame.data),entry[slot].hash);
      }
    }
  }
}
console.log('실제 표시 크기 48·96픽셀의 두 판, 두 인물, 일곱 각도 56프레임 지문 일치');
