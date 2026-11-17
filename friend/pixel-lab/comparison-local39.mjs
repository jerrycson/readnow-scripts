export function sameGeometry39(before,after){
  if(before.parts.length!==after.parts.length)throw Error('39차 얼굴 부품 수가 달라 같은 윤곽으로 표시할 수 없습니다.');
  const seen=new Set();let vertices=0,changedNormals=0,faces=0;
  before.parts.forEach((a,k)=>{const b=after.parts[k];if(a.vertices.length!==b.vertices.length||a.faces.length!==b.faces.length)throw Error('39차 얼굴 위상 불일치');
    a.faces.forEach((f,i)=>{faces++;if(f.length!==b.faces[i].length||f.some((v,j)=>v!==b.faces[i][j]))throw Error('39차 얼굴 삼각형 변경');});
    if(seen.has(a.vertices))return;seen.add(a.vertices);a.vertices.forEach((v,i)=>{vertices++;const w=b.vertices[i];if(v.p.some((x,j)=>x!==w.p[j]))throw Error('39차 얼굴 좌표 변경: 38차 윤곽을 재사용할 수 없습니다.');if(v.n.some((x,j)=>x!==w.n[j]))changedNormals++;});
  });
  return {vertices,faces,positionChanges:0,topologyChanges:0,changedNormals};
}

const masks=new WeakMap();
function chestMask(baseline){
  if(masks.has(baseline))return masks.get(baseline);
  const rest=baseline.restSkin35,body=baseline.parts[0],hip=baseline.joints.right.hip[1],shoulder=baseline.joints.right.shoulder[1],width=baseline.tissue34?.width;
  if(!rest||!width)throw Error('가슴 국소 관찰을 위한 기준 정점 자료가 없습니다.');
  const flags=rest.map(v=>{const [x,y,z]=v.p;return y>hip+.45*(shoulder-hip)&&y<shoulder+.06&&z>.07&&Math.abs(x)<width*1.22;});
  const selected=body.faces.filter(f=>f.every(i=>flags[i]));if(!selected.length)throw Error('가슴 국소 피부가 비어 있습니다.');
  const used=[...new Set(selected.flat())],bounds=[0,1,2].map(k=>{const v=used.map(i=>body.vertices[i].p[k]);return [Math.min(...v),Math.max(...v)];}),center=bounds.map(([a,b])=>(a+b)/2),frame=Math.max(...bounds.map(([a,b])=>b-a))*1.18;
  const edges=new Map();for(const f of selected)for(let j=0;j<3;j++){const a=f[j],b=f[(j+1)%3],key=a<b?a+'/'+b:b+'/'+a;if(edges.has(key))edges.get(key).count++;else edges.set(key,{a,b,count:1});}
  const result={flags,center,frame,boundary:[...edges.values()].filter(e=>e.count===1),selectedFaces:selected.length};masks.set(baseline,result);return result;
}
function boundaryPart(scene,mask){
  const vertices=[],faces=[],body=scene.parts[0];
  for(const edge of mask.boundary){const a=body.vertices[edge.a],b=body.vertices[edge.b],t=b.p.map((v,k)=>v-a.p[k]),n=a.n.map((v,k)=>v+b.n[k]),cross=[t[1]*n[2]-t[2]*n[1],t[2]*n[0]-t[0]*n[2],t[0]*n[1]-t[1]*n[0]],length=Math.hypot(...cross);if(length<1e-10)continue;const delta=cross.map(v=>v/length*.002),offset=vertices.length;
    for(const [v,s]of [[a,1],[a,-1],[b,-1],[b,1]])vertices.push({p:v.p.map((x,k)=>x+s*delta[k]+v.n[k]*.0008),n:v.n});faces.push([offset,offset+1,offset+2],[offset,offset+2,offset+3]);
  }
  return {name:'diagnostic-cut-boundary39',vertices,faces,mat:'face-ink',strain:new Uint8Array(faces.length).fill(2)};
}
export function localChest39(scene,baseline,{cutBoundary=true}={}){
  const mask=chestMask(baseline),body=scene.parts[0],parts=[];
  for(const mesh of scene.parts){if(mesh.vertices===body.vertices){const indices=[];mesh.faces.forEach((f,i)=>{if(f.every(k=>mask.flags[k]))indices.push(i);});if(indices.length)parts.push({...mesh,faces:indices.map(i=>mesh.faces[i]),strain:mesh.strain?Uint8Array.from(indices,i=>mesh.strain[i]):undefined});}
    else if(/^(papilla35-|areola35-)/.test(mesh.name||''))parts.push(mesh);
  }
  if(cutBoundary)parts.push(boundaryPart(scene,mask));
  return {...scene,parts,detailSelection:{focus:'chest-local',cutaway:true,center:mask.center,frame:mask.frame},localEvidence39:{selectedFaces:mask.selectedFaces,cutEdges:mask.boundary.length,retainedParts:parts.map(p=>p.name)}};
}
export function silhouette39(image){const data=new Uint8ClampedArray(image.data);for(let i=0;i<data.length;i+=4)if(data[i+3])data[i]=data[i+1]=data[i+2]=0;return {...image,data};}

export function faceOverlay39(previous){
  // 호출자는 sameGeometry39로 각 실제 후보의 좌표·위상이 같은지 먼저 확인한다.
  return {...previous,views:previous.views.map(v=>({...v,visible37:v.visible38,visible38:v.visible38,meanDistancePx:v.meanDistancePx?[v.meanDistancePx[1],v.meanDistancePx[1]]:undefined})),cases:Object.fromEntries(Object.entries(previous.cases).map(([id,c])=>[id,{...c,side:{...c.side,under37:c.side.under38,under38:c.side.under38}}]))};
}
