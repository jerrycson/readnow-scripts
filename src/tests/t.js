const fs=require('fs');const src=fs.readFileSync(process.argv[2],'utf8');const AS=new Function(src+'; return AS;')();
const at=(d,hm)=>Date.parse(`${d}T${hm}:00+09:00`);
// every wrap 22:00-02:00, 90 min
let doc={on:true,slots:[{id:'e',job:'prd:market',trig:{t:'every',min:90},win:{from:'22:00',to:'02:00'}}]};
let runs={};
for (const [d,h] of [['2026-10-12','22:05'],['2026-10-12','23:35'],['2026-10-13','00:30'],['2026-10-13','01:05'],['2026-10-13','22:10'],['2026-10-13','23:31']]) {
 const r=AS.due(doc,runs,{now:at(d,h),pc:'A',crmOk:true,idleMs:0,bootAt:0,stats:{}}); console.log(d,h,r.map(x=>x.key+' '+x.mark));
 r.forEach(x=>runs[x.key]={state:'done',at:new Date(at(d,h)).toISOString()});
}
// win 23:00-01:00 every 120
doc={on:true,slots:[{id:'f',job:'prd:market',trig:{t:'every',min:120},win:{from:'23:00',to:'01:00'}}]};runs={};
for (const [d,h] of [['2026-10-12','23:05'],['2026-10-13','00:30'],['2026-10-13','23:05']]) {const r=AS.due(doc,runs,{now:at(d,h),pc:'A',crmOk:true,idleMs:0,bootAt:0,stats:{}});console.log('f',d,h,r.map(x=>x.key+' '+x.mark));r.forEach(x=>runs[x.key]={state:'done',at:new Date(at(d,h)).toISOString()});}
// after + retry collision
doc={on:true,slots:[{id:'P',job:'prd:scanDaily',trig:{t:'time',times:['09:00']},retry:{n:1,gap:5}},{id:'C',job:'prd:market',trig:{t:'after',of:'P',need:'any',delay:0},retry:{n:1,gap:5}}]};
runs={'P@2026-10-12@09:00':{state:'error',at:new Date(at('2026-10-12','09:10')).toISOString()}};
const step=(h)=>{const r=AS.due(doc,runs,{now:at('2026-10-12',h),pc:'A',crmOk:true,idleMs:0,bootAt:0,stats:{}});console.log('ac',h,r.map(x=>x.key+' '+x.mark+' '+x.why));return r;};
let r=step('09:11'); // expect P retry + C after
runs['P@2026-10-12@09:00~r1']={state:'done',at:new Date(at('2026-10-12','09:30')).toISOString()};
runs['C@2026-10-12@a.P.09:00']={state:'error',at:new Date(at('2026-10-12','09:20')).toISOString()};
r=step('09:31');
