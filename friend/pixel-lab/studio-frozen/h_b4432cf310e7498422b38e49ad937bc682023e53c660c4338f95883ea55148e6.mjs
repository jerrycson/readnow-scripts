import {norm,cross,sub} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,t)=>{t=clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
const mound=(x,y,cx,cy,rx,ry,power=2)=>Math.exp(-(Math.abs((x-cx)/rx)**power+Math.abs((y-cy)/ry)**power)*1.5);
function catmull(a,b,c,d,t){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
export function torsoSurface(parts,rings,s,p,py,sy){
 const {chest,waist,hip,depth}=p,torso=sy-py,low=rings[0][0],high=rings.at(-1)[0],muscle=s.muscularity**1.25*(1-s.adiposity*.88)**2;
 function section(y){let i=0;while(i<rings.length-2&&y>rings[i+1][0])i++;const t=clamp((y-rings[i][0])/(rings[i+1][0]-rings[i][0]),0,1);return [1,2,3].map(k=>catmull(rings[Math.max(0,i-1)][k]||0,rings[i][k]||0,rings[i+1][k]||0,rings[Math.min(rings.length-1,i+2)][k]||0,t));}
 function point(a,y){const [rx,rz,zc]=section(y),sn=Math.sin(a),x=Math.cos(a)*rx;let z=zc+rz*sn;
  const front=Math.max(0,sn)**2,back=Math.max(0,-sn)**2;
  if(front>0&&!p.cute){
   let relief=0;
   for(const side of [-1,1]){
    if(s.sex==='female'){
     const asym=side*s.breastAsymmetry,volume=(.35+s.chestVolume*1.10)*(1+asym*.07);
     const cy=py+torso*(.80-s.breastDrop*.15-asym*.009),ry=y>cy?torso*(.13+s.breastUpperFullness*.10+s.breastDrop*.035):torso*(.10+s.chestVolume*.035);
     const rx=chest*(.28+s.breastRootWidth*.22),cx=side*chest*(.36+s.breastSeparation*.26+s.breastSplay*.10*(cy-y)/torso);
     relief+=depth*(.25+s.breastProjection*.75)*volume*mound(x,y,cx,cy,rx,ry);
    }else{
     relief+=(.035+.18*s.muscularity)*mound(x,y,side*chest*.45,py+torso*.78,chest*.48,torso*.125,4)*(1-s.adiposity*.55);
    }
    // Broad rectus planes with shallow tendon grooves; no separate spheres on the skin.
    for(let row=0;row<3;row++)relief+=.12*muscle*mound(x,y,side*chest*.19,py+torso*(.36+row*.105),chest*.19,torso*.050,4);
    const obliqueX=side*(waist*.78+(y-py-torso*.30)*.13);
    relief+=.065*muscle*mound(x,y,obliqueX,py+torso*.34,chest*.20,torso*.21);
    relief+=.028*muscle*mound(x,y,side*chest*.63,py+torso*.58,chest*.22,torso*.12);
   }
   relief+=s.adiposity*.14*mound(x,y,0,py+torso*.23,waist*.8,torso*.25);
   const abdominal=smooth(.15,.25,(y-py)/torso)*(1-smooth(.66,.72,(y-py)/torso));
   relief-=.022*muscle*Math.exp(-((x/.035)**2))*abdominal;
   relief-=.025*mound(x,y,0,py+torso*.29,.045,.038);
   // Shallow clavicular plane: follows shoulder slope instead of a raised rod.
   const clavicleY=sy+.025-Math.abs(x)/Math.max(.1,chest)*.09;
   relief+=.018*(1-s.adiposity*.65)*Math.exp(-(((y-clavicleY)/.038)**2))*smooth(.08,.2,Math.abs(x))*(1-smooth(chest*.72,chest*.93,Math.abs(x)));
   z+=front*relief;
  }
  if(back>0&&!p.cute){let relief=0;for(const side of [-1,1]){relief+=depth*.30*mound(x,y,side*hip*.44,py-.045,hip*.52,.27);relief+=.025*muscle*mound(x,y,side*chest*.45,py+torso*.75,chest*.28,torso*.17);}z-=back*relief;}
  // The groin edge rises toward the side of the pelvis. A level cut across
  // both upper legs reads as a separate belt even with identical materials.
  const joinWeight=1-smooth(low,py+.13,y),edgeLift=(p.cute?.10:.29)*Math.abs(Math.cos(a))**1.7;
  return [x,y+joinWeight*edgeLift,z];
 }
 const mesh={name:'ribcage-waist-pelvis',mat:'skin',vertices:[],faces:[]},rows=52,segments=40,eps=.0005;
 for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const y=low+(high-low)*j/rows,a=i/segments*Math.PI*2,position=point(a,y),da=sub(point(a+eps,y),point(a-eps,y)),dy=sub(point(a,Math.min(high,y+eps)),point(a,Math.max(low,y-eps)));
  mesh.vertices.push({p:position,n:norm(cross(dy,da))});
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;mesh.faces.push([a,b,a+1],[a+1,b,b+1]);}
 for(const [j,ny]of [[0,-1],[rows,1]]){const y=j?high:low,k=mesh.vertices.length;mesh.vertices.push({p:[0,y,section(y)[2]],n:[0,ny,0]});for(let i=0;i<segments;i++)mesh.faces.push([k,j*(segments+1)+i,j*(segments+1)+i+1]);}
 parts.push(mesh);return mesh;
}
