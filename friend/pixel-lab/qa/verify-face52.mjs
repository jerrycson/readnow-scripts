import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {candidateJawBand52} from '../face-jaw52.mjs';import {loadRig} from '../rig32.mjs';import {createFaceStudy50} from '../face-library50.mjs';import {cheekEnvelope50} from '../face-envelope50.mjs';import {renderDefinitionPair} from '../definition-model.mjs';
const root=new URL('../',import.meta.url),rd=f=>JSON.parse(fs.readFileSync(new URL(f+'.json',root),'utf8').replace(/^\uFEFF/,'')),data=rd('face-eval52'),hash=b=>createHash('sha256').update(b).digest('hex');
for(const[f,h]of Object.entries(data.files))assert.equal(hash(fs.readFileSync(new URL(f,root))),h);await loadRig();const s=createFaceStudy50('F02',{atlas:rd('atlas35'),fit:rd('fit36'),traces:rd('traces36')}),base=cheekEnvelope50(s.scene,'F02',s.model.reg.before,.85,true),before=renderDefinitionPair(s,base,{yaw:-90}),m=candidateJawBand52(base,'F02','normals'),after=renderDefinitionPair(s,m,{yaw:-90});
assert.equal(candidateJawBand52(base,'W'),base);assert.equal(candidateJawBand52(base,'F02','base'),base);
for(const[i,p]of base.parts.entries()){assert.equal(p.faces,m.parts[i].faces);for(const[j,v]of p.vertices.entries())assert.equal(v.p,m.parts[i].vertices[j].p);}
for(const [k,size]of [['pixel',48],['high',1024]]){let n=0,a=0;for(let i=0;i<before[k].data.length;i+=4){const p=before[k].data,q=after[k].data;if([0,1,2].some(k=>Math.abs(p[i+k]-q[i+k])>=8))n++;if(p[i+3]!==q[i+3])a++;}
 assert.equal(n,data.normalOnlyH2.all.find(v=>v.yaw===-90)[size].changed);assert.equal(a,0);console.log(size,n,'알파 동일');}
assert.equal(data.cases.F02_H2.variants.combined.frames[0].reverse[1],7);
assert.ok(data.cases.F02_H2.variants.normals.frames[0].band.p90<data.cases.F02_H2.variants.base.frames.find(v=>v.yaw===-90).band.p90);
assert.equal(data.views.length,3);console.log('H2 실제 화소, 원형 기준, 반례, 도판 지문 통과');

