import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {correctFernChin,underside} from '../chin37.mjs';
import {face36} from '../contour-model36.mjs';
import {correctCitation} from '../citation37.mjs';
import {loadRig} from '../rig32.mjs';
import {DEFAULTS} from '../model.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const points=read('traces36.json'),atlas=read('atlas35.json'),metrics=read('chin-check37.json'),poses=read('oblique37.json'),projected=read('projected37.json');
await loadRig();const id='F02',ref=points.faces[id],r=atlas.faces.find(v=>v.id===id),s={...DEFAULTS,sex:'female',heads:8,designStyle:'manga'};
const m=face36(s,r,ref),base=m.after,after=correctFernChin(base,id,m,ref,.75),expected=metrics.variants.find(v=>v.strength===.75);
const low=ref.side.filter(p=>p[1]>=m.frame.side.y-3);
function difference(scene){const candidate=underside(scene,m,ref);return low.reduce((sum,p)=>sum+Math.min(...candidate.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1]))),0)/low.length;}
const a=difference(base),b=difference(after);assert(Math.abs(a-metrics.original.bottom)<.001&&Math.abs(b-expected.bottom)<.001&&b<a);
const old=base.parts[0].vertices,now=after.parts[0].vertices;let changed=0;
old.forEach((v,i)=>{const u=now[i].p;if(v.p.some((x,j)=>x!==u[j])){changed++;assert(Math.abs(v.p[1]-base.landmarks.chin[1])<=.12);assert(v.p[0]===u[0]&&v.p[2]===u[2]);}});assert.equal(changed,expected.numberMoved);
assert.equal(correctFernChin(base,'M01',m,ref,.75),base);assert.equal(expected.faces.flipped,0);
assert.equal(projected.views.length,4);assert.equal(poses.rows.length,4);
for(const row of projected.views){assert(row.visible35.length>10&&row.visible36.length>10&&row.handSegments.length>0);assert(row.visible36.flat().every(Number.isFinite));}
const prior=read('notes36.json').find(r=>r.noteId==='36-duct');assert(prior.detail.includes('Hassiotou'));assert(correctCitation(prior).detail.includes('Javed와 Lteif'));
console.log('37차 · 측면 턱밑 '+a.toFixed(3)+' → '+b.toFixed(3)+'px, '+changed+'개 국소 정점, 사선 4작화 확인.');
