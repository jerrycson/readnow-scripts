import {add,sub,mul,norm,cross,dot} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
const clamp=v=>Math.max(0,Math.min(1,v));
const bump=(t,c,r)=>Math.exp(-(((t-c)/r)**2));
const blend=(a,b,t)=>a+(b-a)*t;
function profile(rows,t){let j=0;while(j<rows.length-2&&t>rows[j+1][0])j++;const a=rows[j],b=rows[j+1],q=clamp((t-a[0])/(b[0]-a[0])),u=q*q*(3-2*q);return [blend(a[1],b[1],u),blend(a[2],b[2],u)];}
// Continuous, asymmetric limb masses. Surface normals follow the actual surface;
// these are original artistic approximations, not imported anatomical meshes.
export function limbSurface(parts,a,b,radius,kind,side,s,mat='skin'){
 const axis=norm(sub(b,a)),forward=norm(sub([0,0,1],mul(axis,dot(axis,[0,0,1])))),right=norm(cross(forward,axis));
 const length=Math.hypot(...sub(b,a)),m=s.muscularity*(1-s.adiposity*.7),soft=s.adiposity;
 const profiles={
  'upper-arm':[[0,.58,.64],[.12,1.16,1.03],[.34,1.00,1.21],[.57,.97,1.15],[.83,.74,.83],[1,.68,.72]],
  forearm:[[0,.72,.74],[.20,.94,.89],[.38,.90,.81],[.64,.72,.61],[.88,.55,.44],[1,.52,.42]],
  thigh:[[0,.97,1.02],[.20,1.05,1.10],[.48,.93,1.02],[.74,.70,.75],[.91,.49,.52],[1,.47,.48]],
  calf:[[0,.82,.88],[.17,.88,1.03],[.35,1.02,1.17],[.58,.81,.91],[.80,.52,.59],[1,.44,.50]]
 };
 const point=(t,theta)=>{
  const [rx,rz]=profile(profiles[kind],t),co=Math.cos(theta),sn=Math.sin(theta),out=co*side,inside=Math.max(0,-out),outside=Math.max(0,out),front=Math.max(0,sn),back=Math.max(0,-sn);
  let x=radius*rx*co,z=radius*rz*sn;
  if(kind==='upper-arm'){
   // Deltoid descends into the upper arm, rather than sitting on top as a ball.
   x+=side*radius*(.13+.10*m)*bump(t,.23,.22)*outside;
   z+=radius*m*(.18*bump(t,.45,.22)*front-.22*bump(t,.48,.28)*back);
  }else if(kind==='forearm'){
   // Thumb-side ridge starts high; the opposing flexor fullness sits lower.
   x+=side*radius*(.08+.08*m)*(bump(t,.24,.21)*outside-bump(t,.42,.25)*inside);
   z-=radius*.08*bump(t,.48,.27); // extensor-to-wrist taper
  }else if(kind==='thigh'){
   x+=side*radius*(.16+.12*m)*(bump(t,.40,.28)*outside-bump(t,.78,.15)*inside);
   x-=side*radius*(.10+soft*.12)*bump(t,.16,.24)*inside; // adductor wedge
   z+=radius*m*.18*bump(t,.40,.32)*front;
   z-=radius*.10*bump(t,.42,.30)*back;
  }else{
   x+=side*radius*(.12+.12*m)*(bump(t,.25,.16)*outside-bump(t,.40,.20)*inside);
   z-=radius*(.11+.16*m)*bump(t,.34,.23)*back;
   z+=radius*.10*bump(t,.54,.36)*front**8; // narrow tibial plane
   // The medial ankle landmark is higher than the lateral landmark.
   x+=side*radius*.16*(bump(t,.98,.035)*outside-bump(t,.93,.04)*inside);
  }
  return add(add(a,mul(axis,t*length)),add(mul(right,x),mul(forward,z)));
 };
 const rows=24,segments=24,eps=.0001,mesh={name:kind,mat,vertices:[],faces:[]};
 for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const t=j/rows,theta=i/segments*Math.PI*2,p=point(t,theta),dt=sub(point(Math.min(1,t+eps),theta),point(Math.max(0,t-eps),theta)),da=sub(point(t,theta+eps),point(t,theta-eps));
  // right, axis, forward is left-handed, so this cross order points outward.
  mesh.vertices.push({p,n:norm(cross(da,dt))});
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const k=j*(segments+1)+i,l=k+segments+1;mesh.faces.push([k,l,k+1],[k+1,l,l+1]);}
 for(const j of [0,rows]){const k=mesh.vertices.length;mesh.vertices.push({p:add(a,mul(axis,j/rows*length)),n:mul(axis,j?1:-1)});for(let i=0;i<segments;i++)mesh.faces.push([k,j*(segments+1)+i,j*(segments+1)+i+1]);}
 parts.push(mesh);return mesh;
}
