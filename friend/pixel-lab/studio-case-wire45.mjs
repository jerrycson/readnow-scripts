import {checked} from './studio-evidence44.mjs';

const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const zones=new Set(['chin','jaw','throat','mid','cheek','rib','breast','lower']);
const shareable=new Set(['measured','accepted','rejected','deferred','reverted']);
const sdkRoot='https://www.gstatic.com/firebasejs/10.12.2/';
export function problem(code,message){return Object.assign(new Error(message),{code});}
export function publicCase(row){
  if(row?.outcome==='observed')return null;
  const item=checked(row);
  if(!shareable.has(item.outcome)||typeof row.id!=='string'||!uuid.test(row.id)||typeof row.episode!=='string'||!uuid.test(row.episode))throw problem('invalid-case','사례 식별자나 묶음이 잘못됐습니다.');
  if(typeof row.at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.at)||!Number.isFinite(Date.parse(row.at))||new Date(row.at).toISOString()!==row.at)throw problem('invalid-case','사례의 UTC 시각을 확인하세요.');
  if(item.outcome==='measured'&&item.metricBefore===null)throw problem('invalid-case','측정 사례에는 전후 수치가 필요합니다.');
  if(item.metricBefore!==null&&item.unit==='none')throw problem('invalid-case','수치가 있는 사례에는 측정 단위가 필요합니다.');
  const result={id:row.id,episode:row.episode,at:row.at,task:item.task,subject:item.subject,method:item.method,outcome:item.outcome,unit:item.unit,metricBefore:item.metricBefore,metricAfter:item.metricAfter};
  for(const key of ['yaw','pitch'])if(item[key]!==undefined)result[key]=item[key];
  if(zones.has(item.zone))result.zone=item.zone;
  return result;
}
export function sameCase(a,b){
  if(!b||typeof b!=='object')return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&a[k]===b[k]);
}
export async function firebaseEditor({onAccountChange,active}){
  const [appSdk,authSdk,dbSdk]=await Promise.all(['app','auth','firestore'].map(n=>import(sdkRoot+'firebase-'+n+'.js')));
  let app=appSdk.getApps().find(a=>a.name==='[DEFAULT]');
  if(!app){
    const r=await fetch('/__/firebase/init.json',{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)throw problem('unavailable','Firebase 설정을 읽지 못했습니다.');
    const cfg=await r.json();
    if(cfg.projectId!=='readnow-3a385')throw problem('wrong-project','연구 프로젝트 설정을 확인하세요.');
    app=appSdk.initializeApp(cfg);
  }
  if(app.options.projectId!=='readnow-3a385')throw problem('wrong-project','기존 세션의 프로젝트가 다릅니다.');
  const auth=authSdk.getAuth(app);
  await auth.authStateReady();
  const uid=auth.currentUser?.uid;
  if(!uid)throw problem('unauthenticated','연구실에서 관리자 계정으로 로그인한 다음 다시 시작하세요.');
  const db=dbSdk.getFirestore(app,'readnow-research');
  const check=()=>{
    if(!active())throw problem('stopped','동기화가 멈췄습니다.');
    if(auth.currentUser?.uid!==uid)throw problem('unauthenticated','관리자 세션이 바뀌었습니다. 다시 시작하세요.');
  };
  check();const role=await dbSdk.getDocFromServer(dbSdk.doc(db,'readers',uid));
  if(!role.exists()||role.get('engineEditor')!==true)throw problem('permission-denied','중앙 사례 편집 권한이 필요합니다.');
  check();
  const unsubscribe=authSdk.onAuthStateChanged(auth,user=>{if(user?.uid!==uid)onAccountChange();});
  return {
    close:unsubscribe,
    async putVerified(record){
      check();
      const item=publicCase(record);
      if(!item||!sameCase(record,item))throw problem('invalid-case','전송할 수 없는 필드가 있습니다.');
      const ref=dbSdk.doc(db,'friend_engine_cases',item.id);
      await dbSdk.runTransaction(db,async tx=>{
        check();const existing=await tx.get(ref);check();
        if(existing.exists()){
          if(!sameCase(item,existing.data()))throw problem('case-conflict','같은 사례 번호에 다른 기록이 있습니다.');
        }else tx.set(ref,item);
      });
      check();const echo=await dbSdk.getDocFromServer(ref);check();
      if(!echo.exists())throw problem('unavailable','저장한 사례를 서버에서 다시 확인해야 합니다.');
      if(!sameCase(item,echo.data()))throw problem('case-conflict','저장한 내용과 서버 기록이 다릅니다.');
    }
  };
}
