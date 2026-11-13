/* ☁ Cloud Build 결과 받기 (cbuild 11/13 · 정범님 11/13 14:57 「빌드 끝에 결과를 남기는 단계 — 무조건 마무리」)
 *  까닭: Cloud Build 로그는 구글 안(Cloud Logging)에만 남아 Claude 작업 환경(구글 계정 없음)이 실패 까닭을 못 읽음
 *   → 빌드가 시작할 때·끝날 때 이 클라우드 /cb-in에 결과를 보냄 → Firestore에 남김 → 진단 cbuild=1로 읽음
 *  받는 것(한 빌드 = cloudbuild_runs/{빌드 번호} 한 문서 · 지우지 않음):
 *    { id, ev:'start'|'end', sha, ver(cloud/index.js VER), via('trigger'|'submit'|…), st('WORKING'|'SUCCESS'|'FAILURE'|'SKIPPED'),
 *      fail(처음 실패한 단계 이름), warn[](실패해도 되는 단계 — 🛍 우리숍), steps{단계: {rc, sec, skip}}, tail[](실패 단계 로그 마지막 줄들 · 비밀값 가림),
 *      test('fail'|'broken'|'' — 일부러 만든 시험 실패), dry(올리지 않는 시험), url(구글 콘솔 빌드 주소) }
 *  + app_settings/cloudbuild_last { last(마지막 빌드 요약), list[최근 30 요약], at }
 *  가림: 로그 줄에서 토큰·열쇠 꼴(ya29.… · eyJ….….… · gh?_… · AIza… · 56자 넘는 16진 · key=/token=/password= 뒤 값)을 「‹가림›」으로 — 빌드 쪽(cloud/cb-lib.sh)에서도 한 번 가림
 *  끝 보고가 없는 빌드(시작만 있고 40분 지남 — 빌드 시간 넘김·기계 죽음)는 진단에서 noEnd로 보임 */
