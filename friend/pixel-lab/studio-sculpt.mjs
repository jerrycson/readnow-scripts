import {addRound47,displayedBase} from './studio-bases47.mjs';
import {prepare48} from './studio-bases48.mjs';
import {prepare49,applyPose49} from './studio-bases49.mjs';
import {neutralPerformance} from './performance49.mjs';
import {mountMotion49,motionLabel} from './studio-motion49.mjs';
import {mountStudy48} from './studio-study48.mjs';
import {mountAngle46} from './studio-angle46.mjs';
import {mountSurfaceControls} from './studio-surface-controls46.mjs';
import {mountAngleComparison} from './studio-three-views46.mjs';
import {mountMethodChoice} from './studio-method-view45.mjs';
import {subjects,axes,zero,baseLabel,presets,defaultView,buildSculptBase,sculpt,displayScene,renderSculpt,
  plateInfo,surfaceZones,screenAnchors,pivotChoices,pivotSpec} from './studio-sculpt-model.mjs';
import {SculptSession,validatePreset,performanceFormat,observationSizes} from './studio-sculpt-settings.mjs?v=45';
import {loadRig} from './rig32.mjs';
import {mountSculptLearning44} from './studio-sculpt-learn44.mjs';
import {photoControls} from './studio-photo-fit.mjs?v=44-lab';

