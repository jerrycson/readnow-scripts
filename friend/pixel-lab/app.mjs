import {ANGLES,HEADS,CANDIDATES,SPECIES,ACTIONS,APPEARANCE,createProfile,validateSettings,validName,recordExperience,experienceText,baseSamples,rotationStates,normalizeAngle,walkPosition,groundHeight} from './model.mjs';
import {phaseFromDistance} from './motion.mjs';
import {openStore} from './storage.mjs';
import {renderPixels,paintCanvas} from './renderer.mjs';
import {StudyPresence} from './presence.mjs';
import {createWorld,stepWorld,stepProps,drawWorld,approachObject} from './world.mjs';
import {PRESETS,ACTION_SUPPORT,BARE} from './catalog.mjs';
import {createHostBridge} from './host-bridge.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const dialog=$('#settings-dialog'),form=$('#settings-form'),host=createHostBridge();
let store,profiles=[],profile,yaw=0,pitch=0,tab='turn',autoTimer=null,renderToken=0,busy=false;
let direction=1,walking=false,x=25,foot=38,footPadding=12,lastFrame=0,lastPaint=0,phase=0,lifeDrag=false;
let world=createWorld(42),autonomy=false,worldPending=[],lifeGait={stride:20,stance:.6};
let action='idle',animationPlaying=false,animationTime=0,animationLast=0;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const presence=new StudyPresence({onChange:id=>{
 $('#life-canvas').hidden=!id;$('#activate').textContent=id?'이 창에서 함께 있어요':'생활 무대 시작';$('#activate').disabled=!!id;
 $('#presence-status').textContent=id?`${profile?.name??'친구'} · 이 연구 창에서 활동 중`:'친구가 쉬고 있어요.';
 if(!id){autonomy=false;$('#autonomy').textContent='스스로 둘러보기';walking=false;$('#walk').textContent='자율 걷기 시작';$('#life-canvas').getContext('2d').clearRect(0,0,96,96);}else{lifePaint();}
}});
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('readnow-pixel-data-v1'):null;
function message(text,error=false){const el=$('#message');el.textContent=text;el.hidden=false;el.style.background=error?'#8f3e30':'';clearTimeout(message.timer);message.timer=setTimeout(()=>el.hidden=true,5000);}
function safe(fn){return async(...args)=>{try{await fn(...args);}catch(e){message(e.message||String(e),true);}};}
function fillOptions(el,items,suffix=''){for(const v of items){const o=document.createElement('option');o.value=v;o.textContent=v+suffix;el.append(o);}}
fillOptions($('#yaw'),ANGLES,'°');fillOptions($('#pitch'),ANGLES,'°');fillOptions(form.elements.heads,HEADS,'등신');
function settings(){return validateSettings(profile.settings);}
function paint(canvas,s=settings(),options={},scale=1){const result=renderPixels(s,options);paintCanvas(canvas,result,scale);return result;}
function readForm(){const s={};for(const key of ['sex','candidate','palette',...Object.keys(APPEARANCE)])s[key]=form.elements[key].value;for(const key of ['heads','resolution','scale','speed'])s[key]=Number(form.elements[key].value);for(const key of ['motion','grid'])s[key]=form.elements[key].checked;return {name:validName(form.elements.name.value),settings:validateSettings(s)};}
function previewForm(){try{const draft=readForm();$('#settings-error').textContent='';paint($('#settings-canvas'),draft.settings,{yaw,pitch},2);}catch(e){$('#settings-error').textContent=e.message;}}
function fillForm(value){form.elements.name.value=value.name;for(const [key,v]of Object.entries(validateSettings(value.settings))){const el=form.elements[key];if(el.type==='checkbox')el.checked=v;else el.value=v;}}
function openSettings(){fillForm(profile);$('#settings-error').textContent='';$('#latest').hidden=true;$('#draft-restore').hidden=!sessionStorage.getItem('readnow-pixel-draft-'+profile.id);dialog.showModal();previewForm();form.elements.name.focus();}
function stopAuto(){clearInterval(autoTimer);autoTimer=null;$('#auto').textContent='자동 회전';}
function selectOptions(){const selected=profile?.id;$('#profile').replaceChildren();for(const p of profiles){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('#profile').append(o);}$('#profile').value=selected;}
async function loadProfile(id){if(busy){$('#profile').value=profile.id;throw new Error('저장을 마친 뒤 친구를 바꿔 주세요.');}worldPending=[];presence.release();stopAuto();profile=await store.get(id);if(!profile)throw new Error('친구의 저장본을 찾지 못했습니다.');sessionStorage.setItem('readnow-pixel-selected',id);selectOptions();refresh();}
async function commit(next,description){
 if(busy)throw new Error('앞선 저장을 마치는 중입니다. 잠시 후 다시 시도해 주세요.');busy=true;$('#saved').textContent='저장 중…';
 try{profile=await store.commit(next,profile.revision,description);profiles=await store.profiles();selectOptions();$('#saved').textContent=`저장됨 · ${new Date(profile.updatedAt).toLocaleTimeString('ko-KR')} · 기록 ${profile.revision}`;channel?.postMessage({id:profile.id});refresh();return profile;}
 catch(e){$('#saved').textContent='저장하지 못함 · 입력 내용은 현재 화면에 남아 있습니다';throw e;}finally{busy=false;}
}
function refresh(){
 if(!ACTION_SUPPORT[settings().species].includes(action)){action='idle';animationTime=0;}
 $('#character-title').textContent=`${profile.name} · ${settings().species==='human'?settings().heads+'등신':SPECIES[settings().species]}`;
 $('#orientation').textContent=`수평 ${yaw}° · 수직 ${pitch}°`;$('#yaw').value=yaw;$('#pitch').value=pitch;
 $('#turn-stage').classList.toggle('grid',settings().grid);$('#experience').textContent=experienceText(profile);
 if(!settings().motion){autonomy=false;$('#autonomy').textContent='스스로 둘러보기';animationPlaying=false;$('#play').textContent='동작 재생';stopAuto();walking=false;$('#walk').textContent='자율 걷기 시작';}
 if(tab==='turn'){paint($('#main-canvas'),settings(),{yaw,pitch},settings().scale);renderCandidates();}
 if(tab==='life'){drawWorld($('#world-canvas'),world,groundHeight);}
 if(tab==='catalog')renderCatalog();if(tab==='animation')renderAnimation();
 if(tab==='bodies')renderBodies();if(tab==='angles')renderAngles();if(tab==='journal')renderJournal().catch(e=>message(e.message,true));if(presence.activeId)lifePaint();
}
function setAngles(y,p){yaw=normalizeAngle(y);pitch=normalizeAngle(p);refresh();}
function changeTab(next){animationPlaying=false;$('#play').textContent='동작 재생';tab=next;renderToken++;stopAuto();$$('.tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));$$('.panel').forEach(p=>p.hidden=p.id!==tab);refresh();}
function renderCandidates(){const grid=$('#candidate-grid');grid.replaceChildren();for(const [id,title]of Object.entries(CANDIDATES)){
 const b=document.createElement('button');b.className='candidate';b.setAttribute('aria-label',title+' 채택');b.setAttribute('aria-pressed',String(settings().candidate===id));const c=document.createElement('canvas'),label=document.createElement('small');label.textContent=title;b.append(c,label);grid.append(b);paint(c,{...settings(),candidate:id,resolution:64},{yaw,pitch},1);
 b.onclick=safe(()=>commit({...profile,settings:{...settings(),candidate:id}},`구조 시안 ${id} 선택 · 수평 ${yaw}° / 수직 ${pitch}°`));
}}
async function renderBodies(){const token=++renderToken,grid=$('#body-grid');grid.replaceChildren();for(const sample of baseSamples()){
 if(token!==renderToken)return;const b=document.createElement('button');b.className='body-card';b.setAttribute('aria-label',`${sample.sex==='male'?'남성':'여성'} ${sample.heads}등신 보기`);const c=document.createElement('canvas'),label=document.createElement('span');label.textContent=`${sample.sex==='male'?'남성':'여성'} · ${sample.heads}등신`;b.append(c,label);grid.append(b);paint(c,{...settings(),...BARE,...sample,resolution:96},{yaw:0,pitch:0},2);
 b.onclick=safe(async()=>{await commit({...profile,settings:{...settings(),...BARE,...sample}},`${label.textContent} 기본형 선택`);yaw=0;pitch=0;changeTab('turn');});await new Promise(requestAnimationFrame);
}}
async function renderAngles(){const token=++renderToken,grid=$('#angle-grid');grid.replaceChildren();const cell=text=>{const d=document.createElement('div');d.className='angle-label';d.textContent=text;grid.append(d);};cell('↕ / ↔');ANGLES.forEach(a=>cell(a+'°'));let done=0;
 for(const p of ANGLES){cell(p+'°');for(const y of ANGLES){if(token!==renderToken)return;const b=document.createElement('button'),c=document.createElement('canvas');b.setAttribute('aria-label',`수평 ${y}도 수직 ${p}도 보기`);b.append(c);grid.append(b);paint(c,{...settings(),resolution:64},{yaw:y,pitch:p});b.onclick=()=>{yaw=y;pitch=p;changeTab('turn');};$('#angle-progress').textContent=`${++done} / 64개 상태 생성`;await new Promise(requestAnimationFrame);}}
}
async function renderJournal(){const list=$('#journal-list');list.replaceChildren();const entries=await store.journal();if(!entries.length){list.textContent='아직 기록이 없습니다.';return;}for(const entry of entries.slice(-50).reverse()){const li=document.createElement('li'),time=document.createElement('time'),text=document.createElement('span');time.dateTime=new Date(entry.at).toISOString();time.textContent=new Date(entry.at).toLocaleString('ko-KR');text.textContent=`${entry.name} · ${entry.description}`;li.append(time,text);list.append(li);}}
function lifePaint(){if(!presence.activeId||!profile)return;const s={...settings(),resolution:64};const result=paint($('#life-canvas'),s,{yaw:(walking||autonomy)?(direction>0?90:270):0,pitch:0,phase,action:autonomy?world.action:walking&&s.motion?'walk':'idle'},3);footPadding=(result.height-1-result.groundRow)*3;lifeGait=result.gait?{stride:result.gait.stride*3,stance:result.gait.stance}:lifeGait;}
function loop(now){
 const dt=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;
 if(tab==='animation'&&animationPlaying&&settings().motion&&!reduceMotion.matches){animationTime+=dt*4;if(now-animationLast>125){paintAnimation();animationLast=now;}}

 if(presence.activeId&&tab==='life'){
  const stage=$('#life-stage'),width=stage.clientWidth,spriteW=192,min=-40,max=Math.max(min,width-spriteW+40);
  if(autonomy&&!lifeDrag&&settings().motion&&!reduceMotion.matches){const priorX=x,priorAction=world.action;const event=stepWorld(world,dt,{speed:settings().speed,travelRate:32/width,standOff:Math.min(.10,24/width),practice:profile.experience.practice,exploration:profile.experience.exploration,supported:ACTION_SUPPORT[settings().species]});x=world.x*width-96;direction=world.direction;if(priorAction!==world.action)phase=0;else if(world.action==='walk'||world.action==='run')phase=phaseFromDistance(phase,x-priorX,lifeGait.stride,lifeGait.stance);else phase=world.action==='kick'?Math.min(Math.PI*2,phase+dt*4):phase+dt*4;if(event){worldPending.push({...event,profileId:profile.id});const li=document.createElement('li');li.textContent=event.description;$('#world-events').prepend(li);while($('#world-events').children.length>12)$('#world-events').lastChild.remove();}$('#world-status').textContent='재현번호 '+world.seed+' · '+(world.target?.label||'주변')+' · '+ACTIONS[world.action];}
  if(!autonomy&&settings().motion&&!reduceMotion.matches)stepProps(world,dt);
  if(!autonomy&&walking&&!lifeDrag&&settings().motion&&!reduceMotion.matches){const priorX=x;x+=direction*dt*32*settings().speed;if(x>=max){x=max;direction=-1;}else if(x<=min){x=min;direction=1;}phase=phaseFromDistance(phase,x-priorX,lifeGait.stride,lifeGait.stance);}
  x=walkPosition(x,0,min,max);const center=x+spriteW/2;
  foot=groundHeight(center,width);
  const c=$('#life-canvas');c.style.left=x+'px';c.style.bottom=(foot-footPadding)+'px';
  if(now-lastPaint>100){lifePaint();drawWorld($('#world-canvas'),world,groundHeight);lastPaint=now;}
 }
 if(worldPending.length&&!busy){const event=worldPending.shift();if(event.profileId===profile.id)commit({...profile,worldMemory:{...world.memory}},'공간 '+world.seed+' · '+event.description).catch(e=>{autonomy=false;$('#autonomy').textContent='스스로 둘러보기';message(e.message,true);});}
 requestAnimationFrame(loop);
}
$('#settings-open').onclick=openSettings;$('#settings-close').onclick=()=>dialog.close();$('#settings-cancel').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
form.addEventListener('input',previewForm);form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;try{const draft=readForm();await commit({...profile,...draft},`설정 저장 · ${draft.settings.heads}등신 · ${draft.settings.candidate} · ${draft.settings.resolution}px`);dialog.close();message('설정을 저장했습니다.');}catch(err){$('#settings-error').textContent=err.message;$('#latest').hidden=err.name!=='ConflictError';}finally{button.disabled=false;}});
$('#latest').onclick=async()=>{try{sessionStorage.setItem('readnow-pixel-draft-'+profile.id,JSON.stringify(readForm()));profile=await store.get(profile.id);profiles=await store.profiles();selectOptions();dialog.close();openSettings();$('#settings-error').textContent='앞선 입력을 이 탭에 보관하고 최신 저장본을 열었습니다. 필요하면 앞선 입력을 되가져오세요.';}catch(e){$('#settings-error').textContent=e.message;}};
$('#draft-restore').onclick=()=>{try{const saved=JSON.parse(sessionStorage.getItem('readnow-pixel-draft-'+profile.id));validName(saved.name);validateSettings(saved.settings);fillForm(saved);previewForm();$('#settings-error').textContent='앞선 입력을 다시 표시했습니다. 최신 저장본에 적용하려면 설정 저장을 누르세요.';}catch(e){$('#settings-error').textContent=e.message;}};
$('#previous').onclick=async()=>{try{const previous=await store.previous(profile);if(!previous){$('#settings-error').textContent='이전 저장본이 없습니다.';return;}await commit({...profile,name:previous.name,settings:previous.settings},'이전 설정 복원 · 경험과 이후 기록 보존');dialog.close();message('이전 저장본을 복원했습니다.');}catch(e){$('#settings-error').textContent=e.message;}};
$('#profile').onchange=safe(e=>loadProfile(e.target.value));
$('#add').onclick=safe(async()=>{if(busy)throw new Error('저장을 마친 뒤 친구를 추가해 주세요.');const p=createProfile(crypto.randomUUID(),`새 친구 ${profiles.length+1}`,'female');await store.commit(p,null,'연구 친구 생성');profiles=await store.profiles();await loadProfile(p.id);openSettings();});
$$('[data-tab]').forEach(b=>b.onclick=()=>changeTab(b.dataset.tab));
$('#yaw').onchange=e=>setAngles(Number(e.target.value),pitch);$('#pitch').onchange=e=>setAngles(yaw,Number(e.target.value));
$('#yaw-minus').onclick=()=>setAngles(yaw-45,pitch);$('#yaw-plus').onclick=()=>setAngles(yaw+45,pitch);$('#pitch-minus').onclick=()=>setAngles(yaw,pitch-45);$('#pitch-plus').onclick=()=>setAngles(yaw,pitch+45);$('#front').onclick=()=>setAngles(0,0);
$('#auto').onclick=()=>{if(autoTimer)return stopAuto();if(!settings().motion||reduceMotion.matches)return message('움직임 줄이기가 적용되어 있습니다. 각도 단추로 확인해 주세요.');autoTimer=setInterval(()=>setAngles(yaw+45,pitch),650);$('#auto').textContent='회전 멈추기';};
$('#main-canvas').onkeydown=e=>{const keys={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,45],ArrowDown:[0,-45]};if(keys[e.key]){e.preventDefault();setAngles(yaw+keys[e.key][0],pitch+keys[e.key][1]);}};
let drag=null;$('#main-canvas').onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};e.currentTarget.setPointerCapture(e.pointerId);stopAuto();};$('#main-canvas').onpointermove=e=>{if(!drag)return;const y=normalizeAngle(drag.yaw+Math.round((e.clientX-drag.x)/35)*45),p=normalizeAngle(drag.pitch-Math.round((e.clientY-drag.y)/35)*45);if(y!==yaw||p!==pitch)setAngles(y,p);};$('#main-canvas').onpointerup=()=>drag=null;$('#main-canvas').onpointercancel=()=>drag=null;
$('#decision-save').onclick=safe(async()=>{const note=$('#decision-note').value.trim();if(!note)return message('비교한 내용을 먼저 적어 주세요.');if(note.length>2000)throw new Error('비교 메모는 2,000자 안으로 적어 주세요.');await commit(profile,`시안 ${settings().candidate} · ${yaw}°/${pitch}° · ${note}`);$('#decision-note').value='';message('비교 메모를 남겼습니다.');});
$('#activate').onclick=safe(async()=>{await presence.activate(profile.id);});$('#deactivate').onclick=()=>presence.release();
$('#walk').onclick=()=>{autonomy=false;$('#autonomy').textContent='스스로 둘러보기';if(!presence.activeId)return message('먼저 생활 무대를 시작해 주세요.');if(!settings().motion||reduceMotion.matches)return message('움직임 줄이기가 적용되어 있습니다.');walking=!walking;$('#walk').textContent=walking?'자율 걷기 멈추기':'자율 걷기 시작';};
$$('[data-experience]').forEach(b=>b.onclick=safe(async()=>{if(!presence.activeId)return message('먼저 생활 무대를 시작해 주세요.');const kind=b.dataset.experience;await commit(recordExperience(profile,kind,Date.now(),crypto.randomUUID()),b.textContent+' · 경험 기록');message(kind==='care'?'다정하게 함께한 순간을 기억했어요.':kind==='exploration'?'함께 둘러본 순간을 기록했어요.':'걷기 연습 경험을 기록했어요.');}));
$('#life-stage').onpointerdown=e=>{if(!presence.activeId)return;autonomy=false;$('#autonomy').textContent='스스로 둘러보기';lifeDrag=true;e.currentTarget.setPointerCapture(e.pointerId);x=e.clientX-e.currentTarget.getBoundingClientRect().left-96;};$('#life-stage').onpointermove=e=>{if(lifeDrag)x=e.clientX-e.currentTarget.getBoundingClientRect().left-96;};$('#life-stage').onpointerup=()=>lifeDrag=false;$('#life-stage').onpointercancel=()=>lifeDrag=false;
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('#png').onclick=()=>$('#main-canvas').toBlob(blob=>{if(blob)download(blob,`pixel-${settings().sex}-${settings().heads}-${yaw}-${pitch}.png`);});
$('#export').onclick=safe(async()=>{download(new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),profiles:await store.profiles(),journal:await store.journal()},null,2)],{type:'application/json'}),'책방-친구-연구-기록.json');message('전체 연구 기록을 파일로 내보냈습니다.');});
if(channel)channel.onmessage=async e=>{try{if(e.data?.id!==profile?.id||busy)return;const latest=await store.get(profile.id);if(latest.revision===profile.revision)return;if(dialog.open){message('다른 창에서 변경했습니다. 이 창의 입력은 보존됩니다. 저장 전에 최신 값을 확인해 주세요.',true);return;}profile=latest;profiles=await store.profiles();selectOptions();refresh();$('#saved').textContent='다른 창의 변경을 반영했습니다.';}catch(e){message(e.message,true);}};
addEventListener('pagehide',()=>presence.release());
reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches){autonomy=false;animationPlaying=false;$('#autonomy').textContent='스스로 둘러보기';$('#play').textContent='동작 재생';stopAuto();walking=false;$('#walk').textContent='자율 걷기 시작';}});
async function start(){
 store=await openStore();profiles=await store.profiles();
 if(!profiles.length){for(const [id,name,sex]of [['study-male','기본형 하나','male'],['study-female','기본형 둘','female']]){try{await store.commit(createProfile(id,name,sex),null,'새 기본형 연구 시작');}catch(e){if(e.name!=='ConflictError')throw e;}}profiles=await store.profiles();}
 const id=sessionStorage.getItem('readnow-pixel-selected');await loadProfile(profiles.some(p=>p.id===id)?id:profiles[0].id);$('#saved').textContent=`브라우저에 보관 중 · 연구 친구 ${profiles.length}명`;
 requestAnimationFrame(loop);
 if(host.available)message('프로그램 통로를 감지했습니다. 이 화면은 연구 미리보기로 실행됩니다.');
}
start().catch(e=>{$('#saved').textContent='연구실을 시작하지 못했습니다';message(e.message,true);$$('button,select').forEach(b=>b.disabled=true);});

