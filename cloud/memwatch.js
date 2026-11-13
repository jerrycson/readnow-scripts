/* 🩺 클라우드 메모리 감시 · 다시 뜬 까닭 찾기 (voice2 · 11/12)
 *  왜: 11/12 08:31Z·08:40Z 배포 없이 클라우드가 다시 뜸 — 뜬 뒤 2분 힙 144MB → 3분 484MB → 8분 960MB(한도 근처)에서 죽고 다시 뜨는 고리.
 *       console 기록(Cloud Logging)은 사람·Claude가 못 봐 무엇이 메모리를 먹었는지 몰랐음
 *  하는 일: ① 20초마다 메모리·처리 중 요청(주소 앞부분)·바쁜 일 이름을 표본으로 모음 ② 1분마다(힙이 높으면 20초마다) app_settings/cloud_mem에 남김
 *           ③ 뜰 때 앞 판의 마지막 표본을 cloud_mem.boots(최근 8번)로 옮김 → 죽기 직전 무엇이 돌았는지 다음 판이 봄
 *           ④ 진단 clog=<분>: Cloud Logging에서 이 서비스 기록(메모리 넘침·시작·오류 줄)을 읽음(실행 계정 토큰 · 읽기만)
 *  고객 정보 없음 — 주소는 앞 두 칸(/diag·/shop/x)만, 쿼리·몸은 안 남김 */
'use strict';
const v8 = require('v8'); const fs = require('fs');
/* (cloudmem 11/13 둘째) 📦 컨테이너 전체 메모리 — Cloud Run 2GiB 한도는 node 혼자가 아니라 크롬(puppeteer · 그려 읽기·알라딘 화면) 프로세스까지 합친 것.
 *  11/13 01:22Z 판매자 배우기 시험 때 node rss 635MB인데 컨테이너가 2061MB로 죽음 → node rss만 보던 감시는 나머지 1.4GB(크롬 쪽)를 못 봤음
 *  cg = cgroup이 센 컨테이너 사용량(있으면) · kids = node 밖 프로세스(크롬) RSS 합·수(/proc · 공유 쪽이 겹쳐 셀 수 있어 위쪽 어림) */
