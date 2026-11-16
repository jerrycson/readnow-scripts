import {DEFAULTS,ANGLES,baseSamples,rotationStates,createProfile,validateSettings,recordExperience,normalizeAngle,groundHeight} from './model.mjs';
import {renderPixels} from './renderer.mjs';
import {transitionLease} from './presence.mjs';
import {createHostBridge} from './host-bridge.mjs';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
export async function runPureTests({full=true,onProgress=()=>{}}={}){
 const results=[],test=async(name,fn)=>{const t=performance.now();try{const detail=await fn();results.push({name,ok:true,ms:Math.round(performance.now()-t),detail});}catch(e){results.push({name,ok:false,error:e.message});}};
 await test('입력 계약과 잘못된 등신 거절',()=>{for(const n of [0,1,2.5,9,NaN]){let rejected=false;try{validateSettings({...DEFAULTS,heads:n});}catch{rejected=true;}assert(rejected,'잘못된 등신을 받아들임');}assert(normalizeAngle(-45)===315&&normalizeAngle(360)===0,'회전 정규화');});
 await test('바닥과 언덕의 연속 접지',()=>{assert(groundHeight(0,1000)===38&&groundHeight(700,1000)===108&&groundHeight(1000,1000)===38,'바닥과 정상 높이');for(let x=1;x<=1000;x++){const h=groundHeight(x,1000);assert(h>=38&&h<=108,'바닥 이탈');assert(Math.abs(h-groundHeight(x-1,1000))<1.2,'언덕 경계 순간 이동');}});
 await test('경험의 중복 적용 방지와 중립 시작',()=>{const p=createProfile('test','시험');assert(Object.values(p.experience).every(v=>v===0),'중립 시작');const a=recordExperience(p,'care',1,'event-1'),b=recordExperience(a,'care',2,'event-1');assert(p.events.length===0&&b.experience.care===1,'중복 또는 원본 변경');});
 await test('캐릭터별 임대와 오래된 기기 요청 거절',()=>{
  const first=transitionLease(null,{type:'acquire',owner:'A'},100).lease;
  assert(!transitionLease(first,{type:'acquire',owner:'B'},101).ok,'중복 획득');
  const empty=transitionLease(first,{type:'release',owner:'A',epoch:first.epoch},102).lease;
  const next=transitionLease(empty,{type:'acquire',owner:'B'},103).lease;
  assert(next.owner==='B'&&next.epoch>first.epoch,'이동 순서');
  assert(!transitionLease(next,{type:'renew',owner:'A',epoch:first.epoch},104).ok,'이전 소유자 갱신');
  assert(!transitionLease(first,{type:'renew',owner:'A',epoch:first.epoch},5100).ok,'만료 뒤 갱신');
  const other=transitionLease(null,{type:'acquire',owner:'A'},104);assert(other.ok,'두 번째 캐릭터 배치');
 });
 await test('기존 PC·안드로이드 통로와 새 웹 단독 모드',async()=>{
  const calls=[],rects={rects:[[10,20,80,120]],width:800,height:600,dpr:1.5};
  const pc=createHostBridge({__TAURI_INTERNALS__:{invoke:async(name,args)=>calls.push({name,args})}});await pc.rects(rects);await pc.openSettings();await pc.closeSettings();
  assert(calls[0].name==='friend_post'&&calls[0].args.data.r[0][2]===80,'PC 좌표');assert(calls[1].args.kind==='open_settings','설정 열기');
  const androidCalls=[],android=createHostBridge({RnHostAndroid:{post:(kind,data)=>androidCalls.push({kind,data:JSON.parse(data)})}});await android.rects(rects);assert(androidCalls[0].data.dpr===1.5,'안드로이드 배율');
  assert(await createHostBridge({}).openSettings()===false,'웹 단독 모드');
  let failed=false;try{await createHostBridge({__TAURI_INTERNALS__:{invoke:async()=>{throw new Error('통로 끊김');}}}).openSettings();}catch{failed=true;}assert(failed,'통로 실패를 성공으로 처리함');
  return {pcMessages:calls.length,androidMessages:androidCalls.length,nativeDeviceExecuted:false};
 });
 await test('회전은 평면 회전이 아닌 깊이 재투영',()=>{
  const a=renderPixels(DEFAULTS,{yaw:0,pitch:0}),b=renderPixels(DEFAULTS,{yaw:90,pitch:0}),c=renderPixels(DEFAULTS,{yaw:0,pitch:90});
  assert(a.metrics.opaque!==b.metrics.opaque&&a.metrics.opaque!==c.metrics.opaque,'가림 변화가 없음');
  assert(a.coordinates.order==='Y-then-X','회전 순서');
  return {front:a.metrics.opaque,side:b.metrics.opaque,top:c.metrics.opaque};
 });
 await test(full?'세 시안 × 14개 기본형 × 64상태의 누락·잘림 검사':'14개 기본형 정면 검사',async()=>{
  let count=0;const summary=[];for(const candidate of full?['A','B','C']:['B']){let minOpaque=Infinity,maxOpaque=0;const t=performance.now();
   for(const sample of baseSamples())for(const angle of full?rotationStates():[{yaw:0,pitch:0}]){
    const s={...DEFAULTS,...sample,candidate,resolution:48},image=renderPixels(s,angle);
    assert(image.metrics.opaque>10,`빈 그림: ${JSON.stringify({sample,angle,candidate})}`);assert(!image.metrics.clipped,`잘림: ${JSON.stringify({sample,angle,candidate})}`);
    assert(image.data.every(Number.isFinite),'유효하지 않은 픽셀');minOpaque=Math.min(minOpaque,image.metrics.opaque);maxOpaque=Math.max(maxOpaque,image.metrics.opaque);count++;
    if(count%64===0){onProgress(count);await new Promise(r=>setTimeout(r,0));}
   }summary.push({candidate,states:full?896:14,ms:Math.round(performance.now()-t),minOpaque,maxOpaque});
  }assert(count===(full?2688:14),'상태 수');return {count,summary};
 });
 return {passed:results.filter(x=>x.ok).length,total:results.length,results};
}
