import {reviewRig35} from './ribcage35-review.mjs';
import {paperRig} from './paper-rig35.mjs';
import {paperForms} from './paperforms35.mjs';
import {raisedPose,pose34,response34} from './bust34.mjs';
import {DEFAULTS} from './model.mjs';
import {loadRig} from './rig32.mjs';
import {studyView} from './camera35.mjs';
import {portraitPixels} from './portrait48.mjs';
const el=id=>document.getElementById(id),canvases=[el('original'),el('trial')];
const query=new URLSearchParams(location.search);
let id=paperForms.find(f=>f.id===query.get('form'))?.id||'W',yaw=-35,pitch=0,zoom=1,axis='vertical',clock=null,ready=false,pending=false,cacheKey='',rest=[],grab=null;
function menu(name,options,val,choose){
 const host=el(name);host.replaceChildren(...options.map(([value,title])=>{const b=document.createElement('button');b.type='button';b.textContent=title;b.setAttribute('aria-pressed',String(value===val));b.onclick=()=>choose(value);return b;}));
}
function options(){
 menu('forms',paperForms.map(f=>[f.id,f.id==='W'?'기본형':f.id+' '+f.name]),id,k=>{id=k;const u=new URL(location.href);u.searchParams.set('form',k);history.replaceState(null,'',u);options();queue();});
 menu('axes',[['vertical','상하'],['side','좌우'],['depth','앞뒤']],axis,k=>{axis=k;options();queue();});
 const angles=[['정면',0,0],['사선',-35,0],['측면',-90,0],['밑면',-35,-32],['뒤',180,0]];
 menu('directions',angles.map(([n])=>[n,n]),angles.find(([,a,b])=>yaw===a&&pitch===b)?.[0],n=>{const p=angles.find(v=>v[0]===n);yaw=p[1];pitch=p[2];options();queue();});
 el('back').href='paper35.html?form='+encodeURIComponent(id);
}
function draw(){
 if(!ready)return;
 const size=Number(el('volume').value)/100,elevation=Number(el('arm').value),time=Number(el('time').value)/100;
 const settings={...DEFAULTS,heads:8,sex:'female',designStyle:'manga',paperForm:id,chestVolume:size};
 if(cacheKey!==id+'/'+size){rest=[paperRig(settings),reviewRig35(settings)];cacheKey=id+'/'+size;}
 const f=rest[0].paperShape.form;
 const rimReturn=Math.min(.16,Math.max(0,1-f.side.at(-1)[0])*.28);
 const delta=response34(time,axis,'both',2*size-1,rimReturn,.45);
 for(const [i,scene] of rest.entries()){
   const moved=(elevation||Object.values(delta).some(v=>v.some(Boolean)))?pose34(scene,raisedPose(elevation),delta).scene:scene;
   const img=portraitPixels(settings,{...studyView(moved,false),yaw,pitch,cameraZoom:zoom,freeOrbit:true,studyResolution:192});
   canvases[i].getContext('2d').putImageData(new ImageData(img.data,img.width,img.height),0,0);
 }
 el('sizeValue').value=Math.round(size*100);el('armValue').value=elevation+'°';el('timeValue').value=time.toFixed(2)+'초';
 el('coords').textContent='좌우 '+Math.round(yaw)+'° · 상하 '+Math.round(pitch)+'° · 확대 '+Math.round(zoom*100)+'%';
}
function queue(){if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;draw();});}}
function stop(){clock=null;el('play').textContent='움직임 재생';}
function animate(now){
 if(clock===null)return;const t=Math.min(220,Math.round((now-clock)/10));
 el('time').value=t;draw();if(t===220)stop();else requestAnimationFrame(animate);
}
el('play').onclick=()=>{if(clock!==null){stop();return;}clock=performance.now();el('play').textContent='일시 정지';requestAnimationFrame(animate);};
for(const n of ['volume','arm','time'])el(n).oninput=()=>{stop();queue();};
for(const c of canvases){
 c.onpointerdown=e=>{if(e.button!==0)return;grab=[e.pointerId,e.clientX,e.clientY];c.setPointerCapture(e.pointerId);};
 c.onpointermove=e=>{if(grab?.[0]!==e.pointerId)return;yaw=(yaw+(e.clientX-grab[1])*.65)%360;pitch=(pitch+(e.clientY-grab[2])*.65)%360;grab=[e.pointerId,e.clientX,e.clientY];queue();};
 c.onlostpointercapture=()=>{grab=null;options();};
 c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.45,Math.min(3,zoom*Math.exp(-e.deltaY*.0013)));queue();},{passive:false});
 c.onkeydown=e=>{const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key];if(d){e.preventDefault();yaw+=d[0];pitch+=d[1];options();queue();}};
}
options();loadRig().then(()=>{ready=true;draw();document.body.dataset.ready='1';}).catch(e=>{el('coords').textContent='자료를 열 수 없습니다 · '+e.message;});
