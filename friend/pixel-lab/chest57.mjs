import {rotateNormals50} from './body-multiview50.mjs';
import {offsets57} from './chest-offsets57.mjs';
const ramp=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const chestPolicy57=Object.freeze({round:57,default:'source',applied:[],review:['protected08'],ids:['W','atlas:B21'],changedIds:['atlas:B21'],decision:'측면 등록 상반·중립 굽힘 증가로 기본 채택 보류'});

export const chestOptions57=Object.freeze([
 {id:'source',label:'56 원형 유지',status:'기준',gain:0},
 {id:'transverse35',label:'B21 횡단면 항 35% 완화',status:'연구 후보',gain:.35},
 {id:'balanced57',label:'B21 횡단면·하부 연결 조합',status:'연구 후보',gain:.35,lift:.04},
 {id:'balanced08',label:'B21 횡단면·하부 연결 조합 2',status:'연구 후보',gain:.35,lift:.08},
 {id:'volume08',label:'B21 하부 연결·부피 보존',status:'연구 후보',gain:.35,lift:.08,volume:true},
 {id:'protected08',label:'B21 바깥 이음 보호·부피 보존',status:'보류 비교',gain:.35,lift:.08,volume:true,protect:true},
 {id:'protected13',label:'B21 좁은 이음 보호 반례',status:'반례 비교',gain:.35,lift:.08,volume:true,protect:true,radius:.13},
 {id:'balanced12',label:'B21 횡단면·하부 연결 조합 3',status:'반례 비교',gain:.35,lift:.12},
 {id:'transverse65',label:'B21 횡단면 항 65% 완화',status:'반례 비교',gain:.65},
 {id:'transverse100',label:'B21 횡단면 항 제거',status:'반례 비교',gain:1}
]);

// 53~56의 중립 보정 직후, 표식·팔 자세를 계산하기 전에 한 번 적용한다.
export function shapeChest57(study,neutral,variant='source'){
 const plan=chestOptions57.find(p=>p.id===variant);
 if(!plan)throw new RangeError('57차 가슴 후보 이름을 확인하세요.');
 if(study.id!=='atlas:B21'||!plan.gain)return neutral;
 if(neutral.chest57?.variant===variant)return neutral;
 if(neutral.chest57)throw new Error('이전 중립 원형에서 새 후보를 선택하세요.');
 const mesh=neutral.parts[0],source=mesh.vertices;
 if(source.length!==13380)throw new RangeError('B21의 검증한 원래 정점 구성이 필요합니다.');
 const vertices=source.slice();
 const material=study.raw.restSkin35;
 const pinned=plan.protect?[1869,4065,4066,8541,10721,10720].map(i=>material[i].p):[];
 const protection=plan.protect?material.map(({p})=>{
  const distance=Math.min(...pinned.map(q=>Math.hypot(...p.map((v,k)=>v-q[k]))));return ramp(.018,plan.radius??.20,distance);
 }):source.map(()=>1);
 for(const [i,dx,dy,dz] of offsets57){
  const v=source[i],gain=plan.gain*protection[i];if(!gain)continue;
  vertices[i]={...v,p:[v.p[0]+gain*dx,v.p[1]+gain*dy,v.p[2]+gain*dz]};
 }
 if(plan.lift){
  const width=Math.abs(neutral.joints.right.shoulder[0]);
  for(const [i,v] of source.entries()){
   const [x,y,z]=v.p,q=(Math.abs(x)/width-.49)/.42;
   const weight=ramp(.28,.60,z/width)*(1-ramp(.93,1.18,Math.abs(q)))*ramp(5.36,5.53,y)*(1-ramp(5.68,5.86,y))*Math.exp(-.5*(q/.68)**2);
   if(!weight)continue;
   const p=vertices[i].p.slice();p[1]+=width*plan.lift*weight*protection[i];vertices[i]={...vertices[i],p};
  }
 }
 if(plan.volume){
  const reference=study.raw,coordinates=reference.restSkin35.map(v=>{
   const [x,y,z]=v.p,side=x<0?0:1,sign=side?1:-1,f=reference.paperShape.frame(sign);
   return {side,z,q:sign*(x-f.c)/f.root,h:(y-f.foot)/f.h};
  });
  const faces=[[],[]];
  for(const t of mesh.faces){
   const side=coordinates[t[0]].side;
   if(t.every(i=>{const p=coordinates[i];return p.side===side&&p.z>.10&&Math.abs(p.q)<1.22&&p.h>-.47&&p.h<1.32;}))faces[side].push(t);
  }
  const volume=(vs,hand)=>faces[hand].reduce((sum,t)=>{
   const [a,b,c]=t.map(i=>vs[i].p);
   return sum+((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))*(a[2]+b[2]+c[2]-.30)/6;
  },0);
  const weights=coordinates.map(({q,h,z},i)=>protection[i]*ramp(.13,.36,z)*(1-ramp(.83,1.11,Math.abs(q)))*ramp(-.39,-.22,h)*(1-ramp(.74,1.06,h))*Math.exp(-.5*(((h-.52)/.17)**2+(q/.55)**2)));
  const target=[0,1].map(hand=>volume(source,hand)),before=[0,1].map(hand=>volume(vertices,hand));
  const probe=vertices.map((v,i)=>({...v,p:[v.p[0],v.p[1],v.p[2]+.001*weights[i]]}));
  const factors=[0,1].map(hand=>(target[hand]-before[hand])*.001/(volume(probe,hand)-before[hand]));
  if(!factors.every(x=>Number.isFinite(x)&&Math.abs(x)<.16))throw new RangeError('검증 범위 밖의 부피 보상입니다.');
  for(const [i,w] of weights.entries())if(w){const v=vertices[i];vertices[i]={...v,p:[v.p[0],v.p[1],v.p[2]+factors[coordinates[i].side]*w]};}
 }
 rotateNormals50(source,vertices,mesh.faces);
 return {...neutral,parts:neutral.parts.map(m=>m.vertices===source?{...m,vertices}:m),chest57:{variant,gain:plan.gain,stage:'중립',vertices:offsets57.length}};
}

const variantStudies57=new WeakMap();
function variantStudy57(study,variant){
 let variants=variantStudies57.get(study);
 if(!variants)variantStudies57.set(study,variants=new Map());
 if(!variants.has(variant))variants.set(variant,{...study,marksCache:new WeakMap(),reboundCache:new WeakMap()});
 return variants.get(variant);
}

// 53차의 부착 캐시는 study identity로 구분한다. 후보는 독립한 stable proxy를 쓴다.
export function editChest57(study,edit,edit55,edit50,observe){
 const variant=edit.chest57||'source';
 if(variant==='source'||study.id!=='atlas:B21')return edit55(study,edit,edit50,observe);
 const isolated=variantStudy57(study,variant);
 // 최초 진입도 연구의 기본형→후보 순서와 같은 재료점을 사용한다.
 // 표식/형상 입력이 바뀌면 기존 53 캐시가 스스로 새 부착을 계산한다.
 edit55(isolated,{...edit,pose:'neutral',angle:0,compression:0},edit50);
 return edit55(isolated,edit,(input,view)=>{
  const prior=input.candidate,rest=shapeChest57(study,prior,variant);
  const refs=input.marksCache.get(prior),marksCache=new WeakMap();
  if(refs)marksCache.set(rest,refs);
  return edit50({...input,candidate:rest,marksCache},view);
 },observe);
}
