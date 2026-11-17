import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {loadRig} from '../rig32.mjs';
import {createFaceStudy50} from '../face-library50.mjs';
import {candidateOrbit51,orbitCases51} from '../face51.mjs';
import {renderDefinitionPair} from '../definition-model.mjs';
const root=new URL('../',import.meta.url);
const read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8').replace(/^\uFEFF/,''));
const hash=data=>createHash('sha256').update(data).digest('hex');
const report=read('face-eval51.json'),notes=read('face-note51.json');
assert.equal(Object.keys(orbitCases51).length,8);assert.equal(notes.length,2);assert.equal(report.views.length,15);
assert.equal(report.views.filter(v=>v.priorUse==='이전 연구 검색 일치 없음').length,4);
// 측정 JSON은 불변. 기록 당시 바이트 지문과 별도의 LF 배포 지문을 연결한다.
const canonical=read('qa/face-source51.json');
for(const[f,h]of Object.entries(report.files)){const bytes=fs.readFileSync(new URL(f,root));if(/\.(?:mjs|js|json|html|css|md)$/.test(f)){assert.equal(canonical.files[f]?.recorded,h,f+' 원본 기록 연결');assert.equal(hash(bytes.toString('utf8').replaceAll('\r\n','\n')),canonical.files[f]?.lf,f+' LF 배포 지문');}else assert.equal(hash(bytes),h,f);}
const assets={atlas:read('atlas35.json'),traces:read('traces36.json'),fit:read('fit36.json')};
function delta(a,b){let changed=0,alpha=0;for(let i=0;i<a.data.length;i+=4){if(a.data[i+3]!==b.data[i+3])alpha++;if([0,1,2].some(k=>Math.abs(a.data[i+k]-b.data[i+k])>=8))changed++;}return{changed,alpha};}
await loadRig();
for(const id of Object.keys(orbitCases51)){
 const s=createFaceStudy50(id,assets),base=s.scene,r=report.cases[id];const actual=renderDefinitionPair(s,base);
 const model=candidateOrbit51(base,id,s.settings);assert.equal(candidateOrbit51(base,id,s.settings),model);
 assert.equal(candidateOrbit51(base,id,s.settings,'base'),base);assert.equal(candidateOrbit51(base,'W',s.settings),base);
 const restored=renderDefinitionPair(s,base),trial=renderDefinitionPair(s,model);
 assert.equal(hash(restored.high.data),hash(actual.high.data));assert.equal(hash(restored.pixel.data),hash(actual.pixel.data));
 assert.deepEqual(delta(actual.high,trial.high),r.renders[0][1024]);assert.deepEqual(delta(actual.pixel,trial.pixel),r.renders[0][48]);
 for(const k of ['rotated','added','zero','xy','others'])assert.equal(r.geometry[k],0,id+' '+k);
 assert.equal(r.renders.length,14);assert.ok(r.geometry.shared);
 assert.ok(r.shade.study<r.shade.base);
 assert.equal(report.handoff52.cases[id].strictUnderChinMax,0);
 console.log(id,'1024',r.renders[0][1024].changed,'48',r.renders[0][48].changed);
}
console.log('여덟 실제 원형 · 14방향 근거 · 15개 다른 원본 · 네 새 장면 · 기준 복원 통과');


