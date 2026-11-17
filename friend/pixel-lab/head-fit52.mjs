import {rotateNormals50} from './body-multiview50.mjs';
import {materialLibrary} from './materials.mjs';
import {faceOptions50} from './face-options50.mjs';

const originals = new WeakMap();
const charts = new WeakMap();
const sockets = new WeakMap();
const epsilon = 1e-7;
const unit = v => { const length = Math.hypot(...v) || 1; return v.map(x => x / length); };
const mix = (a, b, t) => a.map((x, k) => x + (b[k] - x) * t);
const edgeKey = (a, b) => Math.min(a, b) + '/' + Math.max(a, b);
const key = p => p.map(x => Math.round(x / epsilon)).join('/');
const bounds = (vertices, axis) => {
  let min = Infinity, max = -Infinity;
  for (const {p} of vertices) { min = Math.min(min, p[axis]); max = Math.max(max, p[axis]); }
  return {center:(min+max)/2, span:max-min};
};

function edgeMap(faces) {
  const edges = new Map();
  for (const f of faces) for (let j=0; j<3; j++) {
    const a=f[j], b=f[(j+1)%3], k=edgeKey(a,b);
    if (edges.has(k)) edges.delete(k); else edges.set(k,[a,b]);
  }
  return edges;
}
function orderedRing(vertices, indices) {
  // 턱 앞쪽까지 메시의 실제 모서리 순서를 유지한다.
  const points = indices.map(i=>vertices[i]);
  const total = points.reduce((a,v,i)=>{
    const p=v.p, q=points[(i+1)%points.length].p;
    return a+p[0]*q[2]-q[0]*p[2];
  },0);
  if(total<0) indices.reverse();
  const middleZ = bounds(points,2).center, middleX=bounds(points,0).center;
  const angle = p=>Math.abs(Math.atan2(p[2]-middleZ,p[0]-middleX));
  let start=0;
  for(let i=1;i<indices.length;i++)if(angle(vertices[indices[i]].p)<angle(vertices[indices[start]].p))start=i;
  return indices.slice(start).concat(indices.slice(0,start));
}
function donorChart(scene) {
  if(charts.has(scene))return charts.get(scene);
  const base=scene.parts[0], skull=scene.parts.filter(m=>m!==base&&m.vertices===base.vertices);
  if(!skull.length)throw Error('연구 원형의 머리·목 분할을 찾지 못했습니다.');
  const skullIndices=new Set(skull.flatMap(m=>m.faces.flat()));
  const rim=base.faces.filter(f=>f.some(i=>skullIndices.has(i)));
  const kept=new Set(rim);
  const lowerEdges=edgeMap(base.faces.filter(f=>!kept.has(f)));
  const interfaceEdges=[...edgeMap(rim).entries()].filter(([k])=>lowerEdges.has(k));
  const next=new Map();
  for(const [,[a,b]] of interfaceEdges)for(const [i,j] of [[a,b],[b,a]]) {
    if(!next.has(i))next.set(i,[]);
    next.get(i).push(j);
  }
  if(!next.size||[...next.values()].some(a=>a.length!==2))throw Error('머리의 열린 목 고리가 단일 순환이 아닙니다.');
  const ring=[next.keys().next().value];
  let cursor=next.get(ring[0])[0];
  while(cursor!==ring[0]&&ring.length<=next.size) {
    const previous=ring.at(-1);
    ring.push(cursor); cursor=next.get(cursor).find(i=>i!==previous);
  }
  if(ring.length!==next.size)throw Error('연구 원형의 목 둘레가 분리되었습니다.');
  const used=[...new Set([...skullIndices,...rim.flat()])];
  const indices=new Map(used.map((v,i)=>[v,i]));
  const headMeshes=skull.map(m=>({name:m.name,mat:m.mat,faces:m.faces.map(f=>f.map(i=>indices.get(i)))}));
  headMeshes.push({name:'head-fit-throat52',mat:'skin',faces:rim.map(f=>f.map(i=>indices.get(i)))});
  const chin=scene.landmarks.chin[1];
  // 귀 위 두개의 가로 단면을 사용해 볼과 턱의 설계값을 보존한다.
  const cranium=used.map(i=>base.vertices[i]).filter(v=>v.p[1]>chin+.66 && v.p[1]<chin+.91);
  const faces=headMeshes.flatMap(m=>m.faces), graph=used.map(()=>new Set());
  for(const [a,b,c] of faces){graph[a].add(b).add(c);graph[b].add(a).add(c);graph[c].add(a).add(b);}
  const data={used,headMeshes,chin,cranium,graph,faces,ring:orderedRing(base.vertices,ring).map(i=>indices.get(i))};
  charts.set(scene,data);return data;
}
function neckSocket(neck, head, cute) {
  let heads=sockets.get(neck);
  if(!heads){heads=new WeakMap();sockets.set(neck,heads);}
  if(heads.has(head))return heads.get(head);
  const height=bounds(head.vertices,1),chin=height.center-height.span/2;
  const levels=[...new Set(neck.vertices.map(v=>v.p[1]))].sort((a,b)=>a-b);
  // 원형 목에서 가로 고리 아래의 삼각형을 보존한다.
  const cut=levels[cute?3:1], faces=neck.faces.filter(f=>f.every(i=>neck.vertices[i].p[1]<=cut+epsilon));
  const ring=new Map();
  for(const i of new Set(faces.flat())){
    const v=neck.vertices[i];if(Math.abs(v.p[1]-cut)<epsilon)ring.set(key(v.p),i);
  }
  if(ring.size<8)throw Error('전신 목의 보존할 단면이 없습니다.');
  const center=bounds([...ring.values()].map(i=>neck.vertices[i]),2).center;
  const sorted=[...ring.values()].sort((a,b)=>{
    const angle=i=>Math.atan2(neck.vertices[i].p[2]-center,neck.vertices[i].p[0]);
    return angle(a)-angle(b);
  });
  const skull=head.vertices.filter(v=>v.p[1]>chin+.66&&v.p[1]<chin+.91);
  const rows=new Map();
  if(cute)for(const v of head.vertices){
    const level=Math.round((v.p[1]-chin)*100000);
    if(!rows.has(level))rows.set(level,[]);
    rows.get(level).push(v);
  }
  const sections=[...rows.entries()].sort((a,b)=>a[0]-b[0]).map(([h,vs])=>{
    const x=bounds(vs,0),z=bounds(vs,2);
    return [h/100000,x.span/2,z.span/2,z.center];
  });
  const result={chin,height:height.span,cut,cute,sections,neck:{...neck,faces},ring:orderedRing(neck.vertices,sorted).map(i=>neck.vertices[i]),skull};
  heads.set(head,result);return result;
}
function coordinateMap(source, socket, skin, accessory=false) {
  const from=source.cranium,to=socket.skull,x=bounds(from,0),z=bounds(from,2),tx=bounds(to,0),tz=bounds(to,2);
  const sx=tx.span/x.span,sz=tz.span/z.span,sy=socket.height, bend=socket.cute?-.40:0;
  const throat=source.ring.map(i=>skin[source.used[i]]),throatX=bounds(throat,0),throatZ=bounds(throat,2);
  const nativeX=bounds(socket.ring,0),nativeZ=bounds(socket.ring,2);
  // 짧은 체형에서 가슴에 묻힌 단면보다 화면에 드러나는 목의 폭이 크다.
  const rx=socket.cute?.235:nativeX.span*1.04,rz=socket.cute?.235:nativeZ.span*1.04;
  const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
  function position([x0,y0,z0]){
    const h=y0-source.chin,t=Math.max(0,Math.min(1,h));
    const throatDepth=(z0-throatZ.center)/throatZ.span;
    const front=1-smooth(.35,.94,throatDepth);
    const support=front*(1-smooth(-.048,.255,h));
    const px=tx.center+sx*(x0-x.center),pz=tz.center+sz*(z0-z.center);
    const py=socket.chin+sy*(h+bend*t*(1-t));
    if(accessory)return [px,py,pz];
    const neckX=nativeX.center+(x0-throatX.center)*rx/throatX.span;
    const neckZ=nativeZ.center+(z0-throatZ.center)*rz/throatZ.span;
    const out=[px+(neckX-px)*support,py+(socket.cute?.165*support:0),pz+(neckZ-pz)*support];
    const weight=socket.cute?.74*smooth(-.14,.20,throatDepth)*(1-smooth(.145,.385,h)):0;
    if(weight){
      const level=Math.min(.48,Math.max(.042,.048+.92*(out[1]-socket.chin)));
      let j=0;while(j<socket.sections.length-2&&socket.sections[j+1][0]<level)j++;
      const a=socket.sections[j],b=socket.sections[j+1],span=(level-a[0])/(b[0]-a[0]);
      const [,rx,rz,zc]=mix(a,b,span);
      const radius=Math.hypot(out[0]/rx,(out[2]-zc)/rz);
      if(radius>.2){
        out[0]+=weight*(out[0]/radius-out[0]);
        out[1]+=weight*(socket.chin+level-out[1]);
        out[2]+=weight*(zc+(out[2]-zc)/radius-out[2]);
      }
    }
    return out;
  }
  const cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  return v=>{
    const p=position(v.p),eps=.00005;
    const column=[0,1,2].map(k=>{const q=v.p.slice();q[k]+=eps;return position(q).map((x,j)=>(x-p[j])/eps);});
    const adj=[cr(column[1],column[2]),cr(column[2],column[0]),cr(column[0],column[1])];
    return {...v,p,n:unit([0,1,2].map(k=>v.n.reduce((sum,n,j)=>sum+n*adj[j][k],0)))};
  };
}
function lengths(ring) {
  const a=[0];
  for(let i=0;i<ring.length;i++){
    const p=ring[i].p,q=ring[(i+1)%ring.length].p;
    a.push(a.at(-1)+Math.hypot(p[0]-q[0],p[2]-q[2]));
  }
  return a.map(v=>v/a.at(-1));
}
// 전신 목의 경계를 고정하고 연구 얼굴 쪽의 목만 연결한다.
// 경계 변위는 기존 네 줄의 이웃 정점에 조화 확장으로 분배한다.
function seatThroat(socket, vertices, chart) {
  const upper=chart.ring.map(i=>vertices[i]),lower=socket.ring,hi=lengths(upper),lo=lengths(lower);
  const cx=bounds(lower,0).center,cz=bounds(lower,2).center;
  const graph=chart.graph,offsets=new Map(),frontier=[...chart.ring],levels=new Map(frontier.map(i=>[i,0]));
  for(let k=0;k<frontier.length;k++){
    const i=frontier[k],depth=levels.get(i);if(depth===5)continue;
    for(const j of graph[i])if(!levels.has(j)){levels.set(j,depth+1);frontier.push(j);}
  }
  const equalNormals=[];
  for(let i=0;i<upper.length;i++) {
    let j=0;while(j+1<lower.length&&lo[j+1]<hi[i])j++;
    const t=(hi[i]-lo[j])/(lo[j+1]-lo[j]),a=lower[j],b=lower[(j+1)%lower.length];
    const anchor=mix(a.p,b.p,t),p=upper[i].p;
    const radial=socket.cute?1.045:1.024;
    const target=[cx+(anchor[0]-cx)*radial,socket.cut+(socket.cute?.062:.086),cz+(anchor[2]-cz)*radial];
    offsets.set(chart.ring[i],target.map((x,k)=>x-p[k]));
    equalNormals.push(unit([anchor[0]-cx,-.032,anchor[2]-cz]));
  }
  const zero=[0,0,0],inner=frontier.filter(i=>levels.get(i)>0&&levels.get(i)<5);
  for(let step=0;step<32;step++){
    const next=inner.map(i=>{
      const sum=[0,0,0],adj=graph[i];
      for(const j of adj){const d=offsets.get(j)??zero;for(let k=0;k<3;k++)sum[k]+=d[k]/adj.size;}
      return sum;
    });
    for(let i=0;i<inner.length;i++)offsets.set(inner[i],next[i]);
  }
  const before=vertices.slice();
  for(const [i,d]of offsets)vertices[i]={...vertices[i],p:vertices[i].p.map((x,k)=>x+d[k])};
  const touched=chart.faces.filter(f=>f.some(i=>offsets.has(i)));
  rotateNormals50(before,vertices,touched);
  chart.ring.forEach((i,k)=>{vertices[i]={...vertices[i],n:equalNormals[k]};});
}

