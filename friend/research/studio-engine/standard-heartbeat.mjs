const endpoint='https://firestore.googleapis.com/v1/projects/readnow-3a385/databases/readnow-research/documents/friend_engine_public/';
const todayKst=ms=>new Date(ms+9*3600000).toISOString().slice(0,10);
export async function publicHeartbeat({clock=Date.now(),request=fetch}={}){
 const attempts=[];
 for(const ms of [clock,clock-86400000]){
  const day=todayKst(ms);
  try{
   const res=await request(endpoint+day,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(7000)});
   if(!res.ok){attempts.push({day,status:res.status});continue;}
   const doc=await res.json(),f=doc.fields||{};
   if(doc.name!=='projects/readnow-3a385/databases/readnow-research/documents/friend_engine_public/'+day)throw Error('날짜 문서 불일치');
   const at=f.at?.stringValue;if(!at||!Number.isFinite(Date.parse(at))||Date.parse(at)>clock||todayKst(Date.parse(at))!==day)throw Error('요약 시각 불일치');
   const counts=(k)=>{const x=f[k]?.integerValue;if(!/^(?:0|[1-9]\d*)$/.test(String(x))||!Number.isSafeInteger(Number(x)))throw Error('수치 오류');return Number(x);};
   const values={};for(const [id,k] of [['friend-studio','studio'],['friend-photo','photo']]){
    const state=f[k+'State']?.stringValue;if(typeof state!=='string'||!state.length||state.length>60)throw Error('상태 오류');
    values[id]={state,count:counts(k+'Count'),humanPairs:counts(k+'HumanPairs')};
   }
   return {ok:true,at,day,values,attempts};
  }catch{attempts.push({day,status:'미확인'});}
 }
 return {ok:false,attempts};
}
