import {writeFile} from 'node:fs/promises';
import {DEFAULTS,baseSamples} from '../model.mjs';
import {humanScene,gaitFoot} from '../anatomy.mjs';
import {renderPixels} from '../renderer.mjs';
import {phaseFromDistance} from '../motion.mjs';
import {createWorld,stepWorld,stepProps,approachObject} from '../world.mjs';
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
const report={version:3,results:[]};
function test(name,fn){try{report.results.push({name,ok:true,detail:fn()});}catch(e){report.results.push({name,ok:false,error:e.message});}}
test('14형의 양방향 지지발 미끄러짐 수치 검사',()=>{
 let checked=0,maxResidual=0;
 for(const sample of baseSamples())for(const direction of [-1,1]){
  const scene=humanScene({...DEFAULTS,...sample},0,'walk'),stride=scene.gait.stride,unit=56/scene.frame*3;
  let phase=0,position=0;
  for(let i=0;i<600;i++){
   const next=phaseFromDistance(phase,.2,stride*unit,.6);
   for(const side of [-1,1]){const a=gaitFoot(phase,side,stride,0),b=gaitFoot(next,side,stride,0);if(a.stance&&b.stance&&b.u>a.u){const delta=direction*.2+direction*(b.z-a.z)*unit;maxResidual=Math.max(maxResidual,Math.abs(delta));checked++;}}
   phase=next;position+=direction*.2;
  }
 }
 assert(maxResidual<1e-8,'지지발 미끄러짐');return {checked,maxResidual,scope:'flat ground, unrounded joint coordinates; raster rounding and slopes remain separate'};
});
test('공 차기 14형·8시점·16방향 렌더',()=>{
 let renders=0;for(const sample of baseSamples())for(let f=0;f<8;f++)for(const yaw of [0,90,180,270])for(const pitch of [0,90,180,270]){
  const im=renderPixels({...DEFAULTS,...sample,resolution:64},{action:'kick',phase:f*Math.PI/4,yaw,pitch});assert(im.metrics.opaque>20&&!im.metrics.clipped,JSON.stringify({sample,f,yaw,pitch}));renders++;
 }return {renders};
});
test('그림 경계와 분리된 바닥 기준',()=>{
 const rows=[];for(let f=0;f<8;f++){const im=renderPixels({...DEFAULTS,heads:7},{action:'run',phase:f*Math.PI/4,yaw:90});rows.push(im.groundRow);assert(Number.isFinite(im.groundRow),'바닥 기준 누락');}assert(new Set(rows).size===1,'바닥 기준이 프레임마다 이동');
});
test('공 반응은 지연 후 한 번, 이동·착지·정지',()=>{
 const world=createWorld(42),ball=world.items.find(o=>o.kind==='ball');world.x=ball.x-.025;approachObject(world,'ball');
 while(world.state!=='interact')stepWorld(world,.05);
 const before=ball.x;assert(!ball.vx&&!world.events.length,'공 차기 전 충격');
 for(let i=0;i<8;i++)stepWorld(world,.05);
 assert(world.events.length===1&&world.events[0].action==='kick','공 차기 사건 누락');assert(ball.vx>0,'공 충격 누락');
 let maxHeight=0;for(let i=0;i<200;i++){stepProps(world,.05);maxHeight=Math.max(maxHeight,ball.elevation);assert(ball.elevation>=0&&ball.x>=.08&&ball.x<=.92,'공 범위 이탈');}
 assert(ball.x>before&&maxHeight>0,'공이 움직이지 않음');assert(ball.elevation===0&&ball.vx===0&&ball.vy===0,'공이 정지하지 않음');assert(world.events.length===1,'반복 충격');return {travel:ball.x-before,maxHeight,events:world.events.length};
});
test('공의 좌우 경계 반사',()=>{for(const [x,vx]of [[.081,-.4],[.919,.4]]){const w=createWorld(7),b=w.items.find(o=>o.kind==='ball');Object.assign(b,{x,vx,vy:0,elevation:0});stepProps(w,.1);assert(b.x>=.08&&b.x<=.92&&Math.sign(b.vx)===-Math.sign(vx),'반사 실패');}});
report.passed=report.results.filter(x=>x.ok).length;report.total=report.results.length;
await writeFile(new URL('./motion-tests.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
