export function drawScan(canvas,surface,yaw,pitch,zoom){
  const n=surface.width,size=360,scale=size/263*zoom,yr=yaw*Math.PI/180,pr=pitch*Math.PI/180;
  const cy=Math.cos(yr),sy=Math.sin(yr),cp=Math.cos(pr),sp=Math.sin(pr);
  canvas.width=canvas.height=size;const g=canvas.getContext('2d');g.clearRect(0,0,size,size);
  const points=surface.grid.map((height,i)=>{
    if(height===-999)return null;
    const x=(i%n-(n-1)/2)*surface.step,y=(Math.floor(i/n)-(n-1)/2)*surface.step,z=height*.5;
    const u=cy*x+sy*z,w=-sy*x+cy*z;return [u,cp*y-sp*w,sp*y+cp*w];});
  const triangles=[];
  for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){
    const i=y*n+x;
    for(const ids of [[i,i+1,i+n],[i+1,i+n+1,i+n]]){
      const pts=ids.map(k=>points[k]);if(pts.some(v=>!v))continue;
      const [a,b,c]=pts,u=b.map((v,k)=>v-a[k]),v=c.map((w,k)=>w-a[k]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...normal)||1;
      const tone=.55+.43*(normal[0]*-.35+normal[1]*.45+normal[2]*.8)/l;
      triangles.push({pts,z:(a[2]+b[2]+c[2])/3,tone});
    }
  }
  for(const {pts,tone} of triangles.sort((a,b)=>a.z-b.z)){
    g.beginPath();pts.forEach((p,i)=>g[i?'lineTo':'moveTo'](size*.5+p[0]*scale,size*.5-p[1]*scale));
    g.closePath();g.fillStyle='rgb('+[77+139*tone,94+104*tone,87+92*tone].map(Math.round).join(',')+')';g.strokeStyle=g.fillStyle;g.lineWidth=.6;g.fill();g.stroke();
  }
}
