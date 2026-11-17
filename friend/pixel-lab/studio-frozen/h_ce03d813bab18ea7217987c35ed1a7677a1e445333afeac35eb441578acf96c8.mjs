import{ellipsoid as E,norm,taper}from'./h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';import{humanEar}from'./h_55e71d7613a481f2d760072f60f5ef03479ee6a2ea37ee87224add9cafa053f2.mjs';
export function chibiFace(parts,s,chin){const t=s.heads-2,width=[.60,.57,.54][t]*(s.candidate==='A'?.94:s.candidate==='C'?1.06:1),depth=.43,f=s.sex==='female',simple=s.candidate==='A';
const head={name:'chibi-skull',mat:'skin',vertices:[],faces:[]},rows=48,segments=64;for(let j=0;j<=rows;j++)for(let k=0;k<=segments;k++){const a=j/rows*Math.PI,b=k/segments*Math.PI*2,q=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];head.vertices.push({p:[q[0]*width,chin+.5+q[1]*.5,q[2]*depth],n:norm([q[0]/width,q[1]/.5,q[2]/depth])});}for(let j=0;j<rows;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;head.faces.push([a,b,a+1],[a+1,b,b+1]);}parts.push(head);
const front=(x,y)=>depth*Math.sqrt(Math.max(0,1-(x/width)**2-((y-chin-.5)/.5)**2)),normal=(x,y)=>norm([x/(width*width),(y-chin-.5)/.25,front(x,y)/(depth*depth)]);
function patch(name,mat,cx,cy,rx,ry,offset){const vertices=[{p:[cx,cy,front(cx,cy)+offset],n:normal(cx,cy)}],faces=[];for(let j=0;j<32;j++){const a=j/32*Math.PI*2,x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a);vertices.push({p:[x,y,front(x,y)+offset],n:normal(x,y)});}for(let j=0;j<32;j++)faces.push([0,j+1,(j+1)%32+1]);parts.push({name,mat,vertices,faces});}
const eyeY=chin+.38,eyeX=width*.38,ew=.116,eh=.125;
for(const sign of[-1,1]){const ex=sign*eyeX;
if(simple){patch('chibi-simple-eye','face-ink',ex,eyeY,.039,.092,.005);patch('chibi-glint','sclera',ex-.009,eyeY+.043,.008,.012,.008);}else{patch('chibi-eye-white','sclera',ex,eyeY,ew,eh,.003);patch('chibi-iris','iris',ex,eyeY-.004,ew*.84,eh*.92,.006);patch('chibi-pupil','face-ink',ex,eyeY-.002,ew*.42,eh*.64,.009);patch('chibi-glint','sclera',ex-ew*.21,eyeY+eh*.39,ew*.15,eh*.15,.012);}
const upper=[];for(let j=0;j<=16;j++){const a=j/16*Math.PI,x=ex+Math.cos(a)*ew,y=eyeY+Math.sin(a)*eh;upper.push([x,y,front(x,y)+.007]);}if(!simple)for(let j=1;j<upper.length;j++)taper(parts,upper[j-1],upper[j],[[0,.006,.002],[1,.006,.002]],'face-ink','chibi-upper-lid');
const brow=[];for(let j=0;j<=8;j++){const u=j/4-1,x=ex+u*.083,y=eyeY+.19+.013*(1-u*u);brow.push([x,y,front(x,y)+.004]);}for(let j=1;j<brow.length;j++)taper(parts,brow[j-1],brow[j],[[0,f?.003:.005,.002],[1,f?.003:.005,.002]],'face-ink','chibi-brow');
if(f&&!simple){const a=[ex+sign*ew*.85,eyeY+eh*.5],b=[ex+sign*ew*1.06,eyeY+eh*.71];taper(parts,[...a,front(...a)+.007],[...b,front(...b)+.007],[[0,.004,.002],[1,.001,.001]],'face-ink','chibi-outer-lash');}
humanEar(parts,{width:.9,length:.85,tilt:0,lobe:.65},sign,width,chin,true);
}
// A small surface smile retains its curvature when the head rotates.
const smile=[];for(let j=0;j<=16;j++){const u=j/8-1,x=u*.060,y=chin+.16+.019*u*u;smile.push([x,y,front(x,y)+.005]);}for(let j=1;j<smile.length;j++)taper(parts,smile[j-1],smile[j],[[0,.003,.002],[1,.003,.002]],'face-ink','chibi-smile');
E(parts,[0,chin+.25,front(0,chin+.25)+.002],[.014,.014,.009],'skin',null,'chibi-nose');return{width,depth,front};}
