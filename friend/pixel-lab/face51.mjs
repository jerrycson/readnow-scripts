import {form34} from './bust34.mjs';
import {orbit51} from './orbit-surface51.mjs';
import {preserveOrbitFaces51} from './orbit-guard51.mjs';
import {lidContact51} from './orbit-lid51.mjs';
export const orbitCases51=Object.freeze({
 F02:{strength:.8,surface:'tangent',lid:0,state:'비교 · 페른 눈꺼풀 접촉 시안은 별도'},
 M01:{strength:1,surface:'copy',lid:0,state:'보류 · 기존 측면 눈꺼풀 오차 증가'},
 F01:{strength:1,surface:'copy',lid:.8,state:'비교 · 별도 원화와 함께 판독'},
 F03:{strength:1,surface:'copy',lid:.8,state:'비교 · 앞머리에 가린 왼눈 제외'},
 F05:{strength:1,surface:'copy',lid:.8,state:'비교 · 기존 35차 중안면 굴곡 별도'},
 M02:{strength:1,surface:'copy',lid:.8,state:'비교 · 안경테 구간 제외'},
 M03:{strength:1,surface:'copy',lid:.8,state:'비교 · 기존 35차 중안면 굴곡 별도'},
 M04:{strength:1,surface:'copy',lid:.8,state:'비교 · 머리카락 음영 제외'}
});
const models=new WeakMap();
// base50은 현재 선택한 중립·50차 비교 형상이다. 부위 조작과 자세를 나중에 적용한다.
export function candidateOrbit51(base50,id,settingsOr34,mode='study'){
 const rule=orbitCases51[id];if(!rule||mode==='base')return base50;
 if(!['study','contact'].includes(mode))throw new RangeError('안와 연구 모드를 확인하세요.');
 if(!settingsOr34)throw new TypeError('같은 성별·등신의 34차 기준 또는 설정이 필요합니다.');
 let byReference=models.get(base50);if(!byReference){byReference=new WeakMap();models.set(base50,byReference);}
 let options=byReference.get(settingsOr34);if(!options){options=new Map();byReference.set(settingsOr34,options);}
 const cacheKey=id+'/'+mode;if(options.has(cacheKey))return options.get(cacheKey);
 const reference=settingsOr34.parts?settingsOr34:form34(settingsOr34);
 if(base50.parts[0].vertices.length!==reference.parts[0].vertices.length)throw new RangeError('34차 정점 대응이 다릅니다.');
 const surface=orbit51(base50,id,reference,rule.strength,rule.surface),lid=mode==='contact'?.8:rule.lid;
 const result=preserveOrbitFaces51(base50,lid?lidContact51(surface,lid):surface,reference);options.set(cacheKey,result);return result;
}


