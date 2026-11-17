const element=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const people={F02:'페른',M01:'힘멜'},views=['정면','왼쪽 45°','오른쪽 45°','왼쪽 옆','오른쪽 옆','뒤쪽 위','앞쪽 아래','뒷모습'];
function buttons(name,options,start,select){
 const group=element('fieldset');group.append(element('legend',name));
 const entries=options.map(([id,title])=>{
   const b=element('button',title);b.type='button';b.setAttribute('aria-pressed',String(id===start));group.append(b);
   b.onclick=()=>{entries.forEach(([i,btn])=>btn.setAttribute('aria-pressed',String(i===id)));select(id);};return [id,b];
 });return group;
}
export async function openIrises(host){
 const raw=await fetch('iris-eval41.json');if(!raw.ok)throw Error('색 비교 시료를 읽지 못했습니다.');const info=await raw.json();
 let id='F02',size=48,view=1,zoom=1,seq=0;const memo=new Map();
 const controls=element('div'),samples=element('div'),label=element('p');controls.className='native-options';samples.className='native-pair';label.setAttribute('aria-live','polite');
 const canvases=['기존 색','홍채 단색','위·아래 색과 반사광'].map(t=>{const fig=element('figure'),c=element('canvas');fig.style.maxWidth='100%';fig.style.overflowX='auto';fig.append(element('figcaption',t),c);samples.append(fig);return c;});
 async function draw(){const serial=++seq,file='iris41-'+id+'-'+size+'.png';
   if(!memo.has(file)){const im=new Image();im.src=file;memo.set(file,im.decode().then(()=>im).catch(error=>{memo.delete(file);throw error;}));}
   const image=await memo.get(file);if(serial!==seq)return;
   if(image.naturalWidth!==8*size||image.naturalHeight!==3*size)throw Error('시료의 실제 규격을 확인해야 합니다.');
   canvases.forEach((c,row)=>{c.width=c.height=size;c.style.width=c.style.height=size*zoom+'px';c.style.maxWidth='none';c.setAttribute('aria-label',people[id]+' '+views[view]+' '+size+'픽셀 '+row+'번 시안');
     c.getContext('2d').drawImage(image,size*view,size*row,size,size,0,0,size,size);});
   const [t,b]=info.pixels[id][size][view];label.textContent='기존 색과 비교해 채널 값이 8 이상 달라진 픽셀 · 단색 '+t.count+'개, 색층과 반사광 '+b.count+'개';host.dataset.ready='true';}
 const changed=()=>draw().catch(e=>{host.dataset.ready='false';label.textContent=e.message;});
 controls.append(buttons('인물',Object.entries(people),id,v=>{id=v;changed();}),buttons('원본 해상도',[48,96,192].map(n=>[n,n+'px']),size,v=>{size=v;changed();}),buttons('시점',views.map((t,i)=>[i,t]),view,v=>{view=v;changed();}),buttons('표시 배율',[[1,'실제 크기'],[3,'픽셀 3배']],zoom,v=>{zoom=v;changed();}));
 host.replaceChildren(controls,samples,label);await draw();
}
