export const baseFit={width:.9145,center:.51225,depth:1.176,lateral:.04,rim:[0,0,0,0,0]};
export function paperCell(ref,id){
 const c=ref.paper[id],[w,h]=c.size;
 return {id,view:id[0]==='S'?'측면':'사선',box:[0,0,w,h],lines:c.lines.map(l=>l.map(([x,y])=>[x/w,y/h])),markers:c.marks.map(([x,y])=>[x/w,y/h])};
}
export function averageGap(lines,targets){
 const values=[];
 for(let i=0;i<targets.length;i++){
   const actual=lines[i],target=targets[i];if(!actual?.length||!target?.length)continue;
   for(const p of target)values.push(Math.min(...actual.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1]))));
 }
 return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
