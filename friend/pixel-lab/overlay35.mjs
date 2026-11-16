import {projectPoint} from './renderer.mjs';
import {types} from './bust34.mjs';
const avg=points=>[0,1].map(k=>points.reduce((s,p)=>s+p[k],0)/points.length);
const span=(p,k)=>Math.max(...p.map(v=>v[k]))-Math.min(...p.map(v=>v[k]));
const nearest=(ps,a)=>ps.reduce((v,w)=>Math.hypot(w[0]-a[0],w[1]-a[1])<Math.hypot(v[0]-a[0],v[1]-a[1])?w:v);
function resample(ps,count=60){
  const lens=[0];for(let i=1;i<ps.length;i++)lens.push(lens[i-1]+Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]));
  return Array.from({length:count},(_,j)=>{const q=lens.at(-1)*j/(count-1);let i=1;while(i<ps.length-1&&lens[i]<q)i++;
    const t=(q-lens[i-1])/Math.max(1e-9,lens[i]-lens[i-1]);return ps[i-1].map((v,k)=>v+t*(ps[i][k]-v));});
}
function atRow(mesh,n,row){return mesh.vertices.slice(n*row,n*(row+1)).map(v=>v.p);}
function featureLines(scene,img){
  const line=(name,n,row)=>scene.parts.filter(m=>m.name===name).filter((m,i,all)=>all.findIndex(a=>a.vertices===m.vertices)===i).map(m=>atRow(m,n,row).map(p=>projectPoint(img,p)).sort((a,b)=>a[0]-b[0]));
  const upper=line('eye34',53,20),lower=line('eye34',53,0),mouth=line('mouth-line34',43,2),brow=line('brow34',33,1);
  return {upper,lower,mouth,brow};
}
function match(a,b){
  if(!a||!b||a.length<2||b.length!==a.length)return null;
  const ac=avg(a),bc=avg(b);let d=0,m=0,n=0;
  a.forEach(([x,y],i)=>{x-=ac[0];y-=ac[1];const u=b[i][0]-bc[0],v=b[i][1]-bc[1];d+=x*x+y*y;m+=x*u+y*v;n+=x*v-y*u;});
  if(d<1e-6)return null;
  const c=m/d,s=n/d,tx=bc[0]-c*ac[0]+s*ac[1],ty=bc[1]-s*ac[0]-c*ac[1];
  return {matrix:[c,s,-s,c,tx,ty],at:([x,y])=>[c*x-s*y+tx,s*x+c*y+ty],scale:Math.hypot(c,s)};
}
function signedImageWidth(img,row,dir){
  if(row<0||row>=img.height)return null;
  for(let k=0;k<img.width;k++){const x=dir>0?img.width-1-k:k;if(img.data[4*(row*img.width+x)+3]>127)return x;}
  return null;
}
export function visibleFaceEdge(scene,img,dir){
  const chin=scene.landmarks.chin[1],mesh=scene.parts[0];
  const skin=mesh.vertices.filter(v=>Math.abs(v.p[0])<.065&&v.p[2]>.25&&v.p[1]>chin-.025&&v.p[1]<chin+.57);
  if(!skin.length)return [];
  const pix=skin.map(v=>projectPoint(img,v.p)),top=Math.max(0,Math.floor(Math.min(...pix.map(p=>p[1])))),bot=Math.min(img.height-1,Math.floor(Math.max(...pix.map(p=>p[1]))));
  return Array.from({length:Math.max(0,bot-top+1)},(_,i)=>{const y=top+i,x=signedImageWidth(img,y,dir);return x===null?null:[x,y];}).filter(Boolean);
}
export function sliceThroughSurface(scene,x,top,foot,count=65){
  const mesh=scene.parts[0],rest=scene.restSkin35||mesh.vertices,points=Array(count).fill(null),depths=Array(count).fill(-Infinity);
  for(const ids of mesh.faces){
    const ps=ids.map(i=>rest[i].p),[a,b,c]=ps;
    if(Math.max(a[0],b[0],c[0])<x||Math.min(a[0],b[0],c[0])>x)continue;
    const high=Math.max(a[1],b[1],c[1]),low=Math.min(a[1],b[1],c[1]);
    if(high<foot||low>top||Math.max(a[2],b[2],c[2])<=0)continue;
    const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;
    const from=Math.max(0,Math.ceil((top-high)/(top-foot)*(count-1))),to=Math.min(count-1,Math.floor((top-low)/(top-foot)*(count-1)));
    for(let k=from;k<=to;k++){
      const y=top+(foot-top)*k/(count-1),wa=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,wb=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,wc=1-wa-wb;
      if(Math.min(wa,wb,wc)<-1e-7)continue;
      const z=wa*a[2]+wb*b[2]+wc*c[2];if(z<=depths[k])continue;depths[k]=z;
      points[k]=[0,1,2].map(d=>wa*mesh.vertices[ids[0]].p[d]+wb*mesh.vertices[ids[1]].p[d]+wc*mesh.vertices[ids[2]].p[d]);
    }
  }
  return points.filter(Boolean);
}
function chestFrame(scene){
  const sh=scene.joints.right.shoulder,hp=scene.joints.right.hip,len=sh[1]-hp[1],w=Math.abs(sh[0]);
  const p=types.find(k=>k[0]===(scene.fit35?.type||'balanced'))[2],cx=w*p[5],cy=hp[1]+p[4]*len;
  return {p,cx,cy,len,w,top:cy+p[1]*len*.95,foot:cy-len*(p[2]+.38*p[7])};
}
export function section(scene,img){
  const {cx,top,foot}=chestFrame(scene);return sliceThroughSurface(scene,cx,top,foot).map(p=>projectPoint(img,p));
}
function frontRims(scene,img){
  const {cx,cy,w,p,len,top,foot}=chestFrame(scene),rings=[];
  for(const side of [-1,1]){
    const rim=[];for(let k=0;k<25;k++){
      const dx=(k/24*2-1)*p[0]*w*.92,x=cx*side+dx,cut=sliceThroughSurface(scene,x,top,foot,36);
      if(cut.length<9)continue;
      const tip=cut.reduce((a,b)=>a[2]>b[2]?a:b);let low=tip,score=-Infinity;
      // Select the bottom bend of the foreground tissue before it returns to the
      // wall. A visibility weight discounts the shallow posterior tail of the cut.
      for(const v of cut.slice(cut.indexOf(tip))){const s=(cy-v[1])+.38*(v[2]-tip[2]);
        if(s>score){score=s;low=v;}}
      rim.push(projectPoint(img,low));
    }
    rings.push(rim);
  }
  return rings;
}
export function comparisonAngle(r,index){
  if(r.blindView?.index===index)return r.blindView.yaw;
  if(r.extra?.index===index)return r.extra.yaw;
  if(r.kind==='chest')return index===r.active?Math.sign(r.marks[1][0]-r.marks[0][0])*90:0;
  const label=r.views[index].label;return r.id==='F08'&&index===r.active?-28:label.includes('측면')?90:label.includes('사선')?35:0;
}
export function registerModel(scene,img,r,index){
  const v=r.views[index],w=v.width*(v.box[2]-v.box[0]),h=v.height*(v.box[3]-v.box[1]),xy=p=>[p[0]*w/100,p[1]*h/100];
  const main=index===r.active,extra=index===r.extra?.index,blind=index===r.blindView?.index;
  if(!main&&!extra&&!blind)return null;
  const ref=main?r.lines:blind?r.blindView.lines:r.extra.lines,visible=part=>ref.filter(v=>v.part===part).map(l=>l.points.map(xy));
  let registration,reason='',pairs=[];
  if(r.kind==='face'){
    const f=featureLines(scene,img);
    if(!f.upper.length)return null;
    if(blind){
      const a=[],b=[];for(let i=0;i<2;i++){if(!r.blindView.marks[i])continue;a.push(avg([...f.upper[i],...f.lower[i]]));b.push(xy(r.blindView.marks[i]));}
      if(a.length<2){
        if(!r.blindView.lines.length)return null;
        a.push(avg(f.mouth[0]));b.push(avg(r.blindView.lines[0].points.map(xy)));
      }
      registration=match(a,b);if(ref.length)pairs.push([f.mouth[0],ref[0].points.map(xy)]);reason='별도 작화 · 눈 중심 정합 · 입선 대조';
    }else if(main){
      const a=[],b=[];for(let i=0,j=0;i<2;i++)if(r.marks[i]){
        a.push(avg([...f.upper[i],...f.lower[i]]));b.push(xy(r.marks[i]));pairs.push([f.upper[i],visible('윗눈꺼풀')[j]],[f.lower[i],visible('아랫눈꺼풀')[j]]);j++;}
      if(a.length===1&&r.marks[2]){a.push(avg(f.mouth[0]));b.push(xy(r.marks[2]));}
      if(a.length===1){const u=pairs[0][0],s=pairs[0][1];a.push(u.at(-1));b.push(s.at(-1));}
      if(r.marks[2])pairs.push([f.mouth[0],visible('입선')[0]]);
      for(const [j,k] of ['왼눈썹','오른눈썹'].entries())if(visible(k).length)pairs.push([f.brow[j],visible(k)[0]]);
      registration=match(a,b);reason='눈 중심 정합'+(r.marks.slice(0,2).filter(Boolean).length===1?' · 가림 쪽 제외':'');
    }else if(['옆얼굴','가린 턱 앞부분','코·턱 윤곽','드러난 코끝'].includes(ref[0].part)){
      const curve=visibleFaceEdge(scene,img,r.extra.yaw===270?-1:1),s=ref[0].points.map(xy);
      if(curve.length<3)return null;
      const orig=curve.slice(0,Math.max(3,Math.round(curve.length*(ref[0].part==='드러난 코끝'?.5:1))));
      const down=s.reduce((a,b)=>a[1]>=b[1]?a:b),i=s.indexOf(down),src=s.slice(0,i+1);
      registration=match([orig[0],orig.at(-1)],[src[0],src.at(-1)]);pairs=[[orig,src]];reason='보이는 측면 윤곽의 위·아래 정합';
    }else{
      const item=ref.find(l=>l.part.includes('입'))||ref[0],s=item.points.map(xy);
      const model=item.part.includes('눈')?f.upper.at(-1):f.mouth[0];
      const a=model.slice().sort((p,q)=>p[0]-q[0]),b=s.slice().sort((p,q)=>p[0]-q[0]);
      registration=match([a[0],a.at(-1)],[b[0],b.at(-1)]);pairs=[[model,s]];reason='국소 눈·입 양끝 정합 · 얼굴 전체 위치는 미확정';
    }
  }else if(main){
    const m=section(scene,img,null,r),s=r.lines[0].points.map(xy);if(m.length<3)return null;
    const tips=ps=>ps.reduce((a,b)=>img.coordinates.yaw===270?(a[0]<b[0]?a:b):(a[0]>b[0]?a:b));
    const st=xy(r.marks[1]);registration=match([m[0],tips(m)],[s[0],st]);pairs=[[m,s]];reason='상단·전방점 정합 · 같은 피부점을 이은 종단선';
  }else if(blind){
    const {cx,cy,w,top,foot}=chestFrame(scene),j=r.blindView.yaw>0?0:1,side=j?1:-1;
    const l=frontRims(scene,img)[j],s=ref[0].points.map(xy),target=xy(r.blindView.marks[0]),nac=scene.surfaceAnchors?.[j]||{x:side*cx,y:cy};
    const cut=sliceThroughSurface(scene,nac.x,top,foot),apex=cut.reduce((a,b)=>Math.abs(a[1]-nac.y)<Math.abs(b[1]-nac.y)?a:b);
    const a=projectPoint(img,apex),mw=Math.max(1,span(l,0)),sw=Math.max(1,span(s,0));
    registration=match([a,[a[0]+mw,a[1]]],[target,[target[0]+sw,target[1]]]);pairs=[[l,s]];reason='별도 사선 사진 · 가까운 쪽 표식과 밑선의 가로 폭 정합';
  }else{
    const sh=scene.joints.right.shoulder,hp=scene.joints.right.hip,ws=Math.abs(sh[0]);
    const anchors=scene.surfaceAnchors||[-1,1].map(side=>({x:side*ws*.50,y:hp[1]+(sh[1]-hp[1])*.75}));
    const proj=anchors.map(v=>projectPoint(img,[v.x,v.y,.5*ws]));registration=match(proj,r.frontMarks.map(xy));reason='정면 좌우 표식 정합 · 피부 종단면에서 추출한 하부 반환선';const rims=frontRims(scene,img),refLines=r.extra.lines.slice(0,2);pairs=rims.map((l,i)=>[l,refLines[i].points.map(xy)]);
  }
  if(!registration||registration.scale<1e-6)return null;
  let sum=0,n=0;const lines=[];
  for(const [model,source] of pairs)if(model?.length>1&&source?.length>1){
    const m=resample(model.map(registration.at)),s=resample(source);lines.push(m);
    for(const [a,b] of [[m,s],[s,m]])for(const p of a){const q=nearest(b,p);sum+=(p[0]-q[0])**2+(p[1]-q[1])**2;n++;}
  }
  return {matrix:registration.matrix,lines,reason,error:n?Math.sqrt(sum/n)/Math.hypot(w,h):null};
}
