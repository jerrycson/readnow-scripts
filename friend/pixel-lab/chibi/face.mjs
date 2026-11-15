import{norm,taper,cross,sub}from'../geometry.mjs';
import{chibiEar as humanEar}from'./ear.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
function curve(rows,x){let i=0;while(i<rows.length-2&&x>rows[i+1][0])i++;const[x0,y0]=rows[i],[x1,y1]=rows[i+1],d=(y1-y0)/(x1-x0),a=i?(y0-rows[i-1][1])/(x0-rows[i-1][0]):d,b=i<rows.length-2?(rows[i+2][1]-y1)/(rows[i+2][0]-x1):d,m0=a*d>0?2/(1/a+1/d):0,m1=b*d>0?2/(1/b+1/d):0,t=clamp((x-x0)/(x1-x0));return(2*t**3-3*t*t+1)*y0+(t**3-2*t*t+t)*(x1-x0)*m0+(-2*t**3+3*t*t)*y1+(t**3-t*t)*(x1-x0)*m1;}
export function chibiFace(parts,s,chin){
 const t=s.heads-2,width=[.56,.53,.50][t]*(s.candidate==='A'?.94:s.candidate==='C'?1.06:1),depth=.43,f=s.sex==='female',simple=s.candidate==='A',eyeLevel=[.32,.36,.40][t],mouthLevel=eyeLevel-.205,noseLevel=eyeLevel-.10;
 const widths=[[0,0],[.05,.48-.04*t],[.12,.72-.04*t],[.22,.88-.025*t],[.36,.98-.01*t],[.50,1],[.65,.99],[.80,.91],[.92,.65],[1,0]],depths=[[0,0],[.05,.30],[.12,.57],[.22,.80],[.36,.93],[.50,1],[.65,1],[.80,.91],[.92,.65],[1,0]],centers=[[0,.13],[.12,.06],[.36,0],[.65,-.045],[1,0]];
 function profile(h){const cap=Math.sqrt(Math.max(0,1-((h-.5)/.5)**2));return{rx:width*(h>=.5?cap:curve(widths,h)),rz:depth*(h>=.5?cap:curve(depths,h)),z:curve(centers,h)};}
 const front=(x,y)=>{const h=y-chin,{rx,rz,z}=profile(h);return z+rz*Math.sqrt(Math.max(0,1-(Math.abs(x)/Math.max(.00001,rx))**2.7))+[.020,.045,.065][t]*Math.exp(-((x/[.055,.060,.065][t])**2+((h-noseLevel)/.045)**2))+.008*Math.exp(-((x/.10)**2+((h-mouthLevel)/.025)**2))+.020*Math.exp(-(((Math.abs(x)-width*.40)/.17)**2+((h-(eyeLevel-.15))/.075)**2))+.012*Math.exp(-(((Math.abs(x)-width*.40)/.18)**2+((h-(eyeLevel+.14))/.055)**2))-.009*Math.exp(-(((Math.abs(x)-width*.40)/.12)**2+((h-eyeLevel)/.080)**2));};
 const normal=(x,y)=>{const e=.0001;return norm([-(front(x+e,y)-front(x-e,y))/(2*e),-(front(x,y+e)-front(x,y-e))/(2*e),1]);};
 const head={name:'chibi-skull-cheek-jaw',mat:'skin',vertices:[],faces:[]},rows=64,segments=80;
 for(let j=0;j<=rows;j++)for(let k=0;k<=segments;k++){const h=j/rows,a=k/segments*Math.PI*2,{rx,rz,z}=profile(h),x=rx*Math.cos(a),zz=Math.sin(a)>=0?front(x,chin+h):z+rz*Math.sin(a);head.vertices.push({p:[x,chin+h,zz],n:[0,0,0]});}
 for(let j=0;j<rows;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;head.faces.push([a,b,a+1],[a+1,b,b+1]);}
 for(const face of head.faces){const[a,b,c]=face.map(i=>head.vertices[i].p),n=cross(sub(b,a),sub(c,a));for(const i of face)for(let k=0;k<3;k++)head.vertices[i].n[k]+=n[k];}
 const weld=new Map();for(const v of head.vertices){const key=v.p.map(x=>x.toFixed(8)).join(':');if(!weld.has(key))weld.set(key,[0,0,0]);for(let k=0;k<3;k++)weld.get(key)[k]+=v.n[k];}for(const v of head.vertices)v.n=norm(weld.get(v.p.map(x=>x.toFixed(8)).join(':')));parts.push(head);
 function patch(name,mat,cx,cy,rx,ry,offset){const mesh={name,mat,vertices:[],faces:[]},rings=6,segments=48;for(let i=0;i<=rings;i++)for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2,x=cx+rx*i/rings*Math.cos(a),y=cy+ry*i/rings*Math.sin(a);mesh.vertices.push({p:[x,y,front(x,y)+offset],n:normal(x,y)});}for(let i=0;i<rings;i++)for(let k=0;k<segments;k++){const a=i*(segments+1)+k,b=a+segments+1;mesh.faces.push([a,b,a+1],[a+1,b,b+1]);}parts.push(mesh);}
 function line(name,mat,points,r){for(let k=1;k<points.length;k++)taper(parts,points[k-1],points[k],[[0,r,.0015],[1,r,.0015]],mat,name);}
 const eyeY=chin+eyeLevel,eyeX=width*(.40+.005*t),ew=[.155,.148,.140][t],upperH=f?[.118,.112,.103][t]:[.110,.103,.095][t],lowerH=[.100,.095,.086][t];
 for(const sign of[-1,1]){const ex=sign*eyeX;
  if(simple){patch('chibi-simple-eye','face-ink',ex,eyeY,.039,.079,.003);patch('chibi-glint','sclera',ex-.008,eyeY+.031,.008,.010,.005);}
  else{const eye={vertices:[],faces:[]},cols=48,rows=24,materials=new Map(['sclera','iris','face-ink'].map(m=>[m,[]]));
   for(let i=0;i<=cols;i++){const u=i/cols*2-1,x=ex+ew*u,a=(Math.max(0,1-u*u))**.65,tilt=sign*u*.010;for(let j=0;j<=rows;j++){const y=eyeY+tilt+a*(-lowerH+(upperH+lowerH)*j/rows);eye.vertices.push({p:[x,y,front(x,y)+.003],n:normal(x,y)});}}
   for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=a+rows+1;for(const face of[[a,b,a+1],[a+1,b,b+1]]){const p=[0,1].map(k=>face.reduce((v,id)=>v+eye.vertices[id].p[k],0)/3),u=(p[0]-ex)/[.083,.079,.075][t],v=(p[1]-eyeY-.003)/[.100,.096,.091][t],pupil=((p[0]-ex)/.038)**2+((p[1]-eyeY-.006)/.057)**2;materials.get(pupil<1?'face-ink':u*u+v*v<1?'iris':'sclera').push(face);}}
   for(const[mat,faces]of materials)parts.push({name:'chibi-almond-eye-'+mat,mat,vertices:eye.vertices,faces});patch('chibi-glint','sclera',ex-.022,eyeY+.041,.013,.017,.006);
   const upper=[];for(let i=0;i<=32;i++){const u=i/16-1,x=ex+ew*u,y=eyeY+sign*u*.010+upperH*Math.max(0,1-u*u)**.65;upper.push([x,y,front(x,y)+.006]);}line('chibi-upper-lid','face-ink',upper,f?.010:.007);
  }
  const brow=[];for(let i=0;i<=16;i++){const u=i/8-1,x=ex+u*.093,y=eyeY+.158+.012*(1-u*u)+sign*u*.008;brow.push([x,y,front(x,y)+.005]);}line('chibi-brow','face-ink',brow,f?.0035:.0055);
  humanEar(parts,{width:.95,length:.85,tilt:0,lobe:.65},sign,profile(.44+eyeLevel-.35).rx,chin+eyeLevel-.35,true);
 }
 const smile=[];for(let i=0;i<=20;i++){const u=i/10-1,x=u*.063,y=chin+mouthLevel+.018*u*u;smile.push([x,y,front(x,y)+.004]);}line('chibi-smile','face-ink',smile,.003);
 return{width,depth,front};
}
