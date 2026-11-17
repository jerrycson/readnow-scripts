import {isPublishedRelease,latestPublished,publishHostedRelease,renderPublishedSummary} from './published-state.mjs';
import {correctCitation} from '../../pixel-lab/citation37.mjs';
import {mergeNotes35} from './round35.mjs';
import {records34} from './round34.mjs';
import {readBlocks,mergeHistory} from './archives.mjs';
import {mountEvidence54,createPreviousReader54} from './evidence-library54.mjs';
import {choices} from '../../pixel-lab/choice33.mjs';
import {records33} from './round33.mjs';
import {additions} from './round32-cards.mjs';
import {route,library,originals,initReader,showError} from './reader.mjs?v=52-notes';
const query=k=>new URL(location.href).searchParams.get(k)||'';
const validTab=v=>['library','report','board','originals'].includes(v)?v:'library';
const el=id=>document.getElementById(id);
const releases=el('release'), output=el('cards'), frame=el('document');
let history=[], selected='', dataset=[], tab=validTab(query('tab')), key=null, archive=null, generation=0;
let unsubscribe, authUnsub, readerUnsub, busy=false, refreshAgain=false, latestHost=[], cloudRows=new Map(), blockReader=null, authGeneration=0;
let previousReader=null, selectedSource='', privateGeneration=0, archiveSource='';
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const evidence=mountEvidence54(el('evidence54'),hash);
const sourceFor=id=>blockReader && cloudRows.has(id)?'cloud':'hosted';
function clearPrivate(){
  privateGeneration++;archive=null;archiveSource='';evidence(null);frame.removeAttribute('srcdoc');frame.hidden=true;
  el('archiveProvenance').textContent='';el('access').hidden=false;
}
async function get(path,expected){
  const res=await fetch(path,{cache:'no-store'});
  if(!res.ok)throw Error('자료를 읽을 수 없습니다 ('+res.status+')');
  const bytes=await res.arrayBuffer();
  if(expected&&await hash(bytes)!==expected)throw Error('파일 지문이 회차 기록과 다릅니다.');
  return bytes;
}
const decode=bytes=>JSON.parse(new TextDecoder().decode(bytes));
const node=(name,value)=>Object.assign(document.createElement(name),{textContent:value});
function summary(){const requested=query('rev');renderPublishedSummary({published:latestPublished(latestHost),current:history.find(r=>r.id===selected),loadedCount:dataset.length,pinned:history.some(r=>r.id===requested),requested});}
function draw(){
  library(dataset,target=>{tab='originals';route({tab,doc:target.doc,chapter:target.chapter,dq:null},true);documentTab();});
}
const roundPlan=node('a','52~60차 회차별 실행 계획 · 목적과 검토 장면');
roundPlan.href='round-plan51.html';roundPlan.hidden=true;
el('privateTitle').after(roundPlan);
function documentTab(){
  roundPlan.hidden=tab!=='board';
  el('library').hidden=tab!=='library';el('originals').hidden=tab!=='originals';el('private').hidden=!['report','board'].includes(tab);
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  if(tab==='report'||tab==='board')evidence(archive,archive?previousReader:null);
  else{evidence(null);frame.removeAttribute('srcdoc');frame.hidden=true;}
  if(tab==='originals'){originals().catch(showError);return;}if(tab==='library')return;
  el('privateTitle').textContent=tab==='board'?'공동 계획표':'밤샘 연구 보고서';
  const row=history.find(r=>r.id===selected),fallback=history.find(r=>r.id===row?.hostSource);
  el('archiveProvenance').textContent=fallback && (archiveSource||sourceFor(selected))==='hosted' ? row.round+'차에서 보는 '+fallback.round+'차 보존판입니다. 해당 회차에 등록한 관리자 원본은 Firebase 연결로 확인할 수 있습니다.' : row ? row.round+'차 관리자 원문입니다.' : '';
  el('access').hidden=!!archive && !!blockReader;frame.hidden=!archive;
  if(archive && frame.srcdoc!==archive[tab])frame.srcdoc=archive[tab];
}
async function openPrivate(){
  if(!key||!selected)return;
  const seq=++privateGeneration,id=selected,active=history.find(r=>r.id===id),readerKey=key;
  const valid=()=>seq===privateGeneration&&selected===id;
  if(blockReader && cloudRows.has(id)){
    const original=await readBlocks(cloudRows.get(id).docBlocks,blockReader,hash,active.adminSha);
    if(valid()){archive=original;archiveSource='cloud';documentTab();}return;
  }
  const hosted=active.hostSource?history.find(r=>r.id===active.hostSource):active;
  const bytes=new Uint8Array(await get('versions/'+hosted.id+'/admin.bin',hosted.sealedSha));
  if(!valid())return;
  const cryptoKey=await crypto.subtle.importKey('raw',readerKey,{name:'AES-GCM'},false,['decrypt']);
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:new TextEncoder().encode(hosted.id)},cryptoKey,bytes.slice(12));
  if(await hash(clear)!==hosted.adminSha)throw Error('원문 지문 불일치');
  if(valid()){archive=decode(clear);archiveSource='hosted';documentTab();}
}
async function hostedCards(row){
  const source=row.hostSource?history.find(r=>r.id===row.hostSource):row;
  const data=decode(await get('versions/'+source.id+'/cards.json',source.cardsSha));
  if(!row.hostSource)return data;
  const full={...data,cards:[...data.cards,...additions,...(row.round>=33?records33:[]),...(row.round>=34?records34:[])]};
  if(row.round>=35){const notes=decode(await get('../../pixel-lab/notes35.json'));full.cards=mergeNotes35(full.cards,notes);}
  if(row.round>=36){for(const name of ['notes36','engine-notes36'])full.cards.push(...decode(await get('../../pixel-lab/'+name+'.json')));}
  if(row.round>=37){full.cards=full.cards.map(correctCitation);full.cards.push(...decode(await get('../../pixel-lab/notes37.json')));}
  if(row.round>=38){
    const names=['face-note38','chest-note38',...(row.extraHostedNotes||[])];
    if(!names.every(name=>/^[a-z][a-z0-9-]+$/.test(name)))throw Error('연구 원고 경로가 올바르지 않습니다.');
    const studies=await Promise.all(names.map(name=>get('../../pixel-lab/'+name+'.json')));
    for(const study of studies)full.cards.push(...decode(study));
  }
  if(await hash(new TextEncoder().encode(JSON.stringify(full)))!==row.cardsSha)throw Error('추가 연구의 지문이 다릅니다.');
  return full;
}
async function select(id){
  if(!/^[0-9a-f]{24}$/.test(id))throw Error('잘못된 회차 주소');
  const seq=++generation, row=history.find(r=>r.id===id), source=sourceFor(id);
  clearPrivate();selected='';selectedSource='';previousReader=blockReader?makePreviousReader():null;
  const reply=source==='cloud' ? await readBlocks(cloudRows.get(id).cardBlocks,blockReader,hash,row.cardsSha) : await hostedCards(row);
  if(seq!==generation)return;
  selected=id;selectedSource=source;releases.value=id;syncEditions();dataset=reply.cards;
  const previous=query('group');
  el('group').replaceChildren(new Option('전체 분야',''),...[...new Set(dataset.map(x=>x.group))].map(x=>new Option(x,x)));
  if([...el('group').options].some(x=>x.value===previous))el('group').value=previous;
  el('editionInfo').textContent=row.round+'차 · '+dataset.length+'개 자료';summary();draw();documentTab();await openPrivate();
}
async function refresh(){
  if(busy){refreshAgain=true;return;}busy=true;
  try{
    try{const rows=decode(await get('releases.json')).releases;if(!latestPublished(rows))throw Error('공개 목록에 유효한 책방 친구 회차가 없습니다.');latestHost=rows.filter(isPublishedRelease);publishHostedRelease(rows);}catch(e){if(!cloudRows.size)throw e;}
    const list=mergeHistory(latestHost,cloudRows);
    if(!list.length)throw Error('아직 등록된 회차가 없습니다.');
    history=list;const latest=latestPublished(list);if(!latest)throw Error('열 수 있는 책방 친구 회차가 없습니다.');
    releases.replaceChildren(...list.map((r,i)=>new Option((i+1)+' · '+r.label+' · '+r.at.slice(0,10),r.id)));
    const pinned=list.find(r=>r.id===query('rev'));
    const desired=pinned?.id||latest.id;
    if(desired!==selected || selectedSource!==sourceFor(desired))await select(desired);
    else releases.value=selected;
    syncEditions();summary();
    el('connection').textContent=(blockReader?'Firestore 구독 · ':(['localhost','127.0.0.1'].includes(location.hostname)?'로컬 미리보기 · ':'웹 게시 자료 · '))+(latest.sources?latest.sources+'개 출처 · ':'')+'마지막 확인 '+new Date().toLocaleTimeString('ko-KR');
  }finally{busy=false;if(refreshAgain){refreshAgain=false;queueMicrotask(()=>refresh().catch(failure));}}
}
function failure(e){el('connection').textContent='갱신 확인 필요 · '+e.message;}
function keyBytes(value){const b=Uint8Array.from(atob(value),x=>x.charCodeAt(0));if(b.length!==32)throw Error('열람 파일 형식을 확인해 주세요.');return b;}
let releaseReader=null;
function makePreviousReader(){return createPreviousReader54({release:releaseReader,block:blockReader,hash});}
function endSession(){
  authGeneration++;generation++;
  authUnsub?.();unsubscribe?.();readerUnsub?.();authUnsub=unsubscribe=readerUnsub=null;
  blockReader=releaseReader=previousReader=null;cloudRows=new Map();key=null;
  clearPrivate();el('lockPrivate').hidden=true;
}
function revoked(message){
  endSession();selected='';selectedSource='';documentTab();
  el('feedback').textContent=message;refresh().catch(failure);
}
el('lockPrivate').onclick=()=>revoked('이 화면의 관리자 자료를 닫았습니다.');
el('key').onchange=async e=>{
  const chosen=e.target.files[0];if(!chosen)return;
  endSession();el('feedback').textContent='';const session=authGeneration;
  try{
    const data=JSON.parse(await chosen.text());if(session!==authGeneration)return;
    key=keyBytes(data.key||data.reader?.key);el('lockPrivate').hidden=false;
    if(selectedSource==='cloud'){await select(selected);}else await openPrivate();
  }catch{
    if(session===authGeneration){endSession();el('feedback').textContent='이 회차에 맞는 관리자 열람 파일을 선택해 주세요.';}
  }finally{e.target.value='';}
};
el('cloud').onclick=async()=>{
  endSession();el('feedback').textContent='';const session=authGeneration;
  const current=()=>session===authGeneration;
  try{
    const sdk='https://www.gstatic.com/firebasejs/10.12.2/';
    const [a,b,c]=await Promise.all([import(sdk+'firebase-app.js'),import(sdk+'firebase-auth.js'),import(sdk+'firebase-firestore.js')]);
    const config=decode(await get('/__/firebase/init.json'));
    if(!current())return;
    if(config.projectId!=='readnow-3a385')throw Error('Firebase 프로젝트가 다릅니다.');
    const app=a.getApps().length?a.getApp():a.initializeApp(config);
    const auth=b.getAuth(app);await auth.authStateReady();if(!current())return;
    if(!auth.currentUser)await b.signInWithPopup(auth,new b.GoogleAuthProvider());
    if(!current())return;
    const db=c.getFirestore(app,'readnow-research'),uid=auth.currentUser.uid;
    const reader=c.doc(db,'readers',uid),access=await c.getDocFromServer(reader);
    if(!current())return;
    if(auth.currentUser?.uid!==uid||!access.exists())throw Error('등록된 연구실 관리자 계정이 필요합니다.');
    key=keyBytes(access.data().key);el('lockPrivate').hidden=false;
    const read=async(col,id)=>{
      if(!current()||auth.currentUser?.uid!==uid)throw Error('관리자 연결이 종료되었습니다.');
      try{
        const doc=await c.getDocFromServer(c.doc(db,col,id));
        if(!current()||auth.currentUser?.uid!==uid)throw Error('관리자 연결이 종료되었습니다.');
        return doc;
      }catch(e){
        if(current()&&e.code==='permission-denied')revoked('관리자 열람 권한이 해제되었습니다.');
        throw e;
      }
    };
    blockReader=async id=>{
      const block=await read('blobs',id);
      if(!block.exists())throw Error('원문 조각이 보이지 않습니다.');
      return block.data().payload.toUint8Array();
    };
    releaseReader=async id=>{const doc=await read('releases',id);return doc.exists()?doc.data():null;};
    previousReader=makePreviousReader();
    const onError=e=>{
      if(!current())return;
      if(e.code==='permission-denied'||e.code==='unauthenticated'){revoked('관리자 열람 권한을 확인할 수 없어 자료를 닫았습니다.');return;}
      failure(e);
    };
    authUnsub=b.onAuthStateChanged(auth,user=>{if(current()&&user?.uid!==uid)revoked('계정이 바뀌어 관리자 자료를 닫았습니다.');});
    readerUnsub=c.onSnapshot(reader,snap=>{
      if(!current()||snap.metadata.fromCache)return;
      if(!snap.exists()||snap.data().key!==access.data().key)revoked('관리자 열람 권한이 변경되어 자료를 닫았습니다.');
    },onError);
    unsubscribe=c.onSnapshot(c.query(c.collection(db,'releases'),c.where('project','==','bookfriend')),snap=>{
      if(!current()||snap.metadata.fromCache)return;
      cloudRows=new Map(snap.docs.map(d=>[d.id,d.data()]));
      if(selected && selectedSource!==sourceFor(selected))clearPrivate();
      // 선택이 이미 같은 게시 회차여도 인증 원문으로 전환한다.
      refresh().then(()=>{if(current()&&key&&selected&&!archive&&sourceFor(selected)==='hosted')return openPrivate();}).catch(failure);
    },onError);
  }catch(e){if(current()){endSession();el('feedback').textContent='연결 확인 · '+(e.code||e.message);}}
};
initReader();
const syncDocs=choices(el('doc'),el('docChoices'));
el('doc').addEventListener('choice-sync',syncDocs);
const syncEditions=choices(releases,el('editions'),opt=>opt.text.match(/(\d+)차/)?.[0]||opt.text);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();(tab==='originals'?el('docSearch'):el('search')).focus();}});
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;route({tab},true);documentTab();});
el('search').oninput=el('group').onchange=()=>{route({q:el('search').value,group:el('group').value,card:null});el('reading').closest('.split').classList.remove('inspecting');draw();};
releases.onchange=()=>{const id=releases.value;route({rev:id===latestPublished(history)?.id?null:id,card:null},true);select(id).catch(failure);};
el('followLatest').onclick=()=>{route({rev:null,card:null},true);summary();refresh().catch(failure);};
window.addEventListener('popstate',async()=>{
  tab=validTab(query('tab'));el('search').value=query('q');el('group').value=query('group');
  el('reading').closest('.split').classList.toggle('inspecting',!!query('card'));el('originalBody').closest('.split').classList.toggle('inspecting',!!query('chapter'));
  const id=query('rev')||latestPublished(history)?.id;
  if(id&&id!==selected&&history.some(r=>r.id===id))await select(id).catch(failure);else{draw();documentTab();}summary();
});
documentTab();
setInterval(()=>{if(!document.hidden)refresh().catch(failure);},15000);
el('search').value=new URLSearchParams(location.search).get('q')||'';
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(failure);});
window.addEventListener('online',()=>refresh().catch(failure));
window.addEventListener('pageshow',e=>{if(e.persisted)refresh().catch(failure);});
refresh().catch(failure);

