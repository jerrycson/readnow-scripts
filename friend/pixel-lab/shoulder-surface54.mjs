import {add,sub,mul,dot,cross,norm,lerp} from './geometry.mjs';

const cache=new WeakMap();
const pointKey=p=>p.map(x=>Math.round(x*1e8)).join('/');
const span=5;
function topology(parts){
  if(cache.has(parts))return cache.get(parts);
  const byPosition=new Map(),patches=[],triangles=[],nodes=[];
  function node(v){
    const key=pointKey(v.p);
    if(!byPosition.has(key)){
      byPosition.set(key,nodes.length);nodes.push({neighbors:new Set(),refs:[],rest:v.p,depth:Infinity,freedom:1});
    }
    return byPosition.get(key);
  }
  for(const [part,mesh] of parts.entries()){
    const sleeve=Boolean(mesh.weights54);
    if(!sleeve&&!['upper-arm','ribcage-waist-pelvis'].includes(mesh.name))continue;
    const seen=new Map();
    for(const face of mesh.faces){
      const indices=face.map(i=>{
        if(seen.has(i))return seen.get(i);
        const index=node(mesh.vertices[i]);seen.set(i,index);nodes[index].refs.push([part,i]);
        // 네 고리뿐인 짧은 위팔은 한 번의 이웃 탐색으로도 팔꿈치에 닿는다.
        // 팔꿈치 단면은 아래팔과 만나는 원형 그대로 두고 그 위 고리는 조금만 움직인다.
        if(mesh.name==='upper-arm'&&mesh.vertices.length===50){
          if(i>=36)nodes[index].freedom=0;
          else if(i>=24)nodes[index].freedom=.15;
        }
        if(sleeve)nodes[index].depth=0;
        return index;
      });
      if(new Set(indices).size!==3)continue;
      for(let k=0;k<3;k++){const n=nodes[indices[k]].neighbors;n.add(indices[(k+1)%3]);n.add(indices[(k+2)%3]);}
      const [a,b,c]=face.map(i=>mesh.vertices[i]);
      const outward=sleeve?1:dot(cross(sub(b.p,a.p),sub(c.p,a.p)),add(a.n,add(b.n,c.n)))>=0?1:-1;
      triangles.push({indices,outward,sleeve});
    }
  }
  let rim=nodes.flatMap((n,i)=>n.depth===0?[i]:[]);
  for(let depth=1;depth<=span;depth++){
    const next=[];
    for(const i of rim)for(const j of nodes[i].neighbors)if(nodes[j].depth>depth){nodes[j].depth=depth;next.push(j);}
    rim=next;
  }
  nodes.forEach((node,i)=>{
    if(node.depth>=span)return;
    const neighbors=[...node.neighbors].map(j=>[j,1/Math.max(1e-5,Math.hypot(...sub(node.rest,nodes[j].rest)))]);
    const total=neighbors.reduce((sum,pair)=>sum+pair[1],0);
    patches.push({i,neighbors:neighbors.map(([j,w])=>[j,.5/neighbors.length+.5*w/total])});
  });
  const shared=new Map(),hinges=[];
  for(const {indices:t,sleeve} of triangles)if(sleeve)for(let e=0;e<3;e++){
    const i=t[e],j=t[(e+1)%3],opposite=t[(e+2)%3],key=Math.min(i,j)+'/'+Math.max(i,j);
    if(shared.has(key))hinges.push([i,j,shared.get(key),opposite]);
    else shared.set(key,opposite);
  }
  const result={nodes,patches,hinges,triangles:triangles.filter(t=>t.indices.some(i=>nodes[i].depth<span))};cache.set(parts,result);
  return result;
}
// 공통 모서리를 축으로 맞은편 두 점을 움직인다. 벌리는 동안 네 점의 무게중심을 유지한다.
function flexCreases(hinges,points,strength){
  const keepAngle=72*Math.PI/180,cos=Math.cos(keepAngle);
  for(let pass=0;pass<36;pass++){
    let active=0;
    for(const [i,j,a,b] of hinges){
      const axis=norm(sub(points[j],points[i]));
      const offset=k=>{const v=sub(points[k],points[i]);return sub(v,mul(axis,dot(v,axis)));};
      const va=offset(a),vb=offset(b),ra=Math.hypot(...va),rb=Math.hypot(...vb);
      if(ra<1e-7||rb<1e-7)continue;
      const u=mul(va,1/ra),v=mul(vb,1/rb),c=dot(u,v);
      if(c<=cos)continue;
      active++;
      const mid=norm(add(u,v)),normal=sub(u,v);
      const tangent=Math.hypot(...normal)>1e-7?norm(normal):norm(cross(axis,mid));
      const along=mul(mid,Math.cos(keepAngle/2)),away=mul(tangent,Math.sin(keepAngle/2));
      const moveA=mul(sub(add(along,away),u),ra*.55),moveB=mul(sub(sub(along,away),v),rb*.55);
      points[a]=add(points[a],mul(moveA,strength[a]));points[b]=add(points[b],mul(moveB,strength[b]));
      const balance=mul(add(moveA,moveB),-.5);
      points[i]=add(points[i],mul(balance,strength[i]));points[j]=add(points[j],mul(balance,strength[j]));
    }
    if(!active)break;
  }
}
export function finishShoulderSurface54(rest,posed){
  const {nodes,patches,triangles,hinges}=topology(rest);
  let points=nodes.map(({refs})=>{const [part,i]=refs[0];return posed[part].vertices[i].p;});
  const strength=nodes.map(({depth,freedom})=>freedom*Math.max(0,1-depth/span));
  // 양쪽 면이 같은 경계 정점을 공유한다. 경계 한쪽만 매끈하게 하여 벌어지는 일을 막는다.
  for(let pass=0;pass<18;pass++){
    const next=points.slice();
    for(const {i,neighbors} of patches){
      if(!strength[i])continue;
      const center=[0,0,0];
      for(const [j,w] of neighbors)for(let k=0;k<3;k++)center[k]+=points[j][k]*w;
      next[i]=lerp(points[i],center,.48*strength[i]);
    }
    points=next;
  }
  flexCreases(hinges,points,strength);
  const normals=nodes.map(()=>[0,0,0]);
  for(const {indices:[a,b,c],outward} of triangles){
    const n=mul(cross(sub(points[b],points[a]),sub(points[c],points[a])),outward);
    for(const i of [a,b,c])normals[i]=add(normals[i],n);
  }
  const out=posed.slice(),changed=new Set();
  for(const {i} of patches){
    if(!strength[i])continue;
    const direction=norm(normals[i]);
    for(const [part,j] of nodes[i].refs){
      if(!changed.has(part)){out[part]={...out[part],vertices:out[part].vertices.slice()};changed.add(part);}
      const v=out[part].vertices[j];
      out[part].vertices[j]={...v,p:points[i],n:norm(lerp(v.n,direction,strength[i]))};
    }
  }
  return out;
}
