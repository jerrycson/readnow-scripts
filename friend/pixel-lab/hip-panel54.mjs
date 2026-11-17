const shots={
  original:null,
  flex:{right:{flex:60,knee:40}},
  abduct:{right:{abduct:32}},
  stride:{right:{flex:29,knee:21},left:{flex:-12,knee:8}},
  bend:{left:{flex:40,knee:65},right:{flex:40,knee:65}},
  extreme:{right:{flex:95,abduct:40,knee:90}}
};
const labels={original:'기존 중립',flex:'한 다리 굽힘',abduct:'옆으로 벌림',stride:'보폭',bend:'양 무릎',extreme:'복합 한계 시험'};
const fields=[['flex','고관절 굽힘',-30,120],['abduct','고관절 벌림',-20,60],['knee','무릎 굽힘',0,135]];
export function mountHip54(host,change){
  const tag=(name,text='')=>Object.assign(document.createElement(name),{textContent:text});
  function choices(entries,choose){
    const box=tag('div');box.className='choices';host.append(box);
    for(const [k,txt] of entries){const b=tag('button',txt);b.type='button';b.dataset.key=k;b.onclick=()=>choose(k);box.append(b);}
    return key=>{for(const b of box.children)b.setAttribute('aria-pressed',String(b.dataset.key===key));};
  }
  let value=null,side='right';
  host.append(tag('h2','골반과 무릎 자세'));
  const set=choices(Object.entries(labels),key=>{value=structuredClone(shots[key]);draw();change(value,true);});
  host.append(tag('h2','각도 직접 조절'));
  const mark=choices([['left','모델 왼다리'],['right','모델 오른다리']],key=>{side=key;draw();});
  const controls=fields.map(([key,label,min,max])=>{
    const title=tag('label',label),row=tag('div');row.className='row';
    const range=tag('input'),number=tag('input');range.type='range';number.type='number';
    for(const input of [range,number]){
      input.min=min;input.max=max;input.step=1;
      input.ariaLabel=label+(input===number?' 직접 입력':'');
      input.oninput=()=>{
        if(!Number.isFinite(input.valueAsNumber)||!input.validity.valid)return;
        value={...value,[side]:{...value?.[side],[key]:input.valueAsNumber}};draw();change(value,false);
      };
      input.onchange=()=>{draw();change(value,true);};
    }
    range.id='hip54-'+key;title.htmlFor=range.id;row.append(range,number);host.append(title,row);
    return {key,range,number};
  });
  const note=tag('p');host.append(note);
  function draw(){
    mark(side);set(Object.keys(shots).find(k=>JSON.stringify(shots[k])===JSON.stringify(value)));
    for(const {key,range,number} of controls){const deg=value?.[side]?.[key]||0;range.value=deg;if(document.activeElement!==number||number.valueAsNumber!==deg)number.value=deg;}
    note.textContent=Object.values(value||{}).some(p=>Math.abs(p.flex||0)>=95&&Math.abs(p.abduct||0)>=40)?'2등신 일부 체형에서 피부 접힘을 확인한 시험 자세입니다.':'';
  }
  return raw=>{value=raw||null;draw();};
}
