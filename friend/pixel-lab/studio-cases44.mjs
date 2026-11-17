import {applyCorrections57} from './studio-corrections57.mjs?v=57-correction';
import {applyObservations57} from './studio-observation57.mjs?v=57-diagnostic';
// 공개 회차 레지스트리의 지문이 맞는 구조화 기록만 불러온다.
export async function publishedEvidence(){
 const registry=new URL('../research/hub/releases.json',import.meta.url),resp=await fetch(registry,{cache:'no-store'});if(!resp.ok)throw Error('회차 목록 응답 '+resp.status);
 const {releases}=await resp.json(),sets=(releases||[]).filter(r=>r.project==='bookfriend'&&r.learningEvidence).map(r=>r.learningEvidence);
 const out=new Map();for(const item of sets){
   if(!/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(item.file)||!/^[a-f0-9]{64}$/.test(item.sha256))throw Error('공개 사례의 경로 또는 지문 오류');
   const response=await fetch(new URL(item.file,import.meta.url),{cache:'no-store'});if(!response.ok)throw Error('학습 자료 읽기 실패');
   const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);const hex=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
   if(hex!==item.sha256)throw Error('학습 자료 지문 불일치');
   const rows=JSON.parse(new TextDecoder().decode(bytes));if(!Array.isArray(rows))throw Error('지원하지 않는 사례 데이터');
   for(const r of applyObservations57(applyCorrections57(rows,item),item)){const prior=out.get(r.id);if(prior&&JSON.stringify(prior)!==JSON.stringify(r))throw Error('동일 식별자의 연구 기록이 다릅니다.');out.set(r.id,r);}
 }return [...out.values()];
}
