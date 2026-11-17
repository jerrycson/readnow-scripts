import {tabRoute as studioTabRoute} from './studio-tab-route.mjs';
import {DEFAULTS,HEADS,ANGLES,baseSamples,validateSettings,createProfile} from './model.mjs';
import {BODY_AXES,BODY_PRESETS,bodyPreset} from './body-design.mjs';
import {HAIR_DESIGNS} from './hair-design.mjs';
import {FACIAL_OPTIONS} from './facial.mjs';
import {renderPixels} from './renderer.mjs';
import {openStore} from './storage.mjs';
const $=s=>document.querySelector(s),faceLabels={faceShape:'얼굴형',eyeShape:'눈',noseShape:'코',mouthShape:'입',earShape:'귀'};
let settings={...DEFAULTS,heads:7,resolution:128},yaw=0,tab='bodies',generation=0;
for(const n of HEADS)$('#heads').add(new Option(n+'등신',String(n),n===7,n===7));for(const n of ANGLES)$('#yaw').add(new Option(n+'°',String(n)));for(const p of BODY_PRESETS)$('#body-preset').add(new Option(p.name,p.id));
for(const [key,title]of Object.entries(BODY_AXES)){const label=document.createElement('label'),input=document.createElement('input'),out=document.createElement('output');label.textContent=title;input.id=key;input.type='range';input.min='0';input.max='1';input.step='.05';input.value=String(settings[key]);out.id=key+'-value';out.value=input.value;label.append(out,input);$('#body-axes').append(label);input.oninput=()=>{settings[key]=Number(input.value);out.value=input.value;preview();};input.onchange=catalog;}
for(const [key,items]of Object.entries(FACIAL_OPTIONS)){const label=document.createElement('label'),select=document.createElement('select');label.textContent=faceLabels[key];select.id=key;for(const item of items)select.add(new Option((item.id+1)+'. '+item.name,String(item.id)));select.value=String(settings[key]);label.append(select);$('#face-options').append(label);select.onchange=()=>{settings[key]=Number(select.value);preview();catalog();};}
const hairLabel=document.createElement('label'),hairSelect=document.createElement('select');hairLabel.textContent='머리 모양';hairSelect.id='hair';hairSelect.add(new Option('없음 · 맨몸 연구','none'));for(const h of HAIR_DESIGNS)hairSelect.add(new Option(h.id+' '+h.name,h.id));hairLabel.append(hairSelect);$('#face-options').append(hairLabel);hairSelect.onchange=()=>{settings.hair=hairSelect.value;preview();catalog();};
for(const [id,name]of [['hair-m','머리 · 남성 제안 50'],['hair-f','머리 · 여성 제안 50'],['bodies','남녀 2~8등신'],['manga','망가풍 6~8등신'],['bodyTypes','체형 20종'],...Object.entries(faceLabels).map(([k,v])=>[k,v+' 20종'])]){const b=document.createElement('button');b.textContent=name;b.dataset.tab=id;b.setAttribute('aria-pressed',String(id===tab));b.onclick=()=>{tab=id;studioRoute.write(id);catalog();};$('#catalog-tabs').append(b);}
const studioRoute=studioTabRoute({allowed:Array.from($('#catalog-tabs').children,b=>b.dataset.tab),fallback:'bodies',onPop:next=>{tab=next;catalog();}});
tab=studioRoute.read();
function paint(canvas,s,options={}){const r=renderPixels(s,{yaw,...options});canvas.width=r.width;canvas.height=r.height;canvas.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);}
function sync(){for(const key of ['sex','heads','designStyle','resolution','hair',...Object.keys(BODY_AXES),...Object.keys(FACIAL_OPTIONS)]){$('#'+key).value=String(settings[key]);if($('#'+key+'-value'))$('#'+key+'-value').value=String(settings[key]);}}
function preview(){settings=validateSettings(settings);paint($('#body-preview'),settings);paint($('#face-preview'),{...settings,resolution:128},{portrait:true});$('#body-caption').textContent=(settings.sex==='female'?'여성':'남성')+' · '+settings.heads+'등신 · '+(settings.heads<=4?'귀여운형':settings.designStyle==='manga'?'망가풍':'현실형');}
async function catalog(){const token=++generation;$('#catalog-tabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));const grid=$('#catalog-grid');grid.replaceChildren();let rows=[];
 if(tab==='bodies')rows=baseSamples().map(s=>({title:(s.sex==='female'?'여성':'남성')+' '+s.heads+'등신',settings:{...settings,...s,designStyle:'natural'}}));
 else if(tab==='manga')rows=['male','female'].flatMap(sex=>[6,7,8].map(heads=>({title:(sex==='female'?'여성':'남성')+' '+heads+'등신',settings:{...settings,sex,heads,designStyle:'manga'}})));
 else if(tab==='bodyTypes')rows=BODY_PRESETS.map(p=>({title:p.name,settings:{...settings,heads:Math.max(5,settings.heads),...bodyPreset(p.id)}}));
 else if(tab.startsWith('hair-'))rows=HAIR_DESIGNS.filter(h=>h.collection===tab.slice(-1)).map(h=>({title:h.id+' '+h.name,settings:{...settings,hair:h.id},portrait:'hair'}));
 else rows=FACIAL_OPTIONS[tab].map(p=>({title:(p.id+1)+'. '+p.name,settings:{...settings,[tab]:p.id},portrait:true}));
 $('#catalog-status').textContent=rows.length+'개 시안 · 누르면 선택한 몸에 적용됩니다.';
 for(const row of rows){if(generation!==token)return;const b=document.createElement('button'),c=document.createElement('canvas'),label=document.createElement('span');b.className='design-card';label.textContent=row.title;b.append(c,label);grid.append(b);paint(c,{...row.settings,resolution:128},{portrait:row.portrait||false});b.onclick=()=>{settings={...row.settings};sync();preview();};await new Promise(requestAnimationFrame);}
}
for(const key of ['sex','heads','designStyle','resolution'])$('#'+key).onchange=()=>{settings[key]=['heads','resolution'].includes(key)?Number($('#'+key).value):$('#'+key).value;preview();catalog();};$('#yaw').onchange=()=>{yaw=Number($('#yaw').value);preview();catalog();};$('#body-preset').onchange=()=>{Object.assign(settings,bodyPreset($('#body-preset').value));sync();preview();catalog();};
$('#save-character').onclick=async()=>{const b=$('#save-character');b.disabled=true;try{const store=await openStore(),profile=createProfile(crypto.randomUUID(),'새 몸 연구',settings.sex);profile.settings=validateSettings(settings);await store.commit(profile,null,'몸·얼굴 연구에서 새 친구 생성');sessionStorage.setItem('readnow-pixel-selected',profile.id);$('#save-status').textContent='연구 친구로 저장했습니다.';const a=document.createElement('a');a.href='./';a.textContent=' 연구실에서 이 친구 열기';$('#save-status').append(a);store.close?.();}catch(error){$('#save-status').textContent=error.message;}finally{b.disabled=false;}};
sync();preview();catalog();
