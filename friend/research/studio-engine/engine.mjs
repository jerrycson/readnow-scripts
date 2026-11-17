import {entries,importExamples} from '../../pixel-lab/studio-evidence44.mjs';
import {fit,evaluate,predict} from '../../pixel-lab/studio-learning44.mjs?v=57-correction';
import {publishedEvidence} from '../../pixel-lab/studio-cases44.mjs?v=57-diagnostic';
import {refreshLearning} from '../../pixel-lab/studio-recorder44.mjs?v=57-diagnostic';
import {learningCorrection} from '../../pixel-lab/studio-corrections57.mjs?v=57-correction';
import {diagnosticObservation57} from '../../pixel-lab/studio-observation57.mjs?v=57-diagnostic';
import {mountCaseSync} from '../../pixel-lab/studio-case-sync45.mjs';
const $=id=>document.getElementById(id),el=(tag,t)=>Object.assign(document.createElement(tag),{textContent:t||''});
const lab=new URL('../../pixel-lab/',location.href);let rows=[],local=[],filter='all',models=[],busy=false;
mountCaseSync($('stats').parentElement);
const words={all:'전체',observed:'도구 사용',measured:'실측',accepted:'채택',rejected:'거절',deferred:'보류',reverted:'원복',surface:'표면',alignment:'정합',comparison:'비교',movement:'움직임',repeatability:'재현',direct:'직접 교정',learned:'학습 추천',baseline:'기준',photo:'사진',pose:'자세',cohort:'독립 시험 묶음',archive:'판본',simulation:'환경',W:'성인 몸통',F02:'페른',M01:'힘멜',world:'무대',studio:'실험실'};
function showRows(){const box=$('rows');box.replaceChildren();for(const r of [...rows].reverse().filter(r=>filter==='all'||(filter==='diagnostic'?diagnosticObservation57(r):r.outcome===filter))){
 const tr=el('tr');for(const v of [(words[r.subject]||r.subject)+' · '+(words[r.task]||r.task),words[r.method]||r.method,r.metricBefore==null?'—':Number(r.metricBefore.toFixed(3))+' → '+Number(r.metricAfter.toFixed(3))+' '+r.unit,words[r.outcome]])tr.append(el('td',v));
 const td=el('td');if(r.source){const a=el('a',r.note||'원 측정');a.href=new URL(r.source,lab);a.target='_blank';a.rel='noopener';td.append(a);}else td.textContent=new Date(r.at).toLocaleString('ko-KR')+(r.zone?' · '+r.zone:'');
 const correction=learningCorrection(r);if(correction){tr.dataset.correction=correction.id;td.append(el('p',correction.reason));}
 const observation=diagnosticObservation57(r);if(observation){tr.dataset.observation=observation.id;td.append(el('p',observation.label+' · 보존·열람, 학습/평균점수 제외. '+observation.reason+(r.metricAfter>r.metricBefore?' 원래 관측값의 악화도 보존합니다.':'')));}tr.append(td);box.append(tr);}
 for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.key===filter));}
for(const k of ['all','diagnostic','measured','accepted','rejected','deferred','reverted','observed']){const b=el('button',k==='diagnostic'?'집계 관측':words[k]);b.dataset.key=k;b.onclick=()=>{filter=k;showRows();};$('filters').append(b);}
function scores(report){const n=x=>x==null?'—':x.toFixed(4);return report.reason+' · 독립 묶음 '+report.episodes+'개 · 측정 '+report.observations+'건'+(report.excluded?' · 정정으로 학습 제외 '+report.excluded+'건':'')+(report.baselineMAE==null?'':' · 기준 절대오차 '+n(report.baselineMAE)+' / 학습 후보 '+n(report.candidateMAE)+' · 악화 '+report.worseEpisodes+'묶음');}
async function refresh(save=true){if(busy)return;busy=true;try{
 const seeds=await publishedEvidence();local=await entries();models=await entries('models');rows=[...seeds,...local];
 const diagnosticCount=rows.filter(r=>diagnosticObservation57(r)).length;
 $('stats').textContent='공개 근거 '+seeds.length+'건 · 이 기기 사례 '+local.length+'건'+(diagnosticCount?' · 집계 관측 '+diagnosticCount+'건: 보존·열람, 학습/평균점수 제외. 원본 수치와 기존 회귀학습 점수는 유지하며 관측형 분류를 정정했습니다.':'');showRows();
 const report=evaluate(rows);$('metrics').textContent=scores(report);if(save){await refreshLearning(seeds,local,models);models=await entries('models');}
 const box=$('models');box.replaceChildren();for(const m of models.sort((a,b)=>b.at.localeCompare(a.at))){box.append(el('p',new Date(m.at).toLocaleString('ko-KR')+' · '+m.signature.slice(0,10)+' · '+scores(m.report)));}
 if(report.eligible){const model=fit(rows);const supported=Object.entries(model.groups).filter(([,p])=>p.n>=2);
 for(const [key] of supported){const [task,subject,method,unit]=key.split('|');box.append(el('p',(words[subject]||subject)+' · '+words[method]+' · 학습된 예상 오차 감소율 '+(100*predict(model,{task,subject,method,unit})).toFixed(1)+'%'));}}
 }catch(e){$('msg').textContent='자료 확인 필요 · '+e.message;}finally{busy=false;}}
$('reload').onclick=()=>refresh();$('train').onclick=()=>refresh();$('export').onclick=()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({schema:1,cases:local},null,2)],{type:'application/json'}));a.download='책방친구-실험실-사례.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>12e6)throw Error('12MB 이하의 사례 파일을 선택하세요.');const n=await importExamples(JSON.parse(await f.text()));$('msg').textContent=n+'건을 추가했습니다.';await refresh();}catch(err){$('msg').textContent=err.message;}finally{e.target.value='';}};
if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('bookfriend-lab-evidence');channel.onmessage=()=>refresh();}
addEventListener('focus',()=>refresh());refresh();
