import {profileStudy} from './profile31.mjs';
import {norm,cross,sub,taper,ellipsoid} from './geometry.mjs';

// 같은 네 참고의 관찰만 적용한다. 옆눈은 얇은 홍채와 쐐기형 눈꺼풀,
// 코는 작은 정면 표식과 실제 돌출, 입은 윗입술→아랫입술→턱의 단차다.
// 참고 그림은 연구용으로만 보고 이 모듈에 그림이나 외부 메시를 넣지 않았다.
const references=[
  'research/pixel/references/jp-medibang-profile-eye.png',
  'research/pixel/references/jp-medibang-nose-front.png',
  'research/pixel/references/jp-palmie-profile-skull.png',
  'research/pixel/references/lips-planes26.jpg'
];
const cache=new Map(),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const bell=(x,c,r)=>Math.exp(-(((x-c)/r)**2));
function curve(rows,x){
  let i=0;while(i<rows.length-2&&x>rows[i+1][0])i++;
  const[x0,y0]=rows[i],[x1,y1]=rows[i+1],d=(y1-y0)/(x1-x0);
  const a=i?(y0-rows[i-1][1])/(x0-rows[i-1][0]):d;
  const b=i<rows.length-2?(rows[i+2][1]-y1)/(rows[i+2][0]-x1):d;
  const m0=a*d>0?2/(1/a+1/d):0,m1=b*d>0?2/(1/b+1/d):0,t=clamp((x-x0)/(x1-x0));
  return(2*t**3-3*t*t+1)*y0+(t**3-2*t*t+t)*(x1-x0)*m0+(-2*t**3+3*t*t)*y1+(t**3-t*t)*(x1-x0)*m1;
}
function normals(mesh){
  for(const v of mesh.vertices)v.n=[0,0,0];
  for(const ids of mesh.faces){const[a,b,c]=ids.map(i=>mesh.vertices[i].p),n=cross(sub(b,a),sub(c,a));for(const id of ids)for(let k=0;k<3;k++)mesh.vertices[id].n[k]+=n[k];}
  const weld=new Map();for(const v of mesh.vertices){const key=v.p.map(x=>x.toFixed(8)).join(':');if(!weld.has(key))weld.set(key,[0,0,0]);for(let k=0;k<3;k++)weld.get(key)[k]+=v.n[k];}
  for(const v of mesh.vertices)v.n=norm(weld.get(v.p.map(x=>x.toFixed(8)).join(':')));
  return mesh;
}
function surfaceNormal(fn,x,y){const e=.0001;return norm([-(fn(x+e,y)-fn(x-e,y))/(2*e),-(fn(x,y+e)-fn(x,y-e))/(2*e),1]);}

