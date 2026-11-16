import {DEFAULTS} from './model.mjs';
import {PRESETS} from './catalog.mjs';
import {renderPixels} from './renderer.mjs';
const $=s=>document.querySelector(s),presets=PRESETS.filter(p=>p.settings.species==='human'),amplitudes=[0,.025,.05,.08,.12],canvases=[];
for(const [i,p]of presets.entries())$('#preset').add(new Option(p.name,String(i),i===1,i===1));
for(let yaw=0;yaw<360;yaw+=45)$('#yaw').add(new Option(yaw+'°',String(yaw),yaw===90,yaw===90));
for(const value of amplitudes){const f=document.createElement('figure');f.className='sample';const caption=document.createElement('figcaption');caption.textContent=value===0?'수정 전':value===.08?'0.08 · 채택':value+' · 비교 후보';const small=document.createElement('span');small.textContent='동일한 카메라·조명·시간';const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',caption.textContent+' 수면 프레임');caption.append(small);f.append(caption,canvas);$('#samples').append(f);canvases.push(canvas);}
let playing=false,timer,last=0;
function draw(){const s={...DEFAULTS,...presets[Number($('#preset').value)].settings,resolution:Number($('#resolution').value)},frame=Number($('#phase').value),yaw=Number($('#yaw').value);for(const [i,a]of amplitudes.entries()){const im=renderPixels(s,{action:'sleep',yaw,phase:frame*Math.PI/4,breathAmplitude:a}),canvas=canvases[i];canvas.width=im.width;canvas.height=im.height;canvas.getContext('2d').putImageData(new ImageData(im.data,im.width,im.height),0,0);}$('#phase-label').value=(frame+1)+' / 8';$('#status').textContent=s.resolution+'px · '+yaw+'° · '+(frame+1)+'번째 프레임';}
function setPlaying(value){playing=value;$('#play').textContent=value?'멈추기':'호흡 재생';$('#play').setAttribute('aria-pressed',String(value));if(!value)cancelAnimationFrame(timer);else {last=0;timer=requestAnimationFrame(tick);}}
function tick(now){if(!playing)return;if(!last||now-last>=350){last=now;$('#phase').value=String((Number($('#phase').value)+1)%8);draw();}timer=requestAnimationFrame(tick);}
$('#play').onclick=()=>setPlaying(!playing);for(const id of ['preset','yaw','resolution'])$('#'+id).onchange=draw;$('#phase').oninput=()=>{setPlaying(false);draw();};document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});draw();
