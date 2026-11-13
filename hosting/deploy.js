#!/usr/bin/env node
/* 🌐 Firebase Hosting 올리기 — firebase-tools 설치 없이 Hosting REST API로 (11/10 · 1단계)
 *  쓰임: HOSTING_TOKEN=<구글 접근 토큰> node hosting/deploy.js [올릴 폴더=.hosting/public] [사이트=firebase.json의 site]
 *    · 토큰은 자동 작업(GitHub Actions)이 OIDC로 받은 1회용(gcloud auth print-access-token) — 저장소·출력에 남기지 않음
 *    · HOSTING_DRY=1 → 올리지 않고 파일 수·지문만 셈 · HOSTING_API=<주소> → 시험용 가짜 서버
 *  흐름: 새 판(version) 만들기(firebase.json의 headers를 설정으로) → 파일 지문(gzip의 SHA-256) 알림 → 서버가 '없다'고 한 파일만 올림 → 판 닫기 → 내보내기(release)
 *  · gzip 머리의 시각이 0이라 같은 파일은 늘 같은 지문 → 바뀐 파일만 올라감(설명서 보관본 100MB+를 매번 다시 올리지 않음)
 *  · 준비 전(Hosting 권한·사이트 없음 = 403/404)이면 경고만 하고 0으로 끝냄(HOSTING_STRICT=1이면 실패로) — 지금 GitHub 쪽 배포에는 영향 없음 */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const API = (process.env.HOSTING_API || 'https://firebasehosting.googleapis.com').replace(/\/$/, '');
const TOKEN = process.env.HOSTING_TOKEN || '';
/* (11/11 shop1) HOSTING_CONF=<설정 json> → 그 설정(site·headers)으로 — 우리숍 둘째 사이트(hosting/shop.json) · 없으면 예전처럼 firebase.json */
const fbj = process.env.HOSTING_CONF ? JSON.parse(fs.readFileSync(path.resolve(ROOT, process.env.HOSTING_CONF), 'utf8')) : JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8')).hosting;

/* firebase.json의 headers([{source, headers:[{key,value}]}]) → REST 설정([{glob, headers:{키:값}}]) */
/* (url2 11/13) headers에 regex(폴더 주소 /app/ 처럼 파일 이름이 없는 주소) · redirects(옛 경로 /readnow-scripts/… → 새 경로 · ?go=… 그대로)도 넘김 */
const pat = (x) => (x.regex ? { regex: x.regex } : { glob: x.source });
const restConfig = (h = fbj) => ({ headers: (h.headers || []).map((x) => ({ ...pat(x), headers: Object.fromEntries((x.headers || []).map((k) => [k.key, k.value])) })),
  ...((h.redirects || []).length ? { redirects: h.redirects.map((x) => ({ ...pat(x), statusCode: x.type || 301, location: x.destination })) } : {}),
  /* (11/11 shop2) rewrites [{source, run:{serviceId, region}}] → REST [{glob, run}] — 우리숍 검색 주소(/b/**·sitemap)만 · 관리 사이트(firebase.json)엔 없어 예전과 같음 */
  ...((h.rewrites || []).length ? { rewrites: h.rewrites.filter((x) => x && x.source && x.run && x.run.serviceId).map((x) => ({ glob: x.source, run: { serviceId: x.run.serviceId, region: x.run.region || 'asia-northeast3' } })) } : {}) });

/* (11/12 shopsrv) 넘김 대상 서비스 확인 — rewrite에 run.probe(그 서비스의 /healthz 주소)·run.fallback(대신 쓸 서비스)이 있으면, probe가 200 JSON이고 srv가 그 서비스 이름일 때만 그대로 · 아니면 fallback으로
 *  까닭: 숍 전용 서비스(readnow-shop)가 아직 없거나 공개(allUsers 호출 허락)가 안 됐는데 Hosting이 그리로 넘기면 booksqueen.com 숍이 멎음 → 그땐 원래 서비스(readnow-cloud)로 · RUN_WAIT_S초까지 기다려 봄(처음 배포 동안) */
async function resolveRuns(h, o = {}) { const f = o.fetch || fetch; const waitS = o.waitS == null ? +(process.env.RUN_WAIT_S || 0) : o.waitS; const step = o.stepMs || 20000; const memo = new Map(); const notes = [];
  const alive = async (u, sv) => { if (memo.has(u)) return memo.get(u); const t0 = Date.now(); let ok = false, why = '';
    for (;;) { try { const r = await f(u, { signal: AbortSignal.timeout(15000) }); let j = null; try { j = await r.json(); } catch (e) {} ok = r.status === 200 && !!j && j.srv === sv; why = ok ? '' : 'HTTP ' + r.status + (j && j.srv ? ' srv=' + j.srv : ''); } catch (e) { why = String(e.message || e).slice(0, 80); }
      if (ok || Date.now() - t0 + step > waitS * 1000) break; await new Promise((z) => setTimeout(z, step)); }
    memo.set(u, { ok, why }); return memo.get(u); };
  const rw = []; for (const x of h.rewrites || []) { if (!(x && x.run && x.run.probe && x.run.fallback)) { rw.push(x); continue; }
    const a = await alive(x.run.probe, x.run.serviceId); if (a.ok) { rw.push(x); notes.push(`${x.source} → ${x.run.serviceId}`); } else { rw.push({ ...x, run: { ...x.run, serviceId: x.run.fallback } }); notes.push(`${x.source} → ${x.run.fallback} (대신 · ${x.run.serviceId} ${a.why})`); } }
  return { conf: { ...h, rewrites: rw }, notes, fellBack: notes.some((n) => n.includes('(대신')) }; }

