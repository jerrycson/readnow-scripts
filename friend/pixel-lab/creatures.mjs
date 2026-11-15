import {ellipsoid as E,taper,box,add,bendPoint} from './geometry.mjs';
import {gaitFoot} from './anatomy.mjs';
export function creatureScene(s,phase=0,action='idle'){
 const parts=[],kind=s.species,moving=action==='walk'||action==='run',running=action==='run',wave=action==='wave',rest=action==='sit'||action==='sleep';
 const bob=moving?Math.cos(phase*2)*.035:Math.sin(phase)*.012;
 const eyes=(center,spacing,size=.06)=>{for(const side of [-1,1])E(parts,add(center,[side*spacing,0,0]),[size,size*.85,size*.45],'eye',null,'eye');};
 if(['fox','cat','drake'].includes(kind)){
  const cat=kind==='cat',dragon=kind==='drake',mat=dragon?'scale':'fur',length=cat?.60:.76,base=rest?.58:1.05;
  E(parts,[0,base+bob,-.12],[cat?.38:.43,cat?.39:.43,length],mat,null,'quadruped-body');
  E(parts,[0,base+.18+bob,.46],[.34,.40,.34],dragon?'white':mat,null,'chest');
  const headY=base+.52+(action==='look'?.08*Math.sin(phase):0);
  E(parts,[0,headY,.70],[cat?.36:.32,.34,cat?.31:.40],mat,null,'head');
  E(parts,[0,headY-.10,cat?.97:1.06],[cat?.19:.21,.15,cat?.15:.31],'white',null,'muzzle');
  E(parts,[0,headY-.075,cat?1.10:1.32],[.075,.06,.055],'eye',null,'nose');
  eyes([0,headY+.035,.99],.18,.05);
  for(const side of [-1,1]){
   taper(parts,[side*.22,headY+.20,.60],[side*.28,headY+(cat?.60:.68),.59],[[0,.16,.115],[1,.008,.015]],dragon?'brass':mat,'ear-or-horn');
   if(!dragon)taper(parts,[side*.225,headY+.28,.687],[side*.27,headY+.55,.635],[[0,.075,.025],[1,.005,.008]],'leather','inner-ear');
   for(const front of [true,false]){
    const offset=(side<0?Math.PI:0)+(front?.35:0),g=gaitFoot(phase+offset,1,.46,running?.26:.14,running);
    const root=[side*.29,base-.14,front?.41:-.57],paw=[side*.30,.13+(moving?g.lift:0),(front?.53:-.60)+(moving?g.z:0)];
    const middle=[side*.31,(root[1]+paw[1])*.5,paw[2]+(front?-.10:.16)];
    taper(parts,root,middle,[[0,.13,.15],[1,.085,.09]],mat,'upper-leg');taper(parts,middle,paw,[[0,.09,.10],[1,.065,.07]],mat,'lower-leg');
    E(parts,[paw[0],paw[1]-.04,paw[2]+.055],[.105,.09,.14],front?'white':mat,null,'paw');
   }
  }
  const sway=Math.sin(phase-.6)*.22;
  const tailStart=[0,base+.10,-length*.95],tailMiddle=[sway,base+.34,-1.2],tailEnd=[sway+.10,base+(cat?.78:.38),-1.69];
  taper(parts,tailStart,tailMiddle,[[0,.15,.16],[.6,cat?.09:.25,cat?.09:.25],[1,cat?.075:.22,cat?.075:.22]],mat,'tail');
  taper(parts,tailMiddle,tailEnd,[[0,cat?.075:.22,cat?.075:.22],[.6,cat?.07:.15,cat?.07:.15],[1,.025,.025]],cat?mat:'white','tail-tip');
  if(dragon){
   for(const side of [-1,1]){
    const up=wave?Math.sin(phase)*.25:0;
    taper(parts,[side*.30,base+.25,-.10],[side*1.05,base+.8+up,-.35],[[0,.09,.08],[1,.035,.035]],'scale','wing-arm');
    const verts=[[side*.35,base+.2,-.12],[side*1.05,base+.8+up,-.35],[side*.83,base+.30,-.72],[side*.42,base+.18,-.66]];
    parts.push({mat:'leather',name:'wing-membrane',vertices:verts.map(p=>({p,n:[side*.2,.7,.5]})),faces:[[0,1,2],[0,2,3]]});
   }
   for(let i=0;i<4;i++)taper(parts,[0,base+.4,-.15-i*.23],[0,base+.64,-.17-i*.23],[[0,.075,.12],[1,.005,.008]],'brass','spine');
  }
  if(s.accessory==='scarf')E(parts,[0,base+.4,.55],[.37,.10,.32],'cloth',null,'scarf');
  if(s.accessory==='satchel')box(parts,[.43,base+.1,-.16],[.11,.22,.25],'leather','saddlebag');
  return {parts,height:2.5,frame:4.5,provenance:'original-quadruped-v2'};
 }
 if(kind==='bird'){
  const base=rest?.62:1.0;
  E(parts,[0,base+bob,0],[.44,.60,.40],'white',null,'bird-body');E(parts,[0,base+.62,.13],[.34,.34,.32],'fur',null,'bird-head');
  eyes([0,base+.67,.41],.16,.055);
  taper(parts,[0,base+.56,.39],[0,base+.50,.77],[[0,.12,.13],[1,.008,.008]],'brass','beak');
  for(const side of [-1,1]){
   const flap=wave?Math.sin(phase*2)*.8:0;
   taper(parts,[side*.36,base+.27,0],[side*(.57+Math.max(0,flap)*.7),base-.3+flap,-.12],[[0,.16,.24],[.6,.12,.20],[1,.025,.045]],'cloth','wing');
   const g=gaitFoot(phase,side,.34,.12),foot=[side*.18,.055+(moving?g.lift:0),(moving?g.z:0)+.06];
   taper(parts,[side*.18,base-.4,0],foot,[[0,.04,.045],[1,.035,.035]],'brass','leg');
   for(const dx of [-.055,0,.055])taper(parts,foot,[foot[0]+dx,.04,foot[2]+.20],[[0,.025,.025],[1,.012,.012]],'brass','toe');
  }
  for(const side of [-1,0,1])taper(parts,[side*.08,base-.05,-.30],[side*.17,base-.23,-.75],[[0,.09,.04],[1,.06,.025]],'cloth','tail-feather');
  return {parts,height:2.2,frame:3.4,provenance:'original-bird-v2'};
 }
 const robot=kind==='robot',golem=kind==='golem',mat=robot?'metal':golem?'stone':'alien',height=robot?3.2:golem?3.4:3.6;
 const lower=rest?.65:0,bodyY=height*.53-lower+bob;
 if(robot){box(parts,[0,bodyY,0],[.48,.49,.30],mat,'robot-chest');box(parts,[0,bodyY,.316],[.26,.23,.025],'cloth','chest-panel');E(parts,[0,bodyY,.35],[.11,.11,.025],'glow',null,'status-light');}
 else E(parts,[0,bodyY,0],[golem?.62:.36,golem?.65:.58,golem?.39:.28],mat,null,'body');
 const headY=height-.45-lower+bob;
 taper(parts,[0,bodyY+.36,0],[0,headY-.23,0],[[0,.15,.15],[1,.14,.14]],robot?'brass':mat,'neck-connector');
 if(robot){box(parts,[0,headY,0],[.43,.32,.31],mat,'head');box(parts,[0,headY,.323],[.31,.11,.025],'eye','visor');for(const side of [-1,1])box(parts,[side*.15,headY,.354],[.045,.035,.02],'glow','eye');taper(parts,[.23,headY+.32,0],[.23,headY+.62,0],[[0,.025,.025],[1,.025,.025]],'brass','antenna');E(parts,[.23,headY+.65,0],[.06,.06,.06],'glow');}
 else {E(parts,[0,headY,0],[golem?.41:.49,golem?.39:.50,golem?.34:.36],mat,null,'head');eyes([0,headY-.015,golem?.32:.335],golem?.16:.24,golem?.065:.12);}
 for(const side of [-1,1]){
  const sh=[side*(golem?.62:.48),bodyY+.35,0],swing=moving?Math.sin(phase+(side<0?Math.PI:0))*.36:0;
  let hand=[side*(golem?.80:.61),bodyY-.65,0];hand=bendPoint(hand,sh,swing);
  if(wave&&side===1)hand=[sh[0]+.3,sh[1]+.48+.12*Math.sin(phase*2),.06];
  const elbow=[(sh[0]+hand[0])/2,(sh[1]+hand[1])/2,.09];
  for(const [a,b]of [[sh,elbow],[elbow,hand]])taper(parts,a,b,[[0,golem?.23:.12,golem?.23:.12],[.5,golem?.25:.11,golem?.23:.11],[1,golem?.18:.09,golem?.18:.09]],mat,'arm');
  E(parts,elbow,[.13,.13,.13],robot?'brass':mat);E(parts,hand,[golem?.22:.13,golem?.23:.18,.13],mat,null,'hand');
  if(!robot&&!golem)taper(parts,[side*.32,bodyY,0],[side*.75,bodyY-.32,.35],[[0,.075,.075],[1,.055,.055]],mat,'second-arm');
  const g=gaitFoot(phase,side,.55,.20),ankle=[side*(golem?.28:.23),.17+(moving?g.lift:0),(moving?g.z:0)+(rest?.35:0)],hip=[side*.25,bodyY-.40,0],knee=[side*.26,(hip[1]+ankle[1])*.5,.08];
  for(const [a,b]of [[hip,knee],[knee,ankle]])taper(parts,a,b,[[0,golem?.23:.13,golem?.21:.13],[1,golem?.19:.10,golem?.18:.10]],mat,'leg');
  E(parts,ankle,[golem?.25:.18,.17,.30],robot?'leather':mat,null,'foot');
  if(golem)for(let j=0;j<3;j++)E(parts,[side*(.42+j*.10),bodyY+.62+j*.045,-.02],[.12,.20,.05],'leaf',[side*.9,.5,0],'shoulder-leaf');
 }
 if(golem)taper(parts,[0,headY+.30,0],[.13,headY+.77,0],[[0,.055,.055],[1,.025,.025]],'leather','sprout-stem');
 if(golem)for(const side of [-1,1])E(parts,[side*.14,headY+.66,0],[.20,.08,.055],'leaf',[side, .4,0],'sprout-leaf');
 if(!golem&&!robot)for(const side of [-1,1])taper(parts,[side*.28,headY+.35,-.06],[side*.38,headY+.72,-.1],[[0,.08,.07],[1,.025,.025]],'glow','antenna');
 return {parts,height,frame:height+1.5,provenance:'original-fantasy-scifi-v2'};
}
