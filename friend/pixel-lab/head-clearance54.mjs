import {lerp} from './geometry.mjs';

const cached=new WeakMap();
const hand=new Set(['elbow','palm','finger','thumb','mitten','forearm']);
function prepare(scene){
  if(cached.has(scene))return cached.get(scene);
  const head=scene.parts.find(m=>m.name==='head');
  if(!head){cached.set(scene,null);return null;}
  // 높이 단면의 좌우·앞뒤 범위. 팔의 해석적 도달 후보끼리 두상 침투를 비교한다.
  const byY=new Map();
  for(const {p:[x,y,z]} of head.vertices){
    const key=Math.round(y*1e5);
    const row=byY.get(key)||{y,left:x,right:x,front:z,back:z};
    row.left=Math.min(row.left,x);row.right=Math.max(row.right,x);
    row.front=Math.max(row.front,z);row.back=Math.min(row.back,z);byY.set(key,row);
  }
  const rows=[...byY.values()].sort((a,b)=>a.y-b.y);
  const test=p=>{
    if(p[1]<=rows[0].y||p[1]>=rows.at(-1).y)return 0;
    let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid].y<p[1])lo=mid;else hi=mid;}
    const a=rows[lo],b=rows[hi],t=(p[1]-a.y)/(b.y-a.y);
    const v=k=>a[k]+(b[k]-a[k])*t,l=v('left'),r=v('right'),f=v('front'),z=v('back');
    const w=(r-l)/2,d=(f-z)/2;
    if(w<1e-5||d<1e-5)return 0;
    return Math.max(0,1-Math.hypot((p[0]-(l+r)/2)/w,(p[2]-(f+z)/2)/d))*Math.min(w,d);
  };
  const marks={right:[],left:[]};
  for(const m of scene.parts){
    if(!hand.has(m.name))continue;
    const side=m.vertices[0].p[0]<0?'left':'right';
    const step=Math.max(1,Math.floor(m.vertices.length/24));
    for(let i=0;i<m.vertices.length;i+=step)marks[side].push(m.vertices[i].p);
  }
  const out={test,marks};cached.set(scene,out);return out;
}
export function headClearance54(scene,side,frame){
  const model=prepare(scene);if(!model)return {worst:0,total:0};
  let worst=0,total=0;
  function measure(p){const d=model.test(p);worst=Math.max(worst,d);total+=d*d;}
  for(const p of model.marks[side])measure(frame.lower(p));
  for(let k=1;k<=6;k++)measure(lerp(frame.shoulder,frame.elbow,k/6));
  return {worst,total};
}
