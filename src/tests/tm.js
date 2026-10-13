const fs=require('fs');const s=fs.readFileSync('/home/claude/w/app.html','utf8');
const f=s.slice(s.indexOf('function mergeQnaSug(cid) {'),s.indexOf('function custMergeCard() {'));
const norm=(x)=>String(x||'').toLowerCase().replace(/\s+/g,'');const isCash=(o)=>o.platform==='cash';
const S={plist:new Map([['aladin_U1',{listingId:'333',aladinCode:'A1'}]]),qnaAll:[{customerId:'aladin_c9',itemId:'333',title:'[블루레이] 이터널 선샤인'},{customerId:'aladin_c8',title:'다른 책'}],
 orders:new Map([['cash_1',{customerId:'cash_01012345678',platform:'cash',items:[{listingKey:'aladin_U1',title:'이터널 선샤인 [블루레이]'}]}]]),customers:new Map([['aladin_c9',{customerId:'aladin_c9',displayName:'(이름 없음)'}]])};
eval(f+';console.log(JSON.stringify(mergeQnaSug("cash_01012345678")));console.log(JSON.stringify(mergeQnaSug("aladin_c9")));console.log(JSON.stringify(mergeQnaSug("aladin_c8")))');
