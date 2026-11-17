import {groundClips55} from './ground-clips55.mjs';

// 시간만으로 절대 자세를 복원하므로 느린 컴퓨터에서 렌더가 밀려도 운동 위상이 누적되지 않는다.
export function mountGroundPlayer55(host,apply){
  const make=(tag,text='')=>Object.assign(document.createElement(tag),{textContent:text});
  const box=make('div');box.className='choices';
  const mode=make('div');mode.className='choices';
  host.append(make('h2','실측 스쿼트 재생'),box,mode);
  const play=make('button','재생'),scrub=make('input'),clock=make('output');
  scrub.type='range';scrub.min=0;scrub.step=.05;scrub.ariaLabel='실측 동작 시간 (초)';play.type='button';
  const row=make('div');row.className='row';row.append(play,scrub,clock);host.append(row);
  let clip=groundClips55[0],method='segments',time=0,timer=0,epoch=0;
  const clips=new Map(),methods=new Map();
  function paint(){
    for(const [id,b] of clips)b.setAttribute('aria-pressed',String(id===clip.id));
    for(const [id,b] of methods)b.setAttribute('aria-pressed',String(id===method));
    scrub.max=clip.keys.at(-1)[0];scrub.value=time;clock.value=time.toFixed(2)+'초';
    play.textContent=timer?'멈춤':'재생';play.setAttribute('aria-pressed',String(!!timer));
  }
  function stop(){if(timer)clearInterval(timer);timer=0;paint();}
  function sample(done){
    const keys=clip.keys;let hi=keys.findIndex(k=>k[0]>=time);if(hi<0)hi=keys.length-1;
    const b=keys[hi],a=keys[Math.max(0,hi-1)],w=b[0]===a[0]?0:(time-a[0])/(b[0]-a[0]);
    const interp=k=>a[k]+(b[k]-a[k])*w;
    const pose={depth:interp(1),setback:interp(2),stance:0,turnout:0,clip55:{id:clip.id,method,time}};
    if(method==='segments')pose.segmentAngles={thigh:interp(3),shin:interp(4)};
    paint();apply(pose,done);
  }
  for(const c of groundClips55){
    const b=make('button',c.id+' · '+c.take+'번째');b.type='button';b.dataset.clip=c.id;
    b.onclick=()=>{stop();clip=c;time=0;sample(true);};clips.set(c.id,b);box.append(b);
  }
  for(const [id,title] of [['segments','다리 기울기 맞추기'],['pelvis','골반 궤적 맞추기']]){
    const b=make('button',title);b.type='button';b.dataset.method=id;
    b.onclick=()=>{stop();method=id;sample(true);};methods.set(id,b);mode.append(b);
  }
  scrub.oninput=()=>{const requested=scrub.valueAsNumber;stop();time=requested;sample(false);};
  scrub.onchange=()=>sample(true);
  play.onclick=()=>{
    if(timer){stop();sample(true);return;}
    if(time>=clip.keys.at(-1)[0])time=0;
    epoch=performance.now()-time*1000;
    timer=setInterval(()=>{
      if(document.hidden||!host.getClientRects().length){stop();return;}
      time=Math.min(clip.keys.at(-1)[0],(performance.now()-epoch)/1000);
      const ended=time>=clip.keys.at(-1)[0];if(ended)stop();sample(ended);
    },125);
    sample(false);
  };
  addEventListener('pagehide',stop);
  addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='bookfriend:studio-active'&&!e.data.active)stop();});
  paint();
  return {stop,sync(raw){
    const rec=raw?.clip55;
    if(!rec){stop();return;}
    const picked=groundClips55.find(c=>c.id===rec.id);if(!picked)return;
    clip=picked;method=rec.method;time=rec.time;paint();
  }};
}
