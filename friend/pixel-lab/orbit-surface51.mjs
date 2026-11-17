const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const scope=new Set(['cheek-orbit34','eye34','lid34','lower-lid34','brow34']);
// 기준 34의 같은 정점에서 접평면을 새 x/y 위치로 운반한다. 중앙 코·입·턱과 광대 밖은 고정한다.
export function orbit51(scene,id,source34,strength=.75,mode='tangent'){
 if(!(strength>0)||!source34||scene.parts[0].vertices.length!==source34.parts[0].vertices.length)return scene;
 const chin=scene.landmarks.chin[1],srcChin=source34.landmarks.chin[1],skin=scene.parts[0].vertices,memo=new Map();
 const output=scene.parts.map((part,j)=>{
  if(part.vertices!==skin&&!scope.has(part.name))return part;
  if(memo.has(part.vertices))return {...part,vertices:memo.get(part.vertices)};
  const ref=part.vertices===skin?source34.parts[0]:source34.parts[j];if(!ref||ref.name!==part.name&&part.vertices!==skin||ref.vertices.length!==part.vertices.length)return part;
  const verts=part.vertices.map((v,i)=>{
   const p=v.p,n=v.n,old=ref.vertices[i],q=old.p,h=q[1]-srcChin,x=Math.abs(q[0]);
   const zone=smooth(.012,.066,x)*(1-smooth(.256,.345,x))*smooth(.225,.345,h)*(1-smooth(.605,.738,h))*smooth(.255,.475,q[2]);
   if(!zone)return v;const w=Math.min(1,strength)*zone;
   const slope=mode==='copy'?0:Math.max(-.055,Math.min(.055,-((p[0]-q[0])*old.n[0]+(p[1]-chin-(q[1]-srcChin))*old.n[1])/Math.max(.35,old.n[2])));
   const target=q[2]+slope;
   const pos=[p[0],p[1],p[2]+w*(target-p[2])];const normal=n.map((a,k)=>a+w*(old.n[k]-a)),mag=Math.hypot(...normal)||1;
   return {...v,p:pos,n:normal.map(a=>a/mag)};
  });memo.set(part.vertices,verts);return {...part,vertices:verts};
 });return {...scene,parts:output};
}

