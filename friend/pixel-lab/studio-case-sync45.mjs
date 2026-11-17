import {entries} from './studio-evidence44.mjs';
import {publicCase,firebaseEditor} from './studio-case-wire45.mjs';

function receiptStore(){
  let opened;
  function database(){
    if(!opened){
      opened=new Promise((resolve,reject)=>{
        const q=indexedDB.open('bookfriend-central-case-receipts-v1',1);
        q.onupgradeneeded=()=>q.result.createObjectStore('confirmed');
        q.onsuccess=()=>{const db=q.result;db.onversionchange=()=>{db.close();opened=null;};resolve(db);};
        q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('기기 확인 장부가 다른 탭에 열려 있습니다.'));
      }).catch(e=>{opened=null;throw e;});
    }
    return opened;
  }
  return {
    async all(){
      const db=await database();
      return new Promise((ok,fail)=>{const r=db.transaction('confirmed').objectStore('confirmed').getAll();r.onsuccess=()=>ok(new Map(r.result.map(row=>[row.id,row.payload])));r.onerror=()=>fail(r.error);});
    },
    async confirm(id,payload){
      const db=await database();
      return new Promise((ok,fail)=>{const t=db.transaction('confirmed','readwrite');t.objectStore('confirmed').put({id,payload},id);t.oncomplete=()=>ok();t.onabort=()=>fail(t.error);});
    }
  };
}
const roleErrors=new Set(['unauthenticated','permission-denied','wrong-project','account-changed']);
const preferenceKey='bookfriend-central-cases-opt-in45',digest=/^[0-9a-f]{64}$/;
function readPreference(){
  try{
    const p=JSON.parse(localStorage.getItem(preferenceKey));
    return p?.v===1&&digest.test(p.accountHash)&&(p.sessionHash===null||digest.test(p.sessionHash))?p:null;
  }catch{return null;}
}
function remember(principal){
  if(!principal||!digest.test(principal.accountHash))return false;
  try{localStorage.setItem(preferenceKey,JSON.stringify({v:1,accountHash:principal.accountHash,sessionHash:principal.sessionHash??null}));return true;}catch{return false;}
}
function forget(matching){
  try{if(!matching||readPreference()?.accountHash===matching.accountHash)localStorage.removeItem(preferenceKey);}catch{}
}
export function mountCaseSync(host,{source=entries,connect=firebaseEditor,receipts=receiptStore(),retryMs=2000}={}){
  const panel=document.createElement('section'),h=document.createElement('h3'),desc=document.createElement('p'),output=document.createElement('output');
  const start=document.createElement('button'),stop=document.createElement('button'),retry=document.createElement('button');
  panel.className='engine-controls';panel.dataset.centralCases='';h.textContent='측정·선택의 중앙 연구 기록';
  desc.textContent='시작하면 이 기기의 전후 오차·부위·촬영각·명시적 선택과 사례 번호·시각을 중앙 장부와 맞춥니다. 다음 방문에도 같은 관리자 계정과 편집 권한을 확인해 이어갑니다. 멈춤·로그아웃·계정 변경은 자동 재개를 해제합니다.';
  start.textContent='동기화 시작';stop.textContent='멈춤';retry.textContent='다시 확인';for(const b of [start,stop,retry])b.type='button';
  output.setAttribute('role','status');output.setAttribute('aria-live','polite');output.style.display='block';
  panel.append(h,desc,start,stop,retry,output);host.append(panel);
  let enabled=false,generation=0,editor=null,timer=null,rerun=false,backoff=retryMs,activeRun=null;
  let channel,expected=null,durable=false;
  const display=msg=>{start.disabled=enabled;stop.disabled=!enabled;retry.disabled=!enabled;output.textContent=msg;};
  function halt(msg='동기화를 멈췄습니다. 기기 기록은 보존됩니다.'){
    enabled=false;generation++;clearTimeout(timer);timer=null;rerun=false;editor?.close();editor=null;
    display(msg);
  }
  function later(ms){
    if(!enabled)return;
    clearTimeout(timer);timer=setTimeout(()=>{timer=null;kick();},ms);
  }
  async function drain(token){
    const current=()=>enabled&&token===generation&&(!expected||!durable||readPreference()?.accountHash===expected.accountHash);
    const [rows,known]=await Promise.all([source('cases'),receipts.all()]);
    if(!current())return;
    const pending=[];let confirmed=0,invalid=0,conflicts=0;
    for(const row of rows){
      let item;
      try{item=publicCase(row);}catch{invalid++;continue;}
      if(!item)continue;
      const payload=JSON.stringify(item);
      if(!known.has(item.id))pending.push({item,payload});
      else if(known.get(item.id)===payload)confirmed++;
      else conflicts++;
    }
    if(!navigator.onLine){display('오프라인 · 기기에서 기다리는 사례 '+pending.length+'건. 연결이 돌아오면 재시도합니다.');return;}
    if(!editor){
      display('기존 관리자 세션과 중앙 사례 편집 권한을 확인하고 있습니다.');
      const next=await connect({active:current,expected,onAccountChange:()=>{if(current()){if(expected)forget(expected);halt('계정이 바뀌어 자동 재개를 해제했습니다. 다시 시작하세요.');}}});
      if(!current()){next.close();return;}
      expected=next.principal;
      durable=remember(expected);
      editor=next;
    }
    for(const {item,payload} of pending){
      if(!current())return;
      try{
        await editor.putVerified(item);
        if(!current())return;
        await receipts.confirm(item.id,payload);
        confirmed++;
      }catch(e){if(e.code==='case-conflict'){conflicts++;continue;}throw e;}
    }
    if(current()){
      backoff=retryMs;
      display('서버 일치 확인 '+confirmed+'건 · 같은 번호의 내용 충돌 '+conflicts+'건 · 형식 확인 필요 '+invalid+'건. 새 사례를 기다립니다. '+(durable?'이 기기 자동 재개 켜짐.':'현재 탭에서만 사용 중입니다.'));
    }
  }
  function kick(){
    if(!enabled)return;
    if(activeRun){rerun=true;return;}
    const token=generation;
    activeRun=drain(token).catch(e=>{
      if(!enabled||token!==generation)return;
      if(roleErrors.has(e.code)){if(expected)forget(expected);halt(e.code==='permission-denied'?'중앙 사례 편집 권한을 확인할 수 없어 자동 재개를 해제했습니다.':e.message);return;}
      display('기기 기록을 보존했습니다. 중앙 연결이나 서버 재확인이 가능해지면 재시도합니다.');
      later(backoff);backoff=Math.min(backoff*2,60000);
    }).finally(()=>{
      activeRun=null;
      if(rerun&&enabled){rerun=false;kick();}
    });
  }
  function trigger(){if(enabled){clearTimeout(timer);timer=null;kick();}}
  function begin(){if(enabled)return;expected=readPreference();durable=Boolean(expected);enabled=true;generation++;backoff=retryMs;display('기기 사례를 확인하고 있습니다.');kick();}
  function stopAll(){forget(null);halt();channel?.postMessage({stop:true});}
  function preferenceChange(e){if(e.key===preferenceKey&&e.newValue===null)halt('이 기기의 중앙 동기화와 자동 재개를 멈췄습니다.');}
  function suspend(){halt('페이지를 닫았습니다.');}
  function resume(){if(readPreference())begin();}
  start.onclick=begin;stop.onclick=stopAll;retry.onclick=trigger;
  if(typeof BroadcastChannel!=='undefined'){
    channel=new BroadcastChannel('bookfriend-lab-evidence');
    channel.onmessage=e=>{if(e.data?.stop===true){halt();return;}if(e.data?.changed)kick();};
  }
  window.addEventListener('online',trigger);window.addEventListener('focus',trigger);window.addEventListener('storage',preferenceChange);
  window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);
  display('이 기기의 중앙 동기화가 꺼져 있습니다.');
  resume();
  return {start:begin,stop:stopAll,retry:trigger,destroy(){halt();channel?.close();window.removeEventListener('online',trigger);window.removeEventListener('focus',trigger);window.removeEventListener('storage',preferenceChange);window.removeEventListener('pagehide',suspend);window.removeEventListener('pageshow',resume);panel.remove();}};
}
