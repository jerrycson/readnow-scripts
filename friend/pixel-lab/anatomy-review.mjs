import {DEFAULTS} from './model.mjs';
import {BODY_PRESETS,bodyPreset} from './body-design.mjs';
import {CHEST_PRESETS,chestPreset} from './chest-design.mjs';
import {renderPixels} from './renderer.mjs';
import {bodyParts as beforeScene} from './compare/v6/renderer.mjs';
const $=s=>document.querySelector(s);
for(const p of BODY_PRESETS)$('#body').add(new Option(p.name,p.id));
for(const p of CHEST_PRESETS)$('#chest').add(new Option(p.name,p.id));
function draw(){const resolution=Number($('#resolution').value),s={...DEFAULTS,heads:Number($('#heads').value),sex:$('#sex').value,designStyle:$('#style').value,resolution:Math.min(128,resolution),...bodyPreset($('#body').value),...($('#chest').value==='body'?{}:chestPreset($('#chest').value))},o={yaw:Number($('#yaw').value),portrait:$('#focus').value||false,...(resolution>128?{studyResolution:resolution}:{})};
 $('#chest').disabled=s.sex!=='female'||s.heads<=4;
 for(const [id,scene]of [['before',beforeScene(s)],['after',undefined]]){const r=renderPixels(s,{...o,sceneOverride:scene}),c=$('#'+id);if($('#silhouette').checked)for(let i=0;i<r.data.length;i+=4)if(r.data[i+3])r.data.set([40,53,47],i);c.width=r.width;c.height=r.height;c.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);}
 $('#status').textContent=s.heads+'등신 · '+o.yaw+'° · 원본 '+resolution+'px'+(o.portrait?' · 부위 확대 투영':' · 전신')+' · 비교 중인 시안';
}
for(const el of document.querySelectorAll('select,input'))el.onchange=()=>{if(el.id==='focus'&&el.value==='ear')$('#yaw').value='90';draw();};
$('#download').onclick=()=>{const n=$('#before').width,c=document.createElement('canvas');c.width=n*2;c.height=n;const ctx=c.getContext('2d');ctx.drawImage($('#before'),0,0);ctx.drawImage($('#after'),n,0);c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='anatomy-before-after.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});};draw();
