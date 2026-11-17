export function isPublishedRelease(row){
  return !!row&&row.project==='bookfriend'&&/^[a-f0-9]{24}$/.test(row.id)&&Number.isSafeInteger(row.round)&&row.round>0&&typeof row.label==='string'&&row.label.trim().length>0&&Number.isSafeInteger(row.cards)&&row.cards>=0&&typeof row.at==='string'&&Number.isFinite(Date.parse(row.at));
}
export function latestPublished(rows){
  return (Array.isArray(rows)?rows:[]).filter(isPublishedRelease).sort((a,b)=>b.round-a.round||Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id))[0]||null;
}
export function publishHostedRelease(rows,doc=document){
  const row=latestPublished(rows);if(!row)return null;
  const value=JSON.stringify(row);if(doc.documentElement.dataset.publishedBookfriend!==value){doc.documentElement.dataset.publishedBookfriend=value;doc.dispatchEvent(new CustomEvent('bookfriend:published',{detail:row}));}return row;
}
export function releaseTime(at){
  if(!Number.isFinite(Date.parse(at)))return '확인 중';
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at)),get=k=>parts.find(p=>p.type===k)?.value;
  return get('year')+'-'+get('month')+'-'+get('day')+' '+get('hour')+':'+get('minute')+' KST';
}
const number=n=>Number.isSafeInteger(n)&&n>=0?new Intl.NumberFormat('en-US').format(n):'확인 중';
export function renderPublishedSummary({published,current,loadedCount,pinned,requested},doc=document){
  const set=(id,value)=>{const e=doc.getElementById(id);if(e&&e.textContent!==value)e.textContent=value;};
  set('publishedRound',published?number(published.round):'확인 중');set('publishedCards',published?number(published.cards):'확인 중');set('publishedAt',published?releaseTime(published.at):'확인 중');
  const at=doc.getElementById('publishedAt');if(at&&published)at.dateTime=published.at;
  for(const id of ['publishedRoundUnit','publishedCardsUnit']){const e=doc.getElementById(id);if(e)e.hidden=!published;}
  set('viewedRelease',current?number(current.round)+'차 · 실제 읽은 자료 '+number(loadedCount)+'개':'자료를 읽는 중입니다.');set('releaseMode',pinned?'선택한 회차 고정 · 새 회차가 와도 유지':'최신 회차 자동 따라가기');
  const follow=doc.getElementById('followLatest');if(follow){follow.disabled=!requested;follow.textContent=requested?'최신 회차로 돌아가기':'최신 회차를 따라가는 중';}
  const journal=doc.getElementById('publishedJournal');if(journal&&published){journal.href=published.round>=38?'../../pixel-lab/round'+published.round+'.html':'?tab=originals&doc=journal';journal.textContent=number(published.round)+'차 일지 바로가기';}
}
