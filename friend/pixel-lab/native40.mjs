// 실제 해상도로 각각 그려 보존한 시료. 축소판을 다시 확대해 구한 값과 구분한다.
const el=(tag,text)=>{const item=document.createElement(tag);if(text!==undefined)item.textContent=text;return item;};
function choices(label,options,selected,update){
  const field=el('fieldset');field.append(el('legend',label));
  const buttons=options.map(([value,title])=>{
    const button=el('button',title);button.type='button';button.setAttribute('aria-pressed',String(selected===value));
    button.onclick=()=>{for(const [key,b] of buttons)b.setAttribute('aria-pressed',String(key===value));update(value);};
    field.append(button);return [value,button];
  });return field;
}
const angles=['정면','왼쪽 45°','오른쪽 45°','왼쪽 옆','오른쪽 옆','뒤쪽 위','앞쪽 아래'];
const formats=[[48,'48px'],[96,'96px']],people=[['F02','페른'],['M01','힘멜']];
export async function nativeFaces40(host){
  const response=await fetch('native40.json');if(!response.ok)throw Error('실제 크기 시료를 불러오지 못했습니다.');
  const report=await response.json();
  let id='F02',size=48,index=1,magnify=1,token=0;
  const controls=el('div'),figures=el('div'),status=el('p');
  controls.className='native-options';figures.className='native-pair';status.setAttribute('aria-live','polite');
  const slots=['39차','40차 시안'].map(label=>{const figure=el('figure'),canvas=el('canvas');figure.append(el('figcaption',label),canvas);figures.append(figure);return canvas;});
  const cached=new Map();
  async function redraw(){
    const job=++token,source='native40-'+id+'-'+size+'.png';
    if(!cached.has(source)){
      const im=new Image();im.src=source;cached.set(source,im.decode().then(()=>im).catch(error=>{cached.delete(source);throw error;}));
    }
    const im=await cached.get(source);if(job!==token)return;
    if(im.naturalWidth!==size*angles.length||im.naturalHeight!==size*2)throw Error('시료 크기를 다시 확인해야 합니다.');
    const row=report.subjects[id][size][index],name=people.find(([key])=>key===id)[1];
    slots.forEach((canvas,j)=>{canvas.width=canvas.height=size;canvas.style.width=canvas.style.height=size*magnify+'px';
      const ctx=canvas.getContext('2d');ctx.drawImage(im,index*size,j*size,size,size,0,0,size,size);
      canvas.setAttribute('aria-label',name+' '+angles[index]+' '+(j?'40':'39')+'차 '+size+'픽셀');
    });
    status.textContent='왼쪽·오른쪽 눈 도형이 화면에서 차지한 픽셀 수(모형 X축 순서) · 39차 '+row.prior.eyePixels.join(' / ')+' · 40차 '+row.next.eyePixels.join(' / ');
    host.dataset.ready='true';
  }
  const render=()=>redraw().catch(e=>{status.textContent=e.message;host.dataset.ready='false';});
  controls.append(choices('인물',people,id,v=>{id=v;render();}),choices('원본 해상도',formats,size,v=>{size=v;render();}),
    choices('시점',angles.map((t,i)=>[i,t]),index,v=>{index=v;render();}),
    choices('표시 배율',[[1,'실제 크기'],[3,'픽셀 3배']],magnify,v=>{magnify=v;render();}));
  host.replaceChildren(controls,figures,status);await redraw();
}
