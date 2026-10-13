const fs=require('fs');const {JSDOM}=require('jsdom');const XLSX=require('xlsx');const SH=require('/home/claude/w/readnow-shipping-core.js');
const U='/root/.claude/uploads/2514b938-5524-5e43-ad0a-05319ceb1a3b/';const f=(p)=>U+fs.readdirSync(U).find(x=>x.startsWith(p));
const d=new JSDOM(fs.readFileSync(f('74d2a58b'),'utf8')).window.document;const ex=SH.parseAladinOrderExcel(d);console.log('excel',ex.header.length,ex.rows.length);
const aoa=SH.alpsUploadAoa(ex);console.log(JSON.stringify(aoa[1]));
const ok=XLSX.utils.sheet_to_json(XLSX.readFile(f('15c20bc4')).Sheets.Sheet1,{header:1});console.log('sample',JSON.stringify(ok[1]));
console.log('same head', JSON.stringify(ok[0])===JSON.stringify(aoa[0]));
const w=XLSX.utils.sheet_to_json(XLSX.readFile(f('e80c9bc0')).Sheets.Sheet0,{header:1,raw:false});const W=SH.parseAlpsWaybills(w);console.log('waybills',W.length,JSON.stringify(W[0]));
// fake orders from waybills grouped by name
const g={};W.forEach(x=>{(g[x.name]=g[x.name]||[]).push(x)});const orders=Object.entries(g).map(([n,xs],i)=>({orderNo:'O'+i,recipient:{name:n},items:xs.map(x=>({title:x.title.replace('[중고]','[중고-상]'),sku:x.sku}))}));
orders.push({orderNo:'X',recipient:{name:'없는사람'},items:[{title:'[중고-상] 없음',sku:'A'}]});
const m=SH.matchInvoices(orders,W);console.log(m.byOrder.map(o=>o.orderNo+':'+o.status+':'+o.invoice).join(' '),'extra',m.extra.length);
