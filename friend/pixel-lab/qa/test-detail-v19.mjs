import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {selectAnatomyDetail} from '../detail-selection.mjs';
import {renderPixels, bodyParts} from '../renderer.mjs';
import {continuousStudy} from '../continuous/body.mjs';
import {chibiStudy} from '../chibi/body.mjs';
import {DEFAULTS, rotationStates} from '../model.mjs';
const report = {version:19, checkedAt:new Date().toISOString(), visualApproval:false, results:[]};
const assert = (ok, message) => {if (!ok) throw new Error(message);};
const hash = value => createHash('sha256').update(value).digest('hex');
const settings = (sex, heads) => ({...DEFAULTS, sex, heads, candidate:'B', designStyle:'manga', resolution:128});
const scene = s => s.heads < 5 ? chibiStudy(s) : continuousStudy(s);
async function test(name, fn) {
  try {report.results.push({name, ok:true, detail:await fn()});}
  catch (error) {report.results.push({name, ok:false, error:error.message});}
  console.log(name + ': ' + report.results.at(-1).ok);
}
await test('분리 보기를 끄면 18차 전신·손·발 그림이 그대로 유지됨', async () => {
  const baseline = JSON.parse(await readFile(new URL('./detail-v19-baseline.json', import.meta.url), 'utf8'));
  for (const c of baseline.cases) {
    const s = settings(c.sex, c.heads), sc = scene(s);
    assert(hash(renderPixels(s, {sceneOverride:sc, portrait:c.focus, yaw:45}).data) === c.sha256, '기존 표시 변경');
  }
  return {cases:baseline.cases.length};
});
await test('분리 보기는 원래 좌표·면의 일부만 선택하고 몸을 변경하지 않음', () => {
  let cases = 0;
  for (const sex of ['male','female']) for (const heads of [2,3,4,5,6,7,8]) {
    const sc = scene(settings(sex, heads)), before = hash(JSON.stringify(sc));
    for (const focus of ['hand','foot']) {
      const selected = selectAnatomyDetail(sc, focus);
      assert(selected.parts.length > 0 && selected.detailSelection.cutaway, '선택 부위 누락');
      for (const part of selected.parts) {
        const original = sc.parts.find(p => p.vertices === part.vertices);
        assert(original && part.faces.every(f => original.faces.includes(f)), '새 형상으로 교체됨');
        assert(part.faces.flat().every(i => part.vertices[i].p[0] > 0), '반대쪽 부위 포함');
      }
      assert(hash(JSON.stringify(sc)) === before, '원본 몸 변경');
      cases++;
    }
  }
  return {cases};
});
await test('남녀 2~8등신의 한쪽 손·발이 64방향에서 비거나 잘리지 않음', () => {
  let views = 0;
  for (const sex of ['male','female']) for (const heads of [2,3,4,5,6,7,8]) {
    const s = settings(sex, heads), sc = scene(s);
    for (const focus of ['hand','foot']) for (const angle of rotationStates()) {
      const r = renderPixels(s, {sceneOverride:sc, portrait:focus, isolateDetail:true, ...angle});
      assert(r.metrics.opaque > 20 && !r.metrics.clipped, JSON.stringify({sex, heads, focus, angle, metrics:r.metrics}));
      views++;
    }
    console.log(sex + ' ' + heads + ' / hand and foot 128 views');
  }
  return {views, note:'관찰용 구도 검사이며 손·발의 미적 완성도를 뜻하지 않음'};
});
await test('8차 비교 기본형과 사용하지 않는 부위의 선택도 유지됨', () => {
  let views = 0;
  for (const sex of ['male','female']) for (const heads of [2,8]) {
    const s = settings(sex, heads), sc = bodyParts(s);
    assert(selectAnatomyDetail(sc, 'face') === sc, '얼굴에 분리 옵션 적용');
    for (const portrait of ['hand','foot']) for (const angle of rotationStates()) {
      const r = renderPixels(s, {sceneOverride:sc, portrait, isolateDetail:true, ...angle});
      assert(r.metrics.opaque > 20 && !r.metrics.clipped, '8차 비교 부위 누락·잘림');
      views++;
    }
  }
  return {views};
});
report.passed = report.results.filter(x => x.ok).length;
report.total = report.results.length;
await writeFile(new URL('./detail-v19-tests.json', import.meta.url), JSON.stringify(report,null,2));
if (report.passed !== report.total) process.exitCode = 1;
