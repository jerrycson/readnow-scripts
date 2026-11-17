const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
const cross=(a,b,c)=>{const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);return[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
// z만 움직일 때 각 삼각형 면벡터와 고정 벡터의 내적은 정점 깊이의 선형식이다.
// 원래 면과 이루는 내적, 현재 양수인 34차 기준면과의 내적을 각각 작은 양수로 제한한다.
export function preserveOrbitFaces51(base,trial,ref){
 const groups=new Map();for(const [i,p]of base.parts.entries()){
  const target=trial.parts[i],source=ref.parts[i];if(p.vertices===target.vertices||source?.vertices.length!==p.vertices.length)continue;
  if(!groups.has(p.vertices))groups.set(p.vertices,{target:target.vertices,source:source.vertices,faces:[]});
  groups.get(p.vertices).faces.push(...p.faces);
 }
 for(const [vertices,g] of groups){const depth=g.target.map((v,i)=>v.p[2]-vertices[i].p[2]),initial=depth.slice(),constraints=[];
 for(const f of g.faces){if(f.every(i=>Math.abs(depth[i])<1e-9))continue;
 const p=f.map(i=>vertices[i].p),n=cross(...p),refN=cross(...f.map(i=>g.source[i].p)),len=dot(n,n);if(len<1e-20)continue;
 for(const a of [n,refN]){const start=dot(a,n);if(start<1e-20)continue;
 const deriv=f.map((ix,k)=>{if(Math.abs(initial[ix])<1e-9)return 0;const b=p[(k+1)%3],c=p[(k+2)%3];return a[0]*(c[1]-b[1])+a[1]*(b[0]-c[0]);}),den=dot(deriv,deriv);if(den>1e-24)constraints.push({f,deriv,den,limit:-.965*start});
 }}
 for(let pass=0;pass<36;pass++){let edited=0;
  for(const {f,deriv,den,limit} of constraints){const value=f.reduce((a,i,k)=>a+depth[i]*deriv[k],0);if(value>=limit)continue;
   const v=(limit-value)/den;for(let j=0;j<3;j++)depth[f[j]]+=v*deriv[j];if(Math.abs(v)*Math.sqrt(den)>1e-13)edited++;}
  if(!edited)break;
 }
 g.result=g.target.map((v,i)=>Math.abs(depth[i]-initial[i])<1e-10?v:{...v,p:[v.p[0],v.p[1],vertices[i].p[2]+depth[i]]});
 }
 return {...trial,parts:trial.parts.map((p,i)=>{const g=groups.get(base.parts[i].vertices);return g?{...p,vertices:g.result}:p;})};
}

