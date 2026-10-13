const fs=require('fs'); const s=fs.readFileSync('/home/claude/w/readnow-collector.user.js','utf8');
const i=s.indexOf('const match = () => {'); const j=s.indexOf('return best; };',i)+'return best; };'.length; const src=s.slice(i,j);
const mk=(A,seen)=>new Function('A','seen',src+'; return match();')(A,seen);
const ROWS=48; const shop=(n)=>Array.from({length:n},(_,k)=>'id'+(100000-k)); // newest first
const pages=(L)=>{const m=new Map(); for(let p=1;p*ROWS-ROWS<L.length;p++) m.set(p,L.slice((p-1)*ROWS,p*ROWS)); return m;};
const T=(name,L,A,base,want)=>{ const P=pages(L); const seen=new Map(); let hit=null; for(const pg of [0,1,-1,2,-2,3,-3].map(d=>base+d).filter(p=>P.has(p))){ seen.set(pg,P.get(pg)); hit=mk(A,seen); if(hit) break;} console.log(name, JSON.stringify(hit), hit&&hit.page===want?'OK':(want===null&&!hit?'OK':'FAIL')); };
let L=shop(1000); const A=L.slice(10*48-10,10*48); // read through page 10
T('no change',L,A,10,10);
let L2=[...Array.from({length:60},(_,k)=>'new'+k),...L]; T('60 new → pushes back',L2,A,10,12);
let L3=L.filter((x,k)=>!(k<480&&k%5===0)); T('sold 96 before → shift up',L3,A,10,8);
let L4=L.filter(x=>!['id'+(100000-475),'id'+(100000-476),'id'+(100000-478)].includes(x)); T('3 of anchor sold',L4,A,10,10);
let L5=[...Array.from({length:200},(_,k)=>'new'+k),...L]; T('200 new (>3 pages)',L5,A,10,null);
