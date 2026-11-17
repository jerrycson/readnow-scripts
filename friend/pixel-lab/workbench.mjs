import {createRenderQueue} from './workbench-render.mjs?v=52';
import {buttons,mark,editor} from './workbench-controls.mjs?v=52';
import {faceOptions50} from './face-options50.mjs';
import {modelNames,isWorkbenchSubject,isChestSubject} from './workbench-subjects50.mjs';
import {chestOptions50} from './chest-options50.mjs';
import {libraryChecks50} from './face-library-cheek50.mjs';
import {chestFits51} from './chest-fits51.mjs';
const el=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const wrap=n=>((n+180)%360+360)%360-180;
const directions=[['정면',0,0],['왼 45°',-45,0],['오른 45°',45,0],['왼 측면',-90,0],['오른 측면',90,0],['뒤 45°',135,0],['뒷면',-180,0],['위',0,90],['아래',0,-90]];
const sizes=[48,96,512,1024,2048];
const framings=[['model','모델 기본'],['face','얼굴'],['upper','상체'],['body','전신']];
const pref='bookfriend-workbench-layout-1';
let prefs={};
try{prefs=JSON.parse(localStorage.getItem(pref))||{};}catch{}
let count=[1,2,4].includes(prefs.count)?prefs.count:4;
let x=clamp(Number(prefs.x)||50,15,85),y=clamp(Number(prefs.y)||50,15,85);
function save(){try{localStorage.setItem(pref,JSON.stringify({count,x,y}));}catch{}}
const params=new URL(location.href).searchParams;
const requested=params.get('case'), edition=['50','51'].includes(params.get('round'))?Number(params.get('round')):52;
let id=isWorkbenchSubject(requested)?requested:'F02',active=0,solo=null,revision=0,tab='view',visible=true;
const cameras=[0,-45,-90,135].map(yaw=>({yaw,pitch:0,zoom:1,size:1024,framing:'model'}));
const items=[],versions=[0,0,0,0],ready=[-1,-1,-1,-1],pins=[null,null,null,null];
const visiblePanes=()=>solo===null?Array.from({length:count},(_,i)=>i):[solo];
const edits=editor(()=>{revision++;request(visiblePanes().filter(i=>!pins[i]));},edition);
const queue=createRenderQueue({requestFor(index){
  if(!visiblePanes().includes(index))return null;
  const scene=pins[index]||{id,edit:edits.current(),revision};
  return {...scene,view:{...cameras[index]},version:versions[index]};
},receive(job,data){
  const index=job.index,canvas=items[index].canvas;
  const current=pins[index]||{id,revision};
  if(job.id!==current.id||job.revision!==current.revision||job.view.size!==cameras[index].size||job.version<=ready[index])return;
  canvas.width=canvas.height=data.size;
  canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.buffer),data.size,data.size),0,0);
  canvas.dataset.pixel=String(data.size<=96);canvas.dataset.revision=job.revision;canvas.dataset.case=job.id;
  canvas.dataset.yaw=job.view.yaw;canvas.dataset.pitch=job.view.pitch;canvas.dataset.framing=job.view.framing;
  canvas.dataset.version=job.edit?.version||'source';
  if(index===active)showModelStatus();
  ready[index]=job.version;
  if(job.id===id){
    edits.zones(data.zones);
    if(isChestSubject(id)){
      const rebound=el('markerVersion').querySelector('[data-key="rebound"]');
      rebound.disabled=!data.markerLevel;rebound.textContent=data.markerLevel?'피부에 다시 밀착':'재밀착 보류';
    }
    if(data.source?.startsWith('https://')&&!el('modelNotes').querySelector('a')){
      const source=document.createElement('a');source.href=data.source;source.target='_blank';source.rel='noopener';source.textContent='공식 원화 열기 ↗';el('modelNotes').append(' ',source);
    }
  }
  status();
},fail(job,error){
  if(job.id===id&&job.version===versions[job.index]){el('progress').textContent='그림을 열 수 없습니다 · '+error;el('stage').dataset.ready='error';}
}});
function status(){
  const shown=visiblePanes(),n=shown.filter(i=>ready[i]===versions[i]).length;
  el('stage').dataset.ready=String(n===shown.length);
  const fixed=shown.filter(i=>pins[i]).length;
  el('progress').textContent=n===shown.length?(fixed?'기준 고정 '+fixed+'창':'같은 형상')+' · '+n+'개 시점 표시':'시점 계산 중 · '+n+' / '+shown.length;
}
function request(indices){
  for(const i of indices)versions[i]++;
  status();queue.request(indices);
}
function currentViewName(v){
  const dir=directions.find(([,yaw,pitch])=>Math.abs(wrap(v.yaw-yaw))<.1&&Math.abs(wrap(v.pitch-pitch))<.1);
  return dir?dir[0]:'자유 시점';
}
function showModelStatus(){
  const canvas=items[active]?.canvas;
  if(!canvas?.dataset.case)return;
  const key=canvas.dataset.case;
  const label=modelNames[key]||((key.startsWith('female')?'여성':'남성')+' '+key.split('-')[1]+'등신');
  const kind=canvas.dataset.version;
  const trial={height:'턱 높이 시험',candidate:'50차 시험',smooth:'깊이선 시험',half:'깊이선 절반',ablation:'깊이항 제외',C:'입술 C · 보류',D:'입술 D · 보류',E:'입술 E · 보류'};
  const current51={orbit51:'51차 안와',contact51:'51차 눈꺼풀 접촉 시험',lower51:'51차 하부 곡선'};
  const current52={jawNormal52:'52차 H2 턱 음영',jawBoth52:'H2 턱 형상·음영 · 보류',lowerContact52:'52차 안·바깥 접선',floor52:'하부 낮추기 · 보류'};
  const version=current52[kind]||current51[kind]||trial[kind];
  el('subjectLabel').textContent=label+(version?' · '+version:isWorkbenchSubject(key)&&!key.includes('-')?' · 보존 원형':'');
}
function refreshViews(){
  for(let i=0;i<items.length;i++){
    const {root,label,readout,canvas,soloButton}=items[i],v=cameras[i];
    root.hidden=!visiblePanes().includes(i);root.dataset.active=String(i===active);
    label.textContent=(i+1)+' · '+currentViewName(v)+(pins[i]?' · '+(modelNames[pins[i].id]||'전신')+' 고정':'');label.setAttribute('aria-pressed',String(i===active));
    readout.textContent=(v.framing==='model'?'':framings.find(([key])=>key===v.framing)[1]+' · ')+v.size+'px';canvas.ariaLabel=label.textContent+' 회전';
    canvas.title=Number(v.yaw.toFixed(1))+'° / '+Number(v.pitch.toFixed(1))+'° · '+Math.round(v.zoom*100)+'%';
    soloButton.ariaLabel=solo===i?'분할로 돌아가기':'이 창 크게 보기';soloButton.title=soloButton.ariaLabel;
  }
  const v=cameras[active];mark(el('directions'),currentViewName(v));mark(el('resolutions'),v.size);
  mark(el('framings'),v.framing);
  el('zoom').textContent=Math.round(v.zoom*100)+'%';
  el('pin').setAttribute('aria-pressed',String(!!pins[active]));
  el('pin').textContent=pins[active]?'형상 고정 풀기':'이 창의 형상 고정';
  showModelStatus();
}
function select(i){active=i;refreshViews();}
function rememberMode(next){
  if(![1,2,4].includes(next))return;
  solo=null;count=next;if(active>=count)active=0;
  applyLayout();save();
}
function focusPane(i){
  if(count===1)return;
  solo=solo===i?null:i;active=i;applyLayout();
}
function applyLayout(){
  const shown=visiblePanes();el('stage').dataset.count=shown.length;
  el('colSplit').hidden=shown.length<2;el('rowSplit').hidden=shown.length!==4;
  mark(el('layouts'),shown.length);queue.prune(shown);refreshViews();applySplit();
  const dirty=shown.filter(i=>ready[i]!==versions[i]||items[i].canvas.dataset.revision!==String(pins[i]?.revision??revision));
  status();if(dirty.length)request(dirty);
}
function applySplit(){
  const st=el('stage');st.style.setProperty('--x',x+'%');st.style.setProperty('--y',y+'%');
  for(const [tag,v] of [['colSplit',x],['rowSplit',y]]){
    el(tag).setAttribute('aria-valuenow',Math.round(v));el(tag).setAttribute('aria-valuemin','15');el(tag).setAttribute('aria-valuemax','85');
  }
}
function setZoom(i,value){
  const indices=el('linkZoom').checked?[0,1,2,3]:[i];
  for(const j of indices)cameras[j].zoom=clamp(value,.38,3.5);
  refreshViews();request(indices);
}
function orbit(i,dx,dy){
  cameras[i].yaw=wrap(cameras[i].yaw+dx);
  cameras[i].pitch=wrap(cameras[i].pitch+dy);
  refreshViews();request([i]);
}
for(let i=0;i<4;i++){
  const root=el('pane').content.firstElementChild.cloneNode(true);
  const canvas=root.querySelector('.drawing'),label=root.querySelector('.select'),soloButton=root.querySelector('.solo');
  items.push({root,canvas,label,soloButton,readout:root.querySelector('.readout')});el('panes').append(root);
  label.onclick=()=>select(i);soloButton.onclick=()=>focusPane(i);canvas.onfocus=()=>select(i);
  let drag=null;
  canvas.onpointerdown=e=>{
    if(e.button!==0||drag)return;
    select(i);canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};
  };
  canvas.onpointermove=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const factor=e.shiftKey ? .15 : .65;
    orbit(i,(e.clientX-drag.x)*factor,(e.clientY-drag.y)*factor);
    drag.x=e.clientX;drag.y=e.clientY;
  };
  canvas.onlostpointercapture=canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  canvas.ondblclick=()=>focusPane(i);
  canvas.addEventListener('wheel',e=>{e.preventDefault();select(i);setZoom(i,cameras[i].zoom*Math.exp(-clamp(e.deltaY,-200,200)*.0018));},{passive:false});
  canvas.onkeydown=e=>{
    const step=e.shiftKey?1:5,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,step],ArrowDown:[0,-step]}[e.key];
    if(delta){e.preventDefault();orbit(i,...delta);}
    if(e.key==='Enter'){e.preventDefault();focusPane(i);}
  };
}
function splitter(tag,horizontal){
  const node=el(tag);
  function set(value){if(horizontal)y=clamp(value,15,85);else x=clamp(value,15,85);applySplit();}
  function pointer(e){const r=el('stage').getBoundingClientRect();set(horizontal?100*(e.clientY-r.top)/r.height:100*(e.clientX-r.left)/r.width);}
  node.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();node.setPointerCapture(e.pointerId);node.focus();pointer(e);};
  node.onpointermove=e=>{if(node.hasPointerCapture(e.pointerId))pointer(e);};node.onlostpointercapture=save;
  node.ondblclick=()=>{set(50);save();};
  node.onkeydown=e=>{
    const sign={ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[e.key];
    if(sign||e.key==='Home'){e.preventDefault();set(sign?(horizontal?y:x)+sign*(e.shiftKey?10:1):50);save();}
  };
}
splitter('colSplit',false);splitter('rowSplit',true);
buttons(el('layouts'),[1,2,4].map(n=>[n,n+'창']),rememberMode);
buttons(el('framings'),framings,framing=>{
  cameras[active].framing=framing;
  refreshViews();request([active]);
});
buttons(el('directions'),directions.map(a=>[a[0],a[0]]),name=>{
  const [,yaw,pitch]=directions.find(d=>d[0]===name);Object.assign(cameras[active],{yaw,pitch});refreshViews();request([active]);
});
buttons(el('resolutions'),sizes.map(n=>[n,n+'px']),size=>{cameras[active].size=size;refreshViews();request([active]);});
function chooseTab(name){
  tab=name;
  for(const k of ['view','shape','pose','model'])el(k+'Tab').hidden=k!==name;
  mark(el('tabs'),name);
}
buttons(el('tabs'),[['view','보기'],['shape','부위'],['pose','관절'],['model','모델']],chooseTab);
const categories=[...new Set(chestOptions50.map(o=>o.group))];
let group=chestOptions50[0].group;
function showTypes(){
  const q=el('findChest').value.trim().toLowerCase();
  const rows=chestOptions50.filter(o=>q?[o.id,o.label,o.coverage,o.group].join(' ').toLowerCase().includes(q):o.group===group);
  buttons(el('chestList'),rows.map(o=>[o.id,o.label]),selectModel);
  for(const b of el('chestList').querySelectorAll('button')){
    const cell=chestOptions50.findIndex(o=>o.id===b.dataset.key);
    b.style.setProperty('--column',String(cell%10/9*100)+'%');
    b.style.setProperty('--row',String(Math.floor(cell/10)/8*100)+'%');
  }
  if(!rows.length)el('chestList').textContent='일치하는 유형이 없습니다.';
  mark(el('chestGroups'),q?'':group);mark(el('chestList'),id);
}
function showCategory(choice){
  mark(el('modelGroups'),choice);
  for(const [k,node] of [['face','models'],['chest','chestLibrary'],['body','families']])el(node).hidden=k!==choice;
  if(choice==='chest')showTypes();
}
buttons(el('modelGroups'),[['face','얼굴 8'],['chest','가슴 '+chestOptions50.length],['body','전신 14']],showCategory);
buttons(el('chestGroups'),categories.map(g=>[g,g]),key=>{group=key;el('findChest').value='';showTypes();});
el('findChest').oninput=showTypes;
function selectModel(key){
  id=key;revision++;const editable=Object.hasOwn(modelNames,id);
  edits.switchModel(id,editable,id===requested?params.get('trial'):undefined);
  for(const b of el('tabs').querySelectorAll('button'))if(['shape','pose'].includes(b.dataset.key))b.disabled=!editable;
  if(!editable&&['shape','pose'].includes(tab))chooseTab('model');
  mark(el('models'),key);mark(el('families'),key);
  const title=modelNames[id]||((id.startsWith('female')?'여성':'남성')+' '+id.split('-')[1]+'등신');
  el('subjectLabel').textContent=title;
  el('modelNotes').textContent=editable?'49차 연구 원형 · 부위와 관절을 교정할 수 있습니다.':'보존 전신 시안 · 카메라를 돌려 등신별 실루엣을 비교합니다.';
  const face=faceOptions50.find(item=>item.id===id);
  if(id==='F02')el('modelNotes').textContent='50차 볼·턱선 교정 시험. 부위 → 비교 원형에서 49차로 돌아갈 수 있습니다. 정면과 측면, 별도 원화에서 대조 중입니다.';
  if(face&&!face.preserved)el('modelNotes').textContent='50차 · '+libraryChecks50[id].state+' · '+libraryChecks50[id].why+'. '+face.limits;
  if(id==='M04')el('modelNotes').textContent='턱 높이 시험에서 정면과 양 측면의 피부선 오차가 줄었습니다. 눈을 감은 사선은 같은 구도인지 확인하지 못했습니다. 부위 탭에서 보존 원형과 볼 폭 시험도 비교할 수 있습니다.';
  if(id==='M03'||id==='F05')el('modelNotes').textContent='50차 깊이선 시험 · 코와 입 사이 피부의 톱니를 줄였습니다. '+(id==='M03'?'측면 코~턱 오차는 3.142 → 3.337px로 커졌습니다.':'측면 코~턱 오차가 1.614 → 1.472px로 줄었습니다.')+' 부위 탭에서 보존 원형과 비교하세요.';
  const chest=chestOptions50.find(item=>item.id===id);
  if(chest){
    group=chest.group;el('modelNotes').textContent=chest.group+' · '+chest.coverage;
  }
  if(edition>=51&&face)el('modelNotes').append(' 51차 안와 후보와 눈 주위 원형을 부위 탭에서 바꿔 볼 수 있습니다.'+(id==='M01'?' 힘멜은 측면 눈꺼풀 오차가 커져 보류했습니다.':''));
  if(edition>=51&&chest)el('modelNotes').append(chestFits51[id]?' 51차 하부 곡선과 50차 교정 시험을 직접 비교할 수 있습니다.':' 51차 검토에서 50차 형상을 유지했습니다.');
  if(edition>=52&&key==='F02')el('modelNotes').append(' 52차 턱 시험은 50차 볼 보정(H2) 위에 적용했습니다. 51차 안와와 분리하여 비교하세요.');
  if(edition>=52&&key==='W')el('modelNotes').append(' 52차 안·바깥 접선은 정면과 측면 외곽에서 개선됐지만 측면 내부선 오차가 남아 수동 시험으로 두었습니다.');
  if(edition>=52&&!editable)el('modelNotes').textContent='이 전신에서 얼굴·헤어·근육·지방을 바꾸면 같은 몸, 같은 카메라에서 비교합니다. 기본 얼굴은 이목구비를 각각 조절할 수 있습니다.';
  showCategory(face?'face':chest?'chest':'body');
  if(visiblePanes().every(i=>pins[i]))pins[active]=null;
  for(const [i,{canvas}] of items.entries())if(!pins[i])canvas.width=canvas.height=1;
  const locationState=new URL(location.href);locationState.searchParams.set('case',id);
  if(id!==requested)locationState.searchParams.delete('trial');history.replaceState(null,'',locationState);
  if(parent!==self)parent.postMessage({type:'bookfriend:workbench-case',id},location.origin);
  refreshViews();request(visiblePanes().filter(i=>!pins[i]));
}
for(const [sex,label] of [['female','여성 얼굴'],['male','남성 얼굴']]){
  const group=document.createElement('div'),title=document.createElement('h3'),row=document.createElement('div');
  row.className='choices';title.textContent=label;group.append(title,row);el('models').append(group);
  buttons(row,faceOptions50.filter(o=>o.sex===sex).map(o=>[o.id,o.label+(o.preserved?' · 기본':'')]),selectModel);
  for(const b of row.querySelectorAll('button')){
    const index=faceOptions50.findIndex(option=>option.id===b.dataset.key);
    b.className='faceChoice';b.style.setProperty('--portrait',String(index/7*100)+'%');
  }
}
for(const [sex,label] of [['female','여'],['male','남']]){
  const row=document.createElement('div');el('families').append(row);
  buttons(row,Array.from({length:7},(_,i)=>[sex+'-'+(i+2),label+(i+2)]),selectModel);
}
el('minus').onclick=()=>setZoom(active,cameras[active].zoom/1.12);
el('plus').onclick=()=>setZoom(active,cameras[active].zoom*1.12);el('fit').onclick=()=>setZoom(active,1);
el('pin').onclick=()=>{
  pins[active]=pins[active]?null:{id,edit:structuredClone(edits.current()),revision};
  refreshViews();request([active]);
};
el('matchCamera').onclick=()=>{
  const {yaw,pitch,zoom}=cameras[active];
  for(const v of cameras)Object.assign(v,{yaw,pitch,zoom});
  refreshViews();request(visiblePanes());
};
el('inspector').onclick=()=>{const dock=el('dock');dock.hidden=!dock.hidden;el('inspector').setAttribute('aria-pressed',String(!dock.hidden));};
el('fill').onclick=async()=>{
  if(parent!==self){parent.postMessage({type:'bookfriend:workbench-fill'},location.origin);return;}
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{el('progress').textContent='현재 브라우저 창에서 최대 크기로 보고 있습니다.';}
};
function expanded(on){el('fill').setAttribute('aria-pressed',String(on));el('fill').textContent=on?'크기 복원':'화면 채우기';}
document.addEventListener('fullscreenchange',()=>expanded(Boolean(document.fullscreenElement)));
window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==parent)return;
  if(e.data?.type==='bookfriend:workbench-expanded')expanded(e.data.expanded);
  if(e.data?.type==='bookfriend:studio-active'){visible=Boolean(e.data.active);queue.active(visible&&!document.hidden);}
});
document.addEventListener('visibilitychange',()=>queue.active(visible&&!document.hidden));
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.altKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(['1','2','4'].includes(e.key)){e.preventDefault();rememberMode(Number(e.key));}
  if(e.key==='Escape'&&solo!==null){e.preventDefault();focusPane(solo);}
});
window.addEventListener('pagehide',e=>{if(!e.persisted)queue.close();});
chooseTab('view');selectModel(id);applyLayout();
