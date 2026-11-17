import {SIZE, extent, reconstruct, surfaceEdit} from './hull36.mjs';
import {MODEL_VERSION, acceptsFive, reconstructPhoto} from './photo-ml44.mjs';
import {scanImage} from './scan-view36.mjs';
import {compareDrawingPixels,reviewDrawingCandidate} from './drawing-review.mjs';

export const challengeAngles=Object.freeze([[-35,0],[22.5,0],[0,25],[0,-25]]);
export function makePair(training,settings){
  if(!acceptsFive(training))return null;
  const baseline=reconstruct(training);
  let candidate=settings.learned?reconstructPhoto(training,MODEL_VERSION):baseline;
  if(!baseline||!candidate)return null;
  if(settings.width||settings.depth)candidate=surfaceEdit(candidate,'jaw',settings.width,settings.depth);
  return {baseline,candidate,meshFlips:flippedFaces(baseline,candidate)};
}
function flippedFaces(a,b){
  if(a.v.length!==b.v.length||a.f.length!==b.f.length||a.f.some((v,i)=>v!==b.f[i]))return null;
  function normal(m,i,j,k){
    const u=[0,1,2].map(axis=>m.v[j*3+axis]-m.v[i*3+axis]);
    const v=[0,1,2].map(axis=>m.v[k*3+axis]-m.v[i*3+axis]);
    return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  }
  let count=0;
  for(let t=0;t<a.f.length;t+=3){
    const [i,j,k]=a.f.slice(t,t+3),x=normal(a,i,j,k),y=normal(b,i,j,k);
    if(Math.hypot(...x)>1e-11&&(Math.hypot(...y)<1e-11||x.reduce((s,z,k)=>s+z*y[k],0)<=0))count++;
  }
  return count;
}

