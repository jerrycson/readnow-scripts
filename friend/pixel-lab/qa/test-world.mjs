import {writeFile} from 'node:fs/promises';
import {createWorld,stepWorld} from '../world.mjs';
import {ACTION_SUPPORT} from '../catalog.mjs';
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const report={version:2,results:[]};
function test(name,fn){try{report.results.push({name,ok:true,detail:fn()});}catch(e){report.results.push({name,ok:false,error:e.message});}}
function simulate(seed,species='human',memory={}){const world=createWorld(seed,memory);for(let i=0;i<12000;i++){stepWorld(world,.05,{supported:ACTION_SUPPORT[species]});assert(world.x>=.04&&world.x<=.96,'무대 이탈');assert(ACTION_SUPPORT[species].includes(world.action),'지원하지 않는 동작');assert(world.energy>=.1&&world.energy<=1,'에너지 범위 오류');}return world;}
test('같은 재현번호의 배치와 행동 일치',()=>{const a=simulate(42),b=simulate(42),c=simulate(43);assert(JSON.stringify(a.items)===JSON.stringify(b.items),'배치가 바뀜');assert(JSON.stringify(a.events)===JSON.stringify(b.events),'행동이 바뀜');assert(JSON.stringify(a.items)!==JSON.stringify(c.items),'재현번호가 배치에 미반영');return {events:a.events.length};});
test('8종이 10분 동안 사물에 반응하고 무대 안에 머묾',()=>Object.keys(ACTION_SUPPORT).map(species=>{const w=simulate(109,species),seen=new Set(w.events.map(e=>e.object));assert(seen.size===5,'일부 사물을 방문하지 못함: '+species);assert(w.events.every((e,i)=>e.sequence===i+1),'중복 사건');assert(Object.values(w.memory).reduce((a,b)=>a+b,0)===w.events.length,'기억과 사건 불일치');return {species,events:w.events.length,objects:seen.size};}));
test('이전 방문 기억 보존과 첫 만남 구분',()=>{const memory={books:7,plant:4,ball:9,bench:3,lamp:2};const w=simulate(77,'human',memory);assert(w.events.every(e=>!e.first),'기존 사물을 처음으로 취급');assert(memory.books===7,'입력 기억을 변경');return {visits:w.memory};});
test('숨겨진 탭의 긴 시간 간격을 0.1초로 제한',()=>{const w=createWorld(8);stepWorld(w,.01);const old=w.x;stepWorld(w,10000);assert(Math.abs(w.x-old)<=.01,'복귀 순간 이동');});
report.passed=report.results.filter(x=>x.ok).length;report.total=report.results.length;
await writeFile(new URL('./world-tests.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
