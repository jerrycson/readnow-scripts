import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rotationSamples,angles} from './rotation38.mjs';
import './face38.mjs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
execFileSync(process.execPath,[fileURLToPath(new URL('./chest38.mjs',import.meta.url))],{stdio:'inherit'});
const json=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const metrics=json('orbit38.json');
for(const row of await rotationSamples()){
  const recorded=metrics.find(r=>r.id===row.id);assert.deepEqual(recorded.yaw,angles);
  let total=0;
  for(const [i,image] of row.before.entries()){
    const next=row.after[i];assert.equal(image.width,48);assert.equal(next.width,48);
    let changed=0,visible=0;
    for(let k=0;k<image.data.length;k+=4){
      if(next.data[k+3])visible++;
      if([0,1,2,3].some(channel=>image.data[k+channel]!==next.data[k+channel]))changed++;
    }
    assert(visible>20,row.id+' 그림이 비었음');assert.equal(changed,recorded.changed[i],row.id+' 각도 '+angles[i]);total+=changed;
  }
  assert(total>0,row.id+' 48px에서 어느 방향에도 변화가 없음');
}
console.log('38차 · 3개 모델, 8시점의 원본 크기 전후 픽셀 재현');
