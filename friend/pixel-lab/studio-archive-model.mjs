export function historicalModel(item){
 const box=document.createElement('div'),c=document.createElement('canvas'),toolbar=document.createElement('div'),status=document.createElement('small');box.className='archived-model';box.append(c,toolbar,status);c.tabIndex=0;c.setAttribute('aria-label','보존 모델. 방향키 또는 드래그로 45도씩 회전');let yaw=0,pitch=0,draw,down,patch={};
 box.addEventListener('bookfriend:camera',e=>{const v=e.detail;yaw=v.yaw;pitch=v.pitch;patch={...patch,...v.settings};draw?.();});
 function turn(x,y){yaw=(yaw+x+360)%360;pitch=(pitch+y+360)%360;draw?.();}
 for(const [name,x,y] of [['←',-45,0],['→',45,0],['↑',0,-45],['↓',0,45]]){const b=document.createElement('button');b.textContent=name;b.setAttribute('aria-label',name+' 45도 회전');b.onclick=()=>turn(x,y);toolbar.append(b);}
 c.onkeydown=e=>{const a={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]}[e.key];if(a){e.preventDefault();turn(...a);}};
 c.onpointerdown=e=>{down=[e.clientX,e.clientY];c.setPointerCapture(e.pointerId);};c.onpointercancel=()=>{down=null;};
 c.onpointermove=e=>{if(!down)return;const x=Math.trunc((e.clientX-down[0])/22),y=Math.trunc((e.clientY-down[1])/22);if(x||y){turn(x*45,y*45);down=[down[0]+x*22,down[1]+y*22];}};c.onpointerup=()=>{down=null;};
 const ready=item.frozenRound?import('./studio-frozen.mjs').then(async loader=>{const model=await loader.loadFrozen(item.frozenRound,{mode:item.frozenMode});return [model,{DEFAULTS:model.defaults}];}):Promise.all([import('./'+item.module),import('./'+(item.defaultModule||'model.mjs'))]);
 ready.then(([engine,defaults])=>{
 const settings={...defaults[item.defaultExport||'DEFAULTS'],...item.settings};
 draw=()=>{try{const r=engine[item.renderExport||'renderPixels']({...settings,...patch},{yaw,pitch});c.width=r.width||patch.resolution||settings.resolution;c.height=r.height||c.width;
 c.getContext('2d').putImageData(new ImageData(r.data,c.width,c.height),0,0);status.textContent=yaw+'° / '+pitch+'° · '+c.width+'px · '+item.scope;}catch{status.textContent='이 모듈의 보존 설정으로 렌더하지 못했습니다.';}};draw();
 }).catch(()=>{status.textContent='보존 모듈을 불러오지 못했습니다.';});return box;
}