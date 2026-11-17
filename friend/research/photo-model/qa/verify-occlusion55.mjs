import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash}from 'node:crypto';
import {fitPair,compareSides,renderFit,restoreShot,coverage,size} from '../partial-hull55.mjs';
import {sampleShots} from '../occlusion-sample55.mjs';
import {reconstruct,extent} from '../../../pixel-lab/hull36.mjs';
globalThis.ImageData??=class {constructor(data,width,height){Object.assign(this,{data,width,height});}};
const head=JSON.parse(fs.readFileSync(new URL('../../../pixel-lab/head36.json',import.meta.url))).meshes[0];
const digest=x=>createHash('sha256').update(JSON.stringify([x.v,x.f])).digest('hex');
const makeBand=(side,first,last,active=true)=>({side,first,last,active});
const results={};
for(const who of ['face','torso']){
 const shots=sampleShots(who,head),s=shots[2],raw=new Uint8Array(s.mask),ref=fitPair(shots),baseline=digest(ref.all.mesh);
 const old=reconstruct(shots.slice(0,5).map(s=>({...s,rows:extent(s.mask)})));
 assert.equal(digest(ref.observed.mesh),baseline);assert.equal(digest(old),baseline);
 s.visibility55.bands=[makeBand('left',43,68)];const corrected=fitPair(shots);
 assert.notEqual(digest(corrected.observed.mesh),baseline);
 assert.equal(digest(corrected.all.mesh),baseline);assert.deepEqual(raw,s.mask);
 const altered=structuredClone(shots);for(let y=43;y<=68;y++){const r=extent(altered[2].mask)[y];if(r)altered[2].mask.fill(0,y*size+r[0],y*size+Math.min(r[0]+6,r[1]));}
 assert.equal(digest(fitPair(altered).observed.mesh),digest(corrected.observed.mesh));
 const test=shots.map(view=>{
  const before=compareSides(view,renderFit(ref.all.mesh,view));
  const after=compareSides(view,renderFit(corrected.observed.mesh,view));
  assert.equal(before.count,after.count);return {yaw:view.yaw,pitch:view.pitch,role:view.role,observed:after.count,hidden:after.hidden,before:before.error,after:after.error};
 });
 const truth=sampleShots(who,head,false)[2];
 truth.visibility55.bands=[makeBand('both',0,42),makeBand('right',43,68),makeBand('both',69,127)];
 const cleanSide={before:compareSides(truth,renderFit(ref.all.mesh,truth)),after:compareSides(truth,renderFit(corrected.observed.mesh,truth))};
 assert.equal(cleanSide.before.count,26);assert.equal(cleanSide.after.count,26);
 assert.equal(test[2].hidden,26);assert.equal(test[2].observed+26,compareSides({...s,visibility55:undefined},renderFit(old,s)).count);
 s.visibility55.bands.push(makeBand('right',57,72),makeBand('both',30,33));const bits=coverage(s);
 assert.equal(bits[56],2);assert.equal(bits[60],0);assert.equal(bits[70],1);assert.equal(bits[31],0);
 s.visibility55.enabled=false;
 assert.equal(compareSides(s,renderFit(old,s)).count,0);
 const without=fitPair(shots).observed.mesh;s.mask.fill(0);assert.equal(digest(fitPair(shots).observed.mesh),digest(without));s.mask.set(raw);
 s.visibility55.enabled=true;s.visibility55.bands.forEach(v=>v.active=false);assert.equal(digest(fitPair(shots).observed.mesh),baseline);
 const notSeen=structuredClone(shots);notSeen[5].mask.fill(0);notSeen[6].mask.fill(0);assert.equal(digest(fitPair(notSeen).observed.mesh),baseline);
 const angled=structuredClone(shots);angled[2].pitch=20;assert.equal(digest(fitPair(angled).observed.mesh),digest(without));
 const oldShot=restoreShot({...s,visibility55:undefined,pitch:undefined,role:undefined},2);assert.equal(coverage(oldShot)[60],3);
 for(const v of shots)v.visibility55.bands=[makeBand('both',43,68)];
 assert.equal(fitPair(shots).observed.mesh,null);
 assert.throws(()=>coverage({...s,visibility55:{enabled:true,bands:[makeBand('left',78,32)]}}));
 results[who]={triangles:old.f.length/3,baselineHash:baseline,correctedHash:digest(corrected.observed.mesh),cleanSide,test};
}
if(process.argv.includes('--summary')){
 const rows=[];
 for(const [subject,r] of Object.entries(results)){
  rows.push({id:subject+'-masked-side',subject,condition:'같은 입력 사진의 손실 전 왼쪽 26점',role:'paired-control',yaw:90,pitch:0,
   count:r.cleanSide.after.count,before:r.cleanSide.before.error,after:r.cleanSide.after.error});
  for(const t of r.test.filter(s=>s.role==='check'))rows.push({id:subject+'-held-'+t.yaw+'-'+t.pitch,subject,
   condition:'같은 대상의 생성 미사용 정사영',role:'held-view',yaw:t.yaw,pitch:t.pitch,count:t.observed,before:t.before,after:t.after});
 }
 console.log(JSON.stringify({round:55,units:'px@128',metric:'같은 원본 표식에서 좌우 경계의 절대 가로 거리 평균. 작을수록 가까움.',
  input:'고정 정사영 0·45·90·135·180°, 90° 사진 왼쪽 43~68행을 11px 가림. 교정은 손상된 쪽만 제외.',
  limitations:'얼굴은 실측 한 사람의 같은 메시를 투영한 통제 실험, 흉부는 합성 한 외피. 새 사람이나 독립 촬영·사람 채택 없음.',
  decision:'수동 비교·복원. 자동 채택 없음.',rows},null,2));
}else console.log(JSON.stringify(results,null,2));