function stitch(socket, vertices, indices) {
  const base=socket.ring,top=indices.map(i=>vertices[i]),lo=lengths(base),hi=lengths(top);
  const raised=top.map((v,i)=>{
    let j=0;
    while(j+1<base.length&&lo[j+1]<hi[i])j++;
    const t=(hi[i]-lo[j])/(lo[j+1]-lo[j]),a=base[j],b=base[(j+1)%base.length];
    const anchor={p:mix(a.p,b.p,t),n:unit(mix(a.n,b.n,t))};
    return anchor;
  });
  const points=[...base],faces=[];
  for(const t of [.32,.68,1])for(let i=0;i<indices.length;i++){
    const bottom=raised[i],end=vertices[indices[i]];
    if(t===1){points.push(end);continue;}
    const radial=t*t*(2-t),p=mix(bottom.p,end.p,radial);
    p[1]=bottom.p[1]+(end.p[1]-bottom.p[1])*t;
    points.push({p,n:unit(mix(bottom.n,end.n,t*t*(3-2*t)))});
  }
  // 두 고리에서 다음 누적 호 길이에 해당하는 점부터 전진하며 원래 모서리를 모두 남긴다.
  const m=base.length,n=indices.length;
  let i=0,j=0;
  while(i<m||j<n){
    const a=i%m,b=m+j%n;
    if(j<n&&(i===m||hi[j+1]<=lo[i+1])){faces.push([a,b,m+(j+1)%n]);j++;}
    else {faces.push([a,b,(i+1)%m]);i++;}
  }
  for(let row=0;row<2;row++)for(let k=0;k<n;k++) {
    const a=m+row*n+k,b=m+row*n+(k+1)%n;
    faces.push([a,a+n,b],[b,a+n,b+n]);
  }
  return {name:'head-fit-neck52',mat:'skin',vertices:points,faces};
}
function fitHairToFloor(parts, start, floor, chin, mode) {
  if(start===parts.length)return null;
  let lowest=Infinity;
  for(const mesh of parts.slice(start))for(const v of mesh.vertices)lowest=Math.min(lowest,v.p[1]);
  const join=chin-.10,clearance=.025;
  if(mode==='source'||lowest>=floor||join<=floor+clearance)return {sourceMin:lowest,fittedMin:lowest,changed:0};
  const length=join-lowest, target=join-floor-clearance, c=length/target-1;
  // 목덜미에서 세로 위치와 기울기가 원형과 일치한다. 세로 미분은 양수다.
  const changedArrays=new Map();let changed=0;
  for(let i=start;i<parts.length;i++){
    const mesh=parts[i];
    if(!changedArrays.has(mesh.vertices))changedArrays.set(mesh.vertices,mesh.vertices.map(v=>{
      const d=join-v.p[1];if(d<=0)return v;
      const f=1+c*d/length,ny=v.n[1]*f*f;
      changed++;
      return {...v,p:[v.p[0],join-d/f,v.p[2]],n:unit([v.n[0],ny,v.n[2]])};
    }));
    parts[i]={...mesh,vertices:changedArrays.get(mesh.vertices)};
  }
  return {sourceMin:lowest,fittedMin:floor+clearance,changed};
}

