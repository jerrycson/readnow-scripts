const directions=[0,45,90,135,180,-135,-90,-45];
export function appendOrbit48(host,id,record,view){
  const root=document.createElement('details'),heading=document.createElement('summary');
  heading.textContent='48픽셀 회전표 · 원하는 각도로 이동';root.append(heading);
  const note=document.createElement('p');
  note.textContent='가로는 좌우, 세로는 상하 회전입니다. 각 축은 0°부터 45° 간격으로 한 바퀴입니다. '+(id==='W'?'양팔 90° 자세를 고정했습니다.':'중립 얼굴입니다.')+' 칸을 누르면 두 모델이 함께 이동합니다.';
  const buttons=document.createElement('div'),grid=document.createElement('div'),readout=document.createElement('output');
  grid.className='orbit48-sheet';grid.setAttribute('role','group');grid.setAttribute('aria-label','좌우·상하 45도 간격 64구도');
  const modes=['47차','48차','변화한 화소'],choice=document.createDocumentFragment();
  let active=0;
  const modeButtons=modes.map((label,index)=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(index===1));
    b.onclick=()=>{modeButtons.forEach((x,i)=>x.setAttribute('aria-pressed',String(index===i)));grid.style.backgroundPosition='center '+(index*50)+'%';};
    buttons.append(b);return b;
  });
  function describe(i){
    active=i;const row=record.rows[i];
    [...grid.children].forEach((e,j)=>{e.setAttribute('aria-pressed',String(j===i));e.tabIndex=j===i?0:-1;});
    readout.textContent='좌우 '+row.yaw+'° · 상하 '+row.pitch+'° · 색·투명도 8단계 이상 달라진 화소 '+row.changed+'개 · 외곽 점유가 달라진 화소 '+row.shape+'개';
  }
  for(const [i,row] of record.rows.entries()){
    const b=document.createElement('button');b.type='button';b.title='좌우 '+row.yaw+'°, 상하 '+row.pitch+'°';b.setAttribute('aria-label',b.title);
    b.onclick=()=>{describe(i);view({yaw:row.yaw,pitch:row.pitch,zoom:1,size:48,...(id==='W'?{pivot:'arms.raise',angle:90}:{angle:0})});};
    b.onkeydown=e=>{
      const key={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!key)return;
      e.preventDefault();const next=((Math.floor(i/8)+key[1]+8)%8)*8+(i%8+key[0]+8)%8;
      grid.children[next].focus();grid.children[next].click();
    };choice.append(b);
  }
  grid.append(choice);describe(active);
  const axis=document.createElement('p');axis.className='inspect48-note';axis.textContent='왼쪽부터, 위에서부터 '+directions.map(a=>a+'°').join(' · ');
  root.append(note,buttons,axis,grid,readout);host.append(root);
  root.addEventListener('toggle',()=>{if(root.open&&!grid.style.backgroundImage)grid.style.backgroundImage='url("'+record.file+'")';});
}
