import {axes} from './studio-sculpt-model.mjs';
const $=id=>document.getElementById(id);
const directions=[['정면',0,0],['왼 45°',-45,0],['오른 45°',45,0],['왼 측면',-90,0],['오른 측면',90,0],['왼 뒤',-135,0],['뒤',180,0],['오른 뒤',135,0],['위',0,30],['아래',0,-30],['정수리',0,90],['바로 아래',0,-90]];
const subjects={F02:'49차 페른',M01:'49차 힘멜',W:'49차 성인 몸통'};
const requested=new URL(location.href).searchParams.get('case');
let id=Object.hasOwn(subjects,requested)?requested:'F02', values={}, visible=true;
const view={yaw:0,pitch:0,zoom:1,highSize:1024,pixelSize:48};
const selections=new Map(), orbitWorker=new Worker('./definition-worker.mjs',{type:'module'}), gridWorker=new Worker('./definition-worker.mjs',{type:'module'});
let generation=0,running=false,gridGen=0,gridBusy=false,gridNext=0;
function button(host,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;host.append(b);return b;}
function active(host,key){for(const b of host.querySelectorAll('[data-key]'))b.setAttribute('aria-pressed',String(b.dataset.key===String(key)));}
function choices(host,items,change){for(const [key,label] of items){const b=button(host,label,()=>change(key));b.dataset.key=key;}}
function pixels(canvas,buffer,size){canvas.width=canvas.height=size;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buffer),size,size),0,0);}
function requestMain(){
  generation++;
  $('status').textContent=view.highSize+'px와 '+view.pixelSize+'px 원본을 그리는 중';
  document.querySelector('main').dataset.ready='false';
  if(!running&&visible)sendMain();
}
function sendMain(){running=true;orbitWorker.postMessage({id,serial:generation,view:{...view},edit:{values:{...values}}});}
function fail(error){$('status').textContent='그림을 열 수 없습니다 · '+error;}
orbitWorker.onerror=e=>{running=false;fail(e.message);};
orbitWorker.onmessage=({data})=>{
  running=false;
  const pending=data.serial!==generation;
  if(pending&&(!visible||data.error||data.id!==id||data.view.highSize!==view.highSize||data.view.pixelSize!==view.pixelSize)){if(visible)sendMain();return;}
  if(data.error){fail(data.error);return;}
  pixels($('hd'),data.high,view.highSize);pixels($('px'),data.pixel,view.pixelSize);pixels($('enlarged'),data.pixel,view.pixelSize);
  $('loupe').style.setProperty('--pixels',view.highSize+'px');$('hdLabel').textContent='고해상도 원형 · '+view.highSize+'px';
  $('pxLabel').textContent='픽셀판 · '+view.pixelSize+'px 실제 크기';
  $('status').textContent=(subjects[id]||'기존 전신 시안')+' · 좌우 '+data.view.yaw.toFixed(1)+'° · 상하 '+data.view.pitch.toFixed(1)+'° · 고해상도 '+Math.round(data.highMs)+'ms · 픽셀 '+Math.round(data.pixelMs)+'ms'+(pending?' · 다음 움직임 그리는 중':'');
  const main=document.querySelector('main');main.dataset.case=id;main.dataset.ready=String(!pending);main.dataset.highMs=data.highMs;main.dataset.pixelMs=data.pixelMs;
  if(pending&&visible)sendMain();
};
const tiles=directions.map(([label,yaw,pitch])=>{
  const b=button($('views'),'',()=>{view.yaw=yaw;view.pitch=pitch;requestMain();});
  const title=document.createElement('span');title.textContent=label;
  const first=document.createElement('canvas'),second=document.createElement('canvas');
  b.append(title,first,second);b.ariaLabel=label+' 시점';return [first,second];
});
function nextGrid(){
  if(gridBusy||!visible||gridNext>=directions.length)return;
  gridBusy=true;const [,yaw,pitch]=directions[gridNext];
  gridWorker.postMessage({id,serial:gridGen,edit:{values:{...values}},view:{yaw,pitch,zoom:1,highSize:128,pixelSize:48}});
}
gridWorker.onerror=e=>{gridBusy=false;fail(e.message);};
gridWorker.onmessage=({data})=>{
  gridBusy=false;
  if(data.serial!==gridGen){nextGrid();return;}
  if(data.error){fail(data.error);return;}
  const [a,b]=tiles[gridNext++];pixels(a,data.high,128);pixels(b,data.pixel,48);
  if(gridNext===tiles.length)$('views').setAttribute('aria-busy','false');nextGrid();
};
function startGrid(){gridGen++;gridNext=0;$('views').setAttribute('aria-busy','true');for(const pair of tiles)for(const c of pair)c.getContext('2d').clearRect(0,0,c.width,c.height);nextGrid();}
function select(key){
  selections.set(id,{...values});id=key;values={...selections.get(id)};
  active($('research'),id);active($('families'),id);$('edits').replaceChildren();
  if(subjects[id]){
    $('editTitle').textContent='형태 교정';
    for(const [axis,label] of Object.entries(axes(id))){
      const tag=document.createElement('label'),input=document.createElement('input'),output=document.createElement('output');
      tag.append(document.createTextNode(label),input,output);input.type='range';input.min=-100;input.max=100;input.step=1;input.value=values[axis]||0;output.textContent=input.value;
      input.oninput=()=>{values[axis]=input.valueAsNumber;output.textContent=input.value;requestMain();};
      input.onchange=startGrid;$('edits').append(tag);
    }
    button($('edits'),'형태 초기화',()=>{values={};select(id);});
  }else $('editTitle').textContent='기존 전신 비례 시안';
  requestMain();startGrid();
}
choices($('research'),Object.entries(subjects),select);
for(const [sex,label] of [['female','여성'],['male','남성']]){
  const group=document.createElement('div');group.append(document.createTextNode(label));$('families').append(group);
  choices(group,Array.from({length:7},(_,i)=>[sex+'-'+(i+2),(i+2)+'등신']),select);
}
choices($('highSizes'),[[512,'512px'],[1024,'1024px'],[2048,'2048px 정밀 확인']],key=>{view.highSize=key;active($('highSizes'),key);requestMain();});
choices($('pixelSizes'),[[48,'48px'],[96,'96px']],key=>{view.pixelSize=key;active($('pixelSizes'),key);requestMain();});
active($('highSizes'),1024);active($('pixelSizes'),48);
$('native').onclick=()=>{const on=$('loupe').classList.toggle('native');$('native').setAttribute('aria-pressed',String(on));};
function save(which){if(document.querySelector('main').dataset.ready!=='true')return;$(which).toBlob(blob=>{if(!blob)return;const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=[id,which,Math.round(view.yaw),Math.round(view.pitch),$(which).width].join('-')+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});}
$('save').onclick=()=>save('hd');$('savePx').onclick=()=>save('px');
const wrap=n=>((n%360)+540)%360-180;
for(const c of [$('hd'),$('px'),$('enlarged')]){
  let previous=null;c.style.touchAction='none';
  c.onpointerdown=e=>{if(e.button)return;c.setPointerCapture(e.pointerId);previous=[e.clientX,e.clientY];};
  c.onpointermove=e=>{if(!previous)return;view.yaw=wrap(view.yaw+(e.clientX-previous[0])*.65);view.pitch=wrap(view.pitch+(e.clientY-previous[1])*.5);previous=[e.clientX,e.clientY];requestMain();};
  c.onpointerup=c.onlostpointercapture=c.onpointercancel=()=>previous=null;
  c.onwheel=e=>{e.preventDefault();view.zoom=Math.min(2.5,Math.max(.5,view.zoom+(e.deltaY<0?.1:-.1)));requestMain();};
  c.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowDown:[0,-5],ArrowUp:[0,5]}[e.key];if(!d)return;e.preventDefault();view.yaw=wrap(view.yaw+d[0]);view.pitch=wrap(view.pitch+d[1]);requestMain();};
}
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='bookfriend:studio-active'){visible=e.data.active;if(visible){if(!running&&document.querySelector('main').dataset.ready!=='true')sendMain();nextGrid();}}});
select(id);

