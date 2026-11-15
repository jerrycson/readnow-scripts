import {validateSettings} from './model.mjs';
import {bodyStyle} from './body-design.mjs';
import {makeFace} from './facial.mjs';
import {addDesignedHair} from './hair-design.mjs';
import {torsoSurface} from './torso-surface.mjs';
import {limbSurface} from './limb-surface.mjs';
import {footSurface} from './foot-surface.mjs';
import {ellipsoid as E,loft,taper,box,add,sub,mul,mix,lerp,twoBone,bendPoint,transformMeshes} from './geometry.mjs';

// These are original design proportions, not a claim that one ideal body describes all people.
export function proportions(settings){
 const s=validateSettings(settings),n=s.heads,t=(n-2)/6,f=s.sex==='female',style=bodyStyle(s),cute=style==='cute',manga=style==='manga';
 const bulk=(s.candidate==='A'?.94:s.candidate==='C'?1.07:1)*(s.build==='slim'?.90:s.build==='strong'?1.13:1);
 const fat=s.adiposity-.35,muscle=s.muscularity-.35;
 const shoulder=(cute?mix(.27,.41,(n-2)/2):mix(f?.70:.84,f?.84:1,(n-5)/3)*(1+(s.shoulderWidth-.5)*.34+muscle*.12+fat*.10)*(manga?.91:1))*bulk;
 const hip=(cute?mix(.28,.40,(n-2)/2):mix(f?.58:.51,f?.70:.61,(n-5)/3)*(1+(s.pelvisWidth-.5)*.42+fat*.24))*bulk;
 // Head units are measured without hair. The crotch lies below the hip joint.
 const pelvis=cute?.53+.46*(n-2)+.08*(n-2)**2:n*(manga?.535:.52)+.08+(s.legRatio-.5)*.32,shoulderY=n-(cute?1.035:1.32),foot=mix(.075,.14,t);
 const arm=cute?(n-1)*.39:shoulderY-(pelvis-.20),leg=pelvis-foot;
 const chest=shoulder*(cute?.88:.86),waist=cute?hip*1.03:mix(hip*.90,shoulder*.59,.6)*(1+fat*.85-(s.waistCurve-.5)*.36)*(manga?.99:1);
 const depth=(cute?mix(.20,.27,(n-2)/2):mix(.28,.37,(n-5)/3))*(1+fat*.65+muscle*.16);
 return {n,t,f,bulk,shoulder,hip,pelvis,shoulderY,foot,arm,leg,chest,waist,depth,style,cute,manga,fat,muscle};
}
export function gaitFoot(phase,side,stride,lift,run=false){
 const u=((phase/(Math.PI*2)+(side<0?.5:0))%1+1)%1,stance=run?.42:.60;
 if(u<stance)return {z:stride*(.5-u/stance),lift:0,stance:true,u};
 const q=(u-stance)/(1-stance),smooth=q*q*(3-2*q);
 return {z:stride*(-.5+smooth),lift:Math.sin(Math.PI*q)*lift,stance:false,u};
}
export function humanScene(settings,phase=0,action='idle',{breathAmplitude=.08}={}){
 const s=validateSettings(settings),p=proportions(s),{n,t,f,bulk,shoulder,hip,pelvis,shoulderY,foot,arm,leg,depth,cute,manga,fat,muscle}=p,parts=[];
 const moving=action==='walk'||action==='run',running=action==='run',sitting=action==='sit'||action==='sleep';
 const bob=moving?.018*Math.cos(phase*2):.004*Math.sin(phase),lower=sitting?leg*.43:moving?leg*(running?.07:.035):0;
 const py=pelvis-lower+bob,sy=shoulderY-lower+bob,torso=sy-py;
 const lean=action==='reach'?-.12:running?-.09:action==='look'?.04*Math.sin(phase):0;
 const trunk=point=>bendPoint(point,[0,py,0],lean),trunkN=v=>bendPoint(v,[0,0,0],lean);
 const torsoParts=[],chest=p.chest,waist=p.waist;
 const rings=[
  [py-(cute?.13:.26),hip*.69,depth*.85,-.025],
  [py+.08,hip,depth*1.02,-.015],
  [py+torso*.26,waist,depth*(cute?.98:.80+Math.max(0,fat)*.62),.025+Math.max(0,fat)*.16],
  [py+torso*.48,chest*.85,depth*.92,.015],
  [py+torso*.73,chest,depth*(cute?1:f?1.02+s.chestVolume*.24:1.04),.035],
  [sy-.09,shoulder*(cute?.81:.94),depth*.83,0],
  [sy+.055,shoulder*(cute?.49:.64),depth*.65,-.015],
  [sy+.15,mix(.11,.17,t),depth*.50,-.015]
 ];
 torsoSurface(torsoParts,rings,s,p,py,sy);
 if(cute)E(torsoParts,[0,sy+.15,0],[.12,.14,.13],'skin',null,'neck');
 else {
  const neck=loft(torsoParts,[[sy+.02,.20,depth*.58,-.025],[sy+.16,.145,depth*.48,-.015],[sy+.34,.16,depth*.50,-.005]],'skin','neck',24);
  // The nape attaches higher behind the jaw than the front of the throat.
  for(const v of neck.vertices){const q=Math.max(0,Math.min(1,(v.p[1]-sy-.16)/.18)),raw=(1-(v.p[2]+.005)/(depth*.5))/2,factor=Math.max(0,Math.min(1,raw)),dy=.60*q*factor/.18,dz=raw>0&&raw<1?-.30*q*q/depth:0,[nx,ny,nz]=v.n;v.p[1]+=.30*q*q*factor;v.n=[nx,ny/(1+dy),nz-ny*dz/(1+dy)];}
 }
 // Clavicle slope and shoulder cap; skin retains broad planes instead of isolated muscle dots.
 for(const side of [-1,1]){
  const capRadius=(cute?mix(.105,.14,(n-2)/2):mix(f?.14:.17,f?.17:.20,(n-5)/3)+muscle*.13+fat*.16)*bulk;
  if(cute)E(torsoParts,[side*shoulder*.96,sy-.04,0],[capRadius*1.07,.13,capRadius*1.08],'skin',null,'deltoid');
 }
 const garment=s.top==='armor'?'metal':'cloth';
 if(s.top!=='none'){
  const thickness=s.top==='coat'?.075:s.top==='armor'?.065:.035;
  const clothes=rings.slice(1,-1).map(([y,w,d,z])=>[y,w+thickness,d+thickness,z]);
  if(s.top==='coat')clothes.unshift([py-torso*.32,hip*1.13,depth*1.2,-.01]);
  else clothes[0][0]=py+.06;
  loft(torsoParts,clothes,garment,'upper-garment');
  for(const side of [-1,1]){
   taper(torsoParts,[side*.12,sy+.035,depth*.83],[side*chest*.55,sy-torso*.25,depth*1.13],[[0,.10,.025],[.5,.13,.03],[1,.055,.025]],s.top==='armor'?'brass':'cloth','collar');
  }
  if(t>.3)for(let j=0;j<3;j++)E(torsoParts,[.03,sy-torso*(.34+j*.18),depth+thickness+.06],[.035,.035,.025],'brass',null,'button');
 }
 if(s.bottom==='skirt'){
  const hem=py-leg*.45,flare=hip*1.32;
  const skirt=loft(parts,[[hem,flare,depth*1.5,.02],[py-leg*.25,hip*1.18,depth*1.28,0],[py+.16,hip*1.03,depth*1.08,0]],'cloth','skirt');
  for(const v of skirt.vertices){const a=Math.atan2(v.p[2],v.p[0]),weight=(py+.16-v.p[1])/(py+.16-hem);v.p[0]*=1+.035*Math.cos(a*8)*weight;v.p[2]*=1+.035*Math.cos(a*8)*weight;}
 }
 if(s.bottom!=='none')loft(parts,[[py+.04,hip*1.04,depth*1.09],[py+.16,hip*1.04,depth*1.09]],'leather','belt');
 // A local ribcage expansion, shared by skin and clothing. Pelvis and neck stay fixed.
 if(action==='sleep'){
  const amplitude=Math.min(.12,Math.max(0,Number.isFinite(breathAmplitude)?breathAmplitude:0))*(1-Math.cos(phase))/2;
  const start=py+torso*.22,end=sy+.055,span=end-start;
  for(const mesh of torsoParts)for(const v of mesh.vertices){
   const q=(v.p[1]-start)/span;if(q<=0||q>=1)continue;
   const weight=Math.sin(Math.PI*q)**2,derivative=Math.PI*Math.sin(Math.PI*2*q)/span;
   const ax=amplitude*.55/chest,az=amplitude/depth,sx=1+ax*weight,sz=1+az*weight;
   const [x,y,z]=v.p,[nx,ny,nz]=v.n;
   v.p=[x*sx,y,z*sz];v.n=[nx/sx,ny-x*ax*derivative*nx/sx-z*az*derivative*nz/sz,nz/sz];
  }
 }
 transformMeshes(torsoParts,trunk,trunkN);parts.push(...torsoParts);
 const joints={pelvis:[0,py,0],neck:trunk([0,sy+.15,0])},feet=[];
 for(const side of [-1,1]){
  const armW=(cute?mix(.105,.14,(n-2)/2):mix(f?.14:.17,f?.17:.20,(n-5)/3)+muscle*.13+fat*.16)*bulk;
  const sh=trunk([side*(shoulder*(cute?1:.88)+Math.max(0,fat)*.12),sy-(cute?.015:.08),0]);
  let elbow=[sh[0]+side*(cute?.055:.10),sh[1]-arm*.52,sh[2]],wrist=[sh[0]+side*(cute?.055:.18),sh[1]-arm,sh[2]+(cute?0:.025)];
  const swing=moving?Math.sin(phase+(side<0?Math.PI:0))*(running?.62:.30):0;
  elbow=bendPoint(elbow,sh,swing);wrist=bendPoint(wrist,sh,swing);
  if(action==='wave'&&side===1){elbow=[sh[0]+arm*.33,sh[1]-arm*.25,sh[2]+.05];wrist=[elbow[0]+.08+Math.sin(phase*2)*.12,elbow[1]+arm*.45,elbow[2]+.03];}
  if(action==='reach'){elbow=[sh[0]+side*.03,sh[1]-arm*.28,sh[2]+arm*.43];wrist=[sh[0]+side*.01,sh[1]-arm*.38,sh[2]+arm*.86];}
  if(sitting){elbow=[sh[0]+side*.09,sh[1]-arm*.55,sh[2]+.16];wrist=[side*hip*.6,py+.05,leg*.38];}
  if(cute){
   taper(parts,sh,elbow,[[0,armW*.95,armW],[.28,armW*1.06,armW*1.10],[.72,armW*.86,armW*.85],[1,armW*.70,armW*.73]],'skin','upper-arm');
   taper(parts,elbow,wrist,[[0,armW*.73,armW*.76],[.23,armW*.86,armW*.83],[.72,armW*.59,armW*.56],[1,armW*.48,armW*.45]],'skin','forearm');
  }else{
   limbSurface(parts,sh,elbow,armW,'upper-arm',side,s);
   limbSurface(parts,elbow,wrist,armW,'forearm',side,s);
  }
  E(parts,elbow,[armW*.70,armW*.60,armW*.72],'skin',null,'elbow');
  if(s.top!=='none'){
   const cuff=s.top==='shirt'?.55:1,thick=s.top==='coat'?.045:.025;
   taper(parts,sh,elbow,[[0,armW+thick,armW+thick],[.45,armW+thick,armW+thick],[cuff,armW*.78+thick,armW*.78+thick]],garment,'sleeve');
   if(s.top!=='shirt')taper(parts,elbow,wrist,[[0,armW*.82+thick,armW*.82+thick],[.55,armW*.78+thick,armW*.77+thick],[1,armW*.64+thick,armW*.62+thick]],garment,'sleeve-lower');
  }
  const handDirection=action==='wave'&&side===1?[0,1,0]:action==='reach'?[0,-.18,1]:sitting?[0,-.15,1]:[0,-1,0];
  const handLength=cute?mix(.20,.34,(n-2)/2):mix(.62,.71,(n-5)/3),handWidth=cute?armW*.76:.16*(1+fat*.16+muscle*.12),palm=add(wrist,mul(handDirection,handLength*.27));
  E(parts,palm,[handWidth,handLength*.29,cute?armW*.42:.065],'skin',handDirection,'palm');
  const thumbStart=add(wrist,add(mul(handDirection,handLength*.20),[-side*handWidth*.8,0,.02])),thumbEnd=add(wrist,add(mul(handDirection,handLength*.65),[-side*handWidth*1.13,0,.03]));
  taper(parts,thumbStart,thumbEnd,[[0,handWidth*.35,handWidth*.31],[.65,handWidth*.28,handWidth*.26],[1,handWidth*.22,handWidth*.22]],'skin','thumb');
  if(cute)E(parts,add(wrist,mul(handDirection,handLength*.65)),[handWidth*.9,handLength*.35,armW*.42],'skin',handDirection,'mitten');
  else for(const [i,offset]of [-.72,-.24,.24,.72].entries()){
   const digitStart=add(wrist,add(mul(handDirection,handLength*.46),[offset*handWidth,0,0])),digitEnd=add(wrist,add(mul(handDirection,handLength*[.91,1,.95,.80][i]),[offset*handWidth*1.04,0,.02]));
   taper(parts,digitStart,digitEnd,[[0,handWidth*.23,handWidth*.23],[.6,handWidth*.21,handWidth*.21],[1,handWidth*.17,handWidth*.17]],'skin','finger');
  }
  const hx=side*hip*(cute?.57:.60),hipPoint=[hx,py,0],stride=leg*(running?.46:.28),ankleX=cute?hx+side*.025:side*hip*.42;
  const gait=gaitFoot(phase,side,stride,leg*(running?.18:.095),running);
  let ankle=[ankleX,foot+.035+(moving?gait.lift:0),moving?gait.z:0];
  if(action==='kick'&&side===1){const kick=Math.max(0,Math.sin(phase));ankle=[ankleX,foot+.035+leg*.18*kick,leg*.55*kick];}
  if(sitting)ankle=[hx+side*.03,foot+.035,leg*.55];
  const restLeg=Math.hypot(leg-.035,hx-ankleX),knee=twoBone(hipPoint,ankle,restLeg*.51,restLeg*.49),thigh=(cute?mix(.13,.20,(n-2)/2):mix(f?.25:.24,f?.31:.29,(n-5)/3)+fat*.27+muscle*.13)*bulk,calf=(cute?mix(.095,.14,(n-2)/2):mix(.14,.18,(n-5)/3)+fat*.13+muscle*.10)*bulk;
  const pants=s.bottom==='trousers',legMat=pants?'trousers':'skin',extra=pants?.03:0;
  if(cute||pants){
   taper(parts,hipPoint,knee,[[0,thigh*.92+extra,thigh*.98+extra],[.26,thigh+extra,thigh+extra],[.70,thigh*.78+extra,thigh*.81+extra],[1,calf*.83+extra,calf*.9+extra]],legMat,'thigh');
   taper(parts,knee,ankle,[[0,calf*.86+extra,calf*.9+extra],[.30,calf+extra,calf*1.08+extra],[.67,calf*.68+extra,calf*.74+extra],[1,calf*.48+extra,calf*.57+extra]],legMat,'calf');
  }else{
   limbSurface(parts,hipPoint,knee,thigh,'thigh',side,s);
   limbSurface(parts,knee,ankle,calf,'calf',side,s);
  }
  E(parts,knee,[calf*.90+extra,calf*(cute?.90:.70)+extra,calf*.93+extra],legMat,null,'knee');
  const footY=ankle[1]-.035,footZ=ankle[2]+(cute?mix(.055,.12,(n-2)/2):.21),footLength=cute?mix(.17,.25,(n-2)/2):mix(.44,.52,(n-5)/3);
  if(cute||pants)E(parts,[ankle[0],footY,footZ],[cute?mix(.10,.14,(n-2)/2):mix(.18,.21,(n-5)/3),foot,footLength],pants?'leather':'skin',null,'foot');
  else footSurface(parts,ankle,footY-foot,mix(.18,.21,(n-5)/3),footLength,side);
  feet.push({side,ankle,ground:footY-foot,stance:(!moving||gait.stance)&&Math.abs(footY-foot)<1e-7});
  joints[side<0?'left':'right']={shoulder:sh,elbow,wrist,hip:hipPoint,knee,ankle};
 }
 const head=[],headCenter=[0,n-.50-lower+bob,0],chin=n-1-lower+bob;
 const {width:headWidth,depth:headDepth}=makeFace(head,s,p,chin);
 if(s.hair!=='none'&&!addDesignedHair(head,s,p,chin,headWidth,headDepth,phase,moving)){
  E(head,[0,chin+.80,-.015],[headWidth*1.055,.245,headDepth*1.055],'hair',null,'hair-cap');
  for(const side of [-1,1]){
   E(head,[side*headWidth*.75,chin+.66,-.10],[.16,.24,.27],'hair',null,'hair-side');
   E(head,[side*.16,chin+.73,.25],[.205,.16,.13],'hair',[side*.45,-1,0],'fringe');
  }
  if(s.hair==='bob'||s.hair==='long'){
   const len=s.hair==='long'?mix(.65,1.18,t):.55;
   for(const side of [-1,1])taper(head,[side*headWidth*.86,chin+.71,-.09],[side*headWidth*.94,chin+.67-len,-.12],[[0,.13,.21],[.50,.16,.24],[1,.12,.18]],'hair','hair-curtain');
   E(head,[0,chin+.53-len*.35,-.27],[headWidth,.22+len*.40,.16],'hair',null,'hair-back');
  }
  if(s.hair==='ponytail'){
   E(head,[0,chin+.75,-.39],[.14,.14,.12],'brass',null,'hair-tie');
   const sway=Math.sin(phase- .6)*(moving?.15:.04);
   taper(head,[0,chin+.75,-.41],[sway,chin+.06,-.56],[[0,.10,.10],[.30,.17,.14],[1,.055,.06]],'hair','ponytail');
  }
 }
 if(s.accessory==='goggles')for(const side of [-1,1]){
  E(head,[side*.15,chin+.51,.349],[.093,.071,.04],'brass',null,'goggle-rim');
  E(head,[side*.15,chin+.51,.378],[.067,.046,.018],'glow',null,'goggle-lens');
 }
 const headLook=action==='look'?.42*Math.sin(phase):0;
 const headPivot=trunk([0,sy+.18,0]);
 transformMeshes(head,v=>bendPoint(trunk(v),headPivot,headLook,'y'),v=>bendPoint(trunkN(v),[0,0,0],headLook,'y'));parts.push(...head);
 if(s.accessory==='satchel'){
  taper(parts,trunk([-shoulder*.60,sy-.04,depth+.06]),[hip*.92,py+.05,depth+.06],[[0,.04,.035],[1,.04,.035]],'leather','bag-strap');
  box(parts,[hip*.94,py-.12,depth+.12],[.19,.23,.10],'leather','satchel');box(parts,[hip*.94,py-.07,depth+.227],[.045,.05,.018],'brass','buckle');
 }
 if(s.accessory==='scarf'){
  E(parts,trunk([0,sy+.12,.01]),[mix(.18,.29,t),.10,.25],'cloth',null,'scarf-collar');
  taper(parts,trunk([.13,sy+.06,depth*.85]),trunk([.24,sy-torso*.45,depth*1.18]),[[0,.09,.04],[1,.115,.035]],'cloth','scarf-tail');
 }
 if(action==='sleep'){
  transformMeshes(parts,v=>bendPoint(v,[0,n*.34,0],Math.PI/2,'z'),v=>bendPoint(v,[0,0,0],Math.PI/2,'z'));
  let min=Infinity;for(const mesh of parts)for(const v of mesh.vertices)min=Math.min(min,v.p[1]);
  transformMeshes(parts,v=>[v[0],v[1]-min,v[2]],v=>v);
 }
 return {parts,height:n,frame:n+(action==='sleep'?1.5:1.1),cameraCenter:action==='sleep'?[-n*.16,Math.max(shoulder,hip)+.42,.12]:undefined,joints,feet,proportions:p,gait:{stride:leg*(running?.46:.28),stance:running?.42:.60},provenance:'original-anatomy-study-v8'};
}
