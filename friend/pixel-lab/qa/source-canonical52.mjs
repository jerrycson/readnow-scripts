import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const lab=new URL('../',import.meta.url),mapping=JSON.parse(fs.readFileSync(new URL('source-canonical52.json',import.meta.url),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function assertRecordedFile52(file,recorded){
 const bytes=fs.readFileSync(new URL(file,lab));
 if(/\.(?:mjs|js|json|html|css|md)$/.test(file)){
  const entry=mapping.files[file];assert.equal(entry?.recorded,recorded,file+' 측정 당시 원본 지문');
  const canonical=sha(bytes.toString('utf8').replaceAll('\r\n','\n'));assert.equal(canonical,entry?.lf,file+' LF 배포 지문');return canonical;
 }
 const actual=sha(bytes);assert.equal(actual,recorded,file+' 원래 바이너리 지문');return actual;
}