async function renderCatalog(){const token=++renderToken,grid=$('#preset-grid');grid.replaceChildren();for(const preset of PRESETS){if(token!==renderToken)return;const button=document.createElement('button'),canvas=document.createElement('canvas'),title=document.createElement('strong'),note=document.createElement('small');button.className='preset-card';button.setAttribute('aria-label',preset.name+' 적용');title.textContent=preset.name;note.textContent=preset.note;button.append(canvas,title,note);grid.append(button);paint(canvas,{...settings(),...preset.settings,resolution:96},{yaw:45,pitch:0},2);button.onclick=safe(async()=>{await commit({...profile,settings:{...settings(),...preset.settings}},'형태·의상 시안: '+preset.name);yaw=45;pitch=0;changeTab('turn');});await new Promise(requestAnimationFrame);}}
function paintAnimation(){paint($('#animation-canvas'),settings(),{yaw,pitch,phase:animationTime,action},Math.max(1,Math.min(settings().scale,4,Math.floor($('.animation-stage').clientHeight/settings().resolution),Math.floor($('.animation-stage').clientWidth/settings().resolution))));$('#frame-status').textContent=ACTIONS[action]+' · '+Math.floor(((animationTime/(Math.PI*2))%1+1)%1*8+1)+' / 8 핵심 구간';}
async function renderAnimation(){const token=++renderToken;$('#action').replaceChildren();for(const id of ACTION_SUPPORT[settings().species]){const option=document.createElement('option');option.value=id;option.textContent=ACTIONS[id];$('#action').append(option);}$('#action').value=action;paintAnimation();const grid=$('#frame-grid');grid.replaceChildren();for(let i=0;i<8;i++){if(token!==renderToken)return;const b=document.createElement('button'),c=document.createElement('canvas'),label=document.createElement('small');b.className='frame-card';b.setAttribute('aria-label',ACTIONS[action]+' '+(i+1)+'번 프레임');label.textContent=String(i+1);b.append(c,label);grid.append(b);paint(c,{...settings(),resolution:64},{yaw,pitch,phase:i*Math.PI/4,action},2);b.onclick=()=>{animationPlaying=false;$('#play').textContent='동작 재생';animationTime=i*Math.PI/4;paintAnimation();};await new Promise(requestAnimationFrame);}}
$('#action').onchange=e=>{action=e.target.value;animationTime=0;renderAnimation();};
$('#play').onclick=()=>{if(!settings().motion||reduceMotion.matches)return message('움직임 줄이기가 적용되어 있습니다. 프레임 단추로 확인해 주세요.');animationPlaying=!animationPlaying;$('#play').textContent=animationPlaying?'재생 멈추기':'동작 재생';};
$('#sheet').onclick=safe(async()=>{const size=settings().resolution,c=document.createElement('canvas');c.width=size*8;c.height=size;const ctx=c.getContext('2d');for(let i=0;i<8;i++){const r=renderPixels(settings(),{yaw,pitch,phase:i*Math.PI/4,action});ctx.putImageData(new ImageData(r.data,size,size),i*size,0);}c.toBlob(blob=>{if(blob)download(blob,'friend-'+settings().species+'-'+action+'-8frames.png');});});

