import {frontRay}from './continuous/body.mjs';import {form34} from './bust34.mjs';import {candidateSupport53} from './face-support53.mjs';import {contourSupport53}from './face-contour53.mjs';import {layeredSupport53}from './face-lower53.mjs';
export const cases53=Object.freeze({F02:{width:.097,lift:.030,depth:0},M01:{width:.081,lift:.016,depth:0,retainedLower:.18}});
function narrowLip(scene,reference){
 const verts=scene.parts[0].vertices,skin=scene.parts.filter(m=>m.vertices===verts&&m.name==='portrait-skin34').flatMap(m=>m.faces);
 const front=frontRay(verts,skin,scene.height);
 return {...scene,parts:scene.parts.map((m,j)=>{
  if(!/^(upper-lip34|lower-lip34|mouth-line34)$/.test(m.name))return m;
  return {...m,vertices:m.vertices.map((v,i)=>{
      const [x,y,z]=v.p,target=reference.parts[j].vertices[i].p[0];
   // 입술 자리에는 피부 삼각형의 작은 구멍이 있다. 기준 입술 깊이에 가까운
   // 양 끝 피부를 모두 만나는 인접 광선 쌍만 골라 뒤통수 교차점을 배제한다.
   const offsets=[[0,0],[0,-.003],[0,.003],[-.002,0],[.002,0],[0,-.008],[0,.008]];
   const steps=[];
   for(const [dx,dy] of offsets){
    const old=front(x+dx,y+dy),next=front(target+dx,y+dy);
    if(Math.abs(old-z)<.08&&Math.abs(next-z)<.08&&Math.abs(next-old)<.056)steps.push(next-old);
   }
   steps.sort((a,b)=>a-b);
   const shift=steps.length?steps[Math.floor(steps.length/2)]:0;
   
   return {...v,p:[target,y,z+shift]};
  })};
 })};
}

const cache = new WeakMap();
const neutralReferences = new WeakMap();

function referenceFor(base, settings) {
 if (settings?.parts) return settings;
 if (!settings || typeof settings !== 'object') throw TypeError('34차 원형 또는 조형 설정이 필요합니다.');
 // form34의 기본 형태를 결정하는 다섯 값. 같은 값의 새 설정 객체도 기존 원형을 쓴다.
 const key = JSON.stringify([settings.heads, settings.sex, settings.designStyle, settings.candidate, settings.palette]);
 let references = neutralReferences.get(base);
 if (!references) {
  references = new Map();
  neutralReferences.set(base, references);
 }
 if (!references.has(key)) references.set(key, form34(settings));
 return references.get(key);
}
export function candidateFace53(base,id,settingsOrReference,mode='study'){
 if(!Object.hasOwn(cases53,id)||mode==='base')return base;
 if(!['study','field'].includes(mode))throw RangeError('53차 얼굴 비교 방식을 확인하세요.');
 const r=referenceFor(base,settingsOrReference);
 if(!cache.has(base))cache.set(base,new WeakMap());
 const table=cache.get(base);if(!table.has(r))table.set(r,new Map());const modes=table.get(r),key=id+'/'+mode;
 if(!modes.has(key)){
  const q=cases53[id],params=[q.width,q.lift,q.depth];
  const field=candidateSupport53(base,id,r,'features');
  const model=mode==='field'?field:id==='M01'?layeredSupport53(base,id,r,q.retainedLower,params,true):contourSupport53(field,params,true);
  modes.set(key,mode==='study'?narrowLip(model,field):model);
 }
 return modes.get(key);
}



