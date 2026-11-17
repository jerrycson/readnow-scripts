// 수평 단면의 지지거리. 방향의 단위는 45도이며, 평행 이동은 이웃 곡률량에 영향을 주지 않는다.
const interval=Math.PI/4;
const wrap=i=>(i+8)%8;
export function supportFeatures(s,i){
  const curvature=k=>Math.max(0,s[wrap(k-1)]+s[wrap(k+1)]-2*Math.cos(interval)*s[wrap(k)]);
  const a=curvature(i),b=curvature(i+1);
  return [a,b,curvature(i-1),curvature(i+2),Math.min(a,b)];
}
export function cornerSupport(s,i,quarter){
  const angle=quarter*interval/4;
  return (Math.sin(interval-angle)*s[i]+Math.sin(angle)*s[wrap(i+1)])/Math.sin(interval);
}
export function inferSupport(s,i,quarter,weights){
  const w=weights[quarter-1],features=supportFeatures(s,i);
  const estimate=w.reduce((sum,c,j)=>sum+c*features[j],0);
  const width=Math.min(s[i]+s[wrap(i+4)],s[wrap(i+1)]+s[wrap(i+5)]);
  return cornerSupport(s,i,quarter)-Math.max(0,Math.min(estimate,.15*width));
}
