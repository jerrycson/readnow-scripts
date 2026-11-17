import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initial,validatePreset} from '../studio-sculpt-settings.mjs';
import {preferenceScore} from '../studio-preference45.mjs';
import {publicCase,sameCase} from '../studio-case-wire45.mjs';
const id='00000000-1111-2222-3333-444444444444';
const base={id,episode:id,at:'2026-11-17T00:00:00.000Z',task:'surface',subject:'F02',method:'learned',outcome:'accepted',unit:'px',metricBefore:2,metricAfter:.1,zone:'chin'};
assert.equal(publicCase({...base,outcome:'observed'}),null);assert.deepEqual(publicCase({...base,unknown:'extra'}),base);assert(sameCase(base,publicCase(base)));
const rows=Array.from({length:4},(_,i)=>({...base,episode:id.slice(0,-1)+i}));
const rated=preferenceScore(rows);assert.equal(rated.pairs,4);assert(Number.isFinite(rated.candidateBrier));
assert.equal(preferenceScore([...rows,{...rows[0],at:'2026-11-17T00:01:00.000Z',outcome:'reverted'}]).pairs,4);
for(const subject of ['F02','M01','W'])for(const pitch of [-179,-90,0,135,180]){const p=initial(subject);p.view.pitch=pitch;assert.equal(validatePreset(p).view.pitch,pitch);}
const note=JSON.parse(await readFile(new URL('../sync-note45.json',import.meta.url)))[0];assert(note.detail.length>=1050&&note.sources.length>=3);
console.log('선택 예측·독립 세션·수치만 동기화·뒤집힌 시점 설정 검증 완료');
