import {reconstruct} from './hull36.mjs';
import {inferSupport} from './photo-support44.mjs';
import {MODEL_VERSION,weights} from './photo-weights44.mjs';
export {MODEL_VERSION};

export function acceptsFive(shots){
  if(!Array.isArray(shots)||shots.length!==5||Array.from(shots).some(s=>!s?.rows||!s.camera||!Number.isFinite(s.yaw)))return false;
  const first=shots[0].yaw;
  return shots.every((s,i)=>Math.abs(((s.yaw-first-45*i)%360+540)%360-180)<.000001);
}
function rowSupport(shots,y){
  const s=Array(8).fill(Infinity);
  for(const [i,shot] of shots.entries()){
    const {cx,cy,scale}=shot.camera,range=shot.rows[Math.floor(cy-y*scale)];
    if(!range)return null;
    s[i]=Math.min(s[i],(range[1]+1-cx)/scale);
    s[(i+4)%8]=Math.min(s[(i+4)%8],(cx-range[0])/scale);
  }
  return s;
}
// 36차 높이 띠마다 소수 지지거리를 두 개의 추가 반평면으로 넘긴다.
// 추가 가상 시점은 메시를 구할 때만 사용한다. 사진 투영과 기기 저장은 실제 다섯 입력을 쓴다.
export function reconstructPhoto(shots,version=null){
  if(version!==MODEL_VERSION||!acceptsFive(shots))return reconstruct(shots);
  const levels=67,scale=levels/.998,cy=levels/2;
  const supports=Array.from({length:levels},(_,j)=>rowSupport(shots,(.5-(j+.5)/levels)*.998));
  const extra=[];
  for(let i=0;i<4;i++)for(let quarter=1;quarter<4;quarter++){
    const rows=supports.map(s=>s?[-scale*inferSupport(s,i+4,quarter,weights),scale*inferSupport(s,i,quarter,weights)-1]:null);
    extra.push({yaw:shots[0].yaw+45*(i+quarter/4),rows,camera:{cx:0,cy,scale}});
  }
  return reconstruct([...shots,...extra],levels);
}
