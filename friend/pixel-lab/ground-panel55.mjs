import {mountGroundPlayer55} from './ground-play55.mjs';
import {supportsKneeSurface55} from './knee-surface55.mjs';
const neutral={depth:0,setback:.48,stance:0,turnout:0};
const presets={
  rest:['서기',neutral],
  shallow:['얕게 앉기',{...neutral,depth:.14}],
  deep:['깊게 앉기',{depth:.40,setback:.48,stance:.35,turnout:22}],
  limit:['넓게 앉기',{depth:.50,setback:.70,stance:.50,turnout:32}]
};
const fields=[
  ['depth','골반 내림 · 다리 길이 %',0,52,100],
  ['setback','골반 뒤 이동 · 내림 대비 %',-20,110,100],
  ['stance','발 간격 변화 · 골반 너비 %',-22,55,100],
  ['turnout','발끝 바깥 회전 (°)',-15,40,1]
];
export function mountGround55(host,change,edition=55){
  const tag=(name,text='')=>Object.assign(document.createElement(name),{textContent:text});
  let pose={...neutral},currentId='';
  const title=tag('h2','발을 디딘 채 앉기'),box=tag('div');box.className='choices';host.append(title,box);
  const keys=new Map();
  for(const [id,[label,value]] of Object.entries(presets)){
    const b=tag('button',label);b.type='button';b.dataset.key=id;
    b.onclick=()=>{draw({...value,...surfaceSettings()});change({...pose},true);};keys.set(id,b);box.append(b);
  }
  const controls=fields.map(([key,label,min,max,factor])=>{
    const caption=tag('label',label),row=tag('div');row.className='row';
    const slider=tag('input'),number=tag('input');slider.type='range';number.type='number';slider.id='ground55-'+key;caption.htmlFor=slider.id;
    for(const el of [slider,number]){
      el.min=min;el.max=max;el.step=1;el.ariaLabel=label+(el===number?' 직접 입력':'');
      el.oninput=()=>{
        if(!el.validity.valid||!Number.isFinite(el.valueAsNumber))return;
        const manual=Object.fromEntries(fields.map(([k])=>[k,pose[k]]));manual[key]=el.valueAsNumber/factor;
        draw({...manual,...surfaceSettings()});change({...pose},false);
      };
      el.onchange=()=>{draw(pose);change({...pose},true);};
    }
    row.append(slider,number);host.append(caption,row);return {key,factor,slider,number};
  });
  const padLabel=tag('label'),pad=tag('input');pad.type='checkbox';padLabel.className='check';
  padLabel.append(pad,' 뒤꿈치·앞발 접촉면');host.append(padLabel);
  const kneeLabel=tag('label'),knee=tag('input');knee.type='checkbox';kneeLabel.className='check';
  kneeLabel.append(knee,' 무릎 피부 잇기');host.append(kneeLabel);
  let knee57,knee57Label;
  if(edition>=57){
    knee57Label=tag('label');knee57=tag('input');knee57.type='checkbox';knee57.id='kneeSurface57';knee57Label.className='check';
    knee57Label.append(knee57,' 57차 · 중립부터 같은 무릎 피부로 잇기');host.append(knee57Label);
    const micro=tag('div');micro.className='choices';host.append(micro);
    for(const [depth,text]of [[0,'중립'],[.000001,'첫 굽힘'],[.01,'다리 길이 1% 내림']]){
      const b=tag('button',text);b.type='button';b.dataset.depth57=depth;
      b.onclick=()=>{draw({...neutral,depth,...surfaceSettings()});change({...pose},true);};micro.append(b);
    }
    host.append(tag('p','57차는 55차에서 연결을 검사한 남성 5·7·8등신과 여성 6등신의 수동 비교입니다. 정지·작은 굽힘·실측 스쿼트를 확인하며 보행 완성으로 판정하지 않습니다.'));
    knee57.onchange=updateSurface;
  }
  function surfaceSettings(){return {supportPads:pad.checked&&!padLabel.hidden,kneeSurface:knee.checked&&!kneeLabel.hidden,...(edition>=57?{kneeSurface57:knee57.checked&&!kneeLabel.hidden}: {})};}
  function updateSurface(){draw({...pose,...surfaceSettings()});change({...pose},true);}
  pad.onchange=updateSurface;knee.onchange=updateSurface;
  const player=mountGroundPlayer55(host,(snapshot,done)=>{draw({...snapshot,...surfaceSettings()});change({...pose},done);});
  function draw(raw,id=currentId){
    currentId=id;padLabel.hidden=!/^(female|male)-[2-4]$/.test(id);
    const [sex,heads]=id.split('-'),n=Number(heads);
    kneeLabel.hidden=!['male','female'].includes(sex)||!supportsKneeSurface55({proportions:{f:sex==='female',n,cute:n<=4}});
    if(knee57){knee57Label.hidden=kneeLabel.hidden;knee57.checked=!!raw?.kneeSurface57&&!kneeLabel.hidden;knee.disabled=knee57.checked;}
    pad.checked=!!raw?.supportPads&&!padLabel.hidden;knee.checked=!!raw?.kneeSurface&&!kneeLabel.hidden;
    pose={...neutral,...raw};
    player.sync(raw);
    for(const [id,b] of keys){const q=presets[id][1];b.setAttribute('aria-pressed',String(!raw?.clip55&&fields.every(([key])=>q[key]===pose[key])));}
    for(const {key,factor,slider,number} of controls){
      const value=Math.round(pose[key]*factor);slider.value=value;
      if(document.activeElement!==number||number.valueAsNumber!==value)number.value=value;
    }
  }
  draw(null);return draw;
}
