import {shapeLip57,face57Options} from './face-lips57.mjs';
// C의 피부 접힘 증가를 확인한 뒤 만든 E. 입술·입선 접합부의 실제 좌표만 바꾼다.
export const face57SafeOptions=Object.freeze(Object.fromEntries(Object.entries(face57Options).map(([id,o])=>[
 id,Object.freeze({...o,support:0,clearance:.006})
])));
export function candidateFace57(scene,id,mode='source'){
 if(mode==='source'||!face57SafeOptions[id])return scene;
 if(mode!=='contact')throw new RangeError('57차 입술 시안을 확인하세요.');
 return shapeLip57(scene,id,face57SafeOptions[id]);
}
