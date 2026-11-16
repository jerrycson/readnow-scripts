import {surfaceValues,surfaceDefaults} from './surface-settings35.mjs';
const TAU=2*Math.PI;
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
function surfaceAt(triangles,x,y){
  let hit=null,highest=-Infinity;
  for(const t of triangles){
    if(x<t.left||x>t.right||y<t.bottom||y>t.top)continue;
    const [a,b,c]=t.pos,wa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/t.den,
      wb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/t.den,wc=1-wa-wb;
    if(Math.min(wa,wb,wc)<-1e-7)continue;
    const z=wa*a[2]+wb*b[2]+wc*c[2];
    if(z>highest){hit={ids:t.ids,weights:[wa,wb,wc]};highest=z;}
  }
  return hit;
}
export function bindSurface(rest,settings){
  const config=surfaceValues(settings.sex==='male'?{...surfaceDefaults,showNac:settings.showNac}:settings);
  if(!config.showNac||settings.top!=='none'||settings.species!=='human')return null;
  const {vertices,faces}=rest.parts[0],width=Math.abs(rest.joints.right.shoulder[0]),hip=rest.joints.right.hip[1],
    height=rest.joints.right.shoulder[1]-hip,female=settings.sex==='female',yAt=t=>hip+t*height;
  const triangles=[];
  for(const ids of faces){
    const pos=ids.map(i=>vertices[i].p),xs=pos.map(p=>p[0]),ys=pos.map(p=>p[1]);
    if(Math.max(...ys)<yAt(.42)||Math.min(...ys)>yAt(1.04)||Math.max(...pos.map(p=>p[2]))<0)continue;
    const [a,b,c]=pos,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(den)>1e-9)triangles.push({ids,pos,den,left:Math.min(...xs),right:Math.max(...xs),bottom:Math.min(...ys),top:Math.max(...ys)});
  }
  const aspect=.70+.60*config.areolaAspect, diameter=width*(female?.23:.16)*(.55+.90*config.areolaDiameter);
  const rx=diameter/(2*Math.sqrt(aspect)),ry=rx*aspect;
  const radius=width*(female?.036:.021)*(.48+1.04*config.nippleDiameter);
  const tipRadius=Math.min(radius,.76*Math.min(rx,ry)),protrusion=width*(female?.085:.027)*config.nippleHeight;
  const bindings=[],sections=24,ringScales=[.001,.36,.70,1];
  const patch=(side,center,component)=>{
    const rings=component==='papilla'?ringScales:[0,.50,.89,1];
    const points=[],faces=[];
    for(const scale of rings){
      for(let i=0;i<sections;i++){
        const a=i*TAU/sections,outer=component==='areola';
        const radiusX=outer?tipRadius*.93+(rx-tipRadius*.93)*scale:tipRadius*scale;
        const radiusY=outer?tipRadius*.93+(ry-tipRadius*.93)*scale:tipRadius*scale;
        const x=center[0]+Math.cos(a)*radiusX,y=center[1]+Math.sin(a)*radiusY;
        const hit=surfaceAt(triangles,x,y);
        if(!hit)return null;
        const tip=config.nippleShape==='plateau'?1-scale**4:config.nippleShape==='taper'?1-scale:
          config.nippleShape==='inset'?Math.sin(Math.PI*scale)**1.3*(.55+.25*scale):Math.sqrt(Math.max(0,1-scale*scale));
        points.push({...hit,offset:width*.0023+(outer?width*.002*(1-scale):width*.0025+protrusion*tip)});
      }
    }
    for(let k=0;k<rings.length-1;k++)for(let i=0;i<sections;i++){
      const a=k*sections+i,b=k*sections+(i+1)%sections,c=a+sections,d=b+sections;
      faces.push([a,c,b],[b,c,d]);
    }
    if(component==='papilla')for(let i=1;i<sections-1;i++)faces.push([0,i,i+1]);
    return {side,component,points,faces};
  };
  for(const side of [-1,1]){
    let cx=.52,cy=female?.746:.765;
    if(rest.tissue34){
      let total=0,px=0,py=0;
      rest.tissue34.responses.forEach((r,i)=>{if(r?.side!==side||r.free<.83)return;
        const p=vertices[i].p,w=r.free**6;total+=w;px+=w*p[0];py+=w*p[1];});
      if(total){cx=Math.abs(px/total/width);cy=(py/total-hip)/height-.010;}
    }
    const measured=rest.surfaceAnchors?.[side>0?1:0];
    const baseCenter=[width*side*cx,yAt(cy)];
    const center=measured?[baseCenter[0]+.72*(measured.x-baseCenter[0]),baseCenter[1]+.65*(measured.y-baseCenter[1])]:baseCenter;
    for(const t of [1,.8,.6,.4,.2,0]){
      const at=center.map((p,i)=>baseCenter[i]+t*(p-baseCenter[i]));
      const outer=patch(side,at,'areola'),inner=outer&&patch(side,at,'papilla');
      if(outer&&inner){bindings.push(outer,inner);break;}
    }
  }
  return bindings;
}
export function surfaceParts(bindings,posedMesh){
  if(!bindings)return [];
  return bindings.map(({side,component,points,faces})=>{
    const vertices=points.map(({ids,weights,offset})=>{
      const v=ids.map(i=>posedMesh.vertices[i]),mix=k=>[0,1,2].map(j=>v.reduce((s,t,i)=>s+weights[i]*t[k][j],0));
      const n=unit(mix('n')),p=mix('p').map((x,j)=>x+offset*n[j]);return {p,n};
    });
    // The raised tissue changes its own lighting, even in an oblique or profile view.
    const baseNormals=vertices.map(v=>v.n),sums=vertices.map(()=>[0,0,0]);
    for(const [a,b,c] of faces){
      const p=vertices[a].p,u=vertices[b].p.map((v,i)=>v-p[i]),v=vertices[c].p.map((v,i)=>v-p[i]);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const sign=n.reduce((s,v,i)=>s+v*baseNormals[a][i],0)<0?-1:1;
      for(const i of [a,b,c])for(let j=0;j<3;j++)sums[i][j]+=n[j]*sign;
    }
    vertices.forEach((v,i)=>{if(Math.hypot(...sums[i])>1e-10)v.n=unit(sums[i]);});
    return {name:component+'35-'+side,mat:component+'35',vertices,faces};
  });
}
