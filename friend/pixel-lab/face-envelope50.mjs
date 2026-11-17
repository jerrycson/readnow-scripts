const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function ramp(a,b,x){const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);}
function extents(scene,chin){
 const skin=scene.parts[0].vertices,rows=Array.from({length:81},()=>[0,0]);
 for(const part of scene.parts.filter(q=>q.vertices===skin))for(const [i,j,k] of part.faces){
   const tri=[skin[i].p,skin[j].p,skin[k].p];
   for(let e=0;e<3;e++){const a=tri[e],b=tri[(e+1)%3],dy=b[1]-a[1];if(Math.abs(dy)<1e-9)continue;
    const first=Math.max(0,Math.ceil((Math.min(a[1],b[1])-chin+.04)/.006)),last=Math.min(80,Math.floor((Math.max(a[1],b[1])-chin+.04)/.006));
    for(let r=first;r<=last;r++){const t=(chin-.04+r*.006-a[1])/dy,x=a[0]+t*(b[0]-a[0]),z=a[2]+t*(b[2]-a[2]);if(z<.03)continue;const sign=+(x>=0);rows[r][sign]=Math.max(rows[r][sign],Math.abs(x));}
   }
 }
 return rows;
}
// 측면에서 본 깊이는 고정한다. 폭의 1차 미분으로 기존 정점 법선을 운반한다.
export function cheekEnvelope50(scene,id,source35,gain=.85,local=false){
 if(id!=='F02'||!(gain>0))return scene;
 const vs=scene.parts[0].vertices,chin=scene.landmarks.chin[1],base=extents(scene,chin),old=extents(source35,chin);
 const curves=[0,1].map(s=>base.map((r,i)=>{
   let weight=0,x=0;for(let j=-5;j<=5;j++){const at=clamp(i+j,0,80),w=6-Math.abs(j);weight+=w;x+=w*old[at][s];}
   return clamp(x/weight-r[s],-.065,.065);
 }));
 const value=(p)=>{const [x,y,z]=p,h=y-chin,u=clamp((h+.04)/.006,0,80),i=Math.floor(u),f=u-i,s=+(x>=0),row=curves[s];
   const side=ramp(.08,.20,Math.abs(x)),depth=ramp(.00,.09,z),height=local?ramp(.06,.105,h)*(1-ramp(.205,.265,h)):ramp(-.015,.04,h)*(1-ramp(.30,.42,h));
   return (s?1:-1)*clamp(gain,0,1)*(row[i]*(1-f)+row[Math.min(i+1,80)]*f)*side*depth*height;
 };
 const vertices=vs.map(v=>{const p=v.p,d=value(p);if(Math.abs(d)<1e-10)return v;
   const e=.0001,derivative=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=e;b[k]-=e;return (value(a)-value(b))/(2*e);});
   const nx=v.n[0]/(1+derivative[0]),n=[nx,v.n[1]-nx*derivative[1],v.n[2]-nx*derivative[2]],length=Math.hypot(...n)||1;
   return {...v,p:[p[0]+d,p[1],p[2]],n:n.map(c=>c/length)};
 });
 return {...scene,parts:scene.parts.map(p=>p.vertices===vs?{...p,vertices}:p)};
}
