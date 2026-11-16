// 이 연구실의 같은 브라우저/같은 출처 탭만 다룬다. 실제 기기 간 권한은 서버 구현이 필요하다.
export class StudyPresence{
 constructor({locks=globalThis.navigator?.locks,Channel=globalThis.BroadcastChannel,onChange=()=>{}}={}){
  this.locks=locks;this.onChange=onChange;this.activeId=null;this.releaseLock=null;this.generation=0;
  this.channel=Channel?new Channel('readnow-pixel-presence-v1'):null;
  if(this.channel)this.channel.onmessage=e=>{if(e.data?.type==='request-release'&&e.data.id===this.activeId)this.release();};
 }
 async activate(id){
  if(!this.locks)throw new Error('이 브라우저는 중복 실행 방지 기능을 지원하지 않아 생활 무대를 시작할 수 없습니다.');
  this.release();const token=this.generation;
  const attempt=()=>new Promise((resolve,reject)=>{
   this.locks.request('readnow-pixel-presence:'+id,{mode:'exclusive',ifAvailable:true},lock=>{
    if(!lock||token!==this.generation){resolve(false);return;}
    return new Promise(unlock=>{this.releaseLock=unlock;this.activeId=id;this.onChange(id);resolve(true);});
   }).catch(reject);
  });
  if(await attempt())return true;
  this.channel?.postMessage({type:'request-release',id});
  for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,100));if(token!==this.generation)return false;if(await attempt())return true;}
  throw new Error('다른 연구 창이 아직 사용 중입니다. 그 창의 생활 무대를 멈춘 뒤 다시 시작해 주세요.');
 }
 release(){this.generation++;if(this.activeId){this.activeId=null;this.onChange(null);}const unlock=this.releaseLock;this.releaseLock=null;unlock?.();}
 close(){this.release();this.channel?.close();}
}
// 서버 어댑터 구현의 기준이 될 순수 상태 전이. 요청마다 서버 시각·트랜잭션이 전제다.
export function transitionLease(current,command,now){
 if(!command||typeof command.owner!=='string'||!command.owner.trim())throw new Error('기기 식별자가 필요합니다.');
 const old=current??{owner:null,epoch:0,expiresAt:0};
 if(!Number.isFinite(now))throw new Error('서버 시각이 필요합니다.');
 if(command.type==='acquire'){
  if(old.owner&&old.expiresAt>now&&old.owner!==command.owner)return {ok:false,lease:old,reason:'occupied'};
  return {ok:true,lease:{owner:command.owner,epoch:old.epoch+1,expiresAt:now+5000}};
 }
 if(command.epoch!==old.epoch||command.owner!==old.owner||old.expiresAt<=now)return {ok:false,lease:old,reason:'stale'};
 if(command.type==='release')return {ok:true,lease:{owner:null,epoch:old.epoch+1,expiresAt:0}};
 if(command.type==='renew')return {ok:true,lease:{...old,expiresAt:now+5000}};
 throw new Error('지원하지 않는 권한 요청입니다.');
}
