import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {DEFAULTS} from '../model.mjs';
import {face36} from '../contour-model36.mjs';
import {correctFernChin} from '../chin37.mjs';
import {face38} from '../face38.mjs';
import {jaw39,jaw39Cases} from '../jaw39.mjs';
import {renderPixels} from '../renderer.mjs';
const read=file=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const data=read('face-eval39.json'),traces=read('traces36.json').faces,atlas=read('atlas35.json').faces;
await loadRig();
for(const id of Object.keys(jaw39Cases)){
 const ref=traces[id],s={...DEFAULTS,heads:8,designStyle:'manga',sex:id==='F02'?'female':'male',resolution:128};
 const model=face36(s,atlas.find(a=>a.id===id),ref),prev=id==='F02'?correctFernChin(model.after,id,model,ref,.75):model.after;
 const base=face38(prev,id,model,ref),vertices=base.parts[0].vertices,original=vertices.map(v=>[...v.p,...v.n]);
 const now=jaw39(base,id,model),next=now.parts[0].vertices,metrics=data.cases[id];let changed=0;
 assert.equal(jaw39(base,'F03',model),base);
 assert.equal(metrics.status,jaw39Cases[id].status);
 base.parts.forEach((part,i)=>{
  assert.equal(part.faces,now.parts[i].faces);
  assert.equal(part.mat,now.parts[i].mat);
  if(part.vertices===vertices)assert.equal(now.parts[i].vertices,next);
  else assert.equal(now.parts[i],part);
 });
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=next[i];assert.deepEqual([...a.p,...a.n],original[i]);assert.equal(a.p,b.p);
  if(Math.hypot(...a.n.map((v,k)=>v-b.n[k]))>1e-8){changed++;assert(Math.abs(Math.hypot(...b.n)-1)<1e-12);}
 }
 assert.equal(changed,metrics.sceneDiff.normalChanges);assert(changed>0);
 const {geometry,holdouts}=metrics;
 for(const name of ['frontPx','sideMae','obliques'])assert.deepEqual(geometry.before[name],geometry.after[name]);
 for(const [camera,expected] of Object.entries(holdouts)){
  const [yaw,pitch]=camera.split('/').map(Number);
  const images=[base,now].map(sceneOverride=>renderPixels(s,{sceneOverride,yaw,pitch,freeOrbit:true,studyResolution:256,portrait:'face'}).data);
  const hashes=images.map(a=>createHash('sha256').update(a).digest('hex'));
  assert.deepEqual(hashes,expected.renderSha256,id+' '+camera);
  assert.notEqual(hashes[0],hashes[1]);
  for(let i=3;i<images[0].length;i+=4)assert.equal(images[0][i],images[1][i]);
 }
 const check=holdouts['-105/18'];assert.equal(check.after.brightTop10<check.before.brightTop10,id==='F02');
 console.log(id,'법선 '+changed+'개, 중립 입력·피부 좌표·삼각형 동일, 추가 카메라 두 곳 렌더 및 실루엣 확인');
}
