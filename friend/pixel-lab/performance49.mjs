const exact=(v,fields)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
export function neutralPerformance(id){
  if(id==='W')return {pose:'neutral',match:false};
  if(id==='F02')return {lid:0,match:false};
  return {corner:0,opening:0,match:false};
}
export function validatePerformance(id,values){
  const valid=exact(values,Object.keys(neutralPerformance(id)))&&typeof values.match==='boolean';
  if(!valid)throw Error('대상에 맞는 표정·자세 설정을 확인해 주세요.');
  if(id==='W'){
    if(!['neutral','waist','behindHead'].includes(values.pose))throw Error('몸통 자세를 확인해 주세요.');
  }else if(id==='F02'){
    if(!Number.isInteger(values.lid)||Math.abs(values.lid)>8)throw Error('눈 뜬 정도는 −8…8 정수입니다.');
  }else{
    if(![values.corner,values.opening].every(v=>Number.isInteger(v)&&v>=0&&v<=100))throw Error('입꼬리와 입 벌림은 0…100 정수입니다.');
  }
  return Object.fromEntries(Object.keys(neutralPerformance(id)).map(k=>[k,values[k]]));
}
