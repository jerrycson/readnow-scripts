import {DATA} from './h_63eaf57ecd42ec33d63ef14a4857e006394c48f67af92747a1de0371818e0ad5.mjs';
import {cross,sub,norm,ellipsoid as E,taper} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
function monotone(rows,x){let i=0;while(i<rows.length-2&&x>rows[i+1][0])i++;const [x0,y0]=rows[i],[x1,y1]=rows[i+1],d=(y1-y0)/(x1-x0),before=i?(y0-rows[i-1][1])/(x0-rows[i-1][0]):d,after=i<rows.length-2?(rows[i+2][1]-y1)/(rows[i+2][0]-x1):d,m0=before*d>0?2/(1/before+1/d):0,m1=after*d>0?2/(1/after+1/d):0,t=clamp((x-x0)/(x1-x0)),t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*y0+(t3-2*t2+t)*(x1-x0)*m0+(-2*t3+3*t2)*y1+(t3-t2)*(x1-x0)*m1;}
const cache=new Map();
const neighbors=Array.from({length:DATA.forms.male.positions.length},()=>new Set());for(const [a,b,c]of DATA.faces){neighbors[a].add(b).add(c);neighbors[b].add(a).add(c);neighbors[c].add(a).add(b);}
export function continuousStudy(s){
 if(s.heads<5)throw new Error('성인 연속 표면 실험은 5~8등신에 한정됩니다.');
 const key=s.sex+':'+s.heads+':'+s.designStyle;if(cache.has(key))return cache.get(key);
 const source=DATA.forms[s.sex],n=s.heads,chin=source.headRatio-1,manga=s.designStyle==='manga',pelvis=n*(manga?.53:.51)+.04+.14*(n-7),shoulder=n-(s.sex==='female'?1.47:1.43);
 const knots=[[0,0],[source.joints['foot.L'][1],.30],[source.joints['lowerleg01.L'][1],pelvis*.53],[source.joints['upperleg01.L'][1],pelvis],[source.joints['upperarm01.L'][1],shoulder],[chin,n-1],[source.headRatio,n]],width=n<7?.80+(n-5)*.10:1+(n-7)*.04;
 const proportion=p=>{const head=clamp((p[1]-(chin-.25))/.40),w=width*(1-head)+head;return [p[0]*w,monotone(knots,p[1]),p[2]*w];};
 const eyes=['L','R'].map(side=>proportion(source.joints['eye.'+side]));
 function stylize(p){if(!manga)return p;let [x,y,z]=p;const h=y-(n-1),neck=Math.exp(-(((h+.25)/.21)**2));x*=1-neck*(s.sex==='female'?.14:.10);
  if(h<-.10)return [x,y,z];
  for(const eye of eyes){const dx=p[0]-eye[0],dy=p[1]-eye[1],gate=clamp((p[2]-eye[2]+.075)/.075),w=Math.exp(-((dx/.155)**2+(dy/.135)**2)*1.4)*gate;x+=(dx*.16+Math.sign(eye[0])*.027)*w;y+=(dy*(s.sex==='female'?.40:.27)+Math.sign(eye[0])*dx*.10-(s.sex==='male'?.027:0))*w;z+=.018*w;}
  const front=clamp((p[2]-.22)/.22),nose=Math.exp(-((x/.145)**2+((h-.35)/.19)**2)*1.3)*front;
  z-=Math.max(0,z-.48)*.10*nose;
  z-=.025*Math.exp(-((x/.13)**2+((h-.205)/.075)**2)*1.4)*front;
  const mouthShape=Math.exp(-((x/.16)**2+((h-.205)/.10)**2)*1.2)*front;
  y-=(s.sex==='female'?.025:.035)*mouthShape;x*=1-.04*mouthShape;
  x*=1-(s.sex==='female'?.10:.03)*Math.exp(-(((h-.10)/.16)**2))+.04*Math.exp(-(((h-.43)/.20)**2));
  x*=1-.10*Math.exp(-((x/.105)**2+((h-.32)/.10)**2)*1.6)*front;
  return [x,y,z];
 }
 const transform=p=>stylize(proportion(p));
 const vertices=source.positions.map(p=>({p:transform(p),n:[0,0,0]}));
 const posedEyes=['L','R'].map(side=>transform(source.joints['eye.'+side]));
 if(manga)for(let pass=0;pass<6;pass++){const next=vertices.map(v=>[...v.p]);for(let i=0;i<vertices.length;i++){const p=vertices[i].p,h=p[1]-(n-1);if(h<.06||h>.60||Math.abs(p[0])>.30||p[2]<.34)continue;const eyeDistance=Math.min(...posedEyes.map(e=>Math.hypot((p[0]-e[0])/.12,(p[1]-e[1])/.08)));if(eyeDistance<.90)continue;const ids=[...neighbors[i]],weight=.40*clamp((.30-Math.abs(p[0]))/.08);for(let k=0;k<3;k++)next[i][k]+=weight*(ids.reduce((v,j)=>v+vertices[j].p[k],0)/ids.length-p[k]);}for(let i=0;i<vertices.length;i++)vertices[i].p=next[i];}
 for(const f of DATA.faces){const normal=cross(sub(vertices[f[1]].p,vertices[f[0]].p),sub(vertices[f[2]].p,vertices[f[0]].p));for(const i of f)for(let k=0;k<3;k++)vertices[i].n[k]+=normal[k];}
 for(const v of vertices)v.n=norm(v.n);
 if(manga)for(let pass=0;pass<10;pass++){const next=vertices.map(v=>v.n);for(let i=0;i<vertices.length;i++){const p=vertices[i].p,h=p[1]-(n-1);if(h<.03||h>.78||Math.abs(p[0])>.33||p[2]<.30)continue;const ids=[...neighbors[i]];next[i]=norm([0,1,2].map(k=>.5*vertices[i].n[k]+.5*ids.reduce((sum,j)=>sum+vertices[j].n[k],0)/ids.length));}for(let i=0;i<vertices.length;i++)vertices[i].n=next[i];}
 const mouth=transform(source.mouthCenter),skinFaces=[],lipFaces=[],lowerLipFaces=[];
 for(const f of DATA.faces){const center=[0,1,2].map(k=>f.reduce((sum,i)=>sum+vertices[i].p[k],0)/3),u=center[0]/(manga?.115:.105),dy=center[1]-mouth[1],inside=Math.abs(u)<1&&Math.abs(dy)<.022*Math.sqrt(1-u*u)&&center[2]>mouth[2]-.025;(inside?(dy>0?lipFaces:lowerLipFaces):skinFaces).push(f);}
 const skin={name:'continuous-CC0-derived-body',mat:'skin',vertices,faces:skinFaces},parts=[skin,{name:'surface-upper-lip',mat:'lip',vertices,faces:lipFaces},{name:'surface-lower-lip',mat:'lower-lip',vertices,faces:lowerLipFaces}];
 const headFaces=DATA.faces.filter(f=>f.every(i=>vertices[i].p[1]>n-.85));
 function ray(x,y){let z=-Infinity;for(const f of headFaces){const [a,b,c]=f.map(i=>vertices[i].p),d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(d)<1e-9)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/d,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/d;if(u>=0&&v>=0&&u+v<=1)z=Math.max(z,a[2]*u+b[2]*v+c[2]*(1-u-v));}return z;}
 for(const side of ['L','R']){const eye=transform(source.joints['eye.'+side]);if(manga)eye[2]-=.028;E(parts,eye,[manga?.095:.082,manga?.095:.079,.079],'sclera',null,'study-eyeball');E(parts,[eye[0],eye[1],eye[2]+.076],[manga?.038:.033,manga?(s.sex==='female'?.047:.042):.038,.008],'iris',null,'study-iris');E(parts,[eye[0],eye[1],eye[2]+.084],[manga?.018:.015,manga?.029:.024,.005],'eye',null,'study-pupil');
  const brow=[];for(let i=0;i<=12;i++){const u=i/6-1,x=eye[0]+u*.095,y=eye[1]+(s.sex==='female'?.095:.068)+.012*(1-u*u)+Math.sign(eye[0])*u*.008,z=ray(x,y);if(Number.isFinite(z))brow.push([x,y,z+.002]);}for(let i=1;i<brow.length;i++)taper(parts,brow[i-1],brow[i],[[0,s.sex==='female'?.005:.011,.002],[1,s.sex==='female'?.004:.009,.002]],'face-ink','surface-brow');
  if(manga){
   E(parts,[eye[0]-.011,eye[1]+.022,eye[2]+.089],[.009,.010,.003],'sclera',null,'study-eye-glint');
   const lid=[];for(let i=0;i<=16;i++){const u=i/8-1,x=eye[0]+u*.085,y=eye[1]+.049*Math.sqrt(Math.max(0,1-u*u))+Math.sign(eye[0])*u*.009,ball=eye[2]+.079*Math.sqrt(Math.max(0,1-((x-eye[0])/.095)**2-((y-eye[1])/.095)**2)),z=Math.max(ray(x,y),ball);if(Number.isFinite(z))lid.push([x,y,z+.002]);}for(let i=1;i<lid.length;i++)taper(parts,lid[i-1],lid[i],[[0,.004,.002],[1,.003,.002]],'face-ink','surface-upper-lid');
  }
 }
 if(manga){const seam=[];for(let i=0;i<=20;i++){const u=i/10-1,x=u*.102,y=mouth[1]+.002+.004*Math.cos(u*Math.PI),z=ray(x,y);if(Number.isFinite(z))seam.push([x,y,z+.002]);}for(let i=1;i<seam.length;i++)taper(parts,seam[i-1],seam[i],[[0,.002,.0015],[1,.002,.0015]],'face-ink','surface-mouth-line');}
 const scene={parts,height:n,frame:n+1.1,joints:{right:{wrist:transform(source.joints['wrist.L']),ankle:transform(source.joints['foot.L'])},left:{wrist:transform(source.joints['wrist.R']),ankle:transform(source.joints['foot.R'])}},provenance:'MakeHuman CC0 adult mesh derivative — foundation experiment, unapproved',landmarks:{chin:transform(source.positions[source.chinIndex]),shoulder,pelvis},source:DATA.provenance};cache.set(key,scene);return scene;
}
