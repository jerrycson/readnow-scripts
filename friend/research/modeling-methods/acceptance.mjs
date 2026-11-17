import {reviewDrawingCandidate} from '../../pixel-lab/drawing-review.mjs';

const choices = document.getElementById('trialChoices');
const output = document.getElementById('trialOutput');
const names = {F02:'페른', M01:'힘멜', W:'성인 몸통'};
const metrics = {lid:'눈꺼풀 세 점 거리', width:'눈꺼풀 폭', rowEnds:'지정 높이의 좌우 피부 끝', jaw:'턱 피부 가시선'};
const variants = {regional:'밑면 국소 복원', restore40:'40차 하부 복원'};
function element(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}
function show(id, trial) {
  for (const button of choices.children) button.setAttribute('aria-pressed', String(button.dataset.subject === id && button.dataset.trial === trial.name));
  const review = reviewDrawingCandidate(trial.reviewInput);
  const title = element('h4', names[id]+' · '+(variants[trial.name] || trial.name)+' · '+review.status);
  const count = element('p', '관측 '+review.measured+'건 중 오차 감소 '+review.improved.length+'건, 증가 '+review.worse.length+'건. 수치는 판독 오차를 따로 추정하기 전의 차이입니다.');
  const unresolved = element('p','아직 확인할 조건 · '+[trial.unmeasured, ...review.missing].join(' / '));
  const list = document.createElement('ul');
  for (const row of trial.reviewInput.observations) {
    const delta = row.candidate - row.baseline;
    const direction = Math.abs(delta)<0.00005 ? '동일' : delta>0 ? '증가' : '감소';
    list.append(element('li', row.view+' · '+(metrics[row.metric]||row.metric)+' · '+row.baseline.toFixed(3)+' → '+row.candidate.toFixed(3)+' '+row.units+' ('+direction+')'));
  }
  output.replaceChildren(title,count,unresolved,list);
  output.dataset.subject=id;
}
try {
  const response = await fetch('trials.json');
  if (!response.ok) throw new Error(String(response.status));
  const trials = (await response.json()).analysis;
  for (const [id, records] of Object.entries(trials)) {
    for (const trial of records) {
      const button = element('button', names[id]+' '+(variants[trial.name] || trial.name));
      button.type='button';button.dataset.subject=id;button.dataset.trial=trial.name;
      button.onclick=()=>show(id,trial);choices.append(button);
    }
  }
  show('M01',trials.M01.find(t=>t.name==='전강도'));
} catch (error) {
  output.textContent='실측 표를 불러올 수 없습니다. '+error.message;
}
