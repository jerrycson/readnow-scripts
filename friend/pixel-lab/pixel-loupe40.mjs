// 렌더 카메라를 바꾸지 않고 두 캔버스의 같은 실제 화소를 정수 배 확대한다.
export function pixelLoupe40({before,after,host,labels=['39차','40차']}){
  let factor=8,patch=16,u=.5,v=.4,start=null;
  const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const title=node('h3','같은 화소 돋보기'),description=node('p','어느 모델의 눈이나 밑 경계를 짧게 누르면 두 판의 같은 위치를 잘라 봅니다. 이 확대는 모델 카메라와 렌더 해상도를 바꾸지 않습니다.'),controls=node('div'),figures=node('div'),status=node('p');
  controls.style.cssText='display:flex;flex-wrap:wrap;gap:7px;margin:10px 0';figures.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px';
  const canvases=labels.map(label=>{const f=node('figure'),caption=node('figcaption',label+' · 같은 화소'),c=node('canvas');f.style.cssText='margin:0;min-width:0;overflow:auto';c.style.cssText='display:block;image-rendering:pixelated;max-width:none;width:auto;height:auto;background:#eee';c.setAttribute('aria-label',label+' 실제 화소 확대');f.append(caption,c);figures.append(f);return c;});
  for(const n of [2,4,8]){const b=node('button',n+'배 화소');b.type='button';b.dataset.factor=n;b.setAttribute('aria-pressed',String(n===factor));b.onclick=()=>{factor=n;for(const child of controls.querySelectorAll('[data-factor]'))child.setAttribute('aria-pressed',String(+child.dataset.factor===n));refresh();};controls.append(b);}
  for(const n of [8,16,32]){const b=node('button',n+'px 구획');b.type='button';b.dataset.patch=n;b.setAttribute('aria-pressed',String(n===patch));b.onclick=()=>{patch=n;for(const child of controls.querySelectorAll('[data-patch]'))child.setAttribute('aria-pressed',String(+child.dataset.patch===n));refresh();};controls.append(b);}
  host.append(title,description,controls,figures,status);
  function refresh(){
    if(before.width!==after.width||before.height!==after.height){status.textContent='두 원본 프레임의 크기가 달라 같은 화소를 비교할 수 없습니다.';return;}
    const size=Math.min(patch,before.width,before.height),x=Math.max(0,Math.min(before.width-size,Math.round(u*before.width-size/2))),y=Math.max(0,Math.min(before.height-size,Math.round(v*before.height-size/2)));
    [before,after].forEach((source,i)=>{const target=canvases[i];target.width=target.height=size*factor;const g=target.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,target.width,target.height);g.drawImage(source,x,y,size,size,0,0,target.width,target.height);Object.assign(target.dataset,{sourceX:x,sourceY:y,sourceSize:size,factor});});
    status.textContent='원본 '+before.width+'×'+before.height+'px · 시작 ('+x+', '+y+') · '+size+'×'+size+'개 화소를 '+factor+'배. 두 판의 범위와 확대 배율이 같습니다.';
  }
  for(const c of [before,after]){c.addEventListener('pointerdown',e=>{if(e.button===0)start={id:e.pointerId,x:e.clientX,y:e.clientY,c};});c.addEventListener('pointerup',e=>{if(start?.c!==c||start.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-start.x,e.clientY-start.y);start=null;if(moved>4)return;const b=c.getBoundingClientRect();u=(e.clientX-b.left)/b.width;v=(e.clientY-b.top)/b.height;refresh();});}
  return {refresh,select:(x,y)=>{u=x;v=y;refresh();},canvases};
}
