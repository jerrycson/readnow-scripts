import {definitions,stages} from './standard.mjs';
import {runStandardRound} from './standard-round.mjs';
import {appendRound,rounds,createReader} from './standard-source.mjs';
import {publicHeartbeat} from './standard-heartbeat.mjs';
const q=id=>document.getElementById(id),node=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text??''});
const versions=Object.keys(definitions);let study='friend-studio',latest={},history=[],central=null,running=false,again=false;
const time=s=>s?new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'확인되지 않음';
const val=v=>Number(v.toFixed(3)).toLocaleString('ko-KR');
const captions={'r44-표점-조건통과':'중립 표점 · 제시 조건','r44-표점-구역 전체 보류':'학습에서 제외한 부위','r44-표점-학습하지 않은 관절':'학습에서 제외한 관절 자세',
 'r44-syntheticHeld':'합성 머리 · 보류 시점','r44-scanClean':'실측 스캔 · 정렬','r44-scanTiltedBox':'같은 스캔 · 기울어진 상자','r44-counterexample':'각진 형상 반례','r44-face-oof-four-fold':'합성 96두상 · 4분할 · 55,296점 단면 지지거리, 128px 환산'};
const names={entity:'대상',event:'사건',feature:'특징',decision:'결정',outcome:'결과',feedback:'되먹임',experiment:'실험'};
function addP(box,text){box.append(node('p',text));}
function drawScores(box,s){
 box.replaceChildren();if(!s?.score.length)return addP(box,'근거가 확인된 수치가 없습니다.');
 const support=p=>p.id==='r44-face-oof-four-fold';
 const groups=study==='friend-photo'?[['실루엣 경계 거리 · 128px',s.score.filter(p=>!support(p))],['단면 지지거리 오차 · 128px 환산',s.score.filter(support)]]:[[definitions[study].metric,s.score]];
 for(const [title,points] of groups){if(!points.length)continue;
 const max=Math.max(0,...points.flatMap(p=>[p.before,p.after]));box.append(node('h4',title));addP(box,'각 막대는 해당 시험 묶음의 평균입니다.');
 for(const p of points){
  const row=node('div');row.className='measure-row';row.append(node('strong',(captions[p.id]||p.id)+' · '+p.n+'건'));
  for(const [label,value] of [['기준',p.before],['후보',p.after]]){
   const line=node('div');line.className='measure-line';const bar=node('span');bar.className='measure-track';const ink=node('i');ink.style.width=(max?100*value/max:0)+'%';bar.append(ink);bar.setAttribute('aria-hidden','true');line.append(node('span',label),bar,node('span',val(value)+' px'));row.append(line);
  }box.append(row);
 }}
}
function publicText(){
 if(!central)return '중앙 공개 회차를 조회하고 있습니다.';
 if(!central.ok)return '중앙 공개 회차 미확인 · 오늘·어제 한국 날짜의 공개 요약을 읽지 못했습니다.';
 const c=central.values[study];return '중앙 공개 회차 '+central.day+' · '+time(central.at)+' · 상태 '+c.state+' · '+c.count+'건 · 사람 기준선 짝 '+c.humanPairs+'건. 이 요약에는 승격 단계가 없습니다.';
}
function paint(){
 const def=definitions[study],r=latest[study],s=r?.summary,book=history.filter(x=>x.study===study).sort((a,b)=>b.at.localeCompare(a.at));
 for(const b of q('standard-tabs').children)b.setAttribute('aria-pressed',String(b.dataset.study===study));
 q('standard-purpose').textContent=def.purpose;q('standard-id').textContent=study;q('standard-wire').href=def.target;
 q('standard-stage').textContent=r?.log?'이 기기 판정 '+r.log.stage+'단계 · '+stages[r.log.stage]+' / '+r.log.reason:'이 기기 판정 미확인';
 q('standard-central').textContent=publicText();
 q('standard-human').textContent='독립 사람 기준선 '+(s?s.humanPairs+'짝':'미확인')+' · 채택·거절 표시는 별도입니다. 같은 조건에서 추천을 보기 전 사람이 직접 낸 수치가 있어야 사람 점수를 계산합니다.';
 const ref=r?.reference;q('standard-sample').textContent=!ref?'공개 시험의 표본 수를 확인하고 있습니다.':study==='friend-photo'?'합성 학습 관측 '+ref.train.toLocaleString()+'개 · 학습 실측 '+ref.trainedScan+'두상 · 검증 실측 '+ref.scans+'두상 · 사용자 승인 사진 표본 '+ref.approved+'건. 정렬과 기울임은 같은 스캔입니다.':'실제 메시에서 생성한 학습 투영 '+ref.train.toLocaleString()+'개 · 보류 시점 시험 '+ref.test+'건 · 제시 조건 '+ref.offered+'건. 사람이 직접 수행한 교정 결과는 별도로 수집합니다.';
 q('standard-device').textContent=s?'이 기기 구조화 사례 '+s.device+'건 · 측정 '+s.deviceMeasures+'건 · 검토 선택 '+s.reviews+'건 · 세션 묶음 '+s.deviceEpisodes+'개. 가져온 기록도 포함합니다.':'이 기기 장부 미확인';
 drawScores(q('standard-chart'),s);
 const logs=q('standard-ledger');logs.replaceChildren();
 for(const l of book.slice(0,30)){
  const tr=node('tr');for(const t of [time(l.at),l.saw?l.saw.records+'건':'미확인',l.action,l.reason,l.saw?'악화 기록 '+l.saw.failures+'건 · 단계 '+l.priorStage+' → '+l.stage:'자료 오류',l.fix])tr.append(node('td',t));logs.append(tr);
 }
 q('standard-journal-count').textContent='이 브라우저에 보존된 회차 '+book.length+'건 · 최근 30건 표시. 원자료 시각 '+time(r?.log?.materialAt);
 q('standard-fix').textContent=r?.log?.fix||'확인된 회차를 기다립니다.';
 q('standard-difficulty').textContent=def.limits;q('standard-next').textContent=def.next;
 q('standard-alert').textContent=r&&!r.ok?'확인 필요 · '+(r.error||r.code):'';
 const sample=q('standard-record');sample.replaceChildren();
 const records=r?.records||[];q('standard-record-count').textContent='공통 일곱 칸으로 검증한 기록 '+records.length+'건';
 if(records.length){
  const selected=records.find(x=>x.event.v.type===(study==='friend-photo'?'scan':'mesh'))||records[0];
  for(const [key,label] of Object.entries(names)){const dt=node('dt',label+' · '+key),dd=node('dd');dd.append(node('code',JSON.stringify(selected[key])));sample.append(dt,dd);}
 }
}
export async function refreshStandard(trigger='manual'){
 if(running){again=true;return;}running=true;q('standard-read').disabled=true;
 try{
  const read=createReader();history=await rounds();
  const stamp=new Date().toISOString();
  const results=await Promise.all(versions.map(id=>runStandardRound({study:id,read,append:appendRound,previous:history.filter(l=>l.study===id).at(-1),trigger,now:stamp})));
  latest=Object.fromEntries(versions.map((id,i)=>[id,results[i]]));history=await rounds();paint();
 }catch(e){q('standard-alert').textContent='일지 또는 원자료를 읽지 못했습니다 · '+e.message;}
 finally{running=false;q('standard-read').disabled=false;if(again){again=false;void refreshStandard('queued');}}
}
for(const id of versions){const b=node('button',definitions[id].title);b.dataset.study=id;b.onclick=()=>{study=id;paint();};q('standard-tabs').append(b);}
const chosen=new URL(location.href).searchParams.get('study');if(Object.hasOwn(definitions,chosen))study=chosen;
let centralFlight=null;
function readCentral(){if(!centralFlight)centralFlight=publicHeartbeat().then(value=>{central=value;paint();}).finally(()=>{centralFlight=null;});return centralFlight;}
q('standard-read').onclick=()=>{void readCentral();void refreshStandard();};
if(typeof BroadcastChannel!=='undefined'){let timer;const channel=new BroadcastChannel('bookfriend-lab-evidence');channel.onmessage=()=>{clearTimeout(timer);timer=setTimeout(()=>refreshStandard('device-evidence'),700);};}
paint();void readCentral();void refreshStandard('page-open');
