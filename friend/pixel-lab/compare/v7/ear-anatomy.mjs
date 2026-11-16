import {ellipsoid as E,taper,transformMeshes,norm,cross,sub} from './geometry.mjs';
// Auricle: tilted bowl, helix, Y-shaped antihelix, tragus, antitragus and lobule.
export function humanEar(parts,ear,side,width,chin,cute=false){
 const local=[],sx=(cute?.078:.10)*ear.width,sy=(cute?.115:.155)*ear.length;
 const outline=[[.32,.55],[.22,.94],[-.12,1.06],[-.50,.89],[-.68,.49],[-.69,.02],[-.52,-.46],[-.27,-.77],[.02,-.83],[.26,-.54],[.28,-.16]];
 const contour=outline.map(([u,v])=>[u*sx,v*sy,.020+Math.max(0,-u)*.035]);
 const bowl={name:'ear-concha-bowl',mat:'skin',vertices:[],faces:[]},rows=5;
 for(let r=0;r<=rows;r++)for(let i=0;i<contour.length;i++){
  const q=r/rows,[x,y,z]=contour[i],xx=x*q,yy=y*q,zz=-.018+q*q*(z+.018);
  bowl.vertices.push({p:[xx,yy,zz],n:norm([-xx*3,-yy,1])});
 }
 for(let r=0;r<rows;r++)for(let i=0;i<contour.length;i++){const a=r*contour.length+i,b=r*contour.length+(i+1)%contour.length,c=a+contour.length,d=b+contour.length;bowl.faces.push([a,c,b],[b,c,d]);}local.push(bowl);
 function ridge(points,radius,name){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];taper(local,a,b,[[0,radius,radius],[1,radius,radius]],'skin',name);E(local,b,[radius,radius,radius],'skin',null,name+'-joint');}}
 ridge(contour,.012*(.85+ear.width*.15),'ear-helix');
 const lift=.026,uv=([u,v,w=lift])=>[u*sx,v*sy,w];
 ridge([[-.08,-.60],[-.27,-.24],[-.28,.15],[-.18,.43]].map(uv),.010,'ear-antihelix');
 ridge([[-.18,.43],[-.41,.68]].map(uv),.009,'ear-antihelix-upper');
 ridge([[-.18,.43],[.10,.63]].map(uv),.009,'ear-antihelix-forward');
 E(local,uv([.17,-.14,-.008]),[.021,.030,.006],'skin-shadow',null,'ear-canal-shadow');
 E(local,uv([.32,-.19,.020]),[.022,.030,.018],'skin',null,'ear-tragus');
 E(local,uv([-.04,-.52,.023]),[.021,.020,.016],'skin',null,'ear-antitragus');
 E(local,uv([-.04,-.82,.016]),[sx*.42,sy*(.18+ear.lobe*.08),.027],'skin',null,'ear-lobule');
 const center=[side*(width-.010),chin+.44,-.028],angle=.30+ear.tilt,co=Math.cos(angle),sn=Math.sin(angle);
 const orient=v=>[side*(-sn*v[0]+co*v[2]),v[1],co*v[0]+sn*v[2]],tilt=v=>[v[0]-.10*v[1],v[1],v[2]];
 transformMeshes(local,v=>{const q=orient(tilt(v));return q.map((x,k)=>x+center[k]);},v=>orient(tilt(v)));
 parts.push(...local);
}
