const names = {F02:'페른 얼굴', M01:'힘멜 얼굴', W:'가슴 기본형'};
const hub = new URL('./', import.meta.url);
let edition, targets, inFlight, readError = false, ticket = 0;

export function caseName(id) { return names[id] || names.F02; }
export function latestCaseLink(id) {
  const url = new URL(hub);
  url.searchParams.set('lab', 'viewer');
  url.searchParams.set('case', Object.hasOwn(names,id) ? id : 'F02');
  return url;
}

export function viewerFor(id) {
  if (!edition) return {label:'공개 회차 확인 중'};
  const name = caseName(id), prefix = edition.round+'차 · ';
  if (readError) return {label:prefix+'공개 일지를 다시 확인 중입니다.'};
  if (!targets) return {label:prefix+name+' 관찰창 확인 중'};
  const entry = targets.get(id);
  if (entry) return {url:entry.href, label:prefix+name+' 관찰창'};
  return {url:journal(edition).href, label:prefix+name+' · 회차 일지에서 확인'};
}
function journal(row) { return new URL('../../pixel-lab/round'+row.round+'.html',hub); }
function collect(html, row) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const found = new Map();
  for (const a of template.content.querySelectorAll('a[href]')) {
    let url;
    try { url = new URL(a.getAttribute('href'),journal(row)); } catch { continue; }
    const id = url.searchParams.get('case');
    if (url.origin === hub.origin && url.pathname === '/friend/pixel-lab/contour36.html'
        && url.searchParams.get('round') === String(row.round) && Object.hasOwn(names,id) && !found.has(id)) found.set(id,url);
  }
  return found;
}
export function followPublished(onChange) {
  const paint = () => {
    for (const link of document.querySelectorAll('[data-latest-case]')) {
      const id = link.dataset.latestCase;
      link.href = latestCaseLink(id);
      link.querySelector('span').textContent = viewerFor(id).label;
    }
    onChange();
  };
  async function update(row) {
    if (!Number.isSafeInteger(row?.round) || row.round < 38 || row.project !== 'bookfriend') return;
    if (row.id === edition?.id && (targets || inFlight)) return;
    const seq = ++ticket;
    edition = row; targets = undefined; inFlight = true; readError = false;
    paint();
    try {
      const response = await fetch(journal(row),{cache:'no-store'});
      if (!response.ok) throw Error(String(response.status));
      const next = collect(await response.text(),row);
      if (seq === ticket) targets = next;
    } catch {
      if (seq === ticket) {
        readError = true;
        const retry = () => { if (seq === ticket) update(row); };
        setTimeout(retry,15000);
      }
    } finally {
      if (seq === ticket) { inFlight = false; paint(); }
    }
  }
  document.addEventListener('bookfriend:published',e=>update(e.detail));
  const first = document.documentElement.dataset.publishedBookfriend;
  if (first) update(JSON.parse(first));
  else paint();
}
