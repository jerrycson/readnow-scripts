import {WIDTH,FLOOR,HEIGHT,kinds,title,initialSetup,validSetup,settle,place,createScene,command,step,restore} from './studio-world-sim.mjs';
import {makeView} from './studio-world-view.mjs';

const el=id=>document.getElementById(id);
const canvas=el('world'),paint=makeView(canvas);
const states={choose:'다음 사물을 고르는 중',approach:'다가가는 중',observe:'살펴보는 중',interact:'사물에 반응하는 중',blocked:'높은 턱 앞에서 멈춤',idle:'머무르는 중'};
const speeds=[.5,1,2,4];
let setup=initialSetup(),world=createScene(setup),selected=setup.items[0].id,speed=1,tape=[];
let playing=true,studioActive=true,frame=0,lastTime=null,acc=0,palette=null,drag=null,lastLog='',importVersion=0;
const visible=()=>studioActive&&!document.hidden;
const say=text=>{el('notice').textContent=text;};
const selectedItem=()=>world.items.find(o=>o.id===selected);
function time(tick){return String(Math.floor(tick/600)).padStart(2,'0')+':'+String(Math.floor(tick/10)%60).padStart(2,'0')+'.'+tick%10;}
function update(){
  if(!visible())return;
  paint(world,selected,drag?.moved?drag:null);
  el('clock').value=time(world.tick);
  el('activity').textContent=states[world.state]+(world.held!==null?' · 책을 들고 있음':'');
  el('play').textContent=playing?'일시 정지':'재생';el('play').setAttribute('aria-pressed',String(playing));
  const item=selectedItem(),carried=item?.id===world.held;
  el('info').textContent=item?(title(item)+(carried?' · 손에 들고 있음':' · 가로 '+item.x+'px · 바닥에서 '+item.y+'px')):'배치된 사물이 없습니다.';
  for(const id of ['visit','left','right','remove'])el(id).disabled=!item||carried;
  el('pick').disabled=!item||item.kind!=='book'||world.held!==null;
  el('drop').disabled=world.held===null;
  const log=world.events.map(e=>[e.tick,e.type,e.text].join('/')).join('|');
  if(log!==lastLog||!el('events').children.length){
    lastLog=log;
    const rows=world.events.slice(-12).reverse().map(e=>{
      const li=document.createElement('li'),stamp=document.createElement('time');
      stamp.textContent=time(e.tick);li.append(stamp,document.createTextNode(e.text));return li;
    });
    if(!rows.length){const li=document.createElement('li');li.textContent='아직 기록된 행동이 없습니다.';rows.push(li);}
    el('events').replaceChildren(...rows);
  }
  Object.assign(canvas.dataset,{tick:world.tick,x:world.x,y:world.y,held:world.held??'',state:world.state,phase:world.phase});
}
function loop(now){
  frame=0;if(!playing||!visible())return;
  if(lastTime!==null)acc+=Math.min(.25,(now-lastTime)/1000)*speed;
  lastTime=now;let changed=false;
  while(acc>=.1){step(world);acc-=.1;changed=true;}
  if(changed)update();
  frame=requestAnimationFrame(loop);
}
function schedule(){
  cancelAnimationFrame(frame);frame=0;lastTime=null;acc=0;
  if(playing&&visible())frame=requestAnimationFrame(loop);
  update();
}
function sync(){
  el('item').replaceChildren(...world.items.map(o=>new Option(title(o),o.id)));
  if(!world.items.some(o=>o.id===selected))selected=world.items[0]?.id??null;
  el('item').value=String(selected);
  el('seed').value=setup.seed;el('climb').value=setup.climb;el('curiosity').value=setup.curiosity;
  el('climbValue').value=setup.climb+'px';el('curiosityValue').value=setup.curiosity+'%';el('speed').value=speed;
  for(const b of el('palette').children)b.setAttribute('aria-pressed',String(b.dataset.kind===palette));
  update();
}
function edit(next,message){
  if(!next){say('이 위치에는 공간이 부족합니다. 다른 자리로 옮겨 주세요.');return;}
  setup=next;world=createScene(setup);tape=[];playing=false;palette=null;drag=null;sync();schedule();say(message);
}
function act(op){
  const id=op==='drop'?0:selected;
  if(!command(world,op,id)){say('이 책을 집으려면 위에 쌓인 물체를 먼저 옮기고, 손에 든 책을 내려놓으세요.');return;}
  tape.push([world.tick,op,id]);update();
  say(playing?'행동 명령을 적용했습니다.':'명령을 기록했습니다. 재생하거나 한 단계씩 확인하세요.');
}
function move(dx){
  const o=selectedItem();if(!o||o.id===world.held)return;
  edit(place(setup,o.id,o.kind,o.x+dx,o.y),title(o)+'의 시작 위치를 바꿨습니다.');
}
function point(e){
  const r=canvas.getBoundingClientRect();
  return {x:Math.max(0,Math.min(WIDTH,Math.round((e.clientX-r.left)*WIDTH/r.width))),y:Math.max(0,Math.min(FLOOR,Math.round(FLOOR-(e.clientY-r.top)*HEIGHT/r.height)))};
}
function hit({x,y}){
  return [...world.items].reverse().find(o=>o.id!==world.held&&Math.abs(o.x-x)<=kinds[o.kind].width/2+2&&y>=o.y-2&&y<=o.y+kinds[o.kind].height+2);
}
for(const [kind,shape] of Object.entries(kinds)){
  const b=document.createElement('button');b.type='button';b.dataset.kind=kind;b.textContent=shape.name+' 추가';
  b.onclick=()=>{palette=palette===kind?null:kind;sync();say(palette?'무대에서 '+shape.name+'을 놓을 자리를 누르세요.':'배치 도구를 닫았습니다.');};
  el('palette').append(b);
}
function addAt(x,y){
  if(!palette)return;
  const id=Math.max(0,...setup.items.map(o=>o.id))+1;
  const next=place(setup,id,palette,x,y);
  if(next)selected=id;
  edit(next,'새 물체를 놓았습니다.');
}
canvas.onpointerdown=e=>{
  if(e.button!==0||drag)return;
  const p=point(e);
  if(palette){addAt(p.x,p.y);return;}
  const o=hit(p);if(!o)return;
  selected=o.id;drag={id:o.id,kind:o.kind,pointer:e.pointerId,ox:p.x-o.x,oy:p.y-o.y,x:o.x,y:o.y,moved:false};
  canvas.setPointerCapture(e.pointerId);sync();
};
canvas.onpointermove=e=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  const p=point(e),x=p.x-drag.ox,y=p.y-drag.oy;
  if(!drag.moved&&Math.abs(drag.x-x)+Math.abs(drag.y-y)<2)return;
  drag.moved=true;drag.x=Math.max(0,Math.min(WIDTH,x));drag.y=Math.max(0,Math.min(FLOOR,y));update();
};
canvas.onpointerup=e=>{
  if(!drag||drag.pointer!==e.pointerId)return;
  const ghost=drag;drag=null;
  if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  if(ghost.moved)edit(place(setup,ghost.id,ghost.kind,ghost.x,ghost.y),'새 배치에서 첫 단계로 돌아왔습니다.');
  else update();
};
canvas.onlostpointercapture=()=>{drag=null;update();};
canvas.onkeydown=e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-4:4);}
  if(e.key==='Enter'&&palette){e.preventDefault();addAt(Math.min(WIDTH-24,(selectedItem()?.x??68)+32),30);}
  if(e.key==='Escape'){palette=null;drag=null;sync();}
};
el('item').onchange=()=>{selected=Number(el('item').value);update();};
el('left').onclick=()=>move(-4);el('right').onclick=()=>move(4);
el('remove').onclick=()=>edit({...setup,items:settle(setup.items.filter(o=>o.id!==selected).map(o=>({...o})))},'시작 배치에서 사물을 뺐습니다.');
el('visit').onclick=()=>act('visit');el('pick').onclick=()=>act('pick');el('drop').onclick=()=>act('drop');
el('play').onclick=()=>{playing=!playing;schedule();};
el('single').onclick=()=>{playing=false;step(world);schedule();};
el('restart').onclick=()=>edit(structuredClone(setup),'같은 시드와 시작 배치로 돌아왔습니다.');
el('speed').onchange=()=>{speed=Number(el('speed').value);schedule();};
el('generate').onclick=()=>{
  const raw=el('seed').value,seed=Number(raw);
  if(!raw||!Number.isInteger(seed)||seed<0||seed>4294967295){say('시드는 0부터 4294967295까지의 정수입니다.');return;}
  edit({...initialSetup(seed),climb:setup.climb,curiosity:setup.curiosity},'시드에 맞춰 새 배치를 만들었습니다.');
};
for(const id of ['climb','curiosity']){
  el(id).oninput=()=>{el(id+'Value').value=el(id).value+(id==='climb'?'px':'%');};
  el(id).onchange=()=>edit({...setup,[id]:Number(el(id).value)},'변경한 조건을 시작 장면에 적용했습니다.');
}
function capture(){return JSON.stringify({setup,speed,tick:world.tick,commands:tape,selected});}
async function apply(text){
  const input=text.trim(),hash=input.startsWith('#world=')?input.slice(1):
    /^https?:\/\//.test(input)?new URL(input).hash.slice(1):null;
  const d=JSON.parse(hash===null?input:decode(new URLSearchParams(hash).get('world')||''));
  if(!validSetup(d.setup)||!speeds.includes(d.speed))throw Error('실험 조건을 읽을 수 없습니다.');
  const version=++importVersion;
  const run=await restore(d.setup,d.commands,d.tick,()=>version===importVersion);
  setup=d.setup;world=run;tape=d.commands;speed=d.speed;selected=d.selected;
  playing=false;palette=null;drag=null;sync();schedule();
}
el('export').onclick=()=>{el('data').value=capture();say('현재 장면 설정을 읽었습니다.');};
el('import').onclick=async()=>{try{await apply(el('data').value);say('같은 단계의 장면을 복원했습니다.');}catch(e){say(e.message);}};
for(const name of ['pointerdown','keydown'])document.addEventListener(name,()=>{importVersion++;},true);
function encode(text){return btoa(text).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
function decode(text){return atob(text.replaceAll('-','+').replaceAll('_','/'));}
el('share').onclick=async()=>{
  const data=capture(),url=new URL(location.href);url.hash='world='+encode(data);
  el('data').value=data;
  try{await navigator.clipboard.writeText(url.href);say('현재 단계에서 열리는 장면 링크를 복사했습니다.');}
  catch{el('data').closest('details').open=true;el('data').value=url.href;el('data').focus();el('data').select();say('선택한 장면 링크를 복사하세요.');}
};
function activate(active){studioActive=active;schedule();}
window.addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='bookfriend:studio-active'||typeof e.data.active!=='boolean')return;
  activate(e.data.active);
});
document.addEventListener('visibilitychange',schedule);
async function start(){
  try{
    const hash=new URLSearchParams(location.hash.slice(1)).get('world');
    if(hash){await apply(decode(hash));say('공유된 장면을 같은 단계에 복원했습니다.');}
    else{sync();schedule();say('책과 상자, 발판을 움직여 보세요.');}
  }catch(e){sync();schedule();say('공유 장면을 읽을 수 없어 기본 배치를 열었습니다. '+e.message);}
  document.body.dataset.ready='true';
}
start();
