export function canonicalUrl(value){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port||url.hostname==='localhost'||/^[\d.]+$|[:\[\]]|\.(local|internal)$/.test(url.hostname))throw new Error('공개 HTTPS 출처만 등록합니다.');url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/.test(key))url.searchParams.delete(key);url.searchParams.sort();return url.href;}
export function validateSources(input){
 if(input?.schema!==1||!Array.isArray(input.sources))throw new Error('자료 색인 형식 오류');
 const ids=new Set(),urls=new Map();
 for(const source of input.sources){if(!source.id||ids.has(source.id)||!source.title||!source.oneSentence||!source.reviewedAt)throw new Error('출처 필드 누락 또는 중복');ids.add(source.id);const url=canonicalUrl(source.url);if(!urls.has(url))urls.set(url,[]);urls.get(url).push(source.id);}
 return {total:ids.size,uniqueUrls:urls.size,duplicates:[...urls].filter(([,ids])=>ids.length>1).map(([url,ids])=>({url,ids}))};
}
export function validateReport(report){if(!report||!Array.isArray(report.results)||!report.results.length||report.total!==report.results.length||report.passed!==report.results.filter(r=>r.ok===true).length||report.results.some(r=>typeof r.name!=='string'||typeof r.ok!=='boolean'))throw new Error('검사 합계와 개별 결과가 일치하지 않습니다.');return report;}
export function issuesFromReport(scope,report){
 validateReport(report);const issues=[];
 for(const result of report.results){
  if(!result.ok)issues.push({id:scope+':failure:'+result.name,scope,severity:3,title:result.name+' 실패',evidence:result.error||'검사 실패',next:'실패 입력을 고정해 재현하고 마지막 통과판과 비교한다.'});
  for(const warning of result.detail?.warnings||[]){const title=[warning.preset,warning.action,warning.issue].filter(Boolean).join(' · ');issues.push({id:scope+':warning:'+title,scope,severity:2,title,evidence:result.name,next:'해당 크기·방향·동작을 고정하고 프레임의 차이가 읽히는 후보를 비교한다.'});}
 }
 return issues;
}
export function reconcileMemory(previous,issues,observedScopes){
 const records=new Map((previous||[]).map(x=>[x.id,{...x}])),observed=new Set(observedScopes),active=new Set(issues.map(x=>x.id));
 for(const record of records.values())if(observed.has(record.scope)&&!active.has(record.id))record.state='resolved';
 for(const issue of issues){const old=records.get(issue.id),evidenceToken=JSON.stringify(issue.evidence),seen=old?.evidenceTokens||[],fresh=!seen.includes(evidenceToken);records.set(issue.id,{...old,...issue,state:'open',evidenceTokens:fresh?[...seen,evidenceToken]:seen,observations:(old?.observations||0)+(fresh?1:0)});}
 return [...records.values()].map(x=>({...x,priority:x.severity*100+Math.min(x.observations,20)*4})).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
export function evaluateCandidate({baseline,candidate,objective,tuningCases,evaluationCases,requiresVisualReview=true,visualReview='pending'}){
 const reasons=[];
 if(!baseline||!candidate||!objective||!['min','max'].includes(objective.direction))return {decision:'hold',reasons:['비교 기준과 목표가 필요합니다.']};
 if(!Array.isArray(tuningCases)||!Array.isArray(evaluationCases)||!tuningCases.length||!evaluationCases.length||new Set(tuningCases).size!==tuningCases.length||new Set(evaluationCases).size!==evaluationCases.length||tuningCases.some(k=>evaluationCases.includes(k)))return {decision:'hold',reasons:['조정 사례와 평가 사례를 서로 겹치지 않게 고정해야 합니다.']};
 for(const key of ['missing','clipped','invalid']){if(!Number.isFinite(candidate[key]))return {decision:'hold',reasons:['필수 검사값 누락: '+key]};if(candidate[key]!==0)reasons.push(key+' 오류가 남았습니다.');}
 if(reasons.length)return {decision:'reject',reasons};
 const before=baseline[objective.metric],after=candidate[objective.metric];if(!Number.isFinite(before)||!Number.isFinite(after))return {decision:'hold',reasons:['목표의 실측값이 필요합니다.']};
 const gain=(after-before)*(objective.direction==='max'?1:-1);if(gain<=(objective.minimumGain??0))return {decision:'reject',reasons:['목표 지표의 개선이 확인되지 않았습니다.']};
 if(requiresVisualReview&&visualReview!=='approved')return {decision:visualReview==='rejected'?'reject':'hold',reasons:['수치 검사 뒤 시각 비교 판단을 기록해야 합니다.'],gain};
 return {decision:'eligible',reasons:['필수 검사와 설정한 목표를 통과했습니다. 적용과 재검증은 별도 기록합니다.'],gain};
}
