const mix=(a,b,t)=>a.map((x,i)=>x+t*(b[i]-x));
const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
// 아랫입술 아래의 인접 피부 법선을 한 고리 이웃의 방향으로만 섞는다. 좌표를 보간하지 않는다.
function localNormals(base,center,half) {
 const original=base.parts[0].vertices;
 const neighbors=new Map();
 const gate=p=>{
   const dx=(p[0]-center[0])/(half*1.15),dy=(p[1]-center[1]+.043)/.042,dz=(p[2]-center[2])/.070;
   const w=1-dx*dx-dy*dy-dz*dz;return w>0?w*w:0;
 };
 for(const part of base.parts.filter(p=>p.vertices===original))for(const f of part.faces)for(let j=0;j<3;j++){
   const i=f[j];if(!gate(original[i].p))continue;
   if(!neighbors.has(i))neighbors.set(i,new Set());neighbors.get(i).add(f[(j+1)%3]);neighbors.get(i).add(f[(j+2)%3]);
 }
 return original.map((v,i)=>{
   if(!neighbors.has(i))return v;const sum=[0,0,0];
   for(const j of neighbors.get(i)){const n=original[j].n,weight=Math.max(0,n.reduce((s,x,k)=>s+x*v.n[k],0))**2;
     for(let k=0;k<3;k++)sum[k]+=n[k]*weight;}
   if(Math.hypot(...sum)<1e-7)return v;
   return {...v,n:norm(mix(v.n,norm(sum),.36*gate(v.p)))};
 });
}
export function supportedLip50(base,id){
 const seam=base.parts.find(p=>p.name==='mouth-line34');
 if(!seam||!['F02','M01'].includes(id))return base;
 const center=seam.vertices[2*43+21].p,half=(seam.vertices[42].p[0]-seam.vertices[0].p[0])/2;
 const skin=base.parts[0].vertices,area=localNormals(base,center,half);
 const parts=base.parts.map(part=>{
   if(part.vertices===skin)return {...part,vertices:area};
   const upper=part.name==='upper-lip34';
   if(!upper&&part.name!=='lower-lip34')return part;
   const vertices=part.vertices.map((v,i)=>{
    const j=i%37,row=Math.floor(i/37)/4,u=j/18-1,at=part.vertices[j],rim=part.vertices[4*37+j];
    // 접촉선과 양 입꼬리를 잠근 채 바깥 색면 중앙만 곡면 안에서 이동한다.
    const amt=upper?.75*Math.exp(-(((Math.abs(u)-.35)/.32)**2))*(1-u*u):.29*(1-u*u)**2;
    const t=row*(1-amt);
    return {...v,p:mix(at.p,rim.p,t),n:norm(mix(at.n,rim.n,t))};
   });
   return {...part,mat:upper?'study-lower-lip':part.mat,vertices};
 });
 return {...base,parts};
}
