const byId=id=>document.getElementById(id);
const node=(tag,body)=>Object.assign(document.createElement(tag),{textContent:body});
let current;
function section(label,description){
  const box=node('section','');
  box.append(node('h3',label),node('p',description));
  return box;
}
try {
  const response=await fetch('round-plan51.json');
  if(!response.ok)throw Error('회차 계획을 읽을 수 없습니다.');
  const rows=await response.json();
  function draw(){
    current=rows.find(row=>'#'+row.round===location.hash)||rows[0];
    for(const b of byId('rounds').children)b.setAttribute('aria-pressed',String(+b.dataset.round===current.round));
    const bands=node('div','');bands.className='bands';
    bands.append(section('얼굴·성인 여성 가슴 조형 30%',current.anatomy),section('기초 제작 70%',current.progress));
    const test=section('이번 회차의 검토 장면',current.check);test.className='evidence';
    const extra=current.optional?[section('70% 안에서 함께 볼 수 있는 변형',current.optional)]:[];
    byId('plan').replaceChildren(node('h2',current.round+'차 · '+current.title),bands,...extra,test,node('small','공동 계획 카드 '+current.cards.join(' · ')));
    byId('status').replaceChildren();byId('copy').disabled=false;
  }
  for(const row of rows){
    const button=node('button',row.round+'차');button.type='button';button.dataset.round=row.round;
    button.onclick=()=>{location.hash=String(row.round);};byId('rounds').append(button);
  }
  addEventListener('hashchange',draw);draw();
  byId('copy').onclick=async()=>{
    const r=current;
    const value=[r.round+'차 · '+r.title,'얼굴·성인 여성 가슴 조형 30%  '+r.anatomy,'기초 제작 70%  '+r.progress,'검토 장면  '+r.check,'공동 계획 카드  '+r.cards.join(', '),'미결함은 다음 회차에서 재검합니다. 모델링·리깅·벌징·애니메이션, 부위 설정·재질, 환경·심리의 완성도 검토 전에 게임 본개발 일정을 정하지 않습니다.'].join('\n\n');
    const shared=r.optional?value+'\n\n70% 안의 추가 실험  '+r.optional:value;
    try{await navigator.clipboard.writeText(shared);byId('status').textContent='복사했습니다.';}
    catch{const field=node('textarea','');field.value=shared;field.setAttribute('aria-label','복사할 회차 계획');byId('status').replaceChildren(field);field.select();}
  };
}catch(error){byId('plan').replaceChildren(node('p',error.message));}
