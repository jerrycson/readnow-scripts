import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {createFaceStudy50} from '../face-library50.mjs';
import {form34} from '../bust34.mjs';
import {candidateFace53} from '../face53.mjs';
import {renderDefinitionView} from '../definition-model.mjs';

const root = new URL('../',import.meta.url);
const read = name => JSON.parse(fs.readFileSync(new URL(name,root),'utf8').replace(/^\uFEFF/,''));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = read('face-eval53.json');
const assets = {atlas:read('atlas35.json'),traces:read('traces36.json'),fit:read('fit36.json')};
const notes = read('face-note53.json');
assert.equal(notes.length,2);
for(const [filename,expected] of Object.entries(report.files)){
  assert.equal(hash(fs.readFileSync(new URL(filename,root))),expected,filename);
}
function delta(a,b){
  let rgb8=0,alpha=0;
  for(let i=0;i<a.length;i+=4){
    if(a[i+3]!==b[i+3])alpha++;
    if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>=8)rgb8++;
  }
  return {rgb8,alpha};
}
await loadRig();
for(const id of ['F02','M01']){
  const family=createFaceStudy50(id,assets), base=family.scene, s=family.settings;
  const draw=(scene,yaw,pitch,size)=>renderDefinitionView(family,scene,{yaw,pitch,size,framing:'face'}).data;
  const basePixels=hash(draw(base,0,0,1024));
  const model=candidateFace53(base,id,s), field=candidateFace53(base,id,s,'field');
  assert.equal(candidateFace53(base,id,s),model);
  assert.equal(candidateFace53(base,id,{...s}),model);
  assert.equal(candidateFace53(base,id,s,'base'),base);
  assert.equal(candidateFace53(base,'M03',s),base);
  assert.notEqual(model,field);
  assert.throws(()=>candidateFace53(base,id,s,'unknown'),RangeError);
  const ref=form34(s);
  const byRef=candidateFace53(base,id,ref);
  assert.equal(candidateFace53(base,id,ref),byRef);
  assert.equal(hash(draw(model,45,0,96)),hash(draw(byRef,45,0,96)));
  assert.equal(model.parts.length,base.parts.length);
  let maxLip=0;
  for(let j=0;j<base.parts.length;j++){
    const old=base.parts[j], part=model.parts[j];
    assert.equal(part.faces,old.faces);
    assert.equal(part.vertices.length,old.vertices.length);
    for(let i=0;i<old.vertices.length;i++){
      const original=old.vertices[i], now=part.vertices[i];
      assert.ok(now.p.every(Number.isFinite)&&now.n.every(Number.isFinite));
      if(original.p[1]<base.landmarks.chin[1]-.25){
        assert.deepEqual(now.p,original.p);
        assert.deepEqual(now.n,original.n);
      }
      if(/^(upper-lip34|lower-lip34|mouth-line34)$/.test(part.name)){
        maxLip=Math.max(maxLip,Math.abs(now.p[2]-field.parts[j].vertices[i].p[2]));
      }
    }
  }
  assert.ok(maxLip<.03,id+' 입술 뒤피부 관통');
  const result=report.cases[id];
  assert.equal(result.sources.length,7);
  assert.equal(result.renders.length,12);
  for(const view of result.renders){
    for(const size of [48,96,1024]){
      assert.deepEqual(delta(draw(base,view.yaw,view.pitch,size),draw(model,view.yaw,view.pitch,size)),view[size],id+' '+view.yaw+'/'+view.pitch+' '+size);
    }
  }
  const final=result.sources.at(-1);
  assert.ok(final.study.jaw>final.base.jaw);
  assert.equal(result.cameraSensitivity.length,9);
  assert.ok(result.cameraSensitivity.every(v=>v.study>v.base));
  assert.equal(basePixels,hash(draw(candidateFace53(base,id,s,'base'),0,0,1024)));
  console.log(id,'7개 원전·12방향·3해상도, 설정 복사/기준 복원, 입술 최대 깊이 차',maxLip.toFixed(6));
}

