// 프로젝트가 만든 수학적 단면이다. 실재 사람의 측정값은 쓰지 않는다.
export function random(seed){
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const G=(d,s)=>Math.exp(-.5*(d/s)**2);
export function syntheticHead(seed,distinct=false){
  const r=random(seed),width=.28+.1*r(),depth=.33+.105*r(),jaw=.13+.23*r();
  const nose=.035+.11*r(),exp=1.75+.9*r(),skew=(r()-.5)*.12,ear=.025+.05*r();
  const angularWidth=.12+.22*r(),offset=(r()-.5)*.10,asym=(r()-.5)*.06;
  return (y,count=128)=>{
    const g=Math.sqrt(Math.max(0,1-4*y*y));
    const w=width*g*(1-jaw*Math.max(0,-2*y)),d=depth*g;
    const power=2/exp,cz=offset-.055*Math.max(0,-2*y),cx=skew*y;
    const signed=(t,p)=>Math.sign(t)*Math.abs(t)**p;
    return Array.from({length:count},(_,k)=>{
      const a=k*2*Math.PI/count,c=Math.cos(a),s=Math.sin(a);
      let x=w*signed(c,power),z=d*signed(s,power);
      z+=nose*G(y+.052,.077)*Math.max(0,s)**(1/angularWidth**2);
      z+=.036*G(y+.32,.075)*Math.max(0,s)**8;
      if(distinct){
        // 따로 보류한 족. 옆 돌출, 평평한 뒤통수, 한쪽으로 기운 턱과 각진 광대를 추가한다.
        x+=Math.sign(c)*ear*G(y+.03,.09)*Math.abs(c)**22;
        x+=asym*G(y+.32,.095);
        z=Math.max(z,-.8*d);
        x*=1+.10*G(y+.13,.07)*Math.sin(3*a+.42);
      }
      return [x+cx,z+cz];
    });
  };
}
export function ringSupport(points,angle){
  const c=Math.cos(angle),s=Math.sin(angle);let max=-Infinity;
  for(const [x,z] of points)max=Math.max(max,x*c+z*s);
  return max;
}
export function syntheticMesh(head){
  const v=[],f=[],rows=87,steps=96;
  for(let j=0;j<rows;j++){
    const y=(.5-(j+.1)/(rows-.8))*.998;
    for(const [x,z] of head(y,steps))v.push(Math.round(10000*x),Math.round(10000*y),Math.round(10000*z));
    if(j)for(let k=0;k<steps;k++){
      const a=(j-1)*steps+k,b=(j-1)*steps+(k+1)%steps,c=a+steps,d=b+steps;
      f.push(a,b,c,b,d,c);
    }
  }
  for(let k=1;k<steps-1;k++)f.push(0,k+1,k,(rows-1)*steps,(rows-1)*steps+k,(rows-1)*steps+k+1);
  return {v,f};
}