'use strict';
const COL = 'cloudbuild_runs';
const s = (x, n) => (x == null ? '' : String(x).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, n));
function mask(t) {
  return s(t, 400)
    .replace(/ya29\.[\w.-]+/g, '‹가림›')
    .replace(/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]*/g, '‹가림›')
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}/g, '‹가림›')
    .replace(/AIza[0-9A-Za-z_-]{30,}/g, '‹가림›')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*/g, '‹가림›')
    .replace(/\b[0-9a-fA-F]{56,}\b/g, '‹가림›')
    .replace(/((?:pass(?:word)?|passwd|secret|token|api[_-]?key|x-rn-diag-key|authorization)["']?\s*[:=]\s*["']?)(?:bearer\s+)?[^\s"',;]{6,}/gi, '$1‹가림›');
}
const ST = ['WORKING', 'SUCCESS', 'FAILURE', 'SKIPPED'];
function norm(b) {
  if (!b || typeof b !== 'object') return { bad: '모양' };
  const id = String(b.id || ''); if (!/^[0-9a-f-]{20,64}$/.test(id)) return { bad: '빌드 번호 모양' };
  const ev = b.ev === 'end' ? 'end' : 'start';
  const r = { id, ev, sha: s(b.sha, 40).replace(/[^0-9a-f]/g, ''), ver: s(b.ver, 20).replace(/[^0-9.]/g, ''), via: s(b.via, 20).replace(/[^a-z0-9_-]/gi, ''),
    st: ST.includes(b.st) ? b.st : (ev === 'start' ? 'WORKING' : 'FAILURE'), fail: s(b.fail, 30).replace(/[^a-z0-9_-]/gi, ''),
    warn: (Array.isArray(b.warn) ? b.warn : []).map((x) => s(x, 30).replace(/[^a-z0-9_-]/gi, '')).filter(Boolean).slice(0, 8),
    test: s(b.test, 20).replace(/[^a-z0-9_-]/gi, ''), dry: !!b.dry, url: /^https:\/\/console\.cloud\.google\.com\//.test(String(b.url || '')) ? s(b.url, 300) : '',
    note: mask(b.note || '').slice(0, 300) };
  const steps = {}; if (b.steps && typeof b.steps === 'object') for (const [k, v] of Object.entries(b.steps).slice(0, 12)) { const kk = s(k, 30).replace(/[^a-z0-9_-]/gi, ''); if (!kk || !v || typeof v !== 'object') continue; steps[kk] = { rc: Number.isFinite(+v.rc) ? +v.rc : null, sec: Number.isFinite(+v.sec) ? Math.round(+v.sec) : null, skip: !!v.skip }; }
  r.steps = steps;
  r.tail = (Array.isArray(b.tail) ? b.tail : []).slice(-60).map(mask);
  return { r };
}
function makeCbuild({ C, log, gToken }) {
  /* (cbuild 둘째) 구글에서 바로 읽기 — 빌드 끝 보고가 못 온 때(시작도 못 함·시간 넘김·보고 단계 실패)를 위해, 이 클라우드의 실행 계정으로
   *  Cloud Build 목록(서울)과 그 빌드의 Cloud Logging 줄을 직접 읽음(읽기만) · cbuild=api(최근 8개) · cbuild=log&id=<빌드 번호>(로그 마지막 줄) */
  const PJ = 'readnow-3a385', RG = 'asia-northeast3';
  async function gj(url, opt) { const r = await fetch(url, { ...(opt || {}), headers: { Authorization: 'Bearer ' + (await gToken()), 'Content-Type': 'application/json' } }); const t = await r.text(); if (!r.ok) return { err: 'HTTP ' + r.status + ' ' + mask(t).slice(0, 300) }; try { return JSON.parse(t); } catch (e) { return { err: 'JSON 아님' }; } }
  async function apiList(n) {
    const j = await gj(`https://cloudbuild.googleapis.com/v1/projects/${PJ}/locations/${RG}/builds?pageSize=${Math.max(1, Math.min(20, +n || 8))}`); if (j.err) return j;
    return (j.builds || []).map((b) => ({ id: b.id, st: b.status, create: b.createTime, start: b.startTime || null, finish: b.finishTime || null, tags: b.tags || [], sa: String(b.serviceAccount || '').split('/').pop(), trig: b.buildTriggerId || null,
      sub: Object.fromEntries(Object.entries(b.substitutions || {}).filter(([k]) => /^(_VIA|_RN_TEST|_RN_DRY|_RN_FAIL_AT|COMMIT_SHA|_SHA)$/.test(k)).map(([k, v]) => [k, String(v).slice(0, 12)])),
      fail: b.failureInfo ? mask(b.failureInfo.type + ' ' + (b.failureInfo.detail || '')).slice(0, 300) : null, msg: b.statusDetail ? mask(b.statusDetail).slice(0, 300) : null,
      steps: (b.steps || []).map((x) => ({ id: x.id, st: x.status, sec: x.timing && x.timing.startTime && x.timing.endTime ? Math.round((Date.parse(x.timing.endTime) - Date.parse(x.timing.startTime)) / 1000) : null })) }));
  }
  async function apiLog(id, n) {
    if (!/^[0-9a-f-]{20,64}$/.test(String(id || ''))) return { err: '빌드 번호(id) 모양' };
    const j = await gj('https://logging.googleapis.com/v2/entries:list', { method: 'POST', body: JSON.stringify({ resourceNames: ['projects/' + PJ], filter: `resource.type="build" AND resource.labels.build_id="${id}"`, orderBy: 'timestamp desc', pageSize: Math.max(10, Math.min(300, +n || 120)) }) });
    if (j.err) return j;
    const L = (j.entries || []).map((e) => { const t = e.textPayload || (e.jsonPayload && (e.jsonPayload.message || JSON.stringify(e.jsonPayload))) || ''; return mask((e.labels && e.labels.build_step ? '[' + e.labels.build_step + '] ' : '') + t); }).reverse();
    return { id, n: L.length, more: !!j.nextPageToken, rows: L };
  }
  async function put(b, who) {
    const x = norm(b); if (x.bad) return { ok: false, err: x.bad };
    const r = x.r; const now = new Date().toISOString();
    const ref = C(COL).doc(r.id);
    const doc = r.ev === 'start' ? { id: r.id, sha: r.sha, ver: r.ver, via: r.via, st: 'WORKING', test: r.test, dry: r.dry, url: r.url, startAt: now, who: s(who, 80) }
      : { id: r.id, sha: r.sha, ver: r.ver, via: r.via, st: r.st, fail: r.fail, warn: r.warn, steps: r.steps, tail: r.tail, test: r.test, dry: r.dry, url: r.url, note: r.note, endAt: now, who: s(who, 80) };
    await ref.set(doc, { merge: true });
    try { /* 최근 요약 한 문서 — 진단·웹앱이 문서 하나만 읽게 */
      const lr = C('app_settings').doc('cloudbuild_last'); const d = (await lr.get()).data() || {};
      const full = (await ref.get()).data() || doc;
      const sum = { id: r.id, sha: (full.sha || '').slice(0, 12), ver: full.ver || '', via: full.via || '', st: full.st || '', fail: full.fail || '', warn: full.warn || [], test: full.test || '', dry: !!full.dry, startAt: full.startAt || '', endAt: full.endAt || '', last: (full.tail || []).slice(-3) };
      const list = [sum, ...(Array.isArray(d.list) ? d.list : []).filter((y) => y && y.id !== r.id)].slice(0, 30);
      await lr.set({ last: sum, list, at: now }, { merge: false });
    } catch (e) { log('☁ Cloud Build 요약 쓰기 실패', e.message); }
    log(`☁ Cloud Build ${r.ev === 'start' ? '시작' : '끝'} ${r.id.slice(0, 8)} ${r.st}${r.fail ? ' · 실패 단계 ' + r.fail : ''}${r.test ? ' · 시험 ' + r.test : ''}`);
    return { ok: true, id: r.id, st: r.st };
  }
  /* 진단 cbuild=1(최근 요약 + 마지막 빌드 전체) · cbuild=<빌드 번호>(그 빌드 전체) */
  async function diag(q) {
    const v = String(q.cbuild || '1'); const out = {};
    if (v === 'api') { try { out.api = await apiList(q.n); } catch (e) { out.api = { err: e.message }; } return out; }
    if (v === 'log') { try { out.log = await apiLog(q.id, q.n); } catch (e) { out.log = { err: e.message }; } return out; }
    const d = (await C('app_settings').doc('cloudbuild_last').get()).data() || {};
    const now = Date.now();
    out.list = (d.list || []).map((x) => ({ ...x, noEnd: !x.endAt && x.startAt && now - Date.parse(x.startAt) > 40 * 6e4 ? true : undefined }));
    out.at = d.at || null;
    const id = /^[0-9a-f-]{20,64}$/.test(v) ? v : (d.last && d.last.id);
    if (id) { let r = (await C(COL).doc(id).get()).data(); if (r && r.j && !r.endAt) { try { r = { ...r, ...JSON.parse(r.j), direct: '클라우드 /cb-in이 못 받아 빌드가 Firestore에 직접 넣음' }; delete r.j; } catch (e) {} } out.run = r || null; if (r && !r.endAt && r.startAt && now - Date.parse(r.startAt) > 40 * 6e4) out.run.noEnd = '시작 보고만 있고 40분 넘게 끝 보고가 없음 — 빌드 시간 넘김이나 기계가 죽은 것(구글 콘솔 Cloud Build › 기록에서 확인)'; }
    return out;
  }
  return { put, diag };
}
module.exports = { makeCbuild, mask, norm };
