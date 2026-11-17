const ramp=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
// 앞판 실패 뒤 별도로 만든 세로 턱높이 축. 낮은 턱과 좁은 턱을 독립적으로 비교한다.
export function libraryChinHeight50(scene,height){
 if(!Number.isFinite(height)||height===0)return scene;
 const chin=scene.landmarks.chin[1],skin=scene.parts[0].vertices,delta=Math.max(-.05,Math.min(.05,height));
 function shift([x,y,z]){const h=y-chin;return delta*ramp(.05,.22,z)*ramp(-.12,-.045,h)*(1-ramp(.045,.225,h))*(1-ramp(.18,.33,Math.abs(x)));}
 const vertices=skin.map(v=>{const p=v.p,d=shift(p);if(Math.abs(d)<1e-10)return v;const grad=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=.0001;b[k]-=.0001;return(shift(a)-shift(b))/.0002;});
 const ny=v.n[1]/(1+grad[1]),n=[v.n[0]-ny*grad[0],ny,v.n[2]-ny*grad[2]],l=Math.hypot(...n)||1;return {...v,p:[p[0],p[1]+d,p[2]],n:n.map(t=>t/l)};});
 return {...scene,parts:scene.parts.map(p=>p.vertices===skin?{...p,vertices}:p)};
}

export const libraryHeightChecks50=Object.freeze({M02:{height:.04,state:'보류'},M03:{height:-.04,state:'실패'},M04:{height:.02,state:'가시 조건 개선 · 눈 감은 사선 미확정'}});
export function candidateLibraryHeight50(scene,id){const q=libraryHeightChecks50[id];return q?libraryChinHeight50(scene,q.height):scene;}
