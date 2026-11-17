import {candidateFace47} from './face47.mjs';
import {makeChest47} from './chest47.mjs';
import {correctFernChin} from './chin37.mjs';
import {bindSurface} from './surface35.mjs';

// 37차는 비교에만 쓰고, 47차 후보도 오른쪽 편집면에서만 교정한다.
export function addRound47(model, assets) {
  if (model.id === 'W') {
    model.history37 = model.neutral;
    model.round47 = makeChest47(model.prior, assets.traces);
    model.bindings.history37 = bindSurface(model.history37, model.settings);
    model.bindings.round47 = bindSurface(model.round47, model.settings);
  } else {
    const fern = model.id === 'F02';
    model.history37 = fern ? correctFernChin(model.reg.after, model.id, model.reg, assets.traces.faces[model.id], .75) : model.reg.after;
    model.round47 = candidateFace47(fern ? model.next : model.prior, model.id);
  }
  return model;
}
export function displayedBase(model, choice) {
  if (choice === 'candidate') return model.next;
  if (choice === 'prior') return model.prior;
  if (choice === 'history37' || choice === 'round47' || choice === 'round48' || choice === 'round49') return model[choice];
  throw new Error('출발 모델을 확인해 주세요.');
}