export function improveProfile(settings){
  const source=profileStudy(settings,'C'),key=settings.sex+':'+settings.candidate;
  if(cache.has(key))return cache.get(key);
  const chin=source.landmarks.chin[1],female=settings.sex==='female';
  const width=.50*(settings.candidate==='A'?.94:settings.candidate==='C'?1.06:1);
  const widths=[[0,0],[.05,.40],[.12,.64],[.22,.83],[.36,.96],[.50,1],[.65,.99],[.80,.91],[.92,.65],[1,0]];
  const depths=[[0,0],[.05,.30],[.12,.57],[.22,.80],[.36,.93],[.50,1],[.65,1],[.80,.91],[.92,.65],[1,0]];
  const centers=[[0,.13],[.12,.06],[.36,0],[.65,-.045],[1,0]];
  const jawScale=h=>1-.045*bell(h,.13,.14);
  function profile(h){const cap=Math.sqrt(Math.max(0,1-((h-.5)/.5)**2));return{rx:width*(h>=.5?cap:curve(widths,h))*jawScale(h),rz:.43*(h>=.5?cap:curve(depths,h)),z:curve(centers,h)};}
  function front(x,y){
    const h=clamp(y-chin),{rx,rz,z}=profile(h);
    if(h===0||h===1)return depth(z,0,h);
    const raw=z+rz*Math.sqrt(Math.max(0,1-(Math.abs(x)/Math.max(.00001,rx))**2.7))
      +.065*bell(x,0,.065)*bell(h,.30,.045)+.008*bell(x,0,.10)*bell(h,.195,.025)
      +.020*bell(Math.abs(x),width*.40,.17)*bell(h,.25,.075)
      +.012*bell(Math.abs(x),width*.40,.18)*bell(h,.54,.055)
      -.009*bell(Math.abs(x),width*.40,.12)*bell(h,.40,.080);
    return depth(raw,x,h);
  }
  function depth(raw,x,h){
    const t=clamp((raw+.04)/.21),gate=t*t*(3-2*t);
    const previous=.043*bell(x,0,.215)*bell(h,.055,.107)
      +bell(x,0,.105)*(.015*bell(h,.182,.040)-.003*bell(h,.127,.032))
      -.014*bell(x,0,.16)*bell(h,-.070,.077);
    // 눈확은 뒤로, 광대는 바깥으로 받친다. 중심 코와 인중은 분리한다.
    const orbit=-.020*bell(Math.abs(x),width*.42,.132)*bell(h,.405,.095);
    const cheek=.018*bell(Math.abs(x),width*.52,.135)*bell(h,.285,.080);
    const brow=.011*bell(Math.abs(x),width*.40,.15)*bell(h,.525,.060);
    const bridge=.027*bell(x,0,.040)*bell(h,.390,.100);
    const tip=.039*bell(x,0,.057)*bell(h,.303,.035);
    const ala=.012*bell(Math.abs(x),.055,.024)*bell(h,.286,.027);
    const philtrum=-.012*bell(x,0,.043)*bell(h,.242,.022);
    // 입술의 바탕도 두개골과 이어서 옆모습의 단차가 연속되게 한다.
    const upper=.022*bell(x,0,.080)*bell(h,.207,.018);
    const lower=.025*bell(x,0,.079)*bell(h,.170,.020);
    const fold=-.012*bell(x,0,.091)*bell(h,.132,.020);
    const mental=.032*bell(x,0,.16)*bell(h,.073,.060);
    return raw+gate*(previous+orbit+cheek+brow+bridge+tip+ala+philtrum+upper+lower+fold+mental);
  }
  const sourceHead=source.parts.find(p=>p.name==='chibi-skull-cheek-jaw');
  const head={...sourceHead,vertices:sourceHead.vertices.map((v,i)=>{
    const h=v.p[1]-chin,x=v.p[0]*jawScale(h),k=i%81,onFront=k<=40,{rz,z}=profile(h);
    return{...v,p:[x,v.p[1],onFront?front(x,v.p[1]):depth(z+rz*Math.sin(k/80*Math.PI*2),x,h)],n:[...v.n]};
  }),faces:sourceHead.faces};
  normals(head);
  const parts=source.parts.filter(p=>p!==sourceHead&&!p.name.startsWith('chibi-')&&!p.name.startsWith('ear-'));
  parts.push(head);
  function line(name,mat,points,r){for(let i=1;i<points.length;i++)taper(parts,points[i-1],points[i],[[0,r,r*.65],[1,r,r*.65]],mat,name);}
  function patch(name,mat,cx,cy,rx,ry,fn,offset=.002){
    const mesh={name,mat,vertices:[],faces:[]},rings=7,segments=48;
    for(let r=0;r<=rings;r++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,x=cx+rx*r/rings*Math.cos(a),y=cy+ry*r/rings*Math.sin(a);mesh.vertices.push({p:[x,y,fn(x,y)+offset],n:surfaceNormal(fn,x,y)});}
    for(let r=0;r<rings;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;mesh.faces.push([a,b,a+1],[a+1,b,b+1]);}parts.push(mesh);
  }
  const eyeY=chin+.402,eyeX=width*.42,ew=.142,upper=female?.103:.096,lower=.081;
  for(const side of[-1,1]){
    const ex=side*eyeX;
    // 각막의 둥근 부피와 얼굴면의 가림으로 옆 홍채가 좁아진다.
    const eyeZ=(x,y)=>{const u=(x-ex)/ew,v=(y-eyeY-side*u*.009)/(y>=eyeY?upper:lower);return front(x,y)+.004+.061*Math.max(0,1-u*u)*Math.max(0,1-v*v);};
    const vertices=[],facesByMat=new Map(['portrait-sclera','portrait-iris','portrait-pupil'].map(m=>[m,[]])),cols=64,rows=32;
    for(let i=0;i<=cols;i++){const u=i/cols*2-1,x=ex+ew*u,a=Math.max(0,1-u*u)**.65;for(let j=0;j<=rows;j++){const y=eyeY+side*u*.009+a*(-lower+(upper+lower)*j/rows);vertices.push({p:[x,y,eyeZ(x,y)],n:surfaceNormal(eyeZ,x,y)});}}
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;for(const ids of[[a,b,a+1],[a+1,b,b+1]]){const[x,y]=[0,1].map(k=>ids.reduce((sum,id)=>sum+vertices[id].p[k],0)/3);const iris=((x-ex)/.072)**2+((y-eyeY-.004)/.086)**2,pupil=((x-ex)/.031)**2+((y-eyeY-.007)/.060)**2;facesByMat.get(pupil<1?'portrait-pupil':iris<1?'portrait-iris':'portrait-sclera').push(ids);}}
    for(const[mat,faces]of facesByMat)parts.push({name:'orbital-eye-'+mat,mat,vertices,faces});
    patch('corneal-glint','portrait-sclera',ex-.020,eyeY+.035,.012,.014,eyeZ,.004);
    const lid=[],lowerLid=[];
    for(let i=0;i<=40;i++){const u=i/20-1,x=ex+ew*u,a=Math.max(0,1-u*u)**.65,y=eyeY+side*u*.009+upper*a,yl=eyeY+side*u*.009-lower*a;lid.push([x,y,eyeZ(x,y)+.005]);lowerLid.push([x,yl-.004,front(x,yl)+.008]);}
    line('upper-orbital-rim','study-skin',lid.map(p=>[p[0],p[1]+.008,p[2]-.004]),.011);
    line('upper-eyelid','face-ink',lid,female?.008:.006);
    line('lower-eyelid','study-skin',lowerLid,.006);
    const browPoints=[];for(let i=0;i<=24;i++){const u=i/12-1,x=ex+u*.107,y=eyeY+.147+.015*(1-u*u)+side*u*.005;browPoints.push([x,y,front(x,y)+.005]);}
    line('brow','face-ink',browPoints,female?.005:.0065);
    patch('nostril','skin-shadow',side*.043,chin+.280,.013,.006,front,.0018);
  }
  // 입술 색면은 연속된 피부 표면에 밀착시킨다.
  const mouthWidth=.077,lipLine=x=>chin+.188+.014*(x/mouthWidth)**2;
  for(const upperLip of[true,false]){
    const mesh={name:upperLip?'upper-lip-plane':'lower-lip-plane',mat:upperLip?'study-upper-lip':'study-lower-lip',vertices:[],faces:[]},cols=48,rows=8;
    for(let i=0;i<=cols;i++){const u=i/cols*2-1,x=u*mouthWidth,a=Math.max(0,1-u*u),seam=lipLine(x),edge=seam+(upperLip?1:-1)*a*(upperLip?.019+.004*bell(Math.abs(u),.35,.2):.022);for(let j=0;j<=rows;j++){const y=seam+(edge-seam)*j/rows;mesh.vertices.push({p:[x,y,front(x,y)+.002],n:surfaceNormal(front,x,y)});}}
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;mesh.faces.push([a,b,a+1],[a+1,b,b+1]);}parts.push(mesh);
  }
  const seam=[];for(let i=0;i<=32;i++){const x=(i/16-1)*mouthWidth,y=lipLine(x);seam.push([x,y,front(x,y)+.004]);}line('mouth-seam','face-ink',seam,.0045);
  // 耳の後ろを頭蓋に埋め、付着部の隙間だけを埋める。耳輪と対耳輪は原形を保つ。
  for(const part of source.parts.filter(p=>p.name.startsWith('ear-'))){parts.push({...part,vertices:part.vertices.map(v=>({...v,p:[v.p[0]-Math.sign(v.p[0])*.015,v.p[1],v.p[2]-.014],n:[...v.n]}))});}
  for(const side of[-1,1])ellipsoid(parts,[side*(width-.022),chin+.426,-.007],[.061,.105,.072],'study-skin',null,'ear-root');
  const scene={...source,parts,provenance:source.provenance+'-surface-face-study',faceStudy:{references,method:'연속 얼굴면·각막 부피·코밑과 입술의 단차·귀 부착'}};
  cache.set(key,scene);return scene;
}