const CG_FILES = ['/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory/memory.usage_in_bytes']; let CG_OK = null;
function cgMB() { const L = CG_OK ? [CG_OK] : CG_FILES; for (const p of L) { try { const v = +fs.readFileSync(p, 'utf8').trim(); if (Number.isFinite(v) && v > 0) { CG_OK = p; return Math.round(v / 1048576); } } catch (e) {} } return null; }
function kidsMB() { let s = 0, n = 0; try { for (const d of fs.readdirSync('/proc')) { if (!/^\d+$/.test(d) || +d === process.pid || +d === 1 && process.pid !== 1) continue; try { const t = fs.readFileSync('/proc/' + d + '/statm', 'utf8').split(' '); const r = +t[1] * 4096; if (r > 0) { s += r; n++; } } catch (e) {} } } catch (e) { return null; } return { mb: Math.round(s / 1048576), n }; }
/* 지금 컨테이너가 쓰는 메모리 어림(MB) — cgroup이 있으면 그 값 · 없으면 node rss + 크롬 rss 합 */
function contMB(withKids) { const c = cgMB(); if (c != null) return c; const r = Math.round(process.memoryUsage.rss() / 1048576); if (!withKids) return r; const k = kidsMB(); return r + ((k && k.mb) || 0); }
function makeMemWatch(dep) { const { C, log, ver } = dep; const busyOf = dep.busyOf || (() => []); const MB = (x) => Math.round(x / 1048576);
  const S = { boot: new Date().toISOString(), s: [], inf: new Map(), hits: new Map(), hiAt: 0, lastPut: 0, prevDone: false, peak: { heap: 0, rss: 0, at: null } };
  const limitMB = (() => { try { return MB(v8.getHeapStatistics().heap_size_limit); } catch (e) { return null; } })();
  const key = (p) => String(p || '/').split('?')[0].split('/').slice(0, 3).join('/').slice(0, 40);
  /* 요청 시작·끝 — 처리 중인 주소 수와 5분 동안 부른 수 */
  function reqStart(p) { const k = key(p); S.inf.set(k, (S.inf.get(k) || 0) + 1); S.hits.set(k, (S.hits.get(k) || 0) + 1); let dn = false; return () => { if (dn) return; dn = true; const n = (S.inf.get(k) || 1) - 1; if (n > 0) S.inf.set(k, n); else S.inf.delete(k); }; }
  function sample() { const m = process.memoryUsage(); const x = { t: new Date().toISOString().slice(11, 19), up: Math.round(process.uptime()), rss: MB(m.rss), heap: MB(m.heapUsed), tot: MB(m.heapTotal), ext: MB(m.external), ab: MB(m.arrayBuffers || 0), cg: cgMB(), kid: (() => { const k = kidsMB(); return k ? k.mb + '/' + k.n : null; })(), inf: Object.fromEntries([...S.inf].slice(0, 8)), busy: busyOf().slice(0, 12) };
    S.s.push(x); if (S.s.length > 45) S.s.shift(); if (x.heap > S.peak.heap) S.peak = { heap: x.heap, rss: x.rss, at: x.t, busy: x.busy, inf: x.inf }; return x; }
  function snap() { const top = [...S.hits].sort((a, b) => b[1] - a[1]).slice(0, 12); return { boot: S.boot, ver, rev: process.env.K_REVISION || null, upMin: Math.round(process.uptime() / 60), limitMB, peak: S.peak, rssPeak: S.rssPeak, spikes: S.spikes.slice(-8), s: S.s.slice(-15), hits5: Object.fromEntries(top), at: new Date().toISOString() }; }
  async function put(force) { const now = Date.now(); const last = S.s[S.s.length - 1]; const hi = last && limitMB && last.heap > limitMB * 0.6; if (!force && now - S.lastPut < (hi ? 20e3 : 60e3)) return; S.lastPut = now;
    const ref = C('app_settings').doc('cloud_mem');
    if (!S.prevDone) { S.prevDone = true; try { const p = (await ref.get()).data() || null; const boots = ((p && p.boots) || []).slice(0, 7); if (p && p.boot && p.boot !== S.boot) boots.unshift({ boot: p.boot, ver: p.ver || null, rev: p.rev || null, lastAt: p.at || null, upMin: p.upMin, limitMB: p.limitMB || null, peak: p.peak || null, rssPeak: p.rssPeak || null, spikes: (p.spikes || []).slice(-4), tail: (p.s || []).slice(-6), hits5: p.hits5 || null }); await ref.set({ ...snap(), boots, writer: 'cloud' }); log('🩺 메모리 감시 시작 — 앞 판 마지막', boots[0] ? `${boots[0].lastAt} 힙 ${(boots[0].tail.slice(-1)[0] || {}).heap}MB · 바쁜 일 ${JSON.stringify((boots[0].tail.slice(-1)[0] || {}).busy || [])}` : '없음'); return; } catch (e) { log('🩺 메모리 감시 앞 판 읽기 실패', e.message); } }
    try { await ref.set({ ...snap(), writer: 'cloud' }, { merge: true }); } catch (e) {} if (S.hits.size && now - S.hitsAt > 5 * 60e3) { S.hits.clear(); S.hitsAt = now; } }
  S.hitsAt = Date.now();
  /* (cloudmem 11/13) ⚡ 급등 잡기 — 11/12 22:50Z rss 433MB(20초 표본) → 9초 뒤 2GB 넘어 죽어 무엇이 먹었는지 표본에 안 남음 · 2초마다 rss만 봄(가벼움) · 900MB 넘고 앞서 남긴 것보다 150MB 더 오르면 바로 표본 + Cloud Logging 한 줄 + 문서(spike) · dep.onFast(rss)로 일마다 최고 rss를 셈 */
  S.fastHi = 0; S.spikes = []; S.rssPeak = { rss: 0, at: null, busy: [] };
  function fast() { const nr = MB(process.memoryUsage.rss ? process.memoryUsage.rss() : process.memoryUsage().rss); const cg = (dep.cgMB || cgMB)(); const r = cg != null ? Math.max(cg, nr) : nr; try { if (dep.onFast) dep.onFast(r); } catch (e) {} if (r > S.rssPeak.rss) S.rssPeak = { rss: r, node: nr, cg, at: new Date().toISOString().slice(11, 19), busy: busyOf().slice(0, 12) };
    if (r < 700) S.fastHi = 0; if (r < (dep.spikeMB || 900) || r < S.fastHi + 150) return; S.fastHi = r; const x = sample(); const sp = { t: x.t, rss: x.rss, heap: x.heap, ext: x.ext, ab: x.ab, busy: x.busy, inf: x.inf }; S.spikes.push(sp); if (S.spikes.length > 12) S.spikes.shift();
    sp.cont = r; const line = `🩺 메모리 급등 컨테이너 ${r}MB · node rss ${x.rss}MB · 힙 ${x.heap}MB · 바깥 ${x.ext}MB · 크롬 ${x.kid} · 바쁜 일 ${JSON.stringify(x.busy)} · 처리 중 ${JSON.stringify(x.inf)}`; try { (dep.write || ((l) => fs.writeSync(1, l)))(new Date().toISOString() + ' ' + line + '\n'); } catch (e) { log(line); } put(true).catch(() => {}); } /* 동기 쓰기 — console은 파이프에 늦게 써서 곧 죽으면 줄이 사라짐 */
  function start() { const tf = setInterval(() => { try { fast(); } catch (e) {} }, dep.fastMs || 2000); if (tf.unref) tf.unref(); const t = setInterval(() => { try { const x = sample(); if (limitMB && x.heap > limitMB * 0.75 && Date.now() - S.hiAt > 60e3) { S.hiAt = Date.now(); log(`🩺 힙 높음 ${x.heap}/${limitMB}MB · rss ${x.rss}MB · 바쁜 일 ${JSON.stringify(x.busy)} · 처리 중 ${JSON.stringify(x.inf)}`); } put(false).catch(() => {}); } catch (e) {} }, 20e3); if (t.unref) t.unref(); setTimeout(() => { try { sample(); put(true).catch(() => {}); } catch (e) {} }, 5e3); }
  return { start, reqStart, sample, snap, limitMB, _put: put, _fast: fast, _S: S };
}
/* 진단 clog — Cloud Logging 읽기(이 서비스만 · 기본: 경고 이상 + 시작·메모리·종료 줄) · opt { mins, from, to, q(글), all(모든 줄), n } */
async function readCloudLog(opt, dep) { const { gToken } = dep; const md = async (p0) => { const r = await fetch('http://metadata.google.internal/computeMetadata/v1/' + p0, { headers: { 'Metadata-Flavor': 'Google' } }); return r.ok ? (await r.text()).trim() : null; };
  const pj = await md('project/project-id'); const svc = process.env.K_SERVICE || 'readnow-cloud'; if (!pj) return { err: '프로젝트 모름(클라우드 밖)' };
  const mins = Math.max(1, Math.min(7 * 1440, +opt.mins || 60)); const to = opt.to ? new Date(opt.to) : new Date(); const from = opt.from ? new Date(opt.from) : new Date(to.getTime() - mins * 60e3);
  const qs = String(opt.q || '').replace(/["\\]/g, '').slice(0, 80);
  const base = `resource.type="cloud_run_revision" AND resource.labels.service_name="${svc}" AND timestamp>="${from.toISOString()}" AND timestamp<="${to.toISOString()}"`;
  const pick = opt.all ? '' : qs ? ` AND (textPayload:"${qs}" OR jsonPayload.message:"${qs}")` : ' AND (severity>=WARNING OR textPayload:"Memory limit" OR textPayload:"heap" OR textPayload:"시작" OR textPayload:"멈춤" OR textPayload:"SIGTERM" OR textPayload:"🩺" OR logName:"varlog%2Fsystem" OR logName:"cloudaudit")';
  const r = await fetch('https://logging.googleapis.com/v2/entries:list', { method: 'POST', headers: { Authorization: 'Bearer ' + (await gToken()), 'Content-Type': 'application/json' }, body: JSON.stringify({ resourceNames: ['projects/' + pj], filter: base + pick, orderBy: 'timestamp desc', pageSize: Math.max(10, Math.min(500, +opt.n || 200)) }) });
  if (!r.ok) return { err: 'HTTP ' + r.status + ' ' + String(await r.text()).slice(0, 200) + ' (실행 계정에 로그 보기 권한이 없을 수 있음)' };
  const j = await r.json(); const L = (j.entries || []).map((e) => { const txt = e.textPayload || (e.jsonPayload && (e.jsonPayload.message || JSON.stringify(e.jsonPayload))) || (e.protoPayload && ((e.protoPayload.status && e.protoPayload.status.message) || e.protoPayload.methodName)) || ''; return { t: e.timestamp, sev: e.severity || null, log: String(e.logName || '').split('/').pop().replace(/%2F/g, '/').slice(0, 40), rev: (e.resource && e.resource.labels && e.resource.labels.revision_name) || null, inst: e.labels && e.labels.instanceId ? String(e.labels.instanceId).slice(-8) : null, x: String(txt).replace(/\s+/g, ' ').slice(0, 400) }; });
  return { from: from.toISOString(), to: to.toISOString(), n: L.length, more: !!j.nextPageToken, rows: L.reverse() }; }
module.exports = { makeMemWatch, readCloudLog, cgMB, kidsMB, contMB };
