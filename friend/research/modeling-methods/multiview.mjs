import {compareDrawingPixels} from '../../pixel-lab/drawing-review.mjs';

const cameras=[
  ['정면',0,0],['왼 45°',-45,0],['오른 45°',45,0],['왼 측면',-90,0],['오른 측면',90,0],
  ['왼 뒤 45°',-135,0],['뒤',180,0],['오른 뒤 45°',135,0],['위에서',0,30],['아래에서',0,-30]
];
const extraCameras=[...[-30,30].flatMap(p=>[-135,-90,-45,45,90,135,180].map(y=>[(p>0?'위 ':'아래 ')+y+'°',y,p])),['정수리',0,90],['바로 아래',0,-90]];
const element=(tag,text)=>Object.assign(document.createElement(tag),text?{textContent:text}:{});
export function mountMultiview(host,{render,openAngle}) {
  const css=new URL('multiview.css',import.meta.url).href;
  if(!document.querySelector('link[href="'+css+'"]'))document.head.append(Object.assign(element('link'),{rel:'stylesheet',href:css}));
  const heading=element('h3','모든 방향을 함께 보기'),key=element('p','각 칸의 왼쪽은 비교 기준, 오른쪽은 편집 중인 모델입니다. 같은 조명·배율의 실제 48픽셀입니다.');
  const actions=element('div'),more=element('button'),status=element('span'),grid=element('div');
  host.replaceChildren(heading,key,actions,grid);host.classList.add('multiview');actions.append(more,status);
  grid.className='views-grid';status.setAttribute('role','status');more.type='button';
  let scene,pending,rendering=false,extended=false,layoutVersion=0,displayedKey,visibleId,cells=[];
  const frames=new WeakMap();
  function build(){
    layoutVersion++;grid.replaceChildren();displayedKey=null;
    more.textContent=extended?'기본 10방향':'세부 26방향';more.setAttribute('aria-pressed',String(extended));
    cells=(extended?[...cameras,...extraCameras]:cameras).map(([label,yaw,pitch])=>{
      const pick=element('button'),caption=element('span',label);pick.type='button';pick.dataset.yaw=yaw;pick.dataset.pitch=pitch;
      pick.title=label+' 방향을 크게 보기';pick.onclick=()=>openAngle({yaw,pitch});
      const pair=[0,1].map(i=>{const c=element('canvas');c.width=c.height=48;c.setAttribute('aria-label',label+(i?' 교정':' 기준'));return c;});
      const difference=element('small');
      pick.append(caption,...pair,difference);grid.append(pick);return {yaw,pitch,pair,difference};
    });
  }
  const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  async function flush(){
    if(rendering)return;rendering=true;
    try{
      while(pending){
        const packet=pending;pending=null;
        const {model,left,right,view}=packet;
        const version=layoutVersion,rows=cells.slice(),ready=[];
        status.textContent='동일한 형상으로 모든 방향 갱신 중';grid.setAttribute('aria-busy','true');
        for(let i=0;i<rows.length;i++){
          if(version!==layoutVersion||visibleId!==model.id)break;
          const {yaw,pitch}=rows[i],name=yaw+'/'+pitch;
          ready.push([left,right].map(s=>{
            let saved=frames.get(s);if(!saved){saved=new Map();frames.set(s,saved);}
            if(!saved.has(name)){const result=render(model,s,{...view,yaw,pitch,size:48,zoom:1});saved.set(name,new ImageData(new Uint8ClampedArray(result.data),48,48));}
            return saved.get(name);
          }));
          if(i%3===2)await tick();
        }
        if(pending || version!==layoutVersion||visibleId!==model.id||ready.length!==rows.length)continue;
        rows.forEach((row,i)=>{
          const diff=compareDrawingPixels(...ready[i]);
          row.pair.forEach((c,j)=>c.getContext('2d').putImageData(ready[i][j],0,0));
          row.difference.textContent='다른 화소 '+diff.changed+' · 외곽 '+diff.silhouette;
          row.difference.title='40차 기준과 편집 그림의 48px 차이입니다. 원화와의 유사도는 별도로 확인합니다.';
        });
        displayedKey=packet;grid.dataset.subject=model.id;grid.dataset.generation=String((+grid.dataset.generation||0)+1);
        grid.setAttribute('aria-busy','false');status.textContent=rows.length+'방향 갱신됨';
      }
    }catch(e){grid.setAttribute('aria-busy','false');status.textContent='다시 그리기 실패 · '+e.message;console.error(e);}
    finally{rendering=false;}
  }
  function update(model,left,right,view){
    if(visibleId!==model.id){visibleId=model.id;build();}
    if(scene&&scene.left===left&&scene.right===right&&scene.version===layoutVersion&&(displayedKey||rendering))return;
    scene={model,left,right,view,version:layoutVersion};pending=scene;void flush();
  }
  more.onclick=()=>{extended=!extended;build();if(scene)update(scene.model,scene.left,scene.right,scene.view);};
  build();return {update};
}
