import {VERSION,validateProfile} from './model.mjs';
export const DB_NAME='readnow-friend-pixel-lab-v1';
export class ConflictError extends Error{constructor(){super('다른 창에서 먼저 저장했습니다. 최신 내용을 불러온 뒤 다시 적용해 주세요.');this.name='ConflictError';}}
export function openStore(factory=globalThis.indexedDB,name=DB_NAME){
 if(!factory)return Promise.reject(new Error('이 환경에서는 기록 저장을 사용할 수 없습니다.'));
 return new Promise((resolve,reject)=>{const req=factory.open(name,VERSION);
  req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore('profiles',{keyPath:'id'});d.createObjectStore('history',{keyPath:'key'});d.createObjectStore('journal',{keyPath:'id',autoIncrement:true});};
  req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('이전 연구 창을 닫은 뒤 다시 열어 주세요.'));
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(new StudyStore(db));};
 });
}
export class StudyStore{
 constructor(db){this.db=db;}
 read(store,key){return new Promise((resolve,reject)=>{const tx=this.db.transaction(store,'readonly'),r=key===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async profiles(){return (await this.read('profiles')).map(validateProfile);}
 async get(id){const p=await this.read('profiles',id);return p?validateProfile(p):null;}
 async journal(){return this.read('journal');}
 commit(profile,expectedRevision,description){
  validateProfile(profile);
  return new Promise((resolve,reject)=>{
   const tx=this.db.transaction(['profiles','history','journal'],'readwrite'),table=tx.objectStore('profiles');let result,reason;
   const get=table.get(profile.id);get.onsuccess=()=>{try{
    const old=get.result;
    if((old?old.revision:null)!==expectedRevision){reason=new ConflictError();tx.abort();return;}
    if(old)tx.objectStore('history').put({key:`${old.id}:${old.revision}`,profile:old});
    result={...profile,revision:(old?.revision??-1)+1,updatedAt:Date.now()};
    table.put(result);tx.objectStore('journal').add({at:Date.now(),profileId:profile.id,name:profile.name,description,revision:result.revision});
   }catch(e){reason=e;tx.abort();}};
   tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(reason||tx.error||new Error('저장을 마치지 못했습니다.'));tx.onerror=()=>{};
  });
 }
 async previous(profile){
  const all=await this.read('history'),items=all.filter(x=>x.profile.id===profile.id&&x.profile.revision<profile.revision).sort((a,b)=>b.profile.revision-a.profile.revision);
  return items[0]?.profile??null;
 }
 close(){this.db.close();}
}
