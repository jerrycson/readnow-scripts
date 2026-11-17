import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadRig} from '../rig32.mjs';
import {pair42, frame42} from '../face42-model.mjs';
import {evaluate42} from './chest42.mjs';
import './test-published-viewer.mjs';
import {latestPublished} from '../../research/hub/published-state.mjs';

const read = name => JSON.parse(readFileSync(new URL('../' + name, import.meta.url)));
const measured = read('face-eval42.json');
const atlas = read('atlas35.json');
const traces = read('traces36.json');
await loadRig();

for (const [id, record] of Object.entries(measured.cases)) {
  const pair = pair42(id, atlas, traces);
  assert.equal(record.native.length, 12);
  for (const sample of record.native) {
    const camera = {...sample, scope: 'face', zoom: 1};
    const before = frame42(pair, 'prior', camera).rendered.data;
    const after = frame42(pair, 'next', camera).rendered.data;
    let changed = 0, silhouette = 0;
    for (let offset = 0; offset < before.length; offset += 4) {
      let delta = 0;
      for (let channel = 0; channel < 4; channel++) {
        delta = Math.max(delta, Math.abs(before[offset + channel] - after[offset + channel]));
      }
      if (delta >= 8) changed++;
      if ((before[offset + 3] > 127) !== (after[offset + 3] > 127)) silhouette++;
    }
    const view = id + ' · ' + sample.size + 'px · ' + sample.yaw + '°';
    assert.equal(silhouette, sample.alpha, view + ' 외곽');
    assert.ok(Math.abs(changed - sample.changed) <= 1, view + ' 색상 차이');
  }
}
for (const field of ['face-note42', 'chest-note42']) {
  for (const note of read(field + '.json')) {
    assert.ok(note.line && note.unit && note.detail && note.url && note.local);
  }
}
const hub = new URL('../../research/hub/', import.meta.url);
const latest = latestPublished(JSON.parse(readFileSync(new URL('releases.json', hub))).releases);
const journal = readFileSync(new URL('../round' + latest.round + '.html', import.meta.url), 'utf8');
const cases = new Set();
for (const match of journal.matchAll(/href="(contour36\.html\?[^"]+)"/g)) {
  const target = new URL(match[1].replaceAll('&amp;', '&'), hub);
  if (target.searchParams.get('round') === String(latest.round)) cases.add(target.searchParams.get('case'));
}
for (const id of ['F02', 'M01', 'W']) assert.ok(cases.has(id), '최근 일지의 실제 관찰창 누락 ' + id);
const chest = await evaluate42();
console.log('42차 두 얼굴·여섯 시점·두 해상도와 실제 가슴 비교 재현', chest);
