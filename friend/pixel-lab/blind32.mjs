import {DEFAULTS} from './model.mjs';
import {renderPixels} from './renderer.mjs';
import {profileStudy} from './profile31.mjs';
import {improveProfile as ga} from './study32-ga.mjs';
import {improveProfile as na} from './study32-na.mjs';
const byId=id=>document.getElementById(id);
const pixels=new Map();
function display(){
  const size=Number(byId('size').value),views=byId('views');
  const rows=[['가',ga],['나',na]];
  if(byId('base').checked)rows.unshift(['31차 C',s=>profileStudy(s,'C')]);
  const fragment=document.createDocumentFragment();
  for(const [sex,label] of [['female','여성'],['male','남성']]){
    const section=document.createElement('section'),s={...DEFAULTS,heads:4,sex,candidate:'B',designStyle:'manga',resolution:size};
    section.innerHTML='<h2>'+label+' · 4등신 · '+size+' px</h2><table><thead><tr><th>시안</th><th>정면</th><th>45°</th><th>측면</th></tr></thead><tbody></tbody></table>';
    for(const [name,model] of rows){
      const tr=section.querySelector('tbody').insertRow();
      const th=document.createElement('th');th.scope='row';th.textContent=name;tr.append(th);
      const scene=model(s);
      for(const yaw of [0,45,90]){
        const key=[size,sex,name,yaw].join('/'),canvas=document.createElement('canvas');canvas.width=canvas.height=size;
        canvas.setAttribute('aria-label',[label,name,yaw+'도',size+'픽셀'].join(' '));
        if(!pixels.has(key))pixels.set(key,new ImageData(renderPixels(s,{sceneOverride:scene,portrait:'face',yaw}).data,size,size));
        canvas.getContext('2d').putImageData(pixels.get(key),0,0);tr.insertCell().append(canvas);
      }
    }
    fragment.append(section);
  }
  views.replaceChildren(fragment);views.setAttribute('aria-busy','false');
}
byId('size').onchange=byId('base').onchange=display;
try{byId('vote').value=localStorage.getItem('friend-study32-vote')||'';}catch{}
byId('vote').onchange=()=>{try{localStorage.setItem('friend-study32-vote',byId('vote').value);byId('saved').textContent='저장됨';}catch{byId('saved').textContent='현재 화면에 선택됨';}};
requestAnimationFrame(()=>setTimeout(display,0));