const bodyExtras = new Set(['bag-strap','satchel','buckle','scarf-collar','scarf-tail']);
export function fitResearchHead52(bodyStudy, bodyScene, faceStudy=null, faceScene=faceStudy?.scene, {hairGround='fit'}={}) {
  const native=originals.get(bodyScene)??bodyScene;
  if(!faceStudy)return native;
  const option=faceOptions50.find(v=>v.id===faceStudy.id);
  if(!/^(female|male)-[2-8]$/.test(bodyStudy?.id)||!option||option.sex!==bodyStudy.settings.sex)
    throw RangeError('전신과 같은 성별의 연구 얼굴 네 개 중 하나를 선택하세요.');
  const at=native.parts.findIndex(m=>m.name==='head'),neckAt=native.parts.findIndex(m=>m.name==='neck');
  if(at<0||neckAt<0||!faceScene?.parts?.length)throw Error('중립 전신 또는 얼굴 원형을 찾을 수 없습니다.');
  const chart=donorChart(faceStudy.scene),source=faceStudy.scene.parts[0].vertices,skin=faceScene.parts[0].vertices;
  if(skin.length!==source.length||faceScene.parts.length<faceStudy.scene.parts.length)throw Error('연구 얼굴의 정점 대응이 바뀌었습니다.');
  const socket=neckSocket(native.parts[neckAt],native.parts[at],native.proportions.cute);
  const map=coordinateMap(chart,socket,source),vertices=chart.used.map(i=>map(skin[i]));
  seatThroat(socket,vertices,chart);
  const connector=stitch(socket,vertices,chart.ring),sources=new Map();
  const mapAccessory=coordinateMap(chart,socket,source,true);
  const head=chart.headMeshes.map(m=>({...m,mat:'head-fit-skin52',vertices}));
  const features=[];let hairStart=null;
  if(!['fit','source'].includes(hairGround))throw RangeError('머리 길이 비교 방식을 확인하세요.');
  for(let i=1;i<faceScene.parts.length;i++){
    const m=faceScene.parts[i];
    if(i===faceStudy.scene.parts.length)hairStart=features.length;
    if(faceStudy.scene.parts[i]?.vertices===source)continue;
    if(!sources.has(m.vertices))sources.set(m.vertices,m.vertices.map(i>=faceStudy.scene.parts.length?mapAccessory:map));
    features.push({...m,mat:m.mat==='complexion34'?'head-fit-skin52':m.mat,vertices:sources.get(m.vertices)});
  }
  const ground=Math.min(...native.feet.map(foot=>foot.ground));
  const hairFloor=fitHairToFloor(features,hairStart??features.length,ground,socket.chin,hairGround);
  const parts=native.parts.slice(0,at);
  parts[neckAt]=socket.neck;
  const extensions=native.parts.slice(at+1).filter(m=>bodyExtras.has(m.name));
  const materials={...native.studyMaterials,'head-fit-skin52':{...(native.studyMaterials?.skin??materialLibrary(bodyStudy.settings).skin),portrait:true,chin:Math.max(socket.chin+.075,socket.cut+.11)}};
  for(const m of features)if(m.mat!=='skin'&&faceScene.studyMaterials?.[m.mat])materials[m.mat]=faceScene.studyMaterials[m.mat];
  const result={...native,parts:[...parts,...head,connector,...features,...extensions],studyMaterials:materials,
    headFit52:{id:faceStudy.id,hairFloor,body:bodyStudy.id,cutY:socket.cut,baseRing:socket.ring.length,donorRing:chart.ring.length,bodyPartCount:at}};
  originals.set(result,native);
  return result;
}



