import {DEFAULTS} from './model.mjs';
import {renderPixels,paintCanvas} from './renderer.mjs';
import {renderPixels as beforePixels} from './compare/renderer-v3.mjs';
const $=s=>document.querySelector(s),types=[['fox','여우','귀의 면을 넓히고 주둥이가 끝으로 좁아지도록 바꿨습니다.'],['cat','고양이','볼·가슴·뒷다리 부피, 짧은 주둥이와 올라가는 꼬리를 구분했습니다.'],['bird','새','목과 몸을 가깝게 붙이고, 접힌 날개와 뒤로 뻗는 꼬리를 만들었습니다.']];
let results=[];
function render(){const grid=$('#comparison');grid.replaceChildren();results=[];const yaw=Number($('#direction').value),resolution=Number($('#resolution').value),silhouette=$('#silhouette').checked;
 for(const [species,name,note]of types){const card=document.createElement('article'),h=document.createElement('h2'),p=document.createElement('p'),pair=document.createElement('div');card.className='compare-card';h.textContent=name;p.textContent=note;pair.className='compare-pair';card.append(h,pair,p);grid.append(card);
  for(const [label,fn]of [['3차 시안',beforePixels],['4차 시안',renderPixels]]){const fig=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');caption.textContent=label;fig.append(canvas,caption);pair.append(fig);const im=fn({...DEFAULTS,species,resolution,accessory:'none'},{yaw});if(silhouette)for(let i=0;i<im.data.length;i+=4)if(im.data[i+3])im.data.set([35,59,52],i);paintCanvas(canvas,im,2);results.push(im);}
 }
 $('#comparison-status').textContent=`${resolution}px · 수평 ${yaw}° · 같은 크기·조명·정지 자세. 미적 최종 채택 전 비교 자료입니다.`;
}
for(const id of ['direction','resolution','silhouette'])$('#'+id).onchange=render;
$('#save').onclick=()=>{const size=Number($('#resolution').value),canvas=document.createElement('canvas');canvas.width=size*2;canvas.height=size*3;const c=canvas.getContext('2d');for(let i=0;i<results.length;i++)c.putImageData(new ImageData(results[i].data,size,size),(i%2)*size,Math.floor(i/2)*size);canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='animal-comparison-before-after.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});};render();
