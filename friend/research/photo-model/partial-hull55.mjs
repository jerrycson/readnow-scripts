import {SIZE,extent,reconstruct} from '../../pixel-lab/hull36.mjs';
import {renderRegistered} from '../../pixel-lab/photo-review50.mjs';

const full={enabled:true,bands:[]};
export const size=SIZE;
export const defaultAngles=[[0,0],[45,0],[90,0],[135,0],[180,0],[-30,0],[25,20]];
export function coverage(shot){
  const state=shot.visibility55||full;
  if(typeof state.enabled!=='boolean'||!Array.isArray(state.bands))throw Error('가림 기록의 형식을 확인하세요.');
  const bits=new Uint8Array(SIZE).fill(state.enabled?3:0);
  if(shot.visible){
    const [first,last]=shot.visible;
    if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last>=SIZE||first>last)throw Error('이전 사진의 가시 범위가 잘못되었습니다.');
    bits.fill(0,0,first);bits.fill(0,last+1);
  }
  for(const {first,last,side,active} of state.bands){
    if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last>=SIZE||first>last||
      !['left','right','both'].includes(side)||typeof active!=='boolean')throw Error('구간은 0~127행, 왼쪽·오른쪽·양쪽에서 지정하세요.');
    if(!active)continue;
    const keep=side==='left'?2:side==='right'?1:0;
    for(let y=first;y<=last;y++)bits[y]&=keep;
  }
  return bits;
}
function geometryReady(shot){
  const c=shot.camera;
  if(!Number.isFinite(shot.yaw)||!Number.isFinite(shot.pitch)||Math.abs(shot.pitch)>90||
    !c||![c.cx,c.cy,c.scale].every(Number.isFinite)||c.scale<=0||shot.mask?.length!==SIZE*SIZE)
    throw Error('사진의 마스크·각도·정사영 중심과 축척을 확인하세요.');
}
function constraints(shots,masked){
  const images=[];
  for(const s of shots.filter(Boolean)){
    geometryReady(s);
    if(s.role==='check'||s.pitch!==0)continue;
    const bits=masked?coverage(s):new Uint8Array(SIZE).fill(3);
    if(!bits.some(Boolean))continue;
    const original=extent(s.mask),{cx,scale}=s.camera;
    const unbounded=[cx-2*scale,cx+2*scale]; // 기존 단면 초기 사각형의 모든 가능한 투영보다 넓다.
    const rows=original.map((r,y)=>{
      if(bits[y]===3)return r;
      if(!r)return unbounded; // 가림 아래 빈 행은 확실한 배경이라고 단정하지 않는다.
      return [bits[y]&1?r[0]:unbounded[0],bits[y]&2?r[1]:unbounded[1]];
    });
    images.push({...s,bits,rows,original});
  }
  return images;
}
function bounded(dirs){
  dirs.sort((a,b)=>a-b);
  return dirs.length>=3&&dirs.every((angle,i)=>((i+1===dirs.length?dirs[0]+360:dirs[i+1])-angle)<175);
}
function meshFor(shots,masked){
  const images=constraints(shots,masked);
  if(images.length<2)return {mesh:null,reason:'생성에 쓸 수평 사진 두 방향 이상이 필요합니다.'};
  let unresolved=0;
  for(let j=0;j<67;j++){
    const h=(.5-(j+.5)/67)*.998,dirs=[];let empty=false;
    for(const s of images){
      const y=Math.floor(s.camera.cy-h*s.camera.scale),r=s.original[y];
      if(y<0||y>=SIZE||(!r&&s.bits[y]===3)){empty=true;break;}
      if(!r)continue;
      const yaw=(s.yaw%360+360)%360;
      if(s.bits[y]&2)dirs.push(yaw);
      if(s.bits[y]&1)dirs.push((yaw+180)%360);
    }
    if(!empty&&!bounded(dirs))unresolved++;
  }
  if(unresolved)return {mesh:null,reason:'둘레를 닫을 관측 방향이 부족한 단면 '+unresolved+'개. 다른 수평 사진 또는 보이는 경계를 확인하세요.'};
  const mesh=reconstruct(images);
  return {mesh,reason:mesh?'':'같은 높이에서 겹치는 외피가 없습니다.'};
}
export function fitPair(shots){
  return {all:meshFor(shots,false),observed:meshFor(shots,true)};
}
export function compareSides(shot,image){
  geometryReady(shot);
  const bits=coverage(shot),raw=extent(shot.mask);
  const drawn=extent(Uint8Array.from({length:SIZE*SIZE},(_,i)=>image.data[i*4+3]>0?1:0));
  let sum=0,count=0,missing=0,hidden=0,clipped=0;
  for(let y=0;y<SIZE;y++){
    const ref=raw[y];if(!ref)continue;
    for(let side=0;side<2;side++){
      if(!(bits[y]&(1<<side))){hidden++;continue;}
      if(ref[side]===(side?SIZE-1:0)||y===0||y===SIZE-1){clipped++;continue;}
      if(!drawn[y]){sum+=SIZE;missing++;}else sum+=Math.abs(drawn[y][side]-ref[side]);
      count++;
    }
  }
  return {count,hidden,clipped,missing,error:count?sum/count:null};
}
export function renderFit(mesh,shot){
  return mesh?renderRegistered(mesh,shot):null;
}
export function restoreShot(s,index){
  if(!s)return null;
  const result={...s,pitch:s.pitch??0,yaw:s.yaw??defaultAngles[index]?.[0]??0,role:s.role??(index<5?'fit':'check'),
    visibility55:s.visibility55?structuredClone(s.visibility55):{enabled:true,bands:[]}};
  if(result.rgba?.length!==SIZE*SIZE*4||!['fit','check'].includes(result.role))throw Error('보존 사진의 픽셀 또는 피팅 용도를 확인하세요.');
  geometryReady(result);coverage(result);return result;
}
