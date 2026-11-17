import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {random,syntheticHead,ringSupport} from '../../pixel-lab/qa/photo-heads44.mjs';
import {supportFeatures,cornerSupport,inferSupport} from '../../pixel-lab/photo-support44.mjs';
import {MODEL_VERSION,weights as shipped} from '../../pixel-lab/photo-weights44.mjs';

// 기존 44차 학습 입력의 생성 순서를 유지한다. 한 두상의 모든 단면은 같은 폴드에 둔다.
const seed=441031,rng=random(seed),headCount=96,levels=24,foldCount=4,scale=128*.797,lambda=.01;
const heads=Array.from({length:headCount},(_,index)=>{
  const id=Math.floor(rng()*2**32),head=syntheticHead(id),sections=[];
  for(let j=0;j<levels;j++){
    const points=head((.5-(j+.5)/levels)*.95),turn=(rng()-.5)*.32;
    const clean=Array.from({length:32},(_,k)=>ringSupport(points,turn+k*Math.PI/16));
    const grid=85+rng()*25,phase=rng();
    const s=Array.from({length:8},(_,i)=>(Math.round(clean[4*i]*grid+phase)-phase)/grid);
    sections.push({s,clean});
  }
  return {id,index,fold:index%foldCount,sections};
});
function solve(matrix){
  // 벌점이 더해진 대칭 양의 정부호 정규방정식을 가우스 소거로 푼다.
  for(let i=0;i<5;i++)matrix[i][i]+=lambda;
  for(let i=0;i<5;i++){
    const p=matrix[i][i];assert(p>1e-9);
    for(let k=i;k<6;k++)matrix[i][k]/=p;
    for(let a=0;a<5;a++)if(i!==a){
      const multiplier=matrix[a][i];
      for(let k=i;k<6;k++)matrix[a][k]-=multiplier*matrix[i][k];
    }
  }
  return matrix.map(row=>row[5]);
}
function fit(training){
  const matrices=Array.from({length:3},()=>Array.from({length:5},()=>Array(6).fill(0)));
  for(const head of training)for(const {s,clean} of head.sections)for(let i=0;i<8;i++){
    const features=supportFeatures(s,i);
    for(let q=1;q<=3;q++){
      const m=matrices[q-1],y=cornerSupport(s,i,q)-clean[4*i+q];
      for(let a=0;a<5;a++){
        for(let b=0;b<5;b++)m[a][b]+=features[a]*features[b];
        m[a][5]+=features[a]*y;
      }
    }
  }
  return matrices.map(solve);
}
function score(validation,weights){
  let n=0,base=0,model=0;
  for(const head of validation)for(const {s,clean} of head.sections)for(let i=0;i<8;i++)for(let q=1;q<=3;q++){
    const truth=clean[4*i+q];
    base+=Math.abs(cornerSupport(s,i,q)-truth)*scale;
    model+=Math.abs(inferSupport(s,i,q,weights)-truth)*scale;
    n++;
  }
  return {n,baselinePx:base/n,learnedPx:model/n};
}
const all=fit(heads);
assert(all.every((row,i)=>row.every((v,j)=>Math.abs(shipped[i][j]-v)<1e-10)),'배포 가중치의 학습식과 달라졌습니다.');
const folds=Array.from({length:foldCount},(_,fold)=>{
  const training=heads.filter(h=>h.fold!==fold),validation=heads.filter(h=>h.fold===fold);
  const trainIds=new Set(training.map(h=>h.id));
  assert(validation.every(h=>!trainIds.has(h.id)));
  return {fold:fold+1,trainingHeads:training.length,validationIds:validation.map(h=>h.id),...score(validation,fit(training))};
});
assert.equal(new Set(folds.flatMap(f=>f.validationIds)).size,96);
const n=folds.reduce((sum,f)=>sum+f.n,0);
const mean=key=>folds.reduce((sum,f)=>sum+f.n*f[key],0)/n;
const evidence={model:MODEL_VERSION,seed,lambda,folds:foldCount,heads:headCount,rows:n,pixelsPerUnit:scale,split:'생성순서 인덱스 % 4, 두상 전체를 한 묶음으로 배정',metric:'128px 정사영 배율에서 계산한 중간각 지지거리 절대오차의 평균(px)',seedDigest:createHash('sha256').update(JSON.stringify(heads.map(h=>h.id))).digest('hex'),baselinePx:mean('baselinePx'),learnedPx:mean('learnedPx'),scores:folds};
const output=JSON.stringify(evidence,(_,v)=>typeof v==='number'?Number(v.toFixed(8)):v,2)+'\n';
const target=new URL('./photo-oof44.json',import.meta.url);
if(process.argv.includes('--write'))fs.writeFileSync(target,output);
else assert.deepEqual(JSON.parse(fs.readFileSync(target)),JSON.parse(output));
console.log(JSON.stringify({model:MODEL_VERSION,heads:headCount,rows:n,folds:foldCount,baselinePx:evidence.baselinePx,learnedPx:evidence.learnedPx,foldResults:folds.map(f=>[f.baselinePx,f.learnedPx])}));
