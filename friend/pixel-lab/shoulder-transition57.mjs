import {add,sub,lerp,norm} from './geometry.mjs';
import {shoulderSocket54} from './shoulder-socket54.mjs';
import {poseShoulders54} from './shoulder-rig54.mjs';
import {poseShoulders56} from './shoulder-surface56.mjs';

const initialSurfaces=new WeakMap();
const junctionParts=new Set(['upper-arm','ribcage-waist-pelvis']);
const decay=degree=>{
  const t=Math.max(0,Math.min(1,degree/10));
  return 1-t*t*(3-2*t);
};
// 같은 중립 피부점에 골격 변형의 변위를 얹어 첫 거상에서 풀이가 뛰는 것을 줄인다.
export function transferShoulderRest57(socket,neutral,posed,pose,amount=1){
  const retain=amount*decay(Math.hypot(pose.elevation||0,pose.twist||0));
  if(!retain||pose.reach)return posed;
  const transported=poseShoulders54(neutral,{...pose,joined:false});
  const parts=posed.parts.map((mesh,index)=>{
    if(!mesh.weights54&&!junctionParts.has(mesh.name))return mesh;
    const raw=transported.parts[index];
    const vertices=mesh.vertices.map((v,i)=>{
      const moved=raw.vertices[i];
      const position=moved.p;
      const normal=moved.n;
      return {...v,p:lerp(v.p,position,retain),n:norm(lerp(v.n,normal,retain))};
    });
    return {...mesh,vertices};
  });
  return {...posed,parts};
}
export function poseShoulders57(scene,pose){
  const amount=pose?.transition57??0;
  if(!Number.isFinite(amount)||amount<0||amount>1)throw RangeError('첫 움직임 보정 강도를 확인하세요.');
  const posed=poseShoulders56(scene,pose);
  if(!amount||!pose||pose.joined===false||pose.reach||!posed.shoulder54||
     Math.hypot(pose.elevation||0,pose.twist||0)>=10)return posed;
  let ref=initialSurfaces.get(scene);
  if(!ref){
    ref={socket:shoulderSocket54(scene),neutral:poseShoulders54(scene,{})};
    initialSurfaces.set(scene,ref);
  }
  return transferShoulderRest57(ref.socket,ref.neutral,posed,pose,amount);
}
