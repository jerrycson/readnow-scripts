import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {studioTools} from '../studio-catalog.mjs';
import {studioHistory,withHostedReleases} from '../studio-history.mjs';
import './test-published-viewer.mjs';
const lab=new URL('../',import.meta.url), read=path=>readFile(new URL(path,lab),'utf8'), json=async path=>JSON.parse(await read(path));
const fsManifest=await json('studio-frozen/manifest.json');assert.equal(fsManifest.rounds.length,33);
for (const r of fsManifest.rounds){const [engine,model]=await Promise.all([import(new URL('studio-frozen/'+r.renderer,lab)),import(new URL('studio-frozen/'+r.defaults,lab))]);const px=engine.renderPixels({...model.DEFAULTS,resolution:48},{yaw:45,pitch:0});assert.ok(px.data.some((x,i)=>i%4===3&&x>0),'당시 모델 렌더 '+r.round);}
const cards=await json('studio-notes43.json');assert.ok(cards.length>=4);for(const r of cards)assert.ok(r.unit.length>110&&r.detail.length>750&&r.url&&r.local,r.id);
assert.ok((await read('../research/hub/index.html')).includes('?lab=studio'));assert.ok((await read('../research/hub/latest.html')).includes('?lab=studio'));
assert.equal(new Set(studioTools.map(t=>t.id)).size,studioTools.length);for(const tool of studioTools)await read(tool.path.split(/[?#]/)[0]);
const rows=withHostedReleases((await json('../research/hub/releases.json')).releases);
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);assert.ok(studioHistory.length>=42);
console.log('33개 보존 엔진 실렌더, 실제 도구 '+studioTools.length+'개, 원고·판본·입구 검사 통과');