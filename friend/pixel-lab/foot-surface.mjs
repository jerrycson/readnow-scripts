import {norm,cross,sub} from './geometry.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const cat=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
// Heel, medial arch, instep and metatarsal pad form one surface. Toe lengths
// curve across the front rather than ending in a symmetrical ellipsoid.
export function footSurface(parts,ankle,ground,width,halfLength,side){
 const rows=[[0,.015,.08,.035],[.08,.60,.20,0],[.27,.66,.26,0],[.45,.64,.255,.015],[.64,.94,.19,0],[.79,1,.145,0],[.92,.82,.105,.005],[1,.02,.065,.025]];
 function section(t){let j=0;while(j<rows.length-2&&t>rows[j+1][0])j++;const q=(t-rows[j][0])/(rows[j+1][0]-rows[j][0]);return [1,2,3].map(k=>cat(rows[Math.max(0,j-1)][k],rows[j][k],rows[j+1][k],rows[Math.min(rows.length-1,j+2)][k],q));}
 function point(t,a){const [w,top,bottom]=section(t),co=Math.cos(a),sn=Math.sin(a),x=co*Math.max(.003,w)*width,inside=clamp(-co*side),arch=.060*Math.exp(-(((t-.45)/.18)**2))*inside;
  const low=Math.max(0,bottom)+arch,high=Math.max(low+.006,top),y=ground+(high+low)/2+(high-low)/2*sn;
  const z=ankle[2]-.29+(halfLength*2.06)*t-.055*clamp((t-.70)/.30)*co*side;
  return [ankle[0]+x,y,z];
 }
 const n=40,m=32,eps=.0001,mesh={name:'foot',mat:'skin',vertices:[],faces:[]};
 for(let j=0;j<=n;j++)for(let k=0;k<=m;k++){const t=j/n,a=k/m*Math.PI*2,dt=sub(point(Math.min(1,t+eps),a),point(Math.max(0,t-eps),a)),da=sub(point(t,a+eps),point(t,a-eps));mesh.vertices.push({p:point(t,a),n:norm(cross(da,dt))});}
 for(let j=0;j<n;j++)for(let k=0;k<m;k++){const i=j*(m+1)+k,l=i+m+1;mesh.faces.push([i,l,i+1],[i+1,l,l+1]);}
 for(const j of [0,n]){const ring=mesh.vertices.slice(j*(m+1),j*(m+1)+m),center=[0,1,2].map(k=>ring.reduce((sum,v)=>sum+v.p[k],0)/m),index=mesh.vertices.length;mesh.vertices.push({p:center,n:[0,0,j?1:-1]});for(let k=0;k<m;k++)mesh.faces.push([index,j*(m+1)+k,j*(m+1)+k+1]);}
 parts.push(mesh);return mesh;
}
