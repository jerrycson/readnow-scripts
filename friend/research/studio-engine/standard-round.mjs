import {definitions,toFramework,validateFramework,summarize,assessStage,studyOf} from './standard.mjs';
export const staleMs=36*3600000;
const asTime=t=>Number.isFinite(Date.parse(t))?new Date(t).toISOString():null;
function unpack(study,packet,now){
 if(!packet||!Array.isArray(packet.rows)||!Array.isArray(packet.materialTimes))throw Error('원자료 묶음이 불완전합니다.');
 const adapted=new Map(),times=[];
 function time(t){const value=asTime(t);if(!value||Date.parse(value)>Date.parse(now))throw Error('원자료 시각이 없거나 미래입니다.');return value;}
 for(const t of packet.materialTimes)times.push(time(t));
 for(const item of packet.rows){
  if(!item.row||studyOf(item.row)!==study)throw Error('다른 연구의 사례가 섞였습니다.');
  const r=validateFramework(toFramework(item.row,item));time(r.event.t);
  // 단순 탭 열기와 열람은 새 학습 재료가 아니다.
  if(item.origin==='release'||item.row.outcome!=='observed')times.push(r.event.t);
  const id=r.decision.id;const before=adapted.get(id);
  if(before&&JSON.stringify(before)!==JSON.stringify(r))throw Error('같은 근거 ID의 내용이 달라졌습니다.');
  adapted.set(id,r);
 }
 return {records:[...adapted.values()],materialAt:times.sort().at(-1)||null,reference:packet.reference||null};
}
export async function runStandardRound({study,read,append,previous=null,now=new Date().toISOString(),trigger='manual',policy=null,days=[],shadowSince=null}){
 if(!Object.hasOwn(definitions,study)||typeof read!=='function'||typeof append!=='function'||!asTime(now)||(previous?.stage!=null&&(!Number.isInteger(previous.stage)||previous.stage<0||previous.stage>4)))return {ok:false,code:'invalid_input',error:'연구 ID·이전 단계·원본 읽기·일지 저장·시각을 확인하세요.'};
 const at=asTime(now),id=crypto.randomUUID();let data,retried=false,summary=null,error=null,state='ok',stage;
 const stale=d=>!d.materialAt||Date.parse(at)-Date.parse(d.materialAt)>staleMs;
 try{
  data=unpack(study,await read(study,{retry:false}),at);
  if(stale(data)){retried=true;const fresh=unpack(study,await read(study,{retry:true}),at);
   if(data.materialAt&&(!fresh.materialAt||fresh.materialAt<data.materialAt))throw Error('재읽기 후 재료 시각이 역행했습니다.');data=fresh;
  }
  if(stale(data))state='stalled';
  summary=summarize(data.records);
  // 같은 날 화면을 다시 열어 이미 채점한 대조로 연속 승격하지 않는다.
  const alreadyScored=previous?.stageJudgedDay===at.slice(0,10);
  stage=assessStage({previous:previous?.stage??0,stale:state==='stalled',days,policy:alreadyScored?null:policy,shadowSince,now:at});
 }catch(e){state='source_error';error=e.message;stage=assessStage({previous:previous?.stage??0,error:true});}
 const log={id,study,at,trigger,state,materialAt:data?.materialAt??previous?.materialAt??null,retried,stage:stage.stage,priorStage:previous?.stage??0,reason:stage.reason,
  stageJudgedDay:stage.stage!==(previous?.stage??0)?at.slice(0,10):previous?.stageJudgedDay??null,
  saw:summary?{records:summary.records,deviceMeasures:summary.deviceMeasures,device:summary.device,reviews:summary.reviews,humanPairs:summary.humanPairs,failures:summary.failures}:null,
  action:state==='source_error'?'읽기 오류 기록':retried?'원자료를 다시 읽고 최신 시각을 대조':'원자료를 읽고 공통 칸으로 채점',
  fix:state==='source_error'?'원본 읽기와 지문을 복구한 뒤 재시도':state==='stalled'?'다시 읽은 뒤에도 새 재료 없음 · 정체 알림':summary?.failures?'악화된 기록을 다음 대조 재료로 유지':'독립 사람 대조 수집 대기',error};
 try{await append(log,data?.records??[]);}catch(e){return {ok:false,code:'ledger_error',error:e.message,log,summary,records:data?.records??[],reference:data?.reference??null};}
 return {ok:state==='ok',code:state,error:state==='stalled'?'36시간 정체 · 원본 재조회 후에도 새 재료가 없습니다.':error,log,summary,records:data?.records??[],reference:data?.reference??null};
}
