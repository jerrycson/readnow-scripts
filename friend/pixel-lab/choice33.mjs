// Keep the native value as the data contract. Every available action is visible.
export function choices(select,host,format=opt=>opt.textContent){
  function refresh(){
    const nodes=[...select.options].map(opt=>{
      const b=document.createElement('button');b.type='button';b.textContent=format(opt);
      b.dataset.value=opt.value;b.disabled=opt.disabled||select.disabled;
      b.setAttribute('aria-pressed',String(opt.value===select.value));
      b.onclick=()=>{select.value=opt.value;select.dispatchEvent(new Event('change',{bubbles:true}));refresh();};
      return b;
    });
    const focus=host.contains(document.activeElement)?document.activeElement.dataset.value:undefined;
    host.replaceChildren(...nodes);
    if(focus!==undefined)[...host.children].find(b=>b.dataset.value===focus)?.focus({preventScroll:true});
  }
  select.hidden=true;host.classList.add('choices');host.setAttribute('role','group');
  select.addEventListener('change',refresh);new MutationObserver(refresh).observe(select,{childList:true,attributes:true,subtree:true});
  refresh();return refresh;
}