// scanImage는 원점이 화면 중앙이고 원본 실측 메시의 좌표 단위가 1/10000이다.
// 동일 카메라의 화면 평행이동을 3D의 우측·상방 단위축으로 역변환한다.
export function renderRegistered(mesh,shot){
  const {cx,cy,scale}=shot.camera,n=SIZE;
  const a=shot.yaw*Math.PI/180,b=shot.pitch*Math.PI/180;
  const right=[Math.cos(a),0,Math.sin(a)],up=[Math.sin(a)*Math.sin(b),Math.cos(b),-Math.cos(a)*Math.sin(b)];
  const offset=right.map((num,k)=>(num*(cx-n/2)+up[k]*(n/2-cy))/scale);
  const v=mesh.v.map((x,k)=>(x+offset[k%3])*10000);
  return scanImage({v,f:mesh.f},shot.yaw,shot.pitch,n,scale/(.797*n));
}
const maskOf=({data})=>Uint8Array.from({length:SIZE*SIZE},(_,i)=>Number(data[4*i+3]>0));
export const exposureOf=(id,s)=>JSON.stringify([id,s.yaw,s.pitch,s.visible||[0,SIZE-1],s.camera.cx,s.camera.cy,s.camera.scale]);
export function scoreSilhouette(reference,drawn,visible){
  const n=SIZE,obs=extent(reference),model=extent(drawn);
  let rows=0,targetRows=0,union=0,both=0,sum=0,clipped=0;
  for(let y=0;y<n;y++){
    if(y<visible[0]||y>visible[1])continue;
    const t=obs[y],m=model[y];
    if(!t&&!m)continue;
    if(t&&(t[0]===0||t[1]===n-1||y===0||y===n-1)){clipped++;continue;}
    if(t)targetRows++;
    rows++;
    if(!t||!m)sum+=n;
    else sum+=(Math.abs(t[0]-m[0])+Math.abs(t[1]-m[1]))/2;
    for(let i=y*n;i<(y+1)*n;i++){
      if(reference[i]||drawn[i])union++;if(reference[i]&&drawn[i])both++;
    }
  }
  return {error:rows?sum/rows:null,iou:union?both/union:null,rows,targetRows,clipped,sourceRows:obs.filter(Boolean).length};
}
const wrapped=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
function newAxis(shot,training){
  return !training.some(s=>{
    const a=s.yaw*Math.PI/180,b=shot.yaw*Math.PI/180,p=shot.pitch*Math.PI/180;
    return Math.abs(Math.cos(p)*Math.cos(a-b))>Math.cos(5*Math.PI/180);
  });
}
export function assessPhotoPair(pair,training,holdouts,{seen=new Map(),candidateId}={}){
  if(!pair||!acceptsFive(training)||typeof candidateId!=='string'||!candidateId)return {decision:'hold',reasons:['다섯 입력과 고정 후보 필요'],views:[],canPromote:false};
  const ids=new Set(),groups=new Set(),roles=new Set(),views=[],reasons=[];
  let improvedHeld=false;
  for(const [i,shot] of [...training,...holdouts].entries()){
    const held=i>=training.length;
    if(!shot)continue;
    const row={role:held?'holdout':'input',yaw:shot.yaw,pitch:shot.pitch,visible:shot.visible||[0,SIZE-1],reasons:[]};
    views.push(row);
    const {camera,mask,key,yaw,pitch}=shot;
    if(!camera||!Number.isFinite(camera.scale)||camera.scale<=0||!Number.isFinite(camera.cx)||!Number.isFinite(camera.cy)||
       ![yaw,pitch].every(Number.isFinite)||Math.abs(pitch)>90||!mask||mask.length!==SIZE*SIZE||!key||
       row.visible.length!==2||!row.visible.every(Number.isInteger)||row.visible[0]<0||row.visible[1]>=SIZE||row.visible[0]>row.visible[1]){
      row.reasons.push('관측·정합 정보 부족');continue;
    }
    if(ids.has(key))row.reasons.push('동일 원본 반복');ids.add(key);
    if(!shot.group)row.reasons.push('원본 촬영 번호 미확인');
    else{
      if(groups.has(shot.group))row.reasons.push('같은 촬영 원본에서 나눈 입력');
      groups.add(shot.group);
      if(held&&shot.groupKey&&seen.has(shot.groupKey)&&seen.get(shot.groupKey)!==exposureOf(candidateId,shot))row.reasons.push('다른 후보에서 본 원본 촬영 그룹');
    }
    if(held&&seen.has(key)&&seen.get(key)!==exposureOf(candidateId,shot))row.reasons.push('다른 후보·정합·생성에 이미 사용한 원본');
    if(held&&!newAxis(shot,training))row.reasons.push('입력과 같은 투영축');
    const before=renderRegistered(pair.baseline,shot),after=renderRegistered(pair.candidate,shot);
    row.pixels=compareDrawingPixels(before,after);
    row.before=scoreSilhouette(mask,maskOf(before),row.visible);
    row.after=scoreSilhouette(mask,maskOf(after),row.visible);
    if(Math.min(row.before.targetRows,row.after.targetRows)<12)row.reasons.push('보이는 피부 행 12개 미만');
    if(row.before.targetRows<row.before.sourceRows)row.reasons.push('전체 외곽의 일부를 관측할 수 없음');
    if(row.before.clipped||row.after.clipped)row.reasons.push('원본 외곽이 화면에서 잘림');
    if(row.reasons.length)continue;
    row.change=row.after.error-row.before.error;
    row.iouChange=row.after.iou-row.before.iou;
    if(held){
      if(row.change< -1e-9)improvedHeld=true;
      const relative=((yaw-training[0].yaw+540)%360)-180;
      if(pitch>=15)roles.add('up');
      else if(pitch<=-15)roles.add('down');
      else if(Math.abs(pitch)<12&&Math.abs(relative)>=12&&Math.abs(relative)<=78)roles.add(relative<0?'left':'right');
    }
  }
  if(training.length!==5||training.some((s,i)=>wrapped(s.yaw,training[0].yaw+45*i)>1e-5||s.pitch!==0))reasons.push('생성 입력의 다섯 방향이 일치하지 않음');
  if(views.some(v=>v.reasons.length))reasons.push('가림·중복·정합 또는 독립성 확인 필요');
  if(roles.size!==4)reasons.push('별도 좌우 사선과 상하 원본 모두 필요');
  const observations=views.flatMap(v=>{
    const context={view:v.yaw+'/'+v.pitch,visible:!v.reasons.length,uncertainty:1e-9};
    return [{...context,units:'px@128',baseline:v.before?.error,candidate:v.after?.error},
      {...context,units:'1-IoU',baseline:1-v.before?.iou,candidate:1-v.after?.iou}];
  });
  const common=reviewDrawingCandidate({observations,meshFlips:pair.meshFlips,unseen:roles.size===4,comparisonViews:views.filter(v=>v.pixels).length});
  const blocked=common.worse.length>0;
  if(blocked)reasons.push('가시 시점의 외곽 거리 또는 겹침이 악화됨');
  for(const item of common.missing)reasons.push(item);
  if(!improvedHeld)reasons.push('별도 원본의 외곽 거리 개선 미확인');
  return {decision:blocked?'regressed':reasons.length?'hold':'review',reasons,views,common,meshFlips:pair.meshFlips,canPromote:false,
    observed:[...roles],worse:views.filter(v=>v.change>1e-9||v.iouChange< -1e-9).length};
}
