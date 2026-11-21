// 같은 편집 세션에서 같은 방법을 반복 평가한 경우 마지막 명시적 선택만 학습한다.
const actionKey=r=>[r.task,r.subject,r.method].join('|');
const average=(rows,prior=.5,strength=2)=>(rows.reduce((n,r)=>n+r.y,0)+strength*prior)/(rows.length+strength);
function choices(rows){
  const last=new Map();
  for(const r of rows){
    if(!['accepted','rejected','reverted'].includes(r.outcome)||!r.episode||!r.at)continue;
    const key=r.episode+'|'+actionKey(r),prior=last.get(key);
    if(!prior||r.at>prior.at||(r.at===prior.at&&r.id>prior.id))last.set(key,{episode:r.episode,group:actionKey(r),at:r.at,id:r.id,y:Number(r.outcome==='accepted')});
  }
  return [...last.values()];
}
export function preferenceScore(rows){
  const labels=choices(rows),episodes=[...new Set(labels.map(r=>r.episode))],groups=Object.create(null);
  const overall=average(labels);
  for(const key of new Set(labels.map(r=>r.group))){const part=labels.filter(r=>r.group===key);groups[key]={n:part.length,acceptance:average(part,overall,4)};}
  let base=0,learned=0,worse=0;
  if(episodes.length>=3){
    for(const episode of episodes){
      const train=labels.filter(r=>r.episode!==episode),test=labels.filter(r=>r.episode===episode),p=average(train);
      let a=0,b=0;for(const r of test){a+=(r.y-p)**2;b+=(r.y-average(train.filter(x=>x.group===r.group),p,4))**2;}
      base+=a;learned+=b;if(b>a+1e-9)worse++;
    }
  }
  const tested=episodes.length>=3;return {pairs:labels.length,episodes:episodes.length,groups,
    baselineBrier:tested?base/labels.length:null,candidateBrier:tested?learned/labels.length:null,worseEpisodes:tested?worse:null,
    status:tested?'검증 후보':'독립 세션 수집 중'};
}