$('#world-change').onclick=()=>{world=createWorld((world.seed+7919)>>>0,profile.worldMemory||{});$('#world-events').replaceChildren();drawWorld($('#world-canvas'),world,groundHeight);$('#world-status').textContent='재현번호 '+world.seed+' · 새 시험 공간';};
$('#autonomy').onclick=()=>{if(!presence.activeId)return message('먼저 생활 무대를 시작해 주세요.');if(!settings().motion||reduceMotion.matches)return message('움직임 줄이기가 적용되어 있습니다.');autonomy=!autonomy;walking=false;$('#walk').textContent='자율 걷기 시작';world.memory={...(profile.worldMemory||{})};world.x=Math.max(.04,Math.min(.96,(x+96)/$('#life-stage').clientWidth));$('#autonomy').textContent=autonomy?'둘러보기 멈추기':'스스로 둘러보기';};

$$('[data-object]').forEach(button=>button.onclick=()=>{if(!presence.activeId)return message('먼저 생활 무대를 시작해 주세요.');if(!settings().motion||reduceMotion.matches)return message('움직임 줄이기가 적용되어 있습니다.');world.x=Math.max(.04,Math.min(.96,(x+96)/$('#life-stage').clientWidth));world.memory={...(profile.worldMemory||{})};approachObject(world,button.dataset.object);autonomy=true;walking=false;phase=0;$('#walk').textContent='자율 걷기 시작';$('#autonomy').textContent='둘러보기 멈추기';});

addEventListener('resize',()=>{if(!profile)return;if(tab==='life'){drawWorld($('#world-canvas'),world,groundHeight);lifePaint();}if(tab==='animation')paintAnimation();});
