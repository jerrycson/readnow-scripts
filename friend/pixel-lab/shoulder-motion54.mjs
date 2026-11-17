import {add,sub,mul,cross,norm,dot,lerp} from './geometry.mjs';
import {headClearance54} from './head-clearance54.mjs';

const rad=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const yz=[0,1,0];
function rotate(v,axis,degrees){
  const angle=degrees*rad,c=Math.cos(angle),s=Math.sin(angle);
  return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));
}
function turnTo(v,from,to){
  const c=clamp(dot(from,to),-1,1),a=cross(from,to);
  if(Math.hypot(...a)<1e-9)return c>0?v:rotate(v,norm(cross(from,Math.abs(from[0])<.75?[1,0,0]:[0,0,1])),180);
  return rotate(v,norm(a),Math.acos(c)/rad);
}
// 30·60·90·120도의 대표 관측값. 나머지 5도 표본은 구현 검증에만 사용한다.
// 0도 기준은 논문의 정적 평균, 120도를 넘는 구간은 연구 관찰용 외삽이다.
const samples={
  side:[[11,14.3,16.8,18.1,19.5],[23,31.3,37.3,40.6,44],[11,15.6,26.5,36.5,46.4],[-13,-10.2,-6.1,-2.1,3.8]],
  scapular:[[11,11.5,14.4,15.5,16.9],[23,24.6,29,32,36.3],[11,15.5,26,34.4,43.5],[-13,-11.2,-6.8,-2.8,2.7]],
  front:[[11,10.1,12,13.5,14.5],[23,20.4,22.7,24.8,31.7],[11,15.1,24.4,32.9,43.3],[-13,-10.4,-5.7,-1.4,5.4]]
};
function sample(row,degree){
  if(degree>120)return row[4]+(row[4]-row[3])*(1-Math.exp(-(degree-120)/30));
  const i=Math.min(3,Math.floor(degree/30)),u=(degree-30*i)/30;
  return row[i]*(1-u)+row[i+1]*u;
}
export function girdleAngles54(plane,elevation){
  if(!Object.hasOwn(samples,plane)||!Number.isFinite(elevation)||elevation<0||elevation>178)throw RangeError('들기 면과 각도를 확인하세요.');
  const [clavicleElevation,retraction,upwardRotation,posteriorTilt]=samples[plane].map(row=>sample(row,elevation)-row[0]);
  return {clavicleElevation,retraction,upwardRotation,posteriorTilt};
}
export function shoulderFrame54(scene,side,pose){
  const s=side==='right'?1:-1,j=scene.joints[side],{shoulder:gh,elbow,wrist}=j;
  const {plane='side',elevation=0,flexion=0,twist=0}=pose;
  const len=Math.abs(gh[0]),g=girdleAngles54(plane,elevation),p=scene.proportions;
  // 피부 모형의 쇄골 내측·외측 근사점. 뼈를 촬영해 등록한 관절 좌표는 아니다.
  const sc=[gh[0]*.13,gh[1]-.045*len,p.depth*.61];
  const ac=[gh[0]*.94,gh[1]+.11*len,-p.depth*.10];
  const clavRot=v=>rotate(rotate(v,[0,0,1],s*g.clavicleElevation),yz,s*g.retraction);
  const scapRot=v=>rotate(rotate(v,[0,0,1],s*g.upwardRotation),[1,0,0],-g.posteriorTilt);
  const acNew=add(sc,clavRot(sub(ac,sc)));
  const shoulder=add(acNew,scapRot(sub(gh,ac)));
  const direction=plane==='side'?0:plane==='front'?90:35;
  const axis=[-Math.sin(direction*rad),0,s*Math.cos(direction*rad)];
  const humerus=norm(sub(elbow,gh)),aim=rotate(humerus,axis,elevation);
  const upperRot=v=>rotate(rotate(v,axis,elevation),aim,twist*s);
  const fore=norm(sub(wrist,elbow)),hinge=norm(cross(fore,[0,0,1]));
  const lowerRot=v=>upperRot(rotate(v,hinge,flexion));
  const elbowNew=add(shoulder,upperRot(sub(elbow,gh)));
  return {j,gh,shoulder,elbow:elbowNew,wrist:add(elbowNew,lowerRot(sub(wrist,elbow))),
    clavicle:p=>add(sc,clavRot(sub(p,sc))),scapula:p=>add(acNew,scapRot(sub(p,ac))),
    upper:p=>add(shoulder,upperRot(sub(p,gh))),lower:p=>add(elbowNew,lowerRot(sub(p,elbow))),
    upperRot,lowerRot,g};
}
function reachTarget(scene,side,base,target,pole){
  // 손목이 후두부 옆으로 가는 두 뼈 IK. 닿지 않는 목표는 실제 길이 안으로 제한한다.
  const j=base.j,sh=base.shoulder;
  const l1=Math.hypot(...sub(j.elbow,j.shoulder)),l2=Math.hypot(...sub(j.wrist,j.elbow));
  const aim=norm(sub(target,sh));
  const d=clamp(Math.hypot(...sub(target,sh)),Math.abs(l1-l2)+.00001,l1+l2-.00001);
  const wrist=add(sh,mul(aim,d)),orth=norm(sub(pole,mul(aim,dot(pole,aim))));
  const along=(d*d+l1*l1-l2*l2)/(2*d);
  const elbow=add(add(sh,mul(aim,along)),mul(orth,Math.sqrt(Math.max(0,l1*l1-along*along))));
  const from=norm(sub(base.elbow,sh)),to=norm(sub(elbow,sh));
  const u=v=>turnTo(base.upperRot(v),from,to);
  const fore=norm(u(sub(j.wrist,j.elbow))),lower=norm(sub(wrist,elbow));
  const f=v=>turnTo(u(v),fore,lower);
  return {...base,elbow,wrist,upper:p=>add(sh,u(sub(p,j.shoulder))),lower:p=>add(elbow,f(sub(p,j.elbow))),upperRot:u,lowerRot:f};
}
export function behindHead54(scene,side,pose){
  const sign=side==='right'?1:-1,base=shoulderFrame54(scene,side,pose);
  const intended=[sign*.22,scene.height-.62,-.47];
  let best,score=Infinity;
  for(const [x,y,z,back] of [[0,0,0,0],[0,-.04,-.12,.4],[.12,-.12,-.15,.6],[.22,-.18,-.21,.85],[.30,-.28,-.27,1],[.28,-.42,-.26,1]]){
    const goal=add(intended,[sign*x,y,z]),poseFrame=reachTarget(scene,side,base,goal,[sign,.65,-.04-back]);
    const hit=headClearance54(scene,side,poseFrame);
    const cost=hit.worst*200+hit.total*50+Math.hypot(...sub(poseFrame.wrist,intended));
    if(cost<score){score=cost;best=poseFrame;best.headCheck={...hit,wristOffset:Math.hypot(...sub(poseFrame.wrist,intended))};}
    if(hit.worst<.002)break;
  }
  return best;
}
