// Run with Node 20+ in an authenticated Google Cloud Shell.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
const project='readnow-3a385', database='readnow-research';
const pack=JSON.parse(await readFile(process.argv[2]||'bookfriend-import.json','utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
const facts=Buffer.from(JSON.stringify({schema:1,cards:pack.facts})), docs=Buffer.from(JSON.stringify(pack.archive));
assert.equal(pack.project,project);assert.equal(pack.release.project,'bookfriend');assert.equal(digest(facts),pack.release.cardsSha);assert.equal(digest(docs),pack.release.adminSha);
assert.equal(digest(Buffer.concat([facts,docs])).slice(0,24),pack.release.id);
if(process.argv.includes('--verify-only')){console.log('가져오기 자료와 원문 지문 확인');process.exit();}
const prompt=createInterface({input:process.stdin,output:process.stdout});
const uid=(process.env.RESEARCH_READER_UID||await prompt.question('Firebase Console → Authentication → Users의 열람자 UID: ')).trim();prompt.close();
assert.match(uid,/^[a-zA-Z0-9_-]{1,128}$/);
const token=execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8'}).trim();
const hdr={Authorization:'Bearer '+token,'Content-Type':'application/json'};
async function api(url,options={},allow=[]){
 const r=await fetch(url,{...options,headers:hdr});const raw=await r.text();let data={};try{data=raw?JSON.parse(raw):{};}catch{data={error:{message:raw.slice(0,240)}};}
 if(!r.ok&&!allow.includes(r.status))throw Error('Google API '+r.status+' '+(data.error?.status||'오류')+' '+(data.error?.message||'').slice(0,240));
 return {status:r.status,data};
}
const base='https://firestore.googleapis.com/v1/projects/'+project+'/databases/'+database;
if((await api(base,{},[404])).status===404){
 execFileSync('gcloud',['firestore','databases','create','--project='+project,'--database='+database,'--location=asia-northeast3','--type=firestore-native','--delete-protection','--quiet'],{stdio:'inherit'});
}
const db=await api(base);
assert.equal(db.data.name.split('/').at(-1),database);
const rules="rules_version = '2';\nservice cloud.firestore { match /databases/{db}/documents {\n match /readers/{uid} { allow get: if request.auth != null && request.auth.uid == uid; }\n match /releases/{id} { allow read: if request.auth != null && exists(/databases/$(db)/documents/readers/$(request.auth.uid)); }\n match /blobs/{id} { allow get: if request.auth != null && exists(/databases/$(db)/documents/readers/$(request.auth.uid)); }\n} }";
const rulesApi='https://firebaserules.googleapis.com/v1/';
const releaseName='projects/'+project+'/releases/cloud.firestore/'+database;
let ruleRelease=await api(rulesApi+releaseName,{},[404]);
if(ruleRelease.status===404){
 const created=await api(rulesApi+'projects/'+project+'/rulesets',{method:'POST',body:JSON.stringify({source:{files:[{name:'firestore.rules',content:rules}]}})});
 await api(rulesApi+'projects/'+project+'/releases',{method:'POST',body:JSON.stringify({name:releaseName,rulesetName:created.data.name})},[409]);
 ruleRelease=await api(rulesApi+releaseName);
}
const actual=await api(rulesApi+ruleRelease.data.rulesetName);
assert.equal(actual.data.source.files.length,1,'기존 전용 DB의 규칙이 다릅니다. 덮어쓰기 전에 관리자가 확인해야 합니다.');
assert.equal(actual.data.source.files[0].content.trim(),rules.trim(),'기존 규칙을 보존했습니다. 권한 범위를 먼저 확인하세요.');
async function createOnly(collection,id,fields){
 const url=base+'/documents/'+collection;
 await api(url+'?documentId='+encodeURIComponent(id),{method:'POST',body:JSON.stringify({fields})},[409]);
 const stored=await api(url+'/'+encodeURIComponent(id));if(!isDeepStrictEqual(stored.data.fields,fields))throw Error('같은 ID의 내용이 다릅니다. 기존 자료를 보존하고 중단했습니다.');
}
async function blocks(bytes){
 const ids=[];for(let i=0;i<bytes.length;i+=240000){
  const block=bytes.subarray(i,i+240000),id=digest(block);
  await createOnly('blobs',id,{payload:{bytesValue:block.toString('base64')}});
  ids.push({stringValue:id});
 }
 return {arrayValue:{values:ids}};
}
const cardBlocks=await blocks(facts),docBlocks=await blocks(docs);
await createOnly('readers',uid,{key:{stringValue:pack.reader.key}});
await createOnly('releases',pack.release.id,{at:{stringValue:new Date(pack.release.at).toISOString()},project:{stringValue:'bookfriend'},cardsSha:{stringValue:digest(facts)},adminSha:{stringValue:digest(docs)},cardBlocks,docBlocks});
console.log('Firestore 서버 재조회 완료 · '+pack.release.id+' · 원전 '+pack.release.sources+'개');

