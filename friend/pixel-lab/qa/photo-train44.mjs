import {syntheticHead,random,ringSupport} from './photo-heads44.mjs';
import {supportFeatures,cornerSupport} from '../photo-support44.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const size=5,lambda=.01,count=96,seed=441031,levels=24;
const matrices=Array.from({length:3},()=>Array.from({length:size},()=>Array(size+1).fill(0)));
const rng=random(seed),examples=[];
for(let n=0;n<count;n++){
  const id=Math.floor(rng()*2**32),head=syntheticHead(id);
  examples.push(id);
  for(let j=0;j<levels;j++){
    const y=(.5-(j+.5)/levels)*.95,points=head(y),turn=(rng()-.5)*.32;
    const clean=Array.from({length:32},(_,i)=>ringSupport(points,turn+i*Math.PI/16));
    // 128px 마스크의 경계는 픽셀 칸 끝에 있다. 격자 위상을 매번 바꾸고 깨끗한 중간각을 정답으로 쓴다.
    const grid=85+rng()*25,phase=rng();
    const s=Array.from({length:8},(_,i)=>(Math.round(clean[4*i]*grid+phase)-phase)/grid);
    for(let i=0;i<8;i++){
      const x=supportFeatures(s,i);
      for(let q=1;q<=3;q++){
        const residual=cornerSupport(s,i,q)-clean[(4*i+q)%32];
        const matrix=matrices[q-1];
        for(let a=0;a<size;a++){
          for(let b=0;b<size;b++)matrix[a][b]+=x[a]*x[b];
          matrix[a][size]+=x[a]*residual;
        }
      }
    }
  }
}
function solve(matrix){
  for(let i=0;i<size;i++)matrix[i][i]+=lambda;
  for(let i=0;i<size;i++){
    let best=i;
    for(let j=i+1;j<size;j++)if(Math.abs(matrix[j][i])>Math.abs(matrix[best][i]))best=j;
    [matrix[i],matrix[best]]=[matrix[best],matrix[i]];
    const divisor=matrix[i][i];
    assert(Math.abs(divisor)>1e-10);
    for(let k=i;k<=size;k++)matrix[i][k]/=divisor;
    for(let j=0;j<size;j++)if(j!==i){
      const m=matrix[j][i];
      for(let k=i;k<=size;k++)matrix[j][k]-=m*matrix[i][k];
    }
  }
  return matrix.map(row=>Number(row[size].toPrecision(12)));
}
const weights=matrices.map(solve),weightsFile=new URL('../photo-weights44.mjs',import.meta.url);
const version='photo-ridge44-v1';
const bytes='// 합성 단면만 사용한 고정 가중치. qa/photo-train44.mjs --write 로 재생성.\nexport const MODEL_VERSION='+JSON.stringify(version)+';\nexport const weights='+JSON.stringify(weights)+';\n';
if(process.argv.includes('--write'))fs.writeFileSync(weightsFile,bytes);
else assert.equal(fs.readFileSync(weightsFile,'utf8'),bytes);
console.log(JSON.stringify({version,seed,heads:count,levels,samples:levels*count*8*3,lambda,weights,trainingSeedHash:crypto.createHash('sha256').update(JSON.stringify(examples)).digest('hex'),weightsSha256:crypto.createHash('sha256').update(bytes).digest('hex')}));
