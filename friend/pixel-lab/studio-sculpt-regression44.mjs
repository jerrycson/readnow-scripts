const radians=n=>n*Math.PI/180;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function cameraRows(yaw,pitch){
 const cy=Math.cos(radians(yaw)),sy=Math.sin(radians(yaw)),cp=Math.cos(radians(pitch)),sp=Math.sin(radians(pitch));
 return [[cy,0,sy],[-sp*sy,-cp,sp*cy]];
}
// 변형 축 두 개의 세계 방향을 실제 화면 예제로부터 6계수 선형 회귀한다.
// 원본 정점 좌표는 학습 가중치 파일에 포함하지 않는다.
export function trainKernel(samples){
 const a=Array.from({length:6},()=>Array(7).fill(0));
 for(const {ax,ay,yaw,pitch,dx,dy} of samples){
   cameraRows(yaw,pitch).forEach((row,i)=>{
     const feat=[...row.map(r=>r*ax/100),...row.map(r=>r*ay/100)];
     for(let j=0;j<6;j++){for(let k=0;k<6;k++)a[j][k]+=feat[j]*feat[k];a[j][6]+=feat[j]*(i?dy:dx);}
   });
 }
 for(let i=0;i<6;i++)a[i][i]+=.000001;
 for(let i=0;i<6;i++){
   let p=i;for(let j=i+1;j<6;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;
   [a[i],a[p]]=[a[p],a[i]];const den=a[i][i];if(Math.abs(den)<1e-12)throw Error('예제의 카메라·축 분포 부족');
   for(let k=i;k<7;k++)a[i][k]/=den;
   for(let j=0;j<6;j++)if(j!==i){const f=a[j][i];for(let k=i;k<7;k++)a[j][k]-=f*a[i][k];}
 }
 return [a.slice(0,3).map(row=>row[6]),a.slice(3,6).map(row=>row[6])];
}
export function recommend(kernel,{yaw,pitch,scale,delta,values}){
 const rt=cameraRows(yaw,pitch),[u,v]=kernel.map(vec=>rt.map(row=>dot(row,vec)*scale));
 const aa=dot(u,u),bb=dot(v,v),cc=dot(u,v);
 // 축 한 단위는 전체 조절폭의 100칸이다. 192px 환산 0.40px의 정규화로 깊이가
 // 화면에서 사라지는 각도에서 확보할 수 없는 축값이 폭주하는 일을 줄인다.
 const lambda=.16,p=aa+lambda,q=bb+lambda,det=p*q-cc*cc;
 const du=dot(u,delta),dv=dot(v,delta);
 const raw=[(q*du-cc*dv)/det,(p*dv-cc*du)/det].map(x=>x*100);
 const next=values.map((x,i)=>Math.max(-100,Math.min(100,Math.round(x+raw[i]))));
 const ratio=(aa+bb)?Math.max(0,(aa*bb-cc*cc)/(aa+bb)**2):0;
 return {next,condition:ratio,limited:next.some((q,i)=>q===-100||q===100),projected:[0,1].map(k=>((next[0]-values[0])*u[k]+(next[1]-values[1])*v[k])/100)};
}
export const baselineDirect=(values,delta)=>values.map((v,i)=>Math.max(-100,Math.min(100,Math.round(v+(i?-1:1)*delta[i]*240/192))));

