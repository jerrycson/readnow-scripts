const options=[
  ['boundary','전체 윤곽 거리'],
  ['upper','상단 윤곽 거리'],
  ['iou','윤곽 겹침'],
  ['oof','합성 OOF'],
];
const groups=[
  ['syntheticHeld','보류 합성 두상 8개'],
  ['scanClean','실측 1인 · 교정'],
  ['scanTiltedBox','같은 실측 · 기울기·상자 정렬'],
  ['counterexample','팔각 단면 반례'],
];
const make=(tag,text,cls)=>{
  const e=document.createElement(tag);
  if(text!==undefined)e.textContent=text;
  if(cls)e.className=cls;
  return e;
};
async function json(url){
  const response=await fetch(url);
  if(!response.ok)throw new Error(String(response.status));
  return response.json();
}
function draw(host,holdout,oof){
  const switches=make('div',undefined,'switches'),caption=make('p',undefined,'note');
  switches.setAttribute('role','group');switches.setAttribute('aria-label','비교할 채점 지표');
  const area=make('div'),legend=make('div',undefined,'legend');
  legend.append(make('span','기존 외피'),make('span','학습 보정'));
  const buttons=new Map();
  function show(metric){
    const learned=metric==='oof',percent=metric==='iou';
    const field=percent?'iou':metric==='upper'?'upperBoundaryPx':'boundaryPx';
    const rows=learned?oof.scores.map(r=>['폴드 '+r.fold+' · 보류 24개',r.baselinePx,r.learnedPx]):
      groups.map(([key,label])=>{
        const g=holdout.groups[key].held,factor=percent?100:1;
        return [label,g.before[field]*factor,g.after[field]*factor];
      });
    for(const [key,b] of buttons)b.setAttribute('aria-pressed',String(key===metric));
    const scale=percent?100:Math.max(1,Math.ceil(Math.max(...rows.flatMap(r=>r.slice(1)))*2)/2);
    const unit=percent?'%':'px';
    caption.textContent=learned?
      '합성 두상 96개를 4묶음으로 나눴습니다. 매번 72개로 학습하고 나머지 24개의 단면 지지거리를 예측했습니다. 55,296점의 평균 절대오차 '+oof.baselinePx.toFixed(3)+' → '+oof.learnedPx.toFixed(3)+'px. 128px 카메라 배율로 환산한 단면 오차이며 작을수록 좋습니다.':
      percent?'입력에 쓰지 않은 여섯 시점에서 원본과 겹치는 면적을 합집합 면적으로 나눴습니다. 클수록 좋습니다.':
      metric==='upper'?'128행 중 상단 69행의 실제 외곽점에서 상대 전체 외곽까지 거리를 쟀습니다. 전체 시험 뒤에 추가한 머리 쪽 분석이며 작을수록 좋습니다.':
      '입력에 쓰지 않은 여섯 시점에서 실제로 렌더한 두 윤곽 사이의 평균 거리입니다. 목·어깨가 포함된 실측 메시를 사용했고 작을수록 좋습니다.';
    const items=rows.map(([label,a,b])=>{
      const row=make('div',undefined,'score-row'),pair=make('div',undefined,'pair');
      for(const value of [a,b]){
        const series=make('div',undefined,'series'),axis=make('div',undefined,'axis'),bar=make('div',undefined,'bar');
        axis.setAttribute('aria-hidden','true');bar.style.width=(value/scale*100)+'%';axis.append(bar);
        series.append(axis,make('span',value.toFixed(percent?2:3)+unit,'number'));pair.append(series);
      }
      row.setAttribute('aria-label',label+' 기존 '+a.toFixed(3)+unit+', 보정 '+b.toFixed(3)+unit);
      row.append(make('strong',label),pair);return row;
    });
    area.replaceChildren(...items);host.dataset.metric=metric;
  }
  for(const [key,label] of options){
    const b=make('button',label);b.type='button';b.onclick=()=>show(key);buttons.set(key,b);switches.append(b);
  }
  host.classList.add('study-score');host.replaceChildren(switches,caption,legend,area);
  show('boundary');
}
const host=document.querySelector('[data-photo-scores]');
if(host){
  try{
    const [holdout,oof]=await Promise.all([json('../../pixel-lab/photo-eval44.json'),json('./photo-oof44.json')]);
    draw(host,holdout,oof);
  }catch{host.textContent='점수 파일을 열 수 없습니다. 아래 원자료 링크에서 조건과 숫자를 확인할 수 있습니다.';}
}
