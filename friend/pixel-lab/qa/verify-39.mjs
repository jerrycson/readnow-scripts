import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {makeSamples} from './samples39.mjs';
import './face39.mjs';
execFileSync(process.execPath,[fileURLToPath(new URL('./chest39.mjs',import.meta.url))],{stdio:'inherit'});
const expected=JSON.parse(readFileSync(new URL('../samples39.json',import.meta.url)));
for(const row of await makeSamples()){
  for(const [index,frames] of [row.before,row.after].entries()){
    assert.deepEqual(frames.map(f=>createHash('sha256').update(f.data).digest('hex')),expected[row.id][index]);
    assert(frames.every(frame=>frame.width===192&&frame.height===192));
  }
  assert(row.before.every((frame,i)=>expected[row.id][0][i]!==expected[row.id][1][i]));
  if(row.id==='W')continue;
  for(const [i,frame] of row.before.entries()){
    const next=row.after[i];
    for(let k=3;k<frame.data.length;k+=4)assert.equal(frame.data[k],next.data[k]);
  }
}
console.log('39차 보고서의 24프레임 재현 및 얼굴 실루엣 동일');
