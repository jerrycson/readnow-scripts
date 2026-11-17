// 폼의 기존 값과 change 동작을 유지하면서 짧은 선택지를 바로 펼쳐 둔다.
export function exposeChoices(root=document) {
 const controls=new Map();let scheduled=false;
 function paint(){scheduled=false;for(const s of root.querySelectorAll('select')){
  const opts=Array.from(s.options);let state=controls.get(s);
  if(!state){const title=s.getAttribute('aria-label')||s.labels?.[0]?.firstChild?.textContent?.trim()||'선택';const box=document.createElement('span');box.className='studio-choice-buttons';box.setAttribute('role','group');box.setAttribute('aria-label',title);
   const holder=s.closest('label');(holder||s).after(box);s.hidden=true;s.tabIndex=-1;state={box,sig:null};controls.set(s,state);}
  const sig=JSON.stringify(opts.map(op=>[op.value,op.text,op.disabled]));
  if(sig!==state.sig){state.sig=sig;state.box.replaceChildren();for(const op of opts){const b=document.createElement('button');b.type='button';b.textContent=op.text;b.dataset.choice=op.value;b.onclick=()=>{s.value=op.value;s.dispatchEvent(new Event('change',{bubbles:true}));schedule();};state.box.append(b);}}
  for(const [i,b] of Array.from(state.box.children).entries()){b.setAttribute('aria-pressed',String(s.value===b.dataset.choice));b.disabled=s.disabled||opts[i]?.disabled;}
 }}
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(paint);}}
 const ob=new MutationObserver(recs=>{if(recs.some(r=>r.target.nodeName==='SELECT'||Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('select')||n.querySelector?.('select')))))schedule();});
 ob.observe(root.documentElement||root,{childList:true,subtree:true});root.addEventListener('click',schedule);root.addEventListener('change',schedule);paint();
}
const style=document.createElement('style');style.textContent='.studio-choice-buttons{display:inline-flex;flex-wrap:wrap;gap:4px;max-height:10rem;overflow:auto;align-items:center}.studio-choice-buttons button{min-height:30px;padding:3px 8px;font:inherit}.studio-choice-buttons button[aria-pressed=true]{background:#205441;color:white}.studio-choice-buttons:empty{display:none}select[hidden]{display:none!important}';document.head.append(style);exposeChoices();