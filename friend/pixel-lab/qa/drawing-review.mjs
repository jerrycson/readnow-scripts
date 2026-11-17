import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareDrawingPixels,reviewDrawingCandidate} from '../drawing-review.mjs';
const frame=data=>({width:2,height:1,data:Uint8ClampedArray.from(data)});
const base=frame([50,50,50,255,0,0,0,0]);
assert.deepEqual(compareDrawingPixels(base,base),{changed:0,silhouette:0});
assert.deepEqual(compareDrawingPixels(base,frame([57,50,50,255,0,0,0,255])),{changed:1,silhouette:1});
assert.throws(()=>compareDrawingPixels(base,{height:1,width:2,data:[]}));
const trial={observations:[
  {view:'정면',metric:'눈꺼풀',baseline:2,candidate:1.5,units:'px'},
  {view:'사선',metric:'눈꺼풀',baseline:1,candidate:1.01,uncertainty:.02,units:'px'}
],meshFlips:0,comparisonViews:10,unseen:true};
assert.equal(reviewDrawingCandidate(trial).status,'전방위 그림 검토');
assert.equal(reviewDrawingCandidate({...trial,unseen:false}).status,'검증 근거 보완');
assert.equal(reviewDrawingCandidate({...trial,meshFlips:1}).status,'검증 근거 보완');
assert.equal(reviewDrawingCandidate({...trial,observations:trial.observations.map(r=>({...r,visible:false}))}).measured,0);
const records=JSON.parse(await readFile(new URL('../../research/modeling-methods/trials.json',import.meta.url))).analysis;
for(const [subject,rows] of Object.entries(records)){
  for(const row of rows){
    const assessed=reviewDrawingCandidate(row.reviewInput);
    assert.equal(assessed.measured,subject==='M01'?21:subject==='F02'?18:8);
    assert.equal(assessed.worse.length,row.lostConditions);
  }
}
console.log('9개 실측 후보의 악화 재현 · 가림, 판독 오차, 별도 원본, 접힘, 그림 크기 검사 통과');
