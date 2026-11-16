import {DEFAULTS} from './model.mjs';
import {renderPixels} from './renderer.mjs';
import {alignment} from './reference-alignment.mjs';
const $=s=>document.querySelector(s),source=$('#source'),labels={top:'머리끝 Y',chin:'턱 Y',sole:'발바닥 Y',centerX:'중심 X',cropLeft:'왼쪽 X',cropRight:'오른쪽 X'};
let custom=false,readId=0,marks={};
for(const [key,label]of Object.entries(labels)){const l=document.createElement('label'),input=document.createElement('input');l.textContent=label;input.type='number';input.min='0';input.id=key;input.step='1';l.append(input);$('#landmarks').append(l);input.onchange=()=>{marks[key]=Number(input.value);draw();};}
function setMarks(){if(custom)return;const female=$('#sex').value==='female',view=Number($('#yaw').value),cx=view===0?330:view===45?615:885;marks={top:female?843:72,chin:female?936:154,sole:female?1474:703,centerX:cx,cropLeft:view===0?180:view===45?500:810,cropRight:view===0?470:view===45?745:980};sync();}
function sync(){for(const key of Object.keys(labels))$('#'+key).value=String(marks[key]);}
function draw(){if(!source.complete||!source.naturalWidth)return;try{
 const heads=Number($('#heads').value),a=alignment(marks,heads,512,$('#align').value),s={...DEFAULTS,heads,sex:$('#sex').value,designStyle:$('#style').value,resolution:128},r=renderPixels(s,{yaw:Number($('#yaw').value),studyResolution:Number($('#resolution').value)}),small=document.createElement('canvas');small.width=r.width;small.height=r.height;small.getContext('2d').putImageData(new ImageData(r.data,r.width,r.height),0,0);
 // Both model and reference use exactly the same orthographic head unit.
 const factor=(512-16)/(r.width-8),offset=(512-r.width*factor)/2;
 for(const id of ['reference','model','overlay']){const c=$('#'+id),ctx=c.getContext('2d');ctx.clearRect(0,0,512,512);ctx.imageSmoothingEnabled=false;
  if(id!=='reference')ctx.drawImage(small,offset,offset,r.width*factor,r.height*factor);
  if(id!=='model'){ctx.globalAlpha=id==='overlay'?Number($('#opacity').value):1;const left=Math.max(0,marks.cropLeft),right=Math.min(source.naturalWidth,marks.cropRight);if(right>left)ctx.drawImage(source,left,marks.top,right-left,marks.sole-marks.top,a.dx+left*a.factor,a.dy+marks.top*a.factor,(right-left)*a.factor,(marks.sole-marks.top)*a.factor);ctx.globalAlpha=1;}
  if($('#guides').checked){ctx.strokeStyle='#48766077';ctx.lineWidth=1;ctx.setLineDash([4,5]);for(let n=0;n<=heads;n++){const y=a.modelTop+n*a.unit;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(496,y);ctx.stroke();}ctx.setLineDash([]);}
 }
 $('#metrics').textContent='참고 기준점으로 측정한 등신 '+a.headRatio.toFixed(2)+' · 현재 모델 '+heads+'등신 · 손으로 지정한 기준점에 따른 근사 측정';$('#source-status').textContent='';
 }catch(e){$('#source-status').textContent=e.message;}}
for(const id of ['sex','heads','yaw','style','align','resolution','opacity','guides'])$('#'+id).addEventListener('input',()=>{if(['sex','yaw'].includes(id))setMarks();draw();});
source.onload=()=>{if(custom){marks={top:0,chin:source.naturalHeight/7,sole:source.naturalHeight,centerX:source.naturalWidth/2,cropLeft:0,cropRight:source.naturalWidth};sync();}draw();};source.onerror=()=>$('#source-status').textContent='참고 그림을 열지 못했습니다.';
source.onclick=e=>{const r=source.getBoundingClientRect(),x=(e.clientX-r.left)*source.naturalWidth/r.width,y=(e.clientY-r.top)*source.naturalHeight/r.height,key=$('#mark').value;marks[key]=Math.round(key.startsWith('crop')?x:y);if(key==='top')marks.centerX=Math.round(x);sync();draw();const next={top:'chin',chin:'sole',sole:'cropLeft',cropLeft:'cropRight',cropRight:'top'};$('#mark').value=next[key];};
$('#file').onchange=()=>{const file=$('#file').files[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>20*1024*1024){$('#source-status').textContent='20MB 이하 PNG·JPEG·WebP 파일을 선택해 주세요.';return;}const token=++readId,reader=new FileReader();reader.onload=()=>{if(token!==readId)return;custom=true;source.src=reader.result;};reader.onerror=()=>$('#source-status').textContent='파일을 읽지 못했습니다.';reader.readAsDataURL(file);};
$('#reset-source').onclick=()=>{readId++;custom=false;source.src='studies/adult-anime-target-v1.png';setMarks();draw();};setMarks();draw();
