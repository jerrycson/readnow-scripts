import {axes,zero,defaultView,pivotChoices,pivotSpec} from './studio-sculpt-model.mjs';
import {mountSurfaceControls} from './studio-surface-controls46.mjs';
import {mountAngle46} from './studio-angle46.mjs';
import {surfaceDefaults,surfaceAxes,tipShapes} from './surface-settings35.mjs';
import {isChestSubject} from './workbench-subjects50.mjs';
import {libraryChecks50} from './face-library-cheek50.mjs';
import {libraryHeightChecks50} from './face-library-height50.mjs';
const el=id=>document.getElementById(id);
export function buttons(host,entries,choose){
  host.replaceChildren();
  for(const [key,label] of entries){
    const b=document.createElement('button');b.type='button';b.dataset.key=String(key);
    b.textContent=label;b.onclick=()=>choose(key);host.append(b);
  }
}
export function mark(host,key){
  for(const b of host.querySelectorAll('button[data-key]'))b.setAttribute('aria-pressed',String(b.dataset.key===String(key)));
}
export function editor(onEdit){
  const records=new Map();
  let id, resolved=[], zoneKey=null, edit, last, back=[],forward=[], panel, dial;
  const kind=()=>isChestSubject(id)?'W':id;
  const region=()=>resolved.find(z=>z.key===zoneKey);
  const clone=x=>structuredClone(x);
  function history(){el('undo').disabled=!back.length;el('redo').disabled=!forward.length;}
  function commit(){
    if(JSON.stringify(last)!==JSON.stringify(edit)){
      back.push(last);if(back.length>100)back.shift();forward=[];last=clone(edit);
    }
    history();
  }
  function drawControls(){
    const z=region();el('surfaceControls').hidden=!z;
    if(z){
      panel.refresh();const labels=axes(kind());
      for(const input of el('numbers').querySelectorAll('input')){
        if(document.activeElement!==input)input.value=edit.values[input.dataset.axis];
        input.ariaLabel=labels[input.dataset.axis];
      }
    }
    mark(el('versions'),edit.version);
    if(isChestSubject(id)){
      el('showNac').checked=edit.surface.showNac;
      mark(el('markerVersion'),edit.markerVersion||'source');
      el('markerControls').hidden=!edit.surface.showNac;
      for(const n of el('markerAxes').querySelectorAll('input')){
        n.value=edit.surface[n.dataset.key];n.nextElementSibling.textContent=Math.round(n.value*100)+'%';
      }
      mark(el('tipShapes'),edit.surface.nippleShape);
    }
    if(edit?.pivot){
      const {min,max}=pivotSpec(edit.pivot),range=el('angle');
      range.min=min;range.max=max;range.value=edit.angle;dial.sync();
    }
    mark(el('joints'),edit?.pivot);history();
  }
  function changeValues(values){edit={...edit,values};drawControls();onEdit();}
  function selectZone(key){
    zoneKey=key;mark(el('zones'),key);const regionNow=region();
    const host=el('numbers');host.replaceChildren();
    if(regionNow)for(const axis of [regionNow.xAxis,regionNow.yAxis]){
      const label=document.createElement('label'),input=document.createElement('input');
      label.textContent=axes(kind())[axis];input.type='number';input.min=-100;input.max=100;input.step=1;input.dataset.axis=axis;
      input.oninput=()=>{if(input.value!==''&&input.validity.valid)changeValues({...edit.values,[axis]:input.valueAsNumber});};
      input.onchange=()=>{input.value=edit.values[axis];commit();};label.append(input);host.append(label);
    }
    drawControls();
  }
  panel=mountSurfaceControls({zone:region,labels:()=>axes(kind()),values:()=>edit.values,preview:changeValues,commit});
  function marker(changes,done=true){
    edit={...edit,surface:{...edit.surface,...changes}};drawControls();onEdit();if(done)commit();
  }
  function selectVersion(version){
    edit={...edit,version};commit();drawControls();onEdit();
  }
  el('showNac').onchange=()=>marker({showNac:el('showNac').checked});
  buttons(el('markerVersion'),[['source','기존 부착'],['rebound','피부에 다시 밀착']],markerVersion=>{
    edit={...edit,markerVersion};commit();drawControls();onEdit();
  });
  for(const [key,name] of surfaceAxes){
    const label=document.createElement('label'),title=document.createElement('span'),slider=document.createElement('input'),amount=document.createElement('output');
    title.textContent=name.split(' · ')[0];slider.type='range';slider.min=0;slider.max=1;slider.step=.01;slider.dataset.key=key;slider.ariaLabel=name;
    slider.oninput=()=>marker({[key]:slider.valueAsNumber},false);slider.onchange=commit;
    label.append(title,slider,amount);el('markerAxes').append(label);
  }
  buttons(el('tipShapes'),tipShapes,nippleShape=>marker({nippleShape}));
  dial=mountAngle46({host:el('jointDial'),range:el('angle'),number:el('angleNumber')});
  el('angle').oninput=()=>{edit={...edit,angle:el('angle').valueAsNumber};drawControls();onEdit();};
  for(const type of ['change','pointerup','keyup','focusout'])el('poseTab').addEventListener(type,commit);
  function restore(from,to){
    commit();if(!from.length)return;
    to.push(clone(edit));edit=from.pop();last=clone(edit);drawControls();onEdit();
  }
  el('undo').onclick=()=>restore(back,forward);el('redo').onclick=()=>restore(forward,back);
  return {
    current:()=>edit,
    switchModel(key,editable){
      if(id){commit();records.set(id,{edit,back,forward,zoneKey});}
      id=key;resolved=[];
      const saved=records.get(id);
      edit=saved?.edit||{values:editable?zero(kind()):{},pivot:editable?defaultView(kind()).pivot:null,angle:0};
      if(isChestSubject(id)&&!saved){edit.version='source';edit.surface={...surfaceDefaults,showNac:true};}
      if(!saved&&(id==='F02'||Object.hasOwn(libraryChecks50,id)))edit.version=['F02','F03','F05'].includes(id)?'candidate':'source';
      if(id==='M04'&&!saved)edit.version='height';
      const options=[['source','보존 원형']];
      if(id!=='M01')options.push(['candidate',isChestSubject(id)?'교정 시험':'볼 폭 시험']);
      if(Object.hasOwn(libraryHeightChecks50,id))options.push(['height','턱 높이 시험']);
      if(id==='F02'||id==='M01')options.push(['C','입술 C'],['D','입술 D'],['E','입술 E']);
      buttons(el('versions'),options,selectVersion);
      el('versionsBox').hidden=!editable;el('surfaceOptions').hidden=!isChestSubject(id);
      last=clone(edit);back=saved?.back||[];forward=saved?.forward||[];zoneKey=saved?.zoneKey||null;
      buttons(el('joints'),editable?pivotChoices(kind()).map(p=>[p,pivotSpec(p).label]):[],pivot=>{
        commit();edit={...edit,pivot,angle:0};commit();drawControls();onEdit();
      });
      el('zones').replaceChildren();drawControls();
    },
    zones(items){
      if(resolved.length||!items.length)return;
      resolved=items;buttons(el('zones'),items.map(z=>[z.key,z.label]),selectZone);
      selectZone(items.some(z=>z.key===zoneKey)?zoneKey:items[0].key);
    }
  };
}
