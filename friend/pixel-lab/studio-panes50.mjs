export function mountStudioPanes({host,tools,urlFor,onNotice=()=>{}}){
 const toolbar=document.createElement('div');toolbar.className='pane-tools';toolbar.setAttribute('aria-label','바깥 작업창 배치');
 const label=document.createElement('strong');label.textContent='바깥 작업창';toolbar.append(label);
 const grid=document.createElement('div');grid.className='pane-grid';host.append(toolbar,grid);
 let count=1,solo=-1,primaryTool;const panes=[],buttons=new Map();
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b;};
 const layout=()=>{grid.dataset.count=String(count);grid.dataset.solo=String(solo);panes.forEach((p,i)=>{p.box.hidden=solo>=0?i!==solo:i>=count;p.expand.textContent=solo===i?'분할로 복귀':'이 창만 크게';for(const f of p.frames.values())f.contentWindow?.postMessage({type:'bookfriend:studio-active',active:!p.box.hidden&&!f.hidden},location.origin);});for(const [n,b]of buttons)b.setAttribute('aria-pressed',String(count===n&&solo<0));};
 for(const n of [1,2,4]){const b=button(n+'창',()=>{count=n;solo=-1;for(let i=1;i<n;i++)if(!panes[i].current)load(i,primaryTool||tools[0]);layout();});buttons.set(n,b);toolbar.append(b);}
 const size=document.createElement('span');size.className='pane-size';
 for(const [key,text,initial]of [['width','좌우 경계',50],['height','위아래 경계',50]]){const l=document.createElement('label');l.textContent=text+' ';const input=document.createElement('input');input.type='range';input.min=20;input.max=80;input.value=initial;input.setAttribute('aria-label',text);input.oninput=()=>grid.style.setProperty('--pane-'+key,input.value+'%');l.append(input);size.append(l);}
 toolbar.append(size);
 function fillState(expanded){for(const p of panes)for(const f of p.frames.values())f.contentWindow?.postMessage({type:'bookfriend:workbench-expanded',expanded},location.origin);}
 const fill=button('작업 화면 채우기',()=>{if(parent!==self)parent.postMessage({type:'bookfriend:workbench-fill'},location.origin);else{const expanded=!document.body.classList.contains('workspace-fill');document.body.classList.toggle('workspace-fill',expanded);fillState(expanded);fill.setAttribute('aria-pressed',String(expanded));}});toolbar.append(fill);
 for(let i=0;i<4;i++){
  const box=document.createElement('section');box.className='studio-pane';box.dataset.pane=String(i);
  const bar=document.createElement('div');bar.className='pane-heading';const title=document.createElement('strong');title.textContent=i?'보조 '+i:'원창';bar.append(title);
  const select=document.createElement('select');select.setAttribute('aria-label',i?'보조 '+i+' 도구':'원창 도구');
  for(const tool of tools){const o=document.createElement('option');o.value=tool.id;o.textContent=tool.label;select.append(o);}
  if(i){select.onchange=()=>load(i,tools.find(t=>t.id===select.value));bar.append(select);bar.append(button('원창 파일 함께 쓰기',()=>copyFiles(i)));}
  const expand=button('이 창만 크게',()=>{solo=solo===i?-1:i;layout();});bar.append(expand);
  const content=document.createElement('div');content.className='pane-content';box.append(bar,content);grid.append(box);
  panes.push({box,content,select,expand,frames:new Map(),current:null});
 }
 function load(index,tool){if(!tool)return;const p=panes[index];let f=p.frames.get(tool.id);if(!f){f=document.createElement('iframe');f.title='보조 '+index+' · '+tool.label;f.src=urlFor(tool);p.frames.set(tool.id,f);p.content.append(f);f.onload=()=>layout();}p.current=tool;p.select.value=tool.id;for(const [id,other]of p.frames)other.hidden=id!==tool.id;layout();}
 async function copyFiles(index){
  const source=[...panes[0].content.querySelectorAll('iframe')].find(f=>!f.hidden),p=panes[index],target=p.frames.get(p.current?.id);
  if(!source||!target||p.current?.id!==primaryTool?.id)return onNotice('원창과 보조창에서 같은 도구를 먼저 고르세요.');
  try{const calibration=source.contentDocument.getElementById('calibration'),otherCalibration=target.contentDocument.getElementById('calibration');if(calibration&&otherCalibration)otherCalibration.value=calibration.value;let copied=0;for(const input of source.contentDocument.querySelectorAll('input[type=file]')){if(!input.files?.length)continue;const twin=input.id?target.contentDocument.getElementById(input.id):null;if(!twin||twin.type!=='file')continue;const group=source.contentDocument.getElementById(input.id+'Group'),otherGroup=target.contentDocument.getElementById(input.id+'Group');if(group&&otherGroup)otherGroup.value=group.value;const transfer=new target.contentWindow.DataTransfer();for(const file of input.files)transfer.items.add(file);twin.files=transfer.files;twin.dispatchEvent(new target.contentWindow.Event('change',{bubbles:true}));copied+=input.files.length;}onNotice(copied?copied+'개 원창 파일을 이 기기 보조창에서 함께 열었습니다.':'원창에서 직접 고른 파일이 없습니다. 예제·편집 상태는 각 도구에서 따로 고르세요.');}catch{onNotice('이 도구는 파일 전달을 지원하지 않습니다. 원창 입력은 그대로 보존됩니다.');}
 }
 let dragging;
 grid.addEventListener('pointerdown',e=>{if(e.target!==grid||count===1||solo>=0)return;const r=grid.getBoundingClientRect();dragging=Math.abs(e.clientX-panes[0].box.getBoundingClientRect().right)<18?'width':'height';grid.setPointerCapture(e.pointerId);});
 grid.addEventListener('pointermove',e=>{if(!dragging)return;const r=grid.getBoundingClientRect(),value=dragging==='width'?(e.clientX-r.left)/r.width*100:(e.clientY-r.top)/r.height*100;grid.style.setProperty('--pane-'+dragging,Math.max(20,Math.min(80,value))+'%');});
 const stop=()=>dragging=null;grid.addEventListener('pointerup',stop);grid.addEventListener('pointercancel',stop);
 addEventListener('message',e=>{if(e.origin!==location.origin)return;const owned=panes.some(p=>!p.box.hidden&&[...p.frames.values()].some(f=>!f.hidden&&f.contentWindow===e.source));if(owned&&e.data?.type==='bookfriend:workbench-fill')fill.click();if(e.source===parent&&e.data?.type==='bookfriend:workbench-expanded'){document.body.classList.toggle('workspace-fill',!!e.data.expanded);fill.textContent=e.data.expanded?'이전 작업 크기':'작업 화면 채우기';fill.setAttribute('aria-pressed',String(e.data.expanded));fillState(!!e.data.expanded);}});
 layout();return {main:panes[0].content,isMainVisible:()=>!panes[0].box.hidden,setPrimary(tool,frame){primaryTool=tool;panes[0].current=tool;panes[0].frames.set(tool.id,frame);layout();}};
}
