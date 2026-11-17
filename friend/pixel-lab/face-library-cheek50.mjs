// 35차에는 없는 턱 양옆의 수평 폭 실험. 실제 피부 정점만 바꾸며 얼굴 중심과 턱뒤 범위는 고정한다.
const ramp=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function libraryCheek50(scene,gain){
 if(!Number.isFinite(gain)||gain===0)return scene;
 const chin=scene.landmarks.chin[1],skin=scene.parts[0].vertices,s=Math.max(-.16,Math.min(.16,gain));
 function shift([x,y,z]){const h=y-chin;return s*x*ramp(.055,.16,Math.abs(x))*ramp(.00,.20,z)*ramp(-.035,.065,h)*(1-ramp(.18,.39,h));}
 const vertices=skin.map(v=>{
  const p=v.p,d=shift(p);if(Math.abs(d)<1e-10)return v;
  const grad=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=.0001;b[k]-=.0001;return (shift(a)-shift(b))/.0002;});
  const nx=v.n[0]/(1+grad[0]),n=[nx,v.n[1]-nx*grad[1],v.n[2]-nx*grad[2]],l=Math.hypot(...n)||1;
  return {...v,p:[p[0]+d,p[1],p[2]],n:n.map(t=>t/l)};
 });return {...scene,parts:scene.parts.map(p=>p.vertices===skin?{...p,vertices}:p)};
}
export const libraryChecks50=Object.freeze({
 F01:{gain:.16,state:'보류',why:'두 사선·측면 중 원화 3·4에서 소폭 악화'},
 F03:{gain:.16,state:'가시 피부선에서 개선',why:'정면·양사선 개선, 왼쪽 측면 동일. 정면 한쪽 눈은 앞머리에 가려짐'},
 F05:{gain:.16,state:'가시 피부선에서 개선',why:'정면·양사선 개선, 오른쪽 측면 동일'},
 M02:{gain:.08,state:'보류',why:'정면 개선, 양사선에서 악화'},
 M03:{gain:-.16,state:'실패',why:'정면·다른 구도 악화 및 좌우 피부 계단 악화'},
 M04:{gain:.16,state:'보류',why:'정면·별도 측면에서 개선. 눈 감은 사선 등록 불가, 기존 측면 0.001px 증가'}
});
export function candidateLibraryFace50(scene,id){
 const check=libraryChecks50[id];return check?libraryCheek50(scene,check.gain):scene;
}
