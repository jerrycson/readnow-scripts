import {norm} from './geometry.mjs';
import {bell,clamp,ramp} from './region33.mjs';

const cache=new WeakMap();
// Front facial surface in head-length coordinates, anchored at the chin.
function skinDepth(x,h,female){
  const a=Math.abs(x),curve=.71*x*x+6.9*x**4;
  const cheek=.012*bell(a,.205,.103)*bell(h,.35,.10);
  const brow=.016*bell(a,.15,.11)*bell(h,.59,.075);
  const socket=-.022*bell(a,.165,.105)*bell(h,.475,.076);
  const bridge=(female?.064:.079)*bell(x,0,.052)*bell(h,.405,.133);
  const tip=(female?.078:.091)*bell(x,0,.067)*bell(h,.301,.051);
  const wing=.018*bell(a,.052,.025)*bell(h,.277,.025);
  const cupid=.022*bell(x,0,.104)*bell(h,.192,.028);
  const lower=.019*bell(x,0,.095)*bell(h,.147,.030);
  const chin=.025*bell(x,0,.14)*bell(h,.057,.050);
  return .637-curve+(cheek+brow+socket+bridge+tip+wing+cupid+lower+chin)
    -.013*bell(x,0,.087)*bell(h,.246,.026)-.016*bell(x,0,.10)*bell(h,.108,.026);
}
function skinNormal(x,h,female){
  const d=.001,f=(x,h)=>skinDepth(x,h,female);
  return norm([-(f(x+d,h)-f(x-d,h))/(2*d),-(f(x,h+d)-f(x,h-d))/(2*d),1]);
}
// Shared parametrization keeps all pigment on the same convex eye, including at a profile.
function patch(parts,name,cols,rows,at,material){
  const vertices=[],groups=new Map();
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++)vertices.push(at(2*i/cols-1,j/rows));
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const a=j*(cols+1)+i,b=a+cols+1;
    const k=typeof material==='string'?material:material(2*(i+.5)/cols-1,(j+.5)/rows);
    if(!groups.has(k))groups.set(k,[]);groups.get(k).push([a,a+1,b],[a+1,b+1,b]);
  }
  for(const [mat,faces] of groups)parts.push({name,vertices,faces,mat});
}
function features(parts,chin,female,heads){
  const cy=.465+(heads-6.5)*.0017,rx=(female?.132:.123)*(1+(7-heads)*.014),cx=female?.166:.163;
  const point=(x,h,d=0)=>({p:[x,h+chin,skinDepth(x,h,female)+d],n:skinNormal(x,h,female)});
  for(const side of [-1,1]){
    const x=u=>side*(cx+u*rx);
    const arc=u=>Math.max(0,1-u*u)**.74;
    const line=u=>cy+(female?.017:.019)*u;
    const top=u=>line(u)+(female?.058:.047)*arc(u)*(1+.12*u);
    const bottom=u=>line(u)-(female?.039:.028)*arc(u);
    // The original eye cavity has an open rim. The infill meets the remapped skin tangentially.
    patch(parts,'cheek-orbit34',36,16,(u,v)=>{
      const a=u*.172,span=.116*Math.sqrt(Math.max(0,1-u*u));
      return point(side*cx+a,cy+(2*v-1)*span,.001);
    },'complexion34');
    const bulge=(u,v)=>.003+.014*arc(u)*(1-.65*(2*v-1)**2);
    patch(parts,'eye34',52,20,(u,v)=>point(x(u),bottom(u)+(top(u)-bottom(u))*v,bulge(u,v)),(u,v)=>{
      const h=bottom(u)+(top(u)-bottom(u))*v;
      const ix=(u+.045)/(female?.48:.43),iy=(h-cy-.006)/(female?.069:.052),r=ix*ix+iy*iy;
      if(r>1)return 'portrait-sclera';
      if((ix+side*.27)**2+(iy-.38)**2<.069)return 'sclera';
      if(r>.89||iy>.72||ix*ix/.19+iy*iy/.24<1)return 'portrait-pupil';
      return 'iris34';
    });
    patch(parts,'lid34',44,3,(u,v)=>{
      const outer=ramp(.55,1,u),h=top(u)+(.004+.021*arc(u)+.008*outer)*(v-.16);
      return point(x(u)+side*.014*outer,h+.009*outer,bulge(u,1)+.004);
    },'face-ink');
    patch(parts,'lower-lid34',24,2,(u,v)=>{
      const a=.36+(u+1)*.32;return point(x(a),bottom(a)+(.002+.006*arc(u))*v,bulge(a,0)+.004);
    },'study-upper-lip');
    patch(parts,'brow34',32,3,(u,v)=>{
      const h=cy+(female?.108:.09)+.018*arc(u)+(female?.002:.014)*u;
      const w=(.006+(female?.014:.025)*arc(u))*(1-.32*u);
      return point(x(u*.91),h+w*(v-.5),.0035);
    },'face-ink');
  }
  for(const side of [-1,1])patch(parts,'alar-crease34',20,3,(u,v)=>{
    const x=side*(.044+.018*u),h=.276+.004*u+.006*u*u+.005*(1-u*u)*(v-.5);
    return point(x,h,.003);
  },'study-upper-lip');
  const width=female?.117:.122;
  function mouth(u){return .167+.018*u*u+.007*bell(Math.abs(u),.36,.23);}
  patch(parts,'upper-lip34',36,4,(u,v)=>{const bow=.016*bell(Math.abs(u),.33,.26)+.004*(1-u*u);return point(u*width,mouth(u)+bow*v,.003);},'study-upper-lip');
  patch(parts,'lower-lip34',36,4,(u,v)=>point(u*width,mouth(u)-(.006+.019*(1-u*u))*v,.0027),'study-lower-lip');
  patch(parts,'mouth-line34',42,4,(u,v)=>{
    const h=mouth(u);return point(u*width,h+(.002+.014*(1-u*u))*(v-.4),.005);
  },'mouth-ink34');
}
export function face34(scene,s){
  if(s.heads<5||s.designStyle!=='manga')return scene;
  if(cache.has(scene))return cache.get(scene);
  const chin=scene.landmarks.chin[1],female=s.sex==='female',skin=scene.parts[0].vertices;
  const vertices=skin.map(v=>{
    const [ox,y,z]=v.p,h=y-chin,a=Math.abs(ox);
    const jawGate=ramp(-.042,.045,h)*(1-ramp(.22,.42,h))*ramp(.12,.35,z);
    const x=ox*(1-(female?.19:.11)*jawGate);
    if(h<-.025||h>.77||z<.27||a>.344)return x===ox?v:{...v,p:[x,y,z]};
    const blend=ramp(.27,.47,z)*(1-ramp(.259,.344,a))*ramp(-.025,.048,h)*(1-ramp(.63,.77,h));

    const nz=skinDepth(x,h,female),n=skinNormal(x,h,female);
    const jawLift=.040*bell(h,.115,.105)*ramp(.054,.23,a)*ramp(.21,.43,z);
    return {...v,p:[x,y+jawLift,z+(nz-z)*blend],n:norm(v.n.map((k,i)=>k*(1-blend)+n[i]*blend))};
  });
  const parts=[];
  for(const m of scene.parts){
    if(m.vertices===skin){
      const head=[],body=[];for(const f of m.faces)(f.every(i=>vertices[i].p[1]>chin-.018)?head:body).push(f);
      if(body.length)parts.push({...m,vertices,faces:body});
      if(head.length)parts.push({...m,name:'portrait-skin34',vertices,faces:head,mat:'complexion34'});continue;
    }
    if(!/33-|eye|brow|lash|pupil|iris|mouth-line|nose-under-wing/i.test(m.name))parts.push(m);
  }
  features(parts,chin,female,s.heads);
  const out={...scene,parts};cache.set(scene,out);return out;
}
