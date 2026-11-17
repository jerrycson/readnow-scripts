import {protectFaces54} from './face-orientation54.mjs';
import {form34} from './bust34.mjs';
import {candidateFace53} from './face53.mjs';
import {soften54} from './face-boundary54.mjs';
import {plane54} from './face-normal54.mjs';
import {lower54} from './face-lower54.mjs';
import {detail54} from './face-detail54.mjs';
import {attach54} from './face-lips54.mjs';
export const options54=Object.freeze({
 F02:Object.freeze({eyeY:-.024,eyeX:.012,eyeWidth:1.05,lipY:-.024,mouthWidth:1.06,lipDepth:.030,lipX:.033,noseY:.036,noseDepth:.025}),
 M01:Object.freeze({eyeX:.012,eyeWidth:.96,eyeDepth:-.010,mouthWidth:.87,noseY:.036,noseDepth:.025})
});
const cache=new WeakMap();
export function candidateFace54(base,id,settingsOrReference,mode='study'){
 if(!Object.hasOwn(options54,id)||mode==='source'||mode==='base')return base;
 if(!['study','support'].includes(mode))throw RangeError('54차 얼굴 비교 방식을 확인하세요.');
 if(!settingsOrReference||typeof settingsOrReference!=='object')throw TypeError('얼굴 원형 설정이 필요합니다.');
 let refs=cache.get(base);
 if(!refs){refs=new Map();cache.set(base,refs);}
 const reference=settingsOrReference.parts?settingsOrReference:JSON.stringify([settingsOrReference.heads,settingsOrReference.sex,settingsOrReference.designStyle,settingsOrReference.candidate,settingsOrReference.palette]);
 let models=refs.get(reference);if(!models){models=new Map();refs.set(reference,models);}
 if(!models.has('reference'))models.set('reference',settingsOrReference.parts?settingsOrReference:form34(settingsOrReference));
 const r34=models.get('reference');
 if(!models.has(id+'/support'))models.set(id+'/support',lower54(base,id,r34));
 if(mode==='study'&&!models.has(id+'/study')){
  const shaped=detail54(models.get(id+'/support'),options54[id]);
  const tissue=id==='M01'?attach54(base,shaped,.009,.85):soften54(shaped,id,r34,'local',.92,true);
  const smooth=plane54(tissue,candidateFace53(base,id,r34),.82);
  models.set(id+'/study',protectFaces54(base,smooth,r34));
 }
 return models.get(id+'/'+mode);
}
