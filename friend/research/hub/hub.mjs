import {readBlocks,mergeHistory} from './archives.mjs';
const el=id=>document.getElementById(id);
const releases=el('release'), output=el('cards'), frame=el('document');
let history=[], selected='', dataset=[], limit=18, tab='library', key=null, archive=null, generation=0;
let unsubscribe, authUnsub, busy=false, refreshAgain=false, latestHost=[], cloudRows=new Map(), blockReader=null, authGeneration=0;
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
async function get(path,expected){
  const res=await fetch(path,{cache:'no-store'});
  if(!res.ok)throw Error('자료를 읽을 수 없습니다 ('+res.status+')');
  const bytes=await res.arrayBuffer();
  if(expected&&await hash(bytes)!==expected)throw Error('파일 지문이 회차 기록과 다릅니다.');
  return bytes;
}
const decode=bytes=>JSON.parse(new TextDecoder().decode(bytes));
const node=(name,value)=>Object.assign(document.createElement(name),{textContent:value});
function draw(){
  const q=el('search').value.trim().toLocaleLowerCase(),group=el('group').value;
  const rows=dataset.filter(r=>(!group||r.group===group)&&(!q||[r.title,r.line,r.unit,r.detail].join(' ').toLocaleLowerCase().includes(q)));
  el('count').textContent=rows.length+'개 자료 · '+Math.min(limit,rows.length)+'개 표시';
  output.replaceChildren();
  for(const r of rows.slice(0,limit)){
    const article=node('article',''), details=node('details',''),summary=node('summary','');
    summary.append(node('b',r.title),node('small',r.group+' · '+r.line));details.append(summary,node('h3','한 단원 요약'),node('p',r.unit),node('h3','상세 설명'),node('pre',r.detail));
    for(const [label,href] of [['원전 열기',r.url],['연구 원문·비교 보기',r.local]]){
      if(!href)continue;
      const url=new URL(href,location.href);
      if(url.protocol!=='https:'&&url.origin!==location.origin)continue;
      const link=node('a',label);link.href=url.href;link.target='_blank';link.rel='noopener';details.append(link,document.createTextNode('　'));
    }
    article.append(details);output.append(article);
  }
  el('more').hidden=rows.length<=limit;
}
function documentTab(){
  el('library').hidden=tab!=='library';el('private').hidden=tab==='library';
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  if(tab==='library')return;
  el('privateTitle').textContent=tab==='board'?'공동 계획표':'밤샘 연구 보고서';
  el('access').hidden=!!archive;frame.hidden=!archive;
  if(archive)frame.srcdoc=archive[tab];
}
async function openPrivate(){
  if(!key||!selected)return;
  const id=selected, active=history.find(r=>r.id===id);
  if(blockReader && cloudRows.has(id)){
    const authVersion=authGeneration;const original=await readBlocks(cloudRows.get(id).docBlocks,blockReader,hash,active.adminSha);
    if(authVersion===authGeneration && selected===id){archive=original;documentTab();}return;
  }
  const bytes=new Uint8Array(await get('versions/'+id+'/admin.bin',active.sealedSha));
  const cryptoKey=await crypto.subtle.importKey('raw',key,{name:'AES-GCM'},false,['decrypt']);
  const authVersion=authGeneration;
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:new TextEncoder().encode(id)},cryptoKey,bytes.slice(12));
  if(await hash(clear)!==active.adminSha)throw Error('원문 지문 불일치');
  if(authVersion===authGeneration&&selected===id){archive=decode(clear);documentTab();}
}
async function select(id){
  if(!/^[0-9a-f]{24}$/.test(id))throw Error('잘못된 회차 주소');
  const seq=++generation, row=history.find(r=>r.id===id);
  const reply=blockReader && cloudRows.has(id) ? await readBlocks(cloudRows.get(id).cardBlocks,blockReader,hash,row.cardsSha) : decode(await get('versions/'+id+'/cards.json',row.cardsSha));
  if(seq!==generation)return;
  selected=id; releases.value=id;archive=null;frame.removeAttribute('srcdoc');dataset=reply.cards;
  const previous=el('group').value;
  el('group').replaceChildren(new Option('전체 분야',''),...[...new Set(dataset.map(x=>x.group))].map(x=>new Option(x,x)));
  if([...el('group').options].some(x=>x.value===previous))el('group').value=previous;
  limit=18;draw();documentTab();await openPrivate();
}
async function refresh(){
  if(busy){refreshAgain=true;return;}busy=true;
  try{
    try{latestHost=decode(await get('releases.json')).releases;}catch(e){if(!cloudRows.size)throw e;}
    const list=mergeHistory(latestHost,cloudRows);
    if(!list.length)throw Error('아직 등록된 회차가 없습니다.');
    const follow=!selected||selected===history.at(-1)?.id;
    history=list;const latest=list.at(-1);
    releases.replaceChildren(...list.map((r,i)=>new Option((i+1)+' · '+r.label+' · '+r.at.slice(0,10),r.id)));
    if((follow&&latest.id!==selected)||!list.some(v=>v.id===selected))await select(latest.id);else releases.value=selected;
    el('connection').textContent=(blockReader?'Firestore 구독 · ':'Firebase Hosting · ')+(latest.sources?latest.sources+'개 출처 · ':'')+'마지막 확인 '+new Date().toLocaleTimeString('ko-KR');
  }finally{busy=false;if(refreshAgain){refreshAgain=false;queueMicrotask(()=>refresh().catch(failure));}}
}
function failure(e){el('connection').textContent='갱신 확인 필요 · '+e.message;}
function keyBytes(value){const b=Uint8Array.from(atob(value),x=>x.charCodeAt(0));if(b.length!==32)throw Error('열람 파일 형식을 확인해 주세요.');return b;}
el('key').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());key=keyBytes(data.key||data.reader?.key);await openPrivate();}catch{key=null;el('feedback').textContent='이 회차에 맞는 관리자 열람 파일을 선택해 주세요.';}finally{e.target.value='';}};
el('cloud').onclick=async()=>{
  try{
    const sdk='https://www.gstatic.com/firebasejs/10.12.2/';
    const [a,b,c]=await Promise.all([import(sdk+'firebase-app.js'),import(sdk+'firebase-auth.js'),import(sdk+'firebase-firestore.js')]);
    const config=decode(await get('/__/firebase/init.json'));
    if(config.projectId!=='readnow-3a385')throw Error('Firebase 프로젝트가 다릅니다.');
    const app=a.getApps().length?a.getApp():a.initializeApp(config);
    const auth=b.getAuth(app);await auth.authStateReady();if(!auth.currentUser)await b.signInWithPopup(auth,new b.GoogleAuthProvider());
    const db=c.getFirestore(app,'readnow-research'), uid=auth.currentUser.uid;
    const access=await c.getDocFromServer(c.doc(db,'readers',uid));if(!access.exists())throw Error('등록된 연구실 관리자 계정이 필요합니다.');
    key=keyBytes(access.data().key);await openPrivate();
    unsubscribe?.();authUnsub?.();const session=++authGeneration;
    blockReader=async id=>{
      const block=await c.getDocFromServer(c.doc(db,'blobs',id));
      if(!block.exists())throw Error('원문 조각이 보이지 않습니다.');
      return block.data().payload.toUint8Array();
    };
    unsubscribe=c.onSnapshot(c.query(c.collection(db,'releases'),c.where('project','==','bookfriend')),snap=>{
      if(session!==authGeneration||snap.metadata.fromCache)return;
      cloudRows=new Map(snap.docs.map(d=>[d.id,d.data()]));
      refresh().catch(failure);
    },e=>{el('connection').textContent='Firestore 연결 상태 확인 · '+e.code;});
    authUnsub=b.onAuthStateChanged(auth,user=>{if(user?.uid!==uid){
      authGeneration++;generation++;unsubscribe?.();blockReader=null;cloudRows.clear();key=null;archive=null;selected='';frame.removeAttribute('srcdoc');documentTab();refresh().catch(failure);
    }});
  }catch(e){el('feedback').textContent='연결 확인 · '+(e.code||e.message);}
};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;documentTab();});
el('search').oninput=el('group').onchange=()=>{limit=18;draw();};
el('more').onclick=()=>{limit+=18;draw();};releases.onchange=()=>select(releases.value).catch(failure);
setInterval(()=>{if(!document.hidden)refresh().catch(failure);},15000);
el('search').value=new URLSearchParams(location.search).get('q')||'';
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(failure);});
refresh().catch(failure);

