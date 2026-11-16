import {frontRay} from './continuous/body.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function atX(line,x){
  const ordered=line.slice().sort((a,b)=>a[0]-b[0]);if(x<=ordered[0][0])return ordered[0][1];
  for(let i=1;i<ordered.length;i++){const a=ordered[i-1],b=ordered[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/Math.max(.00001,b[0]-a[0]);}
  return ordered.at(-1)[1];
}
export function describeFront(record){
  const aspect=record.views[0].height/record.views[0].width;
  const lines=record.extra.lines.slice(0,2),marks=record.frontMarks;
  return lines.map(({points},j)=>{
    const xs=points.map(p=>p[0]),left=Math.min(...xs),right=Math.max(...xs),width=right-left;
    const low=points.reduce((a,b)=>b[1]>a[1]?b:a);
    const center=(left+right)/2,midline=(lines[0].points.at(-1)[0]+lines[1].points[0][0])/2;
    // Inner edge is often visible much higher than the outer root. Use only the middle
    // portion when estimating the bowl, and keep its observed left/right imbalance.
    const x0=center-width*.38,x1=center+width*.38,baseline=(atX(points,x0)+atX(points,x1))/2;
    const marker=marks[j],bottom=atX(points,marker[0]),bowl=(low[1]-baseline)*aspect/width;
    return {width,low:clamp((low[0]-center)/width,-.4,.4),bowl:clamp(bowl,.035,.42),
      reach:clamp(width/Math.max(1,Math.abs(center-midline)),1.18,2.35),
      marker:clamp((marker[0]-center)/width,-.39,.39),above:clamp((bottom-marker[1])*aspect/width,.015,.47),
      curve:Array.from({length:25},(_,i)=>(atX(points,left+width*i/24)-baseline)*aspect/width)};
  });
}
function along(values,q){q=clamp(q,0,1)*(values.length-1);const i=Math.floor(q);return values[i]+(values[Math.min(i+1,values.length-1)]-values[i])*(q-i);}
export function shapeFromFront(vertices,scene,record,preset){
  const outline=record.lines[0].points,view=record.views[record.active],ar=view.width/view.height;
  const sign=Math.sign(record.marks[1][0]-outline[0][0]),start=outline[0],end=outline.at(-1);
  const rise=Math.max(1,...outline.map(p=>p[1]-start[1])),endLevel=Math.max(.45,(end[1]-start[1])/rise);
  const section=outline.map(([x,y])=>{const t=(y-start[1])/rise;
    return [Math.max(0,sign*(x-start[0]-(end[0]-start[0])*t/endLevel)*ar/rise),t];});
  const lengths=[0];for(let i=1;i<section.length;i++)lengths.push(lengths[i-1]+Math.hypot(section[i][0]-section[i-1][0],section[i][1]-section[i-1][1]));
  const arcAt=t=>{const pos=clamp(t,0,1)*lengths.at(-1);let i=1;while(i<lengths.length-1&&lengths[i]<pos)i++;
    const q=(pos-lengths[i-1])/Math.max(1e-9,lengths[i]-lengths[i-1]);return section[i-1].map((v,k)=>v+q*(section[i][k]-v));};
  const front=describeFront(record),{width,length,responses}=scene.tissue34,hp=scene.joints.right.hip[1];
  const cx=preset[5]*width,cy=hp+preset[4]*length,rootX=preset[0]*width,under=scene.fit35?.section?.under??record.lowerGap;
  const rest=scene.parts[0].vertices,top=cy+length*preset[1]*.95,bottom=cy-length*(preset[2]+.38*preset[7]);
  const span=top-bottom,hPhoto=span/endLevel;
  const maxDepth=Math.max(.01,...section.map(v=>v[0])),depthScale=Math.min(hPhoto,width*.68/maxDepth);
  function centerDepth(y){let sum=0,w=0;for(const v of rest){const p=v.p;
    if(p[2]<=0||Math.abs(p[0])>.07*width||Math.abs(p[1]-y)>.045*length)continue;sum+=p[2];w++;}
    return w?sum/w:.36*width;}

  const stripFaces=scene.parts[0].faces.filter(ids=>ids.every(i=>rest[i].p[1]>=bottom-.17*length&&rest[i].p[1]<=top+.13*length));
  const ray=frontRay(rest,stripFaces,scene.height);
  const boundary=Array.from({length:121},(_,k)=>{const x=width*k/100;
    const evaluate=y=>{const measured=ray(x,y);return Number.isFinite(measured)?measured:centerDepth(y)-width*.32*(x/width)**2;};
    return [evaluate(top),evaluate(bottom)];});
  const anchors=[],poseResponses=responses.slice();
  for(let j=0;j<2;j++){
    const side=j?1:-1,f=front[j],baseWidth=2*rootX;
    const anchorX=side*cx+f.marker*baseWidth;
    anchors.push({x:anchorX,y:cy-length*preset[2]*.61-width*(.12+f.bowl*.30)+f.above*baseWidth});
  }
  const shaped=vertices.map((v,i)=>{
    const r=responses[i],hand=Math.sign(rest[i].p[0])||1,relativeX=Math.abs(rest[i].p[0])/width;
    if(relativeX>1.12||rest[i].p[2]<.11*width)return v;
    const f=front[hand>0?1:0],dx=(rest[i].p[0]-hand*cx)/rootX,ty=(v.p[1]-cy)/length;
    const soft=Math.pow(clamp(r?.free||0,0,1),.84),q=clamp((dx+1)*.5,0,1),lower=clamp((.12-ty)/.19,0,1);
    const edge=along(f.curve,q),sideDepth=Math.max(0,1-dx*dx);
    const sag=clamp(.092+.82*f.bowl+.20*under+.49*edge,.015,.51);
    const [x,y,z]=v.p,restY=rest[i].p[1],u=(top-restY)/span;
    const pushX=rootX*soft*(.19*f.low+.075*dx*(f.reach-1.6))*lower;
    let smoothY=y-width*sag*soft*(.24+.17*lower),smoothZ=z;
    if(u>0&&u<1&&Math.abs(dx)<1.04){
      const [depth,level]=arcAt(u),relative=Math.abs(dx);
      // Frontal landmarks set the width of the lower bowl. Toward its rim,
      // flatten the drop across the middle, then turn the skin back to the ribs.
      const spread=clamp((1.04-relative)/.43,0,1),across=spread*spread*(3-2*spread);
      const round=Math.sqrt(Math.max(0,1-Math.min(1,relative)**2));
      const weight=across*clamp((rest[i].p[2]/width-.11)/.20,0,1);
      const at=clamp(relativeX*100,0,119.999),lo=Math.floor(at),k=at-lo;
      const [upper,underWall]=boundary[lo].map((v,j)=>v+(boundary[lo+1][j]-v)*k);
      const wall=upper+(underWall-upper)*level/endLevel;

      const rimDifference=along(f.curve,.5)-edge;
      const levelWeight=clamp((u-.28)/.38,0,1)*clamp((1-u)/.15,0,1);
      const aimY=top-hPhoto*level+2*rootX*rimDifference*levelWeight;
      const aimZ=wall+depthScale*depth*round;
      const load=weight*Math.sin(Math.PI*u)**.75;
      poseResponses[i]={side:hand,outer:r?.outer||0,free:Math.max(r?.free||0,load),lower:Math.max(r?.lower||0,load*lower)};

      smoothY+=weight*(aimY-smoothY);smoothZ+=weight*(aimZ-smoothZ);
    }
    if(record.underFit&&u>0&&u<1&&Math.abs(dx)<1.10){
      const sideFalloff=Math.exp(-2.6*dx*dx)*clamp((1.10-Math.abs(dx))/.27,0,1);
      const gate=sideFalloff*clamp((rest[i].p[2]/width-.07)/.23,0,1)*Math.min(1,u/.05,(1-u)/.05);
      smoothY+=width*gate*along(record.underFit.dy,u);
      smoothZ+=width*gate*along(record.underFit.dz,u);
    }
    return {...v,p:[x+pushX,smoothY,smoothZ]};
  });
  // A local mean-curvature relaxation blunts irregular rings from the finite profile fit.
  const adjacency=Array.from({length:vertices.length},()=>[]),mesh=scene.parts[0];
  for(const [a,b,c] of mesh.faces){if(responses[a]||responses[b]||responses[c]){
    adjacency[a].push(b,c);adjacency[b].push(c,a);adjacency[c].push(a,b);
  }}
  let current=shaped;
  for(let it=0;it<2;it++){const before=current;current=before.map((v,i)=>{
    const strength=Math.min(.44,(responses[i]?.free||0)*.65),ns=adjacency[i];if(!strength||!ns.length)return v;
    const p=v.p.map((coord,k)=>coord+strength*(ns.reduce((sum,j)=>sum+before[j].p[k],0)/ns.length-coord));
    return {...v,p};
  });}
  return {vertices:current,anchors,front,poseResponses};
}
