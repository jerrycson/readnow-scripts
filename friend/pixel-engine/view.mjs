const $=s=>document.querySelector(s),el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
function link(text,url){const a=el('a',text);a.href=url;return a;}
async function main(){const [status,registry,collection]=await Promise.all(['status.json','sources.json','collection.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw new Error('결과 파일을 읽지 못했습니다: '+url);return response.json();}));
 $('#updated').textContent='마지막 실행 · '+new Date(status.updatedAt).toLocaleString('ko-KR');
 const total=status.reports.reduce((n,r)=>n+r.total,0),passed=status.reports.reduce((n,r)=>n+r.passed,0),open=status.memory.filter(x=>x.state==='open');
 for(const [number,label]of [[status.sourceSummary.total,'등록한 출처'],[status.collection.available+'/'+status.collection.checked,'이번 수집 응답'],[passed+'/'+total,'저장된 검사 결과'],[open.length,'확인할 항목']]){const d=el('div');d.append(el('b',String(number)),el('span',label));$('#summary').append(d);}
 for(const issue of open){const li=el('li');li.append(el('h3',issue.title),el('p',String(issue.evidence)),el('p','다음 실험: '+issue.next));const small=el('p','서로 다른 근거 '+issue.observations+'건 · '+issue.scope);small.className='state';li.append(small);$('#issue-list').append(li);}if(!open.length)$('#issue-list').append(el('li','현재 보고서에서 확인할 경고가 없습니다. 미검사 영역의 완료를 뜻하지 않습니다.'));
 const collectionById=new Map(collection.results.map(x=>[x.id,x]));
 function drawSources(){const q=$('#source-filter').value.trim().toLocaleLowerCase(),list=$('#source-list');list.replaceChildren();const shown=registry.sources.filter(s=>JSON.stringify(s).toLocaleLowerCase().includes(q));for(const source of shown){const row=el('article');row.className='source-row';const h=el('h3');h.append(link(source.title,source.url));row.append(h,el('p',source.oneSentence),link('분석과 적용 실험',source.analysisPage));const result=collectionById.get(source.id),state=!result?'이번 실행에서 미확인':result.ok?(result.changed?'원문 바이트 변경 · 내용 재검토 필요':'응답 확인 · 내용 개선의 검증과 구분'):'수집 보류 · '+result.error;const p=el('p',state);p.className='state';row.append(p);list.append(row);}$('#source-count').textContent=shown.length+' / '+registry.sources.length+'개 표시';}
 $('#source-filter').oninput=drawSources;drawSources();
 for(const report of status.reports){const li=el('li');li.append(link(report.id+' · '+report.passed+'/'+report.total,report.path));$('#reports').append(li);}
 for(const run of [...status.runs].reverse()){const li=el('li');li.append(el('strong',new Date(run.at).toLocaleString('ko-KR')),el('p','검사 '+run.passed+'/'+run.total+' · 확인할 항목 '+run.openIssues));$('#run-list').append(li);}
 for(const text of status.limits)$('#limit-list').append(el('li',text));
}
main().catch(error=>$('#updated').textContent=error.message);
