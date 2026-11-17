const ns='http://www.w3.org/2000/svg';
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
function svg(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
function button(text,act){const n=node('button',text);n.type='button';n.onclick=act;return n;}
function group(label){const g=node('fieldset');g.append(node('legend',label));return g;}
export function showFaceEvidence49(host,id,rows,reproduce){
  const params=new URL(location.href).searchParams,asked=params.get('sample')||params.get('cell');
  let row=rows.find(v=>v.key===asked)||rows.find(v=>v.key===(id==='F02'?'2-2':'설정2'))||rows[0],choice;
  if(!row)return;
  const box=node('details'),summary=node('summary','원화에 실제 표정 표식 겹쳐 보기'),layout=node('div'),sources=group('참고 장면'),trials=group('실험 조건'),switches=group('겹쳐 볼 내용');
  const paper=svg('svg',{role:'img','aria-label':'원화 표식과 47차 중립·49차 표정 표식'}),tools=node('div'),caption=node('p'),limits=node('p'),credit=node('a','공식 원화 출처');
  credit.target='_blank';credit.rel='noopener';box.id='faceEvidence49';layout.className='motion49-evidence';paper.setAttribute('viewBox','0 0 248 248');
  const visible={원화:true,'손 표식':true,'중립 표식':true,'선택 표식':true,'원화 개구 폭':true,'표식 확대':true};
  for(const title of Object.keys(visible)){
    const l=node('label'),i=node('input');i.type='checkbox';i.checked=true;i.onchange=()=>{visible[title]=i.checked;draw();};l.append(i,document.createTextNode(' '+title));switches.append(l);
  }
  const sourceButtons=rows.map(r=>button(r.key,()=>{row=r;populate();save();}));sources.append(...sourceButtons);
  function save(){const u=new URL(location.href);u.searchParams.set('sample',row.key);u.searchParams.set('trial',choice.key);history.replaceState(null,'',u);}
  function draw(){
    const [x,y,w,h]=row.crop,[iw,ih]=row.size;paper.replaceChildren();
    if(visible.원화){
      const image=svg('image',{x:-248*x/w,y:-248*y/h,width:iw*248/w,height:ih*248/h,href:row.source,preserveAspectRatio:'none'});
      image.addEventListener('error',()=>{if(image.isConnected)limits.textContent+=' 이 브라우저에서 원본을 불러오지 못했습니다. 공식 출처 링크에서 확인해 주세요.';});paper.append(image);
    }
    const points=[];
    const base=row.examples.find(e=>e.input.corner===0&&e.input.opening===0&&e.input.lidSteps===0)||row.examples[0];
    for(const [label,data,color,dash] of [['손 표식',row.sourcePoints,'#096761',''],['중립 표식',base.points,'#62409a','3 2'],['선택 표식',choice.points,'#b64318','1.3 1']]){
      const pts=(data||[]).filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));points.push(...pts);
      if(!visible[label]||!pts.length)continue;const g=svg('g',{stroke:color,fill:'none','data-layer49':label});
      if(pts.length===3)g.append(svg('polyline',{points:pts.map(p=>p.join(',')).join(' '),'stroke-width':.95,'stroke-dasharray':dash}));
      for(const [cx,cy] of pts)g.append(svg('circle',{cx,cy,r:label==='손 표식'?1.65:.9,'stroke-width':.75}));paper.append(g);
    }
    if(visible['원화 개구 폭']&&row.sourceOpening?.length===2){
      const [a,b]=row.sourceOpening;
      paper.append(svg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#166ca6','stroke-width':1.1}));points.push(a,b);
    }
    let crop=[0,0,248,248];if(visible['표식 확대']&&points.length){
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
      const n=Math.min(248,Math.max(30,x1-x0+18,y1-y0+18)),clamp=v=>Math.max(0,Math.min(248-n,v));crop=[clamp((x0+x1-n)/2),clamp((y0+y1-n)/2),n,n];
    }
    paper.setAttribute('viewBox',crop.join(' '));
    caption.textContent=choice.label+' · 세 표식의 평균 거리 '+(Number.isFinite(choice.mean)?choice.mean.toFixed(2)+'px':'측정 불가')+(Number.isFinite(choice.visibleGap)?' · 모델의 열린 간격 '+choice.visibleGap.toFixed(2)+'px':'')+' · 좌우 '+row.camera.yaw.toFixed(1)+'° · 상하 '+row.camera.pitch.toFixed(1)+'°';
    limits.textContent=row.limits+' 원화에는 기울기와 크기 정합까지 적용했고, 회전창에는 좌우·상하 촬영 방향을 맞춥니다.';credit.href=row.sourcePage;
  }
  function populate(initial){
    choice=row.examples.find(e=>e.key===initial)||row.examples.find(e=>e.key===row.preferred)||row.examples[0];
    sources.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(rows[i]===row)));
    for(const b of trials.querySelectorAll('button'))b.remove();
    const bs=row.examples.map(e=>button(e.label,()=>{choice=e;bs.forEach((b,i)=>b.setAttribute('aria-pressed',String(row.examples[i]===e)));save();draw();}));
    bs.forEach((b,i)=>b.setAttribute('aria-pressed',String(row.examples[i]===choice)));trials.append(...bs);draw();
  }
  tools.append(sources,trials,switches,button('이 조건으로 모델 재현',()=>reproduce(row,choice)),caption,limits,credit);
  layout.append(paper,tools);box.append(summary,layout);host.append(box);populate(params.get('trial'));box.open=!!asked&&rows.some(v=>v.key===asked);
}
