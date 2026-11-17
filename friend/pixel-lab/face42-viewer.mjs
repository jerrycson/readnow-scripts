import {loadRig} from './rig32.mjs';
import {resolutionControl} from './render-resolution.mjs';
import {pair42,frame42,eyeBounds42} from './face42-model.mjs';

const $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
async function read(file){
  const r=await fetch(file);
  if(!r.ok)throw Error(file+' 자료를 읽지 못했습니다.');
  return r.json();
}
const svg=(tag,props)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(props))e.setAttribute(k,v);return e;};
function group(id,entries,selected,change){
  $(id).replaceChildren(...entries.map(([key,title])=>{
    const b=document.createElement('button');b.type='button';b.textContent=title;b.dataset.key=key;
    b.setAttribute('aria-pressed',String(key===selected));b.onclick=()=>change(key);return b;
  }));
}
function paint(canvas,result){
  canvas.width=result.width;canvas.height=result.height;
  canvas.getContext('2d').putImageData(new ImageData(result.data,result.width,result.height),0,0);
}
const angles=[['side','왼쪽 측면',-90,0],['front','정면',0,0],['left','왼쪽 사선',-45,0],['right','오른쪽 사선',45,0],['opposite','오른쪽 측면',90,0],['low','올려다본 사선',45,-23],['high','뒤쪽 고각',-105,18],['back','뒤',180,0],['below','아래',0,-90],['above','위',0,90]];
const url=new URL(location.href),pairs=new Map(),choices={F02:'candidate',M01:'basis'};
let id=url.searchParams.get('case')==='M01'?'M01':'F02',scope='face',cell='측면',angle='side',yaw=-90,pitch=0,zoom=1;
if(['basis','candidate'].includes(url.searchParams.get('variant')))choices[id]=url.searchParams.get('variant');
let atlas,ref,data,notes,old,sensitivity,ready=false,queued=false,epoch=0;
const resolution=resolutionControl($('resolution42'),queue);
const model=()=>{if(!pairs.has(id))pairs.set(id,pair42(id,atlas,ref));return pairs.get(id);};
const selected=()=>data.cases[id];
const candidate=()=>choices[id]==='candidate';
const rightLabel=()=>candidate()?'42차 턱 후보':id==='F02'?'41차 기본 · 페른 40차 눈':'41차 기본 · 힘멜 39차';
function updateURL(){
  const u=new URL(location.href);u.searchParams.set('case',id);u.searchParams.set('variant',choices[id]);u.searchParams.set('cell',cell);
  history.replaceState(null,'',u);
}
function syncControls(){
  group('subjects42',[['F02','페른'],['M01','힘멜']],id,key=>{
    id=key;chooseCell('측면');
  });
  group('variant42',[['basis','오른쪽 · 현행 기본'],['candidate','오른쪽 · 42차 후보']],choices[id],key=>{
    choices[id]=key;syncControls();drawSource();updateURL();queue();
  });
  group('scopes42',[['face','얼굴 전체'],['body','전신']],scope,key=>{scope=key;zoom=1;syncControls();queue();});
  group('angles42',angles.map(([k,t])=>[k,t]),angle,key=>{
    const preset=angles.find(p=>p[0]===key);angle=key;yaw=preset[2];pitch=preset[3];zoom=1;syncControls();queue();
  });
  group('cells42',[['측면','설정 3 · 측면'],...selected().views.map(v=>[v.key,v.key.startsWith('설정')?v.key:v.key.replace('-','화 장면 ')])],cell,chooseCell);
  $('leftLabel').textContent=id==='F02'?'41차 기본 · 페른 40차 눈':'41차 기본 · 힘멜 39차';
  $('rightLabel').textContent=rightLabel();$('traceLabel').textContent=candidate()?'42차 선':'같은 41차 선';
  $('eyeLabel').textContent=rightLabel();$('decision42').textContent=selected().recommendation;
  $('note42').textContent=notes.find(n=>n.id.includes(id==='F02'?'fern':'himmel')).unit;
  $('manuscript').href=id==='F02'?'42-fern-jaw-A4.png':'42-himmel-jaw-A4.png';
  $('back41').href='contour36.html?round=41&case='+id;
}
function chooseCell(key){
  const v=selected().views.find(v=>v.key===key);
  cell=v?key:'측면';angle=v?'reference':'side';yaw=v?.pose.yaw??-90;pitch=v?.pose.pitch??0;zoom=1;
  syncControls();drawSource();updateURL();queue();
}
function queue(){
  if(!ready||queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;try{draw();}catch(e){$('state42').textContent='그리기 실패 · '+e.message;}});
}
function draw(){
  const size=resolution.sync(192),pair=model(),params={size,scope,yaw,pitch,zoom};
  const a=frame42(pair,'prior',params),b=candidate()?frame42(pair,'next',params):a;
  for(const [canvas,frame,key] of [[$('prior42'),a,'41'],[$('next42'),b,candidate()?'42':'41']]){
    paint(canvas,frame.rendered);Object.assign(canvas.dataset,{case:id,version:key,yaw,pitch,zoom,scope,resolution:size});
  }
  $('pose42').textContent='좌우 '+yaw.toFixed(1)+'° · 상하 '+pitch.toFixed(1)+'° · 확대 '+Math.round(zoom*100)+'% · 두 판 '+size+'×'+size+'px';
  if($('eyes42').open){
    const box=eyeBounds42(pair,a);
    for(const [dst,src] of [[$('eyesPrior'),$('prior42')],[$('eyesNext'),$('next42')]]){
      if(!box){dst.width=dst.height=1;continue;}
      const [x,y,w,h]=box;dst.width=w;dst.height=h;
      const ctx=dst.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(src,x,y,w,h,0,0,w,h);
    }
    $('eyeStatus').textContent=box?'같은 화면 구획 ('+box[0]+', '+box[1]+')의 '+box[2]+'×'+box[3]+' 실제 화소입니다. 측면과 뒤쪽에서는 머리에 가려지는 눈도 있습니다.':'현재 화면 밖에 두 눈이 있습니다.';
  }
}
function lines(points,color,dash=''){
  return svg('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':1.6,'stroke-dasharray':dash,'vector-effect':'non-scaling-stroke'});
}
function dots(points,color){
  return svg('path',{d:points.map(([x,y])=>'M'+x+' '+y+'h.1').join(' '),fill:'none',stroke:color,'stroke-width':1.1,'stroke-linecap':'round','vector-effect':'non-scaling-stroke'});
}
function drawSource(){
  const generation=++epoch,c=selected(),v=c.views.find(v=>v.key===cell),side=!v,plate=$('source42');
  const sideRegion=ps=>ps.filter(p=>p[0]>=c.sideRange[0]&&p[0]<=c.sideRange[1]);
  const left=side?sideRegion(c.side.prior):v.prior,right=candidate()?(side?sideRegion(c.side.next):v.next):left;
  const observed=side?[sideRegion(c.side.source)]:v.jaw;
  const root=svg('svg',{width:248,height:248,overflow:'hidden'});plate.replaceChildren(root);
  $('sourceState42').textContent='';
  if($('photo42').checked){
    const [x,y,w,h]=v?.crop||[0,0,248,248],[iw,ih]=v?.size||[248,248];
    const image=svg('image',{href:v?.source||c.source,x:-x*248/w,y:-y*248/h,width:iw*248/w,height:ih*248/h,preserveAspectRatio:'none'});
    $('sourceState42').textContent='공식 그림을 읽는 중입니다.';
    image.onload=()=>{if(epoch===generation)$('sourceState42').textContent='';};
    image.onerror=()=>{if(epoch===generation)$('sourceState42').textContent='공식 서버의 그림을 읽지 못했습니다. 관측 좌표와 원전 링크를 확인할 수 있습니다.';};
    root.append(image);
  }
  if($('trace42').checked)for(const ps of observed)root.append(lines(ps,'#007a79'));
  for(const [toggle,ps,color,dash] of [['baseLine42',left,'#78569a','3 2'],['newLine42',right,'#b64a22','']]){
    if(!$(toggle).checked)continue;
    const e=side?lines(ps,color,dash):dots(ps,color);e.setAttribute('data-layer',toggle);e.setAttribute('data-points',String(ps.length));root.append(e);
  }
  $('credit42').href=v?.page||c.sourcePage;
  if(side){
    const l=c.side.before,r=candidate()?c.side.after:l;
    $('measure42').textContent='관측 구간 x='+c.sideRange.join('–')+'px. 평균 높이 오차 '+l.sideMae.toFixed(2)+' → '+r.sideMae.toFixed(2)+'px, 접선 각도 차이 '+l.tangentDeg.toFixed(2)+' → '+r.tangentDeg.toFixed(2)+'°.';
    $('registration42').textContent=id==='F02'?'옆머리가 목 앞을 가립니다. 색선은 그림에서 읽은 짧은 턱밑까지만 표시합니다.':'턱 아래 잉크가 목 그림자와 옷깃에 닿는 곳까지만 표시합니다.';
  }else{
    $('measure42').textContent=v.role+' · 원화 턱선에서 가시 모서리까지 '+v.before.toFixed(2)+' → '+(candidate()?v.after:v.before).toFixed(2)+'px. '+v.limits;
    const previous=old.cases[id].find(r=>r.key===v.key);
    const oriented=sensitivity[id].find(r=>r.key===v.key).runs[0];
    $('registration42').textContent=v.registration+' · 네 점 정합 RMS '+v.pose.rms.toFixed(2)+'px. 원화 위 선에는 화면 회전과 배율이 포함됩니다.'
      +' 원화와 방향 차이 35° 이내인 가시선까지 '+oriented.before.toFixed(2)+' → '+(candidate()?oriented.after:oriented.before).toFixed(2)+'px.'
      +(v.key.startsWith('설정')?'':' 과거 기준 머리로 등록했을 때의 거리 '+previous.before.toFixed(2)+' → '+(candidate()?previous.after:previous.before).toFixed(2)+'px.');
  }
}
for(const c of [$('prior42'),$('next42')]){
  let drag=null;
  c.onpointerdown=e=>{if(e.button===0){drag=[e.clientX,e.clientY];c.setPointerCapture(e.pointerId);}};
  c.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.75;pitch+=(e.clientY-drag[1])*.75;drag=[e.clientX,e.clientY];free();};
  c.onlostpointercapture=()=>{drag=null;};
  c.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];free();}};
  c.onwheel=e=>{e.preventDefault();zoom=Math.min(3,Math.max(.45,zoom*Math.exp(-e.deltaY*.0017)));queue();};
}
function free(){
  if(angle!=='free'){angle='free';for(const b of $('angles42').children)b.setAttribute('aria-pressed','false');}
  queue();
}
$('eyes42').ontoggle=queue;
for(const key of ['photo42','trace42','baseLine42','newLine42'])$(key).oninput=()=>{if(ready)drawSource();};
try{
  [atlas,ref,data,notes,old,sensitivity]=await Promise.all([read('atlas35.json'),read('traces36.json'),read('face-eval42.json'),read('face-note42.json'),read('face-legacy-registration42.json'),read('face-registration-sensitivity42.json'),loadRig()]);
  ready=true;chooseCell(url.searchParams.get('cell')||'측면');draw();
  document.body.dataset.ready='true';
}catch(e){$('state42').textContent='42차 얼굴을 열지 못했습니다. '+e.message;}
