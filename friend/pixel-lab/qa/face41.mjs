import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
const dir=new URL('.',import.meta.url),research=existsSync(new URL('himmel41.mjs',dir));
const lab=research?new URL('../../클라우드 작업/readnow-scripts/friend/pixel-lab/',dir):new URL('../',dir),assets=research?dir:lab;
const module=name=>import(new URL(name,lab));
const [{loadRig},{DEFAULTS},{face36},{face38},{jaw39},{portraitPixels}]=await Promise.all(
 ['rig32.mjs','model.mjs','contour-model36.mjs','face38.mjs','jaw39.mjs','portrait48.mjs'].map(module));
const {himmel41,himmel41Contact}=await import(new URL('himmel41.mjs',assets));
const read=(name,root=lab)=>JSON.parse(readFileSync(new URL(name,root)));
const rec=read('atlas35.json').faces.find(v=>v.id==='M01'),ref=read('traces36.json').faces.M01,metrics=read('face-eval41.json',assets);
await loadRig();const s={...DEFAULTS,heads:8,designStyle:'manga',sex:'male',resolution:128},model=face36(s,rec,ref);
const scene=jaw39(face38(model.after,'M01',model,ref),'M01',model),geometry=sc=>{
 const hash=createHash('sha256'),seen=new Set();
 for(const p of sc.parts){if(seen.has(p.vertices))continue;seen.add(p.vertices);
  const a=new Float64Array(6*p.vertices.length);p.vertices.forEach((v,i)=>a.set([...v.p,...v.n],i*6));hash.update(new Uint8Array(a.buffer));}
 return hash.digest('hex');
};
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
const old=geometry(scene),after=himmel41(scene,'M01'),contact=himmel41Contact(scene,'M01');
assert.equal(portableGeometry(after),metrics.portableGeometrySha);assert.equal(geometry(scene),old);
assert.strictEqual(himmel41(scene,'F02'),scene);assert.strictEqual(himmel41Contact(scene,'F02'),scene);
const allowed=new Set(['eye34','lid34','lower-lid34','brow34']);
scene.parts.forEach((p,i)=>{for(const sc of [after,contact]){
 const q=sc.parts[i];assert.equal(q.mat,p.mat);assert.strictEqual(q.faces,p.faces);
 if(!allowed.has(p.name))assert.strictEqual(q,p);
 else q.vertices.forEach(v=>assert(Math.abs(Math.hypot(...v.n)-1)<1e-9&&v.p.every(Number.isFinite)));
}});
assert(metrics.geometry.safe&&metrics.contact.shape.safe);assert(metrics.bodyUnchanged??metrics.skinVerticesUnchanged);
assert.equal(metrics.views.length,6);assert.equal(metrics.views[4].sourceSize[0],800);
assert.deepEqual(metrics.views[3].oldCam39.eyes.map(e=>e.raw.width),[32,5]);
assert(metrics.views[5].after.errors[1].width>metrics.views[5].before.errors[1].width);
for(const r of metrics.native){
 const ss={...s,resolution:r.size===48?48:128},options={portrait:'face',yaw:r.yaw,pitch:r.pitch,freeOrbit:true,...(r.size===48?{}:{studyResolution:r.size})};
 const render=sceneOverride=>portraitPixels(ss,{...options,sceneOverride}).data;
 const counts=[scene,after].map(sc=>{
  const full=render(sc);return [-1,1].map(side=>{
   const filtered={...sc,parts:sc.parts.filter(p=>!(['eye34','lid34','lower-lid34'].includes(p.name)&&Math.sign(p.vertices[0].p[0])===side))};
   const removed=render(filtered);let n=0;
   for(let k=0;k<full.length;k+=4)if([0,1,2].some(t=>Math.abs(full[k+t]-removed[k+t])>=8))n++;
   return n;
  });
 });assert.deepEqual(counts,r.counts);
}
console.log('힘멜 41차 모델 지문, 고정 피부·재질·위상, 두 공식 새 장면, 7개 자세의 48·192픽셀 가시 눈 검증');
