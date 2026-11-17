import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareDefinition,definitionScene,renderDefinitionView} from '../definition-model.mjs';
import {createFaceStudy50,faceOptions50} from '../face-library50.mjs';
import {cheekEnvelope50} from '../face-envelope50.mjs';
import {chestOptions50,createChestStudy50,editChestStudy50} from '../chest-types50.mjs';
import {isWorkbenchSubject} from '../workbench-subjects50.mjs';
import {loadRig} from '../rig32.mjs';
const root=new URL('../',import.meta.url);
const read=async n=>JSON.parse(await readFile(new URL(n+'.json',root),'utf8'));
const [atlas,traces,fit]=await Promise.all(['atlas35','traces36','fit36'].map(read));
const assets={atlas,traces,fit};await loadRig();
const hash=d=>createHash('sha256').update(d).digest('hex');
const frame=(study,scene,yaw=0,size=48)=>renderDefinitionView(study,scene,{size,yaw});
assert.equal(new Set(chestOptions50.map(o=>o.id)).size,chestOptions50.length);
assert.equal(chestOptions50.length,89);assert.equal(faceOptions50.length,8);
for(const o of [...faceOptions50,...chestOptions50])assert(isWorkbenchSubject(o.id));
for(const invalid of ['../../', 'face:W','atlas:B00','__proto__',null])assert(!isWorkbenchSubject(invalid));
const nativeHashes=new Set();
for(const o of faceOptions50){
  const s=createFaceStudy50(o.id,assets);
  nativeHashes.add(hash(frame(s,s.scene,-45,512).data));
}
assert.equal(nativeHashes.size,8);
const fern=prepareDefinition('F02',assets),base=definitionScene(fern);
const candidate=cheekEnvelope50(fern.model.round49,'F02',fern.model.reg.before,.85,true);
assert.notEqual(hash(frame(fern,base,0,1024).data),hash(frame(fern,candidate,0,1024).data));
const baseline=prepareDefinition('W',assets),w=createChestStudy50('W',assets);
const actualW=await w;
for(const yaw of [0,-45,90]){
  const old=frame(baseline,definitionScene(baseline),yaw,512);
  const current=frame(actualW,editChestStudy50(actualW,{version:'source'}),yaw,512);
  assert.equal(hash(current.data),hash(old.data),'49차 보존 W '+yaw);
}
for(const id of ['W','paper:B09','review:B09','atlas:B09','form34:shallow','morph33:1','design:compact','sculpt:0']){
  const s=await createChestStudy50(id,assets);
  const one=frame(s,editChestStudy50(s,{version:'source'}),-45,96);
  const two=frame(s,editChestStudy50(s,{version:'candidate',angle:120,pivot:'arms.raise'}),-45,96);
  assert(one.data.some((v,i)=>i%4===3&&v));assert.notEqual(hash(one.data),hash(two.data),id);
}
console.log('50차 · 얼굴 여덟 형상, 몸통 89개 선택, 이전 W 원본 지문, 여덟 계열 실제 자세 검증');
