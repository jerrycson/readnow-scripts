import {extent} from '../../pixel-lab/hull36.mjs';
import {scanImage} from '../../pixel-lab/scan-view36.mjs';
import {defaultAngles,size} from './partial-hull55.mjs';

// 외피와 가림의 기하만 아는 대조군. 실제 흉곽·유방의 해부학 표본은 아니다.
function torso(){
  const v=[],f=[],n=64,levels=65;
  for(let i=0;i<levels;i++){
    const y=.49-.98*i/(levels-1);
    const width=.255+.14*Math.exp(-((y-.22)**2)/.026)-.115*Math.exp(-((y-.49)**2)/.005);
    const depth=.16+.052*Math.exp(-((y-.12)**2)/.022);
    for(let k=0;k<n;k++){
      const a=2*Math.PI*k/n,x=width*Math.cos(a),s=Math.sin(a);
      const z=depth*s+.035*Math.max(0,s)*Math.exp(-((Math.abs(x)-.135)**2)/.006-((y-.13)**2)/.01);
      v.push(x*10000,y*10000,z*10000);
      if(i){const j=(i-1)*n+k,r=(i-1)*n+(k+1)%n;f.push(j,r,j+n,r,r+n,j+n);}
    }
  }
  for(const i of [0,levels-1]){const c=v.length/3;v.push(0,v[i*n*3+1],0);for(let k=0;k<n;k++)f.push(c,i*n+k,i*n+(k+1)%n);}
  return {v,f};
}
export function sampleShots(subject,head=null,simulateOcclusion=true){
  const mesh=subject==='face'?head:torso();
  return defaultAngles.map(([yaw,pitch],i)=>{
    const rgba=scanImage(mesh,yaw,pitch,size).data;
    if(i===2&&simulateOcclusion){
      const old=extent(Uint8Array.from({length:size*size},(_,p)=>rgba[p*4+3]>0?1:0));
      for(let y=43;y<=68;y++)if(old[y]){
        const [l,r]=old[y],width=Math.min(r-l,11);
        for(let x=l;x<l+width;x++)rgba.fill(0,(y*size+x)*4,(y*size+x+1)*4);
      }
    }
    return {yaw,pitch,role:i<5?'fit':'check',rgba,mask:Uint8Array.from({length:size*size},(_,p)=>rgba[p*4+3]>0?1:0),
      camera:{cx:size/2,cy:size/2,scale:.797*size},visibility55:{enabled:true,bands:[]}};
  });
}
