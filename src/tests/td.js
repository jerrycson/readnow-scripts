const fs=require('fs');const s=fs.readFileSync('/home/claude/w/app.html','utf8');
const cut=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const code=cut('const cashItemKey','function cashRow(o)')+cut('function cashOrders()','function cashStop(');
const norm=(x)=>String(x||'').toLowerCase().replace(/\s+/g,'');const isCash=(o)=>o.platform==='cash';const won=(n)=>n+'원';const esc=(x)=>String(x);
global.confirm=()=>true;
const S={user:{email:'t'},customers:new Map(),orders:new Map([
 ['cash_a',{id:'cash_a',platform:'cash',orderedAt:'2026-10-06 11:55',shippedAt:'2026-10-06',totalAmount:89000,items:[{lineNo:1,listingKey:'aladin_U9',title:'[블루레이] 이터널 선샤인',price:89000,listPrice:89000,qty:1,lineStatus:'normal',aladinStop:{status:'done'}}]}],
 ['cash_b',{id:'cash_b',platform:'cash',orderedAt:'2026-10-06 11:55',shippedAt:null,totalAmount:82000,items:[{lineNo:1,listingKey:'aladin_U9',title:'[블루레이] 이터널 선샤인',price:82000,listPrice:89000,qty:1,lineStatus:'normal'}]}]])};
async function cashUpdate(id,fn){const o=JSON.parse(JSON.stringify(S.orders.get(id)));const w=fn(o);S.orders.set(id,o);console.log('UPD',id,w,o.kind||'',o.totalAmount,o.shippedAt,JSON.stringify(o.items[0].aladinStop||null),o.items[0].lineStatus);}
eval(code+`;console.log('dupes',cashDupes().length);console.log(cashDupHtml().length>0);(async()=>{await cashKeep('cash_b','aladin_U9');console.log('dupes after',cashDupes().length);})();`);
