const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const required=['id','episode','at','task','subject','method','outcome','unit','metricBefore','metricAfter'];
const allowed=new Set([...required,'yaw','pitch','zone']);
export function deviceCase(doc){
  const row=doc.data();
  if(!row||!Object.keys(row).every(k=>allowed.has(k))||!required.every(k=>Object.hasOwn(row,k))||row.id!==doc.id||!uuid.test(row.id)||!uuid.test(row.episode))throw Error('기기 연구 사례 형식 오류');
  if(!['measured','accepted','rejected','reverted','deferred'].includes(row.outcome)||!Number.isFinite(Date.parse(row.at)))throw Error('연구 판단 종류 또는 시각 오류');
  if(row.zone!=null&&!['chin','jaw','throat','mid','cheek','rib','breast','lower'].includes(row.zone))throw Error('등록되지 않은 부위');
  return {row,origin:'device',at:row.at};
}
export async function readDeviceCases(db){
  const result=await db.collection('friend_engine_cases').orderBy('at','desc').limit(400).get();
  return result.docs.map(deviceCase);
}
