import {readApplied,reshapeHead} from './photo-apply36.mjs';
import {SIZE,names} from './hull36.mjs';
import {safeGain} from './studio-sculpt-model.mjs';
import {renderPixels,projectPoint} from './renderer.mjs';

const $=id=>document.getElementById(id);
function request(q){return new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
function database(){
  const q=indexedDB.open('bookfriend-photo-model',1);
  q.onupgradeneeded=()=>q.result.createObjectStore('versions',{keyPath:'id'});
  return request(q);
}
function protectedFit(base,hull){
  const changed=reshapeHead(base,hull),offsets=new Map(),arrays=new Map();
  base.parts.forEach((part,i)=>{
    if(offsets.has(part.vertices))return;
    const dest=changed.parts[i].vertices;
    offsets.set(part.vertices,part.vertices.map((v,j)=>dest[j].p.map((x,k)=>x-v.p[k])));
  });
  const gain=safeGain(base,offsets);
  const parts=base.parts.map((p,i)=>{
    const vertices=p.vertices;
    if(!arrays.has(vertices)){
      const dest=changed.parts[i].vertices,d=offsets.get(vertices);
      arrays.set(vertices,vertices.map((v,j)=>{
        if(d[j].every(a=>a===0))return v;
        const n=v.n.map((a,k)=>a+gain*(dest[j].n[k]-a)),length=Math.hypot(...n)||1;
        return {...v,p:v.p.map((a,k)=>a+gain*d[j][k]),n:n.map(a=>a/length)};
      }));
    }
    return {...p,vertices:arrays.get(vertices)};
  });
  return {scene:{...base,parts},gain};
}
function masked(shot){
  const c=document.createElement('canvas');c.width=c.height=SIZE;
  const rgba=new Uint8ClampedArray(shot.rgba);
  for(let i=0;i<shot.mask.length;i++)if(!shot.mask[i])rgba[4*i+3]=0;
  c.getContext('2d').putImageData(new ImageData(rgba,SIZE,SIZE),0,0);return c;
}
export function photoControls(redraw,changeView){
  const container=document.createElement('section');container.className='photo-fit';container.id='localReference';
  container.innerHTML='<h2>내 참고그림</h2><div class="toolrow"><label>이 브라우저의 얼굴 판 <select id="fitVersion"></select></label><button id="fitRefresh" type="button">다시 읽기</button> <a href="photo-engine36.html" target="_blank" rel="noopener">다섯 방향 작업대</a></div><div class="toolrow"><label><input type="checkbox" id="fitShape"> 오른쪽에 사진 외형 적용</label><label>사진 방향 <select id="fitShot"></select></label><button type="button" id="fitAlign">사진 시점 맞추기</button></div><div class="toolrow"><label><input type="checkbox" id="fitOverlay"> 오른쪽에 입력 사진 겹치기</label><label>사진 불투명도 <input id="fitAlpha" type="range" min="0" max="100" value="45"><output id="fitAlphaOut">45%</output></label></div><p id="fitStatus" role="status"></p><small>사진 외형은 같은 기기의 얼굴 판에서 읽습니다. 턱과 정수리 높이·중심을 맞춘 근사 정합입니다. 사진과 외형 선택은 조형 설정 파일에 들어가지 않습니다. 상체·하체·전신 자동 복원은 지원하지 않습니다.</small>';
  document.querySelector('.workspace').after(container);
  const overlay=document.createElement('canvas');overlay.id='fitLayer';overlay.setAttribute('aria-label','저장된 참고사진의 전경 겹침');
  const css=document.createElement('style');css.textContent='#fitLayer[hidden]{display:none!important}';container.append(css);
  Object.assign(overlay.style,{position:'absolute',inset:'0',width:'100%',height:'100%',margin:'0',pointerEvents:'none',imageRendering:'pixelated'});
  $('handles').before(overlay);
  const enabled=new Set(),showOverlay=new Set();
  let selected=null,shots=[],mesh=null,subject=null,error='',loading=false,rev=0,serial=0,db=null,geometry=new WeakMap(),masks=new WeakMap();
  function updateControls(){
    const face=subject==='F02'||subject==='M01',ready=face&&!!mesh&&!loading;
    $('fitShape').checked=enabled.has(subject);$('fitOverlay').checked=showOverlay.has(subject);
    for(const k of ['fitShape','fitShot','fitAlign','fitOverlay','fitAlpha'])$(k).disabled=!ready;
    $('fitAlphaOut').value=$('fitAlpha').value+'%';
    if(!ready)$('fitStatus').textContent=!face?'현재 모델은 몸통입니다. 얼굴 기본형에서 사진 판을 사용할 수 있습니다.':
      loading?'기기 보존함을 읽고 있습니다.':error||'사용할 얼굴 판이 없습니다. 다섯 방향 작업대에서 사진을 정렬하고 판을 저장하세요.';
    overlay.hidden=!ready||!showOverlay.has(subject);
  }
  async function refresh(){
    const token=++serial;loading=true;updateControls();
    try{
      db??=await database();
      const keys=(await request(db.transaction('versions').objectStore('versions').getAllKeys())).reverse();
      if(token!==serial)return;
      const preferred=selected||localStorage.getItem('bookfriend-face-fit36');
      selected=keys.includes(preferred)?preferred:keys[0]??null;
      $('fitVersion').replaceChildren(...keys.map((k,i)=>new Option('보존판 '+(keys.length-i)+' · '+new Date(Number(String(k).split('-')[0])).toLocaleString('ko-KR'),k)));
      if(selected){
        $('fitVersion').value=selected;
        const [entry,fit]=await Promise.all([request(db.transaction('versions').objectStore('versions').get(selected)),readApplied(selected)]);
        if(token!==serial)return;
        shots=entry.shots;mesh=fit;
      }else{shots=[];mesh=null;}
      const options=shots.flatMap((s,i)=>s?[new Option(names[i]+' · '+s.yaw+'°',i)]:[]);
      $('fitShot').replaceChildren(...options);error=selected&&!mesh?'복원에 필요한 방향이 부족한 판입니다.':'';
    }catch(e){if(token!==serial)return;mesh=null;shots=[];error='기기 보존함을 열 수 없습니다. '+e.message;}
    if(token!==serial)return;
    loading=false;geometry=new WeakMap();masks=new WeakMap();rev++;updateControls();redraw();
  }
  $('fitRefresh').onclick=refresh;
  $('fitVersion').onchange=()=>{selected=$('fitVersion').value;refresh();};
  $('fitShape').oninput=()=>{if($('fitShape').checked)enabled.add(subject);else enabled.delete(subject);rev++;redraw();};
  $('fitOverlay').oninput=()=>{if($('fitOverlay').checked)showOverlay.add(subject);else showOverlay.delete(subject);redraw();};
  $('fitAlign').onclick=()=>{const s=shots[+$('fitShot').value];if(s)changeView({yaw:s.yaw,pitch:0,angle:0});};
  $('fitShot').onchange=redraw;$('fitAlpha').oninput=()=>{updateControls();redraw();};
  if('BroadcastChannel' in window){const channel=new BroadcastChannel('bookfriend-photo-model36');channel.onmessage=e=>{if(e.data?.kind==='apply')selected=e.data.id;refresh();};}
  window.addEventListener('storage',e=>{if(e.key==='bookfriend-face-fit36'){selected=e.newValue;refresh();}});
  refresh();
  return {
    key(id){return id==='W'||!enabled.has(id)?'original':String(rev);},
    shape(base,id){
      if(id==='W'||!mesh||loading||!enabled.has(id))return base;
      if(!geometry.has(base))geometry.set(base,protectedFit(base,mesh));
      return geometry.get(base).scene;
    },
    draw(id,base,frame,scene,model,v){
      subject=id;updateControls();
      if(id==='W'||!mesh||loading)return;
      const shot=shots[+$('fitShot').value],yawDelta=shot?Math.abs((v.yaw-shot.yaw+540)%360-180):Infinity;
      const matched=yawDelta<.01&&Math.abs(v.pitch)<.01&&Math.abs(v.angle)<.01;
      overlay.hidden=!showOverlay.has(id)||!shot||!matched;
      const gain=geometry.get(base)?.gain??1;
      $('fitStatus').textContent=(enabled.has(id)?'오른쪽에 사진 외형 적용 · 면 접힘 제한 후 변위 '+(gain*100).toFixed(1)+'%. ':'오른쪽은 현재 조형값을 적용한 원형입니다. ')+
        (showOverlay.has(id)?(matched?'입력 사진과 같은 각도에서 앞쪽 전경을 겹칩니다.':'사진 겹침을 보려면 사진 시점 맞추기를 누르세요.'):'입력 사진 겹침은 꺼져 있습니다.');
      if(overlay.hidden)return;
      const camera=frame.projection?frame:renderPixels(model.settings,{sceneOverride:{...scene,parts:[]},portrait:'face',freeOrbit:true,yaw:v.yaw,pitch:v.pitch,cameraZoom:v.zoom*160/184,studyResolution:192});
      const scale=frame.width/camera.width,chin=base.landmarks.chin[1],height=base.height-chin,centerZ=base.faceCenter?.[2]??.25;
      const center=projectPoint(camera,[0,chin+height*.5,centerZ]).map(n=>n*scale);
      const ratio=height*camera.projection.scale*scale/shot.camera.scale;
      if(overlay.width!==frame.width||overlay.height!==frame.height){overlay.width=frame.width;overlay.height=frame.height;}
      const c=overlay.getContext('2d');c.clearRect(0,0,overlay.width,overlay.height);c.globalAlpha=Number($('fitAlpha').value)/100;c.imageSmoothingEnabled=false;
      if(!masks.has(shot))masks.set(shot,masked(shot));
      c.drawImage(masks.get(shot),center[0]-shot.camera.cx*ratio,center[1]-shot.camera.cy*ratio,SIZE*ratio,SIZE*ratio);
    }
  };
}
