// 실행 기록에 대한 소표본 계층 평균. 오차 감소량은 원래 단위와 함께 보존한다.
export function gain(row){if(!Number.isFinite(row.metricBefore)||!Number.isFinite(row.metricAfter)||row.metricBefore<=0||row.unit==='none')return null;
 return Math.max(-1,Math.min(1,(row.metricBefore-row.metricAfter)/row.metricBefore));}
function key(row){return [row.task,row.subject,row.method,row.unit].join('|');}
export function fit(rows){
 const groups=Object.create(null),methods=Object.create(null);let sum=0,count=0;
 for(const r of rows){const y=gain(r);if(y===null||r.scope==='cohort'||r.outcome!=='measured')continue;
 for(const [dict,k] of [[groups,key(r)],[methods,[r.task,r.method,r.unit].join('|')]]){const p=dict[k]??={sum:0,n:0};p.sum+=y;p.n++;}sum+=y;count++;}
 return {schema:1,prior:count?sum/count:0,count,groups,methods};
}
export function predict(model,row){const parent=model.methods[[row.task,row.method,row.unit].join('|')];const base=parent?(parent.sum+3*model.prior)/(parent.n+3):model.prior;const g=model.groups[key(row)];return g?(g.sum+3*base)/(g.n+3):base;}
export function evaluate(rows){
 const usable=rows.filter(r=>gain(r)!==null&&r.scope!=='cohort'&&r.outcome==='measured');const groups=[...new Set(usable.map(r=>r.episode))];
 if(groups.length<3)return {eligible:false,reason:'분리할 수 있는 실험 세 묶음 이상이 필요합니다.',episodes:groups.length,observations:usable.length};
 let n=0,baseline=0,candidate=0,worse=0;const byEpisode=[];
 for(const held of groups){const training=usable.filter(r=>r.episode!==held),testing=usable.filter(r=>r.episode===held),m=fit(training);let baseErr=0,learnErr=0;
  for(const r of testing){const y=gain(r);baseErr+=Math.abs(y-m.prior);learnErr+=Math.abs(y-predict(m,r));n++;}
  if(learnErr>baseErr+1e-9)worse++;baseline+=baseErr;candidate+=learnErr;byEpisode.push({episode:held,n:testing.length,baselineMAE:baseErr/testing.length,candidateMAE:learnErr/testing.length});}
 const eligible=candidate<baseline-1e-8&&!worse;
 return {eligible,reason:eligible?'모든 보류 묶음에서 기준 오차 이하':'기준 유지 · 일부 묶음에서 이득이 없거나 악화',observations:n,episodes:groups.length,baselineMAE:baseline/n,candidateMAE:candidate/n,worseEpisodes:worse,byEpisode};
}
