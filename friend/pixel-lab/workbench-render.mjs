// 큐에는 창마다 마지막 요청 하나만 둔다. 화면 크기와 원본 화소 수는 독립이다.
export function createRenderQueue({requestFor,receive,fail}) {
  const slots=Array.from({length:Math.min(2,navigator.hardwareConcurrency||2)},()=>({worker:null,job:null}));
  const pending=new Set();
  let active=true, serial=0;
  function pump(){
    if(!active)return;
    for(const slot of slots){
      if(slot.job||!pending.size)continue;
      const index=Array.from(pending).find(i=>!slots.some(s=>s.job?.index===i));
      if(index===undefined)continue;
      pending.delete(index);
      const request=requestFor(index);
      if(!request)continue;
      if(!slot.worker){
        slot.worker=new Worker(new URL('./definition-worker.mjs?v=54',import.meta.url),{type:'module'});
        slot.worker.onmessage=({data})=>{
          const job=slot.job;
          slot.job=null;
          if(job&&job.serial===data.serial){
            if(data.error)fail(job,data.error);
            else receive(job,data);
          }
          pump();
        };
        slot.worker.onerror=e=>{
          const job=slot.job;
          slot.worker.terminate();slot.worker=null;slot.job=null;
          if(job)fail(job,e.message);
          pump();
        };
      }
      slot.job={...request,index,serial:++serial};
      slot.worker.postMessage({...slot.job,single:true});
    }
  }
  return {
    request(indices){for(const index of indices)pending.add(index);pump();},
    prune(visible){for(const index of pending)if(!visible.includes(index))pending.delete(index);},
    active(on){active=on;if(on)pump();},
    close(){active=false;pending.clear();for(const slot of slots)slot.worker?.terminate();}
  };
}
