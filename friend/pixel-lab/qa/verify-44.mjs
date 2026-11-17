import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {checked} from '../studio-evidence44.mjs';import {evaluate} from '../studio-learning44.mjs';
const lab=new URL('../',import.meta.url),read=async path=>JSON.parse(await readFile(new URL(path,lab),'utf8'));
const records=await read('studio-training44.json'),report=evaluate(records);
assert.equal(report.eligible,false);assert.equal(report.observations,11);assert.equal(report.episodes,7);assert.equal(report.worseEpisodes,1);
assert.ok(report.candidateMAE<report.baselineMAE);
const clean=checked({task:'sculpt-target44',method:'ridge-inverse44',subject:'F02',outcome:'held',unit:'px@192',metricBefore:1,metricAfter:.5,zone:'chin',yaw:45,pitch:0,rawImage:'must be excluded'});assert.equal(clean.method,'learned');assert.equal(clean.outcome,'deferred');assert.equal(clean.zone,'chin');assert.ok(!Object.hasOwn(clean,'rawImage'));
for(const file of ['studio-note44.json','sculpt-note44.json','photo-note44.json']){for(const card of await read(file))assert.ok(card.line&&card.unit.length>100&&card.detail.length>750&&card.url);}
const p=await read('photo-eval44.json'),s=await read('studio-sculpt-eval44.json');
assert.ok(p.groups.scanClean.held.after.boundaryPx<p.groups.scanClean.held.before.boundaryPx);assert.ok(p.groups.scanTiltedBox.held.after.boundaryPx>p.groups.scanTiltedBox.held.before.boundaryPx);assert.ok(s.offered.learned<s.offered.direct&&s.stress['구역 전체 보류'].learned>s.stress['구역 전체 보류'].direct);
console.log('사진과 표면 추천의 개선·악화 반례, 공개 사례와 독립 7묶음, 이벤트 정규화 확인');