import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadRig} from '../rig32.mjs';
import {createFaceStudy50,faceOptions50} from '../face-library50.mjs';
import {candidateFace54} from '../face54.mjs';
import {renderDefinitionView} from '../definition-model.mjs';
const root=new URL('../',import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,root),'utf8').replace(/^\uFEFF/,''));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const assets={atlas:read('atlas35.json'),traces:read('traces36.json'),fit:read('fit36.json')};
const report=read('face-eval54.json');
const requested=process.argv.slice(2);
await loadRig();
for(const [file,sig]of Object.entries(report.files)){
 const bytes=fs.readFileSync(new URL(file,root));
 const source=file.endsWith('.mjs')?Buffer.from(bytes.toString('utf8').replaceAll('\r\n','\n'),'utf8'):bytes;
 assert.equal(sha(source),sig,file);
}
assert.equal(report.sources.length,42);
for(const {id}of faceOptions50.filter(q=>!requested.length||requested.includes(q.id))){
 const s=createFaceStudy50(id,assets),base=s.scene,data=report.cases[id];
 const m=candidateFace54(base,id,s.settings);
 assert.equal(m===base,data.same);
 assert.equal(candidateFace54(base,id,{...s.settings}),m);
 assert.equal(candidateFace54(base,id,s.settings,'source'),base);
 assert.equal(data.renders.length,12);
 for(let j=0;j<base.parts.length;j++){
  const b=base.parts[j],q=m.parts[j];
  assert.equal(b.faces,q.faces);assert.equal(b.vertices.length,q.vertices.length);
  for(let i=0;i<b.vertices.length;i++){
   assert.ok(q.vertices[i].p.every(Number.isFinite)&&q.vertices[i].n.every(Number.isFinite));
   if(b.vertices[i].p[1]<base.landmarks.chin[1]-.25){
    assert.deepEqual(b.vertices[i].p,q.vertices[i].p);assert.deepEqual(b.vertices[i].n,q.vertices[i].n);
   }
  }
 }
 for(const row of data.renders)for(const size of [48,96,1024]){
   const view={yaw:row.yaw,pitch:row.pitch,size,framing:'face'};
   const original=renderDefinitionView(s,base,view);
   assert.equal(sha(original.data),row[size].base,id+' 기준 '+JSON.stringify(view));
   const trial=renderDefinitionView(s,m,view);
   assert.equal(sha(trial.data),row[size].study,id+' 시안 '+JSON.stringify(view));
 }
 if(!data.same){
  assert.equal(data.episodes.length,2);assert.ok(data.episodes.every(e=>e.results.length===9));
  assert.equal(data.geometry.created,0);assert.equal(data.geometry.zero,0);
  assert.ok(data.episodes[0].results[4].models.study.jaw<data.episodes[0].results[4].models.prior.jaw);
  assert.ok(data.episodes[1].results[4].models.study.mouth>data.episodes[1].results[4].models.base.mouth);
 }
 console.log(id,'12방향 × 3해상도 × 전후, 하부 보존 및 복원 확인');
}
