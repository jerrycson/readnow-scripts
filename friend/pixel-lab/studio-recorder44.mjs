import {record,observeEvidence,entries,archiveModel} from './studio-evidence44.mjs';
import {fit,evaluate} from './studio-learning44.mjs?v=57-correction';
import {publishedEvidence} from './studio-cases44.mjs?v=57-diagnostic';
import {learningCorrection} from './studio-corrections57.mjs?v=57-correction';
const broadcaster=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('bookfriend-lab-evidence');
export async function refreshLearning(seeds,local,models){const rows=[...seeds,...local],report=evaluate(rows);const signatureData=rows.filter(r=>r.outcome==='measured').map(r=>{const data=[r.id,r.episode,r.metricBefore,r.metricAfter],correction=learningCorrection(r);return correction?[...data,correction.id,correction.sourceSha256]:data;}).sort((a,b)=>a[0].localeCompare(b[0]));
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(signatureData))),signature=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 if(!models.some(m=>m.signature===signature)){try{await archiveModel({schema:1,signature,report,parameters:fit(rows)});}catch(e){if(e.name!=='ConstraintError')throw e;}}return report;
}
export function startStudioRecord(getTool){
 const panel=document.createElement('details'),summary=document.createElement('summary');summary.textContent='실험 판단 기록';panel.append(summary);panel.className='engine-controls';document.querySelector('.workhead').after(panel);
 const desc=document.createElement('span');desc.textContent='현재 작업 결과 ';panel.append(desc);const msg=document.createElement('output');msg.setAttribute('role','status');
 function context(){const t=getTool()||{},id=t.id||'';const localCase=new URL(location.href).searchParams.get('case');
  if(t.group==='world')return {task:'movement',method:'simulation',subject:'world'};
  if(t.group==='photo')return {task:'alignment',method:'photo',subject:'studio'};
  return {task:t.group==='sculpt'?'surface':'comparison',method:t.group==='sculpt'?'direct':id==='history'?'archive':'baseline',subject:t.case||(['F02','M01','W'].includes(localCase)?localCase:'studio')};}
 let task=Promise.resolve();
 async function update(row){broadcaster?.postMessage({changed:true});if(row.outcome!=='measured')return;
 const seeds=await publishedEvidence(),report=await refreshLearning(seeds,await entries(),await entries('models'));msg.textContent=summarize(report);broadcaster?.postMessage({changed:true});}
 const summarize=r=>'검증 '+r.observations+'건 · '+r.reason;
 function queued(row){task=task.then(()=>update(row)).catch(e=>{msg.textContent=e.message;});}
 async function mark(outcome){try{const r=await record({...context(),outcome,metricBefore:null,metricAfter:null,unit:'none'});queued(r);msg.textContent='이 기기에 기록했습니다.';}catch(e){msg.textContent=e.message;}}
 for(const [label,v] of [['채택','accepted'],['보류','deferred'],['되돌림','reverted']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>mark(v);panel.append(b);}
 const a=document.createElement('a');a.href='../research/studio-engine/';a.target='_blank';a.rel='noopener';a.textContent='근거와 학습 결과 ↗';panel.append(a,msg);
 observeEvidence((v,e)=>{if(e){msg.textContent=e.message;return;}queued(v);});
 let previous='';return ()=>{const id=getTool()?.id;if(id&&id!==previous){previous=id;mark('observed');}};
}
