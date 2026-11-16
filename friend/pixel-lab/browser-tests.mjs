import {openStore,DB_NAME} from './storage.mjs';
import {createProfile} from './model.mjs';
import {StudyPresence} from './presence.mjs';
const assert=(v,m)=>{if(!v)throw new Error(m);};
document.querySelector('#run').onclick=async()=>{
 const out=document.querySelector('#result'),results=[];const test=async(name,fn)=>{try{await fn();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:e.message});}out.textContent=JSON.stringify(results,null,2);};
 const name=DB_NAME+'-test-'+crypto.randomUUID();let one,two;
 try{one=await openStore(indexedDB,name);two=await openStore(indexedDB,name);
 await test('저장과 재접속',async()=>{await one.commit(createProfile('a','시험 A'),null,'생성');const p=await two.get('a');assert(p.name==='시험 A'&&p.revision===0,'다른 연결에서 기록 읽기');});
 await test('동시에 저장해도 한 쪽만 성공',async()=>{const p=await one.get('a'),q={...p,name:'시험 B'};const r=await Promise.allSettled([one.commit(q,0,'첫 변경'),two.commit({...p,name:'시험 C'},0,'둘째 변경')]);assert(r.filter(x=>x.status==='fulfilled').length===1,'충돌한 두 저장이 모두 성공');assert(r.find(x=>x.status==='rejected').reason.name==='ConflictError','충돌 이유');});
 await test('이전 기록 복원과 이력 보존',async()=>{const p=await one.get('a'),prev=await one.previous(p);assert(prev.name==='시험 A','이전 본문');const restored=await one.commit({...prev,revision:p.revision},p.revision,'복원');assert(restored.name==='시험 A'&&restored.revision===2,'복원');assert((await one.journal()).length===3,'실패한 저장이 기록됨 또는 이력 소실');});
 await test('친구 둘의 저장이 독립적',async()=>{await one.commit(createProfile('b','별개 친구','male'),null,'다른 친구');assert((await one.profiles()).length===2&&(await one.get('a')).revision===2,'별개 친구 변경의 영향');});
 await test('같은 캐릭터 이동: 먼저 숨기고 잠금 해제',async()=>{
  const events=[],id='test-presence-'+crypto.randomUUID(),a=new StudyPresence({onChange:v=>events.push(['a',v])}),b=new StudyPresence({onChange:v=>events.push(['b',v])});
  try{await a.activate(id);await b.activate(id);assert(a.activeId===null&&b.activeId===id,'중복 활성화');const hide=events.findIndex(e=>e[0]==='a'&&e[1]===null),show=events.findIndex(e=>e[0]==='b'&&e[1]===id);assert(hide>=0&&hide<show,'숨김보다 먼저 새 창에 표시');}finally{a.close();b.close();}
 });
 await test('서로 다른 캐릭터는 나누어 활성화',async()=>{const a=new StudyPresence(),b=new StudyPresence();try{await a.activate('test-a-'+name);await b.activate('test-b-'+name);assert(a.activeId&&b.activeId,'계정 전체를 하나로 잠금');}finally{a.close();b.close();}});
 }catch(e){results.push({name:'시험 준비',ok:false,error:e.message});}finally{one?.close();two?.close();}
 out.textContent=JSON.stringify({passed:results.filter(x=>x.ok).length,total:results.length,results},null,2);out.dataset.done='true';
};
