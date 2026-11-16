// Firestore writes the release document after every referenced block is durable.
const decoder=new TextDecoder();
export async function readBlocks(refs,getBlock,checksum,expected) {
  if(!Array.isArray(refs)||refs.length===0)throw Error('회차에 원문 조각이 없습니다.');
  const slices=[];
  for(const id of refs){
    if(!/^[a-f0-9]{64}$/.test(id))throw Error('잘못된 원문 조각 ID');
    const bytes=await getBlock(id);
    if(await checksum(bytes)!==id)throw Error('원문 조각 지문이 다릅니다.');
    slices.push(bytes);
  }
  const all=new Uint8Array(slices.reduce((n,s)=>n+s.length,0));
  let offset=0;for(const slice of slices){all.set(slice,offset);offset+=slice.length;}
  if(await checksum(all)!==expected)throw Error('회차 원문 지문이 다릅니다.');
  return JSON.parse(decoder.decode(all));
}
export function mergeHistory(hosted,cloud){
  const map=new Map(hosted.map(r=>[r.id,r]));
  for(const [id,row] of cloud){
    if(!/^[a-f0-9]{24}$/.test(id))continue;
    const old=map.get(id);
    if(old&&(old.cardsSha!==row.cardsSha||old.adminSha!==row.adminSha))throw Error('같은 회차의 원문 지문이 다릅니다.');
    map.set(id,{...row,...old,id,label:old?.label||row.label||'Firestore 연구 회차'});
  }
  return [...map.values()].sort((a,b)=>String(a.at).localeCompare(String(b.at))||a.id.localeCompare(b.id));
}
