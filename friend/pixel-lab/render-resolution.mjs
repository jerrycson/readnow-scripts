const sizes=[48,96,192,256,512];
export function resolutionControl(host,onChange){
  let selected=null;
  const field=document.createElement('fieldset'),legend=document.createElement('legend'),buttons=document.createElement('div'),output=document.createElement('output');
  legend.textContent='관찰창 원본 해상도';field.style.cssText='border:1px solid #b9c6bc;border-radius:6px;padding:8px 10px;margin:10px 0;min-width:0';buttons.style.cssText='display:flex;flex-wrap:wrap;gap:6px';output.style.cssText='display:block;font-size:13px;margin-top:6px';output.setAttribute('aria-live','polite');
  const controls=sizes.map(size=>{const b=document.createElement('button');b.type='button';b.textContent=size+'px';b.dataset.resolution=size;b.setAttribute('aria-label',size+'픽셀 해상도');b.onclick=()=>{selected=size;sync(size);onChange();};buttons.append(b);return b;});
  field.append(legend,buttons,output);host.append(field);
  function sync(defaultSize){const size=selected??defaultSize;for(const b of controls)b.setAttribute('aria-pressed',String(+b.dataset.resolution===size));output.value=size+' × '+size+'px · '+(selected===null?'기존 기본값':'선택한 해상도')+' · 회전 중에도 유지';return size;}
  return {value:defaultSize=>selected??defaultSize,sync};
}
export function portraitAtResolution(render,settings,options,size){
  return render({...settings,resolution:size<=96?size:(settings.resolution??96)},{...options,studyResolution:size>96?size:undefined});
}
