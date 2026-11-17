import {validateSettings} from './h_2808ced6e038628c01d7ec6d8b5f9bdcf58dcf7118e0cbf0ccac9b6796fc42cb.mjs';
import {bodyStyle} from './h_b82908329f468713f028b7063c113220d8550f989629fbb25aaeaa1dedc0669d.mjs';
import {makeFace} from './h_8c7f1d17431ae39105f004cedd704256f73607e4e44f061bff019b32834844ae.mjs';
import {addDesignedHair} from './h_be2a8e04faa8c1bf9020879fb9fcfcd89a60d43c492aa7157bfb3e1084a03822.mjs';
import {ellipsoid as E,loft,taper,box,add,sub,mul,mix,lerp,twoBone,bendPoint,transformMeshes} from './h_012707cff711206a2d665296f9a4e116eeda05818d85e83dd0a4bfa29c5a8103.mjs';

// These are original design proportions, not a claim that one ideal body describes all people.
export function proportions(settings){
 const s=validateSettings(settings),n=s.heads,t=(n-2)/6,f=s.sex==='female',style=bodyStyle(s),cute=style==='cute',manga=style==='manga';
 const bulk=(s.candidate==='A'?.94:s.candidate==='C'?1.07:1)*(s.build==='slim'?.90:s.build==='strong'?1.13:1);
 const fat=s.adiposity-.35,muscle=s.muscularity-.35;
 const shoulder=(cute?mix(.34,.50,(n-2)/2):mix(f?.70:.84,f?.84:1,(n-5)/3)*(1+(s.shoulderWidth-.5)*.34+muscle*.12+fat*.10))*bulk;
 const hip=(cute?mix(.29,.43,(n-2)/2):mix(f?.58:.51,f?.70:.61,(n-5)/3)*(1+(s.pelvisWidth-.5)*.42+fat*.24))*bulk;
 const pelvis=.10+(n-1)*(cute?.43:.52+(s.legRatio-.5)*.065+(manga?.015:0)),shoulderY=n-(cute?1.035:1.30),foot=mix(.075,.14,t);
 const arm=(n-1)*(cute?.39:.43),leg=pelvis-foot;
 const chest=shoulder*(cute?.90:.86),waist=cute?hip*.92:mix(hip*.90,shoulder*.59,.6)*(1+fat*.85-(s.waistCurve-.5)*.36)*(manga?.96:1);
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
  [py-.13,hip*.69,depth*.85,-.025],
  [py+.08,hip,depth*1.02,-.015],
  [py+torso*.26,waist,depth*(cute?.98:.80+Math.max(0,fat)*.62),.025+Math.max(0,fat)*.16],
  [py+torso*.48,chest*.85,depth*.92,.015],
  [py+torso*.73,chest,depth*(cute?1:f?1.02+s.chestVolume*.24:1.04),.035],
  [sy-.09,shoulder*.81,depth*.83,0],
  [sy+.055,shoulder*.49,depth*.65,-.015],
  [sy+.15,mix(.11,.17,t),depth*.50,-.015]
 ];
 loft(torsoParts,rings,'skin','ribcage-waist-pelvis');
 if(!cute)for(const side of [-1,1]){
  if(s.bottom==='none'&&s.top!=='coat')E(torsoParts,[side*hip*.46,py-.015,-depth*.47],[hip*.55,.23+torso*.025,depth*.72],'skin',null,'gluteal-mass');
  if(f&&s.top==='none'){const volume=.5+s.chestVolume*.95;E(torsoParts,[side*chest*.43,py+torso*(.71-s.age*.025),depth*.72],[chest*.40*volume,torso*.105*volume,depth*.50*volume],'skin',null,'chest-volume');}
  if(!f&&s.top==='none'&&s.muscularity>.5)E(torsoParts,[side*chest*.45,py+torso*.73,depth*.60],[chest*.46,torso*.14,depth*.52],'skin',null,'pectoral-mass');
 }
 if(cute)E(torsoParts,[0,sy+.15,0],[.12,.14,.13],'skin',null,'neck');
 else loft(torsoParts,[[sy+.02,.20,depth*.58,-.015],[sy+.16,.145,depth*.48,-.015],[sy+.34,.16,depth*.50,-.005]],'skin','neck');
 if(!cute&&s.top==='none'&&s.muscularity>.65&&s.adiposity<.5){
  for(const side of [-1,1])for(let row=0;row<3;row++)E(torsoParts,[side*chest*.19,py+torso*(.38+row*.105),depth*(.86+row*.045)],[chest*.19,torso*.063,depth*.13],'skin',null,'abdominal-plane');
 }
 // Clavicle slope and shoulder cap; skin retains broad planes instead of isolated muscle dots.
 for(const side of [-1,1]){
  E(torsoParts,[side*shoulder*.73,sy-.02,0],[shoulder*.31,.13+ t*.06,depth*.8],'skin',null,'deltoid');
  if(t>.35)taper(torsoParts,[side*.12,sy+.045,depth*.53],[side*shoulder*.76,sy-.015,depth*.65],[[0,.035,.03],[.5,.045,.035],[1,.03,.025]],'skin','clavicle');
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
  const sh=trunk([side*(shoulder+Math.max(0,fat)*.16),sy-.015,0]);
  let elbow=[sh[0]+side*.055,sh[1]-arm*.52,sh[2]],wrist=[sh[0]+side*.055,sh[1]-arm,sh[2]];
  const swing=moving?Math.sin(phase+(side<0?Math.PI:0))*(running?.62:.30):0;
  elbow=bendPoint(elbow,sh,swing);wrist=bendPoint(wrist,sh,swing);
  if(action==='wave'&&side===1){elbow=[sh[0]+arm*.33,sh[1]-arm*.25,sh[2]+.05];wrist=[elbow[0]+.08+Math.sin(phase*2)*.12,elbow[1]+arm*.45,elbow[2]+.03];}
  if(action==='reach'){elbow=[sh[0]+side*.03,sh[1]-arm*.28,sh[2]+arm*.43];wrist=[sh[0]+side*.01,sh[1]-arm*.38,sh[2]+arm*.86];}
  if(sitting){elbow=[sh[0]+side*.09,sh[1]-arm*.55,sh[2]+.16];wrist=[side*hip*.6,py+.05,leg*.38];}
  taper(parts,sh,elbow,[[0,armW*.95,armW],[.25,armW*1.05,armW*1.03],[.72,armW*.86,armW*.85],[1,armW*.70,armW*.73]],'skin','upper-arm');
  E(parts,elbow,[armW*.74,armW*.74,armW*.74],'skin',null,'elbow');
  taper(parts,elbow,wrist,[[0,armW*.73,armW*.76],[.23,armW*.86,armW*.83],[.72,armW*.59,armW*.56],[1,armW*.48,armW*.45]],'skin','forearm');
  if(s.top!=='none'){
   const cuff=s.top==='shirt'?.55:1,thick=s.top==='coat'?.045:.025;
   taper(parts,sh,elbow,[[0,armW+thick,armW+thick],[.45,armW+thick,armW+thick],[cuff,armW*.78+thick,armW*.78+thick]],garment,'sleeve');
   if(s.top!=='shirt')taper(parts,elbow,wrist,[[0,armW*.82+thick,armW*.82+thick],[.55,armW*.78+thick,armW*.77+thick],[1,armW*.64+thick,armW*.62+thick]],garment,'sleeve-lower');
  }
  const handDirection=action==='wave'&&side===1?[0,1,0]:action==='reach'?[0,-.18,1]:sitting?[0,-.15,1]:[0,-1,0];
  const handLength=mix(.13,.32,t),palm=add(wrist,mul(handDirection,handLength*.42));
  E(parts,palm,[armW*.70,handLength*.55,armW*.42],'skin',handDirection,'palm');
  E(parts,add(palm,[-side*armW*.73,0,.02]),[armW*.31,handLength*.29,armW*.34],'skin',handDirection,'thumb');
  for(const offset of [-.35,.35])E(parts,add(wrist,add(mul(handDirection,handLength*.91),[offset*armW,0,0])),[armW*.28,handLength*.29,armW*.30],'skin',handDirection,'fingers');
  const hx=side*hip*.57,hipPoint=[hx,py,0],stride=leg*(running?.46:.28);
  const gait=gaitFoot(phase,side,stride,leg*(running?.18:.095),running);
  let ankle=[hx+side*.025,foot+.035+(moving?gait.lift:0),moving?gait.z:0];
  if(action==='kick'&&side===1){const kick=Math.max(0,Math.sin(phase));ankle=[hx+side*.025,foot+.035+leg*.18*kick,leg*.55*kick];}
  if(sitting)ankle=[hx+side*.03,foot+.035,leg*.55];
  const restLeg=leg-.035,knee=twoBone(hipPoint,ankle,restLeg*.51,restLeg*.49),thigh=(cute?mix(.13,.20,(n-2)/2):mix(f?.25:.24,f?.31:.29,(n-5)/3)+fat*.27+muscle*.13)*bulk,calf=(cute?mix(.095,.14,(n-2)/2):mix(.14,.18,(n-5)/3)+fat*.13+muscle*.10)*bulk;
  const pants=s.bottom==='trousers',legMat=pants?'trousers':'skin',extra=pants?.03:0;
  taper(parts,hipPoint,knee,[[0,thigh*.92+extra,thigh*.98+extra],[.26,thigh+extra,thigh+extra],[.70,thigh*.78+extra,thigh*.81+extra],[1,calf*.83+extra,calf*.9+extra]],legMat,'thigh');
  E(parts,knee,[calf*.90+extra,calf*.90+extra,calf*.93+extra],legMat,null,'knee');
  taper(parts,knee,ankle,[[0,calf*.86+extra,calf*.9+extra],[.30,calf+extra,calf*1.08+extra],[.67,calf*.68+extra,calf*.74+extra],[1,calf*.48+extra,calf*.57+extra]],legMat,'calf');
  const footY=ankle[1]-.035,footZ=ankle[2]+mix(.055,.16,t),footLength=mix(.155,.34,t);
  E(parts,[ankle[0],footY,footZ],[mix(.09,.145,t),foot,footLength],pants?'leather':'skin',null,'foot');
  feet.push({side,ankle,ground:footY-foot,stance:!moving||gait.stance});
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
 return {parts,height:n,frame:n+1.1,joints,feet,proportions:p,gait:{stride:leg*(running?.46:.28),stance:running?.42:.60},provenance:'original-anatomy-study-v2'};
}
