import {paperForms} from './paperforms35.mjs';

const table=new Map(paperForms.map(form=>[form.id,form]));
const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
function smooth(a,b,x){const t=bound((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function sample(values,t){
  const u=bound(t,0,1)*(values.length-1),i=Math.floor(u),j=Math.min(i+1,values.length-1);
  return typeof values[i]==='number'?values[i]+(values[j]-values[i])*(u-i):values[i].map((v,k)=>v+(values[j][k]-v)*(u-i));
}
export function paperForm(id){return table.get(id)||table.get('W');}
// The height and width in the trace share a scale. Uniform size changes leave
// the entire central outline, including the return from its lowest point, similar.
export const paperCalibration={width:.9145,center:.51225,depth:1.176,marker:.558};
function formCalibration(settings){return settings.paperCalibration||paperCalibration;}
export function paperShape(settings,chest,hipY,shoulderY){
  const calibration=formCalibration(settings),form=paperForm(settings.paperForm),torso=shoulderY-hipY;
  const size=.67+.73*settings.chestVolume,scale=Math.min(chest*1.12,torso*.30)*size;
  const radius=calibration.width*scale*form.width*(.84+.32*settings.breastRootWidth);
  const center=chest*(calibration.center+.16*(settings.breastSeparation-.5));
  const top=hipY+.934*torso+scale*.09-.12*torso*(settings.breastDrop-.30);
  const profile=settings.contourProfile||form.side,rim=form.rim,end=profile.at(-1)[0];
  const projection=calibration.depth*(.63+.74*settings.breastProjection);
  const topVolume=settings.breastUpperFullness-.35;
  const apex=profile.reduce((a,p)=>p[1]>a[1]?p:a);
  function frame(hand,q=0){
    const h=scale*(1+.20*hand*(settings.breastAsymmetry-.10));
    const chord=Math.sqrt(Math.max(0,1-Math.min(1,q*q))),localTop=top-.55*h*(1-chord);
    return {h:h*chord,c:hand*center,top:localTop,foot:localTop-end*h*chord,root:radius};
  }
  function point(x,y,z,weight=1){
    if(!weight)return [x,y,z];
    const side=x<0?-1:1,{h:full,c}=frame(side);
    const q=(x-c)/radius,at=Math.abs(q);
    if(at>=1)return [x,y,z];
    const {h,foot,top:localTop}=frame(side,q),u=(localTop-y)/(localTop-foot);
    if(u<=0||u>=1)return [x,y,z];
    const [down,depth]=sample(profile,u),lateral=Math.sqrt(Math.max(0,1-q*q));
    const t=(side*q+1)/2;
    const turn=sample(rim,t)-sample(rim,.5);
    const dz=depth*h*projection*(1+topVolume*.68*(1-u));
    const dy=y-(localTop-down*h);
    const lower=smooth(.25,.70,u)*(1-smooth(.84,1,u));
    const sideJoin=1-smooth(.87,1,at);
    const riseFromForeshortening=(full-h)*.45;
    const shift=(full*(2*form.width)*turn-riseFromForeshortening)*.62*lower;
    return [x+weight*dz*side*(.055+.13*(settings.breastSplay-.4)),y+weight*sideJoin*(shift-dy),z+weight*dz];
  }
  function meridian(hand,count=81){
    const f=frame(hand);return Array.from({length:count},(_,i)=>{const u=i/(count-1);
      return point(f.c,f.top+(f.foot-f.top)*u,0);});
  }
  return {form,frame,point,meridian,marker:hand=>({x:hand*center,y:top-scale*(form.id==='W'?calibration.marker:apex[0])}),radius,scale};
}
