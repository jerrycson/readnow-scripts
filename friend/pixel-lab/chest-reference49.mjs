const byId=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,text){
 const node=document.createElementNS(ns,tag);
 for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
 if(text)node.textContent=text;
 return node;
}
const el=byId('plate');
let data,active='waist';
const index={waist:{photo:'b',surface:'e'},behindHead:{photo:'c',surface:'f'}};
const mode=()=>document.querySelector('input[name=view]:checked').value;
function photo(id){
 const r=data.source.panels[id],box=r.box,atlas=data.source.atlasBox;
 const crop=svg('svg',{x:box[0],y:box[1],width:box[2]-box[0],height:box[3]-box[1],
   viewBox:[box[0],box[1],box[2]-box[0],box[3]-box[1]].join(' '),overflow:'hidden'});
 crop.append(svg('image',{href:data.source.atlas,x:atlas[0],y:atlas[1],width:atlas[2]-atlas[0],height:atlas[3]-atlas[1],preserveAspectRatio:'none'}));return crop;
}
function strokes(groups,color,dashed=false){
 const node=svg('g',{fill:'none',stroke:color,'stroke-width':2.1,'stroke-linejoin':'round',...(dashed?{'stroke-dasharray':'4 2'}:{})});
 for(const lines of groups)for(const line of lines)node.append(svg('polyline',{points:line.map(p=>p.join(',')).join(' ')}));
 return node;
}
function comparableModel(p,angle) {
 const model=p.model[angle].lines;
 return p.observed.map((runs,side)=>runs.flatMap(run=>{
   const out=[];let line=[];
   for(const [x] of run){
     let lower=-Infinity;
     for(const [a,b] of model[side]){
       const dx=b[0]-a[0];
       if(Math.abs(dx)<1e-8||(a[0]-x)*(b[0]-x)>0)continue;
       lower=Math.max(lower,a[1]+(x-a[0])*(b[1]-a[1])/dx);
     }
     if(Number.isFinite(lower))line.push([x,lower]);
     else {if(line.length>1)out.push(line);line=[];}
   }
   if(line.length>1)out.push(line);return out;
 }));
}
function markers(r,color,labels=false){
 const group=svg('g',{fill:'none',stroke:color,'stroke-width':1.8});
 r.markers.forEach(([x,y],i)=>{
   group.append(svg('circle',{cx:x,cy:y,r:7}));if(labels)group.append(svg('text',{x:x+8,y:y-3,fill:'white',stroke:'#163d48','stroke-width':2.2,'paint-order':'stroke','font-size':15},String(i+1)));
 });
 for(const [x,y] of r.nipple)group.append(svg('path',{d:'M'+(x-5)+' '+y+'h10 M'+x+' '+(y-5)+'v10'}));
 return group;
}
function inverse([c,s,x,y]){const n=c*c+s*s;return [c/n,-s/n,(-c*x-s*y)/n,(s*x-c*y)/n];}
function draw(){
 if(!data)return;
 const view=mode(),id=index[active][view],r=data.source.panels[id],bb=r.box;
 const layer=svg('g',{});layer.append(photo(id));
 const method=byId('registerMode').value;byId('register').hidden=view!=='photo';
 if(view==='photo'&&method!=='none'){
   const alt=active==='waist'?'c':'b',other=data.source.panels[alt],forward=data.source.registration[method].cToB;
   const [c,s,x,y]=active==='waist'?forward:inverse(forward),group=svg('g',{transform:'matrix('+[c,s,-s,c,x,y].join(' ')+')'});
   if(byId('ghost').checked){const im=photo(alt);im.setAttribute('opacity','.30');group.append(im);}
   if(byId('observed').checked)group.append(strokes(other.observed,'#ffce62',true));
   if(byId('markers').checked)group.append(markers(other,'#ffce62'));layer.append(group);
 }
 if(byId('observed').checked)layer.append(strokes(r.observed,'#38e6c6'));
 if(byId('model').checked)layer.append(strokes(comparableModel(r,byId('yaw').value),'#d66eba',true));
 if(byId('markers').checked)layer.append(markers(r,'#59d8ff',true));
 el.setAttribute('viewBox',[bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]].join(' '));el.style.aspectRatio=(bb[2]-bb[0])+'/'+(bb[3]-bb[1]);el.style.height='auto';el.style.maxHeight='460px';el.replaceChildren(layer);
 byId('caption').textContent='그림 5'+id+' · '+(view==='photo'?'사진':'표면지도')+' · 청록 실선은 판독 음영, 자주 파선은 같은 열의 모형 밑면'+(view==='photo'&&method!=='none'?', 노랑은 정합한 반대 자세':'');
 const kept=r.retention.map(v=>v.retained+'/'+v.total).join(' · ');
 const pairs=data.source.observedChange[view==='photo'?'bc':'ef'].map(v=>v.valid+'/23').join(' · ');
 let text='화면 왼쪽·오른쪽에서 판독한 열은 각각 '+kept+'개입니다. 두 자세 공통 중심 열은 '+pairs+'개입니다.';
 if(view==='photo'&&method!=='none'){
   const err=Math.max(...data.source.registration[method].heldMarkerPixelDistances);
   text+=' 다른 표식에서 남은 최대 차이는 허리 사진 좌표로 '+err.toFixed(1)+'px입니다.';
 }
 byId('readout').textContent=text;document.body.dataset.pose=active;document.body.dataset.panel=id;
}
function choose(pose,notify){
 if(!Object.hasOwn(index,pose))return;
 const changed=active!==pose;active=pose;
 document.querySelector('input[name=pose][value="'+pose+'"]').checked=true;
 draw();if(notify&&changed&&parent!==self)parent.postMessage({type:'bookfriend:study49-pose',pose},location.origin);
}
document.addEventListener('change',e=>{if(e.target.name==='pose')choose(e.target.value,true);else draw();});
addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='bookfriend:study49-pose')choose(e.data.pose,false);});
try{
 const res=await fetch('chest-eval49.json');if(!res.ok)throw Error(String(res.status));data=await res.json();
 if(new URL(location.href).searchParams.get('pose')==='behindHead'&&active==='waist')choose('behindHead',false);else draw();
 document.body.dataset.ready='true';
}catch(e){byId('readout').textContent='도판을 열 수 없습니다. '+e.message;}

