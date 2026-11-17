import {torsoPresets53} from './torso53.mjs';

export function drawTorso53(choices,host,values,change,redraw,button){
  const axes=[['waistBreadth53','허리 폭'],['waistDepth53','허리 깊이'],['seatDepth53','엉덩이 깊이']];
  const create=(tag,text='')=>Object.assign(document.createElement(tag),{textContent:text});
  const controls={...torsoPresets53.original,...values};
  const inputs=new Map();
  for(const [key,label] of [['original','52차 원형'],['sections','단면 교정'],['joined','골반과 허벅지 잇기']]){
    const preset=torsoPresets53[key];
    const active=Object.entries(preset).every(([k,v])=>v===controls[k]);
    choices.append(button(key,label,active,()=>{change(preset);redraw();}));
  }
  host.replaceChildren();
  const label=create('label','골반 연결면 '),join=create('input');
  join.type='checkbox';join.checked=!!controls.pelvisJoin53;
  join.onchange=()=>{change({pelvisJoin53:join.checked});redraw();};
  label.prepend(join);host.append(label);
  const pad=create('div'),point=create('span'),legend=create('small','가로로 허리 폭 · 위아래로 허리 깊이');
  pad.className='torsoPad53';point.className='torsoPoint53';pad.append(point);host.append(legend,pad);
  for(const [key,name] of axes){
    const row=create('label',name+' '),input=create('input');
    input.type='number';input.min=-1;input.max=1;input.step=.01;input.value=controls[key];input.setAttribute('aria-label',name);
    inputs.set(key,input);row.append(input);host.append(row);
    input.oninput=()=>{
      if(input.value!==''&&input.validity.valid)preview({[key]:input.valueAsNumber},false);
    };
    input.onchange=()=>{change({[key]:controls[key]},true);redraw();};
  }
  function position(){
    point.style.left=(50+50*controls.waistBreadth53)+'%';
    point.style.top=(50-50*controls.waistDepth53)+'%';
  }
  function preview(delta,done){
    Object.assign(controls,delta);
    for(const [k,v] of Object.entries(delta))if(document.activeElement!==inputs.get(k))inputs.get(k).value=v;
    for(const b of choices.children)b.setAttribute('aria-pressed','false');
    position();change(delta,done);
  }
  function sample(event,done){
    const box=pad.getBoundingClientRect();
    const bound=n=>Math.round(100*Math.max(-1,Math.min(1,n)))/100;
    preview({waistBreadth53:bound(2*(event.clientX-box.left)/box.width-1),
      waistDepth53:bound(1-2*(event.clientY-box.top)/box.height)},done);
  }
  pad.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();pad.setPointerCapture(e.pointerId);sample(e,false);};
  pad.onpointermove=e=>{if(pad.hasPointerCapture(e.pointerId))sample(e,false);};
  pad.onpointerup=e=>{if(!pad.hasPointerCapture(e.pointerId))return;sample(e,true);pad.releasePointerCapture(e.pointerId);};
  pad.onpointercancel=()=>{change({waistBreadth53:controls.waistBreadth53,waistDepth53:controls.waistDepth53},true);};
  position();
}
