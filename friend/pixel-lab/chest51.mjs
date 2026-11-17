import {chestFits51,chestPinned51} from './chest-fits51.mjs';
import {lowerBody51} from './lower-body51.mjs';
const cache=new WeakMap();
const attachmentCache=new WeakMap();
// study는 createChestStudy50의 결과. pose/표식/작업자 지역편집 절차는 50차 렌더 함수를 그대로 쓴다.
export function makeChest51(study){
 if(cache.has(study))return cache.get(study);
 const tuning=chestFits51[study.id],neutral=tuning?lowerBody51(study.candidate,tuning):study.candidate;
 const candidate={...study,candidate:neutral};
 cache.set(study,candidate);return candidate;
}
export function editChest51(study,edit,render50){
 if(typeof render50!=='function')throw new TypeError('50차 몸통 편집 함수를 전달하세요.');
 const shape=makeChest51(study);
 if(!chestPinned51[study.id])return render50(shape,{...edit,version:'candidate'});
 const key=JSON.stringify([edit?.values||null,edit?.surface||null,edit?.markerVersion||'source']);
 let attachment=attachmentCache.get(study);
 if(!attachment||attachment.key!==key){
  const values={...study.api.zero('W'),...edit?.values},settings={...study.settings,...edit?.surface};
  const original=study.api.sculpt(study.candidate,'W',values),edited=study.api.sculpt(shape.candidate,'W',values);
  const marksCache=new WeakMap(),reboundCache=new WeakMap();
  // 한 번만 원래 물질점으로 중립 및 세분 표식을 묶는다. 양쪽의 피부 삼각형 번호는 같다.
  render50({...study,candidate:original,settings,marksCache,reboundCache},{version:'candidate',markerVersion:edit?.markerVersion});
  marksCache.set(edited,marksCache.get(original));
  attachment={key,view:{...shape,candidate:edited,settings,marksCache,reboundCache}};
  attachmentCache.set(study,attachment);
 }
 return render50(attachment.view,{...edit,version:'candidate',values:undefined,surface:undefined});
}
