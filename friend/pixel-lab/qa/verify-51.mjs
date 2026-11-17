import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createFaceStudy50,faceOptions50} from '../face-library50.mjs';
import {createChestStudy50,editChestStudy50,chestOptions50} from '../chest-types50.mjs';
import {candidateOrbit51} from '../face51.mjs';
import {makeChest51} from '../chest51.mjs';
import {chestFits51} from '../chest-fits51.mjs';
import {prepareDefinition,renderDefinitionView} from '../definition-model.mjs';
import {loadRig} from '../rig32.mjs';
const root=new URL('../',import.meta.url);
const [atlas,traces,fit]=await Promise.all(['atlas35','traces36','fit36'].map(async name=>JSON.parse(await readFile(new URL(name+'.json',root),'utf8'))));
const assets={atlas,traces,fit};await loadRig();
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const {id} of faceOptions50){
  const study=createFaceStudy50(id,assets),source=study.scene;
  const eye=candidateOrbit51(source,id,study.settings),draw=scene=>renderDefinitionView(study,scene,{size:128,yaw:45});
  assert.equal(source.parts[0].vertices.length,eye.parts[0].vertices.length);
  assert.notEqual(hash(draw(source).data),hash(draw(eye).data),id+' 안와 실제 출력');
  assert.strictEqual(candidateOrbit51(source,id,study.settings,'base'),source);
}
assert.equal(chestOptions50.length,89);
for(const option of chestOptions50){
  assert(Object.hasOwn(chestFits51,option.id),option.id+' 검토 누락');
}
for(const id of ['W',chestOptions50.find(o=>!chestFits51[o.id]).id]){
  const previous=await createChestStudy50(id,assets),revised=makeChest51(previous);
  assert.equal(revised.raw,previous.raw);
  const render=study=>renderDefinitionView(study,editChestStudy50(study,{version:'candidate'}),{size:128,yaw:-45});
  assert.equal(hash(render(revised).data)!==hash(render(previous).data),!!chestFits51[id]);
  const image=renderDefinitionView(revised,editChestStudy50(revised,{angle:178,pivot:'arms.raise',version:'candidate'}),{size:128,framing:'body'});
  assert(!image.metrics.clipped&&image.metrics.opaque>200);
}
let bodyHeight;
for(const sex of ['female','male'])for(let heads=2;heads<=8;heads++){
  const study=prepareDefinition(sex+'-'+heads,assets);
  const view=renderDefinitionView(study,study.scene,{size:128,framing:'body'});
  assert(!view.metrics.clipped);
  const height=view.metrics.bounds[3]-view.metrics.bounds[1];
  bodyHeight??=height;assert(Math.abs(bodyHeight-height)<=1,'14개 등신 표시 키');
}
console.log('51차 · 8안와 실제 45° 렌더·원형 보존, 89유형 검토 키, 178° 손·발 화면 내, 14전신 같은 표시 키');