function walk(dir, rel = '', out = []) {
  for (const n of fs.readdirSync(dir).sort()) { const p = path.join(dir, n), r = rel + '/' + n; const st = fs.statSync(p); if (st.isDirectory()) walk(p, r, out); else out.push({ path: r, abs: p }); }
  return out;
}
/* 파일 → {'/경로': 지문} · 지문 = gzip(내용)의 SHA-256(16진) — Hosting이 요구하는 꼴 */
function hashFiles(dir) {
  const files = {}, blobs = {};
  for (const f of walk(dir)) { const gz = zlib.gzipSync(fs.readFileSync(f.abs), { level: 9 }); const h = crypto.createHash('sha256').update(gz).digest('hex'); files[f.path] = h; blobs[h] = gz; }
  return { files, blobs };
}

async function call(method, url, body, raw) {
  const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + TOKEN, ...(raw ? { 'Content-Type': 'application/octet-stream' } : body ? { 'Content-Type': 'application/json' } : {}) }, body: raw || (body ? JSON.stringify(body) : undefined) });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : {}; } catch (e) {}
  if (!r.ok) { const e = new Error(`${method} ${url.replace(API, '')} → HTTP ${r.status} ${(j && j.error && j.error.message) || t.slice(0, 200)}`); e.status = r.status; throw e; }
  return j || {};
}

async function deploy(dir, site, opt = {}) {
  const { files, blobs } = hashFiles(dir); const n = Object.keys(files).length;
  if (!n) throw new Error('올릴 파일이 없음: ' + dir);
  if (opt.dry) return { dry: true, files: n, blobs: Object.keys(blobs).length };
  const v = await call('POST', `${API}/v1beta1/sites/${site}/versions`, { config: restConfig(opt.conf || fbj) });
  const vn = v.name; if (!vn) throw new Error('새 판 이름을 못 받음');
  const keys = Object.keys(files); let need = new Set(), upUrl = null;
  for (let i = 0; i < keys.length; i += 1000) { /* 한 번에 1,000개씩 */
    const part = Object.fromEntries(keys.slice(i, i + 1000).map((k) => [k, files[k]]));
    const r = await call('POST', `${API}/v1beta1/${vn}:populateFiles`, { files: part });
    (r.uploadRequiredHashes || []).forEach((h) => need.add(h)); upUrl = r.uploadUrl || upUrl;
  }
  let up = 0; const hs = [...need];
  for (let i = 0; i < hs.length; i += 6) await Promise.all(hs.slice(i, i + 6).map(async (h) => { if (!blobs[h]) throw new Error('서버가 모르는 지문을 요구: ' + h); await call('POST', `${upUrl}/${h}`, null, blobs[h]); up++; }));
  await call('PATCH', `${API}/v1beta1/${vn}?update_mask=status`, { status: 'FINALIZED' });
  const rel = await call('POST', `${API}/v1beta1/sites/${site}/releases?versionName=${encodeURIComponent(vn)}`, { message: opt.msg || '' });
  return { version: vn, release: rel.name || null, files: n, uploaded: up };
}

module.exports = { deploy, hashFiles, restConfig, resolveRuns };
if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(ROOT, '.hosting', 'public')); const site = process.argv[3] || fbj.site;
  const dry = process.env.HOSTING_DRY === '1';
  if (!dry && !TOKEN) { console.log('::warning::HOSTING_TOKEN 없음 — Hosting 올리기를 건너뜀'); process.exit(0); }
  resolveRuns(fbj).then((R) => { for (const n of R.notes) console.log((R.fellBack && n.includes('(대신') ? '::warning::' : '') + '🔀 넘김 ' + n); return deploy(dir, site, { dry, conf: R.conf, msg: (process.env.GITHUB_SHA || '').slice(0, 12) }); }).then((r) => {
    console.log(r.dry ? `🌐 (시험) 파일 ${r.files}개 · 다른 내용 ${r.blobs}개` : `🌐 Hosting 올림: 파일 ${r.files}개 중 바뀐 ${r.uploaded}개 업로드 · ${r.version}`);
  }).catch((e) => {
    if ((e.status === 403 || e.status === 404) && process.env.HOSTING_STRICT !== '1') { console.log('::warning::Firebase Hosting 준비 전(권한·사이트 없음) — 건너뜀: ' + e.message + ' · Cloud Shell에서 hosting/setup-hosting.sh를 한 번 실행하면 됩니다'); process.exit(0); }
    console.log('::error::' + e.message); process.exit(1);
  });
}
