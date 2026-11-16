import {profileStudy} from './profile31.mjs';
import {DEFAULTS} from './model.mjs';
import {continuousStudy} from './continuous/body.mjs';
import {renderPixels} from './renderer.mjs';
const el=id=>document.getElementById(id);
for(const id of ['yaw','pitch'])for(let a=0;a<360;a+=45)el(id).add(new Option(a+'°',a));
el('yaw').value='90';
function draw(){
  const size=Number(el('size').value),s={...DEFAULTS,sex:el('sex').value,heads:4,candidate:'B',designStyle:'manga'};
  const scenes=['원형','A','B','C'].map(v=>profileStudy(s,v));scenes.push(continuousStudy({...s,heads:5}));
  const labels=['4등신 원형','4등신 A','4등신 B','4등신 C · 국소 보정','5등신 원형'];
  el('views').replaceChildren();
  for(const [i,scene]of scenes.entries()){
    const r=renderPixels({...s,heads:scene.height,resolution:size<=128?size:96},{portrait:'face',sceneOverride:scene,studyResolution:size>128?size:undefined,yaw:Number(el('yaw').value),pitch:Number(el('pitch').value)});
    const figure=document.createElement('figure'),canvas=document.createElement('canvas'),label=document.createElement('figcaption');
    canvas.width=size;canvas.height=size;label.textContent=labels[i];canvas.setAttribute('aria-label',labels[i]);
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.data),size,size),0,0);
    figure.append(label,canvas);el('views').append(figure);
  }
}
document.querySelectorAll('select').forEach(s=>s.onchange=draw);draw();

