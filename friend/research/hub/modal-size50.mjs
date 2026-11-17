export function mountLabSize(dialog,frame){
 const bar=dialog.querySelector('.dialogbar'),controls=document.createElement('div');controls.className='modal-size';controls.setAttribute('aria-label','연구실 창 크기');
 let expanded=false,previous={width:'',height:''};
 const send=()=>frame.contentWindow?.postMessage({type:'bookfriend:workbench-expanded',expanded},location.origin);
 const fill=document.createElement('button');fill.type='button';fill.textContent='화면 채우기';fill.setAttribute('aria-pressed','false');
 function setExpanded(on){if(on===expanded){send();return;}if(on){previous={width:dialog.style.width,height:dialog.style.height};dialog.style.width='100vw';dialog.style.height='100dvh';}else Object.assign(dialog.style,previous);expanded=on;dialog.classList.toggle('expanded',on);fill.textContent=on?'이전 크기':'화면 채우기';fill.setAttribute('aria-pressed',String(on));send();}
 fill.onclick=()=>setExpanded(!expanded);controls.append(fill);
 for(const [key,text]of [['width','너비'],['height','높이']]){const l=document.createElement('label');l.textContent=text;const input=document.createElement('input');input.type='range';input.min=35;input.max=100;input.value=key==='width'?98:96;input.setAttribute('aria-label','연구실 '+text);input.oninput=()=>{if(expanded)setExpanded(false);dialog.style[key]=input.value+(key==='width'?'vw':'dvh');};l.append(input);controls.append(l);}
 bar.append(controls);
 const handle=document.createElement('button');handle.type='button';handle.className='modal-resize';handle.textContent='◢';handle.setAttribute('aria-label','연구실 크기 드래그 또는 방향키');dialog.append(handle);
 let start;
 handle.onpointerdown=e=>{if(expanded)setExpanded(false);const r=dialog.getBoundingClientRect();start={x:e.clientX,y:e.clientY,w:r.width,h:r.height};handle.setPointerCapture(e.pointerId);e.preventDefault();};
 handle.onpointermove=e=>{if(!start)return;dialog.style.width=Math.min(innerWidth,Math.max(Math.min(360,innerWidth),start.w+(e.clientX-start.x)*2))+'px';dialog.style.height=Math.min(innerHeight,Math.max(240,start.h+(e.clientY-start.y)*2))+'px';};
 const stop=()=>start=null;handle.onpointerup=stop;handle.onpointercancel=stop;
 handle.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(expanded)setExpanded(false);const r=dialog.getBoundingClientRect(),step=e.shiftKey?50:10;if(e.key.startsWith('ArrowL')||e.key.startsWith('ArrowR'))dialog.style.width=Math.min(innerWidth,Math.max(Math.min(360,innerWidth),r.width+(e.key==='ArrowRight'?step:-step)))+'px';else dialog.style.height=Math.min(innerHeight,Math.max(240,r.height+(e.key==='ArrowDown'?step:-step)))+'px';};
 addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='bookfriend:workbench-fill')setExpanded(!expanded);});
 frame.addEventListener('load',send);return {setExpanded};
}
