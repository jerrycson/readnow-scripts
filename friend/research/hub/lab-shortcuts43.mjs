const summary = document.getElementById('publishedSummary');
const shortcuts = document.createElement('nav');
shortcuts.className = 'studio-shortcuts';
shortcuts.setAttribute('aria-label', '실험실 바로가기');
const sheet = document.createElement('link');
sheet.rel = 'stylesheet';
sheet.href = new URL('lab-shortcuts43.css', import.meta.url);
document.head.append(sheet);

function link(label, href) {
  const a = document.createElement('a');
  a.textContent = label;
  a.href = href;
  shortcuts.append(a);
  return a;
}

const studio = link('내 실험실 (통합)', '?lab=studio');
const sculpt = link('정밀 조형', '?lab=studio&tool=sculpt');
link('내 참고그림', '?lab=studio&tool=photo-engine36');
const study = link('통합 작업 점검', '../../pixel-lab/round43.html#audit');
const methods = link('모델링 기법과 검증', '../modeling-methods/');
const multi = link('전방위 동시 교정 · 부위별 조작기', '../modeling-methods/compare.html');
summary.before(shortcuts);
// 연구실의 기존 문서 전체 클릭 처리기는 통합 실험실을 열 때 tool을 지운다.
// 도구를 지정한 링크는 브라우저가 원래 href 그대로 따라가게 한다.
shortcuts.addEventListener('click', event => {
  const a = event.target.closest('a');
  if (a && new URL(a.href).searchParams.has('tool')) event.stopPropagation();
});

function published(row) {
  if (row?.project !== 'bookfriend' || !Number.isSafeInteger(row.round)) return;
  if (row.round >= 44) {
    study.href = '../studio-engine/';
    study.textContent = '실험실 학습과 검증';
    if (!shortcuts.querySelector('[data-photo-study]')) {
      const photo = link('내 참고그림 연구와 검증', '../photo-model/');
      photo.dataset.photoStudy = 'true';
    }
  }
  if (row.round >= 46) sculpt.textContent = '통합 조형 · 부위별 조작기';
  if (row.round >= 49) {
    const photoInput=shortcuts.querySelector('a[href*="tool=photo-engine36"]');
    if(photoInput)photoInput.href='?lab=studio&tool=photo-engine50';
    studio.textContent = '내 실험실 (통합) · '+row.round+'차 결과 검토';
    multi.href = '?lab=studio&tool='+(row.round>=50?'workbench':'all-around')+'&round='+row.round;
    studio.after(multi);
    study.href = '?lab=studio&tool=learning';
    methods.href = '?lab=studio&tool=methods';
    shortcuts.querySelector('[data-photo-study]').href = '?lab=studio&tool=photo-research';
    if (!shortcuts.querySelector('[data-study-journal]')) {
      const journal = link('최신 결과 일지', '?lab=studio&tool=journal');
      journal.dataset.studyJournal = 'true';
    }
  }
}
document.addEventListener('bookfriend:published', event => published(event.detail));
try { published(JSON.parse(document.documentElement.dataset.publishedBookfriend || 'null')); }
catch { /* 회차 확인 전에는 43차 도구를 표시한다. */ }

