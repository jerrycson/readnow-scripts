import {ellipsoid as E,taper,transformMeshes,norm,cross,sub} from '../geometry.mjs';
// Auricle: tilted bowl, helix, Y-shaped antihelix, tragus, antitragus and lobule.
export function chibiEar(parts,ear,side,width,chin,cute=false){
 const local=[],sx=(cute?.110:.10)*ear.width,sy=(cute?.145:.155)*ear.length;
 const outline=[[.32,.55],[.22,.94],[-.12,1.06],[-.50,.89],[-.68,.49],[-.69,.02],[-.52,-.46],[-.27,-.77],[.02,-.83],[.26,-.54],[.28,-.16]];
 function smoothLoop(points,steps=6){const out=[];for(let i=0;i<points.length;i++){const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length],d=points[(i+2)%points.length];for(let j=0;j<steps;j++){const t=j/steps;out.push(b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t*t+(-a[k]+3*v-3*c[k]+d[k])*t*t*t)));}}return out;}
 const contour=smoothLoop(outline).map(([u,v])=>[u*sx,v*sy,.020+Math.max(0,-u)*.035]);
 const bowl={name:'ear-concha-bowl',mat:'skin',vertices:[],faces:[]},rows=12;
 for(let r=0;r<=rows;r++)for(let i=0;i<contour.length;i++){
  const q=r/rows,[x,y,z]=contour[i],xx=x*q,yy=y*q,zz=-.018+q*q*(z+.018);
  bowl.vertices.push({p:[xx,yy,zz],n:norm([-xx*6,-yy*3,1])});
 }
 for(let r=0;r<rows;r++)for(let i=0;i<contour.length;i++){const a=r*contour.length+i,b=r*contour.length+(i+1)%contour.length,c=a+contour.length,d=b+contour.length;bowl.faces.push([a,c,b],[b,c,d]);}for(const v of bowl.vertices)v.n=[0,0,0];for(const f of bowl.faces){const[a,b,c]=f.map(i=>bowl.vertices[i].p),normal=cross(sub(b,a),sub(c,a));for(const i of f)for(let k=0;k<3;k++)bowl.vertices[i].n[k]+=normal[k];}const centerNormal=norm(bowl.vertices.slice(0,contour.length).reduce((sum,v)=>sum.map((x,k)=>x+v.n[k]),[0,0,0]));for(let i=0;i<bowl.vertices.length;i++)bowl.vertices[i].n=i<contour.length?centerNormal:norm(bowl.vertices[i].n);local.push(bowl);
 function ridge(points,radius,name){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];taper(local,a,b,[[0,radius,radius],[1,radius,radius]],'skin',name);E(local,b,[radius,radius,radius],'skin',null,name+'-joint');}}
 ridge(contour,.010*(.85+ear.width*.15),'ear-helix');
 const lift=.026,uv=([u,v,w=lift])=>[u*sx,v*sy,w];
 ridge([[-.08,-.60],[-.27,-.24],[-.28,.15],[-.18,.43]].map(uv),.005,'ear-antihelix');
 ridge([[-.18,.43],[-.41,.68]].map(uv),.005,'ear-antihelix-upper');
 ridge([[-.18,.43],[.10,.63]].map(uv),.005,'ear-antihelix-forward');
 E(local,uv([.17,-.14,-.008]),[.021,.030,.006],'skin-shadow',null,'ear-canal-shadow');
 E(local,uv([.32,-.19,.020]),[.015,.023,.012],'skin',null,'ear-tragus');
 E(local,uv([-.04,-.52,.023]),[.014,.016,.010],'skin',null,'ear-antitragus');
 E(local,uv([-.04,-.82,.016]),[sx*.42,sy*(.18+ear.lobe*.08),.027],'skin',null,'ear-lobule');
 E(local,[-sx*.16,sy*.10,-.026],[sx*.52,sy*.78,.040],'skin',null,'ear-back-attachment');
 const center=[side*(width+.028),chin+.39,.008],angle=.48+ear.tilt,co=Math.cos(angle),sn=Math.sin(angle);
 const orient=v=>[side*(-sn*v[0]+co*v[2]),v[1],co*v[0]+sn*v[2]],tilt=v=>[v[0]-.10*v[1],v[1],v[2]];
 transformMeshes(local,v=>{const q=orient(tilt(v));return q.map((x,k)=>x+center[k]);},v=>orient(tilt(v)));
 parts.push(...local);
}

