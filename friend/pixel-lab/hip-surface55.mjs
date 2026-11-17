import {add,sub,mul,cross,dot,norm,lerp} from './geometry.mjs';
import {flexCreases} from './shoulder-surface54.mjs';

const surfaces=new WeakMap();
const key=p=>p.map(x=>Math.round(x*1e8)).join('/');
function topology(mesh){
  if(surfaces.has(mesh))return surfaces.get(mesh);
  const nodes=[],lookup=new Map(),edges=new Map(),triangles=[],hinges=[];
  const ids=mesh.vertices.map((v,i)=>{
    const pos=key(v.p);
    if(!lookup.has(pos)){lookup.set(pos,nodes.length);nodes.push({refs:[],fixed:false,rest:v.p});}
    const id=lookup.get(pos);nodes[id].refs.push(i);return id;
  });
  for(const indices of mesh.faces){
    const t=indices.map(i=>ids[i]),[a,b,c]=t.map(i=>nodes[i].rest);
    const normal=cross(sub(b,a),sub(c,a)),area=Math.hypot(...normal);
    if(area<1e-10)continue;
    const sign=Math.sign(dot(normal,mesh.vertices[indices[0]].n))||1;
    triangles.push({t,area,sign});
    for(let i=0;i<3;i++){
      const pair=[t[i],t[(i+1)%3]].sort((m,n)=>m-n),s=pair.join('/');
      const unit=norm(normal),opposite=t[(i+2)%3],other=edges.get(s);
      if(!other)edges.set(s,{pair,count:1,unit,opposite});
      else{
        other.count++;
        if(dot(other.unit,unit)>Math.cos(100*Math.PI/180))hinges.push([...pair,other.opposite,opposite]);
      }
    }
  }
  for(const {pair,count} of edges.values())if(count===1)for(const i of pair)nodes[i].fixed=true;
  const result={nodes,triangles,hinges};surfaces.set(mesh,result);return result;
}
// 몸통과 두 허벅지 경계는 고정한다. 눌린 내부 삼각형만 이웃 피부의 접평면을 따라 편다.
export function preserveHipArea55(rest,mesh,local=false){
  const {nodes,triangles,hinges}=topology(rest),points=nodes.map(n=>mesh.vertices[n.refs[0]].p);
  let active;
  if(local){
    active=new Set();
    for(const {t,area} of triangles){
      const [a,b,c]=t.map(i=>points[i]);
      if(Math.hypot(...cross(sub(b,a),sub(c,a)))<.20*area)for(const i of t)active.add(i);
    }
    if(!active.size)return mesh;
    for(let radius=0;radius<3;radius++){
      const expanded=new Set(active);
      for(const {t} of triangles)if(t.some(i=>active.has(i)))for(const i of t)expanded.add(i);
      active=expanded;
    }
  }
  const sumNormals=()=>{
    const normals=nodes.map(()=>[0,0,0]);
    for(const {t,sign} of triangles){
      const [a,b,c]=t.map(i=>points[i]),n=mul(cross(sub(b,a),sub(c,a)),sign);
      for(const i of t)normals[i]=add(normals[i],n);
    }
    return normals.map(norm);
  };
  const normals=sumNormals(),constraints=triangles.map(({t,area,sign})=>{
    const dir=mul(norm(add(normals[t[0]],add(normals[t[1]],normals[t[2]]))),sign);
    return {t,dir,min:.37*area};
  });
  const strength=nodes.map((node,i)=>node.fixed||active&&!active.has(i)?0:1);
  for(let pass=0;pass<20;pass++){
    let count=0;
    for(const {t:[a,b,c],dir,min} of constraints){
      const ab=sub(points[b],points[a]),ac=sub(points[c],points[a]);
      const signed=dot(cross(ab,ac),dir);
      if(signed>=min)continue;
      count++;
      const gb=cross(ac,dir),gc=cross(dir,ab),ga=mul(add(gb,gc),-1);
      const gradients=[ga,gb,gc],ids=[a,b,c];
      const denom=ids.reduce((s,i,k)=>s+strength[i]*dot(gradients[k],gradients[k]),0);
      if(denom<1e-12)continue;
      const step=.85*(min-signed)/denom;
      ids.forEach((i,k)=>{if(strength[i])points[i]=add(points[i],mul(gradients[k],step));});
    }
    if(pass===3||pass===12)flexCreases(hinges,points,strength,64,8);
    if(!count&&pass>12)break;
  }
  if(local){
    const original=nodes.map(n=>mesh.vertices[n.refs[0]].p);
    const nearTris=triangles.filter(({t})=>t.some(i=>active.has(i)));
    const nearHinges=hinges.filter(edge=>edge.some(i=>active.has(i)));
    function violations(positions){
      let folds=0,crushed=0;
      for(const [i,j,a,b] of nearHinges){
        const axis=sub(positions[j],positions[i]);
        const na=norm(cross(axis,sub(positions[a],positions[i])));
        const nb=norm(cross(sub(positions[b],positions[i]),axis));
        if(dot(na,nb)<Math.cos(125*Math.PI/180))folds++;
      }
      for(const {t:[i,j,k],area} of nearTris){
        if(Math.hypot(...cross(sub(positions[j],positions[i]),sub(positions[k],positions[i])))<.15*area)crushed++;
      }
      return [folds,crushed];
    }
    let best=points,[folds,crushed]=violations(points);
    if(folds){
      for(let t=.9;t>=0;t=Math.max(0,t-.1)){
        const trial=original.map((p,i)=>lerp(p,points[i],t)),[f,c]=violations(trial);
        if(f<folds||f===folds&&c<crushed){best=trial;folds=f;crushed=c;}
        if(!folds&&!crushed||t===0)break;
      }
      best.forEach((p,i)=>{points[i]=p;});
    }
  }
  const moved=nodes.map((n,i)=>Math.hypot(...sub(points[i],mesh.vertices[n.refs[0]].p))>1e-8);
  if(!moved.some(Boolean))return mesh;
  const adjusted=sumNormals(),vertices=mesh.vertices.slice();
  const affected=new Set(triangles.filter(({t})=>t.some(i=>moved[i])).flatMap(({t})=>t));
  nodes.forEach((node,i)=>{
    if(node.fixed||!affected.has(i))return;
    for(const j of node.refs)vertices[j]={...vertices[j],p:points[i],n:adjusted[i]};
  });
  return {...mesh,vertices};
}
