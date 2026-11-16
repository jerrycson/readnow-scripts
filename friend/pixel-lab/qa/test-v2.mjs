import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {DEFAULTS,validateSettings,baseSamples,rotationStates} from '../model.mjs';
import {renderPixels} from '../renderer.mjs';
import {humanScene,gaitFoot} from '../anatomy.mjs';
import {PRESETS,ACTION_SUPPORT} from '../catalog.mjs';
const assert=(x,m)=>{if(!x)throw new Error(m);};
const hash=x=>createHash('sha256').update(x).digest('hex');
const result={version:2,results:[]};
async function test(name,fn){const start=performance.now();try{const detail=await fn();result.results.push({name,ok:true,ms:Math.round(performance.now()-start),detail});}catch(e){result.results.push({name,ok:false,error:e.message});}console.log(name+': '+result.results.at(-1).ok);}
await test('기존 저장 형식에 새 모양 기본값 적용',()=>{const s=validateSettings({heads:7,sex:'male',palette:'umber'});assert(s.top==='none'&&s.species==='human'&&s.heads===7&&s.palette==='umber','기존 설정 변경');});
await test('지지발 접지와 보행의 양발 분리',()=>{
 let stance=0,swing=0,maxBoneError=0;
 for(const sample of baseSamples())for(let i=0;i<24;i++){
  const scene=humanScene({...DEFAULTS,...sample},i*Math.PI/12,'walk');
  for(const foot of scene.feet){assert(foot.ground>=-1e-8,'발이 바닥 아래로 들어감');if(foot.stance){stance++;assert(Math.abs(foot.ground)<1e-7,'지지발이 뜸');}else swing++;}
  for(const side of ['left','right']){const j=scene.joints[side],p=scene.proportions,dist=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));maxBoneError=Math.max(maxBoneError,Math.abs(dist(j.hip,j.knee)-(p.leg-.035)*.51),Math.abs(dist(j.knee,j.ankle)-(p.leg-.035)*.49));}
 }
 assert(stance&&swing,'지지·유각 구분 없음');assert(maxBoneError<.015,'뼈 길이 변화: '+maxBoneError);return {stance,swing,maxBoneError};
});
await test('96·128px 남녀 14형의 64각도',()=>{
 let count=0;for(const resolution of [96,128])for(const sample of baseSamples())for(const angle of rotationStates()){
  const im=renderPixels({...DEFAULTS,...sample,resolution},angle);assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({sample,resolution,angle,metrics:im.metrics}));count++;
 }return {count};
});
await test('13개 형태·옷 조합의 전 방향 렌더',()=>{
 let count=0;for(const preset of PRESETS)for(const angle of rotationStates()){
  const im=renderPixels({...DEFAULTS,...preset.settings,resolution:64},angle);assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({name:preset.name,angle,metrics:im.metrics}));count++;
 }return {count};
});
await test('지원 동작의 8프레임·네 방향 누락과 잘림',()=>{
 let count=0;const warnings=[];
 for(const preset of PRESETS)for(const action of ACTION_SUPPORT[preset.settings.species]){
  const hashes=new Set();for(const yaw of [0,90,180,270])for(let i=0;i<8;i++){
   const im=renderPixels({...DEFAULTS,...preset.settings,resolution:64},{yaw,action,phase:i*Math.PI/4});assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({name:preset.name,action,yaw,i,metrics:im.metrics}));if(yaw===90)hashes.add(hash(im.data));count++;
  }if(hashes.size===1)warnings.push({preset:preset.name,action,issue:'64px 옆모습에서 프레임 변화가 읽히지 않음'});
 }return {count,warnings};
});
await test('같은 옷의 재질 구분과 결정성',()=>{
 const hashes=[];for(const fabric of ['cotton','wool','silk','leather']){const s={...DEFAULTS,heads:6,top:'coat',bottom:'trousers',fabric,resolution:128};const a=renderPixels(s,{yaw:45}),b=renderPixels(s,{yaw:45});assert(hash(a.data)===hash(b.data),'동일 입력의 깜빡임');hashes.push(hash(a.data));}assert(new Set(hashes).size===4,'재질이 동일하게 그려짐');return {distinct:4};
});
result.passed=result.results.filter(x=>x.ok).length;result.total=result.results.length;
await writeFile(new URL('./v2-tests.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
if(result.passed!==result.total)process.exitCode=1;
