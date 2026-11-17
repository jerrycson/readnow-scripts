import {norm,cross,sub} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mound=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)*1.6);
const cat=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
// A skull, facial mask and jaw described by one continuous surface.
// Front and back depths are independent, so the chin can project while the
// underside turns back toward the neck. No external mesh or face texture.
export function sculptHead(parts,s,p,chin,face,nose,mouth){
 const {cute,manga,f}=p,width=(cute?(s.candidate==='A'?.54:s.candidate==='C'?.63:.59):manga?.38:.365)*face.width,depth=cute?.435:.37;
 const jaw=width*(cute?.80:f?.50+face.jaw*.25:.48+face.jaw*.30),chinWidth=cute?width*.52:width*(f?.22+face.jaw*.10:.25+face.jaw*.12);
 // t, lateral radius, anterior depth, posterior depth
 const rows=cute?[
  [0,.015,.08,-.08],[.045,width*.43,.23,-.18],[.13,width*.78,.34,-.28],[.29,width*face.cheek,.42,-.37],[.50,width,.43,-.43],[.73,width*.96,.39,-.40],[.89,width*.72,.27,-.30],[.97,width*.36,.13,-.16],[1,.005,.015,-.035]
 ]:[
  [0,chinWidth,.27,-.055],[.075,chinWidth*1.35,.295,-.14],[.17,jaw,.305,-.25],[.30,width*(.86+(face.cheek-.9)*.30),.315,-.35],[.40,width*(.95+(face.cheek-.9)*.25),.325,-.39],
  [.50,width*.98,.325,-.405],[.64,width,.34,-.42],[.80,width*.91,.305,-.38],[.92,width*.64,.205,-.26],[.98,width*.28,.085,-.13],[1,.005,.015,-.035]
 ];
 function section(t){t=clamp(t,0,1);let j=0;while(j<rows.length-2&&t>rows[j+1][0])j++;const q=(t-rows[j][0])/(rows[j+1][0]-rows[j][0]);return [1,2,3].map(k=>cat(rows[Math.max(0,j-1)][k],rows[j][k],rows[j+1][k],rows[Math.min(rows.length-1,j+2)][k],q));}
 const worldY=t=>chin+.5+(t-.5)*face.length;
 const localY=y=>(y-chin-.5)/face.length+.5;
 function relief(x,t){if(cute)return .012*mound(x,t,0,.20,width*.7,.20);let z=0;
  for(const side of [-1,1]){
   z-=(f?.013:.016)*mound(x,t,side*width*.43,manga?.46:.49,width*.32,.10); // orbit
   z+=(f?.018:.024)*mound(x,t,side*width*.58,.345,width*.32,.12); // cheekbone
   z+=(f?.010:.020)*mound(x,t,side*width*.43,.565,width*.30,.055); // supraorbital plane
   z-=.008*mound(x,t,side*width*.64,.25,width*.23,.09); // below cheek
  }
  // The nose belongs to the facial mask. A depth profile replaces a closed
  // cylinder and two disconnected wings, which produced floating parts.
  const tip=.305+nose.tip*.4-(nose.length-1)*.075;
  const nr=(f?.043:.048)*nose.width,projection=(manga?(f?.10:.125):.15)*nose.depth;
  const bridge=Math.exp(-((x/(nr*.60))**2)*1.3);
  const bridgeY=clamp((.53-t)/Math.max(.05,.53-tip),0,1);
  const bridgeFade=clamp((t-(tip-.035))/.055,0,1);
  z+=projection*.72*bridge*bridgeY*bridgeFade;
  z+=projection*.48*mound(x,t,0,tip,nr,.030);
  for(const side of [-1,1])z+=projection*.18*mound(x,t,side*nr*.77,tip-.023,nr*.62,.027);
  // Lips and chin share broad support planes; isolated circular mounds make
  // bright beads around the mouth when quantized to a small palette.
  z+=.008*mound(x,t,0,.185,width*.65,.10);
  z+=.009*mouth.fullness*mound(x,t,0,.168,width*.30,.024);
  return z;
 }
 function point(a,t){const [rawRx,zf,zb]=section(t),rx=Math.max(.003,rawRx),co=Math.cos(a),sn=Math.sin(a),x=co*rx,zc=(zf+zb)/2,rz=(zf-zb)/2;return [x,worldY(t),zc+rz*sn+Math.max(0,sn)**2*relief(x,t)];}
 function front(x,y){const t=clamp(localY(y),0,1),[rawRx,zf,zb]=section(t),rx=Math.max(.003,rawRx),sn=Math.sqrt(Math.max(0,1-(x/rx)**2));return (zf+zb)/2+(zf-zb)/2*sn+sn*sn*relief(x,t);}
 function normal(x,y){const e=.0002;return norm([-(front(x+e,y)-front(x-e,y))/(2*e),-(front(x,y+e)-front(x,y-e))/(2*e),1]);}
 const count=64,segments=64,eps=.0001,mesh={name:'head',mat:'skin',vertices:[],faces:[]};
 for(let j=0;j<=count;j++)for(let k=0;k<=segments;k++){
  const t=j/count,a=k/segments*Math.PI*2,dt=sub(point(a,Math.min(1,t+eps)),point(a,Math.max(0,t-eps))),da=sub(point(a+eps,t),point(a-eps,t));
  mesh.vertices.push({p:point(a,t),n:norm(cross(dt,da))});
 }
 for(let j=0;j<count;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;mesh.faces.push([a,b,a+1],[a+1,b,b+1]);}
 for(const j of [0,count]){const [,zf,zb]=section(j/count),i=mesh.vertices.length;mesh.vertices.push({p:[0,worldY(j/count),(zf+zb)/2],n:[0,j?1:-1,0]});for(let k=0;k<segments;k++)mesh.faces.push([i,j*(segments+1)+k,j*(segments+1)+k+1]);}
 parts.push(mesh);return {width,depth,front,normal};
}
