import {axes,zero,defaultView,pivotChoices,pivotSpec} from './studio-sculpt-model.mjs';
import {mountSurfaceControls} from './studio-surface-controls46.mjs';
import {mountAngle46} from './studio-angle46.mjs';
import {surfaceDefaults,surfaceAxes,tipShapes} from './surface-settings35.mjs';
import {isChestSubject} from './workbench-subjects50.mjs';
import {libraryChecks50} from './face-library-cheek50.mjs';
import {libraryHeightChecks50} from './face-library-height50.mjs';
import {markerLevels50} from './chest-marker-levels50.mjs';
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
import {chestFits51} from './chest-fits51.mjs';
import {mountAppearance52} from './appearance-panel52.mjs?v=55';
import {supportsChest53} from './chest53.mjs';
import {mountShoulder54} from './shoulder-panel54.mjs';
import {mountHip54} from './hip-panel54.mjs';
import {mountGround55} from './ground-panel55.mjs';
import {supportsChest54} from './chest54.mjs';
export function editor(onEdit,edition=50){
  const records=new Map();
  const appearanceBox=document.createElement('section');appearanceBox.id='appearance52';appearanceBox.hidden=true;
  el('modelTab').append(appearanceBox);
  const drawAppearance=edition>=52?mountAppearance52(appearanceBox,(appearance,done)=>{
    edit={...edit,appearance:{...appearance}};if(done)commit();onEdit();
  },edition):()=>{};
  let id, resolved=[], zoneKey=null, edit, last, back=[],forward=[], panel, dial;
  const drawShoulder=edition>=54?mountShoulder54(el('nativeShoulder54'),(nativeShoulder,done)=>{
    edit={...edit,nativeShoulder};if(done)commit();onEdit();
  }):()=>{};
  const drawHip=edition>=54?mountHip54(el('nativeHip54'),(nativeHip,done)=>{
    edit={...edit,nativeHip,ground55:null};if(done)commit();onEdit();
  }):()=>{};
  const groundBox=document.createElement('section');groundBox.id='nativeGround55';groundBox.hidden=true;
  el('nativeHip54').after(groundBox);
  const drawGround=edition>=55?mountGround55(groundBox,(ground55,done)=>{
    edit={...edit,ground55,nativeHip:null};if(done)commit();onEdit();
  }):()=>{};
  let nativeGroup='shoulder';
  function bodyJointGroup(key){
    nativeGroup=key;mark(el('nativeJoints54'),key);
    el('nativeShoulder54').hidden=el('nativeJoints54').hidden||key!=='shoulder';
    el('nativeHip54').hidden=el('nativeJoints54').hidden||key!=='hip';
    groundBox.hidden=el('nativeJoints54').hidden||key!=='ground';
    if(edit){drawShoulder(edit.nativeShoulder);drawHip(edit.nativeHip);drawGround(edit.ground55,id);}
  }
  if(edition>=54){
    const jointTabs=[['shoulder','어깨·팔'],['hip','골반·무릎']];
    if(edition>=55)jointTabs.push(['ground','발 접지']);
    buttons(el('nativeJoints54'),jointTabs,bodyJointGroup);
  }
  const kind=()=>isChestSubject(id)?'W':id;
  const pressureLabel=document.createElement('label'),pressure=document.createElement('input'),amount=document.createElement('output');
  pressure.type='range';pressure.min=0;pressure.max=100;pressure.step=1;pressure.ariaLabel='국소 압박 변형량';
  pressureLabel.append('국소 압박 변형량 ',pressure,' ',amount);
  pressureLabel.hidden=true;el('surfaceOptions').append(pressureLabel);
  pressure.oninput=()=>{edit={...edit,compression:pressure.valueAsNumber/100};amount.value=pressure.value+'%';onEdit();};
  pressure.onchange=()=>{commit();};
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
    if(!el('nativeShoulder54').hidden)drawShoulder(edit.nativeShoulder);
    if(!el('nativeHip54').hidden)drawHip(edit.nativeHip);
    if(!groundBox.hidden)drawGround(edit.ground55,id);
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
      pressureLabel.hidden=edition<55||edit.version!=='tissue55';
      pressure.value=Math.round(100*(edit.compression||0));amount.value=pressure.value+'%';
      el('showNac').checked=edit.surface.showNac;
      const shot=edit.pose&&edit.pose!=='neutral'?edit.pose:edit.angle===0?'neutral':edit.pivot==='arms.raise'?String(edit.angle):'';
      mark(el('poseShots'),shot);
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
    edit={...edit,version};
    if(isChestSubject(id))edit.markerVersion=['candidate','lower51','lowerContact52','floor52','tissue53','matched53','tissue54','tissue55'].includes(version)&&markerLevels50[id]?'rebound':'source';
    commit();drawControls();onEdit();
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
  el('angle').oninput=()=>{edit={...edit,pose:'neutral',angle:el('angle').valueAsNumber};drawControls();onEdit();};
  for(const type of ['change','pointerup','keyup','focusout'])el('poseTab').addEventListener(type,commit);
  function restore(from,to){
    commit();if(!from.length)return;
    to.push(clone(edit));edit=from.pop();last=clone(edit);drawControls();drawAppearance(id,edit.appearance);onEdit();
  }
  el('undo').onclick=()=>restore(back,forward);el('redo').onclick=()=>restore(forward,back);
  return {
    current:()=>edit,
    switchModel(key,editable,trial){
      if(id){commit();records.set(id,{edit,back,forward,zoneKey});}
      id=key;resolved=[];
      const saved=records.get(id);
      edit=saved?.edit||{values:editable?zero(kind()):{},pivot:editable?defaultView(kind()).pivot:null,angle:0};
      if(isChestSubject(id)&&!saved){
        edit.version='candidate';edit.markerVersion=markerLevels50[id]?'rebound':'source';
        edit.surface={...surfaceDefaults,showNac:true};
      }
      if(!saved&&(id==='F02'||Object.hasOwn(libraryChecks50,id)))edit.version=['F02','F03','F05'].includes(id)?'candidate':'source';
      if(id==='M04'&&!saved)edit.version='height';
      if(['M03','F05'].includes(id)&&!saved)edit.version='smooth';
      const options=[['source','보존 원형']];
      if(id!=='M01')options.push(['candidate',isChestSubject(id)?'교정 시험':'볼 폭 시험']);
      if(Object.hasOwn(libraryHeightChecks50,id))options.push(['height','턱 높이 시험']);
      if(['F01','F05','M03'].includes(id))options.push(['smooth','깊이선 다듬기'],['half','깊이선 절반'],['ablation','깊이항 제외']);
      if(id==='F02'||id==='M01')options.push(['C','입술 C'],['D','입술 D'],['E','입술 E']);
      if(edition>=51&&editable){
        if(isChestSubject(id)){
          if(chestFits51[id]){
            options.push(['lower51','51차 하부 곡선']);
            if(!saved)edit.version='lower51';
          }
        }else{
          options.push(['orbit51','51차 안와 교정']);
          if(['F02','M01'].includes(id))options.push(['contact51','51차 눈꺼풀 접촉 시험']);
          if(!saved&&id==='F02')edit.version='orbit51';
        }
      }
      if(edition>=52&&id==='F02')options.push(['jawNormal52','52차 H2 턱 음영'],['jawBoth52','H2 턱 형상·음영 · 보류']);
      if(edition>=52&&id==='W')options.push(['lowerContact52','52차 안·바깥 접선'],['floor52','하부 낮추기 · 보류']);
      if(edition>=53&&['F02','M01'].includes(id))options.push(['face53','53차 얼굴 표면 · 검토'],['field53','볼 지지면만 · 초기 시험']);
      if(edition>=53&&supportsChest53(id))options.push(['tissue53','53차 윤곽과 안쪽 피부 · 검토']);
      if(edition>=54&&['F02','M01'].includes(id))options.push(['face54','54차 눈·입과 턱 비교'],['support54','54차 하관만']);
      if(edition>=54&&supportsChest54(id))options.push(['matched53','53차 형상 · 같은 자세'],['tissue54','54차 겨드랑이 주름']);
      if(edition>=55&&['F02','M01'].includes(id))options.push(['lateral55','55차 귀 앞 피부'],['mouth55','55차 입매'],['face55','55차 두 교정 함께']);
      if(edition>=55&&isChestSubject(id))options.push(['tissue55','55차 피부 표식·압박']);
      if(!saved&&!editable&&edition>=53&&trial==='pelvis53'){
        edit.appearance={waistBreadth53:.58,waistDepth53:.84,seatDepth53:.60,pelvisJoin53:true};
      }
      el('nativeJoints54').hidden=editable||edition<54;
      el('researchJoints').hidden=!editable;
      if(!saved&&!editable&&edition>=54&&trial==='shoulder54')edit.nativeShoulder={elevation:90};
      if(!saved&&!editable&&edition>=54&&trial==='hip54')edit.nativeHip={right:{flex:60,knee:40}};
      if(!saved&&!editable&&edition>=55&&trial==='ground55')edit.ground55={depth:.14,supportPads:/-[2-4]$/.test(id)};
      bodyJointGroup(edition>=55&&trial==='ground55'?'ground':trial==='hip54'?'hip':trial==='shoulder54'?'shoulder':nativeGroup);
      if(!saved&&editable&&options.some(([key])=>key===trial)){
        edit.version=trial;
        if(isChestSubject(id))edit.markerVersion=['candidate','lower51','lowerContact52','floor52','tissue53','matched53','tissue54','tissue55'].includes(trial)&&markerLevels50[id]?'rebound':'source';
      }
      buttons(el('versions'),options,selectVersion);
      el('versionsBox').hidden=!editable;el('surfaceOptions').hidden=!isChestSubject(id);
      el('posePresets').hidden=!isChestSubject(id);
      if(isChestSubject(id)){
        const poses=[['neutral','중립'],['90','팔 90°'],['113','팔 113°'],['178','팔 178°']];
        if(!id.startsWith('design:'))poses.push(['waist','허리에 손'],['behindHead','머리 뒤에 손']);
        buttons(el('poseShots'),poses,shot=>{
          const angle=Number(shot)||0;
          edit={...edit,pivot:'arms.raise',angle,pose:angle?'neutral':shot};commit();drawControls();onEdit();
        });
      }
      last=clone(edit);back=saved?.back||[];forward=saved?.forward||[];zoneKey=saved?.zoneKey||null;
      buttons(el('joints'),editable?pivotChoices(kind()).map(p=>[p,pivotSpec(p).label]):[],pivot=>{
        commit();edit={...edit,pivot,angle:0,pose:'neutral'};commit();drawControls();onEdit();
      });
      el('zones').replaceChildren();drawControls();drawAppearance(id,edit.appearance);
    },
    zones(items){
      if(resolved.length||!items.length)return;
      resolved=items;buttons(el('zones'),items.map(z=>[z.key,z.label]),selectZone);
      selectZone(items.some(z=>z.key===zoneKey)?zoneKey:items[0].key);
    }
  };
}
