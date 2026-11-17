import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {DEFAULTS} from '../model.mjs';
import {face36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {jaw39} from '../jaw39.mjs';
import {eye40,eye40Cases} from '../eye40.mjs';
import {portraitPixels} from '../portrait48.mjs';
const read=f=>JSON.parse(readFileSync(new URL('../'+f,import.meta.url)));
const atlas=read('atlas35.json').faces,refs=read('traces36.json').faces,data=read('face-eval40.json');
function geometryFingerprint(scene){
 const seen=new Set(),hash=createHash('sha256');
 for(const m of scene.parts){
  if(seen.has(m.vertices))continue;seen.add(m.vertices);
  const buf=new Float64Array(m.vertices.length*6);m.vertices.forEach((v,i)=>buf.set([...v.p,...v.n],i*6));hash.update(new Uint8Array(buf.buffer));
 }
 return hash.digest('hex');
}
// Transcendental functions can differ in their last bits across JS runtimes.
// Quantize only this cross-runtime fingerprint. The exact renderer and pixel tests run below.
function portableGeometry(scene){
 const seen=new Set(),hash=createHash('sha256');
 for(const part of scene.parts){
   if(seen.has(part.vertices))continue;seen.add(part.vertices);
   const bytes=Buffer.alloc(part.vertices.length*24);
   part.vertices.forEach((v,i)=>[...v.p,...v.n].forEach((value,j)=>{
     bytes.writeInt32LE(Math.round(value*1e6+0.0001),i*24+j*4);
   }));
   hash.update(bytes);
 }
 return hash.digest('hex');
}
function difference(a,b){
 let count=0;for(let i=0;i<a.length;i+=4)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>=8)count++;
 return count;
}
await loadRig();assert.equal(data.views.length,8);
for(const id of ['F02','M01']){
 const ref=refs[id],s={...DEFAULTS,heads:8,designStyle:'manga',sex:id==='F02'?'female':'male',resolution:128};
 const model=face36(s,atlas.find(v=>v.id===id),ref),s37=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
 const sc=jaw39(face38(s37,id,model,ref),id,model),fingerprint=geometryFingerprint(sc),next=eye40(sc,id),record=data.cases[id],chin=sc.landmarks.chin[1];
 assert.equal(geometryFingerprint(sc),fingerprint);
 const portable={"F02":"d124061298ed4c7d4d6e59c68bd2aa4ae3b71826a922bb36a0401821cf18f7e1","M01":"f080e00781ec1a9e5f5afe3552591559fba7da3914b094950aaf7e0b5b340ad1"};
 assert.equal(portableGeometry(next),portable[id]);
 assert.strictEqual(eye40(sc,'F03'),sc);assert.equal(eye40Cases[id].strength,record.strength);
 assert(sc.parts.every((m,i)=>m.faces===next.parts[i].faces));
 assert(sc.parts[0].vertices.every((v,i)=>v.p[1]>=chin+.29||v===next.parts[0].vertices[i]));
 assert.equal(record.shapeB.flipped,0);assert(record.shapeB.minArea>=.27&&record.shapeB.minCos>=.23);assert(record.jawChecks.every(v=>v.changedPixels===0));
 const own=data.views.filter(v=>v.id===id);assert.deepEqual(own.map(v=>v.imageNumber),[1,2,3,4]);
 assert.equal(own[2].sourceEyes[0],null);assert.equal(own[2].visible40[0],null);
 for(const v of own)for(const eye of v.visible40.filter(Boolean)){
  assert(eye.upper.every(p=>p.every(Number.isFinite)));assert(eye.lower.every(p=>p.every(Number.isFinite)));
 }
 for(const yaw of [0,-45,45,-90,90])for(const size of [48,192]){
  const settings={...s,resolution:size===48?48:128},options={portrait:'face',yaw,pitch:0,freeOrbit:true,...(size===192?{studyResolution:192}:{})};
  const render=sceneOverride=>portraitPixels(settings,{...options,sceneOverride}).data;
  const before=render(sc),after=render(next),e=record.native[yaw][size];
  assert.equal(before.length,size*size*4);
  assert.deepEqual(before.subarray(4*size*Math.ceil(size*.70)),after.subarray(4*size*Math.ceil(size*.70)));
  for(const [i,side] of [-1,1].entries()){
   const without=scene=>({...scene,parts:scene.parts.filter(p=>!(['eye34','lid34','lower-lid34'].includes(p.name)&&Math.sign(p.vertices.reduce((s,v)=>s+v.p[0],0))===side))});
   assert.equal(difference(before,render(without(sc))),e.before.eyes[i].count);
   assert.equal(difference(after,render(without(next))),e.after.eyes[i].count);
  }
 }
 console.log(id,'준비한 B 모델 지문, 반대 눈 가림, 48·192 실제 렌더 5개 수평 각도 및 화면 아래 30% 검증');
}
