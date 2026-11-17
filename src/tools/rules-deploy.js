#!/usr/bin/env node
// Firestore 규칙 배포 도구(wguard2 11/18 · 리드 결정 F57) — firestore/firestore.rules → 운영(readnow-3a385)
//  · 직원 계정 목록은 공개 저장소에 없음: 지금 배포된 규칙에서 목록 줄을 그대로 읽어 '__STAFF_EMAILS__' 자리에 채움(디스크에 남기지 않음)
//  · 순서: ① 배포된 규칙 읽기 → ② 채운 새 규칙과 견줌(바뀐 줄 보임 · 목록은 가림) → ③ --deploy일 때만, 그리고
//    firestore/rules.test.js(에뮬레이터 시험)를 이 자리에서 다시 돌려 통과해야만 새 ruleset 만들기 + cloud.firestore 풀이를 그것으로 바꿈
//  · 옛 ruleset은 지우지 않음(되돌리기 = 옛 이름으로 풀이만 다시 바꿈 · 끝에 옛 이름을 찍음)
//  · 권한: firebaserules.rulesets.create·releases.update(역할 Firebase Rules Admin)가 있는 토큰 — RN_GTOKEN 또는 `gcloud auth print-access-token`
// 쓰기: node src/tools/rules-deploy.js [--live <배포된 규칙 원문 파일>]   (보기만 — 바뀐 줄)
//       RULES_NODE_MODULES=<에뮬레이터 도구 node_modules> node src/tools/rules-deploy.js --deploy
const fs = require('fs'); const path = require('path'); const { execFileSync, spawnSync } = require('child_process');
const PROJECT = process.env.RN_FB_PROJECT || 'readnow-3a385'; const API = 'https://firebaserules.googleapis.com/v1';
const ROOT = path.join(__dirname, '..', '..'); const SRC = path.join(ROOT, 'firestore', 'firestore.rules');
const token = () => process.env.RN_GTOKEN || execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const mask = (s) => s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '<계정>');
async function call(tk, method, url, body) { const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); if (!r.ok) throw new Error(`${method} ${url.replace(API, '')} → ${r.status} ${mask(t).slice(0, 300)}`); return t ? JSON.parse(t) : {}; }
(async () => {
  const deploy = process.argv.includes('--deploy'); const li = process.argv.indexOf('--live'); const liveFile = li > 0 ? process.argv[li + 1] : '';
  if (deploy && liveFile) throw new Error('--deploy는 --live 파일 없이(배포된 것을 바로 읽어서)만');
  let tk = '', oldName = '파일 ' + path.basename(liveFile || ''), liveSrc = '';
  if (liveFile) liveSrc = fs.readFileSync(liveFile, 'utf8'); /* 보기만 — 진단(dg 'access=1')으로 받은 배포된 규칙 원문(임시 폴더 · 저장소에 두지 않음) */
  else { tk = token(); const rel = await call(tk, 'GET', `${API}/projects/${PROJECT}/releases/cloud.firestore`); oldName = rel.rulesetName;
    const rs = await call(tk, 'GET', `${API}/${oldName}`); const live = ((rs.source || {}).files || [])[0] || {}; liveSrc = String(live.content || ''); }
  const m = liveSrc.match(/request\.auth\.token\.email in \[([\s\S]*?)\]/); if (!m) throw new Error('배포된 규칙에서 직원 목록 줄을 못 찾음 — 멈춤');
  const emails = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]); if (!emails.length) throw new Error('직원 목록이 비어 있음 — 멈춤');
  const tpl = fs.readFileSync(SRC, 'utf8'); if (!tpl.includes("'__STAFF_EMAILS__'")) throw new Error('원본에 자리 표시가 없음 — 멈춤');
  const next = tpl.replace("'__STAFF_EMAILS__'", emails.map((e) => `'${e}'`).join(',\n          '));
  console.log(`배포된 규칙: ${oldName.split('/').pop()} · 직원 ${emails.length}명(가림)`);
  const a = liveSrc.split('\n').map((x) => x.trim()).filter(Boolean); const b = next.split('\n').map((x) => x.trim()).filter(Boolean);
  const A = new Set(a), B = new Set(b); const gone = a.filter((x) => !B.has(x)), added = b.filter((x) => !A.has(x));
  console.log(`빠지는 줄 ${gone.length}:`); gone.forEach((x) => console.log('  - ' + mask(x))); console.log(`더하는 줄 ${added.length}:`); added.forEach((x) => console.log('  + ' + mask(x)));
  if (!deploy) { console.log('보기만 함(--deploy 없음) — 배포 안 함'); return; }
  const t = spawnSync(process.execPath, [path.join(ROOT, 'firestore', 'rules.test.js')], { stdio: 'inherit', env: process.env });
  if (t.status !== 0) throw new Error('에뮬레이터 시험이 통과하지 않아 배포 안 함');
  const made = await call(tk, 'POST', `${API}/projects/${PROJECT}/rulesets`, { source: { files: [{ name: 'firestore.rules', content: next }] } });
  await call(tk, 'PATCH', `${API}/projects/${PROJECT}/releases/cloud.firestore`, { release: { name: `projects/${PROJECT}/releases/cloud.firestore`, rulesetName: made.name } });
  console.log(`✅ 배포함: ${made.name.split('/').pop()} · 되돌리기 = 풀이를 옛 ${oldName.split('/').pop()}로(옛 것 지우지 않음)`);
})().catch((e) => { console.log('❌', mask(String(e && e.message))); process.exit(1); });
