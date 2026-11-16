import {foundation} from './foundation32.mjs';
import {improveProfile} from './study32-na.mjs';
import {frontRay} from './continuous/body.mjs';
import {norm,cross,sub} from './geometry.mjs';
import {bell,clamp,ramp} from './region33.mjs';
const cache=new WeakMap();
export function normals(vertices,faces){
  const sums=vertices.map(()=>[0,0,0]);
  for(const [a,b,c] of faces){
    const n=cross(sub(vertices[b].p,vertices[a].p),sub(vertices[c].p,vertices[a].p));
    for(const i of [a,b,c])for(let k=0;k<3;k++)sums[i][k]+=n[k];
  }
  return vertices.map((v,i)=>{
    const n=sums[i];if(Math.hypot(...n)<1e-10)return v;
    if(n.reduce((a,x,k)=>a+x*v.n[k],0)<0)for(let k=0;k<3;k++)n[k]*=-1;
    return {...v,n:norm(n)};
  });
}
function strip(parts,name,columns,rows,point,material){
  const vertices=[],groups=new Map();
  for(let col=0;col<=columns;col++)for(let row=0;row<=rows;row++)vertices.push({p:point(2*col/columns-1,row/rows),n:[0,0,1]});
  const all=[];
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
    const a=i*(rows+1)+j,b=a+rows+1;
    for(const f of [[a,b,a+1],[a+1,b,b+1]]){
      const q=[0,1,2].map(k=>f.reduce((v,n)=>v+vertices[n].p[k],0)/3);
      const mat=typeof material==='function'?material(q):material;
      if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push(f);all.push(f);
    }
  }
  const shaded=normals(vertices,all);
  for(const [mat,faces] of groups)parts.push({name,mat,vertices:shaded,faces});
}
function adultEyes(parts,ray,chin,side,female,eyeX){
  const cy=chin+.476,rx=female?.126:.119,center=Math.abs(eyeX)-.005;
  const xAt=u=>side*(center+rx*u);
  const limit=u=>Math.max(0,1-u*u)**.72;
  const axis=u=>cy+.024*u;
  const upper=u=>axis(u)+(female?.050:.039)*limit(u)*(1-.18*u);
  const lower=u=>axis(u)-(female?.034:.028)*limit(u)*(1+.15*u);
  const ridge=[];
  for(const u of [-1.4,-.7,0,.7,1.4]){
    const x=xAt(u),samples=[.10,.13,.15,-.10,-.12,-.14].map(d=>ray(x,cy+d)).filter(z=>z>.30).sort((a,b)=>a-b);
    ridge.push(samples.length?samples[Math.floor(samples.length/2)]:.55);
  }
  function rim(x){
    const i=clamp(((x*side-center)/rx+1.4)/.7,0,4),k=Math.min(3,Math.floor(i));
    return ridge[k]+(ridge[k+1]-ridge[k])*(i-k);
  }
  function depth(u,v){return rim(xAt(u))-.025+.028*limit(u)*(1-.68*(2*v-1)**2)-.026*u;}
  strip(parts,'33-cornea',54,22,(u,v)=>[xAt(u),lower(u)+(upper(u)-lower(u))*v,depth(u,v)],([x,y])=>{
    const dx=(x-side*(center-.010))/(female?.058:.048),dy=(y-cy-.009)/(female?.057:.048);
    if(dx*dx+dy*dy>1)return 'portrait-sclera';
    if((dx+.29)**2+(dy-.31)**2<.044)return 'portrait-sclera';
    return dx*dx/.21+dy*dy/.57<1?'portrait-pupil':'portrait-iris';
  });
  // Join both canthi to the cheek and brow with a closed orbital annulus.
  const ring={name:'33-orbital-skin',mat:'study-skin',vertices:[],faces:[]};
  for(let j=0;j<=9;j++)for(let i=0;i<=80;i++){
    const a=2*Math.PI*i/80,u=Math.cos(a),top=Math.sin(a)>=0,v=j/9;
    const x=xAt(u),y=(top?upper:lower)(u),z=depth(u,top?1:0)+.002;
    const ox=side*(center+(rx+.046)*u),oy=cy+.013*u+Math.sin(a)*(top?.108:.100);
    const hit=ray(ox,oy),guide=rim(ox);const outer=Number.isFinite(hit)?clamp(hit-.004,guide-.041,guide+.045):guide;
    ring.vertices.push({p:[x+(ox-x)*v,y+(oy-y)*v,z+(outer-z)*v+.004*Math.sin(Math.PI*v)*Math.abs(Math.sin(a))],n:[0,0,1]});
    if(j&&i){const n=j*81+i;ring.faces.push([n-82,n-81,n],[n-82,n,n-1]);}
  }
  ring.vertices=normals(ring.vertices,ring.faces).map((v,i)=>{
    const t=Math.floor(i/81)/9,x=v.p[0],e=.006,slope=(rim(x+e)-rim(x-e))/(2*e);
    const skin=norm([-slope,(v.p[1]-cy)*.7,1]),mix=.20+.77*t;
    return {...v,n:norm(v.n.map((n,k)=>n*(1-mix)+skin[k]*mix))};
  });parts.push(ring);
  strip(parts,'33-lash-margin',56,3,(u,v)=>{
    const y=upper(u)+(v-.25)*(.002+.014*limit(u));
    return [xAt(u),y,depth(u,1)+.006];
  },'face-ink');
  strip(parts,'33-brow',38,3,(u,v)=>{
    const x=xAt(.92*u),y=cy+.099+.019*limit(u)-.005*u+(v-.5)*(.005+(female?.015:.022)*limit(u));
    const z=ray(x,y);return [x,y,(Number.isFinite(z)?z:rim(x))+.004];
  },'face-ink');
}
export function faceForm(s){
  const base=foundation(s);if(s.designStyle!=='manga')return base;
  if(cache.has(base))return cache.get(base);
  const chin=base.landmarks.chin[1],parts=[];
  if(s.heads<=4){
    const chosen=improveProfile({...s,heads:4});
    const factor=4-s.heads;
    const seen=new Map();
    parts.push(base.parts[0]);
    for(const mesh of chosen.parts.slice(1)){
      if(!seen.has(mesh.vertices))seen.set(mesh.vertices,mesh.vertices.map(v=>{
        const [x,y,z]=v.p,h=y-chosen.landmarks.chin[1],a=.040*factor;
        const dh=1-a*4*(1-2*h);
        return {...v,p:[x*(1+.065*factor),chin+h-4*a*h*(1-h),z*(1+.032*factor)],n:norm([v.n[0]/(1+.065*factor),v.n[1]/dh,v.n[2]/(1+.032*factor)])};
      }));
      parts.push({...mesh,vertices:seen.get(mesh.vertices)});
    }
  }else{
    const body=base.parts[0],shared=base.parts.filter(p=>p.vertices===body.vertices);
    const faces=shared.flatMap(p=>p.faces);
    function relief([x,y,z]){
      const h=y-chin;if(h<-.01||h>.82)return 0;
      const ax=Math.abs(x),front=ramp(.30,.48,z);
      return front*(.026*bell(ax,.14,.14)*bell(h,.56,.065)-.028*bell(x,0,.065)*bell(h,.50,.048)
       -.038*bell(x,0,.083)*bell(h,.33,.085)+.020*bell(ax,.235,.105)*bell(h,.365,.083)
       +.022*bell(x,0,.12)*bell(h,.175,.052)-.015*bell(x,0,.10)*bell(h,.117,.031)+.025*bell(x,0,.16)*bell(h,.053,.071));
    }
    const sculpted=body.vertices.map(v=>{
      const [x,y,z]=v.p,h=y-chin;
      const taper=1-.085*bell(h,.13,.15)*ramp(.22,.48,z);
      return {...v,p:[x*taper,y,z+relief(v.p)]};
    });
    const shaded=normals(sculpted,faces).map((v,i)=>{
      const h=v.p[1]-chin,w=ramp(-.025,.06,h)*(1-ramp(.65,.83,h));
      return w?{...v,n:norm(v.n.map((n,k)=>n*w+body.vertices[i].n[k]*(1-w)))}:{...v,n:body.vertices[i].n};
    });
    for(const mesh of shared)parts.push({...mesh,vertices:shaded});
    const ray=frontRay(shaded,faces.filter(f=>f.every(i=>shaded[i].p[1]>chin-.02)),s.heads);
    for(const eye of base.parts.filter(p=>p.name==='study-eyeball')){
      const ex=eye.vertices[0].p[0];adultEyes(parts,ray,chin,Math.sign(ex),s.sex==='female',ex);
    }
    const mouthLines=base.parts.filter(p=>p.name==='surface-mouth-line');
    for(const mesh of mouthLines)parts.push({...mesh,vertices:mesh.vertices.map(v=>({...v,p:[v.p[0],v.p[1],v.p[2]+relief(v.p)+.003]}))});
    for(const mesh of base.parts)if(!shared.includes(mesh)&&!mouthLines.includes(mesh)&&!/eye|brow|iris|pupil|lash/i.test(mesh.name))parts.push(mesh);
  }
  const result={...base,parts};cache.set(base,result);return result;
}