const el=id=>document.getElementById(id), clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
const button=(text,click)=>{const n=document.createElement('button');n.textContent=text;n.onclick=click;return n;};
const options=(node,entries)=>node.replaceChildren(...entries.map(([key,name])=>new Option(name,key)));
let localPhoto;
const models=new Map(),sessions=new Map(),cache=new Map();
let learning44, surfaceControls, angleDial, compareAngles;
const sourceParams=new URL(location.href).searchParams;
const studyRound=sourceParams.get('round');
const inRound49=studyRound==='49',inRound48=studyRound==='48',hasSourceComparison=inRound49||inRound48||studyRound==='47';
let study48,motion49;
const savedCells=new Map();
let id,session,model,assets,zones=[],selected,active=true,scheduled=false,dirty=false,sourceDirty=true;
let raw,comparison,edited,valueKey,plate,plateKey,plateLeft,plateRight,plateTimer;
const status=s=>{el('status').textContent=s;};
function schedule(reference=false){
  dirty=true;sourceDirty ||= reference;
  if(active&&!scheduled){scheduled=true;requestAnimationFrame(draw);}
}
function bitmap(canvas,image){
  if(canvas.width!==image.width||canvas.height!==image.height){canvas.width=image.width;canvas.height=image.height;}
  canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(image.data),image.width,image.height),0,0);
}
function projection(){
  if(!active||!sourceDirty||!model)return;
  sourceDirty=false;
  const key=id+'/'+el('plateSelect').value;
  if(key!==plateKey){
    plateKey=key;plate=plateInfo(model,el('plateSelect').value,assets,hasSourceComparison);plateLeft=null;plateRight=null;
    const node=el('plate'),[x,y,w,h]=plate.bounds;
    node.setAttribute('viewBox','0 0 '+plate.width+' '+plate.height);
    const img=svg('image',{x,y,width:w,height:h,preserveAspectRatio:'none'});
    el('imgStatus').textContent='원본을 읽는 중입니다.';
    img.onload=()=>{if(img.isConnected)el('imgStatus').textContent='';};
    img.onerror=()=>{if(img.isConnected)el('imgStatus').textContent='이 브라우저에서 원본 그림을 읽지 못했습니다. 관측선은 확인할 수 있습니다.';};
    img.setAttribute('href',plate.image);node.replaceChildren(img);
    el('source').href=plate.page;el('credit').textContent=plate.credit+' 형상선은 중립 자세의 고정 투영입니다.';
  }
  if(plateLeft?.scene!==comparison)plateLeft={scene:comparison,lines:plate.lines(comparison)};
  if(plateRight?.scene!==edited)plateRight={scene:edited,lines:edited===comparison?plateLeft.lines:plate.lines(edited)};
  const node=el('plate');
  for(const group of node.querySelectorAll('g'))group.remove();
  for(const [key,lines,color,dash] of [['trace',plate.observed,'#00737a',''],['priorLine',plateLeft.lines,'#8054a0','3 2'],['newLine',plateRight.lines,'#d74924','']]){
    const group=svg('g',{'data-layer':key,fill:'none',stroke:color,'stroke-width':1.15,'stroke-dasharray':dash,'stroke-linejoin':'round'});
    if(plate.pointCloud&&key!=='trace'){
      group.append(svg('path',{d:lines.map(([x,y])=>'M'+x.toFixed(2)+' '+y.toFixed(2)+'h.08').join(' '),'stroke-dasharray':'','stroke-linecap':'round'}));
    }else for(const seq of lines){if(!Array.isArray(seq)||seq.length<2)continue;
      group.append(svg('polyline',{points:seq.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ')}));}
    node.append(group);
  }
  layers();
}
function layers(){
  const node=el('plate');if(node.firstElementChild)node.firstElementChild.style.display=el('photo').checked?'':'none';
  for(const g of node.querySelectorAll('g'))g.style.display=el(g.dataset.layer).checked?'':'none';
}
let initialZone=new URL(location.href).searchParams.get('zone');
function selectZone(key){
  if(learning44)schedule();
  selected=zones.find(z=>z.key===key)||zones[0];el('region').value=selected.key;
  const address=new URL(location.href);if(address.searchParams.get('zone')!==selected.key){address.searchParams.set('zone',selected.key);history.replaceState(null,'',address);}
  if(parent!==self)parent.postMessage({type:'bookfriend:sculpt-zone',case:id,zone:selected.key},location.origin);
  const labels=axes(id);
  surfaceControls?.refresh();
  el('handleHelp').textContent=selected.label+' · 가로 '+labels[selected.xAxis]+' / 위아래 '+labels[selected.yAxis];
  for(const pin of el('handles').children)pin.setAttribute('aria-pressed',String(pin.dataset.zone===selected.key));
  for(const row of el('axes').children){
    const on=[selected.xAxis,selected.yAxis].includes(row.dataset.axis);
    row.dataset.active=String(on);row.hidden=!on&&!el('allAxes').checked;
  }
}
function updateValues(){
  const p=session.current;
  for(const n of el('axes').querySelectorAll('input'))if(n!==document.activeElement||n.type!=='number')n.value=p.values[n.dataset.axis];
  el('undo').disabled=!session.past.length;el('redo').disabled=!session.future.length;el('basis').value=p.base;
  for(const n of el('sizes').children)n.setAttribute('aria-pressed',String(+n.dataset.size===p.view.size));
  el('pivot').value=p.view.pivot;
  const spec=pivotSpec(p.view.pivot);
  for(const node of [el('poseRange'),el('poseNum')]){node.min=spec.min;node.max=spec.max;node.value=p.view.angle;}
  surfaceControls?.refresh();angleDial?.sync();motion49?.refresh(id);
  el('jointLimit').textContent=spec.label+' · '+spec.min+'° ~ '+spec.max+'° · '+(p.view.pivot==='arms.raise'?'34차 팔·어깨띠 동작':'32차 피봇과 가중치')+'를 양쪽에 적용합니다.';
}
function updateShape(values){session.preview(values);updateValues();schedule(true);}
function commit(){session.commit();updateValues();schedule(true);}
function setupPins(){
  const pane=el('handles');pane.replaceChildren();
  options(el('region'),zones.map(z=>[z.key,z.label]));
  for(const z of zones){
    const pin=button(z.label,()=>selectZone(z.key));pin.className='pin';pin.dataset.zone=z.key;pin.title=z.label;pin.setAttribute('aria-label',z.label+' 표점');pane.append(pin);
    let start=null;
    pin.onpointerdown=e=>{
      if(e.button!==0)return;e.preventDefault();pin.focus();selectZone(z.key);pin.setPointerCapture(e.pointerId);
      start={x:e.clientX,y:e.clientY,values:{...session.current.values},fine:e.shiftKey};
    };
    pin.onpointermove=e=>{
      if(!start)return;
      const gain=(start.fine?.25:1)*240/pane.clientWidth;
      const v={...start.values};v[z.xAxis]=clamp(Math.round(v[z.xAxis]+(e.clientX-start.x)*gain),-100,100);
      v[z.yAxis]=clamp(Math.round(v[z.yAxis]+(start.y-e.clientY)*gain),-100,100);updateShape(v);
    };
    pin.onpointerup=pin.onpointercancel=pin.onlostpointercapture=()=>{if(start){start=null;commit();}};
    pin.onkeydown=e=>{
      const action={ArrowLeft:[z.xAxis,-1],ArrowRight:[z.xAxis,1],ArrowDown:[z.yAxis,-1],ArrowUp:[z.yAxis,1]}[e.key];if(!action)return;
      e.preventDefault();selectZone(z.key);const [axis,d]=action,v={...session.current.values};
      v[axis]=clamp(v[axis]+d*(e.shiftKey?10:1),-100,100);updateShape(v);commit();
    };
  }
  selectZone(initialZone||selected?.key);initialZone=null;pane.hidden=!el('showHandles').checked;
}
function draw(){
  scheduled=false;if(!active||!dirty||!model)return;dirty=false;
  try{
    const p=session.current,photo44=localPhoto.key(id)!=='original';
    const values44=learning44?.values(p,selected?.key,photo44)||p.values;
    const shapeKey=JSON.stringify(values44)+localPhoto.key(id);
    const leftChoice=!hasSourceComparison||el('leftBase47').value==='same' ? p.base :
      el('leftBase47').value==='history37' ? 'history37' :
      inRound49&&el('leftBase47').value==='current' ? 'round48' :
      inRound49&&el('leftBase47').value==='round47' ? 'round47' :
      inRound48&&el('leftBase47').value==='current' ? 'round47' : id==='F02'?'candidate':'prior';
    comparison=displayedBase(model,leftChoice);
    const shape=displayedBase(model,p.base);
    if(raw!==shape){
      raw=shape;zones=surfaceZones(raw,id);setupPins();valueKey=null;cache.clear();
    }
    if(valueKey!==shapeKey){edited=sculpt(localPhoto.shape(raw,id),id,values44);valueKey=shapeKey;cache.delete('edited');}
    const leftMotion=p.performance&&(p.performance.match||el('leftBase47').value==='same')?p.performance:null;
    function displayed(key,src,sourceBase,motion){
      const poseKey=p.view.pivot+':'+p.view.angle+':'+JSON.stringify(motion||null);
      let c=cache.get(key);
      if(!c||c.src!==src||c.base!==sourceBase||c.pose!==poseKey){
        const scene=applyPose49(model,sourceBase,src,p.view,motion);
        c={src,base:sourceBase,pose:poseKey,display:displayScene(model,sourceBase,scene)};cache.set(key,c);
      }
      const camera=JSON.stringify(p.view);
      if(c.camera!==camera){c.frame=renderSculpt(model,c.display,p.view);c.camera=camera;}
      return c;
    }
    const left=displayed('start',comparison,leftChoice,leftMotion);
    const same=edited===comparison&&p.base===leftChoice&&leftMotion===(p.performance||null);
    const right=same?left:displayed('edited',edited,p.base,p.performance);
    motion49?.locate(model,right,p.view);
    study48?.track(left,right);
    bitmap(el('before'),left.frame);bitmap(el('after'),right.frame);
    compareAngles.update(model,left.display,right.display,p.view,()=>active);
    localPhoto.draw(id,raw,right.frame,right.display,model,p.view);
    const guides=screenAnchors(right.frame,model,right.display,p.view,zones);
    learning44?.observe({state:p,model,shown:right.display,frame:right.frame,zone:selected,guide:guides.find(g=>g.key===selected.key),photo:photo44});
    for(const g of guides){
      const n=el('handles').querySelector('[data-zone="'+g.key+'"]');n.dataset.vertex=g.index;n.dataset.front=g.front;
      n.style.left=(g.point[0]/p.view.size*100)+'%';n.style.top=(g.point[1]/p.view.size*100)+'%';
      n.hidden=g.point.some(q=>q<0||q>=p.view.size);
    }
    el('leftTitle').textContent=baseLabel(id,leftChoice)+(p.performance?' · '+motionLabel(id,leftMotion):'');
    if(hasSourceComparison)el('rightTitle').textContent=baseLabel(id,p.base)+(p.performance?' · '+motionLabel(id,p.performance):' · 교정');el('camera').textContent='좌우 '+p.view.yaw.toFixed(1)+'° · 상하 '+p.view.pitch.toFixed(1)+'° · '+p.view.zoom.toFixed(2)+'배 · '+p.view.size+' × '+p.view.size;
    if(edited.sculptGain<.9999)el('camera').textContent+=' · 얇은 면의 접힘을 제한해 변위 '+(edited.sculptGain*100).toFixed(1)+'% 적용';
    const main=document.querySelector('main');main.dataset.case=id;main.dataset.render=String((+main.dataset.render||0)+1);main.dataset.ready='true';
    if(sourceDirty){clearTimeout(plateTimer);plateTimer=setTimeout(()=>{try{projection();}catch(e){status('원본 대조 오류 · '+e.message);console.error(e);}},90);}
  }catch(e){status('조형 화면 오류 · '+e.message);console.error(e);}
}
function view(delta){
  if(id==='W'&&session.current.performance?.pose&&session.current.performance.pose!=='neutral'&&('angle' in delta||'pivot' in delta)){
    session.apply({...session.current,performance:{...session.current.performance,pose:'neutral'}});
  }
  session.current={...session.current,view:{...session.current.view,...delta}};updateValues();schedule();
}
function sourceViews(){
  if(!hasSourceComparison)return assets.face.cases[id].views;
  return assets.face47.cases[id].views.map(item=>({...item,pose:item.registrations[0],
    role:item.newAfterFreeze?'후보 동결 뒤 첫 원화':item.used?'교정에 사용한 원화':'형상 대조 원화'}));
}
function registeredCamera() {
  const key=el('plateSelect').value;
  if(id==='W')return {yaw:assets.chest.paper[key].yaw,pitch:0};
  if(key==='side'||key==='front')return {yaw:key==='side'?-90:0,pitch:0};
  const pose=sourceViews().find(v=>v.key===key).pose;
  return {yaw:pose.yaw,pitch:pose.pitch};
}
function matchPlate() {
  const pose=registeredCamera();
  view({...pose,zoom:1});
}
function changeCase(next){
  clearTimeout(plateTimer);session?.commit();id=next;
  const freshSession=!sessions.has(id);
  if(freshSession){
    const fresh=new SculptSession(id);
    if(hasSourceComparison){fresh.current.base=inRound49?'round49':inRound48?'round48':'round47';fresh.current.view.size=48;}
    if(inRound49){
      fresh.current.format=performanceFormat;fresh.current.performance=neutralPerformance(id);
      if(id==='W'){fresh.current.performance.pose='waist';}
    }
    if(inRound48&&id==='W')Object.assign(fresh.current.view,{pivot:'arms.raise',angle:90});
    sessions.set(id,fresh);
  }
  if(!models.has(id))models.set(id,addRound47(buildSculptBase(id,assets),assets));
  session=sessions.get(id);model=models.get(id);if(inRound49)prepare49(model,assets);else if(inRound48)prepare48(model,assets);raw=null;valueKey=null;plateKey=null;cache.clear();
  el('subject').value=id;options(el('basis'),(inRound49?['prior','candidate','round47','round48','round49']:inRound48?['prior','candidate','round47','round48']:['prior','candidate','round47']).map(k=>[k,baseLabel(id,k)]));
  options(el('preset'),presets(id).map(([label],i)=>[String(i),label]));
  options(el('pivot'),pivotChoices(id).map(k=>[k,pivotSpec(k).label]));
  options(el('plateSelect'),id==='W'?[['B3','B3 · 사선'],['S3','S3 · 측면'],['A5','A5 · 사선']]:[['side','설정화 3 · 측면'],['front','설정화 1 · 정면'],...sourceViews().map(v=>[v.key,v.key+' · '+v.role])]);
  if(hasSourceComparison){
    const cells=el('plateSelect');
    const wanted=savedCells.get(id)||sourceParams.get('cell')||(id==='F02'?'설정4':id==='M01'?'설정2':'B3');
    if([...cells.options].some(o=>o.value===wanted))cells.value=wanted;
    if(freshSession)Object.assign(session.current.view,inRound49&&id==='W'?{yaw:0,pitch:0}:registeredCamera());
  }
  el('axes').replaceChildren();
  for(const [key,label] of Object.entries(axes(id))){
    const row=document.createElement('div');row.className='axis';row.dataset.axis=key;
    const title=document.createElement('label');title.htmlFor='range-'+key;title.textContent=label;row.append(title);
    for(const type of ['number','range']){
      const n=document.createElement('input');n.type=type;n.id=type+'-'+key;n.min=-100;n.max=100;n.step=1;n.dataset.axis=key;n.setAttribute('aria-label',label+(type==='number'?' 수치':' 조절'));
      n.oninput=()=>{if(n.value!==''&&n.validity.valid){const values={...session.current.values,[key]:Number(n.value)};updateShape(values);}};
      n.onchange=()=>{if(n.value===''||!n.validity.valid)n.value=session.current.values[key];commit();};
      n.onblur=()=>{if(n.value===''||!n.validity.valid)n.value=session.current.values[key];commit();};row.append(n);
    }
    el('axes').append(row);
  }
  const url=new URL(location.href);url.searchParams.set('case',id);if(hasSourceComparison)url.searchParams.set('cell',el('plateSelect').value);history.replaceState(null,'',url);if(parent!==self)parent.postMessage({type:'bookfriend:sculpt-case',case:id},location.origin);
  study48?.show(id,sourceParams.get('cell'));if(motion49)motion49.show(id);
  updateValues();schedule(true);status(subjects[id]+' · 조형 준비됨');
}
const storeKey=()=>[hasSourceComparison?'bookfriend.sculpt.'+studyRound:'bookfriend.sculpt.v1',id,el('slot').value].join('.');
function enableMotion(){
  if(motion49)return;
  const host=el('motion49');el('angleComparison').after(host);
  motion49=mountMotion49(host,{state:()=>session?.current.performance,evidence:assets.overlay49,
    reproduce:(row,example)=>{
      const performance=neutralPerformance(id);
      if(id==='M01'){performance.corner=Math.round(example.input.corner*100);performance.opening=Math.round(example.input.opening*100);}
      else performance.lid=example.input.lidSteps;
      put({...session.current,format:performanceFormat,base:'round49',values:zero(id),performance,
        view:{...defaultView(id),size:48,yaw:row.camera.yaw,pitch:row.camera.pitch,zoom:1}});
    },
    preview:values=>{session.previewPerformance(values);updateValues();schedule();},commit,view});
}
function put(p){let v=validatePreset(p);if(v.subject!==id)changeCase(v.subject);
  if(inRound49&&!v.performance)v={...v,format:performanceFormat,performance:neutralPerformance(id)};
  if(v.base==='round49'){
    prepare49(model,assets);
    if(![...el('basis').options].some(o=>o.value==='round49'))el('basis').add(new Option(baseLabel(id,'round49'),'round49'));
  }
  const needsControls=v.performance&&!motion49;
  if(needsControls)enableMotion();
  if(v.base==='round48'){
    prepare48(model,assets);
    if(![...el('basis').options].some(o=>o.value==='round48'))el('basis').add(new Option(baseLabel(id,'round48'),'round48'));
  }
  session.apply(v);if(needsControls)motion49.show(id);updateValues();schedule(true);}
function hook(){
  surfaceControls=mountSurfaceControls({zone:()=>selected,labels:()=>axes(id),values:()=>session.current.values,preview:updateShape,commit});
  angleDial=mountAngle46({host:el('poseDial46'),range:el('poseRange'),number:el('poseNum'),joint:el('pivot')});
  compareAngles=mountAngleComparison(el('triptych'),renderSculpt,bitmap);
  learning44=mountSculptLearning44({redraw:()=>schedule(true),apply:values=>put({...session.current,values})});
  el('compare47').hidden=!hasSourceComparison;
  if(hasSourceComparison){
    const reference=document.querySelector('section.reference');
    el('angleComparison').after(reference);
    const snap=button('원본 촬영각으로',matchPlate);
    snap.id='sourceView47';reference.querySelector('.refHead').append(snap);
    document.title=studyRound+'차 원형 대조 · 책방 친구';
    document.querySelector('h1').textContent=studyRound+'차 · '+(inRound49?'표정과 실제 자세의 비교':inRound48?'눈·입과 팔 올림 비교':'원형 대조와 정밀 교정');
    if(inRound49){
      options(el('leftBase47'),[['current','48차 후보'],['round47','47차 중립'],['history37','37차'],['original','초기 기준'],['same','오른쪽 편집 전 · 같은 동작']]);
      enableMotion();
    }else if(inRound48){
      options(el('leftBase47'),[['current','47차 후보'],['history37','37차'],['original','47차 교정 전 기준'],['same','오른쪽 편집 전']]);
      el('angleComparison').after(el('study48'));
      study48=mountStudy48(el('study48'),assets.overlay48,assets.orbits48,view);
    }

    el('priorLine').parentElement.lastChild.textContent=' 왼쪽 대조선';
  }
  const initialCompare=sourceParams.get('compare');
  el('leftBase47').value=initialCompare==='37'?'history37':[...el('leftBase47').options].some(o=>o.value===initialCompare)?initialCompare:'current';
  el('leftBase47').onchange=()=>{const url=new URL(location.href);url.searchParams.set('compare',el('leftBase47').value==='history37'?'37':el('leftBase47').value);history.replaceState(null,'',url);schedule(true);};
  el('subject').onchange=e=>changeCase(e.target.value);el('region').onchange=e=>selectZone(e.target.value);
  el('allAxes').onchange=()=>selectZone(selected.key);
  el('showHandles').onchange=()=>{el('handles').hidden=!el('showHandles').checked;};
  el('basis').onchange=e=>put({...session.current,base:e.target.value});el('undo').onclick=()=>{session.step(true);updateValues();schedule(true);};
  el('redo').onclick=()=>{session.step(false);updateValues();schedule(true);};
  el('resetShape').onclick=()=>put({...session.current,values:zero(id)});
  el('apply').onclick=()=>put({...session.current,values:{...zero(id),...presets(id)[+el('preset').value][1]}});
  el('pivot').onchange=e=>view({pivot:e.target.value,angle:0});
  for(const n of [el('poseRange'),el('poseNum')])n.oninput=()=>{if(n.value!==''&&n.validity.valid)view({angle:+n.value});};el('poseNum').onblur=updateValues;el('neutral').onclick=()=>view({angle:0});
  el('plateSelect').onchange=()=>{if(hasSourceComparison){const cell=el('plateSelect').value;savedCells.set(id,cell);const u=new URL(location.href);u.searchParams.set('cell',cell);history.replaceState(null,'',u);matchPlate();}schedule(true);};
  for(const key of ['photo','trace','priorLine','newLine'])el(key).onchange=layers;
  for(const [label,y,p] of [['정면',0,0],['왼쪽 사선',-45,0],['오른쪽 사선',45,0],['측면',90,0],['뒷면',180,0],['위',0,55],['아래',0,-55]]){
    el('angles').append(button(label,()=>view({yaw:y,pitch:p})));
  }
  for(const size of observationSizes){const n=button(size+'px',()=>view({size}));n.dataset.size=size;el('sizes').append(n);}
  const zoom=d=>view({zoom:clamp(Math.round((session.current.view.zoom+d)*100)/100,.5,2.5)});
  el('zoomIn').onclick=()=>zoom(.1);el('zoomOut').onclick=()=>zoom(-.1);el('resetView').onclick=()=>{const {yaw,pitch,zoom}=defaultView(id);view({yaw,pitch,zoom});};
  for(const canvas of [el('before'),el('after')]){
    let start=null;const orbitAngle=v=>Math.round((((v+180)%360+360)%360-180)*100)/100;
    const orbit=(v,dx,dy)=>view({yaw:orbitAngle(v.yaw+dx),pitch:orbitAngle(v.pitch+dy)});
    canvas.onpointerdown=e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);start={x:e.clientX,y:e.clientY,v:{...session.current.view}};};
    canvas.onpointermove=e=>{if(start)orbit(start.v,(e.clientX-start.x)*.65,(e.clientY-start.y)*.5);};
    canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{start=null;};
    canvas.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?.1:-.1);};
    canvas.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];if(d){e.preventDefault();orbit(session.current.view,...d);}};
  }
  el('save').onclick=()=>{try{localStorage.setItem(storeKey(),JSON.stringify(validatePreset(session.current)));status(subjects[id]+' · '+el('slot').value+'칸 저장함');}catch(e){status('저장 실패 · '+e.message);}};
  el('load').onclick=()=>{try{const s=localStorage.getItem(storeKey());if(!s)throw Error('저장한 설정이 없습니다.');put(JSON.parse(s));status('저장 설정을 복원했습니다.');}catch(e){status('열기 실패 · '+e.message);}};
  el('export').onclick=()=>{const data=validatePreset(session.current);const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.href=url;a.download='bookfriend-sculpt-'+id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status('교정값과 시점을 내보냈습니다.');};
  el('import').onclick=()=>el('file').click();el('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
    try{if(f.size>16384)throw Error('파일이 설정 크기 한계를 넘었습니다.');const p=validatePreset(JSON.parse(await f.text()));put(p);status('JSON 설정을 복원했습니다.');}
    catch(err){status('가져오기 실패 · '+err.message);}finally{e.target.value='';}};
}
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='bookfriend:studio-active'||typeof e.data.active!=='boolean')return;
  active=e.data.active;if(active)schedule();else clearTimeout(plateTimer);});
async function init(){
  const files={atlas:'atlas35',traces:'traces36',fit:'fit36',face:'face-eval42',chest:'chest-eval42'};
  if(inRound49)files.overlay49='face-overlay49';
  if(inRound48){files.overlay48='face-overlay48';files.orbits48='orbit-eval48';}
  if(hasSourceComparison){files.face47='face-eval47';files.faceOverlay47='face-overlay47';}
  const [pairs]=await Promise.all([Promise.all(Object.entries(files).map(async([k,n])=>{const r=await fetch(n+'.json');if(!r.ok)throw Error(n+' 자료 없음');return [k,await r.json()];})),loadRig()]);
  assets=Object.fromEntries(pairs);localPhoto=photoControls(()=>schedule(true),view);hook();
  const key=new URL(location.href).searchParams.get('case');changeCase(Object.hasOwn(subjects,key)?key:'F02');mountMethodChoice();
}
init().catch(e=>{status('모델을 열지 못했습니다 · '+e.message);console.error(e);});

