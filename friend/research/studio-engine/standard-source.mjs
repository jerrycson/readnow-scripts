import {entries} from '../../pixel-lab/studio-evidence44.mjs';
import {studyOf} from './standard.mjs?v=57-diagnostic';
import {applyCorrections57} from '../../pixel-lab/studio-corrections57.mjs?v=57-correction';
import {applyObservations57} from '../../pixel-lab/studio-observation57.mjs?v=57-diagnostic';
const lab=new URL('../../pixel-lab/',import.meta.url);
async function fetchJSON(url){
 const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('자료 응답 '+res.status);
 return res.json();
}
async function releaseRows(){
 const manifest=await fetchJSON(new URL('../hub/releases.json',import.meta.url));
 if(!Array.isArray(manifest.releases))throw Error('회차 목록 형식 오류');
 const rows=new Map();
 for(const rel of manifest.releases.filter(r=>r.project==='bookfriend'&&r.learningEvidence).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){
  const file=rel.learningEvidence;
  if(!/^studio-training[0-9]+(?:-r[1-9][0-9]*)?\.json$/.test(file.file)||!/^[a-f0-9]{64}$/.test(file.sha256)||!Number.isFinite(Date.parse(rel.at)))throw Error('공개 근거 경로·지문·시각 오류');
  const res=await fetch(new URL(file.file,lab),{cache:'no-store'});if(!res.ok)throw Error('공개 사례 응답 '+res.status);
  const bytes=await res.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==file.sha256)throw Error('공개 사례 지문 불일치');
  const items=JSON.parse(new TextDecoder().decode(bytes));if(!Array.isArray(items))throw Error('공개 사례 목록 형식 오류');
  for(const row of applyObservations57(applyCorrections57(items,file),file)){const old=rows.get(row.id);if(old&&JSON.stringify(row)!==JSON.stringify(old.row))throw Error('공개 기록 ID 충돌');if(!old)rows.set(row.id,{row,at:rel.at,origin:'release'});}
 }
 return [...rows.values()];
}
export function createReader(){
 const shared=new Map();
 function packet(retry){if(!shared.has(retry))shared.set(retry,Promise.all([releaseRows(),entries()]));return shared.get(retry);}
 return async(study,{retry=false}={})=>{
  const [seeds,device]=await packet(retry);
  const rows=[...seeds,...device.map(row=>({row,at:row.at,origin:'device'}))].filter(r=>studyOf(r.row)===study);
  const ref=await fetchJSON(new URL(study==='friend-photo'?'photo-eval44.json':'studio-sculpt-eval44.json',lab));
  let reference;
  if(study==='friend-photo'){
   if(ref.version!=='photo-ridge44-v1'||![ref.training?.observations,ref.training?.measuredHeads,ref.test?.measuredHeads,ref.test?.userApprovedExamples].every(Number.isInteger))throw Error('사진 검증 자료의 표본 수 미확인');
   reference={train:ref.training.observations,trainedScan:ref.training.measuredHeads,scans:ref.test.measuredHeads,approved:ref.test.userApprovedExamples};
  }else{
   if(ref.version!==44||![ref.trainSamples,ref.evaluated,ref.offered?.count].every(Number.isInteger))throw Error('조형 검증 자료의 표본 수 미확인');
   reference={train:ref.trainSamples,test:ref.evaluated,offered:ref.offered.count};
  }
  return {rows,reference,materialTimes:[]};
 };
}
let opened;
function openLedger(){
 if(!opened)opened=new Promise((resolve,reject)=>{const req=indexedDB.open('bookfriend-standard-rounds-v1',2);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('rounds'))db.createObjectStore('rounds',{keyPath:'id'});if(!db.objectStoreNames.contains('records'))db.createObjectStore('records',{keyPath:'decision.id'});};req.onblocked=()=>{opened=null;reject(Error('다른 창에서 일지 저장소 사용 중'));};
  req.onerror=()=>{opened=null;reject(req.error);};req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();opened=null;};resolve(db);};
 });return opened;
}
export async function rounds(){const db=await openLedger();return new Promise((resolve,reject)=>{const q=db.transaction('rounds').objectStore('rounds').getAll();q.onsuccess=()=>resolve(q.result.sort((a,b)=>a.at.localeCompare(b.at)));q.onerror=()=>reject(q.error);});}
export async function appendRound(log,records=[]){
 const db=await openLedger();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['rounds','records'],'readwrite'),store=tx.objectStore('records');let clash=false;
  tx.objectStore('rounds').add(log);
  for(const record of records){const q=store.get(record.decision.id);q.onsuccess=()=>{
   if(q.result){if(JSON.stringify(q.result)!==JSON.stringify(record)){clash=true;tx.abort();}}else store.add(record);
  };}
  tx.oncomplete=()=>resolve();tx.onabort=()=>reject(Error(clash?'이미 보존된 결정 ID의 내용이 달라졌습니다.':'일지와 공통 기록을 함께 저장하지 못했습니다.'));
 });
}
