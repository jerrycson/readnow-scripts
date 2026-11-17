import {supportedLip50} from './face-support50.mjs';
const mix=(a,b,t)=>a.map((x,i)=>x+t*(b[i]-x));

// D의 겉면에 윗입술·아랫입술이 맞닿는 중앙 곡선을 따로 둔다.
// 고정된 3차원 함수이며 촬영 방향·출력 해상도에 따른 분기는 없다.
export function contactLip50(base,id,{narrow,lift,tip}){
 const d=supportedLip50(base,id);
 const interp=(part,col,row)=>mix(part.vertices[col].p,part.vertices[172+col].p,row);
 const parts=d.parts.map(part=>{
   const line=part.name==='mouth-line34',upper=part.name==='upper-lip34';
   if(!line&&!upper&&part.name!=='lower-lip34')return part;
   const cols=line?43:37,vertices=part.vertices.map((v,i)=>{
     const col=i%cols,u=2*col/(cols-1)-1,t=Math.floor(i/cols)/4;
     // 선폭은 입술 중간만 줄이고 팁과 먼 쪽 시야에 걸리는 양 끝은 보존한다.
     const window=(1-u*u)**2,w=window*(.26+.74*Math.exp(-((u/.52)**2)));
     const y=lift*window,point=line?interp(part,col,.4+(t-.4)*(1-narrow*w)):[...v.p];
     // 좁은 앞중앙의 돌출과 닿는 면은 같은 마스크를 공유한다. 깊이는 입꼬리에서 0.
     const boundaryWeight=line?1:(1-t)**2;
     const dy=y*boundaryWeight,dz=tip*Math.exp(-((u/.36)**2))*window*boundaryWeight;
     const slope=Math.abs(v.n[2])>.28?-v.n[1]/v.n[2]:0;
     return {...v,p:[point[0],point[1]+dy,point[2]+dy*slope+dz]};
   });return {...part,vertices};
 });
 return {...d,parts};
}
export const contactValues50=Object.freeze({
 F02:{narrow:.06,lift:.0023,tip:.0018}, M01:{narrow:.25,lift:.0027,tip:0}
});
