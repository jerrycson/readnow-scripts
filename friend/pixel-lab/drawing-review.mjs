// 같은 형상의 편집 전후를 같은 카메라에서 그렸을 때만 호출한다.
export function compareDrawingPixels(before, after) {
  if (!before || !after || before.width !== after.width || before.height !== after.height ||
      !Number.isInteger(before.width) || !Number.isInteger(before.height) ||
      before.width < 1 || before.height < 1 || before.data?.length !== 4 * before.width * before.height ||
      after.data?.length !== before.data.length) throw new Error('그림의 크기와 RGBA 길이를 확인하세요.');
  let changed = 0;
  let silhouette = 0;
  for (let i = 0; i < before.data.length; i += 4) {
    if ((before.data[i + 3] >= 128) !== (after.data[i + 3] >= 128)) silhouette++;
    for (let k = 0; k < 4; k++) {
      if (Math.abs(before.data[i + k] - after.data[i + k]) >= 8) {
        changed++;
        break;
      }
    }
  }
  return {changed, silhouette};
}

// 오차의 단위는 각 원본의 표점·윤곽 정의에 속한다. 서로 다른 단위는 더하지 않는다.
// 이 결과는 다음 실험을 정하는 데 쓰며, 사람의 시각 승인이나 출판을 실행하지 않는다.
export function reviewDrawingCandidate({observations, meshFlips, unseen, comparisonViews}) {
  if (!Array.isArray(observations)) throw new TypeError('원본별 관찰 목록이 필요합니다.');
  const usable = observations.filter(row => row.visible !== false && row.view && row.units &&
    Number.isFinite(row.baseline) && Number.isFinite(row.candidate));
  const worse = [];
  const improved = [];
  for (const row of usable) {
    const tolerance = Number.isFinite(row.uncertainty) && row.uncertainty >= 0 ? row.uncertainty : 0;
    const difference = row.candidate - row.baseline;
    if (difference > tolerance) worse.push(row);
    if (difference < -tolerance) improved.push(row);
  }
  const missing = [];
  if (usable.length !== observations.length || !usable.length) missing.push('판독 가능한 원본과 측정값');
  if (meshFlips !== 0) missing.push(Number.isInteger(meshFlips) && meshFlips > 0 ? '뒤집힌 면 교정' : '면 뒤집힘 검사');
  if (new Set(usable.map(r => r.view)).size < 2) missing.push('서로 다른 방향의 원본');
  if (!Number.isInteger(comparisonViews) || comparisonViews < 2) missing.push('같은 형상의 다중 시점 렌더');
  if (!unseen) missing.push('조정에 쓰지 않은 독립 원본');
  if (!improved.length) missing.push('원본에 가까워진 부위');
  const status = worse.length ? '관측 악화 · 후보 보존' : missing.length ? '검증 근거 보완' : '전방위 그림 검토';
  return {status, measured:usable.length, worse, improved, missing};
}
