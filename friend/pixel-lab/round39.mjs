const $=id=>document.getElementById(id);
const node=(tag,text='')=>Object.assign(document.createElement(tag),{textContent:text});
const names={F02:'페른',M01:'힘멜',W:'가슴 기본형'};
const read=async path=>{const reply=await fetch(path);if(!reply.ok)throw Error(path+' 응답 '+reply.status);return reply.json();};
const pair=(a,b)=>a.toFixed(2)+' → '+b.toFixed(2);
async function metrics(){
 const [face,chest]=await Promise.all(['face-eval39.json','chest-eval39.json'].map(read));
 for(const id of ['F02','M01']){
   const item=face.cases[id],a=node('article');a.append(node('h3',names[id]));
   for(const [name,view] of [['측면',item.lighting['-90']],['뒤쪽 고각',item.holdouts['-105/18']]]){
      a.append(node('p',name+'의 밝은 띠 대비 '+pair(view.before.brightTop10,view.after.brightTop10)));
   }
   a.append(node('p',item.status+' · 윤곽 정점 이동 '+item.sceneDiff.positionsChanged+'개.'));$('metrics').append(a);
 }
 const a=node('article'),near=chest.paper.B3,side=chest.paper.S3;
 const floor=v=>Math.abs(v.model.bottom-v.source.bottom);
 a.append(node('h3',names.W),node('p','사선 가까운 밑바닥의 높이 차 '+pair(floor(near.before.floors[0]),floor(near.after.floors[0]))+'px'),node('p','측면 밑선 전체의 오차 '+pair(side.before.errorsPx[0],side.after.errorsPx[0])+'px'),node('p','측면 최저점의 높이 차 '+pair(floor(side.before.floors[0]),floor(side.after.floors[0]))+'px'),node('p','정면에서 밑선의 명암이 두 줄로 나타난 열 '+chest.front.before.doubleColumns+' → '+chest.front.after.doubleColumns+'개 / 같은 '+chest.front.before.columns+'개 열.'));$('metrics').append(a);
}
async function sheet(id){
 const image=new Image();image.src='samples39-'+id+'.png';await image.decode();
 const section=node('article');section.append(node('h3',names[id]));const grid=node('div');grid.className='crop-grid';
 const labels=id==='W'?['정면','사선 B3 방향','측면 S3 방향','반대 사선']:['측면 −90°','앞사선 −45°','뒤쪽 고각 −105° / +18°','반대쪽 저각 +60° / −16°'];
 labels.forEach((label,i)=>{
    const fig=node('figure'),c=node('canvas'),size=192;
    const face=id!=='W',tileW=face?122:192,tileH=face?112:192,ox=face?32:0,oy=face?80:0;
    c.width=tileW;c.height=2*tileH+2;const ctx=c.getContext('2d');
    for(let j=0;j<2;j++)ctx.drawImage(image,i*size+ox,j*size+oy,tileW,tileH,0,j*(tileH+2),tileW,tileH);
    c.setAttribute('aria-label',names[id]+' '+label+'의 38차와 39차 렌더');fig.append(node('figcaption',label),c);grid.append(fig);
 });section.append(grid);return section;
}
async function notes(){
 const records=(await Promise.all(['face-note39.json','chest-note39.json'].map(read))).flat();$('studies').replaceChildren();
 for(const record of records){
   const item=node('article');item.className='note';const fold=node('details');fold.append(node('summary','문단 요약과 상세 설명'),node('p',record.unit),node('p',record.detail));const link=node('a','원전 열기');link.href=record.url;fold.append(link);item.append(node('h3',record.title),node('p',record.line),fold);$('studies').append(item);
   const page=node('article'),credit=node('p','출처 · '+record.url);credit.className='credit';page.append(node('h1',record.title),node('p',record.line),node('h2','문단 요약'),node('p',record.unit),node('h2','상세 설명'),node('p',record.detail),credit);$('printDoc').append(page);
 }
 $('print').disabled=false;$('print').onclick=()=>window.print();
}
const tasks=[[metrics(),'metrics'],[Promise.all(Object.keys(names).map(sheet)).then(items=>$('sheets').append(...items)),'sheets'],[notes(),'studies']];
await Promise.all(tasks.map(([task,id])=>task.catch(err=>{$(id).append(node('p','읽기 실패 · '+err.message));})));
