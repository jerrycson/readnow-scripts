import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderPixels} from '../renderer.mjs';
import {renderPixels as renderV5} from '../compare/v5/renderer.mjs';
import {humanScene} from '../anatomy.mjs';
import {DEFAULTS,baseSamples,rotationStates} from '../model.mjs';
import {PRESETS} from '../catalog.mjs';
import {evaluateCandidate} from '../../pixel-engine/core.mjs';
const hash=d=>createHash('sha256').update(d).digest('hex'),assert=(v,m)=>{if(!v)throw new Error(m);};
const report={version:7,checkedAt:new Date().toISOString(),results:[]};
async function test(name,fn){try{const detail=await fn();report.results.push({name,ok:true,detail});}catch(e){report.results.push({name,ok:false,error:e.message});}console.log(name+': '+report.results.at(-1).ok);}
const coat={...DEFAULTS,...PRESETS[1].settings,resolution:64};
function frames(settings,yaw,amplitude,render=renderPixels){return Array.from({length:8},(_,i)=>render(settings,{yaw,action:'sleep',phase:i*Math.PI/4,breathAmplitude:amplitude}));}
await test('고정한 5차 모델에서 당시 경고와 호흡 선택을 재현',()=>{
 const rows=[0,.025,.05,.08,.12].map(amplitude=>({amplitude,unique:new Set(frames(coat,90,amplitude,renderV5).map(x=>hash(x.data))).size}));
 assert(rows[0].unique===1,'기존 경고 입력 재현 실패');assert(rows[3].unique>=4,'선택 후보의 호흡 단계가 부족함');assert(rows[1].unique<rows[3].unique&&rows[2].unique<rows[3].unique,'작은 후보와 차이 없음');return {rows,selected:.08,criterion:'64px, coat, yaw90에서 최소 4개의 구분되는 프레임; 시각 비교에서 더 큰 .12를 채택할 필요 없음'};
});
await test('분리한 각도·크기의 후보 평가',()=>{
 const rows=[];let before=0,after=0,missing=0,clipped=0,invalid=0;
 for(const yaw of [135,225])for(const resolution of [48,96,128]){
  const s={...coat,resolution},a=frames(s,yaw,0),b=frames(s,yaw,.08),ua=new Set(a.map(x=>hash(x.data))).size,ub=new Set(b.map(x=>hash(x.data))).size;
  before+=ua;after+=ub;for(const im of b){if(im.metrics.opaque<20)missing++;if(im.metrics.clipped)clipped++;if(im.data.some(x=>!Number.isFinite(x)))invalid++;}rows.push({yaw,resolution,before:ua,after:ub});
 }
 const contract={baseline:{unique:before},candidate:{unique:after,missing,clipped,invalid},objective:{metric:'unique',direction:'max'},tuningCases:['coat64-yaw0','coat64-yaw90','coat64-yaw45-visual'],evaluationCases:rows.map(x=>'coat'+x.resolution+'-yaw'+x.yaw),visualReview:'pending'};
 const decision=evaluateCandidate(contract);assert(decision.decision==='hold'&&decision.gain>0&&missing===0&&clipped===0&&invalid===0,JSON.stringify(decision));return {rows,contract,decision,note:'현재 인체로 다시 검사한 회귀 사례. 시각 검토는 보류하며 과거 5차 시각 판정을 승계하지 않는다.'};
});
await test('옷 6종·14비율·회전에서 수면 누락과 잘림 없음',()=>{
 let count=0;const check=(s,o)=>{const im=renderPixels(s,{action:'sleep',...o});assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({s,o,metrics:im.metrics}));count++;};
 for(const preset of PRESETS.filter(x=>x.settings.species==='human'))for(const resolution of [48,64,96,128])for(const yaw of [0,45,90,135,180,225,270,315])for(let f=0;f<8;f++)check({...DEFAULTS,...preset.settings,resolution},{yaw,phase:f*Math.PI/4});
 for(const sample of baseSamples())for(const yaw of [0,45,90,135,180,225,270,315])for(let f=0;f<4;f++)check({...DEFAULTS,...sample,resolution:64},{yaw,phase:f*Math.PI/2});
 for(const angle of rotationStates())for(let f=0;f<4;f++)check(coat,{...angle,phase:f*Math.PI/2});return {count};
});
await test('호흡의 반복 연결·접지·다른 동작 보존',()=>{
 let checked=0;
 for(const sample of baseSamples()){
  const s={...coat,...sample};
  assert(hash(renderPixels(s,{action:'sleep',phase:0}).data)===hash(renderPixels(s,{action:'sleep',phase:Math.PI*2}).data),'수면 루프 경계 불연속');
  for(let f=0;f<8;f++){
   const scene=humanScene(s,f*Math.PI/4,'sleep'),ys=scene.parts.flatMap(m=>m.vertices.map(v=>v.p[1]));assert(Math.abs(Math.min(...ys))<1e-8,'수면 몸이 지면에서 뜸');
   for(const mesh of scene.parts)for(const v of mesh.vertices)assert(v.p.every(Number.isFinite)&&v.n.every(Number.isFinite),'비정상 좌표');checked++;
  }
  for(const action of ['idle','walk','run','kick'])assert(hash(renderPixels(s,{action,phase:1}).data)===hash(renderPixels(s,{action,phase:1,breathAmplitude:0}).data),'다른 동작에 호흡이 적용됨');
 }return {checked};
});
report.passed=report.results.filter(x=>x.ok).length;report.total=report.results.length;
await writeFile(new URL('./sleep-tests.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.passed!==report.total)process.exitCode=1;
