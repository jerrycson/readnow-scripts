// 원본 이미지·대화·자유 입력은 이 저장소의 데이터 형식에 포함하지 않는다.
const database='bookfriend-studio-evidence-v1';let opening;
export const subjects=['F02','M01','W','world','studio'];
export const methods=['direct','learned','baseline','photo','pose','archive','simulation'];
export const tasks=['surface','alignment','comparison','movement','repeatability'];
export const outcomes=['measured','accepted','rejected','reverted','deferred','observed'];
const finite=n=>Number.isFinite(n)&&n>=0&&n<1e8;
export function checked(d){
 if(d?.task==='sculpt-target44')d={...d,task:'surface',method:({'ridge-inverse44':'learned','direct-drag43':'direct'})[d.method],outcome:d.outcome==='held'?'deferred':d.outcome,unit:d.unit==='px@192'?'px':d.unit};
 if(!d||!tasks.includes(d.task)||!methods.includes(d.method)||!subjects.includes(d.subject)||!outcomes.includes(d.outcome))throw Error('기록의 작업·대상·방법·판정 형식을 확인하세요.');
 if((d.metricBefore!=null||d.metricAfter!=null)&&(!finite(d.metricBefore)||!finite(d.metricAfter)))throw Error('대응하는 유효 수치가 필요합니다.');
 if(!['px','ratio','step','none'].includes(d.unit))throw Error('기록 단위 확인이 필요합니다.');
 const camera={};for(const k of ['yaw','pitch'])if(Number.isFinite(d[k])&&Math.abs(d[k])<=360)camera[k]=d[k];if(typeof d.zone==='string'&&/^[A-Za-z][a-zA-Z0-9_-]{0,30}$/.test(d.zone))camera.zone=d.zone;
 return {...camera,task:d.task,subject:d.subject,method:d.method,outcome:d.outcome,unit:d.unit,metricBefore:d.metricBefore??null,metricAfter:d.metricAfter??null};
}
function connect(){return opening??=new Promise((resolve,reject)=>{const q=indexedDB.open(database,1);q.onupgradeneeded=()=>{q.result.createObjectStore('cases',{keyPath:'id'});q.result.createObjectStore('models',{keyPath:'id'});};q.onblocked=()=>reject(Error('다른 탭의 저장소 갱신을 기다립니다.'));q.onerror=()=>{opening=null;reject(q.error);};q.onsuccess=()=>{const db=q.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};});}
export async function entries(store='cases'){const db=await connect();return new Promise((ok,fail)=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>ok(q.result);q.onerror=()=>fail(q.error);});}
async function add(store,value){const db=await connect();return new Promise((ok,fail)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).add(value);t.oncomplete=()=>ok(value);t.onabort=()=>fail(t.error);});}
const episodeKey='bookfriend-studio-episode';
function episode(){try{let id=sessionStorage.getItem(episodeKey);if(!id){id=crypto.randomUUID();sessionStorage.setItem(episodeKey,id);}return id;}catch{return 'tab-'+performance.timeOrigin;}}
export async function record(d){const v=await add('cases',{...checked(d),id:crypto.randomUUID(),episode:episode(),at:new Date().toISOString(),evidence:d.outcome==='measured'?'측정':d.outcome==='observed'?'도구 사용':'검토 선택'});return v;}
export function archiveModel(model){return add('models',{...model,id:model.signature,at:new Date().toISOString()});}
export function observeEvidence(onResult){
 window.addEventListener('bookfriend:learning-evidence',e=>{record(e.detail).then(v=>onResult?.(v)).catch(e=>onResult?.(null,e));});
}

export async function importExamples(doc){
 if(doc?.schema!==1||!Array.isArray(doc.cases)||doc.cases.length>20000)throw Error('지원하는 사례 파일을 선택하세요.');
 const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
 const rows=doc.cases.map(r=>{if(!uuid.test(r.id)||!uuid.test(r.episode)||!Number.isFinite(Date.parse(r.at)))throw Error('사례 식별자 또는 시각을 확인하세요.');const v=checked(r);return {...v,id:r.id,episode:r.episode,at:new Date(r.at).toISOString(),evidence:v.outcome==='measured'?'측정':v.outcome==='observed'?'도구 사용':'검토 선택'};});
 const db=await connect();return new Promise((resolve,reject)=>{const tx=db.transaction('cases','readwrite'),s=tx.objectStore('cases');let added=0,conflict=false;
 for(const r of rows){const op=s.get(r.id);op.onsuccess=()=>{if(op.result){if(JSON.stringify(op.result)!==JSON.stringify(r)){conflict=true;tx.abort();}return;}s.add(r);added++;};}
 tx.oncomplete=()=>resolve(added);tx.onabort=()=>reject(Error(conflict?'같은 ID의 내용이 달라 기존 기록을 보존했습니다.':'가져오기를 마치지 못했습니다.'));});
}
