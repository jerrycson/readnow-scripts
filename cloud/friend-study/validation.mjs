// 블라인드 짝은 관리자 검토를 거친 별도 원전이다. 같은 원본·조건을 여러 날의 성과로 다시 쓰지 않는다.
const keyPattern=/^[a-zA-Z0-9_-]{4,128}$/;
export function verifiedDays(pairs,study,now){
  const seen=new Set(),result=new Map();
  for(const v of [...pairs].sort((a,b)=>String(a.closedAt).localeCompare(String(b.closedAt)))){
    if(v.study!==study||v.blind!==true||!keyPattern.test(v.sourceKey)||!keyPattern.test(v.conditionKey)||typeof v.sourceKey!=='string'||typeof v.conditionKey!=='string')continue;
    const time=Date.parse(v.closedAt),humanAt=Date.parse(v.humanCommittedAt),shown=Date.parse(v.candidateShownAt);
    if(!Number.isFinite(time)||!Number.isFinite(humanAt)||!Number.isFinite(shown)||humanAt>=shown||shown>time||time>Date.parse(now))continue;
    if(!Number.isFinite(v.engineError)||!Number.isFinite(v.humanError)||v.engineError<0||v.humanError<0||v.unit!=='px'||!keyPattern.test(v.candidate)||typeof v.candidate!=='string')continue;
    const key=v.sourceKey+'|'+v.conditionKey,day=new Date(time).toISOString().slice(0,10);
    if(seen.has(key))continue;seen.add(key);
    const e=result.get(day)||{day,pairs:0,engine:0,human:0,independent:true,sameCondition:true};
    e.engine+=v.engineError;e.human+=v.humanError;e.pairs++;result.set(day,e);
  }
  return [...result.values()].filter(g=>g.human>0).map(g=>({...g,engine:g.engine/g.pairs,human:g.human/g.pairs}));
}
export async function validationState(db,study,now){
  const cfg=await db.collection('friend_engine_policies').doc(study).get();
  const previousSnap=await db.collection('friend_engine_stage_'+study).orderBy('at','desc').limit(1).get();
  const previous=previousSnap.docs[0]?.data()??null;
  if(!cfg.exists)return {previous,policy:null,days:[],shadowSince:previous?.shadowSince??null};
  const spec=cfg.data(),policy=spec.policy;
  if(typeof spec.candidate!=='string'||!keyPattern.test(spec.candidate)||!Number.isInteger(policy?.minPairs)||policy.minPairs<1||!Number.isInteger(policy.kDays)||policy.kDays<3||policy.kDays>30||!Number.isFinite(policy.minGain)||policy.minGain<0||policy.minGain>=1)throw Error('엔진 검증 정책 오류');
  const snapshot=await db.collection('friend_engine_pairs_'+study).orderBy('closedAt','desc').limit(1000).get();
  const same=previous?.candidate===spec.candidate;
  const days=verifiedDays(snapshot.docs.map(doc=>doc.data()).filter(v=>v.candidate===spec.candidate),study,now);
  return {previous:same?previous:null,policy,days,shadowSince:same?previous.shadowSince:null,candidate:spec.candidate};
}
