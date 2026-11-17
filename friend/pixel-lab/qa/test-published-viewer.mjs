import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const hub = new URL('../../research/hub/',import.meta.url);
const lab = new URL('../',import.meta.url);
const read = (base,file) => readFile(new URL(file,base),'utf8');
const index = await read(hub,'index.html');
const primary = index.match(/<nav[^>]+aria-label="최신 공개 관찰창">([\s\S]*?)<\/nav>/)?.[1];
assert.ok(primary,'첫 화면의 최신 관찰창 진입');
for (const id of ['F02','M01','W']) {
  assert.ok(primary.includes('href="?lab=viewer&amp;case='+id+'"'),'회차와 독립된 부위 주소 '+id);
}
assert.doesNotMatch(primary,/study34\.html|round=\d+/);
assert.match(index,/study34\.html\?mode=face/,'이전 관찰창은 보존한다');
const {releases} = JSON.parse(await read(hub,'releases.json'));
const live = releases.filter(r=>r.project==='bookfriend').sort((a,b)=>b.round-a.round)[0];
const journal = await read(lab,'round'+live.round+'.html');
const links = [...journal.matchAll(/href="(contour36\.html\?[^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),lab));
assert.ok(links.some(u=>u.searchParams.get('round')===String(live.round) && ['F02','M01','W'].includes(u.searchParams.get('case'))),'최근 일지가 적어도 하나의 해당 회차 모델로 연결되어야 한다');
console.log(live.round+'차 관찰창, 자료 '+live.cards+'개 · 첫 화면 진입과 보존 링크 확인');
