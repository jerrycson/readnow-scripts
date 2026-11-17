import {fittedFace} from './fitting35.mjs';
export function smoothLibraryProfile50(record,gain=1,without=false){
 const curve=record.profileFit;if(!Array.isArray(curve)||curve.length<5)return record;
 if(without)return {...record,profileFit:curve.map(()=>0)};
 const result=curve.map((current,i)=>{let total=0,weight=0;for(let d=-6;d<=6;d++){const w=Math.exp(-.5*(d/2.5)**2),index=Math.max(0,Math.min(curve.length-1,i+d));
 total+=w*curve[index];weight+=w;}return current+(total/weight-current)*Math.max(0,Math.min(1,gain));});
 return {...record,profileFit:result};
}
export function candidateLibraryProfile50(study,record,variant='smooth'){
 if(!['F01','F05','M03'].includes(study.id)||record.id!==study.id||variant==='base')return study.scene;
 if(!['smooth','half','ablation'].includes(variant))throw new RangeError('교정 깊이 시안을 확인하세요.');
 return fittedFace(study.settings,smoothLibraryProfile50(record,variant==='half'?.5:1,variant==='ablation'));
}
