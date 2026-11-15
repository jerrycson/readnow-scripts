import {DEFAULTS} from './model.mjs';
import {BODY_PRESETS,bodyPreset} from './body-design.mjs';
import {CHEST_PRESETS,chestPreset} from './chest-design.mjs';
import {renderPixels} from './renderer.mjs';
import {bodyParts as beforeScene} from './compare/v7/renderer.mjs';
const $=s=>document.querySelector(s);
for(const p of BODY_PRESETS)$('#body').add(new Option(p.name,p.id));
for(const p of CHEST_PRESETS)$('#chest').add(new Option(p.name,p.id));
function draw(){const resolution=Number($('#resolution').value),s={...DEFAULTS,heads:Number($('#heads').value),sex:$('#sex').value,designStyle:$('#style').value,resolution:Math.min(128,resolution),...bodyPreset($('#body').value),...($('#chest').value==='body'?{}:chestPreset($('#chest').value))},o={yaw:Number($('#yaw').value),pitch:Number($('#pitch').value),portrait:$('#focus').value||false,...(resolution>128?{studyResolution:resolution}:{})};
 $('#chest').disabled=s.sex!=='female'||s.heads<=4;
 for(const [id,scene]of [['before',beforeScene(s)],['after',undefined]]){const r=renderPixels(s,{...o,sceneOverride:scene}),c=$('#'+id);if($('#silhouette').checked)for(let i=0;i<r.data.length;i+=4)if(r.data[i+3])r.data.set([40,53,47],i);c.width=r.width;c.height=r.height;const ctx=c.getContext('2d');ctx.putImageData(new ImageData(r.data,r.width,r.height),0,0);if($('#head-grid').checked&&!o.portrait&&o.pitch===0){const unit=(r.width-8)/(s.heads+1.1),top=(r.height-s.heads*unit)/2;ctx.strokeStyle='#31735a77';ctx.fillStyle='#265b49';ctx.font=Math.max(6,r.width/32)+'px sans-serif';ctx.lineWidth=1;for(let k=0;k<=s.heads;k++){const y=top+k*unit;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(r.width,y);ctx.stroke();ctx.fillText(String(k),2,y-1);}}}
 $('#status').textContent=s.heads+'등신 · 좌우 '+o.yaw+'° · 위아래 '+o.pitch+'° · 원본 '+resolution+'px'+(o.portrait?' · 부위 확대 투영':' · 전신')+' · 비교 중인 시안'+($('#head-grid').checked&&o.pitch!==0?' · 기울어진 시점에서는 등신선을 숨깁니다':'');
}
for(const el of document.querySelectorAll('select,input'))el.onchange=()=>{if(el.id==='focus'&&el.value==='ear')$('#yaw').value='90';draw();};
for(const button of document.querySelectorAll('[data-turn]'))button.onclick=()=>{const select=$('#'+button.dataset.turn);select.value=String((Number(select.value)+Number(button.dataset.step)+360)%360);draw();};
$('#download').onclick=()=>{const n=$('#before').width,c=document.createElement('canvas');c.width=n*2;c.height=n;const ctx=c.getContext('2d');ctx.drawImage($('#before'),0,0);ctx.drawImage($('#after'),n,0);c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='anatomy-before-after.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});};draw();
