import {FACIAL_OPTIONS} from './facial.mjs';
import {HAIR_DESIGNS} from './hair-design.mjs';
import {bodyDefault52,bodyPresets52,supportsBody52} from './body-composition52.mjs';
import {facialGroups52,supportsAppearance52} from './appearance52.mjs';
import {faceOptions50} from './face-options50.mjs';
import {drawTorso53} from './torso-controls53.mjs';

export function mountAppearance52(host,publish,edition=52){
  let id,values={},group='hair';
  const node=(tag,text='')=>Object.assign(document.createElement(tag),{textContent:text});
  const tabs=node('div'),choices=node('div'),search=node('input'),tissue=node('div');
  const reset=node('button','외형 원형 복원'),body=node('section');
  tabs.className='choices appearanceTabs';choices.className='choices appearanceChoices';tissue.className='compositionAxes';search.type='search';search.setAttribute('aria-label','머리 스타일 찾기');
  search.placeholder='머리 이름 검색';body.append(tabs,search,choices,tissue,reset);host.append(node('h2','외형 조합'),body);
  function choiceButton(key,label,active,change){
    const b=node('button',label);b.type='button';b.dataset.key=key;b.setAttribute('aria-pressed',String(active));b.onclick=change;return b;
  }
  const change=(delta,commit=true)=>{values={...values,...delta};publish(values,commit);};
  reset.onclick=()=>{values={};search.value='';publish(values,true);draw();};
  function paintOptions(){
    choices.replaceChildren();search.hidden=group!=='hair';tissue.hidden=!['body','torso'].includes(group);
    if(group==='torso'){
      drawTorso53(choices,tissue,values,change,draw,choiceButton);
      return;
    }
    if(group==='head'){
      const sex=id.split('-')[0],current=values.researchFace||'native';
      const entries=[['native','이 몸의 기본 얼굴'],...faceOptions50.filter(x=>x.sex===sex).map(x=>[x.id,x.label])];
      for(const [key,label] of entries)choices.append(choiceButton(key,label,key===current,()=>{change({researchFace:key});draw();}));
      if(edition>=54&&['F02','M01'].includes(current)){
        const controls=node('div');controls.className='choices';
        const versions=[['source','기존 얼굴'],['face54','54차 얼굴 시안']];
        if(edition>=55)versions.push(['lateral55','55차 귀 앞 피부'],['face55','55차 입과 귀 앞 피부']);
        for(const [key,label] of versions){
          controls.append(choiceButton(key,label,(values.researchFaceVersion||'source')===key,()=>{change({researchFaceVersion:key});draw();}));
        }
        choices.append(controls);
      }
      return;
    }
    if(group==='body'){
      for(const p of bodyPresets52)choices.append(choiceButton(p.id,p.label,Object.entries(p.values).every(([key,v])=>(values[key]??bodyDefault52[key])===v),()=>{change(p.values);draw();}));
      tissue.replaceChildren();
      for(const [key,label] of [['muscularity','근육량'],['adiposity','피하지방량']]){
        const item=node('label',label+' '),range=node('input'),reading=node('output');
        range.type='range';range.min=0;range.max=1;range.step=.01;range.value=values[key]??bodyDefault52[key];range.setAttribute('aria-label',label);
        reading.textContent=Number(range.value).toFixed(2);item.append(range,reading);tissue.append(item);
        range.oninput=()=>{reading.textContent=Number(range.value).toFixed(2);change({[key]:range.valueAsNumber},false);for(const b of choices.children)b.setAttribute('aria-pressed','false');};
        range.onchange=()=>{change({[key]:range.valueAsNumber});paintOptions();};
      }
      return;
    }
    const baseIndex=group==='eyeShape'?3:group==='noseShape'?1:0;
    const entries=group==='hair'?[['none','머리 없음'],...HAIR_DESIGNS.filter(x=>!search.value||[x.name,x.id,x.family].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())).map(x=>[x.id,x.name+' · '+x.id.toUpperCase()])]:FACIAL_OPTIONS[group].map(x=>[x.id,x.name]);
    const current=values[group]??(group==='hair'?'none':baseIndex);
    for(const [key,label] of entries)choices.append(choiceButton(key,label,current===key,()=>{change({[group]:key});paintOptions();}));
  }
  search.oninput=paintOptions;
  function draw(){
    const native=supportsBody52(id),research=faceOptions50.some(x=>x.id===values.researchFace);
    const groups=[...(native?[['head','얼굴 교체']]:[]),['hair','머리'],...(native?[...(research?[]:Object.entries(facialGroups52)),['body','체형']]:[])];
    if(native&&edition>=53)groups.push(['torso','허리·골반']);
    if(!groups.some(([key])=>key===group))group='hair';
    tabs.replaceChildren(...groups.map(([key,label])=>choiceButton(key,label,group===key,()=>{group=key;search.value='';draw();})));
    paintOptions();
  }
  return function sync(subject,appearance){
    const old=id;id=subject;values=appearance||{};
    host.hidden=!supportsAppearance52(id);if(host.hidden)return;
    if(id!==old)search.value='';
    draw();
  };
}
